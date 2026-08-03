/**
 * Optional keepsake-table content.
 *
 * Kept separate from the campaign chapter registry so "chapter" always means
 * the story spine. Symbols are code-native text glyphs, not shipped images.
 */
export interface CardDefinition {
  pairId: string;
  symbol: string;
  label: string;
}

export const KEEPSAKE_PAIRS: CardDefinition[] = [
  { pairId: "kite", symbol: "◇", label: "Handmade kite frame" },
  { pairId: "lamp", symbol: "▣", label: "Paper lantern frame" },
  { pairId: "flower", symbol: "✣", label: "Pressed garden flower" },
  { pairId: "boat", symbol: "⌁", label: "Bumboat line drawing" },
  { pairId: "spice-tin", symbol: "▤", label: "Embossed spice tin" },
  { pairId: "woven-mat", symbol: "▦", label: "Woven pandan mat pattern" },
];

export const KEEPSAKE_TABLE_NAME = "Neighbourhood Keepsakes";
