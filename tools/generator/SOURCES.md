# Puzzle generator — data sources

The bulk puzzles are auto-mined from openly-licensed word-frequency lists.
Generated packs (`public/puzzles/`) are reproducible via `npm run generate`.

| Language | Source | License |
|---|---|---|
| English | [hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords) `2018/en/en_50k.txt` | MIT |
| Russian | [hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords) `2018/ru/ru_50k.txt` | MIT |

Image labels come from the asset crawler (see `data/assets/LICENSES.md`).

## Quality controls
- Every generated puzzle is verified: its encoding reconstructs the target word.
- Profanity filter (`filters.ts`): vetted substring roots + exact-word lists for
  both languages, tuned to avoid false positives (e.g. блять is exact-only so it
  doesn't hit влюбляться; ass/anal/cock are exact-only). 0 swears in 12k answers.
- Function-word stoplists skip dull pronoun/particle targets.
- Image puzzles keep ≥ half the pictured word's letters (no over-mutilation).
