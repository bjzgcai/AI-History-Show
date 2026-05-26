const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const assistance = require(path.join(__dirname, '..', 'resources', 'content-assistance.js'));
const evalSet = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'resources', 'evaluations', 'content-assistance-eval.json'), 'utf8')
);

const imageCases = evalSet.cases.filter((testCase) => testCase.task === 'image_metadata');

for (const testCase of imageCases) {
    const actual = assistance.buildImageMetadataSuggestion(testCase.eventKey, testCase.event, testCase.imagePath);

    assert.equal(actual.schemaVersion, assistance.IMAGE_METADATA_SCHEMA_VERSION, `${testCase.id} schema version`);
    assert.equal(actual.generatedBy, assistance.RULE_BASED_GENERATOR_ID, `${testCase.id} generator id`);
    assert.equal(actual.status, 'suggested', `${testCase.id} status`);
    assert.equal(
        assistance.getLocalizedText(actual.caption, 'zh'),
        testCase.expected.caption,
        `${testCase.id} caption zh`
    );
    assert.ok(assistance.getLocalizedText(actual.caption, 'en'), `${testCase.id} caption en`);
    assert.equal(
        assistance.getLocalizedText(actual.subcaption, 'zh'),
        testCase.expected.subcaption,
        `${testCase.id} subcaption zh`
    );
    assert.ok(assistance.getLocalizedText(actual.subcaption, 'en'), `${testCase.id} subcaption en`);
    assert.equal(actual.trace.ruleId, testCase.expected.traceRuleId, `${testCase.id} trace rule`);
    assert.ok(
        actual.trace.sources.some((source) => source.type === 'event' && source.field === 'key'),
        `${testCase.id} traces event key`
    );
    assert.ok(
        actual.trace.sources.some((source) => source.type === 'image' && source.field === 'path'),
        `${testCase.id} traces image path`
    );

    console.log(
        `PASS ${testCase.id}: ${assistance.getLocalizedText(actual.caption)} / ${assistance.getLocalizedText(actual.subcaption)}`
    );
}

{
    const suggestion = assistance.buildImageMetadataSuggestion(
        '2017-transformer',
        { year: 2017, title: 'Transformer' },
        'resources/images/2017-transformer/architecture/example.png'
    );
    const approved = assistance.approveImageMetadataSuggestion(suggestion, 'test-reviewer');
    assert.deepEqual(approved.caption, suggestion.caption, 'approved caption is copied');
    assert.deepEqual(approved.subcaption, suggestion.subcaption, 'approved subcaption is copied');
    assert.equal(approved.approval.status, 'human-approved', 'approval status is explicit');
    assert.equal(approved.approval.approvedBy, 'test-reviewer', 'approver is recorded');
    assert.equal(
        approved.generationTrace.generatedBy,
        assistance.RULE_BASED_GENERATOR_ID,
        'generation trace is retained'
    );
    console.log('PASS approval preserves generation trace');
}

console.log('All content-assistance checks passed.');
