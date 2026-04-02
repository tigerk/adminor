import {
  SysMessageTypeEnumMeta,
  SysNoticeTargetScopeEnumMeta,
  SysNoticeTypeEnumMeta,
  SysTodoPriorityEnumMeta,
  SysTodoStatusEnumMeta,
  SysTodoTypeEnumMeta
} from "@/types/generated/enum.meta";

export const NOTICE_MESSAGE_TYPE_META = SysMessageTypeEnumMeta;

export const NOTICE_MESSAGE_TYPE_HELPER = {
  getByCode(code: number | undefined | null) {
    if (code == null) return null;
    return Object.values(NOTICE_MESSAGE_TYPE_META).find(item => item.code === code) ?? null;
  },
  getNameByCode(code: number | undefined | null): string {
    return this.getByCode(code)?.name ?? "未知";
  }
};

export const NOTICE_NOTICE_TYPE_META = SysNoticeTypeEnumMeta;

export const NOTICE_NOTICE_TYPE_HELPER = {
  getByCode(code: number | undefined | null) {
    if (code == null) return null;
    return Object.values(NOTICE_NOTICE_TYPE_META).find(item => item.code === code) ?? null;
  },
  getNameByCode(code: number | undefined | null): string {
    return this.getByCode(code)?.name ?? "未知";
  }
};

export const NOTICE_TODO_TYPE_META = SysTodoTypeEnumMeta;

export const NOTICE_TODO_TYPE_HELPER = {
  getByCode(code: number | undefined | null) {
    if (code == null) return null;
    return Object.values(NOTICE_TODO_TYPE_META).find(item => item.code === code) ?? null;
  },
  getNameByCode(code: number | undefined | null): string {
    return this.getByCode(code)?.name ?? "未知";
  }
};

export const NOTICE_TARGET_SCOPE_META = {
  ALL: SysNoticeTargetScopeEnumMeta.ALL,
  OWNER: SysNoticeTargetScopeEnumMeta.OWNER,
  TENANT: SysNoticeTargetScopeEnumMeta.TENANT,
  ROLE: SysNoticeTargetScopeEnumMeta.SPECIFIED_ROLE
} as const;

export const NOTICE_TARGET_SCOPE_HELPER = {
  getByCode(code: number | undefined | null) {
    if (code == null) return null;
    return Object.values(NOTICE_TARGET_SCOPE_META).find(item => item.code === code) ?? null;
  },
  getNameByCode(code: number | undefined | null): string {
    return this.getByCode(code)?.name ?? "未知";
  }
};

export const NOTICE_TODO_PRIORITY_META = SysTodoPriorityEnumMeta;

export const NOTICE_TODO_PRIORITY_HELPER = {
  getByCode(code: number | undefined | null) {
    if (code == null) return null;
    return Object.values(NOTICE_TODO_PRIORITY_META).find(item => item.code === code) ?? null;
  },
  getNameByCode(code: number | undefined | null): string {
    return this.getByCode(code)?.name ?? "未知";
  }
};

export const NOTICE_TODO_STATUS_META = SysTodoStatusEnumMeta;

export const NOTICE_TODO_STATUS_HELPER = {
  getByCode(code: number | undefined | null) {
    if (code == null) return null;
    return Object.values(NOTICE_TODO_STATUS_META).find(item => item.code === code) ?? null;
  },
  getNameByCode(code: number | undefined | null): string {
    return this.getByCode(code)?.name ?? "未知";
  }
};
