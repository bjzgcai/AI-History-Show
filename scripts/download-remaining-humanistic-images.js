const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
const items = [
    ['multivac-1948', 'Isaac Asimov MULTIVAC', 'asimov-multivac'],
    ['humanistic-1962-a-michael-noll', 'A Michael Noll computer art', 'noll-computer-art'],
    ['humanistic-1966-17-babel-17', 'Babel 17 Samuel Delany', 'babel17-delany'],
    ['humanistic-1967-event', 'I Have No Mouth and I Must Scream Harlan Ellison', 'ellison-i-have-no-mouth'],
    ['humanistic-1968-event', 'Do Androids Dream of Electric Sheep Philip K Dick', 'dick-electric-sheep'],
    ['humanistic-1972-event', 'The Nine Billion Names of God Arthur C Clarke', 'clarke-nine-billion'],
    ['humanistic-1979-event', 'Hitchhikers Guide Douglas Adams Marvin', 'adams-hitchhiker'],
    ['humanistic-1980-event', 'Chinese Room John Searle', 'searle-chinese-room'],
    ['humanistic-1982-event', 'Blade Runner 1982 Ridley Scott', 'blade-runner-1982'],
    ['humanistic-1989-event', 'Lord of Light Roger Zelazny', 'zelazny-lord-of-light'],
    ['humanistic-1990-event', 'The Difference Engine Gibson Sterling', 'difference-engine'],
    ['humanistic-1990-chinese-nation', 'Chinese Nation Block philosophy', 'block-chinese-nation'],
    ['humanistic-1991-event', 'Consciousness Explained Daniel Dennett', 'dennett-consciousness'],
    ['humanistic-1993-event', 'The Diamond Age Neal Stephenson', 'diamond-age'],
    ['humanistic-1995-event', 'Nam June Paik Electronic Superhighway', 'paik-electronic-superhighway'],
    ['humanistic-1999-event', 'The Matrix Wachowskis', 'matrix-1999'],
    ['humanistic-2001-event', 'A I Artificial Intelligence Spielberg', 'ai-spielberg'],
    ['humanistic-2003-event', 'Are You Living in a Computer Simulation Nick Bostrom', 'bostrom-simulation'],
    ['humanistic-2004-event', 'I Robot 2004 Alex Proyas', 'i-robot-film'],
    ['humanistic-2010-teamlab', 'teamLab digital art', 'teamlab-art'],
    ['humanistic-2012-event', 'Prometheus 2012 Ridley Scott', 'prometheus-2012'],
    ['humanistic-2014-event', 'Ex Machina Alex Garland', 'ex-machina'],
    ['humanistic-2017-2049', 'Blade Runner 2049 Denis Villeneuve', 'blade-runner-2049'],
    ['humanistic-2021-event', 'Klara and the Sun Kazuo Ishiguro', 'klara-sun'],
    ['humanistic-2025-iit-ai', 'Integrated Information Theory Giulio Tononi', 'iit-tononi'],
    ['humanistic-2025-ai', 'AI alignment Stuart Russell', 'ai-alignment']
];
function json(url) {
    try {
        return JSON.parse(execFileSync('curl', ['-sS', '--max-time', '15', url], { encoding: 'utf8' }));
    } catch {
        return null;
    }
}
for (const [eventId, query, key] of items) {
    const dir = path.join(root, 'archive/events', eventId);
    if (!fs.existsSync(dir)) continue;
    const api =
        'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=' +
        encodeURIComponent(query) +
        '&gsrnamespace=6&gsrlimit=3&prop=imageinfo&iiprop=url%7Cextmetadata&format=json';
    const data = json(api);
    const pages = Object.values(data?.query?.pages || {});
    const p =
        pages.find((x) => /portrait|poster|cover|film|book|art|photo|scan|painting|logo/i.test(x.title)) || pages[0];
    if (!p) continue;
    const i = p.imageinfo?.[0],
        m = i?.extmetadata || {},
        title = p.title.replace(/^File:/, '');
    const ext = /\.png$/i.test(title) ? '.png' : /\.webp$/i.test(title) ? '.webp' : '.jpg';
    const outDir = path.join(root, 'resources/images/humanistic-cycle', eventId);
    fs.mkdirSync(outDir, { recursive: true });
    const fileName = key + ext,
        out = path.join(outDir, fileName);
    try {
        if (!fs.existsSync(out))
            execFileSync(
                'curl',
                [
                    '-L',
                    '--fail',
                    '--max-time',
                    '35',
                    `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(title)}?width=1400`,
                    '-o',
                    out
                ],
                { stdio: 'ignore' }
            );
        if (!fs.existsSync(out) || fs.statSync(out).size < 1000) continue;
    } catch {
        continue;
    }
    const sourceId = `source-${eventId}-${key}`,
        assetId = `asset-${eventId}-${key}`;
    const eventFile = path.join(dir, 'event.json'),
        assetsFile = path.join(dir, 'assets.json'),
        sourcesFile = path.join(dir, 'sources.json');
    const event = JSON.parse(fs.readFileSync(eventFile)),
        assets = JSON.parse(fs.readFileSync(assetsFile)),
        sources = JSON.parse(fs.readFileSync(sourcesFile));
    if (!sources.some((s) => s.id === sourceId))
        sources.push({
            id: sourceId,
            type: 'image-source',
            label: { zh: '图片来源', en: 'Image source' },
            title: { zh: `${event.title.zh}相关图片`, en: `Image related to ${event.title.en}` },
            url: i.descriptionurl,
            language: 'en',
            reliability: 'secondary',
            notes: {
                zh: `Wikimedia Commons 文件页；许可：${m.LicenseShortName?.value || '待核'}。正式发布前复核图片与事件对应关系。`,
                en: `Wikimedia Commons file page; license: ${m.LicenseShortName?.value || 'to verify'}. Verify image relevance before publication.`
            },
            purpose: 'image-provenance'
        });
    if (!assets.some((a) => a.id === assetId))
        assets.push({
            id: assetId,
            type: 'image',
            path: path.relative(root, out),
            role: 'reference-image',
            caption: { zh: `${event.title.zh}资料图`, en: `${event.title.en} reference image` },
            subcaption: {
                zh: '事件相关图片；来源与许可已登记。',
                en: 'Event-related image; source and license recorded.'
            },
            sourceId,
            sourceName: { zh: 'Wikimedia Commons', en: 'Wikimedia Commons' },
            sourceUrl: i.descriptionurl,
            rights: {
                status: (m.LicenseShortName?.value || 'needs-review').toLowerCase().replace(/ /g, '-'),
                license: {
                    zh: m.LicenseShortName?.value || '待核许可',
                    en: m.LicenseShortName?.value || 'License to verify'
                },
                usage: { zh: '用于 AI 人文故事线展示。', en: 'Used in the AI humanities storyline.' }
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
    console.log('added', eventId, fileName);
}
