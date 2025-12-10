.PHONY: help up down logs build clean backend-shell frontend-shell install dev prod-up prod-down

help:
	@echo "Whisper Web - 開発コマンド"
	@echo ""
	@echo "Docker (開発):"
	@echo "  make up              - 全サービスを起動 (開発モード)"
	@echo "  make down            - 全サービスを停止"
	@echo "  make logs            - ログを表示"
	@echo "  make build           - イメージをビルド"
	@echo "  make clean           - コンテナとボリュームを削除"
	@echo ""
	@echo "Docker (本番):"
	@echo "  make prod-up         - 本番モードで起動"
	@echo "  make prod-down       - 本番モードを停止"
	@echo "  make prod-build      - 本番イメージをビルド"
	@echo ""
	@echo "開発:"
	@echo "  make install         - 依存関係をインストール"
	@echo "  make dev             - ローカル開発サーバーを起動"
	@echo "  make backend-shell   - バックエンドコンテナにログイン"
	@echo "  make frontend-shell  - フロントエンドコンテナにログイン"

# Docker commands
up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

build:
	docker-compose build

clean:
	docker-compose down -v --rmi local

# Development
install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

dev:
	@echo "Starting development servers..."
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:3000"
	@(cd backend && uvicorn app.main:app --reload --port 8000) & \
	(cd frontend && npm run dev)

backend-shell:
	docker-compose exec backend bash

frontend-shell:
	docker-compose exec frontend sh

# Testing
test-backend:
	cd backend && pytest

test-frontend:
	cd frontend && npm test

lint:
	cd backend && ruff check .
	cd frontend && npm run lint

# Production Docker
prod-up:
	docker-compose -f docker-compose.prod.yml up -d

prod-down:
	docker-compose -f docker-compose.prod.yml down

prod-build:
	docker-compose -f docker-compose.prod.yml build

prod-logs:
	docker-compose -f docker-compose.prod.yml logs -f
