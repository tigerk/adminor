// ==================== 3. src/types/models/house.ts ====================
// 房源相关业务模型

import type { RoomDetailProps } from "@/types";

/** 户型信息 */
export interface HouseLayoutProps {
  id?: string;
  layoutName?: string;
  bedroom: number;
  livingRoom: number;
  kitchen: number;
  bathroom: number;
  newly?: boolean;
  tags?: number[];
  facilities?: FacilityItemProps[];
  imageList?: string[];
  videoList?: string[];
}

/** 设施配置项 */
export interface FacilityItemProps {
  name: string;
  count: number;
}

/** 房源基本信息 */
export interface HouseInfoProps {
  id?: number;
  houseCode: string; // 房源编号
  rentalType: number; // 出租类型：1=整租，2=合租
  building: string; // 座/栋
  unit: string; // 单元
  doorNumber: string; // 房间号
  houseLayout: HouseLayoutProps; // ⚠️ 使用全局类型
  floor: number; // 所在楼层
  floorTotal: number; // 总楼层数
  direction: string; // 朝向
  area: string; // 面积
  decorationType: string; // 装修类型
  price?: number; // 出租价格
  propertyFee?: number; // 物业费
  moreInfo?: any;
  roomList?: RoomDetailProps[]; // 房间列表
}

/** 房源查询参数 */
export interface HouseQueryParams {
  keyword?: string;
  status?: number;
  buildingId?: number;
  floor?: number;
  currentPage?: number;
  pageSize?: number;
}

export interface PriceConfigProps {
  /** 房间ID */
  roomId: number;
  /** 出房价格（单位：元/月） */
  price: number;
  /** 底价（单位：元/月） */
  floorPrice: number;
  /** 底价方式：1=固定金额，2=按比例 */
  floorPriceMethod: number;
  /** 底价录入值（金额或比例，具体由 low_price_method 决定） */
  floorPriceInput: number;
  /** 其他费用列表 */
  otherFees?: OtherFeeProps[];
  pricePlans: PricePlanProps[];
}

/** 租金费用类型 */
export interface OtherFeeProps {
  /** 其他费用类型（如：装修/维修/房屋维修、随房租付、按固定金额等） */
  dictDataId: string;
  /** 其他费用名称 */
  name: string;
  /** 付款方式（如：随房租付、按固定金额等） */
  paymentMethod: number;
  /** 价格计算方式 */
  priceMethod: number;
  /** 价格输入值 */
  priceInput: number;
}

/** 租金方案配置 */
export interface PricePlanProps {
  /** 房间ID */
  roomId: number;
  /** 租金方案名称 */
  planName: string;
  /** 租金方案类型（如：长期/短租/节假日） */
  planType: string;
  /** 出房价格比例（百分比，如 12.50 表示 12.5%） */
  priceRatio: number;
  /** 出房价格（若为固定价格） */
  price: number;
  /** 其他费用 */
  otherFees?: OtherFeeProps[];
  /** 默认方案 */
  defaultPlan: boolean;
}

/**
 * 租期信息（前端扩展，后端添加后可移除）
 */
export type LeaseInfoDTO = {
  leaseStartDate?: string;
  leaseEndDate?: string;
  availableDate?: string;
  daysUntilAvailable?: number;
  tenantName?: string;
  tenantPhone?: string;
};

/**
 * 小区分组
 */
export type CompoundGroupProps = {
  /** 模式引用ID */
  leaseModeId?: number;
  /** 租赁模式 */
  leaseMode?: number;
  /** 卡片显示名称 */
  displayName?: string;
  /** 小区id */
  communityId?: number;
  /** 小区名称 */
  communityName?: string;
  /** 小区地址 */
  communityAddress?: string;
  /** 总楼栋数 */
  buildingCount?: number;
  /** 总楼层数 */
  floorCount?: number;
  /** 房间数量 */
  roomCount?: number;
  /** 已出租房间数量 */
  leasedCount?: number;
  /** 出租率 */
  occupancyRate?: string;
};

/**
 * 楼栋单元分组
 */
export type BuildingGroupProps = {
  /** 楼栋号 */
  building?: string;
  /** 单元号 */
  unit?: string;
  /** 房间数量 */
  roomCount?: number;
  /** 已出租房间数量 */
  leasedCount?: number;
  /** 出租率 */
  occupancyRate?: string;
};

/**
 * 楼层分组
 */
export type FloorGroupProps = {
  /** 楼层号 */
  floor?: number;
  /** 房间数量 */
  roomCount?: number;
  /** 出租数量 */
  leasedCount?: number;
  /** 出租率 */
  occupancyRate?: string;
};
