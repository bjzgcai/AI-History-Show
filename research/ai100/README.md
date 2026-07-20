# AI100 Research Workspace

This directory supports the AI History Museum / AI Top 100 Achievements research pass.

- `achievements.json`: structured BenchCouncil AI100 list generated from the source page.
- `achievements.md`: human-readable copy of the list.
- `prompt-template.md`: reusable research prompt for each achievement.
- `pages/`: one directory per achievement, named `$number.$achievement-name-slug/`.
- `pages/*/index.md`: the achievement research page.
- `pages/*/index.zh.md`: Chinese version of the achievement research page when available.
- `pages/*/photos/`: local images collected for that achievement. Keep achievement-specific images here with the research notes so each page is self-contained.

## Website Achievement Schema

AI100 pages must support the exhibition layout used by the website. Future achievements should be prepared with all of these fields before being added to `archive/events/<event-id>/` and the `bench-council-ai100` storyline:

- Top visual row:
  - `images[0]` is the scientist/person/team/institution image, preferably a portrait.
  - `images[1]` is the achievement visualization, architecture, algorithm explainer, system screenshot, or local original diagram.
  - `achievement.visualModules[0]` is the related article/source card with `type: "archiveLink"` and `site/title/description/url/source/action`.
- Bottom demo row:
  - `achievement.visual` must map to a paper-demo style renderer with a large visual on the left and two note boxes on the right.
  - The second note is always `Interaction point` / `互动点`.
  - Do not allow new entries to fall back to a generic one-line text panel.
- Right text column:
  - `commentarySections` includes `Historical Background`, `Core Idea`, and `Long-Term Legacy`.
  - `Long-Term Legacy / 长期影响` must include what experts think of the achievement, not only general impact.
- Sources:
  - `achievement.sources` must include at least 3 items, preferably 4.
  - Include the primary paper/source plus relevant background, project, people, institution, code, image-source, publication, or retrospective links.
  - Every source needs real bilingual `type` and `label` text plus a URL.
- Quiz:
  - Every added AI100 achievement needs a matching quiz in the event's `archive/events/<event-id>/quizzes.json`, selected by its variant.
  - Use the older checkpoint layout: related material on the left, easy quick challenge on the right, 4 options.
  - Questions should be understandable for general visitors.
  - Answer order is randomized by the frontend, so source options can stay in a clear authoring order.
  - Related quiz material must include an image or enough source information; do not leave recent entries with missing photos/material.
- Localization:
  - Website data must provide real `en` and `zh` values for all user-visible fields.
  - Chinese pages must display Chinese and English pages must display English.
  - Do not copy English into Chinese fields except for proper names, acronyms, or model names.
- Verification:
  - Validate and regenerate with `npm run validate:archive` and `npm run generate`.
  - Run `npm run lint` and `npm test`; run `npm run validate:startup` when page loading/startup may be affected.

The achievement list and per-achievement Markdown pages are retained research snapshots. The one-time fetch/template bootstrap scripts have been retired after the Archive authority cutover; maintain current exhibition content in `archive/events/<event-id>/` and `archive/storylines/bench-council-ai100.json`.

Source: https://www.benchcouncil.org/evaluation/ai/
