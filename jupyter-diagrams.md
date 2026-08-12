# Jupyter 生态与架构图

> Jupyter 生态关系图 + 分层架构图（Mermaid，GitHub 可直接渲染）。
> 数据依据：`jupyter-ai.md` 生态分层与 Jupyter 官方架构文档。

## 目录

- [一、Jupyter 生态关系图](#eco)
- [二、Jupyter 分层架构图（含 JupyterLab Extension 嵌入方式）](#arch)
- [三、JupyterLab Extension 嵌入机制说明](#how-extension)

---

<a name="eco"></a>
## 一、Jupyter 生态关系图

```mermaid
flowchart LR
    subgraph FRONT["前端界面层"]
        JL["JupyterLab"]
        NB["Notebook 7"]
        LITE["JupyterLite<br/>(浏览器 WASM)"]
        VS["VS Code Jupyter 扩展"]
        OTHER["其他前端<br/>(nteract / Colab / Deepnote)"]
    end

    subgraph SERVER["服务层"]
        JS["jupyter-server<br/>REST API + WebSocket"]
        LSP["jupyterlab-lsp<br/>(LSP 接入)"]
    end

    subgraph KERNEL["内核层"]
        PROTO["Jupyter Messaging Protocol<br/>(ZeroMQ JSON)"]
        IK["IPykernel"]
        XK["xeus / 其他 kernel"]
    end

    subgraph DOC["文档与格式"]
        NBF["nbformat<br/>(.ipynb JSON)"]
    end

    subgraph TRANS["转换 / 执行 / 版本"]
        NC["nbconvert"]
        PM["papermill"]
        JT["jupytext"]
    end

    subgraph DEPLOY["交互组件 / 部署"]
        IW["ipywidgets"]
        VOILA["Voilà"]
        JH["JupyterHub"]
    end

    subgraph AI["AI 能力"]
        JAI["Jupyter AI<br/>(官方扩展)"]
        LAI["jupyterlite/ai"]
        MCP["jupyter-mcp-server<br/>(MCP 接入)"]
        COP["GitHub Copilot<br/>(VS Code 路径)"]
    end

    NB -->|"基于"| JL
    JL -->|"前端访问"| JS
    LITE -->|"前端访问"| JS
    VS -->|"前端访问"| JS
    OTHER -->|"前端访问"| JS
    LSP --> JS

    JS -->|"管理 kernel 会话"| PROTO
    PROTO --> IK
    PROTO --> XK
    JS <-->|"保存 / 加载文档"| NBF
    IK -.->|"执行代码"| NBF

    NC -->|"转换"| NBF
    PM -->|"批量执行"| NBF
    JT <-->|"双向转换 .py/.md"| NBF

    IW -->|"交互控件"| NBF
    VOILA -->|"基于 widget"| IW
    VOILA -->|"发布 Web 应用"| NBF
    JH -->|"spawn 多用户实例"| JS

    JAI -->|"扩展"| JL
    LAI -->|"扩展"| LITE
    MCP -->|"外部 agent 读写执行 notebook"| NBF
    COP -->|"补全 / 聊天"| VS
```

---

<a name="arch"></a>
## 二、Jupyter 分层架构图（含 JupyterLab Extension 嵌入方式）

```mermaid
flowchart TB
    subgraph L1["L1 界面层"]
        direction LR
        UI1["JupyterLab UI"]
        UI2["Notebook 7"]
        UI3["JupyterLite"]
        UI4["VS Code / 第三方前端"]
    end

    subgraph L2["L2 前端框架层（JupyterLab 内核）"]
        direction LR
        EXT_FRONT["⭐ 前端扩展<br/>TypeScript / Lumino 插件<br/>注册 commands / widgets / panels"]
        LU["Lumino 插件系统<br/>(Application / DockPanel)"]
    end

    subgraph L3["L3 服务层（jupyter-server）"]
        direction LR
        SEXT["⭐ Server 扩展<br/>Python 包<br/>注册 REST handler / API"]
        REST["REST API + WebSocket<br/>内容管理 / kernel 管理 / 会话"]
    end

    subgraph L4["L4 内核层"]
        direction LR
        PROTO2["Jupyter Messaging Protocol<br/>(ZeroMQ JSON)"]
        IK2["IPykernel / wrapper / native / xeus kernel"]
    end

    subgraph L5["L5 文档与格式层"]
        NBF2["nbformat (.ipynb JSON)"]
    end

    UI1 --- EXT_FRONT
    EXT_FRONT -->|"注册到"| LU
    LU <-->|"REST / WebSocket"| REST
    SEXT -->|"注册到"| REST
    REST <-->|"kernel 通信"| PROTO2
    PROTO2 <--> IK2
    REST <-->|"保存 / 加载"| NBF2

    classDef ext fill:#fff3cd,stroke:#f0a500,stroke-width:2px
    classDef core fill:#e8f4fd,stroke:#1f6feb,stroke-width:1.5px
    class EXT_FRONT,SEXT ext
    class JL,LU,REST,PROTO2,IK2,NBF2 core
```

---

<a name="how-extension"></a>
## 三、JupyterLab Extension 嵌入机制说明

**两类扩展，对应两层**（图中 ⭐ 高亮）：

| 扩展类型 | 语言 | 嵌入点 | 能力 | 安装方式 |
|---|---|---|---|---|
| **前端扩展**（JupyterLab Extension） | TypeScript | 注册到 JupyterLab 的 Lumino 插件系统（Application 生命周期） | 新增命令、侧边栏/面板、右键菜单、编辑器扩展、自定义 widget | `pip install` / `conda`（prebuilt / federated 扩展，运行时由 JupyterLab 加载，无需重新构建）；源码扩展则需 `jlpm build` |
| **Server 扩展**（jupyter-server Extension） | Python | 注册到 jupyter-server 的 REST 端点与生命周期 | 后端 API、数据服务、认证、内容提供 | 同为 `pip install`，通过 entry point 自动发现 |

**嵌入流程（以自建扩展为例）**：
1. 用 `copier` 模板（`jupyterlab/copier-templates`）或 `jupyter labextension create` 生成骨架
2. 前端扩展在 `src/index.ts` 中导出 `plugin`，通过 `JupyterFrontEnd` 注册命令、加 widget 到 `ILayoutRestorer` / 侧边栏
3. Server 扩展在 Python 包中实现 `ServerExtension`（或 `load_jupyter_server_extension`），在 `jupyter_server_config` 注册 handler
4. 打包发布到 PyPI / conda；用户 `pip install` 后 `jupyter labextension list` 可见；JupyterLab 启动时自动加载联邦扩展

**典型 AI 扩展的嵌入示例**：Jupyter AI = 前端扩展（聊天面板、`%ai` magic UI）+ server 扩展（LLM provider 后端、REST 端点）；同理 jupyterlite/ai、thread-notebook、notebook-intelligence 都是"前端 + 后端"双层嵌入。

---

## 数据说明

- 架构分层依据 Jupyter 官方架构文档（docs.jupyter.org/projects/architecture）与 `jupyter-ai.md` 生态调查。
- 图使用 Mermaid v10+ 语法（`flowchart`），GitHub / GitLab / VS Code 均原生渲染。
