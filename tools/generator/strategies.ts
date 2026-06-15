import type { Asset, Manifest } from "../crawler/types.ts";
import type { Glyph, Lang, Puzzle } from "../../src/rebus/types.ts";
import { NUMBER_WORDS } from "./numberWords.ts";

export type PuzzleDraft = Omit<Puzzle, "id">;

// --- glyph builders --------------------------------------------------------
const textGlyph = (
  text: string,
  reading?: string,
  extra: Partial<Glyph> = {},
): Glyph => ({ kind: "text", text, ...(reading ? { reading } : {}), ...extra });

const imageGlyph = (asset: Asset, reading: string, extra: Partial<Glyph> = {}): Glyph => ({
  kind: "image",
  assetId: asset.id,
  file: asset.file,
  alt: reading,
  ...extra,
});

// --- image reading index ---------------------------------------------------
interface ReadingEntry {
  asset: Asset;
  word: string; // the asset's full depicted word
  ds: number; // leading drops
  de: number; // trailing drops
}

/**
 * Index every image asset by the reading it can present, including apostrophe
 * drop-letter variants (e.g. "cart" also indexes "car"/"ar"/"art"…). Lets the
 * image strategy find, for a target word, the longest pictured sub-part.
 */
export function buildReadingIndex(manifest: Manifest, lang: Lang): Map<string, ReadingEntry[]> {
  const index = new Map<string, ReadingEntry[]>();
  for (const asset of manifest.assets) {
    const word = asset[lang].word;
    if (!word || word.length < 2) continue;
    const L = word.length;
    for (let ds = 0; ds <= 3 && ds <= L - 2; ds++) {
      for (let de = 0; de <= 3 && L - ds - de >= 2; de++) {
        const r = word.slice(ds, L - de);
        const list = index.get(r);
        const entry: ReadingEntry = { asset, word, ds, de };
        if (list) list.push(entry);
        else index.set(r, [entry]);
      }
    }
  }
  return index;
}

// --- S1: image + letters (image pool) --------------------------------------
export function imageStrategy(
  word: string,
  index: Map<string, ReadingEntry[]>,
  lang: Lang,
): PuzzleDraft | null {
  const L = word.length;
  // Prefer the longest pictured sub-part (image carries the most letters).
  for (let len = L; len >= 2; len--) {
    for (let i = 0; i + len <= L; i++) {
      const r = word.slice(i, i + len);
      const entries = index.get(r);
      if (!entries) continue;
      const coversWhole = i === 0 && len === L;
      const prefix = word.slice(0, i);
      const suffix = word.slice(i + len);
      if (prefix.length + suffix.length > 5) continue; // keep image-dominant

      // Prefer a no-drop entry; fall back to a drop variant. Reject the entry
      // that would make the bare picture equal the whole word (that's naming).
      // Keep the picture recognizable: at least half its letters must survive.
      const recognizable = (e: ReadingEntry) => len * 2 >= e.word.length;
      const noDrop = entries.find((e) => e.ds === 0 && e.de === 0);
      const entry =
        noDrop && !coversWhole
          ? noDrop
          : entries.find((e) => (e.ds || e.de) && recognizable(e));
      if (!entry || !recognizable(entry)) continue;
      if (coversWhole && entry.ds === 0 && entry.de === 0) continue;

      const tokens: Glyph[] = [];
      if (prefix) tokens.push(textGlyph(prefix.toUpperCase()));
      tokens.push(imageGlyph(entry.asset, entry.word, dropOpts(entry)));
      if (suffix) tokens.push(textGlyph(suffix.toUpperCase()));

      return {
        lang,
        hasImages: true,
        answer: word,
        tokens,
        trace: imageTrace(prefix, entry, suffix, word),
      };
    }
  }
  return null;
}

function dropOpts(entry: ReadingEntry): Partial<Glyph> {
  const o: Partial<Glyph> = {};
  if (entry.ds) o.dropStart = entry.ds;
  if (entry.de) o.dropEnd = entry.de;
  return o;
}

function imageTrace(
  prefix: string,
  entry: ReadingEntry,
  suffix: string,
  word: string,
): string {
  const drops: string[] = [];
  if (entry.ds) drops.push(`−${entry.ds} спереди`);
  if (entry.de) drops.push(`−${entry.de} сзади`);
  const pic = `«${entry.word}»${drops.length ? ` (${drops.join(", ")})` : ""}`;
  const parts = [
    prefix && prefix.toUpperCase(),
    pic,
    suffix && suffix.toUpperCase(),
  ].filter(Boolean);
  return `${parts.join(" + ")} = ${word}`;
}

// --- S2: number-words (char pool) ------------------------------------------
function numberStrategy(word: string, lang: Lang): PuzzleDraft | null {
  for (const { display, reading } of NUMBER_WORDS[lang]) {
    const i = word.indexOf(reading);
    if (i < 0) continue;
    const prefix = word.slice(0, i);
    const suffix = word.slice(i + reading.length);
    if (!prefix && !suffix) continue; // number alone == word → naming
    const tokens: Glyph[] = [];
    if (prefix) tokens.push(textGlyph(prefix.toUpperCase()));
    tokens.push(textGlyph(display, reading));
    if (suffix) tokens.push(textGlyph(suffix.toUpperCase()));
    const parts = [
      prefix && prefix.toUpperCase(),
      `${display} (${reading})`,
      suffix && suffix.toUpperCase(),
    ].filter(Boolean);
    return {
      lang,
      hasImages: false,
      answer: word,
      tokens,
      trace: `${parts.join(" + ")} = ${word}`,
    };
  }
  return null;
}

// --- S2b: English letter-names (char pool) ---------------------------------
/** Single letters that read as their (multi-letter) name in a rebus. */
const LETTER_NAMES: Record<string, string[]> = {
  b: ["bee"],
  c: ["sea", "see"],
  g: ["gee"],
  i: ["eye"],
  j: ["jay"],
  k: ["kay"],
  o: ["oh"],
  p: ["pea"],
  q: ["cue"],
  r: ["are"],
  t: ["tea"],
  u: ["you", "ewe"],
  x: ["ex"],
  y: ["why"],
};

function letterNameStrategy(word: string): PuzzleDraft | null {
  for (const [letter, readings] of Object.entries(LETTER_NAMES)) {
    for (const reading of readings) {
      const i = word.indexOf(reading);
      if (i < 0) continue;
      const prefix = word.slice(0, i);
      const suffix = word.slice(i + reading.length);
      if (!prefix && !suffix) continue; // letter-name alone == word
      const tokens: Glyph[] = [];
      if (prefix) tokens.push(textGlyph(prefix.toUpperCase()));
      tokens.push(textGlyph(letter.toUpperCase(), reading));
      if (suffix) tokens.push(textGlyph(suffix.toUpperCase()));
      const parts = [
        prefix && prefix.toUpperCase(),
        `${letter.toUpperCase()} (${reading})`,
        suffix && suffix.toUpperCase(),
      ].filter(Boolean);
      return {
        lang: "en",
        hasImages: false,
        answer: word,
        tokens,
        trace: `${parts.join(" + ")} = ${word}`,
      };
    }
  }
  return null;
}

// --- S2c: English symbols (char pool) --------------------------------------
/** Symbols that read as a word inside another word (classic rebus devices). */
const SYMBOLS: { display: string; reading: string }[] = [
  { display: "&", reading: "and" },
  { display: "@", reading: "at" },
];

function symbolStrategy(word: string): PuzzleDraft | null {
  for (const { display, reading } of SYMBOLS) {
    const i = word.indexOf(reading);
    if (i < 0) continue;
    const prefix = word.slice(0, i);
    const suffix = word.slice(i + reading.length);
    if (!prefix && !suffix) continue;
    const tokens: Glyph[] = [];
    if (prefix) tokens.push(textGlyph(prefix.toUpperCase()));
    tokens.push(textGlyph(display, reading));
    if (suffix) tokens.push(textGlyph(suffix.toUpperCase()));
    const parts = [
      prefix && prefix.toUpperCase(),
      `${display} (${reading})`,
      suffix && suffix.toUpperCase(),
    ].filter(Boolean);
    return {
      lang: "en",
      hasImages: false,
      answer: word,
      tokens,
      trace: `${parts.join(" + ")} = ${word}`,
    };
  }
  return null;
}

// --- S3: letter-inside-letter "в" (RU char pool) ---------------------------
function insideStrategy(word: string): PuzzleDraft | null {
  if (word[0] !== "в" || word.length < 3) return null;
  const outer = word[1]!;
  const inner = word.slice(2);
  return {
    lang: "ru",
    hasImages: false,
    answer: word,
    tokens: [
      {
        kind: "inside",
        outer: textGlyph(outer.toUpperCase()),
        inner: textGlyph(inner.toUpperCase()),
      },
    ],
    trace: `в букве ${outer.toUpperCase()} написано ${inner.toUpperCase()} → в-${outer}-${inner} = ${word}`,
  };
}

// --- S4: letter-over-letter "на/над/под/за/по" (RU char pool) --------------
const STACK_PREPS = ["над", "под", "на", "за", "по"]; // longer first

function stackStrategy(word: string): PuzzleDraft | null {
  for (const prep of STACK_PREPS) {
    const i = word.indexOf(prep);
    if (i < 1) continue; // need a non-empty top group
    const top = word.slice(0, i);
    const bottom = word.slice(i + prep.length);
    if (!bottom) continue; // need a non-empty bottom group
    return {
      lang: "ru",
      hasImages: false,
      answer: word,
      tokens: [
        {
          kind: "stack",
          top: textGlyph(top.toUpperCase()),
          bottom: textGlyph(bottom.toUpperCase()),
          prep,
        },
      ],
      trace: `${top.toUpperCase()} над ${bottom.toUpperCase()}, читается «${top} ${prep} ${bottom}» = ${word}`,
    };
  }
  return null;
}

/** All character-pool strategies for a word, best-first. */
export function charStrategies(word: string, lang: Lang): PuzzleDraft[] {
  const out: PuzzleDraft[] = [];
  const num = numberStrategy(word, lang);
  if (num) out.push(num);
  if (lang === "en") {
    const ln = letterNameStrategy(word);
    if (ln) out.push(ln);
    const sym = symbolStrategy(word);
    if (sym) out.push(sym);
  } else {
    const inside = insideStrategy(word);
    if (inside) out.push(inside);
    const stack = stackStrategy(word);
    if (stack) out.push(stack);
  }
  return out;
}
