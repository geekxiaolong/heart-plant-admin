# heart-plant-admin

植物记三端分离后的管理后台仓库。

## 当前状态
- 当前判断：**可进入真实管理员账号联调**
- 本地构建：`npm run build` 已通过
- 当前主链路已稳定：
  - 管理员登录判定与请求头统一
  - 植物库新增 / 编辑 / 删除后的自动刷新
  - 日记详情 / 精选 / 删除与错误处理
  - Dashboard / 认领视图 / 时间线 payload 兼容

## 启动方式
```bash
npm install
npm run dev
```
默认端口：`3001`

本地开发时，管理端会自动请求 **本机 8000 端口** 的后端（`localhost` / `127.0.0.1`）。若需植物库等接口正常，请先在本仓库同级的 `heart-plant-api` 中启动本地 API（如 `deno task serve` 或项目内说明），确保 `http://127.0.0.1:8000` 可访问。

## 其他常用命令
```bash
npm run build
npm run preview
```

## 仓库职责
- 管理员登录与权限校验
- Dashboard
- 植物库管理
- 认领管理
- 日记详情 / 精选 / 删除
- 时间线与后台运营页面

## 目录摘要
- `src/app/pages/`：后台页面
- `src/app/components/`：组件
- `src/app/context/`：上下文状态
- `src/app/utils/`：API 与工具函数
- `src/styles/`：样式

## 环境变量（可选）
- `VITE_SUPABASE_ANON_KEY`：若出现「Invalid JWT」或植物库/接口 401，可在项目根目录建 `.env` 并设置为本项目在 Supabase 控制台 **Project Settings → API** 中的 **anon public** 密钥（与 `utils/supabase/info.tsx` 中的 key 保持一致或覆盖）。

## 联调前提
后台真实联调仍依赖：
1. 有效管理员测试账号
2. 可用后端 API 环境
3. 若执行写操作与对象存储能力，后端侧需已配置 `SUPABASE_SERVICE_ROLE_KEY`

## 最小人工验收
见根目录：`FINAL_ACCEPTANCE_RUNBOOK.md`
- 管理侧重点：`A1 ~ A4`

## 相关文档
- `USAGE.md`
- `REPOSITORY_GUIDE.md`
- `ADMIN_RELEASE_CHECKLIST.md`
- 根目录 `FINAL_ACCEPTANCE_RUNBOOK.md`
