#!/usr/bin/env node
// 生成脚本：读取 catalog.js + events.js，输出 milestones-data.js / milestones-data-default.js
// 用法：node manage/generate.js
//
// 无需安装任何依赖，直接运行即可。

'use strict';

const fs = require('fs');
const path = require('path');

// ─── 路径配置 ────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');
const VIDEOS_DIR = path.join(ROOT, 'resources', 'videos');
const OUTPUTS = [path.join(ROOT, 'milestones-data.js'), path.join(ROOT, 'milestones-data-default.js')];
const AVATAR_REGISTRY_PATH = path.join(__dirname, 'figure-avatars.js');
const RESEARCH_CANDIDATES_PATH = path.join(ROOT, 'resources', 'research-candidates.js');
const QUOTE_CANDIDATES_PATH = path.join(ROOT, 'resources', 'quote-candidates.js');
const QUIZ_CATALOG_PATH = path.join(__dirname, 'quizzes.js');
const QUIZ_STORYLINE_ID = 'bench-council-ai100';
const QUIZ_STORYLINE_IDS = new Set([QUIZ_STORYLINE_ID, 'gaming-ai']);
const QUOTE_KIND_QUOTE = 'quote';
const QUOTE_KIND_KEY_IDEA = 'keyIdea';
// AI100 entries default to key ideas unless the displayed text has been checked
// against a reliable source page for the cited work.
const VERIFIED_AI100_QUOTE_KEYS = new Set([
    '1950-turing-test',
    '2016-alphago',
    '1971-vc-theory',
    '1958-wangs-algorithm',
    '2014-adam'
]);
const AI100_KEY_IDEA_OVERRIDES = {
    '1958-lisp': {
        en: 'LISP made symbolic AI programmable: lists represented knowledge, and recursive functions let programs manipulate that knowledge directly.',
        zh: 'LISP 让符号 AI 可以被编程实现：列表用来表示知识，递归函数让程序能直接操作这些知识。'
    },
    '1971-complexity-theory': {
        en: 'NP-completeness shows that many hard problems are hard in the same way: if one NP-complete problem can be solved quickly, every problem whose answer can be checked quickly can be solved quickly.',
        zh: 'NP 完全性说明，许多看似不同的难题共享同一种困难性：如果能快速解决任何一个 NP 完全问题，就能快速解决所有“答案容易检查”的 NP 问题。'
    },
    '1971-vc-theory': {
        en: 'VC theory explains when learning from examples should generalize to new cases, not just memorize the training data.',
        zh: 'VC 理论解释了模型何时能从样本推广到新情况，而不是只记住训练数据。'
    },
    '1956-logic-theorist': {
        en: 'Logic Theorist treated proving as search: it tried symbolic steps until it found a path from assumptions to a theorem.',
        zh: 'Logic Theorist 把证明看成搜索：程序不断尝试符号推理步骤，直到从前提走到定理。'
    },
    '1960-davis-putnam-dpll': {
        en: 'Davis-Putnam and DPLL turned logical satisfiability into a systematic search problem, pruning impossible choices instead of checking every case blindly.',
        zh: 'Davis-Putnam 与 DPLL 把逻辑可满足性变成系统搜索问题，通过剪掉不可能的选择，避免盲目枚举所有情况。'
    },
    '1958-wangs-algorithm': {
        en: "Wang's algorithm showed that parts of logical proof can be automated by repeatedly applying simple symbol-transformation rules.",
        zh: '王氏算法说明，逻辑证明的一部分可以通过反复应用简单的符号变换规则来自动完成。'
    },
    '2014-adam': {
        en: 'Adam adapts each parameter step using running averages of gradients and their sizes, making neural-network training easier to tune.',
        zh: 'Adam 用梯度及其幅度的移动平均来调整每个参数的更新步长，让神经网络训练更容易调参。'
    },
    '2014-vgg': {
        en: 'VGG showed that stacking many small convolution filters can build a simple, deep visual recognizer that learns richer image features layer by layer.',
        zh: 'VGG 说明，连续堆叠许多小卷积滤波器，也能形成简单而很深的视觉识别器，逐层学习更丰富的图像特征。'
    },
    '1975-genetic-algorithm': {
        en: 'Genetic algorithms search by evolving candidate answers: keep stronger solutions, mix them, mutate them, and repeat.',
        zh: '遗传算法通过“进化”候选答案来搜索：保留较好的解，交叉组合，随机变异，然后反复迭代。'
    },
    '2015-u-net': {
        en: 'U-Net combines a shrinking context path with an expanding detail path so a model can both understand an image and mark precise pixel regions.',
        zh: 'U-Net 把提取上下文的收缩路径和恢复细节的扩张路径结合起来，让模型既理解图像，又能精确标出像素区域。'
    },
    '2015-faster-r-cnn': {
        en: 'Faster R-CNN learns where objects might be and what they are in one shared network, making proposal-based detection much faster.',
        zh: 'Faster R-CNN 在同一个共享网络中学习“物体可能在哪里”和“物体是什么”，让基于候选区域的检测大幅加速。'
    },
    '1992-svm': {
        en: 'Support Vector Machines draw the widest possible boundary between classes, using only the critical examples closest to the boundary.',
        zh: '支持向量机寻找类别之间尽可能宽的分界线，并主要依靠最靠近边界的关键样本来确定它。'
    },
    '1984-cart': {
        en: 'CART explains prediction as a sequence of yes-or-no splits, forming a tree that is easy to inspect and prune.',
        zh: 'CART 把预测解释成一连串是/否分裂，形成一棵容易查看和剪枝的决策树。'
    },
    '1983-simulated-annealing': {
        en: 'Simulated annealing escapes poor local choices by sometimes accepting worse moves early, then becoming more selective as the search cools.',
        zh: '模拟退火在早期有时接受更差的移动来跳出局部最优，随后随着“降温”逐渐变得更挑剔。'
    },
    '1996-lasso': {
        en: 'Lasso makes models simpler by pushing unneeded coefficients to zero, so prediction and feature selection happen together.',
        zh: 'Lasso 通过把不需要的系数压到零来简化模型，使预测和特征选择同时发生。'
    },
    '2015-googlenet-inception': {
        en: 'Inception lets a network look at several visual scales in parallel, then combine the useful signals into one compact representation.',
        zh: 'Inception 让网络并行观察多个视觉尺度，再把有用信号合并成紧凑表示。'
    },
    '1965-resolution-method': {
        en: 'Resolution proves statements by contradiction: convert facts into clauses, combine opposing clauses, and search for an inconsistency.',
        zh: '归结方法通过反证来证明命题：把事实转成子句，合并相互矛盾的子句，并搜索是否能推出矛盾。'
    },
    '1973-prolog': {
        en: 'PROLOG lets programmers write facts and rules, then asks the machine to answer queries by logical inference.',
        zh: 'PROLOG 让程序员写下事实和规则，再让机器通过逻辑推理回答查询。'
    },
    '1966-eliza': {
        en: 'ELIZA showed that simple pattern-matching rules can make a computer conversation feel surprisingly human, even without real understanding.',
        zh: 'ELIZA 说明，简单的模式匹配规则也能让计算机对话显得出人意料地像人，尽管它并不真正理解内容。'
    },
    '1982-hopfield-network': {
        en: 'A Hopfield network stores patterns as stable states, then cleans up a noisy input by settling into the nearest remembered pattern.',
        zh: 'Hopfield 网络把模式存成稳定状态，再通过收敛到最近的记忆模式来修复带噪输入。'
    },
    '2014-dropout': {
        en: 'Dropout trains a network while randomly hiding neurons, forcing features to work together instead of relying on a few fragile shortcuts.',
        zh: 'Dropout 在训练时随机隐藏神经元，迫使特征协同工作，而不是依赖少数脆弱捷径。'
    },
    '2016-yolo': {
        en: 'YOLO treats object detection as one fast prediction: divide the image into regions and predict boxes and classes in a single pass.',
        zh: 'YOLO 把目标检测变成一次快速预测：把图像分成区域，并在一次前向计算中预测边框和类别。'
    },
    '2013-word2vec': {
        en: 'Word2Vec learns word meaning from context, placing words used in similar situations near each other in vector space.',
        zh: 'Word2Vec 从上下文中学习词义，把使用场景相似的词放到向量空间中相近的位置。'
    },
    '2009-imagenet': {
        en: 'ImageNet gave computer vision a huge labeled benchmark, making progress measurable and pushing models to learn from real visual variety.',
        zh: 'ImageNet 为计算机视觉提供了大规模标注基准，让进展可以被衡量，也推动模型从真实多样的图像中学习。'
    },
    '2013-dqn': {
        en: 'DQN combined Q-learning with deep networks, letting an agent learn game actions from pixels, rewards, and replayed experience.',
        zh: 'DQN 把 Q-learning 与深度网络结合起来，让智能体从像素、奖励和回放经验中学习游戏动作。'
    },
    '2003-lda': {
        en: 'LDA explains documents as mixtures of hidden topics, where each topic is a pattern of words that tends to appear together.',
        zh: 'LDA 把文档解释为隐藏主题的混合，每个主题都是一组经常共同出现的词。'
    },
    '1970-shrdlu': {
        en: 'SHRDLU connected language to actions in a blocks world, showing how a program could parse commands, reason, and manipulate objects.',
        zh: 'SHRDLU 把语言和积木世界中的动作连接起来，展示程序如何解析指令、推理并操作物体。'
    },
    '1997-deep-blue': {
        en: 'Deep Blue beat elite chess by combining massive search, chess knowledge, evaluation functions, and specialized hardware.',
        zh: '深蓝通过结合大规模搜索、国际象棋知识、局面评估函数和专用硬件，击败顶级棋手。'
    },
    '1974-frame': {
        en: 'Frames organize knowledge as structured objects with slots, defaults, and inheritance, making common-sense facts easier to reuse.',
        zh: '框架把知识组织成带槽位、默认值和继承关系的结构化对象，让常识事实更容易复用。'
    },
    '1965-dendral': {
        en: 'DENDRAL used expert chemical rules to narrow possible molecular structures, showing how knowledge could guide scientific search.',
        zh: 'DENDRAL 用化学专家规则缩小可能的分子结构范围，展示知识如何引导科学搜索。'
    },
    '1999-sift': {
        en: 'SIFT finds distinctive local image features that stay recognizable despite changes in scale, rotation, and viewpoint.',
        zh: 'SIFT 寻找有辨识度的局部图像特征，即使尺度、旋转和视角变化，这些特征仍能被识别。'
    },
    '2008-tsne': {
        en: 't-SNE maps high-dimensional data into 2D or 3D so nearby points still tend to represent similar examples.',
        zh: 't-SNE 把高维数据映射到 2D 或 3D，使相近的点仍大致代表相似样本。'
    },
    '1958-rosenblatt-perceptron': {
        en: 'The perceptron learns a linear decision rule by adjusting weights when it makes mistakes.',
        zh: '感知机通过在出错时调整权重，学习一条线性决策规则。'
    },
    '2006-dbn': {
        en: 'Deep Belief Networks trained deep layers step by step before fine-tuning, helping revive interest in deep neural networks.',
        zh: '深度置信网络先逐层训练深层结构，再整体微调，帮助重新点燃人们对深度神经网络的兴趣。'
    },
    '1988-td-update': {
        en: 'Temporal-difference learning updates predictions from the difference between what an agent expected and what the next moment suggests.',
        zh: '时序差分学习根据“原本预期”和“下一时刻提示”之间的差距来更新预测。'
    },
    '1985-bayesian-network': {
        en: 'Bayesian networks use a directed graph to show which variables influence others, then update beliefs as evidence arrives.',
        zh: '贝叶斯网络用有向图表示变量之间的影响关系，并在新证据出现时更新信念。'
    },
    '1990-otter': {
        en: 'Otter made automated theorem proving practical by organizing clauses and repeatedly selecting promising proof steps.',
        zh: 'Otter 通过组织子句并反复选择有希望的证明步骤，让自动定理证明更实用。'
    },
    '2011-ibm-watson': {
        en: 'IBM Watson answered open-domain questions by generating candidate answers, gathering evidence, and ranking the most supported response.',
        zh: 'IBM Watson 通过生成候选答案、收集证据并排序，来回答开放领域问题。'
    },
    '1951-strachey-draughts': {
        en: 'Strachey showed that computers could run symbolic game-playing programs, not just numerical calculations.',
        zh: '斯特雷奇的跳棋程序说明，计算机不仅能做数值计算，也能运行符号化的博弈程序。'
    },
    '1994-chinook': {
        en: 'Chinook combined search, opening knowledge, and endgame databases to push checkers toward perfect play.',
        zh: 'Chinook 结合搜索、开局知识和残局数据库，把跳棋推进到接近完美对弈。'
    },
    '1959-pandemonium': {
        en: 'Pandemonium models perception as many small feature detectors competing and voting until a higher-level interpretation wins.',
        zh: 'Pandemonium 把感知建模为许多小特征检测器竞争和投票，直到较高层解释胜出。'
    },
    '1984-cyc': {
        en: 'Cyc tried to encode everyday common sense explicitly, so AI systems could reason with facts people usually leave unstated.',
        zh: 'Cyc 试图显式编码日常常识，让 AI 系统能使用人类通常不会明说的事实进行推理。'
    },
    '1980-xcon-r1': {
        en: 'XCON used expert rules to configure computer orders, proving that rule-based AI could solve valuable industrial problems.',
        zh: 'XCON 用专家规则配置计算机订单，证明基于规则的 AI 可以解决有商业价值的工业问题。'
    },
    '1957-kmeans': {
        en: 'K-means groups data by repeatedly assigning points to the nearest center and moving each center to the average of its group.',
        zh: 'K-means 通过反复把点分配给最近中心，并把每个中心移到本组平均位置来聚类数据。'
    },
    '1996-dbscan': {
        en: 'DBSCAN finds clusters as dense neighborhoods and marks isolated points as noise, without needing the number of clusters in advance.',
        zh: 'DBSCAN 把密集邻域识别为簇，把孤立点标为噪声，而且不需要提前知道簇的数量。'
    },
    '2000-spectral-clustering': {
        en: 'Spectral clustering turns data into a graph, uses eigenvectors to reveal its shape, and cuts the graph into natural groups.',
        zh: '谱聚类先把数据变成图，再用特征向量揭示结构，最后把图切分成自然群组。'
    },
    'ai100-1967-knn': {
        en: 'KNN predicts by looking at the most similar stored examples and letting their labels vote.',
        zh: 'KNN 通过查找最相似的已存样本，并让它们的标签投票来做预测。'
    },
    'ai100-1970-ridge': {
        en: 'Ridge regression keeps linear models stable by shrinking coefficients, especially when features overlap or data is noisy.',
        zh: '岭回归通过收缩系数让线性模型更稳定，特别适合特征重叠或数据有噪声的情况。'
    },
    'ai100-2005-hog': {
        en: 'HOG describes an image by the directions of local edges, making human shapes easier for a classifier to detect.',
        zh: 'HOG 用局部边缘方向描述图像，让分类器更容易检测人体形状。'
    },
    'ai100-2006-surf': {
        en: 'SURF detects and describes local image points quickly, helping match the same object across different views.',
        zh: 'SURF 快速检测并描述局部图像点，帮助在不同视角中匹配同一物体。'
    },
    'ai100-1997-kernel-pca': {
        en: 'Kernel PCA uses kernel functions to uncover nonlinear structure while still solving an eigenvector problem.',
        zh: '核 PCA 用核函数发现非线性结构，同时仍然把问题转化为特征向量求解。'
    },
    'ai100-1999-nmf': {
        en: 'NMF breaks data into additive parts, so images or documents can be explained as combinations of interpretable components.',
        zh: 'NMF 把数据分解为可相加的部分，使图像或文档能被解释为可理解组件的组合。'
    },
    'ai100-2000-isomap': {
        en: 'Isomap preserves distances along a curved data manifold, revealing low-dimensional structure that straight-line distances miss.',
        zh: 'Isomap 保留弯曲数据流形上的距离，揭示直线距离看不到的低维结构。'
    },
    'ai100-2000-lle': {
        en: 'Locally Linear Embedding preserves each point as a mixture of its neighbors, then unfolds the data into fewer dimensions.',
        zh: '局部线性嵌入保留每个点由邻居线性组合而成的关系，再把数据展开到更低维空间。'
    },
    'ai100-1943-mcculloch-pitts-neuron': {
        en: 'The McCulloch-Pitts neuron showed how simple on/off units could compute logic, linking brains to computation.',
        zh: '麦卡洛克-皮茨神经元说明，简单的开/关单元也能计算逻辑，从而把大脑与计算联系起来。'
    },
    'ai100-1951-snarc': {
        en: 'SNARC used analog circuits and reward feedback to model a machine learning its way through a maze.',
        zh: 'SNARC 用模拟电路和奖励反馈来模拟机器学习走迷宫的过程。'
    },
    'ai100-1982-som': {
        en: 'A self-organizing map arranges similar inputs near each other, turning high-dimensional patterns into a readable map.',
        zh: '自组织映射把相似输入排在相邻位置，将高维模式变成更容易阅读的地图。'
    },
    'ai100-1967-back-propagation': {
        en: 'Back-propagation sends error signals backward through layers so each weight learns how it contributed to the mistake.',
        zh: '反向传播把误差信号沿网络层向后传递，让每个权重知道自己对错误贡献了多少。'
    },
    'ai100-1969-relu': {
        en: 'ReLU keeps positive signals and clips negative ones to zero, giving deep networks a simple nonlinearity that trains well.',
        zh: 'ReLU 保留正信号、把负信号截为零，为深层网络提供简单且易训练的非线性。'
    },
    'ai100-1980-neocognitron': {
        en: 'Neocognitron used layered local feature detectors to recognize patterns even when their position shifted.',
        zh: 'Neocognitron 使用分层局部特征检测器，即使图案位置移动也能识别。'
    },
    'ai100-1989-lenet': {
        en: 'LeNet showed that a convolutional network could learn visual features and classify handwritten digits end to end.',
        zh: 'LeNet 证明卷积网络可以端到端学习视觉特征并识别手写数字。'
    },
    'ai100-2000-neural-language-model': {
        en: 'Neural language models learn word vectors from context and use them to predict the next word.',
        zh: '神经语言模型从上下文中学习词向量，并用它们预测下一个词。'
    },
    'ai100-2012-alexnet': {
        en: 'AlexNet showed that large GPU-trained convolutional networks could dramatically outperform older vision systems on ImageNet.',
        zh: 'AlexNet 证明，使用 GPU 训练的大型卷积网络能在 ImageNet 上大幅超过旧式视觉系统。'
    },
    'ai100-2015-resnet': {
        en: 'ResNet adds shortcut connections so very deep networks learn corrections to features instead of relearning everything from scratch.',
        zh: 'ResNet 加入快捷连接，让很深的网络学习对特征的修正，而不是每层都从头重学。'
    },
    'ai100-2015-batch-normalization': {
        en: 'Batch normalization stabilizes training by normalizing layer activations, helping deep networks learn faster and more reliably.',
        zh: '批归一化通过规范化层激活来稳定训练，使深度网络学得更快、更可靠。'
    },
    'ai100-2017-densenet': {
        en: 'DenseNet connects each layer to many later layers, encouraging feature reuse and improving gradient flow.',
        zh: 'DenseNet 将每一层连接到许多后续层，促进特征复用并改善梯度流动。'
    },
    'ai100-2017-transformer': {
        en: 'The Transformer replaces recurrence with attention, letting every token directly weigh the relevance of other tokens.',
        zh: 'Transformer 用注意力取代循环结构，让每个词元直接衡量其他词元与自己的相关性。'
    },
    'ai100-2020-vit': {
        en: 'Vision Transformer treats an image as a sequence of patches, applying transformer attention to visual tokens.',
        zh: '视觉 Transformer 把图像看成一串图像块，对视觉词元应用 Transformer 注意力。'
    },
    'ai100-1997-lstm': {
        en: 'LSTM uses gates to decide what to remember, forget, and output, helping neural networks learn long-range sequences.',
        zh: 'LSTM 用门控决定记住什么、忘掉什么、输出什么，帮助神经网络学习长距离序列关系。'
    },
    'ai100-2014-gan': {
        en: 'A GAN trains a generator and a discriminator against each other, so the generator learns to create more realistic samples.',
        zh: 'GAN 让生成器和判别器相互对抗训练，使生成器逐渐学会产生更真实的样本。'
    },
    'ai100-2014-neural-machine-translation-attention': {
        en: 'Attention in neural translation lets the decoder focus on the relevant source words instead of compressing the whole sentence into one vector.',
        zh: '神经机器翻译中的注意力让解码器关注相关源词，而不是把整句都压缩进一个向量。'
    },
    'ai100-2018-bert': {
        en: 'BERT learns language by predicting masked words from both left and right context, then adapts that knowledge to many tasks.',
        zh: 'BERT 通过左右上下文预测被遮住的词来学习语言，再把这种知识迁移到多种任务。'
    },
    'ai100-2018-gpt': {
        en: 'GPT showed that generative pre-training on large text corpora can produce a language model that adapts to downstream tasks.',
        zh: 'GPT 证明，在大规模文本上进行生成式预训练，可以得到能适配下游任务的语言模型。'
    },
    'ai100-2020-alphafold2': {
        en: 'AlphaFold2 predicts protein 3D structure by combining evolutionary signals, attention, and geometry-aware refinement.',
        zh: 'AlphaFold2 结合进化信号、注意力和几何感知优化来预测蛋白质三维结构。'
    },
    'ai100-2021-clip': {
        en: 'CLIP learns by matching images with natural-language captions, giving one model a shared visual and text understanding.',
        zh: 'CLIP 通过匹配图像和自然语言说明来学习，让一个模型形成共享的视觉与文本理解。'
    },
    'ai100-2021-dalle': {
        en: 'DALL-E showed that a model could generate images from text prompts by learning visual concepts through language.',
        zh: 'DALL-E 证明模型可以通过语言学习视觉概念，并根据文本提示生成图像。'
    },
    'ai100-2022-stable-diffusion': {
        en: 'Stable Diffusion generates images by denoising a compact latent representation instead of working directly in full pixel space.',
        zh: 'Stable Diffusion 通过在紧凑潜空间中去噪生成图像，而不是直接在完整像素空间中操作。'
    },
    'ai100-2023-segment-anything': {
        en: 'Segment Anything makes image segmentation promptable: points, boxes, or masks can tell the model what object to cut out.',
        zh: 'Segment Anything 让图像分割变成可提示任务：点、框或掩码都能告诉模型要切出哪个物体。'
    },
    'ai100-2021-swin-transformer': {
        en: 'Swin Transformer applies attention inside shifted image windows, building hierarchical visual features efficiently.',
        zh: 'Swin Transformer 在移位图像窗口内应用注意力，高效构建层级视觉特征。'
    },
    'ai100-2014-glove': {
        en: 'GloVe learns word vectors from global co-occurrence counts, capturing meaning from how often words appear together.',
        zh: 'GloVe 从全局共现统计中学习词向量，用词语共同出现的频率捕捉语义。'
    },
    'ai100-2014-conditional-gan': {
        en: 'Conditional GANs guide generation with labels or other conditions, making the output controllable instead of purely random.',
        zh: '条件 GAN 用标签或其他条件引导生成，使输出可控，而不是完全随机。'
    },
    'ai100-2015-dcgan': {
        en: 'DCGAN showed that convolutional GANs can learn useful visual features while generating sharper images.',
        zh: 'DCGAN 证明卷积式 GAN 在生成更清晰图像的同时，也能学到有用的视觉特征。'
    },
    'ai100-2017-wasserstein-gan': {
        en: 'Wasserstein GAN changes the training objective so generator progress is smoother and collapse is easier to diagnose.',
        zh: 'Wasserstein GAN 改变训练目标，使生成器进展更平滑，也更容易诊断模式崩塌。'
    },
    'ai100-2017-cyclegan': {
        en: 'CycleGAN learns to translate between two image domains without paired examples by requiring translations to cycle back consistently.',
        zh: 'CycleGAN 不需要成对样本也能在两个图像域之间转换，因为它要求转换后还能一致地转回原图。'
    },
    'ai100-2017-pix2pix': {
        en: 'Pix2Pix learns paired image translation, such as turning sketches into photos, by combining conditional generation with a reconstruction target.',
        zh: 'Pix2Pix 通过条件生成和重建目标学习成对图像转换，例如把草图变成照片。'
    },
    'ai100-2019-stylegan': {
        en: 'StyleGAN controls image generation through style variables at different layers, separating coarse structure from fine details.',
        zh: 'StyleGAN 通过不同层的风格变量控制图像生成，把粗略结构和细节纹理分开。'
    },
    'ai100-2013-variational-autoencoder': {
        en: 'A variational autoencoder learns a smooth latent space where new examples can be sampled and decoded.',
        zh: '变分自编码器学习平滑的潜空间，可以从中采样并解码生成新样本。'
    },
    'ai100-2015-diffusion-model': {
        en: 'Diffusion models learn to reverse gradual noise corruption, turning random noise back into structured data.',
        zh: '扩散模型学习反转逐步加噪过程，把随机噪声还原成有结构的数据。'
    },
    'ai100-2005-gnn': {
        en: 'Graph Neural Networks update each node by exchanging messages with its neighbors, so models can learn from relationships.',
        zh: '图神经网络让每个节点与邻居交换信息来更新表示，使模型能从关系结构中学习。'
    },
    'ai100-2016-gcn': {
        en: 'GCN spreads and transforms features along graph edges, enabling semi-supervised learning from both labels and network structure.',
        zh: 'GCN 沿图边传播并变换特征，使模型能同时利用标签和网络结构进行半监督学习。'
    },
    'ai100-2017-gat': {
        en: 'GAT lets each node pay different attention to different neighbors instead of treating every graph edge equally.',
        zh: 'GAT 让每个节点对不同邻居分配不同注意力，而不是把所有图边一视同仁。'
    },
    'ai100-2016-nas': {
        en: 'Neural architecture search automates model design by proposing, training, scoring, and improving candidate networks.',
        zh: '神经架构搜索通过提出、训练、评分并改进候选网络，自动化模型设计。'
    },
    'ai100-2015-deep-compression': {
        en: 'Deep Compression makes neural networks smaller by pruning weights, quantizing values, and coding what remains efficiently.',
        zh: '深度压缩通过剪枝权重、量化数值并高效编码剩余信息，让神经网络更小。'
    },
    'ai100-2015-knowledge-distillation': {
        en: 'Knowledge distillation trains a smaller student model to mimic a larger teacher, transferring behavior into a cheaper model.',
        zh: '知识蒸馏训练较小的学生模型模仿较大的教师模型，把行为迁移到更便宜的模型中。'
    },
    'ai100-2014-ms-coco': {
        en: 'MS COCO made vision models handle everyday objects in context, supporting detection, segmentation, and captioning benchmarks.',
        zh: 'MS COCO 让视觉模型处理真实语境中的日常物体，支撑检测、分割和图像描述基准。'
    },
    'ai100-1989-q-learning': {
        en: 'Q-learning estimates the long-term value of actions, letting an agent learn what to do without knowing the environment rules in advance.',
        zh: 'Q-learning 估计动作的长期价值，让智能体无需预先知道环境规则也能学习该怎么做。'
    },
    'ai100-2015-ddpg': {
        en: 'DDPG extends deep reinforcement learning to continuous actions by pairing an actor that chooses actions with a critic that scores them.',
        zh: 'DDPG 通过让 actor 选择动作、critic 评价动作，把深度强化学习扩展到连续动作空间。'
    },
    'ai100-1983-actor-critic': {
        en: 'Actor-Critic splits reinforcement learning into two jobs: an actor chooses actions, and a critic estimates how good those actions were.',
        zh: 'Actor-Critic 把强化学习分成两项工作：actor 选择动作，critic 估计这些动作有多好。'
    }
};
const {
    MILESTONE_ID_PREFIX,
    SUPPORTED_LOCALES,
    backupFile,
    deriveEmbedUrl,
    detectVideoSource,
    formatQuoteAttribution,
    getLocalizedText,
    isLocalizedText,
    loadQuoteCandidates,
    mergeEditableQuoteMeta,
    normalizeQuoteText
} = require('../shared/utils.js');

const catalogConfig = require('./catalog.js');
const categories = Array.isArray(catalogConfig.categories) ? catalogConfig.categories : [];
const branches = Array.isArray(catalogConfig.branches) ? catalogConfig.branches : [];
const eventsMap = require('./events.js');
const avatarRegistry = loadAvatarRegistry();
const researchCandidates = loadResearchCandidates();
const quoteCandidates = loadQuoteCandidates(QUOTE_CANDIDATES_PATH);
const quizCatalog = loadQuizCatalog();

// ─── 视频元数据缓存 ──────────────────────────────────────────────────────────

/** 读取 resources/videos/{key}.json，返回 candidate_videos 数组；文件不存在返回 null */
function loadVideoCatalog(key) {
    const file = path.join(VIDEOS_DIR, `${key}.json`);
    if (!fs.existsSync(file)) return null;
    try {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        return data.candidate_videos || [];
    } catch (e) {
        console.warn(`[警告] 无法解析视频文件 ${file}: ${e.message}`);
        return null;
    }
}

/** 从视频目录中按 ID 查找视频，返回精简的视频对象 */
function lookupVideo(catalog, id, key) {
    const entry = catalog.find((v) => v.id === id);
    if (!entry) {
        console.warn(`[警告] 事件 "${key}": 在视频目录中找不到 ID "${id}"，已跳过。`);
        return null;
    }
    // 只输出前端需要的字段
    return {
        id: entry.id,
        url: entry.url,
        embed_url: entry.embed_url,
        title: entry.title,
        channel: entry.channel,
        duration: entry.duration,
        thumbnail: entry.thumbnail,
        source: entry.source || 'YouTube'
    };
}

// ─── 构建里程碑数组 ──────────────────────────────────────────────────────────

const milestones = [];

function appendMilestonesFromGroup(group, groupKind) {
    const events = Array.isArray(group.events) ? group.events : [];

    for (const key of events) {
        const ev = eventsMap[key];
        if (!ev) {
            console.warn(`[警告] catalog.js ${groupKind} 中引用了 "${key}"，但 events.js 中不存在该事件，已跳过。`);
            continue;
        }

        const groupStoryline = group.storyline || (groupKind === 'branch' && group.id ? {
            id: group.id,
            name: group.name
        } : null);
        const storyline = ev.storyline || groupStoryline || null;
        const storylineId = typeof storyline === 'string' ? storyline : (storyline && storyline.id) || '';
        const curatedQuote = selectCuratedQuote(key, ev, storylineId);

        // 构建视频列表（支持字符串 ID 和 URL 对象两种格式）
        const videos = [];
        let catalog = null; // 懒加载，仅当存在字符串 ID 时才读取 JSON

        for (const item of ev.videos || []) {
            if (typeof item === 'string') {
                if (item.startsWith('http://') || item.startsWith('https://')) {
                    // 完整 URL（Bilibili 等）：先查 JSON 候选列表，找不到则直接构建
                    if (catalog === null) catalog = loadVideoCatalog(key);
                    const fromCatalog = catalog && catalog.find((v) => v.url === item);
                    if (fromCatalog) {
                        videos.push({
                            id: fromCatalog.id || fromCatalog.url,
                            url: fromCatalog.url,
                            embed_url: fromCatalog.embed_url || deriveEmbedUrl(fromCatalog.url),
                            title: fromCatalog.title || '',
                            channel: fromCatalog.channel || '',
                            duration: fromCatalog.duration || '',
                            thumbnail: fromCatalog.thumbnail || '',
                            source: fromCatalog.source || detectVideoSource(fromCatalog.url)
                        });
                    } else {
                        videos.push({
                            id: item,
                            url: item,
                            embed_url: deriveEmbedUrl(item),
                            title: '',
                            channel: '',
                            duration: '',
                            thumbnail: '',
                            source: detectVideoSource(item)
                        });
                    }
                } else {
                    // 短字符串：YouTube ID，从 resources/videos/{key}.json 查找元数据
                    if (catalog === null) {
                        catalog = loadVideoCatalog(key);
                        if (catalog === null) {
                            console.warn(
                                `[警告] 事件 "${key}" 包含视频 ID，但 resources/videos/${key}.json 不存在，字符串 ID 已跳过。`
                            );
                        }
                    }
                    if (catalog) {
                        const v = lookupVideo(catalog, item, key);
                        if (v) videos.push(v);
                    }
                }
            } else if (item && typeof item === 'object' && item.url) {
                // 对象：直接使用 URL，自动推导 embed_url 和 source
                videos.push({
                    id: item.id || item.url,
                    url: item.url,
                    embed_url: item.embed_url || deriveEmbedUrl(item.url),
                    title: item.title || '',
                    channel: item.channel || '',
                    duration: item.duration || '',
                    thumbnail: item.thumbnail || '',
                    source: item.source || detectVideoSource(item.url)
                });
            }
        }

        const commentarySections = ev.commentarySections || buildCommentarySectionsOverride(key);
        const quizzes = QUIZ_STORYLINE_IDS.has(storylineId) ? selectQuizzes(key, ev) : [];
        const milestone = {
            id: `${MILESTONE_ID_PREFIX}${key}`,
            year: ev.year,
            category: group.name,
            title: ev.title,
            subtitle: group.subtitle || group.name,
            location: ev.location,
            description: ev.description,
            figures: (ev.figures || []).map((figure) => enrichFigure(figure, key)),
            photos: [], // 预留字段，暂不使用
            videoUrl: videos[0] ? videos[0].embed_url || videos[0].url || '' : '',
            quote: buildQuote(curatedQuote.text, curatedQuote.kind),
            quoteKind: curatedQuote.kind,
            quoteLabel: curatedQuote.label,
            quoteAttribution: curatedQuote.attribution,
            quoteMeta: curatedQuote.meta,
            quotePage: ev.quotePage || '',
            commentarySections,
            resources: {
                images: ev.images || [],
                imageMeta: ev.imageMeta || {},
                videos
            }
        };

        if (ev.quoteLabel) milestone.quoteLabel = ev.quoteLabel;
        if (storyline) milestone.storyline = storyline;
        if (groupKind === 'branch' && group.id) {
            milestone.branch = {
                id: group.id,
                name: group.name
            };
        }
        if (ev.analysis) milestone.analysis = ev.analysis;
        if (ev.papers) milestone.papers = ev.papers;
        if (ev.achievement) milestone.achievement = ev.achievement;
        if (quizzes.length > 0) {
            milestone.quiz = quizzes[0];
            milestone.quizzes = quizzes;
        }

        milestones.push(milestone);
    }
}

categories.forEach((cat) => appendMilestonesFromGroup(cat, 'category'));
branches.forEach((branch) => appendMilestonesFromGroup(branch, 'branch'));

// ─── 辅助函数 ────────────────────────────────────────────────────────────────

/** 头像注册表允许缺失，这样生成脚本在资源未准备齐时也不会直接报错 */
function loadAvatarRegistry() {
    if (!fs.existsSync(AVATAR_REGISTRY_PATH)) {
        console.warn('[警告] manage/figure-avatars.js 不存在，已跳过头像注册表补全。');
        return {};
    }

    return require('./figure-avatars.js');
}

function loadResearchCandidates() {
    if (!fs.existsSync(RESEARCH_CANDIDATES_PATH)) {
        return { events: {} };
    }

    try {
        return require(RESEARCH_CANDIDATES_PATH).researchCandidates || { events: {} };
    } catch (error) {
        console.warn(`[警告] 无法加载候选研究素材 ${RESEARCH_CANDIDATES_PATH}: ${error.message}`);
        return { events: {} };
    }
}

function loadQuizCatalog() {
    if (!fs.existsSync(QUIZ_CATALOG_PATH)) {
        return { events: {} };
    }

    try {
        return require(QUIZ_CATALOG_PATH) || { events: {} };
    } catch (error) {
        console.warn(`[警告] 无法加载 Pop Quiz 配置 ${QUIZ_CATALOG_PATH}: ${error.message}`);
        return { events: {} };
    }
}

function normalizeQuizList(value) {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}

function normalizeQuiz(rawQuiz, key, index) {
    if (!rawQuiz || typeof rawQuiz !== 'object') return null;
    const options = Array.isArray(rawQuiz.options) ? rawQuiz.options.filter((option) => option != null) : [];
    const answerIndex = Number(rawQuiz.answerIndex);

    if (
        !rawQuiz.question ||
        options.length < 2 ||
        !Number.isInteger(answerIndex) ||
        answerIndex < 0 ||
        answerIndex >= options.length
    ) {
        console.warn(`[警告] 事件 "${key}" 的 Pop Quiz #${index + 1} 配置不完整，已跳过。`);
        return null;
    }

    return {
        id: rawQuiz.id || `${key}-quiz-${index + 1}`,
        question: rawQuiz.question,
        options,
        answerIndex,
        explanation: rawQuiz.explanation || '',
        source: rawQuiz.source || '',
        tags: Array.isArray(rawQuiz.tags) ? rawQuiz.tags : []
    };
}

function selectQuizzes(key, ev) {
    const eventQuizzes = ev && (ev.quizzes || ev.quiz);
    const catalogQuizzes = quizCatalog.events && quizCatalog.events[key];
    return normalizeQuizList(eventQuizzes || catalogQuizzes)
        .map((rawQuiz, index) => normalizeQuiz(rawQuiz, key, index))
        .filter(Boolean);
}

function figureNameCandidates(figure) {
  const value = figure && figure.name;
  const names = isLocalizedText(value)
    ? [...SUPPORTED_LOCALES.map((locale) => getLocalizedText(value, locale)), ...Object.values(value).map((item) => String(item || '').trim())]
    : [String(value || '').trim()];
  return [...new Set(names.filter(Boolean))];
}

function findAvatarRegistryEntry(figure) {
  for (const name of figureNameCandidates(figure)) {
    if (avatarRegistry[name]) return avatarRegistry[name];
  }
  return {};
}

/** 给人物条目补上显式头像信息 */
function enrichFigure(figure, key) {
    const safeFigure = figure && typeof figure === 'object' ? figure : {};
    const registryEntry = findAvatarRegistryEntry(safeFigure);
    const eventAvatar = key && registryEntry.avatarByEvent ? registryEntry.avatarByEvent[key] || '' : '';
    const eventAvatarStyle = key && registryEntry.avatarStyleByEvent ? registryEntry.avatarStyleByEvent[key] || '' : '';

    return {
        ...safeFigure,
        avatar: safeFigure.avatar || eventAvatar || registryEntry.avatar || '',
        avatarStyle: safeFigure.avatarStyle || eventAvatarStyle || registryEntry.avatarStyle || '',
        figureType: safeFigure.figureType || registryEntry.type || 'person'
    };
}

function getExplicitLocalizedText(value, locale) {
    if (!isLocalizedText(value) || !Object.prototype.hasOwnProperty.call(value, locale)) return '';
    return String(value[locale] || '').trim();
}

function buildCommentarySectionsOverride(key) {
    const entry = researchCandidates.events && researchCandidates.events[key];
    if (!entry) {
        return [];
    }

    const explicitSections = Array.isArray(entry.displayCommentarySections) ? entry.displayCommentarySections : [];

    const fallbackSections = [];
    const backgroundText =
        entry.candidateTexts && entry.candidateTexts.background ? entry.candidateTexts.background.text : '';
    const extensionText =
        entry.candidateTexts && entry.candidateTexts.extension ? entry.candidateTexts.extension.text : '';

    if (getLocalizedText(backgroundText, 'zh')) {
        fallbackSections.push({
            label: '背景解读',
            text: backgroundText
        });
    }

    if (getLocalizedText(extensionText, 'zh')) {
        fallbackSections.push({
            label: '延展说明',
            text: extensionText
        });
    }

    const sourceSections = explicitSections.length > 0 ? explicitSections : fallbackSections;

    return sourceSections
        .map((section, index) => {
            const zhText = getLocalizedText(section.text, 'zh');
            const explicitEnLabel = getExplicitLocalizedText(section.label, 'en');
            const explicitEnText = getExplicitLocalizedText(section.text, 'en');
            const enText = explicitEnText || zhText;
            return {
                label: {
                    en: explicitEnLabel || (index === 0 ? 'Background' : 'Context'),
                    zh: getLocalizedText(section.label, 'zh')
                },
                html: {
                    en: enText,
                    zh: zhText
                }
            };
        })
        .filter((section) => section.label.zh && section.html.zh);
}

function mapLocalizedText(value, transform) {
    if (!isLocalizedText(value)) return transform(String(value || ''));
    const result = {};
    for (const locale of SUPPORTED_LOCALES) {
        const text = getLocalizedText(value, locale);
        result[locale] = transform(text, locale);
    }
    return result;
}

function selectCuratedQuote(key, ev, storylineId) {
    const candidates = quoteCandidates.events && quoteCandidates.events[key];
    const first = Array.isArray(candidates) && candidates.length > 0 ? candidates[0] : null;
    const candidateQuote = first && typeof first === 'object' ? String(first.quote || '').trim() : '';
    const effectiveMeta = mergeEditableQuoteMeta(ev && ev.quoteMeta, first);
    const kind = normalizeQuoteKind((ev && ev.quoteKind) || (effectiveMeta && effectiveMeta.kind), key, storylineId);
    const keyIdeaOverride = kind === QUOTE_KIND_KEY_IDEA ? AI100_KEY_IDEA_OVERRIDES[key] : null;
    const eventQuote = ev && ev.quoteText;
    const quoteText = isLocalizedText(eventQuote)
        ? {
              en: getLocalizedText(keyIdeaOverride, 'en') || candidateQuote || getLocalizedText(eventQuote, 'en'),
              zh:
                  getLocalizedText(keyIdeaOverride, 'zh') ||
                  getLocalizedText(eventQuote, 'zh') ||
                  candidateQuote ||
                  getLocalizedText(eventQuote, 'en')
          }
        : keyIdeaOverride || candidateQuote || getLocalizedText(eventQuote);
    const formattedAttribution = formatQuoteAttribution(effectiveMeta);

  return {
    text: quoteText,
    kind,
    label: quoteLabelForKind(kind),
    attribution: formattedAttribution,
    meta: effectiveMeta,
  };
}

function normalizeQuoteKind(value, key, storylineId) {
    const kind = String(value || '').trim();
    if (storylineId === QUIZ_STORYLINE_ID) {
        if (kind === QUOTE_KIND_KEY_IDEA) return QUOTE_KIND_KEY_IDEA;
        return VERIFIED_AI100_QUOTE_KEYS.has(key) ? QUOTE_KIND_QUOTE : QUOTE_KIND_KEY_IDEA;
    }
    if (kind === QUOTE_KIND_QUOTE || kind === QUOTE_KIND_KEY_IDEA) return kind;
    return QUOTE_KIND_QUOTE;
}

function quoteLabelForKind(kind) {
    return kind === QUOTE_KIND_KEY_IDEA
        ? { en: 'Key idea', zh: '核心要点' }
        : { en: 'Quote', zh: '引言摘录' };
}

/** 将纯文本引言/要点组装成 HTML 字符串（\n → <br>）*/
function buildQuote(text, kind) {
    return mapLocalizedText(text, (value) => {
        const normalizedText = normalizeQuoteText(value);
        if (!normalizedText) return '';
        const body = normalizedText.replace(/\n/g, '<br>');
        return kind === QUOTE_KIND_KEY_IDEA ? body : `"${body}"`;
    });
}

// ─── 写出文件 ────────────────────────────────────────────────────────────────

function backupOutput(file) {
    backupFile(file, { backupDir: path.join(ROOT, 'manage', '.backups'), maxBackups: 5 });
}

function buildOutputContent(now) {
    return [
        `// AI 历史里程碑数据（由脚本自动生成，请勿手动编辑）`,
        `// 生成时间: ${now}`,
        `// 数据来源: manage/catalog.js  +  manage/events.js  +  manage/quizzes.js  +  resources/videos/`,
        ``,
        `const milestones = ${JSON.stringify(milestones, null, 2)};`,
        ``,
        `// 导出（兼容 Node.js require）`,
        `if (typeof module !== 'undefined' && module.exports) {`,
        `  module.exports = { milestones };`,
        `}`,
        ``
    ].join('\n');
}

function normalizeGeneratedTime(content) {
  return String(content || '')
    .replace(/\r\n/g, '\n')
    .replace(/^\/\/ 生成时间: .+$/m, '// 生成时间: <preserved>');
}

function writeIfMeaningfullyChanged(file, content) {
  if (fs.existsSync(file)) {
    const existing = fs.readFileSync(file, 'utf8');
    if (normalizeGeneratedTime(existing) === normalizeGeneratedTime(content)) {
      return false;
    }
  }

  backupOutput(file);
  fs.writeFileSync(file, content, 'utf8');
  return true;
}

function validateAvatarAssets(items) {
    const missing = [];
    const seen = new Set();

    for (const milestone of items) {
        for (const figure of milestone.figures || []) {
            const avatar = String(figure.avatar || '').trim();
            if (!avatar) continue;
            if (seen.has(avatar)) continue;
            seen.add(avatar);

            const absolutePath = path.isAbsolute(avatar) ? avatar : path.join(ROOT, avatar);

            if (!fs.existsSync(absolutePath)) {
                missing.push({
                    avatar,
                    milestoneId: milestone.id,
                    figureName: figure.name || '未知人物'
                });
            }
        }
    }

    return missing;
}

const missingAvatarAssets = validateAvatarAssets(milestones);
const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
const content = buildOutputContent(now);
const writeResults = new Map();

for (const file of OUTPUTS) {
    writeResults.set(file, writeIfMeaningfullyChanged(file, content));
}

for (const item of missingAvatarAssets) {
    console.warn(`[警告] 头像文件不存在：${item.avatar}（${item.milestoneId} / ${item.figureName}）`);
}

for (const file of OUTPUTS) {
    console.log(`✓ ${writeResults.get(file) ? '生成完成' : '内容未变化'}：${file}`);
}
console.log(`  共 ${categories.length} 个分类，${branches.length} 个分支，${milestones.length} 个事件`);
if (missingAvatarAssets.length > 0) {
    console.log(`  头像资源缺失：${missingAvatarAssets.length}`);
}
