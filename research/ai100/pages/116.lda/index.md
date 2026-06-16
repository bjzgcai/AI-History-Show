# Latent Dirichlet Allocation

## Full Name
Latent Dirichlet Allocation

## Year / Period
2003

## Type
Probabilistic graphical model

## One-Sentence Summary
Latent Dirichlet Allocation is a major AI100 achievement connecting Probabilistic graphical model to later AI systems.

## Hero Description
Latent Dirichlet Allocation gave topic modeling a clean probabilistic form. Documents are mixtures of topics, topics are distributions over words, and inference estimates the hidden structure that produced observed text. LDA became a standard model for exploratory text analysis and probabilistic machine learning education.

## People & Place
- David Blei: First author of LDA
- Michael Jordan: Co-author and probabilistic ML researcher

Key place: UC Berkeley / Stanford University

## Historical Background
Text collections needed methods that discovered structure without hand-labeling every theme. LDA made the hidden-topic assumption explicit and probabilistic.

## Canonical Source
Latent Dirichlet Allocation. David M. Blei, Andrew Y. Ng, Michael I. Jordan, Journal of Machine Learning Research, 2003. https://jmlr.org/papers/v3/blei03a.html

## Core Idea
Each document draws a topic mixture; each word chooses a topic and then a word from that topic’s distribution.

## Key Concepts
- Topic Mixture: A document can combine several themes instead of belonging to one class.
- Word Distribution: Each topic is represented as probabilities over words.
- Variational Inference: Approximate inference estimates hidden topic assignments from observed words.

## Impact
LDA influenced topic modeling, Bayesian nonparametrics, variational inference, and the habit of explaining data through generative stories.

## Photos
- local_image_path: resources/images/bench-council-ai100/photos/2003-lda_david-blei.jpg
  title: David M. Blei portrait
  source_name: Columbia University personal page
  source_page_url: https://www.cs.columbia.edu/~blei/
  original_image_url: https://www.cs.columbia.edu/~blei/static/blei-hi-res.jpg
  copyright_or_license: Personal website photo; rights not stated.
- local_image_path: resources/images/bench-council-ai100/explainers/2003-lda_topic-simplex.svg
  title: Topic mixture simplex
  source_name: JMLR
  source_page_url: https://jmlr.org/papers/v3/blei03a.html
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.
- local_image_path: resources/images/bench-council-ai100/explainers/2003-lda_plate-model.svg
  title: Plate model sketch
  source_name: JMLR
  source_page_url: https://jmlr.org/papers/v3/blei03a.html
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.

## Related Achievements
- Bayesian network
- Neural language models
- Topic modeling

## Museum Metadata
{
  "year": "2003",
  "type": "Probabilistic graphical model",
  "people": ["David Blei","Michael Jordan"],
  "keywords": ["probabilistic-models","topic-modeling"]
}

## References
- Paper: Latent Dirichlet Allocation. https://jmlr.org/papers/v3/blei03a.html
- Author: David M. Blei homepage. https://www.cs.columbia.edu/~blei/
- Implementation: scikit-learn LatentDirichletAllocation. https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.LatentDirichletAllocation.html
