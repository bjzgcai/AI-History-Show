const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const records = [
    {
        id: 'sandman-1816',
        year: 1816,
        titleZh: '《沙人》',
        titleEn: 'The Sandman',
        authorZh: 'E.T.A.霍夫曼',
        authorEn: 'E. T. A. Hoffmann',
        descZh: '奥林匹亚是一具逼真到被误认为人的自动机器；作品探讨人类对人造人的情感投射与幻灭。',
        descEn: 'Olympia is an automaton so lifelike that she is mistaken for a person. Hoffmann explores emotional projection onto an artificial human and the shock of disillusionment.',
        url: 'https://www.gutenberg.org/ebooks/30720',
        sourceTitleZh: 'Project Gutenberg《沙人》文本',
        sourceTitleEn: 'Project Gutenberg: The Sandman'
    },
    {
        id: 'descartes-automata',
        year: 1641,
        titleZh: '《方法论》与《第一哲学沉思录》中的自动机器论',
        titleEn: 'Descartes on Automata and Thought',
        authorZh: '笛卡尔',
        authorEn: 'René Descartes',
        descZh: '笛卡尔区分思维实体与自动机器，并以语言和灵活应答追问机器能否思考。这个问题为后来关于心智、身体和机器理解的讨论奠定哲学背景。',
        descEn: 'Descartes distinguished thinking substance from automata and used language and flexible response to ask whether a machine can think. The question supplied a philosophical background for later debates about mind, embodiment and machine understanding.',
        url: 'https://www.gutenberg.org/ebooks/23306',
        sourceTitleZh: '笛卡尔著作公版文本',
        sourceTitleEn: 'Public-domain texts by Descartes'
    },
    {
        id: 'jaquet-droz-automata',
        year: 1774,
        titleZh: '雅克-德罗自动人偶',
        titleEn: 'The Jaquet-Droz Automata',
        authorZh: '皮埃尔·雅克-德罗',
        authorEn: 'Pierre Jaquet-Droz',
        descZh: '能写字、绘画和演奏的机械人偶，把精密机械、拟人动作与观众对人工生命的想象连接起来。它是现代机器人概念出现前的重要自动体实例。',
        descEn: 'The writing, drawing and music-making automata connected precision mechanics with lifelike action and audience fantasies of artificial life. They are important examples of automata before the modern idea of a robot.',
        url: 'https://www.ville-de-neuchatel.ch/automates-jaquet-droz',
        sourceTitleZh: '雅克-德罗自动人偶馆藏资料',
        sourceTitleEn: 'Jaquet-Droz automata collection record'
    },
    {
        id: 'frankenstein-1818',
        year: 1818,
        titleZh: '《弗兰肯斯坦》',
        titleEn: 'Frankenstein; or, The Modern Prometheus',
        authorZh: '玛丽·雪莱',
        authorEn: 'Mary Shelley',
        descZh: '科学家以实验创造人造生命，随后面对造物的自主行动与伦理责任。作品把创造、失控、责任和被制造者的主体性变成持久的人文母题。',
        descEn: 'A scientist creates artificial life and then confronts the autonomy and ethical responsibility of his creation. The novel made creation, loss of control, responsibility and the subjectivity of the made being durable humanistic themes.',
        url: 'https://www.bl.uk/works/frankenstein',
        sourceTitleZh: '大英图书馆《弗兰肯斯坦》资料',
        sourceTitleEn: 'British Library: Frankenstein'
    },
    {
        id: 'darwin-among-machines-1863',
        year: 1863,
        titleZh: '《机器中的达尔文》',
        titleEn: 'Darwin among the Machines',
        authorZh: '塞缪尔·巴特勒',
        authorEn: 'Samuel Butler',
        descZh: '巴特勒设想机器可能通过选择和复制逐步发展出自主性，首次以系统方式提出机器进化并取代人类的文化想象。',
        descEn: 'Butler imagined machines developing autonomy through selection and reproduction, offering an early systematic cultural vision of machine evolution and possible replacement of humanity.',
        url: 'https://www.gutenberg.org/ebooks/1906',
        sourceTitleZh: '《机器中的达尔文》公版文本',
        sourceTitleEn: 'Public-domain text: Darwin among the Machines'
    },
    {
        id: 'erewhon-1872',
        year: 1872,
        titleZh: '《埃瑞洪》',
        titleEn: 'Erewhon',
        authorZh: '塞缪尔·巴特勒',
        authorEn: 'Samuel Butler',
        descZh: '小说中的“机器之书”讨论机器进化与人类被取代的可能性，虚构社会因此选择摧毁机器。它把技术治理和机器禁令变成社会制度问题。',
        descEn: 'Its “Book of the Machines” considers machine evolution and human replacement, leading the fictional society to destroy machines. It turns technological governance and machine prohibition into institutional questions.',
        url: 'https://archive.org/details/erewhonoroverran00butl',
        sourceTitleZh: 'Internet Archive《埃瑞洪》扫描',
        sourceTitleEn: 'Internet Archive scan of Erewhon'
    },
    {
        id: 'impressions-theophrastus-1879',
        year: 1879,
        titleZh: '《西奥弗拉斯特斯·萨奇的印象》',
        titleEn: 'Impressions of Theophrastus Such',
        authorZh: '乔治·艾略特',
        authorEn: 'George Eliot',
        descZh: '这部作品在社会观察与道德思考中触及机器意识问题，显示十九世纪文学并不只从工程视角想象人工智能。',
        descEn: 'Within its social observation and moral reflection, the work touches on questions of machine consciousness, showing that nineteenth-century writing imagined artificial intelligence beyond an engineering viewpoint.',
        url: 'https://archive.org/details/impressionsofthe00elio',
        sourceTitleZh: '《西奥弗拉斯特斯·萨奇的印象》扫描',
        sourceTitleEn: 'Scan of Impressions of Theophrastus Such'
    },
    {
        id: 'future-eve-1886',
        year: 1886,
        titleZh: '《未来夏娃》',
        titleEn: 'The Future Eve',
        authorZh: '利尔·亚当',
        authorEn: 'Villiers de l’Isle-Adam',
        descZh: '作品设想以电气和机械技术制造“完美的情人”，把人工身体、欲望投射和技术化爱情联系起来。',
        descEn: 'The novel imagines an electrically and mechanically made “perfect lover,” linking artificial bodies, projected desire and the technologizing of love.',
        url: 'https://catalogue.bnf.fr/ark:/12148/cb30678692w',
        sourceTitleZh: '法国国家图书馆《未来夏娃》书目记录',
        sourceTitleEn: 'Bibliothèque nationale de France record for The Future Eve'
    },
    {
        id: 'new-china-future-1902',
        year: 1902,
        titleZh: '《新中国未来记》',
        titleEn: 'The Future of New China',
        authorZh: '梁启超',
        authorEn: 'Liang Qichao',
        descZh: '作品以未来中国为背景组织科技、教育与社会想象，是中国早期科幻和技术乌托邦叙事的重要节点。它与 AI 的关系主要体现在对技术塑造社会的想象，而非具体机器智能。',
        descEn: 'Set in a future China, the work organizes visions of technology, education and society. Its relevance to AI lies mainly in imagining technology as a force shaping society, rather than in depicting machine intelligence itself.',
        url: 'https://find.nlc.cn/',
        sourceTitleZh: '国家图书馆书目检索： 《新中国未来记》',
        sourceTitleEn: 'National Library of China catalogue search: The Future of New China'
    },
    {
        id: 'metropolis-1927',
        year: 1927,
        titleZh: '《大都会》中的机器人玛丽亚',
        titleEn: 'Maria the Robot in Metropolis',
        authorZh: '弗里茨·朗',
        authorEn: 'Fritz Lang',
        descZh: '影片将机器人玛丽亚置于工业城市、阶级冲突和群众动员的中心，形成现代文化中最早的机器人视觉范式之一。',
        descEn: 'The film places the robot Maria at the center of an industrial city, class conflict and mass mobilization, establishing one of modern culture’s earliest visual paradigms for the robot.',
        url: 'https://www.murnau-stiftung.de/filme/metropolis',
        sourceTitleZh: '弗里德里希·威廉·穆瑙基金会《大都会》资料',
        sourceTitleEn: 'Friedrich-Wilhelm-Murnau-Stiftung: Metropolis'
    },
    {
        id: 'asimov-three-laws',
        year: 1942,
        titleZh: '阿西莫夫与机器人三定律',
        titleEn: 'Asimov and the Three Laws of Robotics',
        authorZh: '艾萨克·阿西莫夫',
        authorEn: 'Isaac Asimov',
        descZh: '《转圈圈》提出机器人三定律，把不得伤害人类、服从命令和自我保护组织成可反复检验的伦理框架。它把机器人故事从单纯的反叛寓言推进到规则冲突与责任判断。',
        descEn: 'Runaround formulated the Three Laws of Robotics, organizing non-harm, obedience and self-preservation into a framework that could be tested through stories. It moved robot fiction from simple rebellion toward conflicts among rules and responsibility.',
        url: 'https://archive.org/details/astounding-v29n01-1942-03',
        sourceTitleZh: '《转圈圈》原始杂志扫描',
        sourceTitleEn: 'Original magazine scan of Runaround'
    },
    {
        id: 'i-robot-1950',
        year: 1950,
        titleZh: '《我，机器人》',
        titleEn: 'I, Robot',
        authorZh: '艾萨克·阿西莫夫',
        authorEn: 'Isaac Asimov',
        descZh: '九个相互关联的故事追踪机器人从工具到具备判断、情感模拟和社会角色的变化，展示规则在真实情境中如何产生复杂后果。',
        descEn: 'Nine linked stories trace robots moving from tools toward judgment, simulated emotion and social roles, showing how rules produce complex consequences in real situations.',
        url: 'https://catalog.loc.gov/vwebv/search?searchArg=I%2C+Robot+Asimov',
        sourceTitleZh: '美国国会图书馆《我，机器人》书目记录',
        sourceTitleEn: 'Library of Congress record for I, Robot'
    },
    {
        id: 'multivac-1948',
        year: 1948,
        titleZh: 'MULTIVAC 系列',
        titleEn: 'The MULTIVAC Stories',
        authorZh: '艾萨克·阿西莫夫',
        authorEn: 'Isaac Asimov',
        descZh: 'MULTIVAC 作为管理复杂社会的超级计算机，推动科幻从“机器会不会醒来”转向“社会是否把决策交给计算系统”。',
        descEn: 'MULTIVAC, a supercomputer managing complex societies, shifted science fiction from asking whether a machine would awaken to asking whether society should delegate decisions to computation.',
        url: 'https://isfdb.org/cgi-bin/se.cgi?arg=MULTIVAC&type=Fiction',
        sourceTitleZh: 'Internet Speculative Fiction Database：MULTIVAC书目',
        sourceTitleEn: 'Internet Speculative Fiction Database: MULTIVAC bibliography'
    }
];

function localized(zh, en) {
    return { zh, en };
}
function writeJson(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}
for (const r of records) {
    const dir = path.join(root, 'archive/events', r.id);
    fs.mkdirSync(dir, { recursive: true });
    const sid = `source-${r.id}-primary`;
    const event = {
        id: r.id,
        year: r.year,
        date: String(r.year),
        title: localized(r.titleZh, r.titleEn),
        description: localized(r.descZh, r.descEn),
        location: {
            regionId: 'greece',
            country: localized('待核', 'To verify'),
            place: localized('待核', 'To verify'),
            coordinates: [0, 0]
        },
        topics: ['humanistic-cycle'],
        achievementTypeIds: ['humanistic-cycle'],
        figures: [],
        organizations: [],
        canonical: true,
        relatedLegacyIds: [],
        review: {
            status: 'needs-review',
            notes: localized(
                '新增人文事件草稿；人物、地区和图片资产需继续核验。',
                'New humanities event draft; figures, location and image assets require further review.'
            )
        },
        defaultPresentation: {
            presentationMode: 'archive',
            displayTitle: localized(r.titleZh, r.titleEn),
            displaySummary: localized(
                '科幻、艺术与哲学中的人工生命想象',
                'Artificial-life imagination in fiction, art and philosophy'
            ),
            displayDescription: localized(
                `<p>${r.descZh}</p><p>本事件依据原始作品或权威书目资料，展示人工生命、机器意识、技术治理或人与机器关系的文化想象。</p>`,
                `<p>${r.descEn}</p><p>This event presents cultural imagination around artificial life, machine consciousness, technological governance or human–machine relations using primary texts or authoritative bibliographic records.</p>`
            ),
            emphasis: ['humanistic-cycle'],
            visual: 'humanistic',
            visualModules: [
                {
                    type: 'archiveLink',
                    site: localized('档案来源', 'Archive source'),
                    title: localized(r.sourceTitleZh, r.sourceTitleEn),
                    description: localized(
                        '作品或书目原始资料入口。',
                        'Entry point to the primary work or bibliographic record.'
                    ),
                    url: r.url,
                    source: r.sourceTitleEn,
                    license: localized(
                        '来源页面许可或馆藏条款以原站说明为准。',
                        'Follow the source page or collection terms.'
                    ),
                    usage: localized('事件主要资料来源', 'Primary source for this event'),
                    action: localized('打开资料页面', 'Open source page')
                }
            ],
            assetIds: [],
            sourceIds: [sid],
            claimIds: [`claim-${r.id}-core`],
            commentarySections: [
                {
                    id: 'historical-background',
                    label: localized('历史背景', 'Historical Background'),
                    html: localized(
                        `${r.descZh} 这一作品或思想出现于技术、工业化或现代性想象持续变化的时期。`,
                        ` ${r.descEn} The work or idea appeared as technology, industrialization or modernity was reshaping cultural imagination.`
                    ),
                    sourceIds: [sid]
                },
                {
                    id: 'core-idea',
                    label: localized('核心思想', 'Core Idea'),
                    html: localized(
                        '它把人工制造、自动行动或计算决策转化为关于主体性、责任和社会秩序的讨论。',
                        'It turns artificial making, autonomous action or computational decision into a discussion of agency, responsibility and social order.'
                    ),
                    sourceIds: [sid]
                },
                {
                    id: 'long-term-legacy',
                    label: localized('长期影响', 'Long-Term Legacy'),
                    html: localized(
                        '研究者通常把这类作品视为 AI 人文史中的文化参照，而不是现代技术的直接预言。它帮助后来的公众讨论机器、劳动、情感和治理。',
                        'Researchers generally treat this work as a cultural reference in AI humanities rather than a direct prediction of modern technology. It helped later publics discuss machines, labor, emotion and governance.'
                    ),
                    sourceIds: [sid]
                }
            ],
            review: {
                status: 'needs-review',
                notes: localized('待补充人物、图片与quiz。', 'Figures, images and quiz remain to be added.')
            },
            sentiment: 'wonder',
            branchSummary: localized(
                'AI人文编年：科幻、艺术与哲学',
                'AI humanities chronology: science fiction, art and philosophy'
            ),
            branch: 'humanistic-cycle'
        }
    };
    writeJson(path.join(dir, 'event.json'), event);
    writeJson(path.join(dir, 'claims.json'), [
        {
            id: `claim-${r.id}-core`,
            importance: 'core',
            text: localized(r.descZh, r.descEn),
            sourceIds: [sid],
            status: 'needs-review'
        }
    ]);
    writeJson(path.join(dir, 'sources.json'), [
        {
            id: sid,
            type: r.id.includes('new-china') ? 'book-index' : r.id.includes('metropolis') ? 'official-page' : 'archive',
            label: localized('主要来源', 'Primary source'),
            title: localized(r.sourceTitleZh, r.sourceTitleEn),
            url: r.url,
            language: 'en',
            reliability: r.id.includes('new-china') || r.id.includes('multivac') ? 'reference-only' : 'primary',
            notes: localized(
                '来源信息已保留；正式发布前继续核验版本与许可。',
                'Source information retained; verify edition and terms before publication.'
            ),
            purpose: 'historical-context'
        }
    ]);
    writeJson(path.join(dir, 'assets.json'), []);
    writeJson(path.join(dir, 'quizzes.json'), []);
}
console.log(`created ${records.length} pre-1949 humanistic event bundles`);
