# Hazard-Links Sheet v2 (proposal)

**Team:** OrbitNsukka | **Workstream:** Data & Science, with Integration, AI & Quality | **Date:** Nov 15, 2026
**Status:** DRAFT proposal. It does not replace the D-25 sheet (`Hazard_Links_Sheet_D-25.md`) until Data & Science approves it and the team logs a decision. Every source it cites is still Logged in `docs/Sources.md` unless marked Verified there.
**AI disclosure (D-44):** this document was drafted by an AI assistant (Claude, Anthropic) at the team leader's direction. The assistant is not a source. It read NASA's published risk-diagram files and the team's research files, and applied the rules in section 2. A person must check it.

---

## 1. Why a second version

The D-25 sheet rates each link A, B or C by reading NASA's risk diagrams. That was the right starting point, but it has three gaps that stop it being a scientific link:

1. **The rating is not reproducible.** "Points straight to the change this reading tracks" depends on which node someone thinks the reading tracks, and that was never written down. For example, D-25 rates the closed environment A for body temperature and altered gravity B, yet in the NASA diagrams both reach infection in the same number of steps (section 4.3).
2. **A diagram path is not the same as a visible effect.** A path from radiation to heart structure exists, but NASA describes that effect as long-term disease. A daily resting heart rate will not show it.
3. **The evidence that each indicator actually changes in flight is kept apart from the rating.** A reader can't see which links rest on a measurement and which rest on a diagram only.

This version fixes the three gaps with written rules that anyone can re-run from NASA's files.

## 2. Method

### 2.1 The evidence base

| What | Source | How it was read |
|---|---|---|
| The five hazards, and that they compound | S-07, S-147 | As in D-25 |
| NASA's risk diagrams: the edges between hazards, factors and outcomes | S-153 (cardiovascular), S-154 (sleep), S-155 (immune), S-156 (host-microorganism), S-157 (behavioral health), S-158 (food and nutrition) | The diagram **code files** linked in each row were fetched in full on Nov 15, 2026 by the AI assistant (all six returned complete). Every edge in section 4 is copied with NASA's node names unchanged. The narrative PDFs were **not** read |
| In-flight and analog measurements of the indicators | S-42, S-43, S-46, S-47, S-49, S-52, S-120, S-126, S-139, S-143, S-144, S-163, S-171 | From the descriptions recorded in `docs/Sources.md`. None of these papers was re-opened for this draft |
| What a reading can and cannot show | S-134 (Verified), S-135 (Verified), S-121 | From `docs/Sources.md` |

### 2.2 Step 1: name the node each indicator observes (the team's mapping)

NASA's diagrams never name heart rate, blood pressure, blood sugar or body temperature. So the team has to say which diagram node each reading watches. This is the one judgement in the method, it is written down here, and **Data & Science must approve it**.

| Indicator | Diagram | Node(s) the reading observes | Why |
|---|---|---|---|
| Heart rate | S-153 | Orthostatic Intolerance; Cardiac Structure/Function; Vascular Structure/Function; Intravascular Volume | Resting rate and cuff pressure both reflect the heart, the vessels and blood volume. NASA names low blood pressure, fainting and orthostatic intolerance as the in-mission effects (S-120, S-126). The diagram cannot separate heart rate from blood pressure, so both use the same nodes |
| Blood pressure | S-153 | Same four nodes | As above. In-flight 24-hour pressure fell about 10 mm Hg (S-42) |
| Body temperature | S-156 and S-155 | Infection (S-156); Medical Illness (S-155) | Fever suggests an infectious cause, though not every infection causes fever (S-134, Verified). Neither diagram has a fever or temperature node |
| Sleep hours | S-154 | Sleep Deficiencies | Hours slept is a direct measure of sleep loss |
| Mood | S-157 | Psychological Status | The weekly PHQ-2 screens for depressive symptoms (S-135, Verified). The daily tap is a trend only (D-31) |
| Blood sugar | S-158 | Energy (Calories); Nutrients | **Weak mapping.** The diagram has no glucose or metabolism node, and NASA's nutrition pages do not mention glucose (S-121). These are the closest nodes, not a match |

### 2.3 Step 2: measure the path

For each hazard and indicator, count the **fewest arrows** from the hazard node to any of the indicator's nodes, inside that indicator's own diagram(s). Count only arrows written in NASA's file.

- 1 arrow: the hazard points straight at the node.
- 2 arrows: one named factor in between (for example, gravity → fluid shifts → blood volume).
- 3 or more: a longer chain.
- No path: the hazard isn't in that diagram, or no chain of arrows reaches the node.

Links through *another* risk's diagram (for example, gravity → stress → fatigue → Behavioral (Risk) in the sleep diagram) are listed separately in section 5. They are not counted, because they end at a whole risk and not at the node the reading watches.

### 2.4 Step 3: can a daily reading show it?

| Level | Meaning | Indicators |
|---|---|---|
| High | The reading measures the node itself | Sleep hours |
| Partial | The reading shows some of the node's change, usually only when it is large or comes with symptoms | Heart rate, blood pressure, body temperature, mood |
| Low | No held source shows the reading changing with this node | Blood sugar |

Reasons:
- **Heart rate:** in the CARD study, resting heart rate did not change in flight (S-42). The effect shows mainly on standing after landing (S-120). The app's symptom rules (dizziness, fainting) catch part of this.
- **Blood pressure:** the in-flight fall of about 10 mm Hg (S-42) mostly stays inside the green band. A low reading only turns amber with dizziness or fainting (D-34).
- **Body temperature:** fever shows a symptomatic infection, not a hidden one. NASA's immune pages describe silent changes such as dormant virus reactivation (S-49), which a thermometer will not show. Core temperature also runs about 1 °C higher in flight (S-46) and above 40 °C during exercise (S-47), which can look like a fever without any infection.
- **Mood:** the PHQ-2 is a validated screen, not a full measure of psychological status (S-135).
- **Blood sugar:** the only in-flight glucose source shows that monitors worked on one commercial mission (S-144, preliminary). It does not show glucose changing because of a hazard.

### 2.5 Step 4: the closeness rating

| Rating | Rule |
|---|---|
| **Close** | 1 or 2 arrows, and the reading is High or Partial |
| **Intermediate** | 3 arrows, and the reading is High or Partial |
| **Distant** | 4 or more arrows; **or** the reading is Low; **or** a held source says the effect along this path is long-term disease, which a daily reading can't show |
| **Not linked** | No path inside the indicator's own diagram(s) |

**What the rating does not mean.** "Close" is about how near the hazard sits to what the reading watches, and whether the reading can see some of it. It says nothing about how large or how likely the effect is. NASA rates likelihood and consequence separately (S-151, not yet read).

### 2.6 Step 5: what in-flight evidence exists

Recorded per indicator, because almost no held source separates one hazard from the others:

| Grade | Meaning |
|---|---|
| E1 | A spaceflight study measured this indicator (or the same body quantity) |
| E2 | Only a related marker was measured, or only an analog on Earth |
| E3 | No measurement in the held sources |

## 3. Result

### 3.1 Summary grid

| Hazard | Heart rate | Blood pressure | Blood sugar | Body temperature | Sleep hours | Mood |
|---|---|---|---|---|---|---|
| Space radiation | Distant (long-term) | Distant (long-term) | Distant (low) | Intermediate | **Close** | Distant |
| Isolation and confinement | Intermediate | Intermediate | Not linked | **Close** | **Close** | **Close** |
| Distance from Earth | Distant | Distant | Distant (low) | Distant | Intermediate | Distant |
| Altered gravity | **Close** | **Close** | Distant (low) | **Close** | **Close** | Not linked |
| Hostile, closed environment | Distant | Distant | Distant (low) | **Close** | **Close** | Not linked |

"(long-term)": the path exists, but NASA describes radiation's effect on the heart as long-term disease with high uncertainty (S-163, S-126). "(low)": blood sugar's reading level is Low (section 2.4).

### 3.2 Evidence by indicator

| Indicator | Grade | What was measured | Hazard-specific? |
|---|---|---|---|
| Heart rate | E1 | Resting heart rate unchanged in flight (S-42); fainting risk at landing (S-120) | No: spaceflight as a whole |
| Blood pressure | E1 | 24-hour pressure fell about 10 mm Hg in flight (S-42); fluid shift toward the head (S-43) | No; the fluid shift is the gravity path |
| Body temperature | E1 for the quantity, E2 for infection | Core temperature rose about 1 °C over the first two months (S-46); above 40 °C in exercise (S-47); latent virus reactivation (S-49) | No. S-46 does not name a cause |
| Sleep hours | E1 | About 6 h slept against 8.5 h scheduled (S-139); 7.33 h in flight against 7.87 h before flight (S-171) | No |
| Mood | E2 | Chronic stress in the 520-day Mars-500 isolation study (S-52), measured by a stress hormone and not by mood; NASA tracks mood by self-report in isolated missions (S-143) | **Yes, isolation only:** Mars-500 isolated crews on Earth, without gravity or radiation |
| Blood sugar | E3 | Monitors worked in flight (S-144, preliminary); no measured change | No |

### 3.3 What each indicator can honestly claim

| Indicator | Closest hazards | Honest statement for the team |
|---|---|---|
| Sleep hours | Radiation, gravity, isolation, closed environment | The strongest indicator. Four hazards sit one or two steps from sleep loss, the reading measures it directly, and sleep loss in flight is measured (E1) |
| Body temperature | Gravity, isolation, closed environment | Watches infection risk, which three hazards feed through microbes and contamination. A thermometer shows only a fever, and the in-flight rise in core temperature (S-46) can confuse it |
| Heart rate, blood pressure | Gravity | Gravity is the clear link, through fluid shifts. Most of the effect shows on standing or after landing, not at rest in flight |
| Mood | Isolation | Isolation points straight at psychological status, and it is the only hazard with its own analog evidence (S-52). Gravity and the closed environment aren't in this diagram |
| Blood sugar | None closely | No hazard link is close. It is worth keeping as a general health check, but the team shouldn't present it as tracking a hazard |

## 4. The paths

Each line is a chain of arrows copied from NASA's diagram file, with NASA's node names. Where several chains share the shortest length, one is shown.

### 4.1 Heart rate and blood pressure (S-153)

| Hazard | Arrows | Shortest chain |
|---|---|---|
| Altered gravity | 2 | Altered Gravity → Endocrine Factors → Orthostatic Intolerance (also Altered Gravity → Fluid Shifts → Intravascular Volume) |
| Space radiation | 2 | Radiation → Oxidative Stress → Vascular Structure/Function |
| Isolation and confinement | 3 | Isolation and Confinement → Stress → Inflammation → Cardiac Structure/Function |
| Hostile, closed environment | 4 | Hostile Closed Environment → Atmospheric Conditions → CO2 (Risk) → Inflammation → Cardiac Structure/Function |
| Distance from Earth | 4 | Distance from Earth → Vehicle Design → Crew Health and Performance System → Exercise → Intravascular Volume |

The distance chain runs through exercise, a countermeasure: distance acts by limiting what the vehicle can carry and do.

### 4.2 Sleep hours (S-154)

| Hazard | Arrows | Shortest chain |
|---|---|---|
| Space radiation | 1 | Radiation → Sleep Deficiencies |
| Altered gravity | 2 | Altered Gravity → Stress → Sleep Deficiencies (also through Environmental Conditions) |
| Isolation and confinement | 2 | Isolation and Confinement → Stress → Sleep Deficiencies |
| Hostile, closed environment | 2 | Hostile Closed Environment → Stress → Sleep Deficiencies |
| Distance from Earth | 3 | Distance from Earth → Vehicle Design → Environmental Conditions → Sleep Deficiencies |

### 4.3 Body temperature (S-156 for infection, S-155 for illness)

| Hazard | Arrows | Shortest chain |
|---|---|---|
| Hostile, closed environment | 2 | Hostile Closed Environment → Air Contamination → Infection. The closed environment has seven such two-arrow chains: air, food, water, surface, human-waste and pharmaceutical contamination, and Microbial Virulence Factors |
| Altered gravity | 2 | Altered Gravity → Microbial Virulence Factors → Infection |
| Isolation and confinement | 2 | Isolation and Confinement → Microbiome → Infection |
| Space radiation | 3 | Radiation → Oxidative Stress → Inflammation → Medical Illness (S-155; radiation is not in S-156) |
| Distance from Earth | 4 | Distance from Earth → Vehicle Design → Crew Health and Performance System → Medical Treatment Capability → Infection |

### 4.4 Mood (S-157)

| Hazard | Arrows | Shortest chain |
|---|---|---|
| Isolation and confinement | 1 | Isolation and Confinement → Psychological Status |
| Space radiation | 4 | Radiation → Oxidative Stress → Inflammation → Central Nervous System Changes → Psychological Status |
| Distance from Earth | 4 | Distance from Earth → Communication Factors → Ground Support → BHP Family Services → Psychological Status |
| Altered gravity | none | Not a node in S-157 |
| Hostile, closed environment | none | Not a node in S-157 |

### 4.5 Blood sugar (S-158)

| Hazard | Arrows | Shortest chain |
|---|---|---|
| Space radiation | 1 | Radiation → Nutrients. NASA's file labels this arrow "loe 3", a level-of-evidence mark explained in S-151, which hasn't been read |
| Hostile, closed environment | 2 | Hostile Closed Environment → Food Storage Conditions → Nutrients |
| Altered gravity | 3 | Altered Gravity → Food System → Food Production → Nutrients |
| Distance from Earth | 4 | Distance from Earth → Resupply → Food System → Food Production → Nutrients |
| Isolation and confinement | none | Not a node in S-158 |

All five are rated Distant or Not linked, because the reading level is Low (section 2.4).

## 5. Links through other risks (not counted in the grid)

NASA's diagrams connect risks to each other. These chains are real, but they end at a whole risk, not at the node a reading watches:

| Chain | Diagram | What it suggests |
|---|---|---|
| Altered Gravity → Stress → Fatigue → Behavioral (Risk) | S-154 | Gravity reaches mood only through sleep and stress, as D-25 noted |
| Hostile Closed Environment → Stress → Fatigue → Behavioral (Risk) | S-154 | The same for the closed environment |
| Circadian Misalignment → Behavioral (Risk); Sleep Deficiencies → Immune (Risk) | S-154 | Poor sleep feeds both the mood and the immune risks, so a sleep problem can come before a mood or temperature change |
| Nutrients → Behavioral Health (Risk); Nutrients → Cardiovascular (Risk); Nutrients → Sleep (Risk) | S-158 | Nutrition feeds three other risks |
| Inflammation → Food and Nutritions, Immune, Sleep, (Risks) | S-153 | The cardiovascular diagram feeds back into nutrition, immune and sleep |

This supports what D-25 and S-07 already say: **hazards compound, so a change in one reading can't be blamed on one hazard.**

## 6. Changes from the D-25 sheet

| Cell | D-25 | v2 | Why it changed |
|---|---|---|---|
| Altered gravity → body temperature | B | Close | Two arrows to Infection, the same as the closed environment |
| Isolation → body temperature | B | Close | Isolation and Confinement → Microbiome → Infection, two arrows |
| Gravity, isolation, closed environment → sleep | B | Close | Two arrows each, through Stress or Environmental Conditions |
| Radiation → heart rate, blood pressure | B | Distant | Two arrows, but the effect is long-term disease (S-163, S-126) |
| Isolation → heart rate, blood pressure | B | Intermediate | Three arrows; both readings use the same nodes (section 2.2) |
| Closed environment, distance → heart rate, blood pressure | B | Distant | Four arrows |
| Radiation, distance → mood | B | Distant | Four arrows |
| Radiation, distance, gravity, closed environment → blood sugar | B | Distant | Low reading level |
| Radiation → body temperature | B | Intermediate | Three arrows |
| Distance → sleep | B | Intermediate | Three arrows |
| Distance → body temperature | B | Distant | Four arrows |

Every cell D-25 rated A is now Close. Every cell it rated C (isolation → blood sugar; gravity and the closed environment → mood) stays Not linked. No cell went from unlinked to linked, or from linked to unlinked.

## 7. Limits

1. **The mapping in section 2.2 is the team's, not NASA's.** If Data & Science picks different nodes, the arrow counts change. Re-run section 4 after any change.
2. **Arrow counts aren't effect sizes.** A short chain can carry a small effect and a long chain a large one.
3. **The diagram narratives weren't read.** They explain each arrow and may qualify it (D-25 gap 3). Read them before this sheet is approved.
4. **The in-flight evidence comes from Sources.md descriptions,** not from re-reading the papers. Most rows are Logged.
5. **Almost no evidence separates one hazard from another.** Mars-500 (S-52) is the only isolation-only study held. No bed-rest (gravity) or radiation study on these indicators is held.
6. **NASA can revise its diagrams.** The files read carry dates from 2022 to 2025. Record the file date when re-checking.
7. **Guidance, not diagnosis.** This sheet explains *why* each indicator is watched. It must never be used to say which hazard caused a reading.

## 8. For Data & Science to do

1. Approve or change the node mapping in section 2.2.
2. Open the six diagram code files and confirm the chains in section 4. Each chain is short enough to check by eye.
3. Read the narrative PDFs for S-153 to S-158, and S-151 for the meaning of "loe 3".
4. Decide how the blood sugar card describes its weak hazard link.
5. Decide whether the in-flight core temperature rise (S-46) needs a note on the temperature card, since it can look like a fever.
6. If approved: log a decision, and put the grid in a fixed input file so the app can show it (machine-readable draft: `hazard_links_v2_draft.json`, beside this sheet).

---

*Draft only. The team decides. Guidance, not diagnosis.*
