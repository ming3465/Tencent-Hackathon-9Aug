import { describe, expect, it } from "vitest";

import { reduceCampaign, createCampaignState } from "../campaign.js";
import {
  availableDropoff,
  availablePickups,
  carriedErrand,
  CARRY_ERRANDS,
  deliveredErrands,
  errandById,
  isErrandDelivered,
} from "../carryErrands.js";
import { ESTATE_BUILDINGS } from "../estateLayout.js";
import type { CampaignStateV1 } from "../campaignTypes.js";

const FIRST = CARRY_ERRANDS[0]!;

function fresh(): CampaignStateV1 {
  return createCampaignState({});
}

describe("errand data", () => {
  it("starts the player empty-handed", () => {
    expect(fresh().carrying).toBeNull();
  });

  it("gives every errand a distinct id, item and objective", () => {
    expect(CARRY_ERRANDS.length).toBeGreaterThanOrEqual(2);
    for (const key of ["id", "item", "objectiveId"] as const) {
      const values = CARRY_ERRANDS.map((errand) => errand[key]);
      expect(new Set(values).size).toBe(values.length);
    }
  });

  it("never puts a pickup and its drop-off in the same spot", () => {
    // Otherwise the errand is not a journey and the mechanic is pointless.
    for (const errand of CARRY_ERRANDS) {
      const dx = errand.pickup.x - errand.dropoff.x;
      const dy = errand.pickup.y - errand.dropoff.y;
      expect(Math.hypot(dx, dy)).toBeGreaterThan(400);
    }
  });

  it("places every errand point on walkable ground, not inside a building", () => {
    // A prompt the player cannot physically reach is worse than no prompt.
    for (const errand of CARRY_ERRANDS) {
      for (const point of [errand.pickup, errand.dropoff]) {
        const blocked = ESTATE_BUILDINGS.some(({ bounds }) =>
          point.x >= bounds.x
          && point.x <= bounds.x + bounds.width
          && point.y >= bounds.y
          && point.y <= bounds.y + bounds.height);
        expect(`${errand.id}:${point.shortLabel}:${blocked}`)
          .toBe(`${errand.id}:${point.shortLabel}:false`);
      }
    }
  });

  it("gives every point authored lines rather than a placeholder", () => {
    for (const errand of CARRY_ERRANDS) {
      for (const point of [errand.pickup, errand.dropoff]) {
        expect(point.lines.length).toBeGreaterThan(0);
        for (const line of point.lines) expect(line.trim().length).toBeGreaterThan(20);
      }
    }
  });
});

describe("picking an errand up", () => {
  it("puts the item in the player's hands", () => {
    const state = reduceCampaign(fresh(), {
      type: "pick-up-errand",
      errandId: FIRST.id,
    });
    expect(state.carrying).toBe(FIRST.id);
    expect(carriedErrand(state)?.item).toBe(FIRST.item);
  });

  it("refuses a second item rather than swapping silently", () => {
    const holding = reduceCampaign(fresh(), {
      type: "pick-up-errand",
      errandId: FIRST.id,
    });
    const second = CARRY_ERRANDS[1]!;
    const after = reduceCampaign(holding, {
      type: "pick-up-errand",
      errandId: second.id,
    });
    expect(after.carrying).toBe(FIRST.id);
  });

  it("ignores an unknown errand instead of corrupting the save", () => {
    const state = reduceCampaign(fresh(), {
      type: "pick-up-errand",
      errandId: "no-such-errand",
    });
    expect(state.carrying).toBeNull();
  });

  it("cannot be picked up again once delivered", () => {
    let state = reduceCampaign(fresh(), {
      type: "pick-up-errand",
      errandId: FIRST.id,
    });
    state = reduceCampaign(state, {
      type: "deliver-errand",
      errandId: FIRST.id,
    });
    state = reduceCampaign(state, {
      type: "pick-up-errand",
      errandId: FIRST.id,
    });
    expect(state.carrying).toBeNull();
  });
});

describe("delivering an errand", () => {
  it("empties the hands and records the objective", () => {
    let state = reduceCampaign(fresh(), {
      type: "pick-up-errand",
      errandId: FIRST.id,
    });
    state = reduceCampaign(state, {
      type: "deliver-errand",
      errandId: FIRST.id,
    });
    expect(state.carrying).toBeNull();
    expect(state.objectives).toContain(FIRST.objectiveId);
    expect(isErrandDelivered(state, FIRST.id)).toBe(true);
    expect(deliveredErrands(state).map((errand) => errand.id)).toEqual([FIRST.id]);
  });

  it("does nothing when the player is not carrying that item", () => {
    const state = reduceCampaign(fresh(), {
      type: "deliver-errand",
      errandId: FIRST.id,
    });
    expect(state.carrying).toBeNull();
    expect(state.objectives).not.toContain(FIRST.objectiveId);
  });

  it("never breaks a chapter gate", () => {
    // Errands are additive texture. Delivering one must not advance the story.
    let state = fresh();
    const before = state.currentChapter;
    for (const errand of CARRY_ERRANDS) {
      state = reduceCampaign(state, {
        type: "pick-up-errand",
        errandId: errand.id,
      });
      state = reduceCampaign(state, {
        type: "deliver-errand",
        errandId: errand.id,
      });
    }
    expect(state.currentChapter).toBe(before);
    expect(state.completedQuests).toEqual([]);
  });
});

describe("which prompts are offered", () => {
  it("offers pickups on the estate and none while carrying", () => {
    const empty = fresh();
    expect(availablePickups(empty, "estate").length).toBeGreaterThan(0);
    const holding = reduceCampaign(empty, {
      type: "pick-up-errand",
      errandId: FIRST.id,
    });
    expect(availablePickups(holding, "estate")).toEqual([]);
  });

  it("offers the drop-off only for the item actually held", () => {
    const empty = fresh();
    expect(availableDropoff(empty, "estate")).toBeUndefined();
    const holding = reduceCampaign(empty, {
      type: "pick-up-errand",
      errandId: FIRST.id,
    });
    expect(availableDropoff(holding, "estate")?.id).toBe(FIRST.id);
  });

  it("stops offering a pickup once its errand is done", () => {
    let state = reduceCampaign(fresh(), {
      type: "pick-up-errand",
      errandId: FIRST.id,
    });
    state = reduceCampaign(state, {
      type: "deliver-errand",
      errandId: FIRST.id,
    });
    const offered = availablePickups(state, "estate").map((errand) => errand.id);
    expect(offered).not.toContain(FIRST.id);
  });

  it("offers nothing in a location that has no errand points", () => {
    expect(availablePickups(fresh(), "y-flat")).toEqual([]);
  });

  it("resolves errands by id", () => {
    expect(errandById(FIRST.id)?.item).toBe(FIRST.item);
    expect(errandById("nope")).toBeUndefined();
  });
});
