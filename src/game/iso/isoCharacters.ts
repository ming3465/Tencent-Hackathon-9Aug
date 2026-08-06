/**
 * Outline-free character frames for the isometric estate.
 *
 * Characters stay upright billboards — only terrain and buildings are
 * projected — so the shipped sprites *work* in the isometric world. They just
 * do not *belong* in it: every shipped frame is wrapped in a hard
 * `PALETTE.ink` outline, which was the last visible clash once the props lost
 * theirs.
 *
 * These frames reuse the authored `RESIDENT_ART` data unchanged — shirt, hair,
 * skin, build, accessory, outfit and carry are all still the single source of
 * truth, so the twelve residents keep the silhouettes, hair styles and
 * accessories that `ACCESSIBILITY.md` requires them to be distinguished by
 * without relying on colour. Only the drawing grammar changes: a rim of the
 * darkened fill instead of an ink outline, and one shared upper-left sun.
 */

import Phaser from "phaser";

import {
  RESIDENT_ART,
  type ResidentAccessory,
  type ResidentArtDefinition,
  type ResidentBuild,
  type ResidentCarry,
  type ResidentHairStyle,
  type ResidentOutfit,
} from "../characterArt.js";

export type IsoFacing = "down" | "up" | "side";

const FRAME_WIDTH = 48;
const FRAME_HEIGHT = 62;
const SHADOW = 0x2f2a1e;

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

interface BuildMetrics {
  shoulder: number;
  torsoHeight: number;
  legLength: number;
  headRadius: number;
}

function metricsFor(build: ResidentBuild): BuildMetrics {
  switch (build) {
    case "wide":
      return { shoulder: 17, torsoHeight: 21, legLength: 15, headRadius: 8 };
    case "tall":
      return { shoulder: 13, torsoHeight: 24, legLength: 19, headRadius: 7.5 };
    default:
      return { shoulder: 14, torsoHeight: 18, legLength: 14, headRadius: 8 };
  }
}

/**
 * Draws one character frame.
 *
 * Body parts are rounded masses with a darker rim, matching `isoProps.ts`, so
 * characters and planting share one drawing grammar.
 */
function drawIsoCharacterFrame(
  graphics: Phaser.GameObjects.Graphics,
  definition: {
    shirt: number;
    hair: number;
    skin: number;
    build: ResidentBuild;
    accessory: ResidentAccessory;
    hairStyle: ResidentHairStyle;
    outfit: ResidentOutfit;
    carry: ResidentCarry;
  },
  facing: IsoFacing,
  step: number,
  blink: boolean,
): void {
  const metrics = metricsFor(definition.build);
  const centreX = FRAME_WIDTH / 2;
  const baseY = FRAME_HEIGHT - 4;

  const swing = [0, 1, 0, -1][step % 4];
  const bob = step % 2 === 0 ? 0 : 1;

  const hipY = baseY - metrics.legLength;
  const shoulderY = hipY - metrics.torsoHeight + bob;
  const headY = shoulderY - metrics.headRadius - 3;

  const poly = (points: number[][], colour: number, alpha = 1): void => {
    graphics.fillStyle(colour, alpha).fillPoints(
      points.map(([px, py]) => new Phaser.Geom.Point(px, py)),
      true,
    );
  };

  graphics
    .fillStyle(SHADOW, 0.2)
    .fillEllipse(centreX + 3, baseY + 1, metrics.shoulder * 1.9, 8);

  const trouser = shade(definition.shirt, -0.55);
  const half = metrics.shoulder;

  // --- Legs: tapered from hip to ankle, not stacked ellipses ---
  for (const side of [-1, 1]) {
    const hipX = centreX + side * half * 0.4;
    const lift = facing === "side" ? swing * side * 3 : Math.abs(swing) * 1.5;
    const ankleX = hipX + (facing === "side" ? swing * side * 2 : 0);
    const ankleY = baseY - lift;
    poly(
      [
        [hipX - 5.5, hipY],
        [hipX + 5.5, hipY],
        [ankleX + 3.6, ankleY],
        [ankleX - 3.6, ankleY],
      ],
      shade(trouser, side < 0 ? 0 : -0.16),
    );
    // Shoe: a wedge, longer than it is tall.
    poly(
      [
        [ankleX - 4.2, ankleY],
        [ankleX + 4.6, ankleY],
        [ankleX + 6, ankleY + 3.4],
        [ankleX - 4.6, ankleY + 3.4],
      ],
      shade(trouser, -0.45),
    );
  }

  // --- Torso: trapezoid, wider at the shoulders, with a waist ---
  const waistY = shoulderY + metrics.torsoHeight * 0.66;
  poly(
    [
      [centreX - half, shoulderY + 3],
      [centreX + half, shoulderY + 3],
      [centreX + half * 0.82, waistY],
      [centreX + half * 0.78, hipY + 1],
      [centreX - half * 0.78, hipY + 1],
      [centreX - half * 0.82, waistY],
    ],
    definition.shirt,
  );
  // Shoulder line and sun-side highlight.
  poly(
    [
      [centreX - half, shoulderY + 3],
      [centreX + half, shoulderY + 3],
      [centreX + half * 0.9, shoulderY + 6],
      [centreX - half * 0.9, shoulderY + 6],
    ],
    shade(definition.shirt, 0.22),
  );
  poly(
    [
      [centreX - half, shoulderY + 4],
      [centreX - half * 0.42, shoulderY + 4],
      [centreX - half * 0.4, hipY],
      [centreX - half * 0.78, hipY],
    ],
    shade(definition.shirt, 0.13),
    0.75,
  );
  // Shaded side away from the sun.
  poly(
    [
      [centreX + half * 0.5, shoulderY + 4],
      [centreX + half, shoulderY + 4],
      [centreX + half * 0.78, hipY],
      [centreX + half * 0.45, hipY],
    ],
    shade(definition.shirt, -0.2),
    0.7,
  );

  // --- Outfit motif ---
  const motif = shade(definition.shirt, 0.34);
  if (definition.outfit === "striped") {
    for (let stripe = 0; stripe < 3; stripe += 1) {
      const sy = shoulderY + 9 + stripe * 6;
      graphics.fillStyle(motif, 0.85).fillRect(centreX - half * 0.86, sy, half * 1.72, 2);
    }
  } else if (definition.outfit === "floral") {
    for (let dot = 0; dot < 6; dot += 1) {
      const seed = isoHashLocal(dot * 37, 5);
      const dx = ((seed % 100) / 100 - 0.5) * half * 1.5;
      const dy = 8 + ((seed >>> 6) % Math.max(1, metrics.torsoHeight - 10));
      graphics.fillStyle(motif, 0.9).fillEllipse(centreX + dx, shoulderY + dy, 4, 4);
    }
  } else if (definition.outfit === "collared") {
    poly(
      [
        [centreX - 6, shoulderY + 3],
        [centreX + 6, shoulderY + 3],
        [centreX, shoulderY + 11],
      ],
      shade(definition.skin, -0.12),
    );
    poly([[centreX - 7, shoulderY + 3], [centreX - 1, shoulderY + 3], [centreX - 4, shoulderY + 10]], motif);
    poly([[centreX + 7, shoulderY + 3], [centreX + 1, shoulderY + 3], [centreX + 4, shoulderY + 10]], motif);
  } else if (definition.outfit === "work-vest") {
    graphics
      .fillStyle(shade(definition.shirt, -0.42), 0.92)
      .fillRect(centreX - half * 0.9, shoulderY + 5, 5, metrics.torsoHeight - 6)
      .fillRect(centreX + half * 0.9 - 5, shoulderY + 5, 5, metrics.torsoHeight - 6);
  }

  if (definition.accessory === "apron") {
    poly(
      [
        [centreX - half * 0.6, shoulderY + 8],
        [centreX + half * 0.6, shoulderY + 8],
        [centreX + half * 0.72, hipY + 1],
        [centreX - half * 0.72, hipY + 1],
      ],
      shade(0xf2ead2, -0.06),
      0.96,
    );
  }

  // --- Arms: tapered, hanging with a slight bend ---
  for (const side of [-1, 1]) {
    const shoulderX = centreX + side * (half - 1);
    const armSwing = facing === "side" ? -swing * side * 3 : 0;
    const elbowX = shoulderX + side * 2;
    const elbowY = shoulderY + metrics.torsoHeight * 0.5 + armSwing;
    const handY = shoulderY + metrics.torsoHeight * 0.86 + armSwing;
    poly(
      [
        [shoulderX - side * 3.4, shoulderY + 5],
        [shoulderX + side * 3.4, shoulderY + 5],
        [elbowX + side * 2.6, elbowY],
        [elbowX - side * 2.6, elbowY],
      ],
      shade(definition.shirt, side < 0 ? -0.1 : -0.28),
    );
    poly(
      [
        [elbowX - side * 2.6, elbowY],
        [elbowX + side * 2.6, elbowY],
        [elbowX + side * 2.2, handY],
        [elbowX - side * 2.2, handY],
      ],
      shade(definition.skin, side < 0 ? -0.04 : -0.2),
    );
    graphics
      .fillStyle(shade(definition.skin, -0.1))
      .fillEllipse(elbowX, handY + 1.5, 5, 5.4);
  }

  // --- Neck and head: a rounded rectangle rather than a circle ---
  poly(
    [
      [centreX - 3.4, shoulderY - 1],
      [centreX + 3.4, shoulderY - 1],
      [centreX + 3, shoulderY + 4],
      [centreX - 3, shoulderY + 4],
    ],
    shade(definition.skin, -0.3),
  );
  const r = metrics.headRadius;
  poly(
    [
      [centreX - r * 0.92, headY - r * 0.55],
      [centreX + r * 0.92, headY - r * 0.55],
      [centreX + r, headY + r * 0.3],
      [centreX + r * 0.66, headY + r],
      [centreX - r * 0.66, headY + r],
      [centreX - r, headY + r * 0.3],
    ],
    definition.skin,
  );
  poly(
    [
      [centreX - r * 0.92, headY - r * 0.5],
      [centreX - r * 0.2, headY - r * 0.5],
      [centreX - r * 0.3, headY + r * 0.85],
      [centreX - r * 0.86, headY + r * 0.25],
    ],
    shade(definition.skin, 0.16),
    0.7,
  );
  poly(
    [
      [centreX + r * 0.35, headY - r * 0.5],
      [centreX + r * 0.92, headY - r * 0.5],
      [centreX + r, headY + r * 0.3],
      [centreX + r * 0.5, headY + r * 0.9],
    ],
    shade(definition.skin, -0.18),
    0.65,
  );

  // --- Hair: silhouette is the primary non-colour identifier ---
  const hair = definition.hair;
  switch (definition.hairStyle) {
    case "bun":
      graphics.fillStyle(shade(hair, -0.2)).fillEllipse(centreX, headY - r * 1.35, r * 0.95, r * 0.85);
      poly([[centreX - r, headY - r * 0.62], [centreX + r, headY - r * 0.62],
            [centreX + r * 0.95, headY - r * 0.05], [centreX - r * 0.95, headY - r * 0.05]], hair);
      break;
    case "bob":
      poly([[centreX - r * 1.05, headY - r * 0.65], [centreX + r * 1.05, headY - r * 0.65],
            [centreX + r * 1.12, headY + r * 0.75], [centreX + r * 0.55, headY + r * 0.5],
            [centreX - r * 0.55, headY + r * 0.5], [centreX - r * 1.12, headY + r * 0.75]], hair);
      break;
    case "crop":
      poly([[centreX - r * 0.95, headY - r * 0.6], [centreX + r * 0.95, headY - r * 0.6],
            [centreX + r * 0.92, headY - r * 0.05], [centreX - r * 0.92, headY - r * 0.05]], hair);
      break;
    case "receding":
      poly([[centreX - r * 0.66, headY - r * 0.58], [centreX + r * 0.66, headY - r * 0.58],
            [centreX + r * 0.86, headY - r * 0.15], [centreX - r * 0.86, headY - r * 0.15]], hair);
      break;
    default: // side-part
      poly([[centreX - r * 0.98, headY - r * 0.62], [centreX + r * 0.98, headY - r * 0.62],
            [centreX + r * 0.94, headY + r * 0.1], [centreX + r * 0.2, headY - r * 0.18],
            [centreX - r * 0.94, headY - r * 0.05]], hair);
      break;
  }

  // --- Face ---
  if (facing !== "up") {
    const eyeY = headY + r * 0.16;
    const spread = r * 0.42;
    const eyeX = facing === "side" ? centreX + r * 0.26 : centreX;
    graphics.fillStyle(shade(definition.skin, -0.66));
    if (blink) {
      graphics.fillRect(eyeX - spread - 1.6, eyeY, 3.2, 1.2);
      if (facing !== "side") graphics.fillRect(eyeX + spread - 1.6, eyeY, 3.2, 1.2);
    } else {
      graphics.fillRect(eyeX - spread - 1.2, eyeY - 1.2, 2.4, 2.8);
      if (facing !== "side") graphics.fillRect(eyeX + spread - 1.2, eyeY - 1.2, 2.4, 2.8);
    }
    graphics
      .fillStyle(shade(0xd97a58, -0.05), 0.42)
      .fillEllipse(eyeX - spread * 1.75, eyeY + 2.8, 3.4, 2)
      .fillEllipse(eyeX + spread * 1.75, eyeY + 2.8, 3.4, 2);
  }

  // --- Accessories ---
  if (definition.accessory === "glasses") {
    const glass = 0xdce9ee;
    graphics.fillStyle(shade(glass, -0.45), 0.95);
    graphics.fillRect(centreX - r * 0.86, headY - 1, r * 0.72, r * 0.5);
    graphics.fillRect(centreX + r * 0.14, headY - 1, r * 0.72, r * 0.5);
    graphics.fillRect(centreX - r * 0.16, headY + 0.4, r * 0.32, 1.2);
    graphics.fillStyle(glass, 0.5);
    graphics.fillRect(centreX - r * 0.8, headY - 0.5, r * 0.6, r * 0.34);
    graphics.fillRect(centreX + r * 0.2, headY - 0.5, r * 0.6, r * 0.34);
  }
  if (definition.accessory === "cane") {
    const cane = 0x8a6a44;
    graphics.fillStyle(shade(cane, -0.3)).fillRect(centreX + half + 4, shoulderY + 16, 2.6, metrics.legLength + metrics.torsoHeight - 10);
    graphics.fillStyle(cane).fillEllipse(centreX + half + 5.4, shoulderY + 15, 7, 3.6);
  }
  if (definition.carry === "tote") {
    const tote = shade(definition.shirt, -0.5);
    poly(
      [
        [centreX - half - 7, shoulderY + 15],
        [centreX - half + 3, shoulderY + 15],
        [centreX - half + 2, shoulderY + 27],
        [centreX - half - 6, shoulderY + 27],
      ],
      tote,
    );
    graphics.fillStyle(shade(tote, 0.2)).fillRect(centreX - half - 4, shoulderY + 9, 1.6, 7);
  }
}

/** Local deterministic hash for motif scatter. */
function isoHashLocal(x: number, y: number): number {
  let value = Math.imul(x + 0x6d2b79f5, 0x1b873593) ^ Math.imul(y + 97, 0x85ebca6b);
  value ^= value >>> 13;
  return Math.imul(value, 0xc2b2ae35) >>> 0;
}

/** The player's own palette, distinct from every resident. */
const PLAYER_ART = {
  shirt: 0x2f7d8c,
  hair: 0x2a2523,
  skin: 0xdba97c,
  build: "short" as ResidentBuild,
  accessory: "none" as ResidentAccessory,
  hairStyle: "crop" as ResidentHairStyle,
  outfit: "plain" as ResidentOutfit,
  carry: "none" as ResidentCarry,
};

const FACINGS: readonly IsoFacing[] = ["down", "up", "side"];
const STEPS = [0, 1, 2, 3];

function registerCharacter(
  scene: Phaser.Scene,
  key: string,
  definition: Parameters<typeof drawIsoCharacterFrame>[1],
): void {
  for (const facing of FACINGS) {
    for (const step of STEPS) {
      const textureKey = `iso-${key}-${facing}-${step}`;
      if (scene.textures.exists(textureKey)) continue;
      const graphics = scene.make.graphics({ x: 0, y: 0 });
      drawIsoCharacterFrame(graphics, definition, facing, step, false);
      graphics.generateTexture(textureKey, FRAME_WIDTH, FRAME_HEIGHT);
      graphics.destroy();
    }
    const blinkKey = `iso-${key}-${facing}-0-blink`;
    if (!scene.textures.exists(blinkKey)) {
      const graphics = scene.make.graphics({ x: 0, y: 0 });
      drawIsoCharacterFrame(graphics, definition, facing, 0, true);
      graphics.generateTexture(blinkKey, FRAME_WIDTH, FRAME_HEIGHT);
      graphics.destroy();
    }
  }
}

/** Registers isometric frames for the player and all twelve residents. */
export function ensureIsoCharacterTextures(scene: Phaser.Scene): void {
  registerCharacter(scene, "player", PLAYER_ART);
  for (const definition of RESIDENT_ART as readonly ResidentArtDefinition[]) {
    registerCharacter(scene, definition.key, definition);
  }
}

/** Maps a shipped character texture key onto its isometric replacement. */
export function isoCharacterTextureFor(shippedKey: string): string {
  if (shippedKey.startsWith("campaign-player-")) {
    return `iso-player-${shippedKey.slice("campaign-player-".length)}`;
  }
  if (shippedKey.startsWith("npc-")) return `iso-${shippedKey}`;
  return shippedKey;
}
