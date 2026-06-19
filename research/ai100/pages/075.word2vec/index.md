# Word2Vec

## Full Name
Distributed Representations of Words and Phrases and their Compositionality

## Year / Period
2013

## Type
Neural Network

## One-Sentence Summary
Word2Vec is a major AI100 achievement connecting Neural Network to later AI systems.

## Hero Description
Word2Vec made word embeddings fast, useful, and widely adoptable. Skip-gram and CBOW models learned vector spaces where semantic and syntactic relationships appeared as geometry. These vectors became a bridge from count-based NLP to neural language representation.

## People & Place
- Tomas Mikolov: Lead author of word2vec papers

Key place: Google Brain

## Historical Background
Before word2vec, many NLP systems relied on sparse counts or hand-built features. Word2vec made dense vectors practical at web scale.

## Canonical Source
Distributed Representations of Words and Phrases and their Compositionality. Tomas Mikolov et al., NeurIPS, 2013. https://arxiv.org/abs/1301.3781

## Core Idea
The model predicts context from a word or a word from context, forcing related words to occupy nearby regions of vector space.

## Key Concepts
- Skip-gram: Predicts neighboring words from a center word.
- Negative Sampling: Speeds training by contrasting observed word-context pairs with sampled alternatives.
- Vector Analogy: Relations such as gender or capital-city can appear as vector offsets.

## Impact
The legacy continues in embedding layers, retrieval systems, analogical evaluation, and the intuition that language can be organized geometrically.

## Photos
- local_image_path: resources/images/bench-council-ai100/photos/2013-word2vec_tomas-mikolov.jpg
  title: Tomas Mikolov portrait
  source_name: IEEE Signal Processing Society
  source_page_url: https://signalprocessingsociety.org/newsletter/2021/07/industry-leaders-signal-processing-and-machine-learning-tomas-mikolov
  original_image_url: https://signalprocessingsociety.org/sites/default/files/uploads/newsletter/images/Tomas_Mikolov.jpg
  copyright_or_license: IEEE SPS newsletter image; rights not stated.
- local_image_path: resources/images/bench-council-ai100/explainers/2013-word2vec_skipgram-window.svg
  title: Skip-gram context window
  source_name: NeurIPS / arXiv
  source_page_url: https://arxiv.org/abs/1301.3781
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.
- local_image_path: resources/images/bench-council-ai100/explainers/2013-word2vec_vector-analogy.svg
  title: Vector analogy
  source_name: NeurIPS / arXiv
  source_page_url: https://arxiv.org/abs/1301.3781
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.

## Related Achievements
- Neural Language Model
- GloVe
- Transformer embeddings

## Museum Metadata
{
  "year": "2013",
  "type": "Neural Network",
  "people": ["Tomas Mikolov"],
  "keywords": ["nlp","embeddings"]
}

## References
- Preprint: Efficient Estimation of Word Representations in Vector Space. https://arxiv.org/abs/1301.3781
- Paper: Distributed Representations of Words and Phrases and their Compositionality. https://papers.nips.cc/paper/5021-distributed-representations-of-words-and-phrases-and-their-compositionality
- Code archive: Google Code archive: word2vec. https://code.google.com/archive/p/word2vec/
