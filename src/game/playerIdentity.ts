/**
 * Who the player is: their chosen name and how they look.
 *
 * The story used to hard-code the protagonist as "Y". Letting a player enter
 * their own name and pick their own face is the same design principle the rest
 * of the game follows — older adults are contributors, not stand-ins for
 * someone else's character. "Y" survives as the default so the prologue still
 * reads correctly for anyone who skips the field, and so every existing save,
 * screenshot and script stays accurate.
 *
 * Appearance options are deliberately **labelled, not colour-only**. Swatches
 * alone would fail the accessibility contract in docs/ACCESSIBILITY.md, so each
 * option carries a visible word as well as its colour.
 */

/** Shown in the story whenever the player leaves the name field blank. */
export const DEFAULT_PLAYER_NAME = "Y";

/**
 * Long enough for a full Singaporean name, short enough that a dialogue line
 * like "Morning, {player}." cannot overflow the card on a 320px phone.
 */
export const MAX_PLAYER_NAME_LENGTH = 18;

export interface PlayerAppearance {
  skin: number;
  hair: number;
  shirt: number;
  trousers: number;
}

export interface AppearanceOption {
  /** Stable id persisted in the save. */
  id: string;
  /** Visible word, so the choice is never carried by colour alone. */
  label: string;
  value: number;
}

/**
 * Four tones spanning the range actually present in the estate's cast, rather
 * than a token light/dark pair. Labels are neutral cosmetic descriptors.
 */
export const SKIN_TONES: readonly AppearanceOption[] = [
  { id: "deep", label: "Deep", value: 0x8d5a3b },
  { id: "bronze", label: "Bronze", value: 0xb87f52 },
  { id: "tan", label: "Tan", value: 0xd39c6d },
  { id: "fair", label: "Fair", value: 0xe8c39e },
];

export const HAIR_COLOURS: readonly AppearanceOption[] = [
  { id: "black", label: "Black", value: 0x2a2523 },
  { id: "brown", label: "Brown", value: 0x5a3a24 },
  { id: "auburn", label: "Auburn", value: 0x8a4b2a },
  { id: "silver", label: "Silver", value: 0xb0aaa0 },
];

export const SHIRT_COLOURS: readonly AppearanceOption[] = [
  { id: "teal", label: "Teal", value: 0x2f7d8c },
  { id: "coral", label: "Coral", value: 0xd4674f },
  { id: "mustard", label: "Mustard", value: 0xd9a53c },
  { id: "violet", label: "Violet", value: 0x7b5aa6 },
  { id: "sage", label: "Sage", value: 0x6f8f5a },
];

export const TROUSER_COLOURS: readonly AppearanceOption[] = [
  { id: "navy", label: "Navy", value: 0x355b68 },
  { id: "slate", label: "Slate", value: 0x4a4f57 },
  { id: "khaki", label: "Khaki", value: 0x8a7a56 },
  { id: "plum", label: "Plum", value: 0x5c3f52 },
];

/** The look the game shipped with, so nothing changes for a player who skips. */
export const DEFAULT_APPEARANCE: PlayerAppearance = {
  skin: 0xd39c6d,
  hair: 0x2a2523,
  shirt: 0x2f7d8c,
  trousers: 0x355b68,
};

function isKnownValue(
  options: readonly AppearanceOption[],
  value: unknown,
): value is number {
  return typeof value === "number"
    && options.some((option) => option.value === value);
}

/**
 * Trims, collapses runs of whitespace, caps the length, and falls back to the
 * default. Control characters are stripped rather than rejected so a paste
 * from a document cannot inject line breaks into a dialogue card.
 */
export function sanitisePlayerName(raw: unknown): string {
  if (typeof raw !== "string") return DEFAULT_PLAYER_NAME;
  const cleaned = raw
    // Strip control characters so a paste cannot inject line breaks into a card.
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_PLAYER_NAME_LENGTH)
    .trim();
  return cleaned.length > 0 ? cleaned : DEFAULT_PLAYER_NAME;
}

/**
 * Accepts anything and returns a usable appearance. Unknown or hand-edited
 * values fall back per-field rather than discarding the whole object, so a
 * partially corrupt save still loads the player's remaining choices.
 */
export function sanitiseAppearance(raw: unknown): PlayerAppearance {
  const value = (raw ?? {}) as Partial<PlayerAppearance>;
  return {
    skin: isKnownValue(SKIN_TONES, value.skin)
      ? value.skin
      : DEFAULT_APPEARANCE.skin,
    hair: isKnownValue(HAIR_COLOURS, value.hair)
      ? value.hair
      : DEFAULT_APPEARANCE.hair,
    shirt: isKnownValue(SHIRT_COLOURS, value.shirt)
      ? value.shirt
      : DEFAULT_APPEARANCE.shirt,
    trousers: isKnownValue(TROUSER_COLOURS, value.trousers)
      ? value.trousers
      : DEFAULT_APPEARANCE.trousers,
  };
}

/** Token written into story content wherever the protagonist is addressed. */
export const PLAYER_NAME_TOKEN = "{player}";

/**
 * Resolves `{player}` in story text.
 *
 * Possessives are written `{player}'s` in content and handled by plain
 * replacement — English needs no special case for a trailing s ("Lois's" is
 * as acceptable as "Lois'"), and inventing one would produce worse output for
 * the many Singaporean names that end in s.
 */
export function personalise(text: string, name: string): string {
  if (!text.includes(PLAYER_NAME_TOKEN)) return text;
  return text.split(PLAYER_NAME_TOKEN).join(name);
}
