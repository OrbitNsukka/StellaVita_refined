// The working screens. Everything shown is set as text, never as markup, so
// nothing typed into a note can run as code. Health wording comes from the
// files in data/; the other words come from labels.js.
import { KINDS, PROBLEMS, indicatorOf, judgeAll, sortReadings } from "./engine.js";
import { ENTRY_PROBLEMS, NOTE_MAX, OUTCOMES, createGate, fieldsFor, localDate, localTime } from "./entry.js";
import { GUIDANCE_PATH, LIMITS_PATH, guidanceFor, parseGuidance, parseLimits, plainOf, runsOf } from "./content.js";
import { HAZARDS_PATH, panelFor, validateHazards } from "./hazards.js";
import { AI_DISCLOSURE, APP_NAME, KIND_LABELS, SCREENS, TEXT, statusLabel } from "./labels.js";
import { ensureProfiles, loadSample, resetToSample } from "./sample.js";
import { loadSettings, settingsByVersion } from "./settings.js";
import { openStore } from "./store.js";
import { downloadText, exportCsv, exportFileName, exportJson } from "./export.js";

const META = Object.freeze({ profile: "profile", limitsSeen: "limitsSeen" });
const OTHER_CONTEXT = "other_context";

const state = {
  store: null,
  settings: null,
  settingsSource: "",
  settingsFor: null,
  hazards: null,
  guidance: null,
  limits: { full: "", short: "" },
  profiles: [],
  profileId: null,
  readings: [],
  results: [],
  limitsSeen: false,
  offline: "",
  entryIndicator: null,
  gates: new Map(),
  flash: null,
};

let idCounter = 0;
function nextId(prefix) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

// ---------- building the page ----------

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === "class") node.className = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice("on".length), value);
    else if (value === true) node.setAttribute(key, "");
    else node.setAttribute(key, String(value));
  }
  append(node, children);
  return node;
}

function append(node, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

// Text of an approved file, with its bold parts kept bold.
function rich(tag, props, text) {
  return el(tag, props, runsOf(text).map((run) => (run.bold ? el("strong", {}, run.text) : run.text)));
}

const CLASS = Object.freeze({
  h2: "text-2xl font-semibold tracking-tight outline-none",
  h3: "text-lg font-semibold",
  h4: "text-base font-semibold",
  lead: "mt-1 text-muted",
  card: "rounded-xl border border-rule bg-card p-4 shadow-sm sm:p-5",
  stack: "mt-4 grid gap-4",
  button: "inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 py-2 font-semibold text-onaccent hover:opacity-90",
  buttonSoft: "inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-soft px-4 py-2 font-semibold text-ink hover:bg-card",
  buttonAlert: "inline-flex min-h-11 items-center justify-center rounded-lg border-2 border-alertbar bg-alert px-4 py-2 font-semibold text-alertink hover:opacity-90",
  toggle: "flex min-h-11 w-full items-center gap-2 rounded-lg border border-line bg-soft px-3 py-2 text-left font-semibold text-ink hover:bg-card",
  input: "mt-1 block min-h-11 w-full rounded-lg border border-line bg-card px-3 py-2 text-ink",
  label: "block font-medium",
  hint: "text-sm text-muted",
  small: "text-sm text-muted",
  link: "font-semibold text-link underline underline-offset-2",
  message: "rounded-lg border-l-4 px-3 py-2",
  field: "block",
  row: "flex flex-wrap items-center gap-2",
  defTerm: "text-sm font-semibold text-muted",
});

const TONES = Object.freeze({
  ok: "border-okbar bg-ok text-okink",
  warn: "border-warnbar bg-warn text-warnink",
  alert: "border-alertbar bg-alert text-alertink",
  none: "border-plainbar bg-plain text-plainink",
});

function badge(status) {
  const label = statusLabel(status);
  return el(
    "span",
    { class: `inline-flex items-center gap-2 rounded-full border-2 px-3 py-1 text-base font-bold ${TONES[label.tone]}`, "data-status": status },
    el("span", { "aria-hidden": "true", class: "font-mono" }, label.symbol),
    el("span", {}, label.word),
  );
}

function message(tone, ...children) {
  return el("div", { class: `${CLASS.message} ${TONES[tone]}` }, children);
}

// A section that starts shut and opens with a keyboard-reachable button.
function disclosure({ title, describedBy, build, name }) {
  const regionId = nextId("region");
  const buttonId = nextId("toggle");
  const region = el("div", { id: regionId, role: "region", "aria-labelledby": describedBy ? `${buttonId} ${describedBy}` : buttonId, hidden: true });
  const chevron = el("span", { "aria-hidden": "true", class: "inline-block w-4 font-mono" }, "+");
  const button = el(
    "button",
    {
      id: buttonId,
      type: "button",
      class: CLASS.toggle,
      "aria-expanded": "false",
      "aria-controls": regionId,
      "aria-describedby": describedBy,
      "data-toggle": name,
      onclick: () => {
        const open = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", String(!open));
        chevron.textContent = open ? "+" : "−";
        if (!open && !region.hasChildNodes()) region.append(build());
        region.hidden = open;
      },
    },
    chevron,
    title,
  );
  return el("section", { class: "mt-3", "data-section": name }, button, region);
}

// ---------- the hazard panel (D-57) ----------

// Every string in the panel comes from Hazard_Links.json through hazards.js.
// The panel explains why a reading is watched. It is given no reading and no
// result, so it cannot change, colour or explain a status.
function hazardPanel(indicatorId, describedBy) {
  if (!state.hazards) return el("p", { class: `mt-3 ${CLASS.small}` }, TEXT.hazardsMissing);
  const panel = panelFor(state.hazards, indicatorId);
  if (!panel) return null;
  const piece = (tag, name, text, props = {}) => el(tag, { "data-hz": name, ...props }, text);
  const rating = (level) =>
    el(
      "span",
      { class: "inline-flex items-center gap-2 rounded-md border border-line bg-soft px-2 py-1 text-sm font-semibold text-ink" },
      piece("span", "symbol", level.symbol, { "aria-hidden": "true", class: "font-mono tracking-widest" }),
      piece("span", "closeness", level.closenessLabel),
    );
  const build = () =>
    el(
      "div",
      { class: "mt-2 rounded-lg border border-rule bg-page p-3", "data-hazard-panel": panel.indicator },
      piece("p", "intro", panel.intro),
      piece("p", "summary", panel.summary, { class: "mt-2 font-medium" }),
      el(
        "ul",
        { class: "mt-3 grid gap-2" },
        panel.hazards.map((hazard) =>
          el(
            "li",
            { class: "rounded-lg border border-rule bg-card p-3", "data-hazard": hazard.hazard, "data-closeness": hazard.closeness },
            el("div", { class: "flex flex-wrap items-center justify-between gap-2" }, piece("strong", "label", hazard.label), rating(hazard)),
            hazard.chain ? piece("p", "chain", hazard.chain, { class: "mt-2 text-sm" }) : null,
            piece("p", "source", hazard.diagram, { class: "mt-1 text-sm text-muted" }),
          ),
        ),
      ),
      el(
        "dl",
        { class: "mt-3 grid gap-1 text-sm", "data-hazard-key": "" },
        panel.key.map((level) =>
          el(
            "div",
            { class: "flex flex-wrap items-baseline gap-x-2" },
            el("dt", { class: "font-semibold" }, piece("span", "symbol", level.symbol, { "aria-hidden": "true", class: "mr-2 font-mono tracking-widest" }), piece("span", "closeness", level.closenessLabel)),
            level.closenessMeaning ? piece("dd", "meaning", level.closenessMeaning, { class: "text-muted" }) : null,
          ),
        ),
      ),
      piece("p", "limit", panel.limit, { class: "mt-3 border-l-4 border-line pl-3 font-medium" }),
    );
  return disclosure({ title: piece("span", "title", panel.title), describedBy, build, name: "hazards" });
}

// ---------- results ----------

function whenText(result) {
  return result.time ? `${result.date} ${result.time}` : result.date;
}

function line(term, ...content) {
  return el("div", {}, el("dt", { class: CLASS.defTerm }, term), el("dd", {}, content));
}

function resultBlock(result) {
  const settings = state.settingsFor?.(result.thresholdsVersion) ?? state.settings;
  const meaning = settings.meta.status_meaning?.[result.status];
  const reading = state.readings.find((entry) => entry.id === result.readingId);
  const lowest = settings.meta.status_levels[0];
  const also = result.also.filter((found) => found.status !== lowest);
  return el(
    "div",
    { "data-result": result.readingId, "data-result-status": result.status },
    el("div", { class: "mt-2 flex flex-wrap items-center gap-3" }, badge(result.status), result.value === null || result.value === undefined ? null : el("span", { class: "text-xl font-semibold", "data-result-value": "" }, String(result.value)), result.unit ? el("span", { class: CLASS.small, "data-result-unit": "" }, result.unit) : null, el("span", { class: CLASS.small }, whenText(result))),
    el(
      "dl",
      { class: "mt-3 grid gap-2" },
      line(TEXT.reason, el("span", { "data-result-reason": "" }, result.reason)),
      result.source_ids.length > 0 ? line(TEXT.sources, el("span", { "data-result-sources": "" }, result.source_ids.join(", "))) : null,
      meaning ? line(TEXT.whatToDo, el("span", { "data-result-meaning": "" }, meaning)) : null,
      result.notes.length > 0 ? line(TEXT.fromFile, el("ul", { class: "list-disc pl-5" }, result.notes.map((note) => el("li", {}, note)))) : null,
      also.length > 0
        ? line(
            TEXT.alsoFound,
            el("ul", { class: "list-disc pl-5" }, also.map((found) => el("li", {}, `${statusLabel(found.status).word}: ${found.reason}`, found.source_ids.length > 0 ? ` (${found.source_ids.join(", ")})` : ""))),
          )
        : null,
      reading && reading.symptoms?.length > 0 && result.kind !== KINDS.distress ? line(TEXT.readingSymptoms, reading.symptoms.join(", ")) : null,
      reading?.note ? line(TEXT.readingNote, reading.note) : null,
    ),
    reading?.acceptedOutsideRange ? el("p", { class: `mt-2 ${CLASS.small}` }, TEXT.acceptedOutside) : null,
    el("p", { class: `mt-2 ${CLASS.small}` }, `${TEXT.judgedWith} ${result.thresholdsVersion}.`),
  );
}

function guidanceBlock(indicator) {
  const section = state.guidance ? guidanceFor(state.guidance, indicator.label) : null;
  if (!section) return el("p", { class: CLASS.small }, TEXT.guidanceMissing);
  return el(
    "div",
    { class: "mt-2 rounded-lg border border-rule bg-page p-3", "data-guidance": indicator.id },
    rich("p", { class: "border-l-4 border-line pl-3 font-medium" }, state.guidance.standingLine),
    section.parts.map((part) =>
      el(
        "div",
        { class: "mt-3" },
        part.title ? el("h4", { class: CLASS.h4 }, part.title) : null,
        part.blocks.map((block) => {
          if (block.type === "p") return rich("p", { class: "mt-1" }, block.text);
          const listClass = block.type === "ol" ? "mt-1 list-decimal pl-6" : "mt-1 list-disc pl-6";
          return el(block.type, { class: listClass }, block.items.map((item) => rich("li", { class: item.nested ? "ml-5 list-disc" : "" }, item.text)));
        }),
      ),
    ),
  );
}

// ---------- shared pieces ----------

function latestOf(indicatorId, kind) {
  let latest = null;
  for (const result of state.results) {
    if (result.indicator !== indicatorId) continue;
    if (kind !== undefined && result.kind !== kind) continue;
    if (!latest || whenKey(result) >= whenKey(latest)) latest = result;
  }
  return latest;
}

function whenKey(result) {
  const reading = state.readings.find((entry) => entry.id === result.readingId);
  return [result.date, result.time, reading?.createdAt ?? ""].join("|");
}

function needProfile() {
  return el("div", { class: CLASS.card }, el("p", {}, TEXT.chooseFirst), el("p", { class: "mt-2" }, el("a", { class: CLASS.link, href: "#astronaut" }, TEXT.goToAstronaut)));
}

function screenTitle(text, lead) {
  return [el("h2", { class: CLASS.h2, tabindex: "-1", "data-screen-title": "" }, text), lead ? el("p", { class: CLASS.lead }, lead) : null];
}

function flashMessage() {
  if (!state.flash) return null;
  const flash = state.flash;
  state.flash = null;
  return el("div", { class: "mt-4", role: "status", "data-flash": "" }, message(flash.tone, flash.text));
}

// ---------- Today ----------

function renderToday() {
  if (!state.profileId) return [screenTitle(TEXT.todayTitle, TEXT.todayLead), needProfile()];
  return [
    screenTitle(TEXT.todayTitle, TEXT.todayLead),
    el(
      "div",
      { class: CLASS.stack },
      state.settings.indicators.map((indicator) => {
        const headingId = nextId("indicator");
        const kinds = indicator.weekly_phq2 ? Object.values(KINDS) : [undefined];
        const found = kinds.map((kind) => ({ kind, result: latestOf(indicator.id, kind) })).filter((entry) => entry.result);
        return el(
          "article",
          { class: CLASS.card, "data-indicator": indicator.id, "aria-labelledby": headingId },
          el("h3", { class: CLASS.h3, id: headingId }, indicator.label),
          found.length === 0
            ? el("p", { class: "mt-2 text-muted" }, `${TEXT.noReading} `, el("a", { class: CLASS.link, href: "#enter" }, TEXT.enterOne))
            : found.map((entry) => el("div", { class: "mt-2" }, entry.kind ? el("h4", { class: `${CLASS.h4} mt-3` }, KIND_LABELS[entry.kind]) : null, resultBlock(entry.result))),
          disclosure({ title: TEXT.guidanceTitle, describedBy: headingId, build: () => guidanceBlock(indicator), name: "guidance" }),
          hazardPanel(indicator.id, headingId),
        );
      }),
    ),
  ];
}

// ---------- Enter a reading ----------

function gateFor(name) {
  if (!state.gates.has(name)) state.gates.set(name, createGate());
  return state.gates.get(name);
}

function capital(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function rangeText(range, unit) {
  return `${TEXT.limits}: ${range.min} to ${range.max}${unit ? ` ${unit}` : ""}`;
}

function field(labelText, control, { hint, required } = {}) {
  const id = control.id || nextId("field");
  control.id = id;
  const hintId = hint ? `${id}-hint` : null;
  if (hintId) control.setAttribute("aria-describedby", hintId);
  if (required) control.setAttribute("aria-required", "true");
  return el(
    "div",
    { class: CLASS.field },
    el("label", { class: CLASS.label, for: id }, labelText, required ? el("span", { "aria-hidden": "true" }, ` ${TEXT.required}`) : null),
    control,
    hint ? el("p", { class: CLASS.hint, id: hintId }, hint) : null,
  );
}

function textInput(name, props = {}) {
  return el("input", { class: CLASS.input, name, type: "text", autocomplete: "off", ...props });
}

function numberInput(name) {
  return textInput(name, { inputmode: "decimal" });
}

function choiceGroup(legend, name, options, { required, hint, inline } = {}) {
  const hintId = hint ? nextId("hint") : null;
  return el(
    "fieldset",
    { class: "min-w-0", "aria-describedby": hintId },
    el("legend", { class: CLASS.label }, legend, required ? el("span", { "aria-hidden": "true" }, ` ${TEXT.required}`) : null),
    hint ? el("p", { class: CLASS.hint, id: hintId }, hint) : null,
    el(
      "div",
      { class: inline ? "mt-1 flex flex-wrap gap-2" : "mt-1 grid gap-1" },
      options.map((option) => {
        const id = nextId("choice");
        return el(
          "div",
          { class: "flex min-h-11 items-center gap-2 rounded-lg border border-line bg-card px-3" },
          el("input", { id, type: option.type ?? "radio", name, value: option.value, class: "h-5 w-5 accent-current" }),
          el("label", { for: id, class: "py-2" }, option.label),
        );
      }),
    ),
  );
}

function fieldName(fields, path) {
  const [head, index, part] = path.split(".");
  if (head === "value") return fields.indicator.label;
  if (head === "readings") return part ? `${TEXT.readingNumber} ${Number(index) + 1}, ${part}` : fields.indicator.label;
  if (head === "items") return fields.questions?.[Number(index)] ?? fields.indicator.label;
  const names = { date: TEXT.date, time: TEXT.time, note: TEXT.note, source: TEXT.source, method: TEXT.method, context: TEXT.context, profileId: TEXT.chooseAstronaut };
  return names[head] ?? head;
}

function problemText(fields, entry, outcome) {
  const name = fieldName(fields, entry.field);
  switch (entry.problem) {
    case PROBLEMS.missing:
      return `${name} ${TEXT.problemMissing}`;
    case PROBLEMS.notANumber:
      return `${name} ${TEXT.problemNotANumber}`;
    case PROBLEMS.outside: {
      const part = entry.field.split(".").pop();
      const range = fields.parts ? fields.partRanges[part] : fields.range;
      const limits = range ? ` ${rangeText(range, fields.indicator.unit)}.` : "";
      return `${name} ${TEXT.problemOutside}${limits}${outcome.repeatAccepts ? ` ${TEXT.problemOutsideRepeat}` : ""}`;
    }
    case PROBLEMS.offScale:
      return `${name} ${TEXT.problemOffScale}`;
    case PROBLEMS.contextRefused:
      return `${fields.indicator.label} ${TEXT.problemRefused} ${fields.indicator.measurement}`;
    case ENTRY_PROBLEMS.future:
      return `${name} ${TEXT.problemFuture}`;
    case ENTRY_PROBLEMS.tooLong:
      return `${name} ${TEXT.problemTooLong}`;
    default:
      return `${name} ${TEXT.problemInvalid}`;
  }
}

function outcomeBox(fields, outcome) {
  const refused = outcome.outcome === OUTCOMES.refused;
  return el(
    "div",
    { "data-outcome": outcome.outcome },
    message(
      refused ? "alert" : "warn",
      el("p", { class: "font-semibold" }, refused ? TEXT.refused : TEXT.askAgain),
      el("ul", { class: "mt-1 list-disc pl-5" }, outcome.problems.map((entry) => el("li", { "data-problem": `${entry.field}:${entry.problem}` }, problemText(fields, entry, outcome)))),
    ),
  );
}

// Saves an accepted reading and returns its result, judged against the earlier readings.
async function saveReading(reading) {
  await state.store.putReading(reading);
  await refreshReadings();
  return state.results.find((result) => result.readingId === reading.id);
}

function savedBox(text, result) {
  return el("div", { class: `${CLASS.card} mt-4`, "data-saved": "" }, el("p", { class: "font-semibold" }, text), resultBlock(result));
}

function dateAndTime() {
  const now = new Date();
  return el(
    "div",
    { class: "grid gap-4 sm:grid-cols-2" },
    field(TEXT.date, el("input", { class: CLASS.input, name: "date", type: "date", value: localDate(now), max: localDate(now) }), { required: true }),
    field(TEXT.time, el("input", { class: CLASS.input, name: "time", type: "time", value: localTime(now) })),
  );
}

function renderEnter() {
  if (!state.profileId) return [screenTitle(TEXT.enterTitle, TEXT.enterLead), needProfile()];
  const indicators = state.settings.indicators;
  if (!indicatorOf(state.settings, state.entryIndicator)) state.entryIndicator = indicators[0].id;
  const fields = fieldsFor(state.settings, state.entryIndicator, KINDS.tap);
  const indicator = fields.indicator;
  const headingId = nextId("entry");
  const outcomeArea = el("div", { class: "mt-4", role: "alert", "aria-live": "assertive", "data-outcome-area": "" });

  const chooser = el(
    "select",
    {
      class: CLASS.input,
      name: "indicator",
      onchange: (event) => {
        state.entryIndicator = event.target.value;
        render({ keepFocus: "select[name=indicator]" });
      },
    },
    indicators.map((entry) => el("option", { value: entry.id, selected: entry.id === indicator.id }, entry.label)),
  );

  const valueFields = [];
  if (fields.parts) {
    for (let index = 0; index < fields.readingsPerEntry; index += 1) {
      valueFields.push(
        el(
          "fieldset",
          { class: "rounded-lg border border-rule p-3" },
          el("legend", { class: `${CLASS.label} px-1` }, `${TEXT.readingNumber} ${index + 1}`),
          el(
            "div",
            { class: "grid gap-4 sm:grid-cols-2" },
            fields.parts.map((part) => field(`${capital(part)} (${indicator.unit})`, numberInput(`readings.${index}.${part}`), { required: true, hint: rangeText(fields.partRanges[part], indicator.unit) })),
          ),
        ),
      );
    }
    valueFields.push(el("p", { class: CLASS.hint }, TEXT.secondReadingHint));
  } else if (fields.scale) {
    valueFields.push(choiceGroup(TEXT.moodScaleLegend, "value", fields.scale.map((value) => ({ value, label: String(value) })), { required: true, inline: true }));
  } else {
    valueFields.push(field(`${indicator.label} (${indicator.unit})`, numberInput("value"), { required: true, hint: rangeText(fields.range, indicator.unit) }));
  }
  if (fields.contexts) {
    valueFields.push(choiceGroup(TEXT.context, "context", [{ value: fields.contexts[0], label: TEXT.contextYes }, { value: OTHER_CONTEXT, label: TEXT.contextNo }], { required: true }));
  }
  if (fields.source) {
    const labels = [TEXT.sourceDevice, TEXT.sourceCount];
    valueFields.push(choiceGroup(TEXT.source, "source", fields.source.map((value, index) => ({ value, label: labels[index] ?? value })), { required: true }));
  }
  if (fields.meter) valueFields.push(field(TEXT.meter, textInput("meter", { maxlength: NOTE_MAX })));
  if (fields.method) {
    valueFields.push(
      choiceGroup(TEXT.method, "method", [{ value: fields.method.judged, label: `${TEXT.methodJudged} (${fields.method.judged})` }, { value: fields.method.other, label: TEXT.methodOther }], { required: true }),
      field(TEXT.methodName, textInput("methodName", { maxlength: NOTE_MAX })),
    );
  }

  const form = el(
    "form",
    {
      class: `${CLASS.card} mt-4 grid gap-4`,
      novalidate: true,
      "aria-labelledby": headingId,
      "data-entry-form": indicator.id,
      onsubmit: async (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const text = (name) => String(data.get(name) ?? "");
        const draft = {
          profileId: state.profileId,
          indicator: indicator.id,
          kind: fields.kind,
          date: text("date"),
          time: text("time"),
          note: text("note"),
          symptoms: data.getAll("symptoms").map(String),
          value: text("value"),
          context: text("context"),
          source: text("source"),
          meter: text("meter"),
          method: text("method"),
          methodName: text("methodName"),
        };
        if (fields.parts) {
          draft.readings = [];
          for (let index = 0; index < fields.readingsPerEntry; index += 1) {
            draft.readings.push(Object.fromEntries(fields.parts.map((part) => [part, text(`readings.${index}.${part}`)])));
          }
        }
        const outcome = gateFor(indicator.id).submit(state.settings, draft, { now: new Date() });
        outcomeArea.replaceChildren();
        if (outcome.outcome !== OUTCOMES.accepted) {
          outcomeArea.append(outcomeBox(fields, outcome));
          return;
        }
        const result = await saveReading(outcome.reading);
        form.reset();
        outcomeArea.append(savedBox(TEXT.saved, result));
      },
    },
    el("h3", { class: CLASS.h3, id: headingId }, indicator.label),
    indicator.measurement ? el("p", { class: CLASS.small }, `${TEXT.howToMeasure}: ${indicator.measurement}`) : null,
    valueFields,
    fields.symptoms.length > 0 ? choiceGroup(TEXT.symptoms, "symptoms", fields.symptoms.map((symptom) => ({ value: symptom, label: symptom, type: "checkbox" })), { hint: TEXT.symptomsHint }) : null,
    dateAndTime(),
    field(TEXT.note, el("textarea", { class: CLASS.input, name: "note", rows: "2", maxlength: NOTE_MAX }), { hint: TEXT.noteHint }),
    el("div", {}, el("button", { type: "submit", class: CLASS.button }, TEXT.save)),
  );

  return [
    screenTitle(TEXT.enterTitle, TEXT.enterLead),
    el("div", { class: `${CLASS.card} mt-4` }, field(TEXT.indicator, chooser)),
    form,
    outcomeArea,
    el("div", { class: `${CLASS.card} mt-4`, "data-indicator": indicator.id }, el("h3", { class: CLASS.h3, id: `${headingId}-why` }, indicator.label), hazardPanel(indicator.id, `${headingId}-why`)),
  ];
}

// ---------- History ----------

function renderHistory() {
  if (!state.profileId) return [screenTitle(TEXT.historyTitle, TEXT.historyLead), needProfile()];
  const byDate = new Map();
  for (const result of state.results) {
    if (!byDate.has(result.date)) byDate.set(result.date, []);
    byDate.get(result.date).push(result);
  }
  const dates = [...byDate.keys()].sort().reverse();
  const order = state.settings.indicators.map((indicator) => indicator.id);
  const item = (result) => {
    const indicator = indicatorOf(state.settings, result.indicator);
    const confirmArea = el("div", { class: "mt-2", role: "status" });
    const remove = el(
      "button",
      {
        type: "button",
        class: CLASS.buttonSoft,
        "aria-label": `${TEXT.remove}: ${indicator.label}, ${whenText(result)}`,
        "data-delete": result.readingId,
        onclick: () => {
          confirmArea.replaceChildren(
            message(
              "warn",
              el("p", {}, TEXT.removeAsk),
              el(
                "div",
                { class: `${CLASS.row} mt-2` },
                el(
                  "button",
                  {
                    type: "button",
                    class: CLASS.button,
                    "data-delete-yes": result.readingId,
                    onclick: async () => {
                      await state.store.deleteReading(result.readingId);
                      await refreshReadings();
                      state.flash = { tone: "ok", text: TEXT.removed };
                      render();
                    },
                  },
                  TEXT.removeYes,
                ),
                el("button", { type: "button", class: CLASS.buttonSoft, onclick: () => confirmArea.replaceChildren() }, TEXT.cancel),
              ),
            ),
          );
        },
      },
      TEXT.remove,
    );
    return el(
      "li",
      { class: "rounded-lg border border-rule bg-card p-3", "data-history-item": result.readingId },
      el("h4", { class: CLASS.h4 }, indicator.label, result.kind && result.kind !== KINDS.tap ? ` – ${KIND_LABELS[result.kind]}` : ""),
      resultBlock(result),
      el("div", { class: "mt-2" }, remove),
      confirmArea,
    );
  };
  return [
    screenTitle(TEXT.historyTitle, TEXT.historyLead),
    flashMessage(),
    dates.length === 0
      ? el("div", { class: `${CLASS.card} mt-4` }, el("p", {}, TEXT.historyEmpty))
      : dates.map((date) =>
          el(
            "section",
            { class: "mt-6", "data-history-day": date },
            el("h3", { class: CLASS.h3 }, date),
            el(
              "ul",
              { class: "mt-2 grid gap-2" },
              byDate
                .get(date)
                .sort((a, b) => order.indexOf(a.indicator) - order.indexOf(b.indicator) || (whenKey(a) < whenKey(b) ? -1 : 1))
                .map(item),
            ),
          ),
        ),
  ];
}

// ---------- Mood check: the weekly PHQ-2 and the distress mark ----------

function renderMood() {
  if (!state.profileId) return [screenTitle(TEXT.moodTitle, TEXT.moodLead), needProfile()];
  const indicator = state.settings.indicators.find((entry) => entry.weekly_phq2);
  if (!indicator) return [screenTitle(TEXT.moodTitle, TEXT.moodLead)];
  const weekly = indicator.weekly_phq2;
  const fields = fieldsFor(state.settings, indicator.id, KINDS.phq2);
  const outcomeArea = el("div", { class: "mt-4", role: "alert", "aria-live": "assertive", "data-outcome-area": "weekly" });
  const distressArea = el("div", { class: "mt-4", role: "alert", "aria-live": "assertive", "data-outcome-area": "distress" });
  const weeklyId = nextId("weekly");
  const distressId = nextId("distress");

  const form = el(
    "form",
    {
      class: `${CLASS.card} mt-4 grid gap-4`,
      novalidate: true,
      "aria-labelledby": weeklyId,
      "data-weekly-form": "",
      onsubmit: async (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const draft = {
          profileId: state.profileId,
          indicator: indicator.id,
          kind: KINDS.phq2,
          date: String(data.get("date") ?? ""),
          time: String(data.get("time") ?? ""),
          items: fields.questions.map((_, index) => String(data.get(`items.${index}`) ?? "")),
        };
        const outcome = gateFor(KINDS.phq2).submit(state.settings, draft, { now: new Date() });
        outcomeArea.replaceChildren();
        if (outcome.outcome !== OUTCOMES.accepted) {
          outcomeArea.append(outcomeBox(fields, outcome));
          return;
        }
        const result = await saveReading(outcome.reading);
        form.reset();
        outcomeArea.append(savedBox(TEXT.saved, result));
      },
    },
    el("h3", { class: CLASS.h3, id: weeklyId }, TEXT.weeklyTitle),
    weekly.licence_note ? el("p", { class: CLASS.small }, weekly.licence_note) : null,
    weekly.window ? el("p", {}, `${TEXT.weeklyWindow} ${weekly.window}:`) : null,
    fields.questions.map((question, index) =>
      choiceGroup(question, `items.${index}`, fields.answers.map((answer) => ({ value: answer.value, label: answer.text ? `${answer.value} – ${answer.text}` : String(answer.value) })), { required: true }),
    ),
    dateAndTime(),
    el("div", {}, el("button", { type: "submit", class: CLASS.button }, TEXT.weeklySave)),
  );

  const distress = el(
    "section",
    { class: `${CLASS.card} mt-4`, "aria-labelledby": distressId },
    el("h3", { class: CLASS.h3, id: distressId }, TEXT.distressTitle),
    rich("p", { class: "mt-1" }, state.limits.short),
    el(
      "div",
      { class: "mt-3" },
      el(
        "button",
        {
          type: "button",
          class: CLASS.buttonAlert,
          "data-distress": "",
          onclick: async () => {
            const now = new Date();
            const draft = { profileId: state.profileId, indicator: indicator.id, kind: KINDS.distress, date: localDate(now), time: localTime(now) };
            const outcome = gateFor(KINDS.distress).submit(state.settings, draft, { now });
            distressArea.replaceChildren();
            if (outcome.outcome !== OUTCOMES.accepted) return;
            const result = await saveReading(outcome.reading);
            distressArea.append(savedBox(TEXT.distressSaved, result));
          },
        },
        TEXT.distressButton,
      ),
    ),
  );

  const whyId = nextId("mood-why");
  return [
    screenTitle(TEXT.moodTitle, TEXT.moodLead),
    form,
    outcomeArea,
    distress,
    distressArea,
    el("div", { class: `${CLASS.card} mt-4`, "data-indicator": indicator.id }, el("h3", { class: CLASS.h3, id: whyId }, indicator.label), hazardPanel(indicator.id, whyId)),
  ];
}

// ---------- Astronaut and data ----------

function renderAstronaut() {
  const confirmArea = el("div", { class: "mt-3", role: "status" });
  const busy = async (button, work) => {
    button.disabled = true;
    try {
      await work();
    } finally {
      button.disabled = false;
    }
  };
  const options = { fetchText, store: state.store, settings: state.settings };
  const chosen = state.profiles.find((profile) => profile.id === state.profileId);

  const chooser = el(
    "fieldset",
    { class: `${CLASS.card} mt-4` },
    el("legend", { class: `${CLASS.h3} px-1` }, TEXT.chooseAstronaut),
    el(
      "div",
      { class: "mt-2 grid gap-2 sm:grid-cols-2" },
      state.profiles.map((profile) => {
        const id = nextId("profile");
        return el(
          "div",
          { class: "flex min-h-11 items-center gap-2 rounded-lg border border-line bg-card px-3" },
          el("input", {
            id,
            type: "radio",
            name: "profile",
            value: profile.id,
            class: "h-5 w-5 accent-current",
            checked: profile.id === state.profileId,
            onchange: async () => {
              await chooseProfile(profile.id);
              render({ keepFocus: `input[name=profile][value="${profile.id}"]` });
            },
          }),
          el("label", { for: id, class: "py-2" }, `${profile.id} – ${profile.label}`),
        );
      }),
    ),
    chosen ? el("p", { class: `mt-3 ${CLASS.small}`, "data-reading-count": state.readings.length }, `${TEXT.chosen}: ${chosen.id}. ${state.readings.length} ${TEXT.readingsStored}.`) : null,
  );

  const loadButton = el(
    "button",
    {
      type: "button",
      class: CLASS.button,
      "data-load-sample": "",
      onclick: () =>
        busy(loadButton, async () => {
          await loadSample(options);
          await refreshReadings();
          state.flash = { tone: "ok", text: TEXT.sampleLoaded };
          render({ keepFocus: "[data-load-sample]" });
        }),
    },
    TEXT.loadSample,
  );
  const resetButton = el(
    "button",
    {
      type: "button",
      class: CLASS.buttonSoft,
      "data-reset": "",
      onclick: () => {
        const yes = el(
          "button",
          {
            type: "button",
            class: CLASS.button,
            "data-reset-yes": "",
            onclick: () =>
              busy(yes, async () => {
                await resetToSample(options);
                state.gates.clear();
                await refreshReadings();
                state.flash = { tone: "ok", text: TEXT.resetDone };
                render({ keepFocus: "[data-reset]" });
              }),
          },
          TEXT.resetYes,
        );
        confirmArea.replaceChildren(message("warn", el("p", {}, TEXT.resetAsk), el("div", { class: `${CLASS.row} mt-2` }, yes, el("button", { type: "button", class: CLASS.buttonSoft, onclick: () => confirmArea.replaceChildren() }, TEXT.cancel))));
        yes.focus();
      },
    },
    TEXT.reset,
  );

  const exportNow = (kind) => {
    const profile = state.profiles.find((entry) => entry.id === state.profileId);
    const readings = sortReadings(state.readings);
    const date = localDate(new Date());
    if (kind === "json") {
      const text = exportJson({ profile, readings, results: state.results, settings: state.settings, hazardsVersion: state.hazards?.meta.version ?? null, exportedAt: new Date().toISOString() });
      downloadText(exportFileName(profile.id, date, "json"), text, "application/json");
    } else {
      downloadText(exportFileName(profile.id, date, "csv"), exportCsv({ readings, results: state.results }), "text/csv");
    }
    confirmArea.replaceChildren(message("ok", TEXT.exportDone));
  };

  return [
    screenTitle(TEXT.astronautTitle, TEXT.astronautLead),
    flashMessage(),
    chooser,
    el("section", { class: `${CLASS.card} mt-4` }, el("h3", { class: CLASS.h3 }, TEXT.dataTitle), el("p", { class: CLASS.small }, TEXT.synthetic), el("div", { class: `${CLASS.row} mt-3` }, loadButton, resetButton)),
    state.profileId
      ? el(
          "section",
          { class: `${CLASS.card} mt-4` },
          el("h3", { class: CLASS.h3 }, TEXT.exportTitle),
          el("p", { class: CLASS.small }, TEXT.exportLead),
          el("div", { class: `${CLASS.row} mt-3` }, el("button", { type: "button", class: CLASS.buttonSoft, "data-export": "json", onclick: () => exportNow("json") }, TEXT.exportJson), el("button", { type: "button", class: CLASS.buttonSoft, "data-export": "csv", onclick: () => exportNow("csv") }, TEXT.exportCsv)),
        )
      : null,
    confirmArea,
  ];
}

// ---------- About ----------

function renderAbout() {
  const hazardVersion = state.hazards ? state.hazards.meta.version : TEXT.hazardNotLoaded;
  return [
    screenTitle(TEXT.aboutTitle),
    el("section", { class: `${CLASS.card} mt-4`, "data-about": "limits" }, el("h3", { class: CLASS.h3 }, TEXT.limitsTitle), rich("p", { class: "mt-2", "data-limits-full": "" }, state.limits.full)),
    el("section", { class: `${CLASS.card} mt-4`, "data-about": "disclosure" }, el("h3", { class: CLASS.h3 }, TEXT.disclosureTitle), el("p", { class: "mt-2", "data-ai-disclosure": "" }, AI_DISCLOSURE)),
    el(
      "section",
      { class: `${CLASS.card} mt-4`, "data-about": "versions" },
      el("h3", { class: CLASS.h3 }, TEXT.versionsTitle),
      el("p", { class: "mt-2", "data-thresholds-version": state.settings.meta.version }, `${TEXT.thresholdVersion}: ${state.settings.meta.version}.`),
      state.settingsSource === "device" ? el("p", { class: CLASS.small }, TEXT.settingsFromDevice) : null,
      el("p", { class: "mt-2", "data-hazards-version": hazardVersion }, `${TEXT.hazardVersion}: ${hazardVersion}. ${TEXT.hazardDecision}`),
      el("p", { class: `mt-2 ${CLASS.small}` }, TEXT.sourcesText),
      state.offline ? el("p", { class: `mt-2 ${CLASS.small}`, "data-offline-state": "" }, state.offline) : null,
    ),
    el("section", { class: `${CLASS.card} mt-4`, "data-about": "privacy" }, el("h3", { class: CLASS.h3 }, TEXT.privacyTitle), el("p", { class: "mt-2" }, TEXT.privacyText), el("p", { class: "mt-2" }, TEXT.synthetic)),
    el("section", { class: `${CLASS.card} mt-4`, "data-about": "licence" }, el("h3", { class: CLASS.h3 }, TEXT.licenceTitle), el("p", { class: "mt-2" }, TEXT.licenceText), el("p", { class: "mt-2" }, TEXT.endorsementText)),
  ];
}

// ---------- first launch: the full limits statement, once ----------

function renderWelcome() {
  return [
    screenTitle(TEXT.welcomeTitle, TEXT.welcomeLead),
    el(
      "section",
      { class: `${CLASS.card} mt-4`, "data-welcome": "" },
      el("h3", { class: CLASS.h3 }, TEXT.limitsTitle),
      rich("p", { class: "mt-2", "data-limits-full": "" }, state.limits.full),
      el("p", { class: `mt-3 ${CLASS.small}` }, AI_DISCLOSURE),
      el(
        "div",
        { class: "mt-4" },
        el(
          "button",
          {
            type: "button",
            class: CLASS.button,
            "data-welcome-done": "",
            onclick: async () => {
              state.limitsSeen = true;
              await state.store.setMeta(META.limitsSeen, true);
              render();
            },
          },
          TEXT.welcomeButton,
        ),
      ),
    ),
  ];
}

// ---------- the frame: navigation, routing, data ----------

const RENDERERS = Object.freeze({
  today: renderToday,
  enter: renderEnter,
  history: renderHistory,
  mood: renderMood,
  astronaut: renderAstronaut,
  about: renderAbout,
});

const HOME_SCREEN = "today";
const PROFILE_SCREEN = "astronaut";
const ABOUT_SCREEN = "about";

function currentScreen() {
  const wanted = location.hash.replace("#", "");
  return RENDERERS[wanted] ? wanted : HOME_SCREEN;
}

// The address always names its screen, so choosing an astronaut never moves the page.
function settleAddress() {
  const wanted = location.hash.replace("#", "");
  if (RENDERERS[wanted]) return;
  history.replaceState(null, "", `#${state.profileId ? HOME_SCREEN : PROFILE_SCREEN}`);
}

function renderNav(screen) {
  const nav = document.getElementById("nav");
  nav.hidden = !state.limitsSeen;
  nav.replaceChildren(
    el(
      "ul",
      { class: "flex flex-wrap gap-2" },
      SCREENS.map((entry) =>
        el(
          "li",
          {},
          el(
            "a",
            {
              href: `#${entry.id}`,
              "aria-current": entry.id === screen ? "page" : null,
              class: entry.id === screen ? "inline-flex min-h-11 items-center rounded-lg bg-accent px-3 py-2 font-semibold text-onaccent" : "inline-flex min-h-11 items-center rounded-lg border border-line bg-card px-3 py-2 font-semibold text-ink hover:bg-soft",
            },
            entry.label,
          ),
        ),
      ),
    ),
  );
  const who = state.profiles.find((profile) => profile.id === state.profileId);
  document.getElementById("who").textContent = who ? `${who.id} – ${who.label}` : TEXT.noProfile;
}

function render({ keepFocus, focusTitle } = {}) {
  const main = document.getElementById("main");
  const screen = currentScreen();
  const label = SCREENS.find((entry) => entry.id === screen)?.label ?? "";
  renderNav(screen);
  main.setAttribute("data-screen", state.limitsSeen ? screen : "welcome");
  main.replaceChildren();
  append(main, state.limitsSeen ? RENDERERS[screen]() : renderWelcome());
  document.title = label ? `${label} – ${APP_NAME}` : APP_NAME;
  if (keepFocus) main.querySelector(keepFocus)?.focus();
  else if (focusTitle) main.querySelector("[data-screen-title]")?.focus();
}

async function refreshReadings() {
  state.readings = state.profileId ? await state.store.getReadings(state.profileId) : [];
  state.settingsFor = await settingsByVersion(state.store);
  state.results = judgeAll(state.settings, state.readings, state.settingsFor);
}

async function chooseProfile(id) {
  state.profileId = id;
  state.gates.clear();
  await state.store.setMeta(META.profile, id);
  await refreshReadings();
}

async function fetchFrom(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response;
}

async function fetchJson(path) {
  return (await fetchFrom(path)).json();
}

async function fetchText(path) {
  return (await fetchFrom(path)).text();
}

async function optional(work) {
  try {
    return await work();
  } catch {
    return null;
  }
}

async function registerOffline() {
  if (!("serviceWorker" in navigator)) {
    state.offline = TEXT.offlineUnavailable;
    return;
  }
  try {
    await navigator.serviceWorker.register("sw.js");
    await navigator.serviceWorker.ready;
    state.offline = TEXT.offlineReady;
    document.documentElement.setAttribute("data-offline-ready", "true");
  } catch {
    state.offline = TEXT.offlineUnavailable;
  }
  if (currentScreen() === ABOUT_SCREEN && state.limitsSeen) render();
}

async function start() {
  const main = document.getElementById("main");
  try {
    state.store = await openStore();
    const loaded = await loadSettings({ fetchJson, store: state.store });
    state.settings = loaded.settings;
    state.settingsSource = loaded.source;

    // The hazard file only explains. If it cannot be read, every status is the same without it.
    const hazards = await optional(() => fetchJson(HAZARDS_PATH));
    state.hazards = hazards && validateHazards(hazards).ok ? hazards : null;
    const guidance = await optional(() => fetchText(GUIDANCE_PATH));
    state.guidance = guidance ? parseGuidance(guidance) : null;
    const limits = await optional(() => fetchText(LIMITS_PATH));
    if (limits) state.limits = parseLimits(limits);
    const shortLine = document.getElementById("limits-line");
    if (state.limits.short) shortLine.textContent = plainOf(state.limits.short);
    else state.limits.short = shortLine.textContent.trim();
    if (!state.limits.full) state.limits.full = state.limits.short;

    state.profiles = await ensureProfiles({ fetchText, store: state.store, settings: state.settings });
    state.limitsSeen = Boolean(await state.store.getMeta(META.limitsSeen));
    const stored = await state.store.getMeta(META.profile);
    state.profileId = state.profiles.some((profile) => profile.id === stored) ? stored : null;
    await refreshReadings();

    settleAddress();
    window.addEventListener("hashchange", () => {
      settleAddress();
      render({ focusTitle: true });
    });
    render();
    document.documentElement.setAttribute("data-app-ready", "true");
    registerOffline();
  } catch (error) {
    main.replaceChildren(
      el("div", { class: CLASS.card, role: "alert", "data-boot-error": "" }, el("h2", { class: CLASS.h2 }, TEXT.bootFailed), el("p", { class: "mt-2" }, String(error?.message ?? error)), (error?.problems ?? []).length > 0 ? el("ul", { class: "mt-2 list-disc pl-5" }, error.problems.map((problem) => el("li", {}, problem))) : null, el("p", { class: "mt-2" }, TEXT.bootHint)),
    );
  }
}

start();
