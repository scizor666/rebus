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

const RULES: Record<Lang, { title: string; html: string }> = {
  en: {
    title: "How to play",
    html: `<div class="rules">
      <h3>Read the clues left to right and combine them</h3>
      <dl>
        <div>
          <dt>🖼 Image</dt>
          <dd>Read as the English word it depicts.</dd>
        </div>
        <div>
          <dt>Letter (R, C, U, B, T…)</dt>
          <dd>Read as its name: R = <em>are</em>, C = <em>sea</em>, U = <em>you</em>, B = <em>bee</em>, T = <em>tea</em>, K = <em>kay</em>…</dd>
        </div>
        <div>
          <dt>Number (4, 8, 100…)</dt>
          <dd>Read as its word: 4 = <em>four</em>, 8 = <em>eight</em>, 100 = <em>hundred</em>.</dd>
        </div>
        <div>
          <dt>&amp; and @</dt>
          <dd>&amp; = <em>and</em> · @ = <em>at</em></dd>
        </div>
      </dl>

      <h3>Apostrophes — drop letters from the edge</h3>
      <ul>
        <li><span class="example">'🐱 (cat)</span> — drop 1 from start → <em>at</em></li>
        <li><span class="example">🐱' (cat)</span> — drop 1 from end → <em>ca</em></li>
        <li><span class="example">''🐱 (cat)</span> — drop 2 from start → <em>t</em></li>
      </ul>

      <h3>Controls</h3>
      <ul>
        <li><strong>Reveal</strong> — shows the answer and a step-by-step explanation.</li>
        <li><strong>Skip</strong> — moves to the next puzzle silently.</li>
        <li><strong>RU / EN</strong> — switch language at any time.</li>
      </ul>
    </div>`,
  },
  ru: {
    title: "Как играть",
    html: `<div class="rules">
      <h3>Читайте подсказки слева направо и соединяйте</h3>
      <dl>
        <div>
          <dt>🖼 Картинка</dt>
          <dd>Читается как русское слово, которое изображено.</dd>
        </div>
        <div>
          <dt>Цифра (4, 8, 100…)</dt>
          <dd>Читается словом: 4 = <em>четыре</em>, 8 = <em>восемь</em>, 100 = <em>сто</em>.</dd>
        </div>
        <div>
          <dt>Буква внутри буквы</dt>
          <dd>Буквы, написанные внутри О, Ю, Ф, Д, Б или Я, читаются как «в».<br>
          Пример: Р внутри О = <em>вор</em>.</dd>
        </div>
        <div>
          <dt>Буква над буквой</dt>
          <dd>Верхняя группа + предлог + нижняя группа.<br>
          Пример: КА над Л = «КА <em>на</em> Л» = <em>канал</em>.</dd>
        </div>
      </dl>

      <h3>Апострофы — убирают буквы с края</h3>
      <ul>
        <li><span class="example">'🐱 (кот)</span> — убрать 1 с начала → <em>от</em></li>
        <li><span class="example">🐱' (кот)</span> — убрать 1 с конца → <em>ко</em></li>
        <li><span class="example">''🐱 (кот)</span> — убрать 2 с начала → <em>т</em></li>
      </ul>

      <h3>Управление</h3>
      <ul>
        <li><strong>Показать</strong> — открыть ответ и пошаговое объяснение.</li>
        <li><strong>Пропустить</strong> — перейти к следующему ребусу.</li>
        <li><strong>RU / EN</strong> — переключить язык в любой момент.</li>
      </ul>
    </div>`,
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
  helpBtn: HTMLButtonElement;
  helpModal: HTMLElement;
  helpTitle: HTMLElement;
  helpBody: HTMLElement;
  helpClose: HTMLButtonElement;
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
    refs.helpBtn.addEventListener("click", () => this.openHelp());
    refs.helpClose.addEventListener("click", () => this.closeHelp());
    refs.helpModal.addEventListener("click", (e) => {
      if (e.target === refs.helpModal) this.closeHelp();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.closeHelp();
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

  private openHelp(): void {
    const rules = RULES[this.lang];
    this.refs.helpTitle.textContent = rules.title;
    this.refs.helpBody.innerHTML = rules.html;
    this.refs.helpModal.removeAttribute("hidden");
    this.refs.helpClose.focus();
  }

  private closeHelp(): void {
    this.refs.helpModal.setAttribute("hidden", "");
    this.refs.helpBtn.focus();
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
