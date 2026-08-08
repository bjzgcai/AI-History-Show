#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PLAN_PATH = path.join(ROOT, 'resources', 'audio', 'plans', 'ai100-first-40-and-gaming', 'editorial-plan.json');
const OUTPUT_ROOT = path.join(ROOT, 'resources', 'audio', 'scripts', 'ai100-first-40-and-gaming');
const STRUCTURED_ROOT = path.join(OUTPUT_ROOT, 'structured');
const COMPILED_ROOT = path.join(OUTPUT_ROOT, 'compiled');
const ARCHIVE_EVENTS = path.join(ROOT, 'archive', 'events');

const VOICE_PROFILES = {
    zh: {
        language: 'zh',
        voiceA: 'zh_female_vv_uranus_bigtts',
        voiceB: 'ICL_uranus_zh_male_qinglangwenrun_tob',
        voiceSummary: 'ICL_uranus_zh_male_qinglangwenrun_tob',
        instructionA: '请用亲切、好奇、自然的普通话提问，像科普节目主持人。语速中等，避免广告腔。',
        instructionB:
            '请用清朗、温和、自然的普通话讲解，像知识型播客中的青年科普嘉宾。整体语速中等，语气放松、有交流感；年份、技术名词和英文缩写要清楚咬字，重点概念前后自然停顿。不要使用低沉浑厚的纪录片播音腔、新闻播报腔、广告腔或过度表演。标点符号只用于控制停顿，不要读出“冒号”“分号”等符号名称。',
        instructionSummary:
            '请像自然结束当前讲述一样，用清朗、自然、简洁的普通话表达。保持与正文接近的语速和音量，不要突然压低声音，不要使用播报式收束，也不要说“总结”“总的来说”或“由此可见”。标点只作为停顿，不要读出符号名称。'
    },
    en: {
        language: 'en',
        voiceA: 'en_female_wenrouzhishijieshuonv_uranus_bigtts',
        voiceB: 'en_male_alberto_uranus_bigtts',
        voiceSummary: 'en_male_alberto_uranus_bigtts',
        instructionA:
            'Speak in clear, warm, curious English like a science-program host. Keep the pace conversational and avoid promotional delivery.',
        instructionB:
            'Speak in calm, informed, documentary-style English. Use a measured pace, articulate dates and technical names clearly, and pause lightly around key ideas without sounding theatrical.',
        instructionSummary:
            'Deliver the closing in concise, calm English with a slight slowdown and a clear sense of closure.'
    }
};

const HOOKS = {
    '1950-turing-test': {
        zh: '如果隔着一面墙，只能靠打字交流，你真能判断对面是人还是机器吗？',
        en: 'If a wall hid the other participant and typing was your only clue, could you reliably tell a human from a machine?'
    },
    '1971-complexity-theory': {
        zh: '为什么旅行路线、排班和逻辑谜题看起来毫不相干，却可能撞上同一堵计算高墙？',
        en: 'Why can route planning, scheduling, and logic puzzles look unrelated yet collide with the same computational wall?'
    },
    '1971-vc-theory': {
        zh: '一个模型把训练题全背下来，为什么面对新题时仍可能一败涂地？',
        en: 'Why can a model memorize every training example and still fail badly on something new?'
    },
    '1956-logic-theorist': {
        zh: '想象一台早期计算机没有在算数字，而是在《数学原理》的公式间寻找一条证明路线。它会从哪里下手？',
        en: 'Imagine an early computer searching through Principia Mathematica not for a number, but for a route to a proof. Where would it begin?'
    },
    '1958-wangs-algorithm': {
        zh: '如果证明定理也能像识别图案一样，先看结构、再按规则拆解，会发生什么？',
        en: 'What if proving a theorem could begin like recognizing a pattern: inspect the structure, then reduce it by rule?'
    },
    '1960-davis-putnam-dpll': {
        zh: '面对成千上万个真假选择，机器怎样避免把每一扇门都推开一遍？',
        en: 'Faced with thousands of true-or-false choices, how can a machine avoid opening every possible door?'
    },
    '1965-resolution-method': {
        zh: '如果把一场逻辑证明变成寻找矛盾的法庭辩论，只保留一条统一规则，机器还能完成推理吗？',
        en: 'If a proof became a courtroom search for contradiction using one uniform rule, could a machine carry the argument through?'
    },
    '1990-otter': {
        zh: '一条漂亮的推理规则，怎样才能变成真正能在海量子句中工作的证明软件？',
        en: 'How does an elegant inference rule become proof software that can survive an ocean of clauses?'
    },
    '1958-lisp': {
        zh: '如果一张列表既能装数据，也能装程序本身，程序员会得到怎样一种新工具？',
        en: 'What changes when a list can hold ordinary data and the program that manipulates it?'
    },
    '1973-prolog': {
        zh: '如果程序员只写下事实和规则，再把寻找答案的过程交给机器，会不会更像是在提问而不是编程？',
        en: 'What if programmers wrote facts and rules, then let the machine search for an answer as though responding to a question?'
    },
    '1966-eliza': {
        zh: '一句简单的“你为什么这么想”，为什么会让人感觉屏幕后的程序似乎真的在倾听？',
        en: 'Why can a simple reply such as “Why do you feel that way?” make a program seem as if it is genuinely listening?'
    },
    '1970-shrdlu': {
        zh: '在一个只有积木、颜色和位置关系的小世界里，机器能不能把一句话真正变成行动？',
        en: 'In a tiny world of blocks, colors, and spatial relations, can a machine turn a sentence into an action?'
    },
    '2011-ibm-watson': {
        zh: '知识竞赛的问题充满双关、暗示和抢答压力，一台机器凭什么敢按下蜂鸣器？',
        en: 'Quiz-show clues are packed with wordplay, hints, and buzzer pressure. What gives a machine the confidence to answer?'
    },
    '1951-strachey-draughts': {
        zh: '在内存小得可怜的早期计算机上，让机器自己选择一步跳棋，究竟有多难？',
        en: 'On an early computer with painfully little memory, how hard was it to make the machine choose a draughts move for itself?'
    },
    '1994-chinook': {
        zh: '要把跳棋程序推到冠军级，靠的是搜索更深，还是让机器更懂什么叫好局面？',
        en: 'To push a checkers program to championship strength, is deeper search enough, or must the machine learn what a good position looks like?'
    },
    '1997-deep-blue': {
        zh: '当世界冠军坐到棋盘一侧、超级计算机坐到另一侧，这场较量真正比较的是什么？',
        en: 'When a world champion sits on one side of a chessboard and a supercomputer on the other, what is the match really comparing?'
    },
    '1959-pandemonium': {
        zh: '如果识别一个图形不是听一个专家判断，而是让一群“小声音”层层竞赛，结果会怎样？',
        en: 'What if recognizing a shape meant listening not to one expert, but to a hierarchy of small competing voices?'
    },
    '1974-frame': {
        zh: '你一听到“餐厅”，脑中就会自动补出菜单、座位和服务员。机器能不能也拥有这种知识骨架？',
        en: 'The word “restaurant” makes you expect menus, tables, and servers. Could a machine carry the same kind of knowledge skeleton?'
    },
    '1984-cyc': {
        zh: '如果要把“水会弄湿东西”这类常识一条条教给机器，这本永远写不完的百科全书该从哪里开始？',
        en: 'If common sense such as “water makes things wet” must be taught fact by fact, where does an endless encyclopedia begin?'
    },
    '1965-dendral': {
        zh: '只给机器一张质谱图，它能像化学侦探一样推断出陌生分子的结构吗？',
        en: 'Given only a mass spectrum, could a machine work like a chemical detective and infer the structure of an unfamiliar molecule?'
    },
    '1980-xcon-r1': {
        zh: '一份计算机订单有成百上千种部件组合，怎样避免昂贵设备送到客户手里才发现根本装不起来？',
        en: 'A computer order can contain hundreds of interacting parts. How do you stop an expensive system from arriving unable to fit together?'
    },
    '1957-kmeans': {
        zh: '把一把没有标签的数据点撒在桌面上，你会怎样决定它们天然分成几堆？',
        en: 'Scatter a set of unlabeled points on a table. How would you decide which points naturally belong together?'
    },
    '1996-dbscan': {
        zh: '如果数据像弯月、环带和零散噪声，为什么“找中心点”会把真正的形状切坏？',
        en: 'If data forms crescents, rings, and scattered noise, why can searching for a center destroy the shape you wanted to find?'
    },
    '2000-spectral-clustering': {
        zh: '如果不直接看点在哪里，而是看哪些点彼此连接，聚类会不会变成一次切图问题？',
        en: 'What if clustering ignored raw coordinates and instead asked which points were connected? Would the task become a graph cut?'
    },
    'ai100-1967-knn': {
        zh: '遇到一个陌生样本时，最朴素的办法是不是先问问它周围的邻居是谁？',
        en: 'When a new example appears, could the simplest useful strategy be to ask who its nearest neighbors are?'
    },
    'ai100-1970-ridge': {
        zh: '当几个特征彼此纠缠，让回归系数轻轻换批数据就剧烈摇摆，怎样给模型加一道稳定装置？',
        en: 'When correlated features make regression coefficients swing wildly from one sample to another, how can the model be stabilized?'
    },
    '1992-svm': {
        zh: '两类样本之间有很多条分界线，为什么最宽的那条“安全走廊”往往更可靠？',
        en: 'Many boundaries may separate two classes. Why is the one with the widest safety corridor often the most reliable?'
    },
    '1996-lasso': {
        zh: '如果一个模型带着太多无关特征，能不能在训练时直接把一部分系数压到零？',
        en: 'If a model carries too many irrelevant features, can training push some coefficients all the way to zero?'
    },
    '1999-sift': {
        zh: '同一个路标被旋转、缩小或换了光线，机器怎样认出它仍是同一个局部图案？',
        en: 'When the same sign is rotated, resized, or relit, how can a machine recognize that its local pattern is still the same?'
    },
    'ai100-2005-hog': {
        zh: '不去记住每个像素，只统计轮廓边缘朝向，机器还能看出一个人的形状吗？',
        en: 'Without memorizing every pixel, can a machine recognize a person by counting the directions of local edges?'
    },
    'ai100-2006-surf': {
        zh: '视觉特征如果很稳却算得太慢，能不能用积分图和近似计算把速度真正提起来？',
        en: 'If a visual feature is robust but slow, can integral images and approximations make it practical without losing its identity?'
    },
    'ai100-1997-kernel-pca': {
        zh: '一团数据弯在高维空间里，能不能不显式展开坐标，就找到它真正变化的方向？',
        en: 'If data bends through a high-dimensional space, can we find its main directions without explicitly unfolding every coordinate?'
    },
    'ai100-1999-nmf': {
        zh: '一张脸、一段音乐或一批文档，能不能只用“加法部件”拆出眼睛、音色和主题？',
        en: 'Can a face, a piece of music, or a document collection be explained as additive parts such as eyes, timbres, or topics?'
    },
    'ai100-2000-isomap': {
        zh: '在卷成筒的纸面上，两点直线很近，沿纸走却很远。机器应该相信哪一种距离？',
        en: 'On a rolled sheet, two points may be close through the air but far along the surface. Which distance should a machine trust?'
    },
    'ai100-2000-lle': {
        zh: '如果只保住每个点和近邻之间的局部关系，能不能把一张弯曲的数据薄片平整展开？',
        en: 'If every point preserves only its local relationship with nearby points, can a curved data sheet be unfolded?'
    },
    '2008-tsne': {
        zh: '一张二维散点图看起来像几个漂亮岛屿，但这些岛屿到底来自数据，还是来自画图方法？',
        en: 'A two-dimensional map may show beautiful islands. Do those islands come from the data, or from the visualization method?'
    },
    'ai100-1943-mcculloch-pitts-neuron': {
        zh: '如果把神经元简化成一个达到阈值就开启的逻辑开关，它还能组合出复杂计算吗？',
        en: 'If a neuron becomes a logical switch that fires after a threshold, can networks of such switches still compute complex things?'
    },
    'ai100-1951-snarc': {
        zh: '在神经网络还主要停留在纸面时，怎样造出一台会根据奖励改变连接的机器？',
        en: 'When neural networks were mostly equations on paper, how could anyone build a machine whose connections changed with reward?'
    },
    '1957-perceptron': {
        zh: '如果机器不再由工程师写死规则，而是自己调整权重学会分类，这算不算一次真正的学习？',
        en: 'If a machine adjusts its own weights instead of following fixed rules, does that count as genuine learning?'
    },
    '1982-hopfield-network': {
        zh: '一张残缺、带噪声的图案，为什么能在网络里逐步“滑回”一段完整记忆？',
        en: 'Why can a damaged, noisy pattern gradually slide toward a complete memory inside a network?'
    },
    '2016-alphago': {
        zh: '围棋的可能局面多到无法穷举，AlphaGo 为什么仍能在关键时刻找到人类意料之外的选择？',
        en: 'Go has too many possible positions to enumerate. How could AlphaGo still discover choices that surprised expert players?'
    },
    '1988-td-update': {
        zh: '比赛还没有结束，智能体为什么已经能用“预测错了多少”来修正下一步判断？',
        en: 'Before a game has ended, how can an agent learn simply from how wrong its latest prediction was?'
    },
    '1997-logistello': {
        zh: '黑白棋棋盘只剩几十格，为什么一个冠军级程序仍需要学习怎样评价看似平静的中盘？',
        en: 'An Othello board has only sixty-four squares. Why does a champion program still need to learn how to value a quiet-looking position?'
    },
    '2000s-alphacat': {
        zh: '中国象棋里炮能隔子吃子、将帅又不能照面，搜索和局面评估怎样在这些规则中配合？',
        en: 'Chinese chess has cannons that capture across screens and generals that may not face each other. How do search and evaluation cooperate under such rules?'
    },
    '2013-dqn': {
        zh: '只看屏幕像素、接收游戏分数，一台机器能不能自己学会什么时候按下摇杆？',
        en: 'Given only screen pixels and a score, can a machine teach itself when to move a joystick?'
    },
    '2017-alphazero': {
        zh: '如果不给棋谱、不开局库，只给规则和一面能与自己对弈的镜子，机器能学到多远？',
        en: 'With no human game records or opening book, only rules and a mirror for self-play, how far can a machine learn?'
    },
    '2017-libratus': {
        zh: '对手的底牌看不见，下注还可能是在诈唬，机器怎样在不完整信息里保持冷静？',
        en: 'The opponent’s cards are hidden and a bet may be a bluff. How can a machine stay rational with incomplete information?'
    },
    '2019-pluribus': {
        zh: '扑克桌从两个人变成六个人后，每个对手都在改变局势，原来的均衡策略还够用吗？',
        en: 'When a poker table grows from two players to six, every opponent reshapes the incentives. Is the old equilibrium logic enough?'
    },
    '2019-suphx': {
        zh: '看不见别人的手牌，还要跨多局权衡进攻和防守，麻将 AI 怎样学会管理风险？',
        en: 'With opponents’ tiles hidden and risk unfolding across many hands, how can a mahjong AI learn when to attack or defend?'
    },
    '2019-muzero': {
        zh: '如果智能体不知道环境的精确规则，它还能在脑中建立一个足够用于规划的世界吗？',
        en: 'If an agent is not given the exact rules of its environment, can it still build an internal world sufficient for planning?'
    }
};

const OPEN_QUESTIONS = {
    '1950-turing-test': {
        zh: '当语言表现越来越像人，我们该用什么证据区分流畅模仿与真正理解？',
        en: 'As machine language becomes more humanlike, what evidence can separate fluent imitation from genuine understanding?'
    },
    '1960-davis-putnam-dpll': {
        zh: '启发式和剪枝可以把搜索推得很远，但它们究竟能在多大程度上绕开问题固有的复杂性？',
        en: 'Heuristics and pruning can push search remarkably far, but how much can they really escape the problem’s underlying complexity?'
    },
    '1966-eliza': {
        zh: '当一句反问就能让人感到被理解，我们应该怎样检验屏幕后究竟是共情，还是精巧的语言反射？',
        en: 'When a reflected question feels empathetic, how should we test whether the screen contains understanding or only a skillful verbal mirror?'
    },
    '1970-shrdlu': {
        zh: '当机器在边界清晰的小世界里表现得像真正理解，我们该如何判断这种理解能否走到边界之外？',
        en: 'When a machine appears to understand inside a tightly bounded world, how can we know whether that understanding can travel beyond the boundary?'
    },
    '1984-cyc': {
        zh: '常识会随文化、情境和时代改变，那么一座手工建造的常识库究竟有没有“完成”的那一天？',
        en: 'Common sense shifts with culture, context, and time. Can a hand-built common-sense knowledge base ever truly be finished?'
    },
    '1957-kmeans': {
        zh: '当算法给出几个整齐的簇时，我们看到的是数据本来的结构，还是自己预先规定的“中心”观念？',
        en: 'When the algorithm returns tidy clusters, are we seeing the data’s natural structure or the idea of a center that we imposed on it?'
    },
    'ai100-1997-kernel-pca': {
        zh: '当结果取决于核函数的选择，我们是在发现数据的几何结构，还是在用自己的假设塑造它？',
        en: 'When the result depends on the chosen kernel, are we discovering the data’s geometry or shaping it with our assumptions?'
    },
    '2008-tsne': {
        zh: '面对一张极具说服力的降维图，我们怎样分辨真实结构、参数选择和视觉错觉？',
        en: 'When a dimensionality-reduction map looks persuasive, how do we separate real structure from parameter choices and visual illusion?'
    },
    '1957-perceptron': {
        zh: '当机器能够从样本中调整权重，我们该把“学会分类”和“理解所见”之间的界线画在哪里？',
        en: 'Once a machine can adjust weights from examples, where should we draw the line between learning to classify and understanding what it sees?'
    },
    '1982-hopfield-network': {
        zh: '如果记忆是能量地形中的吸引子，当多段记忆相互冲突时，网络会找回真相，还是生成一个折中的幻象？',
        en: 'If memories are attractors in an energy landscape, what happens when several memories conflict: recovery, or a convincing hybrid?'
    },
    '2017-libratus': {
        zh: '当均衡策略走出牌桌，进入谈判和安全决策，我们还愿意把“不可被利用”当成最重要的目标吗？',
        en: 'When equilibrium strategies leave the poker table for negotiation or security decisions, is being unexploitable still the goal we value most?'
    },
    '2019-suphx': {
        zh: '当 AI 比人更稳定地管理风险，它是真的理解了不确定性，还是只学会了更精细的长期模式？',
        en: 'When an AI manages risk more consistently than people, does it understand uncertainty, or has it learned a finer long-term pattern?'
    },
    '2019-muzero': {
        zh: '为了做出好决策，一个世界模型究竟需要知道现实的多少细节，又可以放心忘掉多少？',
        en: 'To make good decisions, how much of the world must an internal model know, and how much can it safely forget?'
    }
};

const RELATION_TYPE_TEXT = {
    'problem-echo': { zh: '同一个问题的回响', en: 'an echo of the same problem' },
    'method-contrast': { zh: '方法上的对照', en: 'a contrast in method' },
    'task-scale-evolution': { zh: '任务规模的扩展', en: 'an expansion in task scale' },
    'theory-contrast': { zh: '理论边界的对照', en: 'a contrast between theoretical boundaries' },
    'technical-lineage': { zh: '技术方法的延续', en: 'a technical lineage' },
    'application-progression': { zh: '应用能力的推进', en: 'a progression in application' },
    'language-contrast': { zh: '编程思想的对照', en: 'a contrast in programming ideas' },
    'game-system-lineage': { zh: '博弈系统的演进', en: 'a lineage of game-playing systems' },
    'game-system-contrast': { zh: '不同博弈系统的对照', en: 'a contrast between game-playing systems' },
    'public-milestone': { zh: '公众突破的连续出现', en: 'a sequence of public breakthroughs' },
    'knowledge-representation': { zh: '知识表示路线的延伸', en: 'an extension of knowledge representation' },
    'classifier-contrast': { zh: '分类方法的对照', en: 'a contrast between classifiers' },
    'regularization-lineage': { zh: '正则化思想的延续', en: 'a lineage of regularization ideas' },
    'feature-lineage': { zh: '视觉特征方法的演进', en: 'an evolution of visual features' },
    'nonlinear-representation': { zh: '非线性表示方法的对照', en: 'a contrast in nonlinear representation' },
    'visualization-progression': { zh: '降维可视化方法的推进', en: 'a progression in dimensionality reduction' },
    'neural-lineage': { zh: '神经网络思想的延续', en: 'a neural-network lineage' },
    'learning-lineage': { zh: '学习方法的延续', en: 'a learning-method lineage' },
    'go-lineage': { zh: '棋类程序路线的演进', en: 'an evolution in game-playing systems' },
    'self-play-lineage': { zh: '自我对弈路线的延续', en: 'a lineage of self-play systems' },
    'planning-lineage': { zh: '学习与规划的延续', en: 'a lineage connecting learning and planning' },
    'imperfect-information-lineage': { zh: '不完全信息博弈的推进', en: 'a progression in imperfect-information games' },
    'hidden-information-contrast': { zh: '隐藏信息决策的对照', en: 'a contrast in hidden-information decisions' }
};

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function writeFormatted(filePath, content) {
    const config = (await prettier.resolveConfig(filePath)) || {};
    const formatted = await prettier.format(content, { ...config, filepath: filePath });
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, formatted);
}

function decodeEntities(value) {
    const entities = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&nbsp;': ' '
    };
    return value.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (match) => entities[match] || match);
}

function cleanHtml(value) {
    return decodeEntities(String(value || ''))
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s+([，。！？；：,.!?;:])/g, '$1')
        .trim();
}

function cleanEditorialBoilerplate(text, locale) {
    if (locale === 'zh') {
        return text
            .replace(/这段背景帮助观众把.+?放回当时的技术问题和研究重点中理解。?/g, '')
            .replace(/互动演示会突出这些步骤如何把资料线索与可见的系统行为连接起来。?/g, '')
            .replace(/关键机制是.+?，它把资料线索与可见的演示行为连接起来。?/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    return text
        .replace(
            /This context helps viewers place .+? in the technical problems and research priorities of its time\.?/g,
            ''
        )
        .replace(
            /The interactive demo focuses on the steps that connect the source material to the visible system behavior\.?/g,
            ''
        )
        .replace(/The key mechanism is .+?, which links the source material to the visible demo behavior\.?/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractParagraphs(value) {
    const source = String(value || '');
    const htmlParagraphs = [...source.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((match) => cleanHtml(match[1]));
    if (htmlParagraphs.length) return htmlParagraphs.filter(Boolean);
    return source
        .split(/\n\s*\n/)
        .map((paragraph) => cleanHtml(paragraph))
        .filter(Boolean);
}

function unique(values) {
    return [...new Set(values.filter(Boolean))];
}

function turn(role, text, evidence = {}) {
    return {
        role,
        text,
        sourceIds: evidence.sourceIds || [],
        claimIds: evidence.claimIds || [],
        contentOrigin: evidence.contentOrigin || 'editorial'
    };
}

function sectionTurns(eventPlan, variant, locale) {
    const sections = variant.commentarySections.map((section) => ({
        id: section.id,
        text: cleanEditorialBoilerplate(cleanHtml(section.html[locale]), locale),
        sourceIds: section.sourceIds || []
    }));
    const paragraphs = extractParagraphs(variant.displayDescription?.[locale]);
    const backgroundText = paragraphs[0] || sections[0].text;
    const explanationText =
        paragraphs.slice(1).join(' ') ||
        sections
            .slice(1)
            .map((section) => section.text)
            .join(' ');
    const backgroundSources = unique([...sections[0].sourceIds, ...sections[1].sourceIds]);
    const explanationSources = unique([...sections[1].sourceIds, ...sections[2].sourceIds]);
    const evidence = (sourceIds, origin) => ({
        sourceIds,
        claimIds: eventPlan.audit.selectedClaimIds,
        contentOrigin: origin
    });
    const mechanismQuestion =
        locale === 'zh'
            ? '这听起来像一个漂亮的想法。真正让它运转起来的机制是什么？'
            : 'That sounds elegant, but what mechanism actually makes it work?';
    if (eventPlan.editorial.format === 'narration') {
        return [
            turn('N', backgroundText, evidence(backgroundSources, 'variant.displayDescription.background')),
            turn('N', explanationText, evidence(explanationSources, 'variant.displayDescription.explanation'))
        ];
    }
    if (eventPlan.editorial.format === 'hybrid') {
        return [
            turn('N', backgroundText, evidence(backgroundSources, 'variant.displayDescription.background')),
            turn('A', mechanismQuestion),
            turn('B', explanationText, evidence(explanationSources, 'variant.displayDescription.explanation'))
        ];
    }
    return [
        turn('B', backgroundText, evidence(backgroundSources, 'variant.displayDescription.background')),
        turn('A', mechanismQuestion),
        turn('B', explanationText, evidence(explanationSources, 'variant.displayDescription.explanation'))
    ];
}

function introRole(format) {
    return format === 'narration' ? 'N' : 'A';
}

function factualClosingRole(format) {
    return format === 'dialogue' ? 'B' : 'N';
}

function findRelation(scope, eventId, direction = 'either') {
    return scope.relations.find((relation) => {
        if (direction === 'outgoing') return relation.fromEventId === eventId;
        if (direction === 'incoming') return relation.toEventId === eventId;
        return relation.fromEventId === eventId || relation.toEventId === eventId;
    });
}

function relatedEventId(relation, eventId) {
    if (!relation) return null;
    return relation.fromEventId === eventId ? relation.toEventId : relation.fromEventId;
}

function closingTurns(eventPlan, scope, locale, titleById) {
    const type = eventPlan.editorial.closingType;
    const title = eventPlan.title[locale];
    const evidence = {
        sourceIds: eventPlan.audit.selectedSourceIds,
        claimIds: eventPlan.audit.selectedClaimIds,
        contentOrigin: 'editorial-closing'
    };
    if (type === 'summary') {
        const text =
            locale === 'zh'
                ? `${title}留下的关键，不只是一次成果，而是把一种可复用的方法交给了后来的研究者。`
                : `${title} mattered not only as a result, but as a reusable method that later researchers could test, adapt, and extend.`;
        return [turn('SUMMARY', text, evidence)];
    }
    if (type === 'open-question') {
        const question = OPEN_QUESTIONS[eventPlan.eventId];
        if (!question) throw new Error(`Missing open question for ${eventPlan.eventId}`);
        return [turn(introRole(eventPlan.editorial.format), question[locale], evidence)];
    }
    const relation =
        type === 'forward-hook'
            ? findRelation(scope, eventPlan.eventId, 'outgoing')
            : findRelation(scope, eventPlan.eventId, 'either');
    const fallbackTarget = scope.events[eventPlan.sequenceIndex]?.eventId || null;
    const targetId = relatedEventId(relation, eventPlan.eventId) || fallbackTarget;
    const targetTitle = targetId ? titleById.get(targetId)?.[locale] : null;
    const relationText = relation ? RELATION_TYPE_TEXT[relation.relationType]?.[locale] : null;
    let text;
    if (type === 'forward-hook') {
        text = targetTitle
            ? locale === 'zh'
                ? `这条线索还没有结束。下一段来到「${targetTitle}」，我们会看到${relationText || '同一个问题如何换一种形式继续出现'}。`
                : `The thread continues with ${targetTitle}, where we will see ${relationText || 'the same problem return in a different form'}.`
            : locale === 'zh'
              ? `${title}留下的这条线索，还会在后来的 AI 系统中继续出现。`
              : `The thread left by ${title} would continue through later AI systems.`;
    } else {
        const relationPointsBackward = relation?.toEventId === eventPlan.eventId;
        text = targetTitle
            ? locale === 'zh'
                ? relationPointsBackward
                    ? `回看「${targetTitle}」，「${title}」让我们听见了${relationText || '一段跨越年代的技术回响'}。`
                    : `多年后在「${targetTitle}」中，人们仍能听见「${title}」留下的${relationText || '技术回响'}。`
                : relationPointsBackward
                  ? `Seen alongside ${targetTitle}, ${title} becomes ${relationText || 'an echo across different eras of AI'}.`
                  : `Years later, ${targetTitle} would still carry ${relationText || 'an echo'} from ${title}.`
            : locale === 'zh'
              ? `${title}留下的影响，后来一次又一次出现在 AI 的技术选择中。`
              : `${title} would echo through later choices in AI research and engineering.`;
    }
    return [turn(factualClosingRole(eventPlan.editorial.format), text, evidence)];
}

function bridgeIntro(eventPlan, previousEvent, scope, locale) {
    if (!previousEvent) return [turn(introRole(eventPlan.editorial.format), HOOKS[eventPlan.eventId][locale])];
    const directRelation = scope.relations.find(
        (relation) => relation.fromEventId === previousEvent.eventId && relation.toEventId === eventPlan.eventId
    );
    const previousTitle = previousEvent.title[locale];
    const currentTitle = eventPlan.title[locale];
    const relationText = directRelation ? RELATION_TYPE_TEXT[directRelation.relationType]?.[locale] : null;
    const text = directRelation
        ? locale === 'zh'
            ? `从「${previousTitle}」来到「${currentTitle}」，两者之间是一条${relationText || '值得追踪的技术线索'}。现在换一个角度继续看。`
            : `Moving from ${previousTitle} to ${currentTitle}, the connecting thread is ${relationText || 'a technical relationship worth following'}. Let us view it from a new angle.`
        : locale === 'zh'
          ? `上一段我们看到了「${previousTitle}」。现在把镜头转向「${currentTitle}」，看看 AI 面对另一类问题时怎样改变方法。`
          : `The previous story examined ${previousTitle}. Now the camera turns to ${currentTitle} and a different kind of problem for AI.`;
    return [
        turn(introRole(eventPlan.editorial.format), text, {
            sourceIds: directRelation?.evidenceSourceIds || [],
            contentOrigin: directRelation ? 'relationship-candidate' : 'storyline-sequence'
        })
    ];
}

function speechTextLength(text, locale) {
    if (locale === 'zh') {
        return [...text].filter((character) => /[\p{Script=Han}A-Za-z0-9]/u.test(character)).length;
    }
    return text.trim().split(/\s+/).filter(Boolean).length;
}

function estimateDuration(turns, locale) {
    const units = turns.reduce((sum, item) => sum + speechTextLength(item.text, locale), 0);
    const speechSeconds = locale === 'zh' ? units / 3.8 : units / 2.45;
    const pauseSeconds = Math.max(0, turns.length - 1) * 0.45;
    return Math.round(speechSeconds + pauseSeconds);
}

function compileTurns(turns, locale) {
    const labels =
        locale === 'zh'
            ? { A: 'A：', B: 'B：', N: 'N：', SUMMARY: '总结：' }
            : { A: 'A: ', B: 'B: ', N: 'N: ', SUMMARY: 'Summary: ' };
    return `${turns.map((item) => `${labels[item.role]}${item.text}`).join('\n')}\n`;
}

function fileStem(eventPlan) {
    return `${String(eventPlan.sequenceIndex).padStart(2, '0')}-${eventPlan.eventId}`;
}

function compiledRelativePath(scopeId, mode, locale, stem) {
    return path.join('compiled', scopeId, mode, locale, `${stem}.txt`);
}

function structuredRelativePath(scopeId, stem) {
    return path.join('structured', scopeId, `${stem}.json`);
}

async function buildEventScript(eventPlan, previousEvent, scope, titleById) {
    const variantPath = path.join(
        ARCHIVE_EVENTS,
        eventPlan.eventId,
        'variants',
        `${eventPlan.effectiveVariantId}.json`
    );
    const variant = readJson(variantPath);
    if (!HOOKS[eventPlan.eventId]) throw new Error(`Missing hook for ${eventPlan.eventId}`);
    const stem = fileStem(eventPlan);
    const modes = {};
    const compiledPaths = {};

    for (const locale of ['zh', 'en']) {
        const body = sectionTurns(eventPlan, variant, locale);
        const closing = closingTurns(eventPlan, scope, locale, titleById);
        const standaloneIntro = [turn(introRole(eventPlan.editorial.format), HOOKS[eventPlan.eventId][locale])];
        const storylineBridgeIn = bridgeIntro(eventPlan, previousEvent, scope, locale);
        const standalone = [...standaloneIntro, ...body, ...closing];
        const storyline = [...storylineBridgeIn, ...body, ...closing];
        modes[locale] = {
            standaloneIntro,
            storylineBridgeIn,
            body,
            closing,
            estimates: {
                standaloneSec: estimateDuration(standalone, locale),
                storylineSec: estimateDuration(storyline, locale)
            }
        };
        compiledPaths[locale] = {};
        for (const [mode, turns] of Object.entries({ standalone, storyline })) {
            const relativePath = compiledRelativePath(scope.id, mode, locale, stem);
            compiledPaths[locale][mode] = relativePath;
            const outputPath = path.join(OUTPUT_ROOT, relativePath);
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            fs.writeFileSync(outputPath, compileTurns(turns, locale));
        }
    }

    const nextEvent = scope.events[eventPlan.sequenceIndex] || null;
    const result = {
        schemaVersion: 1,
        status: eventPlan.audit.status === 'ready' ? 'sourced-draft' : 'sourced-draft-needs-archive-review',
        scopeId: scope.id,
        sequenceIndex: eventPlan.sequenceIndex,
        storylineOrder: eventPlan.storylineOrder,
        eventId: eventPlan.eventId,
        variantId: eventPlan.effectiveVariantId,
        styleAuthority: eventPlan.styleAuthority,
        title: eventPlan.title,
        format: eventPlan.editorial.format,
        narrativeStyle: eventPlan.editorial.narrativeStyle,
        closingType: eventPlan.editorial.closingType,
        targetDurationSec: eventPlan.editorial.targetDurationSec,
        bridgeFromEventId: previousEvent?.eventId || null,
        bridgeToEventId: nextEvent?.eventId || null,
        relatedFigureIds: eventPlan.audit.figureIds,
        sourceIds: eventPlan.audit.selectedSourceIds,
        claimIds: eventPlan.audit.selectedClaimIds,
        archiveAudit: {
            status: eventPlan.audit.status,
            warnings: eventPlan.audit.warnings,
            selectedClaimStatuses: eventPlan.audit.selectedClaimStatuses
        },
        voiceProfile: VOICE_PROFILES,
        locales: modes,
        compiledPaths,
        structuredPath: structuredRelativePath(scope.id, stem)
    };
    await writeFormatted(path.join(OUTPUT_ROOT, result.structuredPath), `${JSON.stringify(result, null, 2)}\n`);
    return result;
}

async function buildReadme(manifest) {
    const ai100 = manifest.scopes['bench-council-ai100'];
    const gaming = manifest.scopes['gaming-ai'];
    const content = `# AI100 前 40 项与 AI 棋牌双语音频稿

本目录由 \`scripts/audio/build-audio-story-scripts.mjs\` 生成，对应实施流程第 7–10 步的输入材料。

- AI100：${ai100.events.length} 个故事线条目
- AI 棋牌：${gaming.events.length} 个故事线条目
- 中文、英文均提供 standalone 与 storyline 两种编译版本
- 正文事实来自 Archive variant 的双语 \`commentarySections\`
- 每个事实段保留 source ID、claim ID 和内容来源字段
- 本批次只执行 TTS dry-run，不生成正式音频

## Voices

- 中文 A：\`${VOICE_PROFILES.zh.voiceA}\`
- 中文 B / Narrator / Summary：\`${VOICE_PROFILES.zh.voiceB}\`
- 英文 A：\`${VOICE_PROFILES.en.voiceA}\`
- 英文 B / Narrator / Summary：\`${VOICE_PROFILES.en.voiceB}\`

## Layout

- \`structured/<scope>/\`：事件级结构化稿件与来源映射
- \`compiled/<scope>/<mode>/<locale>/\`：A/B/N TTS 输入文本
- \`manifest.json\`：完整索引、路径与时长估算
- \`dry-run-report.json\`：第 10 步 TTS 解析结果
`;
    await writeFormatted(path.join(OUTPUT_ROOT, 'README.md'), content);
}

async function main() {
    const plan = readJson(PLAN_PATH);
    fs.rmSync(STRUCTURED_ROOT, { recursive: true, force: true });
    fs.rmSync(COMPILED_ROOT, { recursive: true, force: true });
    const titleById = new Map();
    for (const scope of Object.values(plan.scopes)) {
        for (const event of scope.events) titleById.set(event.eventId, event.title);
    }
    const manifest = {
        schemaVersion: 1,
        status: 'compiled-for-tts-dry-run',
        planPath: path.relative(ROOT, PLAN_PATH),
        outputRoot: path.relative(ROOT, OUTPUT_ROOT),
        voiceProfiles: VOICE_PROFILES,
        scopes: {}
    };

    for (const [scopeId, sourceScope] of Object.entries(plan.scopes)) {
        const scope = { id: scopeId, events: sourceScope.events, relations: sourceScope.relations };
        const events = [];
        for (let index = 0; index < scope.events.length; index += 1) {
            events.push(await buildEventScript(scope.events[index], scope.events[index - 1] || null, scope, titleById));
        }
        manifest.scopes[scopeId] = {
            eventCount: events.length,
            events
        };
    }

    await writeFormatted(path.join(OUTPUT_ROOT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    await buildReadme(manifest);
    console.log(`Created ${path.relative(ROOT, OUTPUT_ROOT)} with 53 scoped bilingual script packages.`);
}

await main();
