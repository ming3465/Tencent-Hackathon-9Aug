/**
 * Production-browser smoke test for Kampung SG.
 *
 * Drives a real headless Chrome over the Chrome DevTools Protocol against the
 * built bundle, so it exercises the same JavaScript a judge will load. Uses
 * only Node built-ins (global fetch + WebSocket, Node 22+), so there is no
 * Puppeteer dependency to install or audit.
 *
 * Usage:
 *   npm run smoke
 *
 * Self-contained: builds nothing, but starts its own `vite preview` if the
 * target URL is not already being served, and shuts it down afterwards. Pass
 * --url to point at an already-running server (or a deployed build) instead.
 */

import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
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
const SHOT_DIR = readFlag("shots", "docs/screenshots");
const PORT = Number(readFlag("port", "9222"));

const failures = [];
const notes = [];
const consoleErrors = [];

function check(label, condition, detail = "") {
  if (condition) {
    notes.push(`  PASS  ${label}`);
  } else {
    failures.push(`  FAIL  ${label}${detail ? ` - ${detail}` : ""}`);
  }
  return condition;
}

class Cdp {
  #socket;
  #id = 0;
  #pending = new Map();

  constructor(socket) {
    this.#socket = socket;
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.#pending.has(message.id)) {
        const { resolve, reject } = this.#pending.get(message.id);
        this.#pending.delete(message.id);
        message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result);
        return;
      }
      if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
        consoleErrors.push(message.params.args.map((a) => a.value ?? a.description).join(" "));
      }
      if (message.method === "Runtime.exceptionThrown") {
        consoleErrors.push(
          message.params.exceptionDetails.exception?.description ??
            message.params.exceptionDetails.text
        );
      }
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

  /** In CDP flat mode the sessionId belongs in the message envelope, not params. */
  send(method, params = {}, sessionId) {
    const id = ++this.#id;
    const message = sessionId ? { id, method, params, sessionId } : { id, method, params };
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject });
      this.#socket.send(JSON.stringify(message));
    });
  }

  close() {
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
      throw new Error(result.exceptionDetails.exception?.description ?? "evaluate failed");
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

  async shot(path) {
    const { data } = await this.send("Page.captureScreenshot", { format: "png" });
    await writeFile(path, Buffer.from(data, "base64"));
  }

  /** Captures a single element, used for clean canvas-only marketing stills. */
  async shotElement(selector, path, scale = 2) {
    const box = await this.eval(`
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height };
      })()
    `);
    if (!box) return false;
    const { data } = await this.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      clip: { ...box, scale },
    });
    await writeFile(path, Buffer.from(data, "base64"));
    return true;
  }
}

/** Starts a preview server only if nothing is already answering on the URL. */
async function ensureServer(url) {
  try {
    await fetch(url);
    return null;
  } catch {
    // Nothing listening yet - start our own.
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
  throw new Error(
    `Could not start a preview server on ${url}. Run "npm run build" first.`
  );
}

const server = await ensureServer(APP_URL);

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    "--window-size=1440,900",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    "--user-data-dir=/tmp/kampung-smoke-profile",
    "--autoplay-policy=no-user-gesture-required",
    "about:blank",
  ],
  { stdio: "ignore" }
);

let cdp;
try {
  await mkdir(SHOT_DIR, { recursive: true });

  let version;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
      break;
    } catch {
      await sleep(250);
    }
  }
  if (!version) throw new Error("Chrome did not expose a debugging endpoint");

  cdp = await Cdp.connect(version.webSocketDebuggerUrl);
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  const page = new Session(cdp, sessionId);

  await page.send("Page.enable");
  await page.send("Runtime.enable");
  await page.send("Page.navigate", { url: APP_URL });
  await sleep(2200);

  check("Title screen renders the project name", await page.eval(`document.title.includes("Kampung SG")`));
  check(
    "Start button is present and focusable",
    await page.eval(`!!document.getElementById("btn-start")`)
  );
  await page.shot(`${SHOT_DIR}/01-title.png`);

  await page.eval(`document.getElementById("btn-start").click()`);
  await sleep(3800);

  check(
    "Exactly one Phaser canvas is created",
    (await page.eval(`document.querySelectorAll("#sandbox-stage canvas").length`)) === 1
  );
  check(
    "World reports ready (aria-busy cleared)",
    (await page.eval(`document.getElementById("sandbox-stage").getAttribute("aria-busy")`)) ===
      "false"
  );
  check(
    "Sound controls are present",
    await page.eval(`!!document.getElementById("btn-sound") && !!document.getElementById("volume-music")`)
  );
  await page.shot(`${SHOT_DIR}/02-neighbourhood.png`);
  await page.shotElement("#sandbox-stage canvas", `${SHOT_DIR}/hero-day.png`);

  // The player spawns beside Uncle Ravi, so proximity detection is live immediately.
  const spawnPrompt = await page.eval(`document.getElementById("nearby-text").textContent`);
  check(
    "Spawn point offers the first resident interaction",
    /Uncle Ravi|noticeboard/i.test(spawnPrompt),
    spawnPrompt
  );
  await page.shot(`${SHOT_DIR}/03-nearby-resident.png`);

  // Real key events must move the player and change which activity is in range.
  await page.eval(`document.getElementById("sandbox-stage").focus()`);
  await page.key("keyDown", "ArrowDown", "ArrowDown", 40);
  await sleep(400);
  await page.key("keyUp", "ArrowDown", "ArrowDown", 40);
  await sleep(500);

  const movedPrompt = await page.eval(`document.getElementById("nearby-text").textContent`);
  check(
    "Keyboard movement reaches a different activity",
    /memory table/i.test(movedPrompt),
    movedPrompt
  );

  // Touch controls must move the player back the other way.
  await page.eval(`
    (() => {
      const up = document.querySelector('[data-direction="up"]');
      up.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 1 }));
      setTimeout(() => up.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 1 })), 420);
    })()
  `);
  await sleep(1100);
  const touchPrompt = await page.eval(`document.getElementById("nearby-text").textContent`);
  check(
    "Touch movement returns to the resident",
    /Uncle Ravi|noticeboard/i.test(touchPrompt),
    touchPrompt
  );

  await page.eval(`document.getElementById("btn-interact").click()`);
  await sleep(600);

  const firstLine = await page.eval(`document.getElementById("dialog-text-a11y").textContent`);
  check(
    "Dialogue opens on a story line with a portrait",
    firstLine.length > 20 &&
      (await page.eval(`!!document.querySelector("#dialog-portrait svg")`)),
    firstLine.slice(0, 60)
  );
  await page.shot(`${SHOT_DIR}/04-dialogue.png`);

  /** Clicks Continue until the conversation hands over to choices. */
  async function readThroughDialogue(limit = 12) {
    for (let step = 0; step < limit; step += 1) {
      const advancing = await page.eval(
        `document.getElementById("btn-dialog-advance").classList.contains("visible")`
      );
      if (!advancing) return step;
      await page.eval(`document.getElementById("btn-dialog-advance").click()`);
      await sleep(260);
    }
    return limit;
  }

  const linesRead = await readThroughDialogue();
  check("Story lines advance one at a time", linesRead >= 3, `advanced ${linesRead} times`);
  check(
    "Choices appear only after the conversation",
    (await page.eval(`document.querySelectorAll("#dialog-choices .choice-button").length`)) === 2
  );

  // The game tells players Space works, so a focused choice button must accept it.
  await page.eval(`document.querySelectorAll("#dialog-choices .choice-button")[0].focus()`);
  await page.key("keyDown", " ", "Space", 32);
  await page.key("keyUp", " ", "Space", 32);
  await sleep(700);
  check(
    "Space activates a focused dialogue choice",
    (await page.eval(`document.querySelectorAll("#dialog-choices .choice-button").length`)) === 0
  );
  check(
    "Choice raises a Kampung Spirit meter",
    Number(await page.eval(`document.getElementById("summary-connection").textContent`)) > 0
  );
  await page.shot(`${SHOT_DIR}/05-choice-consequence.png`);
  await page.eval(`document.getElementById("btn-dialog-close").click()`);
  await sleep(400);

  // Complete the remaining two activities through the accessible Journal path.
  for (const activity of ["garden", "safe-route"]) {
    await page.eval(
      `document.querySelector('[data-journal-activity="${activity}"]').click()`
    );
    await sleep(500);
    await readThroughDialogue();
    await page.eval(`document.querySelectorAll("#dialog-choices .choice-button")[0].click()`);
    await sleep(500);
    await readThroughDialogue();
    await page.eval(`document.getElementById("btn-dialog-close").click()`);
    await sleep(400);
  }

  check(
    "Three activities unlock the evening gathering",
    (await page.eval(`document.getElementById("btn-evening").disabled`)) === false
  );
  await sleep(2400); // let the golden-hour light finish fading up
  await page.shot(`${SHOT_DIR}/06-evening-light.png`);
  await page.shotElement("#sandbox-stage canvas", `${SHOT_DIR}/hero-evening.png`);

  await page.eval(`document.getElementById("btn-evening").click()`);
  await sleep(700);
  const reflection = await page.eval(`document.getElementById("evening-text").textContent`);
  check(
    "Evening reflection names the player's actual choices",
    reflection.includes("Aunty Mei") || reflection.includes("Uncle Ravi") || reflection.includes("Mdm Siti"),
    reflection.slice(0, 90)
  );
  await page.shot(`${SHOT_DIR}/07-evening-reflection.png`);

  await page.eval(`document.getElementById("btn-end-day").click()`);
  await sleep(700);
  await page.shot(`${SHOT_DIR}/08-day-complete.png`);

  await page.eval(`document.getElementById("btn-end-day").click()`);
  await sleep(900);
  check(
    "Exiting destroys the Phaser canvas",
    (await page.eval(`document.querySelectorAll("#sandbox-stage canvas").length`)) === 0
  );

  // Second playthrough must behave identically to the first.
  await page.eval(`document.getElementById("btn-start").click()`);
  await sleep(3600);
  check(
    "A second playthrough starts cleanly with one canvas",
    (await page.eval(`document.querySelectorAll("#sandbox-stage canvas").length`)) === 1
  );
  check(
    "Second playthrough resets the meters",
    (await page.eval(`document.getElementById("summary-connection").textContent`)) === "0"
  );

  // Judge path: ?demo=1 must reach the evening after two activities.
  await page.send("Page.navigate", { url: `${APP_URL}${APP_URL.includes("?") ? "&" : "?"}demo=1` });
  await sleep(2200);
  await page.eval(`document.getElementById("btn-start").click()`);
  await sleep(3800);
  for (const activity of ["noticeboard", "garden"]) {
    await page.eval(`document.querySelector('[data-journal-activity="${activity}"]').click()`);
    await sleep(500);
    await readThroughDialogue();
    await page.eval(`document.querySelectorAll("#dialog-choices .choice-button")[0].click()`);
    await sleep(500);
    await readThroughDialogue();
    await page.eval(`document.getElementById("btn-dialog-close").click()`);
    await sleep(400);
  }
  check(
    "Demo mode unlocks the evening after two activities",
    (await page.eval(`document.getElementById("btn-evening").disabled`)) === false
  );
  await page.eval(`document.getElementById("btn-return-title").click()`);
  await sleep(900);
  await page.send("Page.navigate", { url: APP_URL });
  await sleep(2200);

  // Mobile viewport regression.
  await page.send("Emulation.setDeviceMetricsOverride", {
    width: 360,
    height: 780,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await sleep(1200);
  check(
    "No horizontal overflow at 360px",
    (await page.eval(`document.documentElement.scrollWidth <= 361`)),
    `scrollWidth=${await page.eval(`document.documentElement.scrollWidth`)}`
  );
  const smallTargets = await page.eval(`
    Array.from(document.querySelectorAll("button:not([disabled])"))
      .filter((b) => b.offsetParent !== null)
      .filter((b) => { const r = b.getBoundingClientRect(); return r.width < 44 || r.height < 44; })
      .length
  `);
  check("All visible touch targets are at least 44px", smallTargets === 0, `${smallTargets} too small`);
  await page.shot(`${SHOT_DIR}/09-mobile-360.png`);

  check("No uncaught console errors during the run", consoleErrors.length === 0, consoleErrors.join(" | "));
} catch (error) {
  failures.push(`  FAIL  harness error - ${error.message}`);
} finally {
  cdp?.close();
  chrome.kill();
  server?.kill();
}

console.log("\nKampung SG production-browser smoke\n");
for (const note of notes) console.log(note);
for (const failure of failures) console.log(failure);
console.log(
  `\n${notes.length} passed, ${failures.length} failed. Screenshots in ${SHOT_DIR}/\n`
);
process.exit(failures.length === 0 ? 0 : 1);
