# The hazard panel ("Why this is watched")

**Team:** OrbitNsukka | **Workstream:** Core Engine / Application, with Data & Science | **Date:** Nov 15, 2026
**AI disclosure (D-44, D-56):** this document was written by an AI assistant (Claude, Anthropic) at the team leader's direction, as part of the refined build from `docs/REFINED_BUILD_BRIEF.md` (D-57, D-58).

The panel shows, for each of the six indicators, how NASA's risk diagrams link the five hazards of spaceflight to what the reading watches. It explains **why a reading is watched**. It does not judge a reading.

---

## 1. Three rules the panel never breaks

1. **It never changes, colours or explains a status.** The engine (`app/js/engine.js`) knows nothing about hazards, and the panel is given no reading and no result.
2. **It never says which hazard caused a reading.** The file's own limit line says so, and it is always visible while the panel is open.
3. **No text, number or rating in the panel is typed into the code.** Everything is read from `app/data/Hazard_Links.json` (v1.0.0, approved under D-57).

## 2. Where it is

| Screen | Where |
|---|---|
| Today | Under each of the six results |
| Enter a reading | Under the form, for the chosen indicator |
| Mood check | Under the weekly PHQ-2 and the distress button, for mood |

On each screen it is a section that starts shut. It opens and shuts with a real button, which a keyboard reaches with Tab and presses with Enter or Space. The button's title is the file's `meta.screen_text.panel_title`.

## 3. What it shows, and the field each part is read from

| Part | Field in `Hazard_Links.json` |
|---|---|
| The title on the button | `meta.screen_text.panel_title` |
| The introduction | `meta.screen_text.panel_intro` |
| The indicator's summary | `indicators.<id>.summary` |
| For each of the five hazards: its name | `meta.screen_text.hazard_labels.<hazard>` |
| its closeness, as a word | `meta.screen_text.closeness_labels.<closeness>` |
| its closeness, as a symbol | made from the rating's place in the order (section 4) |
| the chain of NASA node names, joined by arrows | `links[].path` |
| the diagram's source ID | `links[].diagram` |
| A key to the four ratings | `meta.screen_text.closeness_labels` and `closeness_meanings` |
| The limit line | `meta.screen_text.limit` |

A link that is "not linked" has no chain in the file, so the panel shows its name, its rating and its source ID only.

**Not shown:** `override`, `note`, `edge_note`, `observed_nodes`, `mapping_strength`, `observability`, `evidence` and `meta.method`. They are the method behind the ratings, not screen text. They are explained in `docs/data-science/Hazard_Links_Sheet_v2_Draft.md`.

## 4. Order and symbols

- **Order:** Close first, then Intermediate, Distant and Not linked. The file has no separate field for the order. The module uses the order in which `meta.screen_text.closeness_labels` lists the ratings, which is the order the brief asks for. Within one rating, hazards keep the order of the file's `links`.
- **Symbols:** a rating is never shown by colour alone. Beside the word stands a row of squares, one full square fewer for each step down the order: ■■■, ■■□, ■□□, □□□. The symbols are made from the rating's place in the order, not from its name, so a file with more or fewer ratings still works.

## 5. How it is built

| Piece | File | What it does |
|---|---|---|
| The module | `app/js/hazards.js` | Pure: no imports, no browser calls. `validateHazards()` checks the file. `panelFor(file, indicatorId)` returns the panel of one indicator. `panelStrings(panel)` lists every piece of text the panel shows, in order |
| The screen | `hazardPanel()` in `app/js/ui.js` | Draws the panel from that data. Each piece of text sits in its own element, so the browser test can compare it with the file |
| The file | `app/data/Hazard_Links.json` | A fixed input. Saved for offline use by the service worker |

**One indicator, two ids.** The threshold file calls blood sugar `blood_glucose`; the hazard file calls it `blood_sugar`. The module holds that one pair of ids, so the blood-sugar result gets its panel. This is recorded in `docs/ISSUES.md` (R-12) for the next version of either file.

**If the file cannot be read or fails its check,** the app works as before, every status is the same, and a short line says the panel could not be loaded.

## 6. How it is tested

| Acceptance row (refined brief, section 7) | Test |
|---|---|
| Hazard data shown in full: all 30 links, each with rating, chain and source | `tests/hazards.test.js`; on screen in `tests/e2e.test.js` |
| Hazard rules hold: each rating follows `meta.method.closeness_rules` from its `arrows`, its indicator's `observability` and any `override` | `tests/hazards.test.js`. **All 30 follow the rules. No mismatch was found** |
| Panel never changes a status: results with and without the hazard file are identical for all 720 | `tests/hazards.test.js` (all 720); in the browser, the 180 results of SYN-B are compared with the hazard file blocked (`tests/e2e.test.js`) |
| No hard-coding: changing a rating or a label in a copy of the file changes the panel with no code change | `tests/hazards.test.js`, `tests/hardcoding.test.js` |
| Screen text: every panel string equals its field in the file, word for word | `tests/hazards.test.js`; on screen in `tests/e2e.test.js` |
| Offline: the panel works with the network off after one load | `tests/e2e.test.js`, `tests/offline.test.js` |

The same test also checks that each chain has one more node than its `arrows`, starts at the hazard's own node and ends at a node the indicator watches, and that every link's diagram is one of its indicator's diagrams.

## 7. What the build did not check

- **The build did not open NASA's diagram files.** It checked that the file is consistent with its own rules. Whether each chain is in NASA's files is for Data & Science to confirm (`Hazard_Links_Sheet_v2_Draft.md`, section 8).
- **The panel's wording was not reviewed by a person** during the build.
