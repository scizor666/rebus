import type { Lang, Puzzle } from "../rebus/types.ts";

/** Random puzzle picker that avoids repeating recent puzzles within a language. */
export class PuzzleSelector {
  private recent: string[] = [];

  constructor(
    private readonly all: Puzzle[],
    private readonly historySize = 8,
  ) {}

  next(lang: Lang): Puzzle {
    const pool = this.all.filter((p) => p.lang === lang);
    if (pool.length === 0) throw new Error(`No puzzles for language "${lang}"`);

    const fresh = pool.filter((p) => !this.recent.includes(p.id));
    const choices = fresh.length > 0 ? fresh : pool;
    const picked = choices[Math.floor(Math.random() * choices.length)]!;

    this.recent.push(picked.id);
    const cap = Math.min(this.historySize, pool.length - 1);
    while (this.recent.length > Math.max(cap, 0)) this.recent.shift();
    return picked;
  }
}
