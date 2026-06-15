import type { Lang, Position } from "./types.ts";

/**
 * The preposition a spatial position injects, per language. Used for the
 * reveal trace and for captioning the visual layout. ("sequence" injects
 * nothing.) These mirror the classic Soviet-rebus reading conventions.
 */
export const PREPOSITION: Record<Lang, Record<Position, string>> = {
  ru: {
    sequence: "",
    inside: "в",
    above: "на",
    below: "под",
    behind: "за",
    before: "перед",
  },
  en: {
    sequence: "",
    inside: "in",
    above: "on",
    below: "under",
    behind: "behind",
    before: "before",
  },
};
