import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import type { Lang } from "../../src/rebus/types.ts";

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(here, "../..");

export const wordSources: Record<Lang, { url: string; license: string }> = {
  en: {
    url: "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_50k.txt",
    license: "MIT (hermitdave/FrequencyWords)",
  },
  ru: {
    url: "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/ru/ru_50k.txt",
    license: "MIT (hermitdave/FrequencyWords)",
  },
};

/**
 * Noun lists — intersected with the frequency lists so we only ever turn
 * *nouns* into puzzles. The RU list's first column is the nominative-singular
 * lemma, so intersecting also drops weird inflected forms (воспоминания, …).
 */
export const nounSources: Record<Lang, { url: string; license: string; csv: boolean }> = {
  en: {
    // The Great Noun List — human-checked common nouns (cleaner than scraped
    // lists, which leak gerunds/interjections like "going"/"okay").
    url: "https://www.desiquintans.com/downloads/nounlist/nounlist.txt",
    license: "CC0 (desiquintans Great Noun List)",
    csv: false,
  },
  ru: {
    url: "https://raw.githubusercontent.com/Badestrand/russian-dictionary/master/nouns.csv",
    license: "MIT (Badestrand/russian-dictionary)",
    csv: true,
  },
};

export const paths = {
  cacheDir: resolve(here, ".cache"),
  assetManifest: resolve(repoRoot, "data/assets/manifest.json"),
  puzzlesDir: resolve(repoRoot, "public/puzzles"),
};

/** Output targets. */
export const caps = {
  imagePerLang: 6000, // image puzzles are abundant & high-quality; take all we can
  charPerLang: 5000, // char is the scarce pool under nouns-only + short
  shardSize: 500, // puzzles per shard file (lazy loading)
};

/** How many top-frequency words to consider per language. */
export const WORD_LIMIT = 50000;
/** Min/max target word length worth turning into a puzzle (short = readable). */
export const MIN_LEN = 3;
export const MAX_LEN = 8;
