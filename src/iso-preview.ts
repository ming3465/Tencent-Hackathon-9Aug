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
import { paintIsoBuilding } from "./game/iso/isoBuildings.js";
import { isoCanvasForWorld, isoDepth, worldToIso } from "./game/iso/projection.js";

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
    ground.generateTexture("iso-ground", canvas.width, canvas.height + 80);
    ground.destroy();
    this.add.image(0, 0, "iso-ground").setOrigin(0).setDepth(0);

    // --- Buildings: projected volumes, depth-sorted by footprint front edge ---
    // Drawn as live Graphics rather than baked textures: a per-building texture
    // would each be the size of the whole canvas, so eight of them would cost
    // ~18M pixels. Stage 1 should bake them into cropped textures instead.
    for (const definition of ESTATE_BUILDINGS) {
      const { x, y, width, height } = definition.bounds;
      const graphics = this.add.graphics();
      paintIsoBuilding(graphics, definition, originX, originY);
      graphics.setDepth(isoDepth(x + width, y + height, 2));
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

    const shadow = (worldX: number, worldY: number, radius: number): void => {
      const point = worldToIso(worldX, worldY);
      this.add
        .ellipse(point.x + originX, point.y + originY, radius, radius * 0.5, 0x2f2a1e, 0.28)
        .setDepth(isoDepth(worldX, worldY, 1));
    };

    for (const tree of ESTATE_TREES) {
      if (tree.anchor.x > SLICE.x + SLICE.width || tree.anchor.y > SLICE.y + SLICE.height) {
        continue;
      }
      shadow(tree.anchor.x + 20, tree.anchor.y + 12, 96);
      place(tree.anchor.x, tree.anchor.y, tree.texture, 5);
    }

    for (const item of ESTATE_LANDSCAPING) {
      if (item.anchor.x > SLICE.x + SLICE.width || item.anchor.y > SLICE.y + SLICE.height) {
        continue;
      }
      shadow(item.anchor.x + 10, item.anchor.y + 6, 54);
      place(item.anchor.x, item.anchor.y, item.texture, 3);
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
      shadow(worldX, worldY, 34);
      place(worldX, worldY, texture, 4);
    }

    shadow(760, 560, 34);
    place(760, 560, "campaign-player-down-0", 4);

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
