// The browser test (Chromium, through Playwright): workability for SYN-B end to
// end, the hazard panel on screen, and offline use after one load. It is
// skipped cleanly where Playwright or its browser is not installed.
import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { judgeAll } from "../app/js/engine.js";
import { panelFor, panelStrings } from "../app/js/hazards.js";
import { parseLimits, plainOf } from "../app/js/content.js";
import { parseCsv, sampleReadings } from "../app/js/sample.js";
import { loadTheme } from "../tools/contrast.mjs";
import { loadHazards, loadThresholds, readText } from "./helpers/files.js";
import { startServer } from "./helpers/server.js";

const settings = loadThresholds();
const hazards = loadHazards();
const limits = parseLimits(readText("app", "data", "Limits_Statement.md"));
const indicatorIds = settings.indicators.map((indicator) => indicator.id);

let chromium = null;
let browser = null;
let skip = false;
try {
  ({ chromium } = createRequire(import.meta.url)("playwright"));
} catch {
  skip = "Playwright is not installed (run npm install); the browser test did not run";
}

// Anything the browser asks of another site would have to go through this
// stand-in proxy (requests to 127.0.0.1 go straight to the test server).
const outside = [];
const proxy = createServer((request, response) => {
  outside.push(request.url);
  response.writeHead(502).end();
});
proxy.on("connect", (request, socket) => {
  outside.push(request.url);
  socket.end("HTTP/1.1 502 Bad Gateway\r\n\r\n");
});

if (chromium) {
  await new Promise((resolve) => proxy.listen(0, "127.0.0.1", resolve));
  try {
    browser = await chromium.launch({ proxy: { server: `http://127.0.0.1:${proxy.address().port}`, bypass: "127.0.0.1" } });
  } catch (error) {
    skip = `Chromium could not start (${String(error.message).split("\n")[0]}); the browser test did not run`;
    proxy.close();
  }
}

async function newPage(server, { blockHazards = false } = {}) {
  const context = await browser.newContext({ viewport: { width: 412, height: 900 }, acceptDownloads: true, serviceWorkers: "allow" });
  const log = { requests: [], errors: [] };
  context.on("request", (request) => log.requests.push(request.url()));
  if (blockHazards) await context.route("**/Hazard_Links.json", (route) => route.abort());
  context.setDefaultTimeout(15000);
  const page = await context.newPage();
  page.on("pageerror", (error) => log.errors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") log.errors.push(message.text());
  });
  const open = async (screen) => {
    await page.goto(`${server.appUrl}#${screen}`);
    await page.waitForSelector(`html[data-app-ready] main[data-screen="${screen}"]`);
  };
  return { context, page, log, open };
}

async function firstRun(page, server) {
  await page.goto(server.appUrl);
  await page.waitForSelector("html[data-app-ready]");
  await page.click("[data-welcome-done]");
  await page.waitForSelector('main[data-screen="astronaut"]');
  await page.check('input[name=profile][value="SYN-B"]');
  await page.waitForSelector("[data-reading-count]");
  await page.click("[data-load-sample]");
  await page.waitForSelector('[data-reading-count="180"]');
}

// { readingId: status } for everything the History screen shows.
async function historyStatuses(page) {
  return page.$$eval("[data-history-item]", (items) =>
    Object.fromEntries(items.map((item) => [item.getAttribute("data-history-item"), item.querySelector("[data-result-status]").getAttribute("data-result-status")])));
}

async function panelTexts(page, scope) {
  return page.$$eval(`${scope} [data-section="hazards"] [data-hz]`, (nodes) => nodes.map((node) => node.textContent));
}

function expectedSampleStatuses() {
  const readings = sampleReadings(parseCsv(readText("app", "data", "synthetic_demo_data.csv")), settings).filter((reading) => reading.profileId === "SYN-B");
  return Object.fromEntries(judgeAll(settings, readings).map((result) => [result.readingId, result.status]));
}

test("browser: SYN-B end to end, the hazard panel, and offline after one load", { skip, timeout: 180000 }, async (t) => {
  const server = await startServer();
  const { context, page, log, open } = await newPage(server);
  let serverOpen = true;
  t.after(async () => {
    await context.close();
    if (serverOpen) await server.close();
  });

  await t.test("the stand-in proxy does see a request to another site, so an empty list means none was made", async () => {
    const probe = await context.newPage();
    await probe.goto("about:blank");
    await probe.evaluate(() => fetch("http://stellavita-probe.invalid/ping", { mode: "no-cors" }).catch(() => null));
    await probe.close();
    assert.deepEqual(outside, ["http://stellavita-probe.invalid/ping"]);
    outside.length = 0;
    log.requests.length = 0;
  });

  await t.test("first launch shows the full limits statement and the AI notice; the short line is on every screen", async () => {
    await page.goto(server.appUrl);
    await page.waitForSelector('html[data-app-ready] main[data-screen="welcome"]');
    assert.equal(await page.textContent("[data-limits-full]"), plainOf(limits.full));
    assert.equal((await page.textContent("#limits-line")).trim(), limits.short);
    assert.match(await page.getAttribute('meta[name="ai-disclosure"]', "content"), /AI-generated \(D-44\).*AI assistant \(Claude, Anthropic\)/);
    assert.match(await page.getAttribute('meta[name="generator"]', "content"), /AI assistant \(Claude, Anthropic\)/);
    assert.equal(await page.isVisible("#nav"), false, "the screens open after the statement has been read");
    await page.click("[data-welcome-done]");
    await page.waitForSelector('main[data-screen="astronaut"]');
  });

  await t.test("choose SYN-B and load the sample data", async () => {
    assert.deepEqual(await page.$$eval("input[name=profile]", (inputs) => inputs.map((input) => input.value)), ["SYN-A", "SYN-B", "SYN-C", "SYN-D"]);
    await page.check('input[name=profile][value="SYN-B"]');
    await page.waitForSelector('[data-reading-count="0"]');
    assert.match(await page.textContent("#who"), /^SYN-B/);
    await page.click("[data-load-sample]");
    await page.waitForSelector('[data-reading-count="180"]');
  });

  let baseline = null;
  await t.test("History shows the engine's status for all 180 of SYN-B's sample results; red only on the third short night", async () => {
    await open("history");
    baseline = await historyStatuses(page);
    assert.deepEqual(baseline, expectedSampleStatuses());
    assert.equal(Object.keys(baseline).length, 180);
    assert.deepEqual(Object.keys(baseline).filter((id) => baseline[id] === "contact"), ["sample-SYN-B-14-sleep_hours"]);
    const red = page.locator('[data-history-day="2026-10-28"] [data-history-item="sample-SYN-B-14-sleep_hours"]');
    assert.equal((await red.locator("[data-status]").innerText()).replace(/\s+/g, " "), "!! Emergency");
    assert.equal(await red.locator("[data-result-reason]").textContent(), "6 hours or less on 3 nights in a row");
    assert.equal(await red.locator("[data-result-sources]").textContent(), "S-28, D-19");
    assert.equal(await red.locator("[data-result-meaning]").textContent(), settings.meta.status_meaning.contact);
  });

  await t.test("Today shows six results, each as a word and a symbol with its reason and sources", async () => {
    await open("today");
    assert.deepEqual(await page.$$eval("main article[data-indicator]", (cards) => cards.map((card) => card.getAttribute("data-indicator"))), indicatorIds);
    for (const id of indicatorIds) {
      const card = page.locator(`article[data-indicator="${id}"]`);
      assert.equal(await card.locator("h3").textContent(), settings.indicators.find((indicator) => indicator.id === id).label);
      const badge = (await card.locator("[data-status]").first().innerText()).replace(/\s+/g, " ");
      assert.match(badge, /^(✓ Normal|! Caution|!! Emergency|– Not compared)$/);
      assert.ok((await card.locator("[data-result-reason]").first().textContent()).length > 0);
      assert.ok((await card.locator("[data-result-sources]").first().textContent()).length > 0);
    }
  });

  await t.test("the hazard panel starts shut, opens from the keyboard and shows the file's text word for word: 30 links in all", async () => {
    const before = await page.$$eval("[data-result-status]", (nodes) => nodes.map((node) => node.getAttribute("data-result-status")));
    let links = 0;
    for (const id of indicatorIds) {
      const scope = `article[data-indicator="${id}"]`;
      const toggle = page.locator(`${scope} [data-toggle="hazards"]`);
      assert.equal(await toggle.evaluate((node) => node.tagName), "BUTTON");
      assert.equal(await toggle.getAttribute("aria-expanded"), "false");
      assert.equal((await toggle.innerText()).replace(/^[+−]\s*/, ""), hazards.meta.screen_text.panel_title);
      const region = page.locator(`#${await toggle.getAttribute("aria-controls")}`);
      assert.equal(await region.isVisible(), false, "the panel starts shut");
      await toggle.focus();
      await page.keyboard.press("Enter");
      assert.equal(await toggle.getAttribute("aria-expanded"), "true");
      assert.equal(await region.isVisible(), true);

      const panel = panelFor(hazards, id);
      assert.deepEqual(await panelTexts(page, scope), panelStrings(panel));
      const shown = await page.$$eval(`${scope} [data-hazard]`, (items) => items.map((item) => [item.getAttribute("data-hazard"), item.getAttribute("data-closeness")]));
      assert.deepEqual(shown, panel.hazards.map((hazard) => [hazard.hazard, hazard.closeness]));
      assert.equal(await page.locator(`${scope} [data-hz="limit"]`).isVisible(), true, "the limit line is visible while the panel is open");
      links += shown.length;
    }
    assert.equal(links, 30);
    const after = await page.$$eval("[data-result-status]", (nodes) => nodes.map((node) => node.getAttribute("data-result-status")));
    assert.deepEqual(after, before, "opening the panels changed no status");
    const toggle = page.locator('article[data-indicator="mood"] [data-toggle="hazards"]');
    await toggle.focus();
    await page.keyboard.press("Space");
    assert.equal(await toggle.getAttribute("aria-expanded"), "false", "and it shuts again from the keyboard");
  });

  await t.test("the guidance under a result is the file's text", async () => {
    await page.click('article[data-indicator="sleep_hours"] [data-toggle="guidance"]');
    const text = await page.innerText('[data-guidance="sleep_hours"]');
    assert.ok(text.includes("Sleep is maintenance for your brain and body. Adults need 7 hours or more."));
    assert.ok(text.includes("6 hours or less, three nights in a row."));
    assert.ok(text.includes("This tool gives general health guidance only. It does not diagnose."));
  });

  await t.test("every field on every entry screen has a label, and focus is visible", async () => {
    await open("enter");
    for (const id of indicatorIds) {
      await page.selectOption("select[name=indicator]", id);
      await page.waitForSelector(`[data-entry-form="${id}"]`);
      const unlabelled = await page.$$eval("main input, main select, main textarea", (controls) =>
        controls.filter((control) => !(control.labels && control.labels.length > 0) || [...control.labels].some((label) => label.textContent.trim() === "")).map((control) => control.name));
      assert.deepEqual(unlabelled, [], `${id}: every field has a label`);
    }
    for (const screen of ["mood", "astronaut"]) {
      await open(screen);
      const unlabelled = await page.$$eval("main input, main select, main textarea", (controls) => controls.filter((control) => !(control.labels && control.labels.length > 0)).length);
      assert.equal(unlabelled, 0, `${screen}: every field has a label`);
    }
    await open("enter");
    await page.keyboard.press("Tab");
    const outline = await page.evaluate(() => {
      const style = getComputedStyle(document.activeElement);
      return { style: style.outlineStyle, width: style.outlineWidth, tag: document.activeElement.tagName };
    });
    assert.notEqual(outline.style, "none", `keyboard focus on ${outline.tag} is visible`);
    assert.equal(outline.width, "3px");
  });

  await t.test("enter a reading and see its status; the hazard panel for the chosen indicator is on the entry screen", async () => {
    await open("enter");
    await page.selectOption("select[name=indicator]", "sleep_hours");
    await page.waitForSelector('[data-entry-form="sleep_hours"]');
    await page.fill("input[name=value]", "5.5");
    await page.click("[data-entry-form] button[type=submit]");
    await page.waitForSelector("[data-outcome-area] [data-saved]");
    assert.equal(await page.getAttribute("[data-outcome-area] [data-result-status]", "data-result-status"), "warning");
    assert.equal(await page.textContent("[data-outcome-area] [data-result-reason]"), "Under 7");
    assert.equal(await page.textContent("[data-outcome-area] [data-result-value]"), "5.5");

    const scope = 'div[data-indicator="sleep_hours"]';
    await page.click(`${scope} [data-toggle="hazards"]`);
    assert.deepEqual(await panelTexts(page, scope), panelStrings(panelFor(hazards, "sleep_hours")));
    await page.selectOption("select[name=indicator]", "blood_glucose");
    await page.waitForSelector('[data-entry-form="blood_glucose"]');
    const sugar = 'div[data-indicator="blood_glucose"]';
    assert.equal(await page.getAttribute(`${sugar} [data-toggle="hazards"]`, "aria-expanded"), "false", "it starts shut for each indicator");
    await page.click(`${sugar} [data-toggle="hazards"]`);
    assert.deepEqual(await panelTexts(page, sugar), panelStrings(panelFor(hazards, "blood_glucose")));
  });

  await t.test("input safety on screen: ask again, accept the same impossible value twice, refuse after-meal sugar", async () => {
    await open("enter");
    await page.selectOption("select[name=indicator]", "heart_rate");
    await page.waitForSelector('[data-entry-form="heart_rate"]');
    const problems = () => page.$$eval("[data-outcome-area] [data-problem]", (nodes) => nodes.map((node) => node.getAttribute("data-problem")));
    await page.click("[data-entry-form] button[type=submit]");
    await page.waitForSelector('[data-outcome="ask_again"]');
    assert.deepEqual(await problems(), ["source:missing", "value:missing"]);
    await page.fill("input[name=value]", "fast");
    await page.check("input[name=source][value=count]");
    await page.click("[data-entry-form] button[type=submit]");
    assert.deepEqual(await problems(), ["value:not_a_number"]);
    await page.fill("input[name=value]", "300");
    await page.click("[data-entry-form] button[type=submit]");
    assert.deepEqual(await problems(), ["value:outside_range"]);
    assert.match(await page.innerText("[data-outcome-area]"), /20 to 250 bpm/);
    await page.click("[data-entry-form] button[type=submit]");
    await page.waitForSelector("[data-outcome-area] [data-saved]");
    assert.equal(await page.getAttribute("[data-outcome-area] [data-result-status]", "data-result-status"), "warning");

    await page.selectOption("select[name=indicator]", "blood_glucose");
    await page.waitForSelector('[data-entry-form="blood_glucose"]');
    await page.fill("input[name=value]", "110");
    await page.check("input[name=context][value=other_context]");
    await page.click("[data-entry-form] button[type=submit]");
    await page.waitForSelector('[data-outcome="refused"]');
    assert.deepEqual(await problems(), ["context:context_refused"]);
    await open("history");
    const stored = await historyStatuses(page);
    assert.equal(Object.keys(stored).length, 182, "the sleep and heart-rate entries are stored; the refused sugar is not");
  });

  await t.test("Mood check: the weekly PHQ-2 has its own bands, and the distress mark is red at once", async () => {
    await open("mood");
    await page.check('input[name="items.0"][value="2"]');
    await page.check('input[name="items.1"][value="1"]');
    await page.click("[data-weekly-form] button[type=submit]");
    await page.waitForSelector('[data-outcome-area="weekly"] [data-saved]');
    assert.equal(await page.getAttribute('[data-outcome-area="weekly"] [data-result-status]', "data-result-status"), "warning");
    await page.click("[data-distress]");
    await page.waitForSelector('[data-outcome-area="distress"] [data-saved]');
    assert.equal(await page.getAttribute('[data-outcome-area="distress"] [data-result-status]', "data-result-status"), "contact");
    assert.equal(await page.textContent('[data-outcome-area="distress"] [data-result-meaning]'), settings.meta.status_meaning.contact);
  });

  await t.test("About: limits statement, AI disclosure, both file versions with D-57, and the licence", async () => {
    await open("about");
    assert.equal(await page.textContent("[data-limits-full]"), plainOf(limits.full));
    assert.match(await page.textContent("[data-ai-disclosure]"), /AI-generated \(D-44\).*AI assistant \(Claude, Anthropic\)/);
    assert.equal(await page.getAttribute("[data-thresholds-version]", "data-thresholds-version"), "0.4.0");
    const hazardLine = await page.textContent("[data-hazards-version]");
    assert.match(hazardLine, /1\.0\.0/);
    assert.match(hazardLine, /D-57/);
    assert.match(await page.innerText('[data-about="licence"]'), /Apache License 2\.0/);
  });

  await t.test("export downloads JSON and CSV for the chosen astronaut and uploads nothing", async () => {
    await open("astronaut");
    const requestsBefore = log.requests.length;
    const [json] = await Promise.all([page.waitForEvent("download"), page.click('[data-export="json"]')]);
    const data = JSON.parse(readFileSync(await json.path(), "utf8"));
    assert.match(json.suggestedFilename(), /^stellavita-syn-b-\d{4}-\d{2}-\d{2}\.json$/);
    assert.equal(data.profile.id, "SYN-B");
    assert.equal(data.readings.length, 184);
    assert.equal(data.results.length, 184);
    assert.equal(data.hazardLinksVersion, "1.0.0");
    const [csv] = await Promise.all([page.waitForEvent("download"), page.click('[data-export="csv"]')]);
    assert.equal(parseCsv(readFileSync(await csv.path(), "utf8")).length, 184);
    assert.deepEqual(log.requests.slice(requestsBefore).filter((url) => !url.startsWith("blob:")), [], "export makes no request");
  });

  await t.test("with the hazard file missing, every status is the same and only the panel is absent", async () => {
    const other = await newPage(server, { blockHazards: true });
    try {
      await firstRun(other.page, server);
      await other.open("history");
      const statuses = await historyStatuses(other.page);
      assert.deepEqual(statuses, baseline, "identical with and without the hazard file");
      await other.open("today");
      assert.equal(await other.page.locator('[data-toggle="hazards"]').count(), 0);
      assert.equal(await other.page.locator("article[data-indicator]").count(), 6);
      await other.open("about");
      assert.equal(await other.page.getAttribute("[data-hazards-version]", "data-hazards-version"), "not loaded");
    } finally {
      await other.context.close();
    }
  });

  await t.test("offline: with the network off and the server stopped, the app reloads with its data, its CSS and the panel", async () => {
    await open("about");
    await page.waitForSelector("html[data-offline-ready]");
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    const cached = await page.evaluate(async () => {
      const names = await caches.keys();
      const keys = await (await caches.open(names[0])).keys();
      return { names, count: keys.length };
    });
    assert.equal(cached.names.length, 1);
    assert.match(cached.names[0], /^stellavita-refined-[0-9a-f]{16}$/);
    assert.equal(cached.count, 24, "every file of the app is saved");

    await context.setOffline(true);
    await server.close();
    serverOpen = false;

    await page.reload();
    await page.waitForSelector('html[data-app-ready] main[data-screen="about"]');
    await open("today");
    assert.equal(await page.locator("article[data-indicator]").count(), 6);
    assert.match(await page.textContent("#who"), /^SYN-B/);

    const theme = loadTheme();
    const rgb = (hex) => `rgb(${[1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16)).join(", ")})`;
    const styles = await page.evaluate(() => ({
      page: getComputedStyle(document.body).backgroundColor,
      card: getComputedStyle(document.querySelector("article[data-indicator]")).backgroundColor,
      rules: document.styleSheets[0].cssRules.length,
    }));
    assert.equal(styles.page, rgb(theme.light.page), "the compiled CSS is applied offline");
    assert.equal(styles.card, rgb(theme.light.card));
    assert.ok(styles.rules > 50);

    const scope = 'article[data-indicator="heart_rate"]';
    await page.click(`${scope} [data-toggle="hazards"]`);
    assert.deepEqual(await panelTexts(page, scope), panelStrings(panelFor(hazards, "heart_rate")));
    await page.click(`${scope} [data-toggle="guidance"]`);
    assert.ok((await page.innerText('[data-guidance="heart_rate"]')).includes("Your resting heart rate is how fast your heart beats while you are calm."));

    await open("enter");
    await page.selectOption("select[name=indicator]", "body_temperature");
    await page.waitForSelector('[data-entry-form="body_temperature"]');
    await page.fill("input[name=value]", "39.5");
    await page.check("input[name=method][value=oral]");
    await page.click("[data-entry-form] button[type=submit]");
    await page.waitForSelector("[data-outcome-area] [data-saved]");
    assert.equal(await page.getAttribute("[data-outcome-area] [data-result-status]", "data-result-status"), "contact");

    await page.reload();
    await page.waitForSelector('html[data-app-ready] main[data-screen="enter"]');
    await open("today");
    assert.equal(await page.getAttribute('article[data-indicator="body_temperature"] [data-result-status]', "data-result-status"), "contact", "the reading entered offline is still there after a reload");
  });

  await t.test("reset, still offline: every reading is wiped and the clean sample is back", async () => {
    await open("astronaut");
    assert.equal(await page.getAttribute("[data-reading-count]", "data-reading-count"), "185");
    await page.click("[data-reset]");
    await page.click("[data-reset-yes]");
    await page.waitForSelector('[data-reading-count="180"]');
    await open("history");
    assert.deepEqual(await historyStatuses(page), baseline);
  });

  await t.test("no request went to another site, and the page reported no error", async () => {
    const origin = server.origin;
    const foreign = log.requests.filter((url) => !url.startsWith(`${origin}/`) && !url.startsWith("blob:") && !url.startsWith("data:"));
    assert.deepEqual(foreign, [], "every request the browser reported went to the app's own address");
    assert.ok(log.requests.some((url) => url.endsWith("/app/css/app.css")));
    assert.deepEqual(outside, [], "nothing reached the stand-in proxy for other sites");
    assert.deepEqual(server.requests.filter((url) => !url.startsWith("/app/")), [], "the server was asked only for files of the app");
    assert.deepEqual(log.errors, []);
  });
});

test.after(async () => {
  await browser?.close();
  if (proxy.listening) await new Promise((resolve) => proxy.close(resolve));
});
