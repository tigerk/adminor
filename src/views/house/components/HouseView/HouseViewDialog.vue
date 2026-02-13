<script setup lang="ts">
  import { computed, ref, watch } from "vue";
  import type { HouseViewDetailProps, RoomListProps } from "@/types";
  import { DECORATION_TYPE_OPTIONS, DIRECTION_OPTIONS, RENTAL_TYPE_OPTIONS } from "@/constants";

  const props = defineProps<{
    detail: HouseViewDetailProps;
  }>();

  const getDecorationLabel = (val?: number | string) => {
    if (val === undefined || val === null || val === "") return "-";
    const num = Number(val);
    return DECORATION_TYPE_OPTIONS.find(item => item.value === num)?.label || "-";
  };

  const getDirectionLabel = (val?: string) => {
    if (!val) return "-";
    return DIRECTION_OPTIONS.find(item => item.value === val)?.label || val;
  };

  const getRentalTypeLabel = (val?: number) => {
    if (val == null) return "-";
    return RENTAL_TYPE_OPTIONS.find(item => item.value === val)?.label || "-";
  };

  const baseRoom = props.detail.room;
  const focusDetail = props.detail.focusDetail;
  const scatterDetail = props.detail.scatterDetail;

  const roomTabs = computed<RoomListProps[]>(() => {
    if (scatterDetail?.roomList?.length) {
      return scatterDetail.roomList as RoomListProps[];
    }
    return [baseRoom];
  });
  const activeRoomId = ref<string>("room");

  watch(
    () => roomTabs.value,
    tabs => {
      activeRoomId.value = tabs[0]?.roomId || tabs[0]?.roomNumber || "room";
    },
    { immediate: true }
  );

  const currentRoom = computed(() => {
    return roomTabs.value.find(item => (item.roomId || item.roomNumber) === activeRoomId.value) || baseRoom;
  });
</script>

<template>
  <div class="house-view">
    <el-skeleton v-if="detail.loading" animated :rows="8" />
    <template v-else>
      <div class="header">
        <div class="title">
          <span class="code">{{ currentRoom.doorNumber || currentRoom.houseCode || "-" }}</span>
          <span class="name">{{ currentRoom.communityName || focusDetail?.focusName || scatterDetail?.community?.name || "房源详情" }}</span>
          <span class="room">{{ currentRoom.roomNumber ? `${currentRoom.roomNumber}室` : "" }}</span>
        </div>
        <div class="tags">
          <el-tag size="small" type="info">{{ detail.leaseMode === 1 ? "集中式" : "分散式" }}</el-tag>
          <el-tag v-if="detail.leaseMode !== 1" size="small" type="primary">{{ getRentalTypeLabel(detail.rentalType) }}</el-tag>
          <el-tag v-if="currentRoom.roomStatusName" size="small" :type="currentRoom.roomStatus === 1 ? 'success' : 'warning'">{{ currentRoom.roomStatusName }}</el-tag>
        </div>
      </div>

      <div class="room-tabs" v-if="roomTabs.length > 1">
        <el-tabs v-model="activeRoomId" type="card">
          <el-tab-pane v-for="item in roomTabs" :key="item.roomId || item.roomNumber" :label="item.roomNumber || '房间'" :name="item.roomId || item.roomNumber || 'room'" />
        </el-tabs>
      </div>

      <div class="content">
        <div class="main">
          <div class="section">
            <div class="section-title">房源信息</div>
            <el-descriptions :column="3" size="default" class="desc">
              <el-descriptions-item label="小区名称">{{ currentRoom.communityName || scatterDetail?.community?.name || focusDetail?.community?.name || "-" }}</el-descriptions-item>
              <el-descriptions-item label="地址">{{ scatterDetail?.community?.address || focusDetail?.address || "-" }}</el-descriptions-item>
              <el-descriptions-item label="楼栋/单元">{{ currentRoom.building || "-" }} {{ currentRoom.unit ? `${currentRoom.unit}单元` : "" }}</el-descriptions-item>
              <el-descriptions-item label="门牌号">{{ currentRoom.doorNumber || "-" }}</el-descriptions-item>
              <el-descriptions-item label="楼层">{{ currentRoom.floor || "-" }}/{{ scatterDetail?.floorTotal || "-" }}</el-descriptions-item>
              <el-descriptions-item label="朝向">{{ getDirectionLabel(currentRoom.direction) }}</el-descriptions-item>
              <el-descriptions-item label="面积">{{ currentRoom.area || scatterDetail?.area || "-" }}㎡</el-descriptions-item>
              <el-descriptions-item label="装修">{{ getDecorationLabel(scatterDetail?.decorationType) }}</el-descriptions-item>
              <el-descriptions-item label="物业费">{{ currentRoom.propertyFee ?? scatterDetail?.propertyFee ?? "-" }}元/月</el-descriptions-item>
              <el-descriptions-item label="电梯">{{ scatterDetail?.hasElevator ? "有" : "无" }}</el-descriptions-item>
              <el-descriptions-item label="燃气">{{ scatterDetail?.hasGas ? "有" : "无" }}</el-descriptions-item>
              <el-descriptions-item label="负责人">{{ currentRoom.salesmanName || "-" }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="section">
            <div class="section-title">房间信息</div>
            <el-descriptions :column="3" size="default" class="desc">
              <el-descriptions-item label="房间号">{{ currentRoom.roomNumber || "-" }}</el-descriptions-item>
              <el-descriptions-item label="房型">{{ currentRoom.houseLayout?.layoutName || "-" }}</el-descriptions-item>
              <el-descriptions-item label="出租价格">{{ currentRoom.price || "-" }}元/月</el-descriptions-item>
              <el-descriptions-item label="租客">{{ currentRoom.leaseInfo?.tenantName || "-" }}</el-descriptions-item>
              <el-descriptions-item label="联系电话">{{ currentRoom.leaseInfo?.tenantPhone || "-" }}</el-descriptions-item>
              <el-descriptions-item label="租期">{{ currentRoom.leaseInfo?.leaseStartDate || "-" }} ~ {{ currentRoom.leaseInfo?.leaseEndDate || "-" }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="section" v-if="detail.leaseMode !== 1 && scatterDetail?.roomList?.length">
            <div class="section-title">房间列表</div>
            <el-table :data="scatterDetail.roomList" border stripe class="table">
              <el-table-column type="index" label="序号" width="70" align="center" />
              <el-table-column prop="roomNumber" label="房间号" min-width="120" />
              <el-table-column prop="area" label="面积" min-width="120">
                <template #default="{ row }">{{ row.area || "-" }}㎡</template>
              </el-table-column>
              <el-table-column prop="direction" label="朝向" min-width="120" />
              <el-table-column prop="price" label="价格" min-width="140">
                <template #default="{ row }">{{ row.price || "-" }}元/月</template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <div class="aside">
          <div class="side-card">
            <div class="side-title">快捷入口</div>
            <div class="side-item">智能设备</div>
            <div class="side-item">业主信息</div>
            <div class="side-item">住户信息</div>
            <div class="side-item">预定</div>
            <div class="side-item">房间备注</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
  .house-view {
    padding: 12px;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    .title {
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .code {
        padding: 2px 6px;
        background: var(--el-fill-color-light);
        border-radius: 4px;
        font-size: 12px;
      }

      .room {
        color: var(--el-text-color-regular);
        font-size: 14px;
      }
    }

    .tags {
      display: flex;
      gap: 6px;
      align-items: center;
    }
  }

  .room-tabs {
    margin: 8px 0 12px;
  }

  .section {
    margin-bottom: 20px;

    .section-title {
      margin-bottom: 10px;
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .desc {
    :deep(.el-descriptions__label) {
      color: var(--el-text-color-secondary);
    }
  }

  .content {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 280px;
    gap: 16px;
  }

  .side-card {
    padding: 12px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;

    .side-title {
      margin-bottom: 10px;
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .side-item {
      padding: 8px 10px;
      margin-bottom: 8px;
      font-size: 13px;
      color: var(--el-text-color-regular);
      background: var(--el-fill-color-light);
      border-radius: 6px;
    }
  }

  .table {
    :deep(.el-table__header) {
      th {
        background: var(--el-fill-color-light);
        color: var(--el-text-color-primary);
      }
    }
  }
</style>
