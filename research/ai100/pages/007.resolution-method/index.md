# Resolution Method

## Full Name
A Machine-Oriented Logic Based on the Resolution Principle

## Year / Period
1965

## Type
Automated theorem proving

## One-Sentence Summary
Resolution Method is a major AI100 achievement connecting Automated theorem proving to later AI systems.

## Hero Description
Resolution turned first-order theorem proving into a uniform refutation procedure: translate statements into clauses, negate the target, and derive a contradiction. Robinson combined resolution with unification, giving automated provers a compact rule that could be implemented systematically. It became a foundation for logic programming, SAT/SMT lineage, and many later reasoning systems.

## People & Place
- John Alan Robinson: Inventor of the resolution principle

Key place: Argonne National Laboratory / Syracuse University

## Historical Background
Earlier theorem provers often needed many specialized inference rules. Resolution reduced proof search to a small number of clause operations, making mechanized logic less ad hoc.

## Canonical Source
A Machine-Oriented Logic Based on the Resolution Principle. John Alan Robinson, Journal of the ACM, 1965. https://doi.org/10.1145/321250.321253

## Core Idea
The key move is refutation: assume the claim is false, then repeatedly resolve complementary literals until the empty clause appears.

## Key Concepts
- Clause Form: Statements are converted into disjunctions of literals so one inference rule can operate repeatedly.
- Unification: Variables are matched by substitutions, allowing one rule to handle many concrete formulas.
- Empty Clause: Deriving the empty clause means the negated goal is inconsistent with the premises.

## Impact
Its long-term legacy is visible in Prolog, automated theorem proving, constraint solving, and the habit of representing reasoning as searchable symbolic transformations.

## Photos
- local_image_path: resources/images/bench-council-ai100/photos/1965-resolution-method_john-alan-robinson.jpg
  title: John Alan Robinson portrait
  source_name: Wikimedia Commons
  source_page_url: https://commons.wikimedia.org/wiki/File:John_Alan_Robinson_IMG_0493.jpg
  original_image_url: https://commons.wikimedia.org/wiki/Special:FilePath/John_Alan_Robinson_IMG_0493.jpg
  copyright_or_license: Creative Commons license stated on Commons file page.
- local_image_path: resources/images/bench-council-ai100/explainers/1965-resolution-method_clause-refutation.svg
  title: Clause refutation ladder
  source_name: Journal of the ACM
  source_page_url: https://doi.org/10.1145/321250.321253
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.
- local_image_path: resources/images/bench-council-ai100/explainers/1965-resolution-method_unification-map.svg
  title: Unification map
  source_name: Journal of the ACM
  source_page_url: https://doi.org/10.1145/321250.321253
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.

## Related Achievements
- DPLL
- PROLOG
- Automated theorem proving

## Museum Metadata
{
  "year": "1965",
  "type": "Automated theorem proving",
  "people": ["John Alan Robinson"],
  "keywords": ["logic","reasoning"]
}

## References
- Paper: A Machine-Oriented Logic Based on the Resolution Principle. https://doi.org/10.1145/321250.321253
- Review: Journal of Symbolic Logic review record. https://www.cambridge.org/core/journals/journal-of-symbolic-logic/article/j-a-robinson-a-machineoriented-logic-based-on-the-resolution-principle-journal-of-the-association-for-computing-machinery-vol-12-1965-pp-2341/65679C30B9D7D7763FFB700CA77B18B1
- Background: Stanford Encyclopedia: Automated Reasoning. https://plato.stanford.edu/entries/reasoning-automated/
