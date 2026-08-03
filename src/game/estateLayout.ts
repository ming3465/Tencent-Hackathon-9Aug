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
