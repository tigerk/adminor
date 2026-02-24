// ==================== 3. src/types/models/house.ts ====================
// 分散式房源相关业务模型

import type { CommunityProps, HouseLayoutProps, RoomDetailProps } from "@/types";

/** 分散式房源 */
export interface ScatterHouseProps<T = any> {
  id?: string; // 房源ID
  companyId?: string; // 公司ID
  leaseMode?: number; // 房源租赁类型：1、集中式；2、分散式
  rentalType?: number; // 出租类型：1=整租，2=合租
  community?: CommunityProps; // 住宅小区
  houseCode?: string; // 房源编号
  building?: string; // 座栋
  unit?: string; // 单元
  doorNumber?: string; // 门牌号
  floor?: number; // 楼层
  floorTotal?: number; // 总楼层
  direction?: string; // 朝向
  area?: string; // 面积
  decorationType?: string; // 装修类型
  propertyFee?: number; // 物业费
  water?: any; // 水
  electricity?: any; // 电
  heating?: any; // 供暖
  hasElevator?: boolean; // 是否有电梯
  hasGas?: boolean; // 是否有燃气
  houseLayout?: HouseLayoutProps; // 户型，保存合租房源的公共图片、房源配置、图片等信息
  deptId?: string; // 部门ID
  salesmanId?: string; // 业务员ID
  roomList?: RoomDetailProps[]; // 合租使用：房间列表，每个房间包含房间号、面积、价格等信息
}

/** 分散式房源详情，通过详情接口获取详细信息 */
export interface ScatterHouseDetailProps {
  id: string; // 房源ID
  houseCode: string; // 房源编号
  houseName: string; // 小区名称
  companyId: string; // 公司ID
  deptId: string; // 部门ID
  salesmanId: string; // 业务员ID
  leaseMode: number; // 房源租赁类型：1、集中式；2、分散式
  leaseModeId: string; // 来源id，集中式为集中式id，整租、合租为community_id
  communityId: string; // 小区ID
  building: string; // 座栋
  unit: string; // 单元
  doorNumber: string; // 门牌号
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

/** 分散式房源表单 */
export interface ScatterCreateFormProps {
  id: string;
  leaseMode: number;
  rentalType: number; // 出租类型：1=整租，2=合租
  community: CommunityProps | null;
  deptId: string;
  salesmanId: string;
  water: "commercial" | "residential";
  electricity: "commercial" | "residential";
  heating: "central" | "independent";
  hasGas: boolean;
  hasElevator: boolean;
  houseList: ScatterHouseProps[];
}
