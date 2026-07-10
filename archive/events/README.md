# Archive Events

This directory will contain one directory per canonical AI history event.

Planned event shape:

```text
archive/events/{eventId}/
├── event.json
├── claims.json
├── sources.json
├── assets.json
├── quizzes.json
└── variants/
    └── {storylineId}.json
```

Step 3 will add the first sample events:

- `2012-alexnet`
- `2017-transformer`
- `2016-alphago`
