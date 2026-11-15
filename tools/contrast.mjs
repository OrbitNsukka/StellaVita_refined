// Checks the text contrast of every colour pair in src/theme.json, in the light
// and the dark scheme (WCAG 2: at least 4.5:1 for text, 3:1 for borders and
// the focus ring). Run it with: node tools/contrast.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const THEME_PATH = fileURLToPath(new URL("../src/theme.json", import.meta.url));
export const SCHEMES = ["light", "dark"];

export function loadTheme(path = THEME_PATH) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function hexToRgb(hex) {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!match) throw new Error(`Not a six-digit hex colour: ${hex}`);
  return match.slice(1).map((pair) => parseInt(pair, 16));
}

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

export function checkTheme(theme = loadTheme()) {
  const rows = [];
  for (const scheme of SCHEMES) {
    for (const [fg, bg, minimum, where] of theme.pairs) {
      const colours = theme[scheme];
      if (!colours[fg] || !colours[bg]) throw new Error(`${scheme}: unknown colour in the pair ${fg} on ${bg}`);
      const ratio = contrastRatio(colours[fg], colours[bg]);
      rows.push({ scheme, fg, bg, minimum, where, ratio, pass: ratio >= minimum });
    }
  }
  return rows;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const rows = checkTheme();
  for (const row of rows) {
    console.log(`${row.pass ? "pass" : "FAIL"}  ${row.scheme.padEnd(5)}  ${row.ratio.toFixed(2).padStart(5)}:1  (needs ${row.minimum}:1)  ${row.fg} on ${row.bg}: ${row.where}`);
  }
  const failed = rows.filter((row) => !row.pass);
  console.log(`\n${rows.length - failed.length} of ${rows.length} colour pairs pass.`);
  process.exit(failed.length === 0 ? 0 : 1);
}
