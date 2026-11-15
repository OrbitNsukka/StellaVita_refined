# Standing rules for this repository

AI disclosure (D-44): this file was written by an AI assistant (Claude, Anthropic) at the team leader's direction.

This is the refined build of team OrbitNsukka's entry for the NASA Space Apps Challenge 2026 (D-58, D-59). Build from `docs/REFINED_BUILD_BRIEF.md`, which sits on top of `docs/CORE_ENGINE_BRIEF.md` (D-53). Follow the order of work in section 6 of the refined brief.

## Rules that are never broken

1. **Never edit the fixed inputs:** everything in `app/data/` (including `Hazard_Links.json`, D-57), everything in `reference/`, and `tests/expected_colours.csv` with its `.meta.json`. If you find a problem in them, write it in `docs/ISSUES.md` and keep going. A threshold or rating changes only by a team decision and a new file version.
2. **Thresholds and ratings are never typed into code.** Every band, limit, rule parameter, reason, source ID and hazard rating is read from the files in `app/data/`. Tests may quote numbers; the app may not.
3. **No personal information.** No member names, initials-to-name mappings, e-mail addresses, photos or voices, anywhere. All team members are under 18. The team is "OrbitNsukka".
4. **Synthetic data only.** No real health records. Nothing leaves the device: no analytics, no outside fonts or scripts, no network calls after the first load.
5. **No NASA branding.** No NASA logos, flags, mission patches or mission identifiers in any file, image or icon. The words "NASA Space Apps Challenge" as plain text are fine.
6. **AI disclosure (D-56).** Code files don't carry a header comment. The disclosure must appear in `README.md`, `NOTICE`, `docs/AI_USE.md`, every document you create (an "AI disclosure" line), the `index.html` metadata and the About screen.
7. **Guidance, not diagnosis.** Screen text about health is copied word for word from `app/data/Guidance_Content.md`, `app/data/Limits_Statement.md`, `app/data/Indicator_Thresholds.json` and `app/data/Hazard_Links.json`. Don't write new health wording.
8. **No stretch features:** no body figure, charts, reminders, gamification or Qt app. The MVP is the six indicators plus the hazard panel (D-57).
9. **Libraries only when necessary.** Tailwind CSS at build time only, compiled and committed (L-01, D-58). No runtime library, no CDN. Express.js, MongoDB, LangGraph, LangChain and FastAPI are withdrawn (D-55). Record any library's name, version and licence in `docs/TECH_NOTES.md` and `NOTICE`.
10. **Licence:** Apache 2.0. Don't add code under an incompatible licence.

## Commits

- Commit and push after each step of section 6 of the refined brief, with a clear message.
- Commit identity: name `OrbitNsukka`, e-mail `322548554+Pi-Infinity-Space@users.noreply.github.com`. Set it with `git config user.name` and `git config user.email` before the first commit. Never commit under a personal name or e-mail.
- End each commit message with the AI co-author line your session is configured to add.

## Checks

- `python reference/check.py` must pass at all times.
- `npm test` (`node --test`) must pass before you report a step as done.
- The engine's status for all 120 demo rows and all six indicators must match `tests/expected_colours.csv` exactly.

## When you finish

Write `docs/BUILD_REPORT.md`: what passes, what doesn't, every issue found, and anything you couldn't verify. Say plainly what wasn't tested.
