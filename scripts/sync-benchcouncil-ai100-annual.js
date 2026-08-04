#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const { execFile } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { promisify } = require('node:util');
const { assetMatchesFigure, orderVariantAssetIds } = require('./event-figure-rules');

const execFileAsync = promisify(execFile);

const ROOT = path.join(__dirname, '..');
const STORYLINE_ID = 'bench-council-ai100-2022-2023';
const SOURCE_URL = 'https://www.benchcouncil.org/evaluation/ai/annual.html';
const BASE_SNAPSHOT_PATH = path.join(
    ROOT,
    'research',
    'benchcouncil-ai100',
    'annual-candidates-2022-2023-2026-07-30.json'
);
const CURRENT_SNAPSHOT_PATH = path.join(
    ROOT,
    'research',
    'benchcouncil-ai100',
    'annual-candidates-2022-2023-2026-08-03.json'
);
const METADATA_PATH = path.join(ROOT, 'research', 'benchcouncil-ai100', 'annual-publication-metadata-2026-08-03.json');
const PORTRAIT_RESEARCH_PATH = path.join(
    ROOT,
    'research',
    'benchcouncil-ai100',
    'annual-portrait-research-2026-08-03.json'
);
const EVENT_RESEARCH_2022_PATH = path.join(
    ROOT,
    'research',
    'benchcouncil-ai100',
    'annual-event-research-2022-2026-08-03.json'
);
const EVENT_RESEARCH_DIRS = new Map([
    [2022, path.join(ROOT, 'research', 'benchcouncil-ai100', 'annual-events-2022')],
    [2023, path.join(ROOT, 'research', 'benchcouncil-ai100', 'annual-events-2023')]
]);
const IMAGE_ROOT = path.join(ROOT, 'resources', 'images', 'benchcouncil-ai100-annual');

const AREA_ZH = {
    Vision: '视觉',
    Video: '视频',
    Speech: '语音',
    Multimodal: '多模态',
    LLM: '大语言模型',
    'Evaluation Analysis': '评测与分析',
    'Diffusion Model Application': '扩散模型应用',
    'Detection Segmentation': '检测与分割',
    AI4Science: 'AI for Science',
    AI4Others: 'AI 其他应用',
    Robots: '机器人',
    Ensemble: '集成学习'
};

const COUNTRY_ZH = {
    Australia: '澳大利亚',
    Belgium: '比利时',
    Canada: '加拿大',
    China: '中国',
    Denmark: '丹麦',
    France: '法国',
    Germany: '德国',
    Israel: '以色列',
    Japan: '日本',
    Korea: '韩国',
    Netherlands: '荷兰',
    Russia: '俄罗斯',
    Singapore: '新加坡',
    Switzerland: '瑞士',
    UK: '英国',
    USA: '美国'
};

const COUNTRY_EN = {
    Australia: 'Australia',
    Belgium: 'Belgium',
    Canada: 'Canada',
    China: 'China',
    Denmark: 'Denmark',
    France: 'France',
    Germany: 'Germany',
    Israel: 'Israel',
    Japan: 'Japan',
    Korea: 'South Korea',
    Netherlands: 'Netherlands',
    Russia: 'Russia',
    Singapore: 'Singapore',
    Switzerland: 'Switzerland',
    UK: 'United Kingdom',
    USA: 'United States'
};

const COUNTRY_DETAILS = {
    Australia: { regionId: 'australia', coordinates: [-25.2744, 133.7751] },
    Belgium: { regionId: 'belgium', coordinates: [50.5039, 4.4699] },
    Canada: { regionId: 'canada', coordinates: [56.1304, -106.3468] },
    China: { regionId: 'china', coordinates: [35.8617, 104.1954] },
    Denmark: { regionId: 'denmark', coordinates: [56.2639, 9.5018] },
    France: { regionId: 'france', coordinates: [46.2276, 2.2137] },
    Germany: { regionId: 'germany', coordinates: [51.1657, 10.4515] },
    Israel: { regionId: 'israel', coordinates: [31.0461, 34.8516] },
    Japan: { regionId: 'japan', coordinates: [36.2048, 138.2529] },
    Korea: { regionId: 'south-korea', coordinates: [35.9078, 127.7669] },
    Netherlands: { regionId: 'netherlands', coordinates: [52.1326, 5.2913] },
    Russia: { regionId: 'russia', coordinates: [61.524, 105.3188] },
    Singapore: { regionId: 'singapore', coordinates: [1.3521, 103.8198] },
    Switzerland: { regionId: 'switzerland', coordinates: [46.8182, 8.2275] },
    UK: { regionId: 'united-kingdom', coordinates: [55.3781, -3.436] },
    USA: { regionId: 'united-states', coordinates: [37.0902, -95.7129] }
};

const OFFICIAL_WORK_OVERRIDES = {
    Whisper: 'https://openai.com/index/whisper/',
    InstructGPT: 'https://openai.com/index/instruction-following/',
    'Chain-of-Thought Prompting':
        'https://research.google/pubs/chain-of-thought-prompting-elicits-reasoning-in-large-language-models/',
    'Latent Diffusion Models':
        'https://openaccess.thecvf.com/content/CVPR2022/html/Rombach_High-Resolution_Image_Synthesis_With_Latent_Diffusion_Models_CVPR_2022_paper.html',
    SayCan: 'https://say-can.github.io/',
    HuggingChat: 'https://huggingface.co/blog/introducing-huggingchat',
    'GPT-4': 'https://openai.com/index/gpt-4-research/',
    'ERNIE Bot': 'https://research.baidu.com/Blog/index-view?id=185',
    Claude: 'https://www.anthropic.com/news/introducing-claude',
    Bard: 'https://blog.google/technology/ai/bard-google-ai-search-updates/',
    Gen2: 'https://runwayml.com/research/gen-2',
    ChatGPT: 'https://openai.com/index/chatgpt/'
};

const YEAR_OVERRIDES = {
    Whisper: 2022,
    InstructGPT: 2022,
    'Chain-of-Thought Prompting': 2022,
    'Latent Diffusion Models': 2022,
    SayCan: 2022,
    HuggingChat: 2023,
    'GPT-4': 2023,
    'ERNIE Bot': 2023,
    Claude: 2023,
    Bard: 2023,
    Gen2: 2023,
    ChatGPT: 2022
};

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function mergeObjects(base, override) {
    if (!override || typeof override !== 'object' || Array.isArray(override)) return override;
    const result = { ...(base || {}) };
    for (const [key, value] of Object.entries(override)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            result[key] = mergeObjects(result[key], value);
        } else {
            result[key] = value;
        }
    }
    return result;
}

function parseArgs(argv) {
    const args = { fetchMetadata: false, generate: false, htmlPath: '', event: '', listYear: 0 };
    for (let index = 0; index < argv.length; index += 1) {
        const value = argv[index];
        if (value === '--fetch-metadata') args.fetchMetadata = true;
        else if (value === '--generate') args.generate = true;
        else if (value === '--html') args.htmlPath = argv[++index] || '';
        else if (value === '--event') args.event = argv[++index] || '';
        else if (value === '--list-2022') args.listYear = 2022;
        else if (value === '--list-2023') args.listYear = 2023;
        else throw new Error(`Unknown argument: ${value}`);
    }
    return args;
}

function decodeHtml(value) {
    return String(value || '')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&quot;/gi, '"')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
        .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function normalizeVisibleText(value) {
    return decodeHtml(value)
        .replace(/<[^>]*>/g, ' ')
        .normalize('NFKC')
        .replace(/[，]/g, ',')
        .replace(/\s+/g, ' ')
        .replace(/\s*,\s*/g, ',')
        .trim()
        .toLowerCase();
}

function verifySnapshotAgainstHtml(snapshot, htmlPath) {
    const html = fs.readFileSync(htmlPath, 'utf8');
    const normalizedHtml = normalizeVisibleText(html);
    const missing = [];
    for (const [index, item] of snapshot.items.entries()) {
        for (const field of ['work', 'publication', 'contributors', 'institution', 'country']) {
            const value = String(item[field] || '').trim();
            if (!value) continue;
            if (!normalizedHtml.includes(normalizeVisibleText(value))) {
                missing.push(`${index + 1} ${item.work} / ${field}: ${value}`);
            }
        }
    }
    if (missing.length > 0) {
        throw new Error(`Official page differs from the stored snapshot:\n${missing.slice(0, 30).join('\n')}`);
    }
    const current = {
        ...snapshot,
        retrievedAt: '2026-08-03',
        role: 'annual-storyline-membership-source',
        sourceSha256: crypto.createHash('sha256').update(html).digest('hex')
    };
    writeJson(CURRENT_SNAPSHOT_PATH, current);
    return current;
}

function normalizeKey(value) {
    return String(value || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function titleScore(query, title) {
    const left = normalizeKey(query);
    const right = normalizeKey(title);
    if (!left || !right) return 0;
    if (left === right) return 100;
    const leftTokens = new Set(left.split(' '));
    const rightTokens = new Set(right.split(' '));
    const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
    const union = new Set([...leftTokens, ...rightTokens]).size;
    const jaccard = union ? intersection / union : 0;
    return jaccard * 80 + (left.includes(right) || right.includes(left) ? 10 : 0);
}

function contributorTokens(value) {
    return String(value || '')
        .split(',')
        .map((name) => normalizeKey(name))
        .filter(Boolean);
}

function selectOpenAlexResult(item, results) {
    const query = item.publication || item.work;
    const officialContributors = contributorTokens(item.contributors);
    return (results || [])
        .map((result) => {
            const authorNames = (result.authorships || []).map((entry) =>
                normalizeKey(entry.author && entry.author.display_name)
            );
            const contributorMatches = officialContributors.filter((name) => authorNames.includes(name)).length;
            return {
                result,
                score: titleScore(query, result.title) + contributorMatches * 5
            };
        })
        .sort((left, right) => right.score - left.score)[0];
}

async function mapWithConcurrency(items, limit, worker) {
    const results = new Array(items.length);
    let cursor = 0;
    async function run() {
        while (cursor < items.length) {
            const index = cursor++;
            results[index] = await worker(items[index], index);
        }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
    return results;
}

async function fetchOpenAlexPayload(url, attempts = 5) {
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            const { stdout } = await execFileAsync('curl', ['-fsSL', url], {
                maxBuffer: 8 * 1024 * 1024
            });
            return JSON.parse(stdout);
        } catch (error) {
            if (attempt === attempts) return null;
            await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
        }
    }
    return null;
}

async function fetchPublicationMetadata(snapshot) {
    const previous = fs.existsSync(METADATA_PATH) ? readJson(METADATA_PATH) : { items: [] };
    const previousByWork = new Map((previous.items || []).map((item) => [item.work, item]));
    const items = await mapWithConcurrency(snapshot.items, 1, async (item, index) => {
        const existing = previousByWork.get(item.work);
        if (existing && existing.match) return existing;
        const query = item.publication || item.work;
        const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=5`;
        const payload = await fetchOpenAlexPayload(url);
        const selected = selectOpenAlexResult(item, payload && payload.results);
        const result = selected && selected.score >= 45 ? selected.result : null;
        process.stdout.write(
            `\rOpenAlex ${String(index + 1).padStart(3, ' ')}/${snapshot.items.length}: ${item.work}          `
        );
        return {
            index: index + 1,
            work: item.work,
            query,
            score: selected ? Number(selected.score.toFixed(2)) : 0,
            match: result
                ? {
                      id: result.id || '',
                      title: result.title || '',
                      publicationYear: result.publication_year || null,
                      doi: result.doi || '',
                      landingPageUrl: (result.primary_location && result.primary_location.landing_page_url) || '',
                      openAccessUrl: (result.open_access && result.open_access.oa_url) || '',
                      authors: (result.authorships || [])
                          .map((entry) => entry.author && entry.author.display_name)
                          .filter(Boolean)
                  }
                : null
        };
    });
    process.stdout.write('\n');
    const output = {
        source: 'https://api.openalex.org/works',
        retrievedAt: '2026-08-03',
        annualSourceUrl: SOURCE_URL,
        items
    };
    writeJson(METADATA_PATH, output);
    return output;
}

function slugify(value) {
    return normalizeKey(value).replace(/\s+/g, '-').replace(/^-|-$/g, '') || 'untitled';
}

function eventIdForItem(item, index) {
    return `ai100-annual-2022-2023-${String(index).padStart(3, '0')}-${slugify(item.work)}`;
}

function resolveEventSelection(snapshot, metadata, selector) {
    if (!selector) return null;
    const normalizedSelector = normalizeKey(selector);
    const numericOrder = /^\d+$/.test(String(selector).trim()) ? Number(selector) : 0;
    const matches = snapshot.items
        .map((item, zeroBasedIndex) => {
            const index = zeroBasedIndex + 1;
            return {
                item,
                metadataItem: metadata.items[zeroBasedIndex],
                index,
                eventId: eventIdForItem(item, index),
                year: publicationYear(item, metadata.items[zeroBasedIndex])
            };
        })
        .filter((entry) => {
            if (numericOrder && entry.index === numericOrder) return true;
            return [entry.eventId, entry.item.work, slugify(entry.item.work)].some(
                (candidate) => normalizeKey(candidate) === normalizedSelector
            );
        });
    if (matches.length !== 1) {
        throw new Error(
            matches.length === 0
                ? `No annual event matches --event ${selector}`
                : `Multiple annual events match --event ${selector}`
        );
    }
    return matches[0];
}

function xmlEscape(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function wrapText(value, maxChars, maxLines = 4) {
    const words = String(value || '')
        .split(/\s+/)
        .filter(Boolean);
    const lines = [];
    let line = '';
    for (const word of words) {
        const next = line ? `${line} ${word}` : word;
        if (next.length <= maxChars || !line) line = next;
        else {
            lines.push(line);
            line = word;
        }
    }
    if (line) lines.push(line);
    if (lines.length > maxLines) {
        lines.length = maxLines;
        lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, Math.max(1, maxChars - 1))}…`;
    }
    return lines;
}

function svgText(lines, x, y, options = {}) {
    const size = options.size || 28;
    const lineHeight = options.lineHeight || Math.round(size * 1.25);
    const fill = options.fill || '#f4f7fb';
    const weight = options.weight || 500;
    return `<text x="${x}" y="${y}" fill="${fill}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}">${lines
        .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${xmlEscape(line)}</tspan>`)
        .join('')}</text>`;
}

function buildRecordSvg(item, index) {
    const publication = item.publication || 'No publication title is listed on the annual page';
    const publicationLines = wrapText(publication, 61, 4);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="560" viewBox="0 0 960 560" role="img" aria-labelledby="title desc">
  <title id="title">${xmlEscape(item.work)} annual evidence map</title>
  <desc id="desc">Original local explainer connecting the official work name, area, publication, citation count and country.</desc>
  <rect width="960" height="560" fill="#0d1722"/>
  <rect x="48" y="52" width="260" height="116" rx="8" fill="#19324b" stroke="#65a9dc" stroke-width="2"/>
  <rect x="350" y="52" width="562" height="116" rx="8" fill="#2d2530" stroke="#d28c55" stroke-width="2"/>
  <rect x="48" y="216" width="864" height="220" rx="8" fill="#172536" stroke="#6b8298" stroke-width="2"/>
  <path d="M308 110 H350 M631 168 V216" stroke="#f4f7fb" stroke-width="4" fill="none"/>
  ${svgText(['AREA'], 72, 88, { size: 17, fill: '#8fc4eb', weight: 700 })}
  ${svgText(wrapText(item.area, 22, 2), 72, 127, { size: 28, weight: 700, lineHeight: 33 })}
  ${svgText(['OFFICIAL WORK'], 376, 88, { size: 17, fill: '#e1a06e', weight: 700 })}
  ${svgText(wrapText(item.work, 36, 2), 376, 127, { size: 30, weight: 700, lineHeight: 36 })}
  ${svgText(['PUBLICATION RECORD'], 76, 257, { size: 17, fill: '#8fc4eb', weight: 700 })}
  ${svgText(publicationLines, 76, 302, { size: publicationLines.length > 3 ? 24 : 28, lineHeight: 34 })}
  <rect x="48" y="470" width="410" height="54" rx="8" fill="#1a3a32"/>
  <rect x="502" y="470" width="410" height="54" rx="8" fill="#3b2e1d"/>
  ${svgText([`Citation: ${item.citation || 'not listed'}`], 72, 505, { size: 21, fill: '#a7e0c2', weight: 700 })}
  ${svgText([`Country: ${item.country || 'not listed'} · #${index}`], 526, 505, { size: 21, fill: '#f3c28d', weight: 700 })}
</svg>\n`;
}

function buildSwinTransformerV2Svg() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="560" viewBox="0 0 960 560" role="img" aria-labelledby="title desc">
  <title id="title">Swin Transformer V2 scaling path</title>
  <desc id="desc">Original local explainer showing how residual post normalization, scaled cosine attention, continuous position bias and SimMIM pretraining support a three-billion-parameter high-resolution vision model.</desc>
  <rect width="960" height="560" fill="#0d1722"/>
  <text x="48" y="55" fill="#f4f7fb" font-family="Arial, sans-serif" font-size="30" font-weight="700">Swin Transformer V2</text>
  <text x="48" y="86" fill="#a9bdd0" font-family="Arial, sans-serif" font-size="17">Scaling capacity and resolution without losing training stability</text>
  <rect x="48" y="126" width="250" height="118" rx="8" fill="#19324b" stroke="#65a9dc" stroke-width="2"/>
  <rect x="355" y="126" width="250" height="118" rx="8" fill="#263528" stroke="#74b77d" stroke-width="2"/>
  <rect x="662" y="126" width="250" height="118" rx="8" fill="#3b2e1d" stroke="#d89b58" stroke-width="2"/>
  <path d="M298 185 H355 M605 185 H662" stroke="#dce8f2" stroke-width="4" fill="none"/>
  <path d="M338 176 L355 185 L338 194 M645 176 L662 185 L645 194" stroke="#dce8f2" stroke-width="4" fill="none"/>
  ${svgText(['STABLE BLOCKS'], 70, 159, { size: 15, fill: '#8fc4eb', weight: 700 })}
  ${svgText(['Residual post-norm', '+ scaled cosine attention'], 70, 194, { size: 21, weight: 700, lineHeight: 29 })}
  ${svgText(['RESOLUTION TRANSFER'], 377, 159, { size: 15, fill: '#8fd29a', weight: 700 })}
  ${svgText(['Log-spaced continuous', 'position bias'], 377, 194, { size: 21, weight: 700, lineHeight: 29 })}
  ${svgText(['MODEL SCALE'], 684, 159, { size: 15, fill: '#efb97b', weight: 700 })}
  ${svgText(['3B parameters', 'up to 1536 x 1536'], 684, 194, { size: 21, weight: 700, lineHeight: 29 })}
  <rect x="48" y="292" width="250" height="92" rx="8" fill="#2d2530" stroke="#c087c9" stroke-width="2"/>
  ${svgText(['SIMMIM PRETRAINING'], 70, 326, { size: 15, fill: '#d9a3df', weight: 700 })}
  ${svgText(['Less dependence on', 'labeled images'], 70, 357, { size: 20, weight: 700, lineHeight: 27 })}
  <path d="M298 338 H355" stroke="#dce8f2" stroke-width="4" fill="none"/>
  <path d="M338 329 L355 338 L338 347" stroke="#dce8f2" stroke-width="4" fill="none"/>
  <rect x="355" y="292" width="557" height="92" rx="8" fill="#172536" stroke="#6b8298" stroke-width="2"/>
  ${svgText(['TRANSFER TO FOUR VISION TASKS'], 379, 326, { size: 15, fill: '#8fc4eb', weight: 700 })}
  ${svgText(['ImageNet-V2  |  COCO  |  ADE20K  |  Kinetics-400'], 379, 362, { size: 20, weight: 700 })}
  <rect x="48" y="432" width="864" height="72" rx="8" fill="#1a3a32" stroke="#62aa8c" stroke-width="2"/>
  ${svgText(['Core relationship'], 70, 462, { size: 15, fill: '#91d7bb', weight: 700 })}
  ${svgText(['Stabilize optimization + transfer across resolutions + reduce label demand'], 70, 489, { size: 21, weight: 700 })}
</svg>\n`;
}

function buildSimMimSvg() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="560" viewBox="0 0 960 560" role="img" aria-labelledby="title desc">
  <title id="title">SimMIM masked image modeling path</title>
  <desc id="desc">Original local explainer showing random masking, a vision encoder, a lightweight linear prediction head and direct raw RGB pixel regression.</desc>
  <rect width="960" height="560" fill="#0d1722"/>
  <text x="48" y="55" fill="#f4f7fb" font-family="Arial, sans-serif" font-size="30" font-weight="700">SimMIM</text>
  <text x="48" y="86" fill="#a9bdd0" font-family="Arial, sans-serif" font-size="17">A deliberately simple masked image modeling recipe</text>
  <rect x="48" y="126" width="188" height="118" rx="8" fill="#19324b" stroke="#65a9dc" stroke-width="2"/>
  <rect x="286" y="126" width="188" height="118" rx="8" fill="#2d2530" stroke="#c087c9" stroke-width="2"/>
  <rect x="524" y="126" width="188" height="118" rx="8" fill="#263528" stroke="#74b77d" stroke-width="2"/>
  <rect x="762" y="126" width="150" height="118" rx="8" fill="#3b2e1d" stroke="#d89b58" stroke-width="2"/>
  <path d="M236 185 H286 M474 185 H524 M712 185 H762" stroke="#dce8f2" stroke-width="4" fill="none"/>
  <path d="M269 176 L286 185 L269 194 M507 176 L524 185 L507 194 M745 176 L762 185 L745 194" stroke="#dce8f2" stroke-width="4" fill="none"/>
  ${svgText(['INPUT IMAGE'], 68, 158, { size: 14, fill: '#8fc4eb', weight: 700 })}
  ${svgText(['Randomly mask', 'large patches'], 68, 194, { size: 20, weight: 700, lineHeight: 28 })}
  ${svgText(['ENCODER'], 306, 158, { size: 14, fill: '#d9a3df', weight: 700 })}
  ${svgText(['ViT or Swin', 'backbone'], 306, 194, { size: 20, weight: 700, lineHeight: 28 })}
  ${svgText(['LIGHT HEAD'], 544, 158, { size: 14, fill: '#8fd29a', weight: 700 })}
  ${svgText(['A single', 'linear layer'], 544, 194, { size: 20, weight: 700, lineHeight: 28 })}
  ${svgText(['TARGET'], 782, 158, { size: 14, fill: '#efb97b', weight: 700 })}
  ${svgText(['Raw RGB', 'pixels'], 782, 194, { size: 20, weight: 700, lineHeight: 28 })}
  <rect x="48" y="292" width="864" height="88" rx="8" fill="#172536" stroke="#6b8298" stroke-width="2"/>
  ${svgText(['WHAT SIMMIM REMOVES'], 70, 326, { size: 15, fill: '#8fc4eb', weight: 700 })}
  ${svgText(['No discrete VAE tokenizer  |  No clustering target  |  No heavy prediction decoder'], 70, 359, { size: 20, weight: 700 })}
  <rect x="48" y="428" width="412" height="78" rx="8" fill="#1a3a32" stroke="#62aa8c" stroke-width="2"/>
  <rect x="500" y="428" width="412" height="78" rx="8" fill="#3b2e1d" stroke="#d89b58" stroke-width="2"/>
  ${svgText(['REPRESENTATION'], 70, 459, { size: 14, fill: '#91d7bb', weight: 700 })}
  ${svgText(['Learn by reconstructing masked pixels'], 70, 489, { size: 19, weight: 700 })}
  ${svgText(['SCALE'], 522, 459, { size: 14, fill: '#efb97b', weight: 700 })}
  ${svgText(['From ViT-B to a 3B SwinV2-G model'], 522, 489, { size: 19, weight: 700 })}
</svg>\n`;
}

function buildScalingVitSvg() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="560" viewBox="0 0 960 560" role="img" aria-labelledby="title desc">
  <title id="title">Scaling Vision Transformers</title>
  <desc id="desc">Original local explainer showing the coordinated scaling of model size, training data and compute, the memory-efficient training recipe, and the reported ViT-G results.</desc>
  <rect width="960" height="560" fill="#0d1722"/>
  <text x="48" y="55" fill="#f4f7fb" font-family="Arial, sans-serif" font-size="30" font-weight="700">Scaling Vision Transformers</text>
  <text x="48" y="86" fill="#a9bdd0" font-family="Arial, sans-serif" font-size="17">Model, data and compute must move together</text>
  <rect x="48" y="126" width="220" height="116" rx="8" fill="#19324b" stroke="#65a9dc" stroke-width="2"/>
  <rect x="370" y="126" width="220" height="116" rx="8" fill="#263528" stroke="#74b77d" stroke-width="2"/>
  <rect x="692" y="126" width="220" height="116" rx="8" fill="#3b2e1d" stroke="#d89b58" stroke-width="2"/>
  <path d="M268 184 H370 M590 184 H692" stroke="#dce8f2" stroke-width="4" fill="none"/>
  <path d="M352 175 L370 184 L352 193 M674 175 L692 184 L674 193" stroke="#dce8f2" stroke-width="4" fill="none"/>
  ${svgText(['MODEL SIZE'], 70, 159, { size: 14, fill: '#8fc4eb', weight: 700 })}
  ${svgText(['5M to 2B', 'parameters'], 70, 196, { size: 22, weight: 700, lineHeight: 28 })}
  ${svgText(['TRAINING DATA'], 392, 159, { size: 14, fill: '#8fd29a', weight: 700 })}
  ${svgText(['1M to 3B', 'images'], 392, 196, { size: 22, weight: 700, lineHeight: 28 })}
  ${svgText(['COMPUTE'], 714, 159, { size: 14, fill: '#efb97b', weight: 700 })}
  ${svgText(['Below 1 to 10K+', 'TPUv3 core-days'], 714, 196, { size: 20, weight: 700, lineHeight: 27 })}
  <rect x="48" y="290" width="864" height="86" rx="8" fill="#2d2530" stroke="#c087c9" stroke-width="2"/>
  ${svgText(['LARGE-SCALE TRAINING RECIPE'], 70, 324, { size: 15, fill: '#d9a3df', weight: 700 })}
  ${svgText(['Decoupled head/body weight decay  |  MAP pooling  |  Modified Adafactor'], 70, 355, { size: 19, weight: 700 })}
  <rect x="48" y="424" width="412" height="88" rx="8" fill="#1a3a32" stroke="#62aa8c" stroke-width="2"/>
  <rect x="500" y="424" width="412" height="88" rx="8" fill="#3b2e1d" stroke="#d89b58" stroke-width="2"/>
  ${svgText(['ViT-G / 14'], 70, 457, { size: 14, fill: '#91d7bb', weight: 700 })}
  ${svgText(['90.45% ImageNet top-1'], 70, 490, { size: 22, weight: 700 })}
  ${svgText(['10-SHOT TRANSFER'], 522, 457, { size: 14, fill: '#efb97b', weight: 700 })}
  ${svgText(['84.86% ImageNet top-1'], 522, 490, { size: 22, weight: 700 })}
</svg>\n`;
}

function buildEventResearchSvg(eventResearch, item, index, year) {
    if (eventResearch && eventResearch.recordSvgSource) {
        const sourcePath = path.resolve(ROOT, eventResearch.recordSvgSource);
        const researchDir = EVENT_RESEARCH_DIRS.get(year);
        if (!researchDir) throw new Error(`No per-event research directory is configured for year ${year}.`);
        const relativeToResearchDir = path.relative(researchDir, sourcePath);
        if (relativeToResearchDir.startsWith('..') || path.isAbsolute(relativeToResearchDir)) {
            throw new Error(`recordSvgSource must stay inside ${path.relative(ROOT, researchDir)}`);
        }
        if (!fs.existsSync(sourcePath)) {
            throw new Error(`recordSvgSource does not exist: ${path.relative(ROOT, sourcePath)}`);
        }
        return fs.readFileSync(sourcePath, 'utf8');
    }
    const visualKind = eventResearch && eventResearch.visualKind;
    if (visualKind === 'swin-transformer-v2') return buildSwinTransformerV2Svg();
    if (visualKind === 'simmim') return buildSimMimSvg();
    if (visualKind === 'scaling-vit') return buildScalingVitSvg();
    return buildRecordSvg(item, index);
}

function collectExistingChineseNames(targetEventId = '') {
    const map = new Map();
    const eventsRoot = path.join(ROOT, 'archive', 'events');
    function visit(value) {
        if (!value || typeof value !== 'object') return;
        if (
            value.name &&
            typeof value.name === 'object' &&
            value.name.en &&
            value.name.zh &&
            /[\u3400-\u9fff]/.test(value.name.zh)
        ) {
            map.set(normalizeKey(value.name.en), value.name.zh);
        }
        for (const child of Object.values(value)) visit(child);
    }
    const eventIds = targetEventId ? [targetEventId] : fs.readdirSync(eventsRoot);
    for (const eventId of eventIds) {
        const eventDir = path.join(eventsRoot, eventId);
        if (!fs.existsSync(eventDir)) continue;
        const files = ['event.json'];
        const variantsDir = path.join(eventDir, 'variants');
        if (fs.existsSync(variantsDir)) {
            files.push(
                ...fs
                    .readdirSync(variantsDir)
                    .filter((file) => file.endsWith('.json'))
                    .map((file) => `variants/${file}`)
            );
        }
        for (const file of files) {
            try {
                visit(readJson(path.join(eventDir, file)));
            } catch {
                // Archive validation reports malformed files separately.
            }
        }
    }
    return map;
}

function contributorNameZh(name, existingNames) {
    return existingNames.get(normalizeKey(name)) || `${name}（官方页拼写）`;
}

function localizeInstitution(value) {
    return String(value || '')
        .replace(/\s*,\s*/g, '、')
        .replace(/Microsoft Research Asia/g, '微软亚洲研究院')
        .replace(/Tsinghua University/g, '清华大学')
        .replace(/Peking University/g, '北京大学')
        .replace(/Nanjing University/g, '南京大学')
        .replace(/The University of Hong Kong/g, '香港大学')
        .replace(/Shanghai AI Lab/g, '上海人工智能实验室')
        .replace(/University of Tokyo/g, '东京大学')
        .replace(/The University of Tokyo/g, '东京大学')
        .replace(/HKUST/g, '香港科技大学')
        .replace(/ICT CAS/g, '中国科学院计算技术研究所')
        .replace(/UC Berkeley/g, '加州大学伯克利分校')
        .replace(/MIT/g, '麻省理工学院')
        .replace(/CMU/g, '卡内基梅隆大学')
        .replace(/Google DeepMind/g, 'Google DeepMind')
        .replace(/DeepMind/g, 'DeepMind')
        .replace(/OpenAI/g, 'OpenAI')
        .replace(/Meta/g, 'Meta')
        .replace(/Google/g, 'Google')
        .replace(/NVIDIA/g, 'NVIDIA');
}

function localizeCountries(value) {
    return String(value || '')
        .split(',')
        .map((country) => country.trim())
        .filter(Boolean)
        .map((country) => COUNTRY_ZH[country] || country)
        .join('、');
}

function normalizeCountriesEn(value) {
    return String(value || '')
        .split(',')
        .map((country) => country.trim())
        .filter(Boolean)
        .map((country) => COUNTRY_EN[country] || country)
        .join(', ');
}

function buildLocation(item) {
    const primaryCountry = String(item.country || '')
        .split(',')[0]
        .trim();
    const details = COUNTRY_DETAILS[primaryCountry] || { regionId: 'global', coordinates: [] };
    return {
        regionId: details.regionId,
        country: {
            en: normalizeCountriesEn(item.country) || 'Not listed',
            zh: localizeCountries(item.country) || '未列出'
        },
        place: { en: item.institution || 'Not listed', zh: localizeInstitution(item.institution) || '未列出' },
        coordinates: details.coordinates
    };
}

function sourceUrlFromMatch(item, metadataItem) {
    const match = metadataItem && metadataItem.match;
    return (
        OFFICIAL_WORK_OVERRIDES[item.work] ||
        (match && (match.doi || match.landingPageUrl || match.openAccessUrl)) ||
        `https://scholar.google.com/scholar?q=${encodeURIComponent(`"${item.publication || item.work}"`)}`
    );
}

function openAlexUrl(item, metadataItem) {
    return (
        (metadataItem && metadataItem.match && metadataItem.match.id) ||
        `https://api.openalex.org/works?search=${encodeURIComponent(item.publication || item.work)}`
    );
}

function publicationYear(item, metadataItem) {
    const matchYear = Number(metadataItem && metadataItem.match && metadataItem.match.publicationYear);
    if (YEAR_OVERRIDES[item.work]) return YEAR_OVERRIDES[item.work];
    return matchYear >= 2020 && matchYear <= 2024 ? matchYear : 2023;
}

function sourceTitle(item) {
    return item.publication || `${item.work} official project page`;
}

function zhSourceTitle(item) {
    return item.publication ? `《${item.publication}》` : `${item.work} 官方项目页面`;
}

function buildSources(item, metadataItem) {
    const hasOfficialOverride = Boolean(OFFICIAL_WORK_OVERRIDES[item.work]);
    const hasPublicationMatch = Boolean(metadataItem && metadataItem.match);
    const hasPrimaryRecord = hasOfficialOverride || hasPublicationMatch;
    const primaryUrl = sourceUrlFromMatch(item, metadataItem);
    return [
        {
            id: 'source-primary-record',
            type: hasOfficialOverride ? 'official-page' : hasPublicationMatch ? 'paper-page' : 'paper-index',
            label: {
                en: hasOfficialOverride ? 'Official page' : hasPublicationMatch ? 'Paper page' : 'Paper index',
                zh: hasOfficialOverride ? '官方页面' : hasPublicationMatch ? '论文页面' : '论文索引'
            },
            title: { en: sourceTitle(item), zh: zhSourceTitle(item) },
            authors: String(item.contributors || '')
                .split(',')
                .map((name) => name.trim())
                .filter(Boolean),
            year: publicationYear(item, metadataItem),
            url: primaryUrl,
            language: 'en',
            purpose: hasPrimaryRecord ? 'core-evidence' : 'bibliographic-verification',
            reliability: hasPrimaryRecord ? 'primary' : 'reference-only',
            notes: {
                en: hasPrimaryRecord
                    ? 'Publication or official work page resolved from the exact title in the BenchCouncil annual table.'
                    : 'Exact-title search retained transparently because the public metadata API did not return a verified landing page during this sync.',
                zh: hasPrimaryRecord
                    ? '依据 BenchCouncil 年度表中的准确标题解析出的论文或官方项目页面。'
                    : '公共元数据 API 在本次同步中未返回可核验落地页，因此透明保留精确标题检索链接。'
            }
        },
        {
            id: 'source-openalex-record',
            type: 'paper-index',
            label: { en: 'Paper index', zh: '论文索引' },
            title: {
                en: `OpenAlex record for ${item.publication || item.work}`,
                zh: `${item.publication || item.work} 的 OpenAlex 文献记录`
            },
            url: openAlexUrl(item, metadataItem),
            language: 'en',
            purpose: 'bibliographic-verification',
            reliability: 'secondary',
            notes: {
                en: 'Bibliographic metadata used to verify the publication year and landing page.',
                zh: '用于核对出版年份与落地页面的书目元数据。'
            }
        },
        {
            id: 'source-benchcouncil-annual',
            type: 'official-page',
            label: { en: 'Official page', zh: '官方页面' },
            title: { en: 'AI100: Top 100 AI achievements (2022-2023)', zh: 'AI100：人工智能百大成就（2022-2023）' },
            url: SOURCE_URL,
            language: 'en',
            purpose: 'core-evidence',
            reliability: 'primary',
            notes: {
                en: 'Authority for annual membership, official work name, order, contributors, institution, country, and citation field.',
                zh: '年度成员、官方成果名称、顺序、主要人物、机构、国家与引用数字段的权威依据。'
            }
        }
    ];
}

function buildFigures(item, existingNames) {
    return String(item.contributors || '')
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) => ({
            figureId: slugify(name),
            name: { en: name, zh: contributorNameZh(name, existingNames) },
            role: {
                en: `Main author or contributor to ${item.work}`,
                zh: `${item.work} 主要作者或贡献者`
            },
            organizationIds: []
        }));
}

function loadPortraitResearch() {
    if (!fs.existsSync(PORTRAIT_RESEARCH_PATH)) return new Map();
    const research = readJson(PORTRAIT_RESEARCH_PATH);
    return new Map(
        (research.people || [])
            .filter((person) => person.selectedImage && /^selected-/.test(person.status || ''))
            .map((person) => [normalizeKey(person.name && person.name.en), person])
    );
}

function loadEventResearch(year, targetEventId = '') {
    const result = new Map();
    if (year === 2022 && fs.existsSync(EVENT_RESEARCH_2022_PATH)) {
        const research = readJson(EVENT_RESEARCH_2022_PATH);
        if (research.scopeYear !== 2022 || !research.events || typeof research.events !== 'object') {
            throw new Error(`${path.relative(ROOT, EVENT_RESEARCH_2022_PATH)} must declare scopeYear 2022 and events.`);
        }
        for (const [eventId, eventResearch] of Object.entries(research.events)) {
            if (!targetEventId || eventId === targetEventId) result.set(eventId, eventResearch);
        }
    }
    const researchDir = EVENT_RESEARCH_DIRS.get(year);
    if (!researchDir || !fs.existsSync(researchDir)) return result;
    const files = targetEventId
        ? [`${targetEventId}.json`]
        : fs
              .readdirSync(researchDir)
              .filter((file) => file.endsWith('.json'))
              .sort();
    for (const file of files) {
        const filePath = path.join(researchDir, file);
        if (!fs.existsSync(filePath)) continue;
        const eventResearch = readJson(filePath);
        const eventId = eventResearch.eventId || path.basename(file, '.json');
        if (eventId !== path.basename(file, '.json')) {
            throw new Error(`${path.relative(ROOT, filePath)} eventId must match its filename.`);
        }
        if (!eventId.startsWith('ai100-annual-2022-2023-')) {
            throw new Error(`${path.relative(ROOT, filePath)} has an invalid annual eventId.`);
        }
        result.set(eventId, eventResearch);
    }
    return result;
}

function applyFigureResearch(figures, eventResearch) {
    if (!eventResearch) return figures;
    const researchPeople = Array.isArray(eventResearch.people) ? eventResearch.people : [];
    const people = new Map(researchPeople.map((person) => [normalizeKey(person.name.en), person]));
    const result = figures.map((figure) => {
        const person = people.get(normalizeKey(figure.name.en));
        if (!person) return figure;
        return {
            ...figure,
            name: person.name,
            role: person.role || figure.role
        };
    });
    const canonicalNames = new Set(result.map((figure) => normalizeKey(figure.name.en)));
    for (const person of researchPeople) {
        if (person.displayInFigures === false) continue;
        const normalizedName = normalizeKey(person.name && person.name.en);
        if (!normalizedName || canonicalNames.has(normalizedName)) continue;
        result.push({
            figureId: slugify(person.name.en),
            name: person.name,
            role: person.role,
            organizationIds: []
        });
        canonicalNames.add(normalizedName);
    }
    for (const displayFigure of eventResearch.displayFigures || []) {
        const normalizedName = normalizeKey(displayFigure.name && displayFigure.name.en);
        if (!normalizedName || canonicalNames.has(normalizedName)) continue;
        result.push({
            figureId: displayFigure.figureId || slugify(displayFigure.name.en),
            name: displayFigure.name,
            role: displayFigure.role,
            figureType: displayFigure.figureType || 'product',
            avatar: displayFigure.avatar || '',
            organizationIds: displayFigure.organizationIds || []
        });
        canonicalNames.add(normalizedName);
    }
    return result;
}

function appendUniqueSources(sources, additionalSources) {
    const result = [...sources];
    const ids = new Set(result.map((source) => source.id));
    for (const source of additionalSources || []) {
        if (ids.has(source.id)) throw new Error(`Duplicate event research source id: ${source.id}`);
        ids.add(source.id);
        result.push(source);
    }
    return result;
}

function applySourceOverrides(sources, sourceOverrides) {
    if (!sourceOverrides || typeof sourceOverrides !== 'object') return sources;
    return sources.map((source) =>
        sourceOverrides[source.id] ? mergeObjects(source, sourceOverrides[source.id]) : source
    );
}

function selectEventPortrait(figures, portraitResearch, eventResearch) {
    const hasEventPortraitDecision = Boolean(
        eventResearch && Object.prototype.hasOwnProperty.call(eventResearch, 'selectedPortrait')
    );
    const selectedPortrait = hasEventPortraitDecision && eventResearch.selectedPortrait;
    if (hasEventPortraitDecision && !selectedPortrait) return null;
    if (selectedPortrait && selectedPortrait.personName && selectedPortrait.image) {
        const figure = figures.find(
            (candidate) => normalizeKey(candidate.name.en) === normalizeKey(selectedPortrait.personName)
        );
        if (!figure) {
            throw new Error(`Selected portrait person is not an official contributor: ${selectedPortrait.personName}`);
        }
        figure.avatar = selectedPortrait.image.path;
        return { figure, research: selectedPortrait, image: selectedPortrait.image };
    }
    for (const figure of figures) {
        const research = portraitResearch.get(normalizeKey(figure.name.en));
        if (!research || !research.selectedImage) continue;
        figure.avatar = research.selectedImage.path;
        return { figure, research, image: research.selectedImage };
    }
    return null;
}

function buildPortraitSource(portrait, sourceId) {
    const { figure, image } = portrait;
    const reliability = /^(?:primary|user-provided)/.test(image.reliability || '') ? 'primary' : 'secondary';
    return {
        id: sourceId,
        type: 'image-source',
        label: { en: 'Image source', zh: '图片来源' },
        title: {
            en: `${figure.name.en} portrait source`,
            zh: `${figure.name.zh}人物图片来源`
        },
        url: image.sourceUrl || image.path,
        language: 'und',
        purpose: 'image-provenance',
        reliability,
        notes: {
            en: `${image.notes.en} Reliability: ${image.reliability}. Usage note: ${image.license.en}`,
            zh: `${image.notes.zh} 可靠性：${image.reliability}。使用备注：${image.license.zh}`
        }
    };
}

function buildPortraitAsset(portrait, assetId, sourceId) {
    const { figure, image } = portrait;
    return {
        id: assetId,
        type: 'image',
        path: image.path,
        role: 'portrait',
        caption: { en: `${figure.name.en} portrait`, zh: `${figure.name.zh}肖像` },
        subcaption: figure.role,
        sourceId,
        sourceName: image.sourceName,
        sourceUrl: image.sourceUrl || image.path,
        sourceReliability: image.reliability,
        provenanceNotes: image.notes,
        rights: {
            status: image.usageStatus,
            license: image.license,
            attribution: image.attribution || ''
        },
        displayUsage: { en: 'Verified contributor portrait', zh: '已核验的主要人物肖像' },
        usage: [`variant:${STORYLINE_ID}`],
        editable: false
    };
}

function enrichPortraitAssets(figures, assets, eventResearch) {
    const people = new Map(
        ((eventResearch && eventResearch.people) || []).map((person) => [normalizeKey(person.name.en), person])
    );
    for (const asset of assets) {
        if (!asset || asset.role !== 'portrait') continue;
        const figure = figures.find((candidate) => assetMatchesFigure(asset, candidate));
        if (figure && !figure.avatar) figure.avatar = asset.path;
        const person = figure ? people.get(normalizeKey(figure.name.en)) : null;
        if (!asset.sourceReliability) {
            asset.sourceReliability =
                (person && person.portraitSearch && person.portraitSearch.reliability) || 'verified-image-source';
        }
        if (!asset.provenanceNotes) {
            asset.provenanceNotes = (person && person.verification && person.verification.notes) || {
                en: `The portrait identity and source were checked against ${asset.sourceUrl || asset.path}.`,
                zh: `该肖像的人物身份与来源已通过 ${asset.sourceUrl || asset.path} 核验。`
            };
        }
    }
}

function buildDisplayDescription(item, contributorsZh) {
    const contributorSentence = item.contributors
        ? `The page names ${item.contributors} as the main contributors.`
        : 'The page leaves the Main Contributors field blank, so this record does not infer individual names.';
    const contributorSentenceZh = item.contributors
        ? `页面把 ${contributorsZh} 列为主要人物。`
        : '页面的“主要人物”字段为空，因此本记录不自行补充个人姓名。';
    const publicationSentence = item.publication
        ? `It associates the work with the publication “${item.publication}”.`
        : 'It does not list a publication title for this row.';
    const publicationSentenceZh = item.publication
        ? `该条目关联论文《${item.publication}》。`
        : '该行没有列出论文标题。';
    return {
        en: `<p>BenchCouncil lists ${item.work} in the ${item.area} area of its AI100 (2022-2023) annual table. ${publicationSentence} ${contributorSentence}</p><p>This Archive record preserves the official row order, citation value, institution, and country fields. It represents the annual 2022-2023 selection and remains separate from the long-term canonical AI100 storyline.</p>`,
        zh: `<p>BenchCouncil 在 AI100（2022-2023）年度表的“${AREA_ZH[item.area] || item.area}”领域列出 ${item.work}。${publicationSentenceZh}${contributorSentenceZh}</p><p>本 Archive 记录保留官方行序、引用数、机构和国家字段。它表示 2022-2023 年度入选记录，与长期 canonical AI100 故事线分开维护。</p>`
    };
}

function buildVisualModule(item, primaryUrl) {
    return {
        type: 'archiveLink',
        site: {
            en: item.publication ? 'Primary publication' : 'Official project page',
            zh: item.publication ? '主论文' : '官方项目页面'
        },
        title: { en: sourceTitle(item), zh: zhSourceTitle(item) },
        description: {
            en: item.publication
                ? 'Publication associated with this work by the BenchCouncil annual table.'
                : 'Official page associated with this work.',
            zh: item.publication ? 'BenchCouncil 年度表为该成果关联的论文。' : '与该成果关联的官方页面。'
        },
        url: primaryUrl,
        source: primaryUrl,
        license: {
            en: 'Reference link only; local visuals are original redraws.',
            zh: '仅作为参考链接；本地视觉图为原创重绘。'
        },
        usage: { en: 'Publication and evidence reference', zh: '论文与证据参考' },
        action: {
            en: item.publication ? 'Open publication' : 'Open project page',
            zh: item.publication ? '打开论文' : '打开项目页面'
        }
    };
}

function buildCommentary(item, contributorsZh) {
    const contributorText = item.contributors
        ? `${item.contributors} are preserved in the same order as the Main Contributors cell. The institution field is ${item.institution}.`
        : `The Main Contributors cell is blank, and the Archive deliberately leaves the person list empty. The institution field is ${item.institution}.`;
    const contributorTextZh = item.contributors
        ? `${contributorsZh} 按“主要人物”单元格中的相同顺序显示。官方英文拼写与顺序保存在年度记录中，机构字段为 ${localizeInstitution(item.institution)}。`
        : `“主要人物”单元格为空，Archive 因此有意保留空人物列表。机构字段为 ${localizeInstitution(item.institution)}。`;
    return [
        {
            id: 'historical-background',
            label: { en: 'Historical Background', zh: '历史背景' },
            html: {
                en: `BenchCouncil published this row as part of its AI100 (2022-2023) annual selection in the ${item.area} area. The annual list captures a time-bounded view of prominent recent work rather than the membership of the long-term AI100 table.`,
                zh: `BenchCouncil 把该行发布在 AI100（2022-2023）年度入选表的“${AREA_ZH[item.area] || item.area}”领域中。年度表记录的是当时对近期代表性工作的阶段性观察，不等同于长期 AI100 主表成员。`
            },
            sourceIds: ['source-benchcouncil-annual']
        },
        {
            id: 'core-idea',
            label: { en: 'Core Idea', zh: '核心思想' },
            html: {
                en: item.publication
                    ? `The official work name is ${item.work}, linked by the table to “${item.publication}”. ${contributorText}`
                    : `The official work name is ${item.work}, and the table does not provide a publication title. ${contributorText}`,
                zh: item.publication
                    ? `官方成果名称为 ${item.work}，表格将其关联到论文《${item.publication}》。${contributorTextZh}`
                    : `官方成果名称为 ${item.work}，表格没有提供论文标题。${contributorTextZh}`
            },
            sourceIds: ['source-primary-record', 'source-benchcouncil-annual']
        },
        {
            id: 'long-term-legacy',
            label: { en: 'Long-Term Legacy', zh: '长期影响' },
            html: {
                en: `Experts should treat this record as evidence of BenchCouncil's 2022-2023 annual assessment, not as a permanent consensus ranking. Its lasting archival value is the exact preservation of the work name, publication link, contributor field, institution, country, citation value, and source order.`,
                zh: `专家应把本记录视为 BenchCouncil 对 2022-2023 年度成果的阶段性评价证据，而不是永久共识排名。它的长期档案价值在于准确保留成果名称、论文线索、人物字段、机构、国家、引用数与来源顺序。`
            },
            sourceIds: ['source-benchcouncil-annual']
        }
    ];
}

function buildQuiz(item, allAreas, eventId, recordAssetId) {
    const distractors = allAreas.filter((area) => area !== item.area).slice(0, 3);
    const options = [item.area, ...distractors];
    return [
        {
            id: `${eventId}-quiz-1`,
            storylineId: STORYLINE_ID,
            question: {
                en: `Which area does the BenchCouncil annual table assign to ${item.work}?`,
                zh: `BenchCouncil 年度表把 ${item.work} 归入哪个领域？`
            },
            options: options.map((area) => ({ en: area, zh: AREA_ZH[area] || area })),
            answer: 0,
            explanation: {
                en: `${item.work} appears in the ${item.area} area of the official annual table.`,
                zh: `${item.work} 位于官方年度表的“${AREA_ZH[item.area] || item.area}”领域。`
            },
            sourceIds: ['source-benchcouncil-annual'],
            assetIds: [recordAssetId]
        }
    ];
}

function buildEventBundle(
    item,
    metadataItem,
    index,
    existingNames,
    allAreas,
    portraitResearch,
    eventResearchByEventId
) {
    const slug = slugify(item.work);
    const eventId = eventIdForItem(item, index);
    const assetPrefix = `annual-${String(index).padStart(3, '0')}-${slug}`;
    const recordAssetId = `asset-${assetPrefix}-record`;
    const recordPath = `resources/images/benchcouncil-ai100-annual/${assetPrefix}_record.svg`;
    const year = publicationYear(item, metadataItem);
    const eventResearch = eventResearchByEventId.get(eventId) || null;
    const figures = applyFigureResearch(buildFigures(item, existingNames), eventResearch);
    const portrait = selectEventPortrait(figures, portraitResearch, eventResearch);
    const portraitAssetId = portrait ? `asset-${assetPrefix}-portrait-${slugify(portrait.figure.name.en)}` : '';
    const portraitSourceId = portrait ? `source-${assetPrefix}-portrait-${slugify(portrait.figure.name.en)}` : '';
    let sources = buildSources(item, metadataItem);
    if (portrait) sources.push(buildPortraitSource(portrait, portraitSourceId));
    sources = applySourceOverrides(sources, eventResearch && eventResearch.sourceOverrides);
    sources = appendUniqueSources(sources, eventResearch && eventResearch.additionalSources);
    const primaryUrl = sources[0].url;
    const contributorsZh = figures.map((figure) => figure.name.zh).join('、');
    const description = (eventResearch && eventResearch.description) || buildDisplayDescription(item, contributorsZh);
    const location = (eventResearch && eventResearch.location) || buildLocation(item);
    const visualModule = (eventResearch && eventResearch.visualModule) || buildVisualModule(item, primaryUrl);

    const event = {
        id: eventId,
        year,
        date: String(year),
        title: { en: item.work, zh: item.work },
        summary: (eventResearch && eventResearch.summary) || {
            en: `BenchCouncil AI100 (2022-2023) annual entry in ${item.area}`,
            zh: `BenchCouncil AI100（2022-2023）${AREA_ZH[item.area] || item.area}年度条目`
        },
        description,
        location,
        topics: ['bench-council-ai100-annual-2022-2023'],
        achievementTypeIds: ['ai100-annual-achievement'],
        figures,
        organizations: [],
        canonical: false,
        review: {
            status: 'reviewed',
            notes: (eventResearch && eventResearch.reviewNotes) || {
                en: `Synchronized from BenchCouncil annual row ${index} on 2026-08-03; official field spelling and contributor order are preserved.`,
                zh: `于 2026-08-03 从 BenchCouncil 年度表第 ${index} 行同步；保留官方字段拼写与主要人物顺序。`
            }
        }
    };

    const claims = [
        {
            id: 'claim-annual-membership',
            importance: 'core',
            text: {
                en: `${item.work} is row ${index} of the BenchCouncil AI100 (2022-2023) annual table in the ${item.area} area.`,
                zh: `${item.work} 是 BenchCouncil AI100（2022-2023）年度表第 ${index} 行，所属领域为“${AREA_ZH[item.area] || item.area}”。`
            },
            sourceIds: ['source-benchcouncil-annual'],
            status: 'verified'
        },
        {
            id: 'claim-publication-record',
            importance: 'display',
            text: {
                en: item.publication
                    ? `The annual table associates ${item.work} with “${item.publication}”.`
                    : `The annual table leaves the publication field blank for ${item.work}.`,
                zh: item.publication
                    ? `年度表把 ${item.work} 与论文《${item.publication}》关联。`
                    : `年度表中 ${item.work} 的论文标题字段为空。`
            },
            sourceIds: ['source-primary-record', 'source-benchcouncil-annual'],
            status: 'verified'
        },
        {
            id: 'claim-contributor-record',
            importance: 'display',
            text: {
                en: item.contributors
                    ? `The Main Contributors field is “${item.contributors}”.`
                    : 'The Main Contributors field is blank.',
                zh: item.contributors
                    ? `“主要人物”字段依次列出 ${contributorsZh}；官方英文原文为“${item.contributors}”。`
                    : '“主要人物”字段为空。'
            },
            sourceIds: ['source-benchcouncil-annual'],
            status: 'verified'
        }
    ];
    if (eventResearch && Array.isArray(eventResearch.additionalClaims)) {
        claims.push(...eventResearch.additionalClaims);
    }

    const assets = [
        ...(portrait ? [buildPortraitAsset(portrait, portraitAssetId, portraitSourceId)] : []),
        {
            id: recordAssetId,
            type: 'svg',
            path: recordPath,
            role: 'annual-achievement-explainer',
            caption: { en: `${item.work} annual evidence map`, zh: `${item.work} 年度证据图` },
            subcaption: {
                en: 'Original local explainer connecting the official work, area, publication, citation, and country fields.',
                zh: '连接官方成果名称、领域、论文、引用数与国家字段的本地原创解释图。'
            },
            sourceIds: ['source-primary-record', 'source-benchcouncil-annual'],
            sourceName: { en: 'BenchCouncil and publication metadata', zh: 'BenchCouncil 与论文元数据' },
            sourceUrl: SOURCE_URL,
            rights: {
                status: 'original-redraw',
                license: {
                    en: 'Original local SVG; source figures are not copied.',
                    zh: '本地原创 SVG；未复制来源图形。'
                },
                usage: { en: 'Display and educational use in this project.', zh: '用于本项目展示与教育用途。' }
            },
            displayUsage: { en: 'Annual record explainer', zh: '年度记录解释图' },
            usage: [`variant:${STORYLINE_ID}`],
            editable: true
        }
    ];
    if (eventResearch && eventResearch.recordAsset) {
        assets[assets.length - 1] = mergeObjects(assets[assets.length - 1], eventResearch.recordAsset);
    }
    if (eventResearch && Array.isArray(eventResearch.supplementaryAssets)) {
        const knownAssetIds = new Set(assets.map((asset) => asset.id));
        for (const asset of eventResearch.supplementaryAssets) {
            if (!asset || !asset.id || knownAssetIds.has(asset.id)) continue;
            assets.push(asset);
            knownAssetIds.add(asset.id);
        }
    }
    enrichPortraitAssets(figures, assets, eventResearch);

    const defaultAssetIds = [...(portrait ? [portraitAssetId] : []), recordAssetId];
    const requestedAssetIds =
        eventResearch && Array.isArray(eventResearch.assetIds) && eventResearch.assetIds.length
            ? eventResearch.assetIds
            : defaultAssetIds;
    const selectedAssetIds = orderVariantAssetIds(event, { assetIds: requestedAssetIds }, assets).assetIds;
    const requestedOverviewImageAssetId = eventResearch && eventResearch.overviewImageAssetId;
    if (requestedOverviewImageAssetId && requestedOverviewImageAssetId !== selectedAssetIds[0]) {
        throw new Error(
            `${eventId} overviewImageAssetId must match the first asset after media-type ordering: ${selectedAssetIds[0]}`
        );
    }
    const overviewImageAssetId = selectedAssetIds[0] || recordAssetId;

    const demoText = item.publication
        ? `Explore the central method behind ${item.work} and connect it to the evidence reported in its primary publication.`
        : `Explore the central method behind ${item.work} through its official project materials and supporting evidence.`;
    const demoTextZh = item.publication
        ? `探索 ${item.work} 的核心方法，并把关键步骤与原始论文中的证据对应起来。`
        : `通过官方项目材料与补充证据探索 ${item.work} 的核心方法。`;

    const variant = {
        storylineId: STORYLINE_ID,
        eventId,
        presentationMode: 'archive',
        displayTitle: { en: item.work, zh: item.work },
        displaySummary: (eventResearch && eventResearch.displaySummary) || {
            en: `AI100 (2022-2023) · ${item.area}`,
            zh: `AI100（2022-2023）· ${AREA_ZH[item.area] || item.area}`
        },
        displayDescription: description,
        emphasis: ['benchcouncil-annual-2022-2023', `official-row-${index}`],
        visual: 'configuredPaper',
        visualModules: [visualModule],
        assetIds: selectedAssetIds,
        overviewImageAssetId,
        sourceIds: sources.map((source) => source.id),
        claimIds: claims.map((claim) => claim.id),
        quizId: `${eventId}-quiz-1`,
        commentarySections:
            (eventResearch && eventResearch.commentarySections) || buildCommentary(item, contributorsZh),
        category: { en: 'BenchCouncil AI100 (2022-2023)', zh: 'BenchCouncil AI100（2022-2023）' },
        figures: figures.map((figure) => ({
            name: figure.name,
            role: figure.role,
            figureType: figure.figureType || 'person',
            avatar: figure.avatar || ''
        })),
        quote: { en: item.publication || item.work, zh: item.publication ? `《${item.publication}》` : item.work },
        quoteMeta: {
            speaker: '',
            workTitle: { en: sourceTitle(item), zh: zhSourceTitle(item) },
            workAuthors: {
                en: item.contributors || item.institution,
                zh: contributorsZh || localizeInstitution(item.institution)
            },
            sourceLabel: '',
            sourceUrl: primaryUrl
        },
        quotePage: item.publication
            ? { en: 'Primary publication record', zh: '原始论文记录' }
            : { en: 'Official project record', zh: '官方项目记录' },
        quoteAttribution: { en: sourceTitle(item), zh: zhSourceTitle(item) },
        achievement: mergeObjects(
            {
                area: { en: item.area, zh: AREA_ZH[item.area] || item.area },
                method: { en: 'Annual selection record', zh: '年度入选记录' },
                artifact: { en: item.work, zh: item.work },
                material: {
                    en: item.publication || 'Official annual row and project page',
                    zh: item.publication ? `《${item.publication}》与官方年度行` : '官方年度行与项目页面'
                },
                demo: { en: demoText, zh: demoTextZh },
                keyConcepts: [
                    { label: { en: 'Official Work', zh: '官方成果名称' }, text: { en: item.work, zh: item.work } },
                    {
                        label: { en: 'Main Contributors', zh: '主要人物' },
                        text: { en: item.contributors || 'Not listed', zh: contributorsZh || '未列出' }
                    },
                    {
                        label: { en: 'Institution', zh: '机构' },
                        text: { en: item.institution, zh: localizeInstitution(item.institution) }
                    }
                ],
                relatedAchievements: [],
                relatedRegions: String(item.country || '')
                    .split(',')
                    .map((country) => country.trim())
                    .filter(Boolean)
                    .map((country) => ({ en: COUNTRY_EN[country] || country, zh: COUNTRY_ZH[country] || country })),
                demoSteps: [
                    { en: 'Official work', zh: '官方成果名称' },
                    { en: 'Publication record', zh: '论文记录' },
                    { en: 'Contributors and institution', zh: '主要人物与机构' }
                ],
                demoImage: recordPath,
                demoNotes: [
                    {
                        label: { en: 'Source cue', zh: '资料线索' },
                        text: {
                            en: item.publication || 'BenchCouncil annual row and official work page',
                            zh: item.publication
                                ? `《${item.publication}》与 BenchCouncil 年度行`
                                : 'BenchCouncil 年度行与官方项目页面'
                        }
                    },
                    { label: { en: 'Interaction point', zh: '互动点' }, text: { en: demoText, zh: demoTextZh } }
                ],
                visualModules: [visualModule],
                annualRecord: {
                    officialOrder: index,
                    area: item.area,
                    work: item.work,
                    publication: item.publication,
                    citation: item.citation,
                    contributors: item.contributors,
                    institution: item.institution,
                    country: item.country,
                    sourceUrl: SOURCE_URL
                }
            },
            (eventResearch && eventResearch.achievement) || {}
        ),
        location: {
            name: location.place,
            country: location.country,
            coordinates: location.coordinates
        },
        review: {
            status: 'reviewed',
            notes: {
                en: `Generated from official annual row ${index}; source spellings and blank fields are intentionally preserved.`,
                zh: `依据官方年度表第 ${index} 行生成；有意保留来源拼写与空白字段。`
            }
        }
    };

    return {
        eventId,
        milestoneId: `milestone-${eventId}`,
        files: {
            event,
            claims,
            sources,
            assets,
            quizzes:
                eventResearch && eventResearch.quiz
                    ? [
                          {
                              id: `${eventId}-quiz-1`,
                              storylineId: STORYLINE_ID,
                              ...eventResearch.quiz,
                              assetIds: eventResearch.quiz.assetIds || [recordAssetId]
                          }
                      ]
                    : buildQuiz(item, allAreas, eventId, recordAssetId),
            variant
        },
        svg: {
            recordPath,
            record: buildEventResearchSvg(eventResearch, item, index, year)
        }
    };
}

function generateArchive(snapshot, metadata, selection = null) {
    if (!metadata || !Array.isArray(metadata.items) || metadata.items.length !== snapshot.items.length) {
        throw new Error(
            `Expected ${snapshot.items.length} publication metadata rows in ${path.relative(ROOT, METADATA_PATH)}`
        );
    }
    fs.mkdirSync(IMAGE_ROOT, { recursive: true });
    const existingNames = collectExistingChineseNames(selection && selection.eventId);
    const portraitResearch = loadPortraitResearch();
    const eventResearchByEventId = new Map([
        ...loadEventResearch(2022, selection && selection.eventId),
        ...loadEventResearch(2023, selection && selection.eventId)
    ]);
    if (!selection) {
        const incompleteResearch = [...eventResearchByEventId.entries()]
            .filter(([, research]) => research.status !== 'complete')
            .map(([eventId, research]) => `${eventId} (${research.status || 'missing status'})`);
        if (incompleteResearch.length) {
            throw new Error(`Full annual sync refuses incomplete per-event research: ${incompleteResearch.join(', ')}`);
        }
    }
    const allAreas = [...new Set(snapshot.items.map((item) => item.area))];
    const entries = selection
        ? [selection]
        : snapshot.items.map((item, zeroBasedIndex) => ({
              item,
              metadataItem: metadata.items[zeroBasedIndex],
              index: zeroBasedIndex + 1,
              eventId: eventIdForItem(item, zeroBasedIndex + 1)
          }));
    const bundles = entries.map((entry) =>
        buildEventBundle(
            entry.item,
            entry.metadataItem,
            entry.index,
            existingNames,
            allAreas,
            portraitResearch,
            eventResearchByEventId
        )
    );

    for (const bundle of bundles) {
        const eventDir = path.join(ROOT, 'archive', 'events', bundle.eventId);
        writeJson(path.join(eventDir, 'event.json'), bundle.files.event);
        writeJson(path.join(eventDir, 'claims.json'), bundle.files.claims);
        writeJson(path.join(eventDir, 'sources.json'), bundle.files.sources);
        writeJson(path.join(eventDir, 'assets.json'), bundle.files.assets);
        writeJson(path.join(eventDir, 'quizzes.json'), bundle.files.quizzes);
        writeJson(path.join(eventDir, 'variants', `${STORYLINE_ID}.json`), bundle.files.variant);
        fs.writeFileSync(path.join(ROOT, bundle.svg.recordPath), bundle.svg.record);
    }

    if (!selection) {
        writeJson(path.join(ROOT, 'archive', 'storylines', `${STORYLINE_ID}.json`), {
            id: STORYLINE_ID,
            title: { en: 'AI100 Annual Achievements (2022-2023)', zh: 'AI100 年度成就（2022-2023）' },
            subtitle: {
                en: 'The 120-row annual selection published by BenchCouncil.',
                zh: 'BenchCouncil 发布的 120 条年度入选记录。'
            },
            type: 'achievement-map',
            description: {
                en: 'This standalone storyline preserves the official order and fields of the BenchCouncil AI100 (2022-2023) annual table. It is intentionally separate from the long-term canonical AI100 storyline.',
                zh: '本独立故事线保留 BenchCouncil AI100（2022-2023）年度表的官方顺序与字段，并有意与长期 canonical AI100 故事线分开。'
            },
            events: bundles.map((bundle, index) => ({
                eventId: bundle.eventId,
                variant: STORYLINE_ID,
                order: (index + 1) * 10,
                enabled: true,
                milestoneId: bundle.milestoneId
            })),
            review: {
                status: 'reviewed',
                notes: {
                    en: 'Synchronized from the official annual page and verified against the 2026-08-03 HTML snapshot.',
                    zh: '从官方年度页同步，并与 2026-08-03 的 HTML 快照核对。'
                }
            }
        });
    }

    console.log(
        selection
            ? `Generated annual AI100 event ${selection.index}: ${selection.eventId}. Shared storyline and runtime files were not written.`
            : `Generated ${bundles.length} annual AI100 event bundles and ${bundles.length} local SVG explainers.`
    );
}

function listAnnualEvents(snapshot, metadata, year) {
    const research = loadEventResearch(year);
    const rows = snapshot.items
        .map((item, zeroBasedIndex) => {
            const index = zeroBasedIndex + 1;
            return {
                index,
                item,
                eventId: eventIdForItem(item, index),
                year: publicationYear(item, metadata.items[zeroBasedIndex])
            };
        })
        .filter((entry) => entry.year === year);
    for (const row of rows) {
        const eventResearch = research.get(row.eventId);
        const status = (eventResearch && eventResearch.status) || 'unassigned';
        console.log(`${String(row.index).padStart(3, '0')}\t${status}\t${row.eventId}\t${row.item.work}`);
    }
    console.log(`${year} annual events: ${rows.length}`);
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    let snapshot = fs.existsSync(CURRENT_SNAPSHOT_PATH)
        ? readJson(CURRENT_SNAPSHOT_PATH)
        : readJson(BASE_SNAPSHOT_PATH);
    if (args.htmlPath) snapshot = verifySnapshotAgainstHtml(snapshot, path.resolve(args.htmlPath));
    let metadata = fs.existsSync(METADATA_PATH) ? readJson(METADATA_PATH) : null;
    if (args.fetchMetadata) metadata = await fetchPublicationMetadata(snapshot);
    if (args.listYear) listAnnualEvents(snapshot, metadata, args.listYear);
    const selection = args.event ? resolveEventSelection(snapshot, metadata, args.event) : null;
    if (args.generate) generateArchive(snapshot, metadata, selection);
    if (!args.htmlPath && !args.fetchMetadata && !args.generate && !args.listYear) {
        console.log(
            'Use --html <official-page.html>, --fetch-metadata, --generate, --event <selector>, --list-2022, and/or --list-2023.'
        );
    }
}

main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
});
