/**
 * Outline-free props for the isometric estate.
 *
 * Props are upright billboards, not projected geometry — the same trick the
 * reference art uses, and the reason the existing character sprites drop into
 * the isometric world unchanged. What does *not* carry over is the shipped
 * art's drawing grammar: every top-down prop is wrapped in a hard
 * `PALETTE.ink` outline, which reads as a sticker against the outline-free
 * building volumes. Measured on the Stage 0 slice, that clash was the single
 * worst remaining visual problem.
 *
 * So these forms use a *rim* instead of an outline — a darker shade of the
 * fill itself — plus one consistent sun direction (upper-left) and a baked
 * elliptical contact shadow. Nothing here is black.
 */

import Phaser from "phaser";

import { isoHash } from "./projection.js";

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

/** Ground contact shadow, offset toward the sun's opposite. */
function contactShadow(
  graphics: Phaser.GameObjects.Graphics,
  centreX: number,
  baseY: number,
  radius: number,
): void {
  graphics
    .fillStyle(SHADOW, 0.1)
    .fillEllipse(centreX + 8, baseY - 2, radius * 2.1, radius * 0.92)
    .fillStyle(SHADOW, 0.16)
    .fillEllipse(centreX + 5, baseY - 3, radius * 1.6, radius * 0.7);
}

/**
 * A soft foliage mass: overlapping blobs shaded from upper-left, with a rim
 * of the darkened fill rather than an ink outline.
 */
function foliageMass(
  graphics: Phaser.GameObjects.Graphics,
  centreX: number,
  centreY: number,
  radiusX: number,
  radiusY: number,
  base: number,
  seedBase: number,
  blobs = 7,
): void {
  // Rim first, slightly larger, so the silhouette reads without hard edges.
  graphics
    .fillStyle(shade(base, -0.34), 1)
    .fillEllipse(centreX, centreY, radiusX * 2.06, radiusY * 2.06);

  for (let blob = 0; blob < blobs; blob += 1) {
    const seed = isoHash(seedBase + blob * 31, blob * 17);
    const angle = (blob / blobs) * Math.PI * 2 + (seed % 100) / 260;
    const spreadX = radiusX * 0.46 * Math.cos(angle);
    const spreadY = radiusY * 0.46 * Math.sin(angle);
    const size = 0.5 + ((seed >>> 8) % 100) / 320;
    // Lit toward the upper-left, shaded toward the lower-right.
    const light = -(spreadX / radiusX) * 0.16 - (spreadY / radiusY) * 0.2;
    graphics
      .fillStyle(shade(base, light), 1)
      .fillEllipse(
        centreX + spreadX,
        centreY + spreadY,
        radiusX * size * 1.5,
        radiusY * size * 1.5,
      );
  }

  // Highlight cluster catching the sun.
  graphics
    .fillStyle(shade(base, 0.2), 0.85)
    .fillEllipse(
      centreX - radiusX * 0.36,
      centreY - radiusY * 0.4,
      radiusX * 0.8,
      radiusY * 0.72,
    );
}

export interface IsoPropSpec {
  key: string;
  width: number;
  height: number;
  draw: (graphics: Phaser.GameObjects.Graphics) => void;
}

const TRUNK = 0x7a5a3c;
const LEAF_RAIN = 0x4f7a35;
const LEAF_FRANGIPANI = 0x5d8a3e;
const LEAF_PALM = 0x4a7a3a;
const SHRUB = 0x5b8340;
const HEDGE = 0x4e7538;
const PANDAN = 0x568a42;
const SOIL = 0x6b4f37;
const PLANTER = 0xbfa982;

/** Every isometric prop form, keyed to match the shipped texture names. */
export const ISO_PROPS: readonly IsoPropSpec[] = [
  {
    key: "iso-tree-rain",
    width: 180,
    height: 180,
    draw: (g) => {
      contactShadow(g, 90, 176, 46);
      g.fillStyle(shade(TRUNK, -0.24)).fillRect(80, 96, 20, 78);
      g.fillStyle(TRUNK).fillRect(83, 96, 13, 78);
      g.fillStyle(shade(TRUNK, 0.16)).fillRect(83, 96, 5, 78);
      // Buttress roots widen the base so it sits on the ground.
      g.fillStyle(shade(TRUNK, -0.3)).fillEllipse(90, 174, 44, 14);
      foliageMass(g, 90, 66, 74, 52, LEAF_RAIN, 11, 9);
    },
  },
  {
    key: "iso-tree-frangipani",
    width: 140,
    height: 148,
    draw: (g) => {
      contactShadow(g, 70, 144, 34);
      g.fillStyle(shade(TRUNK, -0.22)).fillRect(62, 84, 16, 58);
      g.fillStyle(TRUNK).fillRect(64, 84, 10, 58);
      g.fillStyle(shade(TRUNK, 0.14)).fillRect(64, 84, 4, 58);
      foliageMass(g, 70, 58, 54, 42, LEAF_FRANGIPANI, 29, 7);
      // Blossoms, the frangipani signature.
      for (let bloom = 0; bloom < 9; bloom += 1) {
        const seed = isoHash(bloom * 41, 7);
        g.fillStyle(0xf6ead0, 0.92).fillEllipse(
          30 + (seed % 80),
          32 + ((seed >>> 7) % 46),
          9,
          7,
        );
      }
    },
  },
  {
    key: "iso-tree-palm",
    width: 150,
    height: 184,
    draw: (g) => {
      contactShadow(g, 75, 180, 30);
      // Curved trunk, tapering.
      for (let segment = 0; segment < 15; segment += 1) {
        const t = segment / 15;
        const trunkX = 68 + Math.sin(t * 1.1) * 12;
        const trunkY = 176 - segment * 8.4;
        const trunkWidth = 17 - t * 6;
        g.fillStyle(shade(TRUNK, -0.2 + t * 0.1)).fillRect(
          trunkX,
          trunkY,
          trunkWidth,
          9,
        );
        g.fillStyle(shade(TRUNK, 0.12)).fillRect(trunkX, trunkY, 3, 9);
      }
      // Fronds radiating from the crown, each an arced blade.
      const crownX = 82;
      const crownY = 48;
      for (let frond = 0; frond < 9; frond += 1) {
        const angle = (frond / 9) * Math.PI * 2;
        const reach = 52 + (isoHash(frond * 13, 3) % 16);
        const tipX = crownX + Math.cos(angle) * reach;
        const tipY = crownY + Math.sin(angle) * reach * 0.62;
        const light = -Math.sin(angle) * 0.16 - Math.cos(angle) * 0.08;
        g.fillStyle(shade(LEAF_PALM, light), 1);
        for (let step = 0; step < 9; step += 1) {
          const s = step / 9;
          const px = crownX + (tipX - crownX) * s;
          const py = crownY + (tipY - crownY) * s + s * s * 12;
          g.fillEllipse(px, py, 17 - s * 11, 11 - s * 7);
        }
      }
      g.fillStyle(shade(LEAF_PALM, 0.22)).fillEllipse(crownX, crownY, 20, 14);
    },
  },
  {
    key: "iso-shrub",
    width: 92,
    height: 66,
    draw: (g) => {
      contactShadow(g, 46, 62, 24);
      foliageMass(g, 46, 34, 34, 22, SHRUB, 53, 6);
    },
  },
  {
    key: "iso-hedge",
    width: 150,
    height: 70,
    draw: (g) => {
      contactShadow(g, 75, 66, 40);
      g.fillStyle(shade(HEDGE, -0.3)).fillEllipse(75, 38, 142, 42);
      for (let lobe = 0; lobe < 5; lobe += 1) {
        const x = 24 + lobe * 26;
        const seed = isoHash(lobe * 23, 11);
        g.fillStyle(shade(HEDGE, -0.06 + ((seed % 10) / 10) * 0.14)).fillEllipse(
          x,
          36,
          40,
          34,
        );
      }
      g.fillStyle(shade(HEDGE, 0.2), 0.8).fillEllipse(58, 27, 60, 14);
    },
  },
  {
    key: "iso-pandan",
    width: 88,
    height: 82,
    draw: (g) => {
      contactShadow(g, 44, 78, 22);
      // Spiky strap leaves fanning out.
      for (let leaf = 0; leaf < 11; leaf += 1) {
        const angle = -Math.PI / 2 + (leaf - 5) * 0.24;
        const reach = 40 + (isoHash(leaf * 19, 5) % 14);
        const tipX = 44 + Math.cos(angle) * reach;
        const tipY = 72 + Math.sin(angle) * reach;
        const light = -Math.cos(angle) * 0.18;
        g.fillStyle(shade(PANDAN, light));
        for (let step = 0; step < 7; step += 1) {
          const s = step / 7;
          g.fillEllipse(
            44 + (tipX - 44) * s,
            72 + (tipY - 72) * s,
            11 - s * 8,
            9 - s * 6,
          );
        }
      }
      g.fillStyle(shade(PANDAN, -0.3)).fillEllipse(44, 72, 26, 12);
    },
  },
  {
    key: "iso-flower-bed",
    width: 128,
    height: 76,
    draw: (g) => {
      contactShadow(g, 64, 72, 36);
      // Raised kerb, lit on top, shaded on the near face.
      g.fillStyle(shade(PLANTER, -0.26)).fillRect(10, 42, 108, 24);
      g.fillStyle(PLANTER).fillRect(10, 38, 108, 8);
      g.fillStyle(shade(PLANTER, 0.18)).fillRect(10, 38, 108, 3);
      g.fillStyle(SOIL).fillRect(16, 40, 96, 8);
      // Planting: mixed foliage with bloom flecks, no hard edges.
      for (let plant = 0; plant < 13; plant += 1) {
        const seed = isoHash(plant * 37, 13);
        const px = 20 + (seed % 90);
        const py = 30 + ((seed >>> 6) % 12);
        g.fillStyle(shade(SHRUB, ((seed >>> 11) % 10) / 10 * 0.3 - 0.14)).fillEllipse(
          px,
          py,
          16,
          13,
        );
        if (plant % 3 === 0) {
          const bloom = [0xe8c46a, 0xd97a58, 0xf2ead2, 0xc9a2cf][(seed >>> 3) % 4];
          g.fillStyle(bloom, 0.95).fillEllipse(px + 2, py - 6, 7, 6);
        }
      }
    },
  },
];

/** Registers every isometric prop texture. Idempotent, like `makeTexture`. */
export function ensureIsoPropTextures(scene: Phaser.Scene): void {
  for (const spec of ISO_PROPS) {
    if (scene.textures.exists(spec.key)) continue;
    const graphics = scene.make.graphics({ x: 0, y: 0 });
    spec.draw(graphics);
    graphics.generateTexture(spec.key, spec.width, spec.height);
    graphics.destroy();
  }
}

/** Maps a shipped top-down texture key onto its isometric replacement. */
export function isoTextureFor(shippedKey: string): string {
  switch (shippedKey) {
    case "tree-rain":
      return "iso-tree-rain";
    case "tree-palm":
      return "iso-tree-palm";
    case "tree-frangipani":
      return "iso-tree-frangipani";
    case "landscape-shrub":
      return "iso-shrub";
    case "landscape-hedge":
      return "iso-hedge";
    case "landscape-pandan":
      return "iso-pandan";
    case "landscape-flower-bed":
      return "iso-flower-bed";
    default:
      return shippedKey;
  }
}
