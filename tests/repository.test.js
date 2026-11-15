// The rules that are never broken (CLAUDE.md), checked across the repository:
// fixed inputs unchanged, no personal information, synthetic data only, no
// agency branding, no stretch features, the layout of the refined brief.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { APP, ROOT, listFiles, readCsvRows, readJson, readText, relativeToRoot } from "./helpers/files.js";

function git(...args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

let firstCommit = null;
let gitSkip = false;
try {
  if (git("rev-parse", "--is-shallow-repository") === "true") gitSkip = "this is a shallow clone: the first commit is not here to compare with";
  else firstCommit = git("rev-list", "--max-parents=0", "HEAD").split("\n").pop();
} catch {
  gitSkip = "git is not available here; the fixed inputs were not compared with the first commit";
}

const FIXED = ["app/data", "reference", "tests/expected_colours.csv", "tests/expected_colours.meta.json"];

test("fixed inputs unchanged: nothing in app/data, reference/ or the expected statuses differs from the first commit", { skip: gitSkip }, () => {
  assert.equal(git("diff", "--stat", firstCommit, "--", ...FIXED), "", "committed changes");
  assert.equal(git("status", "--porcelain", "--", ...FIXED), "", "uncommitted changes or new files");
});

test("the fixed inputs are the versions the briefs name", () => {
  assert.equal(readJson("app", "data", "Indicator_Thresholds.json").meta.version, "0.4.0");
  assert.equal(readJson("app", "data", "Hazard_Links.json").meta.version, "1.0.0");
  assert.equal(readJson("tests", "expected_colours.meta.json").statuses, 720);
  assert.deepEqual(listFiles(join(APP, "data")).map((file) => relativeToRoot(file).replace("app/data/", "")), [
    "Guidance_Content.md", "Hazard_Links.json", "Indicator_Thresholds.json", "Limits_Statement.md",
    "synthetic_demo_data.csv", "synthetic_demo_data.meta.json",
  ]);
});

// The files the build wrote (the team's own documents are theirs to check).
function builtFiles() {
  const folders = ["app/css", "app/js", "app/icons", "src", "tools", "tests"];
  const single = ["app/index.html", "app/sw.js", "app/manifest.webmanifest", "README.md", "NOTICE", "package.json", "tailwind.config.js", ".gitignore",
    "docs/AI_USE.md", "docs/BUILD_REPORT.md", "docs/DATA_MODEL.md", "docs/HAZARD_PANEL.md", "docs/ISSUES.md", "docs/STATUS_RULES.md", "docs/TECH_NOTES.md"];
  const files = folders.flatMap((folder) => listFiles(join(ROOT, folder))).map(relativeToRoot);
  return [...files, ...single].filter((file) => !/\.png$/.test(file) && !file.startsWith("tests/expected_colours"));
}

test("no personal information: no e-mail address, phone number or member name in anything the build wrote", () => {
  const files = builtFiles();
  assert.ok(files.length > 40);
  for (const file of files) {
    const text = readFileSync(join(ROOT, file), "utf8");
    assert.doesNotMatch(text, /[\w.+-]+@[\w-]+\.[a-z]{2,}/i, `${file} holds an e-mail address`);
    assert.doesNotMatch(text, /\+?\d{3}[\s-]\d{3}[\s-]\d{4}/, `${file} holds something like a phone number`);
    assert.doesNotMatch(text, /\b[A-Z]\.[A-Z]\.(?![A-Z])/, `${file} holds a member's initials`);
  }
  for (const file of ["package.json", "app/manifest.webmanifest"]) {
    const author = JSON.parse(readFileSync(join(ROOT, file), "utf8")).author;
    if (author !== undefined) assert.equal(author, "OrbitNsukka");
  }
});

test("synthetic data only: every row of the demo data is a SYN- astronaut, and profiles have no name", () => {
  const rows = readCsvRows("app", "data", "synthetic_demo_data.csv");
  assert.ok(rows.every((row) => /^SYN-[A-D]$/.test(row.crew_id)));
  assert.match(readText("app", "js", "sample.js"), /\(synthetic\)/);
});

test("no agency branding: the only images are the team's own icon files", () => {
  const images = listFiles(ROOT)
    .map(relativeToRoot)
    .filter((file) => !file.startsWith("node_modules/") && !file.startsWith(".git/"))
    .filter((file) => /\.(png|jpe?g|gif|webp|svg|ico|bmp|avif)$/i.test(file));
  assert.deepEqual(images, ["app/icons/icon-192.png", "app/icons/icon-512.png", "app/icons/icon-maskable-512.png", "app/icons/icon.svg"]);
});

test("no stretch features: no charts, reminders, notifications or timers in the app", () => {
  for (const file of [...listFiles(join(APP, "js")), join(APP, "index.html")]) {
    const text = readFileSync(file, "utf8");
    for (const word of ["<canvas", "getContext(", "Notification", "showNotification", "PushManager", "setInterval", "requestAnimationFrame", "Chart"]) {
      assert.ok(!text.includes(word), `${relativeToRoot(file)} uses ${word}`);
    }
  }
});

test("the layout of the refined brief, section 4", () => {
  for (const file of [
    "app/index.html", "app/manifest.webmanifest", "app/sw.js", "app/css/app.css",
    "app/js/engine.js", "app/js/hazards.js", "app/js/settings.js", "app/js/entry.js", "app/js/store.js", "app/js/sample.js",
    "app/js/export.js", "app/js/labels.js", "app/js/content.js", "app/js/ui.js",
    "app/icons/icon.svg", "src/input.css", "reference/check.py", "reference/generate_synthetic_data.py", "reference/tools/expected_colours.py",
    "tests/expected_colours.csv", ".nojekyll", "LICENSE", "NOTICE", "README.md", "CLAUDE.md", "package.json",
    "docs/DATA_MODEL.md", "docs/STATUS_RULES.md", "docs/HAZARD_PANEL.md", "docs/TECH_NOTES.md", "docs/ISSUES.md", "docs/AI_USE.md", "docs/BUILD_REPORT.md",
  ]) {
    assert.ok(existsSync(join(ROOT, file)), `${file} exists`);
  }
  assert.deepEqual(listFiles(join(APP, "js")).map((file) => relativeToRoot(file).replace("app/js/", "")), [
    "content.js", "engine.js", "entry.js", "export.js", "hazards.js", "labels.js", "sample.js", "settings.js", "store.js", "ui.js",
  ]);
  assert.match(readText("LICENSE"), /Apache License\s+Version 2\.0/);
});

test("the libraries are logged where the brief asks: TECH_NOTES, Sources.md section 4 and NOTICE", () => {
  assert.match(readText("docs", "TECH_NOTES.md"), /\| L-01 \| Tailwind CSS \(Tailwind Labs, Inc\.\) \| 3\.4\.17 \| MIT \|/);
  const sources = readText("docs", "Sources.md");
  const section = sources.slice(sources.indexOf("## 4. Libraries, tools and datasets"), sources.indexOf("## 5. Claim-to-source map"));
  assert.match(section, /\| L-01 \| Tailwind CSS 3\.4\.17 \|.*\| MIT/);
  assert.match(readText("NOTICE"), /Third-party libraries[\s\S]*L-01\s+Tailwind CSS 3\.4\.17/);
  const lock = readJson("package-lock.json");
  assert.equal(lock.packages["node_modules/tailwindcss"].version, "3.4.17");
});
