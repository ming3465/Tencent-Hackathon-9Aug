import type { WalkFrame } from "./campaignArt.js";
import type { LocationId } from "./campaignTypes.js";

export type MovementSurface = "grass" | "stone" | "indoor";

const TERRAIN_TILE_WIDTH = 1280;
const TERRAIN_TILE_HEIGHT = 800;
const HORIZONTAL_PATH_TOP = 326;
const HORIZONTAL_PATH_BOTTOM = 458;
const VERTICAL_PATH_LEFT = 550;
const VERTICAL_PATH_RIGHT = 734;

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

/**
 * Mirrors the baked estate terrain grammar without reading pixels at runtime.
 * Every indoor location intentionally shares the quieter indoor sound profile.
 */
export function movementSurfaceAt(
  locationId: LocationId,
  x: number,
  y: number,
): MovementSurface {
  if (locationId !== "estate") return "indoor";

  const localX = positiveModulo(x, TERRAIN_TILE_WIDTH);
  const localY = positiveModulo(y, TERRAIN_TILE_HEIGHT);
  const onHorizontalPath =
    localY >= HORIZONTAL_PATH_TOP && localY <= HORIZONTAL_PATH_BOTTOM;
  const onVerticalPath =
    localX >= VERTICAL_PATH_LEFT && localX <= VERTICAL_PATH_RIGHT;
  return onHorizontalPath || onVerticalPath ? "stone" : "grass";
}

export function walkFrameAt(
  time: number,
  hurrying: boolean,
  reducedMotion: boolean,
): WalkFrame {
  if (reducedMotion) return 0;
  const frameDuration = hurrying ? 92 : 125;
  return (Math.floor(time / frameDuration) % 4) as WalkFrame;
}

export function stepIntervalFor(hurrying: boolean): number {
  return hurrying ? 205 : 250;
}
