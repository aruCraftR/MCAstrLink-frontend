#!/usr/bin/env sh
# MCAstrLink 玩家面板前端 启动脚本 (Linux)
# 用法: ./start.sh [port]
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# 读取 .env (若存在) 设置环境变量
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

PORT="${1:-${PORT:-3000}}"
HOST="${HOST:-0.0.0.0}"
export PORT HOST NITRO_HOST="$HOST" NITRO_PORT="$PORT"

echo "启动 MCAstrLink 前端: http://${HOST}:${PORT}"
exec node .output/server/index.mjs
