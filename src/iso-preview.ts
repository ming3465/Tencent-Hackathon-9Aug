/**
 * Isometric art-direction slice — now playable (Stage 3).
 *
 * Standalone on purpose: it imports the iso modules and the existing art
 * texture factory, but touches none of the shipped campaign wiring. The live
 * build stays green while the art direction is evaluated, and this file can
 * be deleted outright if the direction is dropped.
 *
 * Served by `vite dev` at /iso-preview.html — no vite config change needed.
 */

import Phaser from "phaser";

import { ensureCampaignArtTextures } from "./game/campaignArt.js";
import {
  ESTATE_BUILDINGS,
  ESTATE_TREES,
  ESTATE_LANDSCAPING,
  type EstateRect,
} from "./game/estateLayout.js";
import { paintIsoTerrain } from "./game/iso/isoTerrain.js";
import {
  isoBuildingTextureBounds,
  paintIsoBuilding,
} from "./game/iso/isoBuildings.js";
import { ensureIsoPropTextures, isoTextureFor } from "./game/iso/isoProps.js";
import {
  ensureIsoCharacterTextures,
  isoCharacterTextureFor,
} from "./game/iso/isoCharacters.js";
import { isoCanvasForWorld, isoDepth, worldToIso } from "./game/iso/projection.js";
import { bakeWithGrain } from "./game/iso/isoGrain.js";
import {
  clampToEstate,
  isoFacingFor,
  isoInputToWorld,
  isoWorldColliders,
  ISO_WALK_SPEED,
  nearestIsoDoor,
  resolveIsoMovement,
} from "./game/iso/isoWorld.js";

const SLICE = { x: 0, y: 0, width: 2560, height: 1600 };
const SPAWN = { x: 1150, y: 620 };

class IsoPreviewScene extends Phaser.Scene {
  private originX = 0;
  private originY = 40;
  /** Simulated position in top-down world space. Never drawn. */
  private worldX = SPAWN.x;
  private worldY = SPAWN.y;
  /** Visible sprite drawn at the projection of the body. */
  private avatar!: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>;
  private walkPhase = 0;
  private promptText!: Phaser.GameObjects.Text;
  private colliderCount = 0;
  private colliders: readonly EstateRect[] = [];

  constructor() {
    super("iso-preview");
  }

  create(): void {
    ensureCampaignArtTextures(this);
    ensureIsoPropTextures(this);
    ensureIsoCharacterTextures(this);

    const canvas = isoCanvasForWorld(SLICE.width, SLICE.height);
    this.originX = canvas.originX;

    this.paintGround(canvas);
    this.paintBuildings();
    this.placeStaticProps();
    this.createPlayer();
    this.createColliders();
    this.createCamera(canvas);
    this.createPrompt();
  }

  private paintGround(canvas: { width: number; height: number }): void {
    const ground = this.make.graphics({ x: 0, y: 0 });
    paintIsoTerrain(ground, {
      worldX: SLICE.x,
      worldY: SLICE.y,
      worldWidth: SLICE.width,
      worldHeight: SLICE.height,
      originX: this.originX,
      originY: this.originY,
    });
    ground.generateTexture("iso-ground-flat", canvas.width, canvas.height + 80);
    ground.destroy();
    // Graphics can only lay down flat fills; the grain pass adds the
    // continuous per-pixel variation the reference art has.
    const key = bakeWithGrain(
      this,
      "iso-ground-flat",
      "iso-ground",
      canvas.width,
      canvas.height + 80,
      { amplitude: 9, falloff: 0.22 },
    );
    this.add.image(0, 0, key).setOrigin(0).setDepth(0);
  }

  private paintBuildings(): void {
    for (const definition of ESTATE_BUILDINGS) {
      const { x, y, width, height } = definition.bounds;
      const box = isoBuildingTextureBounds(definition);
      const graphics = this.make.graphics({ x: 0, y: 0 });
      paintIsoBuilding(graphics, definition, -box.left, -box.top);
      const flatKey = `iso-building-flat:${definition.id}`;
      if (this.textures.exists(flatKey)) this.textures.remove(flatKey);
      graphics.generateTexture(flatKey, box.width, box.height);
      graphics.destroy();
      const key = bakeWithGrain(
        this,
        flatKey,
        `iso-building:${definition.id}`,
        box.width,
        box.height,
        { amplitude: 8, falloff: 0.12 },
      );
      this.add
        .image(box.left + this.originX, box.top + this.originY, key)
        .setOrigin(0)
        .setDepth(isoDepth(x + width, y + height, 2));
    }
  }

  /** Props and characters are upright billboards standing on the iso ground. */
  private place(worldX: number, worldY: number, texture: string, layer = 4): void {
    if (!this.textures.exists(texture)) return;
    const point = worldToIso(worldX, worldY);
    this.add
      .sprite(point.x + this.originX, point.y + this.originY, texture)
      .setOrigin(0.5, 1)
      .setDepth(isoDepth(worldX, worldY, layer));
  }

  private placeStaticProps(): void {
    for (const tree of ESTATE_TREES) {
      this.place(tree.anchor.x, tree.anchor.y, isoTextureFor(tree.texture), 5);
    }
    for (const item of ESTATE_LANDSCAPING) {
      this.place(item.anchor.x, item.anchor.y, isoTextureFor(item.texture), 3);
    }
    const furniture: [number, number, string][] = [
      [1580, 735, "iso-chess-table"],
      [2200, 775, "iso-chess-table"],
      [530, 325, "iso-chair-stack"],
      [1580, 325, "iso-chair-stack"],
      [1490, 735, "iso-cleaning-cart"],
      [1150, 1060, "iso-cleaning-cart"],
      [860, 690, "iso-notice-board"],
      [1760, 1010, "iso-notice-board"],
      [640, 980, "iso-bike-rack"],
      [1980, 620, "iso-bike-rack"],
      [980, 1180, "iso-shaded-seating"],
      [1720, 1220, "iso-shaded-seating"],
    ];
    for (const [worldX, worldY, texture] of furniture) {
      this.place(worldX, worldY, texture, 4);
    }
    const cast: [number, number, string][] = [
      [430, 520, "npc-mei-down-0"],
      [520, 560, "npc-ravi-side-0"],
      [640, 610, "npc-siti-down-0"],
      [980, 470, "npc-yusof-side-0"],
      [1180, 640, "npc-meng-down-0"],
      [300, 700, "npc-seng-side-0"],
    ];
    for (const [worldX, worldY, texture] of cast) {
      this.place(worldX, worldY, isoCharacterTextureFor(texture), 4);
    }
  }

  /**
   * The physics body lives in top-down world space and is never drawn. The
   * avatar is a plain sprite repositioned to the body's projection each frame.
   */
  private createPlayer(): void {
    this.avatar = this.add
      .sprite(0, 0, "iso-player-down-0")
      .setOrigin(0.5, 1)
      .setDepth(isoDepth(SPAWN.x, SPAWN.y, 4));

    if (!this.input.keyboard) return;
    this.cursors = this.input.keyboard.createCursorKeys();
    // Must be the object form: the string form returns keys named W/A/S/D,
    // which would leave `keys.up` undefined and turn the input into NaN.
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as typeof this.keys;
  }

  /** Collider rectangles straight from the untouched estate layout. */
  private createColliders(): void {
    this.colliders = isoWorldColliders();
    this.colliderCount = this.colliders.length;
  }

  private createCamera(canvas: { width: number; height: number }): void {
    this.cameras.main.setBackgroundColor("#5c6b3f");
    this.cameras.main.setZoom(1.25);
    this.cameras.main.setBounds(0, 0, canvas.width, canvas.height + 80);
  }

  private createPrompt(): void {
    this.promptText = this.add
      .text(640, 668, "", {
        color: "#fff6dc",
        backgroundColor: "#173f4fdd",
        fontFamily: "system-ui, sans-serif",
        fontSize: "17px",
        padding: { x: 12, y: 7 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1_000_000);
  }

  update(_time: number, delta: number): void {
    if (!this.avatar) return;

    const inputX =
      Number(this.cursors?.right.isDown || this.keys?.right?.isDown) -
      Number(this.cursors?.left.isDown || this.keys?.left?.isDown);
    const inputY =
      Number(this.cursors?.down.isDown || this.keys?.down?.isDown) -
      Number(this.cursors?.up.isDown || this.keys?.up?.isDown);

    // Screen-aligned keys become diagonal world motion.
    const direction = isoInputToWorld(inputX, inputY);
    const step = (delta / 1000) * ISO_WALK_SPEED;
    const moved = resolveIsoMovement(
      this.worldX,
      this.worldY,
      direction.x * step,
      direction.y * step,
      this.colliders,
    );
    const clamped = clampToEstate(moved.x, moved.y);
    this.worldX = clamped.x;
    this.worldY = clamped.y;

    const moving = direction.x !== 0 || direction.y !== 0;
    if (moving) this.walkPhase += (delta / 1000) * 7;

    const { facing, flipX } = isoFacingFor(direction.x, direction.y);
    const frame = moving ? Math.floor(this.walkPhase) % 4 : 0;
    const key = `iso-player-${facing}-${frame}`;
    if (this.textures.exists(key)) this.avatar.setTexture(key);
    this.avatar.setFlipX(flipX);

    // Project the simulated position onto the isometric view.
    const point = worldToIso(this.worldX, this.worldY);
    this.avatar.setPosition(point.x + this.originX, point.y + this.originY);
    this.avatar.setDepth(isoDepth(this.worldX, this.worldY, 4));
    this.cameras.main.centerOn(
      point.x + this.originX,
      point.y + this.originY,
    );

    const door = nearestIsoDoor(this.worldX, this.worldY);
    this.promptText.setText(door ? door.label : "");

    // Probe hook for automated verification of movement, collision and
    // door proximity. Mirrors the shipped scene's smoke snapshot idea.
    (window as unknown as { __isoProbe?: unknown }).__isoProbe = {
      world: { x: this.worldX, y: this.worldY },
      iso: { x: point.x + this.originX, y: point.y + this.originY },
      facing,
      moving,
      nearbyDoor: door?.id ?? null,
      nearbyLabel: door?.label ?? null,
      colliderCount: this.colliderCount,
      blocked: { x: moved.blockedX, y: moved.blockedY },
    };
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "iso-stage",
  width: 1280,
  height: 720,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: "#5c6b3f",
  scene: [IsoPreviewScene],
});
