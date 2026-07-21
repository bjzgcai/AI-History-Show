# 统一 UI 详情页内容省略情况汇总

## 检查范围

- 检查日期：2026-07-21
- 页面：统一 UI 事件详情页
- 视口：3000 × 1000
- 事件数量：109 个当前运行时事件
- 语言：中文、英文
- 检查次数：218 次
- 检查内容：详情页地址、关键人物姓名与角色、事件标题

## 结论

- 当前真正发生文字省略的内容只有地址。
- 共 7 个事件、8 个语言版本的地址超过两行并触发省略。
- 所有被省略的地址都保留了完整悬停提示，鼠标停留后可查看地址全称。
- 人物姓名和角色当前没有发生文字裁切或省略。
- 有 3 个英文事件的人物栏宽度超过可视区域，需要横向滚动，但人物文字本身完整保留。
- 本次检查没有发现事件标题越界，也没有发现页面横向溢出。

## 地址省略明细

地址采用自然连续排版，最多显示两行。下列地址实际需要三行或四行，因此在第二行末尾显示省略号。

| 事件 | 语言 | 完整地址 | 原始所需行数 | 悬停全称 |
| --- | --- | --- | ---: | --- |
| DP/DPLL 算法（`1960-davis-putnam-dpll`） | 中文 | 纽约大学 / 普林斯顿大学 / 伦斯勒理工学院，美国，纽约与普林斯顿 | 3 行 | 已保留 |
| Logic Theorist（`1956-logic-theorist`） | 英文 | RAND Corporation / Carnegie Institute of Technology, Santa Monica and Pittsburgh, United States | 3 行 | 已保留 |
| Davis-Putnam & DPLL（`1960-davis-putnam-dpll`） | 英文 | New York University / Princeton University / RPI, New York and Princeton, United States | 4 行 | 已保留 |
| Resolution Method（`1965-resolution-method`） | 英文 | Argonne National Laboratory / Syracuse University, Illinois and New York, United States | 3 行 | 已保留 |
| PROLOG（`1973-prolog`） | 英文 | Aix-Marseille University and University of Edinburgh, Marseille, France and Edinburgh, United Kingdom | 3 行 | 已保留 |
| Temporal-Difference Update（`1988-td-update`） | 英文 | GTE Laboratories / University of Massachusetts lineage, United States and Canada | 3 行 | 已保留 |
| IBM Watson（`2011-ibm-watson`） | 英文 | IBM Thomas J. Watson Research Center, New York, United States | 3 行 | 已保留 |
| Adam Optimizer（`2014-adam`） | 英文 | University of Amsterdam / University of Toronto, Amsterdam, Netherlands and Toronto, Canada | 3 行 | 已保留 |

除以上项目外，其余地址均能在两行以内完整显示，不会出现省略号。

## 人物栏溢出明细

以下人物栏的总宽度超过当前可视宽度。页面通过横向滚动保留全部人物内容，没有对姓名或角色文字使用省略号。

| 事件 | 语言 | 超出宽度 | 人物与角色 |
| --- | --- | ---: | --- |
| Davis-Putnam & DPLL（`1960-davis-putnam-dpll`） | 英文 | 204 px | Martin Davis：Co-developed Davis-Putnam and DPLL procedures；Hilary Putnam：Co-authored the 1960 Davis-Putnam procedure；George Logemann：Co-authored the 1962 DPLL program paper |
| Simulated Annealing（`1983-simulated-annealing`） | 英文 | 236 px | Scott Kirkpatrick、C. Daniel Gelatt Jr.、Mario P. Vecchi：均显示完整姓名及论文作者角色 |
| Support Vector Machines（`1992-svm`） | 英文 | 459 px | Vladimir Vapnik：Co-developed optimal-margin classifiers and statistical learning theory；Bernhard Boser、Isabelle Guyon：Co-author of the 1992 optimal-margin classifier paper |

## 分类说明

- 地址：超过两行时才省略，完整地址通过鼠标悬停显示。
- 人物：目前不省略文字；人物栏过宽时使用横向滚动。
- 标题：当前检查范围内全部完整显示，没有因地址或人物内容发生越界。

本文件记录的是上述固定视口下的当前展示快照。后续如果调整字体、详情页列宽、人物角色文案或事件数据，应重新执行实际页面检查。
