/**
 * 退租单类型定义
 */

/** 退租类型 */
export enum CHECKOUT_TYPE_ENUM {
  NORMAL_EXPIRE = 1, // 正常到期
  EARLY_CHECKOUT = 2, // 提前退租
  ROOM_CHANGE = 3, // 换房退租
  BREACH = 4, // 违约退租
  NEGOTIATION = 5 // 协商解约
}

/** 退租类型选项 */
export const CHECKOUT_TYPE_OPTIONS = [
  { label: "正常到期", value: CHECKOUT_TYPE_ENUM.NORMAL_EXPIRE },
  { label: "提前退租", value: CHECKOUT_TYPE_ENUM.EARLY_CHECKOUT },
  { label: "换房退租", value: CHECKOUT_TYPE_ENUM.ROOM_CHANGE },
  { label: "违约退租", value: CHECKOUT_TYPE_ENUM.BREACH },
  { label: "协商解约", value: CHECKOUT_TYPE_ENUM.NEGOTIATION }
];

/** 退租单状态 */
export enum CHECKOUT_STATUS_ENUM {
  DRAFT = 0, // 草稿
  PENDING = 1, // 待确认
  COMPLETED = 2, // 已完成
  CANCELLED = 3 // 已取消
}

/** 退租单状态选项 */
export const CHECKOUT_STATUS_OPTIONS = [
  { label: "草稿", value: CHECKOUT_STATUS_ENUM.DRAFT },
  { label: "待确认", value: CHECKOUT_STATUS_ENUM.PENDING },
  { label: "已完成", value: CHECKOUT_STATUS_ENUM.COMPLETED },
  { label: "已取消", value: CHECKOUT_STATUS_ENUM.CANCELLED }
];

/** 费用类型 */
export enum CHECKOUT_FEE_TYPE_ENUM {
  UNPAID_RENT = 1, // 欠缴租金
  UNPAID_FEE = 2, // 欠缴杂费
  UTILITY = 3, // 水电燃气
  DAMAGE = 4, // 物品损坏
  PENALTY = 5, // 违约金
  CLEANING = 6, // 清洁费
  OTHER_DEDUCTION = 7, // 其他扣款
  RENT_REFUND = 8, // 多收租金退还
  DEPOSIT_REFUND = 9 // 押金退还
}

/** 费用类型选项（扣款） */
export const DEDUCTION_FEE_TYPE_OPTIONS = [
  { label: "欠缴租金", value: CHECKOUT_FEE_TYPE_ENUM.UNPAID_RENT },
  { label: "欠缴杂费", value: CHECKOUT_FEE_TYPE_ENUM.UNPAID_FEE },
  { label: "水电燃气", value: CHECKOUT_FEE_TYPE_ENUM.UTILITY },
  { label: "物品损坏", value: CHECKOUT_FEE_TYPE_ENUM.DAMAGE },
  { label: "违约金", value: CHECKOUT_FEE_TYPE_ENUM.PENALTY },
  { label: "清洁费", value: CHECKOUT_FEE_TYPE_ENUM.CLEANING },
  { label: "其他扣款", value: CHECKOUT_FEE_TYPE_ENUM.OTHER_DEDUCTION }
];

/** 费用类型选项（退款） */
export const REFUND_FEE_TYPE_OPTIONS = [
  { label: "多收租金退还", value: CHECKOUT_FEE_TYPE_ENUM.RENT_REFUND },
  { label: "押金退还", value: CHECKOUT_FEE_TYPE_ENUM.DEPOSIT_REFUND }
];

/** 费用方向 */
export enum FEE_DIRECTION_ENUM {
  DEDUCTION = 1, // 扣款
  REFUND = 2 // 退款
}

/** 审批状态 */
export enum APPROVAL_STATUS_ENUM {
  PENDING = 1, // 审批中
  APPROVED = 2, // 已通过
  REJECTED = 3, // 已驳回
  WITHDRAWN = 4 // 已撤回
}

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
