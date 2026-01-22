/**
 * 交割单状态枚举
 */
export const DELIVERY_STATUS_ENUM = {
  CANCELLED: {
    code: -1,
    name: "作废",
    color: "#909399"
  },
  /**
   * 待填写
   */
  DRAFT: {
    code: 0,
    name: "待填写",
    color: "#409EFF"
  },
  /**
   * 已填写
   */
  COMPLETED: {
    code: 1,
    name: "已填写",
    color: "#67C23A"
  },
  SIGNED: {
    code: 2,
    name: "已签署",
    color: "#E6A23C"
  }
} as const;

/**
 * 交割类型选项
 */
export const DELIVERY_TYPE_OPTIONS = [
  { label: "入住交割", value: "check_in" },
  { label: "退租交割", value: "check_out" }
] as const;

/**
 * 交割单物品分类
 */
export const DELIVERY_ITEM_CATEGORY = {
  UTILITY: "UTILITY", // 水电燃气
  FACILITY: "FACILITY" // 设施
} as const;
