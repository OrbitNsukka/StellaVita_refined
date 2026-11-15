// Parity with the reference checker (brief section 11; refined brief section 7).
import test from "node:test";
import assert from "node:assert/strict";
import { judgeAll } from "../app/js/engine.js";
import { loadThresholds } from "./helpers/files.js";
import { demoReadings, demoRows, expectedRows, expectedTable, statusTable } from "./helpers/demo.js";

const settings = loadThresholds();
const readings = demoReadings();
const results = judgeAll(settings, readings);
const got = statusTable(results, readings);
const want = expectedTable();

test("the demo data gives 120 rows x 6 indicators, all judged, no gaps", () => {
  assert.equal(demoRows().length, 120);
  assert.equal(expectedRows().length, 120);
  assert.equal(results.length, 720);
  assert.equal(Object.keys(got).length, 720);
  assert.equal(Object.keys(want).length, 720);
  for (const result of results) {
    assert.ok(settings.meta.status_levels.includes(result.status), `${result.readingId} has status ${result.status}`);
  }
});

test("parity: 720 of 720 statuses match tests/expected_colours.csv", () => {
  const wrong = Object.keys(want).filter((key) => got[key] !== want[key]);
  const matched = Object.keys(want).length - wrong.length;
  assert.deepEqual(wrong.map((key) => `${key}: engine ${got[key]}, checker ${want[key]}`), []);
  assert.equal(matched, 720);
});

test("red only on SYN-B day 14 (sleep), SYN-C day 18 (temperature), SYN-D day 22 (blood sugar)", () => {
  const reds = Object.keys(got).filter((key) => got[key] === "contact").sort();
  assert.deepEqual(reds, ["SYN-B|14|sleep_hours", "SYN-C|18|body_temperature", "SYN-D|22|blood_glucose"]);
});

test("the three reds carry the reason and sources of what set them", () => {
  const byKey = (crew, day, indicator) => results.find((r) => r.readingId === `demo-${crew}-${day}-${indicator}`);
  const sleep = byKey("SYN-B", 14, "sleep_hours");
  assert.equal(sleep.rule, "pattern");
  assert.equal(sleep.reason, "6 hours or less on 3 nights in a row");
  assert.deepEqual(sleep.source_ids, ["S-28", "D-19"]);
  const temp = byKey("SYN-C", 18, "body_temperature");
  assert.equal(temp.rule, "band");
  assert.equal(temp.reason, "39.4 or higher");
  assert.deepEqual(temp.source_ids, ["S-27"]);
  const sugar = byKey("SYN-D", 22, "blood_glucose");
  assert.equal(sugar.rule, "band");
  assert.equal(sugar.reason, "Below 54");
  assert.deepEqual(sugar.source_ids, ["S-132"]);
});

test("personal range: SYN-B's heart rate is amber on 6 days, all in the first week", () => {
  const amber = results
    .filter((r) => r.indicator === "heart_rate" && r.profileId === "SYN-B" && r.status === "warning")
    .map((r) => readings.find((reading) => reading.id === r.readingId).day);
  assert.equal(amber.length, 6);
  assert.ok(amber.every((day) => day <= 7), `amber days: ${amber}`);
  const inRange = results.filter((r) => r.profileId === "SYN-B" && r.rule === "personal_range");
  assert.ok(inRange.length > 0);
  for (const r of inRange) {
    assert.equal(r.status, "normal");
    assert.equal(r.reason, "inside your usual range");
  }
});

test("status counts match the reference checker's meta file", async () => {
  const { readJson } = await import("./helpers/files.js");
  const meta = readJson("tests", "expected_colours.meta.json");
  const counts = {};
  for (const status of Object.values(got)) counts[status] = (counts[status] ?? 0) + 1;
  assert.deepEqual(counts, meta.status_counts);
  assert.equal(meta.thresholds_version, settings.meta.version);
});

test("the order the readings arrive in does not change any status", () => {
  const shuffled = [...readings].reverse();
  const again = statusTable(judgeAll(settings, shuffled), readings);
  assert.deepEqual(again, got);
});
