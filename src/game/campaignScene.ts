import Phaser from "phaser";
import {
  createRoomBackdropTexture,
  darkenColour,
  drawPixelBlock,
  ensureCampaignArtTextures,
  lightenColour,
  PALETTE,
  type PlayerFacing,
  type WalkFrame,
} from "./campaignArt.js";
import {
  getCharacterArtAudit,
  type CharacterArtAudit,
} from "./characterArt.js";
import {
  CONSEQUENCE_ART_IDS,
  drawExteriorRamp,
  drawFlowerSeatGarden,
  drawHerbGarden,
  drawInteriorRamp,
  emptyConsequenceArtSnapshot,
  type CampaignConsequenceArtSnapshot,
} from "./consequenceArt.js";
import {
  ESTATE_FLAVOUR_INTERACTIONS,
  LOCATION_BY_ID,
  NPC_BY_ID,
} from "./campaignContent.js";
import {
  auditEstateLayout,
  BICYCLE_BAY_DEPTH,
  BICYCLE_BAY_WIDTH,
  BICYCLE_COLLISION_DEPTH,
  BICYCLE_COLLISION_WIDTH,
  BUILDING_OCCLUSION_FADE_ALPHA,
  ESTATE_BICYCLE_RACKS,
  ESTATE_BUILDINGS,
  ESTATE_BUILDING_COLLISION_ZONES,
  ESTATE_BUILDING_VISUAL_ZONES,
  ESTATE_ENTRANCES,
  ESTATE_FACADE_DEPTH_DEFINITIONS,
  ESTATE_VEHICLE_ROUTES,
  ESTATE_NPC_ROUTES as LAYOUT_NPC_ROUTES,
  getDoorsForLocation,
  getActiveShelters,
  getReturnSpawn,
  getOccludingBuildingIds,
  isPointDryUnderShelter,
  type EstateRect,
  type DoorDefinition,
  type ShelterChoice,
} from "./estateLayout.js";
import { DoorTransitionController } from "./doorState.js";
import {
  ensureBuildingTexture,
  ensureShelterTexture,
  paintThreeQuarterTerrain,
} from "./threeQuarterArt.js";
import {
  movementSurfaceAt,
  stepIntervalFor,
  walkFrameAt,
  type MovementSurface,
} from "./movementFeel.js";
import type {
  CampaignStateV1,
  LocationId,
  NpcId,
  QuestId,
  ScamCheckCardLayout,
  WorldInteraction,
} from "./campaignTypes.js";

const INK = PALETTE.ink;
const NIGHT = PALETTE.night;
const CREAM = PALETTE.cream;
const PAPER = PALETTE.paper;
const SAND = PALETTE.sand;
const CORAL = PALETTE.coral;
const GOLD = PALETTE.gold;
const TEAL = PALETTE.teal;
const GREEN = PALETTE.green;
const PURPLE = PALETTE.purple;
const CONCRETE = PALETTE.concrete;
const CONCRETE_EDGE = PALETTE.concreteEdge;
const GRASS_DARK = PALETTE.grassDark;
const CHARACTER_ART_AUDIT = getCharacterArtAudit();

const ESTATE_WIDTH = 2560;
const ESTATE_HEIGHT = 1600;
const ROOM_WIDTH = 960;
const ROOM_HEIGHT = 640;
const WALK_SPEED = 215;
const HURRY_SPEED = 260;
const INTERACTION_DISTANCE = 112;
const TRANSITION_LATCH_MS = 420;
const TRANSITION_FALLBACK_MS = 360;

function depthFor(y: number, layer = 0): number {
  return y * 10 + layer;
}

const PIXEL_GLYPHS: Readonly<Record<string, readonly number[]>> = {
  "0": [0b010, 0b101, 0b101, 0b101, 0b010],
  "1": [0b010, 0b110, 0b010, 0b010, 0b111],
  "2": [0b110, 0b001, 0b010, 0b100, 0b111],
  "3": [0b110, 0b001, 0b010, 0b001, 0b110],
  A: [0b010, 0b101, 0b111, 0b101, 0b101],
  B: [0b110, 0b101, 0b110, 0b101, 0b110],
  C: [0b011, 0b100, 0b100, 0b100, 0b011],
  D: [0b110, 0b101, 0b101, 0b101, 0b110],
  E: [0b111, 0b100, 0b110, 0b100, 0b111],
  F: [0b111, 0b100, 0b110, 0b100, 0b100],
  G: [0b011, 0b100, 0b101, 0b101, 0b011],
  H: [0b101, 0b101, 0b111, 0b101, 0b101],
  I: [0b111, 0b010, 0b010, 0b010, 0b111],
  J: [0b001, 0b001, 0b001, 0b101, 0b010],
  K: [0b101, 0b101, 0b110, 0b101, 0b101],
  L: [0b100, 0b100, 0b100, 0b100, 0b111],
  M: [0b101, 0b111, 0b111, 0b101, 0b101],
  N: [0b101, 0b111, 0b111, 0b111, 0b101],
  O: [0b010, 0b101, 0b101, 0b101, 0b010],
  P: [0b110, 0b101, 0b110, 0b100, 0b100],
  Q: [0b010, 0b101, 0b101, 0b111, 0b011],
  R: [0b110, 0b101, 0b110, 0b101, 0b101],
  S: [0b011, 0b100, 0b010, 0b001, 0b110],
  T: [0b111, 0b010, 0b010, 0b010, 0b010],
  U: [0b101, 0b101, 0b101, 0b101, 0b111],
  V: [0b101, 0b101, 0b101, 0b101, 0b010],
  W: [0b101, 0b101, 0b111, 0b111, 0b101],
  X: [0b101, 0b101, 0b010, 0b101, 0b101],
  Y: [0b101, 0b101, 0b010, 0b010, 0b010],
  Z: [0b111, 0b001, 0b010, 0b100, 0b111],
};

function pixelTextWidth(text: string, scale: number): number {
  let width = 0;
  for (const character of text) {
    width += character === " " ? scale * 3 : scale * 4;
  }
  return Math.max(0, width - scale);
}

function drawPixelText(
  graphics: Phaser.GameObjects.Graphics,
  text: string,
  x: number,
  y: number,
  scale: number,
  colour: number,
): void {
  let cursor = x;
  for (const character of text) {
    if (character === " ") {
      cursor += scale * 3;
      continue;
    }
    const glyph = PIXEL_GLYPHS[character];
    if (!glyph) continue;
    for (let row = 0; row < glyph.length; row += 1) {
      for (let column = 0; column < 3; column += 1) {
        if ((glyph[row] & (1 << (2 - column))) === 0) continue;
        graphics
          .fillStyle(colour)
          .fillRect(cursor + column * scale, y + row * scale, scale, scale);
      }
    }
    cursor += scale * 4;
  }
}

function drawScamCheckCard(
  graphics: Phaser.GameObjects.Graphics,
  layout: ScamCheckCardLayout,
): void {
  const x = 2020;
  const y = 184;
  const width = 190;
  const height = 84;
  drawPixelBlock(graphics, x, y, width, height, PAPER, 4, false);
  graphics
    .fillStyle(TEAL)
    .fillRect(x + 4, y + 4, width - 8, 23)
    .fillStyle(lightenColour(TEAL, 0.22))
    .fillRect(x + 7, y + 7, width - 14, 4);
  const heading = "CHECK FIRST";
  drawPixelText(
    graphics,
    heading,
    x + Math.round((width - pixelTextWidth(heading, 2)) / 2),
    y + 10,
    2,
    CREAM,
  );

  if (layout === "numbered-steps") {
    for (const [index, label] of ["PAUSE", "CHECK", "TELL"].entries()) {
      const rowY = y + 32 + index * 17;
      graphics
        .fillStyle(index === 1 ? GREEN : GOLD)
        .fillRect(x + 12, rowY - 2, 18, 14);
      drawPixelText(graphics, String(index + 1), x + 18, rowY, 2, INK);
      drawPixelText(graphics, label, x + 40, rowY, 2, INK);
    }
    return;
  }

  const centres = [x + 36, x + 95, x + 154];
  graphics
    .fillStyle(GOLD)
    .fillRect(centres[0] - 10, y + 33, 20, 20)
    .fillStyle(INK)
    .fillRect(centres[0] - 5, y + 37, 3, 12)
    .fillRect(centres[0] + 2, y + 37, 3, 12)
    .fillStyle(GREEN)
    .fillPoints(
      [
        new Phaser.Geom.Point(centres[1], y + 31),
        new Phaser.Geom.Point(centres[1] + 12, y + 36),
        new Phaser.Geom.Point(centres[1] + 8, y + 52),
        new Phaser.Geom.Point(centres[1], y + 57),
        new Phaser.Geom.Point(centres[1] - 8, y + 52),
        new Phaser.Geom.Point(centres[1] - 12, y + 36),
      ],
      true,
    )
    .fillStyle(CREAM)
    .fillRect(centres[1] - 2, y + 37, 4, 13)
    .fillRect(centres[1] - 5, y + 42, 10, 4)
    .fillStyle(CORAL)
    .fillRect(centres[2] - 13, y + 34, 18, 14)
    .fillRect(centres[2] - 2, y + 40, 18, 14)
    .fillStyle(INK)
    .fillRect(centres[2] - 9, y + 39, 10, 2)
    .fillRect(centres[2] + 2, y + 45, 10, 2);
  for (const [index, label] of ["PAUSE", "CHECK", "TELL"].entries()) {
    drawPixelText(
      graphics,
      label,
      centres[index] - Math.round(pixelTextWidth(label, 2) / 2),
      y + 62,
      2,
      INK,
    );
  }
}

interface SpawnPoint {
  x: number;
  y: number;
}

interface SceneStartData {
  locationId?: LocationId;
  fromLocationId?: LocationId;
  spawn?: SpawnPoint;
}

export interface CampaignSceneCallbacks {
  onReady: (locationId: LocationId) => void;
  onNearbyInteraction: (interaction: WorldInteraction | null) => void;
  onInteract: (interaction: WorldInteraction) => boolean | void;
  onDoorEnter?: (locationId: LocationId) => void;
  onLocationChange: (locationId: LocationId, name: string) => void;
  onStep: (surface: MovementSurface) => void;
}

export interface CampaignGameOptions {
  initialLocation: LocationId;
  state: CampaignStateV1;
  playerSpeed?: number;
  reducedMotion?: boolean;
  renderer?: "auto" | "canvas";
}

class DoorView {
  readonly definition: DoorDefinition;
  private readonly scene: Phaser.Scene;
  private readonly blocker: Phaser.GameObjects.Rectangle;
  private readonly leaves: Phaser.GameObjects.Graphics[] = [];
  private readonly controller: DoorTransitionController;

  constructor(
    scene: Phaser.Scene,
    definition: DoorDefinition,
    blocker: Phaser.GameObjects.Rectangle,
  ) {
    this.scene = scene;
    this.definition = definition;
    this.blocker = blocker;
    this.controller = new DoorTransitionController(definition.startsOpen === true);
    this.draw();
    if (definition.startsOpen) {
      this.disableBlocker();
      this.setOpenPose();
    }
  }

  open(reducedMotion: boolean, onReady: () => void): boolean {
    if (this.controller.getState() === "open") {
      if (!this.controller.beginTransition()) return false;
      onReady();
      return true;
    }
    if (!this.controller.beginOpening()) return false;
    const finish = (): void => {
      this.disableBlocker();
      this.controller.finishOpening();
      if (!this.controller.beginTransition()) return;
      onReady();
    };
    if (reducedMotion) {
      this.setOpenPose();
      finish();
      return true;
    }
    const style = this.definition.style;
    const targets = this.leaves;
    if (style === "workshop-shutter") {
      this.scene.tweens.add({ targets, scaleY: 0.08, y: `-=${this.definition.dimensions.height / 2}`, duration: 180, ease: "Sine.easeInOut", onComplete: finish });
    } else if (style === "hinged-hdb") {
      this.scene.tweens.add({ targets, scaleX: 0.12, x: `-=${this.definition.dimensions.width * 0.34}`, duration: 180, ease: "Sine.easeInOut", onComplete: finish });
    } else {
      this.scene.tweens.add({ targets, scaleX: 0.08, duration: 180, ease: "Sine.easeInOut", onComplete: finish });
    }
    return true;
  }

  getSnapshot(): { id: string; state: string; blockerEnabled: boolean } {
    const body = this.blocker.body as Phaser.Physics.Arcade.StaticBody | null;
    return {
      id: this.definition.id,
      state: this.controller.getState(),
      blockerEnabled: body?.enable ?? false,
    };
  }

  private draw(): void {
    const { anchor, dimensions, placard, style } = this.definition;
    const left = -dimensions.width / 2;
    const top = -dimensions.height;
    const depth = depthFor(anchor.y, 6);
    const frame = this.scene.add.graphics().setPosition(anchor.x, anchor.y).setDepth(depth);
    frame
      .fillStyle(NIGHT, 0.26)
      .fillRect(left + 8, top + 9, dimensions.width + 10, dimensions.height + 10)
      .fillStyle(INK)
      .fillRect(left - 6, top - 7, dimensions.width + 12, dimensions.height + 9)
      .fillStyle(CREAM)
      .fillRect(left - 1, top - 2, dimensions.width + 2, dimensions.height + 2)
      .fillStyle(NIGHT)
      .fillRect(left + 5, top + 5, dimensions.width - 10, dimensions.height - 5);
    const leafCount = style === "double-community" || style === "lift" || style === "open-hawker-gate" ? 2 : 1;
    for (let index = 0; index < leafCount; index += 1) {
      const leaf = this.scene.add.graphics().setPosition(anchor.x, anchor.y).setDepth(depth + 1);
      const gap = 3;
      const leafWidth = leafCount === 2 ? (dimensions.width - gap) / 2 : dimensions.width - 10;
      const leafX = leafCount === 2
        ? left + index * (leafWidth + gap)
        : left + 5;
      const fill = style === "workshop-shutter"
        ? CONCRETE_EDGE
        : style === "double-community"
          ? PURPLE
          : style === "open-hawker-gate"
            ? CORAL
            : TEAL;
      leaf
        .fillStyle(fill)
        .fillRect(leafX, top + 5, leafWidth, dimensions.height - 7)
        .fillStyle(lightenColour(fill, 0.2), 0.8)
        .fillRect(leafX + 5, top + 10, Math.max(3, leafWidth - 10), 6)
        .fillStyle(darkenColour(fill, 0.2), 0.65)
        .fillRect(leafX + leafWidth - 7, top + 8, 5, dimensions.height - 14);
      if (style === "workshop-shutter") {
        for (let stripe = top + 20; stripe < -5; stripe += 12) {
          leaf.fillStyle(INK, 0.35).fillRect(leafX + 3, stripe, leafWidth - 6, 3);
        }
      }
      this.leaves.push(leaf);
    }
    this.scene.add
      .text(anchor.x, anchor.y - dimensions.height - 12, placard, {
        color: "#173f4f",
        backgroundColor: "#fff6dc",
        fontFamily: "system-ui, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
        padding: { x: 5, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(depth + 2);
  }

  private setOpenPose(): void {
    const style = this.definition.style;
    for (const leaf of this.leaves) {
      if (style === "workshop-shutter") {
        leaf.setScale(1, 0.08).setY(leaf.y - this.definition.dimensions.height / 2);
      } else if (style === "hinged-hdb") {
        leaf.setScale(0.12, 1).setX(leaf.x - this.definition.dimensions.width * 0.34);
      } else {
        leaf.setScale(0.08, 1);
      }
    }
  }

  private disableBlocker(): void {
    const body = this.blocker.body as Phaser.Physics.Arcade.StaticBody | null;
    if (body) body.enable = false;
  }
}

interface MarkerView {
  glow: Phaser.GameObjects.Arc;
  ring: Phaser.GameObjects.Arc;
  badge: Phaser.GameObjects.Text;
  plate: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  approachOnly: boolean;
}

interface NpcView {
  shadow: Phaser.GameObjects.Ellipse;
  sprite: Phaser.GameObjects.Sprite;
  texture: string;
  homeX: number;
  homeY: number;
  facing: PlayerFacing;
  flipX: boolean;
  route: readonly SpawnPoint[];
  routeIndex: number;
  pauseUntil: number;
  speed: number;
  nextBlinkAt: number;
  blinkUntil: number;
  isMoving: boolean;
}

interface AmbientCatView {
  id: string;
  shadow: Phaser.GameObjects.Ellipse;
  sprite: Phaser.GameObjects.Sprite;
  texture: string;
  route: readonly SpawnPoint[];
  routeIndex: number;
  pauseUntil: number;
  speed: number;
  isMoving: boolean;
}

interface AmbientActivityView {
  id: string;
  sprite: Phaser.GameObjects.Sprite;
  texture: string;
}

interface AmbientFlutterView {
  id: string;
  sprite: Phaser.GameObjects.Sprite;
  texture: string;
  baseX: number;
  baseY: number;
  radiusX: number;
  radiusY: number;
  phaseOffset: number;
}

interface MonsoonRainView {
  streak: Phaser.GameObjects.Rectangle;
  startXRatio: number;
  startYRatio: number;
  speed: number;
  drift: number;
  worldX: number;
  worldY: number;
}

export interface CampaignNpcMotionSnapshot {
  npcId: NpcId;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  facing: PlayerFacing;
  flipX: boolean;
  isMoving: boolean;
  routeIndex: number;
  textureKey: string;
  interactionX: number | null;
  interactionY: number | null;
  markerX: number | null;
  markerY: number | null;
}

export interface CampaignAmbientMotionSnapshot {
  id: string;
  x: number;
  y: number;
  isMoving: boolean;
  textureKey: string;
}

export interface CampaignAmbientActivitySnapshot {
  id: string;
  x: number;
  y: number;
  visible: boolean;
  textureKey: string;
}

export interface CampaignAmbientFlutterSnapshot {
  id: string;
  x: number;
  y: number;
  visible: boolean;
  textureKey: string;
}

export interface CampaignTerrainDetailSnapshot {
  grassColourCount: number;
  pathColourCount: number;
  pathEdgeTransitions: number;
  landscapePropCount: number;
  landscapeTextureCount: number;
  foliageColourCount: number;
  exteriorPropCount: number;
  exteriorPropTextureCount: number;
  storyClusterCount: number;
  storyClusterTextureCount: number;
  groundAccentCount: number;
  facadeColourCount: number;
  facadeEdgeTransitions: number;
  facadeDarkPixelRatio: number;
  facadeDepthBuildingCount: number;
  facadeEntryRecessCount: number;
  facadeRoofStyleCount: number;
  bicycleRackCount: number;
  motorVehicleCount: number;
  layoutIssueCount: number;
  buildingOcclusionLayerCount: number;
}

export interface CampaignBuildingOcclusionSnapshot {
  id: string;
  alpha: number;
  faded: boolean;
}

export interface CampaignPlayerGuideSnapshot {
  x: number;
  y: number;
  tipY: number;
  visible: boolean;
  depth: number;
}

export type CampaignTapNavigationOutcome =
  | "idle"
  | "moving"
  | "interacted"
  | "arrived"
  | "cancelled"
  | "stalled";

export interface CampaignTapNavigationSnapshot {
  active: boolean;
  interactionId: string | null;
  destination: SpawnPoint | null;
  ringVisible: boolean;
  ringScreenDiameter: number;
  outcome: CampaignTapNavigationOutcome;
  cancelReason: string | null;
  controlsEnabled: boolean;
  virtualDirection: SpawnPoint;
  cameraWorldView: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface CampaignMotionSnapshot {
  locationId: LocationId;
  player: SpawnPoint;
  playerGuide: CampaignPlayerGuideSnapshot;
  playerTextureKey: string;
  playerFacing: PlayerFacing;
  playerFlipX: boolean;
  playerIdleBlinking: boolean;
  movementSurface: MovementSurface;
  activeStepSurfaces: MovementSurface[];
  cameraZoom: number;
  obstacleCount: number;
  interactionCount: number;
  flavourInteractionCount: number;
  visibleFlavourMarkerCount: number;
  visibleMarkerPlateCount: number;
  visibleStepPuffs: number;
  scamCheckCardLayout: ScamCheckCardLayout | null;
  scamCheckCardVisible: boolean;
  scamCheckCardAlpha: number | null;
  characterArt: CharacterArtAudit;
  consequenceArt: CampaignConsequenceArtSnapshot;
  nearbyInteractionId: string | null;
  nearbyInteractionPoint: SpawnPoint | null;
  tapNavigation: CampaignTapNavigationSnapshot;
  npcs: CampaignNpcMotionSnapshot[];
  ambientActors: CampaignAmbientMotionSnapshot[];
  ambientActivities: CampaignAmbientActivitySnapshot[];
  ambientActivityTick: number | null;
  visibleAmbientActivityCount: number;
  ambientFlutter: CampaignAmbientFlutterSnapshot[];
  ambientFlutterTick: number | null;
  visibleAmbientFlutterCount: number;
  laundryFrame: number | null;
  laundryTick: number | null;
  visibleLaundryCount: number | null;
  pondRippleCount: number;
  pondRipplePhase: number | null;
  monsoonActive: boolean;
  rainStreakCount: number;
  visibleRainStreakCount: number;
  rainStreaksUnderShelter: number;
  rainPhase: number | null;
  puddleRippleCount: number;
  puddleRipplePhase: number | null;
  shelterDry: boolean;
  terrainDetail: CampaignTerrainDetailSnapshot | null;
  buildingOcclusion: CampaignBuildingOcclusionSnapshot[];
  buildingOcclusionMotion: "smooth" | "instant" | null;
  doors: readonly {
    id: string;
    state: string;
    blockerEnabled: boolean;
  }[];
}

export interface CampaignNavigationSnapshot {
  locationId: LocationId;
  player: SpawnPoint;
  worldWidth: number;
  worldHeight: number;
}

interface BuildingOcclusionView {
  zone: EstateRect;
  overlay: Phaser.GameObjects.Image;
  faded: boolean;
}

const ESTATE_NPC_TEXTURES: Readonly<Partial<Record<NpcId, string>>> = {
  "aunty-mei": "npc-mei",
  "uncle-ravi": "npc-ravi",
  "mdm-siti": "npc-siti",
  "pak-yusof": "npc-yusof",
  "coach-meng": "npc-meng",
  "uncle-seng": "npc-seng",
  "auntie-minah": "npc-minah",
  "wei-ling": "npc-weiling",
};

interface TapNavigationTarget {
  destination: SpawnPoint;
  interactionId: string | null;
  progressAnchor: SpawnPoint;
  progressSince: number;
}

abstract class WalkableScene extends Phaser.Scene {
  protected readonly callbacks: CampaignSceneCallbacks;
  protected readonly getState: () => CampaignStateV1;
  protected readonly playerSpeed: number;
  protected readonly reducedMotion: boolean;
  protected locationId: LocationId;
  protected player!: Phaser.Physics.Arcade.Sprite;
  protected playerShadow!: Phaser.GameObjects.Ellipse;
  private playerGuide!: Phaser.GameObjects.Graphics;
  protected obstacles: Phaser.GameObjects.GameObject[] = [];
  protected interactions: WorldInteraction[] = [];
  protected consequences: Phaser.GameObjects.GameObject[] = [];
  protected scamCheckCard?: Phaser.GameObjects.Graphics;
  protected consequenceArt = emptyConsequenceArtSnapshot();
  protected npcViews = new Map<NpcId, NpcView>();
  private worldWidth = 1;
  private worldHeight = 1;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private movementKeys!: Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>;
  private interactKeys!: Phaser.Input.Keyboard.Key[];
  private hurryKey!: Phaser.Input.Keyboard.Key;
  private virtualDirection = new Phaser.Math.Vector2();
  private movementVector = new Phaser.Math.Vector2();
  private tapWorldPoint = new Phaser.Math.Vector2();
  private controlsEnabled = false;
  private nearbyInteraction: WorldInteraction | null = null;
  private markers = new Map<string, MarkerView>();
  private readyForInteractionAt = 0;
  private lastStepAt = 0;
  private lastStepPuffAt = Number.NEGATIVE_INFINITY;
  private lastInteractionCheckAt = Number.NEGATIVE_INFINITY;
  private playerFacing: PlayerFacing = "down";
  private playerTextureKey = "campaign-player-down-0";
  private playerIsMoving = false;
  private currentWalkFrame: WalkFrame = 0;
  private currentSurface: MovementSurface = "indoor";
  private nextPlayerBlinkAt = Number.POSITIVE_INFINITY;
  private playerBlinkUntil = Number.NEGATIVE_INFINITY;
  private tapDestinationRing!: Phaser.GameObjects.Arc;
  private tapNavigation: TapNavigationTarget | null = null;
  private tapNavigationOutcome: CampaignTapNavigationOutcome = "idle";
  private tapNavigationCancelReason: string | null = null;
  private stepPuffs: {
    dust: Phaser.GameObjects.Arc;
    fleckLeft: Phaser.GameObjects.Rectangle;
    fleckRight: Phaser.GameObjects.Rectangle;
    bornAt: number;
    originX: number;
    originY: number;
    directionX: number;
    directionY: number;
    surface: MovementSurface;
  }[] = [];
  private nextStepPuff = 0;
  protected readonly doorViews = new Map<string, DoorView>();

  protected constructor(
    key: string,
    initialLocation: LocationId,
    callbacks: CampaignSceneCallbacks,
    getState: () => CampaignStateV1,
    options: CampaignGameOptions,
  ) {
    super(key);
    this.locationId = initialLocation;
    this.callbacks = callbacks;
    this.getState = getState;
    this.playerSpeed = options.playerSpeed ?? WALK_SPEED;
    this.reducedMotion = options.reducedMotion === true;
  }

  protected setupWorld(
    width: number,
    height: number,
    spawn: SpawnPoint,
  ): void {
    this.worldWidth = width;
    this.worldHeight = height;
    this.physics.world.setBounds(0, 0, width, height);
    this.cameras.main.setBounds(0, 0, width, height);
    this.createSharedTextures();
    this.playerShadow = this.add
      .ellipse(spawn.x, spawn.y + 23, 37, 11, NIGHT, 0.3)
      .setDepth(depthFor(spawn.y, 1));
    this.player = this.physics.add
      .sprite(spawn.x, spawn.y, this.playerTextureKey)
      .setDepth(depthFor(spawn.y, 3));
    this.playerGuide = this.add
      .graphics()
      .fillStyle(NIGHT, 0.28)
      .fillTriangle(-9, -56, 15, -56, 3, -37)
      .fillStyle(INK)
      .fillTriangle(-13, -61, 13, -61, 0, -39)
      .fillStyle(CREAM)
      .fillTriangle(-9, -58, 9, -58, 0, -43)
      .fillStyle(GOLD)
      .fillTriangle(-7, -56, 7, -56, 0, -45)
      .setPosition(spawn.x, spawn.y)
      // Above every world object, but under interaction markers and nameplates
      // so the guide never sits on top of the name you are walking towards.
      .setDepth(100_050);
    this.tapDestinationRing = this.add
      .circle(spawn.x, spawn.y, 14, NIGHT, 0.18)
      .setStrokeStyle(3, GOLD, 0.96)
      .setVisible(false)
      .setDepth(100_098);
    this.player.setCollideWorldBounds(true);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(22, 18).setOffset(9, 35);
    for (const obstacle of this.obstacles) {
      this.physics.add.collider(this.player, obstacle);
    }
    this.createStepPuffPool();
    this.currentSurface = movementSurfaceAt(
      this.locationId,
      spawn.x,
      spawn.y,
    );
    this.nextPlayerBlinkAt = this.time.now + 2100;
    this.configureInput();
    this.createInteractionMarkers();
    this.cameras.main.startFollow(
      this.player,
      !this.reducedMotion,
      this.reducedMotion ? 1 : 0.18,
      this.reducedMotion ? 1 : 0.18,
    );
    if (!this.reducedMotion) {
      this.cameras.main.setDeadzone(54, 38);
      this.cameras.main.fadeIn(140, 16, 46, 59);
    }
    this.refreshCameraLayout();
    this.readyForInteractionAt = this.time.now + TRANSITION_LATCH_MS;
    this.callbacks.onLocationChange(
      this.locationId,
      LOCATION_BY_ID.get(this.locationId)?.name ?? this.locationId,
    );
    this.updateNearbyInteraction(true);
    this.callbacks.onReady(this.locationId);
  }

  update(time: number, delta: number): void {
    if (!this.player?.body) return;
    this.updateStepPuffs(time);
    this.playerShadow
      .setPosition(this.player.x, this.player.y + 23)
      .setDepth(depthFor(this.player.y, 1))
      .setScale(
        this.reducedMotion || !this.playerIsMoving
          ? 1
          : this.currentWalkFrame % 2 === 0
            ? 0.96
            : 1.04,
        1,
      );
    this.player.setDepth(depthFor(this.player.y, 3));
    const guideBob = this.reducedMotion ? 0 : Math.sin(time / 260) * 2;
    this.playerGuide.setPosition(this.player.x, this.player.y + guideBob);

    if (!this.controlsEnabled) {
      this.player.setVelocity(0, 0);
      this.playerIsMoving = false;
      return;
    }

    const keyboardX =
      Number(this.cursors.right.isDown || this.movementKeys.right.isDown)
      - Number(this.cursors.left.isDown || this.movementKeys.left.isDown);
    const keyboardY =
      Number(this.cursors.down.isDown || this.movementKeys.down.isDown)
      - Number(this.cursors.up.isDown || this.movementKeys.up.isDown);
    const manualX = keyboardX || this.virtualDirection.x;
    const manualY = keyboardY || this.virtualDirection.y;
    if ((manualX !== 0 || manualY !== 0) && this.tapNavigation) {
      this.cancelTapNavigation("manual-input");
    }
    const movement = manualX !== 0 || manualY !== 0
      ? this.movementVector.set(manualX, manualY)
      : this.updateTapNavigation(time)
        ? this.movementVector
        : this.movementVector.set(0, 0);

    if (movement.lengthSq() > 0) {
      const hurrying =
        this.hurryKey.isDown || this.playerSpeed >= HURRY_SPEED;
      const speed = hurrying
        ? Math.max(this.playerSpeed, HURRY_SPEED)
        : this.playerSpeed;
      if (!this.playerIsMoving) {
        this.playerBlinkUntil = Number.NEGATIVE_INFINITY;
        this.nextPlayerBlinkAt = time + 2100;
      }
      this.playerIsMoving = true;
      movement.normalize().scale(speed);
      this.player.setVelocity(movement.x, movement.y);
      this.setPlayerFacing(movement.x, movement.y);
      this.setPlayerWalkFrame(walkFrameAt(
        time,
        hurrying,
        this.reducedMotion,
      ));
      this.currentSurface = movementSurfaceAt(
        this.locationId,
        this.player.x,
        this.player.y,
      );
      this.emitStepPuff(
        time,
        movement.x / speed,
        movement.y / speed,
        this.currentSurface,
      );
      if (time - this.lastStepAt > stepIntervalFor(hurrying)) {
        this.lastStepAt = time;
        this.callbacks.onStep(this.currentSurface);
      }
    } else {
      this.player.setVelocity(0, 0);
      if (this.playerIsMoving) {
        this.playerIsMoving = false;
        this.nextPlayerBlinkAt = time + 1900;
      }
      this.currentSurface = movementSurfaceAt(
        this.locationId,
        this.player.x,
        this.player.y,
      );
      this.updatePlayerIdle(time);
    }

    this.updateNpcLife(time, delta);
    if (
      time >= this.readyForInteractionAt
      && this.interactKeys.some((key) => Phaser.Input.Keyboard.JustDown(key))
    ) {
      this.tryInteract();
    }
    if (time - this.lastInteractionCheckAt >= 50) {
      this.lastInteractionCheckAt = time;
      this.updateNearbyInteraction(false);
    }
  }

  setControlsEnabled(enabled: boolean): void {
    this.controlsEnabled = enabled;
    const keyboard = this.input.keyboard;
    if (keyboard) {
      const captures = [
        Phaser.Input.Keyboard.KeyCodes.UP,
        Phaser.Input.Keyboard.KeyCodes.DOWN,
        Phaser.Input.Keyboard.KeyCodes.LEFT,
        Phaser.Input.Keyboard.KeyCodes.RIGHT,
        Phaser.Input.Keyboard.KeyCodes.SPACE,
      ];
      if (enabled) keyboard.addCapture(captures);
      else keyboard.removeCapture(captures);
    }
    if (!enabled && this.player) {
      this.cancelTapNavigation("controls-disabled");
      this.player.setVelocity(0, 0);
      this.virtualDirection.set(0, 0);
      this.playerIsMoving = false;
      this.setPlayerWalkFrame(0);
      for (const [npcId, view] of this.npcViews) {
        view.isMoving = false;
        this.poseNpc(npcId, view.facing, 0, view.flipX);
      }
    }
  }

  setVirtualDirection(x: number, y: number): void {
    if ((x !== 0 || y !== 0) && this.tapNavigation) {
      this.cancelTapNavigation("virtual-input");
    }
    this.virtualDirection.set(x, y);
  }

  handleViewportTap(
    viewportX: number,
    viewportY: number,
  ): "ignored" | "moving" | "interacted" {
    if (
      !this.controlsEnabled
      || !this.player?.body
      || !Number.isFinite(viewportX)
      || !Number.isFinite(viewportY)
      || viewportX < 0
      || viewportY < 0
      || viewportX > this.scale.width
      || viewportY > this.scale.height
    ) {
      return "ignored";
    }

    this.cancelTapNavigation("redirected");
    const camera = this.cameras.main;
    camera.getWorldPoint(viewportX, viewportY, this.tapWorldPoint);
    const hitRadius = 48 / Math.max(0.01, camera.zoom);
    const hitRadiusSquared = hitRadius * hitRadius;
    let tappedInteraction: WorldInteraction | null = null;
    let tappedDistanceSquared = Number.POSITIVE_INFINITY;
    for (const interaction of this.interactions) {
      const marker = this.markers.get(interaction.id);
      const doorDefinition = this.doorViews.get(interaction.id)?.definition;
      const actorDx = this.tapWorldPoint.x
        - (doorDefinition?.anchor.x ?? interaction.x);
      const actorDy = this.tapWorldPoint.y
        - (doorDefinition?.anchor.y ?? interaction.y);
      const actorDistanceSquared = actorDx * actorDx + actorDy * actorDy;
      const markerDx = marker
        ? this.tapWorldPoint.x - marker.ring.x
        : Number.POSITIVE_INFINITY;
      const markerDy = marker
        ? this.tapWorldPoint.y - marker.ring.y
        : Number.POSITIVE_INFINITY;
      const markerDistanceSquared = marker
        ? markerDx * markerDx + markerDy * markerDy
        : Number.POSITIVE_INFINITY;
      const distanceSquared = Math.min(
        actorDistanceSquared,
        markerDistanceSquared,
      );
      if (
        distanceSquared <= hitRadiusSquared
        && distanceSquared < tappedDistanceSquared
      ) {
        tappedInteraction = interaction;
        tappedDistanceSquared = distanceSquared;
      }
    }

    if (tappedInteraction) {
      const dx = this.player.x - tappedInteraction.x;
      const dy = this.player.y - tappedInteraction.y;
      if (
        dx * dx + dy * dy < INTERACTION_DISTANCE * INTERACTION_DISTANCE
        && this.time.now >= this.readyForInteractionAt
      ) {
        this.tapNavigationOutcome = "interacted";
        this.facePlayerToward(tappedInteraction.x, tappedInteraction.y);
        this.activateInteraction(tappedInteraction);
        return "interacted";
      }
      this.beginTapNavigation(
        { x: tappedInteraction.x, y: tappedInteraction.y },
        tappedInteraction.id,
      );
      return "moving";
    }

    const destination = {
      x: Phaser.Math.Clamp(this.tapWorldPoint.x, 24, this.worldWidth - 24),
      y: Phaser.Math.Clamp(this.tapWorldPoint.y, 24, this.worldHeight - 24),
    };
    const dx = destination.x - this.player.x;
    const dy = destination.y - this.player.y;
    if (dx * dx + dy * dy <= 12 * 12) {
      this.tapNavigationOutcome = "arrived";
      return "ignored";
    }
    this.beginTapNavigation(destination, null);
    return "moving";
  }

  cancelTapNavigation(reason = "external"): void {
    if (!this.tapNavigation) return;
    this.tapNavigation = null;
    this.tapDestinationRing?.setVisible(false);
    this.tapNavigationOutcome = "cancelled";
    this.tapNavigationCancelReason = reason;
  }

  tryInteract(): void {
    if (
      this.controlsEnabled
      && this.time.now >= this.readyForInteractionAt
      && this.nearbyInteraction
    ) {
      this.facePlayerToward(
        this.nearbyInteraction.x,
        this.nearbyInteraction.y,
      );
      this.activateInteraction(this.nearbyInteraction);
    }
  }

  getPlayerPosition(): SpawnPoint {
    return { x: this.player.x, y: this.player.y };
  }

  getNavigationSnapshot(): CampaignNavigationSnapshot {
    return {
      locationId: this.locationId,
      player: this.getPlayerPosition(),
      worldWidth: this.worldWidth,
      worldHeight: this.worldHeight,
    };
  }

  getMotionSnapshot(): CampaignMotionSnapshot {
    const scamCheckCardChoice = this.getState().choices["scam-check-card"];
    const scamCheckCardLayout =
      scamCheckCardChoice === "numbered-steps"
      || scamCheckCardChoice === "icons-and-words"
        ? scamCheckCardChoice
        : null;
    return {
      locationId: this.locationId,
      player: this.getPlayerPosition(),
      playerGuide: {
        x: this.playerGuide.x,
        y: this.playerGuide.y,
        tipY: this.playerGuide.y - 39,
        visible: this.playerGuide.visible,
        depth: this.playerGuide.depth,
      },
      playerTextureKey: this.player.texture.key,
      playerFacing: this.playerFacing,
      playerFlipX: this.player.flipX,
      playerIdleBlinking: this.player.texture.key.endsWith("-blink"),
      movementSurface: this.currentSurface,
      activeStepSurfaces: this.stepPuffs
        .filter(({ dust }) => dust.visible)
        .map(({ surface }) => surface),
      cameraZoom: this.cameras.main.zoom,
      obstacleCount: this.obstacles.length,
      interactionCount: this.interactions.length,
      flavourInteractionCount: this.interactions.filter(
        (interaction) => interaction.kind === "flavour",
      ).length,
      visibleFlavourMarkerCount: [...this.markers.values()].filter(
        (marker) => marker.approachOnly && marker.ring.alpha > 0,
      ).length,
      visibleMarkerPlateCount: [...this.markers.values()].filter(
        (marker) => marker.plate.visible,
      ).length,
      visibleStepPuffs: this.stepPuffs.filter(({ dust }) => dust.visible).length,
      scamCheckCardLayout,
      scamCheckCardVisible:
        this.scamCheckCard?.active === true
        && this.scamCheckCard.visible,
      scamCheckCardAlpha: this.scamCheckCard?.alpha ?? null,
      characterArt: CHARACTER_ART_AUDIT,
      consequenceArt: { ...this.consequenceArt },
      nearbyInteractionId: this.nearbyInteraction?.id ?? null,
      nearbyInteractionPoint: this.nearbyInteraction
        ? {
            x: this.nearbyInteraction.x,
            y: this.nearbyInteraction.y,
          }
        : null,
      tapNavigation: {
        active: this.tapNavigation !== null,
        interactionId: this.tapNavigation?.interactionId ?? null,
        destination: this.tapNavigation
          ? { ...this.tapNavigation.destination }
          : null,
        ringVisible: this.tapDestinationRing?.visible ?? false,
        ringScreenDiameter:
          (this.tapDestinationRing?.displayWidth ?? 0)
          * this.cameras.main.zoom,
        outcome: this.tapNavigationOutcome,
        cancelReason: this.tapNavigationCancelReason,
        controlsEnabled: this.controlsEnabled,
        virtualDirection: {
          x: this.virtualDirection.x,
          y: this.virtualDirection.y,
        },
        cameraWorldView: {
          x: this.cameras.main.worldView.x,
          y: this.cameras.main.worldView.y,
          width: this.cameras.main.worldView.width,
          height: this.cameras.main.worldView.height,
        },
      },
      ambientActors: [],
      ambientActivities: [],
      ambientActivityTick: null,
      visibleAmbientActivityCount: 0,
      ambientFlutter: [],
      ambientFlutterTick: null,
      visibleAmbientFlutterCount: 0,
      laundryFrame: null,
      laundryTick: null,
      visibleLaundryCount: null,
      pondRippleCount: 0,
      pondRipplePhase: null,
      monsoonActive: false,
      rainStreakCount: 0,
      visibleRainStreakCount: 0,
      rainStreaksUnderShelter: 0,
      rainPhase: null,
      puddleRippleCount: 0,
      puddleRipplePhase: null,
      shelterDry: false,
      terrainDetail: null,
      buildingOcclusion: [],
      buildingOcclusionMotion: null,
      doors: [...this.doorViews.values()].map((view) => view.getSnapshot()),
      npcs: [...this.npcViews].map(([npcId, view]) => {
        const interaction = this.interactions.find(
          (candidate) => candidate.kind === "npc" && candidate.npcId === npcId,
        );
        const marker = interaction ? this.markers.get(interaction.id) : undefined;
        return {
          npcId,
          x: view.sprite.x,
          y: view.sprite.y,
          homeX: view.homeX,
          homeY: view.homeY,
          facing: view.facing,
          flipX: view.flipX,
          isMoving: view.isMoving,
          routeIndex: view.routeIndex,
          textureKey: view.sprite.texture.key,
          interactionX: interaction?.x ?? null,
          interactionY: interaction?.y ?? null,
          markerX: marker?.ring.x ?? null,
          markerY: marker?.ring.y ?? null,
        };
      }),
    };
  }

  setPlayerPosition(spawn: SpawnPoint): void {
    this.cancelTapNavigation("player-position");
    this.player?.setPosition(spawn.x, spawn.y);
    this.playerGuide?.setPosition(spawn.x, spawn.y);
    this.readyForInteractionAt = this.time.now + TRANSITION_LATCH_MS;
    this.updateNearbyInteraction(true);
  }

  resumeFromSleep(spawn: SpawnPoint): void {
    this.setPlayerPosition(spawn);
    this.refreshCampaignState();
    this.cameras.main.resetFX();
    if (!this.reducedMotion) {
      this.cameras.main.fadeIn(140, 16, 46, 59);
    }
    this.callbacks.onLocationChange(
      this.locationId,
      LOCATION_BY_ID.get(this.locationId)?.name ?? this.locationId,
    );
    this.callbacks.onReady(this.locationId);
  }

  refreshCampaignState(): void {
    this.drawConsequences();
  }

  refreshCameraLayout(width = this.scale.width, height = this.scale.height): void {
    const zoom = this.cameraZoomForViewport(width, height);
    const horizontalMargin = Math.max(
      0,
      (width / zoom - this.worldWidth) / 2,
    );
    const verticalMargin = Math.max(
      0,
      (height / zoom - this.worldHeight) / 2,
    );
    this.cameras.main
      .setViewport(0, 0, width, height)
      .setZoom(zoom)
      .setBounds(
        -horizontalMargin,
        -verticalMargin,
        this.worldWidth + horizontalMargin * 2,
        this.worldHeight + verticalMargin * 2,
      );
    this.syncTapDestinationRingScale();
  }

  protected resetWorldCollections(): void {
    this.clearConsequences();
    this.scamCheckCard?.destroy();
    this.obstacles = [];
    this.interactions = [];
    this.scamCheckCard = undefined;
    this.consequenceArt = emptyConsequenceArtSnapshot();
    this.npcViews.clear();
    this.markers.clear();
    this.doorViews.clear();
    this.nearbyInteraction = null;
    this.tapNavigation = null;
    this.tapNavigationOutcome = "idle";
    this.tapNavigationCancelReason = null;
  }

  protected abstract drawConsequences(): void;

  protected clearConsequences(): void {
    for (const object of this.consequences) object.destroy();
    this.consequences = [];
  }

  protected cameraZoomForViewport(width: number, _height: number): number {
    return width >= 760 ? 1.12 : 1;
  }

  private beginTapNavigation(
    destination: SpawnPoint,
    interactionId: string | null,
  ): void {
    this.tapNavigation = {
      destination: { ...destination },
      interactionId,
      progressAnchor: this.getPlayerPosition(),
      progressSince: this.time.now,
    };
    this.tapNavigationOutcome = "moving";
    this.tapNavigationCancelReason = null;
    this.tapDestinationRing
      .setPosition(destination.x, destination.y)
      .setVisible(true);
    this.syncTapDestinationRingScale();
  }

  private syncTapDestinationRingScale(): void {
    if (!this.tapDestinationRing) return;
    this.tapDestinationRing.setScale(
      1 / Math.max(0.01, this.cameras.main.zoom),
    );
  }

  private finishTapNavigation(
    outcome: Exclude<CampaignTapNavigationOutcome, "idle" | "moving">,
  ): void {
    this.tapNavigation = null;
    this.tapDestinationRing.setVisible(false);
    this.tapNavigationOutcome = outcome;
    this.tapNavigationCancelReason = null;
  }

  private updateTapNavigation(time: number): boolean {
    const navigation = this.tapNavigation;
    if (!navigation) return false;

    if (navigation.interactionId) {
      const interaction = this.interactions.find(
        (candidate) => candidate.id === navigation.interactionId,
      );
      if (!interaction) {
        this.finishTapNavigation("cancelled");
        return false;
      }
      navigation.destination.x = interaction.x;
      navigation.destination.y = interaction.y;
      this.tapDestinationRing.setPosition(interaction.x, interaction.y);
    }

    const progressX = this.player.x - navigation.progressAnchor.x;
    const progressY = this.player.y - navigation.progressAnchor.y;
    if (progressX * progressX + progressY * progressY >= 4 * 4) {
      navigation.progressAnchor.x = this.player.x;
      navigation.progressAnchor.y = this.player.y;
      navigation.progressSince = time;
    } else if (time - navigation.progressSince >= 650) {
      this.finishTapNavigation("stalled");
      return false;
    }

    const dx = navigation.destination.x - this.player.x;
    const dy = navigation.destination.y - this.player.y;
    const distanceSquared = dx * dx + dy * dy;
    if (navigation.interactionId) {
      if (distanceSquared < INTERACTION_DISTANCE * INTERACTION_DISTANCE) {
        if (time < this.readyForInteractionAt) return false;
        const interaction = this.interactions.find(
          (candidate) => candidate.id === navigation.interactionId,
        );
        if (!interaction) {
          this.finishTapNavigation("cancelled");
          return false;
        }
        this.finishTapNavigation("interacted");
        this.facePlayerToward(interaction.x, interaction.y);
        this.activateInteraction(interaction);
        return false;
      }
    } else if (distanceSquared <= 12 * 12) {
      this.finishTapNavigation("arrived");
      return false;
    }

    this.movementVector.set(dx, dy);
    return true;
  }

  private createStepPuffPool(): void {
    this.stepPuffs = Array.from({ length: 6 }, () => ({
      dust: this.add
        .circle(0, 0, 5, CONCRETE_EDGE, 0)
        .setVisible(false),
      fleckLeft: this.add
        .rectangle(0, 0, 2, 4, GRASS_DARK, 0)
        .setVisible(false),
      fleckRight: this.add
        .rectangle(0, 0, 2, 3, GOLD, 0)
        .setVisible(false),
      bornAt: Number.NEGATIVE_INFINITY,
      originX: 0,
      originY: 0,
      directionX: 0,
      directionY: 0,
      surface: "indoor" as MovementSurface,
    }));
    this.nextStepPuff = 0;
    this.lastStepPuffAt = Number.NEGATIVE_INFINITY;
  }

  private emitStepPuff(
    time: number,
    directionX: number,
    directionY: number,
    surface: MovementSurface,
  ): void {
    if (this.reducedMotion || time - this.lastStepPuffAt < 170) return;
    this.lastStepPuffAt = time;
    const puff = this.stepPuffs[this.nextStepPuff];
    this.nextStepPuff = (this.nextStepPuff + 1) % this.stepPuffs.length;
    puff.bornAt = time;
    puff.originX = this.player.x - directionX * 11;
    puff.originY = this.player.y + 18 - directionY * 5;
    puff.directionX = directionX;
    puff.directionY = directionY;
    puff.surface = surface;
    const dustColour =
      surface === "grass"
        ? GRASS_DARK
        : surface === "stone"
          ? CONCRETE_EDGE
          : SAND;
    const fleckLeftColour =
      surface === "grass"
        ? GREEN
        : surface === "stone"
          ? CONCRETE
          : NIGHT;
    const fleckRightColour = surface === "grass" ? GOLD : dustColour;
    const dustAlpha =
      surface === "grass" ? 0.24 : surface === "stone" ? 0.34 : 0.18;
    const depth = depthFor(this.player.y, 2);
    puff.dust
      .setPosition(puff.originX, puff.originY)
      .setDepth(depthFor(this.player.y, 2))
      .setScale(0.55)
      .setFillStyle(dustColour, 1)
      .setAlpha(dustAlpha)
      .setVisible(true);
    puff.fleckLeft
      .setPosition(puff.originX - 2, puff.originY - 1)
      .setDepth(depth)
      .setFillStyle(fleckLeftColour, 1)
      .setAngle(0)
      .setAlpha(dustAlpha)
      .setVisible(true);
    puff.fleckRight
      .setPosition(puff.originX + 3, puff.originY)
      .setDepth(depth)
      .setFillStyle(fleckRightColour, 1)
      .setAngle(0)
      .setAlpha(dustAlpha * 0.9)
      .setVisible(true);
  }

  private updateStepPuffs(time: number): void {
    for (const puff of this.stepPuffs) {
      if (!puff.dust.visible) continue;
      const phase = (time - puff.bornAt) / 360;
      if (phase >= 1 || this.reducedMotion) {
        puff.dust.setVisible(false).setAlpha(0);
        puff.fleckLeft.setVisible(false).setAlpha(0);
        puff.fleckRight.setVisible(false).setAlpha(0);
        continue;
      }
      const baseAlpha =
        puff.surface === "grass"
          ? 0.24
          : puff.surface === "stone"
            ? 0.34
            : 0.18;
      const lift = puff.surface === "grass" ? 10 : 5;
      puff.dust
        .setPosition(
          puff.originX - puff.directionX * phase * 5,
          puff.originY - phase * 2,
        )
        .setScale(0.55 + phase * 1.25)
        .setAlpha(baseAlpha * (1 - phase));
      puff.fleckLeft
        .setPosition(
          puff.originX - 2 - phase * 6 - puff.directionX * phase * 3,
          puff.originY - phase * lift,
        )
        .setAlpha(baseAlpha * (1 - phase))
        .setAngle(-phase * 35);
      puff.fleckRight
        .setPosition(
          puff.originX + 3 + phase * 6 - puff.directionX * phase * 3,
          puff.originY - phase * (lift - 1),
        )
        .setAlpha(baseAlpha * 0.9 * (1 - phase))
        .setAngle(phase * 35);
    }
  }

  protected addObstacle(
    x: number,
    y: number,
    width: number,
    height: number,
  ): Phaser.GameObjects.Rectangle {
    const obstacle = this.add.rectangle(
      x + width / 2,
      y + height / 2,
      width,
      height,
      INK,
      0,
    );
    this.physics.add.existing(obstacle, true);
    this.obstacles.push(obstacle);
    return obstacle;
  }

  protected addDoorView(definition: DoorDefinition): void {
    const blocker = this.addObstacle(
      definition.collider.x,
      definition.collider.y,
      definition.collider.width,
      definition.collider.height,
    );
    this.doorViews.set(
      definition.id,
      new DoorView(this, definition, blocker),
    );
    const isExit = definition.sourceLocationId !== "estate"
      && (
        definition.targetLocationId === "estate"
        || (definition.sourceLocationId !== "hdb-corridor"
          && definition.targetLocationId === "hdb-corridor")
      );
    this.interactions.push({
      kind: isExit ? "exit" : "door",
      id: definition.id,
      label: definition.label,
      shortLabel: isExit ? "Exit" : "Enter",
      targetLocationId: definition.targetLocationId,
      x: definition.approachPoint.x,
      y: definition.approachPoint.y,
    });
  }

  private activateInteraction(interaction: WorldInteraction): void {
    const doorView = this.doorViews.get(interaction.id);
    const authorized = this.callbacks.onInteract(interaction);
    if (!doorView || authorized === false) return;
    this.cancelTapNavigation("door-opening");
    this.setControlsEnabled(false);
    this.facePlayerToward(
      doorView.definition.anchor.x,
      doorView.definition.anchor.y,
    );
    doorView.open(this.reducedMotion, () => {
      const { anchor, orientation, targetLocationId } = doorView.definition;
      const step = 22;
      const destination = {
        x: anchor.x + (orientation === "east" ? step : orientation === "west" ? -step : 0),
        y: anchor.y + (orientation === "south" ? step : orientation === "north" ? -step : 0),
      };
      const enter = (): void => this.callbacks.onDoorEnter?.(targetLocationId);
      if (this.reducedMotion) {
        this.player.setPosition(destination.x, destination.y);
        enter();
        return;
      }
      this.tweens.add({
        targets: this.player,
        x: destination.x,
        y: destination.y,
        duration: 90,
        ease: "Sine.easeIn",
        onComplete: enter,
      });
    });
  }

  protected addNpc(
    npcId: NpcId,
    x: number,
    y: number,
    texture: string,
    route: readonly SpawnPoint[] = [],
  ): void {
    const name = NPC_BY_ID.get(npcId)?.name ?? npcId;
    const seed = [...npcId].reduce(
      (sum, character) => sum + character.charCodeAt(0),
      0,
    );
    const shadow = this.add
      .ellipse(x, y + 23, 42, 12, NIGHT, 0.27)
      .setDepth(depthFor(y, 1));
    const sprite = this.add
      .sprite(x, y, `${texture}-down-0`)
      .setDepth(depthFor(y, 3));
    this.npcViews.set(npcId, {
      shadow,
      sprite,
      texture,
      homeX: x,
      homeY: y,
      facing: "down",
      flipX: false,
      route,
      routeIndex: route.length > 1 ? 1 : 0,
      pauseUntil: 800 + seed % 1200,
      speed: 32 + seed % 11,
      nextBlinkAt: 2200 + seed % 1700,
      blinkUntil: 0,
      isMoving: false,
    });
    this.interactions.push({
      kind: "npc",
      id: `npc:${npcId}`,
      label: `Talk with ${name}`,
      shortLabel: name,
      npcId,
      x,
      y,
    });
  }

  protected moveNpcTo(npcId: NpcId, x: number, y: number): void {
    const view = this.npcViews.get(npcId);
    if (!view) return;
    view.shadow
      .setPosition(x, y + 23)
      .setDepth(depthFor(y, 1));
    view.sprite
      .setPosition(x, y)
      .setDepth(depthFor(y, 3));
    const interaction = this.interactions.find(
      (candidate) => candidate.kind === "npc" && candidate.npcId === npcId,
    );
    if (!interaction) return;
    interaction.x = x;
    interaction.y = y;
    const marker = this.markers.get(interaction.id);
    if (!marker) return;
    const markerY = y - 96;
    marker.glow.setPosition(x, markerY);
    marker.ring.setPosition(x, markerY);
    marker.badge.setPosition(x, markerY);
    marker.plate.setPosition(x, markerY + 21);
    marker.label.setPosition(x, markerY + 27);
  }

  protected restoreNpcHomes(): void {
    for (const [npcId, view] of this.npcViews) {
      this.moveNpcTo(npcId, view.homeX, view.homeY);
    }
  }

  protected poseNpc(
    npcId: NpcId,
    facing: PlayerFacing,
    frame: WalkFrame = 0,
    flipX = false,
    blinking = false,
  ): void {
    const view = this.npcViews.get(npcId);
    if (!view) return;
    const blinkSuffix = blinking && frame === 0 ? "-blink" : "";
    const key = `${view.texture}-${facing}-${frame}${blinkSuffix}`;
    if (view.sprite.texture.key !== key) view.sprite.setTexture(key);
    view.sprite.setFlipX(facing === "side" && flipX);
    view.facing = facing;
    view.flipX = facing === "side" && flipX;
  }

  private updateNpcLife(time: number, delta: number): void {
    const chapter = this.getState().currentChapter;
    const gathering = chapter === "chapter-2" || chapter === "free-explore";
    const stepDistance = Math.min(delta, 50) / 1000;
    const attentionDistanceSq = (INTERACTION_DISTANCE * 1.08) ** 2;
    for (const [npcId, view] of this.npcViews) {
      const playerDx = this.player.x - view.sprite.x;
      const playerDy = this.player.y - view.sprite.y;
      const attentive =
        playerDx * playerDx + playerDy * playerDy <= attentionDistanceSq;

      if (attentive) {
        view.isMoving = false;
        this.faceNpcTowards(npcId, playerDx, playerDy, time);
        continue;
      }

      if (
        !this.reducedMotion
        && !gathering
        && view.route.length > 1
        && time >= view.pauseUntil
      ) {
        const target = view.route[view.routeIndex];
        const dx = target.x - view.sprite.x;
        const dy = target.y - view.sprite.y;
        const distance = Math.hypot(dx, dy);
        const travel = view.speed * stepDistance;
        if (distance <= Math.max(1, travel)) {
          this.moveNpcTo(npcId, target.x, target.y);
          view.routeIndex = (view.routeIndex + 1) % view.route.length;
          const seed = [...npcId].reduce(
            (sum, character) => sum + character.charCodeAt(0),
            0,
          );
          view.pauseUntil =
            time + 1300 + (seed * (view.routeIndex + 3)) % 1700;
          view.isMoving = false;
          this.poseNpc(npcId, view.facing, 0, view.flipX);
        } else {
          this.moveNpcTo(
            npcId,
            view.sprite.x + dx / distance * travel,
            view.sprite.y + dy / distance * travel,
          );
          const facing = this.facingForVector(dx, dy);
          const flipX = facing === "side" && dx < 0;
          view.isMoving = true;
          view.blinkUntil = 0;
          if (view.nextBlinkAt <= time) view.nextBlinkAt = time + 900;
          this.poseNpc(
            npcId,
            facing,
            Math.floor(time / 150) % 4 as WalkFrame,
            flipX,
          );
        }
        continue;
      }

      view.isMoving = false;
      this.updateNpcBlink(npcId, view, time);
    }
  }

  private faceNpcTowards(
    npcId: NpcId,
    dx: number,
    dy: number,
    time: number,
  ): void {
    const view = this.npcViews.get(npcId);
    if (!view) return;
    const facing = this.facingForVector(dx, dy);
    const flipX = facing === "side" && dx < 0;
    view.facing = facing;
    view.flipX = flipX;
    this.updateNpcBlink(npcId, view, time);
  }

  private updateNpcBlink(npcId: NpcId, view: NpcView, time: number): void {
    if (this.reducedMotion) {
      this.poseNpc(npcId, view.facing, 0, view.flipX);
      return;
    }
    if (view.blinkUntil === 0 && time >= view.nextBlinkAt) {
      view.blinkUntil = time + 120;
    }
    if (view.blinkUntil > 0 && time >= view.blinkUntil) {
      const seed = [...npcId].reduce(
        (sum, character) => sum + character.charCodeAt(0),
        0,
      );
      view.blinkUntil = 0;
      view.nextBlinkAt = time + 2300 + seed % 1800;
    }
    this.poseNpc(
      npcId,
      view.facing,
      0,
      view.flipX,
      view.blinkUntil > time,
    );
  }

  private facingForVector(x: number, y: number): PlayerFacing {
    if (Math.abs(x) > Math.abs(y)) return "side";
    return y < 0 ? "up" : "down";
  }

  protected addRoomPlant(x: number, y: number): void {
    this.add.sprite(x, y - 32, "prop-planter").setDepth(depthFor(y, 1));
  }

  private configureInput(): void {
    if (!this.input.keyboard) throw new Error("Keyboard input is unavailable.");
    this.cursors = this.input.keyboard.createCursorKeys();
    this.movementKeys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>;
    this.interactKeys = [
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    ];
    this.hurryKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SHIFT,
      false,
    );
  }

  private createInteractionMarkers(): void {
    for (const interaction of this.interactions) {
      const approachOnly = interaction.kind === "flavour";
      const markerY = interaction.y - (interaction.kind === "npc" ? 96 : 70);
      const glow = this.add
        .circle(interaction.x, markerY, 24, GOLD, 0.2)
        .setVisible(false)
        .setDepth(100_099);
      const ring = this.add
        .circle(interaction.x, markerY, 15, GOLD, 0.96)
        .setStrokeStyle(3, INK)
        .setScale(0.75)
        .setAlpha(approachOnly ? 0 : 0.56)
        .setDepth(100_100);
      const badge = this.add
        .text(
          interaction.x,
          markerY,
          interaction.kind === "door" || interaction.kind === "exit" ? "↥" : "!",
          {
            color: "#173f4f",
            fontFamily: "Georgia, serif",
            fontSize: "17px",
            fontStyle: "bold",
          },
        )
        .setOrigin(0.5)
        .setAlpha(approachOnly ? 0 : 0.65)
        .setDepth(100_101);
      const label = this.add
        .text(interaction.x, markerY + 27, interaction.shortLabel, {
          color: "#173f4f",
          fontFamily: "system-ui, sans-serif",
          fontSize: "15px",
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0)
        .setVisible(false)
        .setDepth(100_102);
      // Drawn with Graphics rather than a nine-slice: NineSlice is WebGL-only
      // and this build falls back to Canvas2D on machines without GPU access,
      // where the plate would silently disappear behind the name.
      const plateWidth = label.width + 24;
      const plateHeight = label.height + 12;
      const plate = this.add
        .graphics()
        .fillStyle(NIGHT, 0.28)
        .fillRoundedRect(-plateWidth / 2 + 2, 4, plateWidth, plateHeight, 9)
        .fillStyle(INK, 1)
        .fillRoundedRect(-plateWidth / 2, 0, plateWidth, plateHeight, 9)
        .fillStyle(GOLD, 1)
        .fillRoundedRect(
          -plateWidth / 2 + 3,
          3,
          plateWidth - 6,
          plateHeight - 5,
          7,
        )
        .fillStyle(CREAM, 1)
        .fillRoundedRect(
          -plateWidth / 2 + 3,
          3,
          plateWidth - 6,
          plateHeight - 9,
          7,
        )
        .setPosition(interaction.x, markerY + 21)
        .setVisible(false)
        .setDepth(100_101);
      this.markers.set(interaction.id, {
        glow,
        ring,
        badge,
        plate,
        label,
        approachOnly,
      });
    }
  }

  private updateNearbyInteraction(force: boolean): void {
    let nearest: WorldInteraction | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const interaction of this.interactions) {
      const dx = this.player.x - interaction.x;
      const dy = this.player.y - interaction.y;
      const distance = dx * dx + dy * dy;
      if (
        distance < INTERACTION_DISTANCE * INTERACTION_DISTANCE
        && distance < nearestDistance
      ) {
        nearest = interaction;
        nearestDistance = distance;
      }
    }
    if (!force && nearest?.id === this.nearbyInteraction?.id) return;
    this.nearbyInteraction = nearest;
    this.callbacks.onNearbyInteraction(nearest);
    for (const [id, marker] of this.markers) {
      const active = id === nearest?.id;
      const inactiveRingAlpha = marker.approachOnly ? 0 : 0.56;
      const inactiveBadgeAlpha = marker.approachOnly ? 0 : 0.65;
      marker.glow.setVisible(active);
      marker.ring
        .setScale(active ? 1.12 : 0.75)
        .setAlpha(active ? 1 : inactiveRingAlpha);
      marker.badge.setAlpha(active ? 1 : inactiveBadgeAlpha);
      marker.plate.setVisible(active);
      marker.label.setVisible(active);
    }
  }

  private createSharedTextures(): void {
    ensureCampaignArtTextures(this);
  }

  private setPlayerFacing(x: number, y: number): void {
    if (Math.abs(x) > Math.abs(y)) {
      this.playerFacing = "side";
      this.player.setFlipX(x < 0);
    } else {
      this.playerFacing = y < 0 ? "up" : "down";
      this.player.setFlipX(false);
    }
  }

  private facePlayerToward(x: number, y: number): void {
    const deltaX = x - this.player.x;
    const deltaY = y - this.player.y;
    if (Math.abs(deltaX) + Math.abs(deltaY) < 1) return;
    this.setPlayerFacing(deltaX, deltaY);
    this.setPlayerWalkFrame(0);
  }

  private updatePlayerIdle(time: number): void {
    if (this.reducedMotion) {
      this.setPlayerWalkFrame(0);
      return;
    }
    if (time >= this.nextPlayerBlinkAt) {
      this.playerBlinkUntil = time + 130;
      this.nextPlayerBlinkAt =
        time + 2800 + (this.locationId.length % 4) * 220;
    }
    this.setPlayerWalkFrame(0, time < this.playerBlinkUntil);
  }

  private setPlayerWalkFrame(
    frame: WalkFrame,
    blinking = false,
  ): void {
    const key =
      `campaign-player-${this.playerFacing}-${frame}${blinking ? "-blink" : ""}`;
    if (key === this.playerTextureKey) return;
    this.currentWalkFrame = frame;
    this.playerTextureKey = key;
    this.player.setTexture(key);
  }
}

const ESTATE_AMBIENT_CATS: readonly {
  id: string;
  texture: string;
  route: readonly SpawnPoint[];
  speed: number;
  pauseOffset: number;
}[] = [
  {
    id: "ginger-cat",
    texture: "ambient-cat-ginger",
    route: [
      { x: 820, y: 505 },
      { x: 885, y: 480 },
      { x: 935, y: 510 },
      { x: 875, y: 548 },
      { x: 805, y: 532 },
    ],
    speed: 28,
    pauseOffset: 240,
  },
  {
    id: "tabby-cat",
    texture: "ambient-cat-tabby",
    route: [
      { x: 1510, y: 625 },
      { x: 1585, y: 600 },
      { x: 1655, y: 630 },
      { x: 1590, y: 670 },
      { x: 1525, y: 662 },
    ],
    speed: 31,
    pauseOffset: 680,
  },
];

const ESTATE_AMBIENT_ACTIVITIES: readonly {
  id: string;
  texture: string;
  x: number;
  y: number;
}[] = [
  {
    id: "void-deck-sweeper",
    texture: "ambient-task-sweeper",
    x: 515,
    y: 309,
  },
  {
    id: "noticeboard-neighbours",
    texture: "ambient-task-noticeboard",
    x: 1010,
    y: 326,
  },
  {
    id: "garden-steward",
    texture: "ambient-task-gardener",
    x: 1195,
    y: 805,
  },
  {
    id: "kopitiam-regulars",
    texture: "ambient-task-kopitiam",
    x: 1510,
    y: 610,
  },
];

const ESTATE_AMBIENT_FLUTTER: readonly {
  id: string;
  texture: string;
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  phaseOffset: number;
}[] = [
  {
    id: "pond-dragonfly",
    texture: "ambient-flutter-dragonfly",
    x: 230,
    y: 620,
    radiusX: 24,
    radiusY: 12,
    phaseOffset: 0,
  },
  {
    id: "garden-butterfly",
    texture: "ambient-flutter-butterfly-gold",
    x: 1130,
    y: 705,
    radiusX: 30,
    radiusY: 17,
    phaseOffset: 420,
  },
  {
    id: "central-butterfly",
    texture: "ambient-flutter-butterfly-blue",
    x: 990,
    y: 900,
    radiusX: 25,
    radiusY: 14,
    phaseOffset: 880,
  },
  {
    id: "kopitiam-butterfly",
    texture: "ambient-flutter-butterfly-gold",
    x: 1710,
    y: 720,
    radiusX: 28,
    radiusY: 16,
    phaseOffset: 1260,
  },
  {
    id: "east-butterfly",
    texture: "ambient-flutter-butterfly-blue",
    x: 2260,
    y: 670,
    radiusX: 31,
    radiusY: 18,
    phaseOffset: 1710,
  },
  {
    id: "south-dragonfly",
    texture: "ambient-flutter-dragonfly",
    x: 620,
    y: 1060,
    radiusX: 27,
    radiusY: 13,
    phaseOffset: 2190,
  },
  {
    id: "southwest-butterfly",
    texture: "ambient-flutter-butterfly-gold",
    x: 430,
    y: 1380,
    radiusX: 24,
    radiusY: 15,
    phaseOffset: 2660,
  },
  {
    id: "community-butterfly",
    texture: "ambient-flutter-butterfly-blue",
    x: 1810,
    y: 1080,
    radiusX: 26,
    radiusY: 15,
    phaseOffset: 3140,
  },
];

const ESTATE_LAUNDRY: readonly [number, number, 0 | 1][] = [
  [205, 210, 0],
  [390, 207, 1],
  [565, 211, 0],
  [740, 208, 1],
  [1450, 260, 0],
  [1770, 260, 1],
  [2180, 265, 0],
];

const LANDSCAPE_TEXTURE_KEYS = [
  "landscape-shrub",
  "landscape-flower-bed",
  "landscape-pandan",
  "landscape-hedge",
] as const;

type LandscapeTextureKey = (typeof LANDSCAPE_TEXTURE_KEYS)[number];

const ESTATE_LANDSCAPING: readonly [
  LandscapeTextureKey,
  number,
  number,
  number,
  number,
][] = [
  ["landscape-flower-bed", 105, 320, 88, 14],
  ["landscape-hedge", 285, 320, 112, 16],
  ["landscape-shrub", 480, 320, 56, 14],
  ["landscape-pandan", 945, 320, 42, 14],
  ["landscape-hedge", 1120, 320, 112, 16],
  ["landscape-flower-bed", 1370, 320, 88, 14],
  ["landscape-shrub", 1520, 320, 56, 14],
  ["landscape-shrub", 2050, 320, 56, 14],
  ["landscape-hedge", 2440, 320, 112, 16],
  ["landscape-hedge", 110, 485, 112, 16],
  ["landscape-pandan", 260, 485, 42, 14],
  ["landscape-flower-bed", 1080, 485, 88, 14],
  ["landscape-pandan", 1230, 485, 42, 14],
  ["landscape-flower-bed", 1370, 485, 88, 14],
  ["landscape-hedge", 1770, 485, 112, 16],
  ["landscape-flower-bed", 2090, 485, 88, 14],
  ["landscape-pandan", 2440, 485, 42, 14],
  ["landscape-shrub", 510, 650, 56, 14],
  ["landscape-hedge", 780, 820, 112, 16],
  ["landscape-pandan", 510, 930, 42, 14],
  ["landscape-flower-bed", 780, 1010, 88, 14],
  ["landscape-shrub", 1785, 650, 56, 14],
  ["landscape-flower-bed", 2060, 720, 88, 14],
  ["landscape-pandan", 1780, 900, 42, 14],
  ["landscape-hedge", 2060, 850, 112, 16],
  ["landscape-flower-bed", 105, 1120, 88, 14],
  ["landscape-shrub", 285, 1120, 56, 14],
  ["landscape-shrub", 1240, 1120, 56, 14],
  ["landscape-flower-bed", 1370, 1120, 88, 14],
  ["landscape-hedge", 1620, 1120, 112, 16],
  ["landscape-hedge", 2460, 1165, 112, 16],
  ["landscape-hedge", 120, 1285, 112, 16],
  ["landscape-flower-bed", 510, 1285, 88, 14],
  ["landscape-pandan", 820, 1285, 42, 14],
  ["landscape-shrub", 1090, 1285, 56, 14],
  ["landscape-shrub", 180, 1525, 56, 14],
  ["landscape-flower-bed", 420, 1525, 88, 14],
  ["landscape-hedge", 800, 1525, 112, 16],
  ["landscape-pandan", 1100, 1525, 42, 14],
  ["landscape-flower-bed", 1290, 1525, 88, 14],
  ["landscape-hedge", 2480, 1525, 112, 16],
];

const STORY_CLUSTER_TEXTURE_KEYS = [
  "prop-chess-table",
  "prop-bike-planters",
  "prop-maintenance-trolley",
  "prop-utility-service",
  "prop-chair-stack",
  "prop-shaded-seating",
] as const;

type StoryClusterTextureKey = (typeof STORY_CLUSTER_TEXTURE_KEYS)[number];

const ESTATE_STORY_CLUSTERS: readonly [
  StoryClusterTextureKey,
  number,
  number,
  number,
  number,
][] = [
  ["prop-chess-table", 390, 885, 130, 20],
  ["prop-chess-table", 1580, 840, 130, 20],
  ["prop-bike-planters", 850, 880, 165, 22],
  ["prop-bike-planters", 2220, 760, 165, 22],
  ["prop-maintenance-trolley", 900, 520, 88, 18],
  ["prop-maintenance-trolley", 2460, 820, 88, 18],
  ["prop-utility-service", 1160, 520, 125, 18],
  ["prop-utility-service", 1150, 1060, 125, 18],
  ["prop-chair-stack", 530, 325, 105, 18],
  ["prop-chair-stack", 1580, 325, 105, 18],
  ["prop-shaded-seating", 350, 1450, 190, 24],
  ["prop-shaded-seating", 1640, 1540, 190, 24],
];

const ESTATE_DRAIN_GRATES: readonly [
  number,
  number,
  "horizontal" | "vertical",
][] = [
  [90, 350, "horizontal"],
  [340, 432, "horizontal"],
  [880, 350, "horizontal"],
  [1120, 432, "horizontal"],
  [1390, 350, "horizontal"],
  [1660, 432, "horizontal"],
  [2110, 350, "horizontal"],
  [2390, 432, "horizontal"],
  [110, 1150, "horizontal"],
  [390, 1235, "horizontal"],
  [810, 1150, "horizontal"],
  [1080, 1235, "horizontal"],
  [1500, 1150, "horizontal"],
  [1760, 1235, "horizontal"],
  [2190, 1150, "horizontal"],
  [2470, 1235, "horizontal"],
  [575, 560, "vertical"],
  [709, 790, "vertical"],
  [575, 1010, "vertical"],
  [709, 1370, "vertical"],
  [575, 1510, "vertical"],
  [1855, 550, "vertical"],
  [1989, 790, "vertical"],
  [1855, 1020, "vertical"],
  [1989, 1270, "vertical"],
  [1855, 1490, "vertical"],
];

const ESTATE_LEAF_PATCHES: readonly [
  number,
  number,
  0 | 1 | 2,
][] = [
  [330, 525, 0],
  [270, 555, 1],
  [1015, 540, 2],
  [945, 565, 0],
  [1490, 560, 1],
  [1420, 590, 2],
  [1990, 600, 0],
  [1925, 625, 1],
  [2410, 660, 2],
  [2350, 690, 0],
  [310, 1115, 1],
  [250, 1140, 2],
  [910, 1160, 0],
  [850, 1185, 1],
  [1530, 1120, 2],
  [1460, 1145, 0],
  [2380, 1190, 1],
  [2315, 1215, 2],
  [1380, 945, 0],
  [1315, 970, 1],
  [550, 1485, 2],
  [490, 1510, 0],
  [775, 845, 1],
  [890, 955, 2],
  [1260, 845, 0],
  [1700, 930, 1],
  [2110, 805, 2],
  [2260, 980, 0],
];

const ESTATE_POND_COLLISIONS: readonly [
  number,
  number,
  number,
  number,
][] = [
  [58, 660, 224, 70],
  [88, 730, 164, 24],
];

export class EstateScene extends WalkableScene {
  private eveningLight?: Phaser.GameObjects.Rectangle;
  private ambientCats: AmbientCatView[] = [];
  private ambientActivities: AmbientActivityView[] = [];
  private ambientFlutter: AmbientFlutterView[] = [];
  private laundrySprites: Phaser.GameObjects.Sprite[] = [];
  private landscapeSprites: Phaser.GameObjects.Sprite[] = [];
  private exteriorPropSprites: Phaser.GameObjects.Sprite[] = [];
  private storyClusterSprites: Phaser.GameObjects.Sprite[] = [];
  private monsoonTint?: Phaser.GameObjects.Rectangle;
  private monsoonHaze?: Phaser.GameObjects.Rectangle;
  private monsoonSurface?: Phaser.GameObjects.Graphics;
  private baseShelterGlow?: Phaser.GameObjects.Rectangle;
  private restoredShelterGlow?: Phaser.GameObjects.Rectangle;
  private rainStreaks: MonsoonRainView[] = [];
  private puddleRipples: {
    circle: Phaser.GameObjects.Arc;
    offset: number;
  }[] = [];
  private pondRipples: {
    circle: Phaser.GameObjects.Arc;
    offset: number;
  }[] = [];
  private terrainDetailSnapshot?: CampaignTerrainDetailSnapshot;
  private ambientActivityFrame: 0 | 1 = 0;
  private ambientActivityTick = 0;
  private ambientFlutterTick = 0;
  private laundryFrame: 0 | 1 = 0;
  private laundryTick = 0;
  private pondRipplePhase = 0;
  private monsoonActive = false;
  private monsoonShelterRestored = false;
  private currentShelterChoice: ShelterChoice | null = null;
  private rainPhase = 0;
  private puddleRipplePhase = 0;
  private residentArrangement: "routes" | "monsoon" | "gathering" = "routes";
  private buildingOcclusionViews: BuildingOcclusionView[] = [];
  private shelterSprites: Phaser.GameObjects.Image[] = [];
  private shelterColliderIds = new Set<string>();

  constructor(
    callbacks: CampaignSceneCallbacks,
    getState: () => CampaignStateV1,
    options: CampaignGameOptions,
  ) {
    super("estate", "estate", callbacks, getState, options);
  }

  protected cameraZoomForViewport(width: number): number {
    if (width >= 1180) return 1.32;
    if (width >= 760) return 1.22;
    return 1;
  }

  create(data: SceneStartData = {}): void {
    this.locationId = "estate";
    this.cameras.main.setBackgroundColor("#9fc079");
    ensureCampaignArtTextures(this);
    this.createBakedExteriorTiles();
    this.createBuildingOcclusionLayers();
    for (const zone of ESTATE_BUILDING_COLLISION_ZONES) {
      this.addObstacle(zone.x, zone.y, zone.width, zone.height);
    }
    for (const [x, y, width, height] of ESTATE_POND_COLLISIONS) {
      this.addObstacle(x, y, width, height);
    }
    this.refreshShelterViews(this.getState());
    this.drawExteriorDepthProps();
    this.createAmbientLife();
    for (const route of LAYOUT_NPC_ROUTES) {
      const texture = ESTATE_NPC_TEXTURES[route.npcId];
      if (!texture) continue;
      this.addNpc(
        route.npcId,
        route.home.x,
        route.home.y,
        texture,
        route.points,
      );
    }
    for (const definition of getDoorsForLocation("estate")) {
      this.addDoorView(definition);
    }
    for (const detail of ESTATE_FLAVOUR_INTERACTIONS) {
      this.interactions.push({
        kind: "flavour",
        ...detail,
      });
    }
    this.setupWorld(
      ESTATE_WIDTH,
      ESTATE_HEIGHT,
      data.spawn ?? { x: 700, y: 400 },
    );
    this.updateBuildingOcclusion();
    this.drawConsequences();
  }

  update(time: number, delta: number): void {
    super.update(time, delta);
    this.updateBuildingOcclusion();
    this.updateAmbientLife(time, delta);
  }

  getMotionSnapshot(): CampaignMotionSnapshot {
    return {
      ...super.getMotionSnapshot(),
      ambientActors: this.ambientCats.map((cat) => ({
        id: cat.id,
        x: cat.sprite.x,
        y: cat.sprite.y,
        isMoving: cat.isMoving,
        textureKey: cat.sprite.texture.key,
      })),
      ambientActivities: this.ambientActivities.map((activity) => ({
        id: activity.id,
        x: activity.sprite.x,
        y: activity.sprite.y,
        visible: activity.sprite.visible,
        textureKey: activity.sprite.texture.key,
      })),
      ambientActivityTick: this.ambientActivityTick,
      visibleAmbientActivityCount: this.ambientActivities.filter(
        (activity) => activity.sprite.visible,
      ).length,
      ambientFlutter: this.ambientFlutter.map((flutter) => ({
        id: flutter.id,
        x: flutter.sprite.x,
        y: flutter.sprite.y,
        visible: flutter.sprite.visible,
        textureKey: flutter.sprite.texture.key,
      })),
      ambientFlutterTick: this.ambientFlutterTick,
      visibleAmbientFlutterCount: this.ambientFlutter.filter(
        (flutter) => flutter.sprite.visible,
      ).length,
      laundryFrame: this.laundryFrame,
      laundryTick: this.laundryTick,
      visibleLaundryCount: this.laundrySprites.filter(
        (laundry) => laundry.visible,
      ).length,
      pondRippleCount: this.pondRipples.length,
      pondRipplePhase: this.pondRipplePhase,
      monsoonActive: this.monsoonActive,
      rainStreakCount: this.rainStreaks.length,
      visibleRainStreakCount: this.rainStreaks.filter(
        ({ streak }) => streak.visible,
      ).length,
      rainStreaksUnderShelter: this.rainStreaks.filter(
        ({ streak, worldX, worldY }) =>
          streak.visible && this.isUnderDryShelter(worldX, worldY),
      ).length,
      rainPhase: this.rainPhase,
      puddleRippleCount: this.puddleRipples.length,
      puddleRipplePhase: this.puddleRipplePhase,
      shelterDry: this.monsoonShelterRestored,
      terrainDetail: this.measureTerrainDetail(),
      buildingOcclusion: this.buildingOcclusionViews.map((view) => ({
        id: view.zone.id,
        alpha: view.overlay.alpha,
        faded: view.faded,
      })),
      buildingOcclusionMotion: this.reducedMotion ? "instant" : "smooth",
    };
  }

  private measureTerrainDetail(): CampaignTerrainDetailSnapshot {
    if (this.terrainDetailSnapshot) return this.terrainDetailSnapshot;
    const canvas = this.textures
      .get("estate-nw")
      .getSourceImage() as HTMLCanvasElement;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      return {
        grassColourCount: 0,
        pathColourCount: 0,
        pathEdgeTransitions: 0,
        landscapePropCount: 0,
        landscapeTextureCount: 0,
        foliageColourCount: 0,
        exteriorPropCount: 0,
        exteriorPropTextureCount: 0,
        storyClusterCount: 0,
        storyClusterTextureCount: 0,
        groundAccentCount: 0,
        facadeColourCount: 0,
        facadeEdgeTransitions: 0,
        facadeDarkPixelRatio: 0,
        facadeDepthBuildingCount: 0,
        facadeEntryRecessCount: 0,
        facadeRoofStyleCount: 0,
        bicycleRackCount: 0,
        motorVehicleCount: 0,
        layoutIssueCount: 0,
        buildingOcclusionLayerCount: 0,
      };
    }
    const countColours = (
      x: number,
      y: number,
      width: number,
      height: number,
      stride: number,
    ): number => {
      const pixels = context.getImageData(x, y, width, height);
      const colours = new Set<number>();
      for (let sampleY = 0; sampleY < height; sampleY += stride) {
        for (let sampleX = 0; sampleX < width; sampleX += stride) {
          const offset = (sampleY * width + sampleX) * 4;
          if (pixels.data[offset + 3] === 0) continue;
          colours.add(
            (pixels.data[offset] << 16) |
              (pixels.data[offset + 1] << 8) |
              pixels.data[offset + 2],
          );
        }
      }
      return colours.size;
    };
    let pathEdgeTransitions = 0;
    let previousColour = -1;
    const pathLine = context.getImageData(0, 365, 1280, 1).data;
    for (let x = 0; x < 1280; x += 1) {
      const offset = x * 4;
      const colour =
        (pathLine[offset] << 16) |
        (pathLine[offset + 1] << 8) |
        pathLine[offset + 2];
      if (previousColour >= 0 && colour !== previousColour) {
        pathEdgeTransitions += 1;
      }
      previousColour = colour;
    }
    const foliageColours = new Set<number>();
    let landscapeTextureCount = 0;
    for (const key of LANDSCAPE_TEXTURE_KEYS) {
      if (!this.textures.exists(key)) continue;
      landscapeTextureCount += 1;
      const source = this.textures
        .get(key)
        .getSourceImage() as HTMLCanvasElement;
      const foliageContext = source.getContext("2d", {
        willReadFrequently: true,
      });
      if (!foliageContext) continue;
      const pixels = foliageContext.getImageData(
        0,
        0,
        source.width,
        source.height,
      ).data;
      for (let offset = 0; offset < pixels.length; offset += 16) {
        if (pixels[offset + 3] < 96) continue;
        foliageColours.add(
          (pixels[offset] << 16) |
            (pixels[offset + 1] << 8) |
            pixels[offset + 2],
        );
      }
    }
    const facadeColours = new Set<number>();
    let facadeEdgeTransitions = 0;
    let facadeDarkPixels = 0;
    let facadeOpaquePixels = 0;
    for (const building of ESTATE_BUILDINGS) {
      const textureKey = `building-view:${building.id}`;
      if (!this.textures.exists(textureKey)) continue;
      const facadeCanvas = this.textures
        .get(textureKey)
        .getSourceImage() as HTMLCanvasElement;
      const facadeContext = facadeCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      if (!facadeContext) continue;
      const facadeRegion = facadeContext.getImageData(
        0,
        0,
        facadeCanvas.width,
        facadeCanvas.height,
      );
      for (let offset = 0; offset < facadeRegion.data.length; offset += 4) {
        if (facadeRegion.data[offset + 3] === 0) continue;
        const red = facadeRegion.data[offset];
        const green = facadeRegion.data[offset + 1];
        const blue = facadeRegion.data[offset + 2];
        facadeColours.add((red << 16) | (green << 8) | blue);
        facadeOpaquePixels += 1;
        if (red * 0.2126 + green * 0.7152 + blue * 0.0722 < 85) {
          facadeDarkPixels += 1;
        }
      }
      const scanRows = [
        building.roofDepth,
        building.roofDepth + 18,
        Math.floor(facadeCanvas.height * 0.5),
        facadeCanvas.height - 40,
        facadeCanvas.height - 14,
      ].filter((y) => y >= 0 && y < facadeCanvas.height);
      for (const y of scanRows) {
        const line = facadeContext.getImageData(
          0,
          y,
          facadeCanvas.width,
          1,
        ).data;
        let previous = -1;
        for (let x = 0; x < facadeCanvas.width; x += 1) {
          const offset = x * 4;
          const colour =
            (line[offset] << 16) |
            (line[offset + 1] << 8) |
            line[offset + 2];
          if (previous >= 0 && colour !== previous) {
            facadeEdgeTransitions += 1;
          }
          previous = colour;
        }
      }
    }
    const detail = {
      grassColourCount: countColours(900, 40, 300, 160, 4),
      pathColourCount: countColours(0, 342, 1280, 96, 4),
      pathEdgeTransitions,
      landscapePropCount: this.landscapeSprites.length,
      landscapeTextureCount,
      foliageColourCount: foliageColours.size,
      exteriorPropCount: this.exteriorPropSprites.length,
      exteriorPropTextureCount: new Set(
        this.exteriorPropSprites.map((sprite) => sprite.texture.key),
      ).size,
      storyClusterCount: this.storyClusterSprites.length,
      storyClusterTextureCount: new Set(
        this.storyClusterSprites.map((sprite) => sprite.texture.key),
      ).size,
      groundAccentCount:
        ESTATE_DRAIN_GRATES.length + ESTATE_LEAF_PATCHES.length,
      facadeColourCount: facadeColours.size,
      facadeEdgeTransitions,
      facadeDarkPixelRatio:
        facadeOpaquePixels === 0 ? 0 : facadeDarkPixels / facadeOpaquePixels,
      facadeDepthBuildingCount: ESTATE_FACADE_DEPTH_DEFINITIONS.length,
      facadeEntryRecessCount: ESTATE_ENTRANCES.filter((entrance) =>
        ESTATE_FACADE_DEPTH_DEFINITIONS.some(
          (definition) => definition.buildingId === entrance.buildingId,
        ),
      ).length,
      facadeRoofStyleCount: new Set(
        ESTATE_FACADE_DEPTH_DEFINITIONS.map(
          (definition) => definition.roofStyle,
        ),
      ).size,
      bicycleRackCount: ESTATE_BICYCLE_RACKS.length,
      motorVehicleCount: ESTATE_VEHICLE_ROUTES.length,
      layoutIssueCount: auditEstateLayout().length,
      buildingOcclusionLayerCount: this.buildingOcclusionViews.length,
    };
    this.terrainDetailSnapshot = detail;
    return detail;
  }

  protected drawConsequences(): void {
    this.clearConsequences();
    this.scamCheckCard?.destroy();
    this.scamCheckCard = undefined;
    this.consequenceArt = emptyConsequenceArtSnapshot();
    const state = this.getState();
    this.refreshShelterViews(state);
    const objects: Phaser.GameObjects.GameObject[] = [];
    const windowXs = [142, 234, 326, 418, 510, 602, 694, 786];
    const litWindowCount = Math.min(
      windowXs.length,
      state.completedChapters.length * 2,
    );
    for (let index = 0; index < litWindowCount; index += 1) {
      const x = windowXs[index];
      objects.push(
        this.add
          .rectangle(x, 141, 38, 35, GOLD)
          .setDepth(depthFor(300, 5)),
        this.add
          .rectangle(x - 8, 137, 11, 27, CREAM, 0.68)
          .setDepth(depthFor(300, 6)),
      );
    }

    if (state.objectives.includes("ramp-built")) {
      objects.push(...drawExteriorRamp(this));
      this.consequenceArt.exteriorRamp = CONSEQUENCE_ART_IDS.exteriorRamp;
    }

    if (state.completedQuests.includes("garden-request")) {
      const choice = state.choices["request:garden-request"];
      if (choice === "herbs") {
        objects.push(...drawHerbGarden(this));
        this.consequenceArt.garden = CONSEQUENCE_ART_IDS.gardenHerbs;
      } else {
        objects.push(...drawFlowerSeatGarden(this));
        this.consequenceArt.garden = CONSEQUENCE_ART_IDS.gardenFlowersSeat;
      }
    }

    if (state.completedQuests.includes("sheltered-route-request")) {
      this.consequenceArt.shelteredRoute = CONSEQUENCE_ART_IDS.shelteredRoute;
    }

    const scamCheckCardLayout = state.choices["scam-check-card"];
    if (
      scamCheckCardLayout === "numbered-steps"
      || scamCheckCardLayout === "icons-and-words"
    ) {
      this.scamCheckCard = this.add
        .graphics()
        .setName(`scam-check-card:${scamCheckCardLayout}`)
        .setDepth(depthFor(280, 9));
      drawScamCheckCard(this.scamCheckCard, scamCheckCardLayout);
      const provisionOcclusion = this.buildingOcclusionViews.find(
        (view) => view.zone.id === "provision-shop",
      );
      this.scamCheckCard.setAlpha(provisionOcclusion?.overlay.alpha ?? 1);
    }

    if (state.objectives.includes("cooking-lesson-staged")) {
      objects.push(
        this.add
          .text(1390, 390, "GRANDMA ROS'S TABLE — EVERY CHAIR HAS A JOB", {
            color: "#fff6dc",
            backgroundColor: "#ad493dee",
            fontFamily: "system-ui, sans-serif",
            fontSize: "16px",
            fontStyle: "bold",
            padding: { x: 10, y: 6 },
          })
          .setOrigin(0.5)
          .setDepth(depthFor(390, 6)),
      );
    }

    if (state.objectives.includes("workshop-active")) {
      objects.push(
        this.add
          .rectangle(1120, 1305, 170, 18, GOLD)
          .setStrokeStyle(4, INK)
          .setDepth(depthFor(1305, 2)),
      );
    }

    if (state.currentChapter === "free-explore") {
      objects.push(
        this.add
          .rectangle(440, 401, 170, 34, 0x9b714b)
          .setStrokeStyle(5, INK)
          .setDepth(depthFor(401, 2)),
        this.add
          .rectangle(385, 424, 11, 38, INK)
          .setDepth(depthFor(424, 1)),
        this.add
          .rectangle(495, 424, 11, 38, INK)
          .setDepth(depthFor(424, 1)),
        this.add
          .rectangle(415, 391, 22, 16, CREAM)
          .setStrokeStyle(3, INK)
          .setDepth(depthFor(401, 4)),
        this.add
          .rectangle(464, 391, 22, 16, TEAL)
          .setStrokeStyle(3, INK)
          .setDepth(depthFor(401, 4)),
      );
      for (let x = 175; x <= 605; x += 43) {
        objects.push(
          this.add
            .circle(x, 225 + ((x / 43) % 2) * 7, 6, x % 3 === 0 ? CORAL : GOLD)
            .setStrokeStyle(2, INK)
            .setDepth(depthFor(300, 7)),
        );
      }
    }

    this.consequences = objects;
    this.applyMonsoonState(state);
    this.arrangeResidentsForState(state);
    const warmthAlpha = this.monsoonActive
      ? 0
      // A restrained golden-hour glaze grows with the story without turning
      // teal, coral, skin tones, and grass into one uniform yellow wash.
      : Math.min(0.12, state.completedChapters.length * 0.03);
    if (!this.eveningLight) {
      this.eveningLight = this.add
        .rectangle(0, 0, ESTATE_WIDTH, ESTATE_HEIGHT, 0xffc878, 1)
        .setOrigin(0)
        .setBlendMode(Phaser.BlendModes.MULTIPLY)
        .setDepth(99_000);
    }
    this.eveningLight.setAlpha(warmthAlpha);
  }

  private arrangeResidentsForState(state: CampaignStateV1): void {
    if (state.currentChapter === "chapter-2") {
      if (this.residentArrangement !== "monsoon") {
        if (this.residentArrangement !== "routes") this.restoreNpcHomes();
        this.residentArrangement = "monsoon";
      }
      const shelteredHelpers: readonly [
        QuestId,
        NpcId,
        number,
        number,
      ][] = [
        ["garden-request", "aunty-mei", 315, 660],
        ["noticeboard-request", "uncle-ravi", 430, 658],
        ["sheltered-route-request", "mdm-siti", 545, 660],
      ];
      for (const [questId, npcId, x, y] of shelteredHelpers) {
        if (!state.completedQuests.includes(questId)) continue;
        this.moveNpcTo(npcId, x, y);
        this.poseNpc(npcId, "down");
      }
      return;
    }

    if (state.currentChapter !== "free-explore") {
      if (this.residentArrangement !== "routes") this.restoreNpcHomes();
      this.residentArrangement = "routes";
      return;
    }
    if (this.residentArrangement !== "gathering") {
      if (this.residentArrangement !== "routes") this.restoreNpcHomes();
      this.residentArrangement = "gathering";
    }
    const gathering: readonly [NpcId, number, number][] = [
      ["aunty-mei", 300, 305],
      ["uncle-ravi", 380, 300],
      ["mdm-siti", 500, 300],
      ["pak-yusof", 580, 305],
      ["coach-meng", 280, 470],
      ["uncle-seng", 370, 478],
      ["auntie-minah", 505, 478],
      ["wei-ling", 595, 470],
    ];
    for (const [index, [npcId, x, y]] of gathering.entries()) {
      this.moveNpcTo(npcId, x, y);
      this.poseNpc(npcId, index < 4 ? "down" : "up");
    }
  }

  private createBakedExteriorTiles(): void {
    const tiles: readonly [string, number, number][] = [
      ["estate-nw", 0, 0],
      ["estate-ne", 1280, 0],
      ["estate-sw", 0, 800],
      ["estate-se", 1280, 800],
    ];
    for (const [key, originX, originY] of tiles) {
      if (!this.textures.exists(key)) {
        const graphics = this.make.graphics({ x: 0, y: 0 });
        paintThreeQuarterTerrain(graphics, originX, originY);
        this.paintGroundDetails(graphics, originX, originY);
        graphics.generateTexture(key, 1280, 800);
        graphics.destroy();
      }
      this.add.image(originX, originY, key).setOrigin(0).setDepth(0);
    }
  }

  private createBuildingOcclusionLayers(): void {
    this.buildingOcclusionViews = ESTATE_BUILDINGS.map((definition) => {
      const zone = definition.bounds;
      const texture = ensureBuildingTexture(this, definition);
      this.add
        .image(zone.x, zone.y, texture)
        .setOrigin(0)
        .setName(`building-base:${definition.id}`)
        .setDepth(8);
      const overlay = this.add
        .image(zone.x, zone.y, texture)
        .setOrigin(0)
        .setName(`building-occluder:${definition.id}`)
        .setDepth(depthFor(zone.y + zone.height));
      return {
        zone,
        overlay,
        faded: false,
      };
    });
  }

  private refreshShelterViews(state: CampaignStateV1): void {
    for (const sprite of this.shelterSprites) sprite.destroy();
    this.shelterSprites = [];
    const storedChoice = state.choices["request:sheltered-route-request"];
    const choice: ShelterChoice | null =
      state.completedQuests.includes("sheltered-route-request")
      && (storedChoice === "shelter-gap" || storedChoice === "rest-point")
        ? storedChoice
        : null;
    for (const definition of getActiveShelters(choice)) {
      const texture = ensureShelterTexture(this, definition);
      this.shelterSprites.push(
        this.add
          .image(definition.bounds.x, definition.bounds.y, texture)
          .setOrigin(0)
          .setName(`shelter:${definition.id}`)
          .setDepth(depthFor(definition.bounds.y + definition.bounds.height, 4)),
      );
      for (const post of definition.posts) {
        if (this.shelterColliderIds.has(post.id)) continue;
        this.shelterColliderIds.add(post.id);
        this.addObstacle(post.x, post.y, post.width, post.height);
      }
    }
  }

  private updateBuildingOcclusion(): void {
    if (!this.player) return;
    const occludingIds = new Set(
      getOccludingBuildingIds({ x: this.player.x, y: this.player.y }),
    );
    for (const view of this.buildingOcclusionViews) {
      const faded = occludingIds.has(view.zone.id);
      const companion = view.zone.id === "provision-shop"
        ? this.scamCheckCard
        : undefined;
      if (view.faded === faded) {
        companion?.setAlpha(view.overlay.alpha);
        continue;
      }
      view.faded = faded;
      const alpha = faded ? BUILDING_OCCLUSION_FADE_ALPHA : 1;
      this.tweens.killTweensOf(view.overlay);
      if (companion) this.tweens.killTweensOf(companion);
      if (this.reducedMotion) {
        view.overlay.setAlpha(alpha);
        companion?.setAlpha(alpha);
        continue;
      }
      this.tweens.add({
        targets: companion ? [view.overlay, companion] : view.overlay,
        alpha,
        duration: 180,
        ease: "Sine.easeOut",
      });
    }
  }

  private paintGroundDetails(
    graphics: Phaser.GameObjects.Graphics,
    originX: number,
    originY: number,
  ): void {
    for (const rack of ESTATE_BICYCLE_RACKS) {
      const x = rack.x - originX;
      const y = rack.y - originY;
      const left = x - BICYCLE_BAY_WIDTH / 2;
      const top = y - BICYCLE_BAY_DEPTH + 8;
      if (
        left < 2
        || left + BICYCLE_BAY_WIDTH > 1278
        || top < 2
        || top + BICYCLE_BAY_DEPTH > 798
      ) {
        continue;
      }
      graphics
        .fillStyle(NIGHT, 0.16)
        .fillRect(
          left + 5,
          top + 6,
          BICYCLE_BAY_WIDTH,
          BICYCLE_BAY_DEPTH,
        )
        .fillStyle(CONCRETE_EDGE)
        .fillRect(left, top, BICYCLE_BAY_WIDTH, BICYCLE_BAY_DEPTH)
        .fillStyle(lightenColour(SAND, 0.05))
        .fillRect(
          left + 5,
          top + 5,
          BICYCLE_BAY_WIDTH - 10,
          BICYCLE_BAY_DEPTH - 10,
        )
        .lineStyle(3, TEAL, 0.72)
        .strokeRect(
          left + 11,
          top + 10,
          BICYCLE_BAY_WIDTH - 22,
          BICYCLE_BAY_DEPTH - 20,
        )
        .fillStyle(TEAL, 0.72)
        .fillRect(x - 3, top + 10, 6, BICYCLE_BAY_DEPTH - 20);
    }

    const clusters: readonly [number, number, number][] = [
      [920, 246, GOLD],
      [1010, 286, CORAL],
      [1140, 232, CREAM],
      [835, 570, PURPLE],
      [1060, 590, GOLD],
      [1215, 690, CORAL],
      [95, 770, CREAM],
      [1370, 590, CREAM],
      [1550, 690, CORAL],
      [1830, 710, GOLD],
      [2110, 620, PURPLE],
      [2440, 535, CREAM],
      [2490, 735, CORAL],
      [105, 945, GOLD],
      [190, 1170, CREAM],
      [790, 1000, CORAL],
      [970, 1250, PURPLE],
      [690, 1490, GOLD],
      [1370, 940, CORAL],
      [1620, 1180, CREAM],
      [1880, 980, GOLD],
      [2300, 1260, PURPLE],
      [2460, 1490, CORAL],
    ];
    for (const [worldX, worldY, flower] of clusters) {
      const x = worldX - originX;
      const y = worldY - originY;
      if (x < 12 || x > 1268 || y < 12 || y > 788) continue;
      graphics
        .fillStyle(GRASS_DARK, 0.34)
        .fillEllipse(x, y + 7, 34, 14)
        .fillStyle(darkenColour(GREEN, 0.08))
        .fillRect(x - 10, y - 1, 3, 11)
        .fillRect(x, y - 5, 3, 15)
        .fillRect(x + 9, y + 1, 3, 9)
        .fillStyle(flower)
        .fillRect(x - 13, y - 4, 7, 6)
        .fillRect(x - 10, y - 7, 3, 12)
        .fillRect(x - 12, y - 5, 7, 3)
        .fillRect(x - 3, y - 9, 8, 7)
        .fillRect(x, y - 12, 3, 13)
        .fillRect(x - 2, y - 10, 7, 3)
        .fillRect(x + 6, y - 3, 8, 7)
        .fillRect(x + 9, y - 6, 3, 11)
        .fillRect(x + 7, y - 4, 7, 3)
        .fillStyle(INK)
        .fillRect(x - 10, y - 4, 2, 2)
        .fillRect(x, y - 9, 2, 2)
        .fillRect(x + 10, y - 3, 2, 2);
    }

    for (const [worldX, worldY, orientation] of ESTATE_DRAIN_GRATES) {
      const x = worldX - originX;
      const y = worldY - originY;
      const horizontal = orientation === "horizontal";
      const width = horizontal ? 34 : 14;
      const height = horizontal ? 14 : 34;
      if (
        x - width / 2 < 2
        || x + width / 2 > 1278
        || y - height / 2 < 2
        || y + height / 2 > 798
      ) {
        continue;
      }
      graphics
        .fillStyle(NIGHT, 0.18)
        .fillRect(
          x - width / 2 + 3,
          y - height / 2 + 4,
          width,
          height,
        )
        .fillStyle(INK)
        .fillRect(x - width / 2, y - height / 2, width, height)
        .fillStyle(CONCRETE_EDGE)
        .fillRect(
          x - width / 2 + 3,
          y - height / 2 + 3,
          width - 6,
          height - 6,
        );
      const barCount = horizontal ? 6 : 6;
      for (let bar = 0; bar < barCount; bar += 1) {
        if (horizontal) {
          graphics
            .fillStyle(INK)
            .fillRect(
              x - width / 2 + 5 + bar * 4,
              y - height / 2 + 4,
              2,
              height - 8,
            );
        } else {
          graphics
            .fillStyle(INK)
            .fillRect(
              x - width / 2 + 4,
              y - height / 2 + 5 + bar * 4,
              width - 8,
              2,
            );
        }
      }
    }

    const leafColours = [GOLD, CORAL, CREAM] as const;
    for (const [worldX, worldY, variant] of ESTATE_LEAF_PATCHES) {
      const x = worldX - originX;
      const y = worldY - originY;
      if (x < 10 || x > 1270 || y < 10 || y > 790) continue;
      const colour = leafColours[variant];
      graphics
        .fillStyle(NIGHT, 0.12)
        .fillRect(x - 7, y + 5, 23, 4)
        .fillStyle(colour)
        .fillRect(x - 9, y, 7, 4)
        .fillRect(x + 1, y + 4, 6, 3)
        .fillRect(x + 10, y - 3, 5, 4)
        .fillStyle(darkenColour(colour, 0.18))
        .fillRect(x - 7, y + 1, 3, 2)
        .fillRect(x + 12, y - 2, 2, 2);
    }
  }

  private drawExteriorDepthProps(): void {
    this.landscapeSprites = [];
    this.exteriorPropSprites = [];
    this.storyClusterSprites = [];
    const trees: readonly [number, number, string][] = [
      [300, 500, "tree-rain"],
      [980, 520, "tree-frangipani"],
      [1450, 535, "tree-palm"],
      [1950, 575, "tree-rain"],
      [2380, 635, "tree-frangipani"],
      [280, 1090, "tree-palm"],
      [880, 1135, "tree-rain"],
      [1500, 1095, "tree-frangipani"],
      [2350, 1165, "tree-rain"],
      [1350, 920, "tree-palm"],
      [520, 1460, "tree-frangipani"],
    ];
    for (const [x, y, texture] of trees) {
      this.addObstacle(x - 10, y - 24, 20, 24);
      const sprite = this.add
        .sprite(x, y, texture)
        .setOrigin(0.5, 1)
        .setDepth(depthFor(y, 5));
      this.exteriorPropSprites.push(sprite);
    }

    for (const [texture, x, y, collisionWidth, collisionHeight] of ESTATE_LANDSCAPING) {
      this.addObstacle(
        x - collisionWidth / 2,
        y - collisionHeight,
        collisionWidth,
        collisionHeight,
      );
      const sprite = this.add
        .sprite(x, y, texture)
        .setOrigin(0.5, 1)
        .setDepth(depthFor(y, 3));
      this.landscapeSprites.push(sprite);
      this.exteriorPropSprites.push(sprite);
    }

    const props: readonly [string, number, number, boolean][] = [
      ["prop-bench", 470, 485, true],
      ["prop-bin", 550, 482, false],
      ["prop-lamp", 770, 520, false],
      ["prop-planter", 875, 320, true],
      ["prop-bench", 1110, 720, true],
      ["prop-lamp", 1280, 545, false],
      ["prop-bin", 1570, 500, false],
      ["prop-bench", 1650, 510, true],
      ["prop-lamp", 1860, 560, false],
      ["prop-planter", 2150, 330, true],
      ["prop-bench", 650, 1050, true],
      ["prop-lamp", 520, 1100, false],
      ["prop-bin", 1030, 1090, false],
      ["prop-lamp", 1190, 1120, false],
      ["prop-bench", 1720, 1110, true],
      ["prop-lamp", 2050, 1130, false],
      ["prop-planter", 2210, 1010, true],
    ];
    for (const [texture, x, y, collides] of props) {
      if (collides) this.addObstacle(x - 35, y - 18, 70, 18);
      const sprite = this.add
        .sprite(x, y, texture)
        .setOrigin(0.5, 1)
        .setDepth(depthFor(y, 4));
      this.exteriorPropSprites.push(sprite);
    }

    for (const rack of ESTATE_BICYCLE_RACKS) {
      this.addObstacle(
        rack.x - BICYCLE_COLLISION_WIDTH / 2,
        rack.y - BICYCLE_COLLISION_DEPTH,
        BICYCLE_COLLISION_WIDTH,
        BICYCLE_COLLISION_DEPTH,
      );
      const sprite = this.add
        .sprite(rack.x, rack.y, "prop-bike-rack")
        .setOrigin(0.5, 1)
        .setDepth(depthFor(rack.y, 4));
      this.exteriorPropSprites.push(sprite);
    }

    const districtProps: readonly [
      string,
      number,
      number,
      number,
      number,
    ][] = [
      ["prop-tray-return", 1550, 475, 62, 18],
      ["prop-market-crates", 2210, 475, 100, 18],
      ["prop-dragon-playground", 1700, 1010, 224, 24],
      ["prop-exercise-corner", 1430, 1225, 148, 22],
    ];
    for (const [texture, x, y, width, height] of districtProps) {
      this.addObstacle(x - width / 2, y - height, width, height);
      const sprite = this.add
        .sprite(x, y, texture)
        .setOrigin(0.5, 1)
        .setDepth(depthFor(y, 4));
      this.exteriorPropSprites.push(sprite);
    }

    for (const [
      texture,
      x,
      y,
      collisionWidth,
      collisionHeight,
    ] of ESTATE_STORY_CLUSTERS) {
      this.addObstacle(
        x - collisionWidth / 2,
        y - collisionHeight,
        collisionWidth,
        collisionHeight,
      );
      const sprite = this.add
        .sprite(x, y, texture)
        .setOrigin(0.5, 1)
        .setDepth(depthFor(y, 4));
      this.storyClusterSprites.push(sprite);
      this.exteriorPropSprites.push(sprite);
    }
  }

  private createMonsoonWeather(): void {
    this.monsoonActive = false;
    this.monsoonShelterRestored = false;
    this.rainPhase = 0;
    this.puddleRipplePhase = 0;

    const surface = this.add.graphics().setDepth(3).setVisible(false);
    for (const y of [336, 1136]) {
      surface
        .fillStyle(0x4f7f8c, 0.2)
        .fillRect(0, y, ESTATE_WIDTH, 112)
        .fillStyle(0xb8d7d2, 0.22)
        .fillRect(0, y + 9, ESTATE_WIDTH, 3)
        .fillRect(0, y + 73, ESTATE_WIDTH, 2)
        .fillStyle(NIGHT, 0.12)
        .fillRect(0, y + 106, ESTATE_WIDTH, 6);
    }
    for (const x of [560, 1840]) {
      surface
        .fillStyle(0x4f7f8c, 0.18)
        .fillRect(x, 0, 164, ESTATE_HEIGHT)
        .fillStyle(0xb8d7d2, 0.2)
        .fillRect(x + 11, 0, 3, ESTATE_HEIGHT)
        .fillRect(x + 108, 0, 2, ESTATE_HEIGHT)
        .fillStyle(NIGHT, 0.1)
        .fillRect(x + 157, 0, 7, ESTATE_HEIGHT);
    }

    const puddles: readonly [number, number, number, number][] = [
      [350, 478, 92, 24],
      [820, 438, 116, 28],
      [1260, 485, 84, 22],
      [1535, 430, 108, 27],
      [2110, 468, 94, 24],
      [930, 828, 98, 25],
      [1740, 835, 112, 28],
      [760, 1182, 105, 26],
      [1390, 1210, 92, 24],
      [2080, 1190, 120, 30],
    ];
    for (const [x, y, width, height] of puddles) {
      surface
        .fillStyle(NIGHT, 0.18)
        .fillEllipse(x + 5, y + 5, width, height)
        .fillStyle(0x5f929b, 0.56)
        .fillEllipse(x, y, width, height)
        .fillStyle(0xb8d7d2, 0.34)
        .fillEllipse(
          x - Math.round(width * 0.18),
          y - 3,
          Math.round(width * 0.46),
          Math.max(5, Math.round(height * 0.28)),
        );
    }
    this.monsoonSurface = surface;

    this.monsoonTint = this.add
      .rectangle(0, 0, ESTATE_WIDTH, ESTATE_HEIGHT, 0x527887, 1)
      .setOrigin(0)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
      .setDepth(98_900)
      .setAlpha(0)
      .setVisible(false);
    this.monsoonHaze = this.add
      .rectangle(0, 0, ESTATE_WIDTH, ESTATE_HEIGHT, 0xb7ced0, 1)
      .setOrigin(0)
      .setDepth(98_920)
      .setAlpha(0)
      .setVisible(false);
    const baseShelter = getActiveShelters(null)[0];
    this.baseShelterGlow = this.add
      .rectangle(
        baseShelter ? baseShelter.glow.x + baseShelter.glow.width / 2 : 490,
        baseShelter ? baseShelter.glow.y + baseShelter.glow.height / 2 : 630,
        baseShelter?.glow.width ?? 260,
        baseShelter?.glow.height ?? 260,
        0xffd98b,
        1,
      )
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(98_980)
      .setAlpha(0)
      .setVisible(false);
    this.restoredShelterGlow = this.add
      .rectangle(490, 900, 260, 320, 0xffd98b, 1)
      .setBlendMode(Phaser.BlendModes.SCREEN)
      .setDepth(98_980)
      .setAlpha(0)
      .setVisible(false);

    this.rainStreaks = [];
    for (let index = 0; index < 64; index += 1) {
      const column = index % 8;
      const row = Math.floor(index / 8);
      const startXRatio =
        (
          column
          + 0.18
          + ((row * 5 + column * 3) % 6) / 10
        ) / 8;
      const startYRatio =
        (
          row
          + 0.16
          + ((column * 4 + row * 3) % 7) / 10
        ) / 8;
      const streak = this.add
        .rectangle(
          0,
          0,
          index % 4 === 0 ? 3 : 2,
          15 + (index % 5) * 3,
          0xd7eceb,
          0.48 + (index % 3) * 0.08,
        )
        .setOrigin(0.5, 1)
        .setAngle(-12)
        .setScrollFactor(0)
        .setDepth(99_100)
        .setVisible(false);
      this.rainStreaks.push({
        streak,
        startXRatio,
        startYRatio,
        speed: 430 + (index % 9) * 28,
        drift: 0.1 + (index % 4) * 0.016,
        worldX: 0,
        worldY: 0,
      });
    }

    this.puddleRipples = [];
    const ripplePoints: readonly [number, number, number][] = [
      [350, 478, 0],
      [820, 438, 530],
      [1260, 485, 1060],
      [1535, 430, 1590],
      [2110, 468, 280],
      [930, 828, 810],
      [1740, 835, 1340],
      [760, 1182, 1870],
      [1390, 1210, 420],
      [2080, 1190, 1480],
    ];
    for (const [x, y, offset] of ripplePoints) {
      const circle = this.add
        .circle(x, y, 7, CREAM, 0)
        .setStrokeStyle(2, 0xc9e3df, 0.68)
        .setDepth(6)
        .setVisible(false);
      this.puddleRipples.push({ circle, offset });
    }
  }

  private applyMonsoonState(state: CampaignStateV1): void {
    const active = state.currentChapter === "chapter-2";
    const wasActive = this.monsoonActive;
    const storedChoice = state.choices["request:sheltered-route-request"];
    const shelterChoice: ShelterChoice | null =
      state.completedQuests.includes("sheltered-route-request")
      && (storedChoice === "shelter-gap" || storedChoice === "rest-point")
        ? storedChoice
        : null;
    const shelterRestored = shelterChoice !== null;
    this.monsoonActive = active;
    this.monsoonShelterRestored = active && shelterRestored;
    this.currentShelterChoice = shelterChoice;

    this.monsoonSurface?.setVisible(active);
    this.monsoonTint
      ?.setVisible(active)
      .setAlpha(active ? 0.3 : 0);
    this.monsoonHaze
      ?.setVisible(active)
      .setAlpha(active ? 0.08 : 0);
    this.baseShelterGlow
      ?.setVisible(active)
      .setAlpha(active ? 0.14 : 0);
    const choiceShelter = getActiveShelters(shelterChoice).find(
      (definition) => definition.variant === shelterChoice,
    );
    if (choiceShelter) {
      this.restoredShelterGlow
        ?.setPosition(
          choiceShelter.glow.x + choiceShelter.glow.width / 2,
          choiceShelter.glow.y + choiceShelter.glow.height / 2,
        )
        .setSize(choiceShelter.glow.width, choiceShelter.glow.height)
        .setDisplaySize(choiceShelter.glow.width, choiceShelter.glow.height);
    }
    this.restoredShelterGlow
      ?.setVisible(active && shelterRestored)
      .setAlpha(active && shelterRestored ? 0.16 : 0);

    for (const laundry of this.laundrySprites) {
      laundry.setVisible(!active);
    }
    for (const activity of this.ambientActivities) {
      activity.sprite.setVisible(!active);
    }
    for (const ripple of this.puddleRipples) {
      ripple.circle.setVisible(active);
      if (active && this.reducedMotion) {
        ripple.circle.setScale(1.05).setAlpha(0.42);
      }
    }
    for (const { streak } of this.rainStreaks) {
      streak.setVisible(active && !this.reducedMotion);
    }

    if (active && !wasActive) {
      const catShelters: readonly [number, number][] = [
        [570, 684],
        [505, 680],
      ];
      for (const [index, cat] of this.ambientCats.entries()) {
        const shelter = catShelters[index] ?? catShelters[0];
        this.moveAmbientCat(cat, shelter[0], shelter[1]);
        cat.isMoving = false;
        cat.sprite.setTexture(`${cat.texture}-0`);
      }
    } else if (!active && wasActive) {
      for (const cat of this.ambientCats) {
        const target = cat.route[cat.routeIndex];
        this.moveAmbientCat(cat, target.x, target.y);
        cat.pauseUntil = this.time.now + 900;
      }
    }
  }

  private updateMonsoonWeather(time: number, _delta: number): void {
    if (!this.monsoonActive) {
      this.rainPhase = 0;
      this.puddleRipplePhase = 0;
      return;
    }
    if (this.reducedMotion) {
      this.rainPhase = 0;
      this.puddleRipplePhase = 0;
      for (const { streak } of this.rainStreaks) {
        streak.setVisible(false);
      }
      return;
    }

    this.rainPhase = (time % 1800) / 1800;
    const viewportWidth = Math.max(1, this.scale.width);
    const viewportHeight = Math.max(1, this.scale.height);
    const horizontalSpan = viewportWidth + 48;
    const verticalSpan = viewportHeight + 72;
    const camera = this.cameras.main;
    const seconds = time / 1000;
    for (const [index, rain] of this.rainStreaks.entries()) {
      const { streak, startXRatio, startYRatio, speed, drift } = rain;
      const travel = seconds * speed;
      const screenY =
        ((startYRatio * viewportHeight + travel) % verticalSpan) - 36;
      const rawScreenX = startXRatio * viewportWidth - travel * drift;
      const screenX =
        ((rawScreenX + 24) % horizontalSpan + horizontalSpan) % horizontalSpan
        - 24;
      const worldX = camera.worldView.x + screenX / camera.zoom;
      const worldY = camera.worldView.y + screenY / camera.zoom;
      rain.worldX = worldX;
      rain.worldY = worldY;
      // Keep the storm readable on a narrow screen while trimming one third
      // of the decorative streaks for lower-powered mobile GPUs.
      const mobileCull = viewportWidth < 760 && index % 3 === 1;
      streak
        .setPosition(screenX / camera.zoom, screenY / camera.zoom)
        .setVisible(
          !mobileCull && !this.isUnderDryShelter(worldX, worldY),
        );
    }

    this.puddleRipplePhase = (time % 2100) / 2100;
    for (const ripple of this.puddleRipples) {
      const phase = ((time + ripple.offset) % 2100) / 2100;
      ripple.circle
        .setScale(0.5 + phase * 1.7)
        .setAlpha(0.58 * (1 - phase));
    }
  }

  private isUnderDryShelter(x: number, y: number): boolean {
    return isPointDryUnderShelter(
      { x, y },
      this.monsoonShelterRestored ? this.currentShelterChoice : null,
    );
  }

  private createAmbientLife(): void {
    this.ambientCats = [];
    this.ambientActivities = [];
    this.ambientFlutter = [];
    this.laundrySprites = [];
    this.ambientActivityFrame = 0;
    this.ambientActivityTick = 0;
    this.ambientFlutterTick = 0;
    this.laundryFrame = 0;
    this.laundryTick = 0;
    this.createPondRipples();
    this.createMonsoonWeather();
    for (const [x, y, phase] of ESTATE_LAUNDRY) {
      const building = ESTATE_BUILDING_VISUAL_ZONES.find(
        (zone) => (
          x >= zone.x
          && x <= zone.x + zone.width
          && y >= zone.y
          && y <= zone.y + zone.height
        ),
      );
      this.laundrySprites.push(
        this.add
          .sprite(x, y, `ambient-laundry-${phase}`)
          .setOrigin(0.5, 1)
          .setDepth(
            building
              ? depthFor(building.y + building.height, 8)
              : depthFor(y, 8),
          ),
      );
    }
    if (!this.reducedMotion) {
      this.time.addEvent({
        delay: 850,
        loop: true,
        callback: () => {
          this.laundryTick += 1;
          this.laundryFrame = this.laundryFrame === 0 ? 1 : 0;
          for (const [index, laundry] of this.laundrySprites.entries()) {
            const phase = ESTATE_LAUNDRY[index][2];
            laundry.setTexture(
              `ambient-laundry-${(this.laundryFrame + phase) % 2}`,
            );
          }
        },
      });
    }

    for (const definition of ESTATE_AMBIENT_ACTIVITIES) {
      this.ambientActivities.push({
        id: definition.id,
        sprite: this.add
          .sprite(
            definition.x,
            definition.y,
            `${definition.texture}-0`,
          )
          .setOrigin(0.5, 1)
          .setDepth(depthFor(definition.y, 4)),
        texture: definition.texture,
      });
    }

    for (const definition of ESTATE_AMBIENT_FLUTTER) {
      this.ambientFlutter.push({
        id: definition.id,
        sprite: this.add
          .sprite(
            definition.x,
            definition.y,
            `${definition.texture}-0`,
          )
          .setOrigin(0.5)
          .setDepth(depthFor(definition.y, 6)),
        texture: definition.texture,
        baseX: definition.x,
        baseY: definition.y,
        radiusX: definition.radiusX,
        radiusY: definition.radiusY,
        phaseOffset: definition.phaseOffset,
      });
    }

    for (const definition of ESTATE_AMBIENT_CATS) {
      const start = definition.route[0];
      const shadow = this.add
        .ellipse(start.x, start.y + 1, 36, 8, NIGHT, 0.2)
        .setDepth(depthFor(start.y, 1));
      const sprite = this.add
        .sprite(start.x, start.y, `${definition.texture}-0`)
        .setOrigin(0.5, 1)
        .setDepth(depthFor(start.y, 3));
      this.ambientCats.push({
        id: definition.id,
        shadow,
        sprite,
        texture: definition.texture,
        route: definition.route,
        routeIndex: 1,
        pauseUntil: this.time.now + 900 + definition.pauseOffset,
        speed: definition.speed,
        isMoving: false,
      });
    }
  }

  private updateAmbientLife(time: number, delta: number): void {
    this.updateMonsoonWeather(time, delta);
    this.updatePondRipples(time);
    this.updateAmbientFlutter(time);
    if (this.reducedMotion) {
      this.ambientActivityFrame = 0;
      this.ambientActivityTick = 0;
    } else {
      const tick = Math.floor(time / 620);
      const frame = (tick % 2) as 0 | 1;
      this.ambientActivityTick = tick;
      if (frame !== this.ambientActivityFrame) {
        this.ambientActivityFrame = frame;
        for (const activity of this.ambientActivities) {
          activity.sprite.setTexture(`${activity.texture}-${frame}`);
        }
      }
    }
    const stepSeconds = Math.min(delta, 50) / 1000;
    for (const cat of this.ambientCats) {
      if (this.reducedMotion || this.monsoonActive || time < cat.pauseUntil) {
        cat.isMoving = false;
        const idleKey = `${cat.texture}-0`;
        if (cat.sprite.texture.key !== idleKey) cat.sprite.setTexture(idleKey);
        continue;
      }

      const target = cat.route[cat.routeIndex];
      const dx = target.x - cat.sprite.x;
      const dy = target.y - cat.sprite.y;
      const distance = Math.hypot(dx, dy);
      const travel = cat.speed * stepSeconds;
      if (distance <= Math.max(1, travel)) {
        this.moveAmbientCat(cat, target.x, target.y);
        cat.routeIndex = (cat.routeIndex + 1) % cat.route.length;
        cat.pauseUntil = time + 1100 + cat.routeIndex * 230;
        cat.isMoving = false;
        cat.sprite.setTexture(`${cat.texture}-0`);
        continue;
      }

      this.moveAmbientCat(
        cat,
        cat.sprite.x + dx / distance * travel,
        cat.sprite.y + dy / distance * travel,
      );
      cat.isMoving = true;
      cat.sprite.setFlipX(dx < 0);
      const frame = Math.floor(time / 210) % 2;
      const texture = `${cat.texture}-${frame}`;
      if (cat.sprite.texture.key !== texture) cat.sprite.setTexture(texture);
    }
  }

  private updateAmbientFlutter(time: number): void {
    const visible = !this.monsoonActive;
    this.ambientFlutterTick = this.reducedMotion
      ? 0
      : Math.floor(time / 170);
    for (const flutter of this.ambientFlutter) {
      flutter.sprite.setVisible(visible);
      if (!visible) continue;
      if (this.reducedMotion) {
        flutter.sprite
          .setPosition(flutter.baseX, flutter.baseY)
          .setTexture(`${flutter.texture}-0`)
          .setDepth(depthFor(flutter.baseY, 6));
        continue;
      }
      const orbit = (time + flutter.phaseOffset) / 780;
      const x = flutter.baseX + Math.sin(orbit) * flutter.radiusX;
      const y =
        flutter.baseY
        + Math.cos(orbit * 0.73 + flutter.phaseOffset * 0.001)
        * flutter.radiusY;
      const frame = Math.floor((time + flutter.phaseOffset) / 170) % 2;
      flutter.sprite
        .setPosition(x, y)
        .setTexture(`${flutter.texture}-${frame}`)
        .setDepth(depthFor(y, 6));
    }
  }

  private createPondRipples(): void {
    this.pondRipples = [];
    this.pondRipplePhase = 0;
    const definitions: readonly [number, number, number][] = [
      [105, 676, 0],
      [148, 720, 1060],
      [236, 731, 2110],
    ];
    for (const [x, y, offset] of definitions) {
      const circle = this.add
        .circle(x, y, 8, CREAM, 0)
        .setStrokeStyle(2, lightenColour(0x77b6b2, 0.42), 0.72)
        .setDepth(4);
      if (this.reducedMotion) {
        circle.setScale(1.05).setAlpha(0.46);
      }
      this.pondRipples.push({ circle, offset });
    }
  }

  private updatePondRipples(time: number): void {
    if (this.reducedMotion) {
      this.pondRipplePhase = 0;
      return;
    }
    this.pondRipplePhase = (time % 3200) / 3200;
    for (const ripple of this.pondRipples) {
      const phase = ((time + ripple.offset) % 3200) / 3200;
      ripple.circle
        .setScale(0.55 + phase * 1.9)
        .setAlpha(0.7 * (1 - phase));
    }
  }

  private moveAmbientCat(cat: AmbientCatView, x: number, y: number): void {
    cat.shadow
      .setPosition(x, y + 1)
      .setDepth(depthFor(y, 1));
    cat.sprite
      .setPosition(x, y)
      .setDepth(depthFor(y, 3));
  }

}

function roomReturnLocation(locationId: LocationId): LocationId {
  if (
    ["y-flat", "mr-long-flat", "grandma-ros-kitchen", "ben-flat"].includes(locationId)
  ) {
    return "hdb-corridor";
  }
  return "estate";
}

export class InteriorScene extends WalkableScene {
  private fromLocationId: LocationId = "estate";

  constructor(
    callbacks: CampaignSceneCallbacks,
    getState: () => CampaignStateV1,
    options: CampaignGameOptions,
  ) {
    super("interior", options.initialLocation, callbacks, getState, options);
  }

  protected cameraZoomForViewport(width: number, height: number): number {
    const horizontalFit = (width - 24) / ROOM_WIDTH;
    const verticalFit = (height - 24) / ROOM_HEIGHT;
    const fittedZoom = Math.min(horizontalFit, verticalFit);
    const readableFloor = width < 520 ? 0.56 : width < 700 ? 0.7 : 0;
    const heightAwareFloor = Math.min(readableFloor, verticalFit);
    return Math.min(1.08, Math.max(heightAwareFloor, fittedZoom));
  }

  init(data: SceneStartData = {}): void {
    this.locationId = data.locationId ?? this.getState().currentLocation;
    this.fromLocationId = data.fromLocationId ?? roomReturnLocation(this.locationId);
    this.resetWorldCollections();
  }

  create(data: SceneStartData = {}): void {
    this.locationId = data.locationId ?? this.locationId;
    this.fromLocationId = data.fromLocationId ?? this.fromLocationId;
    this.cameras.main.setBackgroundColor("#ead9b7");
    ensureCampaignArtTextures(this);
    this.drawRoomShell();
    this.drawLocationIdentity();
    const spawn = data.spawn ?? this.spawnForRoom();
    this.setupWorld(ROOM_WIDTH, ROOM_HEIGHT, spawn);
    this.drawConsequences();
  }

  protected drawConsequences(): void {
    this.clearConsequences();
    this.consequenceArt = emptyConsequenceArtSnapshot();
    const state = this.getState();
    const objects: Phaser.GameObjects.GameObject[] = [];

    if (this.locationId === "mr-long-flat" && state.objectives.includes("ramp-built")) {
      objects.push(...drawInteriorRamp(this));
      this.consequenceArt.interiorRamp = CONSEQUENCE_ART_IDS.interiorRamp;
    }
    if (
      this.locationId === "grandma-ros-kitchen"
      && state.objectives.includes("cooking-lesson-staged")
    ) {
      for (let chair = 0; chair < state.thresholds.attendees; chair += 1) {
        objects.push(
          this.add
            .rectangle(270 + chair * 80, 400, 42, 50, CORAL)
            .setStrokeStyle(3, INK)
            .setDepth(depthFor(400, 2)),
        );
      }
    }
    if (
      this.locationId === "craftsman-workshop"
      && state.objectives.includes("weaving-complete")
    ) {
      objects.push(
        this.add
          .rectangle(480, 300, 180, 110, GOLD)
          .setStrokeStyle(7, INK)
          .setDepth(depthFor(300, 2)),
      );
      for (let stripe = 0; stripe < 6; stripe += 1) {
        objects.push(
          this.add
            .rectangle(415 + stripe * 26, 300, 12, 96, stripe % 2 === 0 ? CORAL : TEAL)
            .setDepth(depthFor(300, 3)),
        );
      }
    }
    if (this.locationId === "y-flat" && state.currentChapter === "free-explore") {
      objects.push(
        this.add
          .rectangle(480, 320, 870, 500, 0xffc46b, 0.12)
          .setDepth(98_000),
      );
    }
    this.consequences = objects;
  }

  private drawRoomShell(): void {
    const key = createRoomBackdropTexture(
      this,
      this.locationId,
      this.wallColour(),
    );
    this.add.image(0, 0, key).setOrigin(0).setDepth(0);
    this.addObstacle(20, 20, 920, 35);
    this.addObstacle(20, 585, 360, 35);
    this.addObstacle(580, 585, 360, 35);
    this.addObstacle(20, 20, 35, 600);
    this.addObstacle(905, 20, 35, 600);
  }

  private wallColour(): number {
    const colours: Partial<Record<LocationId, number>> = {
      "y-flat": 0xa9b4b0,
      "hdb-corridor": 0xc7d6cf,
      "mr-long-flat": 0xc8b8a0,
      "grandma-ros-kitchen": 0xf0cf8d,
      "ben-flat": 0xb8c4d6,
      "craftsman-workshop": 0xb58b62,
      "community-centre": 0xb8d7c7,
      "kopitiam": 0xe5b66c,
      "provision-shop": 0x9fc9aa,
      "hawker-centre": 0xd7a397,
      "prayer-hall": 0xc5b7d9,
    };
    return colours[this.locationId] ?? SAND;
  }

  private addFurnitureBlock(
    x: number,
    bottom: number,
    width: number,
    height: number,
    fill: number,
    collides = true,
  ): Phaser.GameObjects.Graphics {
    const left = Math.round(x - width / 2);
    const top = Math.round(bottom - height);
    // Contact shadow on the floor. Without it large furniture reads as a flat
    // sticker sitting on the room rather than an object standing in it.
    this.add
      .graphics()
      .fillStyle(NIGHT, 0.17)
      .fillEllipse(
        x,
        bottom + 4,
        width * 0.97,
        Math.max(11, Math.round(height * 0.17)),
      )
      .setDepth(depthFor(bottom, 0));
    const graphics = this.add.graphics().setDepth(depthFor(bottom, 2));
    drawPixelBlock(graphics, left, top, width, height, fill, 4);
    // Form shading proportional to the object. The fixed 4 px bands inside
    // drawPixelBlock disappear on anything sofa-sized.
    const band = Math.max(6, Math.round(height * 0.16));
    graphics
      .fillStyle(lightenColour(fill, 0.22), 0.86)
      .fillPoints([
        new Phaser.Geom.Point(left + 4, top + band),
        new Phaser.Geom.Point(left + Math.min(18, width * 0.1), top + 3),
        new Phaser.Geom.Point(left + width - 4, top + 3),
        new Phaser.Geom.Point(left + width - band, top + band),
      ], true)
      .fillStyle(lightenColour(fill, 0.17), 0.5)
      .fillRect(left, top, width, band)
      .fillStyle(darkenColour(fill, 0.2), 0.45)
      .fillRect(left, bottom - band, width, band)
      .fillStyle(darkenColour(fill, 0.14), 0.34)
      .fillPoints([
        new Phaser.Geom.Point(left + width - band, top + band),
        new Phaser.Geom.Point(left + width - 4, top + 3),
        new Phaser.Geom.Point(left + width - 4, bottom - band),
        new Phaser.Geom.Point(left + width - band, bottom),
      ], true);
    if (width >= 190 && height >= 60) {
      // Panel seam so wide pieces read as cushions or doors, not one slab.
      graphics
        .fillStyle(darkenColour(fill, 0.24), 0.5)
        .fillRect(left + Math.round(width / 2) - 1, top + band, 2, height - band * 2);
    }
    if (collides) {
      const collisionHeight = Math.max(18, Math.round(height * 0.52));
      this.addObstacle(
        left,
        bottom - collisionHeight,
        width,
        collisionHeight,
      );
    }
    return graphics;
  }

  private addRug(
    x: number,
    y: number,
    width: number,
    height: number,
    fill: number,
  ): void {
    const left = Math.round(x - width / 2);
    const top = Math.round(y - height / 2);
    const graphics = this.add.graphics().setDepth(12);
    graphics
      .fillStyle(darkenColour(fill, 0.2))
      .fillRect(left, top, width, height)
      .fillStyle(fill)
      .fillRect(left + 3, top + 3, width - 6, height - 6)
      .fillStyle(lightenColour(fill, 0.22))
      .fillRect(left + 12, top + 12, width - 24, 3)
      .fillRect(left + 12, top + height - 15, width - 24, 3);
    // Woven cross-hatch. A large flat rectangle of one colour is the fastest
    // way to make a room look unfinished, so the pile gets a weave.
    for (let warp = left + 8; warp < left + width - 8; warp += 9) {
      graphics
        .fillStyle(darkenColour(fill, 0.09), 0.34)
        .fillRect(warp, top + 6, 3, height - 12);
    }
    for (let weft = top + 8; weft < top + height - 8; weft += 9) {
      graphics
        .fillStyle(lightenColour(fill, 0.13), 0.28)
        .fillRect(left + 6, weft, width - 12, 3);
    }
    // Diamond motif down the centre, the way a kampung floor mat is banded.
    const midY = top + Math.round(height / 2);
    for (let diamond = left + 46; diamond < left + width - 46; diamond += 74) {
      for (let step = 0; step < 5; step += 1) {
        const span = 4 + step * 5;
        graphics
          .fillStyle(lightenColour(fill, 0.3), 0.5)
          .fillRect(diamond - span / 2, midY - 12 + step * 3, span, 3)
          .fillRect(diamond - span / 2, midY + 9 - step * 3, span, 3);
      }
    }
    graphics.fillStyle(darkenColour(fill, 0.12), 0.55);
    for (let stripe = top + 28; stripe < top + height - 24; stripe += 36) {
      graphics.fillRect(left + 18, stripe, width - 36, 2);
    }
    for (let fringe = left + 8; fringe < left + width - 8; fringe += 16) {
      graphics
        .fillStyle(lightenColour(fill, 0.34))
        .fillRect(fringe, top - 3, 4, 3)
        .fillRect(fringe, top + height, 4, 3);
    }
  }

  private addWallFrame(
    x: number,
    y: number,
    width: number,
    height: number,
    fill: number,
  ): void {
    const graphics = this.add.graphics().setDepth(40);
    drawPixelBlock(
      graphics,
      Math.round(x - width / 2),
      Math.round(y - height / 2),
      width,
      height,
      fill,
      3,
      false,
    );
    graphics
      .fillStyle(CREAM)
      .fillRect(
        Math.round(x - width / 2) + 7,
        Math.round(y - height / 2) + 7,
        width - 14,
        height - 14,
      );
  }

  private addChair(
    x: number,
    bottom: number,
    fill: number,
    collides = false,
  ): void {
    const graphics = this.add.graphics().setDepth(depthFor(bottom, 3));
    graphics
      .fillStyle(NIGHT, 0.18)
      .fillEllipse(x + 4, bottom + 2, 45, 10)
      .fillStyle(INK)
      .fillRect(x - 20, bottom - 52, 40, 31)
      .fillRect(x - 23, bottom - 26, 46, 14)
      .fillRect(x - 17, bottom - 12, 6, 16)
      .fillRect(x + 11, bottom - 12, 6, 16)
      .fillStyle(fill)
      .fillRect(x - 16, bottom - 48, 32, 23)
      .fillStyle(lightenColour(fill, 0.2))
      .fillRect(x - 16, bottom - 48, 32, 4)
      .fillStyle(darkenColour(fill, 0.2))
      .fillRect(x - 18, bottom - 23, 36, 7);
    if (collides) this.addObstacle(x - 20, bottom - 30, 40, 30);
  }

  private addRoundTable(
    x: number,
    bottom: number,
    fill: number,
    collides = true,
  ): void {
    const graphics = this.add.graphics().setDepth(depthFor(bottom, 2));
    graphics
      .fillStyle(NIGHT, 0.18)
      .fillEllipse(x + 6, bottom + 3, 102, 25)
      .fillStyle(INK)
      .fillRect(x - 7, bottom - 35, 14, 38)
      .fillEllipse(x, bottom - 38, 112, 55)
      .fillStyle(fill)
      .fillEllipse(x, bottom - 42, 100, 42)
      .fillStyle(lightenColour(fill, 0.22))
      .fillEllipse(x - 12, bottom - 48, 60, 17);
    if (collides) this.addObstacle(x - 45, bottom - 58, 90, 38);
  }

  private drawLocationIdentity(): void {
    if (this.locationId === "hdb-corridor") {
      this.drawCorridor();
      return;
    }

    const exitDoor = getDoorsForLocation(this.locationId)[0];
    if (exitDoor) this.addDoorView(exitDoor);

    switch (this.locationId) {
      case "y-flat":
        this.drawYFlat();
        break;
      case "mr-long-flat":
        this.drawMrLongFlat();
        break;
      case "grandma-ros-kitchen":
        this.drawRosKitchen();
        break;
      case "ben-flat":
        this.drawBenFlat();
        break;
      case "craftsman-workshop":
        this.drawWorkshop();
        break;
      case "community-centre":
        this.drawCommunityCentre();
        break;
      case "kopitiam":
        this.drawKopitiam();
        break;
      case "provision-shop":
        this.drawProvisionShop();
        break;
      case "hawker-centre":
        this.drawHawkerCentre();
        break;
      case "prayer-hall":
        this.drawPrayerHall();
        break;
      case "estate":
        break;
    }
  }

  private drawCorridor(): void {
    const corridor = this.add.graphics().setDepth(28);
    corridor
      .fillStyle(NIGHT, 0.16)
      .fillRect(48, 276, 864, 154)
      .fillStyle(CONCRETE)
      .fillRect(50, 266, 860, 154)
      .fillStyle(TEAL)
      .fillRect(50, 250, 860, 21)
      .fillStyle(lightenColour(TEAL, 0.2))
      .fillRect(50, 250, 860, 5);
    for (let x = 58; x < 910; x += 64) {
      corridor
        .fillStyle(CONCRETE_EDGE, 0.68)
        .fillRect(x, 272, 3, 145);
    }
    corridor
      .fillStyle(INK)
      .fillRect(55, 417, 850, 6)
      .fillStyle(CREAM)
      .fillRect(60, 294, 108, 32)
      .fillStyle(CORAL)
      .fillRect(68, 301, 92, 5)
      .fillStyle(TEAL)
      .fillRect(68, 312, 62, 5);
    this.add
      .text(480, 82, "BLOCK 9  ·  LEVEL 9", {
        color: "#173f4f",
        fontFamily: "Georgia, serif",
        fontSize: "25px",
        fontStyle: "bold",
        letterSpacing: 2,
      })
      .setOrigin(0.5)
      .setDepth(48);
    for (const definition of getDoorsForLocation("hdb-corridor")) {
      this.addDoorView(definition);
      if (definition.targetLocationId !== "estate") {
        this.addRoomPlant(definition.anchor.x + 58, 314);
      }
    }
    for (const x of [90, 870]) {
      const pillar = this.add.graphics().setDepth(depthFor(455, 2));
      drawPixelBlock(pillar, x - 12, 230, 24, 226, CONCRETE, 4);
      pillar
        .fillStyle(TEAL)
        .fillRect(x - 34, 390, 68, 13)
        .fillStyle(lightenColour(TEAL, 0.18))
        .fillRect(x - 34, 390, 68, 4);
    }
    const rail = this.add.graphics().setDepth(depthFor(475, 3));
    rail
      .fillStyle(INK)
      .fillRect(72, 466, 816, 8)
      .fillStyle(TEAL)
      .fillRect(76, 468, 808, 3);
    for (let x = 82; x < 890; x += 72) {
      rail.fillStyle(INK).fillRect(x, 472, 7, 48);
    }
    this.addFurnitureBlock(760, 392, 100, 34, 0x9b714b, false);
  }

  private drawYFlat(): void {
    // Warm floor, cool sofa, rust rug. The room previously used two
    // desaturated grey-greens a few values apart, which read as one flat mass.
    const sofaFill = 0x4f7d70;
    this.addRug(480, 385, 430, 205, 0xa85c42);
    const sofa = this.addFurnitureBlock(250, 327, 310, 118, sofaFill);
    sofa
      .fillStyle(darkenColour(sofaFill, 0.18))
      .fillRect(111, 275, 278, 34)
      .fillStyle(lightenColour(sofaFill, 0.16))
      .fillRect(127, 245, 92, 42)
      .fillRect(234, 245, 92, 42)
      .fillStyle(NIGHT)
      .fillRect(106, 252, 16, 66)
      .fillRect(378, 252, 16, 66);

    this.addWallFrame(710, 88, 172, 96, 0x7096a3);
    const window = this.add.graphics().setDepth(44);
    window
      .fillStyle(0x7096a3)
      .fillRect(636, 53, 148, 70)
      .fillStyle(CREAM, 0.6)
      .fillRect(643, 58, 49, 56)
      .fillStyle(INK)
      .fillRect(707, 53, 5, 70)
      .fillRect(636, 86, 148, 5);
    const table = this.addFurnitureBlock(640, 436, 190, 52, 0x86624b);
    table
      .fillStyle(lightenColour(0x86624b, 0.2))
      .fillRect(551, 389, 178, 8)
      .fillStyle(NIGHT)
      .fillRect(568, 426, 9, 24)
      .fillRect(703, 426, 9, 24);

    const lamp = this.add.graphics().setDepth(depthFor(390, 4));
    lamp
      .fillStyle(NIGHT, 0.16)
      .fillEllipse(541, 393, 58, 11)
      .fillStyle(INK)
      .fillRect(536, 335, 9, 54)
      .fillRect(509, 313, 63, 9)
      .fillStyle(GOLD)
      .fillPoints(
        [
          new Phaser.Geom.Point(519, 315),
          new Phaser.Geom.Point(562, 315),
          new Phaser.Geom.Point(573, 349),
          new Phaser.Geom.Point(508, 349),
        ],
        true,
      )
      .fillStyle(CREAM)
      .fillRect(526, 320, 16, 8);
    this.addWallFrame(295, 92, 94, 56, CORAL);
    const shelf = this.addFurnitureBlock(850, 262, 92, 118, 0x86624b);
    for (let row = 0; row < 3; row += 1) {
      shelf
        .fillStyle(NIGHT)
        .fillRect(812, 174 + row * 31, 76, 7);
      for (let book = 0; book < 5; book += 1) {
        const colours = [CORAL, GOLD, TEAL, GREEN, PURPLE] as const;
        shelf
          .fillStyle(colours[(row + book) % colours.length])
          .fillRect(817 + book * 13, 153 + row * 31, 9, 20);
      }
    }
    this.addRoomPlant(820, 510);
    this.interactions.push({
      kind: "npc",
      id: "npc:voice",
      label: "Listen to the Voice by the warm lamp",
      shortLabel: "The Voice",
      npcId: "voice",
      x: 540,
      y: 390,
    });
  }

  private drawMrLongFlat(): void {
    this.addRug(520, 390, 330, 170, 0x8d765e);
    const bed = this.addFurnitureBlock(245, 340, 310, 142, 0x86624b);
    bed
      .fillStyle(0xc4a178)
      .fillRect(112, 219, 266, 91)
      .fillStyle(CREAM)
      .fillRect(124, 224, 82, 38)
      .fillStyle(TEAL)
      .fillRect(112, 292, 266, 18)
      .fillStyle(lightenColour(TEAL, 0.2))
      .fillRect(112, 292, 266, 5);
    const radio = this.addFurnitureBlock(700, 320, 188, 132, TEAL);
    radio
      .fillStyle(NIGHT)
      .fillRect(624, 203, 152, 52)
      .fillStyle(GOLD)
      .fillRect(632, 211, 74, 34)
      .fillStyle(CREAM)
      .fillRect(715, 212, 50, 5);
    for (let line = 0; line < 4; line += 1) {
      radio.fillStyle(CREAM).fillRect(715, 222 + line * 7, 50, 3);
    }
    for (let dial = 0; dial < 3; dial += 1) {
      radio
        .fillStyle(INK)
        .fillCircle(654 + dial * 47, 278, 10)
        .fillStyle(GOLD)
        .fillCircle(654 + dial * 47, 278, 5);
    }
    const threshold = this.add.graphics().setDepth(depthFor(556, 2));
    drawPixelBlock(threshold, 378, 533, 204, 24, CORAL, 4);
    for (let stripe = 0; stripe < 8; stripe += 1) {
      threshold
        .fillStyle(stripe % 2 === 0 ? CREAM : GOLD)
        .fillRect(386 + stripe * 23, 538, 13, 13);
    }
    this.addWallFrame(485, 88, 130, 66, 0x8fa5a5);
    this.addRoomPlant(840, 505);
    this.addNpc("mr-long", 520, 360, "npc-long");
    this.interactions.push({
      kind: "flavour",
      id: "long-radio",
      label: "Look at Mr. Long's repaired radio",
      shortLabel: "Radio",
      lines: ["Every dial is labelled in Mr. Long's careful handwriting. The radio is not the problem."],
      x: 700,
      y: 330,
    });
  }

  private drawRosKitchen(): void {
    this.addRug(535, 395, 405, 190, 0xc58a62);
    const cabinets = this.addFurnitureBlock(230, 295, 310, 152, CORAL);
    cabinets
      .fillStyle(CREAM)
      .fillRect(91, 154, 278, 17)
      .fillStyle(NIGHT)
      .fillRect(104, 184, 64, 85)
      .fillRect(178, 184, 64, 85)
      .fillRect(252, 184, 104, 85)
      .fillStyle(darkenColour(CORAL, 0.12))
      .fillRect(110, 190, 52, 73)
      .fillRect(184, 190, 52, 73)
      .fillRect(258, 190, 92, 73);
    for (let tin = 0; tin < 6; tin += 1) {
      cabinets
        .fillStyle(INK)
        .fillRect(104 + tin * 42, 122, 30, 33)
        .fillStyle(tin % 2 ? GOLD : TEAL)
        .fillRect(108 + tin * 42, 126, 22, 25)
        .fillStyle(CREAM)
        .fillRect(112 + tin * 42, 132, 14, 4);
    }
    const table = this.addFurnitureBlock(520, 438, 430, 116, 0x8f6746);
    table
      .fillStyle(lightenColour(0x8f6746, 0.2))
      .fillRect(314, 327, 412, 11)
      .fillStyle(CREAM)
      .fillEllipse(450, 352, 58, 28)
      .fillStyle(GREEN)
      .fillRect(515, 341, 52, 30)
      .fillStyle(GOLD)
      .fillCircle(620, 353, 18);
    this.addWallFrame(750, 88, 184, 90, 0x79a7b3);
    const pans = this.add.graphics().setDepth(46);
    for (let pan = 0; pan < 4; pan += 1) {
      const x = 430 + pan * 58;
      pans
        .fillStyle(INK)
        .fillRect(x, 50, 4, 54)
        .fillCircle(x + 2, 108, 18)
        .fillStyle(pan % 2 === 0 ? TEAL : GOLD)
        .fillCircle(x + 2, 108, 12);
    }
    this.addNpc("grandma-ros", 790, 360, "npc-ros");
    this.addRoomPlant(835, 505);
  }

  private drawBenFlat(): void {
    // Ben's room stays the quiet, cool one, but a warm rug under a saturated
    // blue sofa keeps it cosy instead of washed out.
    const benSofa = 0x5c7396;
    this.addRug(470, 390, 420, 190, 0x8a6a52);
    const sofa = this.addFurnitureBlock(250, 338, 320, 130, benSofa);
    sofa
      .fillStyle(lightenColour(benSofa, 0.16))
      .fillRect(115, 238, 115, 54)
      .fillRect(242, 238, 115, 54)
      .fillStyle(NIGHT)
      .fillRect(91, 257, 19, 71)
      .fillRect(390, 257, 19, 71);
    const keepsake = this.addFurnitureBlock(690, 350, 230, 198, 0x86624b);
    keepsake
      .fillStyle(GOLD)
      .fillRect(617, 176, 146, 128)
      .fillStyle(INK)
      .fillRect(625, 184, 130, 112);
    for (let line = 0; line < 5; line += 1) {
      keepsake
        .fillStyle(line % 2 ? TEAL : CORAL)
        .fillRect(634 + line * 25, 190, 12, 100);
    }
    keepsake
      .fillStyle(CREAM)
      .fillRect(636, 206, 112, 8)
      .fillRect(636, 250, 112, 8);
    this.addWallFrame(450, 87, 122, 64, PURPLE);
    this.addFurnitureBlock(835, 275, 82, 112, TEAL);
    this.addNpc("ben", 450, 365, "npc-ben");
  }

  private drawWorkshop(): void {
    this.addRug(560, 410, 470, 180, 0x8e6c4e);
    const toolWall = this.addFurnitureBlock(200, 322, 292, 194, 0x86624b);
    toolWall
      .fillStyle(darkenColour(0x86624b, 0.18))
      .fillRect(70, 145, 260, 145)
      .fillStyle(CREAM)
      .fillRect(82, 157, 236, 5);
    for (let tool = 0; tool < 7; tool += 1) {
      toolWall
        .fillStyle(INK)
        .fillRect(86 + tool * 34, 170, 11, 94)
        .fillStyle(tool % 2 ? TEAL : CORAL)
        .fillRect(89 + tool * 34, 174, 5, 82)
        .fillStyle(GOLD)
        .fillRect(84 + tool * 34, 168, 15, 8);
    }
    const bench = this.addFurnitureBlock(600, 420, 360, 130, 0x8f6746);
    bench
      .fillStyle(lightenColour(0x8f6746, 0.18))
      .fillRect(429, 295, 342, 12)
      .fillStyle(NIGHT)
      .fillRect(455, 398, 14, 38)
      .fillRect(731, 398, 14, 38)
      .fillStyle(GOLD)
      .fillRect(500, 316, 66, 22)
      .fillStyle(TEAL)
      .fillRect(610, 315, 92, 19);
    const loom = this.addFurnitureBlock(805, 330, 146, 222, PAPER);
    loom
      .fillStyle(INK)
      .fillRect(748, 127, 9, 181)
      .fillRect(853, 127, 9, 181)
      .fillRect(748, 145, 114, 8);
    for (let thread = 0; thread < 6; thread += 1) {
      loom
        .fillStyle(thread % 2 ? CORAL : TEAL)
        .fillRect(764 + thread * 15, 157, 7, 134);
    }
    this.addNpc("craftsman-tan", 370, 365, "npc-tan");
    if (
      this.getState().objectives.includes("ben-at-workshop")
      || this.getState().objectives.includes("weaving-complete")
    ) {
      this.addNpc("ben", 835, 415, "npc-ben");
    }
  }

  private drawCommunityCentre(): void {
    const stage = this.addFurnitureBlock(480, 214, 470, 72, TEAL);
    stage
      .fillStyle(GOLD)
      .fillRect(265, 150, 430, 13)
      .fillStyle(CREAM)
      .fillRect(386, 170, 188, 24)
      .fillStyle(CORAL)
      .fillRect(397, 177, 166, 5);
    this.addRug(480, 405, 700, 260, 0x5f9a86);
    for (let chair = 0; chair < 8; chair += 1) {
      const x = 160 + (chair % 4) * 180;
      const y = 350 + Math.floor(chair / 4) * 135;
      this.addChair(x, y, chair % 2 ? TEAL : CORAL);
    }
    const notice = this.add.graphics().setDepth(48);
    drawPixelBlock(notice, 730, 55, 130, 76, 0x86624b, 3, false);
    notice
      .fillStyle(PAPER)
      .fillRect(742, 67, 106, 52)
      .fillStyle(TEAL)
      .fillRect(750, 76, 68, 5)
      .fillStyle(CORAL)
      .fillRect(750, 89, 88, 5)
      .fillStyle(GOLD)
      .fillRect(750, 102, 54, 5);
    this.addNpc("coach-meng", 480, 315, "npc-meng");
  }

  private drawKopitiam(): void {
    const counter = this.addFurnitureBlock(480, 230, 770, 94, TEAL);
    counter
      .fillStyle(CREAM)
      .fillRect(110, 145, 740, 25)
      .fillStyle(NIGHT)
      .fillRect(135, 177, 128, 30)
      .fillRect(292, 177, 128, 30)
      .fillRect(449, 177, 128, 30)
      .fillRect(606, 177, 128, 30)
      .fillStyle(GOLD)
      .fillRect(145, 184, 108, 16)
      .fillStyle(CORAL)
      .fillRect(302, 184, 108, 16)
      .fillStyle(GREEN)
      .fillRect(459, 184, 108, 16)
      .fillStyle(PURPLE)
      .fillRect(616, 184, 108, 16);
    for (let table = 0; table < 5; table += 1) {
      const x = 150 + table * 160;
      this.addRoundTable(x, 402, table % 2 === 0 ? GOLD : CREAM);
      const tableTop = this.add.graphics().setDepth(depthFor(402, 4));
      if (table === 1) {
        tableTop
          .fillStyle(PAPER)
          .fillRect(x - 12, 350, 24, 17)
          .fillStyle(CORAL)
          .fillRect(x - 8, 353, 16, 4);
      } else {
        tableTop
          .fillStyle(INK)
          .fillRect(x - 8, 350, 16, 13)
          .fillStyle(CREAM)
          .fillRect(x - 5, 352, 10, 8);
      }
      this.addChair(x - 54, 438, CORAL);
      this.addChair(x + 54, 438, TEAL);
    }
    const menu = this.add.graphics().setDepth(48);
    for (let board = 0; board < 4; board += 1) {
      drawPixelBlock(menu, 190 + board * 145, 52, 120, 56, NIGHT, 3, false);
      menu
        .fillStyle(GOLD)
        .fillRect(202 + board * 145, 65, 68, 5)
        .fillStyle(CREAM)
        .fillRect(202 + board * 145, 78, 94, 4)
        .fillRect(202 + board * 145, 89, 82, 4);
    }
    this.addNpc("uncle-seng", 700, 505, "npc-seng");
  }

  private drawProvisionShop(): void {
    for (let shelf = 0; shelf < 4; shelf += 1) {
      const x = 130 + shelf * 210;
      const unit = this.addFurnitureBlock(x, 390, 156, 268, 0x86624b);
      for (let row = 0; row < 4; row += 1) {
        const y = 154 + row * 58;
        unit
          .fillStyle(INK)
          .fillRect(x - 68, y, 136, 12)
          .fillStyle(lightenColour(0x86624b, 0.18))
          .fillRect(x - 64, y, 128, 4);
        for (let product = 0; product < 5; product += 1) {
          const colours = [CORAL, GOLD, TEAL, GREEN, PURPLE] as const;
          unit
            .fillStyle(colours[(product + row + shelf) % colours.length])
            .fillRect(x - 58 + product * 25, y - 28, 17, 25)
            .fillStyle(CREAM)
            .fillRect(x - 55 + product * 25, y - 23, 11, 4);
        }
      }
    }
    const ingredientShelf = this.addFurnitureBlock(790, 515, 210, 96, GREEN);
    ingredientShelf
      .fillStyle(CREAM)
      .fillRect(702, 432, 176, 20)
      .fillStyle(GOLD)
      .fillRect(714, 460, 38, 37)
      .fillStyle(CORAL)
      .fillRect(770, 460, 38, 37)
      .fillStyle(TEAL)
      .fillRect(826, 460, 38, 37);
    this.addNpc("auntie-minah", 620, 470, "npc-minah");
  }

  private drawHawkerCentre(): void {
    const fascia = this.addFurnitureBlock(480, 230, 800, 105, CORAL);
    fascia
      .fillStyle(CREAM)
      .fillRect(92, 136, 776, 26)
      .fillStyle(GOLD)
      .fillRect(102, 143, 72, 10)
      .fillStyle(TEAL)
      .fillRect(202, 143, 72, 10)
      .fillStyle(GREEN)
      .fillRect(302, 143, 72, 10)
      .fillStyle(PURPLE)
      .fillRect(402, 143, 72, 10);
    for (let stall = 0; stall < 4; stall += 1) {
      const x = 180 + stall * 200;
      fascia
        .fillStyle(INK)
        .fillRect(x - 78, 167, 156, 56)
        .fillStyle(NIGHT)
        .fillRect(x - 72, 173, 144, 44)
        .fillStyle(CREAM)
        .fillRect(x - 58, 183, 116, 5);
    }
    for (let table = 0; table < 4; table += 1) {
      const x = 210 + table * 180;
      this.addRoundTable(x, 430, table % 2 ? TEAL : GOLD);
      this.addChair(x - 55, 470, CORAL);
      this.addChair(x + 55, 470, TEAL);
    }
    const trayStation = this.addFurnitureBlock(790, 530, 160, 112, TEAL);
    trayStation
      .fillStyle(CREAM)
      .fillRect(722, 431, 136, 18)
      .fillStyle(NIGHT)
      .fillRect(734, 460, 112, 11)
      .fillRect(734, 486, 112, 11);
    this.interactions.push({
      kind: "flavour",
      id: "hawker-table",
      label: "Read the shared-table sign",
      shortLabel: "Shared table",
      lines: ["A large-print sign reads: “This table is for sharing. Ask before moving a chair.”"],
      x: 480,
      y: 420,
    });
  }

  private drawPrayerHall(): void {
    const front = this.add.graphics().setDepth(44);
    drawPixelBlock(front, 100, 53, 760, 94, PURPLE, 4, false);
    front
      .fillStyle(CREAM)
      .fillRect(122, 72, 716, 56)
      .fillStyle(GOLD)
      .fillRect(145, 89, 670, 6);
    for (let mat = 0; mat < 6; mat += 1) {
      const x = 150 + mat * 130;
      const matGraphic = this.add.graphics().setDepth(16);
      drawPixelBlock(
        matGraphic,
        x - 45,
        278,
        90,
        164,
        mat % 2 ? TEAL : GREEN,
        3,
        false,
      );
      matGraphic
        .fillStyle(GOLD)
        .fillRect(x - 37, 292, 74, 5)
        .fillRect(x - 37, 422, 74, 5);
    }
    const rack = this.addFurnitureBlock(165, 526, 230, 86, 0x86624b);
    for (let shelf = 0; shelf < 3; shelf += 1) {
      rack.fillStyle(INK).fillRect(62, 450 + shelf * 24, 206, 7);
      for (let shoe = 0; shoe < 6; shoe += 1) {
        rack
          .fillStyle(shoe % 2 ? TEAL : CORAL)
          .fillRect(74 + shoe * 31, 438 + shelf * 24, 18, 10);
      }
    }
    this.addFurnitureBlock(355, 535, 130, 48, CONCRETE, false);
    this.addRoomPlant(820, 500);
    this.interactions.push({
      kind: "flavour",
      id: "hall-shoe-rack",
      label: "Look at the neatly labelled shoe rack",
      shortLabel: "Shoe rack",
      lines: ["Low shelves, a clear bench, and large unit-number tags make arrivals unhurried."],
      x: 150,
      y: 500,
    });
  }

  private spawnForRoom(): SpawnPoint {
    if (this.locationId === "y-flat") return { x: 610, y: 455 };
    return getReturnSpawn(this.fromLocationId, this.locationId)
      ?? { x: 480, y: 510 };
  }
}

export interface CampaignGameHandle {
  game: Phaser.Game;
  resize(width: number, height: number): void;
  setControlsEnabled(enabled: boolean): void;
  setVirtualDirection(x: number, y: number): void;
  handleViewportTap(
    x: number,
    y: number,
  ): "ignored" | "moving" | "interacted";
  cancelTapNavigation(): void;
  setPlayerPosition(spawn: SpawnPoint): void;
  tryInteract(): void;
  transitionTo(locationId: LocationId): void;
  setCampaignState(state: CampaignStateV1): void;
  setPaused(paused: boolean): void;
  isPaused(): boolean;
  getRendererKind(): "webgl" | "canvas";
  getCurrentLocation(): LocationId;
  getNavigationSnapshot(): CampaignNavigationSnapshot | null;
  getMotionSnapshot(): CampaignMotionSnapshot | null;
}

export function createCampaignGame(
  parent: string,
  callbacks: CampaignSceneCallbacks,
  options: CampaignGameOptions,
): CampaignGameHandle {
  let state = options.state;
  let currentLocation = options.initialLocation;
  let paused = false;
  const getState = (): CampaignStateV1 => state;
  const sceneCallbacks: CampaignSceneCallbacks = {
    ...callbacks,
    onDoorEnter: (locationId) => transitionTo(locationId),
  };
  const estate = new EstateScene(sceneCallbacks, getState, options);
  const interior = new InteriorScene(sceneCallbacks, getState, options);
  const initialIsExterior = currentLocation === "estate";
  const sceneOrder = initialIsExterior ? [estate, interior] : [interior, estate];
  const game = new Phaser.Game({
    type: options.renderer === "canvas" ? Phaser.CANVAS : Phaser.AUTO,
    parent,
    backgroundColor: "#ead9b7",
    pixelArt: true,
    roundPixels: true,
    physics: {
      default: "arcade",
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: "100%",
      height: "100%",
    },
    scene: sceneOrder,
  });

  function activeScene(): WalkableScene | null {
    const scene = game.scene.getScene(
      currentLocation === "estate" ? "estate" : "interior",
    );
    return scene instanceof WalkableScene ? scene : null;
  }

  function switchLocation(target: LocationId): void {
    const from = currentLocation;
    const targetSpawn = getReturnSpawn(from, target);
    currentLocation = target;
    callbacks.onNearbyInteraction(null);

    if (target === "estate") {
      if (game.scene.isSleeping("estate")) {
        game.scene.wake("estate");
        const woken = game.scene.getScene("estate");
        if (woken instanceof EstateScene) {
          woken.resumeFromSleep(targetSpawn ?? { x: 700, y: 400 });
        }
      } else if (!game.scene.isActive("estate")) {
        game.scene.start("estate", {
          spawn: targetSpawn ?? { x: 700, y: 400 },
        } satisfies SceneStartData);
      }
      game.scene.stop("interior");
      return;
    }

    if (from === "estate" && game.scene.isActive("estate")) {
      game.scene.sleep("estate");
    }
    game.scene.stop("interior");
    game.scene.start("interior", {
      locationId: target,
      fromLocationId: from,
      spawn: targetSpawn,
    } satisfies SceneStartData);
  }

  function transitionTo(locationId: LocationId): void {
    const scene = activeScene();
    scene?.setControlsEnabled(false);
    let changed = false;
    const change = (): void => {
      if (changed) return;
      changed = true;
      switchLocation(locationId);
    };
    if (!scene || options.reducedMotion) {
      change();
      return;
    }
    scene.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      change,
    );
    scene.cameras.main.fadeOut(180, 16, 46, 59);
    scene.time.delayedCall(TRANSITION_FALLBACK_MS, change);
  }

  return {
    game,
    resize(width: number, height: number): void {
      game.scale.resize(width, height);
      for (const scene of game.scene.getScenes(true)) {
        if (scene instanceof WalkableScene) {
          scene.refreshCameraLayout(width, height);
        } else {
          scene.cameras.main.setViewport(0, 0, width, height);
        }
      }
    },
    setControlsEnabled(enabled: boolean): void {
      activeScene()?.setControlsEnabled(enabled);
    },
    setVirtualDirection(x: number, y: number): void {
      activeScene()?.setVirtualDirection(x, y);
    },
    handleViewportTap(
      x: number,
      y: number,
    ): "ignored" | "moving" | "interacted" {
      return activeScene()?.handleViewportTap(x, y) ?? "ignored";
    },
    cancelTapNavigation(): void {
      activeScene()?.cancelTapNavigation("external");
    },
    setPlayerPosition(spawn: SpawnPoint): void {
      activeScene()?.setPlayerPosition(spawn);
    },
    tryInteract(): void {
      activeScene()?.tryInteract();
    },
    transitionTo,
    setCampaignState(nextState: CampaignStateV1): void {
      state = nextState;
      activeScene()?.refreshCampaignState();
    },
    setPaused(nextPaused: boolean): void {
      if (paused === nextPaused) return;
      const scene = activeScene();
      if (!scene) return;
      paused = nextPaused;
      if (nextPaused) game.scene.pause(scene.scene.key);
      else game.scene.resume(scene.scene.key);
    },
    isPaused(): boolean {
      return paused;
    },
    getRendererKind(): "webgl" | "canvas" {
      return game.renderer.type === Phaser.WEBGL ? "webgl" : "canvas";
    },
    getCurrentLocation(): LocationId {
      return currentLocation;
    },
    getNavigationSnapshot(): CampaignNavigationSnapshot | null {
      return activeScene()?.getNavigationSnapshot() ?? null;
    },
    getMotionSnapshot(): CampaignMotionSnapshot | null {
      return activeScene()?.getMotionSnapshot() ?? null;
    },
  };
}
