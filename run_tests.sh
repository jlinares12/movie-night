#!/usr/bin/env bash
COMPOSE="docker compose --env-file .env.test -f docker-compose.test.yml"

$COMPOSE build -q >/dev/null 2>&1 \
  || { echo "Build failed — run '$COMPOSE build' to see errors" >&2; exit 1; }

$COMPOSE run --rm test-runner 2>/dev/null
EXIT_CODE=$?

$COMPOSE down --volumes >/dev/null 2>&1
exit $EXIT_CODE
