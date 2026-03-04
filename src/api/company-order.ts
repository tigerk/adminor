import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type {
  CompanyConsumePageDto,
  CompanyOrderCreateDto,
  CompanyOrderPageDto,
  ResponseResultBoolean,
  ResponseResultListCompanyProductOrderVo,
  ResponseResultPageVoCompanyConsumeRecordVo,
  ResponseResultPageVoCompanyOrderRecordVo
} from "@/types";

export const getCompanyProductList = () => {
  return http.request<ResponseResultListCompanyProductOrderVo>("post", baseUrlApi("company/order/product/list"));
};

export const getCompanyOrderPage = (data?: CompanyOrderPageDto) => {
  return http.request<ResponseResultPageVoCompanyOrderRecordVo>("post", baseUrlApi("company/order/record/page"), { data });
};

export const getCompanyConsumePage = (data?: CompanyConsumePageDto) => {
  return http.request<ResponseResultPageVoCompanyConsumeRecordVo>("post", baseUrlApi("company/order/consume/page"), { data });
};

export const createCompanyOrder = (data: CompanyOrderCreateDto) => {
  return http.request<ResponseResultBoolean>("post", baseUrlApi("company/order/create"), { data });
};
