'use strict';

const fs = require('node:fs');
const path = require('node:path');
const Ajv2020 = require('ajv/dist/2020');

const SCHEMA_FILES = [
    'shared.schema.json',
    'event.schema.json',
    'claim.schema.json',
    'source.schema.json',
    'asset.schema.json',
    'media-storage.schema.json',
    'quiz.schema.json',
    'variant.schema.json',
    'storyline.schema.json',
    'figure.schema.json'
];

function createArchiveSchemaValidator(root) {
    const schemasDir = path.join(root, 'archive', 'schemas');
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    ajv.addFormat('uri', {
        type: 'string',
        validate(value) {
            try {
                new globalThis.URL(value);
                return true;
            } catch (_) {
                return false;
            }
        }
    });
    for (const fileName of SCHEMA_FILES) {
        ajv.addSchema(JSON.parse(fs.readFileSync(path.join(schemasDir, fileName), 'utf8')));
    }

    return function validateSchema(schemaId, value) {
        const validate = ajv.getSchema(schemaId);
        if (!validate) throw new Error(`Archive schema is not registered: ${schemaId}`);
        const valid = validate(value);
        return {
            valid,
            errors: valid
                ? []
                : (validate.errors || []).map((error) => {
                      const location = error.instancePath || '/';
                      return `${location} ${error.message}`;
                  })
        };
    };
}

module.exports = {
    createArchiveSchemaValidator
};
