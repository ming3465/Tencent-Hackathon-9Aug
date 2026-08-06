import { CAMPAIGN_SAVE_KEY, CAMPAIGN_VERSION } from "./campaign.js";
import type {
  CampaignStateV1,
  ScamCheckCardLayout,
} from "./campaignTypes.js";
import { errandById } from "./carryErrands.js";
import { sanitiseAppearance, sanitisePlayerName } from "./playerIdentity.js";

export interface CampaignStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function parseDemoMode(search: string): boolean {
  return new URLSearchParams(search).get("demo") === "1";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

export function isCampaignStateV1(value: unknown): value is CampaignStateV1 {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<CampaignStateV1>;
  if (state.version !== CAMPAIGN_VERSION) return false;
  if (
    ![
      "prologue",
      "chapter-1",
      "chapter-2",
      "chapter-3",
      "ending",
      "free-explore",
    ].includes(state.currentChapter ?? "")
  ) {
    return false;
  }
  if (
    !isStringArray(state.completedChapters)
    || !isStringArray(state.completedQuests)
    || !isStringArray(state.objectives)
    || !isStringArray(state.npcContributions)
    || !isStringArray(state.invitedResidents)
    || !isStringArray(state.visitedLocations)
  ) {
    return false;
  }
  if (!state.choices || typeof state.choices !== "object") return false;
  if (!state.npcMemories || typeof state.npcMemories !== "object") return false;
  if (!state.meters || !state.thresholds) return false;
  if (
    !["connection", "purpose", "comfort"].every(
      (key) => Number.isFinite(state.meters?.[key as keyof typeof state.meters]),
    )
  ) {
    return false;
  }
  if (
    !Number.isInteger(state.thresholds.helpers)
    || !Number.isInteger(state.thresholds.attendees)
    || state.thresholds.helpers < 1
    || state.thresholds.attendees < 1
  ) {
    return false;
  }
  if (typeof state.currentLocation !== "string") return false;
  if (typeof state.demo !== "boolean") return false;
  if (!Number.isInteger(state.revision) || (state.revision ?? -1) < 0) return false;
  return true;
}

/**
 * Fills in the player's name and look for saves written before the title
 * screen asked for them.
 *
 * Deliberately a migration rather than a validity check: rejecting those saves
 * would silently wipe a real player's campaign, and the defaults ("Y", the
 * original sprite colours) reproduce exactly how the game behaved when the
 * save was written. The save format stays at version 1 for the same reason.
 */
function migratePlayerIdentity(state: CampaignStateV1): CampaignStateV1 {
  const playerName = sanitisePlayerName(state.playerName);
  const playerAppearance = sanitiseAppearance(state.playerAppearance);
  const nameUnchanged = playerName === state.playerName;
  const appearanceUnchanged = state.playerAppearance !== undefined
    && (Object.keys(playerAppearance) as (keyof typeof playerAppearance)[])
      .every((key) => state.playerAppearance[key] === playerAppearance[key]);
  if (nameUnchanged && appearanceUnchanged) return state;
  return { ...state, playerName, playerAppearance };
}

/**
 * Saves written before errands existed have no `carrying` field. Empty hands
 * is the only correct reading, and a missing field must never invalidate a
 * save.
 */
function migrateCarriedItem(state: CampaignStateV1): CampaignStateV1 {
  const carrying = typeof state.carrying === "string"
    && errandById(state.carrying) !== undefined
    ? state.carrying
    : null;
  return carrying === state.carrying ? state : { ...state, carrying };
}

function migrateScamCheckCard(state: CampaignStateV1): CampaignStateV1 {
  const hasMinahClue = state.objectives.includes("ros-clue-minah");
  const hasScamCard = state.objectives.includes("scam-check-shared");
  if (!hasMinahClue && !hasScamCard) return state;
  const savedLayout = state.choices["scam-check-card"];
  const layout: ScamCheckCardLayout =
    savedLayout === "numbered-steps" || savedLayout === "icons-and-words"
      ? savedLayout
      : "numbered-steps";
  const expectedMemories = [
    `shared:scam-check:${layout}`,
    "shared:ros-clue-minah",
  ];
  const storedMemories = state.npcMemories["auntie-minah"];
  const minahMemories = isStringArray(storedMemories) ? storedMemories : [];
  const missingObjectives = [
    ...(hasScamCard ? [] : ["scam-check-shared"]),
    ...(hasMinahClue ? [] : ["ros-clue-minah"]),
  ];
  const choiceMissing = savedLayout !== layout;
  const missingMemories = expectedMemories.filter(
    (memory) => !minahMemories.includes(memory),
  );
  if (!missingObjectives.length && !choiceMissing && !missingMemories.length) {
    return state;
  }
  return {
    ...state,
    objectives: missingObjectives.length
      ? [...state.objectives, ...missingObjectives]
      : state.objectives,
    choices: choiceMissing
      ? { ...state.choices, "scam-check-card": layout }
      : state.choices,
    npcMemories: missingMemories.length
      ? {
          ...state.npcMemories,
          "auntie-minah": [...minahMemories, ...missingMemories],
        }
      : state.npcMemories,
    revision: state.revision + 1,
  };
}

export function loadCampaign(
  storage: CampaignStorage,
  demo: boolean,
): CampaignStateV1 | null {
  if (demo) return null;
  const raw = storage.getItem(CAMPAIGN_SAVE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isCampaignStateV1(parsed)) return null;
    return migrateScamCheckCard(migrateCarriedItem(migratePlayerIdentity(parsed)));
  } catch {
    return null;
  }
}

export function saveCampaign(
  storage: CampaignStorage,
  state: CampaignStateV1,
): boolean {
  if (state.demo) return false;
  storage.setItem(CAMPAIGN_SAVE_KEY, JSON.stringify(state));
  return true;
}

export function clearCampaign(
  storage: CampaignStorage,
  demo: boolean,
): boolean {
  if (demo) return false;
  storage.removeItem(CAMPAIGN_SAVE_KEY);
  return true;
}
