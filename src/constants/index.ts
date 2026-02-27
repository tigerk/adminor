// src/constants/house.ts

export * from "./house";
export * from "./room";
export * from "./lease";
export * from "./delivery";
export * from "./approval";
export * from "./notice";
export * from "./checkout";
export * from "./booking";

/**
 * 根据值获取租赁类型
 * @param options 类型选项数组
 * @param code 类型的值
 * @returns 对应的类型对象或 undefined
 */
export function getOptionByCode(options: any[], code: any) {
  return options.find(item => item.value === code);
}

export function getOptionNameByCode(options: readonly { label: string; value: any }[], code: any) {
  if (!code) return "";
  return options.find(item => item.value === code)?.label || "";
}

/**
 * 性别选项：1-男，2-女
 */
export const GENDER_OPTIONS = [
  { label: "男", value: 1 },
  { label: "女", value: 2 }
] as const;

/**
 * 证件类型选项
 */
export const ID_TYPE_OPTIONS = [
  { label: "身份证", value: 0 },
  { label: "护照", value: 1 },
  { label: "港澳通行证", value: 2 },
  { label: "台胞证", value: 3 }
] as const;

/**
 * 租客类型选项
 */
export const TENANT_TYPE_OPTIONS = [
  { label: "个人", value: 0 },
  { label: "企业", value: 1 }
] as const;
