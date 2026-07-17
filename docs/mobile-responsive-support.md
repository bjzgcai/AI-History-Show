# Mobile Responsive Support

This document records the mobile support scope for the audience-facing AI History Show site. It does not cover full mobile adaptation for the management backend, which remains desktop-first.

## Supported Viewports

The responsive rules are organized around these practical ranges:

| Range | Target devices | Layout intent |
| --- | --- | --- |
| `<= 600px` | Phone portrait, including 375px, 390px, and 430px widths | Single-column reading flow, compact typography, touch-first controls |
| `601px - 899px` | Small tablets and large phones | Stacked or lightly expanded content, no fixed desktop panels |
| `900px - 1199px` | Tablet portrait and tablet landscape | Tablet-friendly two-column or stacked layouts depending on content density |
| `>= 1200px` | Desktop and presentation displays | Preserve the original large-screen immersive layout |

Validation should include at least:

- 375px phone portrait
- 390px / 430px common iPhone portrait
- 768px tablet portrait
- 1024px tablet landscape
- 1200px+ desktop / presentation mode

## Phase 1: Audit And Breakpoint Foundation

Completed:

- Added shared mobile tokens for page padding, card radius, and `--touch-target: 44px`.
- Added responsive breakpoints for phone, tablet, and desktop/presentation behavior.
- Switched mobile-height handling to dynamic viewport units so browser chrome changes do not trap content.
- Reduced global mobile overflow risk with mobile stacking rules and `min-width: 0` / wrapping constraints across detail text, sources, captions, and buttons.
- Confirmed the homepage and UI browser can open at phone and tablet widths without requiring horizontal scrolling.

Initial mobile issues addressed:

- Large-screen fixed panels compressed or overlapped on narrow screens.
- Map and event cards had too much vertical gap on phones.
- Detail pages opened mid-page instead of at the beginning.
- Some scroll gestures were intercepted by custom navigation logic.
- Source labels, URLs, DOI-like strings, and long Chinese titles could become hard to read on narrow screens.

## Phase 2: Main Display Responsive Work

Completed:

- Three.js globe rendering uses a mobile pixel-ratio cap through `MOBILE_GLOBE_PIXEL_RATIO_CAP`.
- Resize and `orientationchange` events refresh the globe and responsive layout.
- Mobile UI browser leaves fixed desktop positioning and uses normal document flow.
- Main map/list flow supports branch selection, event selection, grouped location selection, language switching, and detail entry on touch devices.
- Horizontal rails and timelines keep `touch-action: pan-x pan-y` so vertical page scrolling remains available.
- Detail entry now pushes browser history, so native mobile browser back gestures return to the map/list page like a normal website.
- Desktop and presentation behavior is protected by existing layout-router tests.

Manual check:

1. Start the static server with `npm run start:static`.
2. Open the site on a phone or device emulator.
3. Switch storylines, select an event, open detail, use the browser back gesture, and confirm the map/list page returns.
4. Confirm the same flow still works at desktop width.

## Phase 3: Detail, Achievement, And Quiz Work

Completed:

- Event detail pages collapse to a single-column reading flow on phones.
- AI100 top visual modules stack on narrow screens.
- AI100 paper-demo / visual-demo sections stack into a readable vertical flow.
- Commentary sections, sources, visual modules, and quiz material/challenge areas use mobile stacking rules.
- Phone detail typography was compacted while retaining hierarchy.
- People/author rows stay in normal flow before the main image.
- Detail images use contained fitting so the first large portrait no longer covers the people area.
- Image pager dots are smaller on phones.
- Sources render as compact readable cards with a type tag and wrapping label text.
- `背景解读` is visually larger than subsection labels such as `历史背景`, `核心思想`, and `长期影响`.
- Long titles, source labels, and URL-like strings use wrapping rules to avoid horizontal overflow.

Manual check:

1. Open an AI100 event such as the 1943 McCulloch-Pitts event.
2. Verify the page starts at the top.
3. Scroll through the main image, title, description, `资料来源`, `评论与媒体`, `关键概念`, `引言摘要`, and `背景解读`.
4. Confirm quiz options and source cards are readable and tappable.
5. Repeat in Chinese and English.

## Phase 4: Performance And Automated Validation

Completed:

- Mobile globe pixel ratio is capped to reduce rendering cost.
- Resize and orientation changes update the renderer and layout.
- Mobile detail pages avoid nested vertical scroll traps and use native momentum scrolling.
- Custom portrait edge navigation is suspended while reading event details so Safari can scroll naturally.
- Added `scripts/test-mobile-responsive.js` as a repeatable mobile smoke test.
- Included the mobile smoke test in `npm test`.
- CI quality gate runs lint, Prettier format checks, and all tests through `npm run quality`.

Recommended validation commands:

```bash
npm run quality
npm run validate:startup
```

For changes that affect generated data, deployment, startup, Docker, or server behavior, run:

```bash
npm run validate:deployment
```

For AI100 content changes, also run:

```bash
npm run validate:ai100-context
npm run validate:ai100-quizzes
npm run audit:ai100-accuracy
```

## Current Acceptance Checklist

- Phone portrait at 375px has no intended horizontal scrolling.
- Phone portrait at 390px / 430px can switch branch, select event, and open detail.
- Tablet portrait at 768px has non-overlapping main and detail layouts.
- Tablet landscape at 1024px stays close to desktop without fixed-panel compression.
- Desktop and presentation layout remain covered by layout-router checks.
- Three.js globe remains visible and responds to resize/orientation changes.
- Touch targets use at least the shared 44px target where controls are compact.
- Event details, captions, sources, quote text, commentary sections, and quiz options wrap instead of overflowing.
- AI100 achievement visual modules and bottom demos stack cleanly on phones.
- Browser back gestures work after entering detail pages.
- `npm run quality` passes before pushing.
