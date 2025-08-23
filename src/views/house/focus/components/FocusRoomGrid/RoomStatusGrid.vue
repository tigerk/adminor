<template>
  <div class="room-status-grid">
    <!-- 房间网格容器 -->
    <div v-loading="loading" class="room-grid-container full-height">
      <!-- 项目分组 -->
      <div v-for="house in groupedRooms" :key="house.houseId" class="house-group">
        <div class="house-header">
          <h3 class="house-title">{{ house.houseName }}</h3>
          <div class="house-stats">
            <el-tag type="info">共 {{ house.totalRooms }} 间</el-tag>
            <el-tag type="success" class="ml-2">出租率 {{ house.leasedRate }}%</el-tag>
          </div>
        </div>

        <!-- 楼层分组 -->
        <div v-for="floor in house.floors" :key="`${house.houseId}-${floor.floorNumber}`" class="floor-group">
          <div class="floor-header">
            <h4 class="floor-title">{{ floor.floorNumber }}F</h4>
            <div class="floor-stats">
              <el-tag size="small">{{ floor.rooms.length }} 间</el-tag>
              <el-tag type="success" size="small" class="ml-2">出租率 {{ floor.leasedRate }}%</el-tag>
            </div>
          </div>

          <!-- 房间网格 -->
          <div class="room-grid">
            <div v-for="room in floor.rooms" :key="room.roomId" class="room-card" :class="getRoomCardClass(room)" @click="handleRoomClick(room)">
              <!-- 房间号和房型 -->
              <div class="room-header">
                <div class="room-number">{{ room.roomNumber }}</div>
                <div class="room-type">{{ room.houseLayout?.layoutName || "未分配" }}</div>
              </div>

              <!-- 房间信息 - 一行显示 -->
              <div class="room-info-line">
                <span v-if="room.price" class="room-price">¥{{ room.price }}/月</span>
                <span v-if="room.area" class="room-area">{{ room.area }}㎡</span>
                <span v-if="room.direction" class="room-direction">{{ room.direction }}</span>
              </div>

              <!-- 房间状态标签 -->
              <div class="room-status-tag">
                <el-tag :type="getStatusTagType(room.roomStatus)" size="small" effect="light">
                  {{ room.roomStatusName }}
                </el-tag>
              </div>

              <!-- 锁定状态 -->
              <div v-if="room.locked" class="room-locked">
                <el-icon>
                  <Lock />
                </el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty v-if="!loading && roomList.length === 0" description="暂无房间数据" />
    </div>

    <!-- 房间详情弹窗 -->
    <el-drawer v-model="drawerVisible" title="房间详情" size="400px" direction="rtl">
      <div v-if="selectedRoom" class="room-detail">
        <div class="detail-item">
          <label>项目名称：</label>
          <span>{{ selectedRoom.houseName }}</span>
        </div>
        <div class="detail-item">
          <label>房间号：</label>
          <span>{{ selectedRoom.roomNumber }}</span>
        </div>
        <div class="detail-item">
          <label>房型：</label>
          <span>{{ formatHouseLayout(selectedRoom.houseLayout) }}</span>
        </div>
        <div class="detail-item">
          <label>面积：</label>
          <span>{{ selectedRoom.area }}㎡</span>
        </div>
        <div class="detail-item">
          <label>租金：</label>
          <span>¥{{ selectedRoom.price }}/月</span>
        </div>
        <div class="detail-item">
          <label>朝向：</label>
          <span>{{ selectedRoom.direction || "未设置" }}</span>
        </div>
        <div class="detail-item">
          <label>状态：</label>
          <el-tag :type="getStatusTagType(selectedRoom.roomStatus)">
            {{ selectedRoom.roomStatusName }}
          </el-tag>
        </div>
        <div class="detail-item">
          <label>负责人：</label>
          <span>{{ selectedRoom.salesmanName }} - {{ selectedRoom.salesmanPhone }}</span>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted, nextTick, watch } from "vue";
  import { Lock } from "@element-plus/icons-vue";
  import { getRoomList } from "@/api/house/room";
  import type { HouseLayoutProps } from "@/views/house/focus/components/utils/types";
  import { ElMessage } from "element-plus";

  // 接口类型定义
  interface HouseLayoutDTO {
    layoutName?: string;
    bedroom?: number;
    livingRoom?: number;
    kitchen?: number;
    bathroom?: number;
  }

  interface RoomItemDTO {
    roomId: number;
    houseCode: string;
    houseName: string;
    houseLayout?: HouseLayoutDTO;
    roomNumber: string;
    floor: number;
    price: number;
    area: number;
    direction?: string;
    roomStatus: number;
    roomStatusName: string;
    roomStatusColor: string;
    locked: boolean;
    leased: boolean;
    salesmanId?: string;
    salesmanName?: string;
    salesmanPhone?: string;
  }

  interface FloorGroupList {
    floorNumber: number;
    leasedRate: number;
    rooms: RoomItemDTO[];
  }

  interface HouseGroupList {
    houseId: number;
    houseName: string;
    totalRooms: number;
    leasedRate: number;
    floors: FloorGroupList[];
  }

  // 响应式数据
  const loading = ref(false);
  const roomList = ref<RoomItemDTO[]>([]);
  const drawerVisible = ref(false);
  const selectedRoom = ref<RoomItemDTO | null>(null);

  // 获取 FocusCreateForm 中的form数据，vue3.3+
  const queryForm = defineModel<any>({});

  // 计算属性 - 按项目和楼层分组
  const groupedRooms = computed<HouseGroupList[]>(() => {
    const houseMap = new Map<string, HouseGroupList>();

    roomList.value.forEach(room => {
      const houseKey = `${room.houseCode}-${room.houseName}`;

      if (!houseMap.has(houseKey)) {
        houseMap.set(houseKey, {
          houseId: room.roomId, // 使用roomId作为临时houseId，实际应该从接口获取
          houseName: room.houseName,
          totalRooms: 0,
          leasedRate: 0,
          floors: []
        });
      }

      const house = houseMap.get(houseKey)!;
      house.totalRooms++;

      let floor = house.floors.find(f => f.floorNumber === room.floor);
      if (!floor) {
        floor = {
          floorNumber: room.floor,
          leasedRate: 0,
          rooms: []
        };
        house.floors.push(floor);
      }

      floor.rooms.push(room);
    });

    // 计算出租率
    const result = Array.from(houseMap.values());
    result.forEach(house => {
      let houseLeasedCount = 0;

      house.floors.forEach(floor => {
        const floorLeasedCount = floor.rooms.filter(room => room.leased || room.roomStatus === 1).length;
        floor.leasedRate = floor.rooms.length > 0 ? Math.round((floorLeasedCount / floor.rooms.length) * 100) : 0;
        houseLeasedCount += floorLeasedCount;
      });

      house.leasedRate = house.totalRooms > 0 ? Math.round((houseLeasedCount / house.totalRooms) * 100) : 0;

      // 楼层排序
      house.floors.sort((a, b) => b.floorNumber - a.floorNumber);
      // 房间排序
      house.floors.forEach(floor => {
        floor.rooms.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
      });
    });

    return result.sort((a, b) => a.houseName.localeCompare(b.houseName));
  });

  // 方法
  const loadRooms = async () => {
    if (loading.value) return;

    loading.value = true;

    try {
      const { data } = await getRoomList({
        ...queryForm.value,
        pageSize: 10000,
        currentPage: 1
      });

      if (data) {
        roomList.value = (data.list as RoomItemDTO[]) || (data as RoomItemDTO[]) || [];
      }
    } catch (error) {
      console.error("加载房间数据失败:", error);
      ElMessage.error("加载数据失败");
    } finally {
      loading.value = false;
    }
  };

  const handleSearch = () => {
    loadRooms();
  };

  const handleRoomClick = (room: RoomItemDTO) => {
    selectedRoom.value = room;
    drawerVisible.value = true;
  };

  const getRoomCardClass = (room: RoomItemDTO) => {
    const classes = ["room-item"];

    switch (room.roomStatus) {
      case 0:
        classes.push("status-vacant");
        break;
      case 1:
        classes.push("status-occupied");
        break;
      case 2:
        classes.push("status-locked");
        break;
      case 3:
        classes.push("status-configuring");
        break;
      case 4:
        classes.push("status-offline");
        break;
    }

    if (room.locked) {
      classes.push("room-disabled");
    }

    return classes;
  };

  const getStatusTagType = (roomStatus: number) => {
    const typeMap = {
      0: "success", // 空置
      1: "danger", // 已租
      2: "warning", // 锁房
      3: "info", // 配置中
      4: "" // 下架
    };
    return typeMap[roomStatus] || "";
  };

  const formatHouseLayout = (layout?: HouseLayoutDTO): string => {
    if (!layout) return "未设置";
    if (layout.layoutName) return layout.layoutName;

    const { bedroom, livingRoom, kitchen, bathroom } = layout;
    return `${bedroom || 0}室${livingRoom || 0}厅${kitchen || 0}厨${bathroom || 0}卫`;
  };

  const loadHouseOptions = async () => {
    // 不再需要加载房源选项，查询条件从父组件传入
  };

  // 监听查询条件变化
  watch(
    () => queryForm.value,
    (newVal, oldVal) => {
      if (newVal && JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
        loadRooms();
      }
    },
    { deep: true }
  );

  // 生命周期
  onMounted(async () => {
    await loadRooms();
  });

  // 暴露方法
  defineExpose({
    refresh: handleSearch
  });
</script>

<style lang="scss" scoped>


  // 响应式设计
  @media (width <= 768px) {
    .room-grid {
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 6px;
      padding: 10px 12px;
    }

    .room-card {
      min-height: 80px;
      padding: 6px;
    }

    .house-header,
    .floor-header {
      padding: 10px 16px;
    }
  }

  @media (width <= 480px) {
    .room-grid {
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    }

    .filter-bar {
      flex-direction: column;
      gap: 8px;
      align-items: stretch;

      .el-select {
        width: 100% !important;
      }
    }
  }

  .room-status-grid {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .room-grid-container {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    background: #f5f7fa;

    &.full-height {
      height: 100%;
    }
  }

  .house-group {
    margin-bottom: 24px;
    overflow: hidden;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
  }

  .house-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
  }

  .house-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  .house-stats {
    display: flex;
    align-items: center;
  }

  .floor-group {
    &:not(:last-child) {
      border-bottom: 1px solid #e9ecef;
    }
  }

  .floor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    background: #fafafa;
  }

  .floor-title {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    color: #606266;
  }

  .floor-stats {
    display: flex;
    align-items: center;
  }

  .room-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 8px;
    padding: 12px 16px;
  }

  .room-card {
    position: relative;
    min-height: 85px;
    padding: 8px;
    cursor: pointer;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-left-width: 4px;
    border-radius: 6px;
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 2px 8px rgb(0 0 0 / 12%);
      transform: translateY(-1px);
    }

    &.status-vacant {
      border-left-color: #67c23a;

      &:hover {
        background: #f0f9ff;
      }
    }

    &.status-occupied {
      border-left-color: #f56c6c;

      &:hover {
        background: #fef0f0;
      }
    }

    &.status-locked {
      border-left-color: #e6a23c;

      &:hover {
        background: #fdf6ec;
      }
    }

    &.status-configuring {
      border-left-color: #409eff;

      &:hover {
        background: #ecf5ff;
      }
    }

    &.status-offline {
      border-left-color: #909399;

      &:hover {
        background: #f4f4f5;
      }
    }

    &.room-disabled {
      opacity: 0.6;
      filter: grayscale(30%);
    }
  }

  .room-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .room-number {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }

  .room-info-line {
    display: flex;
    gap: 6px;
    align-items: center;
    margin-bottom: 4px;
    font-size: 10px;
    color: #909399;

    .room-price {
      font-weight: 500;
      color: #f56c6c;
    }

    .room-area,
    .room-direction {
      &::before {
        margin-right: 2px;
        color: #dcdfe6;
        content: "·";
      }
    }
  }

  .room-type {
    max-width: 60px;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 10px;
    color: #909399;
    white-space: nowrap;
  }

  .room-status-tag {
    position: absolute;
    bottom: 6px;
    left: 6px;

    .el-tag {
      height: 18px;
      padding: 0 4px;
      font-size: 10px;
      line-height: 18px;
    }
  }

  .room-locked {
    position: absolute;
    right: 6px;
    bottom: 6px;
    font-size: 12px;
    color: #f56c6c;
  }

  .room-detail {
    padding: 16px 0;
  }

  .detail-item {
    display: flex;
    align-items: center;
    padding: 8px 0;
    margin-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    label {
      flex-shrink: 0;
      width: 80px;
      font-weight: 500;
      color: #606266;
    }

    span {
      flex: 1;
      color: #303133;
    }
  }
</style>
