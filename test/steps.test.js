import { test } from "node:test";
import assert from "node:assert/strict";
import { Alg } from "cubing/alg";
import { puzzles } from "cubing/puzzles";
import { KPattern } from "cubing/kpuzzle";
import { STEPS, START } from "../src/steps.js";

const kpuzzle = await puzzles["2x2x2"].kpuzzle();
const byId = Object.fromEntries(STEPS.map((s) => [s.id, s]));
const SUNE = "R U R' U R U2 R'";

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
function topOrientedCount(c) {
  return [0, 1, 2, 3].filter((i) => c.orientation[i] === 0).length;
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

test("steps: algs parse and use only R U F", () => {
  for (const s of STEPS) {
    for (const a of [s.alg, s.setup].filter((x) => x !== undefined)) {
      const families = [...new Alg(a).experimentalLeafMoves()].map((m) => m.family);
      for (const f of families) assert.ok(["R", "U", "F"].includes(f), `${s.id}: ${f}`);
    }
    assert.ok(s.title && s.text && s.lesson, `${s.id} has title/text/lesson`);
  }
});

test("steps: every case leaves the bottom layer alone except first-layer and notation", () => {
  for (const s of STEPS.filter((s) => !s.id.startsWith("fl-") && s.id !== "notation")) {
    assert.ok(bottomSolved(caseCorners(s)), s.id);
  }
});

test("steps: first-layer cases put the DRF corner above its slot", () => {
  const branches = ["fl-right", "fl-front", "fl-up"].map((id) => byId[id]);
  const orientations = branches.map((s) => {
    const c = caseCorners(s);
    assert.equal(c.pieces[0], 4, `${s.id}: DRF piece at UFR`);
    for (const i of [5, 6, 7]) assert.ok(c.pieces[i] === i && c.orientation[i] === 0, `${s.id}: D ${i}`);
    return c.orientation[0];
  });
  assert.equal(new Set(orientations).size, 3, "three different orientations");
  assert.equal(caseCorners(byId["fl-up"]).orientation[0], 0, "fl-up: white facing up");
});

test("steps: oll cases", () => {
  for (const id of ["oll-one", "oll-none", "oll-two"]) {
    const c = caseCorners(byId[id]);
    for (const i of [0, 1, 2, 3]) assert.ok(c.pieces[i] < 4, `${id}: U pieces stay in U`);
    assert.equal(byId[id].alg, SUNE, `${id} uses Sune`);
  }
  const one = caseCorners(byId["oll-one"]);
  assert.equal(topOrientedCount(one), 1);
  assert.equal(one.orientation[3], 0, "oll-one: yellow-up corner at front-left");
  assert.equal(topOrientedCount(caseCorners(byId["oll-none"])), 0);
  assert.equal(topOrientedCount(caseCorners(byId["oll-two"])), 2);
});

test("steps: pll cases", () => {
  const lights = caseCorners(byId["pll-lights"]);
  const none = caseCorners(byId["pll-none"]);
  for (const c of [lights, none]) assert.ok(c.orientation.every((o) => o === 0));
  assert.deepEqual(lights.pieces.slice(0, 4), [1, 0, 2, 3], "right pair swapped, headlights left");
  assert.deepEqual(none.pieces.slice(0, 4), [2, 1, 0, 3], "diagonal swap");
});

test("steps: playing every alg from its case ends where claimed", () => {
  for (const id of ["oll-one", "pll-lights", "finish", "fl-right", "fl-front", "fl-up"]) {
    assert.ok(isSolved(afterAlgCorners(byId[id])), `${id} ends solved`);
  }
  assert.equal(topOrientedCount(afterAlgCorners(byId["oll-none"])), 1, "oll-none leads to one-up");
});

// Every top-orientation pattern with 0 or 2 yellow-on-top corners.
function topOrientations(count) {
  const out = [];
  for (let n = 0; n < 81; n++) {
    const o = [n % 3, Math.floor(n / 3) % 3, Math.floor(n / 9) % 3, Math.floor(n / 27) % 3];
    if (o.reduce((a, b) => a + b, 0) % 3 === 0 && o.filter((x) => x === 0).length === count) out.push(o);
  }
  return out;
}

test("steps: oll none/two hold rule always leads to one yellow corner", () => {
  // none: hold so front-left corner (ULF, position 3) has orientation 2; two: orientation 1.
  for (const [count, want, id] of [[0, 2, "oll-none"], [2, 1, "oll-two"]]) {
    assert.equal(caseCorners(byId[id]).orientation[3], want, `${id} case is shown at the rule's angle`);
    for (const o of topOrientations(count)) {
      const start = new KPattern(kpuzzle, {
        CORNERS: { pieces: [0, 1, 2, 3, 4, 5, 6, 7], orientation: [...o, 0, 0, 0, 0] },
      });
      const angles = ["", "U", "U2", "U'"].map((u) => start.applyAlg(u)).filter((p) => p.patternData.CORNERS.orientation[3] === want);
      assert.ok(angles.length > 0, `${id}: rule applies to ${o}`);
      for (const p of angles) assert.equal(topOrientedCount(p.applyAlg(SUNE).patternData.CORNERS), 1, `${id}: ${o}`);
    }
  }
});

test("steps: skip choices exist", () => {
  assert.ok(byId["oll-intro"].choices.some((c) => c.to === "pll-intro"), "all four yellow -> top corners");
  assert.ok(byId["pll-intro"].choices.some((c) => c.to === "finish"), "all sides match -> finish");
});
