# Quiz 数据与展示逻辑

本文档汇总当前项目中 Quiz 的数据结构、跨 Storyline 复用规则、展示触发条件和维护方式。

## 1. Quiz 展示与课程入口

当前页面包含事件浏览检查点，并在检查点中提供 PQ AI 通识课入口。

### 1.1 事件浏览检查点

观众浏览一个事件详情后，在离开该详情时可能看到一道快速问答。

这套逻辑按事件是否存在有效 Quiz 决定，不再限制为 AI100 Storyline。统一 UI、深度学习、AI100 及其他包含事件 Quiz 的 Storyline 共用同一套事件级判断规则。

### 1.2 PQ AI 通识课入口

事件浏览检查点的问答区下方显示 PQ AI 通识课微信小程序码。观众使用微信扫码后进入外部小程序课程；网页本身不承载该课程的集中答题、成绩或礼物兑换流程。

旧 `?quiz=mobile` 手机挑战页面、网页二维码入口和相关埋点已经退役。带有旧参数的地址只按普通展览地址加载，不再进入独立答题页面。

## 2. Archive 数据结构

每个事件的 Quiz 集合位于：

```text
archive/events/<event-id>/quizzes.json
```

Storyline 对应的 variant 可以通过 `quizId` 选择该版本使用的 Quiz：

```text
archive/events/<event-id>/variants/<storyline-id>.json
```

示例：

```json
{
    "quizId": "quiz-2012-alexnet-ai100"
}
```

修改 Archive 数据后，需要运行：

```bash
npm run validate:archive
npm run generate
```

不要直接编辑 `milestones-data.js` 或 `milestones-data-default.js`。

## 3. 有效 Quiz 的判断

前端只展示满足以下条件的 Quiz：

- Quiz 是对象结构。
- `question` 有可显示内容。
- `options` 至少包含两个选项。
- `answerIndex` 是有效整数，并指向现有选项。
- 可选的 `explanation` 用于回答后的解释。

源数据通常应提供 4 个清楚、适合普通观众理解的选项。

## 4. 事件级 Quiz 查找顺序

同一事件可能同时出现在多个 Storyline 中。浏览检查点以 `archiveEventId` 作为事件级关联依据，按以下顺序查找 Quiz：

1. 优先使用当前页面 ViewModel 中的 `quizzes`。
2. 如果 ViewModel 没有，则使用当前运行时里程碑的 `quizzes` 或 `quiz`。
3. 如果当前 Storyline 版本仍没有，则通过相同的 `archiveEventId` 查找其他 Storyline 版本中已有的 Quiz。
4. 找到后仍需经过有效性检查；无有效 Quiz 的事件不显示问答。

因此，同一个 Archive 事件在 AI100 版本中有 Quiz、在深度学习版本中没有直接选择 Quiz 时，深度学习详情仍可以复用该事件的 AI100 Quiz。

该规则只在同一 `archiveEventId` 内复用，不会按照标题、年份或相似名称跨事件匹配。

## 5. 浏览检查点触发规则

事件浏览检查点必须同时满足以下条件：

1. 当前事件存在有效 Quiz。
2. 用户正在离开事件详情，而不是在地图浏览层操作。
3. 用户在本次事件详情中连续停留至少 15 秒。
4. 当前页面会话中，该事件的 Quiz 尚未完成或跳过。

满足条件后，页面先显示 Quiz；用户回答、跳过或关闭后，再继续原来的返回、切换事件或切换 Storyline 操作。

### 5.1 15 秒计时边界

- 进入事件详情时开始计时。
- 停留时间 `< 15 秒` 时离开，不弹出 Quiz。
- 停留时间 `>= 15 秒` 时离开，弹出 Quiz。
- 返回地图层后立即清除当前详情计时。
- 地图层停留时间不计入任何事件的 15 秒。
- 从地图重新进入同一事件时，重新开始一次 15 秒计时。
- 切换 Storyline 后，不继承前一个 Storyline 详情中的停留时间。

### 5.2 统一 UI 行为

统一 UI 只在离开事件详情时调用浏览检查点：

- 从事件详情点击返回按钮：检查 Quiz 和 15 秒门槛。
- 从事件详情使用浏览器返回：检查 Quiz 和 15 秒门槛。
- 从事件详情切换到另一个事件或 Storyline：使用相同检查规则。
- 在地图层切换年份、洲、地点或滚动事件列表：不弹出 Quiz。

### 5.3 去重范围

Quiz 完成或跳过后，当前页面会话内不会再次为同一 `archiveEventId` 弹出。

该状态目前保存在前端内存中。刷新页面或重新打开页面后，会开始新的页面会话。

## 6. Quiz 弹窗内容

浏览检查点弹窗由左右两部分组成：

- 左侧：当前事件的相关图片、资料卡片和来源链接。
- 右侧：一道随机排列选项的快速问答、回答反馈和解释，以及 PQ AI 通识课微信小程序入口。

选项显示时会随机排序，同时同步调整正确答案索引。源数据中的固定选项顺序不会直接决定观众看到的顺序。

## 7. 深度学习 Storyline 当前覆盖情况

深度学习 Storyline 当前有 21 个事件：

- 直接挂载 Quiz 的运行时条目：0 个。
- 通过相同 `archiveEventId` 从 AI100 事件版本复用 Quiz：12 个。
- 没有可复用 Quiz：9 个。

没有 Quiz 的 9 个事件如下：

| Event ID               | 事件                        |
| ---------------------- | --------------------------- |
| `1956-dartmouth`       | 达特茅斯会议                |
| `1969-ai-winter`       | 第一次 AI 寒冬              |
| `1986-backpropagation` | 反向传播                    |
| `1986-rnn`             | 循环神经网络                |
| `2014-highway-network` | Highway Network             |
| `2019-ai-feynman`      | AI Feynman                  |
| `2023-agents`          | LLM 驱动的智能体            |
| `2024-ai-scientist`    | AI Scientist 与自动化实验室 |
| `2025-llm-competition` | 大语言模型竞争格局          |

这 9 个事件都不与当前 AI100 Storyline 中的事件共用 `archiveEventId`，因此无法从 AI100 复用 Quiz。

如果希望它们展示 Quiz，需要在各自的 `quizzes.json` 中新增题目，并由相应 Storyline variant 的 `quizId` 选择。

## 8. 新增或修改 Quiz 的建议流程

1. 在 `archive/events/<event-id>/quizzes.json` 中新增或修改 Quiz。
2. 在需要使用该 Quiz 的 variant 中设置 `quizId`。
3. 确保问题简单清楚，通常提供 4 个选项。
4. 确保 `answerIndex` 正确，解释能够说明答案原因。
5. 准备与事件相关的图片或材料，避免弹窗左侧缺少内容。
6. 运行 Archive 校验和生成命令。
7. 运行 lint、测试及 AI100 Quiz 校验。

```bash
npm run validate:archive
npm run generate
npm run validate:ai100-quizzes
npm run lint
npm test
```

## 9. 主要实现位置

- `index.html` 中的 `getQuizItems`：有效 Quiz 解析和跨 Storyline 事件级查找。
- `index.html` 中的 `getCompletionQuizKey`：用 `archiveEventId` 标识同一事件。
- `index.html` 中的 `hasCompletionQuizDwellElapsed`：15 秒详情停留判断。
- `index.html` 中的 `maybeOpenCompletionQuiz`：统一的 Quiz 展示资格判断。
- `index.html` 中的 `buildPqCourseEntry`：PQ AI 通识课小程序码入口。
- `index.html` 中的 `returnFromUiDetail`：统一 UI 离开详情时的触发入口。
- `scripts/test-storyline-routing.js`：Storyline、统一 UI 和 Quiz 触发规则的回归断言。

## 10. 已验证行为

当前浏览器级验证结果：

- AlexNet 深度学习详情停留不足 15 秒后返回：不弹 Quiz。
- 重新进入 AlexNet 详情并停留超过 15 秒后返回：弹出 AlexNet Quiz。
- 跳过 Quiz 返回地图后切换年份：不再弹出 Quiz。
- 深度学习事件可以按相同 `archiveEventId` 复用 AI100 中已有的 Quiz。
- 旧 `?quiz=mobile` 参数不会打开独立手机挑战页。
- 桌面与手机布局中只显示 PQ AI 通识课小程序码，不显示网页挑战或礼物文案。
