#!/usr/bin/env bash
# 在服务器执行：DNS 生效后申请 SSL 并启用 Nginx（对齐 alipay setup-ssl.sh）
set -euo pipefail

DOMAIN="desk.orblead.com"
APP_DIR="/opt/personal-desk"
TARGET_IP="43.136.25.181"

if ! dig +short "${DOMAIN}" A | grep -q "${TARGET_IP}"; then
  echo "DNS 尚未指向 ${TARGET_IP}：请先在腾讯云为 ${DOMAIN} 添加 A 记录"
  echo "当前解析：$(dig +short "${DOMAIN}" A || true)"
  exit 1
fi

echo "==> 安装 HTTP 反代（申请证书前）..."
sudo cp "${APP_DIR}/deploy/nginx/desk.orblead.com.http.conf" /etc/nginx/conf.d/desk-orblead.conf
sudo nginx -t
sudo systemctl reload nginx

echo "==> 申请 Let's Encrypt 证书..."
sudo certbot certonly --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m admin@orblead.com || \
sudo certbot certonly --webroot -w /var/www/html -d "${DOMAIN}" --non-interactive --agree-tos -m admin@orblead.com

echo "==> 安装 HTTPS Nginx 配置..."
sudo cp "${APP_DIR}/deploy/nginx/desk.orblead.com.conf" /etc/nginx/conf.d/desk-orblead.conf
sudo nginx -t
sudo systemctl reload nginx

echo "==> HTTPS 已启用：https://${DOMAIN}"
