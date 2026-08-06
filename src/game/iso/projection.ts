/**
 * Isometric projection for the Kampung SG estate.
 *
 * The logical world stays exactly as it is today: axis-aligned, top-down,
 * 2560x1600, with all collision, doors, shelters and NPC routes authored in
 * those coordinates. Nothing in `estateLayout.ts` has to move. This module
 * projects those world coordinates onto a 2:1 dimetric screen space at draw
 * time only.
 *
 * Keeping physics in world space and projecting for rendering is the single
 * biggest risk reducer in the isometric rebuild — Phaser's Arcade physics is
 * AABB-only and has no isometric mode, so a "real" isometric physics world
 * would mean re-authoring every collider by hand.
 */

/** Horizontal contraction. A world square of side S becomes a diamond S wide. */
export const ISO_SCALE_X = 0.5;

/** Vertical contraction. That same diamond is S/2 tall, giving the 2:1 look. */
export const ISO_SCALE_Y = 0.25;

/** World pixels per terrain painting cell (tonal variation granularity). */
export const TERRAIN_CELL = 32;

/** World pixels per paving slab, so slab seams read at a human scale. */
export const PAVING_SLAB = 96;

export interface IsoPoint {
  x: number;
  y: number;
}

/**
 * Projects a world-space point onto iso screen space.
 *
 * The returned x is signed: the world's south-west corner projects to a
 * negative x. Callers that need a non-negative canvas add `ISO_ORIGIN_X`.
 */
export function worldToIso(worldX: number, worldY: number): IsoPoint {
  return {
    x: (worldX - worldY) * ISO_SCALE_X,
    y: (worldX + worldY) * ISO_SCALE_Y,
  };
}

/** Inverse of {@link worldToIso}. Used for pointer picking and tap-to-walk. */
export function isoToWorld(isoX: number, isoY: number): IsoPoint {
  const halfSum = isoY / ISO_SCALE_Y;
  const halfDiff = isoX / ISO_SCALE_X;
  return {
    x: (halfSum + halfDiff) / 2,
    y: (halfSum - halfDiff) / 2,
  };
}

/**
 * Painter's-algorithm depth for an isometric world.
 *
 * Top-down sorts by y alone; isometric must sort by (x + y), which is exactly
 * the projected screen y scaled up. Ten depth units per world pixel leaves
 * layers 0-9 as intra-cell tie-breakers, matching the existing `depthFor()`
 * convention in `campaignScene.ts` so layer numbers carry over unchanged.
 */
export function isoDepth(worldX: number, worldY: number, layer = 0): number {
  return (worldX + worldY) * 10 + layer;
}

/**
 * Canvas an entire world projects onto.
 *
 * A world's south-west corner projects to negative x, so the caller needs an
 * origin shift to keep everything on a non-negative canvas. For the shipped
 * 2560x1600 estate this yields a 2080x1040 canvas with `originX = 800`.
 */
export function isoCanvasForWorld(
  worldWidth: number,
  worldHeight: number,
): { originX: number; width: number; height: number } {
  const originX = worldHeight * ISO_SCALE_X;
  return {
    originX,
    width: (worldWidth + worldHeight) * ISO_SCALE_X,
    height: (worldWidth + worldHeight) * ISO_SCALE_Y,
  };
}

/**
 * Iso-space bounding box for an axis-aligned world rectangle.
 *
 * All four corners must be projected — a world rectangle becomes a diamond, so
 * its extents are not derivable from two opposite corners alone.
 */
export function isoBoundsForWorldRect(
  worldX: number,
  worldY: number,
  width: number,
  height: number,
): { left: number; top: number; right: number; bottom: number } {
  const corners = [
    worldToIso(worldX, worldY),
    worldToIso(worldX + width, worldY),
    worldToIso(worldX + width, worldY + height),
    worldToIso(worldX, worldY + height),
  ];
  const xs = corners.map((point) => point.x);
  const ys = corners.map((point) => point.y);
  return {
    left: Math.min(...xs),
    top: Math.min(...ys),
    right: Math.max(...xs),
    bottom: Math.max(...ys),
  };
}

/**
 * The four projected corners of one world-space cell, in draw order.
 * Returned flat (x0,y0,x1,y1,...) because Phaser's `fillPoints` takes points
 * and we want to avoid allocating objects per cell in a 3,000-cell loop.
 */
export function isoCellCorners(
  worldX: number,
  worldY: number,
  size: number,
  out: number[] = [],
): number[] {
  const top = worldToIso(worldX, worldY);
  const right = worldToIso(worldX + size, worldY);
  const bottom = worldToIso(worldX + size, worldY + size);
  const left = worldToIso(worldX, worldY + size);
  out.length = 0;
  out.push(top.x, top.y, right.x, right.y, bottom.x, bottom.y, left.x, left.y);
  return out;
}

/**
 * Sun direction, in world space, shared by every cast shadow so the whole
 * estate is lit consistently. The reference art is lit from the upper-left,
 * throwing shadows down and to the right.
 */
export const SUN_OFFSET_WORLD = { x: 26, y: 18 } as const;

/** Deterministic value noise. Same generator as the existing terrain painter. */
export function isoHash(x: number, y: number): number {
  let value =
    Math.imul(x + 0x6d2b79f5, 0x1b873593) ^ Math.imul(y + 97, 0x85ebca6b);
  value ^= value >>> 13;
  return Math.imul(value, 0xc2b2ae35) >>> 0;
}
