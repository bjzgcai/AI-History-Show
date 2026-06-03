// 文件A: 展示目录配置（由管理页面生成）
// 控制展示哪些分类、哪些核心事件，以及展示顺序
// 修改此文件后运行 `node manage/generate.js` 重新生成 milestones-data.js

module.exports = {
  "categories": [
    {
      "name": {
        "en": "Genesis of AI (1950s-1970s)",
        "zh": "AI创世纪 (1950s-1970s)"
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
        "zh": "神经网络与连接主义的复兴 (1980s-2000s)"
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
        "zh": "深度学习与范式归一 (2010s-2020s)"
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
        "1956-logic-theorist"
      ]
    }
  ]
};
