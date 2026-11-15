// Drives the real page in Chromium. The cube library is served from a local
// bundle so the test never needs the CDN.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { STEPS } from "../src/steps.js";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const CDN = "https://cdn.jsdelivr.net/npm/cubing@0.66.1/twisty/+esm";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const title = (id) => STEPS.find((s) => s.id === id).title;

let server, browser, base, bundle;

before(async () => {
  const outfile = join(await mkdtemp(join(tmpdir(), "cube-")), "twisty.js");
  await build({ entryPoints: ["cubing/twisty"], bundle: true, format: "esm", outfile, logLevel: "silent" });
  bundle = await readFile(outfile);
  server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
    try {
      const body = await readFile(join(ROOT, path === "/" ? "index.html" : path));
      res.writeHead(200, { "content-type": TYPES[extname(path) || ".html"] ?? "text/plain" });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((r) => server.listen(0, r));
  base = `http://localhost:${server.address().port}/`;
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  server?.close();
});

async function open({ blockCdn = false, width = 1000, cdnDelay = 0 } = {}) {
  const page = await browser.newPage({ viewport: { width, height: 800 } });
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.route(CDN, async (route) => {
    if (cdnDelay) await new Promise((r) => setTimeout(r, cdnDelay));
    return blockCdn ? route.abort() : route.fulfill({ body: bundle, contentType: "text/javascript" });
  });
  await page.goto(base, { waitUntil: cdnDelay ? "commit" : "load" });
  return { page, errors };
}

const titleText = (page) => page.textContent("#step-title");

test("page: shows first step", async () => {
  const { page, errors } = await open();
  assert.equal(await titleText(page), title("notation"));
  assert.equal(await page.locator("#lessons button").count(), 5);
  assert.equal(await page.isDisabled("#back"), true);
  assert.deepEqual(errors, []);
  await page.close();
});

test("page: next, choice and back", async () => {
  const { page, errors } = await open();
  await page.click("#next");
  assert.equal(await titleText(page), title("fl-intro"));
  await page.click("#choices button:has-text('White faces up')");
  assert.equal(await titleText(page), title("fl-up"));
  await page.click("#back");
  assert.equal(await titleText(page), title("fl-intro"));
  await page.click("#back");
  assert.equal(await titleText(page), title("notation"));
  assert.deepEqual(errors, []);
  await page.close();
});

test("page: lesson jump and back", async () => {
  const { page, errors } = await open();
  await page.click("#lessons button:has-text('Top corners')");
  assert.equal(await titleText(page), title("pll-intro"));
  await page.click("#back");
  assert.equal(await titleText(page), title("notation"));
  assert.deepEqual(errors, []);
  await page.close();
});

test("page: player alg/setup follow the step", async () => {
  const { page, errors } = await open();
  const attr = (name) => page.getAttribute("#cube", name);
  await page.click("#lessons button:has-text('Top color')");
  await page.click("#choices button:has-text('None')");
  const none = STEPS.find((s) => s.id === "oll-none");
  assert.equal(await attr("alg"), none.alg);
  assert.equal(await attr("experimental-setup-alg"), `x2 ${none.setup}`);
  assert.equal(await attr("experimental-setup-anchor"), "start");
  await page.click("#back");
  await page.click("#choices button:has-text('One')");
  assert.equal(await attr("alg"), STEPS.find((s) => s.id === "oll-one").alg);
  assert.equal(await attr("experimental-setup-alg"), "x2");
  assert.equal(await attr("experimental-setup-anchor"), "end");
  assert.deepEqual(errors, []);
  await page.close();
});

test("page: works with cube library blocked", async () => {
  const { page } = await open({ blockCdn: true });
  assert.equal(await titleText(page), title("notation"));
  await page.click("#next");
  await page.click("#choices button:has-text('White faces right')");
  assert.equal(await titleText(page), title("fl-right"));
  await page.click("#back");
  assert.equal(await titleText(page), title("fl-intro"));
  await page.close();
});

test("page: no horizontal scroll at 375px", async () => {
  const { page, errors } = await open({ width: 375 });
  const check = async () => {
    const w = await page.evaluate(() => document.documentElement.scrollWidth);
    assert.ok(w <= 375, `${await titleText(page)}: scrollWidth ${w}`);
  };
  const lessons = await page.locator("#lessons button").count();
  for (let i = 0; i < lessons; i++) {
    await page.locator("#lessons button").nth(i).click();
    await check();
    const choices = await page.locator("#choices button").count();
    for (let j = 0; j < choices; j++) {
      await page.locator("#choices button").nth(j).click();
      await check();
      await page.click("#back");
    }
  }
  assert.deepEqual(errors, []);
  await page.close();
});

test("page: lessons show while the cube library is still loading", async () => {
  const { page } = await open({ cdnDelay: 4000 });
  await page.waitForFunction(() => document.getElementById("step-title").textContent !== "", null, { timeout: 2000 });
  assert.equal(await titleText(page), title("notation"));
  await page.close();
});

test("page: a new step starts at its case even after the last one was played to the end", async () => {
  const { page, errors } = await open();
  await page.waitForFunction(() => customElements.get("twisty-player"));
  await page.click("#next");
  await page.click("#choices button:has-text('White faces right')");
  await page.evaluate(() => document.getElementById("cube").jumpToEnd());
  const atEnd = await page.evaluate(() => document.getElementById("cube").experimentalModel.detailedTimelineInfo.get());
  assert.equal(atEnd.atEnd, true, "precondition: played to the end");
  await page.click("#next");
  await page.click("#choices button:has-text('One')");
  const info = await page.evaluate(() => document.getElementById("cube").experimentalModel.detailedTimelineInfo.get());
  assert.equal(info.atStart, true);
  assert.deepEqual(errors, []);
  await page.close();
});
