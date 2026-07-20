# Archive 迁移历史资料

本目录保留 Archive authority cutover 过程中形成的计划、基线和阶段验收记录。它们用于解释历史决策，不是当前操作指南，其中的事件数量、生成链路和 Legacy 依赖描述可能只适用于生成当时。

当前事实与操作入口请优先参考：

- [`docs/archive-data-flow.md`](../../docs/archive-data-flow.md)：当前实体关系、生产编译、失败保护、Legacy 隔离和部署数据流；
- [`README.md`](../../README.md) / [`README.zh.md`](../../README.zh.md)：启动、编辑、生成与部署入口；
- [`archive/README.md`](../../archive/README.md)：Archive 目录模型与编辑边界；
- [`reports/archive-validation.md`](../archive-validation.md)：最新 Archive 结构校验结果。

## 归档内容

- [`plan-continue-archive-migration.md`](plan-continue-archive-migration.md)：剩余事件迁移的早期实施计划。
- [`plan-archive-presentation-rollback.md`](plan-archive-presentation-rollback.md)：迁移期 presentation overlay 回滚方案。
- [`archive-refactor-step0-baseline.md`](archive-refactor-step0-baseline.md)：架构重构开始时的 Step 0 基线。
- [`archive-refactor-completion-audit.md`](archive-refactor-completion-audit.md)：Archive overlay 阶段的完成度审计。
- [`archive-preview-display-consistency.md`](archive-preview-display-consistency.md)：Archive preview 切换前的展示一致性验收。

## 产物保留策略

- 当前长期 Markdown 结论保留在 `reports/`；
- 迁移完成后的计划、基线和阶段验收保留在本目录；
- 机器 JSON、大型 review HTML 和离线比较工作集写入被忽略的 `.tmp/archive-*`，不进入版本库；
- 正式 runtime data 仍由 `npm run generate` 写入仓库根目录的两份 `milestones-data*.js`。
