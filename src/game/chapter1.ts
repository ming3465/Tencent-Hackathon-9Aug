/**
 * Chapter 1 – Neighbourhood Keepsakes
 *
 * Six placeholder pairs using simple emoji symbols.
 * These stand in for Singapore keepsake artwork to be supplied in a later phase.
 * Content is data-driven so chapters can be added without changing engine code.
 */

export interface CardDefinition {
  /** Unique identifier for the pair (two cards share the same pairId). */
  pairId: string;
  /** Display symbol or placeholder label for the front face. */
  symbol: string;
  /** Accessible name read by screen readers. */
  label: string;
}

/** Six pairs = twelve cards on the board. */
export const CHAPTER_1_PAIRS: CardDefinition[] = [
  { pairId: "kite",       symbol: "🪁", label: "Singapore kite" },
  { pairId: "lamp",       symbol: "🏮", label: "Red paper lantern" },
  { pairId: "flower",     symbol: "🌸", label: "Blooming flower" },
  { pairId: "boat",       symbol: "⛵", label: "Bumboat" },
  { pairId: "fan",        symbol: "🪭", label: "Traditional fan" },
  { pairId: "peranakan",  symbol: "🏺", label: "Peranakan pot" },
];

export const CHAPTER_1_NAME = "Neighbourhood Keepsakes";
