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

export const paths = {
  cacheDir: resolve(here, ".cache"),
  assetManifest: resolve(repoRoot, "data/assets/manifest.json"),
  puzzlesDir: resolve(repoRoot, "public/puzzles"),
};

/** Output targets. */
export const caps = {
  imagePerLang: 1000, // 2000 image puzzles total
  charPerLang: 5000, // 10000 char puzzles total
  shardSize: 500, // puzzles per shard file (lazy loading)
};

/** How many top-frequency words to consider per language. */
export const WORD_LIMIT = 50000;
/** Min/max target word length worth turning into a puzzle. */
export const MIN_LEN = 3;
export const MAX_LEN = 12;
