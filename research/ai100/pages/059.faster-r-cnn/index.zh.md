---
number: 59
achievement: "Faster r-cnn"
area: "目标检测"
year: "2015"
source_list: "BenchCouncil AI100"
research_status: "draft-complete"
---

# 成就名称

Faster R-CNN

# 年份 / 时期

2015

# 类型

Computer Vision

# 一句话总结

Faster R-CNN 通过在网络内部学习候选区域，让目标检测变得更快。

# 主视觉标题

- title: Faster R-CNN

# 主视觉描述

- description: 早期 R-CNN 系统依赖外部候选区域算法，在特征提取与检测之间形成瓶颈。Faster R-CNN 引入区域建议网络，与检测器共享卷积特征。这个统一的两阶段流水线成为高精度目标检测的标准参照。

# 人物与地点

## 关键人物

- 姓名：任少卿 (Shaoqing Ren)
  角色：Faster R-CNN 共同作者
  机构：微软亚洲研究院
  国家/地区：中国北京

- 姓名：何恺明 (Kaiming He)
  角色：Faster R-CNN 共同作者
  机构：微软亚洲研究院
  国家/地区：中国北京

- 姓名：Ross Girshick
  角色：Faster R-CNN 共同作者
  机构：微软亚洲研究院
  国家/地区：中国北京

- 姓名：孙剑 (Jian Sun)
  角色：Faster R-CNN 共同作者
  机构：微软亚洲研究院
  国家/地区：中国北京

## 关键机构

- 名称：微软亚洲研究院
- 类型：研究机构 / 大学
- 国家/地区：中国北京

## 关键地点

- 中国北京

==================================================
核心内容
==================================================

# 历史背景

R-CNN 已经大幅提升目标检测精度，但外部候选区域生成让流水线变慢且不够统一。

# 经典来源

- 标题：Faster R-CNN: Towards Real-Time Object Detection with Region Proposal Networks
- 作者：Shaoqing Ren, Kaiming He, Ross Girshick, and Jian Sun
- 发表处：Neural Information Processing Systems
- 年份：2015
- DOI：如适用见来源页面
- URL：https://arxiv.org/abs/1506.01497

# 核心思想

Faster R-CNN 让网络在计算视觉特征的同时学习提出候选框。检测因此成为学习型流水线，而不是无关模块之间的交接。

# 关键概念

- 区域建议网络：RPN 直接从卷积特征预测可能的目标框，而不是依赖外部候选区域方法。
- 共享特征：候选区域生成与目标分类复用同一组特征图，提高速度和一致性。
- 两阶段检测：系统先提出候选框，再细化类别标签和边界框。

==================================================
影响力
==================================================

# 影响

## 学术影响

BenchCouncil AI100 为该成就关联的经典来源记录了 65,754 次引用。它成为 目标检测 的重要参照，也影响了相关成就中的后续系统。

## 产业影响

当 共享特征的区域建议网络 在工程中变得有用时，这一方法影响了实际软件栈、基准测试和工程流程。

## 长期遗产

AI100 清单记录引用数为 65,754。Faster R-CNN 影响了检测基准、标注工具、自动驾驶感知、机器人和医学图像流水线。

==================================================
专家评价
==================================================

# 专家评价

- 引文：“迈向实时目标检测”
- 人物：任少卿 (Shaoqing Ren)
- 机构：微软亚洲研究院
- 年份：2015
- 来源 URL：https://arxiv.org/abs/1506.01497

今天，这项成就通常被视为持久的基础构件：它的重要性不仅在于单篇论文，也在于形成了可复用的模式，并塑造了后来的 AI 系统。

==================================================
多媒体
==================================================

# 图片

- local_image_path: resources/images/bench-council-ai100/explainers/2015-faster-r-cnn_region-proposals.svg
- title: Faster R-CNN解释图
- caption: Faster R-CNN 的原创解释图
- description: 本地图解总结核心流程，不复用出版社图表。
- source_name: Local explainer based on Faster R-CNN: Towards Real-Time Object Detection with Region Proposal Networks
- source_page_url: https://arxiv.org/abs/1506.01497
- original_image_url: Local original explainer
- copyright_or_license: Original local explainer; source article or book figures are not reused.
- usage: 解释性图形

# 视频

本草稿未选择视频。

==================================================
导航与知识图谱
==================================================

# 相关成就

- R-CNN
- ResNet
- YOLO

# 相关国家/地区

- 中国
- 美国

# 时间线连接

- 前驱工作：目标检测 及相邻 AI 方法中的早期工作。
- 后续工作：复用、扩展或回应 Faster R-CNN 的后续系统。

==================================================
Museum Metadata
==================================================

```json
{
  "year": "2015",
  "type": "Computer Vision",
  "countries": ["中国","美国"],
  "people": ["任少卿 (Shaoqing Ren)","何恺明 (Kaiming He)","Ross Girshick","孙剑 (Jian Sun)"],
  "organizations": ["微软亚洲研究院"],
  "keywords": ["目标检测","共享特征的区域建议网络","Faster R-CNN"],
  "related_achievements": ["R-CNN","ResNet","YOLO"]
}
```

==================================================
参考资料
==================================================

# 原始来源

- Shaoqing Ren, Kaiming He, Ross Girshick, and Jian Sun. (2015). Faster R-CNN: Towards Real-Time Object Detection with Region Proposal Networks. Neural Information Processing Systems. https://arxiv.org/abs/1506.01497

# 二级来源

- BenchCouncil AI100 achievement list. https://www.benchcouncil.org/ai100.html
