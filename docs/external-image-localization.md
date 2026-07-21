# 统一 UI 外链图片本地化

## 存储规则

- 所有统一 UI 当前展示的外部图片副本统一存放在 `resources/images/external/<event-id>/`。
- 文件扩展名以下载内容的真实 MIME 为准，不沿用错误的远端扩展名。
- Archive 资产保留 `sourceName`、`sourceUrl` 与 `rights.sourceUrl`，用于追溯原始来源。
- 本地化只解决网络稳定性，不改变原始图片许可。对外再分发时仍需遵守来源页面的署名和许可要求。

## 本地化清单

| 事件 | 图片 | 本地路径 | 原始来源 |
| --- | --- | --- | --- |
| 1951-strachey-draughts | 标准跳棋棋盘 | `resources/images/external/1951-strachey-draughts/standard-checkers-board.jpg` | [维基共享资源](https://upload.wikimedia.org/wikipedia/commons/f/f1/CheckersStandard.jpg) |
| 1951-strachey-draughts | 斯特雷奇跳棋程序显示画面 | `resources/images/external/1951-strachey-draughts/strachey-draughts-program-display.png` | [维基共享资源](https://upload.wikimedia.org/wikipedia/commons/e/e1/Christopher_Strachey%27s_Draughts_Program.png) |
| 1957-kmeans | 贝尔实验室霍姆德尔园区 | `resources/images/external/1957-kmeans/bell-labs-holmdel-complex.jpg` | [维基共享资源](https://upload.wikimedia.org/wikipedia/commons/c/c1/Bell_Labs_Holmdel.jpg) |
| 1957-kmeans | K-means 鸢尾花聚类结果 | `resources/images/external/1957-kmeans/k-means-clustering-of-iris-data.png` | [维基共享资源](https://upload.wikimedia.org/wikipedia/commons/1/10/Iris_Flowers_Clustering_kMeans.svg) |
| 1959-pandemonium | Pandemonium 分层识别架构 | `resources/images/external/1959-pandemonium/pandemonium-layered-recognition-architecture.jpg` | [维基共享资源](https://upload.wikimedia.org/wikipedia/commons/9/9e/Original_pande2.jpg) |
| 1980-xcon-r1 | DEC VAX 11/780 计算机 | `resources/images/external/1980-xcon-r1/dec-vax-11-780-computer.jpg` | [维基共享资源](https://upload.wikimedia.org/wikipedia/commons/7/71/LCM_-_DEC_VAX_11-780-5_-_01.jpg) |
| 1980-xcon-r1 | VAX 11/780 CPU 背板 | `resources/images/external/1980-xcon-r1/vax-11-780-cpu-backplane.jpg` | [维基共享资源](https://upload.wikimedia.org/wikipedia/commons/8/89/VAX_11_780_CPU_Backplane.jpg) |
| 1984-cyc | Cyc 项目相关标识 | `resources/images/external/1984-cyc/cyc-related-project-marks.png` | [维基共享资源](https://upload.wikimedia.org/wikipedia/commons/4/40/Cyc_Projects_Logos.png) |
| 1989-cnn | 扬·勒昆肖像 | `resources/images/external/1989-cnn/yann-lecun-portrait.jpg` | [维基共享资源](https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Laura_Chaubard_%26_Yann_Le_Cun_-_2024_%2853814052697%29_%28cropped%29.jpg/330px-Laura_Chaubard_%26_Yann_Le_Cun_-_2024_%2853814052697%29_%28cropped%29.jpg) |
| 1994-chinook | 乔纳森·谢弗肖像 | `resources/images/external/1994-chinook/jonathan-schaeffer-portrait.jpg` | [维基共享资源](https://upload.wikimedia.org/wikipedia/commons/0/0d/Jonathan_Schaeffer.jpg) |
| 1996-dbscan | DBSCAN 密度聚类示意 | `resources/images/external/1996-dbscan/dbscan-density-clustering-diagram.png` | [维基共享资源](https://upload.wikimedia.org/wikipedia/commons/0/05/DBSCAN-density-data.svg) |
| 1996-dbscan | 马丁·埃斯特肖像 | `resources/images/external/1996-dbscan/martin-ester-portrait.jpg` | [维基共享资源](https://upload.wikimedia.org/wikipedia/commons/4/41/SFU_Professor_Martin_Ester_2019.jpg) |
| 2000-spectral-clustering | 谱聚类六节点图示 | `resources/images/external/2000-spectral-clustering/six-node-spectral-clustering-graph.png` | [维基共享资源](https://upload.wikimedia.org/wikipedia/commons/5/5b/6n-graf.svg) |
| 2000-spectral-clustering | 吴恩达肖像 | `resources/images/external/2000-spectral-clustering/andrew-ng-portrait.jpg` | [维基共享资源](https://upload.wikimedia.org/wikipedia/commons/2/20/Andrew_Ng_at_TechCrunch_Disrupt_SF_2017.jpg) |
| 2011-ibm-watson | DeepQA 问答处理流程 | `resources/images/external/2011-ibm-watson/deepqa-question-answering-pipeline.png` | [维基共享资源](https://upload.wikimedia.org/wikipedia/commons/4/41/DeepQA.svg) |
| 2011-ibm-watson | IBM Watson《危险边缘！》演示 | `resources/images/external/2011-ibm-watson/ibm-watson-jeopardy-demonstration.jpg` | [维基共享资源](https://upload.wikimedia.org/wikipedia/commons/3/3f/IBMWatson.jpg) |
| 2020-alphafold | 约翰·江珀肖像 | `resources/images/external/2020-alphafold/john-jumper-portrait.jpg` | [范德堡大学新闻](https://news.vanderbilt.edu/files/65D9B6B4-58E1-4D68-A7F0-BA56D729EB5A_1_201_a-1143x1600.jpeg) |
| ai100-1943-mcculloch-pitts-neuron | 沃尔特·皮茨与黑板 | `resources/images/external/ai100-1943-mcculloch-pitts-neuron/walter-pitts-at-a-blackboard.jpg` | [维基共享资源](https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/1954_Walter_Pitts_and_a_blackboard.jpg/330px-1954_Walter_Pitts_and_a_blackboard.jpg) |
| ai100-1967-knn | 托马斯·科弗肖像 | `resources/images/external/ai100-1967-knn/thomas-cover-portrait.jpg` | [Stanford 信息系统实验室](https://isl.stanford.edu/~cover/) |
| ai100-1969-relu | 约书亚·本吉奥肖像 | `resources/images/external/ai100-1969-relu/yoshua-bengio-portrait.jpg` | [维基共享资源](https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/ICLR_2025_-_Yoshua_Bengio_02.jpg/330px-ICLR_2025_-_Yoshua_Bengio_02.jpg) |
| ai100-1970-ridge | 阿瑟·霍尔与岭回归公式 | `resources/images/external/ai100-1970-ridge/arthur-hoerl-and-the-ridge-regression-formula.jpg` | [特拉华大学 UDaily](https://www.udel.edu/udaily/2021/august/big-data-ridge-regression/_jcr_content/udaily_Image.coreimg.jpeg/1634896375822/ai-ridge-regression-main.jpeg) |
| ai100-1980-neocognitron | 福岛邦彦肖像 | `resources/images/external/ai100-1980-neocognitron/kunihiko-fukushima-portrait.jpg` | [C&C 奖官网](https://www.candc.or.jp/kensyo/2021/images/Dr.KunihikoFukushima.jpg) |
| ai100-1982-som | 泰沃·科霍宁肖像 | `resources/images/external/ai100-1982-som/teuvo-kohonen-portrait.jpg` | [维基共享资源](https://upload.wikimedia.org/wikipedia/commons/8/8e/Teuvo-Kohonen.jpg) |
| ai100-1983-actor-critic | 安德鲁·巴托肖像 | `resources/images/external/ai100-1983-actor-critic/andrew-barto-portrait.jpg` | [马萨诸塞大学阿默斯特分校](https://www.cs.umass.edu/sites/g/files/ijdqth246/files/styles/1_1_l/public/2022-06/barto_andrew_square.jpeg?h=8a0e61cf&itok=eQK4U_MM) |
| ai100-1989-q-learning | 克里斯托弗·沃特金斯肖像 | `resources/images/external/ai100-1989-q-learning/christopher-watkins-portrait.jpg` | [Google Scholar](https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=v8QhiOwAAAAJ&citpid=1) |
| ai100-1997-kernel-pca | 伯恩哈德·舍尔科普夫肖像 | `resources/images/external/ai100-1997-kernel-pca/bernhard-scholkopf-portrait.png` | [维基共享资源](https://upload.wikimedia.org/wikipedia/commons/1/11/Bernhard_Sch%C3%B6lkopf.png) |
| ai100-1999-nmf | H. 塞巴斯蒂安·承肖像 | `resources/images/external/ai100-1999-nmf/h-sebastian-seung-portrait.jpg` | [普林斯顿神经科学研究所](https://pni.princeton.edu/sites/g/files/toruqf321/files/styles/3x4_750w_1000h/public/2023-08/sebastian.jpg?h=ad276dab&itok=TYfICucj) |
| ai100-2000-isomap | 约书亚·特南鲍姆肖像 | `resources/images/external/ai100-2000-isomap/joshua-tenenbaum-portrait.jpg` | [麻省理工学院智能探索中心](https://sqi.mit.edu/system/files/styles/squared_portrait/private/2020-03/Tenenbaum_2019_profile-240.jpg?h=52119415&itok=YgkCjyFY) |
| ai100-2000-lle | 萨姆·罗维斯肖像 | `resources/images/external/ai100-2000-lle/sam-roweis-portrait.jpg` | [纽约大学计算机科学系](https://cs.nyu.edu/home/people/in_memoriam/samroweis/20010411-snowbird-dsc00680-h-thumb.jpg) |
| ai100-2000-neural-language-model | 约书亚·本吉奥肖像 | `resources/images/external/ai100-2000-neural-language-model/yoshua-bengio-portrait.jpg` | [维基共享资源](https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/ICLR_2025_-_Yoshua_Bengio_02.jpg/330px-ICLR_2025_-_Yoshua_Bengio_02.jpg) |
| ai100-2005-gnn | 弗兰科·斯卡塞利肖像 | `resources/images/external/ai100-2005-gnn/franco-scarselli-portrait.jpg` | [锡耶纳大学作者主页](https://www3.diism.unisi.it/~franco/) |
| ai100-2005-hog | 比尔·特里格斯肖像 | `resources/images/external/ai100-2005-hog/bill-triggs-portrait.jpg` | [INRIA/LEAR 作者主页](https://lear.inrialpes.fr/people/triggs/) |
| ai100-2006-surf | 赫伯特·贝肖像 | `resources/images/external/ai100-2006-surf/herbert-bay-portrait.png` | [赫伯特·贝个人网站](https://herbertbay.com/assets/img/Herbert%20Bay-GM.png) |
| ai100-2013-variational-autoencoder | 迪德里克·金马肖像 | `resources/images/external/ai100-2013-variational-autoencoder/diederik-kingma-portrait.jpg` | [迪德里克·金马个人网站](https://dpkingma.com/files/portrait.jpg) |
| ai100-2014-conditional-gan | Conditional GAN 论文首页 | `resources/images/external/ai100-2014-conditional-gan/conditional-gan-paper-first-page.jpg` | [arXiv](https://arxiv.org/abs/1411.1784) |
| ai100-2014-glove | 杰弗里·彭宁顿肖像 | `resources/images/external/ai100-2014-glove/jeffrey-pennington-portrait.jpg` | [Stanford NLP](https://nlp.stanford.edu/~jpennin/images/photo.jpeg) |
| ai100-2014-ms-coco | 林宗毅肖像 | `resources/images/external/ai100-2014-ms-coco/tsung-yi-lin-portrait.jpg` | [林宗毅个人网站](https://tsungyilin.info/images/tsungyi.jpeg) |
| ai100-2015-ddpg | 蒂莫西·利利克拉普肖像 | `resources/images/external/ai100-2015-ddpg/timothy-lillicrap-portrait.png` | [Stanford Neurosciences](https://neuroscience.stanford.edu/sites/default/files/timothy_lillicrap_1.png) |
| ai100-2015-deep-compression | 韩松肖像 | `resources/images/external/ai100-2015-deep-compression/song-han-portrait.jpg` | [韩松人物资料来源 CDN](https://cdn.prod.website-files.com/64f4d663be17b6544a586bac/6514db3bc943fa1c599d89d5_songhan.jpeg) |
| ai100-2015-diffusion-model | 雅沙·索尔-迪克斯坦肖像 | `resources/images/external/ai100-2015-diffusion-model/jascha-sohl-dickstein-portrait.png` | [雅沙·索尔-迪克斯坦人物资料来源](https://images.squarespace-cdn.com/content/v1/53d19eeae4b0d2c0c0eb410e/1414361996432-837PS73PS2YIG69T0A9Q/Jascha_profile.png) |
| ai100-2016-gcn | 托马斯·基普夫肖像 | `resources/images/external/ai100-2016-gcn/thomas-kipf-portrait.jpg` | [托马斯·基普夫个人网站](https://tkipf.github.io/images/photo.jpg) |
| ai100-2016-nas | 巴雷特·佐夫肖像 | `resources/images/external/ai100-2016-nas/barret-zoph-portrait.jpg` | [巴雷特·佐夫个人网站](https://barretzoph.github.io/images/headshot.jpg) |
| ai100-2017-cyclegan | 朱俊彦肖像 | `resources/images/external/ai100-2017-cyclegan/jun-yan-zhu-portrait.jpg` | [卡内基梅隆大学作者主页](https://www.cs.cmu.edu/~junyanz/imgs/portrait3_lr.jpg) |
| ai100-2017-gat | 佩塔尔·韦利奇科维奇肖像 | `resources/images/external/ai100-2017-gat/petar-velickovic-portrait.jpg` | [Google Scholar](https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=kcTK_FAAAAAJ&citpid=1) |
| ai100-2017-pix2pix | 菲利普·伊索拉肖像 | `resources/images/external/ai100-2017-pix2pix/phillip-isola-portrait.jpg` | [麻省理工学院作者主页](https://web.mit.edu/phillipi/www/images/photo_of_me_korea.jpeg) |
| ai100-2017-wasserstein-gan | 莱昂·博图肖像 | `resources/images/external/ai100-2017-wasserstein-gan/leon-bottou-portrait.jpg` | [莱昂·博图个人网站](https://leon.bottou.org/_media/bottou_75.jpg) |
| ai100-2019-stylegan | 特罗·卡拉斯肖像 | `resources/images/external/ai100-2019-stylegan/tero-karras-portrait.png` | [NVIDIA Research](https://research.nvidia.com/sites/default/files/person/tero-karras.png) |
| ai100-2020-vit | 阿列克谢·多索维茨基肖像 | `resources/images/external/ai100-2020-vit/alexey-dosovitskiy-portrait.png` | [ELLIS 慕尼黑单位](https://www.eml-munich.de/team/alexey-dosovitskiy.png) |
| ai100-2021-dalle | 阿迪蒂亚·拉梅什肖像 | `resources/images/external/ai100-2021-dalle/aditya-ramesh-portrait.png` | [北京智源人工智能研究院](https://simg.baai.ac.cn/hubview/b0fdc3694e0d34821c1a35fbe494cb9c.png) |
| ai100-2021-swin-transformer | 刘泽肖像 | `resources/images/external/ai100-2021-swin-transformer/ze-liu-portrait.jpg` | [刘泽个人网站](https://zeliu98.github.io/images/zeliu.jpg) |
| ai100-2022-stable-diffusion | 罗宾·罗姆巴赫肖像 | `resources/images/external/ai100-2022-stable-diffusion/robin-rombach-portrait.jpg` | [Latent Labs](https://www.latentlabs.com/wp-content/uploads/2025/02/Robin-update-5.jpg) |
| ai100-2023-segment-anything | 亚历山大·基里洛夫肖像 | `resources/images/external/ai100-2023-segment-anything/alexander-kirillov-portrait.jpg` | [亚历山大·基里洛夫个人网站](https://alexander-kirillov.github.io/images/alexander_kirillov.jpg) |
