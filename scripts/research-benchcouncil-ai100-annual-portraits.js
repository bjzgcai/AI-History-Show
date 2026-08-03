#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { URLSearchParams } = require('node:url');

const ROOT = path.join(__dirname, '..');
const STORYLINE_ID = 'bench-council-ai100-2022-2023';
const OUTPUT_PATH = path.join(ROOT, 'research', 'benchcouncil-ai100', 'annual-portrait-research-2026-08-03.json');
const PORTRAIT_ROOT = path.join(ROOT, 'resources', 'images', 'benchcouncil-ai100-annual', 'portraits');
const USER_AGENT = 'AI-History-Show/0.1 (portrait provenance research)';
const RESEARCH_DESCRIPTION_PATTERN =
    /artificial intelligence|machine learning|computer (?:scientist|science|vision)|deep learning|robotic|researcher|research scientist|software engineer|electrical engineer|professor|data scientist/i;

const CURATED_LOCAL_PORTRAITS = {
    'ze liu': {
        path: 'resources/images/external/ai100-2021-swin-transformer/ze-liu-portrait.jpg',
        sourceName: { en: 'Ze Liu personal website', zh: '刘泽个人网站' },
        sourceUrl: 'https://zeliu98.github.io/',
        imageUrl: 'https://zeliu98.github.io/images/zeliu.jpg',
        license: {
            en: 'The profile page does not state redistribution rights; retain the source note and recheck before external redistribution.',
            zh: '个人主页未声明再分发许可；必须保留来源备注，对外再分发前需再次核验。'
        },
        reliability: 'primary-identity-source',
        usageStatus: 'external-reference',
        notes: {
            en: "Exact contributor-name match. The image is published on the researcher's personal website.",
            zh: '人物姓名精确匹配，图片发布于研究者个人网站。'
        }
    },
    'kaiming he': {
        path: 'resources/images/bench-council-ai100/photos/2015-faster-r-cnn_kaiming-he.jpg',
        sourceName: { en: 'MIT CSAIL profile', zh: 'MIT CSAIL 个人主页' },
        sourceUrl: 'https://people.csail.mit.edu/kaiming/',
        imageUrl: 'https://people.csail.mit.edu/kaiming/',
        license: {
            en: 'The official MIT profile does not state redistribution rights; retain the source note and recheck before external redistribution.',
            zh: 'MIT 官方个人主页未声明再分发许可；必须保留来源备注，对外再分发前需再次核验。'
        },
        reliability: 'primary-institution-profile',
        usageStatus: 'external-reference',
        notes: {
            en: 'Exact contributor-name match. Identity is confirmed by the official MIT profile.',
            zh: '人物姓名精确匹配，身份由 MIT 官方个人主页确认。'
        }
    },
    'tsung yi lin': {
        path: 'resources/images/external/ai100-2014-ms-coco/tsung-yi-lin-portrait.jpg',
        sourceName: { en: 'Tsung-Yi Lin personal website', zh: '林宗毅个人网站' },
        sourceUrl: 'https://tsungyilin.info/',
        imageUrl: 'https://tsungyilin.info/images/tsungyi.jpeg',
        license: {
            en: 'The personal website does not state redistribution rights; retain the source note and recheck before external redistribution.',
            zh: '个人网站未声明再分发许可；必须保留来源备注，对外再分发前需再次核验。'
        },
        reliability: 'primary-identity-source',
        usageStatus: 'external-reference',
        notes: {
            en: "Exact contributor-name match. The image is published on the researcher's personal website.",
            zh: '人物姓名精确匹配，图片发布于研究者个人网站。'
        }
    },
    'tero karras': {
        path: 'resources/images/external/ai100-2019-stylegan/tero-karras-github.jpg',
        sourceName: { en: 'Tero Karras GitHub profile', zh: '特罗·卡拉斯 GitHub 主页' },
        sourceUrl: 'https://github.com/tkarras',
        imageUrl: 'https://avatars.githubusercontent.com/u/3089181?v=4&s=800',
        license: {
            en: 'The GitHub profile does not state redistribution rights; retain the source note and recheck before external redistribution.',
            zh: 'GitHub 主页未声明再分发许可；必须保留来源备注，对外再分发前需再次核验。'
        },
        reliability: 'primary-account-source',
        usageStatus: 'external-reference',
        notes: {
            en: "Exact contributor-name match. The avatar comes from the researcher's own GitHub account.",
            zh: '人物姓名精确匹配，头像来自研究者本人 GitHub 账号。'
        }
    },
    'julian schrittwieser': {
        path: 'resources/images/external/2017-alphazero/julian-schrittwieser-portrait.jpg',
        sourceName: { en: 'User-provided photograph', zh: '用户提供照片' },
        sourceUrl: '',
        imageUrl: '',
        license: {
            en: 'Provided by the user for exhibition use in this project; confirm the original rights scope before further redistribution.',
            zh: '用户提供用于本项目展览展示；若对外再分发，请复核原始授权范围。'
        },
        reliability: 'user-provided-identity-source',
        usageStatus: 'user-provided',
        notes: {
            en: 'Exact contributor-name match. The local asset is explicitly documented as user-provided.',
            zh: '人物姓名精确匹配，本地资产明确记录为用户提供。'
        }
    }
};

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function normalize(value) {
    return String(value || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function slugify(value) {
    return normalize(value).replace(/\s+/g, '-');
}

function stripHtml(value) {
    return String(value || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&#039;|&apos;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();
}

function commonsFileName(imageUrl) {
    const value =
        String(imageUrl || '')
            .split('/')
            .pop() || '';
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

function institutionTerms(values) {
    const aliases = {
        'facebook ai research': 'meta',
        facebook: 'meta',
        'microsoft research asia': 'microsoft',
        'microsoft research': 'microsoft',
        'google brain': 'google',
        'google research': 'google',
        'google deepmind': 'deepmind',
        'uc berkeley': 'berkeley',
        'university of california berkeley': 'berkeley',
        'massachusetts institute of technology': 'mit',
        'eth zurich': 'eth',
        'nvidia research': 'nvidia'
    };
    return [
        ...new Set(
            values
                .flatMap((value) => String(value || '').split(','))
                .map(normalize)
                .filter(Boolean)
                .map((value) => aliases[value] || value)
        )
    ];
}

function hasInstitutionMatch(officialInstitutions, employerLabels) {
    const official = institutionTerms(officialInstitutions);
    const employers = institutionTerms(employerLabels);
    return official.some((left) =>
        employers.some(
            (right) =>
                left === right ||
                (left.length >= 5 && right.includes(left)) ||
                (right.length >= 5 && left.includes(right))
        )
    );
}

function delay(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchJson(url, options = {}) {
    for (let attempt = 0; attempt < 6; attempt += 1) {
        const response = await fetch(url, {
            ...options,
            headers: { 'User-Agent': USER_AGENT, ...(options.headers || {}) }
        });
        if (response.ok) return response.json();
        if (response.status !== 429 && response.status < 500) {
            throw new Error(`${response.status} ${response.statusText}: ${url}`);
        }
        const retryAfter = Number(response.headers.get('retry-after'));
        const waitMilliseconds = Number.isFinite(retryAfter)
            ? Math.max(1000, retryAfter * 1000)
            : Math.min(30000, 2500 * 2 ** attempt);
        console.log(`HTTP ${response.status}; retrying in ${waitMilliseconds}ms.`);
        await delay(waitMilliseconds);
    }
    throw new Error(`Request retries exhausted: ${url}`);
}

async function fetchBuffer(url) {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
    return Buffer.from(await response.arrayBuffer());
}

async function getWikidataCandidates(people) {
    const values = people.map((person) => `${JSON.stringify(person.name.en)}@en`).join(' ');
    const query = `
SELECT ?name ?person ?description ?image ?employerLabel ?occupationLabel WHERE {
  VALUES ?name { ${values} }
  ?person rdfs:label ?name;
          wdt:P31 wd:Q5;
          wdt:P18 ?image.
  OPTIONAL { ?person schema:description ?description. FILTER(LANG(?description) = "en") }
  OPTIONAL {
    ?person wdt:P108 ?employer.
    ?employer rdfs:label ?employerLabel.
    FILTER(LANG(?employerLabel) = "en")
  }
  OPTIONAL {
    ?person wdt:P106 ?occupation.
    ?occupation rdfs:label ?occupationLabel.
    FILTER(LANG(?occupationLabel) = "en")
  }
}`;
    const body = new URLSearchParams({ query, format: 'json' });
    const data = await fetchJson('https://query.wikidata.org/sparql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
    });
    const byName = new Map();
    for (const binding of (data.results && data.results.bindings) || []) {
        const name = binding.name && binding.name.value;
        const personUrl = binding.person && binding.person.value;
        if (!name || !personUrl) continue;
        const key = normalize(name);
        if (!byName.has(key)) byName.set(key, new Map());
        const candidates = byName.get(key);
        const candidate = candidates.get(personUrl) || {
            entityId: personUrl.split('/').pop(),
            entityUrl: personUrl.replace(/^http:/, 'https:'),
            label: name,
            description: (binding.description && binding.description.value) || '',
            imageFile: commonsFileName(binding.image && binding.image.value),
            employerLabels: [],
            occupationLabels: []
        };
        if (binding.employerLabel && binding.employerLabel.value)
            candidate.employerLabels.push(binding.employerLabel.value);
        if (binding.occupationLabel && binding.occupationLabel.value)
            candidate.occupationLabels.push(binding.occupationLabel.value);
        candidate.employerLabels = [...new Set(candidate.employerLabels)];
        candidate.occupationLabels = [...new Set(candidate.occupationLabels)];
        candidates.set(personUrl, candidate);
    }
    return new Map(
        [...byName].map(([key, candidates]) => {
            const list = [...candidates.values()];
            const researchMatches = list.filter((candidate) =>
                RESEARCH_DESCRIPTION_PATTERN.test(`${candidate.description} ${candidate.occupationLabels.join(' ')}`)
            );
            return [key, { candidates: list, selected: researchMatches.length === 1 ? researchMatches[0] : null }];
        })
    );
}

async function getCommonsMetadata(fileNames) {
    const metadata = {};
    for (let index = 0; index < fileNames.length; index += 25) {
        const batch = fileNames.slice(index, index + 25);
        if (!batch.length) continue;
        const params = new URLSearchParams({
            action: 'query',
            titles: batch.map((name) => `File:${name}`).join('|'),
            prop: 'imageinfo',
            iiprop: 'url|mime|extmetadata',
            iiurlwidth: '1200',
            format: 'json',
            formatversion: '2',
            origin: '*'
        });
        const data = await fetchJson(`https://commons.wikimedia.org/w/api.php?${params}`);
        for (const page of (data.query && data.query.pages) || []) {
            const info = page.imageinfo && page.imageinfo[0];
            if (info) metadata[page.title.replace(/^File:/, '')] = info;
        }
    }
    return metadata;
}

function collectPeople() {
    const people = new Map();
    const eventsRoot = path.join(ROOT, 'archive', 'events');
    for (const eventId of fs
        .readdirSync(eventsRoot)
        .filter((id) => id.startsWith('ai100-annual-2022-2023-'))
        .sort()) {
        const event = readJson(path.join(eventsRoot, eventId, 'event.json'));
        for (const figure of event.figures || []) {
            const key = normalize(figure.name && figure.name.en);
            if (!key) continue;
            const current = people.get(key) || {
                name: figure.name,
                eventIds: [],
                officialInstitutions: []
            };
            current.eventIds.push(eventId);
            current.officialInstitutions.push(event.location && event.location.place && event.location.place.en);
            people.set(key, current);
        }
    }
    return [...people.values()].map((person) => ({
        ...person,
        eventIds: [...new Set(person.eventIds)],
        officialInstitutions: [...new Set(person.officialInstitutions.filter(Boolean))]
    }));
}

function mimeExtension(mime, fileName) {
    if (/png/i.test(mime)) return '.png';
    if (/webp/i.test(mime)) return '.webp';
    if (/gif/i.test(mime)) return '.gif';
    const extension = path.extname(fileName).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(extension) ? extension : '.jpg';
}

async function main() {
    const people = collectPeople();
    console.log(`Researching ${people.length} unique annual AI100 contributors.`);
    const wikidataByName = await getWikidataCandidates(people);
    const fileNames = [
        ...new Set(
            [...wikidataByName.values()].map((result) => result.selected && result.selected.imageFile).filter(Boolean)
        )
    ];
    const commonsMetadata = await getCommonsMetadata(fileNames);
    fs.mkdirSync(PORTRAIT_ROOT, { recursive: true });

    const records = [];
    for (const person of people) {
        const wikidata = wikidataByName.get(normalize(person.name.en)) || { candidates: [], selected: null };
        const local = CURATED_LOCAL_PORTRAITS[normalize(person.name.en)];
        if (local) {
            records.push({
                ...person,
                status: 'selected-local',
                selectedImage: {
                    ...local,
                    identityChecks: ['exact-contributor-name', 'primary-profile-or-provided-source'],
                    sourceNotesRequired: true
                },
                wikidataCandidates: wikidata.candidates
            });
            continue;
        }

        const candidate = wikidata.selected;
        const fileName = candidate && candidate.imageFile;
        const info = commonsMetadata[fileName];
        const employerLabels = (candidate && candidate.employerLabels) || [];
        const occupationLabels = (candidate && candidate.occupationLabels) || [];
        const affiliationMatch = hasInstitutionMatch(person.officialInstitutions, employerLabels);
        const metadata = info && info.extmetadata ? info.extmetadata : {};
        const licenseName = stripHtml(metadata.LicenseShortName && metadata.LicenseShortName.value);
        const verified = Boolean(candidate && fileName && info && licenseName && affiliationMatch);

        if (!verified) {
            records.push({
                ...person,
                status: candidate && fileName ? 'candidate-needs-review' : 'not-found',
                selectedImage: null,
                wikidataCandidate: candidate
                    ? {
                          ...candidate,
                          employerLabels,
                          occupationLabels,
                          imageFile: fileName,
                          filePage: info && info.descriptionurl,
                          license: licenseName,
                          affiliationMatch,
                          rejectionReason: !fileName
                              ? 'no-wikimedia-image'
                              : !info || !licenseName
                                ? 'missing-commons-license-metadata'
                                : 'official-event-institution-not-confirmed'
                      }
                    : null,
                wikidataCandidates: wikidata.candidates
            });
            continue;
        }

        const extension = mimeExtension(info.mime, fileName);
        const relativePath = `resources/images/benchcouncil-ai100-annual/portraits/${slugify(person.name.en)}${extension}`;
        const absolutePath = path.join(ROOT, relativePath);
        if (!fs.existsSync(absolutePath)) {
            fs.writeFileSync(absolutePath, await fetchBuffer(info.thumburl || info.url));
        }
        records.push({
            ...person,
            status: 'selected-wikimedia',
            selectedImage: {
                path: relativePath,
                sourceName: { en: 'Wikimedia Commons', zh: '维基共享资源' },
                sourceUrl: info.descriptionurl,
                imageUrl: info.thumburl || info.url,
                license: {
                    en: licenseName,
                    zh: licenseName
                },
                attribution: stripHtml(metadata.Artist && metadata.Artist.value),
                reliability: 'secondary-identity-with-affiliation-match',
                usageStatus: 'licensed-wikimedia',
                notes: {
                    en: `Exact name and research-description match in Wikidata; employer match: ${employerLabels.join(', ')}. Wikimedia file-page license metadata was present.`,
                    zh: `Wikidata 中姓名与研究者描述匹配，任职机构匹配：${employerLabels.join('、')}。维基共享资源文件页包含明确许可元数据。`
                },
                identityChecks: ['exact-name', 'research-description', 'event-institution-match'],
                sourceNotesRequired: true,
                wikidataEntity: candidate.entityUrl,
                commonsFile: fileName
            },
            wikidataCandidates: wikidata.candidates
        });
    }

    const summary = records.reduce((result, record) => {
        result[record.status] = (result[record.status] || 0) + 1;
        return result;
    }, {});
    writeJson(OUTPUT_PATH, {
        researchedAt: '2026-08-03',
        storylineId: STORYLINE_ID,
        policy: {
            en: 'No synthetic contributor profile cards. Select at most one verified person image per event. Keep text-only contributors when identity, source, license, or affiliation cannot be verified.',
            zh: '不生成合成人物资料卡。每个事件最多选择一张通过校验的人物图片；身份、来源、许可或机构无法确认时，仅保留文字人物信息。'
        },
        reliabilityRules: [
            'Exact contributor-name match is required.',
            'Wikidata candidates require an AI/computing research description and at least one event-institution match.',
            'Wikimedia candidates require a file page with explicit license metadata.',
            'Curated local candidates require an official institution profile, researcher-owned account/site, or explicit user-provided provenance.',
            'Legacy reference images and source-review-needed portraits are not selected.'
        ],
        summary,
        people: records
    });
    console.log(`Portrait research written to ${path.relative(ROOT, OUTPUT_PATH)}.`);
    console.log(JSON.stringify(summary));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
