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
        )
    }
};
