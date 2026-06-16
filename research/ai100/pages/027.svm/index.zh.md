---
number: 27
achievement: "SVM"
area: "统计学习"
year: "1992"
source_list: "BenchCouncil AI100"
research_status: "draft-complete"
---

# 成就名称

支持向量机

# 年份 / 时期

1992

# 类型

Machine Learning

# 一句话总结

支持向量机把分类转化为寻找鲁棒最大间隔边界的问题，并常通过核函数实现。

# 主视觉标题

- title: 支持向量机

# 主视觉描述

- description: 支持向量机让统计学习理论变得可操作：选择能以最大间隔分开类别的边界，再用核函数在变换后的特征空间中实现线性分离。它在深度学习复兴之前长期是主流机器学习工具。SVM 将优雅理论、凸优化和实用分类器连接在一起。

# 人物与地点

## 关键人物

- 姓名：Vladimir Vapnik
  角色：共同发展最优间隔分类器与统计学习理论
  机构：贝尔实验室
  国家/地区：美国默里山

- 姓名：Bernhard Boser
  角色：1992 年最优间隔分类器论文共同作者
  机构：贝尔实验室
  国家/地区：美国默里山

- 姓名：Isabelle Guyon
  角色：1992 年最优间隔分类器论文共同作者
  机构：贝尔实验室
  国家/地区：美国默里山

## 关键机构

- 名称：贝尔实验室
- 类型：研究机构 / 大学
- 国家/地区：美国默里山

## 关键地点

- 美国默里山

==================================================
核心内容
==================================================

# 历史背景

20 世纪 90 年代初，机器学习需要能在有限数据上泛化并具有清晰数学保证的方法。SVM 将 VC 式容量控制转化为实用分类器。

# 经典来源

- 标题：A Training Algorithm for Optimal Margin Classifiers
- 作者：Bernhard E. Boser, Isabelle M. Guyon, and Vladimir N. Vapnik
- 发表处：Fifth Annual Workshop on Computational Learning Theory
- 年份：1992
- DOI：如适用见来源页面
- URL：https://dl.acm.org/doi/10.1145/130385.130401

# 核心思想

SVM 偏好不只是训练集正确、而且离最近样本足够远的边界。核函数让非线性边界成为可能，同时保留凸优化问题。

# 关键概念

- 最大间隔：分类器选择与最近训练样本之间间隔最宽的分隔边界。
- 支持向量：只有最接近边界的样本定义分类面，使模型依赖关键样本，而不是同等依赖所有点。
- 核技巧：核函数像是在更丰富空间中计算相似度，却不需要显式构造那个空间。

==================================================
影响力
==================================================

# 影响

## 学术影响

BenchCouncil AI100 为该成就关联的经典来源记录了 63,346 次引用。它成为 统计学习 的重要参照，也影响了相关成就中的后续系统。

## 产业影响

当 带核函数的最大间隔分类 在工程中变得有用时，这一方法影响了实际软件栈、基准测试和工程流程。

## 长期遗产

AI100 清单记录引用数为 63,346。SVM 影响了文本分类、生物信息学、计算机视觉、核方法以及基于间隔学习的整体文化。

==================================================
专家评价
==================================================

# 专家评价

- 引文：“最优间隔分类器”
- 人物：Vladimir Vapnik
- 机构：贝尔实验室
- 年份：1992
- 来源 URL：https://dl.acm.org/doi/10.1145/130385.130401

今天，这项成就通常被视为持久的基础构件：它的重要性不仅在于单篇论文，也在于形成了可复用的模式，并塑造了后来的 AI 系统。

==================================================
多媒体
==================================================

# 图片

- local_image_path: resources/images/bench-council-ai100/explainers/1992-svm_margin-classifier.svg
- title: 支持向量机解释图
- caption: 支持向量机 的原创解释图
- description: 本地图解总结核心流程，不复用出版社图表。
- source_name: Local explainer based on A Training Algorithm for Optimal Margin Classifiers
- source_page_url: https://dl.acm.org/doi/10.1145/130385.130401
- original_image_url: Local original explainer
- copyright_or_license: Original local explainer; source article or book figures are not reused.
- usage: 解释性图形

# 视频

本草稿未选择视频。

==================================================
导航与知识图谱
==================================================

# 相关成就

- VC 理论
- 核方法
- Lasso

# 相关国家/地区

- 美国

# 时间线连接

- 前驱工作：统计学习 及相邻 AI 方法中的早期工作。
- 后续工作：复用、扩展或回应 支持向量机 的后续系统。

==================================================
Museum Metadata
==================================================

```json
{
  "year": "1992",
  "type": "Machine Learning",
  "countries": ["美国"],
  "people": ["Vladimir Vapnik","Bernhard Boser","Isabelle Guyon"],
  "organizations": ["贝尔实验室"],
  "keywords": ["统计学习","带核函数的最大间隔分类","支持向量机"],
  "related_achievements": ["VC 理论","核方法","Lasso"]
}
```

==================================================
参考资料
==================================================

# 原始来源

- Bernhard E. Boser, Isabelle M. Guyon, and Vladimir N. Vapnik. (1992). A Training Algorithm for Optimal Margin Classifiers. Fifth Annual Workshop on Computational Learning Theory. https://dl.acm.org/doi/10.1145/130385.130401

# 二级来源

- BenchCouncil AI100 achievement list. https://www.benchcouncil.org/ai100.html
