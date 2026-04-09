import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type {
  OwnerBillIdDto,
  OwnerBillPaymentCreateDto,
  OwnerBillQueryDto,
  OwnerWithdrawCreateDto,
  OwnerWithdrawApplyIdDto,
  OwnerWithdrawApplyQueryDto,
  OwnerWithdrawOperateDto,
  ResponseResultOwnerBillDetailVo,
  ResponseResultOwnerBillSummaryVo,
  ResponseResultOwnerWithdrawApplyDetailVo,
  ResponseResultOwnerWithdrawSummaryVo,
  ResponseResultPageVoOwnerBillListVo,
  ResponseResultPageVoOwnerWithdrawApplyListVo,
  ResponseResultLong
} from "@/types/generated";

export const getOwnerBillPage = (data?: OwnerBillQueryDto) => {
  return http.request<ResponseResultPageVoOwnerBillListVo>("post", baseUrlApi("owner/bill/page"), { data });
};

export const getOwnerBillSummary = (data?: OwnerBillQueryDto) => {
  return http.request<ResponseResultOwnerBillSummaryVo>("post", baseUrlApi("owner/bill/summary"), { data });
};

export const getOwnerBillDetail = (data: OwnerBillIdDto) => {
  return http.request<ResponseResultOwnerBillDetailVo>("post", baseUrlApi("owner/bill/detail"), { data });
};

export const createOwnerBillPayment = (data: OwnerBillPaymentCreateDto) => {
  return http.request<ResponseResultLong>("post", baseUrlApi("owner/bill/payment/create"), { data });
};

export const getOwnerWithdrawPage = (data?: OwnerWithdrawApplyQueryDto) => {
  return http.request<ResponseResultPageVoOwnerWithdrawApplyListVo>("post", baseUrlApi("owner/withdraw/page"), { data });
};

export const getOwnerWithdrawSummary = (data?: OwnerWithdrawApplyQueryDto) => {
  return http.request<ResponseResultOwnerWithdrawSummaryVo>("post", baseUrlApi("owner/withdraw/summary"), { data });
};

export const getOwnerWithdrawDetail = (data: OwnerWithdrawApplyIdDto) => {
  return http.request<ResponseResultOwnerWithdrawApplyDetailVo>("post", baseUrlApi("owner/withdraw/detail"), { data });
};

export const createOwnerWithdraw = (data: OwnerWithdrawCreateDto) => {
  return http.request<ResponseResultLong>("post", baseUrlApi("owner/withdraw/create"), { data });
};

export const operateOwnerWithdraw = (data: OwnerWithdrawOperateDto) => {
  return http.request<ResponseResultLong>("post", baseUrlApi("owner/withdraw/operate"), { data });
};
