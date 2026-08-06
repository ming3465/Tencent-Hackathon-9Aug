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

  // Walk cycle: legs swing, body bobs a pixel.
  const swing = [0, 1, 0, -1][step % 4];
  const bob = step % 2 === 0 ? 0 : 1;

  const hipY = baseY - metrics.legLength;
  const shoulderY = hipY - metrics.torsoHeight + bob;
  const headY = shoulderY - metrics.headRadius - 2;

  // Contact shadow, matching the props' offset toward the sun's opposite.
  graphics
    .fillStyle(SHADOW, 0.2)
    .fillEllipse(centreX + 3, baseY + 1, metrics.shoulder * 1.9, 8);

  const trouser = shade(definition.shirt, -0.55);

  // --- Legs ---
  for (const side of [-1, 1]) {
    const offset = side * (metrics.shoulder * 0.34);
    const lift = facing === "side" ? swing * side * 2 : Math.abs(swing) * 1.2;
    graphics
      .fillStyle(shade(trouser, -0.22))
      .fillEllipse(centreX + offset, hipY + metrics.legLength / 2 - lift, 9.5, metrics.legLength + 3);
    graphics
      .fillStyle(trouser)
      .fillEllipse(centreX + offset, hipY + metrics.legLength / 2 - lift, 7.5, metrics.legLength + 1);
    // Shoe
    graphics
      .fillStyle(shade(trouser, -0.42))
      .fillEllipse(centreX + offset, baseY - lift, 9, 5);
  }

  // --- Torso ---
  const torsoWidth = metrics.shoulder * 2;
  graphics
    .fillStyle(shade(definition.shirt, -0.3))
    .fillEllipse(centreX, shoulderY + metrics.torsoHeight / 2, torsoWidth + 3, metrics.torsoHeight + 4);
  graphics
    .fillStyle(definition.shirt)
    .fillEllipse(centreX, shoulderY + metrics.torsoHeight / 2, torsoWidth, metrics.torsoHeight + 1);
  // Sun-side highlight.
  graphics
    .fillStyle(shade(definition.shirt, 0.2), 0.8)
    .fillEllipse(centreX - torsoWidth * 0.22, shoulderY + metrics.torsoHeight * 0.34, torsoWidth * 0.42, metrics.torsoHeight * 0.5);

  // --- Outfit motif: non-colour-only distinguishing detail ---
  const motif = shade(definition.shirt, 0.34);
  if (definition.outfit === "striped") {
    for (let stripe = 0; stripe < 3; stripe += 1) {
      graphics
        .fillStyle(motif, 0.85)
        .fillRect(centreX - torsoWidth / 2 + 2, shoulderY + 4 + stripe * 6, torsoWidth - 4, 2);
    }
  } else if (definition.outfit === "floral") {
    for (let dot = 0; dot < 5; dot += 1) {
      const dx = ((dot * 37) % Math.max(1, torsoWidth - 8)) - torsoWidth / 2 + 4;
      const dy = 4 + ((dot * 23) % Math.max(1, metrics.torsoHeight - 6));
      graphics.fillStyle(motif, 0.9).fillEllipse(centreX + dx, shoulderY + dy, 4, 4);
    }
  } else if (definition.outfit === "collared") {
    graphics
      .fillStyle(motif, 0.9)
      .fillEllipse(centreX, shoulderY + 3, torsoWidth * 0.5, 5);
  } else if (definition.outfit === "work-vest") {
    graphics
      .fillStyle(shade(definition.shirt, -0.4), 0.9)
      .fillRect(centreX - torsoWidth / 2 + 1, shoulderY + 2, 5, metrics.torsoHeight - 2)
      .fillRect(centreX + torsoWidth / 2 - 6, shoulderY + 2, 5, metrics.torsoHeight - 2);
  }

  if (definition.accessory === "apron") {
    graphics
      .fillStyle(shade(0xf2ead2, -0.08), 0.95)
      .fillEllipse(centreX, shoulderY + metrics.torsoHeight * 0.68, torsoWidth * 0.72, metrics.torsoHeight * 0.62);
  }

  // --- Arms ---
  for (const side of [-1, 1]) {
    const offset = side * (metrics.shoulder + 2);
    const armSwing = facing === "side" ? -swing * side * 2 : 0;
    graphics
      .fillStyle(shade(definition.shirt, -0.24))
      .fillEllipse(centreX + offset, shoulderY + 9 + armSwing, 7, 15);
    graphics
      .fillStyle(shade(definition.skin, -0.05))
      .fillEllipse(centreX + offset, shoulderY + 16 + armSwing, 5.5, 5.5);
  }

  // --- Head ---
  graphics
    .fillStyle(shade(definition.skin, -0.28))
    .fillEllipse(centreX, headY, metrics.headRadius * 2 + 2.5, metrics.headRadius * 2 + 2.5);
  graphics
    .fillStyle(definition.skin)
    .fillEllipse(centreX, headY, metrics.headRadius * 2, metrics.headRadius * 2);
  graphics
    .fillStyle(shade(definition.skin, 0.18), 0.75)
    .fillEllipse(centreX - metrics.headRadius * 0.34, headY - metrics.headRadius * 0.32, metrics.headRadius, metrics.headRadius);

  // --- Hair: silhouette is the primary non-colour identifier ---
  const hair = definition.hair;
  const hairRim = shade(hair, -0.3);
  const r = metrics.headRadius;
  switch (definition.hairStyle) {
    case "bun":
      graphics.fillStyle(hairRim).fillEllipse(centreX, headY - r * 1.32, r * 1.1, r * 1.1);
      graphics.fillStyle(hair).fillEllipse(centreX, headY - r * 1.32, r * 0.86, r * 0.86);
      graphics.fillStyle(hair).fillEllipse(centreX, headY - r * 0.42, r * 2, r * 1.15);
      break;
    case "bob":
      graphics.fillStyle(hairRim).fillEllipse(centreX, headY - r * 0.18, r * 2.24, r * 1.9);
      graphics.fillStyle(hair).fillEllipse(centreX, headY - r * 0.26, r * 2.05, r * 1.7);
      graphics.fillStyle(definition.skin).fillEllipse(centreX, headY + r * 0.34, r * 1.35, r * 1.2);
      break;
    case "crop":
      graphics.fillStyle(hair).fillEllipse(centreX, headY - r * 0.5, r * 1.86, r * 1.05);
      break;
    case "receding":
      graphics.fillStyle(hair).fillEllipse(centreX, headY - r * 0.46, r * 1.5, r * 0.78);
      graphics.fillStyle(hair).fillEllipse(centreX - r * 0.82, headY - r * 0.1, r * 0.5, r * 0.8);
      graphics.fillStyle(hair).fillEllipse(centreX + r * 0.82, headY - r * 0.1, r * 0.5, r * 0.8);
      break;
    default: // side-part
      graphics.fillStyle(hairRim).fillEllipse(centreX, headY - r * 0.4, r * 2.05, r * 1.3);
      graphics.fillStyle(hair).fillEllipse(centreX + r * 0.2, headY - r * 0.46, r * 1.7, r * 1.1);
      break;
  }

  // --- Face, only when facing the camera ---
  if (facing !== "up") {
    const eyeY = headY + 1;
    const eyeSpread = r * 0.44;
    const eyeX = facing === "side" ? centreX + r * 0.3 : centreX;
    graphics.fillStyle(shade(definition.skin, -0.62));
    if (blink) {
      graphics.fillRect(eyeX - eyeSpread - 1.5, eyeY, 3, 1.2);
      if (facing !== "side") graphics.fillRect(eyeX + eyeSpread - 1.5, eyeY, 3, 1.2);
    } else {
      graphics.fillEllipse(eyeX - eyeSpread, eyeY, 2.4, 2.8);
      if (facing !== "side") graphics.fillEllipse(eyeX + eyeSpread, eyeY, 2.4, 2.8);
    }
    graphics
      .fillStyle(shade(0xd97a58, -0.1), 0.5)
      .fillEllipse(eyeX - eyeSpread * 1.7, eyeY + 2.6, 3, 2)
      .fillEllipse(eyeX + eyeSpread * 1.7, eyeY + 2.6, 3, 2);
  }

  // --- Accessories ---
  if (definition.accessory === "glasses") {
    const glass = 0xdce9ee;
    graphics
      .fillStyle(shade(glass, -0.4), 0.9)
      .fillEllipse(centreX - r * 0.44, headY + 1, 6.4, 5.4)
      .fillEllipse(centreX + r * 0.44, headY + 1, 6.4, 5.4);
    graphics
      .fillStyle(glass, 0.55)
      .fillEllipse(centreX - r * 0.44, headY + 1, 4.8, 3.9)
      .fillEllipse(centreX + r * 0.44, headY + 1, 4.8, 3.9);
  }
  if (definition.accessory === "cane") {
    const cane = 0x8a6a44;
    graphics
      .fillStyle(shade(cane, -0.28))
      .fillRect(centreX + metrics.shoulder + 4, shoulderY + 14, 3, metrics.legLength + metrics.torsoHeight - 8);
    graphics
      .fillStyle(cane)
      .fillEllipse(centreX + metrics.shoulder + 5.5, shoulderY + 14, 6, 4);
  }
  if (definition.carry === "tote") {
    const tote = shade(definition.shirt, -0.46);
    graphics
      .fillStyle(shade(tote, -0.2))
      .fillEllipse(centreX - metrics.shoulder - 3, shoulderY + 20, 12, 13);
    graphics.fillStyle(tote).fillEllipse(centreX - metrics.shoulder - 3, shoulderY + 20, 10, 11);
  }
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
