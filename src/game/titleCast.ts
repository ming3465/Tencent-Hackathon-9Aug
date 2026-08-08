/**
 * The villagers walking across the title screen.
 *
 * A title screen that is a still image reads as a poster. What makes one read
 * as a game is people moving in it - so this paints a handful of neighbours
 * walking the foreground of the title art, and it paints them with
 * `drawPlayerFrame`, the exact function that bakes the in-game sprite. No new
 * art, and the title cannot drift away from the game it is advertising.
 *
 * Deliberately a plain 2D canvas rather than a Phaser scene: the campaign's
 * loader boots Phaser on demand, and paying that cost on the title would slow
 * the first thing a judge sees. A few dozen `fillRect` calls per frame do not.
 */

import { drawPlayerFrame, type WalkFrame } from "./campaignArt.js";
import { CanvasPixelPainter } from "./playerPreview.js";
import {
  HAIR_COLOURS,
  type PlayerAppearance,
  SHIRT_COLOURS,
  SKIN_TONES,
  TROUSER_COLOURS,
} from "./playerIdentity.js";

/** Native sprite size, matching the campaign's player frames. */
const SPRITE_WIDTH = 40;
const SPRITE_HEIGHT = 56;

/**
 * The cast is composed on a fixed logical stage and then blitted, upscaled, to
 * whatever box the layout gives it.
 *
 * Composing directly against live canvas pixels was the first attempt and it
 * was wrong: every walker's position depended on the measured height, so the
 * band's composition changed with the viewport and most of the cast fell
 * outside it. A fixed stage means the title looks the same at 360px and at
 * 1440px, and the nearest-neighbour upscale is the chunky pixel look the
 * reference has rather than a defect.
 */
const STAGE_WIDTH = 360;
const STAGE_HEIGHT = 96;

/** Milliseconds per walk frame. Slow enough to read as a stroll. */
const STEP_MS = 165;

const WALK_FRAMES: readonly WalkFrame[] = [0, 1, 2, 3];

interface Walker {
  appearance: PlayerAppearance;
  /** Start position in stage units, wrapping across the stage width. */
  x: number;
  /** Stage-unit y the walker's feet land on. Larger reads as nearer. */
  feetY: number;
  /** Sprite scale in stage units. */
  scale: number;
  /** Stage units per second. Negative walks left. */
  speed: number;
  /** Staggers the walk cycle so nobody marches in lockstep. */
  phase: number;
}

function look(
  skin: number,
  hair: number,
  shirt: number,
  trousers: number,
): PlayerAppearance {
  return {
    skin: SKIN_TONES[skin]!.value,
    hair: HAIR_COLOURS[hair]!.value,
    shirt: SHIRT_COLOURS[shirt]!.value,
    trousers: TROUSER_COLOURS[trousers]!.value,
  };
}

/**
 * Six neighbours at three depths. Hand-picked rather than randomised so the
 * title looks the same in every screenshot, demo recording and judge session.
 */
const WALKERS: readonly Walker[] = [
  { appearance: look(0, 3, 1, 0), x: 30, feetY: 58, scale: 0.55, speed: 7, phase: 0 },
  { appearance: look(0, 0, 3, 1), x: 190, feetY: 62, scale: 0.6, speed: 9, phase: 2 },
  { appearance: look(2, 0, 0, 2), x: 255, feetY: 70, scale: 0.75, speed: -6, phase: 2 },
  { appearance: look(2, 1, 1, 0), x: 70, feetY: 78, scale: 0.9, speed: -5, phase: 1 },
  { appearance: look(1, 1, 4, 1), x: 125, feetY: 88, scale: 1.05, speed: 4.5, phase: 1 },
  { appearance: look(3, 2, 2, 3), x: 330, feetY: 96, scale: 1.2, speed: -3.5, phase: 3 },
];

/** A running cast animation. Stop it when the title screen is left. */
export interface TitleCast {
  stop(): void;
}

/** Paints one frame of the cast onto the fixed logical stage. */
function paintStage(
  context: CanvasRenderingContext2D,
  elapsedMs: number,
  moving: boolean,
): void {
  context.clearRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);

  // A requestAnimationFrame timestamp can be *earlier* than the
  // `performance.now()` captured just before scheduling it, when a frame was
  // already in flight. That made `elapsedMs` negative, and JavaScript's `%`
  // keeps the sign - so the frame index came out -1, `WALK_FRAMES[-1]` was
  // undefined, and `drawPlayerFrame` threw partway through the cast. Half the
  // neighbours silently vanished. Clamp once, here.
  const elapsed = Math.max(0, elapsedMs);

  // Far walkers first, so a nearer neighbour overlaps correctly.
  const order = [...WALKERS].sort((a, b) => a.feetY - b.feetY);

  for (const walker of order) {
    const width = SPRITE_WIDTH * walker.scale;
    const height = SPRITE_HEIGHT * walker.scale;
    // Wrap with a full sprite of margin, so a walker leaves the stage entirely
    // before reappearing on the far side.
    const span = STAGE_WIDTH + width * 2;
    const drift = moving ? (elapsed / 1000) * walker.speed : 0;
    let position = (walker.x + width + drift) % span;
    if (position < 0) position += span;
    const x = position - width;
    const y = walker.feetY - height;

    const step = moving
      ? WALK_FRAMES[
          (Math.floor(elapsed / STEP_MS) + walker.phase) % WALK_FRAMES.length
        ]!
      : 0;

    context.save();
    context.translate(x, y);
    // Walking left is the same art mirrored, which is how the campaign's own
    // side-facing frames are used.
    if (walker.speed < 0) {
      context.translate(width, 0);
      context.scale(-1, 1);
    }
    // A soft contact shadow, so the cast stands on the art instead of floating.
    context.globalAlpha = 0.26;
    context.fillStyle = "#0b212b";
    context.beginPath();
    context.ellipse(width / 2, height, width / 2.3, width / 5.5, 0, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;

    drawPlayerFrame(
      new CanvasPixelPainter(context, walker.scale),
      "side",
      step,
      false,
      walker.appearance,
    );
    context.restore();
  }
}

/**
 * Starts the walking cast on `canvas`, sizing its backing store to the CSS box.
 *
 * `prefers-reduced-motion` paints one static frame and never schedules another:
 * the neighbours are still there, they simply are not walking. That is a
 * published accessibility commitment, not a nicety.
 */
export function startTitleCast(
  canvas: HTMLCanvasElement,
  options: { reducedMotion: boolean },
): TitleCast {
  const context = canvas.getContext("2d");
  const stage = document.createElement("canvas");
  stage.width = STAGE_WIDTH;
  stage.height = STAGE_HEIGHT;
  const stageContext = stage.getContext("2d");
  if (!context || !stageContext) return { stop: () => {} };

  let frame = 0;
  let stopped = false;
  let lastPaint = -Infinity;

  /**
   * Measuring the canvas costs a forced layout, so it happens on resize rather
   * than on every frame. Doing it per frame put the title-screen scheduler at
   * ~33ms a frame, which both looks bad and quietly inflates the frame budget
   * the smoke suite derives from this screen.
   */
  const measure = (): void => {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  };

  const render = (elapsedMs: number, moving: boolean): void => {
    const width = canvas.width;
    const height = canvas.height;
    paintStage(stageContext, elapsedMs, moving);
    context.clearRect(0, 0, width, height);
    // Nearest-neighbour: the sprite is pixel art and must stay crisp when the
    // stage is blown up to a 1440px-wide title.
    context.imageSmoothingEnabled = false;

    // Cover the band horizontally, anchored to its bottom edge.
    const scale = width / STAGE_WIDTH;
    const drawnHeight = STAGE_HEIGHT * scale;
    context.drawImage(stage, 0, height - drawnHeight, width, drawnHeight);
  };

  measure();

  if (options.reducedMotion) {
    render(0, false);
    const onResize = (): void => {
      measure();
      render(0, false);
    };
    window.addEventListener("resize", onResize);
    return { stop: () => window.removeEventListener("resize", onResize) };
  }

  const onResize = (): void => measure();
  window.addEventListener("resize", onResize);

  // A stroll does not need 60fps, and the walk cycle only changes every 165ms.
  // Repainting ~24 times a second keeps the title's scheduler quiet.
  const FRAME_MS = 1000 / 24;
  const start = performance.now();
  const tick = (now: number): void => {
    if (stopped) return;
    if (now - lastPaint >= FRAME_MS) {
      lastPaint = now;
      render(now - start, true);
    }
    frame = window.requestAnimationFrame(tick);
  };
  frame = window.requestAnimationFrame(tick);

  return {
    stop: () => {
      stopped = true;
      window.removeEventListener("resize", onResize);
      window.cancelAnimationFrame(frame);
    },
  };
}
