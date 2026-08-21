# Agent 框架与工具层选型分析（Pydantic AI vs LangGraph）

> 配套 `DESIGN.md` 的选型分析。回答三个问题：① jupyter-ai-agents 托管模式与"改本地/自己 Pod"的矛盾；② Pydantic AI vs LangGraph 对比；③ 工具层是否绑死各自生态（迁移难度 / 工具丰富性 / 架构角度）。
>
> 日期：2026-08-19 ｜ 相关：[datalayer-products-research.md](../../datalayter-components/datalayer-products-research.md) ｜ [DESIGN.md](../DESIGN.md)

---

## 一、关于 jupyter-ai-agents 的"托管模式"与你的需求

### 1.1 你的判断基本正确——但只对"托管 SaaS"成立

- **Datalayer 托管 SaaS**（`https://mcp.datalayer.run/mcp`）：notebook 文档存在 Datalayer 自己的 **spacer** 里（`--document-provider datalayer`），执行默认路由到 Datalayer 的 code sandbox（`--sandbox-variant datalayer`）。**确实不能写你本机/你集群的目录**。
- 但 **开源自托管模式不是这样**。`jupyter-mcp-server` 官方明确写：*"Compatible with any Jupyter deployment (local, JupyterHub, ...)"*。

### 1.2 关键机制：文档位置与执行位置是**两个独立开关**

| 维度                                | 参数                                                                                                                         | 你的场景应选        |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| **文档（notebook 文件）在哪** | `--document-provider`（`jupyter` = 所连 Jupyter server 的 Contents/collaboration API；`datalayer` = Datalayer spacer） | `jupyter`（默认） |
| **代码在哪执行**              | `--sandbox-variant`（`jupyter` / `datalayer` / `kaggle` / `colab` / `monty` / `modal`）                        | `jupyter`（默认） |

> v1.3.2 起 `--provider` 改名 `--document-provider`：它只决定"notebook 文档放哪"，跟代码跑在哪无关；执行另用 `--sandbox-variant` 单独选。

- `execute_code` 默认在**所连 server 的 kernel** 上执行（"kernel by default, or active sandbox if selected"）；`list_files` 列的是"the Jupyter server's file system"。
- `launch_sandbox` / `use_sandbox` 只是**可选的替代执行后端**（需 `jupyter_mcp_sandboxes` 扩展），默认根本不走它。

### 1.3 你的需求 = 标准自托管路径（完全支持）

> 需求：agent 要能修改"Jupyter 正在跑的那个 notebook Pod"（K8s 上 JupyterHub 起的单用户 Pod）。

做法（`jupyter-mcp-server` 有官方 JupyterHub 指南）：

1. **把 MCP server 跑在 Pod 内**：两种方式
   - 作为 **Jupyter server 扩展** 同进程启动（这正是 `jupyter-ai-agents` 的 `extension.py` 干的事——MCP server 与 Jupyter 同进程，agent 直接打本地 `/mcp`）——**最贴合你的需求，零额外进程**。
   - 或作为 **sidecar 进程**跑在同一个 Pod / 同一网络里（容器化部署用）。
2. **文档与执行都指到单用户 server**：
   ```json
   {
     "SANDBOX_VARIANT": "jupyter",
     "CODE_SANDBOX_URL": "https://your-jupyterhub.domain/user/<username>",
     "CODE_SANDBOX_TOKEN": "<jupyterhub-api-token 需 access:servers scope>",
     "DOCUMENT_URL": "https://your-jupyterhub.domain/user/<username>",
     "DOCUMENT_TOKEN": "<同 token>"
   }
   ```
3. 于是 agent 的 `use_notebook / create_cell / edit_cell / execute_code / list_files …` 全部作用在**那个 Pod 的 ContentsManager 视野内**（= 用户 home + 挂载卷），这正是"改我自己的 notebook Pod"。

### 1.4 两个边界（要提前知道）

- **能写到哪 = 该 Pod 的 ContentsManager 能看到的范围**（home + 挂载的 PV）。若还要 agent 访问 Pod 内 Jupyter 工作区以外的文件：给 Pod 挂更多卷，或在同一 Pod 里再编排一个 filesystem MCP server（`mcp-compose` 就是这个用途）。
- **不是"无界"**：agent 拿不到 Pod 外的东西，除非你主动暴露。这其实是安全优势（作用域受控）。

> **结论**：不需要 Datalayer 托管。`jupyter-ai-agents` / `jupyter-mcp-server` 自托管 + `document-provider=jupyter` + `sandbox-variant=jupyter` 就能让 agent 直接改你 K8s 里那个 notebook Pod。你的需求是它的**默认/主流场景**，不是例外。

---

## 二、Pydantic AI vs LangGraph 对比

### 2.1 一句话定位

|                 | **Pydantic AI**                                                                             | **LangGraph**                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 出身            | Pydantic 团队（~19k★，MIT）                                                                      | LangChain 团队（~39k★，MIT）                                                                  |
| 心智模型        | **Agent 中心**：一个 `Agent` = 模型 + 工具 + 提示词 + 结构化输出                          | **图中心**：`StateGraph` = 状态机，节点/边显式描述控制流                               |
| 核心抽象        | `Agent(model, system_prompt, tools, deps_type, result_type)`，`@agent.tool`，`run_stream()` | `StateGraph(State)`，node/edge/conditional_edge，`checkpointer`，`interrupt()`，`Send` |
| 结构化输出      | **一等公民**：结果校验成 Pydantic 模型（类型安全）                                          | 可做，但那是"tool/state 层面的约定"，不是框架核心卖点                                          |
| 流式            | `run_stream()` + 官方 `VercelAIAdapter`（Datalayer 聊天面板就用它）/ AG-UI                    | `astream_events` 事件流；**没有**现成 Vercel AI 适配器，要自己桥接                     |
| 持久化/断点续跑 | 需自接（Datalayer 用 DBOS durable execution）；无内建 checkpointer                                | **内建 checkpointers**（Memory/Sqlite/Postgres），重启可恢复、time-travel 回放           |
| 人机协同        | 无内建 interrupt 语义（可用 tool 里等用户）                                                       | **`interrupt()` 内建**：工具/命令审批、人工介入是核心特性                              |
| 多 agent        | 子 agent（delegation）+`AgentGraph`（pydantic-graph）+ `AgentTeam`(alpha)                     | Supervisor / swarm / 分层子图，最成熟                                                          |
| 上手成本        | 低（一个文件就能跑）                                                                              | 中高（State、reducer、checkpointer 概念多）                                                    |
| 生态            | 小但聚焦；MCP-first，provider 适配全（slim 包）                                                   | 巨大：LangChain 全家桶、LangSmith、langmem、langchain-mcp-adapters                             |

### 2.2 各自最适合

- **Pydantic AI**：单 agent + 工具 + MCP + 结构化输出，要快、要类型安全、要最小依赖。**它的价值在"把 Agent 跑起来"很省事**，而且有 `jupyter-ai-agents` 这个可照抄的现成工程（含 Vercel 流式 + MCP 接线）。
- **LangGraph**：控制流复杂、多 agent、**需要持久化断点续跑/审批**的长任务。**它的价值在"把 Agent 编排做得可控可恢复"**，但样板代码多，且 Vercel 流式协议要自己搭。

### 2.3 关键判断（针对你的 hosted 扩展）

- 你的 M2（聊天+执行闭环，要快、要流式）→ **Pydantic AI 明显更快**：Vercel 适配器开箱即用，MCP 工具即挂即用，且有 Datalayer 代码可抄。
- 你的 US5（断连续跑）→ LangGraph 的 checkpointer 是**免费送的**（重启恢复、时间旅行）；Pydantic AI 要走 DBOS 或自写会话持久化。
- **混合的代价**：两个都想用 = 两套心智模型 + 两套工具注册方式，除非确有需要（比如用 Pydantic AI 做聊天面、LangGraph 做重型编排），否则不推荐一开始就混。

---

## 三、工具层：是否绑死各自生态？

### 3.1 结论先行

**都不算"绑死"，但风味不同**——而且由于你们已经决定走 **MCP 工具层**（`jupyter_mcp_server` 把 notebook 能力全部暴露成 MCP 工具），**工具是跨框架可移植的**。真正被"绑定"的是**各自惯用的工具注册 API 和编排 API**，而不是工具本身。

### 3.2 逐项对比

| 维度                 | Pydantic AI                                                                                | LangGraph                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| **工具本质**   | 普通 Python 函数（`@agent.tool` / `@agent.tool_plain`）；不要求任何 LangChain 依赖     | 惯用 LangChain`@tool` / `StructuredTool`（本质也是"函数 + Pydantic 参数 schema"），也可包任意 callable |
| **跨生态桥**   | **MCP 一等公民**：`MCPServerStdio` / `MCPServerStreamableHTTP` 直接挂成 toolset  | 靠`langchain-mcp-adapters` 把 MCP server 拉成 LangChain tools（也成熟）                                  |
| **工具丰富性** | 内建生态较小；但 MCP-first → 能接**所有 MCP server**（jupyter/filesystem/github…） | 内建生态最大（LangChain 集成 1000+）；MCP 适配亦可，但更"LangChain 味"                                     |
| **结构化输出** | 原生 Pydantic（业界标准，跨框架通用）                                                      | 靠 Pydantic schema 声明 tool 参数/输出，能互通                                                             |

### 3.3 迁移难度（工具层视角）

- **你的 MCP 工具**（jupyter-mcp-server 暴露的 `use_notebook / create_cell / execute_code …`）**在两个框架间 100% 可搬**：Pydantic AI 直接挂 toolset，LangGraph 用 langchain-mcp-adapters 转成 tools。**这是你们架构里最抗锁定的部分。**
- **真正要重写的**：
  - Pydantic AI → LangGraph：`Agent(...)` / `@agent.tool` / `run_stream` 这套 API 全部要改成 graph 形态（State / node / checkpointer）；tool 函数体可复用，注册方式要改。
  - LangGraph → Pydantic AI：graph 控制流要摊平成子 agent 或 `AgentGraph`；checkpointer 逻辑要自己接。
- **体感**：单 agent + 线性工具循环的场景，两者迁移都是"半天到两天"级别（函数体不丢，重写编排壳）；一旦用到各自深度特性（Pydantic 的 result_type 校验 / LangGraph 的 interrupt+checkpoint），迁移成本才明显上升。

### 3.4 架构角度

- **Pydantic AI**：agent 是"自包含单元"，工具注入是声明式的；适合"每次请求 = 跑一个 agent"的**面板/服务模式**。持久化、审批、复杂分叉都不是它的主场，要外挂。
- **LangGraph**：控制流是显式图，**状态与执行分离**（State + checkpointer），天生适合"长时、可恢复、可审批"的**平台级编排**；代价是样板多、流式协议要自己适配。

---

## 四、对当前项目（jupyterlab-sidebar-poc → hosted 扩展）的建议

1. **Q1（托管/改 Pod）**：走**自托管**，`document-provider=jupyter` + `sandbox-variant=jupyter`，MCP server 作为 Jupyter server 扩展跑在 JupyterHub 的 notebook Pod 内。Datalayer 托管 SaaS 与你的需求无关。
2. **Q2（框架初选）**：**M2 先用 Pydantic AI**——最快拿到"聊天 + MCP 工具 + Vercel 流式"闭环，且能逐行照抄 jupyter-ai-agents 的接线；把 US5（断连续跑）推迟到 M4。
3. **Q3（工具层）**：把**工具层锁定为 MCP**，这是两个框架之间最抗锁定的资产；框架本身留出抽象层（一个 `create_chat_agent()` 工厂 + 一个协议适配层），未来真要换 LangGraph（为了 interrupt/checkpoint）时，工具层零迁移，只换编排壳。
4. **决策开关**：如果后面"长任务断点续跑 + 审批"变成 P0（而不是 P2），再在 M4 前评估 LangGraph（checkpointer 白送）或 Pydantic AI + DBOS（Datalayer 同款路线）。不要一开始就双框架。

---

## 五、名词解释（Glossary）

> 本文与 DESIGN.md 里出现的术语速查。一句话解释 + 为什么对你项目重要。

| 术语 | 一句话解释 | 为什么重要 |
|---|---|---|
| **Vercel AI SDK / AI SDK 协议** | Vercel 的 AI 聊天前后端工具集；定义 `POST /api/chat` 的**流式传输规范**（SSE + `data:` JSON part） | 前端和后端用同一套协议就能对话，换模型/后端不改前端 |
| **useChat()** | `@ai-sdk/react` 的 React hook：管消息列表 + 发请求 + 解析 SSE 流 | 你的聊天面板前端直接用，照抄 jupyter-ai-agents |
| **SSE（Server-Sent Events）** | 基于 HTTP 的单向流式响应（`text/event-stream`） | AI 流式聊天的主流传输方式 |
| **part / data-stream part** | Vercel AI 协议里流的最小单元：`text-delta` / `tool-call` / `reasoning` / `source` / `finish` 等 | 流式渲染、工具调用提示都靠区分这些 part |
| **VercelAIAdapter** | `pydantic_ai.ui.vercel_ai` 的**服务端适配器**：解析入站请求 → 跑 agent → 把流式输出转成协议 SSE 事件；新 API 为 `dispatch_request()`，返回 Starlette 风格 response（headers + body_iterator） | 让 pydantic-ai agent "长得像" Vercel 协议后端；Tornado 里要配 `TornadoRequestAdapter` + 遍历 `body_iterator` 写回 |
| **MCP（Model Context Protocol）** | Anthropic 提出的开放协议：把工具/资源/提示词以标准方式暴露给 LLM 应用 | **你工具层的地基**；jupyter-mcp-server 把 notebook 能力全暴露成 MCP 工具 |
| **MCPServerStreamableHTTP / MCPServerStdio** | pydantic-ai 里连接 MCP server 的两种传输方式（HTTP 流式 / stdio 子进程） | 同进程 jupyter-mcp-server 用 StreamableHTTP 接本地 `/mcp` |
| **toolset** | pydantic-ai 的"工具集"：一组可附加给 agent 的工具来源（MCP server / 函数工具 / 自定义工具） | agent 实例化时把 MCP server 挂进 toolsets 即可用 |
| **ACP（Agent Client Protocol）** | agent 客户端 ↔ 宿主通信协议（Claude Code / Codex 等外部编码 agent 用它） | Datalayer 多协议支持之一；与你的 MCP 路线互补但不同 |
| **AG-UI** | pydantic-ai 原生支持的轻量 agent UI 协议 | Datalayer agent-runtimes 支持的多协议之一 |
| **A2A（Agent2Agent）** | Google 提出的 agent 间通信协议 | `fasta2a` 把 agent 变成 A2A server；多 agent 互调用时才有意义 |
| **document-provider vs sandbox-variant** | jupyter-mcp-server 的两个**独立开关**：notebook 文档存哪 / 代码在哪执行 | 自托管 = `jupyter` + `jupyter`；托管 = `datalayer` + `datalayer`（见第一节） |
| **ExtensionApp** | `jupyter_server` 的 Python 扩展基类：注册 REST handler、生命周期、配置 | 你的 server 扩展骨架（`sidebar_poc` 的 `extension.py`） |
| **prebuilt 前端扩展** | 编译成独立 bundle 的 JupyterLab 前端扩展，运行时经 Module Federation 加载 | POC 走的就是这条路，不用重编 JupyterLab |
| **checkpointer** | LangGraph 的状态持久化组件（Memory/Sqlite/Postgres）：重启恢复、time-travel 回放 | 你要"断连续跑"时它是白送能力（对应 US5） |
| **durable execution / DBOS** | 把长任务执行状态持久化，进程重启后可恢复 | Datalayer agent-runtimes 的持久化方案；Pydantic AI 路线的替代选项 |
| **interrupt() / human-in-the-loop** | LangGraph 在执行中途暂停等人工输入/审批的机制 | 你要"工具/命令审批"时它是原生能力 |

---

## 参考

- jupyter-mcp-server README（本地镜像 `agent-framework/jupyter-mcp-server`）：document-provider / sandbox-variant / JupyterHub 设置 / execute_code 语义
- jupyter-ai-agents（本地镜像）：`extension.py`（MCP 同进程）+ `chat_handler.py`（VercelAIAdapter + MCPServerStreamableHTTP）
- Datalayer 调研：`datalayter-components/datalayer-products-research.md`
- 设计文档：`jupyterlab-sidebar-poc/DESIGN.md`
