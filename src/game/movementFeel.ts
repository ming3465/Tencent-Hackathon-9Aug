import type { WalkFrame } from "./campaignArt.js";
import type { LocationId } from "./campaignTypes.js";
import { PEDESTRIAN_STREETS, pointIsInRect } from "./estateLayout.js";

export type MovementSurface = "grass" | "stone" | "indoor";

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
  return PEDESTRIAN_STREETS.some((street) => pointIsInRect({ x, y }, street))
    ? "stone"
    : "grass";
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
