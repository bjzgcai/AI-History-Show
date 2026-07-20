# Plan: continue archive migration for remaining events

## Current scope
- Legacy events in `manage/events.js`: 128.
- Existing archive event directories: 13.
- AI100 storyline events: 100 total, 11 already have archive event directories, 89 remaining.
- Core timeline events: 21 total, 2 already archived, 19 remaining.
- Gaming branch refs: 13 total, 1 already archived, 12 remaining.

## Safety rules already in place
- Archive overlay now defaults to `presentationMode: preserve-legacy`.
- Archive metadata can be added without changing generated presentation.
- `npm run diff:archive` fails on unexpected Legacy → Final presentation deltas.
- Storyline refs with `enabled: false` are skipped by archive preview/overlay.

## Migration approach
1. Extend the batch migration tooling so it can migrate any legacy event safely, not just the initial AI100 default list.
   - Keep existing `scripts/migrate-ai100-batch.js` behavior for compatibility.
   - Add or refactor into a generic batch migrator that can:
     - migrate selected keys from `manage/events.js`,
     - infer whether a key belongs to AI100, core, or gaming,
     - create archive event directory files,
     - add only enabled storyline refs that have a legacy milestone target,
     - skip existing archive events unless explicitly requested.

2. Migrate the remaining AI100 events in batches.
   - AI100 is the largest remaining set and most aligned with the existing batch migrator.
   - For each newly migrated AI100 event:
     - create `event.json`, `claims.json`, `sources.json`, `assets.json`, `quizzes.json`, and `variants/bench-council-ai100.json`,
     - set/omit `presentationMode` so it defaults to `preserve-legacy`,
     - add the event to `archive/storylines/bench-council-ai100.json` in catalog order,
     - keep generated presentation identical to legacy.

3. Migrate core timeline events next.
   - Create variants using the source category/storyline context.
   - Use archive metadata and provenance, but preserve legacy presentation by default.
   - Add refs to `archive/storylines/deep-learning.json` only for actual deep-learning/core events that already have legacy targets.
   - Do not enable archive-only speculative refs like the disabled AlphaGo deep-learning ref.

4. Migrate gaming branch events.
   - Add `variants/gaming-ai.json` for branch events that have legacy gaming milestones.
   - Preserve legacy branch presentation by default.
   - Add refs to `archive/storylines/gaming-ai.json` in catalog branch order.

5. Strengthen validation/reporting for migration completeness.
   - Add a report that lists:
     - legacy events without archive directory,
     - archive events not referenced by any enabled storyline,
     - enabled storyline refs without legacy overlay target,
     - disabled refs and their notes.
   - This makes future migration progress visible without relying on manual review page scanning.

6. Regenerate and validate after each batch.
   - Run:
     - `npm run validate:archive`
     - `npm run build:archive`
     - `npm run generate`
     - `npm run review:archive`
     - `npm run diff:archive`
   - Final broader gate:
     - `npm test`
     - `npm run lint`
     - `npm run validate:startup`

## Expected result for this pass
- The archive contains many more legacy events, starting with the remaining AI100 set.
- Generated exhibition data remains presentation-compatible with legacy.
- `archive-review.html` shows enabled archive refs only when they have legacy/final comparison.
- `reports/archive-build-diff.md` remains at `Unexpected presentation changes: 0`.
