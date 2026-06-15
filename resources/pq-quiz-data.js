// Pop Quiz / AI 通识课趣味测试题库
// 说明：
// - 当前文件仅存题库数据，不直接参与页面渲染
// - 每个里程碑至少提供 easy / challenge 两组题
// - 文案字段统一使用 { zh, en }，便于沿用现有 i18n 逻辑
// - correctOptionIndex 从 0 开始计数

(function (global) {
    function text(zh, en) {
        return { zh, en };
    }

    function option(zh, en) {
        return text(zh, en);
    }

    function question(id, difficulty, prompt, options, correctOptionIndex, explanation) {
        return {
            id,
            difficulty,
            question: prompt,
            options,
            correctOptionIndex,
            explanation
        };
    }

    function group(milestoneKey, difficulty, title, questions) {
        const groupId = `${milestoneKey}-${difficulty}`;
        return {
            id: groupId,
            milestoneKey,
            difficulty,
            title,
            questions: questions.map((item) => ({
                ...item,
                groupId,
                milestoneKey
            }))
        };
    }

    const groups = [
        group(
            "1956-dartmouth",
            "easy",
            text("基础题：AI 的命名时刻", "Basic: The naming of AI"),
            [
                question(
                    "pq-1956-dartmouth-easy-1",
                    "easy",
                    text("1956 年哪场会议通常被认为标志着人工智能作为研究领域的诞生？", "Which 1956 workshop is often considered the birth of AI as a research field?"),
                    [
                        option("图灵奖发布会", "Turing Award ceremony"),
                        option("达特茅斯会议", "Dartmouth Workshop"),
                        option("ImageNet 挑战赛", "ImageNet Challenge"),
                        option("AlphaGo 人机大战", "AlphaGo match")
                    ],
                    1,
                    text("达特茅斯会议把“人工智能”作为明确研究议题提出，成为 AI 历史的标志性起点。", "The Dartmouth Workshop framed artificial intelligence as a named research agenda and became a landmark starting point.")
                )
            ]
        ),
        group(
            "1956-dartmouth",
            "challenge",
            text("挑战题：为什么这场会议重要", "Challenge: Why the workshop mattered"),
            [
                question(
                    "pq-1956-dartmouth-challenge-1",
                    "challenge",
                    text("达特茅斯会议最深远的影响更接近下面哪一种？", "The Dartmouth Workshop's deepest impact is best described as which of the following?"),
                    [
                        option("马上制造出通用人工智能系统", "It immediately produced a general AI system"),
                        option("证明神经网络已经全面成熟", "It proved neural networks were fully mature"),
                        option("把分散问题组织成一个可持续研究领域", "It organized scattered problems into a sustained research field"),
                        option("首次训练出大型语言模型", "It trained the first large language model")
                    ],
                    2,
                    text("它的重要性不在于立刻解决 AI，而在于建立了共同的问题域、名称和研究想象。", "Its importance was not solving AI immediately, but creating a shared problem space, name, and research imagination.")
                )
            ]
        ),
        group(
            "1957-perceptron",
            "easy",
            text("基础题：早期神经网络", "Basic: Early neural networks"),
            [
                question(
                    "pq-1957-perceptron-easy-1",
                    "easy",
                    text("感知机是早期哪类 AI 路线的代表性模型？", "The perceptron is an early landmark of which AI approach?"),
                    [
                        option("专家系统", "Expert systems"),
                        option("连接主义 / 神经网络", "Connectionism / neural networks"),
                        option("搜索引擎排序", "Search engine ranking"),
                        option("区块链共识", "Blockchain consensus")
                    ],
                    1,
                    text("感知机用可训练权重模拟信息处理，是人工神经网络早期的重要成果。", "The perceptron used trainable weights to model information processing and became an early neural-network milestone.")
                )
            ]
        ),
        group(
            "1957-perceptron",
            "challenge",
            text("挑战题：媒体热潮背后", "Challenge: Behind the media excitement"),
            [
                question(
                    "pq-1957-perceptron-challenge-1",
                    "challenge",
                    text("感知机在 AI 史上引发关注的关键原因是什么？", "Why did the perceptron attract so much attention in AI history?"),
                    [
                        option("它让“机器可以学习”第一次具备可演示的工程形态", "It made the idea that machines could learn visible as an engineering demo"),
                        option("它已经能理解自然语言里的所有语义", "It could already understand all natural-language semantics"),
                        option("它证明单层模型没有任何局限", "It proved single-layer models had no limitations"),
                        option("它直接发明了互联网搜索", "It directly invented internet search")
                    ],
                    0,
                    text("感知机的象征意义在于把学习权重从理论想法推进到可展示、可传播的机器原型。", "Its symbolic power came from turning trainable weights into a visible, communicable machine prototype.")
                )
            ]
        ),
        group(
            "1969-ai-winter",
            "easy",
            text("基础题：AI 寒冬线索", "Basic: Clues to an AI winter"),
            [
                question(
                    "pq-1969-ai-winter-easy-1",
                    "easy",
                    text("1969 年《感知机》一书主要指出了哪类模型的局限？", "The 1969 book Perceptrons mainly highlighted limitations of which model type?"),
                    [
                        option("Transformer", "Transformers"),
                        option("大型语言模型", "Large language models"),
                        option("单层感知机", "Single-layer perceptrons"),
                        option("扩散模型", "Diffusion models")
                    ],
                    2,
                    text("书中对单层感知机表达能力的批评，是神经网络研究降温的重要因素之一。", "Its critique of single-layer perceptrons was one factor in the cooling of neural-network research.")
                )
            ]
        ),
        group(
            "1969-ai-winter",
            "challenge",
            text("挑战题：技术局限与历史转折", "Challenge: Limits and turning points"),
            [
                question(
                    "pq-1969-ai-winter-challenge-1",
                    "challenge",
                    text("为什么《感知机》的影响会被视为 AI 寒冬的一条线索？", "Why is Perceptrons often seen as one clue to an AI winter?"),
                    [
                        option("它让所有计算机停止运行", "It made all computers stop working"),
                        option("它揭示的局限削弱了资助者和研究者对神经网络路线的信心", "Its critique weakened confidence in the neural-network path among funders and researchers"),
                        option("它证明所有 AI 方法都不可能成功", "It proved all AI methods impossible"),
                        option("它发明了更快的 GPU", "It invented faster GPUs")
                    ],
                    1,
                    text("寒冬并非由一本书单独造成，但它放大了当时计算能力不足和模型局限带来的失望。", "The winter was not caused by one book alone, but the book amplified disappointment from limited compute and model expressiveness.")
                )
            ]
        ),
        group(
            "1986-backpropagation",
            "easy",
            text("基础题：误差如何回传", "Basic: How errors flow back"),
            [
                question(
                    "pq-1986-backpropagation-easy-1",
                    "easy",
                    text("反向传播在神经网络训练中主要用来做什么？", "What is backpropagation mainly used for in neural-network training?"),
                    [
                        option("根据误差调整网络权重", "Adjusting network weights based on error"),
                        option("压缩图片文件", "Compressing image files"),
                        option("生成随机密码", "Generating random passwords"),
                        option("决定显示器刷新率", "Choosing a monitor refresh rate")
                    ],
                    0,
                    text("反向传播把输出误差逐层传回网络，用于计算并更新参数。", "Backpropagation sends output error backward through the network to compute and update parameters.")
                )
            ]
        ),
        group(
            "1986-backpropagation",
            "challenge",
            text("挑战题：表示学习的意义", "Challenge: The meaning of representation learning"),
            [
                question(
                    "pq-1986-backpropagation-challenge-1",
                    "challenge",
                    text("反向传播对后来的深度学习复兴最关键的意义是什么？", "What was backpropagation's key significance for the later deep-learning revival?"),
                    [
                        option("让隐藏层表示可以通过数据学习，而不完全依赖人工设计", "It allowed hidden-layer representations to be learned from data rather than hand-designed"),
                        option("让模型完全不需要训练数据", "It removed the need for training data"),
                        option("把所有模型都变成符号逻辑系统", "It turned all models into symbolic logic systems"),
                        option("直接解决了所有长距离记忆问题", "It directly solved every long-term memory problem")
                    ],
                    0,
                    text("它让多层网络中的中间表示可以被系统训练，成为深度学习的重要方法基础。", "It made intermediate representations in multilayer networks trainable, creating a key methodological base for deep learning.")
                )
            ]
        ),
        group(
            "1986-rnn",
            "easy",
            text("基础题：序列与记忆", "Basic: Sequences and memory"),
            [
                question(
                    "pq-1986-rnn-easy-1",
                    "easy",
                    text("循环神经网络相比普通前馈网络，更适合处理哪类数据？", "Compared with ordinary feed-forward networks, RNNs are better suited for what kind of data?"),
                    [
                        option("有时间顺序的序列数据", "Sequential data with temporal order"),
                        option("只包含单个像素的数据", "Data with only one pixel"),
                        option("完全无顺序的随机编号", "Random IDs with no order"),
                        option("网页按钮颜色表", "A table of button colors")
                    ],
                    0,
                    text("RNN 的循环连接让它能够把之前的状态带入后续计算。", "RNN recurrence lets earlier states influence later computation.")
                )
            ]
        ),
        group(
            "1986-rnn",
            "challenge",
            text("挑战题：早期 RNN 的难处", "Challenge: Why early RNNs were hard"),
            [
                question(
                    "pq-1986-rnn-challenge-1",
                    "challenge",
                    text("早期 RNN 思路很重要，但长期受限的核心原因之一是什么？", "Early RNNs were conceptually important, but one core limitation was what?"),
                    [
                        option("缺少稳定训练长距离依赖的机制", "They lacked stable mechanisms for training long-range dependencies"),
                        option("它们只能处理纸质照片", "They could only process printed photos"),
                        option("它们不允许使用任何权重", "They did not allow any weights"),
                        option("它们只能在网页浏览器里运行", "They could only run in web browsers")
                    ],
                    0,
                    text("序列建模的想法很早出现，但长距离依赖和梯度问题使训练非常困难。", "The idea of sequence modeling appeared early, but long-range dependencies and gradient issues made training difficult.")
                )
            ]
        ),
        group(
            "1989-cnn",
            "easy",
            text("基础题：卷积看什么", "Basic: What convolution sees"),
            [
                question(
                    "pq-1989-cnn-easy-1",
                    "easy",
                    text("卷积神经网络最早在哪类任务中展现出强大优势？", "Convolutional neural networks first showed major strength in which kind of task?"),
                    [
                        option("图像和文档识别", "Image and document recognition"),
                        option("天气命名", "Naming weather systems"),
                        option("数据库备份", "Database backup"),
                        option("键盘布局设计", "Keyboard layout design")
                    ],
                    0,
                    text("CNN 擅长处理二维形状和局部模式，因此在视觉与文档识别中非常有效。", "CNNs are effective for two-dimensional shapes and local patterns, making them powerful for vision and document recognition.")
                )
            ]
        ),
        group(
            "1989-cnn",
            "challenge",
            text("挑战题：结构归纳偏置", "Challenge: Structural inductive bias"),
            [
                question(
                    "pq-1989-cnn-challenge-1",
                    "challenge",
                    text("CNN 对图像任务有效，一个重要原因是它利用了哪种结构特性？", "One reason CNNs work well for images is that they exploit which structural property?"),
                    [
                        option("局部模式在空间上可以复用", "Local patterns can be reused across space"),
                        option("所有像素都必须完全相同", "All pixels must be identical"),
                        option("文字一定比图像更容易", "Text is always easier than images"),
                        option("模型不需要任何参数", "The model needs no parameters")
                    ],
                    0,
                    text("卷积核共享权重，让模型能在不同位置识别相似局部结构。", "Shared convolutional kernels let the model detect similar local structures in different positions.")
                )
            ]
        ),
        group(
            "1997-lstm",
            "easy",
            text("基础题：长短期记忆", "Basic: Long short-term memory"),
            [
                question(
                    "pq-1997-lstm-easy-1",
                    "easy",
                    text("LSTM 引入门控机制，主要为了解决循环神经网络中的什么问题？", "LSTM introduced gates mainly to address which recurrent-network problem?"),
                    [
                        option("长距离依赖和梯度消失", "Long-range dependencies and vanishing gradients"),
                        option("屏幕亮度不足", "Low screen brightness"),
                        option("网页加载太慢", "Slow web-page loading"),
                        option("键盘输入延迟", "Keyboard input delay")
                    ],
                    0,
                    text("LSTM 的门控结构帮助模型保留更长时间跨度的信息。", "LSTM gates help the model preserve information over longer time spans.")
                )
            ]
        ),
        group(
            "1997-lstm",
            "challenge",
            text("挑战题：为什么门控重要", "Challenge: Why gates matter"),
            [
                question(
                    "pq-1997-lstm-challenge-1",
                    "challenge",
                    text("LSTM 中门控机制的作用更接近哪一种说法？", "Which description best captures the role of gates in LSTM?"),
                    [
                        option("控制信息何时保留、遗忘和输出", "They control when information is kept, forgotten, and output"),
                        option("把所有文本翻译成图片", "They translate all text into images"),
                        option("禁止模型使用历史信息", "They prevent the model from using history"),
                        option("只负责改变字体大小", "They only change font size")
                    ],
                    0,
                    text("门控让循环网络能更有选择地管理记忆，是 LSTM 的关键设计。", "Gates let recurrent networks manage memory more selectively, which is the key design of LSTM.")
                )
            ]
        ),
        group(
            "2012-alexnet",
            "easy",
            text("基础题：深度学习爆发", "Basic: The deep-learning breakout"),
            [
                question(
                    "pq-2012-alexnet-easy-1",
                    "easy",
                    text("AlexNet 的突破与哪些条件的成熟关系最密切？", "AlexNet's breakthrough was most closely tied to which combination?"),
                    [
                        option("大规模数据、GPU 训练和深度卷积网络", "Large-scale data, GPU training, and deep convolutional networks"),
                        option("手写规则和纸质卡片", "Handwritten rules and paper cards"),
                        option("机械计算器和打孔带", "Mechanical calculators and punched tape"),
                        option("电话交换机和收音机", "Telephone switches and radios")
                    ],
                    0,
                    text("AlexNet 把 ImageNet 数据、GPU 计算和深度网络工程技巧组合到了一起。", "AlexNet combined ImageNet-scale data, GPU computation, and practical deep-network techniques.")
                )
            ]
        ),
        group(
            "2012-alexnet",
            "challenge",
            text("挑战题：为什么是转折点", "Challenge: Why it was a turning point"),
            [
                question(
                    "pq-2012-alexnet-challenge-1",
                    "challenge",
                    text("AlexNet 之所以成为转折点，不只是因为模型更深，还因为它证明了什么？", "AlexNet became a turning point not only because it was deeper, but because it demonstrated what?"),
                    [
                        option("深度网络在大数据和 GPU 支持下可以显著赢下视觉基准", "Deep networks, with big data and GPUs, could decisively win visual benchmarks"),
                        option("人工标注数据完全没有价值", "Human-labeled data had no value"),
                        option("浅层模型永远不能使用", "Shallow models could never be used"),
                        option("图像识别与计算能力无关", "Image recognition was unrelated to computation")
                    ],
                    0,
                    text("它把算法、数据、硬件和工程技巧整合成了可验证的性能突破。", "It integrated algorithms, data, hardware, and engineering techniques into a verifiable performance breakthrough.")
                )
            ]
        ),
        group(
            "2014-highway-network",
            "easy",
            text("基础题：更深网络怎么过路", "Basic: Helping deep networks pass information"),
            [
                question(
                    "pq-2014-highway-network-easy-1",
                    "easy",
                    text("Highway Network 的名字暗示它为深层网络提供了什么？", "The name Highway Network suggests that it provides what for deep networks?"),
                    [
                        option("让信息更容易跨层传递的通路", "Paths that let information flow across layers more easily"),
                        option("自动驾驶专用地图", "Maps for autonomous driving"),
                        option("网页高速下载按钮", "A fast web-download button"),
                        option("只用于修路的机器人", "Robots only for road construction")
                    ],
                    0,
                    text("Highway Network 通过门控通路帮助深层模型训练，为后来的残差思想铺路。", "Highway Networks used gated paths to help train deep models and foreshadowed residual ideas.")
                )
            ]
        ),
        group(
            "2014-highway-network",
            "challenge",
            text("挑战题：从门控到残差", "Challenge: From gates to residuals"),
            [
                question(
                    "pq-2014-highway-network-challenge-1",
                    "challenge",
                    text("Highway Network 与后来的 ResNet 在思想上都试图缓解什么问题？", "Highway Networks and later ResNets both tried to ease which problem?"),
                    [
                        option("深层网络中信息和梯度难以有效传播", "Information and gradients becoming hard to propagate in very deep networks"),
                        option("浏览器不能显示图片", "Browsers being unable to show images"),
                        option("所有神经元必须手工命名", "Every neuron needing a manual name"),
                        option("模型只能处理英文", "Models only processing English")
                    ],
                    0,
                    text("它们都关注如何让更深的网络保持可训练性。", "Both focused on keeping deeper networks trainable.")
                )
            ]
        ),
        group(
            "2014-gan",
            "easy",
            text("基础题：两个网络的游戏", "Basic: A two-network game"),
            [
                question(
                    "pq-2014-gan-easy-1",
                    "easy",
                    text("GAN 的核心思想通常可以概括为哪两个网络相互博弈？", "GANs are commonly described as a game between which two networks?"),
                    [
                        option("生成器和判别器", "Generator and discriminator"),
                        option("浏览器和服务器", "Browser and server"),
                        option("键盘和鼠标", "Keyboard and mouse"),
                        option("数据库和缓存", "Database and cache")
                    ],
                    0,
                    text("生成器尝试制造逼真的样本，判别器尝试分辨真假，两者共同推动模型进步。", "The generator creates realistic samples while the discriminator tries to tell real from fake.")
                )
            ]
        ),
        group(
            "2014-gan",
            "challenge",
            text("挑战题：对抗学习的价值", "Challenge: Why adversarial learning matters"),
            [
                question(
                    "pq-2014-gan-challenge-1",
                    "challenge",
                    text("GAN 的训练目标为什么被称为“对抗式”？", "Why is GAN training called adversarial?"),
                    [
                        option("两个模块目标相反，在博弈中共同改进", "Two modules have opposing goals and improve through the game"),
                        option("模型必须攻击真实用户", "The model must attack real users"),
                        option("训练时不能使用数据", "Training cannot use data"),
                        option("所有输出都必须是文字", "All outputs must be text")
                    ],
                    0,
                    text("生成器与判别器的目标相互拉扯，这种博弈结构推动生成质量提升。", "The generator and discriminator pull against each other, and that game can improve generation quality.")
                )
            ]
        ),
        group(
            "2014-attention",
            "easy",
            text("基础题：注意力看重点", "Basic: Attention highlights what matters"),
            [
                question(
                    "pq-2014-attention-easy-1",
                    "easy",
                    text("在神经机器翻译中，注意力机制主要帮助模型做什么？", "In neural machine translation, what did attention mainly help models do?"),
                    [
                        option("在生成输出时关注输入中的相关部分", "Focus on relevant parts of the input while generating output"),
                        option("关闭所有隐藏层", "Turn off all hidden layers"),
                        option("只保留第一个单词", "Keep only the first word"),
                        option("把图片转换成音频", "Convert images into audio")
                    ],
                    0,
                    text("注意力让模型不必把整句信息都压进一个固定向量，而能动态查看相关位置。", "Attention let models dynamically inspect relevant positions instead of compressing a whole sentence into one fixed vector.")
                )
            ]
        ),
        group(
            "2014-attention",
            "challenge",
            text("挑战题：Transformer 的前奏", "Challenge: A prelude to Transformers"),
            [
                question(
                    "pq-2014-attention-challenge-1",
                    "challenge",
                    text("2014 年注意力机制对后续 Transformer 的意义是什么？", "What was the significance of 2014-era attention for later Transformers?"),
                    [
                        option("它证明模型可以显式学习序列位置之间的相关性", "It showed models could explicitly learn relationships between sequence positions"),
                        option("它让所有模型都不再需要参数", "It made all models parameter-free"),
                        option("它只适合控制屏幕亮度", "It was only useful for screen brightness"),
                        option("它取消了所有语言任务", "It removed all language tasks")
                    ],
                    0,
                    text("注意力把“看哪里”变成可学习操作，为后来的自注意力架构打下基础。", "Attention made the question of where to look learnable, laying groundwork for self-attention architectures.")
                )
            ]
        ),
        group(
            "2015-resnet",
            "easy",
            text("基础题：残差连接", "Basic: Residual connections"),
            [
                question(
                    "pq-2015-resnet-easy-1",
                    "easy",
                    text("ResNet 的核心结构通常被称为什么？", "What is the core structure in ResNet commonly called?"),
                    [
                        option("残差连接 / 跳跃连接", "Residual or skip connection"),
                        option("网页超链接", "Web hyperlink"),
                        option("像素橡皮擦", "Pixel eraser"),
                        option("音量均衡器", "Volume equalizer")
                    ],
                    0,
                    text("残差连接让信息可以绕过部分层，缓解深层网络训练退化问题。", "Residual connections let information bypass some layers, easing degradation in very deep networks.")
                )
            ]
        ),
        group(
            "2015-resnet",
            "challenge",
            text("挑战题：为什么能训练更深", "Challenge: Why deeper training worked"),
            [
                question(
                    "pq-2015-resnet-challenge-1",
                    "challenge",
                    text("ResNet 解决“网络越深不一定越好”的关键方式是什么？", "How did ResNet address the problem that deeper networks do not automatically perform better?"),
                    [
                        option("让网络学习相对输入的残差变化，而不是每层都重建完整映射", "It let networks learn residual changes relative to inputs instead of rebuilding full mappings at every layer"),
                        option("删除所有卷积层", "It removed all convolution layers"),
                        option("只训练最后一个像素", "It trained only the final pixel"),
                        option("把图像任务改成手工打分", "It turned image tasks into manual scoring")
                    ],
                    0,
                    text("残差学习降低了深层映射的优化难度，是深层视觉模型的重要突破。", "Residual learning made deep mappings easier to optimize and became a major breakthrough for visual models.")
                )
            ]
        ),
        group(
            "2016-densenet",
            "easy",
            text("基础题：密集连接", "Basic: Dense connections"),
            [
                question(
                    "pq-2016-densenet-easy-1",
                    "easy",
                    text("DenseNet 的“密集连接”主要指什么？", "What does DenseNet's dense connectivity mainly mean?"),
                    [
                        option("层与层之间更充分地复用特征", "Layers reuse features more extensively across the network"),
                        option("图片必须非常拥挤", "Images must be visually crowded"),
                        option("每个文件都要压缩", "Every file must be compressed"),
                        option("网络只能在城市里运行", "The network only runs in cities")
                    ],
                    0,
                    text("DenseNet 将前面层的特征传给后续层，促进特征复用和梯度传播。", "DenseNet passes features from earlier layers to later layers, encouraging reuse and gradient flow.")
                )
            ]
        ),
        group(
            "2016-densenet",
            "challenge",
            text("挑战题：特征复用", "Challenge: Feature reuse"),
            [
                question(
                    "pq-2016-densenet-challenge-1",
                    "challenge",
                    text("DenseNet 相比只做相邻层连接的网络，额外强调了什么？", "Compared with networks that connect only adjacent layers, what did DenseNet emphasize?"),
                    [
                        option("让后续层直接访问多个早期层的特征", "Letting later layers directly access features from many earlier layers"),
                        option("让所有层参数完全相同", "Making all layer parameters identical"),
                        option("只允许单层感知机", "Allowing only single-layer perceptrons"),
                        option("取消反向传播", "Removing backpropagation")
                    ],
                    0,
                    text("密集连接使特征不容易在深层中丢失，也让梯度更容易传回早期层。", "Dense connectivity helps features persist through depth and lets gradients reach earlier layers more easily.")
                )
            ]
        ),
        group(
            "2017-transformer",
            "easy",
            text("基础题：注意力就是你所需要的", "Basic: Attention is all you need"),
            [
                question(
                    "pq-2017-transformer-easy-1",
                    "easy",
                    text("Transformer 架构的代表性核心机制是什么？", "What is the signature mechanism of the Transformer architecture?"),
                    [
                        option("注意力机制", "Attention"),
                        option("冒泡排序", "Bubble sort"),
                        option("图像压缩", "Image compression"),
                        option("网页排版", "Web typography")
                    ],
                    0,
                    text("Transformer 用注意力机制建模序列中不同位置之间的关系。", "Transformers use attention to model relationships between positions in a sequence.")
                )
            ]
        ),
        group(
            "2017-transformer",
            "challenge",
            text("挑战题：为什么能并行", "Challenge: Why it scales"),
            [
                question(
                    "pq-2017-transformer-challenge-1",
                    "challenge",
                    text("Transformer 相比传统 RNN 的一个工程优势是什么？", "What is one engineering advantage of Transformers over traditional RNNs?"),
                    [
                        option("更容易并行处理序列中的多个位置", "They can process many sequence positions more easily in parallel"),
                        option("必须按字符手工输入权重", "They require hand-entering weights character by character"),
                        option("只能处理一个词", "They can process only one word"),
                        option("完全不需要计算资源", "They require no compute resources")
                    ],
                    0,
                    text("自注意力减少了严格逐步递归的依赖，使大规模并行训练更可行。", "Self-attention reduces strict step-by-step recurrence, making large-scale parallel training more feasible.")
                )
            ]
        ),
        group(
            "2018-bert",
            "easy",
            text("基础题：预训练与微调", "Basic: Pretraining and fine-tuning"),
            [
                question(
                    "pq-2018-bert-easy-1",
                    "easy",
                    text("BERT 推动 NLP 进入了哪种常见工作范式？", "BERT helped popularize which common NLP workflow?"),
                    [
                        option("先预训练通用语言模型，再针对任务微调", "Pretrain a general language model, then fine-tune it for tasks"),
                        option("完全不用数据，只写规则", "Use no data and write only rules"),
                        option("只处理黑白图片", "Process only black-and-white images"),
                        option("每个问题都重新制造硬件", "Build new hardware for every question")
                    ],
                    0,
                    text("BERT 展示了预训练模型可以迁移到问答、分类、抽取等多种语言任务。", "BERT showed that pretrained models could transfer to question answering, classification, extraction, and other language tasks.")
                )
            ]
        ),
        group(
            "2018-bert",
            "challenge",
            text("挑战题：双向语境", "Challenge: Bidirectional context"),
            [
                question(
                    "pq-2018-bert-challenge-1",
                    "challenge",
                    text("BERT 名称中的“Bidirectional”强调了什么？", "What does \"Bidirectional\" in BERT emphasize?"),
                    [
                        option("模型可以利用左右两侧上下文理解词语", "The model can use both left and right context to understand words"),
                        option("模型只能从左到右读文本", "The model can only read text left to right"),
                        option("模型专门处理双屏显示器", "The model is designed for dual-screen displays"),
                        option("模型只输出两个答案", "The model outputs only two answers")
                    ],
                    0,
                    text("BERT 的双向编码让词语表示同时吸收前后文信息。", "BERT's bidirectional encoding lets word representations absorb both preceding and following context.")
                )
            ]
        ),
        group(
            "2018-gpt",
            "easy",
            text("基础题：生成式预训练", "Basic: Generative pretraining"),
            [
                question(
                    "pq-2018-gpt-easy-1",
                    "easy",
                    text("GPT 里的 G 通常代表什么？", "What does the G in GPT usually stand for?"),
                    [
                        option("Generative", "Generative"),
                        option("Graphic", "Graphic"),
                        option("Geometry", "Geometry"),
                        option("Gateway", "Gateway")
                    ],
                    0,
                    text("GPT 指 Generative Pre-trained Transformer，即生成式预训练 Transformer。", "GPT stands for Generative Pre-trained Transformer.")
                )
            ]
        ),
        group(
            "2018-gpt",
            "challenge",
            text("挑战题：从预训练到泛化", "Challenge: From pretraining to generalization"),
            [
                question(
                    "pq-2018-gpt-challenge-1",
                    "challenge",
                    text("早期 GPT 路线的重要启发是什么？", "What was an important lesson from the early GPT line?"),
                    [
                        option("大规模语言预训练可以为多种下游任务提供通用基础", "Large-scale language pretraining can provide a general base for many downstream tasks"),
                        option("语言模型只能用于拼写检查", "Language models are only useful for spell checking"),
                        option("Transformer 不能生成文本", "Transformers cannot generate text"),
                        option("预训练会让模型无法迁移", "Pretraining prevents transfer")
                    ],
                    0,
                    text("GPT 强化了“先学通用语言模式，再适配任务”的路线。", "GPT strengthened the approach of learning general language patterns first, then adapting to tasks.")
                )
            ]
        ),
        group(
            "2019-ai-feynman",
            "easy",
            text("基础题：机器发现公式", "Basic: Machines rediscover formulas"),
            [
                question(
                    "pq-2019-ai-feynman-easy-1",
                    "easy",
                    text("AI Feynman 主要面向哪类问题？", "AI Feynman mainly targets which kind of problem?"),
                    [
                        option("从数据中发现符号数学关系", "Discovering symbolic mathematical relationships from data"),
                        option("给电影自动配色", "Automatically color-grading movies"),
                        option("管理浏览器标签页", "Managing browser tabs"),
                        option("生成键盘快捷键", "Generating keyboard shortcuts")
                    ],
                    0,
                    text("AI Feynman 结合神经网络和物理先验，用于符号回归和公式发现。", "AI Feynman combines neural networks and physical priors for symbolic regression and formula discovery.")
                )
            ]
        ),
        group(
            "2019-ai-feynman",
            "challenge",
            text("挑战题：物理先验的价值", "Challenge: The value of physics priors"),
            [
                question(
                    "pq-2019-ai-feynman-challenge-1",
                    "challenge",
                    text("AI Feynman 不只依赖暴力搜索，还利用物理先验，主要好处是什么？", "AI Feynman uses physics priors instead of relying only on brute-force search. What is the main benefit?"),
                    [
                        option("缩小候选空间，提高发现可解释公式的机会", "It narrows the search space and improves the chance of finding interpretable formulas"),
                        option("让公式不再需要验证", "It removes the need to verify formulas"),
                        option("把物理问题变成图片滤镜", "It turns physics problems into image filters"),
                        option("保证每个问题一秒内解决", "It guarantees every problem is solved within one second")
                    ],
                    0,
                    text("对称性、量纲分析等先验能减少无意义搜索，使符号发现更接近真实科学问题。", "Priors such as symmetry and dimensional analysis reduce unhelpful search and make symbolic discovery more realistic.")
                )
            ]
        ),
        group(
            "2020-alphafold",
            "easy",
            text("基础题：蛋白质结构", "Basic: Protein structures"),
            [
                question(
                    "pq-2020-alphafold-easy-1",
                    "easy",
                    text("AlphaFold 最著名的突破是预测什么？", "AlphaFold is best known for predicting what?"),
                    [
                        option("蛋白质三维结构", "Three-dimensional protein structures"),
                        option("城市交通灯颜色", "Traffic-light colors"),
                        option("电影票座位号", "Movie-seat numbers"),
                        option("显示器边框尺寸", "Monitor bezel sizes")
                    ],
                    0,
                    text("AlphaFold 在蛋白质结构预测上取得突破，对生命科学研究产生了重要影响。", "AlphaFold made a breakthrough in protein-structure prediction with major impact on life-science research.")
                )
            ]
        ),
        group(
            "2020-alphafold",
            "challenge",
            text("挑战题：为什么影响科学", "Challenge: Why it affected science"),
            [
                question(
                    "pq-2020-alphafold-challenge-1",
                    "challenge",
                    text("AlphaFold 的意义不只是预测准确率高，还在于什么？", "AlphaFold's significance was not only high prediction accuracy, but also what?"),
                    [
                        option("把长期困难的结构预测问题变成可大规模使用的科学工具", "It turned a long-standing structure-prediction problem into a broadly usable scientific tool"),
                        option("让所有实验室不再需要实验", "It made all laboratory experiments unnecessary"),
                        option("证明生物学已经完成", "It proved biology was complete"),
                        option("只适合制作展览海报", "It was only useful for exhibition posters")
                    ],
                    0,
                    text("它把 AI 从基准表现推进到真实科研工作流中，改变了结构生物学工具箱。", "It moved AI from benchmark performance into real scientific workflows and changed the structural-biology toolkit.")
                )
            ]
        ),
        group(
            "2023-agents",
            "easy",
            text("基础题：智能体会做什么", "Basic: What agents do"),
            [
                question(
                    "pq-2023-agents-easy-1",
                    "easy",
                    text("AI Agents 相比单纯聊天机器人，更强调什么能力？", "Compared with a pure chatbot, what do AI agents emphasize more?"),
                    [
                        option("根据目标规划、调用工具并执行行动", "Planning toward goals, using tools, and taking actions"),
                        option("只能背诵固定答案", "Only reciting fixed answers"),
                        option("只改变网页背景色", "Only changing page background colors"),
                        option("不能接收任何反馈", "Receiving no feedback")
                    ],
                    0,
                    text("Agent 的核心是围绕目标进行推理、行动和反馈循环。", "The core of agents is reasoning, acting, and using feedback around goals.")
                )
            ]
        ),
        group(
            "2023-agents",
            "challenge",
            text("挑战题：ReAct 的启发", "Challenge: The ReAct idea"),
            [
                question(
                    "pq-2023-agents-challenge-1",
                    "challenge",
                    text("ReAct 这类方法的关键思想是什么？", "What is the key idea behind methods such as ReAct?"),
                    [
                        option("把推理和行动交替结合，让模型边想边用工具验证", "Interleave reasoning and action so the model can think while using tools to verify"),
                        option("完全禁止模型调用工具", "Forbid the model from using tools"),
                        option("只输出一个随机词", "Output only one random word"),
                        option("让模型忽略环境反馈", "Make the model ignore environmental feedback")
                    ],
                    0,
                    text("ReAct 强调推理轨迹与外部行动协同，推动了智能体工作流。", "ReAct emphasizes coordination between reasoning traces and external actions, helping drive agent workflows.")
                )
            ]
        ),
        group(
            "2024-ai-scientist",
            "easy",
            text("基础题：AI 科学家", "Basic: AI scientist"),
            [
                question(
                    "pq-2024-ai-scientist-easy-1",
                    "easy",
                    text("“AI Scientist”这类系统通常希望自动化科研流程中的哪些环节？", "Systems like an \"AI Scientist\" aim to automate which parts of research workflows?"),
                    [
                        option("提出想法、设计实验、运行评估和撰写结果", "Proposing ideas, designing experiments, running evaluations, and writing results"),
                        option("只负责更换电脑壁纸", "Only changing computer wallpapers"),
                        option("只统计观众人数", "Only counting audience members"),
                        option("只播放背景音乐", "Only playing background music")
                    ],
                    0,
                    text("AI Scientist 的重点是把模型接入更完整的研究循环。", "The focus of AI Scientist systems is connecting models to more complete research loops.")
                )
            ]
        ),
        group(
            "2024-ai-scientist",
            "challenge",
            text("挑战题：科研自动化的评价", "Challenge: Evaluating automated research"),
            [
                question(
                    "pq-2024-ai-scientist-challenge-1",
                    "challenge",
                    text("评价 AI 科学家系统时，最关键的问题之一是什么？", "When evaluating AI scientist systems, what is one of the most important questions?"),
                    [
                        option("产出的实验和结论是否可验证、可复现", "Whether its experiments and conclusions are verifiable and reproducible"),
                        option("界面是否足够花哨", "Whether the interface is flashy enough"),
                        option("回答是否总是更长", "Whether answers are always longer"),
                        option("是否能取代所有科学家签名", "Whether it can replace every scientist's signature")
                    ],
                    0,
                    text("科研场景中，可靠性、复现性和可验证反馈比单次生成结果更重要。", "In scientific settings, reliability, reproducibility, and verifiable feedback matter more than a single generated result.")
                )
            ]
        ),
        group(
            "2025-llm-competition",
            "easy",
            text("基础题：大模型竞技场", "Basic: LLM competition"),
            [
                question(
                    "pq-2025-llm-competition-easy-1",
                    "easy",
                    text("大模型开放评测平台通常用来比较什么？", "Open LLM evaluation platforms are usually used to compare what?"),
                    [
                        option("不同模型在任务和人类偏好中的表现", "How different models perform on tasks and human preferences"),
                        option("不同显示器的重量", "The weight of different monitors"),
                        option("不同键盘的颜色", "The colors of different keyboards"),
                        option("不同城市的天气名称", "The names of weather systems in different cities")
                    ],
                    0,
                    text("开放评测让模型能力、偏好和局限更容易被社区比较。", "Open evaluation makes model capabilities, preferences, and limitations easier for the community to compare.")
                )
            ]
        ),
        group(
            "2025-llm-competition",
            "challenge",
            text("挑战题：为什么评测很难", "Challenge: Why evaluation is hard"),
            [
                question(
                    "pq-2025-llm-competition-challenge-1",
                    "challenge",
                    text("大模型评测越来越难的一个原因是什么？", "Why is evaluating large language models becoming increasingly difficult?"),
                    [
                        option("模型能力覆盖面广，单一分数很难完整反映真实使用效果", "Models cover many abilities, and a single score cannot fully reflect real-world usefulness"),
                        option("所有模型输出都完全相同", "All models produce identical outputs"),
                        option("人类偏好永远没有差异", "Human preferences never differ"),
                        option("模型只能回答数学题", "Models can only answer math questions")
                    ],
                    0,
                    text("现代评测需要同时考虑任务能力、安全性、偏好、稳定性和真实场景表现。", "Modern evaluation must consider task ability, safety, preference, robustness, and real-world behavior together.")
                )
            ]
        )
    ];

    const questions = groups.flatMap((item) => item.questions);

    const pqQuizData = {
        meta: {
            id: "ai-history-pop-quiz",
            title: text("AI 历史趣味测试", "AI History Pop Quiz"),
            subtitle: text(
                "扫码完成 AI 通识课挑战，凭结果页领取小纪念品",
                "Scan to complete the AI literacy challenge and redeem a souvenir with your result page"
            ),
            version: "2026-06-08",
            supportedLocales: ["zh", "en"],
            groupCount: groups.length,
            questionCount: questions.length,
            difficulties: ["easy", "challenge"],
            qrImage: "resources/pq.png",
            qrUrl: ""
        },
        groups,
        questions
    };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = { pqQuizData };
    }

    if (global) {
        global.pqQuizData = pqQuizData;
    }
})(typeof window !== "undefined" ? window : globalThis);
