'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { candidateIdFor } = require('./candidates');

const DEFAULT_CONFIG_PATH = path.join('audio', 'pronunciation', 'qualification-cases.json');
const DEFAULT_GLOSSARY_PATH = path.join('audio', 'pronunciation', 'glossary.json');
const DEFAULT_MANIFEST_PATH = path.join('.tmp', 'pronunciation-qualification', 'manifest.json');
const PRONUNCIATION_AUDIO_PREFIX = '.tmp/pronunciation-qualification';

function readJson(filePath, fallback = null) {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function toPosix(value) {
    return String(value || '').replaceAll(path.sep, '/');
}

function expectedSampleId(groupId, contextId, kind, repeat) {
    return kind === 'term'
        ? `${groupId}-${contextId}-term-repeat-${repeat}`
        : `${groupId}-${contextId}-repeat-${repeat}`;
}

function sampleOutputPath(groupId, contextId, kind, repeat) {
    const suffix = kind === 'term' ? `-term-repeat-${repeat}` : `-repeat-${repeat}`;
    return `${PRONUNCIATION_AUDIO_PREFIX}/${groupId}/${contextId}${suffix}.mp3`;
}

function sampleInputPath(groupId, contextId, kind, repeat) {
    const suffix = kind === 'term' ? `-term-repeat-${repeat}` : `-repeat-${repeat}`;
    return `${PRONUNCIATION_AUDIO_PREFIX}/${groupId}/${contextId}${suffix}.txt`;
}

function loadPronunciationCatalog(projectRoot, options = {}) {
    const configPath = path.resolve(projectRoot, options.configPath || DEFAULT_CONFIG_PATH);
    const glossaryPath = path.resolve(projectRoot, options.glossaryPath || DEFAULT_GLOSSARY_PATH);
    const manifestPath = path.resolve(projectRoot, options.manifestPath || DEFAULT_MANIFEST_PATH);
    const config = readJson(configPath);
    const glossary = readJson(glossaryPath);
    const manifest = readJson(manifestPath, { samples: [] });

    if (!config || !glossary) {
        return {
            data: {
                schemaVersion: 1,
                groups: [],
                stats: { groups: 0, glossaryTerms: 0, qualifiedTerms: 0, samples: 0, availableSamples: 0 }
            },
            candidates: new Map(),
            audioFiles: new Map()
        };
    }

    const glossaryById = new Map((glossary.entries || []).map((entry) => [entry.id, entry]));
    const manifestById = new Map((manifest.samples || []).map((sample) => [sample.id, sample]));
    const candidates = new Map();
    const audioFiles = new Map();
    const qualificationGroups = [];
    let sequenceIndex = 0;

    for (const group of config.groups || []) {
        const term = glossaryById.get(group.termId);
        if (!term) continue;
        const contexts = [];
        for (const [contextIndex, context] of (group.contexts || []).entries()) {
            const sourcePath = path.resolve(projectRoot, context.turnPath);
            const source = readJson(sourcePath);
            const turn = source?.turns?.[context.turnIndex - 1];
            if (!source || !turn) continue;
            const samples = [];

            const kinds = contextIndex === 0 ? ['term', 'context'] : ['context'];
            for (const kind of kinds) {
                for (let repeat = 1; repeat <= context.repeatCount; repeat += 1) {
                    const sampleId = expectedSampleId(group.id, context.id, kind, repeat);
                    const manifestSample = manifestById.get(sampleId);
                    const audioPath = toPosix(
                        manifestSample?.outputPath || sampleOutputPath(group.id, context.id, kind, repeat)
                    );
                    const audioFilePath = path.resolve(projectRoot, audioPath);
                    const audioAvailable = fs.existsSync(audioFilePath) && fs.statSync(audioFilePath).isFile();
                    const speechText = kind === 'term' ? group.speechForm : manifestSample?.speechText || turn.text;
                    const candidateId = candidateIdFor(`pronunciation:${sampleId}`, audioPath);
                    const sample = {
                        id: sampleId,
                        candidateId,
                        groupId: group.id,
                        qualificationId: group.qualificationId,
                        kind,
                        kindLabel: kind === 'term' ? '只读专用词' : '结合原句',
                        repeat,
                        termId: term.id,
                        term: term.term,
                        speechForm: group.speechForm,
                        targetReading: term.reading?.spoken || '',
                        locale: group.locale,
                        voice: manifestSample?.voice || '',
                        instructionSha256: manifestSample?.instructionSha256 || '',
                        role: turn.role,
                        sourcePath: context.turnPath,
                        turnIndex: context.turnIndex,
                        eventId: source.eventId || context.id,
                        sourceText: turn.text,
                        speechText,
                        audioPath,
                        audioAvailable,
                        audioUrl: audioAvailable ? `./api/audio/${candidateId}` : '',
                        seed: manifestSample?.seed ?? null
                    };
                    samples.push(sample);
                    candidates.set(candidateId, {
                        candidateId,
                        revisionId: `pronunciation:${group.qualificationId}`,
                        audioPath,
                        locale: group.locale,
                        mode: `pronunciation-${kind}`,
                        eventId: sample.eventId,
                        scopeId: 'pronunciation',
                        sequenceIndex,
                        title: { en: term.term, zh: term.term },
                        contexts: [
                            {
                                scopeId: 'pronunciation',
                                sequenceIndex,
                                eventId: sample.eventId,
                                title: { en: term.term, zh: term.term },
                                locale: group.locale,
                                mode: `pronunciation-${kind}`,
                                pronunciationGroupId: group.id,
                                pronunciationSampleId: sample.id
                            }
                        ]
                    });
                    if (audioAvailable) audioFiles.set(candidateId, audioPath);
                    sequenceIndex += 1;
                }
            }

            contexts.push({
                id: context.id,
                turnPath: context.turnPath,
                turnIndex: context.turnIndex,
                role: turn.role,
                sourceText: turn.text,
                speechText: samples.find((sample) => sample.kind === 'context')?.speechText || turn.text,
                samples
            });
        }

        qualificationGroups.push({
            id: group.id,
            qualificationId: group.qualificationId,
            termId: term.id,
            term: term.term,
            category: term.category,
            verification: term.verification,
            targetReading: term.reading?.spoken || '',
            locale: group.locale,
            speechForm: group.speechForm,
            reviewStatus: group.reviewStatus,
            contexts
        });
    }

    const groupsByTermId = new Map();
    for (const qualification of qualificationGroups) {
        if (!groupsByTermId.has(qualification.termId)) {
            groupsByTermId.set(qualification.termId, {
                id: qualification.termId,
                termId: qualification.termId,
                term: qualification.term,
                category: qualification.category,
                verification: qualification.verification,
                targetReading: qualification.targetReading,
                qualifications: []
            });
        }
        groupsByTermId.get(qualification.termId).qualifications.push(qualification);
    }
    const groups = [...groupsByTermId.values()];
    const samples = qualificationGroups.flatMap((group) => group.contexts.flatMap((context) => context.samples));
    return {
        data: {
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            groups,
            stats: {
                groups: groups.length,
                qualificationGroups: qualificationGroups.length,
                glossaryTerms: glossary.entries.length,
                qualifiedTerms: groups.length,
                samples: samples.length,
                availableSamples: samples.filter((sample) => sample.audioAvailable).length
            }
        },
        candidates,
        audioFiles
    };
}

module.exports = {
    DEFAULT_CONFIG_PATH,
    DEFAULT_GLOSSARY_PATH,
    DEFAULT_MANIFEST_PATH,
    PRONUNCIATION_AUDIO_PREFIX,
    loadPronunciationCatalog,
    sampleInputPath,
    sampleOutputPath
};
