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
import { SHADOW_TINT } from "../textureGrain.js";

// Sky-lit, not black: see SHADOW_TINT in textureGrain.ts.
const SHADOW = SHADOW_TINT;

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

/**
 * Courtyard furniture, in the register the reference art actually reads by:
 * chess players mid-game, stacked plastic chairs, a notice board with real
 * posters, a bicycle rack, a shaded pergola. These carry more of the
 * "somebody lives here" impression than any amount of ground detail.
 */
const FURNITURE: readonly IsoPropSpec[] = [
  {
    key: "iso-chess-table",
    width: 150,
    height: 116,
    draw: (g) => {
      contactShadow(g, 75, 110, 40);
      // Two concrete stools flanking a chequered table.
      for (const stoolX of [26, 124]) {
        g.fillStyle(shade(0xbdb3a2, -0.3)).fillEllipse(stoolX, 88, 26, 15);
        g.fillStyle(0xbdb3a2).fillEllipse(stoolX, 83, 26, 14);
        g.fillStyle(shade(0xbdb3a2, 0.16)).fillEllipse(stoolX - 3, 80, 16, 7);
      }
      // Table drum.
      g.fillStyle(shade(0xb0a693, -0.34)).fillEllipse(75, 78, 62, 30);
      g.fillStyle(0xb0a693).fillRect(46, 56, 58, 20);
      g.fillStyle(shade(0xb0a693, -0.2)).fillEllipse(75, 76, 58, 22);
      // Chequered top, drawn as an iso diamond of alternating squares.
      g.fillStyle(shade(0xe6dcc6, -0.24)).fillEllipse(75, 56, 66, 32);
      for (let row = 0; row < 6; row += 1) {
        for (let col = 0; col < 6; col += 1) {
          const cx = 75 + (col - row) * 7.4;
          const cy = 56 + (col + row) * 3.7 - 18;
          g.fillStyle((row + col) % 2 === 0 ? 0xf2ead2 : 0x4a4038, 0.95);
          g.fillEllipse(cx, cy, 8, 4.4);
        }
      }
      // Two seated players, shoulders above the table line.
      for (const [px, shirt] of [[26, 0x8a5f4a], [124, 0x4a6f8a]] as const) {
        g.fillStyle(shade(shirt, -0.28)).fillEllipse(px, 64, 26, 26);
        g.fillStyle(shirt).fillEllipse(px, 64, 22, 22);
        g.fillStyle(shade(0xd6a97c, -0.26)).fillEllipse(px, 45, 17, 17);
        g.fillStyle(0xd6a97c).fillEllipse(px, 45, 14.5, 14.5);
        g.fillStyle(0xb8b0a6).fillEllipse(px, 40, 14, 8);
      }
    },
  },
  {
    key: "iso-chair-stack",
    width: 120,
    height: 104,
    draw: (g) => {
      contactShadow(g, 60, 98, 32);
      // Three stacks of moulded plastic chairs, the estate's signature clutter.
      const stacks: [number, number][] = [
        [30, 0xc4544a],
        [60, 0x3f6f8c],
        [90, 0xc4544a],
      ];
      for (const [sx, colour] of stacks) {
        for (let chair = 0; chair < 6; chair += 1) {
          const cy = 92 - chair * 7;
          g.fillStyle(shade(colour, -0.34)).fillEllipse(sx, cy, 30, 13);
          g.fillStyle(shade(colour, chair % 2 ? -0.04 : 0.05)).fillEllipse(sx, cy - 1.5, 26, 10);
        }
        // Backrest rising off the top chair.
        g.fillStyle(shade(colour, -0.24)).fillRect(sx - 12, 34, 24, 18);
        g.fillStyle(colour).fillRect(sx - 10, 34, 20, 16);
      }
    },
  },
  {
    key: "iso-notice-board",
    width: 156,
    height: 122,
    draw: (g) => {
      contactShadow(g, 78, 116, 40);
      // Posts.
      g.fillStyle(shade(0x6b5136, -0.2)).fillRect(24, 66, 9, 48);
      g.fillStyle(shade(0x6b5136, -0.2)).fillRect(123, 66, 9, 48);
      // Board carcass with a slight iso skew.
      g.fillStyle(shade(0x7a5c3d, -0.3)).fillRect(16, 18, 124, 56);
      g.fillStyle(0x7a5c3d).fillRect(19, 20, 118, 50);
      g.fillStyle(shade(0xd8cdb4, -0.06)).fillRect(23, 24, 110, 42);
      // Pinned notices at varied angles and sizes.
      for (let notice = 0; notice < 8; notice += 1) {
        const seed = isoHash(notice * 61, 3);
        const nx = 27 + (seed % 96);
        const ny = 27 + ((seed >>> 6) % 30);
        const nw = 15 + ((seed >>> 11) % 10);
        const nh = 11 + ((seed >>> 15) % 7);
        g.fillStyle([0xf6f0e0, 0xe8dcc0, 0xf2ead2][(seed >>> 3) % 3], 0.98);
        g.fillRect(nx, ny, nw, nh);
        g.fillStyle(shade(0x8a8070, 0.1), 0.7);
        for (let line = 0; line < 3; line += 1) {
          g.fillRect(nx + 2, ny + 2 + line * 3, nw - 4, 1);
        }
      }
      // Pitched rain hood.
      g.fillStyle(shade(0x4f6d5a, -0.2)).fillRect(12, 10, 132, 10);
      g.fillStyle(0x4f6d5a).fillRect(12, 8, 132, 6);
    },
  },
  {
    key: "iso-bike-rack",
    width: 168,
    height: 104,
    draw: (g) => {
      contactShadow(g, 84, 98, 46);
      // Marked bay.
      g.fillStyle(shade(0xc7b48f, -0.12), 0.6).fillEllipse(84, 88, 150, 34);
      // Rack hoops.
      for (let hoop = 0; hoop < 4; hoop += 1) {
        const hx = 30 + hoop * 36;
        g.fillStyle(shade(0x5f7d86, -0.3)).fillRect(hx, 50, 5, 40);
        g.fillStyle(0x5f7d86).fillRect(hx, 48, 4, 40);
      }
      g.fillStyle(0x5f7d86).fillRect(30, 48, 112, 5);
      // Two bicycles leaning in, wheels as rims not discs.
      for (const [bx, frame] of [[52, 0x9c4a42], [110, 0x35606b]] as const) {
        for (const wheelX of [bx - 17, bx + 17]) {
          g.fillStyle(shade(0x2e2a26, -0.1)).fillEllipse(wheelX, 80, 30, 16);
          g.fillStyle(shade(0xc7b48f, 0.1)).fillEllipse(wheelX, 80, 20, 10);
        }
        g.fillStyle(frame).fillRect(bx - 16, 62, 32, 4);
        g.fillStyle(frame).fillRect(bx - 4, 54, 4, 20);
        g.fillStyle(shade(frame, -0.4)).fillEllipse(bx - 12, 55, 13, 5);
      }
    },
  },
  {
    key: "iso-shaded-seating",
    width: 232,
    height: 150,
    draw: (g) => {
      contactShadow(g, 116, 144, 62);
      // Pergola posts.
      for (const px of [22, 202]) {
        g.fillStyle(shade(0x7d6242, -0.28)).fillRect(px, 52, 11, 84);
        g.fillStyle(0x7d6242).fillRect(px + 1, 52, 8, 84);
      }
      // Beam and rafters.
      g.fillStyle(shade(0x8a6c4a, -0.2)).fillRect(14, 46, 202, 12);
      for (let rafter = 0; rafter < 9; rafter += 1) {
        g.fillStyle(shade(0x8a6c4a, rafter % 2 ? -0.06 : 0.06));
        g.fillRect(24 + rafter * 22, 40, 12, 10);
      }
      // Climbing greenery over the top, the reference's defining touch.
      for (let leaf = 0; leaf < 22; leaf += 1) {
        const seed = isoHash(leaf * 43, 17);
        const lx = 16 + (seed % 202);
        const ly = 24 + ((seed >>> 7) % 26);
        g.fillStyle(shade(SHRUB, ((seed >>> 12) % 10) / 10 * 0.34 - 0.16), 0.95);
        g.fillEllipse(lx, ly, 26, 18);
      }
      // Bench beneath, with two seated neighbours.
      g.fillStyle(shade(0x7d6242, -0.3)).fillRect(48, 108, 138, 12);
      g.fillStyle(0x8a6c4a).fillRect(48, 104, 138, 8);
      for (const [px, shirt] of [[86, 0x9c8ab0], [148, 0x6f9070]] as const) {
        g.fillStyle(shade(shirt, -0.28)).fillEllipse(px, 92, 27, 27);
        g.fillStyle(shirt).fillEllipse(px, 92, 23, 23);
        g.fillStyle(shade(0xd6a97c, -0.26)).fillEllipse(px, 72, 17, 17);
        g.fillStyle(0xd6a97c).fillEllipse(px, 72, 14.5, 14.5);
        g.fillStyle(0xc9c2b6).fillEllipse(px, 67, 14, 8);
      }
    },
  },
  {
    key: "iso-cleaning-cart",
    width: 132,
    height: 116,
    draw: (g) => {
      contactShadow(g, 66, 110, 36);
      // Trolley frame.
      g.fillStyle(shade(0x5f7d86, -0.3)).fillRect(24, 44, 6, 56);
      g.fillStyle(shade(0x5f7d86, -0.3)).fillRect(96, 44, 6, 56);
      g.fillStyle(0x5f7d86).fillRect(24, 44, 78, 6);
      // Wheels.
      for (const wx of [32, 94]) {
        g.fillStyle(shade(0x2e2a26, -0.1)).fillEllipse(wx, 100, 20, 11);
      }
      // Bins: one red, one grey.
      g.fillStyle(shade(0xb8493f, -0.3)).fillEllipse(48, 82, 40, 20);
      g.fillStyle(0xb8493f).fillRect(30, 60, 36, 22);
      g.fillStyle(shade(0xb8493f, 0.16)).fillRect(30, 60, 10, 22);
      g.fillStyle(shade(0x8c8a84, -0.3)).fillEllipse(88, 84, 34, 18);
      g.fillStyle(0x8c8a84).fillRect(72, 64, 32, 20);
      // Mop and broom handles.
      g.fillStyle(shade(0x9a7b4f, -0.1)).fillRect(60, 8, 5, 56);
      g.fillStyle(0xd8c9a6).fillEllipse(62, 10, 18, 12);
      g.fillStyle(shade(0x9a7b4f, -0.1)).fillRect(80, 14, 5, 50);
      g.fillStyle(0xb8a06a).fillEllipse(82, 16, 14, 14);
    },
  },
];

/** Registers every isometric prop texture. Idempotent, like `makeTexture`. */
export function ensureIsoPropTextures(scene: Phaser.Scene): void {
  for (const spec of [...ISO_PROPS, ...FURNITURE]) {
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
    case "prop-chess-table":
      return "iso-chess-table";
    case "prop-chair-stack":
      return "iso-chair-stack";
    case "prop-bike-rack":
      return "iso-bike-rack";
    case "prop-shaded-seating":
      return "iso-shaded-seating";
    case "prop-maintenance-trolley":
      return "iso-cleaning-cart";
    default:
      return shippedKey;
  }
}
