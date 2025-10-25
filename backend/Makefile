.PHONY: help install dev dev-services dev-standalone worker test lint format clean docker-build docker-up docker-down

help:
	@echo "Available commands:"
	@echo "  make install           - Install dependencies with uv"
	@echo "  make dev               - Run development server (full stack with Docker)"
	@echo "  make dev-services      - Start only MongoDB and Redis services"
	@echo "  make dev-standalone    - Run API locally (requires dev-services)"
	@echo "  make worker            - Run worker locally"
	@echo "  make test              - Run tests"
	@echo "  make lint              - Run linters"
	@echo "  make format            - Format code"
	@echo "  make clean             - Clean cache and build files"
	@echo "  make docker-build      - Build Docker images"
	@echo "  make docker-up         - Start Docker Compose"
	@echo "  make docker-down       - Stop Docker Compose"

install:
	uv sync --all-extras

dev:
	docker-compose up -d

dev-services:
	@echo "Starting MongoDB and Redis..."
	docker run -d --name reconcraft-mongo -p 27017:27017 mongo:7.0 || docker start reconcraft-mongo
	docker run -d --name reconcraft-redis -p 6379:6379 redis:7-alpine || docker start reconcraft-redis
	@echo "Services started! MongoDB on :27017, Redis on :6379"
	@echo "Run 'make dev-standalone' to start the API"

dev-standalone:
	@echo "Starting API in development mode..."
	@echo "Make sure MongoDB and Redis are running (make dev-services)"
	uv run uvicorn app.main:app --reload --port 8000

worker:
	@echo "Starting worker in development mode..."
	@echo "Make sure MongoDB and Redis are running (make dev-services)"
	uv run python worker.py

test:
	uv run pytest tests/ -v --cov=app --cov-report=html

lint:
	uv run flake8 app --count --select=E9,F63,F7,F82 --show-source --statistics
	uv run flake8 app --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics
	uv run black --check app
	uv run isort --check-only app

format:
	uv run black app tests
	uv run isort app tests

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf .pytest_cache
	rm -rf .coverage
	rm -rf htmlcov
	rm -rf dist
	rm -rf build
	rm -rf .venv

stop-dev-services:
	@echo "Stopping development services..."
	docker stop reconcraft-mongo reconcraft-redis || true
	@echo "Services stopped. Use 'docker rm' to remove them completely."

docker-build:
	docker-compose build

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f
