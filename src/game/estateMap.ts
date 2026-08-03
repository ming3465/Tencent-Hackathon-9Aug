import type { LocationId } from "./campaignTypes.js";

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
  {
    locationId: "hdb-corridor",
    shortLabel: "9",
    x: 650,
    y: 260,
  },
  {
    locationId: "hawker-centre",
    shortLabel: "H",
    x: 1260,
    y: 270,
  },
  {
    locationId: "kopitiam",
    shortLabel: "K",
    x: 1710,
    y: 270,
  },
  {
    locationId: "provision-shop",
    shortLabel: "S",
    x: 2260,
    y: 300,
  },
  {
    locationId: "community-centre",
    shortLabel: "CC",
    x: 2200,
    y: 1030,
  },
  {
    locationId: "prayer-hall",
    shortLabel: "P",
    x: 2050,
    y: 1350,
  },
  {
    locationId: "craftsman-workshop",
    shortLabel: "W",
    x: 1120,
    y: 1370,
  },
];

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
