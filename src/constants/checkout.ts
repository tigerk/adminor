import { BizApprovalStatusEnumMeta, CheckoutSettlementMethodEnumMeta, CheckoutStatusEnumMeta, CheckoutTypeEnumMeta, LeaseBillTypeEnumMeta } from "@/types/generated/enum.meta";

export const CHECKOUT_TYPE_META = CheckoutTypeEnumMeta;

export const CHECKOUT_TYPE_OPTIONS = [
  { label: CHECKOUT_TYPE_META.NORMAL.name, value: CHECKOUT_TYPE_META.NORMAL.code },
  { label: CHECKOUT_TYPE_META.BREACH.name, value: CHECKOUT_TYPE_META.BREACH.code }
] as const;

export const CHECKOUT_STATUS_META = CheckoutStatusEnumMeta;

export const CHECKOUT_STATUS_OPTIONS = [
  { label: CHECKOUT_STATUS_META.DRAFT.name, value: CHECKOUT_STATUS_META.DRAFT.code },
  { label: CHECKOUT_STATUS_META.PENDING.name, value: CHECKOUT_STATUS_META.PENDING.code },
  { label: CHECKOUT_STATUS_META.COMPLETED.name, value: CHECKOUT_STATUS_META.COMPLETED.code },
  { label: CHECKOUT_STATUS_META.CANCELLED.name, value: CHECKOUT_STATUS_META.CANCELLED.code }
] as const;

export enum FEE_DIRECTION_ENUM {
  DEDUCTION = 1, // 扣款（租客应付）
  REFUND = 2 // 退款（退还租客）
}

export const CHECKOUT_FEE_TYPE_CODE_MAP = {
  RENT: LeaseBillTypeEnumMeta.RENT.code,
  DEPOSIT: LeaseBillTypeEnumMeta.DEPOSIT.code,
  OTHER_FEE: LeaseBillTypeEnumMeta.OTHER_FEE.code,
  WATER: LeaseBillTypeEnumMeta.OTHER_FEE.code,
  ELECTRIC: LeaseBillTypeEnumMeta.OTHER_FEE.code,
  GAS: LeaseBillTypeEnumMeta.OTHER_FEE.code,
  PROPERTY_FEE: LeaseBillTypeEnumMeta.OTHER_FEE.code,
  CLEANING: LeaseBillTypeEnumMeta.OTHER_FEE.code,
  DAMAGE: LeaseBillTypeEnumMeta.OTHER_FEE.code,
  PENALTY: LeaseBillTypeEnumMeta.OTHER_FEE.code,
  OTHER: LeaseBillTypeEnumMeta.OTHER_FEE.code,
  RENT_REFUND: LeaseBillTypeEnumMeta.RENT.code,
  DEPOSIT_REFUND: LeaseBillTypeEnumMeta.DEPOSIT.code,
  OTHER_REFUND: LeaseBillTypeEnumMeta.OTHER_FEE.code
} as const;

export const LEASE_BILL_TYPE_META = LeaseBillTypeEnumMeta;

export const SETTLEMENT_METHOD_META = CheckoutSettlementMethodEnumMeta;

export const APPROVAL_STATUS_META = BizApprovalStatusEnumMeta;
