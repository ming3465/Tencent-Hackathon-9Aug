import { describe, expect, it } from "vitest";

import {
  REVOICEABLE_KINDS,
  mayRevoice,
  validateRevoicing,
  buildVoicePrompt,
  VOICE_SYSTEM_PROMPT,
} from "../llmVoice.js";

/**
 * These cover the pure decision surface only - no browser, no model, no
 * network - so the suite stays deterministic. Several cases are real outputs
 * captured from Gemini Nano on 2026-08-15 rather than invented ones.
 */
describe("which lines may be re-voiced", () => {
  it("allows only kinds that name no world change", () => {
    expect(mayRevoice("greeting")).toBe(true);
    expect(mayRevoice("reflection")).toBe(true);
    expect(mayRevoice("memory-reaction")).toBe(true);
  });

  it("never re-voices a line that carries a consequence", () => {
    // Measured: the model twice turned Mdm Siti's "shelter it properly" into
    // "reinforce the drainage", which would contradict the sheltered linkway
    // the game renders. Meaning drift is fluent and undetectable, so these
    // kinds are excluded by construction rather than filtered afterwards.
    for (const kind of ["offer-request", "reminder", "invitation", "contribution", "clue", "main-story"] as const) {
      expect(mayRevoice(kind), kind).toBe(false);
    }
  });

  it("keeps the allowlist small so a new kind defaults to authored-only", () => {
    expect(REVOICEABLE_KINDS.size).toBe(3);
  });
});

describe("validating a generated line", () => {
  const SOURCE = "Same table, same time. Thirty-one years now.";

  it("accepts a faithful first-person rewrite", () => {
    const result = validateRevoicing(
      SOURCE,
      "I always sit at the same table, same time. Thirty-one years now.",
      "Uncle Seng",
    );
    expect(result.ok).toBe(true);
  });

  it("strips wrapping quotes the model likes to add", () => {
    const result = validateRevoicing(SOURCE, '"Same spot, same hour. Thirty-one years."', "Uncle Seng");
    expect(result).toMatchObject({ ok: true });
    if (result.ok) expect(result.line.startsWith('"')).toBe(false);
  });

  it("rejects third-person self-reference", () => {
    // Real output: the model narrating the character instead of being her.
    const result = validateRevoicing(
      "The garden bed by Block 9 needs a second pair of hands this week.",
      "Aunty needs a little help with that garden bed by Block 9 this week.",
      "Aunty Mei",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("third person");
  });

  it("does not treat an article in a speaker's name as a self-reference", () => {
    // Real integration failure: the prologue speaker is "The Voice", so
    // splitting the name on whitespace made every line containing "the" look
    // like third-person narration and nothing could ever be re-voiced.
    const result = validateRevoicing(
      "Wake up. Just listen for a moment.",
      "Wake up now, and just listen to the morning for a moment.",
      "The Voice",
    );
    expect(result.ok).toBe(true);
  });

  it("still catches an honorific used in the third person", () => {
    // "Aunty" and "Uncle" must stay checkable — they are exactly how the model
    // narrates a character instead of being them.
    const result = validateRevoicing(
      "Morning. The kettle just boiled.",
      "Aunty says the kettle just boiled.",
      "Aunty Mei",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("third person");
  });

  it("rejects an invented number", () => {
    const result = validateRevoicing(
      "I keep the spare key with my neighbour.",
      "I keep the spare key with my neighbour in unit 4.",
      "Uncle Seng",
    );
    expect(result).toMatchObject({ ok: false, reason: "invented a number" });
  });

  it("keeps a number the author actually wrote", () => {
    const result = validateRevoicing(SOURCE, "Thirty-one years at the same table, same time.", "Uncle Seng");
    expect(result.ok).toBe(true);
  });

  it("rejects a token it does not know how to resolve", () => {
    const result = validateRevoicing("Morning, {player}.", "Morning, {name}.", "Uncle Ravi");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("unknown token");
  });

  it("rejects losing a {player} the source had", () => {
    const result = validateRevoicing(
      "That route floods every monsoon, {player}.",
      "That route floods every monsoon.",
      "Mdm Siti",
    );
    expect(result).toMatchObject({ ok: false, reason: "dropped {player}" });
  });

  it("tolerates a {player} the model adds unasked", () => {
    // Six of eight measured runs added one despite an explicit rule and a
    // few-shot example. It resolves to the player's chosen name and reads
    // better, so this is permitted rather than fought.
    const result = validateRevoicing(
      "Morning. The kettle just boiled if you want some.",
      "Morning, {player}. The kettle just boiled - help yourself.",
      "Uncle Ravi",
    );
    expect(result.ok).toBe(true);
  });

  it("rejects any claim vocabulary the source did not use", () => {
    for (const bad of [
      "This will help prevent memory loss.",
      "Good for cognitive decline, I promise.",
      "The doctor said it treats the symptoms.",
    ]) {
      expect(validateRevoicing(SOURCE, bad, "Uncle Seng").ok, bad).toBe(false);
    }
  });

  it("rejects empty, unchanged and runaway output", () => {
    expect(validateRevoicing(SOURCE, "   ", "Uncle Seng")).toMatchObject({ ok: false, reason: "empty" });
    expect(validateRevoicing(SOURCE, SOURCE, "Uncle Seng")).toMatchObject({ ok: false, reason: "unchanged" });
    expect(validateRevoicing(SOURCE, "word ".repeat(90), "Uncle Seng")).toMatchObject({
      ok: false,
      reason: "too long",
    });
  });
});

describe("the prompt sent to the model", () => {
  it("names the character and its traits without leaking campaign state", () => {
    const prompt = buildVoicePrompt("Aunty Mei", ["gardener", "warm"], "Morning.");
    expect(prompt).toContain("Aunty Mei");
    expect(prompt).toContain("gardener, warm");
    expect(prompt).toContain("ORIGINAL: Morning.");
  });

  it("forbids naming the speaker and shows an example of the failure", () => {
    expect(VOICE_SYSTEM_PROMPT).toContain("Never write the character's own name");
    expect(VOICE_SYSTEM_PROMPT).toContain("BAD:");
  });
});
