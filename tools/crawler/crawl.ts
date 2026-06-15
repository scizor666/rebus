/**
 * Image asset crawler.
 *
 * Sources (openly licensed, child-appropriate):
 *   - OpenMoji 16.0.0 color SVGs + English annotations (CC BY-SA 4.0)
 *   - Unicode CLDR annotations for Russian labels (Unicode-3.0)
 *
 * Output:
 *   - public/assets/images/openmoji/<HEX>.svg   (downloaded artwork)
 *   - data/assets/manifest.json                 (assets + RU/EN labels + licenses)
 *   - data/assets/LICENSES.md                   (attribution)
 *
 * Run with: npm run crawl
 */
import { mkdir, writeFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  HTTP_CONCURRENCY,
  OPENMOJI_ATTRIBUTION,
  OPENMOJI_LICENSE,
  paths,
  sources,
  urls,
} from "./config.ts";
import { fetchBuffer, fetchJson, mapPool } from "./http.ts";
import {
  canonicalEnWord,
  canonicalRuWord,
  isBlocked,
  KEEP_GROUPS,
} from "./filters.ts";
import type { Asset, Manifest } from "./types.ts";

interface OpenMojiEntry {
  emoji: string;
  hexcode: string;
  group: string;
  subgroups: string;
  annotation: string;
  tags: string;
  skintone: string;
}

type CldrMap = Record<string, { default?: string[]; tts?: string[] }>;
interface CldrAnnotations {
  annotations: { annotations: CldrMap };
}
interface CldrAnnotationsDerived {
  annotationsDerived: { annotations: CldrMap };
}

/** CLDR keys are fully-qualified emoji; try a few variants to match OpenMoji's char. */
function lookupCldr(map: CldrMap, emoji: string) {
  const VS16 = String.fromCharCode(0xfe0f); // variation selector-16
  return (
    map[emoji] ??
    map[emoji.replaceAll(VS16, "")] ??
    map[emoji + VS16] ??
    undefined
  );
}

async function main(): Promise<void> {
  console.log("→ Fetching source metadata…");
  const [openmoji, cldrRu, cldrRuDerived] = await Promise.all([
    fetchJson<OpenMojiEntry[]>(urls.openmojiData),
    fetchJson<CldrAnnotations>(urls.cldrAnnotations("ru")),
    fetchJson<CldrAnnotationsDerived>(urls.cldrAnnotationsDerived("ru")),
  ]);
  // Base annotations win over derived ones where both exist.
  const ruMap: CldrMap = {
    ...cldrRuDerived.annotationsDerived.annotations,
    ...cldrRu.annotations.annotations,
  };
  console.log(
    `  OpenMoji entries: ${openmoji.length}, CLDR ru entries: ${Object.keys(ruMap).length}`,
  );

  // --- Select candidates ----------------------------------------------------
  console.log("→ Selecting child-appropriate concrete nouns…");
  const candidates = openmoji.flatMap((e): Asset[] => {
    if (e.skintone) return []; // skip skintone variants (duplicate artwork)
    if (!KEEP_GROUPS.has(e.group)) return [];
    if (isBlocked(e.annotation, e.tags)) return [];

    const ru = lookupCldr(ruMap, e.emoji);
    const wordEn = canonicalEnWord(e.annotation);
    const wordRu = canonicalRuWord(ru?.tts);
    if (!wordEn && !wordRu) return []; // no clean label in either language

    const tags = e.tags
      ? e.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    return [
      {
        id: e.hexcode,
        emoji: e.emoji,
        file: `${paths.imagesWebPrefix}/${e.hexcode}.svg`,
        group: e.group,
        subgroups: e.subgroups,
        source: "openmoji",
        license: OPENMOJI_LICENSE,
        attribution: OPENMOJI_ATTRIBUTION,
        en: { word: wordEn, primary: e.annotation, keywords: tags },
        ru: {
          word: wordRu,
          primary: ru?.tts?.[0] ?? "",
          keywords: ru?.default ?? [],
        },
      },
    ];
  });
  console.log(`  Candidates: ${candidates.length}`);

  // --- Download artwork -----------------------------------------------------
  console.log("→ Downloading SVGs…");
  await rm(paths.imagesDir, { recursive: true, force: true });
  await mkdir(paths.imagesDir, { recursive: true });

  const downloaded = await mapPool(
    candidates,
    HTTP_CONCURRENCY,
    async (asset) => {
      const buf = await fetchBuffer(urls.openmojiSvg(asset.id));
      if (!buf) return null; // artwork missing → drop the asset
      await writeFile(join(paths.imagesDir, `${asset.id}.svg`), buf);
      return asset;
    },
    (done, total) => {
      if (done % 100 === 0 || done === total) {
        process.stdout.write(`\r  ${done}/${total}`);
      }
    },
  );
  process.stdout.write("\n");

  const assets = downloaded.filter((a): a is Asset => a !== null);

  // --- Build manifest -------------------------------------------------------
  const byGroup: Record<string, number> = {};
  let withWordEn = 0;
  let withWordRu = 0;
  let withWordBoth = 0;
  for (const a of assets) {
    byGroup[a.group] = (byGroup[a.group] ?? 0) + 1;
    if (a.en.word) withWordEn++;
    if (a.ru.word) withWordRu++;
    if (a.en.word && a.ru.word) withWordBoth++;
  }

  const manifest: Manifest = {
    generatedAt: new Date().toISOString(),
    sources,
    counts: {
      total: assets.length,
      withWordEn,
      withWordRu,
      withWordBoth,
      byGroup,
    },
    assets: assets.sort((a, b) => a.id.localeCompare(b.id)),
  };

  await mkdir(dirname(paths.manifest), { recursive: true });
  await writeFile(paths.manifest, `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(paths.licenses, renderLicenses());

  // --- Report ---------------------------------------------------------------
  console.log("\n✓ Crawl complete");
  console.log(`  Assets:        ${manifest.counts.total}`);
  console.log(`  EN-labeled:    ${withWordEn}`);
  console.log(`  RU-labeled:    ${withWordRu}`);
  console.log(`  Both:          ${withWordBoth}`);
  console.log("  By group:");
  for (const [g, n] of Object.entries(byGroup).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${g.padEnd(16)} ${n}`);
  }
  console.log(`  Manifest:      ${paths.manifest}`);
  console.log(`  Images:        ${paths.imagesDir}`);
}

function renderLicenses(): string {
  return [
    "# Image asset licenses & attribution",
    "",
    "This game's image assets are sourced from openly licensed projects.",
    "",
    ...sources.flatMap((s) => [
      `## ${s.name}`,
      "",
      `- Source: ${s.url}`,
      `- License: ${s.license}`,
      `- ${s.attribution}`,
      "",
    ]),
  ].join("\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
