# 潜在狄利克雷分配

## Full Name
Latent Dirichlet Allocation

## Year / Period
2003

## Type
概率图模型

## One-Sentence Summary
潜在狄利克雷分配 是 AI100 中的重要成就，连接了 概率图模型 与后续 AI 系统的发展。

## Hero Description
潜在狄利克雷分配为主题模型提供了清晰的概率形式。文档是主题的混合，主题是词的分布，推断过程估计生成可见文本的隐藏结构。LDA 成为探索性文本分析和概率机器学习教学中的标准模型。

## People & Place
- David Blei: LDA 第一作者
- Michael Jordan: 共同作者，概率机器学习研究者

Key place: 加州大学伯克利分校 / 斯坦福大学

## Historical Background
文本集合需要无需手工标注每个主题就能发现结构的方法。LDA 把隐藏主题假设明确写成概率模型。

## Canonical Source
Latent Dirichlet Allocation. David M. Blei, Andrew Y. Ng, Michael I. Jordan, Journal of Machine Learning Research, 2003. https://jmlr.org/papers/v3/blei03a.html

## Core Idea
每篇文档抽取一个主题混合；每个词先选择主题，再从该主题词分布中生成词。

## Key Concepts
- 主题混合: 一篇文档可以组合多个主题，而不是只属于一个类别。
- 词分布: 每个主题表示为词上的概率分布。
- 变分推断: 近似推断从可见词估计隐藏主题分配。

## Impact
LDA 影响了主题模型、贝叶斯非参数、变分推断，以及通过生成故事解释数据的习惯。

## Photos
- local_image_path: resources/images/bench-council-ai100/photos/2003-lda_david-blei.jpg
  title: David M. Blei 肖像
  source_name: Columbia University personal page
  source_page_url: https://www.cs.columbia.edu/~blei/
  original_image_url: https://www.cs.columbia.edu/~blei/static/blei-hi-res.jpg
  copyright_or_license: Personal website photo; rights not stated.
- local_image_path: resources/images/bench-council-ai100/explainers/2003-lda_topic-simplex.svg
  title: 主题混合单纯形
  source_name: JMLR
  source_page_url: https://jmlr.org/papers/v3/blei03a.html
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.
- local_image_path: resources/images/bench-council-ai100/explainers/2003-lda_plate-model.svg
  title: Plate 模型草图
  source_name: JMLR
  source_page_url: https://jmlr.org/papers/v3/blei03a.html
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.

## Related Achievements
- 贝叶斯网络
- 神经语言模型
- 主题模型

## Museum Metadata
{
  "year": "2003",
  "type": "概率图模型",
  "people": ["David Blei","Michael Jordan"],
  "keywords": ["probabilistic-models","topic-modeling"]
}

## References
- 论文: Latent Dirichlet Allocation. https://jmlr.org/papers/v3/blei03a.html
- 作者: David M. Blei homepage. https://www.cs.columbia.edu/~blei/
- 实现: scikit-learn LatentDirichletAllocation. https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.LatentDirichletAllocation.html
