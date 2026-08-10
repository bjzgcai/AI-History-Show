# 两院对象存储音频方案

## 方案定位

AI 历史事件讲解音频使用两院对象存储的 `ai-history` Bucket。对象存储同时承担音频源文件保存、自动化上传和线上分发，适合 200 个以上音频文件的程序化管理。

推荐链路：

```text
生成或录制音频
→ 上传 ai-history Bucket
→ 写入或更新 audio-manifest.json
→ S3 Endpoint 或媒体网关提供稳定 URL
→ 网页播放器播放
```

上传凭证只供发布脚本、CI 或服务端使用，不能写入仓库、Archive JSON、前端代码或静态发布产物。

## Bucket 信息

| 配置项      | 值                            |
| ----------- | ----------------------------- |
| Bucket      | `ai-history`                  |
| 租户        | `innovation`                  |
| 用户        | `liangdong`                   |
| 用户 ID     | `innovation$liangdong`        |
| 子集群      | `BZA_OBJ_01`                  |
| S3 Endpoint | `https://s3.inner.bza.edu.cn` |
| 创建时间    | `2026-08-07 09:10 UTC`        |
| 版本控制    | `Closed`                      |
| 配额        | 无限制                        |

访问密钥已经单独配置，但本文档不记录 AK/SK 的值。密钥应存放在本机环境变量、CI Secret 或公司的密钥管理服务中。

该 Endpoint 使用 Ceph RGW 多租户命名。签名 SDK 请求仍使用 Bucket 名 `ai-history`；匿名 path-style URL 必须使用租户限定路径 `innovation%3Aai-history`，否则网关会返回 `NoSuchBucket`。

由于当前 Endpoint 域名包含 `inner`，部署前必须确认展示终端或线上服务所在网络能够访问该地址。若公网客户端不能访问，应由可访问内网 Endpoint 的媒体网关或反向代理对外提供音频。

## 对象键结构

建议使用以下结构：

```text
s3://ai-history/audio/
  masters/<event-id>/<lang>/narration-v1.wav
  releases/<event-id>-<lang>-<edition>-v1.mp3
  manifests/audio-manifest.json
```

- `masters/` 保存无损或高质量母版。
- `releases/` 保存网页实际播放的版本化压缩文件；中文可包含 `original` 与 `interact` 版本。
- `manifests/` 保存对象键、版本、大小、checksum 和生产 URL。
- `<event-id>` 使用 Archive 事件 ID，例如 `1956-dartmouth`。
- `<lang>` 使用 `zh`、`en` 等固定语言代码。
- 文件名包含显式版本，例如 `narration-v1.mp3`，避免覆盖已有对象。

示例对象：

```text
s3://ai-history/audio/releases/1950-turing-test-zh-interact-v1.mp3
```

Bucket 当前未开启版本控制。即使文件名已经版本化，也建议评估开启 Bucket 版本控制，以降低误覆盖或误删除造成的数据损失风险。

## 音频规范

网页交付版 MP3 建议使用：

- 单声道；
- 44.1 kHz 或 48 kHz；
- 96–128 kbps；
- `Content-Type: audio/mpeg`；
- 带长期缓存的版本化对象使用 `Cache-Control: public, max-age=31536000, immutable`。

母版可使用 WAV。交付版优先使用兼容性较好的 MP3；如需 M4A、AAC 或 OGG，应在 manifest 中为每种格式分别记录对象键和 MIME 类型。

## 凭证配置

发布环境使用环境变量或 Secret 注入凭证，不提交 `.env` 文件：

```bash
export BZA_S3_ENDPOINT='https://s3.inner.bza.edu.cn'
export BZA_S3_BUCKET='ai-history'
export AWS_ACCESS_KEY_ID='<从密钥管理服务读取>'
export AWS_SECRET_ACCESS_KEY='<从密钥管理服务读取>'
```

区域名和是否强制 path-style 访问需要向对象存储管理员确认。兼容 S3 的系统通常可以使用 AWS CLI、AWS SDK 或其他 S3 客户端，但不能在未验证前假定其 region、签名和 URL 风格与 AWS 公有云完全一致。

上传示例：

```bash
aws --endpoint-url "$BZA_S3_ENDPOINT" s3 cp \
  ./1950-turing-test-zh-interact-v1.mp3 \
  "s3://$BZA_S3_BUCKET/audio/releases/1950-turing-test-zh-interact-v1.mp3" \
  --content-type audio/mpeg \
  --cache-control 'public, max-age=31536000, immutable'
```

项目已经提供对应命令：

```bash
npm run audio:release -- check
npm run audio:release -- manifest
npm run audio:release:dry-run
npm run audio:release -- push
npm run audio:release -- verify
npm run audio:release -- publish-access
```

脚本从 Archive 中查找 `type: "audio"` 的资产，读取其 `storage` 元数据，生成 SHA-256 checksum，并通过对象 metadata 判断是否需要重复上传。生成的本地 manifest 位于 `.tmp/audio/audio-manifest.json`，远端默认写入 `audio/manifests/audio-manifest.json`。

上传使用 AWS SDK 默认重试机制和低并发 multipart uploader。当前工具覆盖本地检查、manifest 生成、dry-run、增量上传、强制重传和签名 HEAD 校验；不包含从 Bucket 覆盖本地文件的 `pull` 操作。

真实配置可参考仓库根目录的 `.env.example`，但脚本不会自动读取 `.env`。运行上传命令前，应由 shell、CI Secret 或密钥管理工具注入环境变量。

## 网页访问方式

S3 对象可以形成稳定媒体地址，但“已上传到 Bucket”不等于“浏览器可以匿名播放”。必须同时满足：

1. 展示终端能够访问 `s3.inner.bza.edu.cn`，或者有可访问该 Endpoint 的媒体网关；
2. Bucket policy 或对象 ACL 允许所需的 `GetObject`；
3. 服务响应正确的 `Content-Type`；
4. 支持 `Accept-Ranges` 和 HTTP `206 Partial Content`，以便拖动和断点播放；
5. CORS 允许展示页面的正式域名发起 `GET` 和 `HEAD` 请求；
6. 全链路使用 HTTPS。

有两种发布模式：

### 模式 A：媒体网关，推荐

```text
浏览器
→ https://<media-domain>/audio/releases/1950-turing-test-zh-interact-v1.mp3
→ Nginx/CDN/音频网关
→ https://s3.inner.bza.edu.cn
→ ai-history Bucket
```

Bucket 保持私有，媒体网关负责鉴权、Range 请求、缓存、CORS 和对外域名。该模式不会向浏览器暴露 S3 凭证，也不要求终端直接访问内网 Endpoint。

### 模式 B：Bucket 匿名只读

只对 `audio/releases/` 前缀开放匿名 `GetObject`，母版和 manifest 仍保持私有。
`npm run audio:release -- publish-access` 会保留已有 Bucket policy 与 CORS 规则，并合并项目专用规则；不会开放 `ListBucket`、上传或删除权限。浏览器直接使用对象 URL，例如 path-style 地址为：

```text
https://s3.inner.bza.edu.cn/innovation%3Aai-history/audio/releases/1950-turing-test-zh-interact-v1.mp3
```

上述 URL 需要在对象读取策略配置后验证。正式使用前需要通过无登录浏览器测试实际返回音频、`Content-Type`、CORS 和 Range 响应。不要为了直链播放把 AK/SK 放入前端。

## Archive 与 manifest

Archive 中每个音频资源建议记录稳定生产 URL，而不是本机路径或带时效的签名 URL，并补充存储定位信息：

```json
{
    "provider": "bza-s3",
    "bucket": "ai-history",
    "objectKey": "audio/releases/1950-turing-test-zh-interact-v1.mp3",
    "url": "https://<media-domain>/audio/releases/1950-turing-test-zh-interact-v1.mp3",
    "language": "zh",
    "format": "mp3",
    "version": 1,
    "contentType": "audio/mpeg",
    "checksum": "<sha256>"
}
```

`audio-manifest.json` 应至少包含 `eventId`、`language`、`objectKey`、`url`、`contentType`、`size`、`checksum`、`version` 和 `updatedAt`，供发布校验、资源审计和故障排查使用。

## 安全要求

- 当前 AK/SK 已经通过对话传递，建议创建新凭证并停用旧凭证。
- 为上传账号设置最小权限，只允许操作 `ai-history/audio/` 前缀。
- 前端和静态站点永远不包含 AK/SK。
- 日志不得打印 Authorization Header、AK、SK 或完整签名 URL。
- 若使用预签名 URL，应由后端按需生成短时链接，不把它作为 Archive 中的永久 URL。
- 母版和 manifest 目录保持私有；匿名播放只开放 `audio/releases/`。

## 当前状态

- 四条启用故事线的 194 个 storyline entries 均已关联中英文 S3 audio asset。
- 168 个唯一事件当前配置 346 个版本化 release asset，其中 336 个被启用 variants 选中；
  其余 10 个是保留的历史候选版本。共享事件复用同一 audio asset。
- `audio/releases/*` 公开读取，`audio/manifests/*` 保持私有。
- Archive、compiler 和播放器优先使用 tenant-qualified S3 `deliveryUrl`，不依赖本地 MP3。
- 使用 `npm run audio:status -- --remote` 获取实时对象可达性，不在文档中维护易过期的对象计数结论。

后续仍应轮换曾通过对话传递的旧凭证，并按正式展示网络环境决定是否增加媒体网关或 CDN。
