import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type { ApiResponse, PaginationResponse } from "@/types";

/** 获取租客列表 */
export const getTenantList = (data?: object) => {
  return http.request<ApiResponse<PaginationResponse>>("post", baseUrlApi("contract/tenant/list"), { data });
};

/** 创建租客 */
export const createTenant = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/tenant/create"), { data });
};
