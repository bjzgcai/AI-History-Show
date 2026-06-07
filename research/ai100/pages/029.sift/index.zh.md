# SIFT

## 完整名称
SIFT ICCV 论文 PDF

## 年份 / 时期
1999

## 类型
Computer Vision

## 一句话摘要
SIFT 是 计算机视觉特征提取 领域的 AI100 成就。

## Hero Description
SIFT 为计算机视觉提供了一种稳健寻找和描述局部图像特征的方法。它检测在尺度、旋转和光照变化下仍稳定的关键点，并把周围梯度模式编码为描述子。在深度学习占据主导前，SIFT 是目标识别、全景拼接和三维重建的常用工具。

## 人物与地点
- David Lowe: SIFT 发明者

关键地点：不列颠哥伦比亚大学

## 历史背景
视觉系统需要能在视角和尺度变化下匹配同一物体的特征。

## 经典来源
SIFT ICCV 论文 PDF。https://www.cs.ubc.ca/labs/lci/papers/docs1999/lowe-iccv99.pdf

## 核心思想
SIFT 构建尺度空间、寻找显著关键点、分配方向，并保存梯度直方图描述子。

## 关键概念
- 尺度空间: 图像在多个模糊尺度上被检查，以寻找稳定结构。
- 关键点: 可在多张图像间重复匹配的局部点。
- 描述子: 梯度直方图概括邻域外观。

## 影响
SIFT 影响了特征工程、运动恢复结构流程和许多局部描述子基准。

## 图片
- local_image_path: resources/images/bench-council-ai100/photos/1999-sift_david-lowe.jpg
  title: David Lowe 肖像
  source_name: University of British Columbia
  source_page_url: https://www.cs.ubc.ca/people/david-lowe
  original_image_url: https://www.cs.ubc.ca/sites/default/files/styles/profile_page/public/people/lowe.jpg
  copyright_or_license: UBC profile image; reuse rights not stated.
- local_image_path: resources/images/bench-council-ai100/explainers/1999-sift_scale-space.svg
  title: 尺度空间关键点
  source_name: UBC Laboratory for Computational Intelligence
  source_page_url: https://www.cs.ubc.ca/labs/lci/papers/docs1999/lowe-iccv99.pdf
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.
- local_image_path: resources/images/bench-council-ai100/explainers/1999-sift_descriptor.svg
  title: 梯度描述子直方图
  source_name: UBC Laboratory for Computational Intelligence
  source_page_url: https://www.cs.ubc.ca/labs/lci/papers/docs1999/lowe-iccv99.pdf
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.

## 相关成就
- HOG
- SURF
- 计算机视觉

## Museum Metadata
{
  "year": "1999",
  "type": "Computer Vision",
  "people": ["David Lowe"],
  "keywords": ["vision","features"]
}

## 参考资料
- Object Recognition from Local Scale-Invariant Features. https://www.cs.ubc.ca/labs/lci/papers/docs1999/lowe-iccv99.pdf
- Distinctive Image Features from Scale-Invariant Keypoints. https://doi.org/10.1023/B:VISI.0000029664.99615.94
- David Lowe, UBC Computer Science. https://www.cs.ubc.ca/people/david-lowe
