---
number: 51
achievement: "VGG"
area: "Computer Vision"
year: "2014"
source_list: "BenchCouncil AI100"
research_status: "draft-complete"
---

# Achievement Name

VGG

# Year / Period

2014

# Type

Computer Vision

# One-Sentence Summary

VGG showed that simple, repeated 3x3 convolutional blocks could scale visual recognition through depth.

# Hero Title

- title: VGG Networks

# Hero Description

- description: VGG made convolutional networks feel like a disciplined architecture language: small filters, repeated blocks, occasional pooling, and great depth. The 2014 Oxford work was not the fastest or smallest model, but it became a canonical feature extractor and teaching example. Its clarity helped later researchers reason about depth before residual and dense connections became standard.

# People & Place

## Key People

- Name: Karen Simonyan
  Role: Co-author of the VGG paper
  Institution: Visual Geometry Group, University of Oxford
  Country: Oxford, United Kingdom

- Name: Andrew Zisserman
  Role: Co-author and Visual Geometry Group lead
  Institution: Visual Geometry Group, University of Oxford
  Country: Oxford, United Kingdom

## Key Organizations

- Name: Visual Geometry Group, University of Oxford
- Type: Research organization / university
- Country: Oxford, United Kingdom

## Key Places

- Oxford, United Kingdom

==================================================
Core Content
==================================================

# Historical Background

After AlexNet, the field knew that large CNNs could win ImageNet, but the design space was still messy. VGG asked how far a simple homogeneous design could go if depth was increased carefully.

# Canonical Source

- Title: Very Deep Convolutional Networks for Large-Scale Image Recognition
- Authors: Karen Simonyan and Andrew Zisserman
- Venue: International Conference on Learning Representations
- Year: 2015
- DOI: See source page when applicable
- URL: https://arxiv.org/abs/1409.1556

# Core Idea

Instead of mixing many filter sizes, VGG stacks small convolutions in a regular pattern. The network becomes deeper without turning the architecture into a collection of special cases.

# Key Concepts

- 3x3 Filters: VGG repeatedly uses small filters, letting several layers build a larger effective receptive field while adding nonlinearities.
- Network Depth: The paper systematically increased depth and showed that deeper convolutional stacks improved large-scale recognition.
- Transfer Features: Pretrained VGG features became a common starting point for detection, segmentation, style transfer, and visualization.

==================================================
Impact
==================================================

# Impact

## Academic Impact

BenchCouncil AI100 records 111,338 citations for the canonical source associated with this achievement. The work became a reference point for computer vision and for later systems listed in its related achievements.

## Industrial Impact

The method influenced practical software stacks, benchmarks, and engineering workflows wherever very deep stacks of 3x3 convolutions became useful.

## Expert Evaluation

The AI100 list records 111,338 citations. VGG is still a reference point for visual features, perceptual losses, and the historical transition from shallow CNNs to very deep models.

==================================================
Expert Evaluations
==================================================

# Expert Evaluations

- Quote: "very deep convolutional networks"
- Person: Karen Simonyan
- Organization: Visual Geometry Group, University of Oxford
- Year: 2015
- Source URL: https://arxiv.org/abs/1409.1556

Today the achievement is usually evaluated as a durable building block: important not only as an isolated paper, but as a reusable pattern that shaped later AI systems.

==================================================
Multimedia
==================================================

# Photos

- local_image_path: resources/images/bench-council-ai100/explainers/2014-vgg_depth-stack.svg
- title: VGG Networks explainer
- caption: Original explainer for VGG
- description: A local diagram summarizing the core workflow without reusing publisher figures.
- source_name: Local explainer based on Very Deep Convolutional Networks for Large-Scale Image Recognition
- source_page_url: https://arxiv.org/abs/1409.1556
- original_image_url: Local original explainer
- copyright_or_license: Original local explainer; source article or book figures are not reused.
- usage: Explainer graphic

# Video Clips

No video clips selected for this draft.

==================================================
Navigation and Knowledge Graph
==================================================

# Related Achievements

- AlexNet
- ResNet
- GoogLeNet / Inception

# Related Countries

- United Kingdom

# Timeline Connections

- Predecessors: earlier work in Computer Vision and adjacent AI methods.
- Successors: later systems that reused, extended, or reacted to VGG.

==================================================
Museum Metadata
==================================================

```json
{
  "year": "2014",
  "type": "Computer Vision",
  "countries": ["United Kingdom"],
  "people": ["Karen Simonyan","Andrew Zisserman"],
  "organizations": ["Visual Geometry Group, University of Oxford"],
  "keywords": ["Computer Vision","Very deep stacks of 3x3 convolutions","VGG"],
  "related_achievements": ["AlexNet","ResNet","GoogLeNet / Inception"]
}
```

==================================================
References
==================================================

# Primary Sources

- Karen Simonyan and Andrew Zisserman. (2015). Very Deep Convolutional Networks for Large-Scale Image Recognition. International Conference on Learning Representations. https://arxiv.org/abs/1409.1556

# Secondary Sources

- BenchCouncil AI100 achievement list. https://www.benchcouncil.org/ai100.html
