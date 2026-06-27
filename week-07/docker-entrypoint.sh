#!/bin/sh
set -e

echo "--- Running Migrations ---"
npm run migrate

if [ "$NEED_SEED" = "true" ]; then
  echo "--- Running Seeds ---"
  npm run seed
fi

echo "--- Starting Express Server ---"
exec "$@"