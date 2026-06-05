---
number: 45
achievement: "Adam"
area: "Optimization"
year: "2014"
source_list: "BenchCouncil AI100"
research_status: "draft-complete"
---

# Achievement Name

Adam

# Year / Period

2014

# Type

Machine Learning

# One-Sentence Summary

Adam made neural-network training easier to tune by combining momentum-like first moments with adaptive second-moment scaling.

# Hero Title

- title: Adam Optimizer

# Hero Description

- description: Adam became one of the default optimizers of modern deep learning because it adapts each parameter step from running estimates of gradients and squared gradients. Kingma and Ba published it in 2014 as a simple, efficient stochastic optimization method that worked well across noisy objectives. Its influence is visible in nearly every deep-learning framework and in later variants such as AdamW.

# People & Place

## Key People

- Name: Diederik P. Kingma
  Role: Co-author of Adam
  Institution: University of Amsterdam / University of Toronto
  Country: Amsterdam, Netherlands and Toronto, Canada

- Name: Jimmy Ba
  Role: Co-author of Adam
  Institution: University of Amsterdam / University of Toronto
  Country: Amsterdam, Netherlands and Toronto, Canada

## Key Organizations

- Name: University of Amsterdam / University of Toronto
- Type: Research organization / university
- Country: Amsterdam, Netherlands and Toronto, Canada

## Key Places

- Amsterdam, Netherlands and Toronto, Canada

==================================================
Core Content
==================================================

# Historical Background

By 2014, deep networks were becoming larger and noisier to train. Researchers needed optimizers that reduced hand-tuning while still working with minibatches, sparse gradients, and nonstationary objectives.

# Canonical Source

- Title: Adam: A Method for Stochastic Optimization
- Authors: Diederik P. Kingma and Jimmy Ba
- Venue: International Conference on Learning Representations
- Year: 2015
- DOI: See source page when applicable
- URL: https://arxiv.org/abs/1412.6980

# Core Idea

Adam merges the direction memory of momentum with the per-parameter scaling of RMSProp. The result is a compact update rule that usually reaches useful training regimes quickly.

# Key Concepts

- First Moment: A running average of gradients behaves like momentum, keeping updates aligned with persistent descent directions.
- Second Moment: A running average of squared gradients rescales each parameter so frequent large gradients do not dominate every step.
- Bias Correction: Adam corrects early moving averages that start near zero, making the first optimization steps less distorted.

==================================================
Impact
==================================================

# Impact

## Academic Impact

BenchCouncil AI100 records 162,259 citations for the canonical source associated with this achievement. The work became a reference point for optimization and for later systems listed in its related achievements.

## Industrial Impact

The method influenced practical software stacks, benchmarks, and engineering workflows wherever adaptive first- and second-moment updates became useful.

## Long-Term Legacy

The AI100 list records 162,259 citations for the Adam paper. Adam remains a baseline optimizer in research code, production training stacks, and teaching material, even when later variants are chosen for final runs.

==================================================
Expert Evaluations
==================================================

# Expert Evaluations

- Quote: "straightforward to implement, computationally efficient"
- Person: Diederik P. Kingma
- Organization: University of Amsterdam / University of Toronto
- Year: 2015
- Source URL: https://arxiv.org/abs/1412.6980

Today the achievement is usually evaluated as a durable building block: important not only as an isolated paper, but as a reusable pattern that shaped later AI systems.

==================================================
Multimedia
==================================================

# Photos

- local_image_path: resources/images/bench-council-ai100/explainers/2014-adam_moment-optimizer.svg
- title: Adam Optimizer explainer
- caption: Original explainer for Adam
- description: A local diagram summarizing the core workflow without reusing publisher figures.
- source_name: Local explainer based on Adam: A Method for Stochastic Optimization
- source_page_url: https://arxiv.org/abs/1412.6980
- original_image_url: Local original explainer
- copyright_or_license: Original local explainer; source article or book figures are not reused.
- usage: Explainer graphic

# Video Clips

No video clips selected for this draft.

==================================================
Navigation and Knowledge Graph
==================================================

# Related Achievements

- Backpropagation
- RMSProp
- Transformer training

# Related Countries

- Netherlands
- Canada

# Timeline Connections

- Predecessors: earlier work in Optimization and adjacent AI methods.
- Successors: later systems that reused, extended, or reacted to Adam.

==================================================
Museum Metadata
==================================================

```json
{
  "year": "2014",
  "type": "Machine Learning",
  "countries": ["Netherlands","Canada"],
  "people": ["Diederik P. Kingma","Jimmy Ba"],
  "organizations": ["University of Amsterdam / University of Toronto"],
  "keywords": ["Optimization","Adaptive first- and second-moment updates","Adam"],
  "related_achievements": ["Backpropagation","RMSProp","Transformer training"]
}
```

==================================================
References
==================================================

# Primary Sources

- Diederik P. Kingma and Jimmy Ba. (2015). Adam: A Method for Stochastic Optimization. International Conference on Learning Representations. https://arxiv.org/abs/1412.6980

# Secondary Sources

- BenchCouncil AI100 achievement list. https://www.benchcouncil.org/ai100.html
