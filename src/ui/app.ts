import type { Lang, Puzzle } from "../rebus/types.ts";
import { isCorrect } from "../rebus/normalize.ts";
import { PuzzleSelector } from "../game/select.ts";
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
  private current!: Puzzle;
  private done = false; // solved or revealed → input locked

  constructor(
    private readonly selector: PuzzleSelector,
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
    this.newRound();
  }

  private get t(): Strings {
    return STR[this.lang];
  }

  private setLang(lang: Lang): void {
    if (lang === this.lang) return;
    this.lang = lang;
    this.newRound(); // switching language loads a fresh puzzle immediately
  }

  private newRound(): void {
    this.current = this.selector.next(this.lang);
    this.done = false;

    for (const btn of this.refs.langToggle.querySelectorAll<HTMLElement>(
      "[data-lang]",
    )) {
      btn.classList.toggle("is-active", btn.dataset.lang === this.lang);
    }

    this.refs.puzzle.replaceChildren(renderPuzzle(this.current));
    this.refs.feedback.className = "feedback";
    this.refs.feedback.textContent = "";

    this.refs.input.value = "";
    this.refs.input.placeholder = this.t.placeholder;
    this.refs.input.disabled = false;
    this.refs.submit.disabled = false;
    this.refs.submit.textContent = this.t.check;
    this.refs.input.focus();

    this.renderControls();
  }

  private onSubmit(): void {
    if (this.done) return;
    if (isCorrect(this.refs.input.value, this.current)) {
      this.finish("correct");
    } else {
      this.refs.feedback.className = "feedback feedback--wrong";
      this.refs.feedback.textContent = this.t.wrong;
      this.refs.input.select();
    }
  }

  private reveal(): void {
    this.finish("revealed");
  }

  private finish(kind: "correct" | "revealed"): void {
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
        Object.assign(el("span", "trace"), {
          textContent: this.current.trace,
        }),
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
      ? [make(this.t.next, "btn--primary", () => this.newRound())]
      : [
          make(this.t.reveal, "btn--ghost", () => this.reveal()),
          make(this.t.skip, "btn--ghost", () => this.newRound()),
        ];
    this.refs.controls.replaceChildren(...controls);
  }
}
