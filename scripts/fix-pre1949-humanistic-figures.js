const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const map = {
    'descartes-automata': [
        [
            'rene-descartes',
            '《方法论》与《第一哲学沉思录》作者',
            'Author of Discourse on the Method and Meditations on First Philosophy'
        ]
    ],
    'jaquet-droz-automata': [
        ['pierre-jaquet-droz', '雅克-德罗自动人偶制造者', 'Maker associated with the Jaquet-Droz automata']
    ],
    'sandman-1816': [['eta-hoffmann', '《沙人》作者', 'Author of The Sandman']],
    'frankenstein-1818': [['mary-shelley', '《弗兰肯斯坦》作者', 'Author of Frankenstein; or, The Modern Prometheus']],
    'darwin-among-machines-1863': [['samuel-butler', '《机器中的达尔文》作者', 'Author of Darwin among the Machines']],
    'erewhon-1872': [['samuel-butler', '《埃瑞洪》作者', 'Author of Erewhon']],
    'impressions-theophrastus-1879': [
        ['george-eliot', '《西奥弗拉斯特斯·萨奇的印象》作者', 'Author of Impressions of Theophrastus Such']
    ],
    'future-eve-1886': [['villiers-de-lisle-adam', '《未来夏娃》作者', 'Author of The Future Eve']],
    'new-china-future-1902': [['liang-qichao', '《新中国未来记》作者', 'Author of The Future of New China']],
    'metropolis-1927': [['fritz-lang', '《大都会》导演', 'Director of Metropolis (1927)']],
    'multivac-1948': [['isaac-asimov', 'MULTIVAC 系列作者', 'Author of the MULTIVAC stories']]
};
const locations = {
    'descartes-automata': [
        'france',
        '法国',
        'France',
        '法国哲学与出版语境',
        'French philosophical and publishing context',
        [46.2276, 2.2137]
    ],
    'jaquet-droz-automata': ['switzerland', '瑞士', 'Switzerland', '纳沙泰尔', 'Neuchâtel', [46.9896, 6.9293]],
    'sandman-1816': ['germany', '德国', 'Germany', '德国文学语境', 'German literary context', [51.1657, 10.4515]],
    'frankenstein-1818': [
        'united-kingdom',
        '英国',
        'United Kingdom',
        '伦敦出版语境',
        'London publishing context',
        [51.5074, -0.1278]
    ],
    'darwin-among-machines-1863': [
        'united-kingdom',
        '英国',
        'United Kingdom',
        '英国文学语境',
        'British literary context',
        [51.5074, -0.1278]
    ],
    'erewhon-1872': [
        'united-kingdom',
        '英国',
        'United Kingdom',
        '伦敦出版语境',
        'London publishing context',
        [51.5074, -0.1278]
    ],
    'impressions-theophrastus-1879': [
        'united-kingdom',
        '英国',
        'United Kingdom',
        '英国文学语境',
        'British literary context',
        [51.5074, -0.1278]
    ],
    'future-eve-1886': ['france', '法国', 'France', '巴黎文学语境', 'Paris literary context', [48.8566, 2.3522]],
    'new-china-future-1902': [
        'china',
        '中国',
        'China',
        '中国出版语境',
        'Chinese publishing context',
        [35.8617, 104.1954]
    ],
    'metropolis-1927': [
        'germany',
        '德国',
        'Germany',
        '柏林电影制作语境',
        'Berlin film-production context',
        [52.52, 13.405]
    ],
    'multivac-1948': [
        'united-states',
        '美国',
        'United States',
        '美国科幻出版语境',
        'United States science-fiction publishing context',
        [39.8283, -98.5795]
    ]
};
for (const [eventId, entries] of Object.entries(map)) {
    const file = path.join(root, 'archive/events', eventId, 'event.json');
    const event = JSON.parse(fs.readFileSync(file));
    event.figures = entries.map(([figureId, roleZh, roleEn], i) => ({
        figureId,
        role: { zh: roleZh, en: roleEn },
        primary: i === 0
    }));
    const loc = locations[eventId];
    if (loc)
        event.location = {
            regionId: loc[0],
            country: { zh: loc[1], en: loc[2] },
            place: { zh: loc[3], en: loc[4] },
            coordinates: loc[5]
        };
    fs.writeFileSync(file, JSON.stringify(event, null, 2) + '\n');
    const assetsFile = path.join(root, 'archive/events', eventId, 'assets.json');
    if (fs.existsSync(assetsFile)) {
        const assets = JSON.parse(fs.readFileSync(assetsFile));
        for (const asset of assets) {
            if (asset.role === 'portrait' || asset.role === 'author-portrait') asset.figureIds = [entries[0][0]];
            else if (!asset.figureIds) asset.figureIds = [];
        }
        fs.writeFileSync(assetsFile, JSON.stringify(assets, null, 2) + '\n');
    }
}
console.log(`updated figures for ${Object.keys(map).length} events`);
