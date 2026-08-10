'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');

function candidateIdFor(revisionId, audioPath) {
    const digest = crypto.createHash('sha256').update(`${revisionId}\0${audioPath}`).digest('hex');
    return `audio-${digest.slice(0, 24)}`;
}

function loadReviewCatalog(filePath) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const candidates = new Map();
    const audioFiles = new Map();

    for (const event of data.events || []) {
        for (const [locale, modes] of Object.entries(event.variants || {})) {
            for (const [mode, baseVariant] of Object.entries(modes || {})) {
                const options = baseVariant.revisionOptions?.length ? baseVariant.revisionOptions : [baseVariant];
                for (const option of options) {
                    const audioPath = String(option.audio?.path || '').trim();
                    if (!audioPath) continue;
                    const revisionId = String(option.revision?.id || option.revisionId || 'archive').trim();
                    const candidateId = candidateIdFor(revisionId, audioPath);
                    option.candidateId = candidateId;
                    option.audio.reviewUrl = `./api/audio/${candidateId}`;
                    audioFiles.set(candidateId, audioPath);

                    const context = {
                        scopeId: event.scopeId,
                        sequenceIndex: event.sequenceIndex,
                        eventId: event.eventId,
                        title: event.title,
                        locale,
                        mode,
                        revisionKind: option.revision?.kind || 'default'
                    };
                    const existing = candidates.get(candidateId);
                    if (existing) {
                        existing.contexts.push(context);
                        continue;
                    }
                    candidates.set(candidateId, {
                        candidateId,
                        revisionId,
                        audioPath,
                        locale,
                        mode,
                        eventId: event.eventId,
                        scopeId: event.scopeId,
                        sequenceIndex: event.sequenceIndex,
                        title: event.title,
                        contexts: [context]
                    });
                }
                if (!baseVariant.revisionOptions?.length) {
                    baseVariant.candidateId = options[0]?.candidateId;
                    if (baseVariant.audio && options[0]?.audio?.reviewUrl) {
                        baseVariant.audio.reviewUrl = options[0].audio.reviewUrl;
                    }
                }
            }
        }
    }

    for (const preview of data.release?.previews || []) {
        const audioPath = String(preview.path || '').trim();
        if (!audioPath) continue;
        const audioId = candidateIdFor('release-preview', audioPath);
        preview.reviewUrl = `./api/audio/${audioId}`;
        audioFiles.set(audioId, audioPath);
    }

    return { data, candidates, audioFiles };
}

module.exports = { candidateIdFor, loadReviewCatalog };
