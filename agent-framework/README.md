# agent-framework

> Agentic Coding 工具 / 常驻 Agent 源码镜像（git submodule）。
> 收录来源见 [index.md](../index.md) 二、三节；DeepWiki 收录验证见 [deepwiki.md](../deepwiki.md)。

本目录以 **git submodule** 方式挂载以下 agent 仓库源码，仅供本地参考与研究，不对源码做分析。

| Agent | 一句话说明 | GitHub | 本地路径 |
|---|---|---|---|
| **pi** | AI agent 工具箱：统一 LLM API + agent 循环 + TUI + 编码 CLI | https://github.com/earendil-works/pi | `agent-framework/pi` |
| **Hermes Agent** | 开源 AI agent，"The agent that grows with you" | https://github.com/NousResearch/hermes-agent | `agent-framework/hermes-agent` |
| **Claude Code** | Anthropic 的终端 agentic 编码工具 | https://github.com/anthropics/claude-code | `agent-framework/claude-code` |
| **Prime Agent** | 自我改进的 RLM agent（编码工作流） | https://github.com/PrimeIntellect-ai/prime-agent | `agent-framework/prime-agent` |
| **DeepSeek Harness** | DeepSeek 的 agent / harness 研究与执行模板 | https://github.com/deepseek-ai/deepseek-harness | `agent-framework/deepseek-harness` |
| **OpenClaw** | 个人 AI 助理："Any OS. Any Platform" | https://github.com/openclaw/openclaw | `agent-framework/openclaw` |

## 常用命令

```bash
# 首次克隆本项目后，拉取所有 submodule
git submodule update --init --recursive

# 更新所有 submodule 到远端最新
git submodule update --remote
```

> 注意：`claude-code` 无 OSS 许可证、`openclaw` 为自定义许可证，使用前请自行核对许可条款。
