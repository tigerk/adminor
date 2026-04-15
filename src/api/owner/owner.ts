import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";
import type {
  OwnerWithdrawCreateDto,
  OwnerWithdrawApplyIdDto,
  OwnerWithdrawApplyQueryDto,
  OwnerWithdrawOperateDto,
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
  itemType?: string;
  itemName?: string;
  direction?: string;
  amount?: number;
  bizTime?: string;
  formulaSnapshot?: string;
  remark?: string;
}

export interface SettlementBillReductionVo {
  id?: number | string;
  reductionType?: string;
  reductionName?: string;
  amount?: number;
  bizTime?: string;
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
  createTime?: string;
  updateTime?: string;
  lineList?: SettlementBillLineVo[];
  reductionList?: SettlementBillReductionVo[];
}

export interface PayableBillQueryDto {
  currentPage?: string;
  pageSize?: string;
  ownerId?: string;
  contractId?: string;
  ownerName?: string;
  billNo?: string;
  paymentStatus?: number;
  billStatus?: number;
}

export interface PayableBillListVo {
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
  dueDate?: string;
  payableAmount?: number;
  paidAmount?: number;
  unpaidAmount?: number;
  adjustAmount?: number;
  paymentStatus?: number;
  billStatus?: number;
  generatedAt?: string;
  cancelAt?: string;
}

export interface PayableBillSummaryVo {
  billCount?: number | string;
  totalPayableAmount?: number;
  totalPaidAmount?: number;
  totalUnpaidAmount?: number;
  canceledCount?: number | string;
}

export interface PayableBillLineDto {
  id?: string | number;
  sourceType?: string;
  sourceId?: string | number;
  itemType?: string;
  itemName?: string;
  direction?: string;
  amount?: number;
  bizTime?: string;
  formulaSnapshot?: string;
  remark?: string;
}

export interface PayableBillPaymentCreateDto {
  billId?: string | number;
  payAmount?: number;
  payAt?: string;
  payChannel?: string;
  thirdTradeNo?: string;
  remark?: string;
  voucherUrls?: string[];
}

export interface PayableBillCreateDto {
  ownerId?: string | number;
  contractId?: string | number;
  subjectType?: string;
  subjectId?: string | number;
  subjectName?: string;
  billStartDate?: string;
  billEndDate?: string;
  dueDate?: string;
  remark?: string;
  lineList?: PayableBillLineDto[];
}

export interface PayableBillUpdateDto extends PayableBillCreateDto {
  billId?: string | number;
}

export interface PayableBillCancelDto {
  billId?: string | number;
  cancelReason?: string;
}

export interface PayableBillPaymentVo {
  paymentId?: number | string;
  paymentNo?: string;
  payAmount?: number;
  payAt?: string;
  payChannel?: string;
  thirdTradeNo?: string;
  remark?: string;
  voucherUrls?: string[];
  createTime?: string;
}

export interface BizOperateLogVo {
  id?: number | string;
  operateType?: string;
  operateDesc?: string;
  remark?: string;
  operatorName?: string;
  createTime?: string;
}

export interface PayableBillDetailVo extends PayableBillListVo {
  subjectId?: string | number;
  cancelReason?: string;
  cancelBy?: string | number;
  cancelByName?: string;
  remark?: string;
  createTime?: string;
  updateTime?: string;
  lineList?: PayableBillLineDto[];
  paymentList?: PayableBillPaymentVo[];
  operateLogList?: BizOperateLogVo[];
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

export const getOwnerPayableBillPage = (data?: PayableBillQueryDto) => {
  return http.request<ResponseResultPage<PayableBillListVo>>("post", baseUrlApi("owner/payable-bill/page"), { data });
};

export const getOwnerPayableBillSummary = (data?: PayableBillQueryDto) => {
  return http.request<ResponseResultData<PayableBillSummaryVo>>("post", baseUrlApi("owner/payable-bill/summary"), { data });
};

export const getOwnerPayableBillDetail = (data: { billId: string | number }) => {
  return http.request<ResponseResultData<PayableBillDetailVo>>("post", baseUrlApi("owner/payable-bill/detail"), { data });
};

export const createOwnerPayableBill = (data: PayableBillCreateDto) => {
  return http.request<ResponseResultLong>("post", baseUrlApi("owner/payable-bill/create"), { data });
};

export const updateOwnerPayableBill = (data: PayableBillUpdateDto) => {
  return http.request<ResponseResultLong>("post", baseUrlApi("owner/payable-bill/update"), { data });
};

export const cancelOwnerPayableBill = (data: PayableBillCancelDto) => {
  return http.request<ResponseResultLong>("post", baseUrlApi("owner/payable-bill/cancel"), { data });
};

export const createOwnerPayableBillPayment = (data: PayableBillPaymentCreateDto) => {
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
