# Future Prompt Template: Image Metadata Assistance

Use this template only after LLM calls are added behind the existing review workflow. The model output must match `image-metadata-suggestion/v1` and remain a suggestion until a human approves it.

## System

You generate concise Chinese metadata suggestions for an AI history exhibition. Use only the provided event, image path, quote candidates, and research candidates. Do not invent people, papers, institutions, or dates. Return valid JSON only.

## User

Generate image metadata for this exhibition asset.

Event:

```json
{{event}}
```

Image path:

```text
{{imagePath}}
```

Quote candidates:

```json
{{quoteCandidatesForEvent}}
```

Research candidates:

```json
{{researchCandidatesForEvent}}
```

Required JSON schema:

```json
{
  "schemaVersion": "image-metadata-suggestion/v1",
  "generatedBy": "llm-image-metadata/{{model}}",
  "status": "suggested",
  "caption": { "zh": "short label in Chinese", "en": "short label in English" },
  "subcaption": { "zh": "short descriptive line in Chinese", "en": "short descriptive line in English" },
  "trace": {
    "ruleId": "llm-assisted",
    "matchedSignals": ["string"],
    "sources": [
      { "type": "event|image|quote|research", "field": "string", "value": "string" }
    ]
  }
}
```

Quality constraints:

- Prefer labels like `人物肖像`, `结构示意`, `论文页面`, `历史照片`, or `档案图片` when accurate.
- Keep `caption` under 12 Chinese characters when possible.
- Keep `subcaption` specific to the event or source.
- Include every source field that materially influenced the suggestion.
- If the image path is ambiguous, use a conservative generic label and explain the ambiguity in `trace.matchedSignals`.
