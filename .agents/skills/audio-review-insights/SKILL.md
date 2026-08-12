---
name: audio-review-insights
description: 查询和统计 AI-History-Show 音频审听台的审核记录。用于查看今天、昨天、指定日期或区间新增的通过/不通过记录，按故事线、审核人或语言汇总，获取不通过事件与审核备注，判断哪些候选当前仍未通过，导出 Markdown/JSON/CSV，或追踪事件和 revision 的完整审核历史。不要用于生成审听候选、提交审核或撤销审核记录。
---

# 音频审核统计

使用随技能提供的只读脚本查询审核服务、导出 JSON 或 SQLite。保持审核记录、候选和事件三种统计口径分离。

## 操作流程

1. 从用户请求解析日期、时区、故事线、审核人、语言、结果和输出格式。
2. 优先使用已经配置的数据源，不向用户索要可从环境变量发现的信息。
3. 运行 `scripts/query-audio-reviews.mjs`，不要临时重写 `jq` 统计逻辑。
4. 在回答中先给总计，再给故事线、审核人和不通过详情。
5. 对“审核不通过”明确说明是日期内提交的 `fail`，还是当前仍无有效 `pass`。

需要解释统计口径、撤销、时区或共享故事线时，读取 [references/report-semantics.md](references/report-semantics.md)。

## 数据源

按下列优先级选择一种来源：

1. 用户指定的 `--input`、`--db` 或 `--url`。
2. `AUDIO_REVIEW_EXPORT`、`AUDIO_REVIEW_DB` 或 `AUDIO_REVIEW_BASE_URL`。
3. 本地默认 `.tmp/audio-review/reviews.sqlite` 或 Docker Compose 的 `.tmp/audio-review-data/reviews.sqlite`。

在线访问从 `AUDIO_REVIEW_TOKEN` 或 `--token-file` 读取 Token。不要把 Token 直接放入命令参数、回复、日志或输出文件。若没有可用数据源，说明需要配置哪一个环境变量，不要猜测线上地址或凭证。

## 常用查询

技能目录记为 `$SKILL_DIR`，运行：

```bash
node "$SKILL_DIR/scripts/query-audio-reviews.mjs" daily --date today
node "$SKILL_DIR/scripts/query-audio-reviews.mjs" failed --date yesterday
node "$SKILL_DIR/scripts/query-audio-reviews.mjs" failed --date 2026-08-10 --still-failing
node "$SKILL_DIR/scripts/query-audio-reviews.mjs" summary --from 2026-08-01 --to 2026-08-12
node "$SKILL_DIR/scripts/query-audio-reviews.mjs" reviewer --days 7
node "$SKILL_DIR/scripts/query-audio-reviews.mjs" event-history --event-id 2017-transformer
```

默认时区为 `Asia/Shanghai`。用户说“今天”“昨天”或给出无时区日期时，保留默认值；用户明确指定其他地区时使用 `--timezone`。

## 查询映射

- “今天新增了哪些审核”：`daily --date today`
- “某天审核不通过的信息和备注”：`failed --date YYYY-MM-DD`
- “现在还没通过的”：在 `failed` 后加 `--still-failing`
- “按故事线统计”：任何汇总命令都会输出故事线分组；加 `--storyline <id>` 过滤
- “按审核人统计”：`reviewer`，可加 `--reviewer <id或姓名>`
- “最近 N 天”：`--days N`
- “某个事件为什么没通过”：`event-history --event-id <id>`
- “导出表格”：加 `--format csv --output <path>`
- “给其他程序消费”：加 `--format json`

## 报告规则

- 默认排除已撤销记录，同时报告查询期内发生的撤销数量。
- 不通过详情必须包含事件、故事线、语言、审核人、时间、备注和当前状态。
- 没有备注时明确写“无备注”。
- 同一候选先失败后通过时，日期内失败详情仍显示，并标注当前已通过。
- 用户只问不通过信息时，不展开完整通过明细。
- `all-contexts` 会让共享音频重复计入多个故事线，使用时提醒分组合计可能大于总数。
- 不执行提交、撤销、数据库修改或 Token 配置变更。

## 输出交付

直接向用户给出查询结果和所用日期口径。只有用户要求保存时才使用 `--output`，并提供生成文件的链接。
