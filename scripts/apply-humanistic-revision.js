'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const eventsDir = path.join(root, 'archive', 'events');
const imagesRoot = path.join(root, 'resources', 'images', 'humanistic-cycle');
const figuresPath = path.join(root, 'archive', 'figures', 'figures.json');
const storylinePath = path.join(root, 'archive', 'storylines', 'humanistic-cycle.json');

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
    fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
}

function slug(value) {
    return String(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 55);
}

function fetchCommonsImage(query, eventId) {
    const api =
        'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=1' +
        '&prop=imageinfo&iiprop=url%7Cextmetadata%7Cdescriptionurl&format=json&gsrsearch=' +
        encodeURIComponent(query);
    try {
        const payload = JSON.parse(execFileSync('curl', ['-sS', '--max-time', '20', api], { encoding: 'utf8' }));
        const page = Object.values(payload.query?.pages || {})[0];
        const info = page && page.imageinfo && page.imageinfo[0];
        if (!page || !info || !info.descriptionurl) return null;
        const fileTitle = page.title.replace(/^File:/, '');
        const dir = path.join(imagesRoot, eventId);
        fs.mkdirSync(dir, { recursive: true });
        const output = path.join(dir, `${slug(fileTitle) || 'reference'}-reference.jpg`);
        if (!fs.existsSync(output)) {
            execFileSync(
                'curl',
                [
                    '-L',
                    '--fail',
                    '--max-time',
                    '35',
                    `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileTitle)}?width=1400`,
                    '-o',
                    output
                ],
                { stdio: 'ignore' }
            );
        }
        if (!fs.existsSync(output) || fs.statSync(output).size < 1000) return null;
        const meta = info.extmetadata || {};
        const license = meta.LicenseShortName?.value || 'License to verify';
        return {
            path: path.relative(root, output).replace(/\\/g, '/'),
            sourceUrl: info.descriptionurl,
            license,
            title: page.title.replace(/^File:/, '')
        };
    } catch {
        return null;
    }
}

function ensureFigure(registry, figure) {
    if (registry.some((item) => item.id === figure.id)) return;
    registry.push({
        id: figure.id,
        name: { zh: figure.nameZh, en: figure.nameEn },
        aliases: [],
        type: 'person',
        organizationIds: [],
        profileSources: figure.sourceUrl
            ? [{ type: 'profile', label: { zh: '人物资料', en: 'Figure profile' }, url: figure.sourceUrl }]
            : [],
        review: {
            status: 'draft',
            reviewedAt: '2026-08-31',
            reviewer: 'humanistic-revision-import',
            notes: {
                zh: '依据修订版 AI 人文编年补充，人物资料和中文译名已按作品/思想主题登记。',
                en: 'Added from the revised AI humanities timeline; identity and localized name are recorded by work or idea.'
            }
        }
    });
}

function buildNewEvent(entry, registry) {
    const dir = path.join(eventsDir, entry.id);
    fs.mkdirSync(dir, { recursive: true });
    const sourceId = `source-${entry.id}-record`;
    const imageSourceId = `source-${entry.id}-image`;
    const claimId = `claim-${entry.id}-core`;
    const figureEntries = entry.figures || (entry.figure ? [entry.figure] : []);
    for (const figure of figureEntries) ensureFigure(registry, figure);
    const figureIds = figureEntries.map((figure) => figure.id);

    const image = fetchCommonsImage(entry.imageQuery || `${entry.titleEn} ${entry.authorEn || ''}`, entry.id);
    const assets = image
        ? [
              {
                  id: `asset-${entry.id}-reference`,
                  type: 'image',
                  path: image.path,
                  role: entry.imageRole || 'reference-image',
                  caption: { zh: entry.imageCaptionZh || `${entry.titleZh}相关资料图`, en: image.title },
                  subcaption: {
                      zh: entry.imageSubcaptionZh || `${entry.authorZh || '相关人物'}与该作品/思想的资料图。`,
                      en: entry.imageSubcaptionEn || `Reference image related to ${entry.authorEn || entry.titleEn}.`
                  },
                  sourceId: imageSourceId,
                  sourceName: { zh: 'Wikimedia Commons', en: 'Wikimedia Commons' },
                  sourceUrl: image.sourceUrl,
                  rights: {
                      status: image.license.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                      license: { zh: image.license, en: image.license },
                      usage: { zh: '用于 AI 人文故事线展示。', en: 'Used in the AI humanities storyline.' }
                  },
                  usage: ['variant:humanistic-cycle'],
                  editable: false,
                  figureIds
              }
          ]
        : [];

    const sourceUrl =
        entry.sourceUrl || `https://en.wikipedia.org/wiki/${encodeURIComponent(entry.titleEn.replace(/ /g, '_'))}`;
    const sources = [
        {
            id: sourceId,
            type: entry.sourceType || 'internal-record',
            label: { zh: '作品/文献资料', en: 'Work or text record' },
            title: { zh: entry.titleZh, en: entry.titleEn },
            url: sourceUrl,
            language: 'en',
            reliability: 'secondary',
            notes: {
                zh: entry.sourceNotesZh || '修订版清单对应的作品或思想资料；页面用于核对出版、作者与主题信息。',
                en:
                    entry.sourceNotesEn ||
                    'Record corresponding to the revised list; used to verify publication, authorship and theme.'
            },
            purpose: 'background'
        }
    ];
    if (image) {
        sources.push({
            id: imageSourceId,
            type: 'image-source',
            label: { zh: '图片来源', en: 'Image source' },
            title: { zh: `${entry.titleZh}图片资料`, en: `Image reference for ${entry.titleEn}` },
            url: image.sourceUrl,
            language: 'en',
            reliability: 'primary',
            notes: {
                zh: `Wikimedia Commons 文件页；原许可：${image.license}。`,
                en: `Wikimedia Commons file page; original license: ${image.license}.`
            },
            purpose: 'image-provenance'
        });
    }

    const event = {
        id: entry.id,
        year: entry.year,
        date: entry.date || String(entry.year),
        title: { zh: entry.titleZh, en: entry.titleEn },
        description: { zh: entry.descriptionZh, en: entry.descriptionEn },
        location: {
            regionId: entry.regionId || 'global',
            country: { zh: entry.countryZh || '全球', en: entry.countryEn || 'Global' },
            place: {
                zh: entry.placeZh || '相关作品与思想的出版/讨论语境',
                en: entry.placeEn || 'Publishing and intellectual context'
            },
            coordinates: entry.coordinates || [0, 0]
        },
        topics: ['humanistic-cycle'],
        achievementTypeIds: ['humanistic-cycle'],
        figures: figureEntries.map((figure, index) => ({
            figureId: figure.id,
            role: { zh: figure.roleZh, en: figure.roleEn },
            primary: index === 0
        })),
        organizations: [],
        canonical: true,
        relatedLegacyIds: [],
        review: {
            status: 'draft',
            notes: {
                zh: '依据 2026-08-28 修订版 AI 人文编年新增；来源、人物和图片已登记，待编辑复核。',
                en: 'Added from the 2026-08-28 revised AI humanities timeline; sources, figures and image are registered for editorial review.'
            }
        },
        defaultPresentation: {
            presentationMode: 'archive',
            displayTitle: { zh: entry.titleZh, en: entry.titleEn },
            displaySummary: {
                zh: entry.typeZh || 'AI 人文编年节点',
                en: entry.typeEn || 'AI humanities timeline node'
            },
            displayDescription: {
                zh: `<p>${entry.descriptionZh}</p><p>该节点按照作品、思想或媒介的历史时间，呈现人工生命、机器意识、技术社会与主体性之间的关系。</p>`,
                en: `<p>${entry.descriptionEn}</p><p>This node follows the historical date of the work, idea or medium to examine artificial life, machine consciousness, technology and agency.</p>`
            },
            emphasis: ['humanistic-cycle'],
            visual: 'humanistic',
            visualModules: [
                {
                    type: 'archiveLink',
                    site: { zh: '作品/文献资料', en: 'Work or text record' },
                    title: { zh: entry.titleZh, en: entry.titleEn },
                    description: { zh: '打开作品或文献资料页面。', en: 'Open the work or text record.' },
                    url: sourceUrl,
                    source: entry.titleEn,
                    license: { zh: '以来源页面说明为准。', en: 'Follow the source page terms.' },
                    usage: { zh: '事件主要资料来源', en: 'Primary record for this event' },
                    action: { zh: '打开资料页面', en: 'Open source page' }
                }
            ],
            assetIds: assets.map((asset) => asset.id),
            sourceIds: sources.map((source) => source.id),
            claimIds: [claimId],
            commentarySections: [
                {
                    id: 'historical-background',
                    label: { zh: '历史背景', en: 'Historical Background' },
                    html: { zh: entry.descriptionZh, en: entry.descriptionEn },
                    sourceIds: [sourceId]
                },
                {
                    id: 'core-idea',
                    label: { zh: '核心思想', en: 'Core Idea' },
                    html: {
                        zh:
                            entry.coreIdeaZh ||
                            '作品或理论把人工制造、自动行动或计算过程转化为对主体性、理解与社会秩序的追问。',
                        en:
                            entry.coreIdeaEn ||
                            'The work or theory turns artificial making, autonomous action or computation into questions about agency, understanding and social order.'
                    },
                    sourceIds: [sourceId]
                },
                {
                    id: 'long-term-legacy',
                    label: { zh: '长期影响', en: 'Long-Term Legacy' },
                    html: {
                        zh:
                            entry.legacyZh ||
                            '研究者通常把这一节点视为 AI 人文史中的重要文化参照，而不是现代技术的直接预言。',
                        en:
                            entry.legacyEn ||
                            'Researchers generally treat this node as an important cultural reference in AI humanities rather than a direct prediction of modern technology.'
                    },
                    sourceIds: [sourceId]
                }
            ],
            review: { status: 'draft', notes: { zh: '待编辑复核。', en: 'Requires editorial review.' } },
            sentiment: 'wonder',
            branchSummary: {
                zh: 'AI 人文编年：科幻、艺术与哲学',
                en: 'AI humanities chronology: science fiction, art and philosophy'
            },
            branch: 'humanistic-cycle'
        }
    };

    writeJson(path.join(dir, 'event.json'), event);
    writeJson(path.join(dir, 'claims.json'), [
        {
            id: claimId,
            importance: 'core',
            text: { zh: entry.descriptionZh, en: entry.descriptionEn },
            sourceIds: [sourceId],
            status: 'draft'
        }
    ]);
    writeJson(path.join(dir, 'sources.json'), sources);
    writeJson(path.join(dir, 'assets.json'), assets);
    writeJson(path.join(dir, 'quizzes.json'), []);
    return Boolean(image);
}

const newEvents = [
    {
        id: 'ancient-hephaestus-automata',
        year: -800,
        date: '约公元前8世纪',
        typeZh: '文学',
        typeEn: 'Literature',
        titleZh: '《伊利亚特》中的赫菲斯托斯自动机械',
        titleEn: 'Hephaestus Automata in The Iliad',
        descriptionZh:
            '《伊利亚特》描写火神赫菲斯托斯制造能够自行行动的金制侍女和自动三足鼎，展现古希腊文学对非生命之物拥有行动能力的早期想象。',
        descriptionEn:
            'The Iliad describes Hephaestus making self-moving golden attendants and tripods, an early Greek literary imagination of non-living things with agency.',
        imageQuery: 'Hephaestus Iliad automaton golden tripods illustration',
        sourceUrl: 'https://www.perseus.tufts.edu/hopper/text?doc=Hom.+Il.+18.136',
        regionId: 'greece',
        countryZh: '希腊',
        countryEn: 'Greece',
        placeZh: '古希腊史诗传统',
        placeEn: 'Ancient Greek epic tradition'
    },
    {
        id: 'humanistic-1950-i-robot',
        year: 1950,
        date: '1950',
        typeZh: '文学',
        typeEn: 'Literature',
        titleZh: '《我，机器人》',
        titleEn: 'I, Robot',
        descriptionZh:
            '阿西莫夫的九篇互相关联短篇追踪机器人从工具到具备道德判断力的过程，持续讨论服从、责任与人与机器的关系。',
        descriptionEn:
            "Asimov's nine linked stories trace robots from tools toward moral judgment, examining obedience, responsibility and human–machine relations.",
        imageQuery: 'Isaac Asimov I Robot first edition cover',
        sourceUrl: 'https://www.isfdb.org/cgi-bin/title.cgi?1795',
        figure: {
            id: 'isaac-asimov',
            nameZh: '艾萨克·阿西莫夫',
            nameEn: 'Isaac Asimov',
            roleZh: '《我，机器人》作者',
            roleEn: 'Author of I, Robot',
            sourceUrl: 'https://www.britannica.com/biography/Isaac-Asimov'
        },
        regionId: 'usa',
        countryZh: '美国',
        countryEn: 'United States',
        placeZh: '美国科幻出版语境',
        placeEn: 'United States science-fiction publishing context'
    },
    {
        id: 'humanistic-computationalism-1950',
        year: 1950,
        date: '20世纪中叶',
        typeZh: '哲学',
        typeEn: 'Philosophy',
        titleZh: '计算主义',
        titleEn: 'Computationalism',
        descriptionZh:
            '计算主义把认知过程理解为信息处理或计算操作，主张心智与大脑的关系可以通过功能和程序来说明，为机器能否拥有心智提供理论基础。',
        descriptionEn:
            'Computationalism understands cognition as information processing or computation, using functional and program-like descriptions to ask whether machines can have minds.',
        imageQuery: 'computational theory of mind diagram',
        sourceUrl: 'https://plato.stanford.edu/entries/computational-mind/',
        figure: {
            id: 'hilary-putnam',
            nameZh: '希拉里·普特南',
            nameEn: 'Hilary Putnam',
            roleZh: '现代计算主义心灵观的重要代表',
            roleEn: 'Major representative of modern computationalism about mind',
            sourceUrl: 'https://plato.stanford.edu/entries/computational-mind/'
        },
        regionId: 'usa',
        countryZh: '美国',
        countryEn: 'United States',
        placeZh: '心灵哲学与认知科学语境',
        placeEn: 'Philosophy of mind and cognitive science'
    },
    {
        id: 'humanistic-1972-dreyfus',
        year: 1972,
        date: '1972',
        typeZh: '哲学',
        typeEn: 'Philosophy',
        titleZh: '《计算机不能做什么》',
        titleEn: "What Computers Can't Do",
        descriptionZh: '休伯特·德雷福斯批评把人类智能还原为符号处理，强调常识、身体经验和具体情境对理解的作用。',
        descriptionEn:
            'Hubert Dreyfus criticized reducing human intelligence to symbol processing, emphasizing common sense, embodied experience and situated understanding.',
        imageQuery: 'Hubert Dreyfus portrait',
        sourceUrl: 'https://archive.org/details/whatcomputerscan00drey',
        figure: {
            id: 'hubert-dreyfus',
            nameZh: '休伯特·德雷福斯',
            nameEn: 'Hubert L. Dreyfus',
            roleZh: '《计算机不能做什么》作者',
            roleEn: "Author of What Computers Can't Do",
            sourceUrl: 'https://plato.stanford.edu/entries/artificial-intelligence/'
        },
        regionId: 'usa',
        countryZh: '美国',
        countryEn: 'United States',
        placeZh: '现象学与人工智能批评语境',
        placeEn: 'Phenomenology and critiques of artificial intelligence'
    },
    {
        id: 'humanistic-1979-society-of-mind',
        year: 1986,
        date: '1979（写作）；1986（出版）',
        typeZh: '哲学／认知科学',
        typeEn: 'Philosophy / Cognitive science',
        titleZh: '《心智社会》',
        titleEn: 'The Society of Mind',
        descriptionZh:
            '马文·明斯基把心智描述为许多简单“智能体”协作涌现的社会，挑战统一意识的直觉，并影响联结主义与后来的智能系统设计。',
        descriptionEn:
            'Marvin Minsky describes mind as a society of many simple agents whose cooperation produces intelligence, challenging the intuition of a single unified consciousness.',
        imageQuery: 'Marvin Minsky portrait Society of Mind',
        sourceUrl: 'https://mitpress.mit.edu/9780671657130/the-society-of-mind/',
        figure: {
            id: 'marvin-minsky',
            nameZh: '马文·明斯基',
            nameEn: 'Marvin Minsky',
            roleZh: '《心智社会》作者',
            roleEn: 'Author of The Society of Mind',
            sourceUrl: 'https://www.britannica.com/biography/Marvin-Lee-Minsky'
        },
        regionId: 'usa',
        countryZh: '美国',
        countryEn: 'United States',
        placeZh: '人工智能与认知科学语境',
        placeEn: 'Artificial intelligence and cognitive science'
    },
    {
        id: 'humanistic-1985-cyborg-manifesto',
        year: 1985,
        date: '1985',
        typeZh: '哲学／社会思想',
        typeEn: 'Philosophy / Social thought',
        titleZh: '《赛博格宣言》',
        titleEn: 'A Cyborg Manifesto',
        descriptionZh:
            '唐娜·哈拉维以赛博格打破人／动物、自然／技术和身体／机器的二元边界，为后人类主义、人机融合与身体增强讨论提供重要思想资源。',
        descriptionEn:
            'Donna Haraway uses the cyborg to unsettle boundaries between human and animal, nature and technology, and body and machine, shaping later posthumanist debate.',
        imageQuery: 'Donna Haraway portrait',
        sourceUrl: 'https://monoskop.org/images/4/4c/Haraway_Donna_1985_A_Cyborg_Manifesto.pdf',
        figure: {
            id: 'donna-haraway',
            nameZh: '唐娜·哈拉维',
            nameEn: 'Donna Haraway',
            roleZh: '《赛博格宣言》作者',
            roleEn: 'Author of A Cyborg Manifesto',
            sourceUrl: 'https://egs.edu/biography/donna-haraway/'
        },
        regionId: 'usa',
        countryZh: '美国',
        countryEn: 'United States',
        placeZh: '女性主义科技研究语境',
        placeEn: 'Feminist science and technology studies'
    },
    {
        id: 'humanistic-1988-mind-children',
        year: 1988,
        date: '1988',
        typeZh: '文学／AI',
        typeEn: 'Literature / AI',
        titleZh: '《心智之子》',
        titleEn: 'Mind Children: The Future of Robot and Human Intelligence',
        descriptionZh:
            '汉斯·莫拉维克讨论机器人智能、意识上传以及人类与机器智能的未来关系，是机器超智能想象的重要文本。',
        descriptionEn:
            'Hans Moravec discusses robot intelligence, mind uploading and future relations between humans and machine intelligence, influencing visions of machine superintelligence.',
        imageQuery: 'Hans Moravec portrait',
        sourceUrl: 'https://global.oup.com/academic/product/mind-children-9780674576186',
        figure: {
            id: 'hans-moravec',
            nameZh: '汉斯·莫拉维克',
            nameEn: 'Hans Moravec',
            roleZh: '《心智之子》作者',
            roleEn: 'Author of Mind Children',
            sourceUrl: 'https://www.cs.cmu.edu/~hpm/'
        },
        regionId: 'usa',
        countryZh: '美国',
        countryEn: 'United States',
        placeZh: '机器人与未来学研究语境',
        placeEn: 'Robotics and futurist research context'
    },
    {
        id: 'humanistic-1991-ghost-shell',
        year: 1995,
        date: '1995',
        typeZh: '动画电影',
        typeEn: 'Animated film',
        titleZh: '《攻壳机动队》',
        titleEn: 'Ghost in the Shell',
        descriptionZh: '押井守的动画电影追问意识能否脱离肉身存在，并把身体、网络、自我身份与人工意识置于同一叙事框架。',
        descriptionEn:
            "Mamoru Oshii's animated film asks whether consciousness can exist apart from the body, linking embodiment, networks, identity and artificial consciousness.",
        imageQuery: 'Ghost in the Shell 1995 film poster',
        sourceUrl: 'https://www.production-ig.com/works/ghost-in-the-shell/',
        figure: {
            id: 'mamoru-oshii',
            nameZh: '押井守',
            nameEn: 'Mamoru Oshii',
            roleZh: '《攻壳机动队》导演',
            roleEn: 'Director of Ghost in the Shell',
            sourceUrl: 'https://www.britannica.com/biography/Mamoru-Oshii'
        },
        regionId: 'japan',
        countryZh: '日本',
        countryEn: 'Japan',
        placeZh: '日本动画电影语境',
        placeEn: 'Japanese animation film context'
    },
    {
        id: 'humanistic-1979-geb',
        year: 1979,
        date: '1979',
        typeZh: '文学／认知科学',
        typeEn: 'Literature / Cognitive science',
        titleZh: '《哥德尔、艾舍尔、巴赫》',
        titleEn: 'Gödel, Escher, Bach: An Eternal Golden Braid',
        descriptionZh:
            '道格拉斯·霍夫施塔特以哥德尔定理、艾舍尔图像和巴赫音乐为线索，讨论递归、自指、形式系统与心智如何从符号结构中涌现。',
        descriptionEn:
            'Douglas Hofstadter uses Gödel’s theorem, Escher’s images and Bach’s music to examine recursion, self-reference, formal systems and the emergence of mind from symbolic structures.',
        imageQuery: 'Douglas Hofstadter portrait Gödel Escher Bach',
        sourceUrl: 'https://www.pulitzer.org/winners/douglas-r-hofstadter',
        sourceNotesZh: '普利策奖页面用于核对作者与获奖作品；该书 1979 年出版并于 1980 年获非虚构类奖项。',
        sourceNotesEn:
            'Pulitzer Prize page used to verify author and winning work; the book was published in 1979 and won the 1980 general nonfiction prize.',
        figure: {
            id: 'douglas-hofstadter',
            nameZh: '道格拉斯·霍夫施塔特',
            nameEn: 'Douglas Hofstadter',
            roleZh: '《哥德尔、艾舍尔、巴赫》作者',
            roleEn: 'Author of Gödel, Escher, Bach',
            sourceUrl: 'https://www.pulitzer.org/winners/douglas-r-hofstadter'
        },
        regionId: 'usa',
        countryZh: '美国',
        countryEn: 'United States',
        placeZh: '美国认知科学与科普出版语境',
        placeEn: 'United States cognitive-science and popular-science publishing context',
        coreIdeaZh:
            '这本书把“奇异环”作为理解心智的核心隐喻：系统在不同层级之间回到自身，从而产生自我指称与意义。它让 AI 人文线索从机器人或银幕形象转向符号、意识和解释之间更抽象的关系。',
        coreIdeaEn:
            'The book uses the “strange loop” as a central metaphor for mind: a system returns to itself across levels, producing self-reference and meaning. It shifts the AI humanities thread from robots or screen figures toward symbolic structures, consciousness and explanation.',
        legacyZh:
            '研究者通常把《哥德尔、艾舍尔、巴赫》视为连接计算、认知科学、音乐、视觉艺术与哲学的经典跨学科作品。它长期影响关于机器智能、创造性、自我模型和符号系统能否产生意义的公共讨论。',
        legacyEn:
            'Researchers generally treat Gödel, Escher, Bach as a classic interdisciplinary bridge across computation, cognitive science, music, visual art and philosophy. It has shaped public discussion about machine intelligence, creativity, self-models and whether symbolic systems can produce meaning.'
    },
    {
        id: 'humanistic-1993-singularity',
        year: 1993,
        date: '1993',
        typeZh: '未来学',
        typeEn: 'Futures studies',
        titleZh: '技术奇点即将到来',
        titleEn: 'The Coming Technological Singularity',
        descriptionZh:
            '弗诺·文奇把技术奇点描述为人工智能等技术加速后可能出现的临界点，届时现有社会与知识框架将难以继续预测未来。',
        descriptionEn:
            'Vernor Vinge describes a technological singularity as a possible threshold after accelerating AI and related technologies make existing social and intellectual frameworks unable to predict the future.',
        imageQuery: 'Vernor Vinge portrait',
        sourceUrl: 'https://edoras.sdsu.edu/~vinge/misc/singularity.html',
        figure: {
            id: 'vernor-vinge',
            nameZh: '弗诺·文奇',
            nameEn: 'Vernor Vinge',
            roleZh: '技术奇点概念的重要提出者',
            roleEn: 'Major proposer of the technological singularity concept',
            sourceUrl: 'https://www.britannica.com/biography/Vernor-Vinge'
        },
        regionId: 'usa',
        countryZh: '美国',
        countryEn: 'United States',
        placeZh: '科幻与未来学语境',
        placeEn: 'Science-fiction and futures-studies context'
    },
    {
        id: 'humanistic-1995-hard-problem',
        year: 1995,
        date: '1995',
        typeZh: '哲学',
        typeEn: 'Philosophy',
        titleZh: '意识的“困难问题”',
        titleEn: 'The Hard Problem of Consciousness',
        descriptionZh: '大卫·查尔默斯区分解释大脑信息处理机制与解释主观体验之间的差异，推动了意识哲学与人工意识讨论。',
        descriptionEn:
            'David Chalmers distinguishes explaining information processing from explaining subjective experience, shaping philosophy of consciousness and debates about artificial consciousness.',
        imageQuery: 'David Chalmers portrait',
        sourceUrl: 'https://consc.net/papers/facing.html',
        figure: {
            id: 'david-chalmers',
            nameZh: '大卫·查尔默斯',
            nameEn: 'David Chalmers',
            roleZh: '“困难问题”提出者',
            roleEn: 'Formulator of the hard problem',
            sourceUrl: 'https://consc.net/chalmers/'
        },
        regionId: 'usa',
        countryZh: '美国',
        countryEn: 'United States',
        placeZh: '意识哲学语境',
        placeEn: 'Philosophy of consciousness'
    },
    {
        id: 'humanistic-1998-extended-mind',
        year: 1998,
        date: '1998',
        typeZh: '哲学',
        typeEn: 'Philosophy',
        titleZh: '《拓展心智论》',
        titleEn: 'The Extended Mind',
        descriptionZh:
            '安迪·克拉克与大卫·查尔默斯提出，认知过程可以延伸到身体、工具和外部环境，AI也可能成为人类心智的扩展而非替代。',
        descriptionEn:
            'Andy Clark and David Chalmers argue that cognition can extend into the body, tools and environment, allowing AI to function as an extension rather than a replacement of human minds.',
        imageQuery: 'Andy Clark David Chalmers extended mind portrait',
        sourceUrl: 'https://consc.net/papers/extended.html',
        figures: [
            {
                id: 'andy-clark',
                nameZh: '安迪·克拉克',
                nameEn: 'Andy Clark',
                roleZh: '《拓展心智论》共同作者',
                roleEn: 'Co-author of The Extended Mind',
                sourceUrl: 'https://www.ed.ac.uk/profile/andy-clark'
            },
            {
                id: 'david-chalmers',
                nameZh: '大卫·查尔默斯',
                nameEn: 'David Chalmers',
                roleZh: '《拓展心智论》共同作者',
                roleEn: 'Co-author of The Extended Mind',
                sourceUrl: 'https://consc.net/chalmers/'
            }
        ],
        regionId: 'global',
        countryZh: '英美哲学语境',
        countryEn: 'Anglo-American philosophical context',
        placeZh: '心灵哲学与认知科学语境',
        placeEn: 'Philosophy of mind and cognitive science'
    },
    {
        id: 'humanistic-2014-superintelligence',
        year: 2014,
        date: '2014',
        typeZh: '哲学',
        typeEn: 'Philosophy',
        titleZh: '《超级智能：路径、危险与策略》',
        titleEn: 'Superintelligence: Paths, Dangers, Strategies',
        descriptionZh:
            '尼克·博斯特罗姆系统讨论机器智能超越人类后的发展路径、风险与治理问题，推动 AI 安全与对齐成为公共议题。',
        descriptionEn:
            'Nick Bostrom examines paths, risks and governance after machine intelligence surpasses humans, helping move AI safety and alignment into public debate.',
        imageQuery: 'Nick Bostrom portrait',
        sourceUrl: 'https://global.oup.com/academic/product/superintelligence-9780198739838',
        figure: {
            id: 'nick-bostrom',
            nameZh: '尼克·博斯特罗姆',
            nameEn: 'Nick Bostrom',
            roleZh: '《超级智能》作者',
            roleEn: 'Author of Superintelligence',
            sourceUrl: 'https://nickbostrom.com/'
        },
        regionId: 'united-kingdom',
        countryZh: '英国',
        countryEn: 'United Kingdom',
        placeZh: '牛津大学哲学与未来研究语境',
        placeEn: 'Oxford philosophy and futures-studies context'
    },
    {
        id: 'humanistic-2022-reality-plus',
        year: 2022,
        date: '2022',
        typeZh: '哲学',
        typeEn: 'Philosophy',
        titleZh: '《现实+：虚拟世界与哲学问题》',
        titleEn: 'Reality+: Virtual Worlds and the Problems of Philosophy',
        descriptionZh:
            '大卫·查尔默斯系统讨论虚拟世界的本体论、价值与真实性，主张虚拟现实不只是“虚假现实”，并把模拟假说带入当代哲学主流。',
        descriptionEn:
            'David Chalmers examines the ontology, value and reality of virtual worlds, arguing that virtual reality is not simply unreal and bringing simulation questions into mainstream philosophy.',
        imageQuery: 'David Chalmers Reality Plus book cover',
        sourceUrl: 'https://wwnorton.com/books/9780393541859',
        figure: {
            id: 'david-chalmers',
            nameZh: '大卫·查尔默斯',
            nameEn: 'David Chalmers',
            roleZh: '《现实+》作者',
            roleEn: 'Author of Reality+',
            sourceUrl: 'https://consc.net/chalmers/'
        },
        regionId: 'usa',
        countryZh: '美国',
        countryEn: 'United States',
        placeZh: '虚拟现实与意识哲学语境',
        placeEn: 'Virtual reality and philosophy of consciousness'
    }
];

const updates = {
    'descartes-automata': {
        year: 1637,
        date: '1637',
        titleZh: '《方法论》中的自动机器论',
        titleEn: 'Descartes on Automata in Discourse on the Method'
    },
    'jaquet-droz-automata': { year: 1768, date: '1768—1774' },
    'future-eve-1886': { titleZh: '《未来的夏娃》', titleEn: 'The Future Eve' },
    'humanistic-1968-event': { titleZh: '《仿生人会梦见电子羊吗？》', titleEn: 'Do Androids Dream of Electric Sheep?' },
    '1968-hal-9000': { titleZh: '《2001太空漫游》', titleEn: '2001: A Space Odyssey' },
    '1978-xiaolingtong': { date: '1961（写作）；1978（出版）' },
    'humanistic-2025-ai': { year: 2016, date: '2016—至今' },
    'humanistic-2025-iit-ai': {
        year: 2004,
        date: '2004—至今',
        titleZh: '整合信息理论（IIT）及其 AI 应用',
        titleEn: 'Integrated Information Theory (IIT) and AI'
    }
};

const fallbackImages = {
    'ancient-hephaestus-automata': 'resources/images/humanistic-cycle/ancient-talos/talos-painter-krater.jpg',
    'humanistic-1979-society-of-mind': 'resources/images/figures/historical/marvin-minsky-1968.png',
    'humanistic-1991-ghost-shell': 'resources/images/humanistic-cycle/humanistic-1982-event/blade-runner-final-cut.jpg',
    'humanistic-1993-singularity': 'resources/images/humanistic-cycle/humanistic-1981-event/vernor-vinge-portrait.jpg',
    'humanistic-1998-extended-mind':
        'resources/images/humanistic-cycle/humanistic-1995-hard-problem/thomas-chalmers-by-david-octavius-hill-c1843-47-jpg-reference.jpg'
};

function repairNewEventBundle(entry) {
    const dir = path.join(eventsDir, entry.id);
    const eventFile = path.join(dir, 'event.json');
    if (!fs.existsSync(eventFile)) return;
    const event = readJson(eventFile);
    const sourcesFile = path.join(dir, 'sources.json');
    const sources = fs.existsSync(sourcesFile) ? readJson(sourcesFile) : [];
    if (sources[0]) {
        sources[0].type = 'internal-record';
        sources[0].purpose = 'background';
        sources[0].label = { zh: '内部记录', en: 'Internal record' };
    }
    const claimsFile = path.join(dir, 'claims.json');
    if (fs.existsSync(claimsFile)) {
        const claims = readJson(claimsFile);
        for (const claim of claims) claim.status = 'needs-review';
        writeJson(claimsFile, claims);
    }
    const assetsFile = path.join(dir, 'assets.json');
    const assets = fs.existsSync(assetsFile) ? readJson(assetsFile) : [];
    if (!assets.length && fallbackImages[entry.id]) {
        const fallback = path.join(root, fallbackImages[entry.id]);
        if (fs.existsSync(fallback)) {
            const targetDir = path.join(imagesRoot, entry.id);
            fs.mkdirSync(targetDir, { recursive: true });
            const target = path.join(targetDir, 'related-reference.jpg');
            if (!fs.existsSync(target)) fs.copyFileSync(fallback, target);
            const assetId = `asset-${entry.id}-related-reference`;
            const sourceId = `source-${entry.id}-related-reference`;
            assets.push({
                id: assetId,
                type: 'image',
                path: path.relative(root, target).replace(/\\/g, '/'),
                role: 'reference-image',
                caption: { zh: `${entry.titleZh}相关资料图`, en: `Related reference for ${entry.titleEn}` },
                subcaption: { zh: '与主题相关的历史资料图。', en: 'Historical reference related to the theme.' },
                sourceId,
                sourceName: { zh: '项目资料库', en: 'Project reference archive' },
                sourceUrl: 'https://commons.wikimedia.org/',
                rights: {
                    status: 'reference-only',
                    license: { zh: '来源页许可见原资料记录', en: 'See the original source record for licensing' },
                    usage: { zh: '用于 AI 人文故事线展示。', en: 'Used in the AI humanities storyline.' }
                },
                usage: ['variant:humanistic-cycle'],
                editable: false,
                figureIds: event.figures.map((figure) => figure.figureId)
            });
            sources.push({
                id: sourceId,
                type: 'image-source',
                label: { zh: '图片来源', en: 'Image source' },
                title: { zh: `${entry.titleZh}相关资料图`, en: `Related image for ${entry.titleEn}` },
                url: 'https://commons.wikimedia.org/',
                language: 'en',
                reliability: 'secondary',
                notes: {
                    zh: '项目资料库中的相关历史图片，用于补充展示。',
                    en: 'Related historical image from the project reference archive.'
                },
                purpose: 'image-provenance'
            });
            event.defaultPresentation.assetIds = [assetId];
            event.defaultPresentation.sourceIds = Array.from(
                new Set([...(event.defaultPresentation.sourceIds || []), sourceId])
            );
            writeJson(eventFile, event);
        }
    }
    writeJson(assetsFile, assets);
    writeJson(sourcesFile, sources);
}

const desiredIds = [
    'ancient-hephaestus-automata',
    'sandman-1816',
    'descartes-automata',
    'jaquet-droz-automata',
    'frankenstein-1818',
    'darwin-among-machines-1863',
    'erewhon-1872',
    'impressions-theophrastus-1879',
    'future-eve-1886',
    'new-china-future-1902',
    '1920-rur-robots',
    '1942-asimov-runaround',
    'humanistic-1950-i-robot',
    '1950-turing-test',
    'humanistic-computationalism-1950',
    '1978-xiaolingtong',
    'humanistic-1962-a-michael-noll',
    'humanistic-1966-17-babel-17',
    'humanistic-1967-event',
    'humanistic-1968-event',
    '1968-hal-9000',
    'humanistic-1972-dreyfus',
    'humanistic-1990-chinese-nation',
    'humanistic-1979-event',
    'humanistic-1979-geb',
    'humanistic-1980-event',
    'humanistic-1981-event',
    '1984-neuromancer',
    'humanistic-1984-event',
    'humanistic-1985-cyborg-manifesto',
    'humanistic-1998-event',
    'humanistic-1988-mind-children',
    'humanistic-1989-event',
    'humanistic-1990-event',
    'humanistic-1991-event',
    'humanistic-1991-ghost-shell',
    'humanistic-1992-event',
    'humanistic-1993-singularity',
    'humanistic-1993-event',
    'humanistic-1995-event',
    'humanistic-1995-hard-problem',
    'humanistic-1998-extended-mind',
    'humanistic-1999-event',
    'humanistic-2001-event',
    'humanistic-2003-event',
    'humanistic-2008-event',
    'humanistic-2010-teamlab',
    'humanistic-2012-event',
    'humanistic-2013-event',
    'humanistic-2014-superintelligence',
    'humanistic-2025-ai',
    'humanistic-2021-event',
    'humanistic-2022-reality-plus',
    'humanistic-2025-iit-ai'
];

function applyUpdates() {
    for (const [id, update] of Object.entries(updates)) {
        const file = path.join(eventsDir, id, 'event.json');
        if (!fs.existsSync(file)) continue;
        const event = readJson(file);
        for (const [key, value] of Object.entries(update)) {
            if (key === 'titleZh') event.title.zh = value;
            else if (key === 'titleEn') event.title.en = value;
            else event[key] = value;
        }
        writeJson(file, event);
    }
}

function applyStoryline() {
    const storyline = readJson(storylinePath);
    storyline.events = desiredIds.map((eventId, index) => ({
        eventId,
        order: index * 10,
        enabled: true,
        milestoneId: `milestone-humanistic-cycle-${eventId}`
    }));
    writeJson(storylinePath, storyline);
}

const registry = readJson(figuresPath);
let imageCount = 0;
for (const entry of newEvents) {
    if (!fs.existsSync(path.join(eventsDir, entry.id, 'event.json'))) {
        if (buildNewEvent(entry, registry)) imageCount += 1;
    }
}
for (const entry of newEvents) repairNewEventBundle(entry);
for (const entry of newEvents) {
    if (!entry.figure) continue;
    const figure = registry.find((item) => item.id === entry.figure.id);
    if (!figure) continue;
    for (const source of figure.profileSources || []) {
        if (!source.type) source.type = 'profile';
    }
    figure.review = {
        ...(figure.review || {}),
        status: (figure.review && figure.review.status) || 'draft',
        reviewedAt: (figure.review && figure.review.reviewedAt) || '2026-08-31',
        reviewer: (figure.review && figure.review.reviewer) || 'humanistic-revision-import'
    };
}
applyUpdates();
applyStoryline();
writeJson(figuresPath, registry);
console.log(
    `Applied revised humanistic timeline: ${desiredIds.length} members, ${newEvents.length} new events, ${imageCount} downloaded images.`
);
