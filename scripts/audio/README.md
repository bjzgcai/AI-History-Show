# Audio tooling

本目录包含 AI-History-Show 的音频策划、文稿编译、TTS、媒体规范化、revision 评审和发布脚本。
内容配置与来源 turns 位于仓库根目录 `audio/`。生成资产和派生 manifest 暂存于
`resources/audio/`，该目录不进入 Git，后续由对象存储统一管理。

## 推荐入口

日常工作统一使用 `audio-pipeline.mjs`，完整操作说明见
[`docs/audio-workflow.md`](../../docs/audio-workflow.md)：

```bash
npm run audio:status
npm run audio:workflow -- source-check-all
npm run audio:workflow -- generate audio/revisions/<revision>.json
npm run audio:workflow -- activate audio/revisions/<revision-a>.json audio/revisions/<revision-b>.json
npm run audio:review
npm run audio:release -- verify
```

流程关系：

```text
audio/revisions/*.json
        |
        v
build-audio-revision.mjs
        |
        v
generate-audio-revision.mjs
        |
        +--> generate-dialogue-audio.mjs --> Seed-TTS / CosyVoice / SAG
        |
        v
validate-audio-revision.mjs
        |
        v
build-audio-review-page-data.mjs
```

`source-check` 只检查配置、turns、Archive 故事线成员和 source/claim 引用，不需要本地 MP3。
`generate` 会先编译 revision，再调用 TTS、使用 FFmpeg 规范化响度和媒体格式，最后执行校验。
本地音频输出为 append-only；修改文稿、音色或参数时必须创建新的 `revisionId`，不能覆盖旧
MP3。`resources/audio/` 中的 MP3、overlay、质量报告和资源映射均不得提交到 Git。

同一事件进入多个故事线时，可将已发布音频复用到所有启用 variant：

```bash
npm run audio:release -- archive-sync-originals --link-shared-variants --apply
```

该选项只复用已有 audio asset ID，不复制 MP3 或创建新的 S3 对象。

`archive-sync-originals` 是发布工作站命令，不是 CI 或全新 checkout 可直接复现的命令。
它会读取 Git 忽略的 `resources/audio/generated/**/overlay.json` 与对应本地 MP3，以确认发布键、
时长和来源后再更新 Archive。运行该命令前必须先恢复或生成 README 中列出的完整原版批次；
普通校验、构建和测试不依赖这些本地发布资产。

## Revision 脚本

| 文件                               | 职责                                                       |
| ---------------------------------- | ---------------------------------------------------------- |
| `audio-pipeline.mjs`               | 统一编排 `build/generate/validate/check/activate/review`   |
| `check-audio-workflow-status.mjs`  | 审计 Git 源码、生成物、审听数据、Archive 与公开 S3 状态    |
| `build-audio-revision.mjs`         | 校验来源 turns，编译 TTS 文本和 revision plan              |
| `generate-audio-revision.mjs`      | 调用对话 TTS、规范化 MP3、生成 overlay                     |
| `validate-audio-revision.mjs`      | 校验 turns、音频文件、时长、格式、响度和峰值               |
| `build-audio-review-page-data.mjs` | 从激活的 revision overlay 与已跟踪 turns 生成审听台数据    |
| `sync-original-audio-release.mjs`  | 将四条启用故事线的双语原版批次关联到 Archive 与 OSS 发布键 |
| `generate-dialogue-audio.mjs`      | 底层 A/B/N/Summary 多角色 TTS 工具                         |
| `lib/audio-revision.mjs`           | revision 路径、配置加载和文本编译公共函数                  |

## 完整原版批次

`build-complete-original-revisions.mjs` 维护当前启用故事线的可复现原版 turns：

- AI Achievements 第 11–139 项；
- AI 棋牌全部事件；
- `deep-learning` 中尚未由前两条故事线覆盖的 10 个事件；
- `humanistic-cycle` 全部 12 个事件。

后一组 revision 配置位于 `audio/revisions/deep-learning-remaining-original-*.json` 与
`audio/revisions/humanistic-cycle-original-*.json`。事件清单固定写入构建器，不依赖 Archive 当前是否
已经关联音频，因此发布后仍能复现同一批文稿。已有 revision turns 视为冻结内容：构建器只会创建
缺失文件或校验相同内容；如果 Archive 变化导致内容不同，它会拒绝覆盖，必须创建新的 revision ID。

## 历史基线批次

以下脚本维护最初的 AI100 前 40 项与 AI 棋牌双语基线批次。它们用于复现和审计，不是新增
revision 的首选入口：

| 阶段       | 构建脚本                          | 校验或后续脚本                                                        |
| ---------- | --------------------------------- | --------------------------------------------------------------------- |
| 编辑计划   | `build-audio-editorial-plan.mjs`  | `validate-audio-editorial-plan.mjs`                                   |
| 文稿编译   | `build-audio-story-scripts.mjs`   | `validate-audio-story-scripts.mjs`、`dry-run-audio-story-scripts.mjs` |
| 音频生成   | `generate-audio-story-assets.mjs` | `validate-audio-story-assets.mjs`                                     |
| 试听与发布 | `audit-audio-story-samples.mjs`   | `finalize-audio-story-release.mjs`                                    |

对应 npm 命令使用 `audio:legacy:*` 前缀，新 revision 不得使用这些入口。

## 运行要求

- Node.js 22 或更高版本；
- `ffmpeg` 与 `ffprobe` 在 `PATH` 中；
- TTS 凭据由 revision 配置的 `provider.envFile` 指向，密钥值不得写入仓库；
- 默认 Seed-TTS 凭据文件为 `/home/ubuntu/.openclaw/workspace/.secrets/tts.env`；
- 生成前先运行 `check` 或 `build`，生成后必须运行 `validate`；
- 多个候选可同时进入审听台，但每个事件、语言和模式最终只能批准一个版本。

## 审听台

审听台源码位于 `tools/audio-review-console/`，HTML、CSS 和 JavaScript 进入 Git。运行
`npm run audio:workflow -- activate ...` 会写入本地的 `active-overlays.json`，随后根据 overlay
中的 `revisionId` 回查 `audio/revisions/*.json`、对应冻结 turns 和 Archive 事件资料，生成
`review-data.json`。这两个 JSON 以及浏览器审查截图均为派生产物，不提交到 Git。

审听数据不再读取旧 AI100 基线目录、release manifest 或历史质量报告；某个 revision 只包含
一种语言时，审听台只会在该语言筛选下展示对应事件。

当一个已激活故事线的事件没有直接 overlay 时，构建器会检查该 variant 引用的 audio asset，
并通过 `storage.sourcePath` 精确匹配其他已激活 revision 的音频。匹配成功后，审听台复用同一
音频和 turns，但保留目标故事线自己的顺序、标题、variant 与相邻事件关系。
