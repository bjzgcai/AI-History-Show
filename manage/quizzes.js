// Pop Quiz configuration for generated BenchCouncil AI100 milestones.
// Shape is intentionally close to the possible pq.lab.bza.edu.cn export:
// question, options, answerIndex, explanation, source.

'use strict';

const defaultSource = {
    label: {
        en: 'BenchCouncil AI100 achievement notes',
        zh: 'BenchCouncil AI100 成就内容'
    }
};

function quiz(question, options, answerIndex, explanation, tags = []) {
    return [
        {
            question,
            options,
            answerIndex,
            explanation,
            source: defaultSource,
            tags
        }
    ];
}

module.exports = {
    version: 1,
    providerHint: {
        en: 'Reserved for future batches imported from pq.lab.bza.edu.cn.',
        zh: '结构预留给后续从 pq.lab.bza.edu.cn 批量导入。'
    },
    events: {
        '1950-turing-test': quiz(
            {
                en: "Turing's test avoids opening the machine. What does it judge instead?",
                zh: '图灵测试不打开机器看内部，它改为判断什么？'
            },
            [
                { en: 'Conversational behavior under a blind protocol', zh: '盲测协议下的对话行为' },
                { en: 'The color of the computer case', zh: '电脑外壳颜色' },
                { en: 'How loudly the machine runs', zh: '机器运行声音大小' },
                { en: 'Whether it owns a chessboard', zh: '它是否拥有棋盘' }
            ],
            0,
            {
                en: 'The imitation game focuses on observable interaction rather than inspecting internal mechanisms.',
                zh: '模仿游戏关注可观察互动，而不是检查内部机制。'
            },
            ['evaluation', 'behavior']
        ),
        '1958-lisp': quiz(
            {
                en: 'LISP made early AI feel programmable because code and data could both be written as...',
                zh: 'LISP 让早期 AI 更可编程，因为代码和数据都可以写成什么？'
            },
            [
                { en: 'S-expressions', zh: 'S 表达式' },
                { en: 'Photographs', zh: '照片' },
                { en: 'Go stones', zh: '围棋棋子' },
                { en: 'Audio tapes only', zh: '只有录音磁带' }
            ],
            0,
            {
                en: 'S-expressions made symbolic programs and symbolic data share a compact representation.',
                zh: 'S 表达式让符号程序和符号数据共享一种紧凑表示。'
            },
            ['language', 'symbolic']
        ),
        '2016-alphago': quiz(
            {
                en: 'AlphaGo did not just search harder. What did it learn to guide search?',
                zh: 'AlphaGo 不只是“搜得更多”。它学会了什么来引导搜索？'
            },
            [
                { en: 'Policy priors and value estimates', zh: '策略先验和价值估计' },
                { en: "The referee's handwriting", zh: '裁判的笔迹' },
                { en: 'Only the board color', zh: '只有棋盘颜色' },
                { en: 'A fixed first move for every game', zh: '每盘棋固定第一手' }
            ],
            0,
            {
                en: 'Policy networks narrow candidate moves, value networks estimate positions, and tree search plans ahead.',
                zh: '策略网络缩小候选落子，价值网络评估局面，树搜索向前规划。'
            },
            ['games', 'search']
        ),
        '1971-complexity-theory': quiz(
            {
                en: 'What does NP-completeness help researchers compare?',
                zh: 'NP 完全性帮助研究者比较什么？'
            },
            [
                { en: 'The computational hardness of different problems', zh: '不同问题的计算困难性' },
                { en: 'The brightness of computer screens', zh: '电脑屏幕的亮度' },
                { en: 'The handwriting style of programmers', zh: '程序员的笔迹风格' },
                { en: 'The physical weight of machines', zh: '机器的物理重量' }
            ],
            0,
            {
                en: 'Polynomial-time reductions let researchers connect different problems and reason about shared hardness.',
                zh: '多项式时间归约让研究者把不同问题联系起来，并推理它们共享的困难性。'
            },
            ['complexity', 'reductions']
        ),
        '1971-vc-theory': quiz(
            {
                en: 'What does VC theory mainly help explain in machine learning?',
                zh: 'VC 理论主要帮助解释机器学习中的什么问题？'
            },
            [
                { en: 'Why training performance may or may not generalize to unseen data', zh: '为什么训练表现可能泛化或不能泛化到未见数据' },
                { en: 'How to make a monitor larger', zh: '如何把显示器做得更大' },
                { en: 'Why all datasets have the same labels', zh: '为什么所有数据集都有相同标签' },
                { en: 'How to remove probability from learning', zh: '如何从学习中去掉概率' }
            ],
            0,
            {
                en: 'VC dimension and uniform convergence connect sample size, model capacity, training error and expected test behavior.',
                zh: 'VC 维和一致收敛把样本量、模型容量、训练误差与预期测试表现联系起来。'
            },
            ['generalization', 'capacity']
        ),
        '1956-logic-theorist': quiz(
            {
                en: 'What made Logic Theorist more than a brute-force theorem prover?',
                zh: '是什么让 Logic Theorist 不只是暴力穷举式定理证明器？'
            },
            [
                { en: 'It used heuristics to guide symbolic proof search', zh: '它用启发式规则引导符号证明搜索' },
                { en: 'It only changed screen colors', zh: '它只会改变屏幕颜色' },
                { en: 'It avoided symbolic logic entirely', zh: '它完全避开符号逻辑' },
                { en: 'It solved proofs by playing Go', zh: '它通过下围棋来证明定理' }
            ],
            0,
            {
                en: 'Logic Theorist searched through symbolic transformations but used heuristics to choose promising proof paths.',
                zh: 'Logic Theorist 在符号变换空间中搜索，并用启发式规则选择更有希望的证明路径。'
            },
            ['reasoning', 'theorem-proving']
        ),
        '1958-wangs-algorithm': quiz(
            {
                en: "What did Wang's theorem-proving procedure use to avoid blind truth-table enumeration?",
                zh: '王氏定理证明过程用什么避免盲目真值表枚举？'
            },
            [
                { en: 'Pattern-guided logical transformations', zh: '由模式引导的逻辑变换' },
                { en: 'Random screen colors', zh: '随机屏幕颜色' },
                { en: 'Only handwritten notes', zh: '只靠手写笔记' },
                { en: 'A fixed chess opening', zh: '固定国际象棋开局' }
            ],
            0,
            {
                en: 'Wang framed proof search as recognizing and reducing logical patterns, not simply enumerating all truth assignments.',
                zh: '王浩把证明搜索表述为识别并归约逻辑模式，而不是简单枚举所有真值赋值。'
            },
            ['theorem-proving', 'pattern-recognition']
        ),
        '1960-davis-putnam-dpll': quiz(
            {
                en: 'What SAT-solving structure did DPLL make central?',
                zh: 'DPLL 让 SAT 求解的哪种结构成为核心？'
            },
            [
                { en: 'Branching, propagation, and backtracking', zh: '分支、传播与回溯' },
                { en: 'Painting a circuit board', zh: '给电路板上色' },
                { en: 'Sorting portraits by brightness', zh: '按亮度排序肖像' },
                { en: 'Replacing logic with audio signals', zh: '用音频信号替代逻辑' }
            ],
            0,
            {
                en: 'DPLL recursively branches on assignments, propagates forced literals, and backtracks when a contradiction appears.',
                zh: 'DPLL 递归选择赋值分支，传播被迫文字，并在出现矛盾时回溯。'
            },
            ['sat', 'search', 'theorem-proving']
        ),
        '2014-adam': quiz(
            {
                "en": "What made Adam especially convenient for deep-network training?",
                "zh": "Adam 为什么特别适合深度网络训练？"
            },
            [
                {
                    "en": "It adapts parameter updates from first and second gradient moments",
                    "zh": "它根据梯度的一阶和二阶矩自适应调整参数更新"
                },
                {
                    "en": "It removes gradients from learning entirely",
                    "zh": "它完全移除了梯度"
                },
                {
                    "en": "It requires a hand-written rule for every weight",
                    "zh": "它要求为每个权重手写规则"
                },
                {
                    "en": "It only works on decision trees",
                    "zh": "它只适用于决策树"
                }
            ],
            0,
            {
                "en": "Adam combines momentum-like gradient averages with squared-gradient scaling, reducing the amount of manual learning-rate tuning needed in many settings.",
                "zh": "Adam 将类似动量的梯度平均与梯度平方缩放结合起来，在许多场景中减少手工学习率调参。"
            },
            [
                "optimization",
                "deep-learning"
            ]
        ),
        '2014-vgg': quiz(
            {
                "en": "What architectural habit is VGG best remembered for?",
                "zh": "VGG 最著名的架构习惯是什么？"
            },
            [
                {
                    "en": "Stacking many small 3x3 convolutional layers",
                    "zh": "堆叠大量小型 3x3 卷积层"
                },
                {
                    "en": "Using no convolution at all",
                    "zh": "完全不使用卷积"
                },
                {
                    "en": "Replacing images with text tokens only",
                    "zh": "只把图像换成文本 token"
                },
                {
                    "en": "Training a single decision stump",
                    "zh": "训练单个决策树桩"
                }
            ],
            0,
            {
                "en": "VGG made a very regular stack of small convolutions a strong and reusable computer-vision architecture.",
                "zh": "VGG 把小卷积核的规则堆叠做成了强大且可复用的视觉架构。"
            },
            [
                "vision",
                "cnn"
            ]
        ),
        '1975-genetic-algorithm': quiz(
            {
                "en": "What does a genetic algorithm evolve over time?",
                "zh": "遗传算法随时间演化的是什么？"
            },
            [
                {
                    "en": "A population of candidate solutions",
                    "zh": "一组候选解种群"
                },
                {
                    "en": "Only a single fixed answer",
                    "zh": "只有一个固定答案"
                },
                {
                    "en": "A handwritten theorem proof only",
                    "zh": "仅一个手写定理证明"
                },
                {
                    "en": "The monitor resolution",
                    "zh": "显示器分辨率"
                }
            ],
            0,
            {
                "en": "Genetic algorithms maintain many candidates, select fitter ones, recombine them, and mutate them to continue search.",
                "zh": "遗传算法维护多个候选解，选择表现更好的个体，进行重组和变异来继续搜索。"
            },
            [
                "search",
                "optimization"
            ]
        ),
        '2015-u-net': quiz(
            {
                "en": "Why are skip connections central to U-Net?",
                "zh": "为什么跳跃连接是 U-Net 的核心？"
            },
            [
                {
                    "en": "They carry fine localization detail from encoder to decoder",
                    "zh": "它们把精细定位信息从编码器传给解码器"
                },
                {
                    "en": "They delete the decoder entirely",
                    "zh": "它们完全删除了解码器"
                },
                {
                    "en": "They make every pixel the same class",
                    "zh": "它们让每个像素都是同一类"
                },
                {
                    "en": "They replace images with audio",
                    "zh": "它们用音频替代图像"
                }
            ],
            0,
            {
                "en": "U-Net’s skip connections combine high-level context with early-layer spatial detail, which is crucial for segmentation boundaries.",
                "zh": "U-Net 的跳跃连接把高级上下文与早期空间细节结合起来，这对分割边界很关键。"
            },
            [
                "vision",
                "segmentation"
            ]
        ),
        '2015-faster-r-cnn': quiz(
            {
                "en": "What bottleneck did Faster R-CNN address?",
                "zh": "Faster R-CNN 主要解决了什么瓶颈？"
            },
            [
                {
                    "en": "External region proposal generation",
                    "zh": "外部候选区域生成"
                },
                {
                    "en": "The need for all images to be grayscale",
                    "zh": "所有图像都必须是灰度图"
                },
                {
                    "en": "The absence of any neural network",
                    "zh": "完全没有神经网络"
                },
                {
                    "en": "Sorting labels alphabetically",
                    "zh": "按字母顺序排序标签"
                }
            ],
            0,
            {
                "en": "The Region Proposal Network learns proposals from shared convolutional features, removing a major external bottleneck.",
                "zh": "区域建议网络从共享卷积特征中学习候选框，移除了一个主要外部瓶颈。"
            },
            [
                "vision",
                "detection"
            ]
        ),
        '1992-svm': quiz(
            {
                "en": "What boundary does an SVM prefer?",
                "zh": "SVM 偏好什么样的分类边界？"
            },
            [
                {
                    "en": "A boundary with the largest margin to nearby examples",
                    "zh": "与附近样本间隔最大的边界"
                },
                {
                    "en": "A boundary chosen by image brightness",
                    "zh": "按图像亮度选择的边界"
                },
                {
                    "en": "A boundary that ignores all labels",
                    "zh": "忽略所有标签的边界"
                },
                {
                    "en": "A random line with no objective",
                    "zh": "没有目标函数的随机直线"
                }
            ],
            0,
            {
                "en": "The maximum-margin principle is the core of SVM classification and links the method to statistical learning theory.",
                "zh": "最大间隔原则是 SVM 分类的核心，也把它与统计学习理论连接起来。"
            },
            [
                "machine-learning",
                "classification"
            ]
        ),
        '1984-cart': quiz(
            {
                "en": "What does CART use pruning for?",
                "zh": "CART 为什么使用剪枝？"
            },
            [
                {
                    "en": "To reduce overfitting after growing a tree",
                    "zh": "在生成树后减少过拟合"
                },
                {
                    "en": "To make every split random forever",
                    "zh": "让所有划分永远随机"
                },
                {
                    "en": "To remove all features from data",
                    "zh": "从数据中移除所有特征"
                },
                {
                    "en": "To turn trees into images only",
                    "zh": "把树只变成图像"
                }
            ],
            0,
            {
                "en": "CART can grow a large tree and then prune it back to balance accuracy and simplicity.",
                "zh": "CART 可以先生成较大的树，再通过剪枝平衡准确性和简洁性。"
            },
            [
                "decision-trees",
                "machine-learning"
            ]
        ),
        '1983-simulated-annealing': quiz(
            {
                "en": "Why can simulated annealing accept a worse move?",
                "zh": "模拟退火为什么会接受较差移动？"
            },
            [
                {
                    "en": "To escape local optima while temperature is still high",
                    "zh": "在温度较高时逃离局部最优"
                },
                {
                    "en": "Because it never evaluates solutions",
                    "zh": "因为它从不评估解"
                },
                {
                    "en": "To force every answer to be wrong",
                    "zh": "为了强制所有答案错误"
                },
                {
                    "en": "Because it only sorts text",
                    "zh": "因为它只排序文本"
                }
            ],
            0,
            {
                "en": "Early exploration allows uphill moves with some probability; cooling gradually makes the search more selective.",
                "zh": "早期探索允许以一定概率进行上坡移动；降温会逐渐让搜索更挑剔。"
            },
            [
                "optimization",
                "search"
            ]
        ),
        '1996-lasso': quiz(
            {
                "en": "What does the L1 penalty in lasso often do to coefficients?",
                "zh": "Lasso 中的 L1 惩罚通常会让系数发生什么？"
            },
            [
                {
                    "en": "It drives some coefficients exactly to zero",
                    "zh": "它会把部分系数精确压到零"
                },
                {
                    "en": "It makes every coefficient infinite",
                    "zh": "它让所有系数变成无穷大"
                },
                {
                    "en": "It removes the training data",
                    "zh": "它移除训练数据"
                },
                {
                    "en": "It converts regression into video playback",
                    "zh": "它把回归变成视频播放"
                }
            ],
            0,
            {
                "en": "The L1 penalty encourages sparsity, so lasso performs variable selection while fitting a model.",
                "zh": "L1 惩罚鼓励稀疏性，因此 Lasso 在拟合模型时同时进行变量选择。"
            },
            [
                "statistics",
                "regularization"
            ]
        ),
        '2015-googlenet-inception': quiz(
            {
                "en": "What is the key idea of an Inception module?",
                "zh": "Inception 模块的关键思想是什么？"
            },
            [
                {
                    "en": "Run multiple filter paths in parallel and combine them",
                    "zh": "并行运行多个滤波路径并合并输出"
                },
                {
                    "en": "Use only a single pixel as input",
                    "zh": "只使用一个像素作为输入"
                },
                {
                    "en": "Ban convolution from the model",
                    "zh": "禁止模型使用卷积"
                },
                {
                    "en": "Make every layer a decision tree",
                    "zh": "把每一层都变成决策树"
                }
            ],
            0,
            {
                "en": "Inception modules combine parallel convolution and pooling paths, often with 1x1 bottlenecks for efficiency.",
                "zh": "Inception 模块结合并行卷积和池化路径，并常用 1x1 瓶颈层提高效率。"
            },
            [
                "vision",
                "cnn"
            ]
        ),
        '1965-resolution-method': quiz(
            {
          "en": "What does the resolution method try to derive after negating the target claim?",
          "zh": "归结方法在否定目标结论后试图推出什么？"
},
            [
          {
                    "en": "The empty clause, showing contradiction",
                    "zh": "空子句，表示矛盾"
          },
          {
                    "en": "A larger image dataset",
                    "zh": "更大的图像数据集"
          },
          {
                    "en": "A random dropout mask",
                    "zh": "随机 dropout 掩码"
          },
          {
                    "en": "A chess opening book",
                    "zh": "国际象棋开局库"
          }
],
            0,
            {
          "en": "Resolution is usually used as refutation: if the premises plus the negated goal imply the empty clause, the original goal follows.",
          "zh": "归结通常作为反驳证明使用：如果前提加否定目标能推出空子句，原目标就成立。"
},
            [
          "logic",
          "reasoning"
]
        ),
        '1973-prolog': quiz(
            {
          "en": "What does a Prolog query mainly trigger?",
          "zh": "Prolog 查询主要会触发什么？"
},
            [
          {
                    "en": "A search for facts and rules that prove the query",
                    "zh": "对能证明查询的事实和规则进行搜索"
          },
          {
                    "en": "A fixed image convolution",
                    "zh": "固定图像卷积"
          },
          {
                    "en": "A random tree ensemble",
                    "zh": "随机树集成"
          },
          {
                    "en": "A GPU-only matrix benchmark",
                    "zh": "只面向 GPU 的矩阵基准"
          }
],
            0,
            {
          "en": "Prolog evaluates queries by unifying terms with facts and rules, then backtracking through alternatives when needed.",
          "zh": "Prolog 通过将项与事实和规则合一来求值查询，并在需要时回溯尝试其他路径。"
},
            [
          "language",
          "logic"
]
        ),
        '1966-eliza': quiz(
            {
          "en": "Why did ELIZA feel conversational despite having no deep understanding?",
          "zh": "ELIZA 没有深层理解，为什么仍显得像在对话？"
},
            [
          {
                    "en": "It used scripts to reflect user phrases back as questions",
                    "zh": "它用脚本把用户短语反射成问题"
          },
          {
                    "en": "It trained a transformer on the web",
                    "zh": "它在网页上训练了 Transformer"
          },
          {
                    "en": "It solved ImageNet classification",
                    "zh": "它解决了 ImageNet 分类"
          },
          {
                    "en": "It used Monte Carlo tree search",
                    "zh": "它使用蒙特卡洛树搜索"
          }
],
            0,
            {
          "en": "ELIZA’s DOCTOR script relied on pattern matching and response templates that made users continue supplying meaning.",
          "zh": "ELIZA 的 DOCTOR 脚本依赖模式匹配和回应模板，让用户持续提供语义。"
},
            [
          "chatbot",
          "nlp"
]
        ),
        '1982-hopfield-network': quiz(
            {
          "en": "In a Hopfield network, what does a stored pattern act like?",
          "zh": "在 Hopfield 网络中，被存储的模式像什么？"
},
            [
          {
                    "en": "A stable attractor in an energy landscape",
                    "zh": "能量地形中的稳定吸引子"
          },
          {
                    "en": "A fixed dropout probability",
                    "zh": "固定 dropout 概率"
          },
          {
                    "en": "A web-scale image label",
                    "zh": "网页规模图像标签"
          },
          {
                    "en": "A single-shot bounding box",
                    "zh": "单次检测框"
          }
],
            0,
            {
          "en": "Hopfield networks store memories as stable states; noisy inputs can relax toward those states.",
          "zh": "Hopfield 网络把记忆存为稳定状态；带噪输入可以向这些状态收敛。"
},
            [
          "neural-network",
          "memory"
]
        ),
        '2014-dropout': quiz(
            {
          "en": "What happens to units during dropout training?",
          "zh": "Dropout 训练时神经元会发生什么？"
},
            [
          {
                    "en": "A random subset is temporarily removed",
                    "zh": "随机子集会被临时移除"
          },
          {
                    "en": "All weights become exactly zero forever",
                    "zh": "所有权重永久变为零"
          },
          {
                    "en": "The model stops using gradients",
                    "zh": "模型停止使用梯度"
          },
          {
                    "en": "Images become text labels automatically",
                    "zh": "图像自动变成文本标签"
          }
],
            0,
            {
          "en": "Dropout samples a mask during training, reducing co-adaptation and acting like approximate ensemble learning.",
          "zh": "Dropout 在训练时采样掩码，减少共适应，并近似于集成学习。"
},
            [
          "regularization",
          "deep-learning"
]
        ),
        '2016-yolo': quiz(
            {
          "en": "What made YOLO different from many earlier object detectors?",
          "zh": "YOLO 与许多早期目标检测器的关键不同是什么？"
},
            [
          {
                    "en": "It predicts boxes and classes in one network pass",
                    "zh": "它在一次网络前向传播中预测框和类别"
          },
          {
                    "en": "It requires a separate theorem prover",
                    "zh": "它需要独立定理证明器"
          },
          {
                    "en": "It only clusters tabular points",
                    "zh": "它只聚类表格点"
          },
          {
                    "en": "It stores memories as energy basins",
                    "zh": "它把记忆存成能量盆地"
          }
],
            0,
            {
          "en": "YOLO treats detection as unified prediction over a grid, enabling real-time performance.",
          "zh": "YOLO 把检测看作网格上的统一预测问题，从而实现实时性能。"
},
            [
          "vision",
          "object-detection"
]
        ),
        '2013-word2vec': quiz(
            {
          "en": "What does Word2Vec learn for each word?",
          "zh": "Word2Vec 为每个词学习什么？"
},
            [
          {
                    "en": "A dense vector that captures distributional relationships",
                    "zh": "捕捉分布关系的密集向量"
          },
          {
                    "en": "A theorem proof certificate only",
                    "zh": "只有定理证明证书"
          },
          {
                    "en": "A fixed object bounding box",
                    "zh": "固定目标检测框"
          },
          {
                    "en": "A protein structure template",
                    "zh": "蛋白质结构模板"
          }
],
            0,
            {
          "en": "Word2Vec learns embeddings whose geometry reflects word-context statistics and useful semantic relations.",
          "zh": "Word2Vec 学习词嵌入，其几何结构反映词-上下文统计和有用语义关系。"
},
            [
          "nlp",
          "embeddings"
]
        ),
        '2009-imagenet': quiz(
            {
          "en": "Why was ImageNet so important for deep learning in vision?",
          "zh": "ImageNet 为什么对视觉深度学习如此重要？"
},
            [
          {
                    "en": "It provided a large shared labeled dataset and benchmark",
                    "zh": "它提供了大型共享标注数据集和基准"
          },
          {
                    "en": "It replaced every neural network with Prolog",
                    "zh": "它用 Prolog 替换了所有神经网络"
          },
          {
                    "en": "It proved all clauses by resolution",
                    "zh": "它用归结证明所有子句"
          },
          {
                    "en": "It only optimized word vectors",
                    "zh": "它只优化词向量"
          }
],
            0,
            {
          "en": "ImageNet gave researchers a common large-scale training and evaluation setting, making model progress easier to compare.",
          "zh": "ImageNet 给研究者提供共同的大规模训练和评测环境，使模型进展更容易比较。"
},
            [
          "dataset",
          "vision"
]
        ),
        '2013-dqn': quiz(
            {
          "en": "Which two tricks helped stabilize DQN training?",
          "zh": "哪两个技巧帮助稳定 DQN 训练？"
},
            [
          {
                    "en": "Experience replay and a target network",
                    "zh": "经验回放和目标网络"
          },
          {
                    "en": "Only handwritten rules and no learning",
                    "zh": "只有手写规则且不学习"
          },
          {
                    "en": "WordNet labels and synsets only",
                    "zh": "只有 WordNet 标签和 synsets"
          },
          {
                    "en": "Randomly deleting all rewards",
                    "zh": "随机删除所有奖励"
          }
],
            0,
            {
          "en": "Replay samples past transitions, while the target network slows down the moving target in Q-learning updates.",
          "zh": "经验回放采样过去转移，目标网络则减慢 Q 学习更新中的移动目标。"
},
            [
          "reinforcement-learning",
          "deep-learning"
]
        ),
        '2003-lda': quiz(
            {
          "en": "How does LDA represent a document?",
          "zh": "LDA 如何表示一篇文档？"
},
            [
          {
                    "en": "As a mixture of latent topics",
                    "zh": "表示为隐藏主题的混合"
          },
          {
                    "en": "As one fixed object box",
                    "zh": "表示为一个固定目标框"
          },
          {
                    "en": "As a single Prolog fact only",
                    "zh": "只表示为一个 Prolog 事实"
          },
          {
                    "en": "As an Atari reward replay buffer",
                    "zh": "表示为 Atari 奖励回放池"
          }
],
            0,
            {
          "en": "LDA assumes each document mixes topics, and each topic is a distribution over words.",
          "zh": "LDA 假设每篇文档混合多个主题，每个主题都是词上的分布。"
},
            [
          "probabilistic-models",
          "topic-modeling"
]
        ),
        '1970-shrdlu': quiz(
            {
          "en": "Why could SHRDLU appear so fluent in dialogue?",
          "zh": "为什么 SHRDLU 在对话中显得很流畅？"
},
            [
          {
                    "en": "It grounded language in a small blocks world with explicit actions",
                    "zh": "它把语言落地到一个小型积木世界和明确动作中"
          },
          {
                    "en": "It trained on the full web",
                    "zh": "它在整个网络上训练"
          },
          {
                    "en": "It used ImageNet labels",
                    "zh": "它使用 ImageNet 标签"
          },
          {
                    "en": "It played chess by hardware search",
                    "zh": "它用硬件搜索下棋"
          }
],
            0,
            {
          "en": "SHRDLU worked because language, objects, memory, and plans were all represented inside one constrained microworld.",
          "zh": "SHRDLU 有效是因为语言、对象、记忆和计划都表示在同一个受限微世界里。"
},
            [
          "nlp",
          "microworld"
]
        ),
        '1997-deep-blue': quiz(
            {
          "en": "What was Deep Blue especially built to do?",
          "zh": "Deep Blue 尤其被构建来做什么？"
},
            [
          {
                    "en": "Search and evaluate chess positions at massive scale",
                    "zh": "大规模搜索并评估国际象棋局面"
          },
          {
                    "en": "Generate word embeddings",
                    "zh": "生成词嵌入"
          },
          {
                    "en": "Cluster image pixels with t-SNE",
                    "zh": "用 t-SNE 聚类图像像素"
          },
          {
                    "en": "Infer Bayesian network structure from text only",
                    "zh": "只从文本推断贝叶斯网络结构"
          }
],
            0,
            {
          "en": "Deep Blue combined alpha-beta search, handcrafted chess evaluation, and specialized hardware.",
          "zh": "Deep Blue 结合了 alpha-beta 搜索、手工棋局评估和专用硬件。"
},
            [
          "game-ai",
          "search"
]
        ),
        '1974-frame': quiz(
            {
          "en": "What is a frame mainly used for?",
          "zh": "框架主要用来做什么？"
},
            [
          {
                    "en": "Represent a stereotyped situation with slots and defaults",
                    "zh": "用槽和默认值表示典型情境"
          },
          {
                    "en": "Normalize neural activations by minibatch",
                    "zh": "按小批量归一化神经激活"
          },
          {
                    "en": "Search chess moves on custom chips",
                    "zh": "在定制芯片上搜索棋步"
          },
          {
                    "en": "Draw t-SNE scatter plots only",
                    "zh": "只绘制 t-SNE 散点图"
          }
],
            0,
            {
          "en": "Frames organize contextual knowledge into slots, default assumptions, and inherited structure.",
          "zh": "框架把上下文知识组织成槽、默认假设和继承结构。"
},
            [
          "knowledge-representation"
]
        ),
        '1965-dendral': quiz(
            {
          "en": "What made DENDRAL historically important?",
          "zh": "DENDRAL 的历史重要性主要是什么？"
},
            [
          {
                    "en": "It used expert chemical knowledge to guide scientific inference",
                    "zh": "它用专家化学知识引导科学推断"
          },
          {
                    "en": "It invented t-SNE visualization",
                    "zh": "它发明了 t-SNE 可视化"
          },
          {
                    "en": "It normalized neural activations",
                    "zh": "它归一化神经激活"
          },
          {
                    "en": "It won at Go with Monte Carlo tree search",
                    "zh": "它用蒙特卡洛树搜索赢围棋"
          }
],
            0,
            {
          "en": "DENDRAL helped show that knowledge-rich expert systems could solve practical scientific tasks.",
          "zh": "DENDRAL 表明富知识专家系统可以解决实际科学任务。"
},
            [
          "expert-system",
          "science"
]
        ),
        '1999-sift': quiz(
            {
          "en": "What does SIFT try to make stable?",
          "zh": "SIFT 试图让什么保持稳定？"
},
            [
          {
                    "en": "Local image keypoints and descriptors across scale and rotation",
                    "zh": "跨尺度和旋转的局部图像关键点与描述子"
          },
          {
                    "en": "A chess opening book",
                    "zh": "国际象棋开局库"
          },
          {
                    "en": "A Bayesian network prior",
                    "zh": "贝叶斯网络先验"
          },
          {
                    "en": "A natural-language chatbot script",
                    "zh": "自然语言聊天脚本"
          }
],
            0,
            {
          "en": "SIFT detects local features designed to remain matchable despite common image transformations.",
          "zh": "SIFT 检测设计为在常见图像变换下仍可匹配的局部特征。"
},
            [
          "vision",
          "features"
]
        ),
        '2008-tsne': quiz(
            {
          "en": "What kind of structure does t-SNE mainly try to preserve?",
          "zh": "t-SNE 主要试图保留哪类结构？"
},
            [
          {
                    "en": "Local neighborhood relationships",
                    "zh": "局部邻域关系"
          },
          {
                    "en": "Exact global distances everywhere",
                    "zh": "所有位置的精确全局距离"
          },
          {
                    "en": "Chess move legality tables",
                    "zh": "国际象棋走法合法性表"
          },
          {
                    "en": "Chemical mass spectra only",
                    "zh": "仅化学质谱"
          }
],
            0,
            {
          "en": "t-SNE is best understood as a local-neighborhood visualization method, not a faithful global map.",
          "zh": "t-SNE 最适合理解为局部邻域可视化方法，而不是忠实全局地图。"
},
            [
          "visualization",
          "dimensionality-reduction"
]
        ),
        '1958-rosenblatt-perceptron': quiz(
            {
          "en": "What is the basic computation in a perceptron?",
          "zh": "感知机的基本计算是什么？"
},
            [
          {
                    "en": "A weighted sum followed by a threshold decision",
                    "zh": "加权求和后进行阈值决策"
          },
          {
                    "en": "A t-SNE perplexity search",
                    "zh": "t-SNE 困惑度搜索"
          },
          {
                    "en": "A Bayesian network message pass only",
                    "zh": "仅贝叶斯网络消息传递"
          },
          {
                    "en": "A molecular mass spectrum filter",
                    "zh": "分子质谱过滤器"
          }
],
            0,
            {
          "en": "A perceptron classifies by summing weighted inputs and comparing the result to a threshold.",
          "zh": "感知机通过输入加权求和并与阈值比较来分类。"
},
            [
          "neural-network",
          "classification"
]
        ),
        '2006-dbn': quiz(
            {
          "en": "What training idea made early deep belief networks practical?",
          "zh": "什么训练思想让早期深度置信网络变得实用？"
},
            [
          {
                    "en": "Greedy layer-wise pretraining",
                    "zh": "贪心逐层预训练"
          },
          {
                    "en": "One-shot chess hardware search",
                    "zh": "一次性国际象棋硬件搜索"
          },
          {
                    "en": "Frame slot inheritance only",
                    "zh": "仅框架槽继承"
          },
          {
                    "en": "Mass-spectrum molecule filtering",
                    "zh": "质谱分子过滤"
          }
],
            0,
            {
          "en": "DBNs trained layers one at a time to obtain useful representations before task-specific fine-tuning.",
          "zh": "DBN 逐层训练以获得有用表示，然后再针对任务微调。"
},
            [
          "deep-learning",
          "pretraining"
]
        ),
        '1988-td-update': quiz(
            {
          "en": "What does a TD update compare?",
          "zh": "TD 更新比较什么？"
},
            [
          {
                    "en": "The current value estimate with reward plus next value estimate",
                    "zh": "当前价值估计与“奖励加下一价值估计”"
          },
          {
                    "en": "Two unrelated image captions",
                    "zh": "两个无关图像标题"
          },
          {
                    "en": "A molecule with a chess position",
                    "zh": "一个分子与一个棋局"
          },
          {
                    "en": "Only final episode reward after all learning stops",
                    "zh": "学习停止后才看的最终回合奖励"
          }
],
            0,
            {
          "en": "TD learning bootstraps by using the next prediction as part of the learning target.",
          "zh": "TD 学习用下一步预测作为学习目标的一部分来进行自举。"
},
            [
          "reinforcement-learning",
          "value"
]
        ),
        '1985-bayesian-network': quiz(
            {
          "en": "What does a Bayesian network combine?",
          "zh": "贝叶斯网络结合了什么？"
},
            [
          {
                    "en": "A directed graph and conditional probabilities",
                    "zh": "有向图与条件概率"
          },
          {
                    "en": "A chess chip and opening book only",
                    "zh": "只有棋类芯片和开局库"
          },
          {
                    "en": "A scale-space image descriptor only",
                    "zh": "只有尺度空间图像描述子"
          },
          {
                    "en": "A blocks-world parser without uncertainty",
                    "zh": "没有不确定性的积木世界解析器"
          }
],
            0,
            {
          "en": "The graph expresses dependency structure, and the probabilities support belief updating under evidence.",
          "zh": "图表达依赖结构，概率支持在证据下更新信念。"
},
            [
          "probabilistic-ai",
          "knowledge-representation"
]
        ),
        '1990-otter': quiz(
            {
          "en": "What was central to Otter's practical theorem-proving style?",
          "zh": "Otter 实用定理证明风格的核心是什么？"
},
            [
          {
                    "en": "A controlled given-clause search with resolution and paramodulation",
                    "zh": "结合归结与参数调解的受控 given-clause 搜索"
          },
          {
                    "en": "Only a fixed chess opening book",
                    "zh": "只有固定的棋类开局库"
          },
          {
                    "en": "A neural image classifier",
                    "zh": "神经图像分类器"
          },
          {
                    "en": "A random text generator",
                    "zh": "随机文本生成器"
          }
],
            0,
            {
          "en": "Otter searched first-order clause spaces using resolution-style inference, equality reasoning, indexing, and search-control heuristics.",
          "zh": "Otter 用归结式推理、等式推理、索引和搜索控制启发式来搜索一阶子句空间。"
},
            [
          "theorem-proving",
          "symbolic-ai"
]
        ),
        '2011-ibm-watson': quiz(
            {
          "en": "How did Watson choose a Jeopardy! answer?",
          "zh": "Watson 如何选择 Jeopardy! 答案？"
},
            [
          {
                    "en": "It generated candidate answers and ranked them by evidence and confidence",
                    "zh": "它生成候选答案，并按证据与置信度排序"
          },
          {
                    "en": "It opened the internet during the show",
                    "zh": "它在节目中实时打开互联网"
          },
          {
                    "en": "It followed a fixed first answer every time",
                    "zh": "它每次都采用固定第一个答案"
          },
          {
                    "en": "It only counted image pixels",
                    "zh": "它只统计图像像素"
          }
],
            0,
            {
          "en": "DeepQA combined many analysis and scoring components, then merged their evidence into answer confidence.",
          "zh": "DeepQA 组合大量分析与评分组件，再把它们的证据合并为答案置信度。"
},
            [
          "question-answering",
          "nlp"
]
        ),
        '1951-strachey-draughts': quiz(
            {
          "en": "Why is Strachey's draughts program important to AI history?",
          "zh": "Strachey 的跳棋程序为什么对 AI 历史重要？"
},
            [
          {
                    "en": "It showed an early computer choosing moves in a non-numerical game",
                    "zh": "它展示了早期计算机在非数值游戏中选择走法"
          },
          {
                    "en": "It trained a modern transformer",
                    "zh": "它训练了现代 Transformer"
          },
          {
                    "en": "It solved protein folding",
                    "zh": "它解决了蛋白质折叠"
          },
          {
                    "en": "It clustered images with DBSCAN",
                    "zh": "它用 DBSCAN 聚类图像"
          }
],
            0,
            {
          "en": "The program used board representation, legal move generation, and evaluation on early stored-program computers.",
          "zh": "该程序在早期存储程序计算机上使用棋盘表示、合法走法生成和局面评估。"
},
            [
          "game-ai",
          "early-computing"
]
        ),
        '1994-chinook': quiz(
            {
          "en": "What did Chinook eventually prove about checkers?",
          "zh": "Chinook 最终证明了跳棋的什么性质？"
},
            [
          {
                    "en": "Perfect play from both sides leads to a draw",
                    "zh": "双方完美对弈会导致和棋"
          },
          {
                    "en": "Every game is won by the first move",
                    "zh": "每局都由第一步直接获胜"
          },
          {
                    "en": "Search is unnecessary in games",
                    "zh": "游戏中不需要搜索"
          },
          {
                    "en": "Only language models can play checkers",
                    "zh": "只有语言模型能下跳棋"
          }
],
            0,
            {
          "en": "The Chinook team used search and endgame databases to weakly solve checkers as a draw under perfect play.",
          "zh": "Chinook 团队用搜索和残局数据库弱求解跳棋，证明完美对弈下为和棋。"
},
            [
          "game-ai",
          "search"
]
        ),
        '1959-pandemonium': quiz(
            {
          "en": "What is the core idea of Pandemonium-style perception?",
          "zh": "Pandemonium 式感知的核心思想是什么？"
},
            [
          {
                    "en": "Many simple feature recognizers vote toward higher-level patterns",
                    "zh": "许多简单特征识别器向高层模式投票"
          },
          {
                    "en": "One fixed rule answers every image",
                    "zh": "一个固定规则回答所有图像"
          },
          {
                    "en": "A database deletes all uncertain evidence",
                    "zh": "数据库删除所有不确定证据"
          },
          {
                    "en": "A chess engine searches only openings",
                    "zh": "棋类引擎只搜索开局"
          }
],
            0,
            {
          "en": "Selfridge's architecture treated recognition as layered, distributed evidence accumulation.",
          "zh": "Selfridge 的架构把识别看作分层、分布式的证据累积。"
},
            [
          "perception",
          "pattern-recognition"
]
        ),
        '1984-cyc': quiz(
            {
          "en": "What did Cyc try to make explicit for AI systems?",
          "zh": "Cyc 试图为 AI 系统显式表示什么？"
},
            [
          {
                    "en": "Common-sense knowledge as an ontology and rule base",
                    "zh": "作为本体与规则库的常识知识"
          },
          {
                    "en": "Only raw image pixels",
                    "zh": "只有原始图像像素"
          },
          {
                    "en": "Only endgame checkers tables",
                    "zh": "只有跳棋残局表"
          },
          {
                    "en": "A single gradient update",
                    "zh": "单个梯度更新"
          }
],
            0,
            {
          "en": "Cyc is a long-running symbolic AI project centered on explicit common-sense knowledge and inference.",
          "zh": "Cyc 是长期运行的符号 AI 项目，核心是显式常识知识与推理。"
},
            [
          "knowledge-representation",
          "common-sense"
]
        ),
        '1980-xcon-r1': quiz(
            {
          "en": "What did XCON/R1 configure?",
          "zh": "XCON/R1 主要配置什么？"
},
            [
          {
                    "en": "DEC VAX computer orders using production rules",
                    "zh": "用产生式规则配置 DEC VAX 计算机订单"
          },
          {
                    "en": "Protein folds using diffusion",
                    "zh": "用扩散模型预测蛋白质折叠"
          },
          {
                    "en": "Image clusters with eigenvectors",
                    "zh": "用特征向量聚类图像"
          },
          {
                    "en": "Jeopardy! clues with endgame tables",
                    "zh": "用残局表回答 Jeopardy! 线索"
          }
],
            0,
            {
          "en": "R1/XCON encoded configuration expertise as rules that assembled valid VAX component orders.",
          "zh": "R1/XCON 把配置专长编码为规则，用来装配有效的 VAX 组件订单。"
},
            [
          "expert-system",
          "production-rules"
]
        ),
        '1957-kmeans': quiz(
            {
          "en": "What does Lloyd's k-means loop alternate between?",
          "zh": "Lloyd 的 k-means 循环在什么之间交替？"
},
            [
          {
                    "en": "Assigning points to nearest centers and updating centers to means",
                    "zh": "把样本分配给最近中心，并把中心更新为均值"
          },
          {
                    "en": "Writing theorem clauses and proving equality",
                    "zh": "书写定理子句并证明等式"
          },
          {
                    "en": "Playing endgames and parsing Jeopardy! clues",
                    "zh": "下残局并解析 Jeopardy! 线索"
          },
          {
                    "en": "Deleting all clusters as noise",
                    "zh": "把所有簇都删除为噪声"
          }
],
            0,
            {
          "en": "K-means minimizes within-cluster squared distances through repeated assignment and centroid update steps.",
          "zh": "K-means 通过反复分配样本和更新质心来最小化簇内平方距离。"
},
            [
          "clustering",
          "unsupervised-learning"
]
        ),
        '1996-dbscan': quiz(
            {
          "en": "What does DBSCAN do with low-density points?",
          "zh": "DBSCAN 如何处理低密度点？"
},
            [
          {
                    "en": "It can label them as noise instead of forcing them into a cluster",
                    "zh": "它可以把它们标为噪声，而不是强行归入簇"
          },
          {
                    "en": "It always creates one cluster per point",
                    "zh": "它总是为每个点创建一个簇"
          },
          {
                    "en": "It turns them into theorem clauses",
                    "zh": "它把它们变成定理子句"
          },
          {
                    "en": "It uses a chess opening book",
                    "zh": "它使用棋类开局库"
          }
],
            0,
            {
          "en": "DBSCAN forms clusters from dense neighborhoods and can leave sparse outliers outside the clusters.",
          "zh": "DBSCAN 从密集邻域形成簇，并可把稀疏离群点留在簇外。"
},
            [
          "clustering",
          "density"
]
        ),
        '2000-spectral-clustering': quiz(
            {
          "en": "What does spectral clustering build before using eigenvectors?",
          "zh": "谱聚类在使用特征向量前先构建什么？"
},
            [
          {
                    "en": "A graph whose edges encode similarities between points",
                    "zh": "一个用边编码样本相似度的图"
          },
          {
                    "en": "A Jeopardy! answer database only",
                    "zh": "只有 Jeopardy! 答案数据库"
          },
          {
                    "en": "A VAX parts order form only",
                    "zh": "只有 VAX 零件订单表"
          },
          {
                    "en": "A theorem prover's proof certificate only",
                    "zh": "只有定理证明器的证明证书"
          }
],
            0,
            {
          "en": "Spectral clustering represents data as an affinity graph, then uses graph-matrix eigenvectors to expose separable structure.",
          "zh": "谱聚类把数据表示为亲和图，再用图矩阵特征向量显露可分结构。"
},
            [
          "clustering",
          "graphs"
]
        )
    }
};
