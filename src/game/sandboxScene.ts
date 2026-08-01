import Phaser from "phaser";
import type { ActivityId } from "./sandboxState.js";

const WORLD_WIDTH = 2560;
const WORLD_HEIGHT = 1600;

/**
 * The palette locked in docs/MIORA_ASSET_BIBLE.md, plus working tones mixed
 * from it. These cover the ground, paths, structures and outlines; district
 * accents and character clothing still carry their own colours and are being
 * migrated onto this palette (see docs/IMPROVEMENTS.md).
 * Light is treated as arriving from the upper left throughout: lit edges get a
 * lighter tone on their top and left, shaded edges a darker one.
 */
const INK = 0x173f4f;
const CORAL = 0xd96756;
const GOLD = 0xf2b84b;
const TEAL = 0x287271;
const SAND = 0xead9b7;

const GRASS = 0x9fc079;
const GRASS_DARK = 0x8caf68;
const GRASS_TUFT = 0x7a9d59;
const CONCRETE = 0xe3d3b0;
const CONCRETE_EDGE = 0xcbb894;
const CONCRETE_LIT = 0xf1e4c8;
const SHADOW = 0x2f3a24;

/** Stable value noise, so the estate looks hand-placed but never reshuffles. */
function noise(x: number, y: number): number {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return value - Math.floor(value);
}
const PLAYER_SPEED = 215;
const INTERACTION_DISTANCE = 92;

export interface WorldInteraction {
  id: ActivityId;
  label: string;
  shortLabel: string;
  x: number;
  y: number;
}

export interface SandboxSceneCallbacks {
  onReady: () => void;
  onNearbyInteraction: (interaction: WorldInteraction | null) => void;
  onInteract: (interaction: WorldInteraction) => void;
  onAreaChange: (areaName: string) => void;
  onStep: () => void;
}

interface MarkerView {
  ring: Phaser.GameObjects.Arc;
  badge: Phaser.GameObjects.Text;
  label: Phaser.GameObjects.Text;
}

interface ResidentDefinition {
  activityId: ActivityId;
  name: string;
  texture: string;
  x: number;
  y: number;
  greeting: string;
  /** Keyed by choice id, so the world never references a choice you did not make. */
  afterChoice: Readonly<Record<string, string>>;
}

interface ResidentView extends ResidentDefinition {
  sprite: Phaser.GameObjects.Sprite;
  shadow: Phaser.GameObjects.Ellipse;
  nameplate: Phaser.GameObjects.Text;
  bubble: Phaser.GameObjects.Text;
  home: Phaser.Math.Vector2;
  position: Phaser.Math.Vector2;
  target: Phaser.Math.Vector2;
  pauseUntil: number;
  bobPhase: number;
  bubbleVisible: boolean;
}

/**
 * Residents drift within a small radius of their own corner of the estate and
 * greet the player as they approach. The lines change once the player has acted
 * on that resident's invitation, so the neighbourhood acknowledges what the
 * player did without any runtime language model.
 */
const RESIDENTS: readonly ResidentDefinition[] = [
  {
    activityId: "garden",
    name: "Aunty Mei",
    texture: "resident-mei",
    x: 1117,
    y: 673,
    greeting: "Come, I will show you which herbs like this soil.",
    afterChoice: {
      herbs: "The mint is already taking. Come back next week and taste it.",
      flowers: "Bench goes in on Thursday. Somebody will be sitting on it by Friday.",
    },
  },
  {
    activityId: "noticeboard",
    name: "Uncle Ravi",
    texture: "resident-ravi",
    x: 735,
    y: 365,
    greeting: "Ah, a new face. Help me decide what goes on the board?",
    afterChoice: {
      chess: "Two signed up already. One has never played before — perfect.",
      stories: "Someone brought a photo already. Nineteen seventy-eight, no lift yet.",
    },
  },
  {
    activityId: "safe-route",
    name: "Mdm Siti",
    texture: "resident-siti",
    x: 448,
    y: 748,
    greeting: "I walk this route daily. I know exactly where the sun bites.",
    afterChoice: {
      "rest-point": "Bench is marked out. Exactly where the four o'clock shade lands.",
      shelter: "They are extending it. Thirty-one years of walking finally counted.",
    },
  },
];

interface NeighbourDefinition {
  name: string;
  texture: string;
  x: number;
  y: number;
  /** Cycled one per approach, so a neighbour is not a single repeated line. */
  lines: readonly string[];
}

interface NeighbourView extends NeighbourDefinition {
  sprite: Phaser.GameObjects.Sprite;
  shadow: Phaser.GameObjects.Ellipse;
  nameplate: Phaser.GameObjects.Text;
  bubble: Phaser.GameObjects.Text;
  bobPhase: number;
  bubbleVisible: boolean;
  lineIndex: number;
}

/**
 * Neighbours who populate the estate without owning an activity. They carry the
 * worldbuilding — who keeps this place running, and who has just arrived — and
 * seed the later chapters without adding progression state.
 */
const NEIGHBOURS: readonly NeighbourDefinition[] = [
  {
    name: "Uncle Seng",
    texture: "resident-seng",
    x: 1735,
    y: 300,
    lines: [
      "Kopi-o kosong. Same order thirty-one years. I know before you sit down.",
      "The morning crowd comes at six. Not for the coffee — for the company.",
      "My son says retire lah. And do what? Sit at home and wait for Sunday?",
    ],
  },
  {
    name: "Auntie Rosnah",
    texture: "resident-rosnah",
    x: 2255,
    y: 385,
    lines: [
      "If Mdm Tan does not come for her milk by ten, I call her. Twice it mattered.",
      "Everyone thinks this shop sells groceries. Mostly it keeps track of people.",
      "That new family in Block 12 — nobody has said hello yet. Somebody should.",
    ],
  },
  {
    name: "Pak Yusof",
    texture: "resident-yusof",
    x: 905,
    y: 620,
    lines: [
      "Forty years fixing lifts and water pumps. Now I fix whatever the block brings me.",
      "That noticeboard hinge? Mine. The bench bolt? Also mine. Nobody asked me to.",
      "A thing that still works is a thing somebody kept working.",
    ],
  },
  {
    name: "Coach Meng",
    texture: "resident-meng",
    x: 375,
    y: 1245,
    lines: [
      "Seven in the morning, every day. If it rains we move under the shelter.",
      "Started with two of us. Now eleven. Nobody comes to get fit — they come to show up.",
      "Anyone can join. That is the entire entry requirement.",
    ],
  },
  {
    name: "Wei Ling",
    texture: "resident-weiling",
    x: 1770,
    y: 785,
    lines: [
      "We only moved in last month. I did not expect people to actually say hello.",
      "People here hand you things before they know your name. I am still adjusting.",
      "My own mother is overseas. It helps, having aunties around.",
    ],
  },
];

const RESIDENT_WANDER_RADIUS = 46;
const RESIDENT_SPEED = 17;
const BUBBLE_DISTANCE = 190;

/** A resident stops drifting and turns to the player inside this radius. */
const RESIDENT_ATTENTION_DISTANCE = 170;

/**
 * Residents are talked to from further away than objects: they are the thing
 * the player is aiming at, and a person you are standing beside should already
 * be listening.
 */
const RESIDENT_TALK_DISTANCE = 130;

/**
 * Once a target is selected the player must walk clearly away before it is
 * dropped, so the prompt cannot flicker while a resident shifts their weight.
 */
const TALK_HYSTERESIS = 35;

const WORLD_INTERACTIONS: readonly WorldInteraction[] = [
  {
    id: "noticeboard",
    label: "Talk with Uncle Ravi at the noticeboard",
    shortLabel: "Noticeboard",
    x: 760,
    y: 385,
  },
  {
    id: "memory-table",
    label: "Play at the community memory table",
    shortLabel: "Memory table",
    x: 835,
    y: 525,
  },
  {
    id: "safe-route",
    label: "Walk the shaded route with Mdm Siti",
    shortLabel: "Shaded route",
    x: 425,
    y: 770,
  },
  {
    id: "garden",
    label: "Join Aunty Mei in the community garden",
    shortLabel: "Garden",
    x: 1090,
    y: 700,
  },
];

export class SandboxScene extends Phaser.Scene {
  private readonly callbacks: SandboxSceneCallbacks;
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private movementKeys!: Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>;
  private interactKeys!: Phaser.Input.Keyboard.Key[];
  private obstacles: Phaser.GameObjects.Rectangle[] = [];
  private markers = new Map<ActivityId, MarkerView>();
  private completedActivities = new Set<ActivityId>();
  private appliedChoices = new Map<ActivityId, string>();
  private nearbyInteraction: WorldInteraction | null = null;
  private virtualDirection = new Phaser.Math.Vector2();
  private controlsEnabled = true;
  private currentArea = "";
  private residents: ResidentView[] = [];
  private residentByActivity = new Map<ActivityId, ResidentView>();
  private neighbours: NeighbourView[] = [];
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private eveningLight!: Phaser.GameObjects.Rectangle;
  private ripples: Phaser.GameObjects.Arc[] = [];
  private walkPhase = 0;

  constructor(callbacks: SandboxSceneCallbacks) {
    super("kampung-sandbox");
    this.callbacks = callbacks;
  }

  create(): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor("#b7cf8a");

    this.createTextures();
    this.drawNeighbourhood();
    this.createAmbientLife();
    this.createResidents();
    this.createNeighbours();
    this.createInteractionMarkers();
    this.createPlayer();
    this.createEveningLight();
    this.configureInput();

    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    this.cameras.main.setZoom(1);
    this.updateArea(true);
    this.updateNearbyInteraction(true);
    this.callbacks.onReady();
  }

  update(time: number, delta: number): void {
    this.updateResidents(time, delta);
    this.updateNeighbours(delta);
    this.updatePlayerShadow();

    if (!this.controlsEnabled) {
      this.player.setVelocity(0, 0);
      return;
    }

    const keyboardX = Number(this.cursors.right.isDown || this.movementKeys.right.isDown) -
      Number(this.cursors.left.isDown || this.movementKeys.left.isDown);
    const keyboardY = Number(this.cursors.down.isDown || this.movementKeys.down.isDown) -
      Number(this.cursors.up.isDown || this.movementKeys.up.isDown);

    const movement = new Phaser.Math.Vector2(
      keyboardX || this.virtualDirection.x,
      keyboardY || this.virtualDirection.y
    );

    if (movement.lengthSq() > 0) {
      movement.normalize().scale(PLAYER_SPEED);
      this.player.setVelocity(movement.x, movement.y);
      this.player.setFlipX(movement.x < 0);
      this.player.setDepth(this.player.y + 24);

      this.walkPhase += delta / 1000;
      this.player.setScale(1, 1 + Math.sin(this.walkPhase * 13) * 0.035);
      this.callbacks.onStep();
    } else {
      this.player.setVelocity(0, 0);
      this.player.setScale(1, 1);
    }

    if (this.interactKeys.some((key) => Phaser.Input.Keyboard.JustDown(key))) {
      this.tryInteract();
    }

    this.updateNearbyInteraction(false);
    this.updateArea(false);
  }

  setControlsEnabled(enabled: boolean): void {
    this.controlsEnabled = enabled;

    // Phaser captures SPACE at the window, which would otherwise swallow the
    // keypress that activates a focused dialogue button. Capture it only while
    // the player is actually walking around, so overlays stay keyboard-operable.
    const keyboard = this.input.keyboard;
    if (keyboard) {
      if (enabled) keyboard.addCapture([Phaser.Input.Keyboard.KeyCodes.SPACE]);
      else keyboard.removeCapture([Phaser.Input.Keyboard.KeyCodes.SPACE]);
    }

    if (!enabled && this.player) {
      this.player.setVelocity(0, 0);
      this.virtualDirection.set(0, 0);
    }
  }

  setVirtualDirection(x: number, y: number): void {
    this.virtualDirection.set(x, y);
  }

  tryInteract(): void {
    if (this.controlsEnabled && this.nearbyInteraction) {
      this.callbacks.onInteract(this.nearbyInteraction);
    }
  }

  markActivityComplete(activityId: ActivityId, choiceId?: string): void {
    this.completedActivities.add(activityId);
    const marker = this.markers.get(activityId);
    if (!marker) return;

    marker.ring.setFillStyle(0x3f7a57, 0.95);
    marker.ring.setStrokeStyle(4, 0xf4d58d, 1);
    marker.badge.setText("\u2713").setFontSize(18);
    marker.label.setText(`${marker.label.text.replace("  DONE", "")}  DONE`);

    const resident = this.residentByActivity.get(activityId);
    const line = choiceId ? resident?.afterChoice[choiceId] : undefined;
    if (resident && line) resident.bubble.setText(line);
  }

  applyActivityChoice(activityId: ActivityId, choiceId: string): void {
    this.markActivityComplete(activityId, choiceId);
    if (this.appliedChoices.has(activityId)) return;
    this.appliedChoices.set(activityId, choiceId);

    switch (activityId) {
      case "garden":
        this.drawGardenChoice(choiceId);
        break;
      case "noticeboard":
        this.drawNoticeboardChoice(choiceId);
        break;
      case "safe-route":
        this.drawSafeRouteChoice(choiceId);
        break;
      case "memory-table":
        this.drawMemoryTableCompletion();
        break;
    }
  }

  focusPlayer(): void {
    this.game.canvas.focus();
  }

  private createPlayer(): void {
    this.playerShadow = this.add.ellipse(790, 449, 30, 10, 0x2f3a24, 0.3).setDepth(452);
    this.player = this.physics.add.sprite(790, 430, "player");
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(this.player.y + 24);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(22, 20);
    body.setOffset(5, 22);

    for (const obstacle of this.obstacles) {
      this.physics.add.collider(this.player, obstacle);
    }
  }

  private configureInput(): void {
    if (!this.input.keyboard) {
      throw new Error("Keyboard input is unavailable.");
    }
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
  }

  private createTextures(): void {
    if (!this.textures.exists("player")) {
      const graphics = this.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(INK, 1);
      graphics.fillRect(6, 19, 20, 20);
      graphics.fillRect(8, 6, 16, 16);
      graphics.fillRect(3, 21, 7, 15);
      graphics.fillRect(22, 21, 7, 15);
      graphics.fillStyle(0x2d5f74, 1);
      graphics.fillRect(7, 20, 18, 18);
      graphics.fillStyle(0xd39c6d, 1);
      graphics.fillRect(9, 7, 14, 14);
      graphics.fillStyle(0x2a2523, 1);
      graphics.fillRect(8, 4, 16, 6);
      graphics.fillRect(6, 8, 4, 9);
      graphics.fillStyle(0xf2b84b, 1);
      graphics.fillRect(4, 22, 5, 13);
      graphics.fillRect(23, 22, 5, 13);
      graphics.fillStyle(0x342e37, 1);
      graphics.fillRect(8, 38, 7, 4);
      graphics.fillRect(18, 38, 7, 4);
      graphics.generateTexture("player", 32, 42);
      graphics.destroy();
    }

    this.createResidentTexture("resident-mei", 0xc85c5c, 0x6b6560, 0xe3b58c);
    this.createResidentTexture("resident-ravi", 0x3d7a80, 0x4a4340, 0xb87f52);
    this.createResidentTexture("resident-siti", 0x7b5aa6, 0x4c3b5f, 0xcf9a6c);
    this.createResidentTexture("resident-seng", 0x8a6b3d, 0x8d8880, 0xe8c49b);
    this.createResidentTexture("resident-rosnah", 0x2f7d5f, 0x2a2523, 0xa8703f);
    this.createResidentTexture("resident-yusof", 0x4a6fa5, 0x7d7873, 0xcf9a6c);
    this.createResidentTexture("resident-meng", 0xd98a3c, 0x5a5550, 0xe3b58c);
    this.createResidentTexture("resident-weiling", 0xc76a9a, 0x241f1c, 0xecc6a0);
  }

  /**
   * Residents share one builder but not one look: each carries its own skin
   * tone, and everyone gets the same ink outline weight the buildings use, so
   * people stop reading as pasted in from another game.
   */
  private createResidentTexture(
    key: string,
    shirtColour: number,
    hairColour: number,
    skinColour: number
  ): void {
    if (this.textures.exists(key)) return;
    const graphics = this.make.graphics({ x: 0, y: 0 });

    // Ink silhouette first; every coloured shape sits one pixel inside it.
    graphics.fillStyle(INK, 1);
    graphics.fillRect(7, 19, 22, 22);
    graphics.fillRect(4, 22, 6, 14);
    graphics.fillRect(26, 22, 6, 14);
    graphics.fillRect(9, 6, 18, 17);
    graphics.fillRect(8, 3, 20, 9);
    graphics.fillRect(9, 38, 9, 6);
    graphics.fillRect(19, 38, 9, 6);

    graphics.fillStyle(shirtColour, 1);
    graphics.fillRect(8, 20, 20, 20);

    graphics.fillStyle(skinColour, 1);
    graphics.fillRect(10, 7, 16, 15);
    graphics.fillRect(5, 23, 4, 12);
    graphics.fillRect(27, 23, 4, 12);

    graphics.fillStyle(hairColour, 1);
    graphics.fillRect(9, 4, 18, 7);

    graphics.fillStyle(0x2a2523, 1);
    graphics.fillRect(13, 13, 2, 3);
    graphics.fillRect(21, 13, 2, 3);

    graphics.fillStyle(0x352f2a, 1);
    graphics.fillRect(10, 39, 7, 4);
    graphics.fillRect(20, 39, 7, 4);

    graphics.generateTexture(key, 36, 44);
    graphics.destroy();
  }

  private drawNeighbourhood(): void {
    const graphics = this.add.graphics().setDepth(0);
    this.drawGround(graphics);

    this.drawPath(graphics, 0, 405, WORLD_WIDTH, 150);
    this.drawPath(graphics, 690, 240, 170, 1000);
    this.drawPath(graphics, 240, 695, 900, 125);
    this.drawPath(graphics, 150, 1140, 2280, 120);
    this.drawPath(graphics, 1640, 350, 150, 830);

    // Centre markings on the two through-roads.
    graphics.lineStyle(3, CONCRETE_EDGE, 1);
    for (let x = 0; x < WORLD_WIDTH; x += 64) {
      graphics.lineBetween(x, 480, x + 30, 480);
      graphics.lineBetween(x, 1200, x + 30, 1200);
    }

    this.drawHdb(graphics);
    this.drawHawker(graphics);
    this.drawGarden(graphics);
    this.drawPond(graphics);
    this.drawShelteredRoute(graphics);
    this.drawMemoryTable(graphics);
    this.drawKopitiam(graphics);
    this.drawProvisionShop(graphics);
    this.drawPlayground(graphics);
    this.drawCommunityCentre(graphics);
    this.drawFitnessCorner(graphics);
    this.drawBusStop(graphics);

    const trees = [
      [55, 390], [120, 570], [370, 585], [540, 620], [930, 400],
      [1510, 430], [1470, 580], [920, 890], [640, 900], [90, 900],
      [1560, 470], [1990, 470], [2360, 560], [1560, 960], [2010, 1090],
      [980, 1080], [560, 1060], [180, 1000], [2450, 900], [1250, 1090],
      [430, 1470], [820, 1400], [1400, 1430], [1900, 1450], [2350, 1380],
    ];
    for (const [x, y] of trees) this.drawTree(graphics, x, y);

    this.addMapLabel(110, 325, "HDB COMMONS");
    this.addMapLabel(1110, 350, "HAWKER CORNER");
    this.addMapLabel(1110, 885, "COMMUNITY GARDEN");
    this.addMapLabel(275, 865, "SHADED WALK");
    this.addMapLabel(705, 590, "VOID DECK");
    this.addMapLabel(1600, 90, "KOPITIAM");
    this.addMapLabel(2110, 130, "PROVISION SHOP");
    this.addMapLabel(1610, 900, "PLAYGROUND");
    this.addMapLabel(2080, 1010, "COMMUNITY CENTRE");
    this.addMapLabel(200, 1430, "MORNING EXERCISE");
    this.addMapLabel(910, 1270, "BUS STOP");
  }

  /** Grass with drifting patches and scattered tufts, so no area reads as flat. */
  private drawGround(graphics: Phaser.GameObjects.Graphics): void {
    graphics.fillStyle(GRASS, 1);
    graphics.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    for (let y = 0; y < WORLD_HEIGHT; y += 96) {
      for (let x = 0; x < WORLD_WIDTH; x += 96) {
        const value = noise(x, y);
        if (value <= 0.6) continue;
        graphics.fillStyle(GRASS_DARK, 0.55);
        graphics.fillRoundedRect(
          x + value * 22,
          y + value * 18,
          64 + value * 46,
          48 + value * 34,
          24
        );
      }
    }

    for (let y = 0; y < WORLD_HEIGHT; y += 26) {
      for (let x = 0; x < WORLD_WIDTH; x += 26) {
        const value = noise(x * 0.7, y * 1.3);
        if (value <= 0.74) continue;
        const tuftX = x + value * 14;
        const tuftY = y + value * 12;
        graphics.fillStyle(GRASS_TUFT, 0.6);
        graphics.fillRect(tuftX, tuftY, 2, 6);
        graphics.fillRect(tuftX + 4, tuftY + 2, 2, 4);
        graphics.fillRect(tuftX - 4, tuftY + 1, 2, 5);
      }
    }
  }

  /** Concrete with kerbed edges and worn speckle rather than a flat slab. */
  private drawPath(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    graphics.fillStyle(CONCRETE, 1);
    graphics.fillRect(x, y, width, height);
    graphics.fillStyle(CONCRETE_LIT, 1);
    graphics.fillRect(x, y, width, 4);
    graphics.fillStyle(CONCRETE_EDGE, 1);
    graphics.fillRect(x, y + height - 4, width, 4);

    for (let sy = y; sy < y + height; sy += 20) {
      for (let sx = x; sx < x + width; sx += 20) {
        if (noise(sx * 1.7, sy * 0.9) <= 0.79) continue;
        graphics.fillStyle(CONCRETE_EDGE, 0.55);
        graphics.fillRect(sx + 5, sy + 6, 3, 3);
      }
    }
  }

  /**
   * Bamboo drying poles jutting from the windows. Nothing says Singapore HDB
   * faster, and no other estate game in the room will have them.
   */
  private drawLaundryPoles(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    seed: number
  ): void {
    const cloth = [CORAL, GOLD, TEAL, 0xfff6dc, 0x7fa9c9];
    const poles = 2 + Math.floor(noise(seed, seed * 1.7) * 2);

    for (let pole = 0; pole < poles; pole += 1) {
      const poleY = y + 6 + pole * 9;
      graphics.fillStyle(0xb08d5a, 1);
      graphics.fillRect(x, poleY, 44, 3);

      const items = 2 + Math.floor(noise(seed + pole, poleY) * 2);
      for (let item = 0; item < items; item += 1) {
        const value = noise(seed + pole * 3 + item, poleY + item);
        graphics.fillStyle(cloth[Math.floor(value * cloth.length) % cloth.length], 1);
        graphics.fillRect(x + 5 + item * 13, poleY + 3, 9, 11 + value * 7);
      }
    }
  }

  private drawKopitiam(graphics: Phaser.GameObjects.Graphics): void {
    graphics.fillStyle(0x5f5147, 0.18);
    graphics.fillRect(1585, 145, 370, 220);
    graphics.fillStyle(0xf1e2c4, 1);
    graphics.fillRect(1560, 125, 370, 215);
    graphics.fillStyle(0xd96756, 1);
    graphics.fillRect(1545, 110, 400, 28);

    // Round tables with stools, the way a coffee shop actually reads from above.
    for (let table = 0; table < 3; table += 1) {
      const x = 1625 + table * 120;
      graphics.fillStyle(0xe9d9bd, 1);
      graphics.fillCircle(x, 250, 30);
      graphics.lineStyle(4, 0x8b7666, 1);
      graphics.strokeCircle(x, 250, 30);
      graphics.fillStyle(0x9b7653, 1);
      for (const [dx, dy] of [[-44, 0], [44, 0], [0, -44], [0, 44]]) {
        graphics.fillCircle(x + dx, 250 + dy, 11);
      }
    }

    graphics.fillStyle(0x6f4f36, 1);
    graphics.fillRect(1575, 150, 120, 34);
    this.addObstacle(1560, 125, 370, 60);
  }

  private drawProvisionShop(graphics: Phaser.GameObjects.Graphics): void {
    graphics.fillStyle(0x5f5147, 0.18);
    graphics.fillRect(2115, 185, 330, 200);
    graphics.fillStyle(0xe6dcc0, 1);
    graphics.fillRect(2090, 165, 330, 195);
    graphics.fillStyle(0x287271, 1);
    graphics.fillRect(2075, 150, 360, 26);

    // Stacked crates outside the shopfront.
    const crateColours = [0xd96756, 0xf2b84b, 0x5b8c5a, 0x775b91];
    for (let crate = 0; crate < 6; crate += 1) {
      graphics.fillStyle(crateColours[crate % crateColours.length], 1);
      graphics.fillRect(2105 + (crate % 3) * 58, 300 + Math.floor(crate / 3) * 34, 46, 28);
      graphics.lineStyle(3, 0x6f4f36, 1);
      graphics.strokeRect(2105 + (crate % 3) * 58, 300 + Math.floor(crate / 3) * 34, 46, 28);
    }
    this.addObstacle(2090, 165, 330, 130);
  }

  private drawPlayground(graphics: Phaser.GameObjects.Graphics): void {
    graphics.fillStyle(0xe0b98d, 1);
    graphics.fillRoundedRect(1580, 640, 380, 260, 26);
    graphics.lineStyle(6, 0xb5895f, 1);
    graphics.strokeRoundedRect(1580, 640, 380, 260, 26);

    // Climbing frame.
    graphics.fillStyle(0x4a9fb0, 1);
    graphics.fillRect(1620, 690, 110, 20);
    graphics.fillRect(1626, 710, 12, 74);
    graphics.fillRect(1712, 710, 12, 74);
    graphics.fillStyle(0xf2b84b, 1);
    graphics.fillRect(1640, 730, 78, 14);

    // Swings.
    graphics.fillStyle(0x8a674a, 1);
    graphics.fillRect(1820, 690, 100, 14);
    graphics.fillRect(1826, 704, 8, 60);
    graphics.fillRect(1906, 704, 8, 60);
    graphics.fillStyle(0xd96756, 1);
    graphics.fillRect(1846, 756, 28, 10);
  }

  private drawCommunityCentre(graphics: Phaser.GameObjects.Graphics): void {
    graphics.fillStyle(0x5f5147, 0.2);
    graphics.fillRect(2075, 660, 400, 300);
    graphics.fillStyle(0xf3e6cb, 1);
    graphics.fillRect(2050, 635, 400, 300);
    graphics.fillStyle(0x775b91, 1);
    graphics.fillRect(2035, 618, 430, 30);

    for (let window = 0; window < 4; window += 1) {
      graphics.fillStyle(window % 2 === 0 ? 0x7393a7 : 0xf4b942, 1);
      graphics.fillRect(2080 + window * 92, 690, 62, 54);
      graphics.lineStyle(3, 0x705d50, 1);
      graphics.strokeRect(2080 + window * 92, 690, 62, 54);
    }

    graphics.fillStyle(0x4d6671, 1);
    graphics.fillRect(2215, 870, 74, 65);
    this.addObstacle(2050, 635, 400, 300);
  }

  private drawFitnessCorner(graphics: Phaser.GameObjects.Graphics): void {
    graphics.fillStyle(0x9dbf7c, 1);
    graphics.fillRoundedRect(170, 1170, 400, 270, 22);
    graphics.lineStyle(6, 0x6f8f56, 1);
    graphics.strokeRoundedRect(170, 1170, 400, 270, 22);

    // Simple outdoor exercise equipment.
    graphics.fillStyle(0x4c6c73, 1);
    graphics.fillRect(215, 1225, 14, 90);
    graphics.fillRect(305, 1225, 14, 90);
    graphics.fillRect(215, 1225, 104, 14);
    graphics.fillStyle(0xf2b84b, 1);
    graphics.fillRect(380, 1250, 90, 16);
    graphics.fillRect(388, 1266, 12, 52);
    graphics.fillRect(452, 1266, 12, 52);
    graphics.fillStyle(0xd96756, 1);
    graphics.fillCircle(280, 1370, 22);
    graphics.fillCircle(420, 1385, 18);
  }

  private drawBusStop(graphics: Phaser.GameObjects.Graphics): void {
    graphics.fillStyle(0x4c6c73, 1);
    graphics.fillRect(880, 1275, 250, 18);
    graphics.fillRect(892, 1293, 10, 62);
    graphics.fillRect(1108, 1293, 10, 62);
    graphics.fillStyle(0x9b7653, 1);
    graphics.fillRect(930, 1330, 130, 16);
    graphics.fillRect(938, 1346, 8, 22);
    graphics.fillRect(1044, 1346, 8, 22);
    graphics.fillStyle(0xf2b84b, 1);
    graphics.fillRect(1150, 1270, 10, 90);
    graphics.fillRect(1140, 1262, 30, 20);
  }

  private drawHdb(graphics: Phaser.GameObjects.Graphics): void {
    graphics.fillStyle(SHADOW, 0.18);
    graphics.fillRect(94, 84, 622, 276);

    graphics.fillStyle(0xf3e3c6, 1);
    graphics.fillRect(70, 55, 620, 278);
    graphics.fillStyle(CONCRETE_LIT, 1);
    graphics.fillRect(70, 55, 620, 9);
    graphics.fillStyle(CONCRETE_EDGE, 1);
    graphics.fillRect(70, 262, 620, 8);

    graphics.fillStyle(CORAL, 1);
    graphics.fillRect(58, 41, 644, 26);
    graphics.fillStyle(0xe8836f, 1);
    graphics.fillRect(58, 41, 644, 7);

    // Open void deck: shaded, with the structural pillars that define it.
    graphics.fillStyle(0x9c8874, 1);
    graphics.fillRect(70, 280, 620, 53);
    graphics.fillStyle(0xcbb894, 1);
    for (let pillar = 0; pillar < 9; pillar += 1) {
      graphics.fillRect(86 + pillar * 70, 280, 16, 53);
    }
    graphics.fillStyle(0x4d6671, 1);
    graphics.fillRect(342, 284, 78, 49);

    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 8; column += 1) {
        const x = 105 + column * 70;
        const y = 90 + row * 60;
        const value = noise(x, y);

        graphics.fillStyle(value > 0.72 ? GOLD : 0x7393a7, 1);
        graphics.fillRect(x, y, 36, 32);
        graphics.fillStyle(0xffffff, 0.22);
        graphics.fillRect(x, y, 36, 7);
        graphics.lineStyle(3, INK, 0.85);
        graphics.strokeRect(x, y, 36, 32);

        if (value > 0.45) this.drawLaundryPoles(graphics, x + 2, y + 34, x + y);
      }
    }

    graphics.lineStyle(4, INK, 1);
    graphics.strokeRect(70, 55, 620, 278);
    this.addObstacle(70, 55, 620, 278);
  }

  private drawHawker(graphics: Phaser.GameObjects.Graphics): void {
    graphics.fillStyle(SHADOW, 0.18);
    graphics.fillRect(1060, 96, 440, 290);
    graphics.fillStyle(SAND, 1);
    graphics.fillRect(1035, 70, 440, 285);
    graphics.fillStyle(CONCRETE_LIT, 1);
    graphics.fillRect(1035, 70, 440, 8);

    graphics.fillStyle(TEAL, 1);
    graphics.fillRect(1018, 55, 474, 30);
    graphics.fillStyle(0x3a8b8a, 1);
    graphics.fillRect(1018, 55, 474, 7);

    for (let column = 0; column < 4; column += 1) {
      const x = 1070 + column * 95;

      // Striped awning over each stall.
      graphics.fillStyle(column % 2 === 0 ? CORAL : GOLD, 1);
      graphics.fillRect(x, 120, 72, 28);
      graphics.fillStyle(0xfff6dc, 0.75);
      for (let stripe = 0; stripe < 4; stripe += 1) {
        graphics.fillRect(x + 6 + stripe * 18, 120, 7, 28);
      }
      graphics.lineStyle(3, INK, 0.8);
      graphics.strokeRect(x, 120, 72, 28);

      graphics.fillStyle(0x5b4a42, 1);
      graphics.fillRect(x, 148, 72, 70);
      graphics.fillStyle(0xf4e8cf, 1);
      graphics.fillRect(x + 8, 159, 56, 32);
      graphics.fillStyle(CONCRETE_EDGE, 1);
      graphics.fillRect(x + 8, 196, 56, 8);
    }

    graphics.lineStyle(4, INK, 1);
    graphics.strokeRect(1035, 70, 440, 285);
    this.addObstacle(1035, 70, 440, 285);
  }

  private drawGarden(graphics: Phaser.GameObjects.Graphics): void {
    graphics.fillStyle(0x5d8a58, 1);
    graphics.fillRect(1010, 590, 460, 300);
    graphics.lineStyle(8, 0x8a674a, 1);
    graphics.strokeRect(1010, 590, 460, 300);
    graphics.fillStyle(0x6f4f36, 1);
    for (let row = 0; row < 2; row += 1) {
      for (let column = 0; column < 3; column += 1) {
        const x = 1055 + column * 125;
        const y = 625 + row * 110;
        graphics.fillRoundedRect(x, y, 92, 72, 8);
        graphics.fillStyle(0x91b85d, 1);
        for (let plant = 0; plant < 4; plant += 1) {
          graphics.fillCircle(x + 15 + plant * 20, y + 26 + (plant % 2) * 18, 7);
        }
        graphics.fillStyle(0x6f4f36, 1);
      }
    }
    graphics.fillStyle(0xd8cfb7, 1);
    graphics.fillRect(1002, 665, 28, 65);
  }

  private drawPond(graphics: Phaser.GameObjects.Graphics): void {
    graphics.fillStyle(0x588b91, 1);
    graphics.fillRoundedRect(70, 590, 245, 190, 55);
    graphics.lineStyle(8, 0xe4d6b9, 1);
    graphics.strokeRoundedRect(70, 590, 245, 190, 55);
    graphics.fillStyle(0x7cad7e, 1);
    graphics.fillCircle(140, 655, 22);
    graphics.fillCircle(240, 710, 18);
    this.addObstacle(82, 605, 220, 160);
  }

  private drawShelteredRoute(graphics: Phaser.GameObjects.Graphics): void {
    graphics.fillStyle(0x4c6c73, 1);
    graphics.fillRect(255, 680, 560, 18);
    for (let x = 275; x < 815; x += 90) {
      graphics.fillRect(x, 698, 8, 96);
    }
    graphics.fillStyle(0x9b7653, 1);
    graphics.fillRect(345, 748, 78, 16);
    graphics.fillRect(352, 764, 8, 22);
    graphics.fillRect(408, 764, 8, 22);
  }

  private drawMemoryTable(graphics: Phaser.GameObjects.Graphics): void {
    graphics.fillStyle(0x86624b, 1);
    graphics.fillRoundedRect(795, 487, 82, 54, 8);
    graphics.fillStyle(0xf2c96d, 1);
    for (let row = 0; row < 2; row += 1) {
      for (let column = 0; column < 3; column += 1) {
        graphics.fillRect(807 + column * 20, 496 + row * 20, 14, 14);
      }
    }
  }

  private drawGardenChoice(choiceId: string): void {
    const graphics = this.add.graphics().setDepth(842);
    if (choiceId === "herbs") {
      graphics.fillStyle(0xf2d08a, 1);
      graphics.fillRoundedRect(1150, 805, 245, 48, 8);
      graphics.lineStyle(4, 0x173f4f, 1);
      graphics.strokeRoundedRect(1150, 805, 245, 48, 8);
      for (let plant = 0; plant < 9; plant += 1) {
        const x = 1170 + plant * 25;
        graphics.fillStyle(plant % 2 === 0 ? 0x3d7750 : 0x6a9d55, 1);
        graphics.fillCircle(x, 817 + (plant % 3) * 6, 8);
        graphics.fillRect(x - 2, 824, 4, 15);
      }
      this.addChoiceLabel(1272, 861, "SHARED HERBS", 862);
      return;
    }

    graphics.fillStyle(0x8a674a, 1);
    graphics.fillRect(1160, 812, 205, 18);
    graphics.fillRect(1174, 830, 12, 32);
    graphics.fillRect(1338, 830, 12, 32);
    const flowerColours = [0xd96756, 0xf2b84b, 0x775b91, 0xfff6dc];
    for (let flower = 0; flower < 12; flower += 1) {
      const x = 1145 + flower * 22;
      const y = 787 + (flower % 3) * 7;
      graphics.fillStyle(flowerColours[flower % flowerColours.length], 1);
      graphics.fillCircle(x, y, 7);
      graphics.fillStyle(0x3d7750, 1);
      graphics.fillRect(x - 2, y + 6, 4, 20);
    }
    this.addChoiceLabel(1260, 869, "FLOWER SEAT", 870);
  }

  private drawNoticeboardChoice(choiceId: string): void {
    const graphics = this.add.graphics().setDepth(348);
    graphics.fillStyle(0x6f4f36, 1);
    graphics.fillRoundedRect(830, 270, 112, 72, 6);
    graphics.lineStyle(4, 0x173f4f, 1);
    graphics.strokeRoundedRect(830, 270, 112, 72, 6);
    graphics.fillStyle(0xf7edcf, 1);
    graphics.fillRect(840, 280, 92, 52);

    if (choiceId === "chess") {
      for (let row = 0; row < 4; row += 1) {
        for (let column = 0; column < 4; column += 1) {
          graphics.fillStyle((row + column) % 2 === 0 ? 0x173f4f : 0xfff6dc, 1);
          graphics.fillRect(848 + column * 11, 284 + row * 11, 11, 11);
        }
      }
      graphics.fillStyle(0xd96756, 1);
      graphics.fillRect(899, 288, 25, 8);
      graphics.fillRect(899, 303, 25, 8);
      return;
    }

    const photoColours = [0xd96756, 0x287271, 0xf2b84b, 0x775b91];
    for (let photo = 0; photo < 4; photo += 1) {
      const x = 845 + (photo % 2) * 43;
      const y = 283 + Math.floor(photo / 2) * 24;
      graphics.fillStyle(photoColours[photo], 1);
      graphics.fillRect(x, y, 32, 18);
      graphics.fillStyle(0x173f4f, 1);
      graphics.fillCircle(x + 9, y + 7, 3);
    }
  }

  private drawSafeRouteChoice(choiceId: string): void {
    const graphics = this.add.graphics().setDepth(810);
    if (choiceId === "rest-point") {
      graphics.fillStyle(0x8a674a, 1);
      graphics.fillRoundedRect(505, 744, 105, 20, 5);
      graphics.fillRect(517, 763, 10, 34);
      graphics.fillRect(588, 763, 10, 34);
      graphics.fillStyle(0xd96756, 1);
      graphics.fillRoundedRect(515, 739, 85, 12, 5);
      graphics.fillStyle(0x173f4f, 1);
      graphics.fillCircle(622, 753, 8);
      this.addChoiceLabel(557, 807, "REST POINT", 812);
      return;
    }

    graphics.fillStyle(0x287271, 1);
    graphics.fillRect(455, 674, 300, 20);
    graphics.fillStyle(0x173f4f, 1);
    for (let x = 470; x <= 740; x += 90) {
      graphics.fillRect(x, 694, 8, 104);
    }
    graphics.fillStyle(0xf2b84b, 1);
    graphics.fillRect(455, 694, 300, 5);
    this.addChoiceLabel(605, 807, "MORE SHELTER", 812);
  }

  private drawMemoryTableCompletion(): void {
    const graphics = this.add.graphics().setDepth(553);
    graphics.lineStyle(6, 0xf2b84b, 0.95);
    graphics.strokeRoundedRect(787, 479, 98, 70, 12);
    graphics.fillStyle(0x3f7a57, 1);
    for (let card = 0; card < 4; card += 1) {
      graphics.fillRoundedRect(800 + card * 19, 497 + (card % 2) * 19, 14, 14, 3);
    }
    this.addChoiceLabel(836, 558, "TABLE COMPLETE", 559);
  }

  private addChoiceLabel(x: number, y: number, text: string, depth: number): void {
    this.add.text(x, y, text, {
      color: "#fff6dc",
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "14px",
      fontStyle: "bold",
      backgroundColor: "#173f4fe8",
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5, 0).setDepth(depth);
  }

  /**
   * A broad, flat-crowned rain tree - the tree that actually shades Singapore
   * estates - built in three tonal layers with the light coming from upper left.
   */
  private drawTree(graphics: Phaser.GameObjects.Graphics, x: number, y: number): void {
    graphics.fillStyle(SHADOW, 0.2);
    graphics.fillEllipse(x + 10, y + 24, 78, 22);

    graphics.fillStyle(0x6d5138, 1);
    graphics.fillRect(x - 6, y - 6, 13, 34);
    graphics.fillStyle(0x88673f, 1);
    graphics.fillRect(x - 6, y - 6, 5, 34);

    graphics.fillStyle(0x35633f, 1);
    graphics.fillCircle(x - 22, y - 8, 26);
    graphics.fillCircle(x + 22, y - 10, 28);
    graphics.fillCircle(x, y - 30, 31);

    graphics.fillStyle(0x437a4a, 1);
    graphics.fillCircle(x - 18, y - 15, 20);
    graphics.fillCircle(x + 17, y - 18, 21);
    graphics.fillCircle(x - 2, y - 35, 23);

    graphics.fillStyle(0x5f9a58, 1);
    graphics.fillCircle(x - 12, y - 27, 13);
    graphics.fillCircle(x + 7, y - 33, 11);
  }

  private addMapLabel(x: number, y: number, text: string): void {
    // Quiet estate signage rather than a debug print: no plate, a cream halo so
    // it stays legible over grass and concrete alike.
    this.add
      .text(x, y, text, {
        color: "#2c4d5a",
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: "17px",
        fontStyle: "bold italic",
        padding: { x: 2, y: 2 },
      })
      .setStroke("#fff6dc", 4)
      .setAlpha(0.82)
      .setDepth(y + 1);
  }

  private addObstacle(x: number, y: number, width: number, height: number): void {
    const obstacle = this.add.rectangle(x + width / 2, y + height / 2, width, height, 0, 0);
    this.physics.add.existing(obstacle, true);
    this.obstacles.push(obstacle);
  }

  private createResidents(): void {
    for (const definition of RESIDENTS) {
      const shadow = this.add
        .ellipse(definition.x, definition.y + 20, 34, 11, 0x2f3a24, 0.28)
        .setDepth(definition.y + 18);
      const sprite = this.add.sprite(definition.x, definition.y, definition.texture);
      const nameplate = this.add
        .text(definition.x, definition.y - 42, definition.name, {
          color: "#fff8e8",
          fontFamily: "system-ui, sans-serif",
          fontSize: "14px",
          fontStyle: "bold",
          backgroundColor: "#173f4fe8",
          padding: { x: 6, y: 3 },
        })
        .setOrigin(0.5, 1);
      const bubble = this.add
        .text(definition.x, definition.y - 66, definition.greeting, {
          color: "#173f4f",
          fontFamily: "system-ui, sans-serif",
          fontSize: "14px",
          backgroundColor: "#fff8e8f2",
          padding: { x: 9, y: 6 },
          wordWrap: { width: 210 },
          align: "center",
        })
        .setOrigin(0.5, 1)
        .setAlpha(0);

      const view: ResidentView = {
        ...definition,
        sprite,
        shadow,
        nameplate,
        bubble,
        home: new Phaser.Math.Vector2(definition.x, definition.y),
        position: new Phaser.Math.Vector2(definition.x, definition.y),
        target: new Phaser.Math.Vector2(definition.x, definition.y),
        pauseUntil: 0,
        bobPhase: Math.random() * Math.PI * 2,
        bubbleVisible: false,
      };
      this.residents.push(view);
      this.residentByActivity.set(definition.activityId, view);
    }
  }

  /**
   * Where an activity is actually talked to. Resident-led activities travel with
   * the resident, so the player addresses the person rather than the spot they
   * happened to be standing on. The memory table has no resident and stays put.
   */
  private interactionPoint(interaction: WorldInteraction): { x: number; y: number } {
    return this.residentByActivity.get(interaction.id)?.position ?? interaction;
  }

  private updateResidents(time: number, delta: number): void {
    const step = delta / 1000;

    for (const resident of this.residents) {
      const playerDistance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        resident.position.x,
        resident.position.y
      );

      // Someone walking up to you is a reason to stop and look at them.
      const attentive = playerDistance < RESIDENT_ATTENTION_DISTANCE;
      if (attentive) {
        resident.sprite.setFlipX(this.player.x < resident.position.x);
        resident.pauseUntil = Math.max(resident.pauseUntil, time + 600);
      }

      if (!attentive && time >= resident.pauseUntil) {
        const distance = resident.position.distance(resident.target);
        if (distance < 3) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * RESIDENT_WANDER_RADIUS;
          resident.target.set(
            resident.home.x + Math.cos(angle) * radius,
            resident.home.y + Math.sin(angle) * radius
          );
          resident.pauseUntil = time + 1400 + Math.random() * 3200;
        } else {
          const stepX = ((resident.target.x - resident.position.x) / distance) * RESIDENT_SPEED * step;
          const stepY = ((resident.target.y - resident.position.y) / distance) * RESIDENT_SPEED * step;
          resident.position.x += stepX;
          resident.position.y += stepY;
          if (Math.abs(stepX) > 0.01) resident.sprite.setFlipX(stepX < 0);
        }
      }

      resident.bobPhase += step * 2.4;
      const bob = Math.sin(resident.bobPhase) * 1.6;
      const { x } = resident.position;
      const y = resident.position.y + bob;

      resident.sprite.setPosition(x, y).setDepth(resident.position.y + 20);
      resident.shadow.setPosition(x, resident.position.y + 20).setDepth(resident.position.y + 18);
      resident.nameplate.setPosition(x, y - 42).setDepth(resident.position.y + 22);
      resident.bubble.setPosition(x, y - 66).setDepth(resident.position.y + 23);

      // The marker floats above its resident so it reads as "this neighbour has
      // something to say" instead of labelling a patch of ground. Once they are
      // close enough to actually speak, the marker fades out as redundant.
      const marker = this.markers.get(resident.activityId);
      if (marker) {
        const markerY = y - 84;
        marker.ring.setPosition(x, markerY).setDepth(resident.position.y + 24);
        marker.badge.setPosition(x, markerY).setDepth(resident.position.y + 25);

        const target = resident.bubbleVisible ? 0 : 1;
        const alpha = Phaser.Math.Linear(marker.ring.alpha, target, 0.1);
        marker.ring.setAlpha(alpha);
        marker.badge.setAlpha(alpha);
      }

      const near = playerDistance < BUBBLE_DISTANCE;
      if (near !== resident.bubbleVisible) {
        resident.bubbleVisible = near;
        this.tweens.add({
          targets: resident.bubble,
          alpha: near ? 1 : 0,
          duration: 220,
          ease: "Sine.easeOut",
        });
      }
    }
  }

  private createNeighbours(): void {
    for (const definition of NEIGHBOURS) {
      const shadow = this.add
        .ellipse(definition.x, definition.y + 20, 34, 11, 0x2f3a24, 0.28)
        .setDepth(definition.y + 18);
      const sprite = this.add
        .sprite(definition.x, definition.y, definition.texture)
        .setDepth(definition.y + 20);
      const nameplate = this.add
        .text(definition.x, definition.y - 42, definition.name, {
          color: "#fff8e8",
          fontFamily: "system-ui, sans-serif",
          fontSize: "14px",
          fontStyle: "bold",
          backgroundColor: "#173f4fe8",
          padding: { x: 6, y: 3 },
        })
        .setOrigin(0.5, 1)
        .setDepth(definition.y + 22);
      const bubble = this.add
        .text(definition.x, definition.y - 66, definition.lines[0], {
          color: "#173f4f",
          fontFamily: "system-ui, sans-serif",
          fontSize: "14px",
          backgroundColor: "#fff8e8f2",
          padding: { x: 9, y: 6 },
          wordWrap: { width: 210 },
          align: "center",
        })
        .setOrigin(0.5, 1)
        .setAlpha(0)
        .setDepth(definition.y + 23);

      this.neighbours.push({
        ...definition,
        sprite,
        shadow,
        nameplate,
        bubble,
        bobPhase: Math.random() * Math.PI * 2,
        bubbleVisible: false,
        lineIndex: 0,
      });
    }
  }

  private updateNeighbours(delta: number): void {
    const step = delta / 1000;

    for (const neighbour of this.neighbours) {
      neighbour.bobPhase += step * 2.1;
      const y = neighbour.y + Math.sin(neighbour.bobPhase) * 1.5;
      neighbour.sprite.setPosition(neighbour.x, y);
      neighbour.nameplate.setPosition(neighbour.x, y - 42);
      neighbour.bubble.setPosition(neighbour.x, y - 66);

      const near =
        Phaser.Math.Distance.Between(this.player.x, this.player.y, neighbour.x, neighbour.y) <
        BUBBLE_DISTANCE;
      if (near === neighbour.bubbleVisible) continue;

      neighbour.bubbleVisible = near;
      if (near) {
        neighbour.sprite.setFlipX(this.player.x < neighbour.x);
        // A different remark each time you come back.
        neighbour.bubble.setText(neighbour.lines[neighbour.lineIndex]);
        neighbour.lineIndex = (neighbour.lineIndex + 1) % neighbour.lines.length;
      }
      this.tweens.add({
        targets: neighbour.bubble,
        alpha: near ? 1 : 0,
        duration: 220,
        ease: "Sine.easeOut",
      });
    }
  }

  private updatePlayerShadow(): void {
    this.playerShadow
      .setPosition(this.player.x, this.player.y + 19)
      .setDepth(this.player.y + 22);
  }

  private createAmbientLife(): void {
    for (const [x, y] of [
      [150, 660],
      [235, 700],
      [190, 730],
    ]) {
      const ripple = this.add.circle(x, y, 6, 0xffffff, 0).setStrokeStyle(2, 0xdff0ee, 0.7);
      ripple.setDepth(4);
      this.ripples.push(ripple);
      this.tweens.add({
        targets: ripple,
        scale: { from: 0.4, to: 2.4 },
        alpha: { from: 0.8, to: 0 },
        duration: 3200,
        delay: Math.random() * 2600,
        repeat: -1,
        ease: "Sine.easeOut",
      });
    }

    for (const [x, y, colour] of [
      [980, 620, 0xfff2a8],
      [1240, 560, 0xffd9ec],
      [610, 520, 0xfff2a8],
    ] as [number, number, number][]) {
      const flutter = this.add.circle(x, y, 4, colour, 0.95).setDepth(y + 40);
      this.tweens.add({
        targets: flutter,
        x: x + 70 + Math.random() * 60,
        y: y - 40 - Math.random() * 40,
        duration: 4200 + Math.random() * 1800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.tweens.add({
        targets: flutter,
        scaleY: 0.4,
        duration: 240,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  /**
   * A warm multiply pass over the whole viewport. It stays invisible during the
   * day and fades up when the evening gathering unlocks, so the player's three
   * completed activities visibly change the light in the estate.
   */
  private createEveningLight(): void {
    // Sized to the world rather than the camera: the canvas has not finished
    // laying out when create() runs, so camera.width is unreliable here.
    this.eveningLight = this.add
      .rectangle(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 0xffa95e, 1)
      .setOrigin(0, 0)
      .setAlpha(0)
      .setDepth(99_000)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
  }

  /** Called when the third activity unlocks the evening gathering. */
  setEveningMood(evening: boolean): void {
    if (!this.eveningLight) return;
    this.tweens.add({
      targets: this.eveningLight,
      alpha: evening ? 0.42 : 0,
      duration: 2600,
      ease: "Sine.easeInOut",
    });
  }

  private createInteractionMarkers(): void {
    for (const interaction of WORLD_INTERACTIONS) {
      const ring = this.add.circle(interaction.x, interaction.y, 15, 0xf2b84b, 0.92)
        .setStrokeStyle(3, 0x173f4f, 1)
        .setDepth(interaction.y + 30);
      const badge = this.add.text(interaction.x, interaction.y, "!", {
        color: "#173f4f",
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: "17px",
        fontStyle: "bold",
      }).setOrigin(0.5).setDepth(interaction.y + 31);
      const label = this.add.text(interaction.x, interaction.y + 22, interaction.shortLabel, {
        color: "#173f4f",
        fontFamily: "system-ui, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
        backgroundColor: "#fff8e8e6",
        padding: { x: 5, y: 3 },
      }).setOrigin(0.5, 0).setDepth(interaction.y + 32);

      // A resident's own nameplate already says who they are, so the marker
      // label would just be a second caption stacked on the same person.
      if (this.residentByActivity.has(interaction.id)) label.setVisible(false);

      this.markers.set(interaction.id, { ring, badge, label });
    }
  }

  private updateNearbyInteraction(force: boolean): void {
    let nearest: WorldInteraction | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const interaction of WORLD_INTERACTIONS) {
      const point = this.interactionPoint(interaction);
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        point.x,
        point.y
      );

      const reach = this.residentByActivity.has(interaction.id)
        ? RESIDENT_TALK_DISTANCE
        : INTERACTION_DISTANCE;
      const limit =
        this.nearbyInteraction?.id === interaction.id ? reach + TALK_HYSTERESIS : reach;
      if (distance >= limit) continue;

      // Compare how far inside each reach the player is, not raw distance, so a
      // nearby object cannot outrank the person the player is clearly stood with.
      const score = distance / reach;
      if (score < bestScore) {
        nearest = interaction;
        bestScore = score;
      }
    }

    if (!force && nearest?.id === this.nearbyInteraction?.id) return;
    this.nearbyInteraction = nearest;
    this.callbacks.onNearbyInteraction(nearest);

    for (const [id, marker] of this.markers) {
      const active = id === nearest?.id;
      marker.ring.setScale(active ? 1.16 : 1);
      marker.label.setAlpha(active ? 1 : 0.82);
    }
  }

  private updateArea(force: boolean): void {
    const { x, y } = this.player;
    let area = "Community Court";
    if (x < 700 && y < 385) area = "HDB Commons";
    else if (x > 2020 && y < 500) area = "Provision Shop";
    else if (x > 1500 && y < 500) area = "Kopitiam";
    else if (x > 1000 && y < 460) area = "Hawker Corner";
    else if (x > 2000 && y > 580) area = "Community Centre";
    else if (x > 1540 && y > 600 && y < 960) area = "Playground";
    else if (x < 620 && y > 1120) area = "Morning Exercise";
    else if (x > 820 && x < 1200 && y > 1240) area = "Bus Stop";
    else if (x > 970 && y > 560 && y < 940) area = "Community Garden";
    else if (y > 1100) area = "Estate Walk";
    else if (y > 670) area = "Shaded Walk";
    else if (x > 670 && x < 930) area = "Void Deck";

    if (!force && area === this.currentArea) return;
    this.currentArea = area;
    this.callbacks.onAreaChange(area);
  }
}

export interface SandboxGameHandle {
  game: Phaser.Game;
  scene: SandboxScene;
}

export function createSandboxGame(
  parent: string,
  callbacks: SandboxSceneCallbacks
): SandboxGameHandle {
  const scene = new SandboxScene(callbacks);
  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    parent,
    backgroundColor: "#b7cf8a",
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
    scene,
  });

  return { game, scene };
}
