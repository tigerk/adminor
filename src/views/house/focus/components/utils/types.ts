// 虽然字段很少 但是抽离出来 后续有扩展字段需求就很方便了

interface FormItemProps {
  id: number;
  businessMode: number;
  houseCode: string;
  houseName: string;
  address: string;
  building: string;
  unit: string;
  doorNumber: string;
  remark: string;
  // 总楼层
  floorTotal: number;
  // 每个楼层的房间数量
  roomCountPerFloor: number;
  // 关闭的楼层列表
  closedFloors: number[];
  // 关闭的房间
  closedRooms: { floor: number; roomNumber: string }[];
  // 所有楼层的房间状态
  roomsStatusOfFloors: Map<number, Map<string, RoomStatusProps>>;
  // 选择的楼层
  selectedFloor: number;
  // 房间前缀
  roomPrefix: string;
  // 去掉4
  excludeFour: boolean;
  // 房间编号长度
  roomNumberLength: number;
  // 部门id
  deptId: number;
  // 业务员id
  salesmanId: number;
}

interface FormProps {
  formInline: FormItemProps;
}

interface RoomStatusProps {
  // 房间号
  roomNumber: string;
  // 房间锁定状态
  locked: boolean;
  // 楼层
  floor: number;
  // 房间类型id
  houseLayoutId: string;
  // 房间价格
  price: number;
  // 朝向
  direction: string;
  // 面积
  area: number;
}

// 接口定义
interface HouseLayoutProps {
  id: string;
  layoutName: string;
  bedroom: number;
  livingRoom: number;
  kitchen: number;
  bathroom: number;
}

export type { FormItemProps, FormProps, RoomStatusProps, HouseLayoutProps };
