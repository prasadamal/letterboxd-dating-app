#!/usr/bin/env bash
# Builds two scratch databases that mimic production's refresh_tokens table (with family_id NOT NULL)
# and the repository's older shape (without it), applies the session migrations to each, and runs
# supabase/tests/refresh_tokens.sql. Needs a local Postgres superuser (sudo -u postgres, or PGUSER/PGHOST).
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ -n "${PGUSER:-}" || -n "${PGHOST:-}" ]]; then PSQL=(psql -v ON_ERROR_STOP=1 -X -q); else PSQL=(sudo -u postgres psql -v ON_ERROR_STOP=1 -X -q); fi

build() { # $1 = db name, $2 = extra column line (or empty)
  "${PSQL[@]}" -d postgres -c "drop database if exists $1" -c "create database $1" >/dev/null 2>&1
  "${PSQL[@]}" -d "$1" >/dev/null <<SQL
create extension if not exists pgcrypto;
do \$\$ begin create role service_role nologin; exception when duplicate_object then null; end \$\$;
do \$\$ begin create role anon nologin; exception when duplicate_object then null; end \$\$;
do \$\$ begin create role authenticated nologin; exception when duplicate_object then null; end \$\$;
create table public.users (id uuid primary key default gen_random_uuid(), email text, auth_version integer not null default 0, deleted_at timestamptz, is_active boolean default true);
create table public.refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  $2
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now());
create table public.auth_tokens (id uuid primary key default gen_random_uuid(), user_id uuid references public.users(id), token_hash text, purpose text, consumed_at timestamptz, expires_at timestamptz);
SQL
  "${PSQL[@]}" -d "$1" >/dev/null < supabase/migrations/20261108120000_atomic_auth_sessions.sql
}

echo "• shape 1: production (family_id NOT NULL, no default)"
build rm_fn_prod "family_id uuid not null,"
echo "  before the fix, signing in fails:"
if "${PSQL[@]}" -d rm_fn_prod -At -c "insert into public.users(email) values ('x@example.com'); select public.issue_refresh_token((select id from public.users limit 1), 0, 'h', now()+interval '1 day')" >/dev/null 2>&1; then
  echo "  UNEXPECTED: the old migration already works on this shape"; exit 1
else echo "  (fails as expected)"; fi
"${PSQL[@]}" -d rm_fn_prod >/dev/null < supabase/migrations/20261118120000_refresh_token_family.sql
"${PSQL[@]}" -d rm_fn_prod >/dev/null < supabase/migrations/20261118120000_refresh_token_family.sql   # twice: re-runnable
"${PSQL[@]}" -d rm_fn_prod -At < supabase/tests/refresh_tokens.sql | tail -1

echo "• shape 2: repository definition (no family_id column)"
build rm_fn_repo ""
"${PSQL[@]}" -d rm_fn_repo >/dev/null < supabase/migrations/20261118120000_refresh_token_family.sql
"${PSQL[@]}" -d rm_fn_repo -At < supabase/tests/refresh_tokens.sql | tail -1
echo "all auth function checks passed"
