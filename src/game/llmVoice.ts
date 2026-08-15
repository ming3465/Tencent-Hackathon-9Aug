import type { NpcIntentKind } from "./campaignTypes.js";

/**
 * Live NPC re-voicing through the language model already built into the
 * browser (Chrome's Prompt API / Gemini Nano). Opt-in behind `?llm=1`.
 *
 * Nothing is downloaded by this game and nothing leaves the device: the model
 * ships with the browser, there is no API key, no server and no network call.
 * KampungMind still decides *which* beat plays; this only re-words the line it
 * chose, and any failure falls back to the authored text.
 *
 * ## Why only some lines are re-voiced
 *
 * Measured on Gemini Nano 2026-08-15, with an explicit rule and a few-shot
 * example forbidding it, the model twice rewrote Mdm Siti's
 *
 *   "That route floods every monsoon, {player}. We should shelter it properly."
 *
 * as "...we really must reinforce the drainage properly." Her quest builds a
 * *sheltered linkway* and the game renders it. A line that asks for drainage
 * next to a covered walkway is worse than no re-voicing at all, and no
 * validator can catch that class of drift - it is fluent, plausible, and
 * wrong.
 *
 * So consequence-bearing kinds are never sent to the model. Greetings,
 * reflections and memory reactions name no world change, and on those the same
 * model reads well.
 */

/**
 * Intent kinds whose lines may be re-voiced.
 *
 * Deliberately a small allowlist rather than a blocklist: a new intent kind
 * defaults to authored-only, which is the safe direction to fail.
 */
export const REVOICEABLE_KINDS: ReadonlySet<NpcIntentKind> = new Set<NpcIntentKind>([
  "greeting",
  "reflection",
  "memory-reaction",
]);

export function mayRevoice(kind: NpcIntentKind): boolean {
  return REVOICEABLE_KINDS.has(kind);
}

/** Claim vocabulary that must never reach a player, generated or not. */
const BANNED = [
  "diagnos", "demen", "alzheim", "therap", "treatment", "treat ", "cure",
  "prevent", "symptom", "patient", "medication", "prescri", "cognitive decline",
];

export type VoiceCheck =
  | { ok: true; line: string }
  | { ok: false; reason: string };

/**
 * Decides whether a generated line may replace its authored source.
 *
 * Pure, so it is unit-tested without a browser or a model. Rejection is normal
 * operation, not an error path - the caller simply keeps the authored line.
 */
export function validateRevoicing(
  source: string,
  candidate: string,
  speakerName: string,
): VoiceCheck {
  // Models like to wrap answers in quotes or prefix them with a label.
  const line = candidate
    .trim()
    .replace(/^["'“‘]|["'”’]$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (line.length === 0) return { ok: false, reason: "empty" };
  if (line.length > source.length * 1.6 + 40) return { ok: false, reason: "too long" };
  if (line.split(/(?<=[.!?])\s/).length > 3) return { ok: false, reason: "too many sentences" };

  // Only `{player}` may appear, and it must still be there if it was there.
  // Extra occurrences are tolerated: the model adds them constantly despite
  // being told not to, and they resolve to the player's chosen name, which
  // reads well. Losing one would leave the line oddly impersonal.
  const tokens = line.match(/\{[^}]*\}/g) ?? [];
  if (tokens.some((token) => token !== "{player}")) {
    return { ok: false, reason: `unknown token ${tokens.find((t) => t !== "{player}")}` };
  }
  const sourceTokens = (source.match(/\{player\}/g) ?? []).length;
  if (tokens.length < sourceTokens) return { ok: false, reason: "dropped {player}" };

  // A number the author did not write is an invented fact.
  const sourceDigits = new Set(source.match(/\d/g) ?? []);
  for (const digit of line.match(/\d/g) ?? []) {
    if (!sourceDigits.has(digit)) return { ok: false, reason: "invented a number" };
  }

  // Third-person self-reference: the model narrating the character instead of
  // being them. Observed as "Aunty needs a little help with that garden bed".
  //
  // Articles are skipped because a speaker called "The Voice" would otherwise
  // reject every line containing the word "the". Honorifics are deliberately
  // NOT skipped — "Aunty", "Uncle" and "Mdm" are exactly how the model names a
  // character in the third person, so they must stay checkable.
  const nameWords = speakerName
    .split(/\s+/)
    .filter((part) => part.length > 2 && !["the", "and", "for"].includes(part.toLowerCase()));
  for (const word of nameWords) {
    if (!source.includes(word) && new RegExp(`\\b${word}\\b`, "i").test(line)) {
      return { ok: false, reason: `refers to ${word} in the third person` };
    }
  }

  const lowered = line.toLowerCase();
  for (const term of BANNED) {
    if (lowered.includes(term) && !source.toLowerCase().includes(term)) {
      return { ok: false, reason: `introduced "${term.trim()}"` };
    }
  }

  // No point swapping a line for itself.
  if (lowered === source.toLowerCase()) return { ok: false, reason: "unchanged" };

  return { ok: true, line };
}

/**
 * The persona and rules given once per session. Few-shot examples are here
 * because rule text alone did not stop the model naming the speaker.
 */
export const VOICE_SYSTEM_PROMPT = `You rewrite one line of dialogue for a cozy Singapore HDB-estate game.

ABSOLUTE RULES:
1. Output ONLY the rewritten line. No preamble, no quotes, no explanation.
2. Speak in FIRST PERSON as the character. Never write the character's own name.
3. Every fact, object, place and requested action in the ORIGINAL must survive. Add nothing that is not in the ORIGINAL.
4. One or two sentences. Warm, natural Singapore English. No "lah", no "ya", no phonetic accent.
5. No medical, diagnostic, therapeutic or dementia words. Ever.

EXAMPLES

ORIGINAL: The bench outside got wet again, so nobody sits there after rain.
GOOD: After it rains that bench stays damp, so everyone just walks past it.
BAD: Uncle Seng says the bench is wet.

ORIGINAL: Same table, same time. Thirty-one years now.
GOOD: I always sit at the same table, same time. Thirty-one years now.
BAD: Aunty has been sitting there for thirty-one years.`;

export function buildVoicePrompt(
  speakerName: string,
  traits: readonly string[],
  line: string,
): string {
  return `Character: ${speakerName}. Traits: ${traits.join(", ")}.\nORIGINAL: ${line}`;
}

export type LlmVoiceState =
  | "off"
  | "unsupported"
  | "downloadable"
  /** Session being constructed; the model may already be on disk. */
  | "starting"
  /** Actually fetching weights — only set once progress events arrive. */
  | "downloading"
  | "ready"
  | "error";

interface LanguageModelLike {
  prompt(input: string, options?: { signal?: AbortSignal }): Promise<string>;
}

interface LanguageModelCtor {
  availability(): Promise<string>;
  create(options?: Record<string, unknown>): Promise<LanguageModelLike>;
}

function languageModel(): LanguageModelCtor | null {
  const candidate = (globalThis as { LanguageModel?: LanguageModelCtor }).LanguageModel;
  return typeof candidate?.availability === "function" ? candidate : null;
}

/**
 * Owns the single model session and every fallback decision.
 *
 * Deliberately holds no campaign state and never writes any: it is handed a
 * string and returns a string or null.
 */
export class LlmVoice {
  #state: LlmVoiceState = "off";
  #session: LanguageModelLike | null = null;
  #timeoutMs: number;
  #lastLatencyMs: number | null = null;
  #lastRejection: string | null = null;
  #accepted = 0;
  #rejected = 0;

  constructor(options: { timeoutMs?: number } = {}) {
    // Generous on purpose. Generation runs while the player walks towards
    // someone, never while they wait, so this is not a responsiveness budget —
    // it only stops a stalled request lingering. Measured ~800-1000 ms alone
    // but 1200+ ms with the game rendering beside it, and a tighter value
    // silently rejected every good line as "timed out".
    this.#timeoutMs = options.timeoutMs ?? 5000;
  }

  get state(): LlmVoiceState {
    return this.#state;
  }

  get lastLatencyMs(): number | null {
    return this.#lastLatencyMs;
  }

  get lastRejection(): string | null {
    return this.#lastRejection;
  }

  get counts(): { accepted: number; rejected: number } {
    return { accepted: this.#accepted, rejected: this.#rejected };
  }

  /** Reports support without downloading anything. */
  async detect(): Promise<LlmVoiceState> {
    const api = languageModel();
    if (!api) {
      this.#state = "unsupported";
      return this.#state;
    }
    try {
      const availability = await api.availability();
      this.#state = availability === "available"
        ? "downloadable"
        : availability === "downloading"
          ? "downloading"
          : availability === "unavailable"
            ? "unsupported"
            : "downloadable";
      // `available` still needs `start()` to build the session.
      if (availability === "unavailable") this.#state = "unsupported";
      return this.#state;
    } catch {
      this.#state = "error";
      return this.#state;
    }
  }

  /**
   * Builds the session. Must be called from a user gesture the first time on a
   * machine that has not fetched the model - Chrome refuses otherwise with
   * `NotAllowedError`, so a page cannot silently pull several gigabytes.
   */
  async start(onProgress?: (loaded: number) => void): Promise<LlmVoiceState> {
    const api = languageModel();
    if (!api) {
      this.#state = "unsupported";
      return this.#state;
    }
    if (this.#session) {
      this.#state = "ready";
      return this.#state;
    }
    try {
      this.#state = "starting";
      this.#session = await api.create({
        temperature: 0.9,
        topK: 8,
        initialPrompts: [{ role: "system", content: VOICE_SYSTEM_PROMPT }],
        monitor: (monitor: EventTarget) => {
          monitor.addEventListener("downloadprogress", (event) => {
            this.#state = "downloading";
            onProgress?.((event as ProgressEvent).loaded ?? 0);
          });
        },
      });
      this.#state = "ready";
    } catch {
      this.#session = null;
      this.#state = "error";
    }
    return this.#state;
  }

  /**
   * Returns a validated re-voicing, or `null` to mean "use the authored line".
   * Never throws and never blocks longer than the timeout.
   */
  async revoice(
    kind: NpcIntentKind,
    speakerName: string,
    traits: readonly string[],
    line: string,
  ): Promise<string | null> {
    if (this.#state !== "ready" || !this.#session) return null;
    if (!mayRevoice(kind)) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.#timeoutMs);
    const started = Date.now();
    try {
      const raw = await this.#session.prompt(
        buildVoicePrompt(speakerName, traits, line),
        { signal: controller.signal },
      );
      this.#lastLatencyMs = Date.now() - started;
      const verdict = validateRevoicing(line, raw, speakerName);
      if (!verdict.ok) {
        this.#rejected += 1;
        this.#lastRejection = verdict.reason;
        return null;
      }
      this.#accepted += 1;
      this.#lastRejection = null;
      return verdict.line;
    } catch {
      this.#lastLatencyMs = Date.now() - started;
      this.#rejected += 1;
      this.#lastRejection = "timed out";
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}
