# Issues found during the refined build

**Team:** OrbitNsukka | **Workstream:** Core Engine / Application | **Date:** Nov 15, 2026
**AI disclosure (D-44, D-56):** this document was written by an AI assistant (Claude, Anthropic) at the team leader's direction, as part of the refined build from `docs/REFINED_BUILD_BRIEF.md` (D-58, D-59).

The build never edits the fixed inputs (`app/data/`, `reference/`, `tests/expected_colours.csv` and its `.meta.json`). Anything it found in them is written here, with what the build did so it could keep going. **No threshold and no rating was changed.** A change needs a team decision and a new file version (D-42).

Nobody could be asked during the build, so every unclear point was settled by the choice closest to the briefs. Those choices are in section E. **Please confirm or change them.**

None of these issues changes a status on the demo data: the engine matches the reference checker on all 720 statuses.

**Numbering.** These are the refined build's own numbers (R-01 onward). Where the original build recorded the same point, its number (I-xx, in `docs/original-build/ISSUES.md`) is given.

**Who decides:** D&S = Data & Science, I&E = Interface & Experience, CE = Core Engine, P&D = Project & Delivery.

---

## A. The threshold file (`Indicator_Thresholds.json` v0.4.0)

| ID | What was found | What the build did | Who decides |
|---|---|---|---|
| R-01 (I-01) | `meta.sources_on_every_band` says every band and rule carries a `sources` list. Four symptom rules have none: the heart-rate rule, both blood-sugar rules, and the mood distress rule | When such a rule sets the status, the result uses the indicator's `source_keys` | D&S: add `sources` to those rules in the next version |
| R-02 (I-02) | The agreed temperature method (oral, D-35) is in the file only as words (`label`, `measurement`). There is no field the engine can read | The engine reads `judged_method` if the indicator has it, and otherwise uses "oral". This is the one health-related word typed in `engine.js` | D&S: add `"judged_method": "oral"` in the next version |
| R-03 (I-03) | Two reasons the brief asks for have no field in the file: "trend only" for a single mood tap, and "not compared: taken by another method" | Both are fixed texts in `engine.js` (`FIXED_REASONS`), copied from the Core Engine brief, section 6 | D&S: add them to the file, or confirm the brief's wording |
| R-04 (I-04) | Two notes shown on screen sit inside longer sentences: "inside your usual range" (in `baseline_rule.rule`) and "low reading, recheck after fluids and rest" (in `low_reading.without_symptoms`) | The engine takes the text between the quote marks. If the quote marks are removed, it shows the whole sentence | D&S: give each note its own field |
| R-05 (I-05) | The weekly PHQ-2 bands have no `label` | The reason is written from the band's own `min` and `max`, for example "3 to 6" | D&S: add labels |
| R-06 (I-06) | `baseline_rule.applies_to` ("readings below 60 only") is text. The limit is not a separate number | The engine uses `median_below` as that limit. In v0.4.0 the two are the same number | D&S: confirm, or add a field |
| R-07 (I-07) | For a closed scale (mood tap, PHQ-2 answer) a value outside the scale lands in no band, so "entered twice is accepted" (D-48) cannot give it a status | The screens offer only the answers of the scale. A value off the scale is asked again, however often it is sent | D&S: confirm |
| R-08 (I-08) | Sleep: a value beyond the stated limit of the measure, entered twice, is accepted (D-48) and lands in the top or bottom band | Followed D-48 as written | D&S: confirm this is wanted |
| R-09 (I-09) | Several band `note` fields are cross-references only (for example "S-167, D-28"). The app shows notes word for word under "Note from the threshold file", so these read oddly | Shown as written | I&E: choose which notes to show |
| R-10 (I-10) | The blood-pressure checklist includes "systolic drop of 20 mmHg or more on standing, with dizziness". It is a measurement more than a symptom, and it is long for a tick box | Shown as written, because the checklist is the file's symptom lists (D-51) | D&S and I&E |
| R-11 (I-11) | The file does not say how a pattern rule treats several readings on one day, or days with no reading | A day counts when any reading on it meets the test. "In a row" means calendar days, so a missing day breaks the run | D&S: confirm |
| R-13 | The mood indicator has one `unit` text for two measures: "1-5 tap (daily); PHQ-2 total 0-6 (weekly)" | The result of a tap shows the part before the semicolon, and a weekly result the part after it. If the text ever has another shape, the whole text is shown | D&S: give `weekly_phq2` its own unit |
| R-14 | The answers to a weekly question are given only inside a sentence (`item_scoring`), and the range of one answer is not a field: only the total's range is | The app reads the words and their numbers out of the sentence, and takes one answer's range as the total's range shared equally between the questions | D&S: add a list of answers |
| R-15 | `meta.status_meaning` begins each text with a colour word ("Green:", "Amber:", "Red:"), while the words on screen are Normal, Caution and Emergency (D-53) | Shown word for word under "What this status means" | D&S and I&E |
| R-16 | The file gives no wording that joins a part to its band, or a low-pressure rule to its symptoms | The reason puts the file's own part name in front of the band's label ("systolic: Under 130; diastolic: Under 80"), and for a low reading with symptoms shows `low_reading.rule`, then "with" and the symptoms that matched. No health wording was added | D&S and I&E: confirm the joining |

## B. The hazard file (`Hazard_Links.json` v1.0.0)

**Hazard rules hold.** For all 30 links the rating follows `meta.method.closeness_rules` from the link's `arrows`, its indicator's `observability` and any `override`. **No mismatch was found** (`tests/hazards.test.js`). Each chain also has one more node than its `arrows`, starts at the hazard's own node and ends at a node the indicator watches.

| ID | What was found | What the build did | Who decides |
|---|---|---|---|
| R-12 | The two fixed inputs give blood sugar two ids: `blood_glucose` in the threshold file (and in `tests/expected_colours.csv`), `blood_sugar` in the hazard file | `hazards.js` holds that one pair of ids, so the blood-sugar result gets its panel. A test checks that all six indicators find a panel | D&S: use one id in the next version of either file |
| R-17 | The file has no field for the order of the ratings (Close first) | The module uses the order in which `meta.screen_text.closeness_labels` lists them, which is the order the brief asks for | D&S: add an order field, or confirm |
| R-18 | The file has no symbols for the ratings. The brief asks for a word and a symbol | The module makes a row of squares from the rating's place in the order (■■■, ■■□, ■□□, □□□). The symbols are not text from the file | I&E: confirm or choose other symbols |
| R-19 | `meta.screen_text.closeness_meanings` is screen text, but the brief's list of what the panel shows does not name it | Shown as a small key at the foot of the panel, word for word. Without it, "Distant" beside a two-step chain would have no explanation on screen | D&S and I&E: confirm |
| R-20 | `override`, `note` and `edge_note` explain single ratings, but are not in `screen_text` | Not shown. The key (R-19) gives the general reason | D&S: say if any should be shown |
| R-21 | A link that is "not linked" has an empty `path` | The panel shows the hazard's name, its rating and the diagram's source ID, and no chain | None |
| R-23 | The build did not open NASA's diagram files (S-153 to S-158). It checked the file against its own rules only | Stated in `docs/HAZARD_PANEL.md` and `docs/BUILD_REPORT.md` | D&S: confirm the chains (sheet v2, section 8) |

## C. The reference checker (`reference/`)

| ID | What was found | What the build did | Who decides |
|---|---|---|---|
| R-24 (I-12) | `generate_synthetic_data.py` looks for the threshold file and the CSV beside itself. In this repository they are in `app/data/`, so running it directly stops with "No such file" | Use `python reference/check.py`, which points the unchanged script at `app/data/` | None; noted for anyone who runs the script directly |
| R-25 (I-13) | The checker tests `hr < 60` with the number typed in, although D-38 says it types no threshold | The engine reads the limit from the file (R-06). Statuses agree | D&S, at the next version |
| R-26 (I-14) | The checker rounds with Python's `round()`, which sends an exact half to the even neighbour | The engine rounds the same way, so the two cannot disagree on a half-way value | None |
| R-27 (I-15) | The checker applies a day's symptoms to all six indicators. In the app, symptoms belong to one reading | The sample loader copies the day's symptoms onto each of that day's six readings, so SYN-B day 13 shows "dizziness" on all six | D&S and I&E: fine for the demo |
| R-28 (I-16) | The checker tests pattern rules and the personal range on the raw value; the engine uses the rounded value | No difference on the demo data, whose values are already at the resolution | None |
| R-29 | Running the Python tools leaves a `__pycache__` folder inside `reference/` | `.gitignore` keeps it out of the repository. No file in `reference/` was changed | None |

## D. The guidance and limits texts

| ID | What was found | What the build did | Who decides |
|---|---|---|---|
| R-30 (I-17) | The Core Engine brief's example action for the sleep red, "Talk to the flight surgeon", is in `docs/data-science/Indicator_Sheet.md`. It is not in a file the screens may copy from (`CLAUDE.md`, rule 7) | Under each result the app shows the file's `status_meaning` text and, on request, the indicator's section of `Guidance_Content.md`. The sheet's action column is not shown | D&S and I&E: if the sheet's action texts are wanted on screen, put them in the threshold file |
| R-31 (I-18) | `Limits_Statement.md` rule 1 says never to say "this is normal for you". `Guidance_Content.md` (heart rate) says "That is your normal", and the status word chosen in D-53 is "Normal" | Both texts are shown word for word. No wording was changed or added | D&S and I&E |
| R-32 (I-19) | `Limits_Statement.md` rule 5 says the tool "never overrides a flight surgeon instruction, and says so". No supplied screen text says exactly that | The full limits statement, which names the flight surgeon as the medical authority, is shown on first launch and on the About screen. No new wording was written | D&S: supply the sentence if it is wanted |
| R-33 (I-20) | `Guidance_Content.md` (mood) says "The tool may suggest a small action". The app suggests no actions | Not built: suggestions and reminders are outside the MVP. The sentence still appears, because the text is shown word for word | D&S and I&E |
| R-34 (I-21) | `Guidance_Content.md` has a section "Preventive actions for reminders" and a sign-off block | Not shown: reminders are a stretch feature, and the sign-off block is not guidance | I&E, after the MVP gate |
| R-35 | `Limits_Statement.md` rule 4 says the mood feature says "support, not assessment", but gives no screen sentence for it | The Mood check screen carries the short line "Support, not assessment. Private to this device." (in `labels.js`), and shows the file's `licence_note` ("A screen, not a diagnosis.") above the weekly questions | D&S and I&E: confirm the line |

## E. Choices the build made where the briefs were unclear

| ID | Point | Choice, and why |
|---|---|---|
| R-22 (I-23) | The brief lists "symptoms, then personal range". The reference checker lowers the band by the personal range first, and symptoms can still raise it | Followed the checker, because parity with it is required |
| R-36 (I-22) | The brief says cached settings are "stored per profile" | One copy per version on the device; each profile and reading records its version. Same behaviour, one copy |
| R-37 (I-24) | The brief does not say whether both blood-pressure readings must be entered | Both are needed at entry (D-49 stores two). Sample readings hold one, as the demo file does |
| R-38 | The brief does not say which descriptive fields are needed | Heart-rate source and temperature method are needed (the method decides whether a temperature is judged). The meter is optional and stored as "not recorded" when left empty, so a low blood sugar is never held up by it |
| R-39 | The brief does not say what to do with a date in the future | Asked again. It would otherwise stay "latest" for days |
| R-40 | Blood sugar: "before a meal?" left unanswered | Asked again. "After a meal" is refused. A refusal should follow an answer, not a blank |
| R-41 | Two findings with the same status | A pattern is shown first, then the band, then a symptom. The pattern carries the action ("report it") |
| R-42 | "Today: the six latest results", but mood has three kinds of entry | The mood card shows the latest daily tap, the latest weekly PHQ-2 and the latest distress mark, each with its own status. A later tap therefore never hides a distress mark |
| R-43 (I-27) | The brief has no way to remove one reading | **Added:** Delete on the History screen, with a second press to confirm. Without it, a mistaken entry or a distress mark pressed by accident could only be removed by Reset, which wipes everything |
| R-44 | The layout in the refined brief, section 4, has no place for build tools, and `reference/` is a fixed input | New folder `tools/` (`stamp_sw.mjs`, `contrast.mjs`, `make_icons.mjs`). Also added: `src/theme.json` (the colours, read by Tailwind and by the contrast check), `tailwind.config.js`, `tests/helpers/` |
| R-45 | "A Playwright browser test (installed as a dev dependency)" | Playwright is pinned at 1.63.0, the version whose Chromium was already in the cloud session. Logged as L-02. It is a test tool and is not part of the app |
| R-46 | The original build and this one can be served from the same site (`orbitnsukka.github.io`), which shares one storage area | This build uses its own database (`stellavita-refined`) and its own cache names, so neither build touches the other's data |
| R-47 | The Core Engine brief, section 10, asks for a header comment in every source file. D-56 withdraws it | Followed D-56: no header comments in the new code. The disclosure is in the README, NOTICE, `docs/AI_USE.md`, every document, the page's meta tags and the About screen |
| R-48 | The task message gave the commit e-mail with a different "@" character from `CLAUDE.md` | Used the address exactly as written in `CLAUDE.md` and the refined brief, section 8 |
| R-49 | `NOTICE` says the work was "reviewed and approved by the team". The refined build's code was written while the team's laptop was off | Left the sentence, and added one line under it saying that the refined build's code awaits the team's review |

## F. Notes on other documents

| ID | What was found | What the build did | Who decides |
|---|---|---|---|
| R-50 | `docs/CORE_ENGINE_BRIEF.md` refers to `docs/CORE_ENGINE_PLAN.md`, which is not in this repository | Built from the two briefs and `docs/original-build/` | P&D: add the plan, or leave it out on purpose |
| R-51 | `README.md`: the hosted address can be known only once the repository is public and GitHub Pages is on (D-54) | The README gives the address the app will have, and says plainly that it was not tested | P&D |
| R-52 | Several team documents and two data files name workstream leads by their initials (for example in `docs/team/` and the header of `Guidance_Content.md`). There are no names and no list that links initials to names | Left as they are: they are the team's own documents and fixed inputs. The build added no initials anywhere | P&D: decide whether initials should stay in a public repository (all members are under 18) |
| R-53 | `docs/Sources.md`, section 4, had no library rows | Added L-01 (Tailwind CSS) as the refined brief asks, and L-02 (Playwright, test tool only) | P&D: cross-check |
| R-59 | `docs/Sources.md` says that nothing Logged may appear in the tool. The hazard panel shows the six diagram IDs S-153 to S-158, whose rows are Logged, and the hazard file cites seven more Logged NASA rows off screen. D-57 approved the hazard file, but the rows' status was not changed | Shown as the fixed input gives them. `docs/NASA_Sources.md` lists every NASA resource with how it is used and its status, so the gap is easy to see | D&S: verify the rows. P&D: or record that D-57 covers them |
| R-60 | `docs/NASA_Sources.md` listed only the 25 NASA resources that matter most | Rewritten on Nov 16, at the team leader's request, to state every NASA resource: all 88 NASA rows of `docs/Sources.md`, grouped by how each is used (15 in the app, 23 in the documents behind it, 8 for the challenge and reuse rules, 42 logged but not used). `tests/sources.test.js` keeps it in step | P&D: cross-check |

## G. Open points in the build itself

These are limits of the build, not faults in the inputs. They are repeated in `docs/BUILD_REPORT.md`.

| ID | Point |
|---|---|
| R-54 (I-28) | Only Chromium was tested. Firefox, Safari and a real phone in flight mode were not |
| R-55 (I-29) | GitHub Pages hosting was not tested |
| R-56 (I-30) | After any change in `app/`, `npm run build` (or `node tools/stamp_sw.mjs`) must be run, or devices keep the old saved copy. A test fails if it is forgotten |
| R-57 | No screen reader was used. Nobody has looked at the screens except the AI assistant, which looked at four screenshots at phone width (two light, two dark) |
| R-58 | There is no way to edit a reading. A mistaken reading is deleted and entered again |
