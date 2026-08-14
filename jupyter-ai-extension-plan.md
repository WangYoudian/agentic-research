# JupyterLab AI Extension 规划(对标 VS Code Copilot)

> 目标:做一个正式的 JupyterLab AI extension,体验对标 VS Code 里的 GitHub Copilot——Ask / Plan / Agent 三种模式、`@notebook` 上下文引用、inline chat、checkpoint 变更管理。
> 本文 = VS Code Copilot 功能盘点(摘要)+ JupyterLab 侧设计蓝图 + jupyter-ai 复用评估 + 分步骤实现路线。**完整调查见 [vscode-copilot-research.md](vscode-copilot-research.md)**。
>
> 调查日期:2026-08-13。VS Code 部分依据官方文档(code.visualstudio.com/docs/copilot 系列,2026-08 版);jupyter-ai 部分依据 GitHub(jupyterlab/jupyter-ai + jupyter-ai-contrib 组织)与 readthedocs。

**另见**:[VS Code Copilot 功能设计调查 →](vscode-copilot-research.md) ｜ [Jupyter 底层架构深析 →](jupyter-architecture.md) ｜ [Jupyter 生态与 AI 功能索引 →](jupyter-ai.md) ｜ [AI Agent 生态速查 →](index.md)

---

## 〇、现状速览

- **VS Code Copilot 已是完整的 agent 体系**:Ask / Plan agent / Agent mode 三模式,`#`-mention 上下文、`@`-mention participant、斜杠命令、自定义指令、Agent Skills、checkpoint、权限审批、沙箱。
- **JupyterLab 侧无官方 Copilot 平替**:Jupyter AI(v3.x)是"AI persona 聊天 + 接外部 agent(ACP)"路线,没有三模式、没有 `@notebook` 上下文系统、没有 inline chat 与 checkpoint 变更管理。
- **结论**:需要自研前端 UX + agent 编排,但可以**复用 jupyter-ai 生态的现成组件**(notebook 工具集、模型路由、会话持久化)——不必从零写一切(详见第四节)。

---

## 一、VS Code Copilot 功能盘点(摘要)

> **完整调查见独立文档:[VS Code Copilot 功能设计调查 →](vscode-copilot-research.md)**(2026-08-13,10 个官方文档页,含来源 URL 与"值得复制的设计机制"总结)。
> 本节只保留规划所需的结论性摘要。

### 1.1 模式演进:ask / plan / agent → 现在的形态

| 经典模式 | 现在的形态 | 行为 | 备注 |
|---|---|---|---|
| **Ask** | Ask(基础问答) | 纯对话,不修改文件 | 可携带任意上下文 |
| **Plan** | **Plan agent**(`/plan`) | 研究任务 → 生成计划(高层摘要 + 实现步骤 + 验证步骤)→ 澄清问答 → 迭代 → Start Implementation 交接 | 计划自动存 `/memories/session/plan.md`;规划与实现可配置不同模型 |
| **Agent** | **Agent mode** | 自主分解任务、编辑文件、跑命令、自我纠错 | 逐工具执行并申请审批 |

### 1.2 规划要点(从调查提炼)

- **上下文系统**是质量第一杠杆:隐式上下文(活动文件/选中)+ `#`-mention(文件/文件夹/符号/`#codebase`/终端/`#fetch`)+ 拖拽/Vision + 上下文拾取器
- **notebook 独有富上下文**:`#df` 引用 kernel 变量、cell 输出 "Add Cell Output to Chat"——这是 JupyterLab 版相对 VS Code 的差异化亮点
- **`@` 是 participant、`#` 是上下文引用**(两个机制);JupyterLab 版建议统一用 `@` 做上下文引用,并做 `@kernel` participant
- **Plan 与实现解耦**(todo list 可交接、可迭代)、**Checkpoint 快照 + 恢复 + 编辑请求回滚**、**权限审批**(命令/工具逐个确认 + 敏感文件 glob + 沙箱)、**请求 Steer/Stop/Queue**、**Skills 三级渐进加载**——详见调查文档第十五节"值得复制的设计机制"

---

## 二、JupyterLab AI extension 设计蓝图

### 2.1 总体架构:前端 + Server 双层扩展

```
┌─ JupyterLab 前端 (TypeScript prebuilt 扩展) ──────────────┐
│  Chat 面板 · Inline Chat · @-mention 拾取器               │
│  Diff/Checkpoint UI · 权限审批弹窗 · 会话管理             │
└──────────────┬────────────────────────────────────────────┘
               │ JSON-RPC / REST (WebSocket)
┌──────────────▼────────────────────────────────────────────┐
│ Server 扩展 (Python, 挂 jupyter-server)                   │
│  Agent 执行引擎 · 工具注册表 · LLM Provider 代理          │
│  Notebook 工具 · Kernel 执行 · 文件/终端 · 审批服务       │
│  Checkpoint 快照 · Skills/指令解析                        │
└────────────────────────────────────────────────────────────┘
```

**为什么双层**(呼应 jupyter-architecture.md 第七章决策表):
- LLM API key 不能进浏览器;kernel 执行、文件读写、终端命令天然在 server 侧
- 前端只负责 UI 与渲染;`jupyterlab.discovery.server` 实现前后端联动安装
- 与 Jupyter AI、thread-notebook、notebook-intelligence 等现有实现架构一致

### 2.2 核心模块

| 模块 | 层 | 职责 | JupyterLab 侧关键技术 |
|---|---|---|---|
| Chat UI + 会话 | 前端 | 聊天面板、多会话、模式选择器、模型选择 | `ReactWidget` + `ILayoutRestorer`(基础已验证,见 jupyterlab-sidebar-poc) |
| 上下文系统 | 前端+server | `@`-mention 解析、notebook→文本序列化、kernel 变量引用、输出引用 | `INotebookTracker` 读 cell;`ICodeCellModel.outputs`;kernel 变量经临时执行查询 |
| Agent 执行引擎 | server | agent loop(plan→act→observe)、工具调用循环、todo list | LangGraph 状态机(与 jupyter-ai v3 同栈)或 OpenAI Agents SDK |
| Notebook 工具集 | server | 读写/新建 cell、执行 cell、取输出、修 traceback、新建 notebook | **直接复用 jupyter_ai_tools 的 nb_toolkit**(见第四节) |
| 权限与审批 | 前端+server | 命令/敏感操作审批弹窗、权限级别 | 前端 `showDialog` + server 执行前校验 |
| 变更管理 | 前端+server | 执行前快照、diff 渲染、恢复、编辑请求回滚 | 快照存 server 侧;diff 前端渲染 |
| 定制系统 | server | 自定义指令、SKILL.md、斜杠命令注册 | 扫描 `AGENTS.md` / `.github/` |
| LLM Provider | server | 多模型、流式、key 管理 | 自建抽象或复用 jupyter-ai-litellm |

### 2.3 概念映射表(VS Code → JupyterLab)

| VS Code | JupyterLab | 备注 |
|---|---|---|
| 工作区/文件系统 | server 的 `ContentsManager` | 天然同源 |
| 编辑器 | Notebook widget / FileEditor | `INotebookTracker` |
| 终端 | Terminal widget + `/api/terminals` | 或 server 侧 subprocess |
| 跑测试/调试 | **kernel 执行 cell** | JupyterLab 无"跑测试"概念,用执行替代 |
| Source Control / git | 无内置(可选 jupyterlab-git) | **变更管理自己做**,用快照而非 git |
| `#codebase` | 文件树检索 | 无内置语义搜索,先 grep/轻量索引 |
| `@terminal` participant | **`@kernel` participant** | JupyterLab 的差异化杀手锏 |
| Copilot 账号/订阅 | 用户自带 API key / Ollama 本地 | BYO-key 模式 |

### 2.4 `@notebook` 上下文引用设计(差异化亮点)

Copilot 语义里 `@` 是 participant、`#` 是上下文;JupyterLab 里建议**统一用 `@` 前缀做上下文引用**,输入时弹补全器,支持四级粒度:

| 语法 | 含义 | 序列化方式 |
|---|---|---|
| `@foo.ipynb` | 整本 notebook | markdown 化:标题 + 每 cell 编号/类型/源码 + 输出摘要 |
| `@foo.ipynb cell 3` | 单个 cell | 仅该 cell 源码 + 输出 |
| `@foo.ipynb output 5` | 某 cell 的输出 | 输出 mimebundle 摘要(text/plain + text/html) |
| `@df` | kernel 变量 | server 侧临时执行查询代码取 repr/describe |

**notebook 的 cell 结构 + 输出 + kernel 变量是 VS Code 没有的富上下文**——这是本扩展相对 Copilot 的最大差异点。

---

## 三、jupyter-ai 复用评估(2026-08 实地调查)

### 3.1 jupyter-ai v3.x 实际架构

仓库 `jupyterlab/jupyter-ai` 已改为 **monorepo + git submodule 拆包**(代码全部在 `jupyter-ai-contrib` 组织):

| 子包 | 职责 | 可否复用 |
|---|---|---|
| **jupyter-ai-tools**(`jupyter_ai_tools`) | server 扩展:nb_toolkit(read_notebook / read_cell / add_cell / insert_cell / delete_cell / edit_cell / get_cell_id_from_index / create_notebook)+ git_toolkit;OpenAI function-calling / MCP schema 兼容;`collaborative_tool` 装饰器提供 RTC 感知 | ✅ **直接 pip 安装使用,省掉 M4 大量工作** |
| jupyter-ai-jupyternaut | 默认 AI persona:server 包 + 前端 `@jupyter-ai/jupyternaut`;**agent 引擎基于 LangGraph,会话持久化用 langgraph-checkpoint-sqlite** | ⚠️ 参考;聊天 UX 是 persona 语义,不是三模式 |
| jupyter-ai-litellm | 多 provider 模型抽象(liteLLM) | ✅ 可直接依赖 |
| jupyter-ai-router | 模型路由/多模型 fallback | ✅ 可选 |
| jupyter-server-mcp | 把 server 能力暴露为 MCP | ⚠️ 视路线而定 |
| jupyter-ai-acp-client | ACP(Agent Client Protocol)接外部 agent(Claude/Codex 等) | ⚠️ 与本项目目标重叠度低 |
| jupyterlab-commands-toolkit / notebook-awareness | 前端命令工具包 / RTC 协同 | ⚠️ 可选 |

### 3.2 结论

**jupyter-ai 不能直接满足需求**:它的聊天是"persona 对话 + 工具调用 + 接外部 agent",没有 Ask/Plan/Agent 三模式、没有 `@notebook` 上下文系统、没有 inline chat、没有 checkpoint 变更管理。若在其上魔改,还要对抗它的 persona 语义与快速演进的 v3 接口。

**推荐路线:独立扩展 + 选择性依赖**——前端与 agent 编排全自研(可控),server 侧直接依赖生态组件避免重复造轮子:

- ✅ 依赖 `jupyter_ai_tools`(notebook 工具层,`pip install jupyter_ai_tools`)
- ✅ 复用 langgraph-checkpoint-sqlite 思路做会话持久化(顺带解决 JupyterLab 无原生会话历史的痛点)
- ✅ 可选依赖 jupyter-ai-litellm 做多 provider
- 🚫 不依赖 jupyternaut 的 persona 聊天 UI 与 agent 编排

---

## 四、分步骤实现路线

> 每步可运行、可验证。依赖关系向下。M0–M3 ≈ 4-5 周出"Copilot Chat 平替";M4–M7 是护城河。

### M0 — 骨架(≈1 周)
- prebuilt 前端扩展脚手架(copier `jupyterlab/extension-template`)+ server 扩展骨架(`discovery.server` 联动)
- Chat 面板:发送消息 → server 调 LLM → 流式回显(WebSocket/SSE)
- **验收**:JupyterLab 里打开面板,问一句能答

### M1 — Ask 模式 + 上下文系统(核心基建,≈2 周)
- `@`-mention 解析器 + 拾取器 UI;notebook→LLM 文本序列化器
- 隐式上下文(当前活动 cell);kernel 变量查询工具
- **验收**:`@foo.ipynb 解释这个 notebook`、`@df 的描述性统计` 可用

### M2 — Inline Chat + 单 cell 编辑(≈1 周)
- cell 内唤起编辑、生成代码 diff、Accept / Accept and Run
- **验收**:选中 cell 按快捷键,AI 改代码,一键执行

### M3 — Plan 模式(≈1 周)
- `/plan`:生成计划卡片 → 澄清问答 → 确认后进入执行
- **验收**:计划以结构化卡片渲染、可编辑

### M4 — Agent 模式 + 工具集(≈3 周,工作量最大)
- server 侧 agent loop(LangGraph);工具:复用 nb_toolkit + 自写 execute_cell / read_file / run_shell
- **权限审批弹窗**(工具调用逐个确认)
- **验收**:`分析 housing.csv 并生成可视化 notebook` 全自动跑通

### M5 — 变更管理与 Checkpoint(≈2 周)
- 每 request 前快照;diff 视图;恢复 / 编辑请求回滚
- **验收**:agent 改乱后一键回到执行前

### M6 — 定制系统(≈1 周)
- `AGENTS.md` / 自定义指令加载;SKILL.md 三级加载;斜杠命令框架
- **验收**:内置 `/fix`、`/explain` + 用户自定义 skill

### M7 — 打磨(持续)
- 多模型选择、多会话/fork、请求 Steer/Stop、通知、权限级别细化、命令沙箱

---

## 五、风险与开放决策

1. **LLM 来源**:自带 API key(OpenAI/Anthropic/…)或加 Ollama 本地;建议复用 litellm 抽象。
2. **jupyter-ai v3 接口稳定性**:若依赖其子包,需盯紧版本;工具层(nb_toolkit)接口简单、风险低。
3. **执行安全**:`run_shell` 工具默认全禁,只在用户显式开权限级别后启用(对齐 Copilot 的沙箱/审批模型)。
4. **范围控制**:M4 的 agent loop 与 M5 的 checkpoint 是复杂度大头,建议先用最小 agent loop 跑通,再迭代。
