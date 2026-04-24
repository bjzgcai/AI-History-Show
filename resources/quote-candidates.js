// AI 历史展览引言摘录候选库（人工整理）
// 说明：
// - 每个事件至少提供一条高相关、可追溯来源的候选引言
// - 优先选择官方页面、论文摘要、学术出版社页面或机构页面中的原话
// - 当前文件仅存候选数据，不直接参与页面渲染

const quoteCandidates = {
  curatedAt: "2026-04-23",
  purpose: "为各事件补充高相关、可靠来源的引言摘录候选",
  events: {
    "1956-dartmouth": [
      {
        quote: "Every aspect of learning or any other feature of intelligence can in principle be so precisely described that a machine can be made to simulate it.",
        speaker: "John McCarthy et al.",
        workType: "proposal",
        workTitle: "A Proposal for the Dartmouth Summer Research Project on Artificial Intelligence",
        workAuthors: "John McCarthy, Marvin L. Minsky, Nathaniel Rochester, Claude E. Shannon",
        sourceLabel: "Dartmouth official page quoting the 1955 proposal",
        sourceUrl: "https://home.dartmouth.edu/about/artificial-intelligence-ai-coined-dartmouth",
        reliability: "official",
        relevance: "AI 命名与达特茅斯会议的 founding conjecture",
      },
    ],
    "1957-perceptron": [
      {
        quote: "The theory serves as a bridge between biophysics and psychology.",
        speaker: "Frank Rosenblatt",
        workType: "paper",
        workTitle: "The Perceptron: A Probabilistic Model for Information Storage and Organization in the Brain",
        workAuthors: "Frank Rosenblatt",
        sourceLabel: "Psychological Review abstract preview",
        sourceUrl: "https://www.researchgate.net/publication/221996769_The_perceptron_A_probabilistic_model_for_information_storage_and_organization_in_the_brain",
        reliability: "paper-abstract",
        relevance: "感知机作为神经机制与认知研究之间的桥梁",
      },
    ],
    "1969-ai-winter": [
      {
        quote: "Their rigorous work and brilliant technique does not make the perceptron look very good.",
        speaker: "Léon Bottou",
        workType: "book",
        workTitle: "Perceptrons: An Introduction to Computational Geometry",
        workAuthors: "Marvin Minsky, Seymour Papert",
        sourceLabel: "MIT Press foreword excerpt on Perceptrons",
        sourceUrl: "https://mitpress.mit.edu/9780262534772/perceptrons/",
        reliability: "academic-publisher",
        relevance: "直接点出《Perceptrons》对感知机热潮降温的历史作用",
      },
    ],
    "1986-backpropagation": [
      {
        quote: "The ability to create useful new features distinguishes back-propagation from earlier, simpler methods.",
        speaker: "David Rumelhart, Geoffrey Hinton, Ronald Williams",
        workType: "paper",
        workTitle: "Learning representations by back-propagating errors",
        workAuthors: "David E. Rumelhart, Geoffrey E. Hinton, Ronald J. Williams",
        sourceLabel: "Nature abstract",
        sourceUrl: "https://www.nature.com/articles/323533a0",
        reliability: "paper-abstract",
        relevance: "高度贴合 BP 让多层表示学习真正可用的历史意义",
      },
    ],
    "1989-cnn": [
      {
        quote: "Convolutional neural networks, which are specifically designed to deal with the variability of two dimensional shapes, are shown to outperform all other techniques.",
        speaker: "Yann LeCun et al.",
        workType: "paper",
        workTitle: "Gradient-Based Learning Applied to Document Recognition",
        workAuthors: "Yann LeCun, Léon Bottou, Yoshua Bengio, Patrick Haffner",
        sourceLabel: "NYU Scholars abstract page",
        sourceUrl: "https://nyuscholars.nyu.edu/en/publications/gradient-based-learning-applied-to-document-recognition",
        reliability: "institutional-repository",
        relevance: "直接对应 CNN 在文档/视觉识别任务中的结构优势",
      },
    ],
    "1986-rnn": [
      {
        quote: "The current report develops a proposal ... to provide networks with a dynamic memory.",
        speaker: "Jeffrey Elman",
        workType: "paper",
        workTitle: "Finding Structure in Time",
        workAuthors: "Jeffrey L. Elman",
        sourceLabel: "ScienceDirect abstract page",
        sourceUrl: "https://www.sciencedirect.com/science/article/abs/pii/036402139090002E",
        reliability: "paper-abstract",
        relevance: "直接对应 Simple RNN 用循环连接表达时序记忆",
      },
    ],
    "1997-lstm": [
      {
        quote: "We ... address it by introducing a novel, efficient, gradient based method called long short-term memory (LSTM).",
        speaker: "Sepp Hochreiter, Jürgen Schmidhuber",
        workType: "paper",
        workTitle: "Long Short-Term Memory",
        workAuthors: "Sepp Hochreiter, Jürgen Schmidhuber",
        sourceLabel: "CiNii abstract description",
        sourceUrl: "https://cir.nii.ac.jp/crid/1363951795376009728",
        reliability: "paper-abstract",
        relevance: "准确点出 LSTM 诞生就是为了解决梯度回传问题",
      },
    ],
    "2012-alexnet": [
      {
        quote: "We trained a large, deep convolutional neural network to classify the 1.2 million high-resolution images in the ImageNet LSVRC-2010 contest into the 1000 different classes.",
        speaker: "Alex Krizhevsky, Ilya Sutskever, Geoffrey Hinton",
        workType: "paper",
        workTitle: "ImageNet Classification with Deep Convolutional Neural Networks",
        workAuthors: "Alex Krizhevsky, Ilya Sutskever, Geoffrey E. Hinton",
        sourceLabel: "NIPS 2012 paper abstract",
        sourceUrl: "https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks",
        reliability: "paper-abstract",
        relevance: "直接对应 AlexNet 的数据规模与深度学习爆发节点",
      },
    ],
    "2014-highway-network": [
      {
        quote: "The architecture is characterized by the use of gating units which learn to regulate the flow of information through a network.",
        speaker: "Rupesh Kumar Srivastava, Klaus Greff, Jürgen Schmidhuber",
        workType: "paper",
        workTitle: "Highway Networks",
        workAuthors: "Rupesh Kumar Srivastava, Klaus Greff, Jürgen Schmidhuber",
        sourceLabel: "arXiv abstract",
        sourceUrl: "https://arxiv.org/abs/1505.00387",
        reliability: "paper-abstract",
        relevance: "直接概括 Highway Network 的门控思想",
      },
    ],
    "2015-resnet": [
      {
        quote: "We explicitly reformulate the layers as learning residual functions with reference to the layer inputs.",
        speaker: "Kaiming He et al.",
        workType: "paper",
        workTitle: "Deep Residual Learning for Image Recognition",
        workAuthors: "Kaiming He, Xiangyu Zhang, Shaoqing Ren, Jian Sun",
        sourceLabel: "CVPR 2016 open access abstract",
        sourceUrl: "https://openaccess.thecvf.com/content_cvpr_2016/html/He_Deep_Residual_Learning_CVPR_2016_paper.html",
        reliability: "paper-abstract",
        relevance: "精确对应 ResNet 的残差学习核心",
      },
    ],
    "2016-densenet": [
      {
        quote: "DenseNets have several compelling advantages: they alleviate the vanishing-gradient problem, strengthen feature propagation, encourage feature reuse.",
        speaker: "Gao Huang et al.",
        workType: "paper",
        workTitle: "Densely Connected Convolutional Networks",
        workAuthors: "Gao Huang, Zhuang Liu, Laurens van der Maaten, Kilian Q. Weinberger",
        sourceLabel: "CVPR 2017 open access abstract",
        sourceUrl: "https://openaccess.thecvf.com/content_cvpr_2017/html/Huang_Densely_Connected_Convolutional_CVPR_2017_paper.html",
        reliability: "paper-abstract",
        relevance: "高度贴合 DenseNet 的密连接价值",
      },
    ],
    "2014-gan": [
      {
        quote: "We propose a new framework for estimating generative models via adversarial nets.",
        speaker: "Ian Goodfellow et al.",
        workType: "paper",
        workTitle: "Generative Adversarial Nets",
        workAuthors: "Ian J. Goodfellow et al.",
        sourceLabel: "NeurIPS 2014 abstract",
        sourceUrl: "https://proceedings.neurips.cc/paper/5423-generative-adversarial-nets",
        reliability: "paper-abstract",
        relevance: "GAN 的定义性原话，相关性极高",
      },
    ],
    "2014-attention": [
      {
        quote: "We conjecture that the use of a fixed-length vector is a bottleneck in improving the performance of this basic encoder-decoder architecture.",
        speaker: "Dzmitry Bahdanau, Kyunghyun Cho, Yoshua Bengio",
        workType: "paper",
        workTitle: "Neural Machine Translation by Jointly Learning to Align and Translate",
        workAuthors: "Dzmitry Bahdanau, Kyunghyun Cho, Yoshua Bengio",
        sourceLabel: "arXiv abstract",
        sourceUrl: "https://arxiv.org/abs/1409.0473",
        reliability: "paper-abstract",
        relevance: "直接点出注意力机制要解决的瓶颈",
      },
    ],
    "2017-transformer": [
      {
        quote: "We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
        speaker: "Ashish Vaswani et al.",
        workType: "paper",
        workTitle: "Attention Is All You Need",
        workAuthors: "Ashish Vaswani et al.",
        sourceLabel: "arXiv abstract",
        sourceUrl: "https://arxiv.org/abs/1706.03762",
        reliability: "paper-abstract",
        relevance: "Transformer 的定义性原话，适合做引言",
      },
    ],
    "2018-bert": [
      {
        quote: "BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.",
        speaker: "Jacob Devlin et al.",
        workType: "paper",
        workTitle: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
        workAuthors: "Jacob Devlin et al.",
        sourceLabel: "ACL Anthology abstract",
        sourceUrl: "https://aclanthology.org/N19-1423/",
        reliability: "paper-abstract",
        relevance: "准确概括 BERT 的双向预训练特征",
      },
    ],
    "2018-gpt": [
      {
        quote: "We demonstrate that large gains on these tasks can be realized by generative pre-training of a language model on a diverse corpus of unlabeled text.",
        speaker: "Alec Radford et al.",
        workType: "paper",
        workTitle: "Improving Language Understanding by Generative Pre-Training",
        workAuthors: "Alec Radford, Karthik Narasimhan, Tim Salimans, Ilya Sutskever",
        sourceLabel: "OpenAI GPT paper abstract",
        sourceUrl: "https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf",
        reliability: "paper-abstract",
        relevance: "直接概括 GPT 的 generative pre-training 核心路线",
      },
    ],
    "2023-agents": [
      {
        quote: "We explore the use of LLMs to generate both reasoning traces and task-specific actions in an interleaved manner.",
        speaker: "Shunyu Yao et al.",
        workType: "paper",
        workTitle: "ReAct: Synergizing Reasoning and Acting in Language Models",
        workAuthors: "Shunyu Yao et al.",
        sourceLabel: "ReAct abstract",
        sourceUrl: "https://arxiv.org/abs/2210.03629",
        reliability: "paper-abstract",
        relevance: "与 LLM 驱动的 agent 工作流高度相关",
      },
    ],
    "2025-llm-competition": [
      {
        quote: "We introduce Chatbot Arena, an open platform for evaluating LLMs based on human preferences.",
        speaker: "Wei-Lin Chiang et al.",
        workType: "paper",
        workTitle: "Chatbot Arena: An Open Platform for Evaluating LLMs by Human Preference",
        workAuthors: "Wei-Lin Chiang et al.",
        sourceLabel: "Chatbot Arena abstract",
        sourceUrl: "https://arxiv.org/abs/2403.04132",
        reliability: "paper-abstract",
        relevance: "非常适合作为百花齐放与榜单竞争事件的引言",
      },
    ],
    "2020-alphafold": [
      {
        quote: "Here we provide the first computational method that can regularly predict protein structures with atomic accuracy.",
        speaker: "John Jumper et al.",
        workType: "paper",
        workTitle: "Highly accurate protein structure prediction with AlphaFold",
        workAuthors: "John Jumper et al.",
        sourceLabel: "Nature abstract",
        sourceUrl: "https://www.nature.com/articles/s41586-021-03819-2",
        reliability: "paper-abstract",
        relevance: "直接对应 AlphaFold 的突破性贡献",
      },
    ],
    "2019-ai-feynman": [
      {
        quote: "We apply it to 100 equations from the Feynman Lectures on Physics, and it discovers all of them, while previous publicly available software cracks only 71.",
        speaker: "Silviu-Marian Udrescu, Max Tegmark",
        workType: "paper",
        workTitle: "AI Feynman: a physics-inspired method for symbolic regression",
        workAuthors: "Silviu-Marian Udrescu, Max Tegmark",
        sourceLabel: "arXiv abstract",
        sourceUrl: "https://arxiv.org/abs/1905.11481",
        reliability: "paper-abstract",
        relevance: "直接体现 AI Feynman 的效果与科学发现能力",
      },
    ],
    "2024-ai-scientist": [
      {
        quote: "This paper presents the first comprehensive framework for fully automatic scientific discovery.",
        speaker: "Chris Lu et al.",
        workType: "paper",
        workTitle: "The AI Scientist",
        workAuthors: "Chris Lu et al.",
        sourceLabel: "arXiv abstract",
        sourceUrl: "https://arxiv.org/abs/2408.06292",
        reliability: "paper-abstract",
        relevance: "与 AI Scientist 事件高度一致，信息密度高",
      },
    ],
  },
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { quoteCandidates };
}

if (typeof window !== "undefined") {
  window.quoteCandidates = quoteCandidates;
}
