import { describe, expect, it } from "vitest";

import { CAMPAIGN_PORTRAITS } from "../campaignPortrait.js";
import { portraitPhotoCandidates } from "../portraitPhoto.js";
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

  it("keeps every path relative, so the judged sub-path deploy still resolves", () => {
    // The build is served from /Tencent-Hackathon-9Aug/, not from a domain root.
    for (const npcId of NPC_IDS) {
      for (const path of portraitPhotoCandidates(npcId)) {
        expect(path.startsWith("./")).toBe(true);
      }
    }
  });
});
