// ==================== 3. src/types/models/house.ts ====================
// 分散式房源相关业务模型

import type { CommunityProps, HouseInfoProps, HouseLayoutProps, RoomDetailProps } from "@/types";

/** 分散式房源 */
export interface ScatterHouseProps<T = any> {
  id?: number; // 房源ID
  companyId?: number; // 公司ID
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
  deptId?: number; // 部门ID
  salesmanId?: number; // 业务员ID
  roomList?: RoomDetailProps[]; // 合租使用：房间列表，每个房间包含房间号、面积、价格等信息
}

/** 分散式房源表单 */
export interface ScatterCreateProps {
  leaseMode: number;
  rentalType: number; // 出租类型：1=整租，2=合租
  community: CommunityProps | null;
  deptId: number;
  salesmanId: number;
  water: "commercial" | "residential";
  electricity: "commercial" | "residential";
  heating: "central" | "independent";
  hasGas: boolean;
  hasElevator: boolean;
  houseList: ScatterHouseProps[];
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
