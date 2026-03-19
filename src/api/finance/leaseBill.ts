import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type {
  LeaseBillFinanceQueryDto,
  ResponseResultLeaseBillFinanceSummaryVo,
  ResponseResultPageVoLeaseBillFeeFinanceItemVo,
  ResponseResultPageVoLeaseBillFinanceItemVo
} from "@/types";

export const getFinanceLeaseBillPage = (data?: LeaseBillFinanceQueryDto) => {
  return http.request<ResponseResultPageVoLeaseBillFinanceItemVo>("post", baseUrlApi("finance/lease-bill/page"), { data });
};

export const getFinanceLeaseBillFeePage = (data?: LeaseBillFinanceQueryDto) => {
  return http.request<ResponseResultPageVoLeaseBillFeeFinanceItemVo>("post", baseUrlApi("finance/lease-bill/fee/page"), { data });
};

export const getFinanceLeaseBillSummary = (data?: LeaseBillFinanceQueryDto) => {
  return http.request<ResponseResultLeaseBillFinanceSummaryVo>("post", baseUrlApi("finance/lease-bill/summary"), { data });
};
