// 通用基础类型
/** 分页请求参数 */
export interface PaginationParams {
  currentPage: number;
  pageSize: number;
}

/** 分页响应数据 */
export interface PaginationResponse<T> {
  list: T[];
  total: number;
  currentPage: number;
  pageSize: number;
}

/** API 响应包装 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

/** API 响应包装 */
export interface ApiListResponse<T = any> {
  code: number;
  message: string;
  data?: Array<T>;
}

/** 选项类型（用于下拉框等） */
export interface OptionItem<T = string | number> {
  label: string;
  value: T;
  disabled?: boolean;
}
