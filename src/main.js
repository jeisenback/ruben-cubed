import { STEPS, START } from "./steps.js";
import { createNav } from "./nav.js";

const nav = createNav(STEPS, START);
const $ = (id) => document.getElementById(id);

// One button per lesson, jumping to that lesson's first step.
const lessonStarts = [];
for (const step of STEPS) {
  if (!lessonStarts.some((s) => s.lesson === step.lesson)) lessonStarts.push(step);
}
for (const step of lessonStarts) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = step.lesson;
  button.dataset.lesson = step.lesson;
  button.addEventListener("click", () => { nav.go(step.id); render(); });
  $("lessons").append(button);
}

$("back").addEventListener("click", () => { nav.back(); render(); });
$("next").addEventListener("click", () => { nav.go(nav.current().next); render(); });

function render() {
  const step = nav.current();
  $("step-lesson").textContent = step.lesson;
  $("step-title").textContent = step.title;
  $("step-text").textContent = step.text;
  $("step-alg").textContent = step.alg;
  $("step-alg").hidden = !step.alg;

  for (const button of $("lessons").children) {
    button.toggleAttribute("aria-current", button.dataset.lesson === step.lesson);
  }

  $("choices").replaceChildren(
    ...(step.choices ?? []).map((choice) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = choice.label;
      button.addEventListener("click", () => { nav.go(choice.to); render(); });
      return button;
    }),
  );
  $("next").hidden = !step.next;
  $("back").disabled = !nav.canBack();

  const cube = $("cube");
  cube.hidden = !step.alg;
  // x2 holds the cube upside down so white is on the bottom and yellow on top.
  // Without a setup, the case is "the cube just before the algorithm" (anchor end).
  // Attributes are set, never removed: the player errors on removed attributes.
  cube.setAttribute("experimental-setup-alg", step.setup ? `x2 ${step.setup}` : "x2");
  cube.setAttribute("experimental-setup-anchor", step.setup ? "start" : "end");
  cube.setAttribute("alg", step.alg);
  // Start every step at its case, even if the last step was played to the end.
  if (customElements.get("twisty-player")) {
    cube.pause();
    cube.timestamp = "start";
  }
}

render();
