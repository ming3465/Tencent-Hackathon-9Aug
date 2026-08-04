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
const PORT = Number(readFlag("port", "9222"));
const CAPTURE_LOCATION_GALLERY = args.includes("--location-gallery");

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
let facadeCollisionEvidence = null;
let worldFeelEvidence = null;
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
        reject(new Error(`CDP command timed out after 30 seconds: ${method}`));
      }, 30_000);
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
      3000
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
    return {
      ...pacing,
      taskMsPerFrame:
        ((after.TaskDuration ?? 0) - (before.TaskDuration ?? 0)) * 1000 / 120,
      scriptMsPerFrame:
        ((after.ScriptDuration ?? 0) - (before.ScriptDuration ?? 0)) * 1000 / 120,
    };
  };

  const walkWorld = async (key, code, keyCode, duration) => {
    await page.eval(`document.getElementById("sandbox-stage").focus()`);
    await page.key("keyDown", "Shift", "ShiftLeft", 16);
    await page.key("keyDown", key, code, keyCode);
    await sleep(duration);
    await page.key("keyUp", key, code, keyCode);
    await page.key("keyUp", "Shift", "ShiftLeft", 16);
    await sleep(350);
  };

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
        if (!button) return false;
        button.click();
        return true;
      })()
    `);
    if (!clicked) throw new Error(`Could not find button "${label}" in "${section || "document"}"`);
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
      firstLine.length > 20
        && (await page.eval(`!!document.querySelector("#dialog-portrait svg")`))
        && (await page.eval(`
          (() => {
            const button = document.getElementById("btn-dialog-advance");
            return button?.textContent.trim() === ">"
              && button.getAttribute("aria-label") === "Continue dialogue"
              && button.getBoundingClientRect().width >= 48
              && button.getBoundingClientRect().height >= 48;
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
      await clickButton("Use the first door", "Main Story", "Block 9 Corridor");
    } else {
      await page.eval(`document.getElementById("sandbox-stage").focus()`);
      await page.key("keyDown", "ArrowDown", "ArrowDown", 40);
      await sleep(330);
      await page.key("keyUp", "ArrowDown", "ArrowDown", 40);
      await page.key("keyDown", "ArrowLeft", "ArrowLeft", 37);
      await sleep(480);
      await page.key("keyUp", "ArrowLeft", "ArrowLeft", 37);
      await sleep(250);
      const exitPrompt = await page.eval(`document.getElementById("nearby-text").textContent`);
      check("Keyboard movement reaches Y's usable door", /Block 9 Corridor/i.test(exitPrompt), exitPrompt);
      await page.key("keyDown", "e", "KeyE", 69);
      await sleep(100);
      await page.key("keyUp", "e", "KeyE", 69);
      await sleep(850);
    }
    check(
      "The first door enters the HDB corridor",
      /Block 9 Corridor/i.test(await page.eval(`document.getElementById("area-name").textContent`))
    );
  };

  const inspectMrLong = async (testTouchExit) => {
    await clickButton("Visit Mr. Long", "Main Story", "Mr. Long's Flat");
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

  const recruitHelpers = async (count) => {
    const requests = [
      "A Garden People Use",
      "An Invitation, Not a Notice",
      "Shade That Follows the Route",
    ];
    for (const request of requests.slice(0, count)) await completeRequest(request);
    check(
      `${count} distinct helper routes advance to Chapter 2`,
      /CHAPTER 2/i.test(await page.eval(`document.getElementById("chapter-label").textContent`))
    );
  };

  const completeChapter2 = async (attendeeCount) => {
    await clickButton("Ask Auntie Minah", "Main Story");
    await completeDialogueChoice();
    await clickButton("Ask Uncle Seng", "Main Story");
    await completeDialogueChoice();
    check(
      "Two independent clues open Grandma Ros's kitchen",
      /kitchen is now open/i.test(await page.eval(`document.getElementById("campaign-progress").textContent`))
    );
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
      "Two authored clues unlock Ben's flat",
      /Visit Ben/i.test(
        await page.eval(`
          Array.from(document.querySelectorAll("#journal-detail button"))
            .map((button) => button.textContent).join(" | ")
        `)
      )
    );
    await clickButton("Visit Ben's flat", "Main Story", "Ben's Flat");
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
    await page.shot(`${SHOT_DIR}/07-evening-reflection.png`);
  };

  const completeEnding = async () => {
    await clickButton("Return to Y's flat", "Main Story", "Y's Flat");
    await clickButton("Listen at the last door", "Main Story");
    await completeDialogueChoice();
    check(
      "The Last Door ends in free exploration",
      /Story complete/i.test(await page.eval(`document.getElementById("chapter-label").textContent`))
    );
    const saved = JSON.parse(await page.eval(`localStorage.getItem("kampung-sg.campaign.v1")`));
    check(
      "Full campaign autosave retains every completed chapter",
      saved?.completedChapters?.length === 5,
      JSON.stringify(saved?.completedChapters)
    );
    await page.shot(`${SHOT_DIR}/08-day-complete.png`);
  };

  const verifyResidentLife = async () => {
    await clickJournalItem("Places", "Kampung SG Estate");
    await sleep(500);
    await page.eval(`document.getElementById("sandbox-stage").focus()`);
    const initial = await page.eval(
      `window.__kampungSmoke?.getMotionSnapshot?.() ?? null`
    );
    if (!initial || initial.locationId !== "estate") {
      throw new Error("Smoke-only resident motion snapshot was unavailable");
    }
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
          `bicycle-bays=${terrainDetailEvidence.bicycleRackCount}; ` +
          `motor-vehicles=${terrainDetailEvidence.motorVehicleCount}; ` +
          `layout-issues=${terrainDetailEvidence.layoutIssueCount}; ` +
          `occlusion-layers=${terrainDetailEvidence.buildingOcclusionLayerCount}; ` +
          `obstacles=${initial.obstacleCount}`
        : "  TILE  terrain detail evidence missing"
    );

    await walkToAxis("x", 810);
    await walkToAxis("y", 540);
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
    await page.key("keyDown", "e", "KeyE", 69);
    await sleep(100);
    await page.key("keyUp", "e", "KeyE", 69);
    await sleep(260);
    const detailFacing = await page.eval(
      `window.__kampungSmoke?.getMotionSnapshot?.() ?? null`
    );
    await page.eval(`document.getElementById("btn-dialog-advance").click()`);
    await sleep(80);
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

    await page.eval(`document.getElementById("sandbox-stage").focus()`);
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
    await walkToAxis("x", 700);
    await walkToAxis("y", 400);

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
    // Leave the north-crossing prop line before travelling east. A straight
    // axis-only hold can correctly meet the planter/trolley collision shells;
    // the player route goes around them just as a real player would.
    await walkToAxis("y", 650);
    await walkToAxis("x", 1280);
    await page.shot(`${SHOT_DIR}/27-ambient-micro-scenes.png`);
    await walkToAxis("y", 400);
    await walkToAxis("x", 700);
  };

  const verifyReducedEnvironment = async () => {
    await clickJournalItem("Places", "Kampung SG Estate");
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
        && before.ambientActivities.length === 4
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
        && after.buildingOcclusion.length === 8,
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
        && mobileWeather.zoom >= 0.99
        && mobileWeather.zoom <= 1.01
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
    await recruitHelpers(helpers);
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

  const titleScreenEvidence = await page.eval(`
    (() => {
      const art = document.querySelector(".title-art");
      return {
        title: document.title.includes("Kampung SG"),
        noOverflow: document.documentElement.scrollWidth <= window.innerWidth,
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
    "Start button is present and focusable",
    await page.eval(`!document.getElementById("btn-start").hidden`)
  );
  baselineFramePacing = await sampleFramePacing();
  diagnostics.push(
    `  BASE  title-screen scheduler: ` +
      `median ${baselineFramePacing.median.toFixed(2)}ms, ` +
      `p95 ${baselineFramePacing.p95.toFixed(2)}ms`
  );
  await page.shot(`${SHOT_DIR}/01-title.png`);
  await page.eval(`document.getElementById("btn-start").click()`);
  await sleep(2200);

  check(
    "Exactly one Phaser canvas is created",
    (await page.eval(`document.querySelectorAll("#sandbox-stage canvas").length`)) === 1
  );
  const closedWorldWidth = await page.eval(
    `document.querySelector(".world-shell").getBoundingClientRect().width`
  );
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
  await page.eval(`document.getElementById("btn-journal").click()`);
  await sleep(240);
  const openedJournal = await page.eval(`
    (() => {
      const panel = document.getElementById("journal-panel");
      return {
        open: panel.classList.contains("open"),
        expanded: document.getElementById("btn-journal").getAttribute("aria-expanded"),
        hidden: panel.getAttribute("aria-hidden"),
        inert: panel.hasAttribute("inert"),
        focus: document.activeElement?.id,
        backdrop: document.getElementById("journal-backdrop").classList.contains("open"),
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
  await page.eval(
    `document.querySelector("#journal-detail .journal-track-button")?.click()`
  );
  await sleep(80);
  const journalTracking = await page.eval(`
    document.getElementById("btn-journal").dataset.tracked === "true"
      && document.querySelector("#journal-detail .journal-track-button")
        ?.getAttribute("aria-pressed") === "true"
      && /Tracking The First Door/.test(
        document.getElementById("estate-minimap").getAttribute("aria-label")
      )
  `);
  await page.eval(
    `document.querySelector("#journal-detail .journal-track-button")?.click()`
  );
  await sleep(80);
  await page.eval(`
    document.getElementById("journal-sound-summary").focus()
  `);
  await page.key("keyDown", "Tab", "Tab", 9);
  await page.key("keyUp", "Tab", "Tab", 9);
  const journalFocusWrapped = await page.eval(
    `document.activeElement?.id === "btn-journal-close"`
  );
  await page.key("keyDown", "Escape", "Escape", 27);
  await page.key("keyUp", "Escape", "Escape", 27);
  await sleep(240);
  const escapedJournal = await page.eval(`
    (() => {
      const panel = document.getElementById("journal-panel");
      return {
        open: panel.classList.contains("open"),
        expanded: document.getElementById("btn-journal").getAttribute("aria-expanded"),
        hidden: panel.getAttribute("aria-hidden"),
        inert: panel.hasAttribute("inert"),
        focus: document.activeElement?.id,
      };
    })()
  `);
  await page.eval(`document.getElementById("btn-journal").click()`);
  await sleep(120);
  await page.eval(`document.getElementById("journal-backdrop").click()`);
  await sleep(240);
  const backdropClosedJournal = await page.eval(
    `!document.getElementById("journal-panel").classList.contains("open")`
  );
  const beforeSoundMovement = await page.eval(
    `window.__kampungSmoke?.getMotionSnapshot?.() ?? null`
  );
  await page.eval(`document.getElementById("btn-sound").click()`);
  await sleep(100);
  const soundReturnedFocus = await page.eval(
    `document.activeElement?.id === "sandbox-stage"`
  );
  await page.key("keyDown", "ArrowLeft", "ArrowLeft", 37);
  await sleep(240);
  await page.key("keyUp", "ArrowLeft", "ArrowLeft", 37);
  await sleep(100);
  const afterSoundMovement = await page.eval(
    `window.__kampungSmoke?.getMotionSnapshot?.() ?? null`
  );
  await page.eval(`document.getElementById("btn-sound").click()`);
  await sleep(100);
  const soundFocusEvidence = {
    focus: soundReturnedFocus,
    movement:
      beforeSoundMovement
      && afterSoundMovement
      && beforeSoundMovement.player.x - afterSoundMovement.player.x >= 18,
    guide:
      afterSoundMovement
      && afterSoundMovement.playerGuide.visible
      && Math.abs(
        afterSoundMovement.playerGuide.x - afterSoundMovement.player.x
      ) <= 1
      && afterSoundMovement.playerGuide.tipY
        <= afterSoundMovement.player.y - 35
      && afterSoundMovement.playerGuide.depth >= 100_000,
  };
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
  await sleep(140);
  const enteredFullscreen = await page.eval(`
    (() => ({
      active:
        document.fullscreenElement === document.documentElement
        && document.documentElement.classList.contains("game-fullscreen")
        && document.getElementById("world-shell").classList.contains("fullscreen-active"),
      pressed:
        document.getElementById("btn-fullscreen").getAttribute("aria-pressed"),
      focus: document.activeElement?.id,
      hint:
        getComputedStyle(document.querySelector(".fullscreen-hint")).display,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      shell: (() => {
        const rect = document.getElementById("world-shell").getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      })(),
    }))()
  `);
  await page.eval(`document.exitFullscreen()`);
  await sleep(140);
  const exitedFullscreen = await page.eval(`
    (() => ({
      active:
        document.fullscreenElement === null
        && !document.documentElement.classList.contains("game-fullscreen")
        && !document.getElementById("world-shell").classList.contains("fullscreen-active"),
      pressed:
        document.getElementById("btn-fullscreen").getAttribute("aria-pressed"),
      focus: document.activeElement?.id,
    }))()
  `);
  await page.eval(`
    delete document.documentElement.requestFullscreen;
    delete document.exitFullscreen;
    delete document.fullscreenElement;
    delete window.__kampungFullscreenMock;
    document.getElementById("sandbox-stage").focus();
  `);
  const fullscreenEvidence = {
    control: await page.eval(`!!document.getElementById("btn-fullscreen")`),
    entered:
      enteredFullscreen.active
      && enteredFullscreen.pressed === "true"
      && enteredFullscreen.focus === "sandbox-stage"
      && enteredFullscreen.hint === "block"
      && enteredFullscreen.shell.width >= enteredFullscreen.viewport.width - 1
      && enteredFullscreen.shell.height >= enteredFullscreen.viewport.height - 1,
    exited:
      exitedFullscreen.active
      && exitedFullscreen.pressed === "false"
      && exitedFullscreen.focus === "btn-sound",
  };
  const journalDrawerEvidence = {
    worldFirstLayout: gameLayoutWidth >= browserWidth * 0.9,
    spaciousInterior:
      closedWorldWidth >= browserWidth * 0.9
      && closedWorldWidth <= browserWidth,
    interiorRoomFits: interiorCameraEvidence.roomFits,
    circularMap:
      minimapEvidence.visible
      && minimapEvidence.circular
      && minimapEvidence.insideWorld
      && minimapEvidence.landmarks === 7
      && minimapEvidence.currentLandmarks === 1
      && minimapEvidence.place === "Y's Flat"
      && /^translate\(/.test(minimapEvidence.playerTransform ?? ""),
    keyboardTabs: journalTabKeyboard,
    tracking: journalTracking,
    opened:
      openedJournal.open
      && openedJournal.expanded === "true"
      && openedJournal.hidden === "false"
      && openedJournal.inert === false
      && openedJournal.focus === "btn-journal-close"
      && openedJournal.backdrop
      && openedJournal.tabs === 4
      && openedJournal.selectedTab === "story"
      && openedJournal.sections === 4
      && openedJournal.detailTitle === "The First Door"
      && openedJournal.objectives === 2
      && openedJournal.progress === "0%",
    focusWrapped: journalFocusWrapped,
    escaped:
      escapedJournal.open === false
      && escapedJournal.expanded === "false"
      && escapedJournal.hidden === "true"
      && escapedJournal.inert
      && escapedJournal.focus === "sandbox-stage",
    backdropClosed: backdropClosedJournal,
    soundFocus:
      soundFocusEvidence.focus
      && soundFocusEvidence.movement
      && soundFocusEvidence.guide,
    fullscreen:
      fullscreenEvidence.control
      && fullscreenEvidence.entered
      && fullscreenEvidence.exited,
  };
  diagnostics.push(
    `  UI  room=${closedWorldWidth.toFixed(0)}px; ` +
      `layout=${gameLayoutWidth.toFixed(0)}/${browserWidth}px; ` +
      `room-edge-colours=${interiorRightEdgeColours}; ` +
      `room-fit=${journalDrawerEvidence.interiorRoomFits}@` +
      `${interiorCameraEvidence.zoom.toFixed(2)}x; ` +
      `minimap=${JSON.stringify(minimapEvidence)}; ` +
      `tabs=${journalDrawerEvidence.keyboardTabs}; ` +
      `tracking=${journalDrawerEvidence.tracking}; ` +
      `journal-open=${journalDrawerEvidence.opened}; ` +
      `focus-wrap=${journalDrawerEvidence.focusWrapped}; ` +
      `escape=${journalDrawerEvidence.escaped}; ` +
      `backdrop=${journalDrawerEvidence.backdropClosed}; ` +
      `sound-focus=${JSON.stringify(soundFocusEvidence)}; ` +
      `fullscreen=${JSON.stringify(fullscreenEvidence)}`
  );
  check(
    "World reports ready with sound and dynamic Journal controls",
    (await page.eval(`document.getElementById("sandbox-stage").getAttribute("aria-busy")`)) === "false"
      && (await page.eval(`!!document.getElementById("btn-sound")`))
      && (await page.eval(`document.querySelectorAll(".journal-section").length === 4`))
      && Object.values(journalDrawerEvidence).every(Boolean),
    JSON.stringify(journalDrawerEvidence)
  );
  await page.shot(`${SHOT_DIR}/02-neighbourhood.png`);
  renderedLocationNames.add("Y's Flat");
  await page.shot(`${SHOT_DIR}/03-nearby-resident.png`);
  await runCampaign({
    helpers: 3,
    attendees: 5,
    physicalControls: true,
    environmentMode: "living",
  });

  const galleryLocations = [
    "Block 9 Corridor",
    "Mr. Long's Flat",
    "Grandma Ros's Kitchen",
    "Ben's Flat",
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

  await clickJournalItem("Places", "Kampung SG Estate");
  await sleep(700);
  const returnedAreaName = await page.eval(
    `document.getElementById("area-name").textContent.trim()`
  );
  if (returnedAreaName.toLowerCase() !== "kampung sg estate") {
    throw new Error(`Exterior wake retained the wrong area: ${returnedAreaName}`);
  }
  exteriorWorldWidth = await page.eval(
    `document.querySelector(".world-shell").getBoundingClientRect().width`
  );
  exteriorEdgePaletteSize = await page.eval(`
    (() => {
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
  renderedLocationNames.add("Kampung SG Estate");
  await page.eval(`document.getElementById("sandbox-stage").focus()`);
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
  await page.eval(`document.getElementById("sandbox-stage").focus()`);
  await page.key("keyDown", "ArrowRight", "ArrowRight", 39);
  await sleep(230);
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
      }
    : null;
  diagnostics.push(
    worldFeelEvidence
      ? `  FEEL  zoom=${worldFeelEvidence.cameraZoom.toFixed(2)}x; ` +
        `step-puffs=${worldFeelEvidence.visibleStepPuffs}; ` +
        `surface=${worldFeelEvidence.movementSurface}; ` +
        `pond-ripples=${worldFeelEvidence.pondRippleCount}; ` +
        `obstacles=${worldFeelEvidence.obstacleCount}`
      : "  FEEL  world feedback snapshot missing"
  );
  await page.shot(`${SHOT_DIR}/05-choice-consequence.png`);
  await page.shotElement("#sandbox-stage canvas", `${SHOT_DIR}/hero-evening.png`);
  await walkToAxis("x", 350);
  await walkToAxis("y", 520);
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
  await walkToAxis("y", 400);
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
      && afterFacadeCollision.player.y >= 250
      && afterFacadeCollision.player.y <= 325,
    start: beforeFacadeCollision?.player ?? null,
    end: afterFacadeCollision?.player ?? null,
    obstacleCount: afterFacadeCollision?.obstacleCount ?? 0,
    faded:
      activeFacadeOcclusion?.faded === true
      && activeFacadeOcclusion.alpha <= 0.35,
    restored:
      restoredFacadeOcclusion?.faded === false
      && restoredFacadeOcclusion.alpha >= 0.98,
  };
  diagnostics.push(
    `  FACADE  collision=${facadeCollisionEvidence.blocked}; ` +
      `faded=${facadeCollisionEvidence.faded}; ` +
      `restored=${facadeCollisionEvidence.restored}; ` +
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

  await page.eval(`document.getElementById("btn-return-title").click()`);
  await sleep(650);
  check(
    "Back to title destroys the Phaser canvas",
    (await page.eval(`document.querySelectorAll("#sandbox-stage canvas").length`)) === 0
  );
  check(
    "Continue and confirmed Start Over are offered for a saved campaign",
    await page.eval(`
      !document.getElementById("btn-continue").hidden
      && !document.getElementById("btn-start-over").hidden
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
  await page.eval(`document.getElementById("btn-start").click()`);
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
      && document.getElementById("btn-start-over")
      && !document.getElementById("btn-start-over").hidden`,
    "saved title actions before Start Over"
  );
  await page.eval(`window.confirm = () => true; document.getElementById("btn-start-over").click()`);
  await sleep(1600);
  check(
    "Confirmed Start Over replaces progress with a fresh prologue",
    /PROLOGUE/i.test(await page.eval(`document.getElementById("chapter-label").textContent`))
  );
  const freshSave = JSON.parse(await page.eval(`localStorage.getItem("kampung-sg.campaign.v1")`));
  check(
    "Start Over persists a valid versioned initial save",
    freshSave?.version === 1 && freshSave?.completedChapters?.length === 0
  );
  await page.eval(`document.getElementById("btn-return-title").click()`);
  await sleep(400);

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
      };
    })()
  `);
  await page.shot(`${SHOT_DIR}/14-mobile-game.png`);
  await page.eval(`document.getElementById("btn-touch-interact").click()`);
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
      && mobileWorldState.minimap.inside,
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
      portraitEvidence.mobile.open
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
  };
  diagnostics.push(
    `  MOBILE  world=${mobileGameEvidence.world}; ` +
      `journal=${mobileGameEvidence.journal}; ` +
      `dialogue=${mobileGameEvidence.dialogue}; ` +
      `close-focus=${mobileGameEvidence.closedToWorld}; ` +
      `drawer=${mobileJournalState.width.toFixed(0)}px; ` +
      `portrait=${portraitEvidence.mobile.portraitWidth.toFixed(0)}x` +
      `${portraitEvidence.mobile.portraitHeight.toFixed(0)}px; ` +
      `zoom=${mobileWorldState.cameraZoom?.toFixed(2) ?? "missing"}x`
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
      && residentMotionEvidence.movedAmbientIds.length === 2
      && residentMotionEvidence.ambientDirectionalTexture
      && residentMotionEvidence.ambientActivityCount === 4
      && residentMotionEvidence.visibleAmbientActivityCount === 4
      && residentMotionEvidence.ambientActivityTwoFrameIds.length === 4
      && residentMotionEvidence.ambientActivitiesAnimated
      && residentMotionEvidence.ambientFlutterCount === 8
      && residentMotionEvidence.visibleAmbientFlutterCount === 8
      && residentMotionEvidence.movedFlutterIds.length >= 6
      && residentMotionEvidence.ambientFlutterTwoFrameIds.length === 8
      && residentMotionEvidence.ambientFlutterAnimated
      && residentMotionEvidence.laundryChanged
      && residentMotionEvidence.cameraZoom >= 1.3
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
      && terrainDetailEvidence
      && terrainDetailEvidence.grassColourCount >= 3
      && terrainDetailEvidence.pathColourCount >= 6
      && terrainDetailEvidence.pathEdgeTransitions >= 12
      && terrainDetailEvidence.landscapePropCount >= 40
      && terrainDetailEvidence.landscapeTextureCount >= 4
      && terrainDetailEvidence.foliageColourCount >= 12
      && terrainDetailEvidence.exteriorPropCount >= 88
      && terrainDetailEvidence.exteriorPropTextureCount >= 20
      && terrainDetailEvidence.storyClusterCount === 12
      && terrainDetailEvidence.storyClusterTextureCount === 6
      && terrainDetailEvidence.groundAccentCount >= 54
      && terrainDetailEvidence.facadeColourCount >= 20
      && terrainDetailEvidence.facadeEdgeTransitions >= 180
      && terrainDetailEvidence.facadeDarkPixelRatio >= 0.08
      && terrainDetailEvidence.bicycleRackCount === 3
      && terrainDetailEvidence.motorVehicleCount === 0
      && terrainDetailEvidence.layoutIssueCount === 0
      && terrainDetailEvidence.buildingOcclusionLayerCount === 8
      && facadeCollisionEvidence
      && facadeCollisionEvidence.blocked
      && facadeCollisionEvidence.faded
      && facadeCollisionEvidence.restored
      && facadeCollisionEvidence.obstacleCount >= 90
      && worldFeelEvidence
      && worldFeelEvidence.cameraZoom >= 1.3
      && worldFeelEvidence.visibleStepPuffs >= 1
      && worldFeelEvidence.activeStepSurfaces.includes(
        worldFeelEvidence.movementSurface
      )
      && worldFeelEvidence.pondRippleCount === 3
      && worldFeelEvidence.obstacleCount >= 90
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
      && renderedLocationNames.size === 12,
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
          `world-obstacles=${worldFeelEvidence.obstacleCount}`
        : "world feel evidence missing",
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
      `locations=${renderedLocationNames.size}/12`,
    ].filter(Boolean).join(" | ")
  );
} catch (error) {
  failures.push(`  FAIL  harness error - ${error.message}`);
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
