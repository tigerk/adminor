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
interface FacilityItemProps {
  name: string;
  count: number;
}

export default FacilityItemProps;

/** 房源状态 */
export interface FocusHouseStatusProps {
  id?: number;
  building: string;
  unit: string;
  cursor: string;
  houseIndex: number;
  doorNumber: string;
  closed: boolean;
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
export interface HouseBasicInfoProps {
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
  price: string; // 出租价格
  propertyFee: string; // 物业费
  moreInfo: any;
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
  businessMode: number;
  community: CommunityProps | null;
  water: "commercial" | "residential";
  electricity: "commercial" | "residential";
  heating: "central" | "independent";
  hasGas: boolean;
  hasElevator: boolean;
  houseList: HouseBasicInfoProps[];
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
  businessMode: number;
  community: CommunityProps | null;
  water: "commercial" | "residential";
  electricity: "commercial" | "residential";
  heating: "central" | "independent";
  hasGas: boolean;
  hasElevator: boolean;
  houseList: HouseBasicInfoProps[];
  deptId: number;
  salesmanId: number;
}
