import Phaser from "phaser";

import {
  ESTATE_BUILDINGS,
  PEDESTRIAN_STREETS,
  SIDEWALK_APRONS,
  type BuildingDefinition,
  type EstateRect,
  type PedestrianStreetDefinition,
  type ShelterDefinition,
} from "./estateLayout.js";
import { darkenColour, lightenColour, PALETTE } from "./campaignArt.js";

const TILE_SIZE = 32;

function hash(x: number, y: number): number {
  let value = Math.imul(x + 0x6d2b79f5, 0x1b873593) ^ Math.imul(y + 97, 0x85ebca6b);
  value ^= value >>> 13;
  return Math.imul(value, 0xc2b2ae35) >>> 0;
}

/**
 * Smooth low-frequency noise in [0,1], keyed on world position.
 *
 * The ground was built from three slab tones separated by 3-5% lightness and a
 * single flat green, which reads as a printed grid rather than a place. Grain
 * could not fix that: per-pixel jitter adds texture, not structure. This gives
 * the painters large soft regions to vary against - worn patches, damp corners,
 * sun-bleached stretches - which is what actually makes ground look crafted.
 *
 * Keyed on world coordinates, not tile-local ones, so patches run continuously
 * across the seams of the four baked 1280x800 textures.
 */
function macroField(worldX: number, worldY: number, cell: number): number {
  const gridX = Math.floor(worldX / cell);
  const gridY = Math.floor(worldY / cell);
  const fracX = worldX / cell - gridX;
  const fracY = worldY / cell - gridY;
  // Smoothstep, so cells blend instead of banding at their borders.
  const ease = (t: number): number => t * t * (3 - 2 * t);
  const easedX = ease(fracX);
  const easedY = ease(fracY);
  const corner = (x: number, y: number): number => (hash(x, y) % 4096) / 4096;
  const top = corner(gridX, gridY) * (1 - easedX)
    + corner(gridX + 1, gridY) * easedX;
  const bottom = corner(gridX, gridY + 1) * (1 - easedX)
    + corner(gridX + 1, gridY + 1) * easedX;
  return top * (1 - easedY) + bottom * easedY;
}

/** Picks a tone band from a field value, dithered so bands never show a seam. */
function tonalStep(field: number, jitter: number, steps: number): number {
  const dithered = field + (jitter / 4096 - 0.5) * (0.9 / steps);
  return Math.max(0, Math.min(steps - 1, Math.floor(dithered * steps)));
}

function intersect(
  rectangle: EstateRect,
  originX: number,
  originY: number,
  width: number,
  height: number,
): Omit<EstateRect, "id"> | null {
  const left = Math.max(rectangle.x, originX);
  const top = Math.max(rectangle.y, originY);
  const right = Math.min(rectangle.x + rectangle.width, originX + width);
  const bottom = Math.min(rectangle.y + rectangle.height, originY + height);
  if (right <= left || bottom <= top) return null;
  return { x: left - originX, y: top - originY, width: right - left, height: bottom - top };
}

function paintStreet(
  graphics: Phaser.GameObjects.Graphics,
  street: PedestrianStreetDefinition,
  local: Omit<EstateRect, "id">,
  originX: number,
  originY: number,
): void {
  const isHorizontal = street.axis === "horizontal" || street.axis === "plaza";
  const base = street.surface === "diagonal-cobbles" ? PALETTE.concrete : PALETTE.sand;
  const tileWidth = street.surface === "diagonal-cobbles" ? 44 : 52;
  const tileHeight = street.surface === "diagonal-cobbles" ? 32 : 40;
  graphics
    .fillStyle(PALETTE.night, 0.2)
    .fillRect(local.x + 8, local.y + 10, local.width, local.height)
    .fillStyle(darkenColour(PALETTE.concreteEdge, 0.12))
    .fillRect(local.x, local.y, local.width, local.height)
    .fillStyle(lightenColour(PALETTE.concreteEdge, 0.24))
    .fillRect(local.x, local.y, isHorizontal ? local.width : 6, isHorizontal ? 6 : local.height)
    .fillStyle(PALETTE.concreteEdge)
    .fillRect(local.x + 6, local.y + 6, Math.max(0, local.width - 12), Math.max(0, local.height - 12))
    .fillStyle(base)
    .fillRect(local.x + 11, local.y + 11, Math.max(0, local.width - 22), Math.max(0, local.height - 22));

  const left = local.x + 11;
  const top = local.y + 11;
  const right = local.x + local.width - 11;
  const bottom = local.y + local.height - 11;
  const worldLeft = originX + left;
  const worldTop = originY + top;
  const firstRow = Math.floor(worldTop / tileHeight) - 1;
  const lastRow = Math.ceil((originY + bottom) / tileHeight) + 1;
  for (let row = firstRow; row <= lastRow; row += 1) {
    const worldY = row * tileHeight;
    const y = worldY - originY;
    const stagger = row % 2 === 0 ? 0 : Math.floor(tileWidth / 2);
    const firstColumn = Math.floor((worldLeft - stagger) / tileWidth) - 1;
    const lastColumn = Math.ceil((originX + right - stagger) / tileWidth) + 1;
    for (let column = firstColumn; column <= lastColumn; column += 1) {
      const worldX = column * tileWidth + stagger;
      const x = worldX - originX;
      const seed = hash(column + (street.id.length * 7), row);
      // Slab tone follows a broad wear field, not just a per-slab coin flip:
      // three tones separated by 3-5% read as a printed grid, which is what
      // the plaza looked like. Six tones over a macro field give the surface
      // sun-bleached runs and damp corners that span many slabs.
      const wear = macroField(worldX, worldY, 336) * 0.7
        + macroField(worldX + 613, worldY + 401, 112) * 0.3;
      const SLAB_SHIFTS = [-0.085, -0.05, -0.022, 0.012, 0.045, 0.08] as const;
      const shift = SLAB_SHIFTS[tonalStep(wear, seed % 4096, SLAB_SHIFTS.length)] ?? 0;
      const tileBase = shift < 0
        ? darkenColour(base, -shift)
        : lightenColour(base, shift);
      const clippedLeft = Math.max(left, x + 1);
      const clippedTop = Math.max(top, y + 1);
      const clippedRight = Math.min(right, x + tileWidth - 2);
      const clippedBottom = Math.min(bottom, y + tileHeight - 2);
      if (clippedRight <= clippedLeft || clippedBottom <= clippedTop) continue;
      graphics
        .fillStyle(tileBase)
        .fillRect(clippedLeft, clippedTop, clippedRight - clippedLeft, clippedBottom - clippedTop)
        .fillStyle(lightenColour(tileBase, 0.1), 0.56)
        .fillRect(clippedLeft + 2, clippedTop + 2, Math.max(0, clippedRight - clippedLeft - 5), 2)
        .fillStyle(darkenColour(tileBase, 0.1), 0.52)
        .fillRect(clippedRight - 2, clippedTop + 3, 2, Math.max(0, clippedBottom - clippedTop - 5))
        .fillRect(clippedLeft + 3, clippedBottom - 2, Math.max(0, clippedRight - clippedLeft - 5), 2);
      if (seed % 9 === 2 && clippedRight - clippedLeft > 18 && clippedBottom - clippedTop > 14) {
        graphics
          .fillStyle(darkenColour(tileBase, 0.17), 0.28)
          .fillRect(clippedLeft + 7 + seed % 9, clippedTop + 8 + (seed >>> 5) % 7, 8, 3);
      }

      // Surface wear. Slabs that are all identical read as wallpaper; a
      // minority carrying a crack, a chipped corner, a stain or aggregate
      // speckle is what makes paving look laid rather than printed.
      const wide = clippedRight - clippedLeft;
      const tall = clippedBottom - clippedTop;
      if (wide > 20 && tall > 16) {
        const crackShade = darkenColour(tileBase, 0.2);
        if (seed % 11 === 4) {
          // Hairline crack: a short stepped run, never a straight ruled line.
          let crackX = clippedLeft + 5 + seed % Math.max(1, wide - 14);
          let crackY = clippedTop + 3;
          graphics.fillStyle(crackShade, 0.5);
          for (let step = 0; step < 5 && crackY < clippedBottom - 3; step += 1) {
            graphics.fillRect(crackX, crackY, 1, 3);
            crackX += ((seed >>> (step * 3)) % 3) - 1;
            crackX = Math.max(clippedLeft + 2, Math.min(clippedRight - 3, crackX));
            crackY += 3;
          }
        }
        if (seed % 17 === 7) {
          // Chipped corner, exposing the paler bed underneath.
          graphics
            .fillStyle(darkenColour(tileBase, 0.13), 0.55)
            .fillRect(clippedRight - 5, clippedBottom - 4, 4, 3)
            .fillStyle(lightenColour(tileBase, 0.14), 0.42)
            .fillRect(clippedRight - 4, clippedBottom - 3, 2, 1);
        }
        if (seed % 13 === 6) {
          // Soft stain, larger and fainter than the existing scuff.
          graphics
            .fillStyle(darkenColour(tileBase, 0.11), 0.3)
            .fillRect(clippedLeft + 3 + seed % 7, clippedTop + 4 + (seed >>> 7) % 6, 11, 6)
            .fillStyle(darkenColour(tileBase, 0.15), 0.22)
            .fillRect(clippedLeft + 5 + seed % 7, clippedTop + 6 + (seed >>> 7) % 6, 6, 3);
        }
        // Aggregate speckle: three flecks per slab, deterministic from seed.
        graphics.fillStyle(darkenColour(tileBase, 0.14), 0.34);
        for (let fleck = 0; fleck < 3; fleck += 1) {
          const flake = hash(column * 31 + fleck, row * 17 + fleck);
          graphics.fillRect(
            clippedLeft + 3 + flake % Math.max(1, wide - 6),
            clippedTop + 3 + (flake >>> 8) % Math.max(1, tall - 6),
            1,
            1,
          );
        }
      }
    }
  }

  if (isHorizontal) {
    const localWorldLeft = originX + local.x;
    for (let x = local.x + (96 - localWorldLeft % 160 + 160) % 160; x < local.x + local.width; x += 160) {
      graphics
        .fillStyle(PALETTE.ink)
        .fillRect(x, local.y + local.height - 15, 42, 9)
        .fillStyle(lightenColour(PALETTE.concreteEdge, 0.12))
        .fillRect(x + 4, local.y + local.height - 12, 34, 2);
      for (let slat = 0; slat < 6; slat += 1) {
        graphics.fillStyle(PALETTE.night).fillRect(x + 5 + slat * 6, local.y + local.height - 13, 2, 5);
      }
    }
  } else {
    const localWorldTop = originY + local.y;
    for (let y = local.y + (82 - localWorldTop % 160 + 160) % 160; y < local.y + local.height; y += 160) {
      graphics
        .fillStyle(PALETTE.ink)
        .fillRect(local.x + local.width - 15, y, 9, 42)
        .fillStyle(lightenColour(PALETTE.concreteEdge, 0.12))
        .fillRect(local.x + local.width - 12, y + 4, 2, 34);
      for (let slat = 0; slat < 6; slat += 1) {
        graphics.fillStyle(PALETTE.night).fillRect(local.x + local.width - 13, y + 5 + slat * 6, 5, 2);
      }
    }
  }
}

export function paintThreeQuarterTerrain(
  graphics: Phaser.GameObjects.Graphics,
  originX: number,
  originY: number,
  width = 1280,
  height = 800,
): void {
  const lightGrass = lightenColour(PALETTE.grass, 0.12);
  const darkGrass = darkenColour(PALETTE.grass, 0.12);
  graphics.fillStyle(PALETTE.grass).fillRect(0, 0, width, height);

  // Macro pass: mottle the turf into soft patches before any blade detail.
  // Sub-cells are 16px so the bands read as organic variation rather than as
  // the 32px gameplay grid, and the per-pixel grain pass softens them further.
  const TURF_TONES = [
    darkenColour(PALETTE.grass, 0.17),
    darkenColour(PALETTE.grass, 0.1),
    darkenColour(PALETTE.grass, 0.04),
    PALETTE.grass,
    lightenColour(PALETTE.grass, 0.05),
    lightenColour(PALETTE.grass, 0.11),
    lightenColour(PALETTE.grass, 0.17),
  ] as const;
  const MOSS = darkenColour(PALETTE.grassDark, 0.06);
  const EARTH = 0xa88a5f;
  const PATCH = 16;
  for (let y = 0; y < height; y += PATCH) {
    for (let x = 0; x < width; x += PATCH) {
      const worldX = originX + x;
      const worldY = originY + y;
      const jitter = hash(worldX, worldY) % 4096;
      // Two scales: broad meadow banding, plus finer clumping on top.
      const meadow = macroField(worldX, worldY, 288) * 0.68
        + macroField(worldX + 911, worldY + 137, 96) * 0.32;
      graphics
        .fillStyle(TURF_TONES[tonalStep(meadow, jitter, TURF_TONES.length)] ?? PALETTE.grass)
        .fillRect(x, y, PATCH, PATCH);

      // Damp shaded hollows and trodden bare earth, both rare and clustered.
      const damp = macroField(worldX + 4231, worldY + 2087, 176);
      if (damp > 0.86) {
        graphics.fillStyle(MOSS, 0.5).fillRect(x, y, PATCH, PATCH);
      } else if (damp < 0.1) {
        graphics
          .fillStyle(EARTH, 0.34)
          .fillRect(x, y, PATCH, PATCH)
          .fillStyle(darkenColour(EARTH, 0.16), 0.3)
          .fillRect(x + 3 + jitter % 6, y + 4 + (jitter >>> 4) % 6, 4, 3);
      }
    }
  }

  for (let y = 0; y < height; y += TILE_SIZE) {
    for (let x = 0; x < width; x += TILE_SIZE) {
      const seed = hash(Math.floor((originX + x) / TILE_SIZE), Math.floor((originY + y) / TILE_SIZE));
      graphics
        .fillStyle(seed % 3 === 0 ? lightGrass : darkGrass, 0.34)
        .fillRect(x + 3 + seed % 14, y + 5 + (seed >>> 6) % 13, 8 + (seed >>> 11) % 10, 4)
        .fillRect(x + 8 + (seed >>> 3) % 12, y + 21 + (seed >>> 9) % 7, 6 + (seed >>> 14) % 7, 3)
        .fillStyle(seed % 2 === 0 ? PALETTE.grassDark : lightGrass, 0.66)
        .fillRect(x + 5 + (seed >>> 17) % 19, y + 8 + (seed >>> 22) % 14, 2, 7)
        .fillRect(x + 8 + (seed >>> 17) % 19, y + 11 + (seed >>> 22) % 14, 2, 4);
      if (seed % 7 === 2) {
        graphics
          .fillStyle(seed % 2 === 0 ? PALETTE.gold : PALETTE.coral, 0.78)
          .fillRect(x + 10 + (seed >>> 17) % 14, y + 11 + (seed >>> 22) % 12, 4, 3)
          .fillStyle(PALETTE.cream, 0.76)
          .fillRect(x + 11 + (seed >>> 17) % 14, y + 10 + (seed >>> 22) % 12, 2, 2);
      }
      if (seed % 13 === 5) {
        graphics
          .fillStyle(darkenColour(PALETTE.grass, 0.18), 0.26)
          .fillRect(x + 4, y + 24, 13, 3)
          .fillRect(x + 11, y + 21, 8, 3);
      }
    }
  }
  for (const street of PEDESTRIAN_STREETS) {
    const local = intersect(street, originX, originY, width, height);
    if (local) paintStreet(graphics, street, local, originX, originY);
  }
  for (const apron of SIDEWALK_APRONS) {
    const local = intersect(apron, originX, originY, width, height);
    if (!local) continue;
    paintStreet(
      graphics,
      { ...apron, axis: "plaza" },
      local,
      originX,
      originY,
    );
  }

  for (const definition of ESTATE_BUILDINGS) {
    if (!definition.entranceDoorId) continue;
    const anchorX = definition.minimapAnchor.x - originX;
    const thresholdY = definition.bounds.y + definition.bounds.height - originY;
    if (anchorX < -80 || anchorX > width + 80 || thresholdY < -20 || thresholdY > height + 90) continue;
    graphics
      .fillStyle(PALETTE.concreteEdge)
      .fillPoints([
        new Phaser.Geom.Point(anchorX - 56, thresholdY),
        new Phaser.Geom.Point(anchorX + 56, thresholdY),
        new Phaser.Geom.Point(anchorX + 76, thresholdY + 58),
        new Phaser.Geom.Point(anchorX - 76, thresholdY + 58),
      ], true)
      .lineStyle(2, lightenColour(PALETTE.concreteEdge, 0.16), 0.85)
      .strokeLineShape(new Phaser.Geom.Line(anchorX - 56, thresholdY + 5, anchorX + 56, thresholdY + 5));
  }
}

const ACCENTS: Readonly<Record<BuildingDefinition["accent"], number>> = {
  coral: PALETTE.coral,
  gold: PALETTE.gold,
  green: PALETTE.green,
  purple: PALETTE.purple,
  teal: PALETTE.teal,
};

export function ensureBuildingTexture(
  scene: Phaser.Scene,
  definition: BuildingDefinition,
): string {
  const key = `building-view:${definition.id}`;
  if (scene.textures.exists(key)) return key;
  const { width, height } = definition.bounds;
  const graphics = scene.make.graphics({ x: 0, y: 0 });
  const accent = ACCENTS[definition.accent];
  const roofFront = definition.roofDepth;
  const right = width - 1;
  const wallTop = roofFront - 2;
  const wallBottom = height - 12;
  graphics
    .fillStyle(PALETTE.night, 0.24)
    .fillPoints([
      new Phaser.Geom.Point(18, height - 20),
      new Phaser.Geom.Point(right - 3, height - 20),
      new Phaser.Geom.Point(right, height - 5),
      new Phaser.Geom.Point(36, height - 5),
    ], true)
    .fillStyle(PALETTE.ink)
    .fillRect(3, wallTop, width - 6, wallBottom - wallTop)
    .fillStyle(PALETTE.cream)
    .fillRect(9, wallTop + 6, width - 18, wallBottom - wallTop - 10)
    .fillStyle(darkenColour(PALETTE.cream, 0.14))
    .fillPoints([
      new Phaser.Geom.Point(right - definition.sideFaceWidth, wallTop + 6),
      new Phaser.Geom.Point(right - 9, wallTop + 1),
      new Phaser.Geom.Point(right - 9, wallBottom - 4),
      new Phaser.Geom.Point(right - definition.sideFaceWidth, wallBottom - 12),
    ], true);

  if (definition.roofStyle === "sawtooth") {
    const segmentWidth = width / definition.roofSegments;
    for (let index = 0; index < definition.roofSegments; index += 1) {
      const left = index * segmentWidth;
      const ridge = left + segmentWidth / 2;
      const segmentRight = left + segmentWidth;
      graphics
        .fillStyle(PALETTE.ink)
        .fillTriangle(left, roofFront + 4, ridge, 0, segmentRight, roofFront + 4)
        .fillStyle(accent)
        .fillTriangle(left + 8, roofFront - 2, ridge, 8, segmentRight - 8, roofFront - 2)
        .fillStyle(lightenColour(accent, 0.22), 0.72)
        .fillTriangle(left + 10, roofFront - 4, ridge, 8, ridge - 5, 17);
    }
  } else {
    graphics
      .fillStyle(PALETTE.ink)
      .fillPoints([
        new Phaser.Geom.Point(0, roofFront + 5),
        new Phaser.Geom.Point(definition.roofInset, 1),
        new Phaser.Geom.Point(width - definition.roofInset, 1),
        new Phaser.Geom.Point(width, roofFront + 5),
      ], true)
      .fillStyle(accent)
      .fillPoints([
        new Phaser.Geom.Point(8, roofFront - 1),
        new Phaser.Geom.Point(definition.roofInset + 4, 8),
        new Phaser.Geom.Point(width - definition.roofInset - 4, 8),
        new Phaser.Geom.Point(width - 8, roofFront - 1),
      ], true)
      .fillStyle(lightenColour(accent, 0.24), 0.82)
      .fillPoints([
        new Phaser.Geom.Point(11, roofFront - 4),
        new Phaser.Geom.Point(definition.roofInset + 5, 9),
        new Phaser.Geom.Point(width / 2, 9),
        new Phaser.Geom.Point(width / 2 - 17, 15),
      ], true)
      .fillStyle(darkenColour(accent, 0.23), 0.82)
      .fillPoints([
        new Phaser.Geom.Point(width / 2, 9),
        new Phaser.Geom.Point(width - definition.roofInset - 4, 9),
        new Phaser.Geom.Point(width - 9, roofFront - 3),
        new Phaser.Geom.Point(width - 26, roofFront - 3),
      ], true);
  }

  const available = Math.max(1, width - definition.sideFaceWidth - 38);
  const usableRight = width - definition.sideFaceWidth - 10;
  const isCommercial = ["hawker-centre", "kopitiam", "provision-shop"].includes(definition.id);
  const windowColumns = Math.max(2, Math.floor(available / (isCommercial ? 112 : 86)));
  const windowGap = available / windowColumns;

  graphics
    .fillStyle(PALETTE.night, 0.13)
    .fillRect(10, wallTop + 27, Math.max(0, usableRight - 10), 10)
    .fillStyle(PALETTE.sand)
    .fillRect(10, wallBottom - 57, Math.max(0, usableRight - 10), 49)
    .fillStyle(lightenColour(PALETTE.sand, 0.13))
    .fillRect(10, wallBottom - 57, Math.max(0, usableRight - 10), 4);
  for (let x = 20; x < usableRight; x += 44) {
    graphics
      .fillStyle(darkenColour(PALETTE.sand, 0.08), 0.48)
      .fillRect(x, wallBottom - 53, 2, 43);
  }
  graphics
    .fillStyle(darkenColour(PALETTE.sand, 0.08), 0.5)
    .fillRect(10, wallBottom - 33, Math.max(0, usableRight - 10), 2);

  if (isCommercial) {
    const frontageTop = wallTop + 43;
    const frontageHeight = Math.max(48, wallBottom - frontageTop - 48);
    graphics
      .fillStyle(PALETTE.ink)
      .fillRect(15, frontageTop, Math.max(0, usableRight - 20), frontageHeight)
      .fillStyle(PALETTE.night)
      .fillRect(21, frontageTop + 6, Math.max(0, usableRight - 32), frontageHeight - 12)
      .fillStyle(accent)
      .fillRect(13, frontageTop - 10, Math.max(0, usableRight - 16), 13)
      .fillStyle(lightenColour(accent, 0.22))
      .fillRect(17, frontageTop - 7, Math.max(0, usableRight - 24), 3);

    for (let column = 0; column < windowColumns; column += 1) {
      const bayLeft = 25 + column * windowGap;
      const bayWidth = Math.max(44, Math.min(92, windowGap - 14));
      const shelfTop = frontageTop + 15 + (column % 2) * 4;
      graphics
        .fillStyle(darkenColour(PALETTE.teal, 0.16))
        .fillRect(bayLeft, shelfTop, bayWidth, 7)
        .fillRect(bayLeft, shelfTop + 23, bayWidth, 7)
        .fillStyle(0x9b714b)
        .fillRect(bayLeft + 4, shelfTop + 4, bayWidth - 8, 3);
      const goods = [PALETTE.coral, PALETTE.gold, PALETTE.green, PALETTE.cream] as const;
      for (let item = 0; item < Math.max(3, Math.floor(bayWidth / 17)); item += 1) {
        const colour = goods[(column + item) % goods.length];
        graphics
          .fillStyle(PALETTE.ink)
          .fillRect(bayLeft + 5 + item * 15, shelfTop - 7, 10, 9)
          .fillStyle(colour)
          .fillRect(bayLeft + 7 + item * 15, shelfTop - 5, 6, 6)
          .fillStyle(darkenColour(colour, 0.12))
          .fillRect(bayLeft + 7 + item * 15, shelfTop + 16, 7, 5);
      }
    }
    graphics
      .fillStyle(PALETTE.ink)
      .fillRect(24, wallBottom - 72, Math.max(0, usableRight - 31), 13)
      .fillStyle(0x9b714b)
      .fillRect(29, wallBottom - 68, Math.max(0, usableRight - 41), 6);
  } else {
    const windowTop = wallTop + 45;
    const windowBottom = wallBottom - 73;
    for (let column = 0; column < windowColumns; column += 1) {
      const x = 20 + column * windowGap;
      if (definition.entranceDoorId && Math.abs(x + 29 - (definition.minimapAnchor.x - definition.bounds.x)) < 65) continue;
      const windowWidth = Math.min(57, windowGap - 13);
      const windowHeight = Math.max(38, windowBottom - windowTop);
      graphics
        .fillStyle(PALETTE.ink)
        .fillRect(x, windowTop, windowWidth, windowHeight)
        .fillStyle(0x5e8c98)
        .fillRect(x + 5, windowTop + 5, windowWidth - 10, windowHeight - 10)
        .fillStyle(0xa9c8c5)
        .fillRect(x + 9, windowTop + 8, Math.max(8, Math.floor((windowWidth - 15) / 2)), windowHeight - 17)
        .fillStyle(PALETTE.ink)
        .fillRect(x - 4, windowTop - 9, windowWidth + 8, 9)
        .fillStyle(accent)
        .fillRect(x, windowTop - 6, windowWidth, 3)
        .fillStyle(PALETTE.ink)
        .fillRect(x - 3, windowTop + windowHeight, windowWidth + 6, 6)
        .fillStyle(PALETTE.concreteEdge)
        .fillRect(x + 2, windowTop + windowHeight, windowWidth - 4, 3);
      if (column % 3 === 1) {
        graphics
          .fillStyle(PALETTE.ink)
          .fillRect(x + windowWidth - 12, windowTop + windowHeight + 5, 20, 12)
          .fillStyle(PALETTE.coral)
          .fillRect(x + windowWidth - 9, windowTop + windowHeight + 7, 14, 7)
          .fillStyle(PALETTE.green)
          .fillRect(x + windowWidth - 3, windowTop + windowHeight - 5, 3, 12)
          .fillRect(x + windowWidth - 8, windowTop + windowHeight - 1, 13, 3);
      }
    }
  }

  for (let column = 1; column < windowColumns; column += 1) {
    const x = Math.round(18 + column * windowGap);
    graphics
      .fillStyle(PALETTE.ink)
      .fillRect(x, wallTop + 30, 8, wallBottom - wallTop - 38)
      .fillStyle(darkenColour(PALETTE.cream, 0.08))
      .fillRect(x + 3, wallTop + 34, 3, wallBottom - wallTop - 46);
  }

  if (definition.entranceDoorId) {
    const centre = definition.minimapAnchor.x - definition.bounds.x;
    const openingWidth = definition.id === "hawker-centre" ? 104 : 90;
    const openingHeight = Math.min(104, height - wallTop - 20);
    graphics
      .fillStyle(PALETTE.ink)
      .fillRect(centre - openingWidth / 2 - 5, height - openingHeight - 7, openingWidth + 10, openingHeight + 7)
      .fillStyle(PALETTE.night)
      .fillRect(centre - openingWidth / 2, height - openingHeight - 2, openingWidth, openingHeight + 2)
      .fillStyle(accent, 0.42)
      .fillRect(centre - openingWidth / 2 + 7, height - openingHeight + 5, 7, openingHeight - 12);
  }

  graphics
    .fillStyle(accent)
    .fillRect(12, wallTop + 12, width - definition.sideFaceWidth - 24, 13)
    .fillStyle(lightenColour(accent, 0.22))
    .fillRect(12, wallTop + 12, width - definition.sideFaceWidth - 24, 3)
    .fillStyle(PALETTE.ink)
    .fillRect(8, wallBottom - 8, width - 16, 8);
  graphics.generateTexture(key, width, height);
  graphics.destroy();
  return key;
}

export function ensureShelterTexture(
  scene: Phaser.Scene,
  definition: ShelterDefinition,
): string {
  const key = `shelter-view:${definition.id}`;
  if (scene.textures.exists(key)) return key;
  const { width, height } = definition.bounds;
  const graphics = scene.make.graphics({ x: 0, y: 0 });
  const restPoint = definition.variant === "rest-point";
  const roofDepth = restPoint ? 34 : 42;
  graphics
    .fillStyle(PALETTE.night, 0.18)
    .fillPoints([
      new Phaser.Geom.Point(16, roofDepth + 11),
      new Phaser.Geom.Point(width - 2, roofDepth + 11),
      new Phaser.Geom.Point(width, height - 2),
      new Phaser.Geom.Point(44, height - 2),
    ], true)
    .fillStyle(PALETTE.ink)
    .fillPoints([
      new Phaser.Geom.Point(0, roofDepth),
      new Phaser.Geom.Point(30, 0),
      new Phaser.Geom.Point(width - 24, 0),
      new Phaser.Geom.Point(width, roofDepth),
    ], true)
    .fillStyle(restPoint ? PALETTE.gold : PALETTE.teal)
    .fillPoints([
      new Phaser.Geom.Point(8, roofDepth - 6),
      new Phaser.Geom.Point(33, 7),
      new Phaser.Geom.Point(width - 28, 7),
      new Phaser.Geom.Point(width - 8, roofDepth - 6),
    ], true)
    .fillStyle(restPoint ? lightenColour(PALETTE.gold, 0.2) : lightenColour(PALETTE.teal, 0.22), 0.8)
    .fillPoints([
      new Phaser.Geom.Point(11, roofDepth - 9),
      new Phaser.Geom.Point(35, 8),
      new Phaser.Geom.Point(width / 2, 8),
      new Phaser.Geom.Point(width / 2 - 18, 15),
    ], true);
  for (const post of definition.posts) {
    const x = post.x - definition.bounds.x;
    const y = post.y - definition.bounds.y;
    graphics
      .fillStyle(PALETTE.ink)
      .fillRect(x - 2, roofDepth - 2, post.width + 4, Math.max(post.height, y - roofDepth + post.height))
      .fillStyle(PALETTE.concrete)
      .fillRect(x + 2, roofDepth + 2, Math.max(4, post.width - 4), Math.max(post.height, y - roofDepth + post.height - 4));
  }
  if (restPoint) {
    graphics
      .fillStyle(PALETTE.night, 0.17)
      .fillEllipse(width / 2 + 5, height - 16, width - 70, 22)
      .fillStyle(PALETTE.ink)
      .fillRect(42, height - 58, width - 84, 17)
      .fillRect(53, height - 41, 9, 28)
      .fillRect(width - 62, height - 41, 9, 28)
      .fillStyle(0x9b714b)
      .fillRect(47, height - 54, width - 94, 8);
  }
  graphics.generateTexture(key, width, height);
  graphics.destroy();
  return key;
}
