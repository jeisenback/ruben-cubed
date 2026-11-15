// Drives the real page in Chromium. Requests to cdn.jsdelivr.net are answered
// from node_modules, file by file, the way the CDN serves the original package
// files, so the test loads the same module graph the live site does.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { STEPS } from "../src/steps.js";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const title = (id) => STEPS.find((s) => s.id === id).title;

let server, browser, base;

// https://cdn.jsdelivr.net/npm/<pkg>@<version>/<path> -> node_modules/<pkg>/<path>.
// "<pkg>@<version>/+esm" (a whole small package) is answered with an esbuild bundle of it.
// Anything else, including "+esm" on a sub-path, is a 404 here.
async function fromNodeModules(url) {
  const m = new URL(url).pathname.match(/^\/npm\/((?:@[^/]+\/)?[^@/]+)@([^/]+)\/(.*)$/);
  if (!m) return null;
  const [, pkg, version, path] = m;
  const pkgDir = join(ROOT, "node_modules", pkg);
  const installed = JSON.parse(await readFile(join(pkgDir, "package.json"), "utf8")).version;
  if (installed !== version) return null;
  if (path === "+esm") {
    const result = await build({ entryPoints: [pkg], bundle: true, format: "esm", write: false, absWorkingDir: ROOT, logLevel: "silent" });
    return result.outputFiles[0].contents;
  }
  if (path.includes("+esm")) return null;
  try {
    return await readFile(join(pkgDir, normalize(path)));
  } catch {
    return null;
  }
}

before(async () => {
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
  await page.route("https://cdn.jsdelivr.net/**", async (route) => {
    if (cdnDelay) await new Promise((r) => setTimeout(r, cdnDelay));
    if (blockCdn) return route.abort();
    const body = await fromNodeModules(route.request().url());
    return body
      ? route.fulfill({ body: Buffer.from(body), contentType: "text/javascript" })
      : route.fulfill({ status: 404, body: "not found" });
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

test("page: the 3D cube draws without errors", async () => {
  // The player's canvas is in a closed shadow root, so wait for its lazily
  // loaded 3D code instead: that is where a duplicate-library crash shows up.
  const { page, errors } = await open();
  const loaded3d = page.waitForResponse(/twisty-dynamic-3d/, { timeout: 10000 });
  await page.click("#next");
  await page.click("#choices button:has-text('White faces right')");
  await loaded3d;
  await page.waitForTimeout(1500);
  assert.deepEqual(errors, []);
  await page.close();
});
