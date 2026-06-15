import type { Glyph, Node, Puzzle } from "../rebus/types.ts";

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

/** The image or text at the heart of a glyph. */
function glyphCore(glyph: Glyph): HTMLElement {
  const core = el("span", "token-core");
  if (glyph.kind === "image" && glyph.file) {
    const img = el("img", "token-img");
    img.src = `${import.meta.env.BASE_URL}${glyph.file}`;
    img.alt = glyph.alt ?? "";
    img.draggable = false;
    core.appendChild(img);
  } else {
    const text = el("span", "token-text");
    text.textContent = glyph.text ?? "";
    core.appendChild(text);
  }
  return core;
}

/** Apostrophe (drop-letter) marks shown beside a glyph. */
function apostrophes(count: number, side: "start" | "end"): HTMLElement {
  const marks = el("span", `apos apos--${side}`);
  marks.textContent = "’".repeat(count);
  marks.title =
    side === "start"
      ? `drop ${count} letter(s) from the start`
      : `drop ${count} letter(s) from the end`;
  return marks;
}

/** A standalone glyph, with any apostrophe marks. */
function renderGlyph(glyph: Glyph): HTMLElement {
  const wrap = el("span", "token");
  if (glyph.dropStart) wrap.appendChild(apostrophes(glyph.dropStart, "start"));
  wrap.appendChild(glyphCore(glyph));
  if (glyph.dropEnd) wrap.appendChild(apostrophes(glyph.dropEnd, "end"));
  return wrap;
}

function renderNode(node: Node): HTMLElement {
  switch (node.kind) {
    case "inside": {
      // Inner letters drawn within the container letter → "в / in".
      const wrap = el("span", "token inside");
      wrap.append(
        Object.assign(glyphCore(node.outer), { className: "token-core outer" }),
      );
      const inner = el("span", "inner");
      inner.appendChild(glyphCore(node.inner));
      wrap.appendChild(inner);
      return wrap;
    }
    case "stack": {
      // One group above another → vertical preposition (на / над / под).
      const wrap = el("span", "token stack");
      wrap.append(glyphCore(node.top), glyphCore(node.bottom));
      return wrap;
    }
    default:
      return renderGlyph(node);
  }
}

export function renderPuzzle(puzzle: Puzzle): HTMLElement {
  const row = el("div", "puzzle-row");
  for (const node of puzzle.tokens) row.appendChild(renderNode(node));
  return row;
}
