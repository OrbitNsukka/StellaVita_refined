// The compiled Tailwind CSS (L-01, D-58) and the contrast check (refined brief, step 5).
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkTheme, contrastRatio, loadTheme } from "../tools/contrast.mjs";
import { APP, ROOT, listFiles, readJson, readText } from "./helpers/files.js";

const css = readText("app", "css", "app.css");
const theme = loadTheme();

test("contrast arithmetic follows WCAG", () => {
  assert.equal(Math.round(contrastRatio("#000000", "#ffffff")), 21);
  assert.equal(contrastRatio("#777777", "#777777"), 1);
  assert.equal(contrastRatio("#767676", "#ffffff").toFixed(2), "4.54");
});

test("text contrast is at least 4.5:1, and borders and the focus ring at least 3:1, in light and dark", () => {
  const rows = checkTheme(theme);
  assert.equal(rows.length, theme.pairs.length * 2);
  const failed = rows.filter((row) => !row.pass).map((row) => `${row.scheme}: ${row.fg} on ${row.bg} is ${row.ratio.toFixed(2)}:1, needs ${row.minimum}:1`);
  assert.deepEqual(failed, []);
  const textPairs = theme.pairs.filter(([, , minimum]) => minimum >= 4.5);
  assert.ok(textPairs.length >= 10);
  assert.ok(theme.pairs.every(([, , minimum]) => minimum === 4.5 || minimum === 3));
});

test("every colour the screens use is a theme colour, and every text colour is in a checked pair", () => {
  const names = Object.keys(theme.light);
  assert.deepEqual(Object.keys(theme.dark), names);
  const sources = [...listFiles(join(APP, "js")), join(APP, "index.html")].map((file) => readFileSync(file, "utf8")).join("\n");
  const used = new Set();
  for (const match of sources.matchAll(/(?<![\w-])(?:hover:)?(text|bg|border)-([a-z]+)(?![\w-])/g)) {
    if (names.includes(match[2])) used.add(`${match[1]}-${match[2]}`);
  }
  const palette = /(?<![\w-])(text|bg|border|ring|outline|fill|stroke)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(-\d+)?(?![\w-])/;
  assert.doesNotMatch(sources, palette, "no Tailwind palette colour is used directly: only the checked theme colours");
  const checkedText = new Set(theme.pairs.map(([fg]) => fg));
  for (const entry of used) {
    const [kind, name] = entry.split("-");
    if (kind === "text") assert.ok(checkedText.has(name), `text-${name} is in a checked pair`);
  }
  assert.ok(used.has("text-ink") && used.has("bg-card") && used.has("text-okink") && used.has("bg-alert"));
});

test("the compiled CSS is committed, holds the theme in both schemes and asks for nothing from another site", () => {
  assert.ok(css.length > 5000);
  assert.match(css, /tailwindcss v3\.4\.17 \| MIT License/);
  assert.match(css, /--sv-page:243 245 250/);
  assert.match(css, /prefers-color-scheme:dark/);
  assert.match(css, /:focus-visible\{outline:3px solid rgb\(var\(--sv-focus\)\)/);
  assert.doesNotMatch(css, /@import/);
  assert.doesNotMatch(css, /url\(/, "no font, image or other file is fetched by the CSS");
  const withoutLicenceComment = css.replace(/\/\*![^*]*\*\//g, "");
  assert.doesNotMatch(withoutLicenceComment, /https?:\/\//);
});

test("the page loads only the compiled file: no CDN and no runtime script", () => {
  const html = readText("app", "index.html");
  const sheets = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)].map((match) => match[0]);
  assert.deepEqual(sheets, ['<link rel="stylesheet" href="css/app.css">']);
  const scripts = [...html.matchAll(/<script[^>]*>/g)].map((match) => match[0]);
  assert.deepEqual(scripts, ['<script type="module" src="js/ui.js">']);
  assert.doesNotMatch(html, /tailwind/i);
  assert.doesNotMatch(html, /style=/, "no inline styles");
});

test("Tailwind is a dev dependency only, pinned to an exact version", () => {
  const pkg = readJson("package.json");
  assert.equal(pkg.devDependencies.tailwindcss, "3.4.17");
  assert.equal(pkg.dependencies, undefined, "the app has no runtime dependency");
  assert.equal(pkg.type, "module");
  assert.equal(pkg.license, "Apache-2.0");
  assert.equal(pkg.scripts.test, "node --test");
  assert.equal(pkg.scripts.check, "python reference/check.py");
  assert.match(pkg.scripts["build:css"], /src\/input\.css.*app\/css\/app\.css/);
  for (const withdrawn of ["express", "mongodb", "mongoose", "langchain", "@langchain/core", "@langchain/langgraph", "fastapi"]) {
    assert.equal(pkg.devDependencies[withdrawn], undefined, `${withdrawn} is withdrawn (D-55)`);
  }
});

const tailwind = join(ROOT, "node_modules", ".bin", process.platform === "win32" ? "tailwindcss.cmd" : "tailwindcss");

test("the committed CSS is what `npm run build:css` gives now", { skip: existsSync(tailwind) ? false : "Tailwind is not installed here (run npm install); the committed file was not rebuilt" }, () => {
  const dir = mkdtempSync(join(tmpdir(), "stellavita-css-"));
  try {
    const out = join(dir, "app.css");
    execFileSync(tailwind, ["-c", "tailwind.config.js", "-i", "src/input.css", "-o", out, "--minify"], { cwd: ROOT, stdio: "pipe" });
    assert.equal(readFileSync(out, "utf8"), css, "run `npm run build:css` and commit app/css/app.css");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
