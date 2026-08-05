import Phaser from "phaser";
import {
  RESIDENT_ART,
  type ResidentArtDefinition,
} from "./characterArt.js";
import type { LocationId } from "./campaignTypes.js";

export const PALETTE = {
  ink: 0x173f4f,
  night: 0x102e3b,
  cream: 0xfff6dc,
  paper: 0xfffbef,
  sand: 0xead9b7,
  coral: 0xd96756,
  gold: 0xf2b84b,
  teal: 0x287271,
  green: 0x5b8c5a,
  purple: 0x775b91,
  concrete: 0xe3d3b0,
  concreteEdge: 0xcbb894,
  grass: 0x94bc70,
  grassDark: 0x6f9653,
} as const;

export type PlayerFacing = "down" | "up" | "side";
export type WalkFrame = 0 | 1 | 2 | 3;

const WALK_FRAMES: readonly WalkFrame[] = [0, 1, 2, 3];

function mixColour(colour: number, target: number, amount: number): number {
  const channel = (shift: number): number => {
    const from = (colour >> shift) & 0xff;
    const to = (target >> shift) & 0xff;
    return Math.round(from + (to - from) * amount);
  };
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

export function lightenColour(colour: number, amount = 0.18): number {
  return mixColour(colour, PALETTE.cream, amount);
}

export function darkenColour(colour: number, amount = 0.22): number {
  return mixColour(colour, PALETTE.night, amount);
}

/**
 * Draws one consistent pixel-inspired structural block: contact shadow, outline,
 * body, upper-left light, and lower-right shade. Coordinates should be integers.
 */
export function drawPixelBlock(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: number,
  outlineWeight = 4,
  castShadow = true,
): void {
  if (castShadow) {
    graphics
      .fillStyle(PALETTE.night, 0.2)
      .fillRect(x + 7, y + 7, width, height);
  }
  graphics
    .fillStyle(PALETTE.ink)
    .fillRect(
      x - outlineWeight,
      y - outlineWeight,
      width + outlineWeight * 2,
      height + outlineWeight * 2,
    )
    .fillStyle(fill)
    .fillRect(x, y, width, height);
  const band = Math.max(3, outlineWeight);
  graphics
    .fillStyle(lightenColour(fill))
    .fillRect(x, y, width, band)
    .fillRect(x, y, band, height)
    .fillStyle(darkenColour(fill))
    .fillRect(x, y + height - band, width, band)
    .fillRect(x + width - band, y, band, height);
}

const ESTATE_TERRAIN_TILE_SIZE = 32;

function terrainHash(tileX: number, tileY: number): number {
  let hash =
    Math.imul(tileX, 0x1f123bb5) ^
    Math.imul(tileY, 0x5f356495);
  hash = Math.imul(hash ^ (hash >>> 15), 0x2c1b3c6d);
  return (hash ^ (hash >>> 12)) >>> 0;
}

function drawDrainGrate(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  vertical: boolean,
): void {
  const width = vertical ? 8 : 30;
  const height = vertical ? 30 : 8;
  graphics
    .fillStyle(PALETTE.ink)
    .fillRect(x, y, width, height)
    .fillStyle(darkenColour(PALETTE.concreteEdge, 0.24))
    .fillRect(x + 2, y + 2, width - 4, height - 4);
  const slatCount = 4;
  for (let slat = 0; slat < slatCount; slat += 1) {
    if (vertical) {
      graphics
        .fillStyle(PALETTE.ink)
        .fillRect(x + 2, y + 5 + slat * 6, width - 4, 2);
    } else {
      graphics
        .fillStyle(PALETTE.ink)
        .fillRect(x + 5 + slat * 6, y + 2, 2, height - 4);
    }
  }
}

/**
 * Paints the estate's entire static surface as a deterministic 32 px terrain
 * grammar. All detail is baked into four large textures once at scene creation,
 * so richer grass, pavers, kerbs, and drains add no per-frame draw work.
 */
export function paintEstateTerrain(
  graphics: Phaser.GameObjects.Graphics,
  originX: number,
  originY: number,
  width = 1280,
  height = 800,
): void {
  const grassLight = lightenColour(PALETTE.grass, 0.1);
  const grassShade = darkenColour(PALETTE.grass, 0.09);
  graphics.fillStyle(PALETTE.grass).fillRect(0, 0, width, height);

  for (let y = 0; y < height; y += ESTATE_TERRAIN_TILE_SIZE) {
    for (let x = 0; x < width; x += ESTATE_TERRAIN_TILE_SIZE) {
      const tileX = Math.floor((originX + x) / ESTATE_TERRAIN_TILE_SIZE);
      const tileY = Math.floor((originY + y) / ESTATE_TERRAIN_TILE_SIZE);
      const seed = terrainHash(tileX, tileY);
      const patchX = x + 4 + (seed % 15);
      const patchY = y + 5 + ((seed >>> 5) % 17);
      const patchColour = seed % 3 === 0 ? grassLight : grassShade;
      graphics
        .fillStyle(patchColour, 0.32)
        .fillRect(patchX, patchY, 10 + ((seed >>> 9) % 8), 4)
        .fillRect(patchX + 4, patchY + 4, 7, 3);

      if (seed % 4 !== 0) {
        const tuftX = x + 5 + ((seed >>> 12) % 21);
        const tuftY = y + 10 + ((seed >>> 17) % 13);
        graphics
          .fillStyle(seed % 2 === 0 ? PALETTE.grassDark : grassShade, 0.72)
          .fillRect(tuftX, tuftY, 2, 6)
          .fillRect(tuftX + 3, tuftY + 2, 2, 4)
          .fillStyle(grassLight, 0.58)
          .fillRect(tuftX + 1, tuftY + 1, 2, 2);
      }

      // Scatter wildflower pixels: ~1-in-8 tiles get a tiny 2-pixel bloom
      if (seed % 8 === 3) {
        const bloomX = x + 8 + ((seed >>> 20) % 20);
        const bloomY = y + 8 + ((seed >>> 24) % 16);
        const bloomColour =
          seed % 3 === 0
            ? PALETTE.coral     // red spider lily
            : seed % 3 === 1
              ? PALETTE.gold    // golden daisy
              : 0xd4b0e0;       // pale purple lantana
        graphics
          .fillStyle(bloomColour, 0.82)
          .fillRect(bloomX, bloomY, 3, 3)
          .fillStyle(0xfff6dc, 0.55)
          .fillRect(bloomX + 1, bloomY, 1, 1);
      }
    }
  }

  const horizontalTop = 326;
  const horizontalSurfaceTop = 336;
  const horizontalSurfaceHeight = 112;
  graphics
    .fillStyle(PALETTE.night, 0.2)
    .fillRect(0, horizontalTop + 7, width, 130)
    .fillStyle(PALETTE.concreteEdge)
    .fillRect(0, horizontalTop, width, 132)
    .fillStyle(lightenColour(PALETTE.concreteEdge, 0.18))
    .fillRect(0, horizontalTop, width, 4)
    .fillStyle(PALETTE.concrete)
    .fillRect(0, horizontalSurfaceTop, width, horizontalSurfaceHeight);

  const paverWidth = 64;
  const paverHeight = 56;
  for (let row = 0; row < 2; row += 1) {
    const y = horizontalSurfaceTop + row * paverHeight;
    const startX = row % 2 === 0 ? 0 : -paverWidth / 2;
    for (let x = startX; x < width; x += paverWidth) {
      const seed = terrainHash(
        Math.floor((originX + x) / paverWidth),
        Math.floor((originY + y) / paverHeight),
      );
      const fill =
        seed % 3 === 0
          ? lightenColour(PALETTE.concrete, 0.08)
          : seed % 3 === 1
            ? PALETTE.concrete
            : darkenColour(PALETTE.concrete, 0.045);
      graphics
        .fillStyle(fill)
        .fillRect(x + 2, y + 2, paverWidth - 3, paverHeight - 3)
        .fillStyle(lightenColour(fill, 0.12))
        .fillRect(x + 3, y + 3, paverWidth - 5, 2)
        .fillStyle(darkenColour(fill, 0.1))
        .fillRect(x + 3, y + paverHeight - 4, paverWidth - 5, 2);
    }
  }
  graphics
    .fillStyle(darkenColour(PALETTE.concreteEdge, 0.2))
    .fillRect(0, horizontalSurfaceTop + horizontalSurfaceHeight, width, 10);
  for (let x = 96; x < width; x += 320) {
    drawDrainGrate(graphics, x, horizontalSurfaceTop + horizontalSurfaceHeight + 1, false);
  }
  for (let x = 18; x < width; x += 48) {
    const seed = terrainHash(
      Math.floor((originX + x) / 24),
      Math.floor((originY + horizontalTop) / 24),
    );
    const topTuftY = horizontalTop - 3 - (seed % 4);
    const bottomTuftY =
      horizontalSurfaceTop + horizontalSurfaceHeight + 5 + ((seed >>> 4) % 3);
    graphics
      .fillStyle(PALETTE.grassDark)
      .fillRect(x, topTuftY, 3, 8)
      .fillRect(x + 5, topTuftY + 3, 2, 5)
      .fillRect(x + 17, bottomTuftY - 4, 3, 8)
      .fillRect(x + 22, bottomTuftY - 2, 2, 5);
  }
  for (let x = 36; x < width; x += 112) {
    const seed = terrainHash(
      Math.floor((originX + x) / 28),
      Math.floor((originY + horizontalSurfaceTop) / 28),
    );
    const leafY =
      horizontalSurfaceTop + 12 + ((seed >>> 7) % (horizontalSurfaceHeight - 24));
    const leafColour =
      seed % 3 === 0
        ? PALETTE.coral
        : seed % 3 === 1
          ? PALETTE.gold
          : darkenColour(PALETTE.grassDark, 0.1);
    graphics
      .fillStyle(leafColour, 0.78)
      .fillRect(x, leafY, 4, 2)
      .fillRect(x + 3, leafY + 2, 2, 3);
  }

  const verticalEdgeLeft = 550;
  const verticalSurfaceLeft = 560;
  const verticalSurfaceWidth = 164;
  graphics
    .fillStyle(PALETTE.night, 0.18)
    .fillRect(verticalEdgeLeft - 6, 0, 198, height)
    .fillStyle(PALETTE.concreteEdge)
    .fillRect(verticalEdgeLeft, 0, 184, height)
    .fillStyle(lightenColour(PALETTE.concreteEdge, 0.16))
    .fillRect(verticalEdgeLeft, 0, 5, height)
    .fillStyle(PALETTE.sand)
    .fillRect(verticalSurfaceLeft, 0, verticalSurfaceWidth, height);

  const verticalPaverHeight = 48;
  for (let row = 0; row * verticalPaverHeight < height; row += 1) {
    const y = row * verticalPaverHeight;
    const boundaries =
      row % 2 === 0
        ? [0, 82, 164]
        : [0, 41, 123, 164];
    for (let segment = 0; segment < boundaries.length - 1; segment += 1) {
      const x = verticalSurfaceLeft + boundaries[segment];
      const segmentWidth = boundaries[segment + 1] - boundaries[segment];
      const seed = terrainHash(
        Math.floor((originX + x) / 41),
        Math.floor((originY + y) / verticalPaverHeight),
      );
      const fill =
        seed % 3 === 0
          ? lightenColour(PALETTE.sand, 0.08)
          : seed % 3 === 1
            ? PALETTE.sand
            : darkenColour(PALETTE.sand, 0.05);
      graphics
        .fillStyle(fill)
        .fillRect(x + 2, y + 2, segmentWidth - 3, verticalPaverHeight - 3)
        .fillStyle(lightenColour(fill, 0.12))
        .fillRect(x + 3, y + 3, segmentWidth - 5, 2)
        .fillStyle(darkenColour(fill, 0.1))
        .fillRect(x + 3, y + verticalPaverHeight - 4, segmentWidth - 5, 2);
    }
  }
  graphics
    .fillStyle(darkenColour(PALETTE.concreteEdge, 0.16))
    .fillRect(verticalSurfaceLeft + verticalSurfaceWidth, 0, 10, height);
  for (let y = 82; y < height; y += 320) {
    drawDrainGrate(
      graphics,
      verticalSurfaceLeft + verticalSurfaceWidth + 1,
      y,
      true,
    );
  }
  for (let y = 20; y < height; y += 48) {
    const seed = terrainHash(
      Math.floor((originX + verticalEdgeLeft) / 24),
      Math.floor((originY + y) / 24),
    );
    const leftTuftX = verticalEdgeLeft - 3 - (seed % 3);
    const rightTuftX =
      verticalSurfaceLeft + verticalSurfaceWidth + 5 + ((seed >>> 4) % 3);
    graphics
      .fillStyle(PALETTE.grassDark)
      .fillRect(leftTuftX, y, 8, 3)
      .fillRect(leftTuftX + 3, y + 5, 5, 2)
      .fillRect(rightTuftX - 4, y + 17, 8, 3)
      .fillRect(rightTuftX - 2, y + 22, 5, 2);
  }
  for (let y = 42; y < height; y += 112) {
    const seed = terrainHash(
      Math.floor((originX + verticalSurfaceLeft) / 28),
      Math.floor((originY + y) / 28),
    );
    const leafX =
      verticalSurfaceLeft + 14 + ((seed >>> 7) % (verticalSurfaceWidth - 28));
    const leafColour =
      seed % 2 === 0 ? PALETTE.gold : darkenColour(PALETTE.grassDark, 0.08);
    graphics
      .fillStyle(leafColour, 0.74)
      .fillRect(leafX, y, 2, 4)
      .fillRect(leafX + 2, y + 3, 3, 2);
  }

  const coverX = verticalSurfaceLeft + 59;
  const coverY = horizontalSurfaceTop + 43;
  graphics
    .fillStyle(PALETTE.ink)
    .fillRect(coverX, coverY, 46, 34)
    .fillStyle(darkenColour(PALETTE.concreteEdge, 0.08))
    .fillRect(coverX + 4, coverY + 4, 38, 26)
    .fillStyle(lightenColour(PALETTE.concreteEdge, 0.18))
    .fillRect(coverX + 8, coverY + 8, 30, 3)
    .fillStyle(PALETTE.ink, 0.5)
    .fillRect(coverX + 21, coverY + 7, 4, 20);
}

function makeTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  draw: (graphics: Phaser.GameObjects.Graphics) => void,
): void {
  if (scene.textures.exists(key)) return;
  const graphics = scene.make.graphics({ x: 0, y: 0 });
  draw(graphics);
  graphics.generateTexture(key, width, height);
  graphics.destroy();
}

function drawSteppedHeadBase(
  graphics: Phaser.GameObjects.Graphics,
  centreX: number,
  skin: number,
): void {
  graphics
    .fillStyle(PALETTE.ink)
    .fillRect(centreX - 8, 3, 16, 2)
    .fillRect(centreX - 10, 5, 20, 19)
    .fillRect(centreX - 8, 24, 16, 3)
    .fillStyle(skin)
    .fillRect(centreX - 7, 6, 14, 18)
    .fillRect(centreX - 9, 9, 18, 12)
    .fillRect(centreX - 6, 24, 12, 1)
    .fillStyle(lightenColour(skin, 0.12))
    .fillRect(centreX - 7, 7, 3, 11)
    .fillStyle(darkenColour(skin, 0.1))
    .fillRect(centreX + 5, 9, 3, 12);
}

function drawSteppedTorso(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: number,
): void {
  const shoulderInset = Math.min(4, Math.floor(width / 5));
  graphics
    .fillStyle(PALETTE.ink)
    .fillRect(x + shoulderInset, y - 2, width - shoulderInset * 2, 2)
    .fillRect(x + 2, y, width - 4, 2)
    .fillRect(x, y + 2, width, Math.max(4, height - 7))
    .fillRect(x + 2, y + height - 5, width - 4, 5)
    .fillStyle(fill)
    .fillRect(x + shoulderInset, y + 1, width - shoulderInset * 2, 2)
    .fillRect(x + 3, y + 3, width - 6, 2)
    .fillRect(x + 3, y + 5, width - 6, Math.max(3, height - 11))
    .fillRect(x + 5, y + height - 6, width - 10, 4)
    .fillStyle(lightenColour(fill, 0.16))
    .fillRect(x + 4, y + 4, 3, Math.max(3, height - 10))
    .fillStyle(darkenColour(fill, 0.18))
    .fillRect(x + width - 7, y + 5, 3, Math.max(3, height - 11))
    .fillRect(x + 5, y + height - 6, width - 10, 2);
}

function drawPlayerHair(
  graphics: Phaser.GameObjects.Graphics,
  facing: PlayerFacing,
  hair: number,
): void {
  if (facing === "up") {
    graphics
      .fillStyle(hair)
      .fillRect(12, 5, 16, 4)
      .fillRect(10, 8, 20, 13)
      .fillRect(12, 21, 16, 3)
      .fillStyle(lightenColour(hair, 0.15))
      .fillRect(13, 6, 8, 2)
      .fillRect(11, 10, 2, 7);
    return;
  }
  if (facing === "side") {
    graphics
      .fillStyle(hair)
      .fillRect(12, 4, 15, 3)
      .fillRect(10, 7, 19, 6)
      .fillRect(10, 11, 5, 9)
      .fillRect(14, 12, 3, 4)
      .fillStyle(lightenColour(hair, 0.15))
      .fillRect(13, 5, 8, 2);
    return;
  }
  graphics
    .fillStyle(hair)
    .fillRect(12, 4, 16, 3)
    .fillRect(10, 7, 20, 6)
    .fillRect(10, 11, 5, 7)
    .fillRect(25, 11, 5, 5)
    .fillRect(15, 12, 3, 3)
    .fillStyle(lightenColour(hair, 0.15))
    .fillRect(13, 5, 9, 2);
}

function drawResidentHair(
  graphics: Phaser.GameObjects.Graphics,
  definition: ResidentArtDefinition,
  facing: PlayerFacing,
): void {
  const hair = definition.hair;
  const highlight = lightenColour(hair, 0.28);
  if (facing === "up") {
    if (definition.hairStyle === "receding") {
      graphics
        .fillStyle(hair)
        .fillRect(12, 8, 5, 13)
        .fillRect(27, 8, 5, 13)
        .fillRect(15, 20, 14, 4)
        .fillStyle(highlight)
        .fillRect(13, 9, 2, 8);
      return;
    }
    graphics
      .fillStyle(hair)
      .fillRect(14, 4, 16, 3)
      .fillRect(12, 7, 20, 15)
      .fillRect(14, 21, 16, 3);
    if (definition.hairStyle === "bun") {
      graphics
        .fillStyle(PALETTE.ink)
        .fillRect(18, 1, 9, 5)
        .fillStyle(hair)
        .fillRect(20, 1, 5, 4);
    } else if (definition.hairStyle === "bob") {
      graphics
        .fillStyle(hair)
        .fillRect(10, 9, 5, 14)
        .fillRect(29, 9, 5, 14);
    } else if (definition.hairStyle === "crop") {
      graphics
        .fillStyle(definition.skin)
        .fillRect(13, 17, 18, 6);
    } else {
      graphics
        .fillStyle(darkenColour(hair, 0.18))
        .fillRect(21, 5, 2, 17);
    }
    graphics
      .fillStyle(highlight)
      .fillRect(15, 5, 8, 2);
    return;
  }

  if (definition.hairStyle === "receding") {
    graphics
      .fillStyle(hair)
      .fillRect(12, 7, 5, 11)
      .fillRect(facing === "side" ? 27 : 28, 8, 4, 10)
      .fillRect(15, 5, 7, 3)
      .fillStyle(highlight)
      .fillRect(13, 8, 2, 7);
    return;
  }

  const sideFace = facing === "side";
  graphics
    .fillStyle(hair)
    .fillRect(14, 4, sideFace ? 14 : 16, 3)
    .fillRect(12, 7, sideFace ? 18 : 20, 6)
    .fillRect(12, 11, 5, definition.hairStyle === "bob" ? 12 : 8);

  if (!sideFace) {
    graphics.fillRect(
      28,
      11,
      4,
      definition.hairStyle === "bob" ? 12 : 7,
    );
  }
  if (definition.hairStyle === "bun") {
    const bunX = sideFace ? 10 : 27;
    graphics
      .fillStyle(PALETTE.ink)
      .fillRect(bunX, 2, 8, 7)
      .fillStyle(hair)
      .fillRect(bunX + 2, 3, 5, 4);
  } else if (definition.hairStyle === "side-part") {
    graphics
      .fillStyle(darkenColour(hair, 0.2))
      .fillRect(sideFace ? 23 : 22, 5, 2, 7)
      .fillStyle(hair)
      .fillRect(sideFace ? 17 : 16, 11, 7, 4);
  } else if (definition.hairStyle === "crop") {
    graphics
      .fillStyle(definition.skin)
      .fillRect(13, 12, sideFace ? 15 : 18, 5);
  }
  graphics
    .fillStyle(highlight)
    .fillRect(15, 5, 8, 2);
}

function drawResidentOutfit(
  graphics: Phaser.GameObjects.Graphics,
  definition: ResidentArtDefinition,
  facing: PlayerFacing,
  bodyLeft: number,
  bodyTop: number,
  bodyWidth: number,
  bodyHeight: number,
): void {
  const centreX = bodyLeft + Math.floor(bodyWidth / 2);
  const usableWidth = Math.max(6, bodyWidth - 10);
  if (definition.outfit === "collared" && facing !== "up") {
    graphics
      .fillStyle(PALETTE.cream)
      .fillTriangle(centreX - 5, bodyTop + 3, centreX, bodyTop + 8, centreX, bodyTop + 3)
      .fillTriangle(centreX, bodyTop + 3, centreX, bodyTop + 8, centreX + 5, bodyTop + 3)
      .fillStyle(PALETTE.gold)
      .fillRect(centreX - 1, bodyTop + 8, 2, 2);
  } else if (definition.outfit === "floral") {
    const flowerY = bodyTop + Math.min(10, bodyHeight - 7);
    graphics
      .fillStyle(PALETTE.gold)
      .fillRect(bodyLeft + 6, flowerY, 3, 3)
      .fillRect(bodyLeft + bodyWidth - 9, flowerY + 4, 3, 3)
      .fillStyle(PALETTE.cream)
      .fillRect(bodyLeft + 7, flowerY + 1, 1, 1)
      .fillRect(bodyLeft + bodyWidth - 8, flowerY + 5, 1, 1);
  } else if (definition.outfit === "striped") {
    graphics
      .fillStyle(lightenColour(definition.shirt, 0.36))
      .fillRect(bodyLeft + 5, bodyTop + 8, usableWidth, 3)
      .fillRect(bodyLeft + 5, bodyTop + 14, usableWidth, 2);
  } else if (definition.outfit === "work-vest") {
    graphics
      .fillStyle(darkenColour(definition.shirt, 0.3))
      .fillRect(bodyLeft + 4, bodyTop + 5, 4, Math.max(7, bodyHeight - 11))
      .fillRect(bodyLeft + bodyWidth - 8, bodyTop + 5, 4, Math.max(7, bodyHeight - 11))
      .fillStyle(PALETTE.gold)
      .fillRect(centreX - 1, bodyTop + 9, 2, 2)
      .fillRect(centreX - 1, bodyTop + 15, 2, 2);
  } else if (facing !== "up") {
    graphics
      .fillStyle(lightenColour(definition.shirt, 0.25))
      .fillRect(bodyLeft + bodyWidth - 10, bodyTop + 10, 5, 4)
      .fillStyle(PALETTE.ink, 0.36)
      .fillRect(bodyLeft + bodyWidth - 9, bodyTop + 11, 3, 1);
  }
}

function drawResidentTote(
  graphics: Phaser.GameObjects.Graphics,
  definition: ResidentArtDefinition,
  facing: PlayerFacing,
  bodyLeft: number,
  bodyTop: number,
  bodyWidth: number,
  armSwing: number,
): void {
  if (definition.carry !== "tote") return;
  const bagX =
    facing === "side"
      ? bodyLeft - 6
      : Math.min(35, bodyLeft + bodyWidth - 1);
  const bagY = bodyTop + 12 + Math.round(armSwing / 2);
  graphics
    .lineStyle(2, PALETTE.ink, 1)
    .lineBetween(
      bodyLeft + Math.floor(bodyWidth / 2),
      bodyTop + 3,
      bagX + 4,
      bagY + 2,
    )
    .fillStyle(PALETTE.ink)
    .fillRect(bagX, bagY, 9, 12)
    .fillStyle(PALETTE.green)
    .fillRect(bagX + 2, bagY + 2, 5, 8)
    .fillStyle(lightenColour(PALETTE.green, 0.2))
    .fillRect(bagX + 3, bagY + 3, 2, 5);
}

function drawPlayerFrame(
  graphics: Phaser.GameObjects.Graphics,
  facing: PlayerFacing,
  step: WalkFrame,
  blinking = false,
): void {
  const skin = 0xd39c6d;
  const hair = 0x2a2523;
  const shirt = PALETTE.teal;
  const trousers = 0x355b68;
  const stride = [
    { leftLegX: 11, rightLegX: 23, leftFootY: 51, rightFootY: 51, arm: 0 },
    { leftLegX: 10, rightLegX: 24, leftFootY: 53, rightFootY: 49, arm: 2 },
    { leftLegX: 12, rightLegX: 22, leftFootY: 50, rightFootY: 50, arm: 0 },
    { leftLegX: 13, rightLegX: 21, leftFootY: 49, rightFootY: 53, arm: -2 },
  ] as const;
  const {
    leftLegX,
    rightLegX,
    leftFootY,
    rightFootY,
    arm: armOffset,
  } = stride[step];

  graphics
    .fillStyle(PALETTE.ink)
    .fillRect(leftLegX - 1, 41, 8, 13)
    .fillRect(rightLegX - 1, 41, 8, 13)
    .fillStyle(trousers)
    .fillRect(leftLegX + 1, 42, 4, 9)
    .fillRect(rightLegX + 1, 42, 4, 9)
    .fillStyle(darkenColour(trousers, 0.2))
    .fillRect(leftLegX + 1, 49, 4, 3)
    .fillRect(rightLegX + 1, 49, 4, 3)
    .fillStyle(PALETTE.ink)
    .fillRect(leftLegX - 2, leftFootY - 1, 9, 4)
    .fillRect(rightLegX - 2, rightFootY - 1, 9, 4)
    .fillStyle(PALETTE.cream)
    .fillRect(leftLegX, leftFootY, 6, 2)
    .fillRect(rightLegX, rightFootY, 6, 2);

  if (facing === "side") {
    graphics
      .fillStyle(PALETTE.ink, 0.72)
      .fillRect(9, 28 - armOffset, 6, 16)
      .fillStyle(darkenColour(shirt, 0.14))
      .fillRect(11, 29 - armOffset, 3, 6)
      .fillStyle(skin)
      .fillRect(11, 35 - armOffset, 3, 7);
  } else {
    graphics
      .fillStyle(PALETTE.ink)
      .fillRect(5, 27 + armOffset, 7, 17)
      .fillRect(28, 27 - armOffset, 7, 17)
      .fillStyle(shirt)
      .fillRect(7, 29 + armOffset, 3, 6)
      .fillRect(30, 29 - armOffset, 3, 6)
      .fillStyle(skin)
      .fillRect(7, 35 + armOffset, 3, 7)
      .fillRect(30, 35 - armOffset, 3, 7)
      .fillStyle(lightenColour(skin, 0.14))
      .fillRect(6, 40 + armOffset, 5, 4)
      .fillRect(29, 40 - armOffset, 5, 4);
  }

  drawSteppedTorso(graphics, 10, 24, 20, 22, shirt);
  graphics
    .fillStyle(PALETTE.gold)
    .fillRect(14, 27, 12, 3)
    .fillStyle(PALETTE.coral)
    .fillRect(facing === "side" ? 23 : 13, 31, 3, 11)
    .fillStyle(PALETTE.cream)
    .fillRect(facing === "up" ? 17 : 18, 25, 4, 3);
  if (facing === "side") {
    graphics
      .fillStyle(PALETTE.ink)
      .fillRect(27, 28 + armOffset, 7, 17)
      .fillStyle(shirt)
      .fillRect(29, 30 + armOffset, 3, 6)
      .fillStyle(skin)
      .fillRect(29, 36 + armOffset, 3, 7)
      .fillStyle(lightenColour(skin, 0.14))
      .fillRect(28, 41 + armOffset, 5, 4);
  }

  drawSteppedHeadBase(graphics, 20, skin);
  drawPlayerHair(graphics, facing, hair);
  if (facing === "up") {
    graphics
      .fillStyle(darkenColour(hair, 0.18))
      .fillRect(24, 13, 3, 7);
  } else if (facing === "side") {
    graphics
      .fillStyle(PALETTE.ink)
      .fillRect(25, blinking ? 16 : 14, 3, blinking ? 1 : 3)
      .fillStyle(lightenColour(skin, 0.18))
      .fillRect(28, 16, 2, 3)
      .fillStyle(PALETTE.coral)
      .fillRect(27, 20, 3, 2);
  } else {
    graphics
      .fillStyle(PALETTE.ink)
      .fillRect(15, blinking ? 17 : 15, 3, blinking ? 1 : 3)
      .fillRect(22, blinking ? 17 : 15, 3, blinking ? 1 : 3)
      .fillStyle(lightenColour(skin, 0.18))
      .fillRect(18, 17, 4, 3)
      .fillStyle(PALETTE.coral)
      .fillRect(18, 21, 5, 2)
      .fillStyle(darkenColour(skin, 0.12))
      .fillRect(13, 18, 2, 2)
      .fillRect(25, 18, 2, 2);
  }
}

function createPlayerTextures(scene: Phaser.Scene): void {
  for (const facing of ["down", "up", "side"] as const) {
    for (const step of WALK_FRAMES) {
      makeTexture(
        scene,
        `campaign-player-${facing}-${step}`,
        40,
        56,
        (graphics) => drawPlayerFrame(graphics, facing, step),
      );
    }
    makeTexture(
      scene,
      `campaign-player-${facing}-0-blink`,
      40,
      56,
      (graphics) => drawPlayerFrame(graphics, facing, 0, true),
    );
  }
}

function drawResidentFrame(
  graphics: Phaser.GameObjects.Graphics,
  definition: ResidentArtDefinition,
  facing: PlayerFacing,
  step: WalkFrame,
  blinking: boolean,
): void {
  const bodyWidth = definition.build === "wide" ? 28 : 22;
  const bodyHeight =
    definition.build === "short" ? 20 : definition.build === "tall" ? 27 : 23;
  const bodyLeft = Math.round(22 - bodyWidth / 2);
  const bodyTop = 25;
  const footY = Math.min(51, bodyTop + bodyHeight - 1);
  const stride = [
    { leftX: 0, rightX: 0, leftY: 0, rightY: 0, arm: 0 },
    { leftX: -1, rightX: 1, leftY: 2, rightY: -2, arm: 2 },
    { leftX: 1, rightX: -1, leftY: -1, rightY: -1, arm: 0 },
    { leftX: 1, rightX: -1, leftY: -2, rightY: 2, arm: -2 },
  ] as const;
  const phase = stride[step];
  const leftFootX = bodyLeft + 3 + phase.leftX;
  const rightFootX = bodyLeft + bodyWidth - 9 + phase.rightX;
  const leftFootY = footY + phase.leftY;
  const rightFootY = footY + phase.rightY;
  const armSwing = phase.arm;

  graphics
    .fillStyle(PALETTE.ink)
    .fillRect(leftFootX, leftFootY - 7, 7, 10)
    .fillRect(rightFootX, rightFootY - 7, 7, 10)
    .fillStyle(darkenColour(definition.shirt, 0.36))
    .fillRect(leftFootX + 2, leftFootY - 6, 3, 6)
    .fillRect(rightFootX + 2, rightFootY - 6, 3, 6)
    .fillStyle(PALETTE.ink)
    .fillRect(leftFootX - 1, leftFootY, 9, 4)
    .fillRect(rightFootX - 1, rightFootY, 9, 4)
    .fillStyle(PALETTE.sand)
    .fillRect(leftFootX + 1, leftFootY + 1, 6, 2)
    .fillRect(rightFootX + 1, rightFootY + 1, 6, 2);

  if (facing === "side") {
    graphics
      .fillStyle(PALETTE.ink, 0.72)
      .fillRect(
        bodyLeft + 1,
        bodyTop + 4 - armSwing,
        7,
        Math.max(13, bodyHeight - 5),
      )
      .fillStyle(darkenColour(definition.shirt, 0.18))
      .fillRect(bodyLeft + 3, bodyTop + 6 - armSwing, 3, 6)
      .fillStyle(definition.skin)
      .fillRect(
        bodyLeft + 3,
        bodyTop + 12 - armSwing,
        3,
        Math.max(5, bodyHeight - 15),
      );
  } else {
    graphics
      .fillStyle(PALETTE.ink)
      .fillRect(bodyLeft - 5, bodyTop + 4 + armSwing, 6, bodyHeight - 5)
      .fillRect(bodyLeft + bodyWidth - 1, bodyTop + 4 - armSwing, 6, bodyHeight - 5)
      .fillStyle(definition.shirt)
      .fillRect(bodyLeft - 3, bodyTop + 6 + armSwing, 3, 6)
      .fillRect(bodyLeft + bodyWidth, bodyTop + 6 - armSwing, 3, 6)
      .fillStyle(definition.skin)
      .fillRect(
        bodyLeft - 3,
        bodyTop + 12 + armSwing,
        3,
        Math.max(5, bodyHeight - 15),
      )
      .fillRect(
        bodyLeft + bodyWidth,
        bodyTop + 12 - armSwing,
        3,
        Math.max(5, bodyHeight - 15),
      )
      .fillStyle(lightenColour(definition.skin, 0.12))
      .fillRect(bodyLeft - 4, bodyTop + bodyHeight - 4 + armSwing, 5, 4)
      .fillRect(
        bodyLeft + bodyWidth - 1,
        bodyTop + bodyHeight - 4 - armSwing,
        5,
        4,
      );
  }

  drawSteppedTorso(
    graphics,
    bodyLeft,
    bodyTop,
    bodyWidth,
    bodyHeight,
    definition.shirt,
  );
  drawResidentOutfit(
    graphics,
    definition,
    facing,
    bodyLeft,
    bodyTop,
    bodyWidth,
    bodyHeight,
  );
  drawResidentTote(
    graphics,
    definition,
    facing,
    bodyLeft,
    bodyTop,
    bodyWidth,
    armSwing,
  );

  if (facing === "side") {
    const frontArmX = bodyLeft + bodyWidth - 5;
    graphics
      .fillStyle(PALETTE.ink)
      .fillRect(
        frontArmX,
        bodyTop + 5 + armSwing,
        7,
        Math.max(13, bodyHeight - 5),
      )
      .fillStyle(definition.shirt)
      .fillRect(frontArmX + 2, bodyTop + 7 + armSwing, 3, 6)
      .fillStyle(definition.skin)
      .fillRect(
        frontArmX + 2,
        bodyTop + 13 + armSwing,
        3,
        Math.max(5, bodyHeight - 15),
      )
      .fillStyle(lightenColour(definition.skin, 0.12))
      .fillRect(
        frontArmX + 1,
        bodyTop + bodyHeight - 4 + armSwing,
        5,
        4,
      );
  }

  drawSteppedHeadBase(graphics, 22, definition.skin);
  drawResidentHair(graphics, definition, facing);
  if (facing === "up") {
    graphics
      .fillStyle(darkenColour(definition.hair, 0.18))
      .fillRect(27, 13, 3, 7);
  } else if (facing === "side") {
    graphics
      .fillStyle(PALETTE.ink)
      .fillRect(27, blinking ? 16 : 15, 3, blinking ? 1 : 3)
      .fillStyle(lightenColour(definition.skin, 0.16))
      .fillRect(30, 16, 2, 3)
      .fillStyle(PALETTE.coral)
      .fillRect(29, 21, 3, 2)
      .fillStyle(darkenColour(definition.skin, 0.14))
      .fillRect(15, 19, 3, 2);
  } else {
    graphics
      .fillStyle(PALETTE.ink)
      .fillRect(16, blinking ? 16 : 15, 3, blinking ? 1 : 3)
      .fillRect(25, blinking ? 16 : 15, 3, blinking ? 1 : 3)
      .fillStyle(lightenColour(definition.skin, 0.16))
      .fillRect(20, 17, 4, 3)
      .fillStyle(PALETTE.coral)
      .fillRect(20, 21, 5, 2)
      .fillStyle(darkenColour(definition.skin, 0.14))
      .fillRect(14, 19, 3, 2)
      .fillRect(27, 19, 3, 2);
  }

  if (definition.accessory === "glasses" && facing !== "up") {
    graphics.lineStyle(2, PALETTE.ink);
    if (facing === "side") {
      graphics.strokeRect(23, 12, 8, 6).lineBetween(18, 14, 23, 14);
    } else {
      graphics
        .strokeRect(14, 12, 7, 6)
        .strokeRect(23, 12, 7, 6)
        .lineBetween(21, 15, 23, 15);
    }
  } else if (definition.accessory === "cane") {
    const caneX = facing === "side" ? 36 : 37;
    graphics
      .fillStyle(PALETTE.ink)
      .fillRect(caneX, 31, 3, 24)
      .fillRect(caneX - 3, 29, 6, 3)
      .fillStyle(PALETTE.gold)
      .fillRect(caneX + 1, 34, 1, 18);
  } else if (definition.accessory === "apron") {
    if (facing === "up") {
      graphics
        .fillStyle(PALETTE.cream)
        .fillRect(17, 27, 10, 3)
        .fillRect(20, 30, 4, Math.min(13, bodyHeight - 7))
        .fillStyle(PALETTE.gold)
        .fillRect(19, 36, 6, 2);
    } else {
      const apronLeft = facing === "side" ? 21 : 17;
      const apronWidth = facing === "side" ? 7 : 10;
      graphics
        .fillStyle(PALETTE.cream)
        .fillRect(apronLeft, 29, apronWidth, Math.min(15, bodyHeight - 6))
        .fillStyle(PALETTE.coral)
        .fillRect(apronLeft + 2, 33, Math.max(3, apronWidth - 4), 2)
        .fillStyle(PALETTE.gold)
        .fillRect(
          apronLeft + 2,
          bodyTop + Math.min(16, bodyHeight - 5),
          Math.max(3, apronWidth - 4),
          2,
        );
    }
  }
}

function createResidentTextures(
  scene: Phaser.Scene,
  definition: ResidentArtDefinition,
): void {
  for (const facing of ["down", "up", "side"] as const) {
    for (const step of WALK_FRAMES) {
      makeTexture(
        scene,
        `${definition.key}-${facing}-${step}`,
        44,
        58,
        (graphics) => drawResidentFrame(graphics, definition, facing, step, false),
      );
    }
    makeTexture(
      scene,
      `${definition.key}-${facing}-0-blink`,
      44,
      58,
      (graphics) => drawResidentFrame(graphics, definition, facing, 0, true),
    );
  }
  makeTexture(scene, definition.key, 44, 58, (graphics) => {
    drawResidentFrame(graphics, definition, "down", 0, false);
  });
  makeTexture(scene, `${definition.key}-blink`, 44, 58, (graphics) => {
    drawResidentFrame(graphics, definition, "down", 0, true);
  });
}

function fillPixelPolygon(
  graphics: Phaser.GameObjects.Graphics,
  colour: number,
  points: readonly (readonly [number, number])[],
  alpha = 1,
): void {
  graphics
    .fillStyle(colour, alpha)
    .fillPoints(
      points.map(([x, y]) => new Phaser.Geom.Point(x, y)),
      true,
    );
}

function drawShearedShadow(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  skew = 14,
): void {
  fillPixelPolygon(
    graphics,
    PALETTE.night,
    [
      [x, y],
      [x + width, y],
      [x + width + skew, y + height],
      [x + skew, y + height],
    ],
    0.17,
  );
}

function createTreeTextures(scene: Phaser.Scene): void {
  makeTexture(scene, "tree-rain", 180, 166, (graphics) => {
    drawShearedShadow(graphics, 48, 141, 82, 14, 20);
    graphics
      .fillStyle(PALETTE.ink)
      .fillRect(75, 70, 29, 78)
      .fillRect(54, 76, 31, 12)
      .fillRect(95, 62, 31, 12)
      .fillStyle(0x755238)
      .fillRect(81, 72, 17, 74)
      .fillRect(60, 78, 26, 6)
      .fillRect(96, 66, 24, 6)
      .fillStyle(0xaa7950)
      .fillRect(84, 74, 5, 68)
      .fillStyle(PALETTE.night, 0.24)
      .fillEllipse(90, 151, 54, 12);
    fillPixelPolygon(graphics, PALETTE.ink, [
      [10, 54],
      [20, 34],
      [39, 34],
      [39, 20],
      [65, 20],
      [65, 10],
      [104, 10],
      [104, 16],
      [137, 16],
      [137, 28],
      [158, 28],
      [158, 43],
      [172, 43],
      [172, 70],
      [160, 70],
      [160, 88],
      [137, 88],
      [137, 99],
      [105, 99],
      [105, 106],
      [65, 106],
      [65, 100],
      [34, 100],
      [34, 90],
      [14, 90],
      [14, 76],
      [6, 76],
    ]);
    fillPixelPolygon(graphics, 0x35633f, [
      [17, 55],
      [27, 39],
      [46, 39],
      [46, 26],
      [72, 26],
      [72, 17],
      [101, 17],
      [101, 23],
      [132, 23],
      [132, 34],
      [151, 34],
      [151, 50],
      [164, 50],
      [164, 67],
      [152, 67],
      [152, 82],
      [130, 82],
      [130, 93],
      [101, 93],
      [101, 100],
      [70, 100],
      [70, 94],
      [40, 94],
      [40, 84],
      [21, 84],
      [21, 70],
      [13, 70],
    ]);
    graphics
      .fillStyle(0x5f9a58)
      .fillRect(27, 46, 54, 29)
      .fillRect(47, 30, 55, 28)
      .fillRect(81, 24, 47, 31)
      .fillRect(112, 40, 39, 28)
      .fillStyle(0x80b36c)
      .fillRect(34, 42, 29, 8)
      .fillRect(55, 32, 34, 7)
      .fillRect(91, 27, 25, 7)
      .fillRect(121, 43, 20, 6)
      .fillStyle(PALETTE.grassDark)
      .fillRect(31, 69, 37, 14)
      .fillRect(72, 75, 45, 21)
      .fillRect(119, 66, 29, 16);
    const rainTreeMottle: readonly [number, number, number, number, number][] = [
      [24, 51, 14, 7, 0x91c276],
      [42, 34, 16, 8, 0x72a466],
      [63, 21, 13, 7, 0x91c276],
      [82, 33, 18, 8, 0x72a466],
      [105, 19, 15, 7, 0x80b36c],
      [128, 34, 15, 8, 0x91c276],
      [145, 53, 12, 7, 0x72a466],
      [38, 63, 12, 6, 0x80b36c],
      [60, 54, 16, 7, 0x91c276],
      [91, 58, 14, 6, 0x72a466],
      [116, 52, 17, 7, 0x80b36c],
      [53, 77, 14, 6, 0x4f8052],
      [88, 83, 16, 6, 0x4f8052],
      [126, 72, 13, 7, 0x72a466],
    ];
    for (const [x, y, width, height, colour] of rainTreeMottle) {
      graphics
        .fillStyle(colour)
        .fillRect(x, y, width, height)
        .fillStyle(lightenColour(colour, 0.13))
        .fillRect(x + 3, y - 2, Math.max(4, width - 7), 3);
    }
    for (const [x, y] of [[30, 44], [54, 29], [75, 45], [99, 27], [123, 45], [148, 61], [68, 69], [108, 74]] as const) {
      graphics
        .fillStyle(PALETTE.cream, 0.78)
        .fillRect(x, y, 3, 3)
        .fillStyle(PALETTE.gold, 0.7)
        .fillRect(x + 1, y + 1, 2, 2);
    }
  });

  makeTexture(scene, "tree-palm", 140, 178, (graphics) => {
    drawShearedShadow(graphics, 43, 154, 55, 12, 21);
    fillPixelPolygon(graphics, PALETTE.ink, [
      [56, 49],
      [76, 49],
      [88, 160],
      [61, 160],
    ]);
    fillPixelPolygon(graphics, 0x9b714b, [
      [62, 51],
      [72, 51],
      [81, 157],
      [67, 157],
    ]);
    graphics
      .fillStyle(lightenColour(0x9b714b, 0.16))
      .fillRect(64, 57, 5, 84)
      .fillStyle(PALETTE.night, 0.24)
      .fillEllipse(75, 163, 46, 10);

    const inkFronds: readonly (readonly [number, number])[][] = [
      [[66, 48], [7, 30], [4, 40], [57, 58]],
      [[64, 45], [20, 7], [13, 8], [56, 54]],
      [[68, 43], [58, 1], [49, 1], [61, 49]],
      [[72, 43], [94, 3], [103, 8], [78, 51]],
      [[74, 47], [134, 26], [137, 37], [82, 57]],
      [[73, 50], [123, 64], [127, 75], [78, 59]],
      [[68, 48], [41, 70], [36, 64], [62, 53]],
    ];
    const greenFronds: readonly (readonly [number, number])[][] = [
      [[63, 49], [12, 33], [12, 37], [59, 53]],
      [[64, 45], [24, 11], [21, 12], [59, 51]],
      [[68, 43], [58, 6], [54, 6], [64, 48]],
      [[72, 43], [94, 8], [98, 10], [76, 49]],
      [[74, 47], [130, 30], [131, 35], [80, 53]],
      [[73, 50], [119, 65], [121, 70], [78, 56]],
      [[68, 48], [43, 66], [41, 63], [64, 52]],
    ];
    for (const points of inkFronds) {
      fillPixelPolygon(graphics, PALETTE.ink, points);
    }
    for (const [index, points] of greenFronds.entries()) {
      fillPixelPolygon(
        graphics,
        index % 3 === 0 ? 0x76a95f : 0x35633f,
        points,
      );
    }
    graphics
      .fillStyle(PALETTE.ink)
      .fillRect(59, 44, 24, 18)
      .fillStyle(0x4f7d49)
      .fillRect(63, 47, 16, 11)
      .fillStyle(0x755238)
      .fillRect(59, 57, 8, 8)
      .fillRect(72, 58, 8, 8);
    for (const [x, y, width] of [[18, 31, 25], [31, 15, 21], [54, 7, 17], [79, 12, 20], [98, 27, 25], [93, 55, 21]] as const) {
      graphics
        .fillStyle(0x92bd74, 0.8)
        .fillRect(x, y, width, 3)
        .fillStyle(PALETTE.cream, 0.34)
        .fillRect(x + 3, y, Math.max(3, width - 9), 1);
    }
  });

  makeTexture(scene, "tree-frangipani", 138, 136, (graphics) => {
    drawShearedShadow(graphics, 35, 116, 60, 11, 18);
    graphics
      .fillStyle(PALETTE.ink)
      .fillRect(55, 65, 24, 54)
      .fillRect(37, 60, 25, 9)
      .fillRect(74, 55, 27, 9)
      .fillStyle(0x755638)
      .fillRect(61, 67, 12, 50)
      .fillRect(43, 62, 20, 5)
      .fillRect(74, 58, 21, 5)
      .fillStyle(PALETTE.night, 0.22)
      .fillEllipse(68, 123, 46, 10);
    fillPixelPolygon(graphics, PALETTE.ink, [
      [11, 47],
      [20, 29],
      [38, 29],
      [38, 17],
      [61, 17],
      [61, 9],
      [85, 9],
      [85, 16],
      [107, 16],
      [107, 27],
      [124, 27],
      [124, 42],
      [133, 42],
      [133, 65],
      [122, 65],
      [122, 79],
      [99, 79],
      [99, 88],
      [70, 88],
      [70, 84],
      [42, 84],
      [42, 78],
      [21, 78],
      [21, 68],
      [8, 68],
    ]);
    fillPixelPolygon(graphics, 0x4f8052, [
      [17, 48],
      [26, 34],
      [44, 34],
      [44, 23],
      [65, 23],
      [65, 16],
      [82, 16],
      [82, 22],
      [103, 22],
      [103, 33],
      [119, 33],
      [119, 47],
      [127, 47],
      [127, 61],
      [116, 61],
      [116, 73],
      [94, 73],
      [94, 82],
      [72, 82],
      [72, 78],
      [46, 78],
      [46, 72],
      [26, 72],
      [26, 63],
      [15, 63],
    ]);
    graphics
      .fillStyle(0x72a466)
      .fillRect(29, 38, 39, 23)
      .fillRect(52, 27, 39, 24)
      .fillRect(83, 34, 33, 24)
      .fillStyle(lightenColour(0x72a466, 0.15))
      .fillRect(36, 35, 24, 6)
      .fillRect(59, 25, 23, 6)
      .fillRect(91, 34, 18, 5);
    const flowers: readonly [number, number][] = [
      [34, 40],
      [61, 29],
      [89, 25],
      [108, 43],
      [52, 58],
      [82, 61],
      [113, 65],
      [25, 57],
      [45, 24],
      [73, 18],
      [99, 38],
      [69, 72],
    ];
    for (const [x, y] of flowers) {
      graphics
        .fillStyle(PALETTE.cream)
        .fillRect(x - 3, y, 9, 4)
        .fillRect(x, y - 3, 4, 9)
        .fillStyle(PALETTE.gold)
        .fillRect(x + 1, y + 1, 2, 2);
    }
  });
}

function createLandscapeTextures(scene: Phaser.Scene): void {
  makeTexture(scene, "landscape-shrub", 80, 58, (graphics) => {
    drawShearedShadow(graphics, 13, 43, 48, 8, 11);
    fillPixelPolygon(graphics, PALETTE.ink, [
      [7, 32],
      [13, 17],
      [26, 17],
      [26, 8],
      [44, 8],
      [44, 14],
      [59, 14],
      [59, 24],
      [70, 24],
      [70, 43],
      [61, 43],
      [61, 49],
      [18, 49],
      [18, 44],
      [7, 44],
    ]);
    fillPixelPolygon(graphics, 0x47784a, [
      [13, 32],
      [19, 22],
      [31, 22],
      [31, 14],
      [42, 14],
      [42, 20],
      [55, 20],
      [55, 29],
      [64, 29],
      [64, 40],
      [56, 40],
      [56, 44],
      [22, 44],
      [22, 39],
      [13, 39],
    ]);
    graphics
      .fillStyle(0x70a764)
      .fillRect(19, 27, 18, 11)
      .fillRect(34, 18, 16, 12)
      .fillRect(47, 29, 13, 10)
      .fillStyle(0x91c276)
      .fillRect(22, 25, 10, 4)
      .fillRect(37, 17, 9, 4)
      .fillRect(50, 28, 7, 3);
  });

  makeTexture(scene, "landscape-flower-bed", 116, 62, (graphics) => {
    drawShearedShadow(graphics, 11, 48, 88, 8, 13);
    graphics
      .fillStyle(PALETTE.ink)
      .fillRect(7, 36, 99, 18)
      .fillStyle(PALETTE.concreteEdge)
      .fillRect(11, 39, 91, 11)
      .fillStyle(lightenColour(PALETTE.concreteEdge, 0.16))
      .fillRect(11, 39, 91, 3)
      .fillStyle(0x6f4f36)
      .fillRect(16, 32, 81, 7);
    const stems: readonly [number, number, number][] = [
      [21, 18, PALETTE.coral],
      [39, 10, PALETTE.gold],
      [58, 17, PALETTE.cream],
      [76, 9, PALETTE.purple],
      [94, 19, PALETTE.coral],
    ];
    for (const [x, y, colour] of stems) {
      graphics
        .fillStyle(PALETTE.green)
        .fillRect(x, y + 7, 3, 20)
        .fillRect(x - 4, y + 16, 7, 3)
        .fillStyle(colour)
        .fillRect(x - 4, y, 11, 5)
        .fillRect(x - 1, y - 3, 5, 11)
        .fillStyle(PALETTE.ink)
        .fillRect(x + 1, y + 1, 2, 2);
    }
  });

  makeTexture(scene, "landscape-pandan", 72, 68, (graphics) => {
    drawShearedShadow(graphics, 15, 53, 40, 8, 11);
    const leaves: readonly (readonly [number, number])[][] = [
      [[34, 56], [5, 19], [12, 14], [42, 55]],
      [[35, 56], [20, 5], [28, 3], [43, 56]],
      [[37, 56], [38, 1], [45, 3], [44, 56]],
      [[40, 56], [58, 8], [64, 14], [47, 57]],
      [[42, 57], [68, 28], [69, 37], [48, 59]],
      [[32, 58], [8, 37], [9, 29], [38, 57]],
    ];
    for (const points of leaves) {
      fillPixelPolygon(graphics, PALETTE.ink, points);
    }
    for (const [index, points] of leaves.entries()) {
      const inset = points.map(([x, y]) => [
        x + (x < 36 ? 2 : -2),
        y + (y < 50 ? 3 : 0),
      ] as const);
      fillPixelPolygon(
        graphics,
        index % 2 === 0 ? 0x4f8052 : 0x72a466,
        inset,
      );
    }
    graphics
      .fillStyle(PALETTE.night, 0.22)
      .fillEllipse(39, 61, 40, 8);
  });

  makeTexture(scene, "landscape-hedge", 142, 62, (graphics) => {
    drawShearedShadow(graphics, 10, 47, 112, 9, 14);
    fillPixelPolygon(graphics, PALETTE.ink, [
      [5, 24],
      [14, 24],
      [14, 13],
      [34, 13],
      [34, 8],
      [56, 8],
      [56, 15],
      [76, 15],
      [76, 7],
      [98, 7],
      [98, 14],
      [119, 14],
      [119, 23],
      [134, 23],
      [134, 49],
      [5, 49],
    ]);
    fillPixelPolygon(graphics, 0x3f7047, [
      [11, 27],
      [20, 27],
      [20, 19],
      [38, 19],
      [38, 14],
      [52, 14],
      [52, 21],
      [81, 21],
      [81, 13],
      [94, 13],
      [94, 20],
      [115, 20],
      [115, 29],
      [128, 29],
      [128, 43],
      [11, 43],
    ]);
    graphics
      .fillStyle(0x659b59)
      .fillRect(17, 26, 31, 12)
      .fillRect(51, 23, 31, 15)
      .fillRect(86, 24, 35, 14)
      .fillStyle(0x8abb6f)
      .fillRect(22, 23, 17, 4)
      .fillRect(57, 20, 17, 4)
      .fillRect(94, 21, 18, 4)
      .fillStyle(PALETTE.gold)
      .fillRect(29, 29, 3, 3)
      .fillRect(72, 27, 3, 3)
      .fillStyle(PALETTE.cream)
      .fillRect(105, 29, 3, 3);
  });
}

function createPropTextures(scene: Phaser.Scene): void {
  makeTexture(scene, "prop-bench", 100, 66, (graphics) => {
    graphics
      .fillStyle(PALETTE.night, 0.2)
      .fillRect(13, 52, 82, 8)
      .fillStyle(PALETTE.ink)
      .fillRect(8, 12, 84, 11)
      .fillRect(8, 27, 84, 14)
      .fillRect(16, 40, 8, 20)
      .fillRect(76, 40, 8, 20)
      .fillStyle(0x9b714b)
      .fillRect(12, 15, 76, 5)
      .fillRect(12, 30, 76, 8)
      .fillStyle(lightenColour(0x9b714b))
      .fillRect(12, 30, 76, 3);
  });

  makeTexture(scene, "prop-bin", 42, 54, (graphics) => {
    graphics
      .fillStyle(PALETTE.night, 0.2)
      .fillEllipse(23, 49, 30, 8);
    drawPixelBlock(graphics, 8, 13, 26, 34, PALETTE.teal, 3, false);
    graphics
      .fillStyle(PALETTE.gold)
      .fillRect(5, 8, 32, 8)
      .fillStyle(PALETTE.ink)
      .fillRect(10, 21, 22, 4);
  });

  makeTexture(scene, "prop-lamp", 38, 116, (graphics) => {
    graphics
      .fillStyle(PALETTE.night, 0.18)
      .fillEllipse(20, 108, 30, 8)
      .fillStyle(PALETTE.ink)
      .fillRect(16, 24, 7, 83)
      .fillRect(7, 7, 25, 23)
      .fillStyle(0x355b68)
      .fillRect(18, 27, 3, 77)
      .fillStyle(PALETTE.gold)
      .fillRect(11, 11, 17, 14)
      .fillStyle(PALETTE.cream)
      .fillRect(13, 12, 8, 5);
  });

  makeTexture(scene, "prop-bike-rack", 106, 64, (graphics) => {
    graphics
      .lineStyle(5, PALETTE.ink)
      .strokeCircle(28, 42, 17)
      .strokeCircle(77, 42, 17)
      .lineBetween(28, 42, 47, 18)
      .lineBetween(47, 18, 60, 42)
      .lineBetween(28, 42, 60, 42)
      .lineBetween(47, 18, 77, 42)
      .lineBetween(44, 17, 57, 17)
      .lineBetween(60, 42, 70, 18)
      .lineBetween(66, 17, 77, 17)
      .lineStyle(2, PALETTE.gold)
      .strokeCircle(28, 42, 13)
      .strokeCircle(77, 42, 13);
  });

  makeTexture(scene, "prop-planter", 76, 64, (graphics) => {
    graphics
      .fillStyle(PALETTE.night, 0.18)
      .fillEllipse(39, 59, 54, 8)
      .fillStyle(PALETTE.ink)
      .fillRect(13, 36, 52, 23)
      .fillStyle(PALETTE.coral)
      .fillRect(17, 39, 44, 16)
      .fillStyle(darkenColour(PALETTE.coral))
      .fillRect(17, 51, 44, 4)
      .fillStyle(PALETTE.ink)
      .fillRect(21, 12, 9, 29)
      .fillRect(35, 5, 9, 36)
      .fillRect(49, 14, 9, 27)
      .fillStyle(PALETTE.green)
      .fillRect(23, 9, 5, 27)
      .fillRect(37, 2, 5, 36)
      .fillRect(51, 11, 5, 29);
  });

  makeTexture(scene, "prop-tray-return", 96, 112, (graphics) => {
    graphics
      .fillStyle(PALETTE.night, 0.2)
      .fillEllipse(49, 105, 75, 11);
    drawPixelBlock(graphics, 12, 17, 72, 82, PALETTE.teal, 4, false);
    graphics
      .fillStyle(PALETTE.gold)
      .fillRect(17, 22, 62, 17)
      .fillStyle(PALETTE.ink)
      .fillRect(24, 27, 48, 6);
    for (let shelf = 0; shelf < 3; shelf += 1) {
      graphics
        .fillStyle(PALETTE.ink)
        .fillRect(20, 47 + shelf * 17, 56, 10)
        .fillStyle(PALETTE.concreteEdge)
        .fillRect(25, 50 + shelf * 17, 46, 4)
        .fillStyle(PALETTE.cream)
        .fillRect(29 + shelf * 4, 47 + shelf * 17, 35, 3);
    }
  });

  makeTexture(scene, "prop-market-crates", 122, 76, (graphics) => {
    graphics
      .fillStyle(PALETTE.night, 0.2)
      .fillEllipse(62, 69, 110, 11);
    const crates: readonly [number, number, number][] = [
      [5, 31, PALETTE.coral],
      [43, 23, PALETTE.gold],
      [80, 34, PALETTE.green],
    ];
    for (const [x, y, colour] of crates) {
      drawPixelBlock(graphics, x + 5, y, 33, 32, colour, 3, false);
      graphics
        .fillStyle(PALETTE.ink)
        .fillRect(x + 10, y + 10, 23, 4)
        .fillRect(x + 10, y + 22, 23, 4)
        .fillStyle(lightenColour(colour, 0.24))
        .fillRect(x + 12, y + 4, 7, 6)
        .fillRect(x + 24, y + 16, 7, 6);
    }
  });

  makeTexture(scene, "prop-exercise-corner", 182, 124, (graphics) => {
    graphics
      .fillStyle(PALETTE.night, 0.2)
      .fillEllipse(91, 115, 174, 15)
      .fillStyle(PALETTE.ink)
      .fillRect(4, 94, 174, 24)
      .fillStyle(PALETTE.green)
      .fillRect(9, 98, 164, 15)
      .fillStyle(PALETTE.gold)
      .fillRect(9, 98, 164, 4)
      .fillStyle(PALETTE.ink)
      .fillRect(28, 25, 8, 74)
      .fillRect(68, 35, 8, 64)
      .fillRect(110, 31, 8, 68)
      .fillRect(148, 46, 8, 53)
      .lineStyle(7, PALETTE.ink)
      .strokeCircle(32, 30, 17)
      .strokeCircle(114, 35, 19)
      .lineBetween(72, 42, 51, 84)
      .lineBetween(72, 42, 91, 84)
      .lineBetween(152, 50, 132, 84)
      .lineBetween(152, 50, 168, 84)
      .lineStyle(3, PALETTE.coral)
      .strokeCircle(32, 30, 12)
      .lineStyle(3, PALETTE.teal)
      .strokeCircle(114, 35, 14)
      .lineStyle(5, PALETTE.gold)
      .lineBetween(52, 84, 45, 96)
      .lineBetween(91, 84, 98, 96)
      .lineBetween(132, 84, 126, 96)
      .lineBetween(168, 84, 173, 96);
  });

  makeTexture(scene, "prop-dragon-playground", 282, 160, (graphics) => {
    graphics
      .fillStyle(PALETTE.ink)
      .fillEllipse(141, 142, 274, 32)
      .fillStyle(PALETTE.sand)
      .fillEllipse(141, 138, 264, 24)
      .fillStyle(PALETTE.ink)
      .fillRect(59, 62, 134, 75)
      .fillRect(185, 43, 63, 72)
      .fillTriangle(190, 49, 199, 24, 211, 52)
      .fillTriangle(225, 47, 240, 24, 242, 58)
      .fillStyle(PALETTE.coral)
      .fillRect(65, 67, 122, 64)
      .fillRect(191, 49, 51, 60)
      .fillTriangle(194, 48, 201, 31, 209, 53)
      .fillTriangle(226, 48, 237, 31, 238, 58)
      .fillStyle(PALETTE.night)
      .fillRect(91, 89, 71, 48)
      .fillEllipse(126, 91, 72, 42)
      .fillStyle(PALETTE.gold)
      .fillRect(17, 106, 48, 17)
      .fillRect(31, 88, 48, 18)
      .fillRect(45, 72, 43, 17)
      .fillStyle(PALETTE.cream)
      .fillRect(202, 58, 10, 10)
      .fillRect(228, 58, 10, 10)
      .fillStyle(PALETTE.ink)
      .fillRect(205, 61, 4, 4)
      .fillRect(231, 61, 4, 4)
      .fillRect(221, 83, 20, 6);
    const mosaic: readonly [number, number, number][] = [
      [72, 74, PALETTE.gold],
      [89, 74, PALETTE.teal],
      [106, 74, PALETTE.cream],
      [123, 74, PALETTE.gold],
      [140, 74, PALETTE.teal],
      [157, 74, PALETTE.cream],
      [174, 74, PALETTE.gold],
      [72, 113, PALETTE.teal],
      [174, 113, PALETTE.teal],
      [199, 91, PALETTE.gold],
      [215, 103, PALETTE.teal],
    ];
    for (const [x, y, colour] of mosaic) {
      graphics
        .fillStyle(PALETTE.ink)
        .fillRect(x - 2, y - 2, 13, 13)
        .fillStyle(colour)
        .fillRect(x, y, 9, 9);
    }
  });

  makeTexture(scene, "prop-chess-table", 158, 102, (graphics) => {
    graphics
      .fillStyle(PALETTE.night, 0.22)
      .fillEllipse(79, 93, 142, 13);
    const stools: readonly [number, number][] = [
      [24, 48],
      [134, 48],
      [42, 84],
      [116, 84],
    ];
    for (const [x, y] of stools) {
      graphics
        .fillStyle(PALETTE.ink)
        .fillRect(x - 5, y, 10, 30)
        .fillEllipse(x, y, 34, 18)
        .fillStyle(PALETTE.concreteEdge)
        .fillRect(x - 2, y + 3, 4, 24)
        .fillEllipse(x, y - 1, 26, 11)
        .fillStyle(lightenColour(PALETTE.concreteEdge, 0.24))
        .fillEllipse(x - 3, y - 3, 15, 5);
    }
    graphics
      .fillStyle(PALETTE.ink)
      .fillRect(72, 44, 14, 41)
      .fillEllipse(79, 43, 86, 45)
      .fillStyle(PALETTE.teal)
      .fillRect(76, 46, 6, 36)
      .fillStyle(PALETTE.concreteEdge)
      .fillEllipse(79, 39, 78, 37)
      .fillStyle(lightenColour(PALETTE.concreteEdge, 0.22))
      .fillEllipse(74, 34, 62, 22);
    for (let row = 0; row < 6; row += 1) {
      for (let column = 0; column < 8; column += 1) {
        graphics
          .fillStyle((row + column) % 2 === 0 ? PALETTE.cream : PALETTE.ink)
          .fillRect(57 + column * 6, 27 + row * 4, 6, 4);
      }
    }
  });

  makeTexture(scene, "prop-bike-planters", 220, 96, (graphics) => {
    graphics
      .fillStyle(PALETTE.night, 0.2)
      .fillEllipse(110, 88, 206, 13);
    for (const x of [8, 182]) {
      drawPixelBlock(graphics, x, 55, 30, 30, PALETTE.coral, 3, false);
      graphics
        .fillStyle(PALETTE.ink)
        .fillRect(x + 7, 27, 6, 31)
        .fillRect(x + 18, 19, 6, 39)
        .fillStyle(PALETTE.green)
        .fillRect(x + 9, 24, 3, 31)
        .fillRect(x + 20, 16, 3, 39)
        .fillStyle(lightenColour(PALETTE.green, 0.2))
        .fillRect(x + 5, 31, 11, 4)
        .fillRect(x + 16, 24, 12, 4);
    }
    const bicycle = (
      left: number,
      colour: number,
      handleRise: number,
    ): void => {
      graphics
        .lineStyle(6, PALETTE.ink)
        .strokeCircle(left + 22, 67, 18)
        .strokeCircle(left + 75, 67, 18)
        .lineBetween(left + 22, 67, left + 44, 37)
        .lineBetween(left + 44, 37, left + 58, 67)
        .lineBetween(left + 22, 67, left + 58, 67)
        .lineBetween(left + 44, 37, left + 75, 67)
        .lineBetween(left + 58, 67, left + 68, 35 - handleRise)
        .lineBetween(left + 64, 34 - handleRise, left + 78, 34 - handleRise)
        .lineBetween(left + 39, 36, left + 51, 36)
        .lineStyle(3, colour)
        .strokeCircle(left + 22, 67, 14)
        .strokeCircle(left + 75, 67, 14)
        .lineBetween(left + 22, 67, left + 44, 39)
        .lineBetween(left + 44, 39, left + 58, 67)
        .lineBetween(left + 22, 67, left + 58, 67)
        .lineBetween(left + 44, 39, left + 75, 67);
    };
    bicycle(22, PALETTE.gold, 0);
    bicycle(100, PALETTE.teal, 4);
  });

  makeTexture(scene, "prop-maintenance-trolley", 118, 104, (graphics) => {
    graphics
      .fillStyle(PALETTE.night, 0.22)
      .fillEllipse(59, 96, 102, 12)
      .lineStyle(6, PALETTE.ink)
      .lineBetween(18, 28, 22, 88)
      .lineBetween(22, 31, 82, 31)
      .lineBetween(82, 31, 88, 88)
      .lineBetween(24, 84, 88, 84)
      .fillStyle(PALETTE.ink)
      .fillRect(25, 50, 58, 34)
      .fillStyle(PALETTE.teal)
      .fillRect(30, 55, 48, 24)
      .fillStyle(lightenColour(PALETTE.teal, 0.2))
      .fillRect(30, 55, 48, 4)
      .fillStyle(PALETTE.ink)
      .fillEllipse(31, 89, 14, 14)
      .fillEllipse(82, 89, 14, 14)
      .fillStyle(PALETTE.concreteEdge)
      .fillEllipse(31, 89, 6, 6)
      .fillEllipse(82, 89, 6, 6)
      .fillStyle(PALETTE.ink)
      .fillEllipse(58, 48, 33, 15)
      .fillRect(43, 48, 30, 20)
      .fillStyle(PALETTE.coral)
      .fillEllipse(58, 46, 27, 10)
      .fillRect(47, 49, 22, 15)
      .lineStyle(6, PALETTE.ink)
      .lineBetween(91, 16, 101, 83)
      .lineStyle(3, 0x9b714b)
      .lineBetween(91, 17, 101, 82)
      .fillStyle(PALETTE.gold)
      .fillTriangle(91, 77, 111, 91, 93, 93);
  });

  makeTexture(scene, "prop-utility-service", 150, 104, (graphics) => {
    graphics
      .fillStyle(PALETTE.night, 0.22)
      .fillEllipse(76, 96, 134, 12);
    drawPixelBlock(graphics, 12, 25, 52, 66, PALETTE.teal, 4, false);
    graphics
      .fillStyle(lightenColour(PALETTE.teal, 0.22))
      .fillRect(18, 31, 39, 6)
      .fillStyle(PALETTE.ink)
      .fillRect(25, 46, 27, 5)
      .fillRect(31, 62, 15, 4)
      .fillStyle(PALETTE.gold)
      .fillRect(48, 75, 7, 7)
      .fillStyle(PALETTE.ink)
      .fillRect(75, 33, 58, 58)
      .fillStyle(PALETTE.coral)
      .fillRect(80, 38, 48, 48)
      .fillStyle(PALETTE.ink)
      .fillEllipse(104, 62, 38, 38)
      .fillStyle(PALETTE.gold)
      .fillEllipse(104, 62, 26, 26)
      .fillStyle(PALETTE.ink)
      .fillEllipse(104, 62, 10, 10)
      .lineStyle(5, PALETTE.ink)
      .lineBetween(124, 64, 140, 82)
      .lineBetween(140, 82, 134, 94)
      .lineStyle(2, PALETTE.gold)
      .lineBetween(124, 64, 140, 82)
      .lineBetween(140, 82, 134, 94)
      .fillStyle(PALETTE.ink)
      .fillRect(68, 92, 76, 8);
    for (let x = 72; x < 140; x += 10) {
      graphics
        .fillStyle(PALETTE.concreteEdge)
        .fillRect(x, 94, 5, 3);
    }
  });

  makeTexture(scene, "prop-chair-stack", 132, 110, (graphics) => {
    graphics
      .fillStyle(PALETTE.night, 0.2)
      .fillEllipse(66, 102, 118, 12)
      .fillStyle(PALETTE.ink)
      .fillRect(8, 6, 74, 52)
      .fillRect(14, 58, 7, 38)
      .fillRect(69, 58, 7, 38)
      .fillStyle(0x9b714b)
      .fillRect(13, 11, 64, 42)
      .fillStyle(PALETTE.cream)
      .fillRect(20, 18, 17, 12)
      .fillStyle(PALETTE.gold)
      .fillRect(44, 16, 25, 15)
      .fillStyle(PALETTE.teal)
      .fillRect(23, 37, 40, 8);
    const chairs: readonly [number, number, number][] = [
      [82, 54, PALETTE.teal],
      [91, 46, PALETTE.coral],
      [100, 38, PALETTE.purple],
    ];
    for (const [x, y, colour] of chairs) {
      graphics
        .fillStyle(PALETTE.ink)
        .fillRect(x, y, 24, 35)
        .fillRect(x - 3, y + 29, 6, 31)
        .fillRect(x + 21, y + 29, 6, 31)
        .fillStyle(colour)
        .fillRect(x + 4, y + 4, 16, 19)
        .fillRect(x + 3, y + 26, 18, 6);
    }
  });

  makeTexture(scene, "prop-shaded-seating", 226, 128, (graphics) => {
    graphics
      .fillStyle(PALETTE.night, 0.24)
      .fillEllipse(112, 118, 214, 16)
      .fillStyle(PALETTE.ink)
      .fillRect(11, 15, 204, 18)
      .fillRect(18, 31, 9, 83)
      .fillRect(199, 31, 9, 83)
      .fillStyle(0x35633f)
      .fillRect(16, 19, 194, 9)
      .fillStyle(0x5f9a58)
      .fillRect(16, 15, 194, 10)
      .fillStyle(0x80b36c)
      .fillRect(22, 11, 35, 9)
      .fillRect(51, 8, 43, 11)
      .fillRect(89, 12, 39, 9)
      .fillRect(121, 7, 47, 12)
      .fillRect(162, 11, 39, 9)
      .fillStyle(lightenColour(0x80b36c, 0.16))
      .fillRect(29, 10, 19, 4)
      .fillRect(59, 7, 23, 4)
      .fillRect(130, 6, 26, 4)
      .fillRect(172, 10, 18, 4)
      .fillStyle(PALETTE.ink)
      .fillRect(52, 76, 122, 14)
      .fillRect(58, 90, 8, 23)
      .fillRect(160, 90, 8, 23)
      .fillStyle(0x9b714b)
      .fillRect(57, 79, 112, 7)
      .fillStyle(PALETTE.ink)
      .fillRect(7, 89, 52, 28)
      .fillRect(167, 89, 52, 28)
      .fillStyle(PALETTE.coral)
      .fillRect(12, 94, 42, 18)
      .fillRect(172, 94, 42, 18);
    const sitters: readonly [number, number, number, number][] = [
      [83, 54, 0xbd895d, PALETTE.coral],
      [134, 53, 0xd6a177, PALETTE.teal],
    ];
    for (const [x, y, skin, shirt] of sitters) {
      graphics
        .fillStyle(PALETTE.ink)
        .fillRect(x - 9, y, 18, 18)
        .fillStyle(skin)
        .fillRect(x - 6, y + 3, 12, 12)
        .fillStyle(0xa9a39b)
        .fillRect(x - 8, y, 16, 6)
        .fillStyle(PALETTE.ink)
        .fillRect(x - 11, y + 18, 22, 24)
        .fillRect(x - 12, y + 39, 10, 6)
        .fillRect(x + 2, y + 39, 10, 6)
        .fillStyle(shirt)
        .fillRect(x - 8, y + 21, 16, 17);
    }
    for (const [baseX, flip] of [[26, 1], [189, -1]] as const) {
      graphics
        .fillStyle(PALETTE.ink)
        .fillRect(baseX, 49, 7, 46)
        .fillRect(baseX + flip * 10, 57, 6, 35)
        .fillStyle(PALETTE.green)
        .fillRect(baseX + 2, 45, 3, 47)
        .fillRect(baseX + flip * 10 + 2, 53, 3, 36)
        .fillStyle(lightenColour(PALETTE.green, 0.2))
        .fillRect(baseX - 7, 51, 17, 5)
        .fillRect(baseX + flip * 4, 61, 17, 5);
    }
  });

  makeTexture(scene, "prop-courtyard-planter-bed", 380, 105, (graphics) => {
    drawShearedShadow(graphics, 12, 92, 345, 8, 14);
    graphics
      .fillStyle(0x78a55d)
      .fillRect(9, 18, 362, 77)
      .fillStyle(darkenColour(PALETTE.grass, 0.08), 0.72)
      .fillRect(18, 30, 344, 6)
      .fillRect(18, 75, 344, 4)
      .fillStyle(0x6d4f38)
      .fillRect(18, 20, 344, 9)
      .fillStyle(PALETTE.ink)
      .fillRect(3, 8, 374, 20)
      .fillRect(3, 22, 17, 78)
      .fillRect(360, 22, 17, 78)
      .fillRect(3, 84, 374, 16)
      .fillStyle(PALETTE.concreteEdge)
      .fillRect(8, 13, 364, 10)
      .fillRect(8, 24, 8, 70)
      .fillRect(364, 24, 8, 70)
      .fillRect(8, 89, 364, 6)
      .fillStyle(lightenColour(PALETTE.concreteEdge, 0.22))
      .fillRect(10, 13, 360, 3)
      .fillRect(10, 89, 360, 2)
      .fillRect(8, 26, 3, 56)
      .fillStyle(darkenColour(PALETTE.concreteEdge, 0.14))
      .fillRect(369, 26, 3, 62)
      .fillRect(11, 94, 358, 2);

    const planting: readonly [number, number, number][] = [
      [33, 20, PALETTE.coral],
      [58, 17, PALETTE.cream],
      [85, 20, PALETTE.gold],
      [116, 16, PALETTE.purple],
      [149, 20, PALETTE.coral],
      [184, 17, PALETTE.cream],
      [218, 20, PALETTE.gold],
      [252, 16, PALETTE.coral],
      [288, 20, PALETTE.purple],
      [323, 17, PALETTE.cream],
      [347, 20, PALETTE.gold],
    ];
    for (const [x, y, flower] of planting) {
      graphics
        .fillStyle(PALETTE.green)
        .fillRect(x, y, 3, 15)
        .fillRect(x - 5, y + 8, 13, 3)
        .fillStyle(flower)
        .fillRect(x - 4, y - 2, 11, 5)
        .fillRect(x - 1, y - 5, 5, 11)
        .fillStyle(PALETTE.gold)
        .fillRect(x + 1, y, 2, 2);
    }
    for (let x = 35; x < 350; x += 49) {
      graphics
        .fillStyle(lightenColour(PALETTE.grass, 0.14), 0.72)
        .fillRect(x, 45 + (x % 3) * 5, 13, 4)
        .fillStyle(PALETTE.grassDark, 0.65)
        .fillRect(x + 7, 62 + (x % 4) * 3, 2, 7)
        .fillRect(x + 11, 65 + (x % 4) * 3, 2, 4);
    }
  });

  makeTexture(scene, "prop-service-courtyard-bay", 330, 105, (graphics) => {
    drawShearedShadow(graphics, 12, 91, 298, 8, 13);
    graphics
      .fillStyle(PALETTE.ink)
      .fillRect(4, 24, 322, 73)
      .fillStyle(PALETTE.sand)
      .fillRect(10, 30, 310, 61)
      .fillStyle(lightenColour(PALETTE.sand, 0.12))
      .fillRect(10, 30, 310, 3)
      .fillStyle(darkenColour(PALETTE.sand, 0.1), 0.5)
      .fillRect(10, 61, 310, 2);
    for (let x = 24; x < 315; x += 48) {
      graphics
        .fillStyle(darkenColour(PALETTE.sand, 0.08), 0.55)
        .fillRect(x, 32, 2, 57);
    }
    graphics
      .fillStyle(PALETTE.ink)
      .fillRect(15, 8, 8, 55)
      .fillRect(307, 8, 8, 55)
      .fillRect(17, 12, 294, 8)
      .fillStyle(darkenColour(PALETTE.teal, 0.08))
      .fillRect(19, 14, 290, 3);
    for (let x = 42; x < 306; x += 44) {
      graphics
        .fillStyle(PALETTE.ink)
        .fillRect(x, 17, 5, 43)
        .fillStyle(0x5f7f82)
        .fillRect(x + 2, 20, 2, 37);
    }
    graphics
      .fillStyle(PALETTE.ink)
      .fillRect(245, 78, 57, 12)
      .fillStyle(darkenColour(PALETTE.concreteEdge, 0.22))
      .fillRect(250, 81, 47, 6);
    for (let x = 253; x < 297; x += 8) {
      graphics.fillStyle(PALETTE.ink).fillRect(x, 82, 3, 4);
    }
  });

}

function drawAmbientSweeper(
  graphics: Phaser.GameObjects.Graphics,
  frame: 0 | 1,
): void {
  const broomTopX = frame === 0 ? 51 : 47;
  const broomBottomX = frame === 0 ? 63 : 57;
  graphics
    .fillStyle(PALETTE.night, 0.2)
    .fillEllipse(35, 73, 59, 9)
    .lineStyle(5, PALETTE.ink)
    .lineBetween(broomTopX, 28, broomBottomX, 67)
    .lineStyle(2, 0x9b714b)
    .lineBetween(broomTopX, 29, broomBottomX, 66)
    .fillStyle(PALETTE.ink)
    .fillTriangle(broomBottomX - 8, 63, broomBottomX + 11, 67, broomBottomX - 5, 73)
    .fillStyle(PALETTE.gold)
    .fillTriangle(broomBottomX - 4, 64, broomBottomX + 7, 67, broomBottomX - 3, 70)
    .fillStyle(PALETTE.ink)
    .fillRect(17 + frame * 2, 59, 9, 13)
    .fillRect(32 - frame * 2, 59, 9, 13)
    .fillStyle(darkenColour(PALETTE.teal, 0.1))
    .fillRect(20 + frame * 2, 60, 4, 9)
    .fillRect(35 - frame * 2, 60, 4, 9);
  drawPixelBlock(graphics, 19, 31, 23, 31, PALETTE.teal, 3, false);
  graphics
    .fillStyle(PALETTE.ink)
    .fillRect(16, 8, 27, 23)
    .fillStyle(0xbd895d)
    .fillRect(20, 11, 19, 17)
    .fillStyle(0xa9a39b)
    .fillRect(18, 8, 23, 8)
    .fillRect(18, 12, 5, 10)
    .fillStyle(PALETTE.cream)
    .fillRect(20, 9, 9, 3)
    .fillStyle(PALETTE.ink)
    .fillRect(34, 18, 3, 3)
    .lineStyle(6, PALETTE.ink)
    .lineBetween(39, 37, broomTopX, 31 + frame * 3)
    .lineStyle(3, 0xbd895d)
    .lineBetween(39, 37, broomTopX, 31 + frame * 3);
}

function drawAmbientGardener(
  graphics: Phaser.GameObjects.Graphics,
  frame: 0 | 1,
): void {
  const handX = frame === 0 ? 52 : 56;
  const canTilt = frame === 0 ? 0 : 3;
  graphics
    .fillStyle(PALETTE.night, 0.2)
    .fillEllipse(47, 66, 87, 10)
    .fillStyle(PALETTE.ink)
    .fillRect(61, 47, 27, 17)
    .fillStyle(0x8b6548)
    .fillRect(64, 50, 21, 11)
    .fillStyle(PALETTE.ink)
    .fillRect(67, 36, 4, 16)
    .fillRect(76, 31, 4, 21)
    .fillRect(84, 39, 4, 13)
    .fillStyle(PALETTE.green)
    .fillRect(69, 34, 3, 15)
    .fillRect(78, 29, 3, 20)
    .fillRect(86, 37, 3, 12)
    .fillStyle(PALETTE.gold)
    .fillRect(65, 32, 8, 6)
    .fillStyle(PALETTE.coral)
    .fillRect(75, 26, 8, 6)
    .fillStyle(PALETTE.cream)
    .fillRect(82, 35, 8, 6)
    .fillStyle(PALETTE.ink)
    .fillRect(16, 49, 18, 15)
    .fillRect(31, 57, 20, 8)
    .fillStyle(darkenColour(PALETTE.purple, 0.08))
    .fillRect(19, 51, 13, 10)
    .fillRect(34, 59, 14, 4);
  drawPixelBlock(graphics, 19, 29, 28, 25, PALETTE.purple, 3, false);
  graphics
    .fillStyle(PALETTE.ink)
    .fillRect(19, 9, 25, 21)
    .fillStyle(0xa8703f)
    .fillRect(22, 12, 19, 16)
    .fillStyle(0x8a633e)
    .fillRect(20, 9, 23, 7)
    .fillStyle(PALETTE.gold)
    .fillRect(14, 7, 36, 6)
    .fillRect(20, 4, 23, 6)
    .fillStyle(PALETTE.ink)
    .fillRect(37, 18, 3, 3)
    .lineStyle(6, PALETTE.ink)
    .lineBetween(44, 35, handX, 46)
    .lineStyle(3, 0xa8703f)
    .lineBetween(44, 35, handX, 46)
    .fillStyle(PALETTE.ink)
    .fillRect(48 + canTilt, 43, 17, 13)
    .fillRect(60 + canTilt, 39, 10, 4)
    .fillStyle(PALETTE.teal)
    .fillRect(51 + canTilt, 46, 11, 8)
    .fillRect(62 + canTilt, 41, 6, 2);
  if (frame === 1) {
    graphics
      .fillStyle(0x79a7b3)
      .fillRect(70, 48, 3, 3)
      .fillRect(74, 51, 2, 2);
  }
}

function drawAmbientNoticeboard(
  graphics: Phaser.GameObjects.Graphics,
  frame: 0 | 1,
): void {
  graphics
    .fillStyle(PALETTE.night, 0.2)
    .fillEllipse(72, 76, 130, 10);
  drawPixelBlock(graphics, 38, 6, 94, 45, 0x9b714b, 3, false);
  graphics
    .fillStyle(PALETTE.cream)
    .fillRect(46, 14, 23, 15)
    .fillRect(76, 12, 18, 22)
    .fillRect(101, 17, 23, 12)
    .fillStyle(PALETTE.coral)
    .fillRect(50, 18, 15, 3)
    .fillStyle(PALETTE.teal)
    .fillRect(80, 17, 10, 3)
    .fillStyle(PALETTE.gold)
    .fillRect(105, 21, 15, 3)
    .fillStyle(PALETTE.ink)
    .fillRect(48, 49, 7, 27)
    .fillRect(115, 49, 7, 27);

  const leftArmY = frame === 0 ? 38 : 34;
  graphics
    .fillStyle(PALETTE.ink)
    .fillRect(9, 25, 23, 19)
    .fillStyle(0xbd895d)
    .fillRect(13, 28, 16, 14)
    .fillStyle(0xa9a39b)
    .fillRect(11, 25, 19, 7)
    .fillStyle(PALETTE.ink)
    .fillRect(13, 44, 21, 25)
    .fillRect(11, 67, 9, 8)
    .fillRect(27, 67, 9, 8)
    .fillStyle(PALETTE.coral)
    .fillRect(16, 47, 15, 18)
    .lineStyle(6, PALETTE.ink)
    .lineBetween(31, 48, 47, leftArmY)
    .lineStyle(3, 0xbd895d)
    .lineBetween(31, 48, 47, leftArmY)
    .fillStyle(PALETTE.ink)
    .fillRect(136, 26, 22, 19)
    .fillStyle(0xe3b58c)
    .fillRect(139, 29, 16, 14)
    .fillStyle(0x2a2523)
    .fillRect(137, 26, 20, 7)
    .fillStyle(PALETTE.ink)
    .fillRect(132, 45, 25, 24)
    .fillRect(132, 67, 9, 8)
    .fillRect(149, 67, 9, 8)
    .fillStyle(PALETTE.teal)
    .fillRect(135, 48, 19, 17);
  if (frame === 1) {
    graphics
      .lineStyle(6, PALETTE.ink)
      .lineBetween(136, 49, 123, 42)
      .lineStyle(3, 0xe3b58c)
      .lineBetween(136, 49, 123, 42);
  }
}

function drawAmbientKopitiam(
  graphics: Phaser.GameObjects.Graphics,
  frame: 0 | 1,
): void {
  const leftSkin = 0xb87f52;
  const rightSkin = 0xd6a177;
  const cupY = frame === 0 ? 38 : 31;

  // Grounding and chair silhouettes sit behind the regulars so their seated
  // posture reads even when the table overlaps their lower bodies.
  graphics
    .fillStyle(PALETTE.night, 0.2)
    .fillEllipse(69, 73, 132, 9)
    .fillStyle(PALETTE.ink)
    .fillRect(8, 51, 5, 20)
    .fillRect(34, 51, 5, 20)
    .fillRect(102, 51, 5, 20)
    .fillRect(127, 51, 5, 20)
    .fillRect(11, 48, 27, 5)
    .fillRect(103, 48, 27, 5);

  // Left regular: silver side-part, square spectacles, collared shirt, and a
  // raised enamel cup. Small asymmetric details prevent the old blocky clone
  // look while keeping the two-frame animation inexpensive.
  graphics
    .fillStyle(PALETTE.ink)
    .fillRect(8, 12, 29, 28)
    .fillRect(6, 21, 5, 11)
    .fillRect(34, 21, 5, 11)
    .fillStyle(leftSkin)
    .fillRect(11, 16, 23, 20)
    .fillRect(7, 23, 4, 7)
    .fillRect(34, 23, 4, 7)
    .fillStyle(0xa9a39b)
    .fillRect(9, 12, 27, 8)
    .fillRect(10, 19, 7, 3)
    .fillStyle(PALETTE.cream)
    .fillRect(24, 13, 3, 3)
    .fillStyle(PALETTE.ink)
    .fillRect(14, 24, 3, 3)
    .fillRect(28, 24, 3, 3)
    .fillRect(21, 28, 3, 4)
    .fillRect(19, 34, 8, 2)
    .lineStyle(2, PALETTE.ink)
    .strokeRect(11, 21, 9, 8)
    .strokeRect(25, 21, 9, 8)
    .lineBetween(20, 24, 25, 24)
    .fillStyle(PALETTE.ink)
    .fillRect(6, 39, 35, 29)
    .fillStyle(PALETTE.purple)
    .fillRect(10, 42, 27, 22)
    .fillStyle(PALETTE.cream)
    .fillTriangle(12, 42, 21, 42, 21, 50)
    .fillTriangle(24, 42, 33, 42, 24, 50)
    .fillStyle(PALETTE.gold)
    .fillRect(22, 50, 2, 2)
    .fillRect(22, 56, 2, 2)
    .fillStyle(PALETTE.ink)
    .fillRect(8, 64, 12, 7)
    .fillRect(28, 64, 12, 7);

  // Right regular: swept bun, brows and smile, blouse piping, pocket, and a
  // folded morning paper. The different silhouette makes the pair readable as
  // two neighbours rather than recolours of one sprite.
  graphics
    .fillStyle(PALETTE.ink)
    .fillRect(101, 13, 29, 27)
    .fillRect(99, 22, 5, 10)
    .fillRect(127, 22, 5, 10)
    .fillCircle(126, 12, 7)
    .fillStyle(rightSkin)
    .fillRect(104, 17, 23, 19)
    .fillRect(100, 24, 4, 6)
    .fillRect(127, 24, 4, 6)
    .fillStyle(0x2a2523)
    .fillRect(102, 13, 27, 8)
    .fillRect(119, 11, 10, 7)
    .fillRect(105, 21, 5, 2)
    .fillRect(120, 21, 5, 2)
    .fillStyle(PALETTE.ink)
    .fillRect(108, 25, 3, 3)
    .fillRect(121, 25, 3, 3)
    .fillRect(115, 29, 3, 3)
    .fillRect(112, 34, 9, 2)
    .fillStyle(PALETTE.gold)
    .fillRect(128, 25, 3, 5)
    .fillStyle(PALETTE.ink)
    .fillRect(99, 39, 34, 29)
    .fillStyle(PALETTE.coral)
    .fillRect(103, 42, 26, 22)
    .fillStyle(PALETTE.cream)
    .fillRect(106, 42, 20, 3)
    .fillRect(115, 45, 2, 17)
    .fillStyle(PALETTE.ink)
    .fillRect(119, 50, 7, 6)
    .fillStyle(PALETTE.gold)
    .fillRect(116, 48, 2, 2)
    .fillRect(116, 55, 2, 2)
    .fillStyle(PALETTE.ink)
    .fillRect(100, 64, 12, 7)
    .fillRect(122, 64, 12, 7);

  // Table and shared breakfast details occupy the foreground. Arms are drawn
  // last so hands visibly meet the cup and newspaper instead of disappearing
  // behind the tabletop.
  graphics
    .fillStyle(PALETTE.ink)
    .fillRect(58, 47, 22, 24)
    .fillEllipse(69, 45, 82, 25)
    .fillStyle(PALETTE.teal)
    .fillRect(63, 49, 12, 19)
    .fillStyle(lightenColour(PALETTE.teal, 0.2))
    .fillEllipse(69, 43, 73, 18)
    .fillStyle(PALETTE.cream)
    .fillEllipse(72, 42, 20, 7)
    .fillStyle(0xc78345)
    .fillRect(65, 39, 14, 5)
    .fillStyle(PALETTE.ink)
    .lineStyle(6, PALETTE.ink)
    .lineBetween(36, 47, 55, cupY + 4)
    .lineStyle(3, leftSkin)
    .lineBetween(36, 47, 55, cupY + 4)
    .fillCircle(55, cupY + 4, 3)
    .lineStyle(6, PALETTE.ink)
    .lineBetween(102, 47, 88, 42)
    .lineStyle(3, rightSkin)
    .lineBetween(102, 47, 88, 42)
    .fillCircle(87, 42, 3)
    .fillStyle(PALETTE.ink)
    .fillRect(52, cupY - 1, 12, 10)
    .fillStyle(PALETTE.cream)
    .fillRect(54, cupY, 8, 7)
    .fillRect(63, cupY + 2, 3, 4)
    .fillStyle(PALETTE.ink)
    .fillRect(81, 35, 22, 13)
    .fillStyle(PALETTE.cream)
    .fillRect(83, 37, 18, 9)
    .fillStyle(PALETTE.teal)
    .fillRect(85, 39, 6, 2)
    .fillStyle(PALETTE.ink)
    .fillRect(93, 39, 6, 1)
    .fillRect(85, 43, 14, 1);

  if (frame === 1) {
    graphics
      .fillStyle(rightSkin)
      .fillCircle(93, 36, 3)
      .fillStyle(PALETTE.gold)
      .fillRect(88, 32, 3, 3);
  }

  const steamLift = frame === 0 ? 0 : -3;
  graphics
    .fillStyle(PALETTE.cream, 0.78)
    .fillRect(56, cupY - 7 + steamLift, 2, 5)
    .fillRect(60, cupY - 10 - steamLift, 2, 5);
}

function drawAmbientChessPlayers(
  graphics: Phaser.GameObjects.Graphics,
  frame: 0 | 1,
): void {
  type ChessPlayer = {
    x: number;
    y: number;
    skin: number;
    shirt: number;
    facing: -1 | 1;
    hair: "side-part" | "flat-cap" | "bald-crown";
    glasses: boolean;
  };
  const players: readonly ChessPlayer[] = [
    { x: 12, y: 19, skin: 0xbd895d, shirt: PALETTE.teal, facing: 1, hair: "side-part", glasses: false },
    { x: 126, y: 19, skin: 0xd6a177, shirt: PALETTE.coral, facing: -1, hair: "flat-cap", glasses: true },
    { x: 68, y: 42, skin: 0xa8703f, shirt: PALETTE.purple, facing: 1, hair: "bald-crown", glasses: false },
  ];
  graphics.fillStyle(PALETTE.night, 0.15).fillEllipse(80, 84, 148, 10);
  for (const player of players) {
    const { x, y, skin, shirt, facing, hair, glasses } = player;
    const faceLeft = x + 4;
    const eyeY = y + 11;
    graphics
      .fillStyle(PALETTE.ink)
      .fillRect(x, y, 26, 24)
      .fillStyle(skin)
      .fillRect(faceLeft, y + 4, 18, 17)
      .fillRect(x + (facing === 1 ? 22 : 1), y + 10, 5, 8)
      .fillStyle(PALETTE.ink)
      .fillRect(x - 3, y + 24, 32, 31)
      .fillRect(x - 1, y + 52, 11, 8)
      .fillRect(x + 18, y + 52, 11, 8)
      .fillStyle(shirt)
      .fillRect(x, y + 27, 25, 23)
      .fillStyle(lightenColour(shirt, 0.18))
      .fillTriangle(x + 3, y + 27, x + 11, y + 27, x + 8, y + 35)
      .fillTriangle(x + 14, y + 27, x + 22, y + 27, x + 17, y + 35)
      .fillStyle(PALETTE.cream, 0.78)
      .fillRect(x + 12, y + 36, 2, 2)
      .fillRect(x + 12, y + 42, 2, 2)
      .fillStyle(darkenColour(shirt, 0.18))
      .fillRect(x + (facing === 1 ? 3 : 16), y + 38, 7, 7)
      .fillStyle(PALETTE.concreteEdge)
      .fillRect(x + 1, y + 52, 8, 4)
      .fillRect(x + 19, y + 52, 8, 4);

    if (hair === "side-part") {
      graphics
        .fillStyle(0x918e89)
        .fillRect(x + 2, y, 22, 7)
        .fillRect(x + 2, y + 5, 5, 8)
        .fillStyle(0xc8c1b7)
        .fillRect(x + 7, y + 2, 12, 2)
        .fillStyle(PALETTE.ink)
        .fillRect(x + 17, y, 6, 2);
    } else if (hair === "flat-cap") {
      graphics
        .fillStyle(PALETTE.ink)
        .fillRect(x + 1, y - 2, 25, 5)
        .fillStyle(0x6c7778)
        .fillRect(x + 3, y - 5, 20, 7)
        .fillStyle(0x9ba3a0)
        .fillRect(x + 6, y - 3, 12, 2)
        .fillStyle(PALETTE.ink)
        .fillRect(x + (facing === 1 ? 20 : -2), y + 1, 9, 3);
    } else {
      graphics
        .fillStyle(0xa9a39b)
        .fillRect(x + 1, y + 4, 5, 10)
        .fillRect(x + 20, y + 4, 5, 10)
        .fillStyle(0xd1c9bf)
        .fillRect(x + 5, y + 2, 4, 3)
        .fillRect(x + 17, y + 2, 4, 3);
    }

    const nearEyeX = facing === 1 ? faceLeft + 12 : faceLeft + 4;
    const farEyeX = facing === 1 ? faceLeft + 5 : faceLeft + 11;
    graphics
      .fillStyle(darkenColour(skin, 0.28))
      .fillRect(nearEyeX - 1, eyeY - 2, 4, 1)
      .fillRect(farEyeX - 1, eyeY - 2, 4, 1)
      .fillStyle(PALETTE.ink)
      .fillRect(nearEyeX, eyeY, frame === 1 && hair === "bald-crown" ? 3 : 2, 2)
      .fillRect(farEyeX, eyeY, 2, 2)
      .fillStyle(darkenColour(skin, 0.22))
      .fillRect(faceLeft + (facing === 1 ? 14 : 2), y + 14, 3, 2)
      .fillStyle(PALETTE.ink)
      .fillRect(faceLeft + 7, y + 18, 6, 2);

    if (glasses) {
      graphics
        .lineStyle(2, PALETTE.ink)
        .strokeRect(faceLeft + 2, eyeY - 2, 6, 5)
        .strokeRect(faceLeft + 10, eyeY - 2, 6, 5)
        .lineBetween(faceLeft + 8, eyeY, faceLeft + 10, eyeY);
    }

    const handX = x + (facing === 1 ? 31 + frame * 3 : -7 - frame * 3);
    graphics
      .lineStyle(6, PALETTE.ink)
      .lineBetween(x + (facing === 1 ? 22 : 2), y + 31, handX, y + 37 - frame * 2)
      .lineStyle(3, skin)
      .lineBetween(x + (facing === 1 ? 22 : 2), y + 31, handX, y + 37 - frame * 2)
      .fillStyle(PALETTE.ink)
      .fillRect(handX - 2, y + 34 - frame * 2, 6, 5)
      .fillStyle(skin)
      .fillRect(handX - 1, y + 34 - frame * 2, 4, 3);
  }
  graphics
    .fillStyle(PALETTE.cream)
    .fillRect(73 + frame * 3, 39 - frame * 2, 4, 4)
    .fillStyle(PALETTE.ink)
    .fillRect(79 - frame * 2, 40 + frame * 2, 4, 4);
}

function createAmbientTextures(scene: Phaser.Scene): void {
  const flutter: readonly [string, number, number][] = [
    ["butterfly-gold", PALETTE.gold, PALETTE.coral],
    ["butterfly-blue", 0x65b9c2, PALETTE.cream],
    ["dragonfly", PALETTE.teal, 0x8ed5cf],
  ];
  for (const [name, body, wing] of flutter) {
    for (const frame of [0, 1] as const) {
      makeTexture(scene, `ambient-flutter-${name}-${frame}`, 26, 20, (graphics) => {
        if (name === "dragonfly") {
          const spread = frame === 0 ? 7 : 4;
          graphics
            .fillStyle(PALETTE.ink)
            .fillRect(11, 3, 5, 15)
            .fillRect(13 - spread, 6, spread, 4)
            .fillRect(15, 6, spread, 4)
            .fillRect(13 - spread, 11, spread, 4)
            .fillRect(15, 11, spread, 4)
            .fillStyle(body)
            .fillRect(13, 5, 2, 11)
            .fillStyle(wing)
            .fillRect(14 - spread, 7, spread - 1, 2)
            .fillRect(16, 7, spread - 1, 2)
            .fillRect(14 - spread, 12, spread - 1, 2)
            .fillRect(16, 12, spread - 1, 2);
        } else {
          const lift = frame === 0 ? 0 : 3;
          graphics
            .fillStyle(PALETTE.ink)
            .fillRect(11, 5, 5, 12)
            .fillRect(3 + lift, 3, 9, 10)
            .fillRect(15, 3 + lift, 9, 10)
            .fillStyle(body)
            .fillRect(13, 7, 2, 8)
            .fillStyle(wing)
            .fillRect(5 + lift, 5, 6, 6)
            .fillRect(16, 5 + lift, 6, 6);
        }
      });
    }
  }

  for (const frame of [0, 1] as const) {
    makeTexture(scene, `ambient-laundry-${frame}`, 132, 48, (graphics) => {
      const breeze = frame === 0 ? 0 : 2;
      graphics
        .fillStyle(PALETTE.ink)
        .fillRect(3, 4, 5, 43)
        .fillRect(124, 4, 5, 43)
        .fillRect(7, 7, 118, 3)
        .fillStyle(PALETTE.concreteEdge)
        .fillRect(5, 5, 2, 39)
        .fillRect(126, 5, 2, 39);

      const clothes: readonly [number, number, number, number, number][] = [
        [14, 13 + breeze, 21, 22, PALETTE.coral],
        [42, 12, 17, 16 + breeze, PALETTE.teal],
        [66, 12 + breeze, 34, 26, PALETTE.cream],
        [106, 13, 13, 19 + breeze, PALETTE.gold],
      ];
      for (const [x, y, width, height, colour] of clothes) {
        graphics
          .fillStyle(PALETTE.ink)
          .fillRect(x - 2, y - 2, width + 4, height + 4)
          .fillStyle(colour)
          .fillRect(x, y, width, height)
          .fillStyle(lightenColour(colour, 0.2))
          .fillRect(x, y, width, 3);
      }
      graphics
        .fillStyle(PALETTE.ink)
        .fillRect(19, 11 + breeze, 4, 5)
        .fillRect(29, 11 + breeze, 4, 5)
        .fillRect(47, 10, 3, 5)
        .fillRect(53, 10, 3, 5)
        .fillRect(72, 10 + breeze, 4, 5)
        .fillRect(93, 10 + breeze, 4, 5)
        .fillRect(110, 11, 3, 5);
    });
  }

  const cats: readonly [string, number, number][] = [
    ["ginger", PALETTE.gold, PALETTE.cream],
    ["tabby", 0x6f6258, PALETTE.sand],
  ];
  for (const [name, fur, chest] of cats) {
    for (const frame of [0, 1] as const) {
      makeTexture(scene, `ambient-cat-${name}-${frame}`, 48, 34, (graphics) => {
        const frontPawX = frame === 0 ? 29 : 32;
        const backPawX = frame === 0 ? 13 : 10;
        graphics
          .lineStyle(5, PALETTE.ink)
          .lineBetween(11, 18, 3, frame === 0 ? 9 : 13)
          .lineStyle(3, fur)
          .lineBetween(11, 18, 3, frame === 0 ? 9 : 13)
          .fillStyle(PALETTE.ink)
          .fillRect(8, 12, 29, 15)
          .fillRect(29, 7, 14, 17)
          .fillTriangle(30, 8, 33, 2, 36, 9)
          .fillTriangle(37, 8, 40, 2, 43, 10)
          .fillStyle(fur)
          .fillRect(11, 14, 25, 10)
          .fillRect(31, 9, 10, 13)
          .fillTriangle(32, 8, 34, 4, 36, 9)
          .fillTriangle(38, 8, 40, 4, 41, 10)
          .fillStyle(chest)
          .fillRect(31, 18, 7, 6)
          .fillStyle(PALETTE.ink)
          .fillRect(37, 12, 2, 2)
          .fillRect(frontPawX, 23, 7, 7)
          .fillRect(backPawX, 23, 7, 7)
          .fillStyle(fur)
          .fillRect(frontPawX + 2, 23, 3, 5)
          .fillRect(backPawX + 2, 23, 3, 5)
          .fillStyle(PALETTE.coral)
          .fillRect(39, 17, 3, 2);
      });
    }
  }

  for (const frame of [0, 1] as const) {
    makeTexture(scene, `ambient-task-sweeper-${frame}`, 76, 80, (graphics) => {
      drawAmbientSweeper(graphics, frame);
    });
    makeTexture(scene, `ambient-task-gardener-${frame}`, 96, 72, (graphics) => {
      drawAmbientGardener(graphics, frame);
    });
    makeTexture(scene, `ambient-task-noticeboard-${frame}`, 164, 80, (graphics) => {
      drawAmbientNoticeboard(graphics, frame);
    });
    makeTexture(scene, `ambient-task-kopitiam-${frame}`, 140, 78, (graphics) => {
      drawAmbientKopitiam(graphics, frame);
    });
    makeTexture(scene, `ambient-task-chess-${frame}`, 160, 92, (graphics) => {
      drawAmbientChessPlayers(graphics, frame);
    });
  }
}

export function ensureCampaignArtTextures(scene: Phaser.Scene): void {
  createPlayerTextures(scene);
  for (const definition of RESIDENT_ART) {
    createResidentTextures(scene, definition);
  }
  createTreeTextures(scene);
  createLandscapeTextures(scene);
  createPropTextures(scene);
  createAmbientTextures(scene);
}

function locationHash(locationId: LocationId): number {
  let hash = 0;
  for (const character of locationId) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return hash;
}

/**
 * Rebuilds a single reusable room backdrop texture. Only one interior scene is
 * active at a time, so this keeps the richer floor patterns to one canvas.
 */
export function createRoomBackdropTexture(
  scene: Phaser.Scene,
  locationId: LocationId,
  wallColour: number,
): string {
  const key = "campaign-room-backdrop";
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const graphics = scene.make.graphics({ x: 0, y: 0 });
  const floorTop = 150;
  const floorBottom = 585;
  const hash = locationHash(locationId);

  graphics
    .fillStyle(PALETTE.night)
    .fillRect(0, 0, 960, 640)
    .fillStyle(PALETTE.night, 0.35)
    .fillRect(30, 30, 920, 600)
    .fillStyle(PALETTE.ink)
    .fillRect(15, 15, 930, 610)
    .fillStyle(PALETTE.paper)
    .fillRect(24, 24, 912, 592)
    .fillStyle(wallColour)
    .fillRect(24, 24, 912, floorTop - 24)
    .fillStyle(lightenColour(wallColour, 0.26))
    .fillRect(24, 24, 912, 8)
    .fillStyle(darkenColour(wallColour, 0.22))
    .fillRect(24, floorTop - 10, 912, 10);

  for (let x = 50; x < 930; x += 72) {
    const height = 5 + ((x + hash) % 4);
    graphics
      .fillStyle(lightenColour(wallColour, 0.12), 0.42)
      .fillRect(x, 64, 3, height);
  }

  // Plaster courses on the wall. Without them the wall reads as one flat
  // slab and gives the eye no sense of scale next to the player sprite.
  for (let y = 40; y < floorTop - 12; y += 26) {
    graphics
      .fillStyle(darkenColour(wallColour, 0.08), 0.3)
      .fillRect(24, y, 912, 2)
      .fillStyle(lightenColour(wallColour, 0.14), 0.24)
      .fillRect(24, y + 2, 912, 1);
  }
  // Corner ambient occlusion so the room has walls rather than edges.
  for (let step = 0; step < 5; step += 1) {
    const inset = step * 6;
    const alpha = 0.1 - step * 0.018;
    graphics
      .fillStyle(PALETTE.night, alpha)
      .fillRect(24 + inset, 24, 6, floorTop - 24)
      .fillRect(930 - inset, 24, 6, floorTop - 24);
  }

  const woodFloor = [
    "y-flat",
    "mr-long-flat",
    "ben-flat",
    "craftsman-workshop",
  ].includes(locationId);
  const carpetFloor = locationId === "prayer-hall";
  const floorBase = carpetFloor
    ? darkenColour(PALETTE.purple, 0.04)
    : woodFloor
      ? 0xd8b985
      : lightenColour(PALETTE.concrete, 0.15);
  graphics.fillStyle(floorBase).fillRect(24, floorTop, 912, floorBottom - floorTop);

  if (woodFloor) {
    // Plank courses sized against the player sprite: a board is roughly a
    // stride long and a boot wide, so the floor reads as material rather
    // than as oversized panelling.
    const plankHeight = 22;
    let row = 0;
    for (let y = floorTop; y < floorBottom; y += plankHeight) {
      const rowHeight = Math.min(plankHeight, floorBottom - y);
      let column = 0;
      // Boards run long and break at staggered end joints. Equal-width cells
      // would read as brickwork instead of floorboards.
      let x = 24 - ((hash + row * 53) % 140);
      while (x < 936) {
        const grain = (hash + row * 37 + column * 61) >>> 0;
        const boardWidth = 132 + (grain % 5) * 26;
        const left = Math.max(24, x);
        const right = Math.min(936, x + boardWidth);
        if (right > left) {
          const tone = grain % 3;
          if (tone === 0) {
            graphics
              .fillStyle(darkenColour(floorBase, 0.06), 0.5)
              .fillRect(left, y, right - left, rowHeight);
          } else if (tone === 2) {
            graphics
              .fillStyle(lightenColour(floorBase, 0.07), 0.45)
              .fillRect(left, y, right - left, rowHeight);
          }
          // Two long grain streaks per board rather than a short tick, so the
          // eye follows the length of the timber.
          graphics
            .fillStyle(darkenColour(floorBase, 0.13), 0.4)
            .fillRect(
              left + 10,
              y + 5 + (grain % 4),
              Math.max(0, right - left - 26),
              1,
            )
            .fillStyle(lightenColour(floorBase, 0.16), 0.34)
            .fillRect(
              left + 22,
              y + 13 + ((grain >>> 3) % 4),
              Math.max(0, right - left - 44),
              1,
            );
          if (x >= 24) {
            graphics
              .fillStyle(darkenColour(floorBase, 0.26), 0.85)
              .fillRect(x, y + 1, 2, rowHeight - 2);
          }
        }
        x += boardWidth;
        column += 1;
      }
      graphics
        .fillStyle(darkenColour(floorBase, 0.18), 0.8)
        .fillRect(24, y, 912, 2)
        .fillStyle(lightenColour(floorBase, 0.15), 0.45)
        .fillRect(24, y + 2, 912, 1);
      row += 1;
    }
  } else if (carpetFloor) {
    for (let x = 42; x < 930; x += 44) {
      graphics
        .fillStyle(lightenColour(PALETTE.purple, 0.18), 0.4)
        .fillRect(x, floorTop, 3, floorBottom - floorTop);
    }
    for (let y = floorTop + 20; y < floorBottom; y += 52) {
      graphics
        .fillStyle(PALETTE.gold, 0.38)
        .fillRect(24, y, 912, 2)
        .fillStyle(darkenColour(PALETTE.purple, 0.16), 0.4)
        .fillRect(24, y + 2, 912, 1);
    }
    graphics
      .fillStyle(PALETTE.gold, 0.32)
      .fillRect(46, floorTop + 8, 868, 3)
      .fillRect(46, floorBottom - 14, 868, 3);
  } else {
    // Floor tiles roughly one player-width across, with grout shading and a
    // deterministic speckle so large rooms do not read as flat colour.
    const tileHeight = 34;
    const tileWidth = 46;
    let row = 0;
    for (let y = floorTop; y < floorBottom; y += tileHeight) {
      const rowHeight = Math.min(tileHeight, floorBottom - y);
      const offset = (row % 2) * (tileWidth / 2);
      let column = 0;
      for (let x = 24 - offset; x < 936; x += tileWidth) {
        const left = Math.max(24, x);
        const right = Math.min(936, x + tileWidth);
        if (right > left) {
          const speck = (hash + row * 29 + column * 53) >>> 0;
          if (speck % 4 === 0) {
            graphics
              .fillStyle(darkenColour(floorBase, 0.05), 0.5)
              .fillRect(left, y, right - left, rowHeight);
          } else if (speck % 4 === 2) {
            graphics
              .fillStyle(lightenColour(floorBase, 0.07), 0.45)
              .fillRect(left, y, right - left, rowHeight);
          }
          graphics
            .fillStyle(lightenColour(floorBase, 0.22), 0.4)
            .fillRect(left + 3, y + 3, Math.min(12, right - left - 6), 2)
            .fillStyle(PALETTE.concreteEdge, 0.62)
            .fillRect(x, y, 2, rowHeight);
        }
        column += 1;
      }
      graphics
        .fillStyle(PALETTE.concreteEdge, 0.7)
        .fillRect(24, y, 912, 2);
      row += 1;
    }
  }

  // Wall-to-floor contact shadow. Five stepped bands keep the crisp-edge art
  // language while giving the floor somewhere to start.
  for (let step = 0; step < 5; step += 1) {
    graphics
      .fillStyle(PALETTE.night, 0.13 - step * 0.024)
      .fillRect(24, floorTop + step * 5, 912, 5);
  }
  // Side falloff so the middle of the room is the brightest place to stand.
  for (let step = 0; step < 6; step += 1) {
    const alpha = 0.075 - step * 0.012;
    graphics
      .fillStyle(PALETTE.night, alpha)
      .fillRect(24 + step * 9, floorTop, 9, floorBottom - floorTop)
      .fillRect(927 - step * 9, floorTop, 9, floorBottom - floorTop);
  }

  graphics
    .fillStyle(PALETTE.concreteEdge)
    .fillRect(24, floorBottom, 912, 31)
    .fillStyle(lightenColour(PALETTE.concreteEdge))
    .fillRect(24, floorBottom, 912, 5)
    .fillStyle(PALETTE.night, 0.16)
    .fillRect(24, floorBottom - 4, 912, 4);

  // Daylight through the window, drawn as light rather than as the grey wedge
  // this used to be. Two stacked wedges give the shaft a soft core.
  graphics
    .fillStyle(PALETTE.cream, 0.16)
    .fillPoints(
      [
        new Phaser.Geom.Point(630, floorTop),
        new Phaser.Geom.Point(875, floorTop),
        new Phaser.Geom.Point(936, 404),
        new Phaser.Geom.Point(744, 404),
      ],
      true,
    )
    .fillStyle(PALETTE.gold, 0.1)
    .fillPoints(
      [
        new Phaser.Geom.Point(668, floorTop),
        new Phaser.Geom.Point(838, floorTop),
        new Phaser.Geom.Point(892, 362),
        new Phaser.Geom.Point(768, 362),
      ],
      true,
    );

  graphics.generateTexture(key, 960, 640);
  graphics.destroy();
  return key;
}
