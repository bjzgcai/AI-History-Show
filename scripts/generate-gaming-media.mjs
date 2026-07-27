#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_DIR = path.join(ROOT, 'resources/images/game-evolution');
const WIDTH = 960;
const HEIGHT = 600;

const xml = (value) =>
    String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function svgDocument(title, description, content, accent = '#f08a24') {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="title desc">
  <title id="title">${xml(title)}</title>
  <desc id="desc">${xml(description)}</desc>
  <style>
    text { font-family: Arial, "PingFang SC", "Microsoft YaHei", sans-serif; letter-spacing: 0; }
    .brand { fill: #f5efe5; font-size: 28px; font-weight: 700; }
    .cue { fill: #b7afa4; font-size: 15px; font-weight: 700; }
    .frame { fill: #111316; stroke: #363b43; stroke-width: 2; }
    .accent { fill: ${accent}; stroke: ${accent}; }
    .scan { animation: scan 6s linear infinite; }
    .pulse { animation: pulse 2.4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
    .blink { animation: blink 4s steps(1, end) infinite; }
    @keyframes scan { from { transform: translateX(-180px); } to { transform: translateX(980px); } }
    @keyframes pulse { 0%, 100% { opacity: .45; transform: scale(.92); } 50% { opacity: 1; transform: scale(1.08); } }
    @keyframes blink { 0%, 24% { opacity: .25; } 25%, 49% { opacity: 1; } 50%, 74% { opacity: .45; } 75%, 100% { opacity: 1; } }
    @media (prefers-reduced-motion: reduce) { .scan, .pulse, .blink { animation: none; } }
  </style>
  <rect width="960" height="600" fill="#090a0c"/>
  <rect x="24" y="24" width="912" height="552" rx="6" class="frame"/>
  ${content}
</svg>
`;
}

function header(name, cue) {
    return `<text x="58" y="72" class="brand">${xml(name)}</text>
  <text x="58" y="98" class="cue">${xml(cue)}</text>
  <rect x="58" y="116" width="844" height="1" fill="#34383f"/>`;
}

function board8(x, y, size, light = '#d8c8ab', dark = '#59636d') {
    const cell = size / 8;
    let out = `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${dark}"/>`;
    for (let row = 0; row < 8; row += 1) {
        for (let col = 0; col < 8; col += 1) {
            if ((row + col) % 2 === 0) {
                out += `<rect x="${x + col * cell}" y="${y + row * cell}" width="${cell}" height="${cell}" fill="${light}"/>`;
            }
        }
    }
    return out;
}

function checkersPieces(x, y, size, white, black) {
    const cell = size / 8;
    let out = '';
    for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 8; col += 1) {
            if ((row + col) % 2 === 1) {
                out += `<circle cx="${x + (col + 0.5) * cell}" cy="${y + (row + 0.5) * cell}" r="${cell * 0.31}" fill="${black}" stroke="#0d0e10" stroke-width="3"/>`;
            }
        }
    }
    for (let row = 5; row < 8; row += 1) {
        for (let col = 0; col < 8; col += 1) {
            if ((row + col) % 2 === 1) {
                out += `<circle cx="${x + (col + 0.5) * cell}" cy="${y + (row + 0.5) * cell}" r="${cell * 0.31}" fill="${white}" stroke="#8d7657" stroke-width="3"/>`;
            }
        }
    }
    return out;
}

function goBoard(x, y, size, stones = []) {
    const step = size / 18;
    let out = `<rect x="${x - 18}" y="${y - 18}" width="${size + 36}" height="${size + 36}" rx="4" fill="#cba66a" stroke="#ead2a0" stroke-width="2"/>`;
    for (let i = 0; i < 19; i += 1) {
        out += `<line x1="${x}" y1="${y + i * step}" x2="${x + size}" y2="${y + i * step}" stroke="#3d3022" stroke-width="1.4"/>`;
        out += `<line x1="${x + i * step}" y1="${y}" x2="${x + i * step}" y2="${y + size}" stroke="#3d3022" stroke-width="1.4"/>`;
    }
    for (const [col, row, color, begin = '0s'] of stones) {
        out += `<circle cx="${x + col * step}" cy="${y + row * step}" r="${step * 0.42}" fill="${color}" stroke="${color === '#f5f2ea' ? '#8b8378' : '#000'}" stroke-width="1.5" opacity="0">
          <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;.2;.24;1" begin="${begin}" dur="8s" repeatCount="indefinite"/>
        </circle>`;
    }
    return out;
}

function chessBoard(x, y, size) {
    return board8(x, y, size, '#d6c6a5', '#5f6d78');
}

function card(x, y, label, fill = '#f4efe5', color = '#17191d', rotate = 0) {
    return `<g transform="translate(${x} ${y}) rotate(${rotate})">
      <rect width="64" height="88" rx="5" fill="${fill}" stroke="#bcb2a4" stroke-width="2"/>
      <text x="32" y="53" text-anchor="middle" font-size="24" font-weight="700" fill="${color}">${xml(label)}</text>
    </g>`;
}

function buildStrachey() {
    const x = 92;
    const y = 146;
    const size = 392;
    const cell = size / 8;
    return svgDocument(
        'Strachey draughts search animation / 斯特雷奇跳棋搜索动画',
        'A draughts position advances through legal moves and evaluation scores.',
        `${header('STRACHEY', 'DRAUGHTS · 1951')}
  ${board8(x, y, size)}
  ${checkersPieces(x, y, size, '#f0e0be', '#2b3037')}
  <circle cx="${x + 1.5 * cell}" cy="${y + 5.5 * cell}" r="${cell * 0.31}" fill="#f0e0be" stroke="#8d7657" stroke-width="3">
    <animate attributeName="cx" values="${x + 1.5 * cell};${x + 2.5 * cell};${x + 3.5 * cell};${x + 1.5 * cell}" dur="8s" repeatCount="indefinite"/>
    <animate attributeName="cy" values="${y + 5.5 * cell};${y + 4.5 * cell};${y + 3.5 * cell};${y + 5.5 * cell}" dur="8s" repeatCount="indefinite"/>
  </circle>
  <g transform="translate(555 160)">
    <text x="0" y="0" class="cue">MOVE TREE</text>
    <path d="M55 45 L20 125 M55 45 L90 125 M20 125 L2 205 M20 125 L40 205 M90 125 L72 205 M90 125 L110 205" fill="none" stroke="#747d87" stroke-width="4"/>
    <circle cx="55" cy="45" r="13" fill="#f08a24" class="pulse"/>
    <circle cx="20" cy="125" r="11" fill="#d6c6a5"/><circle cx="90" cy="125" r="11" fill="#d6c6a5"/>
    <circle cx="2" cy="205" r="9" fill="#69747f"/><circle cx="40" cy="205" r="9" fill="#69747f"/>
    <circle cx="72" cy="205" r="9" fill="#69747f"/><circle cx="110" cy="205" r="9" fill="#69747f"/>
    <text x="165" y="82" class="cue">+0.42</text><text x="165" y="135" class="cue">-0.08</text><text x="165" y="188" class="cue">+0.17</text>
    <rect x="154" y="94" width="132" height="12" fill="#2b3037"/><rect x="154" y="94" width="102" height="12" fill="#f08a24" class="blink"/>
    <rect x="154" y="147" width="132" height="12" fill="#2b3037"/><rect x="154" y="147" width="46" height="12" fill="#7f8a95"/>
    <rect x="154" y="200" width="132" height="12" fill="#2b3037"/><rect x="154" y="200" width="76" height="12" fill="#c9b185"/>
  </g>`,
        '#f08a24'
    );
}

function buildTdGammon() {
    let triangles = '';
    for (let i = 0; i < 12; i += 1) {
        const x = 110 + i * 57;
        const fill = i % 2 ? '#854b3e' : '#d2b17d';
        triangles += `<path d="M${x} 170 L${x + 52} 170 L${x + 26} 345 Z" fill="${fill}" opacity=".92"/>`;
        triangles += `<path d="M${x} 520 L${x + 52} 520 L${x + 26} 345 Z" fill="${fill}" opacity=".92"/>`;
    }
    return svgDocument(
        'TD-Gammon value update animation / TD-Gammon 价值更新动画',
        'Backgammon checkers move while a temporal-difference value trace updates.',
        `${header('TD-GAMMON', 'TEMPORAL DIFFERENCE · 1988')}
  <rect x="92" y="150" width="720" height="390" rx="8" fill="#3c2922" stroke="#caa875" stroke-width="4"/>
  ${triangles}
  <g fill="#f2e6cf" stroke="#8c765c" stroke-width="3">
    <circle cx="164" cy="198" r="22"/><circle cx="164" cy="238" r="22"/><circle cx="278" cy="492" r="22"/>
    <circle cx="278" cy="452" r="22"/><circle cx="620" cy="198" r="22"/>
  </g>
  <g fill="#22262d" stroke="#090a0c" stroke-width="3">
    <circle cx="734" cy="492" r="22"/><circle cx="734" cy="452" r="22"/><circle cx="506" cy="198" r="22"/>
  </g>
  <circle cx="506" cy="238" r="22" fill="#22262d" stroke="#090a0c" stroke-width="3">
    <animate attributeName="cx" values="506;449;392;506" dur="7s" repeatCount="indefinite"/>
    <animate attributeName="cy" values="238;452;492;238" dur="7s" repeatCount="indefinite"/>
  </circle>
  <g transform="translate(835 185)">
    <rect width="74" height="74" rx="8" fill="#f3eee4"/><circle cx="20" cy="20" r="5" fill="#22262d"/><circle cx="54" cy="54" r="5" fill="#22262d"/>
    <animateTransform attributeName="transform" type="rotate" values="0 872 222;180 872 222;360 872 222" dur="2s" repeatCount="indefinite" additive="sum"/>
  </g>
  <text x="832" y="325" class="cue">V(t)</text>
  <polyline points="832,485 850,455 868,468 886,390 904,414" fill="none" stroke="#36b7a8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="904" cy="414" r="8" fill="#36b7a8" class="pulse"/>`,
        '#36b7a8'
    );
}

function buildChinook() {
    const x = 105;
    const y = 145;
    const size = 410;
    const cell = size / 8;
    return svgDocument(
        'Chinook versus Tinsley game animation / Chinook 对 Tinsley 棋局动画',
        'A checkers sequence based on the 1994 championship game record highlights forced play.',
        `${header('CHINOOK', 'TINSLEY MATCH · GAME 2 · 1994')}
  ${board8(x, y, size, '#e5d3b2', '#44515b')}
  ${checkersPieces(x, y, size, '#e8dbc4', '#b7483d')}
  <path d="M${x + 1.5 * cell} ${y + 5.5 * cell} L${x + 2.5 * cell} ${y + 4.5 * cell} L${x + 3.5 * cell} ${y + 3.5 * cell}" fill="none" stroke="#f4b24b" stroke-width="8" stroke-linecap="round" stroke-dasharray="8 12" class="blink"/>
  <circle cx="${x + 1.5 * cell}" cy="${y + 5.5 * cell}" r="${cell * 0.3}" fill="#e8dbc4" stroke="#8d7657" stroke-width="3">
    <animate attributeName="cx" values="${x + 1.5 * cell};${x + 2.5 * cell};${x + 3.5 * cell};${x + 1.5 * cell}" dur="8s" repeatCount="indefinite"/>
    <animate attributeName="cy" values="${y + 5.5 * cell};${y + 4.5 * cell};${y + 3.5 * cell};${y + 5.5 * cell}" dur="8s" repeatCount="indefinite"/>
  </circle>
  <g transform="translate(585 165)">
    <text class="cue" x="0" y="0">09-14 · 22-18</text>
    <text class="cue" x="0" y="48">11-15 · 18-11</text>
    <text class="cue" x="0" y="96">08-15 · 25-22</text>
    <rect x="0" y="130" width="278" height="1" fill="#434951"/>
    <text x="0" y="174" fill="#f4b24b" font-size="22" font-weight="700">FORCED DRAW</text>
    <text x="0" y="208" class="cue">48 MOVES · PERFECT DEFENCE</text>
    <g transform="translate(0 250)">
      <rect width="278" height="76" rx="5" fill="#171a1f" stroke="#424850"/>
      <path d="M22 54 L60 38 L98 46 L136 20 L174 31 L212 18 L252 24" fill="none" stroke="#f4b24b" stroke-width="5"/>
      <circle cx="212" cy="18" r="8" fill="#f4b24b" class="pulse"/>
    </g>
  </g>`,
        '#f4b24b'
    );
}

function buildLogistello() {
    const x = 96;
    const y = 150;
    const size = 400;
    const cell = size / 8;
    let grid = `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="#267059" stroke="#84b29c" stroke-width="3"/>`;
    for (let i = 1; i < 8; i += 1) {
        grid += `<line x1="${x + i * cell}" y1="${y}" x2="${x + i * cell}" y2="${y + size}" stroke="#153c32" stroke-width="2"/>`;
        grid += `<line x1="${x}" y1="${y + i * cell}" x2="${x + size}" y2="${y + i * cell}" stroke="#153c32" stroke-width="2"/>`;
    }
    const positions = [
        [3, 3, '#f3f1ea'],
        [4, 4, '#f3f1ea'],
        [4, 3, '#101214'],
        [3, 4, '#101214'],
        [4, 2, '#f3f1ea'],
        [5, 5, '#101214'],
        [4, 5, '#f3f1ea'],
        [5, 4, '#101214']
    ];
    return svgDocument(
        'Logistello versus Murakami Othello animation / Logistello 对村上健黑白棋动画',
        'An Othello sequence from the 1997 match shows placed discs and rapid flips.',
        `${header('LOGISTELLO', 'MURAKAMI MATCH · GAME 1 · 1997')}
  ${grid}
  ${positions
      .map(
          (
              [col, row, color],
              index
          ) => `<circle cx="${x + (col + 0.5) * cell}" cy="${y + (row + 0.5) * cell}" r="${cell * 0.38}" fill="${color}" stroke="#0b0d0f" stroke-width="2">
    ${index > 3 ? `<animate attributeName="fill" values="${color};${color};${color === '#101214' ? '#f3f1ea' : '#101214'};${color}" keyTimes="0;.45;.55;1" dur="8s" repeatCount="indefinite"/>` : ''}
  </circle>`
      )
      .join('')}
  <circle cx="${x + 2.5 * cell}" cy="${y + 4.5 * cell}" r="${cell * 0.38}" fill="#101214" opacity="0">
    <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.18;.22;.8;1" dur="8s" repeatCount="indefinite"/>
  </circle>
  <g transform="translate(565 170)">
    <text x="0" y="0" class="cue">GAME 1 · 16–48</text>
    <text x="0" y="44" fill="#f3f1ea" font-size="20" font-weight="700">E3 · F6 · E6 · F5 · C5</text>
    <rect x="0" y="82" width="300" height="1" fill="#424850"/>
    <text x="0" y="126" class="cue">PATTERN EVALUATION</text>
    <g transform="translate(0 156)">
      <rect width="300" height="190" rx="6" fill="#14171b" stroke="#394048"/>
      <rect x="24" y="25" width="42" height="140" fill="#2d343c"/><rect x="82" y="58" width="42" height="107" fill="#68737e"/>
      <rect x="140" y="40" width="42" height="125" fill="#9ab5a7"/><rect x="198" y="16" width="42" height="149" fill="#38a77f" class="blink"/>
      <text x="20" y="184" class="cue">EDGE</text><text x="116" y="184" class="cue">CORNER</text><text x="220" y="184" class="cue">MPC</text>
    </g>
  </g>`,
        '#38a77f'
    );
}

function buildDeepBlue() {
    const x = 86;
    const y = 150;
    const size = 410;
    const cell = size / 8;
    const pieces = [
        [4, 7, 'K', '#f2eadc'],
        [3, 7, 'Q', '#f2eadc'],
        [4, 6, 'P', '#f2eadc'],
        [3, 6, 'P', '#f2eadc'],
        [4, 0, 'K', '#222831'],
        [3, 0, 'Q', '#222831'],
        [4, 1, 'P', '#222831'],
        [3, 1, 'P', '#222831'],
        [6, 0, 'N', '#222831']
    ];
    return svgDocument(
        'Deep Blue versus Kasparov chess animation / 深蓝对卡斯帕罗夫国际象棋动画',
        'A chess position from the 1997 rematch is searched by many candidate lines.',
        `${header('DEEP BLUE', 'KASPAROV REMATCH · 1997')}
  ${chessBoard(x, y, size)}
  ${pieces.map(([col, row, label, fill]) => `<circle cx="${x + (col + 0.5) * cell}" cy="${y + (row + 0.5) * cell}" r="${cell * 0.34}" fill="${fill}" stroke="#0c0e11" stroke-width="2"/><text x="${x + (col + 0.5) * cell}" y="${y + (row + 0.66) * cell}" text-anchor="middle" font-size="${cell * 0.42}" font-weight="700" fill="${fill === '#222831' ? '#f0e9dc' : '#252a31'}">${label}</text>`).join('')}
  <path d="M${x + 6.5 * cell} ${y + 0.5 * cell} Q${x + 5.6 * cell} ${y + 2.1 * cell} ${x + 4.5 * cell} ${y + 2.5 * cell}" fill="none" stroke="#ef4d4d" stroke-width="8" stroke-linecap="round" stroke-dasharray="10 12" class="blink"/>
  <g transform="translate(555 165)">
    <text x="0" y="0" class="cue">200M POSITIONS / SEC</text>
    <g transform="translate(0 38)">
      <path d="M130 22 L50 96 M130 22 L130 96 M130 22 L210 96 M50 96 L20 170 M50 96 L80 170 M130 96 L115 170 M130 96 L150 170 M210 96 L185 170 M210 96 L240 170" fill="none" stroke="#6d7782" stroke-width="4"/>
      <circle cx="130" cy="22" r="15" fill="#4ea0d8" class="pulse"/>
      <circle cx="50" cy="96" r="11" fill="#c8b88f"/><circle cx="130" cy="96" r="11" fill="#c8b88f"/><circle cx="210" cy="96" r="11" fill="#c8b88f"/>
      <circle cx="20" cy="170" r="8" fill="#ef4d4d"/><circle cx="80" cy="170" r="8" fill="#707b86"/><circle cx="115" cy="170" r="8" fill="#707b86"/><circle cx="150" cy="170" r="8" fill="#ef4d4d"/><circle cx="185" cy="170" r="8" fill="#707b86"/><circle cx="240" cy="170" r="8" fill="#707b86"/>
    </g>
    <rect x="0" y="250" width="290" height="82" rx="6" fill="#15181d" stroke="#3a4149"/>
    <text x="22" y="283" class="cue">BEST LINE</text>
    <text x="22" y="315" fill="#4ea0d8" font-size="22" font-weight="700">... Nxe6  +1.31</text>
  </g>`,
        '#4ea0d8'
    );
}

function buildAlphaCat() {
    const x = 95;
    const y = 150;
    const w = 405;
    const h = 405;
    const sx = w / 8;
    const sy = h / 9;
    let board = `<rect x="${x - 18}" y="${y - 18}" width="${w + 36}" height="${h + 36}" fill="#c9a269" stroke="#ecd2a2" stroke-width="3"/>`;
    for (let col = 0; col < 9; col += 1)
        board += `<line x1="${x + col * sx}" y1="${y}" x2="${x + col * sx}" y2="${y + h}" stroke="#47321f" stroke-width="2"/>`;
    for (let row = 0; row < 10; row += 1)
        board += `<line x1="${x}" y1="${y + row * sy}" x2="${x + w}" y2="${y + row * sy}" stroke="#47321f" stroke-width="2"/>`;
    const pieces = [
        [0, 0, '車', '#20262c'],
        [1, 0, '馬', '#20262c'],
        [4, 0, '將', '#20262c'],
        [0, 9, '俥', '#b84237'],
        [1, 9, '傌', '#b84237'],
        [4, 9, '帥', '#b84237'],
        [4, 6, '兵', '#b84237'],
        [4, 3, '卒', '#20262c']
    ];
    return svgDocument(
        'AlphaCat Chinese chess evaluation animation / AlphaCat 中国象棋评估动画',
        'A xiangqi position compares hand-tuned and comparison-trained evaluations.',
        `${header('ALPHACAT', 'COMPARISON TRAINING · XIANGQI')}
  ${board}
  <rect x="${x}" y="${y + 4 * sy}" width="${w}" height="${sy}" fill="#d9bb83"/>
  ${pieces.map(([col, row, label, fill]) => `<circle cx="${x + col * sx}" cy="${y + row * sy}" r="19" fill="#eadbbd" stroke="${fill}" stroke-width="4"/><text x="${x + col * sx}" y="${y + row * sy + 7}" text-anchor="middle" font-size="20" font-weight="700" fill="${fill}">${label}</text>`).join('')}
  <path d="M${x + sx} ${y + 9 * sy} Q${x + 2.2 * sx} ${y + 7.5 * sy} ${x + 2 * sx} ${y + 7 * sy}" fill="none" stroke="#f0a33c" stroke-width="8" stroke-dasharray="9 11" class="blink"/>
  <g transform="translate(565 170)">
    <text x="0" y="0" class="cue">EVALUATION WEIGHTS</text>
    <text x="0" y="54" fill="#aab2bc" font-size="18" font-weight="700">HAND-TUNED</text>
    <rect x="0" y="70" width="285" height="24" fill="#293039"/><rect x="0" y="70" width="126" height="24" fill="#8b949e"/>
    <text x="0" y="138" fill="#f0a33c" font-size="18" font-weight="700">COMPARISON TRAINED</text>
    <rect x="0" y="154" width="285" height="24" fill="#293039"/><rect x="0" y="154" width="247" height="24" fill="#f0a33c" class="blink"/>
    <text x="0" y="224" class="cue">WIN RATE</text><text x="0" y="276" fill="#f0a33c" font-size="52" font-weight="700">86.58%</text>
    <text x="0" y="324" class="cue">N-TUPLE · TAPERED EVAL</text>
  </g>`,
        '#f0a33c'
    );
}

function buildDqn() {
    let bricks = '';
    const colors = ['#e24d4d', '#f08a35', '#edc74c', '#53b982'];
    for (let row = 0; row < 4; row += 1) {
        for (let col = 0; col < 10; col += 1) {
            bricks += `<rect x="${104 + col * 47}" y="${160 + row * 28}" width="42" height="21" rx="2" fill="${colors[row]}" opacity="${col === 6 && row === 2 ? '.25' : '1'}"/>`;
        }
    }
    return svgDocument(
        'DQN Breakout control animation / DQN 打砖块控制动画',
        'A Breakout-style game frame feeds a replay buffer and changing Q values.',
        `${header('DQN', 'BREAKOUT · DEEP REINFORCEMENT LEARNING')}
  <rect x="78" y="142" width="520" height="398" rx="6" fill="#06080b" stroke="#56616d" stroke-width="3"/>
  ${bricks}
  <rect x="285" y="505" width="116" height="15" rx="7" fill="#e9edf1">
    <animate attributeName="x" values="120;390;210;285" dur="6s" repeatCount="indefinite"/>
  </rect>
  <circle cx="320" cy="456" r="10" fill="#e9edf1">
    <animate attributeName="cx" values="320;520;400;155;320" dur="6s" repeatCount="indefinite"/>
    <animate attributeName="cy" values="456;250;490;310;456" dur="6s" repeatCount="indefinite"/>
  </circle>
  <g transform="translate(650 160)">
    <text x="0" y="0" class="cue">Q VALUES</text>
    <text x="0" y="55" class="cue">LEFT</text><rect x="72" y="36" width="180" height="20" fill="#272e36"/><rect x="72" y="36" width="86" height="20" fill="#5aa3d6"/>
    <text x="0" y="105" class="cue">STAY</text><rect x="72" y="86" width="180" height="20" fill="#272e36"/><rect x="72" y="86" width="42" height="20" fill="#7d8792"/>
    <text x="0" y="155" class="cue">RIGHT</text><rect x="72" y="136" width="180" height="20" fill="#272e36"/><rect x="72" y="136" width="154" height="20" fill="#f08a35" class="blink"/>
    <rect x="0" y="202" width="252" height="142" rx="6" fill="#15191e" stroke="#39414a"/>
    <text x="20" y="238" class="cue">REPLAY BUFFER</text>
    <g transform="translate(20 260)"><rect width="45" height="55" fill="#26303a"/><rect x="56" width="45" height="55" fill="#34414d"/><rect x="112" width="45" height="55" fill="#40505e"/><rect x="168" width="45" height="55" fill="#f08a35" class="blink"/></g>
  </g>`,
        '#f08a35'
    );
}

function buildAlphaGo() {
    const stones = [
        [3, 3, '#111214', '0s'],
        [15, 15, '#f5f2ea', '.4s'],
        [3, 15, '#111214', '.8s'],
        [15, 3, '#f5f2ea', '1.2s'],
        [9, 9, '#111214', '1.6s'],
        [10, 10, '#f5f2ea', '2s'],
        [7, 11, '#111214', '2.4s'],
        [8, 11, '#f5f2ea', '2.8s'],
        [9, 11, '#111214', '3.2s'],
        [10, 11, '#f5f2ea', '3.6s']
    ];
    return svgDocument(
        'AlphaGo versus Lee Sedol game four animation / AlphaGo 对李世石第四局动画',
        'A Go board develops toward the celebrated move 78 while policy and value estimates change.',
        `${header('ALPHAGO', 'LEE SEDOL MATCH · GAME 4 · 2016')}
  ${goBoard(95, 155, 390, stones)}
  <circle cx="${95 + 8 * (390 / 18)}" cy="${155 + 10 * (390 / 18)}" r="13" fill="#f5f2ea" stroke="#ef5b4f" stroke-width="5" class="pulse"/>
  <text x="${95 + 8 * (390 / 18)}" y="${160 + 10 * (390 / 18)}" text-anchor="middle" font-size="11" font-weight="700" fill="#17191c">78</text>
  <g transform="translate(570 170)">
    <text x="0" y="0" class="cue">MOVE 78</text>
    <text x="0" y="52" fill="#ef5b4f" font-size="28" font-weight="700">THE TURNING POINT</text>
    <rect x="0" y="84" width="288" height="1" fill="#414850"/>
    <text x="0" y="132" class="cue">POLICY</text><rect x="0" y="150" width="288" height="22" fill="#283039"/><rect x="0" y="150" width="218" height="22" fill="#4b9bce" class="blink"/>
    <text x="0" y="214" class="cue">VALUE</text><rect x="0" y="232" width="288" height="22" fill="#283039"/><rect x="0" y="232" width="164" height="22" fill="#ef5b4f"/>
    <g transform="translate(0 298)">
      <circle cx="38" cy="38" r="34" fill="#15191e" stroke="#4b9bce" stroke-width="4"/><text x="38" y="45" text-anchor="middle" fill="#f4eee4" font-size="17" font-weight="700">MCTS</text>
      <path d="M80 38 H210" stroke="#7b858f" stroke-width="5" marker-end="url(#arrow)"/>
      <circle cx="252" cy="38" r="34" fill="#ef5b4f" class="pulse"/>
    </g>
  </g>
  <defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#7b858f"/></marker></defs>`,
        '#ef5b4f'
    );
}

function buildAlphaZero() {
    const mini = (x, y, label, kind, accent) => {
        let body = `<rect x="${x}" y="${y}" width="230" height="250" rx="6" fill="#15191e" stroke="#3b424a" stroke-width="2"/><text x="${x + 20}" y="${y + 36}" class="cue">${label}</text>`;
        if (kind === 'chess') body += chessBoard(x + 30, y + 58, 170);
        if (kind === 'go')
            body += goBoard(x + 48, y + 74, 134, [
                [3, 3, '#111214'],
                [14, 14, '#f5f2ea'],
                [9, 9, '#111214']
            ]);
        if (kind === 'shogi') {
            body += `<rect x="${x + 30}" y="${y + 58}" width="170" height="170" fill="#d4b477" stroke="#f0d7a5" stroke-width="2"/>`;
            for (let i = 1; i < 9; i += 1)
                body += `<line x1="${x + 30 + (i * 170) / 9}" y1="${y + 58}" x2="${x + 30 + (i * 170) / 9}" y2="${y + 228}" stroke="#584123"/><line x1="${x + 30}" y1="${y + 58 + (i * 170) / 9}" x2="${x + 200}" y2="${y + 58 + (i * 170) / 9}" stroke="#584123"/>`;
        }
        body += `<circle cx="${x + 206}" cy="${y + 30}" r="9" fill="${accent}" class="pulse"/>`;
        return body;
    };
    return svgDocument(
        'AlphaZero self-play across chess shogi and Go / AlphaZero 在国际象棋将棋和围棋中的自我对弈',
        'Three game boards train under one self-play and search loop.',
        `${header('ALPHAZERO', 'ONE ALGORITHM · THREE GAMES')}
  ${mini(72, 160, 'CHESS', 'chess', '#4da4d8')}
  ${mini(365, 160, 'SHOGI', 'shogi', '#f0a33c')}
  ${mini(658, 160, 'GO', 'go', '#4eb58b')}
  <path d="M185 445 C260 545 700 545 775 445" fill="none" stroke="#737d87" stroke-width="5" stroke-dasharray="10 12"/>
  <circle cx="185" cy="445" r="10" fill="#4da4d8"><animate attributeName="cx" values="185;480;775;185" dur="7s" repeatCount="indefinite"/><animate attributeName="cy" values="445;525;445;445" dur="7s" repeatCount="indefinite"/></circle>
  <text x="480" y="548" text-anchor="middle" class="cue">SELF-PLAY · SEARCH · UPDATE</text>`,
        '#4da4d8'
    );
}

function buildLibratus() {
    return svgDocument(
        'Libratus heads-up poker animation / Libratus 单挑扑克动画',
        'A heads-up poker hand reveals community cards while subgame solving refines the strategy.',
        `${header('LIBRATUS', 'BRAINS VS AI · HEADS-UP POKER')}
  <ellipse cx="360" cy="355" rx="270" ry="170" fill="#1d604d" stroke="#9f7d4d" stroke-width="18"/>
  ${card(245, 314, 'A♠', '#f4efe5', '#15191e', -4)}${card(314, 312, 'K♠', '#f4efe5', '#15191e', 3)}
  ${card(390, 314, '10♦', '#f4efe5', '#b93636', -2)}${card(459, 312, 'J♦', '#f4efe5', '#b93636', 3)}${card(528, 314, 'Q♣', '#f4efe5', '#15191e', -2)}
  <g opacity="0">${card(597, 312, '2♥', '#f4efe5', '#b93636', 3)}<animate attributeName="opacity" values="0;0;1;1" keyTimes="0;.45;.5;1" dur="7s" repeatCount="indefinite"/></g>
  <circle cx="170" cy="275" r="34" fill="#d9cab1"/><circle cx="550" cy="210" r="34" fill="#3c4650"/>
  <text x="170" y="335" text-anchor="middle" class="cue">PRO</text><text x="550" y="270" text-anchor="middle" class="cue">AI</text>
  <g transform="translate(690 175)">
    <text x="0" y="0" class="cue">SUBGAME SOLVER</text>
    <path d="M105 45 L45 118 M105 45 L165 118 M45 118 L18 200 M45 118 L75 200 M165 118 L137 200 M165 118 L195 200" fill="none" stroke="#6f7983" stroke-width="4"/>
    <circle cx="105" cy="45" r="13" fill="#e9b54f" class="pulse"/><circle cx="45" cy="118" r="10" fill="#d8c9b0"/><circle cx="165" cy="118" r="10" fill="#d8c9b0"/>
    <circle cx="18" cy="200" r="8" fill="#73808b"/><circle cx="75" cy="200" r="8" fill="#e9b54f"/><circle cx="137" cy="200" r="8" fill="#73808b"/><circle cx="195" cy="200" r="8" fill="#73808b"/>
    <text x="0" y="270" class="cue">BLUFF FREQUENCY</text>
    <rect x="0" y="288" width="210" height="22" fill="#293039"/><rect x="0" y="288" width="142" height="22" fill="#e9b54f" class="blink"/>
  </g>`,
        '#e9b54f'
    );
}

function buildPluribus() {
    const seats = [
        [290, 165],
        [505, 165],
        [620, 335],
        [505, 505],
        [290, 505],
        [175, 335]
    ];
    return svgDocument(
        'Pluribus six-player poker animation / Pluribus 六人扑克动画',
        'Six players act around one poker table while the blueprint strategy updates bets.',
        `${header('PLURIBUS', 'SIX-PLAYER NO-LIMIT HOLD’EM')}
  <ellipse cx="395" cy="345" rx="255" ry="155" fill="#245c4f" stroke="#95754c" stroke-width="16"/>
  ${seats.map(([cx, cy], index) => `<circle cx="${cx}" cy="${cy}" r="35" fill="${index === 2 ? '#e8b64f' : '#343c45'}" stroke="#0b0d10" stroke-width="3"${index === 2 ? ' class="pulse"' : ''}/><text x="${cx}" y="${cy + 6}" text-anchor="middle" fill="#f3ece1" font-size="15" font-weight="700">P${index + 1}</text>`).join('')}
  ${card(302, 310, 'A♣', '#f4efe5', '#17191d', -2)}${card(371, 308, '7♦', '#f4efe5', '#b93636', 2)}${card(440, 310, '7♣', '#f4efe5', '#17191d', -2)}
  <g transform="translate(705 175)">
    <text x="0" y="0" class="cue">BLUEPRINT</text>
    <circle cx="100" cy="105" r="72" fill="#15191e" stroke="#4a535d" stroke-width="3"/>
    <path d="M100 105 L100 35 M100 105 L165 75 M100 105 L155 145 M100 105 L45 145 M100 105 L35 75" stroke="#e8b64f" stroke-width="5"/>
    <circle cx="100" cy="105" r="12" fill="#e8b64f" class="pulse"/>
    <text x="0" y="226" class="cue">BET SIZES</text>
    <g transform="translate(0 248)"><rect width="42" height="72" fill="#56616c"/><rect x="56" y="30" width="42" height="42" fill="#74808b"/><rect x="112" y="12" width="42" height="60" fill="#e8b64f" class="blink"/><rect x="168" y="42" width="42" height="30" fill="#56616c"/></g>
  </g>
  <circle cx="620" cy="410" r="12" fill="#e8b64f"><animate attributeName="cx" values="620;505;290;175;290;505;620" dur="7s" repeatCount="indefinite"/><animate attributeName="cy" values="410;505;505;335;165;165;410" dur="7s" repeatCount="indefinite"/></circle>`,
        '#e8b64f'
    );
}

function mahjongTile(x, y, label, stroke = '#2e3740', fill = '#f2eadb') {
    return `<g transform="translate(${x} ${y})"><rect width="50" height="70" rx="5" fill="${fill}" stroke="${stroke}" stroke-width="3"/><text x="25" y="44" text-anchor="middle" font-size="22" font-weight="700" fill="${stroke}">${xml(label)}</text></g>`;
}

function buildSuphx() {
    const hand = ['1m', '2m', '3m', '4p', '5p', '6p', '2s', '3s', '4s', 'E', 'E', '7s', '9s', '5m'];
    return svgDocument(
        'Suphx mahjong decision animation / Suphx 麻将决策动画',
        'A Mahjong hand compares an aggressive discard with keeping a safe tile for defense.',
        `${header('SUPHX', 'TENHOU · RIICHI MAHJONG')}
  <rect x="70" y="142" width="600" height="390" rx="12" fill="#245d50" stroke="#a28155" stroke-width="8"/>
  <g transform="translate(145 190) rotate(90)">${mahjongTile(0, 0, '3m')}${mahjongTile(56, 0, '7p')}${mahjongTile(112, 0, 'E')}</g>
  <g transform="translate(515 190) rotate(90)">${mahjongTile(0, 0, '4s')}${mahjongTile(56, 0, '9m')}${mahjongTile(112, 0, 'S')}</g>
  <g transform="translate(250 225)">${mahjongTile(0, 0, '6m')}${mahjongTile(56, 0, '1p')}${mahjongTile(112, 0, 'E')}</g>
  <g transform="translate(85 442) scale(.72)">${hand.map((label, index) => mahjongTile(index * 56, 0, label, index === 12 ? '#d84d45' : index === 13 ? '#3d9fd3' : '#303942')).join('')}</g>
  <rect x="516" y="427" width="40" height="66" fill="none" stroke="#d84d45" stroke-width="5" class="blink"/>
  <rect x="556" y="427" width="40" height="66" fill="none" stroke="#3d9fd3" stroke-width="5" class="pulse"/>
  <g transform="translate(715 170)">
    <text x="0" y="0" class="cue">DISCARD POLICY</text>
    <text x="0" y="58" fill="#d84d45" font-size="18" font-weight="700">ATTACK</text><rect x="0" y="75" width="180" height="22" fill="#293039"/><rect x="0" y="75" width="132" height="22" fill="#d84d45"/>
    <text x="0" y="140" fill="#3d9fd3" font-size="18" font-weight="700">SAFE TILE</text><rect x="0" y="157" width="180" height="22" fill="#293039"/><rect x="0" y="157" width="158" height="22" fill="#3d9fd3" class="blink"/>
    <rect x="0" y="220" width="180" height="128" rx="6" fill="#15191e" stroke="#3b434c"/>
    <text x="18" y="254" class="cue">RANK GOAL</text><text x="18" y="304" fill="#e9b54f" font-size="42" font-weight="700">#1</text><text x="18" y="334" class="cue">DEFEND THE LEAD</text>
  </g>`,
        '#3d9fd3'
    );
}

function buildMuZero() {
    const panel = (x, y, label, color, glyph) =>
        `<g transform="translate(${x} ${y})"><rect width="170" height="150" rx="6" fill="#15191e" stroke="#3b434c" stroke-width="2"/><text x="18" y="32" class="cue">${label}</text><text x="85" y="105" text-anchor="middle" fill="${color}" font-size="56" font-weight="700">${glyph}</text><circle cx="146" cy="26" r="8" fill="${color}" class="pulse"/></g>`;
    return svgDocument(
        'MuZero planning across games animation / MuZero 跨游戏规划动画',
        'Go, chess, shogi and Atari observations pass through learned hidden states before planning.',
        `${header('MUZERO', 'LEARNED MODEL · NO GIVEN RULES')}
  ${panel(70, 160, 'GO', '#4fb58b', '●')}
  ${panel(270, 160, 'CHESS', '#4da4d8', 'N')}
  ${panel(470, 160, 'SHOGI', '#e6a044', '歩')}
  ${panel(670, 160, 'ATARI', '#e35d6a', '▰')}
  <path d="M155 335 C155 415 280 415 280 465 H680 C680 415 755 415 755 335" fill="none" stroke="#6f7983" stroke-width="5"/>
  <g transform="translate(215 430)">
    <circle cx="0" cy="45" r="34" fill="#183a55" stroke="#4da4d8" stroke-width="4"/><text x="0" y="51" text-anchor="middle" fill="#f4eee4" font-size="18" font-weight="700">h</text>
    <path d="M40 45 H130" stroke="#6f7983" stroke-width="5"/>
    <circle cx="170" cy="45" r="34" fill="#19443a" stroke="#4fb58b" stroke-width="4"/><text x="170" y="51" text-anchor="middle" fill="#f4eee4" font-size="18" font-weight="700">g</text>
    <path d="M210 45 H300" stroke="#6f7983" stroke-width="5"/>
    <circle cx="340" cy="45" r="34" fill="#513b1b" stroke="#e6a044" stroke-width="4"/><text x="340" y="51" text-anchor="middle" fill="#f4eee4" font-size="18" font-weight="700">f</text>
    <path d="M380 45 H470" stroke="#6f7983" stroke-width="5"/>
    <circle cx="510" cy="45" r="34" fill="#5c242d" stroke="#e35d6a" stroke-width="4" class="pulse"/><text x="510" y="51" text-anchor="middle" fill="#f4eee4" font-size="18" font-weight="700">π</text>
  </g>
  <rect x="-160" y="127" width="150" height="438" fill="#ffffff" opacity=".05" class="scan"/>`,
        '#e35d6a'
    );
}

const assets = {
    '1951-strachey-draughts.svg': buildStrachey(),
    '1988-td-gammon.svg': buildTdGammon(),
    '1994-chinook-game-2.svg': buildChinook(),
    '1997-logistello-game-1.svg': buildLogistello(),
    '1997-deep-blue-rematch.svg': buildDeepBlue(),
    '2000s-alphacat-xiangqi.svg': buildAlphaCat(),
    '2013-dqn-breakout.svg': buildDqn(),
    '2016-alphago-game-4.svg': buildAlphaGo(),
    '2017-alphazero-three-games.svg': buildAlphaZero(),
    '2017-libratus-heads-up.svg': buildLibratus(),
    '2019-pluribus-six-player.svg': buildPluribus(),
    '2019-suphx-safe-tile.svg': buildSuphx(),
    '2019-muzero-multi-game.svg': buildMuZero()
};

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
for (const [filename, content] of Object.entries(assets)) {
    fs.writeFileSync(path.join(OUTPUT_DIR, filename), content, 'utf8');
}

console.log(`Generated ${Object.keys(assets).length} gaming media assets in ${path.relative(ROOT, OUTPUT_DIR)}.`);
