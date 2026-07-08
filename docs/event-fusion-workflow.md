# Event Fusion Data Workflow

This document summarizes how duplicate events from the deep-learning storyline and the BenchCouncil AI100 storyline are fused into one consistent presentation.

## Goal

Some historical events appear in both data sources. For example:

- `1957-perceptron` and `1958-rosenblatt-perceptron`
- `1989-cnn` and `ai100-1989-lenet`
- `2016-densenet` and `ai100-2017-densenet`

The fusion workflow makes these entries display the same final content no matter which storyline or entry point the visitor uses.

## Source Files

Edit these files instead of editing generated data directly.

- `manage/event-fusions.js`
  - Defines which events are equivalent.
  - Provides the canonical event id.
  - Stores fused year, title, location, description, and figure/task information.
  - Decides how deep-learning and AI100 fields are merged.

- `manage/event-fusion-assets.js`
  - Curates images and media for each fused event.
  - Controls final image order.
  - Supports image filtering with `excludeImages` and `excludeImagePatterns`.

- `manage/figure-avatars.js`
  - Stores reusable person/team avatar mappings.
  - Use this when a figure avatar should change.
  - Image filtering in `event-fusion-assets.js` does not remove `figure.avatar`.

- `manage/generate.js`
  - Applies event fusion while generating `milestones-data.js`.
  - Do not usually edit this unless the fusion mechanism itself needs to change.

- `manage/generate-event-fusion-review.js`
  - Generates `event-fusion-review.html`.
  - The review page compares deep-learning raw data, AI100 raw data, and the final fused data.

## Generated Files

Do not edit these by hand.

- `milestones-data.js`
- `milestones-data-default.js`
- `event-fusion-review.html`

Regenerate them with the commands below.

## Normal Editing Flow

1. Edit narrative and figures in `manage/event-fusions.js`.

2. Edit final image lists in `manage/event-fusion-assets.js`.

3. If an avatar is wrong or missing, edit `manage/figure-avatars.js` or add an explicit `avatar` field in `manage/event-fusions.js`.

4. Regenerate data:

   ```bash
   node manage/generate.js
   node manage/generate-event-fusion-review.js
   ```

5. Open the review page:

   ```text
   http://127.0.0.1:8000/event-fusion-review.html
   ```

6. Check the right column, `融合后最终数据`.

The left and middle columns intentionally show original raw data, so excluded images may still appear there. Only the right column represents the final fused display data.

## Image Filtering

Use `manage/event-fusion-assets.js` to control final images:

```js
'1957-perceptron': {
  images: [
    'resources/images/bench-council-ai100/photos/1958-rosenblatt-perceptron_frank-rosenblatt.jpg',
    'resources/images/bench-council-ai100/explainers/1958-rosenblatt-perceptron_threshold.svg'
  ],
  excludeImages: [
    'resources/images/1957-perceptron/people/1957-perceptron_people_02.png'
  ],
  excludeImagePatterns: []
}
```

Notes:

- `images` defines the final order and candidates.
- `excludeImages` removes exact URLs from final `resources.images`.
- `excludeImagePatterns` removes URLs containing a string, or matching a RegExp.
- After changing this file, run both generation commands.
- Excluded images can still appear in the review page raw columns.
- Excluded images can still appear as avatars if they are referenced by `figure.avatar`.

## Frontend Data Source

`index.html` loads:

```html
<script src="milestones-data.js?..."></script>
```

The review page also reads `milestones-data.js` when generated. Therefore, the final review column and the frontend use the same generated source data.

There is one important difference:

- `event-fusion-review.html` expands the final data for inspection.
- `index.html` applies UI display logic, such as choosing a primary image, preferring diagrams, and avoiding portrait-like media in some right-side panels.

So the data source is the same, but the exact image shown in a specific UI slot may be selected by frontend logic.

## Consistency Checks

Useful quick check:

```bash
node -e "const {milestones}=require('./milestones-data.js'); const {FUSIONS}=require('./manage/event-fusions.js'); const sig=m=>JSON.stringify({title:m.title,year:m.year,description:m.description,figures:m.figures,images:m.resources&&m.resources.images,sources:m.achievement&&m.achievement.sources,keyConcepts:m.achievement&&m.achievement.keyConcepts}); let bad=0; for(const f of FUSIONS){const a=milestones.find(m=>m.id==='milestone-'+f.deep); const b=milestones.find(m=>m.id==='milestone-'+f.ai100); const ok=a&&b&&sig(a)===sig(b); console.log(ok?'OK':'DIFF', f.canonical); if(!ok) bad++;} process.exit(bad?1:0);"
```

Expected result: every fused event prints `OK`.

## Test Plan

After changing fusion data, run:

```bash
node manage/generate.js
node manage/generate-event-fusion-review.js
npm run lint
npm test
```

If AI100 context sections were changed heavily, also run:

```bash
npm run validate:ai100-context
```

If page startup behavior may be affected, also run:

```bash
npm run validate:startup
```

## Troubleshooting

### I removed an image but it still appears

Check where it appears:

- Raw column in `event-fusion-review.html`: expected; raw data is not filtered.
- Right column in `event-fusion-review.html`: run `node manage/generate.js` and `node manage/generate-event-fusion-review.js` again.
- Avatar circle or figure card: update `manage/figure-avatars.js` or the explicit `figures` entry in `manage/event-fusions.js`.
- Frontend-specific panel: check `index.html` image selection helpers such as `getUiDetailImages()` and `getUiMediaVisualImage()`.

### The review page and frontend look different

They use the same generated data, but the frontend selects images for specific UI slots. The review page is a data inspection page, not a pixel-perfect preview of every UI placement.

### Two entries for the same event do not match

Check that both ids are listed in `manage/event-fusions.js`, then regenerate. The canonical mapping should make both generated milestones share the same fused content.
