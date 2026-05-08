# AGENTS.md

本文件是 `adminor` 前端项目的长期协作规则。处理 PR、代码改动、排查问题和生成实现方案时，优先遵守这里的约定；如果与更具体的用户指令冲突，以用户当前指令为准。

## 项目定位

`adminor` 是 SaaS 管理端前端，基于 vue-pure-admin-max，使用 Vue 3、TypeScript、Vite、Element Plus、Pinia 和 Vue Router。项目同时保留 Electron 构建能力。

主要技术栈：

- Vue 3.5
- TypeScript 5.9
- Vite 7
- Element Plus
- Pinia
- Vue Router
- @pureadmin/table
- pnpm
- Electron

## 目录边界

常用目录：

- `src/api/`：接口请求封装。
- `src/types/generated/`：OpenAPI 生成类型，不手写业务改动。
- `src/types/models/`：业务领域模型。
- `src/types/index.ts`：全局类型出口。
- `src/views/`：页面和业务视图。
- `src/components/`：可复用组件。
- `src/shared/`：跨页面共享业务片段、样式和工具。
- `src/router/modules/`：业务路由模块。
- `src/store/modules/`：Pinia 状态模块。
- `src/constants/`：业务常量。
- `src/utils/`：通用工具。
- `locales/`：多语言文案。
- `scripts/`：项目脚本，如枚举元信息生成。

硬性规则：

- 不直接编辑 `src/types/generated/` 下的生成文件；需要更新时运行生成流程。
- 不把页面专用逻辑放到全局工具目录。
- 不把全局业务能力塞进单个页面目录。
- 不把 mock、调试代码、临时日志带入正式实现。
- 不提交 `dist/`、`dist-electron/`、`release/`、`.eslintcache`、本地环境产物。

## 包管理与命令

项目强制使用 pnpm。

常用命令：

```bash
pnpm dev
pnpm build
pnpm build:staging
pnpm preview
pnpm typecheck
pnpm lint
pnpm lint:eslint
pnpm lint:prettier
pnpm lint:stylelint
pnpm api:update
```

验证原则：

- TypeScript 或类型相关改动后运行 `pnpm typecheck`。
- 组件、样式、页面逻辑改动后至少运行 `pnpm lint:eslint`，必要时运行 `pnpm lint`。
- 路由、构建配置、依赖、生成类型或全局样式改动后运行 `pnpm build`。
- 依赖后端 OpenAPI 的类型变化用 `pnpm api:update`，该命令依赖本地后端 `http://localhost:8887/v3/api-docs`。
- 无法运行验证命令时，在最终说明中写清楚原因和风险。

## API 与类型

接口封装规则：

- API 文件放在 `src/api/<domain>/` 或既有相近位置。
- 请求统一使用 `http` from `@/utils/http`。
- SaaS 后端路径统一通过 `baseUrlApi("...")` 拼接，当前前缀为 `/api/saas/`。
- API 入参和返回值优先使用 `@/types` 或 `@/types/generated` 中的类型。
- 不在页面里直接写 axios/fetch。
- 不在页面里重复拼后端基础路径。

生成类型规则：

- `src/types/generated/` 由 OpenAPI 生成，`src/types/generated/enum.meta.ts` 由 `scripts/genEnumMeta.ts` 生成。
- 后端枚举变更后，前端优先使用 `EnumMeta` 中的 `code`、`label` 等元信息。
- 只有一个组件使用的临时类型留在组件内。
- 被 3 个以上组件复用、直接对应后端 API 或核心业务模型的类型，应放到 `src/types/` 合适层级。

## Vue 组件约定

- 优先使用 `<script setup lang="ts">`。
- 页面组件使用 `defineOptions({ name: "..." })`，名称应稳定且与路由/业务语义一致。
- 组合式逻辑按现有模式放在同目录 `utils/hook.ts` 或 `utils/hook.tsx`。
- 表格组件统一使用项目封装好的 `PureTable`，不要直接引入其他表格实现。
- 表格分页使用项目现有 `PaginationProps` 和相邻页面模式。
- 弹窗优先使用项目现有 `addDialog`、`ReDialog` 和已有业务弹窗模式。
- 可复用业务组件放到 `src/components/Business/` 或更贴近现有分类的位置。
- 页面内局部组件放在页面目录下的 `components/`、`form/`、`view/` 等子目录。

状态和请求：

- 列表页使用明确的 `loading` 状态，并在 `finally` 中恢复。
- 查询表单提交前 trim 字符串，空值转为 `undefined` 或遵循后端契约。
- 分页参数和返回值类型要与后端契约一致，必要时做 `Number(...)`/`String(...)` 转换。
- 并发请求要明确是否互相依赖；列表和统计可并发时使用 `Promise.all`。
- 操作成功后刷新列表、详情或统计，保持页面状态一致。

## UI 与交互

- 优先沿用相邻页面和 vue-pure-admin 的布局、间距、表格、表单和按钮风格。
- 设计 UI 时使用项目已经配置的样式变量、主题能力和组件样式，必须兼容浅色模式与深色模式。
- SaaS 管理后台以高效、清晰、可扫描为主，不做营销页式布局。
- 表格列要设置合理 `minWidth`、`width`、`showOverflowTooltip` 和对齐方式。
- 金额列右对齐，状态列居中，时间列保持稳定宽度。
- 操作按钮需要结合状态和权限显隐，避免前端暴露不可执行动作。
- 弹窗详情页要处理空值、加载中、失败和关闭后的状态清理。
- 不新增没有业务价值的装饰动画、复杂渐变或大面积视觉噪音。

## 路由、权限与菜单

- 新页面路由放在 `src/router/modules/` 的业务模块中。
- 路由 `name` 必须稳定且唯一。
- 菜单标题和图标沿用现有 meta 结构。
- 权限控制优先沿用现有 `ReAuth`、指令、store 和后端菜单/权限模型。
- 不在前端仅靠隐藏按钮实现安全控制；敏感操作必须依赖后端权限校验。

## 样式规则

- 优先使用 scoped style 或页面已有共享样式。
- 新增样式优先复用项目已配置的颜色、间距、边框、阴影和主题变量，避免写死只适配浅色或深色的颜色。
- 跨页面复用的业务样式放到 `src/shared/<domain>/`。
- 不为单个页面改动全局样式，除非明确需要全局影响。
- 样式要兼容常见桌面宽度，表格页面避免内容互相覆盖。
- 不引入新的 UI 库，除非用户明确要求且项目确实需要。

## Electron 相关

- Web 页面改动通常不需要改 Electron 配置。
- 修改 `electron/`、`dist-electron` 构建链、package build 配置时，必须评估 Web 构建和桌面构建两条路径。
- 不提交构建输出目录。

## PR 与代码改动流程

开始改动前：

- 先查看 `git status --short`，识别用户已有未提交改动。
- 不回滚、不格式化、不移动与任务无关的文件。
- 先读相邻页面、API 和类型定义，沿用现有模式。

实现时：

- 改动范围贴近需求，不做顺手重构。
- 修改接口契约时同步检查 API 封装、生成类型、枚举 meta、页面字段和表格列。
- 修改公共组件前确认调用方，避免破坏旧页面。
- 新增依赖前先确认已有依赖不能满足需求。
- 保持 import 路径使用 `@/` 别名和项目现有排序风格。

提交/交付前：

- 运行与改动范围匹配的 pnpm 验证命令。
- 检查是否误提交生成产物、构建产物或本地缓存。
- 总结行为变化、验证命令和未验证风险。

## Review 重点

Review PR 时优先找这些问题：

- 手写或误改 `src/types/generated/`。
- 页面里直接调用 axios/fetch 或手写基础路径。
- API 类型与后端契约不一致。
- 列表查询未处理分页、loading、空值或刷新。
- 金额、状态、日期展示逻辑硬编码且未使用枚举 meta。
- 操作按钮未按状态/权限限制。
- 公共组件改动影响范围不清。
- 全局样式影响过大。
- 未运行 `typecheck`、`lint` 或构建验证。
