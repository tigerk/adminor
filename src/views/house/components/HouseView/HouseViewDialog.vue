<script setup lang="ts">
  import { computed, ref, watch } from "vue";
  import type { BookingListVo, HouseDetailVo, PriceConfigDto, RoomDetailVo } from "@/types";
  import { ROOM_STATUS_ENUM } from "@/constants";
  import { ArrowRight, Calendar, Edit, House, Location, Plus, User, View } from "@element-plus/icons-vue";
  import { usePriceConfigEdit } from "@/views/house/components/PriceConfig/hook";
  import { getRoomPriceConfig, saveRoomPriceConfig } from "@/api/house/room";
  import { message } from "@/utils/message";
  import { getDecorationLabel, getDirectionLabel, getElectricityTypeLabel, getRentalTypeLabel, getWaterTypeLabel } from "@/utils/house";
  import { formatDate } from "@/utils/date";

  // ======================== Props / Emits ========================
  const props = defineProps<{
    /** 是否正在加载 */
    loading: boolean;
    /** 房源详情（接口返回的完整数据，null 表示未加载或加载失败） */
    detail: HouseDetailVo | null;
  }>();

  const emit = defineEmits<{
    booking: [room: RoomDetailVo];
    tenant: [room: RoomDetailVo];
    checkout: [room: RoomDetailVo];
    viewContract: [room: RoomDetailVo];
    openTenantDetail: [tenantId: string, leaseId: string];
    openBookingDetail: [bookingId: string];
    renewLease: [room: RoomDetailVo];
    addRoom: [];
    /** 操作完成后通知父级刷新详情 */
    reload: [];
  }>();

  // ======================== 工具函数 ========================
  const calcLeaseDuration = (start?: string, end?: string) => {
    if (!start || !end) return "";
    const s = new Date(start),
      e = new Date(end);
    const m = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
    if (m >= 12) {
      const y = Math.floor(m / 12),
        r = m % 12;
      return r > 0 ? `${y}年${r}月` : `${y}年`;
    }
    return m > 0 ? `${m}个月` : "";
  };

  /** 计算租约进度 0~100 */
  const calcLeaseProgress = (start?: string, end?: string) => {
    if (!start || !end) return 0;
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const now = Date.now();
    if (now <= s) return 0;
    if (now >= e) return 100;
    return Math.round(((now - s) / (e - s)) * 100);
  };

  // ======================== 房源基础信息（直接读 detail） ========================
  const isFocus = computed(() => props.detail?.leaseMode === 1);
  const isShareRental = computed(() => props.detail?.rentalType === 2);

  /** 左侧面板展示用 meta */
  const houseMeta = computed(() => {
    const d = props.detail;
    return {
      rentalType: getRentalTypeLabel(d?.rentalType),
      direction: getDirectionLabel(d?.direction),
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

  // ======================== 房间 Tab（来自 detail.roomList） ========================
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

  // ======================== 图片（来自 houseLayout + 当前房间） ========================
  const allImages = computed(() => {
    const set = new Set<string>();
    props.detail?.houseLayout?.imageList?.forEach(i => i && set.add(i));
    currentRoom.value?.imageList?.forEach(i => i && set.add(i));
    set.delete("");
    return [...set];
  });

  // ======================== 房间状态 ========================
  const roomStatusInfo = computed(() => {
    const r = currentRoom.value;
    if (!r) return { statusName: "-", statusColor: "", isLeased: false, isAvailable: false, isBooked: false };
    return {
      statusName: r.roomStatusName || "-",
      statusColor: r.roomStatusColor || "",
      isLeased: r.roomStatus === ROOM_STATUS_ENUM.LEASED.code,
      isAvailable: r.roomStatus === ROOM_STATUS_ENUM.AVAILABLE.code,
      isBooked: r.roomStatus === ROOM_STATUS_ENUM.BOOKED.code
    };
  });

  const getRoomTabStatus = (room: RoomDetailVo) => {
    const map: Record<number, { text: string; cls: string; dot: string }> = {
      [ROOM_STATUS_ENUM.LEASED.code]: { text: "已租", cls: "st-leased", dot: "#67c23a" },
      [ROOM_STATUS_ENUM.AVAILABLE.code]: { text: "空置", cls: "st-available", dot: "#f56c6c" },
      [ROOM_STATUS_ENUM.BOOKED.code]: { text: "已预定", cls: "st-booked", dot: "#e6a23c" },
      [ROOM_STATUS_ENUM.LOCKED.code]: { text: "锁房", cls: "st-locked", dot: "#909399" }
    };
    return map[room.roomStatus!] || { text: room.roomStatusName || "-", cls: "", dot: "#909399" };
  };

  /** 各状态房间数量统计 */
  const roomStats = computed(() => {
    const tabs = roomTabs.value;
    return {
      total: tabs.length,
      leased: tabs.filter(r => r.roomStatus === ROOM_STATUS_ENUM.LEASED.code).length,
      available: tabs.filter(r => r.roomStatus === ROOM_STATUS_ENUM.AVAILABLE.code).length,
      booked: tabs.filter(r => r.roomStatus === ROOM_STATUS_ENUM.BOOKED.code).length
    };
  });

  // ======================== 租客信息 ========================
  const tenantInfo = computed(() => {
    const li = currentRoom.value?.leaseInfo;
    if (!li?.tenantName) return null;
    return {
      name: li.tenantName,
      phone: li.tenantPhone || "-",
      rentPrice: currentRoom.value?.price || "-",
      leaseStart: formatDate(li.leaseStartDate),
      leaseEnd: formatDate(li.leaseEndDate),
      duration: calcLeaseDuration(li.leaseStartDate, li.leaseEndDate),
      progress: calcLeaseProgress(li.leaseStartDate, li.leaseEndDate),
      leaseStartRaw: li.leaseStartDate,
      leaseEndRaw: li.leaseEndDate
    };
  });

  // ======================== 预定信息 ========================
  const bookingInfo = computed<BookingListVo | null>(() => {
    if (!roomStatusInfo.value.isBooked || !currentRoom.value?.leaseInfo) return null;
    const li = currentRoom.value.leaseInfo;
    return {
      id: li.leaseId || "",
      roomIds: [],
      roomList: [],
      tenantName: li.tenantName,
      tenantPhone: li.tenantPhone,
      bookingTime: li.leaseStartDate as any,
      expiryTime: li.leaseEndDate as any
    } as BookingListVo;
  });

  // ======================== 详情 Tab ========================
  const activeDetailTab = ref("room");

  // ======================== 房间基本信息 ========================
  const roomDetail = computed(() => {
    const r = currentRoom.value;
    return {
      roomNumber: r?.roomNumber || "-",
      direction: getDirectionLabel(r?.direction),
      innerArea: r?.area ? `${r.area}m²` : "-",
      floorInfo: `第${houseMeta.value.floor}层 / 共${houseMeta.value.floorTotal}层`,
      firstAvailDate: r?.availableDate || "-",
      vacancyStart: r?.vacancyStartTime || "-"
    };
  });

  // ======================== 租金配置 ========================
  const { openPriceConfigDialog } = usePriceConfigEdit();
  const priceConfig = ref<PriceConfigDto | null>(null);

  const loadPriceConfig = async () => {
    const roomId = currentRoom.value?.roomId || (currentRoom.value as any)?.id;
    if (!roomId) return;
    // 先检查 room 内联的 priceConfig
    const inlineConfig = (currentRoom.value as any)?.priceConfig as PriceConfigDto | undefined;
    if (inlineConfig?.price) {
      priceConfig.value = inlineConfig;
      return;
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
    () => {
      loadPriceConfig();
    },
    { immediate: true }
  );

  const rentPrice = computed(() => priceConfig.value?.price || currentRoom.value?.price || "0");

  const handleOpenPriceConfig = () => {
    const room = currentRoom.value;
    if (!room) return;
    const roomId = room.roomId || (room as any).id;
    const existConfig = priceConfig.value || {
      roomId,
      price: room.price ? Number(room.price) : 0,
      floorPrice: 0,
      floorPriceMethod: 1,
      floorPriceInput: 0,
      otherFees: [],
      pricePlans: []
    };
    openPriceConfigDialog("配置", existConfig, async result => {
      try {
        const res = await saveRoomPriceConfig({ roomId, ...result });
        if (res.code === 0) {
          message("租金配置保存成功", { type: "success" });
          loadPriceConfig();
        } else {
          message(res.message || "保存失败", { type: "error" });
        }
      } catch {
        message("保存租金配置失败", { type: "error" });
      }
    });
  };

  // 付款方式 label
  const payMethodLabel = (m?: number) => {
    const map: Record<number, string> = { 0: "随房租付", 1: "一次性", 2: "月付", 4: "季付", 5: "半年付", 6: "年付" };
    return m !== undefined ? (map[m] ?? "其他") : "";
  };

  // ======================== 退租 / 续签 ========================
  const handleCheckout = () => {
    if (!currentRoom.value?.leaseInfo) return message("当前房间没有在租租客", { type: "warning" });
    emit("checkout", currentRoom.value!);
  };
  const handleRenew = () => {
    if (!currentRoom.value?.leaseInfo) return message("当前房间没有在租租客", { type: "warning" });
    emit("renewLease", currentRoom.value!);
  };

  // ======================== 房间备注 ========================
  const remarkEditing = ref(false);
  const remarkText = ref("");
  const remarkLoading = ref(false);

  // 切换房间时同步房间级别的 remark
  watch(
    () => currentRoom.value,
    r => {
      remarkText.value = (r as any)?.remark ?? "";
      remarkEditing.value = false;
    },
    { immediate: true }
  );

  const handleSaveRemark = async () => {
    remarkLoading.value = true;
    try {
      // TODO: 调用实际保存接口
      await new Promise(r => setTimeout(r, 600));
      message("备注保存成功", { type: "success" });
      remarkEditing.value = false;
    } catch {
      message("备注保存失败", { type: "error" });
    } finally {
      remarkLoading.value = false;
    }
  };

  // ======================== 跟进记录 ========================
  interface FollowRecord {
    id: string;
    content: string;
    time: string;
    author: string;
  }

  const followRecords = ref<FollowRecord[]>([]);
  const followInput = ref("");
  const followLoading = ref(false);

  watch(
    () => currentRoom.value,
    () => {
      followRecords.value = [];
      followInput.value = "";
      // TODO: loadFollowRecords(currentRoom.value?.roomId)
    },
    { immediate: true }
  );

  const handleAddFollow = async () => {
    if (!followInput.value.trim()) return message("请输入跟进内容", { type: "warning" });
    followLoading.value = true;
    try {
      // TODO: 调用保存接口
      await new Promise(r => setTimeout(r, 400));
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
      followRecords.value.unshift({
        id: String(Date.now()),
        content: followInput.value.trim(),
        time: timeStr,
        author: houseMeta.value.salesmanName || "当前用户"
      });
      followInput.value = "";
      message("跟进记录已保存", { type: "success" });
    } catch {
      message("保存失败", { type: "error" });
    } finally {
      followLoading.value = false;
    }
  };
</script>

<template>
  <div class="hv">
    <!-- ===== Loading ===== -->
    <div v-if="loading" class="hv-loading">
      <el-skeleton animated>
        <template #template>
          <div class="hv-skeleton-wrap">
            <div class="hv-skeleton-left">
              <el-skeleton-item variant="image" style="width: 100%; height: 180px; border-radius: 0" />
              <div style="padding: 16px; display: flex; flex-direction: column; gap: 10px">
                <el-skeleton-item variant="h3" style="width: 70%" />
                <el-skeleton-item variant="text" />
                <el-skeleton-item variant="text" style="width: 85%" />
                <el-skeleton-item variant="text" style="width: 60%" />
              </div>
            </div>
            <div class="hv-skeleton-main">
              <div style="padding: 16px; display: flex; gap: 8px; border-bottom: 1px solid var(--el-border-color-extra-light)">
                <el-skeleton-item v-for="i in 4" :key="i" variant="button" style="width: 72px; height: 68px; border-radius: 8px" />
              </div>
              <div style="padding: 20px; display: flex; flex-direction: column; gap: 12px">
                <el-skeleton-item variant="h3" style="width: 40%" />
                <el-skeleton-item variant="text" />
                <el-skeleton-item variant="text" style="width: 75%" />
              </div>
            </div>
            <div class="hv-skeleton-panel">
              <div style="padding: 16px; display: flex; flex-direction: column; gap: 10px">
                <el-skeleton-item variant="h3" style="width: 50%" />
                <el-skeleton-item variant="image" style="width: 100%; height: 90px; border-radius: 10px" />
                <el-skeleton-item variant="text" />
                <el-skeleton-item variant="text" style="width: 80%" />
              </div>
            </div>
          </div>
        </template>
      </el-skeleton>
    </div>

    <template v-else-if="detail">
      <div class="hv-layout">
        <!-- ① 左侧：房源信息 -->
        <aside class="hv-aside">
          <!-- 图片英雄区 -->
          <div class="hv-hero">
            <el-image v-if="allImages.length" :src="allImages[0]" fit="cover" :preview-src-list="allImages" class="hv-hero__img" />
            <div v-else class="hv-hero__empty">
              <el-icon :size="40" color="var(--el-text-color-placeholder)"><House /></el-icon>
              <span>暂无图片</span>
            </div>
            <!-- 渐变遮罩 -->
            <div class="hv-hero__overlay" />
            <!-- 右下角图片计数 -->
            <div v-if="allImages.length > 1" class="hv-hero__count">
              <el-icon :size="11"><View /></el-icon>
              {{ allImages.length }}
            </div>
            <!-- 左下角小区名 -->
            <div class="hv-hero__caption">
              <el-icon :size="12"><Location /></el-icon>
              {{ houseMeta.communityName }}
            </div>
          </div>

          <!-- 房源属性 -->
          <div class="hv-aside__body">
            <!-- 状态统计条 -->
            <div class="hv-occ-bar">
              <div class="hv-occ-bar__item hv-occ-bar__item--leased">
                <span class="hv-occ-bar__num">{{ roomStats.leased }}</span>
                <span class="hv-occ-bar__label">已租</span>
              </div>
              <div class="hv-occ-bar__divider" />
              <div class="hv-occ-bar__item hv-occ-bar__item--available">
                <span class="hv-occ-bar__num">{{ roomStats.available }}</span>
                <span class="hv-occ-bar__label">空置</span>
              </div>
              <div class="hv-occ-bar__divider" />
              <div class="hv-occ-bar__item hv-occ-bar__item--booked">
                <span class="hv-occ-bar__num">{{ roomStats.booked }}</span>
                <span class="hv-occ-bar__label">预定</span>
              </div>
              <div class="hv-occ-bar__divider" />
              <div class="hv-occ-bar__item">
                <span class="hv-occ-bar__num">{{ roomStats.total }}</span>
                <span class="hv-occ-bar__label">总计</span>
              </div>
            </div>

            <!-- 属性 KV 网格 -->
            <div class="hv-kv-grid">
              <div class="hv-kv">
                <span class="hv-kv__label">房型</span>
                <span class="hv-kv__value">{{ houseMeta.rentalType }}</span>
              </div>
              <div class="hv-kv">
                <span class="hv-kv__label">面积</span>
                <span class="hv-kv__value">{{ houseMeta.area }} m²</span>
              </div>
              <div class="hv-kv">
                <span class="hv-kv__label">楼层</span>
                <span class="hv-kv__value">{{ houseMeta.floor }}/{{ houseMeta.floorTotal }}层</span>
              </div>
              <div class="hv-kv">
                <span class="hv-kv__label">朝向</span>
                <span class="hv-kv__value">{{ houseMeta.direction }}</span>
              </div>
              <div class="hv-kv">
                <span class="hv-kv__label">装修</span>
                <span class="hv-kv__value">{{ houseMeta.decoration }}</span>
              </div>
              <div class="hv-kv">
                <span class="hv-kv__label">电梯</span>
                <span class="hv-kv__value">{{ houseMeta.hasElevator }}</span>
              </div>
              <div class="hv-kv">
                <span class="hv-kv__label">燃气</span>
                <span class="hv-kv__value">{{ houseMeta.hasGas }}</span>
              </div>
              <div class="hv-kv">
                <span class="hv-kv__label">物业费</span>
                <span class="hv-kv__value">{{ houseMeta.propertyFee }}/月</span>
              </div>
              <div class="hv-kv">
                <span class="hv-kv__label">水费</span>
                <span class="hv-kv__value">{{ getWaterTypeLabel(houseMeta.water) }}</span>
              </div>
              <div class="hv-kv">
                <span class="hv-kv__label">电费</span>
                <span class="hv-kv__value">{{ getElectricityTypeLabel(houseMeta.electricity) }}</span>
              </div>
              <template v-if="isFocus">
                <div class="hv-kv">
                  <span class="hv-kv__label">门店</span>
                  <span class="hv-kv__value">{{ detail.houseName }}</span>
                </div>
              </template>
              <div class="hv-kv">
                <span class="hv-kv__label">部门</span>
                <span class="hv-kv__value">{{ houseMeta.deptId }}</span>
              </div>
            </div>

            <!-- 负责人 -->
            <div class="hv-salesman">
              <div class="hv-salesman__avatar">{{ houseMeta.salesmanName.slice(0, 1) }}</div>
              <div class="hv-salesman__info">
                <span class="hv-salesman__name">{{ houseMeta.salesmanName }}</span>
                <span class="hv-salesman__role">负责经纪人</span>
              </div>
            </div>

            <!-- 备注 -->
            <div v-if="houseMeta.houseRemark" class="hv-aside__remark">
              <span class="hv-aside__remark-label">房源备注</span>
              <span class="hv-aside__remark-text">{{ houseMeta.houseRemark }}</span>
            </div>

            <!-- 底部操作 -->
            <el-button class="hv-aside__edit-btn" size="small" plain>
              <el-icon><Edit /></el-icon>
              修改房源信息
            </el-button>
          </div>
        </aside>

        <!-- ② 中间：房间选择 + 详情 -->
        <main class="hv-main">
          <!-- 房间选择区 -->
          <div class="hv-room-selector">
            <div class="hv-room-selector__header">
              <span class="hv-room-selector__title">房间列表</span>
              <span class="hv-room-selector__sub">共 {{ roomStats.total }} 间</span>
            </div>
            <div class="hv-room-grid">
              <div
                v-for="(room, idx) in roomTabs"
                :key="room.id || (room as any).id || idx"
                class="hv-rcard"
                :class="{
                  'is-active': activeRoomIndex === idx,
                  'is-leased': room.roomStatus === ROOM_STATUS_ENUM.LEASED.code,
                  'is-available': room.roomStatus === ROOM_STATUS_ENUM.AVAILABLE.code,
                  'is-booked': room.roomStatus === ROOM_STATUS_ENUM.BOOKED.code,
                  'is-locked': room.roomStatus === ROOM_STATUS_ENUM.LOCKED.code
                }"
                @click="activeRoomIndex = idx"
              >
                <span class="hv-rcard__num">{{ room.roomNumber || String.fromCharCode(65 + idx) }}</span>
                <span class="hv-rcard__status">{{ getRoomTabStatus(room).text }}</span>
                <span class="hv-rcard__dot" :style="{ background: getRoomTabStatus(room).dot }" />
              </div>
              <div v-if="isShareRental" class="hv-rcard hv-rcard--add" @click="emit('addRoom')">
                <el-icon :size="16"><Plus /></el-icon>
                <span class="hv-rcard__status">添加房间</span>
              </div>
            </div>
          </div>

          <!-- 当前房间：价格 + 状态 -->
          <div
            class="hv-price-bar"
            :class="{
              'is-leased': roomStatusInfo.isLeased,
              'is-available': roomStatusInfo.isAvailable,
              'is-booked': roomStatusInfo.isBooked
            }"
          >
            <div class="hv-price-bar__left">
              <span class="hv-price-bar__status-dot" />
              <span class="hv-price-bar__status-text">
                {{ roomStatusInfo.isLeased ? "已租" : roomStatusInfo.isAvailable ? "空置中" : roomStatusInfo.isBooked ? "已预定" : roomStatusInfo.statusName }}
              </span>
              <span class="hv-price-bar__sep" />
              <span class="hv-price-bar__amount">{{ rentPrice }}</span>
              <span class="hv-price-bar__unit">元/月</span>
              <span v-if="priceConfig?.floorPrice" class="hv-price-bar__floor">
                底价
                <strong>{{ priceConfig.floorPrice }}</strong>
                元
              </span>
            </div>
            <div class="hv-price-bar__right">
              <button class="hv-price-bar__edit-btn" @click="handleOpenPriceConfig">
                <el-icon :size="11"><Edit /></el-icon>
                调整租金
              </button>
            </div>
          </div>

          <!-- 详情 Tab -->
          <div class="hv-detail">
            <div class="hv-tabs">
              <button class="hv-tab" :class="{ active: activeDetailTab === 'room' }" @click="activeDetailTab = 'room'">
                <span>房间信息</span>
              </button>
              <button class="hv-tab" :class="{ active: activeDetailTab === 'rent' }" @click="activeDetailTab = 'rent'">
                <span>租金配置</span>
              </button>
              <div class="hv-tabs__ink" :style="{ left: activeDetailTab === 'room' ? '0' : '50%' }" />
            </div>

            <div class="hv-tab-body">
              <!-- ===== 租金信息 ===== -->
              <template v-if="activeDetailTab === 'rent'">
                <div class="hv-section">
                  <div class="hv-section__head">
                    <span class="hv-section__title">租金明细</span>
                    <el-button size="small" link type="primary" @click="handleOpenPriceConfig">
                      <el-icon><Edit /></el-icon>
                      编辑配置
                    </el-button>
                  </div>
                  <div class="hv-price-cards">
                    <div class="hv-price-card hv-price-card--primary">
                      <span class="hv-price-card__label">租金价格</span>
                      <span class="hv-price-card__value">
                        {{ rentPrice }}
                        <em>元/月</em>
                      </span>
                    </div>
                    <div class="hv-price-card">
                      <span class="hv-price-card__label">租金底价</span>
                      <span class="hv-price-card__value">
                        <template v-if="priceConfig?.floorPrice">
                          {{ priceConfig.floorPrice }}
                          <em>元/月</em>
                        </template>
                        <template v-else>—</template>
                      </span>
                    </div>
                    <div class="hv-price-card">
                      <span class="hv-price-card__label">佣金</span>
                      <span class="hv-price-card__value">—</span>
                    </div>
                  </div>
                </div>

                <div class="hv-section">
                  <div class="hv-section__head">
                    <span class="hv-section__title">其他费用</span>
                  </div>
                  <template v-if="priceConfig?.otherFees?.length">
                    <div class="hv-fee-list">
                      <div v-for="(fee, i) in priceConfig.otherFees" :key="i" class="hv-fee-item">
                        <span class="hv-fee-item__name">{{ fee.name || "-" }}</span>
                        <span class="hv-fee-item__amount">{{ fee.priceInput ?? "-" }}{{ fee.priceMethod === 2 ? "%" : "元" }}</span>
                        <span class="hv-fee-item__method">{{ payMethodLabel(fee.paymentMethod) }}</span>
                      </div>
                    </div>
                  </template>
                  <div v-else class="hv-empty">暂未配置其他费用</div>
                </div>

                <div class="hv-section">
                  <div class="hv-section__head">
                    <span class="hv-section__title">租金方案</span>
                    <el-button link size="small" type="primary" @click="handleOpenPriceConfig">查看 / 编辑</el-button>
                  </div>
                  <template v-if="priceConfig?.pricePlans?.length">
                    <div class="hv-table">
                      <div class="hv-table__head">
                        <span>方案名称</span>
                        <span>类型</span>
                        <span>价格</span>
                        <span>比例</span>
                      </div>
                      <div v-for="(plan, i) in priceConfig.pricePlans" :key="i" class="hv-table__row">
                        <span>{{ plan.planName || "-" }}</span>
                        <span>{{ plan.planType || "-" }}</span>
                        <span class="hv-table__price">{{ plan.price ?? "-" }} 元</span>
                        <span>{{ plan.priceRatio ? plan.priceRatio + "%" : "-" }}</span>
                      </div>
                    </div>
                  </template>
                  <div v-else class="hv-empty">暂无租金方案</div>
                </div>
              </template>

              <!-- ===== 房间信息 ===== -->
              <template v-if="activeDetailTab === 'room'">
                <div class="hv-section">
                  <div class="hv-section__head">
                    <span class="hv-section__title">基本信息</span>
                    <el-button size="small" link type="primary">
                      <el-icon><Edit /></el-icon>
                      编辑
                    </el-button>
                  </div>
                  <div class="hv-info-grid">
                    <div class="hv-info-item">
                      <span class="hv-info-item__label">房间号</span>
                      <span class="hv-info-item__value">{{ roomDetail.roomNumber }}</span>
                    </div>
                    <div class="hv-info-item">
                      <span class="hv-info-item__label">朝向</span>
                      <span class="hv-info-item__value">{{ roomDetail.direction }}</span>
                    </div>
                    <div class="hv-info-item">
                      <span class="hv-info-item__label">套内面积</span>
                      <span class="hv-info-item__value">{{ roomDetail.innerArea }}</span>
                    </div>
                    <div class="hv-info-item">
                      <span class="hv-info-item__label">所在楼层</span>
                      <span class="hv-info-item__value">{{ roomDetail.floorInfo }}</span>
                    </div>
                    <div class="hv-info-item">
                      <span class="hv-info-item__label">首次可租</span>
                      <span class="hv-info-item__value">{{ roomDetail.firstAvailDate }}</span>
                    </div>
                    <div class="hv-info-item">
                      <span class="hv-info-item__label">空置开始</span>
                      <span class="hv-info-item__value">{{ roomDetail.vacancyStart }}</span>
                    </div>
                    <div class="hv-info-item">
                      <span class="hv-info-item__label">锁房期限</span>
                      <span class="hv-info-item__value">—</span>
                    </div>
                    <div class="hv-info-item">
                      <span class="hv-info-item__label">锁房备注</span>
                      <span class="hv-info-item__value">—</span>
                    </div>
                  </div>
                </div>

                <div class="hv-section">
                  <div class="hv-section__head">
                    <span class="hv-section__title">房间配置</span>
                    <el-button size="small" link type="primary">
                      <el-icon><View /></el-icon>
                      查看物资明细
                    </el-button>
                  </div>
                  <div class="hv-empty">暂无配置信息</div>
                </div>
              </template>
            </div>
          </div>
        </main>

        <!-- ③ 右侧：租客 / 预定 / 备注 -->
        <aside class="hv-panel">
          <!-- 租客信息 -->
          <div class="hv-panel-sec">
            <div class="hv-panel-sec__head">
              <div class="hv-panel-sec__icon hv-panel-sec__icon--tenant">
                <el-icon :size="13"><User /></el-icon>
              </div>
              <span class="hv-panel-sec__title">租客信息</span>
              <div class="hv-panel-sec__actions">
                <template v-if="roomStatusInfo.isLeased">
                  <el-button size="small" link type="danger" @click="handleCheckout">退租</el-button>
                  <el-button size="small" link type="primary" @click="handleRenew">续签</el-button>
                </template>
                <el-button v-if="!roomStatusInfo.isLeased && !roomStatusInfo.isBooked" size="small" type="primary" plain @click="emit('tenant', currentRoom)">录入租客</el-button>
              </div>
            </div>
            <div class="hv-panel-sec__body">
              <!-- 租客卡片 -->
              <template v-if="tenantInfo">
                <div class="hv-tenant-card" @click="emit('openTenantDetail', currentRoom?.leaseInfo?.tenantId || '', currentRoom?.leaseInfo?.leaseId || '')">
                  <div class="hv-tenant-card__top">
                    <div class="hv-tenant-card__avatar">{{ tenantInfo.name.slice(0, 1) }}</div>
                    <div class="hv-tenant-card__info">
                      <div class="hv-tenant-card__name">
                        {{ tenantInfo.name }}
                        <span class="hv-tenant-card__phone">{{ tenantInfo.phone }}</span>
                      </div>
                      <div class="hv-tenant-card__rent">
                        月租
                        <strong>{{ tenantInfo.rentPrice }}</strong>
                        元
                        <span v-if="tenantInfo.duration" class="hv-tenant-card__duration">{{ tenantInfo.duration }}</span>
                      </div>
                    </div>
                    <el-icon class="hv-tenant-card__arrow"><ArrowRight /></el-icon>
                  </div>

                  <!-- 租约进度条 -->
                  <div class="hv-lease-timeline">
                    <div class="hv-lease-timeline__dates">
                      <span>{{ tenantInfo.leaseStart }}</span>
                      <span>{{ tenantInfo.leaseEnd }}</span>
                    </div>
                    <div class="hv-lease-timeline__track">
                      <div class="hv-lease-timeline__fill" :style="{ width: tenantInfo.progress + '%' }" />
                      <div class="hv-lease-timeline__thumb" :style="{ left: tenantInfo.progress + '%' }" />
                    </div>
                    <div class="hv-lease-timeline__progress">已入住 {{ tenantInfo.progress }}%</div>
                  </div>
                </div>

                <!-- 合同操作 -->
                <div class="hv-tenant-actions">
                  <el-button size="small" plain @click="emit('viewContract', currentRoom!)">
                    <el-icon><View /></el-icon>
                    查看合同
                  </el-button>
                </div>
              </template>

              <div v-else class="hv-panel-empty">
                <div class="hv-panel-empty__icon">
                  <el-icon :size="22"><User /></el-icon>
                </div>
                <span class="hv-panel-empty__text">暂无在租租客</span>
              </div>
            </div>
          </div>

          <!-- 预定信息 -->
          <div class="hv-panel-sec">
            <div class="hv-panel-sec__head">
              <div class="hv-panel-sec__icon hv-panel-sec__icon--booking">
                <el-icon :size="13"><Calendar /></el-icon>
              </div>
              <span class="hv-panel-sec__title">预定信息</span>
              <div class="hv-panel-sec__actions">
                <el-button size="small" type="warning" plain @click="emit('booking', currentRoom)">添加预定</el-button>
              </div>
            </div>
            <div class="hv-panel-sec__body">
              <template v-if="bookingInfo">
                <div class="hv-booking-card" @click="emit('openBookingDetail', bookingInfo.id || '')">
                  <div class="hv-booking-card__avatar">{{ (bookingInfo.tenantName || "?").slice(0, 1) }}</div>
                  <div class="hv-booking-card__info">
                    <div class="hv-booking-card__name">{{ bookingInfo.tenantName || "-" }}</div>
                    <div class="hv-booking-card__dates">
                      <el-icon :size="11"><Calendar /></el-icon>
                      {{ formatDate(bookingInfo.bookingTime) }} — {{ formatDate(bookingInfo.expiryTime) }}
                    </div>
                  </div>
                  <el-icon class="hv-booking-card__arrow"><ArrowRight /></el-icon>
                </div>
              </template>
              <div v-else class="hv-panel-empty">
                <div class="hv-panel-empty__icon">
                  <el-icon :size="22"><Calendar /></el-icon>
                </div>
                <span class="hv-panel-empty__text">暂无预定记录</span>
              </div>
            </div>
          </div>

          <!-- 房间备注 -->
          <div class="hv-panel-sec hv-panel-sec--flex">
            <div class="hv-panel-sec__head">
              <div class="hv-panel-sec__icon hv-panel-sec__icon--note">
                <el-icon :size="13"><Edit /></el-icon>
              </div>
              <span class="hv-panel-sec__title">房间备注</span>
              <div class="hv-panel-sec__actions">
                <template v-if="remarkEditing">
                  <el-button
                    size="small"
                    link
                    @click="
                      remarkEditing = false;
                      remarkText = (currentRoom as any)?.remark ?? '';
                    "
                  >
                    取消
                  </el-button>
                  <el-button size="small" type="primary" link :loading="remarkLoading" @click="handleSaveRemark">保存</el-button>
                </template>
                <el-button v-else size="small" link type="primary" @click="remarkEditing = true">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
              </div>
            </div>
            <div class="hv-panel-sec__body">
              <template v-if="remarkEditing">
                <el-input v-model="remarkText" type="textarea" :rows="4" placeholder="请输入房间备注..." resize="none" class="hv-remark-input" />
              </template>
              <template v-else>
                <p v-if="remarkText" class="hv-panel-remark">{{ remarkText }}</p>
                <div v-else class="hv-panel-empty hv-panel-empty--inline">
                  <span>暂无备注，</span>
                  <span class="hv-panel-empty__link" @click="remarkEditing = true">点击添加</span>
                </div>
              </template>
            </div>
          </div>
        </aside>
      </div>
    </template>

    <!-- 加载失败 -->
    <div v-else class="hv-empty-state">
      <el-icon :size="52" color="var(--el-text-color-placeholder)"><House /></el-icon>
      <p>房源数据加载失败，请关闭后重试</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
  /* ======================== 全局容器 ======================== */
  .hv {
    display: flex;
    flex-direction: column;
    height: 100%;
    font-size: 13px;
    color: var(--el-text-color-primary);
    background: var(--el-bg-color-page);
    overflow: hidden;
  }

  /* ======================== 骨架屏 ======================== */
  .hv-loading {
    flex: 1;
    overflow: hidden;
  }

  .hv-skeleton-wrap {
    display: grid;
    grid-template-columns: 220px 1fr 260px;
    height: 100%;
    gap: 0;
  }

  .hv-skeleton-left,
  .hv-skeleton-main,
  .hv-skeleton-panel {
    border-right: 1px solid var(--el-border-color-extra-light);
    overflow: hidden;

    &:last-child {
      border-right: none;
    }
  }

  /* ======================== 三栏布局 ======================== */
  .hv-layout {
    display: grid;
    grid-template-columns: 220px 1fr 272px;
    height: 100%;
    overflow: hidden;
  }

  /* ======================== 左侧栏 ======================== */
  .hv-aside {
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--el-border-color) transparent;
  }

  /* 英雄图片区 */
  .hv-hero {
    position: relative;
    height: 170px;
    flex-shrink: 0;
    background: var(--el-fill-color);
    overflow: hidden;

    &__img {
      width: 100%;
      height: 100%;
      display: block;

      :deep(img) {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.4s ease;
      }

      &:hover :deep(img) {
        transform: scale(1.03);
      }
    }

    &__empty {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: var(--el-text-color-placeholder);
      font-size: 12px;
    }

    &__overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0) 50%);
      pointer-events: none;
    }

    &__count {
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      color: #fff;
      border-radius: 20px;
      padding: 2px 9px;
      font-size: 11px;
      display: flex;
      align-items: center;
      gap: 3px;
    }

    &__caption {
      position: absolute;
      bottom: 10px;
      left: 12px;
      right: 36px;
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 4px;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  /* 入住统计横条 */
  .hv-occ-bar {
    display: flex;
    align-items: center;
    border-radius: 8px;
    border: 1px solid var(--el-border-color-extra-light);
    overflow: hidden;

    &__item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1px;
      padding: 8px 4px;

      &--leased .hv-occ-bar__num {
        color: #67c23a;
      }
      &--available .hv-occ-bar__num {
        color: #f56c6c;
      }
      &--booked .hv-occ-bar__num {
        color: #e6a23c;
      }
    }

    &__divider {
      width: 1px;
      height: 28px;
      background: var(--el-border-color-extra-light);
      flex-shrink: 0;
    }

    &__num {
      font-size: 18px;
      font-weight: 700;
      line-height: 1.2;
      color: var(--el-text-color-primary);
    }

    &__label {
      font-size: 10px;
      color: var(--el-text-color-placeholder);
    }
  }

  /* 左侧 body */
  .hv-aside__body {
    flex: 1;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* KV 属性网格 */
  .hv-kv-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border: 1px solid var(--el-border-color-extra-light);
    border-radius: 8px;
    overflow: hidden;
  }

  .hv-kv {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 7px 10px;
    border-right: 1px solid var(--el-border-color-extra-light);
    border-bottom: 1px solid var(--el-border-color-extra-light);
    transition: background 0.15s;

    &:nth-child(2n) {
      border-right: none;
    }
    &:nth-last-child(-n + 2) {
      border-bottom: none;
    }

    &__label {
      font-size: 10px;
      color: var(--el-text-color-placeholder);
      line-height: 1.3;
    }

    &__value {
      font-size: 12px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      line-height: 1.4;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  /* 负责人 */
  .hv-salesman {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 11px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;

    &__avatar {
      width: 34px;
      height: 34px;
      min-width: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--el-color-primary-light-5), var(--el-color-primary-light-3));
      color: #fff;
      font-size: 15px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &__info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    &__name {
      font-size: 13px;
      font-weight: 600;
    }

    &__role {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
    }
  }

  /* 备注 */
  .hv-aside__remark {
    background: var(--el-fill-color-lighter);
    border-radius: 6px;
    padding: 9px 11px;
    display: flex;
    flex-direction: column;
    gap: 4px;

    &-label {
      font-size: 10px;
      color: var(--el-text-color-placeholder);
    }

    &-text {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      line-height: 1.6;
    }
  }

  .hv-aside__edit-btn {
    width: 100%;
    justify-content: center;
    margin-top: auto;
  }

  /* ======================== 中间主区域 ======================== */
  .hv-main {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--el-bg-color-page);
  }

  /* 房间选择器 */
  .hv-room-selector {
    flex-shrink: 0;
    padding: 12px 16px 10px;
    background: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-lighter);

    &__header {
      display: flex;
      align-items: baseline;
      gap: 6px;
      margin-bottom: 10px;
    }

    &__title {
      font-size: 13px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    &__sub {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
    }
  }

  .hv-room-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
  }

  /* 房间卡片 */
  .hv-rcard {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 8px 10px 6px;
    border-radius: 8px;
    cursor: pointer;
    border: 1.5px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
    transition: all 0.16s;
    min-width: 56px;
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      border-radius: 0 0 2px 2px;
      background: transparent;
      transition: background 0.16s;
    }

    &__num {
      font-size: 15px;
      font-weight: 700;
      line-height: 1;
      color: var(--el-text-color-primary);
    }

    &__status {
      font-size: 10px;
      color: var(--el-text-color-placeholder);
    }

    &__dot {
      position: absolute;
      top: 7px;
      right: 7px;
      width: 5px;
      height: 5px;
      border-radius: 50%;
    }

    &:hover {
      border-color: var(--el-color-primary-light-5);
      background: var(--el-color-primary-light-9);
    }

    &.is-active {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.15);

      .hv-rcard__num {
        color: var(--el-color-primary);
      }
      .hv-rcard__status {
        color: var(--el-color-primary);
        font-weight: 500;
      }

      &::before {
        background: var(--el-color-primary);
      }
    }

    &.is-leased.is-active::before {
      background: #67c23a;
    }
    &.is-available.is-active::before {
      background: #f56c6c;
    }
    &.is-booked.is-active::before {
      background: #e6a23c;
    }

    &--add {
      border-style: dashed;
      color: var(--el-text-color-placeholder);
      .hv-rcard__status {
        font-size: 10px;
      }
    }
  }

  /* 价格状态条 */
  .hv-price-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    height: 48px;
    flex-shrink: 0;
    border-bottom: 1px solid var(--el-border-color-extra-light);
    background: var(--el-bg-color);
    gap: 12px;

    &.is-leased {
      background: linear-gradient(90deg, rgba(103, 194, 58, 0.06) 0%, transparent 60%);
      .hv-price-bar__status-dot {
        background: #67c23a;
      }
      .hv-price-bar__status-text {
        color: #67c23a;
      }
    }

    &.is-available {
      background: linear-gradient(90deg, rgba(245, 108, 108, 0.06) 0%, transparent 60%);
      .hv-price-bar__status-dot {
        background: #f56c6c;
      }
      .hv-price-bar__status-text {
        color: #f56c6c;
      }
    }

    &.is-booked {
      background: linear-gradient(90deg, rgba(230, 162, 60, 0.06) 0%, transparent 60%);
      .hv-price-bar__status-dot {
        background: #e6a23c;
      }
      .hv-price-bar__status-text {
        color: #e6a23c;
      }
    }

    &__left {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow: hidden;
    }

    &__status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--el-text-color-placeholder);
      flex-shrink: 0;
      animation: pulse 2s infinite;
    }

    &__status-text {
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
    }

    &__sep {
      width: 1px;
      height: 16px;
      background: var(--el-border-color-extra-light);
      flex-shrink: 0;
    }

    &__amount {
      font-size: 22px;
      font-weight: 700;
      color: var(--el-color-success);
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }

    &__unit {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
      flex-shrink: 0;
    }

    &__floor {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
      flex-shrink: 0;
      padding-left: 4px;

      strong {
        color: var(--el-text-color-secondary);
        font-weight: 600;
      }
    }

    &__right {
      flex-shrink: 0;
    }

    &__edit-btn {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid var(--el-border-color-lighter);
      background: var(--el-bg-color);
      color: var(--el-text-color-secondary);
      font-size: 11px;
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        color: var(--el-color-primary);
        border-color: var(--el-color-primary-light-5);
        background: var(--el-color-primary-light-9);
      }
    }
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }

  /* 详情内容区 */
  .hv-detail {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--el-bg-color-page);
  }

  /* Tab 导航 */
  .hv-tabs {
    display: flex;
    position: relative;
    background: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-lighter);
    flex-shrink: 0;
    padding: 0 4px;
  }

  .hv-tab {
    flex: 0 0 auto;
    padding: 0 20px;
    height: 40px;
    display: flex;
    align-items: center;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    background: transparent;
    border: none;
    cursor: pointer;
    position: relative;
    transition: color 0.2s;

    &.active {
      color: var(--el-color-primary);
      font-weight: 600;
    }

    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 20px;
      right: 20px;
      height: 2px;
      border-radius: 2px 2px 0 0;
      background: var(--el-color-primary);
      transform: scaleX(0);
      transition: transform 0.2s;
    }

    &.active::after {
      transform: scaleX(1);
    }
  }

  .hv-tab-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    scrollbar-width: thin;
    scrollbar-color: var(--el-border-color) transparent;
  }

  /* 区块 */
  .hv-section {
    &__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    &__title {
      font-size: 13px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      display: flex;
      align-items: center;
      gap: 6px;

      &::before {
        content: "";
        display: block;
        width: 3px;
        height: 13px;
        border-radius: 2px;
        background: var(--el-color-primary);
      }
    }
  }

  /* 价格卡片组 */
  .hv-price-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .hv-price-card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 14px;
    border: 1px solid var(--el-border-color-extra-light);
    border-radius: 8px;
    background: var(--el-bg-color);

    &--primary {
      border-color: var(--el-color-success-light-5);
      background: rgba(103, 194, 58, 0.04);
    }

    &__label {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
    }

    &__value {
      font-size: 18px;
      font-weight: 700;
      color: var(--el-text-color-primary);
      line-height: 1.2;

      em {
        font-size: 11px;
        font-weight: 400;
        font-style: normal;
        color: var(--el-text-color-placeholder);
        margin-left: 2px;
      }
    }

    &--primary &__value {
      color: var(--el-color-success);
    }
  }

  /* 费用列表 */
  .hv-fee-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .hv-fee-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: var(--el-fill-color-lighter);
    border-radius: 6px;
    font-size: 12px;

    &__name {
      flex: 1;
      font-weight: 500;
    }

    &__amount {
      color: var(--el-color-danger);
      font-weight: 600;
    }

    &__method {
      color: var(--el-text-color-placeholder);
      font-size: 11px;
    }
  }

  /* 方案表格 */
  .hv-table {
    border: 1px solid var(--el-border-color-extra-light);
    border-radius: 8px;
    overflow: hidden;
    font-size: 12px;

    &__head,
    &__row {
      display: grid;
      grid-template-columns: 2fr 1fr 1.2fr 1fr;
      padding: 8px 12px;
      gap: 8px;
    }

    &__head {
      background: var(--el-fill-color-lighter);
      color: var(--el-text-color-placeholder);
      font-size: 11px;
      font-weight: 500;
    }

    &__row {
      border-top: 1px solid var(--el-border-color-extra-light);
      align-items: center;
    }

    &__price {
      color: var(--el-color-success);
      font-weight: 600;
    }
  }

  /* 信息网格 */
  .hv-info-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border: 1px solid var(--el-border-color-extra-light);
    border-radius: 8px;
    overflow: hidden;
  }

  .hv-info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 11px 13px;
    border-right: 1px solid var(--el-border-color-extra-light);
    border-bottom: 1px solid var(--el-border-color-extra-light);

    &:nth-child(4n) {
      border-right: none;
    }
    &:nth-last-child(-n + 4) {
      border-bottom: none;
    }

    &__label {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
    }

    &__value {
      font-size: 13px;
      font-weight: 500;
    }
  }

  /* 空状态 */
  .hv-empty {
    padding: 14px 0;
    text-align: center;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }

  /* ======================== 右侧面板 ======================== */
  .hv-panel {
    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--el-border-color) transparent;
  }

  .hv-panel-sec {
    border-bottom: 1px solid var(--el-border-color-extra-light);

    &--flex {
      flex: 1;
    }

    &__head {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 11px 14px 8px;
    }

    &__icon {
      width: 26px;
      height: 26px;
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &--tenant {
        background: rgba(103, 194, 58, 0.1);
        color: #67c23a;
      }

      &--booking {
        background: rgba(230, 162, 60, 0.1);
        color: #e6a23c;
      }

      &--note {
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
      }
    }

    &__title {
      font-size: 13px;
      font-weight: 600;
      flex: 1;
    }

    &__actions {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }

    &__body {
      padding: 0 14px 13px;
    }
  }

  /* 租客卡片 */
  .hv-tenant-card {
    padding: 10px;
    border-radius: 10px;
    background: var(--el-fill-color-lighter);
    cursor: pointer;
    transition: background 0.15s;
    display: flex;
    flex-direction: column;
    gap: 10px;

    &:hover {
      background: var(--el-fill-color);
    }

    &__top {
      display: flex;
      align-items: flex-start;
      gap: 9px;
    }

    &__avatar {
      width: 38px;
      height: 38px;
      min-width: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--el-color-primary-light-5), var(--el-color-primary-light-3));
      color: #fff;
      font-size: 17px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &__info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    &__name {
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    &__phone {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
      font-weight: 400;
    }

    &__rent {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      display: flex;
      align-items: center;
      gap: 4px;

      strong {
        color: var(--el-color-success);
        font-size: 16px;
        font-weight: 700;
      }
    }

    &__duration {
      font-size: 10px;
      color: var(--el-color-primary);
      font-weight: 500;
      background: var(--el-color-primary-light-9);
      padding: 1px 6px;
      border-radius: 8px;
      white-space: nowrap;
    }

    &__arrow {
      color: var(--el-text-color-placeholder);
      flex-shrink: 0;
      margin-top: 2px;
    }
  }

  /* 租约时间轴 */
  .hv-lease-timeline {
    display: flex;
    flex-direction: column;
    gap: 5px;

    &__dates {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: var(--el-text-color-placeholder);
    }

    &__track {
      position: relative;
      height: 6px;
      background: var(--el-fill-color);
      border-radius: 4px;
      overflow: visible;
    }

    &__fill {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: linear-gradient(90deg, var(--el-color-primary-light-3), var(--el-color-primary));
      border-radius: 4px;
      transition: width 0.6s ease;
    }

    &__thumb {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--el-color-primary);
      border: 2px solid #fff;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
      transition: left 0.6s ease;
    }

    &__progress {
      font-size: 10px;
      color: var(--el-color-primary);
      font-weight: 500;
      text-align: right;
    }
  }

  /* 租客操作按钮行 */
  .hv-tenant-actions {
    display: flex;
    gap: 6px;
    margin-top: 8px;
    justify-content: flex-end;
  }

  /* 预定卡片 */
  .hv-booking-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border-radius: 10px;
    background: var(--el-fill-color-lighter);
    cursor: pointer;
    transition: background 0.15s;

    &:hover {
      background: var(--el-fill-color);
    }

    &__avatar {
      width: 34px;
      height: 34px;
      min-width: 34px;
      border-radius: 50%;
      background: rgba(230, 162, 60, 0.15);
      color: #e6a23c;
      font-size: 15px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    &__info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    &__name {
      font-size: 13px;
      font-weight: 600;
    }

    &__dates {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
      display: flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__arrow {
      color: var(--el-text-color-placeholder);
      flex-shrink: 0;
    }
  }

  /* 面板空状态 */
  .hv-panel-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 18px 0;
    color: var(--el-text-color-placeholder);

    &__icon {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--el-fill-color-lighter);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &__text {
      font-size: 12px;
    }

    &--inline {
      flex-direction: row;
      padding: 4px 0;
      justify-content: flex-start;
      font-size: 12px;
    }

    &__link {
      color: var(--el-color-primary);
      cursor: pointer;
      &:hover {
        text-decoration: underline;
      }
    }
  }

  /* 备注 */
  .hv-panel-remark {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.7;
    margin: 0;
  }

  .hv-remark-input {
    :deep(.el-textarea__inner) {
      font-size: 12px;
      line-height: 1.7;
    }
  }

  /* ======================== 全局空/错误状态 ======================== */
  .hv-empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: var(--el-text-color-placeholder);
    font-size: 14px;

    p {
      margin: 0;
    }
  }

  /* ======================== 响应式 ======================== */
  @media (width <= 1280px) {
    .hv-layout {
      grid-template-columns: 200px 1fr 256px;
    }
    .hv-skeleton-wrap {
      grid-template-columns: 200px 1fr 256px;
    }
  }

  @media (width <= 1080px) {
    .hv-layout {
      grid-template-columns: 1fr 256px;
    }
    .hv-skeleton-wrap {
      grid-template-columns: 1fr 256px;
    }
    .hv-aside {
      display: none;
    }
  }

  @media (width <= 880px) {
    .hv-layout {
      grid-template-columns: 1fr;
    }
    .hv-skeleton-wrap {
      grid-template-columns: 1fr;
    }
    .hv-panel {
      display: none;
    }
  }
</style>
