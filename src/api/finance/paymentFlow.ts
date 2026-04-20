import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type {
  PaymentFlowFinanceQueryDto,
  PaymentFlowIdDto,
  ResponseResultPageVoPaymentFlowFinanceItemVo,
  ResponseResultPaymentFlowFinanceItemVo,
  ResponseResultPaymentFlowFinanceSummaryVo,
  ApiResponse,
  PaymentFlowVoidDto
} from "@/types";

export const getFinancePaymentFlowPage = (data?: PaymentFlowFinanceQueryDto) => {
  return http.request<ResponseResultPageVoPaymentFlowFinanceItemVo>("post", baseUrlApi("finance/payment-flow/page"), { data });
};

export const getFinancePaymentFlowSummary = (data?: PaymentFlowFinanceQueryDto) => {
  return http.request<ResponseResultPaymentFlowFinanceSummaryVo>("post", baseUrlApi("finance/payment-flow/summary"), { data });
};

export const getFinancePaymentFlowDetail = (data: PaymentFlowIdDto) => {
  return http.request<ResponseResultPaymentFlowFinanceItemVo>("post", baseUrlApi(`finance/payment-flow/detail`), { data });
};

export const voidFinancePaymentFlow = (data: PaymentFlowVoidDto) => {
  return http.request<ApiResponse>("post", baseUrlApi("finance/payment-flow/void"), { data });
};
