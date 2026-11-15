// Export: the chosen astronaut's readings and results as JSON and CSV.
// A file download only. Nothing is uploaded.

export const EXPORT_NOTICE = "AI-generated app (D-44). Synthetic data only. Guidance, not a diagnosis.";

function resultsById(results) {
  return new Map(results.map((result) => [result.readingId, result]));
}

export function exportJson({ profile, readings, results, settings, hazardsVersion = null, exportedAt }) {
  return `${JSON.stringify({
    app: "StellaVita (refined build)",
    notice: EXPORT_NOTICE,
    exportedAt,
    thresholdsVersion: settings.meta.version,
    hazardLinksVersion: hazardsVersion,
    profile,
    readings,
    results,
  }, null, 2)}\n`;
}

export const CSV_COLUMNS = Object.freeze([
  "reading_id", "profile_id", "date", "time", "indicator", "kind", "value", "unit", "status",
  "reason", "source_ids", "rule", "thresholds_version", "symptoms", "note", "entered",
]);

// A cell that a spreadsheet could read as a formula gets a leading apostrophe.
function safeText(value) {
  const text = String(value ?? "");
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

function cell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.split('"').join('""')}"` : text;
}

export function enteredValue(reading) {
  if (Array.isArray(reading.readings)) {
    return reading.readings.map((entry) => Object.values(entry).join("/")).join(" then ");
  }
  if (Array.isArray(reading.items)) return reading.items.join("+");
  return reading.value ?? "";
}

export function exportCsv({ readings, results }) {
  const byId = resultsById(results);
  const lines = [CSV_COLUMNS.join(",")];
  for (const reading of readings) {
    const result = byId.get(reading.id) ?? {};
    lines.push([
      reading.id, reading.profileId, reading.date, reading.time ?? "", reading.indicator, reading.kind ?? "",
      result.value ?? "", result.unit ?? "", result.status ?? "", safeText(result.reason),
      (result.source_ids ?? []).join("; "), result.rule ?? "", result.thresholdsVersion ?? "",
      safeText((reading.symptoms ?? []).join("; ")), safeText(reading.note), safeText(enteredValue(reading)),
    ].map(cell).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function exportFileName(profileId, date, extension) {
  return `stellavita-${String(profileId).toLowerCase()}-${date}.${extension}`;
}

// Saves text as a file through the browser's own download. No request leaves the device.
export function downloadText(fileName, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
