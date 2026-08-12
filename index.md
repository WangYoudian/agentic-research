# AI Agent Harness / Framework 索引

> 按类别整理的当前热门 AI agent 项目速查页。
> 数据来源：GitHub API 实时查询（星数截至 2026-08-12），所有仓库均已逐一核实存在。

## 目录

- [一、通用多 Agent 编排框架](#framework)
- [二、Agentic Coding 工具（终端 CLI / harness）](#coding-tools)
- [三、个人 AI 助理 / 跨平台常驻 Agent](#personal-assistant)
- [四、快速选型指南](#how-to-choose)
- [五、数据说明](#data-notes)

**另见**：[Jupyter 生态与 AI 功能索引 →](jupyter-ai.md) ｜ [DeepWiki 收录验证清单 →](deepwiki.md)

---

<a name="framework"></a>
## 一、通用多 Agent 编排框架

Python 生态为主，面向生产环境的 agent 工作流 / 多 agent 协同。全部开源。

| 项目 | 一句话说明 | License | ★ Stars | 代码链接 |
|---|---|---|---|---|
| **CrewAI** | 角色扮演式多 agent 编排（"crew" 协作），上手快 | MIT | ~57.0k | https://github.com/crewAIInc/crewAI |
| **LangGraph** | LangChain 的图状 agent 编排：状态机、checkpoint、人机协同 | MIT | ~39.5k | https://github.com/langchain-ai/langgraph |
| **smolagents** (Hugging Face) | 极简 harness，agent 以"写代码"方式调用工具 | Apache-2.0 | ~28.8k | https://github.com/huggingface/smolagents |
| **OpenAI Agents SDK** | 轻量生产级 agent harness：handoffs、guardrails、sessions | MIT | ~28.6k | https://github.com/openai/openai-agents-python |
| **Google ADK** | 代码优先的 agent 开发套件：构建→评估→部署，支持 MCP | Apache-2.0 | ~21.1k | https://github.com/google/adk-python |
| **Pydantic AI** | 基于 Pydantic 的类型安全 agent 框架，结构化输出 | MIT | ~19.2k | https://github.com/pydantic/pydantic-ai |
| **Microsoft Agent Framework** | AutoGen 继任者：Python/.NET，企业级多 agent 工作流 | MIT | ~12.7k | https://github.com/microsoft/agent-framework |
| **MetaGPT** | 多 agent 软件公司模拟（PM→工程师→QA 角色流水线） | MIT | ~69.8k | https://github.com/FoundationAgents/MetaGPT |
| **LlamaIndex** | 文档 agent / RAG 平台，含 agent 能力 | MIT | ~51.6k | https://github.com/run-llama/llama_index |

**AutoGen 生态备注**：原始 [microsoft/autogen](https://github.com/microsoft/autogen)（~60.4k★）已停止活跃开发，主线迁移至 **Microsoft Agent Framework**；社区继续维护的 fork 为 **AG2**（Apache-2.0，~4.9k★）→ https://github.com/ag2ai/ag2

---

<a name="coding-tools"></a>
## 二、Agentic Coding 工具（终端 CLI / harness）

在终端里运行、可自主执行编码任务的 agent。多数为开源（除注明外）。

| 项目 | 一句话说明 | License | ★ Stars | 代码链接 | 备注 |
|---|---|---|---|---|---|
| **Hermes Agent** (Nous Research) | 开源 AI agent，"The agent that grows with you"，skills/插件生态丰富 | MIT | ~229k | https://github.com/NousResearch/hermes-agent | Python；主页 https://hermes-agent.nousresearch.com |
| **OpenAI Codex** | OpenAI 官方终端编码 agent，轻量、可编程 | Apache-2.0 | ~105k | https://github.com/openai/codex | Rust 编写，活跃维护 |
| **pi** (earendil-works) | AI agent 工具箱：统一 LLM API + agent 循环 + TUI + 编码 CLI | MIT | ~88.3k | https://github.com/earendil-works/pi | TypeScript；即 "pi.dev" 的 pi，与 Raspberry Pi 无关 |
| **Claude Code** (Anthropic) | Anthropic 的终端 agentic 编码工具 | 源码可见，无 OSS 许可证 | ~141k | https://github.com/anthropics/claude-code | 仓库即文档/镜像；产品本体闭源 |
| **Claude Agent SDK** (Anthropic) | 编程化控制 Claude Code harness 的官方 SDK | MIT | ~7.9k | https://github.com/anthropics/claude-agent-sdk-python | Python/TS |
| **Prime Agent** (Prime Intellect) | 自我改进的 RLM agent，面向编码工作流与长时自主任务 | MIT | ~14.6k | https://github.com/PrimeIntellect-ai/prime-agent | TypeScript |
| **opencode** | 终端 AI 编码 agent（Go） | MIT | ~13.6k | https://github.com/opencode-ai/opencode | ⚠️ 已归档（2025-09 停止维护），社区 fork 分散 |

---

<a name="personal-assistant"></a>
## 三、个人 AI 助理 / 跨平台常驻 Agent

| 项目 | 一句话说明 | License | ★ Stars | 代码链接 | 备注 |
|---|---|---|---|---|---|
| **OpenClaw** | 你的个人 AI 助理："Any OS. Any Platform"，跨平台常驻 | 自定义许可（非标准 OSS） | ~386k | https://github.com/openclaw/openclaw | TypeScript；前身 Clawdbot / Moltbot；数据自托管，但需注意自定义许可条款 |

---

<a name="how-to-choose"></a>
## 四、快速选型指南

- **要生产级通用编排框架（Python）** → OpenAI Agents SDK（轻量）、LangGraph（图编排最灵活）、Microsoft Agent Framework（企业级，AutoGen 正统继任）、CrewAI（多 agent crew 上手最快）
- **要类型安全 / 结构化输出** → Pydantic AI
- **要最小依赖的 "thinking in code" harness** → smolagents
- **要终端编码 agent（开源）** → OpenAI Codex、Hermes Agent、pi、Prime Agent
- **要用 Claude 生态编程化集成** → Claude Agent SDK（Claude Code 官方封装）
- **要常驻式个人助理 / 跨平台** → OpenClaw（注意其自定义许可证）

---

<a name="data-notes"></a>
## 五、数据说明

- 星数为 GitHub API 于 2026-08-12 查询的实时值，会随时间变化。
- 许可证字段来自 GitHub API 的 `license.spdx_id`。
- "openclaw" 与 "claude-code" 的许可证显示为自定义/无（NOASSERTION / null），使用前请自行核对其许可条款。
