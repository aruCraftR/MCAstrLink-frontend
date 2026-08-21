#!/usr/bin/env bash
# 构建并打包 Linux 版生产包
# 用法: ./scripts/build-linux.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> 安装依赖"
pnpm install --frozen-lockfile

echo "==> Lint"
pnpm run lint

echo "==> Typecheck"
pnpm run typecheck

echo "==> 构建 Nuxt"
pnpm run build

STAGE="$ROOT/.dist-stage"
rm -rf "$STAGE"
mkdir -p "$STAGE"

echo "==> 组装发布包"
cp -r "$ROOT/.output/." "$STAGE/"
cp "$ROOT/deploy/start.sh" "$STAGE/"
cp "$ROOT/deploy/.env.example" "$STAGE/.env.example"
chmod +x "$STAGE/start.sh"

ARCHIVE="$ROOT/mcastrlink-frontend-linux-x64.zip"
rm -f "$ARCHIVE"
cd "$STAGE"
zip -qr "$ARCHIVE" .
cd "$ROOT"
rm -rf "$STAGE"

echo "==> 构建完成: $ARCHIVE"
