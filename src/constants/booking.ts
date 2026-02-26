/**
 * 预定状态选项
 * 1=预定中，2=已转合同，3=客户违约（没收定金），4=业主违约（退还定金），5=已取消/过期
 */
export const BOOKING_STATUS_OPTIONS = [
  { label: "预定中", value: 1, color: "#409eff" },
  { label: "已转合同", value: 2, color: "#67c23a" },
  { label: "客户违约", value: 3, color: "#f56c6c" },
  { label: "业主违约", value: 4, color: "#e6a23c" },
  { label: "已取消/过期", value: 5, color: "#909399" }
];

/**
 * 预定状态颜色映射
 */
export const BOOKING_STATUS_COLOR_MAP: Record<number, string> = {
  1: "#409eff", // 预定中 - 蓝色
  2: "#67c23a", // 已转合同 - 绿色
  3: "#f56c6c", // 客户违约 - 红色
  4: "#e6a23c", // 业主违约 - 橙色
  5: "#909399" // 已取消/过期 - 灰色
};
