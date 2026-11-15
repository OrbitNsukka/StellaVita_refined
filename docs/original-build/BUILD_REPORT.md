# Build report

**Team:** OrbitNsukka | **Workstream:** Core Engine / Application | **Date:** Nov 15, 2026
**AI disclosure (D-44):** this report, and the application it describes, were written by an AI assistant (Claude, Anthropic) at the team leader's direction, in one cloud session (D-52), from `docs/CORE_ENGINE_BRIEF.md` (D-53). The team has not yet reviewed the build.

---

## 1. Summary

The minimum version is built and works: six indicators can be entered, stored and judged offline, with reset and export.

- **All automatic checks pass.** `node --test`: 101 tests, 101 pass, 0 fail, 0 skipped. `python reference/check.py`: passes.
- **The engine matches the reference checker** on all 120 demo rows × 6 indicators (720 statuses). Red appears only on SYN-B day 14 (sleep), SYN-C day 18 (temperature) and SYN-D day 22 (blood sugar).
- **The fixed inputs are unchanged.** Nothing in `app/data/` or `reference/generate_synthetic_data.py` was edited. No threshold was changed.
- **No library was added.** No stretch feature was started.
- **Not tested:** any browser other than Chromium, a real phone, and GitHub Pages hosting. See section 4.

All work is on the branch `claude/amazing-feynman-e1zvlr`, one commit per step of the brief's section 12. No pull request was opened.

## 2. What was built, step by step

| Step (brief section 12) | What was done |
|---|---|
| 1. Layout | Confirmed the layout and that the checker passes. Added `package.json` (no dependencies) so Node reads the app's files as ES modules in tests |
| 2. Expected colours | `reference/tools/expected_colours.py` calls the reference checker's own functions and writes `tests/expected_colours.csv` |
| 3. Engine | `app/js/engine.js`: pure, no imports, no browser calls. Parity reached |
| 4. Settings, storage, entry, sample | `settings.js`, `store.js` (IndexedDB, no library), `entry.js`, `sample.js` |
| 5. Offline | `sw.js`, `manifest.webmanifest`, the team's own icon, relative paths only |
| 6. Screens | `ui.js`, `labels.js`, `export.js`, `content.js`, `css/style.css` |
| 7. Documents | `DATA_MODEL.md`, `STATUS_RULES.md`, `TECH_NOTES.md`, `ISSUES.md` |
| 8. Report | This file |

## 3. What passes

### Acceptance table (brief section 11)

| Test | Result | Where it is checked |
|---|---|---|
| Band edges | **Pass.** Every band edge in the file is tested on both sides, including 129/130 systolic, 37.4/37.5 °C and 53/54 mg/dL | `tests/engine.test.js` |
| Input safety | **Pass.** Missing, non-numeric and impossible values ask again; the same impossible value twice in a row is accepted and judged; after-meal sugar is refused and not stored | `tests/entry.test.js`, and in the browser test |
| Parity, four astronauts (D-50) | **Pass.** 720 of 720 statuses match `expected_colours.csv` | `tests/parity.test.js` |
| Workability, one astronaut (D-50) | **Pass** for SYN-B in Chromium: load, enter a reading, see the status, reload offline, reset | `tests/e2e.test.js` |
| Personal range | **Pass.** SYN-B's heart rate is amber on 6 days, all in the first week | `tests/parity.test.js` |
| Offline | **Pass** in Chromium: after one load, the network is switched off **and** the server is stopped, and the app reloads, shows stored readings, accepts a new one and resets | `tests/e2e.test.js` |
| No outside requests | **Pass**, with the limit described in section 4 | `tests/e2e.test.js`, `tests/offline.test.js` |
| No hard-coding | **Pass.** Changing a band, a limit, a rule or a source in a copy of the JSON changes the result with no code change. A second test fails if any number from the threshold file is typed into the app's code | `tests/engine.test.js` |
| Disclosure | **Pass.** The AI notice is in the README, every file header, the page's meta tags and the About screen | `tests/disclosure.test.js` |

### Other things that were checked

- **Screens (brief section 7):** all six exist and were used in the browser test: Astronaut and data, Enter a reading, Today, History, Mood check (weekly PHQ-2 and the "I am in severe distress" button), About.
- **Status words:** Normal, Caution, Emergency and Not compared, each shown with a colour, a symbol and the word, never colour alone.
- **Health wording:** the limits statement, the guidance sections, the reasons and the status meanings are read from the files at run time. A test compares what reaches the screen with the files.
- **The short limits line** is on every screen. It is also written into `index.html`, so it shows before any script runs; a test checks that it equals the text in `Limits_Statement.md`.
- **Export:** JSON and CSV download for the chosen astronaut; the browser test confirms the files' contents and that no request was made.
- **Reset:** wipes all readings and reloads the clean sample; checked in the browser test while offline.
- **Local server in `app/`:** the app was also loaded from `python -m http.server` started in `app/`, then reloaded with the server stopped. It worked, with no outside requests and no script errors. This was a one-off check, not part of `node --test`.
- **Commit identity:** every commit is by "OrbitNsukka" with the no-reply address, and carries the AI co-author line.

## 4. What was not tested, and what could not be verified

Stated plainly, so nobody assumes more than was checked.

| Not tested or not verified | Why | What to do |
|---|---|---|
| **Firefox, Safari, Edge** | Only Chromium was available in the cloud session | Open the app in each and repeat the SYN-B walk-through |
| **A real phone in flight mode** (brief section 9) | No device in the cloud session | Do the fresh-device test (T-09) on a phone |
| **GitHub Pages** | The repository is private (D-54), so Pages cannot be turned on | After it is public: turn Pages on, open `…/app/`, load once, go offline, reload. The browser test serves the app under `/app/` on a local server to stand in for this |
| **Installing as an app** (home-screen install) | Not tried; no installability audit was run | Try "Install" in Chrome on a phone and a laptop |
| **Accessibility** beyond the basics | No screen-reader test and no measured contrast check. Built in: labels on every field, keyboard focus, status as word and symbol | Interface & Experience to review |
| **Dark colour scheme** | The styles exist; nobody looked at them | Interface & Experience to review |
| **A newer threshold-file version on a real device** | Covered by a Node test with a stand-in for storage, not in a browser | Test when v0.5 exists |
| **Requests made by the service worker itself** | The browser test listens for every request the test tool reports and saw none to another site. It is not certain that the tool reports a worker's own requests. The stronger evidence is static: no file of the app contains another site's address, the worker refuses other origins, and the page's security policy allows the app's own files only | Check the Network panel once by hand |
| **The browser's own update check of `sw.js`** | When online, the browser asks the app's own address whether `sw.js` changed. The app cannot stop this. It goes to no other site and carries no data | None; recorded in `TECH_NOTES.md` |
| **Private-browsing mode, a full disk, storage cleared by the browser** | Not tried. The app shows an error if storage cannot be opened | Try once |
| **The exported CSV opened in a spreadsheet program** | Only read back by the tests | Open one export |
| **Review by people** | No team member has reviewed the code or the screens yet | Team leader review, then Integration, AI & Quality |

**About the storage tests.** `tests/store.test.js` runs in Node against a small in-memory stand-in for IndexedDB written for the tests (`tests/helpers/fake-indexeddb.js`). The real IndexedDB is exercised only in the Chromium browser test.

**About the browser test.** `tests/e2e.test.js` needs Playwright with Chromium, which is a development tool and not part of the app. Where Playwright is not installed, that one test is skipped and `node --test` reports 100 passes and 1 skip. The offline and workability rows above then have no automatic check on that machine.

## 5. What does not pass

No automatic check fails. These are gaps in the build:

| Gap | Effect |
|---|---|
| No edit or delete for a single reading | A mistaken entry stays until Reset, which wipes everything (I-27) |
| `README.md` still has two placeholder links | The hosted app link and the project page link exist only after the repository is public (I-26) |
| The brief's example action "Talk to the flight surgeon" is not shown | It is in the Indicator Sheet, which is not one of the three files screen text may be copied from. The app shows the threshold file's status meaning and the guidance section in its place (I-17) |

## 6. Choices the build made

The brief and `CLAUDE.md` did not settle these. Each is the choice they pointed to most closely. Please confirm or change them.

| # | Choice | Reason |
|---|---|---|
| 1 | Results are worked out from the readings each time, not stored | They always agree with the readings on the device. Each reading keeps its threshold-file version, so old results keep the version they were judged with |
| 2 | One cached copy of the settings per version, with the version recorded on each profile | Same behaviour as "per profile", one copy in place of four (I-22) |
| 3 | The three mood entries share the indicator `mood`, told apart by `kind` | Keeps six indicators |
| 4 | Both blood-pressure readings are required at entry | D-49 stores two (I-24) |
| 5 | Blood sugar: "before a meal?" left unanswered is asked again; "after a meal" is refused | A refusal should follow an answer, not a blank |
| 6 | A reading dated in the future is asked again | It would otherwise stay "latest" for days |
| 7 | Patterns: a day counts when any reading on it meets the test; a missing day breaks a run | The file does not say; this never hides a pattern (I-11) |
| 8 | When a pattern and a band give the same status, the pattern's reason is shown and the band is listed under "Also found" | The pattern carries the action ("report it") |
| 9 | The engine follows the reference checker where the brief's order differs: the personal range lowers the band first, and symptoms can still raise it | Parity with the checker is required (I-23) |
| 10 | Two files beyond the brief's layout: `js/content.js` and `css/style.css` | To read the guidance word for word, and to keep styles out of the page |
| 11 | `reference/tools/stamp_sw.mjs` writes the service worker's file list and build stamp | So a changed file always reaches devices; a test fails if the stamp is stale (I-30) |
| 12 | The full limits statement is shown once on first launch, and always on About | `Limits_Statement.md`, section 1 |
| 13 | The guidance section "Preventive actions for reminders" is not shown | Reminders are a stretch feature (I-21) |

## 7. Issues found

Thirty issues are recorded in `docs/ISSUES.md`, each with what the build did and who decides. None changes a status on the demo data. The ones that most need a decision:

| ID | Issue | For |
|---|---|---|
| I-01 | Four symptom rules have no `sources` list, though the file says every rule has one | Data & Science |
| I-02 | The agreed temperature method (oral) is not a field the engine can read; the engine falls back to "oral" | Data & Science |
| I-03, I-04, I-05 | Several on-screen reasons have no field of their own in the file | Data & Science |
| I-11 | The file does not say how patterns treat several readings on one day | Data & Science |
| I-17 | The Indicator Sheet's action texts are not in a file the screens may copy from | Data & Science, Interface |
| I-18 | The limits statement says never to say "this is normal for you"; the guidance says "That is your normal" and the status word is "Normal" | Data & Science, Interface |
| I-12 | The reference script cannot be run directly in this layout; use `python reference/check.py` | Note only |

## 8. How to check this report yourself

```bash
python reference/check.py
```

```bash
node --test
```

```bash
python reference/tools/expected_colours.py --verify
```

```bash
cd app
python -m http.server 8000
```

Then open `http://localhost:8000`, choose SYN-B, select **Load sample data**, look at **Today** and **History** (the sleep Emergency is on 2026-10-28), enter a reading, switch the network off and reload.

## 9. Next steps for the team

1. Team leader: review the build and this report.
2. Make the repository public (D-54), turn on GitHub Pages, and fill the two links in `README.md`.
3. Run the fresh-device test on a phone in flight mode (T-09).
4. Data & Science: decide the items in section 7 for the next threshold-file version.
5. Interface & Experience: style the screens; change words in `app/js/labels.js` only. After any change in `app/`, run `node reference/tools/stamp_sw.mjs`.
