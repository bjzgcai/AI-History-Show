---
number: 3
achievement: "VC theory"
achievement_zh: "VC 理论"
area: "Theory"
area_zh: "理论"
year: "1960-1990"
source_list: "BenchCouncil AI100"
research_status: "draft-complete"
language: "zh"
---

# 成就名称

Vapnik-Chervonenkis 理论 / 统计学习理论

# 年份 / 时期

1960-1990

# 类型

机器学习

# 一句话总结

VC 理论为机器学习中的“泛化”提供了数学解释：什么时候从有限样本中学到的模型能够可靠地推广到未见数据。

# 主视觉标题

- title: VC 理论

# 主视觉简介

- description: VC 理论解释了为什么模型只用有限样本训练后，有时仍能在未见数据上表现可靠。瓦普尼克和切尔沃年基斯用 VC 维等概念把学习、概率和模型容量联系起来。它成为统计学习理论的基础，也深刻影响了机器学习对泛化能力的理解。

# 人物与地点

## 关键人物

- 名称: 弗拉基米尔·N·瓦普尼克（Vladimir N. Vapnik）
- 角色: 统计学家、计算机科学家；VC 理论共同创建者；《The Nature of Statistical Learning Theory》作者
- 机构: 莫斯科控制科学研究所；后来任职于 AT&T 贝尔实验室 / 伦敦大学皇家霍洛威学院 / 哥伦比亚大学
- 国家: 俄罗斯 / 美国 / 英国

- 名称: 阿列克谢·雅·切尔沃年基斯（Alexey Ya. Chervonenkis）
- 角色: 数学家、计算机科学家；VC 理论共同创建者
- 机构: 莫斯科控制科学研究所
- 国家: 俄罗斯

## 关键机构

- 名称: 莫斯科控制科学研究所
- 类型: 研究机构
- 国家: 俄罗斯

- 名称: 施普林格（Springer）
- 类型: 学术出版社
- 国家: 德国 / 美国

- 名称: 工业与应用数学学会（Society for Industrial and Applied Mathematics, SIAM）
- 类型: 学术学会 / 出版机构
- 国家: 美国

- 名称: AT&T 实验室研究部
- 类型: 工业研究实验室
- 国家: 美国

- 名称: 伦敦大学皇家霍洛威学院
- 类型: 大学
- 国家: 英国

## 关键地点

- 莫斯科，俄罗斯
- 雷德班克，美国新泽西州
- 埃格姆，英国萨里郡

==================================================
【核心内容】
==================================================

# 历史背景

早期机器学习和模式识别面临一个核心问题：模型可以很好地拟合训练数据，却在新数据上失败。经典统计学对特定模型族有很多工具，但 AI 需要更一般的原则，用来理解从大量候选函数中选择学习机器时，何时能够泛化。

Vapnik 和 Chervonenkis 发展了均匀收敛理论：在什么条件下，样本中测得的经验频率会在整个事件类或假设类上同时收敛到真实概率？这引出了增长函数和 VC 维等概念，用来衡量假设类的表达能力。

这一理论在数十年中逐渐成熟，并在 Vapnik 1995 年的《The Nature of Statistical Learning Theory》中得到系统总结。到 1990 年代，它还帮助推动了支持向量机，把高度数学化的学习理论转化为实用算法。

# 经典来源

- 标题: On the Uniform Convergence of Relative Frequencies of Events to Their Probabilities
- 作者: Vladimir N. Vapnik and Alexey Ya. Chervonenkis
- 发表载体: Theory of Probability and Its Applications, Volume 16, Issue 2, pages 264-280
- 年份: 1971
- DOI: 10.1137/1116025
- URL: https://epubs.siam.org/doi/10.1137/1116025

- 标题: The Nature of Statistical Learning Theory
- 作者: Vladimir N. Vapnik
- 发表载体: Springer
- 年份: 1995
- DOI: 10.1007/978-1-4757-2440-0
- URL: https://link.springer.com/book/10.1007/978-1-4757-2440-0

- 标题: An Overview of Statistical Learning Theory
- 作者: Vladimir N. Vapnik
- 发表载体: IEEE Transactions on Neural Networks, Volume 10, Issue 5, pages 988-999
- 年份: 1999
- DOI: 10.1109/72.788640
- URL: https://pubmed.ncbi.nlm.nih.gov/18252602/

# 核心思想

核心问题很直观：如果一个模型在见过的样本上表现很好，我们什么时候应该相信它也会在没见过的样本上表现好？

VC 理论认为，答案不仅取决于数据量，也取决于模型类有多灵活。非常灵活的模型类可以记住几乎任何训练标签，因此训练准确率本身并不令人信服。VC 维衡量一个模型类能够对多少个点实现所有可能的标注方式。相对于样本量而言，容量越受控制，泛化保证就越强。

这不同于只关注拟合模型或估计参数的旧观点。VC 理论把学习看作在函数类上进行风险最小化，并给出连接样本量、模型容量、训练误差和期望测试误差的数学界限。

# 关键概念

- VC 维（VC Dimension）: VC 维衡量一类分类器有多灵活。容量越高，模型越能拟合复杂标签模式，通常也需要更多数据才能可靠泛化。
- 均匀收敛（Uniform Convergence）: 均匀收敛关注训练样本上的测量是否能在整个模型类上接近真实概率。它连接了训练表现和期望测试表现。
- 结构风险最小化（Structural Risk Minimization）: 结构风险最小化在训练误差和模型容量之间做平衡。它解释了为什么最好的学习器不一定是最贴合训练数据的模型。

==================================================
【影响力】
==================================================

# 影响

## 学术影响

BenchCouncil 将《The Nature of Statistical Learning Theory》列为 104,601 次引用。Springer 的 1995 年图书页面列出超过 22,000 次引用，并说明该书讨论学习和泛化背后的基本思想。1971 年 Vapnik-Chervonenkis 论文仍然是均匀收敛和 VC 维的经典来源。

VC 理论影响了计算学习理论、统计学习理论、经验过程理论、模式识别、核方法、支持向量机和现代泛化理论。即使后来的深度学习行为并不总能被经典 VC 界限很好解释，容量、样本复杂度和泛化这些概念仍然是机器学习理论的核心语言。

## 产业影响

VC 理论直接影响了支持向量机的兴起。深度学习成为主流之前，SVM 被广泛用于文本分类、生物信息学、计算机视觉、手写识别、垃圾邮件过滤，以及中小规模数据分类问题。该理论也影响了工业机器学习中的模型选择、正则化思维和评估纪律。

## 长期遗产

VC 理论至今仍是机器学习理论课程中的基础内容。它的直接数值界限对大型现代神经网络往往偏松，但它的历史和概念价值仍然很高，因为它把泛化从一种经验期待变成了可以精确定义的数学问题。

==================================================
【专家评价】
==================================================

# 专家评价

- 引文: "Statistical learning theory was introduced in the late 1960's."
- 译文: “统计学习理论是在 1960 年代后期被提出的。”
- 人物: 弗拉基米尔·N·瓦普尼克
- 机构: AT&T 实验室研究部
- 年份: 1999
- 来源 URL: https://pubmed.ncbi.nlm.nih.gov/18252602/

- 引文: "During last fifty years a strong machine learning theory has been developed."
- 译文: “在过去五十年中，一套强有力的机器学习理论已经发展起来。”
- 人物: 弗拉基米尔·N·瓦普尼克
- 机构: Institute for Advanced Study 讲座说明
- 年份: 2015
- 来源 URL: https://www.ias.edu/video/csdm/2015/0330-VladimirVapnik

今天的专家通常认为 VC 理论是机器学习的数学基础之一。同时他们也会区分它的奠基意义和局限：经典 VC 式泛化界限对过参数化深度学习可能过于保守，但这一理论仍然是理解训练表现与测试表现为何不同的核心框架。

==================================================
【多媒体】
==================================================

# 图片

images:

- photos/1971-vc-theory_vladimir-vapnik.png
- photos/1971-vc-theory_generalization.svg

imageMeta:

- local_image_path: photos/1971-vc-theory_vladimir-vapnik.png
- title: 弗拉基米尔·瓦普尼克 IAS 演讲
- caption: 弗拉基米尔·瓦普尼克演讲页面
- description: IAS 官方视频页面，记录 Vapnik 2015 年关于智能学习的演讲。
- source_name: Institute for Advanced Study
- source_page_url: https://www.ias.edu/video/csdm/2015/0330-VladimirVapnik
- original_image_url: Not available
- copyright_or_license: IAS page; consult IAS media permissions before reuse.
- usage: 人物肖像 / 演讲截图

- local_image_path: photos/1971-vc-theory_generalization.svg
- title: VC 泛化解释图
- caption: 容量与泛化
- description: 本地解释图，展示 VC 理论如何连接假设空间、样本规模和泛化能力。
- source_name: Local explainer based on Vapnik-Chervonenkis theory
- source_page_url: https://epubs.siam.org/doi/10.1137/1116025
- original_image_url: Local original explainer
- copyright_or_license: Original local explainer; source text and figure reuse rights not used.
- usage: 解释性图形

# 视频片段

- 标题: Intelligent learning: similarity control and knowledge transfer
- URL: https://www.ias.edu/video/csdm/2015/0330-VladimirVapnik
- 平台: 高等研究院视频
- 时长: 来源页面未列出
- 描述: 瓦普尼克关于统计学习理论、结构风险最小化、SVM 和特权信息的演讲。

- 标题: Complete Statistical Theory of Learning
- URL: https://www.youtube.com/watch?v=Ow25mjFjSmg
- 平台: YouTube / MIT Deep Learning Series
- 时长: 约 1 小时
- 描述: 弗拉基米尔·瓦普尼克在 MIT Deep Learning Series 中关于学习统计理论的演讲。

==================================================
【导航与知识图谱】
==================================================

# 相关人物

- 弗拉基米尔·瓦普尼克
- 阿列克谢·切尔沃年基斯
- 科琳娜·科尔特斯
- 莱斯利·瓦利安特
- 伯恩哈德·舍尔科普夫
- 奥利维耶·布斯凯
- 托马索·波焦
- 弗拉基米尔·沃夫克

# 相关成就

- 计算复杂性理论
- 支持向量机（SVM）
- 核方法
- 反向传播
- PAC 学习
- 支持向量网络

# 相关机构

- 莫斯科控制科学研究所
- AT&T 实验室研究部
- 伦敦大学皇家霍洛威学院
- Springer
- SIAM
- IEEE

# 相关国家

- 俄罗斯
- 美国
- 英国

# 时间线关联

- Predecessors: 经典概率论；经验过程理论；模式识别；统计决策理论。
- Successors: PAC learning；支持向量机；核方法；现代泛化理论；深度网络学习理论分析。

==================================================
【Museum Metadata】
==================================================

{
  "year": "1960-1990",
  "decade": "1960s-1990s",
  "type": "Machine Learning",
  "countries": ["Russia", "USA", "UK"],
  "people": ["Vladimir Vapnik", "Alexey Chervonenkis", "Corinna Cortes", "Leslie Valiant", "Bernhard Scholkopf", "Olivier Bousquet"],
  "organizations": ["Institute of Control Sciences Moscow", "AT&T Labs Research", "Royal Holloway University of London", "Springer", "SIAM", "IEEE"],
  "keywords": ["VC 理论", "VC 维", "统计学习理论", "均匀收敛", "泛化", "结构风险最小化", "支持向量机"],
  "related_achievements": ["Complexity theory", "SVM", "Kernel methods", "PAC learning", "Support vector networks"]
}

==================================================
【参考资料】
==================================================

# 一手资料

- Vapnik, V. N. (1995). The nature of statistical learning theory. Springer. https://doi.org/10.1007/978-1-4757-2440-0
- Vapnik, V. N. (1999). An overview of statistical learning theory. IEEE Transactions on Neural Networks, 10(5), 988-999. https://doi.org/10.1109/72.788640
- Vapnik, V. N., & Chervonenkis, A. Ya. (1971). On the uniform convergence of relative frequencies of events to their probabilities. Theory of Probability and Its Applications, 16(2), 264-280. https://doi.org/10.1137/1116025

# 二手资料

- BenchCouncil. (n.d.). AI100: Top 100 AI achievements. Retrieved June 2, 2026, from https://www.benchcouncil.org/evaluation/ai/
- Institute for Advanced Study. (2015). Intelligent learning: Similarity control and knowledge transfer. https://www.ias.edu/video/csdm/2015/0330-VladimirVapnik
- Math-Net.Ru. (n.d.). V. N. Vapnik, A. Ya. Chervonenkis, On uniform convergence of the frequencies of events to their probabilities. Retrieved June 2, 2026, from https://www.mathnet.ru/php/archive.phtml?jrnid=tvp&option_lang=eng&paperid=2146&wshow=paper
- Royal Holloway, University of London. (2012). Vladimir Vapnik publications. https://cml.rhul.ac.uk/publications/vapnik/index.shtml
- Springer Nature. (n.d.). The nature of statistical learning theory. Retrieved June 2, 2026, from https://link.springer.com/book/10.1007/978-1-4757-2440-0
