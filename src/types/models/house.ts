// ==================== 3. src/types/models/house.ts ====================
// 房源相关业务模型

import type { CommunityProps } from "@/types";

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
