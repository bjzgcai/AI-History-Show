---
number: 52
achievement: "GoogLeNet"
area: "Computer Vision"
year: "2014-2015"
source_list: "BenchCouncil AI100"
research_status: "draft-complete"
---

# Achievement Name

GoogLeNet

# Year / Period

2014-2015

# Type

Computer Vision

# One-Sentence Summary

GoogLeNet used Inception modules to process visual features at several scales while keeping computation efficient.

# Hero Title

- title: GoogLeNet / Inception

# Hero Description

- description: GoogLeNet showed that depth did not have to mean a simple chain of layers. Its Inception modules run several filter sizes in parallel, then concatenate the outputs, using bottlenecks to manage computation. The architecture won ImageNet 2014 and influenced later efficient, modular CNN design.

# People & Place

## Key People

- Name: Christian Szegedy
  Role: Lead author of the GoogLeNet paper
  Institution: Google
  Country: Mountain View, United States

- Name: Google research team
  Role: Developed the Inception architecture
  Institution: Google
  Country: Mountain View, United States

## Key Organizations

- Name: Google
- Type: Research organization / university
- Country: Mountain View, United States

## Key Places

- Mountain View, United States

==================================================
Core Content
==================================================

# Historical Background

After AlexNet and VGG, CNNs were becoming deeper and more compute-hungry. Google’s team explored how to increase representational power without simply scaling every layer.

# Canonical Source

- Title: Going Deeper with Convolutions
- Authors: Christian Szegedy et al.
- Venue: IEEE Conference on Computer Vision and Pattern Recognition
- Year: 2015
- DOI: See source page when applicable
- URL: https://www.cv-foundation.org/openaccess/content_cvpr_2015/html/Szegedy_Going_Deeper_With_2015_CVPR_paper.html

# Core Idea

An Inception module asks the network to choose among several receptive-field sizes at once. 1x1 bottlenecks keep this multi-branch design affordable.

# Key Concepts

- Inception Module: Several convolution and pooling paths run in parallel, letting the network capture patterns at multiple scales.
- Bottleneck Layers: 1x1 convolutions reduce channel counts before expensive operations, improving computational efficiency.
- Parameter Efficiency: The architecture increases depth and width while controlling memory and compute cost.

==================================================
Impact
==================================================

# Impact

## Academic Impact

BenchCouncil AI100 records 54,115 citations for the canonical source associated with this achievement. The work became a reference point for computer vision and for later systems listed in its related achievements.

## Industrial Impact

The method influenced practical software stacks, benchmarks, and engineering workflows wherever multi-scale inception modules became useful.

## Expert Evaluation

The AI100 list records 54,115 citations. Inception influenced modular CNNs, efficient architecture search, and the idea that neural-network blocks can be designed as reusable computation patterns.

==================================================
Expert Evaluations
==================================================

# Expert Evaluations

- Quote: "going deeper with convolutions"
- Person: Christian Szegedy
- Organization: Google
- Year: 2015
- Source URL: https://www.cv-foundation.org/openaccess/content_cvpr_2015/html/Szegedy_Going_Deeper_With_2015_CVPR_paper.html

Today the achievement is usually evaluated as a durable building block: important not only as an isolated paper, but as a reusable pattern that shaped later AI systems.

==================================================
Multimedia
==================================================

# Photos

- local_image_path: resources/images/bench-council-ai100/explainers/2015-googlenet-inception_multi-scale.svg
- title: GoogLeNet / Inception explainer
- caption: Original explainer for GoogLeNet
- description: A local diagram summarizing the core workflow without reusing publisher figures.
- source_name: Local explainer based on Going Deeper with Convolutions
- source_page_url: https://www.cv-foundation.org/openaccess/content_cvpr_2015/html/Szegedy_Going_Deeper_With_2015_CVPR_paper.html
- original_image_url: Local original explainer
- copyright_or_license: Original local explainer; source article or book figures are not reused.
- usage: Explainer graphic

# Video Clips

No video clips selected for this draft.

==================================================
Navigation and Knowledge Graph
==================================================

# Related Achievements

- VGG
- ResNet
- AlexNet

# Related Countries

- United States

# Timeline Connections

- Predecessors: earlier work in Computer Vision and adjacent AI methods.
- Successors: later systems that reused, extended, or reacted to GoogLeNet.

==================================================
Museum Metadata
==================================================

```json
{
  "year": "2014-2015",
  "type": "Computer Vision",
  "countries": ["United States"],
  "people": ["Christian Szegedy","Google research team"],
  "organizations": ["Google"],
  "keywords": ["Computer Vision","Multi-scale Inception modules","GoogLeNet"],
  "related_achievements": ["VGG","ResNet","AlexNet"]
}
```

==================================================
References
==================================================

# Primary Sources

- Christian Szegedy et al.. (2015). Going Deeper with Convolutions. IEEE Conference on Computer Vision and Pattern Recognition. https://www.cv-foundation.org/openaccess/content_cvpr_2015/html/Szegedy_Going_Deeper_With_2015_CVPR_paper.html

# Secondary Sources

- BenchCouncil AI100 achievement list. https://www.benchcouncil.org/ai100.html
