# AI 历史档案架构重构方案

本文档描述 AI-History-Show 从「展示数据驱动」升级为「文件化档案库 + 多分支展示生成」的架构方案。

## 背景

项目正在从单一 AI 历史展示页，演进为一个同时承担以下职责的系统：

- AI 历史档案库：管理事件事实、来源、人物、资源、论文、图片、视频、引用、审核状态。
- 多分支叙事系统：支持深度学习、BenchCouncil AI100、AI 棋牌 / 博弈，以及未来更多 AI 演进分支。
- 展示生成系统：继续生成当前前端可直接消费的 `milestones-data.js` / `milestones-data-default.js`。

当前项目已经有展示一体化改造，但内容源仍然分散在多个文件中：

- `manage/events.js`
- `manage/ai100-extra-events.js`
- `manage/gaming-extra-events.js`
- `manage/catalog.js`
- `manage/quizzes.js`
- `manage/figure-avatars.js`
- `manage/event-fusions.js`
- `resources/videos/*.json`

这些文件混合了承载不同层级的信息：事件事实、展示文案、来源、图片、视频、quiz、visual module、人物头像、分支顺序、事件融合规则等。随着事件数量和分支数量增加，这种结构会导致：

- 同一事件在多个分支重复维护。
- 资源只以路径形式散落在展示数据中，缺少来源、版权、用途和复用关系。
- 核心历史事实缺少可追踪的 claim/source 绑定。
- AI100 等复杂事件的来源、资源、quiz 和 visual module 难以系统校验。
- 管理后台更像 JS 大对象编辑器，而不是档案管理工具。

因此需要建立一个轻量、文件化、可逐步迁移的档案架构。

## 总体目标

采用「方案一：仓库内轻量档案架构」。新增 `archive/` 作为结构化源数据目录，在不破坏当前静态展示和部署路径的前提下，提升内容管理能力。

目标：

1. 将「档案事实」和「展示叙事」分离。
2. 将 `event`、`claim`、`source`、`asset`、`storyline`、`variant` 作为核心实体。
3. 让重要历史事实可以追溯到来源，让重要资源可以追溯到来源和用途。
4. 保持当前静态前端、Node 生成、Git 管理、GitHub Pages / Nginx / Docker 部署方式。
5. 为未来迁移到 SQLite、PostgreSQL 或 Headless CMS 预留清晰的数据模型。

## 当前实现状态（2026-07-10 阶段验收）

本轮重构已经完成主体架构和当前展示目标的结构性迁移，并补充了 archive 直接接管主展陈的本地预览检查：

```text
Archive event directories: 116
Catalog/storyline migration targets: 134
Archive build preview: 134 milestone preview(s)
Archive overlay: 134 applied, 0 skipped, 0 errors
Unexpected presentation changes: 0
Duplicate preview target ids: 0
Generated ids missing archive preview: 0
Forced archive preview image/source/commentary/quiz decreases: 0
Forced archive preview title/subtitle/description/image/visual/analysis differences: 0
```

阶段验收报告见：

```text
reports/archive-preview-display-consistency.md
```

当前还提供一个独立于正式生成路径的主展陈 archive preview：

```bash
npm run preview:archive-data
npm run diff:archive-preview
```

该路径生成 `milestones-data-archive-preview.js`，并可用 `?archivePreview=1` 或 `archive-preview-compare.html` 进行左右视觉对比。它用于观察“如果 archive presentation 直接驱动主展陈会怎样”，不影响正式 `milestones-data.js`。此前预览不一致的主要原因是：AI100 legacy 使用大量外链图片但 archive assets 尚未记录、少数 curated variants 未选齐 asset/source、以及部分 variants 曾尝试改写标题/描述/visual。目前这些显示层差异已回归 legacy 信息；剩余 preview 差异仅为 sources/commentary/quizzes 的 archive 结构替换。

当前采用迁移期兼容策略：

```text
archive metadata + legacy presentation
```

也就是 archive overlay 默认只附加档案元数据、claim/source/asset 关系和 provenance，不覆盖既有用户可见展示。这样可以先完成结构归档和可审查性，同时避免 title、description、images、sources、quiz、visual 等展示内容在迁移过程中发生非预期变化。

最终的 Step 12「legacy source closure」尚未完成。`manage/events.js`、`manage/event-fusions.js` 等 legacy source 仍是兼容生成路径的重要输入；后续需要单独规划 archive 成为权威数据源的收口步骤。


## 非目标

本轮重构不直接引入：

- SQLite / PostgreSQL 数据库。
- Directus / Strapi / Sanity 等外部 CMS。
- 多用户权限系统。
- 复杂审核后台。
- 前端展示大重写。

前端仍然优先消费生成后的 `milestones-data.js`，而不是直接读取 `archive/`。

## 核心架构原则

### 1. 档案事实和展示叙事分离

档案事实回答：

- 发生了什么？
- 谁参与？
- 什么时候？
- 在哪里？
- 哪些论文、官方页面、档案或资料可以证明？

展示叙事回答：

- 在这个 storyline 中为什么展示它？
- 用哪张图、哪个 visual module、哪个 quiz？
- 展示标题和摘要是否需要针对分支调整？
- 哪些资源放在顶部三联视觉区？哪些放在 source card？

不要再把两类信息全部塞进一个大 event 对象中。

### 2. Event 是 canonical，Storyline 是引用

同一历史事件不应为每个分支复制一份。推荐模型：

```text
canonical event + storyline variant
```

例如 `2016-alphago`：

```text
archive/events/2016-alphago/
├── event.json
├── claims.json
├── sources.json
├── assets.json
├── quizzes.json
└── variants/
    ├── ai100.json
    ├── gaming-ai.json
    └── unified-history.json
```

基础事实只维护一次，不同分支只覆盖展示角度。

同一 canonical event 可以拥有多个 storyline variant。Variant 允许调整展示标题、摘要、素材组合、visual module、quiz、commentary、analysis 和 layout，以适配不同分支的叙事重点；但不能复制或篡改 canonical event 的基础事实、核心 claim 和 primary source。

换句话说，本项目应支持：

```text
事实统一，叙事多样
```

例如 `2016-alphago` 在不同分支中可以有不同侧重点：

- 在 AI100 分支中，重点是论文来源、policy/value network、MCTS、专家评价和 achievement dossier。
- 在 AI 棋牌 / 博弈分支中，重点是从 Deep Blue 到 AlphaGo / AlphaZero / MuZero 的博弈 AI 技术谱系、棋谱演化和 game evolution module。
- 在深度学习分支中，重点是深度神经网络从感知任务扩展到强化学习、搜索和复杂决策系统。

这些呈现可以不同，但都应共享同一个 canonical event、claim、source 和 asset 基础档案。

### 3. Source 是一等公民

来源不应只是展示页的一个列表，而应该成为可被引用的实体。

推荐关系：

```text
claim → source
asset → source
quiz explanation → source
visual module → source
```

核心历史事实、数字、评价性判断、历史归因都应尽量绑定来源。

### 4. Asset 是一等公民

每个重要资源都应该有档案卡，而不是只在展示数据中出现裸路径。

Asset 至少应描述：

- 文件路径。
- 类型。
- 角色。
- caption。
- sourceId。
- rights / license / usage。
- 使用场景。
- 是否可编辑或可替换。

### 5. 生成物不可手动编辑

以下文件继续视为生成物：

```text
milestones-data.js
milestones-data-default.js
```

所有人工编辑应回到：

```text
archive/
manage/
resources/
```

再通过生成脚本输出展示数据。

## `archive/` 与 `resources/` 的关系

两者分工必须清晰：

```text
archive/   = 档案元数据、事实结构、来源、资源说明、引用关系、审核状态
resources/ = 实际媒体文件和静态资源本体
```

或者更短：

```text
archive = metadata and provenance
resources = files and media
```

### `archive/` 负责

- 事件标题、年份、描述。
- claim 与 source 绑定。
- source 书目信息和 URL。
- 图片 / 视频 / PDF 的 caption、source、license、usage。
- quiz 题目和解释。
- 人物 ID、别名、头像引用。
- storyline 顺序和 variant 展示配置。
- visual module 配置。
- 审核状态。

### `resources/` 负责

- JPG / PNG / WebP 图片。
- SVG explainer。
- GIF / MP4。
- PDF。
- UI logo / brand 图片。
- thumbnail。
- SGF 或 game evolution 素材。

### 引用示例

`archive/events/2012-alexnet/assets.json`：

```json
[
  {
    "id": "asset-alexnet-architecture",
    "type": "image",
    "path": "resources/images/events/2012-alexnet/alexnet-architecture.svg",
    "role": "architecture-explainer",
    "caption": {
      "zh": "AlexNet 架构示意图",
      "en": "AlexNet architecture explainer"
    },
    "sourceId": "source-alexnet-paper",
    "rights": {
      "status": "local-redraw",
      "license": {
        "zh": "根据论文结构本地重绘，仅用于展陈解释。",
        "en": "Locally redrawn from the paper structure for exhibition explanation."
      }
    },
    "usage": ["single-screen", "ai100-card"],
    "editable": true
  }
]
```

实际文件位于：

```text
resources/images/events/2012-alexnet/alexnet-architecture.svg
```

前端仍然加载 `resources/...`，不直接依赖 `archive/` 的源目录结构。

### 关于 `resources/videos/*.json`

当前 `resources/videos/{key}.json` 实际是视频 metadata，而不是视频文件本体。短期可以保留现状，因为 `manage/generate.js` 已经依赖它。

中期建议迁移为：

```text
archive/events/{eventId}/videos.json
```

而 `resources/videos/` 更适合保留本地视频、GIF、game evolution 输出等真正静态资源。

## 建议目录结构

```text
archive/
├── events/
│   ├── 2012-alexnet/
│   │   ├── event.json
│   │   ├── claims.json
│   │   ├── sources.json
│   │   ├── assets.json
│   │   ├── quizzes.json
│   │   └── variants/
│   │       ├── deep-learning.json
│   │       └── ai100.json
│   │
│   └── 2016-alphago/
│       ├── event.json
│       ├── claims.json
│       ├── sources.json
│       ├── assets.json
│       ├── quizzes.json
│       └── variants/
│           ├── ai100.json
│           └── gaming-ai.json
│
├── figures/
│   ├── figures.json
│   └── aliases.json
│
├── storylines/
│   ├── deep-learning.json
│   ├── bench-council-ai100.json
│   └── gaming-ai.json
│
├── taxonomies/
│   ├── topics.json
│   ├── regions.json
│   ├── organizations.json
│   └── achievement-types.json
│
└── schemas/
    ├── event.schema.json
    ├── claim.schema.json
    ├── source.schema.json
    ├── asset.schema.json
    ├── quiz.schema.json
    └── storyline.schema.json
```

`resources/` 可逐步整理为：

```text
resources/
├── images/
│   ├── events/
│   ├── figures/
│   ├── explainers/
│   ├── organizations/
│   └── ui/
├── papers/
├── videos/
└── thumbnails/
```

## 数据模型初稿

### Event

事件的 canonical 档案主体。

```json
{
  "id": "2012-alexnet",
  "year": 2012,
  "date": "2012",
  "title": {
    "zh": "AlexNet 与 ImageNet 突破",
    "en": "AlexNet and the ImageNet Breakthrough"
  },
  "summary": {
    "zh": "...",
    "en": "..."
  },
  "description": {
    "zh": "...",
    "en": "..."
  },
  "location": {
    "country": {
      "zh": "加拿大",
      "en": "Canada"
    },
    "place": {
      "zh": "多伦多大学",
      "en": "University of Toronto"
    },
    "coordinates": [43.6629, -79.3957]
  },
  "topics": ["deep-learning", "computer-vision", "cnn"],
  "figures": ["alex-krizhevsky", "ilya-sutskever", "geoffrey-hinton"],
  "review": {
    "status": "draft"
  }
}
```

### Claim

可验证事实声明。

```json
[
  {
    "id": "claim-001",
    "importance": "core",
    "text": {
      "zh": "AlexNet 在 2012 年 ImageNet 挑战赛中显著降低了错误率。",
      "en": "AlexNet substantially reduced the error rate in the 2012 ImageNet challenge."
    },
    "sourceIds": ["source-alexnet-paper", "source-imagenet-2012-results"],
    "status": "verified"
  }
]
```

建议状态：

```text
draft
needs-source
verified
disputed
deprecated
```

### Source

来源信息。

```json
[
  {
    "id": "source-alexnet-paper",
    "type": "paper",
    "title": "ImageNet Classification with Deep Convolutional Neural Networks",
    "authors": ["Alex Krizhevsky", "Ilya Sutskever", "Geoffrey Hinton"],
    "year": 2012,
    "url": "https://papers.nips.cc/",
    "doi": "",
    "archiveUrl": "",
    "language": "en",
    "reliability": "primary",
    "notes": {
      "zh": "主论文来源。",
      "en": "Primary paper source."
    }
  }
]
```

建议 `type`：

```text
paper
official-page
project-page
book
interview
archive
news
video
image-source
code
other
```

建议 `reliability`：

```text
primary
secondary
tertiary
reference-only
```

### Asset

资源档案卡。

```json
[
  {
    "id": "asset-alexnet-author-photo",
    "type": "image",
    "path": "resources/images/events/2012-alexnet/authors.jpg",
    "role": "portrait",
    "caption": {
      "zh": "AlexNet 作者团队照片",
      "en": "AlexNet author team photo"
    },
    "sourceId": "source-alexnet-author-photo",
    "rights": {
      "status": "external-reference",
      "license": {
        "zh": "仅作为历史资料引用，需保留来源说明。",
        "en": "Used as a historical reference with attribution."
      }
    },
    "usage": ["storyline:deep-learning", "storyline:bench-council-ai100"],
    "editable": true
  }
]
```

建议 `type`：

```text
image
svg
video
pdf
gif
webpage
thumbnail
data
```

建议 `role`：

```text
portrait
team-photo
architecture-explainer
algorithm-explainer
paper-page
source-card
organization-logo
demo-poster
game-evolution
ui
```

建议 rights status：

```text
local-redraw
owned
open-license
external-reference
needs-review
unknown
```

### Storyline

分支叙事配置。

```json
{
  "id": "deep-learning",
  "title": {
    "zh": "深度学习分支",
    "en": "Deep Learning"
  },
  "type": "timeline",
  "events": [
    {
      "eventId": "1957-perceptron",
      "variant": "deep-learning"
    },
    {
      "eventId": "2012-alexnet",
      "variant": "deep-learning"
    }
  ]
}
```

### Variant

同一事件在不同分支中的展示角度。Variant 是多分支叙事的核心：它允许同一 canonical event 在不同 storyline 中采用不同标题、摘要、素材组合、visual module、quiz、commentary、analysis 和 layout，从而突出不同分支关心的问题。

```json
{
  "storylineId": "bench-council-ai100",
  "eventId": "2012-alexnet",
  "displayTitle": {
    "zh": "AlexNet 与 ImageNet 突破",
    "en": "AlexNet and the ImageNet Breakthrough"
  },
  "displaySummary": {
    "zh": "...",
    "en": "..."
  },
  "emphasis": [
    "research-breakthrough",
    "paper-source",
    "computer-vision"
  ],
  "visual": "alexnet-paper-demo",
  "assetIds": [
    "asset-alexnet-author-photo",
    "asset-alexnet-architecture"
  ],
  "sourceIds": [
    "source-alexnet-paper"
  ],
  "commentarySectionIds": [
    "historical-background",
    "core-idea",
    "long-term-legacy"
  ],
  "quizId": "quiz-2012-alexnet-ai100"
}
```

Variant 只覆盖展示角度，不应复制 canonical event 的基础事实。

迁移期新增 `presentationMode`，用于防止 archive 归档过程中无意改变 legacy 展示：

```json
{
  "presentationMode": "preserve-legacy"
}
```

语义：

```text
preserve-legacy  默认值；只附加 archive metadata，不覆盖 legacy 展示字段。
archive          显式允许该 variant 用 archive preview 覆盖展示字段。
```

默认 `preserve-legacy` 下不会覆盖：

```text
title
subtitle
description
resources.images
achievement.sources
achievement.visual
commentarySections
analysis
quizzes
```

但会附加：

```text
archive
archiveEventId
archiveVariantId
archivePresentationMode
resources.archiveAssetIds
achievement.archiveSources
achievement.archiveSourceIds
achievement.archiveClaims
achievement.archiveClaimIds
achievement.archiveEmphasis
```

`npm run diff:archive` 会把 `preserve-legacy` 模式下的展示变化视为 unexpected change 并失败。


建议允许 variant 覆盖：

```text
displayTitle
displaySummary
displayDescription
commentarySections / commentarySectionIds
analysis
visual
visualModules
assetIds
sourceIds
quizId
quoteId
layout
theme
timelineLabel
regionOverride
```

不建议 variant 随意覆盖：

```text
canonical id
year / date
核心事件名
核心人物
核心地点
core claims
primary sources
```

如果某个分支需要不同年份、不同核心人物或不同 primary source，通常说明它可能不是同一个 canonical event，而应建成独立但有关联的 event。

## 生成流程

建议目标流程：

```text
archive/ 原始档案
resources/ 实际资源
        │
        ▼
archive compiler
        │
        ├── 校验 schema
        ├── 校验 source / claim 绑定
        ├── 校验 asset path 是否存在
        ├── 校验双语字段
        ├── 校验 storyline 引用
        ├── 生成展示数据
        ├── 生成档案索引
        └── 生成校验报告
        │
        ▼
milestones-data.js
milestones-data-default.js
archive-index.json
reports/archive-validation.md
reports/assets-usage.md
```

短期可以继续改造 `manage/generate.js`。中期可拆分为：

```text
scripts/build-archive.js
scripts/validate-archive.js
manage/generate.js
```

其中：

- `build-archive.js` 从 `archive/` 编译展示数据和索引。
- `validate-archive.js` 只做校验和报告。
- `manage/generate.js` 可保留为兼容入口，调用新 compiler 或继续输出当前展示文件。

## 当前命令

本轮实现后已新增并使用以下 archive 工作流命令：

```json
{
  "scripts": {
    "validate:archive": "node scripts/validate-archive.js",
    "build:archive": "node scripts/build-archive.js",
    "diff:archive": "node scripts/diff-archive-build.js",
    "review:archive": "node scripts/generate-archive-review.js",
    "migrate:archive": "node scripts/migrate-archive-events.js",
    "migrate:ai100-batch": "node scripts/migrate-ai100-batch.js",
    "map:archive-fusions": "node scripts/map-archive-fusions.js",
    "report:assets": "node scripts/report-assets-usage.js"
  }
}
```

推荐归档/审查流程：

```bash
npm run validate:archive
npm run build:archive
npm run generate
npm run review:archive
npm run diff:archive
```

完整回归：

```bash
npm run format:check
npm test
npm run lint
npm run validate:startup
```

`diff:archive` 当前不仅检查展示差异，还检查：

- archive preview target id 是否重复。
- archive preview id 是否能匹配 generated milestone。
- generated milestone 是否缺少 archive preview。
- snapshot row 是否覆盖 generated milestone。

后续 `validate:deployment` 可以逐步包含：

```bash
npm run build:archive
npm run validate:archive
npm test
npm run validate:startup
```

## 校验要求

`validate:archive` 至少检查：

### 基础结构

- 每个事件目录是否有 `event.json`。
- `event.id` 是否和目录名一致。
- 每个事件是否有标题、年份、摘要或描述。
- 双语字段是否包含 `zh` 和 `en`。

### Source / Claim

- 每个 source 是否有 `id`、`type`、`title`、`url` 或其他可验证定位信息。
- 每个 core claim 是否至少绑定一个 source。
- 每个 claim 的 `sourceIds` 是否能解析到存在的 source。
- 是否存在未被引用但应被清理或确认的 source。

### Asset / Resources

- 每个 asset 是否有 `id`、`type`、`path`、`role`、`caption.zh`、`caption.en`、`sourceId`、`rights`、`usage`。
- 每个 asset 的 `path` 是否存在于 `resources/`。
- 每个 asset 的 `sourceId` 是否存在。
- `resources/` 中是否有未被任何 asset 引用的孤立文件。
- 是否有多个 asset 指向同一资源但 metadata 冲突。

### Storyline / Variant

- 每个 storyline 引用的 `eventId` 是否存在。
- 每个 storyline 引用的 variant 是否存在。
- variant 的 `assetIds` / `sourceIds` 是否存在。
- 同一 storyline 中是否有重复事件。

### AI100 特定要求

AI100 事件还应检查已有项目要求：

- 顶部三联视觉区。
- 非 generic demo。
- commentary sections 至少包含 Historical Background / Core Idea / Long-Term Legacy。
- sources 至少包含主论文或原始资料。
- quiz 存在且包含 4 个选项。
- 页面可见字段完整双语。
- 中文字段不包含未翻译英文 UI 句子，proper noun / acronym 除外。

## 迁移策略

不要一次性迁移所有内容。按阶段推进。

### 第一阶段：建立模型和样例

迁移 3 个代表事件：

- `2012-alexnet`
- `2017-transformer`
- `2016-alphago`

这三个事件覆盖：

- 深度学习主线事件。
- AI100 复杂 achievement。
- 跨 AI100 / gaming-ai 的复用事件。

交付：

- `archive/` 目录结构。
- schema 初版。
- 三个样例事件。
- 初版 `validate:archive`。
- 初版 archive compiler。
- 继续生成当前前端兼容的 `milestones-data.js`。

### 第二阶段：迁移 AI100

优先迁移 BenchCouncil AI100，因为它最复杂、最需要来源与资源治理。

重点整理：

- sources。
- claims。
- imageMeta / assets。
- visualModules。
- archiveLink cards。
- paper demos。
- quizzes。
- 中英文完整性。

建议输出报告：

```text
reports/ai100-source-coverage.md
reports/ai100-asset-coverage.md
reports/ai100-translation-gaps.md
reports/ai100-claim-verification.md
```

### 第三阶段：统一事件复用和分支叙事

把当前 `manage/event-fusions.js` 的临时融合逻辑升级为正式 variant 机制。

目标：

```text
canonical event + storyline variant
```

减少重复定义，提升多分支维护效率。

### 第四阶段：重构管理后台

将 `manage/server.js` 和 `manage/admin.html` 从「编辑 JS 大对象」逐步改造为「编辑档案实体」。

后台应支持：

- 事件基础信息编辑。
- claims 编辑。
- sources 编辑。
- assets 编辑。
- figures 关联。
- visual modules 编辑。
- quiz 编辑。
- storyline / variant 使用情况查看。
- 校验结果查看。

## 细化实施步骤

### Step 0：冻结边界与建立基线

目标：在开始迁移前明确当前系统基线，避免重构过程中无法判断是否破坏现有展示。

任务：

1. 确认 `milestones-data.js` 和 `milestones-data-default.js` 仍为生成物，不作为人工编辑入口。
2. 记录当前主要命令的通过情况：

   ```bash
   npm run generate
   npm test
   npm run lint
   npm run validate:startup
   ```

3. 确认当前三条代表性 storyline 的入口可用：
   - `?storyline=deep-learning` 或默认主线。
   - `?storyline=bench-council-ai100`。
   - `?storyline=gaming-ai`。
4. 记录当前 legacy 数据源清单：
   - `manage/events.js`
   - `manage/ai100-extra-events.js`
   - `manage/gaming-extra-events.js`
   - `manage/catalog.js`
   - `manage/quizzes.js`
   - `manage/figure-avatars.js`
   - `manage/event-fusions.js`
   - `resources/videos/*.json`

交付：

- 当前命令基线记录。
- 当前 legacy source 清单。
- 确认本轮重构不直接改前端展示入口。

### Step 1：定义 archive schema 初版

目标：先把目标数据结构定下来，再迁移具体事件。

任务：

1. 新建：

   ```text
   archive/schemas/
   ```

2. 定义以下 schema 初版：
   - `event.schema.json`
   - `claim.schema.json`
   - `source.schema.json`
   - `asset.schema.json`
   - `quiz.schema.json`
   - `storyline.schema.json`
   - `variant.schema.json`
3. Schema 先覆盖必填字段和核心引用关系，不追求一次性覆盖所有历史字段。
4. 明确双语字段规范：页面可见文本优先使用 `{ zh, en }`。
5. 明确 ID 规范：
   - event id 使用现有事件 key。
   - claim id 在事件内唯一。
   - source id 在事件内唯一，后续可提升为全局 source。
   - asset id 在事件内唯一。
   - variant 文件名和 storyline id 对齐。

交付：

- `archive/schemas/*.schema.json` 初版。
- 一份 schema 说明或注释，说明哪些字段是第一阶段必填，哪些字段可选。

### Step 2：建立 archive 目录骨架

目标：让项目中出现稳定的 archive 源数据入口。

任务：

1. 新建目录：

   ```text
   archive/events/
   archive/storylines/
   archive/figures/
   archive/taxonomies/
   ```

2. 新建三条 storyline 初版：
   - `archive/storylines/deep-learning.json`
   - `archive/storylines/bench-council-ai100.json`
   - `archive/storylines/gaming-ai.json`
3. Storyline 初版只需引用样例事件，不必一次性迁移全部事件。
4. 新建 `archive/README.md`，说明：
   - `archive/` 是源档案。
   - `resources/` 是实际媒体文件。
   - `milestones-data*.js` 是生成物。

交付：

- `archive/` 基础目录。
- 三条 storyline 初版。
- `archive/README.md`。

### Step 3：迁移三个代表事件样例

目标：用真实复杂事件验证模型是否够用。

样例事件：

- `2012-alexnet`
- `2017-transformer`
- `2016-alphago`

每个事件目录结构：

```text
archive/events/{eventId}/
├── event.json
├── claims.json
├── sources.json
├── assets.json
├── quizzes.json
└── variants/
    ├── deep-learning.json
    ├── bench-council-ai100.json
    └── gaming-ai.json
```

实际 variant 文件按事件需要创建，不要求每个事件都有三种 variant。

任务：

1. 从 legacy 数据中抽取 canonical event 基础事实到 `event.json`。
2. 抽取核心可验证事实到 `claims.json`，优先覆盖：
   - 关键年份。
   - 关键论文。
   - 关键技术机制。
   - 历史地位判断。
3. 抽取论文、项目页、官方页、资料页到 `sources.json`。
4. 把展示用图片、SVG、PDF、视频等整理到 `assets.json`，保留实际文件在 `resources/`。
5. 把 quiz 整理到 `quizzes.json`。
6. 为不同分支建立 variant：
   - AI100 variant 强调 achievement dossier、论文来源、visual module、quiz。
   - gaming-ai variant 强调博弈谱系、搜索、自我对弈、game evolution。
   - deep-learning variant 强调深度学习能力扩展、模型机制、技术范式。

交付：

- 三个样例事件 archive 化。
- 至少一个事件展示多个 variant，以验证「事实统一，叙事多样」。

### Step 4：实现 validate:archive 初版

目标：先保证 archive 数据不会继续无约束增长。

任务：

1. 新建：

   ```text
   scripts/validate-archive.js
   ```

2. 新增 package 命令：

   ```json
   {
     "validate:archive": "node scripts/validate-archive.js"
   }
   ```

3. 初版校验至少覆盖：
   - event 目录和 `event.json` 存在。
   - `event.id` 与目录名一致。
   - 必填双语字段存在。
   - claim 的 `sourceIds` 能解析到 source。
   - asset 的 `path` 指向存在的 `resources/` 文件。
   - asset 的 `sourceId` 能解析到 source。
   - storyline 引用的 event 和 variant 存在。
4. 输出控制台摘要，并生成报告：

   ```text
   reports/archive-validation.md
   ```

交付：

- `npm run validate:archive` 可执行。
- 能对三条样例事件生成有效报告。

### Step 5：实现 archive compiler 初版

目标：从 archive 样例生成当前前端兼容的数据结构，同时不破坏 legacy 数据。

任务：

1. 新建：

   ```text
   scripts/build-archive.js
   ```

2. 新增 package 命令：

   ```json
   {
     "build:archive": "node scripts/build-archive.js"
   }
   ```

3. Compiler 初版支持：
   - 读取 `archive/storylines/*.json`。
   - 读取 event / claims / sources / assets / quizzes / variants。
   - 按 storyline + variant 生成 milestone-like 对象。
   - 输出一个中间文件，例如：

     ```text
     reports/archive-build-preview.json
     ```

4. 初版不要立即替换现有 `milestones-data.js`，先生成 preview 对比。
5. 为样例事件生成和 legacy milestone 接近的字段：
   - `id`
   - `year`
   - `title`
   - `description`
   - `location`
   - `figures`
   - `resources.images`
   - `resources.videos`
   - `achievement.sources`
   - `achievement.visualModules`
   - `quizzes`

交付：

- `npm run build:archive` 可执行。
- 生成 `reports/archive-build-preview.json`。
- 三个样例事件可以从 archive 组装成展示预览数据。

### Step 6：接入兼容生成路径

目标：让 archive 化事件可以进入现有展示数据，但 legacy 事件继续走旧路径。

任务：

1. 改造 `manage/generate.js` 或增加其调用的新模块，让生成过程支持混合来源：

   ```text
   archive event 优先
   legacy manage 数据兜底
   ```

2. 对已 archive 化的事件，使用 archive compiler 输出。
3. 对未 archive 化的事件，继续使用现有 `manage/*` 数据。
4. 生成报告标记每个 milestone 的来源：

   ```text
   archive
   legacy
   fused
   ```

5. 确保输出仍为：

   ```text
   milestones-data.js
   milestones-data-default.js
   ```

交付：

- 当前前端无需改造即可展示。
- 样例事件来自 archive，其他事件来自 legacy。
- `npm run generate` 后输出兼容数据。

### Step 7：建立差异审查与回归验证

目标：避免 archive 迁移改变非预期展示内容。

任务：

1. 新增或扩展报告：

   ```text
   reports/archive-build-diff.md
   ```

2. 对比 archive 输出和 legacy 输出：
   - title。
   - year。
   - description。
   - image list。
   - sources。
   - quiz。
   - visual module。
3. 对允许变化的字段标记为 intentional。
4. 固化 target 覆盖检查：
   - archive preview target id 不能重复。
   - 每个 archive preview id 都必须能匹配 generated milestone，除非是明确 disabled 的 storyline ref。
   - 每个 generated milestone 都必须有 archive preview 和 review snapshot row。
   - fused canonical event 的 AI100 variant 必须映射回正确的 legacy AI100 milestone id。
5. 每次迁移事件后运行：

   ```bash
   npm run generate
   npm run validate:archive
   npm test
   npm run lint
   npm run validate:startup
   ```

交付：

- 可读的 archive build diff。
- 样例事件迁移差异可审查。

### Step 8：批量迁移 AI100

目标：迁移最复杂、最需要准确性和资源治理的 BenchCouncil AI100。

任务：

1. 按批次迁移 AI100，不要一次迁移 100 个。
2. 每批建议 5-10 个事件。
3. 每个事件至少整理：
   - canonical event。
   - core claims。
   - primary source。
   - secondary sources。
   - assets。
   - AI100 variant。
   - quiz。
4. 每批生成覆盖报告：

   ```text
   reports/ai100-source-coverage.md
   reports/ai100-asset-coverage.md
   reports/ai100-translation-gaps.md
   reports/ai100-claim-verification.md
   ```

5. 每批都跑完整验证命令。

交付：

- AI100 分批 archive 化。
- 每批有覆盖率和缺口报告。

### Step 8 当前状态补充

当前 AI100 已经完成结构性 archive 覆盖：AI100 catalog 中当前展示 target 均有 archive event 或 canonical event variant 对应。实际迁移使用了 `scripts/migrate-archive-events.js` 批量生成结构化 event/source/asset/claim/quiz/variant 文件。

但内容质量仍需后续专项 review：

- 很多 batch-generated claim 仍为 `needs-source`。
- primary source / secondary source 的准确分级需要人工核对。
- AI100 专项 coverage 报告（source/asset/translation/claim）尚未完全建立。
- visualModules 与 source 的细粒度绑定仍需深化。

因此 Step 8 当前可视为：结构完成，内容质量深化未完成。

### Step 9：将 event-fusions 升级为 variant 机制

目标：从「强制融合成同一展示」升级为「共享事实、允许分支不同呈现」。

当前状态：部分完成。archive 已经能用 canonical event + variants 表达融合事件，`reports/archive-fusion-variant-map.md` 记录了 fusion 到 variant 的映射；`diff:archive` 也已经校验 fused canonical event 的 AI100 variant 能映射回正确 legacy AI100 milestone id。但 `manage/event-fusions.js` 仍在兼容生成路径中使用，尚未完全退役。

任务：

1. 梳理 `manage/event-fusions.js` 中当前融合事件。
2. 为每组融合事件确定 canonical event id。
3. 把共同事实迁入 canonical event / claims / sources / assets。
4. 把分支差异迁入 variants。
5. 保留必要的兼容映射，避免旧 ID 失效。
6. 修改生成器：同一 canonical event 可按 storyline variant 输出不同 milestone。

交付：

- `event-fusions` 逻辑逐步减少。
- 通过 variant 表达不同分支叙事。
- 同一事件可以「事实一致、呈现不同」。

### Step 10：资源治理与孤立文件报告

目标：让 `resources/` 从文件堆变成可审计的资产库。

任务：

1. 扫描 `resources/` 全部文件。
2. 扫描 archive 中全部 asset path。
3. 生成：

   ```text
   reports/assets-usage.md
   ```

4. 报告至少包含：
   - 被引用资源。
   - 未被引用资源。
   - path 不存在的 asset。
   - 多个 asset 复用同一文件。
   - 缺 caption/source/rights/usage 的 asset。
5. 暂不自动删除资源，只报告。

交付：

- `reports/assets-usage.md`。
- 可审查的资源使用关系。

### Step 11：管理后台 archive entity editor 改造

目标：将后台从 JS 对象编辑器升级为档案实体编辑器。

任务：

1. 后台先支持读取 archive 事件。
2. 增加事件详情页 tab：
   - Event。
   - Claims。
   - Sources。
   - Assets。
   - Quizzes。
   - Variants。
   - Validation。
3. 保存时写回对应 JSON 文件，而不是拼接整个 `manage/events.js`。
4. 保存后可触发：

   ```bash
   npm run validate:archive
   npm run build:archive
   ```

5. legacy 事件在迁移完成前仍可走旧编辑路径。

交付：

- 管理后台可以编辑 archive 样例事件。
- 校验结果能在后台可见。

当前状态：初版完成。`/archive-admin` 可以列出 archive events、读取/保存对应 JSON 文件、运行 archive validation。完整的 Event / Claims / Sources / Assets / Quizzes / Variants 分 tab 结构化表单尚未完成，仍属于后续产品化工作。

### Step 12：收口 legacy 数据源

目标：逐步减少旧数据源职责，避免长期双轨。

任务：

1. 当某类内容迁移完成后，标记 legacy 文件中对应段落为 deprecated 或只读生成输入。
2. 迁移完成的事件不再从 legacy 文件读取。
3. 更新 README / CLAUDE.md / docs，说明新编辑入口。
4. 清理不再使用的转换逻辑。
5. 保留必要的 backward compatibility mapping。

交付：

- archive 成为主数据源。
- legacy 数据源职责明确减少。
- 文档同步更新。

当前状态：未完成。当前 archive 已经覆盖所有当前展示 target，但 compatible generation 仍以 legacy generated milestone 作为展示 baseline，并通过 archive overlay 附加元数据。下一阶段需要单独设计 archive source-of-truth transition plan，再逐步减少 `manage/events.js`、`manage/event-fusions.js` 等 legacy source 的职责。

## 风险与缓解

### 风险：文件数量增加

缓解：

- 按 event 目录组织。
- 用 schema 和 validate 脚本降低手工维护成本。
- 管理后台后续按实体编辑，而不是直接编辑所有 JSON。

### 风险：迁移期间两套数据源并存

缓解：

- 明确阶段边界。
- 先只迁移样例事件。
- compiler 支持从 archive 和旧 manage 数据同时生成，直到完成迁移。
- 报告标明哪些事件已 archive 化，哪些仍来自 legacy source。

### 风险：前端展示被破坏

缓解：

- 短期继续输出兼容 `milestones-data.js`。
- 不让前端直接读取源 `archive/`。
- 每阶段运行 `npm test`、`npm run validate:startup`。

### 风险：source/claim 颗粒度过细导致编辑负担过大

缓解：

- 不要求每句话都 claim 化。
- 只要求核心事实、数字、历史归因、评价性判断绑定 source。
- 允许低风险描述先保留在 description 中。

## 验收标准

### 架构验收

- [ ] 新增 `archive/` 目录，并包含事件、storyline、schema 的基础结构。
- [ ] 至少完成 3 个代表事件的 archive 化样例。
- [ ] `archive/` 与 `resources/` 分工清晰，资源本体仍保存在 `resources/`。
- [ ] 事件事实、来源、资源、展示 variant 不再全部混在一个大对象中。

### 生成验收

- [ ] 可以从 `archive/` 生成当前前端兼容的 `milestones-data.js`。
- [ ] 当前 `index.html` 和 `dual-screen.html` 不需要大规模改造即可继续展示。
- [ ] `milestones-data-default.js` 的 fallback 机制不被破坏。

### 校验验收

- [ ] 新增 `npm run validate:archive`。
- [ ] 能检查缺失资源路径。
- [ ] 能检查 asset 缺少 caption/source/rights/usage。
- [ ] 能检查 claim 缺少 source。
- [ ] 能检查 storyline 引用不存在的 event / variant。
- [ ] 能生成 archive validation report。

### 兼容验收

- [ ] `npm test` 通过。
- [ ] `npm run lint` 通过。
- [ ] `npm run validate:startup` 通过。
- [ ] 当前静态展示、admin 启动、Docker presentation 构建路径不被破坏。

## 推荐 Issue 拆分

主 issue 应作为 Epic。后续可拆分：

1. 设计 `archive/schemas/` 初版。
2. 迁移 `2012-alexnet` / `2017-transformer` / `2016-alphago` 样例。
3. 实现 `validate:archive`。
4. 实现 archive compiler 并生成兼容 `milestones-data.js`。
5. 迁移 AI100 档案与资源元数据。
6. 将 `event-fusions` 升级为 canonical event + variant 机制。
7. 重构管理后台为 archive entity editor。

## 相关文件

当前相关文件包括：

- `manage/events.js`
- `manage/ai100-extra-events.js`
- `manage/gaming-extra-events.js`
- `manage/catalog.js`
- `manage/quizzes.js`
- `manage/figure-avatars.js`
- `manage/event-fusions.js`
- `manage/generate.js`
- `manage/server.js`
- `shared/milestone-view.js`
- `shared/i18n.js`
- `resources/images/`
- `resources/videos/`
- `resources/papers/`
- `milestones-data.js`
- `milestones-data-default.js`
- `index.html`
- `dual-screen.html`
