/**
 * Selection rules: keep concrete, depictable, child-appropriate nouns; drop
 * abstract symbols, smileys, flags, and anything unsuitable for a kids' game.
 */

/** OpenMoji top-level groups we keep (concrete nouns that picture a "thing"). */
export const KEEP_GROUPS = new Set<string>([
  "animals-nature",
  "food-drink",
  "travel-places",
  "objects",
  "activities",
]);

/**
 * Substrings (matched against lowercased annotation + tags) that disqualify an
 * emoji as not child-appropriate. Kept deliberately broad.
 */
export const BLOCK_TERMS: string[] = [
  // weapons / violence
  "gun", "pistol", "rifle", "weapon", "knife", "dagger", "sword", "bomb",
  "explosive", "blood", "skull", "coffin", "headstone", "gravestone",
  "funeral", "axe", "hammer and",
  // drugs / medical sharps
  "syringe", "pill", "drug", "needle",
  // alcohol / tobacco
  "beer", "wine", "cocktail", "sake", "whisky", "whiskey", "champagne",
  "tumbler glass", "clinking", "cigarette", "smoking", "hookah", "alcohol",
  // gambling / adult
  "slot machine", "mahjong", "playing card", "joker", "casino",
  "kiss mark", "middle finger",
];

/** Returns true if the emoji should be excluded based on its text. */
export function isBlocked(annotation: string, tags: string): boolean {
  const hay = `${annotation} ${tags}`.toLowerCase();
  return BLOCK_TERMS.some((term) => hay.includes(term));
}

/** A clean English word (letters only, allowing internal hyphen). */
const EN_WORD = /^[a-z]+(?:-[a-z]+)?$/;
/** A clean Russian word (Cyrillic letters only, allowing internal hyphen). */
const RU_WORD = /^[а-яё]+(?:-[а-яё]+)?$/;

/** English function words that are never the depicted noun. */
const EN_STOP = new Set([
  "with", "and", "of", "the", "a", "an", "in", "on", "no", "off", "up",
]);

/**
 * Extract the depicted noun from an English label. English noun phrases are
 * head-final ("glowing star" -> "star", "crescent moon" -> "moon"), so after
 * dropping a trailing "face" and any stopwords we take the last content word.
 * Accepts up to two content words; returns null for longer/dirtier phrases.
 */
export function canonicalEnWord(annotation: string): string | null {
  let words = annotation.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length > 1 && words.at(-1) === "face") words = words.slice(0, -1);
  // "X with Y" depicts X (e.g. "cloud with rain" -> cloud) — keep the subject.
  const wi = words.indexOf("with");
  if (wi > 0) words = words.slice(0, wi);
  words = words.filter((w) => !EN_STOP.has(w));
  if (words.length === 0 || words.length > 2) return null;
  const head = words.at(-1)!;
  return EN_WORD.test(head) && head.length >= 2 ? head : null;
}

/**
 * Russian canonical word: single-word TTS name only. Russian word order is not
 * reliably head-final ("звёздная ночь" vs "мост ночью"), so we don't guess a
 * head noun from multi-word phrases — we keep precision high and leave the rest
 * as search keywords for later, human-reviewed expansion.
 */
export function canonicalRuWord(tts: string[] | undefined): string | null {
  const phrase = tts?.[0]?.trim().toLowerCase();
  return phrase && RU_WORD.test(phrase) ? phrase : null;
}
