import { ElLoading } from "element-plus";

let yeah: any;

export function showLoading(text = "加载中...") {
  yeah = ElLoading.service({
    lock: true,
    text,
    background: "rgba(0,0,0,0.6)"
  });
}

export function hideLoading() {
  yeah?.close();
}

/**
 * 计算两个日期之间的月份差异
 * @param leaseStart 租赁开始日期（格式：YYYY-MM-DD）
 * @param leaseEnd 租赁结束日期（格式：YYYY-MM-DD）
 * @returns 月份差异（整数）
 */
export function calculateMonthsDifference(leaseStart: string, leaseEnd: string): number {
  const startDate = new Date(leaseStart);
  const endDate = new Date(leaseEnd);
  endDate.setDate(endDate.getDate() + 1); // 结束日期设为月底

  // 计算年份差异并转换为月份
  let monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12;

  // 加上月份差异
  monthsDiff += endDate.getMonth() - startDate.getMonth();

  // 如果结束日小于开始日，则需要减去一个月（因为这表示结束时间在开始时间的前一个月）
  if (endDate.getDate() < startDate.getDate()) {
    monthsDiff--;
  }

  return Math.abs(monthsDiff); // 返回正数，即使租赁结束日期早于开始日期
}

/**
 * 检查数组是否只包含字符串元素
 * @param arr 要检查的数组
 * @returns 如果数组只包含字符串元素，则返回true；否则返回false
 */
export function isStringArray(arr: unknown): arr is string[] {
  return Array.isArray(arr) && arr.every(item => typeof item === "string");
}
