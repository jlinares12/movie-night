#!/usr/bin/env bash

E2E_COMPOSE="docker compose -p call-time-e2e --env-file .env.e2e -f docker-compose.e2e.yml"

$E2E_COMPOSE --profile e2e run --build --rm --name call-time-playwright playwright playwright test
EXIT=$?

$E2E_COMPOSE down -v

exit $EXIT
