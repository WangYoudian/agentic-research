# syntax=docker/dockerfile:1
# =============================================================================
# JupyterLab 扩展 · Docker 定制化构建方案
#
#   构建命令（context 必须是仓库根目录）：
#     docker build -f jupyterlab-docker-dev/Dockerfile -t jlab-ext:dev .
#
#   两个阶段：
#     builder —— 定制化 build（npm ci → build:prod → 生成 build_info.json）
#     runtime —— 官方 docker-stacks 镜像 + 把扩展 pip 装进 share/jupyter/labextensions
# =============================================================================

# ---------------- 可配置参数 ----------------
ARG EXT_SRC=jupyterlab-sidebar-poc
ARG EXT_NAME=sidebar-poc
ARG JL_STACK=quay.io/jupyter/minimal-notebook:2026-07-28
ARG NODE_MAJOR=22
ARG PY_VERSION=3.13

# =============================================================================
# 阶段 1：builder —— 定制化构建 prebuilt labextension
# =============================================================================
FROM python:${PY_VERSION}-slim AS builder
ARG NODE_MAJOR
ARG EXT_SRC

# node（编译 TS / 跑 rspack）+ git（build_info 记 hash）+ curl
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl ca-certificates git \
    && curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# jupyterlab（提供 jupyter-builder CLI，供 npm run build:prod 调用）
COPY jupyterlab-docker-dev/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir uv \
    && uv pip install --system --no-cache-dir -r /tmp/requirements.txt

COPY ${EXT_SRC} /src/ext
WORKDIR /src/ext

# 定制化构建脚本（含自定义 build_info 生成步骤）
COPY jupyterlab-docker-dev/scripts/build-extension.sh /usr/local/bin/build-extension
RUN chmod +x /usr/local/bin/build-extension \
    && build-extension /src/ext

# =============================================================================
# 阶段 2：runtime —— 官方 docker-stacks + 装进扩展
# =============================================================================
FROM ${JL_STACK} AS runtime
ARG EXT_NAME

USER root
# 预创建 jovyan 的 .local/share/jupyter 目录链（jovyan 所有），
# 避免 bind mount 时中间父目录被以 root 创建，导致 jovyan 无法写 runtime/ 等目录
RUN mkdir -p /home/jovyan/.local/share/jupyter/labextensions \
    && chown -R ${NB_UID}:${NB_GID} /home/jovyan/.local

COPY --from=builder /src/ext /opt/${EXT_NAME}
RUN chown -R ${NB_UID}:${NB_GID} /opt/${EXT_NAME}
USER ${NB_UID}

# pip 安装 Python 包；hatchling 的 shared-data 会把 labextension 自动放进
# $CONDA_DIR/share/jupyter/labextensions/<EXT_NAME>
RUN pip install --no-cache-dir /opt/${EXT_NAME} \
    && jupyter labextension list \
    && jupyter server extension list

ENV JUPYTER_ENABLE_LAB=yes
