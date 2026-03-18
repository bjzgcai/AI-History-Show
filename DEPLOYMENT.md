# 部署指南

本项目包含两个独立部分：
- **展示页**（`index.html`）：纯静态 HTML5，任何静态文件服务器均可运行
- **内容管理服务**（`manage/server.js`）：Node.js 服务，用于在线编辑内容，**仅需在有编辑需求时运行**

---

## 一、展示页部署

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

在本地执行，将项目文件同步到服务器（排除 .git，约 35MB）：

```bash
cd /path/to/AI-History-Show
rsync -avz --exclude='.git' ./ root@你的服务器IP:/var/www/ai-history/
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
rsync -avz --exclude='.git' ./ root@你的服务器IP:/var/www/ai-history/
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

## 二、内容管理服务部署（manage/server.js）

`server.js` 提供网页版内容编辑功能（端口 3001）。它会直接修改服务器上的 `manage/events.js`、`manage/catalog.js`，并重新生成 `milestones-data.js`，**Nginx 无需重启，刷新展示页即生效**。

> **安全原则：不要将 3001 端口直接暴露到公网**，推荐通过 SSH 隧道访问。

### 第一步：确认 Node.js 已安装（v14+）

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

# 启动管理服务
pm2 start manage/server.js --name ai-admin

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
    auth_basic "管理后台";
    auth_basic_user_file /etc/nginx/.htpasswd;
}

location /api/ {
    proxy_pass http://localhost:3001;
    auth_basic "管理后台";
    auth_basic_user_file /etc/nginx/.htpasswd;
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

访问地址：`http://你的域名/admin`（安全组**只需开放 80/443，不开放 3001**）。

---

## 三、验证部署

**展示页：**

- [ ] 页面正常加载，显示第一个里程碑
- [ ] 3D 地球旋转正常（需 Three.js 加载成功）
- [ ] 左右切换页面，地球旋转到对应地点并出现红色标记
- [ ] 图片正常显示
- [ ] 浏览器控制台无报错

**内容管理服务：**

- [ ] `http://localhost:3001/admin`（或反代地址）可正常打开
- [ ] 侧边栏显示分类和事件列表
- [ ] 点击"应用数据"能正常预览变更并确认生成
- [ ] 生成后刷新展示页，内容已更新
