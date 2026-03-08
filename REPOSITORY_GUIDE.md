# heart-plant-admin 仓库说明文档

## 仓库定位
管理后台仓库，对应植物记后台管理界面。

## 当前职责
- admin 登录
- 仪表盘
- 植物库管理
- 植物新增/编辑
- 认领管理
- 成长日记管理
- 时间线管理
- 操作日志
- 监控与调试页面

## 技术栈
- React 18
- TypeScript
- Vite
- Tailwind CSS

## 目录说明
- `src/app/pages/`：后台页面
- `src/app/components/`：后台/通用组件
- `src/app/context/`：上下文状态
- `src/app/utils/`：API 与工具函数
- `src/styles/`：样式文件

## 开发原则
1. 保持原后台 UI 一致
2. 不改动原有视觉与交互风格
3. 管理端只调用 admin 相关接口
4. 与用户端职责边界清晰分离

## 当前状态
- 已从原单体项目中拆出独立仓库
- 正在清理与用户端无关耦合
- 后续会补充独立 admin 接口适配
