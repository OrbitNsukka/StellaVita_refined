# Status rules list

**Team:** OrbitNsukka | **Workstream:** Core Engine / Application | **Date:** Nov 15, 2026
**AI disclosure (D-44):** this document was written by an AI assistant (Claude, Anthropic) at the team leader's direction, as part of the build from `docs/CORE_ENGINE_BRIEF.md` (D-52, D-53).

This page lists the rules the engine (`app/js/engine.js`) applies, in order, and names the field of `Indicator_Thresholds.json` that each one reads. **It quotes no numbers on purpose:** the numbers live in the threshold file only (D-38). If this page and the file ever disagree, the file wins.

The engine was checked against the reference checker (`reference/generate_synthetic_data.py`): the status of all 120 demo rows and all six indicators is the same (`tests/parity.test.js`).

---

## The rules, in order

| # | Rule | Reads from the file | In the code |
|---|---|---|---|
| 1 | **Accept or ask again.** The value must be present, a number, and inside the possible range. Blood sugar must be taken before a meal | `plausible_range`, `accepted_contexts` | `checkReading()`, and `entry.js` for "ask again" |
| 2 | **Round** to the indicator's resolution | `resolution` | `roundToResolution()` |
| 3 | **Band.** Find the one band that holds the value (its `min` and `max` are inclusive) | `bands` | `findBand()` |
| 4 | **Symptoms** can only raise the status | `symptom_rules`, `low_reading` | `symptomFindings()` |
| 5 | **Personal range** (heart rate). The only rule that lowers a status | `baseline_rule` | in `judgeReading()` |
| 6 | **Patterns** over the astronaut's earlier readings | `pattern_rules` | `patternFires()` |
| 7 | **Final status** is the worst of the band (after rule 5), the symptoms and the patterns | `meta.status_levels` gives the order | `pickFinal()` |
| 8 | **Temperature by another method** is stored and not compared | (see note A) | `judgedValues()` |
| 9 | **Mood.** A single tap never sets a colour. The weekly PHQ-2 has its own bands. A distress mark is red at once | `bands`, `weekly_phq2`, `symptom_rules` | in `judgeReading()` |

## Details of each rule

**Rule 1: input safety (D-48, D-23).**
- Missing or not a number: the app asks again. This is never accepted, however often it is sent.
- Outside `plausible_range`: the app asks again. If exactly the same value is entered twice in a row, it is accepted, marked `acceptedOutsideRange`, and judged. So a real emergency is never blocked.
- Blood sugar whose context is not in `accepted_contexts` (an after-meal reading) is refused and never stored.
- A reading that fails this rule is never given a status.

**Rule 2: rounding.** The engine rounds the same way as the reference checker (a value exactly half-way goes to the even neighbour).

**Rule 3: bands.** Blood pressure has a list of bands for each part. Each part is judged separately and the worse one is taken (`combine`). The latest of the two readings is judged (D-49).

**Rule 4: symptoms.**
- A symptom rule fires when one of its `symptoms` is ticked on the reading.
- A rule with `only_if_band` fires only when the reading's own band has that status (heart rate).
- Low blood pressure (`low_reading`): at or below the low limits, the status rises to `with_symptoms_status` only if one of `with_symptoms` is ticked. Without them the status does not change and the result carries the file's note.

**Rule 5: personal range (D-33, D-39).** For a reading below `median_below` whose band is not already the rule's `result`: take the median of the previous `window_readings` heart-rate readings. If there are at least `min_readings`, the median is below `median_below`, and the reading is within `within_bpm` of it, the band's status becomes `result`. Symptoms can still raise it afterwards, as in the reference checker.

**Rule 6: patterns.** Each pattern rule names its `indicator` and a `test`:

| `test` | A reading meets it when |
|---|---|
| `at_most` | its value is at or below `value` |
| `at_least` | its value is at or above `value` |
| `stage2`, `stage2_persistent` | either part is at or above its `…_min` |

A rule fires on a reading only if that reading meets the test, and:
- `consecutive`: each of the `count − 1` calendar days before it also has a reading that meets the test. A missing day breaks the run;
- `within_days`: at least `count` days meet the test in the window of `within_days` days that ends on the reading's day;
- `stage2_persistent`: an earlier day met the test between `gap_days_at_least` and `lookback_days` days before.

Only the same astronaut's earlier readings of the same indicator count. Mood patterns use the daily taps only.

**Rule 7: final status, reason and sources.** The result takes the `reason` and `source_ids` of whatever set the final status:

| Set by | `reason` | `source_ids` |
|---|---|---|
| A band | the band's `label` | the band's `sources` |
| A symptom rule | the symptoms that matched | the rule's `sources` (see note B) |
| Low blood pressure with symptoms | `low_reading.rule` | `low_reading.sources` |
| A pattern | the rule's `label` | the rule's `sources` |
| The personal range | the note quoted in `baseline_rule.rule` | `baseline_rule.sources` |

When two findings have the same status, a pattern is shown first, then the band, then a symptom. The others are kept in the result's `also` list and shown under "Also found".

**Rule 8 and rule 9: fixed reasons.** Two reasons are set by the brief and have no field in the file: "not compared: taken by another method" and "trend only". They are constants in `engine.js` (`FIXED_REASONS`).

## Notes: where the file has no field

These are also recorded in `docs/ISSUES.md`.

- **A. The agreed temperature method.** The file says the bands are oral only in words. The engine reads `judged_method` from the indicator if it is there, and otherwise uses "oral" (D-35).
- **B. Symptom rules without sources.** Some symptom rules have no `sources` list. The engine then uses the indicator's `source_keys`.
- **C. PHQ-2 bands without labels.** The reason is then written from the band's own `min` and `max`.
- **D. Several readings on one day.** The file does not say how a pattern treats them. The engine counts a day when any reading on it meets the test.

## Required behaviour on the demo data

| Check | Result |
|---|---|
| 120 rows × 6 indicators judged, no gaps | Yes: 720 results |
| Same status as the reference checker everywhere | Yes |
| Red only on SYN-B day 14 (sleep), SYN-C day 18 (temperature), SYN-D day 22 (blood sugar) | Yes |
| SYN-B heart rate amber on 6 days | Yes |
| No impossible readings | Yes |
