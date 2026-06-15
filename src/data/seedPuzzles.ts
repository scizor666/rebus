import type { Glyph, Puzzle } from "../rebus/types.ts";

/**
 * Hand-authored seed puzzles for M1 — every entry is a real rebus that
 * transforms or combines its parts (never "name the picture"):
 *   - image + letters in sequence      (🌟 + T = star → START)
 *   - apostrophe drop-letters          (🐻 bear − b = EAR)
 *   - number-words                     (100 → сто, 7 → семь)
 *   - letter-inside-letter → "в"       (О containing ДА → в-О-да = ВОДА)
 *   - letter-over-letter → "на"        (КА over Л → КА-на-Л = КАНАЛ)
 * The bulk 12k set is machine-generated in M3; these validate the engine.
 */

const img = (id: string, alt: string, extra: Partial<Glyph> = {}): Glyph => ({
  kind: "image",
  assetId: id,
  file: `assets/images/openmoji/${id}.svg`,
  alt,
  ...extra,
});

const txt = (text: string, extra: Partial<Glyph> = {}): Glyph => ({
  kind: "text",
  text,
  ...extra,
});

export const seedPuzzles: Puzzle[] = [
  // --- English: image + letters --------------------------------------------
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

  // --- Russian: letter-inside-letter → "в" ---------------------------------
  {
    id: "ru-voda",
    lang: "ru",
    hasImages: false,
    answer: "вода",
    tokens: [{ kind: "inside", outer: txt("О"), inner: txt("ДА") }],
    trace: "в букве О написано ДА → в-О-да = вода",
  },
  {
    id: "ru-vor",
    lang: "ru",
    hasImages: false,
    answer: "вор",
    tokens: [{ kind: "inside", outer: txt("О"), inner: txt("Р") }],
    trace: "в букве О написано Р → в-О-р = вор",
  },

  // --- Russian: letter-over-letter → "на" ----------------------------------
  {
    id: "ru-kanal",
    lang: "ru",
    hasImages: false,
    answer: "канал",
    tokens: [{ kind: "stack", top: txt("КА"), bottom: txt("Л") }],
    trace: "КА над Л, читается «КА на Л» → ка-на-л = канал",
  },
  {
    id: "ru-banan",
    lang: "ru",
    hasImages: false,
    answer: "банан",
    tokens: [{ kind: "stack", top: txt("БА"), bottom: txt("Н") }],
    trace: "БА над Н, читается «БА на Н» → ба-на-н = банан",
  },
];
