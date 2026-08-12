# Jupyter 生态与 AI 功能索引

> Jupyter 生态分层、插件/扩展体系，以及 Jupyter 上的 AI 功能速查页。
> 数据来源：GitHub API 实时查询（星数截至 2026-08-12）+ Jupyter / VS Code / GitHub 官方文档，仓库均已逐一核实。

## 目录

- [一、生态分层总览（架构）](#architecture)
- [二、AI 功能 · Jupyter 官方](#ai-official)
- [三、AI 功能 · GitHub Copilot 本体（VS Code 路径）](#ai-copilot)
- [四、AI 功能 · MCP / Agent 接入](#ai-mcp)
- [五、AI 功能 · 社区扩展](#ai-community)
- [六、AI 功能 · AI 原生 Notebook 平台](#ai-platforms)
- [七、生态资源列表（awesome 合集）](#resources)
- [八、数据说明](#data)

**另见**：[DeepWiki 收录验证清单 →](deepwiki.md) ｜ [Jupyter 生态与架构图 →](jupyter-diagrams.md)

---

<a name="architecture"></a>
## 一、生态分层总览（架构）

Jupyter 官方架构文档（docs.jupyter.org）确认的核心分层：

```
前端界面 (JupyterLab / Notebook 7 / JupyterLite / VS Code 等第三方)
        │  REST API + WebSocket（jupyter-server，含扩展系统）
        ▼
jupyter-server（后端中枢：保存/加载文档、kernel 管理、REST 端点）
        │  Jupyter Messaging Protocol（ZeroMQ JSON 消息）
        ▼
Kernel（IPykernel 等：执行代码的独立进程）
```

| 层 | 项目 | 一句话说明 | License | ★ Stars | 代码链接 |
|---|---|---|---|---|---|
| 前端 | **JupyterLab** | 可扩展的计算 IDE，Notebook 7 的基础；插件/扩展系统核心 | BSD-3-Clause | ~15.3k | https://github.com/jupyterlab/jupyterlab |
| 前端 | **Notebook** | 经典 notebook 界面（Notebook 7 已迁移到 JupyterLab 底座） | BSD-3-Clause | ~13.3k | https://github.com/jupyter/notebook |
| 前端 | **JupyterLite** | WASM 驱动，纯浏览器内运行 Jupyter（pyodide） | BSD-3-Clause | ~4.9k | https://github.com/jupyterlite/jupyterlite |
| 前端 | **VS Code Jupyter 扩展** | 微软官方 VS Code 前端：编辑/运行/调试 notebook、连接远程 server，Copilot 官方支持路径 | MIT | ~1.5k | https://github.com/microsoft/vscode-jupyter |
| 服务端 | **jupyter_server** | Jupyter Web 应用的后端：核心服务、API、REST 端点、扩展系统 | BSD-3-Clause | ~567 | https://github.com/jupyter-server/jupyter_server |
| 内核 | **IPykernel / IPython** | 计算执行内核，前端经 ZeroMQ 协议与其通信 | BSD-3-Clause | ~736 | https://github.com/ipython/ipykernel |
| 格式 | **nbformat** | .ipynb（JSON）格式规范与参考实现 | BSD-3-Clause | ~311 | https://github.com/jupyter/nbformat |
| 转换 | **nbconvert** | notebook 转换管线（preprocessor → exporter → postprocessor） | BSD-3-Clause | ~1.9k | https://github.com/jupyter/nbconvert |
| 执行 | **papermill** | 参数化、批量执行 notebook（数据管道） | BSD-3-Clause | ~6.5k | https://github.com/nteract/papermill |
| 文本 | **jupytext** | notebook ↔ Markdown/脚本 双向转换（利于 git 与 review） | MIT | ~7.2k | https://github.com/jupytext/jupytext |
| 组件 | **ipywidgets** | 交互式控件（滑块/按钮/图表联动） | BSD-3-Clause | ~3.3k | https://github.com/jupyter-widgets/ipywidgets |
| 部署 | **Voilà** | 把 notebook 变成独立 Web 应用 | BSD-3-Clause | ~5.9k | https://github.com/voila-dashboards/voila |
| 部署 | **JupyterHub** | 多用户 notebook 服务器（spawner/proxy/认证体系） | BSD-3-Clause | ~8.3k | https://github.com/jupyterhub/jupyterhub |
| 开发 | **jupyterlab-lsp** | LSP 接入：补全、跳转、hover、lint、重命名 | BSD-3-Clause | ~2.0k | https://github.com/jupyter-lsp/jupyterlab-lsp |

**扩展/插件体系（实现方式）**：
- **JupyterLab 前端扩展**：TypeScript 写的 UI 插件（命令面板、面板、右键菜单），通过 `pip install` / `conda` / JupyterLab 扩展管理器安装，npm 包名 `@jupyterlab/...`
- **Server 扩展**：Python 包，注册到 jupyter-server 的 REST 端点与生命周期（如 Jupyter AI 的 server extension）
- **Kernel 扩展**：三种实现方式——wrapper kernel（复用 IPykernel 通信）、native kernel（目标语言原生实现）、xeus kernel（C++ 协议实现，无需 Python）
- **Widgets**：前端 JS + 内核 Python 双端消息同步

---

<a name="ai-official"></a>
## 二、AI 功能 · Jupyter 官方

| 项目 | 一句话说明 | License | ★ Stars | 代码链接 |
|---|---|---|---|---|
| **Jupyter AI** | Jupyter 官方 AI 扩展：连接 AI 到计算 notebook | BSD-3-Clause | ~4.4k | https://github.com/jupyterlab/jupyter-ai |
| **jupyterlite/ai** | 官方浏览器端 AI 扩展：代码补全 + 聊天，适用于 JupyterLab / Notebook 7 / JupyterLite | BSD-3-Clause | ~61 | https://github.com/jupyterlite/ai |

**Jupyter AI（jupyter-ai）功能**（官方文档：https://jupyter-ai.readthedocs.io/，当前 v3.x）：
- **AI 聊天面板（AI personas）**：协作聊天，可与 AI 角色及他人共享；拖拽附件共享上下文
- **Frontier Agents**：直接在 JupyterLab 内接入 **Claude、Codex、GitHub Copilot、Goose、OpenCode** 等外部编码 agent（经 ACP 协议）
- **Notebook Tools**：AI 角色写、调试、运行 notebook；`%ai` magic（生成代码、修复错误、docstring、翻译）
- **多模型 provider**：OpenAI、Anthropic、Gemini、Cohere、Hugging Face、AWS Bedrock、Azure OpenAI、Ollama（本地）
- **Guardrails by Default**：agent 写文件、跑命令、用 MCP 工具前先请求许可
- **实时协作 UI**：基于 RTC 后端，多人/多 agent 实时协同编辑
- **可扩展**：自定义 AI persona、共享自定义 MCP servers

---

<a name="ai-copilot"></a>
## 三、AI 功能 · GitHub Copilot 本体（VS Code 路径）

**支持路径**：Copilot 在 Jupyter 的官方支持 = **VS Code + Jupyter 扩展**（`ms-toolsai.jupyter`）；JupyterLab 侧无官方 Copilot 扩展，社区实现普遍已停更或规模很小。

**Copilot 本体功能**（VS Code 官方文档 + GitHub Docs 确认）：
- **Ghost text 内联补全**：输入时灰色建议；逐词/逐行部分接受（⌘→）；多方案切换；用注释描述意图生成代码
- **Next Edit Suggestions（NES）**：预测"下一处要改的代码"（改错、改意图、重命名联动），Tab 跳转+接受
- **Copilot Chat**：对话式问答、代码解释/生成、引用当前 notebook 上下文
- **Agents / Smart Actions**：多文件自主任务、一键修复类操作
- **模型选择**：可切换不同 LLM（Copilot Business/Enterprise 由管理员策略控制）
- **Copilot Free**：免费额度（每月内联建议 + AI credits）

---

<a name="ai-mcp"></a>
## 四、AI 功能 · MCP / Agent 接入

实现方式：MCP server 把 notebook 操作暴露为 tools（读取/创建/编辑 cell、执行代码、获取输出），供 Claude / Cursor / Codex 等外部 LLM agent 调用。

| 项目 | 一句话说明 | License | ★ Stars | 代码链接 |
|---|---|---|---|---|
| **jupyter-mcp-server** (datalayer) | 最主流的 Jupyter MCP server：让 MCP 客户端读写/执行 notebook | BSD-3-Clause | ~1.2k | https://github.com/datalayer/jupyter-mcp-server |
| **cursor-notebook-mcp** | 专为 Cursor 设计，操作 .ipynb 文件 | 自定义 | ~161 | https://github.com/jbeno/cursor-notebook-mcp |
| **vscode-runtime-notebook-mcp** | 内嵌在 VS Code Jupyter runtime 的 MCP（编辑 cell、跑代码、取输出） | MIT | ~16 | https://github.com/olavocarvalho/vscode-runtime-notebook-mcp |

> 另：**Jupyter AI（v3.x）的 Frontier Agents 支持**（经 ACP 协议）让 Claude、Codex、GitHub Copilot、OpenCode 等外部编码 agent 直接驱动 notebook，与 MCP 互为补充的两条 agent 接入路径。

---

<a name="ai-community"></a>
## 五、AI 功能 · 社区扩展

实现方式：JupyterLab 前端扩展 + Python server 扩展，自带模型接入（BYO key 或本地 Ollama/vLLM）。

| 项目 | 一句话说明 | License | ★ Stars | 代码链接 |
|---|---|---|---|---|
| **thread-notebook** | AI 生成/编辑代码 cell、自动修错、与数据聊天，支持本地 Ollama | AGPL-3.0 | ~1.1k | https://github.com/alishobeiri/thread-notebook |
| **jupyter-ai-agents** (datalayer) | JupyterLab 里的 AI agents + MCP tools + skills：与 notebook 聊天并执行代码 | BSD-3-Clause | ~157 | https://github.com/datalayer/jupyter-ai-agents |
| **notebook-intelligence** | 支持 Claude Code、Copilot、Ollama、OpenAI 兼容 LLM，带 MCP、skills、插件和 notebook agent | GPL-3.0 | ~324 | https://github.com/plmbr/notebook-intelligence |
| **jupyter-studio** | "AI 原生的 JupyterLab"：Cmd+K 内联编辑、多步 agent、ghost-text 补全、一键修 traceback | Apache-2.0 | ~53 | https://github.com/deepelementlab/jupyter-studio |

---

<a name="ai-platforms"></a>
## 六、AI 功能 · AI 原生 Notebook 平台

| 平台 | 一句话说明 | License | ★ Stars | 链接 |
|---|---|---|---|---|
| **Deepnote** | Jupyter 的 drop-in 替代：AI-first 设计、Deepnote agent、实时协作（有开源本地版） | Apache-2.0 | ~3.0k | https://github.com/deepnote/deepnote |
| **Google Colab** | 托管 notebook，内置 Gemini 驱动 AI（写代码/解释/修复/聊天） | 闭源托管 | — | https://colab.research.google.com |

---

<a name="resources"></a>
## 七、生态资源列表（awesome 合集）

| 项目 | 一句话说明 | License | ★ Stars | 代码链接 |
|---|---|---|---|---|
| **awesome-jupyter** | Jupyter 项目/库/资源精选列表 | CC-BY-SA-4.0 | ~4.7k | https://github.com/markusschanta/awesome-jupyter |
| **best-of-jupyter** | 按星数排名的 Jupyter/Notebook/Hub/Lab 项目周更榜（扩展、内核、工具） | CC-BY-SA-4.0 | ~1.2k | https://github.com/ml-tooling/best-of-jupyter |

---

<a name="data"></a>
## 八、数据说明

- 星数为 GitHub API 于 2026-08-12 查询的实时值，会随时间变化。
- 许可证字段来自 GitHub API 的 `license.spdx_id`（Voilà 的 API 显示 NOASSERTION，但仓库 LICENSE 文件为 BSD 3-Clause；cursor-notebook-mcp 为自定义 NOASSERTION）。
- 架构分层依据 Jupyter 官方文档（docs.jupyter.org/projects/architecture）；Copilot 功能依据 VS Code 与 GitHub Docs。
