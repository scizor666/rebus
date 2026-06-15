/**
 * Asset manifest types — shared between the crawler (producer) and, later,
 * the puzzle generator and game runtime (consumers).
 */

export type Lang = "ru" | "en";

export interface AssetLabel {
  /** Canonical single-word label (lowercased), or null if no clean single word. */
  word: string | null;
  /** Best human-readable label (may be multi-word), e.g. "grinning cat". */
  primary: string;
  /** Extra keywords useful for the puzzle generator's decomposition search. */
  keywords: string[];
}

export interface Asset {
  /** Stable id — the emoji hexcode, e.g. "1F408". */
  id: string;
  /** The emoji character itself. */
  emoji: string;
  /** Path to the SVG relative to the web root, e.g. "assets/images/openmoji/1F408.svg". */
  file: string;
  group: string;
  subgroups: string;
  source: "openmoji";
  license: string;
  attribution: string;
  en: AssetLabel;
  ru: AssetLabel;
}

export interface SourceInfo {
  name: string;
  url: string;
  license: string;
  attribution: string;
}

export interface Manifest {
  generatedAt: string;
  sources: SourceInfo[];
  counts: {
    total: number;
    withWordEn: number;
    withWordRu: number;
    withWordBoth: number;
    byGroup: Record<string, number>;
  };
  assets: Asset[];
}
