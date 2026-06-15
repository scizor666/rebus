# Rebus — Specification (v1)

A browser game that shows a randomly-selected rebus puzzle each round. The player
decodes the puzzle into a word or phrase. No timer, no score — just puzzle after
puzzle, replayable infinitely. Inspired by classic Soviet rebuses (combinations of
images and characters positioned in space, plus apostrophe "drop-letter" marks).

---

## 1. Confirmed requirements

| Decision | Choice |
|---|---|
| Answer input | **Free-text typed**, normalized before comparison |
| Puzzle source | **Auto-generated** from word lists / dictionaries |
| Image assets | Open emoji/icon sets **+ web-crawled** GPL/CC, child-appropriate images |
| Asset target | **1,000 RU + 1,000 EN** image assets (~2,000 total) |
| Spatial rules | **Full positional semantics** (above/below/inside/behind → prepositions) |
| Language switch | **Always-visible** RU ⇄ EN toggle; switch any time |
| Switch mid-round | **Immediately loads a new puzzle** in the new language |
| Asset pipeline | **Crawler built up front** (not deferred) |
| Content data | **Auto-mined** from an open dictionary + frequency list |
| Puzzle counts | **2,000** image-based + **10,000** character-only = **12,000** |
| Language split | ~50% RU / ~50% EN across each pool |

### Assumptions (override if wrong)
- **No UI framework** — vanilla TypeScript + a thin render layer, bundled by Vite.
  Keeps dependencies minimal for a single-screen game. (Can swap to React/Svelte if desired.)
- Static hosting only; no backend/server. Puzzle packs and assets are static files.
- Game state (current puzzle, recent history) is in-memory; no persistence/accounts in v1.

---

## 2. Tech stack
- **Node 20**, **TypeScript** (strict), **Vite** dev server + build.
- **Git** initialized (branch `main`).
- Offline tooling (crawler, generator) are Node/TS scripts run from `package.json`.
- Output: a static SPA + JSON puzzle packs + an image asset library.

---

## 3. Rebus mechanics (the encoding model)

A puzzle is an ordered list of **tokens**. The answer is built by reading each token,
applying its transforms, and combining readings according to each token's spatial
**position**.

### 3.1 Token reading
- **Image token** → reads as the word the picture depicts (in the puzzle's language).
- **Text token** → reads as its literal characters. Numbers may read as number-words
  (`100 → сто`, `4 → for`), letters may read as letter-names where relevant.

### 3.2 Apostrophe drop-letters
- Leading apostrophes drop **N** letters from the **start** of that token's reading.
- Trailing apostrophes drop **N** letters from the **end**.
- **Max 3 per side.** Example: `'' 🐱(cat) → "t"` (drop first 2 of "cat").

### 3.3 Positional semantics (Soviet-style)
A token's position relative to its neighbor injects a preposition into the reading:

| Position | RU preposition | EN gloss |
|---|---|---|
| sequence (left→right) | — | concatenate |
| inside | `в` | "in" |
| above / on | `на` / `над` | "on"/"above" |
| below | `под` | "under" |
| behind | `за` | "behind" |
| before | `перед` | "before" |

Example: `ХОД` rendered *inside* the letter `С`, both *after* `В` → `в + с + ход = восход`.
Reading assembly walks the token tree, inserting prepositions for positional relations,
then applies drop-letters, then concatenates.

### 3.4 Puzzle data model (draft)
```ts
type Lang = 'ru' | 'en';
type Position = 'sequence' | 'inside' | 'above' | 'below' | 'behind' | 'before';

interface Token {
  kind: 'image' | 'text';
  assetId?: string;     // image tokens: which picture
  reading: string;      // letters this token contributes (the depicted word, or literal chars)
  dropStart?: 0|1|2|3;  // leading apostrophes
  dropEnd?: 0|1|2|3;    // trailing apostrophes
  position?: Position;  // relation to the preceding token (default 'sequence')
}

interface Puzzle {
  id: string;
  lang: Lang;
  hasImages: boolean;   // true → from the 2k image pool, false → from the 10k char pool
  answer: string;       // canonical solution
  acceptable: string[]; // pre-normalized accepted spellings
  tokens: Token[];
  trace?: string;       // human-readable derivation, used for Reveal explanation/debug
}
```

### 3.5 Answer normalization
lowercase → trim → collapse internal whitespace → strip punctuation → RU `ё`→`е`.
Input is accepted if its normalized form is in `acceptable`.

---

## 4. Gameplay loop
1. Pick a random puzzle from the active language pool (no immediate repeats — shuffle bag
   / recent-history exclusion).
2. Render tokens with positional layout.
3. Player types an answer and submits.
   - Correct → success feedback + **Next**.
   - **Reveal** shows the answer + derivation (`trace`); **Skip** moves on.
4. New random puzzle. Repeat forever.
5. **Language toggle** is always visible; flipping it immediately loads a fresh puzzle
   in the new language.

---

## 5. Build pipelines

### 5.1 Image asset crawler (built up front)
- **Sources**: openly licensed, child-appropriate art — e.g. Openclipart (CC0),
  OpenMoji (CC-BY-SA), Twemoji (CC-BY), Noto Emoji. Final source list TBD during build.
- **Behavior**: respect `robots.txt` and rate limits; download, normalize to SVG/PNG,
  dedupe, and tag each asset with the word(s) it depicts per language.
- **Output**: an asset manifest `word → assetId → file (+ license/attribution)`.
- **Target**: 1,000 RU-labeled + 1,000 EN-labeled assets.
- **Compliance**: store license + attribution metadata for every asset.

### 5.2 Puzzle generator (auto-mined from dictionary)
- **Inputs**: open dictionary + frequency list per language
  (RU candidates: Hunspell `ru_RU`, OpenRussian; EN candidates: SCOWL / `words`, plus a
  public frequency list). Final sources TBD during build.
- **Decomposition miner**: for each target word, find a segmentation into sub-readings
  that are (a) depictable words with an image asset, (b) number-words, (c) letter-names,
  (d) reachable via apostrophe drop, or (e) positional combinations (preposition + stem).
- **Validation**: ensure the assembled reading equals the target; prefer unique,
  solvable, age-appropriate results; score rough difficulty.
- **Output**: chunked JSON puzzle packs split by `lang` × `hasImages`, sized for lazy
  loading (12k puzzles are never all loaded at once).
- **Quality note**: auto-mining scales fast but is noisier; generator includes filters
  and a manual bl* / allow list to prune bad puzzles.

---

## 6. Runtime architecture
- **Pack loader**: lazily fetches puzzle pack chunks for the active language/pool.
- **Selector**: random pick with recent-history exclusion to avoid repeats.
- **Reader/assembler**: turns a `Puzzle` into its solution (used for Reveal + validation
  of generated packs).
- **Renderer**: positional layout (CSS grid/absolute) for inside/above/below/behind;
  renders image and text tokens with apostrophe marks.
- **Input/validator**: Cyrillic-capable text field + normalization compare.
- **Controls**: Next / Reveal / Skip + always-on language toggle.

---

## 7. Milestones
- **M0 — Scaffold**: Vite + TS project, git, folder structure, lint/format. *(git already init'd)*
- **M1 — Playable core**: data model, ~30 hand-seeded puzzles, reader/assembler, renderer
  (incl. positional), free-text answer loop, language toggle. Game is fully playable.
- **M2 — Asset crawler**: source selection, crawler, normalization, tagged manifest → ~2k images.
- **M3 — Generator**: dictionary ingestion, decomposition miner, validation, full 12k packs.
- **M4 — Polish & scale**: lazy pack loading at full size, reveal explanations, layout polish.

> Note: "crawler up front" — M2 is sequenced right after the playable core so the asset
> library exists before bulk generation (M3 depends on the asset manifest for image puzzles).

---

## 8. Out of scope (v1)
Timer, scoring, accounts, leaderboards, hints beyond Reveal, in-app puzzle editor,
difficulty selection, audio, mobile-native packaging, server/backend.

---

## 9. Open items to resolve during build
- Final crawl source list + license compatibility sign-off.
- Final dictionary/frequency-list sources per language.
- Number-word and letter-name reading tables (RU/EN).
- Difficulty scoring heuristic (informational only in v1; no scoring shown to player).
