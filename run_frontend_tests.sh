#!/usr/bin/env bash
IMAGE="movie-night-frontend-tests"

docker build -f Dockerfile.test.frontend -t $IMAGE . -q >/dev/null 2>&1 \
  || { echo "Build failed — run 'docker build -f Dockerfile.test.frontend -t $IMAGE .' to see errors" >&2; exit 1; }

docker run --rm $IMAGE
EXIT_CODE=$?
exit $EXIT_CODE
