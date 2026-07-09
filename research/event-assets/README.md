# Event Asset Research Workspace

这个目录用于收集、审核和筛选每个事件的候选资料，不直接等同于正式展示数据。

## 目录约定

每个事件使用事件 key 建目录，例如：

```text
research/event-assets/1956-dartmouth/
  summary.json   # 从 manage/events.js 抽取的当前事件说明、图片、视频
  sources.json   # 当前来源、种子来源、搜索入口、可选抓取结果
  media.json     # 人物头像、事件照片、出版物/论文、现有图片授权核查入口
  people.json    # 相关人物与头像候选
  images/        # 后续可放候选图片；进入正式页面前仍需确认授权
    manifest.json # 候选图片本地路径、来源页、描述、用途、审核状态
  notes.md       # 人工筛选记录，不会被脚本覆盖
  pages/         # --fetch 模式保存的网页快照
```

仓库只跟踪轻量元数据与 `images/manifest.json`。`pages/` 网页快照和 `images/` 下的实际下载图片属于本地研究缓存，体量较大且需要逐项授权复核，因此默认由 `.gitignore` 排除；需要复现时可运行 `npm run research:collect -- --all --fetch --download-images` 重新生成。

## 常用命令

```bash
npm run research:collect
npm run research:collect -- --all
npm run research:collect -- --event=1956-dartmouth,1957-kmeans
npm run research:collect -- --event=1956-dartmouth --fetch
npm run research:collect -- --event=1956-dartmouth --download-images
npm run research:server
```

默认只初始化三个试点事件：`1956-dartmouth`、`1957-perceptron`、`1957-kmeans`。

`--fetch` 会访问网络并把网页 HTML 保存到对应事件的 `pages/` 目录。

`--download-images` 会先刷新网页快照，再把可解析的候选图片保存到对应事件的 `images/` 目录，同时生成 `images/manifest.json`。这些图片仍只是研究候选；进入正式 `resources/images` 前，必须先在 `notes.md` 里记录来源、授权和用途判断。

## 筛选建议

- 先看 `sources.json`：确认主论文、官方档案、机构页面、人物资料是否足够。
- 再看 `media.json`：逐项打开人物头像、事件照片、出版物/论文、开放图片检索入口。
- 对图片只接受原始文件页或馆藏页作为来源；搜索结果页只能当线索。
- 对 `fetchResults.ok = false` 的来源，保留为“人工待查”或替换为更稳定来源。
