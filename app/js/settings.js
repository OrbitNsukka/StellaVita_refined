// Loads, checks and caches the threshold file (D-46). The file is the settings
// layer: this module adds no number of its own.
import { PATTERN_TESTS, partsOf } from "./engine.js";

export const SETTINGS_PATH = "data/Indicator_Thresholds.json";

export class SettingsError extends Error {
  constructor(message, problems = []) {
    super(message);
    this.name = "SettingsError";
    this.problems = problems;
  }
}

export function compareVersions(a, b) {
  const left = String(a).split(".").map(Number);
  const right = String(b).split(".").map(Number);
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i += 1) {
    const difference = (left[i] || 0) - (right[i] || 0);
    if (difference !== 0) return difference < 0 ? -1 : 1;
  }
  return 0;
}

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isText(value) {
  return typeof value === "string" && value.length > 0;
}

function isList(value) {
  return Array.isArray(value) && value.length > 0;
}

function near(a, b) {
  return Math.abs(a - b) < 1e-9;
}

function checkBands(bands, resolution, levels, where, problems) {
  if (!isList(bands)) {
    problems.push(`${where}: no bands`);
    return;
  }
  bands.forEach((band, index) => {
    const name = `${where} band ${index + 1}`;
    if (!levels.includes(band.status)) problems.push(`${name}: unknown status "${band.status}"`);
    if (!isList(band.sources)) problems.push(`${name}: no sources`);
    if (band.min !== undefined && !isNumber(band.min)) problems.push(`${name}: min is not a number`);
    if (band.max !== undefined && !isNumber(band.max)) problems.push(`${name}: max is not a number`);
    if (isNumber(band.min) && isNumber(band.max) && band.min > band.max) problems.push(`${name}: min is above max`);
    if (index > 0) {
      const before = bands[index - 1];
      if (!isNumber(before.max) || !isNumber(band.min)) {
        problems.push(`${name}: an open end between two bands`);
      } else if (!near(before.max + resolution, band.min)) {
        problems.push(`${name}: a gap or an overlap with the band before it`);
      }
    }
  });
}

function checkRange(range, where, problems) {
  if (!range || !isNumber(range.min) || !isNumber(range.max) || range.min >= range.max) {
    problems.push(`${where}: no usable plausible_range`);
  }
}

function checkSymptomRules(indicator, levels, problems) {
  (indicator.symptom_rules ?? []).forEach((rule, index) => {
    const name = `${indicator.id} symptom rule ${index + 1}`;
    if (!isList(rule.symptoms)) problems.push(`${name}: no symptoms`);
    if (!levels.includes(rule.status)) problems.push(`${name}: unknown status "${rule.status}"`);
    if (rule.only_if_band !== undefined && !levels.includes(rule.only_if_band)) problems.push(`${name}: unknown only_if_band`);
    if (!isList(rule.sources) && !isList(indicator.source_keys)) problems.push(`${name}: no sources`);
  });
}

function checkIndicator(indicator, levels, problems) {
  const id = indicator.id;
  if (!isText(indicator.label)) problems.push(`${id}: no label`);
  if (typeof indicator.unit !== "string") problems.push(`${id}: no unit`);
  if (!isNumber(indicator.resolution) || indicator.resolution <= 0) {
    problems.push(`${id}: no usable resolution`);
    return;
  }
  if (!indicator.bands || typeof indicator.bands !== "object") {
    problems.push(`${id}: no bands`);
    return;
  }
  const parts = partsOf(indicator);
  if (parts) {
    if (parts.length === 0) problems.push(`${id}: no bands`);
    for (const part of parts) {
      checkBands(indicator.bands[part], indicator.resolution, levels, `${id} ${part}`, problems);
      checkRange(indicator.plausible_range?.[part], `${id} ${part}`, problems);
    }
  } else {
    checkBands(indicator.bands, indicator.resolution, levels, id, problems);
    checkRange(indicator.plausible_range, id, problems);
  }
  checkSymptomRules(indicator, levels, problems);

  const baseline = indicator.baseline_rule;
  if (baseline) {
    for (const key of ["window_readings", "min_readings", "median_below", "within_bpm"]) {
      if (!isNumber(baseline[key])) problems.push(`${id} baseline_rule: ${key} is not a number`);
    }
    if (!levels.includes(baseline.result)) problems.push(`${id} baseline_rule: unknown result`);
    if (!isText(baseline.rule)) problems.push(`${id} baseline_rule: no rule text`);
    if (!isList(baseline.sources)) problems.push(`${id} baseline_rule: no sources`);
  }

  const low = indicator.low_reading;
  if (low) {
    for (const part of parts ?? []) {
      if (!isNumber(low[`${part}_max`])) problems.push(`${id} low_reading: ${part}_max is not a number`);
    }
    if (!isList(low.with_symptoms)) problems.push(`${id} low_reading: no with_symptoms`);
    if (!levels.includes(low.with_symptoms_status)) problems.push(`${id} low_reading: unknown with_symptoms_status`);
    if (!isText(low.rule)) problems.push(`${id} low_reading: no rule text`);
    if (!isList(low.sources)) problems.push(`${id} low_reading: no sources`);
  }

  if (indicator.accepted_contexts !== undefined && !isList(indicator.accepted_contexts)) {
    problems.push(`${id}: accepted_contexts is empty`);
  }

  const weekly = indicator.weekly_phq2;
  if (weekly) {
    if (!isList(weekly.questions)) problems.push(`${id} weekly_phq2: no questions`);
    checkBands(weekly.bands, indicator.resolution, levels, `${id} weekly_phq2`, problems);
    checkRange(weekly.plausible_range, `${id} weekly_phq2`, problems);
  }
}

function checkPattern(rule, ids, levels, problems) {
  const name = `pattern rule ${rule.id ?? "(no id)"}`;
  if (!ids.includes(rule.indicator)) problems.push(`${name}: unknown indicator "${rule.indicator}"`);
  if (!levels.includes(rule.status)) problems.push(`${name}: unknown status "${rule.status}"`);
  if (!isText(rule.label)) problems.push(`${name}: no label`);
  if (!isList(rule.sources)) problems.push(`${name}: no sources`);
  const need = (key) => {
    if (!isNumber(rule[key])) problems.push(`${name}: ${key} is not a number`);
  };
  switch (rule.test) {
    case PATTERN_TESTS.atMost:
    case PATTERN_TESTS.atLeast:
      need("value");
      need("count");
      if (!rule.consecutive) need("within_days");
      break;
    case PATTERN_TESTS.stage2:
      need("systolic_min");
      need("diastolic_min");
      need("count");
      if (!rule.consecutive) need("within_days");
      break;
    case PATTERN_TESTS.stage2Persistent:
      need("systolic_min");
      need("diastolic_min");
      need("gap_days_at_least");
      need("lookback_days");
      break;
    default:
      problems.push(`${name}: unknown test "${rule.test}"`);
  }
}

// Looks for the parts the engine needs. A broken file is refused, with the reasons.
export function validateSettings(json) {
  const problems = [];
  if (!json || typeof json !== "object") return { ok: false, problems: ["the file is not a JSON object"] };
  const meta = json.meta ?? {};
  if (!isText(meta.version)) problems.push("meta.version is missing");
  const levels = meta.status_levels;
  if (!isList(levels) || !levels.every(isText)) {
    problems.push("meta.status_levels is missing");
    return { ok: false, problems };
  }
  for (const level of levels) {
    if (!isText(meta.status_meaning?.[level])) problems.push(`meta.status_meaning has no text for "${level}"`);
  }
  if (!isList(json.indicators)) {
    problems.push("no indicators");
    return { ok: false, problems };
  }
  const ids = [];
  for (const indicator of json.indicators) {
    if (!isText(indicator?.id)) {
      problems.push("an indicator has no id");
      continue;
    }
    if (ids.includes(indicator.id)) problems.push(`${indicator.id}: listed twice`);
    ids.push(indicator.id);
    checkIndicator(indicator, levels, problems);
  }
  if (json.pattern_rules !== undefined && !Array.isArray(json.pattern_rules)) problems.push("pattern_rules is not a list");
  for (const rule of Array.isArray(json.pattern_rules) ? json.pattern_rules : []) checkPattern(rule, ids, levels, problems);
  return { ok: problems.length === 0, problems };
}

// Reads the file from the app's own folder, checks it and stores a copy per
// version on the device. If the file cannot be read, the newest stored copy is
// used. If there is none, the app cannot judge anything and says so.
export async function loadSettings({ fetchJson, store, now = () => new Date().toISOString() }) {
  let problems = [];
  let fresh = null;
  try {
    const json = await fetchJson(SETTINGS_PATH);
    const checked = validateSettings(json);
    if (checked.ok) fresh = json;
    else problems = checked.problems;
  } catch (error) {
    problems = [`the threshold file could not be read: ${error.message}`];
  }

  if (fresh) {
    const version = fresh.meta.version;
    const cached = store ? await store.getSettings(version) : null;
    if (store && (!cached || JSON.stringify(cached.json) !== JSON.stringify(fresh))) {
      await store.putSettings({ version, loadedAt: now(), json: fresh });
    }
    return { settings: fresh, version, source: "file", problems };
  }

  const stored = store ? await store.listSettings() : [];
  const usable = stored.filter((entry) => validateSettings(entry.json).ok);
  if (usable.length === 0) {
    throw new SettingsError("The threshold file could not be loaded, and no copy is stored on this device.", problems);
  }
  usable.sort((a, b) => compareVersions(b.version, a.version));
  return { settings: usable[0].json, version: usable[0].version, source: "device", problems };
}

// Gives the settings of the version a reading was entered under, so old
// results keep the version they were judged with.
export async function settingsByVersion(store) {
  const map = new Map();
  for (const entry of await store.listSettings()) {
    if (validateSettings(entry.json).ok) map.set(entry.version, entry.json);
  }
  return (version) => map.get(version);
}
