#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

API_DIR="$ROOT_DIR/services/api"
WEB_DIR="$ROOT_DIR/apps/web"

if [[ ! -d "$API_DIR" ]]; then
  echo "Missing directory: $API_DIR" >&2
  exit 1
fi

if [[ ! -d "$WEB_DIR" ]]; then
  echo "Missing directory: $WEB_DIR" >&2
  exit 1
fi

echo "Starting API (services/api)…"
(
  cd "$API_DIR"
  npm run dev
) &
API_PID=$!

echo "Starting Web (apps/web)…"
(
  cd "$WEB_DIR"
  npm run dev
) &
WEB_PID=$!

cleanup() {
  echo "\nStopping dev servers…"
  kill "$API_PID" "$WEB_PID" 2>/dev/null || true
  wait "$API_PID" 2>/dev/null || true
  wait "$WEB_PID" 2>/dev/null || true
}

trap cleanup INT TERM EXIT

wait "$API_PID" "$WEB_PID"
