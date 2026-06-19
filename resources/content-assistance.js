// Structured, deterministic content assistance primitives.
// This module is intentionally LLM-free; it defines traceable inputs and
// outputs that future model-backed generation can reuse.

(function initContentAssistance(root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.contentAssistance = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function contentAssistanceFactory() {
  'use strict';

  const IMAGE_METADATA_SCHEMA_VERSION = 'image-metadata-suggestion/v1';
  const RULE_BASED_GENERATOR_ID = 'rule-based-image-metadata/v1';
  const SUPPORTED_LOCALES = ['zh', 'en'];

  function asString(value) {
    if (isLocalizedText(value)) return getLocalizedText(value);
    return String(value || '').trim();
  }

  function isLocalizedText(value) {
    return Boolean(
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      SUPPORTED_LOCALES.some((locale) => Object.prototype.hasOwnProperty.call(value, locale))
    );
  }

  function getLocalizedText(value, locale = 'zh') {
    if (!isLocalizedText(value)) return String(value || '').trim();
    return String(value[locale] || value.zh || value.en || '').trim();
  }

  function localizedText(zh, en) {
    return {
      zh: asString(zh),
      en: asString(en || zh),
    };
  }

  function cloneMetadataText(value) {
    if (isLocalizedText(value)) {
      return Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [locale, getLocalizedText(value, locale)]));
    }
    return asString(value);
  }

  function hasPortraitSignal(imagePath) {
    return /\/people\/|portrait|headshot|avatar|人物|人像/i.test(asString(imagePath));
  }

  function hasArchitectureSignal(imagePath) {
    return /\/architecture\//i.test(asString(imagePath)) || /_architecture_/i.test(asString(imagePath));
  }

  function hasExplainerSignal(imagePath) {
    return /\/explainers?\//i.test(asString(imagePath)) || /_explainer_/i.test(asString(imagePath));
  }

  function hasDocumentSignal(imagePath) {
    return (
      /\/papers\//i.test(asString(imagePath)) ||
      /_papers_/i.test(asString(imagePath)) ||
      /proposal|paper|document|page|sheet|scan|manuscript|report|doc|论文|提案|文稿|手稿/i.test(asString(imagePath))
    );
  }

  function hasHistoricalSignal(imagePath) {
    return /\/historical\//i.test(asString(imagePath)) || /_historical_/i.test(asString(imagePath));
  }

  function extractWorkTitleFromAttribution(attribution) {
    const match = asString(attribution).match(/《([^》]+)》/);
    return match ? asString(match[1]) : '';
  }

  function getQuoteWorkTitle(event) {
    const ev = event && typeof event === 'object' ? event : {};
    const metaTitle = ev.quoteMeta && typeof ev.quoteMeta === 'object' ? asString(ev.quoteMeta.workTitle) : '';
    return metaTitle || extractWorkTitleFromAttribution(ev.quoteAttribution);
  }

  function buildTraceSource(type, field, value) {
    return { type, field, value: asString(value) };
  }

  function buildImageMetadataSuggestion(eventKey, event, imagePath) {
    const ev = event && typeof event === 'object' ? event : {};
    const title = getLocalizedText(ev.title || eventKey, 'zh');
    const titleEn = getLocalizedText(ev.title || eventKey, 'en') || title;
    const year = ev.year === undefined || ev.year === null ? '' : asString(ev.year);
    const category = getLocalizedText(ev.category, 'zh');
    const quoteWorkTitle = getQuoteWorkTitle(ev);
    const pathValue = asString(imagePath);

    let caption = localizedText('档案图片', 'Archive image');
    let subcaption = localizedText(title || category || '事件相关资料', titleEn || 'Event material');
    let ruleId = 'fallback-archive';
    const matchedSignals = [];

    if (hasPortraitSignal(pathValue)) {
      caption = localizedText('人物肖像', 'Portrait');
      subcaption = localizedText('相关研究者照片', 'Researcher photo');
      ruleId = 'path-people';
      matchedSignals.push('/people/', 'portrait');
    } else if (hasExplainerSignal(pathValue)) {
      caption = localizedText('概念示意', 'Concept diagram');
      subcaption = localizedText(
        title ? `${title} 概念示意图` : '概念示意图',
        titleEn ? `${titleEn} concept diagram` : 'Concept diagram'
      );
      ruleId = 'path-explainer';
      matchedSignals.push('/explainers/', '_explainer_');
    } else if (hasArchitectureSignal(pathValue)) {
      caption = localizedText('结构示意', 'Architecture');
      subcaption = localizedText(
        title ? `${title} 架构图` : '模型架构图',
        titleEn ? `${titleEn} architecture diagram` : 'Model architecture'
      );
      ruleId = 'path-architecture';
      matchedSignals.push('/architecture/', '_architecture_');
    } else if (hasDocumentSignal(pathValue)) {
      caption = localizedText('论文页面', 'Paper page');
      subcaption = localizedText(
        quoteWorkTitle ? `《${quoteWorkTitle}》` : (title || '原文截图或摘要'),
        quoteWorkTitle || titleEn || 'Original screenshot or abstract'
      );
      ruleId = 'path-document';
      matchedSignals.push('/papers/', '_papers_', 'document-keyword');
    } else if (hasHistoricalSignal(pathValue)) {
      caption = localizedText('历史照片', 'Historical photo');
      subcaption = localizedText(title || (year ? `${year} 年相关档案` : '事件相关档案'), titleEn || 'Event archive');
      ruleId = 'path-historical';
      matchedSignals.push('/historical/', '_historical_');
    }

    const sources = [
      buildTraceSource('event', 'key', eventKey),
      buildTraceSource('event', 'title', title),
      buildTraceSource('event', 'year', year),
      buildTraceSource('image', 'path', pathValue),
    ];
    if (category) sources.push(buildTraceSource('event', 'category', category));
    if (quoteWorkTitle) sources.push(buildTraceSource('quote', 'workTitle', quoteWorkTitle));

    return {
      schemaVersion: IMAGE_METADATA_SCHEMA_VERSION,
      generatedBy: RULE_BASED_GENERATOR_ID,
      status: 'suggested',
      caption,
      subcaption,
      trace: {
        ruleId,
        matchedSignals,
        sources,
      },
    };
  }

  function approveImageMetadataSuggestion(suggestion, approvedBy) {
    const source = suggestion && typeof suggestion === 'object' ? suggestion : {};
    return {
      caption: cloneMetadataText(source.caption),
      subcaption: cloneMetadataText(source.subcaption),
      approval: {
        status: 'human-approved',
        approvedBy: asString(approvedBy || 'admin-ui'),
        approvedAt: new Date().toISOString(),
      },
      generationTrace: {
        schemaVersion: asString(source.schemaVersion || IMAGE_METADATA_SCHEMA_VERSION),
        generatedBy: asString(source.generatedBy || RULE_BASED_GENERATOR_ID),
        trace: source.trace && typeof source.trace === 'object' ? source.trace : {},
      },
    };
  }

  function normalizeImageMetadataEntry(entry) {
    const source = entry && typeof entry === 'object' ? entry : {};
    const result = {
      caption: cloneMetadataText(source.caption || source.title || source.name),
      subcaption: cloneMetadataText(source.subcaption || source.subtitle || source.description || source.role),
    };
    if (source.approval && typeof source.approval === 'object') result.approval = source.approval;
    if (source.generationTrace && typeof source.generationTrace === 'object') result.generationTrace = source.generationTrace;
    return result;
  }

  return {
    IMAGE_METADATA_SCHEMA_VERSION,
    RULE_BASED_GENERATOR_ID,
    buildImageMetadataSuggestion,
    getLocalizedText,
    isLocalizedText,
    approveImageMetadataSuggestion,
    normalizeImageMetadataEntry,
  };
});
