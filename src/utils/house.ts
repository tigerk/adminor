import { DECORATION_TYPE_OPTIONS, DIRECTION_OPTIONS, ELECTRICITY_TYPE_OPTIONS, RENTAL_TYPE_OPTIONS, WATER_TYPE_OPTIONS } from "@/constants";
import { HouseLayoutDto } from "@/types";

/**
 * 显示装修类型的label
 *
 * @param val
 * @returns
 */
export const getDecorationLabel = (val?: number | string) => {
  if (val === undefined || val === null || val === "") return "-";
  return DECORATION_TYPE_OPTIONS.find(item => item.value === Number(val))?.label || "-";
};

export const getDirectionLabel = (val?: string) => {
  if (!val) return "-";
  return DIRECTION_OPTIONS.find(item => item.value === val)?.label || val;
};

export const getRentalTypeLabel = (val?: number) => {
  if (val == null) return "-";
  return RENTAL_TYPE_OPTIONS.find(item => item.value === val)?.label || "-";
};

export const getWaterTypeLabel = (val?: string) => {
  if (val == null) return "-";
  return WATER_TYPE_OPTIONS.find(item => item.value === val)?.label || "-";
};

export const getHouseLayoutName = (houseLayout?: HouseLayoutDto) => {
  if (houseLayout == null) return "-";

  const { bedroom, livingRoom, kitchen, bathroom } = houseLayout;

  return `${bedroom}室${livingRoom}厅${kitchen}厨${bathroom}卫`;
};

/**
 * Returns the label for a given electricity type value.
 * If the value is not provided or does not match any known electricity type, returns a dash ("-").
 *
 * @param {string} [val] - The value of the electricity type to find the label for.
 * @returns {string} The label of the electricity type, or "-" if not found or if `val` is null or undefined.
 */
export const getElectricityTypeLabel = (val?: string) => {
  if (val == null) return "-";
  return ELECTRICITY_TYPE_OPTIONS.find(item => item.value === val)?.label || "-";
};

/**
 * 计算租赁时长，返回格式化的租赁时长字符串。
 * 如果开始日期或结束日期任一未提供，则返回空字符串。
 * 租赁时长以"年"和/或"月"的形式表示。
 *
 * @param {Date | string} [start] - 租赁的开始日期，可以是 Date 对象或表示日期的字符串。
 * @param {Date | string} [end] - 租赁的结束日期，可以是 Date 对象或表示日期的字符串。
 * @returns {string} 格式化的租赁时长字符串，例如 "(1年3个月)" 或 "(6个月)"。如果无法计算时长则返回空字符串。
 */
export const calcLeaseDuration = (start?: Date | string, end?: Date | string) => {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);
  const diffMonths = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  if (diffMonths >= 12) {
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    return months > 0 ? `(${years}年${months}月)` : `(${years}年)`;
  }
  return diffMonths > 0 ? `(${diffMonths}月)` : "";
};
