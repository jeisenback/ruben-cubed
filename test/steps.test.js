import { test } from "node:test";
import assert from "node:assert/strict";
import { Alg } from "cubing/alg";
import { puzzles } from "cubing/puzzles";
import { KPattern } from "cubing/kpuzzle";
import { STEPS, START } from "../src/steps.js";

const kpuzzle = await puzzles["2x2x2"].kpuzzle();
const byId = Object.fromEntries(STEPS.map((s) => [s.id, s]));
const TRIGGER = "R U R' U'";
const TRIGGER_X3 = [TRIGGER, TRIGGER, TRIGGER].join(" ");

// Corner positions: 0-3 = UFR, URB, UBL, ULF; 4-7 = DRF, DFL, DLB, DBR.
function caseCorners(step) {
  const setup = step.setup ?? new Alg(step.alg).invert();
  return kpuzzle.defaultPattern().applyAlg(setup).patternData.CORNERS;
}
function afterAlgCorners(step) {
  const setup = step.setup ?? new Alg(step.alg).invert();
  return kpuzzle.defaultPattern().applyAlg(setup).applyAlg(step.alg).patternData.CORNERS;
}
function isSolved(c) {
  return c.pieces.every((p, i) => p === i) && c.orientation.every((o) => o === 0);
}
function bottomSolved(c) {
  return [4, 5, 6, 7].every((i) => c.pieces[i] === i && c.orientation[i] === 0);
}

test("steps: graph is valid", () => {
  const ids = STEPS.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, "ids unique");
  assert.ok(byId[START], "START exists");
  for (const s of STEPS) {
    const targets = [s.next, ...(s.choices ?? []).map((c) => c.to)].filter(Boolean);
    for (const t of targets) assert.ok(byId[t], `${s.id} -> ${t} exists`);
    if (s.id === "finish") assert.ok(!s.next && !s.choices, "finish is terminal");
    else assert.ok(Boolean(s.next) !== Boolean(s.choices), `${s.id} has exactly one of next/choices`);
  }
  const seen = new Set([START]);
  const queue = [START];
  while (queue.length) {
    const s = byId[queue.shift()];
    for (const t of [s.next, ...(s.choices ?? []).map((c) => c.to)].filter(Boolean)) {
      if (!seen.has(t)) { seen.add(t); queue.push(t); }
    }
  }
  assert.deepEqual([...seen].sort(), [...ids].sort(), "all reachable");
});

test("steps: algs parse and use only R U F D", () => {
  for (const s of STEPS) {
    for (const a of [s.alg, s.setup].filter((x) => x !== undefined)) {
      const families = [...new Alg(a).experimentalLeafMoves()].map((m) => m.family);
      for (const f of families) assert.ok(["R", "U", "F", "D"].includes(f), `${s.id}: ${f}`);
    }
    assert.ok(s.title && s.text && s.lesson, `${s.id} has title/text/lesson`);
  }
});

test("steps: every case leaves the bottom layer alone except first-layer, yellow-side and notation", () => {
  for (const s of STEPS.filter((s) => !["first-layer", "yellow-side", "notation"].includes(s.id))) {
    assert.ok(bottomSolved(caseCorners(s)), s.id);
  }
});

test("steps: first layer is one step: repeat the trigger until the corner fits", () => {
  const step = byId["first-layer"];
  assert.equal(step.choices, undefined, "no branching");
  assert.equal(step.next, "yellow-side");
  assert.equal(step.alg, TRIGGER_X3, "example: white facing up, trigger three times");
  const shown = caseCorners(step);
  assert.equal(shown.pieces[0], 4, "example corner sits above its spot (front right)");
  // Whichever way the white sticker faces, repeating the trigger fits the corner
  // within 5 tries, and the rest of the bottom layer is intact when it does.
  for (const k of [1, 3, 5]) {
    let p = kpuzzle.defaultPattern().applyAlg(new Alg(Array(k).fill(TRIGGER).join(" ")).invert());
    let tries = 0;
    while (!(p.patternData.CORNERS.pieces[4] === 4 && p.patternData.CORNERS.orientation[4] === 0)) {
      p = p.applyAlg(TRIGGER);
      tries++;
      assert.ok(tries <= 5, `k=${k}: fits within 5 tries`);
    }
    assert.ok(bottomSolved(p.patternData.CORNERS), `k=${k}: bottom layer intact when it fits`);
  }
});

// Yellow side: cube held upside down (white on top = positions 0-3, yellow on the
// bottom = positions 4-7). Fix the bottom front right corner (position 4) with the
// trigger until its yellow faces down, turn only the bottom layer to bring the next
// unfinished corner there, repeat.
function followYellowSideMethod(pattern) {
  let p = pattern;
  for (let corner = 0; corner < 4; corner++) {
    // Done when a yellow corner (piece 4-7) is back in that spot facing down.
    // Mid-way, a white corner can sit there, so the piece matters, not just the sticker.
    const done = () => p.patternData.CORNERS.pieces[4] >= 4 && p.patternData.CORNERS.orientation[4] === 0;
    let tries = 0;
    while (!done()) {
      p = p.applyAlg(TRIGGER);
      tries++;
      assert.ok(tries <= 4, "each corner takes at most 4 tries");
    }
    assert.ok(tries % 2 === 0, "two or four tries, as the text says");
    p = p.applyAlg("D");
  }
  return p.patternData.CORNERS;
}

test("steps: yellow side reuses the trigger and works for every case", () => {
  const step = byId["yellow-side"];
  assert.equal(step.upsideDown, true, "shown with white on top");
  assert.equal(step.choices, undefined, "no branching");
  assert.equal(step.next, "pll-intro");
  const families = new Set([...new Alg(step.alg).experimentalLeafMoves()].map((m) => m.family));
  assert.deepEqual([...families].sort(), ["D", "R", "U"], "only the trigger plus bottom turns");
  const shown = caseCorners(step);
  for (const i of [0, 1, 2, 3]) assert.ok(shown.pieces[i] === i && shown.orientation[i] === 0, "white layer solved on top");
  assert.equal([4, 5, 6, 7].filter((i) => shown.orientation[i] !== 0).length, 2, "example has two corners to fix");
  const after = afterAlgCorners(step);
  assert.ok(after.orientation.every((o) => o === 0), "example ends with yellow all facing down");
  // Every possible yellow-side orientation, with a few bottom-layer arrangements.
  for (const pieces of [[4, 5, 6, 7], [5, 4, 6, 7], [6, 5, 4, 7]]) {
    for (let n = 0; n < 81; n++) {
      const o = [n % 3, Math.floor(n / 3) % 3, Math.floor(n / 9) % 3, Math.floor(n / 27) % 3];
      if (o.reduce((x, y) => x + y, 0) % 3 !== 0) continue;
      const start = new KPattern(kpuzzle, {
        CORNERS: { pieces: [0, 1, 2, 3, ...pieces], orientation: [0, 0, 0, 0, ...o] },
      });
      const end = followYellowSideMethod(start);
      for (const i of [0, 1, 2, 3]) assert.ok(end.pieces[i] === i && end.orientation[i] === 0, `white layer back for ${o}`);
      assert.ok(end.orientation.every((x) => x === 0), `yellow all down for ${o}`);
    }
  }
});

test("steps: pll cases", () => {
  const lights = caseCorners(byId["pll-lights"]);
  const none = caseCorners(byId["pll-none"]);
  for (const c of [lights, none]) assert.ok(c.orientation.every((o) => o === 0));
  assert.deepEqual(lights.pieces.slice(0, 4), [1, 0, 2, 3], "right pair swapped, headlights left");
  assert.deepEqual(none.pieces.slice(0, 4), [2, 1, 0, 3], "diagonal swap");
});

test("steps: playing every alg from its case ends where claimed", () => {
  for (const id of ["pll-lights", "finish", "first-layer"]) {
    assert.ok(isSolved(afterAlgCorners(byId[id])), `${id} ends solved`);
  }
});

test("steps: skip choices exist", () => {
  assert.ok(byId["pll-intro"].choices.some((c) => c.to === "finish"), "all sides match -> finish");
});
