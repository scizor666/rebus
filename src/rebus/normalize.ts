import type { Puzzle } from "./types.ts";

/**
 * Canonical form for answer comparison: lowercase, Russian ё→е, and strip
 * everything that isn't a letter or digit (so spacing/punctuation never matter,
 * e.g. "ice cream" === "icecream").
 */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^0-9a-zа-я]/g, "");
}

/** True if the typed input matches the puzzle's answer or an accepted variant. */
export function isCorrect(input: string, puzzle: Puzzle): boolean {
  const guess = normalize(input);
  if (!guess) return false;
  if (guess === normalize(puzzle.answer)) return true;
  return (puzzle.acceptable ?? []).some((a) => normalize(a) === guess);
}
