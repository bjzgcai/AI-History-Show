# PPT 生成工具

本目录集中维护 AI History Show 的 PowerPoint 生成脚本。

## 环境依赖

PPT 生成器使用 Python 的 Pillow、`python-pptx`，并使用 ImageMagick 的 `convert` 命令将 SVG 资源转成 PPTX 可嵌入的位图。首次使用时执行：

```bash
python3 -m venv .venv-ppt
.venv-ppt/bin/pip install -r scripts/ppt/requirements.txt
source .venv-ppt/bin/activate
```

Ubuntu/Debian：

```bash
sudo apt-get install imagemagick
```

macOS：

```bash
brew install imagemagick
```

安装依赖后，用该虚拟环境中的 Python 运行生成命令，例如：

```bash
.venv-ppt/bin/python scripts/ppt/generate-storyline-ppts.py \
  --storyline bench-council-ai100 \
  --parts 4
```

## 样例 PPT

```bash
npm run generate:ppt-sample
```

输出到 `.tmp/ppt-sample/`。

## Storyline 全量 PPT

生成四条故事线：

```bash
npm run generate:storyline-ppts
```

只生成 BenchCouncil AI100，并按事件拆成 4 册：

```bash
npm run generate:storyline-ppts -- \
  --storyline bench-council-ai100 \
  --parts 4
```

输出到 `exports/ai-history-ppt/`。分册按故事线顺序使用连续事件区间，每个事件的两页内容保持在同一册内。

激活虚拟环境后，也可以使用项目级 npm 入口：

```bash
npm run generate:ppt-sample
npm run generate:storyline-ppts -- --storyline bench-council-ai100 --parts 4
```
