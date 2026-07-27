#!/usr/bin/env bash
# 从本机执行：同步代码到 sales-cloud 并部署（对齐 alipay-data-agent）
set -euo pipefail

SERVER="${DEPLOY_SERVER:-sales-cloud}"
REMOTE_DIR="/opt/personal-desk"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> 本地构建校验"
cd "${LOCAL_DIR}"
npm run build

echo "==> 同步代码到 ${SERVER}:${REMOTE_DIR}"
rsync -avz --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  --exclude '.env*' \
  --exclude 'prisma/dev.db*' \
  --exclude 'public/uploads/todos/*' \
  --exclude 'dev.db' \
  "${LOCAL_DIR}/" "${SERVER}:${REMOTE_DIR}/"

echo "==> 检查服务器 .env"
ssh "${SERVER}" "bash -s" <<'REMOTE'
set -euo pipefail
cd /opt/personal-desk
if [[ ! -f .env ]]; then
  SESSION_SECRET=$(openssl rand -base64 32)
  cat > .env <<EOF
SESSION_SECRET=${SESSION_SECRET}
APP_PASSWORD=desk2026
EOF
  echo "已生成 .env（请尽快修改 APP_PASSWORD）"
fi
REMOTE

echo "==> 远程构建并启动..."
ssh "${SERVER}" "cd ${REMOTE_DIR} && chmod +x deploy/*.sh && ./deploy/server-deploy.sh"

echo "==> 完成。"
echo "    DNS: desk.orblead.com -> 43.136.25.181"
echo "    首次 SSL: ssh ${SERVER} 'cd ${REMOTE_DIR} && ./deploy/setup-ssl.sh'"
echo "    迁移本地数据: bash deploy/migrate-data.sh"
