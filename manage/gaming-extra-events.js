'use strict';

function t(en, zh) {
  return { en, zh };
}

function paper(titleEn, titleZh, authorsEn, authorsZh, journalEn, journalZh, year, url) {
  return {
    title: t(titleEn, titleZh),
    authors: t(authorsEn, authorsZh),
    journal: t(journalEn, journalZh),
    year,
    url
  };
}

function source(typeEn, typeZh, labelEn, labelZh, url) {
  return {
    type: t(typeEn, typeZh),
    label: t(labelEn, labelZh),
    url
  };
}

function archiveLink(siteEn, siteZh, titleEn, titleZh, descriptionEn, descriptionZh, url) {
  return {
    type: 'archiveLink',
    site: t(siteEn, siteZh),
    title: t(titleEn, titleZh),
    description: t(descriptionEn, descriptionZh),
    url,
    source: url,
    action: t('Open source page', '打开资料页面'),
    license: t(
      'Reference link only; local exhibition graphics are original redraws.',
      '仅作为参考链接；本地展陈图形为原创重绘。'
    ),
    usage: t(
      'Source card for the gaming AI branch',
      'AI 棋牌分支的资料卡片'
    )
  };
}

function section(labelEn, labelZh, htmlEn, htmlZh) {
  return {
    label: t(labelEn, labelZh),
    html: t(htmlEn, htmlZh)
  };
}

function concept(labelEn, labelZh, textEn, textZh) {
  return {
    label: t(labelEn, labelZh),
    text: t(textEn, textZh)
  };
}

function localExplainerMeta(captionEn, captionZh, subcaptionEn, subcaptionZh, sourceNameEn, sourceNameZh, sourceUrl, usageEn, usageZh) {
  return {
    caption: t(captionEn, captionZh),
    subcaption: t(subcaptionEn, subcaptionZh),
    sourceName: t(sourceNameEn, sourceNameZh),
    source: sourceUrl,
    sourceUrl,
    originalImageUrl: 'Local original redraw',
    license: t(
      'Original local SVG redraw; source figures are not copied.',
      '本地原创 SVG 重绘；不复制来源图形。'
    ),
    usage: t(usageEn, usageZh)
  };
}

function makeEvent(config) {
  const demoImage = config.demoImage;
  const imageMeta = {};
  if (demoImage) {
    imageMeta[demoImage] = localExplainerMeta(
      config.demoCaption.en,
      config.demoCaption.zh,
      config.demoSubcaption.en,
      config.demoSubcaption.zh,
      config.demoSourceName.en,
      config.demoSourceName.zh,
      config.demoSourceUrl,
      config.demoUsage.en,
      config.demoUsage.zh
    );
  }

  return {
    year: config.year,
    title: config.title,
    location: config.location,
    description: config.description,
    figures: config.figures,
    quoteText: config.quoteText,
    quoteLabel: config.quoteLabel,
    quoteMeta: config.quoteMeta,
    quotePage: config.quotePage,
    analysis: config.analysis,
    papers: config.papers,
    commentarySections: config.commentarySections,
    achievement: {
      area: config.area,
      method: config.method,
      artifact: config.artifact,
      material: config.material,
      demo: config.demo,
      visual: 'configuredPaper',
      keyConcepts: config.keyConcepts,
      relatedAchievements: config.relatedAchievements,
      relatedRegions: config.relatedRegions,
      demoSteps: config.demoSteps,
      demoImage,
      demoPanel: config.demoPanel || 'sources',
      demoNotes: config.demoNotes,
      visualModules: config.visualModules,
      sources: config.sources
    },
    images: demoImage ? [demoImage] : [],
    imageMeta,
    videos: []
  };
}

const events = {
  '1997-logistello': makeEvent({
    year: '1997',
    title: t('Logistello: Learning Evaluation for Othello', 'Logistello：黑白棋评估函数学习'),
    location: {
      name: t('NEC Research Institute', 'NEC 研究院'),
      country: t('NJ, United States', '美国新泽西州'),
      coordinates: [40.3493, -74.6593]
    },
    description: t(
      '<p>Logistello defeated world champion Takeshi Murakami 6-0 in a 1997 Othello match. Michael Buro combined selective game-tree search, pattern-based evaluation, statistical feature learning, opening-book learning, and strong endgame solving, showing that learned evaluation could outperform hand-crafted heuristics in a compact board game.</p>',
      '<p>Logistello 在 1997 年黑白棋对局中以 6 比 0 击败世界冠军村上健。Michael Buro 将选择性博弈树搜索、基于棋盘模式的评估、统计特征学习、开局库学习和强残局求解结合起来，说明学习得到的评估函数可以在紧凑棋盘游戏中超过手工启发式规则。</p>'
    ),
    figures: [
      {
        name: t('Michael Buro', '迈克尔·布罗'),
        role: t('Creator of Logistello', 'Logistello 创建者')
      },
      {
        name: t('Takeshi Murakami', '村上健'),
        role: t('World Othello champion in the 1997 match', '1997 年对局中的黑白棋世界冠军')
      }
    ],
    quoteText: t('Takeshi Murakami (0) vs. Logistello (6)', '村上健 0 比 6 负于 Logistello'),
    quoteLabel: t('Match record', '赛事记录'),
    quoteMeta: {
      workTitle: t('The Othello Match of the Year', '年度黑白棋对局'),
      workAuthors: t('Michael Buro / NEC Research Institute', '迈克尔·布罗 / NEC 研究院'),
      sourceUrl: 'https://skatgame.net/mburo/event.html'
    },
    quotePage: t('Gaming AI branch: Othello / Logistello', 'AI 棋牌分支：黑白棋 / Logistello'),
    analysis: {
      what: t(
        'Logistello made Othello a milestone for learned evaluation by defeating the reigning world champion in a six-game match.',
        'Logistello 在六局对抗中击败当时世界冠军，使黑白棋成为评估函数学习的重要里程碑。'
      ),
      how: t(
        'It used NegaScout-style alpha-beta search, Multi-ProbCut, pattern tables, linear/statistical feature combination, opening-book learning, and exact endgame search.',
        '它使用 NegaScout 式 alpha-beta 搜索、Multi-ProbCut、模式表、线性/统计特征组合、开局库学习和精确残局搜索。'
      ),
      why: t(
        'Earlier Othello programs relied heavily on human-tuned heuristics. Logistello improved because millions of positions could tune many pattern parameters and let search focus on the most promising branches.',
        '早期黑白棋程序高度依赖人工调参的启发式。Logistello 的突破在于用大量局面调校大量模式参数，并让搜索集中在更有希望的分支上。'
      )
    },
    papers: [
      paper(
        'Statistical Feature Combination for the Evaluation of Game Positions',
        '用于棋局评估的统计特征组合',
        'Michael Buro',
        '迈克尔·布罗',
        'Journal of Artificial Intelligence Research / arXiv',
        'JAIR / arXiv',
        '1995',
        'resources/papers/1997-logistello-statistical-feature-combination.pdf'
      ),
      paper(
        'The Othello Match of the Year: Takeshi Murakami vs. Logistello',
        '年度黑白棋对局：村上健对 Logistello',
        'Michael Buro',
        '迈克尔·布罗',
        'ICCA Journal / NECI technical note',
        'ICCA Journal / NECI 技术说明',
        '1997',
        'https://skatgame.net/mburo/event.html'
      )
    ],
    commentarySections: [
      section(
        'Historical Background',
        '历史背景',
        'Othello was small enough for deep search but rich enough that shallow material counting failed. By the 1990s, the key bottleneck was not just speed but how accurately a program could evaluate unstable midgame positions.',
        '黑白棋足够紧凑，可以进行深层搜索；但它又足够复杂，不能只靠浅层子数统计。到 1990 年代，关键瓶颈不只是速度，而是程序能否准确评估不稳定的中盘局面。'
      ),
      section(
        'Core Idea',
        '核心思想',
        'Logistello treated evaluation as a statistical learning problem over board patterns and game phases. Search still mattered, but the learned evaluator gave search a sharper sense of which positions were strategically promising.',
        'Logistello 把评估函数看成一个跨棋盘模式和阶段的统计学习问题。搜索仍然重要，但学习到的评估器让搜索更清楚哪些局面具有战略潜力。'
      ),
      section(
        'Long-Term Legacy',
        '长期影响',
        'Experts generally treat Logistello as a bridge between classical game-tree search and machine-learned evaluation functions. Its legacy is the lesson that search quality can change dramatically when evaluation parameters are learned from large game-position corpora.',
        '专家通常把 Logistello 视为经典博弈树搜索与机器学习评估函数之间的桥梁。它的长期影响在于说明：当评估参数来自大规模棋局语料学习时，搜索质量会发生显著变化。'
      )
    ],
    area: t('Othello game AI', '黑白棋 AI'),
    method: t('Pattern evaluation learning with selective alpha-beta search', '模式评估学习与选择性 alpha-beta 搜索'),
    artifact: t('World-champion-level Othello program', '世界冠军级黑白棋程序'),
    material: t('Logistello homepage, match report, and evaluation-function paper', 'Logistello 主页、对局报告与评估函数论文'),
    demo: t(
      'Toggle pattern weights to see how learned features steer search away from bad mobility and parity traps.',
      '切换模式权重，观察学习特征如何引导搜索避开行动力和奇偶陷阱。'
    ),
    keyConcepts: [
      concept('Pattern tables', '模式表', 'Board patterns are scored differently across game stages.', '棋盘模式会按不同阶段给出不同评分。'),
      concept('Multi-ProbCut', 'Multi-ProbCut', 'Selective pruning estimates which branches are unlikely to matter.', '选择性剪枝估计哪些分支不太可能影响决策。'),
      concept('Book learning', '开局库学习', 'Self-play and evaluated lines improve opening choices.', '自我对弈和已评估变例改进开局选择。')
    ],
    relatedAchievements: [
      t('Chinook', 'Chinook'),
      t('Deep Blue', '深蓝'),
      t('Learned evaluation functions', '学习型评估函数')
    ],
    relatedRegions: [t('United States', '美国'), t('Germany', '德国')],
    demoSteps: [
      t('Encode board patterns', '编码棋盘模式'),
      t('Estimate position value', '估计局面价值'),
      t('Prune and solve endgames', '剪枝并求解残局')
    ],
    demoNotes: [
      {
        label: t('evaluation cue', '评估线索'),
        text: t('Pattern weights turn raw discs into a learned positional score.', '模式权重把原始棋子分布转成学习到的局面评分。')
      },
      {
        label: t('interaction point', '互动点'),
        text: t('Switch between mobility, corners, parity, and endgame mode to see why the preferred move changes.', '切换行动力、角位、奇偶和残局模式，观察首选落子为什么会改变。')
      }
    ],
    visualModules: [
      archiveLink(
        'Logistello homepage',
        'Logistello 主页',
        'Program overview and source release',
        '程序概览与源码发布',
        'Michael Buro describes Logistello features, search, opening book learning, and training data requirements.',
        '迈克尔·布罗说明 Logistello 的特征、搜索、开局库学习和训练数据需求。',
        'https://skatgame.net/mburo/log.html'
      )
    ],
    sources: [
      source('Official page', '官方页面', 'Logistello homepage', 'Logistello 主页', 'https://skatgame.net/mburo/log.html'),
      source('Match report', '对局报告', 'Murakami vs. Logistello', '村上健对 Logistello', 'https://skatgame.net/mburo/event.html'),
      source('Paper', '论文', 'Statistical Feature Combination', '统计特征组合论文', 'https://arxiv.org/abs/cs/9512106'),
      source('Publication list', '论文列表', 'Michael Buro publications', '迈克尔·布罗论文列表', 'https://skatgame.net/mburo/publications.html')
    ],
    demoImage: 'resources/images/bench-council-ai100/explainers/1997-logistello_pattern-eval.svg',
    demoCaption: t('Logistello pattern evaluation', 'Logistello 模式评估'),
    demoSubcaption: t('Original explainer for learned Othello evaluation.', '学习型黑白棋评估的原创解释图。'),
    demoSourceName: t('Logistello homepage', 'Logistello 主页'),
    demoSourceUrl: 'https://skatgame.net/mburo/log.html',
    demoUsage: t('Evaluation-function explainer', '评估函数解释图')
  }),

  '2000s-alphacat': makeEvent({
    year: '2000s',
    title: t('Chinese Chess Engines and AlphaCat', '中国象棋引擎与 AlphaCat'),
    location: {
      name: t('Computer Olympiad Chinese Chess track', '计算机奥林匹克中国象棋项目'),
      country: t('China and Taiwan', '中国大陆与中国台湾'),
      coordinates: [39.9042, 116.4074]
    },
    description: t(
      '<p>Chinese chess made game AI confront asymmetric pieces, cannons, palaces, rivers, repetition rules, and very tactical attacking play. The issue-requested AlphaCat entry is represented here as part of the broader 2000s xiangqi-engine wave, where minimax search, bitboards or compact board encodings, opening knowledge, and tuned evaluation functions became the practical path to strong play.</p>',
      '<p>中国象棋让游戏 AI 面对非对称兵种、炮、九宫、楚河汉界、长将长捉规则以及高度战术化的攻杀。issue 中要求的 AlphaCat 在这里作为 2000 年代象棋引擎浪潮的一部分呈现：极大极小搜索、位棋盘或紧凑棋盘编码、开局知识和调校评估函数，是通向强棋力的主要实践路线。</p>'
    ),
    figures: [
      {
        name: t('Xiangqi engine teams', '中国象棋引擎团队'),
        role: t('Programmers behind ICGA Chinese Chess entrants', 'ICGA 中国象棋项目参赛程序背后的开发者')
      },
      {
        name: t('AlphaCat', 'AlphaCat'),
        role: t('Representative system requested by the issue', 'issue 指定的代表性系统')
      }
    ],
    quoteText: t('Chinese Chess: 16 tournaments, 38 programs', '中国象棋：16 次赛事，38 个程序'),
    quoteLabel: t('Tournament archive', '赛事档案'),
    quoteMeta: {
      workTitle: t('ICGA Tournaments: Chinese Chess', 'ICGA 赛事：中国象棋'),
      workAuthors: t('International Computer Games Association tournament archive', '国际计算机博弈协会赛事档案'),
      sourceUrl: 'https://www.game-ai-forum.org/icga-tournaments/game.php?id=13'
    },
    quotePage: t('Gaming AI branch: Chinese Chess / AlphaCat', 'AI 棋牌分支：中国象棋 / AlphaCat'),
    analysis: {
      what: t(
        'The 2000s Chinese-chess line shows how game AI adapted chess-engine ideas to xiangqi, including issue-requested AlphaCat as a representative system.',
        '2000 年代中国象棋路线展示了游戏 AI 如何把象棋引擎思想迁移到中国象棋，并以 issue 指定的 AlphaCat 作为代表系统。'
      ),
      how: t(
        'Engines used compact board representations, legal-move tables, alpha-beta or minimax search, opening books, tactical extensions, and evaluation weights for asymmetric pieces and attack pressure.',
        '这些引擎使用紧凑棋盘表示、合法走法表、alpha-beta 或极大极小搜索、开局库、战术延伸，以及面向非对称兵种和攻势压力的评估权重。'
      ),
      why: t(
        'Western chess methods could not transfer unchanged because cannons, palaces, rivers, and repetition rules create different tactical geometry. Xiangqi programs worked by encoding those local constraints directly into search and evaluation.',
        '国际象棋方法不能原样迁移，因为炮、九宫、楚河汉界和长打规则会产生不同的战术几何。中国象棋程序的突破在于把这些局部约束直接编码进搜索和评估。'
      )
    },
    papers: [
      paper(
        'Comparison Training for Computer Chinese Chess',
        '面向计算机中国象棋的比较训练',
        'Wen-Jie Tseng, Jr-Chang Chen, I-Chen Wu, Tinghan Wei',
        '曾文杰、陈日章、吴毅成、魏廷翰',
        'arXiv / submitted to IEEE Transactions on Games',
        'arXiv / 投稿至 IEEE Transactions on Games',
        '2018',
        'resources/papers/2000s-alphacat-comparison-training-chinese-chess.pdf'
      )
    ],
    commentarySections: [
      section(
        'Historical Background',
        '历史背景',
        'Xiangqi is close enough to chess that search and evaluation are natural starting points. It is also different enough that cannon captures, palace restrictions, river effects, and repetition rules force engine authors to redesign board representation and tactical evaluation.',
        '中国象棋与国际象棋足够接近，因此搜索和评估是自然起点。它又足够不同：炮的隔子打、九宫限制、过河规则和长打规则，迫使引擎作者重新设计棋盘表示和战术评估。'
      ),
      section(
        'Core Idea',
        '核心思想',
        'The practical route was not one universal trick but a stack of domain-aware engineering. Fast move generation, aggressive alpha-beta pruning, opening knowledge, and tuned evaluation matrices worked together to survive a highly tactical search space.',
        '实用路线不是一个万能技巧，而是一组面向领域的工程组合。快速走法生成、激进 alpha-beta 剪枝、开局知识和调校后的评估矩阵共同作用，才能应对高度战术化的搜索空间。'
      ),
      section(
        'Long-Term Legacy',
        '长期影响',
        'Experts generally treat strong xiangqi engines as evidence that classical search remains powerful when it is deeply adapted to a game. This line also foreshadowed later learned-evaluation work, where handcrafted piece-square matrices were gradually complemented by automatically tuned weights.',
        '专家通常把强中国象棋引擎视为证据：只要深度适配具体游戏，经典搜索仍然非常有力。这条路线也预示了后来的学习型评估工作，手工兵种位置表逐步被自动调校权重补充。'
      )
    ],
    area: t('Chinese chess game AI', '中国象棋 AI'),
    method: t('Domain-specific minimax search and tuned evaluation', '领域化极大极小搜索与调校评估'),
    artifact: t('AlphaCat-style xiangqi engine lineage', 'AlphaCat 式中国象棋引擎谱系'),
    material: t('ICGA tournament archive and Chinese-chess evaluation research', 'ICGA 赛事档案与中国象棋评估研究'),
    demo: t(
      'Move the cannon, horse, and general constraints to see why xiangqi needs its own search geometry.',
      '切换炮、马和将帅约束，观察为什么中国象棋需要自己的搜索几何。'
    ),
    keyConcepts: [
      concept('Cannon geometry', '炮的几何', 'A cannon captures only by jumping a screen piece.', '炮必须隔一个子才能吃子。'),
      concept('Asymmetric evaluation', '非对称评估', 'Pieces differ sharply in mobility and tactical value.', '不同兵种在行动力和战术价值上差异很大。'),
      concept('Tactical extensions', '战术延伸', 'Search must follow checks, threats, and forcing sequences deeper.', '搜索必须对将军、威胁和强制变例继续加深。')
    ],
    relatedAchievements: [
      t('Deep Blue', '深蓝'),
      t('AlphaZero', 'AlphaZero'),
      t('Evaluation-function tuning', '评估函数调校')
    ],
    relatedRegions: [t('China', '中国'), t('Taiwan', '中国台湾')],
    demoSteps: [
      t('Generate legal moves', '生成合法走法'),
      t('Search tactical tree', '搜索战术树'),
      t('Score asymmetric pieces', '评估非对称兵种')
    ],
    demoNotes: [
      {
        label: t('architecture cue', '架构线索'),
        text: t('The explainer highlights board encoding, legal-move generation, and tactical evaluation as one coupled engine loop.', '解释图强调棋盘编码、合法走法生成和战术评估是一个耦合的引擎循环。')
      },
      {
        label: t('interaction point', '互动点'),
        text: t('Toggle cannon screens and river crossing to see how legal moves reshape the search frontier.', '切换炮架和过河状态，观察合法走法如何重塑搜索边界。')
      }
    ],
    visualModules: [
      archiveLink(
        'ICGA Tournaments',
        'ICGA 赛事档案',
        'Chinese Chess tournament archive',
        '中国象棋赛事档案',
        'Tournament archive listing Chinese Chess competitions and programs in the Computer Olympiad lineage.',
        '赛事档案列出计算机奥林匹克中国象棋项目及参赛程序谱系。',
        'https://www.game-ai-forum.org/icga-tournaments/game.php?id=13'
      )
    ],
    sources: [
      source('Tournament archive', '赛事档案', 'ICGA Chinese Chess page', 'ICGA 中国象棋页面', 'https://www.game-ai-forum.org/icga-tournaments/game.php?id=13'),
      source('Paper', '论文', 'Comparison Training for Computer Chinese Chess', '面向计算机中国象棋的比较训练', 'https://arxiv.org/abs/1801.07411'),
      source('Game rules / background', '规则与背景', 'Xiangqi overview', '中国象棋概览', 'https://en.wikipedia.org/wiki/Xiangqi')
    ],
    demoImage: 'resources/images/bench-council-ai100/explainers/2000s-alphacat_xiangqi-search.svg',
    demoCaption: t('Chinese chess search geometry', '中国象棋搜索几何'),
    demoSubcaption: t('Original explainer for xiangqi engine constraints.', '中国象棋引擎约束的原创解释图。'),
    demoSourceName: t('ICGA Chinese Chess archive', 'ICGA 中国象棋档案'),
    demoSourceUrl: 'https://www.game-ai-forum.org/icga-tournaments/game.php?id=13',
    demoUsage: t('Xiangqi search explainer', '中国象棋搜索解释图')
  }),

  '2017-alphazero': makeEvent({
    year: '2017-2018',
    title: t('AlphaZero', 'AlphaZero'),
    location: {
      name: t('DeepMind', 'DeepMind'),
      country: t('London, United Kingdom', '英国伦敦'),
      coordinates: [51.523, -0.128]
    },
    description: t(
      '<p>AlphaZero showed that one self-play reinforcement learning system could master Go, chess, and shogi from game rules alone. It replaced handcrafted evaluation and opening books with neural policy-value learning plus Monte Carlo tree search, turning board-game AI into a general recipe rather than a single-game program.</p>',
      '<p>AlphaZero 展示了同一套自我博弈强化学习系统可以仅凭游戏规则掌握围棋、国际象棋和将棋。它用神经网络的策略-价值学习和蒙特卡洛树搜索取代人工评估函数与开局库，让棋牌游戏 AI 从单一游戏程序走向通用方法。</p>'
    ),
    figures: [
      {
        name: t('David Silver', '大卫·席尔瓦'),
        role: t('DeepMind reinforcement learning lead', 'DeepMind 强化学习负责人')
      },
      {
        name: t('Demis Hassabis', '德米斯·哈萨比斯'),
        role: t('DeepMind co-founder', 'DeepMind 联合创始人')
      }
    ],
    quoteText: t('a general reinforcement learning algorithm', '一种通用强化学习算法'),
    quoteLabel: t('Paper cue', '论文线索'),
    quoteMeta: {
      workTitle: t(
        'A general reinforcement learning algorithm that masters chess, shogi, and Go through self-play',
        '通过自我博弈掌握国际象棋、将棋和围棋的通用强化学习算法'
      ),
      workAuthors: t('David Silver et al., Science, 2018', 'David Silver 等，Science，2018'),
      sourceUrl: 'https://www.science.org/doi/10.1126/science.aar6404'
    },
    quotePage: t('Gaming AI branch: AlphaZero', 'AI 棋牌分支：AlphaZero'),
    analysis: {
      what: t(
        'AlphaZero mastered Go, chess, and shogi with one self-play reinforcement-learning recipe and no human opening books or handcrafted evaluation.',
        'AlphaZero 用同一套自我博弈强化学习配方掌握围棋、国际象棋和将棋，不依赖人类开局库或手工评估函数。'
      ),
      how: t(
        'It repeatedly generated self-play games, trained a neural network to predict policy and value, and used Monte Carlo tree search to improve decisions.',
        '它不断生成自我对弈棋局，训练神经网络预测策略和价值，并用蒙特卡洛树搜索改进决策。'
      ),
      why: t(
        'It succeeded where earlier systems were game-specific because the same network-search loop could bootstrap its own data from the rules alone.',
        '它之所以超过早期单项游戏系统，是因为同一套网络-搜索循环可以仅凭规则自举产生训练数据。'
      )
    },
    papers: [
      paper(
        'Mastering Chess and Shogi by Self-Play with a General Reinforcement Learning Algorithm',
        '用通用强化学习算法通过自我博弈掌握国际象棋与将棋',
        'David Silver et al.',
        'David Silver 等',
        'arXiv',
        'arXiv',
        '2017',
        'resources/papers/2017-alphazero-self-play.pdf'
      ),
      paper(
        'A general reinforcement learning algorithm that masters chess, shogi, and Go through self-play',
        '通过自我博弈掌握国际象棋、将棋和围棋的通用强化学习算法',
        'David Silver et al.',
        'David Silver 等',
        'Science',
        'Science',
        '2018',
        'https://www.science.org/doi/10.1126/science.aar6404'
      )
    ],
    commentarySections: [
      section(
        'Historical Background',
        '历史背景',
        'AlphaGo still used human expert games and Go-specific training stages. AlphaZero asked whether self-play could carry the learning burden across multiple games with only the rules as input.',
        'AlphaGo 仍然使用人类专家棋谱和围棋专用训练阶段。AlphaZero 进一步追问：自我博弈能否只依靠规则，在多个游戏中承担主要学习负担。'
      ),
      section(
        'Core Idea',
        '核心思想',
        'A neural network predicts move probabilities and game outcomes. Tree search improves action choice, self-play generates new experience, and the network absorbs the improved behavior in the next training cycle.',
        '神经网络预测走法概率和胜负结果。树搜索改进行动选择，自我博弈产生新经验，网络再在下一轮训练中吸收这些改进行为。'
      ),
      section(
        'Long-Term Legacy',
        '长期影响',
        'Experts generally treat AlphaZero as the cleanest public statement of the neural-search self-play paradigm. Its legacy is the idea that strong play can emerge from rule-based simulation plus learned policy-value guidance, a pattern that later influenced MuZero and other planning systems.',
        '专家通常把 AlphaZero 视为神经搜索自我博弈范式最清晰的公开表达。它的长期影响在于提出：强棋力可以从规则仿真与学习型策略-价值引导中涌现，这一模式后来影响了 MuZero 等规划系统。'
      )
    ],
    area: t('General game reinforcement learning', '通用游戏强化学习'),
    method: t('Self-play policy-value learning with Monte Carlo tree search', '自我博弈策略-价值学习与蒙特卡洛树搜索'),
    artifact: t('One algorithm for Go, chess, and shogi', '面向围棋、国际象棋和将棋的一套算法'),
    material: t('arXiv preprint, Science paper, and DeepMind blog', 'arXiv 预印本、Science 论文与 DeepMind 博客'),
    demo: t('Inspect how self-play, search, and network training feed each other.', '查看自我博弈、搜索和网络训练如何相互反馈。'),
    keyConcepts: [
      concept('Tabula rasa', '白板学习', 'Training starts from rules rather than human games.', '训练从规则开始，而不是从人类棋谱开始。'),
      concept('Policy-value network', '策略-价值网络', 'One network guides moves and estimates outcomes.', '同一个网络同时引导走法并估计结果。'),
      concept('Search improvement', '搜索改进', 'MCTS turns the raw policy into stronger targets.', 'MCTS 把原始策略转成更强的训练目标。')
    ],
    relatedAchievements: [t('AlphaGo', 'AlphaGo'), t('MuZero', 'MuZero'), t('Deep reinforcement learning', '深度强化学习')],
    relatedRegions: [t('United Kingdom', '英国')],
    demoSteps: [t('Self-play', '自我博弈'), t('Tree search', '树搜索'), t('Policy-value update', '策略-价值更新')],
    demoNotes: [
      {
        label: t('learning cue', '学习线索'),
        text: t('The loop starts with rules, not human move labels.', '这个循环从规则出发，而不是从人类走法标签出发。')
      },
      {
        label: t('interaction point', '互动点'),
        text: t('Step through one cycle to see how search targets become the next network update.', '逐步查看一个循环，理解搜索目标如何变成下一次网络更新。')
      }
    ],
    visualModules: [
      archiveLink(
        'Science',
        'Science',
        'AlphaZero Science paper',
        'AlphaZero Science 论文',
        'Peer-reviewed article describing AlphaZero across chess, shogi, and Go.',
        '描述 AlphaZero 横跨国际象棋、将棋和围棋的同行评议论文。',
        'https://www.science.org/doi/10.1126/science.aar6404'
      )
    ],
    sources: [
      source('Paper', '论文', 'Science paper', 'Science 论文', 'https://www.science.org/doi/10.1126/science.aar6404'),
      source('Preprint', '预印本', 'arXiv preprint', 'arXiv 预印本', 'https://arxiv.org/abs/1712.01815'),
      source('Blog', '博客', 'DeepMind AlphaZero blog', 'DeepMind AlphaZero 博客', 'https://deepmind.google/discover/blog/alphazero-shedding-new-light-on-chess-shogi-and-go/')
    ],
    demoImage: 'resources/images/bench-council-ai100/explainers/2017-alphazero_self-play-loop.svg',
    demoCaption: t('AlphaZero self-play loop', 'AlphaZero 自我博弈循环'),
    demoSubcaption: t('Original explainer for policy-value self-play.', '策略-价值自我博弈的原创解释图。'),
    demoSourceName: t('AlphaZero paper', 'AlphaZero 论文'),
    demoSourceUrl: 'https://www.science.org/doi/10.1126/science.aar6404',
    demoUsage: t('Self-play learning explainer', '自我博弈学习解释图')
  }),

  '2017-libratus': makeEvent({
    year: '2017',
    title: t('Libratus', 'Libratus'),
    location: {
      name: t('Carnegie Mellon University', '卡内基梅隆大学'),
      country: t('Pittsburgh, United States', '美国匹兹堡'),
      coordinates: [40.4433, -79.9436]
    },
    description: t(
      '<p>Libratus defeated top professionals in heads-up no-limit Texas hold\'em, a game with hidden information and enormous decision spaces. It combined abstract game solving, real-time endgame solving, and self-improvement after each day of play, proving that game AI could move beyond perfect-information boards.</p>',
      '<p>Libratus 在一对一无限注德州扑克中击败顶尖职业牌手，而这类游戏包含隐藏信息和巨大的决策空间。它结合抽象博弈求解、实时残局求解和每日赛后自我改进，证明游戏 AI 可以走出完全信息棋盘。</p>'
    ),
    figures: [
      {
        name: t('Noam Brown', '诺姆·布朗'),
        role: t('Libratus co-creator', 'Libratus 共同创建者')
      },
      {
        name: t('Tuomas Sandholm', '托马斯·桑德霍姆'),
        role: t('CMU professor and Libratus co-creator', 'CMU 教授，Libratus 共同创建者')
      }
    ],
    quoteText: t('superhuman AI for heads-up no-limit poker', '面向一对一无限注扑克的超人 AI'),
    quoteLabel: t('Paper cue', '论文线索'),
    quoteMeta: {
      workTitle: t(
        'Superhuman AI for heads-up no-limit poker: Libratus beats top professionals',
        '一对一无限注扑克的超人 AI：Libratus 击败顶级职业牌手'
      ),
      workAuthors: t('Noam Brown and Tuomas Sandholm, Science, 2017', 'Noam Brown 与 Tuomas Sandholm，Science，2017'),
      sourceUrl: 'https://www.science.org/doi/10.1126/science.aao1733'
    },
    quotePage: t('Gaming AI branch: Libratus', 'AI 棋牌分支：Libratus'),
    analysis: {
      what: t(
        'Libratus reached superhuman heads-up no-limit Texas hold\'em, a major imperfect-information poker benchmark.',
        'Libratus 在一对一无限注德州扑克上达到超人水平，这是不完全信息扑克的重要基准。'
      ),
      how: t(
        'It solved an abstract blueprint strategy, refined subgames during play, and repaired discovered weaknesses after each day of competition.',
        '它先求解抽象蓝图策略，在对局中实时细化子局，并在每日比赛后修补被发现的弱点。'
      ),
      why: t(
        'It worked because hidden information was treated as an equilibrium strategy problem rather than a visible-board search problem.',
        '它成功的原因在于把隐藏信息看作均衡策略问题，而不是可见棋盘搜索问题。'
      )
    },
    papers: [
      paper(
        'Superhuman AI for heads-up no-limit poker: Libratus beats top professionals',
        '一对一无限注扑克的超人 AI：Libratus 击败顶级职业牌手',
        'Noam Brown, Tuomas Sandholm',
        'Noam Brown，Tuomas Sandholm',
        'Science',
        'Science',
        '2017',
        'https://www.science.org/doi/10.1126/science.aao1733'
      )
    ],
    commentarySections: [
      section(
        'Historical Background',
        '历史背景',
        'Poker added hidden cards, bluffing, and uncertainty to the game-AI story. Unlike chess or Go, the correct action depends on ranges of possible private hands and on what opponents believe you might hold.',
        '扑克把暗牌、诈唬和不确定性加入了游戏 AI 叙事。不同于国际象棋或围棋，正确行动取决于可能暗牌范围，以及对手认为你可能持有什么牌。'
      ),
      section(
        'Core Idea',
        '核心思想',
        'Libratus solved a compact abstraction before the match and used real-time subgame solving during difficult hands. It then analyzed each day for exploitable patterns and patched the strategy overnight.',
        'Libratus 在赛前求解紧凑抽象策略，并在困难手牌中使用实时子局求解。它随后分析每天对局中的可利用模式，并在夜间修补策略。'
      ),
      section(
        'Long-Term Legacy',
        '长期影响',
        'Experts generally treat Libratus as a turning point for large imperfect-information games. Its legacy is showing that abstraction, equilibrium reasoning, and targeted repair can defeat elite humans even when the real state is partly hidden.',
        '专家通常把 Libratus 视为大型不完全信息博弈的转折点。它的长期影响在于证明：即使真实状态部分隐藏，抽象、均衡推理和定向修补仍能击败顶尖人类。'
      )
    ],
    area: t('Imperfect-information game AI', '不完全信息博弈 AI'),
    method: t('Abstraction, subgame solving, and strategy repair', '抽象、子局求解与策略修补'),
    artifact: t('Heads-up no-limit Texas hold\'em poker agent', '一对一无限注德州扑克智能体'),
    material: t('Science paper and CMU release', 'Science 论文与 CMU 新闻稿'),
    demo: t('Reveal how a blueprint strategy is refined when private cards create a difficult subgame.', '展示当暗牌形成困难子局时，蓝图策略如何被实时细化。'),
    keyConcepts: [
      concept('Blueprint strategy', '蓝图策略', 'A compressed precomputed strategy covers the full game.', '压缩的预计算策略覆盖整个游戏。'),
      concept('Subgame solving', '子局求解', 'The current hand is refined in real time.', '当前手牌在对局中实时细化。'),
      concept('Strategy repair', '策略修补', 'Weaknesses found in play are patched between sessions.', '对局中发现的弱点在场次之间修补。')
    ],
    relatedAchievements: [t('Pluribus', 'Pluribus'), t('Counterfactual Regret Minimization', '反事实遗憾最小化')],
    relatedRegions: [t('United States', '美国')],
    demoSteps: [t('Abstract game', '抽象博弈'), t('Solve subgame', '求解子局'), t('Patch strategy', '修补策略')],
    demoNotes: [
      {
        label: t('equilibrium cue', '均衡线索'),
        text: t('The visual separates the precomputed blueprint from the live subgame branch.', '可视化把预计算蓝图和实时子局分支分开。')
      },
      {
        label: t('interaction point', '互动点'),
        text: t('Flip private-card uncertainty on and off to compare visible-board search with equilibrium reasoning.', '切换暗牌不确定性，对比可见棋盘搜索与均衡推理。')
      }
    ],
    visualModules: [
      archiveLink(
        'Science',
        'Science',
        'Libratus paper',
        'Libratus 论文',
        'Science article describing Libratus and heads-up no-limit poker.',
        '描述 Libratus 与一对一无限注扑克的 Science 论文。',
        'https://www.science.org/doi/10.1126/science.aao1733'
      )
    ],
    sources: [
      source('Paper', '论文', 'Science paper', 'Science 论文', 'https://www.science.org/doi/10.1126/science.aao1733'),
      source('News report', '新闻报道', 'CMU Libratus release', 'CMU Libratus 新闻稿', 'https://www.cmu.edu/news/stories/archives/2017/january/AI-beats-poker-pros.html'),
      source('Preprint', '预印本', 'Safe and Nested Subgame Solving', '安全嵌套子局求解论文', 'https://arxiv.org/abs/1705.02955')
    ],
    demoImage: 'resources/images/bench-council-ai100/explainers/2017-libratus_cfr-solving.svg',
    demoCaption: t('Libratus subgame solving', 'Libratus 子局求解'),
    demoSubcaption: t('Original explainer for imperfect-information poker search.', '不完全信息扑克搜索的原创解释图。'),
    demoSourceName: t('Libratus Science paper', 'Libratus Science 论文'),
    demoSourceUrl: 'https://www.science.org/doi/10.1126/science.aao1733',
    demoUsage: t('Poker equilibrium explainer', '扑克均衡解释图')
  }),

  '2019-pluribus': makeEvent({
    year: '2019',
    title: t('Pluribus', 'Pluribus'),
    location: {
      name: t('Carnegie Mellon University and Facebook AI Research', '卡内基梅隆大学与 Facebook AI Research'),
      country: t('Pittsburgh and Menlo Park, United States', '美国匹兹堡与门洛帕克'),
      coordinates: [40.4433, -79.9436]
    },
    description: t(
      '<p>Pluribus extended poker AI from heads-up play to six-player no-limit Texas hold\'em. It used a compact blueprint strategy plus limited-lookahead search to handle several opponents at once, moving game AI toward multiplayer settings where no single opponent model is enough.</p>',
      '<p>Pluribus 将扑克 AI 从一对一扩展到六人无限注德州扑克。它使用紧凑蓝图策略与有限前瞻搜索，同时处理多个对手，把游戏 AI 推向无法只靠单一对手模型的多人场景。</p>'
    ),
    figures: [
      {
        name: t('Noam Brown', '诺姆·布朗'),
        role: t('Pluribus co-creator', 'Pluribus 共同创建者')
      },
      {
        name: t('Tuomas Sandholm', '托马斯·桑德霍姆'),
        role: t('Pluribus co-creator', 'Pluribus 共同创建者')
      }
    ],
    quoteText: t('superhuman AI for multiplayer poker', '面向多人扑克的超人 AI'),
    quoteLabel: t('Paper cue', '论文线索'),
    quoteMeta: {
      workTitle: t('Superhuman AI for multiplayer poker', '面向多人扑克的超人 AI'),
      workAuthors: t('Noam Brown and Tuomas Sandholm, Science, 2019', 'Noam Brown 与 Tuomas Sandholm，Science，2019'),
      sourceUrl: 'https://www.science.org/doi/10.1126/science.aay2400'
    },
    quotePage: t('Gaming AI branch: Pluribus', 'AI 棋牌分支：Pluribus'),
    analysis: {
      what: t(
        'Pluribus defeated elite human professionals in six-player no-limit Texas hold\'em.',
        'Pluribus 在六人无限注德州扑克中击败顶尖人类职业牌手。'
      ),
      how: t(
        'It trained a compact blueprint strategy through self-play and used real-time search only in carefully selected decision states.',
        '它通过自我对弈训练紧凑蓝图策略，并只在精心选择的决策状态中使用实时搜索。'
      ),
      why: t(
        'It worked by avoiding an impossible full multiplayer equilibrium solve and instead combining a robust blueprint with local refinements.',
        '它成功在于避开几乎不可行的完整多人均衡求解，转而结合稳健蓝图与局部细化。'
      )
    },
    papers: [
      paper(
        'Superhuman AI for multiplayer poker',
        '面向多人扑克的超人 AI',
        'Noam Brown, Tuomas Sandholm',
        'Noam Brown，Tuomas Sandholm',
        'Science',
        'Science',
        '2019',
        'https://www.science.org/doi/10.1126/science.aay2400'
      )
    ],
    commentarySections: [
      section(
        'Historical Background',
        '历史背景',
        'Many real strategic settings are neither two-player nor zero-sum in the clean chess sense. Multiplayer poker made that gap concrete by adding several opponents with private information and shifting incentives.',
        '许多真实策略场景并不是干净的两人零和棋局。多人扑克通过多个拥有私人信息、激励不断变化的对手，把这个差距具体化了。'
      ),
      section(
        'Core Idea',
        '核心思想',
        'Pluribus used a compact self-play blueprint as the baseline policy. During play it applied limited-lookahead search to refine decisions without trying to solve the entire six-player game from scratch.',
        'Pluribus 使用紧凑自我对弈蓝图作为基准策略。在对局中，它用有限前瞻搜索细化决策，而不是从头求解整个六人游戏。'
      ),
      section(
        'Long-Term Legacy',
        '长期影响',
        'Experts generally treat Pluribus as an important demonstration that imperfect-information AI can scale beyond two players. Its legacy is the blueprint-plus-search pattern for messy multi-agent domains where exact equilibrium computation is out of reach.',
        '专家通常把 Pluribus 视为不完全信息 AI 扩展到两人之外的重要展示。它的长期影响在于提出蓝图加搜索模式，用于那些无法精确计算均衡的复杂多智能体领域。'
      )
    ],
    area: t('Multiplayer imperfect-information game AI', '多人不完全信息博弈 AI'),
    method: t('Self-play blueprint strategy with limited-lookahead search', '自我对弈蓝图策略与有限前瞻搜索'),
    artifact: t('Six-player no-limit Texas hold\'em poker agent', '六人无限注德州扑克智能体'),
    material: t('Science paper, CMU release, and Meta AI report', 'Science 论文、CMU 新闻稿与 Meta AI 报道'),
    demo: t('Show how several opponents are handled by one blueprint strategy plus local search.', '展示多个对手如何由同一蓝图策略加局部搜索处理。'),
    keyConcepts: [
      concept('Multiplayer uncertainty', '多人不确定性', 'Several private hands change the value of every action.', '多个暗牌范围会改变每个行动的价值。'),
      concept('Blueprint compression', '蓝图压缩', 'A compact strategy covers many states cheaply.', '紧凑策略低成本覆盖大量状态。'),
      concept('Limited lookahead', '有限前瞻', 'Search is reserved for decisions where refinement matters most.', '搜索留给最需要细化的决策。')
    ],
    relatedAchievements: [t('Libratus', 'Libratus'), t('Imperfect-information games', '不完全信息博弈')],
    relatedRegions: [t('United States', '美国')],
    demoSteps: [t('Build blueprint', '构建蓝图'), t('Observe table state', '观察牌桌状态'), t('Refine action', '细化行动')],
    demoNotes: [
      {
        label: t('multi-agent cue', '多智能体线索'),
        text: t('The center blueprint is pulled by six different private-information branches.', '中心蓝图同时被六个不同暗牌分支牵引。')
      },
      {
        label: t('interaction point', '互动点'),
        text: t('Add or remove opponents to see why full-game solving becomes impractical.', '增减对手数量，观察为什么完整博弈求解会变得不现实。')
      }
    ],
    visualModules: [
      archiveLink(
        'Meta AI',
        'Meta AI',
        'Pluribus report',
        'Pluribus 报道',
        'Meta AI report on the first AI to beat professionals in six-player poker.',
        'Meta AI 关于首个击败六人扑克职业牌手 AI 的报道。',
        'https://ai.meta.com/blog/pluribus-first-ai-to-beat-pros-in-6-player-poker/'
      )
    ],
    sources: [
      source('Paper', '论文', 'Science paper', 'Science 论文', 'https://www.science.org/doi/10.1126/science.aay2400'),
      source('News report', '新闻报道', 'Meta AI Pluribus report', 'Meta AI Pluribus 报道', 'https://ai.meta.com/blog/pluribus-first-ai-to-beat-pros-in-6-player-poker/'),
      source('News report', '新闻报道', 'CMU Pluribus release', 'CMU Pluribus 新闻稿', 'https://www.cmu.edu/news/stories/archives/2019/july/ai-beats-pros-six-player-poker.html')
    ],
    demoImage: 'resources/images/bench-council-ai100/explainers/2019-pluribus_blueprint-search.svg',
    demoCaption: t('Pluribus blueprint search', 'Pluribus 蓝图搜索'),
    demoSubcaption: t('Original explainer for multiplayer poker reasoning.', '多人扑克推理的原创解释图。'),
    demoSourceName: t('Pluribus Science paper', 'Pluribus Science 论文'),
    demoSourceUrl: 'https://www.science.org/doi/10.1126/science.aay2400',
    demoUsage: t('Multiplayer poker explainer', '多人扑克解释图')
  }),

  '2019-suphx': makeEvent({
    year: '2019-2020',
    title: t('Suphx: Mahjong with Deep Reinforcement Learning', 'Suphx：深度强化学习麻将 AI'),
    location: {
      name: t('Microsoft Research Asia', '微软亚洲研究院'),
      country: t('Beijing, China', '中国北京'),
      coordinates: [39.9786, 116.3317]
    },
    description: t(
      '<p>Suphx brought deep reinforcement learning to Japanese mahjong, a four-player imperfect-information game with hidden tiles, stochastic draws, complex scoring, and long-horizon risk tradeoffs. It used supervised pretraining, self-play reinforcement learning, global reward prediction, oracle guiding, and run-time policy adaptation to reach a level above most ranked Tenhou players.</p>',
      '<p>Suphx 将深度强化学习带入日本麻将，这是一种四人不完全信息游戏，包含隐藏牌、随机摸牌、复杂计分和长期风险权衡。它使用监督预训练、自我对弈强化学习、全局奖励预测、oracle guiding 和运行时策略适配，在天凤平台达到超过绝大多数注册段位玩家的水平。</p>'
    ),
    figures: [
      {
        name: t('Junjie Li', '李俊杰'),
        role: t('Suphx paper first author', 'Suphx 论文第一作者')
      },
      {
        name: t('Tao Qin', '秦涛'),
        role: t('Microsoft Research Asia researcher', '微软亚洲研究院研究员')
      },
      {
        name: t('Tie-Yan Liu', '刘铁岩'),
        role: t('Microsoft Research Asia research leader', '微软亚洲研究院研究负责人')
      }
    ],
    quoteText: t('Mastering Mahjong with Deep Reinforcement Learning', '用深度强化学习掌握麻将'),
    quoteLabel: t('Paper cue', '论文线索'),
    quoteMeta: {
      workTitle: t('Suphx: Mastering Mahjong with Deep Reinforcement Learning', 'Suphx：用深度强化学习掌握麻将'),
      workAuthors: t('Junjie Li et al., arXiv, 2020', 'Junjie Li 等，arXiv，2020'),
      sourceUrl: 'https://arxiv.org/abs/2003.13590'
    },
    quotePage: t('Gaming AI branch: Japanese Mahjong / Suphx', 'AI 棋牌分支：日本麻将 / Suphx'),
    analysis: {
      what: t(
        'Suphx became a landmark mahjong AI that exceeded most top ranked human players on Tenhou according to stable rank and rating statistics.',
        'Suphx 成为麻将 AI 里程碑；按稳定段位和评级统计，它超过了天凤平台上绝大多数顶级人类玩家。'
      ),
      how: t(
        'It combined supervised learning from human logs, deep reinforcement learning through self-play, global reward prediction, oracle guiding, and run-time policy adaptation.',
        '它结合人类牌谱监督学习、自我对弈深度强化学习、全局奖励预测、oracle guiding 和运行时策略适配。'
      ),
      why: t(
        'Mahjong defeated simpler search because the real state is hidden and scoring is long-horizon. Suphx worked by learning policies and reward estimates that could operate under uncertainty instead of enumerating a visible tree.',
        '麻将难倒简单搜索，因为真实状态隐藏且计分具有长程权衡。Suphx 的突破在于学习能在不确定性下运行的策略和奖励估计，而不是枚举可见树。'
      )
    },
    papers: [
      paper(
        'Suphx: Mastering Mahjong with Deep Reinforcement Learning',
        'Suphx：用深度强化学习掌握麻将',
        'Junjie Li, Sotetsu Koyamada, Qiwei Ye, Guoqing Liu, Chao Wang, Ruihan Yang, Li Zhao, Tao Qin, Tie-Yan Liu, Hsiao-Wuen Hon',
        'Junjie Li、Sotetsu Koyamada、叶启威、刘国庆、王超、杨睿涵、赵立、秦涛、刘铁岩、洪小文',
        'arXiv',
        'arXiv',
        '2020',
        'resources/papers/2019-suphx-mahjong-deep-rl.pdf'
      )
    ],
    commentarySections: [
      section(
        'Historical Background',
        '历史背景',
        'Mahjong is more difficult for direct search than chess-like board games because players see only part of the state. Every discard affects hand value, safety, turn order, and the hidden intentions of three opponents.',
        '麻将比类棋盘游戏更难直接搜索，因为玩家只能看到部分状态。每一次打牌都会影响手牌价值、安全性、巡目节奏，以及三个对手的隐藏意图。'
      ),
      section(
        'Core Idea',
        '核心思想',
        'Suphx learned from human games and then improved through reinforcement learning. Its additional reward prediction, oracle guiding, and policy adaptation components helped it reason about delayed points, hidden tiles, and changing table context.',
        'Suphx 先从人类牌谱学习，再通过强化学习改进。额外的奖励预测、oracle guiding 和策略适配组件，帮助它推理延迟得分、隐藏牌和不断变化的牌桌上下文。'
      ),
      section(
        'Long-Term Legacy',
        '长期影响',
        'Experts generally treat Suphx as a signal that deep reinforcement learning can handle multi-player stochastic imperfect-information games beyond poker. Its legacy is broadening the game-AI testbed from clean boards and two-player equilibrium toward messy cultural games with rich hidden state.',
        '专家通常把 Suphx 视为一个信号：深度强化学习可以处理扑克之外的多人随机不完全信息游戏。它的长期影响在于把游戏 AI 试验场从干净棋盘和两人均衡，扩展到具有丰富隐藏状态的复杂文化游戏。'
      )
    ],
    area: t('Multiplayer stochastic imperfect-information game AI', '多人随机不完全信息博弈 AI'),
    method: t('Deep reinforcement learning with reward prediction and run-time policy adaptation', '结合奖励预测与运行时策略适配的深度强化学习'),
    artifact: t('Japanese mahjong AI for Tenhou-style play', '面向天凤式对局的日本麻将 AI'),
    material: t('Suphx arXiv paper and Microsoft Research Asia authorship', 'Suphx arXiv 论文与微软亚洲研究院作者团队'),
    demo: t('Follow one discard through hidden tiles, table risk, reward prediction, and policy adaptation.', '跟随一次弃牌穿过隐藏牌、牌桌风险、奖励预测和策略适配。'),
    keyConcepts: [
      concept('Hidden tiles', '隐藏牌', 'Most relevant state information is not directly visible.', '大多数相关状态信息并不可见。'),
      concept('Global reward prediction', '全局奖励预测', 'The agent estimates long-horizon table outcomes.', '智能体估计长程牌桌收益。'),
      concept('Run-time adaptation', '运行时适配', 'Policy behavior changes with table context.', '策略行为随牌桌上下文调整。')
    ],
    relatedAchievements: [t('Pluribus', 'Pluribus'), t('Deep reinforcement learning', '深度强化学习'), t('Imperfect-information games', '不完全信息博弈')],
    relatedRegions: [t('China', '中国'), t('Japan', '日本')],
    demoSteps: [t('Observe public tiles', '观察公开牌'), t('Infer hidden state', '推断隐藏状态'), t('Adapt discard policy', '适配弃牌策略')],
    demoNotes: [
      {
        label: t('uncertainty cue', '不确定性线索'),
        text: t('The explainer separates visible discards from hidden hands and delayed reward estimates.', '解释图把公开弃牌、隐藏手牌和延迟奖励估计分开。')
      },
      {
        label: t('interaction point', '互动点'),
        text: t('Toggle risk mode to see how the best discard changes when opponents appear close to winning.', '切换风险模式，观察当对手接近和牌时最佳弃牌如何变化。')
      }
    ],
    visualModules: [
      archiveLink(
        'arXiv',
        'arXiv',
        'Suphx paper',
        'Suphx 论文',
        'Paper describing deep reinforcement learning for Japanese mahjong with hidden information and stochastic rewards.',
        '论文说明如何用深度强化学习处理日本麻将中的隐藏信息和随机收益。',
        'https://arxiv.org/abs/2003.13590'
      )
    ],
    sources: [
      source('Paper', '论文', 'Suphx arXiv paper', 'Suphx arXiv 论文', 'https://arxiv.org/abs/2003.13590'),
      source('DOI', 'DOI', 'arXiv DOI page', 'arXiv DOI 页面', 'https://doi.org/10.48550/arXiv.2003.13590'),
      source('Background paper', '背景论文', 'Building a Computer Mahjong Player via Deep CNNs', '用深度卷积网络构建麻将程序', 'https://arxiv.org/abs/1906.02146')
    ],
    demoImage: 'resources/images/bench-council-ai100/explainers/2019-suphx_mahjong-policy.svg',
    demoCaption: t('Suphx mahjong policy loop', 'Suphx 麻将策略循环'),
    demoSubcaption: t('Original explainer for hidden-information mahjong AI.', '隐藏信息麻将 AI 的原创解释图。'),
    demoSourceName: t('Suphx paper', 'Suphx 论文'),
    demoSourceUrl: 'https://arxiv.org/abs/2003.13590',
    demoUsage: t('Mahjong policy explainer', '麻将策略解释图')
  }),

  '2019-muzero': makeEvent({
    year: '2019-2020',
    title: t('MuZero', 'MuZero'),
    location: {
      name: t('DeepMind', 'DeepMind'),
      country: t('London, United Kingdom', '英国伦敦'),
      coordinates: [51.523, -0.128]
    },
    description: t(
      '<p>MuZero learned to plan without being given the exact rules of the environment. It built a compact internal model only for the quantities needed by search: policy, value, and reward. In board games and Atari, it linked AlphaZero-style planning with model learning from experience.</p>',
      '<p>MuZero 学会在没有显式环境规则的情况下进行规划。它只学习搜索所需的紧凑内部模型：策略、价值和奖励。在棋类游戏与 Atari 中，它把 AlphaZero 式规划和从经验中学习模型连接起来。</p>'
    ),
    figures: [
      {
        name: t('Julian Schrittwieser', '朱利安·施里特维泽'),
        role: t('MuZero first author', 'MuZero 第一作者')
      },
      {
        name: t('David Silver', '大卫·席尔瓦'),
        role: t('DeepMind reinforcement learning lead', 'DeepMind 强化学习负责人')
      }
    ],
    quoteText: t('planning with a learned model', '用学习到的模型进行规划'),
    quoteLabel: t('Paper cue', '论文线索'),
    quoteMeta: {
      workTitle: t(
        'Mastering Atari, Go, chess and shogi by planning with a learned model',
        '通过学习模型进行规划以掌握 Atari、围棋、国际象棋和将棋'
      ),
      workAuthors: t('Julian Schrittwieser et al., Nature, 2020', 'Julian Schrittwieser 等，Nature，2020'),
      sourceUrl: 'https://www.nature.com/articles/s41586-020-03051-4'
    },
    quotePage: t('Gaming AI branch: MuZero', 'AI 棋牌分支：MuZero'),
    analysis: {
      what: t(
        'MuZero extended AlphaZero-style planning by learning its own compact model instead of receiving exact environment dynamics.',
        'MuZero 通过学习自己的紧凑模型扩展了 AlphaZero 式规划，而不是直接获得精确环境动力学。'
      ),
      how: t(
        'It learned latent dynamics, reward, policy, and value predictions, then used those predictions inside tree search.',
        '它学习潜在动力学、奖励、策略和价值预测，并把这些预测放入树搜索。'
      ),
      why: t(
        'It worked because search did not need a perfect simulator of every future observation; it only needed a model useful for rewards and values.',
        '它成功在于搜索不需要完美模拟每个未来观测，只需要一个对奖励和价值有用的模型。'
      )
    },
    papers: [
      paper(
        'Mastering Atari, Go, chess and shogi by planning with a learned model',
        '通过学习模型进行规划以掌握 Atari、围棋、国际象棋和将棋',
        'Julian Schrittwieser et al.',
        'Julian Schrittwieser 等',
        'Nature',
        'Nature',
        '2020',
        'https://www.nature.com/articles/s41586-020-03051-4'
      ),
      paper(
        'Mastering Atari, Go, Chess and Shogi by Planning with a Learned Model',
        '通过学习模型进行规划以掌握 Atari、围棋、国际象棋和将棋',
        'Julian Schrittwieser et al.',
        'Julian Schrittwieser 等',
        'arXiv',
        'arXiv',
        '2019',
        'resources/papers/2019-muzero-learned-model.pdf'
      )
    ],
    commentarySections: [
      section(
        'Historical Background',
        '历史背景',
        'AlphaZero searched using known rules, while many reinforcement-learning agents learned from pixels without explicit lookahead. MuZero connected these two worlds by learning a model that was useful for planning even when the exact rules were not supplied.',
        'AlphaZero 依赖已知规则搜索，而许多强化学习智能体从像素学习但缺少显式前瞻。MuZero 通过学习一个对规划有用的模型，把这两个世界连接起来，即使没有提供精确规则也能工作。'
      ),
      section(
        'Core Idea',
        '核心思想',
        'Instead of predicting every future observation, MuZero learns a latent dynamics model for rewards, values, policies, and search. The model is judged by whether it helps decisions, not by whether it reconstructs the full world.',
        'MuZero 不预测每个未来观测，而是学习面向奖励、价值、策略和搜索的潜在动力学模型。这个模型按是否帮助决策来评价，而不是按是否重建完整世界来评价。'
      ),
      section(
        'Long-Term Legacy',
        '长期影响',
        'Experts generally treat MuZero as a landmark in learned-model planning. Its legacy is showing that model-based reinforcement learning can combine the strengths of AlphaZero-style search with experience-driven model learning.',
        '专家通常把 MuZero 视为学习模型规划的标志性成果。它的长期影响在于说明：基于模型的强化学习可以结合 AlphaZero 式搜索和经验驱动模型学习的优势。'
      )
    ],
    area: t('Learned-model planning', '学习模型的规划'),
    method: t('Latent dynamics, policy-value prediction, and tree search', '潜在动力学、策略-价值预测与树搜索'),
    artifact: t('Planning agent for board games and Atari', '面向棋类游戏与 Atari 的规划智能体'),
    material: t('Nature paper, arXiv preprint, and DeepMind blog', 'Nature 论文、arXiv 预印本与 DeepMind 博客'),
    demo: t('See how a compact latent model replaces handcrafted game dynamics inside search.', '观察紧凑潜在模型如何在搜索中替代手工游戏动力学。'),
    keyConcepts: [
      concept('Latent dynamics', '潜在动力学', 'The model predicts internal states rather than full observations.', '模型预测内部状态，而不是完整观测。'),
      concept('Reward prediction', '奖励预测', 'Search uses learned reward estimates at imagined steps.', '搜索在想象步骤中使用学习到的奖励估计。'),
      concept('Policy-value search', '策略-价值搜索', 'Planning still uses policy and value guidance.', '规划仍然使用策略和价值引导。')
    ],
    relatedAchievements: [t('AlphaZero', 'AlphaZero'), t('DQN', 'DQN'), t('Model-based reinforcement learning', '基于模型的强化学习')],
    relatedRegions: [t('United Kingdom', '英国')],
    demoSteps: [t('Encode observation', '编码观测'), t('Roll latent model', '推进潜在模型'), t('Search for action', '搜索行动')],
    demoNotes: [
      {
        label: t('model cue', '模型线索'),
        text: t('The model predicts only what search needs: reward, value, and policy.', '模型只预测搜索需要的内容：奖励、价值和策略。')
      },
      {
        label: t('interaction point', '互动点'),
        text: t('Toggle between known rules and learned dynamics to see how MuZero keeps planning without a handcrafted simulator.', '切换已知规则和学习动力学，观察 MuZero 如何在没有手工模拟器时继续规划。')
      }
    ],
    visualModules: [
      archiveLink(
        'Nature',
        'Nature',
        'MuZero paper',
        'MuZero 论文',
        'Nature article describing planning with a learned model.',
        '描述用学习模型进行规划的 Nature 论文。',
        'https://www.nature.com/articles/s41586-020-03051-4'
      )
    ],
    sources: [
      source('Paper', '论文', 'Nature paper', 'Nature 论文', 'https://www.nature.com/articles/s41586-020-03051-4'),
      source('Preprint', '预印本', 'arXiv preprint', 'arXiv 预印本', 'https://arxiv.org/abs/1911.08265'),
      source('Blog', '博客', 'DeepMind MuZero blog', 'DeepMind MuZero 博客', 'https://deepmind.google/discover/blog/muzero-mastering-go-chess-shogi-and-atari-without-rules/')
    ],
    demoImage: 'resources/images/bench-council-ai100/explainers/2019-muzero_learned-model.svg',
    demoCaption: t('MuZero learned model', 'MuZero 学习模型'),
    demoSubcaption: t('Original explainer for latent-model planning.', '潜在模型规划的原创解释图。'),
    demoSourceName: t('MuZero paper', 'MuZero 论文'),
    demoSourceUrl: 'https://www.nature.com/articles/s41586-020-03051-4',
    demoUsage: t('Learned-model planning explainer', '学习模型规划解释图')
  })
};

module.exports = events;
