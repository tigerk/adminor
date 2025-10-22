// src/views/house/components/FocusCreate/utils/types.ts

// 设施配置项
interface FacilityItemProps {
  name: string;
  count: number;
}

// 房型定义 - 添加 tags 和 facilities 字段
interface HouseLayoutProps {
  id: string;
  layoutName: string;
  bedroom: number;
  livingRoom: number;
  kitchen: number;
  bathroom: number;
  newly: boolean;
  tags?: number[]; // 新增：房源特色标签ID数组
  facilities?: FacilityItemProps[]; // 新增：房源配置列表
}

// ... 其他类型定义保持不变
interface CommunityProps {
  name: string;
  address: string;
  cityId: number;
  adcode: number;
  district: string;
  location: string;
}

interface FocusFormItemProps {
  id: number;
  businessMode: number;
  focusCode: string;
  focusName: string;
  community: CommunityProps;
  address: string;
  buildings: FocusBuildingProps[];
  houseList: HouseStatusProps[];
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
  houseLayoutList: HouseLayoutProps[];
}

interface FormProps {
  formInline: FocusFormItemProps;
}

interface HouseStatusProps {
  id?: number;
  building: string;
  unit: string;
  cursor: string;
  houseIndex: number;
  doorNumber: string;
  closed: boolean;
  floor: number;
  houseLayoutId: string;
  price: number;
  direction: string;
  area: number;
}

interface FocusBuildingProps {
  building: string;
  unit: string;
  floorTotal: number;
  houseCountPerFloor: number;
  closedFloors: number[];
  closedHouses: HouseStatusProps[];
  selectedFloor: number;
  housePrefix: string;
  excludeFour: boolean;
  numberLength: number;
  housesStatusOfFloors: Map<number, Map<string, HouseStatusProps>>;
  isNew: boolean;
}

export type { FocusFormItemProps, FormProps, HouseStatusProps, FocusBuildingProps, HouseLayoutProps, FacilityItemProps };
