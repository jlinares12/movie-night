SERVICE ?=
MSG     ?= migration

DEV_COMPOSE  = docker compose --env-file .env -f docker-compose.dev.yml
PROD_COMPOSE = docker compose --env-file .env.prod -f docker-compose.prod.yml

.PHONY: test-backend test-frontend test-e2e test \
        dev dev-build down logs \
        migrate \
        prod down-prod \
        help

# ── Tests ─────────────────────────────────────────────────────────────────────

test-backend:
	./run_tests.sh

test-frontend:
	./run_frontend_tests.sh

test-e2e:
	@echo "E2E tests are not yet configured." >&2; exit 1

test:
	$(MAKE) test-backend && $(MAKE) test-frontend

# ── Dev ───────────────────────────────────────────────────────────────────────

dev:
	$(DEV_COMPOSE) up -d $(SERVICE)

dev-build:
	$(DEV_COMPOSE) up -d --build $(SERVICE)

down:
	$(DEV_COMPOSE) down

logs:
	$(DEV_COMPOSE) logs -f $(SERVICE)

# ── Database ──────────────────────────────────────────────────────────────────

migrate:
	$(DEV_COMPOSE) exec api flask db migrate -m "$(MSG)"

# ── Prod ──────────────────────────────────────────────────────────────────────

prod:
	$(PROD_COMPOSE) up -d $(SERVICE)

down-prod:
	$(PROD_COMPOSE) down

# ── Help ──────────────────────────────────────────────────────────────────────

help:
	@echo ""
	@echo "Usage: make <target> [SERVICE=<service>]"
	@echo ""
	@echo "Tests"
	@echo "  test-backend       Run backend unit tests (pytest via Docker)"
	@echo "  test-frontend      Run frontend unit tests (Jest via Docker)"
	@echo "  test-e2e           Run e2e tests (not yet configured)"
	@echo "  test               Run backend then frontend tests (fail-fast)"
	@echo ""
	@echo "Dev  (SERVICE= to target a single container: api, frontend, db, ngrok)"
	@echo "  dev                Start dev stack"
	@echo "  dev-build          Rebuild images and start dev stack"
	@echo "  down               Stop dev stack"
	@echo "  logs               Follow dev logs"
	@echo ""
	@echo "Database  (dev stack must be running)"
	@echo "  migrate            Generate a migration (MSG= for message, default: 'migration')"
	@echo "                     Apply: restart the api container (entrypoint runs flask db upgrade)"
	@echo ""
	@echo "Prod  (SERVICE= optional)"
	@echo "  prod               Start prod stack (detached)"
	@echo "  down-prod          Stop prod stack"
	@echo ""
