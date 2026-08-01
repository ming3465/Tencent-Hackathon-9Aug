/**
 * Typed configuration for the Kampung SG matching game.
 * All timing values are in milliseconds.
 * Override these values to tune game balance without editing logic.
 */
export interface GameConfig {
  /** Number of unique pairs per chapter. */
  pairCount: number;
  /** Duration cards are shown face-up before the round starts (preview phase). */
  previewDurationMs: number;
  /** Delay before mismatched cards are turned back over. */
  mismatchDelayMs: number;
  /** Reserved for a future hint system; not used in Phase 1. */
  hintDelayMs: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  pairCount: 6,
  previewDurationMs: 0,   // Phase 1: no preview; set >0 in a later phase
  mismatchDelayMs: 1000,
  hintDelayMs: 30000,
};
