# Otter

## Full Name
Otter

## Year / Period
1990s

## Type
Automated Theorem Proving

## One-Sentence Summary
Otter is an AI100 achievement in automated theorem proving.

## Hero Description
Otter made high-performance first-order theorem proving widely usable for AI and mathematical logic researchers. McCune's system combined resolution, paramodulation, term indexing, weighting, and a practical given-clause search loop, becoming a workhorse for exploring large symbolic proof spaces.

## People & Place
- William McCune: Creator of Otter

Key place: Argonne National Laboratory

## Historical Background
Automated reasoning systems had powerful inference rules but often struggled with search explosion. Otter focused on practical control of that search.

## Canonical Source
OTTER 3.3 Reference Manual. https://arxiv.org/abs/cs/0310056

## Core Idea
The prover repeatedly selects a promising clause, generates consequences through inference rules, and uses indexing and simplification to keep the search tractable.

## Key Concepts
- Given-Clause Loop: A selected clause drives each round of saturation search.
- Paramodulation: Equality reasoning rewrites terms inside clauses.
- Term Indexing: Indexes speed up finding clauses that can participate in an inference.

## Impact
Otter influenced later automated reasoning tools, including Prover9, and helped prove or simplify results in algebra, logic, and formal mathematics.

## Photos
- local_image_path: resources/images/bench-council-ai100/explainers/1990-otter_given-clause.svg
  title: Given-clause proof loop
  source_name: OTTER 3.3 Reference Manual
  source_page_url: https://arxiv.org/abs/cs/0310056
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.
- local_image_path: resources/images/bench-council-ai100/explainers/1990-otter_clause-index.svg
  title: Clause indexing map
  source_name: OTTER 3.3 Reference Manual
  source_page_url: https://arxiv.org/abs/cs/0310056
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.

## Related Achievements
- Resolution method
- DPLL
- Prover9

## Museum Metadata
{
  "year": "1990s",
  "type": "Automated Theorem Proving",
  "people": [
    "William McCune"
  ],
  "keywords": [
    "theorem-proving",
    "symbolic-ai"
  ]
}

## References
- OTTER 3.3 Reference Manual. https://arxiv.org/abs/cs/0310056
- Otter home page. https://www.cs.unm.edu/~mccune/otter/
- Prover9 and Mace4. https://www.cs.unm.edu/~mccune/prover9/
