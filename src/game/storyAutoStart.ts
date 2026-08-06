/**
 * Whether an authored story beat should open itself as the player walks up.
 *
 * The story is the point of the game, but it used to be gated behind guessing
 * which neighbour was holding the next scene and pressing a key at them. Main
 * story beats now open on approach.
 *
 * The decision is a pure function so the conditions that keep it from being
 * intrusive - never over an open dialogue, never on a paused game, never
 * before the player has actually walked - are testable without a browser.
 */

import type { NpcIntentKind } from "./campaignTypes.js";

export interface StoryAutoStartContext {
  /** Kind of the intent the NPC would open right now. */
  intentKind: NpcIntentKind;
  /** Stable `npcId:intentId` key for beats already opened this run. */
  beatKey: string;
  firedBeats: ReadonlySet<string>;
  dialogueOpen: boolean;
  paused: boolean;
  /** The world screen is showing (not the title, not a loader). */
  inWorld: boolean;
  /**
   * The player has taken a step since this location loaded.
   *
   * Spawning inside someone's radius is not approaching them: without this a
   * dialogue appears before the player has seen the room or pressed a key.
   */
  hasWalked: boolean;
}

export function shouldAutoStartStoryBeat(
  context: StoryAutoStartContext,
): boolean {
  // Only authored main-story scenes. Requests, greetings and clues stay
  // player-initiated, so walking near someone never spends a choice for them.
  if (context.intentKind !== "main-story") return false;
  if (context.dialogueOpen) return false;
  if (context.paused) return false;
  if (!context.inWorld) return false;
  if (!context.hasWalked) return false;
  return !context.firedBeats.has(context.beatKey);
}
