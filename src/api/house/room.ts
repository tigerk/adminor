import { http } from "@/utils/http";
import { baseUrlApi } from "@/api/utils";

type ResultTable = {
  code: number;
  message: string;
  data?: {
    /** 列表数据 */
    list: Array<any>;
    /** 总条目数 */
    total?: number;
    /** 每页显示条目个数 */
    pageSize?: number;
    /** 当前页数 */
    currentPage?: number;
  };
};

type RoomTotal = {
  code: number;
  message: string;
  data?: {
    statusList: any;
  };
};

/**
 * 房间项数据传输对象
 */
type RoomItemDTO = {
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
  /** 来源id */
  modeRefId?: number;
  /** 房源租赁类型：1、集中式；2、整租、3、合租 */
  leaseMode?: number;
  /** 房型 */
  houseLayout?: any;
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
  area?: string;
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
};

/**
 * 小区分组
 */
type CommunityGroup = {
  /** 小区id */
  communityId?: number;
  /** 小区名称 */
  communityName?: string;
  /** 小区地址 */
  address?: string;
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
type UnitGroup = {
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
type FloorGroup = {
  /** 楼层号 */
  floor?: number;
  /** 房间数量 */
  roomCount?: number;
  /** 出租数量 */
  leasedCount?: number;
  /** 出租率 */
  occupancyRate?: string;
};

type RoomGridItemDTO = {
  communityGroup: CommunityGroup;
  unitGroup: UnitGroup;
  floorGroup: FloorGroup;
  rooms: Array<RoomItemDTO>;
};

type RoomGridDTO = {
  roomGridItemList: Array<RoomGridItemDTO>;
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
};

type ResultRoomGrid = {
  code: number;
  message: string;
  data?: RoomGridDTO;
};

export const getRoomList = (data?: object) => {
  return http.request<ResultTable>("get", baseUrlApi("room/list"), { data });
};

/**
 * 获取房间网格数据
 * @param data
 */
export const getRoomGrid = (data?: object) => {
  return http.request<ResultRoomGrid>("get", baseUrlApi("room/grid"), { data });
};

export const getRoomTotal = (data?: object) => {
  return http.request<RoomTotal>("post", baseUrlApi("room/total"), { data });
};
