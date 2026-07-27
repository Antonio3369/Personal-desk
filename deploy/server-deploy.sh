#!/usr/bin/env bash
# 在服务器 /opt/personal-desk 目录执行（对齐 alipay server-deploy.sh）
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

if [[ ! -f .env ]]; then
  echo "缺少 .env，请先：cp deploy/env.production.example .env && 编辑 SESSION_SECRET / APP_PASSWORD"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

echo "==> 构建并启动 personal-desk..."
sudo docker compose -f docker-compose.prod.yml up -d --build

echo "==> 部署完成。应用监听 127.0.0.1:6789"
sudo docker compose -f docker-compose.prod.yml ps
