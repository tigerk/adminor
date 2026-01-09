// 通用基础类型


/** 分页请求参数 */
export interface PaginationParams {
  currentPage: number; /** 当前页码 */
  pageSize: number; /** 分页大小 */
}

/** 分页响应数据 */
export interface PaginationResponse<T = any> {
  list: T[]; /** 列表数据 */
  total: number; /** 总数量 */
  currentPage: number; /** 当前页码 */
  pageSize: number; /** 分页大小 */
}

/** API 响应包装 code=0 成功 */
export interface ApiResponse<T = any> {
  code: number; /** 状态码 */
  message: string; /** 消息 */
  data: T;
}

/** API 响应包装 */
export interface ApiListResponse<T = any> {
  code: number; /** 状态码 */
  message: string; /** 消息 */
  data?: Array<T>;
}

/** 选项类型（用于下拉框等） */
export interface OptionItem<T = string | number> {
  label: string; /** 标签 */
  value: T; /** 值 */
  disabled?: boolean; /** 是否禁用 */
}
