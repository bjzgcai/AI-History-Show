# Otter 自动定理证明器

## 完整名称
Otter 自动定理证明器

## 年份 / 时期
1990s

## 类型
自动定理证明

## 一句话摘要
Otter 是自动定理证明领域的 AI100 成就。

## Hero Description
Otter 让高性能一阶定理证明成为 AI 与数理逻辑研究者可实际使用的工具。McCune 的系统结合归结、参数调解、项索引、权重控制和实用的 given-clause 搜索循环，成为探索大规模符号证明空间的主力工具。

## 人物与地点
- William McCune: Otter 创建者

关键地点：阿贡国家实验室

## 历史背景
自动推理系统拥有强大的推理规则，但常常受困于搜索爆炸。Otter 的重点是以工程化方式控制这种搜索。

## 经典来源
OTTER 3.3 Reference Manual。https://arxiv.org/abs/cs/0310056

## 核心思想
证明器反复选择有希望的子句，用推理规则生成后果，并通过索引和化简让搜索保持可控。

## 关键概念
- given-clause 循环: 每轮饱和搜索由被选中的子句驱动。
- 参数调解: 等式推理会在子句内部重写项。
- 项索引: 索引加速寻找可参与推理的子句。

## 影响
Otter 影响了后来的自动推理工具，包括 Prover9，并帮助在代数、逻辑和形式化数学中证明或简化结果。

## 图片
- local_image_path: resources/images/bench-council-ai100/explainers/1990-otter_given-clause.svg
  title: given-clause 证明循环
  source_name: OTTER 3.3 Reference Manual
  source_page_url: https://arxiv.org/abs/cs/0310056
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.
- local_image_path: resources/images/bench-council-ai100/explainers/1990-otter_clause-index.svg
  title: 子句索引地图
  source_name: OTTER 3.3 Reference Manual
  source_page_url: https://arxiv.org/abs/cs/0310056
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.

## 相关成就
- 归结方法
- DPLL
- Prover9

## Museum Metadata
{
  "year": "1990s",
  "type": "Automated Theorem Proving",
  "people": [
    "William McCune"
  ],
  "keywords": [
    "theorem-proving",
    "symbolic-ai"
  ]
}

## 参考资料
- OTTER 3.3 Reference Manual. https://arxiv.org/abs/cs/0310056
- Otter 项目页. https://www.cs.unm.edu/~mccune/otter/
- Prover9 与 Mace4. https://www.cs.unm.edu/~mccune/prover9/
