// The hazard module (D-57; refined brief sections 5 and 7).
import test from "node:test";
import assert from "node:assert/strict";
import * as hazards from "../app/js/hazards.js";
import { judgeAll } from "../app/js/engine.js";
import { clone, loadHazards, loadThresholds, readText } from "./helpers/files.js";
import { demoReadings } from "./helpers/demo.js";

const data = loadHazards();
const settings = loadThresholds();
const text = data.meta.screen_text;
const panels = settings.indicators.map((indicator) => ({ indicator, panel: hazards.panelFor(data, indicator.id) }));

test("the hazard file in app/data passes the check", () => {
  assert.deepEqual(hazards.validateHazards(data), { ok: true, problems: [] });
  assert.equal(data.meta.version, "1.0.0");
  assert.equal(hazards.HAZARDS_PATH, "data/Hazard_Links.json");
});

test("a broken hazard file is refused, with the reason", () => {
  const cases = [
    ["not an object", () => null, /not a JSON object/],
    ["no title", (d) => { delete d.meta.screen_text.panel_title; }, /panel_title/],
    ["no limit line", (d) => { d.meta.screen_text.limit = ""; }, /screen_text\.limit/],
    ["no closeness labels", (d) => { delete d.meta.screen_text.closeness_labels; }, /closeness_labels/],
    ["a hazard without a label", (d) => { delete d.meta.screen_text.hazard_labels.radiation; }, /no label for the hazard "radiation"/],
    ["an unknown rating", (d) => { d.links[0].closeness = "nearby"; }, /unknown closeness "nearby"/],
    ["an unknown hazard", (d) => { d.links[0].hazard = "boredom"; }, /unknown hazard/],
    ["a link missing", (d) => { d.links.pop(); }, /mood: no link for the hazard "hostile_closed_environment"/],
    ["a link listed twice", (d) => { d.links.push(clone(d.links[0])); }, /listed twice/],
    ["no summary", (d) => { delete d.indicators.mood.summary; }, /mood: no summary/],
    ["no diagram", (d) => { delete d.links[3].diagram; }, /no diagram source/],
  ];
  for (const [name, breakIt, expected] of cases) {
    const copy = clone(data);
    const broken = breakIt(copy) === null ? null : copy;
    const checked = hazards.validateHazards(broken);
    assert.equal(checked.ok, false, name);
    assert.ok(checked.problems.some((problem) => expected.test(problem)), `${name}: ${checked.problems.join("; ")}`);
  }
});

test("every indicator of the threshold file has a panel, and every hazard indicator is reached", () => {
  const reached = new Set();
  for (const { indicator, panel } of panels) {
    assert.ok(panel, `${indicator.id} has a panel`);
    reached.add(panel.indicator);
  }
  assert.deepEqual([...reached].sort(), Object.keys(data.indicators).sort());
  assert.equal(hazards.hazardKeyFor(data, "blood_glucose"), "blood_sugar", "the two files name blood sugar differently (ISSUES)");
  assert.equal(hazards.panelFor(data, "naps"), null);
});

test("hazard data shown in full: each of the 30 links is in its indicator's panel, with rating, chain and source", () => {
  assert.equal(data.links.length, 30);
  let shown = 0;
  for (const link of data.links) {
    const owner = panels.find(({ panel }) => panel.indicator === link.indicator);
    assert.ok(owner, `a panel shows ${link.indicator}`);
    const entries = owner.panel.hazards.filter((hazard) => hazard.hazard === link.hazard);
    assert.equal(entries.length, 1, `${link.hazard} appears once for ${link.indicator}`);
    const [entry] = entries;
    assert.equal(entry.label, text.hazard_labels[link.hazard]);
    assert.equal(entry.closeness, link.closeness);
    assert.equal(entry.closenessLabel, text.closeness_labels[link.closeness]);
    assert.deepEqual(entry.path, link.path);
    assert.equal(entry.chain, link.path.join(" \u2192 "));
    assert.equal(entry.diagram, link.diagram);
    assert.deepEqual(entry.sources, [link.diagram]);
    assert.equal(entry.arrows, link.arrows);
    const strings = hazards.panelStrings(owner.panel);
    for (const needed of [entry.label, entry.closenessLabel, entry.diagram, ...(link.path.length ? [entry.chain] : [])]) {
      assert.ok(strings.includes(needed), `"${needed}" is on screen`);
    }
    shown += 1;
  }
  assert.equal(shown, 30);
  assert.equal(panels.reduce((total, { panel }) => total + panel.hazards.length, 0), 30);
  for (const { panel } of panels) {
    assert.deepEqual(panel.hazards.map((hazard) => hazard.hazard).sort(), [...data.hazards].sort(), "the five hazards");
  }
});

test("hazard rules hold: each rating follows meta.method.closeness_rules", () => {
  // The rules, as the file words them (meta.method.closeness_rules):
  assert.deepEqual(data.meta.method.closeness_rules, {
    close: "1 or 2 arrows, and observability high or partial",
    intermediate: "3 arrows, and observability high or partial",
    distant: "4 or more arrows, or observability low, or a held source says the effect along this path is long-term disease",
    not_linked: "no path inside the indicator's own diagram(s)",
  });
  const mismatches = [];
  for (const link of data.links) {
    const indicator = data.indicators[link.indicator];
    const seen = ["high", "partial"].includes(indicator.observability);
    const longTerm = /long-term disease/.test(link.override ?? "");
    let expected;
    if (link.arrows === null) expected = "not_linked";
    else if (link.arrows >= 4 || indicator.observability === "low" || longTerm) expected = "distant";
    else if (link.arrows === 3 && seen) expected = "intermediate";
    else if ((link.arrows === 1 || link.arrows === 2) && seen) expected = "close";
    if (expected !== link.closeness) mismatches.push(`${link.hazard} to ${link.indicator}: file says ${link.closeness}, the rules give ${expected}`);

    // The chain agrees with the count, starts at the hazard and ends at a node the reading watches.
    if (link.arrows === null) {
      assert.deepEqual(link.path, [], `${link.hazard} to ${link.indicator}: no path`);
    } else {
      assert.equal(link.path.length, link.arrows + 1, `${link.hazard} to ${link.indicator}: arrows and chain agree`);
      assert.equal(link.path[0], data.hazard_node_names[link.hazard]);
      assert.ok(indicator.observed_nodes.includes(link.path[link.path.length - 1]));
    }
    assert.ok(indicator.diagrams.includes(link.diagram));
    // An override is given wherever the count alone would give another rating.
    if (link.arrows !== null && link.arrows < 4 && link.closeness === "distant") assert.ok(link.override, `${link.hazard} to ${link.indicator} states its override`);
    if (link.override === "observability low") assert.equal(indicator.observability, "low");
  }
  // A mismatch would be logged in docs/ISSUES.md, never fixed in the file. There is none in v1.0.0.
  assert.deepEqual(mismatches, []);
});

test("order: Close first, then Intermediate, Distant and Not linked", () => {
  assert.deepEqual(hazards.closenessOrder(data), ["close", "intermediate", "distant", "not_linked"]);
  for (const { panel } of panels) {
    const ranks = panel.hazards.map((hazard) => hazard.rank);
    assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b), `${panel.indicator} is in order`);
    assert.deepEqual(panel.key.map((level) => level.closenessLabel), ["Close", "Intermediate", "Distant", "Not linked"]);
  }
  const sleep = hazards.panelFor(data, "sleep_hours");
  assert.deepEqual(sleep.hazards.map((h) => h.closenessLabel), ["Close", "Close", "Close", "Close", "Intermediate"]);
  assert.equal(sleep.hazards[4].label, "Distance from Earth");
  const mood = hazards.panelFor(data, "mood");
  assert.deepEqual(mood.hazards.map((h) => h.closenessLabel), ["Close", "Distant", "Distant", "Not linked", "Not linked"]);
  const sugar = hazards.panelFor(data, "blood_glucose");
  assert.deepEqual(sugar.hazards.map((h) => h.closenessLabel), ["Distant", "Distant", "Distant", "Distant", "Not linked"]);
});

test("closeness is a word and a symbol, never colour alone", () => {
  const symbols = hazards.panelFor(data, "mood").key.map((level) => level.symbol);
  assert.deepEqual(symbols, ["\u25A0\u25A0\u25A0", "\u25A0\u25A0\u25A1", "\u25A0\u25A1\u25A1", "\u25A1\u25A1\u25A1"]);
  assert.equal(new Set(symbols).size, 4, "each rating has its own symbol");
  for (const { panel } of panels) {
    for (const hazard of panel.hazards) {
      assert.ok(hazard.closenessLabel.length > 0);
      assert.equal(hazard.symbol, symbols[hazard.rank]);
    }
  }
});

test("screen text: every panel string equals its field in the file, word for word", () => {
  for (const { panel } of panels) {
    const entry = data.indicators[panel.indicator];
    assert.equal(panel.title, text.panel_title);
    assert.equal(panel.title, "Why this is watched");
    assert.equal(panel.intro, text.panel_intro);
    assert.equal(panel.summary, entry.summary);
    assert.equal(panel.limit, text.limit);
    assert.equal(panel.version, data.meta.version);

    const allowed = new Set([
      text.panel_title, text.panel_intro, text.limit, entry.summary,
      ...Object.values(text.closeness_labels), ...Object.values(text.closeness_meanings), ...Object.values(text.hazard_labels),
      ...data.links.map((link) => link.diagram),
    ]);
    const symbols = new Set(panel.key.map((level) => level.symbol));
    const nodes = new Set(data.links.flatMap((link) => link.path));
    for (const shown of hazards.panelStrings(panel)) {
      if (allowed.has(shown) || symbols.has(shown)) continue;
      const pieces = shown.split(" \u2192 ");
      assert.ok(pieces.length > 1 && pieces.every((piece) => nodes.has(piece)), `"${shown}" is not text of the hazard file`);
    }
    const strings = hazards.panelStrings(panel);
    assert.equal(strings[0], text.panel_title);
    assert.equal(strings[strings.length - 1], text.limit, "the limit line closes the panel");
  }
});

test("no hard-coding: changing a rating or a label in a copy of the file changes the panel", () => {
  const copy = clone(data);
  const link = copy.links.find((l) => l.hazard === "radiation" && l.indicator === "sleep_hours");
  link.closeness = "not_linked";
  copy.meta.screen_text.hazard_labels.radiation = "Radiation (test label)";
  copy.meta.screen_text.closeness_labels.not_linked = "No link (test)";
  copy.meta.screen_text.panel_title = "Test title";
  copy.meta.screen_text.panel_intro = "Test intro";
  copy.meta.screen_text.limit = "Test limit";
  copy.indicators.sleep_hours.summary = "Test summary";
  link.path = ["Radiation", "Test Node", "Sleep Deficiencies"];
  link.diagram = "S-TEST";

  const before = hazards.panelFor(data, "sleep_hours");
  const after = hazards.panelFor(copy, "sleep_hours");
  assert.equal(before.hazards[0].hazard, "radiation");
  const moved = after.hazards[after.hazards.length - 1];
  assert.equal(moved.hazard, "radiation", "the changed rating moved it to the end");
  assert.equal(moved.label, "Radiation (test label)");
  assert.equal(moved.closenessLabel, "No link (test)");
  assert.equal(moved.chain, "Radiation \u2192 Test Node \u2192 Sleep Deficiencies");
  assert.equal(moved.diagram, "S-TEST");
  assert.equal(after.title, "Test title");
  assert.equal(after.intro, "Test intro");
  assert.equal(after.limit, "Test limit");
  assert.equal(after.summary, "Test summary");
});

test("no hard-coding: the order and the number of ratings come from the file", () => {
  const copy = clone(data);
  const labels = copy.meta.screen_text.closeness_labels;
  copy.meta.screen_text.closeness_labels = { not_linked: labels.not_linked, distant: labels.distant, intermediate: labels.intermediate, close: labels.close, far: "Very far (test)" };
  copy.links.find((l) => l.hazard === "distance_from_earth" && l.indicator === "mood").closeness = "far";
  assert.equal(hazards.validateHazards(copy).ok, true);
  const mood = hazards.panelFor(copy, "mood");
  assert.deepEqual(mood.hazards.map((h) => h.closenessLabel), ["Not linked", "Not linked", "Distant", "Close", "Very far (test)"]);
  assert.equal(mood.key.length, 5);
  assert.equal(mood.key[0].symbol.length, 4);
});

test("the module names no hazard, rating or label of the file", () => {
  const source = readText("app", "js", "hazards.js");
  const words = [
    ...data.hazards, ...Object.keys(text.closeness_labels), ...Object.values(text.closeness_labels),
    ...Object.values(text.hazard_labels), ...Object.values(data.hazard_node_names),
    text.panel_title, text.panel_intro, text.limit,
  ];
  for (const word of words) {
    assert.doesNotMatch(source, new RegExp(`["'\`]${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'\`]`), `hazards.js must not type "${word}"`);
  }
});

test("the hazard module is pure: no imports, no browser calls, and it never sees a reading", () => {
  const source = readText("app", "js", "hazards.js");
  assert.doesNotMatch(source, /^\s*import\s/m);
  assert.doesNotMatch(source, /\bimport\s*\(/);
  for (const name of ["window", "document", "navigator", "localStorage", "sessionStorage", "indexedDB", "fetch", "caches", "self", "globalThis", "console"]) {
    assert.doesNotMatch(source, new RegExp(`\\b${name}\\b`), `hazards.js must not use ${name}`);
  }
  assert.doesNotMatch(source, /\bstatus\b(?!\.)/i.test(source) ? /\b(judgeReading|judgeAll|status_levels)\b/ : /\bjudge/);
  assert.equal(hazards.panelFor.length, 2, "panelFor takes the file and an indicator id, nothing else");
});

test("the panel never changes a status: results with and without the hazard file are identical for all 720", () => {
  const readings = demoReadings();
  const without = judgeAll(settings, readings);
  const frozen = JSON.stringify(settings);
  for (const indicator of settings.indicators) {
    const panel = hazards.panelFor(data, indicator.id);
    hazards.panelStrings(panel);
  }
  const withPanels = judgeAll(settings, readings);
  assert.equal(without.length, 720);
  assert.deepEqual(withPanels, without);
  assert.equal(JSON.stringify(settings), frozen, "building a panel does not touch the settings");
  const engineSource = readText("app", "js", "engine.js");
  assert.doesNotMatch(engineSource, /hazard/i, "the engine knows nothing about hazards");
  for (const { panel } of panels) {
    const json = JSON.stringify(panel);
    for (const status of settings.meta.status_levels) {
      assert.doesNotMatch(json, new RegExp(`"${status}"`), "a panel carries no status");
    }
  }
});

test("building a panel does not change the hazard file's data", () => {
  const frozen = JSON.stringify(data);
  const panel = hazards.panelFor(data, "heart_rate");
  panel.hazards[0].path.push("changed");
  panel.diagrams.push("changed");
  assert.equal(JSON.stringify(data), frozen);
});
