<script setup lang="ts">
  import { ref, reactive, computed, watch } from "vue";
  import { FormProps, FocusFormItemProps, RoomStatusProps } from "@/views/house/focus/components/utils/types";
  import RegionCascader from "@/components/Business/RegionCascader.vue";
  import DeptCascader from "@/components/Business/DeptUserCascader.vue";
  import { getDeptUserList } from "@/api/sys/dept";
  import { useFocusEdit } from "@/views/house/focus/components/utils/hook";
  import { InfoFilled } from "@element-plus/icons-vue";
  import AntDesignLockFilled from "~icons/ant-design/lock-filled";
  import { focusBasicInfoRules } from "@/views/house/focus/components/utils/rule";
  import { ElMessage } from "element-plus";

  // 获取 FocusCreateForm 中的form数据，vue3.3+
  const form = defineModel<FocusFormItemProps>();

  // 定义 emits
  const emit = defineEmits<{
    "to-assign-room": [];
  }>();

  // 确保房间号长度有默认值
  if (form.value.roomNumberLength === undefined || form.value.roomNumberLength === null) {
    form.value.roomNumberLength = 3;
  }

  // 确保房间号前缀有默认值
  if (form.value.roomPrefix === undefined || form.value.roomPrefix === null) {
    form.value.roomPrefix = "A";
  }

  const currentRoomCount = ref(null);
  const currentRoomList = ref([]);

  // 负责人列表
  const salesmanList = ref([]);
  const ruleFormRef = ref();

  function getRef() {
    return ruleFormRef.value;
  }

  defineExpose({ getRef });

  // 计算楼层列表
  const computedFloorList = computed(() => {
    if (!form.value.floorTotal) {
      return [];
    }
    return Array.from({ length: form.value.floorTotal }, (_, i) => i + 1);
  });

  // 初始化所有楼层房间状态
  const initAllFloors = () => {
    if (!form.value.floorTotal || !form.value.roomCountPerFloor) {
      return;
    }

    // 清空现有数据
    if (form.value.roomsStatusOfFloors) {
      form.value.roomsStatusOfFloors.clear();
    } else {
      form.value.roomsStatusOfFloors = new Map<number, Map<string, RoomStatusProps>>();
    }

    // 初始化每个楼层的房间数据
    for (let floor = 1; floor <= form.value.floorTotal; floor++) {
      const roomStatusMap = new Map<string, RoomStatusProps>();

      for (let room = 1; room <= form.value.roomCountPerFloor; room++) {
        const roomNum = room.toString();
        roomStatusMap.set(roomNum, {
          cursor: `${floor}-${room}`,
          roomIndex: room,
          roomNumber: roomNum,
          locked: false,
          floor: floor,
          houseLayoutId: null,
          price: 0,
          direction: "",
          area: 0
        });
      }

      form.value.roomsStatusOfFloors.set(floor, roomStatusMap);
    }

    // 自动选中第一个楼层并显示房间列表
    if (form.value.floorTotal > 0) {
      form.value.selectedFloor = 1;
      updateCurrentRoomDisplay(1);
    }
  };

  // 更新当前显示的房间列表
  const updateCurrentRoomDisplay = (floor: number) => {
    if (form.value.roomsStatusOfFloors && form.value.roomsStatusOfFloors.has(floor)) {
      currentRoomList.value = Array.from(form.value.roomsStatusOfFloors.get(floor).values());
      currentRoomCount.value = form.value.roomsStatusOfFloors.get(floor).size;
    } else {
      currentRoomList.value = [];
      currentRoomCount.value = 0;
    }
  };

  // 初始化特定楼层房间列表
  const initRoomListOfFloor = (floor: number, roomCount: number) => {
    const roomStatusMap = new Map<string, RoomStatusProps>();

    for (let i = 1; i <= roomCount; i++) {
      const roomNum = i.toString();

      roomStatusMap.set(roomNum, {
        cursor: `${floor}-${i}`,
        roomIndex: i,
        roomNumber: roomNum,
        locked: false,
        floor: floor,
        houseLayoutId: null,
        price: 0,
        direction: "",
        area: 0
      });
    }

    form.value.roomsStatusOfFloors.set(floor, roomStatusMap);
    return Array.from(roomStatusMap.values());
  };

  function handleCurrentRoomCountChange(value) {
    updateRoomCountForFloor(form.value.selectedFloor, value);
    updateCurrentRoomDisplay(form.value.selectedFloor);
  }

  // 更新特定楼层房间数量
  const updateRoomCountForFloor = (floor: number, newRoomCount: number) => {
    if (!form.value.roomsStatusOfFloors.has(floor)) {
      initRoomListOfFloor(floor, newRoomCount);
      return;
    }

    const currentFloor = form.value.roomsStatusOfFloors.get(floor);
    const currentSize = currentFloor.size;

    if (newRoomCount > currentSize) {
      // 增加房间
      for (let i = currentSize + 1; i <= newRoomCount; i++) {
        const roomNum = i.toString();

        currentFloor.set(roomNum, {
          cursor: `${floor}-${i}`,
          roomIndex: i,
          roomNumber: roomNum,
          locked: false,
          floor: floor,
          houseLayoutId: null,
          price: 0,
          direction: "",
          area: 0
        });
      }
    } else if (newRoomCount < currentSize) {
      // 减少房间 - 截断
      const newMap = new Map<string, RoomStatusProps>();
      let count = 0;

      for (const [key, value] of currentFloor) {
        if (count >= newRoomCount) break;
        newMap.set(key, value);
        count++;
      }

      form.value.roomsStatusOfFloors.set(floor, newMap);
    }
  };

  // 楼层选择处理
  const handleFloorSelect = (floor: number) => {
    form.value.selectedFloor = floor;
    updateCurrentRoomDisplay(floor);

    // 如果选中的楼层没有房间数据，使用默认房间数量初始化
    if (!form.value.roomsStatusOfFloors.has(floor) && form.value.roomCountPerFloor) {
      initRoomListOfFloor(floor, form.value.roomCountPerFloor);
      updateCurrentRoomDisplay(floor);
    }
  };

  const getCurrentFloorRooms = computed(() => {
    let rooms = currentRoomList.value;

    // 如果选中的楼层没有数据，返回空数组
    if (!rooms || rooms.length === 0) return [];

    // 如果启用了“去4”选项，则过滤掉房间号末位是4的房间
    if (form.value.excludeFour) {
      rooms = rooms.filter(item => !item.roomNumber.endsWith("4"));
    }

    return rooms;
  });

  // 监听多个值，统一处理
  watch([() => form.value.floorTotal, () => form.value.roomCountPerFloor], ([newFloorTotal, newRoomCount], [oldFloorTotal, oldRoomCount]) => {
    // 只有当楼层总数或每层房间数量有效时才初始化
    if (newFloorTotal && newRoomCount) {
      initAllFloors();
    }
  });

  // 在组件挂载时，如果已有数据则初始化显示
  watch(
    () => form.value.selectedFloor,
    newFloor => {
      if (newFloor && form.value.roomsStatusOfFloors && form.value.roomsStatusOfFloors.has(newFloor)) {
        updateCurrentRoomDisplay(newFloor);
      }
    },
    { immediate: true }
  );

  const formatRoomNumber = (num: number) => {
    return useFocusEdit().formatRoomNumber(form.value.roomPrefix, form.value.roomNumberLength, form.value.selectedFloor, String(num));
  };

  function handleDeptSelected(deptId: number) {
    form.value.deptId = deptId;

    getDeptUserList({
      deptId: deptId
    }).then(resp => {
      salesmanList.value = Array.isArray(resp.data) ? resp.data : [];
      const salesmanExists = salesmanList.value.some(salesman => salesman.id === form.value.salesmanId);
      if (!salesmanExists) {
        form.value.salesmanId = null;
      }
    });
  }

  function handleCloseFloor() {
    // 确保 closedFloors 是数组
    if (!Array.isArray(form.value.closedFloors)) {
      form.value.closedFloors = [];
    }

    const index = form.value.closedFloors.indexOf(form.value.selectedFloor);
    if (index > -1) {
      // 如果已关闭，则开启
      form.value.closedFloors.splice(index, 1);
    } else {
      // 如果未关闭，则关闭
      form.value.closedFloors.push(form.value.selectedFloor);
    }
  }

  // 保存项目信息
  async function clickSaveBasicInfo() {
    try {
      // 验证表单
      await ruleFormRef.value.validate();

      // 检查负责人信息
      if (!form.value.deptId || !form.value.salesmanId) {
        ElMessage.warning("请选择归属部门和负责人");
        return;
      }

      // 验证通过，触发保存事件
      emit("to-assign-room");
    } catch (error) {
      ElMessage.warning("请完善必填项信息");
    }
  }

  // 处理房间点击事件
  const handleRoomClick = (roomStatus: RoomStatusProps) => {
    // 确保 closedRooms 是数组
    if (!Array.isArray(form.value.closedRooms)) {
      form.value.closedRooms = [];
    }

    roomStatus.locked = !roomStatus.locked;
    if (roomStatus.locked) {
      form.value.closedRooms.push(roomStatus);
    } else {
      const index = form.value.closedRooms.findIndex(item => item.floor === form.value.selectedFloor && item.roomNumber === roomStatus.roomNumber);
      if (index > -1) {
        form.value.closedRooms.splice(index, 1);
      }
    }
  };
</script>

<template>
  <!-- 保持原有模板不变 -->
  <div>
    <el-form ref="ruleFormRef" :model="form" label-position="top" :rules="focusBasicInfoRules">
      <div>
        <h3 class="pb-4">项目信息</h3>
        <el-row :gutter="20" class="bor">
          <el-col :span="6">
            <div class="grid-content ep-bg-purple">
              <el-form-item label="项目编号" class="el-form-item" prop="houseCode">
                <el-input v-model="form.houseCode" placeholder="" />
              </el-form-item>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="grid-content ep-bg-purple">
              <el-form-item label="项目名称" class="el-form-item" prop="houseName" required>
                <el-input v-model="form.houseName" placeholder="" />
              </el-form-item>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="grid-content ep-bg-purple">
              <el-form-item label="选择区域" class="el-form-item">
                <RegionCascader v-model="form.region" />
              </el-form-item>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="grid-content ep-bg-purple">
              <el-form-item label="项目地址" class="el-form-item" prop="address" required>
                <el-input v-model="form.address" placeholder="" />
              </el-form-item>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="3">
            <div class="grid-content ep-bg-purple">
              <el-form-item label="楼栋信息" class="el-form-item" prop="building" required>
                <el-space>
                  <el-input v-model="form.building" placeholder="">
                    <template #append>号/栋/座</template>
                  </el-input>
                </el-space>
              </el-form-item>
            </div>
          </el-col>
          <el-col :span="3">
            <div class="grid-content ep-bg-purple">
              <el-form-item label="&nbsp;" class="el-form-item" prop="unit">
                <el-input v-model="form.unit" placeholder="">
                  <template #append>单元</template>
                </el-input>
              </el-form-item>
            </div>
          </el-col>
          <el-col :span="3">
            <div class="grid-content ep-bg-purple">
              <el-form-item label="楼层" class="el-form-item" prop="floorTotal" required>
                <el-input v-model="form.floorTotal" placeholder="">
                  <template #prepend>共</template>
                  <template #append>层</template>
                </el-input>
              </el-form-item>
            </div>
          </el-col>
          <el-col :span="3">
            <div class="grid-content ep-bg-purple">
              <el-form-item label="每层房间数量" class="el-form-item" prop="roomCountPerFloor" required>
                <el-input v-model="form.roomCountPerFloor" placeholder="">
                  <template #prepend>每层</template>
                  <template #append>间</template>
                </el-input>
              </el-form-item>
            </div>
          </el-col>
          <el-col :span="3">
            <div class="grid-content ep-bg-purple">
              <el-form-item label="房间号前缀" class="el-form-item">
                <el-input v-model="form.roomPrefix" placeholder="设置房间号前缀" />
              </el-form-item>
            </div>
          </el-col>
          <el-col :span="3">
            <div class="grid-content ep-bg-purple">
              <el-form-item label="房间号长度" class="el-form-item">
                <el-input v-model="form.roomNumberLength" placeholder="设置房间号长度" type="number" />
              </el-form-item>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="grid-content ep-bg-purple text-center">
              <el-form-item label="&nbsp;" class="el-form-item">
                <el-checkbox v-model="form.excludeFour" label="房间号去4" border />
              </el-form-item>
            </div>
          </el-col>
        </el-row>

        <!-- 添加楼层设置提示 -->
        <el-row :gutter="20">
          <el-col :span="24">
            <el-alert
              title="楼层设置说明"
              type="info"
              description="修改楼层总数或每层房间数后，系统将自动重新初始化所有楼层房间信息。您可以在下方选择楼层和调整房间数量。"
              show-icon
              :closable="false"
              style="margin-bottom: 20px"
            />
          </el-col>
        </el-row>

        <h3 class="pb-4">房间信息</h3>
        <el-row v-if="computedFloorList.length > 0" :gutter="20">
          <el-col :span="24">
            <el-card>
              <template #header>
                <el-radio-group v-model="form.selectedFloor">
                  <el-radio-button v-for="(floor, index) in computedFloorList" :key="index" :value="floor" @click="handleFloorSelect(floor)">
                    <span
                      :class="{
                        'floor-label': true,
                        'closed-floor': form.closedFloors && form.closedFloors.includes(floor)
                      }"
                    >
                      {{ floor }}F
                    </span>
                  </el-radio-button>
                </el-radio-group>
              </template>
              <el-row>
                <el-col :span="20">
                  <el-space>
                    第 {{ form.selectedFloor }} 层，共
                    <el-input
                      v-model="currentRoomCount"
                      size="small"
                      type="number"
                      :style="{ width: '55px', textAlign: 'center' }"
                      :min="1"
                      @input="handleCurrentRoomCountChange"
                    />
                    间
                  </el-space>
                </el-col>
                <el-col :span="4" class="text-right">
                  <el-button type="danger" plain @click="handleCloseFloor">
                    {{ form.closedFloors && form.closedFloors.includes(form.selectedFloor) ? "开启楼层" : "关闭楼层" }}
                  </el-button>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="24">
                  <div class="room-title-container">
                    <span class="room-title">房间号</span>
                    <el-tooltip content="点击房间号将房间锁定，再次点击解锁房间" placement="right" effect="light">
                      <el-icon class="info-icon">
                        <InfoFilled />
                      </el-icon>
                    </el-tooltip>
                  </div>
                </el-col>
              </el-row>
              <el-row class="pt-4">
                <el-col :span="24">
                  <el-space wrap :size="15">
                    <el-check-tag
                      v-for="(roomStatus, index) in getCurrentFloorRooms"
                      :key="index"
                      :class="['select-none', roomStatus.locked && 'closed-room']"
                      :checked="!roomStatus.locked"
                      @click="handleRoomClick(roomStatus)"
                    >
                      <el-space :size="4">
                        <IconifyIconOffline v-if="roomStatus.locked" :icon="AntDesignLockFilled" />
                        <span>{{ formatRoomNumber(roomStatus.roomNumber) }}</span>
                      </el-space>
                    </el-check-tag>
                  </el-space>
                </el-col>
              </el-row>
            </el-card>
          </el-col>
        </el-row>

        <h3 class="py-4">负责人信息</h3>
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="grid-content ep-bg-purple">
              <el-form-item label="归属部门" class="el-form-item" prop="deptId" required>
                <DeptCascader v-model="form.deptId" :emit-on-default="true" @dept-selected="handleDeptSelected" />
              </el-form-item>
            </div>
          </el-col>
          <el-col :span="6">
            <el-form-item label="负责人" class="el-form-item" prop="salesmanId" required>
              <el-select v-model="form.salesmanId" filterable placeholder="请选择负责人" style="width: 240px">
                <el-option v-for="item in salesmanList" :key="item.value" :label="item.username" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </el-form>

    <el-row :gutter="20">
      <el-col :span="24" class="text-right">
        <el-button type="primary" style="margin-top: 12px" @click="clickSaveBasicInfo">保存并配置房间</el-button>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
  /* 保持原有样式不变 */
  :deep(.el-form-item--label-top .el-form-item__label) {
    font-size: 12px;
    color: #43464c;
  }

  :deep(.el-input-group__append),
  :deep(.el-input-group__prepend) {
    padding: 0 10px;
    color: #43464c;
  }

  :deep(.el-radio-button__inner) {
    padding: 8px;
    color: #43464c;
  }

  /* 楼层标签基础样式 */
  .floor-label {
    display: inline-block;
    width: 100%;
    height: 100%;
  }

  /* 已关闭楼层的样式 */
  .closed-floor {
    color: #c0c4cc !important;
    text-decoration: line-through;
    opacity: 0.6;
  }

  /* 已关闭房间的样式 */
  .closed-room {
    color: #c0c4cc !important;
    text-decoration: line-through;
    opacity: 0.6;
  }

  .room-title-container {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .room-title {
    font-weight: bold;
    color: #606266;
  }

  .info-icon {
    font-size: 14px;
    color: #909399;
    cursor: pointer;
  }
</style>
