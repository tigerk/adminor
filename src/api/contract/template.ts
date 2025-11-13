import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type { ApiResponse, PaginationResponse } from "@/types";

/** 获取合同模板列表 */
export const getContractTemplateList = (data?: object) => {
  return http.request<ApiResponse<PaginationResponse>>("post", baseUrlApi("contract/template/list"), { data });
};

/** 更新合同模板状态 */
export const updateContractTemplateStatus = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/template/status/update"), { data });
};

/** 创建合同模板 */
export const createContractTemplate = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/template/create"), { data });
};

/** 删除合同模板 */
export const deleteContractTemplate = (data?: object) => {
  return http.request<ApiResponse>("post", baseUrlApi("contract/template/delete"), { data });
};

/** 预览合同模板 */
export const previewContractTemplate = (data?: object) => {
  return http.request<any>("post", baseUrlApi("contract/template/preview"), { data });
};
