#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Installing locked dependencies…"
npm ci --no-audit --no-fund

if [[ -n "${DATABASE_URL:-}" ]]; then
  if [[ -f "drizzle/meta/_journal.json" ]]; then
    echo "Applying managed Drizzle migrations…"
    npx drizzle-kit migrate
  else
    echo "No managed Drizzle migration journal is present; applying tracked SQL migrations directly."
  fi
  echo "Applying public-form migration…"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f drizzle/0024_public_form_versions.sql
  echo "Applying Clerk portal invitation migration…"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f drizzle/0025_guardian_clerk_portal_invitation.sql
  echo "Applying Academic Year Parent 2 compatibility migration…"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f drizzle/0026_academic_year_parent2_required.sql
  echo "Applying guardian Clerk identity uniqueness migration…"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f drizzle/0027_guardian_clerk_identity_unique.sql
  echo "Publishing a renderable Academic Year public-form compatibility version…"
  npx tsx scripts/upgrade-academic-year-public-form.mts
else
  echo "DATABASE_URL is not configured; skipping database migrations."
fi

echo "Building the application…"
npm run build