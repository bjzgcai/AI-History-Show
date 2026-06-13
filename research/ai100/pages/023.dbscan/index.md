# DBSCAN

## Full Name
DBSCAN

## Year / Period
1996

## Type
Clustering

## One-Sentence Summary
DBSCAN is an AI100 achievement in density-based clustering.

## Hero Description
DBSCAN changed clustering by asking where data are dense rather than how many clusters should be declared in advance. It grows clusters from core points, connects density-reachable neighborhoods, and labels sparse points as noise, making it useful for irregular spatial patterns.

## People & Place
- Martin Ester: Co-author of DBSCAN
- Hans-Peter Kriegel, Jorg Sander, Xiaowei Xu: DBSCAN research team

Key place: University of Munich

## Historical Background
Many clustering methods preferred round clusters and required the number of clusters before analysis.

## Canonical Source
A density-based algorithm for discovering clusters in large spatial databases with noise. https://dl.acm.org/doi/10.5555/3001460.3001507

## Core Idea
A point with enough neighbors within epsilon is a core point; clusters expand through chains of density reachability.

## Key Concepts
- Core Point: A point with enough neighbors in an epsilon radius.
- Density Reachability: Clusters grow by connecting dense neighborhoods.
- Noise: Sparse points can remain outside all clusters.

## Impact
DBSCAN became a standard method for spatial data, anomaly handling, and clustering with arbitrary shapes.

## Photos
- local_image_path: resources/images/bench-council-ai100/explainers/1996-dbscan_density-reachability.svg
  title: Density reachability
  source_name: A density-based algorithm for discovering clusters
  source_page_url: https://dl.acm.org/doi/10.5555/3001460.3001507
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.
- local_image_path: resources/images/bench-council-ai100/explainers/1996-dbscan_noise-core-border.svg
  title: Core, border, noise
  source_name: A density-based algorithm for discovering clusters
  source_page_url: https://dl.acm.org/doi/10.5555/3001460.3001507
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.

## Related Achievements
- K-means
- Spectral clustering
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

## References
- A density-based algorithm for discovering clusters. https://dl.acm.org/doi/10.5555/3001460.3001507
- DBSCAN Revisited, Revisited. https://doi.org/10.1145/3068335
- scikit-learn DBSCAN documentation. https://scikit-learn.org/stable/modules/clustering.html#dbscan
