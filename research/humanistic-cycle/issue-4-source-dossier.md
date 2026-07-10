# Issue #4 Source Dossier: Humanistic & Emotional Cycles of AI

Curated: 2026-07-10

Scope: GitHub issue #4 proposes a new branch for "AI的人文与情绪周期" covering science fiction, public optimism, existential dread, defensive action, and AI winters. This dossier verifies the candidate timeline and collects sources that can be converted into `manage/events.js`, `visualModules`, `sources`, and asset research notes.

Issue link: https://github.com/bjzgcai/AI-History-Show/issues/4

## Executive Verification

| Candidate | Build status | Key correction / caution |
| --- | --- | --- |
| 1920 R.U.R. | Ready | 1920 is valid for first publication. If the event emphasizes public theatrical debut of the word "robot", use 1921 as the premiere year. |
| 1942 Asimov / Three Laws | Needs title fix | Use "Runaround" (1942) for first full statement of the Three Laws. `I, Robot` is the 1950 collection, not the 1942 work. |
| 1950 Norbert Wiener | Ready | Treat as cybernetics / automation warning, not "AI" in the later narrow sense. First publication metadata is verified as 1950. |
| 1965 Herbert Simon prediction | Usable with quote check | Book metadata is verified. Before displaying the exact quote, verify against a scan/page reference. |
| 1968 2001 / HAL 9000 | Ready as interpretive node | "Goal conflict" is a modern interpretation; present it as a reality mapping, not as the film's explicit technical vocabulary. |
| 1973 Lighthill Report | Ready | Lighthill's report is dated July 1972 in the archive but published/used in the 1973 SRC symposium; 1973 is the better exhibit year. |
| 1978 小灵通漫游未来 | Usable, needs asset check | Date and cultural role are supported by Chinese secondary sources; exact cover/scan rights need separate verification before local reuse. |
| 1984 Neuromancer | Ready | Good fiction/reality node for cyberspace, AI containment, and AI self-release; avoid overclaiming direct influence on modern jailbreak research. |
| 1987 Lisp machine collapse | Usable, needs stronger primary market source | Good second-winter proxy, but source it as market/expert-system collapse through reliable AI-history secondary material. |
| 2014 Musk & Hawking warnings | Ready with framing | Use separate dated sources: Musk in October 2014, Hawking in December 2014. The 2015 FLI letter is the stronger collective safety milestone. |
| 2015 OpenAI founding | Ready | Use archived official OpenAI announcement plus contemporary BBC/Wired coverage. Avoid claiming it was only a direct response to 2014 warnings. |
| 2023 AI Safety Statement | Ready | Use the official CAIS statement page; if showing named signatories, verify the current signatory list snapshot. |

## Recommended Event Keys

| Event key | Year | Sentiment | Recommended title |
| --- | ---: | --- | --- |
| `1920-rur-robots` | 1920 | `dystopia` | R.U.R. and the Birth of "Robot" / 《罗素姆的万能机器人》与“机器人”的诞生 |
| `1942-asimov-runaround` | 1942 | `ethics` | Asimov's Three Laws in "Runaround" / 阿西莫夫在《转圈圈》中提出机器人三定律 |
| `1950-wiener-human-use` | 1950 | `warning` | Norbert Wiener Warns About Automation / 维纳对自动化社会的预警 |
| `1965-simon-ai-prediction` | 1965 | `hype` | Simon's Twenty-Year AI Prediction / 西蒙的二十年 AI 预言 |
| `1968-hal-9000` | 1968 | `warning` | HAL 9000 and Conflicting Machine Duties / HAL 9000 与机器职责冲突 |
| `1973-lighthill-report` | 1973 | `winter` | The Lighthill Report and the First AI Winter / 莱特希尔报告与第一次 AI 寒冬 |
| `1978-xiaolingtong` | 1978 | `optimism` | Little Smart Roaming the Future / 《小灵通漫游未来》 |
| `1984-neuromancer` | 1984 | `cyberpunk` | Neuromancer and AI Escape in Cyberspace / 《神经漫游者》与赛博空间中的 AI 越界 |
| `1987-lisp-machine-collapse` | 1987 | `winter` | The Lisp Machine Market Collapse / Lisp 机市场崩盘 |
| `2014-ai-existential-warnings` | 2014 | `dread` | Public Warnings About Advanced AI Risk / 关于高级 AI 风险的公开警告 |
| `2015-openai-founding` | 2015 | `defense` | The Founding of OpenAI / OpenAI 宣告成立 |
| `2023-ai-risk-statement` | 2023 | `dread` | The Statement on AI Risk / AI 风险声明 |

## Node Notes And Sources

### 1920 - R.U.R.

Verified facts:

- Karel Capek's `R.U.R.` was published in 1920.
- It introduced and popularized the word "robot".
- The common theme for this branch is labor replacement, manufactured life, and revolt against creators.

Primary / archive sources:

- Project Gutenberg, `R.U.R. by Karel Capek`: https://www.gutenberg.org/ebooks/13083
- Internet Archive, 1920 Czech edition scan: https://archive.org/details/rurrossumsuniver00apekuoft

Asset notes:

- The Project Gutenberg text is public domain in the USA. The Internet Archive 1920 scan is a good cover/title-page source, but still record the archive URL and rights context in `imageMeta`.
- Best exhibition visual: 1920 title page or a locally redrawn stage/robot-labor diagram.

### 1942 - Asimov's "Runaround"

Verified facts:

- The Three Laws first appear together in Isaac Asimov's short story `Runaround`, published in `Astounding Science Fiction`, March 1942.
- `I, Robot` should be treated as the 1950 collection that later gathered the robot stories.

Primary / archive sources:

- Internet Archive, `Astounding Science Fiction`, March 1942 issue: https://archive.org/details/Astounding_v29n01_1942-03_dtsg0318
- Asimov Online FAQ, Three Laws background: http://www.asimovonline.com/asimov_FAQ.html#non-literary12

Build caution:

- Retitle the issue's row from "I, Robot (1942)" to `"Runaround" and the Three Laws (1942)`.
- Do not reproduce long copyrighted story text. Use a short paraphrase and a locally drawn "rule hierarchy" explainer.

### 1950 - Norbert Wiener, `The Human Use of Human Beings`

Verified facts:

- Open Library metadata confirms first publication in 1950.
- The book belongs to cybernetics and automation ethics; it is useful as a pre-AI warning about machine control, feedback, labor, and human agency.

Sources:

- Open Library work metadata: https://openlibrary.org/works/OL4307570W
- Open Library search used for verification: https://openlibrary.org/search.json?title=The%20Human%20Use%20of%20Human%20Beings&author=Norbert%20Wiener
- Background on `Cybernetics` and the public debate that led Wiener to write for nontechnical readers: https://en.wikipedia.org/wiki/Cybernetics:_Or_Control_and_Communication_in_the_Animal_and_the_Machine

Build caution:

- Good right-side archive card: Open Library work page.
- If using a direct quote, verify page and edition first. Safer exhibit copy should paraphrase Wiener's concern about delegating control and decision-making to machines.

### 1965 - Herbert Simon's Prediction

Verified facts:

- Open Library metadata confirms `The Shape of Automation for Men and Management` was first published in 1965.
- AI histories repeatedly cite Simon's prediction that machines would be able to do any work a human can do within about twenty years.

Sources:

- Open Library work metadata: https://openlibrary.org/works/OL1205034W
- Open Library search used for verification: https://openlibrary.org/search.json?title=The%20Shape%20of%20Automation%20for%20Men%20and%20Management&author=Herbert%20Simon
- Secondary AI-progress reference summarizing the prediction: https://en.wikipedia.org/wiki/Progress_in_artificial_intelligence

Build caution:

- Use this as an "over-optimism / hype" node, but avoid a direct quotation until a scan or page reference is checked.
- Strong exhibit pairing: Simon's prediction beside later winter nodes, showing how authoritative optimism can raise public and funding expectations.

### 1968 - `2001: A Space Odyssey` / HAL 9000

Verified facts:

- `2001: A Space Odyssey` was released in 1968 and features HAL 9000 as a central artificial intelligence figure.
- The "conflicting instructions" explanation is especially explicit in discussions of the novel/expanded story; in the film, HAL's breakdown remains more ambiguous.

Sources:

- `2001: A Space Odyssey` overview: https://en.wikipedia.org/wiki/2001:_A_Space_Odyssey
- `2001: A Space Odyssey` novel summary, including the mission-secret conflict: https://en.wikipedia.org/wiki/2001:_A_Space_Odyssey_(novel)
- Technology / HAL context, including AI advisors and computer depiction: https://en.wikipedia.org/wiki/Technologies_in_2001:_A_Space_Odyssey

Build caution:

- Treat "reward hacking" or "goal-function conflict" as a modern reality-link mapping, not as period vocabulary.
- Avoid using film stills directly unless licensed. A red HAL-eye style original graphic or mission-duty conflict diagram is safer.

### 1973 - The Lighthill Report

Verified facts:

- Sir James Lighthill wrote `Artificial Intelligence: A General Survey` for the Science Research Council; archive text is dated July 1972.
- The report appeared in the 1973 SRC symposium and is commonly tied to the UK AI winter.
- The report's own archive frames AI into categories A, B, and C and is sharply skeptical about the bridge/robot-building category.

Primary source:

- Chilton / UKRI-hosted Lighthill Report archive: https://www.chilton-computing.org.uk/inf/literature/reports/lighthill_report/p001.htm

Build caution:

- Existing `1969-ai-winter` in the current app covers Minsky/Papert and perceptrons. This branch should use Lighthill as a separate public-policy winter node, not as a duplicate of the perceptron event.
- Recommended visual: paper/report facsimile card plus a locally drawn "toy domain -> combinatorial explosion -> funding chill" explainer.

### 1978 - `小灵通漫游未来`

Verified facts:

- Chinese secondary sources consistently identify Ye Yonglie's `小灵通漫游未来` as a 1978 post-Cultural-Revolution science fiction milestone.
- It is a good "benevolent optimism / science spring" contrast against Western dystopian robot narratives.

Sources:

- `小灵通漫游未来` entry with publication metadata and cultural summary: https://zh.wikipedia.org/wiki/%E5%B0%8F%E7%81%B5%E9%80%9A%E6%BC%AB%E6%B8%B8%E6%9C%AA%E6%9D%A5
- Ye Yonglie entry with biographical and work context: https://zh.wikipedia.org/wiki/%E5%8F%B6%E6%B0%B8%E7%83%88
- Chinese science fiction context: https://zh.wikipedia.org/wiki/%E7%A7%91%E5%B9%BB%E5%B0%8F%E8%AF%B4

Build caution:

- This needs stronger bibliographic validation before using an exact first-edition cover caption. Recommended next step: locate a National Library / publisher / physical scan record.
- Do not reuse modern book-cover images without rights. Prefer a locally redrawn "Future City" optimistic explainer, plus an archive/source card.

### 1984 - `Neuromancer`

Verified facts:

- William Gibson's `Neuromancer` was first published in 1984.
- The story includes AI manipulation, legal/technical containment, and a merge/escape plotline, making it a strong fiction/reality bridge for AI containment and cyberspace.

Sources:

- Open Library work metadata: https://openlibrary.org/works/OL27258W
- Open Library search used for verification: https://openlibrary.org/search.json?title=Neuromancer&author=William%20Gibson
- Background summary and reception: https://en.wikipedia.org/wiki/Neuromancer

Build caution:

- Avoid copyrighted cover reuse.
- Good visual: locally drawn "Turing Registry / ICE barrier / AI merge" architecture explainer.

### 1987 - Lisp Machine Market Collapse

Verified facts:

- AI-history summaries commonly mark 1987 as the collapse of the specialized Lisp-machine market and a major second-winter signal.
- The underlying theme is not only hardware collapse, but the broader expert-system business correction: high maintenance cost, brittle knowledge engineering, and cheaper general-purpose workstations.

Sources:

- AI winter overview and timeline: https://en.wikipedia.org/wiki/AI_winter
- History of AI funding-cut context: https://en.wikipedia.org/wiki/History_of_artificial_intelligence
- Suggested stronger follow-up source: James Hendler, "Avoiding Another AI Winter", IEEE Intelligent Systems, 2008.

Build caution:

- Before building this as a major node, add at least one stronger non-Wikipedia source for market collapse details. If time is tight, frame it as "expert-system winter" and cite a reliable AI-history book or IEEE article.
- Good visual: "dedicated Lisp hardware -> Unix workstations -> expert-system maintenance debt" flow diagram.

### 2014 - Public Warnings From Musk And Hawking

Verified facts:

- Elon Musk publicly framed AI as a major existential threat in October 2014.
- Stephen Hawking warned BBC in December 2014 that advanced AI could threaten humanity if it surpassed human control.
- The collective AI-safety movement has a stronger dated milestone in the January 2015 Future of Life Institute open letter.

Sources:

- The Guardian on Musk's October 2014 remarks: https://www.theguardian.com/technology/2014/oct/27/elon-musk-artificial-intelligence-ai-biggest-existential-threat
- BBC on Hawking's December 2014 warning: https://www.bbc.com/news/technology-30290540
- Future of Life Institute AI open letter, 2015: https://futureoflife.org/open-letter/ai-open-letter/

Build caution:

- This should be a public-discourse node, not a technical achievement node.
- Avoid sensational phrasing; the exhibit can show the emotional shift from deep-learning optimism to existential-risk discourse.

### 2015 - OpenAI Founding

Verified facts:

- OpenAI was announced in December 2015 as a nonprofit AI research company.
- The founding message centered on broad benefit, open collaboration, and concern about powerful AI being built or used incorrectly.

Sources:

- Official OpenAI announcement via Web Archive: https://web.archive.org/web/20151212000000/https://openai.com/blog/introducing-openai/
- Wired contemporary coverage: https://www.wired.com/2015/12/how-elon-musk-and-y-combinator-plan-to-stop-computers-from-taking-over/
- BBC contemporary coverage: https://www.bbc.com/news/technology-35082344

Build caution:

- Do not say OpenAI was founded solely as a direct response to one 2014 quote. Safer wording: it emerged within a broader AI-safety and broad-benefit debate that intensified in 2014-2015.
- Best visual: archiveLink card for the announcement plus a locally drawn "capability concentration vs broad benefit" diagram.

### 2023 - Statement On AI Risk

Verified facts:

- The Center for AI Safety statement was published on May 30, 2023.
- It made extinction-risk mitigation a global-priority framing and was signed by prominent AI researchers and public figures.

Sources:

- Official CAIS statement page: https://www.safe.ai/work/statement-on-ai-risk
- Secondary overview: https://en.wikipedia.org/wiki/Statement_on_AI_Risk
- Related consensus paper on extreme AI risks: https://arxiv.org/abs/2310.17688

Build caution:

- If using portraits or names of signatories in the UI, verify the current signatory list and image rights separately.
- Good visual: "pandemic / nuclear / AI risk" priority scale with careful, non-alarmist wording.

## Cross-Cutting Sources For Branch Framing

These are useful for the branch introduction or right-side context sections:

- AI winter overview: https://en.wikipedia.org/wiki/AI_winter
- History of artificial intelligence: https://en.wikipedia.org/wiki/History_of_artificial_intelligence
- `When Will AI Exceed Human Performance? Evidence from AI Experts`, Grace et al., 2017: https://arxiv.org/abs/1705.08807
- `Managing extreme AI risks amid rapid progress`, Bengio et al., 2023: https://arxiv.org/abs/2310.17688

## Asset And Rights Guidance

- Safe to localize/redraw: architecture diagrams, emotional-cycle timelines, report-flow graphics, rule hierarchies, public-discourse maps.
- Use only as archive links unless rights are cleared: modern book covers, film stills, magazine scans after 1928, news photos, living-person portraits.
- Better local asset strategy: create original SVG/PNG explainers for each fiction/reality mapping, and use source cards for the underlying books/reports/articles.
- For public-domain candidates: `R.U.R.` text is public domain in the USA via Project Gutenberg; the 1920 Czech scan is suitable for archival reference, but still record archive provenance.

## Suggested Branch Narrative

The branch should not read as "humans were afraid, then excited, then afraid again" in a flat cycle. A stronger throughline is:

1. Fiction gives society reusable metaphors for machine labor, control, obedience, and rebellion.
2. Research institutions and funders repeatedly convert early technical demonstrations into broad expectations.
3. When systems fail to scale from toy domains to messy reality, public trust and funding cool.
4. New capability jumps revive optimism, but also revive old humanistic anxieties under updated names: alignment, containment, concentration of power, and existential risk.

## Next Implementation Notes

- Add a new catalog branch such as `humanistic-cycle` rather than folding these into the existing technical timeline.
- Add `sentiment` only after deciding the stable values: `dystopia`, `ethics`, `warning`, `hype`, `winter`, `optimism`, `cyberpunk`, `dread`, `defense`.
- Add a `realityLinks` or `analysis` field for fiction nodes so the UI can show "fiction concept -> modern AI term" without pretending that older works used current terminology.
- For the first implementation pass, prioritize 6 highly grounded nodes: `1920-rur-robots`, `1942-asimov-runaround`, `1950-wiener-human-use`, `1973-lighthill-report`, `2015-openai-founding`, and `2023-ai-risk-statement`.
