// The settings layer: checking, loading, caching and versions (D-46).
import test from "node:test";
import assert from "node:assert/strict";
import { SETTINGS_PATH, SettingsError, compareVersions, loadSettings, settingsByVersion, validateSettings } from "../app/js/settings.js";
import { openStore } from "../app/js/store.js";
import { judgeAll } from "../app/js/engine.js";
import { clone, loadThresholds } from "./helpers/files.js";
import { createFakeIndexedDB } from "./helpers/fake-indexeddb.js";

const settings = loadThresholds();
const freshStore = () => openStore(createFakeIndexedDB());

test("the threshold file in app/data passes the check", () => {
  const checked = validateSettings(settings);
  assert.deepEqual(checked.problems, []);
  assert.equal(checked.ok, true);
});

test("a broken file is refused, with the reason", () => {
  const cases = [
    ["not an object", () => null, /not a JSON object/],
    ["no version", (s) => { delete s.meta.version; }, /meta\.version/],
    ["no status levels", (s) => { delete s.meta.status_levels; }, /status_levels/],
    ["no indicators", (s) => { s.indicators = []; }, /no indicators/],
    ["a gap between bands", (s) => { s.indicators[0].bands[1].min = 61; }, /heart_rate band 2: a gap or an overlap/],
    ["an overlap between bands", (s) => { s.indicators[0].bands[1].min = 59; }, /heart_rate band 2: a gap or an overlap/],
    ["an unknown status", (s) => { s.indicators[0].bands[0].status = "purple"; }, /unknown status "purple"/],
    ["a band without sources", (s) => { delete s.indicators[4].bands[0].sources; }, /sleep_hours band 1: no sources/],
    ["no limits", (s) => { delete s.indicators[3].plausible_range; }, /body_temperature: no usable plausible_range/],
    ["no limits for one part", (s) => { delete s.indicators[1].plausible_range.diastolic; }, /blood_pressure diastolic: no usable plausible_range/],
    ["a rule parameter that is not a number", (s) => { s.indicators[0].baseline_rule.min_readings = "seven"; }, /baseline_rule: min_readings/],
    ["a pattern for an unknown indicator", (s) => { s.pattern_rules[0].indicator = "naps"; }, /unknown indicator "naps"/],
    ["a pattern with an unknown test", (s) => { s.pattern_rules[0].test = "sometimes"; }, /unknown test "sometimes"/],
    ["a pattern without its count", (s) => { delete s.pattern_rules[1].count; }, /mood_low_two_days: count/],
    ["no resolution", (s) => { s.indicators[2].resolution = 0; }, /blood_glucose: no usable resolution/],
    ["an indicator listed twice", (s) => { s.indicators.push(clone(s.indicators[0])); }, /heart_rate: listed twice/],
    ["low reading without its limit", (s) => { delete s.indicators[1].low_reading.systolic_max; }, /low_reading: systolic_max/],
    ["weekly questions missing", (s) => { s.indicators[5].weekly_phq2.questions = []; }, /weekly_phq2: no questions/],
  ];
  for (const [name, breakIt, expected] of cases) {
    const copy = clone(settings);
    const broken = breakIt(copy) === null ? null : copy;
    const checked = validateSettings(broken);
    assert.equal(checked.ok, false, name);
    assert.ok(checked.problems.some((problem) => expected.test(problem)), `${name}: ${checked.problems.join("; ")}`);
  }
});

test("versions are compared part by part", () => {
  assert.equal(compareVersions("0.4.0", "0.4.0"), 0);
  assert.equal(compareVersions("0.4.0", "0.10.0"), -1);
  assert.equal(compareVersions("1.0.0", "0.10.0"), 1);
  assert.equal(compareVersions("0.4", "0.4.1"), -1);
});

test("first load: the file is read from the app's own folder and a copy is stored (D-46)", async () => {
  const store = await freshStore();
  const asked = [];
  const loaded = await loadSettings({ fetchJson: async (path) => { asked.push(path); return clone(settings); }, store, now: () => "2026-11-15T08:00:00.000Z" });
  assert.deepEqual(asked, [SETTINGS_PATH]);
  assert.equal(SETTINGS_PATH, "data/Indicator_Thresholds.json");
  assert.equal(loaded.source, "file");
  assert.equal(loaded.version, "0.4.0");
  const cached = await store.getSettings("0.4.0");
  assert.equal(cached.loadedAt, "2026-11-15T08:00:00.000Z");
  assert.deepEqual(cached.json, settings);
});

test("offline with no file: the stored copy is used", async () => {
  const store = await freshStore();
  await loadSettings({ fetchJson: async () => clone(settings), store });
  const loaded = await loadSettings({ fetchJson: async () => { throw new Error("offline"); }, store });
  assert.equal(loaded.source, "device");
  assert.deepEqual(loaded.settings, settings);
  assert.match(loaded.problems[0], /could not be read: offline/);
});

test("no file and no stored copy: the app refuses to judge and says so", async () => {
  const store = await freshStore();
  await assert.rejects(
    () => loadSettings({ fetchJson: async () => { throw new Error("offline"); }, store }),
    (error) => error instanceof SettingsError && /no copy is stored/.test(error.message),
  );
});

test("a broken file is not used and not stored; the stored copy is used", async () => {
  const store = await freshStore();
  await loadSettings({ fetchJson: async () => clone(settings), store });
  const broken = clone(settings);
  broken.meta.version = "0.5.0";
  broken.indicators[0].bands[1].min = 70;
  const loaded = await loadSettings({ fetchJson: async () => broken, store });
  assert.equal(loaded.source, "device");
  assert.equal(loaded.version, "0.4.0");
  assert.equal(await store.getSettings("0.5.0"), null);
  assert.ok(loaded.problems.length > 0);
});

test("a newer version is stored beside the old one, and old results keep their version", async () => {
  const store = await freshStore();
  await loadSettings({ fetchJson: async () => clone(settings), store });
  const newer = clone(settings);
  newer.meta.version = "0.5.0";
  const temperature = newer.indicators.find((i) => i.id === "body_temperature");
  temperature.bands[2].max = 36.9;
  temperature.bands[3].min = 37.0;
  const loaded = await loadSettings({ fetchJson: async () => newer, store });
  assert.equal(loaded.version, "0.5.0");
  assert.deepEqual((await store.listSettings()).map((entry) => entry.version).sort(), ["0.4.0", "0.5.0"]);

  const reading = (id, version) => ({ id, profileId: "SYN-A", indicator: "body_temperature", date: "2026-11-01", time: "", symptoms: [], value: 37.2, method: "oral", thresholdsVersion: version });
  const results = judgeAll(loaded.settings, [reading("old", "0.4.0"), reading("new", "0.5.0")], await settingsByVersion(store));
  const status = (id) => results.find((r) => r.readingId === id);
  assert.equal(status("old").status, "normal");
  assert.equal(status("old").thresholdsVersion, "0.4.0");
  assert.equal(status("new").status, "warning");
  assert.equal(status("new").thresholdsVersion, "0.5.0");

  const offline = await loadSettings({ fetchJson: async () => { throw new Error("offline"); }, store });
  assert.equal(offline.version, "0.5.0", "offline, the newest stored copy is used");
});
