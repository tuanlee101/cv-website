#!/usr/bin/env bash
# Sinh assets/og-image.png (1200×630) từ tools/og-template.html bằng Chrome headless.
# Dùng: ./tools/make-og-image.sh   (chạy từ thư mục gốc cv-website)
set -euo pipefail

cd "$(dirname "$0")/.."
OUT="assets/og-image.png"

if [ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
  CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
elif command -v google-chrome >/dev/null 2>&1; then
  CHROME="$(command -v google-chrome)"
elif command -v chromium >/dev/null 2>&1; then
  CHROME="$(command -v chromium)"
else
  echo "Không tìm thấy Chrome/Chromium. Cài Chrome hoặc tự xuất ảnh 1200×630 từ tools/og-template.html." >&2
  exit 1
fi

rm -f "$OUT"

"$CHROME" --headless=new --disable-gpu --no-first-run --hide-scrollbars \
  --window-size=1200,630 --screenshot="$PWD/$OUT" \
  --user-data-dir="$(mktemp -d)" \
  --virtual-time-budget=4000 \
  "file://$PWD/tools/og-template.html" &
CHROME_PID=$!

# Chrome headless --screenshot đôi khi không tự thoát → chờ file rồi kill
for _ in $(seq 1 40); do
  [ -s "$OUT" ] && break
  sleep 0.5
done
kill "$CHROME_PID" 2>/dev/null || true
wait "$CHROME_PID" 2>/dev/null || true

if [ -s "$OUT" ]; then
  python3 -c "import struct;d=open('$OUT','rb').read(33);w,h=struct.unpack('>II',d[16:24]);print('Đã tạo $OUT — %dx%d'%(w,h))"
else
  echo "Không tạo được $OUT — kiểm tra Chrome." >&2
  exit 1
fi
