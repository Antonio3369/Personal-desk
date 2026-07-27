#!/usr/bin/env bash
# 从本机把本地 SQLite + 附图导入服务器 Docker volume（对齐 ali 同机部署）
# Usage: bash deploy/migrate-data.sh
set -euo pipefail

SERVER="${DEPLOY_SERVER:-sales-cloud}"
REMOTE_DIR="/opt/personal-desk"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOCAL_DB="${LOCAL_DIR}/prisma/dev.db"
LOCAL_UPLOADS="${LOCAL_DIR}/public/uploads/todos"

if [[ ! -f "${LOCAL_DB}" ]]; then
  echo "本地库不存在: ${LOCAL_DB}"
  exit 1
fi

echo "==> 上传数据库到服务器临时目录"
scp "${LOCAL_DB}" "${SERVER}:${REMOTE_DIR}/dev.db.import"

echo "==> 写入 Docker volume desk_sqlite"
ssh "${SERVER}" "bash -s" <<'REMOTE'
set -euo pipefail
cd /opt/personal-desk
sudo docker compose -f docker-compose.prod.yml stop app || true
# 把文件拷进 volume（通过临时 alpine 容器挂载同名 volume）
sudo docker run --rm \
  -v personal-desk_desk_sqlite:/data \
  -v /opt/personal-desk/dev.db.import:/import/dev.db:ro \
  alpine sh -c "cp /import/dev.db /data/dev.db && chmod 666 /data/dev.db"
sudo docker compose -f docker-compose.prod.yml start app
rm -f /opt/personal-desk/dev.db.import
REMOTE

if ls "${LOCAL_UPLOADS}"/* >/dev/null 2>&1; then
  echo "==> 上传附图"
  ssh "${SERVER}" "mkdir -p ${REMOTE_DIR}/uploads.import && rm -rf ${REMOTE_DIR}/uploads.import/*"
  scp -r "${LOCAL_UPLOADS}/"* "${SERVER}:${REMOTE_DIR}/uploads.import/" || true
  ssh "${SERVER}" "bash -s" <<'REMOTE'
set -euo pipefail
sudo docker run --rm \
  -v personal-desk_desk_uploads:/data \
  -v /opt/personal-desk/uploads.import:/import:ro \
  alpine sh -c "mkdir -p /data && cp -a /import/. /data/ && chmod -R a+rX /data"
rm -rf /opt/personal-desk/uploads.import
REMOTE
fi

echo "==> 完成。打开 https://desk.orblead.com 验收数据"
