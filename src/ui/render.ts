import type { Puzzle, Token } from "../rebus/types.ts";

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

/** Render the apostrophe (drop-letter) marks shown beside a token. */
function apostrophes(count: number, side: "start" | "end"): HTMLElement {
  const marks = el("span", `apos apos--${side}`);
  marks.textContent = "’".repeat(count);
  marks.title =
    side === "start"
      ? `drop ${count} letter(s) from the start`
      : `drop ${count} letter(s) from the end`;
  return marks;
}

/** The image or text glyph at the heart of a token. */
function tokenCore(token: Token): HTMLElement {
  const core = el("span", "token-core");
  if (token.kind === "image" && token.file) {
    const img = el("img", "token-img");
    img.src = token.file.startsWith("/") ? token.file : `/${token.file}`;
    img.alt = token.alt ?? "";
    img.draggable = false;
    core.appendChild(img);
  } else {
    const text = el("span", "token-text");
    text.textContent = token.text ?? "";
    core.appendChild(text);
  }
  return core;
}

/**
 * Wrap the core in a positional frame so the player can read the spatial clue:
 * a box (inside → "в/in"), a rule above/below (below/above → "под/на"), or a
 * panel (behind → "за"). "sequence" needs no frame.
 */
function withPosition(core: HTMLElement, token: Token): HTMLElement {
  const pos = token.position ?? "sequence";
  if (pos === "sequence") return core;

  const frame = el("span", `frame frame--${pos}`);
  switch (pos) {
    case "below":
      frame.append(el("span", "rule"), core);
      break;
    case "above":
      frame.append(core, el("span", "rule"));
      break;
    case "behind":
      frame.append(el("span", "panel"), core);
      break;
    case "inside":
    default:
      frame.append(core);
  }
  return frame;
}

function renderToken(token: Token): HTMLElement {
  const wrap = el("span", "token");
  if (token.dropStart) wrap.appendChild(apostrophes(token.dropStart, "start"));
  wrap.appendChild(withPosition(tokenCore(token), token));
  if (token.dropEnd) wrap.appendChild(apostrophes(token.dropEnd, "end"));
  return wrap;
}

export function renderPuzzle(puzzle: Puzzle): HTMLElement {
  const row = el("div", "puzzle-row");
  for (const token of puzzle.tokens) row.appendChild(renderToken(token));
  return row;
}
