const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const items = [
    [
        'descartes-automata',
        'descartes-portrait',
        'Frans Hals - Portret van René Descartes.jpg',
        'Frans Hals: René Descartes portrait',
        'Public domain',
        'portrait'
    ],
    [
        'jaquet-droz-automata',
        'jaquet-droz-writer',
        'Jaquet Droz automata - Writer.jpg',
        'Jaquet-Droz automaton: Writer',
        'CC BY-SA 4.0',
        'artifact-reference'
    ],
    [
        'jaquet-droz-automata',
        'jaquet-droz-musician',
        'Jaquet Droz automata - Musician.jpg',
        'Jaquet-Droz automaton: Musician',
        'CC BY-SA 4.0',
        'artifact-reference'
    ],
    [
        'sandman-1816',
        'sandman-illustration-009',
        'E.T.A. Hoffmann - Der Sandmann 009.jpg',
        'E.T.A. Hoffmann: Der Sandmann illustration 009',
        'Public domain',
        'work-illustration'
    ],
    [
        'frankenstein-1818',
        'mary-shelley-biography-scan',
        'The life and letters of Mary Wollstonecraft Shelley (IA lifelettersofmar01marsrich).pdf',
        'Mary Shelley life and letters scan',
        'Public domain',
        'paper-reference'
    ],
    [
        'darwin-among-machines-1863',
        'samuel-butler-portrait',
        'Samuel Butler by Charles Gogin.jpg',
        'Samuel Butler portrait by Charles Gogin',
        'Public domain',
        'portrait'
    ],
    [
        'erewhon-1872',
        'erewhon-first-edition',
        'Erewhon-1872-001.jpg',
        'Erewhon 1872 first-edition scan',
        'Public domain',
        'paper-reference'
    ],
    [
        'impressions-theophrastus-1879',
        'george-eliot-portrait',
        'George Eliot BNF Gallica.jpg',
        'George Eliot portrait, BnF Gallica',
        'Public domain',
        'portrait'
    ],
    [
        'future-eve-1886',
        'villiers-portrait',
        "L'Isle-Adam.jpg",
        'Villiers de l’Isle-Adam portrait',
        'Public domain',
        'portrait'
    ],
    [
        'new-china-future-1902',
        'liang-qichao-portrait',
        'Liang Qichao portrait.jpg',
        'Liang Qichao portrait',
        'Public domain',
        'portrait'
    ],
    [
        'metropolis-1927',
        'metropolis-poster',
        'Boris Bilinski (1900-1948) Plakat für den Film Metropolis (1).jpg',
        'Metropolis 1927 poster',
        'Public domain',
        'film-poster'
    ],
    [
        'metropolis-1927',
        'metropolis-set-photo',
        'Horst von Harbou - Metropolis set photograph 05.jpg',
        'Metropolis set photograph',
        'Public domain',
        'film-production'
    ]
];

function download(url, out) {
    execFileSync('curl', ['-L', '--fail', '--retry', '2', '--retry-delay', '1', '--max-time', '90', url, '-o', out], {
        stdio: 'ignore'
    });
}
for (const [eventId, assetKey, fileTitle, label, license, role] of items) {
    const dir = path.join(root, 'archive/events', eventId);
    if (!fs.existsSync(dir)) continue;
    const base = path.join(root, 'resources/images/humanistic-cycle', eventId);
    fs.mkdirSync(base, { recursive: true });
    const ext = path.extname(fileTitle).toLowerCase() === '.pdf' ? '.pdf' : '.jpg';
    const fileName = `${assetKey}${ext}`;
    const out = path.join(base, fileName);
    const sourceId = `source-${eventId}-${assetKey}`;
    const assetId = `asset-${eventId}-${assetKey}`;
    const sourceUrl = `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileTitle).replace(/%20/g, '_')}`;
    const directUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileTitle)}?width=1600`;
    try {
        if (!fs.existsSync(out)) download(directUrl, out);
    } catch (err) {
        console.log(`skip ${eventId}/${assetKey}: download failed`);
        continue;
    }
    const eventFile = path.join(dir, 'event.json'),
        assetsFile = path.join(dir, 'assets.json'),
        sourcesFile = path.join(dir, 'sources.json');
    const event = JSON.parse(fs.readFileSync(eventFile));
    const assets = JSON.parse(fs.readFileSync(assetsFile));
    const sources = JSON.parse(fs.readFileSync(sourcesFile));
    if (!sources.some((x) => x.id === sourceId))
        sources.push({
            id: sourceId,
            type: 'image-source',
            label: { zh: '图片来源', en: 'Image source' },
            title: { zh: label, en: label },
            url: sourceUrl,
            language: 'en',
            reliability: 'primary',
            notes: {
                zh: `Wikimedia Commons 文件页标注 ${license}；使用前保留摄影者/作者署名及页面许可要求。`,
                en: `Wikimedia Commons file page identifies ${license}; retain author attribution and follow the page terms.`
            },
            purpose: 'image-provenance'
        });
    if (!assets.some((x) => x.id === assetId))
        assets.push({
            id: assetId,
            type: ext === '.pdf' ? 'document' : 'image',
            path: path.relative(root, out),
            role,
            caption: { zh: label, en: label },
            subcaption: { zh: `来源页许可：${license}。`, en: `Source-page license: ${license}.` },
            sourceId,
            sourceName: { zh: 'Wikimedia Commons', en: 'Wikimedia Commons' },
            sourceUrl: sourceUrl,
            rights: {
                status: license.toLowerCase().replace(/ /g, '-'),
                license: { zh: license, en: license },
                usage: {
                    zh: '用于 AI 人文故事线事件资料展示。',
                    en: 'Used for display in the AI humanities storyline.'
                }
            },
            usage: ['variant:humanistic-cycle'],
            editable: false
        });
    event.defaultPresentation.assetIds = event.defaultPresentation.assetIds || [];
    if (!event.defaultPresentation.assetIds.includes(assetId)) event.defaultPresentation.assetIds.push(assetId);
    event.defaultPresentation.sourceIds = event.defaultPresentation.sourceIds || [];
    if (!event.defaultPresentation.sourceIds.includes(sourceId)) event.defaultPresentation.sourceIds.push(sourceId);
    fs.writeFileSync(eventFile, JSON.stringify(event, null, 2) + '\n');
    fs.writeFileSync(assetsFile, JSON.stringify(assets, null, 2) + '\n');
    fs.writeFileSync(sourcesFile, JSON.stringify(sources, null, 2) + '\n');
    console.log(`added ${eventId}/${assetKey}`);
}
