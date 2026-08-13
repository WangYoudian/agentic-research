# Lesson：JupyterLab 扩展开发两个容易踩的坑

来源：`jupyterlab-sidebar-poc` 首次搭建（uv + Python 3.13 + JupyterLab 4.6.3）。

## 坑 1：TypeScript 版本与 JupyterLab 4.x 的类型不匹配

**症状**（`npm run build` 的 `tsc` 阶段直接失败）：

```text
node_modules/@jupyterlab/coreutils/lib/time.d.ts(5,28): error TS2724:
  'Intl' has no exported member named 'ResolvedRelativeTimeFormatOptions'.
node_modules/lib0/decoding.d.ts(9,29): error TS2315:
  Type 'Uint8Array' is not generic.
src/index.ts(47,5): error TS2769: ... 'keydown' is not assignable to keyof ElementEventMap.
```

**根因**：JupyterLab 4.6.x 发布的 `.d.ts` 使用了较新 TS 特性（泛型 TypedArray、更新的 Intl 类型，均来自 TS ≥ 5.7），而 JupyterLab 扩展模板历史上 pin `typescript: ~5.1.6`。旧 TS 的 lib 里没有这些类型 → 检查 node_modules 的声明文件时报错。

**解决**：
1. `package.json` 把 `typescript` 升到 `~5.8.2`（解决 TS2315/泛型 Uint8Array 等 lib 问题）。
2. `tsconfig.json` 加 `"skipLibCheck": true`（跳过对第三方 `.d.ts` 的检查，解决剩余的 Intl 类型漂移；不影响对 `src/` 的检查）。

**预防**：新建扩展时，`typescript` 版本用当前 JupyterLab 依赖的较新 5.x，并默认开启 `skipLibCheck`。若升级 JupyterLab 后突然冒出大量 node_modules 类型错误，多半是同样的版本漂移。

## 坑 2：pyproject 的 `[project].name` 必须与 Python 包名一致

**症状**：`jupyter-builder develop . --overwrite`（以及旧命令 `jupyter labextension develop`）失败：

```text
ModuleNotFoundError: There is no labextension at .
Errors encountered: [TypeError("the 'package' argument is required ..."),
                    ModuleNotFoundError("No module named 'jupyterlab_sidebar_poc'")]
```

**根因**：`jupyter_builder` 的 `develop_labextension_py` 会按 **pyproject `[project].name` 规范化出的模块名**去 `import` 定位 labextension（`jupyterlab-sidebar-poc` → 尝试 import `jupyterlab_sidebar_poc`）。我们的 Python 包目录叫 `sidebar_poc`，与项目名不一致 → import 失败，develop 直接报错。

**解决**：
1. 让 `[project].name` 与 Python 包名一致：`name = "sidebar-poc"` ↔ 包目录 `sidebar_poc/`。
2. 在包 `__init__.py` 里补上标准的发现钩子：

```python
def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": "sidebar-poc"}]
```

改完后 `jupyter-builder develop . --overwrite` 会在环境里建软链并注册：`labextensions/sidebar-poc -> <src>/sidebar_poc/labextension`，`jupyter labextension list` 显示 `enabled OK`。

**预防**：Python 包名 = 项目名（规范化），并始终提供 `_jupyter_labextension_paths()`；这两条是官方扩展模板的隐含约定。

## 参考

- 对应项目：`../jupyterlab-sidebar-poc/`（tsconfig / pyproject / sidebar_poc/__init__.py）
- 架构背景：`../jupyter-architecture.md` 第四章（prebuilt 扩展加载与 `jupyter-builder develop` 工作流）
