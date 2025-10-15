import type { FacilityItemProps } from "@/views/house/components/HouseFacility/types";

interface CommunityProps {
  name: string;
  address: string;
  cityId: number;
  // 行政区域
  adcode: number;
  district: string;
  location: string;
}

// 户型数据结构
interface HouseLayoutProps {
  id: string;
  layoutName: string;
  bedroom: number;
  livingRoom: number;
  kitchen: number;
  bathroom: number;
  newly: boolean;
}

// 房源信息
interface HouseItemProps {
  houseCode: string; // 房源编号
  building: string; // 座/栋
  unit: string; // 单元
  doorNumber: string; // 房间号
  floor: number; // 所在楼层
  totalFloor: number; // 总楼层数
  houseLayout: HouseLayoutProps; // 户型
  rentalType: number; // 出租类型：1=整租，2=合租
  direction: string; // 朝向
  area: string; // 面积
  decorationType: string; // 装修类型
  price: string; // 出租价格
  propertyFee: string; // 物业费
  facilities: FacilityItemProps[];
  images: any[];
  moreInfo: any;
}

// 表单定义
interface EntireFormItemProps {
  id: number;
  businessMode: number;
  focusCode: string;
  focusName: string;
  address: string;
  community: CommunityProps;
  water: string;
  electricity: string;
  heating: string;
  hasGas: boolean;
  hasElevator: boolean;
  facilities: string[];
  houseList?: HouseItemProps[]; // 房源列表
  deptId: number;
  salesmanId: number;
}

// 表单
interface EntireFormProps {
  formInline: EntireFormItemProps;
}

export type { EntireFormItemProps, EntireFormProps, HouseItemProps, CommunityProps };
