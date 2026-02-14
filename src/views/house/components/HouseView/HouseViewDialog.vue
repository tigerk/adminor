<script setup lang="ts">
  import { computed, ref, watch } from "vue";
  import type { HouseViewDetailProps, RoomListProps } from "@/types";
  import { DECORATION_TYPE_OPTIONS, DIRECTION_OPTIONS, RENTAL_TYPE_OPTIONS, ROOM_STATUS_ENUM } from "@/constants";
  import { Camera, House, Location, Money, User } from "@element-plus/icons-vue";

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

  // 图片相关
  const currentImageIndex = ref(0);
  const showImageViewer = ref(false);

  const allImages = computed(() => {
    const images: string[] = [];

    // 集中式：从 focusDetail 获取
    if (focusDetail?.imageList?.length) {
      images.push(...focusDetail.imageList);
    }

    // 分散式：从 scatterDetail 的 houseLayout 获取
    if (scatterDetail?.houseLayout?.imageList?.length) {
      images.push(...scatterDetail.houseLayout.imageList);
    }

    // 当前房间的图片
    if (currentRoom.value?.imageList?.length) {
      images.push(...currentRoom.value.imageList);
    }

    return images.filter((img, index, self) => img && self.indexOf(img) === index); // 去重
  });

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

  // 房源基本信息
  const houseInfo = computed(() => {
    const info = {
      communityName: currentRoom.value.communityName || focusDetail?.focusName || scatterDetail?.community?.name || "-",
      address: scatterDetail?.community?.address || focusDetail?.address || "-",
      building: currentRoom.value.building || "-",
      unit: currentRoom.value.unit ? `${currentRoom.value.unit}单元` : "",
      doorNumber: currentRoom.value.doorNumber || "-",
      floor: currentRoom.value.floor || "-",
      floorTotal: scatterDetail?.floorTotal || "-",
      direction: getDirectionLabel(currentRoom.value.direction),
      area: currentRoom.value.area || scatterDetail?.area || "-",
      decoration: getDecorationLabel(scatterDetail?.decorationType),
      propertyFee: currentRoom.value.propertyFee ?? scatterDetail?.propertyFee ?? "-",
      hasElevator: scatterDetail?.hasElevator ? "有" : "无",
      hasGas: scatterDetail?.hasGas ? "有" : "无",
      salesmanName: currentRoom.value.salesmanName || "-",
      salesmanPhone: currentRoom.value.salesmanPhone || "-"
    };
    return info;
  });

  // 房间信息
  const roomInfo = computed(() => {
    return {
      roomNumber: currentRoom.value.roomNumber || "-",
      layoutName: currentRoom.value.houseLayout?.layoutName || "-",
      price: currentRoom.value.price || "-",
      status: currentRoom.value.roomStatusName || "-",
      statusColor: currentRoom.value.roomStatusColor || "",
      tenantName: currentRoom.value.leaseInfo?.tenantName || "-",
      tenantPhone: currentRoom.value.leaseInfo?.tenantPhone || "-",
      leaseStartDate: currentRoom.value.leaseInfo?.leaseStartDate || "-",
      leaseEndDate: currentRoom.value.leaseInfo?.leaseEndDate || "-"
    };
  });

  // 设施设备
  const facilities = computed(() => {
    const currentFacilities = currentRoom.value.facilities || [];
    const houseFacilities = scatterDetail?.houseLayout?.facilities || focusDetail?.facilities || [];

    // 合并并去重
    const allFacilities = [...currentFacilities, ...houseFacilities];
    const uniqueFacilities = allFacilities.reduce(
      (acc, curr) => {
        if (!acc.find(item => item.name === curr.name)) {
          acc.push(curr);
        }
        return acc;
      },
      [] as typeof currentFacilities
    );

    return uniqueFacilities;
  });

  // 标签
  const tags = computed(() => {
    const currentTags = currentRoom.value.tags || [];
    const houseTags = scatterDetail?.houseLayout?.tags || focusDetail?.tags || [];
    return [...new Set([...currentTags, ...houseTags])];
  });

  // 处理图片点击
  const handleImageClick = (index: number) => {
    currentImageIndex.value = index;
    showImageViewer.value = true;
  };

  // 关闭图片查看器
  const handleCloseViewer = () => {
    showImageViewer.value = false;
  };

  // 快捷操作
  const emit = defineEmits<{
    booking: [room: RoomListProps];
    tenant: [room: RoomListProps];
    checkout: [room: RoomListProps];
    viewContract: [room: RoomListProps];
  }>();

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "booking":
        emit("booking", currentRoom.value);
        break;
      case "tenant":
        emit("tenant", currentRoom.value);
        break;
      case "checkout":
        emit("checkout", currentRoom.value);
        break;
      case "viewContract":
        emit("viewContract", currentRoom.value);
        break;
    }
  };
</script>

<template>
  <div class="house-view">
    <el-skeleton v-if="detail.loading" animated :rows="8" />
    <template v-else>
      <!-- 顶部信息栏 -->
      <div class="top-bar">
        <div class="left-info">
          <div class="title-row">
            <span class="house-code">{{ currentRoom.doorNumber || currentRoom.houseCode || "-" }}</span>
            <span class="house-name">{{ houseInfo.communityName }}</span>
            <span v-if="currentRoom.roomNumber" class="room-number">{{ currentRoom.roomNumber }}室</span>
          </div>
          <div class="address-row">
            <el-icon><Location /></el-icon>
            <span>{{ houseInfo.address }}</span>
          </div>
        </div>
        <div class="right-tags">
          <el-tag size="small" type="info">{{ detail.leaseMode === 1 ? "集中式" : "分散式" }}</el-tag>
          <el-tag v-if="detail.leaseMode !== 1" size="small" type="primary">{{ getRentalTypeLabel(detail.rentalType) }}</el-tag>
          <el-tag v-if="roomInfo.status" size="small" :color="roomInfo.statusColor" effect="dark">
            {{ roomInfo.status }}
          </el-tag>
        </div>
      </div>

      <!-- 主体内容 -->
      <div class="main-content">
        <!-- 左侧区域 -->
        <div class="left-section">
          <!-- 图片展示区 -->
          <div class="image-section">
            <div v-if="allImages.length > 0" class="image-gallery">
              <div class="main-image">
                <el-image :src="allImages[0]" fit="cover" :preview-src-list="allImages" :initial-index="0" class="primary-img">
                  <template #error>
                    <div class="image-error">
                      <el-icon><Picture /></el-icon>
                      <span>暂无图片</span>
                    </div>
                  </template>
                </el-image>
              </div>
              <div v-if="allImages.length > 1" class="thumbnail-list">
                <el-image
                  v-for="(img, index) in allImages.slice(1, 5)"
                  :key="index"
                  :src="img"
                  fit="cover"
                  :preview-src-list="allImages"
                  :initial-index="index + 1"
                  class="thumbnail-img"
                >
                  <template #error>
                    <div class="image-error-small">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
                <div v-if="allImages.length > 5" class="more-images" @click="handleImageClick(5)">
                  <el-icon><Camera /></el-icon>
                  <span>+{{ allImages.length - 5 }}</span>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无图片" />
          </div>

          <!-- 房间切换标签（仅合租） -->
          <div v-if="roomTabs.length > 1" class="room-tabs">
            <el-tabs v-model="activeRoomId" type="card">
              <el-tab-pane v-for="item in roomTabs" :key="item.roomId || item.roomNumber" :name="item.roomId || item.roomNumber || 'room'">
                <template #label>
                  <div class="tab-label">
                    <span>{{ item.roomNumber || "房间" }}</span>
                    <el-tag v-if="item.roomStatus === ROOM_STATUS_ENUM.LEASED.code" size="small" type="success">已租</el-tag>
                    <el-tag v-else-if="item.roomStatus === ROOM_STATUS_ENUM.AVAILABLE.code" size="small" type="danger">空置</el-tag>
                  </div>
                </template>
              </el-tab-pane>
            </el-tabs>
          </div>

          <!-- 房源信息 -->
          <div class="info-section">
            <div class="section-header">
              <el-icon><House /></el-icon>
              <span class="section-title">房源信息</span>
            </div>
            <el-descriptions :column="3" size="default" border>
              <el-descriptions-item label="小区名称" :span="2">{{ houseInfo.communityName }}</el-descriptions-item>
              <el-descriptions-item label="负责人">{{ houseInfo.salesmanName }}</el-descriptions-item>
              <el-descriptions-item label="地址" :span="3">{{ houseInfo.address }}</el-descriptions-item>
              <el-descriptions-item label="楼栋/单元">{{ houseInfo.building }} {{ houseInfo.unit }}</el-descriptions-item>
              <el-descriptions-item label="门牌号">{{ houseInfo.doorNumber }}</el-descriptions-item>
              <el-descriptions-item label="楼层">{{ houseInfo.floor }}/{{ houseInfo.floorTotal }}</el-descriptions-item>
              <el-descriptions-item label="朝向">{{ houseInfo.direction }}</el-descriptions-item>
              <el-descriptions-item label="面积">{{ houseInfo.area }}㎡</el-descriptions-item>
              <el-descriptions-item label="装修">{{ houseInfo.decoration }}</el-descriptions-item>
              <el-descriptions-item label="物业费">{{ houseInfo.propertyFee }}元/月</el-descriptions-item>
              <el-descriptions-item label="电梯">{{ houseInfo.hasElevator }}</el-descriptions-item>
              <el-descriptions-item label="燃气">{{ houseInfo.hasGas }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 房间信息 -->
          <div class="info-section">
            <div class="section-header">
              <el-icon><Money /></el-icon>
              <span class="section-title">房间信息</span>
            </div>
            <el-descriptions :column="3" size="default" border>
              <el-descriptions-item label="房间号">{{ roomInfo.roomNumber }}</el-descriptions-item>
              <el-descriptions-item label="房型">{{ roomInfo.layoutName }}</el-descriptions-item>
              <el-descriptions-item label="出租价格">
                <span class="price-highlight">{{ roomInfo.price }}</span>
                元/月
              </el-descriptions-item>
              <el-descriptions-item label="房间状态">
                <el-tag :color="roomInfo.statusColor" effect="dark" size="small">
                  {{ roomInfo.status }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="租客" :span="2">
                {{ roomInfo.tenantName }}
              </el-descriptions-item>
              <el-descriptions-item label="联系电话" :span="2">
                {{ roomInfo.tenantPhone }}
              </el-descriptions-item>
              <el-descriptions-item label="租期" :span="3">{{ roomInfo.leaseStartDate }} ~ {{ roomInfo.leaseEndDate }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <!-- 设施设备 -->
          <div v-if="facilities.length > 0" class="info-section">
            <div class="section-header">
              <el-icon><House /></el-icon>
              <span class="section-title">设施设备</span>
            </div>
            <div class="facilities-grid">
              <div v-for="(facility, index) in facilities" :key="index" class="facility-item">
                <span class="facility-name">{{ facility.name }}</span>
                <span class="facility-count">x{{ facility.count || 1 }}</span>
              </div>
            </div>
          </div>

          <!-- 房源标签 -->
          <div v-if="tags.length > 0" class="info-section">
            <div class="section-header">
              <el-icon><House /></el-icon>
              <span class="section-title">房源特色</span>
            </div>
            <div class="tags-list">
              <el-tag v-for="(tag, index) in tags" :key="index" size="default" type="info">
                {{ tag }}
              </el-tag>
            </div>
          </div>

          <!-- 合租房间列表 -->
          <div v-if="detail.rentalType === 2 && scatterDetail?.roomList?.length" class="info-section">
            <div class="section-header">
              <el-icon><House /></el-icon>
              <span class="section-title">房间列表</span>
            </div>
            <el-table :data="scatterDetail.roomList" border stripe>
              <el-table-column type="index" label="序号" width="70" align="center" />
              <el-table-column prop="roomNumber" label="房间号" min-width="100" />
              <el-table-column label="状态" min-width="100" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.roomStatus === ROOM_STATUS_ENUM.LEASED.code" size="small" type="success">已租</el-tag>
                  <el-tag v-else-if="row.roomStatus === ROOM_STATUS_ENUM.AVAILABLE.code" size="small" type="danger">空置</el-tag>
                  <el-tag v-else size="small" type="info">
                    {{ row.roomStatusName || "-" }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="area" label="面积" min-width="100" align="right">
                <template #default="{ row }">{{ row.area || "-" }}㎡</template>
              </el-table-column>
              <el-table-column prop="direction" label="朝向" min-width="80" />
              <el-table-column prop="price" label="价格" min-width="120" align="right">
                <template #default="{ row }">{{ row.price || "-" }}元/月</template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- 右侧快捷入口 -->
        <div class="right-sidebar">
          <div class="quick-actions">
            <div class="action-header">
              <el-icon><User /></el-icon>
              <span>快捷入口</span>
            </div>

            <!-- 根据房间状态显示不同操作 -->
            <template v-if="roomInfo.status === ROOM_STATUS_ENUM.AVAILABLE.name">
              <el-button type="primary" :icon="User" class="action-btn" @click="handleQuickAction('booking')">预约看房</el-button>
              <el-button type="success" :icon="User" class="action-btn" @click="handleQuickAction('tenant')">签约入住</el-button>
            </template>

            <template v-else-if="roomInfo.status === ROOM_STATUS_ENUM.LEASED.name">
              <el-button type="primary" :icon="User" class="action-btn" @click="handleQuickAction('viewContract')">查看合同</el-button>
              <el-button type="warning" :icon="User" class="action-btn" @click="handleQuickAction('checkout')">办理退租</el-button>
            </template>

            <el-divider />

            <div class="contact-info">
              <div class="contact-item">
                <label>负责人：</label>
                <span>{{ houseInfo.salesmanName }}</span>
              </div>
              <div class="contact-item">
                <label>联系电话：</label>
                <span>{{ houseInfo.salesmanPhone }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
  .house-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--el-bg-color-page);
  }

  // 顶部信息栏
  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-light);

    .left-info {
      flex: 1;

      .title-row {
        display: flex;
        gap: 12px;
        align-items: center;
        margin-bottom: 8px;

        .house-code {
          padding: 4px 12px;
          font-size: 13px;
          font-weight: 500;
          color: var(--el-color-primary);
          background: var(--el-color-primary-light-9);
          border-radius: 4px;
        }

        .house-name {
          font-size: 18px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }

        .room-number {
          font-size: 15px;
          color: var(--el-text-color-regular);
        }
      }

      .address-row {
        display: flex;
        gap: 6px;
        align-items: center;
        font-size: 14px;
        color: var(--el-text-color-secondary);

        .el-icon {
          color: var(--el-text-color-placeholder);
        }
      }
    }

    .right-tags {
      display: flex;
      gap: 8px;
      align-items: center;
    }
  }

  // 主体内容
  .main-content {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 16px;
    flex: 1;
    padding: 16px;
    overflow: hidden;
  }

  // 左侧区域
  .left-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow-y: auto;
  }

  // 图片展示区
  .image-section {
    background: var(--el-bg-color);
    border-radius: 8px;

    .image-gallery {
      .main-image {
        height: 400px;
        margin-bottom: 12px;
        overflow: hidden;
        border-radius: 8px 8px 0 0;

        .primary-img {
          width: 100%;
          height: 100%;

          :deep(img) {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }

        .image-error {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
          justify-content: center;
          height: 100%;
          background: var(--el-fill-color-light);

          .el-icon {
            font-size: 48px;
            color: var(--el-text-color-placeholder);
          }
        }
      }

      .thumbnail-list {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        padding: 0 12px 12px;

        .thumbnail-img {
          aspect-ratio: 16 / 9;
          overflow: hidden;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.3s;

          &:hover {
            transform: scale(1.05);
            box-shadow: var(--el-box-shadow-light);
          }

          :deep(img) {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .image-error-small {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            background: var(--el-fill-color-light);

            .el-icon {
              font-size: 24px;
              color: var(--el-text-color-placeholder);
            }
          }
        }

        .more-images {
          display: flex;
          flex-direction: column;
          gap: 4px;
          align-items: center;
          justify-content: center;
          aspect-ratio: 16 / 9;
          font-size: 14px;
          color: var(--el-text-color-secondary);
          cursor: pointer;
          background: var(--el-fill-color-light);
          border-radius: 4px;
          transition: all 0.3s;

          &:hover {
            color: var(--el-color-primary);
            background: var(--el-color-primary-light-9);
          }

          .el-icon {
            font-size: 24px;
          }
        }
      }
    }
  }

  // 房间标签
  .room-tabs {
    background: var(--el-bg-color);
    border-radius: 8px;

    :deep(.el-tabs__header) {
      margin: 0;
      padding: 12px 12px 0;
    }

    .tab-label {
      display: flex;
      gap: 8px;
      align-items: center;
    }
  }

  // 信息区块
  .info-section {
    padding: 16px;
    background: var(--el-bg-color);
    border-radius: 8px;

    .section-header {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 16px;

      .el-icon {
        font-size: 18px;
        color: var(--el-color-primary);
      }

      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
    }

    .price-highlight {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-color-danger);
    }
  }

  // 设施网格
  .facilities-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;

    .facility-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: var(--el-fill-color-light);
      border-radius: 6px;

      .facility-name {
        font-size: 14px;
        color: var(--el-text-color-regular);
      }

      .facility-count {
        font-size: 13px;
        font-weight: 500;
        color: var(--el-text-color-secondary);
      }
    }
  }

  // 标签列表
  .tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  // 右侧快捷操作
  .right-sidebar {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .quick-actions {
    padding: 16px;
    background: var(--el-bg-color);
    border-radius: 8px;

    .action-header {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 16px;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .el-icon {
        color: var(--el-color-primary);
      }
    }

    .action-btn {
      width: 100%;
      margin-bottom: 12px;
    }

    .contact-info {
      .contact-item {
        padding: 8px 0;
        font-size: 14px;
        color: var(--el-text-color-regular);

        label {
          color: var(--el-text-color-secondary);
        }
      }
    }
  }

  // 响应式
  @media (width <= 1200px) {
    .main-content {
      grid-template-columns: 1fr;

      .right-sidebar {
        display: none;
      }
    }
  }
</style>
