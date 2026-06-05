# Dropout

## Full Name
Dropout: A Simple Way to Prevent Neural Networks from Overfitting

## Year / Period
2014

## Type
Neural Network

## One-Sentence Summary
Dropout is a major AI100 achievement connecting Neural Network to later AI systems.

## Hero Description
Dropout made overfitting less dangerous in large neural networks by randomly removing units during training. Each minibatch effectively trains a thinned network, while test-time prediction approximates an ensemble. The idea became a standard regularizer across deep learning toolkits.

## People & Place
- Nitish Srivastava: First author of the JMLR dropout paper
- Geoffrey Hinton: Co-author and deep learning pioneer

Key place: University of Toronto

## Historical Background
As networks grew larger, memorization became a practical training problem. Dropout offered a simple intervention that did not require changing the dataset.

## Canonical Source
Dropout: A Simple Way to Prevent Neural Networks from Overfitting. Nitish Srivastava, Geoffrey Hinton, Alex Krizhevsky, Ilya Sutskever, Ruslan Salakhutdinov, JMLR, 2014. https://jmlr.org/papers/v15/srivastava14a.html

## Core Idea
The core idea is to hide random units during training so hidden features cannot rely too strongly on each other.

## Key Concepts
- Random Mask: Each update keeps only a sampled subset of units active.
- Co-adaptation: Dropout discourages features from relying on exact partners being present.
- Approximate Ensemble: Test-time scaling approximates averaging many thinned networks.

## Impact
Although newer architectures often use many regularizers together, dropout remains a recognizable default in model APIs and teaching materials.

## Photos
- local_image_path: resources/images/bench-council-ai100/photos/2014-dropout_nitish-srivastava.jpg
  title: Nitish Srivastava portrait
  source_name: University of Toronto personal page
  source_page_url: https://www.cs.utoronto.ca/~nitish/
  original_image_url: https://www.cs.utoronto.ca/~nitish/pic.JPG
  copyright_or_license: Personal website photo; rights not stated.
- local_image_path: resources/images/bench-council-ai100/explainers/2014-dropout_random-mask.svg
  title: Random unit mask
  source_name: JMLR
  source_page_url: https://jmlr.org/papers/v15/srivastava14a.html
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.
- local_image_path: resources/images/bench-council-ai100/explainers/2014-dropout_ensemble-average.svg
  title: Approximate ensemble
  source_name: JMLR
  source_page_url: https://jmlr.org/papers/v15/srivastava14a.html
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.

## Related Achievements
- AlexNet
- Regularization
- Deep learning

## Museum Metadata
{
  "year": "2014",
  "type": "Neural Network",
  "people": ["Nitish Srivastava","Geoffrey Hinton"],
  "keywords": ["regularization","deep-learning"]
}

## References
- Paper: Dropout: A Simple Way to Prevent Neural Networks from Overfitting. https://jmlr.org/papers/v15/srivastava14a.html
- Preprint: Improving neural networks by preventing co-adaptation. https://arxiv.org/abs/1207.0580
- Framework docs: PyTorch torch.nn.Dropout. https://docs.pytorch.org/docs/stable/generated/torch.nn.Dropout.html
