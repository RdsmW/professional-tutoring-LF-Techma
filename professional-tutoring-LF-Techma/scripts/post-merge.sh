#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Installing locked dependencies…"
npm ci --no-audit --no-fund

if [[ -n "${DATABASE_URL:-}" && -f "drizzle/meta/_journal.json" ]]; then
  echo "Applying Drizzle migrations…"
  npx drizzle-kit migrate
elif [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is unavailable; skipping database migrations."
else
  echo "No managed Drizzle migration journal is present; skipping database migrations."
fi

echo "Building the application…"
npm run build