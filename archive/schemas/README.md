# Archive Schemas

This directory contains the first-stage JSON Schemas for the file-based AI history archive.

The schemas define file shape and required fields. Cross-file checks, such as whether an `asset.path` exists in `resources/` or a `sourceId` resolves to an entry in `sources.json`, should be handled by `scripts/validate-archive.js` in a later step.

## First-stage schema files

| Schema                  | Intended file                                                              |
| ----------------------- | -------------------------------------------------------------------------- |
| `shared.schema.json`    | Shared definitions such as localized text, IDs, coordinates, review status |
| `event.schema.json`     | `archive/events/{eventId}/event.json`                                      |
| `claim.schema.json`     | `archive/events/{eventId}/claims.json`                                     |
| `source.schema.json`    | `archive/events/{eventId}/sources.json`                                    |
| `asset.schema.json`     | `archive/events/{eventId}/assets.json`                                     |
| `quiz.schema.json`      | `archive/events/{eventId}/quizzes.json`                                    |
| `variant.schema.json`   | `archive/events/{eventId}/variants/{storylineId}.json`                     |
| `storyline.schema.json` | `archive/storylines/{storylineId}.json`                                    |
| `figure.schema.json`    | `archive/figures/figures.json`                                             |

## ID conventions

- Event IDs should reuse existing event keys where possible, for example `2012-alexnet`, `2017-transformer`, `2016-alphago`.
- IDs use lowercase letters, digits, dots, underscores, and hyphens. They should start with a lowercase letter or digit.
- `event.json` `id` should match its directory name.
- Claim IDs only need to be unique within an event directory in the first stage.
- Source IDs only need to be unique within an event directory in the first stage. They can later be promoted to shared/global sources.
- Asset IDs only need to be unique within an event directory in the first stage.
- Variant file names should match the target storyline ID, for example `variants/bench-council-ai100.json`.
- Figure IDs are global and stable. Event and variant relationships reference them through `figureId`.

## Bilingual text convention

Page-visible text should use localized objects:

```json
{
    "zh": "中文文本",
    "en": "English text"
}
```

The schemas use two shared definitions:

- `localizedText`: requires both `zh` and `en`, each non-empty.
- `optionalLocalizedText`: allows either locale. Use this only for transitional or optional metadata.

## First-stage required fields

### `event.json`

Required:

- `id`
- `year`
- `title`

Optional:

- `summary` (event-specific synopsis only; do not repeat a storyline title or category label)

Recommended for migrated events:

- `description`
- `location.regionId` or `location.country`
- `location.coordinates` when the event has a meaningful map location
- `topics`
- `figures`
- `review.status`

### `claims.json`

Each claim requires:

- `id`
- `text`
- `sourceIds`

Recommended:

- `importance`: `core`, `context`, `detail`, or `display`
- `status`

Core claims should always include at least one source.

### `sources.json`

Each source requires:

- `id`
- `type`: what the source is; must use `archive/taxonomies/source-types.json`
- `label`: bilingual display category compatible with the source type
- `title`: bilingual source name
- `purpose`: why the source is cited; must use `archive/taxonomies/source-purposes.json`
- `reliability`: `primary`, `secondary`, `tertiary`, or `reference-only`
- at least one of `url`, `doi`, or `archiveUrl`

Recommended:

- `authors`
- `year`
- `language`
- `notes`

Paper and documentation sources use these managed display categories:

- `paper`: an actual paper title. The Chinese title uses `《》`; the English title stays in normal type.
- `paper-page`: a publisher, conference, OpenReview, or other paper landing page.
- `paper-file`: a direct paper PDF or archived paper file.
- `paper-index`: a bibliographic index such as PubMed or Semantic Scholar.
- `book`: an actual book or monograph title. The Chinese title uses `《》`.
- `book-file`: a direct book PDF or archived book file.
- `book-index`: a library catalog, metadata record, or bibliographic search result.
- `documentation`: official, language, optimizer, model, framework, or example documentation.

`label` describes the displayed source category, while `title` names the source. Do not use a relation-only label such as `Method lineage` for a paper; use a paper-aware pair such as `方法源流论文 / Foundational paper`.

### `assets.json`

Each asset requires:

- `id`
- `type`
- `path`
- `role`
- `caption`
- one of `sourceId` or `sourceIds`

Recommended:

- `rights.status`
- `rights.license`
- `usage`
- `editable`
- `figureIds` for portraits, team photographs, or other media depicting registered identities

`path` should point to an actual resource file, usually under `resources/`. Existence is validated by `validate:archive`, not by JSON Schema alone.

Audio assets additionally require `language` and Alibaba Cloud OSS `storage` metadata. Before publication, `path` may be the local production source. Published assets should use the stable HTTPS delivery URL for both `path` and `deliveryUrl`, while `storage.sourcePath` may retain the ignored local upload source used only on a publisher machine. The storage block records `provider`, `bucket`, `objectKey`, `contentType`, and optional cache/public URL settings; it must never contain access credentials.

General event narration is audio-only. Current `defaultPresentation` records should select the Chinese and English audio asset IDs and should not carry the retired `videoUrl` or `resources.videos` fields. This is a content policy rather than a schema prohibition. Independent visual modules may still use video when motion is essential to the demonstration; those modules are loaded lazily through `shared/video-player.js`.

### `quizzes.json`

Each quiz requires:

- `id`
- `question`
- `options`
- `answer`

Recommended:

- `storylineId`
- `explanation`
- `sourceIds`
- `assetIds`

### `storyline.json`

Each storyline requires:

- `id`
- `title`
- `events`

Each event reference requires:

- `eventId`

Optional:

- `variant` when a storyline needs a named override different from the default presentation

The validator confirms that `eventId` exists. If `variant` is omitted, the compiler reads
`event.defaultPresentation` and then applies `variants/{storylineId}.json` only when that override exists. If
`variant` is present, `archive/events/{eventId}/variants/{variant}.json` must exist.

### `variant.json`

Variant override files are optional partial patches. They no longer need to repeat identity fields because identity is
derived from the event directory, the file name, and the storyline reference.

Legacy full variant files may still include:

- `storylineId`
- `eventId`

Variants may override display-level fields such as:

- `displayTitle`
- `displaySummary` (storyline-specific subtitle; omit it when it would only repeat the storyline title)
- `displayDescription`
- `emphasis`
- `visual`
- `visualModules`
- `assetIds`
- `overviewImageAssetId` (optional homepage/chronology card image; must also appear in `assetIds`)
- `sourceIds`
- `claimIds`
- `quizId`
- `commentarySections`
- `analysis`
- `layout`
- `theme`
- `timelineLabel`
- `regionOverride`

Event and variant `figures` are relationship records, not identity records. They may contain:

- `figureId`
- bilingual `role`
- `primary`
- `avatarAssetId`
- `useDefaultAvatar`
- `avatarStyle`

Identity fields such as `name`, `avatar`, `figureType`, and `organizationIds` belong only in the global figure registry.

### `figures.json`

Each global figure requires:

- stable `id`
- bilingual `name`
- `type`: `person`, `team`, `organization`, `product`, or `system`
- `aliases`
- `profileSources`
- `review`

Optional fields include `disambiguation`, `organizationIds`, and `defaultAvatar`. Person names must have a Chinese-readable `zh` value. A default avatar path may belong to only one person identity.

Variants should not copy or contradict canonical event facts, core claims, or primary sources.

## Schema vs taxonomy validation

Schemas validate file structure. Taxonomies validate semantic references.

Examples:

- Schema validation checks that `topics` is an array of strings.
- Taxonomy validation checks that `deep-learning` exists in `archive/taxonomies/topics.json`.
- Schema validation checks that `asset.role` is a string.
- Taxonomy validation checks that `architecture-explainer` is a known asset role.

Taxonomy files will be introduced in a later step.
