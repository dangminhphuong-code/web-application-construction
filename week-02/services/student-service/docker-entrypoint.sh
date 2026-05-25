#!/bin/sh
set -e

echo "--- student-service: running migrations ---"
npm run migrate

if [ "$NEED_SEED" = "true" ]; then
  echo "--- student-service: running seeds ---"
  npm run seed
fi

echo "--- student-service: starting ---"
exec "$@"
