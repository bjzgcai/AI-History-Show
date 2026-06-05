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
  "photos/example.jpg"
],
imageMeta: {
  "photos/example.jpg": {
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
  }
}
```

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
