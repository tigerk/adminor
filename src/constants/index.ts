// src/constants/house.ts

/**
 * 房屋朝向选项
 */
export const DIRECTION_OPTIONS = [
  { label: "东", value: "东" },
  { label: "南", value: "南" },
  { label: "西", value: "西" },
  { label: "北", value: "北" },
  { label: "东南", value: "东南" },
  { label: "西南", value: "西南" },
  { label: "东北", value: "东北" },
  { label: "西北", value: "西北" }
] as const;

/**
 * 装修类型选项
 */
export const DECORATION_TYPE_OPTIONS = [
  { label: "豪华装", value: "豪华装" },
  { label: "简装", value: "简装" },
  { label: "精装", value: "精装" },
  { label: "毛坯", value: "毛坯" },
  { label: "清水", value: "清水" },
  { label: "简约", value: "简约" },
  { label: "未装修", value: "未装修" }
] as const;

/**
 * 用水类型选项
 */
export const WATER_TYPE_OPTIONS = [
  { label: "民用水", value: "residential" },
  { label: "商业用水", value: "commercial" }
] as const;

/**
 * 用电类型选项
 */
export const ELECTRICITY_TYPE_OPTIONS = [
  { label: "民用电", value: "residential" },
  { label: "商业用电", value: "commercial" }
] as const;

/**
 * 供暖类型选项
 */
export const HEATING_TYPE_OPTIONS = [
  { label: "独立供暖", value: "independent" },
  { label: "集中供暖", value: "central" }
] as const;
