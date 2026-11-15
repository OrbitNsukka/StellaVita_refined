// Input safety (D-48, D-23): ask again, accept the same impossible value when
// it is entered twice in a row, refuse a blood sugar that is not before a meal.
// A reading that fails here is never stored and never given a status.
import {
  KINDS,
  PROBLEMS,
  checkReading,
  distressSymptoms,
  indicatorOf,
  itemRangeOf,
  judgedMethodOf,
  kindOf,
  partsOf,
  rangeOf,
  symptomChecklist,
} from "./engine.js";

export const OUTCOMES = Object.freeze({
  accepted: "accepted",
  askAgain: "ask_again",
  refused: "refused",
});

// Problems the entry adds to the engine's own list.
export const ENTRY_PROBLEMS = Object.freeze({
  invalid: "invalid",
  future: "future",
  tooLong: "too_long",
});

export const NOTE_MAX = 280;
export const NOT_RECORDED = "not recorded";
export const READINGS_PER_ENTRY = 2;
export const HEART_RATE_SOURCES = Object.freeze(["device", "count"]);
export const OTHER_METHOD = "other";

// The descriptive fields the data model adds to an indicator (brief, section 5).
const DESCRIPTIVE = Object.freeze({
  heart_rate: Object.freeze({ source: true }),
  blood_glucose: Object.freeze({ meter: true }),
  body_temperature: Object.freeze({ method: true }),
});

export function parseNumber(input) {
  if (typeof input === "number") return input;
  if (input === null || input === undefined) return null;
  const text = String(input).trim().replace(",", ".");
  if (text === "") return null;
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(text)) return Number.NaN;
  return Number(text);
}

export function isDate(text) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text ?? "")) return false;
  const [year, month, day] = text.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function isTime(text) {
  const match = /^(\d{2}):(\d{2})$/.exec(text ?? "");
  if (!match) return false;
  const start = new Date(Date.UTC(0, 0, 1));
  const moved = new Date(Date.UTC(0, 0, 1, Number(match[1]), Number(match[2])));
  return moved.getUTCDate() === start.getUTCDate() && moved.getUTCHours() === Number(match[1]) && moved.getUTCMinutes() === Number(match[2]);
}

export function localDate(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function localTime(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function wholeSteps(range, resolution) {
  const list = [];
  for (let value = range.min; value <= range.max; value += resolution) list.push(value);
  return list;
}

// What the entry screen needs to know about an indicator, all from the file.
export function fieldsFor(settings, indicatorId, kind) {
  const indicator = indicatorOf(settings, indicatorId);
  if (!indicator) return null;
  const ownKind = kindOf(indicator, { kind });
  const parts = partsOf(indicator);
  const extra = DESCRIPTIVE[indicator.id] ?? {};
  const weekly = indicator.weekly_phq2;
  return {
    indicator,
    kind: ownKind,
    parts,
    readingsPerEntry: parts ? READINGS_PER_ENTRY : 0,
    range: parts ? null : rangeOf(indicator, { kind: ownKind }),
    partRanges: parts ? Object.fromEntries(parts.map((part) => [part, rangeOf(indicator, { part })])) : null,
    scale: ownKind === KINDS.tap ? wholeSteps(rangeOf(indicator, { kind: ownKind }), indicator.resolution) : null,
    questions: ownKind === KINDS.phq2 ? weekly.questions : null,
    answers: ownKind === KINDS.phq2 ? phq2Answers(indicator) : null,
    symptoms: symptomChecklist(indicator, ownKind),
    contexts: indicator.accepted_contexts ?? null,
    source: extra.source ? HEART_RATE_SOURCES : null,
    meter: Boolean(extra.meter),
    method: extra.method ? { judged: judgedMethodOf(indicator), other: OTHER_METHOD } : null,
  };
}

// The answers to a weekly question, with the file's own words where it gives them
// (item_scoring: "... not at all = 0, several days = 1, ...").
export function phq2Answers(indicator) {
  const range = itemRangeOf(indicator);
  const words = new Map();
  const pattern = /([^,:=]+?)\s*=\s*(\d+)/g;
  const text = indicator.weekly_phq2.item_scoring ?? "";
  for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
    words.set(Number(match[2]), match[1].trim());
  }
  return wholeSteps(range, indicator.resolution).map((value) => ({ value, text: words.get(value) ?? "" }));
}

// Turns what was typed into a reading, and lists everything that is wrong with it.
export function prepareReading(settings, draft, context = {}) {
  const now = context.now ?? new Date();
  const today = context.today ?? localDate(now);
  const indicator = indicatorOf(settings, draft.indicator);
  const problems = [];
  const note = (field, problem) => problems.push({ field, problem });
  if (!indicator) {
    note("indicator", PROBLEMS.missing);
    return { reading: null, problems };
  }
  const fields = fieldsFor(settings, indicator.id, draft.kind);
  const text = (value) => (value === null || value === undefined ? "" : String(value).trim());

  const reading = {
    id: context.makeId ? context.makeId() : makeId(now),
    profileId: text(draft.profileId),
    indicator: indicator.id,
    date: text(draft.date),
    time: text(draft.time),
    symptoms: (draft.symptoms ?? []).filter((symptom) => fields.symptoms.includes(symptom)),
    note: text(draft.note),
    createdAt: now.toISOString(),
    thresholdsVersion: settings.meta.version,
  };
  if (fields.kind !== undefined) reading.kind = fields.kind;

  if (reading.profileId === "") note("profileId", PROBLEMS.missing);
  if (reading.date === "") note("date", PROBLEMS.missing);
  else if (!isDate(reading.date)) note("date", ENTRY_PROBLEMS.invalid);
  else if (reading.date > today) note("date", ENTRY_PROBLEMS.future);
  if (reading.time !== "" && !isTime(reading.time)) note("time", ENTRY_PROBLEMS.invalid);
  if (reading.note.length > NOTE_MAX) note("note", ENTRY_PROBLEMS.tooLong);

  if (fields.kind === KINDS.distress) {
    reading.marked = true;
    reading.symptoms = distressSymptoms(indicator);
  } else if (fields.kind === KINDS.phq2) {
    const items = Array.isArray(draft.items) ? draft.items : [];
    reading.items = fields.questions.map((_, index) => parseNumber(items[index]));
  } else if (fields.parts) {
    const typed = Array.isArray(draft.readings) ? draft.readings : [];
    reading.readings = [];
    for (let index = 0; index < fields.readingsPerEntry; index += 1) {
      const entry = {};
      for (const part of fields.parts) entry[part] = parseNumber(typed[index]?.[part]);
      reading.readings.push(entry);
    }
  } else {
    reading.value = parseNumber(draft.value);
  }

  if (fields.contexts) reading.context = text(draft.context);
  if (fields.source) {
    reading.source = text(draft.source);
    if (reading.source === "") note("source", PROBLEMS.missing);
    else if (!fields.source.includes(reading.source)) note("source", ENTRY_PROBLEMS.invalid);
  }
  if (fields.meter) reading.meter = text(draft.meter) || NOT_RECORDED;
  if (fields.method) {
    const method = text(draft.method);
    if (method === "") {
      reading.method = "";
      note("method", PROBLEMS.missing);
    } else if (method === fields.method.judged) {
      reading.method = method;
    } else {
      reading.method = text(draft.methodName) || method;
      if (reading.method === fields.method.judged) reading.method = method;
    }
  }

  problems.push(...checkReading(settings, reading));
  return { reading, problems };
}

function makeId(now) {
  const random = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : String(Math.random()).split(".").pop();
  return `r-${now.getTime()}-${random}`;
}

function signatureOf(reading) {
  return JSON.stringify([reading.profileId, reading.indicator, reading.kind ?? "", reading.value ?? null, reading.readings ?? null]);
}

// One gate per entry screen. It remembers the last impossible value, so that the
// same value entered twice in a row is accepted and judged (D-48).
export function createGate() {
  let lastOutside = null;
  return {
    submit(settings, draft, context) {
      const { reading, problems } = prepareReading(settings, draft, context);
      const refused = problems.filter((entry) => entry.problem === PROBLEMS.contextRefused);
      if (refused.length > 0) {
        lastOutside = null;
        return { outcome: OUTCOMES.refused, problems, reading: null };
      }
      const outside = problems.filter((entry) => entry.problem === PROBLEMS.outside);
      if (problems.length > outside.length) {
        lastOutside = null;
        return { outcome: OUTCOMES.askAgain, problems, reading: null, repeatAccepts: false };
      }
      if (outside.length > 0) {
        const signature = signatureOf(reading);
        if (lastOutside === signature) {
          lastOutside = null;
          reading.acceptedOutsideRange = true;
          return { outcome: OUTCOMES.accepted, problems: [], reading };
        }
        lastOutside = signature;
        return { outcome: OUTCOMES.askAgain, problems, reading: null, repeatAccepts: true };
      }
      lastOutside = null;
      return { outcome: OUTCOMES.accepted, problems: [], reading };
    },
    reset() {
      lastOutside = null;
    },
  };
}
