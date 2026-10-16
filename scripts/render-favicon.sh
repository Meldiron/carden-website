#!/bin/bash
# Renders public/favicon.svg (made by scripts/export-lotus.mjs) to public/favicon.png, 64 x 64 on a
# transparent ground, for browsers that do not take SVG favicons. Same headless Chromium as
# scripts/render-og.sh (CHROME=/path overrides).
set -euo pipefail
cd "$(dirname "$0")/.."
CH="${CHROME:-$(ls -d ~/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell 2>/dev/null | tail -1)}"
[ -n "$CH" ] || CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
EXTRA=""; case "$CH" in *headless-shell*) ;; *) EXTRA="--headless=new" ;; esac
TMP="$(mktemp -d)"
printf '<!doctype html><html><head><style>html,body{margin:0;background:transparent}img{display:block;width:512px;height:512px}</style></head><body><img src="file://%s/public/favicon.svg"></body></html>' "$PWD" > "$TMP/favicon.html"
"$CH" $EXTRA --disable-gpu --hide-scrollbars --allow-file-access-from-files --default-background-color=00000000 \
  --window-size=512,712 --force-device-scale-factor=1 --virtual-time-budget=3000 --screenshot="$TMP/favicon.png" "file://$TMP/favicon.html" >/dev/null 2>&1
python3 - "$TMP/favicon.png" public/favicon.png <<'PY'
import sys
from PIL import Image
Image.open(sys.argv[1]).convert("RGBA").crop((0, 0, 512, 512)).resize((64, 64), Image.LANCZOS).save(sys.argv[2], optimize=True)
PY
rm -rf "$TMP"
echo "public/favicon.png"
