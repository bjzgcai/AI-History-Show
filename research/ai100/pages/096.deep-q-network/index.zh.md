# 深度 Q 网络

## Full Name
Playing Atari with Deep Reinforcement Learning

## Year / Period
2013

## Type
强化学习

## One-Sentence Summary
深度 Q 网络 是 AI100 中的重要成就，连接了 强化学习 与后续 AI 系统的发展。

## Hero Description
DQN 把深度神经网络与强化学习结合起来，让 Atari 成为标志性基准。智能体用经验回放和目标网络直接从像素学习价值函数，在多款游戏上取得强表现。它成为经典强化学习走向深度强化学习的关键桥梁。

## People & Place
- Volodymyr Mnih: DQN 工作第一作者
- David Silver: DeepMind 强化学习研究者

Key place: DeepMind

## Historical Background
经典强化学习有坚实理论，但从原始像素扩展到控制任务仍然困难。DQN 让这种扩展变得可见。

## Canonical Source
Playing Atari with Deep Reinforcement Learning. Volodymyr Mnih et al., DeepMind, 2013. https://arxiv.org/abs/1312.5602

## Core Idea
经验回放打破近期经验的相关性，目标网络则稳定价值更新。

## Key Concepts
- 经验回放: 过去转移会被再次采样，使学习更稳定也更省数据。
- 目标网络: 价值网络的延迟副本减少移动目标的不稳定。
- Q 值: 网络估计每个动作的未来回报。

## Impact
DQN 打开了深度强化学习系统之路，让感知、行动和奖励进入同一个学习循环。

## Photos
- local_image_path: resources/images/bench-council-ai100/photos/2013-dqn_volodymyr-mnih.jpg
  title: Volodymyr Mnih 肖像
  source_name: University of Toronto personal page
  source_page_url: https://www.cs.utoronto.ca/~vmnih/
  original_image_url: https://www.cs.utoronto.ca/~vmnih/paris.jpg
  copyright_or_license: Personal website photo; rights not stated.
- local_image_path: resources/images/bench-council-ai100/explainers/2013-dqn_replay-buffer.svg
  title: 经验回放池
  source_name: arXiv / Nature
  source_page_url: https://arxiv.org/abs/1312.5602
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.
- local_image_path: resources/images/bench-council-ai100/explainers/2013-dqn_q-control.svg
  title: Q 值控制循环
  source_name: arXiv / Nature
  source_page_url: https://arxiv.org/abs/1312.5602
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.

## Related Achievements
- Q 学习
- AlphaGo
- A3C

## Museum Metadata
{
  "year": "2013",
  "type": "强化学习",
  "people": ["Volodymyr Mnih","David Silver"],
  "keywords": ["reinforcement-learning","deep-learning"]
}

## References
- 预印本: Playing Atari with Deep Reinforcement Learning. https://arxiv.org/abs/1312.5602
- 论文: Human-level control through deep reinforcement learning. https://www.nature.com/articles/nature14236
- 项目说明: Google DeepMind: Deep Reinforcement Learning. https://deepmind.google/discover/blog/deep-reinforcement-learning/
