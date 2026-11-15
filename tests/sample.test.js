// The sample data loader, storage and reset; and parity through the app's own loader.
import test from "node:test";
import assert from "node:assert/strict";
import { SAMPLE_PATH, crewIds, ensureProfiles, loadSample, parseCsv, resetToSample, sampleProfiles, sampleReadings } from "../app/js/sample.js";
import { openStore } from "../app/js/store.js";
import { checkReading, judgeAll } from "../app/js/engine.js";
import { loadThresholds, readText } from "./helpers/files.js";
import { expectedTable } from "./helpers/demo.js";
import { createFakeIndexedDB } from "./helpers/fake-indexeddb.js";

const settings = loadThresholds();
const csv = readText("app", "data", "synthetic_demo_data.csv");
const rows = parseCsv(csv);
const fetchText = async (path) => {
  assert.equal(path, SAMPLE_PATH);
  return csv;
};
const options = async () => ({ fetchText, store: await openStore(createFakeIndexedDB()), settings, now: () => "2026-11-15T08:00:00.000Z" });

test("the CSV reader handles quotes, commas inside quotes and both line endings", () => {
  const parsed = parseCsv('a,b,c\r\n1,"two, with a comma","say ""hi"""\n4,,6\n');
  assert.deepEqual(parsed, [{ a: "1", b: "two, with a comma", c: 'say "hi"' }, { a: "4", b: "", c: "6" }]);
  assert.deepEqual(parseCsv(""), []);
});

test("the demo file has 120 rows for four synthetic astronauts", () => {
  assert.equal(rows.length, 120);
  assert.deepEqual(crewIds(rows), ["SYN-A", "SYN-B", "SYN-C", "SYN-D"]);
});

test("profiles are a local choice of astronaut: no name, no password", () => {
  const profiles = sampleProfiles(rows, settings, "2026-11-15T08:00:00.000Z");
  assert.deepEqual(profiles[1], { id: "SYN-B", label: "Astronaut B (synthetic)", createdAt: "2026-11-15T08:00:00.000Z", thresholdsVersion: "0.4.0" });
  assert.equal(profiles.length, 4);
});

test("720 sample readings, each one acceptable to the engine", () => {
  const readings = sampleReadings(rows, settings);
  assert.equal(readings.length, 720);
  assert.equal(new Set(readings.map((r) => r.id)).size, 720);
  for (const reading of readings) assert.deepEqual(checkReading(settings, reading), [], reading.id);
  const one = readings.find((r) => r.id === "sample-SYN-B-13-blood_pressure");
  assert.deepEqual(one, {
    id: "sample-SYN-B-13-blood_pressure", profileId: "SYN-B", indicator: "blood_pressure", date: "2026-10-27", time: "",
    symptoms: ["dizziness"], note: "Dizzy after standing; low BP reading (synthetic event)", createdAt: "",
    thresholdsVersion: "0.4.0", sample: true, day: 13, readings: [{ systolic: 92, diastolic: 58 }],
  });
  const kinds = (id) => readings.find((r) => r.id === id);
  assert.equal(kinds("sample-SYN-A-1-mood").kind, "tap");
  assert.equal(kinds("sample-SYN-A-1-blood_glucose").context, "before_meal");
  assert.equal(kinds("sample-SYN-A-1-blood_glucose").meter, "not recorded");
  assert.equal(kinds("sample-SYN-A-1-heart_rate").source, "not recorded");
  assert.equal(kinds("sample-SYN-A-1-body_temperature").method, "oral");
  assert.equal(kinds("sample-SYN-A-1-sleep_hours").note, "");
});

test("parity through the app's own loader: 720 of 720", () => {
  const readings = sampleReadings(rows, settings);
  const byId = new Map(readings.map((r) => [r.id, r]));
  const got = {};
  for (const result of judgeAll(settings, readings)) {
    const reading = byId.get(result.readingId);
    got[`${reading.profileId}|${reading.day}|${result.indicator}`] = result.status;
  }
  assert.deepEqual(got, expectedTable());
  assert.equal(Object.keys(got).length, 720);
});

test("first launch makes the four profiles and no readings", async () => {
  const o = await options();
  const profiles = await ensureProfiles(o);
  assert.deepEqual(profiles.map((p) => p.id), ["SYN-A", "SYN-B", "SYN-C", "SYN-D"]);
  assert.deepEqual(await o.store.getAllReadings(), []);
  assert.equal((await ensureProfiles({ ...o, fetchText: async () => { throw new Error("must not be read again"); } })).length, 4);
});

test("load sample data stores every reading on the device; loading twice changes nothing", async () => {
  const o = await options();
  assert.deepEqual(await loadSample(o), { rows: 120, readings: 720 });
  await loadSample(o);
  assert.equal((await o.store.getAllReadings()).length, 720);
  assert.equal((await o.store.getReadings("SYN-B")).length, 180);
  assert.equal((await o.store.getProfiles()).length, 4);
});

test("loading the sample keeps the astronaut's own readings; reset wipes them for all profiles", async () => {
  const o = await options();
  await loadSample(o);
  const own = { id: "r-own", profileId: "SYN-B", indicator: "sleep_hours", date: "2026-11-15", time: "07:00", symptoms: [], note: "", value: 4.5, thresholdsVersion: "0.4.0" };
  await o.store.putReading(own);
  await o.store.putReading({ ...own, id: "r-other", profileId: "SYN-C" });
  await o.store.deleteReading("sample-SYN-A-1-mood");
  await loadSample(o);
  assert.equal((await o.store.getAllReadings()).length, 722);

  assert.deepEqual(await resetToSample(o), { rows: 120, readings: 720 });
  const after = await o.store.getAllReadings();
  assert.equal(after.length, 720);
  assert.ok(after.every((r) => r.sample === true));
  assert.equal((await o.store.getProfiles()).length, 4, "profiles are kept");
});
