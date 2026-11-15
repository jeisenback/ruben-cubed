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
- Lessons defined as a plain data list (title, explanation, setup moves,
  algorithm), so adding a lesson or a puzzle is editing data.
- Each lesson shows the case by using the inverse of the algorithm as the
  setup (cubing.js `experimental-setup-anchor="end"`), so playing the
  algorithm ends with the lesson's goal achieved.
- Simple navigation: a list of lessons and next / previous buttons.

## Lesson content (my call - correct if you teach it differently)
0. **Notation** - what R, U, F, R', U2 mean, each shown on the cube.
1. **First layer** - intuitive; teach the corner-insert trigger `R U R' U'`
   with one or two example cases.
2. **Orient the last layer** - make the top all one color with Sune:
   `R U R' U R U2 R'` (repeat as needed).
3. **Permute the last layer** - swap corners into place:
   `R U R' U' R' F R2 U' R' U' R U R' F'` (place the solved pair at the back).

## Left to the builder
- Exact cubing.js version and layout/styling details.
- Wording of explanations (plain language, short).
