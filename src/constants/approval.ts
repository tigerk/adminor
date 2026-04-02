import {
  ApprovalActionStatusEnumMeta,
  ApprovalActionTypeEnumMeta,
  ApprovalBizTypeEnumMeta,
  ApprovalInstanceStatusEnumMeta
} from "@/types/generated/enum.meta";

export const APPROVAL_ACTION_TYPE_META = ApprovalActionTypeEnumMeta;

export const APPROVAL_ACTION_TYPE_META_HELPER = {
  getByCode(code: number | undefined | null) {
    if (code == null) return null;
    return Object.values(APPROVAL_ACTION_TYPE_META).find(item => item.code === code) ?? null;
  },
  getNameByCode(code: number | undefined | null): string {
    return this.getByCode(code)?.name ?? "未知";
  },
  isApprove: (code: number | undefined | null) => code === APPROVAL_ACTION_TYPE_META.APPROVE.code,
  isReject: (code: number | undefined | null) => code === APPROVAL_ACTION_TYPE_META.REJECT.code,
  isTransfer: (code: number | undefined | null) => code === APPROVAL_ACTION_TYPE_META.TRANSFER.code
};

export const APPROVAL_ACTION_STATUS_META = ApprovalActionStatusEnumMeta;

export const APPROVAL_ACTION_STATUS_META_HELPER = {
  getByCode(code: number | undefined | null) {
    if (code == null) return null;
    return Object.values(APPROVAL_ACTION_STATUS_META).find(item => item.code === code) ?? null;
  },
  getNameByCode(code: number | undefined | null): string {
    return this.getByCode(code)?.name ?? "未知";
  },
  isPending: (code: number | undefined | null) => code === APPROVAL_ACTION_STATUS_META.PENDING.code,
  isApproved: (code: number | undefined | null) => code === APPROVAL_ACTION_STATUS_META.APPROVED.code,
  isSkipped: (code: number | undefined | null) => code === APPROVAL_ACTION_STATUS_META.SKIPPED.code
};

export const APPROVAL_INSTANCE_STATUS_MAP = {
  DRAFT: { ...ApprovalInstanceStatusEnumMeta.DRAFT, type: "info" },
  PENDING: { ...ApprovalInstanceStatusEnumMeta.PENDING, type: "warning" },
  APPROVED: { ...ApprovalInstanceStatusEnumMeta.APPROVED, type: "success" },
  REJECTED: { ...ApprovalInstanceStatusEnumMeta.REJECTED, type: "danger" },
  WITHDRAWN: { ...ApprovalInstanceStatusEnumMeta.WITHDRAWN, type: "info" },
  CANCELLED: { ...ApprovalInstanceStatusEnumMeta.CANCELLED, type: "info" }
} as const;

type ApprovalInstanceStatusType = (typeof APPROVAL_INSTANCE_STATUS_MAP)[keyof typeof APPROVAL_INSTANCE_STATUS_MAP]["type"];

export const APPROVAL_INSTANCE_STATUS_MAP_HELPER = {
  getByCode(code: number | undefined | null) {
    if (code == null) return null;
    return Object.values(APPROVAL_INSTANCE_STATUS_MAP).find(item => item.code === code) ?? null;
  },
  getNameByCode(code: number | undefined | null): string {
    return this.getByCode(code)?.name ?? "未知";
  },
  getTypeByCode(code: number | undefined | null): ApprovalInstanceStatusType | "" {
    return this.getByCode(code)?.type ?? "";
  },
  isDraft: (code: number | undefined | null) => code === APPROVAL_INSTANCE_STATUS_MAP.DRAFT.code,
  isPending: (code: number | undefined | null) => code === APPROVAL_INSTANCE_STATUS_MAP.PENDING.code,
  isApproved: (code: number | undefined | null) => code === APPROVAL_INSTANCE_STATUS_MAP.APPROVED.code,
  isRejected: (code: number | undefined | null) => code === APPROVAL_INSTANCE_STATUS_MAP.REJECTED.code,
  isWithdrawn: (code: number | undefined | null) => code === APPROVAL_INSTANCE_STATUS_MAP.WITHDRAWN.code,
  isCancelled: (code: number | undefined | null) => code === APPROVAL_INSTANCE_STATUS_MAP.CANCELLED.code,
  isFinal: (code: number | undefined | null) =>
    code === APPROVAL_INSTANCE_STATUS_MAP.APPROVED.code ||
    code === APPROVAL_INSTANCE_STATUS_MAP.REJECTED.code ||
    code === APPROVAL_INSTANCE_STATUS_MAP.WITHDRAWN.code ||
    code === APPROVAL_INSTANCE_STATUS_MAP.CANCELLED.code
};

export const APPROVAL_BIZ_TYPE_META = ApprovalBizTypeEnumMeta;

export const APPROVAL_BIZ_TYPE_META_HELPER = {
  getByCode(code: string | undefined | null) {
    if (code == null) return null;
    return Object.values(APPROVAL_BIZ_TYPE_META).find(item => item.code === code) ?? null;
  },
  getNameByCode(code: string | undefined | null): string {
    return this.getByCode(code)?.name ?? "未知";
  },
  isTenantCheckin: (code: string | undefined | null) => code === APPROVAL_BIZ_TYPE_META.TENANT_CHECKIN.code,
  isTenantCheckout: (code: string | undefined | null) => code === APPROVAL_BIZ_TYPE_META.TENANT_CHECKOUT.code,
  isHouseCreate: (code: string | undefined | null) => code === APPROVAL_BIZ_TYPE_META.HOUSE_CREATE.code
};
