# Build report

**Team:** OrbitNsukka | **Workstream:** Core Engine / Application | **Date:** Nov 15, 2026
**AI disclosure (D-44, D-56):** this report, and the application it describes, were written by an AI assistant (Claude, Anthropic) at the team leader's direction, in one cloud session, from `docs/REFINED_BUILD_BRIEF.md` (D-58, D-59). **No person has reviewed the build yet.**

---

## 1. Summary

The refined build is complete: the six indicators and the hazard panel work end to end, offline, with reset and export.

- **Every row of the acceptance table passes** (section 3).
- **All automatic checks pass.** `npm test`: 185 tests, 185 pass, 0 fail, 0 skipped. `python reference/check.py` passes. `python reference/tools/expected_colours.py --verify` reports "up to date".
- **The engine matches the reference checker on 720 of 720 statuses.** Red appears only on SYN-B day 14 (sleep), SYN-C day 18 (temperature) and SYN-D day 22 (blood sugar).
- **The hazard panel shows all 30 links** of `Hazard_Links.json`, and never changes a status.
- **The fixed inputs are unchanged.** Nothing in `app/data/`, `reference/` or the expected statuses was edited. No threshold and no rating was changed.
- **The browser test ran**, in Chromium. It was not skipped.
- **A fresh clone was checked:** after `npm ci`, the same tests pass.
- **Not tested:** any browser other than Chromium, a real phone, GitHub Pages, a screen reader, and review by people. See section 4.
- **Nobody could be asked during the build.** Where the briefs were unclear the build chose, and wrote the choice down. `docs/ISSUES.md` records 60 points in all; the 14 choices that most need confirming are in section 6.

All work is on the branch `claude/stoic-maxwell-ykss9q`, one commit per step of the refined brief's section 6, with a draft pull request into `main`. Nothing was merged.

## 2. What was built, step by step

| Step (refined brief, section 6) | What was done |
|---|---|
| 1. Set up | `package.json` (ES modules, Apache-2.0, scripts `test`, `build:css`, `check`), `.gitignore`, `.nojekyll`, `docs/AI_USE.md`. Both reference checks confirmed |
| 2. Engine | `app/js/engine.js`: pure, no imports, no browser calls. Parity reached: 720 of 720. All 38 band edges tested on both sides |
| 3. Settings, storage, input safety, sample data | `settings.js`, `store.js` (IndexedDB, no library), `entry.js`, `sample.js`, each with tests |
| 4. Hazard module | `app/js/hazards.js`: pure. All 30 links, the rules check, order, screen text, no hard-coding |
| 5. Tailwind, screens, hazard panel | Tailwind CSS 3.4.17 compiled to `app/css/app.css` and committed. `index.html`, `ui.js`, `labels.js`, `content.js`, `export.js`. Contrast script |
| 6. Service worker, manifest, icon | `sw.js` (versioned), `manifest.webmanifest`, the team's own icon, the stamp tool, the offline browser test |
| 7. Documents | `DATA_MODEL.md`, `STATUS_RULES.md`, `HAZARD_PANEL.md`, `TECH_NOTES.md`, `ISSUES.md`, `README.md`, this report |

## 3. What passes

### 3.1 The acceptance table (refined brief, section 7)

| Test | Result | Where it is checked |
|---|---|---|
| **Band edges** | **Pass.** Each of the 38 band edges in the file is tested on both sides, including 129 and 130 systolic, 37.4 and 37.5 °C, 53 and 54 mg/dL | `tests/engine.test.js` |
| **Input safety** | **Pass.** Missing, non-numeric and impossible values ask again; the same impossible value twice in a row is accepted and judged; an after-meal sugar is refused and not stored | `tests/entry.test.js`; on screen in `tests/e2e.test.js` |
| **Parity** (four astronauts, D-50) | **Pass. 720 of 720** statuses match `tests/expected_colours.csv`. Red only on SYN-B day 14 (sleep), SYN-C day 18 (temperature), SYN-D day 22 (blood sugar) | `tests/parity.test.js`; again through the app's own loader in `tests/sample.test.js` |
| **Workability** (SYN-B, D-50) | **Pass** in Chromium: load, enter a reading, see the status, reload offline, reset | `tests/e2e.test.js` |
| **Personal range** | **Pass.** SYN-B's heart rate is amber on 6 days, all in the first week | `tests/parity.test.js` |
| **Hazard data shown in full** | **Pass.** Each of the 30 links appears in the panel of its indicator, with its rating, chain and source | `tests/hazards.test.js`; on screen, all six panels, in `tests/e2e.test.js` |
| **Hazard rules hold** | **Pass.** For all 30 links the rating follows `meta.method.closeness_rules` from its `arrows`, its indicator's `observability` and any `override`. **No mismatch**, so nothing had to be logged for this row | `tests/hazards.test.js` |
| **Panel never changes a status** | **Pass.** Results with and without the hazard file are identical for all 720. In the browser, the 180 results of SYN-B are identical with the hazard file blocked | `tests/hazards.test.js`, `tests/e2e.test.js` |
| **No hard-coding** | **Pass.** Changing a band, a limit, a rule, a rating or a label in a copy of either file changes the result or the panel with no code change. A scan fails if any number, rating, label or other text from either data file is typed into the app's code | `tests/engine.test.js`, `tests/hazards.test.js`, `tests/hardcoding.test.js` |
| **Screen text** | **Pass.** Every panel string equals its field in `Hazard_Links.json`, word for word, in the module and on screen | `tests/hazards.test.js`, `tests/e2e.test.js` |
| **Disclosure** (D-56) | **Pass.** The AI notice is in the README, NOTICE, `docs/AI_USE.md`, every document the build wrote, the two meta tags and the About screen. Code files carry no header | `tests/disclosure.test.js`, `tests/e2e.test.js` |
| **Offline** | **Pass** in Chromium. After one load, the network is switched off **and** the server is stopped: the app reloads, shows its stored readings, its compiled CSS and the hazard panel, accepts a new reading, deletes one and resets. No request went to another site | `tests/e2e.test.js`, `tests/offline.test.js` |
| **Fixed inputs unchanged** | **Pass.** `git diff <first commit> -- app/data reference tests/expected_colours.csv tests/expected_colours.meta.json` is empty | `tests/repository.test.js` |

### 3.2 The three commands

| Command | Result |
|---|---|
| `python reference/check.py` | Passes: no gaps, no impossible readings, red only on the three scripted days |
| `python reference/tools/expected_colours.py --verify` | "expected_colours.csv is up to date" |
| `npm test` | 185 tests, 185 pass, 0 fail, 0 skipped |

### 3.3 Other things that were checked

- **A wider parity check.** Beyond the 720 demo statuses, 6,480 statuses from random synthetic rows were judged by the reference checker's own functions and by the engine. All agree (`tests/fuzz.test.js`). The random rows reach every status of every indicator, including heart-rate and blood-pressure reds, which the demo data never shows.
- **Screens** (Core Engine brief, section 7): all six exist and were used in the browser test: Astronaut and data, Enter a reading, Today, History, Mood check (weekly PHQ-2 and the "I am in severe distress" button), About.
- **Status words:** Normal, Caution, Emergency and Not compared, each with a colour, a symbol and the word. Closeness: a word and a row of squares. Never colour alone.
- **Health wording:** the limits statement, the guidance sections, the reasons, the status meanings and the panel are read from the files at run time. Tests compare what is shown with the files (`tests/content.test.js`, `tests/hazards.test.js`, `tests/e2e.test.js`).
- **The short limits line** is on every screen, fixed at the foot of the window. It is also written into `index.html`, so it shows before any script runs; a test checks that it equals the file.
- **Accessibility basics:** every field on every entry screen has a label (checked in the browser for all six indicators); keyboard focus is visible (a 3-pixel ring, checked in the browser); the hazard panel opens and shuts from the keyboard; 50 colour pairs (25 in light, 25 in dark) pass the contrast check at 4.5:1 for text and 3:1 for borders and the focus ring (`npm run contrast`).
- **Tailwind (L-01):** a development dependency only, pinned at 3.4.17. The committed `app/css/app.css` equals a fresh build. The page loads only that file: no CDN, no runtime script.
- **The service worker's file list and stamp** equal the files in `app/` (24 entries, including the compiled CSS and all six data files). A test fails when they are out of step.
- **Updating:** in the browser, a changed file with a new stamp replaced the saved copy on the next online visit.
- **No outside request:** the browser test sends everything that is not for the test server through a stand-in proxy. The proxy first proves it can see such a request, then sees none from the app, including from the service worker.
- **Export:** JSON and CSV download for the chosen astronaut; the browser test reads the files back and confirms that no request was made.
- **No personal information, no agency branding:** a test scans everything the build wrote for e-mail addresses, phone numbers and initials, and checks that the only images in the repository are the team's own icon files.
- **NASA sources (added Nov 16):** `docs/NASA_Sources.md` states every NASA resource the project uses, and how: 15 are cited by a file the app reads (8 of them shown on screen), 23 by the documents behind it, 8 are the challenge and reuse rules, and 42 are logged but not used. A test keeps the page in step with `docs/Sources.md` and with the app's data (`tests/sources.test.js`).
- **Commit identity:** every commit is by "OrbitNsukka" with the no-reply address, and carries the AI co-author line.

## 4. What was not tested, and what could not be verified

Stated plainly, so nobody assumes more than was checked.

| Not tested or not verified | Why | What to do |
|---|---|---|
| **Review by people** | The build ran while the team's laptop was off. No team member has seen the code, the screens or these documents | Team leader review, then Integration, AI & Quality |
| **Firefox, Safari, Edge** | Only Chromium was in the cloud session | Open the app in each and repeat the SYN-B walk-through in the README |
| **A real phone in flight mode** (Core Engine brief, section 9) | No device in the cloud session. The browser test uses a phone-sized window, not a phone | Do the fresh-device test on a phone |
| **GitHub Pages** | Not tried. The build did not check whether the repository is public or whether Pages is on. The address in the README is the one Pages gives this repository; it was not opened | Turn Pages on (root of the default branch), open `…/StellaVita_refined/app/`, load once, go offline, reload. The browser test serves the repository root from a local server, so the app runs under `/app/` as it will on Pages |
| **Installing as an app** (home-screen install) | Not tried; no installability audit was run. The manifest and icons are checked only for shape | Try "Install" in Chrome on a phone and a laptop |
| **A screen reader** | None was used. Labels, roles, focus and contrast were checked by tests only | Interface & Experience to review with a screen reader |
| **The look of the screens** | The AI assistant looked at screenshots at phone width only: Today and Enter a reading in the light scheme, Mood check and About in the dark scheme. History, Astronaut and data and the first-launch screen were exercised by the browser test but not looked at. Nobody else has looked. Wide screens and very small phones were not looked at | Interface & Experience to review |
| **NASA's diagram files** (S-153 to S-158) | The build did not open them. It checked `Hazard_Links.json` against its own rules, not against NASA's files | Data & Science to confirm the chains (`Hazard_Links_Sheet_v2_Draft.md`, section 8) |
| **A newer threshold-file version on a real device** | Covered by a Node test with a stand-in for storage, not in a browser | Test when v0.5 exists |
| **Storage on a real device** | `tests/store.test.js` runs against a small in-memory stand-in for IndexedDB written for the tests. The real IndexedDB is used only in the Chromium test. Private-browsing mode, a full disk and storage cleared by the browser were not tried | Try once. The app shows an error if storage cannot be opened |
| **Many months of readings** | Results are worked out again each time a screen is shown, and History draws every result. This was only run with 180 to 185 readings per astronaut | Measure before real use |
| **The browser's own update check of `sw.js`** | When online, the browser asks the app's own address whether `sw.js` changed. The app cannot stop this. It goes to no other site and carries no data | None; recorded in `TECH_NOTES.md` |
| **The exported CSV in a spreadsheet program** | Only read back by the tests | Open one export |
| **Windows, and Node versions other than 22** | The checks ran on Linux with Node 22 and Python 3.13 only. `package.json` asks for Node 20 or later | Run `npm test` on the team's laptop |
| **`npm test` on a machine with nothing installed** | Tried on a fresh clone in the cloud session, before `npm install`: all but one pass and 1 is skipped with a message (the CSS rebuild check). The browser test still ran there, because that machine has Playwright installed machine-wide. With Playwright hidden, the browser test was skipped cleanly with a message. A machine with neither was not available | Run `npm test` on the team's laptop before and after `npm install` |

**About the browser test.** `tests/e2e.test.js` needs Playwright with Chromium, a development tool that is not part of the app. In the cloud session Chromium was already installed, and Playwright was installed with `npm install` at the matching version (1.63.0). Where Playwright or its browser is missing, the two browser tests are skipped with a message, and the workability, offline and on-screen rows above then have no automatic check on that machine.

## 5. What does not pass

**No automatic check fails, and no acceptance row fails.** These are gaps in the build, all recorded in `docs/ISSUES.md`:

| Gap | Effect |
|---|---|
| The hosted address was not verified (R-51, R-55) | The README gives the address the app will have. It may not open until Pages is turned on |
| No way to edit a reading (R-58) | A mistaken reading is deleted on History and entered again |
| The Core Engine brief's example action "Talk to the flight surgeon" is not shown (R-30) | It is in the Indicator Sheet, which is not a file the screens may copy from. The app shows the threshold file's status meaning and the guidance section in its place |
| Blood sugar has two ids in the two fixed inputs (R-12) | The hazard module holds that one pair of ids. It works, but the next file version should use one id |

## 6. Choices the build made

Nobody could be asked, so each of these is the choice closest to the briefs. **Please confirm or change them.** The full list, with reasons, is section E of `docs/ISSUES.md`.

| # | Choice | Issue |
|---|---|---|
| 1 | The engine follows the reference checker where the brief's order differs: the personal range lowers the band first, and symptoms can still raise it | R-22 |
| 2 | One cached copy of the settings per version, with the version recorded on each profile and reading | R-36 |
| 3 | Both blood-pressure readings are needed at entry | R-37 |
| 4 | Heart-rate source and temperature method are needed; the meter is optional | R-38 |
| 5 | A date in the future is asked again | R-39 |
| 6 | Blood sugar: "before a meal?" left unanswered is asked again; "after a meal" is refused | R-40 |
| 7 | On a tie, a pattern's reason is shown first, then the band's, then a symptom's | R-41 |
| 8 | The mood card on Today shows the latest tap, the latest weekly PHQ-2 and the latest distress mark | R-42 |
| 9 | **Added beyond the brief:** Delete for one reading, on History | R-43 |
| 10 | New folder `tools/`, and `src/theme.json`, `tailwind.config.js`, `tests/helpers/` | R-44 |
| 11 | Playwright pinned at 1.63.0 and logged as L-02 | R-45 |
| 12 | Its own database and cache names, apart from the original build's | R-46 |
| 13 | The panel also shows the file's meanings of the four ratings, as a key; it does not show `override` or `note` | R-19, R-20 |
| 14 | The order of the ratings comes from the order of `closeness_labels`; the symbols are rows of squares made from that order | R-17, R-18 |

## 7. Issues found

`docs/ISSUES.md` records every issue, each with what the build did and who decides. None changes a status on the demo data. The ones that most need a decision:

| ID | Issue | For |
|---|---|---|
| R-12 | The two fixed inputs give blood sugar two ids (`blood_glucose`, `blood_sugar`) | Data & Science |
| R-01 | Four symptom rules have no `sources` list, though the file says every rule has one | Data & Science |
| R-02 | The agreed temperature method (oral) is not a field the engine can read; the engine falls back to "oral" | Data & Science |
| R-03, R-04, R-05, R-13, R-14 | Several on-screen texts have no field of their own in the threshold file | Data & Science |
| R-11 | The file does not say how patterns treat several readings on one day | Data & Science |
| R-17, R-18, R-19 | The hazard file has no field for the order of the ratings and no symbols; its `closeness_meanings` are shown as a key | Data & Science, Interface |
| R-23 | The chains in the hazard file were not compared with NASA's files by the build | Data & Science |
| R-30 | The Indicator Sheet's action texts are not in a file the screens may copy from | Data & Science, Interface |
| R-31 | The limits statement says never to say "this is normal for you"; the guidance says "That is your normal" and the status word is "Normal" | Data & Science, Interface |
| R-52 | Team documents and two data files name workstream leads by initials | Project & Delivery |
| R-59 | Six NASA diagram sources shown in the panel, and seven more cited by the hazard file, are still Logged in `docs/Sources.md`; only S-31 and S-32 are Verified | Data & Science, Project & Delivery |

## 8. How to check this report yourself

```bash
python reference/check.py
```

```bash
python reference/tools/expected_colours.py --verify
```

```bash
npm install
```

```bash
npm test
```

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/app/`, choose SYN-B, press **Load sample data**, look at **Today** and **History** (the sleep Emergency is on 2026-10-28), open **Why this is watched** under a result, enter a reading, switch the network off and reload.

## 9. Next steps for the team

1. Team leader: review the build, this report and the choices in section 6.
2. Make the repository public if it is not (D-54), turn on GitHub Pages, and open the address in the README.
3. Run the fresh-device test on a phone in flight mode.
4. Data & Science: decide the items in section 7 for the next file versions, and confirm the hazard chains against NASA's files.
5. Interface & Experience: review the screens and the dark colours. Change words in `app/js/labels.js` and colours in `src/theme.json` only, then run `npm run build` and `npm test`.
6. Merge the draft pull request when the review is done. The build did not merge it.
