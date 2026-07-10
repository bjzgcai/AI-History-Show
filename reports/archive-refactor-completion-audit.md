# Archive Architecture Refactor Completion Audit

Generated: 2026-07-09

This report checks the current repository against `docs/archive-architecture-refactor.md`.

## Validation commands run

```bash
npm run validate:archive
npm run build:archive
npm run generate
npm run review:archive
npm run diff:archive
npm test
npm run lint
npm run validate:startup
```

All commands passed.

Key outputs:

- `validate:archive`: 0 errors, 0 warnings, 116 archive events, 3 storylines.
- `build:archive`: 134 milestone previews, 0 errors.
- `generate`: 134 legacy/display events, archive overlay applied to 134, skipped 0, errors 0.
- `diff:archive`: 134 same presentation rows, 0 intentional changes, 0 unexpected changes.
- `npm test`: layout-router and swipe-navigation checks passed.
- `npm run lint`: passed.
- `validate:startup`: static presentation and admin startup passed.

## Overall status

The refactor has reached a functional migration milestone:

- The lightweight in-repo archive model exists.
- Current display targets are covered by archive event directories or canonical event variants.
- Archive validation, build preview, review page, diff gate, asset report, and admin archive editor exist.
- Generated frontend data remains compatible and presentation-equivalent to legacy output.

However, the project has not fully reached the final end-state described in Step 12. Legacy data remains active as the compatibility baseline and fallback, many migrated claims/sources are draft quality, and the archive admin is still a JSON editor rather than a complete structured entity editor.

## Goal checklist

### Overall goals

| Goal | Status | Notes |
| --- | --- | --- |
| Separate archive facts from display narrative | Mostly complete | `archive/events/*` separates event, claims, sources, assets, quizzes, variants. Overlay currently preserves legacy presentation by default. |
| Core entities: event, claim, source, asset, storyline, variant | Complete | Schemas and event directories exist for these entities. |
| Facts and resources traceable to sources/usages | Structurally complete, content quality partial | 259 claims, 382 sources, 285 assets validate structurally. Many batch claims are still `needs-source` and need human refinement. |
| Keep static frontend / Node generation / Git deployment model | Complete | `index.html`, `dual-screen.html`, generated `milestones-data*.js`, startup validation all still work. |
| Keep path open for future DB/CMS | Mostly complete | File-based model is explicit and normalized enough for future migration. |

### Acceptance criteria from docs

| Area | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| Architecture | `archive/` directory with events, storylines, schemas | Complete | `archive/events`, `archive/storylines`, `archive/schemas` exist. |
| Architecture | At least 3 representative events archived | Complete | More than 3; current validation reports 116 archive events. |
| Architecture | `archive/` and `resources/` roles clear | Complete | Documented in `archive/README.md` and implemented via asset paths. |
| Architecture | Event facts, sources, assets, variants no longer one large object | Complete structurally | Event bundles split into JSON files. Legacy still remains during transition. |
| Generation | Can generate frontend-compatible data | Complete | `npm run generate` passes and writes compatible `milestones-data*.js`. |
| Generation | `index.html` / `dual-screen.html` not rewritten | Complete | Startup validation passes; frontend still consumes generated data. |
| Generation | Fallback `milestones-data-default.js` not broken | Complete | `npm run generate` updates both outputs. |
| Validation | `npm run validate:archive` exists | Complete | Passed. |
| Validation | Missing resource paths checked | Complete | Validator checks asset path existence. |
| Validation | Asset caption/source/rights/usage checked | Complete | Validator checks required asset metadata. |
| Validation | Claim missing source checked | Complete | Validator checks claim sourceIds. |
| Validation | Storyline event/variant references checked | Complete | Validator checks storyline refs. |
| Validation | Validation report generated | Complete | `reports/archive-validation.md`. |
| Compatibility | `npm test` passes | Complete | Passed. |
| Compatibility | `npm run lint` passes | Complete | Passed. |
| Compatibility | `npm run validate:startup` passes | Complete | Passed. |
| Compatibility | Static/admin startup not broken | Complete | Startup validation passed. |
| Compatibility | Docker presentation path not broken | Not re-verified in this audit | Docker was not run in the latest validation pass. Existing deployment scripts remain unchanged except generated data integration. |

## Step-by-step status

### Step 0: Baseline

Status: Complete.

Evidence:

- `reports/archive-refactor-step0-baseline.md` exists.
- Current final validation also passed generate/test/lint/startup.

### Step 1: Initial archive schemas

Status: Complete.

Implemented schemas include:

- `shared.schema.json`
- `event.schema.json`
- `claim.schema.json`
- `source.schema.json`
- `asset.schema.json`
- `quiz.schema.json`
- `storyline.schema.json`
- `variant.schema.json`
- `figure.schema.json`

`variant.schema.json` also now includes `presentationMode` to prevent accidental display changes.

### Step 2: Archive skeleton and storylines

Status: Complete.

Implemented:

- `archive/events/`
- `archive/storylines/`
- `archive/schemas/`
- `archive/README.md`
- storylines for `deep-learning`, `bench-council-ai100`, and `gaming-ai`.

`archive/figures` and `archive/taxonomies` are planned directories but not a major functional blocker in the current implementation.

### Step 3: Three representative events

Status: Complete and exceeded.

Representative events exist:

- `2012-alexnet`
- `2017-transformer`
- `2016-alphago`

The archive now contains 116 event directories and 135 variants.

### Step 4: `validate:archive`

Status: Complete.

Latest result:

```text
Archive validation: 0 error(s), 0 warning(s), 116 event(s), 3 storyline(s).
```

### Step 5: Archive compiler preview

Status: Complete.

Implemented:

- `scripts/archive-compiler.js`
- `scripts/build-archive.js`
- `npm run build:archive`
- `reports/archive-build-preview.json`
- `reports/archive-build-preview.md`

Latest result:

```text
Archive build: 134 milestone preview(s), 0 error(s).
```

### Step 6: Compatible generation path

Status: Complete for compatibility mode.

Implemented:

- `manage/generate.js` applies archive overlays.
- `milestones-data.js` and `milestones-data-default.js` remain generated frontend-compatible outputs.
- Archive overlay applies to all 134 current display targets.

Important design decision:

- Overlay defaults to `presentationMode: preserve-legacy`.
- Archive metadata is attached without changing legacy display fields.

Latest result:

```text
Archive overlay：应用 134 个，跳过 0 个，错误 0 个
```

### Step 7: Diff review and regression validation

Status: Complete.

Implemented:

- `scripts/diff-archive-build.js`
- `npm run diff:archive`
- `scripts/generate-archive-review.js`
- `npm run review:archive`
- `archive-review.html`
- `reports/archive-review-snapshot.json`

Latest diff result:

```text
Same presentation rows: 134
Intentional presentation changes: 0
Unexpected presentation changes: 0
```

This directly addresses the earlier problem where archive migration changed title, description, images, or sources unexpectedly.

### Step 8: Batch migrate AI100

Status: Structurally complete; content-quality review remains.

Implemented:

- Initial `scripts/migrate-ai100-batch.js`.
- Generic `scripts/migrate-archive-events.js`.
- All current AI100 catalog targets are now represented by archive event directories or canonical event variants.

Limitations:

- The docs originally recommend 5-10 event batches and separate coverage reports like `ai100-source-coverage.md`, `ai100-asset-coverage.md`, etc. The current migration was completed structurally at scale, but those AI100-specific coverage reports were not created.
- Many generated claims/sources are draft-level and need human review.

### Step 9: Upgrade event-fusions toward variant mechanism

Status: Partially complete.

Completed:

- `reports/archive-fusion-variant-map.md` and JSON map exist.
- Fused IDs are represented through canonical archive events and variants.
- The archive now supports canonical event + multiple variants.

Not fully complete:

- `manage/event-fusions.js` is still active in the legacy generation path.
- The fusion logic has not been fully retired or replaced by archive-native variant generation.

### Step 10: Asset governance and isolated file report

Status: Complete for reporting; cleanup/review remains.

Implemented:

- `scripts/report-assets-usage.js`
- `npm run report:assets`
- `reports/assets-usage.md`
- `reports/assets-usage.json`

The report exists and supports asset governance. It does not delete resources, as intended.

### Step 11: Archive entity editor in admin

Status: Initial version complete; full structured editor partial.

Implemented:

- `manage/archive-admin.html`
- `/archive-admin`
- API routes in `manage/server.js` for listing, reading, writing archive files, and running archive validation.

Limitations:

- Current editor is primarily a JSON file editor.
- It is not yet a fully structured tabbed editor for Event / Claims / Sources / Assets / Quizzes / Variants.
- Validation can be triggered, but deeper UX integration remains future work.

### Step 12: Legacy source closure

Status: Not complete.

Current state:

- Archive covers all current display targets structurally.
- Legacy files still remain active as compatibility baseline and generated display source.
- `manage/event-fusions.js`, `manage/events.js`, and other legacy data files still feed the generation process.

This is expected for the current transition stage, but it means the final end-state is not done yet.

## Current completion judgment

### Completed

- File-based archive architecture established.
- Core archive schemas created.
- Archive storylines and event bundles created.
- All current display targets covered by archive overlay.
- Archive validation implemented and passing.
- Archive compiler/build preview implemented and passing.
- Compatible generation path implemented and passing.
- Review page and diff gate implemented.
- Unintended presentation changes prevented by default.
- Asset usage report implemented.
- Initial archive admin editor implemented.
- Full regression validation passed.

### Partially complete

- AI100 migration: structurally complete, but sources/claims need human-quality review.
- Event-fusions upgrade: mapped and represented in archive, but legacy fusion code still active.
- Archive admin: useful JSON editor, not yet a full structured entity editor.
- Asset governance: report exists, but cleanup/review has not been performed.
- Documentation: architecture docs exist, but should be updated to reflect `presentationMode`, full 134-target overlay coverage, and remaining Step 12 transition state.

### Not complete

- Full legacy source closure.
- Archive becoming the sole primary data source.
- Retiring or deprecating migrated legacy source sections.
- AI100-specific quality coverage reports from the original Step 8 recommendation.
- Docker build validation in the latest audit pass.

## Recommended next actions

1. Update `docs/archive-architecture-refactor.md` with current reality:
   - `presentationMode: preserve-legacy` default.
   - 134/134 display target overlay coverage.
   - Step 8 structural migration completed, but content review remains.
   - Step 9/11/12 partial status.

2. Add an archive completion checklist/report command.
   - Current `reports/archive-migration-progress.md` is useful.
   - It could be wired into `package.json` as `report:archive-migration`.

3. Start content-quality refinement passes:
   - AI100 primary source quality.
   - Claims with `needs-source`.
   - Asset rights statuses.
   - Translation quality.

4. Plan Step 12 separately.
   - Decide when archive becomes authoritative.
   - Decide whether migrated sections of `manage/events.js` become read-only/deprecated.
   - Retire or reduce `manage/event-fusions.js` only after archive-native generation can replace it safely.

5. Optionally run Docker validation before declaring deployment-level completion:

```bash
npm run validate:deployment
# or
# docker build -t ai-history-show .
```

## Conclusion

The refactor has completed the main functional architecture and migration milestone. The current app can validate, build, review, and generate all 134 current display targets through archive overlay while preserving legacy presentation exactly.

The remaining work is not basic architecture enablement; it is source-of-truth closure and content-quality hardening: improving migrated claims/sources/assets, making the admin editor more structured, and gradually reducing reliance on legacy generation files.
