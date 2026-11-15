# OrbitNsukka Project Index (start here)

**Set up:** Nov 14, 2026, by the AI assistant at the Project & Delivery lead's request. **Owner of this index:** Project & Delivery.

This folder is the one home for the project. If a file is not listed here, it is not official. Every person and every AI assistant reads and writes the official files below, not copies elsewhere.

---

## 1. Official files

| Purpose | Official file | Owner | Status |
|---|---|---|---|
| Team agreement | `00 General/Team Charter.md` | Whole team | Agreed (D-14, D-17) |
| AI assistant rules | `00 General/Team charter for the AI assistant.md` | Whole team | Agreed |
| Decisions | `00 General/Decision Log.md` | Project & Delivery | Current to D-25; D-26 proposed |
| How AI handles decisions | `00 General/Decision Log Guide for the AI Assistant.md` | Project & Delivery | Agreed |
| Sources and claim map | `00 General/Sources.md` | Data & Science; B.B. cross-checks | 179 rows; the 12 threshold sources Verified (D-41), none Cross-checked; pack sources merged (D-37) |
| How AI handles sources | `00 General/Sources Guide for the AI Assistant.md` | Data & Science | Agreed |
| Background record | `00 General/Team Notes and Discussions.md` | Project & Delivery | Reference |
| What we build | `01 Project and Delivery/Research Brief - Project and Delivery.md` | Project & Delivery | Voted (D-19 to D-22) |
| Source checkpoints and build list | `01 Project and Delivery/Sources Checkpoints and Build Resources.md` | Project & Delivery | Adopted (D-24) |
| Two-day timeline | `01 Project and Delivery/Hackathon Time Budget (Draft).md` | Project & Delivery | Proposed (D-26) |
| Review of the Data & Science pack | `01 Project and Delivery/Data and Science Pack Review.md` | Project & Delivery | Feedback for A.S. |
| Transition message (D&S to Core Engine) | `01 Project and Delivery/Transition Message - Data and Science to Core Engine (Nov 14).md` | Project & Delivery | Draft, 4 parts for Discord |
| Core Engine brief | `03 Core Engine and Application/Core Engine Brief.md` | Core Engine | Approved (D-53) |
| GitHub repository contents | `06 Repository (GitHub clone)/` | Core Engine | Staged and checked; not yet pushed. Private while building, public after (D-54). The cloud build works from the copy in GitHub |
| Core Engine plan | `03 Core Engine and Application/Core Engine Plan (Draft).md` | Core Engine | Questions answered (D-43 to D-52); the Core Engine brief is next |
| Repository README | `03 Core Engine and Application/README (Draft).md` | Core Engine | Draft; working name "OrbitNsukka Health Monitor" until the team picks one |
| Hazard links (method) | `02 Data and Science/Hazard-Links Sheet (Draft).md` | Data & Science | Method adopted (D-25); links Logged |
| Indicator sheet, thresholds, guidance, limits, demo data | `02 Data and Science/Pack v0.4/` | Data & Science | v0.4, signed handoff file (D-42) plus D-48 to D-51; checker passes; AI-labelled (D-44) |
| Team opinions: answers and tally | `02 Data and Science/Team Opinions - Answers and Tally (Nov 14).md` | Data & Science | Three members answered Nov 14; logged as D-27 to D-38 |
| Original research notes | `02 Data and Science/Human Spaceflight Hazards Research Notes.docx` | Data & Science | Input only; radiation layer parked (D-21) |
| Offline copies of sources | `Sources offline/` (named by source ID) | Data & Science | 17 files saved; see Sources.md |
| Workstream charters | One in each numbered folder | Each workstream lead | Agreed |

**Single numeric truth.** Signed by the team leader (D-42), `02 Data and Science/Pack v0.4/Indicator_Thresholds.json` is the only place threshold numbers live. Every other document, the engine and the demo script read or quote it. Until then, the decision log and the claim map in Sources.md win.

---

## 2. Folders

| Folder | What goes in it |
|---|---|
| `00 General` | Team-wide documents (charter, decision log, sources) |
| `01 Project and Delivery` | Timeline, checkpoints, briefs, reviews, submission checklist |
| `02 Data and Science` | Indicator sheet, thresholds, hazard links, guidance, demo data |
| `03 Core Engine and Application` | Core Engine plan and brief |
| `06 Repository (GitHub clone)` | What goes to GitHub: the app code, the threshold file, demo data and public documents. No names, no copyrighted PDFs |
| `04 Interface and Experience` | Screens, demo script, pitch slide |
| `05 Integration, AI and Quality` | Test checklist, expected-colour file, bug list, check log |
| `Sources offline` | One saved copy per source, named "S-xx short name". Keep private: several are copyrighted |
| `Archive (superseded)` | Old versions and copies. Never edit; never cite |
| `orbit-bot` | The Discord team assistant's code (not part of the submission) |

---

## 3. Rules that keep the handoffs from breaking

1. **One home.** Work is saved here, in its workstream folder. Not in Temp, Downloads or a personal drive.
2. **One owner per file.** Others suggest changes; the owner edits. AI output stays marked "Draft" until its owner signs.
3. **One copy of every rule.** Threshold numbers live only in the threshold file once signed. Code reads them; it never retypes them.
4. **Source IDs only.** Everything cites S-xx from Sources.md. Other numbering (such as the pack's S1 to S15) is mapped before use.
5. **Decisions first.** Anything that changes a threshold, a scope item or a rule needs a decision-log entry before the files change.
6. **Freeze at each handoff.** When a workstream hands over, the file it hands over gets a version number. Later changes bump the version, and Integration reruns its checks.

**Handoff contracts** (agreed at each checkpoint):

| From | To | What is handed over | When |
|---|---|---|---|
| Data & Science | Core Engine | Signed threshold file: no gaps, single-reading bands kept apart from pattern rules, S-IDs on every band | CP-S2 |
| Data & Science | Interface | Guidance text and limits statement, keyed by indicator ID | CP-S3 |
| Core Engine | Interface | One output shape per reading: indicator, value, status, reason, source IDs | T-05 |
| All | Integration | Synthetic data plus an expected-colour file generated from the threshold file | Before T-09 |

---

## 4. Copies outside this folder (not official)

| Location | What it is | What to do |
|---|---|---|
| E: drive, "CHosen challenge/Sources offline" | Original offline downloads | Keep as the D-11 backup. Delete the S-131 file there (licence) |
| Windows Temp folder | The Data & Science pack as first saved | Ignore; the official copy is in `02 Data and Science/Pack v0.4` (v0.1 to v0.3 are archived) |
| `orbit-bot/team-docs` | The bot's bundled copies of the charters, log, index, brief, time budget and hazard-links sheet | Refreshed Nov 14 (decision log to D-38). Re-copy after each new decision. The running bot only sees them after a redeploy, and a GitHub knowledge repo, if set, overrides them |
| `Archive (superseded)/CHosen challenge (old copies and zips)` | Earlier copies, zips and the Nov 13 project report | Reference only |

---

## 5. Open items blocking the next handoff

1. ~~Data & Science reconciles the pack with D-19 to D-25~~ Done Nov 14: Pack v0.4 follows D-19 to D-51.
2. Save offline copies of S-140 and S-167 and open their full text (both Verified on approval only, D-41).
3. ~~Data & Science verifies the threshold sources~~ Done (D-41). B.B. cross-checks them (CP-S2). The threshold file was signed at v0.3 (D-42) and is now v0.4 (D-48, D-49).
4. Confirm or adjust D-26, and settle the licence, the Team Owner and the outage plan at the 6:00 p.m. check-in.
5. ~~Core Engine answers CE-1 to CE-11~~ Done (D-43 to D-52). Brief approved (D-53). Next: push the staged repository and start the cloud build (D-52, D-54).
