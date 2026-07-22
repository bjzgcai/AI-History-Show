'use strict';

const SOURCE_TYPES = require('../archive/taxonomies/source-types.json');

const SOURCE_LABELS = new Map(SOURCE_TYPES.map((entry) => [entry.id, entry.label]));
const RELIABILITY_LEVELS = new Set(['primary', 'secondary', 'tertiary', 'reference-only']);

function sourceText(value) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return `${value.en || ''} ${value.zh || ''}`.trim();
    }
    return String(value || '').trim();
}

function includesAny(value, terms) {
    return terms.some((term) => value.includes(term));
}

function classifySourceText(value) {
    if (includesAny(value, ['personal homepage', 'home page', 'homepage', '个人主页', '作者主页']))
        return 'personal-page';
    if (includesAny(value, ['image', 'photo', 'portrait', '图片', '照片', '肖像'])) return 'image-source';
    if (includesAny(value, ['documentation', 'manual', 'guide', 'api', '文档', '手册', '指南'])) return 'documentation';
    if (includesAny(value, ['report', '报告'])) return 'report';
    if (includesAny(value, ['thesis', 'dissertation', '学位论文', '博士论文'])) return 'thesis';
    if (includesAny(value, ['statement', 'letter', '声明', '公开信'])) return 'statement';
    if (includesAny(value, ['dataset', '数据集'])) return 'dataset';
    if (includesAny(value, ['wikipedia', 'encyclopedia', '百科'])) return 'encyclopedia-entry';
    if (includesAny(value, ['news', 'obituary', '新闻', '讣告'])) return 'news';
    if (includesAny(value, ['profile', 'biography', '人物', '作者'])) return 'profile';
    if (includesAny(value, ['github', 'repository', 'code', '代码', '仓库'])) return 'code';
    if (includesAny(value, ['archive', '档案'])) return 'archive';
    if (includesAny(value, ['official', 'institution', '官方', '机构'])) return 'official-page';
    if (includesAny(value, ['project', '项目'])) return 'project-page';

    if (includesAny(value, ['book', 'monograph', '图书', '专著'])) {
        if (includesAny(value, ['pdf', 'file', '文件'])) return 'book-file';
        if (includesAny(value, ['index', 'catalog', 'metadata', 'bibliographic', '索引', '书目', '元数据']))
            return 'book-index';
        if (includesAny(value, ['page', '页面'])) return 'book-page';
        return 'book';
    }

    if (includesAny(value, ['paper', '论文'])) {
        if (includesAny(value, ['pdf', 'file', '文件'])) return 'paper-file';
        if (includesAny(value, ['index', 'bibliographic', '索引', '书目'])) return 'paper-index';
        if (includesAny(value, ['page', 'record', 'openreview', 'doi', '页面', '记录'])) return 'paper-page';
        return 'paper';
    }

    if (includesAny(value, ['blog', 'article', 'history', 'overview', '博客', '文章', '历史', '概览']))
        return 'article';
    return '';
}

function sourceTypeFromLegacy(rawType, label, title, url) {
    const explicitType = classifySourceText(`${sourceText(rawType)} ${sourceText(label)}`.trim().toLowerCase());
    if (explicitType) return explicitType;

    const titleType = classifySourceText(sourceText(title).toLowerCase());
    if (titleType) return titleType;

    const normalizedUrl = sourceText(url).toLowerCase();
    if (normalizedUrl.includes('wikipedia.org/')) return 'encyclopedia-entry';
    if (normalizedUrl.includes('github.com/')) return 'code';
    if (includesAny(normalizedUrl, ['openreview.net/', 'doi.org/', 'arxiv.org/abs/'])) return 'paper-page';
    if (/\.pdf(?:$|[?#/])/.test(normalizedUrl)) return 'paper-file';
    return 'article';
}

function sourceLabel(type) {
    const label = SOURCE_LABELS.get(type) || SOURCE_LABELS.get('article');
    return { zh: label.zh, en: label.en };
}

function sourceTitle(type, title) {
    const normalized = { zh: String(title.zh || ''), en: String(title.en || '') };
    if (['paper', 'book'].includes(type) && normalized.zh && !/^《.+》$/.test(normalized.zh)) {
        normalized.zh = `《${normalized.zh}》`;
    }
    return normalized;
}

function sourcePurpose(type, index = 0, ...contextValues) {
    const context = contextValues.map(sourceText).join(' ').toLowerCase();
    if (type === 'internal-record') return 'migration-only';
    if (type === 'paper') {
        if (includesAny(context, ['precursor', 'foundational', '前序', '源流'])) return 'precursor';
        if (includesAny(context, ['follow-up', 'follow up', '后续'])) return 'follow-up';
        return index === 0 ? 'core-evidence' : 'background';
    }
    if (['paper-page', 'paper-file', 'paper-index', 'book-page', 'book-file', 'book-index'].includes(type))
        return 'alternate-access';
    if (['code', 'documentation', 'project-page'].includes(type)) return 'implementation';
    if (['profile', 'personal-page'].includes(type)) return 'biography';
    if (type === 'image-source') return 'image-provenance';
    if (type === 'dataset') return 'dataset-access';
    if (type === 'statement') return 'official-statement';
    if (type === 'news') return 'contemporary-reporting';
    if (type === 'report') return 'reporting';
    if (type === 'archive') return 'historical-context';
    return 'background';
}

function sourceReliability(type, _index = 0, explicitValue = '') {
    if (RELIABILITY_LEVELS.has(explicitValue)) return explicitValue;
    if (type === 'internal-record') return 'reference-only';
    if (
        [
            'paper',
            'book',
            'thesis',
            'statement',
            'official-page',
            'personal-page',
            'project-page',
            'documentation',
            'code',
            'dataset',
            'archive'
        ].includes(type)
    )
        return 'primary';
    if (['paper-page', 'paper-file', 'book-page', 'book-file', 'profile', 'article', 'news', 'report'].includes(type))
        return 'secondary';
    return 'reference-only';
}

module.exports = {
    sourceLabel,
    sourcePurpose,
    sourceReliability,
    sourceTitle,
    sourceTypeFromLegacy
};
