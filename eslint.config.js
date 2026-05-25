const js = require('@eslint/js');

const commonGlobals = {
    Buffer: 'readonly',
    CustomEvent: 'readonly',
    __dirname: 'readonly',
    clearTimeout: 'readonly',
    console: 'readonly',
    document: 'readonly',
    exports: 'readonly',
    fetch: 'readonly',
    globalThis: 'readonly',
    localStorage: 'readonly',
    module: 'readonly',
    navigator: 'readonly',
    process: 'readonly',
    require: 'readonly',
    setTimeout: 'readonly',
    window: 'readonly'
};

module.exports = [
    {
        ignores: [
            'node_modules/**',
            'manage/.backups/**',
            'resources/images/**',
            'resources/videos/**',
            'milestones-data*.js',
            'index.html',
            'dual-screen.html',
            'manage/admin.html',
            'manage/events.js',
            'manage/figure-avatars.js',
            'resources/quote-candidates.js',
            'resources/research-candidates.js'
        ]
    },
    js.configs.recommended,
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'script',
            globals: commonGlobals
        },
        rules: {
            'no-console': 'off',
            'no-empty': ['error', { allowEmptyCatch: true }],
            'no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    caughtErrors: 'none',
                    varsIgnorePattern: '^_'
                }
            ],
            'no-useless-escape': 'off'
        }
    },
    {
        files: ['shared/layout-router.js'],
        languageOptions: {
            globals: {
                URL: 'readonly',
                URLSearchParams: 'readonly'
            }
        }
    }
];
