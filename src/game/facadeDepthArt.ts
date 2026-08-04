import Phaser from "phaser";
import {
  darkenColour,
  lightenColour,
  PALETTE,
} from "./campaignArt.js";
import type {
  EstateEntranceDefinition,
  EstateFacadeAccent,
  EstateFacadeDepthDefinition,
  EstateRect,
} from "./estateLayout.js";

const ACCENT_COLOURS: Readonly<Record<EstateFacadeAccent, number>> = {
  coral: PALETTE.coral,
  gold: PALETTE.gold,
  green: PALETTE.green,
  purple: PALETTE.purple,
  teal: PALETTE.teal,
};

function point(x: number, y: number): Phaser.Geom.Point {
  return new Phaser.Geom.Point(Math.round(x), Math.round(y));
}

function paintHippedRoof(
  graphics: Phaser.GameObjects.Graphics,
  definition: EstateFacadeDepthDefinition,
  zone: EstateRect,
): void {
  const accent = ACCENT_COLOURS[definition.accent];
  const frontY = zone.y + definition.roofDepth;
  const right = zone.x + zone.width;
  const backLeft = zone.x + definition.roofInset;
  const backRight = right - definition.roofInset;

  graphics
    .fillStyle(PALETTE.ink)
    .fillPoints(
      [
        point(zone.x, frontY),
        point(backLeft, zone.y),
        point(backRight, zone.y),
        point(right, frontY),
      ],
      true,
    )
    .fillStyle(accent)
    .fillPoints(
      [
        point(zone.x + 6, frontY - 5),
        point(backLeft + 3, zone.y + 5),
        point(backRight - 3, zone.y + 5),
        point(right - 6, frontY - 5),
      ],
      true,
    )
    .fillStyle(lightenColour(accent, 0.28))
    .fillRect(
      backLeft + 5,
      zone.y + 5,
      Math.max(8, backRight - backLeft - 10),
      4,
    )
    .fillStyle(darkenColour(accent, 0.24), 0.86)
    .fillPoints(
      [
        point(right - definition.sideFaceWidth * 2.2, frontY - 5),
        point(backRight - definition.sideFaceWidth, zone.y + 5),
        point(backRight - 3, zone.y + 5),
        point(right - 6, frontY - 5),
      ],
      true,
    );

  for (let segment = 1; segment < definition.roofSegments; segment += 1) {
    const progress = segment / definition.roofSegments;
    const backX = backLeft + (backRight - backLeft) * progress;
    const frontX = zone.x + zone.width * progress;
    graphics
      .fillStyle(darkenColour(accent, 0.3), 0.72)
      .fillPoints(
        [
          point(backX - 1, zone.y + 7),
          point(backX + 2, zone.y + 7),
          point(frontX + 2, frontY - 6),
          point(frontX - 1, frontY - 6),
        ],
        true,
      );
  }

  graphics
    .fillStyle(PALETTE.ink)
    .fillRect(zone.x, frontY - 7, zone.width, 9)
    .fillStyle(accent)
    .fillRect(zone.x + 6, frontY - 5, zone.width - 12, 6)
    .fillStyle(lightenColour(accent, 0.22))
    .fillRect(zone.x + 6, frontY - 5, zone.width - 12, 2);
}

function paintSawtoothRoof(
  graphics: Phaser.GameObjects.Graphics,
  definition: EstateFacadeDepthDefinition,
  zone: EstateRect,
): void {
  const accent = ACCENT_COLOURS[definition.accent];
  const frontY = zone.y + definition.roofDepth;
  const segmentWidth = zone.width / definition.roofSegments;

  for (let segment = 0; segment < definition.roofSegments; segment += 1) {
    const left = zone.x + segment * segmentWidth;
    const right = zone.x + (segment + 1) * segmentWidth;
    const ridge = left + segmentWidth / 2;
    graphics
      .fillStyle(PALETTE.ink)
      .fillPoints(
        [
          point(left, frontY),
          point(ridge, zone.y),
          point(right, frontY),
        ],
        true,
      )
      .fillStyle(accent)
      .fillPoints(
        [
          point(left + 7, frontY - 6),
          point(ridge, zone.y + 7),
          point(right - 7, frontY - 6),
        ],
        true,
      )
      .fillStyle(lightenColour(accent, 0.25))
      .fillPoints(
        [
          point(left + 8, frontY - 8),
          point(ridge, zone.y + 7),
          point(ridge - 5, zone.y + 14),
          point(left + 15, frontY - 8),
        ],
        true,
      )
      .fillStyle(darkenColour(accent, 0.25), 0.88)
      .fillPoints(
        [
          point(ridge + 1, zone.y + 8),
          point(right - 7, frontY - 6),
          point(right - 16, frontY - 6),
          point(ridge - 4, zone.y + 15),
        ],
        true,
      );
  }

  graphics
    .fillStyle(PALETTE.ink)
    .fillRect(zone.x, frontY - 8, zone.width, 10)
    .fillStyle(accent)
    .fillRect(zone.x + 7, frontY - 6, zone.width - 14, 7)
    .fillStyle(lightenColour(accent, 0.2))
    .fillRect(zone.x + 7, frontY - 6, zone.width - 14, 2);
}

function paintWallDepth(
  graphics: Phaser.GameObjects.Graphics,
  definition: EstateFacadeDepthDefinition,
  zone: EstateRect,
): void {
  const frontY = zone.y + definition.roofDepth;
  const bottom = zone.y + zone.height;
  const right = zone.x + zone.width;

  graphics
    .fillStyle(PALETTE.night, 0.19)
    .fillPoints(
      [
        point(zone.x + 14, bottom + 2),
        point(right + 11, bottom + 2),
        point(right + 32, bottom + 14),
        point(zone.x + 34, bottom + 14),
      ],
      true,
    )
    .fillStyle(PALETTE.night, 0.2)
    .fillPoints(
      [
        point(right - definition.sideFaceWidth, frontY + 2),
        point(right, frontY),
        point(right, bottom),
        point(right - definition.sideFaceWidth, bottom - 10),
      ],
      true,
    )
    .fillStyle(PALETTE.cream, 0.18)
    .fillRect(
      zone.x + 5,
      frontY + 5,
      3,
      Math.max(8, bottom - frontY - 13),
    )
    .fillStyle(PALETTE.night, 0.22)
    .fillRect(zone.x + 7, bottom - 7, zone.width - 14, 7);
}

function paintEntryRecess(
  graphics: Phaser.GameObjects.Graphics,
  definition: EstateFacadeDepthDefinition,
  entrance: EstateEntranceDefinition,
): void {
  const accent = ACCENT_COLOURS[definition.accent];
  const recessWidth = entrance.width + 28;
  const recessHeight = entrance.height + 16;
  const left = entrance.x - recessWidth / 2;
  const top = entrance.y - recessHeight;

  graphics
    .fillStyle(PALETTE.ink)
    .fillRect(left - 5, top - 5, recessWidth + 10, recessHeight + 5)
    .fillStyle(PALETTE.night)
    .fillRect(left, top, recessWidth, recessHeight)
    .fillStyle(lightenColour(accent, 0.12), 0.44)
    .fillRect(left + 6, top + 8, 6, recessHeight - 15)
    .fillStyle(PALETTE.night, 0.52)
    .fillRect(left + recessWidth - 13, top + 6, 7, recessHeight - 11)
    .fillStyle(PALETTE.ink)
    .fillPoints(
      [
        point(left - 10, top - 13),
        point(left + recessWidth + 10, top - 13),
        point(left + recessWidth + 3, top),
        point(left - 3, top),
      ],
      true,
    )
    .fillStyle(accent)
    .fillPoints(
      [
        point(left - 3, top - 10),
        point(left + recessWidth + 3, top - 10),
        point(left + recessWidth - 1, top - 4),
        point(left + 1, top - 4),
      ],
      true,
    )
    .fillStyle(PALETTE.ink)
    .fillRect(left - 5, entrance.y - 7, recessWidth + 10, 7);
}

export function paintFacadeDepth(
  graphics: Phaser.GameObjects.Graphics,
  definition: EstateFacadeDepthDefinition,
  zone: EstateRect,
  entrance?: EstateEntranceDefinition,
): void {
  if (definition.roofStyle === "sawtooth") {
    paintSawtoothRoof(graphics, definition, zone);
  } else {
    paintHippedRoof(graphics, definition, zone);
  }
  paintWallDepth(graphics, definition, zone);
  if (entrance) paintEntryRecess(graphics, definition, entrance);
}
