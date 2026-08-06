import { describe, expect, it } from "vitest";
import {
  CHAPTERS,
  ESTATE_FLAVOUR_INTERACTIONS,
  LOCATIONS,
  NPC_PROFILES,
  QUESTS,
  QUEST_BY_ID,
  SIDE_QUEST_IDS,
} from "../campaignContent.js";
import {
  CAMPAIGN_SAVE_KEY,
  FULL_ATTENDEE_THRESHOLD,
  FULL_HELPER_THRESHOLD,
  canEnterLocation,
  chapterIsUnlocked,
  createCampaignState,
  getChapterProgress,
  reduceCampaign,
} from "../campaign.js";
import {
  clearCampaign,
  isCampaignStateV1,
  loadCampaign,
  parseDemoMode,
  saveCampaign,
  type CampaignStorage,
} from "../campaignSave.js";
import {
  CAMPAIGN_PORTRAITS,
  renderCampaignPortrait,
} from "../campaignPortrait.js";
import { getCharacterArtAudit } from "../characterArt.js";
import { selectNpcIntent } from "../kampungMind.js";
import {
  auditEstateLayout,
  ESTATE_BICYCLE_RACKS,
  ESTATE_BUILDING_COLLISION_ZONES,
  ESTATE_BUILDING_VISUAL_ZONES,
  ESTATE_ENTRANCES,
  ESTATE_FACADE_DEPTH_DEFINITIONS,
  ESTATE_VEHICLE_LANES,
  ESTATE_VEHICLE_ROUTES,
  getOccludingBuildingIds,
} from "../estateLayout.js";
import {
  ESTATE_MAP_LANDMARKS,
  estateMapAnchorLocation,
  getEstateMapPosition,
} from "../estateMap.js";
import {
  buildQuestTrackerView,
  buildJournalView,
  defaultJournalEntryId,
} from "../journal.js";
import {
  movementSurfaceAt,
  stepIntervalFor,
  walkFrameAt,
} from "../movementFeel.js";
import type {
  CampaignEvent,
  CampaignStateV1,
  KampungMeters,
  NpcId,
  QuestId,
} from "../campaignTypes.js";

const EFFECTS: KampungMeters = {
  connection: 1,
  purpose: 1,
  comfort: 1,
};

const REQUEST_ROUTES: readonly [QuestId, NpcId, string][] = [
  ["garden-request", "aunty-mei", "herbs"],
  ["noticeboard-request", "uncle-ravi", "beginner-chess"],
  ["sheltered-route-request", "mdm-siti", "rest-point"],
  ["doorstep-request", "pak-yusof", "gentle-slope"],
  ["seating-request", "coach-meng", "wide-circle"],
  ["morning-table-request", "uncle-seng", "shared-sign"],
  ["ingredient-shelf-request", "auntie-minah", "meal-groups"],
  ["keepsake-table-request", "wei-ling", "story-tags"],
];

function apply(
  state: CampaignStateV1,
  ...events: readonly CampaignEvent[]
): CampaignStateV1 {
  return events.reduce(reduceCampaign, state);
}

function reachChapter1(demo = false): CampaignStateV1 {
  return apply(
    createCampaignState({ demo }),
    { type: "complete-objective", objectiveId: "heard-voice" },
    { type: "visit-location", locationId: "hdb-corridor" },
  );
}

function inspectMrLong(state = reachChapter1()): CampaignStateV1 {
  return apply(
    state,
    { type: "visit-location", locationId: "mr-long-flat" },
    { type: "complete-objective", objectiveId: "mr-long-step-seen" },
  );
}

function completeRequest(
  state: CampaignStateV1,
  route: (typeof REQUEST_ROUTES)[number],
): CampaignStateV1 {
  const [questId, npcId, choiceId] = route;
  return reduceCampaign(state, {
    type: "complete-request",
    questId,
    npcId,
    choiceId,
    effects: EFFECTS,
  });
}

function reachChapter2(
  routes: readonly (typeof REQUEST_ROUTES)[number][] = REQUEST_ROUTES.slice(0, 3),
  demo = false,
): CampaignStateV1 {
  let state = inspectMrLong(reachChapter1(demo));
  for (const route of routes) state = completeRequest(state, route);
  return state;
}

function reachChapter3(demo = false): CampaignStateV1 {
  const routes = demo ? REQUEST_ROUTES.slice(0, 2) : REQUEST_ROUTES.slice(0, 3);
  let state = reachChapter2(routes, demo);
  state = apply(
    state,
    { type: "collect-clue", clueId: "ros-clue-minah", npcId: "auntie-minah" },
    { type: "collect-clue", clueId: "ros-clue-seng", npcId: "uncle-seng" },
    { type: "visit-location", locationId: "grandma-ros-kitchen" },
  );
  const invitees = demo
    ? REQUEST_ROUTES.slice(0, 2)
    : REQUEST_ROUTES.slice(0, FULL_ATTENDEE_THRESHOLD);
  for (const [, npcId] of invitees) {
    state = reduceCampaign(state, { type: "invite-resident", npcId });
  }
  return state;
}

function reachEnding(): CampaignStateV1 {
  return apply(
    reachChapter3(),
    { type: "visit-location", locationId: "craftsman-workshop" },
    { type: "collect-clue", clueId: "ben-clue-tools", npcId: "craftsman-tan" },
    { type: "collect-clue", clueId: "ben-clue-keepsake", npcId: "wei-ling" },
    { type: "visit-location", locationId: "ben-flat" },
    { type: "choose-approach", approachId: "sit-beside" },
    { type: "bring-ben-to-workshop" },
    { type: "visit-location", locationId: "craftsman-workshop" },
    { type: "complete-weaving", patternId: "steady-lines" },
  );
}

describe("campaign ordering and alternatives", () => {
  it("starts in Y's flat with full-mode thresholds", () => {
    const state = createCampaignState();
    expect(state.version).toBe(1);
    expect(state.currentChapter).toBe("prologue");
    expect(state.currentLocation).toBe("y-flat");
    expect(state.thresholds).toEqual({
      helpers: FULL_HELPER_THRESHOLD,
      attendees: FULL_ATTENDEE_THRESHOLD,
    });
    expect(getChapterProgress(state)).toBe("Listen to the Voice.");
  });

  it("does not leave the prologue before the Voice is heard", () => {
    const state = createCampaignState();
    expect(reduceCampaign(state, {
      type: "visit-location",
      locationId: "hdb-corridor",
    })).toBe(state);
  });

  it("unlocks Chapter 1 after the first usable door", () => {
    const state = reachChapter1();
    expect(state.currentChapter).toBe("chapter-1");
    expect(state.completedChapters).toContain("prologue");
    expect(state.objectives).toContain("left-y-flat");
  });

  it("rejects future-chapter objectives and clues", () => {
    const state = reachChapter1();
    expect(reduceCampaign(state, {
      type: "complete-objective",
      objectiveId: "weaving-complete",
    })).toBe(state);
    expect(reduceCampaign(state, {
      type: "collect-clue",
      clueId: "ben-clue-tools",
      npcId: "craftsman-tan",
    })).toBe(state);
    expect(reduceCampaign(state, {
      type: "publish-scam-check",
      layoutId: "numbered-steps",
    })).toBe(state);
  });

  it("requires Mr. Long's own account before helper routes count", () => {
    const state = reachChapter1();
    expect(completeRequest(state, REQUEST_ROUTES[0])).toBe(state);
  });

  it("accepts different sets of three distinct helpers", () => {
    const routesA = REQUEST_ROUTES.slice(0, 3);
    const routesB = [REQUEST_ROUTES[3], REQUEST_ROUTES[5], REQUEST_ROUTES[7]];
    const a = reachChapter2(routesA);
    const b = reachChapter2(routesB);
    expect(a.currentChapter).toBe("chapter-2");
    expect(b.currentChapter).toBe("chapter-2");
    expect(a.npcContributions).not.toEqual(b.npcContributions);
    expect(a.objectives).toContain("ramp-built");
    expect(b.objectives).toContain("mr-long-outside");
  });

  it("keeps globally optional routes unfinished and revisitable", () => {
    let state = reachChapter2();
    expect(state.completedQuests).toHaveLength(3);
    expect(state.completedQuests).not.toContain("keepsake-table-request");
    state = completeRequest(state, REQUEST_ROUTES[7]);
    expect(state.currentChapter).toBe("chapter-2");
    expect(state.completedQuests).toContain("keepsake-table-request");
    expect(state.npcContributions).not.toContain("wei-ling");
  });

  it("makes duplicate requests and visits idempotent", () => {
    let state = inspectMrLong();
    state = completeRequest(state, REQUEST_ROUTES[0]);
    const duplicateRequest = completeRequest(state, REQUEST_ROUTES[0]);
    expect(duplicateRequest).toBe(state);
    const duplicateVisit = reduceCampaign(state, {
      type: "visit-location",
      locationId: "mr-long-flat",
    });
    expect(duplicateVisit).toBe(state);
  });

  it("builds Chapter 2 from two clues, an entered kitchen, and five invitees", () => {
    let state = reachChapter2();
    const minahIntent = selectNpcIntent({ state, npcId: "auntie-minah" });
    const minahChoices = minahIntent.choices ?? [];
    expect(minahIntent.id).toBe("minah-ros-clue");
    expect(minahIntent.lines.join(" ")).toContain("ScamShield at 1799");
    expect(minahIntent.lines.join(" ")).toContain("one-time password");
    expect(minahChoices).toHaveLength(2);
    expect(
      minahChoices.map((candidate) =>
        candidate.events.find((event) => event.type === "publish-scam-check")
      ),
    ).toEqual([
      { type: "publish-scam-check", layoutId: "numbered-steps" },
      { type: "publish-scam-check", layoutId: "icons-and-words" },
    ]);
    expect(minahChoices.every((candidate) => candidate.events.length === 1)).toBe(
      true,
    );
    state = apply(
      state,
      ...minahChoices[0].events,
      { type: "collect-clue", clueId: "ros-clue-seng", npcId: "uncle-seng" },
      { type: "visit-location", locationId: "grandma-ros-kitchen" },
    );
    expect(state.objectives).toContain("scam-check-shared");
    expect(state.objectives).toContain("ros-clue-minah");
    expect(state.choices["scam-check-card"]).toBe("numbered-steps");
    expect(state.npcMemories["auntie-minah"]).toContain(
      "shared:scam-check:numbered-steps",
    );
    expect(state.npcMemories["auntie-minah"]).toContain(
      "shared:ros-clue-minah",
    );
    const minahJournal = buildJournalView(state).entries.story.find(
      (entry) => entry.questId === "grandma-ros-clues",
    );
    const safetyObjective = minahJournal?.objectives.find(
      (objective) => objective.id === "scam-check-shared",
    );
    expect(safetyObjective?.complete).toBe(true);
    expect(safetyObjective?.label).toContain("ScamShield at 1799");
    expect(safetyObjective?.label).toContain("never share an OTP");
    expect(safetyObjective?.progressText).toBe(
      "Shop card: three large numbered steps",
    );
    expect(reduceCampaign(state, {
      type: "publish-scam-check",
      layoutId: "icons-and-words",
    })).toBe(state);
    const alternate = apply(reachChapter2(), ...minahChoices[1].events);
    expect(alternate.choices["scam-check-card"]).toBe("icons-and-words");
    expect(alternate.objectives).toContain("ros-clue-minah");
    for (const [, npcId] of REQUEST_ROUTES.slice(0, 4)) {
      state = reduceCampaign(state, { type: "invite-resident", npcId });
    }
    expect(state.currentChapter).toBe("chapter-2");
    state = reduceCampaign(state, {
      type: "invite-resident",
      npcId: REQUEST_ROUTES[4][1],
    });
    expect(state.currentChapter).toBe("chapter-3");
    expect(state.objectives).toContain("cooking-lesson-staged");
  });

  it("does not count the same invited resident twice", () => {
    let state = reachChapter2();
    state = reduceCampaign(state, {
      type: "invite-resident",
      npcId: "aunty-mei",
    });
    const twice = reduceCampaign(state, {
      type: "invite-resident",
      npcId: "aunty-mei",
    });
    expect(twice).toBe(state);
  });

  it("completes Hands Remember only after clues, approach, return, and weaving", () => {
    let state = reachChapter3();
    expect(state.currentChapter).toBe("chapter-3");
    state = apply(
      state,
      { type: "visit-location", locationId: "craftsman-workshop" },
      { type: "collect-clue", clueId: "ben-clue-tools", npcId: "craftsman-tan" },
      { type: "collect-clue", clueId: "ben-clue-keepsake", npcId: "wei-ling" },
      { type: "visit-location", locationId: "ben-flat" },
      { type: "choose-approach", approachId: "sit-beside" },
      { type: "bring-ben-to-workshop" },
      { type: "visit-location", locationId: "craftsman-workshop" },
    );
    expect(state.objectives).toContain("ben-at-workshop");
    state = reduceCampaign(state, {
      type: "complete-weaving",
      patternId: "steady-lines",
    });
    expect(state.currentChapter).toBe("ending");
    expect(state.completedChapters).toContain("chapter-3");
  });

  it("opens free exploration after the Last Door without erasing progress", () => {
    let state = reachChapter3();
    state = apply(
      state,
      { type: "visit-location", locationId: "craftsman-workshop" },
      { type: "collect-clue", clueId: "ben-clue-tools", npcId: "craftsman-tan" },
      { type: "collect-clue", clueId: "ben-clue-keepsake", npcId: "wei-ling" },
      { type: "visit-location", locationId: "ben-flat" },
      { type: "choose-approach", approachId: "bring-keepsake" },
      { type: "bring-ben-to-workshop" },
      { type: "visit-location", locationId: "craftsman-workshop" },
      { type: "complete-weaving", patternId: "shared-colours" },
      { type: "visit-location", locationId: "y-flat" },
      { type: "complete-ending" },
    );
    expect(state.currentChapter).toBe("free-explore");
    expect(state.completedChapters).toEqual([
      "prologue",
      "chapter-1",
      "chapter-2",
      "chapter-3",
      "ending",
    ]);
    expect(state.completedQuests).toHaveLength(3);
    expect(canEnterLocation(state, "ben-flat")).toBe(true);
  });
});

describe("demo-mode campaign", () => {
  it("uses two helpers and two attendees without skipping any chapter", () => {
    let state = reachChapter2(REQUEST_ROUTES.slice(0, 2), true);
    expect(state.currentChapter).toBe("chapter-2");
    expect(state.completedChapters).toEqual(["prologue", "chapter-1"]);
    state = reachChapter3(true);
    expect(state.currentChapter).toBe("chapter-3");
    expect(state.thresholds).toEqual({ helpers: 2, attendees: 2 });
  });

  it("parses only the documented ?demo=1 value", () => {
    expect(parseDemoMode("?demo=1")).toBe(true);
    expect(parseDemoMode("?demo=0")).toBe(false);
    expect(parseDemoMode("?demo")).toBe(false);
    expect(parseDemoMode("?other=1")).toBe(false);
  });
});

describe("quest tracker", () => {
  it("automatically follows the first incomplete story quest through every chapter", () => {
    const prologue = buildQuestTrackerView(createCampaignState()).story;
    expect([prologue.title, prologue.progressCurrent, prologue.progressTotal]).toEqual([
      "The First Door", 0, 2,
    ]);
    expect(prologue.nextObjective).toBe("Listen to the Voice");

    const chapterOne = buildQuestTrackerView(inspectMrLong()).story;
    expect(chapterOne.title).toBe("Open the Way");
    expect(chapterOne.nextObjective).toContain("Recruit 3 neighbours");

    const chapterTwo = reachChapter2();
    expect(buildQuestTrackerView(chapterTwo).story.title).toBe(
      "Who Knows Grandma Ros?",
    );
    const invitations = apply(
      chapterTwo,
      { type: "publish-scam-check", layoutId: "numbered-steps" },
      { type: "collect-clue", clueId: "ros-clue-seng", npcId: "uncle-seng" },
      { type: "visit-location", locationId: "grandma-ros-kitchen" },
    );
    const sequential = buildQuestTrackerView(invitations).story;
    expect(sequential.title).toBe("A Place at the Table");
    expect(sequential.nextObjective).toContain("Invite 5 residents");

    expect(buildQuestTrackerView(reachChapter3()).story.title).toBe(
      "Hands Remember",
    );
    const ending = reachEnding();
    expect(buildQuestTrackerView(ending).story.title).toBe("The Last Door");
    const freeExplore = apply(
      ending,
      { type: "visit-location", locationId: "y-flat" },
      { type: "complete-ending" },
    );
    expect(buildQuestTrackerView(freeExplore).story).toMatchObject({
      title: "Story complete · Free exploration",
      progressCurrent: 1,
      progressTotal: 1,
      complete: true,
      nextObjective: null,
    });
  });

  it("shows one session-selected optional request, including its completion", () => {
    const available = inspectMrLong();
    const trackedId = "quest:garden-request";
    const tracked = buildQuestTrackerView(available, trackedId);
    expect(tracked.request).toMatchObject({
      entryId: trackedId,
      title: "A Garden People Use",
      progressCurrent: 0,
      progressTotal: 1,
      complete: false,
    });
    expect(tracked.showRequestsAction).toBe(false);

    const completed = completeRequest(available, REQUEST_ROUTES[0]);
    expect(buildQuestTrackerView(completed, trackedId).request).toMatchObject({
      entryId: trackedId,
      progressCurrent: 1,
      progressTotal: 1,
      complete: true,
    });
  });

  it("uses the Requests fallback and rejects non-request tracking IDs", () => {
    const state = inspectMrLong();
    expect(buildQuestTrackerView(state).showRequestsAction).toBe(true);
    const invalidStorySelection = buildQuestTrackerView(
      state,
      "quest:open-the-way",
    );
    expect(invalidStorySelection.request).toBeNull();
    expect(invalidStorySelection.showRequestsAction).toBe(true);
  });
});

describe("KampungMind", () => {
  it("selects the prologue Voice intent from campaign facts", () => {
    const intent = selectNpcIntent({
      state: createCampaignState(),
      npcId: "voice",
    });
    expect(intent.id).toBe("voice-prologue");
    expect(intent.lines.join(" ")).toContain("arrow keys");
  });

  it("changes from offer to reminder after Maybe later without closing the route", () => {
    let state = inspectMrLong();
    const offer = selectNpcIntent({ state, npcId: "aunty-mei" });
    expect(offer.kind).toBe("offer-request");
    state = reduceCampaign(state, {
      type: "complete-objective",
      objectiveId: "offered:garden-request",
    });
    const reminder = selectNpcIntent({ state, npcId: "aunty-mei" });
    expect(reminder.kind).toBe("reminder");
    expect(reminder.choices).toHaveLength(2);
  });

  it("uses remembered help when scoring later authored intents", () => {
    let state = inspectMrLong();
    state = completeRequest(state, REQUEST_ROUTES[0]);
    const intent = selectNpcIntent({ state, npcId: "aunty-mei" });
    expect(intent.kind).toBe("memory-reaction");
    expect(state.npcMemories["aunty-mei"]).toContain("helped:garden-request");
  });

  it("selects a Chapter 2 invitation above a generic memory response", () => {
    let state = reachChapter2();
    state = apply(
      state,
      { type: "collect-clue", clueId: "ros-clue-minah", npcId: "auntie-minah" },
      { type: "collect-clue", clueId: "ros-clue-seng", npcId: "uncle-seng" },
      { type: "visit-location", locationId: "grandma-ros-kitchen" },
    );
    const intent = selectNpcIntent({ state, npcId: "aunty-mei" });
    expect(intent.kind).toBe("invitation");
  });

  it("is stable when called repeatedly with identical context", () => {
    const state = inspectMrLong();
    const ids = Array.from({ length: 10 }, () =>
      selectNpcIntent({ state, npcId: "pak-yusof" }).id
    );
    expect(new Set(ids).size).toBe(1);
  });
});

describe("campaign registries", () => {
  it("has unique IDs and valid quest NPC references", () => {
    expect(new Set(CHAPTERS.map((item) => item.id)).size).toBe(CHAPTERS.length);
    expect(new Set(QUESTS.map((item) => item.id)).size).toBe(QUESTS.length);
    expect(new Set(NPC_PROFILES.map((item) => item.id)).size).toBe(NPC_PROFILES.length);
    expect(new Set(LOCATIONS.map((item) => item.id)).size).toBe(LOCATIONS.length);
    expect(ESTATE_FLAVOUR_INTERACTIONS).toHaveLength(14);
    expect(
      new Set(ESTATE_FLAVOUR_INTERACTIONS.map((item) => item.id)).size,
    ).toBe(ESTATE_FLAVOUR_INTERACTIONS.length);
    for (const detail of ESTATE_FLAVOUR_INTERACTIONS) {
      expect(detail.id.startsWith("estate-")).toBe(true);
      expect(detail.label.length).toBeGreaterThan(10);
      expect(detail.shortLabel.length).toBeGreaterThan(2);
      expect(detail.lines.length).toBeGreaterThan(0);
      expect(detail.lines.every((line) => line.length >= 24)).toBe(true);
      expect(detail.x).toBeGreaterThanOrEqual(0);
      expect(detail.x).toBeLessThanOrEqual(2560);
      expect(detail.y).toBeGreaterThanOrEqual(0);
      expect(detail.y).toBeLessThanOrEqual(1600);
    }
    expect(auditEstateLayout()).toEqual([]);
    expect(ESTATE_VEHICLE_LANES).toHaveLength(0);
    expect(ESTATE_VEHICLE_ROUTES).toHaveLength(0);
    expect(ESTATE_BUILDING_VISUAL_ZONES).toHaveLength(8);
    expect(ESTATE_BUILDING_COLLISION_ZONES).toHaveLength(22);
    expect(ESTATE_FACADE_DEPTH_DEFINITIONS).toHaveLength(8);
    expect(
      new Set(
        ESTATE_FACADE_DEPTH_DEFINITIONS.map(
          (definition) => definition.buildingId,
        ),
      ),
    ).toEqual(
      new Set(ESTATE_BUILDING_VISUAL_ZONES.map((building) => building.id)),
    );
    expect(
      new Set(
        ESTATE_FACADE_DEPTH_DEFINITIONS.map(
          (definition) => definition.roofStyle,
        ),
      ),
    ).toEqual(new Set(["hipped", "sawtooth"]));
    expect(
      ESTATE_ENTRANCES.map((entrance) => [
        entrance.id,
        entrance.buildingId,
        entrance.x,
        entrance.y,
      ]),
    ).toEqual([
      ["estate-block-9", "block-9", 610, 330],
      ["estate-hawker", "hawker-centre", 970, 330],
      ["estate-kopitiam", "kopitiam", 1550, 330],
      ["estate-provision", "provision-shop", 2140, 330],
      ["estate-workshop", "craftsman-workshop", 870, 1050],
      ["estate-community", "community-centre", 1600, 1050],
      ["estate-prayer", "prayer-hall", 2250, 1050],
    ]);
    expect(ESTATE_MAP_LANDMARKS).toHaveLength(7);
    for (const location of LOCATIONS) {
      const point = getEstateMapPosition(location.id);
      expect(point.xPercent).toBeGreaterThanOrEqual(7);
      expect(point.xPercent).toBeLessThanOrEqual(93);
      expect(point.yPercent).toBeGreaterThanOrEqual(7);
      expect(point.yPercent).toBeLessThanOrEqual(93);
    }
    expect(estateMapAnchorLocation("y-flat")).toBe("hdb-corridor");
    expect(estateMapAnchorLocation("community-centre")).toBe(
      "community-centre",
    );
    const openingJournal = buildJournalView(createCampaignState());
    expect(openingJournal.entries.story).toHaveLength(5);
    expect(openingJournal.entries.requests).toHaveLength(8);
    expect(openingJournal.entries.requests.every((entry) => entry.locked)).toBe(
      true,
    );
    expect(openingJournal.entries.places.map((entry) => entry.locationId)).toEqual(
      ["y-flat"],
    );
    expect(defaultJournalEntryId(openingJournal, "story")).toBe(
      "quest:prologue-voice",
    );
    const chapterOneJournal = buildJournalView(inspectMrLong());
    const openWay = chapterOneJournal.entries.story.find(
      (entry) => entry.questId === "open-the-way",
    );
    expect(openWay?.current).toBe(true);
    expect(openWay?.objectives.find(
      (objective) => objective.id === "distinct-ramp-helpers",
    )?.progressText).toBe(`0 / ${FULL_HELPER_THRESHOLD}`);
    expect(
      chapterOneJournal.entries.requests.every((entry) => !entry.locked),
    ).toBe(true);
    expect(getOccludingBuildingIds({ x: 2100, y: 253 })).toContain(
      "provision-shop",
    );
    expect(getOccludingBuildingIds({ x: 2100, y: 500 })).toEqual([]);
    for (const rack of ESTATE_BICYCLE_RACKS) {
      if (!rack.interactionId) continue;
      const detail = ESTATE_FLAVOUR_INTERACTIONS.find(
        (candidate) => candidate.id === rack.interactionId,
      );
      expect(detail, rack.interactionId).toBeDefined();
      expect(detail?.x).toBe(rack.x);
      expect(detail?.y).toBe(rack.y);
    }
    for (const quest of QUESTS) {
      if (quest.npcId) {
        expect(NPC_PROFILES.some((npc) => npc.id === quest.npcId)).toBe(true);
      }
    }
    expect(new Set(Object.keys(CAMPAIGN_PORTRAITS))).toEqual(
      new Set(NPC_PROFILES.map((npc) => npc.id)),
    );
    expect(getCharacterArtAudit()).toEqual({
      residentCount: 18,
      youngCount: 8,
      adultCount: 2,
      elderCount: 8,
      hairStyleCount: 7,
      outfitCount: 7,
      buildCount: 3,
      accessoryCount: 6,
      carryingResidentCount: 6,
    });
    const portraitSvgs = NPC_PROFILES.map((npc) => {
      const svg = renderCampaignPortrait(npc.id);
      expect(svg).toContain(`data-portrait-id="${npc.id}"`);
      expect(svg.match(/<(?:path|rect)/g)?.length ?? 0).toBeGreaterThan(24);
      return svg;
    });
    expect(new Set(portraitSvgs).size).toBe(NPC_PROFILES.length);
    const portraitMoods = (["neutral", "thoughtful", "warm"] as const).map(
      (mood) => renderCampaignPortrait("uncle-ravi", mood),
    );
    portraitMoods.forEach((svg, index) => {
      expect(svg).toContain(
        `data-mood="${(["neutral", "thoughtful", "warm"] as const)[index]}"`,
      );
    });
    expect(new Set(portraitMoods).size).toBe(3);
    expect(renderCampaignPortrait(null)).toContain('data-portrait-id="estate"');
    expect(renderCampaignPortrait(null, "warm")).toContain(
      'data-mood="neutral"',
    );
  });

  it("has a connected, bidirectional location graph", () => {
    for (const location of LOCATIONS) {
      for (const connection of location.connections) {
        const neighbour = LOCATIONS.find((candidate) => candidate.id === connection);
        expect(neighbour, `${location.id} -> ${connection}`).toBeDefined();
        expect(neighbour?.connections).toContain(location.id);
      }
    }
    const visited = new Set<string>();
    const queue = [LOCATIONS[0].id];
    while (queue.length) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const location = LOCATIONS.find((candidate) => candidate.id === id)!;
      queue.push(...location.connections);
    }
    expect(visited.size).toBe(LOCATIONS.length);
    expect(movementSurfaceAt("estate", 650, 400)).toBe("stone");
    expect(movementSurfaceAt("estate", 350, 520)).toBe("grass");
    expect(movementSurfaceAt("estate", 1930, 1180)).toBe("stone");
    expect(movementSurfaceAt("y-flat", 650, 400)).toBe("indoor");
    expect([0, 125, 250, 375].map(
      (time) => walkFrameAt(time, false, false),
    )).toEqual([0, 1, 2, 3]);
    expect([0, 92, 184, 276].map(
      (time) => walkFrameAt(time, true, false),
    )).toEqual([0, 1, 2, 3]);
    expect(walkFrameAt(375, false, true)).toBe(0);
    expect(stepIntervalFor(true)).toBeLessThan(stepIntervalFor(false));
  });

  it("keeps all authored intent events pointed at real quests and NPCs", () => {
    for (const npc of NPC_PROFILES) {
      for (const intent of npc.intents) {
        expect(intent.npcId).toBe(npc.id);
        expect(intent.lines.length).toBeGreaterThan(0);
        for (const intentChoice of intent.choices ?? []) {
          expect(intentChoice.responseLines.length).toBeGreaterThan(0);
          for (const event of intentChoice.events) {
            if (event.type === "complete-request") {
              expect(QUEST_BY_ID.has(event.questId)).toBe(true);
              expect(event.npcId).toBe(npc.id);
            }
          }
        }
      }
    }
    expect(SIDE_QUEST_IDS).toHaveLength(8);
  });

  it("locks future chapters without unlocking their locations", () => {
    const state = reachChapter1();
    expect(chapterIsUnlocked(state, "chapter-1")).toBe(true);
    expect(chapterIsUnlocked(state, "chapter-2")).toBe(false);
    expect(canEnterLocation(state, "grandma-ros-kitchen")).toBe(false);
    expect(canEnterLocation(state, "craftsman-workshop")).toBe(false);
  });
});

class MemoryStorage implements CampaignStorage {
  value: string | null = null;
  reads = 0;
  writes = 0;
  removals = 0;

  getItem(key: string): string | null {
    expect(key).toBe(CAMPAIGN_SAVE_KEY);
    this.reads += 1;
    return this.value;
  }

  setItem(key: string, value: string): void {
    expect(key).toBe(CAMPAIGN_SAVE_KEY);
    this.writes += 1;
    this.value = value;
  }

  removeItem(key: string): void {
    expect(key).toBe(CAMPAIGN_SAVE_KEY);
    this.removals += 1;
    this.value = null;
  }
}

describe("campaign saves", () => {
  it("round-trips a versioned campaign", () => {
    const storage = new MemoryStorage();
    const state = reachChapter2();
    expect(saveCampaign(storage, state)).toBe(true);
    const loaded = loadCampaign(storage, false);
    expect(loaded).toEqual(state);
    expect(isCampaignStateV1(loaded)).toBe(true);

    const legacyState = reduceCampaign(state, {
      type: "collect-clue",
      clueId: "ros-clue-minah",
      npcId: "auntie-minah",
    });
    storage.value = JSON.stringify(legacyState);
    const migrated = loadCampaign(storage, false);
    expect(migrated?.objectives).toContain("scam-check-shared");
    expect(migrated?.choices["scam-check-card"]).toBe("numbered-steps");
    expect(migrated?.npcMemories["auntie-minah"]).toContain(
      "shared:scam-check:numbered-steps",
    );
    expect(migrated?.npcMemories["auntie-minah"]).toContain(
      "shared:ros-clue-minah",
    );
    expect(migrated?.revision).toBe(legacyState.revision + 1);

    const interruptedCardState = {
      ...state,
      objectives: [...state.objectives, "scam-check-shared"],
      choices: { ...state.choices, "scam-check-card": "icons-and-words" },
      npcMemories: {
        ...state.npcMemories,
        "auntie-minah": ["shared:scam-check:icons-and-words"],
      },
    } satisfies CampaignStateV1;
    storage.value = JSON.stringify(interruptedCardState);
    const repaired = loadCampaign(storage, false);
    expect(repaired?.objectives).toContain("ros-clue-minah");
    expect(repaired?.choices["scam-check-card"]).toBe("icons-and-words");
    expect(repaired?.npcMemories["auntie-minah"]).toContain(
      "shared:ros-clue-minah",
    );
  });

  it("returns null for corrupt and wrong-version saves", () => {
    const storage = new MemoryStorage();
    storage.value = "{bad json";
    expect(loadCampaign(storage, false)).toBeNull();
    storage.value = JSON.stringify({ version: 99 });
    expect(loadCampaign(storage, false)).toBeNull();
  });

  it("never reads, writes, or clears persistent storage in demo mode", () => {
    const storage = new MemoryStorage();
    const state = createCampaignState({ demo: true });
    expect(loadCampaign(storage, true)).toBeNull();
    expect(saveCampaign(storage, state)).toBe(false);
    expect(clearCampaign(storage, true)).toBe(false);
    expect(storage.reads).toBe(0);
    expect(storage.writes).toBe(0);
    expect(storage.removals).toBe(0);
  });

  it("clears a full-mode save for confirmed Start Over", () => {
    const storage = new MemoryStorage();
    storage.value = JSON.stringify(createCampaignState());
    expect(clearCampaign(storage, false)).toBe(true);
    expect(storage.value).toBeNull();
    expect(storage.removals).toBe(1);
  });
});
