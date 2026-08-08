# AI100 音频叙事与生成实施方案

> 当前状态：2026-08-07。本文约定 BenchCouncil AI100 故事线的双语科普文稿、故事线连接、TTS 生成和质量验收规则。

## 1. 目标

为正式 AI100 故事线建立一套可批量生产、来源可追溯、形式有变化且连续播放有上下文的中英文音频内容。

每个事件应同时满足：

- 在故事线中播放时内容完整，不依赖机械点名前后事件才能理解；
- 有明确关系时承接其他事件，缺乏关系时使用独立起题；
- 历史事实、人物、数字和技术机制可回溯到 Archive source；
- 中文和英文均为自然表达，而不是机械直译；
- 最终时长控制在 40–150 秒。

## 2. 事件范围与故事线优先级

正式生产只使用以下故事线中启用的事件：

```text
archive/storylines/bench-council-ai100.json
events[].enabled === true
```

默认忽略尚未加入正式故事线的扩展事件，例如：

```text
ai100-2021-clip
ai100-2022-stable-diffusion
```

这些事件的已有草稿可以保留，但不得用于音色测试、正式音频生成或页面接入，除非后续明确要求。

同一 canonical event 可能同时属于多条故事线。为 AI100 生成文稿时：

1. 以 `bench-council-ai100` storyline ref 为入口；
2. 优先读取 `variants/bench-council-ai100.json`；
3. 使用该 variant 选择的 claim、source、人物关系和展示重点；
4. 不使用其他故事线的叙事风格覆盖 AI100 风格；
5. canonical event facts 仍以 `event.json` 为基础事实来源。

## 3. 内容权威与来源规则

事实依据按以下层级读取：

```text
event.json
claims.json
sources.json
variants/bench-council-ai100.json
```

要求：

- 日期、人物、机构、比赛结果、技术机制和数字必须有 source 支撑；
- 跨事件关系需要同时检查两边事件的 sources；
- 人物回响必须核对两个事件的 figures；
- 没有直接因果证据时，只能使用“呼应、对比、延续、成为参照”等表述；
- 不得把推测写成“直接导致、推动、启发”；
- 类比、修辞问题和场景组织可以用于叙事，但不得伪装成历史引语；
- 情景复现若不是逐字档案，必须在文稿 metadata 或来源说明中明确标记。

## 4. 文稿总体结构

每篇文稿按模块组织：

```text
情境引入 → 故事线承接 → 核心故事 → 技术机制或历史转折 → 收尾
```

### 4.1 情境引入

可使用：

- 问题；
- 历史现场；
- 人物选择；
- 具体物件；
- 反常现象；
- 比赛或产品发布时刻。

### 4.2 故事线开场

每个事件只维护一个正式故事线开场，不再生成独立版：

- 有明确技术、人物或问题关系时，可以承接相关事件；
- 不要求逐篇点名上一事件或下一事件；
- 连续约三篇缺少联系时，在中间选择一篇加入主题转场；
- 没有可靠关系时直接使用问题、历史场景或技术矛盾起题。

核心正文必须独立成立，连接语不能承担必要事实。

## 5. 叙事形式分配

采用“以双人问答为主、混合形式为辅”的策略：

```text
双人问答：55%–60%
单人讲述：25%–30%
情景复现或混合形式：10%–15%
```

同一种形式最多连续出现 3 篇。形式分配需要结合整条故事线检查，不能只按单个事件决定。

选择规则：

| 内容类型                   | 推荐形式           |
| -------------------------- | ------------------ |
| 技术机制复杂、需要逐层解释 | 双人问答           |
| 存在常见误解或观点争议     | 双人问答或辩论     |
| 人物经历、历史发展过程     | 单人纪录片         |
| 单一算法机制、时长较短     | 单人短科普         |
| 比赛、演示或发布现场       | 情景复现或双人解说 |
| 科学谜题与发现过程         | 单人悬念讲述       |
| 社会影响、版权与治理       | 单人评论或双人辩论 |

声音身份保持固定，变化的是叙事形式和表达参数，而不是不断增加新音色。

## 6. 收尾方式

整条故事线混合使用以下收尾：

```text
明确总结：约 45%
开放问题：约 25%
向后预告：约 20%
人物或历史回响：约 10%
```

适用规则：

- 基础算法、架构和工具型事件使用明确总结；
- 能力边界、因果关系、伦理或治理问题使用开放问题；
- 有可靠后继关系时使用向后预告；
- 同一人物、机构或问题再次出现时使用历史回响；
- 开放问题结尾直接使用 `N:`、`A:` 或 `B:`，不能标记为 `总结:` / `Summary:`；
- 连续事件中不应反复使用相同句式的问题结尾。

## 7. 事件连接与回响

允许的连接类型：

1. 技术继承：例如 LeNet → ImageNet → AlexNet；
2. 问题延续：例如图灵测试 → ELIZA → ChatGPT；
3. 方法对比：例如 Deep Blue → AlphaGo；
4. 应用推进：例如 Logic Theorist → DENDRAL → XCON；
5. 架构扩散：例如 Transformer → BERT / GPT → ChatGPT；
6. 人物或机构回响；
7. 早期问题在后期事件中的重新出现。

每篇最多使用两个跨事件引用，避免人物和概念过载。没有可靠关系时宁可不加连接，不强行制造连续性。

正式音频结构统一为 `storylineIntro + body + closing`。连接是可选编辑模块，不额外生成独立版文件。

## 8. 文稿数据模型

每个事件的音频脚本应维护以下结构化信息：

```text
eventId
storylineId
storylineOrder
variantId
format
narrativeStyle
closingType
targetDurationSec
storylineIntro
body
closing
bridgeFromEventId
bridgeToEventId
relatedFigureIds
sourceIds
voiceProfile
zhScriptPath
enScriptPath
status
```

状态流转：

```text
draft → sourced → reviewed → audio-generated → listened → approved
```

每个事件只能有一个 `approved` 版本。旧稿按 append-only 原则保留，但必须标记为 inactive，避免被批量工具误用。

## 9. TTS 文稿格式

当前生成器支持：

```text
A: / A：          主持人或角色 A
B: / B：          专家或角色 B
N:                单人旁白
Narrator:         英文旁白完整标签
旁白：             中文旁白完整标签
Summary:          英文总结
总结：             中文总结
```

连续的单人旁白段使用相同 B/旁白音色。单人音频的总结段需要显式指定为同一音色。

## 10. 固定音色

中文：

```text
A: zh_female_vv_uranus_bigtts
B / Narrator / Summary: ICL_uranus_zh_male_huoposhuanglang_tob
```

英文：

```text
A: en_female_wenrouzhishijieshuonv_uranus_bigtts（Megan）
B / Narrator: en_male_alberto_uranus_bigtts（Alberto）
```

不同形式使用不同 `context_texts`：

- 问答：A 好奇自然，B 知性解释；
- 纪录片：沉稳、稍慢、留出概念停顿；
- 悬念：开头克制，揭示时适度加强；
- 赛事：开头有现场感，中段回归分析；
- 评论：避免煽情和广告腔；
- 开放问题：结尾放慢，问题后留出停顿。

中文 B / Narrator 的当前默认表达提示为：清晰、爽朗、自然，像知识型播客中善于把复杂概念讲明白的青年科普嘉宾；语速中等，语气轻松、有交流感，技术名词、年份和英文缩写清晰。避免综艺主持腔、低沉浑厚的纪录片播音腔、新闻播报腔、广告腔和过度表演。标点只控制停顿，不口播“冒号”“分号”等符号名称；生成器还会在 Seed-TTS 请求前将正文中文冒号转换为停顿标点。

中文默认语速参数：A 为 `1.00`，B / Narrator / Summary 为 `0.99`。总结前停顿为 `600ms`，且不口播“总结”标签。英文继续使用原有节奏参数。

## 11. 音频生成规格

TTS：

```text
Provider: Volcengine
Model: seed-tts-2.0
Endpoint: https://openspeech.bytedance.com/api/v3/plan/tts/unidirectional
Credentials: /home/ubuntu/.openclaw/workspace/.secrets/tts.env
```

最终媒体规格：

```text
Format: MP3
Sample rate: 44.1 kHz
Channels: mono
Target loudness: about -16 LUFS
True peak: no higher than -1 dBTP
Duration: 40–150 seconds
```

## 12. 实现流程

1. 读取正式 AI100 storyline，筛选 `enabled: true` 事件；
2. 对每个事件固定使用 `bench-council-ai100` variant；
3. 审计 claims、sources、figures 和双语内容；
4. 建立技术、人物、机构和问题的关系图；
5. 为整条故事线分配形式、叙事风格、时长和收尾方式；
6. 检查同一种形式是否连续超过 3 篇；
7. 编写结构化中英文脚本和来源映射；
8. 生成唯一的故事线开场，并检查连接密度；
9. 校验事实、关系、双语完整性和预计时长；
10. 编译成 A/B/N 格式并执行 TTS dry-run；
11. 调用 `seed-tts-2.0` 生成中文和英文音频；
12. 统一采样率、声道、响度和峰值；
13. 连续试听 3–5 个相邻事件，检查衔接、重复感和发音；
14. 审核通过后标记为 `approved` 并接入正式资源映射。

### 12.1 当前脚本入口

音频 revision 的来源、音色和生成参数统一放在 `audio/`，执行脚本统一放在 `scripts/audio/`，不再为单个批次新增一次性生成脚本。

```bash
# 只校验配置、来源 turns 和 Archive 引用，不依赖本地音频。
npm run audio:revision -- source-check audio/revisions/<revision>.json

# 检查来源 turns、编译脚本和已有音频是否同步。
npm run audio:revision -- check audio/revisions/<revision>.json

# 只编译新 revision 的脚本与生成计划，不调用 TTS。
npm run audio:revision -- build audio/revisions/<revision>.json

# 编译、调用 Seed-TTS、规范化媒体并校验。
npm run audio:revision -- generate audio/revisions/<revision>.json

# 单独校验已有 revision。
npm run audio:revision -- validate audio/revisions/<revision>.json

# 将一个或多个候选加入试听控制台并重建评审数据。
npm run audio:revision -- activate audio/revisions/<revision-a>.json audio/revisions/<revision-b>.json

# 只重建试听控制台数据。
npm run audio:revision -- review
```

`generate` 遵守 `resources/` append-only 规则：已存在的计划、overlay 或 MP3 不会被覆盖。需要修改文稿、音色或参数时必须使用新的 `revisionId` 和输出目录。

`resources/audio/` 是本地生成暂存区，不进入 Git。MP3、overlay、质量报告、资源映射等派生产物后续统一上传到对象存储；仓库只提交 `audio/` 下的来源 turns、音色配置、revision 配置以及 `scripts/audio/` 下的生成逻辑。

评审阶段允许同一事件同时挂载多个候选，例如“原版”和“互动增强版”；这些都是同一个故事线音频的编辑候选。最终发布时，每个事件、语言和模式只能有一个 `approved` 版本，其余 revision 保留为未启用的历史记录。

## 13. 质量门禁

每篇必须通过：

- 正式 storyline 成员校验；
- AI100 variant 优先级校验；
- source ID 存在性校验；
- 人物与跨事件关系校验；
- 日期、数字和专名校验；
- 中英文结构完整性校验；
- 同形式连续数量校验；
- 40–150 秒时长校验；
- TTS 格式 dry-run；
- 音频规格与响度校验；
- 人工连续试听。

## 14. 批次策略

先整理现有合格稿件，确定每个事件唯一的 active 版本。随后选取约 12 个相邻或强关联事件作为故事线连接 pilot：

- 覆盖双人问答、单人讲述和混合形式；
- 至少包含总结、开放问题、向后预告和历史回响；
- 连续试听验证后，再按每批 15–20 个事件扩展；
- 每批完成后更新关系图、来源状态和 active/approved 状态；
- 不因批量生产降低 source 和人工试听要求。
