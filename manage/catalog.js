// 文件A: 展示目录配置（由管理页面生成）
// 控制展示哪些分类、哪些核心事件，以及展示顺序
// 修改此文件后运行 `node manage/generate.js` 重新生成 milestones-data.js
//
// Archive migration note:
// This remains the legacy exhibit routing source. The long-term archive target
// is archive/storylines/*.json plus an archive-native display manifest.

module.exports = {
  "categories": [
    {
      "name": {
        "en": "Genesis of AI (1950s-1970s)",
        "zh": "AI创世纪（20世纪50年代至70年代）"
      },
      "subtitle": {
        "en": "Genesis of AI",
        "zh": "AI创世纪"
      },
      "events": [
        "1956-dartmouth",
        "1957-perceptron",
        "1969-ai-winter"
      ]
    },
    {
      "name": {
        "en": "Neural Networks and the Revival of Connectionism (1980s-2000s)",
        "zh": "神经网络与连接主义的复兴（20世纪80年代至21世纪初）"
      },
      "subtitle": {
        "en": "Neural Networks and Connectionism",
        "zh": "神经网络与连接主义的复兴"
      },
      "events": [
        "1986-backpropagation",
        "1986-rnn",
        "1989-cnn",
        "1997-lstm"
      ]
    },
    {
      "name": {
        "en": "Deep Learning and the Unification of Paradigms (2010s-2020s)",
        "zh": "深度学习与范式归一（2010年代至2020年代）"
      },
      "subtitle": {
        "en": "Deep Learning and Unified Paradigms",
        "zh": "深度学习与范式归一"
      },
      "events": [
        "2012-alexnet",
        "2014-highway-network",
        "2014-gan",
        "2014-attention",
        "2015-resnet",
        "2016-densenet",
        "2017-transformer"
      ]
    },
    {
      "name": {
        "en": "Large Models and Scientific Intelligence",
        "zh": "大模型与科学智能"
      },
      "subtitle": {
        "en": "Large Models and Scientific Intelligence",
        "zh": "大模型与科学智能"
      },
      "events": [
        "2018-bert",
        "2018-gpt",
        "2019-ai-feynman",
        "2020-alphafold",
        "2023-agents",
        "2024-ai-scientist",
        "2025-llm-competition"
      ]
    },
    {
      "name": {
        "en": "BenchCouncil AI100 Achievements",
        "zh": "BenchCouncil AI100 成就"
      },
      "subtitle": {
        "en": "AI Top 100 Achievements",
        "zh": "AI 百大成就"
      },
      "storyline": {
        "id": "bench-council-ai100",
        "name": {
          "en": "AI Top 100 Achievements (BenchCouncil)",
          "zh": "AI 百大成就（BenchCouncil）"
        }
      },
      "events": [
        "1950-turing-test",
        "1958-lisp",
        "2016-alphago",
        "1971-complexity-theory",
        "1971-vc-theory",
        "1956-logic-theorist",
        "1958-wangs-algorithm",
        "1960-davis-putnam-dpll",
        "2014-adam",
        "2014-vgg",
        "1975-genetic-algorithm",
        "2015-u-net",
        "2015-faster-r-cnn",
        "1992-svm",
        "1984-cart",
        "1983-simulated-annealing",
        "1996-lasso",
        "2015-googlenet-inception",
        "1965-resolution-method",
        "1973-prolog",
        "1966-eliza",
        "1982-hopfield-network",
        "2014-dropout",
        "2016-yolo",
        "2013-word2vec",
        "2009-imagenet",
        "2013-dqn",
        "2003-lda",
        "1970-shrdlu",
        "1997-deep-blue",
        "1974-frame",
        "1965-dendral",
        "1999-sift",
        "2008-tsne",
        "1958-rosenblatt-perceptron",
        "2006-dbn",
        "1988-td-update",
        "1985-bayesian-network",
        "1990-otter",
        "2011-ibm-watson",
        "1951-strachey-draughts",
        "1994-chinook",
        "1959-pandemonium",
        "1984-cyc",
        "1980-xcon-r1",
        "1957-kmeans",
        "1996-dbscan",
        "2000-spectral-clustering",
        "ai100-1967-knn",
        "ai100-1970-ridge",
        "ai100-2005-hog",
        "ai100-2006-surf",
        "ai100-1997-kernel-pca",
        "ai100-1999-nmf",
        "ai100-2000-isomap",
        "ai100-2000-lle",
        "ai100-1943-mcculloch-pitts-neuron",
        "ai100-1951-snarc",
        "ai100-1982-som",
        "ai100-1967-back-propagation",
        "ai100-1969-relu",
        "ai100-1980-neocognitron",
        "ai100-1989-lenet",
        "ai100-2000-neural-language-model",
        "ai100-2012-alexnet",
        "ai100-2015-resnet",
        "ai100-2015-batch-normalization",
        "ai100-2017-densenet",
        "ai100-2017-transformer",
        "ai100-2020-vit",
        "ai100-1997-lstm",
        "ai100-2014-gan",
        "ai100-2014-neural-machine-translation-attention",
        "ai100-2018-bert",
        "ai100-2018-gpt",
        "ai100-2020-alphafold2",
        "ai100-2021-clip",
        "ai100-2021-dalle",
        "ai100-2022-stable-diffusion",
        "ai100-2023-segment-anything",
        "ai100-2021-swin-transformer",
        "ai100-2014-glove",
        "ai100-2014-conditional-gan",
        "ai100-2015-dcgan",
        "ai100-2017-wasserstein-gan",
        "ai100-2017-cyclegan",
        "ai100-2017-pix2pix",
        "ai100-2019-stylegan",
        "ai100-2013-variational-autoencoder",
        "ai100-2015-diffusion-model",
        "ai100-2005-gnn",
        "ai100-2016-gcn",
        "ai100-2017-gat",
        "ai100-2016-nas",
        "ai100-2015-deep-compression",
        "ai100-2015-knowledge-distillation",
        "ai100-2014-ms-coco",
        "ai100-1989-q-learning",
        "ai100-2015-ddpg",
        "ai100-1983-actor-critic"
      ]
    }
  ],
  "branches": [
    {
      "id": "humanistic-cycle",
      "name": {
        "en": "Humanistic & Emotional Cycles of AI",
        "zh": "AI 的人文与情绪周期"
      },
      "subtitle": {
        "en": "Sci-Fi Prophecy, Hype and AI Winters",
        "zh": "科幻预言、技术狂热与 AI 寒冬"
      },
      "events": [
        "1920-rur-robots",
        "1942-asimov-runaround",
        "1950-wiener-human-use",
        "1965-simon-ai-prediction",
        "1968-hal-9000",
        "1973-lighthill-report",
        "1978-xiaolingtong",
        "1984-neuromancer",
        "1987-lisp-machine-collapse",
        "2014-ai-existential-warnings",
        "2015-openai-founding",
        "2023-ai-risk-statement"
      ]
    },
    {
      "id": "gaming-ai",
      "name": {
        "en": "AI in Board & Tabletop Games",
        "zh": "AI 在棋牌与博弈论的演进"
      },
      "subtitle": {
        "en": "Game AI as a Testbed for Search, Learning and Planning",
        "zh": "以棋牌游戏为试验场：搜索、学习与规划的演进"
      },
      "events": [
        "1951-strachey-draughts",
        "1988-td-update",
        "1994-chinook",
        "1997-logistello",
        "1997-deep-blue",
        "2000s-alphacat",
        "2013-dqn",
        "2016-alphago",
        "2017-alphazero",
        "2017-libratus",
        "2019-pluribus",
        "2019-suphx",
        "2019-muzero"
      ]
    }
  ]
};
