# Deep Belief Network

## Full Name
Fast learning algorithm for deep belief nets

## Year / Period
2006

## Type
Deep Learning

## One-Sentence Summary
Deep Belief Network is an AI100 achievement in Deep learning.

## Hero Description
Deep belief networks helped revive deep learning by showing how deep models could be trained layer by layer. Hinton and collaborators used unsupervised pretraining with restricted Boltzmann machines, then fine-tuned the network for tasks such as digit recognition. The work helped make deep architectures feel trainable again before the GPU-driven deep-learning wave.

## People & Place
- Geoffrey Hinton: Co-author of deep belief net learning

Key place: University of Toronto

## Historical Background
Deep neural networks were hard to optimize with ordinary supervised training. Layer-wise pretraining offered a practical route.

## Canonical Source
Fast learning algorithm for deep belief nets. https://doi.org/10.1162/neco.2006.18.7.1527

## Core Idea
Each layer learns to model patterns in the previous layer, creating a good initialization for the whole deep network.

## Key Concepts
- Restricted Boltzmann Machine: A two-layer generative model used for pretraining.
- Greedy Layer Training: Train one layer at a time before tuning the whole model.
- Fine-Tuning: Supervised training adjusts the pretrained stack for a target task.

## Impact
DBNs helped reopen deep learning research and influenced later representation-learning work.

## Photos
- local_image_path: resources/images/bench-council-ai100/photos/2006-dbn_geoffrey-hinton.jpg
  title: Geoffrey Hinton portrait
  source_name: University of Toronto
  source_page_url: https://www.cs.toronto.edu/~hinton/pages/photos.html
  original_image_url: https://www.cs.toronto.edu/~hinton/geoff1.jpg
  copyright_or_license: University personal photo page; reuse rights not stated.
- local_image_path: resources/images/bench-council-ai100/explainers/2006-dbn_stacked-rbms.svg
  title: Stacked RBM pretraining
  source_name: Neural Computation
  source_page_url: https://doi.org/10.1162/neco.2006.18.7.1527
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.
- local_image_path: resources/images/bench-council-ai100/explainers/2006-dbn_wake-finetune.svg
  title: Pretrain then fine-tune
  source_name: Neural Computation
  source_page_url: https://doi.org/10.1162/neco.2006.18.7.1527
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.

## Related Achievements
- Back-propagation
- Dropout
- Deep learning

## Museum Metadata
{
  "year": "2006",
  "type": "Deep Learning",
  "people": ["Geoffrey Hinton"],
  "keywords": ["deep-learning","pretraining"]
}

## References
- A Fast Learning Algorithm for Deep Belief Nets. https://doi.org/10.1162/neco.2006.18.7.1527
- Reducing the Dimensionality of Data with Neural Networks. https://doi.org/10.1126/science.1127647
- Geoffrey Hinton photo page. https://www.cs.toronto.edu/~hinton/pages/photos.html
