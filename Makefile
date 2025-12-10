.PHONY: help up down logs build clean backend-shell frontend-shell install dev

help:
	@echo "Whisper Web - 開発コマンド"
	@echo ""
	@echo "Docker:"
	@echo "  make up              - 全サービスを起動"
	@echo "  make down            - 全サービスを停止"
	@echo "  make logs            - ログを表示"
	@echo "  make build           - イメージをビルド"
	@echo "  make clean           - コンテナとボリュームを削除"
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
