# Puzzle generator — data sources

The bulk puzzles are auto-mined from openly-licensed word-frequency lists.
Generated packs (`public/puzzles/`) are reproducible via `npm run generate`.

Answers are **nouns only**: a frequency list (for commonness/ordering) is
intersected with a noun list (for part-of-speech). For Russian the noun list's
nominative-singular lemmas also drop weird inflected forms.

| Language | Frequency (ordering) | Nouns (POS filter) | License |
|---|---|---|---|
| English | [hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords) `en_50k` (MIT) | [desiquintans Great Noun List](https://www.desiquintans.com/nounlist) (CC0) | mixed |
| Russian | [hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords) `ru_50k` | [Badestrand/russian-dictionary](https://github.com/Badestrand/russian-dictionary) `nouns.csv` | MIT |

Image labels come from the asset crawler (see `data/assets/LICENSES.md`).

## Quality controls
- Every generated puzzle is verified: its encoding reconstructs the target word.
- Profanity filter (`filters.ts`): vetted substring roots + exact-word lists for
  both languages, tuned to avoid false positives (e.g. блять is exact-only so it
  doesn't hit влюбляться; ass/anal/cock are exact-only). 0 swears in 12k answers.
- Function-word stoplists skip dull pronoun/particle targets.
- Image puzzles keep ≥ half the pictured word's letters (no over-mutilation).
- Nouns only; max word length 8 letters (no воспоминания-style monsters).
- The "в" (letter-in-letter) device is restricted to enclosing outer letters
  (о/ю/ф/д/б/я) with ≤ 3 inner letters, so it reads "in" rather than "on".
