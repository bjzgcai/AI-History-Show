# AI100 Research Workspace

This directory supports the AI History Museum / AI Top 100 Achievements research pass.

- `achievements.json`: structured BenchCouncil AI100 list generated from the source page.
- `achievements.md`: human-readable copy of the list.
- `prompt-template.md`: reusable research prompt for each achievement.
- `pages/`: one directory per achievement, named `$number.$achievement-name-slug/`.
- `pages/*/index.md`: the achievement research page.
- `pages/*/index.zh.md`: Chinese version of the achievement research page when available.
- `pages/*/photos/`: local images collected for that achievement. Keep achievement-specific images here with the research notes so each page is self-contained.

Regenerate the list:

```bash
node scripts/fetch-ai100-list.mjs
```

Regenerate the per-achievement Markdown templates:

```bash
node scripts/create-ai100-research-pages.mjs
```

Existing `index.md` files are not overwritten by default. To rebuild templates deliberately:

```bash
node scripts/create-ai100-research-pages.mjs --force
```

Generate only the first three pages for preview:

```bash
node scripts/create-ai100-research-pages.mjs --limit=3
```

Source: https://www.benchcouncil.org/evaluation/ai/
