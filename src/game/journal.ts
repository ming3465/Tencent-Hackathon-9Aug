import {
  CHAPTERS,
  LOCATIONS,
  NPC_BY_ID,
  QUESTS,
  SIDE_QUEST_IDS,
} from "./campaignContent.js";
import {
  canEnterLocation,
  chapterIsComplete,
  chapterIsUnlocked,
  getChapterProgress,
} from "./campaign.js";
import type {
  CampaignStateV1,
  LocationId,
  NpcId,
  QuestDefinition,
  QuestId,
} from "./campaignTypes.js";

export type JournalCategory = "story" | "requests" | "people" | "places";

export const JOURNAL_CATEGORIES: readonly JournalCategory[] = [
  "story",
  "requests",
  "people",
  "places",
];

export interface JournalObjectiveView {
  id: string;
  label: string;
  complete: boolean;
  progressText?: string;
}

export interface JournalEntryView {
  id: string;
  category: JournalCategory;
  typeLabel: string;
  statusLabel: string;
  title: string;
  summary: string;
  meta: string;
  objectives: readonly JournalObjectiveView[];
  progressCurrent: number;
  progressTotal: number;
  complete: boolean;
  current: boolean;
  locked: boolean;
  optional: boolean;
  questId?: QuestId;
  npcId?: NpcId;
  locationId?: LocationId;
}

export interface JournalViewModel {
  chapterLabel: string;
  chapterTitle: string;
  chapterProgress: string;
  entries: Record<JournalCategory, readonly JournalEntryView[]>;
}

export interface QuestTrackerCardView {
  kind: "story" | "request";
  category: "story" | "requests";
  entryId: string | null;
  title: string;
  progressCurrent: number;
  progressTotal: number;
  complete: boolean;
  nextObjective: string | null;
}

export interface QuestTrackerView {
  story: QuestTrackerCardView;
  request: QuestTrackerCardView | null;
  showRequestsAction: boolean;
}

const OBJECTIVE_LABELS: Readonly<Record<string, string>> = {
  "heard-voice": "Listen to the Voice",
  "left-y-flat": "Use the first open door",
  "mr-long-step-seen": "Hear Mr. Long describe the broken step",
  "mr-long-outside": "Welcome Mr. Long outside",
  "scam-check-shared": "Use Minah's PAUSE, CHECK, TELL habit: verify separately or call ScamShield at 1799; never share an OTP",
  "ros-clue-minah": "Ask Auntie Minah about Grandma Ros",
  "ros-clue-seng": "Ask Uncle Seng about Grandma Ros",
  "grandma-kitchen-open": "Enter Grandma Ros's kitchen",
  "cooking-lesson-staged": "Gather for Grandma Ros's cooking lesson",
  "ben-clue-tools": "Learn why Mr. Tan kept Ben's tools",
  "ben-clue-keepsake": "Ask Wei Ling about Ben's keepsake",
  "ben-approach-chosen": "Choose a supportive way to sit with Ben",
  "ben-at-workshop": "Walk with Ben to the workshop",
  "weaving-complete": "Finish the calm weaving pattern together",
  "ending-reveal": "Listen at the last door",
};

function hasObjective(state: CampaignStateV1, objectiveId: string): boolean {
  return state.objectives.includes(objectiveId);
}

function authoredObjective(
  state: CampaignStateV1,
  objectiveId: string,
): JournalObjectiveView {
  const scamCardLayout = state.choices["scam-check-card"];
  return {
    id: objectiveId,
    label: OBJECTIVE_LABELS[objectiveId] ?? "Continue this shared task",
    complete: hasObjective(state, objectiveId),
    progressText:
      objectiveId === "scam-check-shared"
      && (scamCardLayout === "numbered-steps"
        || scamCardLayout === "icons-and-words")
        ? scamCardLayout === "numbered-steps"
          ? "Shop card: three large numbered steps"
          : "Shop card: large icons with short words"
        : undefined,
  };
}

function questObjectives(
  state: CampaignStateV1,
  quest: QuestDefinition,
): readonly JournalObjectiveView[] {
  if (quest.id === "open-the-way") {
    const helperCount = Math.min(
      state.npcContributions.length,
      state.thresholds.helpers,
    );
    return [
      authoredObjective(state, "mr-long-step-seen"),
      {
        id: "distinct-ramp-helpers",
        label: `Recruit ${state.thresholds.helpers} neighbours with different expertise`,
        complete: helperCount >= state.thresholds.helpers,
        progressText: `${helperCount} / ${state.thresholds.helpers}`,
      },
      authoredObjective(state, "mr-long-outside"),
    ];
  }

  if (quest.id === "cooking-invitations") {
    const attendeeCount = Math.min(
      state.invitedResidents.length,
      state.thresholds.attendees,
    );
    return [
      authoredObjective(state, "grandma-kitchen-open"),
      {
        id: "cooking-invitees",
        label: `Invite ${state.thresholds.attendees} residents to learn together`,
        complete: attendeeCount >= state.thresholds.attendees,
        progressText: `${attendeeCount} / ${state.thresholds.attendees}`,
      },
      authoredObjective(state, "cooking-lesson-staged"),
    ];
  }

  if (quest.optional) {
    const npcName = quest.npcId
      ? NPC_BY_ID.get(quest.npcId)?.name ?? "your neighbour"
      : "your neighbour";
    return [
      {
        id: `request:${quest.id}`,
        label: `Complete the request with ${npcName}`,
        complete: state.completedQuests.includes(quest.id),
      },
    ];
  }

  return quest.objectiveIds.map((objectiveId) =>
    authoredObjective(state, objectiveId)
  );
}

function countCompleted(
  objectives: readonly JournalObjectiveView[],
): number {
  return objectives.filter((objective) => objective.complete).length;
}

function storyEntries(state: CampaignStateV1): JournalEntryView[] {
  const entries: JournalEntryView[] = [];
  for (const chapter of CHAPTERS) {
    const unlocked = chapterIsUnlocked(state, chapter.id);
    if (!unlocked) {
      entries.push({
        id: `locked:${chapter.id}`,
        category: "story",
        typeLabel: chapter.numberLabel,
        statusLabel: "LOCKED",
        title: "A future chapter",
        summary: "Complete the current chapter to reveal this story.",
        meta: "Story details remain hidden",
        objectives: [],
        progressCurrent: 0,
        progressTotal: 0,
        complete: false,
        current: false,
        locked: true,
        optional: false,
      });
      continue;
    }

    const chapterComplete = chapterIsComplete(state, chapter.id);
    for (const quest of QUESTS.filter(
      (candidate) =>
        !candidate.optional && candidate.chapterId === chapter.id,
    )) {
      const objectives = questObjectives(state, quest);
      const progressCurrent = chapterComplete
        ? objectives.length
        : countCompleted(objectives);
      const complete =
        chapterComplete
        || (objectives.length > 0 && progressCurrent === objectives.length);
      const current =
        state.currentChapter === chapter.id && !complete;
      entries.push({
        id: `quest:${quest.id}`,
        category: "story",
        typeLabel: `${chapter.numberLabel} · Main Story`,
        statusLabel: complete ? "COMPLETED" : current ? "ACTIVE" : "OPEN",
        title: quest.title,
        summary: quest.summary,
        meta: `${chapter.title} · Nothing is timed`,
        objectives,
        progressCurrent,
        progressTotal: objectives.length,
        complete,
        current,
        locked: false,
        optional: false,
        questId: quest.id,
        npcId: quest.npcId,
      });
    }
  }
  return entries;
}

function requestEntries(state: CampaignStateV1): JournalEntryView[] {
  const unlocked = state.currentChapter !== "prologue";
  return SIDE_QUEST_IDS.flatMap((questId) => {
    const quest = QUESTS.find((candidate) => candidate.id === questId);
    if (!quest?.npcId) return [];
    const npc = NPC_BY_ID.get(quest.npcId);
    const complete = state.completedQuests.includes(quest.id);
    const offered = hasObjective(state, `offered:${quest.id}`);
    const objectives = questObjectives(state, quest);
    return [{
      id: `quest:${quest.id}`,
      category: "requests" as const,
      typeLabel: "Neighbour Request",
      statusLabel: complete
        ? "COMPLETED"
        : unlocked
          ? offered
            ? "IN PROGRESS"
            : "AVAILABLE"
          : "LOCKED",
      title: unlocked ? quest.title : "Neighbour request",
      summary: unlocked
        ? complete
          ? `${npc?.name ?? "This neighbour"} remembers how you helped. You can still visit anytime.`
          : quest.summary
        : "Leave {player}'s flat to meet the estate's contributors.",
      meta: unlocked
        ? `${npc?.name ?? "Neighbour"} · Optional · No time limit`
        : "Meet the estate first",
      objectives: unlocked ? objectives : [],
      progressCurrent: unlocked ? countCompleted(objectives) : 0,
      progressTotal: unlocked ? objectives.length : 0,
      complete,
      current: unlocked && offered && !complete,
      locked: !unlocked,
      optional: true,
      questId: quest.id,
      npcId: quest.npcId,
    }];
  });
}

function personIsKnown(
  state: CampaignStateV1,
  npcId: NpcId,
): boolean {
  const storyLocation: Partial<Record<NpcId, LocationId>> = {
    "mr-long": "mr-long-flat",
    "grandma-ros": "grandma-ros-kitchen",
    "craftsman-tan": "craftsman-workshop",
    ben: "ben-flat",
  };
  const locationId = storyLocation[npcId];
  return locationId
    ? state.visitedLocations.includes(locationId)
    : state.completedChapters.includes("prologue");
}

function peopleEntries(state: CampaignStateV1): JournalEntryView[] {
  const entries: JournalEntryView[] = [];
  for (const npc of NPC_BY_ID.values()) {
    if (npc.id === "voice" || !personIsKnown(state, npc.id)) continue;
    const helped = (state.npcMemories[npc.id] ?? []).some((memory) =>
      memory.startsWith("helped:")
    );
    entries.push({
      id: `person:${npc.id}`,
      category: "people",
      typeLabel: "Resident Note",
      statusLabel: helped ? "REMEMBERS" : "KNOWN",
      title: npc.name,
      summary: `${npc.communityRole}.`,
      meta: `Expertise · ${npc.expertise.join(", ")}`,
      objectives: [],
      progressCurrent: 0,
      progressTotal: 0,
      complete: helped,
      current: false,
      locked: false,
      optional: true,
      npcId: npc.id,
    });
  }
  return entries;
}

function placesEntries(
  state: CampaignStateV1,
  currentLocation: LocationId,
): JournalEntryView[] {
  return LOCATIONS.flatMap((location) => {
    const visited = state.visitedLocations.includes(location.id);
    const unlocked = canEnterLocation(state, location.id);
    const current = currentLocation === location.id;
    const revealCurrentLocked =
      (state.currentChapter === "chapter-2"
        && location.id === "grandma-ros-kitchen")
      || (state.currentChapter === "chapter-3"
        && ["ben-flat", "craftsman-workshop"].includes(location.id));
    if (!visited && !unlocked && !revealCurrentLocked) return [];
    const objective: JournalObjectiveView = {
      id: `visit:${location.id}`,
      label: visited ? "This place is in your estate memory" : "Visit this place",
      complete: visited,
    };
    return [{
      id: `place:${location.id}`,
      category: "places" as const,
      typeLabel:
        location.kind === "home"
          ? "Resident Home"
          : location.kind === "landmark"
            ? "Estate Landmark"
            : "Shared Place",
      statusLabel: current
        ? "YOU ARE HERE"
        : visited
          ? "VISITED"
          : unlocked
            ? "OPEN"
            : "LOCKED",
      title: location.name,
      summary: unlocked
        ? location.description
        : location.unlockHint ?? "Continue the current chapter.",
      meta: `${location.kind.replace("-", " ")} · ${
        unlocked ? "Revisitable" : "Not open yet"
      }`,
      objectives: unlocked ? [objective] : [],
      progressCurrent: visited ? 1 : 0,
      progressTotal: unlocked ? 1 : 0,
      complete: visited,
      current,
      locked: !unlocked,
      optional: true,
      locationId: location.id,
    }];
  });
}

export function buildJournalView(
  state: CampaignStateV1,
  currentLocation: LocationId = state.currentLocation,
): JournalViewModel {
  const chapter = state.currentChapter === "free-explore"
    ? null
    : CHAPTERS.find((candidate) => candidate.id === state.currentChapter);
  return {
    chapterLabel: chapter?.numberLabel ?? "Story complete",
    chapterTitle: chapter?.title ?? "Free Exploration",
    chapterProgress: getChapterProgress(state),
    entries: {
      story: storyEntries(state),
      requests: requestEntries(state),
      people: peopleEntries(state),
      places: placesEntries(state, currentLocation),
    },
  };
}

export function defaultJournalEntryId(
  view: JournalViewModel,
  category: JournalCategory,
): string | null {
  const entries = view.entries[category];
  if (category === "story") {
    return entries.find((entry) => entry.current)?.id
      ?? [...entries].reverse().find((entry) => entry.complete)?.id
      ?? entries.find((entry) => !entry.locked)?.id
      ?? entries[0]?.id
      ?? null;
  }
  if (category === "requests") {
    return entries.find((entry) => entry.current)?.id
      ?? entries.find((entry) => !entry.complete && !entry.locked)?.id
      ?? entries[0]?.id
      ?? null;
  }
  if (category === "places") {
    return entries.find((entry) => entry.current)?.id
      ?? entries.find((entry) => !entry.locked)?.id
      ?? null;
  }
  return entries[0]?.id ?? null;
}

function trackerCard(
  entry: JournalEntryView,
  kind: QuestTrackerCardView["kind"],
): QuestTrackerCardView {
  return {
    kind,
    category: kind === "story" ? "story" : "requests",
    entryId: entry.id,
    title: entry.title,
    progressCurrent: entry.progressCurrent,
    progressTotal: entry.progressTotal,
    complete: entry.complete,
    nextObjective:
      entry.objectives.find((objective) => !objective.complete)?.label ?? null,
  };
}

export function buildQuestTrackerView(
  state: CampaignStateV1,
  trackedRequestEntryId: string | null = null,
  currentLocation: LocationId = state.currentLocation,
): QuestTrackerView {
  const journal = buildJournalView(state, currentLocation);
  const activeStory = journal.entries.story.find(
    (entry) => !entry.locked && !entry.complete,
  );
  const lastStory = [...journal.entries.story]
    .reverse()
    .find((entry) => !entry.locked && entry.complete);
  const story = activeStory
    ? trackerCard(activeStory, "story")
    : {
        kind: "story" as const,
        category: "story" as const,
        entryId: lastStory?.id ?? defaultJournalEntryId(journal, "story"),
        title: "Story complete · Free exploration",
        progressCurrent: 1,
        progressTotal: 1,
        complete: true,
        nextObjective: null,
      };
  const trackedRequest = trackedRequestEntryId
    ? journal.entries.requests.find(
        (entry) => entry.id === trackedRequestEntryId && !entry.locked,
      )
    : undefined;
  const request = trackedRequest
    ? trackerCard(trackedRequest, "request")
    : null;
  return {
    story,
    request,
    showRequestsAction: request === null,
  };
}
