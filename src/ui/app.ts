import type { Lang, Puzzle } from "../rebus/types.ts";
import { isCorrect } from "../rebus/normalize.ts";
import type { PuzzleSource } from "../game/packSource.ts";
import { el, renderPuzzle } from "./render.ts";

interface Strings {
  placeholder: string;
  check: string;
  reveal: string;
  skip: string;
  next: string;
  correct: string;
  wrong: string;
  answer: string;
  loading: string;
}

const STR: Record<Lang, Strings> = {
  ru: {
    placeholder: "Введите ответ…",
    check: "Проверить",
    reveal: "Показать",
    skip: "Пропустить",
    next: "Дальше",
    correct: "Верно!",
    wrong: "Не угадали — попробуйте ещё",
    answer: "Ответ",
    loading: "Загрузка…",
  },
  en: {
    placeholder: "Type your answer…",
    check: "Check",
    reveal: "Reveal",
    skip: "Skip",
    next: "Next",
    correct: "Correct!",
    wrong: "Not quite — try again",
    answer: "Answer",
    loading: "Loading…",
  },
};

interface Refs {
  langToggle: HTMLElement;
  puzzle: HTMLElement;
  form: HTMLFormElement;
  input: HTMLInputElement;
  submit: HTMLButtonElement;
  feedback: HTMLElement;
  controls: HTMLElement;
}

export class Game {
  private lang: Lang = "ru";
  private current?: Puzzle;
  private done = false; // solved or revealed → input locked
  private roundToken = 0; // guards against out-of-order async loads

  constructor(
    private readonly source: PuzzleSource,
    private readonly refs: Refs,
  ) {
    refs.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.onSubmit();
    });
    refs.langToggle.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-lang]");
      if (btn) this.setLang(btn.dataset.lang as Lang);
    });
    void this.newRound();
  }

  private get t(): Strings {
    return STR[this.lang];
  }

  private setLang(lang: Lang): void {
    if (lang === this.lang) return;
    this.lang = lang;
    void this.newRound(); // switching language loads a fresh puzzle immediately
  }

  private async newRound(): Promise<void> {
    const token = ++this.roundToken;
    this.done = false;

    for (const btn of this.refs.langToggle.querySelectorAll<HTMLElement>(
      "[data-lang]",
    )) {
      btn.classList.toggle("is-active", btn.dataset.lang === this.lang);
    }

    // loading state
    this.refs.feedback.className = "feedback";
    this.refs.feedback.textContent = "";
    this.refs.controls.replaceChildren();
    this.refs.input.value = "";
    this.refs.input.placeholder = this.t.placeholder;
    this.refs.input.disabled = true;
    this.refs.submit.disabled = true;
    this.refs.puzzle.replaceChildren(
      Object.assign(el("div", "loading"), { textContent: this.t.loading }),
    );

    let puzzle: Puzzle;
    try {
      puzzle = await this.source.next(this.lang);
    } catch (err) {
      if (token !== this.roundToken) return;
      this.refs.puzzle.replaceChildren(
        Object.assign(el("div", "loading"), { textContent: "⚠︎" }),
      );
      console.error(err);
      return;
    }
    if (token !== this.roundToken) return; // a newer round superseded this one

    this.current = puzzle;
    this.refs.puzzle.replaceChildren(renderPuzzle(puzzle));
    this.refs.input.disabled = false;
    this.refs.submit.disabled = false;
    this.refs.submit.textContent = this.t.check;
    this.refs.input.focus();
    this.renderControls();
  }

  private onSubmit(): void {
    if (this.done || !this.current) return;
    if (isCorrect(this.refs.input.value, this.current)) {
      this.finish("correct");
    } else {
      this.refs.feedback.className = "feedback feedback--wrong";
      this.refs.feedback.textContent = this.t.wrong;
      this.refs.input.select();
    }
  }

  private finish(kind: "correct" | "revealed"): void {
    if (!this.current) return;
    this.done = true;
    this.refs.input.disabled = true;
    this.refs.submit.disabled = true;

    const fb = this.refs.feedback;
    if (kind === "correct") {
      fb.className = "feedback feedback--correct";
      fb.textContent = `${this.t.correct} ${this.current.answer}`;
    } else {
      fb.className = "feedback feedback--revealed";
      fb.replaceChildren(
        Object.assign(el("strong"), {
          textContent: `${this.t.answer}: ${this.current.answer}`,
        }),
        Object.assign(el("span", "trace"), { textContent: this.current.trace }),
      );
    }
    this.renderControls();
  }

  private renderControls(): void {
    const make = (label: string, cls: string, onClick: () => void) => {
      const b = el("button", `btn ${cls}`);
      b.type = "button";
      b.textContent = label;
      b.addEventListener("click", onClick);
      return b;
    };

    const controls = this.done
      ? [make(this.t.next, "btn--primary", () => void this.newRound())]
      : [
          make(this.t.reveal, "btn--ghost", () => this.finish("revealed")),
          make(this.t.skip, "btn--ghost", () => void this.newRound()),
        ];
    this.refs.controls.replaceChildren(...controls);
  }
}
