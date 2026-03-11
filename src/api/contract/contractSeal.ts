import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type { ContractSealCreateDto, ContractSealDeleteDto, ContractSealQueryDto, ContractSealVo } from "@/types/generated";
import type { ApiListResponse, ApiResponse } from "@/types";

export const getContractSealList = (data?: ContractSealQueryDto) => {
  return http.request<ApiListResponse<ContractSealVo>>("post", baseUrlApi("contract/seal/list"), { data });
};

export const createContractSeal = (data: ContractSealCreateDto) => {
  return http.request<ApiResponse<string>>("post", baseUrlApi("contract/seal/create"), { data });
};

export const updateContractSeal = (data: ContractSealCreateDto) => {
  return http.request<ApiResponse<string>>("post", baseUrlApi("contract/seal/update"), { data });
};

export const deleteContractSeal = (data: ContractSealDeleteDto) => {
  return http.request<ApiResponse<boolean>>("post", baseUrlApi("contract/seal/delete"), { data });
};
