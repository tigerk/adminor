import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type { CompanySealCreateDto, CompanySealQueryDto, CompanySealVo } from "@/types/generated";
import type { ApiListResponse, ApiResponse } from "@/types";

export const getCompanySealList = (data?: CompanySealQueryDto) => {
  return http.request<ApiListResponse<Array<CompanySealVo>>>("post", baseUrlApi("contract/seal/list"), { data });
};

export const createCompanySeal = (data: CompanySealCreateDto) => {
  return http.request<ApiResponse<string>>("post", baseUrlApi("contract/seal/create"), { data });
};
