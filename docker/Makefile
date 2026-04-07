COMPOSE = docker-compose
PROJECT_NAME = my-mern-project

.PHONY: build up down restart shell-server shell-client shell-db logs clean ps

# 1. Build all services without using cache (useful for development to ensure latest changes are included)
build:
	$(COMPOSE) build --no-cache

# 2. Start all services (run in detached mode)
up:
	$(COMPOSE) up -d --build

# 3. Stop and remove containers
down:
	$(COMPOSE) down

# 4. Restart all services (stop and start again)
restart:
	$(COMPOSE) down && $(COMPOSE) up -d

# 5. Access the shell of each service
shell-server:
	$(COMPOSE) exec server bash

shell-client:
	$(COMPOSE) exec client bash

shell-db:
	$(COMPOSE) exec mongodb mongosh

# 6. View real-time logs
logs:
	$(COMPOSE) logs -f

# 7. View container running status
ps:
	$(COMPOSE) ps

# 8. Clean up all containers, volumes, and local images (use with caution)
clean:
	$(COMPOSE) down -v --rmi all
	@echo "All containers, volumes, and local images have been removed. Use 'make up' to start fresh."

# 9. Initialize the project (create necessary directories and start services)
init:
	mkdir -p ../data/db
	$(COMPOSE) up -d --build
	@echo "Project initialized and started. Frontend: http://localhost:5173, Backend: http://localhost:3000"