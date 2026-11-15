// Draws the PNG icons from the team's own SVG (app/icons/icon.svg) with the
// test browser. A development tool: run it only when the SVG changes.
//   node tools/make_icons.mjs
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ICONS = fileURLToPath(new URL("../app/icons/", import.meta.url));
const svg = readFileSync(`${ICONS}icon.svg`, "utf8");
// A maskable icon is cut to a shape by the device, so its background fills the whole square.
const maskable = svg.replace(/ rx="\d+"/, "");
const jobs = [
  { file: "icon-192.png", size: 192, source: svg },
  { file: "icon-512.png", size: 512, source: svg },
  { file: "icon-maskable-512.png", size: 512, source: maskable },
];

const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch();
try {
  for (const job of jobs) {
    const page = await browser.newPage({ viewport: { width: job.size, height: job.size }, deviceScaleFactor: 1 });
    await page.setContent(`<!doctype html><style>html,body{margin:0;background:transparent}svg{display:block;width:${job.size}px;height:${job.size}px}</style>${job.source}`);
    writeFileSync(`${ICONS}${job.file}`, await page.screenshot({ omitBackground: true, type: "png" }));
    await page.close();
    console.log(`Wrote app/icons/${job.file}`);
  }
} finally {
  await browser.close();
}
