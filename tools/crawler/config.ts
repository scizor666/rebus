import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import type { SourceInfo } from "./types.ts";

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(here, "../..");

/** Pinned versions for reproducible crawls. */
export const OPENMOJI_TAG = "16.0.0";
export const CLDR_REF = "main";

export const urls = {
  openmojiData: `https://raw.githubusercontent.com/hfg-gmuend/openmoji/${OPENMOJI_TAG}/data/openmoji.json`,
  openmojiSvg: (hexcode: string) =>
    `https://raw.githubusercontent.com/hfg-gmuend/openmoji/${OPENMOJI_TAG}/color/svg/${hexcode}.svg`,
  cldrAnnotations: (locale: string) =>
    `https://raw.githubusercontent.com/unicode-org/cldr-json/${CLDR_REF}/cldr-json/cldr-annotations-full/annotations/${locale}/annotations.json`,
  cldrAnnotationsDerived: (locale: string) =>
    `https://raw.githubusercontent.com/unicode-org/cldr-json/${CLDR_REF}/cldr-json/cldr-annotations-derived-full/annotationsDerived/${locale}/annotations.json`,
};

export const sources: SourceInfo[] = [
  {
    name: `OpenMoji ${OPENMOJI_TAG}`,
    url: "https://openmoji.org",
    license: "CC BY-SA 4.0",
    attribution:
      "Emoji artwork by OpenMoji – the open-source emoji and icon project. License: CC BY-SA 4.0.",
  },
  {
    name: "Unicode CLDR annotations",
    url: "https://github.com/unicode-org/cldr-json",
    license: "Unicode-3.0",
    attribution:
      "Russian/English emoji names from the Unicode CLDR project. License: Unicode-3.0.",
  },
];

export const OPENMOJI_LICENSE = sources[0]!.license;
export const OPENMOJI_ATTRIBUTION = sources[0]!.attribution;

/** Output locations. */
export const paths = {
  imagesDir: resolve(repoRoot, "public/assets/images/openmoji"),
  imagesWebPrefix: "assets/images/openmoji",
  manifest: resolve(repoRoot, "data/assets/manifest.json"),
  licenses: resolve(repoRoot, "data/assets/LICENSES.md"),
};

/** Concurrency / networking. */
export const HTTP_CONCURRENCY = 16;
export const HTTP_RETRIES = 3;
