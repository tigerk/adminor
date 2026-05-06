<script setup lang="ts">
  import { computed, onMounted, ref, watch } from "vue";
  import { HouseDetailVo, LeaseLiteVo, RoomDetailVo, RoomTrackVo, type PriceConfigDto, BookingListVo, RoomLockRecordProps, PriceMethodEnumMeta } from "@/types";
  import { OccupancyStatusEnumMeta } from "@/types/generated/enum.meta";

  import { message } from "@/utils/message";
  import { useUserStoreHook } from "@/store/modules/user";
  import { usePriceConfigEdit } from "@/views/house/components/PriceConfig/hook";
  import { addRoomTrack, getRoomLockRecords, getRoomPriceConfig, saveRoomPriceConfig } from "@/api/house/room";
  import { getRoomStatus } from "@/utils/house";

  import RmLoadingSkeleton from "./RmLoadingSkeleton.vue";
  import RmTopBar from "./RmTopBar.vue";
  import RmRoomMain from "./RmRoomMain.vue";
  import RmPanel from "./RmPanel.vue";
  import { getDictDataByDictCode } from "@/api/sys/dict";

  const props = defineProps<{
    loading: boolean;
    detail: HouseDetailVo | null;
    initialRoomId?: string;
    mode?: "dialog" | "page";
  }>();

  const emit = defineEmits<{
    back: [];
    booking: [room: RoomDetailVo];
    tenant: [room: RoomDetailVo];
    checkout: [room: RoomDetailVo];
    editHouse: [detail: HouseDetailVo];
    viewContract: [room: RoomDetailVo];
    openTenantDetail: [leaseId: string];
    openBookingDetail: [booking: BookingListVo];
    renewLease: [lease: LeaseLiteVo];
    addRoom: [];
    reload: [];
    roomChange: [roomId: string, room: RoomDetailVo | null];
  }>();

  // ── 房源级信息 ────────────────────────────────────────────
  const isShareRental = computed(() => props.detail?.rentalType === 2);

  // ── 房间列表 & 选中 ───────────────────────────────────────
  const roomTabs = computed<RoomDetailVo[]>(() => props.detail?.roomList ?? []);
  const activeRoomIndex = ref(0);
  const selectedRoomId = ref("");

  const getRoomIdentity = (room?: RoomDetailVo | null) => String(room?.id ?? (room as any)?.roomId ?? "");

  const syncActiveRoomIndex = () => {
    const targetRoomId = selectedRoomId.value || (props.initialRoomId ? String(props.initialRoomId) : "");
    const nextIndex = targetRoomId ? roomTabs.value.findIndex(room => getRoomIdentity(room) === targetRoomId) : -1;
    activeRoomIndex.value = nextIndex >= 0 ? nextIndex : 0;
  };

  watch(
    () => props.initialRoomId,
    roomId => {
      selectedRoomId.value = roomId ? String(roomId) : "";
      syncActiveRoomIndex();
    },
    { immediate: true }
  );

  watch(
    () => roomTabs.value,
    () => syncActiveRoomIndex(),
    { immediate: true }
  );

  const handleActiveRoomIndexChange = (idx: number) => {
    activeRoomIndex.value = idx;
    selectedRoomId.value = getRoomIdentity(roomTabs.value[idx]);
  };

  const currentRoom = computed<RoomDetailVo | null>(() => roomTabs.value[activeRoomIndex.value] ?? roomTabs.value[0] ?? null);

  watch(
    () => currentRoom.value,
    room => {
      emit("roomChange", String(room?.id ?? ""), room ?? null);
    },
    { immediate: true }
  );

  // ── 图片 ──────────────────────────────────────────────────
  const allImages = computed(() => {
    const set = new Set<string>();
    currentRoom.value?.imageList?.forEach(i => i && set.add(i));
    set.delete("");
    return [...set];
  });

  // ── 出租统计 ──────────────────────────────────────────────
  const roomStats = computed(() => {
    const tabs = roomTabs.value;
    const leased = tabs.filter(r => r.occupancyStatus === OccupancyStatusEnumMeta.LEASED.code).length;
    const available = tabs.filter(r => r.occupancyStatus === OccupancyStatusEnumMeta.AVAILABLE.code).length;
    const booked = tabs.filter(r => r.occupancyStatus === OccupancyStatusEnumMeta.BOOKED.code).length;
    return { total: tabs.length, leased, available, booked };
  });
  const occupancyRate = computed(() => {
    const t = roomStats.value.total;
    return t ? Math.round((roomStats.value.leased / t) * 100) : 0;
  });

  // ── 房间状态 ──────────────────────────────────────────────
  const currentStatus = computed(() => getRoomStatus(currentRoom.value!));

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
      floorPriceMethod: PriceMethodEnumMeta.RATIO.code,
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
  /** value → label 映射，供 RmRoomMain 展示时翻译 */
  const tagsMap = ref<Record<string, string>>({});
  const focusTagsMap = ref<Record<string, string>>({});
  const facilitiesMap = ref<Record<string, string>>({});

  onMounted(() => {
    getDictDataByDictCode({ dictCode: "house_tags" }).then(res => {
      const map: Record<string, string> = {};
      res.data?.forEach((item: any) => {
        map[String(item.id ?? item.value)] = item.name;
      });
      tagsMap.value = map;
    });

    getDictDataByDictCode({ dictCode: "focus_tags" }).then(res => {
      const map: Record<string, string> = {};
      res.data?.forEach((item: any) => {
        map[String(item.value ?? item.id)] = item.name;
      });
      focusTagsMap.value = map;
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
  const userStore = useUserStoreHook();
  const currentOperatorName = computed(() => userStore.nickname || userStore.username || "当前用户");
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
          createAt: timeStr,
          createBy: userStore.username || currentOperatorName.value,
          updateByName: currentOperatorName.value
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

  // ── 锁房记录 ──────────────────────────────────────────────
  const roomLockRecords = ref<RoomLockRecordProps[]>([]);
  const roomLockLoading = ref(false);

  const loadRoomLockRecords = async () => {
    const roomId = currentRoom.value?.id;
    if (!roomId) {
      roomLockRecords.value = [];
      return;
    }
    roomLockLoading.value = true;
    try {
      const res = await getRoomLockRecords({ roomId });
      roomLockRecords.value = res.code === 0 ? (res.data ?? []) : [];
    } catch {
      roomLockRecords.value = [];
    } finally {
      roomLockLoading.value = false;
    }
  };

  watch(
    () => currentRoom.value?.id,
    () => {
      loadRoomLockRecords();
    },
    { immediate: true }
  );
</script>

<template>
  <div class="hv" :class="{ 'hv--page': mode === 'page' }">
    <!-- Loading 骨架屏 -->
    <RmLoadingSkeleton v-if="loading" />

    <!-- 主体三栏 -->
    <template v-else-if="detail">
      <!-- 顶部：房间选择 + 出租率 -->
      <RmTopBar
        :detail="detail"
        :room-tabs="roomTabs"
        :active-room-index="activeRoomIndex"
        :is-share-rental="isShareRental"
        :room-stats="roomStats"
        :occupancy-rate="occupancyRate"
        :mode="mode"
        @update:active-room-index="handleActiveRoomIndexChange"
        @edit-house="d => emit('editHouse', d)"
        @back="() => emit('back')"
        @reload="() => emit('reload')"
      />

      <div class="hv-layout">
        <!-- 中间：房间详情（含房源信息Tab） -->
        <RmRoomMain
          :detail="detail"
          :current-room="currentRoom"
          :current-status="currentStatus"
          :rent-price="rentPrice"
          :price-config="priceConfig"
          :track-records="trackRecords"
          :track-loading="trackLoading"
          :room-lock-records="roomLockRecords"
          :room-lock-loading="roomLockLoading"
          :salesman-name="detail.salesman?.nickname || detail.salesmanName || '-'"
          :tags-map="tagsMap"
          :focus-tags-map="focusTagsMap"
          :facilities-map="facilitiesMap"
          :all-images="allImages"
          @edit-house="d => emit('editHouse', d)"
          @open-price-config="() => handleOpenPriceConfig()"
          @add-track="content => handleAddTrack(content)"
        />

        <!-- 右侧：租客/预定/备注 -->
        <RmPanel
          :current-room="currentRoom"
          @tenant="r => emit('tenant', r)"
          @checkout="r => emit('checkout', r)"
          @renew-lease="lease => emit('renewLease', lease)"
          @view-contract="r => emit('viewContract', r)"
          @open-tenant-detail="leaseId => emit('openTenantDetail', leaseId)"
          @open-booking-detail="bookingId => emit('openBookingDetail', bookingId)"
          @booking="r => emit('booking', r)"
        />
      </div>
    </template>

    <!-- 空/错误状态 -->
    <div v-else class="hv-empty">
      <div class="hv-empty__ico">🏚️</div>
      <p class="hv-empty__title">房源数据加载失败</p>
      <p class="hv-empty__sub">请刷新后重试</p>
      <el-button type="primary" plain @click="() => emit('reload')">重新加载</el-button>
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
    font-size: 14px;
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

  .hv--page {
    height: auto;
    overflow: visible;
    background: transparent;

    .hv-layout {
      grid-template-columns: minmax(0, 1fr) 340px;
      gap: 10px;
      overflow: visible;
      align-items: start;
    }

    :deep(.hv-topbar) {
      padding: 12px;
      margin-bottom: 10px;
      overflow: visible;
      background: var(--card);
      border: 1px solid var(--bl);
      border-radius: 12px;
    }

    :deep(.hv-topbar__rooms) {
      gap: 8px;
    }

    :deep(.hv-troom) {
      width: 178px;
      min-width: 178px;
      background: var(--card);
    }

    :deep(.hv-main) {
      min-width: 0;
      overflow: hidden;
      background: var(--card);
      border: 1px solid var(--bl);
      border-radius: 12px;
    }

    :deep(.hv-panel) {
      overflow: visible;
      background: transparent;
      border: 0;
      gap: 10px;
    }

    :deep(.hv-pcard) {
      overflow: hidden;
      background: var(--card);
      border: 1px solid var(--bl);
      border-radius: 12px;
    }

    :deep(.hv-pcard--remark) {
      min-height: 220px;
    }
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

    .hv--page .hv-layout {
      grid-template-columns: minmax(0, 1fr) 300px;
    }
  }
  @media (width <= 900px) {
    .hv-layout {
      grid-template-columns: 1fr;
    }

    .hv--page .hv-layout {
      grid-template-columns: 1fr;
    }
  }
</style>
