# AI 历史回顾展览

展厅大屏互动式前端应用，展示人工智能发展的重要里程碑。

## 📦 版本说明

项目提供**三个版本**，根据需求选择：

| 版本 | 文件名 | 适用场景 | 特色功能 |
|-----|--------|---------|----------|
| **基础版** | `index.html` | 标准 16:9 屏幕 | 简洁布局，快速加载 |
| **增强版** ⭐ | `index-enhanced.html` | 展厅大屏 16:9 | 3D地球、拍立得照片、增强视觉效果 |
| **超宽屏版** | `index-32x9.html` | 32:9 超宽屏 | 5列布局，横向展开内容 |

## 📊 数据集说明

### ✅ 完整数据集已集成！

项目已集成从PowerPoint自动提取的完整AI历史数据：

| 数据集 | 文件 | 里程碑数量 | 状态 |
|--------|------|-----------|------|
| **完整版** ⭐ | `milestones-data-full.js` | 32个 | 已集成到增强版 |
| 示例版 | `milestones-data.js` | 3个 | 仅用于演示 |

**数据来源**: `references/未来已来，过去未去 - 改.pptx`

**覆盖时间**: 1950-2025年（70年AI发展史）

**分类结构**:
- 🌱 **AI创世纪** (1950s-1970s): 8个事件
- 🔄 **神经网络复兴** (1980s-2000s): 9个事件
- 🚀 **深度学习时代** (2010s-2020s): 13个事件
- 🤖 **大模型时代** (2020s-今): 2个事件

**包含内容**:
- ✅ 真实历史图片（59张，已提取至 `extracted_images/`）
- ✅ 详细事件描述（从PPT内容自动生成）
- ✅ 关键人物信息
- ✅ 地理位置坐标
- ✅ 原始PPT引用

详见 [`INTEGRATION-COMPLETE.md`](INTEGRATION-COMPLETE.md) 了解完整集成情况。

---

### 🌟 增强版新功能（推荐用于展厅展示）

1. **🌍 动态3D地球组件**
   - 纯CSS实现的旋转地球
   - 自动定位到里程碑坐标
   - 脉冲动画标记点
   - 无需外部库，零依赖

2. **📸 拍立得照片拼贴效果**
   - 白色宽边框设计（底部更宽）
   - 手写字体标注区域
   - 随机倾斜角度（-8° ~ 8°）
   - 多层阴影质感
   - 悬停"拿起"动画

3. **🎨 优化视觉设计**
   - 增强边框和间距（更清晰的模块化）
   - 提升对比度（适合远距离观看）
   - 更大的字体和按钮（5米观看距离优化）
   - 卡片式人物阵列悬停效果增强

4. **⚡ 性能优化**
   - GPU加速的CSS动画
   - 优化过渡效果性能
   - 保持60fps流畅度

## 功能特性

### 核心功能（所有版本通用）
- ✅ **页面切换**：通过按钮或键盘方向键在不同里程碑之间切换
- ✅ **页面指示器**：底部圆点显示当前位置和总页数
- ✅ **视频播放**：点击播放/暂停评论视频
- ✅ **照片浏览**：点击照片进入全屏查看模式，支持左右切换

### 交互方式
- 🖱️ **鼠标点击**：底部按钮、照片、视频
- ⌨️ **键盘快捷键**：
  - `←` / `→` 切换页面
  - `Esc` 关闭照片查看器
  - 照片查看模式下 `←` / `→` 切换图片

## 快速开始

### 1. 本地运行

直接在浏览器中打开 `index.html` 文件即可：

```bash
# 方法一：双击打开
open index.html

# 方法二：使用本地服务器（推荐）
python3 -m http.server 8000
# 然后访问 http://localhost:8000
```

### 2. 部署到服务器

将整个项目文件夹上传到任何静态网站托管服务：

```bash
# 示例：使用 Nginx
cp -r . /var/www/html/ai-history/

# 示例：使用 GitHub Pages
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <你的仓库地址>
git push -u origin main
```

## 文件结构

```
AI-History-Show/
├── index-enhanced.html          # ⭐ 增强版（16:9）- 已集成完整数据
├── index.html                   # 基础版（16:9）
├── index-32x9.html              # 超宽屏版（32:9）
│
├── milestones-data-full.js      # ⭐ 完整数据集（32个里程碑）
├── milestones-data.js           # 示例数据（3个里程碑）
│
├── extracted_images/            # ⭐ PPT提取的真实图片（59张）
│   ├── slide_001/
│   ├── slide_004/
│   ├── ...
│   └── slide_056/
│
├── milestones-extracted.json    # 原始提取数据
├── extract_ppt.py               # PPT内容提取脚本
├── generate_full_data.py        # 完整数据生成脚本
│
├── PPT-ANALYSIS.md              # PPT内容详细分析报告
├── INTEGRATION-COMPLETE.md      # ⭐ 集成完成说明（必读）
├── README.md                    # 本文件
│
└── references/                  # 参考资料
    └── 未来已来，过去未去 - 改.pptx
```

## 添加或修改里程碑数据

### 方式1：直接编辑完整数据文件（推荐）

编辑 `milestones-data-full.js` 文件，在 `milestones` 数组中添加或修改对象：

```javascript
{
    id: "unique-id-2023",           // 唯一标识符
    year: 2023,                     // 年份
    title: "GPT-4 发布",            // 主标题
    subtitle: "多模态大语言模型",    // 副标题

    location: {
        name: "OpenAI 总部",
        country: "美国, 加利福尼亚州",
        coordinates: [37.7749, -122.4194]
    },

    description: `事件的详细描述...<br><br>可以使用HTML标签`,

    figures: [
        { name: "Sam Altman", role: "OpenAI CEO" },
        { name: "Greg Brockman", role: "联合创始人" }
    ],

    photos: [
        "照片1的URL",
        "照片2的URL",
        "照片3的URL"
    ],

    videoUrl: "https://www.youtube.com/embed/视频ID?autoplay=1&mute=1",

    commentaryVideo: "评论视频的URL（.mp4格式）",

    quote: `引用文字<br><br><span style="font-size: 0.9vw; color: var(--accent);">— 引用来源</span>`
}
```

### 方式2：重新生成数据（从PPT）

如果修改了原始PPT文件，可以重新生成数据：

```bash
# 1. 提取PPT内容（文字和图片）
python3 extract_ppt.py

# 2. 生成完整数据集
python3 generate_full_data.py

# 输出：milestones-data-full.js 将被更新
```

**注意**: 需要安装 `python-pptx` 库：
```bash
pip3 install python-pptx
```

## 自定义样式

所有样式都在 `index.html` 的 `<style>` 标签中，可以修改以下 CSS 变量：

```css
:root {
    --bg-color: #0B0E14;           /* 背景色 */
    --text-main: #FFFFFF;           /* 主文字颜色 */
    --text-muted: #8AB4F8;          /* 次要文字颜色 */
    --accent: #FFD166;              /* 强调色（按钮、高亮等）*/
    --panel-bg: rgba(255, 255, 255, 0.05);  /* 面板背景 */
    --border-color: rgba(138, 180, 248, 0.2); /* 边框颜色 */
}
```

## 屏幕适配

应用已针对 **16:9 宽高比**的大屏优化，支持：
- ✅ 4K 显示器 (3840×2160)
- ✅ 2K 显示器 (2560×1440)
- ✅ 1080p 显示器 (1920×1080)
- ✅ 投影仪
- ✅ 竖屏显示器（自动适配最大尺寸）

使用 `vw`（视口宽度）单位确保在不同分辨率下保持比例一致。

## 浏览器兼容性

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**不支持 IE 浏览器**

## 性能优化建议

### 图片优化
1. 使用 WebP 格式（文件更小）
2. 推荐尺寸：照片 1920×1080，缩略图 640×360
3. 使用 CDN 加速资源加载

### 视频优化
1. YouTube 视频自动嵌入（无需下载）
2. 本地视频使用 H.264 编码的 MP4 格式
3. 评论视频建议分辨率：1280×720

### 加载优化
```javascript
// 可以在 milestones-data.js 末尾添加预加载
window.addEventListener('DOMContentLoaded', () => {
    milestones.forEach(m => {
        // 预加载图片
        m.photos.forEach(url => {
            const img = new Image();
            img.src = url;
        });
    });
});
```

## 常见问题

### Q: 视频无法播放？
A:
1. 检查视频 URL 是否有效
2. 确认浏览器支持 MP4 格式
3. YouTube 视频需要稳定的网络连接

### Q: 照片无法显示？
A:
1. 检查图片 URL 是否可访问
2. 确认图片允许跨域访问（CORS）
3. 建议使用可靠的图床服务

### Q: 如何调整页面切换速度？
A: 修改 `index.html` 中的延迟时间：
```javascript
setTimeout(() => {
    // ...
}, 600); // 将 600 改为其他值（毫秒）
```

### Q: 如何禁用键盘导航？
A: 删除或注释掉以下代码：
```javascript
// 键盘导航
document.addEventListener('keydown', (e) => {
    // ...
});
```

## 技术栈

### 所有版本通用
- **HTML5**：语义化标签
- **CSS3**：Grid 布局、动画、渐变
- **JavaScript ES6+**：箭头函数、模板字符串、解构赋值

**无任何外部依赖，纯原生实现！**

### 增强版技术亮点

#### 🌍 3D地球实现原理
```css
/* 使用 CSS 3D Transform + 动画 */
.globe {
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #7fa3d1 100%);
    box-shadow: inset -15px -15px 40px rgba(0,0,0,0.5);
    animation: rotateGlobe 20s linear infinite;
}

@keyframes rotateGlobe {
    from { transform: rotateY(0deg); }
    to { transform: rotateY(360deg); }
}
```

#### 📸 拍立得效果实现
```css
/* 模拟真实拍立得相纸 */
.polaroid {
    background: #f4f4f0;
    padding: 5% 5% 15% 5%;  /* 底部留更宽边距 */
    box-shadow:
        0 4px 8px rgba(0,0,0,0.3),
        0 10px 40px rgba(0,0,0,0.2);
    transform: rotate(-6deg);  /* 随机倾斜 */
}

.polaroid:hover {
    transform: scale(1.15) translateY(-20px) !important;
}
```

#### ⚡ 性能优化策略
- 使用 `transform` 和 `opacity` 实现动画（GPU加速）
- 避免触发重排（reflow）的属性
- 使用 `will-change` 提示浏览器优化
- CSS `backdrop-filter` 实现毛玻璃效果

## 未来扩展建议

### 已实现（增强版）✅
- [x] 集成 3D 地球组件显示地点
- [x] 拍立得照片拼贴效果
- [x] 远距离观看优化

### 计划中
- [ ] 添加时间轴导航
- [ ] 支持触摸手势（移动设备）
- [ ] 添加音频解说/旁白
- [ ] 支持多语言切换（中/英）
- [ ] 添加全屏模式
- [ ] 数据可视化图表（AI发展趋势）
- [ ] WebGL 真实地球渲染
- [ ] 无人值守自动播放模式

## 许可证

MIT License - 可自由使用、修改和分发

## 联系方式

如有问题或建议，欢迎通过以下方式联系：
- 提交 Issue
- 发送邮件
- 提交 Pull Request

---

**享受您的 AI 历史之旅！** 🚀
