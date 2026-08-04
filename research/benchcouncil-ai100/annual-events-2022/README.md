# AI100 2022 parallel event workflow

This directory is the write boundary for parallel research sessions. Each event owns one JSON file and, when needed, one SVG source file:

```text
annual-events-2022/
├── ai100-annual-2022-2023-004-replknet.json
└── assets/
    └── ai100-annual-2022-2023-004-replknet.svg
```

## Assign work

List the 54 events whose resolved publication year is 2022:

```bash
npm run list:ai100-2022
```

Assign each event order to exactly one session. The first three events are already complete; the remaining events start with `unassigned`.

When several sessions share one checkout, do not run `git add`, `git commit`, full generation, or repository-wide formatting from worker sessions. The integration session owns the Git index and shared generated files.

## Start one event

Create an isolated research JSON and SVG source using the official row and current Archive bundle:

```bash
npm run prepare:ai100-2022-event -- --event 004 --dry-run
npm run prepare:ai100-2022-event -- --event 004
```

The selector may be the official order, full event ID, exact work name, or slug. Use `--dry-run` to inspect the paths before claiming an event. The command creates the research file exclusively and refuses to overwrite an existing assignment.

The worker session owns only:

- `research/benchcouncil-ai100/annual-events-2022/<event-id>.json`
- `research/benchcouncil-ai100/annual-events-2022/assets/<event-id>.svg`
- `resources/images/external/ai100-2022-<slug>/`
- `resources/images/benchcouncil-ai100-annual/annual-<order>-<slug>_record.svg`
- `archive/events/<event-id>/`

The worker session must not edit:

- `research/benchcouncil-ai100/annual-event-research-2022-2026-08-03.json`
- `research/benchcouncil-ai100/annual-portrait-research-2026-08-03.json`
- `scripts/sync-benchcouncil-ai100-annual.js`
- `archive/storylines/bench-council-ai100-2022-2023.json`
- `milestones-data.js` or `milestones-data-default.js`
- shared tests solely to encode one event's content

## Complete the research package

Preserve the exact BenchCouncil work name, official order, contributor prefix, institution and country. Confirm every listed contributor against the primary paper and reliable identity sources. People without a selected portrait remain in `people` and in the generated event figures.

Every person needs:

- a localized name and role;
- `verification.status: "confirmed"` with source IDs and notes;
- a completed `portraitSearch` result, including candidates that were not selected.

Select at most one portrait using the event-local field below. This avoids edits to the shared portrait research file:

```json
{
    "selectedPortrait": {
        "personName": "Exact BenchCouncil contributor name",
        "image": {
            "path": "resources/images/external/ai100-2022-example/person.jpg",
            "sourceName": { "en": "Researcher homepage", "zh": "研究者主页" },
            "sourceUrl": "https://example.org/profile",
            "imageUrl": "https://example.org/profile.jpg",
            "reliability": "primary-identity-source",
            "usageStatus": "external-reference",
            "license": {
                "en": "The source does not state redistribution rights; retain attribution.",
                "zh": "来源未声明再分发许可；必须保留署名。"
            },
            "notes": {
                "en": "Exact identity and event-publication match.",
                "zh": "人物身份与事件论文精确匹配。"
            },
            "identityChecks": ["exact-contributor-name", "event-publication-listed"]
        }
    }
}
```

Keep source evidence in `sourceOverrides` and `additionalSources`. A complete event should normally include BenchCouncil, the primary paper or official record, full paper or alternate access, and the identity/image sources actually used.

Edit the event-local SVG source rather than adding a new renderer function to the central syncer. It is copied to the production explainer path during targeted or full synchronization.

Set `status` to `complete` only after the description, people, portrait search, sources, claims, three commentary sections, source card, explainer, achievement demo and four-option quiz are finished.

## Preview and validate one event

Targeted synchronization writes only the selected Archive event directory and production explainer. It does not write the shared storyline or runtime data:

```bash
npm run sync:ai100-annual -- --event 004
npm run validate:ai100-2022-event -- --event 004
```

This is the safe worker-session checkpoint. Do not run a full `npm run sync:ai100-annual` from a worker session.

## Integrate all sessions

After worker sessions finish, one integration session runs:

```bash
npm run list:ai100-2022
npm run sync:ai100-annual
npm run validate:archive
npm run audit:event-figure-rules
npm run audit:ai100-annual
npm run generate
npm run validate:ai100-context
npm run lint
npm test
npm run format:check
npm run validate:startup
```

Full synchronization refuses any event-local research file whose status is not `complete`; finish or explicitly remove an abandoned draft before integration. The integration session also reviews the final Git diff, resolves duplicate event assignments, checks that only 2022 event content changed, and performs the commit and push.
