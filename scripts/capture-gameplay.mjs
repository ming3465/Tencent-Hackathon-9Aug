/**
 * Records raw gameplay footage of the judge path for the demo video.
 *
 * Drives the production bundle in headless Chrome over CDP, captures the page
 * with Page.startScreencast, and encodes the frames to MP4 with ffmpeg. The
 * result is silent B-roll to cut and narrate over — it is NOT a finished
 * submission video, and it deliberately follows the beat order in
 * docs/WINNING_PLAYBOOK.md §4 so the clips land in the edit in sequence.
 *
 * Usage:
 *   node scripts/capture-gameplay.mjs                       # builds nothing; starts its own preview
 *   node scripts/capture-gameplay.mjs --url http://... --out docs/video
 *
 * Requires Node 22+, Chrome, and ffmpeg on PATH.
 */

import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const args = process.argv.slice(2);
const readFlag = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1];
};

const APP_URL = readFlag("url", "http://127.0.0.1:4173/");
const OUT_DIR = readFlag("out", "docs/video");
const PORT = Number(readFlag("port", "9250"));
const FPS = Number(readFlag("fps", "20"));
const WIDTH = 1280;
const HEIGHT = 720;

const demoUrl = () => {
  const url = new URL(APP_URL);
  url.searchParams.set("demo", "1");
  return url.href;
};

class Cdp {
  #socket;
  #id = 0;
  #pending = new Map();
  #listeners = new Set();

  constructor(socket) {
    this.#socket = socket;
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.#pending.has(message.id)) {
        const { resolve, reject, timeout } = this.#pending.get(message.id);
        this.#pending.delete(message.id);
        clearTimeout(timeout);
        message.error
          ? reject(new Error(JSON.stringify(message.error)))
          : resolve(message.result);
        return;
      }
      for (const listener of this.#listeners) listener(message);
    });
  }

  static async connect(wsUrl) {
    const socket = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", reject, { once: true });
    });
    return new Cdp(socket);
  }

  on(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  send(method, params = {}, sessionId) {
    const id = ++this.#id;
    const message = sessionId
      ? { id, method, params, sessionId }
      : { id, method, params };
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!this.#pending.delete(id)) return;
        reject(new Error(`CDP command timed out: ${method}`));
      }, 30_000);
      this.#pending.set(id, { resolve, reject, timeout });
      this.#socket.send(JSON.stringify(message));
    });
  }

  close() {
    for (const { timeout } of this.#pending.values()) clearTimeout(timeout);
    this.#pending.clear();
    this.#socket.close();
  }
}

class Session {
  constructor(cdp, sessionId) {
    this.cdp = cdp;
    this.sessionId = sessionId;
  }

  send(method, params = {}) {
    return this.cdp.send(method, params, this.sessionId);
  }

  async eval(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) {
      throw new Error(
        result.exceptionDetails.exception?.description ?? "evaluate failed"
      );
    }
    return result.result.value;
  }

  async key(type, key, code, keyCode) {
    await this.send("Input.dispatchKeyEvent", {
      type,
      key,
      code,
      windowsVirtualKeyCode: keyCode,
      nativeVirtualKeyCode: keyCode,
    });
  }

  async tap(selector) {
    const ok = await this.eval(`
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return false;
        el.click();
        return true;
      })()
    `);
    if (!ok) throw new Error(`Nothing to click for ${selector}`);
  }
}

async function ensureServer(url) {
  try {
    await fetch(url);
    return null;
  } catch {
    // start our own
  }
  const port = new URL(url).port || "4173";
  const server = spawn(
    "node_modules/.bin/vite",
    ["preview", "--port", port, "--strictPort", "--host", "127.0.0.1"],
    { stdio: "ignore" }
  );
  for (let attempt = 0; attempt < 60; attempt += 1) {
    await sleep(500);
    try {
      await fetch(url);
      return server;
    } catch {
      // keep waiting
    }
  }
  server.kill();
  throw new Error(`Could not start a preview server on ${url}`);
}

const server = await ensureServer(APP_URL);
const profileDir = await mkdtemp(join(tmpdir(), "kampung-video-"));
const frameDir = await mkdtemp(join(tmpdir(), "kampung-frames-"));
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--window-size=${WIDTH},${HEIGHT}`,
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
    `--user-data-dir=${profileDir}`,
    "--autoplay-policy=no-user-gesture-required",
    "about:blank",
  ],
  { stdio: "ignore" }
);

let cdp;
let frameIndex = 0;
const beats = [];
const markBeat = (label) => {
  beats.push({ label, frame: frameIndex, second: (frameIndex / FPS).toFixed(1) });
  console.log(`  BEAT  ${label} @ ${(frameIndex / FPS).toFixed(1)}s`);
};

try {
  await mkdir(OUT_DIR, { recursive: true });

  let version;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      version = await (
        await fetch(`http://127.0.0.1:${PORT}/json/version`)
      ).json();
      break;
    } catch {
      await sleep(250);
    }
  }
  if (!version) throw new Error("Chrome did not expose a debugging endpoint");

  cdp = await Cdp.connect(version.webSocketDebuggerUrl);
  const { targetId } = await cdp.send("Target.createTarget", {
    url: "about:blank",
  });
  const { sessionId } = await cdp.send("Target.attachToTarget", {
    targetId,
    flatten: true,
  });
  const page = new Session(cdp, sessionId);
  await page.send("Page.enable");
  await page.send("Runtime.enable");
  await page.send("Emulation.setDeviceMetricsOverride", {
    width: WIDTH,
    height: HEIGHT,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await page.send("Page.navigate", { url: demoUrl() });
  await sleep(2600);

  // Every screencast frame must be acknowledged or Chrome stops sending more.
  cdp.on((message) => {
    if (message.method !== "Page.screencastFrame") return;
    if (message.sessionId !== sessionId) return;
    const { data, sessionId: ackId } = message.params;
    const name = join(frameDir, `f${String(frameIndex).padStart(6, "0")}.jpg`);
    frameIndex += 1;
    writeFile(name, Buffer.from(data, "base64")).catch(() => {});
    cdp
      .send("Page.screencastFrameAck", { sessionId: ackId }, sessionId)
      .catch(() => {});
  });

  const hold = async (ms) => sleep(ms);
  const walk = async (key, code, keyCode, ms) => {
    await page.eval(`document.getElementById("sandbox-stage")?.focus()`);
    await page.key("keyDown", key, code, keyCode);
    await sleep(ms);
    await page.key("keyUp", key, code, keyCode);
  };
  const readDialogue = async (maxLines = 6) => {
    for (let line = 0; line < maxLines; line += 1) {
      await sleep(1500);
      const advanced = await page.eval(`
        (() => {
          const button = document.getElementById("btn-dialog-advance");
          if (!button || !button.classList.contains("visible")) return false;
          button.click();
          return true;
        })()
      `);
      if (!advanced) return;
    }
  };

  await page.send("Page.startScreencast", {
    format: "jpeg",
    quality: 92,
    maxWidth: WIDTH,
    maxHeight: HEIGHT,
    everyNthFrame: 1,
  });

  markBeat("title screen (0-5s cold open)");
  await hold(3200);

  await page.tap("#btn-start");
  await sleep(2200);
  markBeat("prologue - Y's flat");
  await hold(1800);

  await page.tap("#btn-interact");
  await sleep(900);
  markBeat("first conversation - the Voice");
  await readDialogue();
  await sleep(900);

  // A choice is the hook: the world visibly responds to a kind decision.
  const chose = await page.eval(`
    (() => {
      const choice = document.querySelector("#dialog-choices .choice-button");
      if (!choice) return false;
      choice.click();
      return true;
    })()
  `);
  if (chose) {
    markBeat("player choice");
    await readDialogue();
  }
  await page.eval(`document.getElementById("btn-dialog-close")?.click()`);
  await sleep(700);

  const area = () =>
    page.eval(`document.getElementById("area-name")?.textContent ?? ""`);
  const interact = async () => {
    await page.key("keyDown", "e", "KeyE", 69);
    await sleep(110);
    await page.key("keyUp", "e", "KeyE", 69);
    await sleep(950);
  };

  // Out of the flat, down the corridor, and into the estate — the exterior is
  // the footage the edit actually needs.
  markBeat("leaving the flat");
  await walk("ArrowDown", "ArrowDown", 40, 340);
  await walk("ArrowLeft", "ArrowLeft", 37, 500);
  await hold(400);
  await interact();
  if (!/corridor/i.test(await area())) {
    throw new Error(`Expected the corridor, got "${await area()}"`);
  }

  markBeat("Block 9 corridor");
  await hold(1300);
  // Coming from Y's flat the player spawns at the #09-101 door (x=150, y=390);
  // the lift down to the estate sits at (480, 555). Cover that gap, then close
  // the rest by watching the prompt.
  const nearby = () =>
    page.eval(`document.getElementById("nearby-text")?.textContent ?? ""`);
  await walk("ArrowRight", "ArrowRight", 39, 1550);
  await walk("ArrowDown", "ArrowDown", 40, 820);
  const nudges = [
    ["ArrowDown", 40, 300],
    ["ArrowRight", 39, 260],
    ["ArrowLeft", 37, 260],
    ["ArrowDown", 40, 260],
  ];
  for (const [key, keyCode, ms] of nudges) {
    if (/estate|lift/i.test(await nearby())) break;
    await walk(key, key, keyCode, ms);
  }
  await hold(400);
  await interact();
  if (!/estate/i.test(await area())) {
    throw new Error(
      `Expected the estate, got "${await area()}" (prompt: "${await nearby()}")`
    );
  }

  markBeat("estate wide - living neighbourhood");
  await hold(2600);
  await walk("ArrowRight", "ArrowRight", 39, 1700);
  await hold(1500);
  await walk("ArrowDown", "ArrowDown", 40, 1500);
  await hold(1800);
  await walk("ArrowRight", "ArrowRight", 39, 1400);
  await hold(2000);

  markBeat("journal / quest book");
  await page.eval(`document.getElementById("btn-journal")?.click()`);
  await sleep(2400);
  await page.key("keyDown", "Escape", "Escape", 27);
  await page.key("keyUp", "Escape", "Escape", 27);
  await sleep(900);

  markBeat("free exploration tail");
  await walk("ArrowLeft", "ArrowLeft", 37, 1700);
  await hold(1200);

  await page.send("Page.stopScreencast");
  await sleep(400);

  if (frameIndex < 30) {
    throw new Error(`Only ${frameIndex} frames captured; nothing to encode`);
  }

  const mp4 = join(OUT_DIR, "kampung-sg-gameplay-broll.mp4");
  await new Promise((resolve, reject) => {
    const ff = spawn(
      "ffmpeg",
      [
        "-y",
        "-framerate",
        String(FPS),
        "-i",
        join(frameDir, "f%06d.jpg"),
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-preset",
        "slow",
        "-crf",
        "18",
        "-vf",
        `scale=${WIDTH}:${HEIGHT}:flags=lanczos`,
        mp4,
      ],
      { stdio: "ignore" }
    );
    ff.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`))
    );
    ff.on("error", reject);
  });

  await writeFile(
    join(OUT_DIR, "broll-beats.json"),
    `${JSON.stringify(
      { fps: FPS, frames: frameIndex, seconds: +(frameIndex / FPS).toFixed(1), beats },
      null,
      2
    )}\n`
  );

  console.log(
    `\nWrote ${mp4} (${frameIndex} frames, ${(frameIndex / FPS).toFixed(1)}s @ ${FPS}fps)`
  );
  console.log("Beat index: docs/video/broll-beats.json");
  console.log(
    "This is silent B-roll for the edit, not a finished submission video."
  );
} finally {
  cdp?.close();
  chrome.kill();
  server?.kill();
  // Chrome may still be flushing its profile; never let cleanup mask the real
  // failure that brought us here.
  for (const dir of [profileDir, frameDir]) {
    await rm(dir, { recursive: true, force: true, maxRetries: 5 }).catch(
      () => {}
    );
  }
}
