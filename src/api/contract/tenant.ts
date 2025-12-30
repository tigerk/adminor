import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type { ApiResponse, PaginationResponse, TenantDetailProps } from "@/types";

/** 获取租客统计 */
export const getTenantTotal = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/tenant/total"), { data });
};

/** 获取租客列表 */
export const getTenantList = (data?: object) => {
  return http.request<ApiResponse<PaginationResponse>>("post", baseUrlApi("contract/tenant/list"), { data });
};

/** 创建租客 */
export const createTenant = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/tenant/create"), { data });
};

/** 更新租客 */
export const updateTenant = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/tenant/update"), { data });
};

/** 删除租客 */
export const deleteTenant = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/tenant/delete"), { data });
};

/** 更新租客状态 */
export const updateTenantStatus = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/tenant/status/update"), { data });
};

/** 获取租客详情 */
export const getTenantDetail = (data?: object) => {
  return http.request<ApiResponse<TenantDetailProps>>("post", baseUrlApi("contract/tenant/detail"), { data });
};

/** 生成租客合同 */
export const generateTenantContract = (data?: object) => {
  return http.request<ApiResponse<string>>("post", baseUrlApi("contract/tenant/contract/generate"), { data });
};

/** 下载租客合同 */
export const downloadTenantContract = (data?: object) => {
  return http.request<Blob>("post", baseUrlApi("contract/tenant/contract/download"), { data }, { responseType: "blob" });
};

/** 更新租客合同签署状态 */
export const updateTenantContractSignStatus = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/tenant/contract/sign/status/update"), { data });
};

/** 删除租客合同 */
export const deleteTenantContract = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/tenant/contract/delete"), { data });
};
