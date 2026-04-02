export const DELIVERY_TYPE_OPTIONS = [
  { label: "入住交割", value: "CHECK_IN" },
  { label: "退租交割", value: "CHECK_OUT" }
] as const;

export const DELIVERY_ITEM_CATEGORY = {
  UTILITY: "UTILITY", // 水电燃气
  FACILITY: "FACILITY" // 设施
} as const;
