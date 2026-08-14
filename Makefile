# =============================================================================
# JupyterLab 扩展 · Docker dev 快捷命令（仓库根）
#
# 用法：在仓库根目录直接执行 make build / make up / make down / make logs /
#       make build-ext / make watch
#
# 为什么这样写：
#   本机 docker / docker-compose 是交互式 shell 里的别名（alias docker=podman），
#   而 make 用 /bin/sh 执行命令、读不到别名，所以这里用 command -v 探测真实
#   二进制：优先 docker，找不到就自动回退 podman。
# =============================================================================

ROOT    := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
DEV_DIR := $(ROOT)/jupyterlab-docker-dev

DOCKER  ?= $(shell command -v docker 2>/dev/null || command -v podman 2>/dev/null || echo docker)
COMPOSE ?= $(shell command -v docker-compose 2>/dev/null || command -v podman-compose 2>/dev/null || echo docker-compose)

IMAGE ?= jlab-ext

.PHONY: build up down logs build-ext watch

## 定制化构建镜像（多阶段，扩展烘焙进镜像）
build:
	cd $(ROOT) && $(DOCKER) build -f $(DEV_DIR)/Dockerfile -t $(IMAGE):dev .

## 启动 dev 容器（含首次定制化 build）
up:
	cd $(ROOT) && $(COMPOSE) -f $(DEV_DIR)/docker-compose.yml up -d --build

## 停止容器
down:
	cd $(ROOT) && $(COMPOSE) -f $(DEV_DIR)/docker-compose.yml down

## 查看容器日志
logs:
	cd $(ROOT) && $(COMPOSE) -f $(DEV_DIR)/docker-compose.yml logs -f

## 宿主机定制化构建扩展（产出 labextension，挂载进容器即热更新）
build-ext:
	$(DEV_DIR)/scripts/build-extension.sh $(ROOT)/jupyterlab-sidebar-poc

## 宿主机热更新 watch（改代码自动重建 labextension）
watch:
	$(DEV_DIR)/scripts/dev-watch.sh $(ROOT)/jupyterlab-sidebar-poc
