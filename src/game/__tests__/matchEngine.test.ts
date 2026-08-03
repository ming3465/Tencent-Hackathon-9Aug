import { describe, it, expect } from "vitest";
import {
  createPrng,
  shuffleArray,
  createBoard,
  createEngine,
  flipCard,
  evaluateSelection,
  resolveMismatch,
  restartGame,
  replayGame,
  isComplete,
} from "../matchEngine.js";
import { KEEPSAKE_PAIRS as CHAPTER_1_PAIRS } from "../keepsakes.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** A deterministic random source used to get a predictable shuffled order. */
const fixedRand = () => 0;

function matchingCardIds(
  state: ReturnType<typeof createEngine>,
  pairId = state.cards[0].pairId
): [number, number] {
  const cards = state.cards.filter((card) => card.pairId === pairId);
  if (cards.length !== 2) {
    throw new Error(`Expected exactly two cards for pair ${pairId}`);
  }
  return [cards[0].id, cards[1].id];
}

// ─── Seeded shuffle determinism ────────────────────────────────────────────────

describe("shuffleArray", () => {
  it("returns the same order for the same seed", () => {
    const arr = [1, 2, 3, 4, 5, 6];
    const a = shuffleArray(arr, createPrng(42));
    const b = shuffleArray(arr, createPrng(42));
    expect(a).toEqual(b);
  });

  it("returns a different order for a different seed (with very high probability)", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const a = shuffleArray(arr, createPrng(1));
    const b = shuffleArray(arr, createPrng(2));
    expect(a).not.toEqual(b);
  });

  it("does not mutate the original array", () => {
    const original = [1, 2, 3, 4, 5, 6];
    const copy = [...original];
    shuffleArray(original, createPrng(99));
    expect(original).toEqual(copy);
  });

  it("preserves all elements", () => {
    const arr = [1, 2, 3, 4, 5, 6];
    const result = shuffleArray(arr, createPrng(7));
    expect(result.sort()).toEqual([...arr].sort());
  });
});

// ─── Valid pairs on board ─────────────────────────────────────────────────────

describe("createBoard", () => {
  it("produces exactly two cards per pair", () => {
    const board = createBoard(CHAPTER_1_PAIRS, createPrng(1));
    for (const pair of CHAPTER_1_PAIRS) {
      const count = board.filter((c) => c.pairId === pair.pairId).length;
      expect(count).toBe(2);
    }
  });

  it("produces 2 × pairCount cards total", () => {
    const board = createBoard(CHAPTER_1_PAIRS, createPrng(1));
    expect(board).toHaveLength(CHAPTER_1_PAIRS.length * 2);
  });

  it("assigns unique sequential IDs", () => {
    const board = createBoard(CHAPTER_1_PAIRS, createPrng(1));
    const ids = board.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(board.length);
    expect(Math.min(...ids)).toBe(0);
    expect(Math.max(...ids)).toBe(board.length - 1);
  });

  it("all cards start face-down", () => {
    const board = createBoard(CHAPTER_1_PAIRS, createPrng(1));
    expect(board.every((c) => c.state === "face-down")).toBe(true);
  });
});

// ─── Flip card ────────────────────────────────────────────────────────────────

describe("flipCard", () => {
  it("flips a face-down card to face-up", () => {
    const state = createEngine(CHAPTER_1_PAIRS, "solo", createPrng(1));
    const next = flipCard(state, 0)!;
    expect(next.cards[0].state).toBe("face-up");
    expect(next.selection).toEqual([0]);
  });

  it("returns null when the board is locked", () => {
    const state = createEngine(CHAPTER_1_PAIRS, "solo", createPrng(1));
    const locked = { ...state, locked: true };
    expect(flipCard(locked, 0)).toBeNull();
  });

  it("returns null when two cards are already selected", () => {
    let state = createEngine(CHAPTER_1_PAIRS, "solo", createPrng(1));
    state = flipCard(state, 0)!;
    state = flipCard(state, 1)!;
    expect(flipCard(state, 2)).toBeNull();
  });

  it("returns null for an already face-up card", () => {
    let state = createEngine(CHAPTER_1_PAIRS, "solo", createPrng(1));
    state = flipCard(state, 0)!;
    expect(flipCard(state, 0)).toBeNull();
  });
});

// ─── Match ────────────────────────────────────────────────────────────────────

describe("evaluateSelection – match", () => {
  it("marks both cards as matched when pairIds are equal", () => {
    let state = createEngine(CHAPTER_1_PAIRS, "solo", fixedRand);
    const [idA, idB] = matchingCardIds(state);
    state = flipCard(state, idA)!;
    state = flipCard(state, idB)!;
    const result = evaluateSelection(state);
    expect(result.kind).toBe("matched");
    expect(result.state.cards.find((card) => card.id === idA)!.state).toBe("matched");
    expect(result.state.cards.find((card) => card.id === idB)!.state).toBe("matched");
    expect(result.state.matchedPairs).toBe(1);
    expect(result.state.selection).toEqual([]);
    expect(result.state.locked).toBe(false);
  });

  it("does not change the active player on a match (Together Mode)", () => {
    let state = createEngine(CHAPTER_1_PAIRS, "together", fixedRand);
    const [idA, idB] = matchingCardIds(state);
    expect(state.currentPlayer).toBe(0);
    state = flipCard(state, idA)!;
    state = flipCard(state, idB)!;
    const result = evaluateSelection(state);
    expect(result.kind).toBe("matched");
    expect(result.state.currentPlayer).toBe(0);
  });
});

// ─── Mismatch ─────────────────────────────────────────────────────────────────

describe("evaluateSelection – mismatch", () => {
  /** Helper: find two cards with different pairIds on a no-shuffle board. */
  function pickMismatchedPair(state: ReturnType<typeof createEngine>): [number, number] {
    const a = state.cards[0];
    const b = state.cards.find((c) => c.pairId !== a.pairId)!;
    return [a.id, b.id];
  }

  it("locks the board on a mismatch", () => {
    let state = createEngine(CHAPTER_1_PAIRS, "solo", fixedRand);
    const [idA, idB] = pickMismatchedPair(state);
    state = flipCard(state, idA)!;
    state = flipCard(state, idB)!;
    const result = evaluateSelection(state);
    expect(result.kind).toBe("mismatch");
    expect(result.state.locked).toBe(true);
  });

  it("does not increment matchedPairs on a mismatch", () => {
    let state = createEngine(CHAPTER_1_PAIRS, "solo", fixedRand);
    const [idA, idB] = pickMismatchedPair(state);
    state = flipCard(state, idA)!;
    state = flipCard(state, idB)!;
    const result = evaluateSelection(state);
    expect(result.state.matchedPairs).toBe(0);
  });

  it("returns 'waiting' when only one card is selected", () => {
    let state = createEngine(CHAPTER_1_PAIRS, "solo", fixedRand);
    state = flipCard(state, 0)!;
    const result = evaluateSelection(state);
    expect(result.kind).toBe("waiting");
  });
});

// ─── Resolve mismatch ─────────────────────────────────────────────────────────

describe("resolveMismatch", () => {
  function mismatchedState() {
    let state = createEngine(CHAPTER_1_PAIRS, "together", fixedRand);
    const a = state.cards[0];
    const b = state.cards.find((c) => c.pairId !== a.pairId)!;
    state = flipCard(state, a.id)!;
    state = flipCard(state, b.id)!;
    const evResult = evaluateSelection(state);
    return { state: evResult.state, idA: a.id, idB: b.id };
  }

  it("turns mismatched cards back face-down", () => {
    const { state, idA, idB } = mismatchedState();
    const resolved = resolveMismatch(state);
    expect(resolved.cards.find((c) => c.id === idA)!.state).toBe("face-down");
    expect(resolved.cards.find((c) => c.id === idB)!.state).toBe("face-down");
  });

  it("unlocks the board", () => {
    const { state } = mismatchedState();
    expect(resolveMismatch(state).locked).toBe(false);
  });

  it("advances the turn in Together Mode", () => {
    const { state } = mismatchedState();
    expect(state.currentPlayer).toBe(0);
    expect(resolveMismatch(state).currentPlayer).toBe(1);
  });

  it("keeps the turn in Solo Mode", () => {
    let state = createEngine(CHAPTER_1_PAIRS, "solo", fixedRand);
    const a = state.cards[0];
    const b = state.cards.find((c) => c.pairId !== a.pairId)!;
    state = flipCard(state, a.id)!;
    state = flipCard(state, b.id)!;
    const ev = evaluateSelection(state);
    const resolved = resolveMismatch(ev.state);
    expect(resolved.currentPlayer).toBe(0);
  });

  it("does nothing when there is no locked mismatch to resolve", () => {
    const state = createEngine(CHAPTER_1_PAIRS, "together", fixedRand);
    expect(resolveMismatch(state)).toBe(state);
  });
});

// ─── Completion ───────────────────────────────────────────────────────────────

describe("isComplete", () => {
  it("returns false when no pairs are matched", () => {
    const state = createEngine(CHAPTER_1_PAIRS, "solo", fixedRand);
    expect(isComplete(state)).toBe(false);
  });

  it("returns true when all pairs are matched", () => {
    let state = createEngine(CHAPTER_1_PAIRS, "solo", fixedRand);
    for (const pair of CHAPTER_1_PAIRS) {
      const [idA, idB] = matchingCardIds(state, pair.pairId);
      state = flipCard(state, idA)!;
      state = flipCard(state, idB)!;
      state = evaluateSelection(state).state;
    }
    expect(isComplete(state)).toBe(true);
    expect(state.matchedPairs).toBe(CHAPTER_1_PAIRS.length);
  });
});

// ─── Restart ──────────────────────────────────────────────────────────────────

describe("restartGame", () => {
  it("resets matchedPairs to 0", () => {
    let state = createEngine(CHAPTER_1_PAIRS, "solo", fixedRand);
    const [idA, idB] = matchingCardIds(state);
    state = flipCard(state, idA)!;
    state = flipCard(state, idB)!;
    state = evaluateSelection(state).state;
    const restarted = restartGame(state, CHAPTER_1_PAIRS, createPrng(99));
    expect(restarted.matchedPairs).toBe(0);
  });

  it("all cards return to face-down after restart", () => {
    let state = createEngine(CHAPTER_1_PAIRS, "solo", fixedRand);
    const [idA, idB] = matchingCardIds(state);
    state = flipCard(state, idA)!;
    state = flipCard(state, idB)!;
    state = evaluateSelection(state).state;
    const restarted = restartGame(state, CHAPTER_1_PAIRS, createPrng(99));
    expect(restarted.cards.every((c) => c.state === "face-down")).toBe(true);
  });

  it("produces a different shuffle from the original (with high probability)", () => {
    const state = createEngine(CHAPTER_1_PAIRS, "solo", createPrng(1));
    const restarted = restartGame(state, CHAPTER_1_PAIRS, createPrng(2));
    const origOrder = state.cards.map((c) => c.pairId);
    const newOrder = restarted.cards.map((c) => c.pairId);
    // Very unlikely to be equal for different seeds
    expect(origOrder).not.toEqual(newOrder);
  });

  it("preserves game mode", () => {
    const state = createEngine(CHAPTER_1_PAIRS, "together", fixedRand);
    const restarted = restartGame(state, CHAPTER_1_PAIRS, createPrng(5));
    expect(restarted.mode).toBe("together");
  });
});

// ─── Replay ───────────────────────────────────────────────────────────────────

describe("replayGame", () => {
  it("preserves card order", () => {
    const state = createEngine(CHAPTER_1_PAIRS, "solo", createPrng(7));
    const replayed = replayGame(state);
    expect(replayed.cards.map((c) => c.pairId)).toEqual(
      state.cards.map((c) => c.pairId)
    );
  });

  it("resets all cards to face-down", () => {
    let state = createEngine(CHAPTER_1_PAIRS, "solo", fixedRand);
    const [idA, idB] = matchingCardIds(state);
    state = flipCard(state, idA)!;
    state = flipCard(state, idB)!;
    state = evaluateSelection(state).state;
    const replayed = replayGame(state);
    expect(replayed.cards.every((c) => c.state === "face-down")).toBe(true);
  });

  it("resets matchedPairs and selection", () => {
    let state = createEngine(CHAPTER_1_PAIRS, "solo", fixedRand);
    const [idA, idB] = matchingCardIds(state);
    state = flipCard(state, idA)!;
    state = flipCard(state, idB)!;
    state = evaluateSelection(state).state;
    const replayed = replayGame(state);
    expect(replayed.matchedPairs).toBe(0);
    expect(replayed.selection).toEqual([]);
  });
});
