import type { Lang } from "../../src/rebus/types.ts";

/**
 * Literal number-word spellings used in character rebuses. We use *literal*
 * spellings (4 → "four", 100 → "сто") so the encoding reconstructs the target
 * word exactly — no phonetic guessing. Ordered longest-reading-first so the
 * generator prefers the most letters covered.
 */
export const NUMBER_WORDS: Record<Lang, { display: string; reading: string }[]> =
  {
    en: [
      { display: "3", reading: "three" },
      { display: "8", reading: "eight" },
      { display: "7", reading: "seven" },
      { display: "5", reading: "five" },
      { display: "9", reading: "nine" },
      { display: "4", reading: "four" },
      { display: "6", reading: "six" },
      { display: "10", reading: "ten" },
      { display: "2", reading: "two" },
      { display: "1", reading: "one" },
      { display: "0", reading: "zero" },
    ],
    ru: [
      { display: "1000", reading: "тысяча" },
      { display: "100", reading: "сто" },
      { display: "40", reading: "сорок" },
      { display: "8", reading: "восемь" },
      { display: "9", reading: "девять" },
      { display: "5", reading: "пять" },
      { display: "6", reading: "шесть" },
      { display: "7", reading: "семь" },
      { display: "4", reading: "четыре" },
      { display: "3", reading: "три" },
      { display: "2", reading: "два" },
      { display: "10", reading: "десять" },
    ],
  };
