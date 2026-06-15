# Ребус · Rebus

A browser rebus game inspired by classic Soviet puzzles. Each round you decode a
combination of images, letters, and spatial arrangements into a single word — no
timer, no score, just puzzle after puzzle.

**Live:** https://scizor666.github.io/rebus/

---

## How to play

A **rebus** encodes a word as a sequence of visual clues that you read aloud and
combine:

- **Image** → the word it depicts (e.g. 🐈 = "кот")
- **Letter / digit** → its name or sound (e.g. `R` = "are", `4` = "four", `100` = "сто")
- **Apostrophe marks** → drop letters from the edge of a reading
  (`'🐈` = drop 1 from start → "от"; `🐈'` = drop 1 from end → "ко")
- **Letter inside another letter** → read as "в" (in): inner letters drawn inside
  О, Ю, Ф, Д, Б, or Я — e.g. `Р` inside `О` = "вор"
- **Letter above another letter** → read with the stacking preposition:
  `А` over `Б` under the "на" rule = "анаб" → "набор" etc.

Type your answer and press **Проверить / Check**. Use **Показать / Reveal** if
you're stuck — it shows the answer and explains the encoding step by step.
**Пропустить / Skip** moves on silently.

Switch between **RU** and **EN** at any time with the toggle in the top-right corner.
The game immediately loads a fresh puzzle in the new language.

---

## Puzzle pools

| Pool | Count | Description |
|---|---|---|
| ru-image | 4,630 | Russian — emoji image + letter fragments |
| en-image | 4,356 | English — emoji image + letter fragments |
| ru-char | 230 | Russian — number-words, inside/stack letter devices |
| en-char | 413 | English — number-words, letter names (R/C/U…), symbols (&/@) |
| **Total** | **9,629** | |

All answers are common nouns, 3–8 letters, zero profanity.

---

## Where the words come from

Puzzle answers are mined from openly licensed word-frequency corpora, then filtered
to nouns only and capped at 8 letters so every answer feels familiar and fits the
rebus layout.

| Language | Frequency ordering | Noun filter | License |
|---|---|---|---|
| English | [hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords) `en_50k` | [desiquintans Great Noun List](https://www.desiquintans.com/nounlist) | MIT / CC0 |
| Russian | [hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords) `ru_50k` | [Badestrand/russian-dictionary](https://github.com/Badestrand/russian-dictionary) `nouns.csv` — nominative-singular lemmas | MIT |

The Russian noun list's nominative-singular lemmas also eliminate weird inflected
forms (воспоминания becomes недоступным for puzzles — only "память" etc. pass
through).

---

## Where the images come from

All 761 emoji images are from **[OpenMoji 16.0.0](https://openmoji.org)**
(CC BY-SA 4.0). Emoji labels (the words the pictures depict) come from the
**[Unicode CLDR](https://github.com/unicode-org/cldr-json)** annotations project
(Unicode-3.0 license).

Full attribution: `data/assets/LICENSES.md`.

---

## PWA / offline

The game is installable as a Progressive Web App and works offline after the first
visit. The service worker precaches the app shell and runtime-caches puzzle shards
(NetworkFirst) and emoji images (CacheFirst, 1-year expiry).

---

## Development

```bash
# Install dependencies
npm install

# Dev server (hot-reload, puzzles served from public/)
npm run dev

# Type-check only
npm run typecheck

# Production build → dist/
npm run build

# Re-crawl image assets (downloads OpenMoji SVGs + CLDR labels)
npm run crawl

# Re-generate puzzle packs (uses crawled manifest; writes public/puzzles/)
npm run generate
```

Requires **Node 20+**.

---

## Project layout

```
src/
  rebus/        core data model, assembler, normalizer
  game/         puzzle source (lazy pack loader + seed fallback)
  data/         16 hand-authored seed puzzles (offline fallback)
  ui/           renderer + game controller
tools/
  crawler/      downloads OpenMoji SVGs, writes data/assets/manifest.json
  generator/    mines puzzles from word lists, writes public/puzzles/
public/
  assets/images/openmoji/   761 SVG emoji files (committed)
  puzzles/                  generated JSON shards + index.json (committed)
data/assets/
  manifest.json             crawler output — asset metadata
  LICENSES.md               image attribution
docs/
  SPEC.md                   full technical specification
```

---

## License

MIT — see [LICENSE](LICENSE).

Image assets (OpenMoji): CC BY-SA 4.0 — see `data/assets/LICENSES.md`.
