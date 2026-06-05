---
number: 28
achievement: "Lasso"
area: "Statistical Learning"
year: "1996"
source_list: "BenchCouncil AI100"
research_status: "draft-complete"
---

# Achievement Name

Lasso

# Year / Period

1996

# Type

Machine Learning

# One-Sentence Summary

Lasso made prediction and feature selection happen together by using an L1 penalty that drives some coefficients to zero.

# Hero Title

- title: Lasso

# Hero Description

- description: The lasso gave statisticians and machine-learning practitioners a clean way to build sparse linear models. By penalizing the absolute size of coefficients, it both regularizes predictions and performs variable selection. Its ideas now appear in sparse modeling, high-dimensional statistics, compressed sensing, bioinformatics, and interpretable ML.

# People & Place

## Key People

- Name: Robert Tibshirani
  Role: Introduced the lasso method
  Institution: University of Toronto
  Country: Toronto, Canada

## Key Organizations

- Name: University of Toronto
- Type: Research organization / university
- Country: Toronto, Canada

## Key Places

- Toronto, Canada

==================================================
Core Content
==================================================

# Historical Background

As datasets grew wider, analysts needed models that could avoid overfitting and identify useful variables. Ridge regression shrank coefficients, but it did not usually set them to zero.

# Canonical Source

- Title: Regression Shrinkage and Selection via the Lasso
- Authors: Robert Tibshirani
- Venue: Journal of the Royal Statistical Society: Series B
- Year: 1996
- DOI: See source page when applicable
- URL: https://rss.onlinelibrary.wiley.com/doi/10.1111/j.2517-6161.1996.tb02080.x

# Core Idea

The lasso adds an L1 penalty to regression. The geometry of that penalty naturally creates exact zeros, so prediction and selection are tied together.

# Key Concepts

- L1 Penalty: The sum of absolute coefficient values is penalized, encouraging some coefficients to become exactly zero.
- Sparsity: A sparse model uses only a subset of variables, which can improve interpretability and robustness.
- Variable Selection: Lasso chooses predictors as part of fitting the model instead of requiring a separate feature-selection step.

==================================================
Impact
==================================================

# Impact

## Academic Impact

BenchCouncil AI100 records 55,395 citations for the canonical source associated with this achievement. The work became a reference point for statistical learning and for later systems listed in its related achievements.

## Industrial Impact

The method influenced practical software stacks, benchmarks, and engineering workflows wherever l1-regularized regression and selection became useful.

## Expert Evaluation

The AI100 list records 55,395 citations. Lasso remains central in high-dimensional statistics, sparse learning, genomics, and interpretable baseline modeling.

==================================================
Expert Evaluations
==================================================

# Expert Evaluations

- Quote: "regression shrinkage and selection"
- Person: Robert Tibshirani
- Organization: University of Toronto
- Year: 1996
- Source URL: https://rss.onlinelibrary.wiley.com/doi/10.1111/j.2517-6161.1996.tb02080.x

Today the achievement is usually evaluated as a durable building block: important not only as an isolated paper, but as a reusable pattern that shaped later AI systems.

==================================================
Multimedia
==================================================

# Photos

- local_image_path: resources/images/bench-council-ai100/explainers/1996-lasso_sparse-regression.svg
- title: Lasso explainer
- caption: Original explainer for Lasso
- description: A local diagram summarizing the core workflow without reusing publisher figures.
- source_name: Local explainer based on Regression Shrinkage and Selection via the Lasso
- source_page_url: https://rss.onlinelibrary.wiley.com/doi/10.1111/j.2517-6161.1996.tb02080.x
- original_image_url: Local original explainer
- copyright_or_license: Original local explainer; source article or book figures are not reused.
- usage: Explainer graphic

# Video Clips

No video clips selected for this draft.

==================================================
Navigation and Knowledge Graph
==================================================

# Related Achievements

- SVM
- CART
- Compressed sensing

# Related Countries

- Canada
- United States

# Timeline Connections

- Predecessors: earlier work in Statistical Learning and adjacent AI methods.
- Successors: later systems that reused, extended, or reacted to Lasso.

==================================================
Museum Metadata
==================================================

```json
{
  "year": "1996",
  "type": "Machine Learning",
  "countries": ["Canada","United States"],
  "people": ["Robert Tibshirani"],
  "organizations": ["University of Toronto"],
  "keywords": ["Statistical Learning","L1-regularized regression and selection","Lasso"],
  "related_achievements": ["SVM","CART","Compressed sensing"]
}
```

==================================================
References
==================================================

# Primary Sources

- Robert Tibshirani. (1996). Regression Shrinkage and Selection via the Lasso. Journal of the Royal Statistical Society: Series B. https://rss.onlinelibrary.wiley.com/doi/10.1111/j.2517-6161.1996.tb02080.x

# Secondary Sources

- BenchCouncil AI100 achievement list. https://www.benchcouncil.org/ai100.html
