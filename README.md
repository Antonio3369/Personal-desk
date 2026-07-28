# 个人工作台 (Personal Desk)

个人知识与业务工作台：手机快记，电脑整理。

> 完整项目梳理见 **[Leadspace.Desk.md](./Leadspace.Desk.md)**

## 本地运行

```bash
cd ~/projects/personal-desk
npm install
npm run db:setup   # 首次：迁移 + 种子数据
npm run dev
```

打开 [http://localhost:6789](http://localhost:6789)

**登录**：手机号 + 密码（多用户；详见 [Leadspace.Desk.md](./Leadspace.Desk.md) §9 测试账号）

## 环境变量

复制 `.env.example` → `.env`：

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | 默认 `file:./dev.db`（相对 `prisma/`） |
| `SESSION_SECRET` | 生产务必改成随机串 |
| `APP_PASSWORD` | 登录密码（若已在个人中心改密，以库内 hash 为准） |

## 腾讯云上线（与 Ali 同机）

与 `alipay-data-agent` 相同：`sales-cloud` / `43.136.25.181`，`rsync` + Docker + Nginx。

- 目标：`https://desk.orblead.com`
- 完整步骤：[DEPLOY.md](./DEPLOY.md)

```bash
./deploy/push-and-deploy.sh
ssh sales-cloud 'cd /opt/personal-desk && ./deploy/setup-ssl.sh'
./deploy/migrate-data.sh
```

## 常用命令

```bash
npm run dev
npm run build
npm run start
npm run db:seed
```

## 项目结构

```
src/app/(app)/   主应用
src/app/actions/ Server Actions
src/components/  UI
src/lib/         查询与工具
prisma/          模型与本地 SQLite
deploy/          腾讯云部署脚本（对齐 Ali）
```
