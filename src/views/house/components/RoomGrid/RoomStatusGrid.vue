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
              <strong class="occupancy-rate">{{ community.occupancyRate }}%</strong>
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
              <!-- roomId 为 string | undefined，使用 ?? '' 防止 toString() 报错 -->
              <div v-for="room in floor.rooms" :key="room.roomId ?? room.roomNumber ?? ''" class="room-card" :class="getRoomCardClass(room)" :style="getRoomCardStyle(room)">
                <!-- 房间状态标签（右上角） -->
                <div class="room-status-label" :style="{ color: room.occupancyStatusColor }">
                  {{ room.occupancyStatusName }}
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
                  <div v-if="room.occupancyStatus === 1 || room.occupancyStatus === 2">
                    {{ formatDateRange(room.leaseInfo?.leaseStartDate, room.leaseInfo?.leaseEndDate) }}
                  </div>
                  <!-- room.price 为 number | undefined，用 !room.price 即可判断 0 / undefined / null -->
                  <div v-else-if="room.occupancyStatus === 0 && room.availableDate">
                    <span class="lease-label">可租日：</span>
                    {{ formatDate(room.availableDate) }}
                    <span class="lease-days">空 {{ getDaysDifference(room.vacancyStartTime) }} 天</span>
                  </div>
                  <div v-else-if="!room.price">
                    <span class="lease-label">暂未定价</span>
                  </div>
                  <div v-else>
                    <span class="lease-label">&nbsp;</span>
                  </div>
                </div>

                <!-- 底部操作按钮 -->
                <div class="room-action-bar">
                  <!-- 左侧按钮组 -->
                  <div class="action-left">
                    <el-button size="small" plain :disabled="room.occupancyStatus !== 0" @click.stop="handleQuickAction(room, 'booking')">预约</el-button>
                    <el-button size="small" plain :disabled="room.occupancyStatus !== 0" @click.stop="handleQuickAction(room, 'tenant')">签约</el-button>
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
                          <el-dropdown-item command="close" :disabled="room.closed">
                            <el-icon><CloseBold /></el-icon>
                            关闭
                          </el-dropdown-item>
                          <el-dropdown-item command="open" :disabled="!room.closed">
                            <el-icon><Open /></el-icon>
                            开启
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty v-if="!loading && processedRoomGroups.length === 0" description="暂无房间数据" />
    </div>

    <!-- 加载更多触发器 -->
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
  import { CloseBold, EditPen, Loading, Location, Lock, OfficeBuilding, Open, Setting, Unlock, User } from "@element-plus/icons-vue";
  import { useRoomGrid } from "@/views/house/components/RoomGrid/hook";
  import type { QueryFormItemProps } from "@/views/house/focus/focusRoom/utils/types";
  import { getDaysDifference } from "@/utils/date";

  // 获取父组件的查询表单数据
  const queryForm = defineModel<QueryFormItemProps>("modelValue", { default: () => ({}) });

  const scrollContainer = ref<HTMLElement>();
  const loadMoreTrigger = ref<HTMLElement>();

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
  // ==================== 主题相关变量 ====================
  .room-status-grid {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--el-bg-color);
  }

  .room-grid-container {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    background: var(--el-fill-color-lighter);
    transition: background-color 0.3s;

    &.full-height {
      height: 100%;
    }
  }

  // ==================== 小区分组样式 ====================
  .property-group {
    margin-bottom: 24px;
    overflow: hidden;
    background: var(--el-bg-color);
    border-radius: 8px;
    box-shadow: var(--el-box-shadow-light);
    transition: all 0.3s;
  }

  // 小区头部
  .property-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background-color: var(--el-fill-color-blank);
    border-bottom: 1px solid var(--el-border-color-lighter);
    transition: all 0.3s;

    .property-header-left {
      display: flex;
      gap: 8px;
      align-items: center;

      .el-icon {
        color: var(--el-color-primary);
      }

      .property-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        transition: color 0.3s;
      }

      .property-address {
        font-size: 14px;
        color: var(--el-text-color-regular);
        transition: color 0.3s;
      }
    }

    .property-stats {
      display: flex;
      gap: 24px;
      align-items: center;

      .stat-item {
        font-size: 14px;
        color: var(--el-text-color-regular);
        transition: color 0.3s;

        strong {
          font-size: 16px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          transition: color 0.3s;

          &.occupancy-rate {
            color: var(--el-color-success);
          }
        }
      }
    }
  }

  // ==================== 楼栋单元样式 ====================
  .building-unit-group {
    &:not(:last-child) {
      border-bottom: 3px solid var(--el-border-color-light);
    }
  }

  .building-unit-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    background: var(--el-fill-color-light);
    border-bottom: 2px solid var(--el-border-color-lighter);
    transition: all 0.3s;

    .building-unit-info {
      display: flex;
      gap: 10px;
      align-items: center;

      .el-icon {
        font-size: 20px;
        color: var(--el-color-primary);
      }

      .building-unit-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        transition: color 0.3s;
      }

      .building-unit-stats {
        font-size: 14px;
        font-weight: normal;
        color: var(--el-text-color-regular);
        transition: color 0.3s;
      }
    }
  }

  // ==================== 楼层样式 ====================
  .floor-group {
    &:not(:last-child) {
      border-bottom: 1px solid var(--el-border-color-lighter);
    }
  }

  .floor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px;
    background: var(--el-fill-color-lighter);
    border-bottom: 1px solid var(--el-border-color-lighter);
    transition: all 0.3s;

    .floor-info {
      display: flex;
      gap: 8px;
      align-items: baseline;
      padding-left: 5px;

      .floor-title {
        margin: 0;
        font-size: 14px;
        font-weight: 500;
        color: var(--el-text-color-regular);
        transition: color 0.3s;
      }

      .floor-count {
        font-size: 13px;
        color: var(--el-text-color-secondary);
        transition: color 0.3s;
      }
    }
  }

  // ==================== 房间网格 ====================
  .room-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
    padding: 20px;
    background-color: var(--el-fill-color-blank);
    transition: background-color 0.3s;
  }

  // ==================== 房间卡片 ====================
  .room-card {
    position: relative;
    min-height: 140px;
    padding: 12px;
    background: var(--el-bg-color);
    border: 2px solid var(--el-border-color-lighter);
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: var(--el-box-shadow);
      transform: translateY(-2px);
      border-color: var(--el-border-color);
    }

    &.room-disabled {
      opacity: 0.6;
      filter: grayscale(30%);
    }
  }

  .dark .room-card {
    background: var(--el-fill-color-dark);
    border-color: var(--el-border-color-darker);

    &:hover {
      background: var(--el-fill-color);
      border-color: var(--el-border-color-dark);
    }
  }

  // 房间状态标签
  .room-status-label {
    position: absolute;
    top: 12px;
    right: 12px;
    font-size: 13px;
    font-weight: 500;
  }

  // 房间头部信息
  .room-header-info {
    display: flex;
    align-items: baseline;
    margin-bottom: 8px;
    font-weight: 600;

    .room-number,
    .room-type {
      font-size: 16px;
      color: var(--el-text-color-primary);
      transition: color 0.3s;
    }

    .room-separator {
      margin: 0 6px;
      color: var(--el-text-color-placeholder);
      transition: color 0.3s;
    }
  }

  // 房间基础信息
  .room-basic-info {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    font-size: 13px;
    color: var(--el-text-color-regular);
    transition: color 0.3s;

    .info-separator {
      margin: 0 4px;
      color: var(--el-border-color);
      transition: color 0.3s;
    }

    .info-tag {
      margin-left: 6px;
      color: var(--el-color-primary);
    }
  }

  // 价格信息
  .room-price-info {
    display: flex;
    align-items: baseline;
    margin-bottom: 8px;

    .price-amount {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      transition: color 0.3s;
    }

    .price-unit {
      margin-left: 2px;
      font-size: 12px;
      color: var(--el-text-color-regular);
      transition: color 0.3s;
    }

    .price-extra {
      margin-left: 4px;
      font-size: 11px;
      color: var(--el-text-color-secondary);
      transition: color 0.3s;
    }
  }

  // 租期信息
  .room-lease-info {
    padding: 8px 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    border-top: 1px dashed var(--el-border-color-lighter);
    transition: all 0.3s;

    .lease-label {
      color: var(--el-text-color-regular);
      transition: color 0.3s;
    }

    .lease-days {
      margin-left: 8px;
      color: var(--el-color-danger);
    }
  }

  // ==================== 操作按钮栏 ====================
  .room-action-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding-top: 8px;
    border-top: 1px solid var(--el-border-color-lighter);
    transition: border-color 0.3s;

    .action-left,
    .action-right {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .action-left {
      flex: 1;
      min-width: 0;
    }

    :deep(.el-button) {
      margin: 0;
      padding: 4px 10px;
      font-size: 12px;

      &.is-small {
        height: 26px;
      }

      & + .el-button {
        margin-left: 0;
      }
    }

    :deep(.el-dropdown) {
      .el-button {
        padding: 4px 8px;
      }
    }
  }

  // ==================== 加载状态 ====================
  .loading-wrapper,
  .loading-more,
  .no-more {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
    background-color: var(--el-fill-color-blank);
    transition: all 0.3s;

    .el-icon {
      margin-right: 8px;
    }
  }

  // ==================== 响应式设计 ====================
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

    .room-action-bar {
      :deep(.el-button) {
        padding: 3px 8px;
        font-size: 11px;
      }
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

  @media (width <= 480px) {
    .room-grid {
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    }
  }
</style>
