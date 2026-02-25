/** 合同状态 */
export enum LeaseStatus {
  NOT_EFFECTIVE = 0, // 未生效
  ACTIVE = 1, // 生效中
  CHECKED_OUT = 2, // 已退租
  OVERDUE = 3, // 已逾期
  CANCELLED = 4 // 已作废
}

/** 签约状态 */
export enum SignStatus {
  PENDING = 0, // 待签字
  SIGNED = 1 // 已签字
}

/** 收租类型 */
export enum RentDueType {
  ADVANCE = 1, // 提前
  FIXED = 2, // 固定
  DELAY = 3 // 延后
}
