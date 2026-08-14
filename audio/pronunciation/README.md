# 音频专用词发音资料

本目录管理音频文案中的英文专用词、目标读音和 TTS 资格组合。Archive、展示文案与 frozen turn
中的专用词保持原样；只有发送给 TTS 的临时 speech text 会应用已经人工审听通过的 `speechForm`。

正式流程采用“正确 `speechForm` + 精确生成环境资格认证 + 自动覆盖检查”。Acoustic detector 仅用于
诊断，不是生成、发布或放行门禁。

## 文件

- `glossary.json`：规范词、别名、分类、目标读音、确认等级、TTS 资格组合与例外。
- `inventory.json`：从所有 `audio/revisions/**/turns/{zh,en}/*.json` 生成的出现位置清单。
- `qualification-cases.json`：待人工审听的代表上下文、重复次数和候选 `speechForm`。
- `ISSUE-98-STATUS.md`：Issue #98 当前实现、数据状态、验证结果、阻塞和下一步。
- `validation-cases.json`：早期 acoustic detector 实验配置，仅供诊断。
- `VALIDATION.md`：Issue #98 的历史实验记录和 diagnostic 工具说明。

## 两种确认

目标读音确认等级回答“这个专用词应该怎么读”：

- `issue-confirmed`：Issue 或人工审听已明确指出目标读音。
- `canonical`：由名称展开、标准字母数字读法或明确的英文词读法确定。
- `usage-confirmed`：按 AI/计算机领域通行读法记录。
- `name-reviewed`：人物姓名按语言背景与公开使用习惯记录。
- `pending-official-audio`：文字资料不足以唯一确定，仍需官方音频核验。

`ttsQualifications` 回答“这个 `speechForm` 在哪一套 TTS 环境中已被证明能生成正确读音”。一项资格
由以下 tuple 唯一约束：

```text
term + speechForm + provider + model + locale + voice + instruction SHA-256
```

任一字段变化都必须重新生成代表样本并人工审听，不能把旧资格自动迁移到新 model、voice、语言或
instruction。`sampleIds` 记录实际审听过的证据样本。

## 资格认证

1. 运行 inventory，确认新文案中的专用词都已进入 glossary，并核对目标读音与分类。
2. 在 `qualification-cases.json` 选择真实 turn，配置候选 `speechForm`。同一 group 的上下文必须使用
   同一 locale、voice 和 instruction，并至少生成两个不同 seed 的重复样本。
3. 生成 qualification pack。样本只写入 `.tmp/`，不会修改 frozen turn 或正式音频。

```bash
npm run audio:pronunciation:qualification-pack -- \
  --generate \
  --env-file /path/to/tts.env
```

4. 按 `.tmp/pronunciation-qualification/REVIEW.md` 审听全部样本。发音与上下文自然度均通过后，将
   group 对应 tuple 写入 `glossary.json` 的 `ttsQualifications`，并记录 manifest 中的 sample ID。
   manifest 的 `reviewAction` 会区分创建新资格和只更新已有资格的证据。
5. 任何样本失败都先调整 `speechForm`，再生成一组新样本；不得把失败组合标为
   `human-reviewed-pass`。同一组合的新回归审听用于更新证据，不创建两个同时生效的资格。
6. 运行 inventory 与 compiler audit，再生成正式 revision。

```bash
npm run audio:pronunciation:inventory
npm run audio:pronunciation:audit -- --check
npm run audio:workflow -- generate audio/revisions/<revision-config>.json
```

## 正式生成

`scripts/audio/lib/pronunciation.mjs` 在调用 TTS 前编译 speech text：

- 只应用 `status: human-reviewed-pass`、`method: speech-replacement` 且完整 tuple 精确匹配的
  `speechForm`。
- 最长 alias 优先并检查英文数字词边界，避免 `RoI` 抢先匹配 `RoIAlign` 或匹配词内片段。
- 已纳入 speech replacement 管理、但当前生成环境没有资格的出现位置记为 `unqualified`，正式生成
  直接失败。
- `ttsExclusions` 只处理有明确依据的 event、locale、turn 级例外，并写入 overlay。
- overlay 保留原始 turns，同时记录 glossary SHA-256、替换明细、资格 ID、`unqualified` 和例外。
- generation identity 包含原文、speech text、资格替换、例外和 glossary SHA-256。规则变化后不能复用
  旧音频；append-only 恢复还会核对 job identity 与音频 SHA-256。

`audio:pronunciation:audit -- --check` 会扫描唯一 turn source；存在 `unqualified` 时返回失败。该检查验证
规则覆盖和生成身份，不尝试从音频波形推断读音。

## Acoustic Diagnostic

早期实现的 ASR、forced candidate、token form 和 duration detector 保留用于定位问题、比较候选
`speechForm` 或辅助排查回归。它们不进入 `audio:workflow`，结果中的 `PASS` 也不能替代人工资格认证。

```bash
npm run audio:pronunciation:diagnostic:prepare
npm run audio:pronunciation:diagnostic:generate -- --generate --env-file /path/to/tts.env
npm run audio:pronunciation:diagnostic:score
npm run audio:pronunciation:diagnostic:revision -- audio/revisions/<revision-config>.json
```

## 盘点边界

收录技术名称、系统/模型/算法名、产品/机构名、作品与历史事件名、缩写，以及英文稿中实际出现的
人名。由普通英文单词组成但承担规范名称的术语也会收录；没有特殊发音风险时可设置
`hintRequired: false`，只参与盘点。

普通英文叙述词、公式单字母变量和源码字段不进入词表。inventory 会继续发现未覆盖的全大写、混合
大小写、字母数字组合、中文稿中的拉丁片段，并使用全局人物 registry 反查英文稿中的人名与独立姓氏。
