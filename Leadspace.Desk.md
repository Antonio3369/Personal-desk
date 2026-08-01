# 个人工作台 · 项目参考手册

> Notion 风格的个人知识与业务工作台：**手机快记，电脑整理**。  
> 部署细节见 [DEPLOY.md](./DEPLOY.md)，快速入门见 [README.md](./README.md)，多用户 PRD 见 [docs/PRD-multi-user.md](./docs/PRD-multi-user.md)。

**最后更新**：2026-08-01  
**本地根目录**：`/Users/xin/projects/personal-desk`  
**生产地址**：https://desk.orblead.com

---

## 1. 项目是什么

| 项 | 说明 |
|---|---|
| 产品名 | **个人工作台**（Personal Desk） |
| 定位 | 个人知识与业务工作台（界面体现智能跟进）；多用户隔离，每人一个 Workspace |
| 核心场景 | 待办跟进、城市出差 briefing、人脉维护、笔记沉淀 |
| 双端 | 同一套响应式 Web；手机底部导航 + 电脑侧栏 |
| 数据 | 本地 / 生产均为 **SQLite**（生产在 Docker volume） |

**内容板块**

| 模块 | 路由 | 说明 |
|---|---|---|
| 首页 | `/` | **桌面**：统计卡、进行中列表、该联系的人、最近完成 · **手机**：2×2 统计、今日聚焦、该联系的人（≤3）、更多→笔记 |
| 待办 | `/todos` | 工作/个人、进度、跟进日期、标签、附图、日历 + 列表 |
| 城市 | `/cities`, `/cities/[id]` | 8 城 briefing、问题跟踪、关联待办/人脉/笔记 |
| 人脉 | `/contacts`, `/contacts/[id]` | 列表找人；详情一眼 briefing（未了待办/上次接点/见面注意）+ 关联待办笔记 |
| 笔记 | `/notes` | 学习 / 观点 / 灵感；链接、标签、附图 |
| 快记 | `/capture` | 快速录入待办与笔记（按开通模块显示 Tab） |
| 管理 | `/admin` | 邀请、用户、模块配置、停用账号（admin 角色） |

**已确认约定**

| 约定 | 说明 |
|---|---|
| 城市非必填 | 全局任务、个人事务可不挂城市 |
| 个人 vs 工作 | 一库 + `scope` 字段；视图分开筛 |
| 标签完全自定义 | 用户自写，可重命名/删除 |
| 完成不消失 | 待办完成后归档在「已完成」，日历也显示完成日 |
| 记的时候弱绑定 | 城市/人脉/标签可选；查的时候聚合展示 |
| 手机捕获做减法 | 快记可只写正文或只附图 |

---

## 2. 当前功能状态

### 已完成

**认证与多用户**
- 手机号 + 密码登录（大陆 11 位 / 香港 8 位）
- JWT Session（`personal-desk-session`，30 天，httpOnly）
- 每用户 1 个 Workspace，数据按 `workspaceId` 隔离
- 邀请激活流程；Admin 创建用户、配置模块、停用账号
- 停用用户访问时踢出（`/api/auth/logout?error=disabled`）

**模块化**
- 模块：`dashboard` · `todos` · `cities` · `contacts` · `notes`
- 按 Workspace 开关；城市模块额外权限 `create` / `delete`
- 侧栏/底栏、路由、`Server Actions` 均校验模块启用

**待办**
- 工作/个人；进度（未开始/进行中/等待对方/等合适时机/已完成）
- 下次跟进日期、任务性质、城市/人脉、自定义标签
- 附图（最多 5 张，单张 ≤5MB）；列表内编辑、完成勾选、删除
- 日历：未完成按跟进日、已完成按完成日；琥珀/绿色区分
- 列表主切换：**进行中** | **已完成**
  - 进行中二级：今日 · 本周 · 全部 · 等待对方 · 全局 · 个人
  - 已完成二级：全部 · 近14天 · 工作 · 个人
- 首页「最近完成」+ 已完成统计卡 → `/todos?view=done`

**笔记**
- 学习（链接、平台、抖音口令解析、阅读状态）/ 观点 / 灵感
- 标签、城市/人脉关联、内联编辑、标签管理
- 附图（`NoteImage`）；可只附图无文字

**城市 / 人脉**
- 8 城种子；briefing 问题逐条管理；Leader 外链
- 人脉列表找人；`/contacts/[id]` 详情一眼 briefing（未了待办 / 上次接点 / 见面注意）+ 关联待办与笔记
- 首页「该联系的人」、城市页相关人脉、待办/笔记上的人名均可跳进详情

**图片上传（两步）**
- 客户端先 `POST /api/uploads/{todos|notes}` 上传文件（上传前 **客户端压缩**：长边 ≤1920px，JPEG 质量约 82%）
- 再调 Server Action，只传 `imagePaths` JSON（不传 File，避免 multipart 报错）
- 访问走 `/api/images/{kind}/{filename}`；直接 `/uploads/*` 被 middleware 404
- 待办/笔记附图支持 **应用内灯箱预览**（关闭按钮、Esc、点背景关闭）

**UI / 智能感知（2026-08）**
- 主色 **teal-900**；语义色：进行中=teal、等待对方=琥珀、已完成=绿（今日统计卡保持灰）
- 「已等 X 天」（`waiting` 待办）、「上次联系 X 天前」（人脉）；≥3 天琥珀高亮
- 待办列表状态圆点；卡片轻阴影（`card-surface`）；设计 Token 见 `globals.css`
- 字体：品牌位 **Libre Bodoni** + 系统无衬线（未换 Inter / 香槟金体系）

**手机导航（Phase 2）**
- 底栏 5 格（模块开通时）：**首页 · 待办 · 记录 · 城市 · 人脉**（「记录」始终居中，`/capture`）
- 笔记不在底栏，手机首页 **「更多」** 进入 `/notes`
- 侧栏桌面仍保留全模块 + 底部「快速记录」

**桌面首页**
- 四张语义色 StatCard、进行中列表、该联系的人、最近完成（与 Phase 1 前结构一致，增强视觉与跟进提示）

**手机首页**
- 「今日聚焦」：最多 5 条待办（waiting 逾期/≥3 天 → 今日跟进 → 进行中）
- 「该联系的人」最多 3 人；无「最近完成」长列表

**UI（基础）**
- 素、沉稳；选中态 **teal-900**；Lucide 图标
- 登录页字段 **Password:**；顶栏展示使用者 displayName

### 已知待优化（Backlog）

| 项 | 说明 |
|---|---|
| 登录忽略 `from` 重定向 | 登出后未回到原页面 |
| 模块未启用时静默跳转 | 可改为明确提示 |
| P1 | 待办看板（按责任状态分列） |
| P2 | 数据导出、全文搜索 |
| P3 | AI 摘要 / 智能标签 |

---

## 3. 技术栈

| 层 | 选型 |
|---|---|
| 框架 | Next.js **16.2.10**（App Router，standalone） |
| UI | React 19 · TypeScript 5 · Tailwind CSS 4 |
| 数据库 | **SQLite** + Prisma **6.19.2** |
| 认证 | bcrypt + **jose** JWT Session |
| 图标 / 日期 | lucide-react · date-fns 4 |
| 部署 | Docker + docker-compose + Nginx + Certbot |

---

## 4. 目录结构

```
personal-desk/
├── src/
│   ├── app/
│   │   ├── (app)/              # 主应用（需登录 + workspace）
│   │   │   ├── page.tsx        # 首页
│   │   │   ├── todos/          # 待办
│   │   │   ├── cities/         # 城市
│   │   │   ├── contacts/       # 人脉
│   │   │   ├── notes/          # 笔记
│   │   │   ├── capture/        # 快记
│   │   │   └── layout.tsx
│   │   ├── admin/              # 管理后台（admin 角色）
│   │   ├── actions/            # Server Actions
│   │   ├── api/
│   │   │   ├── uploads/[kind]/ # 图片上传
│   │   │   ├── images/[kind]/[filename]/  # 图片读取
│   │   │   └── auth/logout/
│   │   ├── login/
│   │   └── invite/[token]/
│   ├── components/             # UI 组件
│   ├── lib/                    # 业务逻辑、查询、工具
│   └── middleware.ts           # 登录 / 模块路径 / 拦截 uploads
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                 # 8 城种子
│   ├── migrate-phase1.ts       # 多用户迁移脚本
│   └── migrations/
├── public/uploads/             # todos/ notes/ 本地附图（gitignore）
├── deploy/                     # 部署脚本
├── docs/PRD-multi-user.md
├── Dockerfile
├── docker-compose.prod.yml
├── DEPLOY.md
├── Leadspace.Desk.md           # 本文档
└── README.md
```

---

## 5. 数据模型

```
User ──1:1── WorkspaceMember ──1:1── Workspace
  │                              ├── WorkspaceModule[]   # 模块开关 + 权限
  │                              ├── City[] Contact[] Todo[] Note[] Tag[]
  │                              └── Invite[]
  └── Invite (createdBy / usedBy)

City ── CityIssue[]
Contact ── Todo[] Note[]  (可选 leader of City)
Todo ── TodoTag[] TodoImage[]
Note ── NoteTag[] NoteImage[]
Tag  ── 全 workspace 共享，Todo/Note 多对多
AppSetting  # 遗留 key/value（phase1 后弱用）
```

**关键字段**

| 模型 | 要点 |
|---|---|
| `User` | `phone` 唯一；`role`: admin \| user；`status`: active \| disabled |
| `Todo` | `scope` work/personal；`progress`；`followUpDate`；`completedAt` |
| `Note` | `type` learning/opinion/inspiration；`readStatus`；`link`/`platform` |
| `WorkspaceModule` | `moduleKey` + `enabled` + `permissions` JSON |

迁移：
- `prisma/migrations/20260728120000_phase1_multi_user/`
- `prisma/migrations/20260728130000_note_images/`

---

## 6. 路由与 API

### 页面路由

| 路径 | 说明 |
|---|---|
| `/login` | 手机号 + 密码登录 |
| `/invite/[token]` | 邀请激活 |
| `/` | 首页 Dashboard |
| `/todos` | 待办（`?view=today\|week\|active\|waiting\|global\|personal\|done\|done-recent\|done-work\|done-personal`） |
| `/cities`, `/cities/[id]` | 城市列表 / briefing |
| `/contacts` | 人脉 |
| `/notes` | 笔记（`?type=learning\|opinion\|inspiration`；`?tag=`；`?readStatus=`） |
| `/capture` | 快记（`?type=`） |
| `/admin`, `/admin/users`, `/admin/invites/*` | 管理后台 |

### API

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/uploads/[kind]` | 上传图片（kind: todos \| notes）→ `{ paths }` |
| GET | `/api/images/[kind]/[filename]` | 鉴权后读取图片 |
| GET | `/api/auth/logout` | 清 Session 并重定向登录 |

### Server Actions（`src/app/actions/`）

| 文件 | 职责 |
|---|---|
| `auth.ts` | 登录、改密、退出 |
| `todos.ts` | 待办 CRUD、完成切换 |
| `notes.ts` | 笔记 CRUD、阅读状态 |
| `cities.ts` | 城市与问题 |
| `contacts.ts` | 人脉 |
| `tags.ts` | 标签重命名/删除 |
| `invites.ts` | 邀请创建与激活 |
| `admin-users.ts` | 用户状态、模块配置 |

---

## 7. 认证与隔离

**登录流程**：手机号规范化 → bcrypt 校验 → 写 JWT Cookie

**Session Payload**：`{ userId, role, workspaceId, displayName }`

**Middleware**（`src/middleware.ts`）
- 未登录 → `/login`
- `admin` 只能进 `/admin`，不能进主应用
- 普通用户无 `workspaceId` → 登录页
- `/uploads/*` → 404（强制走 API）

**Workspace 隔离**：所有查询经 `getWorkspaceId()` / `requireUserWorkspace()`，按 session 的 `workspaceId` 过滤。

**模块守卫**：`requireModuleAccess()`（actions）+ `ModuleRouteGuard`（客户端）+ layout 服务端校验。

---

## 8. 图片上传架构

```
[ImageUploadField] 选图
       ↓
uploadImagesFromForm(kind, formData)  →  POST /api/uploads/{kind}
       ↓
saveUploadImages → public/uploads/{kind}/{random}.ext
       ↓
formDataForServerAction + imagePaths JSON
       ↓
createTodoFromFormAction / createNoteFromFormAction ...
       ↓
TodoImage / NoteImage 写库
       ↓
展示：getUploadImageServeUrl → /api/images/{kind}/{filename}
```

**限制**：最多 5 张 · 单张 5MB · JPEG/PNG/WebP/GIF/HEIC

**关键文件**
- `src/lib/upload-images-client.ts` — 客户端两步上传
- `src/lib/upload-images.ts` — 服务端存盘
- `src/lib/upload-image-url.shared.ts` / `upload-image-url-client.ts` — URL 生成（客户端不引 path）
- `src/components/image-upload-field.tsx` — 选图 UI
- `src/components/attachment-image-gallery.tsx` — 展示

---

## 9. 本地开发

```bash
cd ~/projects/personal-desk
npm install
npm run db:setup      # 首次：migrate + 8 城种子
npm run dev           # http://localhost:6789
```

**端口**：6789（3000 留给 alipay）

**多用户迁移（从旧单用户升级）**

```bash
cp deploy/env.migrate.example .env.migrate   # 填手机号/密码
npm run db:migrate-phase1
```

**常用命令**

```bash
npm run build
npm run start
npm run db:seed
npx prisma generate    # schema 变更后必跑
npx prisma studio
```

### 环境变量

| 变量 | 说明 |
|---|---|
| `DATABASE_URL` | `file:./dev.db`（相对 `prisma/`） |
| `SESSION_SECRET` | JWT 签名，生产必改 |
| `APP_PASSWORD` | 遗留文档字段；实际登录用 `User.passwordHash` |
| `DEV_ALLOWED_ORIGIN` | 可选，LAN 手机调试 Server Actions |

### 常见故障

| 现象 | 处理 |
|---|---|
| `/notes` 500 · Unknown field `images` | `npx prisma generate` 后重启 dev |
| 带图保存报 Unexpected end of form | 确认走两步上传，FormData 不含 File |
| 子页面 404（重启后） | 等 Turbopack 编译或删 `.next` 重启 |
| 手机登录无反应 | 检查 `next.config.ts` 的 `serverActions.allowedOrigins` |

### 本地测试账号（示例）

| 账号 | 手机号 | 密码 | 角色 |
|---|---|---|---|
| Antonio | `13714566789` | `desk2026` | user |
| Admin | `13530735013` | `admin2026` | admin |
| Simon | `15989891771` | （邀请激活） | user |

> 以实际数据库为准；迁移模板见 `deploy/env.migrate.example`。

---

## 10. 生产部署

| 项 | 值 |
|---|---|
| 地址 | https://desk.orblead.com |
| 服务器 | 腾讯云 `43.136.25.181`（SSH: `sales-cloud`） |
| 目录 | `/opt/personal-desk` |
| 容器 | `personal-desk-app` → `127.0.0.1:6789` |
| 数据卷 | `desk_sqlite` · `desk_uploads` |
| 兄弟服务 | ali `:3001` · uni `:3002` · hk `:3080` |

```bash
npm run build
./deploy/push-and-deploy.sh
# 首次 SSL
ssh sales-cloud 'cd /opt/personal-desk && ./deploy/setup-ssl.sh'
# 迁移本地数据（慎用，覆盖 volume）
./deploy/migrate-data.sh
```

部署脚本：

| 脚本 | 用途 |
|---|---|
| `deploy/push-and-deploy.sh` | 本地 build + rsync + 远程 Docker |
| `deploy/server-deploy.sh` | 服务器重建容器 |
| `deploy/setup-ssl.sh` | Certbot + Nginx HTTPS |
| `deploy/migrate-data.sh` | 上传 SQLite + uploads |
| `deploy/migrate-phase1.sh` | 多用户 schema + 用户回填 |

---

## 11. 关键文件速查

| 功能 | 文件 |
|---|---|
| 登录 / Session | `actions/auth.ts`, `lib/auth.ts`, `lib/session.ts`, `middleware.ts` |
| 待办视图 / 日历 | `components/todos-workspace.tsx`, `todo-calendar.tsx`, `lib/queries.ts` |
| 待办 CRUD | `actions/todos.ts`, `components/forms.tsx`, `todo-edit-form.tsx` |
| 笔记 | `actions/notes.ts`, `notes-workspace.tsx`, `note-list.tsx`, `note-forms.tsx` |
| 快记 | `capture-workspace.tsx`, `components/forms.tsx` |
| 模块权限 | `lib/modules.ts`, `lib/module-guard.ts`, `lib/module-access.ts`, `lib/workspace-modules.ts` |
| 管理后台 | `app/admin/`, `actions/admin-users.ts`, `actions/invites.ts` |
| 图片 | `lib/upload-images*.ts`, `app/api/uploads/`, `app/api/images/` |
| 导航壳 | `components/ui-shell.tsx`, `app/(app)/layout.tsx` |
| 首页 / 今日聚焦 | `app/(app)/page.tsx`, `lib/today-focus.ts`, `lib/follow-up.ts` |
| 智能提示 UI | `components/follow-up-hint.tsx`, `components/status-dot.tsx` |
| 附图预览 | `components/attachment-image-gallery.tsx` |
| 图片压缩 | `lib/compress-image-client.ts` |
| 部署 | `DEPLOY.md`, `deploy/`, `docker-compose.prod.yml` |

---

## 12. Git 说明

- **勿提交**：`.env`、`prisma/dev.db`、`public/uploads/**`
- **可提交**：`.env.example`、`deploy/env.production.example`、`deploy/env.migrate.example`

---

## 13. 相关文档

| 文档 | 路径 |
|---|---|
| 快速入门 | [README.md](./README.md) |
| 部署手册 | [DEPLOY.md](./DEPLOY.md) |
| 多用户 PRD | [docs/PRD-multi-user.md](./docs/PRD-multi-user.md) |
| 视觉升级方案与落地记录 | [docs/design-upgrade-summary.md](./docs/design-upgrade-summary.md) |
| 需求记录（完整） | `~/Documents/个人工作台/需求记录.md` |

---

*架构或产品约定变更时，请同步更新本文档与 README.md。*
