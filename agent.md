# AI-History-Show

交互式 AI 历史展览大屏应用。纯前端（HTML5 + Vanilla JS + Three.js 3D 地球），无构建工具、无前端 npm 依赖。Node.js 只用于内容生成与管理后台。

详细使用说明、字段表、部署方式见 [README.md](README.md)（English）/ [README.zh.md](README.zh.md)（中文）与 [DEPLOYMENT.md](DEPLOYMENT.md)。

## 入口

- `index.html` — 自适应入口，按视口切换单屏/移动端/双屏
- `dual-screen.html` — 双屏固定入口
- 强制模式：URL 加 `?layout=single` 或 `?layout=dual`

## 数据流（重要）

```text
archive/storylines/*.json ─┐
archive/events/*/          ├─→ npm run validate:archive ─→ npm run generate
resources/                 ┘                              ├─→ milestones-data.js
                                                           └─→ milestones-data-default.js
```

- **两份 `milestones-data*.js` 都自动生成，禁止手动编辑**。
- 内容、来源、资源、quiz 和 variant 写入 `archive/events/*`；storyline 成员、顺序和展示 ID 写入 `archive/storylines/*.json`。
- `manage/catalog.js`、`manage/events.js`、`manage/figure-avatars.js` 和 `manage/generate.js` 仅供 Legacy rollback/comparison/migration 使用，不是生产输入。
- 可见文本字段使用 `{ zh, en }`，缺失语言会回退。

## i18n

- 字典与切换逻辑：`shared/i18n.js`
- 默认中文；当前语言存在 `localStorage` 的 `ai-history-locale`
- 新增 UI 文案时，需要同时补 `en` 和 `zh` 两个字典条目

## 管理后台

```bash
npm run start:admin   # http://localhost:3001/archive-admin
```

- 无认证，仅供本地或受保护环境使用，切勿暴露公网。
- `/archive-admin` 可编辑 Archive event bundles 和已有 storylines；保存后显式运行 validation 与 `npm run generate`。
- `/admin` 是 Legacy 只读参考页，Legacy mutation endpoints 返回 HTTP 403。

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
