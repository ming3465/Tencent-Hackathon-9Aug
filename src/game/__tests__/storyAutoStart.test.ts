import { describe, expect, it } from "vitest";

import { NPC_PROFILES } from "../campaignContent.js";
import {
  shouldAutoStartStoryBeat,
  type StoryAutoStartContext,
} from "../storyAutoStart.js";

function context(
  overrides: Partial<StoryAutoStartContext> = {},
): StoryAutoStartContext {
  return {
    intentKind: "main-story",
    beatKey: "mr-long:mr-long-opening",
    firedBeats: new Set<string>(),
    dialogueOpen: false,
    paused: false,
    inWorld: true,
    hasWalked: true,
    ...overrides,
  };
}

describe("story beats open on approach", () => {
  it("opens an authored main-story beat when the player walks up", () => {
    expect(shouldAutoStartStoryBeat(context())).toBe(true);
  });

  it("leaves every other kind of conversation to the player", () => {
    // Approaching someone must never spend a choice on the player's behalf.
    for (const kind of [
      "greeting",
      "clue",
      "offer-request",
      "reminder",
      "contribution",
      "memory-reaction",
      "invitation",
      "reflection",
    ] as const) {
      expect(shouldAutoStartStoryBeat(context({ intentKind: kind }))).toBe(false);
    }
  });

  it("fires a beat once, not every time the player walks past", () => {
    const fired = new Set(["mr-long:mr-long-opening"]);
    expect(shouldAutoStartStoryBeat(context({ firedBeats: fired }))).toBe(false);
  });

  it("still allows a different beat from the same person", () => {
    const fired = new Set(["mr-long:mr-long-opening"]);
    expect(
      shouldAutoStartStoryBeat(
        context({ firedBeats: fired, beatKey: "mr-long:mr-long-ramp-done" }),
      ),
    ).toBe(true);
  });

  it("never interrupts a dialogue that is already open", () => {
    expect(shouldAutoStartStoryBeat(context({ dialogueOpen: true }))).toBe(false);
  });

  it("never fires while the game is paused", () => {
    expect(shouldAutoStartStoryBeat(context({ paused: true }))).toBe(false);
  });

  it("never fires outside the world screen", () => {
    expect(shouldAutoStartStoryBeat(context({ inWorld: false }))).toBe(false);
  });

  it("requires the player to have actually walked since arriving", () => {
    // Spawning inside someone's radius is not approaching them. Without this
    // a dialogue lands before the player has seen the room or pressed a key.
    expect(shouldAutoStartStoryBeat(context({ hasWalked: false }))).toBe(false);
  });
});

describe("the story has beats for this to open", () => {
  it("authors main-story intents on the story cast", () => {
    const mainStory = NPC_PROFILES.flatMap((npc) =>
      npc.intents.filter((intent) => intent.kind === "main-story"),
    );
    expect(mainStory.length).toBeGreaterThan(4);
    // Every one is reachable by the key format the auto-start uses.
    for (const intent of mainStory) {
      expect(`${intent.npcId}:${intent.id}`).toMatch(/^[a-z-]+:[a-z0-9-]+$/);
    }
  });

  it("keeps the young villagers out of the auto-start path", () => {
    // They exist to be talked to, not to ambush the player with a cutscene.
    const young = ["hafiz", "jia-en", "arun", "nadia", "kai", "priya"];
    for (const id of young) {
      const profile = NPC_PROFILES.find((npc) => npc.id === id);
      expect(profile).toBeDefined();
      expect(profile!.intents.every((intent) => intent.kind !== "main-story"))
        .toBe(true);
    }
  });
});
