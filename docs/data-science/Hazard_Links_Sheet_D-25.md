# Hazard-Links Sheet

**Team:** OrbitNsukka | **Workstream:** Data & Science (A.S. lead, O.B. assistant) | **Date:** Nov 14, 2026 | **Status:** DRAFT. Every link is Logged. Data & Science verifies; B.B. cross-checks (D-08). Method set by D-25, due at checkpoint CP-S3 under D-24.

This is a Data & Science special document, drafted by the AI assistant. It shows how each of the five hazards can affect each of the six indicators the astronaut enters by hand. Every link cites a row in "Sources.md". The assistant is not a source.

---

## 1. Method: NASA's own chain from hazard to indicator

NASA's Human System Risk Board traces every human health risk from at least one of the five hazards to a mission outcome (S-147). It draws each risk as a diagram of arrows, called a directed acyclic graph. The diagrams for our indicators' risks are published, and their text versions list each hazard and the factors it feeds (S-153 to S-158).

The chain has three steps:

1. **Hazard to risk factor.** A NASA risk diagram shows the hazard pointing to a factor, such as fluid shifts or stress. Source: the diagram.
2. **Risk factor to NASA risk.** The diagram belongs to one NASA risk, such as the cardiovascular risk. Source: the diagram.
3. **NASA risk to our indicator.** Our indicator is one way the astronaut can watch that risk. Source: NASA's risk titles (S-08) and in-flight studies. This step is the team's mapping, so Data & Science must approve it.

**What the chain does not do.** The diagrams are NASA's causal model of risk. They are not measurement instructions, and they never name heart rate, blood pressure, blood sugar or body temperature as nodes. A reading shows how the body is doing. It cannot show how much of a hazard the astronaut received, or which hazard caused a change, because the hazards compound each other (S-07, S-154). The tool gives guidance, not diagnosis.

**How each link is rated.**

| Rating | Meaning |
|---|---|
| A | The NASA diagram points from the hazard straight to the change this reading tracks |
| B | The NASA diagram links the hazard to the risk only through a middle factor, such as stress, oxidative stress or vehicle design |
| C | No NASA diagram link was found for this pair |

## 2. Indicator to NASA risk

| Indicator | NASA risk it helps watch | Risk diagram |
|---|---|---|
| Heart rate | Cardiovascular Adaptations | S-153 |
| Blood pressure | Cardiovascular Adaptations | S-153 |
| Blood sugar | Inadequate Food and Nutrition | S-158 |
| Body temperature | Altered Immune Response; Host-Microorganism Interactions | S-155, S-156 |
| Sleep hours | Sleep Loss, Circadian Desynchronization and Work Overload | S-154 |
| Mood | Behavioral Changes and Psychiatric Disorders | S-157 |

## 3. Summary grid

| Hazard | Heart rate | Blood pressure | Blood sugar | Body temperature | Sleep | Mood |
|---|---|---|---|---|---|---|
| Space radiation | B | B | B | B | A | B |
| Isolation and confinement | B | B | C | B | B | A |
| Distance from Earth | B | B | B | B | B | B |
| Altered gravity | A | A | B | B | B | C |
| Hostile closed environment | B | B | B | A | B | C |

The strongest links are altered gravity on heart rate and blood pressure, the closed environment on body temperature, isolation on mood, and radiation on sleep. Blood sugar has no A link, which matches the earlier finding that it is our weakest indicator.

## 4. Each link in detail

### Space radiation

| Indicator | How NASA links them | Sources | Rating |
|---|---|---|---|
| Heart rate, blood pressure | Radiation feeds inflammation and oxidative stress in the cardiovascular diagram. Radiation is also a long-term cause of heart disease, though uncertainty is high. A daily reading will not show this long-term effect | S-153, S-163, S-152 | B |
| Blood sugar | Radiation affects food acceptability, food production, storage and nutrients | S-158 | B |
| Body temperature | Radiation feeds oxidative stress in the immune diagram. It is not in the microorganism diagram | S-155 | B |
| Sleep | Radiation points directly to sleep deficiencies and to environmental conditions | S-154 | A |
| Mood | Radiation feeds oxidative stress in the behavioral diagram. The 2020 review ties radiation to nervous-system effects | S-157, S-152 | B |

### Isolation and confinement

| Indicator | How NASA links them | Sources | Rating |
|---|---|---|---|
| Heart rate, blood pressure | Isolation feeds stress in the cardiovascular diagram | S-153 | B |
| Blood sugar | Isolation is not a node in the food and nutrition diagram | S-158 | C |
| Body temperature | Isolation feeds the microbiome and stress in the immune diagram, and the microbiome in the microorganism diagram | S-155, S-156 | B |
| Sleep | Isolation feeds stress and workload in the sleep diagram | S-154 | B |
| Mood | Isolation points directly to psychological status and nervous-system changes. NASA's risk page states that isolation "can result in decrements in cognitive and behavioral functioning". The Mars-500 isolation study found chronic stress | S-157, S-152, S-52 | A |

### Distance from Earth

| Indicator | How NASA links them | Sources | Rating |
|---|---|---|---|
| Heart rate, blood pressure | Distance feeds vehicle design, which limits care and countermeasures | S-153 | B |
| Blood sugar | Distance feeds resupply and vehicle design. NASA's nutrition page notes missions without regular resupply | S-158, S-121 | B |
| Body temperature | Distance feeds circadian misalignment, vehicle design and nutrients in the immune diagram | S-155, S-156 | B |
| Sleep | Distance feeds vehicle design in the sleep diagram | S-154 | B |
| Mood | Distance feeds communication factors and vehicle design. The 2020 review ties isolation and distance to behavioural risk | S-157, S-152 | B |

### Altered gravity

| Indicator | How NASA links them | Sources | Rating |
|---|---|---|---|
| Heart rate | Gravity points directly to fluid shifts and blood stagnation, leading to orthostatic intolerance and fainting. Note: a study found resting heart rate unchanged in flight; the effect shows mainly on standing after landing | S-153, S-120, S-42 | A |
| Blood pressure | Same path as heart rate. In-flight 24-hour blood pressure fell about 10 mm Hg | S-153, S-120, S-42, S-43 | A |
| Blood sugar | Gravity affects the food system | S-158 | B |
| Body temperature | Gravity feeds microbial virulence and ongoing immune dysregulation. Core temperature runs about 1 °C higher in flight, though the source does not name gravity as the cause | S-155, S-156, S-46 | B |
| Sleep | Gravity feeds environmental conditions and stress in the sleep diagram | S-154 | B |
| Mood | Gravity is not a node in the behavioral diagram. It reaches stress only through the sleep diagram | S-157, S-154 | C |

### Hostile closed environment

| Indicator | How NASA links them | Sources | Rating |
|---|---|---|---|
| Heart rate, blood pressure | The closed environment feeds atmospheric conditions in the cardiovascular diagram | S-153 | B |
| Blood sugar | The closed environment affects food storage conditions | S-158 | B |
| Body temperature | The closed environment points directly to air, food, water and surface contamination and to microbial virulence, which lead to infection. NASA's hazard page says microbes spread more easily and immune function can change | S-156, S-155, S-164, S-134 | A |
| Sleep | The closed environment feeds stress in the sleep diagram. NASA's sleep page names noise, temperature, vibration and light | S-154 | B |
| Mood | The closed environment is not a node in the behavioral diagram. NASA's hazard page says stress hormones can rise | S-157, S-164 | C |

## 5. Gaps for Data & Science

1. **Temperature and infection.** Closed on Nov 14: the CDC page (S-134) says fever suggests an infectious cause, though fever is not always present with an infection. The temperature card should say both.
2. **The team's mapping step.** Step 3 of the chain is our own mapping. Data & Science should approve it in writing, since no NASA document maps these six indicators to the risks.
3. **Narrative PDFs not read.** The assistant read only the text versions of the diagrams. The narrative PDFs explain each arrow and should be saved offline and checked.
4. **Hazards compound.** NASA's hazard page and the sleep diagram both show hazards feeding each other. The sheet rates single links only. It does not add them up.

## 6. Documents that explain these relationships

For anyone who wants to understand the method, or for the judges:

| ID | What it explains |
|---|---|
| S-147 | NASA's rule that every risk is traced from the five hazards |
| S-148 | All approved risk diagrams in one NASA document |
| S-149 | How to read the diagrams |
| S-150 | Peer-reviewed paper on how NASA builds the diagrams (2024) |
| S-151 | Peer-reviewed paper on how NASA rates each risk (2023) |
| S-152 | Peer-reviewed review linking the five hazards to NASA's highest-priority risks (2020, CC BY 4.0) |
| S-07, S-12 | NASA's plain-language pages on the five hazards and the body in space |
| S-164 | NASA's page on the closed environment hazard |
| S-159 to S-163 | NASA evidence reports for sleep, immune, microorganisms, behaviour and radiation heart disease |
| S-165, S-166 | NASA's crew health standard and its monitoring brief |

---

*Draft only. The team decides. Guidance, not diagnosis.*
