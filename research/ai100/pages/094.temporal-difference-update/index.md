# Temporal-Difference Update

## Full Name
Learning to predict by temporal differences

## Year / Period
1988

## Type
Reinforcement Learning

## One-Sentence Summary
Temporal-Difference Update is an AI100 achievement in Reinforcement learning.

## Hero Description
Temporal-difference learning gave reinforcement learning a compact way to learn predictions from experience. Instead of waiting for a final outcome, TD methods update value estimates using the next reward and the next prediction. This bootstrapping idea sits behind many later algorithms, including TD-Gammon, Q-learning, and actor-critic methods.

## People & Place
- Richard Sutton: Author of temporal-difference learning

Key place: GTE Laboratories / University of Massachusetts lineage

## Historical Background
Learning from delayed rewards required a way to assign credit before the entire episode ended.

## Canonical Source
Learning to predict by temporal differences. https://doi.org/10.1007/BF00115009

## Core Idea
TD compares the current prediction with a reward plus the next prediction, then nudges the current value toward that target.

## Key Concepts
- TD Error: The gap between current prediction and one-step bootstrapped target.
- Bootstrapping: A prediction is updated using another prediction.
- Value Function: A function estimates expected future reward from a state.

## Impact
TD learning is a cornerstone of modern reinforcement learning and value-based control.

## Photos
- local_image_path: resources/images/bench-council-ai100/photos/1988-td-update_richard-sutton.jpg
  title: Richard Sutton portrait
  source_name: Richard Sutton homepage
  source_page_url: http://incompleteideas.net/
  original_image_url: http://incompleteideas.net/sutton-head12.jpg
  copyright_or_license: Personal website image; reuse rights not stated.
- local_image_path: resources/images/bench-council-ai100/explainers/1988-td-update_value-timeline.svg
  title: Value timeline update
  source_name: Machine Learning
  source_page_url: https://doi.org/10.1007/BF00115009
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.
- local_image_path: resources/images/bench-council-ai100/explainers/1988-td-update_error-meter.svg
  title: TD error meter
  source_name: Machine Learning
  source_page_url: https://doi.org/10.1007/BF00115009
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.

## Related Achievements
- Q Learning
- Actor-Critic
- Deep Q Network

## Museum Metadata
{
  "year": "1988",
  "type": "Reinforcement Learning",
  "people": ["Richard Sutton"],
  "keywords": ["reinforcement-learning","value"]
}

## References
- Learning to Predict by the Methods of Temporal Differences. https://doi.org/10.1007/BF00115009
- Richard Sutton homepage. http://incompleteideas.net/
- ACM 2024 Turing Award announcement. https://awards.acm.org/about/2024-turing
