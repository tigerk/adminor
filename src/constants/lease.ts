export const CONTRACT_TYPE_OPTIONS = [
  { label: "租客合同", value: 1 },
  // { label: "房东合同", value: 2 },
  { label: "预定合同", value: 3 },
  { label: "退租合同", value: 4 }
] as const;

export const CONTRACT_TYPE_ENUM = {
  TENANT: 1,
  LANDLORD: 2,
  BOOKING: 3,
  CHECKOUT: 4
} as const;

export const CONTRACT_TEMPLATE_STATUS_OPTIONS = [
  { label: "未启用", value: 0 },
  { label: "启用中", value: 1 }
] as const;

/**
 * 租客状态选项
 * 租客状态：0=待审批，1=待签字，2=在租中，3=已退租，-1=已作废
 */
export const LEAST_STATUS_OPTIONS = [
  { label: "待审批", value: 0 },
  { label: "待签字", value: 1 },
  { label: "在租中", value: 2 },
  { label: "已退租", value: 3 },
  { label: "已作废", value: -1 }
] as const;

// 签约类型：1=新签，2=续签，3=转租，4=换房
export const LEASE_CONTRACT_NATURE_OPTIONS = [
  { label: "新签", value: 1 },
  { label: "续签", value: 2 },
  { label: "转租", value: 3 },
  { label: "换房", value: 4 }
] as const;

export const LEASE_CONTRACT_NATURE_ENUM = {
  NEW: {
    code: 1,
    name: "新签",
    color: "#409eff"
  },
  RENEW: {
    code: 2,
    name: "续签",
    color: "#67c23a"
  },
  TRANSFER: {
    code: 3,
    name: "转租",
    color: "#e6a23c"
  },
  CHANGE_ROOM: {
    code: 4,
    name: "换房",
    color: "#909399"
  }
} as const;

// 合同状态：0=待签字，1=在租中，2=已退租，3=已作废
export const LEASE_SIGN_STATUS_OPTIONS = [
  { label: "待签字", value: 0 },
  { label: "已签字", value: 1 }
] as const;

// 收租类型：1=提前，2=固定，3=延后
export const RENT_DUE_TYPE_OPTIONS = [
  { label: "提前", value: 1 },
  { label: "固定", value: 2 },
  { label: "延后", value: 3 }
] as const;

// 首期账单收租日：0=跟随合同起租日，1=跟随合同创建日
export const FIRST_BILL_DAY_OPTIONS = [
  { label: "跟随合同起租日", value: 0 },
  { label: "跟随合同创建日", value: 1 }
] as const;

/* 租客状态枚举
 * 租客状态：0=待审批，1=待签字，2=在租中，3=已退租，-1=已作废
 */
export const LEASE_STATUS_ENUM = {
  PENDING_APPROVAL: {
    code: 0,
    name: "待审批",
    color: "#FF2800"
  },
  TO_SIGN: {
    code: 1,
    name: "待签字",
    color: "#FF2800"
  },
  EFFECTIVE: {
    code: 2,
    name: "在租中",
    color: "#52C41A"
  },
  TERMINATED: {
    code: 3,
    name: "已退租",
    color: "#EAA212"
  },
  CANCELLED: {
    code: -1,
    name: "已作废",
    color: "#DBDBDB"
  }
} as const;
