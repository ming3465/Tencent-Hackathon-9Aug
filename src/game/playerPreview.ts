/**
 * Title-screen preview of the player's chosen look.
 *
 * Deliberately not a re-drawing. `CanvasPixelPainter` implements the same
 * `PixelPainter` surface Phaser's `Graphics` does, so the preview calls
 * `drawPlayerFrame` — the exact function that bakes the in-game sprite. What
 * the player picks on the title screen is what walks around the estate, and
 * the two cannot drift apart because there is only one painter.
 *
 * Runs before Phaser boots, on a plain 2D canvas, so choosing a look costs
 * nothing on the loading path.
 */

import { drawPlayerFrame, type PixelPainter } from "./campaignArt.js";
import type { PlayerAppearance } from "./playerIdentity.js";

/** Native size of the player sprite the campaign bakes. */
export const PREVIEW_SPRITE_WIDTH = 40;
export const PREVIEW_SPRITE_HEIGHT = 56;

class CanvasPixelPainter implements PixelPainter {
  private colour = "#000000";

  constructor(
    private readonly context: CanvasRenderingContext2D,
    private readonly scale: number,
  ) {}

  fillStyle(colour: number, alpha = 1): PixelPainter {
    const hex = (colour >>> 0).toString(16).padStart(6, "0");
    this.colour = alpha >= 1 ? `#${hex}` : `#${hex}${
      Math.round(Math.max(0, Math.min(1, alpha)) * 255)
        .toString(16)
        .padStart(2, "0")
    }`;
    return this;
  }

  fillRect(x: number, y: number, width: number, height: number): PixelPainter {
    this.context.fillStyle = this.colour;
    // Rounded so neighbouring rects tile without hairline seams at any scale.
    this.context.fillRect(
      Math.round(x * this.scale),
      Math.round(y * this.scale),
      Math.round(width * this.scale),
      Math.round(height * this.scale),
    );
    return this;
  }
}

/**
 * Paints the front-facing idle frame of `appearance` into `canvas`, sizing the
 * backing store to the element's CSS box so the pixels stay crisp on any DPR.
 */
export function renderPlayerPreview(
  canvas: HTMLCanvasElement,
  appearance: PlayerAppearance,
): void {
  const context = canvas.getContext("2d");
  if (!context) return;

  const scale = Math.max(
    1,
    Math.floor(canvas.width / PREVIEW_SPRITE_WIDTH),
  );
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Centre the sprite in whatever box the layout gave us.
  const drawnWidth = PREVIEW_SPRITE_WIDTH * scale;
  const drawnHeight = PREVIEW_SPRITE_HEIGHT * scale;
  context.save();
  context.translate(
    Math.round((canvas.width - drawnWidth) / 2),
    Math.round((canvas.height - drawnHeight) / 2),
  );
  drawPlayerFrame(
    new CanvasPixelPainter(context, scale),
    "down",
    0,
    false,
    appearance,
  );
  context.restore();
}
