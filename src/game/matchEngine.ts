/**
 * matchEngine.ts
 *
 * Pure matching-game logic. No Phaser import. No DOM access.
 * All functions are deterministic and fully unit-testable.
 */

import type { CardDefinition } from "./chapter1.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CardState = "face-down" | "face-up" | "matched";

export interface Card {
  id: number;
  pairId: string;
  symbol: string;
  label: string;
  state: CardState;
}

export type GameMode = "solo" | "together";

export interface EngineState {
  cards: Card[];
  mode: GameMode;
  /** Index of the current player (0 = Player 1, 1 = Player 2). Only used in Together Mode. */
  currentPlayer: 0 | 1;
  /** IDs of the (up to two) face-up, unmatched cards. */
  selection: number[];
  /** Whether the board is locked while a mismatch delay is running. */
  locked: boolean;
  /** Number of matched pairs found so far. */
  matchedPairs: number;
  /** Total pairs on the board. */
  totalPairs: number;
}

// ─── Seeded PRNG (mulberry32) ─────────────────────────────────────────────────

/**
 * Returns a deterministic pseudo-random number generator seeded with `seed`.
 * Determinism is required so shuffle outcomes can be reproduced in unit tests.
 */
export function createPrng(seed: number): () => number {
  let s = seed >>> 0;
  return (): number => {
    s += 0x6d2b79f5;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000;
  };
}

// ─── Shuffle ──────────────────────────────────────────────────────────────────

/**
 * Returns a new array that is a Fisher-Yates shuffle of `arr`.
 * Uses the supplied `rand` function so tests can supply a seeded PRNG.
 */
export function shuffleArray<T>(arr: T[], rand: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ─── Board creation ───────────────────────────────────────────────────────────

/**
 * Builds a shuffled board of Cards from a list of pair definitions.
 * Each pair produces exactly two Card entries with unique sequential IDs.
 */
export function createBoard(
  pairs: CardDefinition[],
  rand: () => number
): Card[] {
  const doubled: Omit<Card, "id" | "state">[] = pairs.flatMap((p) => [
    { pairId: p.pairId, symbol: p.symbol, label: p.label },
    { pairId: p.pairId, symbol: p.symbol, label: p.label },
  ]);
  const shuffled = shuffleArray(doubled, rand);
  return shuffled.map((c, i) => ({ ...c, id: i, state: "face-down" }));
}

// ─── Engine factory ───────────────────────────────────────────────────────────

export function createEngine(
  pairs: CardDefinition[],
  mode: GameMode,
  rand: () => number
): EngineState {
  return {
    cards: createBoard(pairs, rand),
    mode,
    currentPlayer: 0,
    selection: [],
    locked: false,
    matchedPairs: 0,
    totalPairs: pairs.length,
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function isComplete(state: EngineState): boolean {
  return state.matchedPairs === state.totalPairs;
}

// ─── Mutations (return new state, never mutate) ───────────────────────────────

/**
 * Flips a card face-up and updates the selection.
 * Returns null if the flip is not allowed (card already matched / face-up, or board locked, or two cards already selected).
 */
export function flipCard(
  state: EngineState,
  cardId: number
): EngineState | null {
  if (state.locked) return null;
  if (state.selection.length >= 2) return null;

  const card = state.cards.find((c) => c.id === cardId);
  if (!card) return null;
  if (card.state !== "face-down") return null;

  const updatedCards = state.cards.map((c) =>
    c.id === cardId ? { ...c, state: "face-up" as CardState } : c
  );
  return {
    ...state,
    cards: updatedCards,
    selection: [...state.selection, cardId],
  };
}

export interface FlipResult {
  kind: "matched" | "mismatch" | "waiting";
  state: EngineState;
}

/**
 * Evaluates the current selection when two cards are face-up.
 * - "waiting": only one card selected; no evaluation yet.
 * - "matched": pair found; cards stay face-up as matched.
 * - "mismatch": not a pair; caller must call `resolveMismatch` after the delay.
 *
 * Together Mode rule: match → same player keeps the turn; mismatch → turn changes.
 */
export function evaluateSelection(state: EngineState): FlipResult {
  if (state.selection.length < 2) {
    return { kind: "waiting", state };
  }

  const [idA, idB] = state.selection;
  const cardA = state.cards.find((c) => c.id === idA)!;
  const cardB = state.cards.find((c) => c.id === idB)!;

  if (cardA.pairId === cardB.pairId) {
    // Match
    const updatedCards = state.cards.map((c) =>
      c.id === idA || c.id === idB ? { ...c, state: "matched" as CardState } : c
    );
    return {
      kind: "matched",
      state: {
        ...state,
        cards: updatedCards,
        selection: [],
        locked: false,
        matchedPairs: state.matchedPairs + 1,
        // Turn does not change on a match.
      },
    };
  } else {
    // Mismatch — lock the board until resolveMismatch is called.
    return {
      kind: "mismatch",
      state: { ...state, locked: true },
    };
  }
}

/**
 * Called after the mismatch delay has elapsed.
 * Turns mismatched cards back face-down and advances the turn (Together Mode).
 */
export function resolveMismatch(state: EngineState): EngineState {
  if (!state.locked || state.selection.length !== 2) {
    return state;
  }

  const [idA, idB] = state.selection;
  const updatedCards = state.cards.map((c) =>
    c.id === idA || c.id === idB ? { ...c, state: "face-down" as CardState } : c
  );
  const nextPlayer: 0 | 1 =
    state.mode === "together" ? (state.currentPlayer === 0 ? 1 : 0) : 0;
  return {
    ...state,
    cards: updatedCards,
    selection: [],
    locked: false,
    currentPlayer: nextPlayer,
  };
}

/**
 * Resets the board to a new shuffle using the supplied `rand`.
 * Mode is preserved.
 */
export function restartGame(
  state: EngineState,
  pairs: CardDefinition[],
  rand: () => number
): EngineState {
  return createEngine(pairs, state.mode, rand);
}

/**
 * Replays the same shuffle by cloning the original board order.
 * Useful for "play again same order" without a new seed.
 */
export function replayGame(state: EngineState): EngineState {
  const resetCards = state.cards.map((c) => ({ ...c, state: "face-down" as CardState }));
  return {
    ...state,
    cards: resetCards,
    currentPlayer: 0,
    selection: [],
    locked: false,
    matchedPairs: 0,
  };
}
