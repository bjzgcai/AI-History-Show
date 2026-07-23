#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const ARCHIVE_DIR = path.join(ROOT, 'archive');
const STORYLINES_DIR = path.join(ARCHIVE_DIR, 'storylines');
const EVENTS_DIR = path.join(ARCHIVE_DIR, 'events');
const OUTPUT_DIR = path.join(ROOT, 'reports', 'svg-explainer-review');

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function listJsonFiles(directory) {
    return fs
        .readdirSync(directory, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map((entry) => path.join(directory, entry.name))
        .sort();
}

function localized(value, locale) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    return String(value[locale] || value.en || value.zh || '');
}

function stripMarkup(value) {
    return String(value || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&[a-z]+;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractSvgText(svg) {
    return Array.from(svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/gi), (match) =>
        stripMarkup(match[1].replace(/<tspan\b[^>]*>([\s\S]*?)<\/tspan>/gi, '$1'))
    ).filter(Boolean);
}

function loadEventBundle(eventId) {
    const eventDir = path.join(EVENTS_DIR, eventId);
    return {
        event: readJson(path.join(eventDir, 'event.json')),
        assets: readJson(path.join(eventDir, 'assets.json')),
        sources: readJson(path.join(eventDir, 'sources.json')),
        eventDir
    };
}

function isExplainerAsset(asset) {
    if (!asset || asset.type !== 'svg') return false;
    return (
        /(?:architecture|algorithm)-explainer/i.test(String(asset.role || '')) ||
        /\/explainers\//i.test(String(asset.path || ''))
    );
}

function buildInventory() {
    const byPath = new Map();
    const storylineFiles = listJsonFiles(STORYLINES_DIR);

    for (const storylineFile of storylineFiles) {
        const storyline = readJson(storylineFile);
        for (const ref of storyline.events || []) {
            if (ref.enabled === false) continue;
            const bundle = loadEventBundle(ref.eventId);
            const variantFile = path.join(bundle.eventDir, 'variants', `${ref.variant}.json`);
            const variant = readJson(variantFile);
            const assetMap = new Map(bundle.assets.map((asset) => [asset.id, asset]));
            const sourceMap = new Map(bundle.sources.map((source) => [source.id, source]));

            for (const assetId of variant.assetIds || []) {
                const asset = assetMap.get(assetId);
                if (!isExplainerAsset(asset)) continue;

                const relativePath = String(asset.path || '');
                const absolutePath = path.join(ROOT, relativePath);
                let entry = byPath.get(relativePath);
                if (!entry) {
                    const exists = fs.existsSync(absolutePath);
                    const svg = exists ? fs.readFileSync(absolutePath, 'utf8') : '';
                    entry = {
                        path: relativePath,
                        exists,
                        assetIds: [],
                        roles: [],
                        captions: { zh: [], en: [] },
                        subcaptions: { zh: [], en: [] },
                        rightsStatuses: [],
                        sourceIds: [],
                        sources: [],
                        variantSourceIds: [],
                        variantSources: [],
                        usages: [],
                        svgText: extractSvgText(svg),
                        svgBytes: Buffer.byteLength(svg),
                        hasViewBox: /<svg\b[^>]*\bviewBox=/i.test(svg),
                        hasTitle: /<title\b/i.test(svg),
                        hasDesc: /<desc\b/i.test(svg),
                        hasScript: /<script\b/i.test(svg),
                        sourceTraceable: false
                    };
                    byPath.set(relativePath, entry);
                }

                const sourceIds = [asset.sourceId, ...(asset.sourceIds || [])].filter(Boolean);
                const resolvedSources = sourceIds.map((sourceId) => sourceMap.get(sourceId)).filter(Boolean);
                const variantSourceIds = (variant.sourceIds || []).filter(Boolean);
                const variantResolvedSources = variantSourceIds
                    .map((sourceId) => sourceMap.get(sourceId))
                    .filter(Boolean);
                entry.assetIds.push(asset.id);
                entry.roles.push(asset.role || '');
                entry.captions.zh.push(localized(asset.caption, 'zh'));
                entry.captions.en.push(localized(asset.caption, 'en'));
                entry.subcaptions.zh.push(localized(asset.subcaption, 'zh'));
                entry.subcaptions.en.push(localized(asset.subcaption, 'en'));
                entry.rightsStatuses.push((asset.rights && asset.rights.status) || '');
                entry.sourceIds.push(...sourceIds);
                entry.sources.push(
                    ...resolvedSources.map((source) => ({
                        id: source.id,
                        type: source.type || '',
                        reliability: source.reliability || '',
                        title: {
                            zh: localized(source.title, 'zh'),
                            en: localized(source.title, 'en')
                        },
                        url: source.url || source.doi || source.archiveUrl || ''
                    }))
                );
                entry.variantSourceIds.push(...variantSourceIds);
                entry.variantSources.push(
                    ...variantResolvedSources.map((source) => ({
                        id: source.id,
                        type: source.type || '',
                        reliability: source.reliability || '',
                        title: {
                            zh: localized(source.title, 'zh'),
                            en: localized(source.title, 'en')
                        },
                        url: source.url || source.doi || source.archiveUrl || ''
                    }))
                );
                entry.usages.push({
                    storylineId: storyline.id,
                    storylineTitle: {
                        zh: localized(storyline.title, 'zh'),
                        en: localized(storyline.title, 'en')
                    },
                    eventId: ref.eventId,
                    eventTitle: {
                        zh: localized(variant.displayTitle || bundle.event.title, 'zh'),
                        en: localized(variant.displayTitle || bundle.event.title, 'en')
                    },
                    variant: ref.variant,
                    variantFile: path.relative(ROOT, variantFile),
                    visual: variant.visual || '',
                    demoImage:
                        variant.achievement && typeof variant.achievement === 'object'
                            ? variant.achievement.demoImage || ''
                            : '',
                    description: {
                        zh: stripMarkup(localized(variant.displayDescription || bundle.event.description, 'zh')),
                        en: stripMarkup(localized(variant.displayDescription || bundle.event.description, 'en'))
                    },
                    method: {
                        zh: localized(variant.achievement && variant.achievement.method, 'zh'),
                        en: localized(variant.achievement && variant.achievement.method, 'en')
                    },
                    artifact: {
                        zh: localized(variant.achievement && variant.achievement.artifact, 'zh'),
                        en: localized(variant.achievement && variant.achievement.artifact, 'en')
                    }
                });
                entry.sourceTraceable = entry.sourceTraceable || resolvedSources.length > 0;
            }
        }
    }

    return Array.from(byPath.values())
        .map((entry) => ({
            ...entry,
            assetIds: [...new Set(entry.assetIds)].sort(),
            roles: [...new Set(entry.roles)].filter(Boolean).sort(),
            captions: {
                zh: [...new Set(entry.captions.zh)].filter(Boolean),
                en: [...new Set(entry.captions.en)].filter(Boolean)
            },
            subcaptions: {
                zh: [...new Set(entry.subcaptions.zh)].filter(Boolean),
                en: [...new Set(entry.subcaptions.en)].filter(Boolean)
            },
            rightsStatuses: [...new Set(entry.rightsStatuses)].filter(Boolean).sort(),
            sourceIds: [...new Set(entry.sourceIds)].sort(),
            sources: Array.from(new Map(entry.sources.map((source) => [source.id, source])).values()),
            variantSourceIds: [...new Set(entry.variantSourceIds)].sort(),
            variantSources: Array.from(new Map(entry.variantSources.map((source) => [source.id, source])).values()),
            usages: Array.from(
                new Map(
                    entry.usages.map((usage) => [`${usage.storylineId}:${usage.eventId}:${usage.variant}`, usage])
                ).values()
            )
        }))
        .sort((a, b) => a.path.localeCompare(b.path));
}

function buildReviewHtml(entries) {
    const serialized = JSON.stringify(entries).replace(/</g, '\\u003c');
    const svgSources = JSON.stringify(
        entries.map((entry) => fs.readFileSync(path.join(ROOT, entry.path), 'utf8'))
    ).replace(/</g, '\\u003c');
    return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>SVG Explainer Review</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font: 14px/1.45 Arial, sans-serif; background: #eef1f5; color: #172033; }
    header { position: sticky; top: 0; z-index: 3; padding: 14px 20px; background: #fff; border-bottom: 1px solid #cbd3df; }
    h1 { margin: 0 0 4px; font-size: 20px; }
    #summary { color: #526176; }
    #measurement { position: absolute; left: -20000px; top: 0; width: 1400px; opacity: 0; pointer-events: none; }
    #measurement svg { display: block; width: auto; height: auto; }
    main { display: grid; grid-template-columns: repeat(auto-fill, minmax(440px, 1fr)); gap: 14px; padding: 16px; }
    article { min-width: 0; background: #fff; border: 1px solid #cbd3df; border-radius: 6px; overflow: hidden; }
    .media { aspect-ratio: 5 / 3; background: #101827; display: grid; place-items: center; }
    object { width: 100%; height: 100%; }
    .meta { padding: 12px 14px 14px; }
    h2 { margin: 0 0 5px; font-size: 15px; overflow-wrap: anywhere; }
    p { margin: 4px 0; }
    .muted { color: #64748b; }
    .issues { color: #9f1239; white-space: pre-wrap; }
    .ok { color: #166534; }
  </style>
</head>
<body>
  <header><h1>SVG 解释图审阅</h1><div id="summary">加载中...</div></header>
  <main id="grid"></main><div id="measurement" aria-hidden="true"></div>
  <script>
    const entries = ${serialized};
    const svgSources = ${svgSources};
    const results = [];
    const grid = document.querySelector('#grid');
    document.querySelector('#summary').textContent = entries.length + ' 张已被启用事件使用的 SVG 解释图';

    function overlap(a, b) {
      const left = Math.max(a.x, b.x);
      const top = Math.max(a.y, b.y);
      const right = Math.min(a.x + a.width, b.x + b.width);
      const bottom = Math.min(a.y + a.height, b.y + b.height);
      return { width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
    }

    function boxInRoot(node, svg) {
      const box = node.getBBox();
      const nodeMatrix = node.getCTM();
      const rootMatrix = svg.getCTM();
      if (!nodeMatrix || !rootMatrix) return box;
      const matrix = rootMatrix.inverse().multiply(nodeMatrix);
      const points = [
        new DOMPoint(box.x, box.y),
        new DOMPoint(box.x + box.width, box.y),
        new DOMPoint(box.x, box.y + box.height),
        new DOMPoint(box.x + box.width, box.y + box.height)
      ].map((point) => point.matrixTransform(matrix));
      const xs = points.map((point) => point.x);
      const ys = points.map((point) => point.y);
      return {
        x: Math.min(...xs),
        y: Math.min(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys)
      };
    }

    function inspectSvg(svg) {
      if (!svg || svg.localName !== 'svg') return [{ type: 'load', detail: 'SVG document unavailable' }];
      const issues = [];
      const viewBox = svg.viewBox && svg.viewBox.baseVal;
      const texts = Array.from(svg.querySelectorAll('text')).map((node, index) => {
        try { return { node, index, box: boxInRoot(node, svg), text: (node.textContent || '').trim() }; }
        catch { return null; }
      }).filter(Boolean);

      for (const item of texts) {
        const box = item.box;
        if (viewBox && (box.x < viewBox.x - 0.5 || box.y < viewBox.y - 0.5 || box.x + box.width > viewBox.x + viewBox.width + 0.5 || box.y + box.height > viewBox.y + viewBox.height + 0.5)) {
          issues.push({ type: 'text-outside-viewbox', text: item.text, box });
        }
      }

      for (let first = 0; first < texts.length; first += 1) {
        for (let second = first + 1; second < texts.length; second += 1) {
          const hit = overlap(texts[first].box, texts[second].box);
          if (hit.width > 1 && hit.height > 1) {
            issues.push({ type: 'text-text-overlap', first: texts[first].text, second: texts[second].text, overlap: hit });
          }
        }
      }

      const shapes = Array.from(svg.querySelectorAll('rect, circle, ellipse, polygon, image')).map((node, index) => {
        try { return { node, index, box: boxInRoot(node, svg) }; }
        catch { return null; }
      }).filter(Boolean);
      for (const text of texts) {
        const textArea = Math.max(1, text.box.width * text.box.height);
        for (const shape of shapes) {
          const shapeArea = Math.max(1, shape.box.width * shape.box.height);
          const hit = overlap(text.box, shape.box);
          const hitArea = hit.width * hit.height;
          if (hitArea < textArea * 0.12) continue;
          const containsText = shape.box.x <= text.box.x && shape.box.y <= text.box.y && shape.box.x + shape.box.width >= text.box.x + text.box.width && shape.box.y + shape.box.height >= text.box.y + text.box.height;
          const likelyBackground = shapeArea > (viewBox ? viewBox.width * viewBox.height * 0.35 : textArea * 30);
          if (!containsText && !likelyBackground) {
            issues.push({ type: 'partial-text-shape-overlap', text: text.text, shape: shape.node.localName, textBox: text.box, shapeBox: shape.box, overlap: hit });
          }
        }
      }
      return issues;
    }

    for (const [index, entry] of entries.entries()) {
      const article = document.createElement('article');
      const eventNames = [...new Set(entry.usages.map((usage) => usage.eventId))].join(', ');
      article.innerHTML = '<div class="media"><object type="image/svg+xml" data="../../' + entry.path + '"></object></div>' +
        '<div class="meta"><h2>' + (index + 1) + '. ' + entry.path.split('/').pop() + '</h2>' +
        '<p>' + eventNames + '</p><p class="muted">' + entry.sourceIds.join(', ') + '</p><p class="issues">等待检测</p></div>';
      grid.appendChild(article);
    }

    function runAudit() {
      const measurement = document.querySelector('#measurement');
      for (const [index, entry] of entries.entries()) {
        const article = grid.children[index];
        let issues;
        try {
          const parsed = new DOMParser().parseFromString(svgSources[index], 'image/svg+xml');
          const svg = document.importNode(parsed.documentElement, true);
          measurement.appendChild(svg);
          issues = inspectSvg(svg);
          svg.remove();
        } catch (error) {
          issues = [{ type: 'load', detail: error.message }];
        }
        results[index] = { path: entry.path, issues };
        const issueNode = article.querySelector('.issues');
        issueNode.className = issues.length ? 'issues' : 'ok';
        issueNode.textContent = issues.length ? issues.map((issue) => issue.type + ': ' + (issue.text || issue.first || issue.detail || '')).join('\\n') : '未发现几何异常';
      }
      const payload = document.createElement('script');
      payload.id = 'svg-audit-results';
      payload.type = 'application/json';
      payload.textContent = JSON.stringify(results);
      document.body.appendChild(payload);
      document.documentElement.dataset.auditComplete = 'true';
      document.querySelector('#summary').textContent = entries.length + ' 张 SVG；自动检测到 ' + results.filter((result) => result.issues.length).length + ' 张存在候选几何问题';
    }
    runAudit();
  </script>
</body>
</html>`;
}

function buildTraceabilityReport(entries) {
    const missingFiles = entries.filter((entry) => !entry.exists);
    const missingSources = entries.filter((entry) => !entry.sourceTraceable);
    const missingViewBox = entries.filter((entry) => !entry.hasViewBox);
    const unsafeScripts = entries.filter((entry) => entry.hasScript);
    const assetPrimaryGrounded = entries.filter((entry) =>
        entry.sources.some((source) => source.reliability === 'primary')
    );
    const eventPrimaryGrounded = entries.filter((entry) =>
        [...entry.sources, ...entry.variantSources].some((source) => source.reliability === 'primary')
    );

    const lines = [
        '# SVG Explainer Traceability Audit',
        '',
        `- Enabled-event SVG explainers: ${entries.length}`,
        `- Files present: ${entries.length - missingFiles.length}/${entries.length}`,
        `- Resolved Archive source: ${entries.length - missingSources.length}/${entries.length}`,
        `- Asset-level primary-source grounding: ${assetPrimaryGrounded.length}/${entries.length}`,
        `- Event-level primary-source grounding: ${eventPrimaryGrounded.length}/${entries.length}`,
        `- SVGs with viewBox: ${entries.length - missingViewBox.length}/${entries.length}`,
        `- SVGs containing script: ${unsafeScripts.length}`,
        '',
        '## Exceptions',
        ''
    ];

    const exceptionGroups = [
        ['Missing files', missingFiles],
        ['Missing resolved sources', missingSources],
        ['Missing viewBox', missingViewBox],
        ['Contains script', unsafeScripts]
    ];
    for (const [label, group] of exceptionGroups) {
        lines.push(`### ${label}`, '');
        if (!group.length) lines.push('- None', '');
        else lines.push(...group.map((entry) => `- \`${entry.path}\``), '');
    }

    lines.push('## Inventory', '');
    for (const entry of entries) {
        const events = [...new Set(entry.usages.map((usage) => usage.eventId))].join(', ');
        const sourceSummary = entry.sources
            .map((source) => `${source.id} (${source.reliability || 'unclassified'})`)
            .join(', ');
        const variantSourceSummary = entry.variantSources
            .map((source) => `${source.id} (${source.reliability || 'unclassified'})`)
            .join(', ');
        lines.push(
            `### ${path.basename(entry.path)}`,
            '',
            `- Asset: \`${entry.path}\``,
            `- Events: ${events}`,
            `- Roles: ${entry.roles.join(', ') || 'none'}`,
            `- Sources: ${sourceSummary || 'none'}`,
            `- Variant sources: ${variantSourceSummary || 'none'}`,
            `- Rights: ${entry.rightsStatuses.join(', ') || 'unspecified'}`,
            `- Embedded text: ${entry.svgText.join(' | ') || 'none'}`,
            ''
        );
    }
    return lines.join('\n');
}

function main() {
    const entries = buildInventory();
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'inventory.json'), `${JSON.stringify(entries, null, 2)}\n`);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'traceability.md'), `${buildTraceabilityReport(entries)}\n`);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'review.html'), buildReviewHtml(entries));
    console.log(`SVG explainer inventory: ${entries.length}`);
    console.log(`Review output: ${path.relative(ROOT, OUTPUT_DIR)}`);
}

if (require.main === module) main();

module.exports = { buildInventory, buildReviewHtml, buildTraceabilityReport };
