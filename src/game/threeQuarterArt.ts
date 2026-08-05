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
  graphics
    .fillStyle(PALETTE.night, 0.18)
    .fillRect(local.x + 7, local.y + 9, local.width, local.height)
    .fillStyle(darkenColour(PALETTE.concreteEdge, 0.08))
    .fillRect(local.x, local.y, local.width, local.height)
    .fillStyle(lightenColour(PALETTE.concreteEdge, 0.18))
    .fillRect(local.x, local.y, isHorizontal ? local.width : 5, isHorizontal ? 5 : local.height)
    .fillStyle(base)
    .fillRect(local.x + 10, local.y + 10, Math.max(0, local.width - 20), Math.max(0, local.height - 20));

  const left = local.x + 10;
  const top = local.y + 10;
  const right = local.x + local.width - 10;
  const bottom = local.y + local.height - 10;
  graphics.lineStyle(2, darkenColour(base, 0.11), 0.7);
  if (street.surface === "diagonal-cobbles") {
    for (let diagonal = left - (bottom - top); diagonal < right; diagonal += 42) {
      graphics.lineBetween(diagonal, bottom, diagonal + (bottom - top), top);
    }
    for (let y = top + 38; y < bottom; y += 38) {
      graphics.lineBetween(left, y, right, y);
    }
  } else {
    for (let y = top + 42; y < bottom; y += 42) {
      graphics.lineBetween(left, y, right, y);
    }
    for (let x = left + 52; x < right; x += 52) {
      graphics.lineBetween(x, top, x, bottom);
    }
  }

  const worldLeft = originX + local.x;
  const worldTop = originY + local.y;
  if (isHorizontal) {
    for (let x = local.x + (96 - worldLeft % 160 + 160) % 160; x < local.x + local.width; x += 160) {
      graphics
        .fillStyle(PALETTE.ink)
        .fillRect(x, local.y + local.height - 13, 42, 7)
        .fillStyle(lightenColour(PALETTE.concreteEdge, 0.12))
        .fillRect(x + 4, local.y + local.height - 11, 34, 2);
    }
  } else {
    for (let y = local.y + (82 - worldTop % 160 + 160) % 160; y < local.y + local.height; y += 160) {
      graphics
        .fillStyle(PALETTE.ink)
        .fillRect(local.x + local.width - 13, y, 7, 42)
        .fillStyle(lightenColour(PALETTE.concreteEdge, 0.12))
        .fillRect(local.x + local.width - 11, y + 4, 2, 34);
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
  const lightGrass = lightenColour(PALETTE.grass, 0.1);
  const darkGrass = darkenColour(PALETTE.grass, 0.1);
  graphics.fillStyle(PALETTE.grass).fillRect(0, 0, width, height);
  for (let y = 0; y < height; y += TILE_SIZE) {
    for (let x = 0; x < width; x += TILE_SIZE) {
      const seed = hash(Math.floor((originX + x) / TILE_SIZE), Math.floor((originY + y) / TILE_SIZE));
      graphics
        .fillStyle(seed % 3 === 0 ? lightGrass : darkGrass, 0.28)
        .fillRect(x + 5 + seed % 13, y + 6 + (seed >>> 6) % 12, 9 + (seed >>> 11) % 9, 4);
      if (seed % 7 === 2) {
        graphics
          .fillStyle(seed % 2 === 0 ? PALETTE.gold : PALETTE.coral, 0.78)
          .fillRect(x + 10 + (seed >>> 17) % 14, y + 11 + (seed >>> 22) % 12, 3, 3);
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

  const windowTop = wallTop + 42;
  const windowBottom = wallBottom - 76;
  const available = Math.max(1, width - definition.sideFaceWidth - 38);
  const windowColumns = Math.max(2, Math.floor(available / 88));
  const windowGap = available / windowColumns;
  for (let column = 0; column < windowColumns; column += 1) {
    const x = 20 + column * windowGap;
    if (definition.entranceDoorId && Math.abs(x + 29 - (definition.minimapAnchor.x - definition.bounds.x)) < 65) continue;
    graphics
      .fillStyle(PALETTE.ink)
      .fillRect(x, windowTop, Math.min(58, windowGap - 12), Math.max(36, windowBottom - windowTop))
      .fillStyle(0x79a7b3)
      .fillRect(x + 5, windowTop + 5, Math.min(48, windowGap - 22), Math.max(26, windowBottom - windowTop - 10))
      .fillStyle(PALETTE.cream, 0.48)
      .fillRect(x + 9, windowTop + 9, Math.min(15, windowGap - 30), Math.max(18, windowBottom - windowTop - 18));
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
