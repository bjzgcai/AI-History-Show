# Archive 数据流与内容权威边界

> 当前状态：2026-07-24。本文描述 Archive-only 生产链路；Legacy 编辑器、生成器、数据模块和迁移/对比工具已退役，历史实现仅通过 Git 历史保留。

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
    EDITOR["/admin<br/>Archive JSON 编辑器"]
    DIRECT["直接编辑 Archive JSON"]
    STORYLINES["archive/storylines/*.json"]
    EVENTS["archive/events/*/"]
    RESOURCES["resources/"]
    VALIDATE["npm run validate:archive<br/>scripts/validate-archive.js"]
    VALIDATION_REPORT[".tmp/archive-reports/archive-validation.md"]
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
npm run start:admin       # 打开 http://localhost:3001/admin
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

当前 production compiler 只读取 Archive JSON，不使用历史 milestone 作为 scaffold，也不从已退役的数据模块推导正式 milestone ID。

## 4. Archive-only 边界

```mermaid
flowchart LR
    A["Archive JSON"] --> C["Archive compiler"] --> R["正式 runtime data"] --> F["single / dual / static bundle"]
    M["/admin"] --> A
    H["Git 历史中的 Legacy 实现"] -.->|只用于追溯，不可执行| A
```

边界约束：

- 默认 `npm run generate` 只编译 Archive storyline 和 event bundle。
- `/admin` 是唯一管理入口；旧 `/archive-admin` 与 Legacy API 返回 HTTP 404。
- Legacy 数据模块、生成器、parity 页面和一次性迁移/对比脚本不再存在于工作树。
- 可重建报告写入被忽略的 `.tmp/`，不会进入 Pages/Docker 静态包。
- `resources/` 中保留的候选资料和视频 metadata 遵守 append-only 约束，但不进入静态发布包。

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
| 自动报告与机器工作集 | `.tmp/archive-reports/`、`.tmp/archive-review/` 等 | 可重建，不跟踪 |
| 人工研究与审阅结论 | `research/` | 长期跟踪，人工维护 |

Archive 迁移期的阶段报告已从当前工作树移除，仍可通过 Git 历史查阅。

`resources/` 继续按 append-only 规则管理。资源报告中的“未引用”只表示没有找到某类静态引用，不构成删除授权。

## 6. 关键实现入口

- `scripts/archive-compiler.js`：加载 storyline、event bundle、variant，并生成 milestone。
- `scripts/generate-archive-data.js`：处理编译错误和两份 runtime data 的原子同步写入。
- `scripts/validate-archive.js`：验证结构、引用、双语字段和资源路径。
- `manage/admin.html`、`manage/server.js`：Archive JSON 编辑、保存和校验 API。
- `scripts/test-archive-authority.js`：固定 Archive authority、稳定 ID、provenance 和输出保护边界。
- `scripts/build-static-site.js`：构建 Pages 与 Docker 共用的最小静态发布包。
