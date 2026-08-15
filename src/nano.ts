import {
  LlmVoice,
  buildVoicePrompt,
  retentionRatio,
  retentionThreshold,
  validateRevoicing,
} from "./game/llmVoice.js";
import type { NpcIntentKind } from "./game/campaignTypes.js";

/**
 * A judge-facing proof surface for the on-device model.
 *
 * The `?inspect=1` panel inside the game is a developer read-out - monospace,
 * dense, and unreadable from the back of a room. This page exists to be shown
 * on a projector: one line in, one line out, the latency, and the guard's
 * verdict, in type large enough to read from a seat.
 *
 * It deliberately imports the *same* `llmVoice` module the game uses. Nothing
 * here reimplements the prompt or the checks, so what a judge watches is the
 * shipped behaviour rather than a demo mock-up.
 */

const el = <T extends HTMLElement>(id: string): T => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing #${id}`);
  return node as T;
};

const statusDot = el("status-dot");
const statusText = el("status-text");
const runButton = el<HTMLButtonElement>("run");
const kindSelect = el<HTMLSelectElement>("kind");
const sourceField = el<HTMLTextAreaElement>("source");
const outputBox = el("output");
const verdictBox = el("verdict");
const latencyBox = el("latency");
const netCount = el("net-count");
const promptBox = el("prompt");
const authoredBox = el("authored");

/**
 * Counts every network request the page makes after load.
 *
 * This is the claim that matters and the one a judge is most entitled to
 * doubt, so it is measured rather than asserted: generating a line must not
 * move this number.
 */
let requestsSinceLoad = 0;
try {
  new PerformanceObserver((list) => {
    requestsSinceLoad += list.getEntries().length;
    netCount.textContent = String(requestsSinceLoad);
  }).observe({ type: "resource", buffered: false });
} catch {
  netCount.textContent = "n/a";
}

const voice = new LlmVoice({ timeoutMs: 30_000 });

const setStatus = (state: string, label: string): void => {
  statusDot.dataset.state = state;
  statusText.textContent = label;
};

const PRESETS: Record<string, { kind: NpcIntentKind; line: string }> = {
  greeting: {
    kind: "greeting",
    line: "Morning. The kettle just boiled if you want some.",
  },
  reflection: {
    kind: "reflection",
    line: "Same table, same time. Thirty-one years now.",
  },
  request: {
    kind: "offer-request",
    line: "That route floods every monsoon, {player}. We should shelter it properly.",
  },
};

el("presets").addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest("button[data-preset]");
  if (!(button instanceof HTMLElement)) return;
  const preset = PRESETS[button.dataset.preset ?? ""];
  if (!preset) return;
  sourceField.value = preset.line;
  kindSelect.value = preset.kind;
});

async function boot(): Promise<void> {
  setStatus("wait", "checking…");
  const detected = await voice.detect();
  if (detected === "unsupported") {
    setStatus("bad", "not available in this browser — Chrome desktop only");
    runButton.disabled = true;
    runButton.textContent = "Unavailable";
    return;
  }
  setStatus("wait", "ready to start — press the button");
  runButton.disabled = false;
}

runButton.addEventListener("click", async () => {
  runButton.disabled = true;

  if (voice.state !== "ready") {
    // First press doubles as the user gesture Chrome demands before it will
    // fetch the model, and warms the session so later lines are fast.
    setStatus("wait", "starting the model… (first run can take a minute)");
    runButton.textContent = "Starting…";
    const started = await voice.start((loaded) => {
      setStatus("wait", `downloading the model… ${Math.round(loaded * 100)}%`);
    });
    if (started !== "ready") {
      setStatus("bad", `could not start (${started})`);
      runButton.disabled = false;
      runButton.textContent = "Try again";
      return;
    }
  }

  setStatus("good", "on-device model ready");
  requestsSinceLoad = 0;
  netCount.textContent = "0";
  runButton.textContent = "Re-voice this line";

  const source = sourceField.value.trim();
  const kind = kindSelect.value as NpcIntentKind;
  const speaker = "Uncle Ravi";
  const traits = ["void-deck organiser", "retired", "dry humour"];

  authoredBox.textContent = source;
  promptBox.textContent = buildVoicePrompt(speaker, traits, source);
  outputBox.textContent = "…";
  verdictBox.textContent = "";
  verdictBox.className = "verdict";

  const netBefore = requestsSinceLoad;
  const began = performance.now();
  const line = await voice.revoice(kind, speaker, traits, source);
  const took = Math.round(performance.now() - began);

  latencyBox.textContent = `${took} ms · ${requestsSinceLoad - netBefore} network requests`;

  if (line) {
    outputBox.textContent = line;
    verdictBox.textContent =
      `ACCEPTED · meaning retained ${retentionRatio(source, line).toFixed(2)}`
      + ` (needs ${retentionThreshold(kind).toFixed(2)})`;
    verdictBox.classList.add("ok");
  } else {
    // Show what the model actually said and why it was refused — the refusal
    // is the more interesting half of the demo.
    outputBox.textContent = "(the authored line was kept)";
    verdictBox.textContent = `REFUSED · ${voice.lastRejection ?? "no answer in time"}`
      + " — the player sees the authored line instead";
    verdictBox.classList.add("no");
  }

  runButton.disabled = false;
});

// Expose the raw check so a sceptical judge can try their own pair in console.
(window as unknown as Record<string, unknown>).__nanoCheck = validateRevoicing;

void boot();
