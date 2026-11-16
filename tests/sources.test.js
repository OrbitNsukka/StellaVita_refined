// docs/NASA_Sources.md states every NASA resource the project uses. This test
// keeps it in step with docs/Sources.md and with the files the app reads.
import test from "node:test";
import assert from "node:assert/strict";
import { loadHazards, readText } from "./helpers/files.js";

const sourcesText = readText("docs", "Sources.md");
const nasaText = readText("docs", "NASA_Sources.md");

// Every S-row of the team's sources file: { id, title, publisher, status }.
const sourceRows = new Map();
for (const line of sourcesText.split("\n")) {
  if (!line.startsWith("| S-")) continue;
  const cells = line.trim().replace(/^\|/, "").replace(/\|$/, "").split(" | ").map((cell) => cell.trim());
  sourceRows.set(cells[0], { id: cells[0], title: cells[1], publisher: cells[2], status: cells[cells.length - 1] });
}
const isNasa = (row) => /nasa/i.test(row.publisher) || /nasa\.gov|spaceappschallenge/i.test(row.title);
const nasaIds = [...sourceRows.values()].filter(isNasa).map((row) => row.id);

// Every S-row of the NASA page, with the section it sits in.
const listed = [];
let section = "";
for (const line of nasaText.split("\n")) {
  const heading = /^## (\d)\. /.exec(line);
  if (heading) section = heading[1];
  const row = /^\| (S-\d+) \|/.exec(line);
  if (row) {
    const cells = line.trim().replace(/^\|/, "").replace(/\|$/, "").split(" | ").map((cell) => cell.trim());
    listed.push({ id: row[1], section, resource: cells[1], status: cells[cells.length - 1] });
  }
}
const inSection = (number) => listed.filter((row) => row.section === number).map((row) => row.id);
const idsIn = (text) => new Set(text.match(/S-\d+/g) ?? []);

test("the NASA page lists every NASA row of docs/Sources.md, each exactly once", () => {
  assert.equal(nasaIds.length, 88);
  assert.deepEqual(listed.map((row) => row.id).sort(), [...nasaIds].sort());
  assert.equal(new Set(listed.map((row) => row.id)).size, listed.length, "no resource is listed twice");
});

test("section 1 holds exactly the NASA resources cited by a file the app reads", () => {
  const cited = new Set();
  for (const file of ["Indicator_Thresholds.json", "Hazard_Links.json", "Guidance_Content.md", "Limits_Statement.md"]) {
    for (const id of idsIn(readText("app", "data", file))) cited.add(id);
  }
  const citedNasa = [...cited].filter((id) => sourceRows.has(id) && isNasa(sourceRows.get(id))).sort();
  assert.deepEqual(inSection("1").sort(), citedNasa);
  assert.equal(citedNasa.length, 15);
  for (const id of cited) assert.ok(sourceRows.has(id), `${id} is cited by the app's data and has a row in docs/Sources.md`);
});

test("the six risk diagrams shown in the hazard panel are in section 1, with the links the hazard file names", () => {
  const hazards = loadHazards();
  const diagrams = [...new Set(hazards.links.map((link) => link.diagram))].sort();
  assert.deepEqual(diagrams, ["S-153", "S-154", "S-155", "S-156", "S-157", "S-158"]);
  for (const id of diagrams) {
    const row = listed.find((entry) => entry.id === id);
    assert.equal(row.section, "1");
    assert.ok(row.resource.includes(`(${hazards.meta.diagram_files_read[id]})`), `${id} links to the file the hazard file read`);
    const count = hazards.links.filter((link) => link.diagram === id).length;
    assert.match(nasaText.split("\n").find((line) => line.startsWith(`| ${id} |`)), new RegExp(`: ${count} of the 30 links`));
  }
});

test("sections 2 and 3 hold resources the documents cite; section 4 holds none that anything cites", () => {
  const claimMap = sourcesText.slice(sourcesText.indexOf("## 5. Claim-to-source map"), sourcesText.indexOf("## 6. Flags for Data & Science"));
  const documents = [
    readText("docs", "data-science", "Hazard_Links_Sheet_v2_Draft.md"),
    readText("docs", "data-science", "Hazard_Links_Sheet_D-25.md"),
    readText("docs", "data-science", "Indicator_Sheet.md"),
    claimMap,
  ];
  const cited = new Set(documents.flatMap((text) => [...idsIn(text)]));
  for (const id of inSection("2")) assert.ok(cited.has(id), `${id} is cited by a Data & Science sheet or the claim map`);
  for (const id of [...inSection("3"), ...inSection("4")]) assert.ok(!cited.has(id), `${id} is not cited by a sheet or the claim map`);
  assert.equal(inSection("2").length + inSection("3").length + inSection("4").length + inSection("1").length, 88);
});

test("each status is the one in docs/Sources.md, and every link is one that file records", () => {
  for (const row of listed) {
    const source = sourceRows.get(row.id);
    assert.equal(row.status.startsWith("Verified"), source.status.startsWith("Verified"), `${row.id}: status`);
    if (!row.status.startsWith("Verified")) assert.equal(row.status, "Logged", row.id);
    const link = /\]\((https?:[^)]+)\)/.exec(row.resource);
    if (link) assert.ok(sourcesText.includes(link[1]), `${row.id}: ${link[1]} is in docs/Sources.md`);
    else assert.match(row.resource, /no direct link recorded/, row.id);
  }
  assert.deepEqual(listed.filter((row) => row.status.startsWith("Verified")).map((row) => row.id), ["S-31", "S-32"]);
});

test("the counts in the page's summary table are the counts of its rows", () => {
  const count = (label) => Number(new RegExp(`\\| ${label} \\|[^|]*\\| \\**(\\d+)\\** \\|`).exec(nasaText)[1]);
  for (const number of ["1", "2", "3", "4"]) assert.equal(count(number), inSection(number).length, `section ${number}`);
  assert.match(nasaText, /\*\*All NASA rows\*\* \| \*\*88\*\*/);
  assert.match(nasaText, /\*\*AI disclosure \(D-44\):\*\*/);
});
