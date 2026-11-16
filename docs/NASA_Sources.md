# NASA sources

**Team:** OrbitNsukka | **Date:** Nov 16, 2026
**AI disclosure (D-44):** this list was compiled by an AI assistant (Claude, Anthropic) at the team leader's direction, from the team's sources file (`docs/Sources.md`) and from the files the app reads. The assistant is not a source.

This page states **every NASA resource the project uses**, and says how each one is used. It also lists the NASA resources that are logged but not used, so that nothing is left out. There are **88 NASA rows** in `docs/Sources.md`:

| Section | What | Count |
|---|---|---|
| 1 | Used in the app: cited by ID in a file the app reads | 15 |
| 2 | Used in the documents behind the app | 23 |
| 3 | The challenge and NASA's reuse rules | 8 |
| 4 | Logged, but not used by the app or by any claim | 42 |
| | **All NASA rows** | **88** |

**How to read it.**
- Each resource keeps its S-ID from `docs/Sources.md`, where its full record, licence notes and offline copy are.
- **Status** is copied from that file. *Verified* means the team approved the source (D-41). *Logged* means nobody on the team has checked it yet.
- "NASA resource" means a row whose publisher is NASA, or whose link is on a NASA site or the NASA Space Apps site. A few are NASA material hosted elsewhere; they say so.
- No NASA logo, insignia or mission mark is used anywhere in the project. NASA is cited as a source only and does not endorse this project.

## 1. Used in the app

These are the NASA resources whose S-ID is in a file the app reads (`app/data/`).

### 1a. Shown on screen as a source ID

| S-ID | Resource | What it supports | Where it is used | Status |
|---|---|---|---|---|
| S-31 | [Crew medical officer as a healthcare extender (NTRS 20230013415)](https://ntrs.nasa.gov/citations/20230013415) | Caution: tell the crew medical officer | `Indicator_Thresholds.json`, `meta.status_meaning`. Shown under every Caution result | Verified (D-41) |
| S-32 | [Private medical conferences (NTRS 20080010877)](https://ntrs.nasa.gov/archive/nasa/casi.ntrs.nasa.gov/20080010877.pdf) | Emergency: request a private medical conference with the flight surgeon | `Indicator_Thresholds.json`, `meta.status_meaning`. Shown under every Emergency result | Verified (D-41) |
| S-153 | [Cardiovascular risk diagram (code)](https://www.nasa.gov/wp-content/uploads/2024/07/cardio-vte-hsrb-dag-code.txt) | The chains from the five hazards to heart rate and blood pressure | `Hazard_Links.json`, `links[].diagram`: 10 of the 30 links. Shown beside each of those links in the "Why this is watched" panel | Logged |
| S-154 | [Sleep risk diagram (code)](https://www.nasa.gov/wp-content/uploads/2025/09/sleep-risk-dag-code-sa-07566.txt) | The chains from the five hazards to sleep hours | `Hazard_Links.json`, `links[].diagram`: 5 of the 30 links. Shown beside each of those links in the "Why this is watched" panel | Logged |
| S-155 | [Immune risk diagram (code)](https://www.nasa.gov/wp-content/uploads/2025/09/immune-dag-code-sa-07566.txt) | The chain from space radiation to body temperature | `Hazard_Links.json`, `links[].diagram`: 1 of the 30 links. Shown beside that link in the "Why this is watched" panel | Logged |
| S-156 | [Host-microorganism risk diagram (code)](https://www.nasa.gov/wp-content/uploads/2025/09/microhost-dag-code-sa-07566.txt) | The chains from the other four hazards to body temperature | `Hazard_Links.json`, `links[].diagram`: 4 of the 30 links. Shown beside each of those links in the "Why this is watched" panel | Logged |
| S-157 | [Behavioral health risk diagram (code)](https://www.nasa.gov/wp-content/uploads/2025/09/behavioral-health-dag-code-sa-07566.txt) | The chains from the five hazards to mood | `Hazard_Links.json`, `links[].diagram`: 5 of the 30 links. Shown beside each of those links in the "Why this is watched" panel | Logged |
| S-158 | [Food and nutrition risk diagram (code)](https://www.nasa.gov/wp-content/uploads/2023/09/food-risk-narrative.txt) | The chains from the five hazards to blood sugar | `Hazard_Links.json`, `links[].diagram`: 5 of the 30 links. Shown beside each of those links in the "Why this is watched" panel | Logged |

The six diagram links go to each diagram's code file, which lists every arrow. These are the files named in `Hazard_Links.json` (`meta.diagram_files_read`). Each diagram also has a page and a narrative PDF, listed in `docs/Sources.md`.

### 1b. Cited in the hazard file, not shown on screen

These explain a rating or record the evidence behind an indicator. They are in `Hazard_Links.json`, but the panel does not show them.

| S-ID | Resource | What it supports | Field in `Hazard_Links.json` | Status |
|---|---|---|---|---|
| S-43 | [Fluid Shifts experiment](https://www.nasa.gov/?p=431818) | Fluid shifts toward the head in flight: evidence for blood pressure | `indicators.blood_pressure.evidence.sources` | Logged |
| S-120 | [Risk of Cardiovascular Adaptations](https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/) | Fainting risk at landing: evidence for heart rate | `indicators.heart_rate.evidence.sources` | Logged |
| S-121 | [Risk of Inadequate Food and Nutrition](https://www.nasa.gov/reference/risk-of-inadequate-food-and-nutrition/) | NASA's nutrition risk page does not mention glucose: why the blood sugar link is rated weak | `indicators.blood_sugar.mapping_strength` | Logged |
| S-126 | [Cardiovascular risk statement](https://www.nasa.gov/directorates/esdmd/hhp/risk-of-cardiovascular-adaptations-contributing-to-adverse-mission-performance-and-health-outcomes/) | Radiation's effect on the heart is long-term disease: why radiation is rated Distant for heart rate and blood pressure | `override` on two links | Logged |
| S-143 | [NASA Flight Research Overview (Platts, 2016; NTRS 20170000811)](https://ntrs.nasa.gov/api/citations/20170000811/downloads/20170000811.pdf) | NASA tracks mood by self-report in isolated missions: evidence for mood | `indicators.mood.evidence.sources` | Logged |
| S-163 | [Evidence report: cardiovascular disease and other degenerative tissue effects from radiation (NTRS 20150016006)](https://ntrs.nasa.gov/citations/20150016006) | Radiation as a long-term cause of heart disease, with high uncertainty: the same two ratings as S-126 | `override` on two links | Logged |
| S-171 | [Astronaut Sleep Duration Varies by Timing of Scheduled Sleep Episodes (Flynn-Evans et al., 2023)](https://ntrs.nasa.gov/citations/20230003916) | Astronauts slept 7.33 h in space against 7.87 h before flight: evidence for sleep hours | `indicators.sleep_hours.evidence.sources` | Logged |

## 2. Used in the documents behind the app

These are not cited by a file the app reads. They support the documents the fixed inputs were built from.

### 2a. Cited in the Data & Science sheets

| S-ID | Resource | What it supports | Cited in | Status |
|---|---|---|---|---|
| S-07 | [5 Hazards of Human Spaceflight](https://www.nasa.gov/hrp/hazards/) | The five hazards, and that they compound each other | Hazard sheets v2 and D-25; claim map | Logged |
| S-08 | [Risks of Human Spaceflight](https://www.nasa.gov/hrp/risks/) | NASA's risk titles named on each indicator | Hazard sheet D-25; claim map | Logged |
| S-12 | [The Human Body in Space](https://www.nasa.gov/humans-in-space/the-human-body-in-space/) | The main effects of each hazard on the body | Hazard sheet D-25; claim map | Logged |
| S-147 | [Human System Risk Board](https://www.nasa.gov/hhp/hsrb) | Every risk is traced from the five hazards, drawn as risk diagrams | Hazard sheets v2 and D-25; Decision Log | Logged |
| S-148 | [Directed Acyclic Graphs: NASA's human system risk diagrams (NASA/TP 20220015709)](https://ntrs.nasa.gov/citations/20220015709) | All approved risk diagrams in one document | Hazard sheet D-25 | Logged |
| S-149 | [Directed Acyclic Graph Guidance Documentation (NASA/TM 20220006812)](https://ntrs.nasa.gov/citations/20220006812) | How to read the diagrams: hazards, contributing factors, arrows | Hazard sheet D-25 | Logged |
| S-159 | [Sleep evidence report (April 2016)](https://humanresearchroadmap.nasa.gov/evidence/reports/Sleep.pdf) | The evidence behind the sleep risk | Hazard sheet D-25 | Logged |
| S-164 | [Hazard: Hostile/Closed Environments](https://www.nasa.gov/hrp/hazard-hostile-closed-environments) | Microbes spread more easily; stress and immune changes in closed habitats | Hazard sheet D-25; claim map | Logged |
| S-165 | [NASA-STD-3001 Volume 1, Revision C](https://standards.nasa.gov/sites/default/files/standards/NASA/C//nasa-std-3001-vol-1-rev-c-signature.pdf) | NASA's crew health standard, including crew health monitoring | Hazard sheet D-25 | Logged |
| S-166 | [Longitudinal Health Surveillance technical brief](https://www.nasa.gov/wp-content/uploads/2023/03/longitudinal-health-surveillance-technical-brief-ochmo.pdf) | What NASA checks before, during and after flight | Hazard sheet D-25 | Logged |

"Hazard sheet v2" is `docs/data-science/Hazard_Links_Sheet_v2_Draft.md`, approved for the refined build under D-57. "Hazard sheet D-25" is `docs/data-science/Hazard_Links_Sheet_D-25.md`, the record for the original app. "Claim map" is section 5 of `docs/Sources.md`.

### 2b. Cited only in the claim map

Section 5 of `docs/Sources.md` lists every claim with its source. These NASA resources are cited there and nowhere else.

| S-ID | Resource | What it supports | Status |
|---|---|---|---|
| S-17 | [ARCHeR (Artemis Research for Crew Health and Readiness)](https://www.nasa.gov/reference/archer) | Sleep and behaviour tracked with wrist actigraphy and surveys; the combined effect of hazards | Logged |
| S-19 | [Image: wrist actigraphy device](https://www.nasa.gov/image-detail/amf-jsc2025e075542_alt/) | How sleep is measured in space | Logged |
| S-36 | [Sleep-Wake Actigraphy and Light Exposure, Sleep-Long (NTRS 20090014819)](https://ntrs.nasa.gov/citations/20090014819) | Sleep measured with a wrist device and daily sleep logs | Logged |
| S-39 | [Spaceflight Standard Measures](https://nlsp.nasa.gov/explore/home/lsda_sm) | NASA's standard set of measures | Logged |
| S-44 | [Science in Space: Week of Aug. 18, 2023 – The Space Diet](https://www.nasa.gov/missions/station/iss-research/science-in-space-week-of-aug-18-2023-the-space-diet/) | Nutrition and blood chemistry studies. The page does not mention glucose | Logged |
| S-45 | [Biochem Profile (NTRS 20140013313)](https://ntrs.nasa.gov/citations/20140013313) | In-flight blood chemistry | Logged |
| S-51 | [Mehta and Pierson (NTRS 20100010318)](https://ntrs.nasa.gov/search.jsp?R=20100010318) | Isolation, sleep loss, gravity and radiation raise stress hormones | Logged |
| S-122 | [Risk from Inadequate Sleep and Irregular Schedules](https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/) | Why sleep hours is watched | Logged |
| S-123 | [Risk of Behavioral Changes and Psychiatric Disorders](https://www.nasa.gov/reference/risk-of-behavioral-conditions-and-psychiatric-disorders/) | Why mood is watched | Logged |
| S-124 | [Risk of Altered Immune System Responses](https://www.nasa.gov/reference/risk-of-altered-immune-system-responses/) | Why body temperature is watched | Logged |
| S-125 | [Risk of Host-Microorganism Interactions](https://www.nasa.gov/reference/risk-of-host-microorganism-interactions/) | Why body temperature is watched | Logged |
| S-127 | [Food and nutrition risk page (Human Health and Performance)](https://www.nasa.gov/directorates/esdmd/hhp/food-and-nutrition-risk/) | The formal title of the food and nutrition risk | Logged |
| S-141 | [Multifunctional Integrated Medical Devices](https://www.nasa.gov/glenn/glenn-expertise-space-exploration/human-health-performance/exploration-medical-technologies/multifunctional-integrated-medical-devices) | How vital signs are measured on the station today | Logged |

## 3. The challenge and NASA's reuse rules

These set the rules the project follows. They support no health claim.

| S-ID | Resource | What it is used for | Status |
|---|---|---|---|
| S-01 | [Challenge page: Create Health Monitoring Software for Astronauts on Space Missions](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/) | The challenge text, its objectives and its suggested indicators | Logged |
| S-03 | [Judging and Awards Guide](https://www.spaceappschallenge.org/resources/judging-awards-guide) | Judging criteria; every outside resource must be cited | Logged |
| S-04 | [Participant FAQs](https://www.spaceappschallenge.org/resources/participant-faqs/) | Theme, dates and team rules | Logged |
| S-05 | [Space Apps 2026 hackathon page](https://www.spaceappschallenge.org/2026/) | Event dates and structure | Logged |
| S-06 | [Space Apps brand guidelines](https://spaceappschallenge.org/brand) | The NASA insignia may not be used | Logged |
| S-64 | [NASA media usage guidelines (archived 2013 copy)](https://webarchive.library.unt.edu/web/20130217173218/http://www.nasa.gov/multimedia/guidelines/index.html) | NASA text is generally free to use with credit, with no implied endorsement. The current page is still to be found | Logged |
| S-65 | [NASA insignia, logotype and seal](https://www.nasa.gov/?p=451006) | NASA logos are protected and must not appear in the app, slides or video | Logged |
| S-113 | [NASA welcomes all ages for Space Apps](https://science.nasa.gov/universe/nasa-welcomes-all-ages-experience-levels-for-space-apps-challenge/) | Event context | Logged |

## 4. Logged, but not used

These 42 NASA rows are in `docs/Sources.md`, but no file the app reads cites them, and neither do the Data & Science sheets or the claim map. They are listed so that this page covers every NASA row. Their descriptions are in `docs/Sources.md`.

**The five hazards: other NASA pages** (`docs/Sources.md`, section 3b)

| S-ID | Resource | Publisher | Status |
|---|---|---|---|
| S-09 | [Ongoing HRP Research](https://www.nasa.gov/hrp/ongoing-hrp-research/) | NASA HRP | Logged |
| S-13 | [HRP Space Radiation page](https://www.nasa.gov/hrp/radiation/) | NASA HRP | Logged |
| S-14 | [Human Research Program home](https://www.nasa.gov/hrp/) | NASA HRP | Logged |
| S-15 | [NASA Twins Study page](https://www.nasa.gov/humans-in-space/twins-study/) | NASA | Logged |
| S-16 | [Analog missions](https://www.nasa.gov/analog-missions/) | NASA | Logged |
| S-18 | [Artemis II crew to advance human spaceflight research](https://www.nasa.gov/humans-in-space/artemis-ii-crew-to-advance-human-spaceflight-research/) | NASA | Logged |

**How each indicator is measured in space** (`docs/Sources.md`, section 3d)

| S-ID | Resource | Publisher | Status |
|---|---|---|---|
| S-35 | [News release 536459 on the Bio-Analyzer](https://www.eurekalert.org/news-releases/536459) | EurekAlert (NASA release) | Logged |

**How the hazards affect each indicator** (`docs/Sources.md`, section 3e)

| S-ID | Resource | Publisher | Status |
|---|---|---|---|
| S-40 | [NASA page on Standard Measures](https://www.nasa.gov/?p=905750) | NASA | Logged |
| S-41 | [NTRS document 20180002943](https://ntrs.nasa.gov/api/citations/20180002943/downloads/20180002943.pdf) | NASA NTRS | Logged |
| S-48 | [News release 517583 (Integrated Immune)](https://www.eurekalert.org/news-releases/517583) | EurekAlert (NASA HRP) | Logged |
| S-54 | [Smith, NTRS document 20100030546](https://ntrs.nasa.gov/api/citations/20100030546/downloads/20100030546.pdf) | NASA NTRS | Logged |
| S-62 | [OSDR Environmental Data App](https://www.nasa.gov/reference/osdr-environmental-data) | NASA | Logged |
| S-63 | [Open Science Data Repository](https://osdr.nasa.gov/) | NASA OSDR | Logged |

**Parked: radiation dose, biomarkers, data and models (D-21)** (`docs/Sources.md`, section 3g)

| S-ID | Resource | Publisher | Status |
|---|---|---|---|
| S-68 | [Radiation protection technical brief (NASA-STD-3001)](https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf) | NASA OCHMO | Logged |
| S-69 | [ASCEND draft (Simonsen), NTRS 20250006168](https://ntrs.nasa.gov/api/citations/20250006168/downloads/ASCEND%20Simonsen%20draft%201.pdf) | NASA NTRS | Logged |
| S-73 | [George et al., NTRS 20070025033](https://ntrs.nasa.gov/search.jsp?R=20070025033) | NASA NTRS | Logged |
| S-74 | [Space Radiation Element: integrative risks, models, toolkit](https://www.nasa.gov/hrp/radiation/integrative-risks-models-toolkit) | NASA HRP | Logged |
| S-75 | [Scientists help NASA evaluate responses to space radiation](https://www.nasa.gov/hrp/scientists-help-nasa-evaluate-responses-to-space-radiation) | NASA HRP | Logged |
| S-80 | [Sishc et al., NTRS 20210023289](https://ntrs.nasa.gov/api/citations/20210023289/downloads/Brock%20EC%20V2.pdf) | NASA NTRS | Logged |
| S-82 | [Kennedy, radioprotectors (PDF)](https://three.jsc.nasa.gov:443/articles/KennedyRadioprotectors.pdf) | NASA THREE | Logged |
| S-84 | [Biological Dosimetry (PDF)](https://three.jsc.nasa.gov:443/articles/BiologicalDosimetry.pdf) | NASA THREE | Logged |
| S-85 | [Huff and Cucinotta, biodosimetry results (PDF)](https://www.nist.gov/system/files/documents/2017/05/09/FT8Huff.pdf) | NIST (hosting NASA talk) | Logged |
| S-88 | [NSCR-2012 software record](https://software.nasa.gov/software/MSC-25352-1) | NASA Software Catalog | Logged |
| S-89 | [OLTARIS](https://oltaris.nasa.gov/) | NASA | Logged |
| S-90 | [RadLab portal](https://visualization.osdr.nasa.gov/radlab/) | NASA OSDR | Logged |
| S-91 | [NTRS record 20230014315 (RadLab)](https://ntrs.nasa.gov/citations/20230014315) | NASA NTRS | Logged |
| S-92 | [NASA OSDR page on RadLab detectors](https://www.nasa.gov/?p=687540) | NASA | Logged |
| S-93 | [DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI) | NASA CCMC | Logged |
| S-94 | [DONKI disclaimer](https://kauai.ccmc.gsfc.nasa.gov/DONKI/Disclaimer) | NASA CCMC | Logged |
| S-97 | [NASA watches Mars light up during epic solar storm](https://www.nasa.gov/solar-system/planets/mars/nasa-watches-mars-light-up-during-epic-solar-storm) | NASA | Logged |
| S-98 | [Curiosity RAD data, PDS PPI node](https://pds-ppi.igpp.ucla.edu/volume/MSLRAD_1002/DOCUMENT/RAD_RDR_SIS.HTM) | NASA Planetary Data System | Logged |
| S-101 | [NASA page on SOMA](https://www.nasa.gov/?p=729457) | NASA | Logged |

**Context only** (`docs/Sources.md`, section 3h)

| S-ID | Resource | Publisher | Status |
|---|---|---|---|
| S-114 | [International Space Station page](https://www.nasa.gov/international-space-station/) | NASA | Logged |

**Added Nov 14: risk pages and measurement** (`docs/Sources.md`, section 3i)

| S-ID | Resource | Publisher | Status |
|---|---|---|---|
| S-128 | [Human System Risks](https://www.nasa.gov/hhp/human-system-risks/) | NASA Human Health and Performance | Logged |
| S-129 | [Human Research Roadmap, Evidence page](https://humanresearchroadmap.nasa.gov/Evidence/) | NASA HRP | Logged |
| S-138 | [Zwart et al., genotype, B-vitamin status and ophthalmic changes (FASEB J 2016; NTRS copy)](https://ntrs.nasa.gov/citations/20150020960) | FASEB Journal / NASA NTRS | Logged |

**Added Nov 14: evidence reports** (`docs/Sources.md`, section 3j)

| S-ID | Resource | Publisher | Status |
|---|---|---|---|
| S-160 | [Immune evidence report (June 2022)](https://humanresearchroadmap.nasa.gov/evidence/reports/IMMUNE%20EB%20Update%202021%20v02%20FINAL_6-15-22.pdf) | NASA HRP | Logged |
| S-161 | [Host-microorganism evidence report (July 2022)](https://humanresearchroadmap.nasa.gov/evidence/reports/Host_Micro%20EB_Final%207-6-22.pdf) | NASA HRP | Logged |
| S-162 | [Behavioral medicine evidence report (Feb 2025), NTRS 20250001454](https://ntrs.nasa.gov/citations/20250001454) | NASA NTRS | Logged |

**Merged from the Data & Science pack (D-37)** (`docs/Sources.md`, section 3l)

| S-ID | Resource | Publisher | Status |
|---|---|---|---|
| S-169 | [Counteracting Bone and Muscle Loss in Microgravity](https://www.nasa.gov/missions/station/iss-research/counteracting-bone-and-muscle-loss-in-microgravity) | NASA | Logged |
| S-170 | [Risk of Spaceflight-Induced Bone Changes](https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes) | NASA | Logged |
| S-172 | OCHMO-TB-041 Rev B, Sleep Accommodations technical brief (no direct link recorded) | NASA Office of the Chief Health and Medical Officer | Logged |

## 5. Notes

- **Only two NASA resources are Verified:** S-31 and S-32 (D-41). Every other row here is Logged: nobody on the team has opened it and confirmed it yet.
- **Six Logged resources are shown on screen.** The diagram IDs S-153 to S-158 appear in the "Why this is watched" panel. The hazard file that carries them was approved under D-57, but their rows in `docs/Sources.md` are still Logged, and that file's own rule is that nothing Logged may appear in the tool. Data & Science needs to verify these six rows, or the team needs to record that D-57 covers them (`docs/ISSUES.md`, R-59).
- **The build opened none of these links.** The app was built in a cloud session from the files in this repository. `docs/Sources.md` records which links were opened when each row was logged.
- **Unresolved NASA short links.** S-43, which the hazard file cites, is recorded only as a short link (`nasa.gov/?p=...`). So are S-65 in section 3 and S-40, S-92 and S-101 in section 4. Record the real page title and address when verifying.
- **Two links did not open for the assistant** when it first logged them: S-148 timed out, and S-165 was found by search and never opened, though a copy is saved offline. Check both.
- **The diagram narratives are unread.** Each risk diagram also has a narrative PDF that explains its arrows. Nobody on the team has read them yet.
- **Reuse terms.** NASA text is generally free to use with credit, but the team has still to confirm the current terms (S-64 is an archived 2013 copy).
- **Not NASA resources.** The hazard file also cites sources about spaceflight that NASA did not publish: S-42 (The Physiological Society), S-46 (ESA), S-47 and S-52 (International Astronautical Federation), S-49 (PubMed Central), S-139 (The Lancet Neurology), S-144 (ISS National Laboratory) and S-151 (npj Microgravity). The threshold file's other sources are Earth clinical sources. All of them are in `docs/Sources.md`, not here.
- **Kept in step by a test.** `tests/sources.test.js` fails if a NASA resource cited by a file the app reads is missing from section 1, if a NASA row of `docs/Sources.md` is missing from this page, or if a status here differs from that file.
