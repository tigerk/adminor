import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type {
  OwnerContractIdDto,
  OwnerContractStatusDto,
  OwnerCreateDto,
  OwnerQueryDto,
  OwnerUpdateDto,
  ResponseResultLong,
  ResponseResultOwnerDetailVo,
  ResponseResultPageVoOwnerListVo
} from "@/types/generated";

export const getOwnerContractList = (data?: OwnerQueryDto) => {
  return http.request<ResponseResultPageVoOwnerListVo>("post", baseUrlApi("contract/owner/list"), { data });
};

export const createOwnerContract = (data: OwnerCreateDto) => {
  return http.request<ResponseResultLong>("post", baseUrlApi("contract/owner/create"), { data });
};

export const getOwnerContractDetail = (data: OwnerContractIdDto) => {
  return http.request<ResponseResultOwnerDetailVo>("post", baseUrlApi("contract/owner/detail"), { data });
};

export const updateOwnerContract = (data: OwnerUpdateDto) => {
  return http.request<ResponseResultLong>("post", baseUrlApi("contract/owner/update"), { data });
};

export const updateOwnerContractStatus = (data: OwnerContractStatusDto) => {
  return http.request<ResponseResultLong>("post", baseUrlApi("contract/owner/updateStatus"), { data });
};

export const deleteOwnerContract = (data: OwnerContractIdDto) => {
  return http.request<ResponseResultLong>("post", baseUrlApi("contract/owner/delete"), { data });
};
