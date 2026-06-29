# AI100 Manual Source Review Guide

Generated from `reports/ai100-accuracy-audit.json`. This file rewrites the 52 weak/manual-review claims into a reviewer-friendly checklist.

## What is the problem?

The automated audit found no hard data errors, but it flagged claims whose wording is stronger than a machine can safely verify from the attached source list. These are not necessarily wrong. They need a person to open the linked sources and confirm whether the wording is directly supported.

The main risk patterns are:

- First/only claims: words like “first”, “one of the first”, “only”, or “最早” need precise historical scope.
- Proof/solved claims: words like “proof”, “proved”, “solved”, or “证明” may overstate evidence or demonstration.
- Superlatives/rankings: words like “best”, “most important”, “state-of-the-art”, or “最先进” need explicit source support.
- Expert-consensus claims: “Experts generally treat...” is acceptable only when the cited material really supports that consensus.

## Review Summary

- Milestones with manual-review claims: 30
- Claims needing manual source review: 52
- Hard audit issues: 0
- Total extracted claims audited: 2815

| Problem type | Count | What to do |
| --- | ---: | --- |
| First/only claim | 25 | Check whether the source really supports the chronology and scope. If not, soften to “early”, “influential”, or name the exact comparison class. |
| Proof/solved claim | 14 | Check whether this is literal proof/solution language or just evidence/demonstration. If it is interpretive, soften to “showed”, “demonstrated”, or “helped establish”. |
| Superlative or ranking claim | 13 | Check whether the source explicitly supports the ranking. If not, replace with a narrower, sourced description. |

## Reviewer Instructions

For each item below:

1. Open the primary candidate source first.
2. Verify the exact claim, not just the general topic.
3. Mark one outcome in your notes: `Supported`, `Needs softer wording`, `Needs better source`, or `Incorrect`.
4. If editing content, update `manage/events.js` or `manage/ai100-extra-events.js`, then run `npm run generate && npm run audit:ai100-accuracy`.

## Manual Review Checklist

### milestone-1950-turing-test — Turing Test / 图灵测试

Year: 1950  
Sources: 4; primary candidates: 4; claims to review here: 1

Recommended sources to open:

- Paper primary candidate: [Computing Machinery and Intelligence](https://academic.oup.com/mind/article/LIX/236/433/986238)
- Archive primary candidate: [Turing Digital Archive](https://turingarchive.kings.cam.ac.uk/computing-machinery-and-intelligence)
- Archive primary candidate: [Internet Archive digital preview](https://archive.org/details/MIND--COMPUTING-MACHINERY-AND-INTELLIGENCE/mode/1up)
- Context primary candidate: [Stanford Encyclopedia of Philosophy](https://plato.stanford.edu/archives/spr2020/entries/turing-test/)

#### 1. Superlative or ranking claim (Medium priority)

- Field: `commentary:Core Idea`
- Language: `en`
- Why flagged: superlative or benchmark wording; non-legacy risk claim
- Claim to check: The test is best read as an evaluation design: blind interaction, restricted channel, human judgment and explicit success criteria.
- Suggested softer wording: The Turing Test is best read as a philosophical reframing that takes the form of an evaluation design: blind interaction, restricted channel, human judgment, and an implicit success criterion.
- Reviewer task: Check whether the source explicitly supports the ranking. If not, replace with a narrower, sourced description.
- Review outcome: `[ ] Supported` `[x] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

### milestone-1951-strachey-draughts — Christopher Strachey's Draughts / 克里斯托弗·斯特雷奇 的跳棋程序

Year: 1951-1952  
Sources: 4; primary candidates: 1; claims to review here: 3

Recommended sources to open:

- Paper primary candidate: [Logical or non-mathematical programmes](https://dl.acm.org/doi/10.1145/1455270.1455277)
- Biography: [Computer Pioneers - Christopher Strachey](https://history.computer.org/pioneers/strachey.html)
- Image source: [Strachey draughts program screenshot](https://commons.wikimedia.org/wiki/File:Christopher_Strachey%27s_Draughts_Program.png)
- Image source: [Checkers board photo](https://commons.wikimedia.org/wiki/File:CheckersStandard.jpg)

#### 2. First/only claim (High priority)

- Field: `description`
- Language: `en`
- Why flagged: absolute-first-or-only wording; non-legacy risk claim
- Claim to check: It represented board positions, generated moves, evaluated alternatives, and attempted strategic play on early British computers, making game playing one of AI's first public testbeds.
- Review note: The technical description is supportable, including board representation, move generation, alternative evaluation, and complete-game play by 1952. The weak part is the framing “one of AI's first public testbeds”: the listed primary source and biography do not establish that public/community testbed claim, and concurrent early game-playing work makes a clean “first” framing slippery.
- Suggested softer wording: It represented board positions, generated moves, evaluated alternatives, and attempted strategic play on early British computers -- among the earliest demonstrations that a machine could engage in goal-directed, strategic behavior.
- Reviewer task: Check whether the source really supports the chronology and scope. If not, soften to “early”, “influential”, or name the exact comparison class.
- Review outcome: `[ ] Supported` `[x] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

#### 3. First/only claim (High priority)

- Field: `description`
- Language: `zh`
- Why flagged: absolute-first-or-only wording; non-legacy risk claim
- Claim to check: 它表示棋盘局面、生成走法、评估备选方案，并在早期英国计算机上尝试策略性对弈，使游戏成为 AI 最早的公开试验场之一。
- Review note: 技术描述可以支持，包括棋盘表示、走法生成、备选方案评估，以及到 1952 年已经能完成一局跳棋。薄弱之处是“AI 最早的公开试验场之一”这个框架：列出的原始论文和人物传记并没有直接证明“公开”或“共同体认可的试验场”，而且同期还有其他早期博弈程序工作，使“最早”范围不够稳妥。
- Suggested softer wording: 它在早期英国计算机上表示棋盘局面、生成走法、评估备选方案并尝试策略性对弈，是机器能够进行目标导向策略行为的最早展示之一。
- Reviewer task: Check whether the source really supports the chronology and scope. If not, soften to “early”, “influential”, or name the exact comparison class.
- Review outcome: `[ ] Supported` `[x] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

#### 4. Proof/solved claim (High priority)

- Field: `commentary:Long-Term Legacy`
- Language: `en`
- Why flagged: proof/solved wording
- Claim to check: Experts generally treat Strachey's draughts program as an early proof that stored-program computers could attempt non-numerical play and choice.
- Review note: The word “proof” is not literal here, but it still carries more weight than the listed sources support. The sources support Strachey's draughts program as an early stored-program game-playing demonstration; they do not directly support the meta-claim that experts generally treat it as proof.
- Suggested softer wording: Strachey's draughts program is widely regarded as an early demonstration that stored-program computers could attempt non-numerical play and choice.
- Reviewer task: Check whether this is literal proof/solution language or just evidence/demonstration. If it is interpretive, soften to “showed”, “demonstrated”, or “helped establish”.
- Review outcome: `[ ] Supported` `[x] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

### milestone-1956-logic-theorist — Logic Theorist / 逻辑理论家

Year: 1956  
Sources: 3; primary candidates: 3; claims to review here: 1

Recommended sources to open:

- Paper primary candidate: [The Logic Theory Machine](https://books.google.com/books/about/The_Logic_Theory_Machine.html?id=n_OK4q5RP2YC)
- Archive primary candidate: [Carnegie Mellon University Archives](https://findingaids.library.cmu.edu/repositories/2/archival_objects/22555)
- Award primary candidate: [Allen Newell ACM A.M. Turing Award](https://amturing.acm.org/award_winners/newell_3167755.cfm)

#### 5. Proof/solved claim (High priority)

- Field: `commentary:Long-Term Legacy`
- Language: `en`
- Why flagged: proof/solved wording
- Claim to check: Experts generally treat Logic Theorist as a founding symbolic AI system and an early proof that heuristic search could model reasoning.
- Review note: “Proof” overstates the claim in the same way as the Strachey item: this is not a formal proof, and “experts generally treat it as proof” is an unsourced meta-claim. The safer claim is that Logic Theorist helped establish heuristic search as a viable reasoning model.
- Suggested softer wording: Experts widely regard Logic Theorist as a founding symbolic AI system that helped establish heuristic search as a viable model of reasoning.
- Reviewer task: Check whether this is literal proof/solution language or just evidence/demonstration. If it is interpretive, soften to “showed”, “demonstrated”, or “helped establish”.
- Review outcome: `[ ] Supported` `[x] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

### milestone-1958-rosenblatt-perceptron — Rosenblatt Perceptron / 罗森布拉特 感知机

Year: 1958  
Sources: 3; primary candidates: 1; claims to review here: 1

Recommended sources to open:

- Paper primary candidate: [The Perceptron: A Probabilistic Model for Information Storage and Organization in the Brain](https://doi.org/10.1037/h0042519)
- History: [Cornell Chronicle perceptron retrospective](https://news.cornell.edu/stories/2019/09/professors-perceptron-paved-way-ai-60-years-too-soon)
- Museum: [Smithsonian Mark I Perceptron object record](https://www.si.edu/object/electronic-neural-network-mark-i-perceptron%3Anmah_334414)

#### 6. First/only claim (High priority)

- Field: `description`
- Language: `en`
- Why flagged: absolute-first-or-only wording; non-legacy risk claim
- Claim to check: It promised machines that could learn from examples rather than being programmed only by explicit rules.
- Review note: This is supported as written. The audit flag is a false positive because the claim does not actually assert first/only chronology; it characterizes the perceptron's learning-from-examples paradigm and contrasts it with explicit rule programming.
- Reviewer task: Check whether the source really supports the chronology and scope. If not, soften to “early”, “influential”, or name the exact comparison class.
- Review outcome: `[x] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

### milestone-1958-wangs-algorithm — Wang's Algorithm / 王氏算法

Year: 1958-1961  
Sources: 3; primary candidates: 2; claims to review here: 2

Recommended sources to open:

- Paper primary candidate: [Proving theorems by pattern recognition I](https://cacm.acm.org/research/proving-theorems-by-pattern-recognition-i/)
- Archive primary candidate: [Proving Theorems by Pattern Recognition - II](https://www.nokia.com/bell-labs/publications-and-media/publications/proving-theorems-by-pattern-recognition-ii/)
- Photo: [Rockefeller University Digital Commons: Wang, Hao](https://digitalcommons.rockefeller.edu/faculty-members/109/)

#### 7. First/only claim (High priority)

- Field: `commentary:Historical Background`
- Language: `en`
- Why flagged: absolute-first-or-only wording; non-legacy risk claim
- Claim to check: The first paper appeared in Communications of the ACM in April 1960, with DOI 10.1145/367177.367224.
- Review note: Supported. The ACM record confirms DOI 10.1145/367177.367224 and publication on 1 April 1960; bibliographic indexes also list Communications of the ACM, 1960, volume 3, pages 220-234 with the same DOI.
- Reviewer task: Check whether the source really supports the chronology and scope. If not, soften to “early”, “influential”, or name the exact comparison class.
- Review outcome: `[x] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

#### 8. Proof/solved claim (High priority)

- Field: `commentary:Long-Term Legacy`
- Language: `zh`
- Why flagged: proof/solved wording
- Claim to check: 专家通常把王氏算法视为自动定理证明的早期里程碑。
- Review note: 这句话没有真正使用“证明/解决”类措辞，“里程碑”本身已经比较稳妥。需要弱化的是“专家通常把...视为”这个未直接证明的元判断。
- Suggested softer wording: 王氏算法被广泛视为自动定理证明的早期里程碑。
- Reviewer task: Check whether this is literal proof/solution language or just evidence/demonstration. If it is interpretive, soften to “showed”, “demonstrated”, or “helped establish”.
- Review outcome: `[ ] Supported` `[x] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

### milestone-1965-dendral — DENDRAL / DENDRAL

Year: 1965  
Sources: 3; primary candidates: 2; claims to review here: 4

Recommended sources to open:

- Paper primary candidate: [Applications of Artificial Intelligence for Chemical Inference](https://doi.org/10.1021/ci60034a002)
- Award primary candidate: [ACM Turing Award profile for Edward Feigenbaum](https://awards.acm.org/award-recipients/feigenbaum_4167235)
- History: [Stanford Knowledge Systems Laboratory history](http://ksl-web.stanford.edu/)

#### 9. First/only claim (High priority)

- Field: `description`
- Language: `en`
- Why flagged: absolute-first-or-only wording; non-legacy risk claim
- Claim to check: DENDRAL was one of the first expert systems to show that domain knowledge could make AI practically useful.
- Review note: The sources support DENDRAL as an early, foundational expert-system case and as evidence for knowledge-based AI. The ranking phrase “one of the first” is not needed here and can create avoidable chronology/scope ambiguity.
- Suggested softer wording: DENDRAL was an early expert system that showed domain knowledge could make AI practically useful.
- Reviewer task: Check whether the source really supports the chronology and scope. If not, soften to “early”, “influential”, or name the exact comparison class.
- Review outcome: `[ ] Supported` `[x] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

#### 10. First/only claim (High priority)

- Field: `description`
- Language: `zh`
- Why flagged: absolute-first-or-only wording; non-legacy risk claim
- Claim to check: DENDRAL 是最早展示领域知识能让 AI 具有实际用途的专家系统之一。
- Review note: 资料支持 DENDRAL 是早期、奠基性的专家系统案例，也支持它体现了知识型 AI 的实际价值。但“最早...之一”的排序框架没有必要，容易引入不清晰的年代和范围判断。
- Suggested softer wording: DENDRAL 是一个早期专家系统，表明领域知识能让 AI 具有实际用途。
- Reviewer task: Check whether the source really supports the chronology and scope. If not, soften to “early”, “influential”, or name the exact comparison class.
- Review outcome: `[ ] Supported` `[x] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

#### 11. First/only claim (High priority)

- Field: `commentary:Long-Term Legacy`
- Language: `en`
- Why flagged: absolute-first-or-only wording
- Claim to check: Experts generally treat DENDRAL as one of the first convincing demonstrations that domain knowledge could make AI useful.
- Review note: The main idea is supportable, but “experts generally treat” is an unsourced meta-claim and “one of the first” adds unnecessary ranking pressure. A landmark-demonstration phrasing preserves the historical point without overclaiming.
- Suggested softer wording: DENDRAL is widely regarded as a landmark demonstration that domain knowledge could make AI genuinely useful.
- Reviewer task: Check whether the source really supports the chronology and scope. If not, soften to “early”, “influential”, or name the exact comparison class.
- Review outcome: `[ ] Supported` `[x] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

#### 12. First/only claim (High priority)

- Field: `commentary:Long-Term Legacy`
- Language: `zh`
- Why flagged: absolute-first-or-only wording; proof/solved wording
- Claim to check: 专家通常把 DENDRAL 视为最早有力证明领域知识能让 AI 变得有用的系统之一。
- Review note: “专家通常把...”是未直接证明的元判断，“最早...之一”和“有力证明”也让语气过强。改成“被广泛视为...示范”能保留历史意义，同时降低排序和证明压力。
- Suggested softer wording: DENDRAL 被广泛视为一个重要的早期示范，表明领域知识能让 AI 真正发挥实际作用。
- Reviewer task: Check whether the source really supports the chronology and scope. If not, soften to “early”, “influential”, or name the exact comparison class.
- Review outcome: `[ ] Supported` `[x] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

### milestone-1965-resolution-method — Resolution Method / 归结方法

Year: 1965  
Sources: 3; primary candidates: 2; claims to review here: 1

Recommended sources to open:

- Paper primary candidate: [A Machine-Oriented Logic Based on the Resolution Principle](https://doi.org/10.1145/321250.321253)
- Review primary candidate: [Journal of Symbolic Logic review record](https://www.cambridge.org/core/journals/journal-of-symbolic-logic/article/j-a-robinson-a-machineoriented-logic-based-on-the-resolution-principle-journal-of-the-association-for-computing-machinery-vol-12-1965-pp-2341/65679C30B9D7D7763FFB700CA77B18B1)
- Background: [Stanford Encyclopedia: Automated Reasoning](https://plato.stanford.edu/entries/reasoning-automated/)

#### 13. Proof/solved claim (High priority)

- Field: `commentary:Long-Term Legacy`
- Language: `zh`
- Why flagged: proof/solved wording
- Claim to check: 专家通常把归结法视为符号 AI 和自动推理的基础证明方法。
- Reviewer task: Check whether this is literal proof/solution language or just evidence/demonstration. If it is interpretive, soften to “showed”, “demonstrated”, or “helped establish”.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

### milestone-1971-complexity-theory — NP-Completeness / NP 完全性

Year: 1971  
Sources: 3; primary candidates: 2; claims to review here: 1

Recommended sources to open:

- Paper primary candidate: [The Complexity of Theorem-Proving Procedures](https://dl.acm.org/doi/10.1145/800157.805047)
- Award primary candidate: [Stephen A. Cook ACM A.M. Turing Award](https://awards.acm.org/award_winners/cook_N991950)
- Problem: [Clay Mathematics Institute P vs NP](https://www.claymath.org/millennium/p-vs-np/)

#### 14. Proof/solved claim (High priority)

- Field: `commentary:Core Idea`
- Language: `en`
- Why flagged: proof/solved wording; non-legacy risk claim
- Claim to check: If one NP-complete problem is solved efficiently, every problem in NP can be solved efficiently.
- Reviewer task: Check whether this is literal proof/solution language or just evidence/demonstration. If it is interpretive, soften to “showed”, “demonstrated”, or “helped establish”.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

### milestone-1973-prolog — PROLOG / PROLOG

Year: 1973  
Sources: 3; primary candidates: 2; claims to review here: 2

Recommended sources to open:

- History primary candidate: [The Birth of Prolog](https://doi.org/10.1145/155360.155362)
- Archive primary candidate: [Prolog Heritage](https://www.prolog-heritage.org/en/Prolog_50.html)
- Language docs: [SWI-Prolog documentation](https://www.swi-prolog.org/pldoc/doc_for?object=manual)

#### 15. First/only claim (High priority)

- Field: `figure`
- Language: `en`
- Why flagged: absolute-first-or-only wording; non-legacy risk claim
- Claim to check: Alain Colmerauer - Creator of the first Prolog implementation
- Reviewer task: Check whether the source really supports the chronology and scope. If not, soften to “early”, “influential”, or name the exact comparison class.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

#### 16. Proof/solved claim (High priority)

- Field: `description`
- Language: `en`
- Why flagged: proof/solved wording; non-legacy risk claim
- Claim to check: Instead of writing step-by-step procedures, programmers wrote facts and rules, then asked queries that the system solved by unification and backtracking.
- Reviewer task: Check whether this is literal proof/solution language or just evidence/demonstration. If it is interpretive, soften to “showed”, “demonstrated”, or “helped establish”.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

### milestone-1980-xcon-r1 — XCON-R1 / XCON / R1 专家系统

Year: 1978-1980  
Sources: 4; primary candidates: 1; claims to review here: 2

Recommended sources to open:

- Paper primary candidate: [R1: An Expert in the Computer Systems Domain](https://ojs.aaai.org/index.php/AAAI/article/view/8022)
- Retrospective: [R1 Revisited: Four Years in the Trenches](https://ojs.aaai.org/aimagazine/index.php/aimagazine/article/view/445)
- Overview: [XCON overview](https://en.wikipedia.org/wiki/Xcon)
- Image source: [DEC VAX-11/780 photo](https://commons.wikimedia.org/wiki/File:LCM_-_DEC_VAX_11-780-5_-_01.jpg)

#### 17. Proof/solved claim (High priority)

- Field: `commentary:Long-Term Legacy`
- Language: `en`
- Why flagged: proof/solved wording
- Claim to check: Experts generally treat XCON/R1 as a landmark industrial expert system and a proof that knowledge engineering could deliver business value.
- Reviewer task: Check whether this is literal proof/solution language or just evidence/demonstration. If it is interpretive, soften to “showed”, “demonstrated”, or “helped establish”.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

#### 18. Proof/solved claim (High priority)

- Field: `commentary:Long-Term Legacy`
- Language: `zh`
- Why flagged: proof/solved wording
- Claim to check: 专家通常把 XCON/R1 视为工业专家系统的标志性案例，也证明知识工程能够产生商业价值。
- Reviewer task: Check whether this is literal proof/solution language or just evidence/demonstration. If it is interpretive, soften to “showed”, “demonstrated”, or “helped establish”.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

### milestone-1983-simulated-annealing — Simulated Annealing / 模拟退火

Year: 1983  
Sources: 3; primary candidates: 2; claims to review here: 2

Recommended sources to open:

- Paper primary candidate: [Optimization by Simulated Annealing](https://www.science.org/doi/10.1126/science.220.4598.671)
- Optimizer docs: [SciPy dual_annealing](https://docs.scipy.org/doc/scipy/reference/generated/scipy.optimize.dual_annealing.html)
- Notebook primary candidate: [Hedibert course PDF mirror](https://hedibert.org/wp-content/uploads/2013/12/1983KirkpatrickGelattVecchi.pdf)

#### 19. Proof/solved claim (High priority)

- Field: `commentary:Long-Term Legacy`
- Language: `en`
- Why flagged: proof/solved wording
- Claim to check: Experts generally treat simulated annealing as a classic metaheuristic for escaping local optima, not as a guarantee of easy global optimization.
- Reviewer task: Check whether this is literal proof/solution language or just evidence/demonstration. If it is interpretive, soften to “showed”, “demonstrated”, or “helped establish”.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

#### 20. Proof/solved claim (High priority)

- Field: `commentary:Long-Term Legacy`
- Language: `zh`
- Why flagged: proof/solved wording; superlative or benchmark wording
- Claim to check: 专家通常把模拟退火视为用于跳出局部最优的经典元启发式方法，而不是轻松获得全局最优的保证。
- Reviewer task: Check whether this is literal proof/solution language or just evidence/demonstration. If it is interpretive, soften to “showed”, “demonstrated”, or “helped establish”.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

### milestone-1984-cyc — Cyc / Cyc 常识知识库

Year: 1984  
Sources: 4; primary candidates: 3; claims to review here: 2

Recommended sources to open:

- Book primary candidate: [Building Large Knowledge-Based Systems](https://dl.acm.org/doi/book/10.5555/70571)
- Paper primary candidate: [The Evolution of CycL](https://dl.acm.org/doi/10.1145/122296.122308)
- Official page primary candidate: [Cyc](https://cyc.com/)
- Image source: [Cyc projects logo image](https://commons.wikimedia.org/wiki/File:Cyc_Projects_Logos.png)

#### 21. Superlative or ranking claim (Medium priority)

- Field: `commentary:Long-Term Legacy`
- Language: `en`
- Why flagged: superlative or benchmark wording
- Claim to check: Experts generally treat Cyc as one of the most ambitious symbolic-AI attempts to encode common sense explicitly.
- Reviewer task: Check whether the source explicitly supports the ranking. If not, replace with a narrower, sourced description.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

#### 22. First/only claim (High priority)

- Field: `commentary:Long-Term Legacy`
- Language: `en`
- Why flagged: absolute-first-or-only wording
- Claim to check: Its long-term legacy is keeping debates alive about knowledge engineering, hybrid reasoning, ontologies, and the limits of data-only learning.
- Reviewer task: Check whether the source really supports the chronology and scope. If not, soften to “early”, “influential”, or name the exact comparison class.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

### milestone-1990-otter — Otter / Otter 自动定理证明器

Year: 1990s  
Sources: 3; primary candidates: 3; claims to review here: 1

Recommended sources to open:

- Reference primary candidate: [OTTER 3.3 Reference Manual](https://arxiv.org/abs/cs/0310056)
- Paper primary candidate: [A Spectrum of Applications of Automated Reasoning](https://arxiv.org/abs/cs/0205078)
- Application paper primary candidate: [Checking Clinical Guidelines using Automated Reasoning Tools](https://arxiv.org/abs/0806.0250)

#### 23. Proof/solved claim (High priority)

- Field: `commentary:Long-Term Legacy`
- Language: `zh`
- Why flagged: proof/solved wording
- Claim to check: 专家通常把 Otter 视为自动定理证明和形式推理中的主力系统。
- Reviewer task: Check whether this is literal proof/solution language or just evidence/demonstration. If it is interpretive, soften to “showed”, “demonstrated”, or “helped establish”.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

### milestone-1992-svm — Support Vector Machines / 支持向量机

Year: 1992  
Sources: 3; primary candidates: 1; claims to review here: 4

Recommended sources to open:

- Paper primary candidate: [A Training Algorithm for Optimal Margin Classifiers](https://dl.acm.org/doi/10.1145/130385.130401)
- Toolkit: [LIBSVM project page](https://www.csie.ntu.edu.tw/~cjlin/libsvm/)
- Model docs: [scikit-learn SVC](https://scikit-learn.org/stable/modules/generated/sklearn.svm.SVC.html)

#### 24. Superlative or ranking claim (Medium priority)

- Field: `figure`
- Language: `zh`
- Why flagged: superlative or benchmark wording; non-legacy risk claim
- Claim to check: 弗拉基米尔·瓦普尼克 - 共同发展最优间隔分类器与统计学习理论
- Reviewer task: Check whether the source explicitly supports the ranking. If not, replace with a narrower, sourced description.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

#### 25. Superlative or ranking claim (Medium priority)

- Field: `figure`
- Language: `zh`
- Why flagged: superlative or benchmark wording; non-legacy risk claim
- Claim to check: 伯恩哈德·博泽尔 - 1992 年最优间隔分类器论文共同作者
- Reviewer task: Check whether the source explicitly supports the ranking. If not, replace with a narrower, sourced description.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

#### 26. Superlative or ranking claim (Medium priority)

- Field: `figure`
- Language: `zh`
- Why flagged: superlative or benchmark wording; non-legacy risk claim
- Claim to check: 伊莎贝尔·居永 - 1992 年最优间隔分类器论文共同作者
- Reviewer task: Check whether the source explicitly supports the ranking. If not, replace with a narrower, sourced description.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

#### 27. Superlative or ranking claim (Medium priority)

- Field: `commentary:Long-Term Legacy`
- Language: `en`
- Why flagged: superlative or benchmark wording
- Claim to check: Experts generally treat SVMs as mature classical methods whose conceptual importance exceeds their role in most modern deep-learning pipelines.
- Reviewer task: Check whether the source explicitly supports the ranking. If not, replace with a narrower, sourced description.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

### milestone-1994-chinook — Chinook / Chinook 跳棋程序

Year: 1989-2007  
Sources: 4; primary candidates: 2; claims to review here: 1

Recommended sources to open:

- Official page primary candidate: [Chinook project home](https://webdocs.cs.ualberta.ca/~chinook/index.php)
- Paper primary candidate: [Checkers Is Solved](https://www.science.org/doi/10.1126/science.1144079)
- Publications: [Chinook publications](https://webdocs.cs.ualberta.ca/~chinook/publications/)
- Image source: [Jonathan Schaeffer portrait](https://commons.wikimedia.org/wiki/File:Jonathan_Schaeffer.jpg)

#### 28. Proof/solved claim (High priority)

- Field: `commentary:Core Idea`
- Language: `en`
- Why flagged: proof/solved wording; non-legacy risk claim
- Claim to check: Chinook paired forward search with solved endgame tables, letting the program connect current choices to proven late-game outcomes.
- Reviewer task: Check whether this is literal proof/solution language or just evidence/demonstration. If it is interpretive, soften to “showed”, “demonstrated”, or “helped establish”.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

### milestone-1997-deep-blue — Deep Blue / 深蓝

Year: 1997  
Sources: 3; primary candidates: 1; claims to review here: 2

Recommended sources to open:

- Profile: [Murray Campbell, IBM Research](https://research.ibm.com/people/murray-campbell)
- Museum: [Mastering the Game, Computer History Museum](https://www.computerhistory.org/chess/)
- Official history primary candidate: [IBM100: Deep Blue](https://www.ibm.com/history/deep-blue)

#### 29. First/only claim (High priority)

- Field: `description`
- Language: `en`
- Why flagged: absolute-first-or-only wording; non-legacy risk claim
- Claim to check: Deep Blue became the first computer system to defeat the reigning world chess champion in a regulation match.
- Reviewer task: Check whether the source really supports the chronology and scope. If not, soften to “early”, “influential”, or name the exact comparison class.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

#### 30. First/only claim (High priority)

- Field: `description`
- Language: `zh`
- Why flagged: absolute-first-or-only wording; non-legacy risk claim
- Claim to check: 深蓝 成为第一个在正式比赛中击败卫冕世界冠军的计算机系统。
- Reviewer task: Check whether the source really supports the chronology and scope. If not, soften to “early”, “influential”, or name the exact comparison class.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

### milestone-2003-lda — Latent Dirichlet Allocation / 潜在狄利克雷分配

Year: 2003  
Sources: 3; primary candidates: 1; claims to review here: 1

Recommended sources to open:

- Paper primary candidate: [Latent Dirichlet Allocation](https://jmlr.org/papers/v3/blei03a.html)
- Author: [David M. Blei homepage](https://www.cs.columbia.edu/~blei/)
- Implementation: [scikit-learn LatentDirichletAllocation](https://scikit-learn.org/stable/modules/generated/sklearn.decomposition.LatentDirichletAllocation.html)

#### 31. First/only claim (High priority)

- Field: `figure`
- Language: `en`
- Why flagged: absolute-first-or-only wording; non-legacy risk claim
- Claim to check: David Blei - First author of LDA
- Reviewer task: Check whether the source really supports the chronology and scope. If not, soften to “early”, “influential”, or name the exact comparison class.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

### milestone-2009-imagenet — ImageNet / ImageNet

Year: 2009  
Sources: 3; primary candidates: 1; claims to review here: 1

Recommended sources to open:

- Paper primary candidate: [ImageNet: A Large-Scale Hierarchical Image Database](https://ieeexplore.ieee.org/document/5206848)
- Project: [ImageNet project website](https://www.image-net.org/)
- Profile: [Stanford Profile: Fei-Fei Li](https://profiles.stanford.edu/fei-fei-li)

#### 32. First/only claim (High priority)

- Field: `figure`
- Language: `en`
- Why flagged: absolute-first-or-only wording; non-legacy risk claim
- Claim to check: Jia Deng - First author of ImageNet paper
- Reviewer task: Check whether the source really supports the chronology and scope. If not, soften to “early”, “influential”, or name the exact comparison class.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

### milestone-2013-dqn — Deep Q Network / 深度 Q 网络

Year: 2013  
Sources: 3; primary candidates: 2; claims to review here: 1

Recommended sources to open:

- Preprint primary candidate: [Playing Atari with Deep Reinforcement Learning](https://arxiv.org/abs/1312.5602)
- Paper primary candidate: [Human-level control through deep reinforcement learning](https://www.nature.com/articles/nature14236)
- Project note: [Google DeepMind: Deep Reinforcement Learning](https://deepmind.google/discover/blog/deep-reinforcement-learning/)

#### 33. First/only claim (High priority)

- Field: `figure`
- Language: `en`
- Why flagged: absolute-first-or-only wording; non-legacy risk claim
- Claim to check: Volodymyr Mnih - First author of DQN work
- Reviewer task: Check whether the source really supports the chronology and scope. If not, soften to “early”, “influential”, or name the exact comparison class.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

### milestone-2014-adam — Adam Optimizer / Adam 优化器

Year: 2014  
Sources: 3; primary candidates: 1; claims to review here: 1

Recommended sources to open:

- Paper primary candidate: [Adam: A Method for Stochastic Optimization](https://arxiv.org/abs/1412.6980)
- Implementation: [PyTorch torch.optim.Adam](https://docs.pytorch.org/docs/stable/generated/torch.optim.Adam.html)
- Framework docs: [TensorFlow Keras Adam optimizer](https://www.tensorflow.org/api_docs/python/tf/keras/optimizers/Adam)

#### 34. Superlative or ranking claim (Medium priority)

- Field: `commentary:Long-Term Legacy`
- Language: `zh`
- Why flagged: superlative or benchmark wording
- Claim to check: 专家通常把 Adam 视为实用默认优化器，而不是万能最优解。
- Reviewer task: Check whether the source explicitly supports the ranking. If not, replace with a narrower, sourced description.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

### milestone-2014-dropout — Dropout / Dropout

Year: 2014  
Sources: 3; primary candidates: 2; claims to review here: 1

Recommended sources to open:

- Paper primary candidate: [Dropout: A Simple Way to Prevent Neural Networks from Overfitting](https://jmlr.org/papers/v15/srivastava14a.html)
- Preprint primary candidate: [Improving neural networks by preventing co-adaptation](https://arxiv.org/abs/1207.0580)
- Framework docs: [PyTorch torch.nn.Dropout](https://docs.pytorch.org/docs/stable/generated/torch.nn.Dropout.html)

#### 35. First/only claim (High priority)

- Field: `figure`
- Language: `en`
- Why flagged: absolute-first-or-only wording; non-legacy risk claim
- Claim to check: Nitish Srivastava - First author of the JMLR dropout paper
- Reviewer task: Check whether the source really supports the chronology and scope. If not, soften to “early”, “influential”, or name the exact comparison class.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

### milestone-2014-vgg — VGG Networks / VGG 网络

Year: 2014  
Sources: 3; primary candidates: 1; claims to review here: 2

Recommended sources to open:

- Paper primary candidate: [Very Deep Convolutional Networks for Large-Scale Image Recognition](https://arxiv.org/abs/1409.1556)
- Project: [Oxford VGG Very Deep ConvNets](https://www.robots.ox.ac.uk/~vgg/research/very_deep/)
- Model docs: [TorchVision VGG model family](https://pytorch.org/vision/stable/models/vgg.html)

#### 36. Superlative or ranking claim (Medium priority)

- Field: `commentary:Long-Term Legacy`
- Language: `en`
- Why flagged: superlative or benchmark wording
- Claim to check: Experts generally treat VGG as an important reference architecture, not a state-of-the-art deployment choice.
- Reviewer task: Check whether the source explicitly supports the ranking. If not, replace with a narrower, sourced description.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

#### 37. Superlative or ranking claim (Medium priority)

- Field: `commentary:Long-Term Legacy`
- Language: `zh`
- Why flagged: superlative or benchmark wording
- Claim to check: 专家通常把 VGG 视为重要参照架构，而不是最先进的部署选择。
- Reviewer task: Check whether the source explicitly supports the ranking. If not, replace with a narrower, sourced description.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

### milestone-ai100-1982-som — Self-organizing Map / 自组织映射

Year: 1982  
Sources: 4; primary candidates: 3; claims to review here: 1

Recommended sources to open:

- Paper primary candidate: [Self-organized formation of topologically correct feature maps](https://doi.org/10.1007/BF00337288)
- Paper PDF primary candidate: [Open SOM paper PDF](https://tcosmo.github.io/assets/soms/doc/kohonen1982.pdf)
- Background: [Self-organizing map overview](https://en.wikipedia.org/wiki/Self-organizing_map)
- Retrospective primary candidate: [Essentials of the self-organizing map](https://doi.org/10.1016/j.neunet.2012.09.018)

#### 38. Superlative or ranking claim (Medium priority)

- Field: `commentary:Core Idea`
- Language: `en`
- Why flagged: superlative or benchmark wording; non-legacy risk claim
- Claim to check: The best-matching unit and its neighbors move toward an input, gradually shaping a topology-preserving map.
- Reviewer task: Check whether the source explicitly supports the ranking. If not, replace with a narrower, sourced description.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

### milestone-ai100-1989-lenet — LeNet / LeNet

Year: 1989  
Sources: 4; primary candidates: 2; claims to review here: 2

Recommended sources to open:

- Paper primary candidate: [Backpropagation Applied to Handwritten Zip Code Recognition](https://doi.org/10.1162/neco.1989.1.4.541)
- Project: [LeNet-5 demos and documentation](https://yann.lecun.com/exdb/lenet/)
- Paper primary candidate: [Gradient-Based Learning Applied to Document Recognition](https://vision.stanford.edu/cs598_spring07/papers/Lecun98.pdf)
- People: [Yann LeCun's home page](https://yann.lecun.com/)

#### 39. Proof/solved claim (High priority)

- Field: `commentary:Long-Term Legacy`
- Language: `en`
- Why flagged: proof/solved wording
- Claim to check: Experts generally treat LeNet as a canonical early proof that convolution, weight sharing, and backpropagation could solve real perception tasks.
- Reviewer task: Check whether this is literal proof/solution language or just evidence/demonstration. If it is interpretive, soften to “showed”, “demonstrated”, or “helped establish”.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

#### 40. Proof/solved claim (High priority)

- Field: `commentary:Long-Term Legacy`
- Language: `zh`
- Why flagged: proof/solved wording
- Claim to check: 专家通常把 LeNet 视为早期经典证据，证明卷积、权重共享和反向传播可以解决真实感知任务。
- Reviewer task: Check whether this is literal proof/solution language or just evidence/demonstration. If it is interpretive, soften to “showed”, “demonstrated”, or “helped establish”.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

### milestone-ai100-2014-conditional-gan — Conditional GAN / Conditional GAN

Year: 2014  
Sources: 3; primary candidates: 2; claims to review here: 2

Recommended sources to open:

- Paper primary candidate: [Conditional Generative Adversarial Nets](https://arxiv.org/abs/1411.1784)
- Background: [Generative adversarial network overview](https://en.wikipedia.org/wiki/Generative_adversarial_network)
- Related paper primary candidate: [Generative Adversarial Nets](https://proceedings.neurips.cc/paper/2014/hash/f033ed80deb0234979a61f95710dbe25-Abstract.html)

#### 41. First/only claim (High priority)

- Field: `description`
- Language: `en`
- Why flagged: non-legacy risk claim
- Claim to check: This made adversarial generation controllable rather than only sampling from an undirected data distribution.
- Reviewer task: Check whether the source really supports the chronology and scope. If not, soften to “early”, “influential”, or name the exact comparison class.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

#### 42. First/only claim (High priority)

- Field: `commentary:Historical Background`
- Language: `en`
- Why flagged: non-legacy risk claim
- Claim to check: This made adversarial generation controllable rather than only sampling from an undirected data distribution.
- Reviewer task: Check whether the source really supports the chronology and scope. If not, soften to “early”, “influential”, or name the exact comparison class.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

### milestone-ai100-2014-ms-coco — MS COCO / MS COCO

Year: 2014  
Sources: 3; primary candidates: 2; claims to review here: 1

Recommended sources to open:

- Paper primary candidate: [Microsoft COCO: Common Objects in Context](https://arxiv.org/abs/1405.0312)
- Dataset: [COCO dataset website](https://cocodataset.org/)
- Conference paper primary candidate: [ECCV Springer record](https://link.springer.com/chapter/10.1007/978-3-319-10602-1_48)

#### 43. Superlative or ranking claim (Medium priority)

- Field: `commentary:Long-Term Legacy`
- Language: `en`
- Why flagged: superlative or benchmark wording
- Claim to check: Experts generally treat MS COCO as one of the most important datasets for modern computer vision.
- Reviewer task: Check whether the source explicitly supports the ranking. If not, replace with a narrower, sourced description.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

### milestone-2016-yolo — YOLO / YOLO

Year: 2016  
Sources: 3; primary candidates: 2; claims to review here: 1

Recommended sources to open:

- Paper primary candidate: [You Only Look Once: Unified, Real-Time Object Detection](https://arxiv.org/abs/1506.02640)
- Open access primary candidate: [CVPR open-access paper page](https://openaccess.thecvf.com/content_cvpr_2016/html/Redmon_You_Only_Look_CVPR_2016_paper.html)
- Project: [Darknet YOLO project page](https://pjreddie.com/darknet/yolo/)

#### 44. First/only claim (High priority)

- Field: `figure`
- Language: `en`
- Why flagged: absolute-first-or-only wording; non-legacy risk claim
- Claim to check: Joseph Redmon - First author of YOLO
- Reviewer task: Check whether the source really supports the chronology and scope. If not, soften to “early”, “influential”, or name the exact comparison class.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

### milestone-ai100-2017-gat — GAT / GAT

Year: 2017  
Sources: 3; primary candidates: 2; claims to review here: 1

Recommended sources to open:

- Paper primary candidate: [Graph Attention Networks](https://arxiv.org/abs/1710.10903)
- Conference paper primary candidate: [ICLR OpenReview record](https://openreview.net/forum?id=rJXMpikCZ)
- Code: [Original GAT repository](https://github.com/PetarV-/GAT)

#### 45. First/only claim (High priority)

- Field: `commentary:Long-Term Legacy`
- Language: `en`
- Why flagged: absolute-first-or-only wording
- Claim to check: Its long-term legacy is the idea that graph neighborhoods can be weighted dynamically instead of only by graph degree or fixed normalization.
- Reviewer task: Check whether the source really supports the chronology and scope. If not, soften to “early”, “influential”, or name the exact comparison class.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

### milestone-ai100-2017-wasserstein-gan — Wasserstein GAN / Wasserstein GAN

Year: 2017  
Sources: 3; primary candidates: 2; claims to review here: 2

Recommended sources to open:

- Paper primary candidate: [Wasserstein Generative Adversarial Networks](https://proceedings.mlr.press/v70/arjovsky17a.html)
- Paper primary candidate: [Improved Training of Wasserstein GANs](https://proceedings.neurips.cc/paper/2017/hash/892c3b1c6dccd52936e27cbd0ff683d6-Abstract.html)
- Background: [Wasserstein GAN overview](https://en.wikipedia.org/wiki/Wasserstein_GAN)

#### 46. Superlative or ranking claim (High priority)

- Field: `description`
- Language: `zh`
- Why flagged: superlative or benchmark wording; non-legacy risk claim
- Claim to check: Wasserstein GAN 用受最优传输启发的距离替代原始 GAN 散度。
- Reviewer task: Check whether the source explicitly supports the ranking. If not, replace with a narrower, sourced description.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

#### 47. Superlative or ranking claim (Medium priority)

- Field: `commentary:Historical Background`
- Language: `zh`
- Why flagged: superlative or benchmark wording; non-legacy risk claim
- Claim to check: Wasserstein GAN 用受最优传输启发的距离替代原始 GAN 散度。
- Reviewer task: Check whether the source explicitly supports the ranking. If not, replace with a narrower, sourced description.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

### milestone-ai100-2018-gpt — GPT / GPT

Year: 2018  
Sources: 4; primary candidates: 1; claims to review here: 5

Recommended sources to open:

- Paper PDF primary candidate: [Improving Language Understanding by Generative Pre-Training](https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf)
- Publication: [OpenAI language unsupervised page](https://openai.com/index/language-unsupervised/)
- Background: [GPT model overview](https://en.wikipedia.org/wiki/Generative_pre-trained_transformer)
- People: [Alec Radford research context](https://openai.com/research/)

#### 48. First/only claim (High priority)

- Field: `description`
- Language: `en`
- Why flagged: absolute-first-or-only wording; non-legacy risk claim
- Claim to check: Alec Radford and colleagues introduced the first Generative Pre-trained Transformer as a language model trained on large unlabeled text and adapted to downstream tasks.
- Reviewer task: Check whether the source really supports the chronology and scope. If not, soften to “early”, “influential”, or name the exact comparison class.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

#### 49. First/only claim (High priority)

- Field: `description`
- Language: `en`
- Why flagged: absolute-first-or-only wording; non-legacy risk claim
- Claim to check: It established the decoder-only pre-training pattern that later scaled into GPT-2, GPT-3, and modern language models.
- Reviewer task: Check whether the source really supports the chronology and scope. If not, soften to “early”, “influential”, or name the exact comparison class.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

#### 50. First/only claim (High priority)

- Field: `commentary:Historical Background`
- Language: `en`
- Why flagged: absolute-first-or-only wording; non-legacy risk claim
- Claim to check: Alec Radford and colleagues introduced the first Generative Pre-trained Transformer as a language model trained on large unlabeled text and adapted to downstream tasks.
- Reviewer task: Check whether the source really supports the chronology and scope. If not, soften to “early”, “influential”, or name the exact comparison class.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

#### 51. First/only claim (High priority)

- Field: `commentary:Historical Background`
- Language: `en`
- Why flagged: absolute-first-or-only wording; non-legacy risk claim
- Claim to check: It established the decoder-only pre-training pattern that later scaled into GPT-2, GPT-3, and modern language models.
- Reviewer task: Check whether the source really supports the chronology and scope. If not, soften to “early”, “influential”, or name the exact comparison class.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`

#### 52. First/only claim (High priority)

- Field: `commentary:Long-Term Legacy`
- Language: `en`
- Why flagged: absolute-first-or-only wording
- Claim to check: Experts generally treat GPT as the start of the decoder-only scaling line that led to today’s large language models.
- Reviewer task: Check whether the source really supports the chronology and scope. If not, soften to “early”, “influential”, or name the exact comparison class.
- Review outcome: `[ ] Supported` `[ ] Needs softer wording` `[ ] Needs better source` `[ ] Incorrect`
