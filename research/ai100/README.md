# AI100 Research Workspace

This directory supports the AI History Museum / AI Top 100 Achievements research pass.

- `achievements.json`: structured BenchCouncil AI100 list generated from the source page.
- `achievements.md`: human-readable copy of the list.
- `prompt-template.md`: reusable research prompt for each achievement.
- `pages/`: one directory per achievement, named `$number.$achievement-name-slug/`.
- `pages/*/index.md`: the achievement research page.
- `pages/*/index.zh.md`: Chinese version of the achievement research page when available.
- `pages/*/photos/`: local images collected for that achievement. Keep achievement-specific images here with the research notes so each page is self-contained.

## Website Layout Schema

AI100 pages must support the exhibition layout used by the website:

- Top visual row: `images[0]` is the scientist/person/team/institution image, `images[1]` is the achievement visualization, and `achievement.visualModules[0]` is the related article/source card.
- Bottom demo row: `achievement.visual` must map to a paper-demo style renderer with a large visual on the left and two note boxes on the right. The second note is always `Interaction point` / `互动点`.
- Right text column: `commentarySections` includes `Historical Background`, `Core Idea`, and `Long-Term Legacy`; the legacy section must include expert evaluation language.
- Localized website data must provide real `en` and `zh` values for all user-visible fields. Do not copy English into Chinese fields except for proper names, acronyms, or model names.

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
