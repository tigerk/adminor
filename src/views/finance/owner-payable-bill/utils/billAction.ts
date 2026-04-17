import type { PayableBillListVo } from "@/api/owner/owner";

/**
 * 获取账单状态值
 * @param row
 */
function billStatusValue(row?: Pick<PayableBillListVo, "billStatus">) {
  return Number(row?.billStatus || 1);
}

/**
 * 获取支付状态值
 * @param row
 */
function paymentStatusValue(row?: Pick<PayableBillListVo, "paymentStatus">) {
  return Number(row?.paymentStatus || 0);
}

/**
 * 获取已支付金额值
 * @param row
 */
function paidAmountValue(row?: Pick<PayableBillListVo, "paidAmount">) {
  return Number(row?.paidAmount || 0);
}

/**
 * 获取未支付金额值
 * @param row
 */
function unpaidAmountValue(row?: Pick<PayableBillListVo, "unpaidAmount">) {
  return Number(row?.unpaidAmount || 0);
}

/**
 * 是否可支付
 * @param row
 */
export function canPayOwnerPayableBill(row?: Pick<PayableBillListVo, "billStatus" | "unpaidAmount">) {
  return billStatusValue(row) === 1 && unpaidAmountValue(row) > 0;
}

/**
 * 是否可编辑
 * @param row
 */
export function canEditOwnerPayableBill(row?: Pick<PayableBillListVo, "billStatus" | "paymentStatus" | "paidAmount">) {
  return billStatusValue(row) === 1 && paymentStatusValue(row) === 0 && paidAmountValue(row) <= 0;
}

/**
 * 是否可取消
 * @param row
 */
export function canCancelOwnerPayableBill(row?: Pick<PayableBillListVo, "billStatus" | "paymentStatus" | "paidAmount">) {
  return canEditOwnerPayableBill(row);
}
