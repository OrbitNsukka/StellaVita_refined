// The words shown on screen that are not health wording. Owned by Interface &
// Experience (D-53): change words here, never in the threshold file.
// Health wording (reasons, guidance, limits, hazard text) is never typed here:
// it is read from the files in data/.

// The threshold file's keys do not change; the screen shows these words (D-53).
// Each status has a word and a symbol as well as a colour: never colour alone.
export const STATUS_LABELS = Object.freeze({
  normal: Object.freeze({ word: "Normal", symbol: "✓", tone: "ok" }),
  warning: Object.freeze({ word: "Caution", symbol: "!", tone: "warn" }),
  contact: Object.freeze({ word: "Emergency", symbol: "!!", tone: "alert" }),
  not_judged: Object.freeze({ word: "Not compared", symbol: "–", tone: "none" }),
});

export function statusLabel(status) {
  return STATUS_LABELS[status] ?? STATUS_LABELS.not_judged;
}

export const APP_NAME = "StellaVita";

export const AI_DISCLOSURE =
  "AI-generated (D-44): this app, its synthetic data and its documents were written by an AI assistant (Claude, Anthropic) at the team leader's direction. The AI assistant is not a source, and it is not part of the running app.";

export const SCREENS = Object.freeze([
  Object.freeze({ id: "today", label: "Today" }),
  Object.freeze({ id: "enter", label: "Enter a reading" }),
  Object.freeze({ id: "history", label: "History" }),
  Object.freeze({ id: "mood", label: "Mood check" }),
  Object.freeze({ id: "astronaut", label: "Astronaut and data" }),
  Object.freeze({ id: "about", label: "About" }),
]);

export const KIND_LABELS = Object.freeze({
  tap: "Daily tap",
  phq2: "Weekly PHQ-2",
  distress: "Distress mark",
});

export const TEXT = Object.freeze({
  loading: "Loading…",
  bootFailed: "StellaVita could not start.",
  bootHint: "Open the app once with a network connection, so it can save itself for offline use.",
  noProfile: "No astronaut chosen",
  chooseFirst: "Choose an astronaut first.",
  goToAstronaut: "Go to Astronaut and data",
  synthetic: "Synthetic data only. Nothing leaves this device.",

  // first launch
  welcomeTitle: "Before you start",
  welcomeLead: "Please read this once. It is always available on the About screen.",
  welcomeButton: "I have read this",

  // today
  todayTitle: "Today",
  todayLead: "The latest result for each of the six indicators.",
  noReading: "No reading yet.",
  enterOne: "Enter a reading",
  value: "Reading",
  status: "Status",
  reason: "Reason",
  sources: "Sources",
  whatToDo: "What this status means",
  fromFile: "Note from the threshold file",
  alsoFound: "Also found",
  acceptedOutside: "This value is outside the app's entry limits. It was entered twice in a row, so it was accepted and judged (D-48).",
  readingSymptoms: "Symptoms recorded",
  readingNote: "Note",
  guidanceTitle: "Guidance",
  guidanceMissing: "The guidance text could not be loaded.",
  hazardsMissing: "The hazard panel could not be loaded. Statuses are not affected.",
  judgedWith: "Judged with threshold file version",

  // enter
  enterTitle: "Enter a reading",
  enterLead: "One reading at a time. Every field has a label; fields marked * are needed.",
  indicator: "Indicator",
  howToMeasure: "How to measure (from the threshold file)",
  date: "Date",
  time: "Time",
  note: "Note (optional)",
  noteHint: "At most 280 characters. Do not write names or other personal details.",
  symptoms: "Symptoms with this reading",
  symptomsHint: "Tick any that apply. Leave all empty if none.",
  readingNumber: "Reading",
  secondReadingHint: "Two readings one minute apart. Both are stored; the second is judged (D-49).",
  source: "How was it taken?",
  sourceDevice: "A device",
  sourceCount: "A 60-second count",
  meter: "Which meter was used? (optional)",
  method: "How was it taken?",
  methodJudged: "The mission's agreed method",
  methodOther: "Another method",
  methodName: "Which other method? (optional)",
  context: "Before a meal?",
  contextYes: "Yes, before a meal",
  contextNo: "No, after a meal",
  choose: "Choose…",
  save: "Save reading",
  saved: "Saved. This is the result.",
  askAgain: "Please check and enter again.",
  refused: "This reading was not saved.",
  required: "*",
  moodScaleLegend: "Today's tap",
  unit: "Unit",
  limits: "Entry limits",

  // problems
  problemMissing: "is needed.",
  problemNotANumber: "must be a number.",
  problemOutside: "is outside the entry limits.",
  problemOutsideRepeat: "If the reading really is this value, enter the same value again and it will be accepted and judged.",
  problemOffScale: "must be one of the answers offered.",
  problemInvalid: "is not valid.",
  problemFuture: "cannot be in the future.",
  problemTooLong: "is too long.",
  problemRefused: "is not accepted. From the threshold file:",

  // history
  historyTitle: "History",
  historyLead: "Every result for the chosen astronaut, newest day first.",
  historyEmpty: "No readings are stored for this astronaut.",
  remove: "Delete",
  removeAsk: "Delete this reading for good?",
  removeYes: "Yes, delete",
  cancel: "Cancel",
  removed: "The reading was deleted.",

  // mood check
  moodTitle: "Mood check",
  moodLead: "Support, not assessment. Private to this device.",
  weeklyTitle: "Weekly PHQ-2",
  weeklyWindow: "Thinking about the",
  weeklySave: "Save weekly answers",
  distressTitle: "Severe distress",
  distressButton: "I am in severe distress",
  distressSaved: "Marked. This is the result.",

  // astronaut and data
  astronautTitle: "Astronaut and data",
  astronautLead: "Four synthetic astronauts. A profile is a local choice: no name, no password, no account.",
  chooseAstronaut: "Choose an astronaut",
  chosen: "Chosen astronaut",
  readingsStored: "readings stored on this device for this astronaut",
  dataTitle: "Sample data",
  loadSample: "Load sample data",
  sampleLoaded: "Sample data loaded for all four astronauts.",
  reset: "Reset",
  resetAsk: "Reset wipes every reading on this device, for all four astronauts, and reloads the clean sample data. This cannot be undone.",
  resetYes: "Yes, reset",
  resetDone: "Reset done. The clean sample data is loaded.",
  exportTitle: "Export",
  exportLead: "Saves the chosen astronaut's readings and results as a file on this device. Nothing is uploaded.",
  exportJson: "Export as JSON",
  exportCsv: "Export as CSV",
  exportDone: "Export saved as a download.",

  // about
  aboutTitle: "About",
  limitsTitle: "Limits statement",
  disclosureTitle: "AI disclosure",
  versionsTitle: "Versions",
  thresholdVersion: "Threshold file (Indicator_Thresholds.json) version",
  hazardVersion: "Hazard links file (Hazard_Links.json) version",
  hazardDecision: "The hazard panel is shown under decision D-57. It explains why a reading is watched and never changes a status.",
  hazardNotLoaded: "not loaded",
  settingsFromDevice: "The threshold file could not be read just now. The copy stored on this device is in use.",
  privacyTitle: "Privacy",
  privacyText: "Everything you enter stays in this browser's storage on this device. The app has no accounts, no analytics and no outside fonts or scripts, and it makes no network request after it has saved itself for offline use.",
  licenceTitle: "Licence",
  licenceText: "Apache License 2.0. Copyright 2026 OrbitNsukka. Built for the NASA Space Apps Challenge 2026.",
  endorsementText: "NASA and other agencies are cited as sources only. This project is not affiliated with or endorsed by NASA, and it uses no NASA logos or mission marks.",
  sourcesText: "Source IDs such as S-27 are listed in docs/Sources.md in the project repository.",
  offlineReady: "Saved for offline use.",
  offlineUnavailable: "Offline use is not available in this browser or on this address.",
});
