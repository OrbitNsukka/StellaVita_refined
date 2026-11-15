# Issues found during the build

**Team:** OrbitNsukka | **Workstream:** Core Engine / Application | **Date:** Nov 15, 2026
**AI disclosure (D-44):** this document was written by an AI assistant (Claude, Anthropic) at the team leader's direction, as part of the build from `docs/CORE_ENGINE_BRIEF.md` (D-52, D-53).

The build never edits the fixed inputs (`app/data/` and `reference/generate_synthetic_data.py`). Anything it found in them is written here, with what the build did so it could keep going. **No threshold was changed.** A change needs a team decision and a new file version (D-42).

None of these issues changes a status on the demo data: the engine matches the reference checker on all 120 rows × 6 indicators.

**Who decides:** D&S = Data & Science, I&E = Interface & Experience, CE = Core Engine, P&D = Project & Delivery.

---

## A. The threshold file (`Indicator_Thresholds.json` v0.4.0)

| ID | What was found | What the build did | Who decides |
|---|---|---|---|
| I-01 | `meta.sources_on_every_band` says every band and rule carries a `sources` list. Four symptom rules have none: the heart-rate rule, both blood-sugar rules, and the mood distress rule | When a symptom rule sets the status, the result uses the indicator's `source_keys` | D&S: add `sources` to those rules in the next version |
| I-02 | The agreed temperature method (oral, D-35) is in the file only as words (`label`, `measurement`). There is no field the engine can read | The engine reads `judged_method` if the indicator has it, and otherwise uses "oral". This is the one health-related word typed in `engine.js` | D&S: add `"judged_method": "oral"` in the next version |
| I-03 | Two reasons the brief asks for have no field in the file: "trend only" for a single mood tap (the band's label is "Any tap"), and "not compared: taken by another method" | Both are fixed texts in `engine.js` (`FIXED_REASONS`), copied from the brief, section 6 | D&S: add them to the file, or confirm the brief's wording |
| I-04 | Two notes shown on screen sit inside longer sentences in the file: "inside your usual range" (in `baseline_rule.rule`) and "low reading, recheck after fluids and rest" (in `low_reading.without_symptoms`) | The engine takes the text between the quote marks. If the quote marks are removed, it shows the whole sentence | D&S: give each note its own field |
| I-05 | The weekly PHQ-2 bands have no `label` | The reason is written from the band's `min` and `max`, for example "3 to 6" | D&S: add labels |
| I-06 | `baseline_rule.applies_to` ("readings below 60 only") is text. The limit is not a separate number | The engine uses `median_below` as that limit. In v0.4.0 the two are the same number | D&S: confirm, or add a field |
| I-07 | For a closed scale (mood tap, PHQ-2) a value outside `plausible_range` lands in no band, so "entered twice is accepted" (D-48) cannot give it a status | The screens offer only the valid answers. If such a value is ever sent twice, the app keeps asking and stores nothing | D&S: confirm |
| I-08 | Sleep: a value above the stated limit of the measure, entered twice, is accepted (D-48) and lands in the top band | Followed D-48 as written | D&S: confirm this is wanted |
| I-09 | Several band `note` fields are cross-references only (for example "S-167, D-28"). The app shows notes word for word under "From the threshold file", so these read oddly | Shown as written | I&E: choose which notes to show |
| I-10 | The blood-pressure checklist includes "systolic drop of 20 mmHg or more on standing, with dizziness". It is a measurement more than a symptom, and it is long for a tick box | Shown as written, because the checklist is the file's symptom lists (D-51) | D&S and I&E |
| I-11 | The file does not say how a pattern rule treats several readings on one day, or days with no reading | A day counts when any reading on it meets the test. "In a row" means calendar days, so a missing day breaks the run. See `docs/STATUS_RULES.md` | D&S: confirm |

## B. The reference checker (`reference/generate_synthetic_data.py`)

| ID | What was found | What the build did | Who decides |
|---|---|---|---|
| I-12 | The script looks for the threshold file and the CSV beside itself. In this repository they are in `app/data/`, so `python reference/generate_synthetic_data.py --check` stops with "No such file" | Use `python reference/check.py`, which points the unchanged script at `app/data/`. `reference/tools/expected_colours.py` does the same | CE: nothing to do; noted for anyone who runs the script directly |
| I-13 | Line 142 tests `hr < 60` with the number typed in, although D-38 says the script types no threshold | The engine reads the limit from the file (see I-06). Statuses agree | D&S, at the next version |
| I-14 | The checker rounds with Python's `round()`, which sends an exact half to the even neighbour (100.5 becomes 100) | The engine rounds the same way, so the two cannot disagree on a half-way value | None |
| I-15 | The checker applies a day's symptoms to all six indicators. In the app, symptoms belong to one reading | The sample loader copies the day's symptoms onto each of that day's six readings, so SYN-B day 13 shows "dizziness" on all six | D&S and I&E: fine for the demo |
| I-16 | The checker tests pattern rules on the raw value; the engine tests the rounded value | No difference on the demo data, whose values are already at the resolution | None |

## C. The guidance and limits texts

| ID | What was found | What the build did | Who decides |
|---|---|---|---|
| I-17 | The brief's example action for the sleep red, "Talk to the flight surgeon", is in `docs/data-science/Indicator_Sheet.md`. It is not in the three files the screens may copy from (`CLAUDE.md`, rule 7) | Under each result the app shows the file's `status_meaning` text and, on request, the indicator's section of `Guidance_Content.md`. The Indicator Sheet's action column is not shown | D&S and I&E: if the sheet's action texts are wanted on screen, put them in the threshold file |
| I-18 | `Limits_Statement.md` rule 1 says never to say "this is normal for you". `Guidance_Content.md` (heart rate) says "That is your normal", and the status word chosen in D-53 is "Normal" | Both texts are shown word for word. No wording was changed or added | D&S and I&E |
| I-19 | `Limits_Statement.md` rule 5 says the tool "never overrides a flight surgeon instruction, and says so". No supplied screen text says exactly that | The full limits statement (which names the flight surgeon as the medical authority) is shown on first launch and on the About screen. No new wording was written | D&S: supply the sentence if it is wanted |
| I-20 | `Guidance_Content.md` (mood) says "The tool may suggest a small action". The MVP suggests no actions | Not built: suggestions and reminders are outside the MVP (D-06). The sentence still appears, because the text is shown word for word | D&S and I&E |
| I-21 | `Guidance_Content.md` has a section "Preventive actions for reminders" | Not shown: reminders are a stretch feature | I&E, after the MVP gate |

## D. The brief and other documents

| ID | What was found | What the build did | Who decides |
|---|---|---|---|
| I-22 | The brief says cached settings are "stored per profile" | One copy per version is stored on the device, and each profile records its version. Same behaviour, one copy | CE: confirm |
| I-23 | The brief lists the order "symptoms, then personal range". The reference checker lowers the band by the personal range first, and symptoms can still raise it | Followed the checker, because parity with it is required | None |
| I-24 | The brief does not say whether both blood-pressure readings must be entered | Both are required at entry (D-49 stores two). Sample readings hold one, as the demo file does | CE and D&S |
| I-25 | `docs/AI_USE.md` named the sources list as `docs/team/Sources.md`. The file is `docs/Sources.md` | Corrected the path in `docs/AI_USE.md` (not a fixed input) | None |
| I-26 | `README.md` still has two placeholders: "[link to the hosted app]" and "[link to the team project page]" | Left for the team: the links exist only after the repository is public (D-54) | P&D |

## E. Open points in the build itself

These are limits of the build, not faults in the inputs. They are repeated in `docs/BUILD_REPORT.md`.

| ID | Point |
|---|---|
| I-27 | There is no way to edit or delete one reading. A mistaken entry can be removed only by Reset, which wipes everything |
| I-28 | Only Chromium was tested. Firefox, Safari and a real phone in flight mode were not |
| I-29 | GitHub Pages hosting was not tested, because the repository is still private (D-54) |
| I-30 | After any change in `app/`, `node reference/tools/stamp_sw.mjs` must be run, or devices keep the old saved copy. A test fails if it is forgotten |
