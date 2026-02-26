/**
 * 房间类型选项
 */
export const ROOM_TYPE_OPTIONS = [
  { label: "主卧", value: 1 },
  { label: "次卧", value: 2 },
  { label: "隔断", value: 3 },
  { label: "厅隔", value: 4 },
  { label: "单间配套", value: 5 },
  { label: "单间", value: 6 },
  { label: "双人间", value: 7 },
  { label: "多人间", value: 8 }
] as const;

/**
 * 房间状态选项
 */
export const ROOM_STATUS_OPTIONS = [
  { label: "空置", value: 0 },
  { label: "已租", value: 1 },
  { label: "已预定", value: 2 },
  { label: "配置中", value: 3 },
  { label: "已关闭", value: 4 },
  { label: "锁房", value: 5 }
] as const;

/* 房间状态枚举 */
export const ROOM_STATUS_ENUM = {
  AVAILABLE: {
    code: 0,
    name: "空置",
    color: "#FF2800"
  },
  LEASED: {
    code: 1,
    name: "已租",
    color: "#52C41A"
  },
  BOOKED: {
    code: 2,
    name: "已预定",
    color: "#EAA212"
  },
  PREPARING: {
    code: 3,
    name: "配置中",
    color: "#4B50AD"
  },
  CLOSED: {
    code: 4,
    name: "已关闭",
    color: "#DBDBDB"
  },
  LOCKED: {
    code: 5,
    name: "锁房",
    color: "#8C8C8C"
  }
} as const;

/**
 * 金额计算方式
 */
export const PRICE_METHOD_OPTIONS = [
  { label: "按固定金额", value: 1 },
  { label: "按租金比例", value: 2 }
] as const;

/**
 * 付款方式
 */
export const PAYMENT_METHOD_OPTIONS = [
  { label: "随房租付", value: 0 },
  { label: "一次性全支付", value: 1 },
  { label: "月付", value: 2 },
  { label: "2月付", value: 3 },
  { label: "季付", value: 4 },
  { label: "半年付", value: 5 },
  { label: "年付", value: 6 }
] as const;

export const PRICE_PLANT_OPTIONS = [
  { label: "月付", value: 0 },
  { label: "2月付", value: 1 },
  { label: "季付", value: 2 },
  { label: "半年付", value: 3 },
  { label: "年付", value: 4 }
] as const;
