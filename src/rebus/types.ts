export type Lang = "ru" | "en";

/**
 * A token's spatial relation. In a Soviet-style rebus the position injects a
 * preposition into the reading (see positions.ts). "sequence" is plain
 * left-to-right concatenation with no preposition.
 */
export type Position =
  | "sequence"
  | "inside"
  | "above"
  | "below"
  | "behind"
  | "before";

export interface Token {
  kind: "image" | "text";
  /** image token: emoji hexcode id + svg path + accessible label (depicted word). */
  assetId?: string;
  file?: string;
  alt?: string;
  /** text token: the literal characters drawn. */
  text?: string;
  /** Leading apostrophes — drop N letters from the start of this token's reading (0–3). */
  dropStart?: number;
  /** Trailing apostrophes — drop N letters from the end of this token's reading (0–3). */
  dropEnd?: number;
  /** Spatial relation; defaults to "sequence". */
  position?: Position;
}

export interface Puzzle {
  id: string;
  lang: Lang;
  /** true → image pool (2k), false → character-only pool (10k). */
  hasImages: boolean;
  /** Canonical solution. */
  answer: string;
  /** Extra accepted spellings (compared after normalization). */
  acceptable?: string[];
  tokens: Token[];
  /** Human-readable derivation, shown on Reveal. */
  trace: string;
}
