# 音频审核统计口径

## 数据模型

完整导出由 `candidates[]` 与 `records[]` 组成。

- 使用 `record.candidateId` 关联候选。
- 候选提供 `eventId`、`title`、`scopeId`、`locale`、`revisionId` 与 `contexts`。
- 记录提供审核人、`pass`/`fail`、备注、提交时间和撤销信息。

## 三层计数

- 审核记录数：每次提交计一条，同一候选可有多条。
- 候选数：按 `candidateId` 去重。
- 事件数：按 `eventId` 去重。

报告不得把这三种数量混称为“审核数”。

## 有效记录和撤销

默认排除 `invalidatedAt` 非空的记录。使用 `--include-invalidated` 时将这些提交纳入所选记录，但仍单独显示已撤销数量。

- `invalidatedSubmissions`：查询期内提交、后来被撤销的记录数。
- `invalidationsInRange`：撤销动作发生在查询期内的记录数，不要求原提交也在查询期内。

撤销不是物理删除。事件历史必须保留撤销时间和原因。

## 当前候选状态

使用该候选的全部未撤销历史记录计算，而不是只看查询日期：

1. 存在至少一条有效 `pass`：`pass`，即已通过。
2. 没有有效 `pass`，但存在有效 `fail`：`revise`，即仍未通过。
3. 没有有效记录：`pending`。

“某日提交的不通过”与“当前仍未通过”是不同问题：

- `failed --date ...`：查询日期内提交的有效 `fail`，即使后来已有通过记录仍显示。
- 加 `--still-failing`：仅保留当前没有有效 `pass` 的候选。

## 日期与时区

`createdAt` 和 `invalidatedAt` 是 UTC ISO 时间。自然语言中的今天、昨天和某个日期默认使用 `Asia/Shanghai`，也可通过 `--timezone` 或 `AUDIO_REVIEW_TIMEZONE` 修改。

日期区间采用左闭右开。例如上海时区的 `2026-08-12` 是：

```text
[2026-08-11T16:00:00.000Z, 2026-08-12T16:00:00.000Z)
```

`--from` 和 `--to` 都是包含端点的本地日历日期。

## 故事线归属

默认 `--storyline-mode primary`，使用候选的 `scopeId` 作为唯一故事线，保证故事线分组合计等于全局记录数。

使用 `--storyline-mode all-contexts` 时，从 `candidate.contexts[].scopeId` 取全部关联故事线。共享候选会重复计入多个故事线，因此分组合计可能大于全局总数；报告必须保留这一提示。

## 审核人统计

按 `reviewer.id` 分组并展示 `reviewer.name`。姓名查询可以模糊匹配 ID 或显示名。

可展示总提交、通过、不通过、已撤销、涉及事件和最近审核时间。不要把通过占比称为准确率，因为系统没有标准答案或复核真值。

## 输出建议

- 对话中默认使用 Markdown。
- 用户要进一步处理或调用其他程序时使用 JSON。
- 用户明确要求表格下载时使用 CSV。
- 不通过详情必须保留无备注记录，并显示“无备注”，不能静默丢弃。
