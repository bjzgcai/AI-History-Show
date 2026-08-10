# Archive Figure Registry

`figures.json` is the global identity authority for people, teams, organizations, products, and systems used by Archive events.

## Identity and relationship split

- `archive/figures/figures.json` stores stable identity facts: bilingual standard names, aliases, type, organization relationships, profile sources, optional default avatar metadata, disambiguation, and review state.
- `archive/events/{eventId}/event.json` stores canonical event relationships using `figureId`, bilingual `role`, `primary`, and optional event-specific avatar controls.
- `archive/events/{eventId}/variants/*.json` stores storyline-specific ordering and role/avatar overrides using the same stable `figureId` values.
- `archive/events/{eventId}/assets.json` uses `figureIds` to state exactly which identities appear in a portrait, team photograph, or other person-bearing media.

Do not copy `name`, `avatar`, `figureType`, or `organizationIds` into event or variant figure relationships. The compiler resolves those fields from the registry.

## Avatar precedence

For a resolved event or variant figure, avatar selection follows this order:

1. A variant `avatarAssetId`.
2. An event `avatarAssetId`.
3. The registry `defaultAvatar`.

Set `useDefaultAvatar: true` on a relationship when a storyline intentionally bypasses an event-specific avatar. Every `avatarAssetId` must reference an asset whose `figureIds` contains the same `figureId`. Different person identities may not share one registry default-avatar path.

## Historical migration report

The one-time figure registry migration is complete. Its script remains available only to reproduce the read-only audit report:

```bash
npm run report:figure-migration
```

Do not use the migration script to edit Archive data. Make ongoing identity and relationship changes through the Archive files or `/admin` workflow; registry-only identities that are not event contributors remain preserved in `figures.json`.

After changing identities, relationships, or person-bearing assets, run:

```bash
npm run validate:archive
npm run audit:event-figure-rules
npm run generate
npm test
```
