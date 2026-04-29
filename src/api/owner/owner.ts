import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type {
  OwnerPayableBillCreateDto,
  OwnerPayableBillIdDto,
  OwnerPayableBillPaymentCreateDto,
  OwnerPayableBillQueryDto,
  OwnerPayableBillUpdateDto,
  OwnerPayableBillVoidDto,
  OwnerWithdrawCreateDto,
  OwnerWithdrawApplyIdDto,
  OwnerWithdrawApplyQueryDto,
  OwnerWithdrawOperateDto,
  ResponseResultOwnerPayableBillDetailVo,
  ResponseResultOwnerPayableBillSummaryVo,
  ResponseResultPageVoOwnerPayableBillListVo,
  ResponseResultOwnerWithdrawApplyDetailVo,
  ResponseResultOwnerWithdrawSummaryVo,
  ResponseResultPageVoOwnerWithdrawApplyListVo,
  ResponseResultLong
} from "@/types/generated";

export interface SettlementBillQueryDto {
  currentPage?: string;
  pageSize?: string;
  ownerId?: string;
  contractId?: string;
  ownerName?: string;
  billNo?: string;
  approvalStatus?: number;
  settlementStatus?: number;
}

export interface SettlementBillListVo {
  billId?: number | string;
  billNo?: string;
  ownerId?: number | string;
  ownerName?: string;
  ownerPhone?: string;
  contractId?: number | string;
  contractNo?: string;
  subjectName?: string;
  billStartDate?: string;
  billEndDate?: string;
  incomeAmount?: number;
  expenseAmount?: number;
  payableAmount?: number;
  settledAmount?: number;
  unpaidAmount?: number;
  withdrawableAmount?: number;
  approvalStatus?: number;
  settlementStatus?: number;
  generatedAt?: string;
}

export interface SettlementBillSummaryVo {
  billCount?: number | string;
  totalIncomeAmount?: number;
  totalPayableAmount?: number;
  totalSettledAmount?: number;
  totalUnpaidAmount?: number;
  totalWithdrawableAmount?: number;
}

export interface SettlementBillLineVo {
  id?: number | string;
  dictDataId?: number | string;
  feeType?: string;
  feeName?: string;
  direction?: string;
  amount?: number;
  bizDate?: string;
  formulaSnapshot?: string;
  remark?: string;
}

export interface SettlementBillReductionVo {
  id?: number | string;
  reductionType?: string;
  reductionName?: string;
  amount?: number;
  bizDate?: string;
  ruleSnapshot?: string;
  remark?: string;
}

export interface SettlementBillDetailVo extends SettlementBillListVo {
  subjectId?: number | string;
  reductionAmount?: number;
  adjustAmount?: number;
  withdrawnAmount?: number;
  freezeAmount?: number;
  billStatus?: number;
  approvedAt?: string;
  remark?: string;
  createAt?: string;
  updateAt?: string;
  feeList?: SettlementBillLineVo[];
  reductionList?: SettlementBillReductionVo[];
}

type ResponseResultPage<T> = {
  code?: number;
  message?: string;
  data?: {
    currentPage?: string | number;
    pageSize?: string | number;
    total?: string | number;
    pages?: string | number;
    list?: T[];
  };
};

type ResponseResultData<T> = {
  code?: number;
  message?: string;
  data?: T;
};

export const getOwnerSettlementBillPage = (data?: SettlementBillQueryDto) => {
  return http.request<ResponseResultPage<SettlementBillListVo>>("post", baseUrlApi("owner/settlement-bill/page"), { data });
};

export const getOwnerSettlementBillSummary = (data?: SettlementBillQueryDto) => {
  return http.request<ResponseResultData<SettlementBillSummaryVo>>("post", baseUrlApi("owner/settlement-bill/summary"), { data });
};

export const getOwnerSettlementBillDetail = (data: { billId: string | number }) => {
  return http.request<ResponseResultData<SettlementBillDetailVo>>("post", baseUrlApi("owner/settlement-bill/detail"), { data });
};

export const getOwnerPayableBillPage = (data?: OwnerPayableBillQueryDto) => {
  return http.request<ResponseResultPageVoOwnerPayableBillListVo>("post", baseUrlApi("owner/payable-bill/page"), { data });
};

export const getOwnerPayableBillSummary = (data?: OwnerPayableBillQueryDto) => {
  return http.request<ResponseResultOwnerPayableBillSummaryVo>("post", baseUrlApi("owner/payable-bill/summary"), { data });
};

export const getOwnerPayableBillDetail = (data: OwnerPayableBillIdDto) => {
  return http.request<ResponseResultOwnerPayableBillDetailVo>("post", baseUrlApi("owner/payable-bill/detail"), { data });
};

export const createOwnerPayableBill = (data: OwnerPayableBillCreateDto) => {
  return http.request<ResponseResultLong>("post", baseUrlApi("owner/payable-bill/create"), { data });
};

export const updateOwnerPayableBill = (data: OwnerPayableBillUpdateDto) => {
  return http.request<ResponseResultLong>("post", baseUrlApi("owner/payable-bill/update"), { data });
};

export const voidOwnerPayableBill = (data: OwnerPayableBillVoidDto) => {
  return http.request<ResponseResultLong>("post", baseUrlApi("owner/payable-bill/void"), { data });
};

export const createOwnerPayableBillPayment = (data: OwnerPayableBillPaymentCreateDto) => {
  return http.request<ResponseResultLong>("post", baseUrlApi("owner/payable-bill/payment/create"), { data });
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
