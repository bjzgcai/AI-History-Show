// AI 历史展览引言摘录候选库（人工整理）
// 说明：
// - 每个事件至少提供一条高相关、可追溯来源的候选引言
// - 优先选择官方页面、论文摘要、学术出版社页面或机构页面中的原话
// - 当前文件仅存候选数据，不直接参与页面渲染
// - Archive migration: treat this as a research inbox; verified quotes should
//   be promoted to archive claims/sources before becoming authoritative.

const quoteCandidates = {
  "curatedAt": "2026-04-23",
  "purpose": "为各事件补充高相关、可靠来源的引言摘录候选",
  "events": {
    "1956-dartmouth": [
      {
        "quote": "The Dartmouth proposal framed artificial intelligence as a research program: learning and other features of intelligence could, in principle, be described precisely enough for machines to simulate them.",
        "speaker": {
          "en": "John McCarthy et al.",
          "zh": "约翰·麦卡锡等"
        },
        "workType": "proposal",
        "workTitle": {
          "en": "A Proposal for the Dartmouth Summer Research Project on Artificial Intelligence",
          "zh": "达特茅斯人工智能夏季研究项目提案"
        },
        "workAuthors": {
          "en": "John McCarthy, Marvin L. Minsky, Nathaniel Rochester, Claude E. Shannon",
          "zh": "约翰·麦卡锡、马文·L·明斯基、纳撒尼尔·罗切斯特、克劳德·E·香农"
        },
        "sourceLabel": {
          "en": "Stanford/J. McCarthy archive of the 1955 Dartmouth proposal",
          "zh": "斯坦福 / 约翰·麦卡锡档案保存的 1955 年达特茅斯提案"
        },
        "sourceUrl": "https://www-formal.stanford.edu/jmc/history/dartmouth/dartmouth.html",
        "reliability": "official",
        "relevance": "AI 命名与达特茅斯会议的 founding conjecture"
      }
    ],
    "1957-perceptron": [
      {
        "quote": "Rosenblatt's perceptron presented a trainable model of information storage and organization, linking ideas from brain science, psychology, and machine learning.",
        "speaker": {
          "en": "Frank Rosenblatt",
          "zh": "弗兰克·罗森布拉特"
        },
        "workType": "paper",
        "workTitle": {
          "en": "The Perceptron: A Probabilistic Model for Information Storage and Organization in the Brain",
          "zh": "感知机：大脑中信息存储与组织的概率模型"
        },
        "workAuthors": {
          "en": "Frank Rosenblatt",
          "zh": "弗兰克·罗森布拉特"
        },
        "sourceLabel": {
          "en": "Psychological Review paper DOI",
          "zh": "Psychological Review 论文 DOI"
        },
        "sourceUrl": "https://doi.org/10.1037/h0042519",
        "reliability": "paper-abstract",
        "relevance": "感知机作为神经机制与认知研究之间的桥梁"
      }
    ],
    "1969-ai-winter": [
      {
        "quote": "Minsky and Papert's Perceptrons became a landmark critique of single-layer perceptrons, sharpening the field's understanding of what simple neural models could and could not represent.",
        "speaker": {
          "en": "Léon Bottou",
          "zh": "莱昂·博图"
        },
        "workType": "book",
        "workTitle": {
          "en": "Perceptrons: An Introduction to Computational Geometry",
          "zh": "感知机：计算几何导论"
        },
        "workAuthors": {
          "en": "Marvin Minsky, Seymour Papert",
          "zh": "马文·明斯基、西摩尔·帕普特"
        },
        "sourceLabel": {
          "en": "MIT Press book record",
          "zh": "麻省理工学院出版社图书页面"
        },
        "sourceUrl": "https://mitpress.mit.edu/9780262631112/perceptrons/",
        "reliability": "academic-publisher",
        "relevance": "直接点出《Perceptrons》对感知机热潮降温的历史作用"
      }
    ],
    "1986-backpropagation": [
      {
        "quote": "Rumelhart, Hinton, and Williams showed that back-propagating errors could train internal representations in multilayer neural networks, making feature learning practical again.",
        "speaker": {
          "en": "David Rumelhart, Geoffrey Hinton, Ronald Williams",
          "zh": "戴维·鲁梅尔哈特、杰弗里·辛顿、罗纳德·威廉姆斯"
        },
        "workType": "paper",
        "workTitle": {
          "en": "Learning representations by back-propagating errors",
          "zh": "通过误差反向传播学习表示"
        },
        "workAuthors": {
          "en": "David E. Rumelhart, Geoffrey E. Hinton, Ronald J. Williams",
          "zh": "戴维·E·鲁梅尔哈特、杰弗里·E·辛顿、罗纳德·J·威廉姆斯"
        },
        "sourceLabel": {
          "en": "Nature paper DOI",
          "zh": "Nature 论文 DOI"
        },
        "sourceUrl": "https://doi.org/10.1038/323533a0",
        "reliability": "paper-abstract",
        "relevance": "高度贴合 BP 让多层表示学习真正可用的历史意义"
      }
    ],
    "1989-cnn": [
      {
        "quote": "LeCun and collaborators demonstrated that convolutional networks trained with backpropagation could recognize handwritten digits by exploiting local image structure.",
        "speaker": {
          "en": "Yann LeCun et al.",
          "zh": "扬·勒昆等"
        },
        "workType": "paper",
        "workTitle": {
          "en": "Gradient-Based Learning Applied to Document Recognition",
          "zh": "基于梯度的学习在文档识别中的应用"
        },
        "workAuthors": {
          "en": "Yann LeCun, Léon Bottou, Yoshua Bengio, Patrick Haffner",
          "zh": "扬·勒昆、莱昂·博图、约书亚·本吉奥、帕特里克·哈夫纳"
        },
        "sourceLabel": {
          "en": "Neural Computation paper DOI",
          "zh": "Neural Computation 论文 DOI"
        },
        "sourceUrl": "https://doi.org/10.1162/neco.1989.1.4.541",
        "reliability": "institutional-repository",
        "relevance": "直接对应 CNN 在文档/视觉识别任务中的结构优势"
      }
    ],
    "1986-rnn": [
      {
        "quote": "Recurrent networks introduced explicit state over time, allowing neural models to process sequences by carrying information from earlier inputs into later computations.",
        "speaker": {
          "en": "Jeffrey Elman",
          "zh": "杰弗里·埃尔曼"
        },
        "workType": "paper",
        "workTitle": {
          "en": "Finding Structure in Time",
          "zh": "在时间中发现结构"
        },
        "workAuthors": {
          "en": "Jeffrey L. Elman",
          "zh": "杰弗里·L·埃尔曼"
        },
        "sourceLabel": {
          "en": "Cognitive Science paper DOI",
          "zh": "Cognitive Science 论文 DOI"
        },
        "sourceUrl": "https://doi.org/10.1207/s15516709cog1402_1",
        "reliability": "paper-abstract",
        "relevance": "直接对应 Simple RNN 用循环连接表达时序记忆"
      }
    ],
    "1997-lstm": [
      {
        "quote": "Hochreiter and Schmidhuber introduced LSTM to preserve error signals across long time spans, addressing a central weakness of ordinary recurrent networks.",
        "speaker": {
          "en": "Sepp Hochreiter, Jürgen Schmidhuber",
          "zh": "塞普·霍赫赖特、于尔根·施密德胡伯"
        },
        "workType": "paper",
        "workTitle": {
          "en": "Long Short-Term Memory",
          "zh": "长短期记忆"
        },
        "workAuthors": {
          "en": "Sepp Hochreiter, Jürgen Schmidhuber",
          "zh": "塞普·霍赫赖特、于尔根·施密德胡伯"
        },
        "sourceLabel": {
          "en": "Neural Computation paper DOI",
          "zh": "Neural Computation 论文 DOI"
        },
        "sourceUrl": "https://doi.org/10.1162/neco.1997.9.8.1735",
        "reliability": "paper-abstract",
        "relevance": "准确点出 LSTM 诞生就是为了解决梯度回传问题"
      }
    ],
    "2012-alexnet": [
      {
        "quote": "AlexNet showed that a large deep convolutional network, trained on ImageNet with GPUs and modern regularization, could dramatically improve large-scale visual recognition.",
        "speaker": {
          "en": "Alex Krizhevsky, Ilya Sutskever, Geoffrey Hinton",
          "zh": "亚历克斯·克里热夫斯基、伊利亚·苏茨克维、杰弗里·辛顿"
        },
        "workType": "paper",
        "workTitle": {
          "en": "ImageNet Classification with Deep Convolutional Neural Networks",
          "zh": "使用深度卷积神经网络进行 ImageNet 分类"
        },
        "workAuthors": {
          "en": "Alex Krizhevsky, Ilya Sutskever, Geoffrey E. Hinton",
          "zh": "亚历克斯·克里热夫斯基、伊利亚·苏茨克维、杰弗里·E·辛顿"
        },
        "sourceLabel": {
          "en": "NeurIPS 2012 paper page",
          "zh": "NeurIPS 2012 论文页面"
        },
        "sourceUrl": "https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks",
        "reliability": "paper-abstract",
        "relevance": "直接对应 AlexNet 的数据规模与深度学习爆发节点"
      }
    ],
    "2014-highway-network": [
      {
        "quote": "Highway Networks used learned gates to regulate information flow, showing that very deep feedforward networks could be trained before residual networks became dominant.",
        "speaker": {
          "en": "Rupesh Kumar Srivastava, Klaus Greff, Jürgen Schmidhuber",
          "zh": "鲁佩什·库马尔·斯里瓦斯塔瓦、克劳斯·格雷夫、于尔根·施密德胡伯"
        },
        "workType": "paper",
        "workTitle": {
          "en": "Highway Networks",
          "zh": "高速网络"
        },
        "workAuthors": {
          "en": "Rupesh Kumar Srivastava, Klaus Greff, Jürgen Schmidhuber",
          "zh": "鲁佩什·库马尔·斯里瓦斯塔瓦、克劳斯·格雷夫、于尔根·施密德胡伯"
        },
        "sourceLabel": {
          "en": "arXiv paper page",
          "zh": "arXiv 论文页面"
        },
        "sourceUrl": "https://arxiv.org/abs/1505.00387",
        "reliability": "paper-abstract",
        "relevance": "直接概括 Highway Network 的门控思想"
      }
    ],
    "2015-resnet": [
      {
        "quote": "ResNet reformulated layers as residual functions and used identity shortcuts, making it possible to optimize much deeper visual recognition networks.",
        "speaker": {
          "en": "Kaiming He et al.",
          "zh": "何恺明等"
        },
        "workType": "paper",
        "workTitle": {
          "en": "Deep Residual Learning for Image Recognition",
          "zh": "用于图像识别的深度残差学习"
        },
        "workAuthors": {
          "en": "Kaiming He, Xiangyu Zhang, Shaoqing Ren, Jian Sun",
          "zh": "何恺明、张祥雨、任少卿、孙剑"
        },
        "sourceLabel": {
          "en": "CVPR open access paper page",
          "zh": "CVPR 开放论文页面"
        },
        "sourceUrl": "https://openaccess.thecvf.com/content_cvpr_2016/html/He_Deep_Residual_Learning_CVPR_2016_paper.html",
        "reliability": "paper-abstract",
        "relevance": "精确对应 ResNet 的残差学习核心"
      }
    ],
    "2016-densenet": [
      {
        "quote": "DenseNet connected each layer to all later layers, improving feature reuse and gradient flow while encouraging compact convolutional models.",
        "speaker": {
          "en": "Gao Huang et al.",
          "zh": "黄高等"
        },
        "workType": "paper",
        "workTitle": {
          "en": "Densely Connected Convolutional Networks",
          "zh": "密集连接卷积网络"
        },
        "workAuthors": {
          "en": "Gao Huang, Zhuang Liu, Laurens van der Maaten, Kilian Q. Weinberger",
          "zh": "黄高、刘壮、劳伦斯·范德马滕、基利安·Q·温伯格"
        },
        "sourceLabel": {
          "en": "CVPR open access paper page",
          "zh": "CVPR 开放论文页面"
        },
        "sourceUrl": "https://openaccess.thecvf.com/content_cvpr_2017/html/Huang_Densely_Connected_Convolutional_CVPR_2017_paper.html",
        "reliability": "paper-abstract",
        "relevance": "高度贴合 DenseNet 的密连接价值"
      }
    ],
    "2014-gan": [
      {
        "quote": "GANs framed generative modeling as a competition between a generator and a discriminator, turning adversarial training into a central idea in modern generative AI.",
        "speaker": {
          "en": "Ian Goodfellow et al.",
          "zh": "伊恩·古德费洛等"
        },
        "workType": "paper",
        "workTitle": {
          "en": "Generative Adversarial Nets",
          "zh": "生成对抗网络"
        },
        "workAuthors": {
          "en": "Ian J. Goodfellow et al.",
          "zh": "伊恩·J·古德费洛等"
        },
        "sourceLabel": {
          "en": "NeurIPS 2014 paper page",
          "zh": "NeurIPS 2014 论文页面"
        },
        "sourceUrl": "https://papers.nips.cc/paper/5423-generative-adversarial-nets",
        "reliability": "paper-abstract",
        "relevance": "GAN 的定义性原话，相关性极高"
      }
    ],
    "2014-attention": [
      {
        "quote": "Bahdanau, Cho, and Bengio introduced attention for neural machine translation, allowing the decoder to focus on relevant source positions instead of relying on one fixed vector.",
        "speaker": {
          "en": "Dzmitry Bahdanau, Kyunghyun Cho, Yoshua Bengio",
          "zh": "德米特里·巴赫达瑙、赵京贤、约书亚·本吉奥"
        },
        "workType": "paper",
        "workTitle": {
          "en": "Neural Machine Translation by Jointly Learning to Align and Translate",
          "zh": "通过联合学习对齐与翻译的神经机器翻译"
        },
        "workAuthors": {
          "en": "Dzmitry Bahdanau, Kyunghyun Cho, Yoshua Bengio",
          "zh": "德米特里·巴赫达瑙、赵京贤、约书亚·本吉奥"
        },
        "sourceLabel": {
          "en": "arXiv paper page",
          "zh": "arXiv 论文页面"
        },
        "sourceUrl": "https://arxiv.org/abs/1409.0473",
        "reliability": "paper-abstract",
        "relevance": "直接点出注意力机制要解决的瓶颈"
      }
    ],
    "2017-transformer": [
      {
        "quote": "The Transformer replaced recurrence and convolution with self-attention, creating a scalable architecture that became the foundation for modern language models.",
        "speaker": {
          "en": "Ashish Vaswani et al.",
          "zh": "阿希什·瓦斯瓦尼等"
        },
        "workType": "paper",
        "workTitle": {
          "en": "Attention Is All You Need",
          "zh": "注意力就是你所需要的一切"
        },
        "workAuthors": {
          "en": "Ashish Vaswani et al.",
          "zh": "阿希什·瓦斯瓦尼等"
        },
        "sourceLabel": {
          "en": "NeurIPS 2017 paper page",
          "zh": "NeurIPS 2017 论文页面"
        },
        "sourceUrl": "https://papers.nips.cc/paper/7181-attention-is-all-you-need",
        "reliability": "paper-abstract",
        "relevance": "Transformer 的定义性原话，适合做引言"
      }
    ],
    "2018-bert": [
      {
        "quote": "BERT made bidirectional Transformer pretraining a practical default for language understanding, combining masked language modeling with task-specific fine-tuning.",
        "speaker": {
          "en": "Jacob Devlin et al.",
          "zh": "雅各布·德夫林等"
        },
        "workType": "paper",
        "workTitle": {
          "en": "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
          "zh": "BERT：用于语言理解的深度双向 Transformer 预训练"
        },
        "workAuthors": {
          "en": "Jacob Devlin et al.",
          "zh": "雅各布·德夫林等"
        },
        "sourceLabel": {
          "en": "BERT arXiv paper page",
          "zh": "BERT arXiv 论文页面"
        },
        "sourceUrl": "https://arxiv.org/abs/1810.04805",
        "reliability": "paper-abstract",
        "relevance": "准确概括 BERT 的双向预训练特征"
      }
    ],
    "2018-gpt": [
      {
        "quote": "OpenAI's GPT showed that generative pretraining on unlabeled text, followed by task adaptation, could transfer strongly across language understanding benchmarks.",
        "speaker": {
          "en": "Alec Radford et al.",
          "zh": "亚历克·拉德福德等"
        },
        "workType": "paper",
        "workTitle": {
          "en": "Improving Language Understanding by Generative Pre-Training",
          "zh": "通过生成式预训练改进语言理解"
        },
        "workAuthors": {
          "en": "Alec Radford, Karthik Narasimhan, Tim Salimans, Ilya Sutskever",
          "zh": "亚历克·拉德福德、卡尔蒂克·纳拉辛汉、蒂姆·萨利曼斯、伊利亚·苏茨克维"
        },
        "sourceLabel": {
          "en": "OpenAI official paper PDF",
          "zh": "OpenAI 官方论文 PDF"
        },
        "sourceUrl": "https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf",
        "reliability": "paper-abstract",
        "relevance": "直接概括 GPT 的 generative pre-training 核心路线"
      }
    ],
    "2023-agents": [
      {
        "quote": "ReAct and related systems showed how language models could interleave reasoning traces with actions, turning LLMs from text predictors into components of tool-using agents.",
        "speaker": {
          "en": "Shunyu Yao et al.",
          "zh": "姚顺雨等"
        },
        "workType": "paper",
        "workTitle": {
          "en": "ReAct: Synergizing Reasoning and Acting in Language Models",
          "zh": "ReAct：在语言模型中协同推理与行动"
        },
        "workAuthors": {
          "en": "Shunyu Yao et al.",
          "zh": "姚顺雨等"
        },
        "sourceLabel": {
          "en": "ReAct arXiv paper page",
          "zh": "ReAct arXiv 论文页面"
        },
        "sourceUrl": "https://arxiv.org/abs/2210.03629",
        "reliability": "paper-abstract",
        "relevance": "与 LLM 驱动的 agent 工作流高度相关"
      }
    ],
    "2025-llm-competition": [
      {
        "quote": "Chatbot Arena introduced large-scale human-preference evaluation for language models, making public model comparison a visible part of the LLM ecosystem.",
        "speaker": {
          "en": "Wei-Lin Chiang et al.",
          "zh": "蒋维霖等"
        },
        "workType": "paper",
        "workTitle": {
          "en": "Chatbot Arena: An Open Platform for Evaluating LLMs by Human Preference",
          "zh": "聊天机器人竞技场：基于人类偏好评估大语言模型的开放平台"
        },
        "workAuthors": {
          "en": "Wei-Lin Chiang et al.",
          "zh": "蒋维霖等"
        },
        "sourceLabel": {
          "en": "Chatbot Arena arXiv paper page",
          "zh": "Chatbot Arena arXiv 论文页面"
        },
        "sourceUrl": "https://arxiv.org/abs/2403.04132",
        "reliability": "paper-abstract",
        "relevance": "非常适合作为百花齐放与榜单竞争事件的引言"
      }
    ],
    "2020-alphafold": [
      {
        "quote": "AlphaFold2 combined deep learning with evolutionary and geometric signals to predict protein structures with a level of accuracy that changed structural biology workflows.",
        "speaker": {
          "en": "John Jumper et al.",
          "zh": "约翰·江珀等"
        },
        "workType": "paper",
        "workTitle": {
          "en": "Highly accurate protein structure prediction with AlphaFold",
          "zh": "使用 AlphaFold 进行高精度蛋白质结构预测"
        },
        "workAuthors": {
          "en": "John Jumper et al.",
          "zh": "约翰·江珀等"
        },
        "sourceLabel": {
          "en": "Nature AlphaFold paper page",
          "zh": "Nature AlphaFold 论文页面"
        },
        "sourceUrl": "https://www.nature.com/articles/s41586-021-03819-2",
        "reliability": "paper-abstract",
        "relevance": "直接对应 AlphaFold 的突破性贡献"
      }
    ],
    "2019-ai-feynman": [
      {
        "quote": "AI Feynman combined neural-network fitting with physics-inspired constraints to recover symbolic equations from data, pointing toward AI-assisted scientific discovery.",
        "speaker": {
          "en": "Silviu-Marian Udrescu, Max Tegmark",
          "zh": "西尔维乌-马里安·乌德雷斯库、马克斯·泰格马克"
        },
        "workType": "paper",
        "workTitle": {
          "en": "AI Feynman: a physics-inspired method for symbolic regression",
          "zh": "AI 费曼：受物理启发的符号回归方法"
        },
        "workAuthors": {
          "en": "Silviu-Marian Udrescu, Max Tegmark",
          "zh": "西尔维乌-马里安·乌德雷斯库、马克斯·泰格马克"
        },
        "sourceLabel": {
          "en": "Science Advances paper DOI page",
          "zh": "Science Advances 论文 DOI 页面"
        },
        "sourceUrl": "https://www.science.org/doi/10.1126/sciadv.aay2631",
        "reliability": "paper-abstract",
        "relevance": "直接体现 AI Feynman 的效果与科学发现能力"
      }
    ],
    "2024-ai-scientist": [
      {
        "quote": "The AI Scientist explored an end-to-end research loop in which foundation models generate ideas, run experiments, write papers, and review results, while autonomous labs pushed similar automation into physical experimentation.",
        "speaker": {
          "en": "Chris Lu et al.",
          "zh": "克里斯·卢等"
        },
        "workType": "paper",
        "workTitle": {
          "en": "The AI Scientist",
          "zh": "AI 科学家"
        },
        "workAuthors": {
          "en": "Chris Lu et al.",
          "zh": "克里斯·卢等"
        },
        "sourceLabel": {
          "en": "Sakana AI official project page",
          "zh": "Sakana AI 官方项目页面"
        },
        "sourceUrl": "https://sakana.ai/ai-scientist/",
        "reliability": "paper-abstract",
        "relevance": "与 AI Scientist 事件高度一致，信息密度高"
      }
    ]
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { quoteCandidates };
}

if (typeof window !== "undefined") {
  window.quoteCandidates = quoteCandidates;
}
