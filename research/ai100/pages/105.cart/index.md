---
number: 105
achievement: "CART"
area: "Decision Trees"
year: "1984"
source_list: "BenchCouncil AI100"
research_status: "draft-complete"
---

# Achievement Name

CART

# Year / Period

1984

# Type

Machine Learning

# One-Sentence Summary

CART established decision trees as a rigorous, practical framework for classification and regression.

# Hero Title

- title: CART

# Hero Description

- description: CART gave decision trees a durable statistical form: recursively split data, measure impurity, grow a tree, and prune it back to control overfitting. The method made models interpretable as if-then paths while still handling nonlinear interactions. It became a foundation for random forests, gradient boosting, and modern tree ensembles.

# People & Place

## Key People

- Name: Leo Breiman
  Role: Co-author of the CART monograph
  Institution: University of California, Berkeley
  Country: Berkeley, United States

- Name: Jerome Friedman
  Role: Co-author of the CART monograph
  Institution: University of California, Berkeley
  Country: Berkeley, United States

- Name: Richard Olshen
  Role: Co-author of the CART monograph
  Institution: University of California, Berkeley
  Country: Berkeley, United States

- Name: Charles Stone
  Role: Co-author of the CART monograph
  Institution: University of California, Berkeley
  Country: Berkeley, United States

## Key Organizations

- Name: University of California, Berkeley
- Type: Research organization / university
- Country: Berkeley, United States

## Key Places

- Berkeley, United States

==================================================
Core Content
==================================================

# Historical Background

Decision rules were attractive because they were interpretable, but they needed a disciplined statistical procedure. CART supplied that procedure for both categorical and numeric outcomes.

# Canonical Source

- Title: Classification and Regression Trees
- Authors: Leo Breiman, Jerome H. Friedman, Richard A. Olshen, and Charles J. Stone
- Venue: Wadsworth / Routledge monograph
- Year: 1984
- DOI: See source page when applicable
- URL: https://www.routledge.com/Classification-and-Regression-Trees/Breiman-Friedman-Olshen-Stone/p/book/9780412048418

# Core Idea

CART grows a tree by choosing splits that make child nodes more homogeneous. It then prunes the tree so the final model balances fit and simplicity.

# Key Concepts

- Recursive Partitioning: The tree repeatedly splits the feature space into simpler regions where predictions become easier.
- Impurity: Measures such as Gini impurity guide which split best separates classes or reduces prediction error.
- Pruning: A large tree is cut back to reduce overfitting and improve performance on unseen data.

==================================================
Impact
==================================================

# Impact

## Academic Impact

BenchCouncil AI100 records 61,639 citations for the canonical source associated with this achievement. The work became a reference point for decision trees and for later systems listed in its related achievements.

## Industrial Impact

The method influenced practical software stacks, benchmarks, and engineering workflows wherever recursive partitioning with pruning became useful.

## Expert Evaluation

The AI100 list records 61,639 citations. CART is still visible inside random forests, boosted trees, explainable modeling, tabular ML, and clinical decision support.

==================================================
Expert Evaluations
==================================================

# Expert Evaluations

- Quote: "classification and regression trees"
- Person: Leo Breiman
- Organization: University of California, Berkeley
- Year: 1984
- Source URL: https://www.routledge.com/Classification-and-Regression-Trees/Breiman-Friedman-Olshen-Stone/p/book/9780412048418

Today the achievement is usually evaluated as a durable building block: important not only as an isolated paper, but as a reusable pattern that shaped later AI systems.

==================================================
Multimedia
==================================================

# Photos

- local_image_path: resources/images/bench-council-ai100/explainers/1984-cart_tree-splits.svg
- title: CART explainer
- caption: Original explainer for CART
- description: A local diagram summarizing the core workflow without reusing publisher figures.
- source_name: Local explainer based on Classification and Regression Trees
- source_page_url: https://www.routledge.com/Classification-and-Regression-Trees/Breiman-Friedman-Olshen-Stone/p/book/9780412048418
- original_image_url: Local original explainer
- copyright_or_license: Original local explainer; source article or book figures are not reused.
- usage: Explainer graphic

# Video Clips

No video clips selected for this draft.

==================================================
Navigation and Knowledge Graph
==================================================

# Related Achievements

- Random forests
- Gradient boosting
- Lasso

# Related Countries

- United States

# Timeline Connections

- Predecessors: earlier work in Decision Trees and adjacent AI methods.
- Successors: later systems that reused, extended, or reacted to CART.

==================================================
Museum Metadata
==================================================

```json
{
  "year": "1984",
  "type": "Machine Learning",
  "countries": ["United States"],
  "people": ["Leo Breiman","Jerome Friedman","Richard Olshen","Charles Stone"],
  "organizations": ["University of California, Berkeley"],
  "keywords": ["Decision Trees","Recursive partitioning with pruning","CART"],
  "related_achievements": ["Random forests","Gradient boosting","Lasso"]
}
```

==================================================
References
==================================================

# Primary Sources

- Leo Breiman, Jerome H. Friedman, Richard A. Olshen, and Charles J. Stone. (1984). Classification and Regression Trees. Wadsworth / Routledge monograph. https://www.routledge.com/Classification-and-Regression-Trees/Breiman-Friedman-Olshen-Stone/p/book/9780412048418

# Secondary Sources

- BenchCouncil AI100 achievement list. https://www.benchcouncil.org/ai100.html
