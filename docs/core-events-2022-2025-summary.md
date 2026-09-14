# 2022-2025 年 AI 核心事件梳理

- 状态：工作草案，尚未转化为生产 Archive 变更
- 整理日期：2026-08-04
- 用途：统一 2022-2025 年事件筛选口径，记录当前判断，并为后续逐项研究、合并和实现提供依据
- 生产边界：本文不是运行时数据源，不应直接替代 `archive/events/` 或 `archive/storylines/`

## 1. 筛选标准

一个成果适合作为独立历史节点，应尽量同时满足以下条件：

1. **范式转折**：改变模型训练、推理、交互、科学研究或治理方式，而不只是刷新单项指标。
2. **持续影响**：至少在后续两到三年仍能看到明确的技术、产业或社会影响。
3. **独立性**：能够讲出与相邻成果不同的历史故事，避免把同一技术链拆成多个近似页面。
4. **证据强度**：有主论文、官方发布、法律文本、权威奖项或可复核评测，而不是主要依赖厂商宣传。
5. **展示价值**：可以通过架构、流程、数据流、对比实验或互动演示解释其核心机制。
6. **领域覆盖**：整体清单兼顾基础模型、多模态、生成模型、具身智能、AI for Science、开放生态和治理。

本文使用三种处理结论：

- **核心保留**：适合独立成为历史节点。
- **合并或重构**：成果重要，但应与相邻事件组成更清晰的主题，或改变当前页面叙事中心。
- **降级或候选**：可作为背景材料、技术前驱或观察项，暂不建议占用独立核心节点。

## 2. 总体结论

2022-2025 年的主线不是简单的“模型越来越大”，而是五条相互连接的变化：

1. 2022 年，基础模型从预训练扩展转向指令微调、偏好对齐和显式推理，ChatGPT 将这套路线推向大众。
2. 2022-2023 年，开放模型、潜扩散和低成本适配扩大了前沿能力的传播范围。
3. 2023-2024 年，多模态助手、智能体和工具连接开始形成新的应用接口。
4. 2024-2025 年，推理时计算和强化学习推理成为前沿模型的重要能力来源。
5. AI for Science 与治理同步进入制度化阶段：AlphaFold 路线获得诺贝尔奖认可，欧盟 AI Act 开始实施。

## 3. 2022 年

### 3.1 建议核心节点

| 事件 | 当前项目状态 | 结论 | 核心理由 | 后续动作 |
| --- | --- | --- | --- | --- |
| Chinchilla 与计算最优缩放 | 尚无独立核心事件 | 候选新增 | 证明固定计算预算下应增加训练数据、缩小模型规模，修正了单纯扩大参数量的路线，并直接影响后续 LLaMA 等模型设计。 | 核实是否属于目标评选范围；准备主论文与 PaLM 对照。 |
| Whisper | 已在 2022 年度精选中 | 核心保留 | 大规模多语种弱监督训练成为稳健语音识别的实用路线，并形成长期使用的开放语音基础设施。 | 保留现有页面，复核开放发布和长期影响表述。 |
| InstructGPT | 已在 2022 年度精选中；主线另有 `2022-post-training-intelligence` | 核心保留 | 将监督微调、奖励模型和 RLHF 组合成可复用的助手后训练范式。 | 保留年度成就；在主线页面中作为方法起点，避免重复叙述。 |
| Chain-of-Thought Prompting | 已在 2022 年度精选中 | 核心保留 | 证明示例中的中间步骤可以显化大模型推理能力，是自洽性、过程监督和推理模型的重要前驱。 | 保留，并与 2024-2025 推理模型建立后续关系。 |
| ChatGPT | 已在 2022 年度精选中 | 核心保留 | 将通用语言模型带入大众使用，改变搜索、写作、编程、教育和人机交互预期。 | 保留；强调社会采用和交互转折，不与 InstructGPT 重复讲训练流程。 |
| 潜扩散与 Stable Diffusion | 潜扩散在年度精选；Stable Diffusion 另有非 canonical Archive 事件 | 合并或双层展示 | 潜扩散解决生成成本问题，Stable Diffusion 的开放权重发布又改变了技术传播、创作工具和争议规模。 | 决定保留“方法 + 发布”双层结构，还是合并为一个完整历史节点。 |
| AlphaTensor | 已在 2022 年度精选中 | 核心保留 | 学习式搜索发现新的矩阵乘法算法，形成通往 AlphaDev、AlphaEvolve 的算法发现路线。 | 保留，并在长期影响中连接 2025 AlphaEvolve。 |

### 3.2 建议合并或降级的现有事件

| 事件 | 结论 | 原因与建议 |
| --- | --- | --- |
| PaLM | 合并或重构 | 作为 5400 亿参数模型和 Pathways 工程案例有历史价值，但不宜把“涌现能力”写成没有争议的确定结论。建议与 Chinchilla 组成“规模化路线与数据效率修正”。 |
| SayCan | 跨年合并 | 是语言模型约束机器人规划的重要早期工作，但更适合与 2023 PaLM-E、RT-2 组成“语言模型进入具身智能”的连续事件。 |
| Swin Transformer V2 | 降级 | 是重要的视觉 Transformer 扩展工作，但主要是对 Swin Transformer 的训练和分辨率迁移改进，独立历史转折不足。 |
| SimMIM | 降级 | 方法简洁，但长期代表性弱于 MAE，并与 Swin Transformer V2 的团队、模型扩展和页面叙事明显重叠。 |

## 4. 2023 年

### 4.1 建议核心节点

| 事件 | 当前项目状态 | 结论 | 核心理由 | 后续动作 |
| --- | --- | --- | --- | --- |
| LLaMA | 已在 2023 年度精选中 | 核心保留 | 推动开放权重模型、量化、本地部署和社区微调生态形成。 | 保留；准确区分公开训练数据、受限研究许可和后续权重传播。 |
| GPT-4 | 已在 2023 年度精选中 | 核心保留 | 代表前沿大模型进入多模态阶段，并使技术报告、系统卡和安全评估成为重要发布组成。 | 保留；避免用不透明产品细节推断具体架构。 |
| BLIP-2 与 LLaVA | 两项均在年度精选中 | 合并为核心主题 | BLIP-2 展示冻结单模态模型的桥接方式，LLaVA 推动开放视觉指令微调和多模态助手生态。两者共同讲述“多模态助手形成”比拆成两个页面更清楚。 | 优先保留 LLaVA 为展示入口，BLIP-2 作为技术前驱卡片；也可新建合并事件。 |
| ControlNet | 已在 2023 年度精选中 | 核心保留 | 将边缘、深度、姿态等空间条件稳定注入扩散模型，成为生成图像控制工作流的基础技术。 | 保留；弱化厂商或社区热度，突出零卷积和冻结主干机制。 |
| Segment Anything | 已在 2023 年度精选中 | 核心保留 | 将图像分割转化为可提示任务，并以大规模数据引擎和通用掩码接口形成视觉基础模型范式。 | 保留；统一标题为 `Segment Anything`。 |
| ESMFold | 已在 2023 年度精选中 | 核心保留 | 展示蛋白质语言模型可从单条序列快速预测结构，并支持超大规模宏基因组探索。 | 保留；明确 2022 年公开与 2023 年论文发表的时间差。 |

### 4.2 建议合并、重构或补充研究的事件

| 事件 | 结论 | 原因与建议 |
| --- | --- | --- |
| Claude | 重构 | 单纯的产品发布不足以构成技术转折。建议以“Constitutional AI 与 AI 反馈对齐”为中心，Claude 作为方法落地案例。 |
| PaLM-E | 跨年合并 | 与 SayCan 属于同一具身智能演化链。后续研究应纳入 RT-2，解释从语言规划到视觉-语言-动作模型的变化。 |
| Gen-2 | 重构或降级 | 可代表文本生成视频走向产品化，但不应主要依赖 Runway 自报的用户偏好数字。建议扩展为“生成式视频进入可用阶段”，并加入同期系统对照。 |
| DPO | 候选新增 | 直接偏好优化简化了偏好对齐流程，并在后续开放模型后训练中广泛使用，长期影响强于部分单一产品发布。 |
| QLoRA | 候选新增 | 通过量化和低秩适配显著降低大模型微调成本，是开放模型生态扩张的重要基础。 |
| GraphCast | 候选新增 | AI 天气预报达到具有实际意义的预测能力，是 2023 年 AI for Science 的强候选节点。 |

## 5. 2024 年

| 事件 | 建议结论 | 核心理由 | 与当前项目的关系 |
| --- | --- | --- | --- |
| AlphaFold 3 | 核心保留或作为 AlphaFold 第二阶段 | 从蛋白质结构扩展到蛋白质、DNA、RNA、小分子和离子等生物分子复合物的联合结构预测，明显推进药物发现和分子建模。 | 可扩充 `2020-alphafold`，也可独立建立 2024 后续节点。 |
| o1 与推理时计算 | 核心保留，但优先并入方法主线 | 前沿模型开始通过更长推理过程和推理时计算提升数学、编程及科学能力，推动研究重心从预训练规模转向后训练和推理预算。 | 扩充 `2022-post-training-intelligence`，形成 InstructGPT、CoT、o1、R1 的连续路线。 |
| AI 研究获得诺贝尔奖双重认可 | 核心独立事件 | 物理学奖认可神经网络基础工作，化学奖认可计算蛋白设计与结构预测，代表 AI 同时进入基础科学史和应用科学史的最高制度评价。 | 当前无对应事件，适合新增科学史节点。 |
| Model Context Protocol | 核心主题或智能体后续阶段 | MCP 为模型连接数据、工具和开发环境提供开放协议，2025 年成为智能体工具生态的重要基础设施。 | 扩充 `2023-agents`，避免只描述抽象自主规划。 |
| 欧盟 AI Act 生效 | 核心治理事件 | 2024 年 8 月 1 日生效，是全球首个综合性的 AI 法律框架，标志着 AI 治理由原则讨论进入法律实施。 | 当前技术主线缺少治理节点；需要决定是否新增治理分类或放入人文周期。 |
| IMO 银牌水平 | 合并为 2024-2025 推理能力序列 | AlphaProof 与 AlphaGeometry 2 在 2024 IMO 解出四题并获 28/42 分，为 2025 自然语言端到端金牌结果提供清晰前驱。 | 建议作为 2025 IMO 金牌事件的前置阶段，不单独占用页面。 |
| AI Scientist 与自主实验室 | 保留主题但必须重写 | 自主研究流程值得展示，但当前页面把 2023 A-Lab 与 2024 AI Scientist 合并，并存在“通过顶会评审”等过度表述风险。 | 重写 `2024-ai-scientist` 的日期、证据边界和贡献描述。 |

## 6. 2025 年

| 事件 | 建议结论 | 核心理由 | 与当前项目的关系 |
| --- | --- | --- | --- |
| DeepSeek-R1 | 核心独立事件 | 通过强化学习激发推理行为，并以开放权重和技术报告改变推理模型的成本、开放生态和全球竞争预期。 | 应重构 `2025-llm-competition`，以 R1 为中心，LMArena 和模型竞争作为背景。 |
| AI 达到 IMO 金牌水平 | 核心独立事件 | Gemini Deep Think 解出六题中的五题，获得 35/42 分；系统直接读取自然语言题目，并在比赛时限内生成证明。 | 当前无对应事件。应与 2024 银牌结果组成可交互的能力进展演示。 |
| AlphaEvolve | 核心候选 | 将语言模型、自动评估和进化搜索结合，用于发现和改进可部署算法，延续 AlphaTensor 的算法发现路线。 | 当前无对应事件；需要等待更多独立研究和长期采用证据后确定最终级别。 |
| 通用人工智能模型义务开始适用 | 合并到 AI Act 序列 | 2025 年 8 月 2 日，欧盟 AI Act 的治理规则和 GPAI 模型义务开始适用，使训练内容透明度、版权和系统性风险要求进入执行阶段。 | 不建议与 2024 AI Act 拆成两个页面，应作为同一治理事件的第二阶段。 |
| AI 编程智能体普及 | 观察项 | 2025 年编程智能体从补全工具转向读取代码库、调用工具和执行多步骤任务，但候选产品较多，尚需确定一个不依赖厂商营销的历史锚点。 | 可作为 `2023-agents` 的行业落地材料，暂不新增独立事件。 |
| AI 发现药物的临床进展 | 观察项 | 部分 AI 发现或设计药物公布临床阶段结果，但定义、归因和同行评议状态仍需严格核实。 | 暂不进入生产清单，建立来源 dossier 后再判断。 |

## 7. 当前 2022-2023 二十项事件的处理结论

| 当前事件 | 处理结论 |
| --- | --- |
| Swin Transformer V2 | 降级为背景或替换 |
| SimMIM | 降级为背景或替换 |
| Whisper | 核心保留 |
| PaLM | 与 Chinchilla 合并重构 |
| InstructGPT | 核心保留 |
| Chain-of-Thought Prompting | 核心保留 |
| ChatGPT | 核心保留 |
| Latent Diffusion Models | 核心保留，并决定是否与 Stable Diffusion 合并 |
| AlphaTensor | 核心保留 |
| SayCan | 与 PaLM-E、RT-2 合并 |
| LLaMA | 核心保留 |
| GPT-4 | 核心保留 |
| Claude | 改为 Constitutional AI 中心叙事 |
| BLIP-2 | 作为 LLaVA 技术前驱或合并 |
| LLaVA | 核心保留或作为多模态合并事件入口 |
| PaLM-E | 与 SayCan、RT-2 合并 |
| ControlNet | 核心保留 |
| Segment Anything | 核心保留 |
| Gen-2 | 扩展为生成式视频主题或降级 |
| ESMFold | 核心保留，并校正时间说明 |

## 8. 建议的跨年度历史骨架

以下结构用于后续讨论，不代表已经批准的新 storyline：

### 2022：后训练、推理与开放生成

1. Chinchilla 与计算最优缩放
2. InstructGPT 与 RLHF
3. Chain-of-Thought Prompting
4. ChatGPT 大众化
5. Whisper
6. 潜扩散与 Stable Diffusion
7. AlphaTensor

### 2023：开放模型与多模态系统

1. LLaMA 与开放权重生态
2. GPT-4
3. Constitutional AI 与 Claude
4. BLIP-2、LLaVA 与多模态助手
5. ControlNet
6. Segment Anything
7. ESMFold
8. 具身基础模型：SayCan、PaLM-E 与 RT-2

### 2024：推理、科学认可与制度化

1. AlphaFold 3
2. o1 与推理时计算
3. AI 研究获得诺贝尔物理学奖、化学奖认可
4. MCP 与智能体工具协议
5. 欧盟 AI Act 生效
6. IMO 银牌水平，作为 2025 金牌事件的前驱

### 2025：开放推理与算法发现

1. DeepSeek-R1
2. AI 达到 IMO 金牌水平
3. AlphaEvolve
4. 欧盟 GPAI 义务适用，作为 AI Act 第二阶段

## 9. 后续处理顺序

1. 确认最终策展容量：按年度固定数量，还是按历史重要性动态分配。
2. 对 2022-2023 当前二十项作正式保留、合并、替换决策。
3. 优先核实四个高价值候选：Chinchilla、DPO、QLoRA、GraphCast。
4. 修正现有高风险表述：AI Scientist、LLaMA 许可边界、ESMFold 年份、Gen-2 自报评测。
5. 决定 AlphaFold 3、o1、MCP 是扩充既有事件还是新增独立事件。
6. 将 `2025-llm-competition` 重构为有清晰历史锚点的 DeepSeek-R1 事件。
7. 为治理事件确定 storyline 归属和交互展示方式。
8. 每项通过策展决策后，再分别建立来源 dossier、资源清单、人物排序、双语内容和 quiz。
9. 实施 Archive 变更后运行项目规定的全部生成与质量门禁。

## 10. 已确认的主要参考入口

### 当前项目资料

- 2022-2023 年度精选 storyline：`archive/storylines/bench-council-ai100-2022-2023.json`
- 年度事件研究目录：`research/benchcouncil-ai100/annual-events-2022/`、`research/benchcouncil-ai100/annual-events-2023/`
- 深度学习主线：`archive/storylines/deep-learning.json`
- Stable Diffusion 非 canonical 事件：`archive/events/ai100-2022-stable-diffusion/`

### 2022-2023 候选事件主论文

- Chinchilla, Training Compute-Optimal Large Language Models: https://arxiv.org/abs/2203.15556
- Constitutional AI: Harmlessness from AI Feedback: https://arxiv.org/abs/2212.08073
- Direct Preference Optimization: https://arxiv.org/abs/2305.18290
- QLoRA: Efficient Finetuning of Quantized LLMs: https://arxiv.org/abs/2305.14314
- RT-2: Vision-Language-Action Models: https://arxiv.org/abs/2307.15818
- GraphCast, Science: https://www.science.org/doi/10.1126/science.adi2336

### 2024-2025 原始或权威资料

- AlphaFold 3, Nature: https://www.nature.com/articles/s41586-024-07487-w
- OpenAI o1 preview: https://openai.com/index/introducing-openai-o1-preview/
- Nobel Prize in Physics 2024: https://www.nobelprize.org/prizes/physics/2024/press-release/
- Nobel Prize in Chemistry 2024: https://www.nobelprize.org/prizes/chemistry/2024/press-release/
- Model Context Protocol: https://www.anthropic.com/news/model-context-protocol
- EU AI Act: https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai
- DeepSeek-R1 paper: https://arxiv.org/abs/2501.12948
- DeepSeek-R1 release: https://api-docs.deepseek.com/news/news250120/
- IMO 2024 silver-medal-level result: https://deepmind.google/discover/blog/ai-solves-imo-problems-at-silver-medal-level/
- IMO 2025 gold-medal-level result: https://deepmind.google/discover/blog/advanced-version-of-gemini-with-deep-think-officially-achieves-gold-medal-standard-at-the-international-mathematical-olympiad/
- AlphaEvolve: https://deepmind.google/discover/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/
- Stanford AI Index 2025: https://hai.stanford.edu/ai-index/2025-ai-index-report

## 11. 尚未解决的问题

- 年度精选是否必须继续维持每年十项，还是允许按历史重要性调整数量。
- BenchCouncil 年度榜单之外的事件能否进入同一 storyline，或应新建跨年度策展 storyline。
- 技术方法和社会事件是否共用同一层级，例如 InstructGPT 与 ChatGPT、AlphaFold 3 与诺贝尔奖。
- 具身智能、多模态助手和智能体协议是否分别成章，还是组成一条连续分支。
- 2025 年事件仍较新，AlphaEvolve、编程智能体和 AI 药物临床进展需要多长观察期后才能定级。
