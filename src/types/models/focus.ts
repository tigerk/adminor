// ==================== 3. src/types/models/house.ts ====================
// 集中式房源相关业务模型

import type { CommunityProps, HouseLayoutProps } from "@/types";

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
