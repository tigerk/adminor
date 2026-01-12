// ==================== 3. src/types/models/house.ts ====================
// 房源相关业务模型

import type { CommunityProps } from "@/types";

/** 分散式房源 */
export interface ScatterHouseProps<T = any> {
  id: number; // 房源ID
  companyId: number; // 公司ID
  leaseMode: number; // 房源租赁类型：1、集中式；2、分散式
  community: CommunityProps; // 住宅小区
  houseCode: string; // 房源编号
  rentalType: number; // 出租类型：1=整租，2=合租
  building: string; // 座栋
  unit: string; // 单元
  doorNumber: string; // 门牌号
  floor: number; // 楼层
  floorTotal: number; // 总楼层
  direction: string; // 朝向
  area: string; // 面积
  decorationType: string; // 装修类型
  propertyFee: number; // 物业费
  water: any; // 水
  electricity: any; // 电
  heating: any; // 供暖
  hasElevator: boolean; // 是否有电梯
  hasGas: boolean; // 是否有燃气
  houseLayout: HouseLayoutProps; // 户型，保存合租房源的公共图片、房源配置、图片等信息
  deptId: number; // 部门ID
  salesmanId: number; // 业务员ID
  locked: boolean; // 锁定状态：是否锁定
  closed: boolean; // 禁用状态：是否已禁用
  roomList?: RoomInfoProps[]; // 房间列表
}

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

/** 房源状态 */
export interface FocusHouseStatusProps {
  id?: number;
  building: string;
  unit: string;
  cursor: string;
  houseIndex: number;
  doorNumber: string;
  closed: boolean;
  locked: boolean;
  floor: number;
  houseLayoutId?: string;
  price: number;
  direction: string;
  area: number;
}

/** 楼栋配置 */
export interface FocusBuildingProps {
  building: string;
  unit: string;
  floorTotal: number;
  houseCountPerFloor: number;
  closedFloors: number[];
  closedHouses: FocusHouseStatusProps[];
  selectedFloor: number;
  housePrefix: string;
  excludeFour: boolean;
  numberLength: number;
  housesStatusOfFloors: Map<number, Map<string, FocusHouseStatusProps>>;
  isNew?: boolean;
}

/** 房源基本信息 */
export interface HouseInfoProps {
  id?: number;
  houseCode: string; // 房源编号
  building: string; // 座/栋
  unit: string; // 单元
  doorNumber: string; // 房间号
  floor: number; // 所在楼层
  floorTotal: number; // 总楼层数
  houseLayout: HouseLayoutProps; // ⚠️ 使用全局类型
  rentalType: number; // 出租类型：1=整租，2=合租
  direction: string; // 朝向
  area: string; // 面积
  decorationType: string; // 装修类型
  price?: number; // 出租价格
  propertyFee?: number; // 物业费
  moreInfo?: any;
  roomList?: RoomInfoProps[]; // 房间列表
}

/** 集中式项目表单 */
export interface FocusFormItemProps {
  id: number;
  businessMode: number;
  focusCode: string;
  focusName: string;
  community: CommunityProps; // ⚠️ 使用全局类型
  address: string;
  buildings: FocusBuildingProps[]; // ⚠️ 使用全局类型
  houseList: FocusHouseStatusProps[]; // ⚠️ 使用全局类型
  deptId: number;
  salesmanId: number;
  storePhone: string;
  water: string;
  electricity: string;
  heating: string;
  hasGas: boolean;
  hasElevator: boolean;
  facilities: string[];
  houseDesc: string;
  businessDesc: string;
  tags: string[];
  remark: string;
  imageList: any[];
  houseLayoutList: HouseLayoutProps[]; // ⚠️ 使用全局类型
}

/** 整租房源表单 */
export interface EntireFormItemProps {
  id: number;
  leaseMode: number;
  community: CommunityProps | null;
  water: "commercial" | "residential";
  electricity: "commercial" | "residential";
  heating: "central" | "independent";
  hasGas: boolean;
  hasElevator: boolean;
  houseList: HouseInfoProps[];
  deptId: number;
  salesmanId: number;
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

/** 合租房源表单 */
export interface ShareFormItemProps {
  id: number;
  businessMode?: number;
  leaseMode?: number;
  community: CommunityProps | null;
  water: "commercial" | "residential";
  electricity: "commercial" | "residential";
  heating: "central" | "independent";
  hasGas: boolean;
  hasElevator: boolean;
  houseList: HouseInfoProps[];
  deptId: number;
  salesmanId: number;
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

export type RoomTotal = {
  code: number;
  message: string;
  data?: {
    statusList: any;
  };
};

export interface RoomInfoProps {
  id?: number;
  roomNumber: string; // 房间名称
  roomType: number;
  direction: string;
  area: number;
  price: number;
  tags?: number[];
  facilities?: FacilityItemProps[];
  imageList?: string[];
  videoList?: string[];
  priceConfig?: PriceConfigProps;
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
 * 房间项数据传输对象
 */
export type RoomListProps = {
  /** 房间id */
  roomId?: number;
  /** 房源ID */
  houseId?: number;
  /** 小区ID */
  communityId?: number;
  /** 小区名称 */
  communityName?: string;
  /** 房源编号 */
  houseCode?: string;
  /** 房源名称 */
  houseName?: string;
  /** 门牌号 */
  doorNumber?: string;
  /** 出租状态 */
  rentalType?: number;
  /** 来源id */
  leaseModeId?: number;
  /** 房源租赁类型：1、集中式；2、分散式 */
  leaseMode?: number;
  /** 房型 */
  houseLayout?: HouseLayoutProps;
  /** 部门id */
  deptId?: number;
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
  leaseInfo?: LeaseInfoDTO;
  /** 是否有阳台（前端扩展） */
  balcony?: boolean;
  /** 房间标签 */
  roomLabel?: string;
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
