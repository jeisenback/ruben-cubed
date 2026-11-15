import { test } from "node:test";
import assert from "node:assert/strict";
import { createNav } from "../src/nav.js";

const steps = [{ id: "a", next: "b" }, { id: "b", next: "a" }, { id: "c" }];

test("nav: starts at start", () => {
  const nav = createNav(steps, "a");
  assert.equal(nav.current().id, "a");
  assert.equal(nav.canBack(), false);
});

test("nav: go then back", () => {
  const nav = createNav(steps, "a");
  nav.go("b");
  assert.equal(nav.current().id, "b");
  nav.back();
  assert.equal(nav.current().id, "a");
  assert.equal(nav.canBack(), false);
});

test("nav: back retraces loops", () => {
  const nav = createNav(steps, "a");
  nav.go("b"); nav.go("a"); nav.go("b");
  const seen = [];
  for (let i = 0; i < 3; i++) { nav.back(); seen.push(nav.current().id); }
  assert.deepEqual(seen, ["a", "b", "a"]);
});

test("nav: go unknown id throws", () => {
  const nav = createNav(steps, "a");
  assert.throws(() => nav.go("zzz"));
  assert.equal(nav.current().id, "a");
});

test("nav: back at start is a no-op", () => {
  const nav = createNav(steps, "a");
  nav.back();
  assert.equal(nav.current().id, "a");
});
