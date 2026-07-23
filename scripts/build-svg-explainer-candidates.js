#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { buildReviewHtml } = require('./audit-svg-explainers.js');

const ROOT = path.resolve(__dirname, '..');
const REVIEW_DIR = path.join(ROOT, 'reports', 'svg-explainer-review');
const CANDIDATE_DIR = path.join(REVIEW_DIR, 'candidates');

function read(relativePath) {
    const snapshotPath = path.join(REVIEW_DIR, 'originals', path.basename(relativePath));
    return fs.readFileSync(fs.existsSync(snapshotPath) ? snapshotPath : path.join(ROOT, relativePath), 'utf8');
}

function replaceChecked(source, search, replacement, label) {
    if (!source.includes(search)) throw new Error(`Candidate transform did not match ${label}`);
    return source.replace(search, replacement);
}

function edit(relativePath, changes) {
    let source = read(relativePath);
    for (const [search, replacement] of changes) {
        source = replaceChecked(source, search, replacement, relativePath);
    }
    return source;
}

function svgShell({ title, desc, body, width = 720, height = 420, dark = true }) {
    const background = dark ? '#0f172a' : '#f8fafc';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${title}</title>
  <desc id="desc">${desc}</desc>
  <rect width="${width}" height="${height}" rx="24" fill="${background}"/>
${body}
</svg>
`;
}

function vggCandidate() {
    const configs = [
        { name: 'VGG-11', layers: 11, x: 126, color: '#0f766e' },
        { name: 'VGG-13', layers: 13, x: 344, color: '#2563eb' },
        { name: 'VGG-16', layers: 16, x: 562, color: '#0f766e' },
        { name: 'VGG-19', layers: 19, x: 780, color: '#2563eb' }
    ];
    const bars = configs
        .map(({ name, layers, x, color }) => {
            const barHeight = layers * 19;
            const y = 552 - barHeight;
            return `  <rect x="${x}" y="${y}" width="138" height="${barHeight}" rx="16" fill="${color}"/>
  <text x="${x + 69}" y="${y - 16}" text-anchor="middle" fill="#f8fafc" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="800">${layers} weight layers</text>
  <text x="${x + 69}" y="592" text-anchor="middle" fill="#cbd5e1" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700">${name}</text>`;
        })
        .join('\n');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720" role="img" aria-labelledby="title desc">
  <title id="title">VGG configuration depth comparison</title>
  <desc id="desc">VGG-11, VGG-13, VGG-16 and VGG-19 compared by weight-layer count.</desc>
  <rect width="1200" height="720" fill="#101827"/>
  <rect x="54" y="54" width="1092" height="612" rx="28" fill="#0f172a" stroke="#334155" stroke-width="4"/>
  <text x="90" y="112" fill="#f59e0b" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="800">VGG depth configurations</text>
  <text x="90" y="150" fill="#cbd5e1" font-family="Arial, Helvetica, sans-serif" font-size="23" font-weight="700">按权重层数量比较 VGG-11 / 13 / 16 / 19</text>
  <path d="M100 552 H1098" stroke="#475569" stroke-width="3"/>
${bars}
  <text x="90" y="638" fill="#94a3b8" font-family="Arial, Helvetica, sans-serif" font-size="18">Counts follow the configurations reported in Simonyan and Zisserman; bar heights are proportional to weight-layer count.</text>
</svg>
`;
}

function complexityCandidate() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="520" viewBox="0 0 900 520" role="img" aria-labelledby="title desc">
  <title id="title">NP-completeness reduction map</title>
  <desc id="desc">Examples of decision problems in NP reducing to SAT in polynomial time.</desc>
  <defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#f68900"/></marker></defs>
  <rect width="900" height="520" fill="#151515"/>
  <rect x="52" y="54" width="796" height="412" rx="18" fill="#202020" stroke="#5a3a12" stroke-width="2"/>
  <text x="80" y="104" fill="#f68900" font-family="Arial, sans-serif" font-size="26" font-weight="700">NP-COMPLETENESS</text>
  <text x="80" y="140" fill="#f4efe5" font-family="Arial, sans-serif" font-size="18">Cook-Levin: every decision problem in NP has a polynomial-time reduction to SAT.</text>
  <circle cx="250" cy="302" r="88" fill="#2b2b2b" stroke="#f68900" stroke-width="3"/>
  <text x="250" y="294" fill="#fff" text-anchor="middle" font-family="Arial" font-size="30" font-weight="700">SAT</text>
  <text x="250" y="326" fill="#d8d1c4" text-anchor="middle" font-family="Arial" font-size="14">first NP-complete problem</text>
  <g fill="#303030" stroke="#666"><rect x="572" y="174" width="178" height="54" rx="10"/><rect x="572" y="276" width="178" height="54" rx="10"/><rect x="572" y="378" width="178" height="54" rx="10"/></g>
  <g fill="#f4efe5" font-family="Arial" font-size="17" text-anchor="middle"><text x="661" y="208">Clique</text><text x="661" y="310">Hamiltonian cycle</text><text x="661" y="412">3-coloring</text></g>
  <g stroke="#f68900" stroke-width="4" fill="none" marker-end="url(#arrow)"><path d="M566 202 C450 212 376 242 328 278"/><path d="M566 304 H342"/><path d="M566 404 C452 390 374 356 326 330"/></g>
  <text x="430" y="262" fill="#f4efe5" font-family="Arial" font-size="17" font-weight="700">polynomial-time reductions</text>
  <rect x="76" y="412" width="390" height="40" rx="8" fill="#2a1f12" stroke="#6f4308"/>
  <text x="271" y="438" fill="#f4efe5" text-anchor="middle" font-family="Arial" font-size="13">Efficient SAT solver => efficient solver for every NP problem</text>
</svg>
`;
}

function resolutionCandidate() {
    return svgShell({
        title: 'Resolution refutation with explicit premises',
        desc: 'Two resolution steps derive the empty clause from explicit contradictory clauses.',
        width: 720,
        height: 420,
        body: `  <text x="36" y="52" fill="#f59e0b" font-family="Arial" font-size="26" font-weight="800">Resolution: explicit refutation chain</text>
  <g font-family="Arial" font-size="19" text-anchor="middle">
    <rect x="52" y="92" width="170" height="56" rx="12" fill="#1f2937" stroke="#60a5fa"/><text x="137" y="127" fill="#e5e7eb">A or B</text>
    <rect x="52" y="176" width="170" height="56" rx="12" fill="#1f2937" stroke="#60a5fa"/><text x="137" y="211" fill="#e5e7eb">not B</text>
    <rect x="294" y="134" width="150" height="62" rx="12" fill="#3f2d16" stroke="#f59e0b"/><text x="369" y="172" fill="#fde68a">A</text>
    <rect x="294" y="248" width="150" height="56" rx="12" fill="#1f2937" stroke="#60a5fa"/><text x="369" y="283" fill="#e5e7eb">not A</text>
    <rect x="518" y="190" width="150" height="66" rx="14" fill="#3f1212" stroke="#ef4444"/><text x="593" y="231" fill="#fee2e2">empty clause</text>
  </g>
  <g stroke="#f8fafc" stroke-width="4" fill="none"><path d="M222 120 C254 120 260 153 294 153"/><path d="M222 204 C254 204 260 177 294 177"/><path d="M444 165 C482 165 482 207 518 207"/><path d="M444 276 C482 276 482 239 518 239"/></g>
  <text x="360" y="362" fill="#94a3b8" text-anchor="middle" font-family="Arial" font-size="15">Resolve complementary literals at each step.</text>
  <text x="360" y="386" fill="#94a3b8" text-anchor="middle" font-family="Arial" font-size="15">Contradiction is reached only after both A and not A are available.</text>`
    });
}

function frameCandidate() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" role="img" aria-labelledby="title desc">
  <title id="title">Frame slots, defaults and exceptions</title>
  <desc id="desc">A generic frame example showing inherited defaults and an explicit exception.</desc>
  <rect width="960" height="540" fill="#10131d"/><rect x="36" y="36" width="888" height="468" rx="18" fill="#151a26" stroke="#2f3a55" stroke-width="3"/>
  <text x="64" y="82" fill="#f68900" font-family="Arial" font-size="28" font-weight="800">Frame slots, defaults and exceptions</text>
  <rect x="92" y="128" width="326" height="292" rx="20" fill="#111827" stroke="#f59e0b" stroke-width="4"/>
  <text x="122" y="176" fill="#fde68a" font-family="Arial" font-size="26" font-weight="700">BIRD FRAME</text>
  <g font-family="Arial" font-size="19" fill="#e5e7eb"><text x="122" y="224">parts: wings, beak</text><text x="122" y="268">covering: feathers</text><text x="122" y="312">can-fly: default yes</text><text x="122" y="356">legs: default 2</text></g>
  <path d="M418 272 H548" stroke="#93c5fd" stroke-width="6"/>
  <rect x="548" y="166" width="300" height="212" rx="20" fill="#172554" stroke="#93c5fd" stroke-width="4"/>
  <text x="578" y="214" fill="#bfdbfe" font-family="Arial" font-size="25" font-weight="700">PENGUIN FRAME</text>
  <g font-family="Arial" font-size="19" fill="#e5e7eb"><text x="578" y="260">inherits: BIRD</text><text x="578" y="304">can-fly: no (override)</text><text x="578" y="348">swims: yes</text></g>
  <text x="64" y="472" fill="#94a3b8" font-family="Arial" font-size="17">Conceptual redraw of frame inheritance: defaults flow to subframes unless an explicit value overrides them.</text>
</svg>
`;
}

function lstmCandidate() {
    return svgShell({
        title: 'Original 1997 LSTM memory cell',
        desc: 'The original LSTM cell used input and output gates around a persistent cell state; the forget gate was introduced later.',
        width: 720,
        height: 420,
        body: `  <text x="38" y="56" fill="#f59e0b" font-family="Arial" font-size="28" font-weight="700">Original 1997 LSTM cell</text>
  <text x="38" y="86" fill="#cbd5e1" font-family="Arial" font-size="16">Input gate + constant error carousel + output gate</text>
  <path d="M96 226 H624" stroke="#475569" stroke-width="14" stroke-linecap="round"/>
  <rect x="206" y="142" width="310" height="166" rx="22" fill="#111827" stroke="#93c5fd" stroke-width="4"/>
  <circle cx="266" cy="226" r="42" fill="#2563eb"/><text x="266" y="220" fill="#dbeafe" text-anchor="middle" font-family="Arial" font-size="16">input</text><text x="266" y="242" fill="#dbeafe" text-anchor="middle" font-family="Arial" font-size="16">gate</text>
  <rect x="330" y="188" width="92" height="76" rx="14" fill="#064e3b" stroke="#6ee7b7" stroke-width="3"/><text x="376" y="220" fill="#d1fae5" text-anchor="middle" font-family="Arial" font-size="15">cell</text><text x="376" y="242" fill="#d1fae5" text-anchor="middle" font-family="Arial" font-size="15">state</text>
  <circle cx="466" cy="226" r="42" fill="#dc2626"/><text x="466" y="220" fill="#fee2e2" text-anchor="middle" font-family="Arial" font-size="16">output</text><text x="466" y="242" fill="#fee2e2" text-anchor="middle" font-family="Arial" font-size="16">gate</text>
  <path d="M334 188 C334 118 418 118 418 188" fill="none" stroke="#f8fafc" stroke-width="5" marker-end="url(#arrow)"/>
  <defs><marker id="arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#f8fafc"/></marker></defs>
  <text x="360" y="342" fill="#94a3b8" text-anchor="middle" font-family="Arial" font-size="17">No forget gate in the 1997 architecture; that gate was introduced in later LSTM variants.</text>`
    });
}

function nmfCandidate() {
    return svgShell({
        title: 'Nonnegative matrix factorization',
        desc: 'A nonnegative data matrix V is approximated by the product of a nonnegative basis matrix W and coefficient matrix H.',
        width: 760,
        height: 420,
        body: `  <text x="38" y="56" fill="#f59e0b" font-family="Arial" font-size="27" font-weight="700">Nonnegative matrix factorization</text>
  <text x="38" y="86" fill="#cbd5e1" font-family="Arial" font-size="16">V ≈ W × H, with every matrix entry constrained to be nonnegative</text>
  <g transform="translate(66 130)"><rect width="168" height="190" rx="14" fill="#111827" stroke="#60a5fa" stroke-width="4"/><g fill="#60a5fa"><rect x="24" y="34" width="28" height="118"/><rect x="70" y="72" width="28" height="80"/><rect x="116" y="48" width="28" height="104"/></g><text x="84" y="178" text-anchor="middle" fill="#e2e8f0" font-family="Arial" font-size="18">data V</text></g>
  <text x="266" y="236" fill="#f8fafc" font-family="Arial" font-size="38">≈</text>
  <g transform="translate(326 130)"><rect width="126" height="190" rx="14" fill="#111827" stroke="#22c55e" stroke-width="4"/><g fill="#22c55e"><rect x="24" y="30" width="28" height="122"/><rect x="72" y="70" width="28" height="82"/></g><text x="63" y="178" text-anchor="middle" fill="#e2e8f0" font-family="Arial" font-size="18">basis W</text></g>
  <text x="480" y="236" fill="#f8fafc" font-family="Arial" font-size="38">×</text>
  <g transform="translate(540 164)"><rect width="158" height="122" rx="14" fill="#111827" stroke="#f97316" stroke-width="4"/><g fill="#f97316"><rect x="22" y="28" width="114" height="20"/><rect x="22" y="66" width="76" height="20"/></g><text x="79" y="112" text-anchor="middle" fill="#e2e8f0" font-family="Arial" font-size="18">weights H</text></g>
  <text x="380" y="370" fill="#94a3b8" text-anchor="middle" font-family="Arial" font-size="16">Columns of W act as additive parts; H says how strongly each part is used.</text>`
    });
}

function alphaGoCandidate() {
    const gridLines = Array.from({ length: 19 }, (_, index) => 112 + index * 11)
        .map((position) => `<path d="M112 ${position} H310 M${position} 112 V310" stroke="#7a5528" stroke-width="1"/>`)
        .join('\n');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="504" viewBox="0 0 720 504" role="img" aria-labelledby="title desc">
  <title id="title">AlphaGo policy, value and tree-search pipeline</title>
  <desc id="desc">A schematic 19 by 19 Go board feeding policy and value networks whose estimates guide Monte Carlo tree search.</desc>
  <rect width="720" height="504" fill="#f7f5ef"/><rect x="28" y="28" width="664" height="448" rx="18" fill="#fffdf8" stroke="#d4c8b4" stroke-width="2"/>
  <text x="48" y="68" fill="#1f1b16" font-family="Arial" font-size="27" font-weight="800">AlphaGo: learned intuition plus search</text>
  <text x="48" y="94" fill="#6b6258" font-family="Arial" font-size="15">A schematic 19×19 position; no historical move coordinate is asserted.</text>
  <rect x="100" y="100" width="222" height="222" rx="8" fill="#e2b66f" stroke="#7a5528" stroke-width="2"/>
${gridLines}
  <circle cx="211" cy="211" r="6" fill="#111"/><circle cx="233" cy="211" r="6" fill="#f6f1e8" stroke="#111"/><circle cx="200" cy="233" r="6" fill="#111"/><circle cx="255" cy="189" r="7" fill="#f68900" stroke="#111"/>
  <text x="108" y="354" fill="#1f1b16" font-family="Arial" font-size="16" font-weight="800">Board state</text><text x="108" y="378" fill="#6b6258" font-family="Arial" font-size="14">candidate moves</text>
  <path d="M336 220 H382" stroke="#f68900" stroke-width="4"/><path d="M382 220 l-14 -9 v18 z" fill="#f68900"/>
  <g font-family="Arial"><rect x="400" y="112" width="238" height="68" rx="14" fill="#111"/><text x="420" y="140" fill="#f68900" font-size="14" font-weight="900">POLICY NETWORK</text><text x="420" y="164" fill="#fff" font-size="15">move priors</text>
  <rect x="400" y="202" width="238" height="68" rx="14" fill="#111"/><text x="420" y="230" fill="#f68900" font-size="14" font-weight="900">VALUE NETWORK</text><text x="420" y="254" fill="#fff" font-size="15">position estimate</text>
  <rect x="400" y="292" width="238" height="68" rx="14" fill="#111"/><text x="420" y="320" fill="#f68900" font-size="14" font-weight="900">MONTE CARLO TREE SEARCH</text><text x="420" y="344" fill="#fff" font-size="15">visit-guided comparison</text></g>
  <text x="48" y="430" fill="#6b6258" font-family="Arial" font-size="14">Move choice combines policy priors, value estimates and search visit counts.</text>
</svg>
`;
}

function transformerCandidate() {
    return svgShell({
        title: 'Scaled dot-product self-attention',
        desc: 'Queries and keys produce scaled attention weights that combine value vectors.',
        width: 760,
        height: 440,
        body: `  <text x="38" y="56" fill="#f59e0b" font-family="Arial" font-size="28" font-weight="700">Scaled dot-product self-attention</text>
  <g font-family="Arial" font-size="18" text-anchor="middle"><rect x="76" y="112" width="132" height="64" rx="14" fill="#172554" stroke="#60a5fa" stroke-width="3"/><text x="142" y="151" fill="#bfdbfe">queries Q</text><rect x="314" y="112" width="132" height="64" rx="14" fill="#172554" stroke="#60a5fa" stroke-width="3"/><text x="380" y="151" fill="#bfdbfe">keys K</text><rect x="552" y="112" width="132" height="64" rx="14" fill="#172554" stroke="#60a5fa" stroke-width="3"/><text x="618" y="151" fill="#bfdbfe">values V</text></g>
  <path d="M142 176 C142 218 270 218 304 252 M380 176 C380 218 338 218 322 252" fill="none" stroke="#e2e8f0" stroke-width="4"/>
  <rect x="174" y="252" width="412" height="72" rx="16" fill="#111827" stroke="#f59e0b" stroke-width="3"/>
  <text x="380" y="296" fill="#fde68a" text-anchor="middle" font-family="Arial" font-size="23">Attention(Q,K,V) = softmax(QKᵀ / √dₖ) V</text>
  <path d="M618 176 C618 220 548 220 522 252" fill="none" stroke="#22c55e" stroke-width="4"/>
  <rect x="278" y="354" width="204" height="52" rx="14" fill="#064e3b" stroke="#6ee7b7" stroke-width="3"/><text x="380" y="387" fill="#d1fae5" text-anchor="middle" font-family="Arial" font-size="18">weighted value mixture</text>
  <path d="M380 324 V354" stroke="#f8fafc" stroke-width="4"/>`
    });
}

const candidates = [
    {
        original: 'resources/images/bench-council-ai100/explainers/1943-mcculloch-pitts-neuron_threshold-logic.svg',
        issues: ['Footer sentence extends beyond the 720-unit viewBox.'],
        changes: ['Wrap the explanation into two centered lines and reduce its font size.'],
        build: () =>
            edit('resources/images/bench-council-ai100/explainers/1943-mcculloch-pitts-neuron_threshold-logic.svg', [
                [
                    '<text x="72" y="376" fill="#94a3b8" font-family="Arial" font-size="22">Binary inputs become a logical proposition implemented by a neuron-like unit.</text>',
                    '<text x="360" y="368" fill="#94a3b8" text-anchor="middle" font-family="Arial" font-size="18">Binary inputs become a logical proposition</text>\n  <text x="360" y="394" fill="#94a3b8" text-anchor="middle" font-family="Arial" font-size="18">implemented by a neuron-like threshold unit.</text>'
                ]
            ])
    },
    {
        original: 'resources/images/bench-council-ai100/explainers/1958-lisp_eval-flow.svg',
        issues: ['The input expression is too wide for its panel.', 'The footer sentence exceeds the viewBox.'],
        changes: ['Reduce the code label size.', 'Wrap the footer into two lines.'],
        build: () =>
            edit('resources/images/bench-council-ai100/explainers/1958-lisp_eval-flow.svg', [
                ['font-size="20">(car \'(AI LISP))</text>', 'font-size="16">(car \'(AI LISP))</text>'],
                [
                    '<text x="100" y="448" fill="#6b6258" font-family="Arial, Helvetica, sans-serif" font-size="15">The evaluator treats programs as list data, so symbolic expressions can transform other symbolic expressions.</text>',
                    '<text x="100" y="444" fill="#6b6258" font-family="Arial, Helvetica, sans-serif" font-size="14">The evaluator treats programs as list data, so symbolic expressions</text>\n  <text x="100" y="464" fill="#6b6258" font-family="Arial, Helvetica, sans-serif" font-size="14">can transform other symbolic expressions.</text>'
                ]
            ])
    },
    {
        original: 'resources/images/bench-council-ai100/explainers/1960-davis-putnam-dpll_sat-search.svg',
        issues: ['The footer text exceeds its callout box.'],
        changes: ['Widen the callout and reduce the footer font slightly.'],
        build: () =>
            edit('resources/images/bench-council-ai100/explainers/1960-davis-putnam-dpll_sat-search.svg', [
                [
                    '<rect x="80" y="426" width="650" height="40" rx="8"',
                    '<rect x="80" y="426" width="744" height="40" rx="8"'
                ],
                ['<text x="405" y="452"', '<text x="452" y="452"'],
                ['font-size="17" text-anchor="middle">Modern SAT', 'font-size="16" text-anchor="middle">Modern SAT']
            ])
    },
    {
        original: 'resources/images/bench-council-ai100/explainers/1965-resolution-method_clause-refutation.svg',
        issues: ['The original diagram jumps from A or C to the empty clause without showing contradictory premises.'],
        changes: ['Replace it with an explicit two-step resolution refutation.'],
        build: resolutionCandidate
    },
    {
        original: 'resources/images/bench-council-ai100/explainers/1971-complexity-theory_reduction-map.svg',
        issues: ['General theorem proving is not necessarily an NP decision problem.', 'The footer overflows its box.'],
        changes: ['Use concrete NP decision problems and state the Cook-Levin relationship precisely.'],
        build: complexityCandidate
    },
    {
        original: 'resources/images/bench-council-ai100/explainers/1973-prolog_query-tree.svg',
        issues: ['The recursive rule text exceeds its node.'],
        changes: ['Split the recursive rule over two lines and increase the node height.'],
        build: () =>
            edit('resources/images/bench-council-ai100/explainers/1973-prolog_query-tree.svg', [
                ['<rect x="374" y="172" width="205" height="48"', '<rect x="374" y="162" width="220" height="68"'],
                [
                    '<text x="394" y="202" font-size="16">parent(X,Z), ancestor(Z,Y)</text>',
                    '<text x="394" y="190" font-size="15">parent(X,Z),</text><text x="394" y="214" font-size="15">ancestor(Z,Y)</text>'
                ],
                ['M350 120 L476 172', 'M350 120 L476 162'],
                ['M430 220 L356 284', 'M448 230 L356 284']
            ])
    },
    {
        original: 'resources/images/bench-council-ai100/explainers/1974-frame_slot-card.svg',
        issues: [
            'The heading collides with the card edge.',
            'The restaurant-script example blurs frames with later script terminology.'
        ],
        changes: ['Use a generic frame inheritance example with explicit defaults and overrides.'],
        build: frameCandidate
    },
    {
        original: 'resources/images/bench-council-ai100/explainers/1988-td-update_error-meter.svg',
        issues: ['The TD-error label touches the meter circle.'],
        changes: ['Move the label lower and center it under the meter.'],
        build: () =>
            edit('resources/images/bench-council-ai100/explainers/1988-td-update_error-meter.svg', [
                ['<text x="278" y="408"', '<text x="330" y="430" text-anchor="middle"']
            ])
    },
    {
        original: 'resources/images/bench-council-ai100/explainers/1989-lenet_zip-code-cnn.svg',
        issues: ['The footer sentence extends beyond the viewBox.'],
        changes: ['Wrap and center the footer.'],
        build: () =>
            edit('resources/images/bench-council-ai100/explainers/1989-lenet_zip-code-cnn.svg', [
                [
                    '<text x="90" y="344" fill="#94a3b8" font-family="Arial" font-size="22">Convolution and pooling turn a ZIP-code crop into a class prediction.</text>',
                    '<text x="360" y="344" fill="#94a3b8" text-anchor="middle" font-family="Arial" font-size="19">Convolution and pooling turn a ZIP-code crop</text>\n  <text x="360" y="372" fill="#94a3b8" text-anchor="middle" font-family="Arial" font-size="19">into a digit-class prediction.</text>'
                ]
            ])
    },
    {
        original: 'resources/images/bench-council-ai100/explainers/1990-otter_given-clause.svg',
        issues: ['The new-consequences label exceeds its node.'],
        changes: ['Reduce that label to fit the fixed card width.'],
        build: () =>
            edit('resources/images/bench-council-ai100/explainers/1990-otter_given-clause.svg', [
                [
                    'font-size="23" font-weight="800">new consequences</text>',
                    'font-size="20" font-weight="800">new consequences</text>'
                ]
            ])
    },
    {
        original: 'resources/images/bench-council-ai100/explainers/1996-lasso_l1-constraint.svg',
        issues: ['The rotated loss contour reaches into the subtitle area.'],
        changes: ['Move the geometry down while preserving the L1 corner contact.'],
        build: () =>
            edit('resources/images/bench-council-ai100/explainers/1996-lasso_l1-constraint.svg', [
                ['<path d="M350 360 L500 175 L650 360 L500 545 Z"', '<path d="M350 402 L500 217 L650 402 L500 587 Z"'],
                ['<ellipse cx="590" cy="250"', '<ellipse cx="590" cy="292"'],
                ['rotate(-27 590 250)', 'rotate(-27 590 292)'],
                ['<circle cx="500" cy="175"', '<circle cx="500" cy="217"']
            ])
    },
    {
        original: 'resources/images/bench-council-ai100/explainers/1997-lstm_gated-memory.svg',
        issues: ['The diagram assigns a forget gate to the original 1997 LSTM architecture.'],
        changes: [
            'Show input gate, output gate and persistent cell state; explicitly note the later forget-gate addition.'
        ],
        build: lstmCandidate
    },
    {
        original: 'resources/images/bench-council-ai100/explainers/1999-nmf_parts-factorization.svg',
        issues: ['The factorization omits a clearly identified basis matrix and can read as icons times weights.'],
        changes: [
            'Show the standard V approximately equals W times H relationship with nonnegative basis and coefficient matrices.'
        ],
        build: nmfCandidate
    },
    {
        original: 'resources/images/bench-council-ai100/explainers/2000-neural-language-model_context-prediction.svg',
        issues: ['The embeddings label crowds its panel.', 'The footer exceeds the viewBox.'],
        changes: ['Reduce the panel label size and wrap the footer.'],
        build: () =>
            edit('resources/images/bench-council-ai100/explainers/2000-neural-language-model_context-prediction.svg', [
                [
                    'font-size="25" text-anchor="middle">embeddings</text>',
                    'font-size="21" text-anchor="middle">embeddings</text>'
                ],
                [
                    '<text x="80" y="362" fill="#94a3b8" font-family="Arial" font-size="22">Sparse words become dense vectors that support statistical prediction.</text>',
                    '<text x="360" y="350" fill="#94a3b8" text-anchor="middle" font-family="Arial" font-size="18">Sparse words become dense vectors</text>\n  <text x="360" y="376" fill="#94a3b8" text-anchor="middle" font-family="Arial" font-size="18">that support next-word prediction.</text>'
                ]
            ])
    },
    {
        original: 'resources/images/bench-council-ai100/explainers/2013-dqn_replay-buffer.svg',
        issues: ['The minibatch label is not centered and touches the node boundary.'],
        changes: ['Center the label and reduce its size slightly.'],
        build: () =>
            edit('resources/images/bench-council-ai100/explainers/2013-dqn_replay-buffer.svg', [
                [
                    '<text x="270" y="288" fill="#d1fae5" font-family="Arial" font-size="18">sample minibatch</text>',
                    '<text x="320" y="288" fill="#d1fae5" text-anchor="middle" font-family="Arial" font-size="17">sample minibatch</text>'
                ]
            ])
    },
    {
        original: 'resources/images/bench-council-ai100/explainers/2014-conditional-gan_conditioned-generator.svg',
        issues: ['The conditioned-sample label exceeds its result card.'],
        changes: ['Reduce the result label size.'],
        build: () =>
            edit('resources/images/bench-council-ai100/explainers/2014-conditional-gan_conditioned-generator.svg', [
                [
                    'font-size="18" font-weight="700" text-anchor="middle">',
                    'font-size="17" font-weight="700" text-anchor="middle">'
                ],
                [
                    '<text x="574" y="196" fill="#0f172a">conditioned sample</text>',
                    '<text x="574" y="196" fill="#0f172a" font-size="15">conditioned sample</text>'
                ]
            ])
    },
    {
        original: 'resources/images/bench-council-ai100/explainers/2014-glove_cooccurrence.svg',
        issues: [
            'Two mechanism labels exceed their cards.',
            'Weighted regression is less precise than the paper objective.'
        ],
        changes: ['Use smaller labels and name the weighted least-squares objective.'],
        build: () =>
            edit('resources/images/bench-council-ai100/explainers/2014-glove_cooccurrence.svg', [
                [
                    '<text x="146" y="196" fill="#0f172a">word co-occurrence</text>',
                    '<text x="146" y="196" fill="#0f172a" font-size="15">co-occurrence counts</text>'
                ],
                [
                    '<text x="360" y="194" fill="#0f172a">weighted regression</text>',
                    '<text x="360" y="188" fill="#0f172a" font-size="13">weighted least-squares</text><text x="360" y="208" fill="#0f172a" font-size="14">log-count objective</text>'
                ],
                [
                    '<text x="360" y="222" fill="#475569">mechanism</text>',
                    '<text x="360" y="238" fill="#475569" font-size="14">mechanism</text>'
                ]
            ])
    },
    {
        original: 'resources/images/bench-council-ai100/explainers/2014-vgg_depth-configurations.svg',
        issues: [
            'Bars overlap the subtitle.',
            'Five unlabeled bars do not map accurately to canonical VGG configurations.'
        ],
        changes: ['Show VGG-11/13/16/19 with proportional weight-layer counts and labels.'],
        build: vggCandidate
    },
    {
        original: 'resources/images/bench-council-ai100/explainers/2015-dcgan_conv-generator.svg',
        issues: ['The mechanism label exceeds its card.', 'Deconvolution is ambiguous terminology.'],
        changes: ['Use a two-line transposed-convolution label.'],
        build: () =>
            edit('resources/images/bench-council-ai100/explainers/2015-dcgan_conv-generator.svg', [
                [
                    '<text x="360" y="194" fill="#0f172a">deconvolution stack</text>',
                    '<text x="360" y="186" fill="#0f172a" font-size="15">fractionally-strided</text><text x="360" y="206" fill="#0f172a" font-size="15">convolution stack</text>'
                ],
                [
                    '<text x="360" y="222" fill="#475569">mechanism</text>',
                    '<text x="360" y="238" fill="#475569" font-size="14">mechanism</text>'
                ]
            ])
    },
    {
        original: 'resources/images/bench-council-ai100/explainers/2015-u-net_segmentation-mask.svg',
        issues: ['The image panels overlap the Chinese subtitle.'],
        changes: ['Move the panels and connector below the title band.'],
        build: () =>
            edit('resources/images/bench-council-ai100/explainers/2015-u-net_segmentation-mask.svg', [
                ['x="180" y="160" width="310" height="360"', 'x="180" y="205" width="310" height="320"'],
                ['x="710" y="160" width="310" height="360"', 'x="710" y="205" width="310" height="320"'],
                [
                    'M760 430 C720 310 790 200 910 230 C1020 258 1000 470 875 480 C820 485 785 468 760 430Z',
                    'M760 450 C730 340 800 240 910 260 C1008 280 995 480 875 493 C822 498 784 482 760 450Z'
                ],
                ['M490 340 H710', 'M490 365 H710']
            ])
    },
    {
        original: 'resources/images/bench-council-ai100/explainers/2016-alphago_policy-value-search.svg',
        issues: [
            'Long labels overflow the network cards and footer.',
            'A 9x9 schematic labels move 37, which can be mistaken for the historical 19x19 game position.'
        ],
        changes: ['Use a schematic 19x19 board, remove the historical move claim, and shorten card labels.'],
        build: alphaGoCandidate
    },
    {
        original: 'resources/images/bench-council-ai100/explainers/2016-gcn_spectral-convolution.svg',
        issues: ['The normalized-neighbors label exceeds its mechanism card.'],
        changes: ['Reduce the mechanism label size.'],
        build: () =>
            edit('resources/images/bench-council-ai100/explainers/2016-gcn_spectral-convolution.svg', [
                [
                    '<text x="360" y="194" fill="#0f172a">normalized neighbors</text>',
                    '<text x="360" y="194" fill="#0f172a" font-size="15">normalized neighbors</text>'
                ]
            ])
    },
    {
        original: 'resources/images/bench-council-ai100/explainers/2016-nas_controller-search.svg',
        issues: ['The sampled-architecture label exceeds its card.'],
        changes: ['Reduce the mechanism label size.'],
        build: () =>
            edit('resources/images/bench-council-ai100/explainers/2016-nas_controller-search.svg', [
                [
                    '<text x="360" y="194" fill="#0f172a">sample architecture</text>',
                    '<text x="360" y="194" fill="#0f172a" font-size="15">sample architecture</text>'
                ]
            ])
    },
    {
        original: 'resources/images/bench-council-ai100/explainers/2017-transformer_self-attention.svg',
        issues: ['The formula omits scaling by square root of key dimension and the multiplication by values.'],
        changes: ['Replace it with the complete scaled dot-product attention expression.'],
        build: transformerCandidate
    },
    {
        original: 'resources/images/bench-council-ai100/explainers/2017-wasserstein-gan_critic-distance.svg',
        issues: [
            'The generated-distribution label overflows.',
            'Critic distance can imply that the critic directly is a distance metric.'
        ],
        changes: [
            'Wrap the output label and describe the mechanism as a critic score gap estimating Wasserstein distance.'
        ],
        build: () =>
            edit('resources/images/bench-council-ai100/explainers/2017-wasserstein-gan_critic-distance.svg', [
                [
                    '<text x="360" y="194" fill="#0f172a">critic distance</text>',
                    '<text x="360" y="186" fill="#0f172a" font-size="15">critic score gap</text><text x="360" y="206" fill="#0f172a" font-size="14">Wasserstein estimate</text>'
                ],
                [
                    '<text x="360" y="222" fill="#475569">mechanism</text>',
                    '<text x="360" y="238" fill="#475569" font-size="14">mechanism</text>'
                ],
                [
                    '<text x="574" y="196" fill="#0f172a">generated distribution</text>',
                    '<text x="574" y="186" fill="#0f172a" font-size="14">generated</text><text x="574" y="204" fill="#0f172a" font-size="14">distribution</text>'
                ],
                [
                    '<text x="574" y="222" fill="#475569">result</text>',
                    '<text x="574" y="232" fill="#475569" font-size="13">result</text>'
                ]
            ])
    },
    {
        original: 'resources/images/bench-council-ai100/explainers/2020-vit_patch-tokens.svg',
        issues: ['The footer sentence exceeds the viewBox.'],
        changes: ['Wrap and center the footer.'],
        build: () =>
            edit('resources/images/bench-council-ai100/explainers/2020-vit_patch-tokens.svg', [
                [
                    '<text x="78" y="348" fill="#94a3b8" font-family="Arial" font-size="22">Image patches become a token sequence, then attention mixes distant regions.</text>',
                    '<text x="360" y="344" fill="#94a3b8" text-anchor="middle" font-family="Arial" font-size="18">Image patches become a token sequence;</text>\n  <text x="360" y="370" fill="#94a3b8" text-anchor="middle" font-family="Arial" font-size="18">attention then mixes information across regions.</text>'
                ]
            ])
    }
];

function buildComparisonHtml(records) {
    const promotedCount = records.filter((record) => record.promoted).length;
    const cards = records
        .map(
            (record, index) => `<article>
  <h2>${index + 1}. ${path.basename(record.original)}</h2>
  <div class="compare"><section><h3>Original snapshot</h3><object type="image/svg+xml" data="originals/${record.candidateFile}"></object></section><section><h3>Candidate</h3><object type="image/svg+xml" data="candidates/${record.candidateFile}"></object></section></div>
  <p><strong>Issues:</strong> ${record.issues.join(' ')}</p><p><strong>Candidate changes:</strong> ${record.changes.join(' ')}</p>
</article>`
        )
        .join('\n');
    return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SVG Explainer Candidate Comparison</title><style>*{box-sizing:border-box}body{margin:0;background:#eef1f5;color:#172033;font:14px/1.5 Arial,sans-serif}header{padding:18px 24px;background:#fff;border-bottom:1px solid #cbd5e1}h1{margin:0;font-size:22px}main{padding:18px;display:grid;gap:18px}article{background:#fff;border:1px solid #cbd5e1;border-radius:6px;padding:16px}h2{margin:0 0 12px;font-size:17px}.compare{display:grid;grid-template-columns:1fr 1fr;gap:14px}.compare section{min-width:0}.compare h3{margin:0 0 6px;font-size:14px}.compare object{display:block;width:100%;aspect-ratio:5/3;background:#101827;border:1px solid #94a3b8}p{margin:9px 0 0}@media(max-width:850px){.compare{grid-template-columns:1fr}}</style></head><body><header><h1>SVG 解释图原图 / 修订图对比</h1><div>${records.length} 张修订图；${promotedCount} 张已替换到当前资源，替换前快照仍保留。</div></header><main>${cards}</main></body></html>`;
}

function buildReview(records, inventory) {
    const recordMap = new Map(records.map((record) => [record.original, record]));
    const promotedCount = records.filter((record) => record.promoted).length;
    const eventPrimaryCount = inventory.filter((entry) =>
        [...entry.sources, ...entry.variantSources].some((source) => source.reliability === 'primary')
    ).length;
    const sourceTierCaveats = inventory.filter(
        (entry) => ![...entry.sources, ...entry.variantSources].some((source) => source.reliability === 'primary')
    );
    const lines = [
        '# SVG Explainer Review Results',
        '',
        `- Reviewed SVGs used by enabled events: ${inventory.length}`,
        `- Candidate revisions: ${records.length}`,
        `- Revisions promoted to current assets: ${promotedCount}`,
        `- Pre-replacement snapshots retained: ${records.length}`,
        `- Event-level primary-source grounding: ${eventPrimaryCount}/${inventory.length}`,
        `- Secondary/reference-only source-tier caveats: ${sourceTierCaveats.length}`,
        '',
        '## Review Method',
        '',
        '- Extracted each selected SVG through enabled storyline variants and asset IDs.',
        '- Resolved each asset source ID against the event source bundle.',
        '- Compared embedded SVG labels with event descriptions, methods, artifacts and source titles.',
        '- Rendered every SVG in headless Chrome and checked transformed text bounds, viewBox clipping and partial text/shape collisions.',
        '- Preserved every pre-replacement original as a snapshot and kept each revision as a separate candidate artifact.',
        '',
        '## Source-tier Caveats',
        '',
        'The following images can be extracted from an event and have resolved sources, but the selected event bundle does not currently classify any linked source as `primary`. Their visual meaning was reviewed for consistency, but source strengthening should remain a separate content task:',
        '',
        ...sourceTierCaveats.map(
            (entry) => `- \`${entry.path}\` (${[...new Set(entry.usages.map((usage) => usage.eventId))].join(', ')})`
        ),
        '',
        '## Per-image Results',
        ''
    ];
    for (const entry of inventory) {
        const record = recordMap.get(entry.path);
        const events = [...new Set(entry.usages.map((usage) => usage.eventId))].join(', ');
        const sourceTier = [...entry.sources, ...entry.variantSources].some(
            (source) => source.reliability === 'primary'
        )
            ? 'primary source linked'
            : 'secondary/reference source linked';
        if (record) {
            lines.push(
                `- **${record.promoted ? 'promoted' : 'candidate'}** \`${entry.path}\` (${events}; ${sourceTier})`,
                `  Issue: ${record.issues.join(' ')}`,
                `  Proposed: ${record.changes.join(' ')}`
            );
        } else {
            lines.push(
                `- **pass** \`${entry.path}\` (${events}; ${sourceTier}) - Event meaning and embedded labels are consistent; no rendered geometry defect was retained after transformed-coordinate review.`
            );
        }
    }
    return `${lines.join('\n')}\n`;
}

function main() {
    const inventory = JSON.parse(fs.readFileSync(path.join(REVIEW_DIR, 'inventory.json'), 'utf8'));
    fs.mkdirSync(CANDIDATE_DIR, { recursive: true });
    const records = candidates.map((candidate) => {
        const output = candidate.build();
        const candidateFile = path.basename(candidate.original);
        fs.writeFileSync(path.join(CANDIDATE_DIR, candidateFile), output);
        return {
            original: candidate.original,
            candidateFile,
            issues: candidate.issues,
            changes: candidate.changes,
            promoted: fs.readFileSync(path.join(ROOT, candidate.original)).equals(Buffer.from(output))
        };
    });
    fs.writeFileSync(path.join(REVIEW_DIR, 'candidates.json'), `${JSON.stringify(records, null, 2)}\n`);
    fs.writeFileSync(path.join(REVIEW_DIR, 'comparison.html'), buildComparisonHtml(records));
    fs.writeFileSync(path.join(REVIEW_DIR, 'review-results.md'), buildReview(records, inventory));
    const inventoryMap = new Map(inventory.map((entry) => [entry.path, entry]));
    const candidateInventory = records.map((record) => ({
        ...inventoryMap.get(record.original),
        path: `reports/svg-explainer-review/candidates/${record.candidateFile}`
    }));
    fs.writeFileSync(path.join(REVIEW_DIR, 'candidate-review.html'), buildReviewHtml(candidateInventory));
    console.log(`SVG candidate revisions: ${records.length}`);
    console.log(`Candidate directory: ${path.relative(ROOT, CANDIDATE_DIR)}`);
}

if (require.main === module) main();

module.exports = { candidates };
