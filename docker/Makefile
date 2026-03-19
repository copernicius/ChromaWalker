# 变量定义，方便后续修改
COMPOSE = docker-compose
PROJECT_NAME = my-mern-project

.PHONY: build up down restart shell-server shell-client shell-db logs clean ps

# 1. 构建镜像 (会根据 docker-compose.yml 里的 build 字段执行)
build:
	$(COMPOSE) build --no-cache

# 2. 一键启动所有服务 (后台运行)
up:
	$(COMPOSE) up -d --build

# 3. 停止并移除容器
down:
	$(COMPOSE) down

# 4. 重启所有服务
restart:
	$(COMPOSE) down && $(COMPOSE) up -d

# 5. 分别进入不同容器的 Shell (非常实用)
shell-server:
	$(COMPOSE) exec server bash

shell-client:
	$(COMPOSE) exec client bash

shell-db:
	$(COMPOSE) exec mongodb mongosh

# 6. 查看实时日志
logs:
	$(COMPOSE) logs -f

# 7. 查看容器运行状态
ps:
	$(COMPOSE) ps

# 8. 深度清理：停止容器并删除所有相关镜像、数据卷
clean:
	$(COMPOSE) down -v --rmi all
	@echo "清理完成：容器、数据卷及本地构建的镜像已删除。"

# 9. 初始化项目 (第一次运行建议执行这个)
init:
	mkdir -p ../data/db
	$(COMPOSE) up -d --build
	@echo "项目已初始化并启动。前端：http://localhost:5173，后端：http://localhost:3000"