# Archive 数据流与内容权威边界

> 当前状态：2026-07-17。本文描述当前生产链路；迁移期的 overlay、preview 和 Legacy-first 流程仅作为离线比较或历史记录保留。

## 1. 内容实体关系

```mermaid
flowchart LR
    SL["Storyline<br/>archive/storylines/*.json"]
    REF["Storyline ref<br/>milestoneId · eventId · variant<br/>order · enabled"]
    EV["Canonical event bundle<br/>archive/events/event-id/"]
    EVENT["event.json<br/>基础事实、时间、地点、人物"]
    VAR["variants/storyline-id.json<br/>分支展示与选择关系"]
    CLAIM["claims.json"]
    SOURCE["sources.json"]
    ASSET["assets.json"]
    QUIZ["quizzes.json"]
    MEDIA["resources/<br/>浏览器可加载的媒体文件"]

    SL --> REF
    REF -->|eventId| EV
    REF -->|variant| VAR
    EV --> EVENT
    EV --> CLAIM
    EV --> SOURCE
    EV --> ASSET
    EV --> QUIZ
    EV --> VAR
    VAR -->|claimIds| CLAIM
    VAR -->|sourceIds| SOURCE
    VAR -->|assetIds| ASSET
    VAR -->|quizId| QUIZ
    CLAIM -->|sourceIds| SOURCE
    ASSET -->|sourceId / sourceIds| SOURCE
    ASSET -->|path| MEDIA
```

核心规则：

- Event 是 canonical 事实主体，同一事件只维护一次基础事实。
- Storyline ref 拥有正式展示 ID `milestoneId`、事件引用、variant、顺序与启用状态。
- Variant 选择该分支使用的 claim、source、asset、quiz，并承载分支特定的展示字段。
- `archive/` 保存元数据、来源、关系和审核状态；`resources/` 保存实际文件。
- 前端不直接读取 `archive/`，而是读取编译后的 runtime data。

## 2. 从编辑到部署的生产数据流

```mermaid
flowchart TD
    EDITOR["/archive-admin<br/>Archive JSON 编辑器"]
    DIRECT["直接编辑 Archive JSON"]
    STORYLINES["archive/storylines/*.json"]
    EVENTS["archive/events/*/"]
    RESOURCES["resources/"]
    VALIDATE["npm run validate:archive<br/>scripts/validate-archive.js"]
    VALIDATION_REPORT["reports/archive-validation.md"]
    GENERATE["npm run generate<br/>scripts/generate-archive-data.js"]
    COMPILER["scripts/archive-compiler.js"]
    PRIMARY["milestones-data.js"]
    FALLBACK["milestones-data-default.js"]
    SINGLE["index.html"]
    DUAL["dual-screen.html"]
    SHARED["shared/milestone-view.js<br/>shared/i18n.js 等"]
    STATIC["npm run build:static<br/>.tmp/static-site/"]
    PAGES["GitHub Pages"]
    DOCKER["Docker presentation<br/>Nginx :8000"]

    EDITOR --> STORYLINES
    EDITOR --> EVENTS
    DIRECT --> STORYLINES
    DIRECT --> EVENTS
    STORYLINES --> VALIDATE
    EVENTS --> VALIDATE
    RESOURCES --> VALIDATE
    VALIDATE --> VALIDATION_REPORT
    STORYLINES --> COMPILER
    EVENTS --> COMPILER
    RESOURCES -.->|asset path 必须存在| COMPILER
    GENERATE --> COMPILER
    COMPILER --> GENERATE
    GENERATE -->|原子同步写入| PRIMARY
    GENERATE -->|原子同步写入| FALLBACK
    PRIMARY --> SINGLE
    PRIMARY --> DUAL
    FALLBACK -->|主数据加载失败时| SINGLE
    FALLBACK -->|主数据加载失败时| DUAL
    SHARED --> SINGLE
    SHARED --> DUAL
    PRIMARY --> STATIC
    FALLBACK --> STATIC
    SINGLE --> STATIC
    DUAL --> STATIC
    RESOURCES --> STATIC
    SHARED --> STATIC
    STATIC --> PAGES
    STATIC --> DOCKER
```

推荐编辑顺序：

```bash
npm run start:admin       # 打开 http://localhost:3001/archive-admin
npm run validate:archive
npm run generate
npm run quality
```

涉及部署时继续运行：

```bash
npm run validate:deployment
```

## 3. 单个 milestone 的编译展开

```mermaid
sequenceDiagram
    participant C as archive-compiler.js
    participant S as Storyline ref
    participant E as Event bundle
    participant V as Variant
    participant R as Claims/Sources/Assets/Quizzes
    participant M as Milestone

    C->>S: 读取 enabled ref
    C->>S: 校验并采用 milestoneId
    C->>E: loadEventBundle(eventId)
    C->>V: loadVariant(variant)
    C->>R: 按 variant 中的 ID 选择实体
    C->>M: 合并 canonical facts 与 variant presentation
    C->>M: 写入 Archive provenance
    C-->>C: 检查所有 ref，收集 errors
```

生成的 milestone 保持现有前端 shape，主要包含：

- `id`、`year`、`date`、`title`、`description`、`location`；
- `figures`、`resources.images/videos`、`imageMeta`；
- `achievement.sources/claims/visualModules`；
- `commentarySections`、`analysis`、`quizzes`；
- `archiveEventId`、`archiveVariantId`、`sourceKind: "archive"` 等 provenance。

当前 production compiler 不使用 Legacy milestone 作为 scaffold，也不从 Legacy fusion metadata 推导正式 milestone ID。

## 4. Production 与 Legacy 隔离边界

```mermaid
flowchart LR
    subgraph Production["生产权威路径"]
        A["Archive JSON"] --> C["Archive compiler"] --> R["正式 runtime data"] --> F["single / dual / static bundle"]
    end

    subgraph Offline["显式离线兼容路径"]
        L["manage/events.js 等 Legacy 数据"] --> LG["npm run generate:legacy"]
        LG --> P["rollback / comparison / parity / migration / audit"]
        P --> TMP[".tmp/archive-*/"]
    end

    L -.->|禁止作为生产输入| C
    TMP -.->|不由正式页面加载| F
```

边界约束：

- 默认 `npm run generate` 只编译 Archive storyline 和 event bundle。
- `/archive-admin` 是可写内容入口；`/admin` 是 Legacy 只读参考页。
- Legacy mutation API 在 authority cutover 后返回 HTTP 403。
- `npm run generate:legacy` 可能临时覆盖两份 runtime data；比较结束后必须重新运行 `npm run generate`。
- preview、native、parity、review 和机器报告工作集写入被忽略的 `.tmp/archive-*`，不会进入 Pages/Docker 静态包。

## 5. 失败保护与生成物规则

```mermaid
flowchart TD
    START["npm run generate"] --> COMPILE["编译全部 enabled refs"]
    COMPILE --> CHECK{"errors === 0?"}
    CHECK -->|否| ABORT["退出失败<br/>保留现有两份 runtime data"]
    CHECK -->|是| TEMP["写入两个临时文件"]
    TEMP --> BACKUP["备份现有 primary/fallback"]
    BACKUP --> INSTALL["安装两个新文件"]
    INSTALL --> DONE["删除临时备份<br/>两份输出保持同步"]
    INSTALL -->|任一步失败| ROLLBACK["回滚原文件并报告错误"]
```

以下文件是生成物，不得手工编辑：

```text
milestones-data.js
milestones-data-default.js
.tmp/archive-*/**
```

版本库中的产物分层：

| 层级 | 位置 | 策略 |
|---|---|---|
| 内容权威 | `archive/**` | 长期跟踪，人工编辑入口 |
| 正式 runtime | `milestones-data*.js` | 长期跟踪，只能由 generator 更新 |
| 当前摘要报告 | `reports/*.md` | 按命令刷新，保留长期可读结论 |
| 机器工作集 | `.tmp/archive-reports/`、`.tmp/archive-review/` 等 | 可重建，不跟踪 |
| 阶段历史 | `reports/history/` | 保留迁移计划、基线与阶段验收背景 |

`resources/` 继续按 append-only 规则管理。资源报告中的“未引用”只表示没有找到某类静态引用，不构成删除授权。

## 6. 关键实现入口

- `scripts/archive-compiler.js`：加载 storyline、event bundle、variant，并生成 milestone。
- `scripts/generate-archive-data.js`：处理编译错误和两份 runtime data 的原子同步写入。
- `scripts/validate-archive.js`：验证结构、引用、双语字段和资源路径。
- `manage/archive-admin.html`、`manage/server.js`：Archive JSON 编辑、保存和校验 API。
- `scripts/test-archive-authority.js`：固定 Archive authority、稳定 ID、provenance 和输出保护边界。
- `scripts/build-static-site.js`：构建 Pages 与 Docker 共用的最小静态发布包。
