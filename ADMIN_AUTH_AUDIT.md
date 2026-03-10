# Admin 登录 / 会话 / API 审计

更新时间：2026-03-10

## 结论

当前 `heart-plant-admin` 已具备独立后台的基本骨架：
- 路由已拆出
- Supabase Auth 已接入
- 绝大多数后台数据请求都通过 `buildApiHeaders()` 携带会话 token
- 项目可以正常 `npm run build`

但**要真正进入已登录后台页面，仍依赖真实 Supabase 管理员账号会话**。当前仓库内没有管理员账号凭据，无法在不伪造凭据的前提下完成登录验证。

---

## 1. 登录 / 会话链路

### 入口页
- 路由定义：`src/app/App.tsx`
- 登录页：`/admin/login`
- 后台页：`/admin/**`
- 守卫组件：`src/app/components/AdminGuard.tsx`

### 登录动作
文件：`src/app/pages/AdminLogin.tsx`

核心流程：
1. 用户在登录页输入邮箱 + 密码
2. 调用：
   - `supabase.auth.signInWithPassword({ email, password })`
3. 登录成功后，前端基于以下规则判断是否管理员：
   - `user_metadata.role === 'admin'`
   - **或** 邮箱等于 `776427024@qq.com`
4. 满足管理员条件则跳转 `/admin`
5. 不满足则显示“权限不足”

### 会话初始化
文件：`src/app/context/AuthContext.tsx`

核心流程：
- 首次加载时调用 `supabase.auth.getSession()`
- 然后监听 `supabase.auth.onAuthStateChange(...)`
- `isAdmin` 计算逻辑：
  - `state.user?.email === '776427024@qq.com'`
  - 或 `state.user?.user_metadata?.role === 'admin'`

### 路由守卫
文件：`src/app/components/AdminGuard.tsx`

行为：
- `loading=true`：展示校验中状态
- 无 session：跳转 `/admin/login`
- 有 session 但不是 admin：展示“访问权限不足”页
- 有 session 且是 admin：渲染后台内容

---

## 2. Supabase 接入点

### Supabase client
文件：`src/app/utils/supabaseClient.ts`

依赖：
- `utils/supabase/info.tsx`
  - `projectId = dkszigraljeptpeiimzg`
  - `publicAnonKey = sb_publishable_...`

### API 基础层
文件：`src/app/utils/api.ts`

关键行为：
- 本地 `127.0.0.1` 调试时，API 指向：`http://127.0.0.1:8000`
- 其他情况下，API 指向 Supabase Edge Functions：
  - `https://dkszigraljeptpeiimzg.supabase.co/functions/v1/make-server-4b732228`
- `buildApiHeaders()` 会自动附带：
  - `apikey`
  - 如果存在会话：
    - `Authorization: Bearer <token>`
    - `X-User-JWT: <token>`

这意味着：
- **登录只靠 Supabase Auth**
- **后台业务接口权限主要靠会话 token / `X-User-JWT`**

---

## 3. 后台关键 API 集成点

当前后台主要依赖以下接口：

### 植物库
- `GET /library`
- `POST /library`
- `DELETE /library/:id`
- 图片上传：
  - `POST /upload-url`
  - `GET /image-url/:path`

使用页面：
- `src/app/pages/PlantLibrary.tsx`
- `src/app/pages/AddPlant.tsx`
- `src/app/pages/EditPlant.tsx`

### 已认领植物 / 后台视图
- `GET /plants?admin_view=true`

使用页面：
- `src/app/pages/DashboardHome.tsx`
- `src/app/pages/AdoptedPlants.tsx`
- `src/app/pages/Monitoring.tsx`

### 时间线 / 日记
- `GET /plant-timeline/:id`
- `GET /all-journals`
- `GET /journal-detail/:id`
- `POST /journal-feature/:id`
- `DELETE /journal/:id`

使用页面：
- `src/app/pages/PlantTimeline.tsx`
- `src/app/pages/GrowthDiary.tsx`
- `src/app/pages/GrowthDiaryDetail.tsx`

---

## 4. 当前真正的阻塞点

### 阻塞点 A：缺少可用管理员账号凭据
要进入后台，需要真实执行：
- `supabase.auth.signInWithPassword(...)`

但仓库内没有：
- admin 邮箱/密码
- service role（也不该前端持有）
- 任何现成 session

所以当前**无法合法构造管理员 session**。

### 阻塞点 B：管理员判断目前写死在前端
管理员资格目前依赖：
- 固定邮箱 `776427024@qq.com`
- 或 `user_metadata.role === 'admin'`

这说明后续若要稳定交付，最好统一为后端/Supabase claims 驱动，而不是前端硬编码邮箱。

### 阻塞点 C：能否拿到后台数据还依赖后端对 JWT 的校验实现
虽然前端会发送：
- `Authorization`
- `X-User-JWT`

但如果后端函数没有正确校验管理员身份，可能会出现：
- 普通用户也能读 admin 接口
- 或 admin 已登录但仍被接口拒绝

这个需要联动 `heart-plant-api` 仓库核对。

---

## 5. 本次已修复的问题

### 已修复 0：按 API 实际能力为后台页面增加前端降级
对照 `heart-plant-api` 当前实现后，确认以下后台页面原先依赖了尚未落地的接口：
- `PlantLibrary`：尝试 `DELETE /library/:id`，但后端当前只有 `GET /library` 与 `POST /library`
- `AddPlant` / `EditPlant`：尝试 `POST /upload-url` 与 `GET /image-url/:path`，但 API 仓库中未实现
- `GrowthDiaryDetail`：尝试 `POST /journal-feature/:id` 与 `DELETE /journal/:id`，但 API 仓库中未实现

本次已做前端收口：
- 删除/精选/下架操作不再盲打缺失接口，而是直接提示能力未接通
- 新增/编辑植物支持直接填写 `imageUrl`，不再被缺失上传接口卡死
- 列表页增加缺失能力提示，避免管理员误以为是权限或网络故障


### 已修复 1：多处接口路径字符串插值错误
原来若干文件写成了：
- `apiUrl('/library/${id}')`
- `apiUrl('/image-url/${encodeURIComponent(path)}')`
- `apiUrl('/plant-timeline/${id}')`
- `apiUrl('/journal-detail/${id}')`
- `apiUrl('/journal-feature/${id}')`
- `apiUrl('/journal/${id}')`

这种写法不会插值，会直接请求字面量路径，导致接口必错。

现已改为模板字符串。

### 已修复 2：`AdminGuard` 缺少 `ShieldCheck` 导入
该问题会在“非管理员但已登录”分支触发运行时错误。

### 已修复 3：若干页面错误直接引用未定义的 `publicAnonKey`
涉及页面已统一改为通过 `buildApiHeaders()` 构建请求头，避免运行时 `ReferenceError`，也让鉴权逻辑更一致。

---

## 6. 要达到“可进入后台页面”的最小外部条件

需要其中之一：

### 方案 A：提供真实管理员账号
至少提供：
- admin email
- admin password

并满足以下任一条件：
- 邮箱就是 `776427024@qq.com`
- 或该用户 `user_metadata.role = 'admin'`

### 方案 B：在 Supabase 后台确认管理员用户配置
如果已有账号但不能进后台，需要核对：
- Auth 用户是否存在
- 邮箱是否已确认
- `user_metadata.role` 是否为 `admin`
- 是否与前端当前判断逻辑一致

### 方案 C：联动 API 仓库校验后台接口权限
进入后台后，还需要确认这些接口对 admin token 可用：
- `/library`
- `/plants?admin_view=true`
- `/plant-timeline/:id`
- `/all-journals`
- `/journal-detail/:id`
- `/journal-feature/:id`
- `/journal/:id`

---

## 7. 建议的下一步

1. 提供一个真实可登录的 Supabase 管理员账号（或确认现有账号 metadata）
2. 同步检查 `heart-plant-api` 中这些 admin 接口如何校验 `Authorization` / `X-User-JWT`
3. 将“管理员判定”从前端硬编码邮箱，逐步收敛为：
   - 后端 claims / role 校验为准
   - 前端只做展示和路由层兜底
4. 后续可补：
   - `.env.example`
   - `ADMIN_LOGIN_CHECKLIST.md`
   - 与 API 仓库对照的接口验收表
