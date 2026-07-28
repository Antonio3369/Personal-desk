#!/usr/bin/env bash
# Phase 1: apply Prisma migrations + backfill workspace/users
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f "${ROOT}/.env.migrate" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT}/.env.migrate"
  set +a
fi

echo "==> prisma migrate deploy"
npx prisma migrate deploy

echo "==> phase1 data migration"
npx tsx prisma/migrate-phase1.ts

echo "==> done"
