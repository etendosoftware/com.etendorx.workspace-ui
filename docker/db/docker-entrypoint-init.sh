#!/bin/bash
set -e

if [ "$FORCE_INIT_DB" = "true" ]; then
  echo "Forcing PostgreSQL reinitialization..."
  rm -rf /var/lib/postgresql/data/*
fi

exec docker-entrypoint.sh postgres
