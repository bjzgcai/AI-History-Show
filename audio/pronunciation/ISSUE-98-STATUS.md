# Issue #98 当前状态

更新日期：2026-09-16

当前分支：`fix/issue-98-audio-pronunciation-glossary`

## 正式方案

生产音频采用以下门禁：

```text
正确 speechForm
+ 精确生成环境资格认证
+ 人工审听代表样本
+ 自动检查覆盖和 generation identity
```

Archive、展示文案和 frozen turn 中的英文专用词保持原样，只在 TTS 临时 speech text 中替换。
Qualification 精确绑定：

```text
term + speechForm + provider + model + locale + voice + instruction SHA-256
```

任一字段变化都必须重新审听。Acoustic detector 只保留为 diagnostic 工具，不作为生成或发布门禁。

## 已完成

- Glossary 共 311 项，音频 turn 中未覆盖候选为 0。
- Compiler 支持最长 alias 优先、精确英文数字词边界、完整 tuple 匹配和阻断未资格化上下文。
- Overlay v2 与 generation identity 记录 glossary hash、资格、替换、排除项和临时 speech text。
- Revision 支持按 `eventId` 或 `eventId:locale` 配置条目级语音指令覆盖。
- Qualification pack 支持中英文 voice profile、复用已有 MP3，并避免一个资格有多条原句时重复生成单词音频。
- 专用词审听台按词聚合多个发音环境，左侧只显示一次，右侧并列展示单词和完整原句。
- 审听台支持逐条审核和“本环境全部通过”，历史审核仍保存在 SQLite。
- XCON v2 单词与中文长期影响原句已于 2026-09-15 人工确认通过，并写入 glossary。
- 已准备中英文正式候选 revision：中文 v2 包含 6 个受影响事件，英文 v2 暂含 5 个已确认事件；中文 XCON 使用已审听的 v2 narrator 指令。

## 当前资格包

审听地址：通过受保护的内部审核入口访问

| 项目           |    数量 |
| -------------- | ------: |
| 左侧专用词     |       6 |
| 精确发音环境   |      16 |
| 可播放样本     | 82 / 82 |
| 已通过样本     | 76 / 82 |
| 待人工审听样本 |       6 |

已全部通过的环境：

- 中文：`SURF` 女声 A、`SURF` 男声 B、`SURF` Summary、`NAS` Narrator、`XCON v2` Narrator、`RoI` 男声 B、`RoIAlign` 男声 B。
- 中文 narrator：`ELIZA`。
- 英文：`SURF` Megan A、`SURF` Alberto B、`SURF` Alberto Summary、`XCON` Alberto Narrator、`RoI` Alberto B、`RoIAlign` Alberto B、`NAS` Alberto Narrator。

新增资格环境：

- 中文 narrator：`ELIZA`，6 个样本已通过（3 条单独专用词、3 条原句整体）。目标读法为
  `Eliza, /ɪˈlaɪzə/`。
- 英文 Alberto narrator：`ELIZA`，6 个样本待审听（3 条单独专用词、3 条原句整体）。

## 当前 Audit

加入 XCON v2 正式候选上下文后，最近一次 compiler audit 为：

```text
32 applied
3 unqualified
1 excluded
```

中文 ELIZA 资格已生效。当前 3 个 `unqualified` 全部来自英文 `1966-eliza` 的 Alberto narrator
环境，等待英文 6 条样本确认；唯一的 `excluded` 是旧 XCON narrator 环境中已知会改变原句的样本。

## 人工审听后的命令

全部环境通过后，已从审核库晋级 qualification：

```bash
npm run audio:pronunciation:promote -- \
  --db /opt/ai-history-test/audio-review/data/reviews.sqlite \
  --write --check
```

随后已清零 audit：

```bash
npm run audio:pronunciation:inventory
npm run audio:pronunciation:audit -- --check
```

正式候选配置：

```text
audio/revisions/issue-98-pronunciation-release-zh-v2.json
audio/revisions/issue-98-pronunciation-release-en-v2.json
```

Audit 清零后生成、验证两个 append-only revision，再运行：

```bash
npm run verify:pr
```

已生成并验证：

- `issue-98-pronunciation-release-zh-v2-2026-09-16`：6 个音频资产通过，包含 `1966-eliza`。
- `issue-98-pronunciation-release-en-v2-2026-09-16`：5 个音频资产通过，暂不包含英文 `1966-eliza`。

审听台当前 active overlay 只使用上述两份 Issue #98 v2 候选，事件音频共 6 个事件：`1966-eliza`
（仅中文）、`1980-xcon-r1`、`ai100-2006-surf`、`ai100-2015-fast-r-cnn`、`ai100-2017-mask-r-cnn`
和 `ai100-2016-nas`（后 5 个均有中英文）。其他旧事件音频已从事件审听索引移除。专用词审听页
仍另外包含中文和英文两组 ELIZA 资格样本；当前正式审计为 `32 applied / 3 unqualified / 1 excluded`，
3 个未资格化项全部是英文 ELIZA 上下文。
