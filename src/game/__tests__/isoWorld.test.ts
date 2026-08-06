import { describe, expect, it } from "vitest";

import { ESTATE_BUILDINGS } from "../estateLayout.js";
import {
  isoInputToWorld,
  isoWorldColliders,
  nearestIsoDoor,
  resolveIsoMovement,
} from "../iso/isoWorld.js";
import { isoToWorld, worldToIso } from "../iso/projection.js";

describe("isometric projection", () => {
  it("round-trips world coordinates losslessly", () => {
    for (const [x, y] of [
      [0, 0],
      [2560, 1600],
      [610, 330],
      [1150, 620],
    ]) {
      const iso = worldToIso(x, y);
      const back = isoToWorld(iso.x, iso.y);
      expect(back.x).toBeCloseTo(x, 6);
      expect(back.y).toBeCloseTo(y, 6);
    }
  });

  it("maps a world square onto an exact 2:1 diamond", () => {
    const top = worldToIso(0, 0);
    const right = worldToIso(64, 0);
    const bottom = worldToIso(64, 64);
    const left = worldToIso(0, 64);
    expect(right.x - left.x).toBe(64);
    expect(bottom.y - top.y).toBe(32);
  });
});

describe("isometric input mapping", () => {
  it("turns screen-down into equal positive world motion", () => {
    const down = isoInputToWorld(0, 1);
    expect(down.x).toBeCloseTo(down.y, 6);
    expect(down.x).toBeGreaterThan(0);
    // Screen-aligned: moving "down" must not shift the projected x at all.
    const from = worldToIso(0, 0);
    const to = worldToIso(down.x, down.y);
    expect(to.x - from.x).toBeCloseTo(0, 6);
  });

  it("turns screen-right into pure horizontal projected motion", () => {
    const right = isoInputToWorld(1, 0);
    const from = worldToIso(0, 0);
    const to = worldToIso(right.x, right.y);
    expect(to.y - from.y).toBeCloseTo(0, 6);
    expect(to.x - from.x).toBeGreaterThan(0);
  });

  it("treats a missing key binding as no input rather than NaN", () => {
    // A wrong `addKeys` form yields NaN, which would corrupt the position
    // permanently and silently.
    const nan = isoInputToWorld(Number.NaN, Number.NaN);
    expect(nan).toEqual({ x: 0, y: 0 });
  });
});

describe("isometric collision", () => {
  it("exposes every building, tree and landscaping collider", () => {
    const colliders = isoWorldColliders();
    expect(colliders.length).toBeGreaterThan(70);
    for (const rect of colliders) {
      expect(rect.width).toBeGreaterThan(0);
      expect(rect.height).toBeGreaterThan(0);
    }
  });

  it("blocks movement into a building instead of passing through", () => {
    const block9 = ESTATE_BUILDINGS.find((item) => item.id === "block-9");
    expect(block9).toBeDefined();
    const bounds = block9!.bounds;
    const colliders = isoWorldColliders();

    // Start just below the south face, centred on the solid left shell, and
    // push north hard.
    const startX = bounds.x + 120;
    const startY = bounds.y + bounds.height + 40;
    const result = resolveIsoMovement(startX, startY, 0, -200, colliders);

    expect(result.blockedY).toBe(true);
    expect(result.y).toBeGreaterThanOrEqual(bounds.y + bounds.height);
  });

  it("slides along a wall rather than sticking to it", () => {
    const block9 = ESTATE_BUILDINGS.find((item) => item.id === "block-9")!;
    const bounds = block9.bounds;
    const colliders = isoWorldColliders();
    const startX = bounds.x + 120;
    const startY = bounds.y + bounds.height + 12;

    // Pushing diagonally into the wall: the blocked axis stops, the free
    // axis keeps moving.
    const result = resolveIsoMovement(startX, startY, 40, -60, colliders);
    expect(result.blockedY).toBe(true);
    expect(result.x).toBeGreaterThan(startX);
  });
});

describe("isometric door proximity", () => {
  it("reports a door when standing on its approach point", () => {
    const door = nearestIsoDoor(610, 400);
    expect(door).not.toBeNull();
    expect(door!.sourceLocationId).toBe("estate");
  });

  it("reports nothing in open ground", () => {
    expect(nearestIsoDoor(1250, 900)).toBeNull();
  });
});
