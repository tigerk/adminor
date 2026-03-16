import type { LeaseCheckoutDto, LeaseCheckoutFeeDto } from "@/types";

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
  feeStart?: string;
  feeEnd?: string;
  remark?: string;
  billId?: string;
  /** 级联选择器绑定值 [parentCode, childId] */
  feeTypeCascade?: [string, string] | null;
}

/**
 * UI 专用：费用行表单项
 *
 * 扩展自 LeaseCheckoutFeeDto，差异点：
 * - feeType / feeAmount 在编辑过程中允许为 null（未填写状态）
 * - feeName 是纯前端展示字段（后端 DTO/VO 均无此字段，仅用于列表渲染）
 * - feeTypeCascade 是级联选择器的双向绑定值，提交前无需传给后端
 */
export interface CheckoutFeeFormItem extends Omit<LeaseCheckoutFeeDto, "feeType" | "feeAmount"> {
  feeType: number | string | null;
  feeAmount: number | null;
  /** 费用名称（纯前端展示，不提交后端） */
  feeName?: string;
  /** 级联选择器绑定值 [parentDictCode, childItemId]，提交前无需传给后端 */
  feeTypeCascade?: [string, string] | null;
}

/**
 * 退租单「页面」表单数据（hook.tsx 使用）
 *
 * 扩展自 LeaseCheckoutDto，差异点：
 * - checkoutType 允许 null（初始未选择状态）
 * - depositAmount 为前端展示 / 编辑字段，变更时同步押金退还费用行
 * - feeList 使用前端专用的 CheckoutFeeFormItem
 * - settlementMethod 保留但允许 0 作为初始占位值
 */
export interface CheckoutPageFormData extends Omit<LeaseCheckoutDto, "feeList" | "checkoutType"> {
  checkoutType: number | null;
  /** 押金金额（前端编辑用，影响押金退还费用行自动同步） */
  depositAmount: number;
  feeList: CheckoutFeeFormItem[];
}

/**
 * 退租单「弹窗」表单数据（CheckoutDialog.vue 使用）
 *
 * 扩展自 LeaseCheckoutDto，差异点：
 * - checkoutType 允许 null（初始未选择状态）
 * - feeList 使用前端专用的 CheckoutFeeFormItem
 * - attachmentFiles 为上传组件双向绑定值，提交前转换为 attachmentIds（string[]）
 * - badDebtReason 在前端为必填字符串（非 undefined）
 */
export interface CheckoutDialogFormData extends Omit<LeaseCheckoutDto, "feeList" | "checkoutType" | "badDebtReason"> {
  checkoutType: number | null;
  feeList: CheckoutFeeFormItem[];
  /** 附件文件列表（已上传返回 URL 字符串，或上传组件内部对象） */
  attachmentFiles: (string | { url?: string })[];
  /** 坏账原因（settlementMethod === BAD_DEBT 时必填，前端保证非 undefined） */
  badDebtReason: string;
}
