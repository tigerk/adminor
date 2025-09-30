<template>
  <div class="room-status-grid">
    <!-- 房间网格容器 -->
    <div v-loading="loading" class="room-grid-container full-height">
      <!-- 按小区分组 -->
      <div v-for="property in groupedRooms" :key="property.propertyId" class="property-group">
        <!-- 小区头部 -->
        <div class="property-header">
          <div class="property-header-left">
            <el-icon><Location /></el-icon>
            <h3 class="property-title">{{ property.propertyName }}</h3>
            <span class="property-address">（{{ property.address }}）</span>
          </div>
          <div class="property-stats">
            <span class="stat-item">
              共
              <strong>{{ property.totalRooms }}</strong>
              套，
              <strong>{{ property.floors.length }}</strong>
              层， 出租率
              <strong class="rate-value">{{ property.leasedRate }}%</strong>
            </span>
            <el-button link type="primary" size="small" @click="handleManageProperty(property)">
              <el-icon><Setting /></el-icon>
              <span>管理项目</span>
            </el-button>
          </div>
        </div>

        <!-- 楼层分组 -->
        <div v-for="floor in property.floors" :key="`${property.propertyId}-${floor.floorNumber}`" class="floor-group">
          <div class="floor-header">
            <div class="floor-info">
              <h4 class="floor-title">{{ floor.floorNumber }} 层</h4>
              <span class="floor-count">（共 {{ floor.rooms.length }} 间，出租率 {{ floor.leasedRate }}%）</span>
            </div>
            <div class="floor-actions">
              <template v-if="getFloorPages(floor.rooms.length) > 1">
                <span
                  v-for="pageNum in getFloorPages(floor.rooms.length)"
                  :key="pageNum"
                  :class="['page-indicator', { active: floor.currentPage === pageNum }]"
                  @click="handleFloorPageChange(property.propertyId, floor.floorNumber, pageNum)"
                >
                  {{ pageNum }}页
                </span>
              </template>
            </div>
          </div>

          <!-- 房间网格 -->
          <div class="room-grid">
            <div v-for="room in getPagedRooms(floor.rooms, floor.currentPage)" :key="room.roomId" class="room-card" :class="getRoomCardClass(room)">
              <!-- 房间状态标签（右上角） -->
              <div class="room-status-label" :class="`status-${room.roomStatus}`">
                {{ room.roomStatusName }}
                <span v-if="room.roomStatus === 0" class="status-sub">有欠款</span>
              </div>

              <!-- 房间头部信息 -->
              <div class="room-header-info">
                <span class="room-number">{{ room.roomNumber }}</span>
                <span class="room-separator">-</span>
                <span class="room-type">{{ getRoomTypeLabel(room) }}</span>
              </div>

              <!-- 房间基础信息 -->
              <div class="room-basic-info">
                <span class="info-direction">{{ room.direction || "南" }}</span>
                <span class="info-separator">-</span>
                <span class="info-area">{{ room.area }}㎡</span>
                <span v-if="room.balcony" class="info-tag">｜{{ room.salesmanName || "限男" }}</span>
              </div>

              <!-- 价格信息 -->
              <div class="room-price-info">
                <span class="price-amount">{{ room.price }}</span>
                <span class="price-unit">元/月</span>
                <span class="price-extra">（测试/押1付3）</span>
                <el-icon class="price-search"><Search /></el-icon>
              </div>

              <!-- 租期信息 -->
              <div class="room-lease-info">
                <div v-if="room.roomStatus === 1 && room.leaseInfo">
                  {{ formatDateRange(room.leaseInfo?.leaseStartDate, room.leaseInfo?.leaseEndDate) }}
                  <span class="lease-status">（欠款{{ room.leaseInfo?.daysUntilAvailable || 5 }}天）</span>
                </div>
                <div v-else-if="room.leaseInfo?.availableDate">
                  <span class="lease-label">可租日：</span>
                  {{ formatDate(room.leaseInfo?.availableDate || "2025.09.17") }}
                  <span class="lease-days">空 {{ room.leaseInfo?.daysUntilAvailable || 8 }} 天</span>
                </div>
                <div v-else>
                  <span class="lease-label">暂未定价</span>
                </div>
              </div>

              <!-- 底部操作按钮 -->
              <div class="room-action-bar">
                <el-tooltip content="锁房" placement="top">
                  <el-icon class="action-icon" :class="{ disabled: room.locked }" @click.stop="handleQuickAction(room, room.locked ? 'unlock' : 'lock')">
                    <Lock />
                  </el-icon>
                </el-tooltip>
                <el-tooltip content="查看" placement="top">
                  <el-icon class="action-icon" @click.stop="handleQuickAction(room, 'view')">
                    <View />
                  </el-icon>
                </el-tooltip>
                <el-tooltip content="编辑" placement="top">
                  <el-icon class="action-icon" @click.stop="handleQuickAction(room, 'edit')">
                    <EditPen />
                  </el-icon>
                </el-tooltip>
                <el-tooltip v-if="room.salesmanName" :content="`${room.salesmanName}`" placement="top">
                  <el-icon class="action-icon">
                    <User />
                  </el-icon>
                </el-tooltip>

                <div v-if="room.roomStatus === 1" class="action-status">
                  <span class="status-text">欠</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty v-if="!loading && roomList.length === 0" description="暂无房间数据" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch } from "vue";
  import { Location, Setting, Calendar, DocumentAdd, Refresh, More, Edit, EditPen, View, Search, Lock, Unlock, User } from "@element-plus/icons-vue";
  import { ElMessage } from "element-plus";
  import type { Ref, ComputedRef } from "vue";
  import { getRoomList } from "@/api/house/room";

  // ==================== 类型定义 ====================

  interface HouseLayoutDTO {
    layoutName?: string;
    bedroom?: number;
    livingRoom?: number;
    kitchen?: number;
    bathroom?: number;
  }

  interface LeaseInfoDTO {
    leaseStartDate?: string;
    leaseEndDate?: string;
    availableDate?: string;
    daysUntilAvailable?: number;
    tenantName?: string;
    tenantPhone?: string;
  }

  interface RoomItemDTO {
    roomId: number;
    houseId: number;
    propertyId: number;
    propertyName?: string;
    houseCode: string;
    houseName: string;
    modeRefId?: number;
    leaseMode?: number;
    houseLayout?: HouseLayoutDTO;
    deptId?: number;
    deptName?: string;
    roomNumber: string;
    floor: number;
    price: number;
    area: number;
    direction?: string;
    roomStatus: number;
    roomStatusName: string;
    roomStatusColor: string;
    locked: boolean;
    closed?: boolean;
    leased: boolean;
    salesmanId?: string;
    salesmanName?: string;
    salesmanPhone?: string;
    leaseInfo?: LeaseInfoDTO;
    balcony?: boolean;
    roomLabel?: string;
  }

  interface FloorGroup {
    floorNumber: number;
    leasedRate: number;
    rooms: RoomItemDTO[];
    currentPage: number;
  }

  interface PropertyGroup {
    propertyId: number;
    propertyName: string;
    address: string;
    totalRooms: number;
    leasedRate: number;
    floors: FloorGroup[];
    hasMultipleHouses: boolean;
  }

  interface QueryForm {
    propertyId?: number;
    houseId?: number;
    roomStatus?: number;
    [key: string]: any;
  }

  // ==================== 响应式数据 ====================

  const loading: Ref<boolean> = ref(false);
  const roomList: Ref<RoomItemDTO[]> = ref([]);

  // 获取父组件的查询表单数据
  const queryForm = defineModel<QueryForm>("queryForm", { default: () => ({}) });

  // ==================== 计算属性 ====================

  const groupedRooms: ComputedRef<PropertyGroup[]> = computed(() => {
    const propertyMap = new Map<string, PropertyGroup>();

    // 按小区分组
    roomList.value.forEach(room => {
      const propertyKey = room.propertyName || "未知小区";

      if (!propertyMap.has(propertyKey)) {
        propertyMap.set(propertyKey, {
          propertyId: room.propertyId,
          propertyName: propertyKey,
          address: "上海市-黄浦区-人民广场", // 模拟地址，后续从接口获取
          totalRooms: 0,
          leasedRate: 0,
          floors: [],
          hasMultipleHouses: false
        });
      }

      const property = propertyMap.get(propertyKey)!;
      property.totalRooms++;
    });

    // 对每个小区进行楼层分组
    propertyMap.forEach((property, propertyKey) => {
      const floorMap = new Map<number, FloorGroup>();
      const houseSet = new Set<string>();

      // 获取该小区下的所有房间
      const propertyRooms = roomList.value.filter(room => (room.propertyName || "未知小区") === propertyKey);

      // 按楼层分组
      propertyRooms.forEach(room => {
        houseSet.add(room.houseName);

        if (!floorMap.has(room.floor)) {
          floorMap.set(room.floor, {
            floorNumber: room.floor,
            leasedRate: 0,
            rooms: [],
            currentPage: 1
          });
        }

        floorMap.get(room.floor)!.rooms.push(room);
      });

      // 判断是否有多个房源
      property.hasMultipleHouses = houseSet.size > 1;

      // 将楼层Map转换为数组并排序（正序，从低到高）
      property.floors = Array.from(floorMap.values()).sort((a, b) => a.floorNumber - b.floorNumber);

      // 计算每层的出租率并对房间排序
      let propertyLeasedCount = 0;
      property.floors.forEach(floor => {
        // 房间按房间号排序
        floor.rooms.sort((a, b) => {
          // 尝试提取数字进行排序
          const numA = parseInt(a.roomNumber.replace(/[^\d]/g, "")) || 0;
          const numB = parseInt(b.roomNumber.replace(/[^\d]/g, "")) || 0;
          if (numA !== numB) {
            return numA - numB;
          }
          // 如果数字相同，按字符串排序
          return a.roomNumber.localeCompare(b.roomNumber);
        });

        // 计算出租率
        const floorLeasedCount = floor.rooms.filter(r => r.leased || r.roomStatus === 1).length;
        floor.leasedRate = floor.rooms.length > 0 ? Math.round((floorLeasedCount / floor.rooms.length) * 100) : 0;
        propertyLeasedCount += floorLeasedCount;
      });

      // 计算整个小区的出租率
      property.leasedRate = property.totalRooms > 0 ? Math.round((propertyLeasedCount / property.totalRooms) * 100) : 0;
    });

    // 按小区名称排序
    return Array.from(propertyMap.values()).sort((a, b) => a.propertyName.localeCompare(b.propertyName));
  });

  // ==================== 方法定义 ====================

  const loadRooms = async (): Promise<void> => {
    if (loading.value) return;

    loading.value = true;

    try {
      const { data } = await getRoomList({
        ...queryForm.value,
        pageSize: 10000,
        currentPage: 1
      });

      if (data?.list) {
        roomList.value = data.list as RoomItemDTO[];

        // 临时模拟租期信息和其他数据（后端添加后删除）
        roomList.value = roomList.value.map(room => ({
          ...room,
          leaseInfo:
            room.roomStatus === 1
              ? {
                  leaseStartDate: "2025-09-20",
                  leaseEndDate: "2026-09-19",
                  availableDate: "2026-09-20",
                  daysUntilAvailable: Math.floor(Math.random() * 30) + 1,
                  tenantName: "张三",
                  tenantPhone: "13800138000"
                }
              : room.roomStatus === 0
                ? {
                    availableDate: "2025-09-20",
                    daysUntilAvailable: Math.floor(Math.random() * 30) + 1
                  }
                : undefined,
          balcony: Math.random() > 0.7
        }));
      }
    } catch (error) {
      console.error("加载房间数据失败:", error);
      ElMessage.error("加载数据失败");
    } finally {
      loading.value = false;
    }
  };

  const handleQuickAction = (room: RoomItemDTO, action: string): void => {
    switch (action) {
      case "contract":
        ElMessage.success(`准备为房间 ${room.roomNumber} 签约`);
        // router.push(`/contract/create?roomId=${room.roomId}`)
        break;
      case "renew":
        ElMessage.success(`准备为房间 ${room.roomNumber} 续约`);
        // router.push(`/contract/renew?roomId=${room.roomId}`)
        break;
      case "lock":
        ElMessage.warning(`确认锁定房间 ${room.roomNumber}？`);
        // 调用锁房接口
        break;
      case "unlock":
        ElMessage.success(`房间 ${room.roomNumber} 已解锁`);
        // 调用解锁接口
        break;
      case "edit":
        ElMessage.info(`编辑房间 ${room.roomNumber} 信息`);
        // router.push(`/room/edit/${room.roomId}`)
        break;
      case "view":
        ElMessage.info(`查看房间 ${room.roomNumber} 详情`);
        // router.push(`/room/detail/${room.roomId}`)
        break;
    }
  };

  const handleManageProperty = (property: PropertyGroup): void => {
    ElMessage.info(`管理小区：${property.propertyName}`);
    // router.push(`/property/manage/${property.propertyId}`)
  };

  const getRoomCardClass = (room: RoomItemDTO): string[] => {
    const classes: string[] = [];

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

    if (room.closed) {
      classes.push("room-disabled");
    }

    return classes;
  };

  const getRoomTypeLabel = (room: RoomItemDTO): string => {
    const layout = room.houseLayout;
    if (!layout) return "未分配";

    if (layout.layoutName) return layout.layoutName;

    const bedroom = layout.bedroom || 0;
    const labels: Record<number, string> = {
      0: "单间",
      1: "一室",
      2: "两室",
      3: "三室",
      4: "四室"
    };

    return labels[bedroom] || `${bedroom}室`;
  };

  const getStatusTagType = (roomStatus: number): string => {
    const typeMap: Record<number, string> = {
      0: "success", // 空置 - 绿色
      1: "danger", // 已租 - 红色
      2: "warning", // 锁房 - 橙色
      3: "info", // 配置中 - 蓝色
      4: "info" // 下架 - 灰色
    };
    return typeMap[roomStatus] || "info";
  };

  const formatHouseLayout = (layout?: HouseLayoutDTO): string => {
    if (!layout) return "未设置";
    if (layout.layoutName) return layout.layoutName;

    const { bedroom = 0, livingRoom = 0, kitchen = 0, bathroom = 0 } = layout;
    return `${bedroom}室${livingRoom}厅${kitchen}厨${bathroom}卫`;
  };

  const formatPrice = (price: number): string => {
    if (!price) return "0";
    return price.toLocaleString();
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return "--";
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  };

  const formatDateRange = (startDate?: string, endDate?: string): string => {
    if (!startDate || !endDate) return "未知";
    return `${formatDate(startDate)}~${formatDate(endDate)}`;
  };

  const getFloorPages = (roomCount: number): number => {
    const pageSize = 10;
    return Math.ceil(roomCount / pageSize);
  };

  const getPagedRooms = (rooms: RoomItemDTO[], currentPage: number): RoomItemDTO[] => {
    const pageSize = 10;
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return rooms.slice(start, end);
  };

  const handleFloorPageChange = (propertyId: number, floorNumber: number, pageNum: number): void => {
    const property = groupedRooms.value.find(p => p.propertyId === propertyId);
    if (property) {
      const floor = property.floors.find(f => f.floorNumber === floorNumber);
      if (floor) {
        floor.currentPage = pageNum;
      }
    }
  };

  const handleSearch = (): void => {
    loadRooms();
  };

  // ==================== 生命周期 ====================

  watch(
    () => queryForm.value,
    newVal => {
      if (newVal) {
        loadRooms();
      }
    },
    { deep: true }
  );

  onMounted(async () => {
    await loadRooms();
  });

  // ==================== 暴露方法 ====================

  defineExpose({
    refresh: handleSearch
  });
</script>

<style lang="scss" scoped>


  // 响应式设计
  @media (width <= 1400px) {
    .room-grid {
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    }
  }

  @media (width <= 1200px) {
    .room-grid {
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 12px;
    }
  }

  @media (width <= 768px) {
    .property-header {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;

      .property-stats {
        justify-content: space-between;
        width: 100%;
      }
    }

    .room-grid {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 10px;
      padding: 12px;
    }

    .room-card {
      min-height: 140px;
      padding: 10px;
    }
  }

  @media (width <= 480px) {
    .room-grid {
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
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

  .property-group {
    margin-bottom: 24px;
    overflow: hidden;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgb(0 0 0 / 5%);
  }

  .property-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    color: #fff;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

    .property-header-left {
      display: flex;
      gap: 8px;
      align-items: center;

      .property-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }

      .property-address {
        font-size: 14px;
        opacity: 0.9;
      }
    }

    .property-stats {
      display: flex;
      gap: 24px;
      align-items: center;

      .stat-item {
        font-size: 14px;

        strong {
          font-size: 16px;
          font-weight: 600;
        }

        .rate-value {
          color: #10f310;
        }
      }

      .el-button {
        color: #fff;

        &:hover {
          background: rgb(255 255 255 / 10%);
        }
      }
    }
  }

  .floor-group {
    &:not(:last-child) {
      border-bottom: 2px solid #f0f0f0;
    }
  }

  .floor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    background: #fafbfc;
    border-bottom: 1px solid #ebeef5;

    .floor-info {
      display: flex;
      gap: 8px;
      align-items: baseline;

      .floor-title {
        margin: 0;
        font-size: 15px;
        font-weight: 500;
        color: #303133;
      }

      .floor-count {
        font-size: 13px;
        color: #909399;
      }
    }

    .floor-actions {
      display: flex;
      gap: 8px;

      .page-indicator {
        padding: 3px 10px;
        font-size: 12px;
        color: #909399;
        cursor: pointer;
        background: #f4f4f5;
        border-radius: 4px;
        transition: all 0.3s;

        &.active,
        &:hover {
          color: #409eff;
          background: #ecf5ff;
        }
      }
    }
  }

  .room-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
    padding: 20px;
  }

  .room-card {
    position: relative;
    min-height: 140px;
    padding: 12px;
    background: #fff;
    border: 2px solid transparent;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
      transform: translateY(-2px);
    }

    // 房间状态样式
    &.status-vacant {
      background: linear-gradient(135deg, #f6ffed 0%, #fff 100%);
      border-color: #67c23a;

      .room-status-label {
        color: #67c23a;
      }
    }

    &.status-occupied {
      background: linear-gradient(135deg, #fff4f4 0%, #fff 100%);
      border-color: #f56c6c;

      .room-status-label {
        color: #f56c6c;
      }
    }

    &.status-locked {
      background: linear-gradient(135deg, #fffaf0 0%, #fff 100%);
      border-color: #e6a23c;

      .room-status-label {
        color: #e6a23c;
      }
    }

    &.status-configuring {
      background: linear-gradient(135deg, #f0f9ff 0%, #fff 100%);
      border-color: #409eff;

      .room-status-label {
        color: #409eff;
      }
    }

    &.status-offline {
      background: linear-gradient(135deg, #f5f7fa 0%, #fff 100%);
      border-color: #909399;

      .room-status-label {
        color: #909399;
      }
    }

    &.room-disabled {
      opacity: 0.6;
      filter: grayscale(30%);
    }
  }

  .room-status-label {
    position: absolute;
    top: 12px;
    right: 12px;
    font-size: 13px;
    font-weight: 500;

    .status-sub {
      margin-left: 4px;
      font-size: 11px;
      opacity: 0.8;
    }
  }

  .room-header-info {
    display: flex;
    align-items: baseline;
    margin-bottom: 8px;
    font-weight: 600;

    .room-number {
      font-size: 16px;
      color: #303133;
    }

    .room-separator {
      margin: 0 6px;
      color: #909399;
    }

    .room-type {
      font-size: 16px;
      color: #303133;
    }
  }

  .room-basic-info {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    font-size: 13px;
    color: #606266;

    .info-separator {
      margin: 0 4px;
      color: #dcdfe6;
    }

    .info-tag {
      margin-left: 6px;
      color: #409eff;
    }
  }

  .room-price-info {
    display: flex;
    align-items: baseline;
    margin-bottom: 8px;

    .price-amount {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }

    .price-unit {
      margin-left: 2px;
      font-size: 12px;
      color: #606266;
    }

    .price-extra {
      margin-left: 4px;
      font-size: 11px;
      color: #909399;
    }

    .price-search {
      margin-left: auto;
      font-size: 16px;
      color: #409eff;
      cursor: pointer;
    }
  }

  .room-lease-info {
    padding: 6px 0;
    margin-bottom: 6px;
    font-size: 12px;
    color: #909399;
    border-top: 1px dashed #ebeef5;

    .lease-label {
      color: #606266;
    }

    .lease-days {
      margin-left: 8px;
      color: #f56c6c;
    }

    .lease-status {
      margin-left: 4px;
      color: #e6a23c;
    }
  }

  .room-action-bar {
    display: flex;
    gap: 12px;
    align-items: center;
    padding-top: 6px;
    border-top: 1px solid #ebeef5;

    .action-icon {
      font-size: 16px;
      color: #909399;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        color: #409eff;
        transform: scale(1.1);
      }

      &.disabled {
        color: #c0c4cc;
        cursor: not-allowed;
      }
    }

    .action-status {
      margin-left: auto;

      .status-text {
        display: inline-block;
        width: 20px;
        height: 20px;
        font-size: 12px;
        font-weight: 500;
        line-height: 20px;
        color: #fff;
        text-align: center;
        background: #f56c6c;
        border-radius: 4px;
      }
    }
  }
</style>
