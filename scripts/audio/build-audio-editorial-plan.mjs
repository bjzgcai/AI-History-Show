#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ARCHIVE = path.join(ROOT, 'archive');
const STORYLINES = path.join(ARCHIVE, 'storylines');
const EVENTS = path.join(ARCHIVE, 'events');
const OUTPUT_DIR = path.join(ROOT, 'resources', 'audio', 'plans', 'ai100-first-40-and-gaming');
const OUTPUT_JSON = path.join(OUTPUT_DIR, 'editorial-plan.json');
const OUTPUT_MARKDOWN = path.join(OUTPUT_DIR, 'editorial-plan.md');

const AI100_ID = 'bench-council-ai100';
const GAMING_ID = 'gaming-ai';
const AI100_LIMIT = 40;
const MAX_CONSECUTIVE_FORMAT = 3;

const FORMAT_LABELS = {
    dialogue: { zh: '双人问答', en: 'Two-speaker dialogue' },
    narration: { zh: '单人讲述', en: 'Single narration' },
    hybrid: { zh: '情景复现 / 混合形式', en: 'Reenactment / hybrid' }
};

const CLOSING_LABELS = {
    summary: { zh: '明确总结', en: 'Summary' },
    'open-question': { zh: '开放问题', en: 'Open question' },
    'forward-hook': { zh: '向后预告', en: 'Forward hook' },
    'historical-echo': { zh: '历史回响', en: 'Historical echo' }
};

const assignment = (eventId, format, narrativeStyle, styleZh, styleEn, closingType, targetDurationSec) => ({
    eventId,
    format,
    formatLabel: FORMAT_LABELS[format],
    narrativeStyle,
    narrativeStyleLabel: { zh: styleZh, en: styleEn },
    closingType,
    closingLabel: CLOSING_LABELS[closingType],
    targetDurationSec
});

const AI100_FIRST_40_ASSIGNMENTS = [
    assignment(
        '1950-turing-test',
        'dialogue',
        'thought-experiment',
        '思想实验',
        'Thought experiment',
        'open-question',
        95
    ),
    assignment('1971-complexity-theory', 'dialogue', 'conceptual-map', '概念地图', 'Conceptual map', 'summary', 80),
    assignment('1971-vc-theory', 'dialogue', 'boundary-analogy', '边界类比', 'Boundary analogy', 'summary', 95),
    assignment(
        '1956-logic-theorist',
        'hybrid',
        'mathematical-mystery-reenactment',
        '数学悬案情景复现',
        'Mathematical-mystery reenactment',
        'forward-hook',
        105
    ),
    assignment(
        '1958-wangs-algorithm',
        'dialogue',
        'procedural-proof-demo',
        '证明过程演示',
        'Procedural proof demo',
        'summary',
        90
    ),
    assignment('1960-davis-putnam-dpll', 'dialogue', 'puzzle-search', '谜题搜索', 'Puzzle search', 'open-question', 95),
    assignment('1965-resolution-method', 'dialogue', 'courtroom-proof', '法庭式证明', 'Courtroom proof', 'summary', 95),
    assignment(
        '1990-otter',
        'narration',
        'historical-culmination',
        '历史汇流',
        'Historical culmination',
        'historical-echo',
        90
    ),
    assignment(
        '1958-lisp',
        'hybrid',
        'inventor-tool-reenactment',
        '人物与工具诞生情景',
        'Inventor-and-tool reenactment',
        'forward-hook',
        100
    ),
    assignment('1973-prolog', 'dialogue', 'rule-query-demo', '规则与查询演示', 'Rule-and-query demo', 'summary', 95),
    assignment(
        '1966-eliza',
        'hybrid',
        'reenacted-conversation',
        '对话情景复现',
        'Reenacted conversation',
        'open-question',
        90
    ),
    assignment(
        '1970-shrdlu',
        'narration',
        'reenacted-microworld',
        '微世界情景讲述',
        'Microworld reenactment',
        'open-question',
        90
    ),
    assignment(
        '2011-ibm-watson',
        'hybrid',
        'quiz-show-analysis',
        '知识竞赛现场分析',
        'Quiz-show analysis',
        'historical-echo',
        110
    ),
    assignment(
        '1951-strachey-draughts',
        'narration',
        'pioneer-origin',
        '先驱人物故事',
        'Pioneer origin story',
        'forward-hook',
        90
    ),
    assignment(
        '1994-chinook',
        'dialogue',
        'champion-system-analysis',
        '冠军系统拆解',
        'Champion-system analysis',
        'summary',
        100
    ),
    assignment(
        '1997-deep-blue',
        'dialogue',
        'match-analysis',
        '赛事回顾与机制分析',
        'Match recap and mechanism analysis',
        'historical-echo',
        110
    ),
    assignment(
        '1959-pandemonium',
        'hybrid',
        'layered-voices-reenactment',
        '分层声音情景复现',
        'Layered-voices reenactment',
        'summary',
        90
    ),
    assignment(
        '1974-frame',
        'dialogue',
        'knowledge-structure-analogy',
        '知识结构类比',
        'Knowledge-structure analogy',
        'summary',
        95
    ),
    assignment(
        '1984-cyc',
        'dialogue',
        'knowledge-engineering-odyssey',
        '知识工程长征',
        'Knowledge-engineering odyssey',
        'open-question',
        110
    ),
    assignment('1965-dendral', 'narration', 'science-mystery', '科学悬案', 'Scientific mystery', 'forward-hook', 105),
    assignment('1980-xcon-r1', 'dialogue', 'industrial-case', '工业案例', 'Industrial case study', 'summary', 100),
    assignment(
        '1957-kmeans',
        'dialogue',
        'short-visual-explainer',
        '短篇视觉解释',
        'Short visual explainer',
        'open-question',
        70
    ),
    assignment('1996-dbscan', 'dialogue', 'density-map', '密度地图类比', 'Density-map analogy', 'summary', 90),
    assignment('2000-spectral-clustering', 'narration', 'graph-journey', '图结构漫游', 'Graph journey', 'summary', 95),
    assignment(
        'ai100-1967-knn',
        'narration',
        'neighbor-vote',
        '邻居投票短科普',
        'Neighbor-vote explainer',
        'summary',
        70
    ),
    assignment(
        'ai100-1970-ridge',
        'dialogue',
        'stability-debate',
        '稳定性辩论',
        'Stability debate',
        'forward-hook',
        85
    ),
    assignment('1992-svm', 'dialogue', 'margin-visual', '最大间隔视觉类比', 'Maximum-margin visual', 'summary', 70),
    assignment(
        '1996-lasso',
        'dialogue',
        'feature-selection-metaphor',
        '特征筛选类比',
        'Feature-selection metaphor',
        'summary',
        85
    ),
    assignment('1999-sift', 'narration', 'visual-detective', '视觉侦探', 'Visual detective', 'forward-hook', 95),
    assignment('ai100-2005-hog', 'dialogue', 'silhouette-explainer', '轮廓拆解', 'Silhouette explainer', 'summary', 90),
    assignment(
        'ai100-2006-surf',
        'dialogue',
        'speed-versus-detail',
        '速度与细节对比',
        'Speed-versus-detail contrast',
        'summary',
        85
    ),
    assignment(
        'ai100-1997-kernel-pca',
        'dialogue',
        'curved-space-analogy',
        '弯曲空间类比',
        'Curved-space analogy',
        'open-question',
        95
    ),
    assignment('ai100-1999-nmf', 'narration', 'parts-based-story', '部件分解故事', 'Parts-based story', 'summary', 90),
    assignment('ai100-2000-isomap', 'dialogue', 'manifold-road-map', '流形道路图', 'Manifold road map', 'summary', 100),
    assignment('ai100-2000-lle', 'narration', 'neighborhood-map', '邻域地图', 'Neighborhood map', 'forward-hook', 90),
    assignment(
        '2008-tsne',
        'dialogue',
        'visualization-caution',
        '可视化与误读',
        'Visualization and caution',
        'open-question',
        95
    ),
    assignment(
        'ai100-1943-mcculloch-pitts-neuron',
        'narration',
        'neuron-origin',
        '人工神经元起源',
        'Artificial-neuron origin',
        'forward-hook',
        100
    ),
    assignment(
        'ai100-1951-snarc',
        'narration',
        'machine-reenactment',
        '机器现场复现',
        'Machine reenactment',
        'historical-echo',
        90
    ),
    assignment(
        '1957-perceptron',
        'dialogue',
        'learning-machine-debate',
        '学习机器争论',
        'Learning-machine debate',
        'open-question',
        105
    ),
    assignment(
        '1982-hopfield-network',
        'narration',
        'memory-landscape',
        '记忆能量地形',
        'Memory landscape',
        'open-question',
        100
    )
];

const AI100_OVERLAP_ASSIGNMENTS = new Map([
    ...AI100_FIRST_40_ASSIGNMENTS.map((item) => [item.eventId, item]),
    [
        '1988-td-update',
        assignment(
            '1988-td-update',
            'dialogue',
            'prediction-error',
            '预测误差拆解',
            'Prediction-error explainer',
            'forward-hook',
            90
        )
    ],
    [
        '2013-dqn',
        assignment(
            '2013-dqn',
            'dialogue',
            'arcade-learning',
            '街机学习实验',
            'Arcade-learning experiment',
            'summary',
            100
        )
    ],
    [
        '2016-alphago',
        assignment(
            '2016-alphago',
            'narration',
            'sports-documentary',
            '赛事纪录片',
            'Sports documentary',
            'historical-echo',
            125
        )
    ]
]);

const GAMING_ASSIGNMENTS = new Map([
    [
        '1997-logistello',
        assignment(
            '1997-logistello',
            'hybrid',
            'match-reconstruction',
            '比赛情景复现',
            'Match reconstruction',
            'historical-echo',
            100
        )
    ],
    [
        '2000s-alphacat',
        assignment(
            '2000s-alphacat',
            'narration',
            'go-lineage',
            '围棋程序谱系',
            'Go-program lineage',
            'forward-hook',
            85
        )
    ],
    [
        '2017-alphazero',
        assignment(
            '2017-alphazero',
            'dialogue',
            'self-play-explainer',
            '自我对弈拆解',
            'Self-play explainer',
            'forward-hook',
            105
        )
    ],
    [
        '2017-libratus',
        assignment(
            '2017-libratus',
            'hybrid',
            'poker-table-reconstruction',
            '扑克桌情景复现',
            'Poker-table reconstruction',
            'open-question',
            110
        )
    ],
    [
        '2019-pluribus',
        assignment(
            '2019-pluribus',
            'dialogue',
            'multi-agent-poker-analysis',
            '多人扑克分析',
            'Multi-agent poker analysis',
            'historical-echo',
            110
        )
    ],
    [
        '2019-suphx',
        assignment(
            '2019-suphx',
            'narration',
            'mahjong-uncertainty',
            '麻将不确定性讲述',
            'Mahjong uncertainty narrative',
            'open-question',
            100
        )
    ],
    [
        '2019-muzero',
        assignment(
            '2019-muzero',
            'dialogue',
            'learned-model-explainer',
            '学习型模型拆解',
            'Learned-model explainer',
            'open-question',
            110
        )
    ]
]);

const AI100_RELATIONS = [
    ['1950-turing-test', '1966-eliza', 'problem-echo', '行为判断与对话表现的早期问题回响'],
    ['1966-eliza', '1970-shrdlu', 'method-contrast', '语言错觉与有世界模型的受限理解形成对比'],
    ['1970-shrdlu', '2011-ibm-watson', 'task-scale-evolution', '从积木微世界转向开放知识问答系统'],
    ['1971-complexity-theory', '1971-vc-theory', 'theory-contrast', '计算资源边界与学习泛化边界的理论对照'],
    ['1956-logic-theorist', '1958-wangs-algorithm', 'technical-lineage', '自动定理证明方法谱系'],
    ['1958-wangs-algorithm', '1960-davis-putnam-dpll', 'technical-lineage', '逻辑判定与搜索方法谱系'],
    ['1960-davis-putnam-dpll', '1965-resolution-method', 'technical-lineage', '命题求解与通用归结推理的推进'],
    ['1965-resolution-method', '1990-otter', 'application-progression', '归结方法走向自动定理证明系统'],
    ['1958-lisp', '1973-prolog', 'language-contrast', '两种符号 AI 编程传统的对照'],
    ['1951-strachey-draughts', '1994-chinook', 'game-system-lineage', '早期棋类程序走向冠军级搜索系统'],
    ['1994-chinook', '1997-deep-blue', 'game-system-lineage', '棋类搜索、评估与系统工程的公众突破'],
    ['1974-frame', '1984-cyc', 'knowledge-representation', '局部知识结构与大规模常识工程的延伸'],
    ['1965-dendral', '1980-xcon-r1', 'application-progression', '领域知识从科学推断走向工业配置'],
    ['1957-kmeans', '1996-dbscan', 'method-contrast', '中心式聚类与密度式聚类的对照'],
    ['1996-dbscan', '2000-spectral-clustering', 'method-contrast', '密度结构与图结构聚类的对照'],
    ['ai100-1967-knn', '1992-svm', 'classifier-contrast', '邻域投票与最大间隔分类的对照'],
    ['ai100-1970-ridge', '1996-lasso', 'regularization-lineage', '两类经典正则化方法的联系与差异'],
    ['1999-sift', 'ai100-2005-hog', 'feature-lineage', '局部关键点与梯度轮廓特征的视觉表示谱系'],
    ['ai100-2005-hog', 'ai100-2006-surf', 'feature-lineage', '手工视觉特征对速度与表达力的不同权衡'],
    ['ai100-1997-kernel-pca', 'ai100-2000-isomap', 'nonlinear-representation', '核方法与流形方法的非线性表示对照'],
    ['ai100-2000-isomap', 'ai100-2000-lle', 'nonlinear-representation', '全局测地距离与局部邻域保持的流形学习对照'],
    ['ai100-2000-lle', '2008-tsne', 'visualization-progression', '从流形嵌入走向概率式可视化'],
    ['ai100-1943-mcculloch-pitts-neuron', 'ai100-1951-snarc', 'neural-lineage', '形式神经元走向早期神经网络机器'],
    ['ai100-1951-snarc', '1957-perceptron', 'neural-lineage', '早期神经机器走向可训练分类器'],
    ['1957-perceptron', '1982-hopfield-network', 'neural-lineage', '前馈学习模型与联想记忆网络的历史连接']
];

const GAMING_RELATIONS = [
    ['1951-strachey-draughts', '1994-chinook', 'game-system-lineage', '从早期跳棋程序到冠军级跳棋系统'],
    ['1994-chinook', '1997-logistello', 'game-system-contrast', '不同棋类中的搜索、评估与工程积累'],
    ['1997-logistello', '1997-deep-blue', 'public-milestone', '1990 年代棋类 AI 的连续突破'],
    ['1988-td-update', '2013-dqn', 'learning-lineage', '时序差分思想进入深度强化学习'],
    ['2000s-alphacat', '2016-alphago', 'go-lineage', '早期围棋程序与神经搜索系统的对照'],
    ['2016-alphago', '2017-alphazero', 'self-play-lineage', '从人类棋谱起点走向更纯粹的自我对弈'],
    ['2017-alphazero', '2019-muzero', 'planning-lineage', '从已知规则规划走向学习内部动态模型'],
    ['1997-deep-blue', '2016-alphago', 'method-contrast', '专家知识与大规模搜索对比学习型评估与搜索'],
    ['2017-libratus', '2019-pluribus', 'imperfect-information-lineage', '从双人扑克走向多人不完全信息博弈'],
    ['2019-pluribus', '2019-suphx', 'hidden-information-contrast', '扑克与麻将中的多人、隐信息和长期决策对照']
];

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function writeFormatted(filePath, content) {
    const config = (await prettier.resolveConfig(filePath)) || {};
    const formatted = await prettier.format(content, { ...config, filepath: filePath });
    fs.writeFileSync(filePath, formatted);
}

function exists(filePath) {
    return fs.existsSync(filePath);
}

function localizedComplete(value) {
    return Boolean(
        value && typeof value === 'object' && String(value.zh || '').trim() && String(value.en || '').trim()
    );
}

function unique(values) {
    return [...new Set(values.filter(Boolean))];
}

function getEnabledStorylines() {
    const result = new Map();
    for (const fileName of fs.readdirSync(STORYLINES).filter((name) => name.endsWith('.json'))) {
        const storyline = readJson(path.join(STORYLINES, fileName));
        for (const entry of storyline.events || []) {
            if (!entry.enabled) continue;
            const memberships = result.get(entry.eventId) || [];
            memberships.push({ storylineId: storyline.id, variantId: entry.variant, order: entry.order });
            result.set(entry.eventId, memberships);
        }
    }
    return result;
}

function selectAi100First40(storyline) {
    return (storyline.events || [])
        .map((entry, sourceIndex) => ({ ...entry, sourceIndex }))
        .filter((entry) => entry.enabled)
        .sort((left, right) => left.order - right.order || left.sourceIndex - right.sourceIndex)
        .slice(0, AI100_LIMIT);
}

function primarySourceCount(sources) {
    const primaryTypes = new Set([
        'paper',
        'paper-page',
        'thesis',
        'documentation',
        'official-page',
        'project-page',
        'archive',
        'book',
        'manual'
    ]);
    return sources.filter((source) => primaryTypes.has(source.type)).length;
}

function auditEvent(eventId, variantId) {
    const eventDir = path.join(EVENTS, eventId);
    const eventPath = path.join(eventDir, 'event.json');
    const claimsPath = path.join(eventDir, 'claims.json');
    const sourcesPath = path.join(eventDir, 'sources.json');
    const variantPath = path.join(eventDir, 'variants', `${variantId}.json`);
    const missingFiles = [eventPath, claimsPath, sourcesPath, variantPath].filter((filePath) => !exists(filePath));

    if (missingFiles.length) {
        return {
            status: 'blocked',
            referenceComplete: false,
            missingFiles: missingFiles.map((filePath) => path.relative(ROOT, filePath)),
            missingSourceIds: [],
            missingClaimIds: [],
            warnings: []
        };
    }

    const event = readJson(eventPath);
    const claims = readJson(claimsPath);
    const sources = readJson(sourcesPath);
    const variant = readJson(variantPath);
    const sourceById = new Map(sources.map((source) => [source.id, source]));
    const claimById = new Map(claims.map((claim) => [claim.id, claim]));
    const selectedSourceIds = unique(variant.sourceIds || []);
    const selectedClaimIds = unique(variant.claimIds || []);
    const missingSourceIds = selectedSourceIds.filter((sourceId) => !sourceById.has(sourceId));
    const missingClaimIds = selectedClaimIds.filter((claimId) => !claimById.has(claimId));
    const selectedClaims = selectedClaimIds.map((claimId) => claimById.get(claimId)).filter(Boolean);
    const selectedSources = selectedSourceIds.map((sourceId) => sourceById.get(sourceId)).filter(Boolean);
    const claimSourceIds = unique(selectedClaims.flatMap((claim) => claim.sourceIds || []));
    const missingClaimSourceIds = claimSourceIds.filter((sourceId) => !sourceById.has(sourceId));
    const claimStatuses = Object.groupBy(selectedClaims, (claim) => claim.status || 'unspecified');
    const warnings = [];

    if (!localizedComplete(event.title)) warnings.push('event-title-not-bilingual');
    if (!localizedComplete(event.description)) warnings.push('event-description-not-bilingual');
    if (!localizedComplete(variant.displayTitle)) warnings.push('variant-title-not-bilingual');
    if (!localizedComplete(variant.displayDescription)) warnings.push('variant-description-not-bilingual');
    if ((variant.emphasis || []).includes('source-review-needed')) warnings.push('variant-source-review-needed');
    if (selectedSources.length === 0) warnings.push('variant-has-no-selected-sources');
    if (primarySourceCount(selectedSources) === 0) warnings.push('variant-has-no-primary-source-type');
    if (selectedClaims.some((claim) => claim.status !== 'verified'))
        warnings.push('selected-claims-not-fully-verified');

    const blocked = missingSourceIds.length || missingClaimIds.length || missingClaimSourceIds.length;
    const status = blocked ? 'blocked' : warnings.length ? 'needs-review' : 'ready';
    const figures = unique([...(variant.figures || []), ...(event.figures || [])].map((figure) => figure.figureId));

    return {
        status,
        referenceComplete: !blocked && selectedSources.length > 0,
        missingFiles: [],
        missingSourceIds,
        missingClaimIds,
        missingClaimSourceIds,
        warnings: unique(warnings),
        sourceCount: sources.length,
        selectedSourceCount: selectedSources.length,
        primarySelectedSourceCount: primarySourceCount(selectedSources),
        selectedSourceIds,
        selectedSourceTypes: Object.fromEntries(
            Object.entries(Object.groupBy(selectedSources, (source) => source.type || 'unspecified')).map(
                ([type, items]) => [type, items.length]
            )
        ),
        claimCount: claims.length,
        selectedClaimCount: selectedClaims.length,
        selectedClaimIds,
        selectedClaimStatuses: Object.fromEntries(
            Object.entries(claimStatuses).map(([statusName, items]) => [statusName, items.length])
        ),
        figureIds: figures,
        bilingual: {
            eventTitle: localizedComplete(event.title),
            eventDescription: localizedComplete(event.description),
            variantTitle: localizedComplete(variant.displayTitle),
            variantDescription: localizedComplete(variant.displayDescription)
        }
    };
}

function buildEventPlan({ scopeId, entry, sequenceIndex, memberships, ai100MemberSet, assignmentById }) {
    const eventPath = path.join(EVENTS, entry.eventId, 'event.json');
    const event = readJson(eventPath);
    const overlapsAi100 = ai100MemberSet.has(entry.eventId);
    const styleAuthority = scopeId === GAMING_ID && overlapsAi100 ? AI100_ID : scopeId;
    const effectiveVariantId = styleAuthority === AI100_ID ? AI100_ID : entry.variant;
    const editorial = assignmentById.get(entry.eventId);
    if (!editorial) throw new Error(`No editorial assignment for ${scopeId}/${entry.eventId}`);

    return {
        sequenceIndex,
        storylineOrder: entry.order,
        sourceIndex: entry.sourceIndex,
        eventId: entry.eventId,
        year: event.year,
        title: event.title,
        requestedVariantId: entry.variant,
        effectiveVariantId,
        styleAuthority,
        overlapsAi100,
        storylineMemberships: memberships.get(entry.eventId) || [],
        audit: auditEvent(entry.eventId, effectiveVariantId),
        editorial
    };
}

function relationObjects(relations, scopeEvents) {
    const byId = new Map(scopeEvents.map((event) => [event.eventId, event]));
    return relations.map(([fromEventId, toEventId, relationType, rationaleZh]) => {
        const from = byId.get(fromEventId);
        const to = byId.get(toEventId);
        if (!from || !to) throw new Error(`Relation endpoint missing in scope: ${fromEventId} -> ${toEventId}`);
        return {
            fromEventId,
            toEventId,
            relationType,
            rationale: { zh: rationaleZh, en: '' },
            evidenceSourceIds: unique([...from.audit.selectedSourceIds, ...to.audit.selectedSourceIds]),
            sourceReviewRequired: true,
            sharedFigureIds: from.audit.figureIds.filter((figureId) => to.audit.figureIds.includes(figureId))
        };
    });
}

function consecutiveFormatRuns(events) {
    const runs = [];
    let current = null;
    for (const event of events) {
        if (!current || current.format !== event.editorial.format) {
            if (current) runs.push(current);
            current = { format: event.editorial.format, count: 1, eventIds: [event.eventId] };
        } else {
            current.count += 1;
            current.eventIds.push(event.eventId);
        }
    }
    if (current) runs.push(current);
    return runs;
}

function summarizeScope(events) {
    const formatGroups = Object.groupBy(events, (event) => event.editorial.format);
    const closingGroups = Object.groupBy(events, (event) => event.editorial.closingType);
    const auditGroups = Object.groupBy(events, (event) => event.audit.status);
    const runs = consecutiveFormatRuns(events);
    return {
        eventCount: events.length,
        formats: Object.fromEntries(Object.entries(formatGroups).map(([key, items]) => [key, items.length])),
        closings: Object.fromEntries(Object.entries(closingGroups).map(([key, items]) => [key, items.length])),
        audits: Object.fromEntries(Object.entries(auditGroups).map(([key, items]) => [key, items.length])),
        referenceCompleteCount: events.filter((event) => event.audit.referenceComplete).length,
        maximumConsecutiveSameFormat: Math.max(...runs.map((run) => run.count)),
        consecutiveFormatRuns: runs
    };
}

function duplicateOrders(entries) {
    return Object.entries(Object.groupBy(entries, (entry) => entry.order))
        .filter(([, items]) => items.length > 1)
        .map(([order, items]) => ({ order: Number(order), eventIds: items.map((item) => item.eventId) }));
}

function markdownTable(events) {
    const lines = [
        '| # | Event | Year | Effective variant | Audit | Format | Style | Closing | Target |',
        '| ---: | --- | --- | --- | --- | --- | --- | --- | ---: |'
    ];
    for (const event of events) {
        lines.push(
            `| ${event.sequenceIndex} | \`${event.eventId}\` | ${event.year} | \`${event.effectiveVariantId}\` | ${event.audit.status} | ${event.editorial.formatLabel.zh} | ${event.editorial.narrativeStyleLabel.zh} | ${event.editorial.closingLabel.zh} | ${event.editorial.targetDurationSec}s |`
        );
    }
    return lines.join('\n');
}

function relationTable(relations) {
    const lines = ['| From | To | Type | Rationale | Shared figures |', '| --- | --- | --- | --- | --- |'];
    for (const relation of relations) {
        lines.push(
            `| \`${relation.fromEventId}\` | \`${relation.toEventId}\` | \`${relation.relationType}\` | ${relation.rationale.zh} | ${relation.sharedFigureIds.join(', ') || '-'} |`
        );
    }
    return lines.join('\n');
}

function auditWarnings(events) {
    return events
        .filter((event) => event.audit.status !== 'ready')
        .map(
            (event) =>
                `- \`${event.eventId}\`: ${event.audit.status}; ${[
                    ...event.audit.warnings,
                    ...event.audit.missingSourceIds.map((id) => `missing-source:${id}`),
                    ...event.audit.missingClaimIds.map((id) => `missing-claim:${id}`),
                    ...event.audit.missingClaimSourceIds.map((id) => `missing-claim-source:${id}`)
                ].join(', ')}`
        )
        .join('\n');
}

function buildMarkdown(plan) {
    const ai100 = plan.scopes[AI100_ID];
    const gaming = plan.scopes[GAMING_ID];
    return `# AI100 前 40 项与 AI 棋牌音频编辑规划

> 本文件由 \`scripts/audio/build-audio-editorial-plan.mjs\` 生成，当前只完成实施流程第 1–5 步，不包含正式文稿或音频。

## Policies

- AI100 仅选择 \`bench-council-ai100\` 中按 order 排序的前 ${AI100_LIMIT} 个 enabled 事件。
- AI 棋牌选择 \`gaming-ai\` 的全部 enabled 事件。
- 重叠事件使用 \`bench-council-ai100\` variant 与 AI100 editorial style。
- 同一种形式最多连续 ${MAX_CONSECUTIVE_FORMAT} 篇。
- 扩展 achievement 若未加入正式 storyline，不进入本规划。

## Scope Summary

| Scope | Events | References structurally complete | Ready | Needs review | Blocked | Max same-format run |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| AI100 first 40 | ${ai100.summary.eventCount} | ${ai100.summary.referenceCompleteCount} | ${ai100.summary.audits.ready || 0} | ${ai100.summary.audits['needs-review'] || 0} | ${ai100.summary.audits.blocked || 0} | ${ai100.summary.maximumConsecutiveSameFormat} |
| Gaming AI | ${gaming.summary.eventCount} | ${gaming.summary.referenceCompleteCount} | ${gaming.summary.audits.ready || 0} | ${gaming.summary.audits['needs-review'] || 0} | ${gaming.summary.audits.blocked || 0} | ${gaming.summary.maximumConsecutiveSameFormat} |

## Step 1–3: AI100 First 40 Selection and Audit

${markdownTable(ai100.events)}

### AI100 Audit Warnings

${auditWarnings(ai100.events) || 'No warnings.'}

## Step 1–3: Gaming AI Selection and Audit

${markdownTable(gaming.events)}

### Gaming Storyline Order Findings

${gaming.orderFindings.duplicateOrders.length ? gaming.orderFindings.duplicateOrders.map((item) => `- Duplicate order ${item.order}: ${item.eventIds.map((id) => `\`${id}\``).join(', ')}`).join('\n') : 'No duplicate orders.'}

### Gaming Audit Warnings

${auditWarnings(gaming.events) || 'No warnings.'}

## Step 4: AI100 Relationship Candidates

${relationTable(ai100.relations)}

## Step 4: Gaming Relationship Candidates

${relationTable(gaming.relations)}

## Step 5: Editorial Assignment Result

### AI100 Format Distribution

\`dialogue=${ai100.summary.formats.dialogue || 0}\`, \`narration=${ai100.summary.formats.narration || 0}\`, \`hybrid=${ai100.summary.formats.hybrid || 0}\`

### Gaming Format Distribution

\`dialogue=${gaming.summary.formats.dialogue || 0}\`, \`narration=${gaming.summary.formats.narration || 0}\`, \`hybrid=${gaming.summary.formats.hybrid || 0}\`

### AI100 Closing Distribution

\`summary=${ai100.summary.closings.summary || 0}\`, \`open-question=${ai100.summary.closings['open-question'] || 0}\`, \`forward-hook=${ai100.summary.closings['forward-hook'] || 0}\`, \`historical-echo=${ai100.summary.closings['historical-echo'] || 0}\`

### Gaming Closing Distribution

\`summary=${gaming.summary.closings.summary || 0}\`, \`open-question=${gaming.summary.closings['open-question'] || 0}\`, \`forward-hook=${gaming.summary.closings['forward-hook'] || 0}\`, \`historical-echo=${gaming.summary.closings['historical-echo'] || 0}\`

### Next Step

第 6 步检查整条序列的形式连续性。第 7 步才开始编写结构化中英文脚本与来源映射；在写稿前，应先处理 blocked audit，并人工确认所有 relationship candidate 的跨事件表述与 source。
`;
}

async function main() {
    const ai100Storyline = readJson(path.join(STORYLINES, `${AI100_ID}.json`));
    const gamingStoryline = readJson(path.join(STORYLINES, `${GAMING_ID}.json`));
    const memberships = getEnabledStorylines();
    const allAi100Entries = (ai100Storyline.events || []).filter((entry) => entry.enabled);
    const ai100MemberSet = new Set(allAi100Entries.map((entry) => entry.eventId));
    const ai100Entries = selectAi100First40(ai100Storyline);
    const gamingEntries = (gamingStoryline.events || [])
        .map((entry, sourceIndex) => ({ ...entry, sourceIndex }))
        .filter((entry) => entry.enabled);
    const ai100AssignmentById = new Map(AI100_FIRST_40_ASSIGNMENTS.map((item) => [item.eventId, item]));
    const gamingAssignmentById = new Map();

    for (const entry of gamingEntries) {
        const selected = ai100MemberSet.has(entry.eventId)
            ? AI100_OVERLAP_ASSIGNMENTS.get(entry.eventId)
            : GAMING_ASSIGNMENTS.get(entry.eventId);
        if (!selected) throw new Error(`No gaming assignment for ${entry.eventId}`);
        gamingAssignmentById.set(entry.eventId, selected);
    }

    const ai100Events = ai100Entries.map((entry, index) =>
        buildEventPlan({
            scopeId: AI100_ID,
            entry,
            sequenceIndex: index + 1,
            memberships,
            ai100MemberSet,
            assignmentById: ai100AssignmentById
        })
    );
    const gamingEvents = gamingEntries.map((entry, index) =>
        buildEventPlan({
            scopeId: GAMING_ID,
            entry,
            sequenceIndex: index + 1,
            memberships,
            ai100MemberSet,
            assignmentById: gamingAssignmentById
        })
    );

    const plan = {
        schemaVersion: 1,
        status: 'editorial-planning-step-5-complete',
        policies: {
            ai100StorylineId: AI100_ID,
            ai100EventLimit: AI100_LIMIT,
            gamingStorylineId: GAMING_ID,
            enabledEventsOnly: true,
            overlapStylePriority: AI100_ID,
            maximumConsecutiveSameFormat: MAX_CONSECUTIVE_FORMAT,
            excludedExtensionsByDefault: true
        },
        scopes: {
            [AI100_ID]: {
                selection: 'first-40-enabled-by-order',
                events: ai100Events,
                relations: relationObjects(AI100_RELATIONS, ai100Events),
                summary: summarizeScope(ai100Events)
            },
            [GAMING_ID]: {
                selection: 'all-enabled-in-storyline-source-order',
                events: gamingEvents,
                relations: relationObjects(GAMING_RELATIONS, gamingEvents),
                summary: summarizeScope(gamingEvents),
                orderFindings: {
                    duplicateOrders: duplicateOrders(gamingEntries),
                    sourceOrderPreserved: true
                }
            }
        }
    };

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    await writeFormatted(OUTPUT_JSON, `${JSON.stringify(plan, null, 2)}\n`);
    await writeFormatted(OUTPUT_MARKDOWN, buildMarkdown(plan));
    console.log(`Created ${path.relative(ROOT, OUTPUT_JSON)}`);
    console.log(`Created ${path.relative(ROOT, OUTPUT_MARKDOWN)}`);
}

await main();
