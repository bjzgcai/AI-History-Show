# AI100 2023 highlighted event workflow

This directory is the write boundary for event-specific research on the ten 2023 entries selected by `bench-council-ai100-2022-2023-highlights`.

Each event owns:

- `annual-events-2023/<event-id>.json`
- `annual-events-2023/assets/<event-id>.svg`
- `resources/images/external/ai100-2023-<slug>/`
- `resources/images/benchcouncil-ai100-annual/annual-<order>-<slug>_record.svg`
- `archive/events/<event-id>/`

Preserve the exact BenchCouncil work name, order, contributor prefix, institution and country. Confirm every listed contributor against primary publication or official product evidence and reliable identity sources. If the official contributor field is blank, do not infer people merely to add a portrait.

Every listed person needs a localized name and role, confirmed verification notes with source IDs, and a completed portrait search. Select at most one portrait per event. Keep the person text-only when no image has a reliable identity match and an explicit usage note.

Each complete package needs at least four localized sources, three two-sentence commentary sections, a localized source card, one original event-local explainer, a non-generic configured-paper demo, and one four-option quiz. Set `status` to `complete` only after all evidence and display content are finished.

Prepare, synchronize and validate one event at a time:

```bash
npm run prepare:ai100-2023-event -- --event 035 --dry-run
npm run prepare:ai100-2023-event -- --event 035
npm run sync:ai100-annual -- --event 035
npm run validate:ai100-2023-event -- --event 035
```

Do not use a full annual sync while event packages are being authored. Targeted synchronization writes only the selected Archive event directory and production explainer.
