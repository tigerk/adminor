<template>
  <el-row :gutter="20" class="flex items-center justify-end p-1">
    <el-col :span="12">
      <el-space>
        <el-text tag="b" class="mx-1" size="large">项目名称 {{ projectName }}</el-text>
      </el-space>
    </el-col>
    <el-col :span="6" class="text-right">
      <el-space>
        <el-tag type="info">共 {{ totalFloors }} 层</el-tag>
        <el-tag type="info">共 {{ totalRooms }} 间</el-tag>
      </el-space>
    </el-col>
    <el-col :span="6" class="text-right">
      <el-space>
        <el-tag type="danger" size="large">剩余 {{ unassignedRooms }} 间未分配</el-tag>
        <el-tag type="success" size="large">启用 {{ enabledRooms }} 间</el-tag>
        <el-tag type="info" size="large">禁用 {{ disabledRooms }} 间</el-tag>
      </el-space>
    </el-col>
  </el-row>
  <el-row :gutter="20">
    <el-col :span="24">
      <div class="room-floor-management p-1" style="height: 80vh">
        <!-- 左侧房型管理 -->
        <div class="flex space-x-6 h-full">
          <div class="w-60 rounded-lg shadow-sm p-4 h-fit">
            <div class="flex justify-between items-center mb-1">
              <h2 class="text-lg font-semibold text-gray-800">房型名称</h2>
              <el-tooltip content="创建房型" placement="top">
                <el-icon class="text-gray-400 cursor-help">
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
            </div>

            <!-- 房型列表 -->
            <div class="space-y-2 mb-4">
              <div
                v-for="houseLayout in form.houseLayoutList"
                :key="houseLayout.id"
                class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                :class="{ 'bg-blue-50 border-blue-300': selectedHouseLayoutId === houseLayout.id }"
                @click="selectedHouseLayoutId = houseLayout.id"
              >
                <div>
                  <div class="font-medium text-gray-900">{{ houseLayout.layoutName }}</div>
                  <div class="text-xs text-gray-500">{{ houseLayout.bedroom }}室{{ houseLayout.livingRoom }}厅{{ houseLayout.kitchen }}厨{{ houseLayout.bathroom }}卫</div>
                </div>
                <div class="flex space-x-1">
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
                </div>
              </div>
            </div>

            <!-- 创建房型 -->
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-1 text-center hover:border-blue-300 cursor-pointer transition-colors" @click="showCreateDialog = true">
              <el-space>
                <IconifyIconOffline :icon="AntDesignPlusCircleOutlined" />
                <div class="text-sm text-gray-600">创建房型</div>
              </el-space>
            </div>
          </div>

          <!-- 右侧房间信息 -->
          <div class="flex-1 rounded-lg shadow-sm p-3 h-full overflow-hidden flex flex-col">
            <h2 class="text-lg font-semibold text-gray-800 mb-3 pb-2">房间信息</h2>
            <!-- 按楼层显示房间 - 减小高度 -->
            <div class="flex-1 overflow-y-auto space-y-3" style="max-height: calc(100% - 100px)">
              <div v-for="floor in floors" :key="floor" class="floor-section">
                <div class="flex justify-between items-center mb-1">
                  <h3 class="text-md font-medium text-gray-700">{{ floor }}F</h3>
                  <el-checkbox
                    v-model="getFloorChecked(floor).value"
                    :indeterminate="getFloorIndeterminate(floor)"
                    class="floor-checkbox"
                    @change="handleFloorSelectAll(floor, $event)"
                  >
                    全选
                  </el-checkbox>
                </div>

                <div class="border-2 rounded-lg p-4" :class="getFloorBorderClass(floor)">
                  <div class="grid grid-cols-6 gap-3">
                    <div
                      v-for="room in getRoomsByFloor(floor)"
                      :key="room.cursor"
                      class="relative border rounded-lg p-2 cursor-pointer transition-all hover:shadow-sm"
                      :class="getRoomCardClass(room)"
                      style="min-width: 100px"
                      @click="toggleRoomSelection(room.cursor)"
                      @contextmenu.prevent="handleRoomRightClick($event, room)"
                    >
                      <div
                        v-if="room.houseLayoutId"
                        class="absolute -top-2 -right-1 bg-red-300 text-white text-xs px-1 py-0.5 rounded-full min-w-[16px] h-4 flex items-center justify-center border border-white shadow-sm z-10"
                      >
                        {{ room.price }}元 {{ room.area }}m²
                      </div>

                      <!-- 选中图标 -->
                      <div class="absolute top-1 right-1">
                        <el-icon v-if="selectedRooms.includes(room.cursor)" class="text-blue-500" size="14">
                          <CircleCheckFilled />
                        </el-icon>
                      </div>

                      <div class="text-center">
                        <!-- 房间号和房型标签放在同一行 -->
                        <el-space width="auto">
                          <!--锁定图标-->
                          <IconifyIconOffline v-if="room.locked" :icon="AntDesignLockFilled" />
                          <span class="font-medium text-sm" :class="{ 'text-gray-400 line-through': room.locked }">{{ room.roomNumber }}</span>
                          <el-tag v-if="room.houseLayoutId" :type="getHouseLayoutTagType(room.houseLayoutId)" size="small" class="text-xs px-1">
                            {{ getHouseLayoutName(room.houseLayoutId) }}
                          </el-tag>
                        </el-space>
                      </div>
                    </div>

                    <!-- 添加房间按钮 -->
                    <div
                      class="border-2 border-dashed border-gray-300 rounded-lg p-2 flex items-center justify-center hover:border-blue-300 cursor-pointer transition-colors"
                      style="min-width: 120px"
                      @click="addRoom(floor)"
                    >
                      <el-icon class="text-gray-400">
                        <Plus />
                      </el-icon>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 批量配置区域 - 调整布局 -->
            <div class="mt-4 border-2 border-b-gray-300 rounded-lg p-2 bg-blue-25 flex-shrink-0">
              <div class="mb-3">
                <span class="text-red-700 font-medium">对「{{ getSelectedRoomNumbers() }}」房间进行统一配置</span>
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
                  <!-- 按钮放在同一行右侧 -->
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
        <div
          v-show="contextMenu.visible"
          :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
          class="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-24"
          @click="hideContextMenu"
        >
          <div class="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center" @click="editRoom(contextMenu.room)">
            <el-icon class="mr-2">
              <Edit />
            </el-icon>
            修改
          </div>
          <div class="px-3 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer flex items-center" @click="deleteRoom(contextMenu.room)">
            <el-icon class="mr-2">
              <Delete />
            </el-icon>
            删除
          </div>
        </div>

        <!-- 创建/编辑房型对话框 -->
        <el-dialog v-model="showCreateDialog" :title="isEditing ? '编辑房型' : '创建房型'" width="600px" @closed="resetForm">
          <el-form ref="formRef" :model="houseLayoutForm" :rules="rules" label-width="80px">
            <el-form-item label="房型名称" prop="name">
              <el-input v-model="houseLayoutForm.name" placeholder="请输入房型名称" />
            </el-form-item>

            <el-form-item label="户型配置">
              <el-row>
                <el-col :span="6">
                  <label class="text-sm text-gray-600 block mb-1">卧室</label>
                  <el-input-number v-model="houseLayoutForm.bedroom" :min="0" :max="10" size="small" class="w-full" />
                </el-col>
                <el-col :span="6">
                  <label class="text-sm text-gray-600 block mb-1">客厅</label>
                  <el-input-number v-model="houseLayoutForm.livingRoom" :min="0" :max="5" size="small" class="w-full" />
                </el-col>
                <el-col :span="6">
                  <label class="text-sm text-gray-600 block mb-1">厨房</label>
                  <el-input-number v-model="houseLayoutForm.kitchen" :min="0" :max="3" size="small" class="w-full" />
                </el-col>
                <el-col :span="6">
                  <label class="text-sm text-gray-600 block mb-1">卫生间</label>
                  <el-input-number v-model="houseLayoutForm.bathroom" :min="0" :max="5" size="small" class="w-full" />
                </el-col>
              </el-row>
            </el-form-item>
          </el-form>

          <template #footer>
            <span class="dialog-footer">
              <el-button @click="showCreateDialog = false">取消</el-button>
              <el-button type="primary" @click="saveHouseLayout">
                {{ isEditing ? "更新" : "创建" }}
              </el-button>
            </span>
          </template>
        </el-dialog>

        <!-- 添加/编辑房间对话框 -->
        <el-dialog v-model="showAddRoomDialog" :title="isEditingRoom ? '编辑房间' : '添加房间'" width="350px" @closed="resetRoomForm">
          <el-form :model="newRoomForm" label-width="80px">
            <el-form-item label="房间号" required>
              <el-input v-model="newRoomForm.roomNumber" placeholder="请输入房间号" />
            </el-form-item>
          </el-form>

          <template #footer>
            <span class="dialog-footer">
              <el-button @click="showAddRoomDialog = false">取消</el-button>
              <el-button type="primary" @click="saveRoom">
                {{ isEditingRoom ? "更新" : "确定" }}
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
      <el-button type="primary" style="margin-top: 12px" @click="initRoomsFromFormData">重置</el-button>
      <el-button type="primary" style="margin-top: 12px" @click="clickSaveAssignRoom">保存并完善项目</el-button>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
  import { ref, computed, reactive, onMounted, onUnmounted, watch, defineModel } from "vue";
  import { CheckboxValueType, ElMessage, ElMessageBox, type FormInstance } from "element-plus";
  import { Plus, Edit, Delete, QuestionFilled, CircleCheckFilled, Lock } from "@element-plus/icons-vue";
  import AntDesignPlusCircleOutlined from "~icons/ant-design/plus-circle-outlined";
  import { HouseLayoutProps, RoomStatusProps, FocusFormItemProps } from "@/views/house/focus/components/FocusCreate/utils/types";
  import { useFocusEdit } from "@/views/house/focus/components/FocusCreate/utils/hook";
  import AntDesignLockFilled from "~icons/ant-design/lock-filled";

  // 获取 FocusCreateForm 中的form数据
  const form = defineModel<FocusFormItemProps>();

  if (form.value.houseLayoutList === undefined || form.value.houseLayoutList === null) {
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

  // 添加多个调试点
  console.log("=== FocusAssignRoom 组件初始化 ===");
  console.log("初始 form.value:", form.value.houseLayoutList);

  // 定义 emits
  const emit = defineEmits<{
    "to-add-extra": [];
    "step-previous": [];
  }>();

  // 状态管理
  const selectedHouseLayoutId = ref<string>("");
  const selectedRooms = ref<string[]>([]);
  const showCreateDialog = ref(false);
  const showAddRoomDialog = ref(false);
  const isEditing = ref(false);
  const isEditingRoom = ref(false);
  const formRef = ref<FormInstance>();

  // 右键菜单状态
  const contextMenu = reactive({
    visible: false,
    x: 0,
    y: 0,
    room: null as RoomStatusProps | null
  });

  // 批量配置表单
  const batchConfig = reactive({
    houseLayoutId: "",
    price: "",
    direction: "",
    area: ""
  });

  // 房型表单
  const houseLayoutForm = reactive({
    id: "",
    name: "",
    bedroom: 1,
    livingRoom: 1,
    kitchen: 1,
    bathroom: 1
  });

  // 新房间表单
  const newRoomForm = reactive({
    cursor: "",
    roomNumber: "",
    floor: 1
  });

  // 表单验证规则
  const rules = {
    name: [
      { required: true, message: "请输入房型名称", trigger: "blur" },
      { min: 2, max: 20, message: "房型名称长度为2-20个字符", trigger: "blur" }
    ]
  };

  // 计算属性
  const projectName = computed(() => form.value.houseName || "未命名项目");
  const totalFloors = computed(() => form.value.floorTotal || 0);
  const totalRooms = computed(() => form.value.roomList.length);
  const unassignedRooms = computed(() => form.value.roomList.filter(room => !room.houseLayoutId).length);
  const enabledRooms = computed(() => form.value.roomList.filter(room => !room.locked).length);
  const disabledRooms = computed(() => form.value.roomList.filter(room => room.locked).length);

  const floors = computed(() => {
    const floorSet = new Set(form.value.roomList.map(room => room.floor));
    return Array.from(floorSet).sort((a, b) => a - b);
  });

  // 初始化房间数据
  const initRoomsFromFormData = () => {
    if (!form.value?.roomsStatusOfFloors) {
      return;
    }

    form.value.roomList = [];

    form.value.roomsStatusOfFloors.forEach((roomMap, floor) => {
      roomMap.forEach((roomStatus, roomNumber) => {
        // 检查房间是否被锁定
        const isLocked = form.value.closedRooms?.some(closed => closed.floor === floor && closed.roomNumber === roomStatus.roomNumber) || false;

        // 只有房间号有效时才添加到列表
        form.value.roomList.push({
          cursor: `${floor}-${roomNumber}`,
          roomIndex: roomStatus.roomIndex,
          roomNumber: roomStatus.roomNumber,
          floor: floor,
          locked: isLocked,
          houseLayoutId: roomStatus.houseLayoutId,
          price: roomStatus.price,
          direction: roomStatus.direction,
          area: roomStatus.area
        });
      });
    });
  };

  // 监听props变化
  watch(
    () => form.value,
    () => {
      // 初始化过时，不再进行初始化
      if (!form.value?.roomList) {
        initRoomsFromFormData();
      }
    },
    { deep: true, immediate: true }
  );

  // 立即检查数据
  const checkFormData = () => {
    console.log("=== 检查表单数据 ===");
    console.log("form.value 存在:", !!form.value);
    console.log("form.value:", form.value);

    if (form.value) {
      console.log("houseLayoutList 存在:", !!form.value.houseLayoutList);
      console.log("houseLayoutList 长度:", form.value.houseLayoutList?.length);
      console.log("houseLayoutList 内容:", form.value.houseLayoutList);
    }
  };

  // 生命周期钩子
  onMounted(() => {
    console.log("=== onMounted ===");
    checkFormData();

    document.addEventListener("click", hideContextMenu);
  });

  onUnmounted(() => {
    document.removeEventListener("click", hideContextMenu);
  });

  // 获取每一层的房间数据
  const getRoomsByFloor = (floor: number) => {
    return form.value.roomList
      .filter(room => room.floor === floor)
      .filter(room => {
        // 如果选择了去掉4，过滤掉包含4的房间
        if (form.value?.excludeFour && room.roomNumber) {
          // 检查房间号是否包含数字4
          return !room.roomNumber.includes("4");
        }
        return true;
      })
      .sort((a, b) => {
        // 确保 roomNumber 不为 null
        const aNum = a.roomNumber || "";
        const bNum = b.roomNumber || "";
        return aNum.localeCompare(bNum);
      });
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

  const getRoomCardClass = (room: RoomStatusProps) => {
    if (selectedRooms.value.includes(room.cursor)) {
      return "border-blue-500 bg-blue-50";
    }
    if (room.houseLayoutId) {
      return "border-green-300 bg-white hover:bg-green-50";
    }
    return "border-gray-200 bg-white hover:bg-gray-50";
  };

  const getFloorBorderClass = (floor: number) => {
    const floorRooms = getRoomsByFloor(floor);
    const selectedFloorRooms = floorRooms.filter(room => selectedRooms.value.includes(room.cursor));

    if (selectedFloorRooms.length === floorRooms.length && floorRooms.length > 0) {
      return "border-blue-500 bg-blue-50";
    } else if (selectedFloorRooms.length > 0) {
      return "border-blue-300 bg-blue-25";
    }
    return "border-b-gray-300";
  };

  const getFloorChecked = (floor: number) => {
    const floorRooms = getRoomsByFloor(floor);
    const selectedFloorRooms = floorRooms.filter(room => selectedRooms.value.includes(room.cursor));
    return { value: selectedFloorRooms.length === floorRooms.length && floorRooms.length > 0 };
  };

  const getFloorIndeterminate = (floor: number) => {
    const floorRooms = getRoomsByFloor(floor);
    const selectedFloorRooms = floorRooms.filter(room => selectedRooms.value.includes(room.cursor));
    return selectedFloorRooms.length > 0 && selectedFloorRooms.length < floorRooms.length;
  };

  const handleFloorSelectAll = (floor: number, checked: CheckboxValueType) => {
    // 转换为 boolean 类型
    const isChecked = Boolean(checked);

    const floorRooms = getRoomsByFloor(floor);
    const floorRoomIds = floorRooms.map(room => room.cursor);

    if (isChecked) {
      floorRoomIds.forEach(roomId => {
        if (!selectedRooms.value.includes(roomId)) {
          selectedRooms.value.push(roomId);
        }
      });
    } else {
      selectedRooms.value = selectedRooms.value.filter(roomId => !floorRoomIds.includes(roomId));
    }
  };

  const toggleRoomSelection = (roomId: string) => {
    const index = selectedRooms.value.indexOf(roomId);
    if (index > -1) {
      selectedRooms.value.splice(index, 1);
    } else {
      selectedRooms.value.push(roomId);
    }
  };

  const getSelectedRoomNumbers = () => {
    return selectedRooms.value
      .map(id => form.value.roomList.find(room => room.cursor === id)?.roomNumber)
      .filter(Boolean)
      .join("、");
  };

  const applyBatchConfig = () => {
    if (selectedRooms.value.length === 0) {
      ElMessage.warning("请先选择房间");
      return;
    }

    selectedRooms.value.forEach(roomId => {
      const room = form.value.roomList.find(r => r.cursor === roomId);
      if (room) {
        if (batchConfig.houseLayoutId !== "") {
          room.houseLayoutId = batchConfig.houseLayoutId || undefined;
        }
        if (batchConfig.price) {
          room.price = Number(batchConfig.price);
        }
        if (batchConfig.direction) {
          room.direction = batchConfig.direction;
        }
        if (batchConfig.area) {
          room.area = Number(batchConfig.area);
        }
      }
    });

    ElMessage.success(`已对${selectedRooms.value.length}个房间应用配置`);
    clearSelection();
  };

  const clearSelection = () => {
    selectedRooms.value = [];
    batchConfig.houseLayoutId = "";
    batchConfig.price = "";
    batchConfig.direction = "";
    batchConfig.area = "";
  };

  // 右键菜单相关方法
  const handleRoomRightClick = (event: MouseEvent, room: RoomStatusProps) => {
    event.preventDefault();
    contextMenu.visible = true;
    contextMenu.x = event.clientX;
    contextMenu.y = event.clientY;
    contextMenu.room = room;
  };

  const hideContextMenu = () => {
    contextMenu.visible = false;
    contextMenu.room = null;
  };

  const editRoom = (room: RoomStatusProps | null) => {
    if (!room) return;

    isEditingRoom.value = true;
    newRoomForm.cursor = room.cursor;
    newRoomForm.roomNumber = room.roomNumber;
    newRoomForm.floor = room.floor;
    showAddRoomDialog.value = true;
    hideContextMenu();
  };

  const deleteRoom = async (room: RoomStatusProps | null) => {
    if (!room) return;

    try {
      await ElMessageBox.confirm(`确定要删除房间 ${room.roomNumber} 吗？`, "警告", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      });

      const index = form.value.roomList.findIndex(r => r.cursor === room.cursor);
      if (index > -1) {
        form.value.roomList.splice(index, 1);
        const selectedIndex = selectedRooms.value.indexOf(room.cursor);
        if (selectedIndex > -1) {
          selectedRooms.value.splice(selectedIndex, 1);
        }
        ElMessage.success("房间删除成功");
      }
    } catch {
      // 用户取消删除
    }

    hideContextMenu();
  };

  const addRoom = (floor: number) => {
    newRoomForm.floor = floor;
    showAddRoomDialog.value = true;
  };

  const saveRoom = () => {
    if (!newRoomForm.roomNumber) {
      ElMessage.warning("请输入房间号");
      return;
    }

    if (isEditingRoom.value) {
      const exists = form.value.roomList.some(room => room.roomNumber === newRoomForm.roomNumber && room.cursor !== newRoomForm.cursor);
      if (exists) {
        ElMessage.warning("房间号已存在");
        return;
      }

      const room = form.value.roomList.find(r => r.cursor === newRoomForm.cursor);
      if (room) {
        room.roomNumber = newRoomForm.roomNumber;
        ElMessage.success("房间修改成功");
      }
    } else {
      const exists = form.value.roomList.some(room => room.roomNumber === newRoomForm.roomNumber);
      if (exists) {
        ElMessage.warning("房间号已存在");
        return;
      }

      let tmpId = Date.now();
      const newRoom: RoomStatusProps = {
        cursor: tmpId.toString(),
        roomIndex: tmpId,
        roomNumber: newRoomForm.roomNumber,
        floor: newRoomForm.floor,
        locked: false,
        houseLayoutId: undefined,
        price: undefined,
        direction: undefined,
        area: undefined
      };

      form.value.roomList.push(newRoom);
      ElMessage.success("房间添加成功");
    }

    showAddRoomDialog.value = false;
  };

  const resetRoomForm = () => {
    isEditingRoom.value = false;
    newRoomForm.cursor = "";
    newRoomForm.roomNumber = "";
    newRoomForm.floor = 1;
  };

  const editHouseLayout = (houseLayout: HouseLayoutProps) => {
    isEditing.value = true;
    houseLayoutForm.id = houseLayout.id;
    houseLayoutForm.name = houseLayout.layoutName;
    houseLayoutForm.bedroom = houseLayout.bedroom;
    houseLayoutForm.livingRoom = houseLayout.livingRoom;
    houseLayoutForm.kitchen = houseLayout.kitchen;
    houseLayoutForm.bathroom = houseLayout.bathroom;
    showCreateDialog.value = true;
  };

  const deleteHouseLayout = async (id: string) => {
    const assignedRooms = form.value.roomList.filter(room => room.houseLayoutId === id);
    if (assignedRooms.length > 0) {
      ElMessage.warning(`该房型已分配给${assignedRooms.length}个房间，请先清除房间分配后再删除`);
      return;
    }

    try {
      await ElMessageBox.confirm("确定要删除这个房型吗？", "警告", {
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

  const saveHouseLayout = async () => {
    if (!formRef.value) return;

    try {
      await formRef.value.validate();

      if (isEditing.value) {
        const index = form.value.houseLayoutList.findIndex(hl => hl.id === houseLayoutForm.id);
        if (index > -1) {
          form.value.houseLayoutList[index] = {
            ...form.value.houseLayoutList[index],
            layoutName: houseLayoutForm.name,
            bedroom: houseLayoutForm.bedroom,
            livingRoom: houseLayoutForm.livingRoom,
            kitchen: houseLayoutForm.kitchen,
            bathroom: houseLayoutForm.bathroom
          };
          ElMessage.success("房型更新成功");
        }
      } else {
        const newHouseLayout: HouseLayoutProps = {
          id: Date.now().toString(),
          layoutName: houseLayoutForm.name,
          bedroom: houseLayoutForm.bedroom,
          livingRoom: houseLayoutForm.livingRoom,
          kitchen: houseLayoutForm.kitchen,
          bathroom: houseLayoutForm.bathroom,
          newly: true
        };
        form.value.houseLayoutList.push(newHouseLayout);
        ElMessage.success("房型创建成功");
      }

      showCreateDialog.value = false;
    } catch (error) {
      // 验证失败
    }
  };

  const resetForm = () => {
    isEditing.value = false;
    houseLayoutForm.id = "";
    houseLayoutForm.name = "";
    houseLayoutForm.bedroom = 1;
    houseLayoutForm.livingRoom = 1;
    houseLayoutForm.kitchen = 1;
    houseLayoutForm.bathroom = 1;
    formRef.value?.clearValidate();
  };

  // 保存项目信息
  async function clickSaveAssignRoom() {
    try {
      // 验证表单
      emit("to-add-extra");
    } catch (error) {
      ElMessage.warning("请分配房间");
    }
  }

  async function stepPrevious() {
    emit("step-previous");
  }
</script>

<style scoped>
  .floor-checkbox :deep(.el-checkbox__label) {
    font-size: 14px;
    font-weight: 500;
  }

  :deep(.el-input-number .el-input__inner) {
    text-align: center;
  }

  .bg-blue-25 {
    background-color: rgb(59 130 246 / 10%);
  }

  /* 已关闭房间的样式 */
  .closed-room {
    color: #c0c4cc !important;
    text-decoration: line-through;
    opacity: 0.6;
  }
</style>
