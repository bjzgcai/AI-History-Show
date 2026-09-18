const path = require('node:path');
const { defineConfig, devices } = require('@playwright/test');

const fixtureRoot = path.join(__dirname, '.tmp', 'admin-browser-fixture');

module.exports = defineConfig({
    testDir: './tests/browser',
    testMatch: 'admin-interactions.spec.js',
    outputDir: '.tmp/playwright-admin-results',
    timeout: 180_000,
    expect: {
        timeout: 10_000
    },
    fullyParallel: false,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    reporter: process.env.CI ? 'line' : 'list',
    use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://127.0.0.1:43118',
        viewport: { width: 1440, height: 900 },
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
        video: 'off'
    },
    webServer: {
        command: 'node tests/browser/admin-test-server.js',
        url: 'http://127.0.0.1:43118/admin',
        env: {
            ...process.env,
            AI_HISTORY_ADMIN_TEST_ROOT: fixtureRoot
        },
        reuseExistingServer: false,
        timeout: 120_000
    }
});
