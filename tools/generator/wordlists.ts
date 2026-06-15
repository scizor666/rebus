import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Lang } from "../../src/rebus/types.ts";
import { MAX_LEN, MIN_LEN, paths, WORD_LIMIT, wordSources } from "./config.ts";

const VALID: Record<Lang, RegExp> = {
  en: /^[a-z]+$/,
  ru: /^[а-яё]+$/,
};

/** A target word with its frequency rank (1 = most frequent). */
export interface RankedWord {
  word: string;
  rank: number;
}

async function fetchCached(url: string, cacheFile: string): Promise<string> {
  await mkdir(paths.cacheDir, { recursive: true });
  const path = join(paths.cacheDir, cacheFile);
  if (existsSync(path)) return readFile(path, "utf8");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const text = await res.text();
  await writeFile(path, text);
  return text;
}

/**
 * Load a frequency-ordered, cleaned word list for a language. Lines are either
 * "word" (google list) or "word count" (FrequencyWords); we keep the leading
 * token, lowercase, ё→е normalize is NOT applied here (we keep ё so the puzzle
 * answer is the real spelling), and filter to clean alphabetic words.
 */
export async function loadWords(lang: Lang): Promise<RankedWord[]> {
  const src = wordSources[lang];
  const raw = await fetchCached(src.url, `${lang}-words.txt`);
  const re = VALID[lang];

  const out: RankedWord[] = [];
  const seen = new Set<string>();
  let rank = 0;
  for (const line of raw.split("\n")) {
    const word = line.trim().split(/\s+/)[0]?.toLowerCase();
    if (!word || !re.test(word)) continue;
    rank++;
    if (rank > WORD_LIMIT) break;
    if (word.length < MIN_LEN || word.length > MAX_LEN) continue;
    if (seen.has(word)) continue;
    seen.add(word);
    out.push({ word, rank });
  }
  return out;
}
