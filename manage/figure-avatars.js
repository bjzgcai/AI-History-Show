// LEGACY — rollback/comparison/migration helper; not consumed by production `npm run generate`.
// Avatar registry for the explicit Legacy generator until a separate Archive figure registry exists.
// Fill in `avatar` with a local image path once a reliable portrait is ready.
// `wikipediaTitle` is a suggested lookup key for future scripted collection.

/* eslint-disable */
module.exports = {
  "Alec Radford": {
    type: "person",
    status: "ready",
    wikipediaTitle: "",
    avatar: "resources/images/figures/alec-radford.png",
    note: "沿用 GPT 章节现有头像，后续可继续补充更明确的来源备注。"
  },
  "Alex Krizhevsky": {
    type: "person",
    status: "ready",
    wikipediaTitle: "Alex_Krizhevsky",
    avatar: "resources/images/figures/historical/alex-krizhevsky-2013.png",
    avatarStyle: "transform: scale(1.08); transform-origin: 50% 47%;",
    note: "来自多伦多大学 2013 年 AlexNet 团队照片裁剪。"
  },
  "Ashish Vaswani": {
    type: "person",
    status: "ready",
    wikipediaTitle: "Ashish_Vaswani",
    avatar: "resources/images/figures/ashish-vaswani.jpg",
    avatarStyle: "transform: scale(2.05); transform-origin: 50% 33%;",
    note: "来自 RAAIS 演讲嘉宾页头像。"
  },
  "Claude Shannon": {
    type: "person",
    status: "ready",
    wikipediaTitle: "Claude_Shannon",
    avatar: "resources/images/figures/historical/claude-shannon-1956-v2.png",
    avatarStyle: "transform: scale(1.06); transform-origin: 50% 45%;",
    note: "改用 1956 年达特茅斯 AI workshop 合影裁剪，避免使用晚年头像。"
  },
  "David Rumelhart": {
    type: "person",
    status: "ready",
    wikipediaTitle: "David_Rumelhart",
    avatar: "resources/images/figures/david-rumelhart.jpg",
    avatarStyle: "transform: scale(1.28); transform-origin: 50% 35%;",
    note: "来自 Wikipedia/Wikimedia Commons 头像。"
  },
  "Demis Hassabis": {
    type: "person",
    status: "ready",
    wikipediaTitle: "Demis_Hassabis",
    avatar: "resources/images/2020-alphafold/people/2020-alphafold_people_02.png",
    note: "本地已有可用人物照片。"
  },
  "Frank Rosenblatt": {
    type: "person",
    status: "ready",
    wikipediaTitle: "Frank_Rosenblatt",
    avatar: "resources/images/figures/frank-rosenblatt.png",
    avatarStyle: "transform: scale(1.18); transform-origin: 44% 38%;",
    note: "由感知机章节原始照片裁剪出的独立头像。"
  },
  "Geoffrey Hinton": {
    type: "person",
    status: "ready",
    wikipediaTitle: "Geoffrey_Hinton",
    avatar: "resources/images/figures/geoffrey-hinton.jpg",
    avatarByEvent: {
      "1986-backpropagation": "resources/images/figures/historical/geoffrey-hinton-1986.png"
    },
    avatarStyleByEvent: {
      "1986-backpropagation": "transform: scale(1.24); transform-origin: 50% 42%;"
    },
    note: "默认头像保留给 AlexNet 章节；1986 反向传播章节改用项目中同期视频素材裁剪。"
  },
  "Ian Goodfellow": {
    type: "person",
    status: "ready",
    wikipediaTitle: "Ian_Goodfellow",
    avatar: "resources/images/figures/ian-goodfellow.jpg",
    note: "来自 Wikipedia/Wikimedia Commons 头像。"
  },
  "Jacob Devlin": {
    type: "person",
    status: "ready",
    wikipediaTitle: "",
    avatar: "resources/images/figures/jacob-devlin.jpg",
    note: "来自 Microsoft Research 讲座页头像。"
  },
  "Jeffrey Elman": {
    type: "person",
    status: "ready",
    wikipediaTitle: "Jeffrey_Elman",
    avatar: "resources/images/figures/jeffrey-elman.jpg",
    note: "来自 UC San Diego 纪念页头像。"
  },
  "John Jumper": {
    type: "person",
    status: "ready",
    wikipediaTitle: "John_Jumper",
    avatar: "resources/images/2020-alphafold/people/2020-alphafold_people_01.png",
    note: "本地已有可用人物照片。"
  },
  "John McCarthy": {
    type: "person",
    status: "ready",
    wikipediaTitle: "John_McCarthy_(computer_scientist)",
    avatar: "resources/images/figures/historical/john-mccarthy-1956-v2.png",
    avatarStyle: "transform: scale(1.08); transform-origin: 50% 45%;",
    note: "改用 1956 年达特茅斯 AI workshop 合影裁剪，避免使用晚年头像。"
  },
  "Jürgen Schmidhuber": {
    type: "person",
    status: "ready",
    wikipediaTitle: "Jürgen_Schmidhuber",
    avatar: "resources/images/1997-lstm/people/1997-lstm_people_01.png",
    avatarStyle: "transform: scale(1.08); transform-origin: 50% 42%;",
    note: "改用 LSTM 章节的大图，避免旧头像在圆形卡片中过度裁切。"
  },
  "Marvin Minsky": {
    type: "person",
    status: "ready",
    wikipediaTitle: "Marvin_Minsky",
    avatar: "resources/images/figures/marvin-minsky.jpg",
    avatarByEvent: {
      "1956-dartmouth": "resources/images/figures/historical/marvin-minsky-1956-v2.png",
      "1969-ai-winter": "resources/images/figures/historical/marvin-minsky-1968.png"
    },
    avatarStyleByEvent: {
      "1956-dartmouth": "transform: scale(1.06); transform-origin: 50% 46%;",
      "1969-ai-winter": "transform: scale(1.32); transform-origin: 50% 35%;"
    },
    note: "默认头像保留备用；1956 章节使用达特茅斯合影裁剪，1969 章节使用 1968 年 MIT AI Lab 照片裁剪。"
  },
  "Max Tegmark": {
    type: "person",
    status: "ready",
    wikipediaTitle: "Max_Tegmark",
    avatar: "resources/images/2019-ai-feynman/people/2019-ai-feynman_people_01.png",
    note: "本地已有可用人物照片。"
  },
  "Michael Jordan": {
    type: "person",
    status: "ready",
    wikipediaTitle: "Michael_I._Jordan",
    avatar: "resources/images/figures/michael-i-jordan.jpg",
    note: "来自 UC Berkeley 教师主页头像。"
  },
  "Michael Wooldridge": {
    type: "person",
    status: "ready",
    wikipediaTitle: "Michael_Wooldridge",
    avatar: "resources/images/figures/michael-wooldridge.jpg",
    note: "来自 Oxford Computer Science 教师主页头像。"
  },
  "Nathaniel Rochester": {
    type: "person",
    status: "ready",
    wikipediaTitle: "Nathaniel_Rochester_(computer_scientist)",
    avatar: "resources/images/figures/historical/nathaniel-rochester-1956-v2.png",
    avatarStyle: "transform: scale(1.06); transform-origin: 50% 45%;",
    note: "改用 1956 年达特茅斯 AI workshop 合影裁剪，避免使用晚年头像。"
  },
  "Peter Norvig": {
    type: "person",
    status: "ready",
    wikipediaTitle: "Peter_Norvig",
    avatar: "resources/images/figures/peter-norvig.jpg",
    note: "来自 Wikipedia/Wikimedia Commons 头像。"
  },
  "Ronald Williams": {
    type: "person",
    status: "ready",
    wikipediaTitle: "Ronald_J._Williams",
    avatar: "resources/images/figures/ronald-williams.jpg",
    avatarStyle: "transform: scale(1.16); transform-origin: 50% 36%;",
    note: "来自 Northeastern Khoury 纪念页头像。"
  },
  "Sakana AI团队": {
    type: "team",
    status: "ready",
    wikipediaTitle: "Sakana_AI",
    avatar: "resources/images/2024-ai-scientist/people/2024-ai-scientist_people_02.png",
    note: "当前使用团队合照，适合作为团队型条目的头像。"
  },
  "Sepp Hochreiter": {
    type: "person",
    status: "ready",
    wikipediaTitle: "Sepp_Hochreiter",
    avatar: "resources/images/figures/sepp-hochreiter.jpg",
    note: "来自 Wikipedia/Wikimedia Commons 头像。"
  },
  "Stuart Russell": {
    type: "person",
    status: "ready",
    wikipediaTitle: "Stuart_J._Russell",
    avatar: "resources/images/figures/stuart-russell.jpg",
    note: "来自 Wikipedia/Wikimedia Commons 头像。"
  },
  "Yann LeCun": {
    type: "person",
    status: "ready",
    wikipediaTitle: "Yann_LeCun",
    avatar: "resources/images/1989-cnn/people/1989-cnn_people_02.jpg",
    avatarStyle: "transform: scale(2.28); transform-origin: 52% 43%;",
    note: "本地已有可用人物照片。"
  },
  "Yoshua Bengio": {
    type: "person",
    status: "ready",
    wikipediaTitle: "Yoshua_Bengio",
    avatar: "resources/images/2014-attention/people/2014-attention_people_01.png",
    note: "本地已有可用人物照片。"
  },
  "何恺明 (Kaiming He)": {
    type: "person",
    status: "ready",
    wikipediaTitle: "Kaiming_He",
    avatar: "resources/images/figures/kaiming-he.jpg",
    note: "双语事件名映射，头像同何恺明。"
  },
  "孙剑 (Jian Sun)": {
    type: "person",
    status: "ready",
    wikipediaTitle: "",
    avatar: "resources/images/2015-resnet/people/2015-resnet_people_01.png",
    note: "双语事件名映射，复用 ResNet 章节中已核验的孙剑头像。"
  },
  "黄高 (Gao Huang)": {
    type: "person",
    status: "ready",
    wikipediaTitle: "",
    avatar: "resources/images/2016-densenet/people/2016-densenet_people_02.png",
    avatarStyle: "transform: scale(1.72); transform-origin: 46% 28%;",
    note: "双语事件名映射，头像同黄高。"
  },
  "伯克利团队": {
    type: "team",
    status: "ready",
    wikipediaTitle: "",
    avatar: "resources/images/2024-ai-scientist/people/2024-ai-scientist_people_01.png",
    note: "当前使用团队实验室照片，后续可细化为具体作者头像。"
  },
  "何恺明": {
    type: "person",
    status: "ready",
    wikipediaTitle: "Kaiming_He",
    avatar: "resources/images/figures/kaiming-he.jpg",
    note: "来自 MIT EECS 教师页头像。"
  },
  "孙剑": {
    type: "person",
    status: "ready",
    wikipediaTitle: "",
    avatar: "resources/images/2015-resnet/people/2015-resnet_people_01.png",
    note: "沿用 ResNet 章节中已核验的孙剑头像。"
  },
  "研究机构": {
    type: "team",
    status: "ready",
    wikipediaTitle: "",
    avatar: "resources/images/figures/research-institution.png",
    note: "使用本地机房图作为研究机构头像。"
  },
  "黄高": {
    type: "person",
    status: "ready",
    wikipediaTitle: "",
    avatar: "resources/images/2016-densenet/people/2016-densenet_people_02.png",
    avatarStyle: "transform: scale(1.72); transform-origin: 46% 28%;",
    note: "本地已有可用人物照片。"
  },
  "Christopher Strachey": {
    type: "person",
    status: "missing",
    wikipediaTitle: "Christopher_Strachey",
    avatar: "",
    note: "未找到可靠可复用人物照片；不要使用本地虚拟人物卡。"
  },
  "David Ferrucci": {
    type: "person",
    status: "ready",
    wikipediaTitle: "David_Ferrucci",
    avatar: "resources/images/bench-council-ai100/photos/2011-ibm-watson_david-ferrucci.jpg",
    note: "Wikimedia Commons portrait for the IBM Watson achievement."
  },
  "Douglas Lenat": {
    type: "person",
    status: "ready",
    wikipediaTitle: "Douglas_Lenat",
    avatar: "resources/images/bench-council-ai100/photos/1984-cyc_douglas-lenat.jpg",
    note: "Wikimedia Commons portrait for the Cyc achievement."
  },
  "Jianbo Shi": {
    type: "person",
    status: "missing",
    wikipediaTitle: "",
    avatar: "",
    note: "未找到可靠可复用人物照片；不要使用本地虚拟人物卡。"
  },
  "John McDermott": {
    type: "person",
    status: "missing",
    wikipediaTitle: "",
    avatar: "",
    note: "未找到可靠可复用人物照片；不要使用本地虚拟人物卡。"
  },
  "Jonathan Schaeffer": {
    type: "person",
    status: "missing",
    wikipediaTitle: "Jonathan_Schaeffer",
    avatar: "",
    note: "人物照片在事件 hero 图片中引用；头像 registry 不使用外部 URL。"
  },
  "Martin Ester": {
    type: "person",
    status: "missing",
    wikipediaTitle: "Martin_Ester",
    avatar: "",
    note: "人物照片在事件 hero 图片中引用；头像 registry 不使用外部 URL。"
  },
  "Oliver Selfridge": {
    type: "person",
    status: "ready",
    wikipediaTitle: "Oliver_Selfridge",
    avatar: "resources/images/bench-council-ai100/photos/1959-pandemonium_oliver-selfridge.jpg",
    note: "Wikimedia Commons portrait for the Pandemonium achievement."
  },
  "Stuart Lloyd": {
    type: "person",
    status: "missing",
    wikipediaTitle: "",
    avatar: "",
    note: "未找到可靠可复用人物照片；不要使用本地虚拟人物卡。"
  },
  "William McCune": {
    type: "person",
    status: "missing",
    wikipediaTitle: "William_McCune",
    avatar: "",
    note: "未找到可靠可复用人物照片；不要使用本地虚拟人物卡。"
  },
  "Xiangyu Zhang": {
    type: "person",
    status: "ready",
    wikipediaTitle: "",
    avatar: "resources/images/2015-resnet/people/2015-resnet_people_03.png",
    note: "ResNet 共同作者，沿用 ResNet 章节本地头像。"
  },
  "张祥雨": {
    type: "person",
    status: "ready",
    wikipediaTitle: "",
    avatar: "resources/images/2015-resnet/people/2015-resnet_people_03.png",
    note: "双语事件名映射，头像同 Xiangyu Zhang。"
  },
  "Shaoqing Ren": {
    type: "person",
    status: "ready",
    wikipediaTitle: "",
    avatar: "resources/images/2015-resnet/people/2015-resnet_people_02.png",
    note: "ResNet 共同作者，沿用 ResNet 章节本地头像。"
  },
  "任少卿": {
    type: "person",
    status: "ready",
    wikipediaTitle: "",
    avatar: "resources/images/2015-resnet/people/2015-resnet_people_02.png",
    note: "双语事件名映射，头像同 Shaoqing Ren。"
  }
};
