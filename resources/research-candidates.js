// AI 历史展览候选研究素材（人工整理）
// 目的：
// 1. 为 Commentary & Media 提供与 description 不重复的文字备选
// 2. 为图片扩充提供可追溯的来源页
// 说明：
// - 这里存的是候选文案与候选图片来源，不直接参与当前页面渲染
// - candidateImageSources 中的 sourceUrl 主要是来源页/PDF 页，便于后续下载、截图或裁剪

const researchCandidates = {
  meta: {
    curatedAt: "2026-04-23",
    purpose: "为 21 个事件补充图片/文字展示备选，降低 Commentary & Media 与 description 的重复度",
  },
  events: {
    "1956-dartmouth": {
      year: 1956,
      title: "达特茅斯会议 - AI正式诞生！",
      displayCommentarySections: [
        {
          label: "背景解读",
          text: "达特茅斯项目的重要性不只在于一次夏季研讨，而在于它第一次把语言、抽象、学习、神经网络与自我改进放进同一份研究议程中，给分散的研究方向立下了共同问题域。",
        },
        {
          label: "延展说明",
          text: "这场会议并没有立刻产出统一理论，却成功完成了一件更深远的事：它把“人工智能”从提案里的命名，变成了一个可以持续聚拢研究者、资金和公众想象的学科标签。",
        },
      ],
      candidateTexts: {
        background: {
          text: "达特茅斯项目的重要性不只在于一次夏季研讨，而在于它第一次把语言、抽象、学习、神经网络与自我改进放进同一份研究议程中，给分散的研究方向立下了共同问题域。",
          sourceUrls: [
            "https://home.dartmouth.edu/about/artificial-intelligence-ai-coined-dartmouth",
            "https://ai.dartmouth.edu/our-story",
          ],
        },
        extension: {
          text: "这场会议并没有立刻产出统一理论，却成功完成了一件更深远的事：它把“人工智能”从提案里的命名，变成了一个可以持续聚拢研究者、资金和公众想象的学科标签。",
          sourceUrls: [
            "https://home.dartmouth.edu/about/artificial-intelligence-ai-coined-dartmouth",
            "https://ai.dartmouth.edu/our-story",
          ],
        },
      },
      candidateImageSources: [
        {
          label: "达特茅斯命名与历史页面",
          sourceLabel: "Dartmouth",
          sourceUrl: "https://home.dartmouth.edu/about/artificial-intelligence-ai-coined-dartmouth",
          note: "页面可作为会议历史与命名来源的档案图来源。",
        },
        {
          label: "AI at Dartmouth 历史页面",
          sourceLabel: "AI at Dartmouth",
          sourceUrl: "https://ai.dartmouth.edu/our-story",
          note: "适合作为校园历史背景图与展览延展资料页来源。",
        },
      ],
    },
    "1957-perceptron": {
      year: 1957,
      title: "感知机与连接主义",
      displayCommentarySections: [
        {
          label: "背景解读",
          text: "感知机之所以具有标志性，不只因为它是早期神经网络模型，更因为 Rosenblatt 把“可学习的权重系统”从理论设想推进到了可演示、可资助、可被媒体传播的工程对象。",
        },
        {
          label: "延展说明",
          text: "它引发的乐观情绪说明，AI 历史中的很多浪潮并不是在算法完全成熟后才出现，而是在一个原型首次让人看见“机器似乎真的能学”的那一刻就被提前点燃。",
        },
      ],
      candidateTexts: {
        background: {
          text: "感知机之所以具有标志性，不只因为它是早期神经网络模型，更因为 Rosenblatt 把“可学习的权重系统”从理论设想推进到了可演示、可资助、可被媒体传播的工程对象。",
          sourceUrls: [
            "https://www.guinnessworldrecords.com/world-records/760225-first-artificial-neural-network",
            "https://cir.nii.ac.jp/crid/1363670319880315136",
          ],
        },
        extension: {
          text: "它引发的乐观情绪说明，AI 历史中的很多浪潮并不是在算法完全成熟后才出现，而是在一个原型首次让人看见“机器似乎真的能学”的那一刻就被提前点燃。",
          sourceUrls: [
            "https://www.guinnessworldrecords.com/world-records/760225-first-artificial-neural-network",
            "https://cir.nii.ac.jp/crid/1363670319880315136",
          ],
        },
      },
      candidateImageSources: [
        {
          label: "感知机原始论文索引页",
          sourceLabel: "CiNii / 论文索引",
          sourceUrl: "https://cir.nii.ac.jp/crid/1363670319880315136",
          note: "可进一步定位原始论文封面、摘要或引用信息。",
        },
        {
          label: "首个人工神经网络记录页",
          sourceLabel: "Guinness World Records",
          sourceUrl: "https://www.guinnessworldrecords.com/world-records/760225-first-artificial-neural-network",
          note: "适合作为“感知机进入公众视野”的补充视觉来源。",
        },
      ],
    },
    "1969-ai-winter": {
      year: 1969,
      title: "第一次寒冬的到来",
      candidateTexts: {
        background: {
          text: "《Perceptrons》真正改变研究方向的地方，在于它把“哪些任务是单层感知机做不到的”说清楚了；学术界随后开始把注意力从神经网络热潮转向更容易形式化和证明的路线。",
          sourceUrls: [
            "https://mitpress.mit.edu/9780262130431/perceptrons/",
            "https://mitpress.mit.edu/9780262534772/perceptrons/",
          ],
        },
        extension: {
          text: "寒冬并不意味着神经网络从此失效，而是意味着在当时的计算与算法条件下，它的承诺被重新估价；后来 BP、LSTM 与大算力的回归，本质上是在补齐当年缺失的训练机制与资源基础。",
          sourceUrls: [
            "https://mitpress.mit.edu/9780262130431/perceptrons/",
            "https://mitpress.mit.edu/9780262534772/perceptrons/",
          ],
        },
      },
      candidateImageSources: [
        {
          label: "Perceptrons 初版图书页",
          sourceLabel: "MIT Press",
          sourceUrl: "https://mitpress.mit.edu/9780262130431/perceptrons/",
          note: "可用作“寒冬”章节中的关键文献封面图来源。",
        },
        {
          label: "Perceptrons 再版图书页",
          sourceLabel: "MIT Press",
          sourceUrl: "https://mitpress.mit.edu/9780262534772/perceptrons/",
          note: "适合作为该书长期影响的补充文献图来源。",
        },
      ],
    },
    "1986-backpropagation": {
      year: 1986,
      title: "反向传播算法",
      candidateTexts: {
        background: {
          text: "反向传播的关键不只是“把误差往回传”，而是把多层网络中每一层参数都嵌入统一的可微计算图里，让表示学习第一次变成真正可训练的工程流程。",
          sourceUrls: [
            "https://www.nature.com/articles/323533a0",
            "https://ui.adsabs.harvard.edu/abs/1986Natur.323..533R/abstract",
          ],
        },
        extension: {
          text: "它为后来深度学习复兴打下的基础，是让“隐藏层能学到什么”从人工设计问题变成数据驱动问题；这一步把神经网络从概念模型推进到了可扩展的方法论。",
          sourceUrls: [
            "https://www.nature.com/articles/323533a0",
            "https://ui.adsabs.harvard.edu/abs/1986Natur.323..533R/abstract",
          ],
        },
      },
      candidateImageSources: [
        {
          label: "Nature 论文摘要页",
          sourceLabel: "Nature",
          sourceUrl: "https://www.nature.com/articles/323533a0",
          note: "可截取论文标题、作者信息或示意图作为文献图。",
        },
        {
          label: "论文索引摘要页",
          sourceLabel: "ADS",
          sourceUrl: "https://ui.adsabs.harvard.edu/abs/1986Natur.323..533R/abstract",
          note: "适合作为可追溯的摘要来源补充。",
        },
      ],
    },
    "1989-cnn": {
      year: 1989,
      title: "卷积神经网络",
      candidateTexts: {
        background: {
          text: "CNN 的持久价值在于把图像的局部性与平移不变性写进网络结构本身：局部感受野与权值共享不是简单的工程技巧，而是对视觉统计规律的结构化利用。",
          sourceUrls: [
            "https://cir.nii.ac.jp/crid/1362544418782658688",
            "https://www.researchgate.net/publication/2985446_Gradient-Based_Learning_Applied_to_Document_Recognition",
          ],
        },
        extension: {
          text: "LeNet 的意义还在于它展示了“算法 + 数据集 + 真实任务”的闭环：当网络能稳定读懂手写数字时，神经网络才第一次在工业可用性上获得了持续说服力。",
          sourceUrls: [
            "https://cir.nii.ac.jp/crid/1362544418782658688",
            "https://www.researchgate.net/publication/2985446_Gradient-Based_Learning_Applied_to_Document_Recognition",
          ],
        },
      },
      candidateImageSources: [
        {
          label: "LeNet 论文索引页",
          sourceLabel: "CiNii / 论文索引",
          sourceUrl: "https://cir.nii.ac.jp/crid/1362544418782658688",
          note: "可用于追溯 LeNet 文献与原始图示。",
        },
        {
          label: "LeNet 论文页面",
          sourceLabel: "ResearchGate",
          sourceUrl: "https://www.researchgate.net/publication/2985446_Gradient-Based_Learning_Applied_to_Document_Recognition",
          note: "页面常见网络结构图与识别结果图，可作为后续下载或重绘依据。",
        },
      ],
    },
    "1986-rnn": {
      year: 1986,
      title: "循环神经网络",
      candidateTexts: {
        background: {
          text: "早期 RNN 的突破点在于把“历史状态”显式放回网络内部：context units 让模型不再只看当前输入，而是能把先前时间步的信息压缩成一个可反复读取的内部记忆。",
          sourceUrls: [
            "https://www.researchgate.net/publication/339789954_Finding_structure_in_time",
          ],
        },
        extension: {
          text: "它也暴露了一个长期难题：序列建模的想法很早就有，但没有稳定训练机制时，这类模型很难真正把长距离依赖学出来；这条线最后要靠 LSTM 才被接上。",
          sourceUrls: [
            "https://www.researchgate.net/publication/339789954_Finding_structure_in_time",
          ],
        },
      },
      candidateImageSources: [
        {
          label: "Elman 论文页面",
          sourceLabel: "ResearchGate",
          sourceUrl: "https://www.researchgate.net/publication/339789954_Finding_structure_in_time",
          note: "可定位 Simple RNN / context units 相关图示。",
        },
      ],
    },
    "1997-lstm": {
      year: 1997,
      title: "LSTM与门控机制",
      candidateTexts: {
        background: {
          text: "LSTM 的核心并不是“多了几个门”，而是它把长期记忆的保存与写入、读取分开管理，使梯度传播和状态更新不再互相掣肘。",
          sourceUrls: [
            "https://doi.org/10.1162/neco.1997.9.8.1735",
            "https://www.researchgate.net/publication/13853244_Long_Short-Term_Memory",
          ],
        },
        extension: {
          text: "从历史角度看，LSTM 是连接主义里一次典型的“结构补偿算法不足”案例：当标准 RNN 难以训练时，研究者没有放弃序列模型，而是通过结构设计把可训练性重新找回来。",
          sourceUrls: [
            "https://doi.org/10.1162/neco.1997.9.8.1735",
            "https://www.researchgate.net/publication/13853244_Long_Short-Term_Memory",
          ],
        },
      },
      candidateImageSources: [
        {
          label: "LSTM DOI 页面",
          sourceLabel: "Neural Computation / DOI",
          sourceUrl: "https://doi.org/10.1162/neco.1997.9.8.1735",
          note: "适合作为原始论文与引用入口。",
        },
        {
          label: "LSTM 论文页面",
          sourceLabel: "ResearchGate",
          sourceUrl: "https://www.researchgate.net/publication/13853244_Long_Short-Term_Memory",
          note: "可定位 cell 与门控机制图示，便于后续取图。",
        },
      ],
    },
    "2012-alexnet": {
      year: 2012,
      title: "ImageNet时代：AlexNet与深度学习爆发",
      displayCommentarySections: [
        {
          label: "背景解读",
          text: "AlexNet 的爆发性影响来自多种条件首次同时成熟：大规模标注数据、GPU 训练、ReLU 与 Dropout 等工程技巧，被整合成一条能够稳定赢下基准测试的流水线。",
        },
        {
          label: "延展说明",
          text: "它让深度学习从“学术上可能有效”变成“行业必须认真对待的默认路线”：一旦在 ImageNet 这种公开、可复验的竞赛上形成数量级优势，研究范式的切换就会迅速发生。",
        },
      ],
      candidateTexts: {
        background: {
          text: "AlexNet 的爆发性影响来自多种条件首次同时成熟：大规模标注数据、GPU 训练、ReLU 与 Dropout 等工程技巧，被整合成一条能够稳定赢下基准测试的流水线。",
          sourceUrls: [
            "https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks",
            "https://cacm.acm.org/research/imagenet-classification-with-deep-convolutional-neural-networks/",
          ],
        },
        extension: {
          text: "它让深度学习从“学术上可能有效”变成“行业必须认真对待的默认路线”：一旦在 ImageNet 这种公开、可复验的竞赛上形成数量级优势，研究范式的切换就会迅速发生。",
          sourceUrls: [
            "https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks",
            "https://cacm.acm.org/research/imagenet-classification-with-deep-convolutional-neural-networks/",
          ],
        },
      },
      candidateImageSources: [
        {
          label: "AlexNet NeurIPS 页面",
          sourceLabel: "NeurIPS",
          sourceUrl: "https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks",
          note: "可作为原始论文与结构图入口。",
        },
        {
          label: "CACM 回顾文章",
          sourceLabel: "Communications of the ACM",
          sourceUrl: "https://cacm.acm.org/research/imagenet-classification-with-deep-convolutional-neural-networks/",
          note: "适合作为“ImageNet 改变视觉研究”的补充图文来源。",
        },
      ],
    },
    "2014-highway-network": {
      year: 2014,
      title: "Highway Network",
      candidateTexts: {
        background: {
          text: "Highway Network 的关键想法是给深层网络加入可学习的“通行门”：当某一层不必改写信息时，模型可以让信号近似原样穿过，从而把极深网络训练从“必须层层重写”改成“按需变换”。",
          sourceUrls: [
            "https://arxiv.org/abs/1505.00387",
            "https://papers.cool/arxiv/1505.00387",
          ],
        },
        extension: {
          text: "它在深度学习史上的位置，像是一座桥：一边是门控思想对可训练性的修补，另一边是 ResNet 用更简洁 shortcut 结构把同样的优化直觉推向主流。",
          sourceUrls: [
            "https://arxiv.org/abs/1505.00387",
            "https://papers.cool/arxiv/1505.00387",
          ],
        },
      },
      candidateImageSources: [
        {
          label: "Highway Networks arXiv 页面",
          sourceLabel: "arXiv",
          sourceUrl: "https://arxiv.org/abs/1505.00387",
          note: "可定位门控结构与实验深度设置图示。",
        },
        {
          label: "Highway Networks 索引页",
          sourceLabel: "papers.cool",
          sourceUrl: "https://papers.cool/arxiv/1505.00387",
          note: "适合作为便于查找的二级索引页。",
        },
      ],
    },
    "2015-resnet": {
      year: 2015,
      title: "ResNet",
      candidateTexts: {
        background: {
          text: "ResNet 的真正突破不是“更深”本身，而是把学习目标从完整映射改成残差修正：网络不必每层都重新发明特征，只需在已有表示上做增量改动。",
          sourceUrls: [
            "https://openaccess.thecvf.com/content_cvpr_2016/papers/He_Deep_Residual_Learning_CVPR_2016_paper.pdf",
            "https://doi.org/10.1109/CVPR.2016.90",
          ],
        },
        extension: {
          text: "它之所以迅速成为工程默认项，是因为 shortcut 带来的收益足够大，而代价又极低；相比更复杂的门控设计，ResNet 证明很多时候“结构减法”比“机制加法”更有扩散力。",
          sourceUrls: [
            "https://openaccess.thecvf.com/content_cvpr_2016/papers/He_Deep_Residual_Learning_CVPR_2016_paper.pdf",
            "https://doi.org/10.1109/CVPR.2016.90",
          ],
        },
      },
      candidateImageSources: [
        {
          label: "ResNet CVPR 论文 PDF",
          sourceLabel: "CVF Open Access",
          sourceUrl: "https://openaccess.thecvf.com/content_cvpr_2016/papers/He_Deep_Residual_Learning_CVPR_2016_paper.pdf",
          note: "可直接截取残差块结构图或 ImageNet 结果图。",
        },
        {
          label: "ResNet DOI 页面",
          sourceLabel: "IEEE / DOI",
          sourceUrl: "https://doi.org/10.1109/CVPR.2016.90",
          note: "适合作为正式文献入口保留。",
        },
      ],
    },
    "2016-densenet": {
      year: 2016,
      title: "DenseNet",
      candidateTexts: {
        background: {
          text: "DenseNet 把“每层只看上一层”改成“每层都看所有历史层”，因此它不只是加深梯度通路，更是在表示层面鼓励显式特征复用。",
          sourceUrls: [
            "https://openaccess.thecvf.com/content_cvpr_2017/html/Huang_Densely_Connected_Convolutional_CVPR_2017_paper.html",
            "https://openaccess.thecvf.com/content_cvpr_2017/papers/Huang_Densely_Connected_Convolutional_CVPR_2017_paper.pdf",
          ],
        },
        extension: {
          text: "与 ResNet 相比，DenseNet 更像一种“信息不轻易丢弃”的极端方案：它把前面所有层都保留下来，换来更高的参数效率，也带来更强的内存压力与实现成本。",
          sourceUrls: [
            "https://openaccess.thecvf.com/content_cvpr_2017/html/Huang_Densely_Connected_Convolutional_CVPR_2017_paper.html",
            "https://openaccess.thecvf.com/content_cvpr_2017/papers/Huang_Densely_Connected_Convolutional_CVPR_2017_paper.pdf",
          ],
        },
      },
      candidateImageSources: [
        {
          label: "DenseNet CVPR 页面",
          sourceLabel: "CVF Open Access",
          sourceUrl: "https://openaccess.thecvf.com/content_cvpr_2017/html/Huang_Densely_Connected_Convolutional_CVPR_2017_paper.html",
          note: "可用于定位密连接结构图与实验图表。",
        },
        {
          label: "DenseNet CVPR 论文 PDF",
          sourceLabel: "CVF Open Access",
          sourceUrl: "https://openaccess.thecvf.com/content_cvpr_2017/papers/Huang_Densely_Connected_Convolutional_CVPR_2017_paper.pdf",
          note: "适合作为后续截图与重绘的原始来源。",
        },
      ],
    },
    "2014-gan": {
      year: 2014,
      title: "GAN（生成对抗网路）",
      candidateTexts: {
        background: {
          text: "GAN 的历史意义，在于它把“如何建模复杂分布”改写成一场生成器与判别器之间的对抗游戏，使高维生成不再完全依赖显式概率建模。",
          sourceUrls: [
            "https://papers.nips.cc/paper/5423-generative-adversarial-nets",
            "https://papers.nips.cc/paper/5423-generative-adversarial-nets.pdf",
          ],
        },
        extension: {
          text: "它也开启了一条典型的 AI 发展路径：一个最初训练不稳定、评价困难的方法，因视觉效果足够震撼而迅速获得社区关注，继而倒逼出更强的训练技巧、评价指标与产业应用。",
          sourceUrls: [
            "https://papers.nips.cc/paper/5423-generative-adversarial-nets",
            "https://papers.nips.cc/paper/5423-generative-adversarial-nets.pdf",
          ],
        },
      },
      candidateImageSources: [
        {
          label: "GAN NeurIPS 页面",
          sourceLabel: "NeurIPS",
          sourceUrl: "https://papers.nips.cc/paper/5423-generative-adversarial-nets",
          note: "可定位原始对抗框架示意图与摘要。",
        },
        {
          label: "GAN 论文 PDF",
          sourceLabel: "NeurIPS",
          sourceUrl: "https://papers.nips.cc/paper/5423-generative-adversarial-nets.pdf",
          note: "可截取生成器/判别器流程图作为展示图。",
        },
      ],
    },
    "2014-attention": {
      year: 2014,
      title: "自回归模型和注意力机制",
      candidateTexts: {
        background: {
          text: "注意力机制最初解决的是编码器-解码器的“压缩瓶颈”：与其要求一个固定向量记住整句，不如让解码器在每一步动态检索最相关的输入片段。",
          sourceUrls: [
            "https://arxiv.org/abs/1409.0473",
            "https://huggingface.co/papers/1409.0473",
          ],
        },
        extension: {
          text: "它的重要性不只在翻译精度提升，更在于它引入了一种后来被 Transformer 放大的思想：模型内部的关系，不一定要靠递归传播，也可以靠显式加权来建立。",
          sourceUrls: [
            "https://arxiv.org/abs/1409.0473",
            "https://huggingface.co/papers/1409.0473",
          ],
        },
      },
      candidateImageSources: [
        {
          label: "注意力机制 arXiv 页面",
          sourceLabel: "arXiv",
          sourceUrl: "https://arxiv.org/abs/1409.0473",
          note: "可定位 soft alignment 图示与模型结构图。",
        },
        {
          label: "论文索引页",
          sourceLabel: "Hugging Face Papers",
          sourceUrl: "https://huggingface.co/papers/1409.0473",
          note: "适合作为后续快速检索与摘要补充来源。",
        },
      ],
    },
    "2017-transformer": {
      year: 2017,
      title: "Transformer",
      displayCommentarySections: [
        {
          label: "背景解读",
          text: "Transformer 的结构革命，在于它把序列建模的核心从递归与卷积转移到全局自注意力，使不同位置之间的关系可以被并行计算、直接建模。",
        },
        {
          label: "延展说明",
          text: "它后来统治大模型时代，并不只是因为效果更好，更因为这种结构对硬件友好、易于扩展、便于堆叠，使“模型越大越强”的缩放逻辑第一次被充分释放。",
        },
      ],
      candidateTexts: {
        background: {
          text: "Transformer 的结构革命，在于它把序列建模的核心从递归与卷积转移到全局自注意力，使不同位置之间的关系可以被并行计算、直接建模。",
          sourceUrls: [
            "https://proceedings.neurips.cc/paper_files/paper/2017/hash/3f5ee243547dee91fbd053c1c4a845aa-Abstract.html",
            "https://proceedings.neurips.cc/paper_files/paper/2017/file/3f5ee243547dee91fbd053c1c4a845aa-Paper.pdf",
          ],
        },
        extension: {
          text: "它后来统治大模型时代，并不只是因为效果更好，更因为这种结构对硬件友好、易于扩展、便于堆叠，使“模型越大越强”的缩放逻辑第一次被充分释放。",
          sourceUrls: [
            "https://proceedings.neurips.cc/paper_files/paper/2017/hash/3f5ee243547dee91fbd053c1c4a845aa-Abstract.html",
            "https://proceedings.neurips.cc/paper_files/paper/2017/file/3f5ee243547dee91fbd053c1c4a845aa-Paper.pdf",
          ],
        },
      },
      candidateImageSources: [
        {
          label: "Transformer NeurIPS 摘要页",
          sourceLabel: "NeurIPS",
          sourceUrl: "https://proceedings.neurips.cc/paper_files/paper/2017/hash/3f5ee243547dee91fbd053c1c4a845aa-Abstract.html",
          note: "可用作论文入口与摘要页来源。",
        },
        {
          label: "Transformer 论文 PDF",
          sourceLabel: "NeurIPS",
          sourceUrl: "https://proceedings.neurips.cc/paper_files/paper/2017/file/3f5ee243547dee91fbd053c1c4a845aa-Paper.pdf",
          note: "可直接截取编码器/解码器结构图与注意力示意图。",
        },
      ],
    },
    "2018-bert": {
      year: 2018,
      title: "BERT",
      candidateTexts: {
        background: {
          text: "BERT 把 NLP 的重点从“为单个任务设计结构”转到“先做通用语言预训练，再做轻量微调”，这让同一个底座可以快速迁移到问答、分类、抽取等大量任务。",
          sourceUrls: [
            "https://aclanthology.org/N19-1423/",
            "https://aclanthology.org/N19-1423.pdf",
          ],
        },
        extension: {
          text: "它的标志性不只在双向编码，而在于它让“预训练模型”第一次成为 NLP 的标准基础设施；此后模型能力的竞争，逐渐转到数据规模、训练资源与后训练策略上。",
          sourceUrls: [
            "https://aclanthology.org/N19-1423/",
            "https://aclanthology.org/N19-1423.pdf",
          ],
        },
      },
      candidateImageSources: [
        {
          label: "BERT ACL Anthology 页面",
          sourceLabel: "ACL Anthology",
          sourceUrl: "https://aclanthology.org/N19-1423/",
          note: "可保留为正式论文入口。",
        },
        {
          label: "BERT 论文 PDF",
          sourceLabel: "ACL Anthology",
          sourceUrl: "https://aclanthology.org/N19-1423.pdf",
          note: "可截取预训练任务图与实验表格。",
        },
      ],
    },
    "2018-gpt": {
      year: 2018,
      title: "GPT",
      candidateTexts: {
        background: {
          text: "GPT 的决定性贡献，是把 decoder-only 架构与单一自回归目标证明成一条足够强、足够可扩展的通用路线：模型不必为每个任务重写目标函数，也能靠规模化预训练获得迁移能力。",
          sourceUrls: [
            "https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf",
          ],
        },
        extension: {
          text: "从后来历史回看，GPT 的胜利并不只是模型结构胜利，更是“简单目标 + 大规模训练 + 统一生成接口”这套工程哲学的胜利，它为后续对话式大模型奠定了接口习惯。",
          sourceUrls: [
            "https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf",
          ],
        },
      },
      candidateImageSources: [
        {
          label: "GPT 原始论文 PDF",
          sourceLabel: "OpenAI",
          sourceUrl: "https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf",
          note: "可截取 GPT 架构示意、任务迁移图或实验表。",
        },
      ],
    },
    "2023-agents": {
      year: 2023,
      title: "智能体：LLM驱动的自主系统",
      candidateTexts: {
        background: {
          text: "当代 Agentic AI 的关键变化，并不是“会调用工具”这一点本身，而是大语言模型开始同时承担目标分解、状态解释、行动选择与自我修正的认知中枢角色。",
          sourceUrls: [
            "https://react-lm.github.io/",
            "https://arxiv.org/abs/2210.03629",
          ],
        },
        extension: {
          text: "这让智能体从过去依赖手写规划器的系统，变成了一种可通过提示、记忆、工具链和反馈环不断重构行为策略的开放式软件形态，也解释了为什么 2023 后 Agent 产品会迅速爆发。",
          sourceUrls: [
            "https://react-lm.github.io/",
            "https://arxiv.org/abs/2210.03629",
          ],
        },
      },
      candidateImageSources: [
        {
          label: "ReAct 项目页",
          sourceLabel: "ReAct",
          sourceUrl: "https://react-lm.github.io/",
          note: "可用作 LLM+tool use 的代表性页面与图示来源。",
        },
        {
          label: "ReAct arXiv 页面",
          sourceLabel: "arXiv",
          sourceUrl: "https://arxiv.org/abs/2210.03629",
          note: "可定位思维-行动交替流程图。",
        },
      ],
    },
    "2025-llm-competition": {
      year: 2025,
      title: "大语言模型百花齐放",
      candidateTexts: {
        background: {
          text: "大模型竞争的可见化，越来越依赖“活榜单”而不是单次论文成绩：用户偏好投票、公开对战与频繁更新，让模型比较从实验室内部评测走向持续的公共观察。",
          sourceUrls: [
            "https://blog.lmarena.ai/blog/2023/arena/",
            "https://news.lmarena.ai/arena/",
          ],
        },
        extension: {
          text: "这类排行榜的价值，不只在于告诉人们谁排第一，更在于暴露模型差异正在从“通用能力平均值”转向“风格、稳定性、推理链与工具化能力”的组合竞争。",
          sourceUrls: [
            "https://blog.lmarena.ai/blog/2023/arena/",
            "https://news.lmarena.ai/arena/",
          ],
        },
      },
      candidateImageSources: [
        {
          label: "Chatbot Arena 方法介绍",
          sourceLabel: "LMArena Blog",
          sourceUrl: "https://blog.lmarena.ai/blog/2023/arena/",
          note: "适合作为排行榜机制说明与历史页面来源。",
        },
        {
          label: "Arena 新闻入口",
          sourceLabel: "LMArena News",
          sourceUrl: "https://news.lmarena.ai/arena/",
          note: "后续可从该站点选择特定日期的榜单截图作为展示图。",
        },
      ],
    },
    "2020-alphafold": {
      year: 2020,
      title: "AlphaFold: 蛋白质结构预测",
      displayCommentarySections: [
        {
          label: "背景解读",
          text: "AlphaFold 的突破不只是把预测精度提高了一点，而是让从序列到三维结构的推断第一次在大规模基准上接近实验方法的可用水准，改变了结构生物学的工作顺序。",
        },
        {
          label: "延展说明",
          text: "它对 AI for Science 的启发在于：当模型足够强时，AI 不再只是“帮科学家筛选候选”，而是可以直接把原本极其昂贵、周期很长的科学环节前移到计算流程里。",
        },
      ],
      candidateTexts: {
        background: {
          text: "AlphaFold 的突破不只是把预测精度提高了一点，而是让从序列到三维结构的推断第一次在大规模基准上接近实验方法的可用水准，改变了结构生物学的工作顺序。",
          sourceUrls: [
            "https://www.nature.com/articles/s41586-021-03819-2",
          ],
        },
        extension: {
          text: "它对 AI for Science 的启发在于：当模型足够强时，AI 不再只是“帮科学家筛选候选”，而是可以直接把原本极其昂贵、周期很长的科学环节前移到计算流程里。",
          sourceUrls: [
            "https://www.nature.com/articles/s41586-021-03819-2",
          ],
        },
      },
      candidateImageSources: [
        {
          label: "AlphaFold Nature 页面",
          sourceLabel: "Nature",
          sourceUrl: "https://www.nature.com/articles/s41586-021-03819-2",
          note: "可截取结构预测总览图、性能曲线或示例蛋白结构图。",
        },
      ],
    },
    "2019-ai-feynman": {
      year: 2019,
      title: "AI Feynman：自主科学规律发现",
      candidateTexts: {
        background: {
          text: "AI Feynman 的思路很有代表性：它没有把符号回归完全交给暴力搜索，而是引入对称性、量纲分析等物理先验，缩小候选空间，让“机器发现公式”从玩具问题走向真实规律重建。",
          sourceUrls: [
            "https://arxiv.org/abs/1905.11481",
            "https://arxiv.gg/abs/1905.11481",
          ],
        },
        extension: {
          text: "这类系统的重要价值在于可解释性。与只给出预测结果的黑盒模型相比，AI Feynman 直接输出人类可读的方程，因此它更像是“可交付给科学共同体”的中间发现工具。",
          sourceUrls: [
            "https://arxiv.org/abs/1905.11481",
            "https://arxiv.gg/abs/1905.11481",
          ],
        },
      },
      candidateImageSources: [
        {
          label: "AI Feynman arXiv 页面",
          sourceLabel: "arXiv",
          sourceUrl: "https://arxiv.org/abs/1905.11481",
          note: "可定位方法流程图与实验结果图。",
        },
        {
          label: "AI Feynman 论文索引页",
          sourceLabel: "arXiv.gg",
          sourceUrl: "https://arxiv.gg/abs/1905.11481",
          note: "适合作为二级摘要与检索页保留。",
        },
      ],
    },
    "2024-ai-scientist": {
      year: 2024,
      title: "AI科学家与自主实验室",
      candidateTexts: {
        background: {
          text: "这类系统真正新的地方，并不是能写出论文段落，而是把“提出假设、设计流程、调用工具、执行实验、评估结果”连成了闭环，开始触碰科学研究的工作流自动化。",
          sourceUrls: [
            "https://www.sakanaai.org/sakana-ai-scientist/",
            "https://www.nature.com/articles/s41586-023-06792-0",
          ],
        },
        extension: {
          text: "它也意味着 AI for Science 的评价标准正在改变：未来的关键问题不再只是模型能否解释一张图或一个序列，而是它能否持续产出可验证、可复现实验流程，并在反馈中自我改进。",
          sourceUrls: [
            "https://www.sakanaai.org/sakana-ai-scientist/",
            "https://www.nature.com/articles/s41586-023-06792-0",
          ],
        },
      },
      candidateImageSources: [
        {
          label: "The AI Scientist 官方页面",
          sourceLabel: "Sakana AI",
          sourceUrl: "https://www.sakanaai.org/sakana-ai-scientist/",
          note: "可用作自主论文生成系统的主视觉与介绍页来源。",
        },
        {
          label: "Coscientist Nature 页面",
          sourceLabel: "Nature",
          sourceUrl: "https://www.nature.com/articles/s41586-023-06792-0",
          note: "适合作为“AI 驱动实验流程”方向的补充图文来源。",
        },
      ],
    },
  },
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { researchCandidates };
}

if (typeof window !== "undefined") {
  window.researchCandidates = researchCandidates;
}
