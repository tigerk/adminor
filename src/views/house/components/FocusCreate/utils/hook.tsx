// useFocusEdit.ts
import FocusCreateForm from "../FocusCreateForm.vue";
import { addDialog, closeAllDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { h, reactive, ref } from "vue";
import type { FocusCreateDto, FocusHouseDto } from "@/types";
import type { LocalFocusBuildingDto } from "@/views/house/components/FocusCreate/utils/types";

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
  const initHouseListOfFloor = (building: LocalFocusBuildingDto, floor: number, houseCount: number) => {
    const houseStatusMap = new Map<string, FocusHouseDto>();

    let actualCount = 0;
    let doorIndex = 1;

    while (actualCount < houseCount) {
      const houseNum = doorIndex.toString();

      const houseNumber = formatHouseNumber(building.housePrefix ?? "", building.numberLength ?? 2, floor, houseNum);

      // 如果启用了去4选项且房间号以4结尾，跳过这个房间号
      if (building.excludeFour && houseNumber.endsWith("4")) {
        doorIndex++;
        continue;
      }

      houseStatusMap.set(houseNum, {
        cursor: `${building.building}-${building.unit || "0"}-${floor}-${doorIndex}`,
        // houseIndex 在新类型中为 string
        houseIndex: doorIndex.toString(),
        doorNumber: houseNumber,
        closed: false,
        locked: false,
        floor: floor,
        building: building.building,
        unit: building.unit,
        houseLayoutId: undefined,
        price: 0,
        direction: "",
        area: 0
      });

      actualCount++;
      doorIndex++;
    }

    if (!building.housesStatusOfFloors) {
      building.housesStatusOfFloors = new Map<number, Map<string, FocusHouseDto>>();
    }
    building.housesStatusOfFloors.set(floor, houseStatusMap);
  };

  // 为指定楼栋初始化所有楼层房源状态
  const initAllFloorsForBuilding = (building: LocalFocusBuildingDto) => {
    if (!building.floorTotal || !building.houseCountPerFloor) {
      return;
    }

    // 初始化 Map
    if (!building.housesStatusOfFloors) {
      building.housesStatusOfFloors = new Map<number, Map<string, FocusHouseDto>>();
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
        const floorMap = building.housesStatusOfFloors!.get(closedHouse.floor!);
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
  const getFloorList = (building: LocalFocusBuildingDto) => {
    if (!building?.floorTotal) {
      return [];
    }
    return Array.from({ length: building.floorTotal }, (_, i) => i + 1);
  };

  // 获取指定楼栋指定楼层的房源列表
  const getHouseListForFloor = (building: LocalFocusBuildingDto, floor: number) => {
    if (!building?.housesStatusOfFloors || !building.housesStatusOfFloors.has(floor)) {
      return [];
    }

    let houses = Array.from(building.housesStatusOfFloors.get(floor)!.values());

    // 如果启用了"去4"选项，则过滤掉房源号包含4的房源
    if (building.excludeFour) {
      houses = houses.filter(item => !item.doorNumber?.endsWith("4"));
    }

    // houseIndex 现在是 string，转为 number 再排序
    return houses.sort((a, b) => Number(a.houseIndex) - Number(b.houseIndex));
  };

  // 获取指定楼栋指定楼层的房源数量
  const getHouseCountForFloor = (building: LocalFocusBuildingDto, floor: number) => {
    if (!building?.housesStatusOfFloors || !building.housesStatusOfFloors.has(floor)) {
      return building.houseCountPerFloor || 0;
    }
    return building.housesStatusOfFloors.get(floor)!.size;
  };

  // 处理房源点击事件（锁定/解锁）
  const handleHouseClick = (building: LocalFocusBuildingDto, houseStatus: FocusHouseDto) => {
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
  const handleCloseFloor = (building: LocalFocusBuildingDto) => {
    // 确保 closedFloors 是数组
    if (!Array.isArray(building.closedFloors)) {
      building.closedFloors = [];
    }

    const index = building.closedFloors.indexOf(building.selectedFloor!);
    if (index > -1) {
      // 如果已关闭，则开启
      building.closedFloors.splice(index, 1);
    } else {
      // 如果未关闭，则关闭
      building.closedFloors.push(building.selectedFloor!);
    }
  };

  // 楼层选择处理
  const handleFloorSelect = (building: LocalFocusBuildingDto, floor: number) => {
    building.selectedFloor = floor;

    // 如果选中的楼层没有房源数据，使用默认房源数量初始化
    if (!building.housesStatusOfFloors?.has(floor) && building.houseCountPerFloor) {
      initHouseListOfFloor(building, floor, building.houseCountPerFloor);
    }
  };

  // 添加房源到指定楼层
  const addHouseToFloor = (building: LocalFocusBuildingDto, floor: number, doorNumber: string) => {
    if (!building.housesStatusOfFloors) {
      building.housesStatusOfFloors = new Map();
    }
    if (!building.housesStatusOfFloors.has(floor)) {
      building.housesStatusOfFloors.set(floor, new Map());
    }

    const floorMap = building.housesStatusOfFloors.get(floor)!;
    const newIndex = floorMap.size + 1;

    const newHouse: FocusHouseDto = {
      cursor: `${building.building}-${building.unit || "0"}-${floor}-${newIndex}`,
      houseIndex: newIndex.toString(), // string 类型
      doorNumber: doorNumber,
      floor: floor,
      building: building.building,
      unit: building.unit,
      closed: false,
      locked: false,
      houseLayoutId: undefined,
      price: 0,
      direction: "",
      area: 0
    };

    floorMap.set(newIndex.toString(), newHouse);
    return newHouse;
  };

  // 更新房源信息
  const updateHouseInfo = (building: LocalFocusBuildingDto, cursor: string, updates: Partial<FocusHouseDto>) => {
    if (!building.housesStatusOfFloors) return false;
    for (const [floor, floorMap] of building.housesStatusOfFloors) {
      console.log("housesStatusOfFloors foreach, key={}, house={}", floor, floorMap);
      for (const [key, house] of floorMap) {
        console.log("floorMap foreach, key={}, house={}", key, house);
        if (house.cursor === cursor) {
          Object.assign(house, updates);
          return true;
        }
      }
    }
    return false;
  };

  // 删除房源
  const deleteHouse = (building: LocalFocusBuildingDto, cursor: string) => {
    if (!building.housesStatusOfFloors) return false;
    for (const [floor, floorMap] of building.housesStatusOfFloors) {
      console.log("building.housesStatusOfFloors, floor=%s, floorMap=%s", floor, floorMap);
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
  const applyLayoutToFloor = (building: LocalFocusBuildingDto, floor: number, layoutId: string, config?: { price?: number; direction?: string; area?: number }) => {
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
  const copyFloorConfiguration = (building: LocalFocusBuildingDto, sourceFloor: number, targetFloor: number) => {
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
  const toggleFloorLock = (building: LocalFocusBuildingDto, floor: number, closed: boolean) => {
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
  const convertBuildingsToHouseList = (buildings: LocalFocusBuildingDto[]): FocusHouseDto[] => {
    const houseList: FocusHouseDto[] = [];

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

  function openFocusEditDialog(title = "新增", row?: FocusCreateDto, onConfirm?: (data: any) => void) {
    addDialog({
      title: `${title}项目`,
      props: {
        formInline: {
          id: row?.id ?? undefined,
          // businessMode 已更名为 leaseMode；deptId/salesmanId 现在是 string
          leaseMode: row?.leaseMode ?? 1,
          focusCode: row?.focusCode ?? "",
          focusName: row?.focusName ?? "",
          community: row?.community ?? null,
          address: row?.address ?? "",
          buildings: row?.buildings ?? [],
          houseList: row?.houseList ?? [],
          deptId: row?.deptId ?? "",
          salesmanId: row?.salesmanId ?? undefined,
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
        } satisfies FocusCreateDto
      },
      top: "1%",
      width: "80%",
      draggable: true,
      lockScroll: true,
      alignCenter: true,
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
            if (onConfirm) {
              onConfirm(row);
            }
          }
        })
    });
  }

  /**
   * 将 houseList 按照 building 和 unit 分配到对应的 buildings.housesStatusOfFloors 中
   * @param formData 表单数据
   */
  type LocalFocusCreateDto = Omit<FocusCreateDto, "buildings"> & { buildings: LocalFocusBuildingDto[] };

  function distributeHousesToBuildings(formData: LocalFocusCreateDto): void {
    // 如果没有 houseList，直接返回
    if (!formData.houseList || formData.houseList.length === 0) {
      return;
    }

    // 遍历每个 building
    formData.buildings.forEach(building => {
      // 初始化或清空当前的 housesStatusOfFloors
      if (!building.housesStatusOfFloors) {
        building.housesStatusOfFloors = new Map();
      } else {
        building.housesStatusOfFloors.clear();
      }

      // 筛选出属于当前 building 和 unit 的房源
      const buildingHouses = formData.houseList!.filter(house => house.building === building.building && (house.unit === building.unit || (!house.unit && !building.unit)));

      // 按楼层分组并处理
      buildingHouses.forEach(house => {
        const floor = house.floor!;

        // 获取或创建该楼层的 Map
        if (!building.housesStatusOfFloors!.has(floor)) {
          building.housesStatusOfFloors!.set(floor, new Map<string, FocusHouseDto>());
        }

        const floorMap = building.housesStatusOfFloors!.get(floor)!;

        // 生成 cursor（如果不存在）
        if (!house.cursor) {
          house.cursor = `${building.building}-${building.unit || "0"}-${floor}-${house.id || Date.now()}`;
        }

        // 计算 houseIndex（string 类型）
        if (!house.houseIndex) {
          // 尝试从门牌号中提取数字部分作为 houseIndex
          const match = house.doorNumber?.match(/\d+$/);
          if (match) {
            house.houseIndex = match[0]; // 直接保持 string
          } else {
            house.houseIndex = (floorMap.size + 1).toString();
          }
        }

        // 生成 Map 的 key（使用 houseIndex）
        const houseKey = house.houseIndex;

        // 确保所有必需字段都有默认值
        const completeHouse: FocusHouseDto = {
          cursor: house.cursor,
          houseIndex: house.houseIndex,
          doorNumber: house.doorNumber,
          floor: house.floor,
          building: house.building,
          unit: house.unit || "",
          closed: house.closed || false,
          locked: house.locked || false,
          houseLayoutId: house.houseLayoutId,
          price: house.price || 0,
          direction: house.direction || "",
          area: house.area || 0,
          // 如果有 id，也保留它
          ...(house.id && { id: house.id })
        };

        // 将房源添加到该楼层的 Map 中
        floorMap.set(houseKey, completeHouse);
      });
    });

    // 标记编辑模式下已存在的楼栋
    formData.buildings.forEach(building => {
      if (building.housesStatusOfFloors && building.housesStatusOfFloors.size > 0) {
        building.isNew = false;
      }
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
    handleHouseClick,
    handleCloseFloor,
    handleFloorSelect,
    addHouseToFloor,
    updateHouseInfo,
    deleteHouse,
    applyLayoutToFloor,
    copyFloorConfiguration,
    toggleFloorLock,
    convertBuildingsToHouseList,
    distributeHousesToBuildings
  };
}
