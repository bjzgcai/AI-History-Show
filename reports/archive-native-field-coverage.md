# Archive Native Field Coverage

This report tracks frontend milestone fields needed to remove the legacy scaffold from archive generation.
It is a conservative text-scan plus current generator coverage map; verify behavior with `npm run diff:archive-native`.

## Identity / routing

| Field | Frontend usage | Current archive-native coverage |
|---|---|---|
| `id` | used/likely used | covered by archive-native generator |
| `archiveEventId` | not directly found by text scan | covered by archive-native generator |
| `archiveVariantId` | not directly found by text scan | covered by archive-native generator |
| `sourceKind` | not directly found by text scan | covered by archive-native generator |
| `order` | used/likely used | covered by archive-native generator |
| `storyline` | used/likely used | covered by archive-native generator |
| `category` | used/likely used | covered by archive-native generator |

## Core display

| Field | Frontend usage | Current archive-native coverage |
|---|---|---|
| `year` | used/likely used | covered by archive-native generator |
| `date` | used/likely used | covered by archive-native generator |
| `title` | used/likely used | covered by archive-native generator |
| `subtitle` | used/likely used | covered by archive-native generator |
| `description` | used/likely used | covered by archive-native generator |
| `location` | used/likely used | covered by archive-native generator |

## People / figures

| Field | Frontend usage | Current archive-native coverage |
|---|---|---|
| `figures` | used/likely used | covered by archive-native generator |
| `figures.avatar` | used/likely used | covered by archive-native generator |
| `figures.image` | used/likely used | covered by archive-native generator |
| `figures.role` | used/likely used | covered by archive-native generator |

## Media / resources

| Field | Frontend usage | Current archive-native coverage |
|---|---|---|
| `resources.images` | used/likely used | covered by archive-native generator |
| `resources.videos` | used/likely used | covered by archive-native generator |
| `imageMeta` | used/likely used | covered by archive-native generator |
| `photos` | used/likely used | covered by archive-native generator |
| `videoUrl` | used/likely used | covered by archive-native generator |

## Quotes

| Field | Frontend usage | Current archive-native coverage |
|---|---|---|
| `quote` | used/likely used | covered by archive-native generator |
| `quoteText` | used/likely used | covered by archive-native generator |
| `quoteHtml` | used/likely used | covered by archive-native generator |
| `quoteMeta` | used/likely used | covered by archive-native generator |
| `quotePage` | used/likely used | covered by archive-native generator |
| `quoteAttribution` | used/likely used | covered by archive-native generator |
| `quoteLabel` | used/likely used | covered by archive-native generator |

## Achievement

| Field | Frontend usage | Current archive-native coverage |
|---|---|---|
| `achievement.visual` | used/likely used | covered by archive-native generator |
| `achievement.visualModules` | used/likely used | covered by archive-native generator |
| `achievement.sources` | used/likely used | covered by archive-native generator |
| `achievement.sourceIds` | not directly found by text scan | covered by archive-native generator |
| `achievement.claims` | not directly found by text scan | covered by archive-native generator |
| `achievement.emphasis` | not directly found by text scan | covered by archive-native generator |
| `achievement.area` | used/likely used | covered by archive-native generator |
| `achievement.method` | used/likely used | covered by archive-native generator |
| `achievement.artifact` | used/likely used | covered by archive-native generator |
| `achievement.material` | used/likely used | covered by archive-native generator |
| `achievement.demo` | used/likely used | covered by archive-native generator |
| `achievement.keyConcepts` | used/likely used | covered by archive-native generator |
| `achievement.relatedAchievements` | used/likely used | covered by archive-native generator |
| `achievement.relatedRegions` | used/likely used | covered by archive-native generator |
| `achievement.demoSteps` | used/likely used | covered by archive-native generator |
| `achievement.demoImage` | used/likely used | covered by archive-native generator |
| `achievement.demoNotes` | used/likely used | covered by archive-native generator |

## Structured text / interaction

| Field | Frontend usage | Current archive-native coverage |
|---|---|---|
| `commentarySections` | used/likely used | covered by archive-native generator |
| `analysis` | used/likely used | covered by archive-native generator |
| `quizzes` | used/likely used | covered by archive-native generator |

## Current status

The archive-native generator now emits the current frontend milestone presentation shape directly from archive events and storyline variants.
Legacy quote formatting, figure presentation, video metadata, and achievement auxiliary fields were migrated into variant-owned presentation data; the generated native preview does not use `milestones-data.js` as a scaffold.

Use `npm run generate:archive-native-preview` followed by `npm run diff:archive-native` to verify parity against the scaffold-based archive preview.
