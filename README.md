# AI History Exhibition

**English** | [简体中文](README.zh.md)

An interactive frontend application designed for exhibition-hall large-screen displays, showcasing key milestones in the history of artificial intelligence. It supports Chinese and English (with an in-page language switch), adapts automatically between single-screen, mobile, and dual-screen layouts, and presents deep-learning history, BenchCouncil AI100 achievements, gaming AI, and the humanistic and emotional cycles surrounding AI.

## Repositories

- Gitee: `ssh://git@z.gitee.cn:223/zgca/AI-History-Show.git`
- GitHub: `git@github.com:bjzgcai/AI-History-Show.git`

## Quick Start

```bash
# Install dependencies from the lockfile
npm ci

# Preview the exhibition page locally
npm run start:static
# Open http://localhost:8000

# Run the local demo server entry
npm run start:demo

# Validate generated data, tests, and startup behavior
npm run validate:deployment

# Validate AI100 context and quiz grounding
npm run validate:ai100-context
npm run validate:ai100-quizzes

# Audit AI100 accuracy-sensitive claims
npm run audit:ai100-accuracy

# Run the full quality gate (lint + format check + tests)
npm run quality

# Run the content management server locally
npm run start:admin
# Open http://localhost:3001/archive-admin
```

Containerized preview:

```bash
docker build -t ai-history-show .
docker run --rm -p 8000:8000 ai-history-show

# Or run the Nginx presentation service with Compose
docker compose up --build presentation

# Include the local admin service when needed
docker compose --profile admin up --build
```

> **Security notice**: The management service (port 3001) has no authentication and is intended for **local use only**. **Never expose it directly to the public internet.** For production, access it through an SSH tunnel or behind Nginx Basic Auth — see [DEPLOYMENT.md](DEPLOYMENT.md) for details.

Cloud deployment (Nginx + PM2), static hosting, GitHub Pages, and SSH-tunnel access to the admin console are all covered in [DEPLOYMENT.md](DEPLOYMENT.md). The repository also includes a custom GitHub Pages workflow at [.github/workflows/pages.yml](.github/workflows/pages.yml).

## Internationalization (i18n)

The exhibition ships with built-in Chinese/English support:

- Language dictionary and runtime switching: [shared/i18n.js](shared/i18n.js)
- Default locale is Chinese; the active locale is persisted in `localStorage` under the key `ai-history-locale`
- A language toggle button is rendered in both single- and dual-screen layouts
- Milestone content fields (titles, descriptions, quotes, etc.) support a bilingual object form `{ zh: "...", en: "..." }`; missing locales fall back gracefully

When authoring content, use bilingual objects such as `{ zh: "...", en: "..." }` in Archive event and variant JSON. The Archive compiler resolves these records into the final `milestones-data.js`.

## Storylines

The single-screen entry includes a storyline selector dialog in the top bar. The generated runtime contains 146 Archive milestones across four source storylines, plus a unified map that merges deep-learning and AI100 records for browsing:

| Public view                     | Archive records | Notes                                                                                                                 |
| ------------------------------- | --------------: | --------------------------------------------------------------------------------------------------------------------- |
| AI History Map                  |    Derived view | Unified browser combining deep-learning milestones and AI100 achievements                                             |
| AI History (Deep Learning)      |              21 | Technical timeline from early AI through neural networks, scaled learning, and modern architectures                   |
| BenchCouncil AI100 achievements |             100 | Achievement-map layout with source cards, context sections, demos, and quizzes                                        |
| AI in Board & Tabletop Games    |              13 | Horizontal branch timeline covering search, learned evaluation, self-play, poker, mahjong, and learned-model planning |
| Humanistic & emotional cycles   |              12 | Sci-fi prophecy, technology hype, AI winters, and risk debates                                                        |

Open a specific storyline directly with `?storyline=...`, for example:

```text
http://localhost:8000/index.html?storyline=deep-learning-history
http://localhost:8000/index.html?storyline=bench-council-ai100
http://localhost:8000/index.html?storyline=gaming-ai
http://localhost:8000/index.html?storyline=humanistic-cycle
```

The Archive identifier `deep-learning` is normalized to the public URL identifier `deep-learning-history`; use the latter when linking to the exhibition.

The gaming branch supports SGF/game-state evolution modules. Source SGF examples and tooling live in:

- `examples/sgf/sample-go-game.sgf`
- `scripts/sgf_to_video.py`
- `scripts/README-game-evolution-video.md`
- `resources/videos/game-evolution/sample-go-game.gif`

## Quality Gate

Before opening a Pull Request or merging changes, please run:

```bash
npm ci
npm run quality
npm run validate:deployment
```

`npm run validate:deployment` validates Archive data, regenerates both runtime data files, assembles and checks the allowlisted static bundle, runs the Node.js test suite, and smoke-tests the presentation and admin HTTP services. CI additionally builds and smoke-tests the Docker presentation image and validates the Compose configuration.

Mobile support scope, viewport checklist, and responsive validation notes are recorded in [docs/mobile-responsive-support.md](docs/mobile-responsive-support.md).

For AI100 content work, also run:

```bash
npm run validate:ai100-context
npm run validate:ai100-quizzes
npm run audit:ai100-accuracy
```

Modules that should be prioritized for additional test coverage:

- `scripts/archive-compiler.js`: storyline resolution, variant selection, and generated milestone shape.
- `shared/milestone-view.js`: multilingual rendering fallbacks and media metadata normalization.
- `manage/server.js`: Archive file validation and safe content-management boundaries.

## Code Sync

The default `origin` remote points to GitHub (`main` branch):

```bash
git status --short
git add <files>
git commit -m "Describe this change"
git push origin main
```

If you also configure a Gitee remote locally (e.g. `git remote add gitee ssh://git@z.gitee.cn:223/zgca/AI-History-Show.git`), push with `git push gitee master` — Gitee's default branch is `master`. See [DEPLOYMENT.md](DEPLOYMENT.md) for the canonical remote setup.

## Dual-Screen Exhibition Demo

- Adaptive entry: `http://localhost:8000/`
- `index.html` automatically switches to single-screen/mobile or dual-screen layout based on the current viewport
- Fixed dual-screen entry: `http://localhost:8000/dual-screen.html`
- To force a mode manually, append `?layout=single` or `?layout=dual` to the URL
- For Windows on-site demos, first verify the page with `msedge --app="http://localhost:8000/dual-screen.html"`, then decide whether to compose an ultrawide display via the GPU control software before switching to `F11` or `--kiosk`
- Multi-monitor full-screen demos, Edge app/kiosk modes, Intel/NVIDIA display composition, DisplayFusion caveats, etc. are documented in [DEPLOYMENT.md](DEPLOYMENT.md)

---

## Content Management Workflow

Archive JSON is the production source of truth. Start the local management service and open the Archive editor:

```bash
npm run start:admin
# Open http://localhost:3001/archive-admin
```

Edit `archive/events/<event-id>/*.json` and `archive/storylines/*.json` in the Archive editor, run validation, then regenerate the runtime files:

```text
archive/storylines/*.json ─┐
archive/events/*/          ├─→ npm run validate:archive ─→ npm run generate
resources/                 ┘                              ├─→ milestones-data.js
                                                           └─→ milestones-data-default.js
```

```bash
npm run validate:archive
npm run generate
```

The legacy editor at `http://localhost:3001/admin` is retained as a read-only reference. Its write, restore, image mutation, and generation endpoints return HTTP 403. The former compatible generator remains available only for comparison or rollback:

```bash
npm run generate:legacy
```

Do not hand-edit `milestones-data.js` or `milestones-data-default.js`.

Pages and the Docker presentation image share the same allowlisted release bundle:

```bash
npm run build:static
# Output: .tmp/static-site/
```

The bundle contains the presentation pages, runtime data, `shared/`, `resources/`, required `public/` assets, and `.nojekyll`; it excludes Archive source JSON, management tools, Legacy data, reports, research files, and scripts.

For the complete entity graph, compile sequence, failure safeguards, and deployment boundary, see [`docs/archive-data-flow.md`](docs/archive-data-flow.md). For the Archive entity layout and source/asset relationships, see [`archive/README.md`](archive/README.md). For retained browser resources, see [`docs/archive-resources-retention.md`](docs/archive-resources-retention.md).

---

### Legacy compatibility reference

The files under `manage/`—including `catalog.js`, `events.js`, the extra-event helpers, quizzes, avatars, and `generate.js`—describe the former compatible content system. They remain available for:

- `npm run generate:legacy` rollback/comparison output;
- parity reports that compare Legacy and Archive rendering;
- migration and audit scripts that still map old event IDs into Archive entities.

They are **not production authoring inputs**. Do not use `/admin` or edit these files expecting `npm run generate` to consume the changes. Current storyline membership and order live in `archive/storylines/*.json`; event facts, assets, sources, quizzes, and presentation variants live in `archive/events/<event-id>/`.

The `/admin` page exposes this Legacy dataset as a read-only reference. Its mutation endpoints are blocked by the server. Retained Legacy files remain available only for an explicit rollback/comparison period and for migration tools; the production Archive compiler no longer reads `manage/event-fusions.js` for milestone identities.

---

## File Structure

```
AI-History-Show/
├── index.html                   # Adaptive entry (Three.js globe + milestone view)
├── dual-screen.html             # Fixed dual-screen entry
│
├── milestones-data.js           # ⚠️ Archive-generated runtime data; do not hand-edit
├── milestones-data-default.js   # Archive-generated fallback data; do not hand-edit
│
├── archive/                      # Production content authority
│   ├── storylines/               # Storyline membership, variants, enablement, and order
│   └── events/                   # Canonical event JSON, evidence, assets, quizzes, and variants
│
├── manage/                      # Local content tools and retained Legacy compatibility data
│   ├── archive-admin.html        # Writable Archive JSON editor
│   ├── admin.html                # Read-only Legacy viewer
│   ├── server.js                 # Local Archive/Legacy management server
│   ├── authority-boundary.js     # Legacy mutation route boundary
│   ├── catalog.js                # Retained Legacy catalog
│   ├── events.js                 # Retained Legacy event content
│   └── generate.js               # Explicit Legacy comparison/rollback generator
│
├── shared/                      # Shared frontend logic across single/dual screen
│   ├── i18n.js                  # Bilingual dictionary and runtime locale switching
│   ├── milestone-view.js        # Milestone rendering
│   ├── layout-router.js         # Adaptive single/dual-screen routing
│   ├── swipe-navigation.js      # Touch swipe paging
│   └── utils.js
│
├── scripts/                     # Generation, validation, migration, and reporting scripts
│   ├── generate-archive-data.js # Default Archive-native generator
│   ├── archive-compiler.js       # Archive storyline/event compiler
│   ├── test-archive-authority.js
│   ├── test-layout-router.js
│   ├── test-swipe-navigation.js
│   └── validate-archive.js
│
├── resources/
│   ├── images/                  # Event images (subfolders per event key)
│   ├── papers/                  # Local paper PDFs used by source cards
│   └── videos/                  # YouTube metadata JSON (one file per event)
│
├── .github/workflows/           # Quality, deployment, and Pages workflows
│
├── DEPLOYMENT.md                # Deployment guide (Nginx / GitHub Pages / Gitee)
└── README.md                    # This file
```

---

## Features

- **3D globe**: Three.js rendering, auto-locates to the geographic coordinates of the current event
- **Bilingual UI**: Switch between Chinese and English at any time; the choice persists across sessions
- **Page navigation**: Buttons or keyboard arrows (`←` / `→`)
- **Storyline selector**: Dialog-based selector for the unified history map, deep-learning history, AI100, gaming AI, and the humanistic cycle
- **AI100 achievement map**: Region filtering, source cards, paper-style demos, and grounded quizzes
- **Gaming AI branch**: Horizontal timeline with game-record/evolution modules and branch-specific source cards
- **Humanistic cycle**: Cultural counter-timeline connecting science fiction, hype, AI winters, ethics, and risk debates
- **Dual-screen auto paging**: `dual-screen.html` supports "Start/Stop auto play" — off by default; once enabled, pages cycle every 10 seconds
- **Video playback**: Embedded YouTube videos plus local commentary videos
- **SGF/game evolution playback**: Optional generated board-state clips with GIF fallback
- **Image viewer**: Click to enter fullscreen, navigate with `←` / `→` / `Esc`
- **Responsive**: Adapts to large screens (4K/2K/1080p) and mobile devices

---

## Tech Stack

- **Pure frontend**: HTML5 + CSS3 + JavaScript ES6+, no build tool and no runtime npm dependencies on the frontend
- **Three.js** (loaded via CDN): 3D globe rendering
- **Node.js**: compiles Archive JSON with `scripts/generate-archive-data.js` and runs local management/validation tooling
- **Python** (optional): used by `scripts/sgf_to_video.py` to generate game-evolution clips

---

## License

Apache License 2.0
