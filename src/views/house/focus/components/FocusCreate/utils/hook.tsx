// useFocusEdit.ts
import FocusCreateForm from "../FocusCreateForm.vue";
import { addDialog, closeAllDialog } from "@/components/ReDialog/index";
import { deviceDetection } from "@pureadmin/utils";
import { h, reactive, ref } from "vue";
import type { FocusFormItemProps, HouseStatusProps, FocusBuildingProps } from "@/views/house/focus/components/FocusCreate/utils/types";

export function useFocusEdit() {
  const form = reactive({
    name: "",
    code: "",
    status: ""
  });

  const formRef = ref();

  // 格式化房源号
  const formatHouseNumber = (housePrefix: string, numberLength: number, floor: number, num: string) => {
    const tmp = Math.min(2, num.toString().length);
    const prefix = numberLength - tmp;
    return (housePrefix ? housePrefix : "") + String(floor).padEnd(prefix, "0") + num.padStart(tmp, "0");
  };

  // 初始化特定楼层房源列表
  const initHouseListOfFloor = (building: FocusBuildingProps, floor: number, houseCount: number) => {
    const houseStatusMap = new Map<string, HouseStatusProps>();

    for (let i = 1; i <= houseCount; i++) {
      const houseNum = i.toString();
      if (building.excludeFour && houseNum.includes("4")) {
        continue;
      }

      houseStatusMap.set(houseNum, {
        cursor: `${building.building}-${building.unit || "0"}-${floor}-${i}`,
        houseIndex: i,
        doorNumber: formatHouseNumber(building.housePrefix, building.numberLength, floor, houseNum),
        closed: false,
        floor: floor,
        building: building.building,
        unit: building.unit,
        houseLayoutId: undefined,
        price: 0,
        direction: "",
        area: 0
      });
    }

    building.housesStatusOfFloors.set(floor, houseStatusMap);
  };

  // 为指定楼栋初始化所有楼层房源状态
  const initAllFloorsForBuilding = (building: FocusBuildingProps) => {
    if (!building.floorTotal || !building.houseCountPerFloor) {
      return;
    }

    // 初始化 Map
    if (!building.housesStatusOfFloors) {
      building.housesStatusOfFloors = new Map<number, Map<string, HouseStatusProps>>();
    } else {
      building.housesStatusOfFloors.clear();
    }

    // 初始化每个楼层的房源数据
    for (let floor = 1; floor <= building.floorTotal; floor++) {
      initHouseListOfFloor(building, floor, building.houseCountPerFloor);
    }

    // 恢复已关闭的房源状态
    if (building.closedHouses && building.closedHouses.length > 0) {
      building.closedHouses.forEach(closedHouse => {
        const floorMap = building.housesStatusOfFloors.get(closedHouse.floor);
        if (floorMap) {
          for (const [_, house] of floorMap) {
            if (house.doorNumber === closedHouse.doorNumber) {
              house.closed = true;
              break;
            }
          }
        }
      });
    }

    // 自动选中第一个楼层
    if (building.floorTotal > 0 && !building.selectedFloor) {
      building.selectedFloor = 1;
    }
  };

  // 获取指定楼栋的楼层列表
  const getFloorList = (building: FocusBuildingProps) => {
    if (!building?.floorTotal) {
      return [];
    }
    return Array.from({ length: building.floorTotal }, (_, i) => i + 1);
  };

  // 获取指定楼栋指定楼层的房源列表
  const getHouseListForFloor = (building: FocusBuildingProps, floor: number) => {
    if (!building?.housesStatusOfFloors || !building.housesStatusOfFloors.has(floor)) {
      return [];
    }

    let houses = Array.from(building.housesStatusOfFloors.get(floor).values());

    // 如果启用了"去4"选项，则过滤掉房源号包含4的房源
    if (building.excludeFour) {
      houses = houses.filter(item => !item.doorNumber.includes("4"));
    }

    return houses.sort((a, b) => a.houseIndex - b.houseIndex);
  };

  // 获取指定楼栋指定楼层的房源数量
  const getHouseCountForFloor = (building: FocusBuildingProps, floor: number) => {
    if (!building?.housesStatusOfFloors || !building.housesStatusOfFloors.has(floor)) {
      return building.houseCountPerFloor || 0;
    }
    const floorMap = building.housesStatusOfFloors.get(floor);
    if (building.excludeFour) {
      return Array.from(floorMap.values()).filter(h => !h.doorNumber.includes("4")).length;
    }
    return floorMap.size;
  };

  // 更新特定楼栋楼层的房源数量
  const updateHouseCountForFloor = (building: FocusBuildingProps, floor: number, newHouseCount: number) => {
    const houseCount = Number(newHouseCount);

    if (isNaN(houseCount) || houseCount < 1) {
      return;
    }

    if (!building.housesStatusOfFloors.has(floor)) {
      initHouseListOfFloor(building, floor, houseCount);
      return;
    }

    const currentFloor = building.housesStatusOfFloors.get(floor);
    const currentSize = currentFloor.size;

    if (houseCount > currentSize) {
      // 增加房源
      for (let i = currentSize + 1; i <= houseCount; i++) {
        const houseNum = i.toString();
        if (building.excludeFour && houseNum.includes("4")) {
          continue;
        }

        currentFloor.set(houseNum, {
          cursor: `${building.building}-${building.unit || "0"}-${floor}-${i}`,
          houseIndex: i,
          doorNumber: formatHouseNumber(building.housePrefix, building.numberLength, floor, houseNum),
          closed: false,
          floor: floor,
          building: building.building,
          unit: building.unit,
          houseLayoutId: undefined,
          price: 0,
          direction: "",
          area: 0
        });
      }
    } else if (houseCount < currentSize) {
      // 减少房源 - 截断
      const newMap = new Map<string, HouseStatusProps>();
      let count = 0;

      for (const [key, value] of currentFloor) {
        if (count >= houseCount) break;
        newMap.set(key, value);
        count++;
      }

      building.housesStatusOfFloors.set(floor, newMap);
    }
  };

  // 处理房源点击事件（锁定/解锁）
  const handleHouseClick = (building: FocusBuildingProps, houseStatus: HouseStatusProps) => {
    // 确保 closedHouses 是数组
    if (!Array.isArray(building.closedHouses)) {
      building.closedHouses = [];
    }

    houseStatus.closed = !houseStatus.closed;

    if (houseStatus.closed) {
      // 添加到关闭房源列表
      const existingIndex = building.closedHouses.findIndex(item => item.floor === houseStatus.floor && item.doorNumber === houseStatus.doorNumber);
      if (existingIndex === -1) {
        building.closedHouses.push({ ...houseStatus });
      }
    } else {
      // 从关闭房源列表中移除
      const index = building.closedHouses.findIndex(item => item.floor === houseStatus.floor && item.doorNumber === houseStatus.doorNumber);
      if (index > -1) {
        building.closedHouses.splice(index, 1);
      }
    }
  };

  // 处理关闭楼层
  const handleCloseFloor = (building: FocusBuildingProps) => {
    // 确保 closedFloors 是数组
    if (!Array.isArray(building.closedFloors)) {
      building.closedFloors = [];
    }

    const index = building.closedFloors.indexOf(building.selectedFloor);
    if (index > -1) {
      // 如果已关闭，则开启
      building.closedFloors.splice(index, 1);
    } else {
      // 如果未关闭，则关闭
      building.closedFloors.push(building.selectedFloor);
    }
  };

  // 楼层选择处理
  const handleFloorSelect = (building: FocusBuildingProps, floor: number) => {
    building.selectedFloor = floor;

    // 如果选中的楼层没有房源数据，使用默认房源数量初始化
    if (!building.housesStatusOfFloors.has(floor) && building.houseCountPerFloor) {
      initHouseListOfFloor(building, floor, building.houseCountPerFloor);
    }
  };

  // 添加房源到指定楼层
  const addHouseToFloor = (building: FocusBuildingProps, floor: number, doorNumber: string) => {
    if (!building.housesStatusOfFloors.has(floor)) {
      building.housesStatusOfFloors.set(floor, new Map());
    }

    const floorMap = building.housesStatusOfFloors.get(floor);
    const newIndex = floorMap.size + 1;

    const newHouse: HouseStatusProps = {
      cursor: `${building.building}-${building.unit || "0"}-${floor}-${newIndex}`,
      houseIndex: newIndex,
      doorNumber: doorNumber,
      floor: floor,
      building: building.building,
      unit: building.unit,
      closed: false,
      houseLayoutId: undefined,
      price: 0,
      direction: "",
      area: 0
    };

    floorMap.set(newIndex.toString(), newHouse);
    return newHouse;
  };

  // 更新房源信息
  const updateHouseInfo = (building: FocusBuildingProps, cursor: string, updates: Partial<HouseStatusProps>) => {
    for (const [floor, floorMap] of building.housesStatusOfFloors) {
      for (const [key, house] of floorMap) {
        if (house.cursor === cursor) {
          Object.assign(house, updates);
          return true;
        }
      }
    }
    return false;
  };

  // 删除房源
  const deleteHouse = (building: FocusBuildingProps, cursor: string) => {
    for (const [floor, floorMap] of building.housesStatusOfFloors) {
      for (const [key, house] of floorMap) {
        if (house.cursor === cursor) {
          floorMap.delete(key);
          // 同时从关闭房源列表中移除
          if (building.closedHouses) {
            const index = building.closedHouses.findIndex(ch => ch.floor === house.floor && ch.doorNumber === house.doorNumber);
            if (index > -1) {
              building.closedHouses.splice(index, 1);
            }
          }
          return true;
        }
      }
    }
    return false;
  };

  // 批量应用房型配置到楼层
  const applyLayoutToFloor = (building: FocusBuildingProps, floor: number, layoutId: string, config?: { price?: number; direction?: string; area?: number }) => {
    const floorMap = building.housesStatusOfFloors?.get(floor);
    if (!floorMap) return;

    for (const [_, house] of floorMap) {
      house.houseLayoutId = layoutId;
      if (config) {
        if (config.price !== undefined) house.price = config.price;
        if (config.direction) house.direction = config.direction;
        if (config.area !== undefined) house.area = config.area;
      }
    }
  };

  // 复制楼层配置
  const copyFloorConfiguration = (building: FocusBuildingProps, sourceFloor: number, targetFloor: number) => {
    const sourceMap = building.housesStatusOfFloors?.get(sourceFloor);
    const targetMap = building.housesStatusOfFloors?.get(targetFloor);

    if (!sourceMap || !targetMap) return false;

    const sourceHouses = Array.from(sourceMap.values());
    const targetHouses = Array.from(targetMap.values());

    targetHouses.forEach((target, index) => {
      if (sourceHouses[index]) {
        target.houseLayoutId = sourceHouses[index].houseLayoutId;
        target.price = sourceHouses[index].price;
        target.direction = sourceHouses[index].direction;
        target.area = sourceHouses[index].area;
      }
    });

    return true;
  };

  // 批量锁定/解锁楼层的所有房源
  const toggleFloorLock = (building: FocusBuildingProps, floor: number, closed: boolean) => {
    const floorMap = building.housesStatusOfFloors?.get(floor);
    if (!floorMap) return;

    for (const [_, house] of floorMap) {
      house.closed = closed;

      if (!Array.isArray(building.closedHouses)) {
        building.closedHouses = [];
      }

      if (closed) {
        const exists = building.closedHouses.some(ch => ch.floor === house.floor && ch.doorNumber === house.doorNumber);
        if (!exists) {
          building.closedHouses.push({ ...house });
        }
      } else {
        const index = building.closedHouses.findIndex(ch => ch.floor === house.floor && ch.doorNumber === house.doorNumber);
        if (index > -1) {
          building.closedHouses.splice(index, 1);
        }
      }
    }
  };

  // 将 buildings 的 Map 结构转换为 houseList 数组
  const convertBuildingsToHouseList = (buildings: FocusBuildingProps[]): HouseStatusProps[] => {
    const houseList: HouseStatusProps[] = [];

    buildings.forEach(building => {
      if (building.housesStatusOfFloors) {
        for (const [floor, houseMap] of building.housesStatusOfFloors) {
          // 跳过已关闭的楼层
          if (building.closedFloors?.includes(floor)) {
            continue;
          }

          for (const [_, house] of houseMap) {
            houseList.push({
              ...house,
              building: building.building,
              unit: building.unit
            });
          }
        }
      }
    });

    return houseList;
  };

  function openFocusEditDialog(title = "新增", row?: FocusFormItemProps) {
    addDialog({
      title: `${title}项目`,
      props: {
        formInline: {
          id: row?.id ?? null,
          businessMode: row?.businessMode ?? 1,
          houseCode: row?.houseCode ?? "",
          houseName: row?.houseName ?? "",
          region: row?.region ?? [],
          address: row?.address ?? "",
          buildings: row?.buildings ?? [],
          houseList: row?.houseList ?? [],
          deptId: row?.deptId ?? 0,
          salesmanId: row?.salesmanId ?? null,
          storePhone: row?.storePhone ?? "",
          water: row?.water ?? "commercial",
          electricity: row?.electricity ?? "commercial",
          heating: row?.heating ?? "central",
          hasGas: row?.hasGas ?? true,
          hasElevator: row?.hasElevator ?? true,
          facilities: row?.facilities ?? [],
          houseDesc: row?.houseDesc ?? "",
          businessDesc: row?.businessDesc ?? "",
          tags: row?.tags ?? [],
          remark: row?.remark ?? "",
          imageList: row?.imageList ?? [],
          houseLayoutList: row?.houseLayoutList ?? []
        }
      },
      top: "1%",
      width: "85%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      footerRenderer: () => null,
      contentRenderer: () =>
        h(FocusCreateForm, {
          ref: formRef,
          formInline: null,
          onCreateSuccess: () => {
            closeAllDialog();
          }
        })
    });
  }

  return {
    form,
    formRef,
    openFocusEditDialog,
    formatHouseNumber,
    initHouseListOfFloor,
    initAllFloorsForBuilding,
    getFloorList,
    getHouseListForFloor,
    getHouseCountForFloor,
    updateHouseCountForFloor,
    handleHouseClick,
    handleCloseFloor,
    handleFloorSelect,
    addHouseToFloor,
    updateHouseInfo,
    deleteHouse,
    applyLayoutToFloor,
    copyFloorConfiguration,
    toggleFloorLock,
    convertBuildingsToHouseList
  };
}
