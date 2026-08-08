# Audio tooling

本目录包含 AI-History-Show 的音频策划、文稿编译、TTS、媒体规范化、revision 评审和发布脚本。
内容配置与来源 turns 位于仓库根目录 `audio/`。生成资产和派生 manifest 暂存于
`resources/audio/`，该目录不进入 Git，后续由对象存储统一管理。

## 推荐入口

日常 revision 工作只需要使用 `audio-pipeline.mjs`，通过 npm 命令调用：

```bash
npm run audio:revision -- source-check audio/revisions/<revision>.json
npm run audio:revision -- check audio/revisions/<revision>.json
npm run audio:revision -- build audio/revisions/<revision>.json
npm run audio:revision -- generate audio/revisions/<revision>.json
npm run audio:revision -- validate audio/revisions/<revision>.json
npm run audio:revision -- activate audio/revisions/<revision-a>.json audio/revisions/<revision-b>.json
npm run audio:revision -- review
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

## Revision 脚本

| 文件                               | 职责                                                     |
| ---------------------------------- | -------------------------------------------------------- |
| `audio-pipeline.mjs`               | 统一编排 `build/generate/validate/check/activate/review` |
| `build-audio-revision.mjs`         | 校验来源 turns，编译 TTS 文本和 revision plan            |
| `generate-audio-revision.mjs`      | 调用对话 TTS、规范化 MP3、生成 overlay                   |
| `validate-audio-revision.mjs`      | 校验 turns、音频文件、时长、格式、响度和峰值             |
| `build-audio-review-page-data.mjs` | 合并基线音频和候选 overlay，生成审听台数据               |
| `generate-dialogue-audio.mjs`      | 底层 A/B/N/Summary 多角色 TTS 工具                       |
| `lib/audio-revision.mjs`           | revision 路径、配置加载和文本编译公共函数                |

## 历史基线批次

以下脚本维护最初的 AI100 前 40 项与 AI 棋牌双语基线批次。它们用于复现和审计，不是新增
revision 的首选入口：

| 阶段       | 构建脚本                          | 校验或后续脚本                                                        |
| ---------- | --------------------------------- | --------------------------------------------------------------------- |
| 编辑计划   | `build-audio-editorial-plan.mjs`  | `validate-audio-editorial-plan.mjs`                                   |
| 文稿编译   | `build-audio-story-scripts.mjs`   | `validate-audio-story-scripts.mjs`、`dry-run-audio-story-scripts.mjs` |
| 音频生成   | `generate-audio-story-assets.mjs` | `validate-audio-story-assets.mjs`                                     |
| 试听与发布 | `audit-audio-story-samples.mjs`   | `finalize-audio-story-release.mjs`                                    |

对应 npm 命令记录在根目录 `package.json` 和 [`audio/README.md`](../../audio/README.md)。

## 运行要求

- Node.js 22 或更高版本；
- `ffmpeg` 与 `ffprobe` 在 `PATH` 中；
- TTS 凭据由 revision 配置的 `provider.envFile` 指向，密钥值不得写入仓库；
- 默认 Seed-TTS 凭据文件为 `/home/ubuntu/.openclaw/workspace/.secrets/tts.env`；
- 生成前先运行 `check` 或 `build`，生成后必须运行 `validate`；
- 多个候选可同时进入审听台，但每个事件、语言和模式最终只能批准一个版本。
