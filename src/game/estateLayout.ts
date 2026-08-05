import type { LocationId, NpcId } from "./campaignTypes.js";

export interface EstatePoint {
  x: number;
  y: number;
}

export interface EstateRect extends EstatePoint {
  id: string;
  width: number;
  height: number;
}

export interface PedestrianStreetDefinition extends EstateRect {
  axis: "horizontal" | "vertical" | "plaza";
  surface: "diagonal-cobbles" | "tiled-apron";
}

export type EstateFacadeAccent =
  | "coral"
  | "gold"
  | "green"
  | "purple"
  | "teal";

export interface BuildingDefinition {
  id: string;
  label: string;
  bounds: EstateRect;
  accent: EstateFacadeAccent;
  roofStyle: "hipped" | "sawtooth";
  roofDepth: number;
  roofInset: number;
  roofSegments: number;
  sideFaceWidth: number;
  minimapAnchor: EstatePoint;
  minimapLabel: string;
  targetLocationId?: LocationId;
  entranceDoorId?: string;
}

export interface EstateFacadeDepthDefinition {
  buildingId: string;
  accent: EstateFacadeAccent;
  roofStyle: "hipped" | "sawtooth";
  roofDepth: number;
  roofInset: number;
  roofSegments: number;
  sideFaceWidth: number;
}

export type DoorOrientation = "north" | "south" | "east" | "west";

export type DoorStyle =
  | "hinged-hdb"
  | "sliding-commercial"
  | "double-community"
  | "workshop-shutter"
  | "open-hawker-gate"
  | "lift";

export interface DoorDefinition {
  id: string;
  sourceLocationId: LocationId;
  targetLocationId: LocationId;
  buildingId?: string;
  label: string;
  orientation: DoorOrientation;
  style: DoorStyle;
  anchor: EstatePoint;
  approachPoint: EstatePoint;
  returnSpawn: EstatePoint;
  dimensions: {
    width: number;
    height: number;
  };
  placard: string;
  collider: EstateRect;
  startsOpen?: boolean;
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

export type ShelterChoice = "shelter-gap" | "rest-point";

export interface ShelterDefinition {
  id: string;
  variant: "base" | ShelterChoice;
  bounds: EstateRect;
  roof: EstateRect;
  posts: readonly EstateRect[];
  interactionPoint: EstatePoint;
  dryMask: EstateRect;
  glow: EstateRect;
  shadeBands: readonly EstateRect[];
  clearWalkway: EstateRect;
  minimumClearWidth: number;
}

export interface NpcRouteDefinition {
  npcId: NpcId;
  home: EstatePoint;
  points: readonly EstatePoint[];
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
  points: readonly EstatePoint[];
}

export interface WorldLayoutDefinition {
  bounds: EstateRect;
  streets: readonly PedestrianStreetDefinition[];
  buildings: readonly BuildingDefinition[];
  buildingColliders: readonly EstateRect[];
  doors: readonly DoorDefinition[];
  shelters: readonly ShelterDefinition[];
  npcRoutes: readonly NpcRouteDefinition[];
  bicycleRacks: readonly EstateBicycleRackDefinition[];
  vehicleLanes: readonly EstateRect[];
  vehicleRoutes: readonly EstateVehicleRouteDefinition[];
}

export const ESTATE_WORLD_BOUNDS: EstateRect = {
  id: "estate-world",
  x: 0,
  y: 0,
  width: 2560,
  height: 1600,
};

export const PEDESTRIAN_STREETS: readonly PedestrianStreetDefinition[] = [
  {
    id: "north-market-street",
    x: 64,
    y: 330,
    width: 2432,
    height: 170,
    axis: "horizontal",
    surface: "diagonal-cobbles",
  },
  {
    id: "civic-spine",
    x: 1120,
    y: 330,
    width: 240,
    height: 1220,
    axis: "vertical",
    surface: "diagonal-cobbles",
  },
  {
    id: "west-sheltered-walk",
    x: 360,
    y: 330,
    width: 260,
    height: 900,
    axis: "vertical",
    surface: "tiled-apron",
  },
  {
    id: "south-community-street",
    x: 64,
    y: 1050,
    width: 2432,
    height: 180,
    axis: "horizontal",
    surface: "diagonal-cobbles",
  },
  {
    id: "east-connector",
    x: 1810,
    y: 330,
    width: 180,
    height: 1220,
    axis: "vertical",
    surface: "tiled-apron",
  },
  {
    id: "central-plaza",
    x: 680,
    y: 540,
    width: 1080,
    height: 200,
    axis: "plaza",
    surface: "tiled-apron",
  },
];

const building = (
  id: string,
  label: string,
  bounds: Omit<EstateRect, "id">,
  visual: Pick<
    BuildingDefinition,
    | "accent"
    | "roofStyle"
    | "roofDepth"
    | "roofInset"
    | "roofSegments"
    | "sideFaceWidth"
    | "minimapAnchor"
    | "minimapLabel"
    | "targetLocationId"
    | "entranceDoorId"
  >,
): BuildingDefinition => ({
  id,
  label,
  bounds: { id, ...bounds },
  ...visual,
});

export const ESTATE_BUILDINGS: readonly BuildingDefinition[] = [
  building("block-9", "Block 9", { x: 80, y: 60, width: 680, height: 270 }, {
    accent: "coral", roofStyle: "hipped", roofDepth: 34, roofInset: 24,
    roofSegments: 8, sideFaceWidth: 34, minimapAnchor: { x: 610, y: 250 },
    minimapLabel: "9", targetLocationId: "hdb-corridor", entranceDoorId: "estate-block-9",
  }),
  building("hawker-centre", "Hawker Centre", { x: 820, y: 80, width: 300, height: 250 }, {
    accent: "coral", roofStyle: "hipped", roofDepth: 30, roofInset: 18,
    roofSegments: 4, sideFaceWidth: 24, minimapAnchor: { x: 970, y: 235 },
    minimapLabel: "H", targetLocationId: "hawker-centre", entranceDoorId: "estate-hawker",
  }),
  building("kopitiam", "Kopitiam", { x: 1400, y: 80, width: 360, height: 250 }, {
    accent: "teal", roofStyle: "hipped", roofDepth: 31, roofInset: 20,
    roofSegments: 5, sideFaceWidth: 27, minimapAnchor: { x: 1550, y: 235 },
    minimapLabel: "K", targetLocationId: "kopitiam", entranceDoorId: "estate-kopitiam",
  }),
  building("provision-shop", "Provision Shop", { x: 1830, y: 70, width: 600, height: 260 }, {
    accent: "green", roofStyle: "hipped", roofDepth: 32, roofInset: 24,
    roofSegments: 7, sideFaceWidth: 36, minimapAnchor: { x: 2140, y: 230 },
    minimapLabel: "S", targetLocationId: "provision-shop", entranceDoorId: "estate-provision",
  }),
  building("craftsman-workshop", "Craftsman's Workshop", { x: 680, y: 780, width: 380, height: 270 }, {
    accent: "coral", roofStyle: "sawtooth", roofDepth: 50, roofInset: 14,
    roofSegments: 4, sideFaceWidth: 28, minimapAnchor: { x: 870, y: 920 },
    minimapLabel: "W", targetLocationId: "craftsman-workshop", entranceDoorId: "estate-workshop",
  }),
  building("community-centre", "Community Centre", { x: 1400, y: 760, width: 400, height: 290 }, {
    accent: "purple", roofStyle: "hipped", roofDepth: 36, roofInset: 24,
    roofSegments: 6, sideFaceWidth: 32, minimapAnchor: { x: 1600, y: 920 },
    minimapLabel: "CC", targetLocationId: "community-centre", entranceDoorId: "estate-community",
  }),
  building("prayer-hall", "Prayer Hall", { x: 2030, y: 780, width: 430, height: 270 }, {
    accent: "gold", roofStyle: "hipped", roofDepth: 34, roofInset: 22,
    roofSegments: 5, sideFaceWidth: 30, minimapAnchor: { x: 2250, y: 925 },
    minimapLabel: "P", targetLocationId: "prayer-hall", entranceDoorId: "estate-prayer",
  }),
  building("block-12", "Block 12", { x: 60, y: 1260, width: 500, height: 260 }, {
    accent: "coral", roofStyle: "hipped", roofDepth: 34, roofInset: 24,
    roofSegments: 6, sideFaceWidth: 32, minimapAnchor: { x: 310, y: 1400 },
    minimapLabel: "12", targetLocationId: undefined, entranceDoorId: undefined,
  }),
];

const door = (
  definition: Omit<DoorDefinition, "collider">,
): DoorDefinition => ({
  ...definition,
  collider: {
    id: `${definition.id}-blocker`,
    x: definition.anchor.x - definition.dimensions.width / 2,
    y: definition.anchor.y - 12,
    width: definition.dimensions.width,
    height: 24,
  },
});

const EXTERIOR_DOOR_SIZE = { width: 64, height: 84 } as const;
const INTERIOR_DOOR_SIZE = { width: 70, height: 92 } as const;

export const DOOR_DEFINITIONS: readonly DoorDefinition[] = [
  door({ id: "estate-block-9", sourceLocationId: "estate", targetLocationId: "hdb-corridor", buildingId: "block-9", label: "Enter Block 9 lobby", orientation: "north", style: "hinged-hdb", anchor: { x: 610, y: 330 }, approachPoint: { x: 610, y: 400 }, returnSpawn: { x: 610, y: 405 }, dimensions: EXTERIOR_DOOR_SIZE, placard: "BLK 9" }),
  door({ id: "estate-hawker", sourceLocationId: "estate", targetLocationId: "hawker-centre", buildingId: "hawker-centre", label: "Enter the hawker centre", orientation: "north", style: "open-hawker-gate", anchor: { x: 970, y: 330 }, approachPoint: { x: 970, y: 400 }, returnSpawn: { x: 970, y: 405 }, dimensions: { width: 82, height: 84 }, placard: "ENTRY", startsOpen: true }),
  door({ id: "estate-kopitiam", sourceLocationId: "estate", targetLocationId: "kopitiam", buildingId: "kopitiam", label: "Enter the kopitiam", orientation: "north", style: "sliding-commercial", anchor: { x: 1550, y: 330 }, approachPoint: { x: 1550, y: 400 }, returnSpawn: { x: 1550, y: 405 }, dimensions: EXTERIOR_DOOR_SIZE, placard: "KOPI" }),
  door({ id: "estate-provision", sourceLocationId: "estate", targetLocationId: "provision-shop", buildingId: "provision-shop", label: "Enter Minah's provision shop", orientation: "north", style: "sliding-commercial", anchor: { x: 2140, y: 330 }, approachPoint: { x: 2140, y: 400 }, returnSpawn: { x: 2140, y: 405 }, dimensions: EXTERIOR_DOOR_SIZE, placard: "MINAH" }),
  door({ id: "estate-workshop", sourceLocationId: "estate", targetLocationId: "craftsman-workshop", buildingId: "craftsman-workshop", label: "Enter the craftsman's workshop", orientation: "north", style: "workshop-shutter", anchor: { x: 870, y: 1050 }, approachPoint: { x: 870, y: 1120 }, returnSpawn: { x: 870, y: 1125 }, dimensions: { width: 82, height: 84 }, placard: "OPEN" }),
  door({ id: "estate-community", sourceLocationId: "estate", targetLocationId: "community-centre", buildingId: "community-centre", label: "Enter the community centre", orientation: "north", style: "double-community", anchor: { x: 1600, y: 1050 }, approachPoint: { x: 1600, y: 1120 }, returnSpawn: { x: 1600, y: 1125 }, dimensions: { width: 82, height: 84 }, placard: "CC" }),
  door({ id: "estate-prayer", sourceLocationId: "estate", targetLocationId: "prayer-hall", buildingId: "prayer-hall", label: "Enter the prayer hall", orientation: "north", style: "double-community", anchor: { x: 2250, y: 1050 }, approachPoint: { x: 2250, y: 1120 }, returnSpawn: { x: 2250, y: 1125 }, dimensions: { width: 82, height: 84 }, placard: "WELCOME" }),

  door({ id: "corridor-y-flat", sourceLocationId: "hdb-corridor", targetLocationId: "y-flat", label: "Enter Y's flat", orientation: "north", style: "hinged-hdb", anchor: { x: 150, y: 265 }, approachPoint: { x: 150, y: 350 }, returnSpawn: { x: 150, y: 350 }, dimensions: INTERIOR_DOOR_SIZE, placard: "01" }),
  door({ id: "corridor-mr-long", sourceLocationId: "hdb-corridor", targetLocationId: "mr-long-flat", label: "Visit Mr. Long", orientation: "north", style: "hinged-hdb", anchor: { x: 350, y: 265 }, approachPoint: { x: 350, y: 350 }, returnSpawn: { x: 350, y: 350 }, dimensions: INTERIOR_DOOR_SIZE, placard: "02" }),
  door({ id: "corridor-grandma-ros", sourceLocationId: "hdb-corridor", targetLocationId: "grandma-ros-kitchen", label: "Visit Grandma Ros", orientation: "north", style: "hinged-hdb", anchor: { x: 585, y: 265 }, approachPoint: { x: 585, y: 350 }, returnSpawn: { x: 585, y: 350 }, dimensions: INTERIOR_DOOR_SIZE, placard: "03" }),
  door({ id: "corridor-ben", sourceLocationId: "hdb-corridor", targetLocationId: "ben-flat", label: "Visit Ben", orientation: "north", style: "hinged-hdb", anchor: { x: 805, y: 265 }, approachPoint: { x: 805, y: 350 }, returnSpawn: { x: 805, y: 350 }, dimensions: INTERIOR_DOOR_SIZE, placard: "04" }),
  door({ id: "corridor-estate", sourceLocationId: "hdb-corridor", targetLocationId: "estate", label: "Take the lift to the estate", orientation: "south", style: "lift", anchor: { x: 480, y: 588 }, approachPoint: { x: 480, y: 510 }, returnSpawn: { x: 480, y: 510 }, dimensions: { width: 94, height: 92 }, placard: "LIFT" }),

  door({ id: "y-flat-exit", sourceLocationId: "y-flat", targetLocationId: "hdb-corridor", label: "Return to the corridor", orientation: "south", style: "hinged-hdb", anchor: { x: 480, y: 588 }, approachPoint: { x: 480, y: 500 }, returnSpawn: { x: 480, y: 500 }, dimensions: INTERIOR_DOOR_SIZE, placard: "EXIT" }),
  door({ id: "mr-long-exit", sourceLocationId: "mr-long-flat", targetLocationId: "hdb-corridor", label: "Return to the corridor", orientation: "south", style: "hinged-hdb", anchor: { x: 480, y: 588 }, approachPoint: { x: 480, y: 500 }, returnSpawn: { x: 480, y: 500 }, dimensions: INTERIOR_DOOR_SIZE, placard: "EXIT" }),
  door({ id: "grandma-ros-exit", sourceLocationId: "grandma-ros-kitchen", targetLocationId: "hdb-corridor", label: "Return to the corridor", orientation: "south", style: "hinged-hdb", anchor: { x: 480, y: 588 }, approachPoint: { x: 480, y: 500 }, returnSpawn: { x: 480, y: 500 }, dimensions: INTERIOR_DOOR_SIZE, placard: "EXIT" }),
  door({ id: "ben-exit", sourceLocationId: "ben-flat", targetLocationId: "hdb-corridor", label: "Return to the corridor", orientation: "south", style: "hinged-hdb", anchor: { x: 480, y: 588 }, approachPoint: { x: 480, y: 500 }, returnSpawn: { x: 480, y: 500 }, dimensions: INTERIOR_DOOR_SIZE, placard: "EXIT" }),
  door({ id: "workshop-exit", sourceLocationId: "craftsman-workshop", targetLocationId: "estate", label: "Return to the estate", orientation: "south", style: "workshop-shutter", anchor: { x: 480, y: 588 }, approachPoint: { x: 480, y: 500 }, returnSpawn: { x: 480, y: 500 }, dimensions: { width: 90, height: 92 }, placard: "EXIT" }),
  door({ id: "community-exit", sourceLocationId: "community-centre", targetLocationId: "estate", label: "Return to the estate", orientation: "south", style: "double-community", anchor: { x: 480, y: 588 }, approachPoint: { x: 480, y: 500 }, returnSpawn: { x: 480, y: 500 }, dimensions: { width: 90, height: 92 }, placard: "EXIT" }),
  door({ id: "kopitiam-exit", sourceLocationId: "kopitiam", targetLocationId: "estate", label: "Return to the estate", orientation: "south", style: "sliding-commercial", anchor: { x: 480, y: 588 }, approachPoint: { x: 480, y: 500 }, returnSpawn: { x: 480, y: 500 }, dimensions: INTERIOR_DOOR_SIZE, placard: "EXIT" }),
  door({ id: "provision-exit", sourceLocationId: "provision-shop", targetLocationId: "estate", label: "Return to the estate", orientation: "south", style: "sliding-commercial", anchor: { x: 480, y: 588 }, approachPoint: { x: 480, y: 500 }, returnSpawn: { x: 480, y: 500 }, dimensions: INTERIOR_DOOR_SIZE, placard: "EXIT" }),
  door({ id: "hawker-exit", sourceLocationId: "hawker-centre", targetLocationId: "estate", label: "Return to the estate", orientation: "south", style: "open-hawker-gate", anchor: { x: 480, y: 588 }, approachPoint: { x: 480, y: 500 }, returnSpawn: { x: 480, y: 500 }, dimensions: { width: 90, height: 92 }, placard: "EXIT", startsOpen: true }),
  door({ id: "prayer-exit", sourceLocationId: "prayer-hall", targetLocationId: "estate", label: "Return to the estate", orientation: "south", style: "double-community", anchor: { x: 480, y: 588 }, approachPoint: { x: 480, y: 500 }, returnSpawn: { x: 480, y: 500 }, dimensions: { width: 90, height: 92 }, placard: "EXIT" }),
];

const shelter = (
  id: string,
  variant: ShelterDefinition["variant"],
  bounds: Omit<EstateRect, "id">,
  interactionPoint: EstatePoint,
): ShelterDefinition => {
  const roof: EstateRect = { id: `${id}-roof`, ...bounds };
  const clearInset = 30;
  return {
    id,
    variant,
    bounds: { id, ...bounds },
    roof,
    posts: [
      { id: `${id}-post-left`, x: bounds.x + 12, y: bounds.y + 14, width: 18, height: 18 },
      { id: `${id}-post-right`, x: bounds.x + bounds.width - 30, y: bounds.y + 14, width: 18, height: 18 },
      { id: `${id}-post-left-south`, x: bounds.x + 12, y: bounds.y + bounds.height - 32, width: 18, height: 18 },
      { id: `${id}-post-right-south`, x: bounds.x + bounds.width - 30, y: bounds.y + bounds.height - 32, width: 18, height: 18 },
    ],
    interactionPoint,
    dryMask: { id: `${id}-dry-mask`, ...bounds },
    glow: { id: `${id}-warm-glow`, ...bounds },
    shadeBands: [
      { id: `${id}-shade-north`, x: bounds.x, y: bounds.y + 16, width: bounds.width, height: 34 },
      { id: `${id}-shade-south`, x: bounds.x, y: bounds.y + bounds.height - 50, width: bounds.width, height: 34 },
    ],
    clearWalkway: {
      id: `${id}-clear-walkway`,
      x: bounds.x + clearInset,
      y: bounds.y,
      width: bounds.width - clearInset * 2,
      height: bounds.height,
    },
    minimumClearWidth: 96,
  };
};

export const SHELTER_DEFINITIONS: readonly ShelterDefinition[] = [
  shelter("original-shelter", "base", { x: 360, y: 500, width: 260, height: 260 }, { x: 490, y: 744 }),
  shelter("shelter-gap-extension", "shelter-gap", { x: 360, y: 740, width: 260, height: 320 }, { x: 490, y: 805 }),
  shelter("rest-point-canopy", "rest-point", { x: 120, y: 810, width: 220, height: 190 }, { x: 230, y: 905 }),
];

export const ESTATE_NPC_ROUTES: readonly NpcRouteDefinition[] = [
  { npcId: "aunty-mei", home: { x: 760, y: 605 }, points: [{ x: 760, y: 605 }, { x: 990, y: 640 }, { x: 770, y: 690 }] },
  { npcId: "uncle-ravi", home: { x: 1240, y: 620 }, points: [{ x: 1240, y: 620 }, { x: 1500, y: 650 }, { x: 1260, y: 700 }] },
  { npcId: "mdm-siti", home: { x: 490, y: 720 }, points: [{ x: 490, y: 720 }, { x: 490, y: 900 }, { x: 470, y: 1120 }] },
  { npcId: "pak-yusof", home: { x: 1870, y: 650 }, points: [{ x: 1870, y: 650 }, { x: 1870, y: 900 }, { x: 1880, y: 1120 }] },
  { npcId: "coach-meng", home: { x: 1580, y: 690 }, points: [{ x: 1580, y: 690 }, { x: 1720, y: 650 }, { x: 1500, y: 620 }] },
  { npcId: "uncle-seng", home: { x: 980, y: 1140 }, points: [{ x: 980, y: 1140 }, { x: 1240, y: 1140 }, { x: 1000, y: 1190 }] },
  { npcId: "auntie-minah", home: { x: 2140, y: 430 }, points: [{ x: 2140, y: 430 }, { x: 1930, y: 450 }, { x: 2220, y: 460 }] },
  { npcId: "wei-ling", home: { x: 1720, y: 680 }, points: [{ x: 1720, y: 680 }, { x: 1600, y: 650 }, { x: 1740, y: 620 }] },
];

export const BLOCK_9_BICYCLE_RACK: EstateBicycleRackDefinition = {
  id: "block-9-bicycle-verge", interactionId: "estate-shared-bicycles",
  context: "Block 9 outdoor bicycle verge", x: 190, y: 620,
};

export const PROVISION_SHOP_BICYCLE_RACK: EstateBicycleRackDefinition = {
  id: "provision-shop-bicycle-verge",
  context: "Provision-shop outdoor bicycle verge", x: 2320, y: 565,
};

export const BLOCK_12_BICYCLE_RACK: EstateBicycleRackDefinition = {
  id: "block-12-bicycle-verge", interactionId: "estate-block-twelve-bicycles",
  context: "Block 12 outdoor bicycle verge", x: 675, y: 1430,
};

export const ESTATE_BICYCLE_RACKS: readonly EstateBicycleRackDefinition[] = [
  BLOCK_9_BICYCLE_RACK,
  PROVISION_SHOP_BICYCLE_RACK,
  BLOCK_12_BICYCLE_RACK,
];

export const ESTATE_VEHICLE_LANES: readonly EstateRect[] = [];
export const ESTATE_VEHICLE_ROUTES: readonly EstateVehicleRouteDefinition[] = [];

function splitBuildingCollider(definition: BuildingDefinition): EstateRect[] {
  if (!definition.entranceDoorId) return [{ ...definition.bounds, id: `${definition.id}-shell` }];
  const entrance = DOOR_DEFINITIONS.find((candidate) => candidate.id === definition.entranceDoorId);
  if (!entrance) return [{ ...definition.bounds, id: `${definition.id}-shell` }];
  const openingLeft = entrance.anchor.x - entrance.dimensions.width / 2;
  const openingRight = entrance.anchor.x + entrance.dimensions.width / 2;
  const openingTop = entrance.anchor.y - entrance.dimensions.height;
  return [
    { id: `${definition.id}-left-shell`, x: definition.bounds.x, y: definition.bounds.y, width: openingLeft - definition.bounds.x, height: definition.bounds.height },
    { id: `${definition.id}-right-shell`, x: openingRight, y: definition.bounds.y, width: definition.bounds.x + definition.bounds.width - openingRight, height: definition.bounds.height },
    { id: `${definition.id}-header-shell`, x: openingLeft, y: definition.bounds.y, width: entrance.dimensions.width, height: openingTop - definition.bounds.y },
  ].filter((rect) => rect.width > 0 && rect.height > 0);
}

export const ESTATE_BUILDING_COLLISION_ZONES: readonly EstateRect[] =
  ESTATE_BUILDINGS.flatMap(splitBuildingCollider);

export const WORLD_LAYOUT: WorldLayoutDefinition = {
  bounds: ESTATE_WORLD_BOUNDS,
  streets: PEDESTRIAN_STREETS,
  buildings: ESTATE_BUILDINGS,
  buildingColliders: ESTATE_BUILDING_COLLISION_ZONES,
  doors: DOOR_DEFINITIONS,
  shelters: SHELTER_DEFINITIONS,
  npcRoutes: ESTATE_NPC_ROUTES,
  bicycleRacks: ESTATE_BICYCLE_RACKS,
  vehicleLanes: ESTATE_VEHICLE_LANES,
  vehicleRoutes: ESTATE_VEHICLE_ROUTES,
};

// Compatibility views for scene code while it migrates to WORLD_LAYOUT.
export const ESTATE_BUILDING_VISUAL_ZONES: readonly EstateRect[] =
  ESTATE_BUILDINGS.map((definition) => definition.bounds);

export const ESTATE_FACADE_DEPTH_DEFINITIONS: readonly EstateFacadeDepthDefinition[] =
  ESTATE_BUILDINGS.map((definition) => ({
    buildingId: definition.id,
    accent: definition.accent,
    roofStyle: definition.roofStyle,
    roofDepth: definition.roofDepth,
    roofInset: definition.roofInset,
    roofSegments: definition.roofSegments,
    sideFaceWidth: definition.sideFaceWidth,
  }));

export const ESTATE_ENTRANCES: readonly EstateEntranceDefinition[] =
  DOOR_DEFINITIONS.filter(
    (definition): definition is DoorDefinition & { buildingId: string } =>
      definition.sourceLocationId === "estate" && Boolean(definition.buildingId),
  ).map((definition) => ({
    id: definition.id,
    label: definition.label,
    targetLocationId: definition.targetLocationId,
    buildingId: definition.buildingId,
    x: definition.anchor.x,
    y: definition.anchor.y,
    width: definition.dimensions.width,
    height: definition.dimensions.height,
    placard: definition.placard,
  }));

export const ESTATE_PEDESTRIAN_ZONES: readonly EstateRect[] = PEDESTRIAN_STREETS;

export const BICYCLE_BAY_WIDTH = 132;
export const BICYCLE_BAY_DEPTH = 48;
export const BICYCLE_COLLISION_WIDTH = 96;
export const BICYCLE_COLLISION_DEPTH = 18;
export const BUILDING_OCCLUSION_FADE_ALPHA = 0.28;
export const BUILDING_OCCLUSION_APPROACH_DEPTH = 130;
export const BUILDING_OCCLUSION_FRONT_MARGIN = 45;

export function rectanglesOverlap(a: EstateRect, b: EstateRect): boolean {
  return a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y;
}

export function rectangleContains(outer: EstateRect, inner: EstateRect): boolean {
  return inner.x >= outer.x
    && inner.y >= outer.y
    && inner.x + inner.width <= outer.x + outer.width
    && inner.y + inner.height <= outer.y + outer.height;
}

export function pointIsInRect(point: EstatePoint, rectangle: EstateRect): boolean {
  return point.x >= rectangle.x
    && point.x <= rectangle.x + rectangle.width
    && point.y >= rectangle.y
    && point.y <= rectangle.y + rectangle.height;
}

export function getDoorsForLocation(locationId: LocationId): readonly DoorDefinition[] {
  return DOOR_DEFINITIONS.filter((doorDefinition) => doorDefinition.sourceLocationId === locationId);
}

export function getDoorDefinition(doorId: string): DoorDefinition | undefined {
  return DOOR_DEFINITIONS.find((definition) => definition.id === doorId);
}

export function getReturnSpawn(
  sourceLocationId: LocationId,
  targetLocationId: LocationId,
): EstatePoint | undefined {
  return DOOR_DEFINITIONS.find(
    (definition) => definition.sourceLocationId === targetLocationId
      && definition.targetLocationId === sourceLocationId,
  )?.returnSpawn;
}

export function getActiveShelters(choice?: ShelterChoice | null): readonly ShelterDefinition[] {
  return SHELTER_DEFINITIONS.filter(
    (definition) => definition.variant === "base" || definition.variant === choice,
  );
}

export function isPointDryUnderShelter(
  point: EstatePoint,
  choice?: ShelterChoice | null,
): boolean {
  return getActiveShelters(choice).some((definition) => pointIsInRect(point, definition.dryMask));
}

export function getOccludingBuildingIds(point: EstatePoint): readonly string[] {
  return ESTATE_BUILDINGS
    .filter((definition) => {
      const bounds = definition.bounds;
      const bottom = bounds.y + bounds.height;
      return point.x >= bounds.x
        && point.x <= bounds.x + bounds.width
        && point.y >= bottom - BUILDING_OCCLUSION_APPROACH_DEPTH
        && point.y <= bottom + BUILDING_OCCLUSION_FRONT_MARGIN;
    })
    .map((definition) => definition.id);
}

function bicycleBayBounds(rack: EstateBicycleRackDefinition): EstateRect {
  return {
    id: `${rack.id}-bay`,
    x: rack.x - BICYCLE_BAY_WIDTH / 2,
    y: rack.y - BICYCLE_BAY_DEPTH + 8,
    width: BICYCLE_BAY_WIDTH,
    height: BICYCLE_BAY_DEPTH,
  };
}

function hasStreetConnection(start: PedestrianStreetDefinition): boolean {
  const visited = new Set<string>([start.id]);
  const queue = [start];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    for (const candidate of PEDESTRIAN_STREETS) {
      if (!visited.has(candidate.id) && rectanglesOverlap(current, candidate)) {
        visited.add(candidate.id);
        queue.push(candidate);
      }
    }
  }
  return visited.size === PEDESTRIAN_STREETS.length;
}

export function auditEstateLayout(): readonly string[] {
  const issues: string[] = [];
  const unique = (values: readonly string[], kind: string): void => {
    const seen = new Set<string>();
    for (const value of values) {
      if (seen.has(value)) issues.push(`Duplicate ${kind}: ${value}`);
      seen.add(value);
    }
  };

  unique(ESTATE_BUILDINGS.map(({ id }) => id), "building ID");
  unique(PEDESTRIAN_STREETS.map(({ id }) => id), "street ID");
  unique(DOOR_DEFINITIONS.map(({ id }) => id), "door ID");
  unique(SHELTER_DEFINITIONS.map(({ id }) => id), "shelter ID");

  for (let index = 0; index < ESTATE_BUILDINGS.length; index += 1) {
    const definition = ESTATE_BUILDINGS[index];
    if (!definition) continue;
    if (!rectangleContains(ESTATE_WORLD_BOUNDS, definition.bounds)) {
      issues.push(`${definition.id} leaves the estate bounds`);
    }
    for (const other of ESTATE_BUILDINGS.slice(index + 1)) {
      if (rectanglesOverlap(definition.bounds, other.bounds)) {
        issues.push(`${definition.id} overlaps ${other.id}`);
      }
    }
  }

  if (PEDESTRIAN_STREETS[0] && !hasStreetConnection(PEDESTRIAN_STREETS[0])) {
    issues.push("Pedestrian street network is disconnected");
  }

  if (DOOR_DEFINITIONS.length !== 22) {
    issues.push(`Expected 22 contextual doors, found ${DOOR_DEFINITIONS.length}`);
  }
  for (const definition of DOOR_DEFINITIONS) {
    if (!rectangleContains(
      definition.sourceLocationId === "estate" ? ESTATE_WORLD_BOUNDS : { id: "interior", x: 0, y: 0, width: 960, height: 640 },
      definition.collider,
    )) {
      issues.push(`${definition.id} collider leaves its scene`);
    }
    if (definition.sourceLocationId === "estate") {
      const sourceBuilding = ESTATE_BUILDINGS.find(({ id }) => id === definition.buildingId);
      if (!sourceBuilding) {
        issues.push(`${definition.id} references a missing building`);
      } else {
        const threshold = sourceBuilding.bounds.y + sourceBuilding.bounds.height;
        if (Math.abs(definition.anchor.y - threshold) > 1) {
          issues.push(`${definition.id} misses ${sourceBuilding.id}'s threshold`);
        }
      }
      if (!PEDESTRIAN_STREETS.some((street) => pointIsInRect(definition.approachPoint, street))) {
        issues.push(`${definition.id} approach is outside the pedestrian network`);
      }
      if (!PEDESTRIAN_STREETS.some((street) => pointIsInRect(definition.returnSpawn, street))) {
        issues.push(`${definition.id} return spawn is outside the pedestrian network`);
      }
    }
    const counterpart = DOOR_DEFINITIONS.find(
      (candidate) => candidate.sourceLocationId === definition.targetLocationId
        && candidate.targetLocationId === definition.sourceLocationId,
    );
    if (!counterpart) issues.push(`${definition.id} has no return door`);
  }

  const base = SHELTER_DEFINITIONS.find(({ variant }) => variant === "base");
  const extension = SHELTER_DEFINITIONS.find(({ variant }) => variant === "shelter-gap");
  if (!base || !extension || base.bounds.y + base.bounds.height - extension.bounds.y !== 20) {
    issues.push("Shelter-gap extension must overlap the original shelter by 20 px");
  }
  for (const definition of SHELTER_DEFINITIONS) {
    if (definition.clearWalkway.width < definition.minimumClearWidth) {
      issues.push(`${definition.id} has less than 96 px clear walking width`);
    }
    if (
      definition.dryMask.x !== definition.bounds.x
      || definition.dryMask.y !== definition.bounds.y
      || definition.dryMask.width !== definition.bounds.width
      || definition.dryMask.height !== definition.bounds.height
    ) {
      issues.push(`${definition.id} rain mask disagrees with its roof`);
    }
  }

  const seenRackIds = new Set<string>();
  const seenInteractionIds = new Set<string>();
  for (const rack of ESTATE_BICYCLE_RACKS) {
    if (seenRackIds.has(rack.id)) issues.push(`Duplicate bicycle rack ID: ${rack.id}`);
    seenRackIds.add(rack.id);
    if (rack.interactionId) {
      if (seenInteractionIds.has(rack.interactionId)) issues.push(`Duplicate bicycle interaction ID: ${rack.interactionId}`);
      seenInteractionIds.add(rack.interactionId);
    }
    const bay = bicycleBayBounds(rack);
    if (!rectangleContains(ESTATE_WORLD_BOUNDS, bay)) issues.push(`${rack.id} leaves the estate bounds`);
    for (const definition of ESTATE_BUILDINGS) {
      if (rectanglesOverlap(bay, definition.bounds)) issues.push(`${rack.id} overlaps ${definition.id}`);
    }
    for (const street of PEDESTRIAN_STREETS) {
      if (rectanglesOverlap(bay, street)) issues.push(`${rack.id} blocks ${street.id}`);
    }
  }

  for (const vehicle of ESTATE_VEHICLE_ROUTES) {
    if (vehicle.points.length < 2) {
      issues.push(`${vehicle.id} needs at least two route points`);
      continue;
    }
    if (vehicle.points.some((point) => !ESTATE_VEHICLE_LANES.some((lane) => pointIsInRect(point, lane)))) {
      issues.push(`${vehicle.id} leaves the estate road network`);
    }
  }

  return issues;
}
