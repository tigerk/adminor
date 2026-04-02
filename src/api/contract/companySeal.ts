import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type { ContractSealCreateDto, ContractSealQueryDto, ContractSealVo } from "@/types/generated";
import type { ApiListResponse, ApiResponse } from "@/types";

export const getCompanySealList = (data?: ContractSealQueryDto) => {
  return http.request<ApiListResponse<Array<ContractSealVo>>>("post", baseUrlApi("contract/seal/list"), { data });
};

export const createCompanySeal = (data: ContractSealCreateDto) => {
  return http.request<ApiResponse<string>>("post", baseUrlApi("contract/seal/create"), { data });
};
