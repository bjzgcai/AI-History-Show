---
number: 51
achievement: "VGG"
area: "计算机视觉"
year: "2014"
source_list: "BenchCouncil AI100"
research_status: "draft-complete"
---

# 成就名称

VGG 网络

# 年份 / 时期

2014

# 类型

Computer Vision

# 一句话总结

VGG 证明了简单重复的 3x3 卷积块可以通过深度扩展视觉识别能力。

# 主视觉标题

- title: VGG 网络

# 主视觉描述

- description: VGG 让卷积网络看起来像一种有纪律的架构语言：小卷积核、重复模块、阶段性池化，以及很深的层数。牛津团队 2014 年的工作并不是最快或最小的模型，却成为经典特征提取器和教学范例。它的清晰结构帮助研究者在残差连接和密集连接成为标准之前理解“深度”的价值。

# 人物与地点

## 关键人物

- 姓名：Karen Simonyan
  角色：VGG 论文共同作者
  机构：牛津大学视觉几何组
  国家/地区：英国牛津

- 姓名：Andrew Zisserman
  角色：共同作者，视觉几何组负责人
  机构：牛津大学视觉几何组
  国家/地区：英国牛津

## 关键机构

- 名称：牛津大学视觉几何组
- 类型：研究机构 / 大学
- 国家/地区：英国牛津

## 关键地点

- 英国牛津

==================================================
核心内容
==================================================

# 历史背景

AlexNet 之后，研究者知道大型 CNN 能赢得 ImageNet，但架构设计空间仍然混乱。VGG 追问：如果谨慎增加深度，一个简单同质化设计能走多远？

# 经典来源

- 标题：Very Deep Convolutional Networks for Large-Scale Image Recognition
- 作者：Karen Simonyan and Andrew Zisserman
- 发表处：International Conference on Learning Representations
- 年份：2015
- DOI：如适用见来源页面
- URL：https://arxiv.org/abs/1409.1556

# 核心思想

VGG 不混用大量卷积核尺寸，而是按规则堆叠小卷积。网络因此变深，同时架构仍保持统一。

# 关键概念

- 3x3 卷积核：VGG 反复使用小卷积核，让多层组合出更大的有效感受野，同时插入更多非线性。
- 网络深度：论文系统增加网络深度，并展示更深卷积堆叠能提升大规模识别。
- 迁移特征：预训练 VGG 特征后来成为检测、分割、风格迁移和可视化的常用起点。

==================================================
影响力
==================================================

# 影响

## 学术影响

BenchCouncil AI100 为该成就关联的经典来源记录了 111,338 次引用。它成为 计算机视觉 的重要参照，也影响了相关成就中的后续系统。

## 产业影响

当 由 3x3 卷积堆叠出的很深网络 在工程中变得有用时，这一方法影响了实际软件栈、基准测试和工程流程。

## 长期遗产

AI100 清单记录引用数为 111,338。VGG 仍是视觉特征、感知损失以及 CNN 从较浅模型走向很深模型这一历史转变的参照点。

==================================================
专家评价
==================================================

# 专家评价

- 引文：“非常深的卷积网络”
- 人物：Karen Simonyan
- 机构：牛津大学视觉几何组
- 年份：2015
- 来源 URL：https://arxiv.org/abs/1409.1556

今天，这项成就通常被视为持久的基础构件：它的重要性不仅在于单篇论文，也在于形成了可复用的模式，并塑造了后来的 AI 系统。

==================================================
多媒体
==================================================

# 图片

- local_image_path: resources/images/bench-council-ai100/explainers/2014-vgg_depth-stack.svg
- title: VGG 网络解释图
- caption: VGG 网络 的原创解释图
- description: 本地图解总结核心流程，不复用出版社图表。
- source_name: Local explainer based on Very Deep Convolutional Networks for Large-Scale Image Recognition
- source_page_url: https://arxiv.org/abs/1409.1556
- original_image_url: Local original explainer
- copyright_or_license: Original local explainer; source article or book figures are not reused.
- usage: 解释性图形

# 视频

本草稿未选择视频。

==================================================
导航与知识图谱
==================================================

# 相关成就

- AlexNet
- ResNet
- GoogLeNet / Inception

# 相关国家/地区

- 英国

# 时间线连接

- 前驱工作：计算机视觉 及相邻 AI 方法中的早期工作。
- 后续工作：复用、扩展或回应 VGG 网络 的后续系统。

==================================================
Museum Metadata
==================================================

```json
{
  "year": "2014",
  "type": "Computer Vision",
  "countries": ["英国"],
  "people": ["Karen Simonyan","Andrew Zisserman"],
  "organizations": ["牛津大学视觉几何组"],
  "keywords": ["计算机视觉","由 3x3 卷积堆叠出的很深网络","VGG 网络"],
  "related_achievements": ["AlexNet","ResNet","GoogLeNet / Inception"]
}
```

==================================================
参考资料
==================================================

# 原始来源

- Karen Simonyan and Andrew Zisserman. (2015). Very Deep Convolutional Networks for Large-Scale Image Recognition. International Conference on Learning Representations. https://arxiv.org/abs/1409.1556

# 二级来源

- BenchCouncil AI100 achievement list. https://www.benchcouncil.org/ai100.html
