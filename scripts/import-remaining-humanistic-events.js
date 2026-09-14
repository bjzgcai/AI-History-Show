const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
const draft = require('../ai-human-timeline-draft.json');
const figuresFile = path.join(root, 'archive/figures/figures.json');
const figures = JSON.parse(fs.readFileSync(figuresFile));
const skipIndexes = new Set([16, 18, 19, 24, 34, 60]);
const stopWords = new Set([
    '系列',
    '问题',
    '兴起',
    '理论',
    '困难问题',
    '计算主义',
    '联结主义兴起',
    '具身认知理论',
    '扩展心智论',
    '技术奇点'
]);
function slug(s) {
    return (
        s
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') || 'event'
    );
}
function yearOf(v) {
    const m = String(v).match(/\d{3,4}/);
    return m ? Number(m[0]) : 0;
}
function curlJson(url) {
    try {
        return JSON.parse(execFileSync('curl', ['-sS', '--max-time', '15', url], { encoding: 'utf8' }));
    } catch {
        return null;
    }
}
function addFigure(id, name) {
    if (figures.some((f) => f.id === id)) return;
    figures.push({
        id,
        name: { zh: name, en: name },
        aliases: [],
        type: 'person',
        organizationIds: [],
        profileSources: [],
        review: {
            status: 'needs-review',
            notes: {
                zh: '由 AI 人文清单批量导入，人物身份与中文译名待复核。',
                en: 'Batch-imported from the AI humanities list; identity and localized name require review.'
            }
        }
    });
}
function addImage(eventId, title, author, index) {
    const q = encodeURIComponent(`${title} ${author}`);
    const api = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${q}&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url%7Cextmetadata&format=json`;
    const data = curlJson(api);
    const p = data && Object.values(data.query?.pages || {})[0];
    if (!p) return null;
    const info = p.imageinfo?.[0],
        meta = info?.extmetadata || {};
    const fileTitle = p.title.replace(/^File:/, '');
    const safe = `image-${index}-${slug(fileTitle).slice(0, 70)}.jpg`;
    const dir = path.join(root, 'resources/images/humanistic-cycle', eventId);
    fs.mkdirSync(dir, { recursive: true });
    const out = path.join(dir, safe);
    try {
        if (!fs.existsSync(out))
            execFileSync(
                'curl',
                [
                    '-L',
                    '--fail',
                    '--max-time',
                    '25',
                    `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileTitle)}?width=1400`,
                    '-o',
                    out
                ],
                { stdio: 'ignore' }
            );
        if (!fs.existsSync(out) || fs.statSync(out).size < 1000) return null;
    } catch {
        return null;
    }
    return {
        asset: {
            id: `asset-${eventId}-image`,
            type: 'image',
            path: path.relative(root, out),
            role: 'reference-image',
            caption: { zh: `${title}相关资料图`, en: `Reference image for ${title}` },
            subcaption: {
                zh: '来源页图片；正式发布前复核人物/作品对应关系。',
                en: 'Source-page image; verify work and identity before publication.'
            },
            sourceId: `source-${eventId}-image`,
            sourceName: { zh: 'Wikimedia Commons', en: 'Wikimedia Commons' },
            sourceUrl: info.descriptionurl,
            rights: {
                status: (meta.LicenseShortName?.value || 'needs-review').toLowerCase().replace(/ /g, '-'),
                license: {
                    zh: meta.LicenseShortName?.value || '待核许可',
                    en: meta.LicenseShortName?.value || 'License to verify'
                },
                usage: { zh: '用于 AI 人文故事线展示。', en: 'Used in the AI humanities storyline.' }
            },
            usage: ['variant:humanistic-cycle'],
            editable: false
        },
        source: {
            id: `source-${eventId}-image`,
            type: 'image-source',
            label: { zh: '图片来源', en: 'Image source' },
            title: { zh: `${title}相关图片`, en: `Image related to ${title}` },
            url: info.descriptionurl,
            language: 'en',
            reliability: 'secondary',
            notes: {
                zh: `Wikimedia Commons 文件页；原许可：${meta.LicenseShortName?.value || '待核'}。`,
                en: `Wikimedia Commons file page; original license: ${meta.LicenseShortName?.value || 'to verify'}.`
            },
            purpose: 'image-provenance'
        }
    };
}
const storyline = JSON.parse(fs.readFileSync(path.join(root, 'archive/storylines/humanistic-cycle.json')));
let order = Math.max(...storyline.events.map((e) => e.order)) + 10;
let created = 0;
for (let i = 15; i < draft.entries.length; i++) {
    const entry = draft.entries[i],
        index = i + 1;
    if (skipIndexes.has(index) || stopWords.has(entry.title)) continue;
    const eventId = `humanistic-${yearOf(entry.year) || 'undated'}-${slug(entry.title).slice(0, 45)}`;
    const dir = path.join(root, 'archive/events', eventId);
    if (fs.existsSync(dir)) continue;
    const figureId = `humanistic-figure-${index}`;
    addFigure(figureId, entry.author || '未署名');
    const image = addImage(eventId, entry.title, entry.author || '', index);
    const sourceId = `source-${eventId}-record`;
    const sourceUrl = 'https://www.google.com/search?q=' + encodeURIComponent(`${entry.title} ${entry.author || ''}`);
    const event = {
        id: eventId,
        year: yearOf(entry.year),
        date: String(entry.year),
        title: { zh: entry.title, en: entry.title },
        description: {
            zh: entry.description,
            en: `${entry.description} This cultural event is included for its relevance to artificial life, machine agency, technology and society.`
        },
        location: {
            regionId: 'global',
            country: { zh: '待核', en: 'To verify' },
            place: { zh: '待核', en: 'To verify' },
            coordinates: [0, 0]
        },
        topics: ['humanistic-cycle'],
        achievementTypeIds: ['humanistic-cycle'],
        figures: [
            {
                figureId,
                role: { zh: `${entry.title}作者/导演/提出者`, en: `Author, director or originator of ${entry.title}` },
                primary: true
            }
        ],
        organizations: [],
        canonical: true,
        relatedLegacyIds: [],
        review: {
            status: 'needs-review',
            notes: {
                zh: '批量导入事件；英文标题、人物、地址、来源和图片需逐条复核。',
                en: 'Batch-imported event; English title, figure, location, sources and images require item-level review.'
            }
        },
        defaultPresentation: {
            presentationMode: 'archive',
            displayTitle: { zh: entry.title, en: entry.title },
            displaySummary: { zh: 'AI 人文故事线资料节点', en: 'AI humanities story-line node' },
            displayDescription: {
                zh: `<p>${entry.description}</p><p>该节点从作品、思想或社会想象的角度，讨论人工生命、机器行动、技术治理或人与机器的关系。</p>`,
                en: `<p>${entry.description}</p><p>This node considers artificial life, machine agency, technological governance or human–machine relations through a work, idea or social imagination.</p>`
            },
            emphasis: ['needs-review'],
            visual: 'humanistic',
            visualModules: [
                {
                    type: 'archiveLink',
                    site: { zh: '资料检索入口', en: 'Research entry' },
                    title: { zh: entry.title, en: entry.title },
                    description: {
                        zh: '事件原始资料与图片检索入口，待编辑确认后替换为正式来源。',
                        en: 'Research and image entry pending editorial confirmation.'
                    },
                    url: sourceUrl,
                    source: 'Research index',
                    license: { zh: '待核', en: 'To verify' },
                    usage: { zh: '编辑核验入口', en: 'Editorial verification entry' },
                    action: { zh: '打开检索入口', en: 'Open research entry' }
                }
            ],
            assetIds: image ? [image.asset.id] : [],
            sourceIds: [sourceId].concat(image ? [image.source.id] : []),
            claimIds: [`claim-${eventId}-core`],
            commentarySections: [
                {
                    id: 'historical-background',
                    label: { zh: '历史背景', en: 'Historical Background' },
                    html: {
                        zh: `${entry.description} 该作品或思想反映了当时社会对技术、主体性与未来秩序的想象。`,
                        en: `${entry.description} The work or idea reflects its period's imagination of technology, agency and future order.`
                    },
                    sourceIds: [sourceId]
                },
                {
                    id: 'core-idea',
                    label: { zh: '核心思想', en: 'Core Idea' },
                    html: {
                        zh: '它把人工制造、自动行动或计算决策转化为关于主体性、责任与社会秩序的讨论。',
                        en: 'It turns artificial making, autonomous action or computational decision into a discussion of agency, responsibility and social order.'
                    },
                    sourceIds: [sourceId]
                },
                {
                    id: 'long-term-legacy',
                    label: { zh: '长期影响', en: 'Long-Term Legacy' },
                    html: {
                        zh: '研究者通常把这类作品视为 AI 人文史中的文化参照，而不是现代技术的直接预言。',
                        en: 'Researchers generally treat this kind of work as a cultural reference in AI humanities rather than a direct prediction of modern technology.'
                    },
                    sourceIds: [sourceId]
                }
            ],
            review: {
                status: 'needs-review',
                notes: { zh: '待逐条编辑审阅。', en: 'Requires item-level editorial review.' }
            },
            sentiment: 'wonder',
            branchSummary: {
                zh: 'AI人文编年：科幻、艺术与哲学',
                en: 'AI humanities chronology: science fiction, art and philosophy'
            },
            branch: 'humanistic-cycle'
        }
    };
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'event.json'), JSON.stringify(event, null, 2) + '\n');
    fs.writeFileSync(
        path.join(dir, 'claims.json'),
        JSON.stringify(
            [
                {
                    id: `claim-${eventId}-core`,
                    importance: 'core',
                    text: { zh: entry.description, en: entry.description },
                    sourceIds: [sourceId],
                    status: 'needs-review'
                }
            ],
            null,
            2
        ) + '\n'
    );
    fs.writeFileSync(
        path.join(dir, 'sources.json'),
        JSON.stringify(
            [
                {
                    id: sourceId,
                    type: 'internal-record',
                    label: { zh: '清单记录', en: 'List record' },
                    title: { zh: entry.title, en: entry.title },
                    url: sourceUrl,
                    language: 'zh',
                    reliability: 'reference-only',
                    notes: {
                        zh: '来自 AI 人文整合清单；需替换为正式原始来源。',
                        en: 'From the AI humanities integration list; replace with a formal primary source.'
                    },
                    purpose: 'editorial-review'
                }
            ].concat(image ? [image.source] : []),
            null,
            2
        ) + '\n'
    );
    fs.writeFileSync(path.join(dir, 'assets.json'), JSON.stringify(image ? [image.asset] : [], null, 2) + '\n');
    fs.writeFileSync(path.join(dir, 'quizzes.json'), '[]\n');
    storyline.events.push({ eventId, order, enabled: true, milestoneId: `milestone-humanistic-cycle-${eventId}` });
    order += 10;
    created++;
}
fs.writeFileSync(figuresFile, JSON.stringify(figures, null, 2) + '\n');
fs.writeFileSync(
    path.join(root, 'archive/storylines/humanistic-cycle.json'),
    JSON.stringify(storyline, null, 2) + '\n'
);
console.log(`created ${created} remaining humanistic events`);
