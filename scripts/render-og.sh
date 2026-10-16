#!/bin/bash
# Renders scripts/og/og.html to public/og.png (1200 x 630, the share thumbnail) with a headless
# Chromium: Playwright's headless shell, or Google Chrome (CHROME=/path overrides).
set -euo pipefail
cd "$(dirname "$0")/.."
CH="${CHROME:-$(ls -d ~/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell 2>/dev/null | tail -1)}"
[ -n "$CH" ] || CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
EXTRA=""; case "$CH" in *headless-shell*) ;; *) EXTRA="--headless=new" ;; esac
TMP="$(mktemp -d)"
"$CH" $EXTRA --disable-gpu --hide-scrollbars --allow-file-access-from-files --window-size=1200,830 \
  --force-device-scale-factor=1 --virtual-time-budget=6000 --screenshot="$TMP/og.png" "file://$PWD/scripts/og/og.html" >/dev/null 2>&1
python3 - "$TMP/og.png" public/og.png <<'PY'
import sys
from PIL import Image
Image.open(sys.argv[1]).convert("RGB").crop((0, 0, 1200, 630)).save(sys.argv[2], optimize=True)
PY
rm -rf "$TMP"
echo "public/og.png"
