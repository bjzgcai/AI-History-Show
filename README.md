# AI 历史回顾展览

展厅大屏互动式前端应用，展示人工智能发展的重要里程碑。

## 快速开始

```bash
# 本地预览展示页
python3 -m http.server 8000
# 访问 http://localhost:8000

# 本地运行内容管理服务
node manage/server.js
# 访问 http://localhost:3001/admin
```

> **安全提示**：管理服务（端口 3001）无认证保护，仅供本地使用，**切勿直接暴露到公网**。生产环境请通过 SSH 隧道或 Nginx Basic Auth 访问，详见 [DEPLOYMENT.md](DEPLOYMENT.md)。

云服务器部署（Nginx + PM2）、Gitee Pages 托管、SSH 隧道访问管理后台等详见 [DEPLOYMENT.md](DEPLOYMENT.md)。

---

## 内容管理工作流

### 方式 A：可视化管理页面（推荐）

```bash
node manage/server.js
# 访问 http://localhost:3001/admin
```

在浏览器中直接编辑分类、事件内容，点击「保存」后再点「▶ 应用数据」即可。

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
      name: "AI创世纪 (1950s-1970s)",   // 完整分类名
      subtitle: "AI创世纪",              // 页面显示用的短标题
      events: [
        "1956-dartmouth",               // 事件 key，需在 events.js 中存在
        "1957-perceptron",
        "1969-ai-winter",
      ]
    },
    // ... 更多分类
  ]
};
```

**当前分类（5个，共21个事件）：**

| 分类 | 事件数 | 时间跨度 |
|------|--------|---------|
| AI创世纪 | 3 | 1950s–1970s |
| 神经网络复兴 | 4 | 1980s–2000s |
| 深度学习与范式归一 | 7 | 2010s–2020s |
| 大模型时代 | 4 | 2020s–今 |
| AI for Science | 3 | 2018–今 |

---

### 文件 B：`manage/events.js` — 事件内容

每个事件 key 对应一个完整的内容对象：

```javascript
module.exports = {
  "1956-dartmouth": {
    year: 1956,
    title: "达特茅斯会议",

    location: {
      name: "达特茅斯学院",
      country: "美国，新罕布什尔州",
      coordinates: [43.7044, -72.2887]   // [纬度, 经度]
    },

    description: `详细描述文字，支持 HTML 标签。`,

    figures: [
      { name: "John McCarthy", role: "会议发起人" },
      { name: "Marvin Minsky", role: "联合发起人" }
    ],

    commentaryVideo: "评论视频 URL（.mp4 格式）",

    quoteText: "引言正文\n支持换行（\\n 会转为 <br>）",
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
| `title` | string | 事件标题 |
| `location` | object | 地点名、国家、经纬度坐标 |
| `description` | string | 详细描述，支持 HTML |
| `figures` | array | 关键人物列表 `[{name, role}]` |
| `commentaryVideo` | string | 讲解视频 URL（.mp4） |
| `quoteText` | string | 引言文字，`\n` 自动转 `<br>` |
| `quotePage` | string | 引言来源/归属 |
| `images` | array | 图片相对路径列表 |
| `videos` | array | YouTube 视频 ID 列表（需有对应 JSON 元数据） |

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
├── index.html                   # 主展示页面（Three.js 地球 + 里程碑展示）
│
├── milestones-data.js           # ⚠️ 自动生成，请勿手动编辑（generate.js 输出）
├── milestones-data-default.js   # 默认兜底数据（generate.js 失败时自动回退）
│
├── manage/                      # 内容管理目录
│   ├── catalog.js               # 文件A：分类与事件目录
│   ├── events.js                # 文件B：每个事件的详细内容
│   ├── generate.js              # 生成脚本（无依赖，直接运行）
│   ├── server.js                # 可视化管理服务器（node manage/server.js）
│   └── admin.html               # 管理页面（由 server.js 提供）
│
├── resources/
│   ├── images/                  # 事件图片（按事件 key 分文件夹）
│   └── videos/                  # YouTube 视频元数据 JSON（每个事件一个文件）
│
├── DEPLOYMENT.md                # 部署指南（Nginx / Gitee Pages）
└── README.md                    # 本文件
```

---

## 功能特性

- **3D 地球**：Three.js 渲染，自动定位到当前事件的地理坐标
- **页面切换**：按钮或键盘方向键（`←` / `→`）
- **视频播放**：内嵌 YouTube 视频 + 本地讲解视频
- **图片浏览**：点击进入全屏，支持左右切换（`←` / `→` / `Esc`）
- **响应式**：适配大屏（4K/2K/1080p）与移动端

---

## 技术栈

- **纯前端**：HTML5 + CSS3 + JavaScript ES6+，无构建工具，无 npm 依赖
- **Three.js**（CDN 加载）：3D 地球渲染
- **Node.js**（仅用于内容生成脚本）：运行 `manage/generate.js`

---

## 许可证

Apache License 2.0