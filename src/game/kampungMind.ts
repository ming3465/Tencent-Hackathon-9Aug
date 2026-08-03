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

function includesAll(haystack: readonly string[], needles: readonly string[]): boolean {
  return needles.every((needle) => haystack.includes(needle));
}

function isEligible(
  intent: NpcIntentDefinition,
  context: NpcIntentContext,
): boolean {
  const { state } = context;
  const rule = intent.eligibility;
  if (rule.chapters && !rule.chapters.includes(state.currentChapter)) return false;
  if (
    rule.requiredObjectives
    && !includesAll(state.objectives, rule.requiredObjectives)
  ) {
    return false;
  }
  if (
    rule.forbiddenObjectives?.some((objective) =>
      state.objectives.includes(objective)
    )
  ) {
    return false;
  }
  if (
    rule.requiredCompletedQuests
    && !includesAll(state.completedQuests, rule.requiredCompletedQuests)
  ) {
    return false;
  }
  if (
    rule.forbiddenCompletedQuests?.some((questId) =>
      state.completedQuests.includes(questId)
    )
  ) {
    return false;
  }
  if (
    rule.requiredVisitedLocations
    && !includesAll(state.visitedLocations, rule.requiredVisitedLocations)
  ) {
    return false;
  }
  const memories = state.npcMemories[context.npcId] ?? [];
  if (rule.requiredMemories && !includesAll(memories, rule.requiredMemories)) {
    return false;
  }
  if (rule.notInvited && state.invitedResidents.includes(context.npcId)) {
    return false;
  }
  return true;
}

function scoreIntent(
  intent: NpcIntentDefinition,
  context: NpcIntentContext,
): number {
  const profile = NPC_BY_ID.get(context.npcId);
  if (!profile) return Number.NEGATIVE_INFINITY;

  let score = intent.chapterRelevance * 10;
  const memories = context.state.npcMemories[context.npcId] ?? [];
  const wasHelped = memories.some((memory) => memory.startsWith("helped:"));
  const remembersChoice = memories.some((memory) => memory.startsWith("choice:"));

  if (wasHelped && ["memory-reaction", "invitation", "reflection"].includes(intent.kind)) {
    score += 14;
  }
  if (remembersChoice && intent.kind === "memory-reaction") score += 9;
  if (
    context.activeRequestId
    && ["offer-request", "reminder", "contribution"].includes(intent.kind)
  ) {
    score += 12;
  }
  if (
    context.expertiseNeeded?.some((needed) =>
      profile.expertise.some((expertise) =>
        expertise.toLowerCase().includes(needed.toLowerCase())
      )
    )
  ) {
    score += 8;
  }
  if (context.preferredKind === intent.kind) score += 1_000;
  if (context.preferredIntentId === intent.id) score += 10_000;
  return score;
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
