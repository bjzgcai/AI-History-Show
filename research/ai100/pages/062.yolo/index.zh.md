# YOLO

## Full Name
You Only Look Once: Unified, Real-Time Object Detection

## Year / Period
2016

## Type
神经网络

## One-Sentence Summary
YOLO 是 AI100 中的重要成就，连接了 神经网络 与后续 AI 系统的发展。

## Hero Description
YOLO 把目标检测重新表述为单次回归问题。它不再先提候选区域再逐个分类，而是让一个网络从整张图一次性预测边界框和类别概率。这个思路让实时目标检测成为主流工程目标。

## People & Place
- Joseph Redmon: YOLO 第一作者
- Ali Farhadi: YOLO 共同作者

Key place: 华盛顿大学 / Allen Institute for AI

## Historical Background
YOLO 之前，高精度检测器常依赖多阶段管线。YOLO 追问：如果检测变成一个稠密预测问题会怎样？

## Canonical Source
You Only Look Once: Unified, Real-Time Object Detection. Joseph Redmon, Santosh Divvala, Ross Girshick, Ali Farhadi, CVPR, 2016. https://arxiv.org/abs/1506.02640

## Core Idea
图像被划成网格；每个网格单元一次前向传播就预测框、置信度和类别。

## Key Concepts
- 网格预测: 每个网格单元负责中心落在其中的目标。
- 一次前向传播: 检测在一次网络前向传播中完成，而不是候选区域级联。
- 实时性: 速度成为模型身份的一部分，而不是后期部署细节。

## Impact
YOLO 让速度成为一等指标，并影响了一长串实时检测器。

## Photos
- local_image_path: resources/images/bench-council-ai100/photos/2016-yolo_joseph-redmon.jpg
  title: Joseph Redmon 肖像
  source_name: University of Washington Allen School
  source_page_url: https://news.cs.washington.edu/2018/04/05/allen-schools-joseph-redmon-wins-google-ph-d-fellowship/
  original_image_url: https://news.cs.washington.edu/wp-content/uploads/2018/04/joseph-redmon-allen-school.jpg
  copyright_or_license: Institution news image; rights not stated.
- local_image_path: resources/images/bench-council-ai100/explainers/2016-yolo_grid-detector.svg
  title: 网格检测器
  source_name: CVPR / arXiv
  source_page_url: https://arxiv.org/abs/1506.02640
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.
- local_image_path: resources/images/bench-council-ai100/explainers/2016-yolo_single-pass.svg
  title: 单次前向管线
  source_name: CVPR / arXiv
  source_page_url: https://arxiv.org/abs/1506.02640
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.

## Related Achievements
- Faster R-CNN
- SSD
- 实时视觉

## Museum Metadata
{
  "year": "2016",
  "type": "神经网络",
  "people": ["Joseph Redmon","Ali Farhadi"],
  "keywords": ["vision","object-detection"]
}

## References
- 论文: You Only Look Once: Unified, Real-Time Object Detection. https://arxiv.org/abs/1506.02640
- 开放论文: CVPR open-access paper page. https://openaccess.thecvf.com/content_cvpr_2016/html/Redmon_You_Only_Look_CVPR_2016_paper.html
- 项目: Darknet YOLO project page. https://pjreddie.com/darknet/yolo/
