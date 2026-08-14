#!/usr/bin/env bash
# =============================================================================
# 宿主机热更新：监听扩展源码，改动自动重建 labextension
# （配合 docker-compose 的 labextension 挂载，改完刷新浏览器即可看到）
#
# 用法: dev-watch.sh [扩展目录]
# 依赖: 扩展的 venv（提供 jupyter-builder）+ node
# =============================================================================
set -euo pipefail

EXT_DIR="${1:-$(pwd)}"
cd "$EXT_DIR"

# 激活扩展自己的 venv，让 jupyter-builder watch 可用
if [ -f .venv/bin/activate ]; then
  # shellcheck disable=SC1091
  source .venv/bin/activate
fi

command -v jupyter-builder >/dev/null || { echo "✗ 找不到 jupyter-builder，请先创建 venv 并安装 jupyterlab"; exit 1; }

# 并行：tsc -w（lib） + jupyter-builder watch（labextension）
npx --yes concurrently -n lib,labext -c blue,green \
  "npm run watch:lib" \
  "npm run watch:labextension"
