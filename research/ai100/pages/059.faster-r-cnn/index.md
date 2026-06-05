---
number: 59
achievement: "Faster r-cnn"
area: "Object Detection"
year: "2015"
source_list: "BenchCouncil AI100"
research_status: "draft-complete"
---

# Achievement Name

Faster r-cnn

# Year / Period

2015

# Type

Computer Vision

# One-Sentence Summary

Faster R-CNN made object detection faster by learning region proposals inside the network itself.

# Hero Title

- title: Faster R-CNN

# Hero Description

- description: Earlier R-CNN systems depended on external region proposal algorithms, creating a bottleneck between feature extraction and detection. Faster R-CNN introduced a Region Proposal Network that shares convolutional features with the detector. This unified two-stage pipeline became a standard reference point for accurate object detection.

# People & Place

## Key People

- Name: Shaoqing Ren
  Role: Co-author of Faster R-CNN
  Institution: Microsoft Research Asia
  Country: Beijing, China

- Name: Kaiming He
  Role: Co-author of Faster R-CNN
  Institution: Microsoft Research Asia
  Country: Beijing, China

- Name: Ross Girshick
  Role: Co-author of Faster R-CNN
  Institution: Microsoft Research Asia
  Country: Beijing, China

- Name: Jian Sun
  Role: Co-author of Faster R-CNN
  Institution: Microsoft Research Asia
  Country: Beijing, China

## Key Organizations

- Name: Microsoft Research Asia
- Type: Research organization / university
- Country: Beijing, China

## Key Places

- Beijing, China

==================================================
Core Content
==================================================

# Historical Background

Object detection had made large accuracy gains with R-CNN, but external proposal generation made the pipeline slower and less elegant.

# Canonical Source

- Title: Faster R-CNN: Towards Real-Time Object Detection with Region Proposal Networks
- Authors: Shaoqing Ren, Kaiming He, Ross Girshick, and Jian Sun
- Venue: Neural Information Processing Systems
- Year: 2015
- DOI: See source page when applicable
- URL: https://arxiv.org/abs/1506.01497

# Core Idea

Faster R-CNN trains the network to propose boxes while it is already computing visual features. Detection becomes a learned pipeline rather than a hand-off between unrelated modules.

# Key Concepts

- Region Proposal Network: An RPN predicts likely object boxes directly from convolutional features instead of relying on a separate proposal method.
- Shared Features: Proposal generation and object classification reuse the same feature maps, improving speed and consistency.
- Two-Stage Detection: The system first proposes candidate boxes and then refines class labels and bounding boxes.

==================================================
Impact
==================================================

# Impact

## Academic Impact

BenchCouncil AI100 records 65,754 citations for the canonical source associated with this achievement. The work became a reference point for object detection and for later systems listed in its related achievements.

## Industrial Impact

The method influenced practical software stacks, benchmarks, and engineering workflows wherever region proposal network with shared features became useful.

## Expert Evaluation

The AI100 list records 65,754 citations. Faster R-CNN shaped detection benchmarks, annotation tools, autonomous-driving perception, robotics, and medical-imaging pipelines.

==================================================
Expert Evaluations
==================================================

# Expert Evaluations

- Quote: "towards real-time object detection"
- Person: Shaoqing Ren
- Organization: Microsoft Research Asia
- Year: 2015
- Source URL: https://arxiv.org/abs/1506.01497

Today the achievement is usually evaluated as a durable building block: important not only as an isolated paper, but as a reusable pattern that shaped later AI systems.

==================================================
Multimedia
==================================================

# Photos

- local_image_path: resources/images/bench-council-ai100/explainers/2015-faster-r-cnn_region-proposals.svg
- title: Faster R-CNN explainer
- caption: Original explainer for Faster r-cnn
- description: A local diagram summarizing the core workflow without reusing publisher figures.
- source_name: Local explainer based on Faster R-CNN: Towards Real-Time Object Detection with Region Proposal Networks
- source_page_url: https://arxiv.org/abs/1506.01497
- original_image_url: Local original explainer
- copyright_or_license: Original local explainer; source article or book figures are not reused.
- usage: Explainer graphic

# Video Clips

No video clips selected for this draft.

==================================================
Navigation and Knowledge Graph
==================================================

# Related Achievements

- R-CNN
- ResNet
- YOLO

# Related Countries

- China
- United States

# Timeline Connections

- Predecessors: earlier work in Object Detection and adjacent AI methods.
- Successors: later systems that reused, extended, or reacted to Faster r-cnn.

==================================================
Museum Metadata
==================================================

```json
{
  "year": "2015",
  "type": "Computer Vision",
  "countries": ["China","United States"],
  "people": ["Shaoqing Ren","Kaiming He","Ross Girshick","Jian Sun"],
  "organizations": ["Microsoft Research Asia"],
  "keywords": ["Object Detection","Region Proposal Network with shared features","Faster r-cnn"],
  "related_achievements": ["R-CNN","ResNet","YOLO"]
}
```

==================================================
References
==================================================

# Primary Sources

- Shaoqing Ren, Kaiming He, Ross Girshick, and Jian Sun. (2015). Faster R-CNN: Towards Real-Time Object Detection with Region Proposal Networks. Neural Information Processing Systems. https://arxiv.org/abs/1506.01497

# Secondary Sources

- BenchCouncil AI100 achievement list. https://www.benchcouncil.org/ai100.html
