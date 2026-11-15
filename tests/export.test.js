// Export: JSON and CSV for the chosen astronaut. A download only.
import test from "node:test";
import assert from "node:assert/strict";
import { CSV_COLUMNS, enteredValue, exportCsv, exportFileName, exportJson } from "../app/js/export.js";
import { judgeAll, sortReadings } from "../app/js/engine.js";
import { parseCsv, sampleReadings } from "../app/js/sample.js";
import { loadThresholds, readText } from "./helpers/files.js";

const settings = loadThresholds();
const all = sampleReadings(parseCsv(readText("app", "data", "synthetic_demo_data.csv")), settings);
const readings = sortReadings(all.filter((reading) => reading.profileId === "SYN-B"));
const results = judgeAll(settings, readings);
const profile = { id: "SYN-B", label: "Astronaut B (synthetic)", createdAt: "t", thresholdsVersion: "0.4.0" };

test("JSON export: the profile, every reading, every result, the versions and an AI notice", () => {
  const data = JSON.parse(exportJson({ profile, readings, results, settings, hazardsVersion: "1.0.0", exportedAt: "2026-11-15T10:00:00.000Z" }));
  assert.equal(data.readings.length, 180);
  assert.equal(data.results.length, 180);
  assert.deepEqual(data.profile, profile);
  assert.equal(data.thresholdsVersion, "0.4.0");
  assert.equal(data.hazardLinksVersion, "1.0.0");
  assert.equal(data.exportedAt, "2026-11-15T10:00:00.000Z");
  assert.match(data.notice, /AI-generated/);
  assert.match(data.notice, /Synthetic data only/);
  const red = data.results.find((r) => r.status === "contact");
  assert.equal(red.readingId, "sample-SYN-B-14-sleep_hours");
});

test("CSV export: one row per reading with its result beside it", () => {
  const rows = parseCsv(exportCsv({ readings, results }));
  assert.equal(rows.length, 180);
  assert.deepEqual(Object.keys(rows[0]), [...CSV_COLUMNS]);
  const row = rows.find((r) => r.reading_id === "sample-SYN-B-14-sleep_hours");
  assert.equal(row.status, "contact");
  assert.equal(row.reason, "6 hours or less on 3 nights in a row");
  assert.equal(row.source_ids, "S-28; D-19");
  assert.equal(row.value, "5.2");
  assert.equal(row.unit, "hours");
  assert.equal(row.note, "Third short night (synthetic event)");
  const pressure = rows.find((r) => r.reading_id === "sample-SYN-B-13-blood_pressure");
  assert.equal(pressure.value, "92/58");
  assert.equal(pressure.symptoms, "dizziness");
  assert.equal(pressure.entered, "92/58");
});

test("CSV export: commas, quotes and line breaks are kept; a formula-like note is made harmless", () => {
  const reading = { id: "r1", profileId: "SYN-B", indicator: "sleep_hours", date: "2026-11-15", time: "07:00", symptoms: [], note: '=SUM(A1), "quoted"\nsecond line', value: 7.5 };
  const [row] = parseCsv(exportCsv({ readings: [reading], results: judgeAll(settings, [reading]) }));
  assert.equal(row.note, "'=SUM(A1), \"quoted\"\nsecond line");
  assert.equal(row.status, "normal");
});

test("the entered value keeps both blood-pressure readings and both weekly answers", () => {
  assert.equal(enteredValue({ readings: [{ systolic: 121, diastolic: 79 }, { systolic: 118, diastolic: 76 }] }), "121/79 then 118/76");
  assert.equal(enteredValue({ items: [2, 1] }), "2+1");
  assert.equal(enteredValue({ marked: true }), "");
});

test("file names carry the astronaut and the date, and no personal detail", () => {
  assert.equal(exportFileName("SYN-B", "2026-11-15", "json"), "stellavita-syn-b-2026-11-15.json");
  assert.equal(exportFileName("SYN-B", "2026-11-15", "csv"), "stellavita-syn-b-2026-11-15.csv");
});

test("export never uploads: the module makes no network call", () => {
  const source = readText("app", "js", "export.js");
  for (const word of ["fetch", "XMLHttpRequest", "sendBeacon", "WebSocket", "EventSource"]) {
    assert.doesNotMatch(source, new RegExp(`\\b${word}\\b`), `export.js must not use ${word}`);
  }
});
