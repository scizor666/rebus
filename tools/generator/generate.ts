/**
 * Puzzle generator.
 *
 * Auto-mines rebus puzzles from frequency word lists using the decomposition
 * strategies, verifies each one reconstructs its target word, and writes
 * lazy-loadable JSON shards split by language × pool.
 *
 * Run with: npm run generate
 */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Lang, Puzzle } from "../../src/rebus/types.ts";
import type { Manifest } from "../crawler/types.ts";
import { assemble } from "../../src/rebus/assemble.ts";
import { normalize } from "../../src/rebus/normalize.ts";
import { caps, paths, wordSources } from "./config.ts";
import { loadWords } from "./wordlists.ts";
import { isGoodTarget } from "./filters.ts";
import {
  buildReadingIndex,
  charStrategies,
  imageStrategy,
  type PuzzleDraft,
} from "./strategies.ts";

const LANGS: Lang[] = ["ru", "en"];

/** A draft is valid only if its encoding reconstructs its answer exactly. */
function verify(d: PuzzleDraft): boolean {
  return normalize(assemble(d.tokens)) === normalize(d.answer);
}

interface PoolMeta {
  lang: Lang;
  pool: "image" | "char";
  count: number;
  shardSize: number;
  shards: string[];
}

async function writePool(
  lang: Lang,
  pool: "image" | "char",
  drafts: PuzzleDraft[],
): Promise<PoolMeta> {
  const key = `${lang}-${pool}`;
  const dir = join(paths.puzzlesDir, key);
  await mkdir(dir, { recursive: true });

  const puzzles: Puzzle[] = drafts.map((d, i) => ({ id: `${key}-${i}`, ...d }));
  const shards: string[] = [];
  for (let i = 0; i < puzzles.length; i += caps.shardSize) {
    const n = String(shards.length).padStart(3, "0");
    const file = `${key}/${n}.json`;
    await writeFile(
      join(paths.puzzlesDir, file),
      JSON.stringify(puzzles.slice(i, i + caps.shardSize)),
    );
    shards.push(file);
  }
  return { lang, pool, count: puzzles.length, shardSize: caps.shardSize, shards };
}

async function generateLang(
  lang: Lang,
  manifest: Manifest,
): Promise<PoolMeta[]> {
  const words = await loadWords(lang);
  const index = buildReadingIndex(manifest, lang);
  console.log(`  ${lang}: ${words.length} candidate words`);

  // image pool
  const imageDrafts: PuzzleDraft[] = [];
  const seenImage = new Set<string>();
  for (const { word } of words) {
    if (imageDrafts.length >= caps.imagePerLang) break;
    if (seenImage.has(word) || !isGoodTarget(word, lang)) continue;
    const d = imageStrategy(word, index, lang);
    if (d && verify(d)) {
      seenImage.add(word);
      imageDrafts.push(d);
    }
  }

  // char pool — first valid strategy per word
  const charDrafts: PuzzleDraft[] = [];
  const seenChar = new Set<string>();
  for (const { word } of words) {
    if (charDrafts.length >= caps.charPerLang) break;
    if (seenChar.has(word) || !isGoodTarget(word, lang)) continue;
    for (const d of charStrategies(word, lang)) {
      if (verify(d)) {
        seenChar.add(word);
        charDrafts.push(d);
        break;
      }
    }
  }

  console.log(`  ${lang}: image ${imageDrafts.length}, char ${charDrafts.length}`);
  return [
    await writePool(lang, "image", imageDrafts),
    await writePool(lang, "char", charDrafts),
  ];
}

async function main(): Promise<void> {
  console.log("→ Loading asset manifest…");
  const manifest = JSON.parse(
    await readFile(paths.assetManifest, "utf8"),
  ) as Manifest;

  console.log("→ Generating puzzles…");
  await rm(paths.puzzlesDir, { recursive: true, force: true });
  await mkdir(paths.puzzlesDir, { recursive: true });

  const pools: PoolMeta[] = [];
  for (const lang of LANGS) pools.push(...(await generateLang(lang, manifest)));

  const index = {
    generatedAt: new Date().toISOString(),
    sources: LANGS.map((l) => ({ lang: l, ...wordSources[l] })),
    pools,
  };
  await writeFile(
    join(paths.puzzlesDir, "index.json"),
    `${JSON.stringify(index, null, 2)}\n`,
  );

  console.log("\n✓ Generation complete");
  let total = 0;
  for (const p of pools) {
    console.log(`  ${`${p.lang}-${p.pool}`.padEnd(10)} ${p.count}`);
    total += p.count;
  }
  console.log(`  total      ${total}`);
  console.log(`  → ${paths.puzzlesDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
