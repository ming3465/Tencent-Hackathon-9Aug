import Phaser from "phaser";
import type { ActivityId } from "./sandboxState.js";

const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 1000;
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
  afterChoice: string;
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
    afterChoice: "The new bed is settling in already. Taste the mint next week.",
  },
  {
    activityId: "noticeboard",
    name: "Uncle Ravi",
    texture: "resident-ravi",
    x: 735,
    y: 365,
    greeting: "Ah, a new face. Help me decide what goes on the board?",
    afterChoice: "Two neighbours signed up while you were walking around.",
  },
  {
    activityId: "safe-route",
    name: "Mdm Siti",
    texture: "resident-siti",
    x: 448,
    y: 748,
    greeting: "I walk this route daily. I know exactly where the sun bites.",
    afterChoice: "Much better. Come, test the new stretch with me sometime.",
  },
];

const RESIDENT_WANDER_RADIUS = 46;
const RESIDENT_SPEED = 17;
const BUBBLE_DISTANCE = 190;

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

  markActivityComplete(activityId: ActivityId): void {
    this.completedActivities.add(activityId);
    const marker = this.markers.get(activityId);
    if (!marker) return;

    marker.ring.setFillStyle(0x3f7a57, 0.95);
    marker.ring.setStrokeStyle(4, 0xf4d58d, 1);
    marker.badge.setText("OK").setFontSize(10);
    marker.label.setText(`${marker.label.text.replace("  DONE", "")}  DONE`);

    const resident = this.residents.find((candidate) => candidate.activityId === activityId);
    resident?.bubble.setText(resident.afterChoice);
  }

  applyActivityChoice(activityId: ActivityId, choiceId: string): void {
    this.markActivityComplete(activityId);
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
    this.playerShadow = this.add.ellipse(790, 469, 30, 10, 0x2f3a24, 0.3).setDepth(472);
    this.player = this.physics.add.sprite(790, 450, "player");
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
      graphics.fillStyle(0x173f5f, 1);
      graphics.fillRect(7, 20, 18, 18);
      graphics.fillStyle(0xf4c9a8, 1);
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

    this.createResidentTexture("resident-mei", 0xc85c5c, 0x2a2523);
    this.createResidentTexture("resident-ravi", 0x3d7a80, 0x404040);
    this.createResidentTexture("resident-siti", 0x7b5aa6, 0x4c3b5f);
  }

  private createResidentTexture(key: string, shirtColour: number, hairColour: number): void {
    if (this.textures.exists(key)) return;
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0x6b4f3f, 0.25);
    graphics.fillEllipse(4, 37, 34, 10);
    graphics.fillStyle(shirtColour, 1);
    graphics.fillRect(8, 20, 20, 20);
    graphics.fillStyle(0xd9a77f, 1);
    graphics.fillRect(10, 7, 16, 15);
    graphics.fillStyle(hairColour, 1);
    graphics.fillRect(9, 4, 18, 7);
    graphics.fillStyle(0xf4d58d, 1);
    graphics.fillRect(5, 23, 4, 12);
    graphics.fillRect(27, 23, 4, 12);
    graphics.fillStyle(0x352f2a, 1);
    graphics.fillRect(10, 39, 7, 4);
    graphics.fillRect(20, 39, 7, 4);
    graphics.generateTexture(key, 36, 44);
    graphics.destroy();
  }

  private drawNeighbourhood(): void {
    const graphics = this.add.graphics().setDepth(0);
    graphics.fillStyle(0xb7cf8a, 1);
    graphics.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    for (let y = 0; y < WORLD_HEIGHT; y += 32) {
      for (let x = 0; x < WORLD_WIDTH; x += 32) {
        if ((x / 32 + y / 32) % 3 === 0) {
          graphics.fillStyle(0xadc481, 0.45);
          graphics.fillRect(x + 3, y + 4, 5, 3);
        }
      }
    }

    graphics.fillStyle(0xd8cfb7, 1);
    graphics.fillRect(0, 405, WORLD_WIDTH, 150);
    graphics.fillRect(690, 240, 170, 600);
    graphics.fillRect(240, 695, 900, 125);
    graphics.lineStyle(3, 0xb8ad96, 1);
    for (let x = 0; x < WORLD_WIDTH; x += 64) {
      graphics.lineBetween(x, 480, x + 30, 480);
    }

    this.drawHdb(graphics);
    this.drawHawker(graphics);
    this.drawGarden(graphics);
    this.drawPond(graphics);
    this.drawShelteredRoute(graphics);
    this.drawMemoryTable(graphics);

    const trees = [
      [55, 390], [120, 570], [370, 585], [540, 620], [930, 400],
      [1510, 430], [1470, 580], [920, 890], [640, 900], [90, 900],
    ];
    for (const [x, y] of trees) this.drawTree(graphics, x, y);

    this.addMapLabel(110, 325, "HDB COMMONS");
    this.addMapLabel(1110, 350, "HAWKER CORNER");
    this.addMapLabel(1110, 885, "COMMUNITY GARDEN");
    this.addMapLabel(275, 865, "SHADED WALK");
    this.addMapLabel(705, 590, "VOID DECK");
  }

  private drawHdb(graphics: Phaser.GameObjects.Graphics): void {
    graphics.fillStyle(0x6b594d, 0.2);
    graphics.fillRect(94, 80, 622, 276);
    graphics.fillStyle(0xf0dfc2, 1);
    graphics.fillRect(70, 55, 620, 278);
    graphics.fillStyle(0xd26a4f, 1);
    graphics.fillRect(58, 45, 644, 24);
    graphics.fillStyle(0x8b7666, 1);
    graphics.fillRect(70, 280, 620, 53);

    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 8; column += 1) {
        const x = 105 + column * 70;
        const y = 90 + row * 60;
        graphics.fillStyle((row + column) % 4 === 0 ? 0xf4b942 : 0x7393a7, 1);
        graphics.fillRect(x, y, 36, 32);
        graphics.lineStyle(3, 0x705d50, 1);
        graphics.strokeRect(x, y, 36, 32);
      }
    }

    graphics.fillStyle(0x4d6671, 1);
    graphics.fillRect(342, 280, 78, 53);
    this.addObstacle(70, 55, 620, 278);
  }

  private drawHawker(graphics: Phaser.GameObjects.Graphics): void {
    graphics.fillStyle(0x5f5147, 0.18);
    graphics.fillRect(1060, 92, 440, 290);
    graphics.fillStyle(0xe9d9bd, 1);
    graphics.fillRect(1035, 70, 440, 285);
    graphics.fillStyle(0x287271, 1);
    graphics.fillRect(1018, 55, 474, 30);

    for (let column = 0; column < 4; column += 1) {
      const x = 1070 + column * 95;
      graphics.fillStyle(column % 2 === 0 ? 0xd36b5f : 0xe2a84a, 1);
      graphics.fillRect(x, 120, 72, 28);
      graphics.fillStyle(0x5b4a42, 1);
      graphics.fillRect(x, 148, 72, 70);
      graphics.fillStyle(0xf4e8cf, 1);
      graphics.fillRect(x + 8, 159, 56, 32);
    }
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
      fontFamily: "ui-monospace, monospace",
      fontSize: "12px",
      fontStyle: "bold",
      backgroundColor: "#173f4fe8",
      padding: { x: 6, y: 3 },
    }).setOrigin(0.5, 0).setDepth(depth);
  }

  private drawTree(graphics: Phaser.GameObjects.Graphics, x: number, y: number): void {
    graphics.fillStyle(0x76563e, 1);
    graphics.fillRect(x - 5, y, 10, 32);
    graphics.fillStyle(0x3d7750, 1);
    graphics.fillCircle(x - 14, y - 5, 25);
    graphics.fillCircle(x + 15, y - 8, 28);
    graphics.fillCircle(x, y - 25, 30);
  }

  private addMapLabel(x: number, y: number, text: string): void {
    this.add.text(x, y, text, {
      color: "#173f4f",
      fontFamily: "ui-monospace, monospace",
      fontSize: "15px",
      fontStyle: "bold",
      backgroundColor: "#f7edcfdd",
      padding: { x: 8, y: 5 },
    }).setDepth(y + 1);
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
          fontSize: "13px",
          fontStyle: "bold",
          backgroundColor: "#173f4fe8",
          padding: { x: 6, y: 3 },
        })
        .setOrigin(0.5, 1);
      const bubble = this.add
        .text(definition.x, definition.y - 66, definition.greeting, {
          color: "#173f4f",
          fontFamily: "system-ui, sans-serif",
          fontSize: "13px",
          backgroundColor: "#fff8e8f2",
          padding: { x: 9, y: 6 },
          wordWrap: { width: 210 },
          align: "center",
        })
        .setOrigin(0.5, 1)
        .setAlpha(0);

      this.residents.push({
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
      });
    }
  }

  private updateResidents(time: number, delta: number): void {
    const step = delta / 1000;

    for (const resident of this.residents) {
      if (time >= resident.pauseUntil) {
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

      const near =
        Phaser.Math.Distance.Between(this.player.x, this.player.y, x, resident.position.y) <
        BUBBLE_DISTANCE;
      if (near !== resident.bubbleVisible) {
        resident.bubbleVisible = near;
        if (near) resident.sprite.setFlipX(this.player.x < x);
        this.tweens.add({
          targets: resident.bubble,
          alpha: near ? 1 : 0,
          duration: 220,
          ease: "Sine.easeOut",
        });
      }
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
        fontFamily: "ui-monospace, monospace",
        fontSize: "15px",
        fontStyle: "bold",
      }).setOrigin(0.5).setDepth(interaction.y + 31);
      const label = this.add.text(interaction.x, interaction.y + 22, interaction.shortLabel, {
        color: "#173f4f",
        fontFamily: "system-ui, sans-serif",
        fontSize: "13px",
        fontStyle: "bold",
        backgroundColor: "#fff8e8e6",
        padding: { x: 5, y: 3 },
      }).setOrigin(0.5, 0).setDepth(interaction.y + 32);

      this.markers.set(interaction.id, { ring, badge, label });
    }
  }

  private updateNearbyInteraction(force: boolean): void {
    let nearest: WorldInteraction | null = null;
    let nearestDistance = INTERACTION_DISTANCE;

    for (const interaction of WORLD_INTERACTIONS) {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        interaction.x,
        interaction.y
      );
      if (distance < nearestDistance) {
        nearest = interaction;
        nearestDistance = distance;
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
    else if (x > 1000 && y < 460) area = "Hawker Corner";
    else if (x > 970 && y > 560) area = "Community Garden";
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
