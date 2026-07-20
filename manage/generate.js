#!/usr/bin/env node
// LEGACY generator — rollback/comparison/migration only.
// Production data is generated from Archive JSON with `npm run generate`.
// Explicit use: `npm run generate:legacy` or parity tooling with --review-output.

'use strict';

const fs = require('fs');
const path = require('path');

// ─── 路径配置 ────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');
const VIDEOS_DIR = path.join(ROOT, 'resources', 'videos');

function getArg(name) {
    const flag = `--${name}`;
    const index = process.argv.indexOf(flag);
    return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : '';
}

const reviewOutput = getArg('review-output');
const REVIEW_MODE = Boolean(reviewOutput);
const OUTPUTS = REVIEW_MODE
    ? [path.resolve(ROOT, reviewOutput)]
    : [path.join(ROOT, 'milestones-data.js'), path.join(ROOT, 'milestones-data-default.js')];
const AVATAR_REGISTRY_PATH = path.join(__dirname, 'figure-avatars.js');
const RESEARCH_CANDIDATES_PATH = path.join(ROOT, 'resources', 'research-candidates.js');
const QUOTE_CANDIDATES_PATH = path.join(ROOT, 'resources', 'quote-candidates.js');
const QUIZ_CATALOG_PATH = path.join(__dirname, 'quizzes.js');
const QUIZ_STORYLINE_ID = 'bench-council-ai100';
const QUIZ_STORYLINE_IDS = new Set([QUIZ_STORYLINE_ID, 'gaming-ai']);
const { applyEventFusion } = require('./event-fusions.js');
const { applyArchiveOverlays } = require('../scripts/archive-compiler.js');
const {
    MILESTONE_ID_PREFIX,
    SUPPORTED_LOCALES,
    backupFile,
    countTextSentences,
    deriveEmbedUrl,
    detectVideoSource,
    formatQuoteAttribution,
    getLocalizedText,
    isLocalizedText,
    loadQuoteCandidates,
    mergeEditableQuoteMeta,
    normalizeQuoteText
} = require('../shared/utils.js');

const catalogConfig = require('./catalog.js');
const categories = Array.isArray(catalogConfig.categories) ? catalogConfig.categories : [];
const branches = Array.isArray(catalogConfig.branches) ? catalogConfig.branches : [];
const eventsMap = require('./events.js');
const avatarRegistry = loadAvatarRegistry();
const researchCandidates = loadResearchCandidates();
const quoteCandidates = loadQuoteCandidates(QUOTE_CANDIDATES_PATH);
const quizCatalog = loadQuizCatalog();

const ZH_QUOTE_ATTRIBUTIONS = {
    '1956-dartmouth': '《达特茅斯人工智能夏季研究项目提案》，约翰·麦卡锡、马文·明斯基、纳撒尼尔·罗切斯特、克劳德·香农',
    '1957-perceptron': '《感知机：一种用于大脑信息存储与组织的概率模型》，弗兰克·罗森布拉特',
    '1969-ai-winter': '《感知机：计算几何导论》，马文·明斯基、西摩·派珀特',
    '1986-backpropagation': '《通过误差反向传播学习表示》，大卫·鲁梅尔哈特、杰弗里·辛顿、罗纳德·威廉姆斯',
    '1989-cnn': '《基于梯度的学习在文档识别中的应用》，杨立昆、莱昂·博图、约书亚·本吉奥、帕特里克·哈夫纳',
    '1986-rnn': '《在时间中发现结构》，杰弗里·埃尔曼',
    '1997-lstm': '《长短期记忆》，塞普·霍赫赖特、尤尔根·施密德胡伯',
    '2012-alexnet': '《使用深度卷积神经网络进行 ImageNet 分类》，亚历克斯·克里热夫斯基、伊利亚·苏茨克维、杰弗里·辛顿',
    '2014-highway-network': '《高速网络》，鲁佩什·斯里瓦斯塔瓦、克劳斯·格雷夫、尤尔根·施密德胡伯',
    '2015-resnet': '《用于图像识别的深度残差学习》，何恺明、张祥雨、任少卿、孙剑',
    '2016-densenet': '《密集连接卷积网络》，黄高、刘壮、劳伦斯·范德马滕、基利安·温伯格',
    '2014-gan': '《生成对抗网络》，伊恩·古德费洛等',
    '2014-attention': '《通过联合学习对齐与翻译的神经机器翻译》，德米特里·巴赫达瑙、赵京贤、约书亚·本吉奥',
    '2017-transformer': '《注意力就是你所需要的一切》，阿希什·瓦斯瓦尼等',
    '2018-bert': '《BERT：用于语言理解的深度双向 Transformer 预训练》，雅各布·德夫林等',
    '2018-gpt': '《通过生成式预训练改进语言理解》，亚历克·拉德福德、卡尔蒂克·纳拉辛汉、蒂姆·萨利曼斯、伊利亚·苏茨克维',
    '2023-agents': '《ReAct：在语言模型中协同推理与行动》，姚顺雨等',
    '2025-llm-competition': '《Chatbot Arena：基于人类偏好的大语言模型开放评测平台》，蒋维霖等',
    '2020-alphafold': '《使用 AlphaFold 进行高精度蛋白质结构预测》，约翰·江珀等',
    '2019-ai-feynman': '《AI Feynman：一种受物理启发的符号回归方法》，西尔维乌-马里安·乌德雷斯库、马克斯·泰格马克',
    '2024-ai-scientist': '《AI 科学家》，克里斯·卢等'
};

const GAMING_BRANCH_EVOLUTION_MODULES = {
    '1951-strachey-draughts': {
        enName: "Strachey's draughts",
        zhName: '斯特雷奇跳棋',
        poster: 'resources/images/bench-council-ai100/explainers/1951-strachey-draughts_board-search.svg',
        description: {
            en: 'Fast draughts-board evolution slot from legal move generation into an evaluated choice.',
            zh: '从合法走法生成推进到评估选择的跳棋棋盘快速演化槽位。'
        }
    },
    '1988-td-update': {
        enName: 'TD-Gammon trajectory',
        zhName: 'TD-Gammon 轨迹',
        poster: 'resources/images/bench-council-ai100/explainers/1988-td-update_td-gammon-trajectory.svg',
        description: {
            en: 'Fast board-trajectory slot for showing value estimates changing across delayed rewards.',
            zh: '用于展示延迟奖励中价值估计变化的棋盘轨迹快速播放槽位。'
        }
    },
    '1994-chinook': {
        enName: 'Chinook',
        zhName: 'Chinook',
        poster: 'resources/images/bench-council-ai100/explainers/1994-chinook_perfect-play.svg',
        description: {
            en: 'Fast checkers evolution slot connecting opening search to solved endgame-table evidence.',
            zh: '连接开局搜索与已求解残局表证据的跳棋快速演化槽位。'
        }
    },
    '1997-deep-blue': {
        enName: 'Deep Blue',
        zhName: '深蓝',
        poster: 'resources/images/bench-council-ai100/explainers/1997-deep-blue_search-tree.svg',
        description: {
            en: 'Fast chess-position evolution slot from opening choices into a search-critical phase.',
            zh: '从开局选择推进到搜索关键阶段的国际象棋局面快速演化槽位。'
        }
    },
    '2013-dqn': {
        enName: 'DQN',
        zhName: 'DQN',
        poster: 'resources/images/bench-council-ai100/explainers/2013-dqn_atari-control-loop.svg',
        description: {
            en: 'Fast rollout slot for an Atari state trajectory, showing pixels, actions and replayed transitions.',
            zh: 'Atari 状态轨迹的快速播放槽位，展示像素、动作与被回放的转移。'
        }
    },
    '2016-alphago': {
        enName: 'AlphaGo',
        zhName: 'AlphaGo',
        poster: 'resources/images/bench-council-ai100/explainers/2016-alphago_policy-value-search.svg',
        description: {
            en: 'SGF-ready fast replay slot styled after AlphaGo move-by-move viewers.',
            zh: '面向 SGF 的快速回放槽位，呈现类似 AlphaGo 逐手棋局查看器的演化节奏。'
        }
    },
    '2017-alphazero': {
        enName: 'AlphaZero',
        zhName: 'AlphaZero',
        poster: 'resources/images/bench-council-ai100/explainers/2016-alphago_policy-value-search.svg',
        description: {
            en: 'Fast self-play evolution slot for Go, chess and shogi trajectories produced from game records.',
            zh: '面向围棋、国际象棋和将棋棋谱的自我博弈快速演化槽位。'
        }
    },
    '2017-libratus': {
        enName: 'Libratus',
        zhName: 'Libratus',
        poster: 'resources/images/bench-council-ai100/explainers/2017-libratus_poker-evolution.svg',
        description: {
            en: 'Fast poker-hand evolution slot from private cards to subgame refinement.',
            zh: '从暗牌局面推进到子局细化的扑克手牌快速演化槽位。'
        }
    },
    '2019-pluribus': {
        enName: 'Pluribus',
        zhName: 'Pluribus',
        poster: 'resources/images/bench-council-ai100/explainers/2019-pluribus_poker-evolution.svg',
        description: {
            en: 'Fast multiplayer poker evolution slot showing several opponents acting around one blueprint strategy.',
            zh: '展示多个对手围绕同一蓝图策略行动的多人扑克快速演化槽位。'
        }
    },
    '2019-muzero': {
        enName: 'MuZero',
        zhName: 'MuZero',
        poster: 'resources/images/bench-council-ai100/explainers/2019-muzero_game-evolution.svg',
        description: {
            en: 'Fast rollout slot for learned-model planning across Go, chess, shogi and Atari states.',
            zh: '面向围棋、国际象棋、将棋与 Atari 状态的学习模型规划快速演化槽位。'
        }
    }
};

// ─── 视频元数据缓存 ──────────────────────────────────────────────────────────

/** 读取 resources/videos/{key}.json，返回 candidate_videos 数组；文件不存在返回 null */
function loadVideoCatalog(key) {
    const file = path.join(VIDEOS_DIR, `${key}.json`);
    if (!fs.existsSync(file)) return null;
    try {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        return data.candidate_videos || [];
    } catch (e) {
        console.warn(`[警告] 无法解析视频文件 ${file}: ${e.message}`);
        return null;
    }
}

/** 从视频目录中按 ID 查找视频，返回精简的视频对象 */
function lookupVideo(catalog, id, key) {
    const entry = catalog.find((v) => v.id === id);
    if (!entry) {
        console.warn(`[警告] 事件 "${key}": 在视频目录中找不到 ID "${id}"，已跳过。`);
        return null;
    }
    // 只输出前端需要的字段
    return {
        id: entry.id,
        url: entry.url,
        embed_url: entry.embed_url,
        title: entry.title,
        channel: entry.channel,
        duration: entry.duration,
        thumbnail: entry.thumbnail,
        source: entry.source || 'YouTube'
    };
}

// ─── 构建里程碑数组 ──────────────────────────────────────────────────────────

const milestones = [];

function appendMilestonesFromGroup(group, groupKind) {
    const events = Array.isArray(group.events) ? group.events : [];

    for (const key of events) {
        const rawEvent = eventsMap[key];
        if (!rawEvent) {
            console.warn(`[警告] catalog.js ${groupKind} 中引用了 "${key}"，但 events.js 中不存在该事件，已跳过。`);
            continue;
        }
        const ev = applyEventFusion(key, eventsMap);
        const quoteKey = ev.fusionQuoteKey || key;

        const curatedQuote = selectCuratedQuote(quoteKey, ev);

        // 构建视频列表（支持字符串 ID 和 URL 对象两种格式）
        const videos = [];
        let catalog = null; // 懒加载，仅当存在字符串 ID 时才读取 JSON

        for (const item of ev.videos || []) {
            if (typeof item === 'string') {
                if (item.startsWith('http://') || item.startsWith('https://')) {
                    // 完整 URL（Bilibili 等）：先查 JSON 候选列表，找不到则直接构建
                    if (catalog === null) catalog = loadVideoCatalog(key);
                    const fromCatalog = catalog && catalog.find((v) => v.url === item);
                    if (fromCatalog) {
                        videos.push({
                            id: fromCatalog.id || fromCatalog.url,
                            url: fromCatalog.url,
                            embed_url: fromCatalog.embed_url || deriveEmbedUrl(fromCatalog.url),
                            title: fromCatalog.title || '',
                            channel: fromCatalog.channel || '',
                            duration: fromCatalog.duration || '',
                            thumbnail: fromCatalog.thumbnail || '',
                            source: fromCatalog.source || detectVideoSource(fromCatalog.url)
                        });
                    } else {
                        videos.push({
                            id: item,
                            url: item,
                            embed_url: deriveEmbedUrl(item),
                            title: '',
                            channel: '',
                            duration: '',
                            thumbnail: '',
                            source: detectVideoSource(item)
                        });
                    }
                } else {
                    // 短字符串：YouTube ID，从 resources/videos/{key}.json 查找元数据
                    if (catalog === null) {
                        catalog = loadVideoCatalog(key);
                        if (catalog === null) {
                            console.warn(
                                `[警告] 事件 "${key}" 包含视频 ID，但 resources/videos/${key}.json 不存在，字符串 ID 已跳过。`
                            );
                        }
                    }
                    if (catalog) {
                        const v = lookupVideo(catalog, item, key);
                        if (v) videos.push(v);
                    }
                }
            } else if (item && typeof item === 'object' && item.url) {
                // 对象：直接使用 URL，自动推导 embed_url 和 source
                videos.push({
                    id: item.id || item.url,
                    url: item.url,
                    embed_url: item.embed_url || deriveEmbedUrl(item.url),
                    title: item.title || '',
                    channel: item.channel || '',
                    duration: item.duration || '',
                    thumbnail: item.thumbnail || '',
                    source: item.source || detectVideoSource(item.url)
                });
            }
        }

        const rawCommentarySections = ev.commentarySections || buildCommentarySectionsOverride(key);
        const groupStoryline =
            group.storyline ||
            (groupKind === 'branch' && group.id
                ? {
                      id: group.id,
                      name: group.name
                  }
                : null);
        const storyline = ev.storyline || groupStoryline || null;
        const storylineId = typeof storyline === 'string' ? storyline : (storyline && storyline.id) || '';
        const commentarySections = normalizeCommentarySections(rawCommentarySections, ev, storylineId);
        const quizzes = QUIZ_STORYLINE_IDS.has(storylineId) ? selectQuizzes(key, ev) : [];
        const milestoneId =
            groupKind === 'branch' && group.id
                ? `${MILESTONE_ID_PREFIX}${group.id}-${key}`
                : `${MILESTONE_ID_PREFIX}${key}`;
        const milestone = {
            id: milestoneId,
            year: ev.year,
            category: group.name,
            title: ev.title,
            subtitle: group.subtitle || group.name,
            location: ev.location,
            description: ev.description,
            figures: (ev.figures || []).map((figure) => enrichFigure(figure, key)),
            photos: [], // 预留字段，暂不使用
            videoUrl: videos[0] ? videos[0].embed_url || videos[0].url || '' : '',
            quote: buildQuote(curatedQuote.text),
            quoteAttribution: curatedQuote.attribution,
            quoteMeta: curatedQuote.meta,
            quotePage: ev.quotePage || '',
            commentarySections,
            resources: {
                images: ev.images || [],
                imageMeta: ev.imageMeta || {},
                videos
            }
        };

        if (ev.fusionCanonical) milestone.fusionCanonical = ev.fusionCanonical;
        if (ev.quoteLabel) milestone.quoteLabel = ev.quoteLabel;
        if (storyline) milestone.storyline = storyline;
        if (ev.sentiment) milestone.sentiment = ev.sentiment;
        if (ev.realityLinks) milestone.realityLinks = ev.realityLinks;
        if (ev.branchSummary) milestone.branchSummary = ev.branchSummary;
        if (groupKind === 'branch' && group.id) {
            milestone.branch = {
                id: group.id,
                name: group.name
            };
        }
        if (ev.analysis) milestone.analysis = ev.analysis;
        if (ev.papers) milestone.papers = ev.papers;
        if (ev.achievement) milestone.achievement = ev.achievement;
        if (groupKind === 'branch' && group.id === 'gaming-ai') {
            applyGamingBranchEnhancements(milestone, key);
        }
        if (quizzes.length > 0) {
            milestone.quiz = quizzes[0];
            milestone.quizzes = quizzes;
        }

        milestones.push(milestone);
    }
}

categories.forEach((cat) => appendMilestonesFromGroup(cat, 'category'));
branches.forEach((branch) => appendMilestonesFromGroup(branch, 'branch'));

// ─── 辅助函数 ────────────────────────────────────────────────────────────────

function gameEvolutionVideo(key, options = {}) {
    const enName = options.enName || key;
    const zhName = options.zhName || enName;
    return {
        type: 'gameEvolutionVideo',
        site: {
            en: 'Game evolution clip',
            zh: '棋局演化短片'
        },
        title: options.title || {
            en: `${enName} game evolution`,
            zh: `${zhName} 棋局演化`
        },
        description: options.description || {
            en: 'Fast playback of game states from the opening into a key phase.',
            zh: '从开局快速推进到关键阶段的棋局状态播放。'
        },
        url: options.url || `resources/videos/game-evolution/${key}.mp4`,
        fallbackUrl: options.fallbackUrl || 'resources/videos/game-evolution/sample-go-game.gif',
        poster: options.poster || '',
        sourceSgf: options.sourceSgf || 'examples/sgf/sample-go-game.sgf',
        generator: 'scripts/sgf_to_video.py',
        duration: {
            en: 'about 1 min',
            zh: '约 1 分钟'
        },
        fps: '30',
        license: {
            en: 'Locally generated exhibition clip from curated game-state data; no external broadcast footage is reused.',
            zh: '由策展棋局状态数据本地生成的展览短片；不复用外部转播画面。'
        },
        usage: {
            en: 'Playable game-state evolution module',
            zh: '可播放的棋局状态演化模块'
        },
        action: {
            en: 'Play evolution clip',
            zh: '播放演化短片'
        }
    };
}

function cloneAchievement(achievement) {
    if (!achievement || typeof achievement !== 'object') return achievement;
    return {
        ...achievement,
        visualModules: Array.isArray(achievement.visualModules)
            ? achievement.visualModules.map((module) => ({ ...module }))
            : []
    };
}

function applyGamingBranchEnhancements(milestone, key) {
    const options = GAMING_BRANCH_EVOLUTION_MODULES[key];
    if (!options || !milestone.achievement) return;

    const achievement = cloneAchievement(milestone.achievement);
    const visualModules = Array.isArray(achievement.visualModules) ? achievement.visualModules : [];
    const hasGameEvolution = visualModules.some((module) => module && module.type === 'gameEvolutionVideo');
    if (!hasGameEvolution) {
        visualModules.push(gameEvolutionVideo(key, options));
    }
    achievement.visualModules = visualModules;
    milestone.achievement = achievement;
}

/** 头像注册表允许缺失，这样生成脚本在资源未准备齐时也不会直接报错 */
function loadAvatarRegistry() {
    if (!fs.existsSync(AVATAR_REGISTRY_PATH)) {
        console.warn('[警告] manage/figure-avatars.js 不存在，已跳过头像注册表补全。');
        return {};
    }

    return require('./figure-avatars.js');
}

function loadResearchCandidates() {
    if (!fs.existsSync(RESEARCH_CANDIDATES_PATH)) {
        return { events: {} };
    }

    try {
        return require(RESEARCH_CANDIDATES_PATH).researchCandidates || { events: {} };
    } catch (error) {
        console.warn(`[警告] 无法加载候选研究素材 ${RESEARCH_CANDIDATES_PATH}: ${error.message}`);
        return { events: {} };
    }
}

function loadQuizCatalog() {
    if (!fs.existsSync(QUIZ_CATALOG_PATH)) {
        return { events: {} };
    }

    try {
        return require(QUIZ_CATALOG_PATH) || { events: {} };
    } catch (error) {
        console.warn(`[警告] 无法加载 Pop Quiz 配置 ${QUIZ_CATALOG_PATH}: ${error.message}`);
        return { events: {} };
    }
}

function normalizeQuizList(value) {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}

function normalizeQuiz(rawQuiz, key, index) {
    if (!rawQuiz || typeof rawQuiz !== 'object') return null;
    const options = Array.isArray(rawQuiz.options) ? rawQuiz.options.filter((option) => option != null) : [];
    const answerIndex = Number(rawQuiz.answerIndex);

    if (
        !rawQuiz.question ||
        options.length < 2 ||
        !Number.isInteger(answerIndex) ||
        answerIndex < 0 ||
        answerIndex >= options.length
    ) {
        console.warn(`[警告] 事件 "${key}" 的 Pop Quiz #${index + 1} 配置不完整，已跳过。`);
        return null;
    }

    return {
        id: rawQuiz.id || `${key}-quiz-${index + 1}`,
        question: rawQuiz.question,
        options,
        answerIndex,
        explanation: rawQuiz.explanation || '',
        source: rawQuiz.source || '',
        tags: Array.isArray(rawQuiz.tags) ? rawQuiz.tags : []
    };
}

function selectQuizzes(key, ev) {
    const eventQuizzes = ev && (ev.quizzes || ev.quiz);
    const catalogQuizzes = quizCatalog.events && quizCatalog.events[key];
    return normalizeQuizList(eventQuizzes || catalogQuizzes)
        .map((rawQuiz, index) => normalizeQuiz(rawQuiz, key, index))
        .filter(Boolean);
}

function figureNameCandidates(figure) {
    const value = figure && figure.name;
    const names = isLocalizedText(value)
        ? [
              ...SUPPORTED_LOCALES.map((locale) => getLocalizedText(value, locale)),
              ...Object.values(value).map((item) => String(item || '').trim())
          ]
        : [String(value || '').trim()];
    return [...new Set(names.filter(Boolean))];
}

function findAvatarRegistryEntry(figure) {
    for (const name of figureNameCandidates(figure)) {
        if (avatarRegistry[name]) return avatarRegistry[name];
    }
    return {};
}

/** 给人物条目补上显式头像信息 */
function enrichFigure(figure, key) {
    const safeFigure = figure && typeof figure === 'object' ? figure : {};
    const registryEntry = findAvatarRegistryEntry(safeFigure);
    const eventAvatar = key && registryEntry.avatarByEvent ? registryEntry.avatarByEvent[key] || '' : '';
    const eventAvatarStyle = key && registryEntry.avatarStyleByEvent ? registryEntry.avatarStyleByEvent[key] || '' : '';

    return {
        ...safeFigure,
        avatar: safeFigure.avatar || eventAvatar || registryEntry.avatar || '',
        avatarStyle: safeFigure.avatarStyle || eventAvatarStyle || registryEntry.avatarStyle || '',
        figureType: safeFigure.figureType || registryEntry.type || 'person'
    };
}

function getExplicitLocalizedText(value, locale) {
    if (!isLocalizedText(value) || !Object.prototype.hasOwnProperty.call(value, locale)) return '';
    return String(value[locale] || '').trim();
}

function buildCommentarySectionsOverride(key) {
    const entry = researchCandidates.events && researchCandidates.events[key];
    if (!entry) {
        return [];
    }

    const explicitSections = Array.isArray(entry.displayCommentarySections) ? entry.displayCommentarySections : [];

    const fallbackSections = [];
    const backgroundText =
        entry.candidateTexts && entry.candidateTexts.background ? entry.candidateTexts.background.text : '';
    const extensionText =
        entry.candidateTexts && entry.candidateTexts.extension ? entry.candidateTexts.extension.text : '';

    if (getLocalizedText(backgroundText, 'zh')) {
        fallbackSections.push({
            label: '背景解读',
            text: backgroundText
        });
    }

    if (getLocalizedText(extensionText, 'zh')) {
        fallbackSections.push({
            label: '延展说明',
            text: extensionText
        });
    }

    const sourceSections = explicitSections.length > 0 ? explicitSections : fallbackSections;

    return sourceSections
        .map((section, index) => {
            const zhText = getLocalizedText(section.text, 'zh');
            const explicitEnLabel = getExplicitLocalizedText(section.label, 'en');
            const explicitEnText = getExplicitLocalizedText(section.text, 'en');
            const enText = explicitEnText || zhText;
            return {
                label: {
                    en: explicitEnLabel || (index === 0 ? 'Background' : 'Context'),
                    zh: getLocalizedText(section.label, 'zh')
                },
                html: {
                    en: enText,
                    zh: zhText
                }
            };
        })
        .filter((section) => section.label.zh && section.html.zh);
}

function localizedPair(value) {
    return {
        en: getLocalizedText(value, 'en'),
        zh: getLocalizedText(value, 'zh')
    };
}

function normalizeCommentarySections(sections, ev, storylineId) {
    if (storylineId !== QUIZ_STORYLINE_ID && !(ev && ev.fusionCanonical)) return sections;

    const sourceSections = Array.isArray(sections) ? sections : [];
    const normalized = [];
    const usedIndexes = new Set();

    const findByLabel = (label) =>
        sourceSections.findIndex((section) => getLocalizedText(section && section.label, 'en') === label);
    const pickSection = (label, fallbackIndex, fallbackFactory) => {
        let index = findByLabel(label);
        if (index < 0) {
            index = sourceSections.findIndex((_, candidateIndex) => !usedIndexes.has(candidateIndex));
        }
        if (index < 0) index = fallbackIndex;
        if (index >= 0 && sourceSections[index]) {
            usedIndexes.add(index);
            return sourceSections[index];
        }
        return fallbackFactory();
    };

    const title = localizedPair(ev.title);
    const achievement = ev.achievement || {};
    const method = localizedPair(achievement.method);
    const demo = localizedPair(achievement.demo);
    const artifact = localizedPair(achievement.artifact);
    const description = localizedPair(ev.description);

    const templates = {
        'Historical Background': {
            label: { en: 'Historical Background', zh: '历史背景' },
            fallback: () => ({
                label: { en: 'Historical Background', zh: '历史背景' },
                html: description
            }),
            extra: {
                en: `This context helps viewers place ${title.en || 'this achievement'} in the technical problems and research priorities of its time.`,
                zh: `这段背景帮助观众把${title.zh || '这项成就'}放回当时的技术问题和研究重点中理解。`
            }
        },
        'Core Idea': {
            label: { en: 'Core Idea', zh: '核心思想' },
            fallback: () => ({
                label: { en: 'Core Idea', zh: '核心思想' },
                html: {
                    en: demo.en || method.en || artifact.en || description.en,
                    zh: demo.zh || method.zh || artifact.zh || description.zh
                }
            }),
            extra: {
                en: `The key mechanism is ${method.en || artifact.en || demo.en || 'the design described in the source material'}, which links the source material to the visible demo behavior.`,
                zh: `关键机制是${method.zh || artifact.zh || demo.zh || '来源材料中描述的设计'}，它把资料线索与可见的演示行为连接起来。`
            }
        },
        'Long-Term Legacy': {
            label: { en: 'Long-Term Legacy', zh: '长期影响' },
            fallback: () => ({
                label: { en: 'Long-Term Legacy', zh: '长期影响' },
                html: {
                    en: `Experts generally treat ${title.en || 'this achievement'} as an important AI milestone.`,
                    zh: `专家通常把${title.zh || '这项成就'}视为重要 AI 里程碑。`
                }
            }),
            extra: {
                en: `Its long-term legacy is the vocabulary, benchmark, or system pattern that later AI work reused, compared against, or extended.`,
                zh: `它的长期影响在于形成了后续 AI 工作复用、比较或扩展的技术词汇、基准或系统模式。`
            }
        }
    };

    for (const [label, config] of Object.entries(templates)) {
        const section = pickSection(label, -1, config.fallback);
        const html = localizedPair(section.html || section.text || '');
        normalized.push({
            label: config.label,
            html: {
                en: ensureTwoSentences(html.en, config.extra.en, 'en'),
                zh: ensureTwoSentences(html.zh, config.extra.zh, 'zh')
            }
        });
    }

    return normalized;
}

function ensureTwoSentences(value, extraSentence, locale) {
    const text = String(value || '').trim();
    const extra = String(extraSentence || '').trim();
    if (!text) return extra;
    if (countTextSentences(text, locale) >= 2) return text;
    if (/<\/p>\s*$/i.test(text)) {
        return `${text}<p>${extra}</p>`;
    }
    return `${text} ${extra}`;
}

function mapLocalizedText(value, transform) {
    if (!isLocalizedText(value)) return transform(String(value || ''));
    const result = {};
    for (const locale of SUPPORTED_LOCALES) {
        const text = getLocalizedText(value, locale);
        result[locale] = transform(text, locale);
    }
    return result;
}

function selectCuratedQuote(key, ev) {
    const candidates = quoteCandidates.events && quoteCandidates.events[key];
    const first = Array.isArray(candidates) && candidates.length > 0 ? candidates[0] : null;
    const candidateQuote = first && typeof first === 'object' ? String(first.quote || '').trim() : '';
    const effectiveMeta = mergeEditableQuoteMeta(ev && ev.quoteMeta, first);
    const eventQuote = ev && ev.quoteText;
    const quoteText = isLocalizedText(eventQuote)
        ? {
              en: candidateQuote || getLocalizedText(eventQuote, 'en'),
              zh: getLocalizedText(eventQuote, 'zh') || candidateQuote || getLocalizedText(eventQuote, 'en')
          }
        : candidateQuote || getLocalizedText(eventQuote);

    const formattedAttribution = formatQuoteAttribution(effectiveMeta);

    return {
        text: quoteText,
        attribution: ZH_QUOTE_ATTRIBUTIONS[key]
            ? {
                  en: getLocalizedText(formattedAttribution, 'en'),
                  zh: ZH_QUOTE_ATTRIBUTIONS[key]
              }
            : formattedAttribution,
        meta: effectiveMeta
    };
}

/** 将纯文本引言组装成 HTML 字符串（\n → <br>）*/
function buildQuote(text) {
    return mapLocalizedText(text, (value) => {
        const normalizedText = normalizeQuoteText(value);
        if (!normalizedText) return '';
        const body = normalizedText.replace(/\n/g, '<br>');
        return `"${body}"`;
    });
}

// ─── 写出文件 ────────────────────────────────────────────────────────────────

function backupOutput(file) {
    backupFile(file, { backupDir: path.join(ROOT, 'manage', '.backups'), maxBackups: 5 });
}

function buildOutputContent(now) {
    return [
        `// AI 历史里程碑数据（由脚本自动生成，请勿手动编辑）`,
        `// 生成时间: ${now}`,
        `// 数据来源: manage/catalog.js  +  manage/events.js  +  manage/quizzes.js  +  resources/videos/`,
        ``,
        `const milestones = ${JSON.stringify(milestones, null, 2)};`,
        ``,
        `// 导出（兼容 Node.js require）`,
        `if (typeof module !== 'undefined' && module.exports) {`,
        `  module.exports = { milestones };`,
        `}`,
        ``
    ].join('\n');
}

function normalizeGeneratedTime(content) {
    return String(content || '')
        .replace(/\r\n/g, '\n')
        .replace(/^\/\/ 生成时间: .+$/m, '// 生成时间: <preserved>');
}

function writeIfMeaningfullyChanged(file, content) {
    if (fs.existsSync(file)) {
        const existing = fs.readFileSync(file, 'utf8');
        if (normalizeGeneratedTime(existing) === normalizeGeneratedTime(content)) {
            return false;
        }
    }

    if (!REVIEW_MODE) backupOutput(file);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, 'utf8');
    return true;
}

function validateAvatarAssets(items) {
    const missing = [];
    const seen = new Set();

    for (const milestone of items) {
        for (const figure of milestone.figures || []) {
            const avatar = String(figure.avatar || '').trim();
            if (!avatar) continue;
            if (seen.has(avatar)) continue;
            seen.add(avatar);

            const absolutePath = path.isAbsolute(avatar) ? avatar : path.join(ROOT, avatar);

            if (!fs.existsSync(absolutePath)) {
                missing.push({
                    avatar,
                    milestoneId: milestone.id,
                    figureName: getLocalizedText(figure.name) || '未知人物'
                });
            }
        }
    }

    return missing;
}

const archiveOverlayResult = applyArchiveOverlays(milestones, { root: ROOT });
if (!REVIEW_MODE) {
    const archiveReviewSnapshotPath = path.join(ROOT, '.tmp', 'archive-review', 'archive-review-snapshot.json');
    fs.mkdirSync(path.dirname(archiveReviewSnapshotPath), { recursive: true });
    fs.writeFileSync(
        archiveReviewSnapshotPath,
        JSON.stringify(
            {
                generatedAt: new Date().toISOString(),
                applied: archiveOverlayResult.applied,
                skipped: archiveOverlayResult.skipped,
                errors: archiveOverlayResult.errors,
                rows: archiveOverlayResult.reviewRows
            },
            null,
            2
        ) + '\n',
        'utf8'
    );
}
for (const item of archiveOverlayResult.errors) {
    console.warn(`[警告] archive overlay 构建失败：${item.storylineId} ${JSON.stringify(item.ref)} — ${item.message}`);
}
for (const item of archiveOverlayResult.skipped) {
    console.warn(
        `[警告] archive overlay 跳过：${item.id || item.archiveEventId}/${item.archiveVariantId} — ${item.reason}`
    );
}

const missingAvatarAssets = validateAvatarAssets(milestones);
const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
const content = buildOutputContent(now);
const writeResults = new Map();

for (const file of OUTPUTS) {
    writeResults.set(file, writeIfMeaningfullyChanged(file, content));
}

for (const item of missingAvatarAssets) {
    console.warn(`[警告] 头像文件不存在：${item.avatar}（${item.milestoneId} / ${item.figureName}）`);
}

for (const file of OUTPUTS) {
    console.log(`✓ ${writeResults.get(file) ? '生成完成' : '内容未变化'}：${file}`);
}
console.log(`  共 ${categories.length} 个分类，${branches.length} 个分支，${milestones.length} 个事件`);
console.log(
    `  Archive overlay：应用 ${archiveOverlayResult.applied.length} 个，跳过 ${archiveOverlayResult.skipped.length} 个，错误 ${archiveOverlayResult.errors.length} 个`
);
if (missingAvatarAssets.length > 0) {
    console.log(`  头像资源缺失：${missingAvatarAssets.length}`);
}
