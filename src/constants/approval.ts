/**
 * 审批模块枚举定义
 * 命名规范：APPROVAL_XXX_ENUM（与 Java 的 ApprovalXxxEnum 区分）
 */

// ==================== 审批操作类型枚举 ====================
export const APPROVAL_ACTION_TYPE_ENUM = {
  APPROVE: { code: 1, name: "通过" },
  REJECT: { code: 2, name: "驳回" },
  TRANSFER: { code: 3, name: "转交" }
} as const;

export type ApprovalActionTypeCode = (typeof APPROVAL_ACTION_TYPE_ENUM)[keyof typeof APPROVAL_ACTION_TYPE_ENUM]["code"];

export const APPROVAL_ACTION_TYPE_HELPER = {
  getByCode(code: number | undefined | null) {
    if (code == null) return null;
    return Object.values(APPROVAL_ACTION_TYPE_ENUM).find(item => item.code === code) ?? null;
  },
  getNameByCode(code: number | undefined | null): string {
    return this.getByCode(code)?.name ?? "未知";
  },
  isApprove: (code: number | undefined | null) => code === APPROVAL_ACTION_TYPE_ENUM.APPROVE.code,
  isReject: (code: number | undefined | null) => code === APPROVAL_ACTION_TYPE_ENUM.REJECT.code,
  isTransfer: (code: number | undefined | null) => code === APPROVAL_ACTION_TYPE_ENUM.TRANSFER.code
};

// ==================== 审批动作状态枚举 ====================
export const APPROVAL_ACTION_STATUS_ENUM = {
  PENDING: { code: 0, name: "待审批" },
  APPROVED: { code: 1, name: "已审批" },
  SKIPPED: { code: 2, name: "已跳过" }
} as const;

export type ApprovalActionStatusCode = (typeof APPROVAL_ACTION_STATUS_ENUM)[keyof typeof APPROVAL_ACTION_STATUS_ENUM]["code"];

export const APPROVAL_ACTION_STATUS_HELPER = {
  getByCode(code: number | undefined | null) {
    if (code == null) return null;
    return Object.values(APPROVAL_ACTION_STATUS_ENUM).find(item => item.code === code) ?? null;
  },
  getNameByCode(code: number | undefined | null): string {
    return this.getByCode(code)?.name ?? "未知";
  },
  isPending: (code: number | undefined | null) => code === APPROVAL_ACTION_STATUS_ENUM.PENDING.code,
  isApproved: (code: number | undefined | null) => code === APPROVAL_ACTION_STATUS_ENUM.APPROVED.code,
  isSkipped: (code: number | undefined | null) => code === APPROVAL_ACTION_STATUS_ENUM.SKIPPED.code
};

// ==================== 审批实例状态枚举 ====================
export const APPROVAL_INSTANCE_STATUS_ENUM = {
  DRAFT: { code: 0, name: "待提交", type: "info" },
  PENDING: { code: 1, name: "审批中", type: "warning" },
  APPROVED: { code: 2, name: "已通过", type: "success" },
  REJECTED: { code: 3, name: "已驳回", type: "danger" },
  WITHDRAWN: { code: 4, name: "已撤回", type: "info" },
  CANCELLED: { code: 5, name: "已取消", type: "info" }
} as const;

export type ApprovalInstanceStatusCode = (typeof APPROVAL_INSTANCE_STATUS_ENUM)[keyof typeof APPROVAL_INSTANCE_STATUS_ENUM]["code"];

export type ApprovalInstanceStatusType = (typeof APPROVAL_INSTANCE_STATUS_ENUM)[keyof typeof APPROVAL_INSTANCE_STATUS_ENUM]["type"];

export const APPROVAL_INSTANCE_STATUS_HELPER = {
  getByCode(code: number | undefined | null) {
    if (code == null) return null;
    return Object.values(APPROVAL_INSTANCE_STATUS_ENUM).find(item => item.code === code) ?? null;
  },
  getNameByCode(code: number | undefined | null): string {
    return this.getByCode(code)?.name ?? "未知";
  },
  getTypeByCode(code: number | undefined | null): ApprovalInstanceStatusType | "" {
    return this.getByCode(code)?.type ?? "";
  },
  isDraft: (code: number | undefined | null) => code === APPROVAL_INSTANCE_STATUS_ENUM.DRAFT.code,
  isPending: (code: number | undefined | null) => code === APPROVAL_INSTANCE_STATUS_ENUM.PENDING.code,
  isApproved: (code: number | undefined | null) => code === APPROVAL_INSTANCE_STATUS_ENUM.APPROVED.code,
  isRejected: (code: number | undefined | null) => code === APPROVAL_INSTANCE_STATUS_ENUM.REJECTED.code,
  isWithdrawn: (code: number | undefined | null) => code === APPROVAL_INSTANCE_STATUS_ENUM.WITHDRAWN.code,
  isCancelled: (code: number | undefined | null) => code === APPROVAL_INSTANCE_STATUS_ENUM.CANCELLED.code,
  /** 是否为终态（已通过/已驳回/已撤回/已取消） */
  isFinal: (code: number | undefined | null) =>
    code === APPROVAL_INSTANCE_STATUS_ENUM.APPROVED.code ||
    code === APPROVAL_INSTANCE_STATUS_ENUM.REJECTED.code ||
    code === APPROVAL_INSTANCE_STATUS_ENUM.WITHDRAWN.code ||
    code === APPROVAL_INSTANCE_STATUS_ENUM.CANCELLED.code
};

// ==================== 审批业务类型枚举 ====================
export const APPROVAL_BIZ_TYPE_ENUM = {
  TENANT_CHECKIN: {
    code: "TENANT_CHECKIN",
    name: "租客入住",
    tableName: "tenant",
    pkField: "id"
  },
  TENANT_CHECKOUT: {
    code: "TENANT_CHECKOUT",
    name: "租客退租",
    tableName: "tenant_checkout",
    pkField: "id"
  },
  HOUSE_CREATE: {
    code: "HOUSE_CREATE",
    name: "房源录入",
    tableName: "house",
    pkField: "id"
  }
} as const;

export type ApprovalBizTypeCode = (typeof APPROVAL_BIZ_TYPE_ENUM)[keyof typeof APPROVAL_BIZ_TYPE_ENUM]["code"];

export const APPROVAL_BIZ_TYPE_HELPER = {
  getByCode(code: string | undefined | null) {
    if (code == null) return null;
    return Object.values(APPROVAL_BIZ_TYPE_ENUM).find(item => item.code === code) ?? null;
  },
  getNameByCode(code: string | undefined | null): string {
    return this.getByCode(code)?.name ?? "未知";
  },
  isTenantCheckin: (code: string | undefined | null) => code === APPROVAL_BIZ_TYPE_ENUM.TENANT_CHECKIN.code,
  isTenantCheckout: (code: string | undefined | null) => code === APPROVAL_BIZ_TYPE_ENUM.TENANT_CHECKOUT.code,
  isHouseCreate: (code: string | undefined | null) => code === APPROVAL_BIZ_TYPE_ENUM.HOUSE_CREATE.code
};

// ==================== 审批人类型枚举 ====================
export const APPROVER_TYPE_ENUM = {
  SPECIFIC_USER: { code: 1, name: "指定用户" },
  SPECIFIC_ROLE: { code: 2, name: "指定角色" },
  DEPARTMENT_SUPERVISOR: { code: 3, name: "部门主管" },
  SELF_OPTION: { code: 4, name: "发起人自选" }
} as const;

export type ApproverTypeCode = (typeof APPROVER_TYPE_ENUM)[keyof typeof APPROVER_TYPE_ENUM]["code"];

export const APPROVER_TYPE_HELPER = {
  getByCode(code: number | undefined | null) {
    if (code == null) return null;
    return Object.values(APPROVER_TYPE_ENUM).find(item => item.code === code) ?? null;
  },
  getNameByCode(code: number | undefined | null): string {
    return this.getByCode(code)?.name ?? "未知";
  }
};

// ==================== 业务审批状态枚举 ====================
export const BIZ_APPROVAL_STATUS_ENUM = {
  PENDING: { code: 1, name: "审批中" },
  APPROVED: { code: 2, name: "已通过" },
  REJECTED: { code: 3, name: "已驳回" },
  WITHDRAWN: { code: 4, name: "已撤回" }
} as const;

export type BizApprovalStatusCode = (typeof BIZ_APPROVAL_STATUS_ENUM)[keyof typeof BIZ_APPROVAL_STATUS_ENUM]["code"];

export const BIZ_APPROVAL_STATUS_HELPER = {
  getByCode(code: number | undefined | null) {
    if (code == null) return null;
    return Object.values(BIZ_APPROVAL_STATUS_ENUM).find(item => item.code === code) ?? null;
  },
  getNameByCode(code: number | undefined | null): string {
    return this.getByCode(code)?.name ?? "未知";
  },
  isPending: (code: number | undefined | null) => code === BIZ_APPROVAL_STATUS_ENUM.PENDING.code,
  isApproved: (code: number | undefined | null) => code === BIZ_APPROVAL_STATUS_ENUM.APPROVED.code,
  isRejected: (code: number | undefined | null) => code === BIZ_APPROVAL_STATUS_ENUM.REJECTED.code,
  isWithdrawn: (code: number | undefined | null) => code === BIZ_APPROVAL_STATUS_ENUM.WITHDRAWN.code,
  /** 是否可以重新提交（驳回或撤回后） */
  canResubmit: (code: number | undefined | null) => code === BIZ_APPROVAL_STATUS_ENUM.REJECTED.code || code === BIZ_APPROVAL_STATUS_ENUM.WITHDRAWN.code
};

// ==================== 多人审批方式枚举 ====================
export const MULTI_APPROVE_ENUM = {
  OR_SIGN: { code: 1, name: "或签（一人通过即可）" },
  AND_SIGN: { code: 2, name: "会签（所有人通过）" }
} as const;

export type MultiApproveCode = (typeof MULTI_APPROVE_ENUM)[keyof typeof MULTI_APPROVE_ENUM]["code"];

export const MULTI_APPROVE_HELPER = {
  getByCode(code: number | undefined | null) {
    if (code == null) return null;
    return Object.values(MULTI_APPROVE_ENUM).find(item => item.code === code) ?? null;
  },
  getNameByCode(code: number | undefined | null): string {
    return this.getByCode(code)?.name ?? "未知";
  },
  isOrSign: (code: number | undefined | null) => code === MULTI_APPROVE_ENUM.OR_SIGN.code,
  isAndSign: (code: number | undefined | null) => code === MULTI_APPROVE_ENUM.AND_SIGN.code
};
