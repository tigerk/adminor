import {
  ContractNatureEnumMeta,
  ContractTemplateStatusEnumMeta,
  ContractTypeEnumMeta,
  LeaseFirstBillDayEnumMeta,
  LeaseRentDueTypeEnumMeta,
  LeaseStatusEnumMeta
} from "@/types/generated/enum.meta";

export const CONTRACT_TYPE_OPTIONS = [
  { label: ContractTypeEnumMeta.TENANT.name, value: ContractTypeEnumMeta.TENANT.code },
  { label: ContractTypeEnumMeta.OWNER.name, value: ContractTypeEnumMeta.OWNER.code },
  { label: ContractTypeEnumMeta.BOOKING.name, value: ContractTypeEnumMeta.BOOKING.code },
  { label: ContractTypeEnumMeta.CHECKOUT.name, value: ContractTypeEnumMeta.CHECKOUT.code }
];

export const CONTRACT_TYPE_META = ContractTypeEnumMeta;

export const CONTRACT_TEMPLATE_STATUS_OPTIONS = Object.values(ContractTemplateStatusEnumMeta).map(item => ({ label: item.name, value: item.code }));

export const LEASE_STATUS_OPTIONS = Object.values(LeaseStatusEnumMeta)
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .map(item => ({ label: item.name, value: item.code }));

export const LEASE_CONTRACT_NATURE_OPTIONS = Object.values(ContractNatureEnumMeta).map(item => ({ label: item.name, value: item.code }));

export const LEASE_CONTRACT_NATURE_STATUS_MAP = {
  NEW: {
    code: ContractNatureEnumMeta.NEW_SIGN.code,
    name: ContractNatureEnumMeta.NEW_SIGN.name,
    color: "#409eff"
  },
  RENEW: {
    code: ContractNatureEnumMeta.RENEWAL.code,
    name: ContractNatureEnumMeta.RENEWAL.name,
    color: "#67c23a"
  },
  TRANSFER: {
    code: ContractNatureEnumMeta.SUBLET.code,
    name: ContractNatureEnumMeta.SUBLET.name,
    color: "#e6a23c"
  },
  CHANGE_ROOM: {
    code: ContractNatureEnumMeta.RELOCATION.code,
    name: ContractNatureEnumMeta.RELOCATION.name,
    color: "#909399"
  }
} as const;

export const LEASE_SIGN_STATUS_OPTIONS = [
  { label: "待签字", value: 0 },
  { label: "已签字", value: 1 }
] as const;

export const RENT_DUE_TYPE_OPTIONS = Object.values(LeaseRentDueTypeEnumMeta).map(item => ({ label: item.name, value: item.code }));

export const FIRST_BILL_DAY_OPTIONS = Object.values(LeaseFirstBillDayEnumMeta).map(item => ({ label: item.name, value: item.code }));

export const LEASE_STATUS_META = LeaseStatusEnumMeta;

export const LEASE_STATUS_MAP = {
  PENDING_APPROVAL: {
    code: LEASE_STATUS_META.PENDING_APPROVAL.code,
    name: LEASE_STATUS_META.PENDING_APPROVAL.name,
    color: LEASE_STATUS_META.PENDING_APPROVAL.color
  },
  TO_SIGN: {
    code: LEASE_STATUS_META.TO_SIGN.code,
    name: LEASE_STATUS_META.TO_SIGN.name,
    color: LEASE_STATUS_META.TO_SIGN.color
  },
  EFFECTIVE: {
    code: LEASE_STATUS_META.EFFECTIVE.code,
    name: LEASE_STATUS_META.EFFECTIVE.name,
    color: LEASE_STATUS_META.EFFECTIVE.color
  },
  TERMINATED: {
    code: LEASE_STATUS_META.TERMINATED.code,
    name: LEASE_STATUS_META.TERMINATED.name,
    color: LEASE_STATUS_META.TERMINATED.color
  },
  VOIDED: {
    code: LEASE_STATUS_META.VOIDED.code,
    name: LEASE_STATUS_META.VOIDED.name,
    color: LEASE_STATUS_META.VOIDED.color
  }
} as const;
