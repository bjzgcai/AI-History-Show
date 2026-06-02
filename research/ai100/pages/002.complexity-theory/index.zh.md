---
number: 2
achievement: "Complexity theory"
achievement_zh: "计算复杂性理论"
area: "Theory"
area_zh: "理论"
year: "1971"
source_list: "BenchCouncil AI100"
research_status: "draft-complete"
language: "zh"
---

# 成就名称

计算复杂性理论 / NP 完全性

# 年份 / 时期

1971

# 类型

基础理论

# 一句话总结

斯蒂芬·库克 1971 年关于定理证明过程复杂性的论文提出了 NP 完全性，使计算机科学能够严谨识别那些“容易验证、却可能很难高效求解”的问题。

# 主视觉标题

- title.en: NP-Completeness
- title.zh: NP 完全性

# 主视觉简介

- description.en: Computational complexity theory gave computer science a language for classifying problems by the resources needed to solve them. Cook's 1971 NP-completeness result showed that many hard problems share a common structure: a solution can be checked quickly even when finding one may be infeasible. This changed how researchers reason about algorithms, limits, cryptography, optimization, and AI search.
- description.zh: 计算复杂性理论让计算机科学能够按照求解所需资源来划分问题。库克 1971 年关于 NP 完全性的结果表明，许多困难问题具有共同结构：答案可以很快验证，但找到答案可能非常困难。它改变了研究者理解算法极限、密码学、优化和 AI 搜索的方式。

# 人物与地点

## 关键人物

- 名称: 斯蒂芬·A·库克（Stephen A. Cook）
- 角色: 计算机科学家；《The Complexity of Theorem-Proving Procedures》作者；NP 完全性奠基人
- 机构: 多伦多大学
- 国家: 加拿大

- 名称: 列昂尼德·列文（Leonid Levin）
- 角色: 计算机科学家、数学家；独立提出与 NP 完全性 / P versus NP 相关的思想
- 机构: 当时的苏联研究共同体
- 国家: 苏联 / 俄罗斯

## 关键机构

- 名称: 多伦多大学
- 类型: 大学
- 国家: 加拿大

- 名称: 美国计算机协会（Association for Computing Machinery）
- 类型: 专业学会 / 出版机构
- 国家: 美国

- 名称: ACM SIGACT 理论计算机科学研讨会（Symposium on Theory of Computing）
- 类型: 学术会议
- 国家: 美国

- 名称: 克雷数学研究所（Clay Mathematics Institute）
- 类型: 研究基金会
- 国家: 美国

## 关键地点

- 多伦多，加拿大
- 谢克海茨，美国俄亥俄州
- 剑桥，美国马萨诸塞州

==================================================
【核心内容】
==================================================

# 历史背景

到 1960 年代末和 1970 年代初，计算机科学已经为许多任务找到了高效算法，但仍缺少一套成熟语言来解释为什么有些自然问题很难高效求解。研究者可以测量运行时间，却缺乏统一理论来比较搜索、优化、定理证明、可满足性和组合问题的内在难度。

Cook 的 1971 年 STOC 论文改变了这一状况：它证明布尔可满足性问题可以在多项式时间归约意义下捕捉 NP 中所有问题的难度。这意味着大量看似不同的问题可以通过一个共同的困难性概念联系起来。如果任何一个 NP 完全问题有多项式时间算法，那么 NP 中所有问题都有多项式时间算法。

这个问题今天仍以 P versus NP 的形式悬而未决。Clay Mathematics Institute 将它描述为：每个答案能够被快速检查的问题，是否也都能被快速求解？它也是千禧年大奖难题之一。

# 经典来源

- 标题: The Complexity of Theorem-Proving Procedures
- 作者: Stephen A. Cook
- 发表载体: Proceedings of the Third Annual ACM Symposium on Theory of Computing (STOC '71)
- 年份: 1971
- DOI: 10.1145/800157.805047
- URL: https://dl.acm.org/doi/10.1145/800157.805047

- 标题: The P Versus NP Problem
- 作者: Stephen Cook
- 发表载体: Clay Mathematics Institute Millennium Prize Problem description
- 年份: 2000
- DOI: N/A
- URL: https://www.claymath.org/wp-content/uploads/2022/06/pvsnp.pdf

# 核心思想

核心思想很简单：有些问题的答案很容易检查，但未必容易求出。比如有人给你一个排程谜题的解，你可以很快检查它是否满足所有条件；但从零开始找到这个解可能非常困难。

Cook 用 P、NP 和 NP 完全性形式化了这种区别。一个问题如果属于 NP，并且 NP 中所有问题都能高效转换成它，它就是 NP 完全的。这使 NP 完全问题成为 NP 中“最难”的问题：只要能高效解决其中一个，就能高效解决整个 NP。

这一理论之所以有效，是因为归约让研究者无需真正求解问题，也能比较问题之间的难度。复杂性理论不再孤立地问每个问题是否困难，而是问一个问题能否在保持高效计算的前提下模拟另一个问题。

# 关键概念

- P versus NP: P 包含可以快速求解的问题，NP 包含候选答案可以快速验证的问题。这个开放问题问的是：快速验证是否一定意味着快速求解。
- NP 完全性（NP-Completeness）: NP 完全问题是 NP 中最难的一类问题。如果任何一个 NP 完全问题可以被高效解决，那么 NP 中所有问题都可以被高效解决。
- 多项式时间归约（Polynomial-Time Reduction）: 归约可以把一个问题高效转换成另一个问题。它让研究者无需直接求解，也能比较外观完全不同的问题难度。

==================================================
【影响力】
==================================================

# 影响

## 学术影响

BenchCouncil 将 Cook 的《The Complexity of Theorem Proving Procedures》列为 10,695 次引用。ACM 指出这篇论文奠定了 NP 完全性理论基础，其图灵奖页面也说明，随后围绕 NP 完全问题的研究成为计算机科学中最活跃、最重要的研究方向之一。

这一理论影响了算法、密码学、优化、数据库、逻辑、验证、人工智能、运筹学和计算生物学。它让研究者可以有纪律地说“这个问题很可能很难”，即使我们还没有严格的下界证明。

## 产业影响

复杂性理论不是一个产品功能，但它持续影响工业工程决策。NP 完全性结果指导求解器设计、近似算法、启发式搜索、SAT/SMT 求解、约束规划、路径规划、排程、编译器优化、硬件验证、密码学和安全假设。

企业并不是“使用 NP 完全性”作为单一算法，而是把它作为一张地图：哪里不太可能存在通用精确高效算法，哪里应该采用近似、限制条件、随机方法或专用求解器。

## 长期遗产

NP 完全性仍然是计算机科学教育和研究中的标准理论。P versus NP 至今未解，也是 Clay Mathematics Institute 的千禧年大奖难题之一。它的遗产不仅是一个著名开放问题，更是一整套分类计算困难性的语言。

==================================================
【专家评价】
==================================================

# 专家评价

- 引文: "laid the foundations for the theory of NP-Completeness"
- 译文: “奠定了 NP 完全性理论的基础。”
- 人物: ACM A.M. 图灵奖页面编辑
- 机构: 美国计算机协会（ACM）
- 年份: 1982 年获奖页面
- 来源 URL: https://awards.acm.org/award_winners/cook_N991950

- 引文: "Cook's contributions to computational complexity were absolutely foundational."
- 译文: “库克对计算复杂性的贡献具有绝对的奠基性。”
- 人物: 斯科特·阿伦森（Scott Aaronson）
- 机构: 德克萨斯大学奥斯汀分校；多伦多大学文章引用
- 年份: 2019
- 来源 URL: https://www.utoronto.ca/news/some-deepest-questions-it-s-possible-ask-stephen-cook-s-pioneering-career-computational

今天的专家通常将 Cook 1971 年的贡献视为理论计算机科学的奠基事件。共识是，NP 完全性并不只是解决了一个问题，而是创造了一个能够跨领域比较计算困难性的持久框架。

==================================================
【多媒体】
==================================================

# 图片

- 标题: 斯蒂芬·A·库克 ACM 获奖者照片
- 图片 URL: https://awards.acm.org/award_winners/cook_N991950
- 来源: 美国计算机协会（ACM）
- 版权信息: ACM 获奖页面；使用前需查看 ACM 图片授权。
- 描述: ACM 官方斯蒂芬·库克个人资料页，包含获奖信息和照片。

- 标题: 多伦多大学介绍斯蒂芬·库克
- 图片 URL: https://www.utoronto.ca/news/some-deepest-questions-it-s-possible-ask-stephen-cook-s-pioneering-career-computational
- 来源: 多伦多大学
- 版权信息: 多伦多大学页面标注照片由 BBVA Foundation 提供。
- 描述: 多伦多大学介绍 Cook 职业生涯和计算复杂性 50 周年纪念的文章。

- 标题: P versus NP 千禧年难题页面图片
- 图片 URL: https://www.claymath.org/millennium/p-vs-np/
- 来源: 克雷数学研究所
- 版权信息: Clay 页面标注 Stephen Cook 照片作者为 Jiri Janicek，授权为 CC BY-SA 3.0。
- 描述: 克雷数学研究所关于 P versus NP 千禧年大奖难题的官方页面。

# 视频片段

- 标题: Vijaya Ramachandran (Austin) P versus NP
- URL: https://www.claymath.org/lectures/p-versus-np/
- 平台: 克雷数学研究所讲座视频
- 时长: 摘要页面未列出
- 描述: Clay 讲座系列中与 P versus NP 千禧年难题相关的视频。

- 标题: Lance Fortnow (GaTech) A personal view of the P versus NP problem
- URL: https://www.claymath.org/millennium/p-vs-np/
- 平台: 克雷数学研究所相关视频
- 时长: 摘要页面未列出
- 描述: 关于 P versus NP 历史和概念背景的专家讲座。

==================================================
【导航与知识图谱】
==================================================

# 相关人物

- 斯蒂芬·库克
- 列昂尼德·列文
- 理查德·卡普
- 迈克尔·拉宾
- 达纳·斯科特
- 阿维·维格德森
- 斯科特·阿伦森
- 兰斯·福特诺

# 相关成就

- 图灵测试
- Davis-Putnam 算法与 DPLL
- 归结方法
- 搜索算法
- SAT 求解
- 贝叶斯网络

# 相关机构

- 多伦多大学
- ACM
- ACM SIGACT
- 克雷数学研究所
- 菲尔兹研究所

# 相关国家

- 加拿大
- 美国
- 苏联 / 俄罗斯

# 时间线关联

- Predecessors: 图灵机与可计算性理论；形式逻辑；定理证明；早期算法分析。
- Successors: Karp 1972 年的 NP 完全性结果；近似算法；密码学困难性假设；SAT/SMT 求解器；现代理论计算机科学。

==================================================
【Museum Metadata】
==================================================

{
  "year": "1971",
  "decade": "1970s",
  "type": "Foundations",
  "countries": ["Canada", "USA", "Russia"],
  "people": ["Stephen Cook", "Leonid Levin", "Richard Karp", "Scott Aaronson", "Lance Fortnow"],
  "organizations": ["University of Toronto", "Association for Computing Machinery", "Clay Mathematics Institute", "Fields Institute"],
  "keywords": ["计算复杂性理论", "NP 完全性", "P versus NP", "SAT", "多项式时间归约", "定理证明"],
  "related_achievements": ["Davis-Putnam algorithm and DPLL", "Resolution method", "Search algorithms", "SAT solving"]
}

==================================================
【参考资料】
==================================================

# 一手资料

- Cook, S. A. (1971). The complexity of theorem-proving procedures. Proceedings of the Third Annual ACM Symposium on Theory of Computing, 151-158. https://doi.org/10.1145/800157.805047
- Cook, S. (2000). The P versus NP problem. Clay Mathematics Institute. https://www.claymath.org/wp-content/uploads/2022/06/pvsnp.pdf

# 二手资料

- Association for Computing Machinery. (n.d.). Stephen A. Cook. ACM Awards. Retrieved June 2, 2026, from https://awards.acm.org/award_winners/cook_N991950
- Association for Computing Machinery. (n.d.). Spotlight on Turing laureates. Retrieved June 2, 2026, from https://awards.acm.org/about/turing-laureates-spotlight
- BenchCouncil. (n.d.). AI100: Top 100 AI achievements. Retrieved June 2, 2026, from https://www.benchcouncil.org/evaluation/ai/
- Clay Mathematics Institute. (n.d.). P vs NP. Retrieved June 2, 2026, from https://www.claymath.org/millennium/p-vs-np/
- Sasaki, C. (2019, July 5). Some of the deepest questions it's possible to ask: Stephen Cook's pioneering career in computational complexity. University of Toronto. https://www.utoronto.ca/news/some-deepest-questions-it-s-possible-ask-stephen-cook-s-pioneering-career-computational
