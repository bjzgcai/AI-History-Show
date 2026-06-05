---
number: 52
achievement: "GoogLeNet"
area: "计算机视觉"
year: "2014-2015"
source_list: "BenchCouncil AI100"
research_status: "draft-complete"
---

# 成就名称

GoogLeNet / Inception

# 年份 / 时期

2014-2015

# 类型

Computer Vision

# 一句话总结

GoogLeNet 用 Inception 模块在多个尺度处理视觉特征，同时保持计算高效。

# 主视觉标题

- title: GoogLeNet / Inception

# 主视觉描述

- description: GoogLeNet 证明“深”不一定意味着简单串联层。它的 Inception 模块并行运行多种滤波器尺寸，再拼接输出，并用瓶颈层控制计算量。该架构赢得 ImageNet 2014，并影响了后来的高效模块化 CNN 设计。

# 人物与地点

## 关键人物

- 姓名：Christian Szegedy
  角色：GoogLeNet 论文第一作者
  机构：Google
  国家/地区：美国山景城

- 姓名：Google 研究团队
  角色：开发 Inception 架构
  机构：Google
  国家/地区：美国山景城

## 关键机构

- 名称：Google
- 类型：研究机构 / 大学
- 国家/地区：美国山景城

## 关键地点

- 美国山景城

==================================================
核心内容
==================================================

# 历史背景

AlexNet 和 VGG 之后，CNN 变得更深也更耗算力。Google 团队探索如何提升表示能力，而不是简单放大每一层。

# 经典来源

- 标题：Going Deeper with Convolutions
- 作者：Christian Szegedy et al.
- 发表处：IEEE Conference on Computer Vision and Pattern Recognition
- 年份：2015
- DOI：如适用见来源页面
- URL：https://www.cv-foundation.org/openaccess/content_cvpr_2015/html/Szegedy_Going_Deeper_With_2015_CVPR_paper.html

# 核心思想

Inception 模块让网络同时使用多种感受野尺寸。1x1 瓶颈层让这种多分支设计在计算上可承受。

# 关键概念

- Inception 模块：多个卷积与池化路径并行运行，让网络捕捉多尺度模式。
- 瓶颈层：1x1 卷积在昂贵操作前减少通道数，提高计算效率。
- 参数效率：该架构在增加深度与宽度的同时控制内存和计算成本。

==================================================
影响力
==================================================

# 影响

## 学术影响

BenchCouncil AI100 为该成就关联的经典来源记录了 54,115 次引用。它成为 计算机视觉 的重要参照，也影响了相关成就中的后续系统。

## 产业影响

当 多尺度 Inception 模块 在工程中变得有用时，这一方法影响了实际软件栈、基准测试和工程流程。

## 长期遗产

AI100 清单记录引用数为 54,115。Inception 影响了模块化 CNN、高效架构搜索，以及把神经网络模块设计成可复用计算模式的思想。

==================================================
专家评价
==================================================

# 专家评价

- 引文：“用卷积走得更深”
- 人物：Christian Szegedy
- 机构：Google
- 年份：2015
- 来源 URL：https://www.cv-foundation.org/openaccess/content_cvpr_2015/html/Szegedy_Going_Deeper_With_2015_CVPR_paper.html

今天，这项成就通常被视为持久的基础构件：它的重要性不仅在于单篇论文，也在于形成了可复用的模式，并塑造了后来的 AI 系统。

==================================================
多媒体
==================================================

# 图片

- local_image_path: resources/images/bench-council-ai100/explainers/2015-googlenet-inception_multi-scale.svg
- title: GoogLeNet / Inception解释图
- caption: GoogLeNet / Inception 的原创解释图
- description: 本地图解总结核心流程，不复用出版社图表。
- source_name: Local explainer based on Going Deeper with Convolutions
- source_page_url: https://www.cv-foundation.org/openaccess/content_cvpr_2015/html/Szegedy_Going_Deeper_With_2015_CVPR_paper.html
- original_image_url: Local original explainer
- copyright_or_license: Original local explainer; source article or book figures are not reused.
- usage: 解释性图形

# 视频

本草稿未选择视频。

==================================================
导航与知识图谱
==================================================

# 相关成就

- VGG
- ResNet
- AlexNet

# 相关国家/地区

- 美国

# 时间线连接

- 前驱工作：计算机视觉 及相邻 AI 方法中的早期工作。
- 后续工作：复用、扩展或回应 GoogLeNet / Inception 的后续系统。

==================================================
Museum Metadata
==================================================

```json
{
  "year": "2014-2015",
  "type": "Computer Vision",
  "countries": ["美国"],
  "people": ["Christian Szegedy","Google 研究团队"],
  "organizations": ["Google"],
  "keywords": ["计算机视觉","多尺度 Inception 模块","GoogLeNet / Inception"],
  "related_achievements": ["VGG","ResNet","AlexNet"]
}
```

==================================================
参考资料
==================================================

# 原始来源

- Christian Szegedy et al.. (2015). Going Deeper with Convolutions. IEEE Conference on Computer Vision and Pattern Recognition. https://www.cv-foundation.org/openaccess/content_cvpr_2015/html/Szegedy_Going_Deeper_With_2015_CVPR_paper.html

# 二级来源

- BenchCouncil AI100 achievement list. https://www.benchcouncil.org/ai100.html
