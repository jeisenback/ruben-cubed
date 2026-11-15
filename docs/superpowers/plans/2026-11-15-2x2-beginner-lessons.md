# 2x2 Beginner Lessons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static GitHub Pages site that teaches the 2x2 beginner method as branching steps, each with an animated 3D cube.

**Architecture:** Step content is a plain data list (`src/steps.js`). A small history-based navigator (`src/nav.js`) handles Next / choices / Back / jump. `src/main.js` renders the current step and a cubing.js `<twisty-player>`. No framework, no build step for the site.

**Tech Stack:** HTML, CSS, ES modules; cubing.js 0.66.1 from jsDelivr; Node 22 `node:test`; Playwright (preinstalled) for the page test; esbuild (dev only) to bundle a local cubing.js copy for tests.

**Spec:** `docs/superpowers/specs/2026-11-15-2x2-beginner-lessons-design.md`

## Global Constraints

- No framework, no backend, no build step for the shipped site. Hosted on GitHub Pages from the repo root.
- cubing.js pinned to exactly `0.66.1`. Browser loads `https://cdn.jsdelivr.net/npm/cubing@0.66.1/twisty/+esm` (resolves cubing's bare imports).
- Puzzle id `2x2x2`. Algorithms use only R, U, F turns (with `'` and `2`).
- Plain-language explanations; define any cubing term on first use.
- No emojis anywhere (code, copy, commits).
- The sandbox cannot reach cdn.jsdelivr.net: tests must never depend on it.

## Review Focus

1. CDN unreachable / slow: step text, choices and navigation must still render and work (cube area may be empty). Pinned by `page: works with cube library blocked` in Task 3.
2. Phone width (375px): no horizontal scroll, choice buttons wrap. Pinned by `page: no horizontal scroll at 375px` in Task 3.
3. Back after a loop ("look again" branch taken twice): Back retraces every visit, not just unique steps. Pinned by `nav: back retraces loops` in Task 2.
4. Changing step mid-animation: the player must show the new step's case, not continue the old one. Pinned by `page: player alg/setup follow the step` in Task 3.
5. A step label that does not match the cube shown (e.g. "hold the yellow corner front-left" when it is elsewhere). Pinned by the kpuzzle tests in Task 1 plus the screenshot check in Task 3.

---

### Task 1: Step content, verified against a cube model

**Files:**
- Create: `package.json`, `.gitignore` (`node_modules/`), `src/steps.js`
- Test: `test/steps.test.js`

**Interfaces:**
- Produces: `export const START = "notation"`; `export const STEPS` - array of
  `{ id: string, lesson: string, title: string, text: string, alg: string, setup?: string, next?: string, choices?: { label: string, to: string }[] }`.
  When `setup` is absent the player shows the case as "the cube before `alg`" (setup = inverse of alg). Exactly one of `next` / `choices` is present, except the final step which has neither.
- `package.json`: `"type": "module"`, `"scripts": { "test": "node --test" }`, devDependencies `cubing@0.66.1`, `esbuild` (exact current version).

Step content (ids, lessons, algs, setups are pinned; wording is the builder's, plain language):

| id | lesson | alg | setup | next / choices |
|---|---|---|---|---|
| notation | Notation | `R R' U U' F F' R2 U2` | `U2' R2'` | next: fl-intro |
| fl-intro | First layer | `""` (explain trigger `R U R' U'`, solve 3 corners by feel) | - | choices: right / front / up -> fl-right, fl-front, fl-up |
| fl-right / fl-front / fl-up | First layer | `(R U R' U')` repeated k times, k in {1,3,5} | - | next: oll-intro |
| oll-intro | Top color | `""` | - | choices: one / none / two -> oll-one, oll-none, oll-two |
| oll-one | Top color | `R U R' U R U2 R'` | - | next: pll-intro |
| oll-none | Top color | `R U R' U R U2 R'` | `R U R' U R U2 R' R U R' U R U2 R'` | next: oll-intro ("look again") |
| oll-two | Top color | `R U R' U R U2 R'` | `R U R' U' R' F R F'` | next: oll-intro |
| pll-intro | Top corners | `""` | - | choices: headlights / none -> pll-lights, pll-none |
| pll-lights | Top corners | `R U R' U' R' F R2 U' R' U' R U R' F'` | - | next: finish |
| pll-none | Top corners | same alg | `F R U' R' U' R U R' F' R U R' U' R' F R F'` | next: pll-intro |
| finish | Finish | `U` | - | (none) |

Note: the PLL algorithm swaps the two right-side top corners, so `pll-lights` text must say **hold the headlights on the left** (the spec said "back"; this matches the algorithm). Which k goes with right/front/up is decided by Step 1's test plus Task 3's screenshot check (k=3 leaves white facing up per the cube model: orientation 0).

- [ ] **Step 1: Write the failing tests** in `test/steps.test.js` using `puzzles["2x2x2"].kpuzzle()` from `cubing/puzzles` and `Alg` from `cubing/alg`. Corner orbit `CORNERS`, positions 0-3 = UFR, URB, UBL, ULF; 4-7 = DRF, DFL, DLB, DBR. "Case pattern" = `defaultPattern().applyAlg(setup ?? Alg(alg).invert())`.
  - `steps: graph is valid` - ids unique; START exists; every `next`/`to` exists; every step reachable from START; only `finish` has neither next nor choices.
  - `steps: algs parse and use only R U F` - every alg and setup parses; every move family in {R, U, F}.
  - `steps: every case leaves the bottom layer alone except first-layer cases` - for non-`fl-*` steps, case pattern positions 4-7 hold pieces 4-7 with orientation 0.
  - `steps: first-layer cases put the DRF corner above its slot` - for each fl branch, piece 4 is at position 0, other D positions solved; the three branches have three different orientations at position 0; the `fl-up` one has orientation 0.
  - `steps: oll cases` - count of U positions with orientation 0 in the case pattern: oll-one = 1 and it is position 3 (ULF, front-left); oll-none = 0; oll-two = 2. All U pieces stay in the U layer.
  - `steps: pll cases` - all orientations 0; pll-lights: positions 0 and 1 swapped, 2 and 3 in place (headlights on the left); pll-none: 0 and 2 swapped, 1 and 3 in place.
  - `steps: playing every alg from its case ends where claimed` - oll-one, pll-lights, finish, fl-* end fully solved; oll-none ends at an oll-one-shaped case (exactly one U orientation 0).
- [ ] **Step 2:** `npm install && npm test` - expect FAIL (`src/steps.js` missing).
- [ ] **Step 3:** Write `src/steps.js` per the table.
- [ ] **Step 4:** `npm test` - expect all steps tests PASS. If a k/label pairing fails, swap the k values between fl branches; never change a test.
- [ ] **Step 5:** Commit `package.json package-lock.json .gitignore src/steps.js test/steps.test.js`.

### Task 2: Navigator with history

**Files:**
- Create: `src/nav.js`
- Test: `test/nav.test.js`

**Interfaces:**
- Produces: `export function createNav(steps, startId)` returning `{ current(): Step, go(id: string): void, back(): void, canBack(): boolean }`. `go` throws on unknown id. `back` on empty history is a no-op. Jumping from the lesson list uses `go` (so Back returns from a jump).

- [ ] **Step 1: Write failing tests** (use a tiny hand-made steps array, not the real content):
  - `nav: starts at start` - `current().id === startId`, `canBack() === false`.
  - `nav: go then back` - go(b), back() -> current a, canBack false.
  - `nav: back retraces loops` - a -> b -> a -> b, then back three times gives a, b, a.
  - `nav: go unknown id throws`.
  - `nav: back at start is a no-op`.
- [ ] **Step 2:** `npm test` - FAIL.
- [ ] **Step 3:** Implement with an array history stack.
- [ ] **Step 4:** `npm test` - PASS.
- [ ] **Step 5:** Commit.

### Task 3: Page, styling, page test, README

**Files:**
- Create: `index.html`, `src/main.js`, `src/style.css`, `README.md`
- Test: `test/page.test.js`

**Interfaces:**
- Consumes: `STEPS`, `START` (Task 1); `createNav` (Task 2).
- Page DOM contract (the test relies on these):
  - `#lessons` - list of buttons, one per distinct `lesson` in STEPS order; clicking goes to that lesson's first step.
  - `#step-title`, `#step-text`, `#step-alg` (alg text; hidden when alg is empty).
  - `#choices` - one button per choice when present; otherwise a `#next` button. `#back` disabled when `!canBack()`.
  - `twisty-player#cube` with `puzzle="2x2x2"`; on each render set `alg`; set `experimental-setup-alg` to `setup` when present, else `experimental-setup-anchor="end"`. Hide the player when alg is empty.
- `index.html` loads `src/main.js` as a module and separately `<script type="module" src="https://cdn.jsdelivr.net/npm/cubing@0.66.1/twisty/+esm">` so a CDN failure cannot stop `main.js`.
- Layout works at 375px wide; no horizontal page scroll. Light and dark via `prefers-color-scheme`.

- [ ] **Step 1: Write failing page tests** in `test/page.test.js` (`node:test` + `createRequire` to load `playwright`). Start a local static server (node `http`) on the repo root. Route `https://cdn.jsdelivr.net/npm/cubing@0.66.1/twisty/+esm` to a bundle built once per run with esbuild from `cubing/twisty` (`bundle: true, format: "esm"`, written to the OS temp dir). Fail the test on any page console error.
  - `page: shows first step` - `#step-title` is the notation title; `#lessons` has 5 buttons; `#back` disabled.
  - `page: next, choice and back` - Next -> fl-intro; click the "up" choice -> fl-up title; Back -> fl-intro; Back -> notation.
  - `page: lesson jump and back` - click "Top corners" lesson -> pll-intro; Back -> previous step.
  - `page: player alg/setup follow the step` - on oll-none, `#cube` `alg` = Sune and `experimental-setup-alg` = its setup; go to oll-one, `experimental-setup-alg` absent/empty and anchor `end`.
  - `page: works with cube library blocked` - abort the CDN route; title, choices and Back still work.
  - `page: no horizontal scroll at 375px` - `document.documentElement.scrollWidth <= 375` on every step.
- [ ] **Step 2:** `npm test` - FAIL.
- [ ] **Step 3:** Write `index.html`, `src/main.js`, `src/style.css`.
- [ ] **Step 4:** `npm test` - all PASS.
- [ ] **Step 5: Screenshot check** - script (scratchpad, not committed) screenshots `#cube` at the end of setup for fl-right, fl-front, fl-up, oll-one, pll-lights. Look at each: the white/yellow sticker and headlights positions must match the step text. Fix text or k pairing (rerun Task 1 tests) if not.
- [ ] **Step 6:** `README.md`: what it is, `npx serve` / `python3 -m http.server` to run locally, `npm test`, and enabling GitHub Pages (Settings > Pages > Deploy from branch, root).
- [ ] **Step 7:** Commit.
