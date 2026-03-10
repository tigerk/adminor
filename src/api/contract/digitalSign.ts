import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type { CompanyDigitalSignCreateDto, CompanyDigitalSignQueryDto, CompanyDigitalSignVo } from "@/types/generated";
import type { ApiListResponse, ApiResponse } from "@/types";

export const getCompanyDigitalSignList = (data?: CompanyDigitalSignQueryDto) => {
  return http.request<ApiListResponse<CompanyDigitalSignVo>>("post", baseUrlApi("contract/digital-sign/list"), { data });
};

export const createCompanyDigitalSign = (data: CompanyDigitalSignCreateDto) => {
  return http.request<ApiResponse<string>>("post", baseUrlApi("contract/digital-sign/create"), { data });
};
