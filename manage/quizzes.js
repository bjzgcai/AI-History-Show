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
        )
    }
};
