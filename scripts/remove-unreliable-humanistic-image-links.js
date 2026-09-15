const fs = require('fs'),
    path = require('path');
const root = path.join(__dirname, '..');
let changed = 0;
for (const d of fs.readdirSync(path.join(root, 'archive/events'))) {
    if (!d.startsWith('humanistic-')) continue;
    const dir = path.join(root, 'archive/events', d),
        af = path.join(dir, 'assets.json'),
        sf = path.join(dir, 'sources.json'),
        ef = path.join(dir, 'event.json');
    if (!fs.existsSync(af)) continue;
    const assets = JSON.parse(fs.readFileSync(af));
    const bad = assets.filter((a) => a.role === 'reference-image');
    if (!bad.length) continue;
    const badIds = new Set(bad.map((a) => a.id)),
        badSources = new Set(bad.map((a) => a.sourceId));
    fs.writeFileSync(
        af,
        JSON.stringify(
            assets.filter((a) => !badIds.has(a.id)),
            null,
            2
        ) + '\n'
    );
    const sources = JSON.parse(fs.readFileSync(sf));
    fs.writeFileSync(
        sf,
        JSON.stringify(
            sources.filter((s) => !badSources.has(s.id)),
            null,
            2
        ) + '\n'
    );
    const e = JSON.parse(fs.readFileSync(ef));
    e.defaultPresentation.assetIds = (e.defaultPresentation.assetIds || []).filter((id) => !badIds.has(id));
    e.defaultPresentation.sourceIds = (e.defaultPresentation.sourceIds || []).filter((id) => !badSources.has(id));
    fs.writeFileSync(ef, JSON.stringify(e, null, 2) + '\n');
    changed++;
}
console.log(`detached unreliable image links from ${changed} events`);
