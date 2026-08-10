# 音频生产与发布流程

本文档是 AI-History-Show 音频流程的唯一主运行手册。音频文稿、音色和表达参数的后续优化
必须创建新 revision，不修改已经冻结并发布的 revision。

## 权威边界

| 层级                              | 权威内容                                         | 是否进入 Git |
| --------------------------------- | ------------------------------------------------ | ------------ |
| Archive                           | 事件事实、来源、variant 与已发布 OSS audio asset | 是           |
| `audio/`                          | revision 配置、冻结 turns、voice profile         | 是           |
| `scripts/audio/`                  | 生成、校验、审听和发布逻辑                       | 是           |
| `resources/audio/`                | plan、编译文稿、overlay、质量报告、MP3           | 否           |
| `tools/audio-review-console/`     | HTML、CSS、JavaScript                            | 是           |
| 审听数据与截图                    | active overlays、review data、截图               | 否           |
| OSS `audio/ai-history/releases/`  | 页面播放的版本化 MP3                             | 对象存储     |
| OSS `audio/ai-history/manifests/` | 私有发布 manifest                                | 对象存储     |

生产页面只读取 Archive 编译出的 OSS URL，不读取本地 MP3、revision、overlay 或 review data。

## 统一入口

所有日常操作通过 `audio:workflow` 执行：

```bash
npm run audio:workflow -- help
npm run audio:status
```

`audio:status` 默认只要求 Git 源码与 Archive 发布配置完整，因此可在全新 checkout 中运行：

```bash
# Git 源码、revision 引用和 Archive/OSS 配置
npm run audio:status

# 额外要求本地 plan、overlay、MP3 和审听数据完整
npm run audio:status -- --strict

# 探测所有公开 OSS release URL
npm run audio:status -- --remote

# 机器可读输出
npm run audio:status -- --json
```

## 1. 来源校验

```bash
# 全量校验，适合 CI 和提交前检查
npm run audio:workflow -- source-check-all

# 单个 revision
npm run audio:workflow -- source-check audio/revisions/<revision>.json
```

该阶段校验 revision schema、turns 数量、故事线顺序、variant、source ID 和 claim ID，不需要
TTS 密钥、FFmpeg 或本地 MP3。

## 2. 生成与媒体校验

```bash
# 只编译 plan、文稿和 turns，不调用 TTS
npm run audio:workflow -- build audio/revisions/<revision>.json

# 编译、调用 TTS、规范化媒体并校验
npm run audio:workflow -- generate audio/revisions/<revision>.json

# 检查源码与已有生成物同步
npm run audio:workflow -- check audio/revisions/<revision>.json

# 只校验已有 MP3、格式、时长、响度和峰值
npm run audio:workflow -- validate audio/revisions/<revision>.json
```

生成输出 append-only。已有 plan、overlay 或 MP3 不会被覆盖；任何内容或参数调整都必须使用
新的 `revisionId`。

## 3. 审听

```bash
# 激活一个或多个候选，并自动重建审听数据
npm run audio:workflow -- activate \
  audio/revisions/<revision-a>.json \
  audio/revisions/<revision-b>.json

# 使用当前 active overlays 重建审听数据
npm run audio:review
```

审听台地址为 `tools/audio-review-console/index.html`。跨故事线共享音频通过 Archive variant
引用的 audio asset `storage.sourcePath` 精确映射，不重复生成或复制 MP3。

审听结果属于发布决策，不改变 revision 历史。每个事件、语言和模式最终只能批准一个候选。

## 4. Archive 关联

当前已发布原版批次可用工作站命令重新核对和关联：

```bash
# 只预览 Archive 修改
npm run audio:release -- archive-sync-originals --link-shared-variants

# 写入 Archive；运行前必须确保对应 overlay 和 MP3 存在
npm run audio:release -- archive-sync-originals --link-shared-variants --apply
```

该命令只用于已有原版批次。未来内容优化产生的新 revision 应在审听批准后新增版本化 OSS object key
和 Archive audio asset，不覆盖旧对象。

## 5. OSS 发布

```bash
# 校验 Archive storage 元数据和本地发布源
npm run audio:release -- check

# 生成本地私有 manifest
npm run audio:release -- manifest

# 查看上传计划
npm run audio:release:dry-run

# 增量上传 MP3，并在全部成功后上传私有 manifest
npm run audio:release -- push

# 使用 checksum、大小、MIME 和缓存 metadata 验证远端对象
npm run audio:release -- verify

# 配置 releases 公开读取和音频 Range/CORS；manifest 保持私有
npm run audio:release -- publish-access
```

凭证只允许来自环境变量、CI Secret 或密钥管理服务。不得写入 Git、Archive、前端代码、
revision plan 或日志。

## 提交门禁

提交音频源码或发布配置前运行：

```bash
npm run audio:workflow -- source-check-all
npm run audio:status
npm run validate:archive
npm run generate
npm run verify:pr
```

发布工作站另外运行：

```bash
npm run audio:status -- --strict --remote
npm run audio:release -- verify
```

## Fresh Checkout 与工作站

全新 checkout 必须能够完成 source-check、Archive 校验、生成运行时数据和项目测试。它不需要
本地 MP3，也不执行 OSS 上传。

发布工作站需要恢复 `resources/audio/` 中与 Archive `storage.sourcePath` 对应的本地文件，安装
FFmpeg，并通过环境注入 TTS/OSS 凭证。`audio:status -- --strict` 用于确认工作站状态完整。

## 历史基线工具

最初 AI100 前 40 项和 AI 棋牌批次使用另一套 plan/script/base/release 流程。相关脚本保留用于
历史复现，但 npm 命令统一使用 `audio:legacy:*` 前缀，不得用于新 revision：

```bash
npm run audio:legacy:plan:build
npm run audio:legacy:plan:validate
npm run audio:legacy:scripts:build
npm run audio:legacy:scripts:validate
npm run audio:legacy:scripts:dry-run
npm run audio:legacy:base:generate
npm run audio:legacy:base:validate
npm run audio:legacy:samples:audit
npm run audio:legacy:release:finalize
```

旧 manifest、报告和基线目录不再是审听台或生产页面的数据来源。
