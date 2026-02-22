// ==================== 3. src/types/models/house.ts ====================
// 房源相关业务模型

import type { CommunityProps, RoomDetailProps } from "@/types";

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

/** 房源查询参数 */
export interface HouseQueryParams {
  keyword?: string;
  status?: number;
  buildingId?: number;
  floor?: number;
  currentPage?: number;
  pageSize?: number;
}

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

export interface HouseProps {
  id: string; // 房源id
  houseCode: string; // 房源编号
  houseName: string; // 房源名称
  companyId: string; // 公司ID
  deptId: string; // 部门ID
  salesmanId: string; // 业务员ID
  leaseMode: number; // 房源租赁类型：1、集中式；2、整租、3、合租
  leaseModeId: string; // 来源id，集中式为集中式id，整租、合租为community_id
  communityId: string; // 小区ID
  building: string; // 座栋
  unit: string; // 单元
  doorNumber: string; // 门牌号，分散式独有
  houseLayoutId: string; // 户型
  rentalType: number; // 出租类型：1=整租，2=合租
  area: number; // 套内面积
  direction: string; // 朝向
  decorationType: number; // 装修类型：1=豪华装，2=简装，3=精装，4=毛坯，5=清水，6=简约，7=未装修
  floor: number; // 楼层
  floorTotal: number; // 总楼层
  water: string; // 水
  electricity: string; // 电
  heating: string; // 供暖
  hasElevator: boolean; // 是否有电梯
  hasGas: boolean; // 是否有燃气
  propertyFee: number; // 物业费，每月
  heatingFee: number; // 暖气费，每月
  mgmtFee: number; // 管理费，每月
  roomCount: number; // 房间数 为0表示未分配房间
  restRoomCount: number; // 房间余量
  certificateNo: string; // 权属证明及编号
  sharedOwner: boolean; // 是否共有产权  0=否 1=是
  mortgaged: boolean; // 是否抵押  0=否 1=是
  customerId: string; // 客户Id
  houseStatus: number; // 房源状态
  applicationStatus: number; // 审批状态：1-审批中 2-已通过 3-已驳回 4-已撤回
  locked: boolean; // 锁定状态：是否锁定
  closed: boolean; // 禁用状态：是否已禁用
  houseDesc: string; // 房源描述、项目介绍
  businessDesc: string; // 商圈介绍、广告语
  remark: string; // 备注
  createBy: string; // 创建人
  createTime: Date; // 创建时间
  updateBy: string; // 更新人
  updateTime: Date; // 更新时间
}

/**
 * 通用的房源详情页的数据结构
 */
export interface HouseViewDetailProps {
  id: string; // 房源ID
  houseCode: string; // 房源编号
  houseName: string; // 小区名称
  companyId: string; // 公司ID
  deptId: string; // 部门ID
  salesmanId: string; // 业务员ID
  leaseMode: number; // 房源租赁类型：1、集中式；2、整租、3、合租
  leaseModeId: string; // 来源id，集中式为集中式id，整租、合租为community_id
  communityId: string; // 小区ID
  building: string; // 座栋
  unit: string; // 单元
  doorNumber: string; // 门牌号，分散式独有
  houseLayoutId: string; // 户型
  rentalType: number; // 出租类型：1=整租，2=合租
  area: string; // 套内面积
  direction: string; // 朝向
  decorationType: string; // 装修类型：1=豪华装，2=简装，3=精装，4=毛坯，5=清水，6=简约，7=未装修
  floor: number; // 楼层
  floorTotal: number; // 总楼层
  water: "commercial" | "residential";
  electricity: "commercial" | "residential";
  heating: "central" | "independent";
  hasElevator: boolean; // 是否有电梯
  hasGas: boolean; // 是否有燃气
  propertyFee: number; // 物业费，每月
  heatingFee: number; // 暖气费，每月
  mgmtFee: number; // 管理费，每月
  roomCount: number; // 房间数 为0表示未分配房间
  restRoomCount: number; // 房间余量
  certificateNo: string; // 权属证明及编号
  sharedOwner: boolean; // 是否共有产权  0=否 1=是
  mortgaged: boolean; // 是否抵押  0=否 1=是
  customerId: string; // 客户Id
  houseStatus: number; // 房源状态
  locked: boolean; // 锁定状态：是否锁定
  closed: boolean; // 禁用状态：是否已禁用
  houseDesc: string; // 房源描述、项目介绍
  businessDesc: string; // 商圈介绍、广告语
  remark: string; // 备注
  community: CommunityProps; // 住宅小区
  houseLayout: HouseLayoutProps; // 户型，保存合租房源的公共图片、房源配置、图片等信息
  roomList: RoomDetailProps[]; // 合租使用：房间列表，每个房间包含房间号、面积、价格等信息
}
