.PHONY: install dev backend frontend build up down test seed logs smoke

install:
	cd backend && npm install
	cd frontend && npm install

dev:
	@echo "Run backend and frontend in separate terminals: make backend / make frontend"

backend:
	cd backend && npm run start:dev

frontend:
	cd frontend && npm run dev

build:
	cd backend && npm run build
	cd frontend && npm run build

test:
	cd backend && npm test

seed:
	cd backend && npm run seed

smoke:
	@API_KEY=$${API_KEY:-remotefleet-dev-key-2026}; \
	echo "== health =="; curl -sS http://localhost:3001/api/v1/health; echo; \
	echo "== servers (auth) =="; curl -sS -H "x-api-key: $$API_KEY" http://localhost:3001/api/v1/servers; echo; \
	echo "== servers (no auth expect 401) =="; curl -sS -o /tmp/rf-unauth.json -w "%{http_code}" http://localhost:3001/api/v1/servers; echo; cat /tmp/rf-unauth.json; echo

up:
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f

