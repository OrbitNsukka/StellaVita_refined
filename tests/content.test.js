// Screen text is copied word for word from the approved files (CLAUDE.md rule 7).
import test from "node:test";
import assert from "node:assert/strict";
import { GUIDANCE_PATH, LIMITS_PATH, guidanceFor, parseGuidance, parseLimits, plainOf, runsOf, sectionStrings } from "../app/js/content.js";
import { loadThresholds, readText } from "./helpers/files.js";

const guidanceText = readText("app", "data", "Guidance_Content.md");
const limitsText = readText("app", "data", "Limits_Statement.md");
const guidance = parseGuidance(guidanceText);
const limits = parseLimits(limitsText);
const settings = loadThresholds();
const withoutBold = (text) => text.split("**").join("");

test("the files are read from the app's own data folder", () => {
  assert.equal(GUIDANCE_PATH, "data/Guidance_Content.md");
  assert.equal(LIMITS_PATH, "data/Limits_Statement.md");
});

test("the limits statement: the full wording and the short line, word for word", () => {
  assert.equal(
    plainOf(limits.full),
    "This tool gives general health guidance only. It does not diagnose, treat or replace medical judgment. It compares your logged readings against published public ranges and flags patterns. A green screen does not mean you are healthy, and a red screen does not tell you what is wrong. On any mission, the flight surgeon is the medical authority. Contact your flight surgeon for any red reading, any symptom, or any worry — even if the screen is green.",
  );
  assert.equal(limits.short, "Guidance only — not a diagnosis. Red reading, symptom or worry? Contact the flight surgeon.");
  assert.ok(limitsText.includes(`> ${limits.full}`));
  assert.ok(limitsText.includes(`> ${limits.short}`));
  assert.deepEqual(runsOf(limits.full).filter((run) => run.bold).map((run) => run.text), [
    "This tool gives general health guidance only. It does not diagnose, treat or replace medical judgment.",
    "Contact your flight surgeon for any red reading, any symptom, or any worry — even if the screen is green.",
  ]);
});

test("the short limits line in index.html equals the file, so it shows before any script runs", () => {
  const html = readText("app", "index.html");
  const match = /id="limits-line"[^>]*>([^<]+)</.exec(html);
  assert.ok(match, "index.html has the limits line");
  assert.equal(match[1].trim(), limits.short);
});

test("the guidance file's standing limits line", () => {
  assert.equal(guidance.standingLine, "This tool gives general health guidance only. It does not diagnose. When a reading is red, or anything feels wrong, contact your flight surgeon.");
});

test("each of the six indicators has its guidance section, found from its label in the threshold file", () => {
  const headings = settings.indicators.map((indicator) => guidanceFor(guidance, indicator.label)?.heading);
  assert.deepEqual(headings, ["Heart rate", "Blood pressure", "Blood sugar", "Body temperature", "Sleep hours", "Mood"]);
  assert.equal(guidanceFor(guidance, "Naps"), null);
  for (const indicator of settings.indicators) {
    const section = guidanceFor(guidance, indicator.label);
    assert.deepEqual(section.parts.map((part) => part.title.replace(/ \(.*\)$/, "")), ["What it means", "How to measure", "What to do", "Contact the flight surgeon when"]);
  }
});

test("every piece of a guidance section is in the file word for word, and nothing of the section is left out", () => {
  const fileLines = guidanceText.split(/\r?\n/);
  for (const indicator of settings.indicators) {
    const section = guidanceFor(guidance, indicator.label);
    const start = fileLines.indexOf(`## ${section.heading}`);
    const length = fileLines.slice(start + 1).findIndex((line) => line.startsWith("## "));
    const own = fileLines.slice(start + 1, start + 1 + length).map((line) => line.trim()).filter((line) => line !== "" && line !== "---");
    const shown = sectionStrings(section);
    const expected = own.map((line) => withoutBold(line).replace(/^(\d+\.|-)\s+/, "").replace(/^(.+):$/, (whole, title) => (line.startsWith("**") ? title : whole)));
    assert.deepEqual(shown, expected, section.heading);
    for (const piece of shown) assert.ok(withoutBold(guidanceText).includes(piece), `"${piece}" is in the file`);
  }
});

test("lists keep their kind, and nested points stay with their item", () => {
  const mood = guidanceFor(guidance, "Mood (daily 1-5 tap + weekly PHQ-2)");
  const measure = mood.parts[1];
  assert.equal(measure.blocks.length, 1);
  assert.equal(measure.blocks[0].type, "ol");
  assert.deepEqual(measure.blocks[0].items.map((item) => item.nested), [false, false, true, true, false]);
  const heart = guidanceFor(guidance, "Heart rate (resting)");
  assert.equal(heart.parts[0].blocks[0].type, "p");
  assert.equal(heart.parts[2].blocks[0].type, "ul");
  assert.equal(heart.parts[2].blocks[0].items[0].text, 'Below 60 and the screen says "inside your usual range": nothing to do. That is your normal.');
});

test("the reminders list and the sign-off block are not guidance for any indicator", () => {
  const used = new Set(settings.indicators.map((indicator) => guidanceFor(guidance, indicator.label).heading));
  const unused = guidance.sections.map((section) => section.heading).filter((heading) => !used.has(heading));
  assert.deepEqual(unused, ["Preventive actions for reminders (draft list for Interface & Experience)", "Sign-off block"]);
});
