/**
 * 退租单类型定义
 */

/** 退租初始化数据 */
export interface CheckoutInitDataProps {
  tenantId: string;
  tenantName: string;
  tenantPhone: string;
  roomInfo: string;
  leaseStart: string;
  leaseEnd: string;
  rentPrice: number;
  depositAmount: number;
  unpaidBills: UnpaidBillProps[];
  unpaidAmount: number;
}

/** 未付账单 */
export interface UnpaidBillProps {
  billId: string;
  billCode: string;
  feeType: number;
  billPeriod: string;
  payableAmount: number;
  paidAmount: number;
  unpaidAmount: number;
}

/** 退租费用明细 */
export interface CheckoutFeeProps {
  id?: string;
  feeType: number;
  feeName: string;
  feeAmount: number;
  feeDirection: number;
  billId?: string;
  remark?: string;
}

/** 退租单表单 */
export interface CheckoutFormProps {
  id?: string;
  tenantId: string;
  checkoutType: number | null;
  checkoutReason: string;
  actualCheckoutDate: string;
  depositAmount: number;
  feeList: CheckoutFeeProps[];
  remark: string;
}

/** 退租单详情 */
export interface CheckoutDetailProps {
  id: string;
  checkoutCode: string;
  companyId: string;
  tenantId: string;
  tenantName: string;
  tenantPhone: string;
  roomInfo: string;
  deliveryId?: string;
  checkoutType: number;
  checkoutTypeName: string;
  checkoutReason: string;
  leaseEnd: string;
  actualCheckoutDate: string;
  depositAmount: number;
  deductionAmount: number;
  refundAmount: number;
  finalAmount: number;
  status: number;
  statusName: string;
  approvalStatus: number;
  approvalStatusName: string;
  settlementTime?: string;
  remark: string;
  feeList: CheckoutFeeProps[];
  createBy: string;
  createByName: string;
  createTime: string;
}

/** 退租单查询参数 */
export interface CheckoutQueryProps {
  tenantId?: string;
  checkoutCode?: string;
  tenantName?: string;
  checkoutType?: number;
  status?: number;
  approvalStatus?: number;
  pageNum?: number;
  pageSize?: number;
}

/** 快捷选项 */
export interface CheckoutQuickOptionProps {
  type: number;
  label: string;
  icon: any;
}
