#!/bin/sh
set -e

echo "--- enrollment-service: running migrations ---"
npm run migrate

if [ "$NEED_SEED" = "true" ]; then
  echo "--- enrollment-service: running seeds ---"
  npm run seed
fi

echo "--- enrollment-service: starting ---"
exec "$@"
