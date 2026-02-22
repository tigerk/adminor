// ==================== 3. src/types/models/house.ts ====================
// 房间相关业务模型

import type { BuildingGroupProps, CompoundGroupProps, FacilityItemProps, FloorGroupProps, HouseLayoutProps } from "@/types";

export type RoomTotal = {
  code: number;
  message: string;
  data?: {
    statusList: any;
  };
};

export interface RoomDetailProps {
  id?: number;
  roomNumber: string; // 房间名称
  roomType?: number;
  direction?: string;
  area?: number;
  price: number;
  facilities?: FacilityItemProps[];
  tags?: string[];
  imageList?: string[];
  videoList?: string[];
  priceConfig?: PriceConfigProps;
  /** 租期信息（前端扩展） */
  leaseInfo?: RoomLeaseInfoProps;
}

/**
 * 房间项数据传输对象
 */
export type RoomListProps = {
  /** 房间id */
  roomId?: string;
  /** 房源ID */
  houseId?: string;
  /** 小区ID */
  communityId?: string;
  /** 小区名称 */
  communityName?: string;
  /** 房源编号 */
  houseCode?: string;
  /** 房源名称 */
  houseName?: string;
  /** 门牌号 */
  doorNumber?: string;
  /** 物业费 */
  propertyFee?: number;
  /** 出租状态 */
  rentalType?: number;
  /** 来源id */
  leaseModeId?: string;
  /** 房源租赁类型：1、集中式；2、分散式 */
  leaseMode?: number;
  /** 房型 */
  houseLayout?: HouseLayoutProps;
  /** 部门id */
  deptId?: string;
  /** 部门名称 */
  deptName?: string;
  /** 房间号 */
  roomNumber?: string;
  /** 楼栋号 */
  building?: string;
  /** 单元号 */
  unit?: string;
  /** 楼层 */
  floor?: number;
  /** 出租价格 */
  price?: string;
  /** 设施 */
  facilities?: FacilityItemProps[];
  /** 标签 */
  tags?: string[];
  /** 图片列表 */
  imageList?: string[];
  /** 视频列表 */
  videoList?: string[];
  /** 可出租日期 */
  availableDate?: string;
  /** 空置开始时间 */
  vacancyStartTime?: string;
  /** 面积 */
  area?: number;
  /** 朝向 */
  direction?: string;
  /** 房间状态 */
  roomStatus?: number;
  /** 房间状态，参考：RoomStatusEnum */
  roomStatusName?: string;
  /** 房间状态颜色，参考：RoomStatusEnum */
  roomStatusColor?: string;
  /** 锁定状态 */
  locked?: boolean;
  /** 禁用状态：是否已禁用 */
  closed?: boolean;
  /** 出租状态 */
  leased?: boolean;
  /** 负责人id */
  salesmanId?: string;
  /** 负责人姓名 */
  salesmanName?: string;
  /** 负责人手机号 */
  salesmanPhone?: string;
  /** 租期信息（前端扩展） */
  leaseInfo?: RoomLeaseInfoProps;
  /** 是否有阳台（前端扩展） */
  balcony?: boolean;
  /** 房间标签 */
  roomLabel?: string;
};

export type RoomGridItemProps = {
  /** 区域信息，集中式时，为项目信息，分布式时，为小区信息 */
  compoundGroup: CompoundGroupProps;
  buildingGroup: BuildingGroupProps;
  floorGroup: FloorGroupProps;
  rooms: Array<RoomListProps>;
};

export type RoomGridProps = {
  roomGridItemList: Array<RoomGridItemProps>;
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
};

export type RoomListQueryProps = {
  companyId?: string;
  /** 小区ID */
  communityId?: string;
  /** 房间ID列表 */
  roomIds?: string[];
  /** 空间查询参数 */
  spatialQuery?: any[];
  /** 房源租赁类型：1、集中式；2、整租、3、合租 */
  leaseMode?: number;
  /** 模式引用ID */
  leaseModeId?: string;
  /** 搜索关键字 */
  keywords?: string;
  /** 房间状态 */
  roomStatus?: number;
  /** 当前页数 */
  currentPage?: number;
  /** 每页显示条目个数 */
  pageSize?: number;
};

export interface PriceConfigProps {
  /** 房间ID */
  roomId: string;
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
  roomId: string;
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
export type RoomLeaseInfoProps = {
  leaseStartDate?: string; /**  租期开始日期 */
  leaseEndDate?: string; /**  租期结束日期 */
  arrearsDays?: number; /** 欠费天数 */
  /** 租户姓名 */
  tenantName?: string;
  /** 租户手机号 */
  tenantPhone?: string;
};
