---
number: 28
achievement: "Lasso"
area: "统计学习"
year: "1996"
source_list: "BenchCouncil AI100"
research_status: "draft-complete"
---

# 成就名称

Lasso 回归

# 年份 / 时期

1996

# 类型

Machine Learning

# 一句话总结

Lasso 用 L1 惩罚把部分系数压到零，让预测与特征选择同时发生。

# 主视觉标题

- title: Lasso 回归

# 主视觉描述

- description: Lasso 为统计学家和机器学习实践者提供了一种构建稀疏线性模型的清晰方法。通过惩罚系数绝对值，它既正则化预测，又完成变量选择。其思想后来出现在稀疏建模、高维统计、压缩感知、生物信息学和可解释机器学习中。

# 人物与地点

## 关键人物

- 姓名：Robert Tibshirani
  角色：提出 Lasso 方法
  机构：多伦多大学
  国家/地区：加拿大多伦多

## 关键机构

- 名称：多伦多大学
- 类型：研究机构 / 大学
- 国家/地区：加拿大多伦多

## 关键地点

- 加拿大多伦多

==================================================
核心内容
==================================================

# 历史背景

随着数据维度增加，分析者需要既能避免过拟合、又能识别有用变量的模型。岭回归能收缩系数，但通常不会把它们变成零。

# 经典来源

- 标题：Regression Shrinkage and Selection via the Lasso
- 作者：Robert Tibshirani
- 发表处：Journal of the Royal Statistical Society: Series B
- 年份：1996
- DOI：如适用见来源页面
- URL：https://rss.onlinelibrary.wiley.com/doi/10.1111/j.2517-6161.1996.tb02080.x

# 核心思想

Lasso 在回归中加入 L1 惩罚。该惩罚的几何形状自然产生精确零系数，因此预测与选择被绑定在一起。

# 关键概念

- L1 惩罚：惩罚系数绝对值之和，鼓励部分系数精确变为零。
- 稀疏性：稀疏模型只使用一部分变量，因此可能提升可解释性和稳健性。
- 变量选择：Lasso 在拟合模型时同时选择预测变量，而不需要单独的特征选择步骤。

==================================================
影响力
==================================================

# 影响

## 学术影响

BenchCouncil AI100 为该成就关联的经典来源记录了 55,395 次引用。它成为 统计学习 的重要参照，也影响了相关成就中的后续系统。

## 产业影响

当 L1 正则化回归与选择 在工程中变得有用时，这一方法影响了实际软件栈、基准测试和工程流程。

## 长期遗产

AI100 清单记录引用数为 55,395。Lasso 仍是高维统计、稀疏学习、基因组学和可解释基线建模中的核心方法。

==================================================
专家评价
==================================================

# 专家评价

- 引文：“回归收缩与选择”
- 人物：Robert Tibshirani
- 机构：多伦多大学
- 年份：1996
- 来源 URL：https://rss.onlinelibrary.wiley.com/doi/10.1111/j.2517-6161.1996.tb02080.x

今天，这项成就通常被视为持久的基础构件：它的重要性不仅在于单篇论文，也在于形成了可复用的模式，并塑造了后来的 AI 系统。

==================================================
多媒体
==================================================

# 图片

- local_image_path: resources/images/bench-council-ai100/explainers/1996-lasso_sparse-regression.svg
- title: Lasso 回归解释图
- caption: Lasso 回归 的原创解释图
- description: 本地图解总结核心流程，不复用出版社图表。
- source_name: Local explainer based on Regression Shrinkage and Selection via the Lasso
- source_page_url: https://rss.onlinelibrary.wiley.com/doi/10.1111/j.2517-6161.1996.tb02080.x
- original_image_url: Local original explainer
- copyright_or_license: Original local explainer; source article or book figures are not reused.
- usage: 解释性图形

# 视频

本草稿未选择视频。

==================================================
导航与知识图谱
==================================================

# 相关成就

- 支持向量机
- CART
- 压缩感知

# 相关国家/地区

- 加拿大
- 美国

# 时间线连接

- 前驱工作：统计学习 及相邻 AI 方法中的早期工作。
- 后续工作：复用、扩展或回应 Lasso 回归 的后续系统。

==================================================
Museum Metadata
==================================================

```json
{
  "year": "1996",
  "type": "Machine Learning",
  "countries": ["加拿大","美国"],
  "people": ["Robert Tibshirani"],
  "organizations": ["多伦多大学"],
  "keywords": ["统计学习","L1 正则化回归与选择","Lasso 回归"],
  "related_achievements": ["支持向量机","CART","压缩感知"]
}
```

==================================================
参考资料
==================================================

# 原始来源

- Robert Tibshirani. (1996). Regression Shrinkage and Selection via the Lasso. Journal of the Royal Statistical Society: Series B. https://rss.onlinelibrary.wiley.com/doi/10.1111/j.2517-6161.1996.tb02080.x

# 二级来源

- BenchCouncil AI100 achievement list. https://www.benchcouncil.org/ai100.html
