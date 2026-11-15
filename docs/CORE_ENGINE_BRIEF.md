# Core Engine Brief

**Team:** OrbitNsukka | **Workstream:** Core Engine / Application | **Lead:** the team leader (O.B.), in place of A.E. (unavailable) | **Date:** Nov 14, 2026
**Status:** APPROVED by the team leader on Nov 14, 2026 (D-53). A cloud session builds from it without interruption (D-52).
**AI disclosure (D-44):** this brief was drafted by an AI assistant (Claude, Anthropic) at the team leader's direction. The application built from it is AI-generated and is labelled as such.

This brief is everything the build needs. It follows the Core Engine charter, the plan (`docs/CORE_ENGINE_PLAN.md`) and decisions D-43 to D-54. Where it says "must", the rule comes from a decision or a charter. The points that were open in the draft were settled by D-53 and are listed in section 14.

---

## 1. What we build

A progressive web app (D-45) that lets an astronaut enter six readings by hand and see, for each one, a status, a reason and the sources behind it. It works offline after its first load (D-46), stores everything on the device, and judges every reading from one threshold file, never from numbers typed into the code.

**In scope (the MVP, D-05):**
- entry and storage of the six indicators: heart rate, blood pressure, blood sugar, body temperature, sleep hours and mood;
- status for each reading (green, amber or red, always with a word), its reason and its source IDs;
- pattern rules over past readings;
- input safety, the synthetic sample data, reset and export;
- a plain working screen for each step, so the engine can be used and tested end to end.

**Out of scope until the MVP gate (D-06):** the body figure, charts, reminders, gamification, extra environments, and the Qt Quick app (plan, section 9).

**Never in scope:**
- the radiation-biomarker layer (parked, D-21);
- after-meal blood sugar (D-23);
- online accounts, servers or analytics;
- real health data;
- NASA logos, flags or mission identifiers (D-44).

**Interface & Experience** owns the final screens, wording and accessibility polish. The build gives it working screens and the result format below. It does not invent health wording: all text comes from the Data & Science pack.

---

## 2. Fixed inputs (copied into the repository, never edited by the build)

| File | Source | Role |
|---|---|---|
| `Indicator_Thresholds.json` v0.4.0 | `02 Data and Science/Pack v0.4/` | The settings layer: every band, symptom rule, pattern rule, limit and source ID |
| `synthetic_demo_data.csv` and `.meta.json` | same | 4 fictional astronauts over 30 days |
| `generate_synthetic_data.py` | same | The reference checker; the engine must give the same colours |
| `Guidance_Content.md`, `Limits_Statement.md` | same | Text the screens may show, copied word for word |

If the build finds a problem in these files, it records it in `docs/ISSUES.md` and keeps going. It never changes a threshold. A change needs a decision and a new version (D-42).

---

## 3. Decisions the build must follow

| ID | Rule |
|---|---|
| D-23, D-27, D-40 | Blood sugar is accepted only before a meal (on waking is fine). Anything else is refused |
| D-29 | Blood sugar records which meter was used. No claim about meter accuracy |
| D-33, D-39 | Heart-rate personal range: below 60 shows green when the median of the previous 14 readings (at least 7) is below 60 and the reading is within 10 bpm of it |
| D-35 | Temperature records its method. Only the mission's agreed method (oral) is judged; any other reading is stored and shown as "not compared" |
| D-31, D-32, D-20 | A single mood tap never sets a colour. The weekly PHQ-2 has its own bands. "Severe distress" is red at once |
| D-43 | Apache License 2.0 |
| D-44 | AI use is disclosed in text and metadata, visibly, in code, data, documents and the app. No NASA branding |
| D-45 | Progressive web app for mobile and desktop |
| D-46 | The threshold file is cached on first load for the profile. Profiles live on the device; no accounts |
| D-47 | Libraries only when necessary, bundled in the app (no runtime downloads), each logged with an L-ID |
| D-48 | Impossible-reading limits from `plausible_range`. Outside them, ask again. The same value entered twice in a row is accepted and judged |
| D-49 | Blood pressure: two readings stored; the latest one judged |
| D-50 | Tests: one astronaut for workability, all four for consistency |
| D-51 | Symptoms are entered by hand with each reading, from the symptom lists in the file |
| Charter | Nothing leaves the device. Only synthetic data. Thresholds never hard-coded. Missing or impossible input is never shown as a status |

---

## 4. How it is built

- **Plain HTML, CSS and JavaScript (ES modules)**, with no framework and no build step needed to run it. This keeps it offline, small and free of library licences.
- **Service worker** caches the app shell, the threshold file and the sample data on first load (D-46).
- **Storage is on the device (D-53):** IndexedDB for readings and profiles, accessed directly. A library is added only if it proves necessary; it is then bundled in the app and logged with an L-ID (D-47).
- **The engine is one pure module** (`engine.js`): no browser calls, no storage, no screen code. It takes the settings and a list of readings and returns results. So it can be tested in Node, and reused later in a Qt Quick app (plan, section 9).
- **Tests use Node's built-in test runner** (`node --test`). That is a development tool, not part of the app.

**Repository layout:**

```
app/
  index.html              entry point; AI notice in <meta> and the About screen
  manifest.webmanifest    PWA manifest (own icon, no NASA marks)
  sw.js                   service worker: offline cache, versioned
  js/engine.js            pure status engine (bands, symptoms, personal range, patterns)
  js/settings.js          loads, checks and caches the threshold file
  js/entry.js             input checks, "ask again", accepted contexts
  js/store.js             IndexedDB: profiles, readings, cached settings
  js/sample.js            loads the demo CSV; reset to clean sample data
  js/export.js            export readings and results to a file (download only)
  js/ui.js                plain working screens
  js/labels.js            the words shown on screen (Normal, Caution, Emergency); owned by Interface
  data/                   the fixed inputs from section 2, unchanged
  icons/                  the team's own icon
reference/                generate_synthetic_data.py (copy) and tools/expected_colours.py
tests/                    engine, entry, parity and storage tests
docs/                     this brief, DATA_MODEL.md, STATUS_RULES.md, TECH_NOTES.md, AI_USE.md, ISSUES.md
LICENSE  NOTICE  README.md  CLAUDE.md  .nojekyll
```

---

## 5. Data model (the settings-layer description)

**Profile**
- `{ id: "SYN-B", label: "Astronaut B (synthetic)", createdAt, thresholdsVersion: "0.4.0" }`
- A local choice of astronaut. No name, no password.

**Cached settings**
- `{ version: "0.4.0", loadedAt, json }`
- Stored per profile on first load (D-46).
- On a later online load with a newer version, the new copy is stored, and old results keep the version they were judged with.

**Reading** (one per entry). Common fields: `{ id, profileId, indicator, date, time, symptoms: [], note }`. Each indicator adds:
- heart rate: `value`, `source` ("device" or "count");
- blood pressure: `readings: [{systolic, diastolic}, {systolic, diastolic}]`; the latest is judged (D-49);
- blood sugar: `value`, `context: "before_meal"`, `meter`;
- temperature: `value`, `method` ("oral" or another);
- sleep: `value` (hours);
- mood: `value` (tap, 1 to 5);
- PHQ-2 (weekly): `items: [0 to 3, 0 to 3]`;
- distress mark: `marked: true`.

**Result** (the Interface contract, index section 3). The `reason` and `source_ids` are read from the matching band or rule:

```
{ readingId, indicator, value, unit,
  status: "normal" | "warning" | "contact" | "not_judged",
  reason: "39.4 or higher",
  source_ids: ["S-27"],
  rule: "band" | "symptom" | "pattern" | "personal_range" | "not_compared",
  thresholdsVersion: "0.4.0" }
```

`not_judged` is not a colour. It is used only for a temperature taken by another method (D-35), shown as "not compared".

---

## 6. Status rules (must match the Indicator Sheet v0.4)

The engine applies these in order, all parameters from the threshold file:

1. **Accept or ask again:**
   - The value must be present and a number.
   - It must be inside `plausible_range`. Outside it, ask again; if the same value is entered twice in a row, accept it (D-48).
   - Blood sugar must be before a meal (D-23).
2. **Round** to the indicator's `resolution`.
3. **Band:** find the one band whose `min` and `max` (inclusive) hold the value. Blood pressure: judge systolic and diastolic separately and take the worse; a low reading (90/60 or lower) turns amber only with dizziness or fainting recorded.
4. **Symptoms:** apply `symptom_rules`. They can only raise the status. The heart-rate rule applies only when the rate's own band is amber (`only_if_band`).
5. **Personal range (heart rate only):** apply `baseline_rule`. It is the only rule that lowers a status.
6. **Patterns:** apply `pattern_rules` over the profile's earlier readings by date:
   - `consecutive` means days in a row;
   - `within_days` is a window that ends on the reading's day;
   - `stage2_persistent` needs an earlier stage-2 reading 7 to 14 days before.
7. **Final status** is the worst of steps 3, 4 and 6, after step 5. The result takes the reason and source IDs of whatever set it.
8. **Temperature by another method:** stored, status `not_judged`, reason "not compared: taken by another method".
9. **Mood:** a single tap is always `normal`, with the reason "trend only". The weekly PHQ-2 is judged against its own bands. A distress mark is `contact`.

**Required behaviour on the demo data**, the same as the reference checker:
- red only on SYN-B day 14 (sleep), SYN-C day 18 (temperature) and SYN-D day 22 (blood sugar);
- no red on any other day;
- no impossible readings;
- 120 rows × 6 indicators all judged, with no gaps.

---

## 7. Screens the build provides (plain and working; Interface styles them later)

1. **Choose an astronaut** (SYN-A to SYN-D), and **Load sample data / Reset**.
2. **Enter a reading** for each indicator, with:
   - the symptom checklist from the file;
   - the extra fields: two blood-pressure readings, meter, temperature method, "before a meal?";
   - the "ask again" prompt.
3. **Today:** the six latest results, each as a colour **and** a word, with its reason and source IDs.
4. **History:** a list of results by day for the chosen astronaut.
5. **Weekly PHQ-2** and the **"I am in severe distress"** button.
6. **About:**
   - the limits statement, word for word;
   - the AI disclosure;
   - the threshold-file version;
   - the licence.

The short limits line stays visible on every screen (Limits Statement, section 2).

**Status words (D-53).** The threshold file's keys do not change; the screen shows these words, kept in `js/labels.js`:

| Key in the file | Colour | Word on screen |
|---|---|---|
| `normal` | Green | Normal |
| `warning` | Amber | Caution |
| `contact` | Red | Emergency |
| `not_judged` | None | Not compared |

The action text under each result stays exactly as Data & Science wrote it. For example, the sleep red shows "Emergency" with the action "Talk to the flight surgeon".

---

## 8. Reset and export

- **Reset** wipes the device's readings for all profiles and reloads the clean sample data.
- **Export** downloads the profile's readings and results as JSON and CSV. It never uploads anything.

---

## 9. Offline and privacy

- After the first load, the app runs with no network at all. Check it in the browser's offline mode and on a phone in flight mode.
- No request leaves the device after the first load. No analytics, fonts or scripts from other sites.
- The first load must come over https or from localhost, because service workers need it. **Hosting (D-53): GitHub Pages**, serving the repository root from the default branch, so the app's address ends in `/app/`. The app therefore uses relative paths only, and the repository carries a `.nojekyll` file. Pages can be turned on only once the repository is public (D-54); until then, test with a local server.

---

## 10. AI disclosure in the build (D-44)

- **`README.md` and `docs/AI_USE.md`:** say plainly that the code, data and documents were generated with an AI assistant (Claude, Anthropic), how it was used, and that the team leader reviewed and approved it.
- **Every source file** starts with a one-line comment: "AI-generated (D-44): written by an AI assistant at the team leader's direction."
- **`index.html`:** `<meta name="generator">` and `<meta name="ai-disclosure">` tags.
- **The About screen** shows the disclosure, so judges can see it in the running app.
- **Commit messages** carry an AI co-author line.
- **No NASA logos, flags, mission patches or mission identifiers** anywhere. The icon is the team's own simple design.

---

## 11. Tests and acceptance

| Test | Passes when |
|---|---|
| Band edges | Each band edge in the file is tested on both sides (for example, 129 and 130 systolic; 37.4 and 37.5 °C; 53 and 54 mg/dL) |
| Input safety | Missing, non-numeric and impossible values ask again; the same impossible value twice is accepted; an after-meal sugar is refused |
| Parity (four astronauts, D-50) | The engine's status for all 120 rows × 6 indicators matches `expected_colours.csv` from the reference checker exactly |
| Workability (one astronaut, D-50) | SYN-B end to end: load, enter a reading, see the status, reload offline, reset |
| Personal range | SYN-B's heart rate is amber on 6 days, as in the checker |
| Offline | Works with the network off after one load; no outside requests |
| No hard-coding | Changing a band in a copy of the JSON changes the result with no code change |
| Disclosure | The AI notice appears in the README, file headers, meta tags and the About screen |

**Done when** (Core Engine charter): all six indicators work end to end, offline, with a clean reset; bad or missing input is handled safely; all tests above pass.

---

## 12. Order of work in the cloud session

1. Set up the repository: layout, LICENSE (Apache 2.0), NOTICE, README with the AI disclosure, and the fixed inputs copied in unchanged.
2. `reference/tools/expected_colours.py`: writes `tests/expected_colours.csv` from the reference checker.
3. `engine.js` and its tests, until parity passes. **This is checkpoint T-05's core.**
4. `settings.js`, `store.js`, `entry.js`, `sample.js`. **This is T-01: six indicators entered and stored offline.**
5. Service worker and manifest; the offline test.
6. The plain screens (section 7), reset and export.
7. Docs: `DATA_MODEL.md`, `STATUS_RULES.md`, `TECH_NOTES.md` (libraries with L-IDs, or "none"), `AI_USE.md`, `ISSUES.md`.
8. A final report: what passes, what doesn't, and every issue found.

Commit after each step. Do not change the fixed inputs, add an unlogged library, or start stretch features.

---

## 13. The GitHub repository

The cloud session starts from a GitHub repository (D-52). The team leader sets it up with these properties:

- **Owned by the team, with no names.** The account or organisation name and profile show "OrbitNsukka" only, with no photo, real name or location (D-12).
- **Repository name** with no NASA in it, for example `orbitnsukka-health-monitor`.
- **Visibility (D-54):** private while the app is built, and made public when the build is done. Judges need the link by the early submission (T-11), and free GitHub Pages hosting needs a public repository.
- **Contents allowed in:**
  - the app;
  - the Pack v0.4 files listed in section 2;
  - this brief and the Core Engine plan;
  - the Decision Log, Sources.md, the index and the charters, if the team wants them public.
- **Kept out:**
  - the `Sources offline` PDFs (several are copyrighted);
  - the research notes `.docx` (it carries a personal name);
  - the `orbit-bot` folder (a separate project with its own secrets);
  - the archive;
  - any webhook URL.
- **Commit identity:** the name "OrbitNsukka" and a GitHub no-reply e-mail, never a member's name.
- **Access for the build:** connect the repository to Claude Code on the web (claude.ai/code) with GitHub access, and choose an environment. The session starts from the repository's default branch.

---

## 14. Confirmed before the build (D-53)

| # | Item | Decided |
|---|---|---|
| 1 | Storage | On the device, in IndexedDB; a library only when needed (D-47) |
| 2 | Hosting for the first load | GitHub Pages |
| 3 | The one-astronaut test profile | SYN-B |
| 4 | Status words beside the colours | Normal, Caution, Emergency |
| 5 | General documents in the public repository | The Decision Log, Sources.md, the index and the charters |

*Approved by the team leader (D-53).*
