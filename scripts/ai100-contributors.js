'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { isAssetSelectionExcluded } = require('./asset-selection-review');

const NAME_ALIASES = {
    'a joseph hoane jr': 'arthur hoane',
    'diederik p kingma': 'diederik kingma',
    'donald w loveland': 'donald loveland',
    'fei fei li': 'li fei fei',
    'herbert a simon': 'herbert simon',
    'jeff dean': 'jeffrey dean',
    'john alan robinson': 'john robinson',
    'john h holland': 'john holland',
    'john j hopfield': 'john hopfield',
    'jurgen schmidhuber': 'juergen schmidhuber',
    'mario p vecchi': 'mario vecchi',
    'pieter abbeel': 'pieter abbee',
    'richard olshen': 'richard olshen',
    'shunichi amari': 'shun ichi amari',
    'stephen a cook': 'stephen cook',
    'vladimir n vapnik': 'vladimir vapnik',
    'alexey ya chervonenkis': 'alexey chervonenkis',
    'yee whye teh': 'yee whye the'
};

const CONTRIBUTOR_ZH = {
    'Bruce Buchanan': '布鲁斯·布坎南',
    'Joshua Lederberg': '约书亚·莱德伯格',
    'Carl Djerassi': '卡尔·杰拉西',
    'Xiaowei Xu': '徐晓伟',
    'Corinna Cortes': '科琳娜·科尔特斯',
    'Andreas Ess': '安德烈亚斯·埃斯',
    'Yee-Whye The': '义威·特',
    'Ruslan Salakhutdinov': '鲁斯兰·萨拉赫特迪诺夫',
    "Shun'ichi Amari": '甘利俊一',
    'Xavier Glorot': '泽维尔·格洛罗',
    'Vincent Vanhoucke': '文森特·范霍克',
    'Kilian Weinberger': '基利安·温伯格',
    'Andrew Howard': '安德鲁·霍华德',
    'Mark Sandler': '马克·桑德勒',
    'Jie Hu': '胡杰',
    'Gang Sun': '孙刚',
    'Serge Belongie': '塞尔日·贝隆吉',
    'Piotr Dollar': '彼得·多拉尔',
    'Wei Liu': '刘威',
    'Alexander Berg': '亚历山大·伯格',
    'Jonathan Long': '乔纳森·朗',
    'Evan Shelhamer': '埃文·谢尔哈默',
    'Trevor Darrell': '特雷弗·达雷尔',
    'Quoc V. Le': '黎国辉',
    'Minh-Thang Luong': '明唐·梁',
    'Kelvin Xu': '徐凯文',
    'Niki Parmar': '妮基·帕尔马',
    'Jakob Uszkoreit': '雅各布·乌斯科雷特',
    'Llion Jones': '利昂·琼斯',
    'Aidan Gomez': '艾丹·戈麦斯',
    'Lukasz Kaiser': '卢卡什·凯泽',
    'Kristina Toutanova': '克里斯蒂娜·图塔诺娃',
    'Jeffrey Wu': '杰弗里·吴',
    'Dario Amodei': '达里奥·阿莫代',
    'Tom Brown': '汤姆·布朗',
    'Benjamin Mann': '本杰明·曼',
    'Nick Ryder': '尼克·赖德',
    'Melanie Subbiah': '梅拉妮·苏比亚',
    'Lucas Beyer': '卢卡斯·拜尔',
    'Alexander Kolesnikov': '亚历山大·科列斯尼科夫',
    'Dirk Weissenborn': '德克·魏森博恩',
    'Xiaohua Zhai': '翟晓华',
    'Neil Houlsby': '尼尔·霍尔斯比',
    'Yutong Lin': '林宇通',
    'Yue Cao': '曹越',
    'Han Hu': '胡瀚',
    'Jeffrey Dean': '杰弗里·迪恩',
    'Simon Osindero': '西蒙·奥辛德罗',
    'Soumith Chintala': '苏米特·钦塔拉',
    'Taesung Park': '朴泰成',
    'Alexei Efros': '阿列克谢·埃夫罗斯',
    'Timo Aila': '蒂莫·艾拉',
    'Max Welling': '马克斯·韦林',
    'Surya Ganguli': '苏里亚·甘古利',
    'Jonathan Ho': '乔纳森·何',
    'Pieter Abbee': '彼得·阿比尔',
    'William Dally': '威廉·达利',
    'Oriol Vinyals': '奥里奥尔·维尼亚尔斯',
    'Jeff Dean': '杰夫·迪恩',
    'Olga Russakovsky': '奥尔加·鲁萨科夫斯基',
    'Peter Dayan': '彼得·达扬',
    'Martin Riedmiller': '马丁·里德米勒',
    'Koray Kavukcuoglu': '科雷·卡武克丘奥卢',
    'Jonathan Hunt': '乔纳森·亨特',
    'Daan Wierstra': '丹·维尔斯特拉',
    'Aja Huang': '黄士杰',
    'Charles Anderson': '查尔斯·安德森',
    'Gavin Rummery': '加文·拉默里',
    'Mahesan Niranjan': '马赫桑·尼兰詹',
    'Yishay Mansour': '伊沙伊·曼苏尔',
    'Ross Quinlan': '罗斯·昆兰',
    'Tin Kam Ho': '何天琴',
    'Robert Schapire': '罗伯特·沙皮尔',
    'Yoav Freund': '约阿夫·弗罗因德',
    'Tianqi Chen': '陈天奇',
    'Carlos Guestrin': '卡洛斯·格斯特林',
    'Guolin Ke': '柯国霖',
    'John Lafferty': '约翰·拉弗蒂',
    'Fernando Pereira': '费尔南多·佩雷拉'
};

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeName(value) {
    return String(value || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function nameKey(value) {
    const normalized = normalizeName(value);
    return NAME_ALIASES[normalized] || normalized;
}

function namesMatch(expected, actual) {
    const expectedKey = nameKey(expected);
    const actualKey = nameKey(actual);
    if (!expectedKey || !actualKey) return false;
    if (expectedKey === actualKey) return true;
    const expectedTokens = expectedKey.split(' ').filter(Boolean);
    const actualTokens = actualKey.split(' ').filter(Boolean);
    return (
        expectedTokens[0] === actualTokens[0] &&
        expectedTokens[expectedTokens.length - 1] === actualTokens[actualTokens.length - 1]
    );
}

function splitContributors(value) {
    return String(value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

function slugName(value) {
    return nameKey(value).replace(/\s+/g, '-');
}

function hasLocalizedChinese(value) {
    return /[\u3400-\u9fff]/.test(String(value || ''));
}

function contributorZh(name, fallback) {
    if (hasLocalizedChinese(fallback)) return fallback;
    return CONTRIBUTOR_ZH[name] || '';
}

function localized(value, locale) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return String(value[locale] || value.en || value.zh || '');
}

function assetMentionsName(asset, name) {
    const label = [localized(asset.caption, 'en'), localized(asset.subcaption, 'en'), path.basename(asset.path || '')]
        .filter(Boolean)
        .join(' ');
    const labelKey = nameKey(label);
    const personKey = nameKey(name);
    if (labelKey.includes(personKey)) return true;
    const personTokens = personKey.split(' ').filter(Boolean);
    return personTokens.length > 1 && personTokens.every((token) => labelKey.includes(token));
}

function isPortraitCandidateAsset(asset, name) {
    const role = String(asset.role || '').toLowerCase();
    const caption = localized(asset.caption, 'en');
    const description = [caption, localized(asset.subcaption, 'en')].filter(Boolean).join(' ');
    const captionMentionsName = assetMentionsName({ ...asset, subcaption: '' }, name);
    if (/paper|page|diagram|architecture|explainer|screenshot|logo|document/.test(role)) return false;
    if (/portrait|hero-image|team-photo|person-photo|headshot/.test(role)) return true;
    if (/paper first page|paper page|architecture|diagram|screenshot/i.test(description)) return false;
    if (/portrait|肖像/i.test(description)) return assetMentionsName(asset, name);
    return /supporting-image|source-card/.test(role) && captionMentionsName;
}

function buildRegistry(root, contributorNames) {
    const eventsRoot = path.join(root, 'archive', 'events');
    const figures = [];
    const assets = [];

    for (const eventId of fs.readdirSync(eventsRoot).sort()) {
        const eventDir = path.join(eventsRoot, eventId);
        if (!fs.statSync(eventDir).isDirectory()) continue;
        const eventFile = path.join(eventDir, 'event.json');
        const assetsFile = path.join(eventDir, 'assets.json');
        const sourcesFile = path.join(eventDir, 'sources.json');
        const variantsDir = path.join(eventDir, 'variants');
        const sources = fs.existsSync(sourcesFile) ? readJson(sourcesFile) : [];
        const sourceMap = new Map(sources.map((source) => [source.id, source]));

        if (fs.existsSync(eventFile)) {
            const event = readJson(eventFile);
            for (const figure of event.figures || []) {
                if (figure.name && localized(figure.name, 'en')) figures.push({ eventId, figure });
            }
        }

        if (fs.existsSync(variantsDir)) {
            for (const fileName of fs
                .readdirSync(variantsDir)
                .filter((name) => name.endsWith('.json'))
                .sort()) {
                const variant = readJson(path.join(variantsDir, fileName));
                for (const figure of variant.figures || []) {
                    if (figure.name && localized(figure.name, 'en')) figures.push({ eventId, figure });
                }
            }
        }

        if (fs.existsSync(assetsFile)) {
            for (const asset of readJson(assetsFile)) {
                if (!asset.path || asset.type === 'svg') continue;
                const source = asset.sourceId ? sourceMap.get(asset.sourceId) || null : null;
                assets.push({ eventId, asset, source, personNames: [] });
            }
        }
    }

    for (const entry of assets) {
        for (const figureEntry of figures) {
            if (figureEntry.figure.avatar && figureEntry.figure.avatar === entry.asset.path) {
                entry.personNames.push(localized(figureEntry.figure.name, 'en'));
            }
        }
        for (const name of contributorNames) {
            if (assetMentionsName(entry.asset, name)) entry.personNames.push(name);
        }
        entry.personNames = [...new Set(entry.personNames.filter(Boolean))];
    }

    return { root, figures, assets };
}

function findFigureCandidate(name, registry, preferredEventId) {
    return registry.figures
        .filter((entry) => namesMatch(name, localized(entry.figure.name, 'en')))
        .sort((left, right) => {
            const leftScore = (left.eventId === preferredEventId ? 100 : 0) + (left.figure.avatar ? 10 : 0);
            const rightScore = (right.eventId === preferredEventId ? 100 : 0) + (right.figure.avatar ? 10 : 0);
            return rightScore - leftScore;
        })[0];
}

function getSourceUrl(entry) {
    return String(
        (entry.source && (entry.source.url || entry.source.doi || entry.source.archiveUrl)) ||
            entry.asset.sourceUrl ||
            (entry.asset.rights && entry.asset.rights.sourceUrl) ||
            ''
    ).trim();
}

function findPortraitCandidate(name, registry, preferredEventId, options = {}) {
    const allowExcludedFromVariants = options.allowExcludedFromVariants === true;
    return registry.assets
        .filter((entry) => !String(entry.asset.id || '').startsWith('asset-ai100-contributor-'))
        .filter((entry) => allowExcludedFromVariants || !isAssetSelectionExcluded(entry.asset))
        .filter((entry) => entry.personNames.some((personName) => namesMatch(name, personName)))
        .filter((entry) => isPortraitCandidateAsset(entry.asset, name))
        .filter((entry) => !/^https?:\/\//i.test(String(entry.asset.path || '')))
        .filter((entry) => fs.existsSync(path.join(registry.root, entry.asset.path)))
        .filter((entry) => entry.eventId === preferredEventId || /^https?:\/\//i.test(getSourceUrl(entry)))
        .sort((left, right) => {
            const score = (entry) =>
                (entry.eventId === preferredEventId ? 100 : 0) +
                (/portrait|hero-image/i.test(String(entry.asset.role || '')) ? 20 : 0) +
                (entry.source ? 5 : 0);
            return score(right) - score(left);
        })[0];
}

module.exports = {
    CONTRIBUTOR_ZH,
    buildRegistry,
    contributorZh,
    findFigureCandidate,
    findPortraitCandidate,
    getSourceUrl,
    localized,
    nameKey,
    namesMatch,
    readJson,
    slugName,
    splitContributors
};
