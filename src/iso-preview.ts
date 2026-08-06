/**
 * Stage 0 vertical slice for the isometric art direction.
 *
 * Standalone on purpose: it imports the iso modules and the existing art
 * texture factory, but touches none of the shipped campaign wiring. That keeps
 * the live build green while the art direction is evaluated, and it means this
 * file can simply be deleted if the slice does not beat the current look.
 *
 * Served by `vite dev` at /iso-preview.html — no vite config change needed.
 */

import Phaser from "phaser";

import { ensureCampaignArtTextures } from "./game/campaignArt.js";
import { ESTATE_BUILDINGS, ESTATE_TREES, ESTATE_LANDSCAPING } from "./game/estateLayout.js";
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

/**
 * Whole world, so the camera can sit inside the projected diamond and the
 * frame fills with ground rather than showing the backdrop past its corners.
 */
const SLICE = { x: 0, y: 0, width: 2560, height: 1600 };

/** World point the preview camera looks at: the central courtyard. */
const FOCUS = { x: 1150, y: 620 };

class IsoPreviewScene extends Phaser.Scene {
  constructor() {
    super("iso-preview");
  }

  create(): void {
    ensureCampaignArtTextures(this);
    ensureIsoPropTextures(this);
    ensureIsoCharacterTextures(this);

    const canvas = isoCanvasForWorld(SLICE.width, SLICE.height);
    const originX = canvas.originX;
    const originY = 40;

    // --- Ground plane, baked once ---
    const ground = this.make.graphics({ x: 0, y: 0 });
    paintIsoTerrain(ground, {
      worldX: SLICE.x,
      worldY: SLICE.y,
      worldWidth: SLICE.width,
      worldHeight: SLICE.height,
      originX,
      originY,
    });
    ground.generateTexture("iso-ground-flat", canvas.width, canvas.height + 80);
    ground.destroy();
    // Graphics can only lay down flat fills; the grain pass adds the
    // continuous per-pixel variation the reference art has.
    const groundKey = bakeWithGrain(
      this,
      "iso-ground-flat",
      "iso-ground",
      canvas.width,
      canvas.height + 80,
      { amplitude: 5, falloff: 0.2 },
    );
    this.add.image(0, 0, groundKey).setOrigin(0).setDepth(0);

    // --- Buildings: projected volumes, depth-sorted by footprint front edge ---
    // Each is baked into a texture cropped to its own artwork bounds, then run
    // through the same grain pass as the ground so walls and roofs carry
    // continuous variation instead of flat planes.
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
        { amplitude: 4, falloff: 0.1 },
      );
      this.add
        .image(box.left + originX, box.top + originY, key)
        .setOrigin(0)
        .setDepth(isoDepth(x + width, y + height, 2));
    }

    // --- Props and characters stay upright billboards on the iso ground ---
    // This is how the reference art works too: only terrain and buildings are
    // projected. It means every existing sprite is reusable unchanged.
    const place = (worldX: number, worldY: number, texture: string, layer = 4): void => {
      if (!this.textures.exists(texture)) return;
      const point = worldToIso(worldX, worldY);
      this.add
        .sprite(point.x + originX, point.y + originY, texture)
        .setOrigin(0.5, 1)
        .setDepth(isoDepth(worldX, worldY, layer));
    };

    // Isometric prop and character forms bake their own contact shadow, so no separate
    // shadow ellipse here — one shadow per object, as ACCESSIBILITY.md requires.
    for (const tree of ESTATE_TREES) {
      place(tree.anchor.x, tree.anchor.y, isoTextureFor(tree.texture), 5);
    }

    for (const item of ESTATE_LANDSCAPING) {
      place(item.anchor.x, item.anchor.y, isoTextureFor(item.texture), 3);
    }

    // Courtyard furniture at the shipped story-cluster positions. This is what
    // carries the "somebody lives here" read in the reference art — chess
    // players mid-game, stacked chairs, a notice board, a pergola.
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
      place(worldX, worldY, texture, 4);
    }

    // A handful of residents mid-activity, matching the reference's read of
    // "elders doing things" rather than an empty courtyard.
    const cast: [number, number, string][] = [
      [430, 520, "npc-mei-down-0"],
      [520, 560, "npc-ravi-side-0"],
      [640, 610, "npc-siti-down-0"],
      [980, 470, "npc-yusof-side-0"],
      [1180, 640, "npc-meng-down-0"],
      [300, 700, "npc-seng-side-0"],
    ];
    for (const [worldX, worldY, texture] of cast) {
      place(worldX, worldY, isoCharacterTextureFor(texture), 4);
    }

    place(760, 560, isoCharacterTextureFor("campaign-player-down-0"), 4);

    const focus = worldToIso(FOCUS.x, FOCUS.y);
    this.cameras.main.setBackgroundColor("#5c6b3f");
    this.cameras.main.setZoom(1.25);
    this.cameras.main.centerOn(focus.x + originX, focus.y + originY);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "iso-stage",
  width: 1280,
  height: 720,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: "#6f7f4a",
  scene: [IsoPreviewScene],
});
