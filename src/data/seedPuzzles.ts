import type { Puzzle, Token } from "../rebus/types.ts";

/**
 * Hand-authored seed puzzles for M1 — enough to exercise every mechanic
 * (single image, sequence, apostrophe drop-letters, number-words, and all four
 * positional prepositions) across both languages. The bulk 12k set will be
 * machine-generated in M3; these validate the engine, renderer, and UI.
 */

const img = (id: string, alt: string, extra: Partial<Token> = {}): Token => ({
  kind: "image",
  assetId: id,
  file: `assets/images/openmoji/${id}.svg`,
  alt,
  ...extra,
});

const txt = (text: string, extra: Partial<Token> = {}): Token => ({
  kind: "text",
  text,
  ...extra,
});

export const seedPuzzles: Puzzle[] = [
  // --- English: image + sequence ------------------------------------------
  {
    id: "en-lion",
    lang: "en",
    hasImages: true,
    answer: "lion",
    tokens: [img("1F981", "lion")],
    trace: "🦁 = lion",
  },
  {
    id: "en-plant",
    lang: "en",
    hasImages: true,
    answer: "plant",
    tokens: [txt("PL"), img("1F41C", "ant")],
    trace: "PL + 🐜 (ant) = plant",
  },
  {
    id: "en-cape",
    lang: "en",
    hasImages: true,
    answer: "cape",
    tokens: [img("1F393", "cap"), txt("E")],
    trace: "🎓 (cap) + E = cape",
  },
  {
    id: "en-team",
    lang: "en",
    hasImages: true,
    answer: "team",
    tokens: [img("1F9CB", "tea"), txt("M")],
    trace: "🧋 (tea) + M = team",
  },
  {
    id: "en-card",
    lang: "en",
    hasImages: true,
    answer: "card",
    tokens: [img("1F3CE", "car"), txt("D")],
    trace: "🏎 (car) + D = card",
  },
  {
    id: "en-start",
    lang: "en",
    hasImages: true,
    answer: "start",
    tokens: [img("1F31F", "star"), txt("T")],
    trace: "🌟 (star) + T = start",
  },
  {
    id: "en-open",
    lang: "en",
    hasImages: true,
    answer: "open",
    tokens: [txt("O"), img("1F58A", "pen")],
    trace: "O + 🖊 (pen) = open",
  },
  // --- English: apostrophe drop-letters ------------------------------------
  {
    id: "en-ear",
    lang: "en",
    hasImages: true,
    answer: "ear",
    tokens: [img("1F43B", "bear", { dropStart: 1 })],
    trace: "🐻 (bear) − first letter = ear",
  },
  {
    id: "en-car",
    lang: "en",
    hasImages: true,
    answer: "car",
    tokens: [img("1F6D2", "cart", { dropEnd: 1 })],
    trace: "🛒 (cart) − last letter = car",
  },

  // --- Russian: image + apostrophe -----------------------------------------
  {
    id: "ru-tigr",
    lang: "ru",
    hasImages: true,
    answer: "тигр",
    tokens: [img("1F405", "тигр")],
    trace: "🐅 = тигр",
  },
  {
    id: "ru-rab",
    lang: "ru",
    hasImages: true,
    answer: "раб",
    tokens: [img("1F980", "краб", { dropStart: 1 })],
    trace: "🦀 (краб) − первая буква = раб",
  },
  {
    id: "ru-bank",
    lang: "ru",
    hasImages: true,
    answer: "банк",
    tokens: [img("1FAD9", "банка", { dropEnd: 1 })],
    trace: "🫙 (банка) − последняя буква = банк",
  },

  // --- Russian: character-only (number-words) ------------------------------
  {
    id: "ru-stol",
    lang: "ru",
    hasImages: false,
    answer: "стол",
    tokens: [txt("100"), txt("Л")],
    trace: "100 (сто) + Л = стол",
  },
  {
    id: "ru-semya",
    lang: "ru",
    hasImages: false,
    answer: "семья",
    tokens: [txt("7"), txt("Я")],
    trace: "7 (семь) + Я = семья",
  },

  // --- Russian: character-only (positional prepositions) -------------------
  {
    id: "ru-podval",
    lang: "ru",
    hasImages: false,
    answer: "подвал",
    tokens: [txt("ВАЛ", { position: "below" })],
    trace: "ВАЛ под чертой → ПОД + ВАЛ = подвал",
  },
  {
    id: "ru-naves",
    lang: "ru",
    hasImages: false,
    answer: "навес",
    tokens: [txt("ВЕС", { position: "above" })],
    trace: "ВЕС наверху → НА + ВЕС = навес",
  },
  {
    id: "ru-voda",
    lang: "ru",
    hasImages: false,
    answer: "вода",
    tokens: [txt("ОДА", { position: "inside" })],
    trace: "ОДА в рамке → В + ОДА = вода",
  },
  {
    id: "ru-zabor",
    lang: "ru",
    hasImages: false,
    answer: "забор",
    tokens: [txt("БОР", { position: "behind" })],
    trace: "БОР за панелью → ЗА + БОР = забор",
  },
];
