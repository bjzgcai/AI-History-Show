# K-means

## Full Name
K-means

## Year / Period
1957 / 1982

## Type
Clustering

## One-Sentence Summary
K-means is an AI100 achievement in clustering and vector quantization.

## Hero Description
K-means made unsupervised grouping simple enough to become a default tool. Lloyd's method alternates between assigning points to nearest centers and moving centers to the mean of their assigned points, turning clustering into an intuitive optimization loop.

## People & Place
- Stuart Lloyd: Author of Lloyd's k-means-style quantization method

Key place: Bell Labs

## Historical Background
Signal quantization and pattern analysis both needed compact representatives for many observations.

## Canonical Source
Least squares quantization in PCM. https://doi.org/10.1109/TIT.1982.1056489

## Core Idea
The algorithm repeatedly assigns each point to its closest centroid, then updates each centroid to the mean of its cluster.

## Key Concepts
- Centroid: Each cluster is represented by its mean point.
- Assignment Step: Points join the closest center.
- Update Step: Centers move to the average of assigned points.

## Impact
K-means remains a baseline for clustering, compression, initialization, vector quantization, and exploratory data analysis.

## Photos
- local_image_path: resources/images/bench-council-ai100/explainers/1957-kmeans_centroid-loop.svg
  title: Centroid update loop
  source_name: Least squares quantization in PCM
  source_page_url: https://doi.org/10.1109/TIT.1982.1056489
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.
- local_image_path: resources/images/bench-council-ai100/explainers/1957-kmeans_cluster-update.svg
  title: Cluster reassignment
  source_name: Least squares quantization in PCM
  source_page_url: https://doi.org/10.1109/TIT.1982.1056489
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.

## Related Achievements
- DBSCAN
- Spectral clustering
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

## References
- Least squares quantization in PCM. https://doi.org/10.1109/TIT.1982.1056489
- Bell Labs k-means history note. https://www.nokia.com/bell-labs/about/dennis-m-ritchie/k-means-clustering/
- scikit-learn KMeans documentation. https://scikit-learn.org/stable/modules/clustering.html#k-means
