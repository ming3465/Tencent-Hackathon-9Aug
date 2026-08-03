export type ChapterId =
  | "prologue"
  | "chapter-1"
  | "chapter-2"
  | "chapter-3"
  | "ending";

export type CampaignPhase = ChapterId | "free-explore";

export type NpcId =
  | "voice"
  | "aunty-mei"
  | "uncle-ravi"
  | "mdm-siti"
  | "pak-yusof"
  | "coach-meng"
  | "uncle-seng"
  | "auntie-minah"
  | "wei-ling"
  | "mr-long"
  | "grandma-ros"
  | "craftsman-tan"
  | "ben";

export type LocationId =
  | "y-flat"
  | "hdb-corridor"
  | "estate"
  | "mr-long-flat"
  | "grandma-ros-kitchen"
  | "ben-flat"
  | "craftsman-workshop"
  | "community-centre"
  | "kopitiam"
  | "provision-shop"
  | "hawker-centre"
  | "prayer-hall";

export type QuestId =
  | "prologue-voice"
  | "open-the-way"
  | "garden-request"
  | "noticeboard-request"
  | "sheltered-route-request"
  | "doorstep-request"
  | "seating-request"
  | "morning-table-request"
  | "ingredient-shelf-request"
  | "keepsake-table-request"
  | "grandma-ros-clues"
  | "cooking-invitations"
  | "hands-remember"
  | "last-door";

export interface KampungMeters {
  connection: number;
  purpose: number;
  comfort: number;
}

export interface CampaignThresholds {
  helpers: number;
  attendees: number;
}

export interface CampaignStateV1 {
  version: 1;
  currentChapter: CampaignPhase;
  completedChapters: ChapterId[];
  completedQuests: QuestId[];
  objectives: string[];
  npcContributions: NpcId[];
  invitedResidents: NpcId[];
  visitedLocations: LocationId[];
  choices: Record<string, string>;
  npcMemories: Partial<Record<NpcId, string[]>>;
  meters: KampungMeters;
  thresholds: CampaignThresholds;
  currentLocation: LocationId;
  demo: boolean;
  revision: number;
}

export type CampaignEvent =
  | { type: "visit-location"; locationId: LocationId }
  | { type: "complete-objective"; objectiveId: string }
  | {
      type: "complete-request";
      questId: QuestId;
      npcId: NpcId;
      choiceId: string;
      effects: KampungMeters;
    }
  | { type: "collect-clue"; clueId: string; npcId: NpcId }
  | { type: "invite-resident"; npcId: NpcId }
  | { type: "choose-approach"; approachId: "sit-beside" | "bring-keepsake" }
  | { type: "bring-ben-to-workshop" }
  | { type: "complete-weaving"; patternId: "steady-lines" | "shared-colours" }
  | { type: "complete-ending" };

export type NpcIntentKind =
  | "greeting"
  | "clue"
  | "offer-request"
  | "reminder"
  | "contribution"
  | "memory-reaction"
  | "invitation"
  | "reflection"
  | "main-story";

export interface IntentChoiceDefinition {
  id: string;
  label: string;
  responseLines: readonly string[];
  events: readonly CampaignEvent[];
}

export interface NpcIntentEligibility {
  chapters?: readonly CampaignPhase[];
  requiredObjectives?: readonly string[];
  forbiddenObjectives?: readonly string[];
  requiredCompletedQuests?: readonly QuestId[];
  forbiddenCompletedQuests?: readonly QuestId[];
  requiredVisitedLocations?: readonly LocationId[];
  requiredMemories?: readonly string[];
  notInvited?: boolean;
}

export interface NpcIntentDefinition {
  id: string;
  npcId: NpcId;
  kind: NpcIntentKind;
  title: string;
  lines: readonly string[];
  choices?: readonly IntentChoiceDefinition[];
  eligibility: NpcIntentEligibility;
  chapterRelevance: number;
}

export interface NpcProfile {
  id: NpcId;
  name: string;
  traits: readonly string[];
  communityRole: string;
  expertise: readonly string[];
  knowledge: readonly string[];
  memoryRules: readonly string[];
  intents: readonly NpcIntentDefinition[];
}

export interface ChapterDefinition {
  id: ChapterId;
  numberLabel: string;
  title: string;
  summary: string;
  journalObjective: string;
  entryLocationId: LocationId;
}

export interface QuestDefinition {
  id: QuestId;
  chapterId: ChapterId;
  title: string;
  summary: string;
  optional: boolean;
  npcId?: NpcId;
  objectiveIds: readonly string[];
}

export type LocationKind = "exterior" | "hub" | "home" | "landmark";

export interface LocationDefinition {
  id: LocationId;
  name: string;
  kind: LocationKind;
  description: string;
  connections: readonly LocationId[];
  unlockHint?: string;
}

export interface FlavourInteractionDefinition {
  id: string;
  label: string;
  shortLabel: string;
  lines: readonly string[];
  x: number;
  y: number;
}

export type WorldInteraction =
  | {
      kind: "npc";
      id: string;
      label: string;
      shortLabel: string;
      npcId: NpcId;
      x: number;
      y: number;
    }
  | {
      kind: "door";
      id: string;
      label: string;
      shortLabel: string;
      targetLocationId: LocationId;
      x: number;
      y: number;
    }
  | {
      kind: "exit";
      id: string;
      label: string;
      shortLabel: string;
      targetLocationId: LocationId;
      x: number;
      y: number;
    }
  | {
      kind: "quest-object";
      id: string;
      label: string;
      shortLabel: string;
      objectiveId: string;
      x: number;
      y: number;
    }
  | {
      kind: "flavour";
      id: string;
      label: string;
      shortLabel: string;
      lines: readonly string[];
      x: number;
      y: number;
    };
