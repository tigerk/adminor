import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type { ApiResponse, PaginationResponse, LeaseBillListVo, LeaseContractVo, LeaseDetailVo, LeaseListVo, TenantQueryDto } from "@/types";

/** 获取租客统计 */
export const getTenantTotal = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/tenant/total"), { data });
};

/** 获取租客列表 */
export const getTenantList = (data?: TenantQueryDto) => {
  return http.request<ApiResponse<PaginationResponse<LeaseListVo>>>("post", baseUrlApi("contract/tenant/list"), { data });
};

/** 创建租客 */
export const createTenant = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/tenant/create"), { data });
};

/** 续签租约 */
export const renewLease = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/tenant/renew"), { data });
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
  return http.request<ApiResponse<LeaseDetailVo>>("post", baseUrlApi("contract/tenant/detail"), { data });
};

/** 获取租客账单列表 */
export const getLeaseBillList = (data?: object) => {
  return http.request<ApiResponse<LeaseBillListVo[]>>("post", baseUrlApi("contract/tenant/bill/list"), { data });
};

/** 获取租客无效账单列表 */
export const getLeaseBillInvalidList = (data?: object) => {
  return http.request<ApiResponse<LeaseBillListVo[]>>("post", baseUrlApi("contract/tenant/bill/invalid/list"), { data });
};

/** 生成租客合同 */
export const generateLeaseContract = (data?: object) => {
  return http.request<ApiResponse<LeaseContractVo>>("post", baseUrlApi("contract/tenant/contract/generate"), { data });
};

/** 下载租客合同 */
export const downloadLeaseContract = (data?: object) => {
  return http.request<Blob>("post", baseUrlApi("contract/tenant/contract/download"), { data }, { responseType: "blob" });
};

/** 更新租客合同签署状态 */
export const updateLeaseContractSignStatus = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/tenant/contract/sign/status/update"), { data });
};

/** 删除租客合同 */
export const deleteLeaseContract = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/tenant/contract/delete"), { data });
};

/** 作废租客 */
export const cancelTenant = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/tenant/cancel"), { data });
};

/** 租客合同预览 */
export const previewLeaseContract = (data?: object) => {
  return http.request<Blob>("post", baseUrlApi("contract/tenant/contract/preview"), { data }, { responseType: "blob" });
};
