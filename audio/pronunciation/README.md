# 音频专用词发音资料

本目录只处理音频文案中的英文专用词盘点与目标读音记录，不修改展示文案，也尚未接入 TTS
生成流程。

## 文件

- `glossary.json`：人工维护的规范词、别名、目标读音、提示语、依据与确认状态。
- `inventory.json`：由脚本从所有 `audio/revisions/**/turns/{zh,en}/*.json` 生成的出现位置清单。

生成盘点：

```bash
node scripts/audio/build-pronunciation-inventory.mjs
node scripts/audio/build-pronunciation-inventory.mjs --check
```

## 确认等级

- `issue-confirmed`：已有审听问题或 Issue 明确给出目标读音。
- `canonical`：由名称展开、标准字母数字读法或明确的英文词读法确定。
- `usage-confirmed`：按 AI/计算机领域通行读法记录。
- `name-reviewed`：人物姓名按其语言背景与公开使用习惯记录；进入生成验证时仍需重点审听。
- `pending-official-audio`：拼写或公开文字资料不足以唯一确定读法，已经记录暂定目标，但仍需查找
  作者、机构或作品官方音频核验。

`prompt.zh` 与 `prompt.en` 是后续小规模 TTS 验证使用的候选提示语。它们不会替换原文中的
专用词。正式接入前，需要先验证具体 TTS 模型和音色是否遵循提示。

## 收录边界

收录技术名称、系统/模型/算法名、产品/机构名、作品与历史事件名、缩写，以及英文稿中实际
出现的人名。由普通英文单词组成但实际承担规范名称的术语也会收录；如果没有特殊发音风险，
会设置 `hintRequired: false`，只参与盘点而不要求后续强制注入提示。

普通英文叙述词、公式中的单字母变量和源码字段不进入词表。盘点脚本会对未覆盖的全大写、
混合大小写、字母数字组合及中文稿中的拉丁片段继续报错，并使用全局人物 registry 反查英文稿
中的人名和独立姓氏用法，以便后续文案新增专用词时及时发现。
