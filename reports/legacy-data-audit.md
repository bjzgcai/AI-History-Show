# Legacy Data Audit

Generated: 2026-07-13T06:44:25.750Z

This report checks the legacy history data files against the archive migration boundary.
It is intentionally read-only and does not regenerate display data.

## Summary

- Catalog categories: 5
- Catalog branches: 1
- Catalog event references: 134
- Unique catalog event references: 128
- Legacy event keys: 128
- Archive event directories: 116
- Legacy quiz event keys: 107
- Archive quiz event keys: 107
- Fusion rules: 12
- Archive preview milestones: 134
- Archive preview errors: 0
- Generated milestone ids: 134
- Duplicate catalog refs: 6
- Catalog refs missing legacy events: 0
- Legacy event keys not referenced by catalog: 0
- Legacy quiz events missing archive quizzes: 12
- Archive quiz events missing legacy quizzes: 12
- Fusion archive coverage problems: 0
- Duplicate archive preview ids: 0
- Generated ids missing archive preview: 0
- Preview ids missing generated target: 0

### Duplicate catalog refs

- `1951-strachey-draughts` x2
- `1988-td-update` x2
- `1994-chinook` x2
- `1997-deep-blue` x2
- `2013-dqn` x2
- `2016-alphago` x2

### Catalog refs missing legacy events

- None

### Legacy event keys not referenced by catalog

- None

### Legacy quiz events missing archive quizzes

- `1958-rosenblatt-perceptron`
- `ai100-1989-lenet`
- `ai100-1997-lstm`
- `ai100-2012-alexnet`
- `ai100-2014-gan`
- `ai100-2014-neural-machine-translation-attention`
- `ai100-2015-resnet`
- `ai100-2017-densenet`
- `ai100-2017-transformer`
- `ai100-2018-bert`
- `ai100-2018-gpt`
- `ai100-2020-alphafold2`

### Archive quiz events missing legacy quizzes

- `1957-perceptron`
- `1989-cnn`
- `1997-lstm`
- `2012-alexnet`
- `2014-attention`
- `2014-gan`
- `2015-resnet`
- `2016-densenet`
- `2017-transformer`
- `2018-bert`
- `2018-gpt`
- `2020-alphafold`

### Fusion archive coverage problems

- None

### Duplicate archive preview ids

- None

### Generated ids missing archive preview

- None

### Preview ids missing generated target

- None

## Interpretation

- Catalog/event mismatches are blockers for normal generation.
- Quiz differences are migration inventory, not automatic failures, because archive and legacy IDs can differ during transition.
- Fusion coverage problems indicate remaining legacy transition logic that should eventually move into archive variants.
- Archive preview coverage should stay clean before retiring legacy source files.

