# Lesson：JupyterLab 扩展两个工具链小修复

来源：`jupyterlab-sidebar-poc` 的两个非致命警告清理。均不影响功能，但消除噪音、跟上官方推荐。

## 修复 1：`@jupyterlab/builder`(legacy) → `@jupyter/builder`

**症状**：`npm run build` 时提示：

```text
@jupyterlab/core-meta was not found in node_modules. This extension declares
a devDependency on @jupyterlab/builder@4.2.0, which is a legacy package so
core-meta 4.2.0 will be used instead of the latest release.
To avoid this, add @jupyter/builder as a devDependency instead.
```

**根因**：`@jupyterlab/builder` 是 legacy 包；JupyterLab 4 的新一代 prebuilt 构建器已迁到 `@jupyter/builder`（基于 **Rspack** Module Federation）。

**解决**：
1. `package.json` 把 `"@jupyterlab/builder": "^4.2.0"` 换成 `"@jupyter/builder": "^1.2.2"`。
2. ⚠️ 新 builder 不再自带 CSS loader，构建会报 `Error: Unable to resolve loader style-loader`。需在 `devDependencies` 补上：

```json
"css-loader": "^6.11.0",
"style-loader": "^3.3.4"
```

3. 重新 `npm install && npm run build`，构建改用 Rspack，警告消失：

```text
Rspack 2.1.9 compiled successfully
```

**预防**：新项目直接用 `@jupyter/builder`，并把 `css-loader` / `style-loader` 一起放进 devDependencies。

## 修复 2：`ServerApp.token`(deprecated) → `IdentityProvider.token`

**症状**：启动 JupyterLab 时提示：

```text
[W ServerApp] ServerApp.token config is deprecated in 2.0. Use IdentityProvider.token.
```

**根因**：jupyter-server 2.0 把认证/token 配置从 `ServerApp` 迁到了 `IdentityProvider`。

**解决**：启动参数替换

```bash
# 旧
jupyter lab --no-browser --ServerApp.token=''
# 新
jupyter lab --no-browser --IdentityProvider.token=''
```

（`--ServerApp.port=8899` 等仍用 `ServerApp` 前缀，不受影响。）

**预防**：jupyter-server ≥ 2.0 起，涉及 token/认证的配置查 `IdentityProvider.*`，别再用 `ServerApp.token`。

## 参考

- 对应项目：`../jupyterlab-sidebar-poc/package.json`、`../jupyterlab-sidebar-poc/README.md`
- 架构背景：`../jupyter-architecture.md` 3.6（配置与认证）、4.4（prebuilt 与 Rspack Module Federation）
