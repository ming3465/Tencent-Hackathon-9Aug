import { CAMPAIGN_SAVE_KEY, CAMPAIGN_VERSION } from "./campaign.js";
import type { CampaignStateV1 } from "./campaignTypes.js";

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

export function loadCampaign(
  storage: CampaignStorage,
  demo: boolean,
): CampaignStateV1 | null {
  if (demo) return null;
  const raw = storage.getItem(CAMPAIGN_SAVE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isCampaignStateV1(parsed) ? parsed : null;
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
