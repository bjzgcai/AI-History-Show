# AI-History-Show 项目指南

## 项目概述

交互式AI历史展览大屏应用。

- **技术栈**: HTML5 + CSS3 + Vanilla JS + Three.js（3D地球）
- **主入口**: `index.html`（Three.js地球 + 里程碑展示）
- **数据文件**: `milestones-data.js`（由 `manage/generate.js` 生成，勿手动编辑）

## 文件结构

```
AI-History-Show/
├── index.html                   # 主展示页
├── milestones-data.js           # 生成的数据（勿手动编辑）
├── milestones-data-full.js      # 原始手工数据（仅供参考）
├── resources/
│   ├── images/                  # 里程碑图片（23个文件夹，~35MB，append-only）
│   └── videos/                  # 视频元数据 JSON（18个文件，append-only）
├── manage/
│   ├── catalog.js               # ✏️ 分类与展示顺序配置
│   ├── events.js                # ✏️ 各事件内容
│   ├── generate.js              # 生成脚本
│   ├── server.js                # 管理后台服务
│   └── admin.html               # 管理界面
├── DEPLOYMENT.md                # 部署指南
└── AGENTS.md                    # 本文档
```

## 内容管理工作流

**只需编辑两个文件**，然后运行生成脚本：

```bash
# 编辑 manage/catalog.js（分类/顺序）或 manage/events.js（事件内容）
node manage/generate.js
# → 重新生成 milestones-data.js
```

### 数据结构（events.js）

每个事件 key（如 `"1956-dartmouth"`）包含：

| 字段 | 说明 |
|------|------|
| `year`, `title` | 年份、标题 |
| `location` | `{name, country, coordinates: [lat, lng]}` |
| `description` | 正文描述 |
| `figures` | `[{name, role}]` |
| `quoteText` / `quotePage` | 引用文字（`\n` → `<br>`）/ 出处 |
| `commentaryVideo` | 解说视频 mp4 URL |
| `images` | 相对路径数组 |
| `videos` | `[{id, title, channel, duration}]`，YouTube 视频 |

### AI100 页面布局 schema

BenchCouncil AI100 achievement 页面必须满足固定网页布局：

- 顶部三联视觉区：
  1. `images[0]` 为相关科学家 / 人物 / 团队 / 机构照片。
  2. `images[1]` 为成就本身的 visualization / architecture / algorithm explainer。
  3. `achievement.visualModules[0]` 为相关文章、论文、项目页或档案页卡片（`type: "archiveLink"`）。
- 底部互动解释区：
  - `achievement.visual` 必须映射到非 generic 的 demo renderer。
  - 左侧为大 visual/demo。
  - 右侧为两个说明盒；第二个说明盒必须是 `Interaction point` / `互动点`。
- 右侧文字栏：
  - `commentarySections` 至少包含 `Historical Background`、`Core Idea`、`Long-Term Legacy`。
  - `Long-Term Legacy / 长期影响` 必须说明专家如何评价该成就，建议包含 “Experts generally treat...” / “专家通常...”。
- 双语：
  - 所有页面可见字段必须有真实 `{en, zh}` 内容。
  - 不要把英文直接复制到 `zh` 字段，除非是通用专名、缩写或模型名（如 ReLU、LeNet、AlexNet、arXiv）。

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

- `GET /api/generate/diff` — 预览变更（对比 manage/ 与已生成的 milestones-data.js）
- `POST /api/generate` — 执行生成
- `POST /api/events` — 保存 events.js（写入前同步 YouTube 视频到 resources/videos/{key}.json）

### 注意事项

- VS Code TS 语言服务对中文引号在模板字符串中报误报，Node.js 实际运行正常
- `resources/` 目录为 append-only，不删除已有文件
- 生成的里程碑 ID 格式：`milestone-{key}`（如 `milestone-1956-dartmouth`）
