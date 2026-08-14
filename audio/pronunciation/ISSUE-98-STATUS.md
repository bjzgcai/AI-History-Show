# Issue #98 当前状态

更新日期：2026-08-14

当前分支：`fix/issue-98-audio-pronunciation-glossary`

已有基线提交：`4c43eb1 feat: 建立音频专用词发音清单`

本文只记录当前工作状态。长期正式规则以 `README.md` 为准，早期 acoustic 实验与 detector 结论见
`VALIDATION.md`。

## 当前结论

正式方案已经确定为：

```text
正确 speechForm
+ 精确生成环境资格认证
+ 人工审听代表样本
+ 自动检查覆盖和 generation identity
```

Archive、展示文案和 frozen turn 中的英文专用词保持原样。生成时只修改临时 speech text。
Acoustic detector 不作为生成、发布或发音放行门禁，只保留为 diagnostic 工具。

一项 TTS qualification 精确绑定：

```text
term + speechForm + provider + model + locale + voice + instruction SHA-256
```

任一字段变化都必须重新认证。相同 tuple 的新回归样本只更新证据，不创建第二个同时生效的资格。

## 已完成

### 专用词盘点

- Glossary：311 项。
- 音频 turn 中的出现次数：2091 次。
- Turn 文件：352 个，合计 2153 个 turn。
- 未覆盖候选：0。
- 未出现在文案中的 glossary 项：0。
- `hintRequired`：213 项。

盘点来源和每次出现位置见 `inventory.json`。

### 已人工确认的 Speech Replacement

| Term       | Speech form   | Locale | Role / instruction | Qualification                               |
| ---------- | ------------- | ------ | ------------------ | ------------------------------------------- |
| `SURF`     | `surf`        | `zh`   | B                  | `surf-volc-seed-tts-2-zh-huopo-b-v1`        |
| `NAS`      | `N-A-S`       | `zh`   | Narrator           | `nas-volc-seed-tts-2-zh-huopo-narrator-v1`  |
| `XCON`     | `ex-con`      | `zh`   | Narrator           | `xcon-volc-seed-tts-2-zh-huopo-narrator-v1` |
| `RoIAlign` | `R-O-I align` | `zh`   | B                  | `roialign-volc-seed-tts-2-zh-huopo-b-v1`    |
| `RoI`      | `R-O-I`       | `zh`   | B                  | `roi-volc-seed-tts-2-zh-huopo-b-v1`         |

`XCON` 在 `1980-xcon-r1 / zh / turn 5` 有明确排除项，不自动应用通用 replacement。

### Compiler 与生成链路

- 最长 alias 优先并使用精确英文数字词边界。
- qualification 按完整 tuple 匹配。
- 有管理规则但没有当前资格的出现位置记为 `unqualified`，正式生成直接失败。
- 同一生成环境存在多个 active qualification 时直接失败。
- Overlay v2 记录 glossary hash、资格 ID、替换、`unqualified` 和排除项。
- Generation identity 包含原文、speech text、替换、排除项和 glossary SHA-256。
- Append-only 恢复会核对 job identity 和音频 SHA-256。
- 历史 overlay v1 保持兼容，不修改旧资产。

### 正式命令

```bash
npm run audio:pronunciation:inventory
npm run audio:pronunciation:audit
npm run audio:pronunciation:qualification-pack
```

Acoustic 工具已移出 `audio:workflow`，统一放在：

```text
audio:pronunciation:diagnostic:*
```

## 当前 Audit

最近一次 compiler audit：

| Item               | Count |
| ------------------ | ----: |
| 扫描 turn 文件     |   352 |
| 唯一 turn source   |   348 |
| 唯一生成环境       |   348 |
| 重复生成环境       |     4 |
| 已应用 replacement |    10 |
| `unqualified`      |    15 |
| 明确排除           |     1 |

15 个 `unqualified` 包含：

- 中文 `SURF` 女声 A：1 次。
- 中文 `SURF` Summary：1 次。
- 英文 `SURF`、`NAS`、`XCON`、`RoIAlign`、`RoI`：13 次。

完整明细位于 `.tmp/pronunciation-compilation-audit.json`。

## 当前 Qualification Pack

`qualification-cases.json` 已准备第一组 `SURF` 验证，共 10 条不同 seed 的样本：

| Group        | Action           | Context                  | Samples |
| ------------ | ---------------- | ------------------------ | ------: |
| 中文女声 A   | 创建资格         | 问句 turn 1              |       3 |
| 中文 Summary | 创建资格         | 总结 turn 7              |       3 |
| 中文男声 B   | 更新已有资格证据 | 历史 turn 2、影响 turn 6 |       4 |

预构建 manifest：

```text
.tmp/pronunciation-qualification/manifest.json
```

10 条样本使用 seed `980100` 到 `980109`。当前全部保持 `pending-human-review`。

### 当前阻塞

使用以下 env 文件生成时：

```text
~/.openclaw/workspace/.secrets/tts.env
```

`SEED-TTS-API-KEY` 能被正确读取，变量格式、引号和选择顺序均正常。Volc 返回
`InvalidSubscription`，表示 key 对应账号的 `AgentPlanEnterprise` 已过期、未开通或未分配 seat。
第一条请求即失败，因此当前没有生成可审听 MP3。

恢复 subscription 后运行：

```bash
node scripts/audio/build-pronunciation-qualification-pack.mjs \
  --generate \
  --env-file ~/.openclaw/workspace/.secrets/tts.env
```

## 仍待官方音频核验的目标读音

以下 9 项的目标读音确认等级仍为 `pending-official-audio`。这与 TTS qualification 是不同维度：

| Term                 | Category    | Event source                                   |
| -------------------- | ----------- | ---------------------------------------------- |
| `SHRDLU`             | system-name | `1966-eliza`, `1970-shrdlu`, `2011-ibm-watson` |
| `Cyc`                | system-name | `1984-cyc`                                     |
| `Suphx`              | system-name | `2019-muzero`, `2019-pluribus`, `2019-suphx`   |
| `David Rumelhart`    | person-name | `ai100-1967-back-propagation`                  |
| `H. Sebastian Seung` | person-name | `ai100-1999-nmf`                               |
| `Bernhard Scholkopf` | person-name | `ai100-1997-kernel-pca`                        |
| `Alexander Smola`    | person-name | `ai100-1997-kernel-pca`                        |
| `Luc Van Gool`       | person-name | `ai100-2006-surf`                              |
| `Vin de Silva`       | person-name | `ai100-2000-isomap`                            |

## 验证状态

已通过：

- `npm run lint`
- `npm run format:check`
- `npm run validate:archive`
- Pronunciation inventory 同步检查
- Qualification pack 预构建
- 旧 Issue #98 revision 的 4 条音频兼容验证
- Compiler 的 tuple 失配、排除项、最长 alias 和重复资格冲突测试

当前预期失败：

- `audio:pronunciation:audit -- --check`：仍有 15 个 `unqualified`。
- Qualification MP3 生成：Volc subscription 不可用。

提交时必须同时包含 Issue #98 的 1 个 revision config 和 4 个 frozen turn。遗漏其中任何文件时，
`scripts/test-audio-tooling.mjs` 会按设计拒绝 untracked audio source。

## 下一步

1. 恢复 Volc subscription 或换用同一预期账号的有效 `SEED-TTS-API-KEY`。
2. 生成 10 条 `SURF` qualification 样本并人工审听。
3. A 与 Summary 全部通过后创建对应 qualification；B 全部通过后只更新已有资格的 `sampleIds`。
4. 重新运行 inventory 和 audit。中文 `SURF` 会自动统一应用到所有匹配上下文。
5. 为剩余 13 个英文出现位置建立英文 qualification pack，按相同流程认证。
6. `unqualified` 清零后生成正式 revision，并运行项目质量门禁。
