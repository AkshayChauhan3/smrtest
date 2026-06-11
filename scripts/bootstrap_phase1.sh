#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${DB_NAME:-smartrail}"
DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER:-postgres}"
SQL_FILE="${SQL_FILE:-backend/sql/phase1_bootstrap.sql}"

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required but was not found in PATH." >&2
  exit 1
fi

if [ ! -f "$SQL_FILE" ]; then
  echo "SQL bootstrap file not found: $SQL_FILE" >&2
  exit 1
fi

echo "Bootstrapping database '$DB_NAME' using $SQL_FILE ..."
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$SQL_FILE"
echo "Bootstrap complete."
