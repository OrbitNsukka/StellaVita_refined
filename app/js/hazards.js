// The hazard panel's data (D-57). Pure: no imports, no browser calls.
// It reads Hazard_Links.json and returns, for one indicator, the hazards with
// their rating, chain and sources. It never looks at a reading and never
// touches a status. No text, number or rating of the file is typed here.

export const HAZARDS_PATH = "data/Hazard_Links.json";

// The threshold file and the hazard file give one indicator two different ids.
const INDICATOR_ALIASES = Object.freeze({ blood_glucose: "blood_sugar" });

export const CHAIN_ARROW = " → ";
const SYMBOL_FULL = "■";
const SYMBOL_EMPTY = "□";

function isText(value) {
  return typeof value === "string" && value.length > 0;
}

function isTextMap(value) {
  return Boolean(value) && typeof value === "object" && Object.keys(value).length > 0 && Object.values(value).every(isText);
}

// Looks for the parts the panel needs. A broken file is not shown at all.
export function validateHazards(data) {
  const problems = [];
  if (!data || typeof data !== "object") return { ok: false, problems: ["the file is not a JSON object"] };
  const meta = data.meta ?? {};
  const text = meta.screen_text ?? {};
  if (!isText(meta.version)) problems.push("meta.version is missing");
  for (const key of ["panel_title", "panel_intro", "limit"]) {
    if (!isText(text[key])) problems.push(`meta.screen_text.${key} is missing`);
  }
  for (const key of ["closeness_labels", "hazard_labels"]) {
    if (!isTextMap(text[key])) problems.push(`meta.screen_text.${key} is missing`);
  }
  if (!Array.isArray(data.hazards) || data.hazards.length === 0) problems.push("no hazards");
  if (!data.indicators || typeof data.indicators !== "object") problems.push("no indicators");
  if (!Array.isArray(data.links)) problems.push("no links");
  if (problems.length > 0) return { ok: false, problems };

  for (const hazard of data.hazards) {
    if (!isText(text.hazard_labels[hazard])) problems.push(`no label for the hazard "${hazard}"`);
  }
  for (const [id, indicator] of Object.entries(data.indicators)) {
    if (!isText(indicator?.summary)) problems.push(`${id}: no summary`);
  }
  const seen = new Set();
  data.links.forEach((link, index) => {
    const name = `link ${index + 1} (${link?.hazard} to ${link?.indicator})`;
    if (!data.hazards.includes(link?.hazard)) problems.push(`${name}: unknown hazard`);
    if (!data.indicators[link?.indicator]) problems.push(`${name}: unknown indicator`);
    if (!isText(text.closeness_labels[link?.closeness])) problems.push(`${name}: unknown closeness "${link?.closeness}"`);
    if (!Array.isArray(link?.path) || !link.path.every(isText)) problems.push(`${name}: the path is not a list of node names`);
    if (!isText(link?.diagram)) problems.push(`${name}: no diagram source`);
    const pair = `${link?.indicator}|${link?.hazard}`;
    if (seen.has(pair)) problems.push(`${name}: listed twice`);
    seen.add(pair);
  });
  for (const id of Object.keys(data.indicators)) {
    for (const hazard of data.hazards) {
      if (!seen.has(`${id}|${hazard}`)) problems.push(`${id}: no link for the hazard "${hazard}"`);
    }
  }
  return { ok: problems.length === 0, problems };
}

// The hazard file's own id for an indicator of the threshold file, or null.
export function hazardKeyFor(data, indicatorId) {
  if (data.indicators[indicatorId]) return indicatorId;
  const alias = INDICATOR_ALIASES[indicatorId];
  return alias && data.indicators[alias] ? alias : null;
}

// Closest first. The file has no separate order field: the order is the order
// in which meta.screen_text.closeness_labels lists the ratings.
export function closenessOrder(data) {
  return Object.keys(data.meta.screen_text.closeness_labels);
}

// A symbol beside the word, so a rating is never shown by colour alone:
// one full square fewer for each step down the order.
export function closenessSymbol(rank, levels) {
  const empty = Math.min(Math.max(rank, 0), levels - 1);
  return SYMBOL_FULL.repeat(levels - 1 - empty) + SYMBOL_EMPTY.repeat(empty);
}

// Everything the panel of one indicator shows, read from the file.
export function panelFor(data, indicatorId) {
  const key = hazardKeyFor(data, indicatorId);
  if (!key) return null;
  const text = data.meta.screen_text;
  const order = closenessOrder(data);
  const meanings = text.closeness_meanings ?? {};
  const level = (closeness) => {
    const rank = order.indexOf(closeness);
    return {
      closeness,
      rank,
      closenessLabel: text.closeness_labels[closeness],
      closenessMeaning: meanings[closeness] ?? "",
      symbol: closenessSymbol(rank, order.length),
    };
  };
  const hazards = data.links
    .filter((link) => link.indicator === key)
    .map((link, position) => ({
      hazard: link.hazard,
      label: text.hazard_labels[link.hazard],
      ...level(link.closeness),
      arrows: link.arrows ?? null,
      path: [...link.path],
      chain: link.path.join(CHAIN_ARROW),
      diagram: link.diagram,
      sources: [link.diagram],
      position,
    }))
    .sort((a, b) => a.rank - b.rank || a.position - b.position);
  return {
    indicator: key,
    version: data.meta.version,
    title: text.panel_title,
    intro: text.panel_intro,
    summary: data.indicators[key].summary,
    limit: text.limit,
    diagrams: [...(data.indicators[key].diagrams ?? [])],
    hazards,
    key: order.map(level),
  };
}

// Every piece of text the panel puts on screen, in order. Used by the screen
// and by the tests that compare the panel with the file word for word.
export function panelStrings(panel) {
  const strings = [panel.title, panel.intro, panel.summary];
  for (const hazard of panel.hazards) {
    strings.push(hazard.label, hazard.symbol, hazard.closenessLabel);
    if (hazard.chain) strings.push(hazard.chain);
    strings.push(hazard.diagram);
  }
  for (const level of panel.key) {
    strings.push(level.symbol, level.closenessLabel);
    if (level.closenessMeaning) strings.push(level.closenessMeaning);
  }
  strings.push(panel.limit);
  return strings;
}
