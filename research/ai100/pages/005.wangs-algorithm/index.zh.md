---
number: 5
achievement: "Wang's algorithm"
achievement_zh: "王氏算法"
area: "Automated theorem proving"
area_zh: "自动定理证明"
year: "1958-1961"
source_list: "BenchCouncil AI100"
research_status: "draft-complete"
language: "zh"
---

# 成就名称

王氏算法 / 基于模式识别的定理证明。

# 年份 / 时期

1958-1961

# 类型

推理

# 一句话总结

王浩证明了机器可以通过识别和归约逻辑模式来自动证明许多定理，而不只是枚举所有真值赋值。

# 主视觉标题

- title: 王氏算法

# 主视觉简介

- description: 王浩的工作让自动定理证明成为一种可运行的逻辑过程。它把公式转换为可识别的形状，应用证明规则，并在满足证明条件时闭合分支。这项工作连接了早期符号 AI 演示与后来的证明过程和 SAT 式推理。

# 人物与地点

## 关键人物

- 名称: 王浩 (Hao Wang)
- 角色: 逻辑学家、数学家、哲学家；基于模式识别的定理证明过程提出者
- 机构: 贝尔电话实验室；后任职于 Rockefeller University
- 国家: 美国 / 中国

## 关键机构

- 名称: 贝尔电话实验室
- 类型: 工业研究实验室
- 国家: 美国

- 名称: 美国计算机协会 (ACM)
- 类型: 专业学会 / 出版机构
- 国家: 美国

## 关键地点

- 美国新泽西州默里山
- 美国纽约

==================================================
【核心内容】
==================================================

# 历史背景

到 1950 年代末，人工智能与数理逻辑正在围绕一个实际问题汇合：计算机是否不仅能做数值计算，也能操纵形式证明？Logic Theorist 等早期系统已经展示了符号证明搜索，但研究者仍需要更系统的形式逻辑证明过程。

王浩的工作正是在这一背景下出现的。它把定理证明看成识别有用逻辑形式的过程，而不只是依靠真值表枚举。其方法使用与相继式和谓词演算结构相关的变换。

# 经典来源

- 标题: Proving theorems by pattern recognition I
- 作者: Hao Wang
- 发表载体: Communications of the ACM, 3(4), 220-234
- 年份: 1960
- DOI: 10.1145/367177.367224
- URL: https://cacm.acm.org/research/proving-theorems-by-pattern-recognition-i/

- 标题: Proving Theorems by Pattern Recognition - II
- 作者: Hao Wang
- 发表载体: Bell System Technical Journal
- 年份: 1961
- DOI: N/A
- URL: https://www.nokia.com/bell-labs/publications-and-media/publications/proving-theorems-by-pattern-recognition-ii/

# 核心思想

核心思想是用公式的形状来引导证明搜索。如果公式具有可识别的连接词或量词结构，过程就能应用相应规则，将证明义务拆分、简化或移动到更小的子目标。

这不同于盲目真值表搜索，因为它把逻辑结构作为信息使用。算法仍然在搜索，但搜索的是有意义的变换路径。

# 关键概念

- 模式识别: 将逻辑形式与已知规则模式匹配，让证明沿结构化变换推进。
- 证明归约: 把复杂定理变成更小的子目标，直到分支闭合或需要继续搜索。
- 机械数学: 王浩更广义的观点，即数学证明可以通过机器可执行的符号过程来处理。

==================================================
【影响力】
==================================================

# 影响

## 学术影响

BenchCouncil 将《Proving theorems by pattern recognition I》列为 173 次引用。该工作成为早期自动定理证明谱系的一部分，常与 Logic Theorist、Davis-Putnam、DPLL 和归结方法一起讨论。

## 产业影响

原始算法本身不是商业产品。它的产业价值更多是方法论层面的：它展示了证明过程可以在当时的机器上运行，并帮助确立定理证明作为计算任务的地位。

## 长期遗产

具体过程已经具有历史性，但利用公式结构引导证明搜索的思想仍然存在于自动演绎、SAT 求解、SMT 求解、证明助手和形式化验证之中。

==================================================
【专家评价】
==================================================

# 专家评价

- 引文: "A proof procedure for the predicate calculus is given"
- 译文: “给出了一个谓词演算的证明过程。”
- 人物: 王浩
- 机构: Bell System Technical Journal
- 年份: 1961
- 来源 URL: https://www.nokia.com/bell-labs/publications-and-media/publications/proving-theorems-by-pattern-recognition-ii/

今天的专家通常把王氏算法视为自动定理证明的基础性贡献：它作为现代生产级求解器的直接前身或许有限，但作为形式逻辑、符号 AI 与可执行证明过程之间的历史桥梁非常重要。

==================================================
【多媒体】
==================================================

# 图片

images:

- photos/1958-wangs-algorithm_hao-wang.jpg
- photos/1958-wangs-algorithm_pattern-proof.svg

imageMeta:

- local_image_path: photos/1958-wangs-algorithm_hao-wang.jpg
- title: 王浩肖像
- caption: 王浩肖像
- description: 王浩约 1980 年代肖像，来自 Rockefeller University 历史照片收藏。
- source_name: The Rockefeller University Digital Commons
- source_page_url: https://digitalcommons.rockefeller.edu/faculty-members/109/
- original_image_url: https://digitalcommons.rockefeller.edu/faculty-members/1109/preview.jpg
- copyright_or_license: Historical Photograph Collection preview；页面列出 creator 与 photo credit 为 unknown；未明确复用权利。
- usage: 人物肖像

- local_image_path: photos/1958-wangs-algorithm_pattern-proof.svg
- title: 王氏算法模式证明
- caption: 王氏算法模式证明示意图
- description: 原创本地解释图，展示公式规范化、规则匹配、证明归约与分支闭合。
- source_name: 根据 Wang 1960 与 Wang 1961 制作的本地解释图
- source_page_url: https://cacm.acm.org/research/proving-theorems-by-pattern-recognition-i/
- original_image_url: Local original explainer
- copyright_or_license: 原创本地解释图；未复用来源论文图像。
- usage: 解释性图形

# 视频片段

未选择必须使用的视频片段。

==================================================
【导航与知识图谱】
==================================================

# 相关人物

- 王浩
- Allen Newell
- Herbert A. Simon
- Martin Davis
- Hilary Putnam
- John Alan Robinson

# 相关成就

- Logic Theorist
- Davis-Putnam algorithm and DPLL
- Resolution method
- SAT solving

# 相关机构

- 贝尔电话实验室
- ACM
- Rockefeller University

# 相关国家

- 美国
- 中国

# 时间线关联

- Predecessors: 形式逻辑；《Principia Mathematica》；图灵机；Logic Theorist；早期 IBM 704 定理证明工作。
- Successors: Davis-Putnam 与 DPLL；归结定理证明；SAT 与 SMT 求解器；证明助手。

==================================================
【Museum Metadata】
==================================================

{
  "year": "1958-1961",
  "decade": "1950s-1960s",
  "type": "Reasoning",
  "countries": ["USA", "China"],
  "people": ["Hao Wang"],
  "organizations": ["Bell Telephone Laboratories", "Association for Computing Machinery", "The Rockefeller University"],
  "keywords": ["王氏算法", "自动定理证明", "模式识别", "谓词演算", "机械数学"],
  "related_achievements": ["Logic Theorist", "Davis-Putnam algorithm and DPLL", "Resolution method", "SAT solving"]
}

==================================================
【参考资料】
==================================================

# 一手资料

- Wang, H. (1960). Proving theorems by pattern recognition I. Communications of the ACM, 3(4), 220-234. https://doi.org/10.1145/367177.367224
- Wang, H. (1961). Proving theorems by pattern recognition - II. Bell System Technical Journal. https://www.nokia.com/bell-labs/publications-and-media/publications/proving-theorems-by-pattern-recognition-ii/

# 二手资料

- BenchCouncil. (n.d.). AI100: Top 100 AI achievements. Retrieved June 3, 2026, from https://www.benchcouncil.org/evaluation/ai/
- The Rockefeller University Digital Commons. (n.d.). Wang, Hao. Retrieved June 3, 2026, from https://digitalcommons.rockefeller.edu/faculty-members/109/
