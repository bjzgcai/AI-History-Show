# 深度置信网络

## 完整名称
深度置信网络快速学习算法

## 年份 / 时期
2006

## 类型
Deep Learning

## 一句话摘要
深度置信网络 是 深度学习 领域的 AI100 成就。

## Hero Description
深度置信网络通过展示深层模型可以逐层训练，帮助复兴深度学习。Hinton 及合作者使用受限玻尔兹曼机进行无监督预训练，再对数字识别等任务微调网络。这项工作在 GPU 驱动的深度学习浪潮前，让深层架构重新显得可训练。

## 人物与地点
- Geoffrey Hinton: 深度置信网络学习共同作者

关键地点：多伦多大学

## 历史背景
深层神经网络用普通监督训练很难优化。逐层预训练提供了一条实用路线。

## 经典来源
深度置信网络快速学习算法。https://doi.org/10.1162/neco.2006.18.7.1527

## 核心思想
每一层学习建模上一层的模式，从而为整个深层网络提供良好初始化。

## 关键概念
- 受限玻尔兹曼机: 用于预训练的双层生成模型。
- 贪心逐层训练: 先一次训练一层，再微调整体模型。
- 微调: 监督训练把预训练堆栈调整到目标任务。

## 影响
DBN 帮助重新打开深度学习研究，并影响了后来的表示学习工作。

## 图片
- local_image_path: resources/images/bench-council-ai100/photos/2006-dbn_geoffrey-hinton.jpg
  title: Geoffrey Hinton 肖像
  source_name: University of Toronto
  source_page_url: https://www.cs.toronto.edu/~hinton/pages/photos.html
  original_image_url: https://www.cs.toronto.edu/~hinton/geoff1.jpg
  copyright_or_license: University personal photo page; reuse rights not stated.
- local_image_path: resources/images/bench-council-ai100/explainers/2006-dbn_stacked-rbms.svg
  title: 堆叠 RBM 预训练
  source_name: Neural Computation
  source_page_url: https://doi.org/10.1162/neco.2006.18.7.1527
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.
- local_image_path: resources/images/bench-council-ai100/explainers/2006-dbn_wake-finetune.svg
  title: 预训练后微调
  source_name: Neural Computation
  source_page_url: https://doi.org/10.1162/neco.2006.18.7.1527
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.

## 相关成就
- 反向传播
- Dropout
- 深度学习

## Museum Metadata
{
  "year": "2006",
  "type": "Deep Learning",
  "people": ["Geoffrey Hinton"],
  "keywords": ["deep-learning","pretraining"]
}

## 参考资料
- A Fast Learning Algorithm for Deep Belief Nets. https://doi.org/10.1162/neco.2006.18.7.1527
- Reducing the Dimensionality of Data with Neural Networks. https://doi.org/10.1126/science.1127647
- Geoffrey Hinton photo page. https://www.cs.toronto.edu/~hinton/pages/photos.html
