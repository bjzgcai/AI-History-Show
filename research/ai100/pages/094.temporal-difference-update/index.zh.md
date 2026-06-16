# 时序差分更新

## 完整名称
用时序差分学习预测

## 年份 / 时期
1988

## 类型
Reinforcement Learning

## 一句话摘要
时序差分更新 是 强化学习 领域的 AI100 成就。

## Hero Description
时序差分学习为强化学习提供了一种从经验中学习预测的紧凑方法。TD 方法不必等到最终结果，而是用下一步奖励和下一步预测来更新价值估计。这种自举思想支撑了 TD-Gammon、Q-learning 和 actor-critic 等后续算法。

## 人物与地点
- Richard Sutton: 时序差分学习提出者

关键地点：GTE 实验室 / 麻省大学学术谱系

## 历史背景
从延迟奖励中学习需要一种在整个回合结束前分配信用的方法。

## 经典来源
用时序差分学习预测。https://doi.org/10.1007/BF00115009

## 核心思想
TD 比较当前预测与“奖励加下一步预测”，再把当前价值向该目标推进。

## 关键概念
- TD 误差: 当前预测与一步自举目标之间的差距。
- 自举: 用另一个预测来更新一个预测。
- 价值函数: 估计从某状态出发的预期未来奖励。

## 影响
TD 学习是现代强化学习和值函数控制的基石。

## 图片
- local_image_path: resources/images/bench-council-ai100/photos/1988-td-update_richard-sutton.jpg
  title: Richard Sutton 肖像
  source_name: Richard Sutton homepage
  source_page_url: http://incompleteideas.net/
  original_image_url: http://incompleteideas.net/sutton-head12.jpg
  copyright_or_license: Personal website image; reuse rights not stated.
- local_image_path: resources/images/bench-council-ai100/explainers/1988-td-update_value-timeline.svg
  title: 价值时间线更新
  source_name: Machine Learning
  source_page_url: https://doi.org/10.1007/BF00115009
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.
- local_image_path: resources/images/bench-council-ai100/explainers/1988-td-update_error-meter.svg
  title: TD 误差仪表
  source_name: Machine Learning
  source_page_url: https://doi.org/10.1007/BF00115009
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.

## 相关成就
- Q Learning
- Actor-Critic
- 深度 Q 网络

## Museum Metadata
{
  "year": "1988",
  "type": "Reinforcement Learning",
  "people": ["Richard Sutton"],
  "keywords": ["reinforcement-learning","value"]
}

## 参考资料
- Learning to Predict by the Methods of Temporal Differences. https://doi.org/10.1007/BF00115009
- Richard Sutton homepage. http://incompleteideas.net/
- ACM 2024 Turing Award announcement. https://awards.acm.org/about/2024-turing
