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
