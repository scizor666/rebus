import type { Lang } from "../../src/rebus/types.ts";
import { nounSources } from "./config.ts";
import { fetchCached } from "./wordlists.ts";

const VALID: Record<Lang, RegExp> = {
  en: /^[a-z]+$/,
  ru: /^[а-яё]+$/,
};

/**
 * Load the set of nouns for a language (ё→е normalized for matching). The RU
 * source is a CSV whose first column is the nominative-singular lemma; the EN
 * source is one noun per line. Used to keep only nouns as puzzle answers.
 */
export async function loadNounSet(lang: Lang): Promise<Set<string>> {
  const src = nounSources[lang];
  const raw = await fetchCached(src.url, `${lang}-nouns.txt`);
  const re = VALID[lang];
  const set = new Set<string>();

  const lines = raw.split("\n");
  for (let i = src.csv ? 1 : 0; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) continue;
    const word = (src.csv ? line.split("\t")[0] : line)?.toLowerCase();
    if (word && re.test(word)) set.add(word.replace(/ё/g, "е"));
  }
  return set;
}
