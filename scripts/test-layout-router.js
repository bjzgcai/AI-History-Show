const assert = require('node:assert/strict');
const path = require('node:path');

const router = require(path.join(__dirname, '..', 'shared', 'layout-router.js'));

const cases = [
    {
        name: '1080p single screen stays single',
        input: { currentMode: router.SINGLE_MODE, width: 1920, height: 1080 },
        expected: router.SINGLE_MODE
    },
    {
        name: 'mobile portrait stays single',
        input: { currentMode: router.SINGLE_MODE, width: 430, height: 932, hasCoarsePointer: true },
        expected: router.SINGLE_MODE
    },
    {
        name: 'mobile landscape stays single',
        input: { currentMode: router.SINGLE_MODE, width: 932, height: 430, hasCoarsePointer: true },
        expected: router.SINGLE_MODE
    },
    {
        name: 'tablet landscape stays single',
        input: { currentMode: router.SINGLE_MODE, width: 1366, height: 1024, hasCoarsePointer: true },
        expected: router.SINGLE_MODE
    },
    {
        name: '3840x1080 panoramic viewport switches to dual',
        input: { currentMode: router.SINGLE_MODE, width: 3840, height: 1080 },
        expected: router.DUAL_MODE
    },
    {
        name: 'dual mode stays dual within hysteresis window',
        input: { currentMode: router.DUAL_MODE, width: 3200, height: 1080 },
        expected: router.DUAL_MODE
    },
    {
        name: 'dual mode falls back when viewport is too narrow',
        input: { currentMode: router.DUAL_MODE, width: 2800, height: 1080 },
        expected: router.SINGLE_MODE
    },
    {
        name: 'single override is always respected',
        input: { currentMode: router.DUAL_MODE, overrideMode: 'single', width: 5000, height: 1080 },
        expected: router.SINGLE_MODE
    },
    {
        name: 'dual override is always respected',
        input: { currentMode: router.SINGLE_MODE, overrideMode: 'dual', width: 1200, height: 900 },
        expected: router.DUAL_MODE
    }
];

for (const testCase of cases) {
    const actual = router.decideLayout(testCase.input);
    assert.equal(actual, testCase.expected, testCase.name);
    console.log(`PASS ${testCase.name}: ${actual}`);
}

const dualUrl = router.buildTargetUrl('http://localhost:8000/index.html?layout=dual#demo', router.DUAL_MODE);
assert.equal(dualUrl, 'http://localhost:8000/dual-screen.html?layout=dual#demo');
console.log(`PASS buildTargetUrl dual redirect: ${dualUrl}`);

const singleUrl = router.buildTargetUrl('http://localhost:8000/dual-screen.html?layout=single#demo', router.SINGLE_MODE);
assert.equal(singleUrl, 'http://localhost:8000/index.html?layout=single#demo');
console.log(`PASS buildTargetUrl single redirect: ${singleUrl}`);

assert.equal(router.getPathFileName('http://localhost:8000/dual-screen.html'), 'dual-screen.html', 'dual entry filename should be detected');
assert.equal(router.getPathFileName('/'), '', 'root path should not be treated as a fixed file');
console.log('PASS path filename detection');

assert.equal(
    router.isStableDualEntry({ currentMode: router.DUAL_MODE, pathname: '/dual-screen.html' }),
    true,
    'dual-screen.html should stay fixed in dual mode'
);
assert.equal(
    router.isStableDualEntry({ currentMode: router.SINGLE_MODE, pathname: '/dual-screen.html' }),
    false,
    'single mode should not be treated as fixed dual entry'
);
console.log('PASS stable dual entry detection');

{
    let replacedUrl = '';
    const fakeWindow = {
        innerWidth: 1920,
        innerHeight: 1080,
        location: {
            href: 'http://localhost:8000/dual-screen.html',
            pathname: '/dual-screen.html',
            search: '',
            replace(url) {
                replacedUrl = url;
            }
        },
        matchMedia() {
            return { matches: false };
        }
    };
    const fakeRoot = { dataset: { layoutMode: 'dual' }, clientWidth: 1920, clientHeight: 1080 };
    const actual = router.syncBrowserLayout(fakeWindow, fakeRoot);
    assert.equal(actual, router.DUAL_MODE, 'fixed dual entry should stay dual');
    assert.equal(replacedUrl, '', 'fixed dual entry should not redirect away');
    console.log('PASS fixed dual entry stays on dual-screen.html');
}

{
    let replacedUrl = '';
    const fakeWindow = {
        innerWidth: 1920,
        innerHeight: 1080,
        location: {
            href: 'http://localhost:8000/dual-screen.html?layout=single',
            pathname: '/dual-screen.html',
            search: '?layout=single',
            replace(url) {
                replacedUrl = url;
            }
        },
        matchMedia() {
            return { matches: false };
        }
    };
    const fakeRoot = { dataset: { layoutMode: 'dual' }, clientWidth: 1920, clientHeight: 1080 };
    const actual = router.syncBrowserLayout(fakeWindow, fakeRoot);
    assert.equal(actual, router.SINGLE_MODE, 'explicit single override should still work from dual entry');
    assert.equal(replacedUrl, 'http://localhost:8000/index.html?layout=single', 'dual entry override should redirect to single');
    console.log('PASS fixed dual entry still honors explicit override');
}

console.log('All layout-router checks passed.');
