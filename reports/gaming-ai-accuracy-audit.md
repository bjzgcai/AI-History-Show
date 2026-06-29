# Gaming AI Accuracy Audit

Generated from `milestones-data.js` for storyline `gaming-ai`.

This report is an evidence-audit worklist. It does not certify historical accuracy by itself. Manual review is required only for claims marked `needs-manual-source-review`; lower-priority risk claims are kept for traceability but do not need immediate rewriting.

## Summary

- Milestones: 13
- Claims extracted: 370
- Milestones with issues: 0
- Risk-word claims: 64
- Weak/manual-review claims: 29

## Milestone Checklist

| ID | Title | Sources | Primary | Claims | Risk Claims | Weak Claims | Issues |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| milestone-1951-strachey-draughts | Christopher Strachey's Draughts | 4 | 1 | 26 | 4 | 3 | ready for source review |
| milestone-1988-td-update | Temporal-Difference Update | 3 | 2 | 28 | 4 | 2 | ready for source review |
| milestone-1994-chinook | Chinook | 4 | 2 | 26 | 6 | 2 | ready for source review |
| milestone-1997-deep-blue | Deep Blue | 4 | 1 | 28 | 6 | 4 | ready for source review |
| milestone-1997-logistello | Logistello: Learning Evaluation for Othello | 4 | 3 | 28 | 7 | 5 | ready for source review |
| milestone-2000s-alphacat | Chinese Chess Engines and AlphaCat | 3 | 2 | 28 | 2 | 0 | ready for source review |
| milestone-2013-dqn | Deep Q Network | 3 | 3 | 30 | 3 | 1 | ready for source review |
| milestone-2016-alphago | AlphaGo | 3 | 1 | 32 | 3 | 0 | ready for source review |
| milestone-2017-alphazero | AlphaZero | 3 | 2 | 28 | 7 | 3 | ready for source review |
| milestone-2017-libratus | Libratus | 3 | 3 | 28 | 8 | 4 | ready for source review |
| milestone-2019-muzero | MuZero | 3 | 2 | 30 | 5 | 2 | ready for source review |
| milestone-2019-pluribus | Pluribus | 3 | 2 | 28 | 3 | 0 | ready for source review |
| milestone-2019-suphx | Suphx: Mahjong with Deep Reinforcement Learning | 3 | 3 | 30 | 6 | 3 | ready for source review |

## Review Protocol

1. Open the primary source candidate first and verify year, title, authors, venue, and core contribution.
2. Manually review only claims marked `needs-manual-source-review`, prioritizing absolute, first/only, proof/solved, superlative, strong game-result, and strong legacy wording.
3. Low-priority risk claims do not need rewriting unless a reviewer spots an unsupported source chain.
4. Re-run `npm run generate && npm run audit:gaming-accuracy` after edits.

## Claim Worklist

### milestone-1951-strachey-draughts - Christopher Strachey's Draughts

Sources:
- [Logical or non-mathematical programmes](https://dl.acm.org/doi/10.1145/1455270.1455277) (Paper primary-candidate)
- [Computer Pioneers - Christopher Strachey](https://history.computer.org/pioneers/strachey.html) (Biography)
- [Strachey draughts program screenshot](https://commons.wikimedia.org/wiki/File:Christopher_Strachey%27s_Draughts_Program.png) (Image source)
- [Checkers board photo](https://commons.wikimedia.org/wiki/File:CheckersStandard.jpg) (Image source)

| Field | Locale | Risk | Manual Review | Claim | Status |
| --- | --- | --- | --- | --- | --- |
| year-title | en | no | no | 1951-1952: Christopher Strachey's Draughts | structural-only |
| year-title | zh | no | no | 1951-1952: 克里斯托弗·斯特雷奇 的跳棋程序 | structural-only |
| location | en | no | no | National Physical Laboratory, Teddington, United Kingdom | structural-only |
| location | zh | no | no | 英国国家物理实验室，英国特丁顿 | structural-only |
| figure | en | no | no | Christopher Strachey - Developer of the early draughts program | structural-only |
| figure | zh | no | no | 克里斯托弗·斯特雷奇 - 早期跳棋程序开发者 | structural-only |
| description | en | no | no | Christopher Strachey's draughts program showed that stored-program computers could do more than numerical calculation. | structural-only |
| description | en | yes | absolute-first-or-only wording; non-legacy risk claim | It represented board positions, generated moves, evaluated alternatives, and attempted strategic play on early British computers, making game playing one of AI's first public testbeds. | needs-manual-source-review |
| description | zh | no | no | 克里斯托弗·斯特雷奇 的跳棋程序证明存储程序计算机不只会做数值计算。 | structural-only |
| description | zh | yes | absolute-first-or-only wording; non-legacy risk claim | 它表示棋盘局面、生成走法、评估备选方案，并在早期英国计算机上尝试策略性对弈，使游戏成为 AI 最早的公开试验场之一。 | needs-manual-source-review |
| commentary:Historical Background | en | no | no | In the early 1950s, running a non-numerical game program stretched tiny memories and fragile programming tools. | structural-only |
| commentary:Historical Background | en | no | no | Draughts made those constraints concrete because the machine had to represent a board, test legal moves, and choose among alternatives. | structural-only |
| commentary:Historical Background | zh | no | no | 在 1950 年代早期，运行一个非数值游戏程序会把极小内存和脆弱编程工具推到极限。 | structural-only |
| commentary:Historical Background | zh | no | no | 跳棋把这些限制具体化了，因为机器必须表示棋盘、检查合法走法并在备选方案中做选择。 | structural-only |
| commentary:Core Idea | en | no | no | The program encoded legal moves and board evaluation so the machine could choose actions rather than merely replay a script. | structural-only |
| commentary:Core Idea | en | no | no | That pattern made search and evaluation visible as computational ingredients of intelligent play. | structural-only |
| commentary:Core Idea | zh | no | no | 该程序编码合法走法和棋盘评估，使机器能够选择行动，而不是只回放脚本。 | structural-only |
| commentary:Core Idea | zh | no | no | 这种模式让搜索与评估成为智能对弈中可见的计算要素。 | structural-only |
| commentary:Long-Term Legacy | en | yes | proof/solved wording | Experts generally treat Strachey's draughts program as an early proof that stored-program computers could attempt non-numerical play and choice. | needs-manual-source-review |
| commentary:Long-Term Legacy | en | no | no | Its long-term legacy is helping establish board games as controlled environments for search, evaluation, and machine-intelligence demonstrations. | structural-only |
| commentary:Long-Term Legacy | zh | yes | no | 专家通常把斯特雷奇的跳棋程序视为早期证据，说明存储程序计算机可以尝试非数值对弈和选择。 | low-priority-risk |
| commentary:Long-Term Legacy | zh | no | no | 它的长期影响在于帮助把棋类游戏确立为研究搜索、评估和机器智能演示的受控环境。 | structural-only |
| quote-work | en | no | no | Logical or non-mathematical programmes | structural-only |
| quote-authors | en | no | no | Christopher Strachey | structural-only |
| quote-work | zh | no | no | 逻辑或非数学程序 | structural-only |
| quote-authors | zh | no | no | 克里斯托弗·斯特雷奇 | structural-only |

### milestone-1988-td-update - Temporal-Difference Update

Sources:
- [Learning to Predict by the Methods of Temporal Differences](https://doi.org/10.1007/BF00115009) (Paper primary-candidate)
- [Richard Sutton homepage](http://incompleteideas.net/) (Homepage)
- [ACM 2024 Turing Award announcement](https://awards.acm.org/about/2024-turing) (Award primary-candidate)

| Field | Locale | Risk | Manual Review | Claim | Status |
| --- | --- | --- | --- | --- | --- |
| year-title | en | no | no | 1988: Temporal-Difference Update | structural-only |
| year-title | zh | no | no | 1988: 时序差分更新 | structural-only |
| location | en | no | no | GTE Laboratories / University of Massachusetts lineage, United States and Canada | structural-only |
| location | zh | no | no | GTE 实验室 / 麻省大学学术谱系，美国与加拿大 | structural-only |
| figure | en | no | no | Richard Sutton - Author of temporal-difference learning | structural-only |
| figure | zh | no | no | 理查德·萨顿 - 时序差分学习提出者 | structural-only |
| description | en | no | no | Temporal-difference learning gave reinforcement learning a compact way to learn predictions from experience. | structural-only |
| description | en | no | no | Instead of waiting for a final outcome, TD methods update value estimates using the next reward and the next prediction. | structural-only |
| description | en | no | no | This bootstrapping idea sits behind many later algorithms, including TD-Gammon, Q-learning, and actor-critic methods. | structural-only |
| description | zh | no | no | 时序差分学习为强化学习提供了一种从经验中学习预测的紧凑方法。 | structural-only |
| description | zh | no | no | TD 方法不必等到最终结果，而是用下一步奖励和下一步预测来更新价值估计。 | structural-only |
| description | zh | no | no | 这种自举思想支撑了 TD-Gammon、Q-learning 和 actor-critic 等后续算法。 | structural-only |
| commentary:Historical Background | en | no | no | Learning from delayed rewards required a way to assign credit before the entire episode ended. | structural-only |
| commentary:Historical Background | en | yes | game result or superhuman-performance wording; non-legacy risk claim | Board-game learning made that problem especially clear because a useful move can happen long before the final win, loss, or draw. | needs-manual-source-review |
| commentary:Historical Background | zh | no | no | 从延迟奖励中学习需要一种在整个回合结束前分配信用的方法。 | structural-only |
| commentary:Historical Background | zh | no | no | 棋类学习让这个问题尤其清楚，因为有用的走法可能远早于最终胜负或和棋结果。 | structural-only |
| commentary:Core Idea | en | no | no | TD compares the current prediction with a reward plus the next prediction, then nudges the current value toward that target. | structural-only |
| commentary:Core Idea | en | yes | proof/solved wording; non-legacy risk claim | This bootstrapping lets an agent improve from partial trajectories instead of waiting for complete solved outcomes. | needs-manual-source-review |
| commentary:Core Idea | zh | no | no | TD 比较当前预测与“奖励加下一步预测”，再把当前价值向该目标推进。 | structural-only |
| commentary:Core Idea | zh | no | no | 这种自举让智能体可以从局部轨迹中改进，而不必等待完整且已求解的最终结果。 | structural-only |
| commentary:Long-Term Legacy | en | yes | no | Experts generally treat temporal-difference learning as a cornerstone of reinforcement learning. | low-priority-risk |
| commentary:Long-Term Legacy | en | no | no | Its long-term legacy is the bootstrapping idea that value estimates can learn from later predictions, supporting Q-learning, actor-critic methods, and modern value-based control. | structural-only |
| commentary:Long-Term Legacy | zh | yes | no | 专家通常把时序差分学习视为强化学习的基石。 | low-priority-risk |
| commentary:Long-Term Legacy | zh | no | no | 它的长期影响在于提出价值估计可以从后续预测中自举学习，并支撑了 Q-learning、actor-critic 方法和现代基于价值的控制。 | structural-only |
| quote-work | en | no | no | Learning to predict by temporal differences | structural-only |
| quote-authors | en | no | no | Richard Sutton | structural-only |
| quote-work | zh | no | no | 通过时序差分学习预测 | structural-only |
| quote-authors | zh | no | no | 理查德·萨顿 | structural-only |

### milestone-1994-chinook - Chinook

Sources:
- [Chinook project home](https://webdocs.cs.ualberta.ca/~chinook/index.php) (Official page primary-candidate)
- [Checkers Is Solved](https://www.science.org/doi/10.1126/science.1144079) (Paper primary-candidate)
- [Chinook publications](https://webdocs.cs.ualberta.ca/~chinook/publications/) (Publications)
- [Jonathan Schaeffer portrait](https://commons.wikimedia.org/wiki/File:Jonathan_Schaeffer.jpg) (Image source)

| Field | Locale | Risk | Manual Review | Claim | Status |
| --- | --- | --- | --- | --- | --- |
| year-title | en | no | no | 1989-2007: Chinook | structural-only |
| year-title | zh | no | no | 1989-2007: Chinook 跳棋程序 | structural-only |
| location | en | no | no | University of Alberta, Alberta, Canada | structural-only |
| location | zh | no | no | 阿尔伯塔大学，加拿大阿尔伯塔省 | structural-only |
| figure | en | no | no | Jonathan Schaeffer - Leader of the Chinook team | structural-only |
| figure | zh | no | no | 乔纳森·谢弗 - Chinook 团队负责人 | structural-only |
| description | en | no | no | Chinook pushed game AI from competitive play toward mathematical solution. | structural-only |
| description | en | no | no | The University of Alberta team combined opening books, deep alpha-beta search, expert evaluation, and enormous endgame databases, eventually proving that perfect play in checkers leads to a draw. | structural-only |
| description | zh | no | no | Chinook 把游戏 AI 从竞技对弈推进到数学求解。 | structural-only |
| description | zh | yes | proof/solved wording; non-legacy risk claim | 阿尔伯塔大学团队结合开局库、深层 alpha-beta 搜索、专家评估和庞大残局数据库，最终证明跳棋在完美对弈下结果为和棋。 | needs-manual-source-review |
| commentary:Historical Background | en | no | no | Checkers was complex enough to challenge search algorithms but structured enough for decades of endgame database construction. | structural-only |
| commentary:Historical Background | en | no | no | That made Chinook a useful bridge between competitive game programs and mathematically verified game solving. | structural-only |
| commentary:Historical Background | zh | no | no | 跳棋足够复杂，可以挑战搜索算法；同时结构足够明确，适合长期构建残局数据库。 | structural-only |
| commentary:Historical Background | zh | no | no | 这使 Chinook 成为竞技游戏程序和数学化游戏求解之间的桥梁。 | structural-only |
| commentary:Core Idea | en | yes | proof/solved wording; non-legacy risk claim | Chinook paired forward search with solved endgame tables, letting the program connect current choices to proven late-game outcomes. | needs-manual-source-review |
| commentary:Core Idea | en | no | no | The tablebases turned many late positions from heuristic estimates into exact lookups, reducing uncertainty near the end of search. | structural-only |
| commentary:Core Idea | zh | no | no | Chinook 将前向搜索与已求解残局表结合，使程序能把当前选择连接到被证明的终局结果。 | structural-only |
| commentary:Core Idea | zh | no | no | 残局表把许多后期局面从启发式估计变成精确查询，降低了搜索接近终局时的不确定性。 | structural-only |
| commentary:Long-Term Legacy | en | yes | no | Experts generally treat Chinook as a landmark in game-solving research and high-performance search. | low-priority-risk |
| commentary:Long-Term Legacy | en | no | no | Its long-term legacy is showing how expert evaluation, alpha-beta search, opening knowledge, and endgame databases can combine to approach perfect play. | structural-only |
| commentary:Long-Term Legacy | zh | yes | no | 专家通常把 Chinook 视为游戏求解研究和高性能搜索的里程碑。 | low-priority-risk |
| commentary:Long-Term Legacy | zh | yes | no | 它的长期影响在于展示专家评估、alpha-beta 搜索、开局知识和残局数据库如何结合并逼近完美对弈。 | low-priority-risk |
| quote-work | en | yes | no | Checkers Is Solved | low-priority-risk |
| quote-authors | en | no | no | Jonathan Schaeffer et al. | structural-only |
| quote-work | zh | no | no | 跳棋已被求解 | structural-only |
| quote-authors | zh | no | no | 乔纳森·谢弗等 | structural-only |

### milestone-1997-deep-blue - Deep Blue

Sources:
- [Deep Blue journal article](https://doi.org/10.1016/S0004-3702(01)00129-1) (Paper primary-candidate)
- [Murray Campbell, IBM Research](https://research.ibm.com/people/murray-campbell) (Profile)
- [Mastering the Game, Computer History Museum](https://www.computerhistory.org/chess/) (Museum)
- [IBM100: Deep Blue](https://www.ibm.com/history/deep-blue) (History)

| Field | Locale | Risk | Manual Review | Claim | Status |
| --- | --- | --- | --- | --- | --- |
| year-title | en | no | no | 1997: Deep Blue | structural-only |
| year-title | zh | no | no | 1997: 深蓝 | structural-only |
| location | en | no | no | IBM Research, New York, United States | structural-only |
| location | zh | no | no | IBM 研究院，美国纽约州 | structural-only |
| figure | en | no | no | Murray Campbell - Deep Blue team member | structural-only |
| figure | zh | no | no | 默里·坎贝尔 - 深蓝 团队成员 | structural-only |
| description | en | yes | absolute-first-or-only wording; non-legacy risk claim | Deep Blue became the first computer system to defeat the reigning world chess champion in a regulation match. | needs-manual-source-review |
| description | en | no | no | The achievement mixed brute-force alpha-beta search, chess-specific evaluation, opening/endgame knowledge, and custom VLSI hardware. | structural-only |
| description | en | yes | game result or superhuman-performance wording; non-legacy risk claim | It marked a public turning point: AI could beat elite human expertise in a highly symbolic game. | needs-manual-source-review |
| description | zh | yes | absolute-first-or-only wording; game result or superhuman-performance wording; non-legacy risk claim | 深蓝 成为第一个在正式比赛中击败卫冕世界冠军的计算机系统。 | needs-manual-source-review |
| description | zh | no | no | 它结合了强力 alpha-beta 搜索、国际象棋专用评估、开局/残局知识和定制 VLSI 硬件。 | structural-only |
| description | zh | yes | game result or superhuman-performance wording; non-legacy risk claim | 这是一个公众转折点：AI 可以在高度符号化的游戏中击败顶尖人类专家。 | needs-manual-source-review |
| commentary:Historical Background | en | no | no | Computer chess had advanced for decades through better search, evaluation, and hardware. | structural-only |
| commentary:Historical Background | en | no | no | Deep Blue made that lineage visible on a global stage. | structural-only |
| commentary:Historical Background | zh | no | no | 计算机国际象棋几十年来依靠搜索、评估和硬件进步。 | structural-only |
| commentary:Historical Background | zh | no | no | 深蓝 把这条路线带到全球舞台。 | structural-only |
| commentary:Core Idea | en | no | no | The machine searched many candidate moves deeply, pruning losing branches and scoring positions with chess knowledge. | structural-only |
| commentary:Core Idea | en | no | no | Custom hardware made that search practical at match speed, while evaluation knowledge kept the tree focused on chess-relevant lines. | structural-only |
| commentary:Core Idea | zh | no | no | 机器深入搜索候选走法，剪掉劣势分支，并用棋类知识给局面打分。 | structural-only |
| commentary:Core Idea | zh | no | no | 定制硬件让这种搜索能以比赛速度运行，而评估知识则让搜索树集中在与棋局有关的线路上。 | structural-only |
| commentary:Long-Term Legacy | en | yes | no | Experts generally treat Deep Blue as a landmark in specialized search, evaluation, and high-performance game AI. | low-priority-risk |
| commentary:Long-Term Legacy | en | no | no | Its long-term legacy is shaping public expectations for AI milestones and serving as a reference point for later game systems such as AlphaGo. | structural-only |
| commentary:Long-Term Legacy | zh | yes | no | 专家通常把深蓝视为专用搜索、局面评估和高性能游戏 AI 的标志性成果。 | low-priority-risk |
| commentary:Long-Term Legacy | zh | no | no | 它的长期影响在于塑造了公众对 AI 里程碑的期待，并成为 AlphaGo 等后续游戏系统的参照点。 | structural-only |
| quote-work | en | no | no | Deep Blue journal article | structural-only |
| quote-authors | en | no | no | Murray Campbell | structural-only |
| quote-work | zh | no | no | 深蓝期刊论文 | structural-only |
| quote-authors | zh | no | no | 默里·坎贝尔 | structural-only |

### milestone-1997-logistello - Logistello: Learning Evaluation for Othello

Sources:
- [Logistello homepage](https://skatgame.net/mburo/log.html) (Official page primary-candidate)
- [Murakami vs. Logistello](https://skatgame.net/mburo/event.html) (Match report primary-candidate)
- [Statistical Feature Combination](https://arxiv.org/abs/cs/9512106) (Paper primary-candidate)
- [Michael Buro publications](https://skatgame.net/mburo/publications.html) (Publication list)

| Field | Locale | Risk | Manual Review | Claim | Status |
| --- | --- | --- | --- | --- | --- |
| year-title | en | no | no | 1997: Logistello: Learning Evaluation for Othello | structural-only |
| year-title | zh | no | no | 1997: Logistello：黑白棋评估函数学习 | structural-only |
| location | en | no | no | NEC Research Institute, NJ, United States | structural-only |
| location | zh | no | no | NEC 研究院，美国新泽西州 | structural-only |
| figure | en | no | no | Michael Buro - Creator of Logistello | structural-only |
| figure | zh | no | no | 迈克尔·布罗 - Logistello 创建者 | structural-only |
| figure | en | no | no | Takeshi Murakami - World Othello champion in the 1997 match | structural-only |
| figure | zh | yes | game result or superhuman-performance wording; non-legacy risk claim | 村上健 - 1997 年对局中的黑白棋世界冠军 | needs-manual-source-review |
| description | en | yes | game result or superhuman-performance wording; non-legacy risk claim | Logistello defeated world champion Takeshi Murakami 6-0 in a 1997 Othello match. | needs-manual-source-review |
| description | en | yes | game result or superhuman-performance wording; non-legacy risk claim | Michael Buro combined selective game-tree search, pattern-based evaluation, statistical feature learning, opening-book learning, and strong endgame solving, showing that learned evaluation could outperform hand-crafted heuristics in a compact board game. | needs-manual-source-review |
| description | zh | yes | game result or superhuman-performance wording; non-legacy risk claim | Logistello 在 1997 年黑白棋对局中以 6 比 0 击败世界冠军村上健。 | needs-manual-source-review |
| description | zh | yes | game result or superhuman-performance wording; non-legacy risk claim | Michael Buro 将选择性博弈树搜索、基于棋盘模式的评估、统计特征学习、开局库学习和强残局求解结合起来，说明学习得到的评估函数可以在紧凑棋盘游戏中超过手工启发式规则。 | needs-manual-source-review |
| commentary:Historical Background | en | no | no | Othello was small enough for deep search but rich enough that shallow material counting failed. | structural-only |
| commentary:Historical Background | en | no | no | By the 1990s, the key bottleneck was not just speed but how accurately a program could evaluate unstable midgame positions. | structural-only |
| commentary:Historical Background | zh | no | no | 黑白棋足够紧凑，可以进行深层搜索；但它又足够复杂，不能只靠浅层子数统计。 | structural-only |
| commentary:Historical Background | zh | no | no | 到 1990 年代，关键瓶颈不只是速度，而是程序能否准确评估不稳定的中盘局面。 | structural-only |
| commentary:Core Idea | en | no | no | Logistello treated evaluation as a statistical learning problem over board patterns and game phases. | structural-only |
| commentary:Core Idea | en | no | no | Search still mattered, but the learned evaluator gave search a sharper sense of which positions were strategically promising. | structural-only |
| commentary:Core Idea | zh | no | no | Logistello 把评估函数看成一个跨棋盘模式和阶段的统计学习问题。 | structural-only |
| commentary:Core Idea | zh | no | no | 搜索仍然重要，但学习到的评估器让搜索更清楚哪些局面具有战略潜力。 | structural-only |
| commentary:Long-Term Legacy | en | yes | no | Experts generally treat Logistello as a bridge between classical game-tree search and machine-learned evaluation functions. | low-priority-risk |
| commentary:Long-Term Legacy | en | no | no | Its legacy is the lesson that search quality can change dramatically when evaluation parameters are learned from large game-position corpora. | structural-only |
| commentary:Long-Term Legacy | zh | yes | no | 专家通常把 Logistello 视为经典博弈树搜索与机器学习评估函数之间的桥梁。 | low-priority-risk |
| commentary:Long-Term Legacy | zh | no | no | 它的长期影响在于说明：当评估参数来自大规模棋局语料学习时，搜索质量会发生显著变化。 | structural-only |
| quote-work | en | no | no | The Othello Match of the Year | structural-only |
| quote-authors | en | no | no | Michael Buro / NEC Research Institute | structural-only |
| quote-work | zh | no | no | 年度黑白棋对局 | structural-only |
| quote-authors | zh | no | no | 迈克尔·布罗 / NEC 研究院 | structural-only |

### milestone-2000s-alphacat - Chinese Chess Engines and AlphaCat

Sources:
- [ICGA Chinese Chess page](https://www.game-ai-forum.org/icga-tournaments/game.php?id=13) (Tournament archive primary-candidate)
- [Comparison Training for Computer Chinese Chess](https://arxiv.org/abs/1801.07411) (Paper primary-candidate)
- [Xiangqi overview](https://en.wikipedia.org/wiki/Xiangqi) (Game rules / background)

| Field | Locale | Risk | Manual Review | Claim | Status |
| --- | --- | --- | --- | --- | --- |
| year-title | en | no | no | 2000s: Chinese Chess Engines and AlphaCat | structural-only |
| year-title | zh | no | no | 2000s: 中国象棋引擎与 AlphaCat | structural-only |
| location | en | no | no | Computer Olympiad Chinese Chess track, China and Taiwan | structural-only |
| location | zh | no | no | 计算机奥林匹克中国象棋项目，中国大陆与中国台湾 | structural-only |
| figure | en | no | no | Xiangqi engine teams - Programmers behind ICGA Chinese Chess entrants | structural-only |
| figure | zh | no | no | 中国象棋引擎团队 - ICGA 中国象棋项目参赛程序背后的开发者 | structural-only |
| figure | en | no | no | AlphaCat - Representative system requested by the issue | structural-only |
| figure | zh | no | no | AlphaCat - issue 指定的代表性系统 | structural-only |
| description | en | no | no | Chinese chess made game AI confront asymmetric pieces, cannons, palaces, rivers, repetition rules, and very tactical attacking play. | structural-only |
| description | en | no | no | The issue-requested AlphaCat entry is represented here as part of the broader 2000s xiangqi-engine wave, where minimax search, bitboards or compact board encodings, opening knowledge, and tuned evaluation functions became the practical path to strong play. | structural-only |
| description | zh | no | no | 中国象棋让游戏 AI 面对非对称兵种、炮、九宫、楚河汉界、长将长捉规则以及高度战术化的攻杀。 | structural-only |
| description | zh | no | no | issue 中要求的 AlphaCat 在这里作为 2000 年代象棋引擎浪潮的一部分呈现：极大极小搜索、位棋盘或紧凑棋盘编码、开局知识和调校评估函数，是通向强棋力的主要实践路线。 | structural-only |
| commentary:Historical Background | en | no | no | Xiangqi is close enough to chess that search and evaluation are natural starting points. | structural-only |
| commentary:Historical Background | en | no | no | It is also different enough that cannon captures, palace restrictions, river effects, and repetition rules force engine authors to redesign board representation and tactical evaluation. | structural-only |
| commentary:Historical Background | zh | no | no | 中国象棋与国际象棋足够接近，因此搜索和评估是自然起点。 | structural-only |
| commentary:Historical Background | zh | no | no | 它又足够不同：炮的隔子打、九宫限制、过河规则和长打规则，迫使引擎作者重新设计棋盘表示和战术评估。 | structural-only |
| commentary:Core Idea | en | no | no | The practical route was not one universal trick but a stack of domain-aware engineering. | structural-only |
| commentary:Core Idea | en | no | no | Fast move generation, aggressive alpha-beta pruning, opening knowledge, and tuned evaluation matrices worked together to survive a highly tactical search space. | structural-only |
| commentary:Core Idea | zh | no | no | 实用路线不是一个万能技巧，而是一组面向领域的工程组合。 | structural-only |
| commentary:Core Idea | zh | no | no | 快速走法生成、激进 alpha-beta 剪枝、开局知识和调校后的评估矩阵共同作用，才能应对高度战术化的搜索空间。 | structural-only |
| commentary:Long-Term Legacy | en | yes | no | Experts generally treat strong xiangqi engines as evidence that classical search remains powerful when it is deeply adapted to a game. | low-priority-risk |
| commentary:Long-Term Legacy | en | no | no | This line also foreshadowed later learned-evaluation work, where handcrafted piece-square matrices were gradually complemented by automatically tuned weights. | structural-only |
| commentary:Long-Term Legacy | zh | yes | no | 专家通常把强中国象棋引擎视为证据：只要深度适配具体游戏，经典搜索仍然非常有力。 | low-priority-risk |
| commentary:Long-Term Legacy | zh | no | no | 这条路线也预示了后来的学习型评估工作，手工兵种位置表逐步被自动调校权重补充。 | structural-only |
| quote-work | en | no | no | ICGA Tournaments: Chinese Chess | structural-only |
| quote-authors | en | no | no | International Computer Games Association tournament archive | structural-only |
| quote-work | zh | no | no | ICGA 赛事：中国象棋 | structural-only |
| quote-authors | zh | no | no | 国际计算机博弈协会赛事档案 | structural-only |

### milestone-2013-dqn - Deep Q Network

Sources:
- [Playing Atari with Deep Reinforcement Learning](https://arxiv.org/abs/1312.5602) (Preprint primary-candidate)
- [Human-level control through deep reinforcement learning](https://www.nature.com/articles/nature14236) (Paper primary-candidate)
- [Google DeepMind: Deep Reinforcement Learning](https://deepmind.google/discover/blog/deep-reinforcement-learning/) (Project note primary-candidate)

| Field | Locale | Risk | Manual Review | Claim | Status |
| --- | --- | --- | --- | --- | --- |
| year-title | en | no | no | 2013: Deep Q Network | structural-only |
| year-title | zh | no | no | 2013: 深度 Q 网络 | structural-only |
| location | en | no | no | DeepMind, London, United Kingdom | structural-only |
| location | zh | no | no | DeepMind，英国伦敦 | structural-only |
| figure | en | yes | absolute-first-or-only wording; non-legacy risk claim | Volodymyr Mnih - First author of DQN work | needs-manual-source-review |
| figure | zh | no | no | 沃洛迪米尔·姆尼赫 - DQN 工作第一作者 | structural-only |
| figure | en | no | no | David Silver - DeepMind reinforcement learning researcher | structural-only |
| figure | zh | no | no | 戴维·席尔瓦 - DeepMind 强化学习研究者 | structural-only |
| description | en | no | no | DQN joined deep neural networks with reinforcement learning and made Atari a landmark benchmark. | structural-only |
| description | en | no | no | The agent learned values directly from pixels using experience replay and a target network, reaching strong performance across multiple games. | structural-only |
| description | en | no | no | It became a central bridge from classic RL to deep RL. | structural-only |
| description | zh | no | no | DQN 把深度神经网络与强化学习结合起来，让 Atari 成为标志性基准。 | structural-only |
| description | zh | no | no | 智能体用经验回放和目标网络直接从像素学习价值函数，在多款游戏上取得强表现。 | structural-only |
| description | zh | no | no | 它成为经典强化学习走向深度强化学习的关键桥梁。 | structural-only |
| commentary:Historical Background | en | no | no | Classic reinforcement learning had strong theory, but scaling from raw pixels to control remained difficult. | structural-only |
| commentary:Historical Background | en | no | no | DQN made that scaling visible. | structural-only |
| commentary:Historical Background | zh | no | no | 经典强化学习有坚实理论，但从原始像素扩展到控制任务仍然困难。 | structural-only |
| commentary:Historical Background | zh | no | no | DQN 让这种扩展变得可见。 | structural-only |
| commentary:Core Idea | en | no | no | Experience replay breaks correlations in recent experience, while a target network stabilizes value updates. | structural-only |
| commentary:Core Idea | en | no | no | Together with convolutional perception, these tricks let one agent learn action values directly from game pixels. | structural-only |
| commentary:Core Idea | zh | no | no | 经验回放打破近期经验的相关性，目标网络则稳定价值更新。 | structural-only |
| commentary:Core Idea | zh | no | no | 结合卷积感知后，这些技巧让同一个智能体可以直接从游戏像素学习动作价值。 | structural-only |
| commentary:Long-Term Legacy | en | yes | no | Experts generally treat DQN as the breakthrough that made deep reinforcement learning visible and concrete. | low-priority-risk |
| commentary:Long-Term Legacy | en | no | no | Its long-term legacy is the neural loop connecting perception, action, reward, replay, and value learning, despite ongoing sample-efficiency and stability challenges. | structural-only |
| commentary:Long-Term Legacy | zh | yes | no | 专家通常把 DQN 视为让深度强化学习变得可见且具体的突破。 | low-priority-risk |
| commentary:Long-Term Legacy | zh | no | no | 它的长期影响在于把感知、行动、奖励、经验回放和价值学习接成神经循环，尽管样本效率和稳定性问题仍存在。 | structural-only |
| quote-work | en | no | no | Playing Atari with Deep Reinforcement Learning | structural-only |
| quote-authors | en | no | no | Volodymyr Mnih et al., DeepMind, 2013 | structural-only |
| quote-work | zh | no | no | 用深度强化学习玩 Atari | structural-only |
| quote-authors | zh | no | no | 沃洛迪米尔·姆尼赫等, DeepMind，2013 | structural-only |

### milestone-2016-alphago - AlphaGo

Sources:
- [Nature 2016 AlphaGo paper](https://www.nature.com/articles/nature16961) (Paper primary-candidate)
- [Google DeepMind AlphaGo](https://deepmind.google/research/alphago/) (Blog)
- [KataGo Analysis Engine](https://github.com/lightvector/KataGo/blob/master/docs/Analysis_Engine.md) (API)

| Field | Locale | Risk | Manual Review | Claim | Status |
| --- | --- | --- | --- | --- | --- |
| year-title | en | no | no | 2016: AlphaGo | structural-only |
| year-title | zh | no | no | 2016: AlphaGo | structural-only |
| location | en | no | no | Google DeepMind, London, United Kingdom | structural-only |
| location | zh | no | no | 谷歌 DeepMind，英国，伦敦 | structural-only |
| figure | en | no | no | David Silver - AlphaGo lead researcher | structural-only |
| figure | zh | no | no | 大卫·席尔瓦 - AlphaGo 主要研究者 | structural-only |
| figure | en | no | no | Demis Hassabis - DeepMind co-founder | structural-only |
| figure | zh | no | no | 戴密斯·哈萨比斯 - DeepMind 联合创始人 | structural-only |
| figure | en | no | no | Aja Huang - AlphaGo researcher | structural-only |
| figure | zh | no | no | 黄士杰 - AlphaGo 研究者 | structural-only |
| description | en | no | no | AlphaGo combined deep neural networks, Monte Carlo tree search and reinforcement learning through self-play. | structural-only |
| description | en | no | no | Its 2016 match against Lee Sedol made AI's strategic progress visible to a global audience. | structural-only |
| description | en | no | no | The system showed that AI could learn both intuition and planning in a domain long considered too complex for brute-force search. | structural-only |
| description | zh | no | no | AlphaGo 结合深度神经网络、蒙特卡洛树搜索和自我对弈强化学习。 | structural-only |
| description | zh | no | no | 2016 年与李世石的对局让 AI 的战略能力被全球观众看见。 | structural-only |
| description | zh | no | no | 它证明 AI 可以在一个长期被认为难以靠蛮力搜索解决的领域中学习直觉与规划。 | structural-only |
| commentary:Historical Background | en | no | no | Go had long resisted brute-force AI because its state space was enormous and expert play depended on pattern intuition. | structural-only |
| commentary:Historical Background | en | no | no | AlphaGo made the problem tractable by combining learned intuition with search, turning Go into a public demonstration of modern AI strategy. | structural-only |
| commentary:Historical Background | zh | no | no | 围棋长期难以被蛮力 AI 攻克，因为状态空间巨大，高手对弈又依赖模式直觉。 | structural-only |
| commentary:Historical Background | zh | no | no | AlphaGo 通过把学习到的直觉与搜索结合起来，使这个问题变得可处理，并让围棋成为现代 AI 战略能力的公开展示。 | structural-only |
| commentary:Core Idea | en | no | no | The Nature paper explains the hybrid design: policy networks narrow the search, value networks evaluate board positions, and Monte Carlo tree search chooses moves. | structural-only |
| commentary:Core Idea | en | no | no | AlphaGo Zero later showed how self-play could reduce dependence on expert game data. | structural-only |
| commentary:Core Idea | zh | no | no | 《自然》论文解释了它的混合设计：策略网络缩小搜索范围，价值网络评估棋盘局面，蒙特卡洛树搜索选择落子。 | structural-only |
| commentary:Core Idea | zh | no | no | 后来的 AlphaGo Zero 进一步展示了自我对弈如何减少对专家棋谱的依赖。 | structural-only |
| commentary:Long-Term Legacy | en | yes | no | Experts generally treat AlphaGo as a landmark demonstration that deep learning, search, and reinforcement learning could surpass elite human intuition in a complex domain. | low-priority-risk |
| commentary:Long-Term Legacy | en | no | no | Its long-term legacy is the self-play and neural search pattern that shaped later game AI, planning systems, and public expectations for AI breakthroughs. | structural-only |
| commentary:Long-Term Legacy | zh | yes | no | 专家通常把 AlphaGo 视为标志性展示，说明深度学习、搜索和强化学习可以在复杂领域超越顶尖人类直觉。 | low-priority-risk |
| commentary:Long-Term Legacy | zh | no | no | 它的长期影响在于自我对弈和神经搜索模式影响了后来的游戏 AI、规划系统以及公众对 AI 突破的期待。 | structural-only |
| quote-work | en | no | no | Mastering the Game of Go with Deep Neural Networks and Tree Search | structural-only |
| quote-authors | en | no | no | David Silver et al., Nature, 2016 | structural-only |
| quote-work | zh | yes | no | 用深度神经网络和树搜索掌握围棋 | low-priority-risk |
| quote-authors | zh | no | no | 戴维·席尔瓦等, 《自然》, 2016 | structural-only |

### milestone-2017-alphazero - AlphaZero

Sources:
- [Science paper](https://www.science.org/doi/10.1126/science.aar6404) (Paper primary-candidate)
- [arXiv preprint](https://arxiv.org/abs/1712.01815) (Preprint primary-candidate)
- [DeepMind AlphaZero blog](https://deepmind.google/discover/blog/alphazero-shedding-new-light-on-chess-shogi-and-go/) (Blog)

| Field | Locale | Risk | Manual Review | Claim | Status |
| --- | --- | --- | --- | --- | --- |
| year-title | en | no | no | 2017-2018: AlphaZero | structural-only |
| year-title | zh | no | no | 2017-2018: AlphaZero | structural-only |
| location | en | no | no | DeepMind, London, United Kingdom | structural-only |
| location | zh | no | no | DeepMind，英国伦敦 | structural-only |
| figure | en | no | no | David Silver - DeepMind reinforcement learning lead | structural-only |
| figure | zh | no | no | 大卫·席尔瓦 - DeepMind 强化学习负责人 | structural-only |
| figure | en | no | no | Demis Hassabis - DeepMind co-founder | structural-only |
| figure | zh | no | no | 德米斯·哈萨比斯 - DeepMind 联合创始人 | structural-only |
| description | en | yes | game result or superhuman-performance wording; non-legacy risk claim | AlphaZero showed that one self-play reinforcement learning system could master Go, chess, and shogi from game rules alone. | needs-manual-source-review |
| description | en | no | no | It replaced handcrafted evaluation and opening books with neural policy-value learning plus Monte Carlo tree search, turning board-game AI into a general recipe rather than a single-game program. | structural-only |
| description | zh | yes | game result or superhuman-performance wording; non-legacy risk claim | AlphaZero 展示了同一套自我博弈强化学习系统可以仅凭游戏规则掌握围棋、国际象棋和将棋。 | needs-manual-source-review |
| description | zh | no | no | 它用神经网络的策略-价值学习和蒙特卡洛树搜索取代人工评估函数与开局库，让棋牌游戏 AI 从单一游戏程序走向通用方法。 | structural-only |
| commentary:Historical Background | en | no | no | AlphaGo still used human expert games and Go-specific training stages. | structural-only |
| commentary:Historical Background | en | yes | absolute-first-or-only wording; non-legacy risk claim | AlphaZero asked whether self-play could carry the learning burden across multiple games with only the rules as input. | needs-manual-source-review |
| commentary:Historical Background | zh | no | no | AlphaGo 仍然使用人类专家棋谱和围棋专用训练阶段。 | structural-only |
| commentary:Historical Background | zh | no | no | AlphaZero 进一步追问：自我博弈能否只依靠规则，在多个游戏中承担主要学习负担。 | structural-only |
| commentary:Core Idea | en | no | no | A neural network predicts move probabilities and game outcomes. | structural-only |
| commentary:Core Idea | en | no | no | Tree search improves action choice, self-play generates new experience, and the network absorbs the improved behavior in the next training cycle. | structural-only |
| commentary:Core Idea | zh | no | no | 神经网络预测走法概率和胜负结果。 | structural-only |
| commentary:Core Idea | zh | no | no | 树搜索改进行动选择，自我博弈产生新经验，网络再在下一轮训练中吸收这些改进行为。 | structural-only |
| commentary:Long-Term Legacy | en | yes | no | Experts generally treat AlphaZero as the cleanest public statement of the neural-search self-play paradigm. | low-priority-risk |
| commentary:Long-Term Legacy | en | no | no | Its legacy is the idea that strong play can emerge from rule-based simulation plus learned policy-value guidance, a pattern that later influenced MuZero and other planning systems. | structural-only |
| commentary:Long-Term Legacy | zh | yes | no | 专家通常把 AlphaZero 视为神经搜索自我博弈范式最清晰的公开表达。 | low-priority-risk |
| commentary:Long-Term Legacy | zh | no | no | 它的长期影响在于提出：强棋力可以从规则仿真与学习型策略-价值引导中涌现，这一模式后来影响了 MuZero 等规划系统。 | structural-only |
| quote-work | en | yes | no | A general reinforcement learning algorithm that masters chess, shogi, and Go through self-play | low-priority-risk |
| quote-authors | en | no | no | David Silver et al., Science, 2018 | structural-only |
| quote-work | zh | yes | no | 通过自我博弈掌握国际象棋、将棋和围棋的通用强化学习算法 | low-priority-risk |
| quote-authors | zh | no | no | David Silver 等，Science，2018 | structural-only |

### milestone-2017-libratus - Libratus

Sources:
- [Science paper](https://www.science.org/doi/10.1126/science.aao1733) (Paper primary-candidate)
- [CMU Libratus release](https://www.cmu.edu/news/stories/archives/2017/january/AI-beats-poker-pros.html) (News report primary-candidate)
- [Safe and Nested Subgame Solving](https://arxiv.org/abs/1705.02955) (Preprint primary-candidate)

| Field | Locale | Risk | Manual Review | Claim | Status |
| --- | --- | --- | --- | --- | --- |
| year-title | en | no | no | 2017: Libratus | structural-only |
| year-title | zh | no | no | 2017: Libratus | structural-only |
| location | en | no | no | Carnegie Mellon University, Pittsburgh, United States | structural-only |
| location | zh | no | no | 卡内基梅隆大学，美国匹兹堡 | structural-only |
| figure | en | no | no | Noam Brown - Libratus co-creator | structural-only |
| figure | zh | no | no | 诺姆·布朗 - Libratus 共同创建者 | structural-only |
| figure | en | no | no | Tuomas Sandholm - CMU professor and Libratus co-creator | structural-only |
| figure | zh | no | no | 托马斯·桑德霍姆 - CMU 教授，Libratus 共同创建者 | structural-only |
| description | en | yes | game result or superhuman-performance wording; non-legacy risk claim | Libratus defeated top professionals in heads-up no-limit Texas hold'em, a game with hidden information and enormous decision spaces. | needs-manual-source-review |
| description | en | no | no | It combined abstract game solving, real-time endgame solving, and self-improvement after each day of play, proving that game AI could move beyond perfect-information boards. | structural-only |
| description | zh | yes | game result or superhuman-performance wording; non-legacy risk claim | Libratus 在一对一无限注德州扑克中击败顶尖职业牌手，而这类游戏包含隐藏信息和巨大的决策空间。 | needs-manual-source-review |
| description | zh | no | no | 它结合抽象博弈求解、实时残局求解和每日赛后自我改进，证明游戏 AI 可以走出完全信息棋盘。 | structural-only |
| commentary:Historical Background | en | no | no | Poker added hidden cards, bluffing, and uncertainty to the game-AI story. | structural-only |
| commentary:Historical Background | en | no | no | Unlike chess or Go, the correct action depends on ranges of possible private hands and on what opponents believe you might hold. | structural-only |
| commentary:Historical Background | zh | no | no | 扑克把暗牌、诈唬和不确定性加入了游戏 AI 叙事。 | structural-only |
| commentary:Historical Background | zh | no | no | 不同于国际象棋或围棋，正确行动取决于可能暗牌范围，以及对手认为你可能持有什么牌。 | structural-only |
| commentary:Core Idea | en | yes | proof/solved wording; non-legacy risk claim | Libratus solved a compact abstraction before the match and used real-time subgame solving during difficult hands. | needs-manual-source-review |
| commentary:Core Idea | en | no | no | It then analyzed each day for exploitable patterns and patched the strategy overnight. | structural-only |
| commentary:Core Idea | zh | no | no | Libratus 在赛前求解紧凑抽象策略，并在困难手牌中使用实时子局求解。 | structural-only |
| commentary:Core Idea | zh | no | no | 它随后分析每天对局中的可利用模式，并在夜间修补策略。 | structural-only |
| commentary:Long-Term Legacy | en | yes | no | Experts generally treat Libratus as a turning point for large imperfect-information games. | low-priority-risk |
| commentary:Long-Term Legacy | en | no | no | Its legacy is showing that abstraction, equilibrium reasoning, and targeted repair can defeat elite humans even when the real state is partly hidden. | structural-only |
| commentary:Long-Term Legacy | zh | yes | no | 专家通常把 Libratus 视为大型不完全信息博弈的转折点。 | low-priority-risk |
| commentary:Long-Term Legacy | zh | yes | proof/solved wording; game result or superhuman-performance wording | 它的长期影响在于证明：即使真实状态部分隐藏，抽象、均衡推理和定向修补仍能击败顶尖人类。 | needs-manual-source-review |
| quote-work | en | yes | no | Superhuman AI for heads-up no-limit poker: Libratus beats top professionals | low-priority-risk |
| quote-authors | en | no | no | Noam Brown and Tuomas Sandholm, Science, 2017 | structural-only |
| quote-work | zh | yes | no | 一对一无限注扑克的超人 AI：Libratus 击败顶级职业牌手 | low-priority-risk |
| quote-authors | zh | no | no | Noam Brown 与 Tuomas Sandholm，Science，2017 | structural-only |

### milestone-2019-muzero - MuZero

Sources:
- [Nature paper](https://www.nature.com/articles/s41586-020-03051-4) (Paper primary-candidate)
- [arXiv preprint](https://arxiv.org/abs/1911.08265) (Preprint primary-candidate)
- [DeepMind MuZero blog](https://deepmind.google/discover/blog/muzero-mastering-go-chess-shogi-and-atari-without-rules/) (Blog)

| Field | Locale | Risk | Manual Review | Claim | Status |
| --- | --- | --- | --- | --- | --- |
| year-title | en | no | no | 2019-2020: MuZero | structural-only |
| year-title | zh | no | no | 2019-2020: MuZero | structural-only |
| location | en | no | no | DeepMind, London, United Kingdom | structural-only |
| location | zh | no | no | DeepMind，英国伦敦 | structural-only |
| figure | en | yes | absolute-first-or-only wording; non-legacy risk claim | Julian Schrittwieser - MuZero first author | needs-manual-source-review |
| figure | zh | no | no | 朱利安·施里特维泽 - MuZero 第一作者 | structural-only |
| figure | en | no | no | David Silver - DeepMind reinforcement learning lead | structural-only |
| figure | zh | no | no | 大卫·席尔瓦 - DeepMind 强化学习负责人 | structural-only |
| description | en | no | no | MuZero learned to plan without being given the exact rules of the environment. | structural-only |
| description | en | yes | absolute-first-or-only wording; non-legacy risk claim | It built a compact internal model only for the quantities needed by search: policy, value, and reward. | needs-manual-source-review |
| description | en | no | no | In board games and Atari, it linked AlphaZero-style planning with model learning from experience. | structural-only |
| description | zh | no | no | MuZero 学会在没有显式环境规则的情况下进行规划。 | structural-only |
| description | zh | no | no | 它只学习搜索所需的紧凑内部模型：策略、价值和奖励。 | structural-only |
| description | zh | no | no | 在棋类游戏与 Atari 中，它把 AlphaZero 式规划和从经验中学习模型连接起来。 | structural-only |
| commentary:Historical Background | en | no | no | AlphaZero searched using known rules, while many reinforcement-learning agents learned from pixels without explicit lookahead. | structural-only |
| commentary:Historical Background | en | no | no | MuZero connected these two worlds by learning a model that was useful for planning even when the exact rules were not supplied. | structural-only |
| commentary:Historical Background | zh | no | no | AlphaZero 依赖已知规则搜索，而许多强化学习智能体从像素学习但缺少显式前瞻。 | structural-only |
| commentary:Historical Background | zh | no | no | MuZero 通过学习一个对规划有用的模型，把这两个世界连接起来，即使没有提供精确规则也能工作。 | structural-only |
| commentary:Core Idea | en | no | no | Instead of predicting every future observation, MuZero learns a latent dynamics model for rewards, values, policies, and search. | structural-only |
| commentary:Core Idea | en | no | no | The model is judged by whether it helps decisions, not by whether it reconstructs the full world. | structural-only |
| commentary:Core Idea | zh | no | no | MuZero 不预测每个未来观测，而是学习面向奖励、价值、策略和搜索的潜在动力学模型。 | structural-only |
| commentary:Core Idea | zh | no | no | 这个模型按是否帮助决策来评价，而不是按是否重建完整世界来评价。 | structural-only |
| commentary:Long-Term Legacy | en | yes | no | Experts generally treat MuZero as a landmark in learned-model planning. | low-priority-risk |
| commentary:Long-Term Legacy | en | no | no | Its legacy is showing that model-based reinforcement learning can combine the strengths of AlphaZero-style search with experience-driven model learning. | structural-only |
| commentary:Long-Term Legacy | zh | yes | no | 专家通常把 MuZero 视为学习模型规划的标志性成果。 | low-priority-risk |
| commentary:Long-Term Legacy | zh | no | no | 它的长期影响在于说明：基于模型的强化学习可以结合 AlphaZero 式搜索和经验驱动模型学习的优势。 | structural-only |
| quote-work | en | no | no | Mastering Atari, Go, chess and shogi by planning with a learned model | structural-only |
| quote-authors | en | no | no | Julian Schrittwieser et al., Nature, 2020 | structural-only |
| quote-work | zh | yes | no | 通过学习模型进行规划以掌握 Atari、围棋、国际象棋和将棋 | low-priority-risk |
| quote-authors | zh | no | no | Julian Schrittwieser 等，Nature，2020 | structural-only |

### milestone-2019-pluribus - Pluribus

Sources:
- [Science paper](https://www.science.org/doi/10.1126/science.aay2400) (Paper primary-candidate)
- [Meta AI Pluribus report](https://ai.meta.com/blog/pluribus-first-ai-to-beat-pros-in-6-player-poker/) (News report)
- [CMU Pluribus release](https://www.cmu.edu/news/stories/archives/2019/july/ai-beats-pros-six-player-poker.html) (News report primary-candidate)

| Field | Locale | Risk | Manual Review | Claim | Status |
| --- | --- | --- | --- | --- | --- |
| year-title | en | no | no | 2019: Pluribus | structural-only |
| year-title | zh | no | no | 2019: Pluribus | structural-only |
| location | en | no | no | Carnegie Mellon University and Facebook AI Research, Pittsburgh and Menlo Park, United States | structural-only |
| location | zh | no | no | 卡内基梅隆大学与 Facebook AI Research，美国匹兹堡与门洛帕克 | structural-only |
| figure | en | no | no | Noam Brown - Pluribus co-creator | structural-only |
| figure | zh | no | no | 诺姆·布朗 - Pluribus 共同创建者 | structural-only |
| figure | en | no | no | Tuomas Sandholm - Pluribus co-creator | structural-only |
| figure | zh | no | no | 托马斯·桑德霍姆 - Pluribus 共同创建者 | structural-only |
| description | en | no | no | Pluribus extended poker AI from heads-up play to six-player no-limit Texas hold'em. | structural-only |
| description | en | no | no | It used a compact blueprint strategy plus limited-lookahead search to handle several opponents at once, moving game AI toward multiplayer settings where no single opponent model is enough. | structural-only |
| description | zh | no | no | Pluribus 将扑克 AI 从一对一扩展到六人无限注德州扑克。 | structural-only |
| description | zh | no | no | 它使用紧凑蓝图策略与有限前瞻搜索，同时处理多个对手，把游戏 AI 推向无法只靠单一对手模型的多人场景。 | structural-only |
| commentary:Historical Background | en | no | no | Many real strategic settings are neither two-player nor zero-sum in the clean chess sense. | structural-only |
| commentary:Historical Background | en | no | no | Multiplayer poker made that gap concrete by adding several opponents with private information and shifting incentives. | structural-only |
| commentary:Historical Background | zh | no | no | 许多真实策略场景并不是干净的两人零和棋局。 | structural-only |
| commentary:Historical Background | zh | no | no | 多人扑克通过多个拥有私人信息、激励不断变化的对手，把这个差距具体化了。 | structural-only |
| commentary:Core Idea | en | no | no | Pluribus used a compact self-play blueprint as the baseline policy. | structural-only |
| commentary:Core Idea | en | no | no | During play it applied limited-lookahead search to refine decisions without trying to solve the entire six-player game from scratch. | structural-only |
| commentary:Core Idea | zh | no | no | Pluribus 使用紧凑自我对弈蓝图作为基准策略。 | structural-only |
| commentary:Core Idea | zh | no | no | 在对局中，它用有限前瞻搜索细化决策，而不是从头求解整个六人游戏。 | structural-only |
| commentary:Long-Term Legacy | en | yes | no | Experts generally treat Pluribus as an important demonstration that imperfect-information AI can scale beyond two players. | low-priority-risk |
| commentary:Long-Term Legacy | en | no | no | Its legacy is the blueprint-plus-search pattern for messy multi-agent domains where exact equilibrium computation is out of reach. | structural-only |
| commentary:Long-Term Legacy | zh | yes | no | 专家通常把 Pluribus 视为不完全信息 AI 扩展到两人之外的重要展示。 | low-priority-risk |
| commentary:Long-Term Legacy | zh | no | no | 它的长期影响在于提出蓝图加搜索模式，用于那些无法精确计算均衡的复杂多智能体领域。 | structural-only |
| quote-work | en | yes | no | Superhuman AI for multiplayer poker | low-priority-risk |
| quote-authors | en | no | no | Noam Brown and Tuomas Sandholm, Science, 2019 | structural-only |
| quote-work | zh | no | no | 面向多人扑克的超人 AI | structural-only |
| quote-authors | zh | no | no | Noam Brown 与 Tuomas Sandholm，Science，2019 | structural-only |

### milestone-2019-suphx - Suphx: Mahjong with Deep Reinforcement Learning

Sources:
- [Suphx arXiv paper](https://arxiv.org/abs/2003.13590) (Paper primary-candidate)
- [arXiv DOI page](https://doi.org/10.48550/arXiv.2003.13590) (DOI primary-candidate)
- [Building a Computer Mahjong Player via Deep CNNs](https://arxiv.org/abs/1906.02146) (Background paper primary-candidate)

| Field | Locale | Risk | Manual Review | Claim | Status |
| --- | --- | --- | --- | --- | --- |
| year-title | en | no | no | 2019-2020: Suphx: Mahjong with Deep Reinforcement Learning | structural-only |
| year-title | zh | no | no | 2019-2020: Suphx：深度强化学习麻将 AI | structural-only |
| location | en | no | no | Microsoft Research Asia, Beijing, China | structural-only |
| location | zh | no | no | 微软亚洲研究院，中国北京 | structural-only |
| figure | en | yes | absolute-first-or-only wording; non-legacy risk claim | Junjie Li - Suphx paper first author | needs-manual-source-review |
| figure | zh | no | no | 李俊杰 - Suphx 论文第一作者 | structural-only |
| figure | en | no | no | Tao Qin - Microsoft Research Asia researcher | structural-only |
| figure | zh | no | no | 秦涛 - 微软亚洲研究院研究员 | structural-only |
| figure | en | no | no | Tie-Yan Liu - Microsoft Research Asia research leader | structural-only |
| figure | zh | no | no | 刘铁岩 - 微软亚洲研究院研究负责人 | structural-only |
| description | en | no | no | Suphx brought deep reinforcement learning to Japanese mahjong, a four-player imperfect-information game with hidden tiles, stochastic draws, complex scoring, and long-horizon risk tradeoffs. | structural-only |
| description | en | no | no | It used supervised pretraining, self-play reinforcement learning, global reward prediction, oracle guiding, and run-time policy adaptation to reach a level above most ranked Tenhou players. | structural-only |
| description | zh | no | no | Suphx 将深度强化学习带入日本麻将，这是一种四人不完全信息游戏，包含隐藏牌、随机摸牌、复杂计分和长期风险权衡。 | structural-only |
| description | zh | yes | game result or superhuman-performance wording; non-legacy risk claim | 它使用监督预训练、自我对弈强化学习、全局奖励预测、oracle guiding 和运行时策略适配，在天凤平台达到超过绝大多数注册段位玩家的水平。 | needs-manual-source-review |
| commentary:Historical Background | en | yes | absolute-first-or-only wording; non-legacy risk claim | Mahjong is more difficult for direct search than chess-like board games because players see only part of the state. | needs-manual-source-review |
| commentary:Historical Background | en | no | no | Every discard affects hand value, safety, turn order, and the hidden intentions of three opponents. | structural-only |
| commentary:Historical Background | zh | no | no | 麻将比类棋盘游戏更难直接搜索，因为玩家只能看到部分状态。 | structural-only |
| commentary:Historical Background | zh | no | no | 每一次打牌都会影响手牌价值、安全性、巡目节奏，以及三个对手的隐藏意图。 | structural-only |
| commentary:Core Idea | en | no | no | Suphx learned from human games and then improved through reinforcement learning. | structural-only |
| commentary:Core Idea | en | no | no | Its additional reward prediction, oracle guiding, and policy adaptation components helped it reason about delayed points, hidden tiles, and changing table context. | structural-only |
| commentary:Core Idea | zh | no | no | Suphx 先从人类牌谱学习，再通过强化学习改进。 | structural-only |
| commentary:Core Idea | zh | no | no | 额外的奖励预测、oracle guiding 和策略适配组件，帮助它推理延迟得分、隐藏牌和不断变化的牌桌上下文。 | structural-only |
| commentary:Long-Term Legacy | en | yes | no | Experts generally treat Suphx as a signal that deep reinforcement learning can handle multi-player stochastic imperfect-information games beyond poker. | low-priority-risk |
| commentary:Long-Term Legacy | en | no | no | Its legacy is broadening the game-AI testbed from clean boards and two-player equilibrium toward messy cultural games with rich hidden state. | structural-only |
| commentary:Long-Term Legacy | zh | yes | no | 专家通常把 Suphx 视为一个信号：深度强化学习可以处理扑克之外的多人随机不完全信息游戏。 | low-priority-risk |
| commentary:Long-Term Legacy | zh | no | no | 它的长期影响在于把游戏 AI 试验场从干净棋盘和两人均衡，扩展到具有丰富隐藏状态的复杂文化游戏。 | structural-only |
| quote-work | en | no | no | Suphx: Mastering Mahjong with Deep Reinforcement Learning | structural-only |
| quote-authors | en | no | no | Junjie Li et al., arXiv, 2020 | structural-only |
| quote-work | zh | yes | no | Suphx：用深度强化学习掌握麻将 | low-priority-risk |
| quote-authors | zh | no | no | Junjie Li 等，arXiv，2020 | structural-only |

