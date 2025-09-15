// 虽然字段很少 但是抽离出来 后续有扩展字段需求就很方便了

// 表单定义
interface FocusFormItemProps {
  id: number;
  businessMode: number;
  houseCode: string;
  houseName: string;
  region: any[];
  address: string;
  buildings: FocusBuildingProps[];
  // 所有房间
  houseList: HouseStatusProps[];
  // 部门id
  deptId: number;
  // 业务员id
  salesmanId: number;
  // extra info
  storePhone: string;
  water: string;
  electricity: string;
  heating: string;
  hasGas: boolean;
  hasElevator: boolean;
  facilities: string[];
  houseDesc: string;
  businessDesc: string;
  // 项目标签
  tags: string[];
  remark: string;
  // 项目文件列表
  imageList: any[];
  houseLayoutList: HouseLayoutProps[];
}

// 表单
interface FormProps {
  formInline: FocusFormItemProps;
}

// 房间状态
interface HouseStatusProps {
  // 座栋
  building: string;
  // 单元
  unit: string;
  // 游标
  cursor: string;
  houseIndex: number;
  // 房源号
  doorNumber: string;
  // 房源锁定状态
  locked: boolean;
  // 楼层
  floor: number;
  // 房源类型id
  houseLayoutId: string;
  // 房源价格
  price: number;
  // 朝向
  direction: string;
  // 面积
  area: number;
}

interface FocusBuildingProps {
  // 座栋
  building: string;
  // 单元
  unit: string;
  // 总楼层
  floorTotal: number;
  // 每个楼层的房源数量
  houseCountPerFloor: number;
  // 关闭的楼层列表
  closedFloors: number[];
  // 关闭的房源
  closedHouses: HouseStatusProps[];
  // 选择的楼层
  selectedFloor: number;
  // 房源前缀
  housePrefix: string;
  // 去掉4
  excludeFour: boolean;
  // 房源编号长度
  numberLength: number;
  // 所有楼层的房源状态
  housesStatusOfFloors: Map<number, Map<string, HouseStatusProps>>;
}

// 接口定义
interface HouseLayoutProps {
  id: string;
  layoutName: string;
  bedroom: number;
  livingRoom: number;
  kitchen: number;
  bathroom: number;
  newly: boolean;
}

export type { FocusFormItemProps, FormProps, HouseStatusProps, FocusBuildingProps, HouseLayoutProps };
