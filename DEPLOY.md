# 腾讯云部署（与 Leadspace.Alipay 同一台机）

对齐 [alipay-data-agent](../alipay-data-agent) 的上线方式：

| 项 | 值 |
|---|---|
| 访问地址 | https://desk.orblead.com |
| 服务器 | 腾讯云轻量 `43.136.25.181`（SSH 别名 `sales-cloud`） |
| 项目目录 | `/opt/personal-desk` |
| 容器 | `personal-desk-app` → `127.0.0.1:6789` |
| 数据库 | 同容器卷 SQLite（`desk_sqlite`） |
| Nginx | `/etc/nginx/conf.d/desk-orblead.conf` |
| 同机邻居 | `ali.orblead.com`（3001）、`hk.orblead.com`（独立端口） |

## 你要先做的两步

### 1. DNS

腾讯云解析 `orblead.com` 增加：

| 主机记录 | 类型 | 记录值 |
|---------|------|--------|
| `desk` | A | `43.136.25.181` |

### 2. SSH 能登录

本机应能：

```bash
ssh sales-cloud 'echo ok'
```

若 `Permission denied`：把本机 `~/.ssh/id_ed25519.pub` 重新加到服务器 `ubuntu` 用户的 `~/.ssh/authorized_keys`（腾讯云控制台「重置密钥」或网页终端粘贴）。

## 一键部署（本机）

```bash
cd ~/projects/personal-desk
chmod +x deploy/*.sh
./deploy/push-and-deploy.sh
```

首次 HTTPS（DNS 已生效后，在本机）：

```bash
ssh sales-cloud 'cd /opt/personal-desk && ./deploy/setup-ssl.sh'
```

迁移本地真实数据：

```bash
./deploy/migrate-data.sh
```

## 以后更新

```bash
./deploy/push-and-deploy.sh
```

不会覆盖 Docker volume 里的 SQLite / 附图。

## 验收

- [ ] https://desk.orblead.com/login 可开
- [ ] 密码登录成功
- [ ] 待办数据与本地一致（跑过 migrate-data 后）
- [ ] 手机同一网址可用
- [ ] ali.orblead.com / hk.orblead.com 仍正常

## 脚本说明

```
deploy/
├── push-and-deploy.sh              # 本机：build 校验 + rsync + 远程部署
├── server-deploy.sh                # 服务器：docker compose up --build
├── setup-ssl.sh                    # 服务器：certbot + nginx HTTPS
├── migrate-data.sh                 # 本机：上传 SQLite / uploads 进 volume
├── env.production.example
└── nginx/
    ├── desk.orblead.com.http.conf  # 申请证书前
    └── desk.orblead.com.conf       # HTTPS
```
