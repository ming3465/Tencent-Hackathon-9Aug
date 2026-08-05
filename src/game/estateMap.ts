import type { LocationId } from "./campaignTypes.js";
import { ESTATE_BUILDINGS, PEDESTRIAN_STREETS } from "./estateLayout.js";

export interface EstateMapPoint {
  x: number;
  y: number;
}

export interface EstateMapLandmark extends EstateMapPoint {
  locationId: LocationId;
  shortLabel: string;
}

export interface EstateMapPosition {
  xPercent: number;
  yPercent: number;
}

export const ESTATE_MAP_WIDTH = 2560;
export const ESTATE_MAP_HEIGHT = 1600;

const MAP_PADDING_PERCENT = 7;
const MAP_DRAWABLE_PERCENT = 100 - MAP_PADDING_PERCENT * 2;

export const ESTATE_MAP_LANDMARKS: readonly EstateMapLandmark[] = [
  ...ESTATE_BUILDINGS.flatMap((definition): EstateMapLandmark[] =>
    definition.targetLocationId
      ? [{
          locationId: definition.targetLocationId,
          shortLabel: definition.minimapLabel,
          ...definition.minimapAnchor,
        }]
      : []),
];

export const ESTATE_MAP_PATHS = PEDESTRIAN_STREETS.map((street) => ({
  id: street.id,
  ...projectEstateMapPoint({ x: street.x, y: street.y }),
  end: projectEstateMapPoint({
    x: street.x + street.width,
    y: street.y + street.height,
  }),
  axis: street.axis,
}));

const BLOCK_9_HOME_IDS: readonly LocationId[] = [
  "y-flat",
  "mr-long-flat",
  "grandma-ros-kitchen",
  "ben-flat",
];

const DEFAULT_ESTATE_POINT: EstateMapPoint = { x: 700, y: 400 };

export function projectEstateMapPoint(point: EstateMapPoint): EstateMapPosition {
  const x = Math.max(0, Math.min(ESTATE_MAP_WIDTH, point.x));
  const y = Math.max(0, Math.min(ESTATE_MAP_HEIGHT, point.y));
  return {
    xPercent:
      MAP_PADDING_PERCENT + (x / ESTATE_MAP_WIDTH) * MAP_DRAWABLE_PERCENT,
    yPercent:
      MAP_PADDING_PERCENT + (y / ESTATE_MAP_HEIGHT) * MAP_DRAWABLE_PERCENT,
  };
}

export function estateMapAnchorLocation(locationId: LocationId): LocationId {
  return BLOCK_9_HOME_IDS.includes(locationId)
    ? "hdb-corridor"
    : locationId;
}

export function getEstateMapPosition(
  locationId: LocationId,
  liveEstatePoint?: EstateMapPoint,
): EstateMapPosition {
  if (locationId === "estate") {
    return projectEstateMapPoint(liveEstatePoint ?? DEFAULT_ESTATE_POINT);
  }
  const anchorId = estateMapAnchorLocation(locationId);
  const anchor = ESTATE_MAP_LANDMARKS.find(
    (landmark) => landmark.locationId === anchorId,
  );
  return projectEstateMapPoint(anchor ?? DEFAULT_ESTATE_POINT);
}
