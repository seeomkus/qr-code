#!/usr/bin/env sh
# Pengelola SeeOmKus QR untuk Linux/macOS. Contoh: ./qr.sh start
cd "$(dirname "$0")" || exit 1
command -v node >/dev/null 2>&1 || { echo "[ERROR] Node.js belum terpasang (butuh versi 20+)."; exit 1; }
exec node scripts/manage.mjs "$@"
