# Personal Desk · 多用户模块化 PRD 汇总

> 本文档汇总 2026-07-28 产品探讨结论，供 Phase 1 开工前查阅。  
> 部署见 [DEPLOY.md](../DEPLOY.md)，现状见 [Leadspace.Desk.md](../Leadspace.Desk.md)。

**状态**：Phase 2 已完成（邀请开户 + Admin 后台 MVP）  
**最后更新**：2026-07-28

---

## 1. 产品定位（变更）

| 项 | 现状（v0） | 目标（v1） |
|---|---|---|
| 定位 | Antonio 个人单密码工具 | **给每个人一套独立应用**（Multi-instance personal desk） |
| 用户 | 无账号，全局密码 | 手机号账号，管理员邀请开户 |
| 数据 | 全局一份 SQLite | **完全隔离**，每人一个 workspace（用户不感知「台」） |
| 模块 | 全员固定五模块 | **管理员配置**开/关；城市模块另有增减子权限 |
| 页头 | 固定 Antonio | **强调「谁」**：用户自设 `displayName` |
| 产品名 | Personal Desk | **始终英文** Personal Desk |

**不做**：团队协作 SaaS、跨工作台数据共享、模块别名（如「人脉→同事介绍」）。

---

## 2. 核心概念

```text
Administrator（你）
  └── 发邀请 / 编辑用户
        └── 为用户创建独立 Workspace（仅后台概念，不对用户展示）
              ├── 独立数据（待办 / 城市 / 人脉 / 笔记）
              ├── 模块配置（开/关 + 城市增减权限）
              └── 用户以 displayName 使用（如 Antonio）
```

| 概念 | 用户是否感知 | 说明 |
|---|---|---|
| User | 是 | 手机号登录，displayName 展示 |
| Workspace | **否** | 数据隔离容器，1 用户 1 workspace |
| Module | 部分感知 | 只看到被开启的 Tab，名称固定 |
| Invite | 激活前 | 一次性链接，7 天默认过期 |

**数据隔离**：工作台之间**完全不互通**。同一人若未来有两个 workspace，切换即换一套数据（MVP 为 1:1，不做切换 UI）。

**配置模型**：「工作台默认 + 用户覆盖」；在 1:1 场景下等价于**对该用户的模块配置**。

---

## 3. 身份与账号

### 3.1 字段规则

| 字段 | 规则 | 用途 |
|---|---|---|
| `phone` | **全局唯一**，归一化存储 | 登录、Admin 区分用户 |
| `phoneRegion` | `CN` \| `HK` | 展示区号 |
| `displayName` | **可重复**，1–20 字 | 页头大字，强调「谁」 |
| `password` | 用户自设，无短信 | 登录 |
| Personal Desk | 固定英文 | 产品名 |

### 3.2 手机号格式

| 地区 | 用户输入 | 入库 `phone` |
|---|---|---|
| 大陆 | `13812345678`（11 位） | `13812345678` |
| 香港 | `91234567`（8 位） | `85291234567` |

- **不接短信验证码**（MVP）
- 登录：手机号 + 密码
- 错误提示：账号不存在与密码错误**同文案**（不暴露是否已注册）

### 3.3 角色

| 角色 | 说明 |
|---|---|
| `admin` | 发邀请、编辑用户模块、停用账号；**无** workspace |
| `user` | 使用自己的 desk；**不能**自改模块 |

---

## 4. 开户：邀请链接

### 4.1 流程

```text
Admin 发邀请（必填手机号 + 模块配置）
  → 系统预建空 Workspace + Invite
  → Admin 复制链接发给用户
  → 用户打开 /invite/[token]
  → 确认手机号（只读）+ 设 displayName + 密码
  → 自动登录进入首页
```

### 4.2 邀请规则

- Token 随机、**一次性**、可过期（默认 **7 天**，可选 3/7/14/30）
- 重新生成邀请 → 旧链接作废
- 激活前**不创建 User**；列表状态为「待激活」，显示名为「—」
- 手机号在发邀请时**必填**，激活页不可改

---

## 5. 模块体系

### 5.1 模块列表（名称固定，不可 alias）

| moduleKey | 路由 | 显示名 |
|---|---|---|
| `dashboard` | `/` | 首页 |
| `todos` | `/todos` | 待办 |
| `cities` | `/cities` | 城市 |
| `contacts` | `/contacts` | 人脉 |
| `notes` | `/notes` | 笔记 |

管理员只配置 **开/关**，不改显示名。

### 5.2 城市模块子权限（方案 C，已确认）

```text
☑ 城市
   ├─ ☑ 允许新增城市
   └─ ☑ 允许删除城市
```

| 模块 | 新增 | 删除 | 行为 |
|---|---|---|---|
| 关 | — | — | 无城市功能 |
| 开 | 开 | 开 | 完整能力（**默认**） |
| 开 | 开 | 关 | 能加不能删 |
| 开 | 关 | 开 | 不能加，能删 |
| 开 | 关 | 关 | 仅用已有城市，不能改列表 |

- **不做**管理员配固定城市清单
- Antonio 迁移后：模块开 + 增减全开，8 城原样保留
- 新用户：若开城市且未改子权限，默认增减全开；空 workspace 自行建城

### 5.3 运行时

- 动态导航：仅显示已启用模块
- 路由守卫：禁用模块 URL 不可访问
- 配置变更：下次刷新或重新登录生效（MVP 无推送）

---

## 6. 界面线框摘要

### 6.1 用户侧

**登录页**

```text
Personal Desk（英文小字）
[ 大陆+86 ▼ ] [ 手机号 ]
Password: [ •••••••• ]
[ 进入工作台 ]
```

**激活页**（有效邀请）

```text
Personal Desk
激活你的账号
手机号（只读，含区号）
你的名字 * → displayName
设置密码 / 确认密码
[ 完成激活 ]
```

**登录后页头**

```text
Personal Desk（英文小字）
Antonio（displayName 大字）
```

### 6.2 Admin 侧

**导航**：用户管理 · 发邀请 · （我的账号）

**用户列表**：手机号（主标识）· 显示名 · 模块摘要 · 状态 · 编辑

**发邀请** `/admin/invites/new`

- 地区 + 手机号（必填）
- 模块勾选 + 城市子权限
- 有效期（默认 7 天）
- 生成后同页展示链接 + 复制

**编辑用户**

| 状态 | 要点 |
|---|---|
| 待激活 | 邀请链接、重生成、撤销；模块可改 |
| 使用中 | 手机号/显示名只读；保存模块；停用 |
| 已停用 | 配置只读；重新启用 |

**Admin 不改** displayName（用户自设）。

---

## 7. 数据模型

### 7.1 新增表

**User**

- `id`, `phone` (unique), `phoneRegion`, `displayName`, `passwordHash`
- `role` (`admin`|`user`), `status` (`active`|`disabled`)
- `createdAt`, `updatedAt`, `lastLoginAt?`

**Workspace**

- `id`, `status`, `createdAt`, `updatedAt`
- **无**对外 `name`（不强调「台」）

**WorkspaceMember**

- `workspaceId`, `userId` (unique，强制 1:1), `role` (`owner`)

**Invite**（Phase 2 启用，表可先建）

- `token` (unique), `phone`, `phoneRegion`, `workspaceId`
- `createdById`, `expiresAt`, `usedAt?`, `usedByUserId?`

**WorkspaceModule**（Phase 3 启用，表可先建）

- `workspaceId`, `moduleKey`, `enabled`
- `permissions` — JSON 如 `["create","delete"]`（仅 cities 使用）

### 7.2 现有表改动

以下表增加 `workspaceId`（NOT NULL，迁移后）：

- `City`, `Contact`, `Todo`, `Note`, `Tag`

唯一约束变更：

- `City.name` → `@@unique([workspaceId, name])`
- `Tag.name` → `@@unique([workspaceId, name])`

**AppSetting**：废弃 `password_hash` 登录用途。

### 7.3 JWT 载荷

```json
{
  "userId": "cuid",
  "workspaceId": "cuid | null",
  "role": "admin | user"
}
```

---

## 8. Phase 1 迁移策略

### 8.1 目标

将现有 Antonio 单租户数据迁入 **1 个 legacy workspace**，不丢数据。

### 8.2 原则

1. 先备份 DB + uploads，停服迁移  
2. `workspaceId` 先 nullable → 回填 → NOT NULL  
3. 脚本幂等、事务包裹  
4. 敏感信息走环境变量（`MIGRATE_*`）

### 8.3 迁移环境变量

| 变量 | 用途 |
|---|---|
| `MIGRATE_ADMIN_PHONE` / `_REGION` / `_PASSWORD` | 管理员账号 |
| `MIGRATE_OWNER_PHONE` / `_REGION` / `_PASSWORD` | Antonio 用户 |
| `MIGRATE_OWNER_DISPLAY_NAME` | 默认 `Antonio` |

### 8.4 脚本步骤（`prisma/migrate-phase1.ts`）

1. 若已迁移则跳过  
2. 创建 Workspace + Owner User + WorkspaceMember  
3. 全部业务表 `workspaceId = legacy workspace`  
4. WorkspaceModule 五模块全开 + cities `create,delete`  
5. 创建 admin User（无 member）  
6. 校验计数与关联；删除 `AppSetting.password_hash`  

### 8.5 附图

Phase 1 **不改**磁盘路径；靠 `Todo.workspaceId` 隔离。新上传分目录可 Phase 2+。

### 8.6 回滚

恢复备份 `dev.db` + uploads，回退镜像。

---

## 9. 实施分期

| 阶段 | 内容 | 验收 |
|---|---|---|
| **Phase 1** | User/Workspace/Member；业务表 workspaceId；手机登录；迁移脚本 | 两用户互不可见数据 |
| **Phase 2** | Invite 表 + 发邀请页 + 激活页 | Admin 发链接，用户激活可用 |
| **Phase 3** | WorkspaceModule + 动态导航 + 路由守卫 + 城市子权限 | 关模块不可达；增减生效 |
| **Phase 4** | Admin 用户列表 + 编辑用户 + 停用/撤销 | 全程后台可运营 |

**Dockerfile 调整**：生产 CMD 用 `prisma migrate deploy`，避免每次 `db push` 冲迁移。

---

## 10. 已确认决策清单

- [x] 完全隔离，不给个人做应用之间的数据互通  
- [x] 用户不感知「工作台」，页头强调 displayName  
- [x] 管理员邀请链接开户，手机号必填  
- [x] 手机号登录，大陆 11 位 / 香港 852+8 位，无短信  
- [x] displayName 可重复，Admin 用 phone 区分  
- [x] Personal Desk 产品名始终英文  
- [x] 模块名固定，不做 alias  
- [x] 城市：模块开关 + 新增/删除子权限（方案 C）  
- [x] 工作台默认 + 用户覆盖（1:1 下即 per-user 配置）  
- [x] Antonio 迁移：8 城保留，城市增减默认全开  

---

## 11. 待定 / 第二期

- Admin 重置密码流程  
- 登录/激活短信验证  
- 模块快捷模板（全套 / 无城市 / 仅待办+笔记）  
- 新上传按 `uploads/{workspaceId}/` 分目录  
- Admin 移动端完整编辑  
- `UserModuleOverride` 表（若出现 1 用户多 workspace）  

---

## 12. 相关文件（现状 v0）

| 路径 | 说明 |
|---|---|
| `prisma/schema.prisma` | 待扩展 User/Workspace 等 |
| `src/lib/session.ts` | 待扩展 JWT 载荷 |
| `src/components/ui-shell.tsx` | 待改动态导航 |
| `src/middleware.ts` | 待扩展路由守卫 |
| `deploy/migrate-data.sh` | 整库替换（迁移后库须为新 schema） |

---

## Phase 1 本地迁移

1. 复制 `deploy/env.migrate.example` → `.env.migrate`，填入真实手机号与密码  
2. 备份 `dev.db`  
3. 若库由 `db push` 创建、未走过 migrate：  
   `npx prisma migrate resolve --applied 20260716084142_init`  
4. `npm run db:migrate-phase1`（= migrate deploy + 数据回填）  
5. 使用 `.env.migrate` 中的 **owner 手机号 + 密码** 登录  

生产环境：停服 → 备份 volume → 同上（在容器或挂载 volume 上执行）→ 启服。

---

| 文档 | 内容 |
|---|---|
| [Leadspace.Desk.md](../Leadspace.Desk.md) | v0 现状与模块说明 |
| [DEPLOY.md](../DEPLOY.md) | 生产部署 |
| **本文档** | v1 多用户模块化 PRD |
