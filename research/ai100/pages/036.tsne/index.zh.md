# t-SNE

## 完整名称
Visualizing Data using t-SNE

## 年份 / 时期
2008

## 类型
Machine Learning

## 一句话摘要
t-SNE 是 降维 领域的 AI100 成就。

## Hero Description
t-SNE 成为最具辨识度的高维数据可视化工具之一。它把成对邻域关系转为概率，再用重尾分布把点布置在低维图上。结果常能展示原始特征空间中难以看见的局部簇结构。

## 人物与地点
- Laurens van der Maaten: t-SNE 共同作者

关键地点：蒂尔堡大学 / 多伦多大学

## 历史背景
研究者需要直观方法检查嵌入、数字、基因表达等高维数据。

## 经典来源
Visualizing Data using t-SNE。https://jmlr.org/papers/v9/vandermaaten08a.html

## 核心思想
t-SNE 保持局部邻域概率，并用 t 分布减少二维图中的拥挤问题。

## 关键概念
- 困惑度: 一个大致控制邻域大小的参数。
- 局部邻域: 该方法更强调邻近点，而非全局距离。
- 拥挤问题: 重尾分布帮助低维图中群组分开。

## 影响
它成为标准探索性可视化工具，同时也提醒用户谨慎解读簇图。

## 图片
- local_image_path: resources/images/bench-council-ai100/photos/2008-tsne_laurens-van-der-maaten.png
  title: Laurens van der Maaten 肖像
  source_name: Laurens van der Maaten homepage
  source_page_url: https://lvdmaaten.github.io/
  original_image_url: https://lvdmaaten.github.io/images/laurens.png
  copyright_or_license: Personal website image; reuse rights not stated.
- local_image_path: resources/images/bench-council-ai100/explainers/2008-tsne_neighbor-probabilities.svg
  title: 邻域概率匹配
  source_name: Journal of Machine Learning Research
  source_page_url: https://jmlr.org/papers/v9/vandermaaten08a.html
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.
- local_image_path: resources/images/bench-council-ai100/explainers/2008-tsne_cluster-map.svg
  title: 二维簇图
  source_name: Journal of Machine Learning Research
  source_page_url: https://jmlr.org/papers/v9/vandermaaten08a.html
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.

## 相关成就
- Isomap
- 局部线性嵌入
- 嵌入可视化

## Museum Metadata
{
  "year": "2008",
  "type": "Machine Learning",
  "people": ["Laurens van der Maaten"],
  "keywords": ["visualization","dimensionality-reduction"]
}

## 参考资料
- Visualizing Data using t-SNE. https://jmlr.org/papers/v9/vandermaaten08a.html
- Laurens van der Maaten homepage. https://lvdmaaten.github.io/
- How to Use t-SNE Effectively, Distill. https://distill.pub/2016/misread-tsne/
