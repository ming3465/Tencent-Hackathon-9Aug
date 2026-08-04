/**
 * Builds a narration-ready 90-second review cut from verified gameplay B-roll,
 * production screenshots, and judge-deck slides.
 *
 * This is intentionally not called the final submission video: it contains a
 * silent AAC guide track so a human can add the final voice-over, sound mix,
 * approval, and upload. Open captions and a provenance manifest are generated
 * alongside the MP4.
 *
 * Usage:
 *   node scripts/build-demo-video.mjs
 *   node scripts/build-demo-video.mjs --source docs/video/... --out docs/video/...
 *
 * Requires Node 22+, Chrome, ffmpeg, and ffprobe.
 */

import { spawn } from "node:child_process";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

const WIDTH = 1280;
const HEIGHT = 720;
const CAPTION_HEIGHT = 132;
const FPS = 30;
const TARGET_SECONDS = 90;
const DEFAULT_CHROME =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const args = process.argv.slice(2);
const readFlag = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1];
};

const SOURCE_VIDEO = resolve(
  readFlag("source", "docs/video/kampung-sg-gameplay-broll.mp4"),
);
const SOURCE_BEATS = resolve(
  readFlag("beats", join(dirname(SOURCE_VIDEO), "broll-beats.json")),
);
const OUTPUT_VIDEO = resolve(
  readFlag("out", "docs/video/kampung-sg-demo-review.mp4"),
);
const OUTPUT_MANIFEST = resolve(
  readFlag("manifest", "docs/video/demo-review-beats.json"),
);
const CHROME = readFlag("chrome", DEFAULT_CHROME);

const beatIndex = JSON.parse(await readFile(SOURCE_BEATS, "utf8"));
const beatSecond = (labelPrefix) => {
  const beat = beatIndex.beats?.find((entry) =>
    entry.label.startsWith(labelPrefix),
  );
  if (!beat) {
    throw new Error(
      `Missing "${labelPrefix}" in ${SOURCE_BEATS.replace(`${process.cwd()}/`, "")}`,
    );
  }
  const second = Number(beat.second);
  if (!Number.isFinite(second)) {
    throw new Error(`Invalid second for B-roll beat "${beat.label}"`);
  }
  return second;
};

const segments = [
  {
    id: "cold-open",
    section: "KAMPUNG SG · COZY SINGAPORE SANDBOX",
    caption: "Older adults are the experts—not the patients.",
    duration: 5,
    source: {
      type: "video",
      file: SOURCE_VIDEO,
      start: beatSecond("title screen"),
      beat: "title screen",
    },
  },
  {
    id: "voice-conversation",
    section: "THE FIRST DOOR",
    caption:
      "A visual-novel conversation begins at home—with choice, not urgency.",
    duration: 3.5,
    source: {
      type: "video",
      file: SOURCE_VIDEO,
      start: beatSecond("first conversation") + 0.4,
      beat: "first conversation",
    },
  },
  {
    id: "opening-choice",
    section: "YOUR PACE, YOUR CHOICE",
    caption:
      "One calm choice opens the door. The world responds without a timer or punishment.",
    duration: 4,
    source: {
      type: "video",
      file: SOURCE_VIDEO,
      start: Math.max(0, beatSecond("player choice") - 3),
      beat: "player choice - 3 seconds",
    },
  },
  {
    id: "mr-long",
    section: "CHAPTER 1 · OPEN THE WAY",
    caption:
      "Mr. Long names the real obstacle. You listen, then help make access easier.",
    duration: 7,
    source: {
      type: "image",
      file: resolve("docs/screenshots/19-mr-long-portrait.png"),
    },
  },
  {
    id: "shared-corridor",
    section: "A LIVED-IN BLOCK",
    caption:
      "Move freely through four flats and a shared corridor. No timer. No failure state.",
    duration: 10.5,
    source: {
      type: "video",
      file: SOURCE_VIDEO,
      start: beatSecond("Block 9 corridor"),
      beat: "Block 9 corridor",
    },
  },
  {
    id: "grandma-ros",
    section: "CHAPTER 2 · A PLACE AT THE TABLE",
    caption:
      "Grandma Ros leads the lesson; neighbours bring ingredients, memory, and company.",
    duration: 7,
    source: {
      type: "image",
      file: resolve("docs/screenshots/06-evening-light.png"),
    },
  },
  {
    id: "ben-and-mr-tan",
    section: "CHAPTER 3 · HANDS REMEMBER",
    caption:
      "Ben sets the pace while the player and Mr. Tan weave together—without pressure.",
    duration: 7,
    source: {
      type: "image",
      file: resolve("docs/screenshots/07-evening-reflection.png"),
    },
  },
  {
    id: "living-estate",
    section: "A WORLD WORTH WANDERING",
    caption:
      "A dense, living HDB estate rewards wandering, noticing, and talking to neighbours.",
    duration: 10.7,
    source: {
      type: "video",
      file: SOURCE_VIDEO,
      start: beatSecond("estate wide"),
      beat: "estate wide",
    },
  },
  {
    id: "projection-depth",
    section: "ORIGINAL THREE-QUARTER DEPTH",
    caption:
      "Roof planes, side faces, grounded shadows, and recessed doors make landmarks easier to read.",
    duration: 5,
    source: {
      type: "image",
      file: resolve("docs/screenshots/12-estate-south.png"),
    },
  },
  {
    id: "story-complete",
    section: "THE LAST DOOR",
    caption:
      "The story gathers the kampung—then opens into calm free exploration.",
    duration: 6,
    source: {
      type: "image",
      file: resolve("docs/screenshots/08-day-complete.png"),
    },
  },
  {
    id: "ai-receipts",
    section: "AI—WITH RECEIPTS",
    caption:
      "CodeBuddy and four reviewed OpenAI visual workflows are logged. Rejected outputs stay rejected.",
    duration: 7,
    source: {
      type: "image",
      file: resolve("docs/deck/slides/slide-05.png"),
    },
  },
  {
    id: "engineering",
    section: "ENGINEERING THAT SHIPS",
    caption:
      "Strict TypeScript, deterministic state, accessibility routes, and no backend.",
    duration: 6,
    source: {
      type: "image",
      file: resolve("docs/deck/slides/slide-06.png"),
    },
  },
  {
    id: "claim-boundaries",
    section: "CLAIMS WITH BOUNDARIES",
    caption:
      "We publish what was tested—and clearly name the human evidence still missing.",
    duration: 5,
    source: {
      type: "image",
      file: resolve("docs/deck/slides/slide-07.png"),
    },
  },
  {
    id: "end-slate",
    section: "PLAY KAMPUNG SG",
    caption:
      "TheTwoGuys · Built in public · Scan the QR code for the live judge path.",
    duration: 6.3,
    source: {
      type: "image",
      file: resolve("docs/deck/slides/slide-08.png"),
    },
  },
];

const run = (command, commandArgs, options = {}) =>
  new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, commandArgs, {
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", rejectPromise);
    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise({ stdout, stderr });
        return;
      }
      rejectPromise(
        new Error(`${command} exited ${code}\n${stderr || stdout}`.trim()),
      );
    });
  });

class Cdp {
  #socket;
  #id = 0;
  #pending = new Map();

  constructor(socket) {
    this.#socket = socket;
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (!message.id || !this.#pending.has(message.id)) return;
      const { resolvePromise, rejectPromise, timeout } = this.#pending.get(
        message.id,
      );
      this.#pending.delete(message.id);
      clearTimeout(timeout);
      if (message.error) {
        rejectPromise(new Error(JSON.stringify(message.error)));
        return;
      }
      resolvePromise(message.result);
    });
  }

  static async connect(wsUrl) {
    const socket = new WebSocket(wsUrl);
    await new Promise((resolvePromise, rejectPromise) => {
      socket.addEventListener("open", resolvePromise, { once: true });
      socket.addEventListener("error", rejectPromise, { once: true });
    });
    return new Cdp(socket);
  }

  send(method, params = {}, sessionId) {
    const id = ++this.#id;
    const message = sessionId
      ? { id, method, params, sessionId }
      : { id, method, params };
    return new Promise((resolvePromise, rejectPromise) => {
      const timeout = setTimeout(() => {
        if (!this.#pending.delete(id)) return;
        rejectPromise(new Error(`CDP command timed out: ${method}`));
      }, 30_000);
      this.#pending.set(id, {
        resolvePromise,
        rejectPromise,
        timeout,
      });
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
}

const reservePort = () =>
  new Promise((resolvePromise, rejectPromise) => {
    const server = createServer();
    server.on("error", rejectPromise);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        rejectPromise(new Error("Could not reserve a Chrome debugging port"));
        return;
      }
      server.close((error) => {
        if (error) {
          rejectPromise(error);
          return;
        }
        resolvePromise(address.port);
      });
    });
  });

const startCaptionBrowser = async (workDir) => {
  const port = await reservePort();
  const profileDir = join(workDir, "chrome-profile");
  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      `--remote-debugging-port=${port}`,
      `--window-size=${WIDTH},${CAPTION_HEIGHT}`,
      "--hide-scrollbars",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-background-networking",
      "--disable-sync",
      "--run-all-compositor-stages-before-draw",
      "--force-device-scale-factor=1",
      `--user-data-dir=${profileDir}`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  let version;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      version = await (
        await fetch(`http://127.0.0.1:${port}/json/version`)
      ).json();
      break;
    } catch {
      await sleep(250);
    }
  }
  if (!version) {
    chrome.kill();
    throw new Error("Chrome did not expose a debugging endpoint");
  }

  const cdp = await Cdp.connect(version.webSocketDebuggerUrl);
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
    height: CAPTION_HEIGHT,
    deviceScaleFactor: 1,
    mobile: false,
  });
  return { cdp, chrome, page };
};

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const captionHtml = ({ section, caption }) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <style>
      * {
        box-sizing: border-box;
      }
      html,
      body {
        width: ${WIDTH}px;
        height: ${CAPTION_HEIGHT}px;
        margin: 0;
        overflow: hidden;
        background: #0b3541;
      }
      body {
        font-family: Arial, Helvetica, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      .card {
        position: relative;
        width: 100%;
        height: 100%;
        padding: 15px 52px 14px 58px;
        border-top: 5px solid #f5b842;
        background:
          linear-gradient(90deg, rgba(242, 107, 91, 0.18), transparent 18%),
          #0b3541;
        color: #fff7dc;
      }
      .card::before {
        position: absolute;
        top: 17px;
        bottom: 17px;
        left: 28px;
        width: 6px;
        border-radius: 3px;
        background: #ef6c5b;
        content: "";
      }
      .section {
        margin-bottom: 5px;
        color: #f5b842;
        font-size: 14px;
        font-weight: 800;
        letter-spacing: 2.2px;
        line-height: 18px;
      }
      .caption {
        max-width: 1160px;
        font-size: 28px;
        font-weight: 700;
        letter-spacing: 0.1px;
        line-height: 34px;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <div class="section">${escapeHtml(section)}</div>
      <div class="caption">${escapeHtml(caption)}</div>
    </main>
  </body>
</html>
`;

const totalSeconds = segments.reduce(
  (sum, segment) => sum + segment.duration,
  0,
);
if (Math.abs(totalSeconds - TARGET_SECONDS) > 0.001) {
  throw new Error(
    `Segment timeline is ${totalSeconds}s; expected ${TARGET_SECONDS}s`,
  );
}
const sourceSeconds = Number(beatIndex.seconds);
for (const segment of segments) {
  if (segment.source.type !== "video") continue;
  const end = segment.source.start + segment.duration;
  if (
    !Number.isFinite(sourceSeconds) ||
    segment.source.start < 0 ||
    end > sourceSeconds + 0.05
  ) {
    throw new Error(
      `B-roll clip "${segment.id}" ends at ${end.toFixed(1)}s, outside the ${sourceSeconds}s source`,
    );
  }
}

await Promise.all([
  access(CHROME),
  access(SOURCE_VIDEO),
  access(SOURCE_BEATS),
  ...segments.map((segment) => access(segment.source.file)),
]);
await run("ffmpeg", ["-version"]);
await run("ffprobe", ["-version"]);

await mkdir(dirname(OUTPUT_VIDEO), { recursive: true });
await mkdir(dirname(OUTPUT_MANIFEST), { recursive: true });

const workDir = await mkdtemp(join(tmpdir(), "kampung-demo-video-"));
const partialOutput = join(workDir, "kampung-sg-demo-review.partial.mp4");
const captionFiles = [];
let captionBrowser;

try {
  console.log("Rendering open-caption cards...");
  captionBrowser = await startCaptionBrowser(workDir);
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const stem = `${String(index).padStart(2, "0")}-${segment.id}`;
    const htmlFile = join(workDir, `${stem}.html`);
    const pngFile = join(workDir, `${stem}.png`);
    await writeFile(htmlFile, captionHtml(segment));
    await captionBrowser.page.send("Page.navigate", {
      url: pathToFileURL(htmlFile).href,
    });
    await captionBrowser.page.send("Runtime.evaluate", {
      expression: "document.fonts.ready",
      awaitPromise: true,
    });
    await sleep(80);
    const screenshot = await captionBrowser.page.send(
      "Page.captureScreenshot",
      {
        format: "png",
        fromSurface: true,
        captureBeyondViewport: false,
      },
    );
    await writeFile(pngFile, Buffer.from(screenshot.data, "base64"));
    await access(pngFile);
    captionFiles.push(pngFile);
  }
  captionBrowser.cdp.close();
  captionBrowser.chrome.kill();
  captionBrowser = undefined;

  const inputArgs = ["-y", "-hide_banner", "-loglevel", "error"];
  const sourceIndexes = new Map();
  let inputIndex = 0;

  inputArgs.push("-i", SOURCE_VIDEO);
  sourceIndexes.set(SOURCE_VIDEO, inputIndex);
  inputIndex += 1;

  for (const segment of segments) {
    if (segment.source.type !== "image") continue;
    inputArgs.push(
      "-loop",
      "1",
      "-framerate",
      String(FPS),
      "-t",
      String(segment.duration),
      "-i",
      segment.source.file,
    );
    sourceIndexes.set(segment.id, inputIndex);
    inputIndex += 1;
  }

  const captionIndexes = [];
  for (let index = 0; index < segments.length; index += 1) {
    inputArgs.push(
      "-loop",
      "1",
      "-framerate",
      String(FPS),
      "-t",
      String(segments[index].duration),
      "-i",
      captionFiles[index],
    );
    captionIndexes.push(inputIndex);
    inputIndex += 1;
  }

  const silentAudioIndex = inputIndex;
  inputArgs.push(
    "-f",
    "lavfi",
    "-t",
    String(TARGET_SECONDS),
    "-i",
    "anullsrc=channel_layout=stereo:sample_rate=48000",
  );

  const videoSegments = segments.filter(
    (segment) => segment.source.type === "video",
  );
  const filters = [
    `[0:v]split=${videoSegments.length}${videoSegments
      .map((_, index) => `[rawVideo${index}]`)
      .join("")}`,
  ];
  let videoSourceIndex = 0;

  segments.forEach((segment, index) => {
    if (segment.source.type === "video") {
      filters.push(
        `[rawVideo${videoSourceIndex}]trim=start=${segment.source.start}:duration=${segment.duration},setpts=PTS-STARTPTS,fps=${FPS},scale=${WIDTH}:${HEIGHT}:flags=lanczos,setsar=1[base${index}]`,
      );
      videoSourceIndex += 1;
    } else {
      const sourceIndex = sourceIndexes.get(segment.id);
      filters.push(
        `[${sourceIndex}:v]scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${WIDTH}:${HEIGHT}:(ow-iw)/2:(oh-ih)/2:color=0x102e3b,setsar=1,fps=${FPS},trim=duration=${segment.duration},setpts=PTS-STARTPTS[base${index}]`,
      );
    }
    filters.push(
      `[${captionIndexes[index]}:v]scale=${WIDTH}:${CAPTION_HEIGHT}:flags=lanczos,setsar=1,fps=${FPS},trim=duration=${segment.duration},setpts=PTS-STARTPTS[caption${index}]`,
    );
    filters.push(
      `[base${index}][caption${index}]overlay=x=0:y=H-h:shortest=1[segment${index}]`,
    );
  });

  filters.push(
    `${segments
      .map((_, index) => `[segment${index}]`)
      .join("")}concat=n=${segments.length}:v=1:a=0,format=yuv420p[video]`,
  );

  console.log("Encoding 90-second review cut...");
  await run(
    "ffmpeg",
    [
      ...inputArgs,
      "-filter_complex",
      filters.join(";"),
      "-map",
      "[video]",
      "-map",
      `${silentAudioIndex}:a`,
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-crf",
      "18",
      "-pix_fmt",
      "yuv420p",
      "-r",
      String(FPS),
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-ar",
      "48000",
      "-t",
      String(TARGET_SECONDS),
      "-movflags",
      "+faststart",
      "-map_metadata",
      "-1",
      partialOutput,
    ],
    { cwd: process.cwd() },
  );

  const probe = await run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "stream=index,codec_name,codec_type,width,height,r_frame_rate,pix_fmt",
    "-show_entries",
    "format=duration,size",
    "-of",
    "json",
    partialOutput,
  ]);
  const metadata = JSON.parse(probe.stdout);
  const videoStream = metadata.streams.find(
    (stream) => stream.codec_type === "video",
  );
  const audioStream = metadata.streams.find(
    (stream) => stream.codec_type === "audio",
  );
  const duration = Number(metadata.format.duration);
  if (
    videoStream?.width !== WIDTH ||
    videoStream?.height !== HEIGHT ||
    videoStream?.codec_name !== "h264" ||
    audioStream?.codec_name !== "aac" ||
    Math.abs(duration - TARGET_SECONDS) > 0.05
  ) {
    throw new Error(
      `Unexpected output metadata: ${JSON.stringify(metadata, null, 2)}`,
    );
  }

  await rm(OUTPUT_VIDEO, { force: true });
  await rename(partialOutput, OUTPUT_VIDEO);

  let second = 0;
  const manifestSegments = segments.map((segment) => {
    const manifestSegment = {
      id: segment.id,
      startSecond: +second.toFixed(1),
      durationSeconds: segment.duration,
      section: segment.section,
      openCaption: segment.caption,
      sourceType:
        segment.source.type === "video"
          ? "scripted machine-captured gameplay"
          : segment.source.file.includes("/deck/slides/")
            ? "verified judge-deck slide"
            : "verified production screenshot",
      sourceFile: segment.source.file.replace(`${process.cwd()}/`, ""),
      ...(segment.source.type === "video"
        ? {
            sourceStartSecond: segment.source.start,
            sourceBeat: segment.source.beat,
          }
        : {}),
    };
    second += segment.duration;
    return manifestSegment;
  });
  const manifest = {
    schemaVersion: 1,
    status:
      "Narration-ready review cut; not the final human-approved submission video.",
    outputFile: OUTPUT_VIDEO.replace(`${process.cwd()}/`, ""),
    sourceBeatIndex: SOURCE_BEATS.replace(`${process.cwd()}/`, ""),
    width: WIDTH,
    height: HEIGHT,
    framesPerSecond: FPS,
    durationSeconds: duration,
    videoCodec: videoStream.codec_name,
    pixelFormat: videoStream.pix_fmt,
    audio:
      "Silent stereo AAC guide track. Human voice-over and final sound mix remain required.",
    segments: manifestSegments,
    claimBoundaries: [
      "Gameplay clips are scripted machine captures, not a human play session.",
      "Screenshots and deck slides are verified repository evidence, not live footage.",
      "This cut is not evidence of a human playtest, real-device test, or screen-reader audit.",
      "Final voice-over, sound mix, human approval, and submission upload remain external tasks.",
    ],
  };
  await writeFile(
    OUTPUT_MANIFEST,
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  console.log(`Wrote ${OUTPUT_VIDEO}`);
  console.log(`Wrote ${OUTPUT_MANIFEST}`);
  console.log(
    `Verified ${WIDTH}×${HEIGHT}, ${FPS}fps, ${duration.toFixed(1)}s, H.264 + silent AAC.`,
  );
  console.log(
    "This is a narration-ready review cut, not the final submission video.",
  );
} finally {
  captionBrowser?.cdp.close();
  captionBrowser?.chrome.kill();
  await rm(workDir, {
    recursive: true,
    force: true,
    maxRetries: 5,
  }).catch(() => {});
}
