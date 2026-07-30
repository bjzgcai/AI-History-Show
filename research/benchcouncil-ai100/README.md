# BenchCouncil AI100 source snapshots

The production `bench-council-ai100` storyline follows the long-term achievement table at:

`https://www.benchcouncil.org/evaluation/ai/`

The page was retrieved on 2026-07-30. Its long-term table contains 119 unique works and 157 expanded publication rows. The navigation label still says “Top 100,” but the table itself is the membership authority used by the project.

`canonical-root-table-2026-07-30.json` preserves every visible table field and maps each official work to its Archive event ID. `scripts/audit-benchcouncil-ai100-membership.js` checks exact membership and order against that snapshot.

AI100 display locations use the table's institution and country columns as separate fields. English country names are expanded consistently (`USA` to `United States`, `UK` to `United Kingdom`), Chinese values are independently localized, and obvious source typos such as `University of Munic` are corrected only in display data while the preserved snapshot remains unchanged. `scripts/audit-ai100-locations.js` checks Archive events, storyline variants, and generated runtime data for exact alignment and rejects duplicated country suffixes.

The separate `AI100 (2022-2023)` page uses a prospective annual-candidate standard. Its 120 rows are preserved in `annual-candidates-2022-2023-2026-07-30.json` for research, but they do not define membership in the canonical long-term storyline.

The former storyline entries `CLIP`, `DALL-E`, `Stable Diffusion`, and `Segment Anything` remain in Archive as non-canonical extensions. They are excluded from the long-term storyline because they do not appear in the root-page table snapshot.
