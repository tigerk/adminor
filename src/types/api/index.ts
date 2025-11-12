// ==================== 4. src/types/api/index.ts ====================
// 统一导出 API 响应包装

import type { CommunityProps, HouseLayoutProps, RoomInfoProps } from "@/types";

/** ScatterHouseResponse */
export interface ScatterHouseResponse<T = any> {
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
