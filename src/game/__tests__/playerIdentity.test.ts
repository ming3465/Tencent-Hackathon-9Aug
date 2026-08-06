import { describe, expect, it } from "vitest";

import { CAMPAIGN_SAVE_KEY, createCampaignState } from "../campaign.js";
import {
  CHAPTERS,
  ESTATE_FLAVOUR_INTERACTIONS,
  LOCATIONS,
  NPC_PROFILES,
  QUESTS,
} from "../campaignContent.js";
import { DOOR_DEFINITIONS } from "../estateLayout.js";
import { loadCampaign, type CampaignStorage } from "../campaignSave.js";
import {
  DEFAULT_APPEARANCE,
  DEFAULT_PLAYER_NAME,
  HAIR_COLOURS,
  MAX_PLAYER_NAME_LENGTH,
  personalise,
  PLAYER_NAME_TOKEN,
  sanitiseAppearance,
  sanitisePlayerName,
  SHIRT_COLOURS,
  SKIN_TONES,
  TROUSER_COLOURS,
} from "../playerIdentity.js";

/** Every string reachable from a shipped content structure. */
function stringsIn(value: unknown, seen = new Set<unknown>()): string[] {
  if (typeof value === "string") return [value];
  if (value === null || typeof value !== "object") return [];
  if (seen.has(value)) return [];
  seen.add(value);
  const entries = value instanceof Map
    ? [...value.values()]
    : Object.values(value as Record<string, unknown>);
  return entries.flatMap((entry) => stringsIn(entry, seen));
}

describe("player name", () => {
  it("falls back to Y when the field is left blank", () => {
    expect(sanitisePlayerName("")).toBe(DEFAULT_PLAYER_NAME);
    expect(sanitisePlayerName("   ")).toBe(DEFAULT_PLAYER_NAME);
    expect(sanitisePlayerName(undefined)).toBe(DEFAULT_PLAYER_NAME);
    expect(sanitisePlayerName(null)).toBe(DEFAULT_PLAYER_NAME);
    expect(sanitisePlayerName(42)).toBe(DEFAULT_PLAYER_NAME);
  });

  it("keeps a normal name intact", () => {
    expect(sanitisePlayerName("Siti")).toBe("Siti");
    expect(sanitisePlayerName("  Wei Ling  ")).toBe("Wei Ling");
  });

  it("collapses whitespace and strips control characters", () => {
    // A paste from a document must not be able to break a dialogue card.
    expect(sanitisePlayerName("Ah\n\nSeng")).toBe("Ah Seng");
    expect(sanitisePlayerName("Mei\tLing")).toBe("Mei Ling");
  });

  it("caps the length so a dialogue line cannot overflow on a phone", () => {
    const long = "Bartholomew Alexander Fitzgerald";
    const capped = sanitisePlayerName(long);
    expect(capped.length).toBeLessThanOrEqual(MAX_PLAYER_NAME_LENGTH);
    expect(long.startsWith(capped)).toBe(true);
  });

  it("never returns a trailing space after capping mid-word", () => {
    expect(sanitisePlayerName("Aaaaaaaaaaaaaaaaa B")).not.toMatch(/\s$/);
  });
});

describe("player appearance", () => {
  it("defaults every field when given nothing", () => {
    expect(sanitiseAppearance(undefined)).toEqual(DEFAULT_APPEARANCE);
    expect(sanitiseAppearance(null)).toEqual(DEFAULT_APPEARANCE);
    expect(sanitiseAppearance("nonsense")).toEqual(DEFAULT_APPEARANCE);
  });

  it("keeps valid choices and falls back only on the bad field", () => {
    const chosen = sanitiseAppearance({
      skin: SKIN_TONES[0]!.value,
      hair: HAIR_COLOURS[2]!.value,
      shirt: 0x123456, // not an offered option
      trousers: TROUSER_COLOURS[1]!.value,
    });
    expect(chosen.skin).toBe(SKIN_TONES[0]!.value);
    expect(chosen.hair).toBe(HAIR_COLOURS[2]!.value);
    expect(chosen.shirt).toBe(DEFAULT_APPEARANCE.shirt);
    expect(chosen.trousers).toBe(TROUSER_COLOURS[1]!.value);
  });

  it("offers options that are all distinct and all labelled", () => {
    for (const group of [
      SKIN_TONES,
      HAIR_COLOURS,
      SHIRT_COLOURS,
      TROUSER_COLOURS,
    ]) {
      expect(group.length).toBeGreaterThanOrEqual(4);
      expect(new Set(group.map((option) => option.value)).size)
        .toBe(group.length);
      expect(new Set(group.map((option) => option.id)).size).toBe(group.length);
      // Colour is never the sole carrier of meaning.
      for (const option of group) expect(option.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("keeps the shipped look as the default", () => {
    // A player who skips the panel must get exactly the original sprite.
    expect(SKIN_TONES.some((o) => o.value === DEFAULT_APPEARANCE.skin)).toBe(true);
    expect(HAIR_COLOURS.some((o) => o.value === DEFAULT_APPEARANCE.hair)).toBe(true);
    expect(SHIRT_COLOURS.some((o) => o.value === DEFAULT_APPEARANCE.shirt)).toBe(true);
    expect(TROUSER_COLOURS.some((o) => o.value === DEFAULT_APPEARANCE.trousers))
      .toBe(true);
  });
});

describe("personalising story text", () => {
  it("replaces every occurrence of the token", () => {
    const line =
      "Nobody came to rescue {player}. They came because {player} had already helped.";
    expect(personalise(line, "Siti")).toBe(
      "Nobody came to rescue Siti. They came because Siti had already helped.",
    );
  });

  it("handles the possessive without inventing grammar", () => {
    expect(personalise("{player}'s Flat", "Ravi")).toBe("Ravi's Flat");
    expect(personalise("{player}'s Flat", "Lois")).toBe("Lois's Flat");
  });

  it("leaves untokenised text untouched", () => {
    expect(personalise("The estate is already awake.", "Siti"))
      .toBe("The estate is already awake.");
  });

  it("still reads correctly for the default name", () => {
    expect(personalise("Morning, {player}. The estate is already awake.", "Y"))
      .toBe("Morning, Y. The estate is already awake.");
  });
});

describe("story content uses the token rather than a hard-coded Y", () => {
  // Walks the data the game actually ships rather than the source text, so a
  // new line written as "Y\u0027s flat" is caught wherever it was authored.
  const content: Record<string, unknown> = {
    CHAPTERS,
    QUESTS,
    LOCATIONS,
    NPC_PROFILES,
    ESTATE_FLAVOUR_INTERACTIONS,
    DOOR_DEFINITIONS,
  };

  for (const [name, value] of Object.entries(content)) {
    it(`${name} addresses the player by token, not by "Y"`, () => {
      // Standalone "Y", not just the possessive: a line like "the part of Y
      // that had begun to fade" is just as wrong for a player called Halimah,
      // and the possessive-only check missed exactly that.
      const offenders = stringsIn(value).filter((text) => /\bY\b/.test(text));
      expect(offenders).toEqual([]);
    });
  }

  it("still contains the token it is meant to use", () => {
    const all = stringsIn(content);
    expect(all.some((text) => text.includes(PLAYER_NAME_TOKEN))).toBe(true);
  });

  it("resolves every tokenised string to the chosen name", () => {
    const tokenised = stringsIn(content).filter((text) =>
      text.includes(PLAYER_NAME_TOKEN),
    );
    expect(tokenised.length).toBeGreaterThan(5);
    for (const text of tokenised) {
      const resolved = personalise(text, "Halimah");
      expect(resolved).not.toContain(PLAYER_NAME_TOKEN);
      expect(resolved).toContain("Halimah");
    }
  });
});

describe("campaign state carries the identity", () => {
  it("stores the sanitised name and look at creation", () => {
    const state = createCampaignState({
      playerName: "  Wei Ling ",
      playerAppearance: { ...DEFAULT_APPEARANCE, hair: HAIR_COLOURS[3]!.value },
    });
    expect(state.playerName).toBe("Wei Ling");
    expect(state.playerAppearance.hair).toBe(HAIR_COLOURS[3]!.value);
  });

  it("defaults to Y when no name is supplied", () => {
    expect(createCampaignState({}).playerName).toBe(DEFAULT_PLAYER_NAME);
    expect(createCampaignState({}).playerAppearance).toEqual(DEFAULT_APPEARANCE);
  });
});

describe("saves written before the customiser still load", () => {
  function storageWith(value: string): CampaignStorage {
    const map = new Map<string, string>([[CAMPAIGN_SAVE_KEY, value]]);
    return {
      getItem: (key) => map.get(key) ?? null,
      setItem: (key, next) => void map.set(key, next),
      removeItem: (key) => void map.delete(key),
    };
  }

  it("fills in the default identity without discarding progress", () => {
    const legacy = createCampaignState({}) as unknown as Record<string, unknown>;
    // Exactly what an older save looks like on disk: no identity fields.
    delete legacy.playerName;
    delete legacy.playerAppearance;
    legacy.completedQuests = ["ros-clue"];
    legacy.revision = 7;

    const loaded = loadCampaign(storageWith(JSON.stringify(legacy)), false);
    expect(loaded).not.toBeNull();
    expect(loaded!.playerName).toBe(DEFAULT_PLAYER_NAME);
    expect(loaded!.playerAppearance).toEqual(DEFAULT_APPEARANCE);
    // Progress survives - the point of migrating rather than rejecting.
    expect(loaded!.completedQuests).toEqual(["ros-clue"]);
    expect(loaded!.revision).toBe(7);
  });

  it("repairs a hand-edited appearance instead of dropping the save", () => {
    const tampered = createCampaignState({}) as unknown as Record<string, unknown>;
    tampered.playerName = "   ";
    tampered.playerAppearance = { skin: "red", hair: 999, shirt: null };

    const loaded = loadCampaign(storageWith(JSON.stringify(tampered)), false);
    expect(loaded).not.toBeNull();
    expect(loaded!.playerName).toBe(DEFAULT_PLAYER_NAME);
    expect(loaded!.playerAppearance).toEqual(DEFAULT_APPEARANCE);
  });
});
