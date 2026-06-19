# SIFT

## Full Name
SIFT ICCV paper PDF

## Year / Period
1999

## Type
Computer Vision

## One-Sentence Summary
SIFT is an AI100 achievement in Computer vision feature extraction.

## Hero Description
SIFT gave computer vision a robust way to find and describe local image features. It detects keypoints that survive changes in scale, rotation, and illumination, then encodes the surrounding gradient pattern as a descriptor. Before deep learning dominance, SIFT became a workhorse for object recognition, panorama stitching, and 3D reconstruction.

## People & Place
- David Lowe: Inventor of SIFT

Key place: University of British Columbia

## Historical Background
Vision systems needed features that matched the same object despite viewpoint and scale changes.

## Canonical Source
SIFT ICCV paper PDF. https://www.cs.ubc.ca/labs/lci/papers/docs1999/lowe-iccv99.pdf

## Core Idea
SIFT builds a scale space, finds distinctive keypoints, assigns orientation, and stores a gradient histogram descriptor.

## Key Concepts
- Scale Space: The image is examined at multiple blur levels to find stable structures.
- Keypoint: A repeatable local point that can be matched across images.
- Descriptor: Gradient histograms summarize the nearby appearance.

## Impact
SIFT influenced feature engineering, structure-from-motion pipelines, and many benchmarks for local descriptors.

## Photos
- local_image_path: resources/images/bench-council-ai100/photos/1999-sift_david-lowe.jpg
  title: David Lowe portrait
  source_name: University of British Columbia
  source_page_url: https://www.cs.ubc.ca/people/david-lowe
  original_image_url: https://www.cs.ubc.ca/sites/default/files/styles/profile_page/public/people/lowe.jpg
  copyright_or_license: UBC profile image; reuse rights not stated.
- local_image_path: resources/images/bench-council-ai100/explainers/1999-sift_scale-space.svg
  title: Scale-space keypoints
  source_name: UBC Laboratory for Computational Intelligence
  source_page_url: https://www.cs.ubc.ca/labs/lci/papers/docs1999/lowe-iccv99.pdf
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.
- local_image_path: resources/images/bench-council-ai100/explainers/1999-sift_descriptor.svg
  title: Gradient descriptor histogram
  source_name: UBC Laboratory for Computational Intelligence
  source_page_url: https://www.cs.ubc.ca/labs/lci/papers/docs1999/lowe-iccv99.pdf
  original_image_url: Local original redraw
  copyright_or_license: Original local SVG redraw; source figures are not copied.

## Related Achievements
- HOG
- SURF
- Computer vision

## Museum Metadata
{
  "year": "1999",
  "type": "Computer Vision",
  "people": ["David Lowe"],
  "keywords": ["vision","features"]
}

## References
- Object Recognition from Local Scale-Invariant Features. https://www.cs.ubc.ca/labs/lci/papers/docs1999/lowe-iccv99.pdf
- Distinctive Image Features from Scale-Invariant Keypoints. https://doi.org/10.1023/B:VISI.0000029664.99615.94
- David Lowe, UBC Computer Science. https://www.cs.ubc.ca/people/david-lowe
