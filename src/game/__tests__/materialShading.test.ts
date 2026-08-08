import { describe, expect, it } from "vitest";

import {
  dither,
  ramp,
  rimLight,
  SHADOW_TINT,
  shadowTint,
} from "../textureGrain.js";

function channels(colour: number): [number, number, number] {
  return [(colour >> 16) & 0xff, (colour >> 8) & 0xff, colour & 0xff];
}

/** Perceived lightness, good enough to order two tones of one material. */
function luma(colour: number): number {
  const [r, g, b] = channels(colour);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const GRASS = 0x818d37;
const PAVING = 0xd1a777;

describe("shadowTint", () => {
  it("darkens", () => {
    expect(luma(shadowTint(PAVING, 0.4))).toBeLessThan(luma(PAVING));
  });

  it("shifts cool rather than toward black", () => {
    // The whole point: shadow is lit by the sky. Mixing toward black gives mud.
    const shaded = shadowTint(PAVING, 0.55);
    const [r, , b] = channels(shaded);
    const [baseR, , baseB] = channels(PAVING);
    expect(b / Math.max(1, r)).toBeGreaterThan(baseB / Math.max(1, baseR));
  });

  it("reaches the tint at full strength and is a no-op at zero", () => {
    expect(shadowTint(GRASS, 1)).toBe(SHADOW_TINT);
    expect(shadowTint(GRASS, 0)).toBe(GRASS);
  });

  it("clamps rather than overshooting", () => {
    expect(shadowTint(GRASS, 4)).toBe(SHADOW_TINT);
    expect(shadowTint(GRASS, -2)).toBe(GRASS);
  });
});

describe("rimLight", () => {
  it("lifts toward warm sun", () => {
    const lit = rimLight(GRASS, 0.5);
    expect(luma(lit)).toBeGreaterThan(luma(GRASS));
    const [r, , b] = channels(lit);
    expect(r).toBeGreaterThan(b);
  });
});

describe("ramp", () => {
  it("runs dark to light without repeating a tone", () => {
    const tones = ramp(PAVING, 7);
    expect(tones).toHaveLength(7);
    expect(new Set(tones).size).toBe(7);
    for (let index = 1; index < tones.length; index += 1) {
      expect(luma(tones[index]!)).toBeGreaterThan(luma(tones[index - 1]!));
    }
  });

  it("keeps the base colour at the middle of an odd ramp", () => {
    const tones = ramp(GRASS, 5);
    expect(tones[2]).toBe(GRASS);
  });

  it("never returns fewer than two tones, whatever it is asked for", () => {
    expect(ramp(GRASS, 0).length).toBe(2);
    expect(ramp(GRASS, 1).length).toBe(2);
  });

  it("gives a wider spread when asked, so materials can differ in contrast", () => {
    const tight = ramp(PAVING, 5, 0.1);
    const wide = ramp(PAVING, 5, 0.6);
    const range = (tones: readonly number[]): number =>
      luma(tones[tones.length - 1]!) - luma(tones[0]!);
    expect(range(wide)).toBeGreaterThan(range(tight));
  });
});

describe("dither", () => {
  it("is fully off at 0 and fully on above the top threshold", () => {
    for (let y = 0; y < 4; y += 1) {
      for (let x = 0; x < 4; x += 1) {
        expect(dither(x, y, 0)).toBe(false);
        expect(dither(x, y, 1)).toBe(true);
      }
    }
  });

  it("turns on roughly half the 4x4 cell at a half blend", () => {
    let on = 0;
    for (let y = 0; y < 4; y += 1) {
      for (let x = 0; x < 4; x += 1) if (dither(x, y, 0.5)) on += 1;
    }
    expect(on).toBe(8);
  });

  it("is deterministic and tiles on a 4x4 grid", () => {
    // Bake-time determinism: the same world pixel must dither the same way
    // every run, or screenshots and the smoke palette counts would drift.
    for (const [x, y] of [[0, 0], [1, 2], [3, 3], [2, 1]] as const) {
      expect(dither(x, y, 0.4)).toBe(dither(x + 4, y + 8, 0.4));
    }
  });

  it("increases coverage monotonically with the ratio", () => {
    const coverage = (ratio: number): number => {
      let on = 0;
      for (let y = 0; y < 4; y += 1) {
        for (let x = 0; x < 4; x += 1) if (dither(x, y, ratio)) on += 1;
      }
      return on;
    };
    expect(coverage(0.25)).toBeLessThan(coverage(0.5));
    expect(coverage(0.5)).toBeLessThan(coverage(0.75));
  });
});
