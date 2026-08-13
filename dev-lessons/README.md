# dev-lessons

本项目开发过程中踩坑/修复的速查记录。每条 lesson：症状 → 根因 → 解决 → 预防。

- [JupyterLab 扩展：两个容易踩的坑](jupyterlab-extension-pitfalls.md)
  - 坑 1：TypeScript 版本与 JupyterLab 4.6 类型不匹配
  - 坑 2：pyproject 项目名与 Python 包名不一致导致 `jupyter-builder develop` 失败
- [JupyterLab 扩展：两个工具链小修复](jupyterlab-tooling-fixes.md)
  - 修复 1：`@jupyterlab/builder`(legacy) → `@jupyter/builder` + 自带 loader
  - 修复 2：`ServerApp.token`(deprecated) → `IdentityProvider.token`
