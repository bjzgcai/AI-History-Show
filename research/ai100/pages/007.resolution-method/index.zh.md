# 归结方法

## Full Name
A Machine-Oriented Logic Based on the Resolution Principle

## Year / Period
1965

## Type
自动定理证明

## One-Sentence Summary
归结方法 是 AI100 中的重要成就，连接了 自动定理证明 与后续 AI 系统的发展。

## Hero Description
归结方法把一阶定理证明变成统一的反驳过程：把命题转为子句，否定目标，再推出矛盾。Robinson 将归结与合一结合起来，让自动证明器获得一种可系统实现的紧凑规则。它后来成为逻辑程序设计、SAT/SMT 谱系以及许多推理系统的基础。

## People & Place
- John Alan Robinson: 归结原理提出者

Key place: 阿贡国家实验室 / 雪城大学

## Historical Background
早期定理证明器往往依赖许多专门推理规则。归结把证明搜索压缩为少量子句操作，让机械化逻辑不再那么临时拼装。

## Canonical Source
A Machine-Oriented Logic Based on the Resolution Principle. John Alan Robinson, Journal of the ACM, 1965. https://doi.org/10.1145/321250.321253

## Core Idea
关键动作是反驳：先假设结论为假，再不断归结互补文字，直到推出空子句。

## Key Concepts
- 子句形式: 命题被转成文字析取子句，使同一条推理规则可以反复作用。
- 合一: 变量通过替换匹配，让一条规则能处理大量具体公式。
- 空子句: 推出空子句意味着否定目标与前提不相容。

## Impact
它的长期影响体现在 Prolog、自动定理证明、约束求解，以及把推理表示为可搜索符号变换的工程习惯中。

## Photos
- local_image_path: resources/images/bench-council-ai100/photos/1965-resolution-method_john-alan-robinson.jpg
  title: John Alan Robinson 肖像
  source_name: Wikimedia Commons
  source_page_url: https://commons.wikimedia.org/wiki/File:John_Alan_Robinson_IMG_0493.jpg
  original_image_url: https://commons.wikimedia.org/wiki/Special:FilePath/John_Alan_Robinson_IMG_0493.jpg
  copyright_or_license: Creative Commons license stated on Commons file page.
- local_image_path: resources/images/bench-council-ai100/explainers/1965-resolution-method_clause-refutation.svg
  title: 子句反驳阶梯
  source_name: Journal of the ACM
  source_page_url: https://doi.org/10.1145/321250.321253
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.
- local_image_path: resources/images/bench-council-ai100/explainers/1965-resolution-method_unification-map.svg
  title: 合一映射图
  source_name: Journal of the ACM
  source_page_url: https://doi.org/10.1145/321250.321253
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.

## Related Achievements
- DPLL
- PROLOG
- 自动定理证明

## Museum Metadata
{
  "year": "1965",
  "type": "自动定理证明",
  "people": ["John Alan Robinson"],
  "keywords": ["logic","reasoning"]
}

## References
- 论文: A Machine-Oriented Logic Based on the Resolution Principle. https://doi.org/10.1145/321250.321253
- 评述: Journal of Symbolic Logic review record. https://www.cambridge.org/core/journals/journal-of-symbolic-logic/article/j-a-robinson-a-machineoriented-logic-based-on-the-resolution-principle-journal-of-the-association-for-computing-machinery-vol-12-1965-pp-2341/65679C30B9D7D7763FFB700CA77B18B1
- 背景: Stanford Encyclopedia: Automated Reasoning. https://plato.stanford.edu/entries/reasoning-automated/
