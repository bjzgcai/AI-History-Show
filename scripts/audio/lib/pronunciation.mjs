import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './audio-revision.mjs';

export const PRONUNCIATION_GLOSSARY_PATH = path.join(ROOT, 'audio/pronunciation/glossary.json');

function sha256(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}

export function pronunciationInstructionSha256(instruction) {
    return sha256(String(instruction || ''));
}

function isWordCharacter(value) {
    return /[A-Za-z0-9]/u.test(value || '');
}

function hasExactBoundary(text, start, alias) {
    const end = start + alias.length;
    return !isWordCharacter(text[start - 1]) && !isWordCharacter(text[end]);
}

function isExcluded(entry, context) {
    return (entry.ttsExclusions || []).some(
        (exclusion) =>
            exclusion.eventId === context.eventId &&
            exclusion.locale === context.locale &&
            exclusion.turnIndex === context.turnIndex
    );
}

function matchingQualification(entry, context) {
    const matches = (entry.ttsQualifications || []).filter(
        (validation) =>
            validation.status === 'human-reviewed-pass' &&
            validation.method === 'speech-replacement' &&
            validation.provider === context.provider &&
            validation.model === context.model &&
            validation.locale === context.locale &&
            validation.voice === context.voice &&
            validation.instructionSha256 === context.instructionSha256
    );
    if (matches.length > 1) {
        throw new Error(`${entry.id}: multiple active pronunciation qualifications match the same generation context`);
    }
    return matches[0];
}

function compilationForTurn(text, entries, context) {
    const aliases = [];
    for (const entry of entries) {
        if (!(entry.ttsQualifications || []).some((validation) => validation.method === 'speech-replacement')) continue;
        for (const alias of entry.aliases) {
            aliases.push({ alias, entry });
        }
    }
    aliases.sort((left, right) => right.alias.length - left.alias.length || left.alias.localeCompare(right.alias));

    const replacements = [];
    const unqualified = [];
    const exclusions = [];
    for (let start = 0; start < text.length; start += 1) {
        const match = aliases.find(
            ({ alias }) => text.startsWith(alias, start) && hasExactBoundary(text, start, alias)
        );
        if (!match) continue;
        const occurrence = {
            start,
            end: start + match.alias.length,
            termId: match.entry.id,
            term: match.entry.term,
            alias: match.alias,
            context: {
                provider: context.provider,
                model: context.model,
                locale: context.locale,
                voice: context.voice,
                instructionSha256: context.instructionSha256
            }
        };
        const exclusion = isExcluded(match.entry, context)
            ? match.entry.ttsExclusions.find(
                  (item) =>
                      item.eventId === context.eventId &&
                      item.locale === context.locale &&
                      item.turnIndex === context.turnIndex
              )
            : null;
        if (exclusion) {
            exclusions.push({ ...occurrence, reason: exclusion.reason });
        } else {
            const qualification = matchingQualification(match.entry, context);
            if (qualification) {
                replacements.push({
                    ...occurrence,
                    from: match.alias,
                    to: qualification.speechForm,
                    qualification: {
                        id: qualification.qualificationId,
                        reviewedAt: qualification.reviewedAt,
                        provider: qualification.provider,
                        model: qualification.model,
                        locale: qualification.locale,
                        voice: qualification.voice,
                        instructionSha256: qualification.instructionSha256,
                        method: qualification.method,
                        sampleIds: qualification.sampleIds || []
                    }
                });
            } else {
                unqualified.push({
                    ...occurrence,
                    reason: 'no-qualified-speech-form-for-generation-context',
                    availableQualificationIds: (match.entry.ttsQualifications || [])
                        .filter((validation) => validation.status === 'human-reviewed-pass')
                        .map((validation) => validation.qualificationId)
                });
            }
        }
        start += match.alias.length - 1;
    }
    return { replacements, unqualified, exclusions };
}

function applyReplacements(text, replacements) {
    let cursor = 0;
    let output = '';
    for (const replacement of replacements) {
        output += text.slice(cursor, replacement.start);
        output += replacement.to;
        cursor = replacement.end;
    }
    return output + text.slice(cursor);
}

export function loadPronunciationGlossary(filePath = PRONUNCIATION_GLOSSARY_PATH) {
    const source = fs.readFileSync(filePath, 'utf8');
    return { path: filePath, source, hash: sha256(source), glossary: JSON.parse(source) };
}

export function compileSpeechTurns({
    turns,
    eventId,
    locale,
    provider,
    model,
    voiceForRole,
    instructionForRole,
    glossaryBundle = loadPronunciationGlossary()
}) {
    const compiledTurns = [];
    const replacements = [];
    const unqualified = [];
    const exclusions = [];
    for (const [index, turn] of turns.entries()) {
        const voice = voiceForRole(turn.role);
        const instructionSha256 = pronunciationInstructionSha256(instructionForRole(turn.role));
        const turnCompilation = compilationForTurn(turn.text, glossaryBundle.glossary.entries, {
            eventId,
            locale,
            turnIndex: index + 1,
            provider,
            model,
            voice,
            instructionSha256
        });
        const withTurn = (item) => ({ turnIndex: index + 1, role: turn.role, ...item });
        const turnReplacements = turnCompilation.replacements.map(withTurn);
        compiledTurns.push({ ...turn, text: applyReplacements(turn.text, turnReplacements) });
        replacements.push(...turnReplacements);
        unqualified.push(...turnCompilation.unqualified.map(withTurn));
        exclusions.push(...turnCompilation.exclusions.map(withTurn));
    }
    return {
        schemaVersion: 2,
        turns: compiledTurns,
        replacements,
        unqualified,
        exclusions,
        glossaryPath: path.relative(ROOT, glossaryBundle.path).split(path.sep).join('/'),
        glossarySha256: glossaryBundle.hash
    };
}
