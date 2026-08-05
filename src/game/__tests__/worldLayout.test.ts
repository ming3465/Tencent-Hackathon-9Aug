import { describe, expect, it } from "vitest";

import { effectiveCategoryGain } from "../audio.js";
import { DoorTransitionController } from "../doorState.js";
import {
  DOOR_DEFINITIONS,
  ESTATE_BUILDINGS,
  PEDESTRIAN_STREETS,
  SHELTER_DEFINITIONS,
  auditEstateLayout,
  getActiveShelters,
  getReturnSpawn,
  isPointDryUnderShelter,
  rectanglesOverlap,
} from "../estateLayout.js";
import { reducePauseState } from "../pauseState.js";

describe("three-quarter world layout", () => {
  it("matches the approved world geometry and stays internally valid", () => {
    expect(auditEstateLayout()).toEqual([]);
    expect(PEDESTRIAN_STREETS.map(({ id, x, y, width, height }) => [
      id, x, y, width, height,
    ])).toEqual([
      ["north-market-street", 64, 330, 2432, 170],
      ["civic-spine", 1120, 330, 240, 1220],
      ["west-sheltered-walk", 360, 330, 260, 900],
      ["south-community-street", 64, 1050, 2432, 180],
      ["east-connector", 1810, 330, 180, 1220],
      ["central-plaza", 680, 540, 1080, 200],
    ]);
    expect(ESTATE_BUILDINGS).toHaveLength(8);
    for (let index = 0; index < ESTATE_BUILDINGS.length; index += 1) {
      const current = ESTATE_BUILDINGS[index];
      if (!current) continue;
      for (const other of ESTATE_BUILDINGS.slice(index + 1)) {
        expect(rectanglesOverlap(current.bounds, other.bounds)).toBe(false);
      }
    }
  });

  it("defines 22 paired doors with reachable deterministic return spawns", () => {
    expect(DOOR_DEFINITIONS).toHaveLength(22);
    expect(new Set(DOOR_DEFINITIONS.map(({ id }) => id))).toHaveLength(22);
    for (const definition of DOOR_DEFINITIONS) {
      expect(getReturnSpawn(
        definition.sourceLocationId,
        definition.targetLocationId,
      )).toBeDefined();
    }
  });

  it("keeps the shelter choices distinct and the monsoon mask aligned", () => {
    expect(SHELTER_DEFINITIONS).toHaveLength(3);
    expect(getActiveShelters("shelter-gap").map(({ variant }) => variant)).toEqual([
      "base", "shelter-gap",
    ]);
    expect(getActiveShelters("rest-point").map(({ variant }) => variant)).toEqual([
      "base", "rest-point",
    ]);
    expect(isPointDryUnderShelter({ x: 490, y: 900 }, "shelter-gap")).toBe(true);
    expect(isPointDryUnderShelter({ x: 490, y: 900 }, "rest-point")).toBe(false);
    expect(isPointDryUnderShelter({ x: 230, y: 900 }, "rest-point")).toBe(true);
    expect(isPointDryUnderShelter({ x: 230, y: 900 }, "shelter-gap")).toBe(false);
    for (const definition of SHELTER_DEFINITIONS) {
      expect(definition.clearWalkway.width).toBeGreaterThanOrEqual(96);
      expect(definition.dryMask).toMatchObject({
        x: definition.roof.x,
        y: definition.roof.y,
        width: definition.roof.width,
        height: definition.roof.height,
      });
    }
  });
});

describe("door and pause state", () => {
  it("makes repeated door interactions idempotent", () => {
    const controller = new DoorTransitionController();
    expect(controller.beginOpening()).toBe(true);
    expect(controller.beginOpening()).toBe(false);
    expect(controller.finishOpening()).toBe(true);
    expect(controller.finishOpening()).toBe(false);
    expect(controller.beginTransition()).toBe(true);
    expect(controller.beginTransition()).toBe(false);
  });

  it("implements nested Escape semantics without losing pause", () => {
    expect(reducePauseState("closed", "escape")).toBe("paused");
    expect(reducePauseState("paused", "show-settings")).toBe("settings");
    expect(reducePauseState("settings", "escape")).toBe("paused");
    expect(reducePauseState("paused", "show-confirm-title")).toBe("confirm-title");
    expect(reducePauseState("confirm-title", "escape")).toBe("paused");
    expect(reducePauseState("paused", "escape")).toBe("closed");
  });

  it("ducks music to 35 percent without muting effects or UI", () => {
    const settings = { muted: false, music: 0.8, sfx: 0.6 };
    expect(effectiveCategoryGain(settings, "music", true)).toBeCloseTo(0.28);
    expect(effectiveCategoryGain(settings, "sfx", true)).toBe(0.6);
    expect(effectiveCategoryGain(settings, "ui", true)).toBe(0.6);
    expect(effectiveCategoryGain({ ...settings, muted: true }, "music", true)).toBe(0);
  });
});
