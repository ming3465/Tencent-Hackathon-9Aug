import { describe, expect, it } from "vitest";

import { CAMPAIGN_PORTRAITS } from "../campaignPortrait.js";
import {
  portraitPhotoCandidates,
  shippedPortraitCandidates,
} from "../portraitPhoto.js";
import type { NpcId } from "../campaignTypes.js";

const NPC_IDS = Object.keys(CAMPAIGN_PORTRAITS) as NpcId[];

describe("optional illustrated portraits", () => {
  it("offers a lookup path for every character in the campaign", () => {
    // If a neighbour exists, there must be a filename that upgrades them.
    expect(NPC_IDS.length).toBeGreaterThanOrEqual(19);
    for (const npcId of NPC_IDS) {
      expect(portraitPhotoCandidates(npcId).length).toBeGreaterThan(0);
    }
  });

  it("names files after the npc id, so the drop folder needs no registry", () => {
    for (const npcId of NPC_IDS) {
      for (const path of portraitPhotoCandidates(npcId)) {
        expect(path).toContain(`/portraits/${npcId}.`);
      }
    }
  });

  it("prefers webp and falls back to png", () => {
    const [first, second] = portraitPhotoCandidates("mr-long");
    expect(first).toMatch(/\.webp$/);
    expect(second).toMatch(/\.png$/);
  });

  it("requests nothing when the build shipped no portrait files", () => {
    // This was a live defect: discovery worked by *trying to load* each
    // candidate, so an empty portraits folder meant two 404s per character —
    // about forty failed requests a session, visible to anyone with developer
    // tools open. No files shipped must mean no requests made.
    for (const npcId of NPC_IDS) {
      expect(shippedPortraitCandidates(npcId, []), npcId).toEqual([]);
    }
  });

  it("requests only the file that was actually shipped", () => {
    expect(shippedPortraitCandidates("mr-long", ["mr-long.webp"]))
      .toEqual(["./assets/portraits/mr-long.webp"]);
    // A png ships for one character; nobody else is probed because of it.
    expect(shippedPortraitCandidates("mr-long", ["aunty-mei.png"])).toEqual([]);
    expect(shippedPortraitCandidates("aunty-mei", ["aunty-mei.png"]))
      .toEqual(["./assets/portraits/aunty-mei.png"]);
  });

  it("still prefers webp when a character ships both", () => {
    expect(shippedPortraitCandidates("mr-long", ["mr-long.png", "mr-long.webp"]))
      .toEqual([
        "./assets/portraits/mr-long.webp",
        "./assets/portraits/mr-long.png",
      ]);
  });

  it("ignores stray files that are not named after a character", () => {
    expect(shippedPortraitCandidates("mr-long", ["README.md", "notes.txt"])).toEqual([]);
  });

  it("keeps every path relative, so the judged sub-path deploy still resolves", () => {
    // The build is served from /Tencent-Hackathon-9Aug/, not from a domain root.
    for (const npcId of NPC_IDS) {
      for (const path of portraitPhotoCandidates(npcId)) {
        expect(path.startsWith("./")).toBe(true);
      }
    }
  });
});
