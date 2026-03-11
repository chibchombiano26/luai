SHELL := /bin/bash

COMPOSE_FILE ?= docker-compose.yml
ENV_FILE ?= docker.env
ENV_EXAMPLE_FILE ?= docker.env.example
DOCKER_COMPOSE := docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE)

.PHONY: help init-env check-env up down start stop restart build pull ps logs logs-app config urls clean

help:
	@echo "Targets disponibles:"
	@echo "  make init-env       # Crea $(ENV_FILE) desde el ejemplo"
	@echo "  make up             # Build + up en background"
	@echo "  make down           # Baja contenedores"
	@echo "  make restart        # Reinicia stack"
	@echo "  make build          # Rebuild de imagenes"
	@echo "  make pull           # Descarga imagenes remotas"
	@echo "  make ps             # Estado de servicios"
	@echo "  make logs           # Logs de todo el stack"
	@echo "  make logs-app       # Logs solo de luai"
	@echo "  make config         # Muestra compose resuelto"
	@echo "  make urls           # URLs locales"
	@echo "  make clean          # Down + elimina volumenes anonimos"

init-env:
	@if [ -f "$(ENV_FILE)" ]; then \
		echo "$(ENV_FILE) ya existe."; \
	else \
		cp "$(ENV_EXAMPLE_FILE)" "$(ENV_FILE)"; \
		echo "Creado $(ENV_FILE). Edita secretos antes de levantar."; \
	fi

check-env:
	@if [ ! -f "$(ENV_FILE)" ]; then \
		echo "Falta $(ENV_FILE). Ejecuta: make init-env"; \
		exit 1; \
	fi

up: check-env
	$(DOCKER_COMPOSE) up -d --build

down: check-env
	$(DOCKER_COMPOSE) down

start: up

stop: down

restart: check-env
	$(DOCKER_COMPOSE) down
	$(DOCKER_COMPOSE) up -d

build: check-env
	$(DOCKER_COMPOSE) build

pull: check-env
	$(DOCKER_COMPOSE) pull

ps: check-env
	$(DOCKER_COMPOSE) ps

logs: check-env
	$(DOCKER_COMPOSE) logs -f --tail=200

logs-app: check-env
	$(DOCKER_COMPOSE) logs -f --tail=200 luai

config: check-env
	$(DOCKER_COMPOSE) config

urls:
	@echo "App:      http://localhost:6001"
	@echo "MCP:      http://localhost:6604/sse"
	@echo "Backend externo (Langflow): configura LANGFLOW_API_URL"
	@echo "Node-RED: no aplica en este setup"

clean: check-env
	$(DOCKER_COMPOSE) down -v
