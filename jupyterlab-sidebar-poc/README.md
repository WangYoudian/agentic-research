# jupyterlab-sidebar-poc

一个 JupyterLab **左侧边栏扩展** POC。它通过一个 prebuilt 前端扩展，往 JupyterLab 的左侧栏（`app.shell.add(widget, 'left')`）注入一个带交互的 Widget。

## 环境

- Python 3.13（用 [uv](https://docs.astral.sh/uv/) 管理）
- Node.js ≥ 18（构建前端扩展用）

## 快速开始

```bash
# 1. 建 Python 3.13 环境并装依赖（jupyterlab + 本扩展）
uv venv .venv --python 3.13
source .venv/bin/activate
uv pip install -e .

# 2. 装前端依赖并构建 prebuilt 扩展（产物输出到 sidebar_poc/labextension）
npm install
npm run build

# 3. 注册扩展（把 labextension 软链到环境的 share/jupyter/labextensions）
jupyter labextension develop . --overwrite

# 4. 启动，浏览器打开后左侧栏应出现 "POC Panel"
#    注意：server 2.x 里 ServerApp.token 已废弃，用 IdentityProvider.token
jupyter lab --no-browser --IdentityProvider.token=''
```

验证扩展已加载：`jupyter labextension list`。

## 开发迭代

- 改 `src/index.ts` / `style/index.css` 后：`npm run build`，浏览器刷新即可（prebuilt 无需重编 JupyterLab）。
- 想热更新：开两个终端分别跑 `npm run watch:lib` 与 `npm run watch:labextension`。

## 目录结构

```text
jupyterlab-sidebar-poc/
├── package.json          # npm 包 + jupyterlab prebuilt 元数据（outputDir）
├── tsconfig.json
├── src/index.ts          # 插件：注册左侧栏 Widget
├── style/index.css
├── pyproject.toml        # Python 包（hatchling），把 labextension 装到 share/jupyter/labextensions
└── sidebar_poc/          # Python 包（版本占位 + 构建产物 labextension/）
```

## 原理速览

- JupyterLab 前端扩展 = 一个或多个 plugin；本扩展 `autoStart`，`requires: [ILayoutRestorer]`。
- `app.shell.add(widget, 'left', { rank })` 是往左侧栏塞 Widget 的标准入口（对应架构文档第四章）。
- prebuilt 扩展产物由 `jupyter-builder build` 生成，安装后 JupyterLab 运行时动态加载（Module Federation），无需重编。
