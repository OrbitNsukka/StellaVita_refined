# Data model and settings layer

**Team:** OrbitNsukka | **Workstream:** Core Engine / Application | **Date:** Nov 15, 2026
**AI disclosure (D-44, D-56):** this document was written by an AI assistant (Claude, Anthropic) at the team leader's direction, as part of the refined build from `docs/REFINED_BUILD_BRIEF.md` (D-58, D-59).

This page says what the app stores, where, and in what shape. It follows section 5 of `docs/CORE_ENGINE_BRIEF.md`. Where the build had to choose, the choice is marked **Build choice** and is also listed in `docs/ISSUES.md`.

---

## 1. The settings layer

The settings layer is two files in `app/data/`. The app types none of their numbers, ratings or health wording into its code, and a test fails if it does (`tests/hardcoding.test.js`).

| File | Holds | Read by |
|---|---|---|
| `Indicator_Thresholds.json` | Every band, limit, rule parameter, reason and source ID (D-38) | `app/js/settings.js`, then `app/js/engine.js` |
| `Hazard_Links.json` | The 30 hazard links, their ratings, chains and sources, and the panel's screen text (D-57) | `app/js/hazards.js` |

What happens to the threshold file:

| Step | Module | What happens |
|---|---|---|
| Load | `settings.js` | Reads the file from the app's own folder. Offline, the service worker answers with its saved copy |
| Check | `validateSettings()` | Looks for the parts the engine needs: version, status levels, bands with no gap or overlap, limits, rule parameters, sources. A broken file is refused, with the reasons |
| Cache | `store.js` | Stores one copy per version on the device (D-46) |
| Fall back | `loadSettings()` | If the file cannot be read or is broken, the newest stored copy is used. If there is none, the app refuses to run and says so |

**A newer version.** When a later load brings a newer `meta.version`, the new copy is stored beside the old one. New readings are judged with the new version. Each reading remembers the version it was entered under and is still judged with that version, so old results do not change.

**The hazard file** is read each time the app starts and checked by `validateHazards()`. It is not copied into the database: the service worker keeps it for offline use. If it cannot be read, the app still works and every status is the same; only the panel is missing.

**Build choice.** The brief says the settings are "stored per profile". The build stores one copy per version on the device, and each profile and each reading records which version it uses. This gives the same behaviour with one copy in place of four.

## 2. Where things are stored

Everything is in the browser's IndexedDB, in a database named `stellavita-refined` (version 1). No library is used. Nothing is sent anywhere.

| Object store | Key | Holds |
|---|---|---|
| `profiles` | `id` | The synthetic astronauts |
| `readings` | `id` (index: `profileId`) | Every reading entered or loaded |
| `settings` | `version` | Cached copies of the threshold file |
| `meta` | `key` | Small device notes: the chosen astronaut (`profile`), and "limits statement seen" (`limitsSeen`) |

Results are **not** stored. They are worked out from the readings each time a screen is shown, so they always agree with the readings on the device.

**Build choice.** The database name differs from the original build's (`stellavita`). Both builds can be served from the same site, and a site shares one storage area, so each build keeps to its own database and its own offline cache.

## 3. Profile

```
{ id: "SYN-B", label: "Astronaut B (synthetic)", createdAt: "2026-11-15T08:00:00.000Z", thresholdsVersion: "0.4.0" }
```

A profile is a local choice of astronaut. It has no name, no password and no account. The four profiles are made from the crew IDs found in the demo data file.

## 4. Cached settings

```
{ version: "0.4.0", loadedAt: "2026-11-15T08:00:00.000Z", json: { ...the whole threshold file... } }
```

## 5. Reading

One record per entry. Fields every reading has:

| Field | Meaning |
|---|---|
| `id` | Unique. Sample readings use `sample-<crew>-<day>-<indicator>` |
| `profileId` | The astronaut |
| `indicator` | The indicator's `id` in the threshold file |
| `date`, `time` | `YYYY-MM-DD` and `HH:MM`, device local time. Sample readings have no time (`""`) |
| `symptoms` | A list of texts ticked from the indicator's checklist (D-51) |
| `note` | Free text, at most 280 characters |
| `createdAt` | When it was entered (used only to order readings with the same date and time) |
| `thresholdsVersion` | The threshold-file version in use when it was entered |
| `acceptedOutsideRange` | `true` only when an impossible value was entered twice in a row and accepted (D-48) |
| `sample`, `day` | Only on sample readings: `true`, and the day number 1 to 30 |

Each indicator adds its own fields:

| Indicator | Extra fields |
|---|---|
| Heart rate | `value`; `source`: `"device"` or `"count"` |
| Blood pressure | `readings`: a list of `{ systolic, diastolic }`. Two are entered; the last one is judged (D-49) |
| Blood sugar | `value`; `context`: `"before_meal"`; `meter`: text (D-29) |
| Temperature | `value`; `method`: `"oral"` or the name of another method (D-35) |
| Sleep | `value` (hours) |
| Mood, daily tap | `kind: "tap"`; `value` |
| Mood, weekly PHQ-2 | `kind: "phq2"`; `items`: the two answers |
| Mood, distress mark | `kind: "distress"`; `marked: true`; `symptoms` holds the file's own text for the mark |

**Build choices.**
- The three kinds of mood entry share the indicator `mood` and are told apart by `kind`.
- Both blood-pressure readings are needed at entry. The demo file has one reading per day (the latest one), so sample readings hold one entry in `readings`.
- A heart rate needs its `source` and a temperature needs its `method`, because the method decides whether a temperature is judged at all. The meter is optional; an empty meter is stored as `"not recorded"`.
- The demo file does not say how a heart rate was taken or which meter was used. Sample readings store `"not recorded"` there. The demo temperatures are stored as `"oral"`, the method the bands are written for.
- In the demo file, symptoms belong to the day. The reference checker applies them to every indicator of that day, so the loader copies them onto each of the day's six readings.
- A date in the future is asked again.

## 6. Result (the Interface contract)

`engine.js` returns one result per reading:

```
{ readingId: "r-…", indicator: "body_temperature", value: 39.5, unit: "Celsius",
  status: "contact", reason: "39.4 or higher", source_ids: ["S-27"],
  rule: "band", thresholdsVersion: "0.4.0",
  profileId, date, time, kind, notes: [], also: [] }
```

| Field | Meaning |
|---|---|
| `status` | `normal`, `warning`, `contact`, or `not_judged`. `not_judged` is not a colour |
| `reason`, `source_ids` | Read from the band or rule that set the status |
| `rule` | `band`, `symptom`, `pattern`, `personal_range` or `not_compared` |
| `value` | The value after rounding. Blood pressure is text such as `"92/58"`. PHQ-2 is the total. A distress mark has no value |
| `unit` | The indicator's `unit`. For mood, the part of the unit text that belongs to the kind of entry |
| `notes` | Extra texts from the file: the band's or rule's `note`, a pattern's `action`, and the low-blood-pressure note |
| `also` | The other findings that were not the final one, for example the band when a pattern set the status |
| `kind` | Only for mood: `tap`, `phq2` or `distress` |

The words on screen (Normal, Caution, Emergency, Not compared) and their symbols are in `app/js/labels.js` (D-53). The keys above never change.

## 7. The hazard panel's data

`hazards.js` returns one panel per indicator. It is described in `docs/HAZARD_PANEL.md`. A panel holds no reading, no result and no status.

## 8. Export

**Export** makes a file for the chosen astronaut and saves it through the browser's own download. Nothing is uploaded.

- **JSON:** the profile, every reading, every result, the threshold-file version, the hazard-file version and an AI notice.
- **CSV:** one row per reading with its result beside it. A note that a spreadsheet could read as a formula gets a leading apostrophe.

## 9. Reset and delete

- **Reset** wipes the `readings` store for all astronauts, then loads the clean sample data again. Profiles, cached settings and the "limits statement seen" note are kept.
- **Delete** (on the History screen) removes one reading, after a second press to confirm. **Build choice:** the brief does not ask for it; without it a mistaken entry, or a distress mark pressed by accident, could only be removed by Reset.
