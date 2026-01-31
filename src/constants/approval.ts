/**
 * 交割单状态枚举
 */
export const APPROVAL_ACTION_ENUM = {
  /**
   * APPROVED(1, "已通过"),
   * REJECTED(2, "已驳回"),
   * TRANSFERRED(3, "已转交");
   */
  APPROVED: {
    code: 1,
    name: "已通过"
  },
  REJECTED: {
    code: 2,
    name: "已驳回"
  },
  TRANSFERRED: {
    code: 3,
    name: "已转交",
    color: "#67C23A"
  }
} as const;

/**
 * 审批状态枚举
 *  状态：0=待审批，1=已审批，2=已跳过
 */
export const APPROVAL_ACTION_STATUS_ENUM = {
  PENDING: {
    code: 0,
    name: "待审批"
  },
  APPROVED: {
    code: 1,
    name: "已审批"
  },
  SKIPPED: {
    code: 2,
    name: "已跳过"
  }
} as const;
