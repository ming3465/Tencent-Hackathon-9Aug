/**
 * Playable isometric estate: physics in world space, rendering in iso space.
 *
 * This is the piece that makes the isometric rebuild affordable. Phaser's
 * Arcade physics is axis-aligned-bounding-box only and has no isometric mode,
 * so a "real" isometric physics world would mean re-authoring all 22 doors,
 * every building collider, all three shelters and the eight NPC routes by
 * hand — and re-deriving every literal coordinate the unit tests pin.
 *
 * Instead the simulation stays exactly as authored: an axis-aligned top-down
 * world of 2560x1600. A hidden physics body moves through it and collides
 * with the untouched `estateLayout` rectangles. Each frame the *visible*
 * sprite is placed at the projection of the body's position. Nothing in the
 * layout module moves, so nothing in `worldLayout.test.ts` or
 * `campaign.test.ts` needs to change.
 *
 * The only genuinely isometric parts are the input mapping — screen-aligned
 * arrow keys become diagonal world motion — and depth, which sorts on
 * (x + y) instead of y alone.
 */

import Phaser from "phaser";

import {
  DOOR_DEFINITIONS,
  ESTATE_BUILDING_COLLISION_ZONES,
  ESTATE_LANDSCAPING,
  ESTATE_TREES,
  ESTATE_WORLD_BOUNDS,
  type DoorDefinition,
  type EstateRect,
} from "../estateLayout.js";
import { isoDepth, worldToIso } from "./projection.js";

/** Matches the shipped walk speed so movement feel is unchanged. */
export const ISO_WALK_SPEED = 215;

/** How close the player must be to a door approach point to interact. */
export const ISO_INTERACTION_DISTANCE = 112;

export interface IsoSpriteBinding {
  /** The visible sprite, positioned in iso space. */
  view: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image;
  /** World-space anchor driving both projection and depth. */
  worldX: number;
  worldY: number;
  layer: number;
}

/**
 * Screen-aligned input mapped into world space.
 *
 * Pressing "up" should move the player up the screen. Screen y is
 * (worldX + worldY) * 0.25, so up-screen means decreasing both world axes —
 * a diagonal in world terms. Without this remap the controls feel rotated
 * 45 degrees, which is the classic isometric control bug.
 */
export function isoInputToWorld(
  inputX: number,
  inputY: number,
): { x: number; y: number } {
  // Guard NaN as well as zero. A missing key binding yields NaN, which would
  // otherwise propagate into the velocity and corrupt the body position
  // irrecoverably — the failure mode is silent and total.
  if (!Number.isFinite(inputX) || !Number.isFinite(inputY)) return { x: 0, y: 0 };
  if (inputX === 0 && inputY === 0) return { x: 0, y: 0 };
  // screen right => (+1,-1); screen down => (+1,+1)
  const worldX = inputX + inputY;
  const worldY = inputY - inputX;
  const length = Math.hypot(worldX, worldY);
  return { x: worldX / length, y: worldY / length };
}

/** Every static collider the estate defines, in world space. */
export function isoWorldColliders(): readonly EstateRect[] {
  const rects: EstateRect[] = [...ESTATE_BUILDING_COLLISION_ZONES];
  for (const tree of ESTATE_TREES) rects.push(tree.trunkCollider);
  for (const item of ESTATE_LANDSCAPING) rects.push(item.collider);
  return rects;
}

/** Estate doors, which are the interaction targets in the exterior. */
export function isoEstateDoors(): readonly DoorDefinition[] {
  return DOOR_DEFINITIONS.filter(
    (definition) => definition.sourceLocationId === "estate",
  );
}

/**
 * Nearest door approach point within reach of a world position, or null.
 * Mirrors the shipped `updateNearbyInteraction` distance rule so the iso
 * scene reports the same prompt the top-down scene would.
 */
export function nearestIsoDoor(
  worldX: number,
  worldY: number,
): DoorDefinition | null {
  let nearest: DoorDefinition | null = null;
  let nearestDistance = ISO_INTERACTION_DISTANCE * ISO_INTERACTION_DISTANCE;
  for (const door of isoEstateDoors()) {
    const dx = worldX - door.approachPoint.x;
    const dy = worldY - door.approachPoint.y;
    const distance = dx * dx + dy * dy;
    if (distance < nearestDistance) {
      nearest = door;
      nearestDistance = distance;
    }
  }
  return nearest;
}

/**
 * Keeps a visible sprite locked to its world anchor.
 *
 * Called for anything that moves; static props are placed once and never
 * need re-syncing because their world anchor does not change.
 */
export function syncIsoSprite(
  binding: IsoSpriteBinding,
  originX: number,
  originY: number,
): void {
  const point = worldToIso(binding.worldX, binding.worldY);
  binding.view.setPosition(point.x + originX, point.y + originY);
  binding.view.setDepth(isoDepth(binding.worldX, binding.worldY, binding.layer));
}

/**
 * Axis-separated AABB collision resolution in world space.
 *
 * Deliberately not Phaser Arcade. Arcade static bodies built from `Shape`
 * game objects silently report zero extent — they appear in the group and
 * count as colliders while never blocking anything, which is a failure mode
 * that looks like success. This is a pure function instead: no scene, no
 * bodies, no framework state, and directly unit-testable.
 *
 * Each axis is resolved separately so the player slides along a wall rather
 * than sticking to it, which is the behaviour the shipped top-down game has.
 */
export function resolveIsoMovement(
  currentX: number,
  currentY: number,
  deltaX: number,
  deltaY: number,
  colliders: readonly EstateRect[],
  halfWidth = 11,
  halfHeight = 9,
): { x: number; y: number; blockedX: boolean; blockedY: boolean } {
  const overlaps = (x: number, y: number, rect: EstateRect): boolean =>
    x + halfWidth > rect.x &&
    x - halfWidth < rect.x + rect.width &&
    y + halfHeight > rect.y &&
    y - halfHeight < rect.y + rect.height;

  let nextX = currentX + deltaX;
  let blockedX = false;
  for (const rect of colliders) {
    if (!overlaps(nextX, currentY, rect)) continue;
    blockedX = true;
    nextX =
      deltaX > 0
        ? rect.x - halfWidth
        : rect.x + rect.width + halfWidth;
    break;
  }

  let nextY = currentY + deltaY;
  let blockedY = false;
  for (const rect of colliders) {
    if (!overlaps(nextX, nextY, rect)) continue;
    blockedY = true;
    nextY =
      deltaY > 0
        ? rect.y - halfHeight
        : rect.y + rect.height + halfHeight;
    break;
  }

  return { x: nextX, y: nextY, blockedX, blockedY };
}

/** Clamps a world position inside the estate bounds. */
export function clampToEstate(worldX: number, worldY: number): {
  x: number;
  y: number;
} {
  return {
    x: Math.max(
      ESTATE_WORLD_BOUNDS.x + 8,
      Math.min(ESTATE_WORLD_BOUNDS.x + ESTATE_WORLD_BOUNDS.width - 8, worldX),
    ),
    y: Math.max(
      ESTATE_WORLD_BOUNDS.y + 8,
      Math.min(ESTATE_WORLD_BOUNDS.y + ESTATE_WORLD_BOUNDS.height - 8, worldY),
    ),
  };
}

/**
 * Facing for the four-frame walk cycle, derived from world velocity.
 *
 * The sprite sheets are authored for a top-down world, so the mapping goes
 * through screen space: a world vector is projected, and the dominant screen
 * axis picks the frame. This is why the existing character art reads
 * correctly in the isometric view without redrawing the facings.
 */
export function isoFacingFor(
  velocityX: number,
  velocityY: number,
): { facing: "down" | "up" | "side"; flipX: boolean } {
  const screenX = (velocityX - velocityY) * 0.5;
  const screenY = (velocityX + velocityY) * 0.25;
  if (Math.abs(screenX) > Math.abs(screenY) * 1.1) {
    return { facing: "side", flipX: screenX < 0 };
  }
  return { facing: screenY < 0 ? "up" : "down", flipX: false };
}
