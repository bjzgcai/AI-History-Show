# `resources/` 在 archive preview / archive-native 模式下的保留范围

本文档记录当前 archive preview 与 archive-native 生成路径对 `resources/` 的实际依赖，并区分运行时静态资产、legacy 生成辅助数据和当前未发现引用的文件。

检查基线：2026-07-14。当前 archive JSON 中共有 491 处 `resources/` 引用、294 个唯一资源路径；修正 AlphaGo 缺失 MP4 后，这些路径均应存在。

## 两条生成路径

### Archive preview / archive-native

以下命令从 archive storyline 和 event bundle 读取展示内容：

```bash
npm run preview:archive-data
npm run generate:archive-native-preview
npm run generate:archive
```

资源引用来自：

```text
archive/storylines/*.json
archive/events/<event-id>/event.json
archive/events/<event-id>/assets.json
archive/events/<event-id>/variants/<storyline>.json
archive/events/<event-id>/quizzes.json
```

其中 `npm run generate:archive` 直接写入 `milestones-data.js` 和 `milestones-data-default.js`，不读取 legacy milestones 作为 scaffold。

### Legacy-compatible generator

默认的 `npm run generate` 仍读取 `manage/` 与部分 legacy resource helper。只要该生成路径和本地 admin 仍保留，就不能删除这些辅助文件。

## 必须保留：archive 内容直接引用

### `resources/images/bench-council-ai100/`

必须保留。当前 archive 引用最集中，涵盖 AI100 人物图、解释图和来源截图：

```text
resources/images/bench-council-ai100/photos/
resources/images/bench-council-ai100/explainers/
resources/images/bench-council-ai100/source/
```

### `resources/images/<event-id>/`

必须保留。deep-learning 与 fused events 的 archive assets、variant 人物卡和 demo 字段仍引用这些目录：

```text
resources/images/1956-dartmouth/
resources/images/1957-perceptron/
resources/images/1969-ai-winter/
resources/images/1986-backpropagation/
resources/images/1986-rnn/
resources/images/1989-cnn/
resources/images/1997-lstm/
resources/images/2012-alexnet/
resources/images/2014-attention/
resources/images/2014-gan/
resources/images/2014-highway-network/
resources/images/2015-resnet/
resources/images/2016-densenet/
resources/images/2017-transformer/
resources/images/2018-bert/
resources/images/2018-gpt/
resources/images/2019-ai-feynman/
resources/images/2020-alphafold/
resources/images/2023-agents/
resources/images/2024-ai-scientist/
resources/images/2025-llm-competition/
```

### `resources/images/figures/`

必须保留。人物卡 presentation data 已迁入 archive variants，当前 archive 仍直接引用该目录中的头像和历史人物裁剪图。

### `resources/videos/game-evolution/`

必须保留。当前 archive gaming variants 使用：

```text
resources/videos/game-evolution/sample-go-game.gif
```

它既是实际播放 URL，也是 fallback。真实事件 MP4 尚未生成；在文件存在之前，不得把 `url` 改回 `resources/videos/game-evolution/<event-id>.mp4`。

## 必须保留：前端 UI 直接引用

以下资源不一定出现在 archive JSON 中，但由 `index.html`、`dual-screen.html` 或共享前端代码直接使用：

```text
resources/images/figma-globe.png
resources/images/ui/ai100-pop-quiz-qr-v2.svg
resources/images/ui/brand.png
resources/textures/clouds.png
resources/textures/earth-topology.png
resources/textures/earth-water.png
```

因此不能只依据 archive `assets.json` 删除 UI、地球或纹理资源。

## Archive-native 不需要，但 legacy/admin 仍需要

以下文件不是 archive-native 展示数据源：

```text
resources/quote-candidates.js
resources/research-candidates.js
resources/videos/*.json
```

但目前仍由 legacy generator 或 admin 使用：

- `manage/generate.js` 读取 quote/research candidates 和视频 metadata；
- `manage/server.js` 与 `manage/admin.html` 使用 quote candidates，并会维护 `resources/videos/{key}.json`；
- 默认 `npm run generate` 仍走该兼容链路。

结论：它们可以从 archive-native 运行时依赖清单中排除，但现在不能从仓库删除。只有默认 generator 和 admin 编辑流程也切换到 archive authority 后，才能退休。

## `resources/papers/` 的状态

`resources/papers/` 下的本地 PDF 目前不是 archive-native JSON 的直接资源引用，但仍由 `manage/gaming-extra-events.js` 使用：

```text
resources/papers/1997-logistello-statistical-feature-combination.pdf
resources/papers/2000s-alphacat-comparison-training-chinese-chess.pdf
resources/papers/2017-alphazero-self-play.pdf
resources/papers/2019-muzero-learned-model.pdf
resources/papers/2019-suphx-mahjong-deep-rl.pdf
```

因此其状态与 legacy helpers 相同：archive-native 展示不依赖，legacy-compatible 内容链路仍依赖，暂时保留。

## 当前未发现精确引用

全仓库静态路径扫描中，当前唯一未发现精确文本引用的 resource 文件是：

```text
resources/videos/urls.txt
```

这不等于授权删除：`resources/` 按项目规则视为 append-only。若以后要清理，应先人工检查文件内容、来源和是否属于人工维护清单，再单独批准删除。

## 缺失 MP4 的处理原则

此前多个 gaming variants 使用了尚不存在的本地 MP4。当前应满足：

```text
visualModules[].url        -> 已存在的 sample-go-game.gif
visualModules[].fallbackUrl -> 已存在的 sample-go-game.gif
```

同时保留 `sourceSgf`、`generator`、`poster`、`duration`、`fps` 等字段，表示未来可以用真实生成的视频替换。替换步骤应是：

1. 先生成并提交真实 MP4；
2. 再把对应 variant 的 `url` 改为该 MP4；
3. 保留 GIF fallback；
4. 运行 archive 引用检查与展示验证。

## 修改后检查

资源引用调整后至少运行：

```bash
npm run validate:archive
npm run preview:archive-data
npm run generate:archive-native-preview
npm run diff:archive-native
```

如果需要更新实际运行数据，再运行：

```bash
npm run generate:archive
npm run validate:startup
```

如果涉及 legacy-compatible generator 或 admin，再运行：

```bash
npm run generate
npm test
```
