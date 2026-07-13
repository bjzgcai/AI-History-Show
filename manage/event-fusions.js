// Shared content fusions for events that appear in both the deep-learning
// storyline and the BenchCouncil AI100 storyline.
//
// Archive migration note:
// This is transition logic. The archive model should eventually replace these
// fusions with one canonical event and multiple storyline variants.
//
// The generated milestones should present the same event content regardless of
// the entry point. Keep sources/key concepts/visual modules from AI100, keep
// videos from the deep-learning chapter when available, and use these fused
// descriptions for the main body text.
const FUSION_ASSETS = require('./event-fusion-assets.js');

const FUSIONS = [
  {
    canonical: '1957-perceptron',
    deep: '1957-perceptron',
    ai100: '1958-rosenblatt-perceptron',
    year: '1957',
    title: {
      en: 'The Perceptron and Connectionism',
      zh: '感知机与连接主义'
    },
    description: {
      en: '<p>In 1957, American psychologist Frank Rosenblatt introduced the Perceptron in his technical report The Perceptron: A Perceiving and Recognizing Automaton. Widely regarded as the first trainable artificial neural network, the Perceptron marked the beginning of data-driven machine learning and laid the theoretical foundation for the development of modern deep learning.</p>',
      zh: '<p>1957 年，美国心理学家弗兰克·罗森布拉特（Frank Rosenblatt）在技术报告《The Perceptron: A Perceiving and Recognizing Automaton》中首次提出感知机（Perceptron）模型，这是人工神经网络发展史上的第一个可学习神经网络模型，标志着机器学习开始从符号推理迈向数据驱动学习，为现代深度学习的发展奠定了基础。</p>'
    },
    figures: [
      {
        name: { en: 'Frank Rosenblatt', zh: '弗兰克·罗森布拉特' },
        role: { en: 'Inventor of the perceptron', zh: '感知机发明者' }
      }
    ]
  },
  {
    canonical: '1989-cnn',
    deep: '1989-cnn',
    ai100: 'ai100-1989-lenet',
    year: 1989,
    title: {
      en: 'Convolutional Networks and LeNet',
      zh: '卷积神经网络与 LeNet'
    },
    description: {
      en: '<p>In 1989, Yann LeCun and collaborators showed that convolutional networks trained with backpropagation could recognize handwritten ZIP codes, turning biologically inspired local receptive fields and shared weights into an end-to-end perception system. LeNet became the representative implementation of this CNN line: convolutions extracted local strokes, pooling stabilized features, and a classifier connected the visual pipeline to practical document recognition.</p>',
      zh: '<p>1989年，扬·勒昆及合作者证明，用反向传播训练的卷积神经网络可以识别手写邮编，把受视觉皮层启发的局部感受野和共享权重变成端到端感知系统。LeNet 是这条 CNN 技术线的代表性实现：卷积提取局部笔画，池化稳定特征，分类器把视觉流程连接到实际文档识别任务。</p>'
    },
    figures: [
      {
        name: { en: 'Yann LeCun', zh: '扬·勒昆' },
        role: { en: 'LeNet lead researcher', zh: 'LeNet 主要研究者' }
      }
    ]
  },
  {
    canonical: '1997-lstm',
    deep: '1997-lstm',
    ai100: 'ai100-1997-lstm',
    year: 1997,
    title: {
      en: 'LSTM and Gated Memory',
      zh: 'LSTM 与门控记忆'
    },
    description: {
      en: '<p>In 1997, Sepp Hochreiter and Juergen Schmidhuber introduced long short-term memory to address the vanishing-gradient problem in recurrent neural networks. The fused story connects the deep-learning timeline\'s emphasis on long-range information flow with the AI100 account of input, output, and forget gates, showing how gated memory made sequence learning practical before attention-based models became dominant.</p>',
      zh: '<p>1997年，塞普·霍赫赖特和于尔根·施密德胡伯提出长短期记忆网络，用来缓解循环神经网络中的梯度消失问题。融合后的叙事把深度学习时间线强调的长距离信息流，与 AI100 对输入门、输出门和遗忘门的解释连接起来，说明门控记忆如何在注意力模型占据主导前，让序列学习变得实用。</p>'
    },
    figures: [
      {
        name: { en: 'Sepp Hochreiter', zh: '塞普·霍赫赖特' },
        role: { en: 'LSTM co-author', zh: 'LSTM 共同作者' }
      },
      {
        name: { en: 'Jürgen Schmidhuber', zh: '尤尔根·施密德胡伯' },
        role: { en: 'LSTM co-author', zh: 'LSTM 共同作者' }
      }
    ]
  },
  {
    canonical: '2012-alexnet',
    deep: '2012-alexnet',
    ai100: 'ai100-2012-alexnet',
    year: 2012,
    title: {
      en: 'AlexNet and the ImageNet Breakthrough',
      zh: 'AlexNet 与 ImageNet 突破'
    },
    description: {
      en: '<p>In 2012, AlexNet won ImageNet by a large margin and made deep convolutional networks the center of modern computer vision. The deep-learning storyline stresses the combined force of data, GPU computation, ReLU, dropout, and engineering scale; the AI100 account anchors the same event in the NeurIPS paper and the ImageNet challenge, where the result made scale visible to the whole field.</p>',
      zh: '<p>2012年，AlexNet 以巨大优势赢得 ImageNet，使深度卷积网络成为现代计算机视觉的中心。深度学习发展线强调数据、GPU 算力、ReLU、dropout 和工程规模共同发挥作用；AI100 资料则把这一事件锚定在 NeurIPS 论文与 ImageNet 挑战赛中，说明这个结果如何让整个领域看见规模化训练的力量。</p>'
    },
    figures: [
      {
        name: { en: 'Alex Krizhevsky', zh: '亚历克斯·克里热夫斯基' },
        role: { en: 'AlexNet lead author', zh: 'AlexNet 主要作者' }
      },
      {
        name: { en: 'Ilya Sutskever', zh: '伊利亚·苏茨克维' },
        role: { en: 'AlexNet co-author', zh: 'AlexNet 共同作者' }
      },
      {
        name: { en: 'Geoffrey Hinton', zh: '杰弗里·辛顿' },
        role: { en: 'AlexNet co-author and advisor', zh: 'AlexNet 共同作者与导师' }
      }
    ]
  },
  {
    canonical: '2014-gan',
    deep: '2014-gan',
    ai100: 'ai100-2014-gan',
    year: 2014,
    title: {
      en: 'Generative Adversarial Networks',
      zh: '生成对抗网络'
    },
    description: {
      en: '<p>In 2014, Ian Goodfellow and collaborators introduced generative adversarial networks as a two-player learning process between a generator and a discriminator. The fused account preserves the deep-learning timeline\'s note that adversarial ideas had earlier precursors, while using the AI100 structure to explain why GANs became a defining framework for image generation, representation learning, and adversarial training.</p>',
      zh: '<p>2014年，伊恩·古德费洛及合作者提出生成对抗网络，把生成器和判别器组织成双人学习过程。融合后的描述保留深度学习发展线中“对抗思想曾有更早先例”的历史线索，同时使用 AI100 的结构化解释说明 GAN 为什么成为图像生成、表示学习和对抗训练的标志性框架。</p>'
    },
    figures: [
      {
        name: { en: 'Ian Goodfellow', zh: '伊恩·古德费洛' },
        role: { en: 'GAN lead author', zh: 'GAN 主要作者' }
      },
      {
        name: { en: 'Yoshua Bengio', zh: '约书亚·本吉奥' },
        role: { en: 'GAN co-author and advisor', zh: 'GAN 共同作者与导师' }
      }
    ]
  },
  {
    canonical: '2014-attention',
    deep: '2014-attention',
    ai100: 'ai100-2014-neural-machine-translation-attention',
    year: 2014,
    title: {
      en: 'Neural Machine Translation with Attention',
      zh: '带注意力机制的神经机器翻译'
    },
    description: {
      en: '<p>In 2014, Dzmitry Bahdanau, Kyunghyun Cho, and Yoshua Bengio introduced attention for neural machine translation, letting the decoder look back at different source positions instead of compressing a whole sentence into one fixed vector. This fused event presents attention as both a breakthrough for encoder-decoder translation and the conceptual bridge that later made token-to-token relevance central to Transformer-style AI.</p>',
      zh: '<p>2014年，兹米特里·巴赫达瑙、赵京贤和约书亚·本吉奥在神经机器翻译中引入注意力机制，让解码器能够回看源句中的不同位置，而不是把整句压缩成一个固定向量。融合后的事件既把注意力作为编码器-解码器翻译的突破，也把它呈现为通向 Transformer 式 AI 的概念桥梁。</p>'
    },
    figures: [
      {
        name: { en: 'Dzmitry Bahdanau', zh: '兹米特里·巴赫达瑙' },
        role: { en: 'Lead author of neural attention paper', zh: '神经注意力论文主要作者' }
      },
      {
        name: { en: 'Kyunghyun Cho', zh: '赵京贤' },
        role: { en: 'Neural attention paper co-author', zh: '神经注意力论文共同作者' }
      },
      {
        name: { en: 'Yoshua Bengio', zh: '约书亚·本吉奥' },
        role: { en: 'Neural attention paper co-author', zh: '神经注意力论文共同作者' }
      }
    ]
  },
  {
    canonical: '2015-resnet',
    deep: '2015-resnet',
    ai100: 'ai100-2015-resnet',
    year: 2015,
    title: {
      en: 'ResNet',
      zh: 'ResNet'
    },
    description: {
      en: '<p>In 2015, Kaiming He, Xiangyu Zhang, Shaoqing Ren, and Jian Sun introduced residual learning at Microsoft Research Asia. ResNet used shortcut connections so very deep networks could learn residual refinements instead of full transformations, solving a practical training bottleneck and becoming a standard visual backbone. The fused version combines the deep-learning storyline\'s emphasis on engineering simplicity and trainability with the AI100 paper sources and residual-block explanation.</p>',
      zh: '<p>2015年，微软亚洲研究院的何恺明、张祥雨、任少卿和孙剑提出残差学习。ResNet 通过快捷连接让很深的网络学习增量修正，而不是完整变换，解决了深层网络训练中的实际瓶颈，并成为视觉系统的常用骨干网络。融合后的版本结合了深度学习发展线对工程简洁性和可训练性的强调，以及 AI100 的论文来源和残差块解释。</p>'
    },
    figures: [
      {
        name: { en: 'Kaiming He', zh: '何恺明' },
        role: { en: 'ResNet lead author', zh: 'ResNet 第一作者' },
        avatar: 'resources/images/2015-resnet/people/2015-resnet_people_04.png'
      },
      {
        name: { en: 'Xiangyu Zhang', zh: '张祥雨' },
        role: { en: 'ResNet co-author', zh: 'ResNet 共同作者' }
      },
      {
        name: { en: 'Shaoqing Ren', zh: '任少卿' },
        role: { en: 'ResNet co-author', zh: 'ResNet 共同作者' }
      },
      {
        name: { en: 'Jian Sun', zh: '孙剑' },
        role: { en: 'ResNet co-author and corresponding author', zh: 'ResNet 共同作者与通讯作者' },
        avatar: 'resources/images/2015-resnet/people/2015-resnet_people_01.png'
      }
    ]
  },
  {
    canonical: '2016-densenet',
    deep: '2016-densenet',
    ai100: 'ai100-2017-densenet',
    year: 2016,
    title: {
      en: 'DenseNet',
      zh: 'DenseNet'
    },
    description: {
      en: '<p>DenseNet was first publicly released in 2016 and connected each layer to every later layer inside a dense block. The deep-learning storyline frames it as an extreme form of visible historical state and gradient-path expansion, while the AI100 entry explains the practical mechanism: feature reuse, stronger propagation, and a compact alternative to simply making networks wider or deeper.</p>',
      zh: '<p>DenseNet 于2016年首次公开，在密集块中把每一层连接到后续所有层。深度学习发展线把它理解为让历史状态显式可见、最大化梯度路径的一种极端形式，AI100 条目则解释其实用机制：促进特征复用、增强传播，并提供比单纯加宽或加深网络更紧凑的方案。</p>'
    },
    figures: [
      {
        name: { en: 'Gao Huang', zh: '黄高' },
        role: { en: 'DenseNet lead author', zh: 'DenseNet 主要作者' }
      },
      {
        name: { en: 'Zhuang Liu', zh: '刘壮' },
        role: { en: 'DenseNet co-author', zh: 'DenseNet 共同作者' }
      }
    ]
  },
  {
    canonical: '2017-transformer',
    deep: '2017-transformer',
    ai100: 'ai100-2017-transformer',
    year: 2017,
    title: {
      en: 'Transformer',
      zh: 'Transformer'
    },
    description: {
      en: '<p>In 2017, the Transformer replaced recurrent sequence processing with stacked self-attention and feed-forward modules. The deep-learning storyline highlights the architectural shift away from recurrence and convolution, while the AI100 materials explain the scalable query-key-value mechanism that later powered BERT, GPT, multimodal foundation models, and many agent systems.</p>',
      zh: '<p>2017年，Transformer 用堆叠的自注意力和前馈模块替代循环序列处理。深度学习发展线强调它摆脱循环和卷积的架构转向，AI100 资料则解释可扩展的 query-key-value 机制如何进一步支撑 BERT、GPT、多模态基础模型和许多智能体系统。</p>'
    },
    figures: [
      {
        name: { en: 'Ashish Vaswani', zh: '阿希什·瓦斯瓦尼' },
        role: { en: 'Transformer lead author', zh: 'Transformer 主要作者' }
      },
      {
        name: { en: 'Noam Shazeer', zh: '诺姆·沙泽尔' },
        role: { en: 'Transformer co-author', zh: 'Transformer 共同作者' }
      }
    ]
  },
  {
    canonical: '2018-bert',
    deep: '2018-bert',
    ai100: 'ai100-2018-bert',
    year: 2018,
    title: {
      en: 'BERT',
      zh: 'BERT'
    },
    description: {
      en: '<p>In 2018, Jacob Devlin and colleagues at Google introduced BERT, a bidirectional Transformer encoder pre-trained with masked language modeling and next-sentence prediction. The fused page keeps the deep-learning storyline\'s point that large-scale pre-training plus fine-tuning reshaped NLP, while using the AI100 content to focus the event on BERT rather than mixing it with the GPT line.</p>',
      zh: '<p>2018年，Google 的雅各布·德夫林及合作者提出 BERT，这是一种通过掩码语言建模和下一句预测预训练的双向 Transformer 编码器。融合后的页面保留深度学习发展线中“大规模预训练加微调重塑 NLP”的判断，同时采用 AI100 内容把事件聚焦在 BERT 本身，避免与 GPT 技术线混在一起。</p>'
    },
    figures: [
      {
        name: { en: 'Jacob Devlin', zh: '雅各布·德夫林' },
        role: { en: 'BERT lead author', zh: 'BERT 主要作者' }
      }
    ],
    location: {
      name: { en: 'Google', zh: 'Google' },
      country: { en: 'Mountain View, United States', zh: '美国山景城' },
      coordinates: [37.422, -122.0841]
    }
  },
  {
    canonical: '2018-gpt',
    deep: '2018-gpt',
    ai100: 'ai100-2018-gpt',
    year: 2018,
    title: {
      en: 'GPT',
      zh: 'GPT'
    },
    description: {
      en: '<p>In 2018, Alec Radford and colleagues at OpenAI introduced the first Generative Pre-trained Transformer, training a decoder-only language model on large unlabeled text and adapting it to downstream tasks. The fused account keeps the deep-learning storyline\'s contrast with BERT, but uses the AI100 structure to explain GPT as the beginning of the decoder-only scaling line that later led to GPT-2, GPT-3, ChatGPT, and modern language models.</p>',
      zh: '<p>2018年，OpenAI 的亚历克·拉德福德及同事提出第一代生成式预训练 Transformer，在大规模无标注文本上训练解码器式语言模型，再适配下游任务。融合后的叙事保留深度学习发展线中 GPT 与 BERT 的对照，同时使用 AI100 结构解释 GPT 如何成为后来 GPT-2、GPT-3、ChatGPT 和现代大语言模型的解码器式规模化路线起点。</p>'
    },
    figures: [
      {
        name: { en: 'Alec Radford', zh: '亚历克·拉德福德' },
        role: { en: 'GPT lead author', zh: 'GPT 主要作者' }
      }
    ],
    location: {
      name: { en: 'OpenAI', zh: 'OpenAI' },
      country: { en: 'San Francisco, United States', zh: '美国旧金山' },
      coordinates: [37.7749, -122.4194]
    }
  },
  {
    canonical: '2020-alphafold',
    deep: '2020-alphafold',
    ai100: 'ai100-2020-alphafold2',
    year: 2020,
    title: {
      en: 'AlphaFold2',
      zh: 'AlphaFold2'
    },
    description: {
      en: '<p>In 2020, DeepMind\'s AlphaFold2 achieved a major breakthrough at CASP14, showing that deep learning could predict protein structures with a level of accuracy that changed everyday biological research. The fused page combines the deep-learning storyline\'s emphasis on a fifty-year scientific challenge with the AI100 account of evolutionary signals, attention-based representations, and end-to-end structure refinement.</p>',
      zh: '<p>2020年，DeepMind 的 AlphaFold2 在 CASP14 中取得重大突破，证明深度学习可以以改变日常生物学研究的精度预测蛋白质结构。融合后的页面结合了深度学习发展线对“困扰生物学界五十年难题”的强调，以及 AI100 对进化信号、基于注意力的表示和端到端结构优化的解释。</p>'
    },
    figures: [
      {
        name: { en: 'John Jumper', zh: '约翰·江珀' },
        role: { en: 'AlphaFold2 lead researcher', zh: 'AlphaFold2 主要研究者' }
      },
      {
        name: { en: 'Demis Hassabis', zh: '德米斯·哈萨比斯' },
        role: { en: 'DeepMind co-founder and AlphaFold leader', zh: 'DeepMind 联合创始人与 AlphaFold 负责人' }
      }
    ]
  }
];

const FUSION_BY_ID = new Map();
for (const fusion of FUSIONS) {
  for (const id of [fusion.deep, fusion.ai100, ...(fusion.ids || [])]) {
    if (id) FUSION_BY_ID.set(id, fusion);
  }
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function localizedText(value) {
  if (value && typeof value === 'object') {
    return [value.en, value.zh].filter(Boolean).join(' ');
  }
  return String(value || '');
}

function normalizeKey(value) {
  return localizedText(value)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '')
    .trim();
}

function mergeUnique(primary, secondary, getKey = (item) => JSON.stringify(item)) {
  const result = [];
  const seen = new Set();
  for (const item of [...(primary || []), ...(secondary || [])]) {
    if (!item) continue;
    const key = getKey(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(clone(item));
  }
  return result;
}

function mergeFigures(deepFigures, ai100Figures) {
  return mergeUnique(deepFigures, ai100Figures, (figure) => normalizeKey(figure && figure.name));
}

function getFusionAssetConfig(fusion) {
  return (fusion && fusion.canonical && FUSION_ASSETS[fusion.canonical]) || {};
}

function makeImageExcluder(assetConfig) {
  const exact = new Set((assetConfig.excludeImages || []).map((url) => String(url || '').trim()).filter(Boolean));
  const patterns = (assetConfig.excludeImagePatterns || [])
    .map((pattern) => {
      if (pattern instanceof RegExp) return pattern;
      const text = String(pattern || '').trim();
      if (!text) return null;
      return {
        test: (url) => url.includes(text)
      };
    })
    .filter(Boolean);

  return (url) => {
    const value = String(url || '').trim();
    if (!value) return true;
    if (exact.has(value)) return true;
    return patterns.some((pattern) => pattern.test(value));
  };
}

function mergeImages(ai100, deep, fusion = {}) {
  const assetConfig = getFusionAssetConfig(fusion);
  const isExcluded = makeImageExcluder(assetConfig);
  const merged = assetConfig.images
    ? clone(assetConfig.images)
    : mergeUnique(ai100 && ai100.images, deep && deep.images, (url) => String(url || ''));
  return merged.filter((url) => !isExcluded(url));
}

function mergeImageMeta(ai100, deep, images) {
  const merged = {
    ...clone((deep && deep.imageMeta) || {}),
    ...clone((ai100 && ai100.imageMeta) || {})
  };
  const keep = new Set(images || []);
  return Object.fromEntries(Object.entries(merged).filter(([url]) => keep.has(url)));
}

function applyEventFusion(key, eventMap) {
  const fusion = FUSION_BY_ID.get(key);
  const current = eventMap[key];
  if (!fusion || !current) return clone(current);

  const deep = eventMap[fusion.deep] || {};
  const ai100 = eventMap[fusion.ai100] || {};
  const base = clone(ai100 && Object.keys(ai100).length ? ai100 : current);
  const achievement = clone(base.achievement || {});
  const images = mergeImages(ai100, deep, fusion);

  return {
    ...base,
    fusionCanonical: fusion.canonical,
    fusionQuoteKey: fusion.ai100,
    year: fusion.year != null ? fusion.year : base.year,
    title: clone(fusion.title || base.title),
    location: clone(fusion.location || base.location || deep.location || current.location),
    description: clone(fusion.description || base.description),
    figures: clone(fusion.figures || mergeFigures(deep.figures, ai100.figures || base.figures)),
    videos: Array.isArray(deep.videos) && deep.videos.length ? clone(deep.videos) : clone(base.videos || []),
    images,
    imageMeta: mergeImageMeta(ai100, deep, images),
    quoteText: clone(base.quoteText || base.quote || current.quoteText),
    quoteMeta: clone(base.quoteMeta || current.quoteMeta),
    quotePage: base.quotePage || current.quotePage || '',
    commentarySections: clone(base.commentarySections || current.commentarySections || []),
    achievement: {
      ...achievement,
      sources: clone((ai100.achievement && ai100.achievement.sources) || achievement.sources || []),
      visualModules: clone((ai100.achievement && ai100.achievement.visualModules) || achievement.visualModules || []),
      keyConcepts: clone((ai100.achievement && ai100.achievement.keyConcepts) || achievement.keyConcepts || []),
      demoImage: (ai100.achievement && ai100.achievement.demoImage) || achievement.demoImage
    }
  };
}

function getFusionCanonical(key) {
  const fusion = FUSION_BY_ID.get(key);
  return fusion ? fusion.canonical : key;
}

module.exports = {
  FUSIONS,
  applyEventFusion,
  getFusionCanonical
};
