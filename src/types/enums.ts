/** 运营模式枚举 */
export enum LeaseModeEnum {
  UNKNOWN = 0, // 未知
  FOCUS = 1, // 集中式
  SCATTER = 2 // 分散式
}

/** 租赁类型枚举 */
export enum RentalTypeEnum {
  ENTIRE = 1, // 整租
  SHARED = 2 // 合租
}

/** 计算方式枚举 */
export enum PriceMethodEnum {
  FIXED = 1, // 按固定金额
  RATIO = 2 // 按租金比例
}
// ==================== 租客相关 ====================

/** 租客类型枚举 */
export enum TenantTypeEnum {
  PERSONAL = 0, // 个人租户
  ENTERPRISE = 1 // 企业租户
}

/** 合同印章来源枚举 */
export enum ContractSealSourceEnum {
  SELF = 1,
  FADADA = 2,
  EQIBAO = 3,
  OTHER = 4
}

/** 合同印章类型枚举 */
export enum ContractSealTypeEnum {
  COMPANY = 1, // 企业
  PERSONAL = 2 // 个人
}
