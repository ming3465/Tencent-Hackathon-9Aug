/**
 * Isometric ground plane.
 *
 * The shipped top-down painter (`threeQuarterArt.ts:paintThreeQuarterTerrain`)
 * fills axis-aligned rectangles from a four-colour ramp. Measured against the
 * reference art that produces a dominant colour covering 5.6% of the screen,
 * where the reference's most common colour covers 0.63%. Flat fills are the
 * single biggest reason the shipped build does not read like the target.
 *
 * This painter therefore does three things differently:
 *
 *  1. Draws 2:1 diamonds instead of rectangles.
 *  2. Derives every cell's colour from a *continuous* two-octave value-noise
 *     field rather than picking from a small palette, so adjacent cells differ
 *     by a step or two instead of being identical.
 *  3. Bakes contact shading — kerb ambient occlusion and a global sun gradient
 *     — into the ground itself, which is what gives the reference its depth.
 *
 * Everything here is baked once into a texture at boot, so the cost does not
 * touch the per-frame budget (8 ms/frame main thread, 20 ms at 4x throttle).
 */

import Phaser from "phaser";

import {
  PEDESTRIAN_STREETS,
  SIDEWALK_APRONS,
  type EstateRect,
} from "../estateLayout.js";
import { isoCellCorners, isoHash, TERRAIN_CELL, PAVING_SLAB } from "./projection.js";

/** Warm ochre paving, sampled from the reference art. */
export const ISO_PAVING = 0xd1a777;

/** Olive grass, sampled from the reference art. */
export const ISO_GRASS = 0x818d37;

/** Shadow colour for baked contact shading. */
const ISO_SHADOW = 0x2f2a1e;

type Surface = "grass" | "paving" | "apron";

function channels(colour: number): [number, number, number] {
  return [(colour >> 16) & 0xff, (colour >> 8) & 0xff, colour & 0xff];
}

function pack(r: number, g: number, b: number): number {
  const clamp = (value: number): number =>
    Math.max(0, Math.min(255, Math.round(value)));
  return (clamp(r) << 16) | (clamp(g) << 8) | clamp(b);
}

/**
 * Continuous lightness shift. Unlike `lightenColour`/`darkenColour`, which mix
 * toward two fixed palette anchors, this scales each channel independently so
 * a noise field maps onto a genuinely continuous ramp.
 */
function shade(colour: number, amount: number): number {
  const [r, g, b] = channels(colour);
  if (amount >= 0) {
    return pack(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
  }
  const factor = 1 + amount;
  return pack(r * factor, g * factor, b * factor);
}

/** Shifts hue slightly warm or cool without changing perceived lightness much. */
function temper(colour: number, warmth: number): number {
  const [r, g, b] = channels(colour);
  return pack(r + warmth * 14, g + warmth * 4, b - warmth * 12);
}

/** Value noise in [0,1) at a given world position and frequency. */
function noise(worldX: number, worldY: number, frequency: number): number {
  return (
    isoHash(Math.floor(worldX / frequency), Math.floor(worldY / frequency)) /
    0xffffffff
  );
}

/**
 * Two-octave field in [0,1). One coarse octave gives large sun/wear patches,
 * one fine octave gives per-cell grain. Summing them is what breaks up the
 * flat-fill look.
 */
function field(worldX: number, worldY: number): number {
  const coarse = noise(worldX, worldY, 320);
  const mid = noise(worldX, worldY, 96);
  const fine = noise(worldX, worldY, TERRAIN_CELL);
  return coarse * 0.5 + mid * 0.32 + fine * 0.18;
}

function pointInRect(x: number, y: number, rect: EstateRect): boolean {
  return (
    x >= rect.x &&
    x < rect.x + rect.width &&
    y >= rect.y &&
    y < rect.y + rect.height
  );
}

function surfaceAt(worldX: number, worldY: number): Surface {
  for (const apron of SIDEWALK_APRONS) {
    if (pointInRect(worldX, worldY, apron)) return "apron";
  }
  for (const street of PEDESTRIAN_STREETS) {
    if (pointInRect(worldX, worldY, street)) return "paving";
  }
  return "grass";
}

/**
 * Distance in world px to the nearest surface change, capped at `limit`.
 * Used to darken ground near kerbs, which reads as contact occlusion.
 */
function edgeProximity(
  worldX: number,
  worldY: number,
  surface: Surface,
  limit: number,
): number {
  for (let distance = TERRAIN_CELL; distance <= limit; distance += TERRAIN_CELL) {
    if (
      surfaceAt(worldX + distance, worldY) !== surface ||
      surfaceAt(worldX - distance, worldY) !== surface ||
      surfaceAt(worldX, worldY + distance) !== surface ||
      surfaceAt(worldX, worldY - distance) !== surface
    ) {
      return distance / limit;
    }
  }
  return 1;
}

export interface IsoTerrainOptions {
  /** World-space region to paint. */
  worldX: number;
  worldY: number;
  worldWidth: number;
  worldHeight: number;
  /** Added to every projected point so the canvas stays non-negative. */
  originX: number;
  originY: number;
}

/**
 * Paints the isometric ground plane for a world region.
 *
 * Draw order is back-to-front by (worldX + worldY) so overlapping kerb shading
 * composites correctly without needing depth sorting inside a single texture.
 */
export function paintIsoTerrain(
  graphics: Phaser.GameObjects.Graphics,
  options: IsoTerrainOptions,
): void {
  const { worldX, worldY, worldWidth, worldHeight, originX, originY } = options;
  const corners: number[] = [];
  const points: Phaser.Geom.Point[] = [
    new Phaser.Geom.Point(),
    new Phaser.Geom.Point(),
    new Phaser.Geom.Point(),
    new Phaser.Geom.Point(),
  ];

  const drawCell = (cellX: number, cellY: number, colour: number, alpha: number): void => {
    isoCellCorners(cellX, cellY, TERRAIN_CELL, corners);
    for (let index = 0; index < 4; index += 1) {
      points[index].setTo(
        corners[index * 2] + originX,
        corners[index * 2 + 1] + originY,
      );
    }
    graphics.fillStyle(colour, alpha).fillPoints(points, true);
  };

  /** Same diamond, drawn smaller, for sub-cell texture like blades and grit. */
  const drawSubCell = (
    cellX: number,
    cellY: number,
    size: number,
    colour: number,
    alpha: number,
  ): void => {
    isoCellCorners(cellX, cellY, size, corners);
    for (let index = 0; index < 4; index += 1) {
      points[index].setTo(
        corners[index * 2] + originX,
        corners[index * 2 + 1] + originY,
      );
    }
    graphics.fillStyle(colour, alpha).fillPoints(points, true);
  };

  const endX = worldX + worldWidth;
  const endY = worldY + worldHeight;

  for (let y = worldY; y < endY; y += TERRAIN_CELL) {
    for (let x = worldX; x < endX; x += TERRAIN_CELL) {
      const centreX = x + TERRAIN_CELL / 2;
      const centreY = y + TERRAIN_CELL / 2;
      const surface = surfaceAt(centreX, centreY);
      const seed = isoHash(x, y);
      const value = field(centreX, centreY);

      // Global sun gradient: the north-west of the estate catches more light.
      const sun = 1 - (centreX / (worldX + worldWidth) + centreY / (worldY + worldHeight)) * 0.5;
      const lit = (sun - 0.5) * 0.07;

      if (surface === "grass") {
        // Wide continuous ramp plus a hue shift, so lush and dry grass differ
        // in both lightness and warmth rather than being one flat green.
        const base = temper(ISO_GRASS, (value - 0.5) * 1.4);
        const colour = shade(base, (value - 0.5) * 0.44 + lit);
        drawCell(x, y, colour, 1);

        // Mown banding: broad sweeps of slightly different tone, the way real
        // turf reads. Low frequency so it does not fight the noise field.
        const band = Math.floor((centreX * 0.6 + centreY) / 150) % 2;
        drawCell(x, y, shade(colour, band === 0 ? 0.05 : -0.05), 0.5);

        // Blade clumps drawn at quarter-cell so they read as texture rather
        // than washing the whole cell toward one average.
        const clumps = 2 + (seed % 3);
        for (let clump = 0; clump < clumps; clump += 1) {
          const bladeSeed = isoHash(x + clump * 31, y + clump * 17);
          const offsetX = x + (bladeSeed % (TERRAIN_CELL - 8));
          const offsetY = y + ((bladeSeed >>> 8) % (TERRAIN_CELL - 8));
          const bladeTone = shade(
            temper(ISO_GRASS, ((bladeSeed >>> 20) % 10) / 10 - 0.5),
            (((bladeSeed >>> 16) % 100) / 100) * 0.42 - 0.16,
          );
          drawSubCell(offsetX, offsetY, TERRAIN_CELL / 2.4, bladeTone, 0.85);
        }
        // Occasional bloom fleck, matching the reference's scattered flowers.
        if (seed % 17 === 5) {
          const bloom = [0xe8c46a, 0xd97a58, 0xf2ead2, 0xc9a2cf][(seed >>> 5) % 4];
          drawSubCell(x + 8, y + 8, TERRAIN_CELL / 4, bloom, 0.75);
        }
      } else {
        const paveBase = surface === "apron" ? shade(ISO_PAVING, 0.06) : ISO_PAVING;
        const slabX = Math.floor(centreX / PAVING_SLAB);
        const slabY = Math.floor(centreY / PAVING_SLAB);
        const slabSeed = isoHash(slabX * 7, slabY * 13);
        // Per-slab tone, then per-cell grain inside it: two independent scales
        // means no two slabs match and no slab is internally flat.
        const slabTone = ((slabSeed % 100) / 100 - 0.5) * 0.10;
        const grain = (value - 0.5) * 0.09;
        const colour = shade(
          temper(paveBase, (slabSeed % 7) / 7 - 0.5),
          slabTone + grain + lit,
        );
        drawCell(x, y, colour, 1);

        // Aggregate speckle keeps large paved spans from banding. Drawn at
        // sub-cell size so it reads as grit rather than tinting the whole slab.
        if (seed % 3 === 1) {
          drawSubCell(x + 6, y + 6, TERRAIN_CELL / 2.6, shade(colour, 0.16), 0.6);
        }
        if (seed % 5 === 3) {
          drawSubCell(x + 15, y + 11, TERRAIN_CELL / 3.4, shade(colour, -0.2), 0.55);
        }
        if (seed % 13 === 7) {
          drawSubCell(x + 20, y + 4, TERRAIN_CELL / 5, shade(colour, -0.3), 0.5);
        }

        // Slab seams. Drawn as a thin darker diamond on the slab boundary cell.
        const onSeam =
          Math.floor(centreX / PAVING_SLAB) !==
            Math.floor((centreX - TERRAIN_CELL) / PAVING_SLAB) ||
          Math.floor(centreY / PAVING_SLAB) !==
            Math.floor((centreY - TERRAIN_CELL) / PAVING_SLAB);
        if (onSeam) {
          // A groove, not a filled cell. Slabs are 96px and cells 32px, so a
          // full-strength cell here darkened five of every nine cells and the
          // paving read as a chessboard rather than as slabs with joints.
          drawCell(x, y, shade(colour, -0.14), 0.22);
        }
      }

      // Kerb ambient occlusion: ground darkens as it approaches a surface
      // change. This is the cheap stand-in for real contact shadow and is a
      // large part of why the reference reads as three-dimensional.
      const proximity = edgeProximity(centreX, centreY, surface, TERRAIN_CELL * 3);
      if (proximity < 1) {
        drawCell(x, y, ISO_SHADOW, (1 - proximity) * 0.16);
      }
    }
  }
}
