# Technical notes

**Team:** OrbitNsukka | **Workstream:** Core Engine / Application | **Date:** Nov 15, 2026
**AI disclosure (D-44, D-56):** this document was written by an AI assistant (Claude, Anthropic) at the team leader's direction, as part of the refined build from `docs/REFINED_BUILD_BRIEF.md` (D-58, D-59).

---

## 1. Libraries (D-47, D-55, D-58)

**The running app uses no library.** It loads one compiled stylesheet and its own JavaScript modules. There is no framework, no runtime script from anywhere else, no CDN and no outside font.

Two tools are installed as **development dependencies only**, pinned to exact versions in `package.json` and `package-lock.json`:

| L-ID | Tool | Version | Licence | Why it is needed | In the app? |
|---|---|---|---|---|---|
| L-01 | Tailwind CSS (Tailwind Labs, Inc.) | 3.4.17 | MIT | Compiles `src/input.css` to `app/css/app.css` at build time (D-58). The compiled file is committed | Only its output: the compiled CSS, which includes Tailwind's base styles and keeps its licence comment |
| L-02 | Playwright (Microsoft) | 1.63.0 | Apache-2.0 | Runs the browser test (`tests/e2e.test.js`) and draws the PNG icons from the SVG (`tools/make_icons.mjs`) | No |

Both are also listed in `NOTICE` and in section 4 of `docs/Sources.md`. Installing them brings in other packages they depend on (see `package-lock.json`). None of those is part of the app.

**Withdrawn and not used anywhere (D-55):** Express.js, MongoDB, LangGraph, LangChain and FastAPI. A test checks that none is a dependency (`tests/style.test.js`).

What the app uses is built into every modern browser: ES modules, IndexedDB, the Cache API, service workers and the web app manifest.

## 2. Development tools

| Tool | Used for | Needed to run the app? |
|---|---|---|
| Node.js 20 or later (built-in test runner) | `npm test` | No |
| Python 3 (standard library) | `python reference/check.py`, `python reference/tools/expected_colours.py --verify`, and a local server | No |
| Tailwind CSS (L-01) | `npm run build:css` | No |
| Playwright with Chromium (L-02) | The browser test. It is skipped cleanly where Playwright or its browser is missing | No |

## 3. How the app is put together

```
app/
  index.html            the one page; AI notice in its meta tags; content security policy
  manifest.webmanifest  install information; relative paths
  sw.js                 service worker: saves the app for offline use; versioned
  css/app.css           compiled Tailwind output (committed)
  js/engine.js          the status engine: pure, no browser calls, no imports
  js/hazards.js         the hazard panel's data: pure, no browser calls, no imports
  js/settings.js        loads, checks and caches the threshold file
  js/entry.js           input safety: ask again, accept twice, refuse after-meal sugar
  js/store.js           IndexedDB: profiles, readings, cached settings
  js/sample.js          reads the demo CSV into readings; reset
  js/content.js         cuts the guidance and limits texts into pieces, word for word
  js/export.js          JSON and CSV download
  js/labels.js          the words on screen that are not health wording (owned by Interface & Experience)
  js/ui.js              the screens
  data/                 the six fixed input files, unchanged
  icons/                the team's own icon (SVG, and PNGs drawn from it)
src/
  input.css             the Tailwind source
  theme.json            the colours, light and dark, and the pairs the contrast check tests
tailwind.config.js      reads src/theme.json; scans app/index.html and app/js/ for class names
tools/
  stamp_sw.mjs          writes the service worker's file list and version stamp
  contrast.mjs          checks the contrast of every colour pair
  make_icons.mjs        draws the PNG icons from the SVG
reference/              the reference checker and its tools (fixed inputs)
tests/                  node --test files, their helpers, and expected_colours.csv (fixed input)
```

Beyond the layout in the refined brief (section 4), the build added `tools/`, `src/theme.json`, `tailwind.config.js` and `tests/helpers/` (`docs/ISSUES.md`, R-44).

- **Two pure modules.** `engine.js` and `hazards.js` import nothing and touch no browser object, so they run in Node for the tests. Tests check this. Neither knows the other exists: the engine never sees a hazard, and the hazard module never sees a reading.
- **Screens are built as text, not markup.** Everything shown is added as text nodes, so nothing typed into a note can run as code. The content security policy in `index.html` allows the app's own files only, with no inline script or style.
- **Nothing from the data files is typed into the code.** `tests/hardcoding.test.js` reads every number, rating, label and other text out of the two data files and fails if any of them appears in `app/js/` or `app/sw.js` (the numbers 0, 1 and 2 are allowed, because no program can be written without them).

## 4. Building

The app runs as it is: the compiled CSS and the stamped service worker are committed. After **any change in `app/` or `src/`**:

```bash
npm install
```

```bash
npm run build
```

`npm run build` compiles the CSS (`npm run build:css`) and then writes the service worker's stamp (`npm run stamp`). **The order matters:** the stamp covers the compiled CSS. `npm test` fails if either is out of step.

Class names are found by Tailwind in `app/index.html` and `app/js/*.js`, so a class used on screen must be written out in full in one of those files.

## 5. Colours and contrast

The colours are in `src/theme.json`, once for the light scheme and once for the dark scheme (the app follows the device's setting). Tailwind writes them into the CSS as variables, and the screens use only those colours: a test fails if a Tailwind palette colour is used directly.

```bash
npm run contrast
```

This checks 25 pairs in each scheme: at least 4.5:1 for text, and at least 3:1 for borders and the focus ring. All 50 pass. The same check runs in `npm test`.

Status and closeness are never shown by colour alone: each has a word and a symbol.

## 6. Offline (D-46)

1. On the first visit the service worker saves every file of the app: the page, the compiled CSS, the modules, the icons and all six data files (24 entries).
2. After that, every request the page makes is answered from the saved copy. The app works with no network.
3. The worker refuses any request to another site, and the page's content security policy allows only the app's own files.

**Updating.** `app/sw.js` holds a list of files and a version stamp, both written by `tools/stamp_sw.mjs`. The stamp changes when any file's name or content changes, so browsers fetch the new version on their next online visit, and the old saved copy is then removed. Only caches whose name starts with `stellavita-refined-` are ever removed, so the original build's saved copy on the same site is left alone.

**One request the app cannot stop.** When a device is online, the browser itself checks whether `sw.js` has changed. That check goes only to the app's own address and carries no data from the app.

## 7. Privacy

- Readings, profiles and settings stay in the browser's storage on the device, in the database `stellavita-refined`.
- The app has no accounts, analytics, outside fonts or outside scripts. The only code that fetches is the loader in `ui.js` (five files in `app/data/`) and the service worker (the app's own files).
- Export is a file download. Reset wipes the readings. Delete removes one.
- Tests check these points (`tests/offline.test.js`, `tests/e2e.test.js`). In the browser test, any request to another site would have to pass a stand-in proxy; the proxy saw none.

## 8. Hosting (D-53, D-54, D-59)

- **GitHub Pages**, from the repository root on the default branch. The app's address then ends in `/app/`: `https://orbitnsukka.github.io/StellaVita_refined/app/`.
- All paths in the app are relative, so it also works from a local server started in the repository root or in `app/`.
- The repository has a `.nojekyll` file, so Pages serves the files as they are.
- **Pages was not tested in the build.** The browser test serves the repository root from a local server, so the app runs under `/app/` as it will on Pages.

## 9. Running and testing

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/app/`.

```bash
python reference/check.py
```

```bash
python reference/tools/expected_colours.py --verify
```

```bash
npm test
```

## 10. Browser support

The app needs a browser with ES modules, IndexedDB and service workers: current Chrome, Edge, Firefox and Safari all have them. **Only Chromium was tested in the build.** See `docs/BUILD_REPORT.md`.

## 11. Licence and export control

- The team's code and documents are under the Apache License 2.0 (D-43).
- The compiled CSS contains Tailwind CSS's base styles, under the MIT licence (L-01). The notice is kept in the file and in `NOTICE`. MIT is compatible with Apache 2.0.
- The app uses no encryption of its own and contains nothing export-controlled that the build is aware of.
