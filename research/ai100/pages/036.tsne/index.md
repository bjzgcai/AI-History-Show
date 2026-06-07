# t-SNE

## Full Name
Visualizing Data using t-SNE

## Year / Period
2008

## Type
Machine Learning

## One-Sentence Summary
t-SNE is an AI100 achievement in Dimensionality reduction.

## Hero Description
t-SNE became one of the most recognizable tools for visualizing high-dimensional data. It converts pairwise neighborhood relationships into probabilities and then lays points out in a low-dimensional map with a heavy-tailed distribution. The result often reveals local clusters that are hard to see in raw feature space.

## People & Place
- Laurens van der Maaten: Co-author of t-SNE

Key place: Tilburg University / University of Toronto

## Historical Background
Researchers needed intuitive ways to inspect embeddings, digits, gene expression, and other high-dimensional data.

## Canonical Source
Visualizing Data using t-SNE. https://jmlr.org/papers/v9/vandermaaten08a.html

## Core Idea
t-SNE preserves local neighbor probabilities while using a t distribution to reduce crowding in the 2D map.

## Key Concepts
- Perplexity: A parameter that roughly controls neighborhood size.
- Local Neighborhood: The method emphasizes nearby points more than global distances.
- Crowding Problem: Heavy tails help separate groups in the low-dimensional map.

## Impact
It became a standard exploratory visualization, while also teaching users to treat cluster maps carefully.

## Photos
- local_image_path: resources/images/bench-council-ai100/photos/2008-tsne_laurens-van-der-maaten.png
  title: Laurens van der Maaten portrait
  source_name: Laurens van der Maaten homepage
  source_page_url: https://lvdmaaten.github.io/
  original_image_url: https://lvdmaaten.github.io/images/laurens.png
  copyright_or_license: Personal website image; reuse rights not stated.
- local_image_path: resources/images/bench-council-ai100/explainers/2008-tsne_neighbor-probabilities.svg
  title: Neighbor probability matching
  source_name: Journal of Machine Learning Research
  source_page_url: https://jmlr.org/papers/v9/vandermaaten08a.html
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.
- local_image_path: resources/images/bench-council-ai100/explainers/2008-tsne_cluster-map.svg
  title: 2D cluster map
  source_name: Journal of Machine Learning Research
  source_page_url: https://jmlr.org/papers/v9/vandermaaten08a.html
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.

## Related Achievements
- Isomap
- Locally linear embedding
- Embedding visualization

## Museum Metadata
{
  "year": "2008",
  "type": "Machine Learning",
  "people": ["Laurens van der Maaten"],
  "keywords": ["visualization","dimensionality-reduction"]
}

## References
- Visualizing Data using t-SNE. https://jmlr.org/papers/v9/vandermaaten08a.html
- Laurens van der Maaten homepage. https://lvdmaaten.github.io/
- How to Use t-SNE Effectively, Distill. https://distill.pub/2016/misread-tsne/
