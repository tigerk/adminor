import { PAYMENT_METHOD_OPTIONS, PRICE_METHOD_OPTIONS } from "@/constants";
import type {
  OwnerBearTypeEnum,
  OwnerCooperationModeEnum,
  OwnerContractSubjectTypeEnum,
  OwnerFreeCalcModeEnum,
  OwnerFreeTypeEnum,
  OwnerIncomeBasisEnum,
  OwnerProrateTypeEnum,
  OwnerSettlementModeEnum,
  OwnerSignStatusEnum,
  OwnerTypeEnum
} from "@/types/generated";
import {
  OwnerBearTypeEnumMeta,
  OwnerCooperationModeEnumMeta,
  OwnerContractSubjectTypeEnumMeta,
  OwnerFreeCalcModeEnumMeta,
  OwnerFreeTypeEnumMeta,
  OwnerIncomeBasisEnumMeta,
  OwnerProrateTypeEnumMeta,
  OwnerSignStatusEnumMeta,
  OwnerTypeEnumMeta
} from "@/types/generated/enum.meta";
import type { GenderValue, IdTypeValue, OwnerContractMediumValue, OwnerPaymentFeeBearTypeValue, OwnerSettlementTimingValue, OwnerSignTypeValue } from "./ownerContractFormTypes";
import {
  BEAR_TYPE_LABEL_MAP,
  CONTRACT_MEDIUM_LABEL_MAP,
  COOPERATION_MODE_LABEL_MAP,
  FREE_CALC_MODE_LABEL_MAP,
  FREE_TYPE_LABEL_MAP,
  INCOME_BASIS_LABEL_MAP,
  OWNER_TYPE_LABEL_MAP,
  PAYMENT_FEE_BEAR_TYPE_LABEL_MAP,
  PRORATE_TYPE_LABEL_MAP,
  SETTLEMENT_MODE_LABEL_MAP,
  SETTLEMENT_TIMING_LABEL_MAP,
  SIGN_STATUS_LABEL_MAP,
  SIGN_TYPE_LABEL_MAP
} from "./ownerContractFormTypes";

export const ID_TYPE_OPTIONS = [
  { label: "身份证", value: "ID_CARD" as IdTypeValue },
  { label: "护照", value: "PASSPORT" as IdTypeValue },
  { label: "港澳通行证", value: "HONGKONG_MACAO" as IdTypeValue },
  { label: "台胞证", value: "TAIWAN" as IdTypeValue }
];

export const GENDER_OPTIONS = [
  { label: "未知", value: "UNKNOWN" as GenderValue },
  { label: "男", value: "MALE" as GenderValue },
  { label: "女", value: "FEMALE" as GenderValue }
];

export const OWNER_TYPE_OPTIONS = [
  { label: OWNER_TYPE_LABEL_MAP.PERSONAL, value: OwnerTypeEnumMeta.PERSONAL.value as OwnerTypeEnum },
  { label: OWNER_TYPE_LABEL_MAP.COMPANY, value: OwnerTypeEnumMeta.COMPANY.value as OwnerTypeEnum }
];

export const COOPERATION_MODE_OPTIONS = [
  { label: COOPERATION_MODE_LABEL_MAP.LIGHT_MANAGED, value: OwnerCooperationModeEnumMeta.LIGHT_MANAGED.value as OwnerCooperationModeEnum },
  { label: COOPERATION_MODE_LABEL_MAP.MASTER_LEASE, value: OwnerCooperationModeEnumMeta.MASTER_LEASE.value as OwnerCooperationModeEnum }
];

export const SIGN_STATUS_OPTIONS = [
  { label: SIGN_STATUS_LABEL_MAP.PENDING, value: OwnerSignStatusEnumMeta.PENDING.value as OwnerSignStatusEnum },
  { label: SIGN_STATUS_LABEL_MAP.SIGNED, value: OwnerSignStatusEnumMeta.SIGNED.value as OwnerSignStatusEnum }
];

export const SETTLEMENT_MODE_OPTIONS = [
  {
    label: SETTLEMENT_MODE_LABEL_MAP.FIXED,
    value: "FIXED" as OwnerSettlementModeEnum,
    desc: "平台按固定金额给业主，适合托管报价已经谈死的场景。",
    features: ["固定金额", "平台承担波动"]
  },
  {
    label: SETTLEMENT_MODE_LABEL_MAP.SHARE_NET,
    value: "SHARE_NET" as OwnerSettlementModeEnum,
    desc: "先扣约定费用，再把净额按比例分给业主。",
    features: ["先扣费用", "再做分成"]
  },
  {
    label: SETTLEMENT_MODE_LABEL_MAP.GUARANTEE_PLUS_SHARE,
    value: "GUARANTEE_PLUS_SHARE" as OwnerSettlementModeEnum,
    desc: "先给业主保底金额，超出部分再按比例分成。",
    features: ["保底金额", "超额再分"]
  },
  {
    label: SETTLEMENT_MODE_LABEL_MAP.AGENCY,
    value: "AGENCY" as OwnerSettlementModeEnum,
    desc: "平台负责代收代付，最后按约定把剩余款项结给业主。",
    features: ["代收代付", "结余转业主"]
  }
];

export const INCOME_BASIS_OPTIONS = Object.values(OwnerIncomeBasisEnumMeta).map(item => ({
  label: INCOME_BASIS_LABEL_MAP[item.value as OwnerIncomeBasisEnum],
  value: item.value as OwnerIncomeBasisEnum
}));

export const BEAR_TYPE_OPTIONS = Object.values(OwnerBearTypeEnumMeta).map(item => ({
  label: BEAR_TYPE_LABEL_MAP[item.value as OwnerBearTypeEnum],
  value: item.value as OwnerBearTypeEnum
}));

export const FREE_TYPE_OPTIONS = Object.values(OwnerFreeTypeEnumMeta).map(item => ({
  label: FREE_TYPE_LABEL_MAP[item.value as OwnerFreeTypeEnum],
  value: item.value as OwnerFreeTypeEnum
}));

export const LIGHT_MANAGED_CALC_MODE_OPTIONS = Object.values(OwnerFreeCalcModeEnumMeta).map(item => ({
  label: FREE_CALC_MODE_LABEL_MAP[item.value as OwnerFreeCalcModeEnum],
  value: item.value as OwnerFreeCalcModeEnum
}));

export const LEASE_FREE_CALC_MODE_OPTIONS = Object.values(OwnerFreeCalcModeEnumMeta)
  .filter(item => item.value !== "BY_DAYS")
  .map(item => ({
    label: FREE_CALC_MODE_LABEL_MAP[item.value as OwnerFreeCalcModeEnum],
    value: item.value as OwnerFreeCalcModeEnum
  }));

export const PRORATE_TYPE_OPTIONS = Object.values(OwnerProrateTypeEnumMeta).map(item => ({
  label: PRORATE_TYPE_LABEL_MAP[item.value as OwnerProrateTypeEnum],
  value: item.value as OwnerProrateTypeEnum
}));

export const SIGN_TYPE_OPTIONS = [
  { label: SIGN_TYPE_LABEL_MAP.NEW, value: "NEW" as OwnerSignTypeValue },
  { label: SIGN_TYPE_LABEL_MAP.RENEW, value: "RENEW" as OwnerSignTypeValue }
];

export const CONTRACT_MEDIUM_OPTIONS = [
  { label: CONTRACT_MEDIUM_LABEL_MAP.ELECTRONIC, value: "ELECTRONIC" as OwnerContractMediumValue },
  { label: CONTRACT_MEDIUM_LABEL_MAP.PAPER, value: "PAPER" as OwnerContractMediumValue }
];

export const PAYMENT_FEE_BEAR_TYPE_OPTIONS = [
  { label: PAYMENT_FEE_BEAR_TYPE_LABEL_MAP.PLATFORM_ALL, value: "PLATFORM_ALL" as OwnerPaymentFeeBearTypeValue },
  { label: PAYMENT_FEE_BEAR_TYPE_LABEL_MAP.OWNER_ALL, value: "OWNER_ALL" as OwnerPaymentFeeBearTypeValue },
  { label: PAYMENT_FEE_BEAR_TYPE_LABEL_MAP.BY_INCOME_SHARE, value: "BY_INCOME_SHARE" as OwnerPaymentFeeBearTypeValue }
];

export const SETTLEMENT_TIMING_OPTIONS = [
  { label: SETTLEMENT_TIMING_LABEL_MAP.TENANT_PAYMENT_REALTIME, value: "TENANT_PAYMENT_REALTIME" as OwnerSettlementTimingValue },
  { label: SETTLEMENT_TIMING_LABEL_MAP.LEASE_START_GENERATE_BILL, value: "LEASE_START_GENERATE_BILL" as OwnerSettlementTimingValue }
];

export const SUBJECT_TYPE_OPTIONS = [
  {
    label: "整/合租",
    value: OwnerContractSubjectTypeEnumMeta.HOUSE.value as OwnerContractSubjectTypeEnum,
    desc: "逐套选择，适合分散式和单套托管。"
  },
  {
    label: "集中式",
    value: OwnerContractSubjectTypeEnumMeta.FOCUS.value as OwnerContractSubjectTypeEnum,
    desc: "可直接选整项目，也可进入项目勾选多个楼栋。"
  }
];

export const RENT_DUE_TYPE_OPTIONS = [
  { label: "提前收租", value: "EARLY" as const },
  { label: "固定日期付款", value: "FIXED" as const },
  { label: "延后付款", value: "LATE" as const }
];

export const PAYMENT_METHOD_OPTIONS_REF = PAYMENT_METHOD_OPTIONS;
export const PRICE_METHOD_OPTIONS_REF = PRICE_METHOD_OPTIONS;
