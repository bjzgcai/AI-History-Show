# Audio source authority

This directory contains the tracked source authority for project-produced audio. The complete
generation, review and release runbook is [docs/audio-workflow.md](../docs/audio-workflow.md).

## Tracked source

- `revisions/*.json`: immutable revision configuration, provider selection and output location.
- `revisions/<name>/turns/<locale>/*.json`: sourced narration turns and Archive evidence IDs.
- `voices/*.json`: reusable voice, instruction and pacing profiles.

Every revision config, turn file and voice profile must be committed. Do not add event-specific
generator scripts; create a new revision config and frozen turns instead. Editing content, voices or
TTS parameters requires a new `revisionId` and a new append-only output directory.

## Generated output

Revision plans, compiled scripts, overlays, quality reports and MP3 files are generated under
`resources/audio/`. They are workstation artifacts, are ignored by Git and are published through
object storage.

The review console source under `tools/audio-review-console/` is tracked. Its `active-overlays.json`,
`review-data.json` and screenshots are generated locally and ignored.

## Source validation

```bash
# Check every tracked revision without requiring credentials or local MP3 files.
npm run audio:workflow -- source-check-all

# Check one revision.
npm run audio:workflow -- source-check audio/revisions/<revision>.json

# Audit the whole workflow boundary.
npm run audio:status
```

The compatibility alias `npm run audio:revision -- ...` still invokes the same workflow driver, but
new documentation and automation should use `audio:workflow`.
