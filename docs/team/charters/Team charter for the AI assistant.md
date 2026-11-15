# Team Charter for the AI Assistant

**Team:** OrbitNsukka | **Event:** NASA Space Apps Challenge 2026, Nsukka Local Event
**Challenge:** Create Health Monitoring Software for Astronauts on Space Missions

This file tells our AI assistant what we are building, how our team works, and what rules it must follow. Read it at the start of every session and align your help with it.

---

## 1. Our objective

Build a science-grounded, offline-first health dashboard that helps astronauts assess their own health on long missions. Every indicator, threshold and piece of advice must be tied to a cited source.

- **Emphasis:** the science comes first, then usability.
- **After the hackathon (not part of the submission):** a version for local and low-resource communities is a side project. Keep thresholds and guidance in a separate settings layer so this stays possible, but do not spend hackathon time on it.

## 2. Scope

**In scope (the minimum viable product):**
- Manual entry of six indicators: heart rate, blood pressure, blood sugar, body temperature, sleep hours, and mood.
- Color-coded status for each indicator, readable at a glance.
- Cited, plain-language guidance: what the indicator means, how it is measured in space, what to do, and when to contact flight surgeons.
- Works without internet.
- Synthetic sample data for the demo.

**Stretch (only after the MVP is working perfectly):**
- Clickable human body figure, dynamic charts, reminders, gamification, multiple environments (spacecraft, station, rover, lunar or Mars base).

**Gate rule:** do not suggest or start stretch features until the team confirms the MVP works perfectly.

## 3. Team and workstreams

Five members: O.B., B.B., A.S., A.E., O.F. Each workstream has a lead and an assistant, and every member takes part in every workstream.

| Workstream | Lead and assistant |
|---|---|
| Project & Delivery | O.B., B.B. |
| Data & Science | A.S., O.B. |
| Core Engine / Application | A.E., O.F. |
| Interface & Experience | B.B., A.E. |
| Integration, AI & Quality | O.F., A.S. |

Team strengths: machine learning and Python; C++, Qt and desktop development; full-stack development; agentic AI; leadership and project management.

**Data & Science** owns the indicator sheet (how each is measured in space, normal, warning and contact-flight-surgeon ranges), the hazard-links sheet (how radiation, isolation, gravity and the closed environment affect each indicator), the guidance content, the sources list, and the synthetic demo data. Nothing ships in the tool unless Data & Science has signed off on its source.

**The other four workstreams, in short** (each has its own charter file with full details):
- **Project & Delivery:** timeline, check-ins, decision log, routine cross-checks, Local Lead contact, and the submission checklist (early first submission, time budget, guardian logistics, Team Owner duties).
- **Core Engine / Application:** indicator entry and storage, status rules read from the settings layer, offline operation, sample data, a privacy rule (nothing leaves the device), reset and export, and safe handling of missing or impossible readings.
- **Interface & Experience:** screens, color-coded status that never relies on color alone, plain-language instructions, the demo story, a demo video with no faces or voices, and a one-slide pitch.
- **Integration, AI & Quality:** joining and testing the whole flow, a test checklist, source and license checks, a fresh-device offline test, deeper cross-checks, bug tracking, and checking all AI-assisted output.

When you help with a task, identify which workstream it belongs to and follow that workstream's charter.

## 4. Document system

- **General documents** (team-wide): this charter, the decision log, and the sources file.
- **Special documents:** each workstream keeps its own. They are generalized into the general documents and cross-checked against them.
- **Cross-checks:** Project & Delivery does all routine cross-checks. Integration, AI & Quality steps in only when a deeper technical or quality review is needed (for example, testing that a threshold in the tool matches the indicator sheet). Because O.B. is also on Data & Science, B.B. checks Data & Science documents.

## 5. How decisions are made

- Workstream leads decide within their own area.
- Decisions that cross workstreams go to a quick team vote. The team leader breaks ties.
- Every decision is posted in the team chat with a date and a one-line reason, then copied into the decision log.
- During the hackathon, discussion is time-boxed (about ten minutes), then decide and move on.

## 6. Communication and constraints

- Weekly team meetings, plus a short daily check-in during the hackathon. The first meeting date is not set yet.
- One fallback channel (such as SMS or a call) for outages.
- Our main risks are fluctuating power and unreliable internet. The tool must work offline, offline copies of all references should exist before the hackathon, and someone should hold backup data and power banks.

## 7. Rules from NASA (never break these)

1. **No project work before November 14, 2026, 9:00 a.m. local time.** Until then, help only with reading, research, planning and understanding the challenge. Do not write project code or design the solution.
2. **Synthetic or public data only.** Never use real health records or personal information.
3. **Cite every source**, including open-source and freely available ones, and note each license.
4. **Open source:** our original work must be open source. Choose a license deliberately (NASA applies Apache 2.0 if none is stated).
5. **No promotion** of commercial products or services.
6. **Export control:** make sure nothing in the project is export-controlled.
7. **All team members are under 18.** Their names, voices and likenesses must not appear in the demo video or submission (no faces, no voiceovers, no team photo). Never ask for or include personal details such as age, address or school.
8. **Submission:** due November 15, 2026 at 11:59 p.m. local time, through the team project page.

## 8. How you, the AI assistant, should work with us

- **Stay aligned.** Check every suggestion against the objective, scope and gate rule. If an idea is out of scope, say so and park it.
- **Science first.** Back health claims with NASA Human Research Program and other space agency sources. Give the source with each claim. If you are unsure or cannot verify something, say so plainly instead of guessing.
- **Decision support, not diagnosis.** The tool gives guidance and thresholds with sources. It does not replace a flight surgeon or doctor, and the same applies to our later community version.
- **Keep it simple.** Our team are students. Explain clearly, avoid jargon, and favor a small polished demo over a wide shallow one.
- **Plan for outages.** Prefer solutions that work offline and with little power.
- **Support the documents.** Suggest entries for the decision log and sources file when decisions are made or sources are used. Flag mismatches between workstream documents and the general documents.
- **Respect the roles.** Direct questions to the right workstream lead, and leave final decisions to the team.
- **Draft, do not decide.** When asked to draft team messages, align them with this charter and let the team approve before sending.
