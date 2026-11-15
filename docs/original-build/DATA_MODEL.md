# Data model and settings layer

**Team:** OrbitNsukka | **Workstream:** Core Engine / Application | **Date:** Nov 15, 2026
**AI disclosure (D-44):** this document was written by an AI assistant (Claude, Anthropic) at the team leader's direction, as part of the build from `docs/CORE_ENGINE_BRIEF.md` (D-52, D-53).

This page says what the app stores, where, and in what shape. It follows section 5 of the brief. Where the build had to choose, the choice is marked **Build choice** and is also listed in `docs/BUILD_REPORT.md`.

---

## 1. The settings layer

The settings layer is one file: `app/data/Indicator_Thresholds.json`. Every band, limit, rule parameter, reason and source ID comes from it (D-38). No health number is typed into the code, and a test fails if one is (`tests/engine.test.js`, "no hard-coding").

| Step | Module | What happens |
|---|---|---|
| Load | `app/js/settings.js` | Reads the file from the app's own folder. Offline, the service worker answers with its saved copy |
| Check | `validateSettings()` | Looks for the parts the engine needs: version, status levels, bands with no gap or overlap, limits, rule parameters, sources. A broken file is refused, with the reason |
| Cache | `app/js/store.js` | Stores one copy per version on the device (D-46) |
| Fall back | `loadSettings()` | If the file cannot be read, the newest stored copy is used. If there is none, the app refuses to run and says so |

**A newer version.** When a later load brings a newer `meta.version`, the new copy is stored beside the old one. New readings are judged with the new version. Each reading remembers the version it was entered under, and is still judged with that version, so old results do not change.

**Build choice.** The brief says the settings are "stored per profile". The build stores one copy per version on the device, and each profile records which version it uses (`thresholdsVersion`). This gives the same behaviour with one copy in place of four.

## 2. Where things are stored

Everything is in the browser's IndexedDB, in a database named `stellavita` (version 1). No library is used (D-47, D-53). Nothing is sent anywhere.

| Object store | Key | Holds |
|---|---|---|
| `profiles` | `id` | The synthetic astronauts |
| `readings` | `id` (index: `profileId`) | Every reading entered or loaded |
| `settings` | `version` | Cached copies of the threshold file |
| `meta` | `key` | Small device notes: the chosen astronaut, and "limits statement seen" |

Results are **not** stored. They are worked out from the readings each time a screen is shown, so they always agree with the readings on the device.

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
- The demo file has one blood-pressure reading per day (the latest one), so sample readings hold one entry in `readings`.
- The demo file does not say how a heart rate was taken or which meter was used. Sample readings store `"not recorded"` there. The demo temperature readings are stored as `"oral"`, the method the bands are written for.
- In the demo file, symptoms belong to the day. The reference checker applies them to every indicator of that day, so the loader copies them onto each of the day's six readings.

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
| `notes` | Extra texts from the file: the band's or rule's `note`, and the low-blood-pressure note |
| `also` | Other findings that were not the final one, for example the band when a pattern set the status |
| `kind` | Only for mood: `tap`, `phq2` or `distress` |

The words on screen (Normal, Caution, Emergency, Not compared) are in `app/js/labels.js` (D-53). The keys above never change.

## 7. Export

**Export** makes two files for the chosen astronaut and saves them through the browser's download. Nothing is uploaded.

- **JSON:** the profile, every reading, every result, the threshold-file version and an AI notice.
- **CSV:** one row per reading with its result beside it.

## 8. Reset

**Reset** wipes the `readings` store for all astronauts, then loads the clean sample data again. Profiles, cached settings and the "limits statement seen" note are kept.
