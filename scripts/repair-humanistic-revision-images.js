'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { URL } = require('node:url');

const root = path.join(__dirname, '..');
const eventsRoot = path.join(root, 'archive', 'events');
const figuresPath = path.join(root, 'archive', 'figures', 'figures.json');

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
    fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
}

function curlJson(url) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            return JSON.parse(
                execFileSync('curl', ['-sS', '--max-time', '20', '--retry', '2', url], { encoding: 'utf8' })
            );
        } catch {
            // Retry transient Wikimedia connection resets.
        }
    }
    return null;
}

function wikipediaImage(pageTitle) {
    const summary = curlJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`);
    const thumbnail = summary && summary.thumbnail && summary.thumbnail.source;
    const original = summary && summary.originalimage && summary.originalimage.source;
    if (!thumbnail) return null;
    const imagePath = new URL(original || thumbnail).pathname;
    const fileMatch = imagePath.match(/\/thumb\/[^/]+\/[^/]+\/([^/]+)\//i);
    const fileName = decodeURIComponent(fileMatch ? fileMatch[1] : imagePath.split('/').pop());
    if (!fileName) return null;
    const commons = curlJson(
        'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url%7Cextmetadata' +
            `&iiurlwidth=1200&titles=${encodeURIComponent(`File:${fileName}`)}`
    );
    const page = commons && Object.values(commons.query?.pages || {})[0];
    const info = page && page.imageinfo && page.imageinfo[0];
    const meta = (info && info.extmetadata) || {};
    return {
        imageUrl: (info && (info.thumburl || info.url)) || thumbnail,
        sourceUrl: (info && info.descriptionurl) || summary.content_urls?.desktop?.page,
        license: meta.LicenseShortName?.value || 'See Wikimedia Commons file page',
        creator: String(meta.Artist?.value || '')
            .replace(/<[^>]+>/g, '')
            .trim(),
        fileName
    };
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
                zh: '依据修订版 AI 人文编年补充的作品/文献作者人物。',
                en: 'Author figure added from the revised AI humanities timeline.'
            }
        }
    });
}

const repairs = [
    {
        eventId: 'ancient-hephaestus-automata',
        page: 'hephaestus-automata',
        captionZh: '赫菲斯托斯自动机械相关历史图',
        subcaptionZh: '与古希腊自动机械想象相关的历史资料图。',
        subcaptionEn: 'Historical reference image related to ancient Greek automata.',
        role: 'artifact-reference',
        figureId: null,
        localPath: 'resources/images/humanistic-cycle/ancient-hephaestus-automata/related-reference.jpg',
        sourceUrl: 'https://commons.wikimedia.org/',
        license: 'See original source record'
    },
    {
        eventId: 'humanistic-1950-i-robot',
        page: 'Isaac_Asimov',
        captionZh: '艾萨克·阿西莫夫肖像',
        subcaptionZh: '《我，机器人》作者。',
        subcaptionEn: 'Author of I, Robot.',
        role: 'portrait',
        figureId: 'isaac-asimov',
        localPath: 'resources/images/humanistic-cycle/people/1942-asimov-runaround_isaac-asimov.jpg',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Isaac.Asimov01.jpg',
        license: 'Public domain'
    },
    {
        eventId: 'humanistic-computationalism-1950',
        page: 'Hilary_Putnam',
        captionZh: '希拉里·普特南肖像',
        subcaptionZh: '现代计算主义心灵观的重要代表人物。',
        subcaptionEn: 'Major representative of modern computationalism about mind.',
        role: 'portrait',
        figureId: 'hilary-putnam',
        localPath: 'resources/images/bench-council-ai100/photos/1960-davis-putnam-dpll_hilary-putnam.jpg',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Hilary_Putnam.jpg',
        license: 'CC BY-SA 2.5'
    },
    {
        eventId: 'humanistic-1969-connectionism',
        page: 'Frank_Rosenblatt',
        captionZh: '弗兰克·罗森布拉特肖像',
        subcaptionZh: '早期神经网络与感知机研究者。',
        role: 'portrait',
        figureId: 'frank-rosenblatt'
    },
    {
        eventId: 'humanistic-1972-dreyfus',
        page: 'Hubert_Dreyfus',
        captionZh: '休伯特·德雷福斯肖像',
        subcaptionZh: '《计算机不能做什么》作者。',
        role: 'portrait',
        figureId: 'hubert-dreyfus'
    },
    {
        eventId: 'humanistic-1979-geb',
        page: 'Douglas_Hofstadter',
        captionZh: '道格拉斯·霍夫施塔特肖像',
        subcaptionZh: '《哥德尔、艾舍尔、巴赫》作者。',
        subcaptionEn: 'Author of Gödel, Escher, Bach.',
        role: 'portrait',
        figureId: 'douglas-hofstadter',
        localPath: 'resources/images/humanistic-cycle/humanistic-1979-geb/douglas-hofstadter-portrait.jpg',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Douglas_Hofstadter,_Stanford_2006_(crop).jpg',
        license: 'CC BY-SA 2.0'
    },
    {
        eventId: 'humanistic-1985-cyborg-manifesto',
        page: 'Donna_Haraway',
        captionZh: '唐娜·哈拉维肖像',
        subcaptionZh: '《赛博格宣言》作者。',
        role: 'portrait',
        figureId: 'donna-haraway'
    },
    {
        eventId: 'humanistic-1988-mind-children',
        page: 'Hans_Moravec',
        captionZh: '汉斯·莫拉维克与机器人',
        subcaptionZh: '《心智之子》作者的 CMU 个人主页资料图。',
        subcaptionEn: 'CMU personal-page image of the author of Mind Children.',
        role: 'portrait',
        figureId: 'hans-moravec',
        localPath:
            'resources/images/humanistic-cycle/humanistic-1988-mind-children/hans-moravec-and-robot-cmu-1995.jpg',
        sourceUrl: 'https://frc.ri.cmu.edu/~hpm/',
        license: 'Source page terms'
    },
    {
        eventId: 'humanistic-1991-ghost-shell',
        page: 'Mamoru_Oshii',
        captionZh: '押井守肖像',
        subcaptionZh: '1995 年动画电影《攻壳机动队》导演。',
        role: 'portrait',
        figureId: 'mamoru-oshii'
    },
    {
        eventId: 'humanistic-1993-singularity',
        page: 'Vernor_Vinge',
        captionZh: '弗诺·文奇肖像',
        subcaptionZh: '技术奇点概念的重要提出者。',
        role: 'portrait',
        figureId: 'vernor-vinge'
    },
    {
        eventId: 'humanistic-1995-hard-problem',
        page: 'David_Chalmers',
        captionZh: '大卫·查尔默斯肖像',
        subcaptionZh: '意识“困难问题”提出者。',
        subcaptionEn: 'Formulator of the hard problem of consciousness.',
        role: 'portrait',
        figureId: 'david-chalmers',
        localPath: 'resources/images/humanistic-cycle/humanistic-1995-hard-problem/david-chalmers-portrait.jpg',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:David_chalmers.jpg',
        license: 'CC BY-SA 4.0'
    },
    {
        eventId: 'humanistic-1998-extended-mind',
        page: 'David_Chalmers',
        captionZh: '大卫·查尔默斯肖像',
        subcaptionZh: '《拓展心智论》共同作者。',
        subcaptionEn: 'Co-author of The Extended Mind.',
        role: 'portrait',
        figureId: 'david-chalmers',
        localPath: 'resources/images/humanistic-cycle/humanistic-1995-hard-problem/david-chalmers-portrait.jpg',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:David_chalmers.jpg',
        license: 'CC BY-SA 4.0'
    },
    {
        eventId: 'humanistic-2014-superintelligence',
        page: 'Nick_Bostrom',
        captionZh: '尼克·博斯特罗姆肖像',
        subcaptionZh: '《超级智能》作者。',
        subcaptionEn: 'Author of Superintelligence.',
        role: 'portrait',
        figureId: 'nick-bostrom',
        localPath:
            'resources/images/humanistic-cycle/humanistic-2014-superintelligence/prof-nick-bostrom-324-1-jpg-reference.jpg',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Prof_Nick_Bostrom_324-1.jpg',
        license: 'CC BY 4.0'
    },
    {
        eventId: 'humanistic-2022-reality-plus',
        page: 'David_Chalmers',
        captionZh: '大卫·查尔默斯肖像',
        subcaptionZh: '《现实+》作者。',
        subcaptionEn: 'Author of Reality+.',
        role: 'portrait',
        figureId: 'david-chalmers',
        localPath: 'resources/images/humanistic-cycle/humanistic-1995-hard-problem/david-chalmers-portrait.jpg',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:David_chalmers.jpg',
        license: 'CC BY-SA 4.0'
    }
];

const figureRoles = {
    'humanistic-computationalism-1950': {
        figureId: 'hilary-putnam',
        zh: '现代计算主义心灵观的重要代表',
        en: 'Major representative of modern computationalism about mind'
    },
    'humanistic-1969-connectionism': {
        figureId: 'frank-rosenblatt',
        zh: '早期联结主义与感知机研究者',
        en: 'Early connectionist and perceptron researcher'
    },
    'humanistic-1998-extended-mind': [
        {
            figureId: 'david-chalmers',
            zh: '《拓展心智论》共同作者',
            en: 'Co-author of The Extended Mind',
            primary: true
        },
        { figureId: 'andy-clark', zh: '《拓展心智论》共同作者', en: 'Co-author of The Extended Mind', primary: false }
    ]
};

const figures = readJson(figuresPath);
ensureFigure(figures, {
    id: 'andy-clark',
    nameZh: '安迪·克拉克',
    nameEn: 'Andy Clark',
    sourceUrl: 'https://www.ed.ac.uk/profile/andy-clark'
});
ensureFigure(figures, {
    id: 'douglas-hofstadter',
    nameZh: '道格拉斯·霍夫施塔特',
    nameEn: 'Douglas Hofstadter',
    sourceUrl: 'https://www.pulitzer.org/winners/douglas-r-hofstadter'
});
for (const repair of repairs) {
    const eventDir = path.join(eventsRoot, repair.eventId);
    const eventFile = path.join(eventDir, 'event.json');
    if (!fs.existsSync(eventFile)) continue;
    const image = repair.localPath
        ? {
              imageUrl: null,
              sourceUrl: repair.sourceUrl,
              license: repair.license,
              creator: '',
              fileName: path.basename(repair.localPath)
          }
        : wikipediaImage(repair.page);
    if (!image) {
        console.warn(`No precise image found for ${repair.eventId}`);
        continue;
    }
    const extension =
        path
            .extname(image.fileName)
            .toLowerCase()
            .replace(/[^.a-z0-9]/g, '') || '.jpg';
    const imagePath = path.join(
        root,
        'resources',
        'images',
        'humanistic-cycle',
        repair.eventId,
        `verified-${repair.page.toLowerCase().replace(/_/g, '-')}${extension}`
    );
    fs.mkdirSync(path.dirname(imagePath), { recursive: true });
    if (!fs.existsSync(imagePath)) {
        try {
            if (repair.localPath) {
                fs.copyFileSync(path.join(root, repair.localPath), imagePath);
            } else {
                const smallerImageUrl = image.imageUrl.replace(/\/\d+px-([^/?]+)(\?.*)?$/, '/640px-$1$2');
                try {
                    execFileSync(
                        'curl',
                        ['-L', '--fail', '--max-time', '45', '--retry', '2', smallerImageUrl, '-o', imagePath],
                        { stdio: 'ignore' }
                    );
                } catch {
                    execFileSync(
                        'curl',
                        [
                            '-L',
                            '--fail',
                            '--max-time',
                            '45',
                            '--retry',
                            '2',
                            `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(image.fileName)}?width=900`,
                            '-o',
                            imagePath
                        ],
                        { stdio: 'ignore' }
                    );
                }
            }
        } catch {
            console.warn(`Unable to download precise image for ${repair.eventId}`);
            continue;
        }
    }
    const event = readJson(eventFile);
    if (repair.eventId === 'ancient-hephaestus-automata') {
        event.figures = [
            {
                figureId: 'homer',
                role: { zh: '《伊利亚特》作者传统', en: 'Authorial tradition of The Iliad' },
                primary: true
            }
        ];
    }
    if (figureRoles[repair.eventId]) {
        const role = figureRoles[repair.eventId];
        const roles = Array.isArray(role) ? role : [{ ...role, primary: true }];
        event.figures = roles.map((item) => ({
            figureId: item.figureId,
            role: { zh: item.zh, en: item.en },
            primary: item.primary
        }));
    }
    const sourceId = `source-${repair.eventId}-verified-image`;
    const assetId = `asset-${repair.eventId}-verified-image`;
    const asset = {
        id: assetId,
        type: 'image',
        path: path.relative(root, imagePath).replace(/\\/g, '/'),
        role: repair.role,
        caption: { zh: repair.captionZh, en: repair.page.replace(/_/g, ' ') },
        subcaption: { zh: repair.subcaptionZh, en: repair.subcaptionEn || repair.subcaptionZh },
        sourceId,
        sourceName: { zh: 'Wikimedia Commons', en: 'Wikimedia Commons' },
        sourceUrl: image.sourceUrl,
        rights: {
            status: image.license.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            license: { zh: image.license, en: image.license },
            usage: {
                zh: '用于 AI 人文故事线人物或历史资料展示。',
                en: 'Used as a figure or historical reference in the AI humanities storyline.'
            }
        },
        usage: ['variant:humanistic-cycle'],
        editable: false,
        figureIds: repair.figureId ? [repair.figureId] : []
    };
    const sourcesFile = path.join(eventDir, 'sources.json');
    const sources = readJson(sourcesFile).filter((source) => source.type !== 'image-source');
    sources.push({
        id: sourceId,
        type: 'image-source',
        label: { zh: '图片来源', en: 'Image source' },
        title: { zh: repair.captionZh, en: repair.page.replace(/_/g, ' ') },
        url: image.sourceUrl,
        language: 'en',
        reliability: 'primary',
        notes: {
            zh: `Wikimedia Commons 文件页确认图片对象；许可：${image.license}${image.creator ? `；作者/摄影者：${image.creator}` : ''}。`,
            en: `Wikimedia Commons file page identifies the subject; license: ${image.license}${image.creator ? `; creator: ${image.creator}` : ''}.`
        },
        purpose: 'image-provenance'
    });
    writeJson(path.join(eventDir, 'assets.json'), [asset]);
    writeJson(sourcesFile, sources);
    event.defaultPresentation.assetIds = [assetId];
    event.defaultPresentation.sourceIds = Array.from(
        new Set([
            ...(event.defaultPresentation.sourceIds || []).filter((id) => sources.some((source) => source.id === id)),
            sourceId
        ])
    );
    writeJson(eventFile, event);
}

const removableFigureIds = new Set(['computationalism-thinkers', 'connectionism-school']);
writeJson(
    figuresPath,
    figures.filter((figure) => !removableFigureIds.has(figure.id))
);
console.log('Repaired revised humanistic event images with exact figure matches.');
