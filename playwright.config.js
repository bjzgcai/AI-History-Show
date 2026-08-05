const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests/browser',
    outputDir: '.tmp/playwright-results',
    timeout: 45_000,
    expect: {
        timeout: 8_000
    },
    fullyParallel: false,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    reporter: process.env.CI ? 'line' : 'list',
    use: {
        baseURL: 'http://127.0.0.1:43117',
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
        video: 'off'
    },
    webServer: {
        command: 'node scripts/static-server.js --host 127.0.0.1 --port 43117',
        url: 'http://127.0.0.1:43117/index.html',
        reuseExistingServer: false,
        timeout: 120_000
    },
    projects: [
        {
            name: 'chromium-desktop',
            grep: /@desktop/,
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1440, height: 900 }
            }
        },
        {
            name: 'chromium-mobile',
            grep: /@mobile/,
            use: {
                ...devices['Pixel 7'],
                viewport: { width: 390, height: 500 }
            }
        }
    ]
});
