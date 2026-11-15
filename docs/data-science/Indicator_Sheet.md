# Indicator Sheet — Data & Science Workstream

**Team:** OrbitNsukka | **Workstream:** Data & Science (Lead: A.S., Assistant: O.B.)
**Challenge:** Create Health Monitoring Software for Astronauts on Space Missions
**Document status:** DRAFT v0.4, Nov 14, 2026. Follows D-27 to D-38 in the Decision Log. A.S. was unavailable, so the team leader decided in A.S.'s place; A.S. reviews on return. Where v0.2 departed from the voted research brief or a D-entry, v0.3 follows the brief or the D-entry.
**AI disclosure (D-44):** this document was drafted by an AI assistant (Claude, Anthropic) at the team leader's direction, and reviewed and signed by the team leader. It contains no NASA branding, logos, flags or mission identifiers.
**Numbers live in one place:** `Indicator_Thresholds.json` v0.4 (D-38). This sheet quotes it. If they ever disagree, the JSON wins and this sheet is fixed.
**Source IDs** are Sources.md IDs. **Cross-check:** B.B. (Project & Delivery).

---

## How to read this sheet

| Status | Meaning | Action in the tool |
| --- | --- | --- |
| Normal (green) | Inside the published range | Keep logging |
| Warning (amber) | Worth watching | Log it and tell the crew medical officer (S-31) |
| Contact flight surgeon (red) | Needs medical judgment now | Request a private medical conference with the flight surgeon (S-32) |

**Input safety (D-48).** A reading outside the impossible-reading limits is not judged: the app asks again. The same value entered twice in a row is accepted and judged, so a real emergency is never blocked. **Symptoms** are entered manually with each reading (D-51).

Every possible reading lands in exactly one band. Pattern rules (several readings over days) sit apart from the bands, so a single reading can never fire them. Symptoms can raise a colour; only the heart-rate personal-range rule can lower one.

**Honesty note.** The bands are standard adult clinical ranges from public sources. NASA's in-flight crew thresholds (NASA-STD-3001 and flight rules) are not fully public. The red levels are adaptations for an educational demo and need review by medical operations before any real use. Items marked "team choice" or "team proposal" have no held source and are illustrative. This note travels with the document.

---

## 1. Heart rate (resting, beats per minute)

- **What it is:** how many times the heart beats in a minute at rest. It is the quickest window into fitness, dehydration, illness and stress.
- **How it is measured in space:** a pulse count or a wrist or chest device, at rest after about five minutes still. Log whether it was a device or a 60-second count.
- **Why it matters:** an unusual resting rate is often the first sign of dehydration, fever, overtraining or an abnormal rhythm. Low gravity changes the heart and vessels.

| Status | Range | Action |
| --- | --- | --- |
| Normal | 60 to 100 | Keep logging |
| Normal (personal range) | Below 60, when it sits within the astronaut's usual range | Keep logging; the screen says "inside your usual range" |
| Warning | Below 60 outside the usual range, or above 100 at rest | Rest 5 minutes, recheck, log, tell the crew medical officer |
| Contact | An abnormal rate (amber) together with chest pain, severe fatigue, fainting, dizziness, breathlessness at rest, or a pounding or irregular beat that does not settle | Contact the flight surgeon. No number alone is red |

**Impossible readings (D-48):** below 20 or above 250 bpm, the app asks again (team choice).
**Personal range (D-33).** Fit people often rest below 60 (S-22). In the demo, a reading below 60 is green when the median of the astronaut's previous 14 readings is also below 60 and the reading is within 10 bpm of it. At least 7 earlier readings are needed. These numbers are a team choice, signed by the team leader (D-39); on a real mission the flight surgeon sets each astronaut's range. With this rule the fit demo astronaut (SYN-B) is amber on 6 days instead of 25, all in the first week, before a baseline exists.
**Sources:** S-22, S-23.

---

## 2. Blood pressure (systolic / diastolic, mmHg)

- **What it is:** the pressure of blood on artery walls: systolic while the heart pumps, diastolic between beats.
- **How it is measured in space:** upper-arm cuff, seated, after five minutes rest, arm at heart level; two readings one minute apart, both logged. In orbit, fluids shift toward the head, so pressure and the response to standing are watched closely.
- **Why it matters:** pressure that is too high or too low changes how every organ works. After months in orbit, standing up can cause faintness (orthostatic intolerance).

**D-34: the voted research brief's bands.** The pack v0.2 made 120 to 129 amber; the brief has it green, and v0.3 follows the brief.

| Status | Range | Action |
| --- | --- | --- |
| Normal | Under 130 **and** under 80 | Keep logging |
| Warning | 130 to 180 systolic **or** 80 to 120 diastolic | Recheck over 2 to 3 days; log; tell the crew medical officer |
| Warning, report | 140/90 or more on 2 days within a week | Report it |
| Warning, anomaly flag | 140/90 or more still present a week after an earlier one | Flag it as an anomaly that needs a medical check (team choice for "a week") |
| Warning, low with symptoms | 90/60 or lower **with** dizziness or fainting | Lie down, drink fluids, report it |
| Normal, low reading noted | 90/60 or lower without symptoms | The screen notes "low reading, recheck after fluids and rest" (S-130: a problem only with symptoms) |
| Contact | Above 180 and/or above 120, or any reading with chest pain, breathlessness, numbness, vision change or trouble speaking | Contact the flight surgeon now |

**Two readings (D-49):** both readings are stored; the latest one is judged. **Impossible readings (D-48):** systolic outside 50 to 260 or diastolic outside 30 to 160, the app asks again (team choice).
**Standing check (team proposal, no held source yet):** a systolic drop of 20 mmHg or more on standing, with dizziness, is amber and reported. B.B. keeps looking for a source.
**Sources:** S-140, S-20, S-21, S-130.

---

## 3. Blood sugar (before meal)

- **What it is:** the amount of sugar in the blood, the body's fuel. **The crew logs blood sugar before meals only; after-meal readings are not accepted (D-23, D-27).**
- **How it is measured in space:** **enter the reading from whatever meter the crew has, and record which meter (D-29).** A reading taken on waking is accepted, so long as it is before a meal (D-40). The tool makes no claim about meter accuracy, and no claim that meters are carried in crew kits: no held source says either (S-143 shows blood collected in flight but analysed after landing).
- **Why it matters:** sugar that goes too low is an emergency within minutes; sugar that runs high for weeks harms the body quietly. Nutrition is a NASA risk on long missions.

**mg/dL first, mmol/L in brackets.** Bands per D-28 (S-167, S-132) and the voted brief.

| Status | Before meal | Action |
| --- | --- | --- |
| Contact | Below 54 [below 3.0] | Level 2 low (S-132). Take 15 g fast sugar and contact the flight surgeon now |
| Warning | 54 to 69 [3.0 to 3.8] | Level 1 low (S-132). Take 15 g fast sugar, recheck in 15 minutes, repeat until 70 or more, then report it |
| Normal | 70 to 99 [3.9 to 5.5] | Keep logging (S-167) |
| Warning | 100 to 125 [5.6 to 6.9] | Repeat before the next meal; note food, exercise and sleep (S-167 prediabetes range) |
| Warning | 126 to 250 [7.0 to 13.9] | Report it. A single high reading is amber, never red |
| Warning, report | 126 or more on 2 days within a week | Report it (team choice for "2 days within a week") |
| Contact | Above 250 [above 13.9], or confusion at any reading | Contact the flight surgeon |

**Impossible readings (D-48):** below 20 or above 600 mg/dL, the app asks again (team choice).
Shaky or sweaty: treat as low sugar first, even if the number looks borderline.
**Sources:** S-167, S-132.

---

## 4. Body temperature (oral reference)

- **What it is:** core body heat. It rises with infection and with a failing cabin cooling system; it falls with cold.
- **How it is measured in space:** **one method for the whole mission, recorded with every reading (D-35).** The bands are oral. A reading taken another way is marked and not compared with these bands: skin and forehead devices read about 0.6 °C lower than oral (S-27).
- **Why it matters:** fever is the clearest sign of infection, and in a closed spacecraft infection control protects the whole crew. A rising temperature can also mean a heat or cooling problem.

**°C first, °F in brackets.** Bands per D-35 and the voted brief.

| Status | Range | Action |
| --- | --- | --- |
| Contact | Below 35.0 [below 95.0] | Contact the flight surgeon now (team proposal, no held source yet) |
| Warning | 35.0 to 35.9 [95.0 to 96.6] | Warm layers, warm drink, recheck after 30 minutes (team proposal, no held source yet) |
| Normal | 36.0 to 37.4 [96.8 to 99.3] | Keep logging |
| Warning | 37.5 to 39.3 [99.5 to 102.7]; fever from 38.0 [100.4] (S-134) | Rest, fluids, recheck hourly; report a fever |
| Contact | 39.4 or higher [103.0 or higher] | Contact the flight surgeon (S-27) |

**Impossible readings (D-48):** below 30.0 or above 43.0 °C, the app asks again (team choice).
**Context (S-46):** core temperature runs about 1 °C higher in flight. A personal in-flight baseline is not adopted yet; A.S. reviews on return.
**Sources:** S-134, S-27, S-46. S14 is dropped (D-37).

---

## 5. Sleep hours (per night)

- **What it is:** how long the astronaut actually slept. Short sleep drags down mood, judgment, immune function and reaction time.
- **How it is measured in space:** a daily sleep log (lights out, lights on) and a wrist activity monitor when one is issued.
- **Why it matters:** crews have historically slept less in orbit than on the ground. Sleep is a defended resource.

**D-30: red is exactly D-19.** Green and amber follow the voted brief.

| Status | Range | Action |
| --- | --- | --- |
| Normal | 7 hours or more | Keep logging |
| Warning | Under 7 hours, any single night | Protect tonight's sleep: dim lights, no late caffeine, quiet cabin |
| Contact | 6 hours or less on 3 nights in a row (D-19) | Talk to the flight surgeon |

**Why red is 6 hours and not 7:** 7 hours is the Earth recommendation for adults (S-28); crews often run below it, so one short night is a signal, not an emergency. Three short nights in a row is the pattern that escalates. This is a team judgment.
**Sources:** S-28, S-139.

---

## 6. Mood (daily tap + weekly PHQ-2)

- **What it is (D-31):** (a) a **daily 1 to 5 tap** (5 = very good, 1 = very low), designed by the team and shown as a trend only; (b) the **weekly PHQ-2**, two validated screening questions about the last 2 weeks, scored 0 to 3 each, total 0 to 6 (S-135; free to reproduce, S-30). Both are private by default.
- **Why it matters:** isolation, confinement, workload and short sleep all push mood down, and a dip is often the earliest sign that something needs attention.

**The two PHQ-2 questions** (not at all = 0, several days = 1, more than half the days = 2, nearly every day = 3):
1. Little interest or pleasure in doing things
2. Feeling down, depressed, or hopeless

| Status | Rule | Action |
| --- | --- | --- |
| Normal | Any single tap; PHQ-2 0 to 2 | Keep logging |
| Warning | Tap of 2 or lower on 2 days in a row, or on 5 of the last 7 days (D-32); or PHQ-2 of 3 or more (S-135) | Check in with a crewmate; review sleep, workload and noise; raise it at the next medical conference |
| Contact | The astronaut marks severe distress or feeling unable to continue, at any time (D-20, D-32) | Contact the flight surgeon promptly: this is support, not a diagnosis |

**Honesty note:** the tap is not a validated instrument, and the PHQ-2 is a screen, not a diagnosis. The tool never claims to assess mental health.
**Sources:** S-135, S-30.

---

## Sign-off block

- [x] Every value lands in exactly one band (checked by `generate_synthetic_data.py --check`, Nov 14)
- [x] Thresholds match `Indicator_Thresholds.json` v0.4
- [ ] Integration, AI & Quality re-checks the match (O.F.)
- [ ] Reviewed by A.S. (Data & Science lead) on return: date ______
- [ ] Routine cross-check by B.B. (Project & Delivery): date ______
