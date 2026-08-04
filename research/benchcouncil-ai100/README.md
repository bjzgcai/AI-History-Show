# BenchCouncil AI100 source snapshots

The production `bench-council-ai100` storyline follows the long-term achievement table at:

`https://www.benchcouncil.org/evaluation/ai/`

The page was retrieved on 2026-07-30. Its long-term table contains 119 unique works and 157 expanded publication rows. The navigation label still says “Top 100,” but the table itself is the membership authority used by the project.

`canonical-root-table-2026-07-30.json` preserves every visible table field and maps each official work to its Archive event ID. `scripts/audit-benchcouncil-ai100-membership.js` checks exact membership and order against that snapshot.

AI100 display locations use the table's institution and country columns as separate fields. English country names are expanded consistently (`USA` to `United States`, `UK` to `United Kingdom`), Chinese values are independently localized, and obvious source typos such as `University of Munic` are corrected only in display data while the preserved snapshot remains unchanged. `scripts/audit-ai100-locations.js` checks Archive events, storyline variants, and generated runtime data for exact alignment and rejects duplicated country suffixes.

The separate `AI100 (2022-2023)` page uses a prospective annual-candidate standard. Its 120 rows are preserved in official order in `annual-candidates-2022-2023-2026-08-03.json` and drive the standalone `bench-council-ai100-2022-2023` storyline. They do not define membership in the canonical long-term storyline or enter the unified long-term chronology.

`annual-publication-metadata-2026-08-03.json` stores resolved publication metadata without changing the annual page's authority over names, contributor order, institutions, countries, citations, or blank fields. Regenerate the Archive bundles with `npm run sync:ai100-annual`, and verify exact row parity with `npm run audit:ai100-annual`.

Annual events use one locally redrawn achievement explainer by default. They do not generate contributor profile-card SVGs. A person image is selected only when the identity, source page, usage note, and reliability assessment are recorded; otherwise the official contributor remains text-only with no placeholder portrait.

`annual-portrait-research-2026-08-03.json` records the portrait search for all 316 unique annual-table contributors. Run `npm run research:ai100-annual-portraits` to refresh the batch Wikidata/Wikimedia checks. The current pass selects 10 verified people across 11 events, keeps 2 institution-mismatched candidates out of production, and leaves 304 people text-only because no image met the source and reliability rules. Previously generated `*_contributors.svg` files remain in the append-only resource directory but are no longer referenced by Archive events or runtime data.

The remaining 2022 event research is parallelized through `annual-events-2022/`. Each worker session owns one event JSON, one optional event-local SVG source, one external image directory, and the matching Archive event directory. Use `npm run list:ai100-2022`, `npm run prepare:ai100-2022-event -- --event <order>`, targeted `npm run sync:ai100-annual -- --event <order>`, and `npm run validate:ai100-2022-event -- --event <order>`. See `annual-events-2022/README.md` for the ownership and integration rules.

The highlighted 2023 event research uses the same isolated workflow under `annual-events-2023/`. Use `npm run list:ai100-2023`, `npm run prepare:ai100-2023-event -- --event <order>`, targeted `npm run sync:ai100-annual -- --event <order>`, and `npm run validate:ai100-2023-event -- --event <order>`.

The former storyline entries `CLIP`, `DALL-E`, `Stable Diffusion`, and `Segment Anything` remain in Archive as non-canonical extensions. They are excluded from the long-term storyline because they do not appear in the root-page table snapshot.
