#!/bin/sh
set -e

echo "--- course-service: running migrations ---"
npm run migrate

if [ "$NEED_SEED" = "true" ]; then
  echo "--- course-service: running seeds ---"
  npm run seed
fi

echo "--- course-service: starting ---"
exec "$@"
