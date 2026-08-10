# 音频审核服务

这是独立于公开展示页和 Archive 管理后台的多人音频审核服务。

## 审核规则

- 每位审核人使用独立 Token 登录，可以审核任意当前候选；不做领取或任务锁定。
- 每次提交都会追加一条 `pass` 或 `fail` 记录，不覆盖其他审核人的记录。
- 一个候选只要存在一条未撤销的 `pass` 记录，汇总状态就是“已通过”。
- 修改后的音频必须使用新的 revision 和候选 ID 重新进入审核库；旧候选及记录继续保留。
- 管理员只能撤销错误记录，不能物理删除审核历史。

## 本地启动

先生成审核数据：

```bash
npm run audio:workflow -- review
```

为每位审核人生成 Token：

```bash
npm run audio:review:token -- --id reviewer-zhang --name 张三
```

将输出的配置项合并写入已忽略的 `.secrets/audio-review-tokens.json`，然后启动：

```bash
npm run start:audio-review
```

默认地址为 `http://127.0.0.1:3002`。局域网使用时设置 `HOST=0.0.0.0`；公网部署必须放在 HTTPS 反向代理后，并设置 `AUDIO_REVIEW_SECURE_COOKIE=true`。多人或公网部署建议同时设置 `AUDIO_REVIEW_STRICT_ORIGIN=true`，并用 `AUDIO_REVIEW_ALLOWED_ORIGINS` 明确允许访问审核台的站点 Origin。

审核台支持挂在已有展示域名的子目录，例如 `https://example.com/audio-review/`。反向代理必须保留
浏览器地址中的末尾斜线，并把 `/audio-review/` 前缀剥离后转发到服务根路径。页面内部使用相对
API 和音频 URL，因此根路径运行与子目录运行都可用。

## 数据与配置

| 环境变量                       | 默认值                                        | 说明                                     |
| ------------------------------ | --------------------------------------------- | ---------------------------------------- |
| `HOST`                         | `127.0.0.1`                                   | 监听地址                                 |
| `PORT`                         | `3002`                                        | 监听端口                                 |
| `AUDIO_REVIEW_DATA`            | `tools/audio-review-console/review-data.json` | 当前审核数据                             |
| `AUDIO_REVIEW_DB`              | `.tmp/audio-review/reviews.sqlite`            | SQLite 数据库                            |
| `AUDIO_REVIEW_TOKEN_FILE`      | `.secrets/audio-review-tokens.json`           | Token 摘要配置                           |
| `AUDIO_REVIEW_SECURE_COOKIE`   | `false`                                       | HTTPS 部署时设为 `true`                  |
| `AUDIO_REVIEW_STRICT_ORIGIN`   | `false`                                       | 设为 `true` 后写接口必须带可信 `Origin`  |
| `AUDIO_REVIEW_ALLOWED_ORIGINS` | 空                                            | 逗号分隔的可信 Origin 白名单，例如域名源 |

数据库使用 WAL 模式。正式部署必须把数据库放在持久卷中，并定期备份数据库及其 WAL 文件，或在停写窗口复制完整数据库。

严格 Origin 模式关闭时，服务保持本地调试兼容：缺失 `Origin` 的写请求会放行，存在 `Origin` 时必须与请求 `Host` 同源。严格模式开启时，写请求缺失 `Origin` 会返回 403；配置白名单后，只有白名单内的 Origin 可以登录、提交审核、撤销记录或退出登录。白名单只填写协议、域名和端口，不包含路径；审核台挂在 `https://example.com/audio-review/` 时应写为：

```bash
AUDIO_REVIEW_STRICT_ORIGIN=true
AUDIO_REVIEW_ALLOWED_ORIGINS=https://example.com
```

## Docker Compose

```bash
npm run audio:workflow -- review
docker compose --profile review up --build audio-review
```

如需改端口，设置 `AUDIO_REVIEW_PORT` 即可，例如：

```bash
AUDIO_REVIEW_PORT=3003 docker compose --profile review up --build audio-review
```

Compose 将审核数据和候选音频只读挂载进容器，只允许 `/data` 持久卷写入。它不会把仓库根目录作为静态目录暴露出去。

## 服务端接口

- `POST /api/auth/session`：Token 登录并建立 HttpOnly Cookie 会话。
- `GET /api/review-data`：获取带稳定候选 ID 的审核数据。
- `GET/POST /api/reviews`：读取汇总、追加审核记录。
- `GET /api/reviews/approved-manifest`：获取至少有一条有效通过记录的候选。
- `GET /api/reviews/unapproved`：获取尚无有效通过记录的候选。
- `POST /api/reviews/:id/invalidate`：管理员撤销错误审核记录。
- `GET /api/audio/:audioId`：鉴权播放清单中的候选或连续预览音频，支持 HTTP Range。
