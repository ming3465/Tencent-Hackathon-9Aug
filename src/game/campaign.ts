import {
  QUEST_BY_ID,
  STORY_CHAPTER_ORDER,
} from "./campaignContent.js";
import type {
  CampaignEvent,
  CampaignPhase,
  CampaignStateV1,
  ChapterId,
  LocationId,
  NpcId,
  QuestId,
} from "./campaignTypes.js";
import { errandById } from "./carryErrands.js";
import {
  type PlayerAppearance,
  sanitiseAppearance,
  sanitisePlayerName,
} from "./playerIdentity.js";

export const CAMPAIGN_VERSION = 1;
export const CAMPAIGN_SAVE_KEY = "kampung-sg.campaign.v1";
export const KAMPUNG_METER_MAX = 12;
export const FULL_HELPER_THRESHOLD = 3;
export const FULL_ATTENDEE_THRESHOLD = 5;
export const DEMO_THRESHOLD = 2;

const PHASE_ORDER: readonly CampaignPhase[] = [
  ...STORY_CHAPTER_ORDER,
  "free-explore",
];

function phaseIndex(phase: CampaignPhase): number {
  return PHASE_ORDER.indexOf(phase);
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function addUnique<T>(values: readonly T[], value: T): T[] {
  return values.includes(value) ? [...values] : [...values, value];
}

function hasAll(haystack: readonly string[], needles: readonly string[]): boolean {
  return needles.every((needle) => haystack.includes(needle));
}

function withObjective(state: CampaignStateV1, objectiveId: string): CampaignStateV1 {
  if (state.objectives.includes(objectiveId)) return state;
  return {
    ...state,
    objectives: [...state.objectives, objectiveId],
  };
}

function remember(
  state: CampaignStateV1,
  npcId: NpcId,
  memory: string,
): CampaignStateV1 {
  const existing = state.npcMemories[npcId] ?? [];
  if (existing.includes(memory)) return state;
  return {
    ...state,
    npcMemories: {
      ...state.npcMemories,
      [npcId]: [...existing, memory],
    },
  };
}

function completeChapter(
  state: CampaignStateV1,
  chapterId: ChapterId,
  next: CampaignPhase,
): CampaignStateV1 {
  if (state.completedChapters.includes(chapterId)) return state;
  return {
    ...state,
    currentChapter: next,
    completedChapters: [...state.completedChapters, chapterId],
  };
}

function maybeAdvance(state: CampaignStateV1): CampaignStateV1 {
  let next = state;

  if (
    next.currentChapter === "prologue"
    && next.objectives.includes("left-y-flat")
  ) {
    next = completeChapter(next, "prologue", "chapter-1");
  }

  if (
    next.currentChapter === "chapter-1"
    && next.objectives.includes("mr-long-step-seen")
    && next.npcContributions.length >= next.thresholds.helpers
  ) {
    next = withObjective(next, "ramp-built");
    next = withObjective(next, "mr-long-outside");
    next = completeChapter(next, "chapter-1", "chapter-2");
  }

  const rosClues = ["ros-clue-minah", "ros-clue-seng"].filter((clue) =>
    next.objectives.includes(clue)
  ).length;
  if (
    next.currentChapter === "chapter-2"
    && rosClues >= 2
    && next.objectives.includes("grandma-kitchen-open")
    && next.invitedResidents.length >= next.thresholds.attendees
  ) {
    next = withObjective(next, "cooking-lesson-staged");
    next = completeChapter(next, "chapter-2", "chapter-3");
  }

  if (
    next.currentChapter === "chapter-3"
    && next.objectives.includes("weaving-complete")
  ) {
    next = withObjective(next, "workshop-active");
    next = completeChapter(next, "chapter-3", "ending");
  }

  if (
    next.currentChapter === "ending"
    && next.objectives.includes("ending-reveal")
  ) {
    next = completeChapter(next, "ending", "free-explore");
  }

  return next;
}

function eventBelongsToFutureChapter(
  state: CampaignStateV1,
  chapterId: ChapterId,
): boolean {
  return phaseIndex(state.currentChapter) < phaseIndex(chapterId);
}

export interface CreateCampaignOptions {
  demo?: boolean;
  playerName?: string;
  playerAppearance?: PlayerAppearance;
}

export function createCampaignState(
  options: CreateCampaignOptions = {},
): CampaignStateV1 {
  const demo = options.demo === true;
  return {
    version: CAMPAIGN_VERSION,
    playerName: sanitisePlayerName(options.playerName),
    playerAppearance: sanitiseAppearance(options.playerAppearance),
    carrying: null,
    currentChapter: "prologue",
    completedChapters: [],
    completedQuests: [],
    objectives: [],
    npcContributions: [],
    invitedResidents: [],
    visitedLocations: ["y-flat"],
    choices: {},
    npcMemories: {},
    meters: { connection: 0, purpose: 0, comfort: 0 },
    thresholds: {
      helpers: demo ? DEMO_THRESHOLD : FULL_HELPER_THRESHOLD,
      attendees: demo ? DEMO_THRESHOLD : FULL_ATTENDEE_THRESHOLD,
    },
    currentLocation: "y-flat",
    demo,
    revision: 0,
  };
}

export function canEnterLocation(
  state: CampaignStateV1,
  locationId: LocationId,
): boolean {
  if (locationId === "y-flat") return true;
  if (locationId === "estate") {
    // The village is now the hub the corridor used to be, so the prologue's
    // "step outside once you have heard the Voice" gate lives here.
    return state.completedChapters.includes("prologue")
      || state.currentChapter !== "prologue"
      || state.objectives.includes("heard-voice");
  }
  if (locationId === "mr-long-flat") {
    return phaseIndex(state.currentChapter) >= phaseIndex("chapter-1");
  }
  if (locationId === "grandma-ros-kitchen") {
    return (
      hasAll(state.objectives, ["ros-clue-minah", "ros-clue-seng"])
      || phaseIndex(state.currentChapter) > phaseIndex("chapter-2")
    );
  }
  if (locationId === "ben-flat") {
    return (
      hasAll(state.objectives, ["ben-clue-tools", "ben-clue-keepsake"])
      || phaseIndex(state.currentChapter) > phaseIndex("chapter-3")
    );
  }
  if (locationId === "craftsman-workshop") {
    return phaseIndex(state.currentChapter) >= phaseIndex("chapter-3");
  }
  return state.completedChapters.includes("prologue");
}

function reduceVisit(
  state: CampaignStateV1,
  locationId: LocationId,
): CampaignStateV1 {
  if (!canEnterLocation(state, locationId)) return state;

  let next = state;
  if (
    state.currentLocation !== locationId
    || !state.visitedLocations.includes(locationId)
  ) {
    next = {
      ...state,
      currentLocation: locationId,
      visitedLocations: addUnique(state.visitedLocations, locationId),
    };
  }

  if (
    locationId === "estate"
    && next.currentChapter === "prologue"
    && next.objectives.includes("heard-voice")
  ) {
    next = withObjective(next, "left-y-flat");
  }

  if (
    locationId === "grandma-ros-kitchen"
    && next.currentChapter === "chapter-2"
  ) {
    next = withObjective(next, "grandma-kitchen-open");
  }

  if (
    locationId === "craftsman-workshop"
    && next.currentChapter === "chapter-3"
    && next.objectives.includes("ben-walking-with-y")
  ) {
    next = withObjective(next, "ben-at-workshop");
  }

  return next;
}

function chapterForObjective(objectiveId: string): ChapterId | null {
  if (
    objectiveId === "heard-voice"
    || objectiveId === "left-y-flat"
  ) {
    return "prologue";
  }
  if (
    objectiveId.startsWith("mr-long")
    || objectiveId === "ramp-built"
    || objectiveId.startsWith("offered:")
    || objectiveId.startsWith("request:")
  ) {
    return "chapter-1";
  }
  if (
    objectiveId.startsWith("ros-")
    || objectiveId.startsWith("grandma-")
    || objectiveId === "cooking-lesson-staged"
  ) {
    return "chapter-2";
  }
  if (
    objectiveId.startsWith("ben-")
    || objectiveId.startsWith("weaving-")
    || objectiveId === "workshop-active"
  ) {
    return "chapter-3";
  }
  if (objectiveId === "ending-reveal") return "ending";
  return null;
}

function reduceRequest(
  state: CampaignStateV1,
  event: Extract<CampaignEvent, { type: "complete-request" }>,
): CampaignStateV1 {
  const quest = QUEST_BY_ID.get(event.questId);
  if (!quest || !quest.optional || quest.npcId !== event.npcId) return state;
  if (eventBelongsToFutureChapter(state, quest.chapterId)) return state;
  if (state.completedQuests.includes(event.questId)) return state;
  if (
    state.currentChapter === "chapter-1"
    && !state.objectives.includes("mr-long-step-seen")
  ) {
    return state;
  }

  const cap = (value: number): number =>
    Math.max(0, Math.min(KAMPUNG_METER_MAX, value));
  let next: CampaignStateV1 = {
    ...state,
    completedQuests: [...state.completedQuests, event.questId],
    objectives: addUnique(state.objectives, `request:${event.questId}`),
    choices: {
      ...state.choices,
      [`request:${event.questId}`]: event.choiceId,
    },
    meters: {
      connection: cap(state.meters.connection + event.effects.connection),
      purpose: cap(state.meters.purpose + event.effects.purpose),
      comfort: cap(state.meters.comfort + event.effects.comfort),
    },
  };
  next = remember(next, event.npcId, `helped:${event.questId}`);
  next = remember(next, event.npcId, `choice:${event.questId}:${event.choiceId}`);
  if (state.currentChapter === "chapter-1") {
    next = {
      ...next,
      npcContributions: addUnique(next.npcContributions, event.npcId),
    };
  }
  return next;
}

export function reduceCampaign(
  state: CampaignStateV1,
  event: CampaignEvent,
): CampaignStateV1 {
  let next = state;

  switch (event.type) {
    case "visit-location":
      next = reduceVisit(state, event.locationId);
      break;
    case "complete-objective":
      {
        const objectiveChapter = chapterForObjective(event.objectiveId);
        if (
          objectiveChapter
          && eventBelongsToFutureChapter(state, objectiveChapter)
        ) {
          return state;
        }
      }
      next = withObjective(state, event.objectiveId);
      break;
    case "pick-up-errand": {
      const errand = errandById(event.errandId);
      // Hands full, unknown errand, or already run: all no-ops rather than
      // errors. Nothing the player can press should be able to break a save.
      if (!errand || state.carrying !== null) return state;
      if (state.objectives.includes(errand.objectiveId)) return state;
      next = { ...state, carrying: errand.id };
      break;
    }
    case "deliver-errand": {
      const errand = errandById(event.errandId);
      if (!errand || state.carrying !== errand.id) return state;
      next = withObjective({ ...state, carrying: null }, errand.objectiveId);
      break;
    }
    case "complete-request":
      next = reduceRequest(state, event);
      break;
    case "collect-clue": {
      const chapterId = event.clueId.startsWith("ros-")
        ? "chapter-2"
        : "chapter-3";
      if (eventBelongsToFutureChapter(state, chapterId)) return state;
      next = withObjective(state, event.clueId);
      next = remember(next, event.npcId, `shared:${event.clueId}`);
      break;
    }
    case "publish-scam-check":
      if (
        state.currentChapter !== "chapter-2"
        || state.objectives.includes("scam-check-shared")
      ) {
        return state;
      }
      next = withObjective(state, "scam-check-shared");
      next = {
        ...next,
        choices: {
          ...next.choices,
          "scam-check-card": event.layoutId,
        },
      };
      next = remember(
        next,
        "auntie-minah",
        `shared:scam-check:${event.layoutId}`,
      );
      next = withObjective(next, "ros-clue-minah");
      next = remember(next, "auntie-minah", "shared:ros-clue-minah");
      break;
    case "invite-resident":
      if (eventBelongsToFutureChapter(state, "chapter-2")) return state;
      if (state.invitedResidents.includes(event.npcId)) return state;
      next = {
        ...state,
        invitedResidents: [...state.invitedResidents, event.npcId],
      };
      next = remember(next, event.npcId, "joined:grandma-ros-lesson");
      break;
    case "choose-approach":
      if (state.currentChapter !== "chapter-3") return state;
      if (!hasAll(state.objectives, ["ben-clue-tools", "ben-clue-keepsake"])) {
        return state;
      }
      if (state.objectives.includes("ben-approach-chosen")) return state;
      next = withObjective(state, "ben-approach-chosen");
      next = {
        ...next,
        choices: { ...next.choices, "ben-approach": event.approachId },
      };
      next = remember(next, "ben", `approach:${event.approachId}`);
      break;
    case "bring-ben-to-workshop":
      if (
        state.currentChapter !== "chapter-3"
        || !state.objectives.includes("ben-approach-chosen")
      ) {
        return state;
      }
      next = withObjective(state, "ben-walking-with-y");
      break;
    case "complete-weaving":
      if (
        state.currentChapter !== "chapter-3"
        || !state.objectives.includes("ben-at-workshop")
      ) {
        return state;
      }
      next = withObjective(state, "weaving-complete");
      next = {
        ...next,
        choices: { ...next.choices, weaving: event.patternId },
        meters: {
          connection: Math.min(KAMPUNG_METER_MAX, next.meters.connection + 2),
          purpose: Math.min(KAMPUNG_METER_MAX, next.meters.purpose + 2),
          comfort: Math.min(KAMPUNG_METER_MAX, next.meters.comfort + 1),
        },
      };
      next = remember(next, "ben", `weaving:${event.patternId}`);
      next = remember(next, "craftsman-tan", `weaving:${event.patternId}`);
      break;
    case "complete-ending":
      if (state.currentChapter !== "ending") return state;
      next = withObjective(state, "ending-reveal");
      break;
  }

  next = maybeAdvance(next);
  if (next === state) return state;
  return {
    ...next,
    completedChapters: unique(next.completedChapters),
    completedQuests: unique(next.completedQuests),
    objectives: unique(next.objectives),
    npcContributions: unique(next.npcContributions),
    invitedResidents: unique(next.invitedResidents),
    visitedLocations: unique(next.visitedLocations),
    revision: state.revision + 1,
  };
}

export function chapterIsUnlocked(
  state: CampaignStateV1,
  chapterId: ChapterId,
): boolean {
  return phaseIndex(state.currentChapter) >= phaseIndex(chapterId);
}

export function chapterIsComplete(
  state: CampaignStateV1,
  chapterId: ChapterId,
): boolean {
  return state.completedChapters.includes(chapterId);
}

export function requestIsComplete(
  state: CampaignStateV1,
  questId: QuestId,
): boolean {
  return state.completedQuests.includes(questId);
}

export function getChapterProgress(state: CampaignStateV1): string {
  switch (state.currentChapter) {
    case "prologue":
      return state.objectives.includes("heard-voice")
        ? "The first door is ready."
        : "Listen to the Voice.";
    case "chapter-1":
      return state.objectives.includes("mr-long-step-seen")
        ? `${state.npcContributions.length} of ${state.thresholds.helpers} distinct helpers ready.`
        : "Visit Mr. Long's flat and inspect the broken step.";
    case "chapter-2": {
      const clues = ["ros-clue-minah", "ros-clue-seng"].filter((id) =>
        state.objectives.includes(id)
      ).length;
      if (clues < 2) return `${clues} of 2 Grandma Ros clues found.`;
      if (!state.objectives.includes("grandma-kitchen-open")) {
        return "Grandma Ros's kitchen is now open.";
      }
      return `${state.invitedResidents.length} of ${state.thresholds.attendees} residents invited.`;
    }
    case "chapter-3": {
      const clues = ["ben-clue-tools", "ben-clue-keepsake"].filter((id) =>
        state.objectives.includes(id)
      ).length;
      if (clues < 2) return `${clues} of 2 clues about Ben found.`;
      if (!state.objectives.includes("ben-approach-chosen")) {
        return "Visit Ben and choose a supportive approach.";
      }
      if (!state.objectives.includes("ben-at-workshop")) {
        return "Walk with Ben to the workshop.";
      }
      return "Complete the calm weaving interaction.";
    }
    case "ending":
      return "Return to {player}'s flat for the last door.";
    case "free-explore":
      return "The story is complete. Every place remains open.";
  }
}
