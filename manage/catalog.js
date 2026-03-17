// 文件A: 展示目录配置
// 控制展示哪些分类、哪些核心事件，以及展示顺序
// 修改此文件后运行 `node manage/generate.js` 重新生成 milestones-data.js

module.exports = {
  categories: [
    {
      name: "AI创世纪 (1950s-1970s)",
      subtitle: "AI创世纪",
      events: [
        "1956-dartmouth",
        "1957-perceptron",
        "1969-ai-winter",
      ]
    },
    {
      name: "神经网络与连接主义的复兴 (1980s-2000s)",
      subtitle: "神经网络与连接主义的复兴",
      events: [
        "1986-backpropagation",
        "1989-cnn",
        "1986-rnn",
        "1997-lstm",
      ]
    },
    {
      name: "深度学习与范式归一 (2010s-2020s)",
      subtitle: "深度学习与范式归一",
      events: [
        "2012-alexnet",
        "2014-highway-network",
        "2015-resnet",
        "2016-densenet",
        "2014-gan",
        "2014-attention",
        "2017-transformer",
      ]
    },
    {
      name: "大模型时代 (2020s-今)",
      subtitle: "大模型时代",
      events: [
        "2018-bert",
        "2018-gpt",
        "2023-agents",
        "2025-llm-competition",
      ]
    },
    {
      name: "AI for Science (2018-今)",
      subtitle: "AI",
      events: [
        "2020-alphafold",
        "2019-ai-feynman",
        "2024-ai-scientist",
      ]
    },
  ]
};
