# Deep Q Network

## Full Name
Playing Atari with Deep Reinforcement Learning

## Year / Period
2013

## Type
Reinforce learning

## One-Sentence Summary
Deep Q Network is a major AI100 achievement connecting Reinforce learning to later AI systems.

## Hero Description
DQN joined deep neural networks with reinforcement learning and made Atari a landmark benchmark. The agent learned values directly from pixels using experience replay and a target network, reaching strong performance across multiple games. It became a central bridge from classic RL to deep RL.

## People & Place
- Volodymyr Mnih: First author of DQN work
- David Silver: DeepMind reinforcement learning researcher

Key place: DeepMind

## Historical Background
Classic reinforcement learning had strong theory, but scaling from raw pixels to control remained difficult. DQN made that scaling visible.

## Canonical Source
Playing Atari with Deep Reinforcement Learning. Volodymyr Mnih et al., DeepMind, 2013. https://arxiv.org/abs/1312.5602

## Core Idea
Experience replay breaks correlations in recent experience, while a target network stabilizes value updates.

## Key Concepts
- Experience Replay: Past transitions are sampled again to make learning more stable and data-efficient.
- Target Network: A delayed copy of the value network reduces moving-target instability.
- Q-value: The network estimates future return for each action.

## Impact
DQN opened the path toward deep RL systems that learned from perception, action, and reward in a single loop.

## Photos
- local_image_path: resources/images/bench-council-ai100/photos/2013-dqn_volodymyr-mnih.jpg
  title: Volodymyr Mnih portrait
  source_name: University of Toronto personal page
  source_page_url: https://www.cs.utoronto.ca/~vmnih/
  original_image_url: https://www.cs.utoronto.ca/~vmnih/paris.jpg
  copyright_or_license: Personal website photo; rights not stated.
- local_image_path: resources/images/bench-council-ai100/explainers/2013-dqn_replay-buffer.svg
  title: Replay buffer
  source_name: arXiv / Nature
  source_page_url: https://arxiv.org/abs/1312.5602
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.
- local_image_path: resources/images/bench-council-ai100/explainers/2013-dqn_q-control.svg
  title: Q-value control loop
  source_name: arXiv / Nature
  source_page_url: https://arxiv.org/abs/1312.5602
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.

## Related Achievements
- Q Learning
- AlphaGo
- A3C

## Museum Metadata
{
  "year": "2013",
  "type": "Reinforce learning",
  "people": ["Volodymyr Mnih","David Silver"],
  "keywords": ["reinforcement-learning","deep-learning"]
}

## References
- Preprint: Playing Atari with Deep Reinforcement Learning. https://arxiv.org/abs/1312.5602
- Paper: Human-level control through deep reinforcement learning. https://www.nature.com/articles/nature14236
- Project note: Google DeepMind: Deep Reinforcement Learning. https://deepmind.google/discover/blog/deep-reinforcement-learning/
