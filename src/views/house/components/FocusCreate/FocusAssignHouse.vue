<script setup lang="ts">
  import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
  import { CheckboxValueType, ElMessage, ElMessageBox } from "element-plus";
  import { CircleCheckFilled, Delete, Edit, InfoFilled, Lock, Plus, QuestionFilled, Unlock } from "@element-plus/icons-vue";
  import AntDesignPlusCircleOutlined from "~icons/ant-design/plus-circle-outlined";
  import AntDesignLockFilled from "~icons/ant-design/lock-filled";
  import { LocalFocusBuildingDto, LocalFocusCreateDto } from "@/views/house/components/FocusCreate/utils/types";
  import { useFocusEdit } from "@/views/house/components/FocusCreate/utils/hook";
  import { useHouseLayoutManage } from "@/views/house/components/HouseLayout/HouseLayoutManage/useHouseLayoutManage";
  import { FocusHouseDto, HouseLayoutDto } from "@/types"; // 获取 FocusCreateForm 中的form数据

  // 获取 FocusCreateForm 中的form数据
  const form = defineModel<LocalFocusCreateDto>();

  // 使用房型管理 hook
  const { openHouseLayoutManageDialog } = useHouseLayoutManage();

  // 添加新的状态
  const showAddFloorPopover = ref(false);
  const newFloorNumber = ref<number>(1);

  // 初始化默认房型
  if (!form.value.houseLayoutList || form.value.houseLayoutList.length === 0) {
    form.value.houseLayoutList = [
      {
        id: "1",
        layoutName: "精装一房",
        bedroom: 1,
        livingRoom: 1,
        kitchen: 1,
        bathroom: 1,
        newly: true
      },
      {
        id: "2",
        layoutName: "精装二房",
        bedroom: 2,
        livingRoom: 1,
        kitchen: 1,
        bathroom: 1,
        newly: true
      }
    ];
  }

  // 定义 emits
  const emit = defineEmits<{
    "to-add-extra": [];
    "step-previous": [];
  }>();

  // 使用 hook 中的方法
  const { getHouseListForFloor, addHouseToFloor, updateHouseInfo, deleteHouse, convertBuildingsToHouseList, initAllFloorsForBuilding, formatHouseNumber } = useFocusEdit();

  // 状态管理
  const selectedHouseLayoutId = ref<string>("");
  const selectedHouses = ref<string[]>([]);
  const showAddHouseDialog = ref(false);
  const isEditingHouse = ref(false);

  // 楼栋选择相关
  const selectedBuildingIndex = ref(0);

  // 右键菜单状态
  const contextMenu = reactive({
    visible: false,
    x: 0,
    y: 0,
    house: null as FocusHouseDto | null
  });

  // 批量配置表单
  const batchConfig = reactive({
    houseLayoutId: "",
    price: "",
    direction: "",
    area: ""
  });

  // 新房源表单
  const newHouseForm = reactive({
    cursor: "",
    houseNumber: "",
    floor: 1,
    building: "",
    unit: ""
  });

  // 计算属性
  const projectName = computed(() => form.value.focusName || "未命名项目");

  // 当前楼栋
  const currentBuilding = computed(() => {
    return form.value.buildings?.[selectedBuildingIndex.value] || null;
  });

  // 当前楼栋的楼层列表
  const currentBuildingFloors = computed(() => {
    if (!currentBuilding.value?.housesStatusOfFloors) return [];
    const floors = Array.from(currentBuilding.value.housesStatusOfFloors.keys());
    return floors.sort((a, b) => a - b);
  });

  // 统计信息
  const totalHouses = computed(() => {
    let count = 0;
    form.value.buildings?.forEach(building => {
      if (building.housesStatusOfFloors) {
        for (const [floor, houseMap] of building.housesStatusOfFloors) {
          if (!building.closedFloors?.includes(floor)) {
            count += houseMap.size;
          }
        }
      }
    });
    return count;
  });

  const unassignedHouses = computed(() => {
    let count = 0;
    form.value.buildings?.forEach(building => {
      if (building.housesStatusOfFloors) {
        for (const [floor, houseMap] of building.housesStatusOfFloors) {
          if (!building.closedFloors?.includes(floor)) {
            for (const [_, house] of houseMap) {
              if (!house.houseLayoutId && !house.closed) {
                count++;
              }
            }
          }
        }
      }
    });
    return count;
  });

  const enabledHouses = computed(() => {
    let count = 0;
    form.value.buildings?.forEach(building => {
      if (building.housesStatusOfFloors) {
        for (const [floor, houseMap] of building.housesStatusOfFloors) {
          if (!building.closedFloors?.includes(floor)) {
            for (const [_, house] of houseMap) {
              if (!house.closed) {
                count++;
              }
            }
          }
        }
      }
    });
    return count;
  });

  const disabledHouses = computed(() => {
    let count = 0;
    form.value.buildings?.forEach(building => {
      if (building.housesStatusOfFloors) {
        for (const [_, houseMap] of building.housesStatusOfFloors) {
          for (const [_, house] of houseMap) {
            if (house.closed) {
              count++;
            }
          }
        }
      }
    });
    return count;
  });

  // 楼栋切换相关方法
  const selectBuilding = (index: number) => {
    selectedBuildingIndex.value = index;
    selectedHouses.value = [];
  };

  const getBuildingHouseCount = (buildingIndex: number) => {
    const building = form.value.buildings?.[buildingIndex];
    if (!building?.housesStatusOfFloors) return 0;

    let count = 0;
    for (const [floor, houseMap] of building.housesStatusOfFloors) {
      if (!building.closedFloors?.includes(floor)) {
        count += houseMap.size;
      }
    }
    return count;
  };

  // 获取当前楼栋某层的房源
  const getHousesByFloor = (floor: number) => {
    if (!currentBuilding.value) return [];
    return getHouseListForFloor(currentBuilding.value, floor);
  };

  // 获取房型名称
  const getHouseLayoutName = (houseLayoutId: string) => {
    const houseLayout = form.value.houseLayoutList.find(hl => hl.id === houseLayoutId);
    return houseLayout ? houseLayout.layoutName : "未知房型";
  };

  const getHouseLayoutTagType = (houseLayoutId: string): "success" | "warning" | "info" | "danger" => {
    const colors: ("success" | "warning" | "info" | "danger")[] = ["success", "warning", "info", "danger"];
    const index = parseInt(houseLayoutId) % colors.length;
    return colors[index];
  };

  // 修改后的方法 - 返回预定义的 CSS 类名
  const getHouseCardClass = (house: FocusHouseDto) => {
    if (selectedHouses.value.includes(house.cursor)) {
      return "house-card-selected";
    }
    if (house.houseLayoutId) {
      return "house-card-assigned";
    }
    return "house-card-unassigned";
  };

  const getFloorBorderClass = (floor: number) => {
    if (isFloorDisabled(floor)) {
      return "floor-border-disabled";
    }

    const floorHouses = getHousesByFloor(floor);
    const selectedFloorHouses = floorHouses.filter(house => selectedHouses.value.includes(house.cursor));

    if (selectedFloorHouses.length === floorHouses.length && floorHouses.length > 0) {
      return "floor-border-all-selected";
    } else if (selectedFloorHouses.length > 0) {
      return "floor-border-partial-selected";
    }
    return "floor-border-default";
  };

  const getFloorChecked = (floor: number) => {
    const floorHouses = getHousesByFloor(floor);
    const selectedFloorHouses = floorHouses.filter(house => selectedHouses.value.includes(house.cursor));
    return { value: selectedFloorHouses.length === floorHouses.length && floorHouses.length > 0 };
  };

  const getFloorIndeterminate = (floor: number) => {
    const floorHouses = getHousesByFloor(floor);
    const selectedFloorHouses = floorHouses.filter(house => selectedHouses.value.includes(house.cursor));
    return selectedFloorHouses.length > 0 && selectedFloorHouses.length < floorHouses.length;
  };

  const handleFloorSelectAll = (floor: number, checked: CheckboxValueType) => {
    const isChecked = Boolean(checked);
    const floorHouses = getHousesByFloor(floor);
    const floorHouseIds = floorHouses.map(house => house.cursor);

    if (isChecked) {
      floorHouseIds.forEach(houseId => {
        if (!selectedHouses.value.includes(houseId)) {
          selectedHouses.value.push(houseId);
        }
      });
    } else {
      selectedHouses.value = selectedHouses.value.filter(houseId => !floorHouseIds.includes(houseId));
    }
  };

  const toggleHouseSelection = (houseId: string) => {
    const index = selectedHouses.value.indexOf(houseId);
    if (index > -1) {
      selectedHouses.value.splice(index, 1);
    } else {
      selectedHouses.value.push(houseId);
    }
  };

  const getSelectedHouseNumbers = () => {
    const houses: string[] = [];

    selectedHouses.value.forEach(cursor => {
      if (currentBuilding.value?.housesStatusOfFloors) {
        for (const [_, houseMap] of currentBuilding.value.housesStatusOfFloors) {
          for (const [_, house] of houseMap) {
            if (house.cursor === cursor) {
              houses.push(house.doorNumber);
              break;
            }
          }
        }
      }
    });

    return houses.join("、");
  };

  // 批量配置
  const applyBatchConfig = () => {
    if (selectedHouses.value.length === 0) {
      ElMessage.warning("请先选择房源");
      return;
    }

    selectedHouses.value.forEach(cursor => {
      const updates: Partial<FocusHouseDto> = {};

      if (batchConfig.houseLayoutId) {
        updates.houseLayoutId = batchConfig.houseLayoutId;
      }
      if (batchConfig.price) {
        updates.price = Number(batchConfig.price);
      }
      if (batchConfig.direction) {
        updates.direction = batchConfig.direction;
      }
      if (batchConfig.area) {
        updates.area = Number(batchConfig.area);
      }

      if (currentBuilding.value) {
        updateHouseInfo(currentBuilding.value, cursor, updates);
      }
    });

    ElMessage.success(`已对${selectedHouses.value.length}个房源应用配置`);
    clearSelection();
  };

  const clearSelection = () => {
    selectedHouses.value = [];
    batchConfig.houseLayoutId = "";
    batchConfig.price = "";
    batchConfig.direction = "";
    batchConfig.area = "";
  };

  // 右键菜单相关方法
  const handleHouseRightClick = (event: MouseEvent, house: FocusHouseDto) => {
    event.preventDefault();
    contextMenu.visible = true;
    contextMenu.x = event.clientX;
    contextMenu.y = event.clientY;
    contextMenu.house = house;
  };

  const hideContextMenu = () => {
    contextMenu.visible = false;
    contextMenu.house = null;
  };

  const editHouse = (house: FocusHouseDto | null) => {
    if (!house) return;

    isEditingHouse.value = true;
    newHouseForm.cursor = house.cursor;
    newHouseForm.houseNumber = house.doorNumber;
    newHouseForm.floor = house.floor;
    showAddHouseDialog.value = true;
    hideContextMenu();
  };

  const deleteHouseAction = async (house: FocusHouseDto | null) => {
    if (!house || !currentBuilding.value) return;

    try {
      ElMessageBox.confirm(`确定要删除房源 ${house.doorNumber} 吗？`, "警告", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      });

      if (deleteHouse(currentBuilding.value, house.cursor)) {
        const selectedIndex = selectedHouses.value.indexOf(house.cursor);
        if (selectedIndex > -1) {
          selectedHouses.value.splice(selectedIndex, 1);
        }
        ElMessage.success("房源删除成功");
      }
    } catch {
      // 用户取消删除
    }

    hideContextMenu();
  };

  const addHouse = (floor: number) => {
    if (!currentBuilding.value) {
      ElMessage.warning("请先选择楼栋");
      return;
    }

    newHouseForm.floor = floor;
    showAddHouseDialog.value = true;
  };

  const saveHouse = () => {
    if (!newHouseForm.houseNumber) {
      ElMessage.warning("请输入房源号");
      return;
    }

    if (!currentBuilding.value) {
      ElMessage.warning("请先选择楼栋");
      return;
    }

    if (isEditingHouse.value) {
      if (updateHouseInfo(currentBuilding.value, newHouseForm.cursor, { doorNumber: newHouseForm.houseNumber })) {
        ElMessage.success("房源修改成功");
      }
    } else {
      const existingHouses = getHousesByFloor(newHouseForm.floor);
      const exists = existingHouses.some(house => house.doorNumber === newHouseForm.houseNumber);

      if (exists) {
        ElMessage.warning("该楼层中房源号已存在");
        return;
      }

      addHouseToFloor(currentBuilding.value, newHouseForm.floor, newHouseForm.houseNumber);
      ElMessage.success("房源添加成功");
    }

    showAddHouseDialog.value = false;
  };

  const resetHouseForm = () => {
    isEditingHouse.value = false;
    newHouseForm.cursor = "";
    newHouseForm.houseNumber = "";
    newHouseForm.floor = 1;
  };

  // 房型管理 - 使用新的 hook
  const handleCreateHouseLayout = () => {
    openHouseLayoutManageDialog("创建", undefined, data => {
      const newHouseLayout: HouseLayoutDto = {
        id: Date.now().toString(),
        layoutName: data.layoutName,
        bedroom: data.bedroom,
        livingRoom: data.livingRoom,
        kitchen: data.kitchen,
        bathroom: data.bathroom,
        newly: true,
        tags: data.tags, // 新增：保存标签
        facilities: data.facilities // 新增：保存配置
      };
      form.value.houseLayoutList.push(newHouseLayout);
    });
  };

  const editHouseLayout = (houseLayout: HouseLayoutDto) => {
    openHouseLayoutManageDialog("编辑", houseLayout, data => {
      const index = form.value.houseLayoutList.findIndex(hl => hl.id === data.id);
      if (index > -1) {
        form.value.houseLayoutList[index] = {
          ...form.value.houseLayoutList[index],
          layoutName: data.layoutName,
          bedroom: data.bedroom,
          livingRoom: data.livingRoom,
          kitchen: data.kitchen,
          bathroom: data.bathroom,
          tags: data.tags, // 新增：更新标签
          facilities: data.facilities // 新增：更新配置
        };
      }
    });
  };

  const deleteHouseLayout = async (id: string) => {
    // 检查是否有房源使用了该房型
    let assignedCount = 0;
    form.value.buildings?.forEach(building => {
      if (building.housesStatusOfFloors) {
        for (const [_, houseMap] of building.housesStatusOfFloors) {
          for (const [_, house] of houseMap) {
            if (house.houseLayoutId === id) {
              assignedCount++;
            }
          }
        }
      }
    });

    if (assignedCount > 0) {
      ElMessage.warning(`该房型已分配给${assignedCount}个房源，请先清除房源分配后再删除`);
      return;
    }

    try {
      ElMessageBox.confirm("确定要删除这个房型吗？", "警告", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      });

      const index = form.value.houseLayoutList.findIndex(hl => hl.id === id);
      if (index > -1) {
        form.value.houseLayoutList.splice(index, 1);
        if (selectedHouseLayoutId.value === id) {
          selectedHouseLayoutId.value = "";
        }
        ElMessage.success("房型删除成功");
      }
    } catch {
      // 用户取消删除
    }
  };

  // 重置房源数据
  const resetHouses = () => {
    form.value.buildings?.forEach(building => {
      initAllFloorsForBuilding(building);
    });
    selectedHouses.value = [];
    ElMessage.success("房源数据已重置");
  };

  // 保存并进入下一步
  const clickSaveAssignHouse = async () => {
    try {
      form.value.houseList = convertBuildingsToHouseList(form.value.buildings);

      if (form.value.houseList.length === 0) {
        ElMessage.warning("请至少配置一间房源");
        return;
      }

      emit("to-add-extra");
    } catch (error) {
      ElMessage.warning("请完善房源配置");
    }
  };

  const stepPrevious = () => {
    emit("step-previous");
  };

  // 当前楼栋的统计信息
  const currentBuildingStats = computed(() => {
    const building = currentBuilding.value;
    if (!building) {
      return {
        floors: 0,
        total: 0,
        unassigned: 0,
        enabled: 0,
        disabled: 0
      };
    }

    let total = 0;
    let unassigned = 0;
    let enabled = 0;
    let disabled = 0;

    const activeFloors = building.floorTotal - (building.closedFloors?.length || 0);

    if (building.housesStatusOfFloors) {
      for (const [floor, houseMap] of building.housesStatusOfFloors) {
        if (building.closedFloors?.includes(floor)) {
          continue;
        }

        for (const [_, house] of houseMap) {
          total++;
          if (house.closed) {
            disabled++;
          } else {
            enabled++;
            if (!house.houseLayoutId) {
              unassigned++;
            }
          }
        }
      }
    }

    return {
      floors: activeFloors,
      total,
      unassigned,
      enabled,
      disabled
    };
  });

  // 检查楼层是否被禁用
  const isFloorDisabled = (floor: number) => {
    return currentBuilding.value?.closedFloors?.includes(floor) || false;
  };

  // 切换楼层禁用状态
  const toggleFloorStatus = async (floor: number) => {
    if (!currentBuilding.value) return;

    if (!currentBuilding.value.closedFloors) {
      currentBuilding.value.closedFloors = [];
    }

    const index = currentBuilding.value.closedFloors.indexOf(floor);

    if (index > -1) {
      try {
        ElMessageBox.confirm(`确定要启用第 ${floor} 层吗？该楼层的所有房源将恢复可用状态。`, "启用楼层", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        });

        currentBuilding.value.closedFloors.splice(index, 1);
        ElMessage.success(`第 ${floor} 层已启用`);
      } catch {
        // 用户取消
      }
    } else {
      try {
        const floorHouses = getHousesByFloor(floor);
        ElMessageBox.confirm(`确定要禁用第 ${floor} 层吗？该楼层的 ${floorHouses.length} 个房源将被禁用。`, "禁用楼层", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        });

        currentBuilding.value.closedFloors.push(floor);

        const floorHouseIds = floorHouses.map(h => h.cursor);
        selectedHouses.value = selectedHouses.value.filter(id => !floorHouseIds.includes(id));

        ElMessage.success(`第 ${floor} 层已禁用`);
      } catch {
        // 用户取消
      }
    }
  };

  // 删除楼层方法
  const deleteFloor = (floor: number) => {
    if (!currentBuilding.value) return;

    if (currentBuilding.value.housesStatusOfFloors) {
      currentBuilding.value.housesStatusOfFloors.delete(floor);

      const remainingFloors = Array.from(currentBuilding.value.housesStatusOfFloors.keys());
      if (remainingFloors.length > 0) {
        currentBuilding.value.floorTotal = Math.max(...remainingFloors);
      } else {
        currentBuilding.value.floorTotal = 0;
      }
    }

    if (currentBuilding.value.closedFloors) {
      const index = currentBuilding.value.closedFloors.indexOf(floor);
      if (index > -1) {
        currentBuilding.value.closedFloors.splice(index, 1);
      }
    }

    const floorHouses = getHousesByFloor(floor);
    const floorHouseIds = floorHouses.map(h => h.cursor);
    selectedHouses.value = selectedHouses.value.filter(id => !floorHouseIds.includes(id));

    ElMessage.success(`第 ${floor} 层已删除`);
  };

  // 添加楼层的方法
  const confirmAddFloor = () => {
    if (!currentBuilding.value) {
      ElMessage.warning("请先选择楼栋");
      return;
    }

    const floor = newFloorNumber.value;

    if (currentBuilding.value.housesStatusOfFloors?.has(floor)) {
      ElMessage.warning(`第 ${floor} 层已存在`);
      return;
    }

    initFloorWithConfig(floor);

    if (currentBuilding.value.floorTotal < floor) {
      currentBuilding.value.floorTotal = floor;
    }

    ElMessage.success(`第 ${floor} 层创建成功`);
    showAddFloorPopover.value = false;
    newFloorNumber.value = 1;
  };

  // 使用当前楼栋配置初始化楼层
  const initFloorWithConfig = (floor: number) => {
    if (!currentBuilding.value) return;

    const building = currentBuilding.value;
    const houseCount = building.houseCountPerFloor || 10;
    const houseStatusMap = new Map<string, FocusHouseDto>();

    for (let i = 1; i <= houseCount; i++) {
      const houseNum = i.toString();

      if (building.excludeFour && houseNum.includes("4")) {
        continue;
      }

      const doorNumber = formatHouseNumber(building.housePrefix, building.numberLength, floor, houseNum);

      houseStatusMap.set(houseNum, {
        cursor: `${building.building}-${building.unit || "0"}-${floor}-${i}`,
        houseIndex: i.toString(),
        doorNumber: doorNumber,
        floor: floor,
        building: building.building,
        unit: building.unit,
        houseLayoutId: undefined,
        price: 0,
        direction: "",
        area: 0,
        closed: false,
        locked: false
      });
    }

    if (!building.housesStatusOfFloors) {
      building.housesStatusOfFloors = new Map();
    }

    building.housesStatusOfFloors.set(floor, houseStatusMap);
  };

  // 锁房/解锁方法
  const toggleHouseLock = async (house: FocusHouseDto | null) => {
    if (!house || !currentBuilding.value) return;

    if (updateHouseInfo(currentBuilding.value, house.cursor, { closed: !house.closed })) {
      if (!house.closed) {
        const selectedIndex = selectedHouses.value.indexOf(house.cursor);
        if (selectedIndex > -1) {
          selectedHouses.value.splice(selectedIndex, 1);
        }
      }

      ElMessage.success(`${house.closed ? "解锁" : "锁房"}成功`);
    }

    hideContextMenu();
  };

  // 生命周期钩子
  onMounted(() => {
    document.addEventListener("click", hideContextMenu);

    if (form.value.buildings && form.value.buildings.length > 0) {
      selectedBuildingIndex.value = 0;

      form.value.buildings.forEach(building => {
        if (!building.housesStatusOfFloors || building.housesStatusOfFloors.size === 0) {
          initAllFloorsForBuilding(building);
        }
      });
    }
  });

  onUnmounted(() => {
    document.removeEventListener("click", hideContextMenu);
  });
</script>

<template>
  <el-row :gutter="20" class="flex items-center justify-end p-1">
    <el-col :span="12">
      <el-space>
        <el-text class="font-bold">项目名称： {{ projectName }}</el-text>
      </el-space>
    </el-col>
    <el-col :span="12" class="text-right">
      <el-space>
        <el-text class="font-bold">总房数： {{ totalHouses }} 间</el-text>
        <el-tag type="danger">剩余 {{ unassignedHouses }} 间未分配</el-tag>
        <el-tag type="success">启用 {{ enabledHouses }} 间</el-tag>
        <el-tag type="info">锁房 {{ disabledHouses }} 间</el-tag>
      </el-space>
    </el-col>
  </el-row>

  <el-row :gutter="20">
    <el-col :span="24">
      <div class="house-floor-management p-1" style="height: 70vh">
        <div class="flex space-x-6 h-full">
          <!-- 左侧房型管理 -->
          <div class="w-60 rounded-lg shadow p-4 h-fit" style="background-color: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter)">
            <div class="flex justify-between items-center mb-3">
              <el-text size="large" class="font-bold" style="color: var(--el-text-color-primary)">房型名称</el-text>
              <el-tooltip content="创建/修改房型后，在右侧选择房间可以分配房型" placement="top">
                <el-icon style="color: var(--el-text-color-placeholder); cursor: help">
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
            </div>

            <!-- 房型列表 -->
            <div class="space-y-2 mb-4 overflow-y-auto" style="max-height: calc(65vh - 120px)">
              <div
                v-for="houseLayout in form.houseLayoutList"
                :key="houseLayout.id"
                class="layout-item"
                :class="{ 'layout-item-active': selectedHouseLayoutId === houseLayout.id }"
                @click="selectedHouseLayoutId = houseLayout.id"
              >
                <div>
                  <div class="layout-name">{{ houseLayout.layoutName }}</div>
                  <div class="layout-desc">{{ houseLayout.bedroom }}室{{ houseLayout.livingRoom }}厅{{ houseLayout.kitchen }}厨{{ houseLayout.bathroom }}卫</div>
                </div>
                <div class="flex justify-end">
                  <el-space>
                    <el-button size="small" type="primary" text @click.stop="editHouseLayout(houseLayout)">
                      <el-icon>
                        <Edit />
                      </el-icon>
                    </el-button>
                    <el-button size="small" type="danger" text @click.stop="deleteHouseLayout(houseLayout.id)">
                      <el-icon>
                        <Delete />
                      </el-icon>
                    </el-button>
                  </el-space>
                </div>
              </div>
            </div>

            <!-- 创建房型 -->
            <div class="create-layout-btn" @click="handleCreateHouseLayout">
              <el-space>
                <IconifyIconOffline :icon="AntDesignPlusCircleOutlined" />
                <div class="create-layout-text">创建房型</div>
              </el-space>
            </div>
          </div>

          <!-- 右侧房源信息 -->
          <div class="house-panel">
            <!-- 楼栋切换区域 -->
            <div class="building-selector">
              <div class="flex justify-between" style="align-items: center; min-height: 40px; padding: 4px 0">
                <div class="flex flex-wrap gap-2" style="align-items: center">
                  <el-button
                    v-for="(building, index) in form.buildings"
                    :key="index"
                    :type="selectedBuildingIndex === index ? 'primary' : 'default'"
                    size="default"
                    @click="selectBuilding(index)"
                  >
                    {{ building.building }}栋
                    {{ building.unit ? `${building.unit}单元` : "" }}
                    <el-tag v-if="getBuildingHouseCount(index) > 0" size="small" class="ml-1" effect="light">{{ getBuildingHouseCount(index) }}间</el-tag>
                  </el-button>
                </div>
                <div class="flex flex-wrap gap-2" style="align-items: center">
                  <!-- 添加楼层按钮 -->
                  <el-popover v-model:visible="showAddFloorPopover" placement="bottom" :width="300" trigger="click">
                    <template #reference>
                      <el-button plain type="primary" size="small" :icon="Plus">添加楼层</el-button>
                    </template>
                    <div>
                      <el-form @submit.prevent="confirmAddFloor">
                        <el-form-item label="楼层号">
                          <el-input-number v-model="newFloorNumber" :min="1" :max="99" placeholder="请输入楼层号" style="width: 100%" />
                        </el-form-item>
                        <div class="popover-tip">将按照当前楼栋配置创建：每层 {{ currentBuilding?.houseCountPerFloor || 0 }} 间房源</div>
                        <div class="text-right">
                          <el-button size="small" @click="showAddFloorPopover = false">取消</el-button>
                          <el-button type="primary" size="small" @click="confirmAddFloor">确定</el-button>
                        </div>
                      </el-form>
                    </div>
                  </el-popover>
                  <!-- 统计信息 -->
                  <el-tag type="info">共 {{ currentBuildingStats.floors }} 层</el-tag>
                  <el-tag type="info">共 {{ currentBuildingStats.total }} 间</el-tag>
                  <el-tag type="danger">剩余 {{ currentBuildingStats.unassigned }} 间未分配</el-tag>
                  <el-tag type="success">启用 {{ currentBuildingStats.enabled }} 间</el-tag>
                  <el-tag type="info">锁房 {{ currentBuildingStats.disabled }} 间</el-tag>
                </div>
              </div>
            </div>

            <!-- 按楼层显示房源 -->
            <div class="floors-container">
              <div v-for="floor in currentBuildingFloors" :key="floor" class="floor-section">
                <div class="floor-header">
                  <h4 class="floor-title" :class="{ 'floor-title-disabled': isFloorDisabled(floor) }">
                    {{ floor }}F
                    <el-tag v-if="isFloorDisabled(floor)" type="info" size="small" class="ml-2">已禁用</el-tag>
                  </h4>

                  <div class="flex items-center gap-2">
                    <!-- 禁用/启用楼层按钮 -->
                    <el-button size="small" :type="isFloorDisabled(floor) ? 'success' : 'warning'" plain @click="toggleFloorStatus(floor)">
                      <el-icon>
                        <Lock v-if="!isFloorDisabled(floor)" />
                        <Unlock v-else />
                      </el-icon>
                      {{ isFloorDisabled(floor) ? "启用楼层" : "禁用楼层" }}
                    </el-button>

                    <!-- 删除楼层按钮 -->
                    <el-popconfirm
                      :title="`确定要删除第 ${floor} 层吗？该楼层的 ${getHousesByFloor(floor).length} 个房源数据将被永久删除。`"
                      confirm-button-text="确定"
                      cancel-button-text="取消"
                      :icon="InfoFilled"
                      icon-color="#ff4949"
                      @confirm="deleteFloor(floor)"
                    >
                      <template #reference>
                        <el-button size="small" type="danger" plain>
                          <el-icon>
                            <Delete />
                          </el-icon>
                          删除楼层
                        </el-button>
                      </template>
                    </el-popconfirm>

                    <!-- 全选复选框 -->
                    <el-checkbox
                      v-model="getFloorChecked(floor).value"
                      :indeterminate="getFloorIndeterminate(floor)"
                      :disabled="isFloorDisabled(floor)"
                      class="floor-checkbox"
                      @change="handleFloorSelectAll(floor, $event)"
                    >
                      全选
                    </el-checkbox>
                  </div>
                </div>

                <div class="floor-content" :class="getFloorBorderClass(floor)">
                  <!-- 禁用遮罩层 -->
                  <div v-if="isFloorDisabled(floor)" class="floor-disabled-mask">
                    <div class="floor-disabled-badge">
                      <el-icon class="mr-2">
                        <Lock />
                      </el-icon>
                      <span class="font-medium">楼层已禁用</span>
                    </div>
                  </div>
                  <div class="grid grid-cols-6 gap-3">
                    <div
                      v-for="house in getHousesByFloor(floor)"
                      :key="house.cursor"
                      class="house-card"
                      :class="[
                        getHouseCardClass(house),
                        {
                          'cursor-pointer hover:shadow': !isFloorDisabled(floor),
                          'cursor-not-allowed': isFloorDisabled(floor)
                        }
                      ]"
                      style="min-width: 100px"
                      @click="!isFloorDisabled(floor) && toggleHouseSelection(house.cursor)"
                      @contextmenu.prevent="!isFloorDisabled(floor) && handleHouseRightClick($event, house)"
                    >
                      <!-- 房源信息标签 -->
                      <div v-if="house.houseLayoutId && !isFloorDisabled(floor)" class="house-info-badge">{{ house.price }}元 {{ house.area }}m²</div>

                      <!-- 选中图标 -->
                      <div class="absolute top-1 right-1">
                        <el-icon v-if="selectedHouses.includes(house.cursor) && !isFloorDisabled(floor)" class="text-blue-500" size="14">
                          <CircleCheckFilled />
                        </el-icon>
                      </div>

                      <div class="text-center">
                        <el-space width="auto">
                          <IconifyIconOffline v-if="house.closed || isFloorDisabled(floor)" :icon="AntDesignLockFilled" />
                          <span class="house-number" :class="{ 'house-number-disabled': house.closed || isFloorDisabled(floor) }">
                            {{ house.doorNumber }}
                          </span>
                          <el-tag v-if="house.houseLayoutId && !isFloorDisabled(floor)" :type="getHouseLayoutTagType(house.houseLayoutId)" size="small" class="text-xs px-1">
                            {{ getHouseLayoutName(house.houseLayoutId) }}
                          </el-tag>
                        </el-space>
                      </div>
                    </div>

                    <!-- 添加房源按钮 -->
                    <div v-if="!isFloorDisabled(floor)" class="add-house-btn" style="min-width: 120px" @click="addHouse(floor)">
                      <el-icon class="add-house-icon">
                        <Plus />
                      </el-icon>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 批量配置区域 -->
            <div class="batch-config-panel">
              <div class="mb-3">
                <span class="batch-config-title">对「{{ getSelectedHouseNumbers() }}」房源进行统一配置</span>
              </div>

              <div class="grid grid-cols-12 gap-3 mb-3">
                <div class="col-span-2">
                  <el-select v-model="batchConfig.houseLayoutId" placeholder="请选择房型" class="w-full">
                    <template #prefix>房型</template>
                    <el-option v-for="houseLayout in form.houseLayoutList" :key="houseLayout.id" :label="houseLayout.layoutName" :value="houseLayout.id" />
                  </el-select>
                </div>

                <div class="col-span-3">
                  <el-input v-model="batchConfig.price" placeholder="请输入价格" type="number">
                    <template #prepend>价格</template>
                    <template #append>元</template>
                  </el-input>
                </div>

                <div class="col-span-2">
                  <el-select v-model="batchConfig.direction" placeholder="朝向" class="w-full">
                    <el-option label="东" value="东" />
                    <el-option label="南" value="南" />
                    <el-option label="西" value="西" />
                    <el-option label="北" value="北" />
                    <el-option label="东南" value="东南" />
                    <el-option label="西南" value="西南" />
                    <el-option label="东北" value="东北" />
                    <el-option label="西北" value="西北" />
                  </el-select>
                </div>

                <div class="col-span-2">
                  <el-input v-model="batchConfig.area" placeholder="面积" type="number">
                    <template #append>m²</template>
                  </el-input>
                </div>

                <div class="col-span-3">
                  <div class="flex justify-end space-x-2 text-right">
                    <el-button type="primary" @click="applyBatchConfig">应用配置</el-button>
                    <el-button @click="clearSelection">取消选择</el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右键菜单 -->
        <div v-show="contextMenu.visible" :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }" class="context-menu" @click="hideContextMenu">
          <div class="context-menu-item" @click="editHouse(contextMenu.house)">
            <el-icon class="mr-2">
              <Edit />
            </el-icon>
            修改
          </div>
          <!-- 锁房/解锁选项 -->
          <div class="context-menu-item" :class="contextMenu.house?.closed ? 'context-menu-item-unlock' : 'context-menu-item-lock'" @click="toggleHouseLock(contextMenu.house)">
            <el-icon class="mr-2">
              <Unlock v-if="contextMenu.house?.closed" />
              <Lock v-else />
            </el-icon>
            {{ contextMenu.house?.closed ? "解锁" : "锁房" }}
          </div>
          <div class="context-menu-item context-menu-item-delete" @click="deleteHouseAction(contextMenu.house)">
            <el-icon class="mr-2">
              <Delete />
            </el-icon>
            删除
          </div>
        </div>

        <!-- 添加/编辑房源对话框 -->
        <el-dialog v-model="showAddHouseDialog" :title="isEditingHouse ? '编辑房源' : '添加房源'" width="350px" @closed="resetHouseForm">
          <el-form :model="newHouseForm" label-width="80px">
            <el-form-item label="房源号" required>
              <el-input v-model="newHouseForm.houseNumber" placeholder="请输入房源号" />
            </el-form-item>
          </el-form>

          <template #footer>
            <span class="dialog-footer">
              <el-button @click="showAddHouseDialog = false">取消</el-button>
              <el-button type="primary" @click="saveHouse">
                {{ isEditingHouse ? "更新" : "确定" }}
              </el-button>
            </span>
          </template>
        </el-dialog>
      </div>
    </el-col>
  </el-row>

  <el-row :gutter="20">
    <el-col :span="24" class="text-right">
      <el-button type="primary" style="margin-top: 12px" @click="stepPrevious">上一步</el-button>
      <el-button type="primary" style="margin-top: 12px" @click="resetHouses">重置</el-button>
      <el-button type="primary" style="margin-top: 12px" @click="clickSaveAssignHouse">保存并完善项目</el-button>
    </el-col>
  </el-row>
</template>

<style scoped>
  /* ==================== 主题变量适配 ==================== */

  /* 房源卡片状态类 */
  .house-card-selected {
    border-color: var(--el-color-primary) !important;
    background-color: var(--el-color-primary-light-9) !important;
  }

  .house-card-assigned {
    border-color: var(--el-color-success-light-5);
    background-color: var(--el-bg-color);
  }

  .house-card-assigned:hover {
    background-color: var(--el-color-success-light-9);
  }

  .house-card-unassigned {
    border-color: var(--el-border-color);
    background-color: var(--el-bg-color);
  }

  .house-card-unassigned:hover {
    background-color: var(--el-fill-color-light);
  }

  /* 楼层边框状态类 */
  .floor-border-disabled {
    border-color: var(--el-border-color);
  }

  .floor-border-all-selected {
    border-color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
  }

  .floor-border-partial-selected {
    border-color: var(--el-color-primary-light-5);
    background-color: var(--el-color-primary-light-9);
  }

  .floor-border-default {
    border-color: var(--el-border-color);
  }

  /* 房型列表项 */
  .layout-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    background-color: var(--el-bg-color);
  }

  .layout-item:hover {
    background-color: var(--el-fill-color-light);
  }

  .layout-item-active {
    background-color: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-5);
  }

  .layout-name {
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  .layout-desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  /* 创建房型按钮 */
  .create-layout-btn {
    border: 2px dashed var(--el-border-color);
    border-radius: 8px;
    padding: 8px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background-color: var(--el-bg-color);
  }

  .create-layout-btn:hover {
    border-color: var(--el-color-primary);
  }

  .create-layout-text {
    font-size: 14px;
    color: var(--el-text-color-regular);
  }

  /* 右侧房源面板 */
  .house-panel {
    flex: 1;
    border-radius: 8px;
    box-shadow: var(--el-box-shadow-lighter);
    padding: 12px;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background-color: var(--el-bg-color);
  }

  /* 楼栋切换区域 */
  .building-selector {
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  /* Popover 提示文本 */
  .popover-tip {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    margin-bottom: 12px;
  }

  /* 楼层容器 */
  .floors-container {
    flex: 1;
    overflow-y: auto;
    max-height: calc(100% - 180px);
  }

  .floor-section {
    margin-bottom: 12px;
    transition: all 0.3s ease;
  }

  .floor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .floor-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  .floor-title-disabled {
    color: var(--el-text-color-placeholder);
  }

  /* 楼层内容区域 */
  .floor-content {
    border: 2px solid var(--el-border-color);
    border-radius: 8px;
    padding: 16px;
    transition: all 0.3s ease;
    position: relative;
    background-color: var(--el-bg-color);
  }

  /* 禁用遮罩 */
  .floor-disabled-mask {
    position: absolute;
    inset: 0;
    background-color: var(--el-overlay-color-lighter);
    border-radius: 8px;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .floor-disabled-badge {
    background-color: var(--el-bg-color);
    padding: 8px 16px;
    border-radius: 8px;
    box-shadow: var(--el-box-shadow);
    color: var(--el-text-color-regular);
    display: flex;
    align-items: center;
  }

  /* 房源卡片 */
  .house-card {
    position: relative;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    padding: 8px;
    transition: all 0.3s ease;
    background-color: var(--el-bg-color);
  }

  .house-card:hover {
    box-shadow: var(--el-box-shadow-light);
  }

  /* 房源信息标签 */
  .house-info-badge {
    position: absolute;
    top: -8px;
    right: -4px;
    background-color: var(--el-color-danger-light-3);
    color: var(--el-color-white);
    font-size: 12px;
    padding: 2px 4px;
    border-radius: 9999px;
    min-width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--el-bg-color);
    box-shadow: var(--el-box-shadow-light);
    z-index: 10;
  }

  .house-number {
    font-weight: 500;
    font-size: 14px;
    color: var(--el-text-color-primary);
  }

  .house-number-disabled {
    color: var(--el-text-color-placeholder);
    text-decoration: line-through;
  }

  /* 添加房源按钮 */
  .add-house-btn {
    border: 2px dashed var(--el-border-color);
    border-radius: 8px;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background-color: var(--el-bg-color);
  }

  .add-house-btn:hover {
    border-color: var(--el-color-primary);
  }

  .add-house-icon {
    color: var(--el-text-color-placeholder);
  }

  /* 批量配置面板 */
  .batch-config-panel {
    margin-top: 16px;
    border: 2px solid var(--el-border-color-light);
    border-radius: 8px;
    padding: 8px;
    background-color: var(--el-color-primary-light-9);
    flex-shrink: 0;
  }

  .batch-config-title {
    color: var(--el-color-danger);
    font-weight: 500;
  }

  /* 右键菜单 */
  .context-menu {
    position: fixed;
    z-index: 50;
    background-color: var(--el-bg-color-overlay);
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    box-shadow: var(--el-box-shadow);
    padding: 4px 0;
    min-width: 96px;
    backdrop-filter: blur(10px);
  }

  .context-menu-item {
    padding: 8px 12px;
    font-size: 14px;
    color: var(--el-text-color-primary);
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: background-color 0.3s ease;
  }

  .context-menu-item:hover {
    background-color: var(--el-fill-color-light);
  }

  .context-menu-item-unlock {
    color: var(--el-color-success);
  }

  .context-menu-item-lock {
    color: var(--el-color-warning);
  }

  .context-menu-item-delete {
    color: var(--el-color-danger);
  }

  /* 楼层复选框 */
  .floor-checkbox :deep(.el-checkbox__label) {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  /* Input Number 居中 */
  :deep(.el-input-number .el-input__inner) {
    text-align: center;
  }

  /* 其他工具类 */
  .relative {
    position: relative;
  }

  .absolute {
    position: absolute;
  }
</style>
