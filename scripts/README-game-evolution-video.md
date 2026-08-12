# AI 棋牌动态视频生成

AI 棋牌分支的视频是独立的动态证据模块，不是通用事件讲解视频。正式页面只在模块进入可视区域或用户触发播放时，通过 `shared/video-player.js` 延迟加载 MP4；视频默认静音，不替代对象存储提供的中英文事件讲解音频。

当前支持两种不可混用的模块：

- `gameEvolutionVideo`：由完整、可校验的对局记录生成的真实对局回放。
- `paperCaseVideo`：由论文明确披露的局部状态生成的案例动画，必须持续标注“不是完整牌局回放”。

## 当前视频清单

棋牌 storyline 当前共 13 个事件，其中 5 个有完整对局回放、1 个有论文局部案例、7 个没有独立视频模块：

| 事件 | 动态视频状态 | 当前处理 |
| --- | --- | --- |
| 1951 Strachey Draughts | 无 | 有历史程序与概念材料，尚未策展可双源核验的完整对局记录。 |
| 1988 TD update | 无 | 算法方法事件，不对应一局可独立核验的命名对局。 |
| 1994 Chinook | 完整回放 | Boston 1994 第 2 局，`gameEvolutionVideo`。 |
| 1997 Logistello | 完整回放 | 对村上健第 1 局，`gameEvolutionVideo`。 |
| 1997 Deep Blue | 完整回放 | 对卡斯帕罗夫第 6 局，`gameEvolutionVideo`。 |
| 2000s AlphaCat | 无 | 尚未策展可双源核验的完整中国象棋对局。 |
| 2013 DQN | 无 | 当前展示重点是学习型游戏控制方法，不把 gameplay 片段包装成标准对局回放。 |
| 2016 AlphaGo | 完整回放 | 对李世石第 2 局，`gameEvolutionVideo`。 |
| 2017 AlphaZero | 完整回放 | 对 Stockfish 8 官方精选第 3 局，`gameEvolutionVideo`。 |
| 2017 Libratus | 无 | 尚未策展包含私牌、下注金额、公共牌和结果的完整手牌记录。 |
| 2019 Pluribus | 无 | 已记录明确证据缺口；未取得可独立核验的完整六人手牌。 |
| 2019 Suphx | 论文局部案例 | 论文图 13 的单一决策状态，`paperCaseVideo`，不是完整回放。 |
| 2019 MuZero | 无 | 系统方法事件，尚未选择并核验一局具有独立演示价值的完整记录。 |

“无视频”不代表事件缺少资料或讲解音频，只表示当前没有满足动态证据标准的独立 `achievement.visualModules` 视频。

### 完整对局回放

| 事件 | 对局 | 原始格式 | 记录动作数 | 时长 | MP4 大小 |
| --- | --- | --- | ---: | ---: | ---: |
| Chinook | 廷斯利对 Chinook，Boston 1994 第 2 局 | PDN | 96 | 54 秒 | 502 KiB |
| Logistello | Logistello 对村上健，1997 第 1 局 | Reversi 坐标序列 | 60 | 42 秒 | 429 KiB |
| Deep Blue | 深蓝对卡斯帕罗夫，1997 第 6 局 | PGN | 37 | 36 秒 | 322 KiB |
| AlphaGo | 李世石对 AlphaGo，2016 第 2 局 | SGF | 211 | 65 秒 | 744 KiB |
| AlphaZero | AlphaZero 对 Stockfish 8，官方精选第 3 局 | PGN | 97 | 54 秒 | 533 KiB |

以上五局均满足：

- 至少两个不同记录来源的规范化主线完全一致；
- 原始记录文件 SHA-256、规范化主线 SHA-256、动作数和结果写入 `game-record.json`；
- 解析器按对应规则重放，拒绝非法动作、摘要漂移和动作数不一致；
- 画面是本项目原创棋盘重绘，不复制转播画面、网站截图或出版物图形；
- H.264、`yuv420p`、24 fps、无音轨，并启用 MP4 faststart；
- 最终结果帧停留 3.5 秒，再提示即将重新播放。

### 论文局部案例

| 事件 | 案例 | 证据范围 | 时长 | MP4 大小 |
| --- | --- | --- | ---: | ---: |
| Suphx | 论文图 13：保留安全牌 | 第 22 页图 13 的单一决策状态、实际弃牌与论文提出的假设性后续解释 | 20 秒 | 140 KiB |

Suphx 动画只重绘论文披露的事实：红框北风是当下安全牌，多数人类牌手会先打出；Suphx 实际打出蓝框七索并保留北风。论文用“未来有人意外立直”的假设状态解释保留安全牌的价值，但没有披露完整牌谱、后续真实动作或最终胜负。因此：

- manifest 必须使用 `caseType: "partial-paper-case"`；
- `completeGameReplay` 和 `outcomeKnown` 必须为 `false`；
- 页面、海报和视频内都必须标注“论文局部案例，不是完整牌局回放”；
- 动画不得使用论文图 13 的截图像素，只能依据可见牌面和正文解释原创重绘；
- 最终案例结论帧至少停留 3.5 秒。

### 当前没有视频的证据案例

Pluribus 尚未生成回放。对 Science 论文、候选补充材料端点、论文索引、机构报道、公共镜像和网页档案的检索，没有取得可独立核验的完整手牌记录。完整扑克回放至少需要：

- 相关玩家的私牌；
- 座位、庄位与起始筹码；
- 每条街按顺序记录的动作和下注金额；
- 完整公共牌、底池与最终结果。

在这些信息齐全并完成交叉核验前，不得把 Pluribus 概念图、局部示例或推测动作做成“真实对局回放”。检索记录见：

`archive/events/2019-pluribus/research-notes/sample-hand-review.json`

## 权威输入与目录

完整对局的权威输入位于：

```text
archive/events/<event-id>/game-records/
├── game-record.json       # 来源、摘要、结果、渲染参数与 Archive 资产映射
└── <record-file>          # PGN、PDN、SGF 或 Reversi 坐标序列
```

论文局部案例位于：

```text
archive/events/<event-id>/paper-cases/
└── paper-case.json        # renderer、证据摘要、事实边界、场景时长与资产映射
```

生成产物位于：

```text
resources/videos/game-evolution/<event-id>/*.mp4
resources/images/game-evolution/<event-id>/*.png
```

`assets.json` 登记视频和海报资源，`event.json` 的 `achievement.visualModules` 负责选择 `gameEvolutionVideo` 或 `paperCaseVideo`。不要把这类视频写回旧的 `videoUrl` 或 `resources.videos`。

## 环境准备

视频生成依赖 Python、Pillow、`python-chess`、`sgfmill` 和 ffmpeg：

```bash
python3 -m venv .venv-game-video
.venv-game-video/bin/pip install -r requirements-game-video.txt
ffmpeg -version
ffprobe -version
```

`requirements-game-video.txt` 还保留 OpenCV 和 NumPy，供旧的单次 SGF 工具使用；当前 Archive 对局管线的主要渲染由 Pillow 完成。

## 生成完整对局回放

生成全部 `game-record.json`：

```bash
npm run generate:game-videos
```

只生成一个或多个指定 manifest：

```bash
.venv-game-video/bin/python scripts/game-evolution/render_game_record.py \
  archive/events/2016-alphago/game-records/game-record.json \
  archive/events/2017-alphazero/game-records/game-record.json
```

只校验原始记录和现有 MP4/海报，不重新渲染：

```bash
.venv-game-video/bin/python scripts/game-evolution/render_game_record.py --check
npm run validate:game-records
```

运行解析器与节奏单元测试：

```bash
.venv-game-video/bin/python scripts/game-evolution/test_game_record.py
```

实现按职责拆分：

- `game_record_core.py`：数据模型、记录解析、合法重放、摘要和帧时长；
- `game_record_frames.py`：国际象棋、黑白棋、围棋、美式跳棋与信息面板绘制；
- `game_record_video.py`：帧序列、ffmpeg 编码和输出探测；
- `render_game_record.py`：稳定的完整对局命令行入口。

## 生成论文局部案例

生成全部 `paper-case.json`：

```bash
npm run generate:paper-case-videos
```

只生成指定案例：

```bash
.venv-game-video/bin/python scripts/game-evolution/render_paper_case.py \
  archive/events/2019-suphx/paper-cases/paper-case.json
```

只校验证据摘要、事实边界和现有产物：

```bash
.venv-game-video/bin/python scripts/game-evolution/render_paper_case.py --check
npm run validate:paper-cases
```

`scripts/validate-paper-cases.js` 会拒绝把论文案例声明为完整回放，并校验双语限制说明、场景总时长、最终停留、证据 PDF 摘要、Archive 资产映射、MP4 和海报尺寸。

每个论文案例还必须声明受支持的 `renderer`。当前仅支持 `suphx-safe-tile-v1`；Node 校验器与 Python 生成器都会校验该 renderer 所需的牌面字段和固定场景顺序。新增其他论文案例前，必须先实现并登记对应 renderer，不能自动套用 Suphx 麻将模板。

## 修改后的完整工作流

修改原始记录、案例事实、渲染参数、资产或 visual module 后，依次执行：

```bash
# 1. 按类型重新生成视频
npm run generate:game-videos
npm run generate:paper-case-videos

# 2. 校验 Archive、完整对局和论文案例
npm run validate:archive

# 3. 从 Archive 重新生成运行时数据
npm run generate

# 4. 运行与 CI 一致的完整门禁
npm run verify:pr
```

提交前还应抽查：

- 海报、关键中间帧和最终帧中文字无缺字或遮挡；
- `ffprobe` 只报告一个视频流，没有音频流；
- 桌面和移动端均使用 `data-video-src` 与 `preload="none"` 延迟加载；
- 完整对局显示“对局回放”，论文案例显示“论文局部案例”；
- Pluribus 等证据不足的事件没有被错误添加动态回放。

## 存储与发布

当前 5 个完整回放和 1 个论文案例合计约 2.7 MiB，单个文件约 140–744 KiB，继续由 GitHub 仓库管理并随静态站发布是合适的。`npm run build:static` 会包含 `resources/videos/game-evolution/` 下的生产素材，同时排除 `resources/videos/*.json` 历史候选元数据。

当视频数量或单文件体积显著增长时，再评估对象存储；迁移前必须保持 Archive 资产映射、懒加载、缓存策略和静态发布回退一致。通用事件讲解音频仍按现行策略由对象存储提供。

## 旧工具

`scripts/sgf_to_video.py` 和 `examples/sgf/sample-go-game.sgf` 只用于一次性方形围棋短片，不是当前生产 Archive 管线。正式棋牌事件优先使用本目录的 manifest、解析器、双源核验和验证脚本。
