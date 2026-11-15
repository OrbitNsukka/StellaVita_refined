// Test helpers: read the repository's files. Tests may quote numbers; the app may not.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const APP = join(ROOT, "app");
export const DATA = join(APP, "data");

export function readText(...parts) {
  return readFileSync(join(ROOT, ...parts), "utf8");
}

export function readJson(...parts) {
  return JSON.parse(readText(...parts));
}

export function loadThresholds() {
  return readJson("app", "data", "Indicator_Thresholds.json");
}

export function loadHazards() {
  return readJson("app", "data", "Hazard_Links.json");
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

// A plain CSV reader for the two test fixtures (no quoted commas in either header).
export function readCsvRows(...parts) {
  const lines = readText(...parts).split(/\r?\n/).filter((line) => line.length > 0);
  const header = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    return Object.fromEntries(header.map((name, index) => [name, cells[index] ?? ""]));
  });
}

function splitCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cell += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { cells.push(cell); cell = ""; }
    else cell += ch;
  }
  cells.push(cell);
  return cells;
}

export function listFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
}

export function relativeToRoot(path) {
  return relative(ROOT, path).split("\\").join("/");
}
