import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type {
  FinanceFlowFinanceQueryDto,
  FinanceFlowIdDto,
  ResponseResultFinanceFlowFinanceItemVo,
  ResponseResultFinanceFlowFinanceSummaryVo,
  ResponseResultPageVoFinanceFlowFinanceItemVo
} from "@/types";

export const getFinanceFlowPage = (data?: FinanceFlowFinanceQueryDto) => {
  return http.request<ResponseResultPageVoFinanceFlowFinanceItemVo>("post", baseUrlApi("finance/finance-flow/page"), { data });
};

export const getFinanceFlowSummary = (data?: FinanceFlowFinanceQueryDto) => {
  return http.request<ResponseResultFinanceFlowFinanceSummaryVo>("post", baseUrlApi("finance/finance-flow/summary"), { data });
};

export const getFinanceFlowDetail = (data: FinanceFlowIdDto) => {
  return http.request<ResponseResultFinanceFlowFinanceItemVo>("post", baseUrlApi("finance/finance-flow/detail"), { data });
};
