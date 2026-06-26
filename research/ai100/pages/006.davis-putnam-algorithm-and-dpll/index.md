---
number: 6
achievement: "Davis-Putnam algorithm & DPLL"
achievement_zh: "Davis-Putnam 算法与 DPLL"
area: "Automated theorem proving"
area_zh: "自动定理证明"
year: "1960"
source_list: "BenchCouncil AI100"
research_status: "draft-complete"
language: "en"
---

# Achievement Name

Davis-Putnam algorithm and Davis-Putnam-Logemann-Loveland procedure.

# Year / Period

1960-1962

# Type

Reasoning

# One-Sentence Summary

The Davis-Putnam procedure and DPLL made satisfiability solving a disciplined search process based on simplification, propagation, branching, and backtracking.

# Hero Title

- title: DP/DPLL

# Hero Description

- description: Davis and Putnam connected quantification theory to feasible proof procedures in 1960. Davis, Logemann, and Loveland then refined the propositional satisfiability step into a machine program whose branching and propagation structure became DPLL. This lineage still underlies SAT, SMT, planning, verification, and constraint solving.

# People & Place

## Key People

- Name: Martin Davis
- Role: Co-author of the Davis-Putnam procedure and the DPLL program paper
- Institution: Rensselaer Polytechnic Institute; New York University
- Country: USA

- Name: Hilary Putnam
- Role: Co-author of the 1960 Davis-Putnam paper
- Institution: Princeton University
- Country: USA

- Name: George Logemann
- Role: Co-author of the 1962 DPLL program paper
- Institution: New York University
- Country: USA

- Name: Donald W. Loveland
- Role: Co-author of the 1962 DPLL program paper
- Institution: New York University
- Country: USA

## Key Organizations

- Name: Journal of the ACM
- Type: Academic journal
- Country: USA

- Name: Communications of the ACM
- Type: Academic magazine / journal
- Country: USA

- Name: New York University Institute of Mathematical Sciences
- Type: Research institute
- Country: USA

## Key Places

- New York, USA
- Princeton, New Jersey, USA
- Troy, New York, USA

==================================================
【Core Content】
==================================================

# Historical Background

Automated theorem proving in the late 1950s faced a tension: first-order logic had no general decision procedure, but valid formulas could still be found by proof procedures that might search indefinitely on invalid inputs. Researchers needed methods that could use modern computers effectively, especially for the propositional and quantifier-handling subproblems.

Davis and Putnam introduced a systematic computing procedure for quantification theory in 1960. The 1962 Davis, Logemann, and Loveland paper then described a machine program for theorem proving, producing the DPLL tradition that became central to SAT solving.

# Canonical Source

- Title: A Computing Procedure for Quantification Theory
- Authors: Martin Davis and Hilary Putnam
- Venue: Journal of the ACM, 7(3), 201-215
- Year: 1960
- DOI: 10.1145/321033.321034
- URL: https://dl.acm.org/doi/10.1145/321033.321034

- Title: A machine program for theorem-proving
- Authors: Martin Davis, George Logemann, and Donald W. Loveland
- Venue: Communications of the ACM, 5(7), 394-397
- Year: 1962
- DOI: 10.1145/368273.368557
- URL: https://cacm.acm.org/research/a-machine-program-for-theorem-proving/

# Core Idea

The key idea is to solve satisfiability by repeatedly simplifying the formula and exploring assignments only where needed. If a clause forces a value, propagate it. If no forced move exists, branch on a variable. If a branch contradicts the formula, backtrack.

This differs from simple exhaustive enumeration because the algorithm uses the formula's structure to cut away many impossible branches early. It made SAT solving a practical engine for automated reasoning.

# Key Concepts

- Davis-Putnam Procedure: A 1960 proof procedure that used logical transformations for quantification theory and propositional satisfiability.
- DPLL Search: A recursive SAT procedure based on branching, simplification, and backtracking.
- Unit Propagation: A forced-assignment rule that simplifies clauses when only one literal can still satisfy a clause.

==================================================
【Impact】
==================================================

# Impact

## Academic Impact

BenchCouncil lists "A Computing Procedure for Quantification Theory" with 4,358 citations. The Davis-Putnam and DPLL family became a standard reference point in automated reasoning, satisfiability, verification, and constraint solving.

## Industrial Impact

Modern SAT and SMT solvers are used in hardware verification, software analysis, planning, scheduling, model checking, security analysis, package dependency solving, and configuration. They are far more advanced than early DPLL, but they retain the basic idea of structured search with aggressive simplification.

## Expert Evaluation

DPLL remains one of the most recognizable foundations of practical automated reasoning. CDCL SAT solvers add conflict learning, watched literals, restarts, and branching heuristics, but their core still traces to DPLL-style search.

==================================================
【Expert Evaluations】
==================================================

# Expert Evaluations

- Quote: "The programming of a proof procedure is discussed"
- Person: Communications of the ACM article abstract
- Organization: ACM
- Year: 1962
- Source URL: https://cacm.acm.org/research/a-machine-program-for-theorem-proving/

Today experts usually evaluate Davis-Putnam and DPLL as foundational SAT-solving work. Their importance lies in turning proof search into an algorithmic loop that could be implemented, optimized, and later extended by modern solver engineering.

==================================================
【Multimedia】
==================================================

# Photos

images:

- photos/1960-davis-putnam-dpll_hilary-putnam.jpg
- photos/1960-davis-putnam-dpll_sat-search.svg

imageMeta:

- local_image_path: photos/1960-davis-putnam-dpll_hilary-putnam.jpg
- title: Hilary Putnam portrait
- caption: Hilary Putnam portrait
- description: Wikimedia Commons portrait of Hilary Putnam, co-author of the 1960 Davis-Putnam procedure.
- source_name: Wikimedia Commons
- source_page_url: https://commons.wikimedia.org/wiki/File:Hilary_Putnam.jpg
- original_image_url: https://upload.wikimedia.org/wikipedia/commons/3/38/Hilary_Putnam.jpg
- copyright_or_license: Creative Commons Attribution-Share Alike 2.5 Generic, CC BY-SA 2.5; Wikimedia VRT permission recorded.
- usage: Portrait

- local_image_path: photos/1960-davis-putnam-dpll_sat-search.svg
- title: Davis-Putnam and DPLL SAT search
- caption: Davis-Putnam and DPLL SAT search diagram
- description: Original local explainer showing CNF clauses, propagation, branching, conflict pruning, and model acceptance.
- source_name: Local explainer based on Davis-Putnam 1960 and Davis-Logemann-Loveland 1962
- source_page_url: https://dl.acm.org/doi/10.1145/321033.321034
- original_image_url: Local original explainer
- copyright_or_license: Original local explainer; source article images not reused.
- usage: Explainer graphic

# Video Clips

No required video clip selected.

==================================================
【Navigation & Knowledge Graph】
==================================================

# Related People

- Martin Davis
- Hilary Putnam
- George Logemann
- Donald W. Loveland
- Hao Wang
- John Alan Robinson

# Related Achievements

- Wang's algorithm
- Resolution method
- SAT solving
- SMT solving
- Model checking

# Related Organizations

- New York University
- Princeton University
- Rensselaer Polytechnic Institute
- ACM

# Related Countries

- USA

# Timeline Connections

- Predecessors: formal logic; Church and Turing's undecidability results; Gilmore's and Wang's proof procedures; Logic Theorist.
- Successors: resolution theorem proving; CDCL SAT solvers; SMT solvers; formal verification and model checking.

==================================================
【Museum Metadata】
==================================================

{
  "year": "1960-1962",
  "decade": "1960s",
  "type": "Reasoning",
  "countries": ["USA"],
  "people": ["Martin Davis", "Hilary Putnam", "George Logemann", "Donald W. Loveland"],
  "organizations": ["New York University", "Princeton University", "Rensselaer Polytechnic Institute", "Association for Computing Machinery"],
  "keywords": ["Davis-Putnam", "DPLL", "SAT solving", "unit propagation", "backtracking", "automated theorem proving"],
  "related_achievements": ["Wang's algorithm", "Resolution method", "SAT solving", "SMT solving"]
}

==================================================
【References】
==================================================

# Primary Sources

- Davis, M., & Putnam, H. (1960). A computing procedure for quantification theory. Journal of the ACM, 7(3), 201-215. https://doi.org/10.1145/321033.321034
- Davis, M., Logemann, G., & Loveland, D. W. (1962). A machine program for theorem-proving. Communications of the ACM, 5(7), 394-397. https://doi.org/10.1145/368273.368557

# Secondary Sources

- BenchCouncil. (n.d.). AI100: Top 100 AI achievements. Retrieved June 3, 2026, from https://www.benchcouncil.org/evaluation/ai/
- Wikimedia Commons. (n.d.). File: Hilary Putnam.jpg. Retrieved June 3, 2026, from https://commons.wikimedia.org/wiki/File:Hilary_Putnam.jpg
