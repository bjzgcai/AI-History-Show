# AI History Exhibition

**English** | [简体中文](README.zh.md)

An interactive frontend application designed for exhibition-hall large-screen displays, showcasing key milestones in the history of artificial intelligence. Supports both Chinese and English (with an in-page language switch), and adapts automatically between single-screen, mobile, and dual-screen layouts.

## Repositories

- Gitee: `ssh://git@z.gitee.cn:223/zgca/AI-History-Show.git`
- GitHub: `git@github.com:bjzgcai/AI-History-Show.git`

## Quick Start

```bash
# Preview the exhibition page locally
python3 -m http.server 8000
# Open http://localhost:8000

# Verify the single/dual-screen adaptive router
node scripts/test-layout-router.js

# Verify the touch-swipe paging rules
node scripts/test-swipe-navigation.js

# Run the full quality gate (lint + format check + tests)
npm install
npm run quality

# Run the content management server locally
node manage/server.js
# Open http://localhost:3001/admin
```

> **Security notice**: The management service (port 3001) has no authentication and is intended for **local use only**. **Never expose it directly to the public internet.** For production, access it through an SSH tunnel or behind Nginx Basic Auth — see [DEPLOYMENT.md](DEPLOYMENT.md) for details.

Cloud deployment (Nginx + PM2), static hosting, and SSH-tunnel access to the admin console are all covered in [DEPLOYMENT.md](DEPLOYMENT.md).

## Internationalization (i18n)

The exhibition ships with built-in Chinese/English support:

- Language dictionary and runtime switching: [shared/i18n.js](shared/i18n.js)
- Default locale is Chinese; the active locale is persisted in `localStorage` under the key `ai-history-locale`
- A language toggle button is rendered in both single- and dual-screen layouts
- Milestone content fields (titles, descriptions, quotes, etc.) support a bilingual object form `{ zh: "...", en: "..." }`; missing locales fall back gracefully

When authoring content, you can mix plain strings (treated as Chinese) and bilingual objects in the same event. The build step in `manage/generate.js` normalizes both forms into the final `milestones-data.js`.

## Quality Gate

Before opening a Pull Request or merging changes, please run:

```bash
npm install
npm run quality
```

The quality gate runs ESLint, Prettier format checks, and the existing Node.js verification scripts in sequence. GitHub Actions runs the same command on push and pull request.

Modules that should be prioritized for additional test coverage:

- `manage/generate.js`: generated milestone data structure, quote selection, video lookup, missing-asset warnings.
- `shared/milestone-view.js`: multilingual rendering fallbacks and media metadata normalization.
- `manage/server.js`: `/api/generate/diff`, `/api/events`, and image/video metadata normalization.

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

### Option A: Visual admin page (recommended)

```bash
node manage/server.js
# Open http://localhost:3001/admin
```

Edit categories and event content directly in the browser, click **Save**, then click **▶ Apply data**. The admin UI preserves bilingual fields and writes them back into `manage/events.js`.

### Option B: Edit files directly + CLI

> Edit config files → run the script → refresh the browser

```
manage/catalog.js   ─┐
                      ├─→  node manage/generate.js  ─→  milestones-data.js
manage/events.js    ─┘
resources/videos/   ─┘
```

```bash
node manage/generate.js
```

No dependencies need to be installed — run it directly. If the script fails (or has not yet been run), the page automatically falls back to `milestones-data-default.js`. Example output:

```
✓ Generated: milestones-data.js
  5 categories, 21 events total
```

### Content assistance checks

Rule-based image metadata assistance is centralized in `resources/content-assistance.js`.
Generated suggestions stay in `imageMetaSuggestions` until an editor approves them into
`imageMeta` from the admin UI. Check deterministic behavior with:

```bash
node scripts/test-content-assistance.js
```

Related artifacts:

- `docs/content-assistance.md` documents the review flow and output schema.
- `resources/evaluations/content-assistance-eval.json` seeds future generation evals.
- `resources/prompts/image-metadata-assistance.md` defines the future LLM prompt contract.

---

### File A: `manage/catalog.js` — display catalog

Controls **which categories and events are shown, and in what order**.

```javascript
module.exports = {
  categories: [
    {
      // Both `name` and `subtitle` are bilingual objects.
      name: {
        en: "Genesis of AI (1950s-1970s)",   // Full category name
        zh: "AI创世纪 (1950s-1970s)"
      },
      subtitle: {
        en: "Genesis of AI",                  // Short title shown on the page
        zh: "AI创世纪"
      },
      events: [
        "1956-dartmouth",                     // Event key — must exist in events.js
        "1957-perceptron",
        "1969-ai-winter"
      ]
    },
    // ... more categories
  ]
};
```

**Current categories (4 categories, 21 events):**

| Category | Events | Timespan |
|----------|--------|----------|
| Genesis of AI | 3 | 1950s–1970s |
| Neural Networks and Connectionism | 4 | 1980s–2000s |
| Deep Learning and Unified Paradigms | 7 | 2010s–2020s |
| Large Models and Scientific Intelligence | 7 | 2018–2025 |

---

### File B: `manage/events.js` — event content

Each event key corresponds to a complete content object. Text fields accept either a plain string (treated as Chinese) or a bilingual object `{ zh, en }`:

```javascript
module.exports = {
  "1956-dartmouth": {
    year: 1956,
    title: { zh: "达特茅斯会议", en: "Dartmouth Workshop" },

    location: {
      name: { zh: "达特茅斯学院", en: "Dartmouth College" },
      country: { zh: "美国，新罕布什尔州", en: "Hanover, New Hampshire, USA" },
      coordinates: [43.7044, -72.2887]   // [latitude, longitude]
    },

    description: { zh: `中文详细描述，支持 HTML。`, en: `English description, HTML allowed.` },

    figures: [
      { name: "John McCarthy", role: { zh: "会议发起人", en: "Workshop organizer" } },
      { name: "Marvin Minsky", role: { zh: "联合发起人", en: "Co-organizer" } }
    ],

    commentaryVideo: "URL of the commentary video (.mp4)",

    quoteText: { zh: "引言正文\n支持换行", en: "Quote text\nNewlines become <br>" },
    quotePage: "— Citation source",

    images: [
      "resources/images/1956-dartmouth/photo1.jpg",
    ],

    videos: ["dQw4w9WgXcQ"],   // YouTube video ID — must have matching JSON in resources/videos/
  },

  // ... more events
};
```

**Field reference:**

| Field | Type | Description |
|-------|------|-------------|
| `year` | number | Year |
| `title` | string \| `{zh, en}` | Event title |
| `location` | object | Place name, country, latitude/longitude coordinates |
| `description` | string \| `{zh, en}` | Detailed description; HTML allowed |
| `figures` | array | Key figures `[{name, role}]` |
| `commentaryVideo` | string | Commentary video URL (.mp4) |
| `quoteText` | string \| `{zh, en}` | Quote text; `\n` becomes `<br>` automatically |
| `quotePage` | string | Quote source / attribution |
| `images` | array | List of relative image paths |
| `videos` | array | List of YouTube video IDs (matching JSON metadata required) |

---

### Figure avatars: `manage/figure-avatars.js`

A canonical registry of portraits used in chapter data. Each entry maps a figure's name to a local avatar image and optional metadata:

```javascript
"Alec Radford": {
  type: "person",
  status: "ready",
  wikipediaTitle: "",
  avatar: "resources/images/figures/alec-radford.png",
  note: "Source notes for future maintenance."
}
```

`manage/generate.js` consults this registry to fill in avatars across events. To audit which figures are missing portraits or notes, run:

```bash
node scripts/report-figure-avatars.js
# Output: manage/figure-avatar-report.md
```

---

### Video metadata: `resources/videos/{key}.json`

YouTube video metadata for each event is stored in its own file. Format:

```json
{
  "candidate_videos": [
    {
      "id": "dQw4w9WgXcQ",
      "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "embed_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "title": "Video title",
      "channel": "Channel name",
      "duration": "10:23",
      "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      "source": "YouTube"
    }
  ]
}
```

The generator looks up each video ID listed in `events.js` and writes the matched metadata into the output.

---

## File Structure

```
AI-History-Show/
├── index.html                   # Adaptive entry (Three.js globe + milestone view)
├── dual-screen.html             # Fixed dual-screen entry
│
├── milestones-data.js           # ⚠️ Auto-generated; do not hand-edit (output of generate.js)
├── milestones-data-default.js   # Default fallback data (used when generate.js fails)
│
├── manage/                      # Content management directory
│   ├── catalog.js               # File A: category and event catalog
│   ├── events.js                # File B: per-event content
│   ├── figure-avatars.js        # Canonical figure-avatar registry
│   ├── generate.js              # Generator script (no dependencies)
│   ├── server.js                # Visual admin server (node manage/server.js)
│   └── admin.html               # Admin page (served by server.js)
│
├── shared/                      # Shared frontend logic across single/dual screen
│   ├── i18n.js                  # Bilingual dictionary and runtime locale switching
│   ├── milestone-view.js        # Milestone rendering
│   ├── layout-router.js         # Adaptive single/dual-screen routing
│   ├── swipe-navigation.js      # Touch swipe paging
│   └── utils.js
│
├── scripts/                     # Local verification and reporting scripts
│   ├── test-layout-router.js
│   ├── test-swipe-navigation.js
│   └── report-figure-avatars.js
│
├── resources/
│   ├── images/                  # Event images (subfolders per event key)
│   └── videos/                  # YouTube metadata JSON (one file per event)
│
├── DEPLOYMENT.md                # Deployment guide (Nginx / Gitee Pages)
└── README.md                    # This file
```

---

## Features

- **3D globe**: Three.js rendering, auto-locates to the geographic coordinates of the current event
- **Bilingual UI**: Switch between Chinese and English at any time; the choice persists across sessions
- **Page navigation**: Buttons or keyboard arrows (`←` / `→`)
- **Dual-screen auto paging**: `dual-screen.html` supports "Start/Stop auto play" — off by default; once enabled, pages cycle every 10 seconds
- **Video playback**: Embedded YouTube videos plus local commentary videos
- **Image viewer**: Click to enter fullscreen, navigate with `←` / `→` / `Esc`
- **Responsive**: Adapts to large screens (4K/2K/1080p) and mobile devices

---

## Tech Stack

- **Pure frontend**: HTML5 + CSS3 + JavaScript ES6+, no build tool and no runtime npm dependencies on the frontend
- **Three.js** (loaded via CDN): 3D globe rendering
- **Node.js** (used only for content generation): runs `manage/generate.js`

---

## License

Apache License 2.0
