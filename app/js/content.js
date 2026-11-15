// Reads the guidance and limits texts so the screens can show them word for
// word. This module writes no health wording: it only cuts the approved files
// into pieces.

export const GUIDANCE_PATH = "data/Guidance_Content.md";
export const LIMITS_PATH = "data/Limits_Statement.md";

const BOLD = "**";

// "plain **bold** plain" as runs of text, so bold can be shown without markup in strings.
export function runsOf(text) {
  const runs = [];
  text.split(BOLD).forEach((piece, index) => {
    if (piece !== "") runs.push({ text: piece, bold: index % 2 === 1 });
  });
  return runs;
}

export function plainOf(text) {
  return runsOf(text).map((run) => run.text).join("");
}

function quoteOf(line) {
  const match = /^>\s?(.*)$/.exec(line);
  return match ? match[1] : null;
}

// The limits statement: the full wording and the short line (sections one and two of the file).
export function parseLimits(markdown) {
  const quotes = [];
  let waiting = false;
  for (const line of markdown.split(/\r?\n/)) {
    if (/^## /.test(line)) {
      waiting = true;
      continue;
    }
    const quote = quoteOf(line);
    if (quote !== null && waiting) {
      quotes.push(quote.trim());
      waiting = false;
    }
  }
  return { full: quotes[0] ?? "", short: quotes[1] ?? "" };
}

// The guidance file: the standing limits line, and one section per heading.
// Each section holds titled parts ("What it means", ...) made of paragraphs and lists.
export function parseGuidance(markdown) {
  const guidance = { standingLine: "", sections: [] };
  let section = null;
  let part = null;
  let list = null;
  for (const line of markdown.split(/\r?\n/)) {
    const heading = /^## (.+)$/.exec(line);
    if (heading) {
      section = { heading: heading[1].trim(), parts: [] };
      guidance.sections.push(section);
      part = null;
      list = null;
      continue;
    }
    const quote = quoteOf(line);
    if (!section) {
      if (quote !== null && guidance.standingLine === "") guidance.standingLine = quote.trim();
      continue;
    }
    if (line.trim() === "" || /^-{3,}$/.test(line.trim())) {
      list = null;
      continue;
    }
    const title = /^\*\*(.+?):\*\*$/.exec(line.trim());
    if (title) {
      part = { title: title[1], blocks: [] };
      section.parts.push(part);
      list = null;
      continue;
    }
    if (!part) {
      part = { title: "", blocks: [] };
      section.parts.push(part);
    }
    const numbered = /^(\s*)\d+\.\s+(.*)$/.exec(line);
    const bullet = /^(\s*)[-*]\s+(.*)$/.exec(line);
    const item = numbered ?? bullet;
    if (item) {
      const nested = item[1].length > 0;
      const type = numbered ? "ol" : "ul";
      if (nested && list) {
        list.items.push({ text: item[2].trim(), nested: true });
        continue;
      }
      if (!list || list.type !== type) {
        list = { type, items: [] };
        part.blocks.push(list);
      }
      list.items.push({ text: item[2].trim(), nested: false });
      continue;
    }
    list = null;
    part.blocks.push({ type: "p", text: line.trim() });
  }
  return guidance;
}

// The section whose heading starts the indicator's label in the threshold file
// ("Heart rate" for "Heart rate (resting)"). No list of names is kept here.
export function guidanceFor(guidance, indicatorLabel) {
  const label = String(indicatorLabel).toLowerCase();
  let best = null;
  for (const section of guidance.sections) {
    const heading = section.heading.toLowerCase();
    if (label.startsWith(heading) && (!best || heading.length > best.heading.length)) best = section;
  }
  return best;
}

// Every piece of text of a section, in order, without the bold marks.
export function sectionStrings(section) {
  const strings = [];
  for (const part of section.parts) {
    if (part.title) strings.push(part.title);
    for (const block of part.blocks) {
      if (block.type === "p") strings.push(plainOf(block.text));
      else for (const item of block.items) strings.push(plainOf(item.text));
    }
  }
  return strings;
}
