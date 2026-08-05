import { describe, expect, it } from "vitest";

import { effectiveCategoryGain } from "../audio.js";
import { DoorTransitionController } from "../doorState.js";
import {
  DOOR_DEFINITIONS,
  ESTATE_BUILDINGS,
  ESTATE_SIDE_LAMPS,
  ESTATE_TREES,
  PEDESTRIAN_STREETS,
  SHELTER_DEFINITIONS,
  SIDEWALK_APRONS,
  auditEstateLayout,
  doorApproachBounds,
  getActiveShelters,
  getReturnSpawn,
  isPointDryUnderShelter,
  rectanglesOverlap,
  rectangleContains,
  treeSpriteBounds,
} from "../estateLayout.js";
import { movementSurfaceAt } from "../movementFeel.js";
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

  it("keeps every tree sprite off walking streets and fixed structures", () => {
    expect(ESTATE_TREES.map(({ texture, anchor }) => [
      texture,
      anchor.x,
      anchor.y,
    ])).toEqual([
      ["tree-frangipani", 90, 700],
      ["tree-rain", 270, 740],
      ["tree-frangipani", 2180, 636],
      ["tree-palm", 2490, 700],
      ["tree-rain", 790, 1408],
      ["tree-palm", 960, 1550],
      ["tree-palm", 1450, 1480],
      ["tree-frangipani", 1650, 1370],
      ["tree-rain", 2140, 1450],
      ["tree-frangipani", 2300, 1530],
      ["tree-rain", 2465, 1400],
    ]);
    expect(ESTATE_TREES).toHaveLength(11);
    expect(ESTATE_TREES.reduce<Record<string, number>>((counts, tree) => {
      counts[tree.texture] = (counts[tree.texture] ?? 0) + 1;
      return counts;
    }, {})).toEqual({
      "tree-frangipani": 4,
      "tree-rain": 4,
      "tree-palm": 3,
    });
    for (const tree of ESTATE_TREES) {
      const bounds = treeSpriteBounds(tree);
      expect(rectangleContains({ id: "world", x: 0, y: 0, width: 2560, height: 1600 }, bounds)).toBe(true);
      expect(rectangleContains(bounds, tree.trunkCollider)).toBe(true);
      expect(tree.trunkCollider).toMatchObject({ width: 20, height: 24 });
      expect(tree.depthLayer).toBe(5);
      for (const obstruction of [
        ...PEDESTRIAN_STREETS,
        ...ESTATE_BUILDINGS.map(({ bounds: buildingBounds }) => buildingBounds),
        ...SHELTER_DEFINITIONS.map(({ bounds: shelterBounds }) => shelterBounds),
        ...SIDEWALK_APRONS,
      ]) {
        expect(rectanglesOverlap(bounds, obstruction), `${tree.id} / ${obstruction.id}`).toBe(false);
      }
    }
  });

  it("grounds all six side lamps on stone aprons clear of streets and doors", () => {
    expect(ESTATE_SIDE_LAMPS.map(({ anchor }) => [anchor.x, anchor.y])).toEqual([
      [770, 532],
      [1020, 532],
      [2018, 662],
      [1090, 1042],
      [650, 1262],
      [2020, 1262],
    ]);
    expect(SIDEWALK_APRONS.map(({ x, y, width, height }) => [
      x, y, width, height,
    ])).toEqual([
      [742, 500, 56, 40],
      [992, 500, 56, 40],
      [1990, 630, 56, 40],
      [1062, 1010, 56, 40],
      [622, 1230, 56, 40],
      [1992, 1230, 56, 40],
    ]);
    for (const lamp of ESTATE_SIDE_LAMPS) {
      const apron = SIDEWALK_APRONS.find(({ id }) => id === lamp.apronId);
      expect(apron, lamp.id).toBeDefined();
      expect(rectangleContains(apron!, lamp.collider)).toBe(true);
      expect(lamp.collider).toMatchObject({ width: 14, height: 12 });
      expect(lamp.depthLayer).toBe(4);
      expect(movementSurfaceAt("estate", lamp.anchor.x, lamp.anchor.y)).toBe("stone");
      expect(PEDESTRIAN_STREETS.some((street) =>
        rectanglesOverlap(lamp.collider, street)
      )).toBe(false);
      expect(DOOR_DEFINITIONS
        .filter(({ sourceLocationId }) => sourceLocationId === "estate")
        .some((door) => rectanglesOverlap(lamp.collider, doorApproachBounds(door))))
        .toBe(false);
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
