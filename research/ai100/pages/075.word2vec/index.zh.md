# Word2Vec

## Full Name
Distributed Representations of Words and Phrases and their Compositionality

## Year / Period
2013

## Type
神经网络

## One-Sentence Summary
Word2Vec 是 AI100 中的重要成就，连接了 神经网络 与后续 AI 系统的发展。

## Hero Description
Word2Vec 让词向量变得快速、实用且容易采用。Skip-gram 和 CBOW 模型学习出的向量空间中，语义和句法关系表现为几何结构。这些向量成为从计数式 NLP 走向神经语言表示的桥梁。

## People & Place
- Tomas Mikolov: word2vec 论文主要作者

Key place: Google Brain

## Historical Background
Word2Vec 之前，许多 NLP 系统依赖稀疏计数或手工特征。Word2Vec 让密集向量在网页规模上变得实用。

## Canonical Source
Distributed Representations of Words and Phrases and their Compositionality. Tomas Mikolov et al., NeurIPS, 2013. https://arxiv.org/abs/1301.3781

## Core Idea
模型要么由词预测上下文，要么由上下文预测词，从而迫使相关词占据向量空间的相近区域。

## Key Concepts
- Skip-gram: 由中心词预测邻近词。
- 负采样: 通过对比真实词-上下文对和采样负例来加速训练。
- 向量类比: 性别、首都等关系可表现为向量偏移。

## Impact
它的遗产延续在嵌入层、检索系统、类比评测，以及“语言可以被几何组织”的直觉中。

## Photos
- local_image_path: resources/images/bench-council-ai100/photos/2013-word2vec_tomas-mikolov.jpg
  title: Tomas Mikolov 肖像
  source_name: IEEE Signal Processing Society
  source_page_url: https://signalprocessingsociety.org/newsletter/2021/07/industry-leaders-signal-processing-and-machine-learning-tomas-mikolov
  original_image_url: https://signalprocessingsociety.org/sites/default/files/uploads/newsletter/images/Tomas_Mikolov.jpg
  copyright_or_license: IEEE SPS newsletter image; rights not stated.
- local_image_path: resources/images/bench-council-ai100/explainers/2013-word2vec_skipgram-window.svg
  title: Skip-gram 上下文窗口
  source_name: NeurIPS / arXiv
  source_page_url: https://arxiv.org/abs/1301.3781
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.
- local_image_path: resources/images/bench-council-ai100/explainers/2013-word2vec_vector-analogy.svg
  title: 向量类比
  source_name: NeurIPS / arXiv
  source_page_url: https://arxiv.org/abs/1301.3781
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.

## Related Achievements
- 神经语言模型
- GloVe
- Transformer 嵌入

## Museum Metadata
{
  "year": "2013",
  "type": "神经网络",
  "people": ["Tomas Mikolov"],
  "keywords": ["nlp","embeddings"]
}

## References
- 预印本: Efficient Estimation of Word Representations in Vector Space. https://arxiv.org/abs/1301.3781
- 论文: Distributed Representations of Words and Phrases and their Compositionality. https://papers.nips.cc/paper/5021-distributed-representations-of-words-and-phrases-and-their-compositionality
- 代码档案: Google Code archive: word2vec. https://code.google.com/archive/p/word2vec/
