<template>
  <el-row :gutter="20" class="flex items-center justify-end p-1">
    <el-col :span="12">
      <el-space>
        <el-text class="mx-1" size="large">项目名称：2312312</el-text>
      </el-space>
    </el-col>
    <el-col :span="6" class="text-right">
      <el-space>
        <el-text class="mx-1">共 28 层</el-text>
        <el-text class="mx-1">共 252 间</el-text>
      </el-space>
    </el-col>
    <el-col :span="6" class="text-right">
      <el-space>
        <el-tag type="danger" size="large">剩余 1 间未分配</el-tag>
        <el-tag type="success" size="large">启用 1 间</el-tag>
        <el-tag type="info" size="large">禁用 1 间</el-tag>
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
                v-for="roomType in roomTypes"
                :key="roomType.id"
                class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                :class="{ 'bg-blue-50 border-blue-300': selectedRoomTypeId === roomType.id }"
                @click="selectedRoomTypeId = roomType.id"
              >
                <div>
                  <div class="font-medium text-gray-900">{{ roomType.layoutName }}</div>
                  <div class="text-xs text-gray-500">{{ roomType.bedroom }}室{{ roomType.livingRoom }}厅{{ roomType.kitchen }}厨{{ roomType.bathroom }}卫</div>
                </div>
                <div class="flex space-x-1">
                  <el-button size="small" type="primary" text @click.stop="editRoomType(roomType)">
                    <el-icon>
                      <Edit />
                    </el-icon>
                  </el-button>
                  <el-button size="small" type="danger" text @click.stop="deleteRoomType(roomType.id)">
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
                      :key="room.id"
                      class="relative border rounded-lg p-2 cursor-pointer transition-all hover:shadow-sm"
                      :class="getRoomCardClass(room)"
                      style="min-width: 100px"
                      @click="toggleRoomSelection(room.id)"
                      @contextmenu.prevent="handleRoomRightClick($event, room)"
                    >
                      <div
                        v-if="room.roomTypeId"
                        class="absolute -top-2 -right-1 bg-red-300 text-white text-xs px-1 py-0.5 rounded-full min-w-[16px] h-4 flex items-center justify-center border border-white shadow-sm z-10"
                      >
                        {{ room.price }}元 {{ room.area }}m²
                      </div>

                      <!-- 选中图标 -->
                      <div class="absolute top-1 right-1">
                        <el-icon v-if="selectedRooms.includes(room.id)" class="text-blue-500" size="14">
                          <CircleCheckFilled />
                        </el-icon>
                      </div>

                      <div class="text-center">
                        <!-- 房间号和房型标签放在同一行 -->
                        <el-space width="auto">
                          <span class="font-medium text-sm">{{ room.number }}</span>
                          <el-tag v-if="room.roomTypeId" :type="getRoomTypeTagType(room.roomTypeId)" size="small" class="text-xs px-1">
                            {{ getRoomTypeName(room.roomTypeId) }}
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

              <div class="grid grid-cols-5 gap-3 mb-3">
                <div>
                  <el-select v-model="batchConfig.roomTypeId" placeholder="请选择房型" class="w-full">
                    <template #prefix>房型</template>
                    <el-option v-for="roomType in roomTypes" :key="roomType.id" :label="roomType.layoutName" :value="roomType.id" />
                  </el-select>
                </div>

                <div>
                  <el-input v-model="batchConfig.price" placeholder="请输入价格" type="number">
                    <template #prepend>出租价格</template>
                    <template #append>元</template>
                  </el-input>
                </div>

                <div>
                  <el-select v-model="batchConfig.direction" placeholder="请选择" class="w-full">
                    <el-option label="东" value="东" />
                    <el-option label="南" value="南" />
                    <el-option label="西" value="西" />
                    <el-option label="北" value="北" />
                    <el-option label="东南" value="东南" />
                    <el-option label="西南" value="西南" />
                    <el-option label="东北" value="东北" />
                    <el-option label="西北" value="西北" />
                    <template #prefix>朝向</template>
                  </el-select>
                </div>
                <div>
                  <el-input v-model="batchConfig.area" placeholder="请输入面积" type="number">
                    <template #append>m²</template>
                    <template #prepend>面积</template>
                  </el-input>
                </div>
                <div>
                  <!-- 按钮放在同一行右侧 -->
                  <div class="flex justify-end space-x-2">
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
          <el-form ref="formRef" :model="roomTypeForm" :rules="rules" label-width="80px">
            <el-form-item label="房型名称" prop="name">
              <el-input v-model="roomTypeForm.name" placeholder="请输入房型名称" />
            </el-form-item>

            <el-form-item label="户型配置">
              <el-row>
                <el-col :span="6">
                  <label class="text-sm text-gray-600 block mb-1">卧室</label>
                  <el-input-number v-model="roomTypeForm.bedroom" :min="0" :max="10" size="small" class="w-full" />
                </el-col>
                <el-col :span="6">
                  <label class="text-sm text-gray-600 block mb-1">客厅</label>
                  <el-input-number v-model="roomTypeForm.livingRoom" :min="0" :max="5" size="small" class="w-full" />
                </el-col>
                <el-col :span="6">
                  <label class="text-sm text-gray-600 block mb-1">厨房</label>
                  <el-input-number v-model="roomTypeForm.kitchen" :min="0" :max="3" size="small" class="w-full" />
                </el-col>
                <el-col :span="6">
                  <label class="text-sm text-gray-600 block mb-1">卫生间</label>
                  <el-input-number v-model="roomTypeForm.bathroom" :min="0" :max="5" size="small" class="w-full" />
                </el-col>
              </el-row>
            </el-form-item>
          </el-form>

          <template #footer>
            <span class="dialog-footer">
              <el-button @click="showCreateDialog = false">取消</el-button>
              <el-button type="primary" @click="saveRoomType">
                {{ isEditing ? "更新" : "创建" }}
              </el-button>
            </span>
          </template>
        </el-dialog>

        <!-- 添加/编辑房间对话框 -->
        <el-dialog v-model="showAddRoomDialog" :title="isEditingRoom ? '编辑房间' : '添加房间'" width="350px" @closed="resetRoomForm">
          <el-form :model="newRoomForm" label-width="80px">
            <el-form-item label="房间号" required>
              <el-input v-model="newRoomForm.number" placeholder="请输入房间号" />
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
</template>

<script setup lang="ts">
  import { ref, computed, reactive, onMounted, onUnmounted } from "vue";
  import { ElMessage, ElMessageBox, type FormInstance } from "element-plus";
  import { Plus, Edit, Delete, QuestionFilled, CircleCheckFilled } from "@element-plus/icons-vue";
  import AntDesignPlusCircleOutlined from "~icons/ant-design/plus-circle-outlined";
  import { HouseLayoutProps } from "@/views/house/focus/components/utils/types";

  interface Room {
    id: string;
    number: string;
    floor: number;
    roomTypeId?: string;
    price?: number;
    direction?: string;
    area?: number;
  }

  // 响应式数据
  const roomTypes = ref<HouseLayoutProps[]>([
    {
      id: "1",
      layoutName: "精装一房",
      bedroom: 1,
      livingRoom: 1,
      kitchen: 1,
      bathroom: 1
    },
    {
      id: "2",
      layoutName: "精装二房",
      bedroom: 2,
      livingRoom: 1,
      kitchen: 1,
      bathroom: 1
    }
  ]);

  // 房间数据
  const allRooms = ref<Room[]>([
    // 1楼
    { id: "B1001", number: "B1001", floor: 1, roomTypeId: "1", price: 2750, direction: "南", area: 67 },
    { id: "B1002", number: "B1002", floor: 1, roomTypeId: "1" },
    { id: "B1003", number: "B1003", floor: 1 },
    { id: "B1005", number: "B1005", floor: 1, roomTypeId: "1" },
    { id: "B1006", number: "B1006", floor: 1, roomTypeId: "1" },
    { id: "B1007", number: "B1007", floor: 1, roomTypeId: "1" },
    { id: "B1008", number: "B1008", floor: 1, roomTypeId: "1" },
    { id: "B1009", number: "B1009", floor: 1, roomTypeId: "1" },
    { id: "B1010", number: "B1010", floor: 1, roomTypeId: "1" },
    // 2楼
    { id: "B2001", number: "B2001", floor: 2, roomTypeId: "1" },
    { id: "B2002", number: "B2002", floor: 2, roomTypeId: "1" },
    { id: "B2009", number: "B2009", floor: 2, roomTypeId: "1" },
    { id: "B2010", number: "B2010", floor: 2, roomTypeId: "1" },
    { id: "B2003", number: "B2003", floor: 2 },
    { id: "B2005", number: "B2005", floor: 2 },
    { id: "B2006", number: "B2006", floor: 2 },
    { id: "B2007", number: "B2007", floor: 2 },
    { id: "B2008", number: "B2008", floor: 2 },
    // 3楼
    { id: "B3001", number: "B3001", floor: 3 },
    { id: "B3002", number: "B3002", floor: 3 },
    { id: "B3003", number: "B3003", floor: 3 },
    { id: "B3005", number: "B3005", floor: 3 },
    { id: "B3006", number: "B3006", floor: 3 },
    { id: "B3007", number: "B3007", floor: 3 },
    { id: "B3008", number: "B3008", floor: 3 }
  ]);

  // 状态管理
  const selectedRoomTypeId = ref<string>("");
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
    room: null as Room | null
  });

  // 批量配置表单
  const batchConfig = reactive({
    roomTypeId: "",
    price: "",
    direction: "",
    area: ""
  });

  // 房型表单
  const roomTypeForm = reactive({
    id: "",
    name: "",
    bedroom: 1,
    livingRoom: 1,
    kitchen: 1,
    bathroom: 1
  });

  // 新房间表单
  const newRoomForm = reactive({
    id: "",
    number: "",
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
  const floors = computed(() => {
    const floorSet = new Set(allRooms.value.map(room => room.floor));
    return Array.from(floorSet).sort((a, b) => a - b);
  });

  // 生命周期钩子
  onMounted(() => {
    document.addEventListener("click", hideContextMenu);
  });

  onUnmounted(() => {
    document.removeEventListener("click", hideContextMenu);
  });

  // 方法
  const getRoomsByFloor = (floor: number) => {
    return allRooms.value.filter(room => room.floor === floor).sort((a, b) => a.number.localeCompare(b.number));
  };

  const getRoomTypeName = (roomTypeId: string) => {
    const roomType = roomTypes.value.find(rt => rt.id === roomTypeId);
    return roomType ? roomType.layoutName : "未知房型";
  };

  const getRoomTypeTagType = (roomTypeId: string): "success" | "warning" | "info" | "danger" => {
    const colors: ("success" | "warning" | "info" | "danger")[] = ["success", "warning", "info", "danger"];
    const index = parseInt(roomTypeId) % colors.length;
    return colors[index];
  };

  const getRoomCardClass = (room: Room) => {
    if (selectedRooms.value.includes(room.id)) {
      return "border-blue-500 bg-blue-50";
    }
    if (room.roomTypeId) {
      return "border-green-300 bg-white hover:bg-green-50";
    }
    return "border-gray-200 bg-white hover:bg-gray-50";
  };

  const getFloorBorderClass = (floor: number) => {
    const floorRooms = getRoomsByFloor(floor);
    const selectedFloorRooms = floorRooms.filter(room => selectedRooms.value.includes(room.id));

    if (selectedFloorRooms.length === floorRooms.length && floorRooms.length > 0) {
      return "border-blue-500 bg-blue-50";
    } else if (selectedFloorRooms.length > 0) {
      return "border-blue-300 bg-blue-25";
    }
    return "border-b-gray-300";
  };

  const getFloorChecked = (floor: number) => {
    const floorRooms = getRoomsByFloor(floor);
    const selectedFloorRooms = floorRooms.filter(room => selectedRooms.value.includes(room.id));
    return { value: selectedFloorRooms.length === floorRooms.length && floorRooms.length > 0 };
  };

  const getFloorIndeterminate = (floor: number) => {
    const floorRooms = getRoomsByFloor(floor);
    const selectedFloorRooms = floorRooms.filter(room => selectedRooms.value.includes(room.id));
    return selectedFloorRooms.length > 0 && selectedFloorRooms.length < floorRooms.length;
  };

  const handleFloorSelectAll = (floor: number, checked: boolean) => {
    const floorRooms = getRoomsByFloor(floor);
    const floorRoomIds = floorRooms.map(room => room.id);

    if (checked) {
      // 添加该楼层所有房间到选中列表
      floorRoomIds.forEach(roomId => {
        if (!selectedRooms.value.includes(roomId)) {
          selectedRooms.value.push(roomId);
        }
      });
    } else {
      // 从选中列表移除该楼层所有房间
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
      .map(id => allRooms.value.find(room => room.id === id)?.number)
      .filter(Boolean)
      .join("、");
  };

  const applyBatchConfig = () => {
    if (selectedRooms.value.length === 0) {
      ElMessage.warning("请先选择房间");
      return;
    }

    selectedRooms.value.forEach(roomId => {
      const room = allRooms.value.find(r => r.id === roomId);
      if (room) {
        if (batchConfig.roomTypeId !== "") {
          room.roomTypeId = batchConfig.roomTypeId || undefined;
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
    batchConfig.roomTypeId = "";
    batchConfig.price = "";
    batchConfig.direction = "";
    batchConfig.area = "";
  };

  // 右键菜单相关方法
  const handleRoomRightClick = (event: MouseEvent, room: Room) => {
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

  const editRoom = (room: Room | null) => {
    if (!room) return;

    isEditingRoom.value = true;
    newRoomForm.id = room.id;
    newRoomForm.number = room.number;
    newRoomForm.floor = room.floor;
    showAddRoomDialog.value = true;
    hideContextMenu();
  };

  const deleteRoom = async (room: Room | null) => {
    if (!room) return;

    try {
      await ElMessageBox.confirm(`确定要删除房间 ${room.number} 吗？`, "警告", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      });

      const index = allRooms.value.findIndex(r => r.id === room.id);
      if (index > -1) {
        allRooms.value.splice(index, 1);
        // 如果该房间被选中，从选中列表中移除
        const selectedIndex = selectedRooms.value.indexOf(room.id);
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
    if (!newRoomForm.number) {
      ElMessage.warning("请输入房间号");
      return;
    }

    if (isEditingRoom.value) {
      // 编辑房间
      // 检查房间号是否已存在（排除当前房间）
      const exists = allRooms.value.some(room => room.number === newRoomForm.number && room.id !== newRoomForm.id);
      if (exists) {
        ElMessage.warning("房间号已存在");
        return;
      }

      const room = allRooms.value.find(r => r.id === newRoomForm.id);
      if (room) {
        room.number = newRoomForm.number;
        ElMessage.success("房间修改成功");
      }
    } else {
      // 新增房间
      // 检查房间号是否已存在
      const exists = allRooms.value.some(room => room.number === newRoomForm.number);
      if (exists) {
        ElMessage.warning("房间号已存在");
        return;
      }

      const newRoom: Room = {
        id: Date.now().toString(),
        number: newRoomForm.number,
        floor: newRoomForm.floor
      };

      allRooms.value.push(newRoom);
      ElMessage.success("房间添加成功");
    }

    showAddRoomDialog.value = false;
  };

  const resetRoomForm = () => {
    isEditingRoom.value = false;
    newRoomForm.id = "";
    newRoomForm.number = "";
    newRoomForm.floor = 1;
  };

  const editRoomType = (roomType: HouseLayoutProps) => {
    isEditing.value = true;
    roomTypeForm.id = roomType.id;
    roomTypeForm.name = roomType.layoutName;
    roomTypeForm.bedroom = roomType.bedroom;
    roomTypeForm.livingRoom = roomType.livingRoom;
    roomTypeForm.kitchen = roomType.kitchen;
    roomTypeForm.bathroom = roomType.bathroom;
    showCreateDialog.value = true;
  };

  const deleteRoomType = async (id: string) => {
    const assignedRooms = allRooms.value.filter(room => room.roomTypeId === id);
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

      const index = roomTypes.value.findIndex(rt => rt.id === id);
      if (index > -1) {
        roomTypes.value.splice(index, 1);
        if (selectedRoomTypeId.value === id) {
          selectedRoomTypeId.value = "";
        }
        ElMessage.success("房型删除成功");
      }
    } catch {
      // 用户取消删除
    }
  };

  const saveRoomType = async () => {
    if (!formRef.value) return;

    try {
      await formRef.value.validate();

      if (isEditing.value) {
        const index = roomTypes.value.findIndex(rt => rt.id === roomTypeForm.id);
        if (index > -1) {
          roomTypes.value[index] = {
            ...roomTypes.value[index],
            layoutName: roomTypeForm.name,
            bedroom: roomTypeForm.bedroom,
            livingRoom: roomTypeForm.livingRoom,
            kitchen: roomTypeForm.kitchen,
            bathroom: roomTypeForm.bathroom
          };
          ElMessage.success("房型更新成功");
        }
      } else {
        const newRoomType: HouseLayoutProps = {
          id: Date.now().toString(),
          layoutName: roomTypeForm.name,
          bedroom: roomTypeForm.bedroom,
          livingRoom: roomTypeForm.livingRoom,
          kitchen: roomTypeForm.kitchen,
          bathroom: roomTypeForm.bathroom
        };
        roomTypes.value.push(newRoomType);
        ElMessage.success("房型创建成功");
      }

      showCreateDialog.value = false;
    } catch (error) {
      // 验证失败
    }
  };

  const resetForm = () => {
    isEditing.value = false;
    roomTypeForm.id = "";
    roomTypeForm.name = "";
    roomTypeForm.bedroom = 1;
    roomTypeForm.livingRoom = 1;
    roomTypeForm.kitchen = 1;
    roomTypeForm.bathroom = 1;
    formRef.value?.clearValidate();
  };
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
    background-color: rgba(59, 130, 246, 0.1);
  }
</style>
