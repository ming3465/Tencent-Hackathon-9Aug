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
      const tileBase = seed % 5 === 0
        ? lightenColour(base, 0.055)
        : seed % 7 === 0
          ? darkenColour(base, 0.035)
          : base;
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
