---
number: 45
achievement: "Adam"
area: "优化算法"
year: "2014"
source_list: "BenchCouncil AI100"
research_status: "draft-complete"
---

# 成就名称

Adam 优化器

# 年份 / 时期

2014

# 类型

Machine Learning

# 一句话总结

Adam 将类似动量的一阶矩估计与自适应二阶矩缩放结合起来，让神经网络训练更容易调参。

# 主视觉标题

- title: Adam 优化器

# 主视觉描述

- description: Adam 之所以成为现代深度学习的默认优化器之一，是因为它用梯度与梯度平方的滑动估计来为每个参数自适应调整步长。Kingma 与 Ba 在 2014 年提出这一简单、高效的随机优化方法，用来处理噪声目标函数。它的影响延伸到几乎所有深度学习框架，并催生了 AdamW 等后续变体。

# 人物与地点

## 关键人物

- 姓名：Diederik P. Kingma
  角色：Adam 共同作者
  机构：阿姆斯特丹大学 / 多伦多大学
  国家/地区：荷兰阿姆斯特丹与加拿大多伦多

- 姓名：Jimmy Ba
  角色：Adam 共同作者
  机构：阿姆斯特丹大学 / 多伦多大学
  国家/地区：荷兰阿姆斯特丹与加拿大多伦多

## 关键机构

- 名称：阿姆斯特丹大学 / 多伦多大学
- 类型：研究机构 / 大学
- 国家/地区：荷兰阿姆斯特丹与加拿大多伦多

## 关键地点

- 荷兰阿姆斯特丹与加拿大多伦多

==================================================
核心内容
==================================================

# 历史背景

到 2014 年，深度网络越来越大，训练噪声也越来越明显。研究者需要一种减少手工调参、同时能处理小批量、稀疏梯度和非平稳目标的优化器。

# 经典来源

- 标题：Adam: A Method for Stochastic Optimization
- 作者：Diederik P. Kingma and Jimmy Ba
- 发表处：International Conference on Learning Representations
- 年份：2015
- DOI：如适用见来源页面
- URL：https://arxiv.org/abs/1412.6980

# 核心思想

Adam 把动量的方向记忆与 RMSProp 的逐参数缩放结合起来，形成紧凑的更新规则，通常能较快进入可用训练状态。

# 关键概念

- 一阶矩：梯度的滑动平均类似动量，让更新方向跟随持续出现的下降方向。
- 二阶矩：梯度平方的滑动平均会缩放每个参数，使频繁出现的大梯度不至于支配所有更新。
- 偏差校正：Adam 会校正初期接近零的滑动平均，让训练开始阶段的步伐不被过度扭曲。

==================================================
影响力
==================================================

# 影响

## 学术影响

BenchCouncil AI100 为该成就关联的经典来源记录了 162,259 次引用。它成为 优化算法 的重要参照，也影响了相关成就中的后续系统。

## 产业影响

当 一阶与二阶矩自适应更新 在工程中变得有用时，这一方法影响了实际软件栈、基准测试和工程流程。

## 长期遗产

AI100 清单记录 Adam 论文引用数为 162,259。即便最终训练会选用后续变体，Adam 仍是研究代码、生产训练栈和教学材料中的基准优化器。

==================================================
专家评价
==================================================

# 专家评价

- 引文：“易于实现且计算高效”
- 人物：Diederik P. Kingma
- 机构：阿姆斯特丹大学 / 多伦多大学
- 年份：2015
- 来源 URL：https://arxiv.org/abs/1412.6980

今天，这项成就通常被视为持久的基础构件：它的重要性不仅在于单篇论文，也在于形成了可复用的模式，并塑造了后来的 AI 系统。

==================================================
多媒体
==================================================

# 图片

- local_image_path: resources/images/bench-council-ai100/explainers/2014-adam_moment-optimizer.svg
- title: Adam 优化器解释图
- caption: Adam 优化器 的原创解释图
- description: 本地图解总结核心流程，不复用出版社图表。
- source_name: Local explainer based on Adam: A Method for Stochastic Optimization
- source_page_url: https://arxiv.org/abs/1412.6980
- original_image_url: Local original explainer
- copyright_or_license: Original local explainer; source article or book figures are not reused.
- usage: 解释性图形

# 视频

本草稿未选择视频。

==================================================
导航与知识图谱
==================================================

# 相关成就

- 反向传播
- RMSProp
- Transformer 训练

# 相关国家/地区

- 荷兰
- 加拿大

# 时间线连接

- 前驱工作：优化算法 及相邻 AI 方法中的早期工作。
- 后续工作：复用、扩展或回应 Adam 优化器 的后续系统。

==================================================
Museum Metadata
==================================================

```json
{
  "year": "2014",
  "type": "Machine Learning",
  "countries": ["荷兰","加拿大"],
  "people": ["Diederik P. Kingma","Jimmy Ba"],
  "organizations": ["阿姆斯特丹大学 / 多伦多大学"],
  "keywords": ["优化算法","一阶与二阶矩自适应更新","Adam 优化器"],
  "related_achievements": ["反向传播","RMSProp","Transformer 训练"]
}
```

==================================================
参考资料
==================================================

# 原始来源

- Diederik P. Kingma and Jimmy Ba. (2015). Adam: A Method for Stochastic Optimization. International Conference on Learning Representations. https://arxiv.org/abs/1412.6980

# 二级来源

- BenchCouncil AI100 achievement list. https://www.benchcouncil.org/ai100.html
