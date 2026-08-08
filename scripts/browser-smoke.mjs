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
 *   node scripts/browser-smoke.mjs --location-gallery --gallery-only
 *   node scripts/browser-smoke.mjs --hero-only
 *
 * Self-contained: builds nothing, but starts its own `vite preview` if the
 * target URL is not already being served, and shuts it down afterwards. Pass
 * --url to point at an already-running server (or a deployed build) instead.
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
const withAppQuery = (entries) => {
  const url = new URL(APP_URL);
  for (const [key, value] of Object.entries(entries)) {
    url.searchParams.set(key, value);
  }
  return url.href;
};
const TEST_URL = withAppQuery({ smoke: "1" });
const DEMO_TEST_URL = withAppQuery({ smoke: "1", demo: "1" });
const SHOT_DIR = readFlag("shots", "docs/screenshots");
/**
 * The whole suite runs as a named player rather than the default "Y".
 *
 * That is deliberate: every downstream assertion then exercises the
 * personalised text path, so a render site that forgot to resolve the
 * `{player}` token shows up as a failure here instead of as a literal
 * "{player}" on a judge's screen.
 */
const SMOKE_PLAYER_NAME = "Halimah";
const SMOKE_PLAYER_FLAT = `${SMOKE_PLAYER_NAME}'s House`;
const PORT = Number(readFlag("port", "9222"));
const CAPTURE_LOCATION_GALLERY = args.includes("--location-gallery");
const CAPTURE_SCREENSHOTS = !args.includes("--no-shots");
const CAPTURE_LOCATION_SCREENSHOTS_ONLY = args.includes("--gallery-only");
const CAPTURE_HERO_DAY_ONLY = args.includes("--hero-only");
const FOCUS_ONLY = args.includes("--focus-only");
const FOCUS_ONLY_COMPLETE = "__KAMPUNG_FOCUS_ONLY_COMPLETE__";

const failures = [];
const notes = [];
const diagnostics = [];
const consoleErrors = [];
let framePacing = null;
let throttledFramePacing = null;
let wanderingFramePacing = null;
let baselineFramePacing = null;
let residentMotionEvidence = null;
let reducedMotionEvidence = null;
let monsoonWeatherEvidence = null;
let reducedMonsoonEvidence = null;
let monsoonFramePacing = null;
let districtTravelEvidence = null;
let terrainDetailEvidence = null;
let consequenceArtEvidence = {
  before: null,
  exterior: null,
  interior: null,
  flowers: null,
};
let facadeCollisionEvidence = null;
let worldFeelEvidence = null;
const scamCheckEvidence = [];
let grassFootstepEvidence = null;
let stoneFootstepEvidence = null;
let portraitEvidence = {
  desktop: null,
  named: null,
  mobile: null,
};
let exteriorWakePaletteSize = 0;
let exteriorWorldWidth = 0;
let exteriorEdgePaletteSize = 0;
let mobileGameEvidence = null;
let questTrackerEvidence = null;
let doorLifecycleEvidence = null;
const questStoryTitles = new Set();
const renderedLocationNames = new Set();

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
        const { resolve, reject, timeout } = this.#pending.get(message.id);
        this.#pending.delete(message.id);
        clearTimeout(timeout);
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
      const timeout = setTimeout(() => {
        if (!this.#pending.delete(id)) return;
        reject(new Error(`CDP command timed out after 45 seconds: ${method}`));
      }, 45_000);
      this.#pending.set(id, { resolve, reject, timeout });
      try {
        this.#socket.send(JSON.stringify(message));
      } catch (error) {
        clearTimeout(timeout);
        this.#pending.delete(id);
        reject(error);
      }
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
    if (
      !CAPTURE_SCREENSHOTS
      || (CAPTURE_LOCATION_SCREENSHOTS_ONLY && !path.includes("/locations/"))
      || CAPTURE_HERO_DAY_ONLY
    ) return true;
    const { data } = await this.send("Page.captureScreenshot", { format: "png" });
    await writeFile(path, Buffer.from(data, "base64"));
    return true;
  }

  /** Captures a single element, used for clean canvas-only marketing stills. */
  async shotElement(selector, path, scale = 2) {
    if (
      !CAPTURE_SCREENSHOTS
      || CAPTURE_LOCATION_SCREENSHOTS_ONLY
      || (CAPTURE_HERO_DAY_ONLY && !path.endsWith("/hero-day.png"))
    ) return true;
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
const profileDir = await mkdtemp(join(tmpdir(), "kampung-smoke-"));
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    "--window-size=1440,900",
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
  await page.send("Performance.enable");

  const waitForPageCondition = async (
    expression,
    label,
    timeoutMs = 4000
  ) => {
    const deadline = Date.now() + timeoutMs;
    do {
      try {
        if (await page.eval(`Boolean(${expression})`)) return;
      } catch {
        // A navigation may replace the execution context between polls.
      }
      await sleep(80);
    } while (Date.now() < deadline);
    throw new Error(`Timed out waiting for ${label}`);
  };

  const waitForRenderedDialogueLine = (label) =>
    waitForPageCondition(
      `(() => {
        const visible = document.getElementById("dialog-text");
        const complete = document.getElementById("dialog-text-a11y");
        return Boolean(
          visible
          && complete
          && visible.textContent === complete.textContent
          && !visible.classList.contains("typing")
        );
      })()`,
      label,
      // Long environmental-detail copy can cross ten seconds when Chrome is
      // also encoding evidence screenshots: the typewriter's setInterval(16) is
      // throttled to roughly a tenth of its designed 125 chars/sec under that
      // contention. Measured at ~10 chars/sec both here and at the previous
      // release, so this is harness load, not a game regression. Keep waiting
      // for the real typing-completion signal rather than weakening the
      // rendered-line assertion.
      16000
    );

  const sampleFramePacing = () => page.eval(`
    new Promise((resolve) => {
      const samples = [];
      let previous = 0;
      const tick = (now) => {
        if (previous > 0) samples.push(now - previous);
        previous = now;
        if (samples.length < 120) {
          requestAnimationFrame(tick);
          return;
        }
        const trimmed = samples.slice(5);
        const sorted = [...trimmed].sort((a, b) => a - b);
        const average = trimmed.reduce((sum, value) => sum + value, 0) / trimmed.length;
        const median = sorted[Math.floor(sorted.length / 2)];
        const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
        const canvas = document.querySelector("#sandbox-stage canvas");
        resolve({
          average,
          median,
          p95,
          worst: sorted[sorted.length - 1],
          overBudget: trimmed.filter((value) => value > 34).length,
          renderer: canvas?.getContext("2d") ? "Canvas2D" : "WebGL",
        });
      };
      requestAnimationFrame(tick);
    })
  `);

  const readPerformanceMetrics = async () => {
    const result = await page.send("Performance.getMetrics");
    return Object.fromEntries(
      result.metrics.map((metric) => [metric.name, metric.value])
    );
  };

  const profileActiveMovement = async () => {
    const before = await readPerformanceMetrics();
    let pacingComplete = false;
    const pacingPromise = sampleFramePacing().then((result) => {
      pacingComplete = true;
      return result;
    });
    let moveRight = true;
    try {
      while (!pacingComplete) {
        const key = moveRight ? "ArrowRight" : "ArrowLeft";
        const keyCode = moveRight ? 39 : 37;
        await page.key("keyDown", key, key, keyCode);
        await sleep(420);
        await page.key("keyUp", key, key, keyCode);
        moveRight = !moveRight;
        await sleep(30);
      }
    } finally {
      await page.key("keyUp", "ArrowRight", "ArrowRight", 39);
      await page.key("keyUp", "ArrowLeft", "ArrowLeft", 37);
    }
    const pacing = await pacingPromise;
    const after = await readPerformanceMetrics();
    const elapsedSeconds = Math.max(
      0.001,
      (after.Timestamp ?? 0) - (before.Timestamp ?? 0),
    );
    return {
      ...pacing,
      taskMsPerFrame:
        ((after.TaskDuration ?? 0) - (before.TaskDuration ?? 0))
          / elapsedSeconds * pacing.average,
      scriptMsPerFrame:
        ((after.ScriptDuration ?? 0) - (before.ScriptDuration ?? 0))
          / elapsedSeconds * pacing.average,
    };
  };

  const walkWorld = async (key, code, keyCode, duration) => {
    await page.eval(`
      (() => {
        // A direct focus() is a no-op when the stage is already active, so it
        // cannot repair a transient controls-disabled state. Cross the visible
        // Menu control first to exercise the production focusin policy, then
        // return to the world before dispatching movement keys.
        document.getElementById("btn-menu").focus({ preventScroll: true });
        document.getElementById("sandbox-stage").focus({ preventScroll: true });
      })()
    `);
    await page.key("keyDown", "Shift", "ShiftLeft", 16);
    await page.key("keyDown", key, code, keyCode);
    await sleep(duration);
    await page.key("keyUp", key, code, keyCode);
    await page.key("keyUp", "Shift", "ShiftLeft", 16);
    await sleep(350);
  };

  const dispatchTouch = (type, touchPoints) => page.send(
    "Input.dispatchTouchEvent",
    {
      type,
      touchPoints: touchPoints.map((point) => ({
        id: point.id,
        x: point.x,
        y: point.y,
        radiusX: 2,
        radiusY: 2,
        force: 1,
      })),
    },
  );

  const touchTap = async (x, y, holdMs = 50) => {
    await dispatchTouch("touchStart", [{ id: 1, x, y }]);
    await sleep(holdMs);
    await dispatchTouch("touchEnd", []);
  };

  const pointerClick = async (selector) => {
    const point = await page.eval(`
      (() => {
        const target = document.querySelector(${JSON.stringify(selector)});
        if (!target) return null;
        const rect = target.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      })()
    `);
    if (!point) throw new Error(`Pointer target not found: ${selector}`);
    await page.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: point.x,
      y: point.y,
      button: "none",
      buttons: 0,
      pointerType: "mouse",
    });
    await page.send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x: point.x,
      y: point.y,
      button: "left",
      buttons: 1,
      clickCount: 1,
      pointerType: "mouse",
    });
    await page.send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x: point.x,
      y: point.y,
      button: "left",
      buttons: 0,
      clickCount: 1,
      pointerType: "mouse",
    });
  };

  const worldPointToClient = (x, y) => page.eval(`
    (() => {
      const snapshot = window.__kampungSmoke?.getMotionSnapshot?.();
      const canvas = document.querySelector("#sandbox-stage canvas");
      if (!snapshot || !canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const view = snapshot.tapNavigation.cameraWorldView;
      return {
        x: rect.left + ((${x} - view.x) / view.width) * rect.width,
        y: rect.top + ((${y} - view.y) / view.height) * rect.height,
      };
    })()
  `);

  const walkToAxis = async (axis, target, tolerance = 18) => {
    // Single-axis walking stalls against any solid the route happens to line up
    // with, so whether a leg succeeded used to depend on where the previous leg
    // left the player. When an attempt makes no headway, step around the
    // obstacle before pushing on the target axis again.
    let previous = null;
    let dodges = 0;
    for (let attempt = 0; attempt < 16; attempt += 1) {
      const snapshot = await page.eval(
        `window.__kampungSmoke?.getMotionSnapshot?.() ?? null`
      );
      if (!snapshot || snapshot.locationId !== "estate") {
        throw new Error(`Physical travel lost the estate while targeting ${axis}=${target}`);
      }
      const delta = target - snapshot.player[axis];
      if (Math.abs(delta) <= tolerance) return snapshot;
      if (previous !== null && Math.abs(snapshot.player[axis] - previous) < 4) {
        const [dodgeKey, dodgeCode] =
          axis === "x"
            ? dodges % 2 === 0 ? ["ArrowDown", 40] : ["ArrowUp", 38]
            : dodges % 2 === 0 ? ["ArrowRight", 39] : ["ArrowLeft", 37];
        dodges += 1;
        await walkWorld(dodgeKey, dodgeKey, dodgeCode, 220 + dodges * 110);
      }
      previous = snapshot.player[axis];
      const positive = delta > 0;
      const [key, keyCode] =
        axis === "x"
          ? positive ? ["ArrowRight", 39] : ["ArrowLeft", 37]
          : positive ? ["ArrowDown", 40] : ["ArrowUp", 38];
      const duration = Math.min(
        800,
        Math.max(90, Math.round(Math.abs(delta) / 260 * 1000 * 0.55))
      );
      await walkWorld(key, key, keyCode, duration);
    }
    const ending = await page.eval(
      `window.__kampungSmoke?.getMotionSnapshot?.() ?? null`
    );
    if (
      ending
      && ending.locationId === "estate"
      && Math.abs(target - ending.player[axis]) <= tolerance
    ) {
      return ending;
    }
    throw new Error(
      `Physical travel could not reach ${axis}=${target}; ` +
        `ended at ${JSON.stringify(ending?.player ?? null)}`
    );
  };

  const ensureJournalOpen = async () => {
    const open = await page.eval(
      `document.getElementById("journal-panel").classList.contains("open")`
    );
    if (open) return;
    await page.eval(`document.getElementById("btn-journal").click()`);
    await sleep(220);
  };

  const recordStoryTrackerTitle = async () => {
    const title = await page.eval(
      `document.querySelector('.quest-tracker-card.story > strong')?.textContent?.trim() ?? ''`
    );
    if (title) questStoryTitles.add(title);
    return title;
  };

  const journalCategoryForSection = {
    "Main Story": "story",
    "Optional Requests": "requests",
    People: "people",
    Places: "places",
  };

  const activateJournalSection = async (section) => {
    const category = journalCategoryForSection[section];
    if (!category) return;
    await page.eval(`
      document.querySelector(
        '[data-journal-category="${category}"]'
      )?.click()
    `);
    await sleep(70);
  };

  const clickButton = async (label, section = "", expectedArea = "") => {
    await ensureJournalOpen();
    if (section) await activateJournalSection(section);
    const clicked = await page.eval(`
      (() => {
        const section = ${JSON.stringify(section)}
          ? Array.from(document.querySelectorAll(".journal-section"))
              .find((candidate) => candidate.querySelector(":scope > h3")?.textContent.trim() === ${JSON.stringify(section)})
          : document;
        const buttons = [
          ...Array.from(section?.querySelectorAll("button") ?? []),
          ...Array.from(document.querySelectorAll("#journal-detail button")),
        ];
        const button = buttons.find((candidate) =>
          candidate.textContent.trim().includes(${JSON.stringify(label)})
        );
        // Report what was on offer, so a label mismatch is diagnosable from
        // one run instead of needing a bisect.
        if (!button) return { clicked: false, seen: buttons.map((b) => b.textContent.trim()) };
        button.click();
        return { clicked: true };
      })()
    `);
    if (!clicked.clicked) {
      throw new Error(
        `Could not find button "${label}" in "${section || "document"}". `
          + `Saw: ${JSON.stringify(clicked.seen)}`
      );
    }
    if (expectedArea) {
      await waitForPageCondition(
        `document.getElementById("area-name")?.textContent?.includes(${JSON.stringify(expectedArea)})`,
        `${expectedArea} to finish loading`,
        2500
      );
    } else {
      await sleep(520);
    }
  };

  const clickJournalItem = async (section, title) => {
    // Now that every home opens straight onto the village, the player is often
    // already standing where the Journal would travel them - and "travel to
    // here" is correctly disabled. Treat that as arrival, not as a failure.
    if (section === "Places") {
      const here = await page.eval(
        `document.getElementById("area-name")?.textContent.trim() ?? ""`
      );
      if (here.toLowerCase() === title.toLowerCase()) {
        const journalOpen = await page.eval(
          `document.getElementById("journal-panel").classList.contains("open")`
        );
        if (journalOpen) {
          await page.eval(`document.getElementById("btn-journal-close").click()`);
          await sleep(200);
        }
        return;
      }
    }
    await ensureJournalOpen();
    await activateJournalSection(section);
    const selected = await page.eval(`
      (() => {
        const section = Array.from(document.querySelectorAll(".journal-section"))
          .find((candidate) => candidate.querySelector(":scope > h3")?.textContent.trim() === ${JSON.stringify(section)});
        const item = Array.from(section?.querySelectorAll(".journal-item") ?? [])
          .find((candidate) => candidate.querySelector(".journal-item h3")?.textContent.trim() === ${JSON.stringify(title)});
        const button = item?.querySelector(".journal-entry-select");
        if (!button) return false;
        button.click();
        return true;
      })()
    `);
    if (!selected) {
      throw new Error(`Could not select journal item "${section}" / "${title}"`);
    }
    await sleep(80);
    const acted = await page.eval(`
      (() => {
        const button = document.querySelector(
          "#journal-detail .journal-action:not(:disabled)"
        );
        if (!button) return false;
        button.click();
        return true;
      })()
    `);
    if (!acted) {
      throw new Error(`Could not open journal item "${section}" / "${title}"`);
    }
    if (section === "Places") {
      const deadline = Date.now() + 1400;
      let renderedName = "";
      do {
        renderedName = await page.eval(
          `document.getElementById("area-name").textContent.trim()`
        );
        if (renderedName.toLowerCase() === title.toLowerCase()) return;
        await sleep(80);
      } while (Date.now() < deadline);
      throw new Error(
        `Expected ${title} after Journal travel, rendered ${renderedName}`
      );
    }
    await sleep(440);
  };

  const readThroughDialogue = async (limit = 60) => {
    for (let step = 0; step < limit; step += 1) {
      const advancing = await page.eval(
        `document.getElementById("btn-dialog-advance").classList.contains("visible")`
      );
      if (!advancing) return step;
      await page.eval(`document.getElementById("btn-dialog-advance").click()`);
      await sleep(75);
    }
    throw new Error("Dialogue did not finish inside its authored line limit");
  };

  const choose = async (index = 0, useSpace = false) => {
    const count = await page.eval(
      `document.querySelectorAll("#dialog-choices .choice-button").length`
    );
    if (count <= index) throw new Error(`Choice ${index} missing; only ${count} shown`);
    if (useSpace) {
      await page.eval(`document.querySelectorAll("#dialog-choices .choice-button")[${index}].focus()`);
      await page.key("keyDown", " ", "Space", 32);
      await page.key("keyUp", " ", "Space", 32);
    } else {
      await page.eval(`document.querySelectorAll("#dialog-choices .choice-button")[${index}].click()`);
    }
    await sleep(180);
  };

  const finishResponse = async () => {
    await readThroughDialogue();
    await page.eval(`document.getElementById("btn-dialog-close").click()`);
    await sleep(180);
  };

  const completeDialogueChoice = async (index = 0) => {
    await readThroughDialogue();
    await choose(index);
    await finishResponse();
  };

  const talkWithPerson = async (name, index = 0) => {
    await clickJournalItem("People", name);
    await completeDialogueChoice(index);
  };

  const completeRequest = async (title, index = 0) => {
    await clickJournalItem("Optional Requests", title);
    await completeDialogueChoice(index);
  };

  const openPrologue = async (testPhysicalControls) => {
    const prompt = await page.eval(`document.getElementById("nearby-text").textContent`);
    check("Prologue spawns beside the Voice, not an exit", /Voice/i.test(prompt), prompt);
    await page.eval(`document.getElementById("btn-touch-interact").click()`);
    await sleep(220);
    check(
      "Touch interaction opens the visible story modal",
      await page.eval(`document.getElementById("dialog-overlay").classList.contains("active")`)
    );
    if (testPhysicalControls) {
      portraitEvidence.desktop = await page.eval(`
        (() => {
          const card = document.querySelector("#dialog-overlay .dialog-card");
          const portrait = document.getElementById("dialog-portrait");
          const svg = portrait?.querySelector("svg");
          const cardRect = card?.getBoundingClientRect();
          const portraitRect = portrait?.getBoundingClientRect();
          return {
            id: svg?.dataset.portraitId ?? null,
            mood: svg?.dataset.mood ?? null,
            cardWidth: cardRect?.width ?? 0,
            width: portraitRect?.width ?? 0,
            height: portraitRect?.height ?? 0,
            detailCount: svg?.querySelectorAll("rect, path").length ?? 0,
            insideViewport:
              !!cardRect
              && cardRect.left >= 0
              && cardRect.right <= innerWidth
              && cardRect.top >= 0
              && cardRect.bottom <= innerHeight,
          };
        })()
      `);
      diagnostics.push(
        `  VN  desktop=${portraitEvidence.desktop.width.toFixed(0)}x` +
          `${portraitEvidence.desktop.height.toFixed(0)}px; ` +
          `card=${portraitEvidence.desktop.cardWidth.toFixed(0)}px; ` +
          `details=${portraitEvidence.desktop.detailCount}; ` +
          `id=${portraitEvidence.desktop.id}; ` +
          `mood=${portraitEvidence.desktop.mood}`
      );
      await waitForRenderedDialogueLine("the prologue evidence line");
      await page.shot(`${SHOT_DIR}/04-dialogue.png`);
    }
    const firstLine = await page.eval(`document.getElementById("dialog-text-a11y").textContent`);
    check(
      "Dialogue exposes a whole accessible line and a code-drawn portrait",
      // Wholeness, not length: the risk this guards is the accessible node
        // exposing a half-typed string. A line that ends in sentence punctuation
        // is complete, and the prologue deliberately opens on two short words.
        firstLine.trim().length >= 8
        && /[.!?”"]$/.test(firstLine.trim())
        && (await page.eval(`!!document.querySelector("#dialog-portrait svg")`))
        && (await page.eval(`
          (() => {
            const button = document.getElementById("btn-dialog-advance");
            if (!button) return false;
            const target = button.getBoundingClientRect();
            return button.textContent.trim() === ">"
              && button.getAttribute("aria-label") === "Continue dialogue"
              && target.width >= 52
              && target.height >= 52;
          })()
        `))
        && (
          !testPhysicalControls
          || (
            portraitEvidence.desktop?.id === "voice"
            && portraitEvidence.desktop?.cardWidth >= 860
            && portraitEvidence.desktop?.width >= 210
            && portraitEvidence.desktop?.height >= 280
            && portraitEvidence.desktop?.detailCount >= 25
            && portraitEvidence.desktop?.insideViewport
          )
      ),
      firstLine.slice(0, 70)
    );
    check(
      "Choices stay hidden until authored lines are read",
      (await page.eval(`document.querySelectorAll("#dialog-choices .choice-button").length`)) === 0
    );
    const clicks = await readThroughDialogue();
    const choiceMood = await page.eval(
      `document.querySelector("#dialog-portrait svg")?.dataset.mood ?? null`
    );
    check(
      "Story lines advance one at a time with portrait expression changes",
      clicks >= 3
        && (
          !testPhysicalControls
          || (
            portraitEvidence.desktop?.mood === "neutral"
            && choiceMood === "thoughtful"
          )
        ),
      `advanced ${clicks} times; mood=${portraitEvidence.desktop?.mood}->${choiceMood}`
    );
    check(
      "The prologue reveals one non-punitive choice",
      (await page.eval(`document.querySelectorAll("#dialog-choices .choice-button").length`)) === 1
    );
    await choose(0, testPhysicalControls);
    check(
      "Space activates a focused dialogue choice",
      !testPhysicalControls ||
        (await page.eval(`document.querySelectorAll("#dialog-choices .choice-button").length`)) === 0
    );
    await finishResponse();
    check(
      "Closing dialogue restores focus to the world",
      await page.eval(`document.activeElement?.id === "sandbox-stage"`)
    );

    if (!testPhysicalControls) {
      await clickButton("Use the first door", "Main Story", "Kampung SG Village");
    } else {
      const beforeKeyboard = await page.eval(
        `window.__kampungSmoke?.getMotionSnapshot?.() ?? null`
      );
      await walkWorld("ArrowLeft", "ArrowLeft", 37, 240);
      const afterKeyboard = await page.eval(
        `window.__kampungSmoke?.getMotionSnapshot?.() ?? null`
      );
      check(
        `Keyboard movement responds inside ${SMOKE_PLAYER_NAME}'s house`,
        beforeKeyboard
          && afterKeyboard
          && beforeKeyboard.locationId === "y-flat"
          && afterKeyboard.locationId === "y-flat"
          && beforeKeyboard.player.x - afterKeyboard.player.x >= 18,
        `${JSON.stringify(beforeKeyboard?.player)} -> ${JSON.stringify(afterKeyboard?.player)}`,
      );
      await clickButton("Use the first door", "Main Story", "Kampung SG Village");
    }
    check(
      "The first door opens straight onto the village, not a shared corridor",
      /Kampung SG Village/i.test(await page.eval(`document.getElementById("area-name").textContent`))
    );
    await recordStoryTrackerTitle();
  };

  const inspectMrLong = async (testTouchExit) => {
    await clickButton("Visit Mr. Long", "Main Story", "Mr. Long's House");
    check(
      "Chapter 1 enters Mr. Long's unique flat",
      /Mr. Long/i.test(await page.eval(`document.getElementById("area-name").textContent`))
    );
    await clickJournalItem("People", "Mr. Long");
    portraitEvidence.named = await page.eval(`
      (() => {
        const svg = document.querySelector("#dialog-portrait svg");
        return {
          id: svg?.dataset.portraitId ?? null,
          accessory: svg?.dataset.accessory ?? null,
          hairStyle: svg?.dataset.hairStyle ?? null,
          detailCount: svg?.querySelectorAll("rect, path").length ?? 0,
        };
      })()
    `);
    if (testTouchExit) {
      await waitForRenderedDialogueLine("Mr. Long's evidence line");
      await page.shot(`${SHOT_DIR}/19-mr-long-portrait.png`);
    }
    await completeDialogueChoice();
    check(
      "Mr. Long's own account unlocks helper recruitment",
      /distinct helpers ready/i.test(await page.eval(`document.getElementById("campaign-progress").textContent`))
        && portraitEvidence.named.id === "mr-long"
        && portraitEvidence.named.accessory === "cane"
        && portraitEvidence.named.hairStyle === "side-part"
        && portraitEvidence.named.detailCount >= 30
    );
    if (testTouchExit) {
      await page.eval(`document.getElementById("btn-touch-interact").click()`);
      await sleep(850);
      const prompt = await page.eval(`document.getElementById("nearby-text").textContent`);
      check(
        "Touch exit restores the player beside the correct corridor door",
        /Mr. Long/i.test(prompt),
        prompt
      );
    }
  };

  const recruitHelpers = async (count, gardenChoice = 0) => {
    const requests = [
      "A Garden People Use",
      "An Invitation, Not a Notice",
      "Shade That Follows the Route",
    ];
    let completedInsideTrackerCheck = false;
    if (!questTrackerEvidence) {
      await ensureJournalOpen();
      await activateJournalSection("Optional Requests");
      const selected = await page.eval(`
        (() => {
          const item = Array.from(document.querySelectorAll(".journal-item"))
            .find((candidate) => candidate.querySelector("h3")?.textContent.trim()
              === "A Garden People Use");
          const button = item?.querySelector(".journal-entry-select");
          if (!button) return false;
          button.click();
          document.querySelector("#journal-detail .journal-track-button")?.click();
          return true;
        })()
      `);
      await sleep(100);
      await page.eval(`document.getElementById("btn-journal-close").click()`);
      await sleep(120);
      const tracked = await page.eval(`
        (() => {
          const cards = Array.from(document.querySelectorAll(".quest-tracker-card"));
          const request = document.querySelector('.quest-tracker-card.request');
          return {
            selected: ${JSON.stringify(selected)},
            cards: cards.length,
            title: request?.querySelector("strong")?.textContent.trim() ?? null,
            progress: request?.querySelector('[role="progressbar"]')
              ?.getAttribute("aria-valuenow") ?? null,
            journalTracked: document.getElementById("btn-journal").dataset.tracked,
          };
        })()
      `);
      await page.eval(`document.querySelector('.quest-tracker-card.request')?.click()`);
      await sleep(120);
      const linked = await page.eval(`
        document.querySelector('[role="tab"][aria-selected="true"]')
          ?.dataset.journalCategory === "requests"
        && document.querySelector("#journal-detail h3")?.textContent.trim()
          === "A Garden People Use"
      `);
      await page.eval(`document.querySelector("#journal-detail .journal-action")?.click()`);
      await sleep(180);
      await completeDialogueChoice(gardenChoice);
      const completed = await page.eval(`
        (() => {
          const request = document.querySelector('.quest-tracker-card.request');
          return request?.querySelector('[role="progressbar"]')
            ?.getAttribute("aria-valuenow") === "1"
            && request?.querySelector("b")?.textContent.trim() === "1/1";
        })()
      `);
      await page.eval(`document.querySelector('.quest-tracker-card.request')?.click()`);
      await sleep(100);
      await page.eval(`document.querySelector("#journal-detail .journal-track-button")?.click()`);
      await sleep(80);
      await page.eval(`document.getElementById("btn-journal-close").click()`);
      await sleep(100);
      const fallback = await page.eval(`
        !document.querySelector('.quest-tracker-card.request')
        && document.querySelector('.quest-tracker-requests-action')
          ?.textContent.trim() === "Track a request"
      `);
      questTrackerEvidence = {
        optionalTracked:
          tracked.selected
          && tracked.cards === 2
          && tracked.title === "A Garden People Use"
          && tracked.progress === "0"
          && tracked.journalTracked === "true",
        journalLink: linked,
        optionalCompleted: completed,
        fallback,
      };
      completedInsideTrackerCheck = true;
    }
    for (const request of requests.slice(completedInsideTrackerCheck ? 1 : 0, count)) {
      await completeRequest(
        request,
        request === "A Garden People Use" ? gardenChoice : 0,
      );
    }
    check(
      `${count} distinct helper routes advance to Chapter 2`,
      /CHAPTER 2/i.test(await page.eval(`document.getElementById("chapter-label").textContent`))
    );
    await recordStoryTrackerTitle();
  };

  const completeChapter2 = async (attendeeCount) => {
    const expectedLayout = attendeeCount === 2
      ? "numbered-steps"
      : "icons-and-words";
    await clickButton("Ask Auntie Minah", "Main Story");
    const minahLines = [];
    for (let step = 0; step < 12; step += 1) {
      const advancing = await page.eval(
        `document.getElementById("btn-dialog-advance").classList.contains("visible")`
      );
      if (!advancing) break;
      const line = await page.eval(
        `document.getElementById("dialog-text-a11y").textContent`
      );
      if (line && minahLines.at(-1) !== line) minahLines.push(line);
      await page.eval(`document.getElementById("btn-dialog-advance").click()`);
      await sleep(75);
    }
    const minahChoiceState = await page.eval(`
      (() => ({
        title: document.getElementById("dialog-kicker").textContent,
        speaker: document.getElementById("dialog-speaker").textContent,
        portraitId:
          document.querySelector("#dialog-portrait svg")?.dataset.portraitId ?? null,
        labels: Array.from(
          document.querySelectorAll("#dialog-choices .choice-button")
        ).map((button) => button.textContent.trim()),
      }))()
    `);
    await choose(expectedLayout === "numbered-steps" ? 0 : 1, true);
    await finishResponse();
    const minahResult = await page.eval(
      `window.__kampungSmoke?.getMotionSnapshot?.() ?? null`
    );
    await ensureJournalOpen();
    await activateJournalSection("Main Story");
    const safetyEntrySelected = await page.eval(`
      (() => {
        const item = Array.from(document.querySelectorAll(".journal-item"))
          .find((candidate) =>
            candidate.querySelector("h3")?.textContent.trim()
              === "Who Knows Grandma Ros?"
          );
        const button = item?.querySelector(".journal-entry-select");
        if (!button) return false;
        button.click();
        return true;
      })()
    `);
    await sleep(80);
    const safetyJournalText = await page.eval(`
      Array.from(document.querySelectorAll("#journal-detail .journal-objective"))
        .map((item) => item.textContent.trim())
        .join(" ")
    `);
    scamCheckEvidence.push({
      authoredAdvice:
        minahLines.some((line) => /check before I act/i.test(line))
        && minahLines.some((line) => /ScamShield at 1799/i.test(line))
        && minahLines.some((line) => /one-time password/i.test(line)),
      noFailureChoice:
        minahChoiceState.labels.length === 2
        && minahChoiceState.labels.every((label) =>
          /numbered steps|icons with short words/i.test(label)
        ),
      elderExpert:
        minahChoiceState.title === "Check Before You Act"
        && minahChoiceState.speaker === "Auntie Minah"
        && minahChoiceState.portraitId === "auntie-minah",
      expectedLayout,
      persistedLayout: minahResult?.scamCheckCardLayout ?? null,
      cardVisible: minahResult?.scamCheckCardVisible ?? false,
      cardAlpha: minahResult?.scamCheckCardAlpha ?? null,
      semanticRevisit:
        safetyEntrySelected
        && /PAUSE, CHECK, TELL/i.test(safetyJournalText)
        && /never share an OTP/i.test(safetyJournalText)
        && /Shop card:/i.test(safetyJournalText),
    });
    await clickButton("Ask Uncle Seng", "Main Story");
    await completeDialogueChoice();
    check(
      "Two independent clues open Grandma Ros's kitchen",
      /kitchen is now open/i.test(await page.eval(`document.getElementById("campaign-progress").textContent`))
    );
    await recordStoryTrackerTitle();
    await clickButton(
      "Enter Grandma Ros's kitchen",
      "Main Story",
      "Grandma Ros's Kitchen"
    );
    check(
      "Chapter 2 enters Grandma Ros's lived-in kitchen",
      /Grandma Ros/i.test(await page.eval(`document.getElementById("area-name").textContent`))
    );
    await page.shot(`${SHOT_DIR}/06-evening-light.png`);
    const invitees = ["Aunty Mei", "Uncle Ravi", "Mdm Siti", "Pak Yusof", "Coach Meng"];
    for (const invitee of invitees.slice(0, attendeeCount)) await talkWithPerson(invitee);
    check(
      `${attendeeCount} invitations stage the lesson and unlock Chapter 3`,
      /CHAPTER 3/i.test(await page.eval(`document.getElementById("chapter-label").textContent`))
    );
    await recordStoryTrackerTitle();
  };

  const completeChapter3 = async () => {
    await clickButton(
      "Visit the workshop",
      "Main Story",
      "Craftsman's Workshop"
    );
    check(
      "Chapter 3 enters the code-drawn craftsman's workshop",
      /Craftsman/i.test(await page.eval(`document.getElementById("area-name").textContent`))
    );
    await talkWithPerson("Mr. Tan");
    await clickButton("Ask Wei Ling", "Main Story");
    await completeDialogueChoice();
    check(
      "Two authored clues unlock Ben's house",
      /Visit Ben/i.test(
        await page.eval(`
          Array.from(document.querySelectorAll("#journal-detail button"))
            .map((button) => button.textContent).join(" | ")
        `)
      )
    );
    await clickButton("Visit Ben's house", "Main Story", "Ben's House");
    await clickButton("Talk with Ben", "Main Story");
    await completeDialogueChoice();
    const approach = JSON.parse(
      await page.eval(`localStorage.getItem("kampung-sg.campaign.v1")`)
    )?.choices?.["ben-approach"];
    check("Ben remembers the player's supportive approach", approach === "sit-beside", approach);
    await clickButton("Ask Ben to walk together", "Main Story");
    await completeDialogueChoice();
    await clickButton(
      "Walk to the workshop",
      "Main Story",
      "Craftsman's Workshop"
    );
    await clickButton("Weave with Mr. Tan and Ben", "Main Story");
    await completeDialogueChoice();
    check(
      "Calm no-failure weaving unlocks the ending",
      /ENDING/i.test(await page.eval(`document.getElementById("chapter-label").textContent`))
    );
    await recordStoryTrackerTitle();
    await page.shot(`${SHOT_DIR}/07-evening-reflection.png`);
  };

  const completeEnding = async () => {
    await clickButton(
      `Return to ${SMOKE_PLAYER_NAME}'s house`,
      "Main Story",
      SMOKE_PLAYER_FLAT,
    );
    await clickButton("Listen at the last door", "Main Story");
    await completeDialogueChoice();
    check(
      "The Last Door ends in free exploration",
      /Story complete/i.test(await page.eval(`document.getElementById("chapter-label").textContent`))
    );
    await recordStoryTrackerTitle();
    const saved = JSON.parse(await page.eval(`localStorage.getItem("kampung-sg.campaign.v1")`));
    check(
      "Full campaign autosave retains every completed chapter",
      saved?.completedChapters?.length === 5,
      JSON.stringify(saved?.completedChapters)
    );
    // Let the final dialogue close and Phaser finish its scene wake before
    // asking Chrome to composite the day-complete frame. Capturing during that
    // hand-off can starve the next Runtime.evaluate in screenshot mode even
    // though the page and campaign state are otherwise healthy.
    await sleep(700);
    await page.shot(`${SHOT_DIR}/08-day-complete.png`);
    await sleep(300);
  };

  const verifyResidentLife = async () => {
    await clickJournalItem("Places", "Kampung SG Village");
    await sleep(500);
    await page.eval(`document.getElementById("sandbox-stage").focus({ preventScroll: true })`);
    const initial = await page.eval(
      `window.__kampungSmoke?.getMotionSnapshot?.() ?? null`
    );
    if (!initial || initial.locationId !== "estate") {
      throw new Error("Smoke-only resident motion snapshot was unavailable");
    }
    consequenceArtEvidence.before = initial.consequenceArt;
    terrainDetailEvidence = initial.terrainDetail;
    diagnostics.push(
      terrainDetailEvidence
        ? `  TILE  grass-colours=${terrainDetailEvidence.grassColourCount}; ` +
          `path-colours=${terrainDetailEvidence.pathColourCount}; ` +
          `path-edges=${terrainDetailEvidence.pathEdgeTransitions}; ` +
          `landscape=${terrainDetailEvidence.landscapePropCount} props/` +
          `${terrainDetailEvidence.landscapeTextureCount} forms/` +
          `${terrainDetailEvidence.foliageColourCount} colours; ` +
          `exterior=${terrainDetailEvidence.exteriorPropCount} props/` +
          `${terrainDetailEvidence.exteriorPropTextureCount} forms; ` +
          `story-clusters=${terrainDetailEvidence.storyClusterCount}/` +
          `${terrainDetailEvidence.storyClusterTextureCount} forms; ` +
          `ground-accents=${terrainDetailEvidence.groundAccentCount}; ` +
          `facades=${terrainDetailEvidence.facadeColourCount} colours/` +
          `${terrainDetailEvidence.facadeEdgeTransitions} edges/` +
          `${(terrainDetailEvidence.facadeDarkPixelRatio * 100).toFixed(1)}% dark; ` +
          `facade-depth=${terrainDetailEvidence.facadeDepthBuildingCount} buildings/` +
          `${terrainDetailEvidence.facadeEntryRecessCount} recesses/` +
          `${terrainDetailEvidence.facadeRoofStyleCount} roof styles; ` +
          `bicycle-bays=${terrainDetailEvidence.bicycleRackCount}; ` +
          `motor-vehicles=${terrainDetailEvidence.motorVehicleCount}; ` +
          `layout-issues=${terrainDetailEvidence.layoutIssueCount}; ` +
          `occlusion-layers=${terrainDetailEvidence.buildingOcclusionLayerCount}; ` +
          `obstacles=${initial.obstacleCount}`
        : "  TILE  terrain detail evidence missing"
    );

    // Losing focus must silence the estate. Not just hiding the tab - clicking
  // onto another window on the same screen kept the footsteps audible.
  const attentionEvidence = await page.eval(`
    (async () => {
      const read = () => window.__kampungSmoke?.getAudioState?.() ?? null;
      // suspend()/resume() are async, so settle before reading the state.
      const settle = async () => {
        for (let i = 0; i < 40; i += 1) await new Promise((r) => setTimeout(r, 25));
      };
      const unlocked = read();
      window.dispatchEvent(new Event("blur"));
      await settle();
      const blurred = read();
      window.dispatchEvent(new Event("focus"));
      await settle();
      return { unlocked, blurred, refocused: read() };
    })()
  `);
  check(
    "Losing window focus suspends the estate's audio",
    // A context only exists once a gesture has unlocked it; if it never
    // started there is nothing to silence and nothing to assert.
    attentionEvidence.unlocked === null
      || (attentionEvidence.blurred === "suspended"
        && attentionEvidence.refocused !== "suspended"),
    JSON.stringify(attentionEvidence)
  );

  // The shared bicycle rack sits on Block 9's west verge. The player's own
    // house now stands between the front door and that verge, so route north up
    // the west sheltered walk first rather than trying to walk through it.
    await walkToAxis("x", 480);
    await walkToAxis("y", 470);
    await walkToAxis("x", 190);
    // Finish walking south so the player ends up facing the rack below them.
    await walkToAxis("y", 535);
    await waitForPageCondition(
      `window.__kampungSmoke?.getMotionSnapshot?.().nearbyInteractionId
        === "estate-shared-bicycles"
        && window.__kampungSmoke?.getMotionSnapshot?.()
          .tapNavigation.controlsEnabled === true`,
      "the shared bicycle approach marker",
      1200,
    );
    const detailPrompt = await page.eval(`
      (() => ({
        text: document.getElementById("nearby-text").textContent,
        touchLabel: document.getElementById("btn-touch-interact").textContent,
        nearbyId:
          window.__kampungSmoke?.getMotionSnapshot?.().nearbyInteractionId
          ?? null,
        nearbyPoint:
          window.__kampungSmoke?.getMotionSnapshot?.().nearbyInteractionPoint
          ?? null,
        player:
          window.__kampungSmoke?.getMotionSnapshot?.().player
          ?? null,
        visibleFlavourMarkers:
          window.__kampungSmoke?.getMotionSnapshot?.()
            .visibleFlavourMarkerCount
          ?? null,
        visibleMarkerPlates:
          window.__kampungSmoke?.getMotionSnapshot?.()
            .visibleMarkerPlateCount
          ?? null,
      }))()
    `);
    await page.eval(`window.__kampungSmoke.tryInteract()`);
    await sleep(500);
    await page.eval(`
      if (!document.getElementById("dialog-overlay").classList.contains("active")) {
        window.__kampungSmoke.tryInteract();
      }
    `);
    await waitForRenderedDialogueLine("the shared bicycle detail line");
    const detailFacing = await page.eval(
      `window.__kampungSmoke?.getMotionSnapshot?.() ?? null`
    );
    const detailDialogue = await page.eval(`
      (() => ({
        open: document.getElementById("dialog-overlay").classList.contains("active"),
        title: document.getElementById("dialog-kicker").textContent,
        speaker: document.getElementById("dialog-speaker").textContent,
        line: document.getElementById("dialog-text-a11y").textContent,
        portraitId:
          document.querySelector("#dialog-portrait svg")?.dataset.portraitId
          ?? null,
      }))()
    `);
    await page.shot(`${SHOT_DIR}/25-estate-detail.png`);
    await page.send("Emulation.setDeviceMetricsOverride", {
      width: 360,
      height: 780,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sleep(500);
    const mobileDetail = await page.eval(`
      (() => {
        const card = document.querySelector("#dialog-overlay .dialog-card");
        const rect = card?.getBoundingClientRect();
        const close = document.getElementById("btn-dialog-close");
        const closeRect = close?.getBoundingClientRect();
        return {
          active:
            document.getElementById("dialog-overlay")
              .classList.contains("active"),
          overflow: document.documentElement.scrollWidth > 361,
          cardInside:
            rect
            && rect.left >= 0
            && rect.right <= window.innerWidth + 1
            && rect.top >= 0
            && rect.bottom <= window.innerHeight + 1,
          closeTarget:
            closeRect
            && closeRect.width >= 48
            && closeRect.height >= 48,
          line:
            document.getElementById("dialog-text-a11y").textContent,
        };
      })()
    `);
    await page.shot(`${SHOT_DIR}/26-mobile-estate-detail.png`);
    await page.send("Emulation.clearDeviceMetricsOverride");
    await sleep(500);
    await page.eval(`document.getElementById("btn-dialog-close").click()`);
    await sleep(180);

    await page.eval(`document.getElementById("sandbox-stage").focus({ preventScroll: true })`);
    await page.key("keyDown", "ArrowRight", "ArrowRight", 39);
    const playerWalkTextureKeys = await page.eval(`
      new Promise((resolve) => {
        const keys = new Set();
        const startedAt = performance.now();
        const sample = (now) => {
          const snapshot =
            window.__kampungSmoke?.getMotionSnapshot?.() ?? null;
          if (snapshot?.playerTextureKey) {
            keys.add(snapshot.playerTextureKey);
          }
          if (now - startedAt >= 980) {
            resolve(Array.from(keys));
            return;
          }
          requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      })
    `);
    await page.key("keyUp", "ArrowRight", "ArrowRight", 39);
    await sleep(120);
    const raviPosition = await page.eval(`
      (() => {
        const ravi = window.__kampungSmoke?.getMotionSnapshot?.().npcs
          ?.find((npc) => npc.npcId === "uncle-ravi");
        return ravi ? { x: ravi.x, y: ravi.y } : null;
      })()
    `);
    if (!raviPosition) {
      throw new Error("Uncle Ravi's registry route was unavailable");
    }
    await page.eval(`
      window.__kampungSmoke.setPlayerPosition(
        ${JSON.stringify(raviPosition.x - 82)},
        ${JSON.stringify(raviPosition.y)}
      );
      document.getElementById("sandbox-stage").focus({ preventScroll: true });
    `);
    await sleep(180);

    const before = await page.eval(
      `window.__kampungSmoke?.getMotionSnapshot?.() ?? null`
    );
    const playerIdleTexturePromise = page.eval(`
      new Promise((resolve) => {
        const keys = new Set();
        const startedAt = performance.now();
        const sample = (now) => {
          const snapshot =
            window.__kampungSmoke?.getMotionSnapshot?.() ?? null;
          if (snapshot?.playerTextureKey) {
            keys.add(snapshot.playerTextureKey);
          }
          if (now - startedAt >= 2500) {
            resolve(Array.from(keys));
            return;
          }
          requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      })
    `);
    const residentTexturePromise = page.eval(`
      new Promise((resolve) => {
        const keysByNpc = new Map();
        const startedAt = performance.now();
        const sample = (now) => {
          const snapshot =
            window.__kampungSmoke?.getMotionSnapshot?.() ?? null;
          for (const npc of snapshot?.npcs ?? []) {
            if (!npc.isMoving) continue;
            const keys = keysByNpc.get(npc.npcId) ?? new Set();
            keys.add(npc.textureKey);
            keysByNpc.set(npc.npcId, keys);
          }
          if (now - startedAt >= 2300) {
            resolve(
              Object.fromEntries(
                Array.from(keysByNpc, ([npcId, keys]) => [
                  npcId,
                  Array.from(keys),
                ])
              )
            );
            return;
          }
          requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      })
    `);
    const ambientActivityTexturePromise = page.eval(`
      new Promise((resolve) => {
        const keysByActivity = new Map();
        const startedAt = performance.now();
        const sample = (now) => {
          const snapshot =
            window.__kampungSmoke?.getMotionSnapshot?.() ?? null;
          for (const activity of snapshot?.ambientActivities ?? []) {
            if (!activity.visible) continue;
            const keys = keysByActivity.get(activity.id) ?? new Set();
            keys.add(activity.textureKey);
            keysByActivity.set(activity.id, keys);
          }
          if (now - startedAt >= 1500) {
            resolve(
              Object.fromEntries(
                Array.from(keysByActivity, ([activityId, keys]) => [
                  activityId,
                  Array.from(keys),
                ])
              )
            );
            return;
          }
          requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      })
    `);
    const ambientFlutterTexturePromise = page.eval(`
      new Promise((resolve) => {
        const keysByFlutter = new Map();
        const startedAt = performance.now();
        const sample = (now) => {
          const snapshot =
            window.__kampungSmoke?.getMotionSnapshot?.() ?? null;
          for (const flutter of snapshot?.ambientFlutter ?? []) {
            if (!flutter.visible) continue;
            const keys = keysByFlutter.get(flutter.id) ?? new Set();
            keys.add(flutter.textureKey);
            keysByFlutter.set(flutter.id, keys);
          }
          if (now - startedAt >= 1500) {
            resolve(
              Object.fromEntries(
                Array.from(keysByFlutter, ([flutterId, keys]) => [
                  flutterId,
                  Array.from(keys),
                ])
              )
            );
            return;
          }
          requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      })
    `);
    const pacingPromise = sampleFramePacing();
    await sleep(2600);
    const after = await page.eval(
      `window.__kampungSmoke?.getMotionSnapshot?.() ?? null`
    );
    const residentTextureKeys = await residentTexturePromise;
    const ambientActivityTextureKeys = await ambientActivityTexturePromise;
    const ambientFlutterTextureKeys = await ambientFlutterTexturePromise;
    const playerIdleTextureKeys = await playerIdleTexturePromise;
    wanderingFramePacing = await pacingPromise;
    if (!after || after.locationId !== "estate") {
      throw new Error("Resident motion snapshot disappeared during the route sample");
    }

    const startingPositions = new Map(
      before.npcs.map((npc) => [npc.npcId, npc])
    );
    const startingAmbientPositions = new Map(
      before.ambientActors.map((actor) => [actor.id, actor])
    );
    const startingFlutterPositions = new Map(
      before.ambientFlutter.map((flutter) => [flutter.id, flutter])
    );
    const movedNpcIds = after.npcs
      .filter((npc) => {
        const start = startingPositions.get(npc.npcId);
        return start && Math.hypot(npc.x - start.x, npc.y - start.y) >= 5;
      })
      .map((npc) => npc.npcId);
    const movedAmbientIds = after.ambientActors
      .filter((actor) => {
        const start = startingAmbientPositions.get(actor.id);
        return start && Math.hypot(actor.x - start.x, actor.y - start.y) >= 5;
      })
      .map((actor) => actor.id);
    const movedFlutterIds = after.ambientFlutter
      .filter((flutter) => {
        const start = startingFlutterPositions.get(flutter.id);
        return (
          flutter.visible
          && start
          && Math.hypot(flutter.x - start.x, flutter.y - start.y) >= 2
        );
      })
      .map((flutter) => flutter.id);
    const residentFourFrameIds = Object.entries(residentTextureKeys)
      .filter(([, textureKeys]) => {
        const frames = new Set(
          textureKeys
            .map((key) => key.match(/-(?:down|up|side)-([0-3])$/)?.[1])
            .filter(Boolean)
        );
        return frames.size === 4;
      })
      .map(([npcId]) => npcId);
    const playerWalkFrames = new Set(
      playerWalkTextureKeys
        .map((key) => key.match(/campaign-player-(?:down|up|side)-([0-3])$/)?.[1])
        .filter(Boolean)
    );
    const ambientActivityTwoFrameIds = Object.entries(
      ambientActivityTextureKeys
    )
      .filter(([, textureKeys]) => {
        const frames = new Set(
          textureKeys
            .map((key) => key.match(/ambient-task-[a-z-]+-([01])$/)?.[1])
            .filter(Boolean)
        );
        return frames.size === 2;
      })
      .map(([activityId]) => activityId);
    const ambientFlutterTwoFrameIds = Object.entries(
      ambientFlutterTextureKeys
    )
      .filter(([, textureKeys]) => {
        const frames = new Set(
          textureKeys
            .map((key) => key.match(/ambient-flutter-[a-z-]+-([01])$/)?.[1])
            .filter(Boolean)
        );
        return frames.size === 2;
      })
      .map(([flutterId]) => flutterId);
    const nearbyNpc = after.npcs.find((npc) => npc.npcId === "uncle-ravi");
    const detailFacingAligned = (() => {
      if (
        !detailPrompt.player
        || !detailPrompt.nearbyPoint
        || !detailFacing
      ) return false;
      const deltaX = detailPrompt.nearbyPoint.x - detailPrompt.player.x;
      const deltaY = detailPrompt.nearbyPoint.y - detailPrompt.player.y;
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        return (
          detailFacing.playerFacing === "side"
          && detailFacing.playerFlipX === (deltaX < 0)
        );
      }
      return (
        detailFacing.playerFacing === (deltaY < 0 ? "up" : "down")
        && detailFacing.playerFlipX === false
      );
    })();
    const nearbyDistance = nearbyNpc
      ? Math.hypot(
          after.player.x - nearbyNpc.x,
          after.player.y - nearbyNpc.y
        )
      : Number.POSITIVE_INFINITY;
    const expectedFacing = nearbyNpc
      ? Math.abs(after.player.x - nearbyNpc.x) >
        Math.abs(after.player.y - nearbyNpc.y)
        ? "side"
        : after.player.y - nearbyNpc.y < 0
          ? "up"
          : "down"
      : null;
    const expectedFlip =
      expectedFacing === "side" && after.player.x - nearbyNpc.x < 0;
    const markerSync = after.npcs.every(
      (npc) =>
        npc.interactionX !== null
        && npc.interactionY !== null
        && npc.markerX !== null
        && npc.markerY !== null
        && Math.abs(npc.x - npc.interactionX) < 0.1
        && Math.abs(npc.y - npc.interactionY) < 0.1
        && Math.abs(npc.x - npc.markerX) < 0.1
        && Math.abs(npc.y - 96 - npc.markerY) < 0.1
    );
    residentMotionEvidence = {
      movedNpcIds,
      nearbyStopped:
        nearbyDistance <= 122
        && nearbyNpc?.isMoving === false
        && nearbyNpc?.facing === expectedFacing
        && nearbyNpc?.flipX === expectedFlip,
      markerSync,
      directionalTexture:
        nearbyNpc?.textureKey.includes(`-${nearbyNpc.facing}-`) === true,
      flavourInteractionCount: initial.flavourInteractionCount,
      physicalDetail:
        detailPrompt.nearbyId === "estate-shared-bicycles"
        && initial.visibleFlavourMarkerCount === 0
        && detailPrompt.visibleFlavourMarkers === 1
        && detailPrompt.visibleMarkerPlates === 1
        && /shared bicycles/i.test(detailPrompt.text)
        && detailPrompt.touchLabel === "Look"
        && detailDialogue.open
        && detailDialogue.title === "Shared bicycles"
        && detailDialogue.speaker === "The estate"
        && /unit numbers/i.test(detailDialogue.line)
        && detailDialogue.portraitId === "estate"
        && mobileDetail.active
        && !mobileDetail.overflow
        && mobileDetail.cardInside
        && mobileDetail.closeTarget
        && /unit numbers/i.test(mobileDetail.line),
      playerFacesInteraction: detailFacingAligned,
      playerWalkFrames: playerWalkFrames.size,
      playerIdleBlink:
        playerIdleTextureKeys.some((key) => key.endsWith("-blink")),
      residentFourFrameIds,
      characterArt: initial.characterArt,
      movedAmbientIds,
      ambientDirectionalTexture: after.ambientActors.every((actor) =>
        /ambient-cat-(ginger|tabby)-[01]$/.test(actor.textureKey)
      ),
      ambientActivityCount: initial.ambientActivities.length,
      visibleAmbientActivityCount: initial.visibleAmbientActivityCount,
      ambientActivityTwoFrameIds,
      ambientActivitiesAnimated:
        before.ambientActivityTick !== null
        && after.ambientActivityTick !== null
        && after.ambientActivityTick > before.ambientActivityTick,
      ambientFlutterCount: initial.ambientFlutter.length,
      visibleAmbientFlutterCount: initial.visibleAmbientFlutterCount,
      movedFlutterIds,
      ambientFlutterTwoFrameIds,
      ambientFlutterAnimated:
        before.ambientFlutterTick !== null
        && after.ambientFlutterTick !== null
        && after.ambientFlutterTick > before.ambientFlutterTick,
      laundryChanged:
        before.laundryTick !== null
        && after.laundryTick !== null
        && after.laundryTick > before.laundryTick,
      cameraZoom: before.cameraZoom,
      pondRippleCount: before.pondRippleCount,
      pondAnimated:
        before.pondRippleCount === 3
        && after.pondRippleCount === 3
        && before.pondRipplePhase !== null
        && after.pondRipplePhase !== null
        && Math.min(
          Math.abs(after.pondRipplePhase - before.pondRipplePhase),
          1 - Math.abs(after.pondRipplePhase - before.pondRipplePhase),
        ) >= 0.1,
    };
    diagnostics.push(
      `  LIFE  ${movedNpcIds.length} residents changed position; ` +
        `nearby stop/face=${residentMotionEvidence.nearbyStopped}; ` +
        `markers synchronized=${markerSync}; ` +
        `details=${residentMotionEvidence.flavourInteractionCount}; ` +
        `physical-detail=${residentMotionEvidence.physicalDetail}; ` +
        `player-faces-interaction=${residentMotionEvidence.playerFacesInteraction}; ` +
        `player-frames=${residentMotionEvidence.playerWalkFrames}; ` +
        `player-idle-blink=${residentMotionEvidence.playerIdleBlink}; ` +
        `resident-frames=${residentFourFrameIds.join(",") || "none"}; ` +
        `cast=${residentMotionEvidence.characterArt.residentCount}` +
        `(${residentMotionEvidence.characterArt.youngCount}y/` +
        `${residentMotionEvidence.characterArt.adultCount}a/` +
        `${residentMotionEvidence.characterArt.elderCount}e)/` +
        `${residentMotionEvidence.characterArt.hairStyleCount} hair/` +
        `${residentMotionEvidence.characterArt.outfitCount} outfits; ` +
        `ambient=${movedAmbientIds.join(",") || "none"}; ` +
        `activities=${ambientActivityTwoFrameIds.join(",") || "none"}; ` +
        `flutter=${movedFlutterIds.join(",") || "none"}; ` +
        `laundry animated=${residentMotionEvidence.laundryChanged}; ` +
        `pond animated=${residentMotionEvidence.pondAnimated}; ` +
        `zoom=${residentMotionEvidence.cameraZoom.toFixed(2)}x`
    );
    diagnostics.push(
      `  PERF  ${wanderingFramePacing.renderer} resident routes: ` +
        `avg ${wanderingFramePacing.average.toFixed(2)}ms, ` +
        `p95 ${wanderingFramePacing.p95.toFixed(2)}ms, ` +
        `worst ${wanderingFramePacing.worst.toFixed(2)}ms`
    );
    await page.shot(`${SHOT_DIR}/10-living-estate.png`);

    // Carry-and-deliver: pick an errand up on one side of the estate, walk it
    // to the other, hand it over. Driven through the real interaction path so
    // the prompt, the HUD, the carried sprite and the objective are all proved
    // together rather than asserted from state alone.
    const runErrand = async () => {
      // Wall time can pass without the scene stepping (evidence screenshots
      // pause rendering), so wait on real animation frames.
      const waitFrames = (duration) => page.eval(`
        new Promise((resolve) => {
          const startedAt = performance.now();
          const fallback = window.setTimeout(() => resolve(true), ${duration} + 2000);
          const tick = (now) => {
            if (now - startedAt >= ${duration}) {
              window.clearTimeout(fallback);
              resolve(true);
              return;
            }
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        })
      `);
      const errand = await page.eval(`
        (() => {
          const first = window.__kampungErrands?.[0] ?? null;
          return first ? { id: first.id, item: first.item,
            pickup: first.pickup, dropoff: first.dropoff } : null;
        })()
      `);
      if (!errand) return { skipped: "no errand registry exposed" };

      const step = async (point, expectPrefix) => {
        await page.eval(`
          window.__kampungSmoke.setPlayerPosition(${point.x}, ${point.y});
          document.getElementById("sandbox-stage").focus({ preventScroll: true });
        `);
        await waitFrames(720);
        const nearby = await page.eval(
          `window.__kampungSmoke?.getMotionSnapshot?.()?.nearbyInteractionId ?? null`
        );
        await page.eval(`window.__kampungSmoke.tryInteract()`);
        await waitFrames(480);
        await page.eval(`document.getElementById("btn-dialog-close")?.click()`);
        await waitFrames(240);
        return { nearby, matched: String(nearby ?? "").startsWith(expectPrefix) };
      };

      const picked = await step(errand.pickup, "errand-pickup:");
      const carrying = await page.eval(`
        (() => {
          const hud = document.getElementById("carry-indicator");
          return {
            hudVisible: hud instanceof HTMLElement && !hud.hidden,
            hudText: hud?.textContent?.trim() ?? "",
          };
        })()
      `);
      const dropped = await step(errand.dropoff, "errand-dropoff:");
      const delivered = await page.eval(`
        (() => {
          const hud = document.getElementById("carry-indicator");
          return { hudHidden: hud instanceof HTMLElement && hud.hidden };
        })()
      `);
      return { errand: errand.id, picked, carrying, dropped, delivered };
    };

    const errandEvidence = await runErrand();
    check(
      "An errand can be picked up, carried across the estate, and delivered",
      Boolean(
        errandEvidence.picked?.matched
        && errandEvidence.carrying?.hudVisible
        && /^Carrying /.test(errandEvidence.carrying?.hudText ?? "")
        && errandEvidence.dropped?.matched
        && errandEvidence.delivered?.hudHidden
      ),
      JSON.stringify(errandEvidence)
    );
    // Leave the north-crossing prop line before travelling east. A straight
    // axis-only hold can correctly meet the planter/trolley collision shells;
    // the player route goes around them just as a real player would.
    await walkToAxis("y", 650);
    await walkToAxis("x", 1280);
    await page.shot(`${SHOT_DIR}/27-ambient-micro-scenes.png`);
    await walkToAxis("y", 400);
    await walkToAxis("x", 700);
  };

  const verifyReusableEstateDoor = async () => {
    const waitForLiveFrames = (duration) => page.eval(`
      new Promise((resolve) => {
        const startedAt = performance.now();
        const fallback = window.setTimeout(() => resolve(true), ${duration} + 2000);
        const tick = (now) => {
          if (now - startedAt >= ${duration}) {
            window.clearTimeout(fallback);
            resolve(true);
            return;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      })
    `);

    const useNearbyDoor = async (
      x,
      y,
      doorId,
      expectedLocation,
    ) => {
      await page.eval(`
        window.__kampungSmoke.setPlayerPosition(${x}, ${y});
        document.getElementById("sandbox-stage").focus({ preventScroll: true });
      `);
      await waitForPageCondition(
        `window.__kampungSmoke?.getMotionSnapshot?.()?.nearbyInteractionId
          === ${JSON.stringify(doorId)}
          && window.__kampungSmoke?.getMotionSnapshot?.()
            ?.tapNavigation?.controlsEnabled === true`,
        `${doorId} to become interactive`,
        1800,
      );
      // `setPlayerPosition` installs a Phaser-time interaction latch. Evidence
      // screenshots can briefly pause rendering, so wait for live animation
      // frames rather than assuming Node wall time advanced the scene clock.
      await waitForLiveFrames(720);
      const nearbyId = await page.eval(
        `window.__kampungSmoke?.getMotionSnapshot?.()?.nearbyInteractionId ?? null`
      );
      if (nearbyId !== doorId) {
        throw new Error(`Expected nearby door ${doorId}, found ${nearbyId}`);
      }
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const entered = await page.eval(`
          window.__kampungSmoke?.getMotionSnapshot?.()?.locationId
            === ${JSON.stringify(expectedLocation)}
        `);
        if (entered) break;
        await page.eval(`window.__kampungSmoke.tryInteract()`);
        await waitForLiveFrames(720);
      }
      await waitForPageCondition(
        `window.__kampungSmoke?.getMotionSnapshot?.()?.locationId
          === ${JSON.stringify(expectedLocation)}`,
        `${doorId} to enter ${expectedLocation}`,
        5000,
      );
      await sleep(260);
    };

    const entryDoorAtRest = await page.eval(`
      (() => {
        const door = window.__kampungSmoke?.getMotionSnapshot?.()?.doors?.find(
          (candidate) => candidate.id === "estate-hawker"
        );
        return {
          state: door?.state ?? null,
          blockerEnabled: door?.blockerEnabled ?? null,
          leafAngles: door?.leafAngles ?? [],
          leafScales: door?.leafScales ?? [],
        };
      })()
    `);

    const readReturnedDoor = (doorId) => page.eval(`
      (() => {
        const snapshot = window.__kampungSmoke?.getMotionSnapshot?.();
        const door = snapshot?.doors?.find(
          (candidate) => candidate.id === ${JSON.stringify(doorId)}
        );
        return {
          locationId: snapshot?.locationId ?? null,
          state: door?.state ?? null,
          blockerEnabled: door?.blockerEnabled ?? null,
          leafAngles: door?.leafAngles ?? [],
          leafScales: door?.leafScales ?? [],
          controlsEnabled: snapshot?.tapNavigation?.controlsEnabled ?? false,
          activeElement: document.activeElement?.id ?? null,
          documentFocused: document.hasFocus(),
        };
      })()
    `);

    await useNearbyDoor(970, 400, "estate-hawker", "hawker-centre");
    const hawkerExitAtRest = await readReturnedDoor("hawker-exit");
    await useNearbyDoor(480, 500, "hawker-exit", "estate");
    const entryReturn = await readReturnedDoor("estate-hawker");
    await useNearbyDoor(1550, 400, "estate-kopitiam", "kopitiam");
    await useNearbyDoor(480, 500, "kopitiam-exit", "estate");
    const firstReturn = await readReturnedDoor("estate-kopitiam");
    await useNearbyDoor(1550, 400, "estate-kopitiam", "kopitiam");
    await useNearbyDoor(480, 500, "kopitiam-exit", "estate");
    const secondReturn = await readReturnedDoor("estate-kopitiam");
    const returnedDoorIsReusable = (state) =>
      state.locationId === "estate"
      && state.state === "closed"
      && state.blockerEnabled === true
      && state.leafAngles.length > 0
      && state.leafAngles.every((angle) => angle === 0)
      && state.leafScales.length > 0
      && state.leafScales.every(({ x, y }) => x === 1 && y === 1)
      && state.controlsEnabled
      && state.activeElement === "sandbox-stage"
      && state.documentFocused;
    doorLifecycleEvidence = {
      entryReady:
        entryDoorAtRest.state === "closed"
        && entryDoorAtRest.blockerEnabled === true
        && entryDoorAtRest.leafAngles.every((angle) => angle === 0)
        && entryDoorAtRest.leafScales.length === 2
        && entryDoorAtRest.leafScales.every(({ x, y }) => x === 1 && y === 1),
      entryOpened: true,
      entryReturn: returnedDoorIsReusable(entryReturn),
      hawkerExitReady:
        hawkerExitAtRest.locationId === "hawker-centre"
        && hawkerExitAtRest.state === "closed"
        && hawkerExitAtRest.blockerEnabled === true
        && hawkerExitAtRest.leafAngles.length === 2
        && hawkerExitAtRest.leafAngles.every((angle) => angle === 0)
        && hawkerExitAtRest.leafScales.length === 2
        && hawkerExitAtRest.leafScales.every(({ x, y }) => x === 1 && y === 1),
      firstReturn: returnedDoorIsReusable(firstReturn),
      secondEntry: true,
      secondReturn: returnedDoorIsReusable(secondReturn),
      entryState: entryReturn,
      firstState: firstReturn,
      secondState: secondReturn,
    };
    diagnostics.push(
      `  DOOR  entry=closed/open/closed=${doorLifecycleEvidence.entryReady}/` +
        `${doorLifecycleEvidence.entryOpened}/${doorLifecycleEvidence.entryReturn}; ` +
        `hawker-exit=closed=${doorLifecycleEvidence.hawkerExitReady}; ` +
        `reusable=${doorLifecycleEvidence.firstReturn}/` +
        `${doorLifecycleEvidence.secondEntry}/${doorLifecycleEvidence.secondReturn}; ` +
        `focus=${secondReturn.activeElement}/${secondReturn.documentFocused}; ` +
        `controls=${secondReturn.controlsEnabled}`
    );
  };

  const verifyReducedEnvironment = async () => {
    await clickJournalItem("Places", "Kampung SG Village");
    await sleep(500);
    const before = await page.eval(
      `window.__kampungSmoke?.getMotionSnapshot?.() ?? null`
    );
    await sleep(1500);
    const after = await page.eval(
      `window.__kampungSmoke?.getMotionSnapshot?.() ?? null`
    );
    if (!before || !after || after.locationId !== "estate") {
      throw new Error("Reduced-motion environment snapshot was unavailable");
    }

    const positionsStayStill = (starting, ending) => {
      const startById = new Map(starting.map((item) => [item.id ?? item.npcId, item]));
      return ending.every((item) => {
        const start = startById.get(item.id ?? item.npcId);
        return start && Math.hypot(item.x - start.x, item.y - start.y) < 0.1;
      });
    };
    reducedMotionEvidence = {
      residentsStill: positionsStayStill(before.npcs, after.npcs),
      ambientStill: positionsStayStill(
        before.ambientActors,
        after.ambientActors
      ),
      ambientActivitiesStill:
        before.ambientActivityTick === 0
        && after.ambientActivityTick === 0
        && before.ambientActivities.length === 5
        && after.ambientActivities.every((activity) => {
          const starting = before.ambientActivities.find(
            (candidate) => candidate.id === activity.id
          );
          return starting?.textureKey === activity.textureKey;
        }),
      ambientFlutterStill:
        before.ambientFlutterTick === 0
        && after.ambientFlutterTick === 0
        && before.ambientFlutter.length === 8
        && after.visibleAmbientFlutterCount === 8
        && positionsStayStill(before.ambientFlutter, after.ambientFlutter)
        && after.ambientFlutter.every((flutter) => {
          const starting = before.ambientFlutter.find(
            (candidate) => candidate.id === flutter.id
          );
          return starting?.textureKey === flutter.textureKey;
        }),
      laundryStill:
        before.laundryTick === 0
        && after.laundryTick === before.laundryTick
        && after.laundryFrame === before.laundryFrame,
      pondStill:
        before.pondRippleCount === 3
        && after.pondRippleCount === 3
        && before.pondRipplePhase === 0
        && after.pondRipplePhase === 0,
      stepPuffsStill:
        before.visibleStepPuffs === 0
        && after.visibleStepPuffs === 0,
      playerIdleStill:
        before.playerIdleBlinking === false
        && after.playerIdleBlinking === false
        && !before.playerTextureKey.endsWith("-blink")
        && !after.playerTextureKey.endsWith("-blink"),
      buildingOcclusionInstant:
        before.buildingOcclusionMotion === "instant"
        && after.buildingOcclusionMotion === "instant"
        // Twelve buildings now that the four homes are real houses.
        && after.buildingOcclusion.length === 12,
    };
    diagnostics.push(
      `  MOTION  reduced residents=${reducedMotionEvidence.residentsStill}; ` +
        `ambient=${reducedMotionEvidence.ambientStill}; ` +
        `activities=${reducedMotionEvidence.ambientActivitiesStill}; ` +
        `flutter=${reducedMotionEvidence.ambientFlutterStill}; ` +
        `laundry=${reducedMotionEvidence.laundryStill}; ` +
        `pond=${reducedMotionEvidence.pondStill}; ` +
        `step-puffs=${reducedMotionEvidence.stepPuffsStill}; ` +
        `player-idle=${reducedMotionEvidence.playerIdleStill}; ` +
        `occlusion-instant=${reducedMotionEvidence.buildingOcclusionInstant}`
    );
  };

  const verifyMonsoonWeather = async (motionMode) => {
    const before = await page.eval(
      `window.__kampungSmoke?.getMotionSnapshot?.() ?? null`
    );
    if (!before || before.locationId !== "estate" || !before.monsoonActive) {
      throw new Error("Chapter 2 monsoon snapshot was unavailable");
    }
    if (motionMode === "normal") {
      consequenceArtEvidence.exterior = before.consequenceArt;
    } else {
      consequenceArtEvidence.flowers = before.consequenceArt;
    }

    const pacingPromise =
      motionMode === "normal" ? sampleFramePacing() : null;
    await sleep(1300);
    const after = await page.eval(
      `window.__kampungSmoke?.getMotionSnapshot?.() ?? null`
    );
    if (!after || after.locationId !== "estate" || !after.monsoonActive) {
      throw new Error("Chapter 2 monsoon disappeared during its evidence sample");
    }

    const phaseDistance = (start, end) => {
      if (start === null || end === null) return 0;
      const distance = Math.abs(end - start);
      return Math.min(distance, 1 - distance);
    };
    const shelteredNpcIds = after.npcs
      .filter(
        (npc) =>
          npc.x >= 280
          && npc.x <= 580
          && npc.y >= 630
          && npc.y <= 690
      )
      .map((npc) => npc.npcId);
    const catsSheltered = after.ambientActors.every(
      (actor) =>
        actor.x >= 490
        && actor.x <= 590
        && actor.y >= 665
        && actor.y <= 695
        && actor.isMoving === false
    );

    if (motionMode === "normal") {
      monsoonFramePacing = await pacingPromise;
      monsoonWeatherEvidence = {
        active: before.monsoonActive && after.monsoonActive,
        rainPool:
          before.rainStreakCount === 64
          && after.rainStreakCount === 64,
        rainVisible: after.visibleRainStreakCount >= 36,
        rainAnimated: phaseDistance(before.rainPhase, after.rainPhase) >= 0.15,
        puddles:
          before.puddleRippleCount === 10
          && after.puddleRippleCount === 10,
        puddlesAnimated:
          phaseDistance(
            before.puddleRipplePhase,
            after.puddleRipplePhase
          ) >= 0.15,
        shelterDry:
          after.shelterDry
          && after.rainStreaksUnderShelter === 0,
        shelteredNpcIds,
        catsSheltered,
        ambientActivitiesStored: after.visibleAmbientActivityCount === 0,
        ambientFlutterStored: after.visibleAmbientFlutterCount === 0,
        laundryStored: after.visibleLaundryCount === 0,
        mobile: false,
      };
      // Use the broad west-spine approach before heading south. The previous
      // route depended on a 46 px decorative gap whose collision tolerance
      // became too narrow once the player's full 22 px body was considered.
      await walkToAxis("x", 700);
      await walkToAxis("y", 755);
      await walkToAxis("x", 650);
      await page.shot(`${SHOT_DIR}/22-monsoon-shelter.png`);

      await page.send("Emulation.setDeviceMetricsOverride", {
        width: 360,
        height: 780,
        deviceScaleFactor: 2,
        mobile: true,
      });
      await sleep(700);
      const mobileWeather = await page.eval(`
        (() => {
          const snapshot = window.__kampungSmoke?.getMotionSnapshot?.() ?? null;
          return {
            active: snapshot?.monsoonActive ?? false,
            rain: snapshot?.visibleRainStreakCount ?? 0,
            zoom: snapshot?.cameraZoom ?? null,
            overflow: document.documentElement.scrollWidth > 361,
          };
        })()
      `);
      await page.shot(`${SHOT_DIR}/23-mobile-monsoon.png`);
      await page.send("Emulation.clearDeviceMetricsOverride");
      await sleep(700);
      monsoonWeatherEvidence.mobile =
        mobileWeather.active
        && mobileWeather.rain >= 18
        && mobileWeather.zoom >= 0.83
        && mobileWeather.zoom <= 0.85
        && !mobileWeather.overflow;
      diagnostics.push(
        `  RAIN  active=${monsoonWeatherEvidence.active}; ` +
          `pool=${after.rainStreakCount}; ` +
          `visible=${after.visibleRainStreakCount}; ` +
          `animated=${monsoonWeatherEvidence.rainAnimated}; ` +
          `puddles=${after.puddleRippleCount}; ` +
          `dry-shelter=${monsoonWeatherEvidence.shelterDry}; ` +
          `sheltered=${shelteredNpcIds.join(",") || "none"}; ` +
          `cats=${monsoonWeatherEvidence.catsSheltered}; ` +
          `activities-stored=${monsoonWeatherEvidence.ambientActivitiesStored}; ` +
          `flutter-stored=${monsoonWeatherEvidence.ambientFlutterStored}; ` +
          `laundry-stored=${monsoonWeatherEvidence.laundryStored}; ` +
          `mobile=${monsoonWeatherEvidence.mobile}` +
          `(rain=${mobileWeather.rain}, zoom=${mobileWeather.zoom}, ` +
          `overflow=${mobileWeather.overflow})`
      );
      diagnostics.push(
        `  PERF  ${monsoonFramePacing.renderer} monsoon ambience: ` +
          `avg ${monsoonFramePacing.average.toFixed(2)}ms, ` +
          `p95 ${monsoonFramePacing.p95.toFixed(2)}ms, ` +
          `worst ${monsoonFramePacing.worst.toFixed(2)}ms`
      );
      return;
    }

    const positionsStayStill = (starting, ending) => {
      const startById = new Map(
        starting.map((item) => [item.id ?? item.npcId, item])
      );
      return ending.every((item) => {
        const start = startById.get(item.id ?? item.npcId);
        return start && Math.hypot(item.x - start.x, item.y - start.y) < 0.1;
      });
    };
    reducedMonsoonEvidence = {
      active: before.monsoonActive && after.monsoonActive,
      rainPool:
        before.rainStreakCount === 64
        && after.rainStreakCount === 64,
      rainStill:
        before.visibleRainStreakCount === 0
        && after.visibleRainStreakCount === 0
        && before.rainPhase === 0
        && after.rainPhase === 0,
      puddlesStill:
        before.puddleRippleCount === 10
        && after.puddleRippleCount === 10
        && before.puddleRipplePhase === 0
        && after.puddleRipplePhase === 0,
      residentsStill: positionsStayStill(before.npcs, after.npcs),
      catsStill: positionsStayStill(
        before.ambientActors,
        after.ambientActors
      ),
      ambientActivitiesStored:
        before.visibleAmbientActivityCount === 0
        && after.visibleAmbientActivityCount === 0,
      ambientFlutterStored:
        before.visibleAmbientFlutterCount === 0
        && after.visibleAmbientFlutterCount === 0,
      laundryStored:
        before.visibleLaundryCount === 0
        && after.visibleLaundryCount === 0,
    };
    diagnostics.push(
      `  RAIN  reduced active=${reducedMonsoonEvidence.active}; ` +
        `pool=${after.rainStreakCount}; ` +
        `rain-still=${reducedMonsoonEvidence.rainStill}; ` +
        `puddles-still=${reducedMonsoonEvidence.puddlesStill}; ` +
        `residents=${reducedMonsoonEvidence.residentsStill}; ` +
        `cats=${reducedMonsoonEvidence.catsStill}; ` +
        `activities-stored=${reducedMonsoonEvidence.ambientActivitiesStored}; ` +
        `flutter-stored=${reducedMonsoonEvidence.ambientFlutterStored}; ` +
        `laundry-stored=${reducedMonsoonEvidence.laundryStored}`
    );
    await page.shot(`${SHOT_DIR}/24-reduced-monsoon.png`);
  };

  const runCampaign = async ({
    helpers,
    attendees,
    physicalControls,
    environmentMode,
  }) => {
    await openPrologue(physicalControls);
    await inspectMrLong(physicalControls);
    if (environmentMode === "living") await verifyResidentLife();
    if (environmentMode === "reduced") await verifyReducedEnvironment();
    await recruitHelpers(helpers, environmentMode === "reduced" ? 1 : 0);
    await verifyMonsoonWeather(
      environmentMode === "reduced" ? "reduced" : "normal"
    );
    await completeChapter2(attendees);
    await completeChapter3();
    await completeEnding();
  };

  await page.send("Page.navigate", { url: TEST_URL });
  await waitForPageCondition(
    `location.origin === ${JSON.stringify(new URL(TEST_URL).origin)}
      && document.readyState === "complete"
      && document.getElementById("btn-start")`,
    "the initial title screen"
  );
  await page.eval(`localStorage.clear(); location.reload()`);
  await waitForPageCondition(
    `location.origin === ${JSON.stringify(new URL(TEST_URL).origin)}
      && document.readyState === "complete"
      && document.getElementById("btn-start")`,
    "the cleared title screen"
  );

  const loaderBefore = await page.eval(`
    (() => {
      const control = window.__kampungLoaderSmoke;
      if (!control) return null;
      control.prepareHeldLoad();
      const before = control.getSnapshot();
      control.failNextSave();
      // Start opens the character creator; "Begin the story" is what launches.
      document.getElementById("btn-start").click();
      const begin = document.getElementById("btn-begin");
      begin.click();
      begin.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      return before;
    })()
  `);
  if (!loaderBefore) throw new Error("Campaign loader smoke controls are unavailable");
  await waitForPageCondition(
    `window.__kampungLoaderSmoke?.getSnapshot?.().phase === "opening"`,
    "the held campaign loading state"
  );
  const loaderOpening = await page.eval(`
    (() => {
      const loader = document.getElementById("campaign-loader");
      const snapshot = window.__kampungLoaderSmoke.getSnapshot();
      return {
        visible: !loader.hidden && getComputedStyle(loader).display !== "none",
        message: document.getElementById("campaign-loader-message").textContent,
        busy: document.getElementById("sandbox-stage").getAttribute("aria-busy"),
        worldControlsInert:
          document.getElementById("sandbox-stage").hasAttribute("inert")
          && document.getElementById("hud-rail").hasAttribute("inert")
          && document.getElementById("interaction-prompt").hasAttribute("inert")
          && document.querySelector(".touch-controls").hasAttribute("inert")
          && document.querySelector(".topbar-actions").hasAttribute("inert"),
        buttonsDisabled:
          document.getElementById("btn-start").disabled
          && document.getElementById("btn-continue").disabled
          && document.getElementById("btn-begin").disabled,
        oneStart: snapshot.starts === ${loaderBefore.starts + 1},
        oneImport: snapshot.imports === ${loaderBefore.imports + 1},
        saveFailureSurvived: snapshot.storageAvailable === false,
      };
    })()
  `);
  await page.eval(`window.__kampungLoaderSmoke.showSlowState()`);
  await waitForPageCondition(
    `window.__kampungLoaderSmoke?.getSnapshot?.().phase === "slow"
      && document.activeElement?.id === "btn-campaign-load-cancel"`,
    "the slow-loader focus target",
    1200,
  );
  const loaderSlow = await page.eval(`
    (() => {
      const cancel = document.getElementById("btn-campaign-load-cancel");
      return {
        phase: window.__kampungLoaderSmoke.getSnapshot().phase === "slow",
        message:
          document.getElementById("campaign-loader-message").textContent
          === "Still opening; you can go back to the title",
        cancel: !cancel.hidden && getComputedStyle(cancel).display !== "none",
        cancelFocused: document.activeElement === cancel,
      };
    })()
  `);
  await page.eval(`
    document.getElementById("btn-campaign-load-cancel").click();
    window.__kampungLoaderSmoke.releaseHeldLoad();
  `);
  await waitForPageCondition(
    `document.getElementById("screen-title").classList.contains("active")
      && !window.__kampungLoaderSmoke?.getSnapshot?.().loading`,
    "loader cancellation returning to title"
  );
  await sleep(650);
  const loaderCancelled = await page.eval(`
    (() => {
      const snapshot = window.__kampungLoaderSmoke.getSnapshot();
      return {
        idle: snapshot.phase === "idle",
        noCanvas: snapshot.canvasCount === 0,
        title: document.getElementById("screen-title").classList.contains("active"),
        notBusy: document.getElementById("sandbox-stage").getAttribute("aria-busy") === "false",
        controlsEnabled:
          !document.getElementById("btn-start").disabled
          && !document.getElementById("btn-continue").disabled
          && !document.getElementById("btn-begin").disabled,
        worldControlsRestored:
          !document.getElementById("sandbox-stage").hasAttribute("inert")
          && !document.getElementById("hud-rail").hasAttribute("inert")
          && !document.getElementById("interaction-prompt").hasAttribute("inert")
          && !document.querySelector(".touch-controls").hasAttribute("inert")
          && !document.querySelector(".topbar-actions").hasAttribute("inert"),
        storageRecovered: snapshot.storageAvailable === true,
      };
    })()
  `);

  await page.eval(`
    window.__kampungLoaderSmoke.failNextLoad();
    document.getElementById("btn-continue").click();
  `);
  try {
    await waitForPageCondition(
      `window.__kampungLoaderSmoke?.getSnapshot?.().phase === "failed"`,
      "the recoverable campaign load failure"
    );
  } catch (error) {
    const loaderFailureSnapshot = await page.eval(`
      (() => ({
        loader: window.__kampungLoaderSmoke?.getSnapshot?.() ?? null,
        titleActive: document.getElementById("screen-title").classList.contains("active"),
        sandboxActive: document.getElementById("screen-sandbox").classList.contains("active"),
        continueHidden: document.getElementById("btn-continue").hidden,
        continueDisabled: document.getElementById("btn-continue").disabled,
      }))()
    `);
    throw new Error(`${error.message}; loader=${JSON.stringify(loaderFailureSnapshot)}`);
  }
  await sleep(100);
  const loaderFailed = await page.eval(`
    (() => {
      const loader = document.getElementById("campaign-loader");
      const snapshot = window.__kampungLoaderSmoke.getSnapshot();
      return {
        visible: !loader.hidden && getComputedStyle(loader).display !== "none",
        retry: !document.getElementById("btn-campaign-load-retry").hidden,
        cancel: !document.getElementById("btn-campaign-load-cancel").hidden,
        message: /could not open/i.test(
          document.getElementById("campaign-loader-message").textContent
        ),
        notBusy: document.getElementById("sandbox-stage").getAttribute("aria-busy") === "false",
        worldControlsInert:
          document.getElementById("sandbox-stage").hasAttribute("inert")
          && document.getElementById("hud-rail").hasAttribute("inert")
          && document.getElementById("interaction-prompt").hasAttribute("inert")
          && document.querySelector(".touch-controls").hasAttribute("inert")
          && document.querySelector(".topbar-actions").hasAttribute("inert"),
        retryFocused: document.activeElement?.id === "btn-campaign-load-retry",
        retryable: snapshot.cached === false && snapshot.canvasCount === 0,
        controlsEnabled: !document.getElementById("btn-continue").disabled,
      };
    })()
  `);
  const expectedLoaderError = consoleErrors.findIndex((message) =>
    message.includes("Smoke campaign loader import failure")
  );
  if (expectedLoaderError >= 0) consoleErrors.splice(expectedLoaderError, 1);
  await page.eval(`document.getElementById("btn-campaign-load-retry").click()`);
  await waitForPageCondition(
    `window.__kampungLoaderSmoke?.getSnapshot?.().phase === "ready"
      && document.getElementById("sandbox-stage").getAttribute("aria-busy") === "false"`,
    "campaign loader retry reaching ready",
    8000
  );
  const loaderReady = await page.eval(`
    (() => {
      const loader = document.getElementById("campaign-loader");
      const snapshot = window.__kampungLoaderSmoke.getSnapshot();
      return {
        hidden: loader.hidden && getComputedStyle(loader).display === "none",
        oneCanvas: snapshot.canvasCount === 1,
        notLoading: snapshot.loading === false,
        controlsEnabled:
          !document.getElementById("btn-start").disabled
          && !document.getElementById("btn-continue").disabled
          && !document.getElementById("btn-begin").disabled,
        worldControlsRestored:
          !document.getElementById("sandbox-stage").hasAttribute("inert")
          && !document.getElementById("hud-rail").hasAttribute("inert")
          && !document.getElementById("interaction-prompt").hasAttribute("inert")
          && !document.querySelector(".touch-controls").hasAttribute("inert")
          && !document.querySelector(".topbar-actions").hasAttribute("inert"),
      };
    })()
  `);
  await page.eval(`document.getElementById("btn-return-title").click()`);
  await waitForPageCondition(
    `document.getElementById("screen-title").classList.contains("active")
      && document.querySelectorAll("#sandbox-stage canvas").length === 0`,
    "the loader test returning from a ready campaign"
  );
  const loaderEvidence = {
    opening:
      loaderOpening.visible
      && loaderOpening.message === "Opening the neighbourhood…"
      && loaderOpening.busy === "true"
      && loaderOpening.worldControlsInert
      && loaderOpening.buttonsDisabled
      && loaderOpening.oneStart
      && loaderOpening.oneImport
      && loaderOpening.saveFailureSurvived
      && Object.values(loaderSlow).every(Boolean),
    cancelled: Object.values(loaderCancelled).every(Boolean),
    failed:
      Object.values(loaderFailed).every(Boolean)
      && expectedLoaderError >= 0,
    ready: Object.values(loaderReady).every(Boolean),
  };
  diagnostics.push(`  LOAD  ${JSON.stringify(loaderEvidence)}`);

  await page.eval(`localStorage.clear(); location.reload()`);
  await waitForPageCondition(
    `location.origin === ${JSON.stringify(new URL(TEST_URL).origin)}
      && document.readyState === "complete"
      && document.getElementById("btn-start")
      && !document.getElementById("btn-start").hidden`,
    "the fresh title after loader fault checks"
  );

  const titleScreenEvidence = await page.eval(`
    (() => {
      const art = document.querySelector(".title-art");
      const screen = document.getElementById("screen-title").getBoundingClientRect();
      return {
        title: document.title.includes("Kampung SG"),
        noOverflow: document.documentElement.scrollWidth <= window.innerWidth,
        viewportFill:
          Math.abs(screen.width - innerWidth) <= 1
          && Math.abs(screen.height - innerHeight) <= 1,
        documentLocked:
          document.documentElement.scrollHeight <= innerHeight + 1
          && getComputedStyle(document.body).overflow === "hidden",
        artLoaded:
          art instanceof HTMLImageElement
          && art.complete
          && art.naturalWidth === 1668
          && art.naturalHeight === 943,
        artFormat: art?.currentSrc?.endsWith(".webp") ?? false,
      };
    })()
  `);
  check(
    "Title screen renders its reviewed art without desktop overflow",
    titleScreenEvidence.title
      && titleScreenEvidence.noOverflow
      && titleScreenEvidence.viewportFill
      && titleScreenEvidence.documentLocked
      && titleScreenEvidence.artLoaded
      && titleScreenEvidence.artFormat,
    JSON.stringify(titleScreenEvidence)
  );
  check(
    "KampungMind is presented as a private offline engine",
    /private, offline NPC memory-and-decision engine/i.test(
      await page.eval(`document.querySelector(".mind-card").textContent`)
    )
  );
  check(
    "Campaign loader handles ready, cancel, failure, and double-start races",
    (await page.eval(`!document.getElementById("btn-start").hidden`))
      && Object.values(loaderEvidence).every(Boolean),
    JSON.stringify(loaderEvidence)
  );
  baselineFramePacing = await sampleFramePacing();
  diagnostics.push(
    `  BASE  title-screen scheduler: ` +
      `median ${baselineFramePacing.median.toFixed(2)}ms, ` +
      `p95 ${baselineFramePacing.p95.toFixed(2)}ms`
  );
  /**
   * Starts the story as SMOKE_PLAYER_NAME. Every start goes through here so a
   * later pass cannot silently fall back to the default name and mask a
   * personalisation bug.
   */
  /** Start -> character creator -> name -> Begin. The whole new-game flow. */
  const openNewGameView = async () => {
    await page.eval(`document.getElementById("btn-start").click()`);
    await waitForPageCondition(
      `!document.getElementById("title-view-new-game").hidden`,
      "the character creator behind Start"
    );
  };

  const startNamedStory = async () => {
    await openNewGameView();
    await page.eval(`
      (() => {
        const input = document.getElementById("input-player-name");
        if (!input) throw new Error("name field missing from the character creator");
        input.value = ${JSON.stringify(SMOKE_PLAYER_NAME)};
        input.dispatchEvent(new Event("input", { bubbles: true }));
      })()
    `);
    await page.eval(`window.confirm = () => true; document.getElementById("btn-begin").click()`);
  };

  const menuEvidence = await page.eval(`
    (() => {
      const ids = ["btn-start", "btn-continue", "btn-options", "btn-credits"];
      const buttons = ids.map((id) => document.getElementById(id));
      const start = document.getElementById("btn-start").getBoundingClientRect();
      const credits = document.getElementById("btn-credits").getBoundingClientRect();
      return {
        allPresent: buttons.every(Boolean),
        order: buttons.filter(Boolean).map((b) => b.textContent.trim()),
        // No save on a cleared title, so Continue is correctly out of the way.
        continueHidden: document.getElementById("btn-continue").hidden,
        minTargetPx: Math.min(...buttons.filter((b) => b && !b.hidden)
          .map((b) => b.getBoundingClientRect().height)),
        menuAboveFold: start.top >= 0 && credits.bottom <= innerHeight,
        noOverflow: document.documentElement.scrollWidth <= innerWidth,
        focusable: buttons.every((b) => b && b.tabIndex >= 0),
      };
    })()
  `);
  check(
    "The title opens on a Start / Continue / Options / Credits menu",
    menuEvidence.allPresent
      && menuEvidence.order[0] === "Start"
      && menuEvidence.order[1] === "Continue"
      && menuEvidence.order[2] === "Options"
      && menuEvidence.order[3] === "Credits"
      && menuEvidence.continueHidden
      && menuEvidence.minTargetPx >= 48
      && menuEvidence.menuAboveFold
      && menuEvidence.noOverflow
      && menuEvidence.focusable,
    JSON.stringify(menuEvidence)
  );

  await page.shot(`${SHOT_DIR}/01-title.png`);

  // The animated cast: the same painter that bakes the in-game sprite, walking
  // across the title. Sampled twice so a still frame cannot pass as animation.
  const castBefore = await page.eval(`
    (() => {
      const c = document.getElementById("title-cast");
      const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      let painted = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 8) painted += 1;
      return { painted, signature: d.slice(0, 40000).join(",").length };
    })()
  `);
  await sleep(600);
  const castAfter = await page.eval(`
    (() => {
      const c = document.getElementById("title-cast");
      const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      let painted = 0, minX = 1e9, maxX = -1;
      for (let y = 0; y < c.height; y += 1) {
        for (let x = 0; x < c.width; x += 1) {
          if (d[(y * c.width + x) * 4 + 3] > 8) {
            painted += 1;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
          }
        }
      }
      return { painted, spread: maxX - minX };
    })()
  `);
  check(
    "The title cast is drawn from the game's own sprite painter and is walking",
    castBefore.painted > 8000
      && castAfter.painted > 8000
      && castAfter.painted !== castBefore.painted
      && castAfter.spread > 400,
    JSON.stringify({ castBefore, castAfter })
  );

  const optionsEvidence = await page.eval(`
    (() => {
      document.getElementById("btn-options").click();
      const view = document.getElementById("title-view-options");
      const slider = document.getElementById("volume-title-music");
      const before = slider.value;
      slider.value = "15";
      slider.dispatchEvent(new Event("input", { bubbles: true }));
      const pauseSlider = document.getElementById("volume-music");
      const result = {
        opened: !view.hidden,
        menuHidden: document.getElementById("title-view-menu").hidden,
        before,
        after: slider.value,
        // One source of truth: the pause panel must agree with the title panel.
        pauseAgrees: pauseSlider.value === slider.value,
        soundButton: !!document.getElementById("btn-title-sound"),
      };
      document.querySelector("#title-view-options [data-title-back]").click();
      result.backToMenu = !document.getElementById("title-view-menu").hidden;
      return result;
    })()
  `);
  check(
    "Options opens, changes audio for real, and returns to the menu",
    optionsEvidence.opened
      && optionsEvidence.menuHidden
      && optionsEvidence.after === "15"
      && optionsEvidence.pauseAgrees
      && optionsEvidence.soundButton
      && optionsEvidence.backToMenu,
    JSON.stringify(optionsEvidence)
  );

  const creditsEvidence = await page.eval(`
    (() => {
      document.getElementById("btn-credits").click();
      const view = document.getElementById("title-view-credits");
      const text = view.textContent;
      const result = {
        opened: !view.hidden,
        team: /TheTwoGuys/.test(text),
        members: /Sutolimin Widjaja/.test(text) && /Andreas Auwyano/.test(text),
        challenge: /Age Well Social Good Challenge/.test(text),
        noBackend: /no backend/i.test(text),
      };
      document.querySelector("#title-view-credits [data-title-back]").click();
      result.backToMenu = !document.getElementById("title-view-menu").hidden;
      return result;
    })()
  `);
  check(
    "Credits names the real team, the challenge, and the no-backend claim",
    creditsEvidence.opened
      && creditsEvidence.team
      && creditsEvidence.members
      && creditsEvidence.challenge
      && creditsEvidence.noBackend
      && creditsEvidence.backToMenu,
    JSON.stringify(creditsEvidence)
  );

  // The character creator lives behind Start now - you choose a face when you
  // choose to begin, not before.
  await openNewGameView();

  const identityEvidence = await page.eval(`
    (() => {
      const input = document.getElementById("input-player-name");
      const groups = [...document.querySelectorAll("#identity-looks .look-group")];
      const canvas = document.getElementById("player-preview");
      const context = canvas?.getContext("2d");
      const pixels = context
        ? context.getImageData(0, 0, canvas.width, canvas.height).data
        : null;
      let opaque = 0;
      const tones = new Set();
      if (pixels) {
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i + 3] < 200) continue;
          opaque += 1;
          tones.add((pixels[i] << 16) | (pixels[i + 1] << 8) | pixels[i + 2]);
        }
      }
      const options = [...document.querySelectorAll("#identity-looks .look-option")];
      return {
        hasNameField: input instanceof HTMLInputElement,
        namePlaceholder: input?.placeholder ?? null,
        groups: groups.length,
        legends: groups.map((group) => group.querySelector("legend")?.textContent?.trim()),
        options: options.length,
        // Every option must carry a word, not only a swatch.
        allLabelled: options.every(
          (option) => (option.querySelector(".look-text")?.textContent ?? "").trim().length > 0
        ),
        // 48px minimum touch target, same contract as the rest of the UI.
        minTargetPx: Math.min(
          ...options.map((option) => Math.round(option.getBoundingClientRect().height))
        ),
        checkedPerGroup: groups.map(
          (group) => group.querySelectorAll("input:checked").length
        ),
        previewDrawn: opaque > 400,
        previewTones: tones.size,
        surpriseButton: Boolean(document.getElementById("btn-surprise-look")),
      };
    })()
  `);
  check(
    "Start opens a name field and a labelled character customiser",
    identityEvidence.hasNameField
      && identityEvidence.namePlaceholder === "Y"
      && identityEvidence.groups === 4
      && identityEvidence.options >= 17
      && identityEvidence.allLabelled
      && identityEvidence.minTargetPx >= 48
      && identityEvidence.checkedPerGroup.every((count) => count === 1)
      && identityEvidence.surpriseButton,
    JSON.stringify(identityEvidence)
  );
  const foldEvidence = await page.eval(`
    (() => {
      const begin = document.getElementById("btn-begin").getBoundingClientRect();
      const panel = document.querySelector(".identity-panel").getBoundingClientRect();
      return {
        viewport: [innerWidth, innerHeight],
        beginBottom: Math.round(begin.bottom),
        beginVisible: begin.top >= 0 && begin.bottom <= innerHeight,
        panelVisible: panel.top >= 0 && panel.bottom <= innerHeight,
        noOverflow: document.documentElement.scrollWidth <= innerWidth,
      };
    })()
  `);
  check(
    "Begin and the customiser both stay above the fold on desktop",
    foldEvidence.beginVisible && foldEvidence.panelVisible && foldEvidence.noOverflow,
    JSON.stringify(foldEvidence)
  );
  check(
    "The customiser preview renders the actual player sprite",
    identityEvidence.previewDrawn && identityEvidence.previewTones >= 8,
    JSON.stringify(identityEvidence)
  );

  // Change the look, then confirm the preview actually repaints.
  const previewResponds = await page.eval(`
    (() => {
      const canvas = document.getElementById("player-preview");
      const context = canvas.getContext("2d");
      const before = context.getImageData(0, 0, canvas.width, canvas.height).data.join(",");
      const shirt = document.querySelectorAll('#identity-looks input[name="look-shirt"]');
      const target = [...shirt].find((radio) => !radio.checked);
      if (!target) return { changed: false, reason: "no alternative shirt" };
      target.checked = true;
      target.dispatchEvent(new Event("change", { bubbles: true }));
      const after = context.getImageData(0, 0, canvas.width, canvas.height).data.join(",");
      return { changed: before !== after };
    })()
  `);
  check(
    "Choosing a different look repaints the preview",
    previewResponds.changed === true,
    JSON.stringify(previewResponds)
  );

  await startNamedStory();
  await sleep(2200);

  const tokenLeak = await page.eval(`
    (() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const offenders = [];
      let node;
      while ((node = walker.nextNode())) {
        if (!node.nodeValue || !node.nodeValue.includes("{player}")) continue;
        const parent = node.parentElement;
        offenders.push({
          where: (parent?.id || parent?.className || parent?.tagName) ?? "?",
          text: node.nodeValue.trim().slice(0, 70),
        });
      }
      return { offenders: offenders.slice(0, 8), count: offenders.length };
    })()
  `);
  check(
    "No unresolved {player} token reaches the rendered page",
    tokenLeak.count === 0,
    JSON.stringify(tokenLeak)
  );

  check(
    "Exactly one Phaser canvas is created",
    (await page.eval(`document.querySelectorAll("#sandbox-stage canvas").length`)) === 1
  );
  if (FOCUS_ONLY) {
    await page.eval(`
      (() => {
        window.__kampungFocusTrace = [];
        for (const type of ["pointerdown", "mousedown", "click", "keydown"]) {
          window.addEventListener(type, (event) => {
            window.__kampungFocusTrace.push({
              type,
              detail: event.detail ?? null,
              x: event.clientX ?? null,
              y: event.clientY ?? null,
              key: event.key ?? null,
              modality: document.documentElement.dataset.inputModality ?? null,
            });
          }, { capture: true });
        }
      })()
    `);
    await pointerClick("#btn-menu");
    await sleep(100);
    await pointerClick("#btn-pause-resume");
    await sleep(100);
    await pointerClick("#sandbox-stage canvas");
    await sleep(100);
    const focusOnlyState = await page.eval(`
      (() => {
        const stage = document.getElementById("sandbox-stage");
        const style = getComputedStyle(stage);
        return {
          focus: document.activeElement?.id,
          modality: document.documentElement.dataset.inputModality ?? null,
          controls: window.__kampungSmoke?.getMotionSnapshot?.()
            ?.tapNavigation?.controlsEnabled ?? false,
          outline: style.outline,
          boxShadow: style.boxShadow,
          trace: window.__kampungFocusTrace,
        };
      })()
    `);
    diagnostics.push(`  FOCUS  ${JSON.stringify(focusOnlyState)}`);
    check(
      "Pointer focus returns to the world without a decorative frame",
      focusOnlyState.focus === "sandbox-stage"
        && focusOnlyState.modality === "pointer"
        && focusOnlyState.controls
        && focusOnlyState.outline.includes(" none ")
        && focusOnlyState.boxShadow === "none",
      JSON.stringify(focusOnlyState),
    );
    throw new Error(FOCUS_ONLY_COMPLETE);
  }
  const closedWorldWidth = await page.eval(
    `document.querySelector(".world-shell").getBoundingClientRect().width`
  );
  const desktopViewportEvidence = await page.eval(`
    (() => {
      const screen = document.getElementById("screen-sandbox").getBoundingClientRect();
      const topbar = document.querySelector(".topbar").getBoundingClientRect();
      const shell = document.getElementById("world-shell").getBoundingClientRect();
      const canvas = document.querySelector("#sandbox-stage canvas").getBoundingClientRect();
      const prompt = document.getElementById("interaction-prompt");
      const promptRect = prompt.getBoundingClientRect();
      return {
        screenFill:
          Math.abs(screen.width - innerWidth) <= 1
          && Math.abs(screen.height - innerHeight) <= 1,
        topbarVisible:
          topbar.top >= 0
          && topbar.bottom <= innerHeight
          && getComputedStyle(document.querySelector(".topbar")).display !== "none",
        shellUsesRemainder:
          shell.top >= topbar.bottom
          && shell.bottom <= innerHeight + 1
          && innerHeight - shell.bottom < 20
          && shell.height > 500,
        canvasMatches:
          Math.abs(canvas.width - shell.width + 10) <= 2
          && Math.abs(canvas.height - shell.height + 10) <= 2,
        noDocumentOverflow:
          document.documentElement.scrollWidth <= innerWidth + 1
          && document.documentElement.scrollHeight <= innerHeight + 1,
        promptSuppressed:
          prompt.classList.contains("visually-hidden")
          && promptRect.width <= 1
          && promptRect.height <= 1,
      };
    })()
  `);
  await page.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await sleep(320);
  const desktopExpandedEvidence = await page.eval(`
    (() => {
      const shell = document.getElementById("world-shell").getBoundingClientRect();
      const stage = document.getElementById("sandbox-stage").getBoundingClientRect();
      const canvas = document.querySelector("#sandbox-stage canvas").getBoundingClientRect();
      return {
        viewport: [innerWidth, innerHeight],
        shellHeight: shell.height,
        fillsRemainder: shell.bottom <= innerHeight + 1 && innerHeight - shell.bottom < 20,
        canvasMatches:
          Math.abs(canvas.width - stage.width) <= 1
          && Math.abs(canvas.height - stage.height) <= 1,
      };
    })()
  `);
  await page.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await sleep(320);
  const gameLayoutWidth = await page.eval(
    `document.querySelector(".game-layout").getBoundingClientRect().width`
  );
  const browserWidth = await page.eval(`window.innerWidth`);
  const interiorRightEdgeColours = await page.eval(`
    (() => {
      const canvas = document.querySelector("#sandbox-stage canvas");
      const context = canvas?.getContext("2d");
      if (!canvas || !context) return 0;
      const colours = new Set();
      const startX = Math.floor(canvas.width * 0.86);
      for (let x = startX; x < canvas.width; x += 18) {
        for (let y = 24; y < canvas.height; y += 42) {
          const pixel = context.getImageData(x, y, 1, 1).data;
          colours.add(\`\${pixel[0]},\${pixel[1]},\${pixel[2]},\${pixel[3]}\`);
        }
      }
      return colours.size;
    })()
  `);
  const minimapEvidence = await page.eval(`
    (() => {
      const map = document.getElementById("estate-minimap");
      const disc = map.querySelector(".minimap-disc");
      const mapRect = map.getBoundingClientRect();
      const discRect = disc.getBoundingClientRect();
      const shellRect = document.getElementById("world-shell").getBoundingClientRect();
      const radius = getComputedStyle(disc).borderTopLeftRadius;
      return {
        visible: getComputedStyle(map).display !== "none",
        circular:
          Math.abs(discRect.width - discRect.height) <= 1
          && (
            radius.includes("%")
              ? parseFloat(radius) >= 49
              : parseFloat(radius) >= discRect.width * 0.45
          ),
        insideWorld:
          mapRect.top >= shellRect.top
          && mapRect.right <= shellRect.right
          && mapRect.bottom <= shellRect.bottom,
        landmarks: map.querySelectorAll("[data-map-location]").length,
        currentLandmarks: map.querySelectorAll(".minimap-landmark.current").length,
        place: document.getElementById("minimap-place").textContent.trim(),
        playerTransform: document.getElementById("minimap-player").getAttribute("transform"),
      };
    })()
  `);
  const initialQuestTracker = await page.eval(`
    (() => {
      const shell = document.getElementById("world-shell").getBoundingClientRect();
      const rail = document.getElementById("hud-rail").getBoundingClientRect();
      const area = document.getElementById("area-name").getBoundingClientRect();
      const story = document.querySelector('.quest-tracker-card.story');
      const progress = story?.querySelector('[role="progressbar"]');
      return {
        cards: document.querySelectorAll('.quest-tracker-card').length,
        title: story?.querySelector("strong")?.textContent.trim() ?? null,
        count: story?.querySelector("b")?.textContent.trim() ?? null,
        next: story?.querySelector(".quest-tracker-objective")?.textContent.trim() ?? null,
        progress: progress?.getAttribute("aria-valuenow") ?? null,
        fallback: !!document.querySelector('.quest-tracker-requests-action'),
        insideWorld:
          rail.top >= shell.top
          && rail.left >= shell.left
          && rail.right <= shell.right
          && rail.bottom <= shell.bottom,
        topLeft:
          rail.left <= shell.left + 24
          && rail.top <= shell.top + 24,
        clearsArea:
          rail.right <= area.left
          || rail.left >= area.right
          || rail.bottom <= area.top
          || rail.top >= area.bottom,
      };
    })()
  `);
  await recordStoryTrackerTitle();
  const interiorCameraEvidence = await page.eval(`
    (() => {
      const stage = document.getElementById("sandbox-stage");
      const zoom = window.__kampungSmoke?.getMotionSnapshot?.()?.cameraZoom ?? 0;
      return {
        zoom,
        width: stage.clientWidth,
        height: stage.clientHeight,
        roomFits:
          960 * zoom <= stage.clientWidth
          && 640 * zoom <= stage.clientHeight,
      };
    })()
  `);
  await page.eval(`document.querySelector('.quest-tracker-card.story').click()`);
  await sleep(240);
  const openedJournal = await page.eval(`
    (() => {
      const panel = document.getElementById("journal-panel");
      const backdropRect = document.getElementById("journal-backdrop")
        .getBoundingClientRect();
      return {
        open: panel.classList.contains("open"),
        expanded: document.getElementById("btn-journal").getAttribute("aria-expanded"),
        hidden: panel.getAttribute("aria-hidden"),
        inert: panel.hasAttribute("inert"),
        focus: document.activeElement?.id,
        backdrop: document.getElementById("journal-backdrop").classList.contains("open"),
        backdropViewport:
          Math.abs(backdropRect.width - innerWidth) <= 1
          && Math.abs(backdropRect.height - innerHeight) <= 1
          && backdropRect.left >= -1
          && backdropRect.top >= -1,
        tabs: panel.querySelectorAll('[role="tab"]').length,
        selectedTab:
          panel.querySelector('[role="tab"][aria-selected="true"]')
            ?.dataset.journalCategory ?? null,
        sections: panel.querySelectorAll(".journal-section").length,
        detailTitle:
          document.querySelector("#journal-detail h3")?.textContent.trim() ?? null,
        objectives: document.querySelectorAll(
          "#journal-detail .journal-objective"
        ).length,
        progress:
          document.querySelector(".quest-progress-fill")?.style.width ?? null,
      };
    })()
  `);
  await page.shot(`${SHOT_DIR}/13-journal-drawer.png`);
  await page.eval(`document.getElementById("journal-tab-story").focus()`);
  await page.key("keyDown", "ArrowRight", "ArrowRight", 39);
  await page.key("keyUp", "ArrowRight", "ArrowRight", 39);
  const journalTabKeyboard = await page.eval(`
    document.activeElement?.id === "journal-tab-requests"
      && document.getElementById("journal-tab-requests")
        .getAttribute("aria-selected") === "true"
  `);
  await page.key("keyDown", "ArrowLeft", "ArrowLeft", 37);
  await page.key("keyUp", "ArrowLeft", "ArrowLeft", 37);
  const journalTracking = await page.eval(`
    document.getElementById("btn-journal").dataset.tracked === "false"
      && !document.querySelector("#journal-detail .journal-track-button")
      && document.querySelector('[role="tab"][aria-selected="true"]')
        ?.dataset.journalCategory === "story"
      && document.querySelector("#journal-detail h3")?.textContent.trim()
        === "The First Door"
  `);
  await page.eval(`
    (() => {
      const visible = Array.from(document.querySelectorAll("#journal-panel button"))
        .filter((button) => button.getClientRects().length > 0);
      visible.at(-1)?.focus();
    })()
  `);
  await page.key("keyDown", "Tab", "Tab", 9);
  await page.key("keyUp", "Tab", "Tab", 9);
  const journalFocusWrapped = await page.eval(
    `document.activeElement?.id === "btn-journal-close"`
  );
  await page.eval(`document.getElementById("journal-tab-story").focus()`);
  await page.key("keyDown", "Escape", "Escape", 27);
  await page.key("keyUp", "Escape", "Escape", 27);
  await sleep(240);
  const pausedJournal = await page.eval(`
    (() => {
      const panel = document.getElementById("journal-panel");
      return {
        open: panel.classList.contains("open"),
        pause: document.getElementById("pause-overlay").classList.contains("active"),
        paused: window.__kampungSmoke?.isPaused?.() ?? false,
        focus: document.activeElement?.id,
      };
    })()
  `);
  await page.key("keyDown", "Escape", "Escape", 27);
  await page.key("keyUp", "Escape", "Escape", 27);
  await sleep(120);
  const resumedJournal = await page.eval(`
    (() => ({
      open: document.getElementById("journal-panel").classList.contains("open"),
      pause: document.getElementById("pause-overlay").classList.contains("active"),
      paused: window.__kampungSmoke?.isPaused?.() ?? true,
      focus: document.activeElement?.id,
    }))()
  `);
  await page.eval(`document.getElementById("journal-backdrop").click()`);
  await sleep(240);
  const backdropClosedJournal = await page.eval(
    `!document.getElementById("journal-panel").classList.contains("open")`
  );
  const beforePauseMovement = await page.eval(
    `window.__kampungSmoke?.getMotionSnapshot?.() ?? null`
  );
  await page.eval(`document.getElementById("btn-menu").click()`);
  await sleep(100);
  const pauseOpened = await page.eval(`
    (() => {
      const overlay = document.getElementById("pause-overlay");
      const rect = overlay.getBoundingClientRect();
      return {
        active: overlay.classList.contains("active"),
        hidden: overlay.getAttribute("aria-hidden"),
        inert: overlay.hasAttribute("inert"),
        paused: window.__kampungSmoke?.isPaused?.() ?? false,
        focus: document.activeElement?.id,
        menuExpanded: document.getElementById("btn-menu").getAttribute("aria-expanded"),
        viewport:
          Math.abs(rect.width - innerWidth) <= 1
          && Math.abs(rect.height - innerHeight) <= 1
          && rect.left >= -1
          && rect.top >= -1,
      };
    })()
  `);
  await page.shot(`${SHOT_DIR}/30-pause-menu.png`);
  await page.eval(`document.getElementById("btn-pause-settings").click()`);
  await sleep(80);
  const settingsOpened = await page.eval(`
    !document.getElementById("pause-view-settings").hidden
      && document.getElementById("pause-view-main").hidden
      && document.activeElement?.id === "btn-sound"
  `);
  await page.eval(`document.getElementById("btn-sound").click()`);
  await page.key("keyDown", "ArrowLeft", "ArrowLeft", 37);
  await sleep(240);
  await page.key("keyUp", "ArrowLeft", "ArrowLeft", 37);
  const whilePausedMovement = await page.eval(
    `window.__kampungSmoke?.getMotionSnapshot?.() ?? null`
  );
  await page.eval(`document.getElementById("btn-sound").click()`);
  await page.eval(`
    (() => {
      const root = document.documentElement;
      window.__kampungFullscreenMock = { element: null };
      Object.defineProperty(document, "fullscreenElement", {
        configurable: true,
        get: () => window.__kampungFullscreenMock.element,
      });
      root.requestFullscreen = async () => {
        window.__kampungFullscreenMock.element = root;
        document.dispatchEvent(new Event("fullscreenchange"));
      };
      document.exitFullscreen = async () => {
        window.__kampungFullscreenMock.element = null;
        document.dispatchEvent(new Event("fullscreenchange"));
      };
    })()
  `);
  await page.eval(`document.getElementById("btn-fullscreen").click()`);
  await waitForPageCondition(
    `document.fullscreenElement === document.documentElement
      && !document.getElementById("pause-view-settings").hidden
      && document.activeElement?.id === "btn-fullscreen"`,
    "settings full-screen entry",
    2000
  );
  const enteredFullscreen = await page.eval(`
    (() => {
      const screen = document.getElementById("screen-sandbox").getBoundingClientRect();
      const topbar = document.querySelector(".topbar");
      const topbarRect = topbar.getBoundingClientRect();
      const shell = document.getElementById("world-shell").getBoundingClientRect();
      return {
        active:
        document.fullscreenElement === document.documentElement
        && document.documentElement.classList.contains("game-fullscreen")
        && document.getElementById("world-shell").classList.contains("fullscreen-active"),
        pressed: document.getElementById("btn-fullscreen").getAttribute("aria-pressed"),
        settings: !document.getElementById("pause-view-settings").hidden,
        focus: document.activeElement?.id,
        sameLayout:
          Math.abs(screen.height - innerHeight) <= 1
          && getComputedStyle(topbar).display !== "none"
          && topbarRect.top >= 0
          && topbarRect.bottom <= shell.top + 1
          && shell.bottom <= innerHeight + 1,
      };
    })()
  `);
  await page.eval(`document.getElementById("btn-fullscreen").click()`);
  await waitForPageCondition(
    `document.fullscreenElement === null
      && !document.getElementById("pause-view-settings").hidden
      && document.activeElement?.id === "btn-fullscreen"`,
    "settings full-screen exit",
    2000
  );
  await page.eval(`document.getElementById("btn-settings-back").click()`);
  await page.eval(`document.getElementById("btn-pause-resume").click()`);
  await sleep(100);
  const resumedPause = await page.eval(`
    (() => ({
      active: document.getElementById("pause-overlay").classList.contains("active"),
      paused: window.__kampungSmoke?.isPaused?.() ?? true,
      focus: document.activeElement?.id,
      renderer: window.__kampungSmoke?.getRendererKind?.() ?? null,
    }))()
  `);
  await page.key("keyDown", "ArrowLeft", "ArrowLeft", 37);
  await sleep(240);
  await page.key("keyUp", "ArrowLeft", "ArrowLeft", 37);
  await sleep(100);
  const afterPauseMovement = await page.eval(
    `window.__kampungSmoke?.getMotionSnapshot?.() ?? null`
  );
  await page.eval(`
    delete document.documentElement.requestFullscreen;
    delete document.exitFullscreen;
    delete document.fullscreenElement;
    delete window.__kampungFullscreenMock;
  `);

  const beforePointerPauseMovement = await page.eval(
    `window.__kampungSmoke?.getMotionSnapshot?.() ?? null`
  );
  await pointerClick("#btn-menu");
  await sleep(100);
  const pointerPauseOpened = await page.eval(`
    document.getElementById("pause-overlay").classList.contains("active")
      && document.activeElement?.id === "btn-pause-resume"
  `);
  await pointerClick("#btn-pause-resume");
  await sleep(100);
  const pointerResumeState = await page.eval(`
    (() => {
      const menu = document.getElementById("btn-menu");
      const style = getComputedStyle(menu);
      return {
        focus: document.activeElement?.id,
        modality: document.documentElement.dataset.inputModality ?? null,
        controls: window.__kampungSmoke?.getMotionSnapshot?.()
          ?.tapNavigation?.controlsEnabled ?? false,
        outlineHidden:
          style.outlineStyle === "none" || parseFloat(style.outlineWidth) === 0,
      };
    })()
  `);
  await pointerClick("#sandbox-stage canvas");
  await sleep(80);
  const pointerWorldState = await page.eval(`
    (() => {
      const stage = document.getElementById("sandbox-stage");
      const style = getComputedStyle(stage);
      return {
        focus: document.activeElement?.id,
        modality: document.documentElement.dataset.inputModality ?? null,
        controls: window.__kampungSmoke?.getMotionSnapshot?.()
          ?.tapNavigation?.controlsEnabled ?? false,
        outlineHidden:
          style.outlineStyle === "none" || parseFloat(style.outlineWidth) === 0,
        goldFrameHidden: style.boxShadow === "none",
      };
    })()
  `);
  await page.key("keyDown", "ArrowRight", "ArrowRight", 39);
  await sleep(240);
  await page.key("keyUp", "ArrowRight", "ArrowRight", 39);
  await sleep(100);
  const afterPointerPauseMovement = await page.eval(
    `window.__kampungSmoke?.getMotionSnapshot?.() ?? null`
  );
  await page.key("keyDown", "Tab", "Tab", 9);
  await page.key("keyUp", "Tab", "Tab", 9);
  await sleep(80);
  const keyboardFocusState = await page.eval(`
    (() => {
      const active = document.activeElement;
      if (!(active instanceof HTMLElement)) return null;
      const style = getComputedStyle(active);
      return {
        id: active.id,
        visible:
          style.outlineStyle !== "none" && parseFloat(style.outlineWidth) >= 3,
      };
    })()
  `);
  await pointerClick("#sandbox-stage canvas");
  await sleep(80);
  if (beforePointerPauseMovement) {
    await page.eval(`
      window.__kampungSmoke?.setPlayerPosition?.(
        ${beforePointerPauseMovement.player.x},
        ${beforePointerPauseMovement.player.y}
      )
    `);
    // setPlayerPosition deliberately re-arms the scene's transition latch.
    // Let it settle so this isolated regression probe cannot block the
    // immediately following prologue interaction.
    await sleep(700);
  }
  const pauseEvidence = {
    opened:
      pauseOpened.active
      && pauseOpened.hidden === "false"
      && !pauseOpened.inert
      && pauseOpened.paused
      && pauseOpened.focus === "btn-pause-resume"
      && pauseOpened.menuExpanded === "true"
      && pauseOpened.viewport,
    settings: settingsOpened,
    frozen:
      beforePauseMovement
      && whilePausedMovement
      && beforePauseMovement.player.x === whilePausedMovement.player.x
      && beforePauseMovement.player.y === whilePausedMovement.player.y,
    fullscreen:
      enteredFullscreen.active
      && enteredFullscreen.pressed === "true"
      && enteredFullscreen.settings
      && enteredFullscreen.focus === "btn-fullscreen"
      && enteredFullscreen.sameLayout,
    resumed:
      !resumedPause.active
      && !resumedPause.paused
      && resumedPause.focus === "sandbox-stage"
      && (resumedPause.renderer === "webgl" || resumedPause.renderer === "canvas"),
    movement:
      afterPauseMovement
      && beforePauseMovement
      && beforePauseMovement.player.x - afterPauseMovement.player.x >= 18,
    pointerRecovery:
      pointerPauseOpened
      && pointerResumeState.focus === "btn-menu"
      && !pointerResumeState.controls
      && pointerWorldState.focus === "sandbox-stage"
      && pointerWorldState.controls
      && beforePointerPauseMovement
      && afterPointerPauseMovement
      && afterPointerPauseMovement.player.x - beforePointerPauseMovement.player.x >= 18,
    pointerFocusTreatment:
      pointerResumeState.outlineHidden
      && pointerWorldState.outlineHidden
      && pointerWorldState.goldFrameHidden
      && keyboardFocusState?.visible === true,
  };
  const journalDrawerEvidence = {
    viewportFill:
      Object.values(desktopViewportEvidence).every(Boolean)
      && desktopExpandedEvidence.viewport[0] === 1440
      && desktopExpandedEvidence.viewport[1] === 1000
      && desktopExpandedEvidence.shellHeight > 850
      && desktopExpandedEvidence.fillsRemainder
      && desktopExpandedEvidence.canvasMatches,
    worldFirstLayout: gameLayoutWidth >= browserWidth * 0.9,
    spaciousInterior:
      closedWorldWidth >= browserWidth * 0.9
      && closedWorldWidth <= browserWidth,
    interiorRoomFits: interiorCameraEvidence.roomFits,
    circularMap:
      minimapEvidence.visible
      && minimapEvidence.circular
      && minimapEvidence.insideWorld
      && minimapEvidence.landmarks === 10
      && minimapEvidence.currentLandmarks === 1
      && minimapEvidence.place === SMOKE_PLAYER_FLAT
      && /^translate\(/.test(minimapEvidence.playerTransform ?? ""),
    questRail:
      initialQuestTracker.cards === 1
      && initialQuestTracker.title === "The First Door"
      && initialQuestTracker.count === "0/2"
      && /Listen to the Voice/.test(initialQuestTracker.next ?? "")
      && initialQuestTracker.progress === "0"
      && initialQuestTracker.fallback
      && initialQuestTracker.insideWorld
      && initialQuestTracker.topLeft
      && initialQuestTracker.clearsArea,
    keyboardTabs: journalTabKeyboard,
    tracking: journalTracking,
    opened:
      openedJournal.open
      && openedJournal.expanded === "true"
      && openedJournal.hidden === "false"
      && openedJournal.inert === false
      && openedJournal.focus === "btn-journal-close"
      && openedJournal.backdrop
      && openedJournal.backdropViewport
      && openedJournal.tabs === 4
      && openedJournal.selectedTab === "story"
      && openedJournal.sections === 4
      && openedJournal.detailTitle === "The First Door"
      && openedJournal.objectives === 2
      && openedJournal.progress === "0%",
    focusWrapped: journalFocusWrapped,
    pausePreserved:
      pausedJournal.open
      && pausedJournal.pause
      && pausedJournal.paused
      && pausedJournal.focus === "btn-pause-resume",
    resumed:
      resumedJournal.open
      && !resumedJournal.pause
      && !resumedJournal.paused
      && resumedJournal.focus === "journal-tab-story",
    backdropClosed: backdropClosedJournal,
    pause: Object.values(pauseEvidence).every(Boolean),
  };
  diagnostics.push(
    `  UI  room=${closedWorldWidth.toFixed(0)}px; ` +
      `layout=${gameLayoutWidth.toFixed(0)}/${browserWidth}px; ` +
      `room-edge-colours=${interiorRightEdgeColours}; ` +
      `room-fit=${journalDrawerEvidence.interiorRoomFits}@` +
      `${interiorCameraEvidence.zoom.toFixed(2)}x; ` +
      `minimap=${JSON.stringify(minimapEvidence)}; ` +
      `tracker=${JSON.stringify(initialQuestTracker)}; ` +
      `viewport=${JSON.stringify(desktopViewportEvidence)}; ` +
      `expanded=${JSON.stringify(desktopExpandedEvidence)}; ` +
      `tabs=${journalDrawerEvidence.keyboardTabs}; ` +
      `tracking=${journalDrawerEvidence.tracking}; ` +
      `journal-open=${journalDrawerEvidence.opened}; ` +
      `focus-wrap=${journalDrawerEvidence.focusWrapped}; ` +
      `pause-preserved=${journalDrawerEvidence.pausePreserved}; ` +
      `resume=${journalDrawerEvidence.resumed}; ` +
      `backdrop=${journalDrawerEvidence.backdropClosed}; ` +
      `pause=${JSON.stringify(pauseEvidence)}; ` +
      `pointer-state=${JSON.stringify({
        resume: pointerResumeState,
        world: pointerWorldState,
        keyboard: keyboardFocusState,
        moved:
          beforePointerPauseMovement && afterPointerPauseMovement
            ? afterPointerPauseMovement.player.x
              - beforePointerPauseMovement.player.x
            : null,
      })}`
  );
  check(
    "World reports ready with dynamic Journal and Pause controls",
    (await page.eval(`document.getElementById("sandbox-stage").getAttribute("aria-busy")`)) === "false"
      && (await page.eval(`document.querySelectorAll(".topbar-actions button").length === 2`))
      && (await page.eval(`document.querySelectorAll(".journal-section").length === 4`))
      && Object.values(journalDrawerEvidence).every(Boolean),
    JSON.stringify(journalDrawerEvidence)
  );
  await page.shot(`${SHOT_DIR}/02-neighbourhood.png`);
  renderedLocationNames.add(SMOKE_PLAYER_FLAT);
  await page.shot(`${SHOT_DIR}/03-nearby-resident.png`);
  await runCampaign({
    helpers: 3,
    attendees: 5,
    physicalControls: true,
    environmentMode: "living",
  });

  // A WebGL frame captured on the exact scene-wake boundary can leave that
  // renderer unresponsive to the next Runtime.evaluate on some Chrome builds.
  // Resume the just-saved campaign in a fresh renderer before the long estate
  // gallery and door-reuse route; this also verifies the completed save boots.
  if (CAPTURE_SCREENSHOTS) {
    await page.send("Page.navigate", { url: TEST_URL });
    await waitForPageCondition(
      `document.readyState === "complete"
        && document.getElementById("btn-continue")
        && !document.getElementById("btn-continue").hidden`,
      "the completed save after the day-complete capture"
    );
    const returningProfile = await page.eval(`
      (() => ({
        // Continue is a button, not a status readout: no name, no chapter.
        continueLabel: document.getElementById("btn-continue").textContent.trim(),
        nameField: document.getElementById("input-player-name").value,
        caption: document.getElementById("identity-preview-caption")?.textContent.trim() ?? "",
      }))()
    `);
    check(
      "Continue reads plainly and the returning player is refilled in the creator",
      returningProfile.continueLabel === "Continue"
        && returningProfile.nameField === SMOKE_PLAYER_NAME
        && returningProfile.caption === SMOKE_PLAYER_NAME,
      JSON.stringify(returningProfile),
    );
    await page.eval(`document.getElementById("btn-continue").click()`);
    await waitForPageCondition(
      `document.getElementById("sandbox-stage").getAttribute("aria-busy") === "false"
        && window.__kampungSmoke?.getMotionSnapshot?.()?.locationId`,
      "the resumed completed campaign",
      4000
    );
  }

  const galleryLocations = [
    "Mr. Long's House",
    "Grandma Ros's Kitchen",
    "Ben's House",
    "Craftsman's Workshop",
    "Community Centre",
    "Kopitiam",
    "Minah's Provision Shop",
    "Hawker Centre",
    "Prayer Hall",
  ];
  if (CAPTURE_LOCATION_GALLERY) {
    await mkdir(`${SHOT_DIR}/locations`, { recursive: true });
  }
  for (const [index, locationName] of galleryLocations.entries()) {
    await clickJournalItem("Places", locationName);
    const renderedName = await page.eval(
      `document.getElementById("area-name").textContent.trim()`
    );
    if (renderedName.toLowerCase() !== locationName.toLowerCase()) {
      throw new Error(`Expected ${locationName}, rendered ${renderedName}`);
    }
    renderedLocationNames.add(renderedName);
    if (locationName === "Mr. Long's House") {
      consequenceArtEvidence.interior = await page.eval(
        `window.__kampungSmoke?.getMotionSnapshot?.().consequenceArt ?? null`
      );
    }
    if (CAPTURE_LOCATION_GALLERY) {
      const slug = locationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      await page.shot(
        `${SHOT_DIR}/locations/${String(index + 1).padStart(2, "0")}-${slug}.png`
      );
    }
  }

  await clickJournalItem("Places", "Kampung SG Village");
  await sleep(700);
  const returnedAreaName = await page.eval(
    `document.getElementById("area-name").textContent.trim()`
  );
  if (returnedAreaName.toLowerCase() !== "kampung sg village") {
    throw new Error(`Exterior wake retained the wrong area: ${returnedAreaName}`);
  }
  exteriorWorldWidth = await page.eval(
    `document.querySelector(".world-shell").getBoundingClientRect().width`
  );
  exteriorEdgePaletteSize = await page.eval(`
    (() => {
      if (window.__kampungSmoke?.getRendererKind?.() === "webgl") {
        return window.__kampungSmoke?.getMotionSnapshot?.()
          ?.terrainDetail?.landscapeTextureCount ?? 0;
      }
      const canvas = document.querySelector("#sandbox-stage canvas");
      const context = canvas?.getContext("2d");
      if (!canvas || !context) return 0;
      const colours = new Set();
      const edgeWidth = Math.floor(canvas.width * 0.14);
      for (const startX of [0, canvas.width - edgeWidth]) {
        for (let x = startX + 12; x < startX + edgeWidth; x += 24) {
          for (let y = 24; y < canvas.height; y += 42) {
            const pixel = context.getImageData(x, y, 1, 1).data;
            colours.add(\`\${pixel[0]},\${pixel[1]},\${pixel[2]},\${pixel[3]}\`);
          }
        }
      }
      return colours.size;
    })()
  `);
  exteriorWakePaletteSize = await page.eval(`
    (() => {
      if (window.__kampungSmoke?.getRendererKind?.() === "webgl") {
        return window.__kampungSmoke?.getMotionSnapshot?.()
          ?.terrainDetail?.pathColourCount ?? 0;
      }
      const canvas = document.querySelector("#sandbox-stage canvas");
      const context = canvas?.getContext("2d");
      if (!canvas || !context) return 0;
      const colours = new Set();
      for (let x = 24; x < canvas.width; x += Math.max(24, Math.floor(canvas.width / 12))) {
        for (let y = 24; y < canvas.height; y += Math.max(24, Math.floor(canvas.height / 8))) {
          const pixel = context.getImageData(x, y, 1, 1).data;
          colours.add(\`\${pixel[0]},\${pixel[1]},\${pixel[2]},\${pixel[3]}\`);
        }
      }
      return colours.size;
    })()
  `);
  renderedLocationNames.add("Kampung SG Village");
  await page.eval(`document.getElementById("sandbox-stage").focus({ preventScroll: true })`);
  framePacing = await profileActiveMovement();
  diagnostics.push(
    `  PERF  ${framePacing.renderer} active movement: ` +
      `avg ${framePacing.average.toFixed(2)}ms, ` +
      `p95 ${framePacing.p95.toFixed(2)}ms, ` +
      `worst ${framePacing.worst.toFixed(2)}ms, ` +
      `main-thread ${framePacing.taskMsPerFrame.toFixed(2)}ms/frame`
  );
  await page.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  try {
    throttledFramePacing = await profileActiveMovement();
  } finally {
    await page.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  }
  diagnostics.push(
    `  PERF  4x CPU throttle active movement: ` +
      `avg ${throttledFramePacing.average.toFixed(2)}ms, ` +
      `p95 ${throttledFramePacing.p95.toFixed(2)}ms, ` +
      `worst ${throttledFramePacing.worst.toFixed(2)}ms, ` +
      `main-thread ${throttledFramePacing.taskMsPerFrame.toFixed(2)}ms/frame`
  );
  await page.eval(`
    document.getElementById("btn-menu").focus({ preventScroll: true });
    document.getElementById("sandbox-stage").focus({ preventScroll: true });
  `);
  await page.key("keyDown", "ArrowRight", "ArrowRight", 39);
  await waitForPageCondition(
    `(() => {
      const snapshot = window.__kampungSmoke?.getMotionSnapshot?.();
      return snapshot?.tapNavigation?.controlsEnabled === true
        && snapshot.visibleStepPuffs >= 1
        && snapshot.activeStepSurfaces.includes(snapshot.movementSurface);
    })()`,
    "active world feedback after performance sampling",
    1200,
  );
  const worldFeelSnapshot = await page.eval(
    `window.__kampungSmoke?.getMotionSnapshot?.() ?? null`
  );
  await page.shot(`${SHOT_DIR}/20-world-scale-motion.png`);
  await page.key("keyUp", "ArrowRight", "ArrowRight", 39);
  await sleep(380);
  worldFeelEvidence = worldFeelSnapshot
    ? {
        cameraZoom: worldFeelSnapshot.cameraZoom,
        visibleStepPuffs: worldFeelSnapshot.visibleStepPuffs,
        movementSurface: worldFeelSnapshot.movementSurface,
        activeStepSurfaces: worldFeelSnapshot.activeStepSurfaces,
        pondRippleCount: worldFeelSnapshot.pondRippleCount,
        obstacleCount: worldFeelSnapshot.obstacleCount,
        scamCheckCardLayout: worldFeelSnapshot.scamCheckCardLayout,
        scamCheckCardVisible: worldFeelSnapshot.scamCheckCardVisible,
        scamCheckCardAlpha: worldFeelSnapshot.scamCheckCardAlpha,
      }
    : null;
  diagnostics.push(
    worldFeelEvidence
      ? `  FEEL  zoom=${worldFeelEvidence.cameraZoom.toFixed(2)}x; ` +
        `step-puffs=${worldFeelEvidence.visibleStepPuffs}; ` +
        `surface=${worldFeelEvidence.movementSurface}; ` +
        `pond-ripples=${worldFeelEvidence.pondRippleCount}; ` +
        `obstacles=${worldFeelEvidence.obstacleCount}; ` +
        `scam-card=${worldFeelEvidence.scamCheckCardLayout}/` +
        `${worldFeelEvidence.scamCheckCardVisible}@` +
        `${worldFeelEvidence.scamCheckCardAlpha}`
      : "  FEEL  world feedback snapshot missing"
  );
  await page.shot(`${SHOT_DIR}/05-choice-consequence.png`);
  await page.shotElement("#sandbox-stage canvas", `${SHOT_DIR}/hero-evening.png`);
  await page.eval(`
    window.__kampungSmoke.setPlayerPosition(250, 520);
    document.getElementById("sandbox-stage").focus({ preventScroll: true });
  `);
  await sleep(160);
  await page.key("keyDown", "ArrowDown", "ArrowDown", 40);
  await sleep(230);
  const grassFootstepSnapshot = await page.eval(
    `window.__kampungSmoke?.getMotionSnapshot?.() ?? null`
  );
  await page.shot(`${SHOT_DIR}/21-pond-life.png`);
  await page.key("keyUp", "ArrowDown", "ArrowDown", 40);
  await sleep(380);
  grassFootstepEvidence = grassFootstepSnapshot
    ? {
        movementSurface: grassFootstepSnapshot.movementSurface,
        activeStepSurfaces: grassFootstepSnapshot.activeStepSurfaces,
        visibleStepPuffs: grassFootstepSnapshot.visibleStepPuffs,
      }
    : null;
  diagnostics.push(
    grassFootstepEvidence
      ? `  FEEL  grass surface=${grassFootstepEvidence.movementSurface}; ` +
        `active=${grassFootstepEvidence.activeStepSurfaces.join(",")}; ` +
        `step-puffs=${grassFootstepEvidence.visibleStepPuffs}`
      : "  FEEL  grass footstep snapshot missing"
  );
  await page.eval(`
    window.__kampungSmoke.setPlayerPosition(500, 400);
    document.getElementById("sandbox-stage").focus({ preventScroll: true });
  `);
  await sleep(650);
  await page.key("keyDown", "ArrowRight", "ArrowRight", 39);
  await sleep(230);
  const stoneFootstepSnapshot = await page.eval(
    `window.__kampungSmoke?.getMotionSnapshot?.() ?? null`
  );
  await page.key("keyUp", "ArrowRight", "ArrowRight", 39);
  await sleep(380);
  stoneFootstepEvidence = stoneFootstepSnapshot
    ? {
        movementSurface: stoneFootstepSnapshot.movementSurface,
        activeStepSurfaces: stoneFootstepSnapshot.activeStepSurfaces,
        visibleStepPuffs: stoneFootstepSnapshot.visibleStepPuffs,
      }
    : null;
  diagnostics.push(
    stoneFootstepEvidence
      ? `  FEEL  stone surface=${stoneFootstepEvidence.movementSurface}; ` +
        `active=${stoneFootstepEvidence.activeStepSurfaces.join(",")}; ` +
        `step-puffs=${stoneFootstepEvidence.visibleStepPuffs}`
      : "  FEEL  stone footstep snapshot missing"
  );
  const eastSnapshot = await walkToAxis("x", 2240);
  const eastMapTransform = await page.eval(
    `document.getElementById("minimap-player").getAttribute("transform")`
  );
  await page.shot(`${SHOT_DIR}/11-estate-east.png`);
  await walkToAxis("x", 2100);
  const beforeFacadeCollision = await page.eval(
    `window.__kampungSmoke?.getMotionSnapshot?.() ?? null`
  );
  await walkWorld("ArrowUp", "ArrowUp", 38, 1100);
  const afterFacadeCollision = await page.eval(
    `window.__kampungSmoke?.getMotionSnapshot?.() ?? null`
  );
  const activeFacadeOcclusion = afterFacadeCollision?.buildingOcclusion?.find(
    (building) => building.id === "provision-shop"
  );
  await page.shot(`${SHOT_DIR}/29-building-occlusion.png`);
  await walkToAxis("y", 400);
  const restoredFacadeSnapshot = await page.eval(
    `window.__kampungSmoke?.getMotionSnapshot?.() ?? null`
  );
  const restoredFacadeOcclusion =
    restoredFacadeSnapshot?.buildingOcclusion?.find(
      (building) => building.id === "provision-shop"
    );
  facadeCollisionEvidence = {
    blocked:
      beforeFacadeCollision?.locationId === "estate"
      && afterFacadeCollision?.locationId === "estate"
      && beforeFacadeCollision.player.y - afterFacadeCollision.player.y >= 60
      && afterFacadeCollision.player.y >= 318
      && afterFacadeCollision.player.y <= 342,
    start: beforeFacadeCollision?.player ?? null,
    end: afterFacadeCollision?.player ?? null,
    obstacleCount: afterFacadeCollision?.obstacleCount ?? 0,
    faded:
      activeFacadeOcclusion?.faded === true
      && activeFacadeOcclusion.alpha <= 0.35
      && afterFacadeCollision?.scamCheckCardAlpha <= 0.35,
    restored:
      restoredFacadeOcclusion?.faded === false
      && restoredFacadeOcclusion.alpha >= 0.98
      && restoredFacadeSnapshot?.scamCheckCardAlpha >= 0.98,
    cardAlphaFaded: afterFacadeCollision?.scamCheckCardAlpha ?? null,
    cardAlphaRestored: restoredFacadeSnapshot?.scamCheckCardAlpha ?? null,
  };
  diagnostics.push(
    `  FACADE  collision=${facadeCollisionEvidence.blocked}; ` +
      `faded=${facadeCollisionEvidence.faded}; ` +
      `restored=${facadeCollisionEvidence.restored}; ` +
      `card-alpha=${facadeCollisionEvidence.cardAlphaFaded}/` +
      `${facadeCollisionEvidence.cardAlphaRestored}; ` +
      `start=${JSON.stringify(facadeCollisionEvidence.start)}; ` +
      `end=${JSON.stringify(facadeCollisionEvidence.end)}; ` +
      `obstacles=${facadeCollisionEvidence.obstacleCount}`
  );
  await walkToAxis("x", 1800);
  await page.shot(`${SHOT_DIR}/16-landmark-facades.png`);
  await walkToAxis("x", 1880);
  await walkToAxis("y", 1180);
  const southSnapshot = await walkToAxis("x", 1720);
  const southMapTransform = await page.eval(
    `document.getElementById("minimap-player").getAttribute("transform")`
  );
  districtTravelEvidence = {
    east:
      eastSnapshot?.locationId === "estate"
      && eastSnapshot.player.x >= 1900,
    south:
      southSnapshot?.locationId === "estate"
      && southSnapshot.player.x >= 1450
      && southSnapshot.player.x <= 1900
      && southSnapshot.player.y >= 1000,
    minimapMoved:
      /^translate\(/.test(eastMapTransform ?? "")
      && /^translate\(/.test(southMapTransform ?? "")
      && eastMapTransform !== southMapTransform,
    eastPosition: eastSnapshot?.player ?? null,
    southPosition: southSnapshot?.player ?? null,
    eastMapTransform,
    southMapTransform,
  };
  diagnostics.push(
    `  TRAVEL  east=${JSON.stringify(districtTravelEvidence.eastPosition)}; ` +
      `south=${JSON.stringify(districtTravelEvidence.southPosition)}; ` +
      `map=${districtTravelEvidence.eastMapTransform} -> ` +
      `${districtTravelEvidence.southMapTransform}`
  );
  await page.shot(`${SHOT_DIR}/12-estate-south.png`);
  await walkToAxis("y", 1140);
  await walkToAxis("x", 1320);
  await page.shot(`${SHOT_DIR}/17-workshop-facade.png`);
  await walkToAxis("y", 1490, 30);
  await page.shot(`${SHOT_DIR}/28-block-twelve-bicycle-verge.png`);
  await page.shotElement("#sandbox-stage canvas", `${SHOT_DIR}/hero-day.png`);
  await verifyReusableEstateDoor();

  await page.eval(`document.getElementById("btn-return-title").click()`);
  await sleep(650);
  check(
    "Back to title destroys the Phaser canvas",
    (await page.eval(`document.querySelectorAll("#sandbox-stage canvas").length`)) === 0
  );
  check(
    "A saved campaign offers a plain Continue alongside Start",
    await page.eval(`
      !document.getElementById("btn-continue").hidden
      && document.getElementById("btn-continue").textContent.trim() === "Continue"
      && !document.getElementById("btn-start").hidden
    `)
  );
  await page.send("Page.navigate", { url: TEST_URL });
  await waitForPageCondition(
    `document.readyState === "complete"
      && document.getElementById("btn-continue")
      && !document.getElementById("btn-continue").hidden`,
    "saved title actions after reload"
  );
  await page.eval(`document.getElementById("btn-continue").click()`);
  await sleep(1500);
  check(
    "Reload and Continue restore the saved free-exploration state",
    /Story complete/i.test(await page.eval(`document.getElementById("chapter-label").textContent`))
  );
  await page.eval(`document.getElementById("btn-return-title").click()`);
  await sleep(500);
  const saveBeforeDemo = await page.eval(`localStorage.getItem("kampung-sg.campaign.v1")`);

  await page.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await page.send("Page.navigate", { url: DEMO_TEST_URL });
  await waitForPageCondition(
    `document.readyState === "complete"
      && document.getElementById("btn-start")
      && !document.getElementById("btn-start").hidden`,
    "demo title actions"
  );
  check(
    "Demo mode ignores the full campaign save",
    await page.eval(`
      !document.getElementById("btn-start").hidden
      && document.getElementById("btn-continue").hidden
    `)
  );
  await startNamedStory();
  await sleep(1600);
  await runCampaign({
    helpers: 2,
    attendees: 2,
    physicalControls: false,
    environmentMode: "reduced",
  });
  check(
    "Demo mode keeps every chapter while lowering only the two thresholds",
    /Story complete/i.test(await page.eval(`document.getElementById("chapter-label").textContent`))
  );
  const saveAfterDemo = await page.eval(`localStorage.getItem("kampung-sg.campaign.v1")`);
  check("Demo mode never writes the persistent save", saveAfterDemo === saveBeforeDemo);
  await page.eval(`document.getElementById("btn-return-title").click()`);
  await sleep(400);

  await page.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "no-preference" }],
  });
  await page.send("Page.navigate", { url: TEST_URL });
  await waitForPageCondition(
    `document.readyState === "complete"
      && document.getElementById("btn-continue")
      && !document.getElementById("btn-continue").hidden`,
    "saved title actions before starting over"
  );
  // Start over is now Start -> creator -> Begin, and Begin is what asks before
  // it replaces a save.
  await page.eval(`
    window.confirm = () => true;
    document.getElementById("btn-start").click();
    document.getElementById("btn-begin").click();
  `);
  await sleep(1600);
  check(
    "Beginning again over a save asks first, then replaces it with a fresh prologue",
    /PROLOGUE/i.test(await page.eval(`document.getElementById("chapter-label").textContent`))
  );
  const freshSave = JSON.parse(await page.eval(`localStorage.getItem("kampung-sg.campaign.v1")`));
  check(
    "Beginning again persists a valid versioned initial save",
    freshSave?.version === 1 && freshSave?.completedChapters?.length === 0
  );
  await page.eval(`document.getElementById("btn-return-title").click()`);
  await sleep(400);

  const shortTitleLayouts = [];
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 360, height: 560 },
    { width: 640, height: 360 },
  ]) {
    await page.send("Emulation.setDeviceMetricsOverride", {
      ...viewport,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sleep(220);
    shortTitleLayouts.push(await page.eval(`
      (() => {
        const screen = document.getElementById("screen-title");
        const rect = screen.getBoundingClientRect();
        const overflowY = getComputedStyle(screen).overflowY;
        return {
          viewport: [innerWidth, innerHeight],
          fills:
            Math.abs(rect.width - innerWidth) <= 1
            && Math.abs(rect.height - innerHeight) <= 1,
          documentLocked:
            document.documentElement.scrollWidth <= innerWidth + 1
            && document.documentElement.scrollHeight <= innerHeight + 1
            && getComputedStyle(document.body).overflow === "hidden",
          internalOwnsOverflow:
            screen.scrollHeight <= screen.clientHeight + 1
            || overflowY === "auto"
            || overflowY === "scroll",
        };
      })()
    `));
  }
  await page.send("Emulation.setDeviceMetricsOverride", {
    width: 360,
    height: 780,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await sleep(700);
  check(
    "No horizontal overflow at 360px",
    await page.eval(`document.documentElement.scrollWidth <= 361`),
    `scrollWidth=${await page.eval(`document.documentElement.scrollWidth`)}`
  );
  const smallTargets = await page.eval(`
    Array.from(document.querySelectorAll("button:not([disabled])"))
      .filter((button) => button.offsetParent !== null)
      .filter((button) => {
        const rect = button.getBoundingClientRect();
        return rect.width < 48 || rect.height < 48;
      }).length
  `);
  check("All visible touch targets are at least 48px", smallTargets === 0, `${smallTargets} too small`);
  await page.shot(`${SHOT_DIR}/09-mobile-360.png`);
  await page.eval(`document.getElementById("btn-continue").click()`);
  await sleep(1800);
  const mobileWorldState = await page.eval(`
    (() => {
      const shell = document.querySelector(".world-shell").getBoundingClientRect();
      const rail = document.getElementById("hud-rail").getBoundingClientRect();
      return {
        canvas: document.querySelectorAll("#sandbox-stage canvas").length,
        noOverflow: document.documentElement.scrollWidth <= 361,
        shellLeft: shell.left,
        shellRight: shell.right,
        touchControls:
          getComputedStyle(document.querySelector(".touch-controls")).display === "flex",
        cameraZoom:
          window.__kampungSmoke?.getMotionSnapshot?.()?.cameraZoom ?? null,
        minimap: (() => {
          const map = document.getElementById("estate-minimap").getBoundingClientRect();
          const disc = document.querySelector(".minimap-disc").getBoundingClientRect();
          return {
            visible: map.width >= 98 && map.width <= 112,
            circular: Math.abs(disc.width - disc.height) <= 1,
            inside: map.left >= shell.left && map.right <= shell.right,
          };
        })(),
        questRail: {
          cards: document.querySelectorAll(".quest-tracker-card").length,
          title:
            document.querySelector(".quest-tracker-card.story > strong")
              ?.textContent.trim() ?? null,
          progressVisible:
            document.querySelector(".quest-tracker-progress-track")
              ?.getBoundingClientRect().height >= 6,
          inside:
            rail.left >= shell.left
            && rail.right <= shell.right
            && rail.top >= shell.top
            && rail.bottom <= shell.bottom,
          topLeft:
            rail.left <= shell.left + 16
            && rail.top <= shell.top + 16,
          clearsTouch:
            Array.from(document.querySelectorAll(".dpad button, #btn-touch-interact"))
              .every((button) => {
                const target = button.getBoundingClientRect();
                return rail.bottom <= target.top
                  || rail.top >= target.bottom
                  || rail.left >= target.right
                  || rail.right <= target.left;
              }),
        },
      };
    })()
  `);
  await page.shot(`${SHOT_DIR}/14-mobile-game.png`);
  const touchTalkFocused = await page.eval(`
    (() => {
      const button = document.getElementById("btn-touch-interact");
      button.focus();
      const focused = document.activeElement === button;
      button.click();
      return focused;
    })()
  `);
  await sleep(240);
  await waitForRenderedDialogueLine("the mobile dialogue evidence line");
  portraitEvidence.mobile = await page.eval(`
    (() => {
      const overlay = document.getElementById("dialog-overlay");
      const card = overlay.querySelector(".dialog-card");
      const portrait = document.getElementById("dialog-portrait");
      const svg = portrait?.querySelector("svg");
      const cardRect = card.getBoundingClientRect();
      const portraitRect = portrait.getBoundingClientRect();
      return {
        open: overlay.classList.contains("active"),
        id: svg?.dataset.portraitId ?? null,
        left: cardRect.left,
        right: cardRect.right,
        top: cardRect.top,
        bottom: cardRect.bottom,
        portraitWidth: portraitRect.width,
        portraitHeight: portraitRect.height,
        noOverflow: document.documentElement.scrollWidth <= 361,
      };
    })()
  `);
  await page.shot(`${SHOT_DIR}/18-mobile-dialogue.png`);
  await page.eval(`document.getElementById("btn-dialog-close").click()`);
  await sleep(220);
  await page.eval(`document.getElementById("btn-journal").click()`);
  await sleep(240);
  const mobileJournalState = await page.eval(`
    (() => {
      const panel = document.getElementById("journal-panel");
      const rect = panel.getBoundingClientRect();
      const listRect = document.getElementById("journal-content").getBoundingClientRect();
      const detailRect = document.getElementById("journal-detail").getBoundingClientRect();
      const smallTargets = Array.from(panel.querySelectorAll("button:not([disabled])"))
        .filter((button) => button.offsetParent !== null)
        .filter((button) => {
          const target = button.getBoundingClientRect();
          return target.width < 48 || target.height < 48;
        }).length;
      return {
        open: panel.classList.contains("open"),
        left: rect.left,
        right: rect.right,
        width: rect.width,
        focus: document.activeElement?.id,
        smallTargets,
        noOverflow: document.documentElement.scrollWidth <= 361,
        tabs: panel.querySelectorAll('[role="tab"]').length,
        detailBelowList:
          detailRect.top >= listRect.bottom - 1
          && detailRect.bottom <= rect.bottom,
      };
    })()
  `);
  await page.shot(`${SHOT_DIR}/15-mobile-journal.png`);
  await page.key("keyDown", "Escape", "Escape", 27);
  await page.key("keyUp", "Escape", "Escape", 27);
  await sleep(220);
  const mobileJournalPaused = await page.eval(`
    document.getElementById("journal-panel").classList.contains("open")
      && document.getElementById("pause-overlay").classList.contains("active")
      && window.__kampungSmoke?.isPaused?.() === true
      && document.activeElement?.id === "btn-pause-resume"
  `);
  await page.key("keyDown", "Escape", "Escape", 27);
  await page.key("keyUp", "Escape", "Escape", 27);
  await sleep(180);
  const mobileJournalResumed = await page.eval(`
    document.getElementById("journal-panel").classList.contains("open")
      && !document.getElementById("pause-overlay").classList.contains("active")
      && window.__kampungSmoke?.isPaused?.() === false
      && document.activeElement?.id === "btn-journal-close"
  `);
  await page.eval(`document.getElementById("btn-journal-close").click()`);
  await sleep(180);
  mobileGameEvidence = {
    world:
      mobileWorldState.canvas === 1
      && mobileWorldState.noOverflow
      && mobileWorldState.shellLeft >= 0
      && mobileWorldState.shellRight <= 361
      && mobileWorldState.touchControls
      && mobileWorldState.cameraZoom >= 0.54
      && mobileWorldState.cameraZoom <= 0.72
      && mobileWorldState.minimap.visible
      && mobileWorldState.minimap.circular
      && mobileWorldState.minimap.inside
      && mobileWorldState.questRail.cards <= 2
      && mobileWorldState.questRail.title === "The First Door"
      && mobileWorldState.questRail.progressVisible
      && mobileWorldState.questRail.inside
      && mobileWorldState.questRail.topLeft
      && mobileWorldState.questRail.clearsTouch,
    journal:
      mobileJournalState.open
      && mobileJournalState.left >= 0
      && mobileJournalState.right <= 361
      && mobileJournalState.width >= 300
      && mobileJournalState.focus === "btn-journal-close"
      && mobileJournalState.smallTargets === 0
      && mobileJournalState.noOverflow
      && mobileJournalState.tabs === 4
      && mobileJournalState.detailBelowList,
    dialogue:
      touchTalkFocused
      && portraitEvidence.mobile.open
      && portraitEvidence.mobile.id === "voice"
      && portraitEvidence.mobile.left >= 0
      && portraitEvidence.mobile.right <= 361
      && portraitEvidence.mobile.top >= 0
      && portraitEvidence.mobile.bottom <= 780
      && portraitEvidence.mobile.portraitWidth >= 80
      && portraitEvidence.mobile.portraitHeight >= 110
      && portraitEvidence.mobile.noOverflow,
    closedToWorld:
      (await page.eval(`document.activeElement?.id`)) === "sandbox-stage"
      && !(await page.eval(
        `document.getElementById("journal-panel").classList.contains("open")`
      )),
    pauseRoundTrip: mobileJournalPaused && mobileJournalResumed,
  };

  await page.send("Emulation.setTouchEmulationEnabled", {
    enabled: true,
    maxTouchPoints: 5,
  });
  const shortViewportLayouts = [];
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 360, height: 560 },
    { width: 640, height: 360 },
  ]) {
    await page.send("Emulation.setDeviceMetricsOverride", {
      ...viewport,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sleep(420);
    const layout = await page.eval(`
      (() => {
        const inside = (inner, outer) =>
          inner.left >= outer.left - 1
          && inner.right <= outer.right + 1
          && inner.top >= outer.top - 1
          && inner.bottom <= outer.bottom + 1;
        const viewport = {
          left: 0,
          top: 0,
          right: innerWidth,
          bottom: innerHeight,
        };
        const screen = document.getElementById("screen-sandbox").getBoundingClientRect();
        const topbar = document.querySelector(".topbar").getBoundingClientRect();
        const shell = document.querySelector(".world-shell").getBoundingClientRect();
        const stage = document.getElementById("sandbox-stage").getBoundingClientRect();
        const canvas = document.querySelector("#sandbox-stage canvas").getBoundingClientRect();
        const hud = document.getElementById("hud-rail").getBoundingClientRect();
        const prompt = document.getElementById("interaction-prompt");
        const promptRect = prompt.getBoundingClientRect();
        const trackerCards = Array.from(document.querySelectorAll(".quest-tracker-card"));
        const topbarTargets = Array.from(document.querySelectorAll(".topbar button"))
          .filter((button) => button.offsetParent !== null)
          .every((button) => {
            const rect = button.getBoundingClientRect();
            return rect.width >= 48 && rect.height >= 48 && inside(rect, viewport);
          });
        const touchElements = Array.from(document.querySelectorAll(
          ".dpad button, #btn-touch-interact"
        ));
        const touchTargets = touchElements.every((button) => {
          const rect = button.getBoundingClientRect();
          return rect.width >= 48
            && rect.height >= 48
            && inside(rect, shell)
            && inside(rect, viewport);
        });
        const overlaps = (a, b) =>
          a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        const hudClear = touchElements.every((button) =>
          !overlaps(hud, button.getBoundingClientRect())
        );
        const hudTopLeft =
          hud.left <= shell.left + 16
          && hud.top <= shell.top + 16;
        const trackerCompact =
          trackerCards.length <= 2
          && trackerCards.every((card) => {
            const title = card.querySelector("strong")?.textContent.trim();
            const progress = card.querySelector(".quest-tracker-progress-track")
              ?.getBoundingClientRect();
            const objective = card.querySelector(".quest-tracker-objective");
            return Boolean(title)
              && (progress?.height ?? 0) >= 6
              && (!objective || getComputedStyle(objective).display === "none");
          });
        return {
          viewport: [innerWidth, innerHeight],
          screenHeight: screen.height,
          shellHeight: shell.height,
          stageHeight: stage.height,
          canvasMatches:
            Math.abs(canvas.width - stage.width) <= 1
            && Math.abs(canvas.height - stage.height) <= 1,
          hudClear,
          hudTopLeft,
          trackerCompact,
          promptSuppressed:
            prompt.classList.contains("visually-hidden")
            && promptRect.width <= 1
            && promptRect.height <= 1,
          fits:
            Math.abs(screen.height - innerHeight) <= 1
            && inside(topbar, viewport)
            && inside(shell, viewport)
            && shell.height > 120
            && stage.height > 110
            && document.documentElement.scrollWidth <= innerWidth + 1
            && document.documentElement.scrollHeight <= innerHeight + 1
            && topbarTargets
            && touchTargets
            && inside(hud, shell)
            && hudTopLeft
            && hudClear
            && trackerCompact
            && prompt.classList.contains("visually-hidden")
            && promptRect.width <= 1
            && promptRect.height <= 1
            && Math.abs(canvas.width - stage.width) <= 1
            && Math.abs(canvas.height - stage.height) <= 1,
        };
      })()
    `);
    if (viewport.width === 320) {
      await page.eval(`document.getElementById("btn-journal").click()`);
      await waitForPageCondition(
        `(() => {
          const panel = document.getElementById("journal-panel").getBoundingClientRect();
          return panel.left >= -1 && panel.right <= innerWidth + 1;
        })()`,
        "320px journal drawer to settle",
        1000,
      );
      layout.journalReachable = await page.eval(`
        (() => {
          const panel = document.getElementById("journal-panel").getBoundingClientRect();
          const close = document.getElementById("btn-journal-close").getBoundingClientRect();
          return panel.left >= 0
            && panel.top >= 0
            && panel.right <= innerWidth + 1
            && panel.bottom <= innerHeight + 1
            && close.width >= 48
            && close.height >= 48
            && close.right <= innerWidth + 1
            && close.bottom <= innerHeight + 1;
        })()
      `);
      await page.eval(`document.getElementById("btn-journal-close").click()`);
      await sleep(120);
    } else {
      layout.journalReachable = true;
    }
    shortViewportLayouts.push(layout);
  }

  await page.send("Emulation.setDeviceMetricsOverride", {
    width: 360,
    height: 560,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await sleep(420);
  await page.eval(`
    window.__kampungSmoke.resetTouchInput();
    document.getElementById("sandbox-stage").focus({ preventScroll: true });
  `);
  const touchCentre = await page.eval(`
    (() => {
      const rect = document.querySelector("#sandbox-stage canvas").getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()
  `);
  const beforeRejectedGestures = await page.eval(
    `window.__kampungSmoke.getMotionSnapshot()`,
  );
  await touchTap(touchCentre.x, touchCentre.y, 700);
  await sleep(80);
  const afterLongPress = await page.eval(
    `window.__kampungSmoke.getMotionSnapshot()`,
  );
  await dispatchTouch("touchStart", [
    { id: 1, x: touchCentre.x, y: touchCentre.y },
  ]);
  await sleep(40);
  await dispatchTouch("touchMove", [
    { id: 1, x: touchCentre.x + 30, y: touchCentre.y },
  ]);
  await sleep(40);
  await dispatchTouch("touchEnd", []);
  await sleep(80);
  const afterDrag = await page.eval(
    `window.__kampungSmoke.getMotionSnapshot()`,
  );
  await dispatchTouch("touchStart", [
    { id: 1, x: touchCentre.x - 18, y: touchCentre.y },
    { id: 2, x: touchCentre.x + 18, y: touchCentre.y },
  ]);
  await sleep(60);
  await dispatchTouch("touchEnd", []);
  await sleep(80);
  const afterMultiTouch = await page.eval(
    `window.__kampungSmoke.getMotionSnapshot()`,
  );
  const rejectedGestures = [afterLongPress, afterDrag, afterMultiTouch].every(
    (snapshot) =>
      !snapshot.tapNavigation.active
      && snapshot.tapNavigation.outcome
        === beforeRejectedGestures.tapNavigation.outcome
      && Math.hypot(
        snapshot.player.x - beforeRejectedGestures.player.x,
        snapshot.player.y - beforeRejectedGestures.player.y,
      ) < 4,
  );

  // Establish interaction following on a clear route before deliberately
  // exercising d-pad cancellation and a collision stall below.
  await page.eval(`
    window.__kampungSmoke.setPlayerPosition(360, 390);
    document.getElementById("sandbox-stage").focus({ preventScroll: true });
  `);
  await sleep(180);
  const farVoiceStart = await page.eval(
    `window.__kampungSmoke.getMotionSnapshot()`,
  );
  const farVoicePoint = await worldPointToClient(540, 390);
  await touchTap(farVoicePoint.x, farVoicePoint.y);
  await sleep(70);
  const followingVoice = await page.eval(
    `window.__kampungSmoke.getMotionSnapshot()`,
  );
  try {
    await waitForPageCondition(
      `document.getElementById("dialog-overlay").classList.contains("active")`,
      "tap navigation to auto-interact with the Voice",
      2200,
    );
  } catch (error) {
    const endingTouchState = await page.eval(`
      (() => ({
        snapshot: window.__kampungSmoke?.getMotionSnapshot?.() ?? null,
        activeElement: document.activeElement?.id ?? document.activeElement?.tagName,
        dialogueOpen: document.getElementById("dialog-overlay").classList.contains("active"),
      }))()
    `);
    throw new Error(
      `${error.message}; start=${JSON.stringify(farVoiceStart)}; `
        + `after-tap=${JSON.stringify(followingVoice)}; `
        + `ending=${JSON.stringify(endingTouchState)}`
    );
  }
  const farAutoInteracted = await page.eval(`
    window.__kampungSmoke.getMotionSnapshot().tapNavigation.outcome === "interacted"
  `);
  await page.eval(`document.getElementById("btn-dialog-close").click()`);
  await sleep(160);
  const voicePoint = await worldPointToClient(540, 390);
  await touchTap(voicePoint.x, voicePoint.y);
  await waitForPageCondition(
    `document.getElementById("dialog-overlay").classList.contains("active")`,
    "nearby viewport tap to open dialogue",
    1200,
  );
  // The pointer tap above intentionally suppresses decorative focus frames.
  // Switch through a real keyboard event before asserting that keyboard focus
  // still exposes the high-contrast dialogue ring.
  await page.key("keyDown", "Tab", "Tab", 9);
  await page.key("keyUp", "Tab", "Tab", 9);
  await sleep(40);
  const shortDialogue = await page.eval(`
    (() => {
      const card = document.querySelector("#dialog-overlay .dialog-card")
        .getBoundingClientRect();
      const advance = document.getElementById("btn-dialog-advance");
      advance.focus();
      const target = advance.getBoundingClientRect();
      const focusStyle = getComputedStyle(advance);
      return {
        fits: card.left >= 0
          && card.top >= 0
          && card.right <= innerWidth + 1
          && card.bottom <= innerHeight + 1,
        soleCue: advance.textContent.trim() === ">"
          && advance.getAttribute("aria-label") === "Continue dialogue"
          && target.width >= 52
          && target.height >= 52,
        focusRing: focusStyle.outlineStyle !== "none"
          && parseFloat(focusStyle.outlineWidth) >= 3
          && focusStyle.boxShadow !== "none",
      };
    })()
  `);
  await page.eval(`document.getElementById("btn-dialog-close").click()`);
  await sleep(120);

  const beforeSyntheticDpad = await page.eval(
    `window.__kampungSmoke.getMotionSnapshot()`,
  );
  const syntheticDpadFocused = await page.eval(`
    (() => {
      const button = document.querySelector('[data-direction="right"]');
      button.focus();
      const focused = document.activeElement === button;
      button.click();
      return focused;
    })()
  `);
  await sleep(260);
  const afterSyntheticDpad = await page.eval(
    `window.__kampungSmoke.getMotionSnapshot()`,
  );
  await page.eval(`document.getElementById("sandbox-stage").focus({ preventScroll: true })`);
  await sleep(80);

  const canvasRect = await page.eval(`
    (() => {
      const rect = document.querySelector("#sandbox-stage canvas").getBoundingClientRect();
      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    })()
  `);
  await touchTap(
    canvasRect.left + canvasRect.width * 0.84,
    canvasRect.top + canvasRect.height * 0.45,
  );
  await sleep(90);
  const firstGroundTap = await page.eval(
    `window.__kampungSmoke.getMotionSnapshot()`,
  );
  await touchTap(
    canvasRect.left + canvasRect.width * 0.16,
    canvasRect.top + canvasRect.height * 0.45,
  );
  await sleep(90);
  const redirectedGroundTap = await page.eval(
    `window.__kampungSmoke.getMotionSnapshot()`,
  );
  const upButton = await page.eval(`
    (() => {
      const rect = document.querySelector('[data-direction="up"]').getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()
  `);
  await touchTap(upButton.x, upButton.y);
  await sleep(90);
  const afterDpadCancel = await page.eval(
    `window.__kampungSmoke.getMotionSnapshot()`,
  );
  // CDP's synthetic touch focuses the button after release, unlike the
  // preventDefault path on a physical held d-pad. Restore the world before
  // exercising the independent canvas gestures that follow.
  await page.eval(`document.getElementById("sandbox-stage").focus({ preventScroll: true })`);
  await sleep(80);

  // Start left of Y's bookshelf and tap into its solid side. The former sofa
  // point sits beneath the top-left HUD after camera clamping, where the UI
  // correctly consumes the touch instead of the canvas.
  await page.eval(`
    window.__kampungSmoke.setPlayerPosition(760, 230);
    document.getElementById("sandbox-stage").focus({ preventScroll: true });
  `);
  await sleep(120);
  const blockedPoint = await worldPointToClient(840, 230);
  const blockedPointHitsCanvas = await page.eval(`
    (() => {
      const hit = document.elementFromPoint(
        ${blockedPoint.x},
        ${blockedPoint.y}
      );
      return hit?.matches?.("#sandbox-stage canvas") === true;
    })()
  `);
  if (!blockedPointHitsCanvas) {
    const detail = await page.eval(`
      (() => {
        const hit = document.elementFromPoint(${blockedPoint.x}, ${blockedPoint.y});
        return JSON.stringify({
          point: [${blockedPoint.x}, ${blockedPoint.y}],
          hit: hit ? (hit.id || hit.className || hit.tagName) : null,
          hitTag: hit?.tagName ?? null,
          location: window.__kampungSmoke?.getMotionSnapshot?.()?.locationId ?? null,
          player: window.__kampungSmoke?.getMotionSnapshot?.()?.player ?? null,
          viewport: [innerWidth, innerHeight],
        });
      })()
    `);
    throw new Error("Collision-stall probe did not hit the world canvas: " + detail);
  }
  await touchTap(blockedPoint.x, blockedPoint.y);
  await sleep(1900);
  const afterCollisionStall = await page.eval(
    `window.__kampungSmoke.getMotionSnapshot()`,
  );

  const firstDestination = firstGroundTap.tapNavigation.destination;
  const redirectedDestination = redirectedGroundTap.tapNavigation.destination;
  const tapNavigationEvidence = {
    rejectedGestures,
    started:
      firstGroundTap.tapNavigation.active
      && firstGroundTap.tapNavigation.outcome === "moving"
      && firstGroundTap.tapNavigation.interactionId === null
      && firstGroundTap.tapNavigation.ringVisible,
    redirected:
      redirectedGroundTap.tapNavigation.active
      && redirectedGroundTap.tapNavigation.outcome === "moving"
      && redirectedGroundTap.tapNavigation.ringVisible
      && firstDestination
      && redirectedDestination
      && Math.hypot(
        redirectedDestination.x - firstDestination.x,
        redirectedDestination.y - firstDestination.y,
      ) > 80,
    dpadCancelled:
      !afterDpadCancel.tapNavigation.active
      && !afterDpadCancel.tapNavigation.ringVisible
      && afterDpadCancel.tapNavigation.outcome === "cancelled",
    collisionStalled:
      !afterCollisionStall.tapNavigation.active
      && !afterCollisionStall.tapNavigation.ringVisible
      && afterCollisionStall.tapNavigation.outcome === "stalled",
    followedInteraction:
      Math.hypot(
        farVoiceStart.player.x - 540,
        farVoiceStart.player.y - 390,
      ) > 112
      && followingVoice.tapNavigation.active
      && followingVoice.tapNavigation.interactionId === "npc:voice"
      && followingVoice.tapNavigation.ringVisible
      && farAutoInteracted,
    pointerCleanup:
      followingVoice.tapNavigation.active
      && followingVoice.tapNavigation.interactionId === "npc:voice",
    stableRingSize:
      followingVoice.tapNavigation.ringScreenDiameter >= 27
      && followingVoice.tapNavigation.ringScreenDiameter <= 29,
    syntheticDpad:
      syntheticDpadFocused
      && afterSyntheticDpad.player.x - beforeSyntheticDpad.player.x >= 20
      && !afterSyntheticDpad.tapNavigation.active,
    nearbyInteracted:
      shortDialogue.fits
      && shortDialogue.soleCue
      && shortDialogue.focusRing,
    pinchCss: await page.eval(`
      getComputedStyle(document.getElementById("sandbox-stage")).touchAction === "manipulation"
        && document.querySelector(".touch-controls").getAttribute("role") === "group"
        && Array.from(document.querySelectorAll(
          ".dpad button, #btn-touch-interact"
        )).every((button) => getComputedStyle(button).touchAction === "none")
    `),
  };
  mobileGameEvidence.shortViewports = shortViewportLayouts.every(
    (layout) => layout.fits && layout.journalReachable,
  );
  mobileGameEvidence.shortTitles = shortTitleLayouts.every(
    (layout) => layout.fills && layout.documentLocked && layout.internalOwnsOverflow,
  );
  mobileGameEvidence.tapNavigation = Object.values(tapNavigationEvidence).every(Boolean);
  diagnostics.push(
    `  MOBILE  world=${mobileGameEvidence.world}; ` +
      `journal=${mobileGameEvidence.journal}; ` +
      `dialogue=${mobileGameEvidence.dialogue}; ` +
      `close-focus=${mobileGameEvidence.closedToWorld}; ` +
      `pause=${mobileGameEvidence.pauseRoundTrip}; ` +
      `short=${mobileGameEvidence.shortViewports}; ` +
      `short-title=${mobileGameEvidence.shortTitles}; ` +
      `tap=${mobileGameEvidence.tapNavigation}; ` +
      `drawer=${mobileJournalState.width.toFixed(0)}px; ` +
      `portrait=${portraitEvidence.mobile.portraitWidth.toFixed(0)}x` +
      `${portraitEvidence.mobile.portraitHeight.toFixed(0)}px; ` +
      `zoom=${mobileWorldState.cameraZoom?.toFixed(2) ?? "missing"}x`
  );
  diagnostics.push(
    `  CONSEQUENCE ART  before=${JSON.stringify(consequenceArtEvidence.before)}; ` +
      `exterior=${JSON.stringify(consequenceArtEvidence.exterior)}; ` +
      `interior=${JSON.stringify(consequenceArtEvidence.interior)}; ` +
      `flowers=${JSON.stringify(consequenceArtEvidence.flowers)}`
  );
  diagnostics.push(
    `  TOUCH  ${JSON.stringify(tapNavigationEvidence)}; ` +
      `viewports=${shortViewportLayouts.map((layout) =>
        `${layout.viewport.join("x")}:${layout.fits}/${layout.journalReachable}`
      ).join(",")}; ` +
      `titles=${shortTitleLayouts.map((layout) =>
        `${layout.viewport.join("x")}:${layout.fills}/${layout.documentLocked}/` +
        `${layout.internalOwnsOverflow}`
      ).join(",")}`
  );
  const normalFrameBudget = Math.max(
    28,
    (baselineFramePacing?.p95 ?? 25) + 3,
  );
  const throttledFrameBudget = Math.max(
    34,
    (baselineFramePacing?.p95 ?? 31) + 3,
  );

  check(
    "Every location and living environment renders within the frame budget",
    consoleErrors.length === 0
      && residentMotionEvidence
      && residentMotionEvidence.movedNpcIds.length >= 1
      && residentMotionEvidence.nearbyStopped
      && residentMotionEvidence.markerSync
      && residentMotionEvidence.directionalTexture
      && residentMotionEvidence.flavourInteractionCount === 14
      && residentMotionEvidence.physicalDetail
      && residentMotionEvidence.playerFacesInteraction
      && residentMotionEvidence.playerWalkFrames === 4
      && residentMotionEvidence.playerIdleBlink
      && residentMotionEvidence.residentFourFrameIds.length >= 1
      && residentMotionEvidence.characterArt.residentCount >= 18
      && residentMotionEvidence.characterArt.hairStyleCount >= 7
      && residentMotionEvidence.characterArt.outfitCount >= 7
      // The village has to read as intergenerational, not as an elder
      // enclave: young neighbours are who the story asks you to recruit.
      && residentMotionEvidence.characterArt.youngCount >= 8
      && residentMotionEvidence.characterArt.elderCount >= 6
      && residentMotionEvidence.characterArt.buildCount === 3
      // >= not ===: these gate variety, so they must not fail when the cast
      // gains any. Exact equality here is what broke on the young villagers.
      && residentMotionEvidence.characterArt.accessoryCount >= 6
      && residentMotionEvidence.characterArt.carryingResidentCount >= 6
      && consequenceArtEvidence.before
      && Object.values(consequenceArtEvidence.before).every(
        (artId) => artId === null
      )
      && consequenceArtEvidence.exterior
      && consequenceArtEvidence.exterior.exteriorRamp
        === "ramp-exterior-three-quarter-v1"
      && consequenceArtEvidence.exterior.interiorRamp === null
      && consequenceArtEvidence.exterior.garden
        === "garden-raised-herbs-v1"
      && consequenceArtEvidence.exterior.shelteredRoute
        === "sheltered-linkway-extension-v1"
      && consequenceArtEvidence.interior
      && consequenceArtEvidence.interior.exteriorRamp === null
      && consequenceArtEvidence.interior.interiorRamp
        === "ramp-interior-three-quarter-v1"
      && consequenceArtEvidence.interior.garden === null
      && consequenceArtEvidence.interior.shelteredRoute === null
      && consequenceArtEvidence.flowers
      && consequenceArtEvidence.flowers.exteriorRamp
        === "ramp-exterior-three-quarter-v1"
      && consequenceArtEvidence.flowers.interiorRamp === null
      && consequenceArtEvidence.flowers.garden
        === "garden-flowers-shaded-seat-v1"
      && consequenceArtEvidence.flowers.shelteredRoute === null
      && residentMotionEvidence.movedAmbientIds.length === 2
      && residentMotionEvidence.ambientDirectionalTexture
      && residentMotionEvidence.ambientActivityCount === 5
      && residentMotionEvidence.visibleAmbientActivityCount === 5
      && residentMotionEvidence.ambientActivityTwoFrameIds.length === 5
      && residentMotionEvidence.ambientActivitiesAnimated
      && residentMotionEvidence.ambientFlutterCount === 8
      && residentMotionEvidence.visibleAmbientFlutterCount === 8
      && residentMotionEvidence.movedFlutterIds.length >= 6
      && residentMotionEvidence.ambientFlutterTwoFrameIds.length === 8
      && residentMotionEvidence.ambientFlutterAnimated
      && residentMotionEvidence.laundryChanged
      && residentMotionEvidence.cameraZoom >= 0.9
      && residentMotionEvidence.cameraZoom <= 1
      && residentMotionEvidence.pondRippleCount === 3
      && residentMotionEvidence.pondAnimated
      && reducedMotionEvidence
      && reducedMotionEvidence.residentsStill
      && reducedMotionEvidence.ambientStill
      && reducedMotionEvidence.ambientActivitiesStill
      && reducedMotionEvidence.ambientFlutterStill
      && reducedMotionEvidence.laundryStill
      && reducedMotionEvidence.pondStill
      && reducedMotionEvidence.stepPuffsStill
      && reducedMotionEvidence.playerIdleStill
      && reducedMotionEvidence.buildingOcclusionInstant
      && monsoonWeatherEvidence
      && monsoonWeatherEvidence.active
      && monsoonWeatherEvidence.rainPool
      && monsoonWeatherEvidence.rainVisible
      && monsoonWeatherEvidence.rainAnimated
      && monsoonWeatherEvidence.puddles
      && monsoonWeatherEvidence.puddlesAnimated
      && monsoonWeatherEvidence.shelterDry
      && monsoonWeatherEvidence.shelteredNpcIds.length === 3
      && monsoonWeatherEvidence.catsSheltered
      && monsoonWeatherEvidence.ambientActivitiesStored
      && monsoonWeatherEvidence.ambientFlutterStored
      && monsoonWeatherEvidence.laundryStored
      && monsoonWeatherEvidence.mobile
      && reducedMonsoonEvidence
      && reducedMonsoonEvidence.active
      && reducedMonsoonEvidence.rainPool
      && reducedMonsoonEvidence.rainStill
      && reducedMonsoonEvidence.puddlesStill
      && reducedMonsoonEvidence.residentsStill
      && reducedMonsoonEvidence.catsStill
      && reducedMonsoonEvidence.ambientActivitiesStored
      && reducedMonsoonEvidence.ambientFlutterStored
      && reducedMonsoonEvidence.laundryStored
      && districtTravelEvidence
      && districtTravelEvidence.east
      && districtTravelEvidence.south
      && districtTravelEvidence.minimapMoved
      && questTrackerEvidence
      && Object.values(questTrackerEvidence).every(Boolean)
      && doorLifecycleEvidence
      && doorLifecycleEvidence.entryReady
      && doorLifecycleEvidence.entryOpened
      && doorLifecycleEvidence.entryReturn
      && doorLifecycleEvidence.hawkerExitReady
      && doorLifecycleEvidence.firstReturn
      && doorLifecycleEvidence.secondEntry
      && doorLifecycleEvidence.secondReturn
      && [
        "The First Door",
        "Open the Way",
        "Who Knows Grandma Ros?",
        "A Place at the Table",
        "Hands Remember",
        "The Last Door",
        "Story complete · Free exploration",
      ].every((title) => questStoryTitles.has(title))
      && terrainDetailEvidence
      && terrainDetailEvidence.grassColourCount >= 3
      && terrainDetailEvidence.pathColourCount >= 6
      && terrainDetailEvidence.pathEdgeTransitions >= 12
      // Four houses moved onto the village and five plantings retired with the
      // verges they lined. 41 -> 37 landscaping props, measured, not guessed:
      // there is no unoccupied ground left beside the new houses to re-home
      // them to, and hiding filler planting behind a facade to hold a number
      // would make this floor meaningless.
      && terrainDetailEvidence.landscapePropCount >= 36
      && terrainDetailEvidence.landscapeTextureCount >= 4
      && terrainDetailEvidence.foliageColourCount >= 12
      && terrainDetailEvidence.exteriorPropCount >= 84
      && terrainDetailEvidence.exteriorPropTextureCount >= 20
      && terrainDetailEvidence.storyClusterCount === 12
      && terrainDetailEvidence.storyClusterTextureCount === 6
      && terrainDetailEvidence.groundAccentCount >= 54
      && terrainDetailEvidence.facadeColourCount >= 20
      && terrainDetailEvidence.facadeEdgeTransitions >= 180
      && terrainDetailEvidence.facadeDarkPixelRatio >= 0.08
      // Twelve buildings now, not eight: the four homes became real houses.
      && terrainDetailEvidence.facadeDepthBuildingCount === 12
      && terrainDetailEvidence.facadeEntryRecessCount === 10
      && terrainDetailEvidence.facadeRoofStyleCount === 2
      && terrainDetailEvidence.bicycleRackCount === 3
      && terrainDetailEvidence.motorVehicleCount === 0
      && terrainDetailEvidence.layoutIssueCount === 0
      && terrainDetailEvidence.buildingOcclusionLayerCount === 12
      && facadeCollisionEvidence
      && facadeCollisionEvidence.blocked
      && facadeCollisionEvidence.faded
      && facadeCollisionEvidence.restored
      && facadeCollisionEvidence.obstacleCount >= 90
      && worldFeelEvidence
      && worldFeelEvidence.cameraZoom >= 0.9
      && worldFeelEvidence.cameraZoom <= 1
      && worldFeelEvidence.visibleStepPuffs >= 1
      && worldFeelEvidence.activeStepSurfaces.includes(
        worldFeelEvidence.movementSurface
      )
      && worldFeelEvidence.pondRippleCount === 3
      && worldFeelEvidence.obstacleCount >= 90
      && worldFeelEvidence.scamCheckCardLayout === "icons-and-words"
      && worldFeelEvidence.scamCheckCardVisible
      && worldFeelEvidence.scamCheckCardAlpha >= 0.98
      && scamCheckEvidence.length === 2
      && new Set(
        scamCheckEvidence.map((evidence) => evidence.persistedLayout)
      ).size === 2
      && scamCheckEvidence.every((evidence) =>
        evidence.authoredAdvice
        && evidence.noFailureChoice
        && evidence.elderExpert
        && evidence.persistedLayout === evidence.expectedLayout
        && evidence.cardVisible
        && evidence.cardAlpha >= 0.98
        && evidence.semanticRevisit
      )
      && grassFootstepEvidence
      && grassFootstepEvidence.movementSurface === "grass"
      && grassFootstepEvidence.activeStepSurfaces.includes("grass")
      && grassFootstepEvidence.visibleStepPuffs >= 1
      && stoneFootstepEvidence
      && stoneFootstepEvidence.movementSurface === "stone"
      && stoneFootstepEvidence.activeStepSurfaces.includes("stone")
      && stoneFootstepEvidence.visibleStepPuffs >= 1
      && exteriorWakePaletteSize >= 12
      && exteriorWorldWidth >= browserWidth * 0.9
      && exteriorEdgePaletteSize >= 4
      && mobileGameEvidence
      && Object.values(mobileGameEvidence).every(Boolean)
      && baselineFramePacing
      && wanderingFramePacing
      && wanderingFramePacing.p95 <= normalFrameBudget
      && monsoonFramePacing
      && monsoonFramePacing.p95 <= normalFrameBudget
      && framePacing
      && framePacing.p95 <= normalFrameBudget
      && framePacing.taskMsPerFrame <= 8
      && throttledFramePacing
      && throttledFramePacing.p95 <= throttledFrameBudget
      && throttledFramePacing.taskMsPerFrame <= 20
      // Eleven, not twelve: the shared Block 9 corridor retired when the four
      // homes became their own houses on the village.
      && renderedLocationNames.size === 11,
    [
      consoleErrors.join(" | "),
      residentMotionEvidence
        ? `moving=${residentMotionEvidence.movedNpcIds.join(",") || "none"}, ` +
          `nearby=${residentMotionEvidence.nearbyStopped}, ` +
          `markers=${residentMotionEvidence.markerSync}, ` +
          `directional=${residentMotionEvidence.directionalTexture}, ` +
          `details=${residentMotionEvidence.flavourInteractionCount}, ` +
          `physical-detail=${residentMotionEvidence.physicalDetail}, ` +
          `player-frames=${residentMotionEvidence.playerWalkFrames}, ` +
          `resident-frames=${residentMotionEvidence.residentFourFrameIds.join(",") || "none"}, ` +
          `cast=${JSON.stringify(residentMotionEvidence.characterArt)}, ` +
          `ambient=${residentMotionEvidence.movedAmbientIds.join(",") || "none"}, ` +
          `activities=${residentMotionEvidence.ambientActivityTwoFrameIds.join(",") || "none"}, ` +
          `flutter=${residentMotionEvidence.movedFlutterIds.join(",") || "none"}, ` +
          `laundry=${residentMotionEvidence.laundryChanged}, ` +
          `pond=${residentMotionEvidence.pondAnimated}, ` +
          `zoom=${residentMotionEvidence.cameraZoom.toFixed(2)}x`
        : "resident motion evidence missing",
      reducedMotionEvidence
        ? `reduced-residents=${reducedMotionEvidence.residentsStill}, ` +
          `ambient=${reducedMotionEvidence.ambientStill}, ` +
          `activities=${reducedMotionEvidence.ambientActivitiesStill}, ` +
          `flutter=${reducedMotionEvidence.ambientFlutterStill}, ` +
          `laundry=${reducedMotionEvidence.laundryStill}, ` +
          `pond=${reducedMotionEvidence.pondStill}, ` +
          `puffs=${reducedMotionEvidence.stepPuffsStill}`
        : "reduced-motion evidence missing",
      monsoonWeatherEvidence
        ? `monsoon-active=${monsoonWeatherEvidence.active}, ` +
          `rain-pool=${monsoonWeatherEvidence.rainPool}, ` +
          `visible=${monsoonWeatherEvidence.rainVisible}, ` +
          `animated=${monsoonWeatherEvidence.rainAnimated}, ` +
          `puddles=${monsoonWeatherEvidence.puddlesAnimated}, ` +
          `shelter=${monsoonWeatherEvidence.shelterDry}, ` +
          `residents=${monsoonWeatherEvidence.shelteredNpcIds.join(",") || "none"}, ` +
          `cats=${monsoonWeatherEvidence.catsSheltered}, ` +
          `activities=${monsoonWeatherEvidence.ambientActivitiesStored}, ` +
          `flutter=${monsoonWeatherEvidence.ambientFlutterStored}, ` +
          `laundry=${monsoonWeatherEvidence.laundryStored}, ` +
          `mobile=${monsoonWeatherEvidence.mobile}`
        : "monsoon evidence missing",
      reducedMonsoonEvidence
        ? `reduced-monsoon=${reducedMonsoonEvidence.active}, ` +
          `rain=${reducedMonsoonEvidence.rainStill}, ` +
          `puddles=${reducedMonsoonEvidence.puddlesStill}, ` +
          `residents=${reducedMonsoonEvidence.residentsStill}, ` +
          `cats=${reducedMonsoonEvidence.catsStill}, ` +
          `activities=${reducedMonsoonEvidence.ambientActivitiesStored}, ` +
          `flutter=${reducedMonsoonEvidence.ambientFlutterStored}, ` +
          `laundry=${reducedMonsoonEvidence.laundryStored}`
        : "reduced monsoon evidence missing",
      districtTravelEvidence
        ? `east=${JSON.stringify(districtTravelEvidence.eastPosition)}, ` +
          `south=${JSON.stringify(districtTravelEvidence.southPosition)}, ` +
          `wake-colours=${exteriorWakePaletteSize}, ` +
          `exterior-width=${exteriorWorldWidth.toFixed(0)}px, ` +
          `edge-colours=${exteriorEdgePaletteSize}`
        : "district travel evidence missing",
      questTrackerEvidence
        ? `quest-tracker=${JSON.stringify(questTrackerEvidence)}, ` +
          `story=${JSON.stringify([...questStoryTitles])}`
        : "quest tracker evidence missing",
      terrainDetailEvidence
        ? `grass-colours=${terrainDetailEvidence.grassColourCount}, ` +
          `path-colours=${terrainDetailEvidence.pathColourCount}, ` +
          `path-edges=${terrainDetailEvidence.pathEdgeTransitions}, ` +
          `landscape-props=${terrainDetailEvidence.landscapePropCount}, ` +
          `landscape-forms=${terrainDetailEvidence.landscapeTextureCount}, ` +
          `foliage-colours=${terrainDetailEvidence.foliageColourCount}, ` +
          `exterior-props=${terrainDetailEvidence.exteriorPropCount}, ` +
          `exterior-forms=${terrainDetailEvidence.exteriorPropTextureCount}, ` +
          `story-clusters=${terrainDetailEvidence.storyClusterCount}, ` +
          `story-forms=${terrainDetailEvidence.storyClusterTextureCount}, ` +
          `ground-accents=${terrainDetailEvidence.groundAccentCount}, ` +
          `facade-colours=${terrainDetailEvidence.facadeColourCount}, ` +
          `facade-edges=${terrainDetailEvidence.facadeEdgeTransitions}, ` +
          `facade-dark=${(terrainDetailEvidence.facadeDarkPixelRatio * 100).toFixed(1)}%, ` +
          `facade-depth=${terrainDetailEvidence.facadeDepthBuildingCount}, ` +
          `entry-recesses=${terrainDetailEvidence.facadeEntryRecessCount}, ` +
          `roof-styles=${terrainDetailEvidence.facadeRoofStyleCount}, ` +
          `bicycle-bays=${terrainDetailEvidence.bicycleRackCount}, ` +
          `motor-vehicles=${terrainDetailEvidence.motorVehicleCount}, ` +
          `layout-issues=${terrainDetailEvidence.layoutIssueCount}, ` +
          `occlusion-layers=${terrainDetailEvidence.buildingOcclusionLayerCount}`
        : "terrain detail evidence missing",
      facadeCollisionEvidence
        ? `facade-collision=${facadeCollisionEvidence.blocked}, ` +
          `facade-start=${JSON.stringify(facadeCollisionEvidence.start)}, ` +
          `facade-end=${JSON.stringify(facadeCollisionEvidence.end)}, ` +
          `obstacles=${facadeCollisionEvidence.obstacleCount}`
        : "facade collision evidence missing",
      worldFeelEvidence
        ? `world-zoom=${worldFeelEvidence.cameraZoom.toFixed(2)}x, ` +
          `step-puffs=${worldFeelEvidence.visibleStepPuffs}, ` +
          `surface=${worldFeelEvidence.movementSurface}, ` +
          `pond-ripples=${worldFeelEvidence.pondRippleCount}, ` +
          `world-obstacles=${worldFeelEvidence.obstacleCount}, ` +
          `scam-card=${worldFeelEvidence.scamCheckCardLayout}/` +
          `${worldFeelEvidence.scamCheckCardVisible}`
        : "world feel evidence missing",
      scamCheckEvidence.length
        ? `scam-check=${JSON.stringify(scamCheckEvidence)}`
        : "scam-check evidence missing",
      grassFootstepEvidence
        ? `grass-surface=${grassFootstepEvidence.movementSurface}, ` +
          `grass-puffs=${grassFootstepEvidence.visibleStepPuffs}`
        : "grass footstep evidence missing",
      stoneFootstepEvidence
        ? `stone-surface=${stoneFootstepEvidence.movementSurface}, ` +
          `stone-puffs=${stoneFootstepEvidence.visibleStepPuffs}`
        : "stone footstep evidence missing",
      mobileGameEvidence
        ? `mobile-world=${mobileGameEvidence.world}, ` +
          `mobile-journal=${mobileGameEvidence.journal}, ` +
          `mobile-dialogue=${mobileGameEvidence.dialogue}, ` +
          `mobile-close=${mobileGameEvidence.closedToWorld}`
        : "mobile gameplay evidence missing",
      baselineFramePacing
        ? `baseline-p95=${baselineFramePacing.p95.toFixed(2)}ms, ` +
          `normal-budget=${normalFrameBudget.toFixed(2)}ms, ` +
          `throttled-budget=${throttledFrameBudget.toFixed(2)}ms`
        : "scheduler baseline missing",
      wanderingFramePacing
        ? `resident-p95=${wanderingFramePacing.p95.toFixed(2)}ms`
        : "resident route frame profile missing",
      monsoonFramePacing
        ? `monsoon-p95=${monsoonFramePacing.p95.toFixed(2)}ms`
        : "monsoon frame profile missing",
      framePacing
        ? `p95=${framePacing.p95.toFixed(2)}ms, ` +
          `task=${framePacing.taskMsPerFrame.toFixed(2)}ms/frame`
        : "frame profile missing",
      throttledFramePacing
        ? `4x-p95=${throttledFramePacing.p95.toFixed(2)}ms, ` +
          `task=${throttledFramePacing.taskMsPerFrame.toFixed(2)}ms/frame`
        : "throttled frame profile missing",
      `locations=${renderedLocationNames.size}/11`,
    ].filter(Boolean).join(" | ")
  );
} catch (error) {
  if (error.message !== FOCUS_ONLY_COMPLETE) {
    failures.push(`  FAIL  harness error - ${error.message}`);
  }
} finally {
  cdp?.close();
  if (chrome.exitCode === null) {
    const chromeExited = new Promise((resolve) => chrome.once("exit", resolve));
    chrome.kill();
    await Promise.race([chromeExited, sleep(1500)]);
  }
  server?.kill();
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      await rm(profileDir, { recursive: true, force: true });
      break;
    } catch {
      await sleep(250);
    }
  }
}

console.log("\nKampung SG production-browser smoke\n");
for (const note of notes) console.log(note);
for (const failure of failures) console.log(failure);
for (const diagnostic of diagnostics) console.log(diagnostic);
console.log(
  `\n${notes.length} passed, ${failures.length} failed. Screenshots in ${SHOT_DIR}/\n`
);
process.exit(failures.length === 0 ? 0 : 1);
