// Writes the service worker's file list and version stamp (app/sw.js), so they
// stay in step with the files of the app. Run it after changing anything in app/:
//   node tools/stamp_sw.mjs          write the stamp
//   node tools/stamp_sw.mjs --check  only say whether the stamp is up to date
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const APP_DIR = fileURLToPath(new URL("../app/", import.meta.url));
export const SW_PATH = join(APP_DIR, "sw.js");
const BEGIN = "// BEGIN STAMP";
const END = "// END STAMP";

function walk(dir) {
  const found = [];
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) found.push(...walk(full));
    else found.push(full);
  }
  return found;
}

// Every file of the app except the service worker itself, as paths relative to app/.
export function appFiles(appDir = APP_DIR) {
  return walk(appDir)
    .map((file) => relative(appDir, file).split(sep).join("/"))
    .filter((file) => file !== "sw.js")
    .sort();
}

// The stamp changes when any file's name or content changes.
export function computeStamp(appDir = APP_DIR) {
  const hash = createHash("sha256");
  for (const file of appFiles(appDir)) {
    hash.update(file);
    hash.update("\0");
    hash.update(readFileSync(join(appDir, file)));
    hash.update("\0");
  }
  return hash.digest("hex").slice(0, 16);
}

export function stampBlock(appDir = APP_DIR) {
  const files = ["./", ...appFiles(appDir)];
  return [BEGIN, `const VERSION = ${JSON.stringify(computeStamp(appDir))};`, `const FILES = ${JSON.stringify(files)};`, END].join("\n");
}

export function currentBlock(source) {
  const start = source.indexOf(BEGIN);
  const end = source.indexOf(END);
  if (start < 0 || end < 0) throw new Error("app/sw.js has lost its stamp marks");
  return source.slice(start, end + END.length);
}

export function isStampCurrent(appDir = APP_DIR) {
  return currentBlock(readFileSync(join(appDir, "sw.js"), "utf8")) === stampBlock(appDir);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const source = readFileSync(SW_PATH, "utf8");
  const wanted = stampBlock();
  const same = currentBlock(source) === wanted;
  if (process.argv.includes("--check")) {
    console.log(same ? "app/sw.js is up to date" : "app/sw.js is OUT OF DATE: run node tools/stamp_sw.mjs");
    process.exit(same ? 0 : 1);
  }
  if (!same) writeFileSync(SW_PATH, source.replace(currentBlock(source), wanted));
  console.log(`${same ? "No change" : "Stamped"}: version ${computeStamp()}, ${appFiles().length + 1} entries`);
}
