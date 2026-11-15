// The status engine. Pure: no imports, no browser calls, no storage.
// Every band, limit, rule parameter, reason and source ID is read from the
// settings object (Indicator_Thresholds.json). Nothing from that file is typed here.

export const NOT_JUDGED = "not_judged";

export const RULES = Object.freeze({
  band: "band",
  symptom: "symptom",
  pattern: "pattern",
  personalRange: "personal_range",
  notCompared: "not_compared",
});

export const KINDS = Object.freeze({
  tap: "tap",
  phq2: "phq2",
  distress: "distress",
});

export const PROBLEMS = Object.freeze({
  missing: "missing",
  notANumber: "not_a_number",
  outside: "outside_range",
  offScale: "off_scale",
  contextRefused: "context_refused",
});

export const PATTERN_TESTS = Object.freeze({
  atMost: "at_most",
  atLeast: "at_least",
  stage2: "stage2",
  stage2Persistent: "stage2_persistent",
});

// Two reasons are set by the brief (section 6, rules 8 and 9) and have no field in the file.
export const FIXED_REASONS = Object.freeze({
  trendOnly: "trend only",
  notCompared: "not compared: taken by another method",
});

// The file names the agreed temperature method only in words (D-35). Used when
// an indicator has no "judged_method" field.
export const JUDGED_METHOD_FALLBACK = "oral";

const EPSILON = 1e-9;
const MS_PER_DAY = 86400000;

// ---------- small helpers ----------

export function indicatorOf(settings, id) {
  return settings.indicators.find((indicator) => indicator.id === id) ?? null;
}

export function rankOf(settings, status) {
  return settings.meta.status_levels.indexOf(status);
}

export function lowestStatus(settings) {
  return settings.meta.status_levels[0];
}

export function worstOf(settings, statuses) {
  let worst = statuses[0];
  for (const status of statuses) {
    if (rankOf(settings, status) > rankOf(settings, worst)) worst = status;
  }
  return worst;
}

export function decimalsOf(resolution) {
  const text = String(resolution);
  const dot = text.indexOf(".");
  return dot < 0 ? 0 : text.length - dot - 1;
}

function roundHalfEven(x) {
  const floor = Math.floor(x);
  const rest = x - floor;
  if (rest > 0.5) return floor + 1;
  if (rest < 0.5) return floor;
  return floor % 2 === 0 ? floor : floor + 1;
}

// Rounds the way the reference checker does: round(value / resolution) * resolution,
// with an exact half going to the even neighbour.
export function roundToResolution(value, resolution) {
  const steps = roundHalfEven(value / resolution);
  return Number((steps * resolution).toFixed(decimalsOf(resolution)));
}

export function formatValue(value, resolution) {
  return value.toFixed(decimalsOf(resolution));
}

// The one band whose inclusive min and max hold the (already rounded) value.
export function findBand(bands, value) {
  for (const band of bands) {
    const low = band.min ?? -Infinity;
    const high = band.max ?? Infinity;
    if (low - EPSILON <= value && value <= high + EPSILON) return band;
  }
  return null;
}

// Blood pressure keeps one list of bands per part. Other indicators have one list.
export function partsOf(indicator) {
  return Array.isArray(indicator.bands) ? null : Object.keys(indicator.bands);
}

export function judgedMethodOf(indicator) {
  return indicator.judged_method ?? JUDGED_METHOD_FALLBACK;
}

export function dayNumber(date) {
  const [year, month, day] = String(date).split("-").map(Number);
  return Math.round(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

export function orderKey(reading) {
  return [reading.date ?? "", reading.time ?? "", reading.createdAt ?? "", reading.id ?? ""].join("|");
}

export function sortReadings(readings) {
  return [...readings].sort((a, b) => {
    const ka = orderKey(a);
    const kb = orderKey(b);
    if (ka < kb) return -1;
    return ka > kb ? 1 : 0;
  });
}

// The text between quote marks in a longer sentence of the file, or the whole sentence.
export function quotedNote(text) {
  const match = /(?:^|[\s(])'([^']+)'(?=[\s.,;:)]|$)/.exec(text ?? "");
  return match ? match[1] : (text ?? "");
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function unique(list) {
  return [...new Set(list)];
}

// ---------- what the file offers for an entry ----------

// The symptom checklist of an indicator (D-51): the symptoms named in its rules.
export function symptomChecklist(indicator, kind) {
  if (kind === KINDS.phq2 || kind === KINDS.distress) return [];
  const list = [];
  for (const rule of indicator.symptom_rules ?? []) {
    if (isSelfMarkRule(indicator, rule)) continue;
    list.push(...rule.symptoms);
  }
  list.push(...(indicator.low_reading?.with_symptoms ?? []));
  return unique(list);
}

// The mood indicator's own-mark rule (severe distress) is a button, not a tick box.
function isSelfMarkRule(indicator, rule) {
  return Boolean(indicator.weekly_phq2) && (indicator.symptom_rules ?? []).includes(rule);
}

export function distressSymptoms(indicator) {
  const list = [];
  for (const rule of indicator.symptom_rules ?? []) list.push(...rule.symptoms);
  return unique(list);
}

export function kindOf(indicator, reading) {
  if (!indicator.weekly_phq2) return undefined;
  return reading.kind ?? KINDS.tap;
}

export function rangeOf(indicator, { part, kind } = {}) {
  if (kind === KINDS.phq2) return indicator.weekly_phq2?.plausible_range ?? null;
  const range = indicator.plausible_range ?? null;
  if (range && part) return range[part] ?? null;
  return range;
}

// Each weekly question has the same share of the total's range.
export function itemRangeOf(indicator) {
  const weekly = indicator.weekly_phq2;
  const count = weekly.questions.length;
  return { min: weekly.plausible_range.min / count, max: weekly.plausible_range.max / count };
}

export function unitOf(indicator, kind) {
  const unit = indicator.unit ?? "";
  if (!indicator.weekly_phq2) return unit;
  const pieces = unit.split(";").map((piece) => piece.trim());
  if (pieces.length !== 2) return unit;
  if (kind === KINDS.distress) return "";
  return kind === KINDS.phq2 ? pieces[1] : pieces[0];
}

// ---------- rule 1: accept or ask again ----------

export function checkNumber(value, range) {
  if (value === null || value === undefined || value === "") return PROBLEMS.missing;
  if (!isNumber(value)) return PROBLEMS.notANumber;
  if (range && (value < range.min || value > range.max)) return PROBLEMS.outside;
  return null;
}

// Lists what is wrong with a reading's values. An empty list means it can be judged.
// "outside_range" may be accepted when entered twice in a row (D-48); the others never are.
export function checkReading(settings, reading) {
  const indicator = indicatorOf(settings, reading.indicator);
  if (!indicator) return [{ field: "indicator", problem: PROBLEMS.missing }];
  const kind = kindOf(indicator, reading);
  const problems = [];
  const note = (field, problem) => {
    if (problem) problems.push({ field, problem });
  };

  if (kind === KINDS.distress) return problems;

  if (kind === KINDS.phq2) {
    const range = itemRangeOf(indicator);
    const items = Array.isArray(reading.items) ? reading.items : [];
    indicator.weekly_phq2.questions.forEach((_, index) => {
      let problem = checkNumber(items[index], range);
      if (problem === PROBLEMS.outside) problem = PROBLEMS.offScale;
      if (!problem && !Number.isInteger(items[index])) problem = PROBLEMS.offScale;
      note(`items.${index}`, problem);
    });
    return problems;
  }

  const parts = partsOf(indicator);
  if (parts) {
    const entries = Array.isArray(reading.readings) ? reading.readings : [];
    if (entries.length === 0) note("readings", PROBLEMS.missing);
    entries.forEach((entry, index) => {
      for (const part of parts) {
        note(`readings.${index}.${part}`, checkNumber(entry?.[part], rangeOf(indicator, { part })));
      }
    });
    return problems;
  }

  let problem = checkNumber(reading.value, rangeOf(indicator, { kind }));
  if (problem === PROBLEMS.outside) {
    const rounded = roundToResolution(reading.value, indicator.resolution);
    if (!findBand(indicator.bands, rounded)) problem = PROBLEMS.offScale;
  }
  note("value", problem);

  if (indicator.accepted_contexts) {
    if (reading.context === null || reading.context === undefined || reading.context === "") {
      note("context", PROBLEMS.missing);
    } else if (!indicator.accepted_contexts.includes(reading.context)) {
      note("context", PROBLEMS.contextRefused);
    }
  }
  return problems;
}

// ---------- rules 2 and 3: round, then band ----------

// The values of a reading that the rules compare, already rounded. Null when
// the reading cannot be compared (missing values, another method, a distress mark).
function measure(indicator, reading) {
  const kind = kindOf(indicator, reading);
  if (kind === KINDS.distress) return null;
  const resolution = indicator.resolution;

  if (kind === KINDS.phq2) {
    const items = reading.items ?? [];
    if (items.length === 0 || !items.every(isNumber)) return null;
    const value = roundToResolution(sum(items), resolution);
    return { kind, value, text: formatValue(value, resolution) };
  }

  const parts = partsOf(indicator);
  if (parts) {
    const entries = reading.readings ?? [];
    const latest = entries[entries.length - 1];
    if (!latest || !parts.every((part) => isNumber(latest[part]))) return null;
    const values = {};
    for (const part of parts) values[part] = roundToResolution(latest[part], resolution);
    return { kind, parts, values, text: parts.map((part) => formatValue(values[part], resolution)).join("/") };
  }

  if (!isNumber(reading.value)) return null;
  if (reading.method !== undefined && reading.method !== judgedMethodOf(indicator)) return null;
  const value = roundToResolution(reading.value, resolution);
  return { kind, value, text: formatValue(value, resolution) };
}

function bandFinding(indicator, measured) {
  if (measured.parts) {
    const found = measured.parts.map((part) => ({
      part,
      band: findBand(indicator.bands[part], measured.values[part]),
    }));
    if (found.some((entry) => !entry.band)) return null;
    return found;
  }
  const bands = measured.kind === KINDS.phq2 ? indicator.weekly_phq2.bands : indicator.bands;
  const band = findBand(bands, measured.value);
  return band ? [{ part: null, band }] : null;
}

function bandLabel(band) {
  if (band.label) return band.label;
  // A band without a label (the weekly bands): its own limits, from the file.
  if (band.min !== undefined && band.max !== undefined) return `${band.min} to ${band.max}`;
  if (band.min !== undefined) return `${band.min} or more`;
  if (band.max !== undefined) return `${band.max} or less`;
  return "";
}

function notesOf(...items) {
  return items.map((item) => item?.note).filter(Boolean);
}

// ---------- rule 6: patterns ----------

function meetsPattern(indicator, rule, reading) {
  const measured = measure(indicator, reading);
  if (!measured || measured.kind === KINDS.phq2) return false;
  switch (rule.test) {
    case PATTERN_TESTS.stage2:
    case PATTERN_TESTS.stage2Persistent:
      return Boolean(measured.parts) && measured.parts.some((part) => measured.values[part] >= rule[`${part}_min`]);
    case PATTERN_TESTS.atMost:
      return !measured.parts && measured.value <= rule.value;
    case PATTERN_TESTS.atLeast:
      return !measured.parts && measured.value >= rule.value;
    default:
      return false;
  }
}

// A rule fires on a reading only if that reading meets the test. Earlier days
// count when any reading on them meets it; a missing day breaks a run.
export function patternFires(indicator, rule, reading, earlier) {
  if (!meetsPattern(indicator, rule, reading)) return false;
  const today = dayNumber(reading.date);
  const metDays = new Set([today]);
  for (const other of earlier) {
    if (meetsPattern(indicator, rule, other)) metDays.add(dayNumber(other.date));
  }
  if (rule.test === PATTERN_TESTS.stage2Persistent) {
    for (const day of metDays) {
      const gap = today - day;
      if (gap >= rule.gap_days_at_least && gap <= rule.lookback_days) return true;
    }
    return false;
  }
  if (rule.consecutive) {
    for (let back = 1; back < rule.count; back += 1) {
      if (!metDays.has(today - back)) return false;
    }
    return true;
  }
  if (rule.within_days !== undefined) {
    let days = 0;
    for (const day of metDays) {
      const gap = today - day;
      if (gap >= 0 && gap < rule.within_days) days += 1;
    }
    return days >= rule.count;
  }
  return false;
}

// ---------- the whole judgement of one reading ----------

function finding(status, reason, sourceIds, rule, notes = []) {
  return { status, reason, source_ids: unique(sourceIds ?? []), rule, notes };
}

function symptomFindings(indicator, symptoms, rawBandStatus) {
  const found = [];
  for (const rule of indicator.symptom_rules ?? []) {
    if (rule.only_if_band && rule.only_if_band !== rawBandStatus) continue;
    const matched = rule.symptoms.filter((symptom) => symptoms.includes(symptom));
    if (matched.length === 0) continue;
    found.push(finding(rule.status, matched.join(", "), rule.sources ?? indicator.source_keys, RULES.symptom, notesOf(rule)));
  }
  return found;
}

// Judges one reading. "earlier" holds the same astronaut's earlier readings of
// the same indicator, oldest first.
export function judgeReading(settings, reading, earlier = []) {
  const indicator = indicatorOf(settings, reading.indicator);
  if (!indicator) throw new Error(`Unknown indicator: ${reading.indicator}`);
  const kind = kindOf(indicator, reading);
  const result = {
    readingId: reading.id,
    indicator: indicator.id,
    value: null,
    unit: unitOf(indicator, kind),
    status: NOT_JUDGED,
    reason: "",
    source_ids: [],
    rule: RULES.notCompared,
    thresholdsVersion: settings.meta.version,
    profileId: reading.profileId,
    date: reading.date,
    time: reading.time ?? "",
    notes: [],
    also: [],
  };
  if (kind !== undefined) result.kind = kind;
  const symptoms = reading.symptoms ?? [];
  const rank = (status) => rankOf(settings, status);

  // Rule 9, the distress mark: the mood indicator's own-mark rule, at once.
  if (kind === KINDS.distress) {
    const marked = distressSymptoms(indicator);
    const present = reading.marked ? marked : marked.filter((symptom) => symptoms.includes(symptom));
    const found = symptomFindings(indicator, present, undefined);
    if (found.length === 0) throw new Error("A distress mark needs the indicator's own-mark rule");
    return finish(result, found, rank);
  }

  // Rule 8: a reading taken by another method is stored and not compared.
  if (reading.method !== undefined && reading.method !== judgedMethodOf(indicator)) {
    result.value = isNumber(reading.value) ? roundToResolution(reading.value, indicator.resolution) : null;
    result.reason = FIXED_REASONS.notCompared;
    if (indicator.measurement) result.notes.push(indicator.measurement);
    return result;
  }

  const measured = measure(indicator, reading);
  if (!measured) throw new Error(`Reading ${reading.id} has no value to judge`);
  result.value = measured.parts ? measured.text : measured.value;

  // Rule 3: the band. Each part is judged separately; the reading takes the worse.
  const found = bandFinding(indicator, measured);
  if (!found) throw new Error(`Value ${measured.text} falls in no band of ${indicator.id}`);
  const rawBandStatus = worstOf(settings, found.map((entry) => entry.band.status));
  const worstParts = found.filter((entry) => entry.band.status === rawBandStatus);
  let band = finding(
    rawBandStatus,
    worstParts.map((entry) => (entry.part ? `${entry.part}: ${bandLabel(entry.band)}` : bandLabel(entry.band))).join("; "),
    worstParts.flatMap((entry) => entry.band.sources ?? []),
    RULES.band,
    notesOf(...worstParts.map((entry) => entry.band)),
  );

  // Rule 9, the daily tap: never sets a colour; the reason is fixed by the brief.
  if (kind === KINDS.tap) band.reason = FIXED_REASONS.trendOnly;

  // Rule 5: the personal range. The only rule that lowers a status.
  const baseline = indicator.baseline_rule;
  if (baseline && !measured.parts && band.status !== baseline.result && measured.value < baseline.median_below) {
    const past = earlier
      .map((other) => measure(indicator, other))
      .filter(Boolean)
      .map((other) => other.value)
      .slice(-baseline.window_readings);
    if (past.length >= baseline.min_readings) {
      const middle = median(past);
      if (middle < baseline.median_below && Math.abs(measured.value - middle) <= baseline.within_bpm) {
        band = finding(baseline.result, quotedNote(baseline.rule), baseline.sources, RULES.personalRange, notesOf(baseline));
      }
    }
  }

  // Rule 4: symptoms. They can only raise the status.
  const fromSymptoms = symptomFindings(indicator, symptoms, rawBandStatus);
  const low = indicator.low_reading;
  if (low && measured.parts) {
    const isLow = measured.parts.some((part) => measured.values[part] <= low[`${part}_max`]);
    if (isLow) {
      const matched = (low.with_symptoms ?? []).filter((symptom) => symptoms.includes(symptom));
      if (matched.length > 0) {
        fromSymptoms.push(finding(low.with_symptoms_status, `${low.rule}, with ${matched.join(", ")}`, low.sources, RULES.symptom));
      } else {
        result.notes.push(quotedNote(low.without_symptoms));
      }
    }
  }

  // Rule 6: patterns over the earlier readings.
  const fromPatterns = [];
  if (kind !== KINDS.phq2) {
    for (const rule of settings.pattern_rules ?? []) {
      if (rule.indicator !== indicator.id) continue;
      if (patternFires(indicator, rule, reading, earlier)) {
        fromPatterns.push(finding(rule.status, rule.label, rule.sources, RULES.pattern, rule.action ? [rule.action] : []));
      }
    }
  }

  // Rule 7: the worst wins. On a tie: a pattern, then the band, then a symptom.
  return finish(result, [...fromPatterns, band, ...fromSymptoms], rank);
}

function finish(result, findings, rank) {
  let final = findings[0];
  for (const candidate of findings) {
    if (rank(candidate.status) > rank(final.status)) final = candidate;
  }
  result.status = final.status;
  result.reason = final.reason;
  result.source_ids = final.source_ids;
  result.rule = final.rule;
  result.notes = [...final.notes, ...result.notes];
  result.also = findings.filter((candidate) => candidate !== final);
  return result;
}

// Judges every reading in the list. Readings are grouped by astronaut and
// indicator; each one sees only the readings before it. "settingsFor" may give
// the settings of the version a reading was entered under.
export function judgeAll(settings, readings, settingsFor) {
  const groups = new Map();
  for (const reading of sortReadings(readings)) {
    const key = `${reading.profileId}|${reading.indicator}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(reading);
  }
  const results = [];
  for (const group of groups.values()) {
    group.forEach((reading, index) => {
      const own = (settingsFor && settingsFor(reading.thresholdsVersion)) || settings;
      results.push(judgeReading(own, reading, group.slice(0, index)));
    });
  }
  return results;
}
