# DeepWiki 收录验证清单

> 对 `index.md`、`jupyter-ai.md` 及原 `jupyter-diagrams.md` 所引仓库共 46 个 GitHub 仓库逐一验证 DeepWiki 收录情况。
> **验证方法**：DeepWiki 对未收录项目也会返回 200 占位页（~34KB），故不能以状态码判断；本清单以页面内容是否含 **"Last indexed"** 标志为准（已收录页面 ~1MB+ 且含该标志）。验证日期：2026-08-12。

**汇总：46 个仓库中 41 个已收录 ✅，5 个未收录 ❌**

---

## 一、index.md（AI Agent Harness / Framework，19 个）

| 项目 | GitHub | DeepWiki | 状态 |
|---|---|---|---|
| CrewAI | https://github.com/crewAIInc/crewAI | https://deepwiki.com/crewAIInc/crewAI | ✅ |
| LangGraph | https://github.com/langchain-ai/langgraph | https://deepwiki.com/langchain-ai/langgraph | ✅ |
| smolagents | https://github.com/huggingface/smolagents | https://deepwiki.com/huggingface/smolagents | ✅ |
| OpenAI Agents SDK | https://github.com/openai/openai-agents-python | https://deepwiki.com/openai/openai-agents-python | ✅ |
| Google ADK | https://github.com/google/adk-python | https://deepwiki.com/google/adk-python | ✅ |
| Pydantic AI | https://github.com/pydantic/pydantic-ai | https://deepwiki.com/pydantic/pydantic-ai | ✅ |
| Microsoft Agent Framework | https://github.com/microsoft/agent-framework | https://deepwiki.com/microsoft/agent-framework | ✅ |
| MetaGPT | https://github.com/FoundationAgents/MetaGPT | https://deepwiki.com/FoundationAgents/MetaGPT | ✅ |
| LlamaIndex | https://github.com/run-llama/llama_index | https://deepwiki.com/run-llama/llama_index | ✅ |
| AutoGen | https://github.com/microsoft/autogen | https://deepwiki.com/microsoft/autogen | ✅ |
| AG2 | https://github.com/ag2ai/ag2 | https://deepwiki.com/ag2ai/ag2 | ✅ |
| Hermes Agent | https://github.com/NousResearch/hermes-agent | https://deepwiki.com/NousResearch/hermes-agent | ✅ |
| OpenAI Codex | https://github.com/openai/codex | https://deepwiki.com/openai/codex | ✅ |
| pi | https://github.com/earendil-works/pi | https://deepwiki.com/earendil-works/pi | ✅ |
| Claude Code | https://github.com/anthropics/claude-code | https://deepwiki.com/anthropics/claude-code | ✅ |
| Claude Agent SDK | https://github.com/anthropics/claude-agent-sdk-python | https://deepwiki.com/anthropics/claude-agent-sdk-python | ✅ |
| Prime Agent | https://github.com/PrimeIntellect-ai/prime-agent | https://deepwiki.com/PrimeIntellect-ai/prime-agent | ✅ |
| opencode | https://github.com/opencode-ai/opencode | https://deepwiki.com/opencode-ai/opencode | ✅ |
| OpenClaw | https://github.com/openclaw/openclaw | https://deepwiki.com/openclaw/openclaw | ✅ |

## 二、jupyter-ai.md（Jupyter 生态与 AI 功能，26 个）

| 项目 | GitHub | DeepWiki | 状态 |
|---|---|---|---|
| JupyterLab | https://github.com/jupyterlab/jupyterlab | https://deepwiki.com/jupyterlab/jupyterlab | ✅ |
| Notebook | https://github.com/jupyter/notebook | https://deepwiki.com/jupyter/notebook | ✅ |
| JupyterLite | https://github.com/jupyterlite/jupyterlite | https://deepwiki.com/jupyterlite/jupyterlite | ✅ |
| VS Code Jupyter 扩展 | https://github.com/microsoft/vscode-jupyter | https://deepwiki.com/microsoft/vscode-jupyter | ✅ |
| jupyter_server | https://github.com/jupyter-server/jupyter_server | https://deepwiki.com/jupyter-server/jupyter_server | ✅ |
| ipykernel | https://github.com/ipython/ipykernel | https://deepwiki.com/ipython/ipykernel | ✅ |
| nbformat | https://github.com/jupyter/nbformat | https://deepwiki.com/jupyter/nbformat | ✅ |
| nbconvert | https://github.com/jupyter/nbconvert | https://deepwiki.com/jupyter/nbconvert | ✅ |
| papermill | https://github.com/nteract/papermill | https://deepwiki.com/nteract/papermill | ✅ |
| **jupytext** | https://github.com/jupytext/jupytext | — | ❌ 未收录 |
| ipywidgets | https://github.com/jupyter-widgets/ipywidgets | https://deepwiki.com/jupyter-widgets/ipywidgets | ✅ |
| Voilà | https://github.com/voila-dashboards/voila | https://deepwiki.com/voila-dashboards/voila | ✅ |
| JupyterHub | https://github.com/jupyterhub/jupyterhub | https://deepwiki.com/jupyterhub/jupyterhub | ✅ |
| jupyterlab-lsp | https://github.com/jupyter-lsp/jupyterlab-lsp | https://deepwiki.com/jupyter-lsp/jupyterlab-lsp | ✅ |
| Jupyter AI | https://github.com/jupyterlab/jupyter-ai | https://deepwiki.com/jupyterlab/jupyter-ai | ✅ |
| jupyterlite/ai | https://github.com/jupyterlite/ai | https://deepwiki.com/jupyterlite/ai | ✅ |
| jupyter-mcp-server | https://github.com/datalayer/jupyter-mcp-server | https://deepwiki.com/datalayer/jupyter-mcp-server | ✅ |
| cursor-notebook-mcp | https://github.com/jbeno/cursor-notebook-mcp | https://deepwiki.com/jbeno/cursor-notebook-mcp | ✅ |
| **vscode-runtime-notebook-mcp** | https://github.com/olavocarvalho/vscode-runtime-notebook-mcp | — | ❌ 未收录 |
| thread-notebook | https://github.com/alishobeiri/thread-notebook | https://deepwiki.com/alishobeiri/thread-notebook | ✅ |
| jupyter-ai-agents | https://github.com/datalayer/jupyter-ai-agents | https://deepwiki.com/datalayer/jupyter-ai-agents | ✅ |
| **notebook-intelligence** | https://github.com/plmbr/notebook-intelligence | — | ❌ 未收录 |
| **jupyter-studio** | https://github.com/deepelementlab/jupyter-studio | — | ❌ 未收录 |
| Deepnote | https://github.com/deepnote/deepnote | https://deepwiki.com/deepnote/deepnote | ✅ |
| awesome-jupyter | https://github.com/markusschanta/awesome-jupyter | https://deepwiki.com/markusschanta/awesome-jupyter | ✅ |
| best-of-jupyter | https://github.com/ml-tooling/best-of-jupyter | https://deepwiki.com/ml-tooling/best-of-jupyter | ✅ |

---

## 三、未收录明细（5 个）

| 仓库 | 说明 | 备注 |
|---|---|---|
| [jupytext/jupytext](https://github.com/jupytext/jupytext) | notebook ↔ Markdown/脚本 双向转换 | 7.2k★ 但 DeepWiki 未收录 |
| [olavocarvalho/vscode-runtime-notebook-mcp](https://github.com/olavocarvalho/vscode-runtime-notebook-mcp) | VS Code Jupyter runtime 内嵌 MCP | 小项目（16★） |
| [plmbr/notebook-intelligence](https://github.com/plmbr/notebook-intelligence) | JupyterLab AI 扩展 | 小项目（324★） |
| [deepelementlab/jupyter-studio](https://github.com/deepelementlab/jupyter-studio) | AI 原生 JupyterLab | 小项目（53★） |
| [jupyterlab/extension-template](https://github.com/jupyterlab/extension-template) | JupyterLab 扩展官方 copier 脚手架模板（原 jupyter-diagrams.md 引用） | 86★，DeepWiki 未收录 |

> DeepWiki 收录不受 Star 数保证（jupytext 未被收录），可在 https://deepwiki.com 页面提交"Index your code with Devin"申请收录。
