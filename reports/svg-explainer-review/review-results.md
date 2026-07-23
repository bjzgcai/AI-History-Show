# SVG Explainer Review Results

- Reviewed SVGs used by enabled events: 155
- Candidate revisions: 26
- Revisions promoted to current assets: 26
- Pre-replacement snapshots retained: 26
- Event-level primary-source grounding: 140/155
- Secondary/reference-only source-tier caveats: 15

## Review Method

- Extracted each selected SVG through enabled storyline variants and asset IDs.
- Resolved each asset source ID against the event source bundle.
- Compared embedded SVG labels with event descriptions, methods, artifacts and source titles.
- Rendered every SVG in headless Chrome and checked transformed text bounds, viewBox clipping and partial text/shape collisions.
- Preserved every pre-replacement original as a snapshot and kept each revision as a separate candidate artifact.

## Source-tier Caveats

The following images can be extracted from an event and have resolved sources, but the selected event bundle does not currently classify any linked source as `primary`. Their visual meaning was reviewed for consistency, but source strengthening should remain a separate content task:

- `resources/images/bench-council-ai100/explainers/1951-snarc_maze-reinforcement.svg` (ai100-1951-snarc)
- `resources/images/bench-council-ai100/explainers/1973-prolog_query-tree.svg` (1973-prolog)
- `resources/images/bench-council-ai100/explainers/1973-prolog_unification-trace.svg` (1973-prolog)
- `resources/images/bench-council-ai100/explainers/2000s-alphacat_xiangqi-search.svg` (2000s-alphacat)
- `resources/images/humanistic-cycle/explainers/1920-rur-robots_labor-revolt.svg` (1920-rur-robots)
- `resources/images/humanistic-cycle/explainers/1942-asimov-runaround_three-laws.svg` (1942-asimov-runaround)
- `resources/images/humanistic-cycle/explainers/1950-wiener-human-use_feedback-warning.svg` (1950-wiener-human-use)
- `resources/images/humanistic-cycle/explainers/1965-simon-ai-prediction_hype-curve.svg` (1965-simon-ai-prediction)
- `resources/images/humanistic-cycle/explainers/1968-hal-9000_conflict.svg` (1968-hal-9000)
- `resources/images/humanistic-cycle/explainers/1973-lighthill-report_winter-filter.svg` (1973-lighthill-report)
- `resources/images/humanistic-cycle/explainers/1978-xiaolingtong_future-city.svg` (1978-xiaolingtong)
- `resources/images/humanistic-cycle/explainers/1984-neuromancer_ai-containment.svg` (1984-neuromancer)
- `resources/images/humanistic-cycle/explainers/1987-lisp-machine-collapse_market-shift.svg` (1987-lisp-machine-collapse)
- `resources/images/humanistic-cycle/explainers/2014-ai-existential-warnings_public-risk.svg` (2014-ai-existential-warnings)
- `resources/images/humanistic-cycle/explainers/2015-openai-founding_broad-benefit.svg` (2015-openai-founding)

## Per-image Results

- **promoted** `resources/images/bench-council-ai100/explainers/1943-mcculloch-pitts-neuron_threshold-logic.svg` (ai100-1943-mcculloch-pitts-neuron; primary source linked)
  Issue: Footer sentence extends beyond the 720-unit viewBox.
  Proposed: Wrap the explanation into two centered lines and reduce its font size.
- **pass** `resources/images/bench-council-ai100/explainers/1951-snarc_maze-reinforcement.svg` (ai100-1951-snarc; secondary/reference source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1951-strachey-draughts_board-search.svg` (1951-strachey-draughts; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1951-strachey-draughts_program-flow.svg` (1951-strachey-draughts; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1956-logic-theorist_proof-search.svg` (1956-logic-theorist; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1957-kmeans_centroid-loop.svg` (1957-kmeans; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1957-kmeans_cluster-update.svg` (1957-kmeans; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **promoted** `resources/images/bench-council-ai100/explainers/1958-lisp_eval-flow.svg` (1958-lisp; primary source linked)
  Issue: The input expression is too wide for its panel. The footer sentence exceeds the viewBox.
  Proposed: Reduce the code label size. Wrap the footer into two lines.
- **pass** `resources/images/bench-council-ai100/explainers/1958-rosenblatt-perceptron_sensor-grid.svg` (1957-perceptron; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1958-rosenblatt-perceptron_threshold.svg` (1957-perceptron; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1958-wangs-algorithm_pattern-proof.svg` (1958-wangs-algorithm; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1959-pandemonium_feature-votes.svg` (1959-pandemonium; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1959-pandemonium_layered-recognition.svg` (1959-pandemonium; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **promoted** `resources/images/bench-council-ai100/explainers/1960-davis-putnam-dpll_sat-search.svg` (1960-davis-putnam-dpll; primary source linked)
  Issue: The footer text exceeds its callout box.
  Proposed: Widen the callout and reduce the footer font slightly.
- **pass** `resources/images/bench-council-ai100/explainers/1965-dendral_mass-spectrum.svg` (1965-dendral; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1965-dendral_rule-filter.svg` (1965-dendral; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **promoted** `resources/images/bench-council-ai100/explainers/1965-resolution-method_clause-refutation.svg` (1965-resolution-method; primary source linked)
  Issue: The original diagram jumps from A or C to the empty clause without showing contradictory premises.
  Proposed: Replace it with an explicit two-step resolution refutation.
- **pass** `resources/images/bench-council-ai100/explainers/1965-resolution-method_unification-map.svg` (1965-resolution-method; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1966-eliza_doctor-script.svg` (1966-eliza; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1966-eliza_terminal-dialog.svg` (1966-eliza; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1967-back-propagation_error-flow.svg` (ai100-1967-back-propagation; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1967-knn_neighbor-vote.svg` (ai100-1967-knn; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1969-relu_activation.svg` (ai100-1969-relu; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1970-ridge_shrinkage.svg` (ai100-1970-ridge; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1970-shrdlu_blocks-world.svg` (1970-shrdlu; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1970-shrdlu_parser-plan.svg` (1970-shrdlu; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **promoted** `resources/images/bench-council-ai100/explainers/1971-complexity-theory_reduction-map.svg` (1971-complexity-theory; primary source linked)
  Issue: General theorem proving is not necessarily an NP decision problem. The footer overflows its box.
  Proposed: Use concrete NP decision problems and state the Cook-Levin relationship precisely.
- **pass** `resources/images/bench-council-ai100/explainers/1971-vc-theory_generalization.svg` (1971-vc-theory; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **promoted** `resources/images/bench-council-ai100/explainers/1973-prolog_query-tree.svg` (1973-prolog; secondary/reference source linked)
  Issue: The recursive rule text exceeds its node.
  Proposed: Split the recursive rule over two lines and increase the node height.
- **pass** `resources/images/bench-council-ai100/explainers/1973-prolog_unification-trace.svg` (1973-prolog; secondary/reference source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1974-frame_inheritance.svg` (1974-frame; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **promoted** `resources/images/bench-council-ai100/explainers/1974-frame_slot-card.svg` (1974-frame; primary source linked)
  Issue: The heading collides with the card edge. The restaurant-script example blurs frames with later script terminology.
  Proposed: Use a generic frame inheritance example with explicit defaults and overrides.
- **pass** `resources/images/bench-council-ai100/explainers/1975-genetic-algorithm_chromosome-crossover.svg` (1975-genetic-algorithm; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1975-genetic-algorithm_population-cycle.svg` (1975-genetic-algorithm; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1980-neocognitron_hierarchy.svg` (ai100-1980-neocognitron; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1980-xcon-r1_order-flow.svg` (1980-xcon-r1; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1980-xcon-r1_rule-configurator.svg` (1980-xcon-r1; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1982-hopfield-network_energy-basin.svg` (1982-hopfield-network; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1982-hopfield-network_memory-grid.svg` (1982-hopfield-network; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1982-som_topology-map.svg` (ai100-1982-som; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1983-actor-critic_two-paths.svg` (ai100-1983-actor-critic; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1983-simulated-annealing_energy-landscape.svg` (1983-simulated-annealing; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1984-cart_pruning-curve.svg` (1984-cart; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1984-cart_split-regions.svg` (1984-cart; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1984-cyc_common-sense-rule.svg` (1984-cyc; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1984-cyc_microtheories.svg` (1984-cyc; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1985-bayesian-network_dag.svg` (1985-bayesian-network; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1985-bayesian-network_message-pass.svg` (1985-bayesian-network; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **promoted** `resources/images/bench-council-ai100/explainers/1988-td-update_error-meter.svg` (1988-td-update; primary source linked)
  Issue: The TD-error label touches the meter circle.
  Proposed: Move the label lower and center it under the meter.
- **pass** `resources/images/bench-council-ai100/explainers/1988-td-update_value-timeline.svg` (1988-td-update; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **promoted** `resources/images/bench-council-ai100/explainers/1989-lenet_zip-code-cnn.svg` (1989-cnn; primary source linked)
  Issue: The footer sentence extends beyond the viewBox.
  Proposed: Wrap and center the footer.
- **pass** `resources/images/bench-council-ai100/explainers/1989-q-learning_bellman-update.svg` (ai100-1989-q-learning; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1990-otter_clause-index.svg` (1990-otter; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **promoted** `resources/images/bench-council-ai100/explainers/1990-otter_given-clause.svg` (1990-otter; primary source linked)
  Issue: The new-consequences label exceeds its node.
  Proposed: Reduce that label to fit the fixed card width.
- **pass** `resources/images/bench-council-ai100/explainers/1990-otter_input-clauses.svg` (1990-otter; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1990-otter_proof-trace.svg` (1990-otter; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1992-svm_kernel-lift.svg` (1992-svm; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1992-svm_max-margin.svg` (1992-svm; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1994-chinook_endgame-database.svg` (1994-chinook; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1994-chinook_perfect-play.svg` (1994-chinook; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1996-dbscan_density-reachability.svg` (1996-dbscan; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1996-dbscan_noise-core-border.svg` (1996-dbscan; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1996-lasso_coefficient-path.svg` (1996-lasso; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **promoted** `resources/images/bench-council-ai100/explainers/1996-lasso_l1-constraint.svg` (1996-lasso; primary source linked)
  Issue: The rotated loss contour reaches into the subtitle area.
  Proposed: Move the geometry down while preserving the L1 corner contact.
- **pass** `resources/images/bench-council-ai100/explainers/1997-deep-blue_chip-board.svg` (1997-deep-blue; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1997-deep-blue_search-tree.svg` (1997-deep-blue; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1997-kernel-pca_eigenmap.svg` (ai100-1997-kernel-pca; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1997-logistello_pattern-eval.svg` (1997-logistello; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **promoted** `resources/images/bench-council-ai100/explainers/1997-lstm_gated-memory.svg` (1997-lstm; primary source linked)
  Issue: The diagram assigns a forget gate to the original 1997 LSTM architecture.
  Proposed: Show input gate, output gate and persistent cell state; explicitly note the later forget-gate addition.
- **promoted** `resources/images/bench-council-ai100/explainers/1999-nmf_parts-factorization.svg` (ai100-1999-nmf; primary source linked)
  Issue: The factorization omits a clearly identified basis matrix and can read as icons times weights.
  Proposed: Show the standard V approximately equals W times H relationship with nonnegative basis and coefficient matrices.
- **pass** `resources/images/bench-council-ai100/explainers/1999-sift_descriptor.svg` (1999-sift; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/1999-sift_scale-space.svg` (1999-sift; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2000-isomap_geodesic-map.svg` (ai100-2000-isomap; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2000-lle_neighbor-reconstruction.svg` (ai100-2000-lle; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **promoted** `resources/images/bench-council-ai100/explainers/2000-neural-language-model_context-prediction.svg` (ai100-2000-neural-language-model; primary source linked)
  Issue: The embeddings label crowds its panel. The footer exceeds the viewBox.
  Proposed: Reduce the panel label size and wrap the footer.
- **pass** `resources/images/bench-council-ai100/explainers/2000-spectral-clustering_eigen-map.svg` (2000-spectral-clustering; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2000-spectral-clustering_graph-cut.svg` (2000-spectral-clustering; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2000s-alphacat_xiangqi-search.svg` (2000s-alphacat; secondary/reference source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2003-lda_plate-model.svg` (2003-lda; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2003-lda_topic-simplex.svg` (2003-lda; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2005-gnn_message-passing.svg` (ai100-2005-gnn; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2005-hog_descriptor-grid.svg` (ai100-2005-hog; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2006-dbn_stacked-rbms.svg` (2006-dbn; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2006-dbn_wake-finetune.svg` (2006-dbn; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2006-surf_interest-points.svg` (ai100-2006-surf; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2008-tsne_cluster-map.svg` (2008-tsne; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2008-tsne_neighbor-probabilities.svg` (2008-tsne; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2009-imagenet_benchmark.svg` (2009-imagenet; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2009-imagenet_hierarchy.svg` (2009-imagenet; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2011-ibm-watson_evidence-ranking.svg` (2011-ibm-watson; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2013-dqn_q-control.svg` (2013-dqn; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **promoted** `resources/images/bench-council-ai100/explainers/2013-dqn_replay-buffer.svg` (2013-dqn; primary source linked)
  Issue: The minibatch label is not centered and touches the node boundary.
  Proposed: Center the label and reduce its size slightly.
- **pass** `resources/images/bench-council-ai100/explainers/2013-vae_latent-sampling.svg` (ai100-2013-variational-autoencoder; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2013-word2vec_skipgram-window.svg` (2013-word2vec; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2013-word2vec_vector-analogy.svg` (2013-word2vec; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2014-adam_loss-trajectory.svg` (2014-adam; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2014-adam_moment-traces.svg` (2014-adam; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2014-attention_alignment.svg` (2014-attention; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **promoted** `resources/images/bench-council-ai100/explainers/2014-conditional-gan_conditioned-generator.svg` (ai100-2014-conditional-gan; primary source linked)
  Issue: The conditioned-sample label exceeds its result card.
  Proposed: Reduce the result label size.
- **pass** `resources/images/bench-council-ai100/explainers/2014-dropout_ensemble-average.svg` (2014-dropout; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2014-dropout_random-mask.svg` (2014-dropout; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2014-gan_adversarial-loop.svg` (2014-gan; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **promoted** `resources/images/bench-council-ai100/explainers/2014-glove_cooccurrence.svg` (ai100-2014-glove; primary source linked)
  Issue: Two mechanism labels exceed their cards. Weighted regression is less precise than the paper objective.
  Proposed: Use smaller labels and name the weighted least-squares objective.
- **pass** `resources/images/bench-council-ai100/explainers/2014-ms-coco_context-dataset.svg` (ai100-2014-ms-coco; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **promoted** `resources/images/bench-council-ai100/explainers/2014-vgg_depth-configurations.svg` (2014-vgg; primary source linked)
  Issue: Bars overlap the subtitle. Five unlabeled bars do not map accurately to canonical VGG configurations.
  Proposed: Show VGG-11/13/16/19 with proportional weight-layer counts and labels.
- **pass** `resources/images/bench-council-ai100/explainers/2014-vgg_receptive-field.svg` (2014-vgg; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2015-batch-normalization_activation-scale.svg` (ai100-2015-batch-normalization; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **promoted** `resources/images/bench-council-ai100/explainers/2015-dcgan_conv-generator.svg` (ai100-2015-dcgan; primary source linked)
  Issue: The mechanism label exceeds its card. Deconvolution is ambiguous terminology.
  Proposed: Use a two-line transposed-convolution label.
- **pass** `resources/images/bench-council-ai100/explainers/2015-ddpg_actor-critic.svg` (ai100-2015-ddpg; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2015-deep-compression_prune-quantize-code.svg` (ai100-2015-deep-compression; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2015-diffusion_forward-reverse.svg` (ai100-2015-diffusion-model; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2015-faster-r-cnn_detection-output.svg` (2015-faster-r-cnn; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2015-faster-r-cnn_rpn-pipeline.svg` (2015-faster-r-cnn; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2015-googlenet-inception_bottleneck.svg` (2015-googlenet-inception; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2015-googlenet-inception_parallel-branches.svg` (2015-googlenet-inception; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2015-knowledge-distillation_teacher-student.svg` (ai100-2015-knowledge-distillation; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **promoted** `resources/images/bench-council-ai100/explainers/2015-u-net_segmentation-mask.svg` (2015-u-net; primary source linked)
  Issue: The image panels overlap the Chinese subtitle.
  Proposed: Move the panels and connector below the title band.
- **pass** `resources/images/bench-council-ai100/explainers/2015-u-net_u-shape-architecture.svg` (2015-u-net; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **promoted** `resources/images/bench-council-ai100/explainers/2016-alphago_policy-value-search.svg` (2016-alphago; primary source linked)
  Issue: Long labels overflow the network cards and footer. A 9x9 schematic labels move 37, which can be mistaken for the historical 19x19 game position.
  Proposed: Use a schematic 19x19 board, remove the historical move claim, and shorten card labels.
- **promoted** `resources/images/bench-council-ai100/explainers/2016-gcn_spectral-convolution.svg` (ai100-2016-gcn; primary source linked)
  Issue: The normalized-neighbors label exceeds its mechanism card.
  Proposed: Reduce the mechanism label size.
- **promoted** `resources/images/bench-council-ai100/explainers/2016-nas_controller-search.svg` (ai100-2016-nas; primary source linked)
  Issue: The sampled-architecture label exceeds its card.
  Proposed: Reduce the mechanism label size.
- **pass** `resources/images/bench-council-ai100/explainers/2016-yolo_grid-detector.svg` (2016-yolo; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2016-yolo_single-pass.svg` (2016-yolo; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2017-alphazero_self-play-loop.svg` (2017-alphazero; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2017-cyclegan_cycle-consistency.svg` (ai100-2017-cyclegan; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2017-gat_attention-neighbors.svg` (ai100-2017-gat; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2017-libratus_cfr-solving.svg` (2017-libratus; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2017-pix2pix_paired-translation.svg` (ai100-2017-pix2pix; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **promoted** `resources/images/bench-council-ai100/explainers/2017-transformer_self-attention.svg` (2017-transformer; primary source linked)
  Issue: The formula omits scaling by square root of key dimension and the multiplication by values.
  Proposed: Replace it with the complete scaled dot-product attention expression.
- **promoted** `resources/images/bench-council-ai100/explainers/2017-wasserstein-gan_critic-distance.svg` (ai100-2017-wasserstein-gan; primary source linked)
  Issue: The generated-distribution label overflows. Critic distance can imply that the critic directly is a distance metric.
  Proposed: Wrap the output label and describe the mechanism as a critic score gap estimating Wasserstein distance.
- **pass** `resources/images/bench-council-ai100/explainers/2018-bert_masked-lm.svg` (2018-bert; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2018-gpt_next-token.svg` (2018-gpt; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2019-muzero_learned-model.svg` (2019-muzero; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2019-pluribus_blueprint-search.svg` (2019-pluribus; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2019-stylegan_style-modulation.svg` (ai100-2019-stylegan; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2019-suphx_mahjong-policy.svg` (2019-suphx; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2020-alphafold2_structure-pipeline.svg` (2020-alphafold; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **promoted** `resources/images/bench-council-ai100/explainers/2020-vit_patch-tokens.svg` (ai100-2020-vit; primary source linked)
  Issue: The footer sentence exceeds the viewBox.
  Proposed: Wrap and center the footer.
- **pass** `resources/images/bench-council-ai100/explainers/2021-clip_contrastive-pairs.svg` (ai100-2021-clip; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2021-dalle_text-to-image.svg` (ai100-2021-dalle; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2021-swin-transformer_shifted-windows.svg` (ai100-2021-swin-transformer; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2022-stable-diffusion_latent-denoise.svg` (ai100-2022-stable-diffusion; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/bench-council-ai100/explainers/2023-segment-anything_prompt-mask.svg` (ai100-2023-segment-anything; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/humanistic-cycle/explainers/1920-rur-robots_labor-revolt.svg` (1920-rur-robots; secondary/reference source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/humanistic-cycle/explainers/1942-asimov-runaround_three-laws.svg` (1942-asimov-runaround; secondary/reference source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/humanistic-cycle/explainers/1950-wiener-human-use_feedback-warning.svg` (1950-wiener-human-use; secondary/reference source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/humanistic-cycle/explainers/1965-simon-ai-prediction_hype-curve.svg` (1965-simon-ai-prediction; secondary/reference source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/humanistic-cycle/explainers/1968-hal-9000_conflict.svg` (1968-hal-9000; secondary/reference source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/humanistic-cycle/explainers/1973-lighthill-report_winter-filter.svg` (1973-lighthill-report; secondary/reference source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/humanistic-cycle/explainers/1978-xiaolingtong_future-city.svg` (1978-xiaolingtong; secondary/reference source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/humanistic-cycle/explainers/1984-neuromancer_ai-containment.svg` (1984-neuromancer; secondary/reference source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/humanistic-cycle/explainers/1987-lisp-machine-collapse_market-shift.svg` (1987-lisp-machine-collapse; secondary/reference source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/humanistic-cycle/explainers/2014-ai-existential-warnings_public-risk.svg` (2014-ai-existential-warnings; secondary/reference source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/humanistic-cycle/explainers/2015-openai-founding_broad-benefit.svg` (2015-openai-founding; secondary/reference source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
- **pass** `resources/images/humanistic-cycle/explainers/2023-ai-risk-statement_global-priority.svg` (2023-ai-risk-statement; primary source linked) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.
