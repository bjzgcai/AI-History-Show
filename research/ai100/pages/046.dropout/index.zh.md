# Dropout

## Full Name
Dropout: A Simple Way to Prevent Neural Networks from Overfitting

## Year / Period
2014

## Type
神经网络

## One-Sentence Summary
Dropout 是 AI100 中的重要成就，连接了 神经网络 与后续 AI 系统的发展。

## Hero Description
Dropout 通过在训练中随机移除神经元，让大型神经网络更不容易过拟合。每个小批量近似训练一个变薄的网络，测试时预测则近似集成。这个思想后来成为深度学习工具包里的标准正则化方法。

## People & Place
- Nitish Srivastava: JMLR Dropout 论文第一作者
- Geoffrey Hinton: 共同作者，深度学习先驱

Key place: 多伦多大学

## Historical Background
随着网络变大，记忆训练集成为实际问题。Dropout 提供了不必改变数据集的简单干预方式。

## Canonical Source
Dropout: A Simple Way to Prevent Neural Networks from Overfitting. Nitish Srivastava, Geoffrey Hinton, Alex Krizhevsky, Ilya Sutskever, Ruslan Salakhutdinov, JMLR, 2014. https://jmlr.org/papers/v15/srivastava14a.html

## Core Idea
核心思想是在训练时随机隐藏单元，使隐藏特征不能过度依赖彼此。

## Key Concepts
- 随机掩码: 每次更新只保留采样出的部分单元活跃。
- 共适应: Dropout 阻止特征过度依赖某些固定伙伴同时存在。
- 近似集成: 测试时缩放近似于平均许多变薄网络。

## Impact
尽管新架构常同时使用多种正则化，Dropout 仍是模型 API 和教学材料中非常显眼的默认工具。

## Photos
- local_image_path: resources/images/bench-council-ai100/photos/2014-dropout_nitish-srivastava.jpg
  title: Nitish Srivastava 肖像
  source_name: University of Toronto personal page
  source_page_url: https://www.cs.utoronto.ca/~nitish/
  original_image_url: https://www.cs.utoronto.ca/~nitish/pic.JPG
  copyright_or_license: Personal website photo; rights not stated.
- local_image_path: resources/images/bench-council-ai100/explainers/2014-dropout_random-mask.svg
  title: 随机单元掩码
  source_name: JMLR
  source_page_url: https://jmlr.org/papers/v15/srivastava14a.html
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.
- local_image_path: resources/images/bench-council-ai100/explainers/2014-dropout_ensemble-average.svg
  title: 近似集成
  source_name: JMLR
  source_page_url: https://jmlr.org/papers/v15/srivastava14a.html
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.

## Related Achievements
- AlexNet
- 正则化
- 深度学习

## Museum Metadata
{
  "year": "2014",
  "type": "神经网络",
  "people": ["Nitish Srivastava","Geoffrey Hinton"],
  "keywords": ["regularization","deep-learning"]
}

## References
- 论文: Dropout: A Simple Way to Prevent Neural Networks from Overfitting. https://jmlr.org/papers/v15/srivastava14a.html
- 预印本: Improving neural networks by preventing co-adaptation. https://arxiv.org/abs/1207.0580
- 框架文档: PyTorch torch.nn.Dropout. https://docs.pytorch.org/docs/stable/generated/torch.nn.Dropout.html
