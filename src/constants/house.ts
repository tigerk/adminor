import { DecorationTypeEnumMeta, LeaseModeEnumMeta, RentalTypeEnumMeta } from "@/types/generated/enum.meta";

export const LEASE_MODE_OPTIONS = Object.values(LeaseModeEnumMeta)
  .filter(item => item.code !== 0)
  .map(item => ({ label: item.name, value: item.code }));

export const RENTAL_TYPE_OPTIONS = Object.values(RentalTypeEnumMeta).map(item => ({ label: item.name, value: item.code }));

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

export const DECORATION_TYPE_OPTIONS = Object.values(DecorationTypeEnumMeta).map(item => ({ label: item.name, value: item.code }));

export const WATER_TYPE_OPTIONS = [
  { label: "民用水", value: "residential" },
  { label: "商业用水", value: "commercial" }
] as const;

export const ELECTRICITY_TYPE_OPTIONS = [
  { label: "民用电", value: "residential" },
  { label: "商业用电", value: "commercial" }
] as const;

export const HEATING_TYPE_OPTIONS = [
  { label: "独立供暖", value: "independent" },
  { label: "集中供暖", value: "central" }
] as const;
