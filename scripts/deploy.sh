#!/usr/bin/env bash
# Build the site and deploy it to Appwrite Sites: site "carden-website" in the Carden project
# (appwrite.config.json) -> https://carden-website.appwrite.network. Waits until the new
# deployment is live. Needs the Appwrite CLI signed in to an account with access to the project
# (`appwrite login`).
#   scripts/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."
SITE=carden-website
URL=https://carden-website.appwrite.network
field() { python3 -c "import json,sys; print(json.load(sys.stdin).get('$1', ''))"; }

VITE_SITE_URL=$URL pnpm build
[ -f dist/client/index.html ] || { echo "dist/client/index.html missing" >&2; exit 1; }
ID=$(appwrite sites create-deployment --site-id "$SITE" --code dist/client --activate --json | field '$id')
echo "deployment $ID"
for _ in $(seq 1 90); do
  STATUS=$(appwrite sites get-deployment --site-id "$SITE" --deployment-id "$ID" --json | field status)
  case "$STATUS" in
    ready) echo "live: $URL"; exit 0 ;;
    failed) echo "deployment $ID failed; see the Appwrite console, Sites > $SITE" >&2; exit 1 ;;
    *) sleep 4 ;;
  esac
done
echo "timed out waiting for deployment $ID" >&2
exit 1
