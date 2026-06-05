---
number: 5
achievement: "Wang's algorithm"
achievement_zh: "王氏算法"
area: "Automated theorem proving"
area_zh: "自动定理证明"
year: "1958-1961"
source_list: "BenchCouncil AI100"
research_status: "draft-complete"
language: "en"
---

# Achievement Name

Wang's algorithm / theorem proving by pattern recognition.

# Year / Period

1958-1961

# Type

Reasoning

# One-Sentence Summary

Hao Wang showed that theorem proving could be automated by recognizing and reducing logical patterns rather than enumerating every truth assignment.

# Hero Title

- title: Wang's Algorithm

# Hero Description

- description: Wang's work made automated theorem proving feel like an executable logic discipline. His procedures transformed formulas into recognizable shapes, applied proof rules, and closed branches when a proof condition appeared. This bridged early symbolic AI with later proof procedures and SAT-style reasoning.

# People & Place

## Key People

- Name: Hao Wang
- Role: Logician, mathematician, philosopher, and developer of pattern-recognition theorem-proving procedures
- Institution: Bell Telephone Laboratories; later The Rockefeller University
- Country: USA / China

## Key Organizations

- Name: Bell Telephone Laboratories
- Type: Industrial research laboratory
- Country: USA

- Name: Association for Computing Machinery
- Type: Professional society / publisher
- Country: USA

## Key Places

- Murray Hill, New Jersey, USA
- New York, USA

==================================================
【Core Content】
==================================================

# Historical Background

By the late 1950s, AI and mathematical logic were converging around a practical question: could computers do more than arithmetic and actually manipulate formal proofs? Early systems such as Logic Theorist had shown symbolic proof search, but researchers still needed more systematic procedures for formal logic.

Wang's work entered this context by treating theorem proving as a process of recognizing useful logical forms. Instead of relying only on truth-table enumeration, his procedures used transformations related to sequent and predicate-calculus structure.

# Canonical Source

- Title: Proving theorems by pattern recognition I
- Authors: Hao Wang
- Venue: Communications of the ACM, 3(4), 220-234
- Year: 1960
- DOI: 10.1145/367177.367224
- URL: https://cacm.acm.org/research/proving-theorems-by-pattern-recognition-i/

- Title: Proving Theorems by Pattern Recognition - II
- Authors: Hao Wang
- Venue: Bell System Technical Journal
- Year: 1961
- DOI: N/A
- URL: https://www.nokia.com/bell-labs/publications-and-media/publications/proving-theorems-by-pattern-recognition-ii/

# Core Idea

The core idea is that proof search can be guided by the shape of formulas. If a formula has a recognizable connective or quantifier structure, the procedure can apply a rule that splits, simplifies, or moves the proof obligation into smaller subgoals.

This differs from blind truth-table search because it uses logical structure as information. The algorithm still searches, but it searches through meaningful transformations.

# Key Concepts

- Pattern Recognition: Matching logical forms against known rule patterns so that a proof can proceed by structured transformations.
- Proof Reduction: Turning a complex theorem into smaller subgoals until branches close or need further search.
- Mechanical Mathematics: Wang's broader framing that mathematical proof could be approached through machine-executable symbolic procedures.

==================================================
【Impact】
==================================================

# Impact

## Academic Impact

BenchCouncil lists "Proving theorems by pattern recognition I" with 173 citations. The work became part of the early automated theorem proving lineage and is commonly discussed alongside Logic Theorist, Davis-Putnam, DPLL, and resolution.

## Industrial Impact

The original algorithm was not a commercial product. Its industrial value was methodological: it demonstrated how proof procedures could run on contemporary machines and helped establish theorem proving as a computational task.

## Expert Evaluation

The exact procedure is historical, but the idea of using formula structure to guide proof search remains central in automated deduction, SAT solving, SMT solving, proof assistants, and formal verification.

==================================================
【Expert Evaluations】
==================================================

# Expert Evaluations

- Quote: "A proof procedure for the predicate calculus is given"
- Person: Hao Wang
- Organization: Bell System Technical Journal
- Year: 1961
- Source URL: https://www.nokia.com/bell-labs/publications-and-media/publications/proving-theorems-by-pattern-recognition-ii/

Today experts usually treat Wang's algorithm as a foundational automated theorem proving contribution: important less as a modern production solver and more as a historical bridge between formal logic, symbolic AI, and executable proof procedures.

==================================================
【Multimedia】
==================================================

# Photos

images:

- photos/1958-wangs-algorithm_hao-wang.jpg
- photos/1958-wangs-algorithm_pattern-proof.svg

imageMeta:

- local_image_path: photos/1958-wangs-algorithm_hao-wang.jpg
- title: Hao Wang portrait
- caption: Hao Wang portrait
- description: Hao Wang, circa 1980s, from The Rockefeller University Historical Photograph Collection.
- source_name: The Rockefeller University Digital Commons
- source_page_url: https://digitalcommons.rockefeller.edu/faculty-members/109/
- original_image_url: https://digitalcommons.rockefeller.edu/faculty-members/1109/preview.jpg
- copyright_or_license: Historical Photograph Collection preview; creator and photo credit listed as unknown; reuse rights not stated on page.
- usage: Portrait

- local_image_path: photos/1958-wangs-algorithm_pattern-proof.svg
- title: Wang algorithm pattern proof
- caption: Wang algorithm pattern proof diagram
- description: Original local explainer showing formula normalization, rule matching, proof reduction, and branch closure.
- source_name: Local explainer based on Wang 1960 and Wang 1961
- source_page_url: https://cacm.acm.org/research/proving-theorems-by-pattern-recognition-i/
- original_image_url: Local original explainer
- copyright_or_license: Original local explainer; source article images not reused.
- usage: Explainer graphic

# Video Clips

No required video clip selected.

==================================================
【Navigation & Knowledge Graph】
==================================================

# Related People

- Hao Wang
- Allen Newell
- Herbert A. Simon
- Martin Davis
- Hilary Putnam
- John Alan Robinson

# Related Achievements

- Logic Theorist
- Davis-Putnam algorithm and DPLL
- Resolution method
- SAT solving

# Related Organizations

- Bell Telephone Laboratories
- ACM
- The Rockefeller University

# Related Countries

- USA
- China

# Timeline Connections

- Predecessors: formal logic; Principia Mathematica; Turing machines; Logic Theorist; early IBM 704 theorem-proving work.
- Successors: Davis-Putnam and DPLL; resolution theorem proving; SAT and SMT solvers; proof assistants.

==================================================
【Museum Metadata】
==================================================

{
  "year": "1958-1961",
  "decade": "1950s-1960s",
  "type": "Reasoning",
  "countries": ["USA", "China"],
  "people": ["Hao Wang"],
  "organizations": ["Bell Telephone Laboratories", "Association for Computing Machinery", "The Rockefeller University"],
  "keywords": ["Wang's algorithm", "automated theorem proving", "pattern recognition", "predicate calculus", "mechanical mathematics"],
  "related_achievements": ["Logic Theorist", "Davis-Putnam algorithm and DPLL", "Resolution method", "SAT solving"]
}

==================================================
【References】
==================================================

# Primary Sources

- Wang, H. (1960). Proving theorems by pattern recognition I. Communications of the ACM, 3(4), 220-234. https://doi.org/10.1145/367177.367224
- Wang, H. (1961). Proving theorems by pattern recognition - II. Bell System Technical Journal. https://www.nokia.com/bell-labs/publications-and-media/publications/proving-theorems-by-pattern-recognition-ii/

# Secondary Sources

- BenchCouncil. (n.d.). AI100: Top 100 AI achievements. Retrieved June 3, 2026, from https://www.benchcouncil.org/evaluation/ai/
- The Rockefeller University Digital Commons. (n.d.). Wang, Hao. Retrieved June 3, 2026, from https://digitalcommons.rockefeller.edu/faculty-members/109/
