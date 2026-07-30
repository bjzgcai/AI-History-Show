const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const rootDir = path.join(__dirname, '..');
const entrySources = {
    'single-screen': fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8'),
    'dual-screen': fs.readFileSync(path.join(rootDir, 'dual-screen.html'), 'utf8')
};

function extractFunction(source, name) {
    const marker = `function ${name}(`;
    const start = source.indexOf(marker);
    assert.notEqual(start, -1, `${name} should exist`);

    const bodyStart = source.indexOf('{', start);
    let depth = 0;
    for (let index = bodyStart; index < source.length; index += 1) {
        if (source[index] === '{') depth += 1;
        if (source[index] !== '}') continue;
        depth -= 1;
        if (depth === 0) return source.slice(start, index + 1);
    }

    assert.fail(`${name} should have a complete function body`);
}

function loadTailFormatter(source) {
    const context = {};
    vm.createContext(context);
    vm.runInContext(
        `${extractFunction(source, 'escapeHtml')}\n${extractFunction(source, 'escapeHtmlWithCjkTail')}`,
        context
    );
    return context.escapeHtmlWithCjkTail;
}

const formatterCases = [
    {
        input: '美国新泽西州默里山贝尔实验室',
        expected: '美国新泽西州默里山贝尔实<span class="no-orphan-tail">验室</span>',
        message: 'address binds its final two Chinese characters'
    },
    {
        input: 'Pandemonium 感知架构',
        expected: 'Pandemonium 感知<span class="no-orphan-tail">架构</span>',
        message: 'title binds its final two Chinese characters'
    },
    {
        input: '奥利弗·塞尔弗里奇肖像。',
        expected: '奥利弗·塞尔弗里奇<span class="no-orphan-tail">肖像。</span>',
        message: 'portrait caption keeps trailing Chinese punctuation with the final two characters'
    },
    {
        input: 'Pandemonium 主要作者',
        expected: 'Pandemonium 主要<span class="no-orphan-tail">作者</span>',
        message: 'person role binds its final two Chinese characters'
    },
    {
        input: '研究<成果',
        expected: '研究&lt;<span class="no-orphan-tail">成果</span>',
        message: 'tail binding preserves HTML escaping'
    },
    {
        input: 'K-means',
        expected: 'K-means',
        message: 'non-Chinese endings remain unchanged'
    },
    {
        input: 'Figure 甲',
        expected: 'Figure 甲',
        message: 'a single trailing Chinese character is not wrapped by itself'
    }
];

for (const [entryName, source] of Object.entries(entrySources)) {
    const formatTail = loadTailFormatter(source);
    for (const testCase of formatterCases) {
        assert.equal(formatTail(testCase.input), testCase.expected, `${entryName}: ${testCase.message}`);
    }
    assert.match(
        source,
        /\.no-orphan-tail\s*\{[\s\S]*?white-space:\s*nowrap\s*;/,
        `${entryName}: the bound tail should be unbreakable`
    );
    console.log(`PASS ${entryName} final-two-Chinese-character formatting`);
}

const singleScreenBindings = [
    {
        pattern: /refs\.summaryTitle\.innerHTML\s*=\s*escapeHtmlWithCjkTail\(vm\.title \|\| ''\)/,
        message: 'summary title'
    },
    {
        pattern: /refs\.summaryLocation\.innerHTML\s*=\s*escapeHtmlWithCjkTail\(locationText\)/,
        message: 'summary address'
    },
    {
        pattern: /ui-detail-place[\s\S]*?escapeHtmlWithCjkTail\(locationText\)/,
        message: 'detail address'
    },
    {
        pattern: /ui-detail-title[\s\S]*?escapeHtmlWithCjkTail\(title\)/,
        message: 'detail title'
    },
    {
        pattern: /captionTitle\.innerHTML\s*=\s*escapeHtmlWithCjkTail\(imageCaptionTitle\)/,
        message: 'dynamic portrait title'
    },
    {
        pattern: /captionDetail\.innerHTML\s*=\s*escapeHtmlWithCjkTail\(imageCaptionDetail\)/,
        message: 'dynamic portrait description'
    },
    {
        pattern: /ui-detail-caption-title[\s\S]*?escapeHtmlWithCjkTail\(imageCaptionTitle\)/,
        message: 'initial portrait title'
    },
    {
        pattern: /ui-detail-caption-detail[\s\S]*?escapeHtmlWithCjkTail\(imageCaptionDetail\)/,
        message: 'initial portrait description'
    },
    {
        pattern: /ui-avatar-name[\s\S]*?escapeHtmlWithCjkTail\(figure\.name/,
        message: 'person name'
    },
    {
        pattern: /ui-avatar-role[\s\S]*?escapeHtmlWithCjkTail\(figure\.role\)/,
        message: 'person role'
    }
];

const dualScreenBindings = [
    {
        pattern: /refs\.summaryTitle\.innerHTML\s*=\s*escapeHtmlWithCjkTail\(vm\.title \|\| ''\)/,
        message: 'summary title'
    },
    {
        pattern:
            /function buildLocationHtml\(location\)[\s\S]*?escapeHtmlWithCjkTail\(location[\s\S]*?escapeHtmlWithCjkTail\(location/,
        message: 'address fields'
    },
    {
        pattern: /figure-name[\s\S]*?escapeHtmlWithCjkTail\(figure\.name/,
        message: 'person name'
    },
    {
        pattern: /figure-role[\s\S]*?escapeHtmlWithCjkTail\(figure\.role/,
        message: 'person role'
    },
    {
        pattern: /refs\.archiveCaption\.innerHTML\s*=\s*escapeHtmlWithCjkTail\(activeMeta\.name\)/,
        message: 'portrait title'
    },
    {
        pattern: /refs\.archiveSubcaption\.innerHTML\s*=\s*escapeHtmlWithCjkTail\(activeMeta\.role\)/,
        message: 'portrait description'
    }
];

for (const binding of singleScreenBindings) {
    assert.match(entrySources['single-screen'], binding.pattern, `single-screen: ${binding.message} uses tail binding`);
}

for (const binding of dualScreenBindings) {
    assert.match(entrySources['dual-screen'], binding.pattern, `dual-screen: ${binding.message} uses tail binding`);
}

console.log('PASS address, title, portrait metadata, and person metadata bindings');
