#!/usr/bin/env bash
# Reconstruye la base desde el repositorio en un Postgres vacío y corre la demo.
# Es la prueba de B-04: si termina sin errores, la base es reproducible.
#
# Uso: DATABASE_URL=postgres://postgres@localhost:5432/postgres scripts/db-verify.sh
#      (crea y borra la base temporal rw_verify)
# Requiere psql y, en el servidor, la extensión pgvector.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ADMIN_URL="${DATABASE_URL:-postgres://postgres@localhost:5432/postgres}"
DB="rw_verify"
VERIFY_URL="${ADMIN_URL%/*}/${DB}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

psql "$ADMIN_URL" -qAt -c "DROP DATABASE IF EXISTS ${DB}" -c "CREATE DATABASE ${DB}"
SERVER_MAJOR="$(psql "$VERIFY_URL" -qAt -c "SHOW server_version_num" | cut -c1-2)"
HAS_CRON="$(psql "$VERIFY_URL" -qAt -c "SELECT count(*) FROM pg_available_extensions WHERE name = 'pg_cron'")"

echo "→ Piezas de Supabase (stubs)"
psql "$VERIFY_URL" -q -v ON_ERROR_STOP=1 -f "$ROOT/supabase/tests/supabase_stubs.sql" >/dev/null

for f in "$ROOT"/supabase/migrations/*.sql; do
  name="$(basename "$f")"
  cp "$f" "$TMP/$name"
  # Fuera de Supabase no hay pg_net ni pg_cron: los stubs los simulan.
  [ "$HAS_CRON" = "0" ] && sed -i '/CREATE EXTENSION IF NOT EXISTS pg_cron/d; /CREATE EXTENSION IF NOT EXISTS pg_net/d' "$TMP/$name"
  # El privilegio MAINTAIN existe desde Postgres 17.
  if [ "$SERVER_MAJOR" -lt 17 ]; then
    sed -i -E 's/MAINTAIN, //; s/, MAINTAIN//; /^GRANT MAINTAIN ON /d' "$TMP/$name"
  fi
  echo "→ $name"
  psql "$VERIFY_URL" -q -v ON_ERROR_STOP=1 -f "$TMP/$name" >/dev/null
done

echo "→ seed.sql (demo)"
psql "$VERIFY_URL" -q -v ON_ERROR_STOP=1 -f "$ROOT/supabase/seed.sql" >/dev/null 2>&1

psql "$VERIFY_URL" -qAt -F ' ' -c "
  SELECT 'tablas', count(*) FROM pg_tables WHERE schemaname = 'public'
  UNION ALL SELECT 'políticas', count(*) FROM pg_policies WHERE schemaname = 'public'
  UNION ALL SELECT 'pedidos demo', count(*) FROM public.restaurant_orders
  UNION ALL SELECT 'trabajos cron', count(*) FROM cron.job"

psql "$ADMIN_URL" -qAt -c "DROP DATABASE ${DB}"
echo "OK: la base se reconstruye desde el repositorio."
