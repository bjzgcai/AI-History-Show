# Audio production

Audio source data and revision configuration live here. Generated MP3 files and their derived
manifests use `resources/audio/` only as a local staging area; the directory is ignored by Git and
will be published through object storage.

Executable tooling is kept separately under `scripts/audio/`; see
[`scripts/audio/README.md`](../scripts/audio/README.md) for the script inventory and execution flow.

## Layout

- `revisions/*.json`: one declarative revision configuration per candidate version.
- `revisions/<name>/turns/<locale>/`: sourced turn data used to compile TTS scripts.
- `voices/*.json`: reusable voice, instruction and pacing profiles.

Do not add event-specific generator scripts. Create a revision config and turn files instead.

## Revision workflow

```bash
# Validate config, turns, Archive membership and source references without generated audio.
npm run audio:revision -- source-check audio/revisions/my-revision.json

# Validate source data against an existing generated revision.
npm run audio:revision -- check audio/revisions/ai100-first10-huopo-original.json

# Build scripts and a revision plan for a new revision ID.
npm run audio:revision -- build audio/revisions/my-revision.json

# Build, call Seed-TTS, normalize media and validate the result.
npm run audio:revision -- generate audio/revisions/my-revision.json

# Validate a generated revision without calling TTS.
npm run audio:revision -- validate audio/revisions/my-revision.json

# Select one or more candidates for the review console.
npm run audio:revision -- activate \
  audio/revisions/ai100-first10-huopo-original.json \
  audio/revisions/ai100-first10-huopo-interactive.json
```

`activate` writes the generated local selection to
`tools/audio-review-console/active-overlays.json` and rebuilds
`tools/audio-review-console/review-data.json`. The review data is compiled from the selected revision
overlays, their tracked `audio/revisions/*.json` configs and frozen turns. It does not depend on the
legacy AI100 baseline manifests or reports. The review console HTML, CSS and JavaScript are tracked;
the overlay selection, generated review data and screenshots are ignored.
Credentials are read from the `envFile` declared by the revision config; secret values are never
stored in revision plans or logs.

Generation outputs are append-only locally: existing plans, overlays and MP3 files are never
overwritten. Do not add anything under `resources/audio/` to Git.

Multiple candidates may be activated at the same time for listening comparison. They are editorial
candidates for the same storyline asset, not separate standalone/storyline products. Review may keep
several append-only revisions, but release metadata must eventually approve exactly one candidate per
event, locale and mode.

The two migrated first-10 configurations set `allowLegacyPlanMetadata: true` because their existing
append-only plans predate the unified plan metadata. Do not use that compatibility flag for newly
generated revisions.

## Legacy base batch

The original 40-event AI100 plus gaming bilingual batch predates the revision workflow and still uses
these stages when its historical base artifacts need to be reproduced or audited:

```bash
npm run audio:plan:build
npm run audio:plan:validate
npm run audio:scripts:build
npm run audio:scripts:validate
npm run audio:scripts:dry-run
npm run audio:base:generate
npm run audio:base:validate
npm run audio:samples:audit
npm run audio:release:finalize
```
