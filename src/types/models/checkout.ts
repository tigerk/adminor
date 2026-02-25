/**
 * 退租单类型定义（退租并结账）
 */

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
