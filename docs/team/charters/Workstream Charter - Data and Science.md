# Workstream Charter: Data & Science

**Team:** OrbitNsukka | **Lead:** A.S. | **Assistant:** O.B.
**Challenge:** Create Health Monitoring Software for Astronauts on Space Missions

Every member takes part in every workstream. Our emphasis is the science, so this workstream guards the truth of everything in the tool.

## Purpose
Make sure every number and every piece of advice in the tool is real, traceable and cited.

## Responsibilities
- **Indicator sheet:** for heart rate, blood pressure, blood sugar, body temperature, sleep hours and mood, record how each is measured in space, why the exam is needed, and its normal range, warning range and the point where flight surgeons should be contacted.
- **Hazard-links sheet:** how radiation, isolation and confinement, distance from Earth, gravity fields and the hostile closed environment affect each indicator.
- **Guidance content:** plain-language explanations, how-to-measure steps and preventive actions, written in advance.
- **Sources list:** a citation and license note for every reference, merged into the general sources file.
- **Synthetic demo data:** realistic sample data only, never real health records.
- **Sign-off:** nothing ships in the tool unless this workstream has signed off on its source.

## Additions agreed for this workstream
- **Limits statement:** the tool gives guidance only and does not diagnose. This wording is supplied for the interface and the pitch.

## Special documents
- Indicator sheet
- Hazard-links sheet
- Guidance content
- Workstream sources list

## Cross-check rule
These documents are generalized into the general documents and cross-checked by **B.B.** (Project & Delivery), not O.B., to keep the check independent. Integration, AI & Quality does the deeper checks, such as matching tool thresholds to the indicator sheet.

## Rules to enforce
- Use NASA Human Research Program and other space agency resources as the primary sources.
- Cite every source, even open-source or free ones, and note the license.
- Say plainly when something cannot be verified instead of guessing.
- Synthetic or public data only. No personal information.
- Keep thresholds and guidance in a form the settings layer can load, so a later community version stays possible (post-hackathon side project, not part of the submission).

## Done when
- All six indicators have complete, cited entries.
- Every claim shown in the tool traces to a source in the sources file.
