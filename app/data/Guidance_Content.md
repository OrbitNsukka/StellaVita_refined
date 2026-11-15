# Guidance Content — Data & Science Workstream

**Team:** OrbitNsukka | **Workstream:** Data & Science (Lead: A.S., Assistant: O.B.)
**Challenge:** Create Health Monitoring Software for Astronauts on Space Missions
**Document status:** DRAFT v0.4, Nov 14, 2026. Matches `Indicator_Sheet.md` and `Indicator_Thresholds.json` v0.4 (D-27 to D-38). A.S. reviews on return.
**AI disclosure (D-44):** this document was drafted by an AI assistant (Claude, Anthropic) at the team leader's direction, and reviewed and signed by the team leader. It contains no NASA branding, logos, flags or mission identifiers.
**Purpose:** plain-language text for the tool's guidance screens. Interface & Experience copies it; the numbers are never retyped.

**Standing limits line (on every guidance screen):**
> This tool gives general health guidance only. It does not diagnose. When a reading is red, or anything feels wrong, contact your flight surgeon.

---

## Heart rate

**What it means:**
Your resting heart rate is how fast your heart beats while you are calm. Most adults sit between 60 and 100 beats per minute. Fit people are often slower. The tool learns your usual number and compares today with it.

**How to measure:**
1. Sit or float still for about five minutes. No talking, no exercise just before.
2. Use your heart-rate watch or chest strap, or count beats for a full 60 seconds at your wrist or neck.
3. Log the number, and whether it was a device or a hand count.

**What to do:**
- Below 60 and the screen says "inside your usual range": nothing to do. That is your normal.
- Amber (below your usual range, or above 100 at rest): rest five minutes and check again. Drink water. Hot cabin? Busy day? Log it and tell the crew medical officer.
- Exercise, caffeine and stress raise the number; fitness and calm lower it.

**Contact the flight surgeon when:**
- Your rate is outside the usual range and you also have chest pain, severe tiredness, dizziness, fainting, breathlessness at rest, or a pounding or irregular beat that will not settle.

---

## Blood pressure

**What it means:**
Blood pressure is the force of blood in your arteries, written as two numbers like 120/80. The first is when your heart pushes, the second when it rests. In orbit, fluid drifts toward your head, so your numbers can move around early in a mission. The tool watches for patterns, not single odd readings.

**How to measure:**
1. Sit with your back supported, feet flat, cuff on bare skin at heart level.
2. Rest five minutes. No coffee or exercise in the half hour before.
3. Take two readings one minute apart and log both. The tool judges the second one.

**What to do:**
- Under 130/80: inside the range. Keep logging.
- 130 or more, or 80 or more: amber. Recheck over the next two or three days and tell the crew medical officer.
- 140/90 or more on two days in a week: report it. If it is still there a week later, the tool flags it for a medical check. Keep logging; one number is not an emergency.
- Low (90/60 or lower) and you feel fine: drink fluids, rest, recheck.
- Low and dizzy or faint, especially when you stand: lie down, drink fluids, then report it.
- Keep up your daily exercise; it protects the heart and blood vessels.

**Contact the flight surgeon when:**
- Above 180/120, immediately.
- Any reading with chest pain, breathlessness, numbness, vision change or trouble speaking.
- After returning to gravity: dizziness on standing that does not pass. Report it; do not push through.

---

## Blood sugar

**What it means:**
Blood sugar is your body's fuel. This tool accepts **before-meal readings only**: you log your blood sugar before you eat. That gives one consistent number a day, so patterns stay comparable.

**How to measure:**
1. Wash your hands. Use whatever meter the crew has, following its instructions.
2. Fingerstick before you eat (on waking is fine, as long as you have not eaten), apply the drop, read the number.
3. Log the reading, the time, and which meter you used.

**What to do:**
- 54 to 69: take 15 grams of fast sugar (glucose tabs or juice) and recheck after 15 minutes. Repeat until you are at 70 or more. This is the 15/15 rule. Then log it and report it.
- 100 to 250: recheck before your next meal. Think food, exercise, sleep. If it is 126 or more on two days in a week, report it.
- Shaky, sweaty or confused: treat it as low sugar first, even if the number looks borderline.

**Contact the flight surgeon when:**
- Below 54, at once, after taking fast sugar.
- Above 250.
- Confusion at any reading. That is urgent.

---

## Body temperature

**What it means:**
Body temperature tells you about infection, heat and cold. By mouth it normally sits between about 36.0 and 37.4 °C. At 38.0 °C (100.4 °F) you have a fever by the standard definition.

**How to measure (one method, every time):**
1. The crew uses **one agreed method for the whole mission** and records it with every reading. The tool's bands are for mouth (oral) readings.
2. Wait 15 to 30 minutes after hot or cold drinks or exercise.
3. If another method has to be used, log which one. Forehead devices read about 0.6 °C lower, and the tool will not compare those readings with the oral bands.

**What to do:**
- 37.5 to 37.9: rest, drink water, recheck in an hour.
- Fever, 38.0 to 39.3: report it and recheck hourly. In a closed ship, say something early rather than hide a cold; a fever protects the whole crew when it is reported.
- 35.0 to 35.9: warm layers, warm drink, recheck after 30 minutes.

**Contact the flight surgeon when:**
- 39.4 °C (103.0 °F) or higher.
- Below 35.0 °C (95.0 °F), immediately.

---

## Sleep hours

**What it means:**
Sleep is maintenance for your brain and body. Adults need 7 hours or more. Crews in orbit often get less, which is why sleep is logged every night: a few short nights quietly drag down every other number in this tool.

**How to measure:**
1. Log lights-out and lights-on, or enter hours slept.
2. Wear the wrist activity monitor if one is issued.
3. Log the same way every day. The pattern is the signal.

**What to do:**
- Under 7 hours: protect tonight's sleep. Dim lights, skip late caffeine, quiet the cabin.
- One hard night is not the alarm. The tool watches for three short nights in a row.
- Too sleepy to work safely: tell the crew medical officer. It is a safety issue, not a weakness.

**Contact the flight surgeon when:**
- 6 hours or less, three nights in a row.

---

## Mood

**What it means:**
Two small check-ins. Once a day, tap a number: 5 = feeling very good, 1 = feeling very low. The tap shows a trend; one low day never changes a colour. Once a week, answer two short questions (the PHQ-2) about the last two weeks. Both are private by default. There are no wrong answers.

**How to measure:**
1. One tap a day, at about the same time.
2. Once a week, the two PHQ-2 questions, each scored 0 to 3:
   - Little interest or pleasure in doing things
   - Feeling down, depressed, or hopeless
3. Optionally add a one-word reason to the tap: workload, noise, team, family, sleep.

**What to do:**
- Two low days (2 or less) in a row, five low days in a week, or a PHQ-2 score of 3 or more: talk to a crewmate. Check sleep and workload. Raise it at the next medical conference.
- The tool may suggest a small action: a treadmill session, a call home if a window exists, a quieter shift.

**Contact the flight surgeon when:**
- You feel unable to continue, or in serious distress. Mark it at any time; it goes straight to red.
- The PHQ-2 and the tap are screens, not assessments. The tool only opens the door; people walk through it.

---

## Preventive actions for reminders (draft list for Interface & Experience)

1. Daily: sleep log, mood tap, water reminder.
2. Daily: exercise session; it protects the heart, muscles and bones.
3. Weekly: heart rate and blood pressure compared with your own usual range.
4. Weekly: the PHQ-2, and a look at amber patterns before they turn red.
5. When an amber pattern appears, check the environment: hot cabin, noise, bright light? "Is it the person or the ship?"

---

## Sign-off block

- [x] Every screen text matches the Indicator Sheet and JSON v0.4
- [ ] No diagnostic language anywhere (Integration, AI & Quality to verify)
- [ ] Limits line present on every screen spec
- [ ] Reviewed by A.S. (Data & Science lead) on return: date ______
- [ ] Routine cross-check by B.B. (Project & Delivery): date ______
