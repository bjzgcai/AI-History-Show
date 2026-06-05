# YOLO

## Full Name
You Only Look Once: Unified, Real-Time Object Detection

## Year / Period
2016

## Type
Neural Network

## One-Sentence Summary
YOLO is a major AI100 achievement connecting Neural Network to later AI systems.

## Hero Description
YOLO reframed object detection as a single regression problem. Instead of proposing regions and classifying them separately, one network predicted bounding boxes and class probabilities from the whole image in one pass. The result made real-time object detection a mainstream engineering target.

## People & Place
- Joseph Redmon: First author of YOLO
- Ali Farhadi: Co-author of YOLO

Key place: University of Washington / Allen Institute for AI

## Historical Background
Before YOLO, high-accuracy detectors often relied on multi-stage pipelines. YOLO asked what would happen if detection became one dense prediction problem.

## Canonical Source
You Only Look Once: Unified, Real-Time Object Detection. Joseph Redmon, Santosh Divvala, Ross Girshick, Ali Farhadi, CVPR, 2016. https://arxiv.org/abs/1506.02640

## Core Idea
The image is divided into a grid; each cell predicts boxes, confidence, and classes, all in one forward pass.

## Key Concepts
- Grid Prediction: Each grid cell is responsible for objects whose centers fall inside it.
- One Forward Pass: Detection happens in a single network pass instead of a proposal cascade.
- Real Time: Speed becomes part of the model’s identity, not a later deployment detail.

## Impact
YOLO made speed a first-class metric and influenced a long family of real-time detectors.

## Photos
- local_image_path: resources/images/bench-council-ai100/photos/2016-yolo_joseph-redmon.jpg
  title: Joseph Redmon portrait
  source_name: University of Washington Allen School
  source_page_url: https://news.cs.washington.edu/2018/04/05/allen-schools-joseph-redmon-wins-google-ph-d-fellowship/
  original_image_url: https://news.cs.washington.edu/wp-content/uploads/2018/04/joseph-redmon-allen-school.jpg
  copyright_or_license: Institution news image; rights not stated.
- local_image_path: resources/images/bench-council-ai100/explainers/2016-yolo_grid-detector.svg
  title: Grid detector
  source_name: CVPR / arXiv
  source_page_url: https://arxiv.org/abs/1506.02640
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.
- local_image_path: resources/images/bench-council-ai100/explainers/2016-yolo_single-pass.svg
  title: Single-pass pipeline
  source_name: CVPR / arXiv
  source_page_url: https://arxiv.org/abs/1506.02640
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.

## Related Achievements
- Faster R-CNN
- SSD
- Real-time vision

## Museum Metadata
{
  "year": "2016",
  "type": "Neural Network",
  "people": ["Joseph Redmon","Ali Farhadi"],
  "keywords": ["vision","object-detection"]
}

## References
- Paper: You Only Look Once: Unified, Real-Time Object Detection. https://arxiv.org/abs/1506.02640
- Open access: CVPR open-access paper page. https://openaccess.thecvf.com/content_cvpr_2016/html/Redmon_You_Only_Look_CVPR_2016_paper.html
- Project: Darknet YOLO project page. https://pjreddie.com/darknet/yolo/
