你是一名 AI 历史学者、科技记者和博物馆策展人。

请针对以下 AI Achievement 进行深入研究，并生成一个适用于 AI History Museum / AI Top 100 Achievements 网站的完整展厅页面数据。

Achievement:
{{Achievement Name}}

==================================================
【基本原则】
==================================================

1. 仅使用可信来源：
   - 原始论文（Primary Source）
   - 官方项目网站
   - 大学官网
   - 研究机构官网
   - ACM
   - AAAI
   - IEEE
   - Turing Award
   - Nobel Prize
   - Nature
   - Science
   - Google Scholar
   - 权威历史回顾论文

2. 所有事实必须提供来源。

3. 如果信息存在争议：
   - 说明争议内容
   - 列出不同观点
   - 给出来源

4. 禁止编造信息。

==================================================
【输出格式】
==================================================

# Achievement Name

完整名称

# Year / Period

例如：

1950
1986
2017
1980-1989
2012-2015

# Type

从以下选择最匹配项：

- Foundations
- Machine Learning
- Deep Learning
- Reinforcement Learning
- Natural Language Processing
- Computer Vision
- Robotics
- Knowledge Representation
- Reasoning
- Search
- Scientific Discovery
- Generative AI
- AI Systems
- Human-AI Interaction
- Other

# One-Sentence Summary

用一句话概括该成就。

# Hero Title

为网站主视觉提供一个简洁标题：

- `index.md`: `title` 用英文，1-5 words
- `index.zh.md`: `title` 用中文，1-8 个字或常用中文名称
- 不要写成长句或完整论文标题

# Hero Description

为网站主视觉提供 2-3 句简短说明，不能只写一句：

- `index.md`: `description` 用英文，2-3 sentences
- `index.zh.md`: `description` 用中文，2-3 句
- 说明该成就是什么、为什么重要
- 每种语言都要比一句话摘要更具体，但仍保持简洁
- 不要写成完整展厅长文

# People & Place

列出：

## Key People

对于每个人：

- Name
- Role
- Institution
- Country

## Key Organizations

对于每个机构：

- Name
- Type
- Country

例如：

OpenAI
DeepMind
Google
MIT
Stanford University

## Key Places

例如：

Hanover, New Hampshire
Toronto, Canada
London, UK

==================================================
【核心内容】
==================================================

# Historical Background

解释：

- 当时 AI 发展到了什么阶段
- 存在什么问题
- 为什么需要这项工作

# Canonical Source

列出最具代表性的原始来源：

- Title
- Authors
- Venue
- Year
- DOI
- URL

如果存在多个经典来源：

按重要性排序。

# Core Idea

用高中生能够理解的语言解释：

- 这项工作到底提出了什么
- 它与此前方法有何不同
- 它为什么有效

# Key Concepts

列出 2-3 个关键概念：

例如：

- Backpropagation
- Gradient Descent
- Transformer
- Attention
- Monte Carlo Tree Search

对于每个概念提供：

- 名称
- 简短解释：1-2 句，适合放进页面上的小卡片；不要写成长段落

==================================================
【影响力】
==================================================

# Impact

从三个维度分析：

## Academic Impact

- Google Scholar 引用数
- 影响了哪些后续研究
- 哪些领域受到影响

## Industrial Impact

- 被哪些公司采用
- 被哪些产品采用
- 商业价值

## Expert Evaluation

- 今天是否仍在使用
- 是否成为标准方法
- 是否改变了 AI 发展方向

==================================================
【专家评价】
==================================================

# Expert Evaluations

收集 2-3 条评价。

优先来源：

- Turing Award 获得者
- Nobel Prize 获得者
- AI 教科书
- 历史回顾论文
- 官方机构
- 知名研究者

每条评价包括：

- Quote
- Person
- Organization
- Year
- Source URL

并总结：

“今天的专家通常如何评价这一成就？”

# Verified Quote or Key Idea

先尝试查找该 achievement 的真实原文引用；找不到可核验原文时，改写为核心要点。

必须输出以下字段，供 `manage/events.js` 使用：

```js
quoteText: {
  en: "",
  zh: ""
},
quoteKind: "quote" | "keyIdea",
quoteMeta: {
  workTitle: { en: "", zh: "" },
  workAuthors: { en: "", zh: "" },
  sourceUrl: ""
},
quotePage: {
  en: "",
  zh: ""
}
```

规则：

- 只有能在可靠原始来源、官方论文页、出版商页面、权威档案页或可核验原文中找到对应文字时，`quoteKind` 才能写 `"quote"`。
- 论文标题、书名、章节标题、短语标题、SEO 摘要、Google Books 元数据、奖项说明、论文内容转述，都不能标为 quote。
- 如果没有找到合适原文引用，`quoteText` 写成一句清楚的核心要点，`quoteKind` 写 `"keyIdea"`。
- 中文 `quoteText.zh` 必须是自然中文翻译或中文核心要点，不要直接复制英文，除非是通用专名、缩写或模型名。
- `quoteMeta.sourceUrl` 必须指向核验来源；如果是 `keyIdea`，也应指向用于理解该要点的主论文或官方来源。
- 生成网站数据前运行 `npm run audit:ai100-quotes`；只有 audit 推荐 quote 或人工确认原文可核验后，才能把该条加入 `VERIFIED_AI100_QUOTE_KEYS` 或显式设置 `quoteKind: "quote"`。

==================================================
【多媒体】
==================================================

# Photos

提供 1-3 张真实存在的图片。

图片必须按网站可直接使用的 schema 输出：抓取图片时优先保存为本地文件，并同时记录本地路径、来源页面和版权/授权信息。不要只提供网页 URL。

必须优先收集人物肖像：如果该成就有明确关键人物，至少提供 1 张关键人物 portrait，并把 portrait 放在 `images` 数组第一位，方便网站像 Turing Test 页面一样在左侧优先展示人物照片。优先选择 Wikimedia Commons、大学官网、研究机构官网、ACM/Turing Award/Nobel/IEEE 等来源，并记录是否有开放授权；如果没有开放授权，也要明确写出 `copyright_or_license`。

优先顺序：

1. 关键人物肖像 portrait（必选，除非确实找不到可靠图片）
2. 原始论文截图
3. 实验室照片
4. 历史照片
5. 博物馆展品
6. 演示系统
7. 当代应用场景

每张图片提供：

- local_image_path: 例如 `photos/example.jpg`。图片应保存到当前 achievement 目录下的 `photos/`，不要放到共享图片目录。
- title: 当前文件语言的图片标题
- caption: 当前文件语言的短 caption
- description: 当前文件语言的 1-2 句说明
- source_name
- source_page_url
- original_image_url: 如果能确认直接图片地址则填写；否则写 `Not available`
- copyright_or_license
- usage: 当前文件语言的图片用途，例如 `Portrait`, `Paper screenshot`, `Source material`, `Explainer graphic`

注意：research markdown 文件保持单语；不要在 `index.md` 里同时写 `.zh` 字段，也不要在 `index.zh.md` 里同时写 `.en` 字段。网站数据层可以再转换成 `caption.en/caption.zh` 这样的双语对象。

同时输出网站数据结构：

```js
images: [
  "photos/person.jpg",
  "photos/achievement-visual.svg"
],
imageMeta: {
  "photos/person.jpg": {
    caption: {
      en: "",
      zh: ""
    },
    subcaption: {
      en: "",
      zh: ""
    },
    source: "",
    sourceUrl: "",
    originalImageUrl: "",
    license: "",
    usage: {
      en: "",
      zh: ""
    }
  },
  "photos/achievement-visual.svg": {
    caption: {
      en: "",
      zh: ""
    },
    subcaption: {
      en: "",
      zh: ""
    },
    source: "",
    sourceUrl: "",
    originalImageUrl: "",
    license: "",
    usage: {
      en: "Achievement visualization",
      zh: "成就可视化"
    }
  }
}
```

## AI100 网站页面完整 schema（必须遵守）

AI100 achievement 页面在网站中使用固定展陈布局。生成或整理数据时必须让字段支持以下视觉结构、资料来源、quiz 和双语要求。不要只交付正文内容。

### 引文 / 核心要点

AI100 页面右侧 commentary 的第一块可能显示为 `Quote / 引言摘录`，也可能显示为 `Key idea / 核心要点`。生成数据时必须遵守：

- `quoteText` 不是默认“引文”；它可以是已核验原文引用，也可以是核心要点。
- `quoteKind: "quote"` 仅用于真实、可验证原文引用。
- `quoteKind: "keyIdea"` 用于论文标题、短语标题、摘要性短语、转述或无法核验原文的内容。
- 真正的 quote 会由生成器加引号；key idea 不加引号。
- 页面 label 由生成器输出为 `quoteLabel: { en: "Quote" | "Key idea", zh: "引言摘录" | "核心要点" }`。
- 新增或修改后必须运行 `npm run audit:ai100-quotes`，并检查生成后的 `milestones-data.js` 中 `quoteKind/quoteLabel` 是否正确。

### 顶部三联视觉区

`images` 与 `achievement.visualModules` 必须组织成三张并列卡片：

1. 左侧：相关科学家、人物、团队或机构照片。
   - `images[0]` 必须优先是关键人物 portrait。
   - 如果确实找不到人物照片，可使用团队、机构或可靠历史照片，但必须在 `imageMeta[images[0]].usage` 中说明原因。
2. 中间：成就本身的可视化、架构图、算法流程、实验结果、系统截图或本地原创 explainer。
   - `images[1]` 必须是解释该 achievement 的 visual，不要放第二张人物照。
   - 优先使用本地原创 SVG/PNG explainer；不要复制论文受版权保护的图。
3. 右侧：论文、文章、项目页、档案页或官方来源卡片。
   - 使用 `achievement.visualModules[0]`，类型为 `archiveLink`。
   - 必须包含 `site/title/description/url/source/action`。
   - 这个卡片用于显示“article related to it”，不是普通图片。
   - 优先选择主论文、官方项目页、可靠档案页或权威背景文章。

### 底部互动解释区

每个 AI100 achievement 必须提供 `achievement.visual`，并确保前端能渲染成：

- 左侧：大尺寸 visual/demo 区，展示算法流程、架构、系统路径、数据流或成果可视化。
- 右侧：两个说明盒。
  - 第一个盒子说明文献线索、架构线索、历史线索、实验线索或专家线索。
  - 第二个盒子必须是 “Interaction point / 互动点”，说明观众可以如何交互理解该成就。

不要让新 achievement 落到 generic 纯文本 demo panel。若没有现成 `achievement.visual` renderer，必须新增 renderer 或使用现有 `buildImagePaperDemo` / `buildPaperDemo` 风格的 visual key。底部 demo 不能只有一句文字。

### 右侧文字栏

`commentarySections` 至少包含：

- `Historical Background / 历史背景`
- `Core Idea / 核心思想`
- `Long-Term Legacy / 长期影响`

`Long-Term Legacy / 长期影响` 必须包含专家评价，不只是泛泛影响描述。推荐句式：

- English: `Experts generally treat ...`
- 中文：`专家通常把/认为 ...`

### 资料来源 / Sources

每个新增 achievement 必须提供足够的 `achievement.sources`，并匹配旧 achievement 的“资料来源”密度：

- 至少 3 条，推荐 4 条。
- 必须包含主论文、原始资料或官方发布页。
- 根据实际情况补充：
  - `Background / 背景`
  - `Project / 项目`
  - `People / 人物`
  - `Institution / 机构`
  - `Code / 代码`
  - `Image source / 图片来源`
  - `Publication / 出版页`
  - `Retrospective / 回顾`
  - `Archive / 档案`
- 每条 source 必须包含：
  - `type: { en, zh }`
  - `label: { en, zh }`
  - `url`
- 不要只给 1 条论文链接。
- 不要用没有来源的泛泛介绍。

示例：

```js
achievement: {
  sources: [
    { type: { en: 'Paper', zh: '论文' }, label: { en: 'Original paper title', zh: '原始论文标题' }, url: 'https://...' },
    { type: { en: 'Background', zh: '背景' }, label: { en: 'Historical overview', zh: '历史背景概览' }, url: 'https://...' },
    { type: { en: 'People', zh: '人物' }, label: { en: 'Researcher profile', zh: '研究者资料' }, url: 'https://...' },
    { type: { en: 'Code', zh: '代码' }, label: { en: 'Original code repository', zh: '原始代码仓库' }, url: 'https://...' }
  ]
}
```

### Quiz / 浏览检查点

每个新增 achievement 必须同步规划 quiz，并最终写入 `manage/quizzes.js`：

- 使用旧 achievement 的 checkpoint layout：
  - 左侧：相关材料，包括人物/团队/机构图片、论文、博客或项目来源。
  - 右侧：快速挑战，4 个选项。
  - 下方保留小程序入口/QR 相关区域。
- Quiz 必须简单、清楚、适合普通观众。
- 不要考非常细的年份、论文页码或 obscure 人名。
- 题目应测试核心理解，例如“它解决了什么问题？”、“它引入了什么关键想法？”、“它为什么重要？”
- 源数据中选项可以固定顺序；前端会随机显示答案顺序。
- 每个 quiz 必须有：
  - `question: { en, zh }`
  - 4 个 `options`，每个 `{ en, zh }`
  - `answerIndex`
  - `material` / related material with image or source information
- 不要让新增或近期 achievement 的 quiz 缺图片、缺论文、缺博客/项目来源等材料。

### 双语要求

所有页面可见字段必须有真实双语内容：

- `index.md` 使用英文。
- `index.zh.md` 使用中文。
- 转换到网站数据时，`title/description/location/figures/commentarySections/achievement/imageMeta/visualModules/sources` 等所有可见文字都应是 `{ en, zh }`。
- Quiz 的 `question/options/material` 也必须有 `{ en, zh }`。
- 中文页必须显示中文，英文页必须显示英文。
- 不要把英文复制进 `zh` 字段，除非是通用专名、缩写或模型名（例如 ReLU、LeNet、AlexNet、arXiv）。

### 实施检查清单

新增 achievement 合并前必须检查：

- `images[0]` 是人物/团队/机构照片。
- `images[1]` 是成就 visual，不是人物照。
- `achievement.visualModules[0]` 是 `archiveLink` article/source 卡片。
- `achievement.visual` 有非 generic renderer。
- 底部 demo 右侧第二个盒子是 `Interaction point / 互动点`。
- `commentarySections` 有历史背景、核心思想、长期影响。
- 长期影响提到专家如何评价。
- `achievement.sources` 至少 3 条，推荐 4 条。
- Quiz 已添加，4 选项，简单易懂，材料完整。
- 所有可见文字都有真实英文和中文。
- 已运行 `node manage/generate.js`，并检查生成后的页面数据。

# Video Clips

提供 0-2 个视频。

优先来源：

- 官方机构
- 大学
- ACM
- IEEE
- AAAI
- Computer History Museum
- 官方 YouTube 频道
- 会议演讲

每个视频提供：

- Title
- URL
- Platform
- Duration
- Description

==================================================
【导航与知识图谱】
==================================================

# Related People

列出相关人物。

# Related Achievements

列出相关 AI 成就。

# Related Organizations

列出相关机构。

# Related Countries

列出相关国家。

# Timeline Connections

说明：

- 前驱工作（Predecessors）
- 后续工作（Successors）

==================================================
【Museum Metadata】
==================================================

输出以下字段用于网站筛选器：

{
  "year": "",
  "decade": "",
  "type": "",
  "countries": [],
  "people": [],
  "organizations": [],
  "keywords": [],
  "related_achievements": []
}

==================================================
【参考资料】
==================================================

# Primary Sources

列出原始来源。

# Secondary Sources

列出历史分析与综述。

统一使用 APA 格式。
