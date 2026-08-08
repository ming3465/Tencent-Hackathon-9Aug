/**
 * Per-pixel grain and light falloff for any baked texture.
 *
 * Projection-agnostic on purpose. The shipped top-down estate and the
 * isometric preview both bake through this, so it lives outside
 * `src/game/iso/` — that directory has to stay a self-contained unit the
 * isometric direction can be dropped by deleting (see AGENTS.md).
 *
 * Phaser's `Graphics` can only lay down flat fills, so a purely Graphics-based
 * ground plateaus around ten thousand distinct colours no matter how many
 * tonal steps are authored — every step is still a hard-edged constant region.
 * The reference render reaches 121,832 because it is continuous.
 *
 * A canvas texture closes most of that gap without introducing a single
 * generated raster asset: the world stays 100% code-drawn, which is what the
 * AI evidence, README creation record and deck slide 5 all claim. Real
 * `ImageData` access allows two things Graphics cannot express:
 *
 *  1. **Material grain** — a per-pixel deterministic jitter of a few levels,
 *     which reads as concrete aggregate and turf rather than as noise.
 *  2. **Light falloff** — a smooth low-frequency gradient across the whole
 *     plane, so the ground is genuinely brighter where the sun hits it.
 *
 * Both are deterministic functions of world position, so nothing here breaks
 * reduced motion, and the whole pass runs once at bake time — it never touches
 * the per-frame budget.
 */

import Phaser from "phaser";

/** Cheap deterministic hash, matching the one used by the terrain painter. */
function grainHash(x: number, y: number): number {
  let value = Math.imul(x + 0x6d2b79f5, 0x1b873593) ^ Math.imul(y + 97, 0x85ebca6b);
  value ^= value >>> 13;
  return Math.imul(value, 0xc2b2ae35) >>> 0;
}

export interface GrainOptions {
  /** Peak +/- jitter per channel, in 0-255 levels. Around 4 reads as material. */
  amplitude?: number;
  /** Strength of the smooth light falloff, 0-1. */
  falloff?: number;
  /** Screen-space centre of the light, normalised 0-1. */
  lightX?: number;
  lightY?: number;
}

/**
 * Copies a Graphics-generated texture into a canvas texture, applying grain
 * and light falloff. Returns the new texture key.
 *
 * Transparent pixels are left untouched so prop and building silhouettes keep
 * clean edges.
 */
export function bakeWithGrain(
  scene: Phaser.Scene,
  sourceKey: string,
  targetKey: string,
  width: number,
  height: number,
  options: GrainOptions = {},
): string {
  const amplitude = options.amplitude ?? 4;
  const falloff = options.falloff ?? 0.16;
  const lightX = options.lightX ?? 0.34;
  const lightY = options.lightY ?? 0.24;

  if (scene.textures.exists(targetKey)) scene.textures.remove(targetKey);
  const canvasTexture = scene.textures.createCanvas(targetKey, width, height);
  if (!canvasTexture) return sourceKey;
  const context = canvasTexture.getContext();
  if (!context) return sourceKey;

  const sourceImage = scene.textures.get(sourceKey).getSourceImage();
  context.drawImage(sourceImage as CanvasImageSource, 0, 0);

  const image = context.getImageData(0, 0, width, height);
  const pixels = image.data;
  const invWidth = 1 / width;
  const invHeight = 1 / height;

  for (let y = 0; y < height; y += 1) {
    const normalisedY = y * invHeight;
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      if (pixels[index + 3] === 0) continue;

      // Smooth light falloff: distance from the light centre, squared for a
      // gentle shoulder rather than a visible ring.
      const dx = x * invWidth - lightX;
      const dy = normalisedY - lightY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const light = 1 + falloff * (0.55 - distance);

      // Three grain octaves. The fine one is per-pixel, the mid and coarse
      // ones mottle at 4 px and 16 px, so the result reads as material rather
      // than as television static while still varying every single pixel.
      const fine = (grainHash(x, y) & 0xff) / 255 - 0.5;
      const mid = (grainHash(x >> 2, y >> 2) & 0xff) / 255 - 0.5;
      const coarse = (grainHash(x >> 4, y >> 4) & 0xff) / 255 - 0.5;
      const jitter = (fine * 0.5 + mid * 0.3 + coarse * 0.2) * amplitude * 2;

      // A smooth diagonal gradient on top. Unlike the jitter this is
      // continuous, so neighbouring pixels land on different levels even
      // where the underlying fill is one flat colour - which is exactly how
      // the reference render reaches its colour count.
      const sweep = ((x + y) % 512) / 512 - 0.5;

      for (let channel = 0; channel < 3; channel += 1) {
        const value = pixels[index + channel] * light + jitter + sweep * amplitude * 0.9;
        pixels[index + channel] = value < 0 ? 0 : value > 255 ? 255 : value;
      }
    }
  }

  context.putImageData(image, 0, 0);
  canvasTexture.refresh();
  return targetKey;
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

export function macroField(worldX: number, worldY: number, cell: number): number {
  const gridX = Math.floor(worldX / cell);
  const gridY = Math.floor(worldY / cell);
  const fracX = worldX / cell - gridX;
  const fracY = worldY / cell - gridY;
  // Smoothstep, so cells blend instead of banding at their borders.
  const ease = (t: number): number => t * t * (3 - 2 * t);
  const easedX = ease(fracX);
  const easedY = ease(fracY);
  const corner = (x: number, y: number): number => (grainHash(x, y) % 4096) / 4096;
  const top = corner(gridX, gridY) * (1 - easedX)
    + corner(gridX + 1, gridY) * easedX;
  const bottom = corner(gridX, gridY + 1) * (1 - easedX)
    + corner(gridX + 1, gridY + 1) * easedX;
  return top * (1 - easedY) + bottom * easedY;
}

/** Picks a tone band from a field value, dithered so bands never show a seam. */
export function tonalStep(field: number, jitter: number, steps: number): number {
  const dithered = field + (jitter / 4096 - 0.5) * (0.9 / steps);
  return Math.max(0, Math.min(steps - 1, Math.floor(dithered * steps)));
}

/* ---- Material shading ----------------------------------------------------
 *
 * Four helpers that decide what a surface is made of rather than merely what
 * colour it is. Shared by both painters, so the shipped top-down estate and the
 * isometric build shade identically.
 */

function channelsOf(colour: number): [number, number, number] {
  return [(colour >> 16) & 0xff, (colour >> 8) & 0xff, colour & 0xff];
}

function packChannels(r: number, g: number, b: number): number {
  const clamp = (value: number): number =>
    Math.max(0, Math.min(255, Math.round(value)));
  return (clamp(r) << 16) | (clamp(g) << 8) | clamp(b);
}

function mixToward(colour: number, target: number, amount: number): number {
  const ratio = Math.max(0, Math.min(1, amount));
  const [r, g, b] = channelsOf(colour);
  const [tr, tg, tb] = channelsOf(target);
  return packChannels(
    r + (tr - r) * ratio,
    g + (tg - g) * ratio,
    b + (tb - b) * ratio,
  );
}

/**
 * The colour shadows are mixed toward. Deliberately a desaturated blue-violet
 * rather than black or brown.
 *
 * Real shadow is lit by the sky, not by nothing, so it shifts cool while it
 * darkens. Every reference we are working from does this, and it is the single
 * largest difference between our ground and theirs: mixing toward black gives
 * mud, mixing toward this gives depth.
 */
export const SHADOW_TINT = 0x3a2f5c;

/** Warm sunlight, for the lit edge of a surface facing the sun. */
export const RIM_TINT = 0xfff2cf;

/** Darkens `colour` toward sky-lit shadow. `amount` is 0-1. */
export function shadowTint(colour: number, amount: number): number {
  return mixToward(colour, SHADOW_TINT, amount);
}

/** Lifts `colour` toward warm sunlight. `amount` is 0-1. */
export function rimLight(colour: number, amount: number): number {
  return mixToward(colour, RIM_TINT, amount);
}

/**
 * An N-tone ramp through one material, shadow-tinted at the dark end and
 * sun-tinted at the light end.
 *
 * A surface painted from a ramp reads as one material under light. A surface
 * painted from three unrelated tones reads as three materials.
 */
export function ramp(
  base: number,
  steps: number,
  spread = 0.34,
): readonly number[] {
  const count = Math.max(2, Math.floor(steps));
  const tones: number[] = [];
  for (let index = 0; index < count; index += 1) {
    // -1 at the shadow end, +1 at the lit end.
    const position = (index / (count - 1)) * 2 - 1;
    tones.push(
      position < 0
        ? shadowTint(base, -position * spread)
        : rimLight(base, position * spread * 0.72),
    );
  }
  return tones;
}

/**
 * Ordered 4x4 Bayer dither. Returns true when the pixel at (x, y) should take
 * the *lighter* of two tones for a given blend `ratio`.
 *
 * Used to break the boundary between two ramp steps, and to fade one material
 * into another across a few cells, instead of banding.
 */
const BAYER_4X4: readonly number[] = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
];

export function dither(x: number, y: number, ratio: number): boolean {
  const threshold = (BAYER_4X4[(y & 3) * 4 + (x & 3)] ?? 0) / 16;
  return ratio > threshold;
}
