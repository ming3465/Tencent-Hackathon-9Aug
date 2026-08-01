/**
 * Captures each deck slide as a 1280x720 PNG so the PPTX export can use
 * pixel-identical slide images. Requires the deck to be served over HTTP
 * (Chrome will not reliably load sibling images from file:// URLs).
 *
 * Usage: node scripts/capture-deck.mjs [--url http://127.0.0.1:8899/deck/index.html]
 */

import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};

const URL_ = flag("url", "http://127.0.0.1:8899/deck/index.html");
const OUT = flag("out", "docs/deck/slides");
const PORT = Number(flag("port", "9333"));

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    "--disable-gpu",
    "--hide-scrollbars",
    "--window-size=1280,720",
    "--force-device-scale-factor=2",
    "--user-data-dir=/tmp/kampung-deck-profile",
    "about:blank",
  ],
  { stdio: "ignore" }
);

let socket;
try {
  await mkdir(OUT, { recursive: true });

  let version;
  for (let i = 0; i < 40; i += 1) {
    try {
      version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
      break;
    } catch {
      await sleep(250);
    }
  }
  if (!version) throw new Error("Chrome debugging endpoint never appeared");

  socket = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    socket.addEventListener("open", res, { once: true });
    socket.addEventListener("error", rej, { once: true });
  });

  let id = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    }
  });
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, { resolve, reject });
      socket.send(JSON.stringify(sessionId ? { id: mid, method, params, sessionId } : { id: mid, method, params }));
    });

  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  const page = (method, params) => send(method, params, sessionId);

  await page("Page.enable");
  await page("Runtime.enable");
  await page("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 720,
    deviceScaleFactor: 2,
    mobile: false,
  });
  await page("Page.navigate", { url: URL_ });
  await sleep(3000);

  const boxes = (
    await page("Runtime.evaluate", {
      expression: `JSON.stringify(Array.from(document.querySelectorAll(".slide")).map((s) => {
        const r = s.getBoundingClientRect();
        return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height };
      }))`,
      returnByValue: true,
    })
  ).result.value;

  const slides = JSON.parse(boxes);
  if (slides.length === 0) throw new Error("No .slide elements found");

  for (const [index, box] of slides.entries()) {
    const { data } = await page("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      clip: { ...box, scale: 2 },
    });
    const name = `${OUT}/slide-${String(index + 1).padStart(2, "0")}.png`;
    await writeFile(name, Buffer.from(data, "base64"));
    console.log(`captured ${name}  (${Math.round(box.width)}x${Math.round(box.height)})`);
  }

  console.log(`\n${slides.length} slides captured to ${OUT}/`);
} finally {
  socket?.close();
  chrome.kill();
}
