import { PackSource } from "./game/packSource.ts";
import { Game } from "./ui/app.ts";

function ref<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element #${id}`);
  return node as T;
}

new Game(new PackSource(), {
  langToggle: ref("langToggle"),
  puzzle: ref("puzzle"),
  form: ref<HTMLFormElement>("answerForm"),
  input: ref<HTMLInputElement>("answerInput"),
  submit: ref<HTMLButtonElement>("submitBtn"),
  feedback: ref("feedback"),
  controls: ref("controls"),
  helpBtn: ref<HTMLButtonElement>("helpBtn"),
  helpModal: ref("helpModal"),
  helpTitle: ref("helpTitle"),
  helpBody: ref("helpBody"),
  helpClose: ref<HTMLButtonElement>("helpClose"),
});
