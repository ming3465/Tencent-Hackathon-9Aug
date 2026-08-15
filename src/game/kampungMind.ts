import { NPC_BY_ID } from "./campaignContent.js";
import type {
  CampaignStateV1,
  NpcId,
  NpcIntentDefinition,
  NpcIntentKind,
  QuestId,
} from "./campaignTypes.js";

export interface NpcIntentContext {
  state: CampaignStateV1;
  npcId: NpcId;
  activeRequestId?: QuestId;
  expertiseNeeded?: readonly string[];
  preferredIntentId?: string;
  preferredKind?: NpcIntentKind;
}

function missing(
  haystack: readonly string[],
  needles: readonly string[],
): readonly string[] {
  return needles.filter((needle) => !haystack.includes(needle));
}

/**
 * Returns the first eligibility rule this intent fails, in plain language, or
 * `null` when it survives every rule.
 *
 * The reason string exists so the decision can be shown, not just made - see
 * `traceNpcIntent`. Rule order is the contract: the *first* failure is the one
 * reported, so re-ordering these checks changes what an inspector displays.
 */
function eligibilityFailure(
  intent: NpcIntentDefinition,
  context: NpcIntentContext,
): string | null {
  const { state } = context;
  const rule = intent.eligibility;
  if (rule.chapters && !rule.chapters.includes(state.currentChapter)) {
    return `not offered in ${state.currentChapter}`;
  }
  if (rule.requiredObjectives) {
    const absent = missing(state.objectives, rule.requiredObjectives);
    if (absent.length > 0) return `waiting on ${absent.join(", ")}`;
  }
  const blockedObjective = rule.forbiddenObjectives?.find((objective) =>
    state.objectives.includes(objective)
  );
  if (blockedObjective) return `already past ${blockedObjective}`;
  if (rule.requiredCompletedQuests) {
    const absent = missing(state.completedQuests, rule.requiredCompletedQuests);
    if (absent.length > 0) return `needs ${absent.join(", ")} finished first`;
  }
  const blockedQuest = rule.forbiddenCompletedQuests?.find((questId) =>
    state.completedQuests.includes(questId)
  );
  if (blockedQuest) return `${blockedQuest} is already done`;
  if (rule.requiredVisitedLocations) {
    const absent = missing(state.visitedLocations, rule.requiredVisitedLocations);
    if (absent.length > 0) return `has not been to ${absent.join(", ")}`;
  }
  const memories = state.npcMemories[context.npcId] ?? [];
  if (rule.requiredMemories) {
    const absent = missing(memories, rule.requiredMemories);
    if (absent.length > 0) return `does not remember ${absent.join(", ")}`;
  }
  if (rule.notInvited && state.invitedResidents.includes(context.npcId)) {
    return "already invited";
  }
  return null;
}

function isEligible(
  intent: NpcIntentDefinition,
  context: NpcIntentContext,
): boolean {
  return eligibilityFailure(intent, context) === null;
}

/** One named contribution to an intent's score. */
export interface ScoreContribution {
  label: string;
  points: number;
}

/**
 * Scores an intent and records why. The `points` breakdown always sums to
 * `score`, which is what makes the inspector's arithmetic checkable rather
 * than decorative.
 */
function scoreWithReasons(
  intent: NpcIntentDefinition,
  context: NpcIntentContext,
): { score: number; contributions: readonly ScoreContribution[] } {
  const profile = NPC_BY_ID.get(context.npcId);
  if (!profile) {
    return { score: Number.NEGATIVE_INFINITY, contributions: [] };
  }

  const contributions: ScoreContribution[] = [
    { label: "chapter relevance", points: intent.chapterRelevance * 10 },
  ];
  const memories = context.state.npcMemories[context.npcId] ?? [];
  const wasHelped = memories.some((memory) => memory.startsWith("helped:"));
  const remembersChoice = memories.some((memory) => memory.startsWith("choice:"));

  if (wasHelped && ["memory-reaction", "invitation", "reflection"].includes(intent.kind)) {
    contributions.push({ label: "remembers being helped", points: 14 });
  }
  if (remembersChoice && intent.kind === "memory-reaction") {
    contributions.push({ label: "remembers your choice", points: 9 });
  }
  if (
    context.activeRequestId
    && ["offer-request", "reminder", "contribution"].includes(intent.kind)
  ) {
    contributions.push({ label: "you are tracking a request", points: 12 });
  }
  if (
    context.expertiseNeeded?.some((needed) =>
      profile.expertise.some((expertise) =>
        expertise.toLowerCase().includes(needed.toLowerCase())
      )
    )
  ) {
    contributions.push({ label: "their expertise is what's needed", points: 8 });
  }
  if (context.preferredKind === intent.kind) {
    contributions.push({ label: "caller asked for this kind", points: 1_000 });
  }
  if (context.preferredIntentId === intent.id) {
    contributions.push({ label: "caller asked for this beat", points: 10_000 });
  }

  const score = contributions.reduce((total, entry) => total + entry.points, 0);
  return { score, contributions };
}

function scoreIntent(
  intent: NpcIntentDefinition,
  context: NpcIntentContext,
): number {
  return scoreWithReasons(intent, context).score;
}

/**
 * KampungMind is a private, deterministic director. It filters authored
 * intents against campaign facts, scores the useful ones, and uses the stable
 * intent ID as the final tie-breaker. It never generates text or calls a
 * service at runtime.
 */
export function selectNpcIntent(context: NpcIntentContext): NpcIntentDefinition {
  const profile = NPC_BY_ID.get(context.npcId);
  if (!profile) throw new Error(`Unknown NPC: ${context.npcId}`);

  const eligible = profile.intents
    .filter((intent) => isEligible(intent, context))
    .map((intent) => ({ intent, score: scoreIntent(intent, context) }))
    .sort((left, right) => {
      if (left.score !== right.score) return right.score - left.score;
      return left.intent.id.localeCompare(right.intent.id);
    });

  const selected = eligible[0]?.intent;
  if (!selected) {
    throw new Error(
      `No eligible authored intent for ${context.npcId} in ${context.state.currentChapter}`,
    );
  }
  return selected;
}

/**
 * FNV-1a. Small, stable, and dependency-free — the point is only that the same
 * string always yields the same number, on every machine and every run.
 */
function stableHash(text: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

/** Which phrasing of a beat was chosen, and what decided it. */
export interface VoicingChoice {
  lines: readonly string[];
  index: number;
  total: number;
  reason: string;
}

/**
 * Picks which phrasing of an intent the resident uses this time.
 *
 * Derived entirely from facts already in campaign state, never from
 * `Math.random()` — the campaign suite asserts that repeated calls with an
 * identical context give an identical result, and a random pick would also
 * make saves, screenshots and the smoke suite non-reproducible.
 *
 * The count of what this resident remembers about you is part of the index, so
 * the same beat is worded differently once you have helped them. That is the
 * point: the estate sounds like it remembers, without a word of it being
 * generated at runtime.
 */
export function chooseIntentVoicing(
  intent: NpcIntentDefinition,
  context: NpcIntentContext,
): VoicingChoice {
  const variants = intent.variants ?? [];
  if (variants.length === 0) {
    return { lines: intent.lines, index: 0, total: 1, reason: "only one phrasing authored" };
  }

  // The authored `lines` stay in the pool as voicing 0, so curating variants in
  // never silently retires the line a screenshot or the demo script quotes.
  const pool = [intent.lines, ...variants];
  const remembered = (context.state.npcMemories[context.npcId] ?? []).length;
  const index = (stableHash(intent.id) + remembered) % pool.length;
  return {
    lines: pool[index] ?? intent.lines,
    index,
    total: pool.length,
    reason: remembered === 0
      ? "remembers nothing about you yet"
      : `remembers ${remembered} thing${remembered === 1 ? "" : "s"} about you`,
  };
}

/** One authored intent as the director considered it. */
export interface IntentTraceRow {
  intentId: string;
  kind: NpcIntentKind;
  title: string;
  eligible: boolean;
  /** Plain-language first failing rule; `null` when the intent is eligible. */
  rejectedBecause: string | null;
  /** `null` for rejected intents — they are never scored. */
  score: number | null;
  contributions: readonly ScoreContribution[];
  selected: boolean;
}

/** Everything the director read, weighed and decided, for one NPC, right now. */
export interface IntentTrace {
  npcId: NpcId;
  npcName: string;
  /** The campaign facts fed into this decision. */
  facts: {
    chapter: string;
    memories: readonly string[];
    expertise: readonly string[];
    expertiseNeeded: readonly string[];
    completedQuests: readonly string[];
    invited: boolean;
  };
  considered: number;
  eligibleCount: number;
  rows: readonly IntentTraceRow[];
  selectedIntentId: string | null;
}

/**
 * Runs the same decision `selectNpcIntent` runs, but returns the whole
 * reasoning rather than only its conclusion.
 *
 * This exists because the engine's work is otherwise invisible: a player - or
 * a judge - sees a line of dialogue and cannot tell an authored script from a
 * state-conditioned choice. Nothing in the shipped campaign path calls this;
 * it backs the opt-in `?inspect=1` panel.
 */
export function traceNpcIntent(context: NpcIntentContext): IntentTrace {
  const profile = NPC_BY_ID.get(context.npcId);
  if (!profile) throw new Error(`Unknown NPC: ${context.npcId}`);

  const selectedId = (() => {
    try {
      return selectNpcIntent(context).id;
    } catch {
      return null;
    }
  })();

  const rows = profile.intents.map((intent): IntentTraceRow => {
    const rejectedBecause = eligibilityFailure(intent, context);
    const eligible = rejectedBecause === null;
    const scored = eligible ? scoreWithReasons(intent, context) : null;
    return {
      intentId: intent.id,
      kind: intent.kind,
      title: intent.title,
      eligible,
      rejectedBecause,
      score: scored?.score ?? null,
      contributions: scored?.contributions ?? [],
      selected: intent.id === selectedId,
    };
  });

  // Winner first, then the rest of the eligible field by score, then the
  // rejected ones — the order you would want to read it in.
  const ordered = [...rows].sort((left, right) => {
    if (left.selected !== right.selected) return left.selected ? -1 : 1;
    if (left.eligible !== right.eligible) return left.eligible ? -1 : 1;
    if (left.score !== null && right.score !== null && left.score !== right.score) {
      return right.score - left.score;
    }
    return left.intentId.localeCompare(right.intentId);
  });

  return {
    npcId: context.npcId,
    npcName: profile.name,
    facts: {
      chapter: context.state.currentChapter,
      memories: context.state.npcMemories[context.npcId] ?? [],
      expertise: profile.expertise,
      expertiseNeeded: context.expertiseNeeded ?? [],
      completedQuests: context.state.completedQuests,
      invited: context.state.invitedResidents.includes(context.npcId),
    },
    considered: rows.length,
    eligibleCount: rows.filter((row) => row.eligible).length,
    rows: ordered,
    selectedIntentId: selectedId,
  };
}

export function getNpcIntentById(
  npcId: NpcId,
  intentId: string,
): NpcIntentDefinition | null {
  return NPC_BY_ID.get(npcId)?.intents.find((intent) => intent.id === intentId) ?? null;
}

export function listEligibleNpcIntents(
  context: NpcIntentContext,
): readonly NpcIntentDefinition[] {
  const profile = NPC_BY_ID.get(context.npcId);
  if (!profile) return [];
  return profile.intents.filter((intent) => isEligible(intent, context));
}
