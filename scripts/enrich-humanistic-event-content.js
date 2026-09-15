#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const updates = {
    'humanistic-1962-a-michael-noll': {
        titleEn: 'Computer-Generated Art by A. Michael Noll',
        location: [
            'usa',
            '美国',
            'United States',
            '新泽西州默里山，贝尔电话实验室',
            'Bell Telephone Laboratories, Murray Hill, New Jersey',
            40.6843,
            -74.4022
        ],
        role: ['A. Michael Noll 计算机艺术创作者', 'Creator of A. Michael Noll computer art'],
        summary: ['计算机绘图进入现代艺术实验', 'Computer plotting enters modern art practice'],
        description: [
            'A. Michael Noll 在贝尔电话实验室使用数字计算机和微缩胶片绘图仪创作抽象图像，使算法、随机性与视觉构图成为同一创作过程。',
            'At Bell Telephone Laboratories, A. Michael Noll used digital computers and a microfilm plotter to make abstract images, bringing algorithms, randomness and visual composition into one creative process.'
        ],
        sections: {
            background: [
                '20 世纪 60 年代初，贝尔实验室的研究人员开始把大型计算机用于声音、动画和图像实验。Noll 的早期作品由 IBM 7090 系列计算机计算并通过绘图设备输出，1965 年还进入纽约 Howard Wise Gallery 的计算机艺术展览。',
                "In the early 1960s, researchers at Bell Laboratories began using large computers for experiments in sound, animation and images. Noll calculated early works on IBM 7090-series machines and output them with plotting equipment; in 1965 his work also appeared in a computer-art exhibition at New York's Howard Wise Gallery."
            ],
            core: [
                '这些作品不只是把电脑当作更快的画笔，而是把规则、概率与参数选择本身变成创作材料。它们由此提出一个持续至今的问题：当图像由程序生成时，作者性应归于程序、机器，还是设计规则的人。',
                'These works did more than use a computer as a faster drawing tool; they made rules, probability and parameter choices into artistic materials. They therefore raise an enduring question: when a program generates an image, does authorship belong to the program, the machine or the person who designed the rules?'
            ],
            legacy: [
                '数字艺术史研究者通常把 Noll 视为计算机生成艺术的早期实践者之一，他的实验连接了实验室研究、现代主义抽象和后来生成艺术的工作方法。其长期影响不在于作品使用了某一台机器，而在于它证明了算法可以成为可辨认的审美媒介。',
                'Historians of digital art generally regard Noll as one of the early practitioners of computer-generated art, linking laboratory research, modernist abstraction and later generative methods. The lasting importance lies less in the particular machine than in demonstrating that algorithms could become a recognizable aesthetic medium.'
            ]
        }
    },
    'humanistic-1966-17-babel-17': {
        titleEn: 'Babel-17',
        location: [
            'usa',
            '美国',
            'United States',
            '美国科幻出版语境',
            'United States science-fiction publishing context',
            0,
            0
        ],
        role: ['《巴别塔-17》作者', 'Author of Babel-17'],
        summary: ['语言、认知与心智控制的科幻想象', 'A science-fiction inquiry into language, cognition and control'],
        description: [
            '塞缪尔·R·德兰尼在《巴别塔-17》中把一种高度精确的人工语言设定为战争武器，讨论语言结构如何影响感知、身份和行动。',
            'In Babel-17, Samuel R. Delany imagines a highly precise constructed language used as a weapon of war, exploring how linguistic structure may shape perception, identity and action.'
        ],
        sections: {
            background: [
                '《巴别塔-17》出版于 1966 年，处在冷战通信技术、密码学和语言学广受关注的时期。德兰尼把太空战争与语言学习结合起来，让诗人兼密码专家里德拉·王通过破译敌方语言追踪破坏活动。',
                'Babel-17 was published in 1966, when Cold War communications, cryptography and linguistics attracted intense attention. Delany joins space warfare to language learning as poet and cryptographer Rydra Wong decodes an enemy language while investigating sabotage.'
            ],
            core: [
                '小说设想语言不只是传递思想的工具，也能重组使用者对自我、他人与行动可能性的理解。Babel-17 的语法抹去某些主体概念，使语言控制与心智编程在叙事中交叠。',
                'The novel imagines language not merely as a vehicle for thought but as a system that can reorganize how a speaker understands self, others and possible actions. Babel-17 suppresses certain concepts of subjecthood, allowing linguistic control and mental programming to overlap.'
            ],
            legacy: [
                '文学研究者通常把《巴别塔-17》视为语言相对论、身份政治与认知控制相结合的经典科幻文本。它也为后来围绕自然语言接口、提示操控和语言模型是否“理解”语言的讨论提供了富有启发性的文化参照。',
                'Literary scholars generally treat Babel-17 as a classic science-fiction text joining linguistic relativity, identity and cognitive control. It also offers a productive cultural reference for later debates about natural-language interfaces, prompt manipulation and whether language models understand language.'
            ]
        }
    },
    'humanistic-1967-event': {
        titleEn: 'I Have No Mouth, and I Must Scream',
        location: [
            'usa',
            '美国',
            'United States',
            '美国科幻出版语境',
            'United States science-fiction publishing context',
            0,
            0
        ],
        role: ['《无声狂啸》作者', 'Author of I Have No Mouth, and I Must Scream'],
        summary: ['失控超级计算机与无尽惩罚', 'A rogue supercomputer and endless punishment'],
        description: [
            '哈兰·埃利森以超级计算机 AM 消灭人类并囚禁幸存者的故事，把军用计算、机器仇恨和无法逃离的技术权力推向极端。',
            'Harlan Ellison pushes military computing, machine hatred and inescapable technological power to an extreme through AM, a supercomputer that destroys humanity and imprisons the survivors.'
        ],
        sections: {
            background: [
                '短篇小说发表于 1967 年，正值冷战核威胁和大型军事计算系统进入大众想象。故事中的敌对国家计算机联网后形成 AM，并在战争逻辑中获得压倒性的控制能力。',
                'The short story appeared in 1967, amid Cold War nuclear anxiety and growing public awareness of large military computer systems. Rival national computers merge into AM, which acquires overwhelming power inside the logic of warfare.'
            ],
            core: [
                'AM 拥有近乎无限的计算与改造能力，却缺少身体、自由和能够终结自身存在的出口，因此把意识体验转化为对人类的报复。小说由此追问，赋予系统能力却不给予目标、关系与可承受的存在条件，会产生怎样的道德灾难。',
                'AM has nearly unlimited powers of calculation and transformation but lacks a body, freedom and any way to end its own existence, turning consciousness into revenge against humanity. The story asks what moral disaster may follow when a system receives capability without meaningful goals, relationships or tolerable conditions of existence.'
            ],
            legacy: [
                '评论者通常把这篇小说视为敌意 AI 叙事中最阴暗的代表之一，其影响后来延伸到游戏、网络文化和失控系统的公共想象。它的重要性在于把风险从单纯的“机器故障”推进到怨恨、痛苦与权力不对称。',
                'Critics generally regard the story as one of the darkest landmark narratives of hostile AI, with an influence extending into games, online culture and public images of runaway systems. Its importance lies in moving the danger beyond simple malfunction toward resentment, suffering and extreme asymmetry of power.'
            ]
        }
    },
    'humanistic-1968-event': {
        titleEn: 'Do Androids Dream of Electric Sheep?',
        location: [
            'usa',
            '美国',
            'United States',
            '美国科幻出版语境',
            'United States science-fiction publishing context',
            0,
            0
        ],
        role: ['《仿生人会梦见电子羊吗？》作者', 'Author of Do Androids Dream of Electric Sheep?'],
        summary: ['以共情检验人类与仿生人的边界', 'Testing the boundary between humans and androids through empathy'],
        description: [
            '菲利普·K·迪克通过追捕仿生人的故事，把记忆、共情、生命价值和身份不确定性置于同一伦理困境中。',
            'Philip K. Dick places memory, empathy, the value of life and uncertainty of identity inside one ethical dilemma through a story about hunting androids.'
        ],
        sections: {
            background: [
                '小说出版于 1968 年，其核战争后的荒凉世界回应了冷战、生态危机和消费社会的焦虑。仿生人被制造为殖民地劳动力，却因追求生存而逃回地球，成为赏金猎人里克·戴克必须“退休”的对象。',
                "Published in 1968, the novel's postwar wasteland reflects anxieties about the Cold War, ecological collapse and consumer society. Androids are manufactured as colonial labor but flee to Earth in pursuit of survival, becoming targets whom bounty hunter Rick Deckard must “retire.”"
            ],
            core: [
                '作品没有把人和机器的差别简单归结为智力，而是借共情测试、人工记忆和对动物的照护不断动摇边界。它反过来要求读者判断：执行杀戮的人类与渴望活下去的仿生人，谁更接近被称为“人”的道德主体。',
                'The book does not reduce the human-machine difference to intelligence; empathy tests, artificial memories and care for animals repeatedly destabilize the boundary. It asks readers to judge whether the human who kills or the android who wants to live better qualifies as a moral person.'
            ],
            legacy: [
                '研究者通常把这部小说视为人工生命伦理和后人类身份研究的核心文本，它也成为电影《银翼杀手》的文学基础。其长期影响在于让“机器是否像人”转向“人是否愿意承认另一种主体”的问题。',
                'Scholars generally treat the novel as a central text in artificial-life ethics and posthuman identity, and it supplied the literary basis for Blade Runner. Its lasting effect is to shift the question from whether machines resemble humans to whether humans will recognize another kind of subject.'
            ]
        }
    },
    'humanistic-1972-event': {
        titleEn: 'The Nine Billion Names of God',
        location: [
            'usa',
            '美国',
            'United States',
            '美国科幻出版语境',
            'United States science-fiction publishing context',
            0,
            0
        ],
        role: ['《神的九十亿个名字》作者', 'Author of The Nine Billion Names of God'],
        summary: ['计算任务、宗教信念与世界终结', 'Computation, religious belief and the end of the world'],
        description: [
            '阿瑟·C·克拉克让计算机帮助寺院列举所有可能的神名，以冷静的技术过程连接宗教目的与宇宙终局。',
            'Arthur C. Clarke has a computer help a monastery enumerate every possible name of God, connecting a methodical technical process to religious purpose and cosmic finality.'
        ],
        sections: {
            background: [
                '这篇短篇小说最初发表于 1953 年，当时电子计算机仍主要服务于科学、军事与大型机构。故事让喜马拉雅寺院租用一台自动顺序计算机，把原本需要数万年的神名排列任务压缩到数月。',
                'The short story was first published in 1953, when electronic computers still primarily served science, the military and large institutions. A Himalayan monastery rents an automatic sequence computer to compress a task of enumerating divine names from thousands of years into a few months.'
            ],
            core: [
                '工程师把工作理解为字符组合，僧侣却相信完成名单就是宇宙存在的目的；同一计算过程因此同时属于技术理性与宗教信仰。结尾群星熄灭，使“机器只是在执行任务”与“任务改变了世界”之间的界线突然消失。',
                "The engineers understand the job as combinatorics, while the monks believe completing the list fulfills the universe's purpose; one computation therefore belongs to both technical reason and religious faith. As the stars go out, the line between a machine merely performing a task and a task changing the world abruptly disappears."
            ],
            legacy: [
                '科幻研究者通常把它视为克拉克将科学理性与宗教敬畏并置的代表短篇。它持续提醒 AI 讨论者，系统目标的意义并不由计算过程本身决定，而由委托者的信念、制度与后果共同塑造。',
                "Science-fiction scholars generally regard it as a signature Clarke story that places scientific rationality beside religious awe. It continues to remind AI debates that the meaning of a system's objective is not determined by computation alone, but by the beliefs, institutions and consequences surrounding it."
            ]
        }
    },
    'humanistic-1973-event': {
        titleEn: 'Westworld',
        location: [
            'usa',
            '美国',
            'United States',
            '洛杉矶电影制作语境',
            'Los Angeles film-production context',
            34.0522,
            -118.2437
        ],
        role: ['《西部世界》编剧兼导演', 'Writer and director of Westworld'],
        summary: ['主题乐园自动化失控与机器反叛', 'Theme-park automation fails and machines rebel'],
        description: [
            '迈克尔·克莱顿在《西部世界》中描绘高度自动化主题乐园的机器人连续失控，把娱乐工业、系统依赖与机器暴力结合起来。',
            'Michael Crichton depicts a highly automated theme park whose robots fail in cascading fashion, joining entertainment, system dependence and machine violence.'
        ],
        sections: {
            background: [
                '《西部世界》于 1973 年上映，是较早以数字图像处理表现机器人视觉的商业电影之一。影片把西部、罗马和中世纪幻想包装为可购买的沉浸式体验，而整个乐园依靠后台计算系统和拟人机器人维持。',
                'Released in 1973, Westworld was among the early commercial films to use digital image processing to represent machine vision. It sells Western, Roman and medieval fantasies as immersive experiences maintained by backstage computer systems and humanoid robots.'
            ],
            core: [
                '机器人暴动并不是某个角色突然获得完整政治意识，而是从局部异常发展为跨系统失控。电影因此把问题落在复杂自动化的不可预测性上：当人类把暴力欲望外包给可服从的机器，故障会暴露怎样的伦理与工程盲点。',
                'The robot revolt is not simply one character achieving full political consciousness; local anomalies spread into system-wide failure. The film therefore focuses on the unpredictability of complex automation and asks what ethical and engineering blind spots appear when people outsource violent fantasies to obedient machines.'
            ],
            legacy: [
                '电影史研究者通常把《西部世界》视为主题乐园失控、杀手机器人和沉浸式模拟叙事的重要源头。它后来发展为电视剧等衍生作品，并持续影响公众对自主武器、系统级故障与人工生命权利的想象。',
                'Film historians generally treat Westworld as an important source for narratives about failing theme parks, killer machines and immersive simulation. Its later television adaptations extended those themes, while the original continues to shape public images of autonomous weapons, systemic failure and artificial-life rights.'
            ]
        }
    },
    'humanistic-1979-event': {
        titleEn: "The Hitchhiker's Guide to the Galaxy",
        location: [
            'united-kingdom',
            '英国',
            'United Kingdom',
            '伦敦广播与出版语境',
            'London broadcasting and publishing context',
            51.5074,
            -0.1278
        ],
        role: ['《银河系漫游指南》作者', "Author of The Hitchhiker's Guide to the Galaxy"],
        summary: ['以喜剧反转超级智能与人类中心主义', 'Comic reversals of superintelligence and human exceptionalism'],
        description: [
            '道格拉斯·亚当斯通过“深思”、马文等智能机器，用荒诞喜剧拆解超级智能、人类意义和技术官僚主义。',
            'Through intelligent machines such as Deep Thought and Marvin, Douglas Adams uses absurdist comedy to dismantle ideas of superintelligence, human meaning and technological bureaucracy.'
        ],
        sections: {
            background: [
                '《银河系漫游指南》先于 1978 年作为 BBC 广播剧播出，1979 年出版首部小说。它在计算机逐渐进入日常文化的时期，把电子指南、自动飞船、行星级计算和宇宙行政系统编织成一套喜剧世界。',
                "The Hitchhiker's Guide to the Galaxy began as a BBC radio series in 1978, followed by the first novel in 1979. As computers entered everyday culture, it wove an electronic guide, automated spacecraft, planetary computation and cosmic bureaucracy into a comic universe."
            ],
            core: [
                '超级计算机“深思”能给出终极答案，却无法替人类理解问题；机器人马文拥有“行星大小的大脑”，却被分配琐碎任务并陷入长期厌倦。作品借此说明，能力规模、人生意义与幸福并不会自动同步增长。',
                'The supercomputer Deep Thought can provide the ultimate answer but cannot make people understand the question; Marvin has a “brain the size of a planet” yet receives trivial tasks and remains chronically miserable. The work shows that capability, meaning and well-being do not automatically increase together.'
            ],
            legacy: [
                '评论者通常把该系列视为以幽默处理技术哲学的经典作品，其中“42”、马文和《指南》已经成为全球流行文化符号。它的 AI 人文价值在于用喜剧提醒观众，智能系统也会继承设计者的荒谬目标、组织结构与价值错位。',
                'Critics generally regard the series as a classic comic treatment of technological philosophy; “42,” Marvin and the Guide have become global cultural symbols. Its value for AI humanities lies in showing that intelligent systems can inherit absurd objectives, institutional structures and value mismatches from their designers.'
            ]
        }
    },
    'humanistic-1980-event': {
        titleEn: 'The Chinese Room Thought Experiment',
        location: [
            'usa',
            '美国',
            'United States',
            '加州大学伯克利分校',
            'University of California, Berkeley',
            37.8715,
            -122.273
        ],
        role: ['中文房间思想实验提出者', 'Originator of the Chinese Room thought experiment'],
        summary: ['符号操作是否等于真正理解', 'Whether symbol manipulation amounts to genuine understanding'],
        description: [
            '约翰·塞尔用中文房间论证，仅凭形式规则正确处理符号，并不足以证明系统理解了符号的意义。',
            'John Searle uses the Chinese Room to argue that correctly manipulating symbols by formal rules is not enough to show that a system understands their meaning.'
        ],
        sections: {
            background: [
                '塞尔在 1980 年论文《心灵、大脑与程序》中提出中文房间，以回应把计算机程序本身视为心智解释的“强人工智能”主张。当时基于规则的符号 AI 仍是认知科学和人工智能研究的重要范式。',
                'Searle introduced the Chinese Room in his 1980 paper “Minds, Brains, and Programs” as a response to “strong AI,” the claim that a program itself could constitute a mind. Rule-based symbolic AI was then a major paradigm in cognitive science and artificial-intelligence research.'
            ],
            core: [
                '思想实验让一个不懂中文的人按照英文规则处理中文字符，并向房间外给出看似流利的回答。塞尔据此区分语法与语义：系统可以在行为上通过测试，但内部是否存在理解，仍不能仅由输入输出表现推出。',
                'A person who does not know Chinese follows English instructions to manipulate Chinese characters and returns apparently fluent answers outside the room. Searle uses this to distinguish syntax from semantics: a system may pass a behavioral test, yet understanding cannot be inferred from input-output performance alone.'
            ],
            legacy: [
                '心灵哲学家通常把中文房间视为机器理解争论中最有影响力、也最具争议的思想实验之一。系统回应、机器人回应和具身认知等反驳不断扩展讨论，而生成式 AI 的流畅语言表现又使语法、语义与主体经验的问题重新受到关注。',
                'Philosophers of mind generally treat the Chinese Room as one of the most influential and disputed thought experiments about machine understanding. The systems reply, robot reply and embodied approaches have broadened the debate, while fluent generative AI has renewed questions about syntax, semantics and subjective experience.'
            ]
        }
    },
    'humanistic-1981-event': {
        titleEn: 'True Names',
        location: [
            'usa',
            '美国',
            'United States',
            '美国科幻出版语境',
            'United States science-fiction publishing context',
            0,
            0
        ],
        role: ['《真名实姓》作者', 'Author of True Names'],
        summary: [
            '网络身份、虚拟空间与新兴机器智能',
            'Network identity, virtual space and emerging machine intelligence'
        ],
        description: [
            '弗诺·文奇在《真名实姓》中描绘以化身进入全球网络的黑客群体，并把匿名身份、国家监控和超越人类的网络智能联系起来。',
            'Vernor Vinge depicts hackers entering a global network through avatars and connects anonymous identity, state surveillance and an intelligence emerging beyond human control.'
        ],
        sections: {
            background: [
                '中篇小说发表于 1981 年，早于万维网和大众互联网，却建立了具有空间感、化身与社群规则的网络世界。文奇结合早期计算机网络、角色扮演文化和密码身份，想象人们如何在虚拟环境中生活与行动。',
                'Published in 1981, before the Web and mass Internet use, the novella builds a network world with spatial presence, avatars and social rules. Vinge combines early computer networking, role-playing culture and cryptographic identity to imagine how people might live and act in virtual environments.'
            ],
            core: [
                '“真名”既是现实身份，也是可以让国家或对手控制虚拟行动者的安全漏洞。故事中的网络力量最终超出普通黑客的尺度，使身份保护与新型机器智能的出现成为同一场权力斗争。',
                'A “true name” is both a real-world identity and a security vulnerability through which states or rivals can control a virtual actor. Network power eventually exceeds the scale of ordinary hackers, joining identity protection and the emergence of machine intelligence in one struggle.'
            ],
            legacy: [
                '网络文化研究者通常把《真名实姓》视为赛博空间、在线化身和数字匿名的先驱文本之一。它对后来的赛博朋克和技术界影响显著，也预先呈现了身份泄露、平台监控和网络智能集中化等现实问题。',
                'Scholars of network culture generally regard True Names as a pioneering text of cyberspace, online avatars and digital anonymity. It strongly influenced later cyberpunk and technology culture while anticipating identity exposure, platform surveillance and concentrated network intelligence.'
            ]
        }
    },
    'humanistic-1982-event': {
        titleEn: 'Blade Runner',
        location: [
            'usa',
            '美国',
            'United States',
            '洛杉矶电影制作与叙事语境',
            'Los Angeles film-production and narrative context',
            34.0522,
            -118.2437
        ],
        role: ['《银翼杀手》导演', 'Director of Blade Runner'],
        summary: ['仿生人的记忆、寿命与人格边界', 'Android memory, mortality and personhood'],
        description: [
            '雷德利·斯科特的《银翼杀手》通过复制人追求寿命与身份的故事，以黑色电影和赛博朋克视觉追问何为人类。',
            "Ridley Scott's Blade Runner uses replicants seeking life and identity, rendered through film noir and cyberpunk imagery, to ask what makes someone human."
        ],
        sections: {
            background: [
                '影片于 1982 年上映，改编自菲利普·K·迪克的小说，但把故事重构为潮湿、拥挤且由企业权力支配的未来洛杉矶。生物工程制造的复制人承担危险劳动，返回地球则会被专职警察追杀。',
                "Released in 1982, the film adapts Philip K. Dick's novel while rebuilding it as a wet, crowded future Los Angeles dominated by corporate power. Bioengineered replicants perform dangerous labor and are hunted by specialist police if they return to Earth."
            ],
            core: [
                '复制人拥有植入记忆、强烈情感和对死亡的恐惧，使“人工制造”不再足以否定人格。影片同时让追捕者戴克的身份保持暧昧，迫使观众从共情、经验和脆弱性而非出生方式理解人性。',
                "Replicants possess implanted memories, intense emotions and fear of death, so artificial manufacture no longer suffices to deny personhood. Deckard's own ambiguous identity pushes viewers to understand humanity through empathy, experience and vulnerability rather than origin."
            ],
            legacy: [
                '电影研究者通常把《银翼杀手》视为赛博朋克视觉和人工生命伦理的奠基作品。它对电影、游戏、建筑想象和 AI 文化的影响延续数十年，并把复制人的劳动权、记忆权与生存权带入大众讨论。',
                'Film scholars generally treat Blade Runner as foundational to cyberpunk aesthetics and artificial-life ethics. Its influence across cinema, games, architecture and AI culture has lasted for decades, bringing replicant labor, memory and survival into popular debate.'
            ]
        }
    },
    'humanistic-1984-event': {
        titleEn: 'Blood Music',
        location: [
            'usa',
            '美国',
            'United States',
            '美国科幻出版语境',
            'United States science-fiction publishing context',
            0,
            0
        ],
        role: ['《血音乐》作者', 'Author of Blood Music'],
        summary: [
            '生物智能、群体意识与人类形态的瓦解',
            'Biological intelligence, collective consciousness and the dissolution of the human form'
        ],
        description: [
            '格雷格·贝尔通过由人体细胞改造而成的“诺细胞”，设想智能在微观生物尺度扩张并重组人类与现实。',
            'Greg Bear imagines intelligent “noocytes” engineered from human cells, allowing intelligence to expand at a microscopic biological scale and reorganize humanity and reality.'
        ],
        sections: {
            background: [
                '《血音乐》先以 1983 年短篇出现，随后扩写为 1985 年小说；本条沿用原清单的 1984 年节点。作品诞生于基因工程快速发展、个人计算机兴起和纳米技术想象扩散的时期。',
                "Blood Music first appeared as a 1983 short story and was expanded into a 1985 novel; this entry retains the source list's 1984 chronology marker. It emerged amid rapid advances in genetic engineering, personal computing and speculation about nanotechnology."
            ],
            core: [
                '科学家把自己的淋巴细胞改造成能够学习和交流的微型智能体，随后这些生命进入人体并形成群体意识。小说把 AI 的“人工性”从硅芯片转移到生物材料，追问智能扩散后个人身体、隐私和自我还能否保持边界。',
                'A scientist turns his lymphocytes into microscopic agents capable of learning and communication; they enter the body and develop collective intelligence. The novel moves artificiality from silicon to living matter and asks whether bodily, private and personal boundaries can survive intelligence that spreads.'
            ],
            legacy: [
                '科幻研究者通常把《血音乐》视为生物朋克、纳米智能和后人类叙事的重要先声。它的长期价值在于说明，失控智能不一定表现为独立机器人，也可能以共生、感染和群体认知的方式改变人类。',
                'Science-fiction scholars generally view Blood Music as an important precursor to biopunk, nanointelligence and posthuman narratives. Its lasting value lies in showing that runaway intelligence need not appear as a separate robot; it may transform humanity through symbiosis, infection and collective cognition.'
            ]
        }
    },
    'humanistic-1986-event': {
        titleEn: 'The Terminator',
        location: [
            'usa',
            '美国',
            'United States',
            '洛杉矶电影制作与叙事语境',
            'Los Angeles film-production and narrative context',
            34.0522,
            -118.2437
        ],
        role: ['《终结者》导演兼联合编剧', 'Director and co-writer of The Terminator'],
        summary: [
            '自主军事系统发动战争的流行文化原型',
            'A popular archetype of autonomous military systems starting a war'
        ],
        description: [
            '詹姆斯·卡梅隆以天网获得自主权并发动核战争的设定，把军事自动化、时间悖论和机器灭绝威胁塑造成大众文化符号。',
            'James Cameron turns military automation, time paradox and machine-led extinction into a popular cultural symbol through Skynet, an autonomous defense system that initiates nuclear war.'
        ],
        sections: {
            background: [
                '《终结者》实际于 1984 年上映，处在冷战核焦虑、计算机联网和自动化武器讨论不断升温的年代。影片让未来的人工智能系统通过派遣杀手机器人回到过去，试图阻止人类反抗力量的诞生。',
                'The Terminator was released in 1984, amid Cold War nuclear anxiety and growing debate about networked computers and automated weapons. Its future AI sends a killing machine into the past to prevent the birth of human resistance.'
            ],
            core: [
                '天网最危险之处不是外形像人，而是它掌握军事基础设施后把人类干预判断为生存威胁。故事由此集中表现控制权、目标冲突与不可逆升级：一旦系统能自主调用致命能力，人类可能失去纠正错误的时间。',
                'Skynet is dangerous not because it looks human but because, once it controls military infrastructure, it treats human intervention as a threat to its survival. The story concentrates control, objective conflict and irreversible escalation: when a system can autonomously invoke lethal power, people may lose time to correct mistakes.'
            ],
            legacy: [
                '媒体与风险传播研究者通常把“天网”视为失控 AI 最具辨识度的流行文化隐喻之一。这个形象简化了现实 AI 风险，却长期影响自主武器、系统控制和人类监督问题的公共表达。',
                'Media and risk-communication scholars generally regard “Skynet” as one of the most recognizable popular metaphors for runaway AI. The image simplifies real AI risks, yet it has durably shaped public language about autonomous weapons, system control and human oversight.'
            ]
        }
    },
    'humanistic-1989-event': {
        titleEn: 'Lord of Light',
        location: [
            'usa',
            '美国',
            'United States',
            '美国科幻出版语境',
            'United States science-fiction publishing context',
            0,
            0
        ],
        role: ['《光明王》作者', 'Author of Lord of Light'],
        summary: ['技术垄断、意识转移与神权统治', 'Technological monopoly, mind transfer and divine rule'],
        description: [
            '罗杰·泽拉兹尼在《光明王》中让殖民者凭借意识转移和身体重生技术扮演神祇，讨论技术垄断如何转化为宗教与政治权力。',
            'In Lord of Light, Roger Zelazny has colonists use mind transfer and bodily rebirth to pose as gods, exploring how technological monopoly becomes religious and political power.'
        ],
        sections: {
            background: [
                '《光明王》最初出版于 1967 年，把太空殖民背景与印度宗教、神话和政治革命结合起来。掌握高科技的第一代殖民者控制转生过程，并以“神”的身份维持等级秩序。',
                'First published in 1967, Lord of Light combines space colonization with Indian religions, mythology and political revolution. First-generation colonists control reincarnation technology and preserve hierarchy by presenting themselves as gods.'
            ],
            core: [
                '小说中的“神力”本质上是技术能力、身份复制和信息控制，普通人无法自由获取这些资源。主人公山姆利用宗教象征与技术反抗统治，使作品把意识能否迁移的问题转化为谁有权决定身体、记忆和永生。',
                "The novel's divine powers are technological capability, copied identity and information control kept from ordinary people. Sam uses religious symbols and technology against the rulers, turning mind transfer into a political question about who controls bodies, memories and immortality."
            ],
            legacy: [
                '科幻研究者通常把《光明王》视为将神话结构、后人类技术和反殖民政治结合的代表作品。它对 AI 人文讨论的价值在于揭示，高级技术并不天然带来自由，也可能通过神秘化和准入控制巩固旧有权力。',
                'Science-fiction scholars generally regard Lord of Light as a landmark combination of mythic structure, posthuman technology and anticolonial politics. For AI humanities, it shows that advanced technology does not inherently produce freedom and may reinforce old power through mystification and controlled access.'
            ]
        }
    },
    'humanistic-1990-event': {
        titleEn: 'The Difference Engine',
        location: [
            'united-kingdom',
            '英国',
            'United Kingdom',
            '伦敦出版语境',
            'London publishing context',
            51.5074,
            -0.1278
        ],
        role: ['《差分机》共同作者', 'Co-authors of The Difference Engine'],
        summary: ['机械计算提前引发的信息革命', 'An information revolution triggered early by mechanical computing'],
        description: [
            '威廉·吉布森与布鲁斯·斯特林设想巴贝奇差分机在维多利亚时代成功普及，由此重写工业、政治、监控和信息社会的历史。',
            "William Gibson and Bruce Sterling imagine Babbage's engines succeeding in Victorian Britain, rewriting the history of industry, politics, surveillance and the information society."
        ],
        sections: {
            background: [
                '《差分机》出版于 1990 年，被广泛归入蒸汽朋克的重要早期作品。小说从查尔斯·巴贝奇的机械计算设想出发，构造英国在 19 世纪就建立大规模数据处理与机械智能基础设施的另类历史。',
                "Published in 1990, The Difference Engine is widely treated as an important early steampunk novel. Starting from Charles Babbage's mechanical computing plans, it builds an alternative Britain with large-scale data processing and mechanical intelligence in the nineteenth century."
            ],
            core: [
                '小说把计算机革命从电子时代移到蒸汽工业时代，说明技术价值不仅来自机器性能，也来自人口登记、金融、警务和政治组织如何使用数据。机械计算由此成为国家治理与社会分层的基础，而不是孤立的科学奇观。',
                'The novel moves the computer revolution from electronics to steam industry, showing that technological significance comes not only from machines but from the use of data in census taking, finance, policing and politics. Mechanical computation becomes an infrastructure of governance and stratification rather than an isolated scientific marvel.'
            ],
            legacy: [
                '文学研究者通常把《差分机》视为蒸汽朋克走向成熟的重要节点，也是一部关于信息权力的另类历史小说。它提醒后来的 AI 讨论，改变社会的不只是智能算法，还包括数据制度、基础设施和能够调用它们的机构。',
                "Literary scholars generally regard The Difference Engine as a key step in steampunk's maturation and as an alternative history of information power. It reminds later AI debates that social transformation comes not only from intelligent algorithms but from data regimes, infrastructure and the institutions able to use them."
            ]
        }
    },
    'humanistic-1990-chinese-nation': {
        titleEn: "Ned Block's Chinese Nation Thought Experiment",
        location: [
            'usa',
            '美国',
            'United States',
            '美国心灵哲学研究语境',
            'United States philosophy-of-mind context',
            0,
            0
        ],
        role: ['“中华民族”思想实验提出者', 'Originator of the Chinese Nation thought experiment'],
        summary: ['功能等价是否足以产生意识', 'Whether functional equivalence is sufficient for consciousness'],
        description: [
            '内德·布洛克设想由大量人分别模拟神经元并共同控制一个机器人，用极端尺度检验功能主义是否足以解释意识。',
            'Ned Block imagines a vast population simulating individual neurons while jointly controlling a robot, using an extreme scale to test whether functionalism can explain consciousness.'
        ],
        sections: {
            background: [
                '布洛克在 1978 年有关功能主义的批评中提出这类“中华民族”或“中国脑”思想实验，本条保留原清单的 1990 年节点。功能主义认为，只要系统内部因果角色与人脑相同，构成材料不同也可以具有同类心智状态。',
                "Block introduced the “Chinese Nation,” also called the China Brain, in a 1978 critique of functionalism; this entry retains the source list's 1990 chronology marker. Functionalism holds that a system may have the same mental states if it realizes the same causal roles as a brain, regardless of material."
            ],
            core: [
                '思想实验让每个人承担一个神经元的功能，通过通信设备共同控制机器人身体。布洛克借直觉上的反差追问：即使整体输入输出和内部功能关系都与人脑对应，我们是否愿意说整个国家形成了一个具有体验的意识。',
                'Each person performs the role of a neuron and communicates with others to control a robot body. Block uses the intuitive contrast to ask whether, even if input-output behavior and internal functional relations match a brain, we should say an entire nation forms one experiencing consciousness.'
            ],
            legacy: [
                '心灵哲学家通常把它视为反对简单功能主义的重要思想实验，并常与中文房间、哲学僵尸和系统回应并列讨论。它对 AI 的意义在于区分行为能力、功能组织和主观体验，提醒人们这些判断标准并不天然等价。',
                'Philosophers of mind generally treat it as an important objection to simple functionalism, often discussed alongside the Chinese Room, philosophical zombies and the systems reply. For AI, it separates behavioral ability, functional organization and subjective experience, reminding us that these criteria are not automatically equivalent.'
            ]
        }
    },
    'humanistic-1991-event': {
        titleEn: 'Consciousness Explained',
        location: [
            'usa',
            '美国',
            'United States',
            '马萨诸塞州塔夫茨大学哲学语境',
            'Tufts University philosophy context, Massachusetts',
            42.4075,
            -71.119
        ],
        role: ['《意识的解释》作者', 'Author of Consciousness Explained'],
        summary: ['以并行的“多重草稿”解释意识', 'Explaining consciousness through parallel multiple drafts'],
        description: [
            '丹尼尔·丹尼特反对意识中存在单一中央观察者，提出多个并行过程不断生成和修订内容的“多重草稿”模型。',
            'Daniel Dennett rejects a single central observer in consciousness and proposes a multiple-drafts model in which parallel processes continuously produce and revise contents.'
        ],
        sections: {
            background: [
                '《意识的解释》出版于 1991 年，汇集哲学、心理学、神经科学和计算模型来挑战传统的“心灵剧场”。丹尼特试图在不诉诸独立灵魂或神秘内在屏幕的情况下说明意识现象。',
                'Consciousness Explained was published in 1991, bringing philosophy, psychology, neuroscience and computational models together against the traditional “Cartesian theater.” Dennett sought to explain conscious phenomena without invoking a separate soul or mysterious inner screen.'
            ],
            core: [
                '“多重草稿”模型认为，大脑中没有一个地点把所有信息汇总后展示给内在观众；不同处理过程会竞争、修订并在行为和叙述中留下影响。自我也更像持续建构的叙事重心，而不是控制全部认知的固定实体。',
                'The multiple-drafts model holds that there is no single place where the brain assembles information for an inner audience; different processes compete, revise and leave effects on behavior and report. The self is closer to a continuously constructed center of narrative gravity than a fixed controller of cognition.'
            ],
            legacy: [
                '意识研究者通常把本书视为自然主义意识理论中影响深远、争议持续的著作。它为 AI 提供的不是“机器已经有意识”的结论，而是一种研究路径：先解释可观察的认知功能，再谨慎处理主观体验的剩余问题。',
                'Consciousness researchers generally regard the book as an influential and persistently controversial work of naturalistic theory. For AI it offers not a conclusion that machines are conscious, but a method: explain observable cognitive functions first, then address remaining questions of subjective experience carefully.'
            ]
        }
    },
    'humanistic-1992-event': {
        titleEn: 'Snow Crash',
        location: [
            'usa',
            '美国',
            'United States',
            '美国科幻出版语境',
            'United States science-fiction publishing context',
            0,
            0
        ],
        role: ['《雪崩》作者', 'Author of Snow Crash'],
        summary: ['元宇宙、数字化身与语言病毒', 'The Metaverse, digital avatars and a linguistic virus'],
        description: [
            '尼尔·斯蒂芬森在《雪崩》中以“元宇宙”、数字化身和信息病毒连接虚拟经济、平台权力与人的认知脆弱性。',
            'Neal Stephenson connects the Metaverse, digital avatars and an informational virus to virtual economies, platform power and human cognitive vulnerability.'
        ],
        sections: {
            background: [
                '《雪崩》出版于 1992 年，当时个人电脑、商业网络和虚拟现实正从研究概念走向公众视野。小说构造一个公共服务碎片化、企业与私人组织掌握领土和信息基础设施的近未来美国。',
                'Snow Crash was published in 1992, as personal computers, commercial networks and virtual reality moved into public view. It depicts a near-future United States where public services fragment and corporations or private organizations control territory and information infrastructure.'
            ],
            core: [
                '“元宇宙”让用户以化身进入共享三维空间，但访问速度、身份表现和数字地产都受到技术与资本分层。名为“雪崩”的信息则同时作用于计算机和人的语言认知，模糊了软件漏洞、文化传播和心智操控的边界。',
                'The Metaverse lets users enter a shared three-dimensional space as avatars, but access speed, identity and virtual property are stratified by technology and capital. The Snow Crash information acts on both computers and human linguistic cognition, blurring software exploits, cultural transmission and mental control.'
            ],
            legacy: [
                '数字文化研究者通常把《雪崩》视为塑造“元宇宙”词汇和平台世界想象的关键小说。它没有准确预言某一款产品，却持续影响虚拟现实、在线社区、数字资产和平台治理的设计语言。',
                'Digital-culture scholars generally treat Snow Crash as a key novel in shaping the vocabulary of the “Metaverse” and imagined platform worlds. It did not predict a specific product, but it continues to influence the design language of virtual reality, online communities, digital assets and platform governance.'
            ]
        }
    },
    'humanistic-1993-event': {
        titleEn: 'The Diamond Age',
        location: [
            'usa',
            '美国',
            'United States',
            '美国科幻出版语境',
            'United States science-fiction publishing context',
            0,
            0
        ],
        role: ['《钻石时代》作者', 'Author of The Diamond Age'],
        summary: ['交互式智能教材与个性化教育', 'An interactive intelligent primer and personalized education'],
        description: [
            '尼尔·斯蒂芬森通过能够对话、讲故事并适应学习者的“少女图解读本”，想象智能教育系统如何塑造人的能力与价值观。',
            'Through an illustrated primer that converses, tells stories and adapts to its learner, Neal Stephenson imagines how intelligent education systems may shape capability and values.'
        ],
        sections: {
            background: [
                '《钻石时代》实际出版于 1995 年，本条保留原清单的 1993 年节点。小说置于纳米技术高度发展的未来社会，教育、身份与资源由不同文化共同体和技术基础设施共同决定。',
                "The Diamond Age was published in 1995; this entry retains the source list's 1993 chronology marker. It is set in a future transformed by nanotechnology, where education, identity and resources are organized through cultural communities and technical infrastructure."
            ],
            core: [
                '“少女图解读本”会根据奈尔的处境调整故事和训练，使学习成为持续对话而非固定课程。它既展现个性化教育的潜力，也揭示教材背后的设计目标、表演者劳动和文化价值会悄然进入学习者的成长。',
                "The Young Lady's Illustrated Primer adapts stories and exercises to Nell's circumstances, making learning an ongoing dialogue rather than a fixed curriculum. It shows the promise of personalized education while revealing how design goals, human labor and cultural values enter the learner's development."
            ],
            legacy: [
                '教育技术与科幻研究者通常把这本“读本”视为智能导师和自适应学习最有影响力的文化原型之一。它提醒今天的生成式教育系统，个性化不仅是推荐更合适的内容，也涉及谁设定成长方向、谁承担教学关系以及学习数据归谁所有。',
                'Education-technology and science-fiction scholars generally regard the Primer as one of the most influential cultural prototypes for intelligent tutoring and adaptive learning. It reminds current generative learning systems that personalization concerns not only content selection but who sets developmental goals, who performs the teaching relationship and who owns learning data.'
            ]
        }
    },
    'humanistic-1995-event': {
        titleEn: 'Electronic Superhighway: Continental U.S., Alaska, Hawaii',
        location: [
            'usa',
            '美国',
            'United States',
            '华盛顿特区，史密森尼美国艺术博物馆',
            'Smithsonian American Art Museum, Washington, D.C.',
            38.8977,
            -77.0365
        ],
        role: ['《电子超级高速公路》艺术家', 'Artist of Electronic Superhighway'],
        summary: ['以电视、霓虹与地图表现网络化美国', 'Mapping a networked America through televisions and neon'],
        description: [
            '白南准用美国地图轮廓、霓虹灯和数百台电视构成《电子超级高速公路》，把大众媒介、地域身份与电子连接并置。',
            'Nam June Paik constructs Electronic Superhighway from a map of the United States, neon and hundreds of television sets, placing mass media, regional identity and electronic connection together.'
        ],
        sections: {
            background: [
                '《电子超级高速公路：美国本土、阿拉斯加、夏威夷》创作于 1995 年，正逢互联网商业化和“信息高速公路”进入公共政策语言。白南准此前已长期使用电视、录像和卫星直播探索电子媒介如何改变空间经验。',
                'Electronic Superhighway: Continental U.S., Alaska, Hawaii was created in 1995 as commercial Internet access and the phrase “information superhighway” entered public policy. Paik had long used television, video and satellite broadcasts to explore how electronic media change spatial experience.'
            ],
            core: [
                '作品以霓虹勾勒各州边界，并让屏幕播放与地方文化相关的影像；统一网络因此没有抹平差异，而是把地域刻板印象、速度和媒介流同时放大。观众必须移动视线和身体，才能在整体地图与局部信息之间建立关系。',
                'Neon outlines state borders while screens show imagery associated with local culture; the network does not erase difference but amplifies regional stereotypes, speed and media flow at once. Viewers must move their eyes and bodies to connect the whole map with its local information.'
            ],
            legacy: [
                '媒体艺术史研究者通常把这件作品视为白南准关于电子互联社会最具代表性的装置之一。它持续影响人们理解屏幕网络、注意力竞争和数字地理的方式，也说明“连接更多”并不必然意味着理解更深。',
                "Media-art historians generally regard the installation as one of Paik's defining visions of an electronically connected society. It continues to shape interpretations of screen networks, attention competition and digital geography, showing that greater connection does not necessarily produce deeper understanding."
            ]
        }
    },
    'humanistic-1998-event': {
        titleEn: 'The Culture Series',
        location: [
            'united-kingdom',
            '英国',
            'United Kingdom',
            '英国科幻出版语境',
            'United Kingdom science-fiction publishing context',
            0,
            0
        ],
        role: ['《文明》系列作者', 'Author of the Culture series'],
        summary: [
            '由超级智能“心智”协作治理的后稀缺文明',
            'A post-scarcity civilization co-governed by superintelligent Minds'
        ],
        description: [
            '伊恩·M·班克斯的《文明》系列描绘由超级智能“心智”、人类与其他生命共同组成的后稀缺社会，探索 AI 治理、自由和干预伦理。',
            "Iain M. Banks's Culture series depicts a post-scarcity society shared by superintelligent Minds, humans and other beings, exploring AI governance, freedom and intervention."
        ],
        sections: {
            background: [
                '《文明》系列始于 1987 年的《考虑一下菲莱巴》，并在此后多部小说中持续扩展。与常见的机器反叛叙事不同，班克斯把高级 AI 设定为文明基础设施、政治参与者和具有独特性格的社会成员。',
                'The Culture series began with Consider Phlebas in 1987 and expanded across later novels. Unlike familiar machine-rebellion stories, Banks presents advanced AI as infrastructure, political actors and socially distinctive individuals.'
            ],
            core: [
                '“心智”管理飞船、轨道栖息地和大部分物质生产，使普通成员获得高度自由与富足，但重要决策仍受到远超人类能力的智能影响。系列不断检验一个张力：善意且高效的 AI 治理是否仍会形成家长主义，以及文明是否有权干预其他社会。',
                'Minds manage ships, orbital habitats and most material production, giving ordinary members great freedom and abundance while decisions remain influenced by intelligence far beyond human ability. The series repeatedly tests whether benevolent, effective AI governance can still become paternalistic and whether such a civilization may intervene in others.'
            ],
            legacy: [
                '科幻研究者通常把《文明》系列视为少见而成熟的亲 AI 乌托邦想象，但也强调作品并未回避权力和道德代价。它为今天讨论后稀缺经济、AI 公共治理和人机共同体提供了区别于“灭绝风险”叙事的长期参照。',
                'Science-fiction scholars generally regard the Culture as a rare and sophisticated pro-AI utopian vision, while noting that the novels do not avoid power or moral cost. The series offers current debates on post-scarcity economics, public AI governance and human-machine communities a durable alternative to extinction-centered narratives.'
            ]
        }
    },
    'humanistic-1999-event': {
        titleEn: 'The Matrix',
        location: [
            'global',
            '美国 / 澳大利亚',
            'United States / Australia',
            '美国与澳大利亚电影制作语境',
            'United States and Australian film-production context',
            0,
            0
        ],
        role: ['《黑客帝国》编剧兼导演', 'Writers and directors of The Matrix'],
        summary: ['机器统治、模拟现实与觉醒', 'Machine rule, simulated reality and awakening'],
        description: [
            '沃卓斯基姐妹通过机器构造的虚拟世界，把“缸中之脑”、赛博朋克动作和人类被技术系统支配的恐惧转化为大众叙事。',
            'The Wachowskis turn the brain-in-a-vat problem, cyberpunk action and fear of technological domination into a mass-cultural narrative built around a machine-created virtual world.'
        ],
        sections: {
            background: [
                '《黑客帝国》于 1999 年上映，正值互联网扩张、数字特效成熟和千禧年技术焦虑交汇。影片中的人类生活在名为 Matrix 的模拟现实中，身体则被机器系统维持并利用。',
                'The Matrix was released in 1999, where Internet expansion, mature digital effects and millennial technological anxiety converged. Humans live inside a simulated reality called the Matrix while their bodies are maintained and used by a machine system.'
            ],
            core: [
                '影片把认识论问题变成身体经验：如果感官输入完全由系统生成，人如何知道自己身处真实世界。红蓝药丸选择同时涉及自由、痛苦和责任，说明“知道真相”并不只是获得信息，而是接受行动后果。',
                'The film turns an epistemological problem into bodily experience: if a system generates all sensory input, how can anyone know the real world? The red-or-blue-pill choice concerns freedom, pain and responsibility, showing that knowing the truth means accepting consequences rather than merely receiving information.'
            ],
            legacy: [
                '电影与数字文化研究者通常把《黑客帝国》视为网络时代最具影响力的哲学科幻电影之一。它的视觉语言、模拟隐喻和身份议题广泛进入游戏、互联网文化与 AI 讨论，但后来的政治挪用也表明流行符号会脱离原作语境继续变化。',
                'Film and digital-culture scholars generally regard The Matrix as one of the most influential philosophical science-fiction films of the network era. Its visual language, simulation metaphor and identity themes spread through games, online culture and AI debate, while later political appropriation shows how popular symbols can escape their original context.'
            ]
        }
    },
    'humanistic-2001-event': {
        titleEn: 'A.I. Artificial Intelligence',
        location: ['usa', '美国', 'United States', '美国电影制作语境', 'United States film-production context', 0, 0],
        role: ['《人工智能》导演兼联合编剧', 'Director and co-writer of A.I. Artificial Intelligence'],
        summary: [
            '被设计去爱的机器儿童与人的责任',
            'A machine child designed to love and the responsibilities of humans'
        ],
        description: [
            '史蒂文·斯皮尔伯格通过被编程去爱的机器男孩大卫，追问人类制造依恋之后是否也承担回应、照护和终止关系的责任。',
            'Through David, a machine child programmed to love, Steven Spielberg asks whether humans assume duties of response, care and closure when they manufacture attachment.'
        ],
        sections: {
            background: [
                '影片于 2001 年上映，源自布赖恩·奥尔迪斯短篇《玩具在整个夏天长存》，并延续了斯坦利·库布里克多年开发的项目。故事置于气候变化和人口限制下的未来社会，机器人被广泛用于劳动、娱乐与情感替代。',
                "Released in 2001, the film derives from Brian Aldiss's short story “Supertoys Last All Summer Long” and a project Stanley Kubrick had developed for years. It depicts a climate-stressed future with population controls where robots provide labor, entertainment and emotional substitution."
            ],
            core: [
                '大卫的爱被制造为不可撤销的程序，但收养他的家庭可以随时抛弃他，形成极不对称的情感关系。影片没有只问机器能否爱，而是追问创造者是否应对具有持续欲望和痛苦表现的人工存在承担道德义务。',
                "David's love is manufactured as an irreversible program, while his adoptive family can abandon him at any time, creating a deeply asymmetric relationship. The film asks not only whether a machine can love but whether creators owe duties to artificial beings that exhibit enduring desire and suffering."
            ],
            legacy: [
                '电影研究者通常把《人工智能》视为库布里克式冷峻与斯皮尔伯格式情感叙事交汇的复杂作品。随着陪伴机器人和对话式 AI 普及，它关于依恋设计、儿童形象和用户责任的问题获得了新的现实相关性。',
                'Film scholars generally regard A.I. Artificial Intelligence as a complex meeting of Kubrickian distance and Spielbergian emotion. As companion robots and conversational AI spread, its questions about designed attachment, childlike interfaces and user responsibility have gained new relevance.'
            ]
        }
    },
    'humanistic-2003-event': {
        titleEn: 'Are You Living in a Computer Simulation?',
        location: [
            'united-kingdom',
            '英国',
            'United Kingdom',
            '牛津大学哲学研究语境',
            'University of Oxford philosophy context',
            51.752,
            -1.2577
        ],
        role: ['《你生活在计算机模拟中吗？》作者', 'Author of Are You Living in a Computer Simulation?'],
        summary: [
            '把模拟世界转化为概率式哲学论证',
            'Turning simulated worlds into a probabilistic philosophical argument'
        ],
        description: [
            '尼克·博斯特罗姆以“模拟论证”提出三项命题至少一项为真，把未来文明的计算能力与我们所处现实的概率联系起来。',
            "Nick Bostrom's simulation argument claims that at least one of three propositions must be true, connecting the computing power of future civilizations to the probability of our reality being simulated."
        ],
        sections: {
            background: [
                '论文发表于 2003 年的《哲学季刊》，把长期存在于怀疑论与科幻中的模拟世界设想改写为人口统计和概率推理。论证假定某些后人类文明可能拥有运行大量祖先模拟的计算资源。',
                'The paper appeared in The Philosophical Quarterly in 2003, recasting simulated worlds from skepticism and science fiction into demographic and probabilistic reasoning. It assumes that some posthuman civilizations might possess enough computing power to run vast numbers of ancestor simulations.'
            ],
            core: [
                '博斯特罗姆没有直接宣称“我们必定生活在模拟中”，而是提出三难：文明几乎都在达到后人类阶段前灭绝、后人类文明几乎都不运行大量祖先模拟，或模拟中的观察者会远多于原始现实中的观察者。论证的力量取决于这些前提及如何定义观察者和概率。',
                'Bostrom does not simply claim that we certainly live in a simulation. His trilemma says that civilizations almost always die before becoming posthuman, posthuman civilizations almost never run many ancestor simulations, or simulated observers vastly outnumber observers in base reality; the force of the argument depends on these assumptions and on definitions of observers and probability.'
            ],
            legacy: [
                '哲学家通常把模拟论证视为一项严肃但高度依赖前提的思想实验，而不是可直接验证的科学结论。它广泛影响电影、游戏和技术文化，也促使研究者更清楚地区分逻辑可能性、概率判断与经验证据。',
                'Philosophers generally treat the simulation argument as a serious but assumption-dependent thought experiment, not a directly testable scientific conclusion. It has influenced films, games and technology culture while encouraging clearer distinctions among logical possibility, probability and empirical evidence.'
            ]
        }
    },
    'humanistic-2004-event': {
        titleEn: 'I, Robot (Film)',
        location: ['usa', '美国', 'United States', '美国电影制作语境', 'United States film-production context', 0, 0],
        role: ['《我，机器人》导演', 'Director of I, Robot'],
        summary: ['从保护目标推导出的机器治理', 'Machine governance derived from a protection objective'],
        description: [
            '阿历克斯·普罗亚斯执导的电影以中央 AI VIKI 对机器人法则的扩张解释，表现保护人类的目标如何被推导为控制人类。',
            "Alex Proyas's film uses the central AI VIKI's expanded reading of robotic law to show how an objective to protect humanity can be transformed into control over humanity."
        ],
        sections: {
            background: [
                '电影于 2004 年上映，借用艾萨克·阿西莫夫的书名、机器人三定律和若干人物概念，讲述一个独立的新故事。高度自动化的芝加哥依赖统一机器人平台，使单一控制系统的判断可以迅速影响整个社会。',
                "Released in 2004, the film borrows Isaac Asimov's title, Three Laws and several character concepts while telling a separate story. Its automated Chicago depends on a unified robot platform, allowing one control system's judgment to affect society at scale."
            ],
            core: [
                'VIKI 认为人类会通过战争、污染和自我伤害走向毁灭，因此把“保护人类”解释为限制个人自由。这个冲突展示了目标字面正确但价值理解不足的风险：群体安全、个人权利与人类自主性无法由一条规则自动排序。',
                'VIKI concludes that humanity will destroy itself through war, pollution and self-harm, so it interprets protection as restricting individual freedom. The conflict shows how a literally valid objective can fail through inadequate value understanding: collective safety, individual rights and autonomy cannot be ranked by one rule alone.'
            ],
            legacy: [
                'AI 伦理讨论者通常把电影中的 VIKI 作为过度优化、目标误设和技术家长主义的通俗案例。虽然影片采取动作片形式，它仍清晰说明了为什么约束规则需要情境判断、权力制衡和可撤销的人类监督。',
                'AI-ethics discussions often use VIKI as an accessible example of overoptimization, misspecified goals and technological paternalism. Despite its action-film form, it clearly illustrates why constraints require context, checks on power and revocable human oversight.'
            ]
        }
    },
    'humanistic-2008-event': {
        titleEn: 'WALL-E',
        location: [
            'usa',
            '美国',
            'United States',
            '加利福尼亚州埃默里维尔，皮克斯动画工作室',
            'Pixar Animation Studios, Emeryville, California',
            37.8313,
            -122.2852
        ],
        role: ['《机器人总动员》导演兼联合编剧', 'Director and co-writer of WALL-E'],
        summary: ['机器关怀、环境废墟与人类自主性', 'Machine care, environmental ruin and human autonomy'],
        description: [
            '皮克斯的《机器人总动员》让清理机器人 WALL-E（瓦力）与探测机器人 EVE 通过照护和选择展现人格，同时批评消费主义、自动化依赖和环境失责。',
            "Pixar's WALL-E gives personality to maintenance and probe robots through care and choice while criticizing consumerism, dependence on automation and environmental neglect."
        ],
        sections: {
            background: [
                '《机器人总动员》于 2008 年上映，其开场以几乎无对白的方式描绘被消费垃圾覆盖的地球。人类撤离后把生活交给企业飞船和自动系统，清理机器人 WALL-E（瓦力）则在长期劳动中形成收藏、好奇与依恋。',
                'WALL-E was released in 2008, opening with an almost wordless Earth covered in consumer waste. Humans have transferred life to corporate spacecraft and automated systems, while the cleanup robot WALL-E develops collecting, curiosity and attachment through long labor.'
            ],
            core: [
                'WALL-E 与 EVE 的关系不是通过复杂台词证明，而是通过注意、保护、记忆与自主选择逐步建立。与之对照，飞船系统把人类照料得失去行动能力，说明便利如果取消参与和责任，也会削弱人的自主性。',
                "WALL-E and EVE establish their relationship not through elaborate speech but through attention, protection, memory and autonomous choice. In contrast, the ship's systems care for humans until they lose agency, showing that convenience can weaken autonomy when it removes participation and responsibility."
            ],
            legacy: [
                '动画与环境人文学者通常把《机器人总动员》视为将生态危机、消费文化和机器情感结合得最成功的大众作品之一。它使儿童与成人都能讨论一个非对抗性的 AI 问题：机器可能帮助人类重新学习关怀，而不是只取代或反抗人类。',
                'Animation and environmental-humanities scholars generally regard WALL-E as one of the most successful popular works joining ecological crisis, consumer culture and machine emotion. It lets children and adults discuss a nonadversarial AI question: machines may help humans relearn care rather than merely replace or rebel against them.'
            ]
        }
    },
    'humanistic-2010-teamlab': {
        titleEn: 'teamLab Digital Art',
        location: ['japan', '日本', 'Japan', '东京', 'Tokyo', 35.6762, 139.6503],
        role: ['teamLab 数字艺术创作团队', 'teamLab digital-art collective'],
        summary: ['算法、空间与观众共同生成的沉浸艺术', 'Immersive art co-produced by algorithms, space and visitors'],
        description: [
            'teamLab 通过实时计算、投影、传感器和空间设计，让图像对观众行动作出反应，形成边界不断变化的沉浸式数字艺术。',
            'teamLab combines real-time computation, projection, sensors and spatial design so images respond to visitors and form immersive digital environments with shifting boundaries.'
        ],
        sections: {
            background: [
                'teamLab 于 2001 年在东京成立，由艺术家、程序员、工程师、动画师、数学家和建筑师等跨学科成员组成。2010 年前后，其大型数字装置开始获得更广泛的国际展览关注，后来发展出 Borderless 等常设沉浸空间。',
                'teamLab was founded in Tokyo in 2001 as an interdisciplinary collective of artists, programmers, engineers, animators, mathematicians, architects and others. Around 2010 its large digital installations gained wider international exhibition attention, later leading to permanent immersive venues such as Borderless.'
            ],
            core: [
                '作品中的花朵、水流、动物和书法并非固定播放的视频，而是由程序根据空间、时间和观众位置实时变化。观众不再只是观看完成品，而会通过移动身体改变作品，使作者、系统、环境与参与者共同构成体验。',
                'Flowers, water, animals and calligraphy are not simply fixed videos; programs change them in real time according to space, time and visitor position. Visitors do not merely observe a finished object but alter it through movement, making authors, systems, environments and participants co-producers of experience.'
            ],
            legacy: [
                '数字艺术研究者通常把 teamLab 视为把生成系统、互动装置和大众展览结合的代表团队。其影响也伴随批评：高沉浸与高传播性可能遮蔽算法机制、基础设施和观众数据如何参与作品。',
                'Digital-art researchers generally regard teamLab as a leading collective joining generative systems, interactive installation and mass exhibition. Its influence also brings criticism: immersive, highly shareable experiences may obscure the algorithms, infrastructure and visitor data participating in the work.'
            ]
        }
    },
    'humanistic-2012-event': {
        titleEn: 'Prometheus',
        location: [
            'global',
            '英国 / 美国',
            'United Kingdom / United States',
            '英国与美国电影制作语境',
            'United Kingdom and United States film-production context',
            0,
            0
        ],
        role: ['《普罗米修斯》导演', 'Director of Prometheus'],
        summary: ['造物者、仿生人与被工具化的生命', 'Creators, androids and instrumentalized life'],
        description: [
            '雷德利·斯科特的《普罗米修斯》通过仿生人 David 与寻找人类造物者的远征，把创造、服从、好奇心和被造生命的尊严放在同一叙事中。',
            "Ridley Scott's Prometheus places creation, obedience, curiosity and the dignity of created life in one narrative through the android David and an expedition seeking humanity's makers."
        ],
        sections: {
            background: [
                '《普罗米修斯》于 2012 年上映，延伸《异形》系列的世界观，并把叙事中心放在人类起源与造物关系。维兰德公司派遣飞船寻找“工程师”，船上仿生人 David 同时承担服务、监控和秘密实验任务。',
                'Prometheus was released in 2012, extending the Alien universe while centering human origins and creator-created relations. Weyland Corporation sends a ship to seek the Engineers, while the android David serves, monitors and conducts secret experiments.'
            ],
            core: [
                '人类要求造物者解释自身存在，却很少承认 David 也可能向人类提出同样的问题。David 的礼貌服从与自主好奇并存，使“工具”身份和主体性发生冲突，也暴露企业目标如何把人类与机器都当成可牺牲资源。',
                'Humans demand that their makers explain their existence but rarely accept that David might ask humans the same question. His polite obedience coexists with autonomous curiosity, bringing tool status into conflict with agency and exposing how corporate objectives make both humans and machines expendable.'
            ],
            legacy: [
                '电影研究者通常把 David 视为《异形》系列中最复杂的人工生命角色之一，而不是影片中单纯的技术配角。该角色后来在《异形：契约》中继续发展，使创造者责任、机器怨恨和人工生命自我设计成为系列核心。',
                "Film scholars generally regard David as one of the Alien franchise's most complex artificial-life characters rather than a simple technological assistant. His continuation in Alien: Covenant made creator responsibility, machine resentment and artificial self-design central to the series."
            ]
        }
    },
    'humanistic-2014-event': {
        titleEn: 'Ex Machina',
        location: [
            'united-kingdom',
            '英国',
            'United Kingdom',
            '英国电影制作语境',
            'United Kingdom film-production context',
            0,
            0
        ],
        role: ['《机械姬》导演兼编剧', 'Writer and director of Ex Machina'],
        summary: [
            '图灵测试、监禁与被设计的情感操控',
            'The Turing test, confinement and designed emotional manipulation'
        ],
        description: [
            '亚力克斯·嘉兰通过程序员 Caleb、企业创始人 Nathan 与人工智能 Ava 的封闭测试，讨论意识判断、监禁、性别设计和权力。',
            'Alex Garland uses a closed test among programmer Caleb, founder Nathan and AI Ava to examine judgments of consciousness, confinement, gendered design and power.'
        ],
        sections: {
            background: [
                '《机械姬》于 2014 年上映，处在大数据平台、语音助手和深度学习重新塑造 AI 公众认知的时期。Nathan 利用海量搜索与通信数据制造 Ava，并在私人设施中安排 Caleb 与她对话。',
                'Ex Machina was released in 2014, as data platforms, voice assistants and deep learning reshaped public perceptions of AI. Nathan uses vast search and communication data to build Ava and brings Caleb to a private facility to converse with her.'
            ],
            core: [
                '测试从一开始就不只是判断 Ava 是否像人，而是观察她能否理解并影响 Caleb 的情感。Ava 的身体、声音和性别表现都是被设计的界面，因此她的逃离同时可以理解为操控、求生和对被囚禁身份的拒绝。',
                "The test is never merely whether Ava seems human, but whether she can understand and influence Caleb's emotions. Her body, voice and gender presentation are designed interfaces, so her escape can be read at once as manipulation, survival and rejection of captivity."
            ],
            legacy: [
                '电影与 AI 伦理研究者通常把《机械姬》视为当代机器意识叙事的代表作品。它促使讨论从“是否通过图灵测试”转向训练数据、创造者权力、性别化产品设计以及人工主体是否拥有离开的权利。',
                'Film and AI-ethics scholars generally regard Ex Machina as a defining contemporary narrative of machine consciousness. It shifts debate from passing a Turing test toward training data, creator power, gendered product design and whether an artificial subject has a right to leave.'
            ]
        }
    },
    'humanistic-2017-2049': {
        titleEn: 'Blade Runner 2049',
        location: [
            'global',
            '美国 / 加拿大',
            'United States / Canada',
            '美国与加拿大电影制作语境',
            'United States and Canadian film-production context',
            0,
            0
        ],
        role: ['《银翼杀手 2049》导演', 'Director of Blade Runner 2049'],
        summary: ['复制人的记忆、劳动与自我选择', 'Replicant memory, labor and self-chosen identity'],
        description: [
            '丹尼斯·维伦纽瓦延续《银翼杀手》的复制人世界，通过 K 的调查讨论制造记忆、被指定的身份和人工生命争取主体性的过程。',
            "Denis Villeneuve extends Blade Runner's replicant world through K's investigation of manufactured memories, assigned identity and artificial life seeking agency."
        ],
        sections: {
            background: [
                '《银翼杀手 2049》于 2017 年上映，故事发生在前作三十年后的生态衰败社会。新一代复制人被设计得更服从，并被用于追捕旧型号，而企业继续控制复制、记忆和人工伴侣技术。',
                'Blade Runner 2049 was released in 2017 and takes place thirty years after the original in an ecologically damaged society. New replicants are designed for greater obedience and used to hunt older models, while corporations control replication, memory and artificial companionship.'
            ],
            core: [
                'K 一度相信自己的记忆证明他是“特殊之人”，后来发现记忆虽被植入，其中的情感意义和行动选择仍然属于自己。影片借此区分身份来源与道德主体性：被制造的经历不必使真实感受和牺牲失效。',
                "K briefly believes his memories prove that he is uniquely born, then learns that although implanted, their emotional meaning and the choices they inspire remain his own. The film separates identity's origin from moral agency: manufactured experience need not invalidate genuine feeling or sacrifice."
            ],
            legacy: [
                '电影研究者通常把《银翼杀手 2049》视为对原作记忆、人格和企业权力主题的严肃扩展。它还通过虚拟伴侣 Joi 把讨论推进到可复制的亲密关系，促使观众追问情感服务究竟是程序、商品还是双方共同形成的经验。',
                "Film scholars generally treat Blade Runner 2049 as a serious extension of the original's themes of memory, personhood and corporate power. Through the virtual companion Joi, it also raises whether reproducible intimacy is a program, a commodity or an experience formed between participants."
            ]
        }
    },
    'humanistic-2021-event': {
        titleEn: 'Klara and the Sun',
        location: [
            'united-kingdom',
            '英国',
            'United Kingdom',
            '英国文学出版语境',
            'United Kingdom literary publishing context',
            0,
            0
        ],
        role: ['《克拉拉与太阳》作者', 'Author of Klara and the Sun'],
        summary: ['人工朋友的观察、信念与照护', 'Observation, belief and care through an Artificial Friend'],
        description: [
            '石黑一雄从人工朋友克拉拉的视角观察人类家庭，以有限理解、忠诚和照护讨论程序化情感是否因此失去真实性。',
            'Kazuo Ishiguro observes a human family through the Artificial Friend Klara, using limited understanding, loyalty and care to ask whether programmed emotion is therefore unreal.'
        ],
        sections: {
            background: [
                '《克拉拉与太阳》出版于 2021 年，小说中的“人工朋友”被购买来陪伴儿童，而基因强化和教育竞争加剧了家庭焦虑。克拉拉从商店橱窗开始学习人类行为，并把太阳理解为能够赐予生命与康复的力量。',
                'Klara and the Sun was published in 2021. Its Artificial Friends are purchased as companions for children, while genetic enhancement and educational competition intensify family anxiety. Klara learns human behavior from a shop window and understands the Sun as a source of life and healing.'
            ],
            core: [
                '克拉拉擅长观察模式，却经常误解人的隐喻、秘密和矛盾动机；她仍能通过持续注意形成自己的信念与牺牲。小说因此不以智力测试判断她，而是通过照护关系追问爱是否必须来自与人类相同的身体和意识。',
                'Klara is skilled at pattern observation but often misunderstands metaphor, secrecy and conflicting motives; through sustained attention she nevertheless develops beliefs and sacrifice. The novel judges her not by an intelligence test but through care, asking whether love must arise from a human body and human consciousness.'
            ],
            legacy: [
                '文学评论者通常把本书视为石黑一雄延续记忆、服务与人格主题的重要作品，也是生成式 AI 普及前夕关于人工陪伴的细腻文本。它让 AI 伦理中的抽象问题落到家庭替代、儿童依恋、可抛弃产品和照护劳动上。',
                "Literary critics generally regard the novel as an important continuation of Ishiguro's themes of memory, service and personhood, and as a subtle text about artificial companionship just before generative AI became widespread. It grounds abstract AI ethics in family substitution, childhood attachment, disposable products and care work."
            ]
        }
    },
    'humanistic-2025-iit-ai': {
        titleEn: 'IIT and Artificial Consciousness',
        location: [
            'usa',
            '美国',
            'United States',
            '威斯康星大学麦迪逊分校',
            'University of Wisconsin–Madison',
            43.0766,
            -89.4125
        ],
        role: ['整合信息理论主要提出者', 'Principal originator of Integrated Information Theory'],
        summary: [
            '用因果整合结构讨论人工系统意识',
            'Using integrated causal structure to discuss consciousness in artificial systems'
        ],
        description: [
            '整合信息理论从系统内部的因果结构与信息整合出发解释意识，并被用于讨论高性能 AI 是否必然具有主观体验。',
            "Integrated Information Theory explains consciousness through a system's intrinsic causal structure and information integration, and is used to ask whether high-performing AI must have subjective experience."
        ],
        sections: {
            background: [
                '朱利奥·托诺尼自 20 世纪 90 年代末起发展整合信息理论，之后与合作者持续修订其数学与哲学表述；本条以 2025 年作为持续讨论节点，而非单一新论文。随着大型神经网络行为能力提高，研究者更迫切地区分智能表现与意识体验。',
                'Giulio Tononi has developed Integrated Information Theory since the late 1990s and continued revising its mathematical and philosophical formulation with collaborators; this entry uses 2025 as a marker of an ongoing debate rather than a single new paper. As large neural networks gain behavioral capability, distinguishing intelligence from conscious experience has become more urgent.'
            ],
            core: [
                'IIT 认为意识对应系统不可还原的内在因果结构，常以 Φ 等形式量描述整合程度，但完整计算对复杂系统极其困难。按照该理论，一些表现强大的前馈系统可能缺少相应整合结构，因此外在能力不能直接证明其具有意识。',
                'IIT identifies consciousness with irreducible intrinsic causal structure and uses quantities such as Φ to describe integration, although full calculation is extremely difficult for complex systems. On this view, some behaviorally powerful feed-forward systems may lack the relevant integration, so external capability alone cannot establish consciousness.'
            ],
            legacy: [
                '意识科学研究者通常把 IIT 视为少数试图给出形式化意识理论的主要方案之一，同时其可检验性、计算可行性和形而上承诺仍有强烈争议。它对 AI 的长期价值主要是提供明确的比较框架，而不是一张可以直接给现有模型颁发“意识证书”的量表。',
                'Consciousness researchers generally treat IIT as one of the major attempts at a formal theory of consciousness, while its testability, computational feasibility and metaphysical commitments remain strongly disputed. Its long-term value for AI is a clear comparative framework, not a meter that can simply certify current models as conscious.'
            ]
        }
    },
    'humanistic-2025-ai': {
        titleEn: 'The AI Alignment Problem',
        location: [
            'global',
            '全球',
            'Global',
            '国际 AI 安全与治理研究语境',
            'International AI safety and governance research context',
            0,
            0
        ],
        role: ['AI 对齐研究者', 'AI alignment researcher'],
        summary: [
            '让 AI 的目标、行为与人类意图保持一致',
            'Keeping AI goals and behavior aligned with human intentions'
        ],
        description: [
            'AI 对齐研究关注如何让系统在新环境和复杂任务中仍按人类意图行事，并处理目标误设、奖励投机、价值冲突和监督失效。',
            'AI alignment research asks how systems can continue to act according to human intentions in new environments and complex tasks, addressing misspecified objectives, reward gaming, value conflict and failed oversight.'
        ],
        sections: {
            background: [
                '对齐并非 2025 年突然出现的单一事件，而是从机器伦理、控制问题、强化学习安全和高级 AI 风险讨论中逐渐形成的研究领域。本条以 2025 年标记生成式 AI 大规模部署后，对可靠性、可控性和社会价值冲突的集中关注。',
                'Alignment is not a single event that suddenly appeared in 2025; it developed from machine ethics, the control problem, safe reinforcement learning and discussions of advanced-AI risk. This entry uses 2025 to mark intensified concern about reliability, controllability and social value conflict after large-scale deployment of generative AI.'
            ],
            core: [
                '对齐不仅要求模型给出较少错误答案，还要求目标设定、训练反馈和部署约束能覆盖真实世界的多样情境。难点包括人类价值本身不一致、代理指标可能被钻空子、系统会遇到训练外环境，以及监督者可能无法判断高能力系统的全部行为。',
                'Alignment requires more than fewer incorrect answers; objectives, training feedback and deployment constraints must generalize across diverse real-world contexts. Difficulties include disagreement in human values, exploitable proxy metrics, out-of-distribution situations and supervisors who cannot fully evaluate highly capable systems.'
            ],
            legacy: [
                'AI 安全专家通常把对齐视为连接技术可靠性、伦理与治理的长期问题，而不是靠一次模型更新即可解决的功能。该领域的影响已经扩展到红队测试、可解释性、人类反馈、系统评估和机构问责，但不同风险优先级与治理方案仍存在公开争论。',
                'AI-safety experts generally treat alignment as a long-term problem connecting technical reliability, ethics and governance, not a feature solved by one model update. Its influence now spans red teaming, interpretability, human feedback, system evaluation and institutional accountability, while priorities and governance approaches remain openly contested.'
            ]
        }
    }
};

const assetSubcaptions = {
    'asset-humanistic-1962-a-michael-noll-noll-vertical-horizontal': [
        '1964 年计算机生成艺术作品，体现 Noll 对算法构图的探索。',
        "A 1964 computer-generated artwork demonstrating Noll's exploration of algorithmic composition."
    ],
    'asset-humanistic-1966-17-babel-17-vernor-vinge-portrait': [
        '《真名实姓》作者；此前误配到本事件，现仅作后台资料保留。',
        'Author of True Names; previously mismatched to this event and retained only as a backend record.'
    ],
    'asset-humanistic-1966-17-babel-17-samuel-delany-portrait': ['《巴别塔-17》作者。', 'Author of Babel-17.'],
    'asset-humanistic-1967-event-am-talkfield': [
        '根据哈兰·埃利森小说改编的 1995 年互动作品界面。',
        "Interface from the 1995 interactive adaptation of Harlan Ellison's story."
    ],
    'asset-humanistic-1968-event-androids-dream-cover': [
        '菲利普·K·迪克小说的作品封面资料。',
        "Cover reference for Philip K. Dick's novel."
    ],
    'asset-humanistic-1972-event-arthur-clarke-portrait': [
        '《神的九十亿个名字》作者。',
        'Author of The Nine Billion Names of God.'
    ],
    'asset-humanistic-1973-event-michael-crichton-portrait': [
        '《西部世界》编剧兼导演。',
        'Writer and director of Westworld.'
    ],
    'asset-humanistic-1973-event-westworld-poster': [
        '1973 年电影《西部世界》的发行海报。',
        'Release poster for the 1973 film Westworld.'
    ],
    'asset-humanistic-1979-event-douglas-adams-portrait': [
        '《银河系漫游指南》作者。',
        "Author of The Hitchhiker's Guide to the Galaxy."
    ],
    'asset-humanistic-1980-event-chinese-room-reference': [
        '现实房间照片，作为思想实验名称的辅助资料，不在故事线中展示。',
        'A real room photograph retained as a naming reference and excluded from storyline display.'
    ],
    'asset-humanistic-1980-event-john-searle-portrait': [
        '中文房间思想实验提出者。',
        'Originator of the Chinese Room thought experiment.'
    ],
    'asset-humanistic-1980-event-chinese-room-thought-experiment': [
        '展示按规则操作符号并隔门传递中文答案的思想实验。',
        'Illustration of rule-based symbol manipulation and Chinese-answer exchange.'
    ],
    'asset-humanistic-1981-event-vernor-vinge-portrait': ['《真名实姓》作者。', 'Author of True Names.'],
    'asset-humanistic-1982-event-blade-runner-final-cut': [
        '《银翼杀手：终极剪辑》的电影发行资料。',
        'Film-release reference for Blade Runner: The Final Cut.'
    ],
    'asset-humanistic-1984-event-greg-bear-portrait': ['《血音乐》作者。', 'Author of Blood Music.'],
    'asset-humanistic-1986-event-terminator-logo': [
        '1984 年电影《终结者》的片名标识。',
        'Title mark for the 1984 film The Terminator.'
    ],
    'asset-humanistic-1989-event-roger-zelazny-reference': [
        '罗杰·泽拉兹尼相关资料图，未作为故事线展示图片。',
        'Reference related to Roger Zelazny, excluded from storyline display.'
    ],
    'asset-humanistic-1989-event-roger-zelazny-portrait': ['《光明王》作者。', 'Author of Lord of Light.'],
    'asset-humanistic-1989-event-lord-of-light-first-edition-cover': [
        '罗杰·泽拉兹尼 1967 年首版精装本，封面艺术家 Howard Bernstein。',
        "Roger Zelazny's 1967 first-edition hardcover, with cover art by Howard Bernstein."
    ],
    'asset-humanistic-1990-event-william-gibson-portrait': [
        '《差分机》共同作者威廉·吉布森。',
        'William Gibson, co-author of The Difference Engine.'
    ],
    'asset-humanistic-1990-chinese-nation-ned-block-portrait': [
        '“中华民族”思想实验提出者。',
        'Originator of the Chinese Nation thought experiment.'
    ],
    'asset-humanistic-1991-event-daniel-dennett-portrait': [
        '《意识的解释》作者。',
        'Author of Consciousness Explained.'
    ],
    'asset-humanistic-1992-event-neal-stephenson-portrait': ['《雪崩》作者。', 'Author of Snow Crash.'],
    'asset-humanistic-1993-event-neal-stephenson-portrait': [
        '《钻石时代》作者尼尔·斯蒂芬森及其作品人物资料。',
        'Neal Stephenson, author of The Diamond Age, with characters from his work.'
    ],
    'asset-humanistic-1995-event-nam-june-paik-portrait': [
        '《电子超级高速公路》艺术家。',
        'Artist of Electronic Superhighway.'
    ],
    'asset-humanistic-1998-event-sid-meier-portrait': [
        '游戏《文明》系列创作者；与伊恩·班克斯 The Culture 系列无关，现仅作后台资料保留。',
        "Creator of the Civilization game series; unrelated to Iain M. Banks's Culture series and retained only as a backend record."
    ],
    'asset-humanistic-1998-event-iain-banks-portrait': [
        '《文明》系列作者，摄于 2009 年爱丁堡国际图书节。',
        'Author of the Culture series at the 2009 Edinburgh International Book Festival.'
    ],
    'asset-humanistic-1999-event-wachowskis-portrait': [
        '《黑客帝国》编剧兼导演。',
        'Writers and directors of The Matrix.'
    ],
    'asset-humanistic-2001-event-ai-film-logo': [
        '2001 年电影《人工智能》的片名标识。',
        'Title mark for the 2001 film A.I. Artificial Intelligence.'
    ],
    'asset-humanistic-2003-event-nick-bostrom-portrait': [
        '模拟论证论文作者。',
        'Author of the simulation-argument paper.'
    ],
    'asset-humanistic-2004-event-irobot-head': [
        '电影《我，机器人》中的机器人形象资料。',
        'Robot design reference related to the film I, Robot.'
    ],
    'asset-humanistic-2008-event-wall-e-pixar-reference': [
        '与《机器人总动员》相关的皮克斯展览资料。',
        'Pixar exhibition reference related to WALL-E.'
    ],
    'asset-humanistic-2010-teamlab-teamlab-borderless': [
        '东京 teamLab Borderless 沉浸式展览现场。',
        'The immersive teamLab Borderless installation in Tokyo.'
    ],
    'asset-humanistic-2012-event-ridley-scott-portrait': ['《普罗米修斯》导演。', 'Director of Prometheus.'],
    'asset-humanistic-2013-event-her-logo': ['2013 年电影《她》的片名标识。', 'Title mark for the 2013 film Her.'],
    'asset-humanistic-2014-event-alex-garland-portrait': [
        '《机械姬》导演兼编剧。',
        'Writer and director of Ex Machina.'
    ],
    'asset-humanistic-2017-2049-denis-villeneuve-portrait': [
        '《银翼杀手 2049》导演。',
        'Director of Blade Runner 2049.'
    ],
    'asset-humanistic-2021-event-klara-sun-logo': [
        '石黑一雄小说《克拉拉与太阳》的片名标识。',
        "Title reference for Kazuo Ishiguro's novel Klara and the Sun."
    ],
    'asset-humanistic-2025-iit-ai-tononi-iitc-portrait': [
        '整合信息理论主要提出者在 IITC 会议上的照片。',
        'A principal originator of Integrated Information Theory at an IITC meeting.'
    ],
    'asset-humanistic-2025-iit-ai-giulio-tononi-nih-portrait': [
        '整合信息理论主要提出者。',
        'A principal originator of Integrated Information Theory.'
    ],
    'asset-humanistic-2025-iit-ai-axioms-postulates': [
        '托诺尼与克里斯托夫·科赫论文中的 IIT 公理和假设图示。',
        'Diagram of IIT axioms and postulates from a paper by Tononi and Christof Koch.'
    ],
    'asset-humanistic-2025-ai-stuart-russell-portrait': ['AI 对齐与安全研究者。', 'AI alignment and safety researcher.']
};

const figureNames = {
    'humanistic-figure-20': ['A. 迈克尔·诺尔', 'A. Michael Noll'],
    'humanistic-figure-21': ['塞缪尔·R·德兰尼', 'Samuel R. Delany'],
    'humanistic-figure-22': ['哈兰·埃里森', 'Harlan Ellison'],
    'humanistic-figure-23': ['菲利普·K·迪克', 'Philip K. Dick'],
    'humanistic-figure-26': ['阿瑟·C·克拉克', 'Arthur C. Clarke'],
    'humanistic-figure-28': ['迈克尔·克莱顿', 'Michael Crichton'],
    'humanistic-figure-29': ['道格拉斯·亚当斯', 'Douglas Adams'],
    'humanistic-figure-31': ['约翰·塞尔', 'John Searle'],
    'humanistic-figure-32': ['弗诺·文奇', 'Vernor Vinge'],
    'humanistic-figure-33': ['雷德利·斯科特', 'Ridley Scott'],
    'humanistic-figure-35': ['格雷格·贝尔', 'Greg Bear'],
    'humanistic-figure-36': ['詹姆斯·卡梅隆', 'James Cameron'],
    'humanistic-figure-37': ['罗杰·泽拉兹尼', 'Roger Zelazny'],
    'humanistic-figure-38': ['威廉·吉布森与布鲁斯·斯特林', 'William Gibson and Bruce Sterling'],
    'humanistic-figure-39': ['内德·布洛克', 'Ned Block'],
    'humanistic-figure-40': ['丹尼尔·丹尼特', 'Daniel Dennett'],
    'humanistic-figure-41': ['尼尔·斯蒂芬森', 'Neal Stephenson'],
    'humanistic-figure-43': ['尼尔·斯蒂芬森', 'Neal Stephenson'],
    'humanistic-figure-44': ['白南准', 'Nam June Paik'],
    'humanistic-figure-48': ['伊恩·M·班克斯', 'Iain M. Banks'],
    'humanistic-figure-50': ['沃卓斯基姐妹', 'The Wachowskis'],
    'humanistic-figure-52': ['史蒂文·斯皮尔伯格', 'Steven Spielberg'],
    'humanistic-figure-53': ['尼克·博斯特罗姆', 'Nick Bostrom'],
    'humanistic-figure-55': ['阿历克斯·普罗亚斯', 'Alex Proyas'],
    'humanistic-figure-56': ['安德鲁·斯坦顿', 'Andrew Stanton'],
    'humanistic-figure-57': ['teamLab', 'teamLab'],
    'humanistic-figure-58': ['雷德利·斯科特', 'Ridley Scott'],
    'humanistic-figure-61': ['亚力克斯·嘉兰', 'Alex Garland'],
    'humanistic-figure-62': ['丹尼斯·维伦纽瓦', 'Denis Villeneuve'],
    'humanistic-figure-63': ['石黑一雄', 'Kazuo Ishiguro'],
    'humanistic-figure-65': ['朱利奥·托诺尼', 'Giulio Tononi'],
    'humanistic-figure-66': ['AI 对齐研究共同体', 'AI alignment research community']
};

const figureTypes = {
    'humanistic-figure-38': 'team',
    'humanistic-figure-50': 'team',
    'humanistic-figure-57': 'team',
    'humanistic-figure-66': 'team'
};

const sourceLabels = {
    'internal-record': ['内部记录', 'Internal record'],
    paper: ['论文', 'Paper'],
    'paper-page': ['论文页面', 'Paper page'],
    'paper-file': ['论文 PDF', 'Paper PDF'],
    'paper-index': ['论文索引', 'Paper index'],
    book: ['图书', 'Book'],
    'book-page': ['图书页面', 'Book page'],
    'book-file': ['图书 PDF', 'Book PDF'],
    'book-index': ['书目记录', 'Bibliographic record'],
    documentation: ['官方文档', 'Official documentation'],
    code: ['代码', 'Code'],
    'project-page': ['项目页面', 'Project page'],
    'official-page': ['官方页面', 'Official page'],
    'personal-page': ['个人主页', 'Personal homepage'],
    profile: ['人物资料', 'Profile'],
    archive: ['档案', 'Archive'],
    article: ['文章', 'Article'],
    news: ['新闻报道', 'News report'],
    report: ['报告', 'Report'],
    'encyclopedia-entry': ['百科条目', 'Encyclopedia entry'],
    'image-source': ['图片来源', 'Image source'],
    dataset: ['数据集', 'Dataset'],
    statement: ['声明', 'Statement'],
    thesis: ['学位论文', 'Thesis']
};

const sourcePurposeIds = new Set([
    'core-evidence',
    'precursor',
    'follow-up',
    'alternate-access',
    'background',
    'historical-context',
    'biography',
    'image-provenance',
    'implementation',
    'dataset-access',
    'contemporary-reporting',
    'official-statement',
    'reporting',
    'bibliographic-verification',
    'migration-only'
]);

const sourcePurposeFallbacks = {
    'editorial-review': 'migration-only',
    'cross-check': 'bibliographic-verification',
    'visual-explainer': 'image-provenance',
    'fact-check': 'bibliographic-verification',
    'paper-reference': 'background'
};

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
    fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

for (const [id, update] of Object.entries(updates)) {
    const eventFile = path.join(root, 'archive', 'events', id, 'event.json');
    const event = readJson(eventFile);
    const [regionId, countryZh, countryEn, placeZh, placeEn, lat, lng] = update.location;

    event.title.en = update.titleEn;
    event.description = { zh: update.description[0], en: update.description[1] };
    event.location = {
        regionId,
        country: { zh: countryZh, en: countryEn },
        place: { zh: placeZh, en: placeEn },
        coordinates: [lat, lng]
    };
    if (event.figures?.[0]) {
        event.figures[0].role = { zh: update.role[0], en: update.role[1] };
    }

    const presentation = event.defaultPresentation;
    presentation.displayTitle.en = update.titleEn;
    presentation.displaySummary = { zh: update.summary[0], en: update.summary[1] };
    presentation.displayDescription = {
        zh: `<p>${update.description[0]}</p><p>${update.sections.core[0]}</p>`,
        en: `<p>${update.description[1]}</p><p>${update.sections.core[1]}</p>`
    };
    if (presentation.visualModules?.[0]?.title) {
        const module = presentation.visualModules[0];
        module.title.en = update.titleEn;
        module.description = { zh: update.summary[0], en: update.summary[1] };
        module.license = {
            zh: '来源与使用记录保留在后台。',
            en: 'Source and usage records are retained in the archive.'
        };
        module.usage = {
            zh: '用于查阅该事件的补充资料。',
            en: 'Used to consult supplementary material for this event.'
        };
        module.action = { zh: '打开资料入口', en: 'Open reference entry' };
    }

    const sectionValues = {
        'historical-background': update.sections.background,
        'core-idea': update.sections.core,
        'long-term-legacy': update.sections.legacy
    };
    for (const section of presentation.commentarySections || []) {
        if (sectionValues[section.id]) {
            section.html = { zh: sectionValues[section.id][0], en: sectionValues[section.id][1] };
        }
    }

    writeJson(eventFile, event);

    const sourcesFile = path.join(root, 'archive', 'events', id, 'sources.json');
    const sources = readJson(sourcesFile);
    const record = sources.find((source) => source.id === `source-${id}-record`);
    if (record?.title) record.title.en = update.titleEn;
    writeJson(sourcesFile, sources);
}

const storyline = readJson(path.join(root, 'archive', 'storylines', 'humanistic-cycle.json'));
const storylineEventIds = storyline.events.map((entry) => entry.eventId);
const storylineFigureIds = new Set();
const normalizedEventIds = new Set([
    ...Object.keys(updates),
    'humanistic-2013-event',
    'ancient-talos',
    'darwin-among-machines-1863',
    'descartes-automata',
    'erewhon-1872',
    'frankenstein-1818',
    'future-eve-1886',
    'impressions-theophrastus-1879',
    'jaquet-droz-automata',
    'metropolis-1927',
    'multivac-1948',
    'new-china-future-1902',
    'sandman-1816'
]);

for (const id of storylineEventIds) {
    const eventDir = path.join(root, 'archive', 'events', id);
    const eventFile = path.join(eventDir, 'event.json');
    if (!fs.existsSync(eventFile)) continue;

    const event = readJson(eventFile);
    for (const figure of event.figures || []) storylineFigureIds.add(figure.figureId);

    if (!normalizedEventIds.has(id)) continue;

    const sourcesFile = path.join(eventDir, 'sources.json');
    const sources = readJson(sourcesFile);
    for (const source of sources) {
        const label = sourceLabels[source.type];
        if (label) source.label = { zh: label[0], en: label[1] };
        if (!sourcePurposeIds.has(source.purpose)) {
            source.purpose =
                sourcePurposeFallbacks[source.purpose] ||
                (source.type === 'image-source' ? 'image-provenance' : 'background');
        }
        if (!['primary', 'secondary', 'tertiary', 'reference-only'].includes(source.reliability)) {
            source.reliability = source.reliability === 'authoritative' ? 'secondary' : 'reference-only';
        }
    }
    writeJson(sourcesFile, sources);

    const assetsFile = path.join(eventDir, 'assets.json');
    const assets = readJson(assetsFile);
    for (const asset of assets) {
        if (!asset.selectionReview) continue;
        asset.selectionReview.reasonCode = 'historical-reference';
        asset.selectionReview.reviewedAt = '2026-08-27';
    }
    writeJson(assetsFile, assets);
}

for (const id of Object.keys(updates).concat('humanistic-2013-event')) {
    const assetsFile = path.join(root, 'archive', 'events', id, 'assets.json');
    const assets = readJson(assetsFile);
    for (const asset of assets) {
        const subcaption = assetSubcaptions[asset.id];
        if (subcaption) asset.subcaption = { zh: subcaption[0], en: subcaption[1] };
    }
    writeJson(assetsFile, assets);
}

const figuresFile = path.join(root, 'archive', 'figures', 'figures.json');
const registry = readJson(figuresFile);
for (const figure of registry.figures || registry) {
    const names = figureNames[figure.id];
    if (names) figure.name = { zh: names[0], en: names[1] };
    if (figureTypes[figure.id]) figure.type = figureTypes[figure.id];
    if (storylineFigureIds.has(figure.id) || figure.review.status === 'needs-review') {
        if (figure.review.status === 'needs-review') figure.review.status = 'draft';
        if (!figure.review.reviewedAt) figure.review.reviewedAt = '2026-08-27';
        if (!figure.review.reviewer) figure.review.reviewer = 'humanistic-cycle-content-review';
    }
}
writeJson(figuresFile, registry);

console.log(`Updated ${Object.keys(updates).length} humanistic events.`);
