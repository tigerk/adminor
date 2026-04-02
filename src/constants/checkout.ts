import { BizApprovalStatusEnumMeta, CheckoutFeeTypeEnumMeta, CheckoutSettlementMethodEnumMeta, CheckoutStatusEnumMeta, CheckoutTypeEnumMeta } from "@/types/generated/enum.meta";

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
  RENT: CheckoutFeeTypeEnumMeta.RENT.code,
  DEPOSIT: CheckoutFeeTypeEnumMeta.DEPOSIT.code,
  WATER: CheckoutFeeTypeEnumMeta.WATER.code,
  ELECTRIC: CheckoutFeeTypeEnumMeta.ELECTRIC.code,
  GAS: CheckoutFeeTypeEnumMeta.GAS.code,
  PROPERTY_FEE: CheckoutFeeTypeEnumMeta.PROPERTY_FEE.code,
  CLEANING: CheckoutFeeTypeEnumMeta.CLEANING.code,
  DAMAGE: CheckoutFeeTypeEnumMeta.DAMAGE.code,
  PENALTY: CheckoutFeeTypeEnumMeta.PENALTY.code,
  OTHER: CheckoutFeeTypeEnumMeta.OTHER.code,
  RENT_REFUND: CheckoutFeeTypeEnumMeta.RENT_REFUND.code,
  DEPOSIT_REFUND: CheckoutFeeTypeEnumMeta.DEPOSIT_REFUND.code,
  OTHER_REFUND: CheckoutFeeTypeEnumMeta.OTHER_REFUND.code
} as const;

export const SETTLEMENT_METHOD_META = CheckoutSettlementMethodEnumMeta;

export const APPROVAL_STATUS_META = BizApprovalStatusEnumMeta;
