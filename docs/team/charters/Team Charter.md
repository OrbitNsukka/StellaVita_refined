# OrbitNsukka Team Charter

**Event:** NASA Space Apps Challenge 2026, Nsukka Local Event (November 14-15, 2026)
**Our challenge:** Create Health Monitoring Software for Astronauts on Space Missions
**Team:** O.B., B.B., A.S., A.E., O.F.

This is our agreement on what we are building, who does what, and how we work together. If we are ever unsure, we come back here.

---

## 1. Our objective

We are building a science-grounded, offline-first health dashboard that helps astronauts assess their own health on long missions. Every indicator, threshold and piece of advice must be tied to a cited source.

- **Our emphasis:** the science comes first, then usability.
- **After the hackathon (not part of our submission):** a version for local and low-resource communities is a side project. We will keep thresholds and guidance in a separate settings layer so this stays possible, but we will not spend hackathon time on it.

## 2. Scope

**In scope (our minimum viable product, the MVP):**
- Manual entry of six indicators: heart rate, blood pressure, blood sugar, body temperature, sleep hours, and mood.
- Color-coded status for each indicator, readable at a glance.
- Cited, plain-language guidance: what each indicator means, how it is measured in space, what to do, and when to contact flight surgeons.
- Works without internet.
- Synthetic sample data for the demo.

**Stretch (only after the MVP is working perfectly):**
- Clickable human body figure, dynamic charts, reminders, gamification, and support for different environments (spacecraft, station, rover, lunar or Mars base).

**The gate rule:** nobody starts a stretch feature until the team agrees the MVP works perfectly.

## 3. Roles and workstreams

Each workstream has a lead and an assistant, and every member takes part in every workstream.

| Workstream | Lead and assistant |
|---|---|
| Project & Delivery | O.B., B.B. |
| Data & Science | A.S., O.B. |
| Core Engine / Application | A.E., O.F. |
| Interface & Experience | B.B., A.E. |
| Integration, AI & Quality | O.F., A.S. |

**Data & Science** owns:
- the indicator sheet (how each indicator is measured in space, plus its normal, warning and contact-flight-surgeon ranges),
- the hazard-links sheet (how radiation, isolation, gravity and the closed environment affect each indicator),
- the guidance content,
- the workstream sources list,
- the synthetic demo data.

Nothing goes into the tool unless Data & Science has signed off on its source.

**The other four workstreams, in short** (full details are in each workstream's own charter file):
- **Project & Delivery:** timeline, check-ins, decision log, routine cross-checks, Local Lead contact, and the submission checklist, including an early first submission, a time budget, guardian logistics and Team Owner duties.
- **Core Engine / Application:** indicator entry and storage, status rules read from the settings layer, offline operation, sample data, a privacy rule (nothing leaves the device), reset and export, and safe handling of missing or impossible readings.
- **Interface & Experience:** screens, color-coded status that never relies on color alone, plain-language instructions, the demo story, a demo video with no faces or voices, and a one-slide pitch.
- **Integration, AI & Quality:** joining and testing the whole flow, a test checklist, source and license checks, a fresh-device offline test, deeper cross-checks, bug tracking, and checking AI-assisted output.

## 4. Our documents

- **General documents** (for the whole team): this charter, the decision log, and the sources file.
- **Special documents:** each workstream keeps its own. They get generalized into the general documents and cross-checked against them.
- **Who cross-checks:** Project & Delivery does all routine cross-checks. Integration, AI & Quality steps in only when a deeper technical or quality review is needed, for example to test that a threshold in the tool matches the indicator sheet. Because O.B. is also on Data & Science, B.B. checks Data & Science documents.

## 5. How we make decisions

- Workstream leads decide within their own area.
- Decisions that cross workstreams go to a quick team vote. The team leader breaks ties.
- Every decision is posted in the team chat with a date and a one-line reason, then copied into the decision log.
- During the hackathon, we time-box discussion (about ten minutes), then decide and move on.

## 6. Communication and constraints

- A weekly team meeting, plus a short daily check-in during the hackathon. The first meeting date is not set yet.
- One fallback channel (such as SMS or a phone call) for when the internet or power fails.
- Our biggest risks are fluctuating power and unreliable internet. So the tool must work offline, we keep offline copies of all references before the hackathon, and we agree who holds backup data and power banks.

## 7. NASA rules we all follow

1. **No project work before November 14, 2026 at 9:00 a.m. local time.** Until then we only read, research, plan and learn the challenge.
2. **Synthetic or public data only.** Never real health records or personal information.
3. **Cite every source**, even open-source and freely available ones, and note each license.
4. **Open source:** our original work must be open source. We choose a license on purpose (NASA applies Apache 2.0 if we state none).
5. **No promotion** of commercial products or services.
6. **Export control:** we make sure nothing in the project is export-controlled.
7. **Under-18 rule:** every member must be registered by a parent or guardian and accompanied at the event. Our names, voices and likenesses must not appear in the demo video or submission, so no faces, no voiceovers and no team photo. Check with our Local Lead in Nsukka for any extra local requirements.
8. **Deadline:** submit through our team project page by **November 15, 2026 at 11:59 p.m.** local time.

## 8. How we work with our AI assistant

We use an AI assistant to help us research, draft and check our work. It follows the separate file "Team charter for the AI assistant.md". It supports us, but the team makes the decisions, and everything it gives us still needs a cited source and a team check.

---

*Agreed by OrbitNsukka. Update this charter only through a team decision recorded in the decision log.*
