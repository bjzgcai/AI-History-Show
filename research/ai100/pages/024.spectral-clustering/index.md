# Spectral Clustering

## Full Name
Spectral Clustering

## Year / Period
2000

## Type
Clustering

## One-Sentence Summary
Spectral clustering is an AI100 achievement in graph-based clustering and segmentation.

## Hero Description
Spectral clustering reframed grouping as a graph problem. Points become nodes, similarities become weighted edges, and eigenvectors of graph matrices reveal low-dimensional structure where difficult cuts become easier to separate.

## People & Place
- Jianbo Shi: Co-author of normalized cuts
- Jitendra Malik, Andrew Ng, Yair Weiss: Key contributors to spectral clustering formulations

Key place: University of California, Berkeley

## Historical Background
Image segmentation and data clustering needed methods that could separate non-convex groups without assuming spherical geometry.

## Canonical Source
Normalized Cuts and Image Segmentation. https://doi.org/10.1109/34.868688

## Core Idea
The method builds an affinity graph, computes spectral embeddings from graph Laplacian eigenvectors, and clusters or cuts in that embedded space.

## Key Concepts
- Affinity Graph: Edges encode similarity between data points.
- Graph Laplacian: A matrix representation exposes connectivity structure.
- Spectral Embedding: Eigenvectors place points in a space where clusters separate.

## Impact
Spectral methods shaped image segmentation, manifold learning, graph clustering, and modern graph-based data analysis.

## Photos
- local_image_path: resources/images/bench-council-ai100/explainers/2000-spectral-clustering_graph-cut.svg
  title: Normalized graph cut
  source_name: Normalized Cuts and Image Segmentation
  source_page_url: https://doi.org/10.1109/34.868688
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.
- local_image_path: resources/images/bench-council-ai100/explainers/2000-spectral-clustering_eigen-map.svg
  title: Eigenvector embedding
  source_name: Normalized Cuts and Image Segmentation
  source_page_url: https://doi.org/10.1109/34.868688
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.

## Related Achievements
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

## References
- Normalized Cuts and Image Segmentation. https://doi.org/10.1109/34.868688
- On Spectral Clustering: Analysis and an algorithm. https://proceedings.neurips.cc/paper/2001/hash/801272ee79cfde7fa5960571fee36b9b-Abstract.html
- scikit-learn spectral clustering documentation. https://scikit-learn.org/stable/modules/clustering.html#spectral-clustering
