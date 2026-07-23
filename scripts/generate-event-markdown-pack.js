#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const { URL } = require('node:url');

const ROOT = path.resolve(__dirname, '..');
const EVENTS_DIR = path.join(ROOT, 'archive', 'events');
const OUTPUT_DIR = path.join(ROOT, 'pq');
const SAMPLE_EVENT_ID = '1956-dartmouth';
const IMAGE_PATTERN = /\.(?:png|jpe?g|webp|gif|svg)(?:[?#].*)?$/i;
const STORYLINE_PRIORITY = new Map([
    ['bench-council-ai100', 0],
    ['gaming-ai', 1],
    ['humanistic-cycle', 2],
    ['deep-learning', 3]
]);
const DOWNLOAD_REMOTE_IMAGES = process.argv.includes('--download-remote');
const REMOTE_IMAGE_CACHE = new Map();
const REMOTE_IMAGE_CACHE_DIR = path.join('/private/tmp', 'ai-history-event-pack-cache');

function readJson(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        const relativePath = path.relative(ROOT, filePath) || filePath;
        throw new Error(`Failed to read JSON ${relativePath}: ${error.message}`, { cause: error });
    }
}

function loadMilestones() {
    const source = fs.readFileSync(path.join(ROOT, 'milestones-data.js'), 'utf8');
    const context = {};
    vm.createContext(context);
    vm.runInContext(`${source}\n;globalThis.__eventPackMilestones = milestones;`, context);
    return Array.isArray(context.__eventPackMilestones) ? context.__eventPackMilestones : [];
}

function decodeHtmlEntities(value) {
    return String(value || '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>');
}

function cleanText(value) {
    return decodeHtmlEntities(value)
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p\s*>/gi, '\n\n')
        .replace(/<\/li\s*>/gi, '\n')
        .replace(/<li\b[^>]*>/gi, '- ')
        .replace(/<[^>]+>/g, '')
        .replace(/\r/g, '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n[ \t]+/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]{2,}/g, ' ')
        .replace(
            /\s*The interactive demo focuses on the steps that connect the source material to the visible system behavior\.\s*/gi,
            ' '
        )
        .replace(/\s*互动演示会突出这些步骤如何把资料线索与可见的系统行为连接起来。\s*/g, ' ')
        .replace(/,?\s*which links the source material to the visible demo behavior\./gi, '.')
        .replace(/，?它把资料线索与可见的演示行为连接起来。/g, '。')
        .replace(/,?\s*based on the (?:listed|related) source material\.?/gi, '.')
        .replace(/，?基于(?:所列|相关)资料(?:制作|重绘)?。?/g, '。')
        .replace(
            /\s*The fused version combines the deep-learning storyline's emphasis on engineering simplicity and trainability with the AI100 paper sources and residual-block explanation\./g,
            ' Its engineering simplicity, trainability, and residual-block design helped make it a durable foundation for later vision systems.'
        )
        .replace(
            /\s*融合后的版本结合了深度学习发展线对工程简洁性和可训练性的强调，以及 AI100 的论文来源和残差块解释。/g,
            '其工程简洁性、可训练性和残差块设计，使它成为后来视觉系统的重要基础。'
        )
        .replace(
            /\s*The fused page combines the deep-learning storyline's emphasis on a fifty-year scientific challenge with the AI100 account of evolutionary signals, attention-based representations, and end-to-end structure refinement\./g,
            ' It addressed a fifty-year scientific challenge by combining evolutionary signals, attention-based representations, and end-to-end structure refinement.'
        )
        .replace(
            /\s*融合后的页面结合了深度学习发展线对“困扰生物学界五十年难题”的强调，以及 AI100 对进化信号、基于注意力的表示和端到端结构优化的解释。/g,
            '它结合进化信号、基于注意力的表示和端到端结构优化，攻克了困扰生物学界约五十年的科学难题。'
        )
        .replace(
            /\s*The fused account keeps the deep-learning storyline's contrast with BERT, but uses the AI100 structure to explain GPT as the beginning of the decoder-only scaling line that later led to GPT-2, GPT-3, ChatGPT, and modern language models\./g,
            ' It began the decoder-only scaling line that later led to GPT-2, GPT-3, ChatGPT, and modern language models, while taking a different pre-training direction from BERT.'
        )
        .replace(
            /\s*融合后的叙事保留深度学习发展线中 GPT 与 BERT 的对照，同时使用 AI100 结构解释 GPT 如何成为后来 GPT-2、GPT-3、ChatGPT 和现代大语言模型的解码器式规模化路线起点。/g,
            '它开启了解码器式模型的规模化路线，后来延伸至 GPT-2、GPT-3、ChatGPT 和现代大语言模型，并形成了不同于 BERT 的预训练方向。'
        )
        .replace(
            /\s*The fused page keeps the deep-learning storyline's point that large-scale pre-training plus fine-tuning reshaped NLP, while using the AI100 content to focus the event on BERT rather than mixing it with the GPT line\./g,
            ' Large-scale pre-training followed by fine-tuning reshaped NLP, while BERT established an encoder-centered direction distinct from the GPT line.'
        )
        .replace(
            /\s*融合后的页面保留深度学习发展线中“大规模预训练加微调重塑 NLP”的判断，同时采用 AI100 内容把事件聚焦在 BERT 本身，避免与 GPT 技术线混在一起。/g,
            '大规模预训练加微调重塑了 NLP，而 BERT 确立了一条不同于 GPT 的编码器式技术路线。'
        )
        .replace(
            /\s*The deep-learning storyline frames it as an extreme form of visible historical state and gradient-path expansion, while the AI100 entry explains the practical mechanism: feature reuse, stronger propagation, and a compact alternative to simply making networks wider or deeper\./g,
            ' Dense connectivity keeps earlier features visible, expands gradient paths, strengthens feature reuse and propagation, and offers a compact alternative to simply making networks wider or deeper.'
        )
        .replace(
            /\s*深度学习发展线把它理解为让历史状态显式可见、最大化梯度路径的一种极端形式，AI100 条目则解释其实用机制：促进特征复用、增强传播，并提供比单纯加宽或加深网络更紧凑的方案。/g,
            '密集连接让早期特征持续可见，扩展梯度路径，促进特征复用和信息传播，并提供比单纯加宽或加深网络更紧凑的方案。'
        )
        .replace(
            /\s*The fused account preserves the deep-learning timeline's note that adversarial ideas had earlier precursors, while using the AI100 structure to explain why GANs became a defining framework for image generation, representation learning, and adversarial training\./g,
            ' Although adversarial ideas had earlier precursors, GANs became a defining framework for image generation, representation learning, and adversarial training.'
        )
        .replace(
            /\s*融合后的描述保留深度学习发展线中“对抗思想曾有更早先例”的历史线索，同时使用 AI100 的结构化解释说明 GAN 为什么成为图像生成、表示学习和对抗训练的标志性框架。/g,
            '尽管对抗思想曾有更早先例，GAN 仍成为图像生成、表示学习和对抗训练的标志性框架。'
        )
        .replace(
            /\s*The fused story connects the deep-learning timeline's emphasis on long-range information flow with the AI100 account of input, output, and forget gates, showing how gated memory made sequence learning practical before attention-based models became dominant\./g,
            ' Its input, output, and forget gates controlled long-range information flow, making sequence learning practical before attention-based models became dominant.'
        )
        .replace(
            /\s*融合后的叙事把深度学习时间线强调的长距离信息流，与 AI100 对输入门、输出门和遗忘门的解释连接起来，说明门控记忆如何在注意力模型占据主导前，让序列学习变得实用。/g,
            '输入门、输出门和遗忘门控制长距离信息流，使门控记忆在注意力模型占据主导前就让序列学习变得实用。'
        )
        .replace(
            /\s*This fused event presents attention as both a breakthrough for encoder-decoder translation and the conceptual bridge that later made token-to-token relevance central to Transformer-style AI\./g,
            ' Attention was both a breakthrough for encoder-decoder translation and the conceptual bridge that later made token-to-token relevance central to Transformer-style AI.'
        )
        .replace(
            /\s*融合后的事件既把注意力作为编码器-解码器翻译的突破，也把它呈现为通向 Transformer 式 AI 的概念桥梁。/g,
            '注意力既是编码器-解码器翻译的突破，也是通向 Transformer 式 AI 的概念桥梁。'
        )
        .replace(/[ \t]+([。.!?])/g, '$1')
        .trim();
}

function localize(value, language) {
    if (value == null) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return cleanText(value);
    }
    if (Array.isArray(value)) {
        return value
            .map((item) => localize(item, language))
            .filter(Boolean)
            .join(', ');
    }
    if (typeof value === 'object') {
        if (Object.prototype.hasOwnProperty.call(value, language)) return localize(value[language], language);
        const fallbackLanguage = language === 'zh' ? 'en' : 'zh';
        if (Object.prototype.hasOwnProperty.call(value, fallbackLanguage))
            return localize(value[fallbackLanguage], language);
    }
    return '';
}

function bilingualKey(value) {
    const zh = localize(value, 'zh');
    const en = localize(value, 'en');
    if (!zh && !en) return '';
    return `${zh}\u0000${en}`.toLowerCase();
}

function uniqueBy(items, keyFn) {
    const seen = new Set();
    return items.filter((item) => {
        const key = keyFn(item);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function escapeTable(value) {
    return String(value || '')
        .replace(/\|/g, '\\|')
        .replace(/\n+/g, '<br>');
}

function escapeAlt(value) {
    return String(value || '')
        .replace(/[\[\]]/g, '')
        .trim();
}

function isLocalImagePath(value) {
    if (typeof value !== 'string') return false;
    const normalized = value.trim();
    return Boolean(normalized && !/^(?:https?:|data:|blob:)/i.test(normalized) && IMAGE_PATTERN.test(normalized));
}

function isRemoteImagePath(value) {
    return typeof value === 'string' && /^https?:\/\//i.test(value.trim());
}

function isRemoteImageUrlWithExtension(value) {
    return isRemoteImagePath(value) && IMAGE_PATTERN.test(value.trim());
}

function normalizeLocalPath(value) {
    return String(value || '')
        .trim()
        .replace(/[?#].*$/, '')
        .replace(/^\.\//, '');
}

function normalizeImageReference(value) {
    return isRemoteImagePath(value) ? String(value).trim() : normalizeLocalPath(value);
}

function collectLocalImagePaths(value, output) {
    if (typeof value === 'string') {
        if (isLocalImagePath(value) || isRemoteImageUrlWithExtension(value)) output.add(normalizeImageReference(value));
        return;
    }
    if (Array.isArray(value)) {
        value.forEach((item) => collectLocalImagePaths(item, output));
        return;
    }
    if (!value || typeof value !== 'object') return;
    Object.values(value).forEach((item) => collectLocalImagePaths(item, output));
}

function collectMilestoneImagePaths(milestone, output) {
    const resources = milestone && milestone.resources ? milestone.resources : {};
    collectLocalImagePaths(resources.images, output);
    collectLocalImagePaths(milestone && milestone.photos, output);
    Object.keys(milestone && milestone.imageMeta ? milestone.imageMeta : {}).forEach((imagePath) => {
        if (isLocalImagePath(imagePath) || isRemoteImagePath(imagePath)) output.add(normalizeImageReference(imagePath));
    });
    const achievement = milestone && milestone.achievement ? milestone.achievement : {};
    collectLocalImagePaths(achievement.demoImage, output);
    (Array.isArray(achievement.visualModules) ? achievement.visualModules : []).forEach((module) => {
        if (!module || module.type === 'archiveLink') return;
        collectLocalImagePaths(module.poster, output);
        collectLocalImagePaths(module.url, output);
        collectLocalImagePaths(module.fallbackUrl, output);
    });
}

function getImageFileInfo(filePath) {
    const extension = path.extname(filePath).slice(1).toUpperCase() || 'IMAGE';
    let format = extension === 'JPG' ? 'JPEG' : extension;
    let dimensions = '';
    const result = spawnSync('file', ['-b', filePath], { encoding: 'utf8' });
    const description = result.status === 0 ? String(result.stdout || '') : '';

    if (/Web\/P image|WebP/i.test(description)) format = 'WebP';
    else if (/JPEG image/i.test(description)) format = 'JPEG';
    else if (/PNG image/i.test(description)) format = 'PNG';
    else if (/GIF image/i.test(description)) format = 'GIF';
    else if (/SVG/i.test(description) || extension === 'SVG') format = 'SVG';

    const sizeMatch = description.match(/(?:,|\s)(\d{2,5})\s*[xX×]\s*(\d{2,5})(?:,|\s|$)/);
    if (sizeMatch) dimensions = `${sizeMatch[1]} × ${sizeMatch[2]}`;

    if (!dimensions && format === 'SVG') {
        try {
            const svg = fs.readFileSync(filePath, 'utf8').slice(0, 4096);
            const viewBox = svg.match(/viewBox=["']\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)\s*["']/i);
            const width = svg.match(/\bwidth=["']([\d.]+)(?:px)?["']/i);
            const height = svg.match(/\bheight=["']([\d.]+)(?:px)?["']/i);
            if (viewBox) dimensions = `${Math.round(Number(viewBox[1]))} × ${Math.round(Number(viewBox[2]))}`;
            else if (width && height) dimensions = `${Math.round(Number(width[1]))} × ${Math.round(Number(height[1]))}`;
        } catch (_) {}
    }

    return { format, dimensions, extension };
}

function makeCopiedImageName(sourcePath, usedNames, preferredExtension = '') {
    let sourceName = sourcePath;
    if (isRemoteImagePath(sourcePath)) {
        try {
            sourceName = decodeURIComponent(new URL(sourcePath).pathname);
        } catch (_) {}
    }
    let baseName = path.basename(sourceName).replace(/[^a-zA-Z0-9._-]+/g, '-');
    if (!IMAGE_PATTERN.test(baseName) && preferredExtension) baseName = `${baseName || 'image'}${preferredExtension}`;
    const normalized =
        baseName ||
        `image-${crypto.createHash('sha1').update(sourcePath).digest('hex').slice(0, 8)}${preferredExtension}`;
    if (!usedNames.has(normalized)) {
        usedNames.add(normalized);
        return normalized;
    }
    const extension = path.extname(normalized);
    const stem = path.basename(normalized, extension);
    const hash = crypto.createHash('sha1').update(sourcePath).digest('hex').slice(0, 8);
    const uniqueName = `${stem}-${hash}${extension}`;
    usedNames.add(uniqueName);
    return uniqueName;
}

function getExtensionForFormat(format) {
    return (
        {
            JPEG: '.jpg',
            PNG: '.png',
            WebP: '.webp',
            GIF: '.gif',
            SVG: '.svg'
        }[format] || ''
    );
}

function getWikimediaFileName(url) {
    try {
        const parsed = new URL(url);
        const decodedPath = decodeURIComponent(parsed.pathname);
        const filePageMatch = decodedPath.match(/\/wiki\/File:(.+)$/i);
        if (filePageMatch) return filePageMatch[1];
        if (parsed.hostname === 'upload.wikimedia.org') {
            const segments = decodedPath.split('/').filter(Boolean);
            const thumbIndex = segments.indexOf('thumb');
            if (thumbIndex >= 0 && segments.length >= 2) return segments[segments.length - 2];
            return segments[segments.length - 1] || '';
        }
    } catch (_) {}
    return '';
}

function getRemoteDownloadCandidates(url) {
    const candidates = [];
    const wikimediaFileName = getWikimediaFileName(url);
    if (wikimediaFileName) {
        candidates.push(
            `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${encodeURIComponent(wikimediaFileName)}&width=1024`
        );
        candidates.push(
            `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(wikimediaFileName)}`
        );
    }
    candidates.push(url);
    return Array.from(new Set(candidates));
}

function downloadUrlToFile(url, outputPath) {
    return spawnSync(
        'curl',
        [
            '-L',
            '--fail',
            '--silent',
            '--show-error',
            '--max-time',
            '30',
            '-A',
            'Mozilla/5.0 AI-History-Show event pack generator',
            '-o',
            outputPath,
            url
        ],
        { encoding: 'utf8' }
    );
}

function downloadRemoteImage(url) {
    if (REMOTE_IMAGE_CACHE.has(url)) return REMOTE_IMAGE_CACHE.get(url);
    const hash = crypto.createHash('sha1').update(url).digest('hex').slice(0, 16);
    fs.mkdirSync(REMOTE_IMAGE_CACHE_DIR, { recursive: true });
    const cachedFile = fs.readdirSync(REMOTE_IMAGE_CACHE_DIR).find((name) => name.startsWith(`${hash}.`));
    if (cachedFile) {
        const cachedPath = path.join(REMOTE_IMAGE_CACHE_DIR, cachedFile);
        const cached = { buffer: fs.readFileSync(cachedPath), extension: path.extname(cachedFile) };
        REMOTE_IMAGE_CACHE.set(url, cached);
        return cached;
    }
    const temporaryPath = path.join('/private/tmp', `ai-history-event-pack-${hash}.download`);
    let downloadSucceeded = false;
    for (const candidate of getRemoteDownloadCandidates(url)) {
        const result = downloadUrlToFile(candidate, temporaryPath);
        if (result.status !== 0 || !fs.existsSync(temporaryPath) || fs.statSync(temporaryPath).size === 0) continue;
        const candidateInfo = getImageFileInfo(temporaryPath);
        if (getExtensionForFormat(candidateInfo.format)) {
            downloadSucceeded = true;
            break;
        }
    }
    if (!downloadSucceeded) {
        try {
            fs.rmSync(temporaryPath, { force: true });
        } catch (_) {}
        REMOTE_IMAGE_CACHE.set(url, null);
        return null;
    }
    const info = getImageFileInfo(temporaryPath);
    const extension = getExtensionForFormat(info.format);
    if (!extension) {
        fs.rmSync(temporaryPath, { force: true });
        REMOTE_IMAGE_CACHE.set(url, null);
        return null;
    }
    const downloadedImage = { buffer: fs.readFileSync(temporaryPath), extension };
    fs.writeFileSync(path.join(REMOTE_IMAGE_CACHE_DIR, `${hash}${extension}`), downloadedImage.buffer);
    fs.rmSync(temporaryPath, { force: true });
    REMOTE_IMAGE_CACHE.set(url, downloadedImage);
    return downloadedImage;
}

function getEventIds() {
    return fs
        .readdirSync(EVENTS_DIR)
        .filter((name) => fs.statSync(path.join(EVENTS_DIR, name)).isDirectory())
        .sort();
}

function getStorylineRank(milestone) {
    const storylineId = milestone && milestone.storyline ? milestone.storyline.id : '';
    return STORYLINE_PRIORITY.has(storylineId) ? STORYLINE_PRIORITY.get(storylineId) : 99;
}

function sortMilestones(milestones) {
    return [...milestones].sort((left, right) => getStorylineRank(left) - getStorylineRank(right));
}

function getLocationText(location, language) {
    if (!location || typeof location !== 'object') return '';
    return [localize(location.name, language), localize(location.country, language)].filter(Boolean).join(', ');
}

function buildRecipientPrimary(primary, canonicalEvent) {
    if (!canonicalEvent || typeof canonicalEvent !== 'object') return primary;
    const canonicalLocation = canonicalEvent.location || {};
    return {
        ...primary,
        year: canonicalEvent.year != null ? canonicalEvent.year : primary.year,
        date: canonicalEvent.date || primary.date,
        title: canonicalEvent.title || primary.title,
        category: canonicalEvent.summary || primary.category,
        description: canonicalEvent.description || primary.description,
        location: {
            name: canonicalLocation.place || (primary.location && primary.location.name),
            country: canonicalLocation.country || (primary.location && primary.location.country),
            coordinates: canonicalLocation.coordinates || (primary.location && primary.location.coordinates) || []
        }
    };
}

function collectDescriptions(milestones) {
    return uniqueBy(
        milestones.map((milestone) => milestone.description).filter((value) => bilingualKey(value)),
        bilingualKey
    );
}

function collectStorylines(milestones) {
    return uniqueBy(
        milestones
            .map((milestone) => milestone && milestone.storyline && milestone.storyline.name)
            .filter((value) => bilingualKey(value)),
        bilingualKey
    );
}

function collectCommentary(milestones) {
    const entries = [];
    milestones.forEach((milestone) => {
        (Array.isArray(milestone.commentarySections) ? milestone.commentarySections : []).forEach((section) => {
            if (!section || !bilingualKey(section.html)) return;
            entries.push({ label: section.label, text: section.html });
        });
    });
    return uniqueBy(entries, (entry) => bilingualKey(entry.text));
}

function collectFigures(milestones) {
    const figures = milestones.flatMap((milestone) => (Array.isArray(milestone.figures) ? milestone.figures : []));
    return uniqueBy(
        figures.filter((figure) => bilingualKey(figure && figure.name)),
        (figure) => bilingualKey(figure.name)
    );
}

function collectQuotes(milestones) {
    return uniqueBy(
        milestones
            .filter((milestone) => {
                if (!bilingualKey(milestone.quote)) return false;
                const meta = milestone.quoteMeta || {};
                const normalizeQuote = (value, language) =>
                    localize(value, language)
                        .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
                        .trim()
                        .toLowerCase();
                const quoteMatchesWork = ['zh', 'en'].some((language) => {
                    const quote = normalizeQuote(milestone.quote, language);
                    const workTitle = normalizeQuote(meta.workTitle, language);
                    return quote && workTitle && quote === workTitle;
                });
                return !quoteMatchesWork;
            })
            .map((milestone) => ({
                quote: milestone.quote,
                attribution: milestone.quoteAttribution,
                meta: milestone.quoteMeta || {}
            })),
        (item) => bilingualKey(item.quote)
    );
}

function collectQuizzes(milestones) {
    const quizzes = milestones.flatMap((milestone) => (Array.isArray(milestone.quizzes) ? milestone.quizzes : []));
    return uniqueBy(
        quizzes.filter((quiz) => bilingualKey(quiz && quiz.question)),
        (quiz) => bilingualKey(quiz.question)
    );
}

function collectAchievementContent(milestones) {
    const achievements = milestones.map((milestone) => milestone.achievement).filter(Boolean);
    const pick = (key) =>
        uniqueBy(
            achievements.map((achievement) => achievement[key]).filter((value) => bilingualKey(value)),
            bilingualKey
        );
    const list = (key) =>
        uniqueBy(
            achievements
                .flatMap((achievement) => (Array.isArray(achievement[key]) ? achievement[key] : []))
                .filter(Boolean),
            (item) => bilingualKey(item && (item.text || item.label || item))
        );
    return {
        area: pick('area'),
        method: pick('method'),
        artifact: pick('artifact'),
        demo: pick('demo'),
        keyConcepts: list('keyConcepts'),
        relatedAchievements: list('relatedAchievements'),
        relatedRegions: list('relatedRegions'),
        demoSteps: list('demoSteps'),
        demoNotes: list('demoNotes').filter((item) => {
            const label = `${localize(item && item.label, 'zh')} ${localize(item && item.label, 'en')}`;
            return !/source|reference|paper|archive|资料|来源|文献/i.test(label);
        })
    };
}

function collectAnalysis(milestones) {
    const entries = [];
    milestones.forEach((milestone) => {
        const analysis = milestone.analysis || {};
        [
            ['what', { zh: '是什么', en: 'What' }],
            ['how', { zh: '如何实现', en: 'How' }],
            ['why', { zh: '为什么重要', en: 'Why It Matters' }]
        ].forEach(([key, label]) => {
            if (bilingualKey(analysis[key])) entries.push({ label, text: analysis[key] });
        });
        if (bilingualKey(milestone.branchSummary)) {
            entries.push({ label: { zh: '历史语境', en: 'Historical Context' }, text: milestone.branchSummary });
        }
        (Array.isArray(milestone.realityLinks) ? milestone.realityLinks : []).forEach((item) => {
            const text = {
                zh: [localize(item.term, 'zh'), localize(item.modernTerm, 'zh')].filter(Boolean).join('：'),
                en: [localize(item.term, 'en'), localize(item.modernTerm, 'en')].filter(Boolean).join(': ')
            };
            if (bilingualKey(text)) entries.push({ label: item.label, text });
        });
    });
    return uniqueBy(entries, (entry) => bilingualKey(entry.text));
}

function collectVideos(milestones) {
    const videos = [];
    milestones.forEach((milestone) => {
        const resources = milestone.resources || {};
        (Array.isArray(resources.videos) ? resources.videos : []).forEach((video) => videos.push(video));
        if (milestone.videoUrl) videos.push({ url: milestone.videoUrl });
        const modules =
            milestone.achievement && Array.isArray(milestone.achievement.visualModules)
                ? milestone.achievement.visualModules
                : [];
        modules
            .filter((module) => /video/i.test(String((module && module.type) || '')))
            .forEach((module) => videos.push(module));
    });
    return uniqueBy(
        videos.filter((video) => String(video && (video.url || video.embed_url || '')).trim()),
        (video) => String(video.url || video.embed_url || '').trim()
    );
}

function buildImageInventory(eventId, milestones, figures) {
    const assets = readJson(path.join(EVENTS_DIR, eventId, 'assets.json'));
    const assetByPath = new Map();
    assets.forEach((asset) => {
        if (asset && typeof asset.path === 'string') assetByPath.set(normalizeImageReference(asset.path), asset);
    });

    const refs = new Set();
    assets.forEach((asset) => {
        if (asset && typeof asset.path === 'string' && (asset.type === 'image' || isLocalImagePath(asset.path))) {
            refs.add(normalizeImageReference(asset.path));
        }
    });
    milestones.forEach((milestone) => collectMilestoneImagePaths(milestone, refs));
    figures.forEach((figure) => {
        if (
            figure &&
            typeof figure.avatar === 'string' &&
            (isLocalImagePath(figure.avatar) || isRemoteImagePath(figure.avatar))
        ) {
            refs.add(normalizeImageReference(figure.avatar));
        }
    });

    const avatarPaths = new Set(
        figures.map((figure) => normalizeImageReference(figure && figure.avatar)).filter(Boolean)
    );
    const metaByPath = new Map();
    milestones.forEach((milestone) => {
        Object.entries(milestone.imageMeta || {}).forEach(([imagePath, meta]) => {
            const normalized = normalizeImageReference(imagePath);
            if (!metaByPath.has(normalized)) metaByPath.set(normalized, meta);
        });
    });

    return {
        refs: Array.from(refs).filter(Boolean).sort(),
        avatarPaths,
        assetByPath,
        metaByPath
    };
}

function copyEventImages(eventId, inventory) {
    const eventDir = path.join(OUTPUT_DIR, eventId);
    const imagesDir = path.join(eventDir, 'images');
    fs.mkdirSync(imagesDir, { recursive: true });
    const usedNames = new Set();
    const copied = new Map();
    const missing = [];

    inventory.refs.forEach((sourcePath) => {
        if (isRemoteImagePath(sourcePath)) {
            let fileName = makeCopiedImageName(sourcePath, usedNames);
            let outputPath = path.join(imagesDir, fileName);
            if (!path.extname(fileName)) {
                const existingFileName = fs.readdirSync(imagesDir).find((name) => name.startsWith(`${fileName}.`));
                if (existingFileName) {
                    usedNames.delete(fileName);
                    fileName = existingFileName;
                    usedNames.add(fileName);
                    outputPath = path.join(imagesDir, fileName);
                }
            }
            if (fs.existsSync(outputPath) && fs.statSync(outputPath).isFile()) {
                copied.set(sourcePath, {
                    sourcePath,
                    fileName,
                    relativePath: `images/${fileName}`,
                    info: getImageFileInfo(outputPath),
                    asset: inventory.assetByPath.get(sourcePath) || null,
                    meta: inventory.metaByPath.get(sourcePath) || null
                });
                return;
            }
            if (!DOWNLOAD_REMOTE_IMAGES) {
                missing.push(sourcePath);
                return;
            }
            const downloaded = downloadRemoteImage(sourcePath);
            if (!downloaded) {
                missing.push(sourcePath);
                return;
            }
            if (!path.extname(fileName)) {
                usedNames.delete(fileName);
                fileName = makeCopiedImageName(sourcePath, usedNames, downloaded.extension);
                outputPath = path.join(imagesDir, fileName);
            }
            fs.writeFileSync(outputPath, downloaded.buffer);
            copied.set(sourcePath, {
                sourcePath,
                fileName,
                relativePath: `images/${fileName}`,
                info: getImageFileInfo(outputPath),
                asset: inventory.assetByPath.get(sourcePath) || null,
                meta: inventory.metaByPath.get(sourcePath) || null
            });
            return;
        }
        const absoluteSource = path.resolve(ROOT, sourcePath);
        if (
            !absoluteSource.startsWith(`${ROOT}${path.sep}`) ||
            !fs.existsSync(absoluteSource) ||
            !fs.statSync(absoluteSource).isFile()
        ) {
            missing.push(sourcePath);
            return;
        }
        const fileName = makeCopiedImageName(sourcePath, usedNames);
        fs.copyFileSync(absoluteSource, path.join(imagesDir, fileName));
        copied.set(sourcePath, {
            sourcePath,
            fileName,
            relativePath: `images/${fileName}`,
            info: getImageFileInfo(absoluteSource),
            asset: inventory.assetByPath.get(sourcePath) || null,
            meta: inventory.metaByPath.get(sourcePath) || null
        });
    });

    fs.readdirSync(imagesDir).forEach((fileName) => {
        if (!usedNames.has(fileName)) fs.rmSync(path.join(imagesDir, fileName), { force: true });
    });

    return { copied, missing };
}

function getImageMetaValue(image, key, language) {
    const meta = image.meta || {};
    const asset = image.asset || {};
    if (key === 'license') {
        const license = localize(
            meta.license || (meta.rights && meta.rights.license) || (asset.rights && asset.rights.license),
            language
        );
        if (/legacy|archive portrait|migrated from/i.test(license)) {
            return language === 'zh'
                ? '对外发布前需核验图片使用权。'
                : 'Verify image usage rights before external publication.';
        }
        return license;
    }
    return localize(meta[key] || asset[key], language);
}

function getFigureAvatarPath(figure, copied) {
    const sourcePath = normalizeImageReference(figure && figure.avatar);
    const image = copied.get(sourcePath);
    return image ? image.relativePath : '';
}

function renderOverview(primary, descriptions, storylines, language) {
    const zh = language === 'zh';
    const rows = [];
    const year = localize(primary.year, language) || localize(primary.date, language);
    const category = localize(primary.category, language) || localize(primary.subtitle, language);
    const location = getLocationText(primary.location, language);
    const coordinates =
        primary.location && Array.isArray(primary.location.coordinates)
            ? primary.location.coordinates.filter((value) => value !== '' && value != null).join(', ')
            : '';
    const storylineNames = storylines.map((storyline) => localize(storyline, language)).filter(Boolean);
    if (year) rows.push([zh ? '年份 / 日期' : 'Year / Date', year]);
    if (storylineNames.length) rows.push([zh ? '故事线' : 'Storyline', storylineNames.join(zh ? '；' : '; ')]);
    if (category) rows.push([zh ? '分类摘要' : 'Category', category]);
    if (location) rows.push([zh ? '地点' : 'Location', location]);
    if (coordinates) rows.push([zh ? '坐标' : 'Coordinates', `\`${coordinates}\``]);

    const table = rows.length
        ? `| ${zh ? '字段' : 'Field'} | ${zh ? '内容' : 'Details'} |\n| --- | --- |\n${rows.map(([label, value]) => `| ${escapeTable(label)} | ${escapeTable(value)} |`).join('\n')}`
        : '';
    const text = descriptions
        .map((description) => localize(description, language))
        .filter(Boolean)
        .join('\n\n');
    return [table, text].filter(Boolean).join('\n\n');
}

function renderCommentary(commentary, language) {
    return commentary
        .map((entry) => {
            const label = localize(entry.label, language);
            const text = localize(entry.text, language);
            return `${label ? `### ${label}\n\n` : ''}${text}`;
        })
        .filter(Boolean)
        .join('\n\n');
}

function renderAchievement(achievement, language) {
    const zh = language === 'zh';
    const separator = zh ? '：' : ': ';
    const lines = [];
    const fields = [
        [zh ? '领域' : 'Area', achievement.area],
        [zh ? '方法' : 'Method', achievement.method],
        [zh ? '成果形态' : 'Artifact', achievement.artifact],
        [zh ? '演示说明' : 'Demonstration', achievement.demo]
    ];
    fields.forEach(([label, values]) => {
        const texts = values.map((value) => localize(value, language)).filter(Boolean);
        if (texts.length) lines.push(`- ${label}${separator}${texts.join(zh ? '；' : '; ')}`);
    });

    if (achievement.keyConcepts.length) {
        lines.push(`\n### ${zh ? '关键概念' : 'Key Concepts'}\n`);
        achievement.keyConcepts.forEach((item) => {
            const label = localize(item.label, language);
            const text = localize(item.text, language);
            if (label || text) lines.push(`- ${label ? `**${label}**${separator}` : ''}${text}`);
        });
    }
    if (achievement.demoSteps.length) {
        const steps = achievement.demoSteps.map((item) => localize(item, language)).filter(Boolean);
        if (steps.length) lines.push(`\n- ${zh ? '过程' : 'Process'}${separator}${steps.join(' → ')}`);
    }
    if (achievement.demoNotes.length) {
        lines.push(`\n### ${zh ? '演示要点' : 'Demonstration Notes'}\n`);
        achievement.demoNotes.forEach((item) => {
            const label = localize(item.label, language);
            const text = localize(item.text, language);
            if (label || text) lines.push(`- ${label ? `**${label}**${separator}` : ''}${text}`);
        });
    }
    const relatedAchievements = achievement.relatedAchievements.map((item) => localize(item, language)).filter(Boolean);
    const relatedRegions = achievement.relatedRegions.map((item) => localize(item, language)).filter(Boolean);
    if (relatedAchievements.length)
        lines.push(
            `\n- ${zh ? '相关成就' : 'Related achievements'}${separator}${relatedAchievements.join(zh ? '、' : ', ')}`
        );
    if (relatedRegions.length)
        lines.push(`- ${zh ? '相关地区' : 'Related regions'}${separator}${relatedRegions.join(zh ? '、' : ', ')}`);
    return lines.join('\n').trim();
}

function renderAnalysis(analysis, language) {
    return analysis
        .map((entry) => {
            const label = localize(entry.label, language);
            const text = localize(entry.text, language);
            return `${label ? `### ${label}\n\n` : ''}${text}`;
        })
        .filter(Boolean)
        .join('\n\n');
}

function renderQuotes(quotes, language) {
    const zh = language === 'zh';
    const separator = zh ? '：' : ': ';
    return quotes
        .map((item) => {
            const quote = localize(item.quote, language);
            const meta = item.meta || {};
            const speaker = localize(meta.speaker, language);
            const workTitle = localize(meta.workTitle, language);
            const workAuthors = localize(meta.workAuthors, language);
            const attribution = localize(item.attribution, language);
            const lines = [`> ${quote.split('\n').join('\n> ')}`];
            if (speaker) lines.push(`\n- ${zh ? '署名' : 'Attribution'}${separator}${speaker}`);
            if (workTitle) lines.push(`- ${zh ? '作品' : 'Work'}${separator}${workTitle}`);
            if (workAuthors) lines.push(`- ${zh ? '作者' : 'Authors'}${separator}${workAuthors}`);
            else if (attribution) lines.push(`- ${zh ? '说明' : 'Note'}${separator}${attribution}`);
            return lines.join('\n');
        })
        .join('\n\n');
}

function renderFigures(figures, copied, language) {
    const zh = language === 'zh';
    const separator = zh ? '：' : ': ';
    return figures
        .map((figure) => {
            const name = localize(figure.name, language);
            const role = localize(figure.role, language);
            const avatarPath = getFigureAvatarPath(figure, copied);
            const lines = [`### ${name}`];
            if (avatarPath) lines.push(`\n![${escapeAlt(name)}](${avatarPath})`);
            if (role) lines.push(`\n- ${zh ? '角色' : 'Role'}${separator}${role}`);
            return lines.join('\n');
        })
        .join('\n\n');
}

function renderImages(images, language) {
    const zh = language === 'zh';
    const separator = zh ? '：' : ': ';
    return images
        .map((image, index) => {
            const caption =
                getImageMetaValue(image, 'caption', language) ||
                path.basename(image.fileName, path.extname(image.fileName));
            const subcaption = getImageMetaValue(image, 'subcaption', language);
            const license = getImageMetaValue(image, 'license', language);
            const formatDetail = [image.info.format, image.info.dimensions].filter(Boolean).join(zh ? '，' : ', ');
            const lines = [`### ${index + 1}. ${caption}`, `\n![${escapeAlt(caption)}](${image.relativePath})`];
            if (subcaption && subcaption !== caption)
                lines.push(`\n- ${zh ? '补充说明' : 'Subcaption'}${separator}${subcaption}`);
            if (formatDetail)
                lines.push(`- ${zh ? '文件格式与尺寸' : 'File format and dimensions'}${separator}${formatDetail}`);
            if (license) lines.push(`- ${zh ? '版权提示' : 'Rights note'}${separator}${license}`);
            return lines.join('\n');
        })
        .join('\n\n');
}

function renderVideos(videos, copied, language) {
    const zh = language === 'zh';
    const separator = zh ? '：' : ': ';
    return videos
        .map((video, index) => {
            const originalUrl = String(video.url || video.embed_url || '').trim();
            const localImage = isLocalImagePath(originalUrl) ? copied.get(normalizeLocalPath(originalUrl)) : null;
            const target = localImage ? localImage.relativePath : originalUrl;
            let title =
                localize(video.title, language) ||
                localize(video.site, language) ||
                `${zh ? '视频' : 'Video'} ${index + 1}`;
            if (!zh && /[\u4e00-\u9fff]/.test(title)) title = `Video ${index + 1}`;
            const description = localize(video.description, language);
            const duration = localize(video.duration, language);
            const lines = [
                `### ${title}`,
                `\n- ${zh ? '播放地址' : 'URL'}${separator}[${zh ? '打开媒体' : 'Open media'}](${target})`
            ];
            if (description) lines.push(`- ${zh ? '说明' : 'Description'}${separator}${description}`);
            if (duration) lines.push(`- ${zh ? '时长' : 'Duration'}${separator}${duration}`);
            return lines.join('\n');
        })
        .join('\n\n');
}

function renderQuizzes(quizzes, language) {
    const zh = language === 'zh';
    const separator = zh ? '：' : ': ';
    const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
    return quizzes
        .map((quiz, quizIndex) => {
            const question = localize(quiz.question, language);
            const options = Array.isArray(quiz.options)
                ? quiz.options.map((option) => localize(option.text || option, language)).filter(Boolean)
                : [];
            const answerIndex = Number.isInteger(quiz.answerIndex) ? quiz.answerIndex : Number(quiz.answer);
            const explanation = localize(quiz.explanation, language);
            const lines = [`### ${zh ? `问题 ${quizIndex + 1}` : `Question ${quizIndex + 1}`}`, `\n${question}`];
            options.forEach((option, index) => lines.push(`- ${optionLabels[index] || index + 1}. ${option}`));
            if (Number.isInteger(answerIndex) && options[answerIndex]) {
                lines.push(
                    `\n**${zh ? '正确答案' : 'Correct answer'}${separator}${optionLabels[answerIndex] || answerIndex + 1}. ${options[answerIndex]}**`
                );
            }
            if (explanation) lines.push(`\n${zh ? '解释' : 'Explanation'}${separator}${explanation}`);
            return lines.join('\n');
        })
        .join('\n\n');
}

function renderDocument(eventId, milestones, canonicalEvent, inventory, copiedResult, language) {
    const primary = buildRecipientPrimary(milestones[0], canonicalEvent);
    const zh = language === 'zh';
    const title = localize(primary.title, language) || eventId;
    const storylines = collectStorylines(milestones);
    const descriptions = bilingualKey(canonicalEvent && canonicalEvent.description)
        ? [canonicalEvent.description]
        : collectDescriptions(milestones);
    const commentary = collectCommentary(milestones).filter(
        (entry) => !descriptions.some((description) => bilingualKey(description) === bilingualKey(entry.text))
    );
    const achievement = collectAchievementContent(milestones);
    const analysis = collectAnalysis(milestones);
    const quotes = collectQuotes(milestones);
    const figures = collectFigures(milestones);
    const quizzes = collectQuizzes(milestones);
    const videos = collectVideos(milestones);
    const galleryImages = Array.from(copiedResult.copied.values()).filter(
        (image) => !inventory.avatarPaths.has(image.sourcePath)
    );
    const sections = [];

    const addSection = (heading, content) => {
        const text = String(content || '').trim();
        if (text) sections.push({ heading, content: text });
    };

    addSection(zh ? '事件概览' : 'Event Overview', renderOverview(primary, descriptions, storylines, language));
    addSection(zh ? '事件解读' : 'Interpretation', renderCommentary(commentary, language));
    addSection(zh ? '核心成就' : 'Core Achievement', renderAchievement(achievement, language));
    addSection(zh ? '分析与语境' : 'Analysis and Context', renderAnalysis(analysis, language));
    addSection(zh ? '核心引文' : 'Key Quotations', renderQuotes(quotes, language));
    addSection(zh ? '关键人物' : 'Key Figures', renderFigures(figures, copiedResult.copied, language));
    addSection(zh ? '事件图片' : 'Event Images', renderImages(galleryImages, language));
    addSection(zh ? '视频与动画' : 'Videos and Animations', renderVideos(videos, copiedResult.copied, language));
    addSection(zh ? '互动问答' : 'Interactive Quiz', renderQuizzes(quizzes, language));

    const body = sections
        .map((section, index) => `## ${index + 1}. ${section.heading}\n\n${section.content}`)
        .join('\n\n');
    return `# ${localize(primary.year, language) ? `${localize(primary.year, language)} · ` : ''}${title}\n\n${body}\n`;
}

function generateEvent(eventId, milestones) {
    const orderedMilestones = sortMilestones(milestones);
    const canonicalEvent = readJson(path.join(EVENTS_DIR, eventId, 'event.json'));
    const figures = collectFigures(orderedMilestones);
    const inventory = buildImageInventory(eventId, orderedMilestones, figures);
    const copiedResult = copyEventImages(eventId, inventory);
    const eventDir = path.join(OUTPUT_DIR, eventId);
    fs.mkdirSync(eventDir, { recursive: true });
    fs.writeFileSync(
        path.join(eventDir, `${eventId}.zh.md`),
        renderDocument(eventId, orderedMilestones, canonicalEvent, inventory, copiedResult, 'zh')
    );
    fs.writeFileSync(
        path.join(eventDir, `${eventId}.en.md`),
        renderDocument(eventId, orderedMilestones, canonicalEvent, inventory, copiedResult, 'en')
    );
    return {
        eventId,
        images: copiedResult.copied.size,
        missingImages: copiedResult.missing
    };
}

function main() {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const milestones = loadMilestones();
    const milestonesByEvent = new Map();
    milestones.forEach((milestone) => {
        const eventId = milestone.archiveEventId;
        if (!eventId) return;
        if (!milestonesByEvent.has(eventId)) milestonesByEvent.set(eventId, []);
        milestonesByEvent.get(eventId).push(milestone);
    });

    const eventIds = getEventIds();
    const results = [];
    const missingMilestones = [];
    eventIds.forEach((eventId) => {
        if (eventId === SAMPLE_EVENT_ID) return;
        const eventMilestones = milestonesByEvent.get(eventId) || [];
        if (!eventMilestones.length) {
            missingMilestones.push(eventId);
            return;
        }
        results.push(generateEvent(eventId, eventMilestones));
    });

    const missingImages = results.flatMap((result) =>
        result.missingImages.map((imagePath) => ({ eventId: result.eventId, imagePath }))
    );
    const missingLocalImages = missingImages.filter((item) => !isRemoteImagePath(item.imagePath));
    const unavailableRemoteImages = missingImages.filter((item) => isRemoteImagePath(item.imagePath));
    const imageCount = results.reduce((total, result) => total + result.images, 0);
    console.log(`Generated ${results.length} event folders (${results.length * 2} Markdown files).`);
    console.log(`Copied ${imageCount} event image files.`);
    console.log(`Preserved sample event: ${SAMPLE_EVENT_ID}.`);
    console.log(`Events missing runtime milestones: ${missingMilestones.length}.`);
    console.log(`Missing referenced local images: ${missingLocalImages.length}.`);
    console.log(`Unavailable external images: ${unavailableRemoteImages.length}.`);
    if (missingMilestones.length) console.log(missingMilestones.join('\n'));
    if (missingLocalImages.length)
        console.log(
            missingLocalImages
                .slice(0, 100)
                .map((item) => `${item.eventId}: ${item.imagePath}`)
                .join('\n')
        );
    if (unavailableRemoteImages.length)
        console.log(
            unavailableRemoteImages
                .slice(0, 100)
                .map((item) => `${item.eventId}: ${item.imagePath}`)
                .join('\n')
        );
    if (missingMilestones.length || missingLocalImages.length) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = { readJson };
