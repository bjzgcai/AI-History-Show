# AI-History-Show 项目指南

## 项目概述

交互式AI历史展览大屏应用。

- **技术栈**: HTML5 + CSS3 + Vanilla JS + Three.js（3D地球）
- **展示入口**: `index.html`（自适应展厅大屏/桌面/移动端）
- **数据文件**: `milestones-data.js` 与 `milestones-data-default.js`（由 `npm run generate` 从 Archive JSON 同步生成，勿手动编辑）

## 文件结构

```
AI-History-Show/
├── index.html                    # 自适应展示入口
├── milestones-data.js            # Archive 生成的正式运行时数据
├── milestones-data-default.js    # 同步生成的 fallback 数据
├── archive/
│   ├── storylines/               # Storyline 成员、variant、顺序和展示 ID
│   └── events/                   # 事件事实、来源、资源、quiz 与 variants
├── shared/                       # 展示入口共用的前端逻辑
├── resources/
│   ├── images/                   # 里程碑图片（append-only）
│   ├── papers/                   # 页面使用的本地论文资料
│   └── videos/                   # 视频与视频元数据（append-only）
├── manage/
│   ├── admin.html                # 可写 Archive JSON 编辑器
│   └── server.js                 # Archive-only 本地内容管理服务
├── scripts/                      # 生成、验证、测试与审计脚本
├── DEPLOYMENT.md                # 部署指南
└── AGENTS.md                    # 本文档
```

## 内容管理工作流

Archive JSON 是生产内容权威：

```bash
# 可选：启动本地编辑器并打开 http://localhost:3001/admin
npm run start:admin

# 后台支持结构化人物资料、事件/variant 人物关系、人物审计与受控生成；
# 高级 JSON 模式仍直接编辑 Archive JSON。
# 编辑 archive/events/<event-id>/*、archive/storylines/*.json 或 archive/figures/figures.json 后
npm run validate:archive
npm run generate
# → 同步生成 milestones-data.js、milestones-data-default.js、首页/头像缩略图与缩略图清单
```

`/admin` 是唯一管理入口。旧 `/archive-admin`、Legacy 数据模块、生成器、parity 与迁移/对比工具已经退役；旧管理 API 返回 HTTP 404。需要追溯旧实现时使用 Git 历史，不恢复为当前写作链路。

### Archive 事件结构

每个事件目录（如 `archive/events/1956-dartmouth/`）包含：

| 文件 | 说明 |
|------|------|
| `event.json` | 年份、标题、地点、人物等 canonical event facts |
| `claims.json` | 可追溯的事实主张与证据引用 |
| `sources.json` | 论文、档案、机构页等来源 |
| `assets.json` | 图片、视频、论文等资源及双语元数据 |
| `quizzes.json` | 事件可用的 quiz 集合 |
| `variants/*.json` | Storyline 专属的描述、展示模块、资源/来源/quiz 选择 |

`archive/storylines/*.json` 决定事件成员、variant、启用状态、顺序与稳定 `milestoneId`。生产 compiler 不从 Legacy catalog 或 fusion metadata 推导正式里程碑 ID。

### AI100 成就新增 schema（必须遵守）

以后新增 BenchCouncil AI100 achievement 时，必须一次性满足以下内容与网页布局要求，避免后续反复返工：

#### 1. 顶部三联视觉区

AI100 页面顶部必须像旧 achievement 一样有 3 个资料卡片：

  1. `images[0]` 为相关科学家 / 人物 / 团队 / 机构照片。
     - 优先真人 portrait；如果没有可靠 portrait，可用团队、机构、实验室或历史照片。
     - 必须在 `imageMeta[images[0]]` 写清 caption、subcaption、source、sourceUrl、license/usage。
  2. `images[1]` 为成就本身的 visualization / architecture / algorithm explainer。
     - 不能放第二张人物照。
     - 优先本地原创 SVG/PNG explainer；不要直接复制受版权保护的论文图。
  3. `achievement.visualModules[0]` 为相关文章、论文、项目页或档案页卡片（`type: "archiveLink"`）。
     - 必须包含 `site/title/description/url/source/action`，并推荐包含 `license/usage`。
     - 这是右侧 article/source 卡片，不是普通图片。
     - `site/title/description/license/action/usage` 都必须支持 `{en, zh}`；中文页不能出现 `Open project page`、`Reference link only`、`downloadable implementation materials`、`paper record` 这类英文 UI 句子。
     - `zh` 字段必须写成中文用户能直接理解的自然句，例如 `打开项目页面`、`仅作为参考链接；本地图片为重绘，不复制出版方图形。`、`弗赖堡团队的项目页面，提供 U-Net 实现材料下载。`
     - 允许保留通用专名、论文标题、代码仓库名、缩写和模型名（如 GitHub、arXiv、U-Net、Faster R-CNN、DOI），但周围解释文字必须是中文。

#### 2. 底部互动解释区

底部必须是旧 achievement 那种 paper-demo / visual-demo 布局：

- `achievement.visual` 必须映射到非 generic 的 demo renderer。
- 左侧为大 visual/demo，用于展示算法流程、架构、数据流、系统路径或成果可视化。
- 右侧为两个说明盒：
  - 第一个盒子说明文献线索、架构线索、历史线索、实验线索或专家线索。
  - 第二个盒子必须是 `Interaction point` / `互动点`，说明观众可以怎样交互理解该成就。
- 如果没有现成 visual renderer，必须新增 renderer 或使用 `buildImagePaperDemo` / `buildPaperDemo` 风格实现，不要让页面退回到只有一句文字的 generic demo。

#### 3. 右侧文字栏

- `commentarySections` 至少包含 `Historical Background`、`Core Idea`、`Long-Term Legacy`。
- 以上三个 context sections 的英文和中文正文都必须至少 2 个完整句子；不要只写一句定义或一句影响概述。
- 第一句应交代历史/技术背景或问题，第二句应说明为什么这个成就重要、如何工作、或它和相邻 AI 成就的关系。
- `Long-Term Legacy / 长期影响` 必须说明专家如何评价该成就，不能只写普通影响描述。
- 推荐包含类似句式：`Experts generally treat...` / `专家通常把/认为...`。
- 人物/portrait 卡片的 `imageMeta.subcaption` 仍应保持短句，只说明人物与成就的关系（如 `Isomap 主要作者`），不要把这里当作 context 段落。

#### 4. 资料来源

- `achievement.sources` 至少 3 条，推荐 4 条，风格参考旧 achievement。
- 必须包含主论文 / 原始资料。
- 还应补充背景、项目页、人物资料、机构资料、代码、图片来源、历史回顾或官方出版页面等，按该成就实际情况选择。
- 每个 source 必须有 `type`、`label`、`url`，并提供真实 `{en, zh}` 双语文字。
- 不要只放一条论文链接。

#### 5. Quiz

- 每个新增 AI100 achievement 必须在对应 `archive/events/<event-id>/quizzes.json` 添加 quiz，并由 storyline variant 的 `quizId` 选择。
- Quiz 布局必须匹配旧 achievement 的浏览检查点：左侧相关材料，右侧快速挑战，包含 4 个选项。
- 题目必须简单、清楚，适合普通观众，不要考冷门细节。
- 选项源数据可以保持固定顺序；前端会随机显示答案顺序。
- Quiz 相关材料必须有图片或资料，不要缺图、缺信息。

#### 6. 双语与页面语言

- 所有页面可见字段必须有真实 `{en, zh}` 内容。
- 中文页显示中文，英文页显示英文。
- 不要把英文直接复制到 `zh` 字段，除非是通用专名、缩写或模型名（如 ReLU、LeNet、AlexNet、arXiv）。
- 需要覆盖：`title/description/location/figures/commentarySections/achievement/imageMeta/visualModules/sources/quizzes`。
- 人名在中文页必须用中文译名或中文可读形式：例如 `Kaiming He` 应显示为 `何恺明`，`Shaoqing Ren` 应显示为 `任少卿`。仓库路径、论文标题或机构英文专名可保留，但人物显示名和人物说明不能只用英文。
- `imageMeta.caption/subcaption/sourceName/license/usage` 必须双语；portrait 卡片的中文 caption 应类似 `何恺明肖像`，subcaption 应是一句短关系说明，如 `Faster R-CNN 共同作者`，不要写长段落。
- `achievement.visualModules` 右侧卡片也属于页面可见字段，必须完整本地化 `site/title/description/license/action/usage`。不要出现中英混杂句子，如 `项目 page and downloadable implementation materials from the 弗赖堡 group`。
- 地区索引 / region picker 在中文页必须显示中文，且只显示国家级地区，不显示城市组合，如 `Tokyo, Japan`、`Fukuoka and San Diego`、`Zurich, Switzerland`。地区筛选应使用国家（如 `日本`、`美国`、`瑞士`），不要把城市字符串当作可选地区。
- 中文来源标签也要自然本地化，例如 `ACM Digital Library` → `ACM 数字图书馆`，`MIT Press` → `麻省理工学院出版社`，`Open DOI page` → `打开 DOI 页面`。

#### 7. 生成与验证

- 修改 Archive source 后必须运行 `npm run validate:archive` 与 `npm run generate`。
- 提交或创建 PR 前必须运行 `npm run verify:pr`，确保本地执行与 CI 一致；该命令依次包含 Archive 校验、`npm run lint`、`npm run format:check` 和 `npm test`。
- 新增或大批修改 AI100 achievement 时，运行 `npm run validate:ai100-context`，确保主要 context sections 满足至少两句要求。
- 新增 archive/right-side cards 后，应抽查生成后的 `milestones-data.js`，确认 `visualModules` 的中文字段没有英文 UI 句子残留。
- 若影响启动或页面加载，运行 `npm run validate:startup`。
- 不要手动编辑 `milestones-data.js`；它由生成脚本输出。

#### 8. 人物与首图前置校验

- 所有事件的每个变体都必须维护准确、可追溯的人物列表；变体中的主要人物应排在扩展人物之前。
- 每个 variant 的 `assetIds` 必须按统一展示顺序排列：主要人物或主要团队的真实照片、架构/结构图、其他人物图、其他资料图、解释图。通用机构图标不算主要人物或主要团队照片。
- 首图/首页图以 `overviewImageAssetId` 为准；未配置时取完整详情资源序列 `assetIds` 中的第一张图片。展示层不得按人物、文件类型或媒体角色重新排序剩余图片；仅允许按下一条规则从左侧轮播移除右栏已选中的结构图或解释图。
- 右侧“评论与媒体”只使用 `assetIds` 中第一张架构图或解释图，不得使用肖像、人物图、视频或通用概念卡回退。选中的图片必须从左侧详情图片列表移除，避免重复；没有合适图片时不显示“评论与媒体”卡片。
- 首图如果是人物图，必须对应事件的主要人物；非人物图（论文页、架构图、历史资料、算法解释图等）可以作为首图。
- canonical BenchCouncil AI100 事件必须把 BenchCouncil 根页面贡献者列表完整保留在人物列表前缀中，允许在其后适度扩展；人物显示名必须有真实中文名。
- `npm run validate:archive` 与 `npm run audit:event-figure-rules` 是上述规则的前置校验。新增或修改人物、头像、资源顺序或 `overviewImageAssetId` 后必须先通过它们，再运行生成与其他质量门禁。

### 当前事件（5 分类，21 个）

- **AI创世纪**: 1956-dartmouth, 1957-perceptron, 1969-ai-winter
- **神经网络复兴**: 1986-backpropagation, 1989-cnn, 1986-rnn, 1997-lstm
- **深度学习**: 2012-alexnet, 2014-highway-network, 2015-resnet, 2016-densenet, 2014-gan, 2014-attention, 2017-transformer
- **大模型时代**: 2018-bert, 2018-gpt, 2023-agents, 2025-llm-competition
- **AI for Science**: 2020-alphafold, 2019-ai-feynman, 2024-ai-scientist

## 技术细节

### Three.js 地球

- 相机绕地球飞行（`camCurrent`/`camTarget`），地球本身不旋转
- 页面切换时相机平滑飞向目标坐标，红色标记点闪烁后常亮
- 坐标 `[0, 0]` 为无效占位符，跳过不触发飞行

```javascript
// 经纬度 → 相机角度
phi   = (90 - lat) * (Math.PI / 180)
theta = -lng * (Math.PI / 180)
```

### 管理后台（manage/server.js）

- `GET /admin` — Archive JSON 编辑器，可编辑 event bundles 与已有 storylines
- `GET/POST /api/archive/file` — 读取或保存 Archive JSON
- `GET/POST /api/archive/storyline` — 读取或保存已有 storyline JSON
- `GET /api/archive/figures` — 获取全局人物/实体摘要和 registry revision
- `GET/POST /api/archive/figure` — 读取、新建或更新全局人物/实体；保存时执行 schema 与身份规则校验
- `GET /api/archive/figure-options` — 获取事件与 variant 人物选择器的数据
- `GET /api/archive/figure-usage` — 查询人物在事件、variant 与资产中的反向引用
- `GET /api/archive/figure-assets` — 查询可用于事件头像覆盖的精确关联资产
- `GET /api/archive/figure-audit` — 获取缺失身份、疑似重复、名称漂移、头像冲突、来源不足等结构化审计结果
- `GET /api/archive/figure-merge-preview` 与 `POST /api/archive/figure-merge` — 预览并事务化合并重复身份，改写事件、variant、资产和机构引用
- `POST /api/archive/figure-image` — 将 PNG/JPEG/GIF/WebP 追加到事件人物资源目录，并同步登记 `assets.json`
- `POST /api/archive/validate` — 运行 Archive 校验
- `POST /api/archive/generate` — 受控运行 Archive compiler；不接受任意命令或参数
- 已退役的 Legacy 页面与 API 返回 HTTP 404
- 人物、事件和 storyline 保存响应包含内容 revision；后台使用 revision 拒绝覆盖其他页面已经保存的新版本
- 管理服务没有身份验证，只能用于本机、内网或受保护环境，不得直接暴露端口 3001

### 静态发布边界

- `npm run build:static` 将展示页、两份运行时数据、`shared/`、`resources/`、所需 `public/` 资源和 `.nojekyll` 组装到 `.tmp/static-site/`。
- Docker presentation stage 与 `.github/workflows/pages.yml` 都只发布这个 allowlist 静态包。
- GitHub Pages 工作流会先校验 Archive、生成数据、运行质量门禁并构建 `.tmp/static-site`，再从 `main` 部署。
- `archive/` 源 JSON、`manage/`、`research/`、`scripts/`、候选资料/视频 metadata helper 和 `.tmp/` 产物不进入 Pages/Docker presentation 发布物。

### 注意事项

- VS Code TS 语言服务对中文引号在模板字符串中报误报，Node.js 实际运行正常
- `resources/` 目录为 append-only，不删除已有文件
- 生成的里程碑 ID 格式：`milestone-{key}`（如 `milestone-1956-dartmouth`）
