---
number: 119
achievement: "Simulated annealing"
area: "Optimization"
year: "1983"
source_list: "BenchCouncil AI100"
research_status: "draft-complete"
---

# Achievement Name

Simulated annealing

# Year / Period

1983

# Type

Search

# One-Sentence Summary

Simulated annealing turned physical cooling into a general strategy for escaping local optima in hard search problems.

# Hero Title

- title: Simulated Annealing

# Hero Description

- description: Simulated annealing borrows from metallurgy: when temperature is high, the search can accept worse moves and explore; as temperature cools, it becomes more selective. Kirkpatrick, Gelatt, and Vecchi showed how this idea could attack difficult optimization problems. The method became a classic bridge between physics, AI search, operations research, and combinatorial optimization.

# People & Place

## Key People

- Name: Scott Kirkpatrick
  Role: Co-author of the 1983 simulated annealing paper
  Institution: IBM Thomas J. Watson Research Center
  Country: Yorktown Heights, United States

- Name: C. Daniel Gelatt Jr.
  Role: Co-author of the 1983 simulated annealing paper
  Institution: IBM Thomas J. Watson Research Center
  Country: Yorktown Heights, United States

- Name: Mario P. Vecchi
  Role: Co-author of the 1983 simulated annealing paper
  Institution: IBM Thomas J. Watson Research Center
  Country: Yorktown Heights, United States

## Key Organizations

- Name: IBM Thomas J. Watson Research Center
- Type: Research organization / university
- Country: Yorktown Heights, United States

## Key Places

- Yorktown Heights, United States

==================================================
Core Content
==================================================

# Historical Background

Many AI and engineering problems had enormous search spaces where greedy improvement got stuck. Simulated annealing offered a principled way to make controlled uphill moves.

# Canonical Source

- Title: Optimization by Simulated Annealing
- Authors: Scott Kirkpatrick, C. Daniel Gelatt Jr., and Mario P. Vecchi
- Venue: Science
- Year: 1983
- DOI: See source page when applicable
- URL: https://www.science.org/doi/10.1126/science.220.4598.671

# Core Idea

At high temperature, the algorithm explores boldly. As the system cools, it increasingly commits to lower-cost states, imitating the settling of physical materials.

# Key Concepts

- Temperature: A temperature parameter controls how willing the algorithm is to accept worse moves.
- Cooling Schedule: The schedule gradually lowers temperature so the search shifts from exploration to refinement.
- Local Optima: Accepting occasional worse moves helps the search escape solutions that are good nearby but not globally best.

==================================================
Impact
==================================================

# Impact

## Academic Impact

BenchCouncil AI100 records 56,687 citations for the canonical source associated with this achievement. The work became a reference point for optimization and for later systems listed in its related achievements.

## Industrial Impact

The method influenced practical software stacks, benchmarks, and engineering workflows wherever probabilistic search with a cooling schedule became useful.

## Long-Term Legacy

The AI100 list records 56,687 citations. Simulated annealing influenced scheduling, VLSI layout, route planning, Bayesian computation, and metaheuristic optimization.

==================================================
Expert Evaluations
==================================================

# Expert Evaluations

- Quote: "optimization by simulated annealing"
- Person: Scott Kirkpatrick
- Organization: IBM Thomas J. Watson Research Center
- Year: 1983
- Source URL: https://www.science.org/doi/10.1126/science.220.4598.671

Today the achievement is usually evaluated as a durable building block: important not only as an isolated paper, but as a reusable pattern that shaped later AI systems.

==================================================
Multimedia
==================================================

# Photos

- local_image_path: resources/images/bench-council-ai100/explainers/1983-simulated-annealing_cooling-search.svg
- title: Simulated Annealing explainer
- caption: Original explainer for Simulated annealing
- description: A local diagram summarizing the core workflow without reusing publisher figures.
- source_name: Local explainer based on Optimization by Simulated Annealing
- source_page_url: https://www.science.org/doi/10.1126/science.220.4598.671
- original_image_url: Local original explainer
- copyright_or_license: Original local explainer; source article or book figures are not reused.
- usage: Explainer graphic

# Video Clips

No video clips selected for this draft.

==================================================
Navigation and Knowledge Graph
==================================================

# Related Achievements

- Genetic algorithms
- Monte Carlo methods
- Search algorithms

# Related Countries

- United States

# Timeline Connections

- Predecessors: earlier work in Optimization and adjacent AI methods.
- Successors: later systems that reused, extended, or reacted to Simulated annealing.

==================================================
Museum Metadata
==================================================

```json
{
  "year": "1983",
  "type": "Search",
  "countries": ["United States"],
  "people": ["Scott Kirkpatrick","C. Daniel Gelatt Jr.","Mario P. Vecchi"],
  "organizations": ["IBM Thomas J. Watson Research Center"],
  "keywords": ["Optimization","Probabilistic search with a cooling schedule","Simulated annealing"],
  "related_achievements": ["Genetic algorithms","Monte Carlo methods","Search algorithms"]
}
```

==================================================
References
==================================================

# Primary Sources

- Scott Kirkpatrick, C. Daniel Gelatt Jr., and Mario P. Vecchi. (1983). Optimization by Simulated Annealing. Science. https://www.science.org/doi/10.1126/science.220.4598.671

# Secondary Sources

- BenchCouncil AI100 achievement list. https://www.benchcouncil.org/ai100.html
