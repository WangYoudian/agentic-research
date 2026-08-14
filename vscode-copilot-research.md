# VS Code Copilot 功能设计调查

> 目的:为 JupyterLab AI extension 规划提供对标参照——盘点 VS Code 里 GitHub Copilot 的完整功能与设计机制。
> 调查日期:2026-08-13。
> 数据来源:VS Code 官方文档(code.visualstudio.com/docs)2026-08 快照,共抓取 10 个页面,URL 见文末「来源」;另参考本仓库 `jupyter-ai.md` 中已有的 Copilot 概况(Ghost text / NES 等内联补全部分)。

**另见**:[JupyterLab AI Extension 规划 →](jupyter-ai-extension-plan.md) ｜ [Jupyter 生态与 AI 功能索引 →](jupyter-ai.md) ｜ [Jupyter 底层架构深析 →](jupyter-architecture.md)

---

## 目录

- [〇、总览:Chat → Agent 的范式演进](#overview)
- [一、模式体系:ask / plan / agent](#modes)
- [二、聊天界面(surfaces)](#surfaces)
- [三、会话管理](#sessions)
- [四、上下文系统(#-mentions)](#context)
- [五、@-mentions(chat participants)](#participants)
- [六、斜杠命令](#slash)
- [七、自定义指令(custom instructions)](#instructions)
- [八、Agent Skills](#skills)
- [九、工具与执行](#tools)
- [十、权限与审批模型](#approvals)
- [十一、Checkpoints 与变更审查](#checkpoints)
- [十二、请求控制](#request-control)
- [十三、Notebook 专用功能](#notebook)
- [十四、其他 UX 细节](#ux)
- [十五、值得复制的设计机制(总结)](#takeaways)
- [来源](#sources)

---

<a name="overview"></a>

## 〇、总览:Chat → Agent 的范式演进

VS Code 文档(2026 版)已从 "Copilot Chat" 全面转向 **"Agents"** 话语体系:聊天不再是"问答工具",而是"与 AI agent 协作的界面"。核心新概念:

- **Agent harness**:agent 的运行环境/会话形态(如 Chat view、Agents window、云端会话)
- **Agent target / agent / language model / permission level**:每个会话的四个可配置维度
- **Agent Host**:新的 agent 架构(命令执行、工具调用、checkpoint 都建立在其上)
- **Plan agent / Agent mode**:规划与自主执行被拆成两个可独立选择的 agent

这个演进说明:**"Ask/Plan/Agent 三模式"是旧版 Copilot Chat 的产物,现在的形态是 Plan agent + Agent mode + 可插拔 harness**——做 JupyterLab 版时应按新形态设计,而不是照抄旧三模式按钮。

---

<a name="modes"></a>

## 一、模式体系:ask / plan / agent

| 经典模式 | 现在的形态 | 行为 | 关键机制 |
|---|---|---|---|
| **Ask** | Ask(基础问答) | 纯对话,不修改文件 | 可携带任意上下文;是 agent 模式的"只读"子集 |
| **Plan** | **Plan agent**(`/plan`) | 研究任务 → 生成计划(高层摘要 + 实现步骤 + 验证步骤)→ 澄清问答 → 迭代 → **Start Implementation 交接**给实现 agent | 计划自动存到 `/memories/session/plan.md`(会话级 memory,会话结束即清);计划与对话上下文随交接**整体转移**;可用 `chat.planAgent.defaultModel` 单独指定规划用的模型 |
| **Agent** | **Agent mode** | 自主分解任务、编辑文件、跑命令、自我纠错 | 逐工具执行并申请审批;工具调用与 LLM 请求有事件日志(Agent Logs) |

**可复制的机制**:
- Plan 与实现解耦,计划以"文档 + 待办清单(todo list)"形式存在,可交接
- 规划阶段与实现阶段可配置不同模型(省钱)
- 澄清问答是 Plan 流程的一等公民(不是可选项)

---

<a name="surfaces"></a>

## 二、聊天界面(surfaces)

| 界面 | 用途 | 打开方式 |
|---|---|---|
| **Chat view** | 侧边栏,code-first,边看代码边协作 | `⌃⌘I`(Win/Linux `Ctrl+Alt+I`) |
| **Agents window** | 独立窗口,agent-first,跨项目/高层任务编排 | 标题栏按钮 / `code --agents` |
| **Inline chat** | 就地编辑(代码/终端建议) | `⌘I`(Win `Ctrl+I`) |
| **Quick Chat** | 编辑器顶部的轻量聊天面板 | `⇧⌥⌘L` |

- Chat view 有 compact / side-by-side 两种布局;会话可放**侧边栏 / 编辑器 tab / 独立窗口**
- Chat view 与 Agents window **共享同一份会话与设置**,可无缝切换
- 布局自由度是 VS Code 的强项;JupyterLab 受 Lumino 面板体系约束,侧边栏是自然主场

---

<a name="sessions"></a>

## 三、会话管理

- **多会话并行**:可同时开多个会话,切换不丢上下文;会话列表在视图顶部
- **fork**:从任意 checkpoint "Fork Conversation" 出独立会话(含到该点为止的对话)
- **会话配置**:agent target、agent、语言模型、权限级别——会话中随时可调
- **会话历史**:跨窗口/重启持久化(Manage Sessions / Session History)
- **请求编辑**:历史 request 可直接改——VS Code 会**回滚该 request 及其后所有变更,再重发**(`chat.editRequests` 控制)
- **会话隔离**:folder-isolated(会话文件夹)/ worktree-isolated(git worktree)/ cloud 三种 harness 形态,决定变更如何合并回主工作区

---

<a name="context"></a>

## 四、上下文系统(#-mentions)

> VS Code 的上下文引用用 `#` 前缀,不是 `@`。`@` 是 participant(见第五节)。

**隐式上下文**:自动包含活动文件、当前选中内容、文件名;agent 模式下 agent 自主决定是否追加上下文。

**显式上下文(`#`-mention / 上下文拾取器)**:

| 引用 | 含义 |
|---|---|
| `#file` | 文件 |
| `#folder` | 文件夹 |
| `#symbol` | 代码符号(需先打开所在文件) |
| `#codebase` | 整个代码库(显式声明"用全部代码") |
| `#terminalSelection` | 终端选中输出 |
| `#fetch` | web 工具:抓取 URL 内容(有缓存,外网访问需确认) |

**其他添加上下文的方式**:
- 从 Explorer / 编辑器 tab **拖拽**文件、文件夹进聊天
- **Vision**:拖拽图片(截图、UI mockup)
- 浏览器元素(集成浏览器里选元素带 HTML/CSS/截图)

**notebook 特例**(见第十三节):`#df` 引用 kernel 变量、cell 输出 "Add Cell Output to Chat"。

**可复制的机制**:
- 隐式上下文(活动文件/选中)零成本获得相关性
- 上下文拾取器(picker)统一入口
- web 抓取作为一等工具(`#fetch`)而非文本粘贴

---

<a name="participants"></a>

## 五、@-mentions(chat participants)

- `@` 唤出 **chat participant**:域专长助手,内置 `@vscode`、`@terminal`
- 例:`@vscode how to enable word wrapping`、`@terminal what are the top 5 largest files`
- **扩展可贡献自定义 participant**(VS Code API:chat participants)
- 语义:`@` = 切换"回答者/角色",`#` = 添加"参考材料"——JupyterLab 版若要统一,建议都走上下文引用,把 kernel/notebook 做成 participant(如 `@kernel`)

---

<a name="slash"></a>

## 六、斜杠命令

- 输入 `/` 列出全部命令;命令是"常用 prompt 的快捷键",也可调用 skills
- 内置示例:`/plan`、`/newNotebook`、`/init`(分析项目生成 `AGENTS.md` 风格指令)、`/create-instructions`、`/create-skill`、`/skills`、`/yolo`(全局免审批)、`/disableYolo`
- 技能、prompt 文件都以斜杠命令形式暴露在 `/` 菜单

---

<a name="instructions"></a>

## 七、自定义指令(custom instructions)

**指令文件类型**:
- `.github/copilot-instructions.md`(仓库级)与 `AGENTS.md`(通用标准)
- `*.instructions.md`:主题化指令,带 **`applyTo` glob** 选择性应用(如只对 `src/**/*.ts` 生效)
- 用户个人级指令、组织级指令(GitHub org 共享)

**优先级**(冲突时):个人 > 仓库 > 组织。

**其他机制**:
- `/init` 自动生成项目指令(分析项目结构/代码风格)
- settings 仍支持场景化指令:code review、commit message、PR 描述
- 指令可被 prompt 文件 / 自定义 agent 引用复用
- **诊断**:Chat 里右键 → Diagnostics 查看所有已加载指令文件与错误

---

<a name="skills"></a>

## 八、Agent Skills

**定位**:区别于"编码规范"(custom instructions),Skills 教 agent **专门的流程/能力**,可带脚本、示例、资源;开放标准(agentskills.io),跨工具可移植(Copilot VS Code / CLI / cloud agent)。

**SKILL.md 格式**(YAML frontmatter):

| 字段 | 必填 | 说明 |
|---|---|---|
| `name` | 是 | 小写字母/数字/连字符,须与目录名一致,≤64 字符 |
| `description` | 是 | 做什么 + 何时用(模型据此判断是否加载),≤1024 字符 |
| `argument-hint` | 否 | 作为斜杠命令时的参数提示 |
| `user-invocable` | 否 | 是否出现在 `/` 菜单(默认 true) |
| `disable-model-invocation` | 否 | 是否禁止模型按相关性自动加载(默认 false) |
| `context` | 否 | `inline`(默认,正文进父上下文)或 `fork`(子代理里跑,只回传结果) |

**三级渐进加载**(核心机制):① 读 name+description 判断相关性 → ② 加载 SKILL.md 正文 → ③ 用到时才读目录内资源文件。**装再多 skill 也不占上下文**。

**存放位置**:项目 `.github/skills/`、`.claude/skills/`、`.agents/skills/`;个人 `~/.copilot/skills/` 等;扩展经 `chatSkills` contribution point 贡献。

---

<a name="tools"></a>

## 九、工具与执行

- **文件编辑工具**:agent 编辑文件;编辑有 pending 状态,编辑器浮层里逐处 Accept / Undo
- **终端命令**:Chat 里以 `!` 开头直接执行命令(不进 LLM、不审批,Agent Host 会话);agent 自主跑命令需审批
- **web 工具**:`#fetch`
- **MCP servers**:扩展 agent 到外部服务/数据库
- **敏感文件**:`chat.tools.edits.autoApprove` 用 **glob 规则**控制哪些路径免审批、哪些强制审批(如 `**/.env`: false)
- **沙箱(终端命令)**:`chat.agent.sandbox` 文件系统 + 网络隔离:
  - 文件系统:默认只能写当前工作目录;读工作区 + 指定路径;`allowRead/allowWrite/denyRead/denyWrite` 细粒度规则
  - 网络:默认全部阻断;`allowedNetworkDomains` / `deniedNetworkDomains`(通配符,deny 优先)
  - 沙箱内失败 → 询问是否提权到沙箱外执行
- **自动审批**:`/yolo`(全局)、权限级别 Bypass Approvals(会话级)——两者都警告"破坏性操作免确认"

---

<a name="approvals"></a>

## 十、权限与审批模型

- **权限级别选择器**(session 级):逐步审批 → 免审批(Bypass Approvals)
- 工具调用、终端命令默认**逐个弹窗确认**;URL 外网访问默认确认
- 审批与"事后审查"分离:敏感文件在**应用前**确认(diff 预览);普通变更在**应用后**通过 checkpoint/diff 审查
- 沙箱 + 审批 + 事后审查三层递进

---

<a name="checkpoints"></a>

## 十一、Checkpoints 与变更审查

**Checkpoints**(`chat.checkpoints.enabled`):
- 处理每个 request 前对受影响文件做快照
- 恢复 checkpoint:回滚到对话中任一点的文件状态;可 **Redo**;可 **Fork**(从该点分叉新会话)
- `showFileChanges`:每个 request 的变更文件 + 行数摘要
- 文档明确:checkpoints 是临时的,**不替代 git**

**变更审查**:
- 回复中点选变更文件 → diff;多文件 diff 编辑器
- 逐处 Accept / Undo(pending edits 浮层);Mark as Reviewed
- **diff 内反馈**:选中代码范围写评论 → Submit Feedback → agent 修改并逐条解决(Agents window)
- 集成到 git 工作流:Source Control 暂存、worktree 隔离会话 apply/merge、云端会话走 PR

---

<a name="request-control"></a>

## 十二、请求控制

请求进行中可发新消息,Send 按钮变下拉,三选项:

| 选项 | 行为 |
|---|---|
| **Add to Queue** | 排队,当前响应完成后再处理 |
| **Steer with Message** | 当前工具执行完后让位,新消息立即处理(转向 agent) |
| **Stop and Send** | 取消当前请求,立即发送新消息 |

- 默认动作可配(`chat.requestQueuing.defaultAction`,默认 steer)
- 多条 pending 消息可**拖拽重排**

---

<a name="notebook"></a>

## 十三、Notebook 专用功能(VS Code 里的 Jupyter)

| 功能 | 说明 |
|---|---|
| `/newNotebook` | 斜杠命令脚手架新 notebook(带 markdown/code cell) |
| 单 cell inline edit | cell 内 `⌘I`,生成后 **Accept / Accept and Run** |
| 跨 cell 编辑 | agent mode 下多 cell 批量修改,浮层逐处 keep/undo |
| `#kernel变量` 引用 | 输入 `#df` 引用 notebook 中的 DataFrame 变量 |
| Add Cell Output to Chat | 图表/输出右键加入聊天上下文("Explain this chart") |
| 全流程数据分析 | agent:读 `#housing.csv` → 建 notebook → 实现代码 → 跑 cell → 可视化 |

---

<a name="ux"></a>

## 十四、其他 UX 细节

- **通知**:窗口失焦时 OS 通知(响应完成 / agent 需要确认),可配 off/windowNotFocused/always
- **时间戳**:请求发送/完成时间 + 响应耗时(`chat.verbose`)
- **导航快捷键**:↑↓ 在历史 prompt 间跳、PageUp/PageDown 在历史代码块间跳
- **Chat Debug view**:查看每次交互的原始 system prompt / user prompt / context / tool payload——排查"为什么这么答"
- **Cache Explorer**:诊断 prompt 缓存的命中情况
- **多模型**:会话级模型选择(管理员策略可锁定)
- **Image carousel**(实验):回复中的图片/视频聚合查看

---

<a name="takeaways"></a>

## 十五、值得复制的设计机制(总结)

按"JupyterLab 版实现的性价比"排序:

| 机制 | 为什么值得复制 | 实现成本 |
|---|---|---|
| 上下文拾取器 + 隐式上下文 | 相关性是 chat 质量的第一杠杆 | 中 |
| Plan 与实现解耦、todo list、可交接 | agent 可信度的核心(先规划后动手) | 中 |
| `@kernel变量`/cell 输出进上下文 | **notebook 独有的富上下文**,差异化亮点 | 中 |
| 三级渐进加载的 Skills | 能力扩展不占上下文 | 低 |
| Checkpoint 快照 + 恢复 + 编辑请求回滚 | agent 可逆性的根基;JupyterLab 无 git 依赖时是唯一保障 | 高 |
| 权限审批(命令/工具逐个确认) | 安全底线 | 中 |
| 请求 Steer/Stop/Queue | 长任务控制体验 | 中 |
| 事件日志 + 调试视图 | 可排查性(agent 黑盒的解毒剂) | 中 |
| 沙箱(文件/网络隔离) | 高阶安全,可后置 | 高 |
| 自定义指令优先级 + Diagnostics | 团队定制基础 | 低 |
| 多会话 fork | 探索型工作流(尝试→分叉) | 中 |

---

<a name="sources"></a>

## 来源

调查页面(VS Code 官方文档,2026-08 快照,均已抓取核对):

1. Use chat in VS Code — https://code.visualstudio.com/docs/copilot/copilot-chat(同 /docs/chat/chat-overview)
2. Use the Chat view — https://code.visualstudio.com/docs/agents/run/chat-view
3. Add context to chat — https://code.visualstudio.com/docs/chat/copilot-chat-context
4. Planning with agents — https://code.visualstudio.com/docs/agents/run/planning
5. Manage approvals and permissions — https://code.visualstudio.com/docs/agents/run/approvals
6. Review and revert agent changes — https://code.visualstudio.com/docs/agents/run/review-code-edits
7. Edit Jupyter notebooks with AI — https://code.visualstudio.com/docs/agents/guides/notebooks-with-ai
8. Use custom instructions — https://code.visualstudio.com/docs/agent-customization/custom-instructions
9. Use Agent Skills — https://code.visualstudio.com/docs/agent-customization/agent-skills
10. Use chat in VS Code(chat-overview 重定向确认)— https://code.visualstudio.com/docs/chat/chat-overview

补全类功能(Ghost text 内联补全、NES 等)参见本仓库 `jupyter-ai.md` 第三章(Copilot 本体功能)。
