import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type {
  OwnerBillIdDto,
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
  return http.request<ResponseResultPageVoOwnerBillListVo>("post", baseUrlApi("finance/owner/bill/page"), { data });
};

export const getOwnerBillSummary = (data?: OwnerBillQueryDto) => {
  return http.request<ResponseResultOwnerBillSummaryVo>("post", baseUrlApi("finance/owner/bill/summary"), { data });
};

export const getOwnerBillDetail = (data: OwnerBillIdDto) => {
  return http.request<ResponseResultOwnerBillDetailVo>("post", baseUrlApi("finance/owner/bill/detail"), { data });
};

export const getOwnerWithdrawPage = (data?: OwnerWithdrawApplyQueryDto) => {
  return http.request<ResponseResultPageVoOwnerWithdrawApplyListVo>("post", baseUrlApi("finance/owner/withdraw/page"), { data });
};

export const getOwnerWithdrawSummary = (data?: OwnerWithdrawApplyQueryDto) => {
  return http.request<ResponseResultOwnerWithdrawSummaryVo>("post", baseUrlApi("finance/owner/withdraw/summary"), { data });
};

export const getOwnerWithdrawDetail = (data: OwnerWithdrawApplyIdDto) => {
  return http.request<ResponseResultOwnerWithdrawApplyDetailVo>("post", baseUrlApi("finance/owner/withdraw/detail"), { data });
};

export const createOwnerWithdraw = (data: OwnerWithdrawCreateDto) => {
  return http.request<ResponseResultLong>("post", baseUrlApi("finance/owner/withdraw/create"), { data });
};

export const operateOwnerWithdraw = (data: OwnerWithdrawOperateDto) => {
  return http.request<ResponseResultLong>("post", baseUrlApi("finance/owner/withdraw/operate"), { data });
};
