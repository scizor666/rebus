import type { Glyph, Node } from "./types.ts";

/** The letters a single glyph contributes, after apostrophe drop-letters. */
function glyphReading(g: Glyph): string {
  let base = (
    g.kind === "image" ? (g.reading ?? g.alt ?? "") : (g.reading ?? g.text ?? "")
  ).toLowerCase();
  if (g.dropStart) base = base.slice(g.dropStart);
  if (g.dropEnd) base = base.slice(0, base.length - g.dropEnd);
  return base;
}

/**
 * Reconstruct the reading of a rebus from its nodes:
 *   - glyph      → its letters (with drops)
 *   - inside     → "в" + outer + inner   (letter-in-letter)
 *   - stack      → top + prep + bottom   (letter-over-letter)
 *
 * Used by the generator to verify every machine-made puzzle actually encodes
 * its target word.
 */
export function assemble(tokens: Node[]): string {
  let out = "";
  for (const n of tokens) {
    if (n.kind === "inside") {
      out += "в" + glyphReading(n.outer) + glyphReading(n.inner);
    } else if (n.kind === "stack") {
      out += glyphReading(n.top) + n.prep + glyphReading(n.bottom);
    } else {
      out += glyphReading(n);
    }
  }
  return out;
}
