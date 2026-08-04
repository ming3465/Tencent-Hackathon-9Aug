/**
 * Builds an auditable review package or a fail-closed final submission backup.
 *
 * Review mode is safe to run before human finishing. Its video filename is
 * deliberately impossible to mistake for the required final deliverable.
 *
 * Final mode requires:
 * - the correctly named, voiced, non-silent final video;
 * - an exported CodeBuddy history;
 * - a human-completed approval record;
 * - reachable logged-out game and video URLs;
 * - a clean commit synchronized with local origin/main; and
 * - the repository's complete verification gate.
 *
 * Usage:
 *   node scripts/prepare-submission.mjs review
 *   node scripts/prepare-submission.mjs final \
 *     --video "/path/Kampung SG-Game Demo Video-TheTwoGuys.mp4" \
 *     --codebuddy-history "/path/codebuddy-history.pdf" \
 *     --approvals "docs/submission/FINAL_APPROVALS.json"
 */

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  access,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LIVE_URL = "https://ming3465.github.io/Tencent-Hackathon-9Aug/";
const DEMO_URL = `${LIVE_URL}?demo=1`;
const DECK_PPTX = resolve(
  ROOT,
  "docs/deck/Kampung SG-Project Introduction Deck-TheTwoGuys.pptx",
);
const DECK_PDF = resolve(
  ROOT,
  "docs/deck/Kampung SG-Project Introduction Deck-TheTwoGuys.pdf",
);
const REVIEW_VIDEO = resolve(
  ROOT,
  "docs/video/kampung-sg-demo-review.mp4",
);
const REVIEW_BEATS = resolve(
  ROOT,
  "docs/video/demo-review-beats.json",
);
const AI_EVIDENCE = resolve(ROOT, "docs/submission/AI_EVIDENCE.md");
const AI_USAGE_LOG = resolve(ROOT, "docs/AI_USAGE_LOG.md");
const APPROVALS_EXAMPLE = resolve(
  ROOT,
  "docs/submission/FINAL_APPROVALS.example.json",
);
const FINAL_VIDEO_NAME =
  "Kampung SG-Game Demo Video-TheTwoGuys.mp4";
const REVIEW_VIDEO_NAME =
  "REVIEW ONLY - Kampung SG-Demo Review-TheTwoGuys.mp4";
const MIN_FINAL_AUDIO_PEAK_DB = -50;
const EXPECTED_VIDEO_SECONDS = 90;
const VALID_HISTORY_EXTENSIONS = new Set([
  ".html",
  ".json",
  ".md",
  ".pdf",
  ".txt",
]);

process.chdir(ROOT);

const argv = process.argv.slice(2);
const mode = argv[0] ?? "help";
const args = argv.slice(1);

const usage = `
Kampung SG submission packaging

Review package:
  npm run submission:review

Final fail-closed package:
  npm run submission:final -- \\
    --video "/path/${FINAL_VIDEO_NAME}" \\
    --codebuddy-history "/path/codebuddy-history.pdf" \\
    --approvals "docs/submission/FINAL_APPROVALS.json"

Optional:
  --out "/path/to/output-directory"

Final approvals start from:
  docs/submission/FINAL_APPROVALS.example.json
`;

if (mode === "help" || mode === "--help" || mode === "-h") {
  console.log(usage.trim());
  process.exit(0);
}

if (mode !== "review" && mode !== "final") {
  throw new Error(`Unknown mode "${mode}".\n${usage}`);
}

const readFlag = (name, fallback = undefined) => {
  const index = args.indexOf(`--${name}`);
  if (index === -1) {
    return fallback;
  }
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`--${name} requires a value.`);
  }
  return value;
};

const timestamp = new Date().toISOString().replace(/\D/g, "");
const outputDirectory = resolve(
  readFlag(
    "out",
    join(
      ROOT,
      "artifacts",
      mode === "review"
        ? `submission-review-${timestamp}`
        : `submission-final-${timestamp}`,
    ),
  ),
);
const outputZip = `${outputDirectory}.zip`;

const pathExists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const run = async (
  command,
  commandArgs,
  { cwd = ROOT, inherit = false } = {},
) =>
  new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, commandArgs, {
      cwd,
      stdio: inherit ? "inherit" : ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    if (!inherit) {
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk) => {
        stdout += chunk;
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk;
      });
    }

    child.on("error", rejectPromise);
    child.on("close", (code) => {
      if (code === 0) {
        resolvePromise({ stdout, stderr });
        return;
      }
      rejectPromise(
        new Error(
          [
            `${command} ${commandArgs.join(" ")} exited with ${code}.`,
            stdout.trim(),
            stderr.trim(),
          ]
            .filter(Boolean)
            .join("\n"),
        ),
      );
    });
  });

const sha256 = async (path) => {
  const hash = createHash("sha256");
  hash.update(await readFile(path));
  return hash.digest("hex");
};

const inspectFile = async (path, minimumBytes, label) => {
  const fileStat = await stat(path).catch(() => null);
  if (!fileStat?.isFile()) {
    throw new Error(`${label} is missing: ${path}`);
  }
  if (fileStat.size < minimumBytes) {
    throw new Error(
      `${label} is unexpectedly small (${fileStat.size} bytes): ${path}`,
    );
  }
  return {
    path,
    bytes: fileStat.size,
    sha256: await sha256(path),
  };
};

const inspectDeck = async () => {
  const pptx = await inspectFile(DECK_PPTX, 100_000, "PPTX deck");
  const pdf = await inspectFile(DECK_PDF, 100_000, "PDF deck");

  await run("unzip", ["-t", DECK_PPTX]);
  const pptxEntries = await run("unzip", ["-Z1", DECK_PPTX]);
  const slideCount = pptxEntries.stdout
    .split("\n")
    .filter((entry) => /^ppt\/slides\/slide\d+\.xml$/.test(entry)).length;
  if (slideCount !== 8) {
    throw new Error(`Expected 8 PPTX slides; found ${slideCount}.`);
  }

  const pdfText = (await readFile(DECK_PDF)).toString("latin1");
  const pdfPageCount = pdfText.match(/\/Type\s*\/Page\b/g)?.length ?? 0;
  if (pdfPageCount !== 8) {
    throw new Error(`Expected 8 PDF pages; found ${pdfPageCount}.`);
  }

  return {
    pptx: {
      bytes: pptx.bytes,
      sha256: pptx.sha256,
      slides: slideCount,
    },
    pdf: {
      bytes: pdf.bytes,
      sha256: pdf.sha256,
      pages: pdfPageCount,
    },
  };
};

const inspectVideo = async (path, label) => {
  const file = await inspectFile(path, 1_000_000, label);
  const probeResult = await run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels",
    "-of",
    "json",
    path,
  ]);
  const probe = JSON.parse(probeResult.stdout);
  const videoStream = probe.streams?.find(
    (stream) => stream.codec_type === "video",
  );
  const audioStream = probe.streams?.find(
    (stream) => stream.codec_type === "audio",
  );
  const duration = Number(probe.format?.duration);

  if (!videoStream) {
    throw new Error(`${label} has no video stream.`);
  }
  if (!audioStream) {
    throw new Error(`${label} has no audio stream.`);
  }
  if (
    !Number.isFinite(duration) ||
    Math.abs(duration - EXPECTED_VIDEO_SECONDS) > 0.5
  ) {
    throw new Error(
      `${label} must be 90.0±0.5 s; found ${probe.format?.duration ?? "unknown"} s.`,
    );
  }
  if (videoStream.width < 1280 || videoStream.height < 720) {
    throw new Error(
      `${label} must be at least 1280×720; found ${videoStream.width}×${videoStream.height}.`,
    );
  }
  if (videoStream.codec_name !== "h264") {
    throw new Error(
      `${label} must use H.264 video; found ${videoStream.codec_name}.`,
    );
  }
  if (audioStream.codec_name !== "aac") {
    throw new Error(
      `${label} must use AAC audio; found ${audioStream.codec_name}.`,
    );
  }

  return {
    bytes: file.bytes,
    sha256: file.sha256,
    durationSeconds: duration,
    width: videoStream.width,
    height: videoStream.height,
    frameRate: videoStream.r_frame_rate,
    videoCodec: videoStream.codec_name,
    audioCodec: audioStream.codec_name,
    audioSampleRate: Number(audioStream.sample_rate),
    audioChannels: audioStream.channels,
  };
};

const inspectAudioPeak = async (path) => {
  const result = await run("ffmpeg", [
    "-hide_banner",
    "-nostats",
    "-i",
    path,
    "-map",
    "0:a:0",
    "-af",
    "volumedetect",
    "-f",
    "null",
    "-",
  ]);
  const match = result.stderr.match(/max_volume:\s*(-?[\d.]+|-inf)\s*dB/i);
  if (!match || match[1] === "-inf") {
    throw new Error("Final video audio is silent or could not be measured.");
  }
  const peakDb = Number(match[1]);
  if (!Number.isFinite(peakDb) || peakDb <= MIN_FINAL_AUDIO_PEAK_DB) {
    throw new Error(
      `Final video audio peak is ${peakDb} dB; expected human-audible audio above ${MIN_FINAL_AUDIO_PEAK_DB} dB.`,
    );
  }
  return peakDb;
};

const checkUrl = async (url, { marker = undefined } = {}) => {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") {
    throw new Error(`Public URL must use HTTPS: ${url}`);
  }

  const response = await fetch(url, {
    headers: {
      "Cache-Control": "no-cache",
      "User-Agent": "Kampung-SG-submission-gate/1.0",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`Public URL returned HTTP ${response.status}: ${url}`);
  }

  if (marker) {
    const body = await response.text();
    if (!body.includes(marker)) {
      throw new Error(`Public URL did not contain "${marker}": ${url}`);
    }
  } else {
    await response.body?.cancel();
  }

  return {
    requestedUrl: url,
    finalUrl: response.url,
    status: response.status,
  };
};

const validDate = (value) =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  Number.isFinite(Date.parse(value));

const validateApprovals = (approvals) => {
  const blockers = [];
  const requiredBooleans = [
    [
      "submissionFormAndTermsReviewed",
      "The released submission form and terms have not been reviewed.",
    ],
    [
      "submissionDeadlineConfirmed",
      "The real submission deadline and timezone have not been confirmed.",
    ],
    [
      "teamApprovedDeck",
      "The team has not approved the final deck.",
    ],
    [
      "humanVoiceoverRecorded",
      "Human voice-over has not been recorded.",
    ],
    [
      "soundMixEarChecked",
      "The final sound mix has not been checked by ear.",
    ],
    [
      "teamApprovedFinalVideo",
      "The team has not approved the final video.",
    ],
    [
      "liveGameCheckedLoggedOut",
      "The live game has not been checked while logged out.",
    ],
    [
      "finalVideoCheckedLoggedOut",
      "The published final video has not been checked while logged out.",
    ],
    [
      "codeBuddyHistoryExported",
      "The CodeBuddy chat history has not been exported.",
    ],
  ];
  for (const [field, message] of requiredBooleans) {
    if (approvals[field] !== true) {
      blockers.push(`${field}: ${message}`);
    }
  }

  const requiredDates = [
    ["submissionDeadline", "confirmed submission deadline"],
    ["termsReviewedAt", "terms review timestamp"],
    ["deckApprovedAt", "deck approval timestamp"],
    ["videoApprovedAt", "video approval timestamp"],
    ["audioEarCheckedAt", "audio check timestamp"],
    ["liveLinkCheckedAt", "live-game link check timestamp"],
    ["finalVideoLinkCheckedAt", "final-video link check timestamp"],
  ];
  for (const [field, label] of requiredDates) {
    if (!validDate(approvals[field])) {
      blockers.push(`${field}: missing or invalid ${label}.`);
    }
  }

  const approvedBy = Array.isArray(approvals.approvedBy)
    ? approvals.approvedBy
        .filter((name) => typeof name === "string" && name.trim())
        .map((name) => name.trim())
    : [];
  if (new Set(approvedBy).size < 2) {
    blockers.push("approvedBy: both team members must be named.");
  }

  if (
    typeof approvals.finalVideoPublicUrl !== "string" ||
    !approvals.finalVideoPublicUrl.startsWith("https://")
  ) {
    blockers.push(
      "finalVideoPublicUrl: a published HTTPS video URL is required.",
    );
  }

  return blockers;
};

const scoreRisksFromApprovals = (approvals = {}) => {
  const risks = [];
  if (!approvals.secondCodeBuddyPassEvidenceReference) {
    risks.push(
      "No second successful bounded CodeBuddy pass is referenced; the documented initial failure remains the only confirmed CodeBuddy run.",
    );
  }
  if (!approvals.mioraEvidenceReference) {
    risks.push(
      "No Miora-specific generated asset or before/after evidence is referenced.",
    );
  }
  if (!approvals.olderAdultPlaytestEvidenceReference) {
    risks.push(
      "No consented older-adult playtest evidence is referenced; impact remains a design hypothesis.",
    );
  }
  if (!approvals.deviceAccessibilityEvidenceReference) {
    risks.push(
      "No real-phone/tablet, keyboard-only human, screen-reader, or 200% zoom evidence is referenced.",
    );
  }
  if (
    !Array.isArray(approvals.socialPostUrls) ||
    approvals.socialPostUrls.length === 0
  ) {
    risks.push(
      "No published social-post URLs are referenced, so the optional social bonus remains unverified.",
    );
  }
  return risks;
};

const inspectGit = async () => {
  const commit = (await run("git", ["rev-parse", "HEAD"])).stdout.trim();
  const shortCommit = (
    await run("git", ["rev-parse", "--short=8", "HEAD"])
  ).stdout.trim();
  const status = (
    await run("git", ["status", "--porcelain", "--untracked-files=all"])
  ).stdout.trim();
  const originDelta = (
    await run("git", [
      "rev-list",
      "--left-right",
      "--count",
      "origin/main...HEAD",
    ])
  ).stdout.trim();
  const [behind, ahead] = originDelta.split(/\s+/).map(Number);

  return {
    commit,
    shortCommit,
    clean: status.length === 0,
    status: status || null,
    originMain: {
      behind,
      ahead,
      synchronized: behind === 0 && ahead === 0,
    },
  };
};

const runFullGate = async () => {
  const steps = [
    ["npm", ["run", "typecheck"]],
    ["npm", ["test"]],
    ["npm", ["run", "build"]],
    ["npm", ["audit"]],
    ["npm", ["run", "smoke"]],
  ];
  for (const [command, commandArgs] of steps) {
    console.log(`\n[submission gate] ${command} ${commandArgs.join(" ")}`);
    await run(command, commandArgs, { inherit: true });
  }
};

const copyArtifact = async (source, targetDirectory, targetName) => {
  const target = join(targetDirectory, targetName);
  await copyFile(source, target);
  const targetStat = await stat(target);
  return {
    name: targetName,
    bytes: targetStat.size,
    sha256: await sha256(target),
  };
};

const packageReadme = ({
  packageMode,
  git,
  blockers,
  scoreRisks,
  videoName,
}) => {
  const ready = packageMode === "final" && blockers.length === 0;
  return [
    "KAMPUNG SG — SUBMISSION PACKAGE",
    "================================",
    "",
    `Mode: ${packageMode.toUpperCase()}`,
    `Created from commit: ${git.commit}`,
    `Submission-ready package: ${ready ? "YES" : "NO"}`,
    "",
    packageMode === "review"
      ? "REVIEW ONLY. This package contains the silent narration-ready review cut. Its filename is deliberately not the required final-video filename."
      : "The fail-closed local release gate passed. A human must still submit the form and save the organiser's confirmation.",
    "",
    `Video in this package: ${videoName}`,
    `Live game: ${LIVE_URL}`,
    `Judge path: ${DEMO_URL}`,
    "",
    "Submission blockers:",
    ...(blockers.length > 0
      ? blockers.map((blocker) => `- ${blocker}`)
      : ["- None detected by the local gate."]),
    "",
    "Optional scoring risks:",
    ...scoreRisks.map((risk) => `- ${risk}`),
    "",
    "Claim boundary:",
    "- Automated checks do not count as human playtesting, real-device testing, screen-reader testing, team approval, an audio ear-check, a CodeBuddy run, a Miora run, publishing, or submission.",
    "- Review every field against the released organiser form before upload.",
    "",
  ].join("\n");
};

const buildPackage = async ({
  packageMode,
  git,
  deck,
  video,
  videoSource,
  videoName,
  approvals,
  historySource,
  liveChecks,
  blockers,
  scoreRisks,
  audioPeakDb,
}) => {
  if (await pathExists(outputDirectory)) {
    throw new Error(`Output directory already exists: ${outputDirectory}`);
  }
  if (await pathExists(outputZip)) {
    throw new Error(`Output ZIP already exists: ${outputZip}`);
  }

  const parent = dirname(outputDirectory);
  await mkdir(parent, { recursive: true });
  const stage = await mkdtemp(join(parent, ".submission-stage-"));
  const files = [];

  const linksName = "Kampung SG-Game Web Link-TheTwoGuys.txt";
  await writeFile(
    join(stage, linksName),
    [
      "Kampung SG",
      `Live game: ${LIVE_URL}`,
      `Judge demo path: ${DEMO_URL}`,
      "",
      "The judge path is a pacing mode, not a different game.",
      "",
    ].join("\n"),
    "utf8",
  );
  files.push({
    name: linksName,
    bytes: (await stat(join(stage, linksName))).size,
    sha256: await sha256(join(stage, linksName)),
  });

  files.push(
    await copyArtifact(
      DECK_PPTX,
      stage,
      "Kampung SG-Project Introduction Deck-TheTwoGuys.pptx",
    ),
  );
  files.push(
    await copyArtifact(
      DECK_PDF,
      stage,
      "Kampung SG-Project Introduction Deck-TheTwoGuys.pdf",
    ),
  );
  files.push(await copyArtifact(videoSource, stage, videoName));
  files.push(
    await copyArtifact(
      AI_EVIDENCE,
      stage,
      "Kampung SG-AI Evidence-TheTwoGuys.md",
    ),
  );
  files.push(
    await copyArtifact(
      AI_USAGE_LOG,
      stage,
      "Kampung SG-AI Usage Log-TheTwoGuys.md",
    ),
  );
  files.push(
    await copyArtifact(
      REVIEW_BEATS,
      stage,
      "Kampung SG-Video Provenance-TheTwoGuys.json",
    ),
  );

  if (packageMode === "review") {
    files.push(
      await copyArtifact(
        APPROVALS_EXAMPLE,
        stage,
        "REVIEW ONLY - Final Approvals Template.json",
      ),
    );
  } else {
    const historyExtension = extname(historySource).toLowerCase();
    files.push(
      await copyArtifact(
        historySource,
        stage,
        `Kampung SG-CodeBuddy Chat History-TheTwoGuys${historyExtension}`,
      ),
    );
    const approvalsName = "Kampung SG-Human Approvals-TheTwoGuys.json";
    await writeFile(
      join(stage, approvalsName),
      `${JSON.stringify(approvals, null, 2)}\n`,
      "utf8",
    );
    files.push({
      name: approvalsName,
      bytes: (await stat(join(stage, approvalsName))).size,
      sha256: await sha256(join(stage, approvalsName)),
    });
  }

  const readmeName = "README-FIRST.txt";
  await writeFile(
    join(stage, readmeName),
    packageReadme({
      packageMode,
      git,
      blockers,
      scoreRisks,
      videoName,
    }),
    "utf8",
  );
  files.push({
    name: readmeName,
    bytes: (await stat(join(stage, readmeName))).size,
    sha256: await sha256(join(stage, readmeName)),
  });

  const manifest = {
    schemaVersion: 1,
    project: "Kampung SG",
    team: "TheTwoGuys",
    packageMode,
    createdAt: new Date().toISOString(),
    submissionReady: packageMode === "final" && blockers.length === 0,
    git,
    liveChecks,
    deck,
    video: {
      packagedName: videoName,
      ...video,
      audioPeakDb: audioPeakDb ?? null,
    },
    blockers,
    optionalScoringRisks: scoreRisks,
    files,
    claimBoundary:
      "Automated evidence is not a human playtest, physical-device test, screen-reader session, team approval, audio ear-check, AI-tool run, social post, or organiser submission.",
  };
  const manifestName = "Kampung SG-Submission Manifest-TheTwoGuys.json";
  await writeFile(
    join(stage, manifestName),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  await rename(stage, outputDirectory);
  await run("zip", ["-q", "-r", outputZip, "."], {
    cwd: outputDirectory,
  });

  return {
    outputDirectory,
    outputZip,
    zipBytes: (await stat(outputZip)).size,
    zipSha256: await sha256(outputZip),
    manifest,
  };
};

const main = async () => {
  const finalVideoPath = readFlag("video");
  const historyPath = readFlag("codebuddy-history");
  const approvalsPath = resolve(
    readFlag(
      "approvals",
      join(ROOT, "docs/submission/FINAL_APPROVALS.json"),
    ),
  );

  if (mode === "final") {
    const missing = [];
    if (!finalVideoPath) {
      missing.push(`--video "/path/${FINAL_VIDEO_NAME}"`);
    }
    if (!historyPath) {
      missing.push("--codebuddy-history \"/path/codebuddy-history.pdf\"");
    }
    if (!(await pathExists(approvalsPath))) {
      missing.push(
        `human approvals file (copy ${APPROVALS_EXAMPLE} to ${approvalsPath})`,
      );
    }
    if (missing.length > 0) {
      throw new Error(
        [
          "Final package blocked. Missing:",
          ...missing.map((item) => `- ${item}`),
          "",
          "The silent review cut cannot be submitted as the final video.",
        ].join("\n"),
      );
    }
  }

  console.log("[submission gate] Inspecting deck and review media...");
  const deck = await inspectDeck();
  const reviewVideo = await inspectVideo(
    REVIEW_VIDEO,
    "Narration-ready review cut",
  );
  const reviewBeats = JSON.parse(await readFile(REVIEW_BEATS, "utf8"));
  if (reviewBeats.durationSeconds !== EXPECTED_VIDEO_SECONDS) {
    throw new Error(
      `Video provenance duration is ${reviewBeats.durationSeconds}; expected ${EXPECTED_VIDEO_SECONDS}.`,
    );
  }

  console.log("[submission gate] Checking logged-out public game routes...");
  const liveChecks = {
    game: await checkUrl(LIVE_URL, { marker: "Kampung SG" }),
    demo: await checkUrl(DEMO_URL, { marker: "Kampung SG" }),
  };
  let approvals = {};
  let video = reviewVideo;
  let videoSource = REVIEW_VIDEO;
  let videoName = REVIEW_VIDEO_NAME;
  let audioPeakDb = null;
  let historySource = null;
  let blockers = [
    "Replace the silent review cut with the correctly named human-voiced final video.",
    "Export and include the genuine CodeBuddy chat history.",
    "Complete the human approval record after reviewing the released form and final media.",
    "Publish the final video and verify its public link while logged out.",
  ];

  if (mode === "final") {
    videoSource = resolve(finalVideoPath);
    historySource = resolve(historyPath);
    videoName = basename(videoSource);
    blockers = [];

    if (videoName !== FINAL_VIDEO_NAME) {
      blockers.push(
        `Final video filename must be exactly "${FINAL_VIDEO_NAME}"; found "${videoName}".`,
      );
    }

    const historyExtension = extname(historySource).toLowerCase();
    if (!VALID_HISTORY_EXTENSIONS.has(historyExtension)) {
      blockers.push(
        `CodeBuddy history must be one of ${[...VALID_HISTORY_EXTENSIONS].join(", ")}; found "${historyExtension || "no extension"}".`,
      );
    } else {
      await inspectFile(
        historySource,
        500,
        "Exported CodeBuddy chat history",
      ).catch((error) => blockers.push(error.message));
    }

    approvals = JSON.parse(await readFile(approvalsPath, "utf8"));
    blockers.push(...validateApprovals(approvals));

    if (blockers.length > 0) {
      throw new Error(
        [
          "Final package blocked by human-input validation:",
          ...blockers.map((blocker) => `- ${blocker}`),
        ].join("\n"),
      );
    }

    video = await inspectVideo(videoSource, "Final submission video");
    if (video.sha256 === reviewVideo.sha256) {
      throw new Error(
        "Final video is byte-identical to the silent review cut. Renaming the review cut is not human finishing.",
      );
    }
    audioPeakDb = await inspectAudioPeak(videoSource);
    liveChecks.finalVideo = await checkUrl(
      approvals.finalVideoPublicUrl,
    );

    console.log("[submission gate] Running the complete release gate...");
    await runFullGate();
  }

  const git = await inspectGit();
  if (mode === "final") {
    const gitBlockers = [];
    if (!git.clean) {
      gitBlockers.push(`Working tree is not clean:\n${git.status}`);
    }
    if (!git.originMain.synchronized) {
      gitBlockers.push(
        `HEAD is not synchronized with local origin/main (behind ${git.originMain.behind}, ahead ${git.originMain.ahead}).`,
      );
    }
    if (gitBlockers.length > 0) {
      throw new Error(
        [
          "Final package blocked by repository state:",
          ...gitBlockers.map((blocker) => `- ${blocker}`),
        ].join("\n"),
      );
    }
  }

  const scoreRisks = scoreRisksFromApprovals(approvals);
  const result = await buildPackage({
    packageMode: mode,
    git,
    deck,
    video,
    videoSource,
    videoName,
    approvals,
    historySource,
    liveChecks,
    blockers,
    scoreRisks,
    audioPeakDb,
  });

  console.log(
    JSON.stringify(
      {
        mode,
        submissionReady: result.manifest.submissionReady,
        outputDirectory: result.outputDirectory,
        outputZip: result.outputZip,
        zipBytes: result.zipBytes,
        zipSha256: result.zipSha256,
        blockers: result.manifest.blockers,
        optionalScoringRisks: result.manifest.optionalScoringRisks,
      },
      null,
      2,
    ),
  );
};

try {
  await main();
} catch (error) {
  console.error(
    `\n[submission gate] BLOCKED\n${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
}
