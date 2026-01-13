// src/constants/house.ts

/**
 * 根据值获取租赁类型
 * @param options 类型选项数组
 * @param code 类型的值
 * @returns 对应的类型对象或 undefined
 */
export function getOptionByCode(options: any[], code: any) {
  return options.find(item => item.value === code);
}

/**
 * 房屋朝向选项
 */
export const RENTAL_TYPE_OPTIONS = [
  { label: "整租", value: 1 },
  { label: "合租", value: 2 }
] as const;

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
  { label: "豪华装", value: 1 },
  { label: "简装", value: 2 },
  { label: "精装", value: 3 },
  { label: "毛坯", value: 4 },
  { label: "清水", value: 5 },
  { label: "简约", value: 6 },
  { label: "未装修", value: 7 }
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

/**
 * 房间类型选项
 */
export const ROOM_TYPE_OPTIONS = [
  { label: "主卧", value: 1 },
  { label: "次卧", value: 2 },
  { label: "隔断", value: 3 },
  { label: "厅隔", value: 4 },
  { label: "单间配套", value: 5 },
  { label: "单间", value: 6 },
  { label: "双人间", value: 7 },
  { label: "多人间", value: 8 }
] as const;

/**
 * 房间状态选项
 */
export const ROOM_STATUS_OPTIONS = [
  { label: "空置", value: 0 },
  { label: "已租", value: 1 },
  { label: "已预定", value: 2 },
  { label: "配置中", value: 3 },
  { label: "已关闭", value: 4 },
  { label: "锁房", value: 5 }
] as const;

/**
 * 金额计算方式
 */
export const PRICE_METHOD_OPTIONS = [
  { label: "按固定金额", value: 0 },
  { label: "按租金比例", value: 1 }
] as const;

/**
 * 付款方式
 */
export const PAYMENT_METHOD_OPTIONS = [
  { label: "随房租付", value: 0 },
  { label: "一次性全支付", value: 1 },
  { label: "月付", value: 2 },
  { label: "2月付", value: 3 },
  { label: "季付", value: 4 },
  { label: "半年付", value: 5 },
  { label: "年付", value: 6 }
] as const;

export const PRICE_PLANT_OPTIONS = [
  { label: "月付", value: 0 },
  { label: "2月付", value: 1 },
  { label: "季付", value: 2 },
  { label: "半年付", value: 3 },
  { label: "年付", value: 4 }
] as const;

export const CONTRACT_TYPE_OPTIONS = [
  { label: "全部", value: null },
  { label: "租客合同", value: 1 },
  { label: "房东合同", value: 2 },
  { label: "预定合同", value: 3 }
] as const;

export const CONTRACT_TEMPLATE_STATUS_OPTIONS = [
  { label: "未启用", value: 0 },
  { label: "启用中", value: 1 }
] as const;

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

/**
 * 租客状态选项
 * 租客状态：0=待签字，1=在租中，2=已退租，3=已作废
 */
export const TENANT_STATUS_OPTIONS = [
  { label: "待签字", value: 0 },
  { label: "在租中", value: 1 },
  { label: "已退租", value: 2 },
  { label: "已作废", value: -1 }
] as const;

// 签约类型：1=新签，2=续签，3=转租，4=换房
export const TENANT_CONTRACT_NATURE_OPTIONS = [
  { label: "新签", value: 1 },
  { label: "续签", value: 2 },
  { label: "转租", value: 3 },
  { label: "换房", value: 4 }
] as const;

// 合同状态：0=待签字，1=在租中，2=已退租，3=已作废
export const TENANT_SIGN_STATUS_OPTIONS = [
  { label: "待签字", value: 0 },
  { label: "已签字", value: 1 }
] as const;

// 收租类型：1=提前，2=固定，3=延后
export const RENT_DUE_TYPE_OPTIONS = [
  { label: "提前", value: 1 },
  { label: "固定", value: 2 },
  { label: "延后", value: 3 }
] as const;

// 首期账单收租日：0=跟随合同起租日，1=跟随合同创建日
export const FIRST_BILL_DAY_OPTIONS = [
  { label: "跟随合同起租日", value: 0 },
  { label: "跟随合同创建日", value: 1 }
] as const;

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
