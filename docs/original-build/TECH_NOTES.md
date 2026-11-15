# Technical notes

**Team:** OrbitNsukka | **Workstream:** Core Engine / Application | **Date:** Nov 15, 2026
**AI disclosure (D-44):** this document was written by an AI assistant (Claude, Anthropic) at the team leader's direction, as part of the build from `docs/CORE_ENGINE_BRIEF.md` (D-52, D-53).

---

## 1. Libraries (D-47)

**None.** The app uses no library, framework or outside font, image or script. There is nothing to bundle and no L-ID to log.

| L-ID | Library | Version | Licence | Why needed |
|---|---|---|---|---|
| — | none | — | — | — |

What the app uses is built into every modern browser: ES modules, IndexedDB, the Cache API, service workers and the web app manifest.

## 2. Development tools (not part of the app, not shipped)

| Tool | Used for | Needed to run the app? |
|---|---|---|
| Node.js 18 or later (built-in test runner) | `node --test` | No |
| Python 3 (standard library) | `reference/check.py`, `reference/tools/expected_colours.py`, and a local server | No |
| Playwright with Chromium | The browser test, `tests/e2e.test.js`. It is skipped where Playwright is not installed. It was also used once to draw the PNG icons from the SVG | No |

`package.json` has no dependencies. It exists so that Node reads the app's `.js` files as ES modules when the tests run.

## 3. How the app is put together

```
app/
  index.html            the one page; AI notice in its meta tags
  manifest.webmanifest  install information; relative paths
  sw.js                 service worker: saves the app for offline use
  css/style.css         plain styles, light and dark
  js/engine.js          the status engine: pure, no browser calls, no imports
  js/settings.js        loads, checks and caches the threshold file
  js/entry.js           input safety: ask again, accept twice, refuse after-meal sugar
  js/store.js           IndexedDB: profiles, readings, cached settings
  js/sample.js          reads the demo CSV into readings
  js/content.js         reads the guidance and limits texts, word for word
  js/export.js          JSON and CSV download
  js/labels.js          the words on screen (owned by Interface & Experience)
  js/ui.js              the six working screens
  data/                 the fixed inputs, unchanged
  icons/                the team's own icon
```

Two files were added to the layout in the brief: `js/content.js` and `css/style.css`.

- **No build step.** The files run as they are.
- **The engine is pure.** `engine.js` imports nothing and touches no browser object, so it runs in Node for the tests and could be reused in a Qt Quick app later (plan, section 9). A test checks this.
- **Screens are built as text, not markup.** Everything shown is set with `textContent`, so nothing typed into a note can run as code.

## 4. Offline (D-46)

1. On the first visit the service worker saves every file of the app, including the threshold file, the sample data and the guidance texts.
2. After that, every request the page makes is answered from the saved copy. The app works with no network.
3. The worker refuses any request to another site, and the page's content security policy allows only the app's own files.

**Updating.** `sw.js` holds a list of files and a build stamp. Both are written by a tool:

```bash
node reference/tools/stamp_sw.mjs
```

**Run it after changing any file in `app/`.** The stamp changes when any file changes, so browsers fetch the new version on their next online visit. If you forget, `node --test` fails and tells you.

**One request the app cannot stop.** When a device is online, the browser itself checks whether `sw.js` has changed. That check goes only to the app's own address and carries no data from the app.

## 5. Privacy

- Readings, profiles and settings stay in the browser's storage on the device.
- The app has no accounts, analytics, outside fonts or outside scripts. The code that fetches reads only files inside `app/data/`.
- Export is a file download. Reset wipes the readings.
- Tests check these points (`tests/offline.test.js`, `tests/e2e.test.js`).

## 6. Hosting (D-53, D-54)

- **GitHub Pages**, from the repository root on the default branch. The app's address then ends in `/app/`.
- All paths in the app are relative, so it also works from `python -m http.server` started in `app/`.
- The repository has a `.nojekyll` file, so Pages serves the files as they are.
- Pages can be turned on once the repository is public (D-54). **This was not tested in the build**, because the repository is still private. The browser test serves the app under `/app/` on a local server to stand in for it.

## 7. Running and testing

```bash
cd app
python -m http.server 8000
```

Then open `http://localhost:8000`.

```bash
python reference/check.py
```

```bash
node --test
```

```bash
python reference/tools/expected_colours.py --verify
```

## 8. Browser support

The app needs a browser with ES modules, IndexedDB and service workers: current Chrome, Edge, Firefox and Safari all have them. **Only Chromium was tested in the build.** See `docs/BUILD_REPORT.md`.

## 9. Licence and export control

- The team's code and documents are under the Apache License 2.0 (D-43).
- No third-party code is included.
- The app uses no encryption of its own and contains nothing export-controlled that the build is aware of.
