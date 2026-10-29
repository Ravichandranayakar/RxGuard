.PHONY: setup dev test test-backend test-frontend test-chaincode migrate seed-demo docker-up docker-down clean

setup:
	@echo "Setting up local environments..."
	cp -n .env.example .env || true

dev:
	docker compose up --build

docker-up:
	docker compose up -d

docker-down:
	docker compose down -v

test: test-backend test-chaincode

test-backend:
	cd backend && pytest tests/ -v

test-frontend:
	cd frontend && npm test

test-chaincode:
	cd chaincode/prescription && go test -v ./...

migrate:
	cd backend && alembic upgrade head

seed-demo:
	cd backend && python scripts/seed_demo.py

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
