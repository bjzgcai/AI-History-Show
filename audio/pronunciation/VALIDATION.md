# Issue #98 历史实验与 Acoustic Diagnostic

本文记录早期小规模对照实验。正式方案已经改为精确 TTS 环境资格认证与人工审听代表样本；下述
automatic validation 只保留为诊断工具，不作为生成、发布或发音放行门禁。

第一轮只验证当前生产链路 Seed-TTS 2.0 的 `context_texts` 发音提示是否有效，不修改原始文案、
正式 revision 或正式音频资产。

前两轮确认 `context_texts` 无法可靠改变 `XCON`、`SURF`、`NAS` 和 `RoIAlign` 的默认文本
规范化。第三轮增加 `rewritten`：原始文案保持不变，只对发送给 TTS 的临时 speech text 应用可
审计的发音 alias。

## 样本

| Case          | 事件                    | 目标读法              | Baseline                   | Hinted                   |
| ------------- | ----------------------- | --------------------- | -------------------------- | ------------------------ |
| `zh-eliza`    | `1966-eliza`            | `Eliza, /ɪˈlaɪzə/`    | `zh-eliza/baseline.mp3`    | `zh-eliza/hinted.mp3`    |
| `zh-xcon`     | `1980-xcon-r1`          | `EX-con, /ˈeks.kɑːn/` | `zh-xcon/baseline.mp3`     | `zh-xcon/hinted.mp3`     |
| `zh-surf`     | `ai100-2006-surf`       | `surf, /sɜːrf/`       | `zh-surf/baseline.mp3`     | `zh-surf/hinted.mp3`     |
| `zh-nas`      | `ai100-2016-nas`        | `N A S`               | `zh-nas/baseline.mp3`      | `zh-nas/hinted.mp3`      |
| `zh-roialign` | `ai100-2017-mask-r-cnn` | `R O I align`         | `zh-roialign/baseline.mp3` | `zh-roialign/hinted.mp3` |

以上相对路径均位于 `.tmp/pronunciation-validation/`。Baseline 与 Hinted 使用相同原文、model、
voice 和 speed，唯一输入变量是 Hinted 的角色 instruction 追加 glossary 发音提示。Seed-TTS 的生成
本身可能存在随机性，因此单次对照只能用于第一轮筛查；准备固化规则前应重复生成并复核。

`XCON` 使用事件最后一句作为通用读法样本，避开 Issue #98 指出的倒数第二句例外上下文。

## 审听记录

| Case          | Baseline 目标词  | Hinted 目标词      | 上下文自然度 | 结论             |
| ------------- | ---------------- | ------------------ | ------------ | ---------------- |
| `zh-eliza`    | 待审听           | 待审听             | 待审听       | 待定             |
| `zh-xcon`     | 逐字母拼读       | 仍逐字母拼读       | 正常         | 第一版提示未通过 |
| `zh-surf`     | 逐字母拼读       | 仍逐字母拼读       | 正常         | 第一版提示未通过 |
| `zh-nas`      | 连读为 `/næs/`   | 仍连读为 `/næs/`   | 正常         | 第一版提示未通过 |
| `zh-roialign` | `RoI` 未逐字母读 | `RoI` 仍未逐字母读 | 正常         | 第一版提示未通过 |

第三轮临时 TTS alias：

| Case          | 原文               | 临时 TTS 输入           | 人工审听结果 |
| ------------- | ------------------ | ----------------------- | ------------ |
| `zh-xcon`     | `XCON`             | `ex-con`                | 通过         |
| `zh-surf`     | `SURF`             | `surf`                  | 通过         |
| `zh-nas`      | `NAS`              | `N-A-S`                 | 通过         |
| `zh-roialign` | `RoIAlign` / `RoI` | `R-O-I align` / `R-O-I` | 通过         |

人工审听于 2026-08-13 确认以上四个 `rewritten` 样本发音正确。结论适用于 Seed-TTS 2.0、
中文 `ICL_uranus_zh_male_huoposhuanglang_tob` voice 和表中 speech alias；更换 model、voice、locale
或 alias 后必须重新验证。`XCON` 的结论不包含 Issue #98 指出的倒数第二句例外上下文。

普通 ASR 文本只能作为定位和完整性辅助，不能单独证明音素、重音和连读正确。

## Diagnostic 结论

现已补充固定版本的 `whisper.cpp v1.9.2` runtime、multilingual `small` 与 `small.en` model。自动
验证不是把普通 ASR 文本当作发音证明，而是先用 token timestamps 定位目标片段，再按词选择经过
gold set 校准的 detector。

当前 12 条人工 gold 样本：

- `SURF`：目标片段时长能区分逐字母拼读与单词连读。
- `NAS`：forced expected/rejected candidate margin 能区分 `/næs/` 与 `N A S`。
- `RoIAlign`：目标区间 token form 能区分 `roy align` 与 `R O I align`。
- `XCON`：ASR、phoneme CTC、PPG + DTW、MFCC + DTW 和 forced decoding 都无法在两个独立
  rewritten repeat 上稳定区分，自动结果保持 `REVIEW`。

gold check 结果为 `safe-partial`：自动覆盖 9/12（75%），false accept 为 0，false reject 为 0。该结果
只说明 detector 对这 12 条历史 gold 样本的表现，不证明它能可靠校验全部正式音频。
报告位于 `.tmp/pronunciation-validation/automatic-report.{json,md}`。

## 运行

```bash
# 只准备输入和 manifest，不调用 TTS
node scripts/audio/run-pronunciation-validation.mjs

# 生成独立实验样本；输出不会进入正式音频目录
node scripts/audio/run-pronunciation-validation.mjs \
  --generate \
  --env-file /path/to/tts.env

# 只重生成一个 case 的 baseline 和 hinted
node scripts/audio/run-pronunciation-validation.mjs \
  --generate \
  --case zh-xcon \
  --env-file /path/to/tts.env

# 只重生成指定 case 的 hinted
node scripts/audio/run-pronunciation-validation.mjs \
  --generate \
  --case zh-nas \
  --variant hinted \
  --env-file /path/to/tts.env

# 生成临时 TTS alias 版本
node scripts/audio/run-pronunciation-validation.mjs \
  --generate \
  --case zh-surf \
  --variant rewritten \
  --env-file /path/to/tts.env

# 生成独立 repeat，不覆盖人工通过的 reference 样本
node scripts/audio/run-pronunciation-validation.mjs \
  --generate \
  --run-id repeat-1 \
  --variant rewritten \
  --case zh-surf \
  --env-file /path/to/tts.env

# 准备固定 runtime/model 并运行 diagnostic gold check
npm run audio:pronunciation:diagnostic:prepare
npm run audio:pronunciation:diagnostic:score
```
