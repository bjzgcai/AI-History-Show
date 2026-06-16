---
number: 2
achievement: "Complexity theory"
area: "Theory"
year: "1971"
source_list: "BenchCouncil AI100"
research_status: "draft-complete"
---

# Achievement Name

Computational Complexity Theory / NP-Completeness

# Year / Period

1971

# Type

Foundations

# One-Sentence Summary

Stephen Cook's 1971 theorem-proving paper introduced NP-completeness, giving computer science a rigorous way to identify problems that are easy to verify but may be infeasible to solve efficiently.

# Hero Title

- title: NP-Completeness

# Hero Description

- description: Computational complexity theory gave computer science a language for classifying problems by the resources needed to solve them. Cook's 1971 NP-completeness result showed that many hard problems share a common structure: a solution can be checked quickly even when finding one may be infeasible. This changed how researchers reason about algorithms, limits, cryptography, optimization, and AI search.

# People & Place

## Key People

- Name: Stephen A. Cook
- Role: Computer scientist; author of "The Complexity of Theorem-Proving Procedures"; introduced NP-completeness
- Institution: University of Toronto
- Country: Canada

- Name: Leonid Levin
- Role: Computer scientist and mathematician; independently formulated related NP-completeness/P versus NP ideas
- Institution: Soviet research community at the time of the independent work
- Country: USSR / Russia

## Key Organizations

- Name: University of Toronto
- Type: University
- Country: Canada

- Name: Association for Computing Machinery
- Type: Professional society / publisher
- Country: USA

- Name: ACM SIGACT Symposium on Theory of Computing
- Type: Academic conference
- Country: USA

- Name: Clay Mathematics Institute
- Type: Research foundation
- Country: USA

## Key Places

- Toronto, Canada
- Shaker Heights, Ohio, USA
- Cambridge, Massachusetts, USA

==================================================
【核心内容】
==================================================

# Historical Background

By the late 1960s and early 1970s, computer science had efficient algorithms for many tasks, but there was no mature language for explaining why some natural problems resisted efficient solution. Researchers could measure running time, but they lacked a unifying theory for comparing the intrinsic difficulty of search, optimization, theorem proving, satisfiability, and combinatorial problems.

Cook's 1971 STOC paper changed the situation by showing that Boolean satisfiability captures the difficulty of all problems in NP under polynomial-time reductions. This meant that a large family of apparently different problems could be linked through one common hardness notion. If any NP-complete problem has a polynomial-time algorithm, then every problem in NP does.

The issue remains open as the P versus NP problem. Clay Mathematics Institute describes it as the question of whether every problem whose answer can be quickly checked can also be quickly solved, and lists it as one of the Millennium Prize Problems.

# Canonical Source

- Title: The Complexity of Theorem-Proving Procedures
- Authors: Stephen A. Cook
- Venue: Proceedings of the Third Annual ACM Symposium on Theory of Computing (STOC '71)
- Year: 1971
- DOI: 10.1145/800157.805047
- URL: https://dl.acm.org/doi/10.1145/800157.805047

- Title: The P Versus NP Problem
- Authors: Stephen Cook
- Venue: Clay Mathematics Institute Millennium Prize Problem description
- Year: 2000
- DOI: N/A
- URL: https://www.claymath.org/wp-content/uploads/2022/06/pvsnp.pdf

# Core Idea

The core idea is that some problems are easy to check but may be hard to solve. For example, if someone gives you a solution to a scheduling puzzle, you can check it quickly. Finding the solution from scratch may be much harder.

Cook formalized this distinction with the classes P and NP and introduced NP-completeness. A problem is NP-complete when it is in NP and every other NP problem can be translated into it efficiently. This makes NP-complete problems the "hardest" problems in NP: solve one efficiently, and you solve them all efficiently.

The theory works because reductions let researchers compare problems without solving them. Instead of asking whether every hard-looking problem is hard in isolation, complexity theory asks whether one problem can simulate another while preserving efficient computation.

# Key Concepts

- P versus NP: P contains problems that can be solved quickly, while NP contains problems whose proposed answers can be checked quickly. The open question is whether quick checking always implies quick solving.
- NP-Completeness: An NP-complete problem is among the hardest problems in NP. If one NP-complete problem can be solved efficiently, then every problem in NP can be solved efficiently.
- Polynomial-Time Reduction: A reduction translates one problem into another efficiently. It lets researchers compare difficulty across very different-looking problems without solving them directly.

==================================================
【影响力】
==================================================

# Impact

## Academic Impact

BenchCouncil lists Cook's "The Complexity of Theorem Proving Procedures" with 10,695 citations. ACM states that the paper laid the foundations for NP-completeness, and its Turing Award citation says the subsequent study of NP-complete problems became one of computer science's most active and important research activities.

The theory shaped algorithms, cryptography, optimization, databases, logic, verification, artificial intelligence, operations research, and computational biology. It gave researchers a disciplined way to say "this problem is probably hard" even when no lower-bound proof is known.

## Industrial Impact

Complexity theory does not behave like a product feature, but it influences industrial engineering decisions constantly. NP-completeness results guide solver design, approximation algorithms, heuristic search, SAT/SMT solving, constraint programming, routing, scheduling, compiler optimization, hardware verification, cryptography, and security assumptions.

Companies do not "use NP-completeness" as a single algorithm; they use it as a map of where exact efficient solutions are unlikely and where approximations, restrictions, randomized methods, or specialized solvers are needed.

## Long-Term Legacy

NP-completeness remains standard theory in computer science education and research. P versus NP remains unresolved and is one of the Clay Mathematics Institute Millennium Prize Problems. The legacy is not only a famous open problem, but a whole vocabulary for classifying computational difficulty.

==================================================
【专家评价】
==================================================

# Expert Evaluations

- Quote: "laid the foundations for the theory of NP-Completeness"
- Person: ACM A.M. Turing Award citation editors
- Organization: Association for Computing Machinery
- Year: 1982 award page
- Source URL: https://awards.acm.org/award_winners/cook_N991950

- Quote: "Cook's contributions to computational complexity were absolutely foundational."
- Person: Scott Aaronson
- Organization: University of Texas at Austin; quoted by University of Toronto
- Year: 2019
- Source URL: https://www.utoronto.ca/news/some-deepest-questions-it-s-possible-ask-stephen-cook-s-pioneering-career-computational

Today experts generally evaluate Cook's 1971 contribution as a founding event of theoretical computer science. The consensus is that NP-completeness did not merely solve a problem; it created a durable framework for comparing computational hardness across many fields.

==================================================
【多媒体】
==================================================

# Photos

images:

- photos/1971-complexity-theory_stephen-cook.jpg
- photos/1971-complexity-theory_reduction-map.svg

imageMeta:

- local_image_path: photos/1971-complexity-theory_stephen-cook.jpg
- title: Stephen A. Cook portrait
- caption: Stephen A. Cook
- description: Official or institutional profile image connected to Cook's work on NP-completeness.
- source_name: Association for Computing Machinery
- source_page_url: https://awards.acm.org/award_winners/cook_N991950
- original_image_url: Not available
- copyright_or_license: ACM award page; use requires checking ACM image permissions.
- usage: Portrait

- local_image_path: photos/1971-complexity-theory_reduction-map.svg
- title: NP-completeness reduction map
- caption: Reduction map
- description: Local explainer showing how reductions connect computational problems when reasoning about NP-completeness.
- source_name: Local explainer based on Cook 1971 and Karp 1972
- source_page_url: https://doi.org/10.1145/321921.321924
- original_image_url: Local original explainer
- copyright_or_license: Original local explainer; source text and figure reuse rights not used.
- usage: Explainer graphic

# Video Clips

- Title: Vijaya Ramachandran (Austin) P versus NP
- URL: https://www.claymath.org/lectures/p-versus-np/
- Platform: Clay Mathematics Institute lecture video
- Duration: Not listed on summary page
- Description: Clay lecture series video connected to the P versus NP Millennium Problem.

- Title: Lance Fortnow (GaTech) A personal view of the P versus NP problem
- URL: https://www.claymath.org/millennium/p-vs-np/
- Platform: Clay Mathematics Institute related video
- Duration: Not listed on summary page
- Description: Expert lecture giving historical and conceptual context for P versus NP.

==================================================
【导航与知识图谱】
==================================================

# Related People

- Stephen Cook
- Leonid Levin
- Richard Karp
- Michael Rabin
- Dana Scott
- Avi Wigderson
- Scott Aaronson
- Lance Fortnow

# Related Achievements

- Turing test
- Davis-Putnam algorithm and DPLL
- Resolution method
- Search algorithms
- SAT solving
- Bayesian network

# Related Organizations

- University of Toronto
- ACM
- ACM SIGACT
- Clay Mathematics Institute
- Fields Institute

# Related Countries

- Canada
- USA
- USSR / Russia

# Timeline Connections

- Predecessors: Turing machines and computability theory; formal logic; theorem proving; early algorithm analysis.
- Successors: Karp's 1972 NP-completeness results; approximation algorithms; cryptographic hardness assumptions; SAT/SMT solvers; modern theoretical computer science.

==================================================
【Museum Metadata】
==================================================

{
  "year": "1971",
  "decade": "1970s",
  "type": "Foundations",
  "countries": ["Canada", "USA", "Russia"],
  "people": ["Stephen Cook", "Leonid Levin", "Richard Karp", "Scott Aaronson", "Lance Fortnow"],
  "organizations": ["University of Toronto", "Association for Computing Machinery", "Clay Mathematics Institute", "Fields Institute"],
  "keywords": ["complexity theory", "NP-completeness", "P versus NP", "SAT", "polynomial-time reduction", "theorem proving"],
  "related_achievements": ["Davis-Putnam algorithm and DPLL", "Resolution method", "Search algorithms", "SAT solving"]
}

==================================================
【参考资料】
==================================================

# Primary Sources

- Cook, S. A. (1971). The complexity of theorem-proving procedures. Proceedings of the Third Annual ACM Symposium on Theory of Computing, 151-158. https://doi.org/10.1145/800157.805047
- Cook, S. (2000). The P versus NP problem. Clay Mathematics Institute. https://www.claymath.org/wp-content/uploads/2022/06/pvsnp.pdf

# Secondary Sources

- Association for Computing Machinery. (n.d.). Stephen A. Cook. ACM Awards. Retrieved June 2, 2026, from https://awards.acm.org/award_winners/cook_N991950
- Association for Computing Machinery. (n.d.). Spotlight on Turing laureates. Retrieved June 2, 2026, from https://awards.acm.org/about/turing-laureates-spotlight
- BenchCouncil. (n.d.). AI100: Top 100 AI achievements. Retrieved June 2, 2026, from https://www.benchcouncil.org/evaluation/ai/
- Clay Mathematics Institute. (n.d.). P vs NP. Retrieved June 2, 2026, from https://www.claymath.org/millennium/p-vs-np/
- Sasaki, C. (2019, July 5). Some of the deepest questions it's possible to ask: Stephen Cook's pioneering career in computational complexity. University of Toronto. https://www.utoronto.ca/news/some-deepest-questions-it-s-possible-ask-stephen-cook-s-pioneering-career-computational
