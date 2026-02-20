// src/utils/date.ts

/**
 * 计算目标时间与当前时间之间的天数差（向上取整）
 * @param targetTime - 目标时间字符串（格式：YYYY-MM-DD）
 * @returns 天数差（当前时间早于目标时间时为负数）
 */
export const getDaysDifference = (targetTime?: string): number => {
  if (!targetTime) return 0;

  try {
    // 1. 将 vacancyStartTime 转换为 Date 对象
    const targetDate = new Date(targetTime);
    // 2. 获取当前时间
    const now = new Date();

    // 3. 计算时间差（毫秒）
    const timeDiff = now.getTime() - targetDate.getTime();

    // 4. 转换为天数（向上取整，确保当天也算1天）
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error("日期格式错误:", error);
    return 0;
  }
};

/**
 * Formats a given date or string into a Chinese date format.
 * If the input is not provided, returns a dash ("-").
 * If the input is a string, it returns the string as is.
 * If the input is a Date object, it converts it to a "zh-CN" locale date string with the format "YYYY.MM.DD".
 *
 * @param {Date | string} [date] - The date to format. Can be a Date object or a string.
 * @returns {string} - A formatted date string in "YYYY.MM.DD" format for Date objects, the original string if a string was passed, or a dash ("-") if no argument was provided.
 */
export const formatDate = (date?: Date | string): string => {
  if (!date) return "-";
  if (typeof date === "string") return date;
  return new Date(date).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).replaceAll("/", ".");
};
