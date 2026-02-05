/**
 * 退租相关枚举与常量（退租并结账）
 */

/** 退租类型：只有正常退和违约退 */
export enum CHECKOUT_TYPE_ENUM {
  NORMAL = 1, // 正常退
  BREACH = 2 // 违约退
}

/** 退租类型选项 */
export const CHECKOUT_TYPE_OPTIONS = [
  { label: "正常退", value: CHECKOUT_TYPE_ENUM.NORMAL },
  { label: "违约退", value: CHECKOUT_TYPE_ENUM.BREACH }
] as const;

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
] as const;

/** 收支类型 */
export enum FEE_DIRECTION_ENUM {
  INCOME = 1, // 收（租客应付）
  EXPENSE = 2 // 支（退还租客）
}

/** 费用类型（收入方向） */
export enum CHECKOUT_FEE_TYPE_ENUM {
  RENT = 1, // 租金
  DEPOSIT = 2, // 押金
  WATER = 3, // 水费
  ELECTRIC = 4, // 电费
  GAS = 5, // 燃气费
  PROPERTY_FEE = 6, // 物业费
  CLEANING = 7, // 清洁费
  DAMAGE = 8, // 物品损坏
  PENALTY = 9, // 违约金
  OTHER = 10, // 其他费用
  // 支出方向
  RENT_REFUND = 51, // 租金（退）
  DEPOSIT_REFUND = 52, // 押金（退）
  OTHER_REFUND = 53 // 其他退款
}

/** 费用类型选项（收入方向 - 扣款） */
export const INCOME_FEE_TYPE_OPTIONS = [
  { label: "租金", value: CHECKOUT_FEE_TYPE_ENUM.RENT },
  { label: "押金", value: CHECKOUT_FEE_TYPE_ENUM.DEPOSIT },
  { label: "水费", value: CHECKOUT_FEE_TYPE_ENUM.WATER },
  { label: "电费", value: CHECKOUT_FEE_TYPE_ENUM.ELECTRIC },
  { label: "燃气费", value: CHECKOUT_FEE_TYPE_ENUM.GAS },
  { label: "物业费", value: CHECKOUT_FEE_TYPE_ENUM.PROPERTY_FEE },
  { label: "清洁费", value: CHECKOUT_FEE_TYPE_ENUM.CLEANING },
  { label: "物品损坏", value: CHECKOUT_FEE_TYPE_ENUM.DAMAGE },
  { label: "违约金", value: CHECKOUT_FEE_TYPE_ENUM.PENALTY },
  { label: "其他费用", value: CHECKOUT_FEE_TYPE_ENUM.OTHER }
] as const;

/** 费用类型选项（支出方向 - 退款） */
export const EXPENSE_FEE_TYPE_OPTIONS = [
  { label: "租金", value: CHECKOUT_FEE_TYPE_ENUM.RENT_REFUND },
  { label: "押金", value: CHECKOUT_FEE_TYPE_ENUM.DEPOSIT_REFUND },
  { label: "其他退款", value: CHECKOUT_FEE_TYPE_ENUM.OTHER_REFUND }
] as const;

/** 费用类型子类选项（用于"费用类型"下拉第二级） */
export const FEE_SUB_NAME_MAP: Record<number, string[]> = {
  [CHECKOUT_FEE_TYPE_ENUM.RENT]: ["房屋租金"],
  [CHECKOUT_FEE_TYPE_ENUM.DEPOSIT]: ["房屋押金"],
  [CHECKOUT_FEE_TYPE_ENUM.WATER]: ["水费"],
  [CHECKOUT_FEE_TYPE_ENUM.ELECTRIC]: ["电费"],
  [CHECKOUT_FEE_TYPE_ENUM.GAS]: ["燃气费"],
  [CHECKOUT_FEE_TYPE_ENUM.PROPERTY_FEE]: ["物业费"],
  [CHECKOUT_FEE_TYPE_ENUM.CLEANING]: ["清洁费"],
  [CHECKOUT_FEE_TYPE_ENUM.DAMAGE]: ["物品损坏赔偿"],
  [CHECKOUT_FEE_TYPE_ENUM.PENALTY]: ["违约金"],
  [CHECKOUT_FEE_TYPE_ENUM.OTHER]: ["其他费用"],
  [CHECKOUT_FEE_TYPE_ENUM.RENT_REFUND]: ["房屋租金"],
  [CHECKOUT_FEE_TYPE_ENUM.DEPOSIT_REFUND]: ["房屋押金"],
  [CHECKOUT_FEE_TYPE_ENUM.OTHER_REFUND]: ["其他退款"]
};

/** 账单处理方式 */
export enum SETTLEMENT_METHOD_ENUM {
  GENERATE_BILL = 1, // 生成待付账单
  OFFLINE_PAYMENT = 2, // 线下付款
  APPLY_PAYMENT = 3, // 申请付款
  BAD_DEBT = 4 // 标记坏账
}

/** 账单处理方式选项 */
export const SETTLEMENT_METHOD_OPTIONS = [
  { label: "生成待付账单", value: SETTLEMENT_METHOD_ENUM.GENERATE_BILL },
  { label: "线下付款", value: SETTLEMENT_METHOD_ENUM.OFFLINE_PAYMENT },
  { label: "申请付款", value: SETTLEMENT_METHOD_ENUM.APPLY_PAYMENT },
  { label: "标记坏账", value: SETTLEMENT_METHOD_ENUM.BAD_DEBT }
] as const;

/** 审批状态 */
export enum APPROVAL_STATUS_ENUM {
  PENDING = 1, // 审批中
  APPROVED = 2, // 已通过
  REJECTED = 3, // 已驳回
  WITHDRAWN = 4 // 已撤回
}

/** 证件类型选项 */
export const ID_TYPE_OPTIONS = [
  { label: "身份证", value: "ID_CARD" },
  { label: "护照", value: "PASSPORT" },
  { label: "营业执照", value: "BUSINESS_LICENSE" },
  { label: "其他", value: "OTHER" }
] as const;

/** 银行类型选项 */
export const BANK_TYPE_OPTIONS = [
  { label: "银联", value: "UNIONPAY" },
  { label: "支付宝", value: "ALIPAY" },
  { label: "微信", value: "WECHAT" }
] as const;

/** 银行卡类型选项 */
export const BANK_CARD_TYPE_OPTIONS = [
  { label: "借记卡", value: "DEBIT" },
  { label: "信用卡", value: "CREDIT" }
] as const;

/** 退租确认单模板选项 */
export const CONFIRMATION_TEMPLATE_OPTIONS = [
  { label: "退租模板", value: "checkout_default" },
  { label: "违约退租模板", value: "checkout_breach" }
] as const;
