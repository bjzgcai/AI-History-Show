# AI History Archive

## Current production boundary

Archive JSON is the production authority. `npm run generate` compiles `archive/storylines/*.json` and `archive/events/*` directly; milestone identities are owned by storyline refs, and the production compiler does not read Legacy event, catalog, or fusion metadata.

The Legacy editor, generator, data modules, parity pages, and migration/comparison scripts have been retired. The official pages load only the generated production runtime data. Pages and Docker publish only `.tmp/static-site`.

The current entity graph, compilation sequence, failure safeguards, and deployment flow are documented in [`docs/archive-data-flow.md`](../docs/archive-data-flow.md).

Use `/admin` to edit both event bundles and existing storylines, then validate and regenerate. Historical Legacy implementations are available through Git history only.

## Directory roles

```text
archive/   = metadata, provenance, relationships, review state
resources/ = actual files and browser-loadable media
```

`archive/` records what a resource means, where it comes from, how it can be used, and which event or storyline uses it. `resources/` stores the actual image, SVG, PDF, GIF, video, thumbnail, or other static file.

Frontend pages continue loading generated display data and `resources/...` paths. They should not directly depend on the source `archive/` layout.

## Structure

```text
archive/
├── events/
│   └── {eventId}/
│       ├── event.json
│       ├── claims.json
│       ├── sources.json
│       ├── assets.json
│       ├── quizzes.json
│       └── variants/
│           └── {storylineId}.json
├── schemas/
└── storylines/
```

Planned future source directories include `archive/figures/` and `archive/taxonomies/`.

## Generated files

Do not edit generated display data by hand:

```text
milestones-data.js
milestones-data-default.js
.tmp/**
```

Rebuildable reports and review data are written under `.tmp/`. They are not tracked. After Archive source edits, validate and regenerate with:

```bash
npm run validate:archive
npm run generate
npm run quality
```

## Current migration status

The structural migration is complete for all current display targets. Run `npm run validate:archive`, `npm run generate`, and `npm test` for the current state. Historical migration reports remain available through Git history rather than as tracked generated files.

## Canonical events and variants

The archive follows this rule:

```text
facts are canonical; presentation is variant-specific
```

A canonical event stores stable facts, claims, sources, and reusable assets. A storyline variant can adjust display title, summary, visual module, assets, quiz, commentary, analysis, layout, and emphasis for one storyline.

Variants should not copy or contradict canonical facts, core claims, or primary sources.

## Presentation modes

Archive variants default to:

```json
"presentationMode": "preserve-legacy"
```

The historical `preserve-legacy` name remains in migrated Archive records for compatibility with the current compiler. It does not read any external Legacy data; all emitted presentation fields still come from the Archive event and variant.

Archive metadata is attached under fields such as:

```text
archive
archiveEventId
archiveVariantId
archivePresentationMode
resources.archiveAssetIds
achievement.archiveSources
achievement.archiveSourceIds
achievement.archiveClaims
achievement.archiveClaimIds
achievement.archiveEmphasis
```

A variant may set:

```json
"presentationMode": "archive"
```

only when changing the generated presentation is intentional. Validate and regenerate after any mode change.

## Storyline refs

Storyline event refs can be disabled:

```json
{
  "eventId": "2016-alphago",
  "variant": "deep-learning",
  "enabled": false
}
```

Disabled refs are skipped by the compiler. Use this for archive variants that exist for future narrative work but should not appear in the current display.

## Retired Legacy boundary

The default `npm run generate` path reads Archive storylines and event bundles and writes both runtime milestone files. The following former paths are intentionally absent:

- `/archive-admin` and Legacy management APIs;
- Legacy `manage/*.js` content data and generator;
- parity/review pages and comparison servers;
- one-time Archive migration and Legacy diff scripts.

Use Git history for forensic reference. Do not restore these paths as an alternate production content authority.

## Archive-native generation

Archive-native generation emits the complete current frontend milestone presentation shape:

```bash
npm run generate:archive
```

`generate:archive` writes `milestones-data.js` and `milestones-data-default.js`.

Variant-owned presentation fields include quote formatting, figure cards, video metadata, achievement auxiliary fields, commentary, analysis, and quizzes. Canonical facts remain in `event.json`; sources, claims, assets, and quizzes remain in their dedicated event files.

## Remaining work

The structural archive migration is complete for current display targets. Remaining work is content and source-of-truth hardening:

- Review batch-generated claims and `needs-source` entries.
- Improve primary/secondary source quality for AI100 events.
- Review asset rights and duplicate resource usage.
- Continue structured-form improvements for `/admin` beyond its current event/storyline JSON editing workflow.
- Continue removing historical migration wording from content records when those records receive substantive editorial review.
