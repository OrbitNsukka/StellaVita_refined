// The status engine: band edges, rounding, symptoms, personal range, patterns,
// mood, temperature method, purity. Tests may quote numbers; the app may not.
import test from "node:test";
import assert from "node:assert/strict";
import * as engine from "../app/js/engine.js";
import { clone, loadThresholds, readText } from "./helpers/files.js";

const settings = loadThresholds();
const ind = (id) => engine.indicatorOf(settings, id);
let nextId = 0;

function reading(indicator, extra = {}) {
  nextId += 1;
  return { id: `t-${nextId}`, profileId: "SYN-T", indicator, date: "2026-11-01", time: "08:00", symptoms: [], ...extra };
}
const hr = (value, extra) => reading("heart_rate", { value, ...extra });
const bp = (systolic, diastolic, extra) => reading("blood_pressure", { readings: [{ systolic, diastolic }], ...extra });
const sugar = (value, extra) => reading("blood_glucose", { value, context: "before_meal", ...extra });
const temp = (value, extra) => reading("body_temperature", { value, method: "oral", ...extra });
const sleep = (value, extra) => reading("sleep_hours", { value, ...extra });
const tap = (value, extra) => reading("mood", { value, kind: "tap", ...extra });
const phq = (items, extra) => reading("mood", { items, kind: "phq2", ...extra });
const judge = (r, earlier) => engine.judgeReading(settings, r, earlier);
const day = (n) => `2026-11-${String(n).padStart(2, "0")}`;

// ---------- band edges ----------

function bandLists() {
  const lists = [];
  for (const indicator of settings.indicators) {
    const parts = engine.partsOf(indicator);
    if (parts) {
      for (const part of parts) lists.push({ indicator, part, bands: indicator.bands[part], name: `${indicator.id}.${part}` });
    } else {
      lists.push({ indicator, bands: indicator.bands, name: indicator.id });
    }
    if (indicator.weekly_phq2) lists.push({ indicator, bands: indicator.weekly_phq2.bands, name: `${indicator.id}.weekly_phq2`, weekly: true });
  }
  return lists;
}

test("every band edge in the file is tested on both sides", () => {
  let edges = 0;
  for (const { indicator, bands, name } of bandLists()) {
    const step = indicator.resolution;
    bands.forEach((band, index) => {
      if (band.max !== undefined) {
        edges += 1;
        const at = engine.roundToResolution(band.max, step);
        const over = engine.roundToResolution(band.max + step, step);
        assert.equal(engine.findBand(bands, at), band, `${name}: ${at} belongs to "${band.label}"`);
        const next = engine.findBand(bands, over);
        if (index < bands.length - 1) {
          assert.equal(next, bands[index + 1], `${name}: ${over} belongs to the next band`);
        } else {
          assert.equal(next, null, `${name}: ${over} is above the last band`);
        }
      }
      if (band.min !== undefined) {
        edges += 1;
        const at = engine.roundToResolution(band.min, step);
        const under = engine.roundToResolution(band.min - step, step);
        assert.equal(engine.findBand(bands, at), band, `${name}: ${at} belongs to "${band.label}"`);
        const previous = engine.findBand(bands, under);
        if (index > 0) {
          assert.equal(previous, bands[index - 1], `${name}: ${under} belongs to the band before`);
        } else {
          assert.equal(previous, null, `${name}: ${under} is below the first band`);
        }
      }
    });
  }
  assert.equal(edges, 38, "the number of band edges in v0.4.0");
});

test("band edges through the whole judgement: the brief's examples", () => {
  assert.equal(judge(bp(129, 70)).status, "normal");
  assert.equal(judge(bp(130, 70)).status, "warning");
  assert.equal(judge(bp(180, 70)).status, "warning");
  assert.equal(judge(bp(181, 70)).status, "contact");
  assert.equal(judge(bp(110, 79)).status, "normal");
  assert.equal(judge(bp(110, 80)).status, "warning");
  assert.equal(judge(bp(110, 120)).status, "warning");
  assert.equal(judge(bp(110, 121)).status, "contact");
  assert.equal(judge(temp(37.4)).status, "normal");
  assert.equal(judge(temp(37.5)).status, "warning");
  assert.equal(judge(temp(39.3)).status, "warning");
  assert.equal(judge(temp(39.4)).status, "contact");
  assert.equal(judge(temp(36.0)).status, "normal");
  assert.equal(judge(temp(35.9)).status, "warning");
  assert.equal(judge(temp(35.0)).status, "warning");
  assert.equal(judge(temp(34.9)).status, "contact");
  assert.equal(judge(sugar(53)).status, "contact");
  assert.equal(judge(sugar(54)).status, "warning");
  assert.equal(judge(sugar(69)).status, "warning");
  assert.equal(judge(sugar(70)).status, "normal");
  assert.equal(judge(sugar(99)).status, "normal");
  assert.equal(judge(sugar(100)).status, "warning");
  assert.equal(judge(sugar(250)).status, "warning");
  assert.equal(judge(sugar(251)).status, "contact");
  assert.equal(judge(hr(59)).status, "warning");
  assert.equal(judge(hr(60)).status, "normal");
  assert.equal(judge(hr(100)).status, "normal");
  assert.equal(judge(hr(101)).status, "warning");
  assert.equal(judge(sleep(6.9)).status, "warning");
  assert.equal(judge(sleep(7.0)).status, "normal");
  assert.equal(judge(phq([1, 1])).status, "normal");
  assert.equal(judge(phq([2, 1])).status, "warning");
});

test("every whole-range value lands in exactly one band", () => {
  for (const { indicator, bands, name, weekly, part } of bandLists()) {
    const range = weekly ? indicator.weekly_phq2.plausible_range : engine.rangeOf(indicator, { part });
    const step = indicator.resolution;
    const count = Math.round((range.max - range.min) / step);
    for (let i = 0; i <= count; i += 1) {
      const value = engine.roundToResolution(range.min + i * step, step);
      const holding = bands.filter((band) => (band.min ?? -Infinity) - 1e-9 <= value && value <= (band.max ?? Infinity) + 1e-9);
      assert.equal(holding.length, 1, `${name}: ${value} is held by ${holding.length} bands`);
    }
  }
});

// ---------- rounding ----------

test("rounds to the indicator's resolution, an exact half to the even neighbour", () => {
  assert.equal(engine.roundToResolution(100.5, 1), 100);
  assert.equal(engine.roundToResolution(101.5, 1), 102);
  assert.equal(engine.roundToResolution(59.4, 1), 59);
  assert.equal(engine.roundToResolution(59.6, 1), 60);
  assert.equal(engine.roundToResolution(37.44, 0.1), 37.4);
  assert.equal(engine.roundToResolution(37.46, 0.1), 37.5);
  assert.equal(engine.roundToResolution(0.5, 1), 0);
  assert.equal(engine.roundToResolution(1.5, 1), 2);
  assert.equal(engine.roundToResolution(-1.5, 1), -2);
  assert.equal(engine.decimalsOf(0.1), 1);
  assert.equal(engine.decimalsOf(1), 0);
  assert.equal(judge(hr(100.4)).status, "normal");
  assert.equal(judge(hr(100.6)).status, "warning");
  assert.equal(judge(temp(37.44)).status, "normal");
  assert.equal(judge(temp(37.46)).status, "warning");
  assert.equal(judge(temp(39.36)).value, 39.4);
});

// ---------- the result format ----------

test("a result has the Interface contract's fields, read from the band", () => {
  const r = judge(temp(39.5));
  assert.equal(r.indicator, "body_temperature");
  assert.equal(r.value, 39.5);
  assert.equal(r.unit, "Celsius");
  assert.equal(r.status, "contact");
  assert.equal(r.reason, "39.4 or higher");
  assert.deepEqual(r.source_ids, ["S-27"]);
  assert.equal(r.rule, "band");
  assert.equal(r.thresholdsVersion, "0.4.0");
  assert.ok(r.readingId);
  assert.deepEqual(r.notes, ["S-27: call a provider above 39.4"]);
});

// ---------- blood pressure ----------

test("blood pressure: each part is judged separately and the worse is taken", () => {
  const both = judge(bp(120, 70));
  assert.equal(both.status, "normal");
  assert.equal(both.value, "120/70");
  assert.equal(both.reason, "systolic: Under 130; diastolic: Under 80");
  const dia = judge(bp(120, 85));
  assert.equal(dia.status, "warning");
  assert.equal(dia.reason, "diastolic: 80 to 120");
  const sys = judge(bp(185, 85));
  assert.equal(sys.status, "contact");
  assert.equal(sys.reason, "systolic: Above 180");
  assert.deepEqual(sys.source_ids, ["S-140", "S-20", "S-21"]);
});

test("blood pressure: the latest of the two readings is judged (D-49)", () => {
  const r = reading("blood_pressure", { readings: [{ systolic: 185, diastolic: 70 }, { systolic: 118, diastolic: 72 }] });
  assert.equal(judge(r).status, "normal");
  assert.equal(judge(r).value, "118/72");
  const other = reading("blood_pressure", { readings: [{ systolic: 118, diastolic: 72 }, { systolic: 185, diastolic: 70 }] });
  assert.equal(judge(other).status, "contact");
});

test("low blood pressure turns amber only with dizziness or fainting", () => {
  const fine = judge(bp(90, 58));
  assert.equal(fine.status, "normal");
  assert.ok(fine.notes.includes("low reading, recheck after fluids and rest"));
  const dizzy = judge(bp(92, 58, { symptoms: ["dizziness"] }));
  assert.equal(dizzy.status, "warning");
  assert.equal(dizzy.rule, "symptom");
  assert.deepEqual(dizzy.source_ids, ["S-130"]);
  assert.match(dizzy.reason, /^systolic 90 or lower, or diastolic 60 or lower/);
  assert.equal(judge(bp(90, 70, { symptoms: ["fainting"] })).status, "warning");
  assert.equal(judge(bp(91, 61, { symptoms: ["dizziness"] })).status, "normal", "not low: symptoms change nothing");
  assert.equal(judge(bp(91, 61)).notes.length, 0);
});

test("blood pressure: emergency symptoms are red at any reading", () => {
  for (const symptom of ["chest pain", "breathlessness", "numbness", "vision change", "trouble speaking"]) {
    const r = judge(bp(118, 72, { symptoms: [symptom] }));
    assert.equal(r.status, "contact", symptom);
    assert.equal(r.rule, "symptom");
    assert.deepEqual(r.source_ids, ["S-21"]);
    assert.equal(r.reason, symptom);
  }
  const standing = judge(bp(118, 72, { symptoms: ["systolic drop of 20 mmHg or more on standing, with dizziness"] }));
  assert.equal(standing.status, "warning");
});

// ---------- symptoms ----------

test("heart rate: symptoms make red only when the rate's own band is amber", () => {
  assert.equal(judge(hr(72, { symptoms: ["dizziness"] })).status, "normal");
  const low = judge(hr(52, { symptoms: ["dizziness"] }));
  assert.equal(low.status, "contact");
  assert.equal(low.rule, "symptom");
  assert.deepEqual(low.source_ids, ["S-22", "S-23"], "a rule without sources uses the indicator's source keys");
  assert.equal(judge(hr(120, { symptoms: ["chest pain"] })).status, "contact");
  assert.equal(judge(hr(120)).status, "warning", "no number alone is red");
  assert.equal(judge(hr(240)).status, "warning");
});

test("blood sugar: confusion is red at any reading; shaky or sweaty is amber", () => {
  assert.equal(judge(sugar(85, { symptoms: ["confusion"] })).status, "contact");
  assert.equal(judge(sugar(85, { symptoms: ["shaky"] })).status, "warning");
  assert.equal(judge(sugar(85, { symptoms: ["sweaty"] })).status, "warning");
  assert.equal(judge(sugar(52, { symptoms: ["shaky"] })).status, "contact", "symptoms never lower a status");
  assert.equal(judge(sugar(85, { symptoms: ["dizziness"] })).status, "normal", "a symptom of another indicator changes nothing");
});

test("symptoms can only raise a status", () => {
  for (const make of [hr, sugar, temp, sleep]) {
    for (const value of [40, 65, 130, 300]) {
      const plain = judge(make(value));
      const allSymptoms = settings.indicators.flatMap((i) => (i.symptom_rules ?? []).flatMap((rule) => rule.symptoms));
      const withAll = judge(make(value, { symptoms: allSymptoms }));
      assert.ok(engine.rankOf(settings, withAll.status) >= engine.rankOf(settings, plain.status));
    }
  }
});

// ---------- personal range ----------

function history(values, startDay = 1) {
  return values.map((value, index) => hr(value, { date: day(startDay + index) }));
}

test("personal range: below 60 is green when the median of the previous readings is below 60 and near", () => {
  const earlier = history([56, 57, 58, 55, 56, 57, 58]);
  const r = judge(hr(55, { date: day(8) }), earlier);
  assert.equal(r.status, "normal");
  assert.equal(r.rule, "personal_range");
  assert.equal(r.reason, "inside your usual range");
  assert.deepEqual(r.source_ids, ["S-22", "team choice, signed by the team leader (D-39)"]);
});

test("personal range: needs at least 7 earlier readings", () => {
  const six = history([56, 57, 58, 55, 56, 57]);
  assert.equal(judge(hr(55, { date: day(7) }), six).status, "warning");
  const seven = history([56, 57, 58, 55, 56, 57, 56]);
  assert.equal(judge(hr(55, { date: day(8) }), seven).status, "normal");
});

test("personal range: the reading must be within 10 bpm of the median", () => {
  const earlier = history([58, 58, 58, 58, 58, 58, 58]);
  assert.equal(judge(hr(48, { date: day(8) }), earlier).status, "normal");
  assert.equal(judge(hr(47, { date: day(8) }), earlier).status, "warning");
});

test("personal range: the median itself must be below 60", () => {
  const earlier = history([60, 61, 62, 60, 61, 62, 63]);
  assert.equal(judge(hr(58, { date: day(8) }), earlier).status, "warning");
  const edge = history([59, 59, 59, 59, 61, 61, 61, 61]);
  assert.equal(judge(hr(58, { date: day(9) }), edge).status, "warning", "a median of exactly 60 is not below 60");
});

test("personal range: only the previous 14 readings count", () => {
  const old = history([50, 50, 50, 50, 50, 50, 50, 50, 50, 50], 1);
  const recent = history([70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70], 11);
  assert.equal(judge(hr(58, { date: day(25) }), [...old, ...recent]).status, "warning");
});

test("personal range never lowers a reading above 100, and symptoms can still raise", () => {
  const earlier = history([56, 57, 58, 55, 56, 57, 58]);
  assert.equal(judge(hr(104, { date: day(8) }), earlier).status, "warning");
  const withSymptom = judge(hr(55, { date: day(8), symptoms: ["dizziness"] }), earlier);
  assert.equal(withSymptom.status, "contact", "the rate's own band is amber, so the symptom rule applies");
});

// ---------- patterns ----------

test("sleep: 6 hours or less on 3 nights in a row is red on the third night", () => {
  const a = sleep(5.4, { date: day(1) });
  const b = sleep(6.0, { date: day(2) });
  const c = sleep(5.2, { date: day(3) });
  assert.equal(judge(a, []).status, "warning");
  assert.equal(judge(b, [a]).status, "warning");
  const third = judge(c, [a, b]);
  assert.equal(third.status, "contact");
  assert.equal(third.rule, "pattern");
  assert.equal(third.reason, "6 hours or less on 3 nights in a row");
  assert.deepEqual(third.source_ids, ["S-28", "D-19"]);
  assert.equal(third.also[0].reason, "Under 7");
});

test("sleep: 6.1 hours does not count, and a missing day breaks the run", () => {
  const a = sleep(5.4, { date: day(1) });
  const mid = sleep(6.1, { date: day(2) });
  assert.equal(judge(sleep(5.2, { date: day(3) }), [a, mid]).status, "warning");
  const b = sleep(5.0, { date: day(2) });
  assert.equal(judge(sleep(5.2, { date: day(4) }), [a, b]).status, "warning", "day 3 has no reading");
  assert.equal(judge(sleep(8.0, { date: day(3) }), [a, b]).status, "normal", "the reading itself must meet the test");
});

test("mood: a single tap never sets a colour; two low days in a row are amber", () => {
  for (const value of [1, 2, 3, 4, 5]) {
    const r = judge(tap(value));
    assert.equal(r.status, "normal");
    assert.equal(r.reason, "trend only");
    assert.equal(r.rule, "band");
  }
  const first = tap(2, { date: day(1) });
  const second = judge(tap(1, { date: day(2) }), [first]);
  assert.equal(second.status, "warning");
  assert.equal(second.reason, "Tap of 2 or lower on 2 days in a row");
  assert.equal(judge(tap(3, { date: day(2) }), [first]).status, "normal");
  assert.equal(judge(tap(2, { date: day(3) }), [first]).status, "normal", "not in a row");
});

test("mood: 5 low days in the last 7 are amber even when not in a row", () => {
  const lowDays = [1, 3, 5, 7].map((n) => tap(2, { date: day(n) }));
  const okDays = [2, 4, 6, 8].map((n) => tap(4, { date: day(n) }));
  const earlier = engine.sortReadings([...lowDays, ...okDays]);
  const fifth = judge(tap(2, { date: day(9) }), earlier);
  assert.equal(fifth.status, "normal", "only 4 low days fall inside the 7 days that end on day 9");
  const dense = [1, 2, 4, 5].map((n) => tap(2, { date: day(n) }));
  const hit = judge(tap(2, { date: day(7) }), dense);
  assert.equal(hit.status, "warning");
  assert.equal(hit.reason, "Tap of 2 or lower on 5 of the last 7 days");
  const edge = judge(tap(2, { date: day(8) }), dense);
  assert.equal(edge.status, "normal", "day 1 is now outside the window");
});

test("mood patterns use the daily taps only", () => {
  const first = tap(2, { date: day(1) });
  const weekly = judge(phq([0, 0], { date: day(2) }), [first]);
  assert.equal(weekly.status, "normal");
  const weeklyBefore = phq([3, 3], { date: day(1) });
  assert.equal(judge(tap(2, { date: day(2) }), [weeklyBefore]).status, "normal");
});

test("blood sugar: 126 or higher on 2 days within a week is reported", () => {
  const first = sugar(130, { date: day(1) });
  const within = judge(sugar(126, { date: day(7) }), [first]);
  assert.equal(within.status, "warning");
  assert.equal(within.rule, "pattern");
  assert.equal(within.reason, "126 or higher on 2 days within a week: report it");
  assert.equal(within.also[0].reason, "126 to 250");
  const outside = judge(sugar(126, { date: day(8) }), [first]);
  assert.equal(outside.rule, "band");
  const sameDay = judge(sugar(128, { date: day(1), time: "12:00" }), [first]);
  assert.equal(sameDay.rule, "band", "two readings on one day are one day");
  assert.equal(judge(sugar(125, { date: day(2) }), [first]).rule, "band");
});

test("blood pressure: 140/90 or more on 2 days within a week, and still present a week later", () => {
  const first = bp(142, 85, { date: day(1) });
  const second = judge(bp(120, 90, { date: day(4) }), [first]);
  assert.equal(second.rule, "pattern");
  assert.equal(second.reason, "140/90 or more on 2 days within a week: report it");
  assert.equal(second.status, "warning");
  const weekLater = judge(bp(141, 80, { date: day(8) }), [first]);
  assert.equal(weekLater.reason, "140/90 or more still present a week after an earlier one");
  assert.equal(judge(bp(141, 80, { date: day(15) }), [first]).rule, "pattern", "14 days back is still inside the look-back");
  assert.equal(judge(bp(141, 80, { date: day(16) }), [first]).rule, "band", "15 days back is not");
  assert.equal(judge(bp(139, 89, { date: day(4) }), [first]).rule, "band", "below 140/90 fires nothing");
});

test("a pattern never fires from later readings or from another astronaut", () => {
  const a = sleep(5.0, { date: day(1) });
  const b = sleep(5.0, { date: day(2) });
  const c = sleep(5.0, { date: day(3) });
  const other = [sleep(5.0, { date: day(1), profileId: "SYN-X" }), sleep(5.0, { date: day(2), profileId: "SYN-X" })];
  const results = engine.judgeAll(settings, [c, b, a, ...other]);
  const of = (r) => results.find((x) => x.readingId === r.id).status;
  assert.equal(of(a), "warning");
  assert.equal(of(b), "warning");
  assert.equal(of(c), "contact");
  assert.equal(of(other[1]), "warning");
});

// ---------- mood, weekly and distress ----------

test("weekly PHQ-2 has its own bands", () => {
  const ok = judge(phq([1, 1]));
  assert.equal(ok.status, "normal");
  assert.equal(ok.value, 2);
  assert.equal(ok.reason, "0 to 2");
  assert.deepEqual(ok.source_ids, ["S-135", "S-30"]);
  assert.equal(ok.kind, "phq2");
  const high = judge(phq([3, 3]));
  assert.equal(high.status, "warning");
  assert.equal(high.value, 6);
  assert.equal(high.reason, "3 to 6");
  assert.deepEqual(high.notes, ["Raise at the next medical conference (S-135, research brief)"]);
});

test("a distress mark is red at once", () => {
  const r = judge(reading("mood", { kind: "distress", marked: true }));
  assert.equal(r.status, "contact");
  assert.equal(r.rule, "symptom");
  assert.equal(r.reason, "severe distress or unable to continue (marked by the astronaut)");
  assert.deepEqual(r.source_ids, ["S-135", "S-30"]);
  assert.equal(r.value, null);
  assert.equal(r.kind, "distress");
});

test("mood units are told apart by the kind of entry", () => {
  assert.equal(judge(tap(4)).unit, "1-5 tap (daily)");
  assert.equal(judge(phq([0, 1])).unit, "PHQ-2 total 0-6 (weekly)");
});

// ---------- temperature by another method ----------

test("a temperature taken by another method is stored and not compared (D-35)", () => {
  const r = judge(temp(39.9, { method: "forehead" }));
  assert.equal(r.status, "not_judged");
  assert.equal(r.reason, "not compared: taken by another method");
  assert.equal(r.rule, "not_compared");
  assert.equal(r.value, 39.9);
  assert.deepEqual(r.source_ids, []);
  assert.equal(engine.rankOf(settings, r.status), -1, "not_judged is not one of the file's colours");
});

test("the agreed method is read from the file when it has a field for it", () => {
  const copy = clone(settings);
  engine.indicatorOf(copy, "body_temperature").judged_method = "forehead";
  assert.equal(engine.judgeReading(copy, temp(39.9, { method: "forehead" })).status, "contact");
  assert.equal(engine.judgeReading(copy, temp(39.9, { method: "oral" })).status, "not_judged");
});

// ---------- rule 1 ----------

test("checkReading: missing, not a number and impossible values are named", () => {
  const check = (r) => engine.checkReading(settings, r).map((p) => `${p.field}:${p.problem}`);
  assert.deepEqual(check(hr(72)), []);
  assert.deepEqual(check(hr(null)), ["value:missing"]);
  assert.deepEqual(check(hr(Number.NaN)), ["value:not_a_number"]);
  assert.deepEqual(check(hr("72")), ["value:not_a_number"]);
  assert.deepEqual(check(hr(19)), ["value:outside_range"]);
  assert.deepEqual(check(hr(20)), []);
  assert.deepEqual(check(hr(250)), []);
  assert.deepEqual(check(hr(251)), ["value:outside_range"]);
  assert.deepEqual(check(bp(49, 29)), ["readings.0.systolic:outside_range", "readings.0.diastolic:outside_range"]);
  assert.deepEqual(check(bp(50, 30)), []);
  assert.deepEqual(check(bp(260, 160)), []);
  assert.deepEqual(check(bp(261, 161)), ["readings.0.systolic:outside_range", "readings.0.diastolic:outside_range"]);
  assert.deepEqual(check(sugar(19)), ["value:outside_range"]);
  assert.deepEqual(check(sugar(601)), ["value:outside_range"]);
  assert.deepEqual(check(temp(29.9)), ["value:outside_range"]);
  assert.deepEqual(check(temp(43.1)), ["value:outside_range"]);
  assert.deepEqual(check(sleep(-0.1)), ["value:outside_range"]);
  assert.deepEqual(check(sleep(24.1)), ["value:outside_range"]);
  assert.deepEqual(check(sleep(0)), []);
  assert.deepEqual(check(tap(0)), ["value:off_scale"]);
  assert.deepEqual(check(tap(6)), ["value:off_scale"]);
  assert.deepEqual(check(phq([0, 3])), []);
  assert.deepEqual(check(phq([0, 4])), ["items.1:off_scale"]);
  assert.deepEqual(check(phq([1])), ["items.1:missing"]);
  assert.deepEqual(check(phq([1.5, 1])), ["items.0:off_scale"]);
  assert.deepEqual(check(reading("mood", { kind: "distress", marked: true })), []);
});

test("checkReading: blood sugar is accepted only before a meal (D-23)", () => {
  const check = (r) => engine.checkReading(settings, r).map((p) => `${p.field}:${p.problem}`);
  assert.deepEqual(check(sugar(90)), []);
  assert.deepEqual(check(sugar(90, { context: "after_meal" })), ["context:context_refused"]);
  assert.deepEqual(check(sugar(90, { context: "" })), ["context:missing"]);
});

// ---------- the checklist ----------

test("the symptom checklist is the file's symptom lists (D-51)", () => {
  assert.deepEqual(engine.symptomChecklist(ind("heart_rate")), ind("heart_rate").symptom_rules[0].symptoms);
  assert.deepEqual(engine.symptomChecklist(ind("blood_pressure")), [
    "chest pain", "breathlessness", "numbness", "vision change", "trouble speaking",
    "systolic drop of 20 mmHg or more on standing, with dizziness", "dizziness", "fainting",
  ]);
  assert.deepEqual(engine.symptomChecklist(ind("blood_glucose")), ["confusion", "shaky", "sweaty"]);
  assert.deepEqual(engine.symptomChecklist(ind("body_temperature")), []);
  assert.deepEqual(engine.symptomChecklist(ind("sleep_hours")), []);
  assert.deepEqual(engine.symptomChecklist(ind("mood"), "tap"), [], "the distress mark is a button, not a tick box");
});

// ---------- no hard-coding ----------

test("no hard-coding: changing a band in a copy of the file changes the result", () => {
  const copy = clone(settings);
  const bands = engine.indicatorOf(copy, "body_temperature").bands;
  bands[2].max = 36.9;
  bands[3].min = 37.0;
  bands[3].label = "37.0 to 39.3 (test)";
  bands[3].sources = ["S-TEST"];
  const before = judge(temp(37.2));
  const after = engine.judgeReading(copy, temp(37.2));
  assert.equal(before.status, "normal");
  assert.equal(after.status, "warning");
  assert.equal(after.reason, "37.0 to 39.3 (test)");
  assert.deepEqual(after.source_ids, ["S-TEST"]);
});

test("no hard-coding: changing a limit, a rule, a status order or a version changes the result", () => {
  const copy = clone(settings);
  copy.meta.version = "9.9.9";
  engine.indicatorOf(copy, "heart_rate").plausible_range.min = 40;
  assert.equal(engine.checkReading(copy, hr(30))[0].problem, "outside_range");
  assert.equal(engine.checkReading(settings, hr(30)).length, 0);
  assert.equal(engine.judgeReading(copy, hr(70)).thresholdsVersion, "9.9.9");

  const rule = copy.pattern_rules.find((r) => r.id === "sleep_short_nights");
  rule.count = 2;
  rule.value = 6.5;
  rule.label = "test label";
  const a = sleep(6.4, { date: day(1) });
  assert.equal(engine.judgeReading(copy, sleep(6.3, { date: day(2) }), [a]).reason, "test label");
  assert.equal(judge(sleep(6.3, { date: day(2) }), [a]).status, "warning");

  const base = engine.indicatorOf(copy, "heart_rate").baseline_rule;
  base.min_readings = 2;
  base.within_bpm = 1;
  const few = history([55, 55]);
  assert.equal(engine.judgeReading(copy, hr(54, { date: day(3) }), few).status, "normal");
  assert.equal(engine.judgeReading(copy, hr(53, { date: day(3) }), few).status, "warning");

  const low = engine.indicatorOf(copy, "blood_pressure").low_reading;
  low.with_symptoms = ["numbness in the test"];
  low.with_symptoms_status = "contact";
  assert.equal(engine.judgeReading(copy, bp(88, 58, { symptoms: ["numbness in the test"] })).status, "contact");
  assert.equal(engine.judgeReading(copy, bp(88, 58, { symptoms: ["dizziness"] })).status, "normal");

  engine.indicatorOf(copy, "blood_glucose").accepted_contexts = ["after_meal"];
  assert.deepEqual(engine.checkReading(copy, sugar(90, { context: "after_meal" })), []);
});

// ---------- purity ----------

test("the engine is pure: no imports, no browser calls, no storage", () => {
  const source = readText("app", "js", "engine.js");
  assert.doesNotMatch(source, /^\s*import\s/m);
  assert.doesNotMatch(source, /\bimport\s*\(/);
  for (const name of ["window", "document", "navigator", "localStorage", "sessionStorage", "indexedDB", "fetch", "caches", "self", "globalThis", "console", "XMLHttpRequest"]) {
    assert.doesNotMatch(source, new RegExp(`\\b${name}\\b`), `engine.js must not use ${name}`);
  }
});

test("the engine names no status of the file: the order comes from meta.status_levels", () => {
  const source = readText("app", "js", "engine.js");
  for (const status of settings.meta.status_levels) {
    assert.doesNotMatch(source, new RegExp(`["'\`]${status}["'\`]`), `engine.js must not type "${status}"`);
  }
  const copy = clone(settings);
  copy.meta.status_levels = ["contact", "warning", "normal"];
  const r = engine.judgeReading(copy, bp(185, 70));
  assert.equal(r.status, "normal", "with the order reversed, the other part's band is now the worse one");
});
