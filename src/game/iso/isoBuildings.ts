/**
 * Isometric building volumes.
 *
 * The shipped painter (`threeQuarterArt.ts:ensureBuildingTexture`) generates a
 * texture the size of the building's *plan footprint* and paints a head-on
 * *front elevation* into it. That is the mixed-perspective seam: a 270 px-tall
 * map rectangle is simultaneously 270 px of ground depth and 270 px of wall.
 *
 * Here a building is a real extruded prism. Its base is the same world-space
 * footprint used for collision — nothing in `estateLayout.ts` moves — and it
 * rises by a derived wall height. Three faces are visible in 2:1 dimetric:
 * the roof plane and the two walls facing the camera.
 */

import Phaser from "phaser";

import type { BuildingDefinition } from "../estateLayout.js";
import { PALETTE } from "../campaignArt.js";
import { isoHash, worldToIso, SUN_OFFSET_WORLD } from "./projection.js";

const ACCENTS: Record<string, number> = {
  coral: PALETTE.coral,
  gold: PALETTE.gold,
  green: PALETTE.green,
  purple: PALETTE.purple,
  teal: PALETTE.teal,
};

/** Warm plaster, in the reference's register rather than the flat cream. */
const WALL_BASE = 0xe4d5bb;
const ROOF_BASE = 0xa8543f;
const SHADOW = 0x2f2a1e;

/** Relative brightness per face. Classic readable isometric box shading. */
const ROOF_LIGHT = 0.1;
const SOUTH_FACE_LIGHT = -0.06;
const EAST_FACE_LIGHT = -0.24;

function channels(colour: number): [number, number, number] {
  return [(colour >> 16) & 0xff, (colour >> 8) & 0xff, colour & 0xff];
}

function pack(r: number, g: number, b: number): number {
  const clamp = (value: number): number =>
    Math.max(0, Math.min(255, Math.round(value)));
  return (clamp(r) << 16) | (clamp(g) << 8) | clamp(b);
}

function shade(colour: number, amount: number): number {
  const [r, g, b] = channels(colour);
  if (amount >= 0) {
    return pack(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
  }
  const factor = 1 + amount;
  return pack(r * factor, g * factor, b * factor);
}

/** Nudges hue warm or cool without materially changing lightness. */
function temper(colour: number, warmth: number): number {
  const [r, g, b] = channels(colour);
  return pack(r + warmth * 12, g + warmth * 3, b - warmth * 10);
}

interface Vec {
  x: number;
  y: number;
}

function quad(
  graphics: Phaser.GameObjects.Graphics,
  a: Vec,
  b: Vec,
  c: Vec,
  d: Vec,
  colour: number,
  alpha = 1,
): void {
  graphics.fillStyle(colour, alpha).fillPoints(
    [
      new Phaser.Geom.Point(a.x, a.y),
      new Phaser.Geom.Point(b.x, b.y),
      new Phaser.Geom.Point(c.x, c.y),
      new Phaser.Geom.Point(d.x, d.y),
    ],
    true,
  );
}

/**
 * Wall height derived from the existing roof depth, so buildings keep their
 * relative proportions without adding a field to `BuildingDefinition`.
 */
export function wallHeightFor(definition: BuildingDefinition): number {
  // Deliberately low-rise. The reference frames its courtyard with two-storey
  // kampung blocks; taller volumes dominate the frame and bury the human-scale
  // detail that carries the whole thesis.
  return 62 + definition.roofDepth * 0.85;
}

/**
 * Iso-space bounding box a building's artwork occupies, including its raised
 * roof, ground shadow and eave overhang.
 *
 * Baking each building into a texture cropped to this box keeps them cheap:
 * a full-canvas texture per building would cost roughly 2.3M pixels each.
 */
export function isoBuildingTextureBounds(definition: BuildingDefinition): {
  left: number;
  top: number;
  width: number;
  height: number;
} {
  const { x, y, width, height } = definition.bounds;
  const wallHeight = wallHeightFor(definition);
  const corners = [
    worldToIso(x, y),
    worldToIso(x + width, y),
    worldToIso(x + width, y + height),
    worldToIso(x, y + height),
  ];
  const shadowShift = worldToIso(SUN_OFFSET_WORLD.x, SUN_OFFSET_WORLD.y);
  const pad = 8;
  const left = Math.min(...corners.map((c) => c.x)) - pad;
  const right = Math.max(...corners.map((c) => c.x)) + shadowShift.x + pad;
  const top = Math.min(...corners.map((c) => c.y)) - wallHeight - pad;
  // Ground shadow reaches below the footprint, and the eave adds 5px.
  const bottom = Math.max(...corners.map((c) => c.y)) + shadowShift.y + 5 + pad;
  return {
    left,
    top,
    width: Math.ceil(right - left),
    height: Math.ceil(bottom - top),
  };
}

/**
 * Paints one building as an isometric prism.
 *
 * `originX`/`originY` shift projected points onto a non-negative canvas.
 * Draws in back-to-front order: ground shadow, roof, far-side walls.
 */
export function paintIsoBuilding(
  graphics: Phaser.GameObjects.Graphics,
  definition: BuildingDefinition,
  originX: number,
  originY: number,
): void {
  const { x, y, width, height } = definition.bounds;
  const wallHeight = wallHeightFor(definition);
  const accent = ACCENTS[definition.accent] ?? PALETTE.teal;

  // Per-building wall and roof tint. Eight identical cream blocks with
  // identical terracotta roofs read as a texture atlas, not a neighbourhood;
  // the reference's buildings each have their own faded paint job.
  const identity = isoHash(x, y);
  const wallTint = temper(
    shade(WALL_BASE, ((identity % 100) / 100 - 0.5) * 0.16),
    ((identity >>> 7) % 100) / 100 - 0.5,
  );
  const roofTint = temper(
    shade(ROOF_BASE, (((identity >>> 13) % 100) / 100 - 0.5) * 0.24),
    ((identity >>> 19) % 100) / 100 - 0.5,
  );

  const project = (worldX: number, worldY: number, lift = 0): Vec => {
    const point = worldToIso(worldX, worldY);
    return { x: point.x + originX, y: point.y + originY - lift };
  };

  // Footprint corners. N is farthest from camera and stays hidden behind the
  // volume, so only E/S/W ground corners are needed.
  const groundE = project(x + width, y);
  const groundS = project(x + width, y + height);
  const groundW = project(x, y + height);

  const topN = project(x, y, wallHeight);
  const topE = project(x + width, y, wallHeight);
  const topS = project(x + width, y + height, wallHeight);
  const topW = project(x, y + height, wallHeight);

  // Ground cast shadow, offset along the shared sun vector.
  const shadowN = project(x + SUN_OFFSET_WORLD.x, y + SUN_OFFSET_WORLD.y);
  const shadowE = project(x + width + SUN_OFFSET_WORLD.x, y + SUN_OFFSET_WORLD.y);
  const shadowS = project(
    x + width + SUN_OFFSET_WORLD.x,
    y + height + SUN_OFFSET_WORLD.y,
  );
  const shadowW = project(x + SUN_OFFSET_WORLD.x, y + height + SUN_OFFSET_WORLD.y);
  quad(graphics, shadowN, shadowE, shadowS, shadowW, SHADOW, 0.22);

  // --- South wall (the y = y+height plane, facing the camera) ---
  const southBase = shade(wallTint, SOUTH_FACE_LIGHT);
  quad(graphics, groundW, groundS, topS, topW, southBase);
  paintFaceDetail(
    graphics,
    groundW,
    groundS,
    wallHeight,
    definition,
    southBase,
    accent,
    true,
  );

  // --- East wall (the x = x+width plane) ---
  const eastBase = shade(wallTint, EAST_FACE_LIGHT);
  quad(graphics, groundS, groundE, topE, topS, eastBase);
  paintFaceDetail(
    graphics,
    groundS,
    groundE,
    wallHeight,
    definition,
    eastBase,
    accent,
    false,
  );

  // --- Roof plane ---
  const roofColour = shade(roofTint, ROOF_LIGHT);
  quad(graphics, topN, topE, topS, topW, roofColour);
  paintRoof(graphics, topN, topE, topW, definition, roofColour);

  // Eave line: a darker rim where roof meets wall reads as overhang thickness.
  const eave = shade(roofColour, -0.3);
  quad(
    graphics,
    topW,
    topS,
    { x: topS.x, y: topS.y + 5 },
    { x: topW.x, y: topW.y + 5 },
    eave,
  );
  quad(
    graphics,
    topS,
    topE,
    { x: topE.x, y: topE.y + 5 },
    { x: topS.x, y: topS.y + 5 },
    shade(eave, -0.1),
  );
}

/**
 * Lays out windows, shopfronts and an accent band on one wall face.
 *
 * Positions are parametric: `u` runs along the ground edge a to b, `v` runs
 * up the wall. That keeps everything on the face's parallelogram without
 * needing a transform matrix.
 */
function paintFaceDetail(
  graphics: Phaser.GameObjects.Graphics,
  a: Vec,
  b: Vec,
  wallHeight: number,
  definition: BuildingDefinition,
  faceColour: number,
  accent: number,
  isFront: boolean,
): void {
  const point = (u: number, v: number): Vec => ({
    x: a.x + (b.x - a.x) * u,
    y: a.y + (b.y - a.y) * u - v * wallHeight,
  });

  const cell = (
    u0: number,
    v0: number,
    u1: number,
    v1: number,
    colour: number,
    alpha = 1,
  ): void => {
    quad(
      graphics,
      point(u0, v0),
      point(u1, v0),
      point(u1, v1),
      point(u0, v1),
      colour,
      alpha,
    );
  };

  const isCommercial = ["hawker-centre", "kopitiam", "provision-shop"].includes(
    definition.id,
  );

  // Render grain across the whole face. Plaster is never one flat tone, and
  // large uniform walls are what drag the measured tonal richness down.
  const grainCols = 26;
  const grainRows = 10;
  for (let column = 0; column < grainCols; column += 1) {
    for (let row = 0; row < grainRows; row += 1) {
      const seed = isoHash(
        column * 17 + definition.bounds.x,
        row * 37 + definition.bounds.y,
      );
      const tone = ((seed % 100) / 100 - 0.5) * 0.22;
      cell(
        column / grainCols,
        row / grainRows,
        (column + 1) / grainCols,
        (row + 1) / grainRows,
        shade(faceColour, tone),
        0.72,
      );
    }
  }
  // Weathering streaks below the eave, a Singapore-tropical signature.
  for (let streak = 0; streak < 7; streak += 1) {
    const seed = isoHash(streak * 53, definition.bounds.x + definition.bounds.y);
    const u = (seed % 90) / 100 + 0.03;
    cell(u, 0.3, u + 0.02, 0.9, shade(faceColour, -0.16), 0.3);
  }

  // Plinth: darker band at ground level, grounding the volume.
  cell(0, 0, 1, 0.06, shade(faceColour, -0.3));

  // Accent band under the eave.
  cell(0, 0.9, 1, 0.95, accent, 0.85);

  const columns = Math.max(3, Math.round((isFront ? 9 : 4) * (definition.roofSegments / 6)));
  const glass = 0x5e8c98;
  const glassLit = 0xa9c8c5;

  if (isCommercial && isFront) {
    // Open shopfront: a deep dark recess with a lit counter and goods shelves.
    cell(0.05, 0.08, 0.95, 0.62, shade(faceColour, -0.72));
    for (let shelf = 0; shelf < 3; shelf += 1) {
      const v = 0.2 + shelf * 0.14;
      cell(0.09, v, 0.91, v + 0.03, shade(faceColour, -0.42));
      for (let item = 0; item < 8; item += 1) {
        const seed = isoHash(shelf * 41 + item * 13, definition.bounds.x);
        const u = 0.11 + item * 0.1;
        const goods = [accent, PALETTE.gold, PALETTE.green, PALETTE.cream][seed % 4];
        cell(u, v + 0.03, u + 0.05, v + 0.09, goods, 0.9);
      }
    }
    // Awning above the shopfront.
    cell(0.02, 0.62, 0.98, 0.7, accent);
    cell(0.02, 0.6, 0.98, 0.62, shade(accent, -0.28));
  } else {
    // Residential window grid.
    for (let column = 0; column < columns; column += 1) {
      const u0 = 0.04 + (column * 0.92) / columns;
      const u1 = u0 + 0.92 / columns - 0.02;
      for (let row = 0; row < 2; row += 1) {
        const v0 = 0.2 + row * 0.34;
        const v1 = v0 + 0.24;
        const seed = isoHash(column * 29 + row * 7, definition.bounds.y);
        cell(u0, v0, u1, v1, shade(faceColour, -0.5));
        cell(
          u0 + 0.006,
          v0 + 0.02,
          u1 - 0.006,
          v1 - 0.02,
          seed % 4 === 0 ? glassLit : glass,
        );
        // Sill catches the light.
        cell(u0, v0 - 0.025, u1, v0, shade(faceColour, 0.2));
        // Laundry pole flourish, the signature HDB detail.
        if (isFront && column % 3 === 1 && row === 1) {
          cell(u0, v1 + 0.02, u1, v1 + 0.04, shade(faceColour, -0.36));
          const cloth = [PALETTE.coral, PALETTE.gold, PALETTE.teal][seed % 3];
          cell(u0 + 0.01, v1 + 0.04, u0 + 0.03, v1 + 0.12, cloth, 0.92);
        }
      }
    }
  }
}

/** Roof plane treatment: hipped ridges or sawtooth bays, in projected space. */
function paintRoof(
  graphics: Phaser.GameObjects.Graphics,
  n: Vec,
  e: Vec,
  w: Vec,
  definition: BuildingDefinition,
  roofColour: number,
): void {
  // The roof diamond is a parallelogram, so its fourth corner is implied by
  // the other three: u runs N->E, v runs N->W.
  const point = (u: number, v: number): Vec => ({
    x: n.x + (e.x - n.x) * u + (w.x - n.x) * v,
    y: n.y + (e.y - n.y) * u + (w.y - n.y) * v,
  });

  const band = (
    u0: number,
    v0: number,
    u1: number,
    v1: number,
    colour: number,
    alpha = 1,
  ): void => {
    quad(
      graphics,
      point(u0, v0),
      point(u1, v0),
      point(u1, v1),
      point(u0, v1),
      colour,
      alpha,
    );
  };

  if (definition.roofStyle === "sawtooth") {
    const bays = Math.max(3, definition.roofSegments);
    for (let bay = 0; bay < bays; bay += 1) {
      const u0 = bay / bays;
      const u1 = (bay + 0.62) / bays;
      band(u0, 0, u1, 1, shade(roofColour, 0.12));
      band(u1, 0, (bay + 1) / bays, 1, shade(roofColour, -0.2));
    }
  } else {
    // Hipped: a central ridge with both slopes falling away from it.
    band(0, 0, 1, 0.46, shade(roofColour, 0.07));
    band(0, 0.54, 1, 1, shade(roofColour, -0.16));
    band(0, 0.46, 1, 0.54, shade(roofColour, 0.2));
  }

  // Tile grain. A flat roof plane is the single largest uniform area on the
  // whole estate; without per-tile variation the isometric build measures
  // *flatter* than the top-down one it replaces.
  const courses = Math.max(6, definition.roofSegments * 2);
  const ribs = 9;
  for (let course = 0; course < courses; course += 1) {
    for (let rib = 0; rib < ribs; rib += 1) {
      const u0 = course / courses;
      const u1 = (course + 1) / courses;
      const v0 = rib / ribs;
      const v1 = (rib + 1) / ribs;
      const seed = isoHash(course * 13 + definition.bounds.x, rib * 29 + definition.bounds.y);
      const tone = ((seed % 100) / 100 - 0.5) * 0.30;
      band(u0, v0, u1, v1, shade(roofColour, tone), 0.8);
      // Course shadow line along the lower edge of each tile row.
      band(u0, v1 - 0.012, u1, v1, shade(roofColour, -0.3), 0.4);
    }
  }
  // Ridge highlight last so it survives the grain pass.
  if (definition.roofStyle === "hipped") {
    band(0, 0.47, 1, 0.53, shade(roofColour, 0.22), 0.7);
  }
}
