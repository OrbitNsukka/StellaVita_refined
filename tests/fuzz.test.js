// A wider parity check than the demo data: random synthetic rows, judged by the
// reference checker's own functions (through reference/tools/expected_colours.py,
// unchanged) and by the engine. Skipped where Python is not available.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { judgeAll } from "../app/js/engine.js";
import { parseCsv, sampleReadings } from "../app/js/sample.js";
import { ROOT, loadThresholds } from "./helpers/files.js";

const settings = loadThresholds();

function findPython() {
  for (const name of ["python3", "python"]) {
    try {
      execFileSync(name, ["--version"], { stdio: "pipe" });
      return name;
    } catch {
      // try the next name
    }
  }
  return null;
}
const python = findPython();

// A small seeded generator, so the same rows are made on every run.
function generator(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const SYMPTOMS = ["dizziness", "fainting", "chest pain", "confusion", "shaky", "sweaty", "numbness", "severe fatigue", "breathlessness"];

function randomCsv(seed, crews, days) {
  const random = generator(seed);
  const whole = (low, high) => low + Math.floor(random() * (high - low + 1));
  const tenth = (low, high) => (whole(low * 10, high * 10) / 10).toFixed(1);
  const pick = (near, low, high) => (random() < 0.7 ? whole(near[0], near[1]) : whole(low, high));
  const lines = ["day,date,crew_id,hr_bpm,sbp_mmHg,dbp_mmHg,glucose_before_meal_mg_dL,temp_C,sleep_hours,mood_1to5,symptoms,note"];
  for (let crew = 0; crew < crews; crew += 1) {
    const slow = crew % 2 === 0;
    for (let day = 1; day <= days; day += 1) {
      const date = new Date(Date.UTC(2026, 0, day)).toISOString().slice(0, 10);
      const symptoms = random() < 0.15 ? [SYMPTOMS[whole(0, SYMPTOMS.length - 1)], ...(random() < 0.3 ? [SYMPTOMS[whole(0, SYMPTOMS.length - 1)]] : [])] : [];
      lines.push([
        day, date, `SYN-F${crew}`,
        slow ? pick([50, 62], 38, 115) : pick([58, 102], 38, 125),
        pick([126, 144], 82, 190), pick([76, 94], 52, 126),
        pick([66, 130], 45, 262),
        random() < 0.7 ? tenth(35.8, 37.7) : tenth(34.6, 39.8),
        random() < 0.7 ? tenth(5.6, 7.4) : tenth(3.0, 9.5),
        random() < 0.6 ? whole(1, 3) : whole(1, 5),
        symptoms.length > 0 ? [...new Set(symptoms)].join("; ") : "-",
        "-",
      ].join(","));
    }
  }
  return `${lines.join("\n")}\n`;
}

const PYTHON_CODE = `
import os, sys
sys.path.insert(0, os.path.join(sys.argv[1], "reference", "tools"))
import expected_colours as e
e.g.CSV_PATH = sys.argv[2]
T, header, rows = e.expected_rows()
sys.stdout.write(e.as_csv_text(header, rows))
`;

test("random rows: the engine gives the reference checker's status every time", { skip: python ? false : "Python is not available here; the wider parity check did not run" }, () => {
  const dir = mkdtempSync(join(tmpdir(), "stellavita-fuzz-"));
  try {
    let compared = 0;
    const seen = new Set();
    for (const seed of [2026, 7, 99]) {
      const csv = randomCsv(seed, 8, 45);
      const file = join(dir, `rows-${seed}.csv`);
      writeFileSync(file, csv);
      const expected = parseCsv(execFileSync(python, ["-B", "-c", PYTHON_CODE, ROOT, file], { encoding: "utf8" }));
      const readings = sampleReadings(parseCsv(csv), settings);
      const byId = new Map(readings.map((reading) => [reading.id, reading]));
      const got = new Map();
      for (const result of judgeAll(settings, readings)) {
        const reading = byId.get(result.readingId);
        got.set(`${reading.profileId}|${reading.day}|${result.indicator}`, result);
      }
      const wrong = [];
      for (const row of expected) {
        for (const indicator of settings.indicators) {
          const result = got.get(`${row.crew_id}|${row.day}|${indicator.id}`);
          compared += 1;
          seen.add(`${indicator.id}:${row[indicator.id]}`);
          if (result.status !== row[indicator.id]) wrong.push(`seed ${seed}, ${row.crew_id} day ${row.day} ${indicator.id}: engine ${result.status} (${result.reason}), checker ${row[indicator.id]}`);
        }
      }
      assert.deepEqual(wrong, []);
    }
    assert.equal(compared, 3 * 8 * 45 * 6);
    // The random rows reach every status the file can give each indicator.
    for (const wanted of [
      "heart_rate:normal", "heart_rate:warning", "heart_rate:contact",
      "blood_pressure:normal", "blood_pressure:warning", "blood_pressure:contact",
      "blood_glucose:normal", "blood_glucose:warning", "blood_glucose:contact",
      "body_temperature:normal", "body_temperature:warning", "body_temperature:contact",
      "sleep_hours:normal", "sleep_hours:warning", "sleep_hours:contact",
      "mood:normal", "mood:warning",
    ]) {
      assert.ok(seen.has(wanted), `the random rows include ${wanted}`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
