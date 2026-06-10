# Chinook 跳棋程序

## 完整名称
Chinook 跳棋程序

## 年份 / 时期
1989-2007

## 类型
游戏 AI

## 一句话摘要
Chinook 是游戏搜索与已求解游戏领域的 AI100 成就。

## Hero Description
Chinook 把游戏 AI 从竞技对弈推进到数学求解。阿尔伯塔大学团队结合开局库、深层 alpha-beta 搜索、专家评估和庞大残局数据库，最终证明跳棋在完美对弈下结果为和棋。

## 人物与地点
- Jonathan Schaeffer: Chinook 团队负责人

关键地点：阿尔伯塔大学

## 历史背景
跳棋足够复杂，可以挑战搜索算法；同时结构足够明确，适合长期构建残局数据库。

## 经典来源
Checkers Is Solved。https://www.science.org/doi/10.1126/science.1144079

## 核心思想
Chinook 将前向搜索与已求解残局表结合，使程序能把当前选择连接到被证明的终局结果。

## 关键概念
- 开局库: 人类与计算机棋谱知识缩小早期选择。
- 残局数据库: 后期局面被预计算为可证明结果。
- 弱求解: 从初始局面可知游戏理论值。

## 影响
它成为游戏求解研究的里程碑，也衡量了穷举计算与启发式搜索结合后能走多远。

## 图片
- local_image_path: resources/images/bench-council-ai100/explainers/1994-chinook_endgame-database.svg
  title: 残局数据库查询
  source_name: Chinook 项目主页
  source_page_url: https://webdocs.cs.ualberta.ca/~chinook/index.php
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.
- local_image_path: resources/images/bench-council-ai100/explainers/1994-chinook_perfect-play.svg
  title: 完美对弈路径
  source_name: Chinook 项目主页
  source_page_url: https://webdocs.cs.ualberta.ca/~chinook/index.php
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.

## 相关成就
- Deep Blue
- Strachey 跳棋程序
- AlphaGo

## Museum Metadata
{
  "year": "1989-2007",
  "type": "Game AI",
  "people": [
    "Jonathan Schaeffer"
  ],
  "keywords": [
    "game-ai",
    "search"
  ]
}

## 参考资料
- Chinook 项目主页. https://webdocs.cs.ualberta.ca/~chinook/index.php
- Checkers Is Solved. https://www.science.org/doi/10.1126/science.1144079
- Chinook 论文列表. https://webdocs.cs.ualberta.ca/~chinook/publications/
