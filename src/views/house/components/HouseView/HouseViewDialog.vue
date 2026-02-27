<script setup lang="ts">
  import { computed, onMounted, ref, watch } from "vue";
  import { BookingListVo, HouseDetailVo, LeaseLiteVo, PriceMethodEnum, RoomDetailVo, RoomTrackVo, type PriceConfigDto } from "@/types";
  import { getOptionByCode, LEASE_MODE_OPTIONS, ROOM_STATUS_ENUM } from "@/constants";
  import { calcLeaseDuration, getDecorationLabel, getDirectionLabel, getHouseLayoutName, getRentalTypeLabel } from "@/utils/house";
  import { formatDate } from "@/utils/date";
  import { message } from "@/utils/message";
  import { usePriceConfigEdit } from "@/views/house/components/PriceConfig/hook";
  import { addRoomTrack, getRoomPriceConfig, saveRoomPriceConfig } from "@/api/house/room";
  import { getRoomStatus } from "@/utils/house";

  import HvLoadingSkeleton from "./HvLoadingSkeleton.vue";
  import HvTopBar from "./HvTopBar.vue";
  import HvRoomMain from "./HvRoomMain.vue";
  import HvPanel from "./HvPanel.vue";
  import { getDictDataByDictCode } from "@/api/sys/dict";

  const props = defineProps<{
    loading: boolean;
    detail: HouseDetailVo | null;
  }>();

  const emit = defineEmits<{
    booking: [room: RoomDetailVo];
    tenant: [room: RoomDetailVo];
    checkout: [room: RoomDetailVo];
    editHouse: [detail: HouseDetailVo];
    viewContract: [room: RoomDetailVo];
    openTenantDetail: [tenantId: string, leaseId: string];
    openBookingDetail: [bookingId: string];
    renewLease: [lease: LeaseLiteVo];
    addRoom: [];
    reload: [];
  }>();

  // ── 房源级信息 ────────────────────────────────────────────
  const isShareRental = computed(() => props.detail?.rentalType === 2);

  const houseMeta = computed(() => {
    const d = props.detail;
    return {
      layoutName: getHouseLayoutName(d?.houseLayout),
      leaseModeName: getOptionByCode([...LEASE_MODE_OPTIONS], d?.leaseMode).label || "-",
      rentalType: getRentalTypeLabel(d?.rentalType),
      decoration: getDecorationLabel(d?.decorationType),
      area: d?.area || "-",
      floor: d?.floor || "-",
      floorTotal: d?.floorTotal || "-",
      hasElevator: d?.hasElevator ? "有" : "无",
      hasGas: d?.hasGas ? "有" : "无",
      water: d?.water || "-",
      electricity: d?.electricity || "-",
      propertyFee: d?.propertyFee ?? "-",
      communityName: d?.community?.name ?? d?.houseName ?? "-",
      salesmanName: d?.salesmanName || "-",
      deptId: d?.deptId || "-",
      houseRemark: d?.remark || ""
    };
  });

  // ── 房间列表 & 选中 ───────────────────────────────────────
  const roomTabs = computed<RoomDetailVo[]>(() => props.detail?.roomList ?? []);
  const activeRoomIndex = ref(0);
  watch(
    () => roomTabs.value,
    () => {
      activeRoomIndex.value = 0;
    },
    { immediate: true }
  );
  const currentRoom = computed<RoomDetailVo | null>(() => roomTabs.value[activeRoomIndex.value] ?? roomTabs.value[0] ?? null);

  // ── 图片 ──────────────────────────────────────────────────
  const allImages = computed(() => {
    const set = new Set<string>();
    props.detail?.houseLayout?.imageList?.forEach(i => i && set.add(i));
    currentRoom.value?.imageList?.forEach(i => i && set.add(i));
    set.delete("");
    return [...set];
  });

  // ── 出租统计 ──────────────────────────────────────────────
  const roomStats = computed(() => {
    const tabs = roomTabs.value;
    const leased = tabs.filter(r => r.roomStatus === ROOM_STATUS_ENUM.LEASED.code).length;
    const available = tabs.filter(r => r.roomStatus === ROOM_STATUS_ENUM.AVAILABLE.code).length;
    const booked = tabs.filter(r => r.roomStatus === ROOM_STATUS_ENUM.BOOKED.code).length;
    return { total: tabs.length, leased, available, booked };
  });
  const occupancyRate = computed(() => {
    const t = roomStats.value.total;
    return t ? Math.round((roomStats.value.leased / t) * 100) : 0;
  });

  // ── 房间状态 ──────────────────────────────────────────────
  const currentStatus = computed(() => getRoomStatus(currentRoom.value!));
  const isLeased = computed(() => currentRoom.value?.roomStatus === ROOM_STATUS_ENUM.LEASED.code);
  const isAvailable = computed(() => currentRoom.value?.roomStatus === ROOM_STATUS_ENUM.AVAILABLE.code);
  const isBooked = computed(() => currentRoom.value?.roomStatus === ROOM_STATUS_ENUM.BOOKED.code);

  // ── 租客 & 预定信息 ───────────────────────────────────────
  const tenantInfo = computed(() => {
    const li = currentRoom.value?.lease;
    if (!li?.tenantName) return null;
    return {
      id: li.tenantId || "",
      leaseId: li.leaseId || "",
      name: li.tenantName,
      phone: li.tenantPhone || "-",
      rentPrice: li.rentPrice ?? currentRoom.value?.price ?? "-",
      leaseStart: formatDate(li.leaseStart),
      leaseEnd: formatDate(li.leaseEnd),
      duration: calcLeaseDuration(li.leaseStart, li.leaseEnd)
    };
  });
  const bookingInfo = computed<BookingListVo | null>(() => currentRoom.value?.booking ?? null);

  // ── 房间详情 ──────────────────────────────────────────────
  const roomDetail = computed(() => {
    const r = currentRoom.value;
    return {
      roomNumber: r?.roomNumber || "-",
      direction: getDirectionLabel(r?.direction),
      innerArea: r?.area ? `${r.area} m²` : "-",
      floorInfo: `第 ${houseMeta.value.floor} 层 / 共 ${houseMeta.value.floorTotal} 层`,
      firstAvailDate: r?.availableDate || "-",
      vacancyStart: r?.vacancyStartTime || "-"
    };
  });

  // ── 租金配置 ──────────────────────────────────────────────
  const { openPriceConfigDialog } = usePriceConfigEdit();
  const priceConfig = ref<PriceConfigDto | null>(null);

  const loadPriceConfig = async (force = false) => {
    const roomId = currentRoom.value?.id;
    if (!roomId) return;
    if (!force) {
      const inline = (currentRoom.value as any)?.priceConfig as PriceConfigDto | undefined;
      if (inline?.price) {
        priceConfig.value = inline;
        return;
      }
    }
    try {
      const res = await getRoomPriceConfig({ roomId });
      priceConfig.value = res.code === 0 && res.data ? res.data : null;
    } catch {
      priceConfig.value = null;
    }
  };

  watch(
    () => currentRoom.value,
    () => loadPriceConfig(),
    { immediate: true }
  );

  const rentPrice = computed(() => priceConfig.value?.price || currentRoom.value?.price || "0");

  const handleOpenPriceConfig = () => {
    const room = currentRoom.value;
    if (!room) return;
    const roomId = room.id;
    const config = priceConfig.value ?? {
      roomId,
      price: room.price ? Number(room.price) : 0,
      floorPrice: 0,
      floorPriceMethod: PriceMethodEnum.RATIO,
      floorPriceInput: 0,
      otherFees: [],
      pricePlans: []
    };
    openPriceConfigDialog("配置", config, async result => {
      try {
        const res = await saveRoomPriceConfig({ roomId, ...result });
        if (res.code === 0) {
          message("租金配置保存成功", { type: "success" });
          loadPriceConfig(true);
        } else {
          message(res.message || "保存失败", { type: "error" });
        }
      } catch {
        message("保存租金配置失败", { type: "error" });
      }
    });
  };

  // ── 字典：房间特色 & 房间配置 ─────────────────────────────
  /** value → label 映射，供 HvRoomMain 展示时翻译 */
  const tagsMap = ref<Record<string, string>>({});
  const facilitiesMap = ref<Record<string, string>>({});

  onMounted(() => {
    getDictDataByDictCode({ dictCode: "house_tags" }).then(res => {
      const map: Record<string, string> = {};
      res.data?.forEach((item: any) => {
        map[String(item.id ?? item.value)] = item.name;
      });
      tagsMap.value = map;
    });

    getDictDataByDictCode({ dictCode: "house_facilities" }).then(res => {
      const map: Record<string, string> = {};
      res.data?.forEach((item: any) => {
        map[String(item.value)] = item.name;
      });
      facilitiesMap.value = map;
    });
  });

  // ── 跟进记录 ──────────────────────────────────────────────
  const localTrackRecords = ref<RoomTrackVo[]>([]);
  const trackLoading = ref(false);
  const trackRecords = computed<RoomTrackVo[]>(() => [...localTrackRecords.value, ...(currentRoom.value?.roomTracks ?? [])]);

  watch(
    () => currentRoom.value?.id,
    () => {
      localTrackRecords.value = [];
    },
    { immediate: true }
  );

  const handleAddTrack = async (content: string) => {
    const roomId = currentRoom.value?.id;
    if (!roomId) return message("房间ID缺失", { type: "warning" });
    trackLoading.value = true;
    try {
      const res = await addRoomTrack({ roomId, trackContent: content });
      if (res.code === 0) {
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, "0");
        const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        localTrackRecords.value.unshift({
          id: String(Date.now()),
          roomId,
          trackContent: content,
          createTime: timeStr,
          updateByName: props.detail?.salesman?.nickname || props.detail?.salesmanName || "当前用户"
        });
        message("跟进记录已保存", { type: "success" });
      } else {
        message(res.message || "保存失败", { type: "error" });
      }
    } catch {
      message("保存失败", { type: "error" });
    } finally {
      trackLoading.value = false;
    }
  };
</script>

<template>
  <div class="hv">
    <!-- Loading 骨架屏 -->
    <HvLoadingSkeleton v-if="loading" />

    <!-- 主体三栏 -->
    <template v-else-if="detail">
      <!-- 顶部：房间选择 + 出租率 -->
      <HvTopBar
        :detail="detail"
        :room-tabs="roomTabs"
        :active-room-index="activeRoomIndex"
        :is-share-rental="isShareRental"
        :room-stats="roomStats"
        :occupancy-rate="occupancyRate"
        @update:active-room-index="activeRoomIndex = $event"
        @edit-house="emit('editHouse', $event)"
      />

      <div class="hv-layout">
        <!-- 中间：房间详情（含房源信息Tab） -->
        <HvRoomMain
          :detail="detail"
          :current-room="currentRoom"
          :current-status="currentStatus"
          :rent-price="rentPrice"
          :price-config="priceConfig"
          :track-records="trackRecords"
          :track-loading="trackLoading"
          :salesman-name="houseMeta.salesmanName"
          :room-detail="roomDetail"
          :tags-map="tagsMap"
          :facilities-map="facilitiesMap"
          :house-meta="houseMeta"
          :all-images="allImages"
          @edit-house="emit('editHouse', $event)"
          @open-price-config="handleOpenPriceConfig"
          @add-track="handleAddTrack"
        />

        <!-- 右侧：租客/预定/备注 -->
        <HvPanel
          :current-room="currentRoom"
          :tenant-info="tenantInfo"
          :booking-info="bookingInfo"
          :is-leased="isLeased"
          :is-available="isAvailable"
          :is-booked="isBooked"
          @tenant="emit('tenant', $event)"
          @checkout="emit('checkout', $event)"
          @renew-lease="emit('renewLease', $event)"
          @view-contract="emit('viewContract', $event)"
          @open-tenant-detail="emit('openTenantDetail', $event[0], $event[1])"
          @open-booking-detail="emit('openBookingDetail', $event)"
          @booking="emit('booking', $event)"
        />
      </div>
    </template>

    <!-- 空/错误状态 -->
    <div v-else class="hv-empty">
      <div class="hv-empty__ico">🏚️</div>
      <p class="hv-empty__title">房源数据加载失败</p>
      <p class="hv-empty__sub">请关闭弹窗后重试</p>
      <el-button type="primary" plain @click="emit('reload')">重新加载</el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
  // ════════════════════════════════════════
  //  Design Tokens（子组件通过 CSS 变量继承）
  // ════════════════════════════════════════
  .hv {
    --b: var(--el-border-color);
    --bl: var(--el-border-color-lighter);
    --t1: var(--el-text-color-primary);
    --t2: var(--el-text-color-regular);
    --t3: var(--el-text-color-placeholder);
    --bg: var(--el-bg-color-page);
    --card: var(--el-bg-color);
    --sub: var(--el-fill-color-light);
    --success: var(--el-color-success);
    --success-bg: var(--el-color-success-light-9);
    --success-border: var(--el-color-success-light-5);
    --warning: var(--el-color-warning);
    --warning-bg: var(--el-color-warning-light-9);
    --danger: var(--el-color-danger);
    --danger-bg: var(--el-color-danger-light-9);
    --info: var(--el-color-info);
    --info-bg: var(--el-color-info-light-9);
    --primary: var(--el-color-primary);
    --primary-light: var(--el-color-primary-light-9);
    --r: 10px;
    --r-sm: 6px;
    --shadow: var(--el-box-shadow-light);
    --shadow-up: var(--el-box-shadow);
    --hover-bg: var(--el-fill-color);
    --remark-bg: var(--el-color-warning-light-9);
    --remark-border: var(--el-color-warning-light-5);
    --remark-text: var(--el-color-warning-dark-2);
    --sk-base: var(--el-fill-color-light);
    --sk-shine: var(--el-fill-color);
    --price-main-from: var(--el-color-success-light-9);
    --price-main-to: var(--el-color-success-light-8);
    --track-icon-bg: var(--el-color-primary-light-9);
    --track-icon-color: var(--el-color-primary);
    --dot-border: var(--el-bg-color);

    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg);
    font-size: 13px;
    color: var(--t1);
    overflow: hidden;
    font-family: -apple-system, "PingFang SC", "Helvetica Neue", "Microsoft YaHei", sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  // ════════════════════════════════════════
  //  Layout
  // ════════════════════════════════════════
  .hv-layout {
    display: grid;
    grid-template-columns: 1fr 280px;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  // ════════════════════════════════════════
  //  空/错误状态
  // ════════════════════════════════════════
  .hv-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    &__ico {
      font-size: 52px;
    }
    &__title {
      font-size: 16px;
      font-weight: 700;
      margin: 0;
    }
    &__sub {
      font-size: 13px;
      color: var(--t3);
      margin: 0;
    }
  }

  // ════════════════════════════════════════
  //  响应式
  // ════════════════════════════════════════
  @media (width <= 1280px) {
    .hv-layout {
      grid-template-columns: 1fr 260px;
    }
  }
  @media (width <= 900px) {
    .hv-layout {
      grid-template-columns: 1fr;
    }
  }
</style>
