# Rebus — Technical Specification

A browser game that presents a randomly-selected rebus puzzle each round. The
player decodes the puzzle into a word. No timer, no score — puzzle after puzzle,
infinitely replayable. Inspired by classic Soviet rebuses: combinations of images
and characters arranged in space, with apostrophe "drop-letter" marks.

---

## 1. Requirements

| Decision | Implemented as |
|---|---|
| Answer input | Free-text, normalized before comparison |
| Puzzle source | Auto-generated from word lists + noun dictionaries |
| Image assets | OpenMoji 16.0.0 (CC-BY-SA 4.0), labels from Unicode CLDR |
| Asset count | 761 images (shared across both languages) |
| Spatial rules | Full positional semantics: inside / above / below / behind |
| Language switch | Always-visible RU ⇄ EN toggle, switchable any time |
| Switch mid-round | Immediately loads a fresh puzzle in the new language |
| Puzzle counts | 9,629 total — see §6 |
| Profanity policy | Zero swear words; two-tier filter (substring + exact-word) |
| Answer type | **Nouns only**; max 8 letters (no multi-syllable monsters) |
| Hosting | Static SPA; deployed to GitHub Pages as a PWA |

### Constraints
- Vanilla TypeScript + Vite — no UI framework.
- No backend; all game state is in-memory per session.
- No accounts, no persistence, no leaderboards.

---

## 2. Tech stack

| Layer | Tool |
|---|---|
| Language | TypeScript 5 (strict, ES2022, verbatimModuleSyntax) |
| Bundler | Vite 6 |
| PWA | vite-plugin-pwa + Workbox (auto-generated service worker) |
| Offline tooling | `tsx` — runs crawler and generator as plain Node scripts |
| Deployment | GitHub Actions → GitHub Pages (`/rebus/` base path) |

---

## 3. Rebus mechanics

A puzzle is an ordered list of **nodes**. The answer is built by reading each node,
applying its transforms, and concatenating.

### 3.1 Node types

```ts
type Node = Glyph | InsideNode | StackNode;

interface Glyph {
  kind: "image" | "text";
  assetId?: string;   // image glyphs: which picture
  file?: string;      // path to the SVG asset
  alt?: string;       // word the picture depicts
  text?: string;      // text glyphs: the displayed character(s)
  reading?: string;   // letters contributed when ≠ displayed (100 → "сто", R → "are")
  dropStart?: number; // leading apostrophes: drop N letters from start
  dropEnd?: number;   // trailing apostrophes: drop N letters from end
}

interface InsideNode {
  kind: "inside";
  outer: Glyph;  // the containing letter (О, Ю, Ф, Д, Б, Я)
  inner: Glyph;  // the letters drawn inside it
  // reads as: "в" + outer + inner
}

interface StackNode {
  kind: "stack";
  top: Glyph;    // letters drawn above
  bottom: Glyph; // letters drawn below
  prep: string;  // the spatial preposition ("на", "над", "под", "за", "по")
  // reads as: top + prep + bottom
}
```

### 3.2 Apostrophe drop-letters

Leading `'` marks strip **N** letters from the **start** of that token's reading;
trailing `'` marks strip from the **end**. Maximum 3 per side.

Example: `'' 🐈(кот)` → drop 2 from start of "кот" → `"т"`.

### 3.3 Positional devices

| Device | Visual | Reading |
|---|---|---|
| **InsideNode** | inner letters drawn inside the outer letter | `в` + outer + inner |
| **StackNode** | top group written above bottom group | top + prep + bottom |
| Sequence | left-to-right | concatenate directly |

The `в` device is restricted to outer letters with a clear enclosed area (О, Ю, Ф,
Д, Б, Я) and at most 3 inner letters, so it reads *in* ("в"), never *on*.

### 3.4 Answer normalization

`lowercase → trim → ё→е → strip non-alphanumeric`

Input is accepted when its normalized form equals the normalized answer (or any
entry in `acceptable`).

### 3.5 Reading assembly

The assembler is shared between puzzle verification (generator) and the Reveal
explanation (runtime):

```
glyph reading = (reading ?? text ?? alt)
              → strip dropStart letters from start
              → strip dropEnd letters from end

InsideNode reading = "в" + outer.reading + inner.reading
StackNode reading  = top.reading + prep + bottom.reading
sequence reading   = concatenate all node readings
```

---

## 4. Gameplay loop

1. Pick a random puzzle from the active language pool (recent-25 exclusion).
2. Render tokens with positional layout.
3. Player types and submits.
   - **Correct** → success feedback + Next.
   - **Reveal** → shows answer + derivation trace; **Skip** moves on silently.
4. New random puzzle. Repeat forever.
5. Language toggle is always visible; switching immediately loads a fresh puzzle.

---

## 5. Asset pipeline

### 5.1 Crawler (`npm run crawl`)

- **Source**: OpenMoji 16.0.0 SVGs + Unicode CLDR annotations (RU + EN labels).
- **Output**: `data/assets/manifest.json` (761 assets) and `data/assets/LICENSES.md`.
- **Image files**: `public/assets/images/openmoji/*.svg` (committed to the repo).
- **Label extraction**: EN uses head-noun extraction ("sun with face" → "sun");
  RU keeps only single-word labels (Russian word order is not reliably head-first).
- **Filters**: child-appropriate group allowlist + block-term list.

### 5.2 Generator (`npm run generate`)

- **Frequency lists**: `hermitdave/FrequencyWords` `en_50k` + `ru_50k` (MIT).
- **Noun lists**:
  - EN: desiquintans Great Noun List (CC0) — pronoun/gerund stoplist applied.
  - RU: Badestrand/russian-dictionary `nouns.csv` (MIT) — nominative-singular
    lemmas, so intersecting also eliminates inflected forms like воспоминания.
- **Word selection**: frequency list ∩ noun list → clean, short (3–8 letters),
  no profanity, no function words.
- **Strategies** (tried in order, first valid wins):
  1. **Image + letters** — longest pictured sub-string + prefix/suffix ≤ 5 letters.
  2. **Number word** — 4 → "four", 100 → "сто", etc.
  3. **Letter name** (EN) — R → "are", C → "sea", U → "you", etc.
  4. **Symbol** (EN) — `&` → "and", `@` → "at".
  5. **Inside letter** (RU) — word starts with "в" + container letter + ≤3 letters.
  6. **Stack** (RU) — preposition (над/под/на/за/по) splits word into top/bottom groups ≤4 letters each.
- **Verification**: every generated puzzle is re-assembled and must reconstruct
  the answer exactly before being written to disk.
- **Profanity filter**: two-tier — long unambiguous roots matched as substrings
  (catches inflections) + short ambiguous words matched as exact-word only
  (avoids false positives like "class" ≠ "ass", "блять" ≠ "влюбляться").
- **Output**: `public/puzzles/{lang}-{pool}/NNN.json` shards (500 per shard) +
  `public/puzzles/index.json` (pool metadata for lazy loading).

---

## 6. Puzzle counts

| Pool | Count |
|---|---|
| ru-image | 4,630 |
| ru-char | 230 |
| en-image | 4,356 |
| en-char | 413 |
| **Total** | **9,629** |

Pool selection is weighted by count, so image puzzles appear ~94% of the time.
Character-only puzzles (number/letter-name/symbol/inside/stack) appear ~6%.

---

## 7. Runtime architecture

| Module | Role |
|---|---|
| `src/rebus/types.ts` | Core data model (`Puzzle`, `Node`, `Glyph`, …) |
| `src/rebus/assemble.ts` | Assembles a token list into the answer string |
| `src/rebus/normalize.ts` | Normalizes strings for comparison; `isCorrect()` |
| `src/game/packSource.ts` | Lazy shard loader; falls back to seed puzzles if packs missing |
| `src/data/seedPuzzles.ts` | 16 hand-authored fallback puzzles (8 RU / 8 EN) |
| `src/ui/render.ts` | DOM renderer for puzzles (image/text/inside/stack tokens) |
| `src/ui/app.ts` | Game controller — round loop, input, feedback, language toggle |

### Puzzle loading

`PackSource` fetches `BASE/index.json` once on construction, weight-picks a pool
by its `count`, fetches a random shard JSON on demand (shard cache keyed by path),
and returns a random puzzle avoiding the last 25 seen. `BASE` is
`import.meta.env.BASE_URL + "puzzles"` so it resolves correctly under the
`/rebus/` GitHub Pages subpath.

### PWA / offline

`vite-plugin-pwa` generates a Workbox service worker that:
- **Precaches** the compiled JS/CSS/HTML app shell.
- **NetworkFirst** (4 s timeout) for puzzle JSON shards — fresh on reload, works offline after first visit.
- **CacheFirst** (1-year expiry, max 1 000 entries) for SVG emoji assets.

---

## 8. Out of scope (v1)

Timer, scoring, accounts, leaderboards, hints beyond Reveal, in-app puzzle editor,
difficulty selection, audio, mobile-native packaging, server/backend.
