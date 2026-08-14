#!/usr/bin/env bash
# =============================================================================
# 定制化 JupyterLab 扩展构建脚本（prebuilt）
#
# 用法: build-extension.sh [扩展目录]     （默认当前目录）
# 产物: <扩展>/<jupyterlab.outputDir>/    （默认 sidebar_poc/labextension）
#
# 定制点：第 [3/4] 步会往产物里写 build_info.json，
#         想在构建链里加任何自定义步骤，就在这里扩展。
# =============================================================================
set -euo pipefail

EXT_DIR="${1:-$(pwd)}"
cd "$EXT_DIR"

[ -f package.json ] || { echo "✗ 找不到 package.json（目录：$EXT_DIR）"; exit 1; }

PKG_NAME="$(node -p "require('./package.json').name")"
PKG_VER="$(node -p "require('./package.json').version")"
OUT_DIR="$(node -p "require('./package.json').jupyterlab.outputDir")"

echo "==> [1/4] 安装前端依赖 (npm ci)"
npm ci

echo "==> [2/4] 编译 prebuilt 扩展 (npm run build:prod → jupyter-builder build)"
npm run build:prod

echo "==> [3/4] 定制化：写入 build_info.json（git hash / 时间戳 / JupyterLab 版本）"
GIT_HASH="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
JL_VERSION="$(python -c 'import jupyterlab; print(jupyterlab.__version__)' 2>/dev/null || echo n/a)"
mkdir -p "$OUT_DIR"
cat > "$OUT_DIR/build_info.json" <<EOF
{
  "extension": "${PKG_NAME}",
  "version": "${PKG_VER}",
  "git_short_hash": "${GIT_HASH}",
  "built_at": "${BUILD_TIME}",
  "jupyterlab": "${JL_VERSION}"
}
EOF
echo "    写入 ${OUT_DIR}/build_info.json"

echo "==> [4/4] 校验产物"
ls -1 "${OUT_DIR}/static/" 2>/dev/null | head -n 8 || true
echo "==> 构建完成：${OUT_DIR}（含 build_info.json）"
