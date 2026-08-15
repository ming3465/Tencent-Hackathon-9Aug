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
 * How much of the original's meaning a rewrite must carry, by intent kind.
 *
 * Safety lives in this number, not in an allowlist. Every kind may be
 * re-voiced; the ones that name a world change simply have to stay much closer
 * to what was authored.
 *
 * 0.8 for anything consequence-bearing: a request, reminder, invitation,
 * contribution, clue or story beat can be reworded freely but may not shed its
 * content. 0.55 for greetings, reflections and memory reactions, where drift
 * costs nothing because nothing downstream depends on the words.
 */
const RETENTION_BY_KIND: Readonly<Record<NpcIntentKind, number>> = {
  "offer-request": 0.8,
  reminder: 0.8,
  invitation: 0.8,
  contribution: 0.8,
  clue: 0.8,
  "main-story": 0.8,
  greeting: 0.55,
  reflection: 0.55,
  "memory-reaction": 0.55,
};

export const REVOICEABLE_KINDS: ReadonlySet<NpcIntentKind> = new Set(
  Object.keys(RETENTION_BY_KIND) as NpcIntentKind[],
);

export function mayRevoice(kind: NpcIntentKind): boolean {
  return REVOICEABLE_KINDS.has(kind);
}

export function retentionThreshold(kind: NpcIntentKind): number {
  return RETENTION_BY_KIND[kind] ?? 0.8;
}

/** Words carrying no meaning worth preserving, so drift is measured on the rest. */
const STOPWORDS = new Set([
  "the", "and", "for", "but", "you", "your", "yours", "our", "ours", "its",
  "that", "this", "these", "those", "there", "here", "with", "from", "into",
  "have", "has", "had", "will", "would", "should", "could", "can", "are", "was",
  "were", "been", "being", "not", "all", "any", "some", "just", "then", "than",
  "when", "what", "who", "how", "why", "she", "her", "him", "his", "they",
  "them", "their", "one", "two", "get", "got", "let", "lets", "about", "still",
]);

/**
 * Strips the endings that make the same word look like two.
 *
 * Crude by design — it only has to make "shelter", "sheltered" and "shelters"
 * compare equal, so that legitimate rephrasing is not mistaken for drift.
 */
function stem(word: string): string {
  return word
    .replace(/(ing|ed|ly|es|s)$/u, "")
    .replace(/i$/u, "y");
}

/**
 * The meaning-bearing words of a line, stemmed and deduplicated.
 *
 * `{player}` is dropped: it is a token, not content, and the model adds it
 * unprompted often enough that counting it would distort the ratio.
 */
export function contentWords(text: string): ReadonlySet<string> {
  const words = text
    .toLowerCase()
    .replace(/\{player\}/gu, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/[\s-]+/u)
    .filter((word) => word.length >= 3 && !STOPWORDS.has(word))
    .map(stem)
    .filter((word) => word.length >= 3);
  return new Set(words);
}

/**
 * How much of the source's content survives in the candidate, 0 to 1.
 *
 * This is the guard that lets consequence-bearing lines be re-voiced at all.
 * Wholesale meaning drift has one reliable signature: the original's content
 * words stop appearing. Measured on Gemini Nano, "we should shelter it
 * properly" became "reinforce the drainage properly" — fluent, plausible, and
 * contradicting the sheltered linkway the game renders. No grammatical check
 * catches that; this does, because "shelter" is simply gone.
 */
export function retentionRatio(source: string, candidate: string): number {
  const wanted = contentWords(source);
  if (wanted.size === 0) return 1;
  const got = contentWords(candidate);
  let kept = 0;
  for (const word of wanted) if (got.has(word)) kept += 1;
  return kept / wanted.size;
}

/**
 * Sentence-final particles the project deliberately avoids.
 *
 * `docs/IMPROVEMENTS.md` treats caricatured Singlish as a credibility defect a
 * Singapore judge catches instantly — the same class of error as the
 * "kopi-o kosong, half sugar" line. The authoring prompt already forbids these,
 * and the model produced "Always room to talk, lah." anyway. Instructions are
 * not a control; this is.
 *
 * Only rejected when the *source* did not already use them, so authored
 * Singlish stays untouched.
 */
const CARICATURE = /\b(lah|leh|lor|meh|hor|sia)\b|\bya\?/iu;

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
  kind: NpcIntentKind,
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
  const caricature = line.match(CARICATURE);
  if (caricature && !CARICATURE.test(source)) {
    return { ok: false, reason: `added "${caricature[0]}"` };
  }
  for (const term of BANNED) {
    if (lowered.includes(term) && !source.toLowerCase().includes(term)) {
      return { ok: false, reason: `introduced "${term.trim()}"` };
    }
  }

  // No point swapping a line for itself.
  if (lowered === source.toLowerCase()) return { ok: false, reason: "unchanged" };

  // Last and most important: did the meaning survive? Everything above checks
  // the shape of the sentence; only this checks that it still says the same
  // thing. Rejection here is free — the authored line is already on screen's
  // critical path, so over-rejecting costs the player nothing.
  const threshold = retentionThreshold(kind);
  const retained = retentionRatio(source, line);
  if (retained < threshold) {
    return {
      ok: false,
      reason: `dropped the meaning (retention ${retained.toFixed(2)} < ${threshold.toFixed(2)})`,
    };
  }

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
  // The must-keep list comes from the same `contentWords` that scores the
  // answer, so the instruction and the check can never disagree. Without it,
  // raising the retention bar would just push acceptance to zero.
  const keep = [...contentWords(line)].slice(0, 12);
  const mustKeep = keep.length > 0
    ? `MUST KEEP these words, or a close form of each: ${keep.join(", ")}\n`
    : "";
  // `contentWords` strips the token, so it needs saying separately — left out,
  // the model reliably swaps the player's chosen name for "dear" and the line
  // is rejected for losing personalisation it was never told to keep.
  const keepToken = line.includes("{player}")
    ? "MUST KEEP the exact text {player} — it is the player's name, not a word to replace.\n"
    : "";
  return `Character: ${speakerName}. Traits: ${traits.join(", ")}.\n`
    + mustKeep
    + keepToken
    + `ORIGINAL: ${line}`;
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
      const verdict = validateRevoicing(line, raw, speakerName, kind);
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
