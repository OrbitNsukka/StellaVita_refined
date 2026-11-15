// Offline and privacy, checked without a browser: the service worker's file
// list and version stamp are in step with the files, the app asks nothing of
// another site, and the manifest and icon are the team's own.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { appFiles, computeStamp, currentBlock, isStampCurrent, stampBlock } from "../tools/stamp_sw.mjs";
import { APP, listFiles, readJson, readText, relativeToRoot } from "./helpers/files.js";

const sw = readText("app", "sw.js");
const block = currentBlock(sw);
const version = /const VERSION = "([^"]+)";/.exec(block)[1];
const files = JSON.parse(/const FILES = (\[.*\]);/.exec(block)[1]);

test("the service worker's file list is every file of the app, and nothing else", () => {
  const onDisk = listFiles(APP).map((file) => relativeToRoot(file).replace(/^app\//, "")).filter((file) => file !== "sw.js").sort();
  assert.deepEqual(files, ["./", ...onDisk]);
  assert.deepEqual(appFiles(), onDisk);
  for (const file of files.slice(1)) assert.ok(existsSync(join(APP, file)), `${file} exists`);
});

test("the list holds the app shell, the compiled CSS and all six data files", () => {
  for (const needed of [
    "./", "index.html", "manifest.webmanifest", "css/app.css",
    "js/engine.js", "js/hazards.js", "js/settings.js", "js/entry.js", "js/store.js", "js/sample.js", "js/export.js", "js/labels.js", "js/content.js", "js/ui.js",
    "data/Indicator_Thresholds.json", "data/Hazard_Links.json", "data/Guidance_Content.md", "data/Limits_Statement.md",
    "data/synthetic_demo_data.csv", "data/synthetic_demo_data.meta.json",
    "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png",
  ]) {
    assert.ok(files.includes(needed), `${needed} is saved for offline use`);
  }
  assert.equal(files.filter((file) => file.startsWith("data/")).length, 6);
});

test("the version stamp is in step with the files (run `node tools/stamp_sw.mjs` after any change in app/)", () => {
  assert.equal(version, computeStamp());
  assert.equal(block, stampBlock());
  assert.ok(isStampCurrent());
  assert.match(version, /^[0-9a-f]{16}$/);
});

test("the stamp changes when a file changes or a file is added", async () => {
  const { cpSync, mkdtempSync, rmSync, writeFileSync, appendFileSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const dir = mkdtempSync(join(tmpdir(), "stellavita-stamp-"));
  try {
    cpSync(APP, dir, { recursive: true });
    assert.equal(computeStamp(dir), version);
    appendFileSync(join(dir, "js", "labels.js"), "\n");
    const changed = computeStamp(dir);
    assert.notEqual(changed, version);
    assert.equal(isStampCurrent(dir), false);
    writeFileSync(join(dir, "data", "extra.json"), "{}");
    assert.notEqual(computeStamp(dir), changed);
    assert.ok(stampBlock(dir).includes('"data/extra.json"'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the service worker is versioned, keeps to its own caches and refuses other sites", () => {
  assert.match(sw, /const CACHE_PREFIX = "stellavita-refined-";/);
  assert.match(sw, /name\.startsWith\(CACHE_PREFIX\) && name !== CACHE/);
  assert.match(sw, /origin !== self\.location\.origin\) \{\s*event\.respondWith\(Response\.error\(\)\);/);
  assert.match(sw, /cache\.addAll\(FILES\.map/);
  assert.doesNotMatch(sw, /https?:\/\//);
  assert.doesNotMatch(sw, /importScripts/);
});

const shellFiles = listFiles(APP).filter((file) => /\.(html|js|css|webmanifest|svg)$/.test(file));

test("no file of the app shell names another site, so nothing can be asked of one", () => {
  assert.ok(shellFiles.length >= 15);
  for (const file of shellFiles) {
    let text = readFileSync(file, "utf8");
    if (file.endsWith(".css")) text = text.replace(/\/\*![^*]*\*\//g, ""); // Tailwind's licence comment
    if (file.endsWith(".svg")) text = text.replace('xmlns="http://www.w3.org/2000/svg"', ""); // a name, not a request
    assert.doesNotMatch(text, /https?:\/\/|(?<![\w:])\/\/[\w-]+\.[a-z]{2,}/i, `${relativeToRoot(file)} names another site`);
  }
});

test("the code has no analytics, no beacons and no network call except reading its own files", () => {
  for (const file of shellFiles.filter((entry) => entry.endsWith(".js"))) {
    const text = readFileSync(file, "utf8");
    for (const word of ["XMLHttpRequest", "sendBeacon", "WebSocket", "EventSource", "RTCPeerConnection", "gtag", "analytics.js", "document.cookie", "localStorage", "sessionStorage"]) {
      assert.ok(!text.includes(word), `${relativeToRoot(file)} must not use ${word}`);
    }
  }
  const fetchers = shellFiles.filter((file) => file.endsWith(".js") && /\bfetch\(/.test(readFileSync(file, "utf8"))).map(relativeToRoot);
  assert.deepEqual(fetchers, ["app/js/ui.js", "app/sw.js"], "only the screen loader and the service worker fetch");
  const paths = ["settings", "hazards", "content", "sample"].map((name) => readText("app", "js", `${name}.js`)).join("\n");
  const asked = [...paths.matchAll(/_PATH = "([^"]+)"/g)].map((match) => match[1]).sort();
  assert.deepEqual(asked, ["data/Guidance_Content.md", "data/Hazard_Links.json", "data/Indicator_Thresholds.json", "data/Limits_Statement.md", "data/synthetic_demo_data.csv"]);
});

test("index.html uses relative paths only and a content security policy that allows the app's own files only", () => {
  const html = readText("app", "index.html");
  const references = [...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  assert.ok(references.length >= 5);
  for (const reference of references) {
    assert.doesNotMatch(reference, /^(?:[a-z]+:)?\/\//i, `${reference} is not relative`);
    assert.ok(!reference.startsWith("/"), `${reference} must not start at the site root: the app's address ends in /app/`);
    if (!reference.startsWith("#")) assert.ok(existsSync(join(APP, reference)), `${reference} exists`);
  }
  const policy = /http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(html)[1];
  assert.match(policy, /default-src 'self'/);
  assert.match(policy, /connect-src 'self'/);
  assert.match(policy, /script-src 'self'/);
  assert.doesNotMatch(policy, /unsafe-inline|unsafe-eval|https?:|\*/);
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
});

test("the JavaScript modules import only each other, by relative path", () => {
  for (const file of shellFiles.filter((entry) => entry.includes("/js/"))) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(/^\s*import\s[^;]*?from\s+"([^"]+)";/gm)) {
      assert.match(match[1], /^\.\/[a-z]+\.js$/, `${relativeToRoot(file)} imports ${match[1]}`);
      assert.ok(existsSync(join(APP, "js", match[1])), `${match[1]} exists`);
    }
    assert.doesNotMatch(text, /\bimport\s*\(/, `${relativeToRoot(file)} has no dynamic import`);
  }
});

test("the manifest: relative paths, the team's own icon, an AI notice", () => {
  const manifest = readJson("app", "manifest.webmanifest");
  assert.equal(manifest.name, "StellaVita");
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");
  assert.equal(manifest.display, "standalone");
  assert.match(manifest.description, /AI-generated \(D-44\)/);
  assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192") && manifest.icons.some((icon) => icon.sizes === "512x512"));
  assert.ok(manifest.icons.some((icon) => icon.purpose === "maskable"));
  for (const icon of manifest.icons) {
    assert.doesNotMatch(icon.src, /^(?:[a-z]+:)?\/\//i);
    assert.ok(existsSync(join(APP, icon.src)), `${icon.src} exists`);
  }
  const png = readFileSync(join(APP, "icons", "icon-512.png"));
  assert.equal(png.subarray(1, 4).toString("latin1"), "PNG");
  assert.equal(png.readUInt32BE(16), 512);
  assert.equal(png.readUInt32BE(20), 512);
});

test("the icon is the team's own simple design, with no agency name or mark in it", () => {
  const svg = readText("app", "icons", "icon.svg");
  assert.doesNotMatch(svg, /nasa|esa\b|meatball|insignia|<image|<text/i);
  assert.match(svg, /The team's own icon/);
  assert.doesNotMatch(svg, /href=/);
});

test("a .nojekyll file at the root lets GitHub Pages serve the files as they are", () => {
  assert.ok(existsSync(join(APP, "..", ".nojekyll")));
});
