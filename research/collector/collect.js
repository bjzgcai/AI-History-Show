#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');
const { URL } = require('node:url');

const config = require('./config.js');

function getArg(name, fallback = null) {
    const prefix = `${name}=`;
    const match = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
    return match ? match.slice(prefix.length) : fallback;
}

function hasFlag(name) {
    return process.argv.includes(name);
}

function localized(value, lang = 'en') {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value[lang] || value.en || value.zh || '';
}

function localizedType(value) {
    return localized(value, 'en') || 'source';
}

function safeFilename(value) {
    return String(value)
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 96);
}

function extensionFromContentType(contentType) {
    const normalized = String(contentType || '')
        .split(';')[0]
        .trim()
        .toLowerCase();
    if (normalized === 'image/jpeg') return '.jpg';
    if (normalized === 'image/png') return '.png';
    if (normalized === 'image/webp') return '.webp';
    if (normalized === 'image/gif') return '.gif';
    if (normalized === 'image/svg+xml') return '.svg';
    return '';
}

function extensionFromUrl(url) {
    const pathname = new URL(url).pathname.toLowerCase();
    const match = pathname.match(/\.(jpe?g|png|webp|gif|svg)$/);
    return match ? `.${match[1].replace('jpeg', 'jpg')}` : '';
}

function toArray(value) {
    return Array.isArray(value) ? value : [];
}

function uniqBy(items, keyFn) {
    const seen = new Set();
    return items.filter((item) => {
        const key = keyFn(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function readEvents() {
    const events = require(path.join(config.rootDir, 'manage', 'events.js'));
    const catalog = require(path.join(config.rootDir, 'manage', 'catalog.js'));
    const orderedKeys = catalog.categories.flatMap((category) => category.events);
    const knownKeys = Object.keys(events);
    const sortedKeys = [
        ...orderedKeys.filter((key) => events[key]),
        ...knownKeys.filter((key) => !orderedKeys.includes(key)).sort()
    ];
    return { events, sortedKeys };
}

function extractExistingSources(event) {
    const sources = [];
    for (const source of toArray(event.sources)) {
        sources.push({
            type: localizedType(source.type || 'event-source'),
            label: localized(source.label) || localized(source.title) || source.url,
            url: source.url,
            usage: localized(source.usage) || localized(source.action) || ''
        });
    }
    for (const source of toArray(event.achievement && event.achievement.sources)) {
        sources.push({
            type: localizedType(source.type || 'achievement-source'),
            label: localized(source.label) || localized(source.title) || source.url,
            url: source.url,
            usage: localized(source.usage) || localized(source.action) || ''
        });
    }
    for (const module of toArray(event.achievement && event.achievement.visualModules)) {
        if (module.url) {
            sources.push({
                type: localizedType(module.type || 'visual-module'),
                label: localized(module.title) || localized(module.site) || module.url,
                url: module.url,
                usage: localized(module.usage) || localized(module.description) || ''
            });
        }
    }
    for (const [imagePath, meta] of Object.entries(event.imageMeta || {})) {
        if (meta.sourceUrl) {
            sources.push({
                type: 'image-source',
                label: localized(meta.sourceName) || localized(meta.source) || localized(meta.caption) || imagePath,
                url: meta.sourceUrl,
                usage: localized(meta.usage) || localized(meta.license) || ''
            });
        }
    }
    for (const video of toArray(event.videos)) {
        if (typeof video === 'string') {
            sources.push({
                type: 'video',
                label: 'Existing event video',
                url: video,
                usage: 'Already referenced by event data.'
            });
        } else if (video && video.id) {
            sources.push({
                type: 'video',
                label: video.title || video.id,
                url: `https://www.youtube.com/watch?v=${video.id}`,
                usage: video.channel || ''
            });
        }
    }
    return sources.filter((source) => source.url);
}

function extractAssets(event) {
    return toArray(event.images).map((imagePath, index) => {
        const meta = event.imageMeta && event.imageMeta[imagePath] ? event.imageMeta[imagePath] : {};
        return {
            index,
            path: imagePath,
            existsLocally: false,
            caption: {
                en: localized(meta.caption, 'en'),
                zh: localized(meta.caption, 'zh')
            },
            subcaption: {
                en: localized(meta.subcaption, 'en'),
                zh: localized(meta.subcaption, 'zh')
            },
            sourceName: {
                en: localized(meta.sourceName || meta.source, 'en'),
                zh: localized(meta.sourceName || meta.source, 'zh')
            },
            sourceUrl: meta.sourceUrl || '',
            license: {
                en: localized(meta.license, 'en'),
                zh: localized(meta.license, 'zh')
            },
            usage: {
                en: localized(meta.usage, 'en'),
                zh: localized(meta.usage, 'zh')
            }
        };
    });
}

function buildPeople(event, assets) {
    const figures = toArray(event.figures).map((figure) => ({
        name: {
            en: localized(figure.name, 'en'),
            zh: localized(figure.name, 'zh')
        },
        role: {
            en: localized(figure.role, 'en'),
            zh: localized(figure.role, 'zh')
        },
        portraitCandidates: []
    }));

    const portraitAssets = assets.filter((asset) => {
        const text = `${asset.path} ${asset.caption.en} ${asset.caption.zh}`.toLowerCase();
        return text.includes('/people/') || text.includes('portrait') || text.includes('肖像');
    });

    for (const [index, figure] of figures.entries()) {
        figure.portraitCandidates = portraitAssets
            .filter((_asset, assetIndex) => assetIndex === index || portraitAssets.length === 1)
            .map((asset) => ({
                path: asset.path,
                sourceUrl: asset.sourceUrl,
                license: asset.license,
                usage: asset.usage,
                confidence: portraitAssets.length === 1 ? 'medium' : 'low'
            }));
    }

    return { figures };
}

function buildSearches(eventKey, event) {
    const queryParts = [
        event.year,
        localized(event.title, 'en'),
        ...toArray(event.figures).map((figure) => localized(figure.name, 'en'))
    ].filter(Boolean);
    const query = `${queryParts.join(' ')} AI history source images`;
    return config.searchTemplates.map((template) => ({
        type: template.type,
        label: template.label,
        url: template.url.replace('{query}', encodeURIComponent(query)),
        query,
        eventKey
    }));
}

function searchUrl(query, kind = 'web') {
    const encoded = encodeURIComponent(query);
    if (kind === 'image') return `https://www.google.com/search?tbm=isch&q=${encoded}`;
    if (kind === 'scholar') return `https://scholar.google.com/scholar?q=${encoded}`;
    if (kind === 'commons') {
        return `https://commons.wikimedia.org/w/index.php?search=${encoded}&title=Special:MediaSearch&type=image`;
    }
    if (kind === 'loc') return `https://www.loc.gov/pictures/search/?q=${encoded}`;
    return `https://www.google.com/search?q=${encoded}`;
}

function buildMediaPlan(eventKey, event, assets, sources) {
    const title = localized(event.title, 'en') || eventKey;
    const year = event.year || '';
    const figureNames = toArray(event.figures)
        .map((figure) => localized(figure.name, 'en'))
        .filter(Boolean);
    const baseQuery = `${year} ${title}`.trim();
    const sourceByUrl = new Map(sources.map((source) => [source.url, source]));
    const seededMedia = config.mediaSeeds[eventKey] || {};
    const seededPeopleLeads = new Map(
        toArray(seededMedia.people).map((person) => [person.name, toArray(person.leads)])
    );

    const people = figureNames.map((name) => ({
        name,
        role:
            localized(toArray(event.figures).find((figure) => localized(figure.name, 'en') === name)?.role, 'en') || '',
        searches: [
            ...toArray(seededPeopleLeads.get(name)),
            {
                type: 'portrait-search',
                label: `${name} portrait image search`,
                url: searchUrl(`${name} portrait`, 'image'),
                usage: 'Find portrait candidates; open original file page and verify license.'
            },
            {
                type: 'commons-portrait-search',
                label: `${name} Wikimedia Commons image search`,
                url: searchUrl(`${name} computer scientist`, 'commons'),
                usage: 'Prefer files with clear Commons license metadata.'
            },
            {
                type: 'bio-search',
                label: `${name} official biography search`,
                url: searchUrl(`${name} biography computer scientist official`),
                usage: 'Find institutional or award profiles for captions and role verification.'
            }
        ]
    }));

    const eventImages = [
        ...toArray(seededMedia.eventImages),
        {
            type: 'event-photo-search',
            label: `${title} event photo search`,
            url: searchUrl(`${baseQuery} photograph participants`, 'image'),
            usage: 'Look for event photographs, group photos, venue images, or archive scans.'
        },
        {
            type: 'open-image-search',
            label: `${title} Wikimedia Commons search`,
            url: searchUrl(`${title} ${year}`, 'commons'),
            usage: 'Open-license image candidates; verify each file page before using.'
        },
        {
            type: 'archive-image-search',
            label: `${title} Library of Congress image search`,
            url: searchUrl(`${title} ${year}`, 'loc'),
            usage: 'Historical image candidate search; verify rights statement.'
        }
    ];

    const publications = [
        ...toArray(seededMedia.publications),
        {
            type: 'publication-search',
            label: `${title} publication search`,
            url: searchUrl(`${baseQuery} paper publication journal proceedings`),
            usage: 'Find paper, journal, proceedings, magazine, or archive records.'
        },
        {
            type: 'scholar-publication-search',
            label: `${title} scholar search`,
            url: searchUrl(`${baseQuery} artificial intelligence`, 'scholar'),
            usage: 'Find scholarly publications and citation trail.'
        }
    ];

    const existingAssetAudit = assets.map((asset) => {
        const source = asset.sourceUrl ? sourceByUrl.get(asset.sourceUrl) : null;
        return {
            path: asset.path,
            kind: asset.path.startsWith('http') ? 'remote-current-asset' : 'local-current-asset',
            caption: asset.caption,
            subcaption: asset.subcaption,
            sourceUrl: asset.sourceUrl,
            sourceLabel: source ? source.label : asset.sourceName.en || asset.sourceName.zh,
            license: asset.license,
            usage: asset.usage,
            reviewStatus: asset.sourceUrl ? 'source-known-review-license' : 'needs-source-and-license'
        };
    });

    const sourceBuckets = {
        people: sources.filter((source) => source.type.includes('person')),
        eventPhotos: sources.filter((source) => source.type.includes('photo') || source.type.includes('image')),
        publications: sources.filter((source) =>
            /(paper|publication|primary|doi|archive-document|history)/i.test(source.type)
        ),
        institutions: sources.filter((source) => /(institution|archive|museum)/i.test(source.type))
    };

    return {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        eventKey,
        guidance: {
            imageUse:
                'Treat every image as a candidate until the original file page, credit, and license/rights statement are verified.',
            preferredOrder: [
                'official institutional archive',
                'publisher or DOI landing page for publication facts',
                'museum/library collection with rights statement',
                'Wikimedia Commons file page with explicit license',
                'search result only as a lead, not as a source'
            ]
        },
        people,
        eventImages,
        publications,
        existingAssetAudit,
        sourceBuckets
    };
}

function flattenMediaSearches(media) {
    return [
        ...toArray(media.people).flatMap((person) => toArray(person.searches)),
        ...toArray(media.eventImages),
        ...toArray(media.publications)
    ].map((lead) => ({
        type: lead.type,
        label: lead.label,
        url: lead.url,
        query: '',
        usage: lead.usage
    }));
}

function mediaLeadsToSources(media) {
    return [
        ...toArray(media.people).flatMap((person) => toArray(person.searches)),
        ...toArray(media.eventImages),
        ...toArray(media.publications)
    ]
        .filter((lead) => lead.url && !/(search\?|google\.com\/search|scholar\.google\.com)/i.test(lead.url))
        .map((lead) => ({
            type: lead.type || 'media-lead',
            label: lead.label || lead.url,
            url: lead.url,
            usage: lead.usage || '',
            imageUrl: lead.imageUrl || '',
            status: 'media-lead'
        }));
}

function summarizeMedia(media) {
    const portraitLeads = toArray(media.people).flatMap((person) =>
        toArray(person.searches)
            .filter((lead) => /portrait|artifact-photo/.test(lead.type || ''))
            .map((lead) => ({
                person: person.name,
                type: lead.type,
                label: lead.label,
                url: lead.url,
                usage: lead.usage
            }))
    );
    return {
        portraits: portraitLeads.slice(0, 16),
        eventImages: toArray(media.eventImages).slice(0, 12),
        publications: toArray(media.publications).slice(0, 8)
    };
}

async function markAssetExistence(assets) {
    for (const asset of assets) {
        try {
            await fs.access(path.join(config.rootDir, asset.path));
            asset.existsLocally = true;
        } catch (_error) {
            asset.existsLocally = false;
        }
    }
}

async function fetchWithTimeout(url) {
    const controller = new globalThis.AbortController();
    const timer = setTimeout(() => controller.abort(), config.fetch.timeoutMs);
    try {
        const response = await fetch(url, {
            headers: { 'user-agent': config.fetch.userAgent },
            signal: controller.signal
        });
        const text = await response.text();
        return {
            ok: response.ok,
            status: response.status,
            url: response.url,
            contentType: response.headers.get('content-type') || '',
            text
        };
    } finally {
        clearTimeout(timer);
    }
}

function htmlTitle(text) {
    const match = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    return match ? match[1].replace(/\s+/g, ' ').trim() : '';
}

function htmlMetaContent(text, property) {
    const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
        new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["'][^>]*>`, 'i'),
        new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i')
    ];
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return match[1].replace(/&amp;/g, '&');
    }
    return '';
}

function isPageLikeSource(source) {
    if (!/^https?:\/\//.test(source.url)) return false;
    if (source.type === 'video') return false;
    return !/\.(mp4|mov|m4v|webm|avi|mkv)(\?|#|$)/i.test(source.url);
}

function isImageLikeUrl(url) {
    return /^https?:\/\//.test(url) && /\.(jpe?g|png|webp|gif|svg)(\?|#|$)/i.test(new URL(url).pathname);
}

async function fetchBinaryWithTimeout(url) {
    const controller = new globalThis.AbortController();
    const timer = setTimeout(() => controller.abort(), config.fetch.imageTimeoutMs || config.fetch.timeoutMs);
    try {
        const response = await fetch(url, {
            headers: { 'user-agent': config.fetch.userAgent },
            signal: controller.signal
        });
        const buffer = Buffer.from(await response.arrayBuffer());
        return {
            ok: response.ok,
            status: response.status,
            url: response.url,
            contentType: response.headers.get('content-type') || '',
            buffer
        };
    } finally {
        clearTimeout(timer);
    }
}

async function fetchSources(eventDir, sources) {
    const pagesDir = path.join(eventDir, 'pages');
    await fs.rm(pagesDir, { recursive: true, force: true });
    await fs.mkdir(pagesDir, { recursive: true });
    const results = [];
    const fetchable = sources.filter(isPageLikeSource);
    for (const [index, source] of fetchable.entries()) {
        await delay(300);
        const baseName = `${String(index + 1).padStart(3, '0')}.${safeFilename(source.label || source.url)}`;
        const pagePath = path.join(pagesDir, `${baseName}.html`);
        try {
            const result = await fetchWithTimeout(source.url);
            await fs.writeFile(pagePath, result.text);
            results.push({
                label: source.label,
                sourceUrl: source.url,
                finalUrl: result.url,
                ok: result.ok,
                status: result.status,
                contentType: result.contentType,
                title: htmlTitle(result.text),
                savedPath: path.relative(eventDir, pagePath),
                fetchedAt: new Date().toISOString()
            });
        } catch (error) {
            results.push({
                label: source.label,
                sourceUrl: source.url,
                ok: false,
                error: error.message,
                fetchedAt: new Date().toISOString()
            });
        }
    }
    return results;
}

function mediaDownloadLeads(media, sourceData) {
    const fetchByUrl = new Map(toArray(sourceData.fetchResults).map((result) => [result.sourceUrl, result]));
    const directLeads = [
        ...toArray(media.eventImages),
        ...toArray(media.people).flatMap((person) =>
            toArray(person.searches).map((lead) => ({ ...lead, person: person.name }))
        ),
        ...toArray(media.publications)
    ];

    return directLeads
        .map((lead) => {
            const fetchResult = fetchByUrl.get(lead.url) || {};
            return {
                ...lead,
                sourcePageUrl: lead.url,
                imageUrl: lead.imageUrl || '',
                pageSnapshot: fetchResult.savedPath || ''
            };
        })
        .filter((lead) => {
            if (lead.imageUrl) return true;
            if (!lead.pageSnapshot) return false;
            if (/search|category|archive-search|bio-search/.test(lead.type || '')) return false;
            return /portrait-file|artifact-photo|publication-image|publication-scan/.test(lead.type || '');
        });
}

function assetDownloadLeads(assets) {
    return toArray(assets).map((asset) => ({
        type: 'existing-event-asset',
        label:
            asset.subcaption.en ||
            asset.subcaption.zh ||
            asset.caption.en ||
            asset.caption.zh ||
            path.basename(asset.path),
        sourcePageUrl: asset.sourceUrl || asset.path,
        imageUrl: asset.path.startsWith('http') ? asset.path : '',
        localAssetPath: asset.path.startsWith('http') ? '' : asset.path,
        usage: asset.usage.en || asset.usage.zh || asset.caption.en || asset.caption.zh || 'Existing event asset',
        rights:
            asset.license.en ||
            asset.license.zh ||
            'Unverified. Existing event asset still needs source/license review.',
        pageSnapshot: ''
    }));
}

async function imageUrlFromSnapshot(eventDir, lead) {
    if (lead.imageUrl) return lead.imageUrl;
    if (!lead.pageSnapshot) return '';
    const pagePath = path.join(eventDir, lead.pageSnapshot);
    const html = await fs.readFile(pagePath, 'utf8');
    return htmlMetaContent(html, 'og:image') || htmlMetaContent(html, 'twitter:image');
}

async function downloadImages(eventDir, eventKey, media, sourceData, assets) {
    const imagesDir = path.join(eventDir, 'images');
    await fs.mkdir(imagesDir, { recursive: true });
    const previousManifest = await readJson(path.join(imagesDir, 'manifest.json'), { images: [] });
    const previousBySource = new Map(toArray(previousManifest.images).map((item) => [item.sourcePageUrl, item]));
    const leads = uniqBy(
        [...assetDownloadLeads(assets), ...mediaDownloadLeads(media, sourceData)],
        (lead) => lead.sourcePageUrl || lead.imageUrl || lead.localAssetPath
    );
    const images = [];

    for (const [index, lead] of leads.entries()) {
        await delay(300);
        const sourcePageUrl = lead.sourcePageUrl;
        const previous = previousBySource.get(sourcePageUrl);
        try {
            if (lead.localAssetPath) {
                const sourcePath = path.join(config.rootDir, lead.localAssetPath);
                const extension = path.extname(lead.localAssetPath) || '.img';
                const filename = `${String(index + 1).padStart(3, '0')}.${safeFilename(lead.label || path.basename(lead.localAssetPath)).replace(/\.+$/, '')}${extension}`;
                const filePath = path.join(imagesDir, filename);
                const stat = await fs.stat(sourcePath);
                await fs.copyFile(sourcePath, filePath);
                images.push({
                    eventKey,
                    label: lead.label,
                    type: lead.type,
                    person: lead.person || '',
                    sourcePageUrl,
                    imageUrl: '',
                    finalImageUrl: '',
                    localPath: path.relative(eventDir, filePath),
                    originalLocalPath: lead.localAssetPath,
                    pageSnapshot: '',
                    contentType: '',
                    bytes: stat.size,
                    status: 'existing-event-asset-review-required',
                    httpStatus: 0,
                    usage: lead.usage || '',
                    rights: lead.rights,
                    downloadedAt: new Date().toISOString()
                });
                continue;
            }
            const imageUrl = await imageUrlFromSnapshot(eventDir, lead);
            if (!imageUrl || !/^https?:\/\//.test(imageUrl)) {
                images.push({
                    ...previous,
                    eventKey,
                    label: lead.label,
                    type: lead.type,
                    person: lead.person || '',
                    sourcePageUrl,
                    imageUrl,
                    status: 'no-image-url-found',
                    usage: lead.usage || '',
                    pageSnapshot: lead.pageSnapshot || ''
                });
                continue;
            }
            if (!isImageLikeUrl(imageUrl)) {
                images.push({
                    ...previous,
                    eventKey,
                    label: lead.label,
                    type: lead.type,
                    person: lead.person || '',
                    sourcePageUrl,
                    imageUrl,
                    status: 'not-direct-image-url',
                    usage: lead.usage || '',
                    pageSnapshot: lead.pageSnapshot || ''
                });
                continue;
            }
            const result = await fetchBinaryWithTimeout(imageUrl);
            const extension = extensionFromContentType(result.contentType) || extensionFromUrl(result.url) || '.img';
            const filename = `${String(index + 1).padStart(3, '0')}.${safeFilename(lead.label || lead.type).replace(/\.+$/, '')}${extension}`;
            const filePath = path.join(imagesDir, filename);
            await fs.writeFile(filePath, result.buffer);
            images.push({
                eventKey,
                label: lead.label,
                type: lead.type,
                person: lead.person || '',
                sourcePageUrl,
                imageUrl,
                finalImageUrl: result.url,
                localPath: path.relative(eventDir, filePath),
                pageSnapshot: lead.pageSnapshot || '',
                contentType: result.contentType,
                bytes: result.buffer.length,
                status: result.ok ? 'candidate-review-required' : 'downloaded-http-error',
                httpStatus: result.status,
                usage: lead.usage || '',
                rights:
                    lead.rights || 'Unverified. Review the source page license/rights statement before production use.',
                downloadedAt: new Date().toISOString()
            });
        } catch (error) {
            images.push({
                ...previous,
                eventKey,
                label: lead.label,
                type: lead.type,
                person: lead.person || '',
                sourcePageUrl,
                imageUrl: lead.imageUrl || '',
                status: 'download-failed',
                error: error.message,
                usage: lead.usage || '',
                pageSnapshot: lead.pageSnapshot || '',
                downloadedAt: new Date().toISOString()
            });
        }
    }

    const manifest = {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        eventKey,
        storage: 'research/event-assets/{eventKey}/images',
        guidance:
            'Downloaded files are research candidates only. Do not move to production resources until rights are reviewed.',
        images
    };
    await writeJson(path.join(imagesDir, 'manifest.json'), manifest);
    return manifest;
}

async function writeJson(filePath, value) {
    await fs.writeFile(`${filePath}.tmp`, `${JSON.stringify(value, null, 2)}\n`);
    await fs.rename(`${filePath}.tmp`, filePath);
}

async function readJson(filePath, fallback) {
    try {
        return JSON.parse(await fs.readFile(filePath, 'utf8'));
    } catch (_error) {
        return fallback;
    }
}

async function ensureNotes(eventDir, eventKey, event) {
    const notesPath = path.join(eventDir, 'notes.md');
    try {
        await fs.access(notesPath);
    } catch (_error) {
        const title = localized(event.title, 'zh') || localized(event.title, 'en') || eventKey;
        await fs.writeFile(
            notesPath,
            `# ${title}\n\n## 筛选记录\n\n- [ ] 人物头像候选已确认来源和授权\n- [ ] 事件照片候选已确认来源和授权\n- [ ] 说明文字已核对主资料来源\n- [ ] 可进入正式数据的图片已复制到 resources/images 对应目录\n\n## 人工备注\n\n`
        );
    }
}

async function collectEvent(eventKey, event, options) {
    const eventDir = path.join(config.eventAssetsDir, eventKey);
    await fs.mkdir(path.join(eventDir, 'images'), { recursive: true });

    const assets = extractAssets(event);
    await markAssetExistence(assets);

    const existingSources = extractExistingSources(event);
    const seededSources = toArray(config.sourceSeeds[eventKey]).map((source) => ({
        ...source,
        status: 'seed'
    }));
    const baseSearchCandidates = buildSearches(eventKey, event);
    const firstPassSources = uniqBy([...existingSources, ...seededSources], (source) => source.url);
    const media = buildMediaPlan(eventKey, event, assets, firstPassSources);
    const sources = uniqBy([...firstPassSources, ...mediaLeadsToSources(media)], (source) => source.url);
    const searchCandidates = uniqBy(
        [...baseSearchCandidates, ...flattenMediaSearches(media)],
        (candidate) => candidate.url
    );

    const summary = {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        eventKey,
        year: event.year || null,
        title: {
            en: localized(event.title, 'en'),
            zh: localized(event.title, 'zh')
        },
        location: {
            name: {
                en: localized(event.location && event.location.name, 'en'),
                zh: localized(event.location && event.location.name, 'zh')
            },
            country: {
                en: localized(event.location && event.location.country, 'en'),
                zh: localized(event.location && event.location.country, 'zh')
            },
            coordinates: event.location && event.location.coordinates ? event.location.coordinates : []
        },
        description: {
            en: localized(event.description, 'en'),
            zh: localized(event.description, 'zh')
        },
        currentAssets: assets,
        mediaSummary: summarizeMedia(media),
        videos: toArray(event.videos),
        review: {
            status: 'candidate',
            imagePolicy: 'Do not use new remote images in production until source and license are verified.',
            nextSteps: [
                'Open sources.json and pages/ to verify primary facts.',
                'Record accepted/rejected image candidates in notes.md.',
                'Move approved assets into resources/images only after review.'
            ]
        }
    };

    const people = buildPeople(event, assets);
    const sourceData = {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        eventKey,
        sources,
        searchCandidates,
        fetchResults: []
    };

    if (options.fetch) {
        sourceData.fetchResults = await fetchSources(eventDir, sources);
    } else {
        const previousSources = await readJson(path.join(eventDir, 'sources.json'), { fetchResults: [] });
        sourceData.fetchResults = toArray(previousSources.fetchResults);
    }

    let imageManifest = await readJson(path.join(eventDir, 'images', 'manifest.json'), { images: [] });
    if (options.downloadImages) {
        imageManifest = await downloadImages(eventDir, eventKey, media, sourceData, assets);
    }
    summary.downloadedImages = {
        count: toArray(imageManifest.images).length,
        manifest: 'images/manifest.json'
    };

    await writeJson(path.join(eventDir, 'summary.json'), summary);
    await writeJson(path.join(eventDir, 'people.json'), people);
    await writeJson(path.join(eventDir, 'sources.json'), sourceData);
    await writeJson(path.join(eventDir, 'media.json'), media);
    await ensureNotes(eventDir, eventKey, event);

    return {
        eventKey,
        title: summary.title.zh || summary.title.en,
        sources: sourceData.sources.length,
        searches: sourceData.searchCandidates.length,
        assets: summary.currentAssets.length,
        fetched: sourceData.fetchResults.length,
        images: summary.downloadedImages.count
    };
}

async function writeManifest(results) {
    const manifest = {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        root: 'research/event-assets',
        events: results
    };
    await writeJson(path.join(config.eventAssetsDir, 'manifest.json'), manifest);
}

async function main() {
    const { events, sortedKeys } = readEvents();
    const requested = getArg('--event');
    const limitArg = Number(getArg('--limit', '0'));
    const fetch = hasFlag('--fetch');
    const downloadImagesFlag = hasFlag('--download-images');
    let keys = requested
        ? requested
              .split(',')
              .map((key) => key.trim())
              .filter(Boolean)
        : [];

    if (!keys.length) {
        keys = hasFlag('--all')
            ? sortedKeys
            : ['1956-dartmouth', '1957-perceptron', '1957-kmeans'].filter((key) => events[key]);
    }
    if (limitArg > 0) keys = keys.slice(0, limitArg);

    const results = [];
    for (const key of keys) {
        if (!events[key]) {
            console.warn(`Skip unknown event: ${key}`);
            continue;
        }
        const result = await collectEvent(key, events[key], {
            fetch: fetch || downloadImagesFlag,
            downloadImages: downloadImagesFlag
        });
        results.push(result);
        console.log(
            `${result.eventKey}: ${result.assets} assets, ${result.sources} sources, ${result.searches} searches, ${result.fetched} fetched pages, ${result.images} images`
        );
    }
    await writeManifest(results);
    console.log(
        `Wrote ${results.length} event workspace(s) to ${path.relative(config.rootDir, config.eventAssetsDir)}`
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
