# 谱聚类

## 完整名称
谱聚类

## 年份 / 时期
2000

## 类型
聚类

## 一句话摘要
谱聚类 是图聚类与分割领域的 AI100 成就。

## Hero Description
谱聚类把分组重新表述为图问题。样本成为节点，相似度成为带权边，图矩阵的特征向量揭示低维结构，使原本困难的切分更容易分离。

## 人物与地点
- Jianbo Shi: Normalized Cuts 共同作者
- Jitendra Malik、Andrew Ng、Yair Weiss: 谱聚类形式化的重要贡献者

关键地点：加州大学伯克利分校

## 历史背景
图像分割与数据聚类需要能分离非凸群组的方法，而不假设簇是球形。

## 经典来源
Normalized Cuts and Image Segmentation。https://doi.org/10.1109/34.868688

## 核心思想
该方法构建亲和图，从图拉普拉斯特征向量计算谱嵌入，再在嵌入空间中聚类或切分。

## 关键概念
- 亲和图: 边编码样本之间的相似度。
- 图拉普拉斯: 矩阵表示揭示连通结构。
- 谱嵌入: 特征向量把样本放入更易分离的空间。

## 影响
谱方法塑造了图像分割、流形学习、图聚类和现代图数据分析。

## 图片
- local_image_path: resources/images/bench-council-ai100/explainers/2000-spectral-clustering_graph-cut.svg
  title: 归一化图切分
  source_name: Normalized Cuts and Image Segmentation
  source_page_url: https://doi.org/10.1109/34.868688
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.
- local_image_path: resources/images/bench-council-ai100/explainers/2000-spectral-clustering_eigen-map.svg
  title: 特征向量嵌入
  source_name: Normalized Cuts and Image Segmentation
  source_page_url: https://doi.org/10.1109/34.868688
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.

## 相关成就
- K-means
- DBSCAN
- t-SNE

## Museum Metadata
{
  "year": "2000",
  "type": "Clustering",
  "people": [
    "Jianbo Shi",
    "Jitendra Malik, Andrew Ng, Yair Weiss"
  ],
  "keywords": [
    "clustering",
    "graphs"
  ]
}

## 参考资料
- Normalized Cuts and Image Segmentation. https://doi.org/10.1109/34.868688
- On Spectral Clustering. https://proceedings.neurips.cc/paper/2001/hash/801272ee79cfde7fa5960571fee36b9b-Abstract.html
- scikit-learn 谱聚类文档. https://scikit-learn.org/stable/modules/clustering.html#spectral-clustering
