# AGENTS.md — jupyterlab-sidebar-poc 项目规则

> 本文件给代码 agent（Copilot / Claude 等）说明在此项目里的**规则与约束**。改代码前先读这里。
> 关联：`../dev-lessons/`（本项目的踩坑记录）｜ `../jupyter-architecture.md`（Jupyter 底层架构）

## 项目定位

一个 **JupyterLab prebuilt 前端扩展** POC：往左侧栏（`app.shell.add(widget, 'left')`）注入一个 ReactWidget 侧边栏面板。不是独立应用，是 JupyterLab 插件。

## 技术栈（版本必须保持对齐，别乱升/降）

| 项 | 值 | 约束 |
|---|---|---|
| Python | 3.13（用 uv 管理） | venv 在 `.venv/` |
| JupyterLab | `^4.2`（当前 4.6.x） | pyproject 依赖 `jupyterlab>=4.2,<5` |
| TypeScript | `~5.8` | **`moduleResolution: "bundler"`，禁止改回 `node`/`node10`**（已废弃，TS7 移除） |
| React | 18（`react`/`react-dom`） | `jupyterlab.sharedPackages` 里必须是 **`singleton`**，避免双 React |
| builder | **`@jupyter/builder`**（非 `@jupyterlab/builder`） | legacy 包；需自带 `css-loader`/`style-loader`，产出走 Rspack |

## 目录结构（区分「源码」与「生成物」）

```text
src/                    # 源码（agent 改这里）
  index.tsx             # 插件入口 + React 组件（ReactWidget 版）
  css-modules.d.ts      # declare module '*.css' —— 别删，CSS 导入依赖它
style/index.css         # 样式（构建时打进 labextension）
package.json            # npm 包 + jupyterlab prebuilt 元数据
pyproject.toml          # Python 包（hatchling），shared-data 装 labextension
tsconfig.json
sidebar_poc/            # Python 包
  __init__.py           # 含 _jupyter_labextension_paths()（别删）
  labextension/         # ⚠️ 构建产物，勿手改，gitignored
lib/                    # ⚠️ tsc 产物，勿手改，gitignored
img/                    # 截图
```

## 常用命令

```bash
# 类型检查（提交前必跑）
npx tsc --noEmit

# 构建 prebuilt 扩展（tsc → jupyter-builder build，产物进 sidebar_poc/labextension）
npm run build            # dev
npm run build:prod       # 生产（含 clean）

# 注册扩展（改 package.json/pyproject 后可能需要）
jupyter labextension develop . --overwrite
jupyter labextension list

# 本地启动（注意：用 IdentityProvider.token，勿用已废弃的 ServerApp.token）
jupyter lab --no-browser --IdentityProvider.token=''

# Python 环境
uv venv .venv --python 3.13
uv pip install -e .
```

## 代码约定

- **TS 严格模式**：`strict`、`noImplicitAny`、`noUnusedLocals` 已开；不要新增宽松开关。
- **不要手动操作 DOM**：这是 ReactWidget 版，状态用 `useState`/hooks，改 `state` 自动重渲染。要交互就往 React 组件里加。
- **侧边栏 Widget 统一用 `ReactWidget.create(<Comp />)`** 包成 Lumino Widget，再 `app.shell.add(widget, 'left', { rank })` + `restorer.add(widget, id)`。
- **插件 id 惯例**：`<包名>:<插件名>` = `sidebar-poc:plugin`，全局唯一。
- **CSS 导入**：`import '../style/index.css'` 依赖 `src/css-modules.d.ts`；新增样式文件同理，别移除该声明。
- **新增前端依赖**：如果是会被多扩展共享的包（如 react），记得加进 `jupyterlab.sharedPackages` 并设为 `singleton`。

## 构建契约（踩过坑，别破坏）

1. `pyproject [project].name` **必须等于 `sidebar-poc`**（不能改成 `jupyterlab-sidebar-poc`），并与 Python 包目录 `sidebar_poc` 对应 —— `jupyter-builder develop` 按此 import 定位 labextension。
2. `package.json` 的 `jupyterlab.outputDir` 保持 `sidebar_poc/labextension`；`jupyterlab.extension: true` 保持。
3. `sidebar_poc/__init__.py` 里的 `_jupyter_labextension_paths()` 返回 `[{"src": "labextension", "dest": "sidebar-poc"}]`，别删。
4. `sidebar_poc/labextension/build_info.json` 是构建脚本生成的（git hash/时间戳），**勿手改**。
5. `pyproject` 里 `packages = ["sidebar_poc"]` 与 `shared-data` 映射别乱动。

## 升级/兼容注意事项

- 升 JupyterLab 后若 `tsc` 冒出大量 `node_modules` 里的类型错误（如 `Intl.ResolvedRelativeTimeFormatOptions`、泛型 `Uint8Array`）→ 通常是 **TypeScript 版本偏旧**，先升 TS 到 5.7+；`skipLibCheck: true` 保留。
- `@jupyter/builder`、`@jupyterlab/*`、`typescript` 保持互相兼容（大版本对齐）。
- 改依赖后提交前跑 `npx tsc --noEmit` + `npm run build` + `jupyter labextension list` 三件套验证。

## 提交纪律

- 只提交源码与配置：`src/`、`style/`、`package.json`、`pyproject.toml`、`tsconfig.json`、`README.md`、`AGENTS.md`、`img/`。
- **不要提交** `lib/`、`sidebar_poc/labextension/`、`node_modules/`、`.venv/`（已在 `.gitignore`）。
