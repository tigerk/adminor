// ==================== 3. src/types/models/house.ts ====================
// 房间相关业务模型

import type { BuildingGroupProps, CompoundGroupProps, FacilityItemProps, FloorGroupProps, HouseLayoutProps, RoomLeaseInfoProps, PriceConfigProps } from "@/types";

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
}

/**
 * 房间项数据传输对象
 */
export type RoomListProps = {
  /** 房间id */
  roomId?: bigint;
  /** 房源ID */
  houseId?: bigint;
  /** 小区ID */
  communityId?: bigint;
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
  leaseModeId?: bigint;
  /** 房源租赁类型：1、集中式；2、分散式 */
  leaseMode?: number;
  /** 房型 */
  houseLayout?: HouseLayoutProps;
  /** 部门id */
  deptId?: bigint;
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
  companyId?: bigint;
  /** 小区ID */
  communityId?: bigint;
  /** 房间ID列表 */
  roomIds?: bigint[];
  /** 空间查询参数 */
  spatialQuery?: any[];
  /** 房源租赁类型：1、集中式；2、整租、3、合租 */
  leaseMode?: number;
  /** 模式引用ID */
  leaseModeId?: bigint;
  /** 搜索关键字 */
  keywords?: string;
  /** 房间状态 */
  roomStatus?: number;
  /** 当前页数 */
  currentPage?: number;
  /** 每页显示条目个数 */
  pageSize?: number;
};
