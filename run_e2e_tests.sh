#!/usr/bin/env bash

E2E_COMPOSE="docker compose -p movie-night-e2e --env-file .env.e2e -f docker-compose.e2e.yml"

$E2E_COMPOSE --profile e2e run --build --rm --name movie-night-playwright playwright playwright test
EXIT=$?

$E2E_COMPOSE down -v

exit $EXIT
