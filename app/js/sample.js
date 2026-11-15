// The synthetic demo data: four fictional astronauts over 30 days. Reads the
// CSV into readings, and resets the device to the clean sample.
import { KINDS, partsOf } from "./engine.js";
import { NOT_RECORDED, fieldsFor } from "./entry.js";

export const SAMPLE_PATH = "data/synthetic_demo_data.csv";
export const SAMPLE_PREFIX = "sample";

const COLUMNS = Object.freeze({ day: "day", date: "date", crew: "crew_id", symptoms: "symptoms", note: "note" });
const EMPTY = "-";

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const endCell = () => {
    row.push(cell);
    cell = "";
  };
  const endRow = () => {
    endCell();
    if (row.length > 1 || row[0] !== "") rows.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") endCell();
    else if (ch === "\n") endRow();
    else if (ch !== "\r") cell += ch;
  }
  if (cell !== "" || row.length > 0) endRow();
  if (rows.length === 0) return [];
  const header = rows[0];
  return rows.slice(1).map((cells) => Object.fromEntries(header.map((name, index) => [name, cells[index] ?? ""])));
}

export function crewIds(rows) {
  return [...new Set(rows.map((row) => row[COLUMNS.crew]))].sort();
}

// A profile is a local choice of astronaut: no name, no password, no account.
export function sampleProfiles(rows, settings, createdAt) {
  return crewIds(rows).map((id) => ({
    id,
    label: `Astronaut ${id.split("-").pop()} (synthetic)`,
    createdAt,
    thresholdsVersion: settings.meta.version,
  }));
}

// One reading per indicator and row. In the demo file symptoms belong to the
// day, and the reference checker applies them to every indicator of that day,
// so each of the day's readings carries them.
export function sampleReadings(rows, settings) {
  const readings = [];
  for (const row of rows) {
    const symptomsText = row[COLUMNS.symptoms] ?? "";
    const symptoms = symptomsText === "" || symptomsText === EMPTY ? [] : symptomsText.split(";").map((item) => item.trim()).filter(Boolean);
    const noteText = row[COLUMNS.note] ?? "";
    for (const indicator of settings.indicators) {
      const reading = {
        id: `${SAMPLE_PREFIX}-${row[COLUMNS.crew]}-${row[COLUMNS.day]}-${indicator.id}`,
        profileId: row[COLUMNS.crew],
        indicator: indicator.id,
        date: row[COLUMNS.date],
        time: "",
        symptoms: [...symptoms],
        note: noteText === EMPTY ? "" : noteText,
        createdAt: "",
        thresholdsVersion: settings.meta.version,
        sample: true,
        day: Number(row[COLUMNS.day]),
      };
      const parts = partsOf(indicator);
      if (parts) {
        const entry = {};
        for (const part of parts) entry[part] = Number(row[indicator.csv_fields[part]]);
        reading.readings = [entry];
      } else {
        reading.value = Number(row[indicator.csv_field]);
      }
      if (indicator.weekly_phq2) reading.kind = KINDS.tap;
      if (indicator.accepted_contexts) reading.context = indicator.accepted_contexts[0];
      addDescriptive(reading, indicator, settings);
      readings.push(reading);
    }
  }
  return readings;
}

// The demo file does not say how a heart rate was taken or which meter was
// used. The temperatures are stored under the method the bands are written for.
function addDescriptive(reading, indicator, settings) {
  const fields = fieldsFor(settings, indicator.id);
  if (fields.source) reading.source = NOT_RECORDED;
  if (fields.meter) reading.meter = NOT_RECORDED;
  if (fields.method) reading.method = fields.method.judged;
}

export async function fetchSampleRows(fetchText) {
  return parseCsv(await fetchText(SAMPLE_PATH));
}

// Makes the four profiles if the device has none yet.
export async function ensureProfiles({ fetchText, store, settings, now = () => new Date().toISOString() }) {
  const existing = await store.getProfiles();
  if (existing.length > 0) return existing;
  const profiles = sampleProfiles(await fetchSampleRows(fetchText), settings, now());
  await store.putProfiles(profiles);
  return profiles;
}

// Loads the sample readings for all four astronauts, replacing earlier copies of them.
export async function loadSample({ fetchText, store, settings, now = () => new Date().toISOString() }) {
  const rows = await fetchSampleRows(fetchText);
  const existing = await store.getProfiles();
  const known = new Set(existing.map((profile) => profile.id));
  const missing = sampleProfiles(rows, settings, now()).filter((profile) => !known.has(profile.id));
  if (missing.length > 0) await store.putProfiles(missing);
  const readings = sampleReadings(rows, settings);
  await store.putReadings(readings);
  return { rows: rows.length, readings: readings.length };
}

// Reset: wipes the device's readings for all profiles, then reloads the clean sample.
export async function resetToSample(options) {
  await options.store.clearReadings();
  return loadSample(options);
}
