// 全局类型统一出口

export * from "./common";
export * from "./enums";
export * from "./models";
export * from "./generated";
export * from "./generated/enum.meta";

// ==================== 类型管理原则总结 ====================
/**
 * 【分层原则】
 * 1. common.ts - 通用基础类型（分页、响应包装等）
 * 2. models/ - 业务领域模型（与后端实体对应）
 * 3. api/ - API 接口类型（请求参数、响应数据）
 * 4. 组件内 types.ts - 仅存放该组件特有的类型
 *
 * 【命名规范】
 * 1. 接口使用 PascalCase：interface UserInfo {}
 * 2. 类型别名使用 PascalCase：type UserId = string | number
 * 3. 表单类型后缀 Form：interface LoginForm {}
 * 4. 查询参数后缀 Params：interface UserQueryParams {}
 * 5. 响应数据后缀 Response：interface UserListResponse {}
 *
 * 【判断标准】
 * 类型应该放在全局 types/ 的条件：
 * ✅ 被 3 个以上组件使用
 * ✅ 与后端 API 直接对应
 * ✅ 属于核心业务模型
 * ✅ 需要在不同模块间共享
 *
 * 类型应该放在组件内的条件：
 * ✅ 仅该组件使用
 * ✅ 组件内部状态类型
 * ✅ 组件特有的 Props/Emits 类型
 * ✅ 临时的辅助类型
 *
 * 【重构步骤】
 * 1. 识别重复类型
 * 2. 分析使用范围
 * 3. 提取到对应层级
 * 4. 更新 import 路径
 * 5. 删除重复定义
 * 6. 运行类型检查确保无误
 */
