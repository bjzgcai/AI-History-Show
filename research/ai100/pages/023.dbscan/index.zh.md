# DBSCAN 密度聚类

## 完整名称
DBSCAN 密度聚类

## 年份 / 时期
1996

## 类型
聚类

## 一句话摘要
DBSCAN 是基于密度聚类领域的 AI100 成就。

## Hero Description
DBSCAN 改变聚类方式：它询问数据哪里足够密集，而不是预先指定有多少簇。它从核心点生长簇，连接密度可达邻域，并把稀疏点标为噪声，因此适合不规则空间模式。

## 人物与地点
- Martin Ester: DBSCAN 共同作者
- Hans-Peter Kriegel、Jorg Sander、Xiaowei Xu: DBSCAN 研究团队

关键地点：慕尼黑大学

## 历史背景
许多聚类方法偏好圆形簇，并要求分析前指定簇数量。

## 经典来源
A density-based algorithm for discovering clusters in large spatial databases with noise。https://dl.acm.org/doi/10.5555/3001460.3001507

## 核心思想
如果一个点在 epsilon 范围内有足够邻居，它就是核心点；簇通过密度可达链条扩展。

## 关键概念
- 核心点: epsilon 半径内邻居足够多的点。
- 密度可达: 簇通过连接密集邻域生长。
- 噪声: 稀疏点可以不属于任何簇。

## 影响
DBSCAN 成为处理空间数据、异常点和任意形状簇的标准方法。

## 图片
- local_image_path: resources/images/bench-council-ai100/explainers/1996-dbscan_density-reachability.svg
  title: 密度可达
  source_name: A density-based algorithm for discovering clusters
  source_page_url: https://dl.acm.org/doi/10.5555/3001460.3001507
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.
- local_image_path: resources/images/bench-council-ai100/explainers/1996-dbscan_noise-core-border.svg
  title: 核心、边界与噪声
  source_name: A density-based algorithm for discovering clusters
  source_page_url: https://dl.acm.org/doi/10.5555/3001460.3001507
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.

## 相关成就
- K-means
- 谱聚类
- t-SNE

## Museum Metadata
{
  "year": "1996",
  "type": "Clustering",
  "people": [
    "Martin Ester",
    "Hans-Peter Kriegel, Jorg Sander, Xiaowei Xu"
  ],
  "keywords": [
    "clustering",
    "density"
  ]
}

## 参考资料
- A density-based algorithm for discovering clusters. https://dl.acm.org/doi/10.5555/3001460.3001507
- DBSCAN Revisited, Revisited. https://doi.org/10.1145/3068335
- scikit-learn DBSCAN 文档. https://scikit-learn.org/stable/modules/clustering.html#dbscan
