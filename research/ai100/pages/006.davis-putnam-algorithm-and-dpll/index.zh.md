---
number: 6
achievement: "Davis-Putnam algorithm & DPLL"
achievement_zh: "Davis-Putnam 算法与 DPLL"
area: "Automated theorem proving"
area_zh: "自动定理证明"
year: "1960"
source_list: "BenchCouncil AI100"
research_status: "draft-complete"
language: "zh"
---

# 成就名称

Davis-Putnam 算法与 Davis-Putnam-Logemann-Loveland 过程。

# 年份 / 时期

1960-1962

# 类型

推理

# 一句话总结

Davis-Putnam 过程与 DPLL 把可满足性求解变成了基于简化、传播、分支和回溯的有纪律搜索过程。

# 主视觉标题

- title: DP/DPLL 算法

# 主视觉简介

- description: Davis 和 Putnam 在 1960 年把量词理论与可行证明过程联系起来。Davis、Logemann 和 Loveland 随后把命题可满足性步骤改进成一个机器程序，其分支与传播结构成为 DPLL。它的影响延续到今天的 SAT、SMT、规划、验证和约束求解。

# 人物与地点

## 关键人物

- 名称: Martin Davis
- 角色: Davis-Putnam 过程与 DPLL 程序论文共同作者
- 机构: 伦斯勒理工学院；纽约大学
- 国家: 美国

- 名称: Hilary Putnam
- 角色: 1960 年 Davis-Putnam 论文共同作者
- 机构: 普林斯顿大学
- 国家: 美国

- 名称: George Logemann
- 角色: 1962 年 DPLL 程序论文共同作者
- 机构: 纽约大学
- 国家: 美国

- 名称: Donald W. Loveland
- 角色: 1962 年 DPLL 程序论文共同作者
- 机构: 纽约大学
- 国家: 美国

## 关键机构

- 名称: Journal of the ACM
- 类型: 学术期刊
- 国家: 美国

- 名称: Communications of the ACM
- 类型: 学术杂志 / 期刊
- 国家: 美国

- 名称: 纽约大学数学科学研究所
- 类型: 研究机构
- 国家: 美国

## 关键地点

- 美国纽约
- 美国新泽西州普林斯顿
- 美国纽约州特洛伊

==================================================
【核心内容】
==================================================

# 历史背景

1950 年代末的自动定理证明面临一个张力：一阶逻辑没有通用判定过程，但有效公式仍可能通过证明过程被找到，只是在无效输入上可能无限搜索。研究者需要能有效利用现代计算机的方法，尤其是处理命题可满足性和量词子问题的方法。

Davis 和 Putnam 于 1960 年提出了量词理论的系统计算过程。1962 年 Davis、Logemann 和 Loveland 又描述了一个定理证明机器程序，形成了后来 SAT 求解中的 DPLL 传统。

# 经典来源

- 标题: A Computing Procedure for Quantification Theory
- 作者: Martin Davis and Hilary Putnam
- 发表载体: Journal of the ACM, 7(3), 201-215
- 年份: 1960
- DOI: 10.1145/321033.321034
- URL: https://dl.acm.org/doi/10.1145/321033.321034

- 标题: A machine program for theorem-proving
- 作者: Martin Davis, George Logemann, Donald W. Loveland
- 发表载体: Communications of the ACM, 5(7), 394-397
- 年份: 1962
- DOI: 10.1145/368273.368557
- URL: https://cacm.acm.org/research/a-machine-program-for-theorem-proving/

# 核心思想

核心思想是通过反复简化公式，并只在必要处探索赋值来求解可满足性。如果某个子句强制一个取值，就传播它；如果没有强制动作，就选择变量分支；如果某个分支与公式矛盾，就回溯。

这不同于简单穷举枚举，因为算法利用公式结构尽早剪去大量不可能分支。它让 SAT 求解成为自动推理中的实用引擎。

# 关键概念

- Davis-Putnam 过程: 1960 年提出的证明过程，用逻辑变换处理量词理论和命题可满足性。
- DPLL 搜索: 基于分支、简化和回溯的递归 SAT 过程。
- 单子句传播: 当一个子句只剩一个可能文字时强制赋值，并据此简化其他子句。

==================================================
【影响力】
==================================================

# 影响

## 学术影响

BenchCouncil 将《A Computing Procedure for Quantification Theory》列为 4,358 次引用。Davis-Putnam 与 DPLL 家族成为自动推理、可满足性、验证和约束求解中的标准参照。

## 产业影响

现代 SAT 与 SMT 求解器被用于硬件验证、软件分析、规划、调度、模型检查、安全分析、包依赖求解和配置系统。它们已经远比早期 DPLL 复杂，但仍保留结构化搜索和强力简化的基本思想。

## 长期遗产

DPLL 仍然是实用自动推理中最容易识别的基础之一。CDCL SAT 求解器加入冲突学习、watched literals、重启和分支启发式，但核心仍可追溯到 DPLL 式搜索。

==================================================
【专家评价】
==================================================

# 专家评价

- 引文: "The programming of a proof procedure is discussed"
- 译文: “讨论了一个证明过程的程序设计。”
- 人物: Communications of the ACM 文章摘要
- 机构: ACM
- 年份: 1962
- 来源 URL: https://cacm.acm.org/research/a-machine-program-for-theorem-proving/

今天的专家通常把 Davis-Putnam 与 DPLL 视为 SAT 求解的基础性工作。它的重要性在于把证明搜索变成了可以实现、优化，并被现代求解器工程不断扩展的算法循环。

==================================================
【多媒体】
==================================================

# 图片

images:

- resources/images/bench-council-ai100/photos/1960-davis-putnam-dpll_hilary-putnam.jpg
- resources/images/bench-council-ai100/explainers/1960-davis-putnam-dpll_sat-search.svg

imageMeta:

- local_image_path: resources/images/bench-council-ai100/photos/1960-davis-putnam-dpll_hilary-putnam.jpg
- title: Hilary Putnam 肖像
- caption: Hilary Putnam 肖像
- description: Wikimedia Commons 收录的 Hilary Putnam 肖像，他是 1960 年 Davis-Putnam 过程论文共同作者。
- source_name: Wikimedia Commons
- source_page_url: https://commons.wikimedia.org/wiki/File:Hilary_Putnam.jpg
- original_image_url: https://upload.wikimedia.org/wikipedia/commons/3/38/Hilary_Putnam.jpg
- copyright_or_license: Creative Commons Attribution-Share Alike 2.5 Generic, CC BY-SA 2.5；Wikimedia VRT 已记录授权。
- usage: 人物肖像

- local_image_path: resources/images/bench-council-ai100/explainers/1960-davis-putnam-dpll_sat-search.svg
- title: Davis-Putnam 与 DPLL SAT 搜索
- caption: Davis-Putnam 与 DPLL SAT 搜索示意图
- description: 原创本地解释图，展示 CNF 子句、传播、分支、冲突剪枝与模型接受。
- source_name: 根据 Davis-Putnam 1960 与 Davis-Logemann-Loveland 1962 制作的本地解释图
- source_page_url: https://dl.acm.org/doi/10.1145/321033.321034
- original_image_url: Local original explainer
- copyright_or_license: 原创本地解释图；未复用来源论文图像。
- usage: 解释性图形

# 视频片段

未选择必须使用的视频片段。

==================================================
【导航与知识图谱】
==================================================

# 相关人物

- Martin Davis
- Hilary Putnam
- George Logemann
- Donald W. Loveland
- 王浩
- John Alan Robinson

# 相关成就

- 王氏算法
- 归结方法
- SAT 求解
- SMT 求解
- 模型检查

# 相关机构

- 纽约大学
- 普林斯顿大学
- 伦斯勒理工学院
- ACM

# 相关国家

- 美国

# 时间线关联

- Predecessors: 形式逻辑；Church 与 Turing 的不可判定性结果；Gilmore 和 Wang 的证明过程；Logic Theorist。
- Successors: 归结定理证明；CDCL SAT 求解器；SMT 求解器；形式化验证与模型检查。

==================================================
【Museum Metadata】
==================================================

{
  "year": "1960-1962",
  "decade": "1960s",
  "type": "Reasoning",
  "countries": ["USA"],
  "people": ["Martin Davis", "Hilary Putnam", "George Logemann", "Donald W. Loveland"],
  "organizations": ["New York University", "Princeton University", "Rensselaer Polytechnic Institute", "Association for Computing Machinery"],
  "keywords": ["Davis-Putnam", "DPLL", "SAT 求解", "单子句传播", "回溯", "自动定理证明"],
  "related_achievements": ["Wang's algorithm", "Resolution method", "SAT solving", "SMT solving"]
}

==================================================
【参考资料】
==================================================

# 一手资料

- Davis, M., & Putnam, H. (1960). A computing procedure for quantification theory. Journal of the ACM, 7(3), 201-215. https://doi.org/10.1145/321033.321034
- Davis, M., Logemann, G., & Loveland, D. W. (1962). A machine program for theorem-proving. Communications of the ACM, 5(7), 394-397. https://doi.org/10.1145/368273.368557

# 二手资料

- BenchCouncil. (n.d.). AI100: Top 100 AI achievements. Retrieved June 3, 2026, from https://www.benchcouncil.org/evaluation/ai/
- Wikimedia Commons. (n.d.). File: Hilary Putnam.jpg. Retrieved June 3, 2026, from https://commons.wikimedia.org/wiki/File:Hilary_Putnam.jpg
