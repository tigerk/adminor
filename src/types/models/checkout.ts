/**
 * 退租单类型定义（退租并结账）
 */

/** 退租初始化数据 */
export interface CheckoutInitDataProps {
  tenantId: string;
  leaseId?: string;
  roomAddress: string;
  roomInfo?: string;
  leaseStart: string;
  leaseEnd: string;
  tenantName: string;
  tenantPhone: string;
  agentInfo?: string;
  rentPrice: number;
  depositAmount: number;
  depositMonths: number;
  unpaidBills: UnpaidBillProps[];
  unpaidAmount: number;
  presetFees: PresetFeeProps[];
  payeeInfo: PayeeInfoProps;
}

/** 未付账单 */
export interface UnpaidBillProps {
  billId: string;
  billCode: string;
  billType: number;
  billTypeName: string;
  billPeriod: string;
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  payAmount: number;
  unpaidAmount: number;
}

/** 预填费用行 */
export interface PresetFeeProps {
  feeDirection: number;
  feeType: number;
  feeSubName?: string;
  feeAmount: number;
  feePeriodStart?: string;
  feePeriodEnd?: string;
  remark?: string;
  billId?: string;
}

/** 收款人信息 */
export interface PayeeInfoProps {
  payeeName?: string;
  payeePhone?: string;
  payeeIdType?: string;
  payeeIdNumber?: string;
}

/** 退租费用明细行（表格行） */
export interface CheckoutFeeProps {
  id?: string;
  feeDirection: number;
  feeType: number | string | null;
  feeName?: string;
  feeSubName?: string;
  feeAmount: number | null;
  feePeriodStart?: string;
  feePeriodEnd?: string;
  remark?: string;
  billId?: string;
  /** 级联选择器绑定值 [parentCode, childId] */
  feeTypeCascade?: [string, string] | null;
}

/** 退租单表单 */
export interface CheckoutFormProps {
  id?: string;
  tenantId: string;
  leaseId?: string;
  checkoutType: number | null;
  actualCheckoutDate: string;
  checkoutReason?: string;
  depositAmount?: number;
  roomInfo?: string;
  /** 解约原因（违约退时选填） */
  breachReason?: string;
  addCleaningFee?: boolean;
  cleaningFeeAmount?: number | null;
  feeList: CheckoutFeeProps[];
  expectedPaymentDate?: string;
  settlementMethod?: number;
  remark?: string;
  attachmentIds?: string[];
  /** UploadImage 组件绑定的文件列表 */
  attachmentFiles?: any[];
  payeeName?: string;
  payeePhone?: string;
  payeeIdType?: string;
  payeeIdNumber?: string;
  bankType?: string;
  bankCardType?: string;
  bankAccount?: string;
  bankName?: string;
  bankBranch?: string;
  sendConfirmation?: boolean;
  confirmationTemplate?: string;
}

/** 退租单详情 */
export interface CheckoutDetailProps {
  id: string;
  checkoutCode: string;
  companyId: string;
  tenantId: string;
  leaseId?: string;
  roomAddress: string;
  roomInfo?: string;
  leaseStart: string;
  leaseEnd: string;
  tenantName: string;
  tenantPhone: string;
  agentInfo?: string;
  rentPrice: number;
  depositAmount: number;
  checkoutReason?: string;
  deliveryId?: string;
  checkoutType: number;
  checkoutTypeName: string;
  actualCheckoutDate: string;
  /** 解约原因（违约退时填写） */
  breachReason?: string;
  incomeAmount: number;
  expenseAmount: number;
  finalAmount: number;
  expectedPaymentDate?: string;
  settlementMethod?: number;
  settlementMethodName: string;
  feeList: CheckoutFeeProps[];
  remark?: string;
  attachmentUrls: string[];
  payeeName?: string;
  payeePhone?: string;
  payeeIdType?: string;
  payeeIdNumber?: string;
  bankType?: string;
  bankCardType?: string;
  bankAccount?: string;
  bankName?: string;
  bankBranch?: string;
  status: number;
  statusName: string;
  approvalStatus: number;
  approvalStatusName: string;
  settlementTime?: string;
  createBy: string;
  createByName: string;
  createTime: string;
}

/** 退租单查询参数 */
export interface CheckoutQueryProps {
  tenantId?: string;
  leaseId?: string;
  checkoutCode?: string;
  tenantName?: string;
  checkoutType?: number;
  status?: number;
  approvalStatus?: number;
  currentPage?: number;
  pageSize?: number;
}
