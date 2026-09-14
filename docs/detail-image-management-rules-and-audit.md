# 详情页图片管理规则与现状审计

> 规则确认日期：2026-07-31
> 审计数据源：`archive/storylines/*.json` 与 `archive/events/*/{assets.json,variants/*.json}`
> 审计范围：174 个启用 storyline 引用，去重后 172 个事件 variant

本文同时记录两类信息：

1. 后续必须遵守的图片管理规则；
2. 截至审计日期，Archive 数据与单屏、双屏页面实现中仍未符合规则的内容。

“目标规则”是规范，“当前实现”只用于说明现状，不能反向覆盖规范。

## 1. 权威数据与基础列表

- 每个事件 variant 的 `assetIds` 决定该 variant 使用的资源及基础顺序。
- 编译器只把 `image`、`svg`、`gif` 资产写入 `resources.images`；视频进入 `resources.videos`。
- 详情页图片顺序必须来自 Archive，不在生成文件中手工调整。
- `milestones-data.js` 与 `milestones-data-default.js` 是生成物，不得手工编辑。
- 人物的 `figures[].avatar` 不会自动进入事件图片列表。需要展示在图片列表中的人物图，必须同时作为资产写入 variant 的 `assetIds`。
- 图片标题、副标题、来源、版权与用途由 `assets.json` 提供，不应依靠文件名猜测。

## 2. 目标图片管理规则

### 2.1 基础图片排序

事件图片列表应按以下原则组织：

1. 优先放人物肖像、团队照片、历史照片、结构图、论文页、成果截图等事件资料。
2. 解释图放在列表最后。
3. 多张解释图必须形成连续的末尾区段，解释图后面不能再出现肖像、结构图或其他资料图。

本文审计时按以下口径区分结构图与解释图：

- 路径位于 `/architecture/` 的图片视为结构图。
- 路径位于 `/explainers/` 的图片视为解释图。
- `role: "algorithm-explainer"` 的图片视为解释图。
- 现有部分解释图使用 `role: "architecture-explainer"`，因此管理时不能只看 `role`，还需要结合路径语义。

### 2.2 “评论与媒体”抽图规则

对完成排序后的事件图片列表执行以下算法：

1. 图片总数不超过 1 张时，不抽取图片。
2. 图片总数大于 1 张时，从头查找第一张非肖像图。
3. 找到后，将该图放入右侧“评论与媒体”区域。
4. 被抽取的图片必须从详情页图片列表和轮播中移除，不能在左右两处重复展示。
5. 如果列表中全部是肖像图，则不抽取图片，右侧“评论与媒体”区域不展示静态图片。
6. 不能优先寻找解释图、SVG、结构图或游戏画面；唯一选择标准是“图片列表中的第一张非肖像图”。
7. 同一规则应同时应用于 `index.html` 和 `dual-screen.html`。

肖像判断应逐步收敛到资产的规范语义角色。文件路径、caption 关键词等启发式判断只作为旧数据兼容方案，不应成为长期内容管理规则。

### 2.3 首页事件图片规则

1. 先完成右侧图片抽取，得到最终详情页图片列表。
2. 默认使用最终详情页图片列表的第一张图片作为首页/时间线事件图片。
3. 只有 variant 明确配置 `overviewImageAssetId` 时，首页才使用额外指定的图片。
4. `overviewImageAssetId` 必须引用当前 variant `assetIds` 中的图片、SVG 或 GIF。
5. 额外指定首页图只影响首页，不改变详情页列表顺序，也不改变右侧抽图结果。

### 2.4 示例：2014 Attention AI100 variant

基础列表应调整为：

1. Dzmitry Bahdanau 肖像；
2. Kyunghyun Cho 肖像；
3. Yoshua Bengio 肖像；
4. Attention 结构图；
5. Attention alignment 解释图。

完成右侧抽图后：

- “评论与媒体”展示第 4 张 Attention 结构图；
- 详情页图片列表展示三张人物肖像和末尾的 alignment 解释图；
- 未额外指定首页图，因此首页默认使用 Bahdanau 肖像。

## 3. 当前实现与规则的差异

### 3.1 单屏入口

`index.html` 当前存在以下偏差：

- `getUiMediaVisualImage` 优先寻找事件覆盖图、人文解释图、游戏画面、diagram/SVG，最后才寻找普通非肖像图；这不等于“第一张非肖像图”。
- `getUiDetailImages` 在右侧图片位于列表第 1 张时故意保留该图，造成左右重复。
- 图片总数为 1 且唯一图片为非肖像图时，现有算法仍会把它选为右侧图片；只是当前启用数据中没有实际触发该情况的 variant。

关键实现：

- `index.html`：`getUiImageCandidates`
- `index.html`：`getUiDetailImages`
- `index.html`：`getUiMediaVisualImage`

### 3.2 双屏入口

`dual-screen.html` 当前不执行静态图片抽取：

- `sortPhotosForDisplay` 完整保留 `vm.photos`。
- `renderArchive` 和全屏查看器使用完整图片列表。
- 右侧“评论与媒体”只处理视频与评论，不展示抽取的静态图片。

当前 172 个启用 variant 都有两张以上图片且至少包含一张非肖像图，因此如果规则要求双屏一致，172 个 variant 都需要应用抽图逻辑。

### 3.3 首页取图

`shared/chronology-overview.js` 当前逻辑是：

1. 有 `resources.overviewImage` 时使用指定图片；
2. 否则使用原始 `resources.images[0]`。

它没有读取“抽取后的最终详情页图片列表”，所以当原始第一张图被新规则抽到右侧时，首页默认图会与最终详情第一张不一致。

## 4. 审计统计

| 检查项 | 不一致数量 | 说明 |
| --- | ---: | --- |
| 解释图没有放在列表最后 | 36 个 variant | 解释图后仍有肖像、结构图或其他资料图 |
| 右侧没有选择第一张非肖像图 | 20 个 variant | 当前优先选择了后面的 diagram、解释图或特殊媒体 |
| 被选中的首图没有从详情列表移除 | 12 个 variant | 当前代码明确保留 index 0 |
| 单图事件被错误抽取 | 0 个当前 variant | 代码规则仍需修正，当前数据没有触发 |
| 默认首页图不等于抽取后的详情第一张 | 17 个 variant | 仅统计没有显式 `overviewImageAssetId` 的 variant |
| 任一单屏规则不一致 | 62 个 variant | 涉及 47 个唯一事件；同一事件可有多个 variant |
| 双屏没有应用抽图规则 | 172 个 variant | 当前双屏整体缺少该规则 |

## 5. 不一致清单

### 5.1 解释图未放最后：36 个 variant

#### `bench-council-ai100`：20 个

| 事件 | 提前出现的解释图 |
| --- | --- |
| `1966-eliza` | DOCTOR 脚本改写 |
| `1997-deep-blue` | 国际象棋搜索树；硬件辅助棋盘评估 |
| `1992-svm` | 最大间隔分类器；核函数特征提升 |
| `1957-perceptron` | 阈值学习边界；传感器网格到神经元 |
| `ai100-1969-relu` | 整流激活 |
| `1989-cnn` | 邮编 CNN 流程 |
| `2015-faster-r-cnn` | 区域建议网络；检测输出框 |
| `1997-lstm` | LSTM 门控记忆单元 |
| `2014-attention` | 注意力对齐图 |
| `2017-transformer` | Transformer 自注意力机制；Transformer 自注意力计算 |
| `2018-bert` | BERT 掩码语言建模 |
| `2018-gpt` | GPT 下一个令牌预训练 |
| `ai100-2014-glove` | GloVe 解释图 |
| `2014-gan` | GAN 对抗循环 |
| `ai100-2017-wasserstein-gan` | Wasserstein GAN 解释图 |
| `ai100-2005-gnn` | 图神经网络解释图 |
| `2013-dqn` | 经验回放池；Q 值控制循环 |
| `2016-alphago` | AlphaGo 策略、价值与搜索流程 |
| `2020-alphafold` | AlphaFold2 结构预测流程 |
| `ai100-1986-id3` | ID3 决策树流程解释图 |

#### `deep-learning`：10 个

`1957-perceptron`、`1989-cnn`、`1997-lstm`、`2014-gan`、`2014-attention`、`2016-alphago`、`2017-transformer`、`2018-bert`、`2018-gpt`、`2020-alphafold`。

这些 variant 提前出现的解释图与对应 AI100 variant 基本相同；`2014-attention/deep-learning` 还把 alignment 解释图放在整个列表第一位，后面才是结构图和三张人物肖像。

#### `gaming-ai`：6 个

| 事件 | 提前出现的解释图 |
| --- | --- |
| `2016-alphago` | AlphaGo 策略、价值与搜索流程 |
| `1997-logistello` | Logistello 模式评估 |
| `2013-dqn` | 经验回放池 |
| `2017-alphazero` | AlphaZero 自我博弈循环 |
| `2019-suphx` | Suphx 麻将策略循环 |
| `2019-muzero` | MuZero 学习模型 |

### 5.2 右侧没有选择第一张非肖像图：20 个 variant

| 事件 / variant | 按规则应抽取 | 当前抽取 |
| --- | --- | --- |
| `1990-otter/bench-council-ai100` | OTTER 3.3 参考手册首页 | 子句索引地图 |
| `2011-ibm-watson/bench-council-ai100` | IBM Watson《危险边缘！》演示 | DeepQA 问答处理流程 |
| `1951-strachey-draughts/bench-council-ai100` | 斯特雷奇跳棋程序显示画面 | 跳棋棋盘搜索 |
| `1994-chinook/bench-council-ai100` | Chinook 官方项目页面 | 残局数据库表 |
| `1959-pandemonium/bench-council-ai100` | Pandemonium 分层识别架构 | 特征投票级联 |
| `1984-cyc/bench-council-ai100` | Cyc 项目相关标识 | Cyc 微理论 |
| `1980-xcon-r1/bench-council-ai100` | DEC VAX 11/780 计算机 | 规则式配置器 |
| `1957-kmeans/bench-council-ai100` | 贝尔实验室霍姆德尔园区 | 质心分配循环 |
| `2000-spectral-clustering/bench-council-ai100` | 谱聚类六节点图示 | 归一化图切分 |
| `ai100-1970-ridge/bench-council-ai100` | 阿瑟·霍尔与岭回归公式 | 岭回归收缩路径 |
| `ai100-1943-mcculloch-pitts-neuron/bench-council-ai100` | 沃尔特·皮茨与黑板 | 阈值逻辑神经元 |
| `1957-perceptron/bench-council-ai100` | 弗兰克·罗森布拉特与感知机硬件 | 阈值学习边界 |
| `ai100-2017-mobilenets/bench-council-ai100` | MobileNets 论文首页 | MobileNets 流程解释图 |
| `ai100-2015-fcn/bench-council-ai100` | FCN 论文首页 | 全卷积网络流程解释图 |
| `ai100-2014-conditional-gan/bench-council-ai100` | Conditional GAN 论文首页 | Conditional GAN 解释图 |
| `ai100-1990-boosting/bench-council-ai100` | Boosting 论文首页 | Boosting 提升法流程解释图 |
| `1957-perceptron/deep-learning` | 弗兰克·罗森布拉特与感知机硬件 | 阈值学习边界 |
| `2025-llm-competition/deep-learning` | 大语言模型百花齐放资料图 1 | 大语言模型百花齐放结构图 1 |
| `1973-lighthill-report/humanistic-cycle` | 爱丁堡 Freddy II 机器人 | 莱特希尔寒冬解释图 |
| `1978-xiaolingtong/humanistic-cycle` | 《小灵通漫游未来》1978 年初版封面 | 未来城市乐观想象解释图 |

### 5.3 右侧选中了首图但详情列表仍保留：12 个 variant

| 事件 / variant | 当前重复展示的首图 |
| --- | --- |
| `1956-dartmouth/deep-learning` | 达特茅斯会议提议封面 |
| `2014-attention/deep-learning` | 注意力对齐图 |
| `2014-highway-network/deep-learning` | 高速网络结构图 1 |
| `2022-post-training-intelligence/deep-learning` | 指令微调流程图 |
| `2023-agents/deep-learning` | 智能体资料图 2 |
| `1951-strachey-draughts/gaming-ai` | 斯特雷奇跳棋程序显示画面 |
| `1988-td-update/gaming-ai` | 时序差分学习与后来的 TD-Gammon |
| `1994-chinook/gaming-ai` | Chinook 官方项目页面 |
| `1997-logistello/gaming-ai` | Logistello 对村上健第 1 局逐手局面 |
| `1997-deep-blue/gaming-ai` | 深蓝对卡斯帕罗夫 1997 年第 6 局 |
| `2013-dqn/gaming-ai` | 经验回放池 |
| `2019-muzero/gaming-ai` | MuZero 学习模型 |

### 5.4 默认首页图不符合“最终详情第一张”：17 个 variant

以下 variant 没有额外指定首页图，原始第一张又会按新规则被抽到右侧。

| 事件 / variant | 当前默认首页图 | 按规则应使用 |
| --- | --- | --- |
| `1980-xcon-r1/bench-council-ai100` | DEC VAX 11/780 计算机 | VAX 11/780 CPU 背板 |
| `1957-kmeans/bench-council-ai100` | 贝尔实验室霍姆德尔园区 | K-means 鸢尾花聚类结果 |
| `ai100-1970-ridge/bench-council-ai100` | 阿瑟·霍尔与岭回归公式 | 岭回归收缩路径 |
| `ai100-1943-mcculloch-pitts-neuron/bench-council-ai100` | 沃尔特·皮茨与黑板 | 阈值逻辑神经元 |
| `1957-perceptron/bench-council-ai100` | 弗兰克·罗森布拉特与感知机硬件 | 阈值学习边界 |
| `ai100-2014-conditional-gan/bench-council-ai100` | Conditional GAN 论文首页 | Conditional GAN 解释图 |
| `1957-perceptron/deep-learning` | 弗兰克·罗森布拉特与感知机硬件 | 阈值学习边界 |
| `2014-highway-network/deep-learning` | 高速网络结构图 1 | 于尔根·施密德胡伯肖像 |
| `2022-post-training-intelligence/deep-learning` | 指令微调流程图 | 后训练流程图 |
| `2023-agents/deep-learning` | 智能体资料图 2 | 智能体资料图 3 |
| `1951-strachey-draughts/gaming-ai` | 斯特雷奇跳棋程序显示画面 | 克里斯托弗·斯特雷奇肖像 |
| `1988-td-update/gaming-ai` | 时序差分学习与后来的 TD-Gammon | 理查德·萨顿肖像 |
| `1994-chinook/gaming-ai` | Chinook 官方项目页面 | 乔纳森·谢弗肖像 |
| `1997-logistello/gaming-ai` | 第 1 局逐手局面 | Logistello 模式评估 |
| `1997-deep-blue/gaming-ai` | 1997 年第 6 局 | 许峰雄肖像 |
| `2013-dqn/gaming-ai` | 经验回放池 | 大卫·席尔瓦肖像 |
| `2019-muzero/gaming-ai` | MuZero 学习模型 | 大卫·席尔瓦肖像 |

显式配置了 `overviewImageAssetId` 的事件不计入本表，因为规则允许单独指定首页图。

### 5.5 按 storyline 汇总的受影响 variant

标记说明：

- `R1`：解释图没有放最后；
- `R2-选图`：右侧没有选择第一张非肖像图；
- `R2-重复`：选中首图后没有从详情列表移除；
- `R3`：默认首页图不是抽取后的详情第一张。

#### `bench-council-ai100`：35 个

`1990-otter(R2-选图)`、`1966-eliza(R1)`、`2011-ibm-watson(R2-选图)`、`1951-strachey-draughts(R2-选图)`、`1994-chinook(R2-选图)`、`1997-deep-blue(R1)`、`1959-pandemonium(R2-选图)`、`1984-cyc(R2-选图)`、`1980-xcon-r1(R2-选图+R3)`、`1957-kmeans(R2-选图+R3)`、`2000-spectral-clustering(R2-选图)`、`ai100-1970-ridge(R2-选图+R3)`、`1992-svm(R1)`、`ai100-1943-mcculloch-pitts-neuron(R2-选图+R3)`、`1957-perceptron(R1+R2-选图+R3)`、`ai100-1969-relu(R1)`、`1989-cnn(R1)`、`ai100-2017-mobilenets(R2-选图)`、`2015-faster-r-cnn(R1)`、`ai100-2015-fcn(R2-选图)`、`1997-lstm(R1)`、`2014-attention(R1)`、`2017-transformer(R1)`、`2018-bert(R1)`、`2018-gpt(R1)`、`ai100-2014-glove(R1)`、`2014-gan(R1)`、`ai100-2014-conditional-gan(R2-选图+R3)`、`ai100-2017-wasserstein-gan(R1)`、`ai100-2005-gnn(R1)`、`2013-dqn(R1)`、`2016-alphago(R1)`、`2020-alphafold(R1)`、`ai100-1986-id3(R1)`、`ai100-1990-boosting(R2-选图)`。

#### `deep-learning`：15 个

`1956-dartmouth(R2-重复)`、`1957-perceptron(R1+R2-选图+R3)`、`1989-cnn(R1)`、`1997-lstm(R1)`、`2014-gan(R1)`、`2014-attention(R1+R2-重复)`、`2014-highway-network(R2-重复+R3)`、`2016-alphago(R1)`、`2017-transformer(R1)`、`2018-bert(R1)`、`2018-gpt(R1)`、`2020-alphafold(R1)`、`2022-post-training-intelligence(R2-重复+R3)`、`2023-agents(R2-重复+R3)`、`2025-llm-competition(R2-选图)`。

#### `gaming-ai`：10 个

`1951-strachey-draughts(R2-重复+R3)`、`2016-alphago(R1)`、`1988-td-update(R2-重复+R3)`、`1994-chinook(R2-重复+R3)`、`1997-logistello(R1+R2-重复+R3)`、`1997-deep-blue(R2-重复+R3)`、`2013-dqn(R1+R2-重复+R3)`、`2017-alphazero(R1)`、`2019-suphx(R1)`、`2019-muzero(R1+R2-重复+R3)`。

#### `humanistic-cycle`：2 个

`1973-lighthill-report(R2-选图)`、`1978-xiaolingtong(R2-选图)`。

## 6. 修正原则

建议按以下顺序修正，避免首页图与详情列表反复变化：

1. 先统一图片语义角色，确保肖像与非肖像可以可靠识别。
2. 调整各 variant 的 `assetIds`，让解释图形成末尾连续区段。
3. 抽出共享的“详情图片选择结果”，同时返回 `detailImages` 与 `commentaryMediaImage`。
4. 单屏和双屏共同使用该结果，删除事件硬编码、diagram 优先和首图保留规则。
5. 首页默认图读取 `detailImages[0]`；只有显式 override 才读取指定图片。
6. 为单图、全肖像、首图非肖像、解释图末尾、显式首页覆盖等边界补充自动测试。

## 7. 验收标准

完成修正后至少验证：

- 所有启用 variant 的解释图都位于列表末尾连续区段。
- 图片超过 1 张时，右侧图片严格等于基础列表第一张非肖像图。
- 被抽取图片不再出现在详情轮播、缩略图和全屏图片序列中。
- 图片只有 1 张时，详情保留该图，右侧不显示静态图片。
- 未配置 `overviewImageAssetId` 时，首页图片等于最终详情图片列表第一张。
- 配置 override 时，只改变首页图片。
- 单屏与双屏得到相同的详情图片列表和右侧媒体图片。
- 运行 `npm run validate:archive`、`npm run generate`、`npm run lint` 与 `npm test`。

本文件中的不一致清单是 2026-07-31 的审计快照。后续修复条目时，应同步更新数量与清单，不能只改代码而保留过期状态。
