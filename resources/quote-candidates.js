// AI 历史展览引言摘录候选库（人工整理）
// 说明：
// - 每个事件至少提供一条高相关、可追溯来源的候选引言
// - 优先选择官方页面、论文摘要、学术出版社页面或机构页面中的原话
// - 当前文件仅存候选数据，不直接参与页面渲染

const quoteCandidates = {
  "curatedAt": "2026-04-23",
  "purpose": "为各事件补充高相关、可靠来源的引言摘录候选",
  "events": {
    "1956-dartmouth": [
      {
        "quote": "Every aspect of learning or any other feature of intelligence can in principle be so precisely described that a machine can be made to simulate it.",
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
          "en": "Dartmouth official page quoting the 1955 proposal",
          "zh": "达特茅斯官方页面引用 1955 年提案"
        },
        "sourceUrl": "https://home.dartmouth.edu/about/artificial-intelligence-ai-coined-dartmouth",
        "reliability": "official",
        "relevance": "AI 命名与达特茅斯会议的 founding conjecture"
      }
    ],
    "1957-perceptron": [
      {
        "quote": "The theory serves as a bridge between biophysics and psychology.",
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
          "en": "Psychological Review abstract preview",
          "zh": "《心理学评论》摘要预览"
        },
        "sourceUrl": "https://www.researchgate.net/publication/221996769_The_perceptron_A_probabilistic_model_for_information_storage_and_organization_in_the_brain",
        "reliability": "paper-abstract",
        "relevance": "感知机作为神经机制与认知研究之间的桥梁"
      }
    ],
    "1969-ai-winter": [
      {
        "quote": "Their rigorous work and brilliant technique does not make the perceptron look very good.",
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
          "en": "MIT Press foreword excerpt on Perceptrons",
          "zh": "麻省理工学院出版社《感知机》前言摘录"
        },
        "sourceUrl": "https://mitpress.mit.edu/9780262534772/perceptrons/",
        "reliability": "academic-publisher",
        "relevance": "直接点出《Perceptrons》对感知机热潮降温的历史作用"
      }
    ],
    "1986-backpropagation": [
      {
        "quote": "The ability to create useful new features distinguishes back-propagation from earlier, simpler methods.",
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
          "en": "Nature abstract",
          "zh": "《自然》摘要"
        },
        "sourceUrl": "https://www.nature.com/articles/323533a0",
        "reliability": "paper-abstract",
        "relevance": "高度贴合 BP 让多层表示学习真正可用的历史意义"
      }
    ],
    "1989-cnn": [
      {
        "quote": "Convolutional neural networks, which are specifically designed to deal with the variability of two dimensional shapes, are shown to outperform all other techniques.",
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
          "en": "NYU Scholars abstract page",
          "zh": "纽约大学学者库摘要页面"
        },
        "sourceUrl": "https://nyuscholars.nyu.edu/en/publications/gradient-based-learning-applied-to-document-recognition",
        "reliability": "institutional-repository",
        "relevance": "直接对应 CNN 在文档/视觉识别任务中的结构优势"
      }
    ],
    "1986-rnn": [
      {
        "quote": "The current report develops a proposal ... to provide networks with a dynamic memory.",
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
          "en": "ScienceDirect abstract page",
          "zh": "ScienceDirect 摘要页面"
        },
        "sourceUrl": "https://www.sciencedirect.com/science/article/abs/pii/036402139090002E",
        "reliability": "paper-abstract",
        "relevance": "直接对应 Simple RNN 用循环连接表达时序记忆"
      }
    ],
    "1997-lstm": [
      {
        "quote": "We ... address it by introducing a novel, efficient, gradient based method called long short-term memory (LSTM).",
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
          "en": "CiNii abstract description",
          "zh": "CiNii 摘要说明"
        },
        "sourceUrl": "https://cir.nii.ac.jp/crid/1363951795376009728",
        "reliability": "paper-abstract",
        "relevance": "准确点出 LSTM 诞生就是为了解决梯度回传问题"
      }
    ],
    "2012-alexnet": [
      {
        "quote": "We trained a large, deep convolutional neural network to classify the 1.2 million high-resolution images in the ImageNet LSVRC-2010 contest into the 1000 different classes.",
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
          "en": "NIPS 2012 paper abstract",
          "zh": "NIPS 2012 论文摘要"
        },
        "sourceUrl": "https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks",
        "reliability": "paper-abstract",
        "relevance": "直接对应 AlexNet 的数据规模与深度学习爆发节点"
      }
    ],
    "2014-highway-network": [
      {
        "quote": "The architecture is characterized by the use of gating units which learn to regulate the flow of information through a network.",
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
          "en": "arXiv abstract",
          "zh": "arXiv 摘要"
        },
        "sourceUrl": "https://arxiv.org/abs/1505.00387",
        "reliability": "paper-abstract",
        "relevance": "直接概括 Highway Network 的门控思想"
      }
    ],
    "2015-resnet": [
      {
        "quote": "We explicitly reformulate the layers as learning residual functions with reference to the layer inputs.",
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
          "en": "CVPR 2016 open access abstract",
          "zh": "CVPR 2016 开放论文摘要"
        },
        "sourceUrl": "https://openaccess.thecvf.com/content_cvpr_2016/html/He_Deep_Residual_Learning_CVPR_2016_paper.html",
        "reliability": "paper-abstract",
        "relevance": "精确对应 ResNet 的残差学习核心"
      }
    ],
    "2016-densenet": [
      {
        "quote": "DenseNets have several compelling advantages: they alleviate the vanishing-gradient problem, strengthen feature propagation, encourage feature reuse.",
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
          "en": "CVPR 2017 open access abstract",
          "zh": "CVPR 2017 开放论文摘要"
        },
        "sourceUrl": "https://openaccess.thecvf.com/content_cvpr_2017/html/Huang_Densely_Connected_Convolutional_CVPR_2017_paper.html",
        "reliability": "paper-abstract",
        "relevance": "高度贴合 DenseNet 的密连接价值"
      }
    ],
    "2014-gan": [
      {
        "quote": "We propose a new framework for estimating generative models via adversarial nets.",
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
          "en": "NeurIPS 2014 abstract",
          "zh": "NeurIPS 2014 摘要"
        },
        "sourceUrl": "https://proceedings.neurips.cc/paper/5423-generative-adversarial-nets",
        "reliability": "paper-abstract",
        "relevance": "GAN 的定义性原话，相关性极高"
      }
    ],
    "2014-attention": [
      {
        "quote": "We conjecture that the use of a fixed-length vector is a bottleneck in improving the performance of this basic encoder-decoder architecture.",
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
          "en": "arXiv abstract",
          "zh": "arXiv 摘要"
        },
        "sourceUrl": "https://arxiv.org/abs/1409.0473",
        "reliability": "paper-abstract",
        "relevance": "直接点出注意力机制要解决的瓶颈"
      }
    ],
    "2017-transformer": [
      {
        "quote": "We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
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
          "en": "arXiv abstract",
          "zh": "arXiv 摘要"
        },
        "sourceUrl": "https://arxiv.org/abs/1706.03762",
        "reliability": "paper-abstract",
        "relevance": "Transformer 的定义性原话，适合做引言"
      }
    ],
    "2018-bert": [
      {
        "quote": "BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.",
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
          "en": "ACL Anthology abstract",
          "zh": "ACL Anthology 摘要"
        },
        "sourceUrl": "https://aclanthology.org/N19-1423/",
        "reliability": "paper-abstract",
        "relevance": "准确概括 BERT 的双向预训练特征"
      }
    ],
    "2018-gpt": [
      {
        "quote": "We demonstrate that large gains on these tasks can be realized by generative pre-training of a language model on a diverse corpus of unlabeled text.",
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
          "en": "OpenAI GPT paper abstract",
          "zh": "OpenAI GPT 论文摘要"
        },
        "sourceUrl": "https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf",
        "reliability": "paper-abstract",
        "relevance": "直接概括 GPT 的 generative pre-training 核心路线"
      }
    ],
    "2023-agents": [
      {
        "quote": "We explore the use of LLMs to generate both reasoning traces and task-specific actions in an interleaved manner.",
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
          "en": "ReAct abstract",
          "zh": "ReAct 摘要"
        },
        "sourceUrl": "https://arxiv.org/abs/2210.03629",
        "reliability": "paper-abstract",
        "relevance": "与 LLM 驱动的 agent 工作流高度相关"
      }
    ],
    "2025-llm-competition": [
      {
        "quote": "We introduce Chatbot Arena, an open platform for evaluating LLMs based on human preferences.",
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
          "en": "Chatbot Arena abstract",
          "zh": "聊天机器人竞技场摘要"
        },
        "sourceUrl": "https://arxiv.org/abs/2403.04132",
        "reliability": "paper-abstract",
        "relevance": "非常适合作为百花齐放与榜单竞争事件的引言"
      }
    ],
    "2020-alphafold": [
      {
        "quote": "Here we provide the first computational method that can regularly predict protein structures with atomic accuracy.",
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
          "en": "Nature abstract",
          "zh": "《自然》摘要"
        },
        "sourceUrl": "https://www.nature.com/articles/s41586-021-03819-2",
        "reliability": "paper-abstract",
        "relevance": "直接对应 AlphaFold 的突破性贡献"
      }
    ],
    "2019-ai-feynman": [
      {
        "quote": "We apply it to 100 equations from the Feynman Lectures on Physics, and it discovers all of them, while previous publicly available software cracks only 71.",
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
          "en": "arXiv abstract",
          "zh": "arXiv 摘要"
        },
        "sourceUrl": "https://arxiv.org/abs/1905.11481",
        "reliability": "paper-abstract",
        "relevance": "直接体现 AI Feynman 的效果与科学发现能力"
      }
    ],
    "2024-ai-scientist": [
      {
        "quote": "This paper presents the first comprehensive framework for fully automatic scientific discovery.",
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
          "en": "arXiv abstract",
          "zh": "arXiv 摘要"
        },
        "sourceUrl": "https://arxiv.org/abs/2408.06292",
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
