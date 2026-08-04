import type { LocationId } from "./campaignTypes.js";

export interface EstateRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EstateBicycleRackDefinition {
  id: string;
  interactionId?: string;
  context: string;
  x: number;
  y: number;
}

export interface EstateVehicleRouteDefinition {
  id: string;
  texture: string;
  points: readonly {
    x: number;
    y: number;
  }[];
}

export interface EstateEntranceDefinition {
  id: string;
  label: string;
  targetLocationId: LocationId;
  buildingId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  placard: string;
}

export type EstateFacadeAccent =
  | "coral"
  | "gold"
  | "green"
  | "purple"
  | "teal";

export interface EstateFacadeDepthDefinition {
  buildingId: string;
  accent: EstateFacadeAccent;
  roofStyle: "hipped" | "sawtooth";
  roofDepth: number;
  roofInset: number;
  roofSegments: number;
  sideFaceWidth: number;
}

export const ESTATE_WORLD_BOUNDS: EstateRect = {
  id: "estate-world",
  x: 0,
  y: 0,
  width: 2560,
  height: 1600,
};

/**
 * Visual footprints include roofs, awnings, and open void-deck structures,
 * rather than only the smaller physics rectangles used for player movement.
 */
export const ESTATE_BUILDING_VISUAL_ZONES: readonly EstateRect[] = [
  { id: "block-9", x: 78, y: 68, width: 766, height: 232 },
  { id: "hawker-centre", x: 1292, y: 69, width: 316, height: 201 },
  { id: "kopitiam", x: 1600, y: 49, width: 380, height: 221 },
  { id: "provision-shop", x: 1970, y: 73, width: 440, height: 207 },
  { id: "community-centre", x: 1914, y: 874, width: 532, height: 288 },
  { id: "craftsman-workshop", x: 920, y: 1108, width: 350, height: 252 },
  { id: "block-12", x: 1354, y: 1254, width: 442, height: 230 },
  { id: "prayer-hall", x: 1914, y: 1274, width: 462, height: 238 },
];

/**
 * Every large exterior structure uses one projection contract. The values are
 * intentionally geometry-only so art, occlusion, tests, and future collision
 * work can share the same building IDs without importing a renderer.
 */
export const ESTATE_FACADE_DEPTH_DEFINITIONS:
  readonly EstateFacadeDepthDefinition[] = [
  {
    buildingId: "block-9",
    accent: "coral",
    roofStyle: "hipped",
    roofDepth: 27,
    roofInset: 22,
    roofSegments: 8,
    sideFaceWidth: 16,
  },
  {
    buildingId: "hawker-centre",
    accent: "coral",
    roofStyle: "hipped",
    roofDepth: 24,
    roofInset: 18,
    roofSegments: 4,
    sideFaceWidth: 12,
  },
  {
    buildingId: "kopitiam",
    accent: "teal",
    roofStyle: "hipped",
    roofDepth: 25,
    roofInset: 18,
    roofSegments: 5,
    sideFaceWidth: 12,
  },
  {
    buildingId: "provision-shop",
    accent: "green",
    roofStyle: "hipped",
    roofDepth: 25,
    roofInset: 20,
    roofSegments: 6,
    sideFaceWidth: 14,
  },
  {
    buildingId: "community-centre",
    accent: "purple",
    roofStyle: "hipped",
    roofDepth: 27,
    roofInset: 22,
    roofSegments: 6,
    sideFaceWidth: 16,
  },
  {
    buildingId: "craftsman-workshop",
    accent: "coral",
    roofStyle: "sawtooth",
    roofDepth: 50,
    roofInset: 10,
    roofSegments: 4,
    sideFaceWidth: 14,
  },
  {
    buildingId: "block-12",
    accent: "coral",
    roofStyle: "hipped",
    roofDepth: 27,
    roofInset: 22,
    roofSegments: 5,
    sideFaceWidth: 14,
  },
  {
    buildingId: "prayer-hall",
    accent: "gold",
    roofStyle: "hipped",
    roofDepth: 27,
    roofInset: 20,
    roofSegments: 5,
    sideFaceWidth: 14,
  },
];

/**
 * Each entry point is the centre of its code-drawn doorway at the threshold.
 * Art, interaction markers, and collision gaps all consume this registry so
 * an entrance cannot silently drift away from its building again.
 */
export const ESTATE_ENTRANCES: readonly EstateEntranceDefinition[] = [
  {
    id: "block-9-lobby",
    label: "Enter Block 9 lobby",
    targetLocationId: "hdb-corridor",
    buildingId: "block-9",
    x: 650,
    y: 292,
    width: 56,
    height: 78,
    placard: "BLK 9",
  },
  {
    id: "hawker-door",
    label: "Enter the hawker centre",
    targetLocationId: "hawker-centre",
    buildingId: "hawker-centre",
    x: 1460,
    y: 270,
    width: 56,
    height: 78,
    placard: "ENTRY",
  },
  {
    id: "kopitiam-door",
    label: "Enter the kopitiam",
    targetLocationId: "kopitiam",
    buildingId: "kopitiam",
    x: 1714,
    y: 264,
    width: 56,
    height: 78,
    placard: "KOPI",
  },
  {
    id: "shop-door",
    label: "Enter Minah's provision shop",
    targetLocationId: "provision-shop",
    buildingId: "provision-shop",
    x: 2260,
    y: 274,
    width: 56,
    height: 78,
    placard: "MINAH",
  },
  {
    id: "cc-door",
    label: "Enter the community centre",
    targetLocationId: "community-centre",
    buildingId: "community-centre",
    x: 2200,
    y: 1155,
    width: 56,
    height: 78,
    placard: "CC",
  },
  {
    id: "hall-door",
    label: "Enter the prayer hall",
    targetLocationId: "prayer-hall",
    buildingId: "prayer-hall",
    x: 2050,
    y: 1505,
    width: 56,
    height: 78,
    placard: "WELCOME",
  },
  {
    id: "workshop-door",
    label: "Enter the craftsman's workshop",
    targetLocationId: "craftsman-workshop",
    buildingId: "craftsman-workshop",
    x: 1120,
    y: 1358,
    width: 56,
    height: 78,
    placard: "OPEN",
  },
];

/**
 * Solid façade shells leave explicit doorway gaps around ESTATE_ENTRANCES.
 */
export const ESTATE_BUILDING_COLLISION_ZONES: readonly EstateRect[] = [
  { id: "block-9-shell", x: 78, y: 68, width: 766, height: 142 },
  { id: "hawker-left-shell", x: 1300, y: 85, width: 120, height: 165 },
  { id: "hawker-right-shell", x: 1500, y: 85, width: 100, height: 165 },
  { id: "kopitiam-left-shell", x: 1610, y: 65, width: 65, height: 185 },
  { id: "kopitiam-right-shell", x: 1745, y: 65, width: 225, height: 185 },
  { id: "provision-left-shell", x: 1980, y: 90, width: 245, height: 170 },
  { id: "provision-right-shell", x: 2295, y: 90, width: 105, height: 170 },
  { id: "community-left-shell", x: 1924, y: 892, width: 241, height: 250 },
  { id: "community-right-shell", x: 2235, y: 892, width: 201, height: 250 },
  { id: "prayer-left-shell", x: 1924, y: 1292, width: 91, height: 200 },
  { id: "prayer-right-shell", x: 2085, y: 1292, width: 281, height: 200 },
  { id: "block-12-shell", x: 1364, y: 1272, width: 422, height: 190 },
  { id: "workshop-left-shell", x: 930, y: 1150, width: 154, height: 210 },
  { id: "workshop-right-shell", x: 1156, y: 1150, width: 104, height: 210 },
];

export const ESTATE_PEDESTRIAN_ZONES: readonly EstateRect[] = [
  { id: "north-crossing", x: 0, y: 326, width: 2560, height: 132 },
  { id: "south-crossing", x: 0, y: 1126, width: 2560, height: 132 },
  { id: "west-spine", x: 550, y: 0, width: 184, height: 1600 },
  { id: "east-spine", x: 1830, y: 0, width: 184, height: 1600 },
];

export const BLOCK_9_BICYCLE_RACK: EstateBicycleRackDefinition = {
  id: "block-9-bicycle-verge",
  interactionId: "estate-shared-bicycles",
  context: "Block 9 outdoor bicycle verge",
  x: 810,
  y: 605,
};

export const PROVISION_SHOP_BICYCLE_RACK: EstateBicycleRackDefinition = {
  id: "provision-shop-bicycle-verge",
  context: "Provision-shop outdoor bicycle verge",
  x: 2280,
  y: 550,
};

export const BLOCK_12_BICYCLE_RACK: EstateBicycleRackDefinition = {
  id: "block-12-bicycle-verge",
  interactionId: "estate-block-twelve-bicycles",
  context: "Block 12 outdoor bicycle verge",
  x: 1460,
  y: 1560,
};

export const ESTATE_BICYCLE_RACKS: readonly EstateBicycleRackDefinition[] = [
  BLOCK_9_BICYCLE_RACK,
  PROVISION_SHOP_BICYCLE_RACK,
  BLOCK_12_BICYCLE_RACK,
];

/**
 * The current estate map has pedestrian paving and garden verges, but no road.
 * Motor traffic therefore stays empty until a real road lane is designed.
 */
export const ESTATE_VEHICLE_LANES: readonly EstateRect[] = [];
export const ESTATE_VEHICLE_ROUTES: readonly EstateVehicleRouteDefinition[] = [];

export const BICYCLE_BAY_WIDTH = 132;
export const BICYCLE_BAY_DEPTH = 48;
export const BICYCLE_COLLISION_WIDTH = 96;
export const BICYCLE_COLLISION_DEPTH = 18;
export const BUILDING_OCCLUSION_FADE_ALPHA = 0.28;
export const BUILDING_OCCLUSION_APPROACH_DEPTH = 130;
export const BUILDING_OCCLUSION_FRONT_MARGIN = 45;

function rectanglesOverlap(a: EstateRect, b: EstateRect): boolean {
  return (
    a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y
  );
}

function rectangleContains(outer: EstateRect, inner: EstateRect): boolean {
  return (
    inner.x >= outer.x
    && inner.y >= outer.y
    && inner.x + inner.width <= outer.x + outer.width
    && inner.y + inner.height <= outer.y + outer.height
  );
}

function bicycleBayBounds(
  rack: EstateBicycleRackDefinition,
): EstateRect {
  return {
    id: `${rack.id}-bay`,
    x: rack.x - BICYCLE_BAY_WIDTH / 2,
    y: rack.y - BICYCLE_BAY_DEPTH + 8,
    width: BICYCLE_BAY_WIDTH,
    height: BICYCLE_BAY_DEPTH,
  };
}

function pointIsInRect(
  point: { x: number; y: number },
  rectangle: EstateRect,
): boolean {
  return (
    point.x >= rectangle.x
    && point.x <= rectangle.x + rectangle.width
    && point.y >= rectangle.y
    && point.y <= rectangle.y + rectangle.height
  );
}

export function getOccludingBuildingIds(
  point: { x: number; y: number },
): readonly string[] {
  return ESTATE_BUILDING_VISUAL_ZONES
    .filter((building) => {
      const bottom = building.y + building.height;
      return (
        point.x >= building.x
        && point.x <= building.x + building.width
        && point.y >= bottom - BUILDING_OCCLUSION_APPROACH_DEPTH
        && point.y <= bottom + BUILDING_OCCLUSION_FRONT_MARGIN
      );
    })
    .map((building) => building.id);
}

export function auditEstateLayout(): readonly string[] {
  const issues: string[] = [];
  const seenRackIds = new Set<string>();
  const seenInteractionIds = new Set<string>();
  const seenEntranceIds = new Set<string>();
  const seenEntranceLocations = new Set<LocationId>();
  const seenFacadeDepthBuildings = new Set<string>();

  for (const definition of ESTATE_FACADE_DEPTH_DEFINITIONS) {
    if (seenFacadeDepthBuildings.has(definition.buildingId)) {
      issues.push(
        `Duplicate facade depth definition: ${definition.buildingId}`,
      );
    }
    seenFacadeDepthBuildings.add(definition.buildingId);
    const building = ESTATE_BUILDING_VISUAL_ZONES.find(
      (candidate) => candidate.id === definition.buildingId,
    );
    if (!building) {
      issues.push(
        `Facade depth definition references missing ${definition.buildingId}`,
      );
      continue;
    }
    if (
      definition.roofDepth < 16
      || definition.roofDepth >= building.height / 2
      || definition.roofInset < 8
      || definition.roofInset * 2 >= building.width
      || definition.roofSegments < 2
      || definition.sideFaceWidth < 8
      || definition.sideFaceWidth >= building.width / 4
    ) {
      issues.push(`Invalid facade depth geometry: ${definition.buildingId}`);
    }
  }
  for (const building of ESTATE_BUILDING_VISUAL_ZONES) {
    if (!seenFacadeDepthBuildings.has(building.id)) {
      issues.push(`Missing facade depth definition: ${building.id}`);
    }
  }

  for (const entrance of ESTATE_ENTRANCES) {
    if (seenEntranceIds.has(entrance.id)) {
      issues.push(`Duplicate estate entrance ID: ${entrance.id}`);
    }
    seenEntranceIds.add(entrance.id);
    if (seenEntranceLocations.has(entrance.targetLocationId)) {
      issues.push(
        `Duplicate estate entrance location: ${entrance.targetLocationId}`,
      );
    }
    seenEntranceLocations.add(entrance.targetLocationId);

    const building = ESTATE_BUILDING_VISUAL_ZONES.find(
      (candidate) => candidate.id === entrance.buildingId,
    );
    if (!building) {
      issues.push(`${entrance.id} references missing ${entrance.buildingId}`);
      continue;
    }
    const doorBounds: EstateRect = {
      id: `${entrance.id}-opening`,
      x: entrance.x - entrance.width / 2,
      y: entrance.y - entrance.height,
      width: entrance.width,
      height: entrance.height,
    };
    if (!rectangleContains(building, doorBounds)) {
      issues.push(`${entrance.id} is outside ${building.id}`);
    }
    const buildingBottom = building.y + building.height;
    if (Math.abs(entrance.y - buildingBottom) > 12) {
      issues.push(`${entrance.id} misses ${building.id}'s threshold`);
    }
    for (const shell of ESTATE_BUILDING_COLLISION_ZONES) {
      if (rectanglesOverlap(doorBounds, shell)) {
        issues.push(`${shell.id} blocks ${entrance.id}`);
      }
    }
  }

  for (const rack of ESTATE_BICYCLE_RACKS) {
    if (seenRackIds.has(rack.id)) {
      issues.push(`Duplicate bicycle rack ID: ${rack.id}`);
    }
    seenRackIds.add(rack.id);
    if (rack.interactionId) {
      if (seenInteractionIds.has(rack.interactionId)) {
        issues.push(`Duplicate bicycle interaction ID: ${rack.interactionId}`);
      }
      seenInteractionIds.add(rack.interactionId);
    }

    const bay = bicycleBayBounds(rack);
    if (!rectangleContains(ESTATE_WORLD_BOUNDS, bay)) {
      issues.push(`${rack.id} leaves the estate bounds`);
    }
    for (const building of ESTATE_BUILDING_VISUAL_ZONES) {
      if (rectanglesOverlap(bay, building)) {
        issues.push(`${rack.id} overlaps ${building.id}`);
      }
    }
    for (const path of ESTATE_PEDESTRIAN_ZONES) {
      if (rectanglesOverlap(bay, path)) {
        issues.push(`${rack.id} blocks ${path.id}`);
      }
    }
  }

  for (const vehicle of ESTATE_VEHICLE_ROUTES) {
    if (vehicle.points.length < 2) {
      issues.push(`${vehicle.id} needs at least two route points`);
      continue;
    }
    for (const point of vehicle.points) {
      if (!ESTATE_VEHICLE_LANES.some((lane) => pointIsInRect(point, lane))) {
        issues.push(`${vehicle.id} leaves the estate road network`);
        break;
      }
    }
  }

  return issues;
}
