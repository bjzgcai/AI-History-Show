# AI 历史回顾展览

[English](README.md) | **简体中文**

展厅大屏互动式前端应用，展示人工智能发展的重要里程碑。支持中英文双语切换，并能在单屏、移动端、双屏布局之间自动适配。

## 代码仓库

- Gitee：`ssh://git@z.gitee.cn:223/zgca/AI-History-Show.git`
- GitHub：`git@github.com:bjzgcai/AI-History-Show.git`

## 快速开始

```bash
# 按锁文件安装依赖
npm ci

# 本地预览展示页
npm run start:static
# 访问 http://localhost:8000

# 展厅本机演示服务入口
npm run start:demo

# 校验生成数据、测试和启动路径
npm run validate:deployment

# 运行完整质量门禁（lint + format check + tests）
npm run quality

# 本地运行内容管理服务
npm run start:admin
# 访问 http://localhost:3001/admin
```

容器化预览：

```bash
docker build -t ai-history-show .
docker run --rm -p 8000:8000 ai-history-show

# 或用 Compose 启动 Nginx 展示服务
docker compose up --build

# 需要本地管理服务时启用 admin profile
docker compose --profile admin up --build
```

> **安全提示**：管理服务（端口 3001）无认证保护，仅供本地使用，**切勿直接暴露到公网**。生产环境请通过 SSH 隧道或 Nginx Basic Auth 访问，详见 [DEPLOYMENT.md](DEPLOYMENT.md)。

云服务器部署（Nginx + PM2）、静态托管、SSH 隧道访问管理后台等详见 [DEPLOYMENT.md](DEPLOYMENT.md)。

## 国际化（i18n）

展览内置中英文双语支持：

- 语言字典与运行时切换逻辑：[shared/i18n.js](shared/i18n.js)
- 默认语言为中文；当前语言通过 `localStorage` 持久化，键名为 `ai-history-locale`
- 单屏和双屏布局都内置语言切换按钮
- 里程碑文本字段（标题、描述、引言等）支持双语对象 `{ zh: "...", en: "..." }`；缺失语言会自动回退

撰写内容时，同一事件中可以混用纯字符串（默认按中文处理）和双语对象，`manage/generate.js` 在生成阶段会统一规范化为最终的 `milestones-data.js`。

## 质量门禁

在提交 Pull Request 或合并改动前，请运行：

```bash
npm ci
npm run quality
npm run validate:deployment
```

质量门禁会依次运行 ESLint、Prettier 格式检查，以及现有的 Node.js 校验脚本。部署验证会重新生成里程碑数据、运行测试、启动展示页和管理服务；CI 还会构建 Docker 镜像并校验 Compose 配置。

后续优先补充测试覆盖的模块：

- `manage/generate.js`：生成后的里程碑数据结构、引言选择、视频查找、缺失资源警告。
- `shared/milestone-view.js`：多语言渲染兜底逻辑，以及媒体元数据规范化。
- `manage/server.js`：`/api/generate/diff`、`/api/events`，以及图片/视频元数据规范化。

## 代码同步

默认的 `origin` 远端指向 GitHub（主分支 `main`）：

```bash
git status --short
git add <files>
git commit -m "描述本次改动"
git push origin main
```

如果本地还配置了 Gitee 远端（例如 `git remote add gitee ssh://git@z.gitee.cn:223/zgca/AI-History-Show.git`），用 `git push gitee master` 同步——Gitee 主分支为 `master`。规范的远端配置见 [DEPLOYMENT.md](DEPLOYMENT.md)。

## 展厅双屏演示

- 自适应入口：`http://localhost:8000/`
- `index.html` 会根据当前浏览器视口自动切换到单屏/移动端或双屏布局
- 双屏固定入口：`http://localhost:8000/dual-screen.html`
- 如需手动强制模式，可在 URL 后追加 `?layout=single` 或 `?layout=dual`
- Windows 现场演示推荐先用 `msedge --app="http://localhost:8000/dual-screen.html"` 验证页面，再根据显卡控制软件决定是否合成超宽屏后进入 `F11` 或 `--kiosk`
- 多显示器全屏演示、Edge app/kiosk、Intel/NVIDIA 合屏、DisplayFusion 限制等详细说明见 [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 内容管理工作流

### 方式 A：可视化管理页面（推荐）

```bash
node manage/server.js
# 访问 http://localhost:3001/admin
```

在浏览器中直接编辑分类、事件内容，点击「保存」后再点「▶ 应用数据」即可。管理页面会保留双语字段，并在保存时写回 `manage/events.js`。

### 方式 B：直接编辑文件 + CLI

> 修改配置文件 → 运行脚本 → 刷新浏览器

```
manage/catalog.js   ─┐
                      ├─→  node manage/generate.js  ─→  milestones-data.js
manage/events.js    ─┘
resources/videos/   ─┘
```

```bash
node manage/generate.js
```

无需安装任何依赖，直接运行。若脚本运行失败（或尚未运行），页面会自动回退至 `milestones-data-default.js`。输出示例：

```
✓ 生成完成：milestones-data.js
  共 5 个分类，21 个事件
```

---

### 文件 A：`manage/catalog.js` — 展示目录

控制**展示哪些分类、哪些事件、以及展示顺序**。

```javascript
module.exports = {
  categories: [
    {
      // name 和 subtitle 都是双语对象
      name: {
        en: "Genesis of AI (1950s-1970s)",   // 完整分类名
        zh: "AI创世纪 (1950s-1970s)"
      },
      subtitle: {
        en: "Genesis of AI",                  // 页面显示用的短标题
        zh: "AI创世纪"
      },
      events: [
        "1956-dartmouth",                     // 事件 key，需在 events.js 中存在
        "1957-perceptron",
        "1969-ai-winter"
      ]
    },
    // ... 更多分类
  ]
};
```

**当前分类（4个，共21个事件）：**

| 分类 | 事件数 | 时间跨度 |
|------|--------|---------|
| AI创世纪 | 3 | 1950s–1970s |
| 神经网络复兴 | 4 | 1980s–2000s |
| 深度学习与范式归一 | 7 | 2010s–2020s |
| 大模型与科学智能 | 7 | 2018–2025 |

---

### 文件 B：`manage/events.js` — 事件内容

每个事件 key 对应一个完整的内容对象。文本字段既可以是纯字符串（默认按中文处理），也可以是双语对象 `{ zh, en }`：

```javascript
module.exports = {
  "1956-dartmouth": {
    year: 1956,
    title: { zh: "达特茅斯会议", en: "Dartmouth Workshop" },

    location: {
      name: { zh: "达特茅斯学院", en: "Dartmouth College" },
      country: { zh: "美国，新罕布什尔州", en: "Hanover, New Hampshire, USA" },
      coordinates: [43.7044, -72.2887]   // [纬度, 经度]
    },

    description: { zh: `中文详细描述，支持 HTML。`, en: `English description, HTML allowed.` },

    figures: [
      { name: "John McCarthy", role: { zh: "会议发起人", en: "Workshop organizer" } },
      { name: "Marvin Minsky", role: { zh: "联合发起人", en: "Co-organizer" } }
    ],

    commentaryVideo: "评论视频 URL（.mp4 格式）",

    quoteText: { zh: "引言正文或核心要点\n支持换行", en: "Quote text or key idea\nNewlines become <br>" },
    quoteKind: "quote", // 或 "keyIdea"；AI100 条目使用 "quote" 前必须完成来源核验
    quotePage: "— 引用来源",

    images: [
      "resources/images/1956-dartmouth/photo1.jpg",
    ],

    videos: ["dQw4w9WgXcQ"],   // YouTube 视频 ID，需在 resources/videos/ 中有对应 JSON
  },

  // ... 更多事件
};
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `year` | number | 年份 |
| `title` | string \| `{zh, en}` | 事件标题 |
| `location` | object | 地点名、国家、经纬度坐标 |
| `description` | string \| `{zh, en}` | 详细描述，支持 HTML |
| `figures` | array | 关键人物列表 `[{name, role}]` |
| `commentaryVideo` | string | 讲解视频 URL（.mp4） |
| `quoteText` | string \| `{zh, en}` | 已核验引言文字或核心要点，`\n` 自动转 `<br>` |
| `quoteKind` | `"quote"` \| `"keyIdea"` | 可选展示语义；AI100 使用 `"quote"` 前必须核验原文来源 |
| `quotePage` | string | 引言来源/归属 |
| `images` | array | 图片相对路径列表 |
| `videos` | array | YouTube 视频 ID 列表（需有对应 JSON 元数据） |

---

### 人物头像：`manage/figure-avatars.js`

人物头像注册表，集中维护章节中出现的人物头像。每个条目把人物姓名映射到本地头像图片以及可选元信息：

```javascript
"Alec Radford": {
  type: "person",
  status: "ready",
  wikipediaTitle: "",
  avatar: "resources/images/figures/alec-radford.png",
  note: "沿用 GPT 章节现有头像，后续可继续补充更明确的来源备注。"
}
```

`manage/generate.js` 会在生成时读取该注册表为事件补全头像。如需审计哪些人物缺少头像或备注，可运行：

```bash
node scripts/report-figure-avatars.js
# 输出：manage/figure-avatar-report.md
```

---

### 视频元数据：`resources/videos/{key}.json`

每个事件的 YouTube 视频元数据单独存放，格式：

```json
{
  "candidate_videos": [
    {
      "id": "dQw4w9WgXcQ",
      "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "embed_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "title": "视频标题",
      "channel": "频道名",
      "duration": "10:23",
      "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      "source": "YouTube"
    }
  ]
}
```

生成脚本会按 `events.js` 中的视频 ID 从对应 JSON 中查找并写入输出。

---

## 文件结构

```
AI-History-Show/
├── index.html                   # 自适应入口（Three.js 地球 + 里程碑展示）
├── dual-screen.html             # 双屏固定入口
│
├── milestones-data.js           # ⚠️ 自动生成，请勿手动编辑（generate.js 输出）
├── milestones-data-default.js   # 默认兜底数据（generate.js 失败时自动回退）
│
├── manage/                      # 内容管理目录
│   ├── catalog.js               # 文件A：分类与事件目录
│   ├── events.js                # 文件B：每个事件的详细内容
│   ├── figure-avatars.js        # 人物头像注册表
│   ├── generate.js              # 生成脚本（无依赖，直接运行）
│   ├── server.js                # 可视化管理服务器（node manage/server.js）
│   └── admin.html               # 管理页面（由 server.js 提供）
│
├── shared/                      # 单屏/双屏共用前端逻辑
│   ├── i18n.js                  # 双语字典与运行时语言切换
│   ├── milestone-view.js        # 里程碑渲染
│   ├── layout-router.js         # 单/双屏自适应路由
│   ├── swipe-navigation.js      # 触摸滑动翻页
│   └── utils.js
│
├── scripts/                     # 本地校验与报告脚本
│   ├── test-layout-router.js
│   ├── test-swipe-navigation.js
│   └── report-figure-avatars.js
│
├── resources/
│   ├── images/                  # 事件图片（按事件 key 分文件夹）
│   └── videos/                  # YouTube 视频元数据 JSON（每个事件一个文件）
│
├── DEPLOYMENT.md                # 部署指南（Nginx / Gitee Pages）
└── README.md                    # 英文版 README（GitHub 默认展示）
```

---

## 功能特性

- **3D 地球**：Three.js 渲染，自动定位到当前事件的地理坐标
- **中英文双语**：随时切换中英文界面，选择会跨会话保留
- **页面切换**：按钮或键盘方向键（`←` / `→`）
- **双屏展陈自动翻页**：`dual-screen.html` 支持"开始/停止自动播放"，默认关闭，开启后每 10 秒循环翻页
- **视频播放**：内嵌 YouTube 视频 + 本地讲解视频
- **图片浏览**：点击进入全屏，支持左右切换（`←` / `→` / `Esc`）
- **响应式**：适配大屏（4K/2K/1080p）与移动端

---

## 技术栈

- **纯前端**：HTML5 + CSS3 + JavaScript ES6+，无构建工具、无前端运行时 npm 依赖
- **Three.js**（CDN 加载）：3D 地球渲染
- **Node.js**（仅用于内容生成脚本）：运行 `manage/generate.js`

---

## 许可证

Apache License 2.0
