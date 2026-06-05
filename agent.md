# AI-History-Show

交互式 AI 历史展览大屏应用。纯前端（HTML5 + Vanilla JS + Three.js 3D 地球），无构建工具、无前端 npm 依赖。Node.js 只用于内容生成与管理后台。

详细使用说明、字段表、部署方式见 [README.md](README.md)（English）/ [README.zh.md](README.zh.md)（中文）与 [DEPLOYMENT.md](DEPLOYMENT.md)。

## 入口

- `index.html` — 自适应入口，按视口切换单屏/移动端/双屏
- `dual-screen.html` — 双屏固定入口
- 强制模式：URL 加 `?layout=single` 或 `?layout=dual`

## 数据流（重要）

```
manage/catalog.js   ─┐
manage/events.js     ├─→  node manage/generate.js  ─→  milestones-data.js  ─→  前端
manage/figure-avatars.js ─┘
resources/videos/{key}.json
```

- **`milestones-data.js` 自动生成，禁止手动编辑**。生成失败时前端回退到 `milestones-data-default.js`。
- 改内容只动 `manage/catalog.js`（分类与顺序）、`manage/events.js`（事件正文）、`manage/figure-avatars.js`（人物头像注册表）。
- 文本字段支持双语：纯字符串 → 视为中文；或写成 `{ zh, en }`。缺失语言会自动回退。

## i18n

- 字典与切换逻辑：`shared/i18n.js`
- 默认中文；当前语言存在 `localStorage` 的 `ai-history-locale`
- 新增 UI 文案时，需要同时补 `en` 和 `zh` 两个字典条目

## 管理后台

```bash
node manage/server.js   # http://localhost:3001/admin
```

- 无认证，仅供本地使用，切勿暴露公网
- 关键接口：`GET /api/generate/diff`（预览变更）、`POST /api/generate`（执行生成）、`POST /api/events`（保存 events.js，写入前会同步 YouTube 元数据到 `resources/videos/{key}.json`）

## 质量门禁

```bash
npm install
npm run quality   # eslint + prettier check + node 校验脚本
```

GitHub Actions 在 push / PR 时跑同一套命令，提交前请本地先过。

## Git 远端

- `origin` 指向 GitHub，主分支 `main`：`git push origin main`
- 若本地另配 Gitee 远端，主分支为 `master`：`git push gitee master`

## 容易踩的坑

- 坐标 `[0, 0]` 是无效占位符，跳过不触发地球相机飞行
- `resources/` 视为 append-only，不要删除已有图片或视频元数据
- 生成的里程碑 ID 形如 `milestone-{key}`，如 `milestone-1956-dartmouth`
- 相机绕地球飞行（`camCurrent`/`camTarget`），地球本身不旋转；经纬度换算：`phi = (90 - lat) * π/180`，`theta = -lng * π/180`
- VS Code 的 TS 语言服务对模板字符串内的中文引号会误报，Node.js 实际运行无问题
