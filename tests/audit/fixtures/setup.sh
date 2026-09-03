#!/usr/bin/env bash
# Provisions a local database and catalog fixture for the usage/UI/UX audit suite.
# Intended for a disposable development database only.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
: "${DATABASE_URL:?DATABASE_URL must point at a disposable development database}"

# The committed migration history does not create the commerce tables (see the
# audit report, BUG-01), so the audit fixture builds the schema from the
# datamodel instead of from prisma/migrations.
npx prisma migrate diff --from-empty --to-schema "$ROOT/prisma/schema.prisma" --script > /tmp/audit-schema.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /tmp/audit-schema.sql

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$ROOT/tests/audit/fixtures/seed.sql"

mkdir -p "$ROOT/public/media"
cp "$ROOT"/tests/audit/fixtures/media/*.svg "$ROOT/public/media/"

echo "Audit fixture ready."
