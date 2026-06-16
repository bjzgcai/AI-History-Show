---
number: 119
achievement: "Simulated annealing"
area: "优化算法"
year: "1983"
source_list: "BenchCouncil AI100"
research_status: "draft-complete"
---

# 成就名称

模拟退火

# 年份 / 时期

1983

# 类型

Search

# 一句话总结

模拟退火把物理降温转化为在困难搜索问题中逃离局部最优的通用策略。

# 主视觉标题

- title: 模拟退火

# 主视觉描述

- description: 模拟退火借鉴冶金过程：温度高时，搜索可以接受较差移动以扩大探索；温度降低后，它变得更挑剔。Kirkpatrick、Gelatt 和 Vecchi 展示了这一思想如何处理困难优化问题。该方法成为连接物理、AI 搜索、运筹学和组合优化的经典桥梁。

# 人物与地点

## 关键人物

- 姓名：Scott Kirkpatrick
  角色：1983 年模拟退火论文共同作者
  机构：IBM Thomas J. Watson 研究中心
  国家/地区：美国约克敦高地

- 姓名：C. Daniel Gelatt Jr.
  角色：1983 年模拟退火论文共同作者
  机构：IBM Thomas J. Watson 研究中心
  国家/地区：美国约克敦高地

- 姓名：Mario P. Vecchi
  角色：1983 年模拟退火论文共同作者
  机构：IBM Thomas J. Watson 研究中心
  国家/地区：美国约克敦高地

## 关键机构

- 名称：IBM Thomas J. Watson 研究中心
- 类型：研究机构 / 大学
- 国家/地区：美国约克敦高地

## 关键地点

- 美国约克敦高地

==================================================
核心内容
==================================================

# 历史背景

许多 AI 与工程问题都有巨大搜索空间，贪心改进很容易卡住。模拟退火提供了一种有原则地进行受控“上坡”移动的方法。

# 经典来源

- 标题：Optimization by Simulated Annealing
- 作者：Scott Kirkpatrick, C. Daniel Gelatt Jr., and Mario P. Vecchi
- 发表处：Science
- 年份：1983
- DOI：如适用见来源页面
- URL：https://www.science.org/doi/10.1126/science.220.4598.671

# 核心思想

高温时，算法大胆探索；系统降温后，它越来越倾向低成本状态，模仿物理材料的稳定过程。

# 关键概念

- 温度：温度参数控制算法接受较差移动的意愿。
- 降温计划：降温计划逐渐降低温度，使搜索从探索转向精修。
- 局部最优：偶尔接受较差移动可以帮助搜索逃离局部看起来不错但全局并非最优的解。

==================================================
影响力
==================================================

# 影响

## 学术影响

BenchCouncil AI100 为该成就关联的经典来源记录了 56,687 次引用。它成为 优化算法 的重要参照，也影响了相关成就中的后续系统。

## 产业影响

当 带降温计划的概率搜索 在工程中变得有用时，这一方法影响了实际软件栈、基准测试和工程流程。

## 长期遗产

AI100 清单记录引用数为 56,687。模拟退火影响了调度、VLSI 布局、路径规划、贝叶斯计算和元启发式优化。

==================================================
专家评价
==================================================

# 专家评价

- 引文：“通过模拟退火进行优化”
- 人物：Scott Kirkpatrick
- 机构：IBM Thomas J. Watson 研究中心
- 年份：1983
- 来源 URL：https://www.science.org/doi/10.1126/science.220.4598.671

今天，这项成就通常被视为持久的基础构件：它的重要性不仅在于单篇论文，也在于形成了可复用的模式，并塑造了后来的 AI 系统。

==================================================
多媒体
==================================================

# 图片

- local_image_path: resources/images/bench-council-ai100/explainers/1983-simulated-annealing_cooling-search.svg
- title: 模拟退火解释图
- caption: 模拟退火 的原创解释图
- description: 本地图解总结核心流程，不复用出版社图表。
- source_name: Local explainer based on Optimization by Simulated Annealing
- source_page_url: https://www.science.org/doi/10.1126/science.220.4598.671
- original_image_url: Local original explainer
- copyright_or_license: Original local explainer; source article or book figures are not reused.
- usage: 解释性图形

# 视频

本草稿未选择视频。

==================================================
导航与知识图谱
==================================================

# 相关成就

- 遗传算法
- 蒙特卡洛方法
- 搜索算法

# 相关国家/地区

- 美国

# 时间线连接

- 前驱工作：优化算法 及相邻 AI 方法中的早期工作。
- 后续工作：复用、扩展或回应 模拟退火 的后续系统。

==================================================
Museum Metadata
==================================================

```json
{
  "year": "1983",
  "type": "Search",
  "countries": ["美国"],
  "people": ["Scott Kirkpatrick","C. Daniel Gelatt Jr.","Mario P. Vecchi"],
  "organizations": ["IBM Thomas J. Watson 研究中心"],
  "keywords": ["优化算法","带降温计划的概率搜索","模拟退火"],
  "related_achievements": ["遗传算法","蒙特卡洛方法","搜索算法"]
}
```

==================================================
参考资料
==================================================

# 原始来源

- Scott Kirkpatrick, C. Daniel Gelatt Jr., and Mario P. Vecchi. (1983). Optimization by Simulated Annealing. Science. https://www.science.org/doi/10.1126/science.220.4598.671

# 二级来源

- BenchCouncil AI100 achievement list. https://www.benchcouncil.org/ai100.html
