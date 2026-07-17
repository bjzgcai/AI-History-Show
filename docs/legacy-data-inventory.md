# Legacy 历史数据文件盘点

> **当前状态（2026-07-17）**：Archive JSON 已成为生产权威。默认 `npm run generate` 只编译 `archive/storylines/*.json` 与 `archive/events/*`；正式 compiler 不再读取 `manage/events.js`、`manage/catalog.js` 或 `manage/event-fusions.js`。本文后续“正式展陈仍从 Legacy 生成”等段落记录的是迁移阶段历史，不再是当前操作指南。保留的 Legacy 文件仅用于显式 `npm run generate:legacy`、rollback、comparison、migration 和 parity。重型 preview/parity/review 产物写入 `.tmp/archive-*`，正式页面也不再支持 `?archivePreview=1` 数据旁路。
本文档用于记录 archive 迁移之后，旧版历史数据文件（legacy data files）当前还承担哪些职责，以及后续应如何逐步收口到文件化 `archive/` 模型中。

## 当前状态

迁移阶段曾先从 Legacy JavaScript 生成正式展陈数据，再叠加 Archive metadata，以避免 title、description、images、sources、quiz 和 visual module 在迁移过程中发生非预期变化。该阶段已经结束；当前默认 generator 直接从 Archive 生成正式数据。

当前正式生成链路仍是：

```text
manage/* 与 resources/* legacy 数据
        │
        ▼
manage/generate.js
        │
        ▼
milestones-data.js / milestones-data-default.js
        │
        ▼
archive overlay / archive review snapshot
```

因此，在 archive-native generation 完成之前，不要删除、移动或大规模重排这些 legacy 文件。任何整理都应先保证：

```bash
npm run audit:legacy-data
npm run validate:archive
npm run diff:archive
npm run diff:archive-preview
```

保持通过。

## 文件盘点

| 文件 | 当前职责 | archive 目标位置 | 现在能删除吗 | 迁移优先级 |
|---|---|---|---:|---|
| `manage/catalog.js` | 旧版展陈目录与路由配置：控制主时间线分类、BenchCouncil AI100 顺序、gaming branch 顺序。 | `archive/storylines/*.json`，以及未来 archive-native display manifest。 | 否 | 高 |
| `manage/events.js` | 正式展陈生成的主 legacy 事件入口；同时合并 AI100 与 gaming 扩展事件。 | `archive/events/{eventId}/event.json`、`claims.json`、`sources.json`、`assets.json`、`variants/*.json`。 | 否 | 高 |
| `manage/ai100-extra-events.js` | AI100 legacy 内容包，包含 achievement 展示、来源、commentary、图片、visual module 等。 | archive event bundles 与 BenchCouncil AI100 variants。 | 否 | 高 |
| `manage/gaming-extra-events.js` | gaming branch legacy 内容包，包含论文、commentary、媒体卡片、game-oriented presentation。 | archive event bundles 与 `gaming-ai` variants。 | 否 | 中 |
| `manage/quizzes.js` | legacy quiz catalog，被当前 `manage/generate.js` 消费。 | `archive/events/{eventId}/quizzes.json`，再由 variant 的 `quizId` 选择。 | 否 | 高 |
| `manage/figure-avatars.js` | 人物头像展示辅助 registry，包含头像路径、event-specific override、裁切样式。 | 未来的 archive figure/person registry 与 asset/rights metadata。 | 否 | 中 |
| `manage/event-fusions.js` | 过渡期融合逻辑：处理同时出现在 deep-learning 与 AI100 中的共享事件。 | canonical archive event + 多个 storyline variant。 | 否 | 高 |
| `manage/event-fusion-assets.js` | 过渡期融合事件图片顺序与排除规则。 | archive variant 中的 `assetIds` 顺序。 | 否 | 高 |
| `resources/videos/*.json` | 视频 metadata cache / candidate catalog，被 legacy generator 用于补全视频信息。 | archive video assets，并补充 source 与 rights metadata。 | 否 | 中 |
| `resources/quote-candidates.js` | 非直接渲染的引言候选库。 | 经核验后进入 archive claims/sources，或未来的 `archive/research/` staging 区。 | 否 | 低 |
| `resources/research-candidates.js` | 非直接渲染的研究素材候选库，包括候选文案和候选图片来源。 | 经核验后进入 archive claims/sources/assets/variants，或未来的 `archive/research/` staging 区。 | 否 | 低 |

## 推荐的职责分层

### 1. Legacy 兼容层

这些文件短期内仍然是正式展陈生成的权威输入：

```text
manage/catalog.js
manage/events.js
manage/quizzes.js
manage/figure-avatars.js
resources/videos/*.json
```

它们的变更仍然会影响 `milestones-data.js`。修改后应运行正常质量检查和 archive diff 检查。

短期原则：

- 保留；
- 不大规模重排；
- 不手动删除字段；
- 通过脚本和 diff gate 逐步收口；
- 新增长期内容时，优先考虑是否应该 archive-first。

### 2. 迁移过渡层

这些文件主要是因为当前 generator 仍从 legacy event object 出发，所以暂时存在：

```text
manage/ai100-extra-events.js
manage/gaming-extra-events.js
manage/event-fusions.js
manage/event-fusion-assets.js
```

它们不应该成为新的长期事实来源。后续如果继续编辑这些文件，应同步考虑 archive 侧是否也需要更新。

特别是：

```text
manage/event-fusions.js
manage/event-fusion-assets.js
```

这两个文件的职责，本质上已经被 archive 模型覆盖：

```text
canonical event + storyline variants + variant.assetIds
```

因此它们应作为后续 source-of-truth closure 的优先退休对象。

### 3. Research inbox / 候选素材层

这些文件不是正式展示源：

```text
resources/quote-candidates.js
resources/research-candidates.js
```

它们更像研究素材收件箱。只有经过核验、补充 source/provenance/rights 后，才应晋升为 archive 中的正式 claim、source、asset 或 variant 内容。

短期原则：

- 保留现状；
- 不直接作为权威数据；
- 不自动进入展示；
- 后续可迁到 `archive/research/` 或拆入各事件目录。

## 整理规则

1. 不手动编辑生成文件，例如 `milestones-data.js`、`milestones-data-default.js` 和 `.tmp/archive-*` 下的 preview/review 产物；需要通过脚本重新生成。
2. 在 `manage/generate.js` 仍依赖 legacy 文件时，不删除 legacy 数据文件。
3. 不在没有版权/授权核验的情况下，把外链图片或视频下载到本地 `resources/`。
4. 继续把 `resources/` 视为 append-only，除非用户明确要求清理或删除。
5. 在退休、替换或迁移 legacy source 前，先运行：
   ```bash
   npm run audit:legacy-data
   ```
6. 在声称 archive 与当前展示一致前，保持以下检查通过：
   ```bash
   npm run diff:archive
   npm run diff:archive-preview
   ```
7. 如果 archive preview 中出现图片、来源、commentary、quiz 减少，应先修 archive 数据，不要直接改 legacy 展示去迎合 archive。
8. 如果需要保留当前展陈效果，archive variant 默认应继续使用：
   ```json
   "presentationMode": "preserve-legacy"
   ```

## 建议的退休顺序

### 阶段 1：保持 legacy 作为兼容基线

继续让正式展陈从 legacy 数据生成。archive overlay 只附加 metadata、claims、sourceIds、assetIds 等档案信息，不改变展示。

目标：

- 当前展示稳定；
- archive coverage 完整；
- review/diff 报告可持续通过。

### 阶段 2：强化审计和覆盖报告

使用并扩展：

```bash
npm run audit:legacy-data
npm run validate:archive
npm run diff:archive
npm run diff:archive-preview
```

确保每个 legacy display target 都有对应 archive event、variant、source、asset 和 quiz 覆盖。

### 阶段 3：优先退休 fusion 逻辑

优先把以下文件的职责迁入 archive：

```text
manage/event-fusions.js
manage/event-fusion-assets.js
```

目标模型：

```text
archive/events/{canonicalEventId}/
├── event.json
├── claims.json
├── sources.json
├── assets.json
├── quizzes.json
└── variants/
    ├── deep-learning.json
    └── bench-council-ai100.json
```

图片顺序和展示选择由 variant 中的 `assetIds` 控制，而不是由额外 JS 文件控制。

### 阶段 4：AI100 / gaming 改为 archive-first authoring

后续新增或大改 AI100、gaming 事件时，优先写入 archive：

```text
archive/events/*
archive/storylines/*
```

如果 legacy generator 仍需要兼容数据，再反向生成或手动同步到：

```text
manage/ai100-extra-events.js
manage/gaming-extra-events.js
```

避免继续把新长期内容只写入 legacy 文件。

### 阶段 5：引入 archive-native milestone generation

在不影响正式展陈的前提下，先做 archive-native generation preview：

```text
archive -> .tmp/archive-preview/milestones-data-archive-preview.js
```

持续用：

```bash
npm run diff:archive-preview
```

对比正式 legacy 展示和 archive preview 展示。

### 阶段 6：archive 成为默认权威源

只有在以下条件稳定满足后，才考虑让 archive-native generation 成为默认路径：

- 正常展示无非预期变化；
- archive preview 没有图片、来源、commentary、quiz 减少；
- title/subtitle/description/images/visual/analysis 等 display-critical 字段一致或经过明确批准变更；
- fusion 逻辑已迁入 archive variants；
- AI100/gaming 新内容已经 archive-first；
- rights review 状态清晰。

之后再分小步、可回滚地退休 legacy 文件。

## 当前审计命令

新增 legacy/archive 边界审计命令：

```bash
npm run audit:legacy-data
```

它会生成：

```text
reports/legacy-data-audit.md
```

当前检查内容包括：

- catalog 引用是否都存在于 `events.js`；
- legacy event key 是否都被 catalog 引用；
- catalog 是否有重复引用；
- legacy quiz 与 archive quiz 的事件级差异；
- fusion 事件是否都有 archive event、deep-learning variant、AI100 variant 和 storyline ref；
- archive preview 是否覆盖 generated milestones；
- archive preview 是否有 duplicate id 或编译错误。

注意：quiz 差异目前是迁移盘点项，不一定代表展示缺失。部分 shared events 在 legacy 中使用 AI100 id，例如：

```text
ai100-2012-alexnet
ai100-2017-transformer
ai100-2020-alphafold2
```

而 archive 中使用 canonical id，例如：

```text
2012-alexnet
2017-transformer
2020-alphafold
```

因此这类差异应结合 fusion/canonical mapping 解读。
