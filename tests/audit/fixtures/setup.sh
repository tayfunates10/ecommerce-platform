#!/usr/bin/env bash
# Provisions a disposable database and catalog fixture for the usage/UI/UX audit suite.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
: "${DATABASE_URL:?DATABASE_URL must point at a disposable development database}"

# Audit the exact production migration path instead of bypassing migration history.
npm --prefix "$ROOT" run db:migrate:deploy
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$ROOT/tests/audit/fixtures/seed.sql"

mkdir -p "$ROOT/public/media"
cp "$ROOT"/tests/audit/fixtures/media/*.png "$ROOT/public/media/"

echo "Audit fixture ready from committed migrations."
