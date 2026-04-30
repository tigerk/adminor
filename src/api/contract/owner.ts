import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type {
  OwnerContractAttachmentUpdateDto,
  OwnerContractIdDto,
  OwnerContractCheckoutDto,
  OwnerContractGenerateDto,
  OwnerContractOfflineSignDto,
  OwnerContractSignStatusUpdateDto,
  OwnerContractVoidDto,
  OwnerCreateDto,
  OwnerQueryDto,
  OwnerRenewDto,
  OwnerUpdateDto,
  ResponseResultLong,
  ResponseResultOwnerContractCheckoutInitVo,
  ResponseResultOwnerDetailVo,
  ResponseResultPageVoOwnerListVo
} from "@/types/generated";

export const getOwnerContractList = (data?: OwnerQueryDto) => {
  return http.request<ResponseResultPageVoOwnerListVo>("post", baseUrlApi("contract/owner/list"), { data });
};

export const getOwnerContractTotal = (data?: Partial<OwnerQueryDto>) => {
  return http.request<any>("post", baseUrlApi("contract/owner/total"), { data });
};

export const createOwnerContract = (data: OwnerCreateDto) => {
  return http.request<ResponseResultLong>("post", baseUrlApi("contract/owner/create"), { data });
};

export const getOwnerContractDetail = (data: OwnerContractIdDto) => {
  return http.request<ResponseResultOwnerDetailVo>("post", baseUrlApi("contract/owner/detail"), { data });
};

export const previewOwnerContract = (data: OwnerContractIdDto) => {
  return http.request<Blob>("post", baseUrlApi("contract/owner/preview"), { data }, { responseType: "blob" });
};

export const updateOwnerContract = (data: OwnerUpdateDto) => {
  return http.request<ResponseResultLong>("post", baseUrlApi("contract/owner/update"), { data });
};

export const renewOwnerContract = (data: OwnerRenewDto) => {
  return http.request<ResponseResultLong>("post", baseUrlApi("contract/owner/renew"), { data });
};

export const checkoutOwnerContract = (data: OwnerContractCheckoutDto) => {
  return http.request<ResponseResultLong>("post", baseUrlApi("contract/owner/checkout"), { data });
};

export const getOwnerContractCheckoutInit = (data: OwnerContractIdDto) => {
  return http.request<ResponseResultOwnerContractCheckoutInitVo>("post", baseUrlApi("contract/owner/checkout/init"), { data });
};

export const voidOwnerContract = (data: OwnerContractVoidDto) => {
  return http.request<ResponseResultLong>("post", baseUrlApi("contract/owner/void"), { data });
};

export const updateOwnerContractAttachments = (data: OwnerContractAttachmentUpdateDto) => {
  return http.request<ResponseResultLong>("post", baseUrlApi("contract/owner/contract/attachments/update"), { data });
};

export const generateOwnerContract = (data: OwnerContractGenerateDto) => {
  return http.request<ResponseResultLong>("post", baseUrlApi("contract/owner/contract/generate"), { data });
};

export const updateOwnerContractSignStatus = (data: OwnerContractSignStatusUpdateDto) => {
  return http.request<ResponseResultLong>("post", baseUrlApi("contract/owner/contract/sign/status/update"), { data });
};

export const offlineSignOwnerContract = (data: OwnerContractOfflineSignDto) => {
  return http.request<ResponseResultLong>("post", baseUrlApi("contract/owner/contract/offline-sign"), { data });
};
