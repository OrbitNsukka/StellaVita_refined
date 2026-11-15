// No hard-coding (CLAUDE.md rule 2; refined brief section 7): no number or
// rating from either data file is typed into the app's code, and no health
// wording of the files is typed there either.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { APP, listFiles, loadHazards, loadThresholds, relativeToRoot } from "./helpers/files.js";

const settings = loadThresholds();
const hazards = loadHazards();
const codeFiles = [...listFiles(join(APP, "js")), join(APP, "sw.js")].filter((file) => file.endsWith(".js") && existsSync(file));

// Splits JavaScript into its code (strings and comments blanked out) and its string literals.
function dissect(source) {
  let code = "";
  const strings = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];
    if (ch === "/" && next === "/") {
      while (i < source.length && source[i] !== "\n") i += 1;
    } else if (ch === "/" && next === "*") {
      i = source.indexOf("*/", i + 2) + 2;
    } else if (ch === '"' || ch === "'" || ch === "`") {
      let text = "";
      i += 1;
      while (i < source.length && source[i] !== ch) {
        if (source[i] === "\\") {
          text += source[i + 1];
          i += 2;
        } else if (ch === "`" && source[i] === "$" && source[i + 1] === "{") {
          // The code inside ${...} is code: hand it back to the scanner.
          let depth = 1;
          let inner = "";
          i += 2;
          while (i < source.length && depth > 0) {
            if (source[i] === "{") depth += 1;
            if (source[i] === "}") depth -= 1;
            if (depth > 0) inner += source[i];
            i += 1;
          }
          const part = dissect(inner);
          code += ` ${part.code} `;
          strings.push(...part.strings);
          text += " ";
        } else {
          text += source[i];
          i += 1;
        }
      }
      i += 1;
      strings.push(text);
      code += '""';
    } else if (ch === "/" && /[=(,:;!&|?{}\[\n]\s*$/.test(code)) {
      // A regular expression literal: skip it.
      i += 1;
      let inClass = false;
      while (i < source.length && (source[i] !== "/" || inClass)) {
        if (source[i] === "\\") i += 1;
        else if (source[i] === "[") inClass = true;
        else if (source[i] === "]") inClass = false;
        i += 1;
      }
      i += 1;
      code += "/re/";
    } else {
      code += ch;
      i += 1;
    }
  }
  return { code, strings };
}

function numbersIn(value, found = new Set()) {
  if (typeof value === "number") found.add(value);
  else if (Array.isArray(value)) value.forEach((item) => numbersIn(item, found));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => numbersIn(item, found));
  return found;
}

// 0, 1 and 2 are needed to write any program (first item, next item, a pair, a
// half). Every other number of the two data files is forbidden in the code.
const STRUCTURAL = new Set([0, 1, 2]);
const fileNumbers = new Set([...numbersIn(settings), ...numbersIn(hazards)].filter((n) => !STRUCTURAL.has(n)));

test("the scan itself works: it sees numbers in code and ignores strings and comments", () => {
  const sample = dissect('const a = 59; // 60 here\nconst b = "100"; /* 101 */ const c = `x${a + 14}y`; const d = /7{3}/.test(b) ? 1e-9 : .5;');
  const literals = sample.code.match(/(?<![\w$.])(\d+\.?\d*(e[+-]?\d+)?|\.\d+)/gi).map(Number);
  assert.deepEqual(literals, [59, 14, 1e-9, 0.5]);
  assert.deepEqual(sample.strings, ["100", "x y"]);
  assert.ok(fileNumbers.has(59) && fileNumbers.has(39.4) && fileNumbers.has(14) && fileNumbers.has(4) && fileNumbers.has(600));
  assert.ok(fileNumbers.size >= 45, `${fileNumbers.size} numbers are forbidden`);
});

test("no number from Indicator_Thresholds.json or Hazard_Links.json is typed into the app's code", () => {
  assert.ok(codeFiles.length >= 10, "the app's JavaScript files are scanned");
  const found = [];
  for (const file of codeFiles) {
    const { code } = dissect(readFileSync(file, "utf8"));
    for (const match of code.matchAll(/(?<![\w$.])(\d+\.?\d*(e[+-]?\d+)?|\.\d+)/gi)) {
      const value = Number(match[0]);
      if (fileNumbers.has(value)) found.push(`${relativeToRoot(file)}: ${match[0]}`);
    }
  }
  assert.deepEqual(found, []);
});

function escape(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function wholeWord(text) {
  return new RegExp(`(?<![\\w])${escape(text)}(?![\\w])`);
}

function thresholdWording() {
  const words = new Set();
  const add = (text) => {
    if (typeof text === "string" && text.length > 0) words.add(text);
  };
  Object.values(settings.meta.status_meaning).forEach(add);
  for (const indicator of settings.indicators) {
    add(indicator.label);
    add(indicator.measurement);
    add(indicator.context_note);
    const lists = Array.isArray(indicator.bands) ? [indicator.bands] : Object.values(indicator.bands);
    if (indicator.weekly_phq2) {
      lists.push(indicator.weekly_phq2.bands);
      indicator.weekly_phq2.questions.forEach(add);
      add(indicator.weekly_phq2.licence_note);
    }
    for (const band of lists.flat()) {
      add(band.label);
      add(band.note);
    }
    for (const rule of indicator.symptom_rules ?? []) {
      rule.symptoms.forEach(add);
      add(rule.note);
    }
    if (indicator.low_reading) {
      add(indicator.low_reading.rule);
      add(indicator.low_reading.without_symptoms);
      indicator.low_reading.with_symptoms.forEach(add);
    }
    if (indicator.baseline_rule) {
      add(indicator.baseline_rule.rule);
      add(indicator.baseline_rule.note);
    }
  }
  for (const rule of settings.pattern_rules) {
    add(rule.label);
    add(rule.action);
  }
  return [...words];
}

function hazardWording() {
  const text = hazards.meta.screen_text;
  return [
    text.panel_title, text.panel_intro, text.limit,
    ...Object.keys(text.closeness_labels), ...Object.values(text.closeness_labels), ...Object.values(text.closeness_meanings),
    ...Object.values(text.hazard_labels), ...hazards.hazards, ...Object.values(hazards.hazard_node_names),
    ...Object.values(hazards.indicators).map((indicator) => indicator.summary),
    ...new Set(hazards.links.flatMap((link) => link.path)),
    ...new Set(hazards.links.map((link) => link.diagram)),
  ];
}

test("no rating, label or other text of Hazard_Links.json is typed into the app's code", () => {
  const found = [];
  for (const file of codeFiles) {
    const { strings } = dissect(readFileSync(file, "utf8"));
    for (const word of hazardWording()) {
      const pattern = wholeWord(word);
      for (const text of strings) {
        if (pattern.test(text)) found.push(`${relativeToRoot(file)}: "${word}" in "${text.slice(0, 60)}"`);
      }
    }
  }
  assert.deepEqual(found, []);
});

test("no label, reason, symptom, note or status meaning of the threshold file is typed into the app's code", () => {
  const found = [];
  for (const file of codeFiles) {
    const { strings } = dissect(readFileSync(file, "utf8"));
    for (const word of thresholdWording()) {
      const pattern = wholeWord(word);
      for (const text of strings) {
        if (pattern.test(text)) found.push(`${relativeToRoot(file)}: "${word}" in "${text.slice(0, 60)}"`);
      }
    }
  }
  assert.deepEqual(found, []);
});

test("the status keys are named only in labels.js, which maps them to the words on screen (D-53)", () => {
  for (const file of codeFiles) {
    if (file.endsWith("labels.js")) continue;
    const { strings, code } = dissect(readFileSync(file, "utf8"));
    for (const status of settings.meta.status_levels) {
      assert.ok(!strings.includes(status), `${relativeToRoot(file)} must not type the status "${status}"`);
      assert.doesNotMatch(code, new RegExp(`\\.${status}\\b`), `${relativeToRoot(file)} must not name the status ${status}`);
    }
  }
});

test("the words on screen for the four statuses (D-53)", async () => {
  const { STATUS_LABELS, statusLabel } = await import("../app/js/labels.js");
  assert.deepEqual(Object.fromEntries(Object.entries(STATUS_LABELS).map(([key, label]) => [key, label.word])), {
    normal: "Normal", warning: "Caution", contact: "Emergency", not_judged: "Not compared",
  });
  const symbols = Object.values(STATUS_LABELS).map((label) => label.symbol);
  assert.equal(new Set(symbols).size, 4, "each status has its own symbol: never colour alone");
  assert.ok(symbols.every((symbol) => symbol.length > 0));
  assert.deepEqual(Object.keys(STATUS_LABELS).slice(0, 3), settings.meta.status_levels);
  assert.equal(statusLabel("something else").word, "Not compared");
});
