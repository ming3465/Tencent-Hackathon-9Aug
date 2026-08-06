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

export type TreeTexture = "tree-rain" | "tree-palm" | "tree-frangipani";

export interface TreeDefinition {
  id: string;
  texture: TreeTexture;
  anchor: EstatePoint;
  spriteSize: {
    width: number;
    height: number;
  };
  trunkCollider: EstateRect;
  depthLayer: 5;
}

export interface SidewalkApronDefinition extends EstateRect {
  surface: "tiled-apron";
}

export interface SideLampDefinition {
  id: string;
  texture: "prop-lamp";
  anchor: EstatePoint;
  apronId: string;
  collider: EstateRect;
  depthLayer: 4;
}

export type EstateLandscapeTexture =
  | "landscape-shrub"
  | "landscape-flower-bed"
  | "landscape-pandan"
  | "landscape-hedge";

export interface EstateLandscapeDefinition {
  id: string;
  texture: EstateLandscapeTexture;
  anchor: EstatePoint;
  spriteSize: {
    width: number;
    height: number;
  };
  collider: EstateRect;
  depthLayer: 3;
}

export interface EstateGroundFlowerDefinition {
  id: string;
  centre: EstatePoint;
  colourVariant: 0 | 1 | 2 | 3;
}

export type EstatePlantedFeatureTexture =
  | "prop-planter"
  | "prop-bike-planters"
  | "prop-shaded-seating"
  | "prop-courtyard-planter-bed";

export interface EstatePlantedFeatureDefinition {
  id: string;
  texture: EstatePlantedFeatureTexture;
  anchor: EstatePoint;
  spriteSize: {
    width: number;
    height: number;
  };
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
  sidewalkAprons: readonly SidewalkApronDefinition[];
  buildings: readonly BuildingDefinition[];
  buildingColliders: readonly EstateRect[];
  doors: readonly DoorDefinition[];
  shelters: readonly ShelterDefinition[];
  trees: readonly TreeDefinition[];
  sideLamps: readonly SideLampDefinition[];
  landscaping: readonly EstateLandscapeDefinition[];
  groundFlowers: readonly EstateGroundFlowerDefinition[];
  plantedFeatures: readonly EstatePlantedFeatureDefinition[];
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

export const SIDEWALK_APRONS: readonly SidewalkApronDefinition[] = [
  { id: "lamp-apron-north-west", x: 742, y: 500, width: 56, height: 40, surface: "tiled-apron" },
  { id: "lamp-apron-north-centre", x: 992, y: 500, width: 56, height: 40, surface: "tiled-apron" },
  { id: "lamp-apron-east-market", x: 1990, y: 630, width: 56, height: 40, surface: "tiled-apron" },
  { id: "lamp-apron-civic-south", x: 1062, y: 1010, width: 56, height: 40, surface: "tiled-apron" },
  { id: "lamp-apron-south-west", x: 622, y: 1230, width: 56, height: 40, surface: "tiled-apron" },
  { id: "lamp-apron-south-east", x: 1992, y: 1230, width: 56, height: 40, surface: "tiled-apron" },
];

const TREE_SPRITE_SIZES: Readonly<Record<TreeTexture, TreeDefinition["spriteSize"]>> = {
  "tree-rain": { width: 180, height: 166 },
  "tree-palm": { width: 140, height: 178 },
  "tree-frangipani": { width: 138, height: 136 },
};

const tree = (
  id: string,
  texture: TreeTexture,
  x: number,
  y: number,
): TreeDefinition => ({
  id,
  texture,
  anchor: { x, y },
  spriteSize: TREE_SPRITE_SIZES[texture],
  trunkCollider: {
    id: `${id}-trunk`,
    x: x - 10,
    y: y - 24,
    width: 20,
    height: 24,
  },
  depthLayer: 5,
});

export const ESTATE_TREES: readonly TreeDefinition[] = [
  tree("tree-north-west-frangipani", "tree-frangipani", 90, 700),
  tree("tree-west-rain", "tree-rain", 270, 740),
  tree("tree-market-east-frangipani", "tree-frangipani", 2180, 636),
  tree("tree-far-east-palm", "tree-palm", 2490, 700),
  tree("tree-south-west-rain", "tree-rain", 790, 1408),
  tree("tree-south-west-palm", "tree-palm", 960, 1550),
  tree("tree-south-centre-palm", "tree-palm", 1450, 1480),
  tree("tree-south-centre-frangipani", "tree-frangipani", 1650, 1370),
  tree("tree-south-east-rain", "tree-rain", 2140, 1450),
  tree("tree-south-east-frangipani", "tree-frangipani", 2300, 1530),
  tree("tree-far-south-east-rain", "tree-rain", 2465, 1400),
];

const sideLamp = (
  id: string,
  x: number,
  y: number,
  apronId: string,
): SideLampDefinition => ({
  id,
  texture: "prop-lamp",
  anchor: { x, y },
  apronId,
  collider: {
    id: `${id}-base`,
    x: x - 7,
    y: y - 12,
    width: 14,
    height: 12,
  },
  depthLayer: 4,
});

export const ESTATE_SIDE_LAMPS: readonly SideLampDefinition[] = [
  sideLamp("side-lamp-north-west", 770, 532, "lamp-apron-north-west"),
  sideLamp("side-lamp-north-centre", 1020, 532, "lamp-apron-north-centre"),
  sideLamp("side-lamp-east-market", 2018, 662, "lamp-apron-east-market"),
  sideLamp("side-lamp-civic-south", 1090, 1042, "lamp-apron-civic-south"),
  sideLamp("side-lamp-south-west", 650, 1262, "lamp-apron-south-west"),
  sideLamp("side-lamp-south-east", 2020, 1262, "lamp-apron-south-east"),
];

const LANDSCAPE_SPRITE_SIZES: Readonly<
  Record<EstateLandscapeTexture, EstateLandscapeDefinition["spriteSize"]>
> = {
  "landscape-shrub": { width: 80, height: 58 },
  "landscape-flower-bed": { width: 116, height: 62 },
  "landscape-pandan": { width: 72, height: 68 },
  "landscape-hedge": { width: 142, height: 62 },
};

const LANDSCAPE_COLLIDER_SIZES: Readonly<
  Record<EstateLandscapeTexture, { width: number; height: number }>
> = {
  "landscape-shrub": { width: 56, height: 14 },
  "landscape-flower-bed": { width: 88, height: 14 },
  "landscape-pandan": { width: 42, height: 14 },
  "landscape-hedge": { width: 112, height: 16 },
};

const landscaping = (
  id: string,
  texture: EstateLandscapeTexture,
  x: number,
  y: number,
): EstateLandscapeDefinition => {
  const colliderSize = LANDSCAPE_COLLIDER_SIZES[texture];
  return {
    id,
    texture,
    anchor: { x, y },
    spriteSize: LANDSCAPE_SPRITE_SIZES[texture],
    collider: {
      id: `${id}-collider`,
      x: x - colliderSize.width / 2,
      y: y - colliderSize.height,
      ...colliderSize,
    },
    depthLayer: 3,
  };
};

export const ESTATE_LANDSCAPING: readonly EstateLandscapeDefinition[] = [
  landscaping("hedge-south-west-01", "landscape-hedge", 1015, 1310),
  landscaping("hedge-south-east-01", "landscape-hedge", 2471, 1542),
  landscaping("hedge-south-east-02", "landscape-hedge", 2471, 1598),
  landscaping("hedge-east-garden-01", "landscape-hedge", 2327, 630),
  landscaping("hedge-east-garden-02", "landscape-hedge", 2487, 766),
  landscaping("hedge-south-centre-01", "landscape-hedge", 1671, 1462),
  landscaping("hedge-south-east-03", "landscape-hedge", 2447, 1486),
  landscaping("hedge-east-garden-03", "landscape-hedge", 2327, 582),
  landscaping("hedge-south-centre-02", "landscape-hedge", 1495, 1294),
  landscaping("hedge-west-verge-01", "landscape-hedge", 279, 806),
  landscaping("hedge-south-east-04", "landscape-hedge", 2295, 1598),
  landscaping("hedge-west-verge-02", "landscape-hedge", 111, 806),
  landscaping("flower-south-west-01", "landscape-flower-bed", 1042, 1358),
  landscaping("flower-south-east-01", "landscape-flower-bed", 2290, 1382),
  landscaping("flower-south-west-02", "landscape-flower-bed", 634, 1350),
  landscaping("flower-south-west-03", "landscape-flower-bed", 634, 1454),
  landscaping("flower-south-east-02", "landscape-flower-bed", 2290, 1310),
  landscaping("flower-west-verge-01", "landscape-flower-bed", 58, 966),
  landscaping("flower-west-verge-02", "landscape-flower-bed", 58, 910),
  landscaping("flower-west-verge-03", "landscape-flower-bed", 290, 566),
  landscaping("flower-south-west-04", "landscape-flower-bed", 634, 1406),
  landscaping("flower-east-garden-01", "landscape-flower-bed", 2050, 606),
  landscaping("flower-west-verge-04", "landscape-flower-bed", 58, 1022),
  landscaping("flower-west-verge-05", "landscape-flower-bed", 58, 862),
  landscaping("pandan-south-west-01", "landscape-pandan", 924, 1324),
  landscaping("pandan-south-west-02", "landscape-pandan", 852, 1548),
  landscaping("pandan-south-centre-01", "landscape-pandan", 1772, 1404),
  landscaping("pandan-south-west-03", "landscape-pandan", 1076, 1468),
  landscaping("pandan-south-west-04", "landscape-pandan", 1068, 1524),
  landscaping("pandan-south-west-05", "landscape-pandan", 852, 1484),
  landscaping("pandan-south-west-06", "landscape-pandan", 1076, 1596),
  landscaping("pandan-south-centre-02", "landscape-pandan", 1564, 1444),
  landscaping("shrub-north-verge-01", "landscape-shrub", 1408, 58),
  landscaping("shrub-south-west-01", "landscape-shrub", 1072, 1410),
  landscaping("shrub-north-verge-02", "landscape-shrub", 256, 58),
  landscaping("shrub-north-verge-03", "landscape-shrub", 2352, 58),
  landscaping("shrub-north-verge-04", "landscape-shrub", 1488, 58),
  landscaping("shrub-north-verge-05", "landscape-shrub", 80, 58),
  landscaping("shrub-north-verge-06", "landscape-shrub", 1136, 58),
  landscaping("shrub-north-verge-07", "landscape-shrub", 2512, 58),
  landscaping("shrub-north-verge-08", "landscape-shrub", 1680, 58),
];

export const ESTATE_GROUND_FLOWERS: readonly EstateGroundFlowerDefinition[] = [
  { id: "ground-flower-01", centre: { x: 2089, y: 1478 }, colourVariant: 0 },
  { id: "ground-flower-02", centre: { x: 1769, y: 1310 }, colourVariant: 1 },
  { id: "ground-flower-03", centre: { x: 2017, y: 1422 }, colourVariant: 2 },
  { id: "ground-flower-04", centre: { x: 1545, y: 1350 }, colourVariant: 3 },
  { id: "ground-flower-05", centre: { x: 777, y: 1438 }, colourVariant: 0 },
  { id: "ground-flower-06", centre: { x: 1393, y: 1286 }, colourVariant: 1 },
  { id: "ground-flower-07", centre: { x: 2177, y: 1254 }, colourVariant: 2 },
  { id: "ground-flower-08", centre: { x: 2129, y: 46 }, colourVariant: 3 },
  { id: "ground-flower-09", centre: { x: 2265, y: 22 }, colourVariant: 0 },
  { id: "ground-flower-10", centre: { x: 905, y: 1334 }, colourVariant: 1 },
  { id: "ground-flower-11", centre: { x: 1785, y: 1422 }, colourVariant: 2 },
  { id: "ground-flower-12", centre: { x: 2057, y: 30 }, colourVariant: 3 },
  { id: "ground-flower-13", centre: { x: 729, y: 1446 }, colourVariant: 0 },
  { id: "ground-flower-14", centre: { x: 961, y: 1582 }, colourVariant: 1 },
  { id: "ground-flower-15", centre: { x: 1777, y: 1262 }, colourVariant: 2 },
  { id: "ground-flower-16", centre: { x: 897, y: 1574 }, colourVariant: 3 },
  { id: "ground-flower-17", centre: { x: 2009, y: 1310 }, colourVariant: 0 },
  { id: "ground-flower-18", centre: { x: 2025, y: 1470 }, colourVariant: 1 },
  { id: "ground-flower-19", centre: { x: 2073, y: 1246 }, colourVariant: 2 },
  { id: "ground-flower-20", centre: { x: 2537, y: 1454 }, colourVariant: 3 },
  { id: "ground-flower-21", centre: { x: 2385, y: 1574 }, colourVariant: 0 },
  { id: "ground-flower-22", centre: { x: 849, y: 1582 }, colourVariant: 1 },
  { id: "ground-flower-23", centre: { x: 2081, y: 518 }, colourVariant: 2 },
];

export const ESTATE_PLANTED_FEATURES: readonly EstatePlantedFeatureDefinition[] = [
  { id: "east-chess-garden", texture: "prop-courtyard-planter-bed", anchor: { x: 2200, y: 780 }, spriteSize: { width: 380, height: 105 } },
  { id: "north-gap-planter", texture: "prop-planter", anchor: { x: 1240, y: 70 }, spriteSize: { width: 76, height: 64 } },
  { id: "south-west-planter", texture: "prop-planter", anchor: { x: 1080, y: 1590 }, spriteSize: { width: 76, height: 64 } },
  { id: "east-edge-planter", texture: "prop-planter", anchor: { x: 2520, y: 900 }, spriteSize: { width: 76, height: 64 } },
  { id: "south-centre-bike-planters", texture: "prop-bike-planters", anchor: { x: 1475, y: 1595 }, spriteSize: { width: 220, height: 96 } },
  { id: "south-east-bike-planters", texture: "prop-bike-planters", anchor: { x: 2110, y: 1595 }, spriteSize: { width: 220, height: 96 } },
  { id: "south-west-shaded-seating", texture: "prop-shaded-seating", anchor: { x: 690, y: 1595 }, spriteSize: { width: 226, height: 128 } },
  { id: "south-centre-shaded-seating", texture: "prop-shaded-seating", anchor: { x: 1690, y: 1595 }, spriteSize: { width: 226, height: 128 } },
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
  door({ id: "estate-hawker", sourceLocationId: "estate", targetLocationId: "hawker-centre", buildingId: "hawker-centre", label: "Enter the hawker centre", orientation: "north", style: "open-hawker-gate", anchor: { x: 970, y: 330 }, approachPoint: { x: 970, y: 400 }, returnSpawn: { x: 970, y: 405 }, dimensions: { width: 82, height: 84 }, placard: "ENTRY" }),
  door({ id: "estate-kopitiam", sourceLocationId: "estate", targetLocationId: "kopitiam", buildingId: "kopitiam", label: "Enter the kopitiam", orientation: "north", style: "sliding-commercial", anchor: { x: 1550, y: 330 }, approachPoint: { x: 1550, y: 400 }, returnSpawn: { x: 1550, y: 405 }, dimensions: EXTERIOR_DOOR_SIZE, placard: "KOPI" }),
  door({ id: "estate-provision", sourceLocationId: "estate", targetLocationId: "provision-shop", buildingId: "provision-shop", label: "Enter Minah's provision shop", orientation: "north", style: "sliding-commercial", anchor: { x: 2140, y: 330 }, approachPoint: { x: 2140, y: 400 }, returnSpawn: { x: 2140, y: 405 }, dimensions: EXTERIOR_DOOR_SIZE, placard: "MINAH" }),
  door({ id: "estate-workshop", sourceLocationId: "estate", targetLocationId: "craftsman-workshop", buildingId: "craftsman-workshop", label: "Enter the craftsman's workshop", orientation: "north", style: "workshop-shutter", anchor: { x: 870, y: 1050 }, approachPoint: { x: 870, y: 1120 }, returnSpawn: { x: 870, y: 1125 }, dimensions: { width: 82, height: 84 }, placard: "OPEN" }),
  door({ id: "estate-community", sourceLocationId: "estate", targetLocationId: "community-centre", buildingId: "community-centre", label: "Enter the community centre", orientation: "north", style: "double-community", anchor: { x: 1600, y: 1050 }, approachPoint: { x: 1600, y: 1120 }, returnSpawn: { x: 1600, y: 1125 }, dimensions: { width: 82, height: 84 }, placard: "CC" }),
  door({ id: "estate-prayer", sourceLocationId: "estate", targetLocationId: "prayer-hall", buildingId: "prayer-hall", label: "Enter the prayer hall", orientation: "north", style: "double-community", anchor: { x: 2250, y: 1050 }, approachPoint: { x: 2250, y: 1120 }, returnSpawn: { x: 2250, y: 1125 }, dimensions: { width: 82, height: 84 }, placard: "WELCOME" }),

  door({ id: "corridor-y-flat", sourceLocationId: "hdb-corridor", targetLocationId: "y-flat", label: "Enter {player}'s flat", orientation: "north", style: "hinged-hdb", anchor: { x: 150, y: 265 }, approachPoint: { x: 150, y: 350 }, returnSpawn: { x: 150, y: 350 }, dimensions: INTERIOR_DOOR_SIZE, placard: "01" }),
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
  door({ id: "hawker-exit", sourceLocationId: "hawker-centre", targetLocationId: "estate", label: "Return to the estate", orientation: "south", style: "open-hawker-gate", anchor: { x: 480, y: 588 }, approachPoint: { x: 480, y: 500 }, returnSpawn: { x: 480, y: 500 }, dimensions: { width: 90, height: 92 }, placard: "EXIT", startsOpen: false }),
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
  sidewalkAprons: SIDEWALK_APRONS,
  buildings: ESTATE_BUILDINGS,
  buildingColliders: ESTATE_BUILDING_COLLISION_ZONES,
  doors: DOOR_DEFINITIONS,
  shelters: SHELTER_DEFINITIONS,
  trees: ESTATE_TREES,
  sideLamps: ESTATE_SIDE_LAMPS,
  landscaping: ESTATE_LANDSCAPING,
  groundFlowers: ESTATE_GROUND_FLOWERS,
  plantedFeatures: ESTATE_PLANTED_FEATURES,
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

export function treeSpriteBounds(definition: TreeDefinition): EstateRect {
  return {
    id: `${definition.id}-sprite`,
    x: definition.anchor.x - definition.spriteSize.width / 2,
    y: definition.anchor.y - definition.spriteSize.height,
    width: definition.spriteSize.width,
    height: definition.spriteSize.height,
  };
}

export function plantingSpriteBounds(
  definition: Pick<EstateLandscapeDefinition | EstatePlantedFeatureDefinition, "id" | "anchor" | "spriteSize">,
): EstateRect {
  return {
    id: `${definition.id}-sprite`,
    x: definition.anchor.x - definition.spriteSize.width / 2,
    y: definition.anchor.y - definition.spriteSize.height,
    width: definition.spriteSize.width,
    height: definition.spriteSize.height,
  };
}

export function groundFlowerBounds(definition: EstateGroundFlowerDefinition): EstateRect {
  return {
    id: `${definition.id}-painted-bounds`,
    x: definition.centre.x - 17,
    y: definition.centre.y - 12,
    width: 34,
    height: 26,
  };
}

export interface DoorOpenLeafTransform {
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
}

export function doorOpenLeafTransform(
  style: DoorStyle,
  dimensions: { width: number; height: number },
): DoorOpenLeafTransform {
  if (style === "workshop-shutter") {
    return {
      scaleX: 1,
      scaleY: 0.08,
      offsetX: 0,
      offsetY: -dimensions.height / 2,
    };
  }
  if (style === "hinged-hdb") {
    return {
      scaleX: 0.12,
      scaleY: 1,
      offsetX: -dimensions.width * 0.34,
      offsetY: 0,
    };
  }
  return { scaleX: 0.08, scaleY: 1, offsetX: 0, offsetY: 0 };
}

export function doorApproachBounds(definition: DoorDefinition): EstateRect {
  const clearance = Math.max(96, definition.dimensions.width + 24);
  return {
    id: `${definition.id}-approach-clearance`,
    x: definition.approachPoint.x - clearance / 2,
    y: definition.approachPoint.y - 48,
    width: clearance,
    height: 96,
  };
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
  unique(ESTATE_TREES.map(({ id }) => id), "tree ID");
  unique(SIDEWALK_APRONS.map(({ id }) => id), "sidewalk apron ID");
  unique(ESTATE_SIDE_LAMPS.map(({ id }) => id), "side lamp ID");
  unique(ESTATE_LANDSCAPING.map(({ id }) => id), "landscaping ID");
  unique(ESTATE_GROUND_FLOWERS.map(({ id }) => id), "ground flower ID");
  unique(ESTATE_PLANTED_FEATURES.map(({ id }) => id), "planted feature ID");

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

  for (const apron of SIDEWALK_APRONS) {
    if (!rectangleContains(ESTATE_WORLD_BOUNDS, apron)) {
      issues.push(`${apron.id} leaves the estate bounds`);
    }
    if (PEDESTRIAN_STREETS.some((street) => rectanglesOverlap(apron, street))) {
      issues.push(`${apron.id} overlaps a pedestrian street`);
    }
  }

  for (const definition of ESTATE_TREES) {
    const bounds = treeSpriteBounds(definition);
    if (!rectangleContains(ESTATE_WORLD_BOUNDS, bounds)) {
      issues.push(`${definition.id} sprite leaves the estate bounds`);
    }
    if (!rectangleContains(bounds, definition.trunkCollider)) {
      issues.push(`${definition.id} trunk leaves its sprite bounds`);
    }
    for (const street of PEDESTRIAN_STREETS) {
      if (rectanglesOverlap(bounds, street)) {
        issues.push(`${definition.id} sprite blocks ${street.id}`);
      }
    }
    for (const buildingDefinition of ESTATE_BUILDINGS) {
      if (rectanglesOverlap(bounds, buildingDefinition.bounds)) {
        issues.push(`${definition.id} sprite overlaps ${buildingDefinition.id}`);
      }
    }
    for (const shelterDefinition of SHELTER_DEFINITIONS) {
      if (rectanglesOverlap(bounds, shelterDefinition.bounds)) {
        issues.push(`${definition.id} sprite overlaps ${shelterDefinition.id}`);
      }
    }
    for (const apron of SIDEWALK_APRONS) {
      if (rectanglesOverlap(bounds, apron)) {
        issues.push(`${definition.id} sprite overlaps ${apron.id}`);
      }
    }
  }

  for (const lamp of ESTATE_SIDE_LAMPS) {
    const apron = SIDEWALK_APRONS.find(({ id }) => id === lamp.apronId);
    if (!apron) {
      issues.push(`${lamp.id} references a missing sidewalk apron`);
      continue;
    }
    if (!rectangleContains(apron, lamp.collider)) {
      issues.push(`${lamp.id} base leaves ${apron.id}`);
    }
    if (PEDESTRIAN_STREETS.some((street) => rectanglesOverlap(lamp.collider, street))) {
      issues.push(`${lamp.id} base blocks a pedestrian street`);
    }
    if (DOOR_DEFINITIONS
      .filter(({ sourceLocationId }) => sourceLocationId === "estate")
      .some((doorDefinition) => rectanglesOverlap(
        lamp.collider,
        doorApproachBounds(doorDefinition),
      ))) {
      issues.push(`${lamp.id} base blocks a door approach`);
    }
  }

  const fixedPlantObstructions: readonly EstateRect[] = [
    ...PEDESTRIAN_STREETS,
    ...ESTATE_BUILDINGS.map(({ bounds }) => bounds),
    ...SHELTER_DEFINITIONS.map(({ bounds }) => bounds),
    ...SIDEWALK_APRONS,
    ...ESTATE_TREES.map(treeSpriteBounds),
  ];
  const auditPlantBounds = (id: string, bounds: EstateRect): void => {
    if (!rectangleContains(ESTATE_WORLD_BOUNDS, bounds)) {
      issues.push(`${id} leaves the estate bounds`);
    }
    for (const obstruction of fixedPlantObstructions) {
      if (rectanglesOverlap(bounds, obstruction)) {
        issues.push(`${id} overlaps ${obstruction.id}`);
      }
    }
  };
  for (const definition of ESTATE_LANDSCAPING) {
    const bounds = plantingSpriteBounds(definition);
    auditPlantBounds(definition.id, bounds);
    if (!rectangleContains(bounds, definition.collider)) {
      issues.push(`${definition.id} collider leaves its sprite bounds`);
    }
  }
  for (const definition of ESTATE_GROUND_FLOWERS) {
    auditPlantBounds(definition.id, groundFlowerBounds(definition));
  }
  for (const definition of ESTATE_PLANTED_FEATURES) {
    auditPlantBounds(definition.id, plantingSpriteBounds(definition));
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
