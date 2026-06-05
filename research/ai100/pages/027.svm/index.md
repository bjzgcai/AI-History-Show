---
number: 27
achievement: "SVM"
area: "Statistical Learning"
year: "1992"
source_list: "BenchCouncil AI100"
research_status: "draft-complete"
---

# Achievement Name

SVM

# Year / Period

1992

# Type

Machine Learning

# One-Sentence Summary

Support Vector Machines made classification a problem of finding a robust maximum-margin boundary, often through kernels.

# Hero Title

- title: Support Vector Machines

# Hero Description

- description: SVMs made statistical learning theory tangible: choose a boundary that separates classes with the largest margin, then use kernels to make linear separation possible in transformed feature spaces. The method became a dominant machine-learning tool before deep learning’s resurgence. It connected elegant theory, convex optimization, and practical classifiers.

# People & Place

## Key People

- Name: Vladimir Vapnik
  Role: Co-developed optimal-margin classifiers and statistical learning theory
  Institution: Bell Laboratories
  Country: Murray Hill, United States

- Name: Bernhard Boser
  Role: Co-author of the 1992 optimal-margin classifier paper
  Institution: Bell Laboratories
  Country: Murray Hill, United States

- Name: Isabelle Guyon
  Role: Co-author of the 1992 optimal-margin classifier paper
  Institution: Bell Laboratories
  Country: Murray Hill, United States

## Key Organizations

- Name: Bell Laboratories
- Type: Research organization / university
- Country: Murray Hill, United States

## Key Places

- Murray Hill, United States

==================================================
Core Content
==================================================

# Historical Background

In the early 1990s, machine learning needed methods that could generalize from limited data with clear mathematical guarantees. SVMs translated VC-style capacity control into a practical classifier.

# Canonical Source

- Title: A Training Algorithm for Optimal Margin Classifiers
- Authors: Bernhard E. Boser, Isabelle M. Guyon, and Vladimir N. Vapnik
- Venue: Fifth Annual Workshop on Computational Learning Theory
- Year: 1992
- DOI: See source page when applicable
- URL: https://dl.acm.org/doi/10.1145/130385.130401

# Core Idea

SVMs prefer a boundary that is not merely correct on training data, but comfortably separated from the closest examples. Kernels make nonlinear boundaries possible while preserving a convex optimization problem.

# Key Concepts

- Maximum Margin: The classifier chooses the separating boundary with the widest gap to the nearest training examples.
- Support Vectors: Only the closest examples define the boundary, making the model depend on critical cases rather than all points equally.
- Kernel Trick: Kernels compute similarity as if data had been mapped into a richer space, without explicitly constructing that space.

==================================================
Impact
==================================================

# Impact

## Academic Impact

BenchCouncil AI100 records 63,346 citations for the canonical source associated with this achievement. The work became a reference point for statistical learning and for later systems listed in its related achievements.

## Industrial Impact

The method influenced practical software stacks, benchmarks, and engineering workflows wherever maximum-margin classification with kernels became useful.

## Long-Term Legacy

The AI100 list records 63,346 citations. SVMs influenced text classification, bioinformatics, computer vision, kernel methods, and the broader culture of margin-based learning.

==================================================
Expert Evaluations
==================================================

# Expert Evaluations

- Quote: "optimal margin classifiers"
- Person: Vladimir Vapnik
- Organization: Bell Laboratories
- Year: 1992
- Source URL: https://dl.acm.org/doi/10.1145/130385.130401

Today the achievement is usually evaluated as a durable building block: important not only as an isolated paper, but as a reusable pattern that shaped later AI systems.

==================================================
Multimedia
==================================================

# Photos

- local_image_path: resources/images/bench-council-ai100/explainers/1992-svm_margin-classifier.svg
- title: Support Vector Machines explainer
- caption: Original explainer for SVM
- description: A local diagram summarizing the core workflow without reusing publisher figures.
- source_name: Local explainer based on A Training Algorithm for Optimal Margin Classifiers
- source_page_url: https://dl.acm.org/doi/10.1145/130385.130401
- original_image_url: Local original explainer
- copyright_or_license: Original local explainer; source article or book figures are not reused.
- usage: Explainer graphic

# Video Clips

No video clips selected for this draft.

==================================================
Navigation and Knowledge Graph
==================================================

# Related Achievements

- VC theory
- Kernel methods
- Lasso

# Related Countries

- United States

# Timeline Connections

- Predecessors: earlier work in Statistical Learning and adjacent AI methods.
- Successors: later systems that reused, extended, or reacted to SVM.

==================================================
Museum Metadata
==================================================

```json
{
  "year": "1992",
  "type": "Machine Learning",
  "countries": ["United States"],
  "people": ["Vladimir Vapnik","Bernhard Boser","Isabelle Guyon"],
  "organizations": ["Bell Laboratories"],
  "keywords": ["Statistical Learning","Maximum-margin classification with kernels","SVM"],
  "related_achievements": ["VC theory","Kernel methods","Lasso"]
}
```

==================================================
References
==================================================

# Primary Sources

- Bernhard E. Boser, Isabelle M. Guyon, and Vladimir N. Vapnik. (1992). A Training Algorithm for Optimal Margin Classifiers. Fifth Annual Workshop on Computational Learning Theory. https://dl.acm.org/doi/10.1145/130385.130401

# Secondary Sources

- BenchCouncil AI100 achievement list. https://www.benchcouncil.org/ai100.html
