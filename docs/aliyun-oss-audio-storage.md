# 阿里云 OSS 音频存储

项目发布音频统一存放在阿里云 OSS。Archive JSON 保存公开播放 URL 和对象元数据，浏览器只读取
Archive compiler 生成的 URL，不依赖本地 MP3。

## 存储约定

| 配置       | 值                                               |
| ---------- | ------------------------------------------------ |
| Bucket     | `zgca-medias`                                    |
| Region     | `cn-beijing`                                     |
| Endpoint   | `https://oss-cn-beijing.aliyuncs.com`            |
| 公开根地址 | `https://media.sciencearena.cn`                  |
| 发布目录   | `audio/ai-history/releases/`                     |
| Manifest   | `audio/ai-history/manifests/audio-manifest.json` |

发布目录中的音频对象使用 `public-read`，支持浏览器直接访问和 HTTP Range 请求。Manifest 使用
`private`，不允许匿名读取。Bucket CORS 允许公开来源执行 `GET`、`HEAD` 和 Range 播放。

示例对象：

```text
oss://zgca-medias/audio/ai-history/releases/1950-turing-test-zh-interact-v1.mp3
https://media.sciencearena.cn/audio/ai-history/releases/1950-turing-test-zh-interact-v1.mp3
```

## 凭证

发布命令从环境变量读取凭证：

```bash
export ALIYUN_ACCESS_KEY_ID='...'
export ALIYUN_ACCESS_KEY_SECRET='...'
export ALIYUN_OSS_ENDPOINT='https://oss-cn-beijing.aliyuncs.com'
export ALIYUN_OSS_BUCKET='zgca-medias'
export ALIYUN_OSS_REGION='cn-beijing'
```

真实凭证不得写入 Git、Archive、前端文件、manifest 或命令日志。工作站可以从受保护的 env 文件
加载变量，但 env 文件不得提交。

## Archive 元数据

每个发布音频资产使用以下结构：

```json
{
    "type": "audio",
    "path": "https://media.sciencearena.cn/audio/ai-history/releases/1950-turing-test-zh-interact-v1.mp3",
    "deliveryUrl": "https://media.sciencearena.cn/audio/ai-history/releases/1950-turing-test-zh-interact-v1.mp3",
    "storage": {
        "provider": "aliyun-oss",
        "bucket": "zgca-medias",
        "objectKey": "audio/ai-history/releases/1950-turing-test-zh-interact-v1.mp3",
        "sourcePath": "resources/audio/generated/.../1950-turing-test.mp3",
        "contentType": "audio/mpeg",
        "cacheControl": "public, max-age=31536000, immutable"
    }
}
```

`sourcePath` 只用于发布工作站定位本地生成物，compiler 不会把它暴露给生产页面。

## 发布命令

OSS 使用 S3 兼容接口，项目继续复用 AWS SDK 客户端，不需要额外的 OSS SDK。

```bash
# 校验 Archive 元数据与本地发布源
npm run audio:release -- check

# 生成本地 manifest
npm run audio:release -- manifest

# 预览增量上传
npm run audio:release:dry-run

# 上传音频并在成功后写入私有 manifest
npm run audio:release -- push

# 按 checksum、大小、MIME 和缓存 metadata 校验远端对象
npm run audio:release -- verify

# 设置音频对象 public-read，并合并播放 CORS
npm run audio:release -- publish-access
```

上传逻辑不会覆盖内容或 metadata 不一致的已有对象，除非明确传入 `--force`。音频对象上传时设置
`public-read`，manifest 上传时强制设置 `private`。

## 验证

```bash
npm run audio:status -- --remote
curl -I 'https://media.sciencearena.cn/audio/ai-history/releases/1950-turing-test-zh-interact-v1.mp3'
curl -H 'Range: bytes=0-31' -o /dev/null -D - \
  'https://media.sciencearena.cn/audio/ai-history/releases/1950-turing-test-zh-interact-v1.mp3'
```

公开音频应返回 `200`，Range 请求应返回 `206`。匿名访问 manifest 应返回 `403`。

迁移前的 BZA S3 对象暂时保留为回滚来源，不属于当前页面运行时依赖，清理必须另行确认。
