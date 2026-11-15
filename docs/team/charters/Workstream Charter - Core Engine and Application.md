# Workstream Charter: Core Engine / Application

**Team:** OrbitNsukka | **Lead:** A.E. | **Assistant:** O.F.
**Challenge:** Create Health Monitoring Software for Astronauts on Space Missions

Every member takes part in every workstream. All build work starts only at **November 14, 2026, 9:00 a.m.**

## Purpose
Build the working heart of the tool: entering indicators, judging their status and giving results, all offline.

## Responsibilities
- Logic to enter and store the six indicators: heart rate, blood pressure, blood sugar, body temperature, sleep hours and mood.
- Status rules that read thresholds from a separate settings layer, which Data & Science fills from the indicator sheet.
- Offline-first operation that works with little power.
- Load the synthetic sample data.

## Additions agreed for this workstream
- **Data privacy rule:** nothing leaves the device, and only synthetic data is stored.
- **Reset and export:** a function to reload clean sample data before presenting, and to export what is needed for the demo.
- **Input safety fallback:** if a reading is missing or impossible (for example, a heart rate of 900), the tool asks again instead of showing a status.

## Special documents
- Data model and settings-layer description
- Status rules list (matches the indicator sheet)
- Technical notes: libraries used and their licenses

## Rules to enforce
- No stretch features (body figure, gamification, extra environments) until the team confirms the MVP works perfectly.
- Thresholds are never hard-coded. They come from the settings layer so values can change and a later community version stays possible.
- Every library or dataset must be open source or freely available, with its license recorded and cited.
- Original code is open source. The team chooses the license deliberately.
- Do not include export-controlled material.

## Cross-check
Routine cross-checks by Project & Delivery. Integration, AI & Quality tests that tool thresholds match the indicator sheet.

## Done when
- All six indicators work end to end, offline, with clean reset.
- Bad or missing inputs are handled safely.
