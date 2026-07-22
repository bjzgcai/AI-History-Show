# Archive Taxonomies

This directory contains controlled vocabularies for archive metadata.

Current taxonomies:

```text
archive/taxonomies/source-types.json
archive/taxonomies/source-purposes.json
```

Planned taxonomies:

```text
archive/taxonomies/topics.json
archive/taxonomies/regions.json
archive/taxonomies/asset-roles.json
archive/taxonomies/achievement-types.json
```

Schemas validate JSON structure. Taxonomies validate semantic references such as topic IDs, region IDs, source types, and asset roles.

Source metadata separates three dimensions:

- `type`: what the source is, such as a paper, profile, article, or image source.
- `purpose`: why the event cites it, such as background, biography, or alternate access.
- `reliability`: how the source is assessed, such as primary, secondary, or reference-only.
