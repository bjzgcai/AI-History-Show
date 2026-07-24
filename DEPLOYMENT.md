# 部署指南

本项目包含两个独立部分：
- **展示页**（`index.html`）：纯静态 HTML5，任何静态文件服务器均可运行
- **内容管理服务**（`manage/server.js`）：Archive-only Node.js 服务，用于编辑和校验 Archive JSON，**仅需在有编辑需求时运行**

---

## 一、可复现启动命令

推荐先使用本节命令验证本地、容器和 CI 的基础启动路径。项目没有第三方运行时依赖，但仍使用 `npm ci` 锁定命令入口和 Node.js 版本约束。

### 本地命令

```bash
cd /path/to/AI-History-Show
npm ci

# 生成展示数据，并运行路由、触摸滑动、HTTP 启动校验
npm run validate:deployment

# 本地预览展示页，默认监听 http://localhost:8000
npm run start:static

# 展厅本机演示服务，固定使用 127.0.0.1:8000
npm run start:demo

# Archive 内容管理服务，默认入口 http://localhost:3001/admin
npm run start:admin
```

如需改端口：

```bash
PORT=8080 npm run start:static
PORT=3002 npm run start:admin
```

管理服务默认只监听 `127.0.0.1`。确需在受保护内网监听其他网卡时，显式设置 `HOST`；Docker admin stage 已配置为容器内监听 `0.0.0.0`。

### Docker 单容器预览

`Dockerfile` 默认构建 Nginx 展示页镜像，对应下面“方案一：Nginx 云服务器”的部署流程：

1. 使用 Node.js 生成 `milestones-data.js` 和 `milestones-data-default.js`。
2. 运行 `npm run build:static`，将页面、正式数据、`shared/`、`resources/` 和所需 `public/` 资源组装到 `.tmp/static-site/`。
3. Docker presentation stage 与 GitHub Pages 都只发布这一个 allowlist 静态包。
4. 使用容器内的 Nginx 在 `8000` 端口提供静态展示页。

```bash
docker build -t ai-history-show .
docker run --rm -p 8000:8000 ai-history-show
```

访问：

```text
http://localhost:8000/
http://localhost:8000/dual-screen.html
```

### Docker Compose

默认只启动展示页：

```bash
docker compose up --build presentation
```

如需同时启动本地内容管理服务：

```bash
docker compose --profile admin up --build
```

访问：

```text
展示页：http://localhost:8000/
管理后台：http://localhost:3001/admin
```

Compose 中的 `admin` 服务会把当前项目目录挂载到容器的 `/app`，因此 Archive 编辑器保存的 `archive/events/*` 与 `archive/storylines/*` JSON，以及随后通过 `npm run generate` 产生的运行时数据，会同步写回本地工作区。

> **安全提示**：`admin` 服务无认证保护，只能用于本机、内网或受保护环境。不要把 `3001` 直接暴露到公网。

### CI 验证

GitHub Actions 工作流位于 `.github/workflows/deployment.yml`，会执行：

```bash
npm ci
npm run validate:deployment
docker build -t ai-history-show:ci .
docker run --rm -d --name ai-history-show-ci -p 18080:8000 ai-history-show:ci
curl -fsS http://127.0.0.1:18080/
docker compose config --quiet
```

其中 `validate:deployment` 会生成 `milestones-data.js`，运行现有 JS 测试，并启动展示页与管理服务做 HTTP 冒烟测试。CI 还会构建 Nginx 容器镜像、运行容器并请求首页，确认容器化展示页可以启动。

---

## 二、展示页部署

### 可选：启用 Umami 统计

展示页内置了可插拔统计模块。Umami 专属配置位于 `shared/umami-config.js`，通用 provider 选择位于 `shared/analytics-config.js`。Umami 未启用或 `websiteId` 为空时，通用配置自动使用 `none` provider，不会加载第三方脚本或发送网络请求，也不会影响页面启动。

Umami 部署完成后，只需修改 `shared/umami-config.js` 中的开关和 Website ID：

```js
globalScope.AI_HISTORY_UMAMI_CONFIG = {
    enabled: true,
    websiteId: '你的 Umami Website ID',
    scriptUrl: 'https://museum.bza.edu.cn/umami/script.js',
    hostUrl: 'https://museum.bza.edu.cn/umami',
    autoTrack: true,
    domains: ['museum.bza.edu.cn']
};
```

当前采集地址已配置为 `https://museum.bza.edu.cn/umami/script.js`，数据发送到 `https://museum.bza.edu.cn/umami/api/send`。内网管理面板和 Docker 服务地址不进入前端配置。`websiteId` 缺失、Umami 服务不可达或脚本被浏览器拦截时，统计模块会静默降级，不阻塞展示页面。

当前自定义事件包括 `session_start`、`storyline_view`、`storyline_leave`、`storyline_switch`、`storyline_picker_open`、`milestone_view`、`milestone_leave`、`quiz_impression`、`quiz_answer`、`mobile_quiz_start`、`mobile_quiz_complete` 和 `qr_landing`。故事线进入会立即记录，故事线停留时间只累计页面可见且观众活跃的时间。事件浏览需累计至少 1 秒可见时间；连续 60 秒没有人工操作会暂停停留计时，30 分钟没有操作后再次互动会开始新会话。大屏自动轮播不会直接产生有效事件浏览，除非观众随后发生真实操作。

### 方案对比

| 维度 | 方案一：Nginx 云服务器 | 方案二：Gitee Pages |
|------|----------------------|-------------------|
| 上手难度 | 中（需 Linux 基础） | 低（网页操作） |
| 启动时间 | 30~60 分钟 | 5~10 分钟 |
| 展厅离线/内网使用 | ✅ 支持 | ❌ 不支持 |
| 访问控制 | 完全可控（IP 白名单等） | 仅公开访问 |
| 维护成本 | 需定期维护服务器 | 零维护 |
| 费用 | 服务器费（约 40~100元/月） | 免费 |
| 推荐场景 | 生产/展厅/长期运行 | 演示/分享/快速验证 |

### 方案一：Nginx 云服务器（推荐展厅/生产环境）

**第一步：上传文件到服务器**

在本地生成最小静态发布包，再只同步该目录（不上传 Archive 源、管理端、候选资料 helper 和内部报告）：

```bash
cd /path/to/AI-History-Show
npm ci
npm run validate:archive
npm run generate
npm run build:static
rsync -avz --delete .tmp/static-site/ root@你的服务器IP:/var/www/ai-history/
```

**第二步：安装 Nginx**

```bash
# Ubuntu / Debian
sudo apt update && sudo apt install -y nginx

# CentOS / RHEL
sudo yum install -y nginx
```

**第三步：写 Nginx 配置**

```bash
sudo nano /etc/nginx/sites-available/ai-history
```

粘贴以下内容，将 `your-domain.com` 替换为你的域名或服务器 IP：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/ai-history;
    index index.html;

    # 图片/JS/CSS 缓存 7 天
    location ~* \.(jpg|jpeg|png|webp|js|css)$ {
        expires 7d;
        add_header Cache-Control "public";
    }

    # gzip 压缩（减少传输体积）
    gzip on;
    gzip_types text/html application/javascript text/css image/svg+xml;
}
```

```bash
# 启用配置，测试并重载
sudo ln -s /etc/nginx/sites-available/ai-history /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**第四步：开放防火墙端口**

在云控制台的安全组中放行：

| 端口 | 协议 | 用途 |
|------|------|------|
| 80   | TCP  | HTTP |
| 443  | TCP  | HTTPS（配置 HTTPS 后需要） |

**第五步（可选）：配置 HTTPS**

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
# 按提示操作，证书自动续期
```

**后续更新展示内容**

每次内容有改动，重新 rsync 即可，无需重启 Nginx：

```bash
npm run generate
npm run build:static
rsync -avz --delete .tmp/static-site/ root@你的服务器IP:/var/www/ai-history/
```

---

### 方案二：Gitee Pages（推荐快速演示/分享）

**第一步：推送代码到 Gitee**

```bash
git add .
git commit -m "deploy"
git push origin master
```

**第二步：开启 Gitee Pages**

1. 进入 Gitee 仓库页面
2. 点击顶部菜单 **服务 → Gitee Pages**
3. 分支选 `master`，部署目录选 `/`（根目录）
4. 点击 **启动**
5. 约 1 分钟后生成访问链接：`https://用户名.gitee.io/仓库名/`

**后续更新**

每次 push 后，进入 Gitee Pages 页面手动点击 **更新** 按钮即可。

> Gitee Pro 用户可开启自动部署，免去手动操作。

---

### ⚠️ 离线 / 内网部署注意

`index.html` 引用了 **Three.js CDN**（`unpkg.com`）。内网或无外网环境需将其下载到本地：

```bash
mkdir -p vendor
curl -o vendor/three.min.js https://unpkg.com/three@0.160.0/build/three.min.js
```

然后修改 `index.html` 中的引用（搜索 `unpkg.com/three`）：

```html
<!-- 将这行 -->
<script src="https://unpkg.com/three@0.160.0/build/three.min.js"></script>

<!-- 替换为 -->
<script src="vendor/three.min.js"></script>
```

---

## 二、多显示器全屏演示

本节面向**展厅现场 / 双横屏演示**。目标不是“普通浏览器打开网页”，而是尽量做到：

- 双屏横向铺满
- 浏览器 UI 最小化
- 适合现场稳定重复演示

双屏展陈页面入口：

```text
http://localhost:8000/dual-screen.html
```

### 方案对比

| 方案 | 典型做法 | 能否跨双屏 | 能否去掉地址栏/标签栏 | 能否去掉系统标题栏 | 稳定性 |
|------|----------|------------|----------------------|-------------------|--------|
| 跨屏窗口方案 | `Edge/Chrome --app` + DisplayFusion 跨屏 | ✅ | ✅ | ❌ 通常不行 | 中 |
| 合成超宽屏方案 | `Intel Graphics Software` / `NVIDIA Surround` 合成单个逻辑显示器，再 `F11` / `--kiosk` | ✅ | ✅ | ✅ 更容易实现 | 高 |
| 正式布展方案 | 桌面壳程序（如 Electron）或专业拼接器 | ✅ | ✅ | ✅ | 很高 |

### 当前已知结论与限制

- `DisplayFusion` 负责的是**窗口级别**操作，例如跨屏、位置、尺寸、置顶。
- `Chrome/Edge` 的标签栏、地址栏、标签页属于**浏览器自身 UI**，不是网页内容，DisplayFusion 不能直接移除。
- `--app` 模式可以去掉地址栏和标签页，但通常仍会保留一条**系统窗口标题栏**。
- 浏览器原生 `F11` / 普通全屏，在“扩展桌面”模式下通常只会占用**当前一块屏**，不等于双屏全屏。
- 只有把两块屏先合成一个**逻辑上的超宽显示器**后，`F11` 或 `--kiosk` 才会真正跨双屏铺满。
- “跨屏窗口”不等于“单个超宽逻辑显示器”。前者是窗口横跨两块屏，后者是系统层把两块屏当成一块屏。
- “浏览器 UI”和“网页 UI”是两层不同对象。网页可以做沉浸式布局，但不能单独移除浏览器外壳。

### Windows 推荐操作顺序

**第一步：启动本地静态服务**

```bash
cd /path/to/AI-History-Show
npm ci
npm run start:demo
```

**第二步：优先验证双屏页面**

浏览器访问：

```text
http://localhost:8000/dual-screen.html
```

或直接用 Edge `app` 模式：

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="http://localhost:8000/dual-screen.html"
```

**第三步：优先尝试显卡控制软件合屏**

- 如果两块目标屏由同一块 `Intel` 驱动，优先查看 `Intel Graphics Software` 的多显示器/合屏能力。
- 如果两块目标屏由同一块 `NVIDIA` 驱动，优先查看 `NVIDIA Control Panel -> 配置 Surround, PhysX`。
- 合屏成功后，Windows 会把两块屏识别为一个超宽显示区域。

**第四步：合屏成功后再进入沉浸模式**

先用 `--app` 验证页面布局和拼缝安全区，再切换：

- `F11`：常规浏览器全屏
- `--kiosk`：更适合现场演示

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --kiosk "http://localhost:8000/dual-screen.html"
```

### Windows 故障排查

**1. `NVIDIA Surround` 灰掉，无法勾选**

常见原因是两块目标屏**不在同一块 NVIDIA 上**。判断方式：

- 看 `NVIDIA 控制面板 -> 配置 Surround, PhysX` 的拓扑图
- 或看 `Windows -> 设置 -> 系统 -> 显示 -> 高级显示`

如果两块屏挂在 `Intel` 下面，而不是 `NVIDIA` 下面，那么 `NVIDIA Surround` 无法用于这两块屏。

**2. 两块屏都在同一块 Intel 上**

这时应优先检查 `Intel Graphics Software` 是否支持：

- 多显示器拼接
- 合并桌面
- Collage / Combined Desktop / Span 等能力

如果 Intel 端能完成合屏，就不需要再依赖 `NVIDIA Surround`。

**3. 无法合屏，只能扩展桌面**

退回到“跨屏窗口方案”：

- 使用 `Edge/Chrome --app`
- 使用 DisplayFusion 执行 `Span Window Across all Monitors`
- 接受保留系统标题栏这一现实限制

这条方案可以用于快速演示，但不等于真正的双屏全屏。

**4. 为什么 `F11` 后窗口又只回到一块屏**

说明当前系统仍然是“扩展桌面”，还没有把双屏合成一个超宽逻辑显示器。此时 `F11` 只会占用当前显示器。

### 示例命令

本地启动静态服务：

```bash
npm run start:static
```

Edge `app` 模式：

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="http://localhost:8000/dual-screen.html"
```

Edge `kiosk` 模式：

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --kiosk "http://localhost:8000/dual-screen.html"
```

---

## 四、内容管理服务部署（manage/server.js）

`server.js` 提供 Archive-only 本地内容管理服务（端口 3001）：使用 `/admin` 编辑 `archive/events/*` 与 `archive/storylines/*` JSON，并运行 `npm run validate:archive` 与 `npm run generate` 生成 `milestones-data.js`。旧 `/archive-admin` 与 Legacy API 已退役并返回 HTTP 404。**Nginx 无需重启，生成后刷新展示页即可生效**。

> `/admin` 当前是原始 JSON 编辑器；保存后应先运行 Archive validation，再生成运行时数据。
> **安全原则：不要将 3001 端口直接暴露到公网**，推荐通过 SSH 隧道访问。

### 第一步：确认 Node.js 已安装（v22+）

```bash
node -v
```

如未安装：

```bash
# Ubuntu / Debian
sudo apt install -y nodejs

# CentOS
sudo yum install -y nodejs
```

### 第二步：用 PM2 守护进程运行

PM2 确保进程崩溃后自动重启、服务器重启后自动恢复：

```bash
# 安装 PM2（全局，只需一次）
npm install -g pm2

# 进入项目目录
cd /var/www/ai-history
npm ci

# 启动管理服务
pm2 start npm --name ai-admin -- run start:admin

# 设置开机自启
pm2 startup   # 按输出提示执行一条 sudo 命令
pm2 save
```

常用 PM2 命令：

```bash
pm2 status            # 查看运行状态
pm2 logs ai-admin     # 查看实时日志
pm2 restart ai-admin  # 重启
pm2 stop ai-admin     # 停止
```

### 第三步：通过 SSH 隧道访问（推荐）

在**本地**建立隧道，无需在安全组开放 3001 端口：

```bash
ssh -L 3001:localhost:3001 root@你的服务器IP
```

然后在本地浏览器访问 `http://localhost:3001/admin`，流量走加密 SSH 通道。

> 每次需要编辑内容时建立隧道，编辑完断开即可。

---

### 可选：通过 Nginx 反代暴露到公网（需密码保护）

如果需要从任意位置访问管理后台，通过 Nginx 反代并加 Basic Auth：

**创建密码文件：**

```bash
sudo apt install -y apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd admin
# 按提示输入密码
```

**在 Nginx 配置中追加（放在 `server {}` 块内）：**

```nginx
location /admin {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $http_host;
    auth_basic "管理后台";
    auth_basic_user_file /etc/nginx/.htpasswd;
}

location /api/ {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $http_host;
    auth_basic "管理后台";
    auth_basic_user_file /etc/nginx/.htpasswd;
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

访问地址：`http://你的域名/admin`（安全组**只需开放 80/443，不开放 3001**）。

---

## 五、验证部署

**命令校验：**

```bash
npm ci
npm run validate:deployment
docker build -t ai-history-show:ci .
```

**展示页：**

- [ ] 页面正常加载，显示第一个里程碑
- [ ] 3D 地球旋转正常（需 Three.js 加载成功）
- [ ] 左右切换页面，地球旋转到对应地点并出现红色标记
- [ ] 图片正常显示
- [ ] 浏览器控制台无报错

**内容管理服务：**

- [ ] `http://localhost:3001/admin`（或反代地址）可正常打开
- [ ] Archive 事件和 JSON 文件列表可加载
- [ ] 保存 Archive JSON 后，页面内 validation 可通过
- [ ] 运行 `npm run generate` 后刷新展示页，内容已更新
- [ ] `http://localhost:3001/archive-admin` 返回 HTTP 404
