# AI 历史回顾展览

[English](README.md) | **简体中文**

面向展厅大屏的互动式 AI 历史展览应用，支持中英文切换，并能在单屏、移动端和双屏布局间自动适配。当前数据包含核心 AI 历史、BenchCouncil AI100、棋牌与博弈 AI，以及 AI 人文与情绪周期四条叙事线。

## 快速开始

```bash
npm ci

# 本地预览展示页：http://localhost:8000
npm run start:static

# 固定监听 127.0.0.1:8000 的展厅演示服务
npm run start:demo

# 本地 Archive 内容管理：http://localhost:3001/admin
npm run start:admin

# 完整质量与部署验证
npm run quality
npm run validate:deployment
```

容器化预览：

```bash
docker build -t ai-history-show .
docker run --rm -p 8000:8000 ai-history-show

# 或启动 Compose presentation 服务
docker compose up --build presentation

# 需要本地管理服务时再启用 admin profile
docker compose --profile admin up --build
```

> **安全提示**：管理服务端口 3001 没有身份验证，只能用于本机、内网或受保护环境，切勿直接暴露到公网。SSH 隧道、Nginx 和展厅部署方式见 [DEPLOYMENT.md](DEPLOYMENT.md)。

## 内容权威与编辑流程

`archive/` JSON 是生产内容权威。不要手工编辑生成的 `milestones-data.js` 或 `milestones-data-default.js`。

```text
archive/storylines/*.json ─┐
archive/events/*/          ├─→ npm run validate:archive ─→ npm run generate
resources/                 ┘                              ├─→ milestones-data.js
                                                           └─→ milestones-data-default.js
```

推荐流程：

1. 运行 `npm run start:admin`，打开 `http://localhost:3001/admin`。
2. 在 Events 中编辑事件 bundle，或在 Storylines 中编辑成员、variant、启用状态、顺序和 `milestoneId`。
3. 在编辑器中运行 validation，或执行 `npm run validate:archive`。
4. 执行 `npm run generate` 更新两份正式运行时数据。
5. 执行 `npm run quality` 和相关内容校验。

也可以直接编辑：

```text
archive/events/<event-id>/
├── event.json
├── claims.json
├── sources.json
├── assets.json
├── quizzes.json
└── variants/*.json

archive/storylines/*.json
```

Archive compiler 从这些文件解析 storyline ref、variant、来源、资源、quiz 和展示 ID，不读取 Legacy event/catalog/fusion metadata 作为生产输入。完整的实体关系、编译展开、失败保护和部署流见 [Archive 数据流与内容权威边界](docs/archive-data-flow.md)。

### Legacy 工具已退役

旧 Legacy 页面、数据模块、生成器、parity 页面以及迁移/对比脚本均已删除。`/admin` 现在是 Archive 管理入口；旧 `/archive-admin`、`/api/events`、`/api/catalog`、`/api/generate` 等路由返回 HTTP 404。历史实现需要时可从 Git 历史查阅。

## Storylines

当前生成数据包含四条叙事线：

| Storyline | 数量 | 说明 |
|---|---:|---|
| 核心 AI 历史 | 21 | Three.js 地球与主里程碑流程 |
| BenchCouncil AI100 | 100 | 成就地图、来源卡片、背景章节、demo 与 quiz |
| 棋牌与博弈 AI | 13 | 搜索、学习评估、自我博弈、扑克、麻将和世界模型规划 |
| AI 人文与情绪周期 | 12 | 科幻预言、技术狂热、AI 寒冬与风险讨论 |

直接打开指定 storyline：

```text
http://localhost:8000/index.html?storyline=bench-council-ai100
http://localhost:8000/index.html?storyline=gaming-ai
http://localhost:8000/index.html?storyline=humanistic-cycle
```

## 页面与布局

- 自适应入口：`http://localhost:8000/`
- 固定双屏入口：`http://localhost:8000/dual-screen.html`
- 强制单屏：`?layout=single`
- 强制双屏：`?layout=dual`
- 语言选择保存在 `localStorage` 的 `ai-history-locale` 键中

正式页面始终加载 `milestones-data.js`，失败时回退到同步生成的 `milestones-data-default.js`。页面不支持通过 query 参数切换到其他数据源。

Windows 双屏、Edge app/kiosk、Intel/NVIDIA 合屏和 DisplayFusion 限制见 [DEPLOYMENT.md](DEPLOYMENT.md)。移动端支持范围见 [docs/mobile-responsive-support.md](docs/mobile-responsive-support.md)。

## 静态发布包

Pages 和 Docker presentation 共用同一个最小静态包：

```bash
npm run generate
npm run build:static
# 输出：.tmp/static-site/
```

发布包只包含正式页面、两份 runtime data、`shared/`、浏览器实际需要的 `resources/`、页面依赖的 `public/` 字体和 `.nojekyll`。它不会公开 `archive/`、`manage/`、`research/`、`scripts/`、候选资料/视频 metadata helper 或 `.tmp/` 内部产物。

## 国际化

- 字典和切换逻辑：[shared/i18n.js](shared/i18n.js)
- Archive 可见文本使用 `{ "zh": "…", "en": "…" }`
- 缺失语言会回退到另一语言
- AI100 内容需本地化 title、description、location、figures、commentary、achievement、image metadata、sources 和 quizzes

## 质量门禁

提交前至少运行：

```bash
npm ci
npm run validate:archive
npm run generate
npm run quality
npm run validate:deployment
```

AI100 内容工作还应运行：

```bash
npm run validate:ai100-context
npm run validate:ai100-quizzes
npm run audit:ai100-accuracy
```

常用 Archive 审计：

```bash
npm run report:assets
npm run audit:figures
npm run audit:svg-explainers
npm run audit:svg-geometry
```

## 目录结构

```text
AI-History-Show/
├── index.html                    # 自适应单屏/移动入口
├── dual-screen.html              # 固定双屏入口
├── milestones-data.js            # Archive 生成的正式 runtime data
├── milestones-data-default.js    # 同步生成的 fallback data
├── archive/
│   ├── storylines/               # 成员、variant、顺序、启用状态、展示 ID
│   └── events/                   # 事实、claims、sources、assets、quizzes、variants
├── manage/
│   ├── admin.html                 # 可写 Archive JSON 编辑器
│   └── server.js                 # Archive-only 本地管理服务
├── shared/                       # 页面共用 JS
├── resources/                    # 浏览器加载的图片、论文、视频等资源
├── public/                       # 页面直接引用的公共文件和字体
├── scripts/                      # 生成、验证、测试和审计脚本
├── .github/workflows/            # Quality、deployment、Pages 工作流
└── DEPLOYMENT.md                 # 部署与展厅运行指南
```

`resources/` 按项目约束视为 append-only；除非明确要求，不删除已有图片或视频元数据。

## 技术栈

- HTML5、CSS3、原生 JavaScript，无前端打包工具
- CDN 加载 Three.js
- Node.js 22+ 用于 Archive 编译、本地管理、验证和 Docker build stage
- 可选 Python 工具用于生成棋局演化视频

## 代码仓库

- Gitee：`ssh://git@z.gitee.cn:223/zgca/AI-History-Show.git`
- GitHub：`git@github.com:bjzgcai/AI-History-Show.git`

默认 `origin` 使用 GitHub `main` 分支；如本地配置 Gitee remote，其默认分支为 `master`。详细同步方式见 [DEPLOYMENT.md](DEPLOYMENT.md)。

## 许可证

Apache License 2.0
