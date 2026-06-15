import type { Lang, Puzzle } from "../rebus/types.ts";
import { seedPuzzles } from "../data/seedPuzzles.ts";

export interface PuzzleSource {
  next(lang: Lang): Promise<Puzzle>;
}

interface PoolMeta {
  lang: Lang;
  pool: "image" | "char";
  count: number;
  shards: string[];
}
interface PackIndex {
  pools: PoolMeta[];
}

const BASE = "/puzzles";

function randInt(n: number): number {
  return Math.floor(Math.random() * n);
}

/**
 * Lazily serves generated puzzles: loads the pack index once, then for each
 * round weight-picks a pool by size (so image vs character puzzles appear in
 * their natural ~1:5 ratio), fetches a random shard on demand (cached), and
 * returns a random puzzle avoiding recent repeats. Falls back to the in-repo
 * seed puzzles if the generated packs aren't present.
 */
export class PackSource implements PuzzleSource {
  private readonly ready: Promise<void>;
  private pools: PoolMeta[] = [];
  private readonly shardCache = new Map<string, Puzzle[]>();
  private readonly recent: string[] = [];
  private usingSeeds = false;

  constructor() {
    this.ready = this.init();
  }

  private async init(): Promise<void> {
    try {
      const res = await fetch(`${BASE}/index.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const index = (await res.json()) as PackIndex;
      this.pools = index.pools.filter((p) => p.count > 0);
      if (this.pools.length === 0) throw new Error("empty pack index");
    } catch (err) {
      console.warn("Puzzle packs unavailable, using seed puzzles.", err);
      this.usingSeeds = true;
    }
  }

  private async loadShard(path: string): Promise<Puzzle[]> {
    const cached = this.shardCache.get(path);
    if (cached) return cached;
    const res = await fetch(`${BASE}/${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
    const puzzles = (await res.json()) as Puzzle[];
    this.shardCache.set(path, puzzles);
    return puzzles;
  }

  /** Pick from `pool`, retrying a few times to dodge recently-seen puzzles. */
  private pick(pool: Puzzle[]): Puzzle {
    let chosen = pool[randInt(pool.length)]!;
    for (let i = 0; i < 8 && this.recent.includes(chosen.id); i++) {
      chosen = pool[randInt(pool.length)]!;
    }
    this.recent.push(chosen.id);
    if (this.recent.length > 25) this.recent.shift();
    return chosen;
  }

  async next(lang: Lang): Promise<Puzzle> {
    await this.ready;

    if (this.usingSeeds) {
      return this.pick(seedPuzzles.filter((p) => p.lang === lang));
    }

    const pools = this.pools.filter((p) => p.lang === lang);
    const total = pools.reduce((sum, p) => sum + p.count, 0);
    let r = randInt(total);
    const pool = pools.find((p) => (r -= p.count) < 0) ?? pools[0]!;
    const shard = pool.shards[randInt(pool.shards.length)]!;
    return this.pick(await this.loadShard(shard));
  }
}
