import { GenderEnumMeta, IdTypeEnumMeta, TenantTypeEnumMeta } from "@/types/generated/enum.meta";

/**
 * Constants naming rules:
 * - `*_META`: direct backend-synced enum metadata
 * - `*_MAP`: frontend-extended mapping with extra UI/business fields
 * - `*_META_HELPER` / `*_MAP_HELPER`: helper methods bound to the corresponding source
 * - `*_CODE_MAP`: flat key-to-code mapping for direct comparisons/assignment
 * - `*_OPTIONS`: UI option lists for selects, radios, and filters
 */

export * from "./house";
export * from "./room";
export * from "./lease";
export * from "./delivery";
export * from "./approval";
export * from "./notice";
export * from "./checkout";
export * from "./booking";

export function getOptionByCode(options: any[], code: any) {
  return options.find(item => item.value === code);
}

export function getOptionNameByCode(options: readonly { label: string; value: any }[], code: any) {
  if (!code) return "";
  return options.find(item => item.value === code)?.label || "";
}

export const GENDER_OPTIONS = Object.values(GenderEnumMeta)
  .filter(item => item.code !== GenderEnumMeta.UNKNOWN.code)
  .map(item => ({ label: item.name, value: item.code }));
export const ID_TYPE_OPTIONS = Object.values(IdTypeEnumMeta).map(item => ({ label: item.name, value: item.code }));
export const TENANT_TYPE_OPTIONS = Object.values(TenantTypeEnumMeta).map(item => ({ label: item.name, value: item.code }));
