// Input safety (brief section 11): missing, non-numeric and impossible values
// ask again; the same impossible value twice is accepted; after-meal sugar is refused.
import test from "node:test";
import assert from "node:assert/strict";
import { ENTRY_PROBLEMS, NOTE_MAX, NOT_RECORDED, OUTCOMES, createGate, fieldsFor, isDate, isTime, parseNumber, phq2Answers, prepareReading } from "../app/js/entry.js";
import { indicatorOf, judgeReading } from "../app/js/engine.js";
import { clone, loadThresholds } from "./helpers/files.js";

const settings = loadThresholds();
const context = { today: "2026-11-15", now: new Date("2026-11-15T09:30:00.000Z"), makeId: () => "r-test" };
const base = { profileId: "SYN-B", date: "2026-11-15", time: "09:30", symptoms: [], note: "" };
const draft = (indicator, extra) => ({ ...base, indicator, ...extra });
const hr = (value, extra) => draft("heart_rate", { value, source: "device", ...extra });
const bp = (a, b, extra) => draft("blood_pressure", { readings: [{ systolic: a[0], diastolic: a[1] }, { systolic: b[0], diastolic: b[1] }], ...extra });
const sugar = (value, extra) => draft("blood_glucose", { value, context: "before_meal", meter: "Meter one", ...extra });
const temp = (value, extra) => draft("body_temperature", { value, method: "oral", ...extra });
const sleep = (value, extra) => draft("sleep_hours", { value, ...extra });
const submit = (d, gate = createGate()) => gate.submit(settings, d, context);
const problemsOf = (outcome) => outcome.problems.map((p) => `${p.field}:${p.problem}`);

test("numbers are read from what was typed", () => {
  assert.equal(parseNumber("72"), 72);
  assert.equal(parseNumber(" 36.6 "), 36.6);
  assert.equal(parseNumber("36,6"), 36.6);
  assert.equal(parseNumber("-3"), -3);
  assert.equal(parseNumber(""), null);
  assert.equal(parseNumber("   "), null);
  assert.equal(parseNumber(null), null);
  assert.ok(Number.isNaN(parseNumber("seventy")));
  assert.ok(Number.isNaN(parseNumber("7 2")));
  assert.ok(Number.isNaN(parseNumber("1e3")));
  assert.ok(Number.isNaN(parseNumber("0x10")));
});

test("dates and times are checked", () => {
  assert.ok(isDate("2026-11-15"));
  assert.ok(!isDate("2026-02-30"));
  assert.ok(!isDate("15/11/2026"));
  assert.ok(isTime("00:00"));
  assert.ok(isTime("23:59"));
  assert.ok(!isTime("24:00"));
  assert.ok(!isTime("12:60"));
  assert.ok(!isTime("9:30"));
});

test("a good reading is accepted, with the data model's fields", () => {
  const out = submit(hr("58", { symptoms: ["dizziness", "not on the list"], note: "  after the shift  " }));
  assert.equal(out.outcome, OUTCOMES.accepted);
  assert.deepEqual(out.reading, {
    id: "r-test", profileId: "SYN-B", indicator: "heart_rate", date: "2026-11-15", time: "09:30",
    symptoms: ["dizziness"], note: "after the shift", createdAt: "2026-11-15T09:30:00.000Z",
    thresholdsVersion: "0.4.0", value: 58, source: "device",
  });
});

test("a missing value asks again, however often it is sent", () => {
  const gate = createGate();
  for (let i = 0; i < 3; i += 1) {
    const out = submit(hr(""), gate);
    assert.equal(out.outcome, OUTCOMES.askAgain);
    assert.deepEqual(problemsOf(out), ["value:missing"]);
    assert.equal(out.repeatAccepts, false);
    assert.equal(out.reading, null);
  }
});

test("a value that is not a number asks again, however often it is sent", () => {
  const gate = createGate();
  for (let i = 0; i < 3; i += 1) {
    const out = submit(hr("fast"), gate);
    assert.equal(out.outcome, OUTCOMES.askAgain);
    assert.deepEqual(problemsOf(out), ["value:not_a_number"]);
  }
});

test("an impossible value asks again; the same value twice in a row is accepted and judged (D-48)", () => {
  const gate = createGate();
  const first = submit(hr("300"), gate);
  assert.equal(first.outcome, OUTCOMES.askAgain);
  assert.deepEqual(problemsOf(first), ["value:outside_range"]);
  assert.equal(first.repeatAccepts, true);
  const second = submit(hr("300"), gate);
  assert.equal(second.outcome, OUTCOMES.accepted);
  assert.equal(second.reading.acceptedOutsideRange, true);
  assert.equal(second.reading.value, 300);
  assert.equal(judgeReading(settings, second.reading).status, "warning");
  const third = submit(hr("300"), gate);
  assert.equal(third.outcome, OUTCOMES.askAgain, "after an accepted entry the count starts again");
});

test("'twice in a row' means the same value: a different value in between starts again", () => {
  const gate = createGate();
  assert.equal(submit(hr("300"), gate).outcome, OUTCOMES.askAgain);
  assert.equal(submit(hr("301"), gate).outcome, OUTCOMES.askAgain);
  assert.equal(submit(hr("300"), gate).outcome, OUTCOMES.askAgain);
  assert.equal(submit(hr("300"), gate).outcome, OUTCOMES.accepted);
  const other = createGate();
  assert.equal(submit(hr("300"), other).outcome, OUTCOMES.askAgain);
  assert.equal(submit(hr("72"), other).outcome, OUTCOMES.accepted);
  assert.equal(submit(hr("300"), other).outcome, OUTCOMES.askAgain);
});

test("an impossible value is never accepted while something else is missing", () => {
  const gate = createGate();
  assert.equal(submit(hr("300", { date: "" }), gate).outcome, OUTCOMES.askAgain);
  const again = submit(hr("300", { date: "" }), gate);
  assert.equal(again.outcome, OUTCOMES.askAgain);
  assert.deepEqual(problemsOf(again), ["date:missing", "value:outside_range"]);
});

test("each indicator has its own limits, read from the file", () => {
  assert.deepEqual(problemsOf(submit(sugar("19"))), ["value:outside_range"]);
  assert.deepEqual(problemsOf(submit(temp("44"))), ["value:outside_range"]);
  assert.deepEqual(problemsOf(submit(sleep("25"))), ["value:outside_range"]);
  assert.deepEqual(problemsOf(submit(bp([300, 80], [120, 80]))), ["readings.0.systolic:outside_range"]);
  const copy = clone(settings);
  indicatorOf(copy, "sleep_hours").plausible_range.max = 30;
  assert.equal(createGate().submit(copy, sleep("25"), context).outcome, OUTCOMES.accepted);
});

test("blood sugar after a meal is refused and never stored (D-23)", () => {
  const gate = createGate();
  for (let i = 0; i < 3; i += 1) {
    const out = submit(sugar("110", { context: "after_meal" }), gate);
    assert.equal(out.outcome, OUTCOMES.refused);
    assert.equal(out.reading, null);
    assert.deepEqual(problemsOf(out), ["context:context_refused"]);
  }
  const unanswered = submit(sugar("110", { context: "" }));
  assert.equal(unanswered.outcome, OUTCOMES.askAgain);
  assert.deepEqual(problemsOf(unanswered), ["context:missing"]);
});

test("blood sugar records which meter was used (D-29)", () => {
  assert.equal(submit(sugar("92")).reading.meter, "Meter one");
  assert.equal(submit(sugar("92")).reading.context, "before_meal");
  assert.equal(submit(sugar("92", { meter: "  " })).reading.meter, NOT_RECORDED);
});

test("blood pressure: two readings are needed and both are stored (D-49)", () => {
  const out = submit(bp(["121", "79"], ["118", "76"]));
  assert.equal(out.outcome, OUTCOMES.accepted);
  assert.deepEqual(out.reading.readings, [{ systolic: 121, diastolic: 79 }, { systolic: 118, diastolic: 76 }]);
  assert.equal(judgeReading(settings, out.reading).value, "118/76");
  const one = submit(draft("blood_pressure", { readings: [{ systolic: "121", diastolic: "79" }] }));
  assert.equal(one.outcome, OUTCOMES.askAgain);
  assert.deepEqual(problemsOf(one), ["readings.1.systolic:missing", "readings.1.diastolic:missing"]);
});

test("temperature records its method; another method is stored and not compared (D-35)", () => {
  const oral = submit(temp("36.8"));
  assert.equal(oral.reading.method, "oral");
  const other = submit(temp("36.8", { method: "other", methodName: "forehead" }));
  assert.equal(other.outcome, OUTCOMES.accepted);
  assert.equal(other.reading.method, "forehead");
  assert.equal(judgeReading(settings, other.reading).status, "not_judged");
  assert.equal(submit(temp("36.8", { method: "other" })).reading.method, "other");
  assert.equal(submit(temp("36.8", { method: "other", methodName: "oral" })).reading.method, "other");
  assert.deepEqual(problemsOf(submit(temp("36.8", { method: "" }))), ["method:missing"]);
});

test("heart rate records whether it was a device or a count", () => {
  assert.deepEqual(problemsOf(submit(hr("70", { source: "" }))), ["source:missing"]);
  assert.deepEqual(problemsOf(submit(hr("70", { source: "guess" }))), ["source:invalid"]);
  assert.equal(submit(hr("70", { source: "count" })).reading.source, "count");
});

test("the date must be real and not in the future; the note has a length limit", () => {
  assert.deepEqual(problemsOf(submit(sleep("7", { date: "2026-11-16" }))), [`date:${ENTRY_PROBLEMS.future}`]);
  assert.deepEqual(problemsOf(submit(sleep("7", { date: "2026-02-31" }))), [`date:${ENTRY_PROBLEMS.invalid}`]);
  assert.deepEqual(problemsOf(submit(sleep("7", { time: "25:00" }))), [`time:${ENTRY_PROBLEMS.invalid}`]);
  assert.deepEqual(problemsOf(submit(sleep("7", { note: "x".repeat(NOTE_MAX + 1) }))), [`note:${ENTRY_PROBLEMS.tooLong}`]);
  assert.equal(submit(sleep("7", { note: "x".repeat(NOTE_MAX) })).outcome, OUTCOMES.accepted);
  assert.deepEqual(problemsOf(submit(sleep("7", { profileId: "" }))), ["profileId:missing"]);
});

test("mood: the tap offers only the scale; a value off the scale is never accepted", () => {
  const fields = fieldsFor(settings, "mood", "tap");
  assert.deepEqual(fields.scale, [1, 2, 3, 4, 5]);
  assert.deepEqual(fields.symptoms, []);
  const gate = createGate();
  const tap = (value) => draft("mood", { kind: "tap", value });
  assert.equal(submit(tap("4"), gate).reading.kind, "tap");
  for (let i = 0; i < 3; i += 1) {
    const out = submit(tap("7"), gate);
    assert.equal(out.outcome, OUTCOMES.askAgain);
    assert.deepEqual(problemsOf(out), ["value:off_scale"]);
  }
});

test("weekly PHQ-2: two answers, each from the file's scale", () => {
  const fields = fieldsFor(settings, "mood", "phq2");
  assert.deepEqual(fields.questions, ["Little interest or pleasure in doing things", "Feeling down, depressed, or hopeless"]);
  assert.deepEqual(phq2Answers(indicatorOf(settings, "mood")), [
    { value: 0, text: "not at all" },
    { value: 1, text: "several days" },
    { value: 2, text: "more than half the days" },
    { value: 3, text: "nearly every day" },
  ]);
  const out = submit(draft("mood", { kind: "phq2", items: ["2", "1"] }));
  assert.equal(out.outcome, OUTCOMES.accepted);
  assert.deepEqual(out.reading.items, [2, 1]);
  assert.equal(judgeReading(settings, out.reading).status, "warning");
  assert.deepEqual(problemsOf(submit(draft("mood", { kind: "phq2", items: ["2", ""] }))), ["items.1:missing"]);
  assert.deepEqual(problemsOf(submit(draft("mood", { kind: "phq2", items: ["2", "4"] }))), ["items.1:off_scale"]);
});

test("the distress mark is stored with the file's own text and is red at once", () => {
  const out = submit(draft("mood", { kind: "distress" }));
  assert.equal(out.outcome, OUTCOMES.accepted);
  assert.equal(out.reading.marked, true);
  assert.deepEqual(out.reading.symptoms, ["severe distress or unable to continue (marked by the astronaut)"]);
  assert.equal(judgeReading(settings, out.reading).status, "contact");
});

test("what the entry screen shows comes from the file", () => {
  const pressure = fieldsFor(settings, "blood_pressure");
  assert.deepEqual(pressure.parts, ["systolic", "diastolic"]);
  assert.equal(pressure.readingsPerEntry, 2);
  assert.deepEqual(pressure.partRanges.systolic, { min: 50, max: 260 });
  assert.ok(pressure.symptoms.includes("dizziness"));
  const glucose = fieldsFor(settings, "blood_glucose");
  assert.deepEqual(glucose.contexts, ["before_meal"]);
  assert.equal(glucose.meter, true);
  assert.deepEqual(fieldsFor(settings, "body_temperature").method, { judged: "oral", other: "other" });
  assert.deepEqual(fieldsFor(settings, "heart_rate").source, ["device", "count"]);
  assert.equal(fieldsFor(settings, "naps"), null);
});
