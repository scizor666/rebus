export type Lang = "ru" | "en";

/**
 * A single drawable unit: a picture or a run of characters, optionally with
 * apostrophe "drop-letter" marks (drop N letters from the start/end of its
 * reading, 0–3 per side).
 */
export interface Glyph {
  kind: "image" | "text";
  /** image: emoji hexcode id + svg path + accessible label (depicted word). */
  assetId?: string;
  file?: string;
  alt?: string;
  /** text: the literal characters drawn. */
  text?: string;
  /**
   * The letters this glyph contributes, when different from what's drawn —
   * e.g. drawn "100" reads "сто", drawn "4" reads "four". Defaults to `text`
   * (text glyph) or `alt` (image glyph), lowercased.
   */
  reading?: string;
  dropStart?: number;
  dropEnd?: number;
}

/**
 * Letter(s) drawn *inside* a container letter → preposition "в" / "in".
 * e.g. outer "О" with inner "ДА" reads в-О-да = ВОДА.
 */
export interface InsideNode {
  kind: "inside";
  outer: Glyph;
  inner: Glyph;
}

/**
 * One letter-group drawn *above* another → a vertical preposition the solver
 * must deduce (на / над / под). The arrangement injects the preposition
 * *between* the two groups, e.g. "КА" over "Л" reads КА-на-Л = КАНАЛ.
 */
export interface StackNode {
  kind: "stack";
  top: Glyph;
  bottom: Glyph;
  /**
   * The preposition the vertical arrangement injects between the two groups
   * (на / над / под / за / по). Stored for verification and the reveal trace;
   * it is NOT drawn — the solver deduces it from what spells a word.
   */
  prep: string;
}

/** A node in a puzzle's horizontal row. */
export type Node = Glyph | InsideNode | StackNode;

export interface Puzzle {
  id: string;
  lang: Lang;
  /** true → image pool (2k), false → character-only pool (10k). */
  hasImages: boolean;
  /** Canonical solution. */
  answer: string;
  /** Extra accepted spellings (compared after normalization). */
  acceptable?: string[];
  /** Left-to-right row of nodes that make up the rebus. */
  tokens: Node[];
  /** Human-readable derivation, shown on Reveal. */
  trace: string;
}
