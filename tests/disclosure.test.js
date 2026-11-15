// AI disclosure as changed by D-56: the notice is in the README, NOTICE,
// docs/AI_USE.md, every document the build wrote, the page's meta tags and the
// About screen. Code files do not need a header comment.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AI_DISCLOSURE } from "../app/js/labels.js";
import { APP, listFiles, readJson, readText, relativeToRoot } from "./helpers/files.js";

const NAMES_THE_AI = /AI assistant \(Claude,? (by )?Anthropic\)/;

test("README.md carries the AI notice at the top and points to docs/AI_USE.md", () => {
  const readme = readText("README.md");
  const top = readme.split("\n").slice(0, 8).join("\n");
  assert.match(top, /AI-generated project \(D-44\)/);
  assert.match(top, NAMES_THE_AI);
  assert.match(top, /docs\/AI_USE\.md/);
});

test("NOTICE carries the AI disclosure and the third-party libraries", () => {
  const notice = readText("NOTICE");
  assert.match(notice, /AI disclosure \(D-44\)/);
  assert.match(notice, /AI assistant \(Claude, by Anthropic\)/);
  assert.match(notice, /L-01\s+Tailwind CSS 3\.4\.17.*MIT License/s);
  assert.match(notice, /Apache License, Version 2\.0/);
});

test("docs/AI_USE.md says how AI was used and what people have not yet reviewed", () => {
  const text = readText("docs", "AI_USE.md");
  assert.match(text, NAMES_THE_AI);
  assert.match(text, /How AI was used/);
  assert.match(text, /has not yet been reviewed by a person/);
  assert.match(text, /It is not a source/);
});

const buildDocuments = ["AI_USE.md", "BUILD_REPORT.md", "DATA_MODEL.md", "HAZARD_PANEL.md", "ISSUES.md", "STATUS_RULES.md", "TECH_NOTES.md"];

test("every document the build wrote has an 'AI disclosure' line under its title", () => {
  for (const name of buildDocuments) {
    const head = readText("docs", name).split("\n").slice(0, 6).join("\n");
    assert.match(head, /^\*\*AI disclosure \(D-44, D-56\):\*\*/m, `docs/${name}`);
    assert.match(head, NAMES_THE_AI, `docs/${name}`);
    assert.match(head, /^# /, `docs/${name} starts with its title`);
  }
  for (const name of ["REFINED_BUILD_BRIEF.md", "CORE_ENGINE_BRIEF.md", "NASA_Sources.md"]) {
    assert.match(readText("docs", name), /\*\*AI disclosure \(D-44\):\*\*/, `docs/${name}`);
  }
});

test("index.html has the generator and ai-disclosure meta tags", () => {
  const html = readText("app", "index.html");
  const generator = /<meta name="generator" content="([^"]+)">/.exec(html);
  const disclosure = /<meta name="ai-disclosure" content="([^"]+)">/.exec(html);
  assert.ok(generator && disclosure);
  assert.match(generator[1], NAMES_THE_AI);
  assert.match(disclosure[1], /^AI-generated \(D-44\)/);
  assert.match(disclosure[1], NAMES_THE_AI);
});

test("the About screen shows the disclosure (and so does the first-launch screen)", () => {
  assert.match(AI_DISCLOSURE, /^AI-generated \(D-44\)/);
  assert.match(AI_DISCLOSURE, NAMES_THE_AI);
  const ui = readText("app", "js", "ui.js");
  const about = ui.slice(ui.indexOf("function renderAbout()"), ui.indexOf("function renderWelcome()"));
  assert.match(about, /AI_DISCLOSURE/);
  assert.match(about, /TEXT\.hazardVersion/);
  assert.match(ui.slice(ui.indexOf("function renderWelcome()")), /AI_DISCLOSURE/);
});

test("the About screen names the hazard file's version and D-57, the threshold version and the licence", async () => {
  const { TEXT } = await import("../app/js/labels.js");
  assert.match(TEXT.hazardDecision, /D-57/);
  assert.match(TEXT.hazardVersion, /Hazard_Links\.json/);
  assert.match(TEXT.thresholdVersion, /Indicator_Thresholds\.json/);
  assert.match(TEXT.licenceText, /Apache License 2\.0/);
});

test("the manifest, package.json and the theme file say they are AI-generated", () => {
  assert.match(readJson("app", "manifest.webmanifest").description, /AI-generated \(D-44\)/);
  assert.match(readJson("package.json").description, /AI-generated \(D-44\)/);
  assert.match(readJson("src", "theme.json").about, /AI-generated \(D-44\)/);
});

test("D-56: code files carry no 'AI-generated' header comment; the scripts in reference/ keep theirs", () => {
  for (const file of [...listFiles(join(APP, "js")), join(APP, "sw.js")]) {
    const firstLine = readFileSync(file, "utf8").split("\n")[0];
    assert.doesNotMatch(firstLine, /AI-generated/, relativeToRoot(file));
  }
  assert.match(readText("reference", "check.py"), /AI-generated \(D-44\)/);
  assert.match(readText("reference", "tools", "expected_colours.py"), /AI-generated \(D-44\)/);
  assert.match(readText("reference", "generate_synthetic_data.py"), /AI disclosure \(D-44\)/);
});
