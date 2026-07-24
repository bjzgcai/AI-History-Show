# PPT 来源替换建议：主线事件引言摘要

本文档用于替换 `manage/events.js` 中仍显示为 `From PPT page ...` / `摘自PPT第...页` 的引言来源。建议把这些内容视为“权威来源支持的引言摘要”，不一定逐字引用原文；如需使用逐字引用，后续应逐条核对原文版权、页码和译文。

## 使用原则

- `quoteText` 建议采用短摘要式表达，突出事件为什么重要。
- `quotePage` 建议写成可追溯来源名，不再写 PPT 页码。
- 优先来源顺序：原论文或原始提案、学会/出版社页面、官方项目页、权威机构或研究团队页面。
- 中文 `quotePage.zh` 应自然本地化，例如“Nature 论文页面”“OpenAI 官方论文 PDF”，不要保留英文 UI 句子。

## 汇总表

| 事件 key | 当前问题 | 建议主来源 |
|---|---|---|
| `1956-dartmouth` | PPT 来源残留 | Dartmouth AI proposal, Stanford/J. McCarthy archive |
| `1957-perceptron` | PPT 来源残留 | Rosenblatt 1958 Psychological Review paper |
| `1969-ai-winter` | PPT 来源残留，且更像历史点评 | MIT Press book record + AI history sources |
| `1986-backpropagation` | PPT 来源残留 | Nature 1986 paper |
| `1989-cnn` | PPT 来源残留 | LeCun et al. 1989/1998 CNN papers |
| `1986-rnn` | PPT 来源残留，年份与代表来源需复核 | Elman 1990 Cognitive Science paper |
| `1997-lstm` | PPT 来源残留 | Neural Computation 1997 paper |
| `2012-alexnet` | PPT 来源残留 | NeurIPS 2012 paper |
| `2014-highway-network` | PPT 来源残留，事件年份/地点也建议复核 | Highway Networks arXiv paper |
| `2015-resnet` | PPT 来源残留 | CVPR 2016 open access paper |
| `2016-densenet` | PPT 来源残留 | CVPR 2017 open access paper |
| `2014-gan` | PPT 来源残留，历史点评可再补充 | NeurIPS 2014 paper |
| `2014-attention` | PPT 来源残留 | Bahdanau et al. arXiv paper |
| `2017-transformer` | PPT 来源残留 | NeurIPS 2017 paper |
| `2018-bert` | PPT 来源残留 | BERT arXiv paper + Google Research blog |
| `2018-gpt` | PPT 来源残留 | OpenAI official paper PDF |
| `2023-agents` | PPT 来源残留，综合趋势需多来源 | ReAct paper + agent survey/background |
| `2025-llm-competition` | PPT 来源残留，动态数据需标注日期 | Chatbot Arena paper + LMArena site |
| `2020-alphafold` | PPT 来源残留 | Nature 2021 paper + DeepMind blog |
| `2019-ai-feynman` | PPT 来源残留 | Science Advances paper |
| `2024-ai-scientist` | PPT 来源残留，建议区分 AI Scientist 与 A-Lab | Sakana AI official page + arXiv paper |

## 逐条建议

### `1956-dartmouth` 达特茅斯会议

建议 `quoteText`：

```js
{
  en: "The Dartmouth proposal framed artificial intelligence as a research program: learning and other features of intelligence could, in principle, be described precisely enough for machines to simulate them.",
  zh: "达特茅斯提案把人工智能定义为一个可研究的科学计划：学习以及智能的其他特征，原则上可以被精确描述，并由机器加以模拟。"
}
```

建议 `quotePage`：

```js
{
  en: "Dartmouth Summer Research Project proposal, Stanford/J. McCarthy archive",
  zh: "达特茅斯夏季人工智能研究项目提案，斯坦福 / 约翰·麦卡锡档案"
}
```

来源：

- https://www-formal.stanford.edu/jmc/history/dartmouth/dartmouth.html

备注：这是最适合保留“AI 正式命名”叙事的原始来源。

### `1957-perceptron` 感知机与连接主义

建议 `quoteText`：

```js
{
  en: "Rosenblatt's perceptron presented a trainable model of information storage and organization, linking ideas from brain science, psychology, and machine learning.",
  zh: "罗森布拉特的感知机提出了一种可训练的信息存储与组织模型，把脑科学、心理学和机器学习早期思想连接起来。"
}
```

建议 `quotePage`：

```js
{
  en: "Rosenblatt, Psychological Review, 1958",
  zh: "罗森布拉特，Psychological Review，1958 年论文"
}
```

来源：

- https://doi.org/10.1037/h0042519
- https://psycnet.apa.org/record/1959-09865-001

备注：当前“bridge between biophysics and psychology”更像原论文立意，可改成摘要式表达，避免未经核对的逐字引用。

### `1969-ai-winter` 第一次寒冬的到来

建议 `quoteText`：

```js
{
  en: "Minsky and Papert's Perceptrons became a landmark critique of single-layer perceptrons, sharpening the field's understanding of what simple neural models could and could not represent.",
  zh: "明斯基和帕珀特的《感知机》成为对单层感知机的重要批判，促使研究者更清楚地认识简单神经模型能表示什么、不能表示什么。"
}
```

建议 `quotePage`：

```js
{
  en: "MIT Press book record: Perceptrons",
  zh: "麻省理工学院出版社《感知机》图书页面"
}
```

来源：

- https://mitpress.mit.edu/9780262631112/perceptrons/

备注：这个事件不是单篇论文突破，而是历史影响判断。建议后续再补一个 AI 史来源，例如 Nils Nilsson、Margaret Boden 或 Stanford Encyclopedia of Philosophy 的历史条目。

### `1986-backpropagation` 反向传播算法

建议 `quoteText`：

```js
{
  en: "Rumelhart, Hinton, and Williams showed that back-propagating errors could train internal representations in multilayer neural networks, making feature learning practical again.",
  zh: "鲁梅尔哈特、辛顿和威廉姆斯证明，反向传播误差可以训练多层神经网络的内部表示，使特征学习重新变得可行。"
}
```

建议 `quotePage`：

```js
{
  en: "Nature paper: Learning representations by back-propagating errors",
  zh: "Nature 论文《通过反向传播误差学习表示》"
}
```

来源：

- https://doi.org/10.1038/323533a0
- https://www.nature.com/articles/323533a0

备注：来源非常直接，可优先替换。

### `1989-cnn` 卷积神经网络

建议 `quoteText`：

```js
{
  en: "LeCun and collaborators demonstrated that convolutional networks trained with backpropagation could recognize handwritten digits by exploiting local image structure.",
  zh: "勒昆及合作者展示了用反向传播训练的卷积网络可以利用图像局部结构识别手写数字，为现代计算机视觉奠定了重要基础。"
}
```

建议 `quotePage`：

```js
{
  en: "LeCun et al., Neural Computation / Bell Labs publication",
  zh: "勒昆等，Neural Computation / 贝尔实验室论文"
}
```

来源：

- https://doi.org/10.1162/neco.1989.1.4.541
- http://yann.lecun.com/exdb/publis/pdf/lecun-89e.pdf
- http://yann.lecun.com/exdb/publis/pdf/lecun-98.pdf

备注：若页面标题强调 1989，主来源用 1989 zip code recognition；若强调 LeNet-5，则可补 1998 document recognition 论文。

### `1986-rnn` 循环神经网络

建议 `quoteText`：

```js
{
  en: "Recurrent networks introduced explicit state over time, allowing neural models to process sequences by carrying information from earlier inputs into later computations.",
  zh: "循环神经网络引入了随时间变化的内部状态，使神经模型能够把早先输入的信息带入后续计算，从而处理序列数据。"
}
```

建议 `quotePage`：

```js
{
  en: "Elman, Cognitive Science, 1990: Finding Structure in Time",
  zh: "埃尔曼，Cognitive Science，1990 年《在时间中发现结构》"
}
```

来源：

- https://doi.org/10.1207/s15516709cog1402_1

备注：当前事件年份写 1986，但常见权威引用多指 Jordan 1986 与 Elman 1990。建议后续单独复核标题、年份、人物和引言来源。

### `1997-lstm` LSTM 与门控机制

建议 `quoteText`：

```js
{
  en: "Hochreiter and Schmidhuber introduced LSTM to preserve error signals across long time spans, addressing a central weakness of ordinary recurrent networks.",
  zh: "霍赫赖特和施密德胡伯提出 LSTM，用门控结构在长时间跨度中保持误差信号，回应了普通循环网络难以学习长期依赖的核心问题。"
}
```

建议 `quotePage`：

```js
{
  en: "Neural Computation paper: Long Short-Term Memory",
  zh: "Neural Computation 论文《长短期记忆》"
}
```

来源：

- https://doi.org/10.1162/neco.1997.9.8.1735
- https://www.bioinf.jku.at/publications/older/2604.pdf

备注：可保留“long time lags / error flow”的核心表述，但建议用摘要式中文重写。

### `2012-alexnet` AlexNet 与 ImageNet

建议 `quoteText`：

```js
{
  en: "AlexNet showed that a large deep convolutional network, trained on ImageNet with GPUs and modern regularization, could dramatically improve large-scale visual recognition.",
  zh: "AlexNet 证明，利用 GPU、大规模 ImageNet 数据和现代正则化方法训练的大型深度卷积网络，可以显著提升大规模视觉识别效果。"
}
```

建议 `quotePage`：

```js
{
  en: "NeurIPS 2012 paper: ImageNet Classification with Deep Convolutional Neural Networks",
  zh: "NeurIPS 2012 论文《使用深度卷积神经网络进行 ImageNet 分类》"
}
```

来源：

- https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks

备注：当前引言可从论文摘要支持，但中文应避免“错误率大幅降低”而不说明机制。

### `2014-highway-network` 高速网络

建议 `quoteText`：

```js
{
  en: "Highway Networks used learned gates to regulate information flow, showing that very deep feedforward networks could be trained before residual networks became dominant.",
  zh: "高速网络用可学习的门控调节信息流，证明在残差网络成为主流之前，极深的前馈网络也可以被训练。"
}
```

建议 `quotePage`：

```js
{
  en: "arXiv paper: Highway Networks",
  zh: "arXiv 论文《高速网络》"
}
```

来源：

- https://arxiv.org/abs/1505.00387

备注：事件年份当前为 2014，但论文常用 arXiv 版本为 2015；地点和人物字段也建议一并复核。

### `2015-resnet` ResNet

建议 `quoteText`：

```js
{
  en: "ResNet reformulated layers as residual functions and used identity shortcuts, making it possible to optimize much deeper visual recognition networks.",
  zh: "ResNet 把网络层重新表述为残差函数，并使用恒等捷径连接，使更深的视觉识别网络能够被有效优化。"
}
```

建议 `quotePage`：

```js
{
  en: "CVPR 2016 paper: Deep Residual Learning for Image Recognition",
  zh: "CVPR 2016 论文《用于图像识别的深度残差学习》"
}
```

来源：

- https://openaccess.thecvf.com/content_cvpr_2016/html/He_Deep_Residual_Learning_CVPR_2016_paper.html

备注：当前英文接近论文摘要，建议改为摘要式点评并保留 CVPR 官方来源。

### `2016-densenet` DenseNet

建议 `quoteText`：

```js
{
  en: "DenseNet connected each layer to all later layers, improving feature reuse and gradient flow while encouraging compact convolutional models.",
  zh: "DenseNet 将每一层连接到后续所有层，增强了特征复用和梯度流动，也推动了更紧凑的卷积模型设计。"
}
```

建议 `quotePage`：

```js
{
  en: "CVPR 2017 paper: Densely Connected Convolutional Networks",
  zh: "CVPR 2017 论文《密集连接卷积网络》"
}
```

来源：

- https://openaccess.thecvf.com/content_cvpr_2017/html/Huang_Densely_Connected_Convolutional_CVPR_2017_paper.html

备注：当前引言可由论文摘要支持，但可以写得更像策展点评。

### `2014-gan` 生成对抗网络

建议 `quoteText`：

```js
{
  en: "GANs framed generative modeling as a competition between a generator and a discriminator, turning adversarial training into a central idea in modern generative AI.",
  zh: "GAN 把生成建模表述为生成器与判别器之间的竞争，使对抗训练成为现代生成式 AI 的核心思想之一。"
}
```

建议 `quotePage`：

```js
{
  en: "NeurIPS 2014 paper: Generative Adversarial Nets",
  zh: "NeurIPS 2014 论文《生成对抗网络》"
}
```

来源：

- https://papers.nips.cc/paper/5423-generative-adversarial-nets

备注：如果保留“早期前驱与流行即发明”的历史评价，建议额外引用 Schmidhuber 相关论文或作者回顾，避免只靠策展口吻。

### `2014-attention` 注意力机制

建议 `quoteText`：

```js
{
  en: "Bahdanau, Cho, and Bengio introduced attention for neural machine translation, allowing the decoder to focus on relevant source positions instead of relying on one fixed vector.",
  zh: "Bahdanau、Cho 和 Bengio 在神经机器翻译中引入注意力，使解码器能够关注相关源语言位置，而不再只依赖一个固定长度向量。"
}
```

建议 `quotePage`：

```js
{
  en: "arXiv paper: Neural Machine Translation by Jointly Learning to Align and Translate",
  zh: "arXiv 论文《通过联合学习对齐与翻译的神经机器翻译》"
}
```

来源：

- https://arxiv.org/abs/1409.0473

备注：当前引言内容方向正确，来源替换即可。

### `2017-transformer` Transformer

建议 `quoteText`：

```js
{
  en: "The Transformer replaced recurrence and convolution with self-attention, creating a scalable architecture that became the foundation for modern language models.",
  zh: "Transformer 用自注意力替代循环和卷积，形成了一种可扩展架构，并成为现代语言模型的基础。"
}
```

建议 `quotePage`：

```js
{
  en: "NeurIPS 2017 paper: Attention Is All You Need",
  zh: "NeurIPS 2017 论文《注意力就是你所需要的一切》"
}
```

来源：

- https://papers.nips.cc/paper/7181-attention-is-all-you-need
- https://arxiv.org/abs/1706.03762

备注：NeurIPS 页面和 arXiv 都可用；前端来源卡片可优先放 NeurIPS。

### `2018-bert` BERT

建议 `quoteText`：

```js
{
  en: "BERT made bidirectional Transformer pretraining a practical default for language understanding, combining masked language modeling with task-specific fine-tuning.",
  zh: "BERT 让双向 Transformer 预训练成为语言理解任务中的实用范式，并将掩码语言模型与任务微调结合起来。"
}
```

建议 `quotePage`：

```js
{
  en: "BERT paper and Google Research release note",
  zh: "BERT 论文与 Google Research 发布说明"
}
```

来源：

- https://arxiv.org/abs/1810.04805
- https://research.google/blog/open-sourcing-bert-state-of-the-art-pre-training-for-natural-language-processing/

备注：当前来源写 PPT，但 Google 官方发布说明更适合作为“影响”说明。

### `2018-gpt` GPT

建议 `quoteText`：

```js
{
  en: "OpenAI's GPT showed that generative pretraining on unlabeled text, followed by task adaptation, could transfer strongly across language understanding benchmarks.",
  zh: "OpenAI 的 GPT 证明，在无标注文本上进行生成式预训练，再针对任务进行适配，可以在多种语言理解基准上实现有效迁移。"
}
```

建议 `quotePage`：

```js
{
  en: "OpenAI official paper: Improving Language Understanding by Generative Pre-Training",
  zh: "OpenAI 官方论文《通过生成式预训练改进语言理解》"
}
```

来源：

- https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf
- https://openai.com/index/language-unsupervised/

备注：当前引言可由 OpenAI 官方论文支持；建议不要在这个 `quoteText` 中跳到 ChatGPT，ChatGPT 可放在正文 legacy 段。

### `2023-agents` LLM 驱动的智能体

建议 `quoteText`：

```js
{
  en: "ReAct and related systems showed how language models could interleave reasoning traces with actions, turning LLMs from text predictors into components of tool-using agents.",
  zh: "ReAct 及相关系统展示了语言模型如何交错生成推理轨迹与行动，使 LLM 从文本预测器延伸为可调用工具的智能体组件。"
}
```

建议 `quotePage`：

```js
{
  en: "ReAct paper: Synergizing Reasoning and Acting in Language Models",
  zh: "ReAct 论文《在语言模型中协同推理与行动》"
}
```

来源：

- https://arxiv.org/abs/2210.03629

补充建议来源：

- Russell & Norvig, Artificial Intelligence: A Modern Approach, agent framework background
- Michael Wooldridge, multi-agent systems background

备注：这是综合趋势事件，单靠 ReAct 不足以覆盖“智能体理论”全貌。建议右侧 sources 至少加入一本权威教材或综述。

### `2025-llm-competition` 大语言模型百花齐放

建议 `quoteText`：

```js
{
  en: "Chatbot Arena introduced large-scale human-preference evaluation for language models, making public model comparison a visible part of the LLM ecosystem.",
  zh: "Chatbot Arena 引入了面向语言模型的大规模人类偏好评测，使公开模型比较成为大语言模型生态中可见的一部分。"
}
```

建议 `quotePage`：

```js
{
  en: "Chatbot Arena paper and LMArena public leaderboard",
  zh: "Chatbot Arena 论文与 LMArena 公开排行榜"
}
```

来源：

- https://arxiv.org/abs/2403.04132
- https://lmarena.ai/

备注：榜单是动态数据。页面如展示排名，应注明具体日期；截至本文档生成日为 2026-07-13。

### `2020-alphafold` AlphaFold

建议 `quoteText`：

```js
{
  en: "AlphaFold2 combined deep learning with evolutionary and geometric signals to predict protein structures with a level of accuracy that changed structural biology workflows.",
  zh: "AlphaFold2 将深度学习与进化、几何信号结合起来，以足以改变结构生物学工作流程的精度预测蛋白质结构。"
}
```

建议 `quotePage`：

```js
{
  en: "Nature paper and DeepMind AlphaFold announcement",
  zh: "Nature 论文与 DeepMind AlphaFold 官方说明"
}
```

来源：

- https://www.nature.com/articles/s41586-021-03819-2
- https://deepmind.google/discover/blog/alphafold-a-solution-to-a-50-year-old-grand-challenge-in-biology/

备注：论文适合技术依据，DeepMind/CASP 叙事适合“50 年挑战”这类影响表述。

### `2019-ai-feynman` AI Feynman

建议 `quoteText`：

```js
{
  en: "AI Feynman combined neural-network fitting with physics-inspired constraints to recover symbolic equations from data, pointing toward AI-assisted scientific discovery.",
  zh: "AI Feynman 将神经网络拟合与受物理启发的约束结合起来，从数据中恢复符号方程，指向 AI 辅助科学发现的路径。"
}
```

建议 `quotePage`：

```js
{
  en: "Science Advances paper: AI Feynman",
  zh: "Science Advances 论文《AI Feynman》"
}
```

来源：

- https://www.science.org/doi/10.1126/sciadv.aay2631
- https://arxiv.org/abs/1905.11481

备注：当前引言里的 100/71 数字来自论文摘要，可在正文中保留；顶部引言建议更概括。

### `2024-ai-scientist` AI 科学家与自主实验室

建议 `quoteText`：

```js
{
  en: "The AI Scientist explored an end-to-end research loop in which foundation models generate ideas, run experiments, write papers, and review results, while autonomous labs pushed similar automation into physical experimentation.",
  zh: "AI Scientist 探索了由基础模型生成想法、运行实验、撰写论文并评审结果的端到端研究循环；自主实验室则把类似自动化推进到真实物理实验。"
}
```

建议 `quotePage`：

```js
{
  en: "Sakana AI official project page and arXiv paper: The AI Scientist",
  zh: "Sakana AI 官方项目页与 arXiv 论文《AI Scientist》"
}
```

来源：

- https://sakana.ai/ai-scientist/
- https://arxiv.org/abs/2408.06292

补充建议来源：

- https://www.nature.com/articles/s41586-023-06792-0

备注：当前事件同时讲 Sakana AI Scientist 和 Berkeley A-Lab，建议来源也拆成两类，避免一个 quotePage 覆盖两个不同系统。

## 建议后续改动顺序

1. 先批量替换 21 个事件的 `quotePage`，消除 PPT 来源残留。
2. 再把 `quoteText` 从“疑似原文摘句”改为本文档建议的摘要式表达。
3. 单独复核 `1986-rnn`、`2014-highway-network`、`2014-gan`、`2023-agents`、`2025-llm-competition`、`2024-ai-scientist`，这些更依赖历史解释或趋势判断。
4. 修改 `manage/events.js` 后运行：

```bash
node manage/generate.js
npm run lint
npm test
```

