# AI History Archive

## Current production boundary (2026-07-17)

Archive JSON is the production authority. `npm run generate` compiles `archive/storylines/*.json` and `archive/events/*` directly; milestone identities are owned by storyline refs, and the production compiler does not read Legacy event, catalog, or fusion metadata.

The official pages no longer support an Archive preview query switch. Explicit preview, native, parity, and review commands remain offline comparison tools and write their heavy JS/JSON/HTML working files under ignored `.tmp/archive-*` directories. Pages and Docker publish only `.tmp/static-site`.

Use `/archive-admin` to edit both event bundles and existing storylines, then validate and regenerate. `/admin` and `npm run generate:legacy` are retained only for read-only reference, rollback, comparison, and migration.

The archive is now the default generated-display authority. Every current display target is represented by an archive event or canonical event variant; the legacy-compatible generator is retained temporarily for comparison and rollback.

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
.tmp/archive-*/**
reports/archive-*.md
reports/archive-*.json
```

Heavy rebuildable review data is written under `.tmp/archive-*` and is not tracked. Retained Markdown reports summarize long-lived audit conclusions. After Archive source edits, validate and regenerate with:

```bash
npm run validate:archive
npm run build:archive
npm run generate
npm run review:archive
npm run diff:archive
```

## Current migration status

Current archive coverage is tracked in:

```text
reports/archive-migration-progress.md
reports/archive-build-diff.md
reports/archive-refactor-completion-audit.md
```

As of the latest audit:

```text
Archive event directories: 116
Catalog/storyline migration targets: 134
Archive overlay: 134 applied, 0 skipped, 0 errors
Unexpected presentation changes: 0
Duplicate preview target ids: 0
Generated ids missing archive preview: 0
```

The count difference is intentional: some canonical archive events have multiple storyline variants and therefore map to more than one generated display milestone.

## Canonical events and variants

The archive follows this rule:

```text
facts are canonical; presentation is variant-specific
```

A canonical event stores stable facts, claims, sources, and reusable assets. A storyline variant can adjust display title, summary, visual module, assets, quiz, commentary, analysis, layout, and emphasis for one storyline.

Variants should not copy or contradict canonical facts, core claims, or primary sources.

## Presentation safety during migration

Archive variants default to:

```json
"presentationMode": "preserve-legacy"
```

In this mode, archive overlay attaches archive metadata without changing existing user-visible presentation fields such as title, subtitle, description, images, sources, visual modules, commentary, analysis, or quizzes.

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

only when changing the generated presentation is intentional. `npm run diff:archive` treats unintentional presentation changes as failures.

## Offline Archive presentation comparison

For explicit local comparison, generate separate data under `.tmp/archive-preview/`:

```bash
npm run preview:archive-data
npm run diff:archive-preview
npm run generate:archive-native-preview
npm run diff:archive-native
```

These commands do not alter the data source selected by `index.html` or `dual-screen.html`. Use the generated files with dedicated local analysis tooling; `?archivePreview=1` is intentionally ignored by official pages.

## Storyline refs

Storyline event refs can be disabled:

```json
{
  "eventId": "2016-alphago",
  "variant": "deep-learning",
  "enabled": false
}
```

Disabled refs are skipped by archive preview and overlay. Use this for archive variants that exist for future narrative work but do not yet have a legacy/display target.

## Legacy source boundary

The default `npm run generate` path now reads Archive storylines and event bundles and writes both runtime milestone files. The former compatible path remains available as:

```bash
npm run generate:legacy
```

The Legacy management page at `/admin` is read-only after the cutover. Use `/archive-admin` to edit and validate Archive JSON. Legacy files remain in the repository for comparison, rollback, and unfinished tooling migration:

- `manage/events.js`
- `manage/ai100-extra-events.js`
- `manage/gaming-extra-events.js`
- `manage/catalog.js`
- `manage/quizzes.js`
- `manage/figure-avatars.js`
- `manage/event-fusions.js`
- `manage/event-fusion-assets.js`
- `resources/quote-candidates.js`
- `resources/research-candidates.js`
- `resources/videos/*.json`

Do not delete these files until the comparison period ends and remaining Archive compiler/Admin dependencies are removed.

## Archive-native generation

Archive-native generation can now emit the complete current frontend milestone presentation shape without using `milestones-data.js` as a scaffold:

```bash
npm run generate:archive
npm run generate:archive-native-preview
npm run diff:archive-native
npm run report:archive-native-fields
```

`generate:archive` writes `milestones-data.js` and `milestones-data-default.js`; the preview command writes the separate review artifact. The one-time migration command used to copy remaining legacy presentation enrichments into storyline variants is:

```bash
npm run migrate:archive-presentation
```

Variant-owned presentation fields include quote formatting, figure cards, video metadata, achievement auxiliary fields, commentary, analysis, and quizzes. Canonical facts remain in `event.json`; sources, claims, assets, and quizzes remain in their dedicated event files.

## Remaining work

The structural archive migration is complete for current display targets. Remaining work is content and source-of-truth hardening:

- Review batch-generated claims and `needs-source` entries.
- Improve primary/secondary source quality for AI100 events.
- Review asset rights and duplicate resource usage.
- Continue structured-form improvements for `/archive-admin` beyond its current event/storyline JSON editing workflow.
- Gradually retire retained Legacy source responsibilities after the rollback/comparison period; production compilation is already independent of `manage/event-fusions.js`.
