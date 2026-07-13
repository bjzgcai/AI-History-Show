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
      'Source card for the AI culture, humanity, and ethics branch introduction',
      'AI 文化、人文与伦理分支导言的资料卡片'
    )
  };
}

const cycleMap = 'resources/images/humanistic-ai/explainers/emotional-cycles-map.svg';

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
  }
};
