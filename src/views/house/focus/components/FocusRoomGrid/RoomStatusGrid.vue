<template>
  <div class="room-status-grid">
    <!-- 房间网格容器 -->
    <div v-loading="loading" class="room-grid-container full-height">
      <!-- 按小区分组 -->
      <div v-for="community in processedRoomGroups" :key="community.communityId" class="property-group">
        <!-- 小区头部 -->
        <div class="property-header">
          <div class="property-header-left">
            <el-icon>
              <Location />
            </el-icon>
            <h3 class="property-title">{{ community.communityName }}</h3>
            <span class="property-address">（{{ community.address }}）</span>
          </div>
          <div class="property-stats">
            <span class="stat-item">
              共
              <strong>{{ community.totalRooms }}</strong>
              套， 出租率
              <strong class="rate-value">{{ community.occupancyRate }}%</strong>
            </span>
            <el-button link type="primary" size="small" @click="handleManageCommunity(community)">
              <el-icon>
                <Setting />
              </el-icon>
              <span>管理项目</span>
            </el-button>
          </div>
        </div>

        <!-- 按楼栋单元分组 -->
        <div v-for="buildingUnit in community.buildingUnits" :key="`${community.communityId}-${buildingUnit.building}-${buildingUnit.unit}`" class="building-unit-group">
          <!-- 楼栋单元头部 -->
          <div class="building-unit-header">
            <div class="building-unit-info">
              <el-icon>
                <OfficeBuilding />
              </el-icon>
              <h4 class="building-unit-title">{{ buildingUnit.buildingUnitName }}</h4>
              <span class="building-unit-stats">（共 {{ buildingUnit.floorCount }} 层，{{ buildingUnit.totalRooms }} 间，出租率 {{ buildingUnit.occupancyRate }}%）</span>
            </div>
          </div>

          <!-- 楼层分组 -->
          <div v-for="floor in buildingUnit.floors" :key="`${community.communityId}-${buildingUnit.building}-${buildingUnit.unit}-${floor.floor}`" class="floor-group">
            <div class="floor-header">
              <div class="floor-info">
                <h5 class="floor-title">{{ floor.floorName }}</h5>
                <span class="floor-count">（共 {{ floor.roomCount }} 间，出租率 {{ floor.occupancyRate }}%）</span>
              </div>
            </div>

            <!-- 房间网格 -->
            <div class="room-grid">
              <div v-for="room in floor.rooms" :key="room.roomId" class="room-card" :class="getRoomCardClass(room)" :style="getRoomCardStyle(room)">
                <!-- 房间状态标签（右上角） -->
                <div class="room-status-label" :style="{ color: room.roomStatusColor }">
                  {{ room.roomStatusName }}
                  <span v-if="room.roomStatus === 1 && room.leaseInfo?.daysUntilAvailable" class="status-sub">有欠款</span>
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
                  <span v-if="room.salesmanName" class="info-tag">｜{{ room.salesmanName }}</span>
                </div>

                <!-- 价格信息 -->
                <div class="room-price-info">
                  <span class="price-amount">{{ formatPrice(room.price) }}</span>
                  <span class="price-unit">元/月</span>
                  <span class="price-extra">（押1付3）</span>
                  <el-icon class="price-search">
                    <Search />
                  </el-icon>
                </div>

                <!-- 租期信息 -->
                <div class="room-lease-info">
                  <div v-if="room.roomStatus === 1 && room.leaseInfo">
                    {{ formatDateRange(room.leaseInfo?.leaseStartDate, room.leaseInfo?.leaseEndDate) }}
                    <span v-if="room.leaseInfo?.daysUntilAvailable" class="lease-status">（欠款{{ room.leaseInfo?.daysUntilAvailable }}天）</span>
                  </div>
                  <div v-else-if="room.roomStatus === 0 && room.leaseInfo?.availableDate">
                    <span class="lease-label">可租日：</span>
                    {{ formatDate(room.leaseInfo?.availableDate) }}
                    <span class="lease-days">空 {{ room.leaseInfo?.daysUntilAvailable || 0 }} 天</span>
                  </div>
                  <div v-else-if="!room.price || room.price === '0'">
                    <span class="lease-label">暂未定价</span>
                  </div>
                  <div v-else>
                    <span class="lease-label">立即可租</span>
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
                  <el-tooltip v-if="room.salesmanName" :content="`负责人：${room.salesmanName}`" placement="top">
                    <el-icon class="action-icon">
                      <User />
                    </el-icon>
                  </el-tooltip>

                  <div v-if="room.roomStatus === 1 && room.leaseInfo?.daysUntilAvailable" class="action-status">
                    <span class="status-text">欠</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty v-if="!loading && processedRoomGroups.length === 0" description="暂无房间数据" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, watch } from "vue";
  import { Location, Setting, EditPen, View, Search, Lock, User, OfficeBuilding } from "@element-plus/icons-vue";
  import { useRoomGrid } from "@/views/house/focus/components/FocusRoomGrid/hook";
  import type { QueryFormItemProps } from "@/views/house/focus/focusRoom/utils/types";

  // 获取父组件的查询表单数据
  const queryForm = defineModel<QueryFormItemProps>("modelValue", { default: () => ({}) });

  // ==================== 使用 Hook ====================
  const {
    loading,
    processedRoomGroups,
    loadRoomGrid,
    handleQuickAction,
    handleManageCommunity,
    getRoomCardClass,
    getRoomTypeLabel,
    formatDate,
    formatDateRange,
    formatPrice,
    getRoomCardStyle
  } = useRoomGrid(queryForm);

  // ==================== 生命周期 ====================
  watch(
    () => queryForm.value,
    newVal => {
      if (newVal) {
        loadRoomGrid();
      }
    },
    { deep: true }
  );

  onMounted(async () => {
    await loadRoomGrid();
  });

  // ==================== 暴露方法 ====================
  defineExpose({
    refresh: loadRoomGrid
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
    .property-header,
    .building-unit-header {
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
    //color: #fff;
    //background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

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
        //color: #fff;

        &:hover {
          background: rgb(255 255 255 / 10%);
        }
      }
    }
  }

  // 楼栋单元分组样式
  .building-unit-group {
    &:not(:last-child) {
      border-bottom: 3px solid #e4e7ed;
    }
  }

  // 楼栋单元头部
  .building-unit-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: linear-gradient(135deg, #f0f2f5 0%, #fafbfc 100%);
    border-bottom: 2px solid #ebeef5;

    .building-unit-info {
      display: flex;
      gap: 10px;
      align-items: center;

      .el-icon {
        font-size: 20px;
        color: #409eff;
      }

      .building-unit-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }

      .building-unit-stats {
        font-size: 14px;
        font-weight: normal;
        color: #606266;
      }
    }
  }

  .floor-group {
    &:not(:last-child) {
      border-bottom: 1px solid #f0f0f0;
    }
  }

  .floor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    background: #fafbfc;
    border-bottom: 1px solid #ebeef5;

    .floor-info {
      display: flex;
      gap: 8px;
      align-items: baseline;
      padding-left: 30px; // 缩进以显示层级

      .floor-title {
        margin: 0;
        font-size: 14px;
        font-weight: 500;
        color: #606266;
      }

      .floor-count {
        font-size: 13px;
        color: #909399;
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
