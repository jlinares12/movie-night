SERVICE ?=
MSG     ?= migration

DEV_COMPOSE  = docker compose --env-file .env -f docker-compose.dev.yml
PROD_COMPOSE = docker compose --env-file .env.prod -f docker-compose.prod.yml

E2E_COMPOSE  = docker compose -p call-time-e2e --env-file .env.e2e -f docker-compose.e2e.yml --profile e2e
E2E_CONTAINER := call-time-playwright
SPEC_PATH    = e2e/specs/
FILE         ?=

.PHONY: test-backend test-frontend test-e2e test-e2e-file test-e2e-stop test-e2e-report down-e2e test \
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
	./run_e2e_tests.sh

test-e2e-file:
	$(E2E_COMPOSE) run --build --rm --name $(E2E_CONTAINER) playwright playwright test $(SPEC_PATH)$(FILE)

test-e2e-stop:
	docker stop $(E2E_CONTAINER) 2>/dev/null || echo "No test runner currently running"

test-e2e-report:
	npx playwright show-report

down-e2e:
	docker compose -p call-time-e2e --env-file .env.e2e -f docker-compose.e2e.yml down -v

test:
	$(MAKE) test-backend && $(MAKE) test-frontend && $(MAKE) test-e2e

# ── Dev ───────────────────────────────────────────────────────────────────────

dev:
	$(DEV_COMPOSE) up -d --remove-orphans $(SERVICE)

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
	@echo "  test-e2e           Run full e2e suite (build, run, teardown)"
	@echo "  test-e2e-file      Run a single spec  FILE=e2e/specs/auth.spec.ts"
	@echo "  test-e2e-stop      Kill a hanging test runner"
	@echo "  test-e2e-report    Open the HTML report from the last e2e run"
	@echo "  down-e2e           Stop and remove e2e containers and volumes"
	@echo "  test               Run all three test suites in sequence (fail-fast)"
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
