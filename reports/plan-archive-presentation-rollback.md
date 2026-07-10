# Plan: rollback unintended archive presentation changes and guard future migrations

## Goal
Keep archive migration metadata useful, but make migrated archive events presentation-compatible with existing legacy output by default. Archive overlay must not change user-visible title, subtitle, description, images, sources, visual modules, commentary, or quizzes unless a variant explicitly opts into that change.

## Current findings
- The current overlay path in `scripts/archive-compiler.js` replaces legacy fields with archive preview fields:
  - title/subtitle/description
  - resources.images
  - achievement.sources/sourceIds
  - selected commentary/analysis/quizzes/visual
- Current archive review deltas still include:
  - `2017-transformer / bench-council-ai100`: description and images differ.
  - `2016-alphago / bench-council-ai100`: description differs.
  - `2012-alexnet / deep-learning`: title, description, images, sources differ.
  - `2017-transformer / deep-learning`: title, description, images, sources differ.
  - `2016-alphago / gaming-ai`: title and description differ.
  - Many migrated AI100 events add archive claims; this is metadata, but should not be treated as a presentation regression.

## Implementation steps
1. Add an explicit variant presentation policy.
   - Extend `archive/schemas/variant.schema.json` with `presentationMode` enum:
     - `preserve-legacy` — default for migrated events with a legacy target.
     - `archive` — explicit opt-in when a branch intentionally wants archive presentation to replace legacy presentation.
   - No existing variant needs `archive` right now; preserving legacy is the safe migration default.

2. Change archive overlay to preserve legacy presentation by default.
   - In `scripts/archive-compiler.js`, change `applyArchivePreviewToMilestone` so `preserve-legacy` mode does not overwrite:
     - `title`, `subtitle`, `description`
     - `resources.images`
     - `achievement.sources`
     - `achievement.visual`
     - `commentarySections`, `analysis`, `quizzes`
   - Still attach archive provenance and non-destructive metadata:
     - `archive`, `archiveEventId`, `archiveVariantId`, `sourceKind`
     - `resources.archiveAssetIds`
     - `achievement.archiveSources`, `achievement.archiveSourceIds`
     - `achievement.claims`, `achievement.claimIds`, `achievement.emphasis`
   - Keep current replace behavior only for `presentationMode: "archive"`.

3. Make `archive-review.html` compare the effective overlay preview, not only the raw archive-only preview.
   - In `applyArchiveOverlays`, build an effective archive preview from `legacySnapshot + archive metadata` before applying.
   - Store that effective preview in `reports/archive-review-snapshot.json` as `archivePreview` so the three columns reflect what migration will actually generate.
   - Optionally keep the raw archive-only preview under `rawArchivePreview` for debugging.

4. Add automated presentation-delta detection.
   - Add comparison helpers in `scripts/archive-compiler.js` or a new small script, comparing legacy vs final for user-visible fields:
     - title, subtitle, description
     - image list
     - source labels/URLs/counts
     - visual, commentary section count/labels, quiz count/questions
   - Update `scripts/diff-archive-build.js` to report `same`, `changed intentionally`, or `changed unexpectedly` based on `presentationMode`.
   - Exit non-zero on unexpected presentation changes so future archive migration cannot silently alter display output.

5. Regenerate and verify.
   - Run:
     - `npm run validate:archive`
     - `npm run build:archive`
     - `npm run generate`
     - `npm run review:archive`
     - `npm run diff:archive`
   - Confirm current unintended deltas disappear in `archive-review.html` and `reports/archive-build-diff.md`.
   - Then run the broader regression gate:
     - `npm test`
     - `npm run lint`
     - `npm run validate:startup`

## Expected result
- Existing migrated archive events no longer change the generated exhibition presentation unless explicitly marked intentional.
- Archive metadata/claims/provenance remain attached for the new archive system.
- Future archive migrations fail the diff check if they accidentally shrink images/sources or change title/description.
