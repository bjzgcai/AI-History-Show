# K-means 聚类

## 完整名称
K-means 聚类

## 年份 / 时期
1957 / 1982

## 类型
聚类

## 一句话摘要
K-means 是聚类与向量量化领域的 AI100 成就。

## Hero Description
K-means 让无监督分组简单到成为默认工具。Lloyd 方法在“把点分配给最近中心”和“把中心移动到所属点均值”之间交替，把聚类变成直观的优化循环。

## 人物与地点
- Stuart Lloyd: Lloyd 式 k-means 量化方法作者

关键地点：贝尔实验室

## 历史背景
信号量化和模式分析都需要为大量观测找到紧凑代表。

## 经典来源
Least squares quantization in PCM。https://doi.org/10.1109/TIT.1982.1056489

## 核心思想
算法反复把每个点分配给最近质心，再把每个质心更新为该簇的均值。

## 关键概念
- 质心: 每个簇由其均值点表示。
- 分配步骤: 样本加入最近中心。
- 更新步骤: 中心移动到所属样本均值。

## 影响
K-means 仍是聚类、压缩、初始化、向量量化和探索性数据分析的基线方法。

## 图片
- local_image_path: resources/images/bench-council-ai100/explainers/1957-kmeans_centroid-loop.svg
  title: 质心更新循环
  source_name: Least squares quantization in PCM
  source_page_url: https://doi.org/10.1109/TIT.1982.1056489
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.
- local_image_path: resources/images/bench-council-ai100/explainers/1957-kmeans_cluster-update.svg
  title: 簇重新分配
  source_name: Least squares quantization in PCM
  source_page_url: https://doi.org/10.1109/TIT.1982.1056489
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.

## 相关成就
- DBSCAN
- 谱聚类
- Lasso

## Museum Metadata
{
  "year": "1957 / 1982",
  "type": "Clustering",
  "people": [
    "Stuart Lloyd"
  ],
  "keywords": [
    "clustering",
    "unsupervised-learning"
  ]
}

## 参考资料
- Least squares quantization in PCM. https://doi.org/10.1109/TIT.1982.1056489
- Bell Labs k-means 历史资料. https://www.nokia.com/bell-labs/about/dennis-m-ritchie/k-means-clustering/
- scikit-learn KMeans 文档. https://scikit-learn.org/stable/modules/clustering.html#k-means
