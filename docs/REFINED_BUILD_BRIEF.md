# Refined Build Brief

**Team:** OrbitNsukka | **Date:** Nov 15, 2026 | **Decisions:** D-55 to D-59
**Repository:** `OrbitNsukka/StellaVita_refined`, separate from the original `OrbitNsukka/StellaVita` (D-59)
**Status:** Written at the team leader's direction for a cloud session that builds without interruption. The team's laptop is off during the build, so nobody can answer questions. Where something is unclear, take the choice closest to this brief and to `docs/CORE_ENGINE_BRIEF.md`, record it in `docs/ISSUES.md`, and keep going.
**AI disclosure (D-44):** this brief was written by an AI assistant (Claude, Anthropic) at the team leader's direction.

---

## 1. What to build

Rebuild StellaVita **from scratch** in this repository: the same offline progressive web app as the original, plus a hazard panel that shows, for each indicator, why it is watched (D-57).

- **Everything in `docs/CORE_ENGINE_BRIEF.md` still applies** (scope, decisions, status rules, screens, offline, privacy, tests), except where this brief changes it. Read that brief first.
- **Where its paths differ, this repository wins.** That brief describes the original repository's layout; this repository uses the layout in section 4.
- **The original build's documents are in `docs/original-build/`** (status rules, data model, issues, build report, technical notes). Use them to understand the agreed behaviour. Its code is not in this repository: write all code new.
- **Correctness is proven by parity.** `tests/expected_colours.csv` comes from the reference checker. The new engine must match it exactly.

## 2. Fixed inputs (never edit)

| File | What it is |
|---|---|
| `app/data/Indicator_Thresholds.json` v0.4.0 | Every band, rule, limit, reason and source ID |
| `app/data/synthetic_demo_data.csv`, `.meta.json` | The demo data: 4 synthetic astronauts over 30 days |
| `app/data/Guidance_Content.md`, `app/data/Limits_Statement.md` | The only health wording the screens may show |
| `app/data/Hazard_Links.json` v1.0.0 | **D-57.** The approved hazard links: 30 hazard-indicator pairs, each with NASA's chain of nodes, its closeness rating and its sources. Also the panel's screen text (`meta.screen_text`) and one summary per indicator |
| `reference/generate_synthetic_data.py` | The reference checker. Run it with `python reference/check.py` |
| `tests/expected_colours.csv`, `.meta.json` | The reference checker's status for all 720 demo statuses. `python reference/tools/expected_colours.py --verify` re-checks them |

If you find a problem in any of these, write it in `docs/ISSUES.md` and keep going. Never change a threshold or a rating.

## 3. Decisions that change the original brief

| ID | What changes |
|---|---|
| D-55 | No Express.js, MongoDB, LangGraph, LangChain or FastAPI, anywhere |
| D-56 | Code files **don't** start with the "AI-generated (D-44)" comment. The disclosure stays, visibly, in `README.md`, `NOTICE`, `docs/AI_USE.md`, every document, the `<meta name="generator">` and `<meta name="ai-disclosure">` tags in `app/index.html`, and the About screen. Commits keep the AI co-author line. The scripts already in `reference/` keep their headers |
| D-57 | Show the hazard panel from `Hazard_Links.json` (section 5) |
| D-58 | Tailwind CSS is allowed, compiled at build time (section 4) |
| D-59 | The build lives in this separate repository. GitHub Pages serves it from the repository root, so the app's address ends in `/app/` |

## 4. How it is built

```
app/
  index.html  manifest.webmanifest  sw.js
  css/app.css         compiled Tailwind output (committed)
  js/engine.js        pure status engine
  js/hazards.js       pure hazard-panel module
  js/settings.js  js/entry.js  js/store.js  js/sample.js  js/export.js  js/labels.js  js/content.js  js/ui.js
  data/               fixed inputs (section 2)
  icons/              the team's own icon
src/input.css         Tailwind source
reference/            reference checker and tools (fixed)
tests/                node --test files, plus expected_colours.csv
docs/                 briefs, team documents, Data & Science documents, and the build's own documents
```

- **App:** plain HTML and JavaScript ES modules, no framework, no runtime libraries, relative paths only. Add a `.nojekyll` file at the root for GitHub Pages.
- **Tailwind CSS (L-01):**
  - Install it as a **dev dependency only**, pinned to an exact version. Use v3.4.17, or the latest 3.4.x if that one is unavailable.
  - Compile `src/input.css` to `app/css/app.css` with `npm run build:css`, and commit the compiled file.
  - The app loads only that file: no CDN, no runtime script.
  - Log the version, MIT licence and reason in `docs/TECH_NOTES.md`, in section 4 of `docs/Sources.md` (as L-01), and under "Third-party libraries" in `NOTICE`.
- **Engine:** one pure module. No browser calls, no storage, no imports from the screens.
- **Hazards:** a second pure module. It reads `Hazard_Links.json` and returns, for one indicator, the five hazards with their rating, chain and sources. It never looks at a reading and never touches a status.
- **Storage:** IndexedDB on the device. **Offline:** a versioned service worker caches the app shell, the compiled CSS and all six data files. Keep its file list and version stamp in step with the files, and test that they are.
- **Tests:** Node's built-in runner, plus a Playwright browser test (installed as a dev dependency; skip it cleanly if browsers can't be installed).

## 5. The hazard panel (D-57)

- **Where:** under each result on **Today**, and on the **Enter a reading** screen for the chosen indicator. On each, it is a section that starts closed and opens with a keyboard-reachable button, titled with `meta.screen_text.panel_title`.
- **What it shows, all read from `Hazard_Links.json`:**
  - `meta.screen_text.panel_intro`;
  - the indicator's `summary`;
  - the five hazards, each with:
    - its label from `hazard_labels`;
    - its closeness word from `closeness_labels`, shown as a word **and** a symbol, never colour alone;
    - the chain of NASA node names joined by arrows;
    - the diagram's source ID;
  - `meta.screen_text.limit`, always visible while the panel is open.
- **Order:** Close first, then Intermediate, Distant and Not linked.
- **Never:** it never changes, colours or explains a status. It is never used to say which hazard caused a reading. No text, number or rating in the panel is typed into the code.
- **About screen:** add one line naming the hazard file's version and D-57.

## 6. Order of work (commit and push after each step)

1. **Set up:**
   - `package.json` with `"type": "module"`, `"license": "Apache-2.0"`, and scripts `test` (`node --test`), `build:css` and `check` (`python reference/check.py`);
   - `.gitignore` for `node_modules`;
   - `docs/AI_USE.md`;
   - confirm `python reference/check.py` and `python reference/tools/expected_colours.py --verify` pass.
2. **Engine and its tests:** keep going until the parity test passes **720 of 720**, and every band edge is tested on both sides.
3. **Settings, storage, input safety, sample data**, with tests.
4. **Hazard module and its tests** (section 7).
5. **Tailwind, screens and the hazard panel.** Include accessibility: labels on every field, keyboard focus, never colour alone, and text contrast of at least 4.5:1 checked with a small script.
6. **Service worker, manifest and icon**, plus the offline browser test. The icon is the team's own simple design, with no NASA marks.
7. **Documents in `docs/`:**
   - `DATA_MODEL.md`, `STATUS_RULES.md`, `HAZARD_PANEL.md`, `TECH_NOTES.md`, `ISSUES.md`;
   - update `README.md` with how to run the app and its hosted address;
   - `BUILD_REPORT.md`: what passes, what doesn't, what wasn't tested, plainly.

## 7. Acceptance (all must pass)

| Test | Passes when |
|---|---|
| Everything in section 11 of `docs/CORE_ENGINE_BRIEF.md` | Band edges, input safety, parity, workability (SYN-B), personal range, offline, no hard-coding, disclosure (as changed by D-56) |
| Parity | 720/720 statuses match `tests/expected_colours.csv`. Red only on SYN-B day 14 (sleep), SYN-C day 18 (temperature), SYN-D day 22 (blood sugar) |
| Hazard data shown in full | Every one of the 30 links appears in the panel of its indicator, with its rating, chain and source |
| Hazard rules hold | For every link, the rating follows `meta.method.closeness_rules` from its `arrows`, its indicator's `observability` and any `override`. A mismatch is logged in ISSUES, never fixed in the file |
| Panel never changes a status | Results with and without the hazard file loaded are identical for all 720 |
| No hard-coding | Changing a rating or a label in a copy of `Hazard_Links.json` changes the panel with no code change. No number or rating from either data file is typed into the code |
| Screen text | Every panel string equals its field in `Hazard_Links.json`, word for word |
| Disclosure (D-56) | README, NOTICE, AI_USE.md, documents, meta tags and the About screen carry the AI notice. Code files don't need the header |
| Offline | Works with the network off after one load, including the panel and the compiled CSS. No request to another site |
| Fixed inputs unchanged | `git diff <first commit> -- app/data reference tests/expected_colours.csv tests/expected_colours.meta.json` is empty |

```bash
python reference/check.py
```

```bash
python reference/tools/expected_colours.py --verify
```

```bash
npm test
```

## 8. Rules that are never broken

- No personal information: no member names, faces, voices or e-mail addresses. The team is "OrbitNsukka".
- Synthetic data only. Nothing leaves the device after the first load: no analytics, no outside fonts, scripts or CDNs.
- No NASA logos, flags, mission patches or mission identifiers. The words "NASA Space Apps Challenge" as plain text are fine.
- Guidance, not diagnosis. Health wording on screen is copied word for word from the approved files.
- No stretch features: no body figure, charts, reminders, gamification or Qt app.
- Apache 2.0. Commit identity: name `OrbitNsukka`, e-mail `322548554+Pi-Infinity-Space@users.noreply.github.com`. End each commit with the AI co-author line.
- Work on your own branch and push after each step. Open a **draft** pull request into `main` when you finish. Don't merge.
