// Turns the demo CSV into readings without using the app's own loader, so the
// parity test checks the engine on its own.
import { readCsvRows } from "./files.js";

export function demoRows() {
  return readCsvRows("app", "data", "synthetic_demo_data.csv");
}

export function expectedRows() {
  return readCsvRows("tests", "expected_colours.csv");
}

export function demoReadings(rows = demoRows()) {
  const readings = [];
  for (const row of rows) {
    const symptoms = row.symptoms === "-" || row.symptoms === "" ? [] : row.symptoms.split(";").map((s) => s.trim());
    const common = { profileId: row.crew_id, date: row.date, time: "", symptoms, day: Number(row.day) };
    const add = (indicator, extra) => readings.push({ id: `demo-${row.crew_id}-${row.day}-${indicator}`, indicator, ...common, ...extra });
    add("heart_rate", { value: Number(row.hr_bpm) });
    add("blood_pressure", { readings: [{ systolic: Number(row.sbp_mmHg), diastolic: Number(row.dbp_mmHg) }] });
    add("blood_glucose", { value: Number(row.glucose_before_meal_mg_dL), context: "before_meal" });
    add("body_temperature", { value: Number(row.temp_C), method: "oral" });
    add("sleep_hours", { value: Number(row.sleep_hours) });
    add("mood", { value: Number(row.mood_1to5), kind: "tap" });
  }
  return readings;
}

// { "SYN-A|1|heart_rate": "normal", ... } from a list of results and the readings they judge.
export function statusTable(results, readings) {
  const byId = new Map(readings.map((reading) => [reading.id, reading]));
  const table = {};
  for (const result of results) {
    const reading = byId.get(result.readingId);
    table[`${reading.profileId}|${reading.day}|${result.indicator}`] = result.status;
  }
  return table;
}

export function expectedTable(rows = expectedRows()) {
  const table = {};
  for (const row of rows) {
    for (const [key, value] of Object.entries(row)) {
      if (["day", "date", "crew_id"].includes(key)) continue;
      table[`${row.crew_id}|${row.day}|${key}`] = value;
    }
  }
  return table;
}
