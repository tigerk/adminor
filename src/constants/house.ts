import { DecorationTypeEnumMeta, LeaseModeEnumMeta, RentalTypeEnumMeta } from "@/types/generated/enum.meta";
export { DIRECTION_OPTIONS } from "@/types/house";

export const LEASE_MODE_OPTIONS = Object.values(LeaseModeEnumMeta)
  .filter(item => item.code !== 0)
  .map(item => ({ label: item.name, value: item.code }));

export const RENTAL_TYPE_OPTIONS = Object.values(RentalTypeEnumMeta).map(item => ({ label: item.name, value: item.code }));

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
