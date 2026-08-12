# BenchCouncil AI100 source snapshots

The production `bench-council-ai100` storyline follows the long-term achievement table at:

`https://www.benchcouncil.org/evaluation/ai/`

The page was retrieved on 2026-07-30. Its long-term table contains 119 unique works and 157 expanded publication rows. The navigation label still says “Top 100,” but the table itself is the membership authority used by the project.

`canonical-root-table-2026-07-30.json` preserves every visible table field and maps each official work to its Archive event ID. `scripts/audit-benchcouncil-ai100-membership.js` checks exact membership and order against that snapshot.

`BenchCouncil_AI100_完整成果表.xlsx` is the human-readable research workbook derived for review and analysis. It contains the main AI100 achievement table, representative-paper details, explanatory notes, and category statistics; it is research material rather than a production compiler input.

AI100 display locations use the table's institution and country columns as separate fields. English country names are expanded consistently (`USA` to `United States`, `UK` to `United Kingdom`), Chinese values are independently localized, and obvious source typos such as `University of Munic` are corrected only in display data while the preserved snapshot remains unchanged. `scripts/audit-ai100-locations.js` checks Archive events, storyline variants, and generated runtime data for exact alignment and rejects duplicated country suffixes.

The separate `bench-council-ai100-2022-2023` storyline retains twenty curated achievements from the BenchCouncil 2022-2023 annual list: ten from 2022 and ten from 2023. The production Archive does not retain the other annual candidates, and the curated set remains separate from the unified long-term chronology.

Annual events use one locally redrawn achievement explainer by default. They do not generate contributor profile-card SVGs. A person image is selected only when the identity, source page, usage note, and reliability assessment are recorded; otherwise the official contributor remains text-only with no placeholder portrait.

Event-specific evidence and explainer sources for the retained set live under `annual-events-2022/` and `annual-events-2023/`. The production bundles are maintained directly in `archive/events/`, then checked with `npm run audit:ai100-annual`, the Archive validators, and the standard generation workflow.

The former storyline entries `CLIP`, `DALL-E`, `Stable Diffusion`, and `Segment Anything` remain in Archive as non-canonical extensions. They are excluded from the long-term storyline because they do not appear in the root-page table snapshot.
