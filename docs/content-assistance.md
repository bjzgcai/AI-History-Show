# Content Assistance Workflow

This project currently uses deterministic, rule-based assistance for image metadata. The workflow is designed so it can later be backed by an LLM without changing the review contract.

## Current Auto-Description Flow

1. An editor opens an event in `manage/admin.html`.
2. The selected image list is read from `event.images`.
3. The editor clicks `自动生成描述`.
4. `resources/content-assistance.js` builds one suggestion per image that is missing either `caption` or `subcaption`.
5. Suggestions are stored in `event.imageMetaSuggestions`, not in final `event.imageMeta`.
6. The UI displays the suggested caption, subcaption, generator id, rule id, and source fields used.
7. The editor explicitly clicks `采纳` to copy the suggestion into `event.imageMeta`.
8. Approved metadata stays editable. Manual edits are marked with `approval.status = "human-edited"`.
9. `manage/server.js` persists approved image metadata and preserves generation trace fields.
10. `manage/generate.js` emits approved `imageMeta` into `milestones-data.js`.

## Image Metadata Output Schema

Generated suggestions use this shape:

```json
{
  "schemaVersion": "image-metadata-suggestion/v1",
  "generatedBy": "rule-based-image-metadata/v1",
  "status": "suggested",
  "caption": { "zh": "结构示意", "en": "Architecture" },
  "subcaption": { "zh": "Transformer 架构图", "en": "Transformer architecture diagram" },
  "trace": {
    "ruleId": "path-architecture",
    "matchedSignals": ["/architecture/", "_architecture_"],
    "sources": [
      { "type": "event", "field": "key", "value": "2017-transformer" },
      { "type": "event", "field": "title", "value": "Transformer" },
      { "type": "event", "field": "year", "value": "2017" },
      { "type": "image", "field": "path", "value": "resources/images/2017-transformer/architecture/example.png" }
    ]
  }
}
```

Approved metadata uses this shape:

```json
{
  "caption": { "zh": "结构示意", "en": "Architecture" },
  "subcaption": { "zh": "Transformer 架构图", "en": "Transformer architecture diagram" },
  "approval": {
    "status": "human-approved",
    "approvedBy": "admin-ui",
    "approvedAt": "2026-05-22T00:00:00.000Z"
  },
  "generationTrace": {
    "schemaVersion": "image-metadata-suggestion/v1",
    "generatedBy": "rule-based-image-metadata/v1",
    "trace": {}
  }
}
```

## Traceable Inputs

The rule-based generator can trace these inputs:

- `event.key`
- `event.title`
- `event.year`
- `event.category`
- `event.quoteMeta.workTitle`
- `event.quoteAttribution`
- `image.path`

Candidate source libraries remain structured inputs for future assistance:

- `resources/quote-candidates.js`
- `resources/research-candidates.js`

## Review Rules

Generated suggestions are not final content. Only `event.imageMeta` is treated as approved metadata. `event.imageMetaSuggestions` is an editable review queue and should not be rendered as final exhibition content. `caption` and `subcaption` use the localized text shape `{ "zh": "...", "en": "..." }`.

## Test and Evaluation Artifacts

- Deterministic tests: `scripts/test-content-assistance.js`
- Evaluation data: `resources/evaluations/content-assistance-eval.json`
- Future prompt template: `resources/prompts/image-metadata-assistance.md`
