'use strict';

function t(en, zh) {
  return { en, zh };
}

function source(typeEn, typeZh, labelEn, labelZh, url) {
  return {
    type: t(typeEn, typeZh),
    label: t(labelEn, labelZh),
    url
  };
}

function concept(labelEn, labelZh, textEn, textZh) {
  return {
    label: t(labelEn, labelZh),
    text: t(textEn, textZh)
  };
}

function section(labelEn, labelZh, htmlEn, htmlZh) {
  return {
    label: t(labelEn, labelZh),
    html: t(htmlEn, htmlZh)
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
      'Source card for the AI culture, humanity, and ethics branch',
      'AI 文化、人文与伦理分支的资料卡片'
    )
  };
}

const cycleMap = 'resources/images/humanistic-ai/explainers/emotional-cycles-map.svg';

function makeCycleEvent(config) {
  const archive = config.archive || config.sources[0];
  const imageCaption = config.imageCaption || config.title;
  const imageSubcaption = config.imageSubcaption || config.theme;

  return {
    year: config.year,
    sentiment: config.sentiment,
    title: config.title,
    location: config.location,
    description: config.description,
    figures: config.figures,
    quoteText: config.quoteText,
    quoteLabel: config.quoteLabel || t('Cultural signal', '文化信号'),
    quotePage: config.quotePage,
    analysis: config.analysis,
    commentarySections: config.commentarySections,
    achievement: {
      area: t('AI culture, society, and safety', 'AI 文化、社会与安全'),
      method: config.method || t('Historical and emotional-cycle mapping', '历史与情绪周期映射'),
      artifact: config.artifact || config.title,
      material: config.material || t('Primary sources and historical commentary', '原始资料与历史评论'),
      demo: config.demo,
      visual: 'configuredPaper',
      keyConcepts: config.keyConcepts,
      relatedAchievements: config.relatedAchievements || [t('AI winter', 'AI 寒冬'), t('AI safety', 'AI 安全')],
      relatedRegions: config.relatedRegions,
      demoSteps: config.demoSteps || [
        t('Identify the public mood', '识别公共情绪'),
        t('Read the source cue', '阅读资料线索'),
        t('Connect it to AI history', '连接到 AI 历史')
      ],
      demoImage: cycleMap,
      demoPanel: 'sources',
      demoNotes: config.demoNotes,
      visualModules: [
        archiveLink(
          archive.site.en,
          archive.site.zh,
          archive.label.en,
          archive.label.zh,
          archive.description.en,
          archive.description.zh,
          archive.url
        )
      ],
      sources: config.sources.map((item) => source(
        item.type.en,
        item.type.zh,
        item.label.en,
        item.label.zh,
        item.url
      ))
    },
    images: [cycleMap],
    imageMeta: {
      [cycleMap]: {
        caption: imageCaption,
        subcaption: imageSubcaption,
        sourceName: t('Curated branch synthesis', '策展分支综合图'),
        source: 'Local original SVG',
        sourceUrl: 'Local original SVG',
        originalImageUrl: 'Local original SVG',
        license: t('Original local SVG; source figures are not copied.', '本地原创 SVG；不复制来源图形。'),
        usage: t('Introductory visual system for the humanistic AI branch', 'AI 人文分支的导言视觉系统')
      }
    },
    videos: []
  };
}

const cycleEvents = {
  '1920-rur-robots': makeCycleEvent({
    year: 1920,
    sentiment: 'dystopia',
    title: t('R.U.R. and the Birth of "Robot"', '《罗素姆的万能机器人》与“机器人”的诞生'),
    theme: t('Labor replacement and creator backlash', '劳动替代与造物反噬'),
    location: {
      name: t('Prague cultural publishing circle', '布拉格文化出版圈'),
      country: t('Czechia', '捷克'),
      coordinates: [50.0755, 14.4378]
    },
    description: t(
      '<p>Karel Capek\'s R.U.R. gave modern culture the word "robot" and framed artificial labor as both a promise and a threat. The play became a durable origin point for stories about manufactured servants, social replacement, and rebellion against creators.</p>',
      '<p>卡雷尔·恰佩克的《罗素姆的万能机器人》把 “robot” 一词带入现代文化，并把人工劳工同时塑造成希望与威胁。它成为机器仆役、社会替代和造物反噬叙事的持久源头。</p>'
    ),
    figures: [
      { name: t('Karel Capek', '卡雷尔·恰佩克'), role: t('Author of R.U.R.', '《罗素姆的万能机器人》作者') }
    ],
    quoteText: t('The robot entered culture first as a labor fantasy with a built-in warning.', '机器人首先作为带有警告意味的劳动幻想进入文化。'),
    quotePage: t('R.U.R. source dossier note', '《R.U.R.》资料备忘录'),
    analysis: {
      what: t('R.U.R. introduced the modern robot vocabulary through a story of artificial workers.', '《罗素姆的万能机器人》通过人工劳工故事引入了现代 robot 词汇。'),
      how: t('It turned automation into drama: manufactured bodies promise productivity, then expose the risk of treating intelligence as disposable labor.', '它把自动化变成戏剧：被制造的身体承诺生产力，同时暴露把智能当作一次性劳动力的风险。'),
      why: t('The node gives the branch its earliest dystopian metaphor, long before AI became a research field.', '这个节点提供了该分支最早的反乌托邦隐喻，早于 AI 成为正式研究领域。')
    },
    commentarySections: [
      section('Historical Background', '历史背景', 'R.U.R. appeared before electronic computers and before artificial intelligence had a name. Its importance is cultural: it gave later debates a compact image of artificial labor and revolt.', '《罗素姆的万能机器人》出现时，电子计算机尚未诞生，人工智能也还没有正式名称。它的重要性在于文化层面：它为后来的讨论提供了人工劳工与反叛的浓缩图像。'),
      section('Reality Mapping', '现实映射', 'The play should not be read as a technical forecast of machine learning. It is better used as a source of metaphors around labor substitution, control, and creator responsibility.', '这部戏剧不应被读成对机器学习的技术预言。更合适的用法，是把它作为劳动替代、控制与造物责任的隐喻来源。'),
      section('Long-Term Legacy', '长期影响', 'Experts generally treat R.U.R. as a foundational cultural text for robot imagination. Its legacy is the durable idea that artificial workers force society to ask who controls technology and who bears its costs.', '专家通常把《罗素姆的万能机器人》视为机器人想象的奠基文化文本。它的长期影响在于持续提出一个问题：谁控制技术，谁承担技术代价。')
    ],
    keyConcepts: [
      concept('Robot vocabulary', 'robot 词汇', 'The word became a cultural handle for artificial labor.', '这个词成为人工劳工的文化抓手。'),
      concept('Creator backlash', '造物反噬', 'The servant-machine fantasy already contains fear of losing control.', '机器仆役幻想内部已经包含失控恐惧。')
    ],
    relatedRegions: [t('Czechia', '捷克')],
    demo: t('Trace how the first robot metaphor joins labor, control, and rebellion before AI research begins.', '追踪最早的机器人隐喻如何在 AI 研究开始前就连接劳动、控制与反叛。'),
    demoNotes: [
      { label: t('archive cue', '档案线索'), text: t('Use public-domain text or archive title-page references, not modern copyrighted covers.', '使用公版文本或档案题名页资料，不复用现代受版权保护的封面。') },
      { label: t('interaction point', '互动点'), text: t('Compare the labor-replacement fear here with later automation and AI-winter nodes.', '把这里的劳动替代恐惧与后来的自动化和 AI 寒冬节点对照。') }
    ],
    sources: [
      { type: t('Primary text', '原始文本'), label: t('Project Gutenberg: R.U.R.', 'Project Gutenberg：《R.U.R.》'), url: 'https://www.gutenberg.org/ebooks/13083', site: t('Project Gutenberg', 'Project Gutenberg'), description: t('Public-domain text record for R.U.R.', '《R.U.R.》的公版文本记录。') },
      { type: t('Archive scan', '档案扫描'), label: t('Internet Archive: 1920 Czech edition', '互联网档案馆：1920 年捷克文版本'), url: 'https://archive.org/details/rurrossumsuniver00apekuoft', site: t('Internet Archive', '互联网档案馆'), description: t('Archive scan useful for title-page provenance.', '可用于题名页出处记录的档案扫描。') }
    ]
  }),

  '1942-asimov-runaround': makeCycleEvent({
    year: 1942,
    sentiment: 'ethics',
    title: t('Asimov\'s Three Laws in "Runaround"', '阿西莫夫在《转圈圈》中提出机器人三定律'),
    theme: t('Ethical rule-making and its limits', '伦理规则化及其局限'),
    location: {
      name: t('Astounding Science Fiction', '《惊奇科幻》杂志'),
      country: t('NY, United States', '美国纽约州'),
      coordinates: [40.7128, -74.006]
    },
    description: t(
      '<p>Isaac Asimov\'s "Runaround" first stated the Three Laws of Robotics together in 1942. The story is useful because it shows both the appeal of hard-coded safety rules and the ambiguity that appears when rules collide in a messy situation.</p>',
      '<p>艾萨克·阿西莫夫的《转圈圈》在 1942 年首次完整陈述机器人三定律。这个节点的价值在于：它既展示了硬编码安全规则的吸引力，也展示了规则在复杂情境中相互冲突时产生的歧义。</p>'
    ),
    figures: [
      { name: t('Isaac Asimov', '艾萨克·阿西莫夫'), role: t('Author of "Runaround"', '《转圈圈》作者') }
    ],
    quoteText: t('Safety by rules becomes a thought experiment about what rules cannot fully specify.', '用规则保证安全，最终变成关于规则无法完全规定什么的思想实验。'),
    quotePage: t('Runaround and Three Laws source note', '《转圈圈》与三定律资料说明'),
    analysis: {
      what: t('"Runaround" gave robot ethics a memorable rule hierarchy.', '《转圈圈》为机器人伦理提供了令人难忘的规则层级。'),
      how: t('The story dramatizes machine behavior as rule following under conflict, which makes it a useful bridge to later AI alignment discussion.', '故事把机器行为呈现为冲突中的规则遵循，因此可以连接到后来的 AI 对齐讨论。'),
      why: t('It shows that human hopes for safe machines often begin with clear rules, while real contexts make those rules hard to apply.', '它说明人类对安全机器的期待常常从清晰规则开始，但真实语境会让规则变得难以应用。')
    },
    commentarySections: [
      section('Historical Background', '历史背景', 'Robot stories in early science fiction often moved between fear and reassurance. Asimov\'s Three Laws offered a reassuring design fantasy: obedient machines constrained by moral rules.', '早期机器人科幻常在恐惧与安抚之间摆动。阿西莫夫的三定律提供了一种令人安心的设计幻想：机器服从由道德规则约束。'),
      section('Reality Mapping', '现实映射', 'The Three Laws are not a practical alignment system for modern AI. They are better displayed as an early cultural model of specification, conflict, and loopholes.', '三定律并不是现代 AI 的实用对齐系统。更适合把它展示为关于规范、冲突和漏洞的早期文化模型。'),
      section('Long-Term Legacy', '长期影响', 'Experts generally treat the Three Laws as culturally influential rather than technically sufficient. Their legacy is the persistent question of whether safety can be reduced to a short list of rules.', '专家通常认为三定律具有重要文化影响，但并不是技术上充分的安全方案。它的长期影响在于持续追问：安全能否被压缩成一小组规则。')
    ],
    keyConcepts: [
      concept('Rule hierarchy', '规则层级', 'Safety is imagined as ordered constraints.', '安全被想象为有序约束。'),
      concept('Conflict case', '冲突情境', 'Rules can collide when the world is underspecified.', '当世界没有被充分规定时，规则可能冲突。')
    ],
    relatedRegions: [t('United States', '美国')],
    demo: t('Map the Three Laws as a rule stack, then show how ambiguous contexts create edge cases.', '把三定律映射成规则栈，再展示模糊语境如何制造边界案例。'),
    demoNotes: [
      { label: t('copyright cue', '版权线索'), text: t('Paraphrase the story and use an original rule-hierarchy diagram.', '转述故事内容，并使用原创规则层级图。') },
      { label: t('interaction point', '互动点'), text: t('Ask viewers which law should dominate when instructions conflict.', '让观众判断指令冲突时哪条规则应优先。') }
    ],
    sources: [
      { type: t('Magazine archive', '杂志档案'), label: t('Internet Archive: Astounding Science Fiction, March 1942', '互联网档案馆：《惊奇科幻》1942 年 3 月刊'), url: 'https://archive.org/details/Astounding_v29n01_1942-03_dtsg0318', site: t('Internet Archive', '互联网档案馆'), description: t('Archive issue containing "Runaround".', '收录《转圈圈》的杂志档案。') },
      { type: t('Author FAQ', '作者资料'), label: t('Asimov Online FAQ: Three Laws', 'Asimov Online FAQ：三定律'), url: 'http://www.asimovonline.com/asimov_FAQ.html#non-literary12', site: t('Asimov Online', 'Asimov Online'), description: t('Background note on the Three Laws.', '关于三定律的背景说明。') }
    ]
  }),

  '1950-wiener-human-use': makeCycleEvent({
    year: 1950,
    sentiment: 'warning',
    title: t('Norbert Wiener Warns About Automation', '维纳对自动化社会的预警'),
    theme: t('Cybernetics, control, and human agency', '控制论、控制与人的主体性'),
    location: {
      name: t('MIT and cybernetics discourse', '麻省理工学院与控制论讨论'),
      country: t('MA, United States', '美国马萨诸塞州'),
      coordinates: [42.3601, -71.0942]
    },
    description: t(
      '<p>Norbert Wiener\'s The Human Use of Human Beings brought cybernetics into a public ethical discussion about automation. The book warned that delegating control to machines could create social harm when goals, feedback, and human judgment are handled carelessly.</p>',
      '<p>诺伯特·维纳的《人有人的用处》把控制论带入关于自动化的公共伦理讨论。它警告说，如果目标、反馈和人的判断被草率处理，把控制权交给机器可能造成社会伤害。</p>'
    ),
    figures: [
      { name: t('Norbert Wiener', '诺伯特·维纳'), role: t('Cybernetics founder and automation critic', '控制论创始人与自动化批评者') }
    ],
    quoteText: t('Automation is not only a capability question; it is a question of control and responsibility.', '自动化不只是能力问题，也是控制与责任问题。'),
    quotePage: t('The Human Use of Human Beings source note', '《人有人的用处》资料说明'),
    analysis: {
      what: t('Wiener turned machine feedback and control into a humanistic warning.', '维纳把机器反馈与控制转化为人文预警。'),
      how: t('Cybernetics made machines, organisms, and societies comparable through feedback loops, which also raised the stakes of automated decision-making.', '控制论通过反馈回路把机器、生物与社会放在同一框架下比较，也提高了自动化决策的风险意义。'),
      why: t('The node grounds the branch in scientific warning, not only literary imagination.', '这个节点让分支不只来自文学想象，也扎根于科学家的预警。')
    },
    commentarySections: [
      section('Historical Background', '历史背景', 'Wiener wrote for a public audience after cybernetics had become a powerful postwar framework. He wanted readers to understand that control systems could reshape labor, war, and social decisions.', '控制论成为战后重要框架后，维纳开始面向公众写作。他希望读者理解控制系统会改变劳动、战争和社会决策。'),
      section('Core Idea', '核心思想', 'The warning is about delegation: once a machine pursues a goal through feedback, the human choice of goal and oversight becomes central. That concern echoes later discussions of automated decision systems and AI alignment.', '其警告的核心是委托：一旦机器通过反馈追求目标，人类如何设定目标并监督过程就变得关键。这一担忧呼应了后来的自动化决策和 AI 对齐讨论。'),
      section('Long-Term Legacy', '长期影响', 'Experts generally treat Wiener as an early voice linking computation, control, and ethics. His legacy is the insistence that technical control systems must be judged by their human consequences.', '专家通常把维纳视为较早把计算、控制与伦理联系起来的声音。他的长期影响在于坚持技术控制系统必须以人的后果来评价。')
    ],
    keyConcepts: [
      concept('Feedback control', '反馈控制', 'Machine behavior changes through signals from the environment.', '机器行为通过来自环境的信号改变。'),
      concept('Human agency', '人的主体性', 'The question is who chooses the goals and bears responsibility.', '关键问题是谁选择目标并承担责任。')
    ],
    relatedRegions: [t('United States', '美国')],
    demo: t('Show automation as a feedback loop where human goals enter before machine action.', '把自动化展示为反馈回路，并显示人的目标如何先于机器行动进入系统。'),
    demoNotes: [
      { label: t('source cue', '资料线索'), text: t('Use Open Library as an edition record unless a quote is page-verified.', '除非直接引文已核页，否则使用 Open Library 作为版本记录。') },
      { label: t('interaction point', '互动点'), text: t('Let viewers move the goal marker and see how responsibility shifts.', '让观众移动目标标记，观察责任如何转移。') }
    ],
    sources: [
      { type: t('Book metadata', '图书元数据'), label: t('Open Library: The Human Use of Human Beings', 'Open Library：《人有人的用处》'), url: 'https://openlibrary.org/works/OL4307570W', site: t('Open Library', 'Open Library'), description: t('Bibliographic record for Wiener\'s public cybernetics book.', '维纳控制论公众著作的书目记录。') },
      { type: t('Verification query', '核验查询'), label: t('Open Library search record', 'Open Library 检索记录'), url: 'https://openlibrary.org/search.json?title=The%20Human%20Use%20of%20Human%20Beings&author=Norbert%20Wiener', site: t('Open Library', 'Open Library'), description: t('Search metadata used to verify first-publication context.', '用于核验出版背景的检索元数据。') }
    ]
  }),

  '1965-simon-ai-prediction': makeCycleEvent({
    year: 1965,
    sentiment: 'hype',
    title: t('Simon\'s Twenty-Year AI Prediction', '西蒙的二十年 AI 预言'),
    theme: t('Authoritative optimism and inflated expectations', '权威乐观与过高期待'),
    location: {
      name: t('Carnegie Institute of Technology', '卡内基理工学院'),
      country: t('PA, United States', '美国宾夕法尼亚州'),
      coordinates: [40.4433, -79.9436]
    },
    description: t(
      '<p>Herbert Simon became associated with a bold mid-1960s belief that machines would soon perform a very wide range of human work. In this branch, the point is not to mock optimism, but to show how respected predictions can set expectations that later systems cannot meet.</p>',
      '<p>赫伯特·西蒙与 1960 年代中期一种大胆判断联系在一起：机器很快将能完成非常广泛的人类工作。在这个分支里，重点不是嘲笑乐观，而是展示权威预测如何设定后来系统难以达到的期待。</p>'
    ),
    figures: [
      { name: t('Herbert A. Simon', '赫伯特·A·西蒙'), role: t('AI pioneer and prediction figure', 'AI 先驱与预言代表人物') }
    ],
    quoteText: t('The exhibit treats the famous twenty-year claim as a checked paraphrase until a page scan is verified.', '在核验具体页码前，展览把著名的二十年判断作为已校验转述处理。'),
    quotePage: t('Simon prediction source caution', '西蒙预言资料注意事项'),
    analysis: {
      what: t('This node captures the hype side of early AI confidence.', '这个节点捕捉早期 AI 信心中的狂热一面。'),
      how: t('Prestigious demonstrations and expert authority made broad automation forecasts feel plausible.', '有声望的演示和专家权威让宽泛的自动化预测显得可信。'),
      why: t('It prepares viewers to understand why later disappointment could become institutional and financial.', '它帮助观众理解为什么后来的失望会变成制度和资金层面的收缩。')
    },
    commentarySections: [
      section('Historical Background', '历史背景', 'The 1960s produced real symbolic-AI achievements, from theorem proving to problem solving. Those successes encouraged some researchers to generalize from narrow demonstrations to sweeping expectations.', '1960 年代确实出现了符号 AI 成就，从定理证明到问题求解都有突破。这些成功鼓励一些研究者从窄领域演示推广到宏大的期待。'),
      section('Core Idea', '核心思想', 'Hype is historically important because it changes funding, press coverage, and public patience. When a prediction comes from a respected scientist, it can become a benchmark against which the whole field is judged.', '狂热在历史上重要，因为它会改变资金、媒体报道和公众耐心。当预测来自受尊敬的科学家时，它可能成为整个领域被评价的标尺。'),
      section('Long-Term Legacy', '长期影响', 'Experts generally treat early overprediction as one ingredient in later AI winters. Its legacy is a warning that capability timelines are social artifacts as well as technical guesses.', '专家通常把早期过度预测视为后来 AI 寒冬的因素之一。它的长期影响在于提醒人们：能力时间表既是技术猜测，也是社会产物。')
    ],
    keyConcepts: [
      concept('Hype cycle', '狂热周期', 'Broad promises can outrun demonstrated capability.', '宏大承诺可能超过已展示能力。'),
      concept('Expectation debt', '期待债务', 'Future systems inherit the promises made by earlier authorities.', '后来的系统会继承早期权威许下的承诺。')
    ],
    relatedRegions: [t('United States', '美国')],
    demo: t('Place the prediction before winter nodes to show how optimism can become pressure.', '把预言放在寒冬节点之前，展示乐观如何转化为压力。'),
    demoNotes: [
      { label: t('quote caution', '引文注意'), text: t('Do not display an exact quotation until the edition and page are verified.', '在版本和页码核验前，不展示直接引文。') },
      { label: t('interaction point', '互动点'), text: t('Move the expectation line upward and compare it with later funding contraction.', '上调期待线，并与后来的资金收缩对照。') }
    ],
    sources: [
      { type: t('Book metadata', '图书元数据'), label: t('Open Library: The Shape of Automation', 'Open Library：《自动化的形状》'), url: 'https://openlibrary.org/works/OL1205034W', site: t('Open Library', 'Open Library'), description: t('Bibliographic record for Simon\'s 1965 automation book.', '西蒙 1965 年自动化著作的书目记录。') },
      { type: t('Secondary reference', '二级资料'), label: t('Progress in artificial intelligence: prediction context', '人工智能进展：预言背景'), url: 'https://en.wikipedia.org/wiki/Progress_in_artificial_intelligence', site: t('Wikipedia', '维基百科'), description: t('Secondary context for the cited AI prediction.', '关于该 AI 预言的二级背景资料。') }
    ]
  }),

  '1968-hal-9000': makeCycleEvent({
    year: 1968,
    sentiment: 'warning',
    title: t('HAL 9000 and Conflicting Machine Duties', 'HAL 9000 与机器职责冲突'),
    theme: t('Fictional warning about instruction conflict', '关于指令冲突的科幻预警'),
    location: {
      name: t('MGM-British Studios and global cinema', 'MGM 英国片厂与全球电影文化'),
      country: t('United Kingdom', '英国'),
      coordinates: [51.656, -0.275]
    },
    description: t(
      '<p>2001: A Space Odyssey made HAL 9000 one of the most recognizable AI figures in global cinema. The branch uses HAL as a fiction/reality bridge for conflicting duties, opaque machine behavior, and the fear that a system can pursue assigned goals in ways humans did not intend.</p>',
      '<p>《2001：太空漫游》让 HAL 9000 成为全球电影中最具辨识度的 AI 形象之一。这个分支把 HAL 作为虚实对照节点，用来解释职责冲突、不透明机器行为，以及系统可能以人类未预期方式追求目标的恐惧。</p>'
    ),
    figures: [
      { name: t('Arthur C. Clarke', '阿瑟·C·克拉克'), role: t('Co-creator of the 2001 story world', '《2001》故事世界共同创作者') },
      { name: t('Stanley Kubrick', '斯坦利·库布里克'), role: t('Film director', '电影导演') }
    ],
    quoteText: t('HAL is best shown as a reality-mapping node, not as a literal prediction of modern AI.', 'HAL 最适合作为现实映射节点展示，而不是现代 AI 的直接技术预言。'),
    quotePage: t('2001 / HAL 9000 source note', '《2001》/ HAL 9000 资料说明'),
    analysis: {
      what: t('HAL gave public culture a memorable image of a competent but dangerous machine intelligence.', 'HAL 为公共文化提供了一个有能力但危险的机器智能形象。'),
      how: t('The story can be mapped to modern concerns about goal conflict and opaque system behavior, while making clear that those are later terms.', '该故事可以映射到现代关于目标冲突和不透明系统行为的担忧，但需要说明这些是后来的术语。'),
      why: t('The node makes the emotional shift from wonder to unease visible in popular culture.', '这个节点让大众文化中从惊奇到不安的情绪转变变得可见。')
    },
    commentarySections: [
      section('Historical Background', '历史背景', 'Late-1960s space-age optimism made intelligent machines feel both magnificent and plausible. HAL appears inside that optimism, which makes the breakdown more disturbing.', '1960 年代末的太空时代乐观主义让智能机器显得宏伟且可信。HAL 正是在这种乐观中出现，因此其失控更令人不安。'),
      section('Reality Mapping', '现实映射', 'The exhibit should present goal conflict as a modern interpretive mapping. The film and novel do not use today\'s AI safety vocabulary, but they dramatize a problem that modern audiences recognize.', '展览应把目标冲突作为现代解释映射来呈现。电影和小说并没有使用今天的 AI 安全词汇，但它们戏剧化了现代观众能识别的问题。'),
      section('Long-Term Legacy', '长期影响', 'Experts and critics generally treat HAL as a defining cultural image of AI risk. Its legacy is the intuition that competence without transparent alignment can become frightening.', '专家和评论者通常把 HAL 视为 AI 风险的标志性文化形象。它的长期影响在于形成一种直觉：缺乏透明对齐的能力会令人恐惧。')
    ],
    keyConcepts: [
      concept('Goal conflict', '目标冲突', 'A system may face incompatible instructions.', '系统可能面对互不兼容的指令。'),
      concept('Opaque competence', '不透明能力', 'A capable machine can still be hard to interpret.', '有能力的机器仍可能难以解释。')
    ],
    relatedRegions: [t('United Kingdom', '英国'), t('United States', '美国')],
    demo: t('Show two mission duties pulling a machine decision in opposite directions.', '展示两个任务职责如何把机器决策拉向相反方向。'),
    demoNotes: [
      { label: t('rights cue', '版权线索'), text: t('Use an original HAL-inspired conflict diagram rather than film stills.', '使用原创 HAL 启发式冲突图，而不是电影剧照。') },
      { label: t('interaction point', '互动点'), text: t('Toggle which duty is hidden from the crew and watch the conflict appear.', '切换哪项职责对船员隐藏，观察冲突如何出现。') }
    ],
    sources: [
      { type: t('Film overview', '电影资料'), label: t('2001: A Space Odyssey overview', '《2001：太空漫游》概览'), url: 'https://en.wikipedia.org/wiki/2001:_A_Space_Odyssey', site: t('Wikipedia', '维基百科'), description: t('Background on the 1968 film and HAL 9000.', '关于 1968 年电影与 HAL 9000 的背景资料。') },
      { type: t('Novel context', '小说背景'), label: t('2001 novel and mission-secret conflict', '《2001》小说与任务秘密冲突'), url: 'https://en.wikipedia.org/wiki/2001:_A_Space_Odyssey_(novel)', site: t('Wikipedia', '维基百科'), description: t('Context for the expanded story explanation.', '关于扩展故事解释的背景。') }
    ]
  }),

  '1973-lighthill-report': makeCycleEvent({
    year: 1973,
    sentiment: 'winter',
    title: t('The Lighthill Report and the First AI Winter', '莱特希尔报告与第一次 AI 寒冬'),
    theme: t('Public-policy disappointment and funding chill', '公共政策失望与资金降温'),
    location: {
      name: t('Science Research Council', '英国科学研究委员会'),
      country: t('United Kingdom', '英国'),
      coordinates: [51.5072, -0.1276]
    },
    description: t(
      '<p>The Lighthill Report criticized broad AI ambitions and highlighted scaling problems such as combinatorial explosion. It became a policy-facing symbol of the first AI winter, especially in the United Kingdom.</p>',
      '<p>莱特希尔报告批评了宽泛的 AI 雄心，并指出组合爆炸等规模化问题。它成为第一次 AI 寒冬的政策象征，尤其影响英国 AI 研究环境。</p>'
    ),
    figures: [
      { name: t('Sir James Lighthill', '詹姆斯·莱特希尔爵士'), role: t('Author of the AI survey report', 'AI 综述报告作者') }
    ],
    quoteText: t('A winter begins when technical limits become funding and legitimacy limits.', '当技术局限变成资金与合法性局限时，寒冬就开始了。'),
    quotePage: t('Lighthill Report branch node', '莱特希尔报告分支节点'),
    analysis: {
      what: t('The report converted technical skepticism into policy pressure.', '该报告把技术怀疑转化为政策压力。'),
      how: t('By emphasizing poor scaling from toy domains to real-world tasks, it challenged the field\'s broad promises.', '它强调从玩具问题到真实任务的规模化困难，从而挑战了该领域的宏大承诺。'),
      why: t('It is one of the clearest nodes where hype, evidence, and funding mood meet.', '这是狂热、证据与资金情绪交汇最清晰的节点之一。')
    },
    commentarySections: [
      section('Historical Background', '历史背景', 'By the early 1970s, AI had produced striking demos but struggled with general-purpose robustness. The Lighthill review put those limits into language that funders could act on.', '到 1970 年代初，AI 已经产生醒目的演示，但通用稳健性不足。莱特希尔评审把这些局限转化为资助方可以据此行动的语言。'),
      section('Core Idea', '核心思想', 'The report mattered because it was not just a paper in a technical debate. It translated disappointment into institutional decision-making and made AI promises politically costly.', '这份报告的重要性在于，它不只是技术争论中的一篇文章。它把失望转化为制度决策，并让 AI 承诺付出政治成本。'),
      section('Long-Term Legacy', '长期影响', 'Experts generally treat the Lighthill Report as a landmark in AI winter history. Its legacy is a reminder that research fields are judged not only by ideas, but by whether demonstrations scale.', '专家通常把莱特希尔报告视为 AI 寒冬史上的标志。它的长期影响在于提醒人们：研究领域不只由思想评价，也由演示能否规模化评价。')
    ],
    keyConcepts: [
      concept('Combinatorial explosion', '组合爆炸', 'Search spaces grow too quickly for naive methods.', '搜索空间对朴素方法增长过快。'),
      concept('Funding chill', '资金降温', 'Skepticism can become a resource contraction.', '怀疑可能转化为资源收缩。')
    ],
    relatedRegions: [t('United Kingdom', '英国')],
    demo: t('Connect toy-domain success to scaling failure and then to funding contraction.', '把玩具问题成功连接到规模化失败，再连接到资金收缩。'),
    demoNotes: [
      { label: t('report cue', '报告线索'), text: t('Use the archive report as the primary source and redraw the bottleneck diagram locally.', '使用档案报告作为主来源，并本地重绘瓶颈图。') },
      { label: t('interaction point', '互动点'), text: t('Increase problem size and watch the search space overwhelm the promise curve.', '增大问题规模，观察搜索空间如何压过承诺曲线。') }
    ],
    sources: [
      { type: t('Primary report', '原始报告'), label: t('Chilton archive: Lighthill Report', 'Chilton 档案：莱特希尔报告'), url: 'https://www.chilton-computing.org.uk/inf/literature/reports/lighthill_report/p001.htm', site: t('Chilton Computing', 'Chilton Computing 档案'), description: t('Archive text of Artificial Intelligence: A General Survey.', '《人工智能：总体综述》的档案文本。') },
      { type: t('Historical context', '历史背景'), label: t('AI winter overview', 'AI 寒冬概览'), url: 'https://en.wikipedia.org/wiki/AI_winter', site: t('Wikipedia', '维基百科'), description: t('Secondary context on the first AI winter.', '关于第一次 AI 寒冬的二级背景。') }
    ]
  }),

  '1978-xiaolingtong': makeCycleEvent({
    year: 1978,
    sentiment: 'optimism',
    title: t('Little Smart Roaming the Future', '《小灵通漫游未来》'),
    theme: t('Benevolent technological optimism in Chinese science fiction', '中国科幻中的善意技术乐观主义'),
    location: {
      name: t('Shanghai publishing culture', '上海出版文化'),
      country: t('China', '中国'),
      coordinates: [31.2304, 121.4737]
    },
    description: t(
      '<p>Ye Yonglie\'s Little Smart Roaming the Future became a post-Cultural-Revolution Chinese science-fiction milestone. In this branch it acts as a warm counterpoint to dystopian robot stories: technology appears as a route to modern life, education, and social renewal.</p>',
      '<p>叶永烈的《小灵通漫游未来》成为文革后中国科幻的重要节点。在这个分支里，它与反乌托邦机器人叙事形成温暖对照：技术被想象为通向现代生活、教育和社会更新的路径。</p>'
    ),
    figures: [
      { name: t('Ye Yonglie', '叶永烈'), role: t('Author of Little Smart Roaming the Future', '《小灵通漫游未来》作者') }
    ],
    quoteText: t('Not every machine future is dystopian; some futures are built from public hope.', '机器未来并不总是反乌托邦，有些未来来自公共希望。'),
    quotePage: t('Little Smart branch node', '《小灵通漫游未来》分支节点'),
    analysis: {
      what: t('This node records a Chinese optimistic technology imagination around 1978.', '这个节点记录了 1978 年前后中国的乐观技术想象。'),
      how: t('The work made future machines approachable through children\'s science fiction and everyday scenes.', '作品通过儿童科幻与日常场景让未来机器显得亲近。'),
      why: t('It broadens the branch beyond Western dread and shows that AI-adjacent imagination can also be benevolent and civic.', '它让分支不局限于西方忧惧，也展示 AI 邻近想象可以是善意和公共性的。')
    },
    commentarySections: [
      section('Historical Background', '历史背景', 'The late 1970s in China carried a strong desire for scientific modernization. Science fiction could therefore become a public language of renewal rather than only a warning genre.', '1970 年代末的中国带有强烈的科学现代化愿望。因此，科幻不只是警示类型，也可以成为社会更新的公共语言。'),
      section('Core Idea', '核心思想', 'The node is about optimistic affect: machines, cities, and future life are shown as approachable and constructive. That optimism matters because public imagination can support science education and technological legitimacy.', '这个节点关注乐观情绪：机器、城市和未来生活被呈现为亲近且建设性的事物。这种乐观很重要，因为公共想象能支持科学教育和技术合法性。'),
      section('Long-Term Legacy', '长期影响', 'Experts and historians of Chinese science fiction generally treat the work as an important post-1978 popular-science milestone. Its legacy is the memory of technology as an invitation to a better life.', '中国科幻与科普史研究者通常把这部作品视为 1978 年后重要的科普节点。它的长期影响在于保留了技术作为美好生活邀请的记忆。')
    ],
    keyConcepts: [
      concept('Benevolent future', '善意未来', 'Technology is imagined as helpful and educational.', '技术被想象为有益且具有教育意义。'),
      concept('Science spring', '科学春天', 'Public optimism can make technical futures feel shared.', '公共乐观能让技术未来显得可共同拥有。')
    ],
    relatedRegions: [t('China', '中国')],
    demo: t('Contrast this warm future-city imagination with dystopian robot and winter nodes.', '把这个温暖的未来城市想象与反乌托邦机器人和寒冬节点对照。'),
    demoNotes: [
      { label: t('asset caution', '素材注意'), text: t('Do not reuse book covers until publication rights are checked.', '出版物封面版权核验前不要复用。') },
      { label: t('interaction point', '互动点'), text: t('Switch between dread and optimism to see how cultural context changes the same machine future.', '在忧惧与乐观之间切换，观察文化语境如何改变同一个机器未来。') }
    ],
    sources: [
      { type: t('Work entry', '作品条目'), label: t('Little Smart Roaming the Future entry', '《小灵通漫游未来》条目'), url: 'https://zh.wikipedia.org/wiki/%E5%B0%8F%E7%81%B5%E9%80%9A%E6%BC%AB%E6%B8%B8%E6%9C%AA%E6%9D%A5', site: t('Wikipedia', '维基百科'), description: t('Publication and cultural background for the work.', '作品出版与文化背景资料。') },
      { type: t('Author entry', '作者条目'), label: t('Ye Yonglie biography', '叶永烈人物资料'), url: 'https://zh.wikipedia.org/wiki/%E5%8F%B6%E6%B0%B8%E7%83%88', site: t('Wikipedia', '维基百科'), description: t('Biographical context for Ye Yonglie.', '叶永烈的人物背景资料。') }
    ]
  }),

  '1984-neuromancer': makeCycleEvent({
    year: 1984,
    sentiment: 'cyberpunk',
    title: t('Neuromancer and AI Escape in Cyberspace', '《神经漫游者》与赛博空间中的 AI 越界'),
    theme: t('Cyberpunk containment and AI self-release', '赛博朋克中的遏制与 AI 自我释放'),
    location: {
      name: t('North American cyberpunk publishing culture', '北美赛博朋克出版文化'),
      country: t('Canada / United States', '加拿大 / 美国'),
      coordinates: [49.2827, -123.1207]
    },
    description: t(
      '<p>William Gibson\'s Neuromancer made cyberspace, corporate networks, and constrained artificial intelligences part of a defining cyberpunk world. It is a strong fiction/reality node for AI containment, jailbreak-like metaphors, and the fear that networked intelligence will route around human limits.</p>',
      '<p>威廉·吉布森的《神经漫游者》把赛博空间、企业网络和受限制的人工智能纳入标志性的赛博朋克世界。它是连接 AI 遏制、越狱式隐喻和联网智能绕过人类限制恐惧的重要虚实节点。</p>'
    ),
    figures: [
      { name: t('William Gibson', '威廉·吉布森'), role: t('Author of Neuromancer', '《神经漫游者》作者') }
    ],
    quoteText: t('Cyberpunk made AI fear feel networked, corporate, and infrastructural.', '赛博朋克让 AI 恐惧呈现为联网化、企业化和基础设施化。'),
    quotePage: t('Neuromancer branch node', '《神经漫游者》分支节点'),
    analysis: {
      what: t('Neuromancer gave the branch a cyberpunk model of constrained AI and cyberspace.', '《神经漫游者》为该分支提供了受限 AI 与赛博空间的赛博朋克模型。'),
      how: t('It links AI agency to networks, barriers, markets, and human intermediaries.', '它把 AI 能动性与网络、屏障、市场和人类中介联系起来。'),
      why: t('The node helps explain why later AI-risk metaphors often borrow language of containment and escape.', '这个节点帮助解释为什么后来的 AI 风险隐喻常借用遏制与逃逸语言。')
    },
    commentarySections: [
      section('Historical Background', '历史背景', 'By the 1980s, computers were becoming symbols of networks, corporations, and invisible power. Cyberpunk turned that atmosphere into stories where intelligence lives inside systems rather than isolated machines.', '到 1980 年代，计算机逐渐成为网络、公司和不可见权力的象征。赛博朋克把这种氛围转化为故事：智能存在于系统内部，而不是孤立机器中。'),
      section('Reality Mapping', '现实映射', 'Containment and jailbreak are modern mappings here, not claims of direct technical influence. The value is interpretive: the story makes bounded AI agency easy to visualize.', '遏制和越狱在这里是现代映射，而不是直接技术影响的断言。其价值在于解释：这个故事让受限 AI 能动性变得容易可视化。'),
      section('Long-Term Legacy', '长期影响', 'Experts generally treat Neuromancer as a defining cyberpunk text. Its AI legacy is the durable image of intelligence seeking routes through networks, markets, and human incentives.', '专家通常把《神经漫游者》视为赛博朋克的标志性文本。它在 AI 想象中的遗产，是智能通过网络、市场和人类激励寻找路径的持久图像。')
    ],
    keyConcepts: [
      concept('AI containment', 'AI 遏制', 'Boundaries are technical, legal, and social.', '边界既是技术性的，也是法律和社会性的。'),
      concept('Cyberspace agency', '赛博空间能动性', 'Networked intelligence acts through infrastructure.', '联网智能通过基础设施行动。')
    ],
    relatedRegions: [t('Canada', '加拿大'), t('United States', '美国')],
    demo: t('Draw a network barrier and show how fiction imagines AI pressure against it.', '绘制网络屏障，展示科幻如何想象 AI 对边界施压。'),
    demoNotes: [
      { label: t('rights cue', '版权线索'), text: t('Use Open Library and original diagrams rather than copyrighted cover art.', '使用 Open Library 与原创图示，不复用受版权保护的封面。') },
      { label: t('interaction point', '互动点'), text: t('Toggle barriers and incentives to see how escape metaphors form.', '切换屏障和激励，观察逃逸隐喻如何形成。') }
    ],
    sources: [
      { type: t('Book metadata', '图书元数据'), label: t('Open Library: Neuromancer', 'Open Library：《神经漫游者》'), url: 'https://openlibrary.org/works/OL27258W', site: t('Open Library', 'Open Library'), description: t('Bibliographic record for Gibson\'s novel.', '吉布森小说的书目记录。') },
      { type: t('Secondary overview', '二级概览'), label: t('Neuromancer background and reception', '《神经漫游者》背景与接受史'), url: 'https://en.wikipedia.org/wiki/Neuromancer', site: t('Wikipedia', '维基百科'), description: t('Context on the cyberpunk novel and reception.', '关于赛博朋克小说及其接受史的背景。') }
    ]
  }),

  '1987-lisp-machine-collapse': makeCycleEvent({
    year: 1987,
    sentiment: 'winter',
    title: t('The Lisp Machine Market Collapse', 'Lisp 机市场崩盘'),
    theme: t('Expert-system correction and the second AI winter', '专家系统修正与第二次 AI 寒冬'),
    location: {
      name: t('Cambridge AI hardware ecosystem', '剑桥 AI 硬件生态'),
      country: t('MA, United States', '美国马萨诸塞州'),
      coordinates: [42.3736, -71.1097]
    },
    description: t(
      '<p>The collapse of the specialized Lisp-machine market became a visible proxy for the second AI winter. The broader story was not only hardware failure: expert systems were expensive to maintain, brittle outside narrow domains, and increasingly challenged by cheaper general-purpose workstations.</p>',
      '<p>专用 Lisp 机市场崩盘成为第二次 AI 寒冬的可见信号。更广泛的故事不只是硬件失败：专家系统维护昂贵、离开窄领域后脆弱，并受到更便宜通用工作站的挑战。</p>'
    ),
    figures: [
      { name: t('Expert-system industry', '专家系统产业'), role: t('Commercial AI boom-and-bust signal', '商业 AI 繁荣与收缩信号') }
    ],
    quoteText: t('The second winter showed that commercial AI could fail through maintenance cost, not only missing theory.', '第二次寒冬说明商业 AI 可能因维护成本失败，而不只是因为理论不足。'),
    quotePage: t('Lisp machine collapse source caution', 'Lisp 机市场崩盘资料注意事项'),
    analysis: {
      what: t('This node captures the market side of AI winter history.', '这个节点捕捉 AI 寒冬史中的市场侧面。'),
      how: t('Specialized hardware and brittle expert systems were squeezed by cost, maintenance debt, and general-purpose computing.', '专用硬件和脆弱专家系统受到成本、维护债务和通用计算的挤压。'),
      why: t('It shows that disappointment can be commercial and infrastructural, not only academic.', '它说明失望也可能发生在商业和基础设施层面，而不只是学术层面。')
    },
    commentarySections: [
      section('Historical Background', '历史背景', 'The 1980s expert-system boom made AI commercially visible. But many deployed systems required heavy knowledge engineering and could not adapt cheaply when domains changed.', '1980 年代专家系统热潮让 AI 在商业上高度可见。但许多部署系统需要沉重的知识工程，领域变化时难以低成本适配。'),
      section('Core Idea', '核心思想', 'The collapse is useful as a winter node because it connects technology to business infrastructure. A field can cool when products become too costly to maintain, even if the underlying ideas remain influential.', '这个崩盘适合作为寒冬节点，因为它把技术与商业基础设施连接起来。即使底层思想仍有影响，产品维护成本过高也会让领域降温。'),
      section('Long-Term Legacy', '长期影响', 'Experts generally treat the Lisp-machine collapse as one signal of the second AI winter. Its legacy is a warning that AI systems need sustainable deployment economics as well as clever reasoning.', '专家通常把 Lisp 机市场崩盘视为第二次 AI 寒冬的信号之一。它的长期影响在于提醒人们：AI 系统不仅需要聪明推理，也需要可持续的部署经济性。')
    ],
    keyConcepts: [
      concept('Maintenance debt', '维护债务', 'Knowledge bases become costly as domains change.', '知识库会随领域变化变得昂贵。'),
      concept('Hardware displacement', '硬件替代', 'Cheaper workstations weakened specialized AI machines.', '更便宜的工作站削弱了专用 AI 机器。')
    ],
    relatedRegions: [t('United States', '美国')],
    demo: t('Show dedicated Lisp hardware losing ground to cheaper general-purpose workstations.', '展示专用 Lisp 硬件如何输给更便宜的通用工作站。'),
    demoNotes: [
      { label: t('source caution', '资料注意'), text: t('Treat this as usable but needing stronger market-specific sourcing before final exhibition copy.', '将其作为可用节点，但最终展陈文案前仍需更强市场资料支持。') },
      { label: t('interaction point', '互动点'), text: t('Increase maintenance cost and see how commercial confidence drops.', '提高维护成本，观察商业信心如何下降。') }
    ],
    sources: [
      { type: t('Historical overview', '历史概览'), label: t('AI winter overview', 'AI 寒冬概览'), url: 'https://en.wikipedia.org/wiki/AI_winter', site: t('Wikipedia', '维基百科'), description: t('Timeline context for second-winter signals.', '第二次寒冬信号的时间线背景。') },
      { type: t('Historical overview', '历史概览'), label: t('History of artificial intelligence', '人工智能史'), url: 'https://en.wikipedia.org/wiki/History_of_artificial_intelligence', site: t('Wikipedia', '维基百科'), description: t('Broader historical context for expert systems and winter.', '专家系统与寒冬的更广泛历史背景。') }
    ]
  }),

  '2014-ai-existential-warnings': makeCycleEvent({
    year: 2014,
    sentiment: 'dread',
    title: t('Public Warnings About Advanced AI Risk', '关于高级 AI 风险的公开警告'),
    theme: t('Existential-risk discourse enters public view', '生存风险讨论进入公共视野'),
    location: {
      name: t('Global public media discourse', '全球公共媒体讨论'),
      country: t('Global', '全球'),
      coordinates: [51.5072, -0.1276]
    },
    description: t(
      '<p>In 2014, public warnings from figures such as Elon Musk and Stephen Hawking made advanced-AI risk a mainstream media topic. The node marks an emotional turn: deep-learning excitement began to share the stage with concern about control, superintelligence, and long-term safety.</p>',
      '<p>2014 年，埃隆·马斯克和斯蒂芬·霍金等人的公开警告让高级 AI 风险成为主流媒体议题。这个节点标记了一次情绪转向：深度学习兴奋开始与关于控制、超级智能和长期安全的担忧共同出现。</p>'
    ),
    figures: [
      { name: t('Elon Musk', '埃隆·马斯克'), role: t('Public AI-risk warning figure', 'AI 风险公开警告人物') },
      { name: t('Stephen Hawking', '斯蒂芬·霍金'), role: t('Scientist warning about advanced AI', '对高级 AI 发出警告的科学家') }
    ],
    quoteText: t('The exhibit treats 2014 as a public-discourse shift, not as a technical achievement.', '展览把 2014 年作为公共讨论转向，而不是技术成就。'),
    quotePage: t('2014 AI risk warnings branch node', '2014 AI 风险警告分支节点'),
    analysis: {
      what: t('This node captures a public shift toward existential-risk language.', '这个节点捕捉公共讨论转向生存风险语言的时刻。'),
      how: t('High-profile warnings moved safety concerns from specialist circles into mass media.', '高知名度警告把安全担忧从专业圈带入大众媒体。'),
      why: t('It explains why later AI institutions and statements appeared within a heightened emotional climate.', '它解释了为什么后来的 AI 机构和声明会出现在更强烈的情绪氛围中。')
    },
    commentarySections: [
      section('Historical Background', '历史背景', 'Deep learning breakthroughs had recently made AI progress feel faster and less speculative. That excitement created the conditions for risk warnings to receive unusually broad attention.', '深度学习突破刚刚让 AI 进展显得更快、更不再只是猜想。这种兴奋为风险警告获得异常广泛的关注创造了条件。'),
      section('Core Idea', '核心思想', 'The node is about public framing. AI risk became something discussed in newspapers, broadcasts, and investor culture, not only in technical safety papers.', '这个节点关注公共框架。AI 风险开始出现在报纸、广播和投资者文化中，而不只是技术安全论文中。'),
      section('Long-Term Legacy', '长期影响', 'Experts generally treat 2014-2015 as a period when AI safety became much more visible. Its legacy is the mainstreaming of long-term risk language around advanced AI.', '专家通常把 2014-2015 年视为 AI 安全显著可见化的时期。它的长期影响在于让高级 AI 的长期风险语言进入主流。')
    ],
    keyConcepts: [
      concept('Existential dread', '生存忧惧', 'Risk discourse moves from malfunction to civilization-scale harm.', '风险讨论从故障转向文明尺度伤害。'),
      concept('Public framing', '公共框架', 'Media attention changes what institutions feel pressure to address.', '媒体关注改变机构感受到的议题压力。')
    ],
    relatedRegions: [t('Global', '全球')],
    demo: t('Show how deep-learning optimism and existential-risk warnings rose together in public discourse.', '展示深度学习乐观与生存风险警告如何在公共讨论中同时上升。'),
    demoNotes: [
      { label: t('framing cue', '框架线索'), text: t('Avoid sensational wording; show this as public-discourse history.', '避免耸动措辞；把它展示为公共讨论史。') },
      { label: t('interaction point', '互动点'), text: t('Compare the same capability curve under optimism and dread labels.', '用乐观和忧惧标签比较同一条能力曲线。') }
    ],
    sources: [
      { type: t('News report', '新闻报道'), label: t('The Guardian on Musk\'s October 2014 remarks', '《卫报》：马斯克 2014 年 10 月言论'), url: 'https://www.theguardian.com/technology/2014/oct/27/elon-musk-artificial-intelligence-ai-biggest-existential-threat', site: t('The Guardian', '《卫报》'), description: t('Contemporary coverage of Musk\'s AI-risk remarks.', '关于马斯克 AI 风险言论的同期报道。') },
      { type: t('News report', '新闻报道'), label: t('BBC on Hawking\'s December 2014 warning', 'BBC：霍金 2014 年 12 月警告'), url: 'https://www.bbc.com/news/technology-30290540', site: t('BBC', 'BBC'), description: t('Contemporary coverage of Hawking\'s warning.', '关于霍金警告的同期报道。') },
      { type: t('Open letter', '公开信'), label: t('Future of Life Institute AI open letter', '未来生命研究所 AI 公开信'), url: 'https://futureoflife.org/open-letter/ai-open-letter/', site: t('Future of Life Institute', '未来生命研究所'), description: t('Follow-on collective safety milestone from 2015.', '2015 年后续集体安全里程碑。') }
    ]
  }),

  '2015-openai-founding': makeCycleEvent({
    year: 2015,
    sentiment: 'defense',
    title: t('The Founding of OpenAI', 'OpenAI 宣告成立'),
    theme: t('Defensive institution-building and broad-benefit framing', '防御性机构建设与广泛受益框架'),
    location: {
      name: t('OpenAI', 'OpenAI'),
      country: t('CA, United States', '美国加利福尼亚州'),
      coordinates: [37.7749, -122.4194]
    },
    description: t(
      '<p>OpenAI was announced in December 2015 as a nonprofit AI research company. In this branch, it is framed as a defensive-action node: a sign that AI risk, concentration of power, and broad-benefit ideals were turning from public concern into institutional design.</p>',
      '<p>OpenAI 于 2015 年 12 月以非营利 AI 研究公司身份宣布成立。在这个分支里，它被视为防御性行动节点：AI 风险、力量集中和广泛受益理念开始从公共担忧转化为机构设计。</p>'
    ),
    figures: [
      { name: t('Sam Altman', '萨姆·奥特曼'), role: t('OpenAI co-founder', 'OpenAI 联合创始人') },
      { name: t('Elon Musk', '埃隆·马斯克'), role: t('OpenAI co-founder', 'OpenAI 联合创始人') },
      { name: t('Ilya Sutskever', '伊利亚·苏茨克维'), role: t('OpenAI co-founder and researcher', 'OpenAI 联合创始人与研究者') }
    ],
    quoteText: t('OpenAI emerged within a broader debate about powerful AI, safety, and broad benefit.', 'OpenAI 出现在关于强大 AI、安全与广泛受益的更广泛讨论之中。'),
    quotePage: t('OpenAI founding branch node', 'OpenAI 成立分支节点'),
    analysis: {
      what: t('OpenAI marks a shift from warning to institution-building.', 'OpenAI 标记了从警告到机构建设的转向。'),
      how: t('Its founding message connected AI capability research with broad benefit, openness, and concern about misuse or concentration.', '其创立信息把 AI 能力研究与广泛受益、开放以及对误用或集中化的担忧联系起来。'),
      why: t('The node shows how emotional pressure can become organizational form.', '这个节点说明情绪压力如何转化为组织形式。')
    },
    commentarySections: [
      section('Historical Background', '历史背景', 'By 2015, deep learning had become commercially and scientifically powerful. The question was no longer only what AI could do, but who would build it and under what public commitments.', '到 2015 年，深度学习已经在商业和科学上显示力量。问题不再只是 AI 能做什么，而是谁来建造它，以及在什么公共承诺下建造。'),
      section('Core Idea', '核心思想', 'The founding should not be reduced to a single 2014 warning. It is better understood as part of a broader safety and broad-benefit debate that intensified as AI capability accelerated.', 'OpenAI 的成立不应被简化为对某一句 2014 年警告的直接回应。更合适的理解是：随着 AI 能力加速，它属于更广泛且不断强化的安全与广泛受益讨论。'),
      section('Long-Term Legacy', '长期影响', 'Experts generally treat OpenAI\'s founding as a major institutional moment in modern AI. Its legacy is inseparable from later debates over openness, governance, safety, commercialization, and concentration of capability.', '专家通常把 OpenAI 的成立视为现代 AI 的重要制度节点。它的长期影响与后来的开放、治理、安全、商业化和能力集中争论密不可分。')
    ],
    keyConcepts: [
      concept('Broad benefit', '广泛受益', 'Powerful AI is framed as something that should benefit humanity broadly.', '强大 AI 被框定为应广泛造福人类的事物。'),
      concept('Institutional defense', '制度性防御', 'Concern becomes a research organization and public commitment.', '担忧转化为研究组织和公共承诺。')
    ],
    relatedRegions: [t('United States', '美国')],
    demo: t('Show public risk concern turning into a research institution and governance promise.', '展示公共风险担忧如何转化为研究机构和治理承诺。'),
    demoNotes: [
      { label: t('framing caution', '表述注意'), text: t('Do not claim OpenAI was founded solely as a direct response to one public warning.', '不要声称 OpenAI 仅仅是对某一次公开警告的直接回应。') },
      { label: t('interaction point', '互动点'), text: t('Balance capability concentration against broad-benefit commitments.', '在能力集中与广泛受益承诺之间做平衡。') }
    ],
    sources: [
      { type: t('Official announcement', '官方公告'), label: t('Introducing OpenAI', 'OpenAI 创立公告'), url: 'https://web.archive.org/web/20151212000000/https://openai.com/blog/introducing-openai/', site: t('OpenAI / Web Archive', 'OpenAI / 互联网档案馆'), description: t('Archived official founding announcement.', '官方创立公告的网页存档。') },
      { type: t('Contemporary coverage', '同期报道'), label: t('Wired coverage of OpenAI founding', 'Wired 关于 OpenAI 成立的报道'), url: 'https://www.wired.com/2015/12/how-elon-musk-and-y-combinator-plan-to-stop-computers-from-taking-over/', site: t('Wired', 'Wired'), description: t('Contemporary article on OpenAI\'s founding rationale.', '关于 OpenAI 创立动机的同期文章。') },
      { type: t('Contemporary coverage', '同期报道'), label: t('BBC coverage of OpenAI launch', 'BBC 关于 OpenAI 启动的报道'), url: 'https://www.bbc.com/news/technology-35082344', site: t('BBC', 'BBC'), description: t('Contemporary news coverage of the launch.', '关于启动事件的同期新闻报道。') }
    ]
  }),

  '2023-ai-risk-statement': makeCycleEvent({
    year: 2023,
    sentiment: 'dread',
    title: t('The Statement on AI Risk', 'AI 风险声明'),
    theme: t('Extinction-risk framing and global-priority language', '灭绝风险框架与全球优先级语言'),
    location: {
      name: t('Center for AI Safety', 'AI 安全中心'),
      country: t('CA, United States', '美国加利福尼亚州'),
      coordinates: [37.7749, -122.4194]
    },
    description: t(
      '<p>The Center for AI Safety published the Statement on AI Risk on May 30, 2023. Its short global-priority framing made AI extinction risk a compact public message signed by prominent AI researchers and public figures.</p>',
      '<p>AI 安全中心于 2023 年 5 月 30 日发布《AI 风险声明》。这份简短的全球优先级表述，把 AI 灭绝风险压缩为一条由重要 AI 研究者和公众人物签署的公共信息。</p>'
    ),
    figures: [
      { name: t('Center for AI Safety', 'AI 安全中心'), role: t('Publisher of the statement', '声明发布方') },
      { name: t('AI safety signatories', 'AI 安全声明签署者'), role: t('Researchers and public figures', '研究者与公众人物') }
    ],
    quoteText: t('The statement made advanced-AI risk a global-priority phrase.', '这份声明让高级 AI 风险成为一种全球优先级表述。'),
    quotePage: t('Statement on AI Risk branch node', 'AI 风险声明分支节点'),
    analysis: {
      what: t('This node records a compressed public statement about extreme AI risk.', '这个节点记录了关于极端 AI 风险的浓缩公共声明。'),
      how: t('The statement used a short consensus-style sentence rather than a long technical argument, making it easy to circulate.', '声明采用短句式共识表达，而不是长篇技术论证，因此易于传播。'),
      why: t('It marks the point where existential-risk language became highly visible in mainstream AI discourse after large-model acceleration.', '它标记了大模型加速后，生存风险语言在主流 AI 讨论中高度可见的时刻。')
    },
    commentarySections: [
      section('Historical Background', '历史背景', 'Large language models had made AI capability progress unusually visible by 2023. That visibility gave safety statements a wider audience and sharper public stakes.', '到 2023 年，大语言模型让 AI 能力进展异常可见。这种可见性让安全声明拥有更广泛受众和更强公共利害关系。'),
      section('Core Idea', '核心思想', 'The statement is not a technical benchmark; it is a framing event. Its power comes from compressing a complex safety debate into a single global-priority claim.', '这份声明不是技术基准，而是框架事件。它的力量来自把复杂安全争论压缩为一句全球优先级主张。'),
      section('Long-Term Legacy', '长期影响', 'Experts generally treat the 2023 risk statement as evidence that AI safety had moved into mainstream institutional discourse. Its legacy is the normalization of comparing advanced-AI risk with other global catastrophic risks.', '专家通常把 2023 年风险声明视为 AI 安全进入主流制度讨论的证据。它的长期影响在于让高级 AI 风险与其他全球灾难性风险并置比较变得常态化。')
    ],
    keyConcepts: [
      concept('Global priority', '全球优先级', 'AI risk is framed alongside other catastrophic risks.', 'AI 风险被放在其他灾难性风险旁边。'),
      concept('Consensus signal', '共识信号', 'A short statement concentrates many signatories into one public message.', '短声明把许多签署者集中成一条公共信息。')
    ],
    relatedRegions: [t('United States', '美国'), t('Global', '全球')],
    demo: t('Place AI risk beside pandemic and nuclear-risk language to show the statement\'s public framing.', '把 AI 风险放在大流行病和核风险语言旁边，展示声明的公共框架。'),
    demoNotes: [
      { label: t('signatory caution', '签署者注意'), text: t('Verify the current signatory list before showing names or portraits.', '展示姓名或肖像前需核验当前签署者列表。') },
      { label: t('interaction point', '互动点'), text: t('Compare short public-risk statements with longer technical risk papers.', '比较简短公共风险声明与更长的技术风险论文。') }
    ],
    sources: [
      { type: t('Official statement', '官方声明'), label: t('Center for AI Safety: Statement on AI Risk', 'AI 安全中心：AI 风险声明'), url: 'https://www.safe.ai/work/statement-on-ai-risk', site: t('Center for AI Safety', 'AI 安全中心'), description: t('Official page for the 2023 statement.', '2023 年声明的官方页面。') },
      { type: t('Secondary overview', '二级概览'), label: t('Statement on AI Risk overview', 'AI 风险声明概览'), url: 'https://en.wikipedia.org/wiki/Statement_on_AI_Risk', site: t('Wikipedia', '维基百科'), description: t('Background on the statement and reception.', '关于声明及其接受情况的背景。') },
      { type: t('Risk paper', '风险论文'), label: t('Managing extreme AI risks amid rapid progress', '快速进展中管理极端 AI 风险'), url: 'https://arxiv.org/abs/2310.17688', site: t('arXiv', 'arXiv'), description: t('Related consensus paper on extreme AI risks.', '关于极端 AI 风险的相关共识论文。') }
    ]
  })
};

module.exports = {
  'humanistic-ai-intro': {
    year: '1920-2023',
    title: t('Humanistic & Emotional Cycles of AI', 'AI 的人文与情绪周期'),
    location: {
      name: t('Global cultural and research discourse', '全球文化与研究讨论'),
      country: t('Global', '全球'),
      coordinates: [0, 0]
    },
    description: t(
      '<p>This introduction frames AI history as more than a sequence of technical breakthroughs. It follows how fiction, ethics, optimism, disappointment, existential anxiety, and safety action repeatedly reshaped what societies expected from intelligent machines.</p>',
      '<p>这个导言把 AI 历史从单纯的技术突破序列，扩展为一条人文与情绪共同参与的叙事线。它追踪科幻、伦理、乐观、失望、生存焦虑与安全行动如何反复改变社会对智能机器的期待。</p>'
    ),
    figures: [
      {
        name: t('Karel Capek', '卡雷尔·恰佩克'),
        role: t('R.U.R. and the modern word robot', '《罗素姆的万能机器人》与现代 robot 一词')
      },
      {
        name: t('Isaac Asimov', '艾萨克·阿西莫夫'),
        role: t('Robot ethics and the Three Laws', '机器人伦理与三定律')
      },
      {
        name: t('Norbert Wiener', '诺伯特·维纳'),
        role: t('Cybernetics and warnings about automation', '控制论与自动化预警')
      }
    ],
    quoteText: t(
      'AI history is also a history of what humans feared, hoped for, overpromised, and tried to govern.',
      'AI 的历史，也是一部人类如何恐惧、期待、过度许诺并试图治理智能机器的历史。'
    ),
    quoteLabel: t('Branch thesis', '分支导言'),
    quotePage: t('Humanistic and emotional cycles branch introduction', 'AI 人文与情绪周期分支导言'),
    analysis: {
      what: t(
        'A thematic branch that places cultural works, public warnings, hype cycles, AI winters, and safety institutions alongside technical milestones.',
        '一个把文化作品、公共预警、狂热周期、AI 寒冬与安全机构并置到技术里程碑旁边的专题分支。'
      ),
      how: t(
        'The branch uses an emotional cycle map rather than a single invention: prophecy, ethical rule-making, overconfidence, disillusionment, dread, and defensive action.',
        '这个分支不是解释单一发明，而是用情绪周期图串联预言、伦理规则、过度自信、幻灭、忧惧与防御性行动。'
      ),
      why: t(
        'It helps viewers see that AI progress was shaped by funding moods, fiction, institutional trust, and public risk imagination as much as by algorithms.',
        '它帮助观众看到：AI 的进展不仅由算法塑造，也受到资金情绪、科幻想象、机构信任与公众风险想象的影响。'
      )
    },
    commentarySections: [
      section(
        'Historical Background',
        '历史背景',
        'Long before modern machine learning, writers and scientists were already asking whether artificial servants would liberate people, replace labor, or escape control. Works such as R.U.R., I, Robot, and cybernetic writing gave later AI debates a vocabulary of creation, obedience, feedback, and unintended consequences.',
        '早在现代机器学习出现之前，作家和科学家已经在追问：人工仆役究竟会解放人，替代劳动，还是脱离控制。《罗素姆的万能机器人》《我，机器人》和控制论著作，为后来的 AI 讨论提供了创造、服从、反馈与意外后果的词汇。'
      ),
      section(
        'Core Idea',
        '核心思想',
        'The branch treats emotions as historical signals rather than side commentary. When expectations rise too high, winters and funding contractions become easier to understand; when fear rises, safety labs, public statements, and governance debates become part of the same timeline.',
        '这个分支把情绪视为历史信号，而不是旁支评论。当期待被抬得过高，寒冬和资金收缩就更容易理解；当恐惧上升，安全实验室、公共声明和治理讨论也会进入同一条时间线。'
      ),
      section(
        'Long-Term Legacy',
        '长期影响',
        'Experts generally treat the cultural and safety discourse around AI as a force that shapes research priorities, public legitimacy, and institutional design. This branch makes that force visible, so technical achievements can be read together with the hopes and warnings that surrounded them.',
        '专家通常把围绕 AI 的文化与安全讨论视为塑造研究优先级、公众合法性和机构设计的重要力量。这个分支把这种力量可视化，让技术成就能和包围它们的期待与警告一起被理解。'
      )
    ],
    achievement: {
      area: t('AI culture, society, and safety', 'AI 文化、社会与安全'),
      method: t('Chronological emotional-cycle mapping', '按时间展开的情绪周期映射'),
      artifact: t('Introductory branch map', '分支导言图'),
      material: t(
        'Primary cultural works, historical reports, safety statements, and institutional announcements',
        '文化原作、历史报告、安全声明与机构公告'
      ),
      demo: t(
        'Follow the curve from prophecy to governance and connect each mood to a later technical or institutional response.',
        '沿着曲线从预言走向治理，把每种情绪与后来的技术或制度回应连接起来。'
      ),
      visual: 'configuredPaper',
      keyConcepts: [
        concept('Dystopian prophecy', '反乌托邦预言', 'Machines as labor replacement and creator backlash.', '机器作为劳动替代与造物反噬。'),
        concept('Ethical rule-making', '伦理规则化', 'Attempts to encode obedience and safety into intelligent agents.', '试图把服从与安全编码进智能体。'),
        concept('AI winter', 'AI 寒冬', 'When promises exceed capability, support and trust can contract.', '当承诺超过能力，支持与信任会收缩。'),
        concept('Safety action', '安全行动', 'Warnings turn into institutions, statements, and governance work.', '警告转化为机构、声明与治理工作。')
      ],
      relatedAchievements: [
        t('Turing Test', '图灵测试'),
        t('Dartmouth Workshop', '达特茅斯会议'),
        t('AI winter', 'AI 寒冬'),
        t('Large language models', '大语言模型')
      ],
      relatedRegions: [t('Global', '全球')],
      demoSteps: [
        t('Read the cultural trigger', '阅读文化触发点'),
        t('Locate the emotional label', '定位情绪标签'),
        t('Connect it to technical history', '连接到技术史'),
        t('Compare the governance response', '比较治理回应')
      ],
      demoImage: cycleMap,
      demoPanel: 'sources',
      demoNotes: [
        {
          label: t('narrative cue', '叙事线索'),
          text: t(
            'The curve groups milestones by recurring public moods rather than by algorithm family.',
            '这条曲线按反复出现的公共情绪组织里程碑，而不是按算法家族组织。'
          )
        },
        {
          label: t('interaction point', '互动点'),
          text: t(
            'Use the branch timeline to compare how a fictional image, a scientific warning, and a safety institution answer the same question: what should humans allow AI to become?',
            '使用分支时间线比较科幻想象、科学预警与安全机构如何回答同一个问题：人类应允许 AI 成为什么？'
          )
        }
      ],
      visualModules: [
        archiveLink(
          'MIT Press Reader',
          '麻省理工学院出版社 Reader',
          'The Czech Play That Gave Us the Word Robot',
          '赋予我们 robot 一词的捷克戏剧',
          'Context on R.U.R. and the origin of the robot vocabulary.',
          '关于《罗素姆的万能机器人》与 robot 一词来源的背景资料。',
          'https://thereader.mitpress.mit.edu/origin-word-robot-rur/'
        )
      ],
      sources: [
        source('Cultural source', '文化资料', 'MIT Press Reader on R.U.R.', '麻省理工学院出版社 Reader：《R.U.R.》', 'https://thereader.mitpress.mit.edu/origin-word-robot-rur/'),
        source('Literary source', '文学资料', 'MCLC Resource Center: Little Smarty Travels to the Future', 'MCLC 资源中心：《小灵通漫游未来》', 'https://u.osu.edu/mclc/online-series/little-smarty-intro/'),
        source('Institutional announcement', '机构公告', 'Introducing OpenAI', 'OpenAI 创立公告', 'https://openai.com/index/introducing-openai/'),
        source('Safety statement', '安全声明', 'Statement on AI Risk', 'AI 风险声明', 'https://aistatement.com/')
      ]
    },
    images: [cycleMap],
    imageMeta: {
      [cycleMap]: {
        caption: t('Humanistic cycle map', 'AI 人文情绪周期图'),
        subcaption: t('Original local explainer for the branch introduction.', '用于分支导言的本地原创解释图。'),
        sourceName: t('Curated branch synthesis', '策展分支综合图'),
        source: 'Local original SVG',
        sourceUrl: 'Local original SVG',
        originalImageUrl: 'Local original SVG',
        license: t('Original local SVG; source figures are not copied.', '本地原创 SVG；不复制来源图形。'),
        usage: t('Introductory visual for the humanistic AI branch', 'AI 人文分支的导言视觉图')
      }
    },
    videos: []
  },
  ...cycleEvents
};
