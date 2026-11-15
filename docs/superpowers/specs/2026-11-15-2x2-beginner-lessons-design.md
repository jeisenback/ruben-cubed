# 2x2 Beginner Method Lessons - Design

## Intent
A visual teaching tool for people learning a cube-solving method on screen
before they touch a real cube. It teaches the beginner algorithms by showing
example cases and animating the moves. It does not solve the learner's cube.
Starts with the 2x2; other puzzles (3x3 first) come later as new lesson content.

## Goals
- Each stage of the 2x2 beginner method is a lesson: short explanation, an
  example case on a 3D cube, and the algorithm animated with play / pause /
  step-through controls.
- A beginner can go through the lessons in order with no prior knowledge.

## Non-goals
- Solving a user-entered or scrambled cube.
- Color input, camera input, timers, accounts, progress tracking.
- Puzzles other than the 2x2 in this first version.

## Anti-goals
- Overbuilding: no framework, no build step, no backend.
- Notation-heavy explanations that assume cubing jargon without defining it.

## Approaches considered
1. **Static web page + cubing.js `<twisty-player>` (chosen).** Library renders
   and animates 2x2/3x3 with built-in controls; our work is lesson content.
   Tradeoff: less control over custom effects like piece highlighting.
2. Hand-built Three.js cube. Full control, but several times the code before
   the first lesson exists.
3. Flat 2D diagrams. Simplest, but hard for beginners to map onto a 3D cube.

Chosen: 1, because it gets lessons on screen fastest and makes adding 3x3
a content change rather than new rendering code.

## Design
- One static `index.html` (plus a small JS and CSS file if useful), opened
  directly in a browser or served from any static host.
- cubing.js loaded from a CDN, pinned to an exact version.
- Lessons are made of **steps**. A step has a title, a short explanation and
  an algorithm, plus either one `next` step or a list of **choices**
  ("Which of these does your cube look like?"), each pointing to another
  step. This is how branching works: the learner picks the case they see and
  is taken to the step for that case. A branch can point back to an earlier
  step ("look again").
- Steps live in a plain data list keyed by id, so adding a step, a branch or
  a puzzle is editing data.
- Each lesson shows the case by using the inverse of the algorithm as the
  setup (cubing.js `experimental-setup-anchor="end"`), so playing the
  algorithm ends with the lesson's goal achieved.
- Navigation: a list of lessons to jump to, a Next button (or the choice
  buttons on a branching step) and a Back button. Back retraces the path the
  learner actually took, including the branches they picked, all the way to
  the start.
- Within a step, the cube's built-in controls step forward and backward one
  move at a time.

## Lesson content (revised: fewest algorithms)
The owner asked to prioritize fewer algorithms; anything else is more advanced.
The method uses two: the trigger `R U R' U'` and one corner swap.
0. **Notation** - what R, U, F, D, R', U2 mean, each shown on the cube.
1. **First layer** - one step: put a white corner above its spot, repeat
   `R U R' U'` until it fits (at most five times).
2. **Yellow side** - a variation of the first layer: cube upside down (white
   on top), repeat `R U R' U'` on the bottom front right corner until its
   yellow faces down (two or four times), turn only the bottom layer to bring
   the next corner there, repeat. The white layer restores itself.
3. **Top corners** - `R U R' U' R' F R2 U' R' U' R U R' F'`. Branch on
   headlights: hold them on the left; with none, do it once and look again;
   if every side matches, skip to Finish.
4. **Finish** - turn the top layer until the cube is solved.

## Left to the builder
- Exact cubing.js version and layout/styling details.
- Wording of explanations (plain language, short).
