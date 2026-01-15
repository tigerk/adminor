<template>
  <div class="room-status-grid">
    <!-- 房间网格容器 -->
    <div ref="scrollContainer" v-loading="loading" class="room-grid-container full-height">
      <!-- 按小区分组 -->
      <div v-for="community in processedRoomGroups" :key="community.communityId" class="property-group">
        <!-- 小区头部 -->
        <div class="property-header">
          <div class="property-header-left">
            <el-icon>
              <Location />
            </el-icon>
            <h3 class="property-title">{{ community.displayName }}</h3>
            <span class="property-address">{{ community.communityAddress }}</span>
          </div>
          <div class="property-stats">
            <span class="stat-item">
              共
              <strong>{{ community.totalRooms }}</strong>
              套， 出租率
              <strong class="text-green-500">{{ community.occupancyRate }}%</strong>
            </span>
            <el-button v-if="community.leaseMode == 1" link type="primary" @click="handleManageCompound(community)">
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
              <span class="building-unit-stats text-right">
                （共 {{ buildingUnit.floorCount }} 层，{{ buildingUnit.totalRooms }} 间，出租率 {{ buildingUnit.occupancyRate }}%）
              </span>
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
                  <span class="room-number">{{ room.rentalType === 2 ? room.doorNumber : "" }} {{ room.roomNumber }}</span>
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
                  <span class="price-extra">物业费： {{ formatPrice(room.propertyFee) }}元/月</span>
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
                <!-- 底部操作按钮 -->
                <div class="room-action-bar">
                  <!-- 左侧按钮组 -->
                  <div class="action-left">
                    <el-button size="small" plain @click.stop="handleQuickAction(room, 'reserve')">预约</el-button>
                    <el-button size="small" plain @click.stop="handleQuickAction(room, 'contract')">签约</el-button>
                  </div>

                  <!-- 右侧按钮组 -->
                  <div class="action-right">
                    <!-- 操作下拉菜单 -->
                    <el-dropdown trigger="click" @command="command => handleDropdownAction(room, command)">
                      <el-button size="small" plain>操作</el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item v-if="room.leaseMode == 2" command="edit">
                            <el-icon><EditPen /></el-icon>
                            编辑
                          </el-dropdown-item>
                          <el-dropdown-item command="lock" :disabled="room.locked">
                            <el-icon><Lock /></el-icon>
                            锁房
                          </el-dropdown-item>
                          <el-dropdown-item command="unlock" :disabled="!room.locked">
                            <el-icon><Unlock /></el-icon>
                            解锁
                          </el-dropdown-item>
                          <el-dropdown-item v-if="room.salesmanName" command="salesman" divided>
                            <el-icon><User /></el-icon>
                            负责人：{{ room.salesmanName }}
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>

                    <!-- 查看按钮 -->
                    <el-button size="small" plain @click.stop="handleQuickAction(room, 'view')">查看</el-button>
                  </div>

                  <!-- 欠款标识 -->
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

    <!-- 加载更多触发器 - 关键：这个元素用于 IntersectionObserver 观察 -->
    <div v-if="hasMore && !loading" ref="loadMoreTrigger" class="loading-more">
      <el-icon v-if="loadingMore" class="is-loading">
        <Loading />
      </el-icon>
      <span v-if="loadingMore">正在加载更多...</span>
    </div>

    <!-- 没有更多数据提示 -->
    <div v-if="!hasMore && processedRoomGroups.length > 0 && !loading" class="no-more">
      <span>已加载全部数据</span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
  import {
    Location,
    Setting,
    EditPen,
    View,
    Lock,
    User,
    OfficeBuilding,
    Loading,
    Calendar,
    Document,
    Unlock,
    MoreFilled // 新增 MoreFilled
  } from "@element-plus/icons-vue";
  import { useRoomGrid } from "@/views/house/components/RoomGrid/hook";
  import type { QueryFormItemProps } from "@/views/house/focus/focusRoom/utils/types";
  import house from "@/router/bak2/house"; // 获取父组件的查询表单数据

  // 获取父组件的查询表单数据
  const queryForm = defineModel<QueryFormItemProps>("modelValue", { default: () => ({}) });

  const scrollContainer = ref<HTMLElement>();
  const loadMoreTrigger = ref<HTMLElement>(); // 加载更多触发器

  // ==================== 使用 Hook ====================
  const {
    loading,
    loadingMore,
    hasMore,
    processedRoomGroups,
    loadRoomGrid,
    handleQuickAction,
    handleManageCompound,
    getRoomCardClass,
    getRoomTypeLabel,
    formatDate,
    formatDateRange,
    formatPrice,
    getRoomCardStyle,
    setupLoadMore,
    cleanupObserver,
    handleDropdownAction
  } = useRoomGrid(queryForm);

  // 监听查询条件变化
  watch(
    () => queryForm.value,
    newVal => {
      if (newVal) {
        loadRoomGrid();
      }
    },
    { deep: true }
  );

  // ==================== 生命周期 ====================
  // 监听 hasMore 变化，重新设置 observer
  watch([hasMore, () => processedRoomGroups.value.length], () => {
    nextTick(() => {
      setupLoadMore(loadMoreTrigger.value);
    });
  });

  onMounted(() => {
    loadRoomGrid();
    nextTick(() => {
      setupLoadMore(loadMoreTrigger.value);
    });
  });

  onUnmounted(() => {
    cleanupObserver();
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
    padding: 12px;
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
    padding: 12px 20px;
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
    padding: 10px 20px;
    background: #fafbfc;
    border-bottom: 1px solid #ebeef5;

    .floor-info {
      display: flex;
      gap: 8px;
      align-items: baseline;
      padding-left: 5px; // 缩进以显示层级

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
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding-top: 8px;
    margin-top: 8px;
    border-top: 1px solid #ebeef5;

    .action-left,
    .action-right {
      display: flex;
      gap: 6px; // 左右两侧使用相同的间距
      align-items: center;
    }

    .action-left {
      flex: 1;
      min-width: 0; // 允许按钮缩小
    }

    .action-status {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 1;

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

    // 按钮样式优化
    :deep(.el-button) {
      margin: 0; // 关键：移除默认 margin
      padding: 4px 10px;
      font-size: 12px;

      &.is-small {
        height: 26px;
      }

      // 移除连续按钮之间的间距
      & + .el-button {
        margin-left: 0;
      }
    }

    // 只显示图标的按钮
    :deep(.action-dropdown-btn),
    :deep(.action-view-btn) {
      padding: 4px 8px;
      min-width: 32px;

      .el-icon {
        margin: 0;
      }
    }

    :deep(.el-dropdown) {
      .el-button {
        padding: 4px 8px;
      }
    }
  }

  // 针对更小的卡片做响应式调整
  @media (width <= 1200px) {
    .room-action-bar {
      :deep(.el-button) {
        padding: 3px 8px;
        font-size: 11px;
      }
    }
  }

  @media (width <= 768px) {
    .room-action-bar {
      gap: 4px;

      .action-left,
      .action-right {
        gap: 4px;
      }

      :deep(.el-button) {
        padding: 2px 6px;
        font-size: 11px;
      }
    }
  }

  .loading-wrapper,
  .loading-more,
  .no-more {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    font-size: 14px;
    color: #999;

    .el-icon {
      margin-right: 8px;
    }
  }
</style>
