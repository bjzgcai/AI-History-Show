# `resources/` 保留与发布边界

`resources/` 是浏览器资产与历史资料的 append-only 目录。清理 Legacy 工具时不删除其中已有文件；是否进入静态发布包由 `scripts/build-static-site.js` 的 allowlist/filter 决定。

## 生产依赖

Archive 内容通过以下位置引用图片、SVG、GIF、视频和论文：

```text
archive/events/<event-id>/assets.json
archive/events/<event-id>/variants/<storyline>.json
archive/events/<event-id>/quizzes.json
index.html
dual-screen.html
shared/
```

重点保留范围包括：

```text
resources/images/bench-council-ai100/
resources/images/<event-id>/
resources/images/figures/
resources/images/ui/
resources/textures/
resources/videos/game-evolution/
resources/papers/
```

`npm run validate:archive` 会检查 Archive 引用；`npm run build:static` 会验证发布包包含运行时需要的关键文件。

## 保留但不发布

以下文件属于已退役 Legacy 内容链路留下的候选资料或 metadata：

```text
resources/quote-candidates.js
resources/research-candidates.js
resources/videos/*.json
resources/videos/urls.txt
```

它们不再被 `manage/server.js`、生产 compiler 或页面运行时读取。由于 `resources/` 的 append-only 规则，文件仍保留在仓库中，但 `npm run build:static` 会将其排除，避免进入 Pages/Docker presentation 发布物。

## 缺失视频的处理原则

Gaming variants 当前可使用已存在的 `resources/videos/game-evolution/sample-go-game.gif` 作为播放地址和 fallback。替换为真实 MP4 时：

1. 先生成并提交真实 MP4；
2. 再更新对应 variant 的 `url`；
3. 保留可用 fallback；
4. 运行 Archive 校验、静态构建和页面测试。

## 修改后检查

```bash
npm run validate:archive
npm run generate
npm run build:static
npm test
```
