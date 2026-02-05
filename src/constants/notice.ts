/**
 * 系统通知模块枚举定义
 * 命名规范：NOTICE_XXX_ENUM
 */

// ==================== 个人消息类型枚举 ====================
export const NOTICE_MESSAGE_TYPE_ENUM = {
  SYSTEM: { code: 1, name: "系统消息" },
  CONTRACT_REMIND: { code: 2, name: "租约提醒" },
  BILL_REMIND: { code: 3, name: "缴费提醒" },
  REPAIR_NOTIFY: { code: 4, name: "报修通知" },
  PRIVATE_CHAT: { code: 5, name: "私信" }
} as const;

export type NoticeMessageTypeCode = (typeof NOTICE_MESSAGE_TYPE_ENUM)[keyof typeof NOTICE_MESSAGE_TYPE_ENUM]["code"];

export const NOTICE_MESSAGE_TYPE_HELPER = {
  getByCode(code: number | undefined | null) {
    if (code == null) return null;
    return Object.values(NOTICE_MESSAGE_TYPE_ENUM).find(item => item.code === code) ?? null;
  },
  getNameByCode(code: number | undefined | null): string {
    return this.getByCode(code)?.name ?? "未知";
  }
};

// ==================== 系统公告类型枚举 ====================
export const NOTICE_NOTICE_TYPE_ENUM = {
  SYSTEM: { code: 1, name: "系统公告" },
  OPERATION: { code: 2, name: "运营通知" }
} as const;

export type NoticeNoticeTypeCode = (typeof NOTICE_NOTICE_TYPE_ENUM)[keyof typeof NOTICE_NOTICE_TYPE_ENUM]["code"];

export const NOTICE_NOTICE_TYPE_HELPER = {
  getByCode(code: number | undefined | null) {
    if (code == null) return null;
    return Object.values(NOTICE_NOTICE_TYPE_ENUM).find(item => item.code === code) ?? null;
  },
  getNameByCode(code: number | undefined | null): string {
    return this.getByCode(code)?.name ?? "未知";
  }
};

// ==================== 待办类型枚举 ====================
export const NOTICE_TODO_TYPE_ENUM = {
  CONTRACT_EXPIRE: { code: 1, name: "租约到期" },
  BILL_COLLECTION: { code: 2, name: "账单催收" },
  REPAIR_HANDLE: { code: 3, name: "报修处理" },
  CONTRACT_RENEW: { code: 4, name: "合同续签" },
  CHECKOUT_HANDLE: { code: 5, name: "退房办理" },
  OTHER: { code: 6, name: "其他" }
} as const;

export type NoticeTodoTypeCode = (typeof NOTICE_TODO_TYPE_ENUM)[keyof typeof NOTICE_TODO_TYPE_ENUM]["code"];

export const NOTICE_TODO_TYPE_HELPER = {
  getByCode(code: number | undefined | null) {
    if (code == null) return null;
    return Object.values(NOTICE_TODO_TYPE_ENUM).find(item => item.code === code) ?? null;
  },
  getNameByCode(code: number | undefined | null): string {
    return this.getByCode(code)?.name ?? "未知";
  }
};

// ==================== 公告发布范围枚举 ====================
export const NOTICE_TARGET_SCOPE_ENUM = {
  ALL: { code: 1, name: "全员" },
  LANDLORD: { code: 2, name: "房东" },
  TENANT: { code: 3, name: "租客" },
  ROLE: { code: 4, name: "指定角色" }
} as const;

export type NoticeTargetScopeCode = (typeof NOTICE_TARGET_SCOPE_ENUM)[keyof typeof NOTICE_TARGET_SCOPE_ENUM]["code"];

export const NOTICE_TARGET_SCOPE_HELPER = {
  getByCode(code: number | undefined | null) {
    if (code == null) return null;
    return Object.values(NOTICE_TARGET_SCOPE_ENUM).find(item => item.code === code) ?? null;
  },
  getNameByCode(code: number | undefined | null): string {
    return this.getByCode(code)?.name ?? "未知";
  }
};
