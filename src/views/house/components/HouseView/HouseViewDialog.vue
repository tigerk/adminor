<script setup lang="ts">
  import { computed, ref, watch } from "vue";
  import { BookingListVo, HouseDetailVo, PriceConfigDto, PriceMethodEnum, RoomDetailVo, RoomTrackVo } from "@/types";
  import { getOptionByCode, LEASE_STATUS_ENUM, LEAST_STATUS_OPTIONS, ROOM_STATUS_ENUM } from "@/constants";
  import { ArrowRight, Calendar, Edit, House, Location, Plus, User, View } from "@element-plus/icons-vue";
  import { usePriceConfigEdit } from "@/views/house/components/PriceConfig/hook";
  import { addRoomTrack, getRoomPriceConfig, saveRoomPriceConfig } from "@/api/house/room";
  import { message } from "@/utils/message";
  import { getDecorationLabel, getDirectionLabel, getElectricityTypeLabel, getRentalTypeLabel, getWaterTypeLabel } from "@/utils/house";
  import { formatDate } from "@/utils/date";

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
    renewLease: [room: RoomDetailVo];
    addRoom: [];
    reload: [];
  }>();

  // ── 工具 ──────────────────────────────────────────
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

  // ── 房源级信息 ────────────────────────────────────
  const isShareRental = computed(() => props.detail?.rentalType === 2);

  const houseMeta = computed(() => {
    const d = props.detail;
    return {
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

  // ── 房间列表 & 选中 ────────────────────────────────
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

  // ── 图片 ──────────────────────────────────────────
  const allImages = computed(() => {
    const set = new Set<string>();
    props.detail?.houseLayout?.imageList?.forEach(i => i && set.add(i));
    currentRoom.value?.imageList?.forEach(i => i && set.add(i));
    set.delete("");
    return [...set];
  });

  // ── 房间状态 ──────────────────────────────────────
  const STATUS_MAP: Record<number, { text: string; cls: string; color: string }> = {
    [ROOM_STATUS_ENUM.LEASED.code]: { text: "已租", cls: "leased", color: "#16a34a" },
    [ROOM_STATUS_ENUM.AVAILABLE.code]: { text: "空置", cls: "available", color: "#dc2626" },
    [ROOM_STATUS_ENUM.BOOKED.code]: { text: "已预定", cls: "booked", color: "#d97706" },
    [ROOM_STATUS_ENUM.LOCKED.code]: { text: "锁房", cls: "locked", color: "#64748b" }
  };
  const getRoomStatus = (room: RoomDetailVo) => STATUS_MAP[room.roomStatus!] ?? { text: "-", cls: "locked", color: "#64748b" };

  const currentStatus = computed(() => getRoomStatus(currentRoom.value!));
  const isLeased = computed(() => currentRoom.value?.roomStatus === ROOM_STATUS_ENUM.LEASED.code);
  const isAvailable = computed(() => currentRoom.value?.roomStatus === ROOM_STATUS_ENUM.AVAILABLE.code);
  const isBooked = computed(() => currentRoom.value?.roomStatus === ROOM_STATUS_ENUM.BOOKED.code);

  // ── 出租统计 ──────────────────────────────────────
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

  // ── 租客 & 预定信息 ───────────────────────────────
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

  // ── 房间详情 Tab ──────────────────────────────────
  const activeDetailTab = ref<"room" | "rent" | "track">("room");

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

  // ── 租金配置 ──────────────────────────────────────
  const { openPriceConfigDialog } = usePriceConfigEdit();
  const priceConfig = ref<PriceConfigDto | null>(null);

  const loadPriceConfig = async (force = false) => {
    const roomId = currentRoom.value?.id;
    if (!roomId) return;

    // force=true 时跳过缓存，直接请求接口
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

  // 改后 - 包一层，不传任何参数，force 使用默认值 false
  watch(
    () => {
      return currentRoom.value;
    },
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
          loadPriceConfig(true).then(() => {
            // emit("priceConfigChange", priceConfig.value);
          });
        } else message(res.message || "保存失败", { type: "error" });
      } catch {
        message("保存租金配置失败", { type: "error" });
      }
    });
  };

  const payMethodLabel = (m?: number) => {
    const map: Record<number, string> = { 0: "随房租付", 1: "一次性", 2: "月付", 4: "季付", 5: "半年付", 6: "年付" };
    return m !== undefined ? (map[m] ?? "其他") : "";
  };

  // ── 操作 ──────────────────────────────────────────
  const handleCheckout = () => {
    if (!currentRoom.value?.lease) return message("当前房间没有在租租客", { type: "warning" });
    emit("checkout", currentRoom.value!);
  };
  const handleRenew = () => {
    if (!currentRoom.value?.lease) return message("当前房间没有在租租客", { type: "warning" });
    emit("renewLease", currentRoom.value!);
  };

  // ── 房间备注 ──────────────────────────────────────
  const remarkEditing = ref(false);
  const remarkText = ref("");
  const remarkLoading = ref(false);
  watch(
    () => currentRoom.value,
    r => {
      remarkText.value = r?.remark ?? "";
      remarkEditing.value = false;
    },
    { immediate: true }
  );

  const handleSaveRemark = async () => {
    remarkLoading.value = true;
    try {
      await new Promise(r => setTimeout(r, 600));
      message("备注保存成功", { type: "success" });
      remarkEditing.value = false;
    } catch {
      message("备注保存失败", { type: "error" });
    } finally {
      remarkLoading.value = false;
    }
  };

  // ── 跟进记录 ──────────────────────────────────────
  // 本地追加的记录（不触发整体 reload），与后端返回的 roomTracks 合并展示
  const localTrackRecords = ref<RoomTrackVo[]>([]);
  const trackRecords = computed<RoomTrackVo[]>(() => [...localTrackRecords.value, ...(currentRoom.value?.roomTracks ?? [])]);
  const trackInput = ref("");
  const trackLoading = ref(false);
  // 切换房间时清空本地追加列表和输入框
  watch(
    () => currentRoom.value?.id,
    () => {
      localTrackRecords.value = [];
      trackInput.value = "";
    },
    { immediate: true }
  );

  const handleAddTrack = async () => {
    if (!trackInput.value.trim()) return message("请输入跟进内容", { type: "warning" });
    const roomId = currentRoom.value?.id;
    if (!roomId) return message("房间ID缺失", { type: "warning" });
    const content = trackInput.value.trim();
    trackLoading.value = true;
    try {
      const res = await addRoomTrack({ roomId, trackContent: content });
      if (res.code === 0) {
        // 本地即时插入，不刷新整个弹窗
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
        trackInput.value = "";
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
    <!-- ══════════════ Loading ══════════════ -->
    <div v-if="loading" class="hv-loading">
      <div class="hv-sk hv-sk--left">
        <div class="hv-sk__img" />
        <div class="hv-sk__lines">
          <div class="hv-sk__line hv-sk__line--w50 hv-sk__line--h16" />
          <div class="hv-sk__line hv-sk__line--w80" />
          <div class="hv-sk__line hv-sk__line--w60" />
        </div>
        <div class="hv-sk__grid">
          <div v-for="i in 6" :key="i" class="hv-sk__cell" />
        </div>
        <div class="hv-sk__lines">
          <div v-for="i in 4" :key="i" class="hv-sk__line" />
        </div>
      </div>
      <div class="hv-sk hv-sk--main">
        <div class="hv-sk__bar" />
        <div class="hv-sk__lines" style="padding: 20px; gap: 14px">
          <div v-for="i in 6" :key="i" class="hv-sk__line" :style="{ width: 40 + i * 9 + '%' }" />
        </div>
      </div>
      <div class="hv-sk hv-sk--right">
        <div class="hv-sk__card" />
        <div class="hv-sk__card" />
        <div class="hv-sk__card hv-sk__card--lg" />
      </div>
    </div>

    <!-- ══════════════ 主体三栏 ══════════════ -->
    <template v-else-if="detail">
      <!-- ▌全局顶部：仿截图样式 -->
      <div class="hv-topbar">
        <!-- 最左侧：房源概要（类型 + 出租统计） -->
        <div class="hv-topbar__summary">
          <div class="hv-topbar__summary-type">{{ houseMeta.rentalType }}</div>
          <div class="hv-topbar__summary-stat">已租 {{ roomStats.leased }} 间 / 共 {{ roomStats.total }} 间</div>
        </div>

        <!-- 房间卡片列表 -->
        <div class="hv-topbar__rooms">
          <button
            v-for="(room, idx) in roomTabs"
            :key="room.id || idx"
            class="hv-troom"
            :class="[`hv-troom--${getRoomStatus(room).cls}`, { 'is-active': activeRoomIndex === idx }]"
            @click="activeRoomIndex = idx"
          >
            <!-- 左：房间号 + 状态 -->
            <div class="hv-troom__left">
              <span class="hv-troom__num">{{ room.roomNumber || String.fromCharCode(65 + idx) }}</span>
              <span class="hv-troom__status" :class="`hv-troom__status--${getRoomStatus(room).cls}`">
                {{ getRoomStatus(room).text }}
              </span>
            </div>
            <!-- 竖线分隔 -->
            <div class="hv-troom__divider" />
            <!-- 右：租客/预定/空置信息（固定宽） -->
            <div class="hv-troom__right">
              <template v-if="room.lease?.tenantName">
                <span class="hv-troom__info-line hv-troom__info-line--tenant">♂ {{ room.lease.tenantName }}</span>
                <span class="hv-troom__info-line">✭ 押 {{ room.lease.depositMonths ?? 1 }} 付 {{ room.lease.paymentMonths }}</span>
              </template>
              <template v-else-if="room.booking?.tenantName">
                <span class="hv-troom__info-line hv-troom__info-line--booking">
                  {{ room.booking.tenantName }}
                </span>
                <span class="hv-troom__info-line hv-troom__info-line✭--date">{{ formatDate(room.booking.expiryTime) }}到期</span>
              </template>
              <template v-else>
                <span class="hv-troom__info-line hv-troom__info-line--empty">待登记租客</span>
              </template>
            </div>
          </button>
          <button v-if="isShareRental" class="hv-troom hv-troom--add" @click="emit('addRoom')">
            <el-icon :size="14"><Plus /></el-icon>
            <span>添加房间</span>
          </button>
        </div>

        <!-- 右侧：出租率（原始样式） -->
        <div class="hv-topbar__occ">
          <div class="hv-occ">
            <div class="hv-occ__head">
              <span class="hv-occ__label">出租率</span>
              <span class="hv-occ__pct">{{ occupancyRate }}%</span>
            </div>
            <div class="hv-occ__track">
              <div class="hv-occ__fill hv-occ__fill--leased" :style="{ width: roomStats.total ? (roomStats.leased / roomStats.total) * 100 + '%' : '0' }" />
              <div class="hv-occ__fill hv-occ__fill--booked" :style="{ width: roomStats.total ? (roomStats.booked / roomStats.total) * 100 + '%' : '0' }" />
            </div>
            <div class="hv-occ__legend">
              <span>
                <i class="hv-dot hv-dot--leased" />
                已租 {{ roomStats.leased }}
              </span>
              <span>
                <i class="hv-dot hv-dot--booked" />
                预定 {{ roomStats.booked }}
              </span>
              <span>
                <i class="hv-dot hv-dot--available" />
                空置 {{ roomStats.available }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="hv-layout">
        <!-- ██████ 左侧：房源档案 + 房间导航 ██████ -->
        <aside class="hv-aside">
          <!-- 封面图 -->
          <div class="hv-cover">
            <el-image v-if="allImages.length" :src="allImages[0]" fit="cover" :preview-src-list="allImages" :preview-teleported="true" :initial-index="0" class="hv-cover__img" />
            <div v-else class="hv-cover__empty">
              <el-icon :size="28"><House /></el-icon>
              <span>暂无图片</span>
            </div>
            <div v-if="allImages.length" class="hv-cover__footer">
              <el-icon :size="11"><View /></el-icon>
              {{ allImages.length }} 张图片
            </div>
          </div>

          <!-- 基本档案 -->
          <div class="hv-aside__body">
            <!-- 房源名 + 编辑 -->
            <div class="hv-aside__title-row">
              <div class="hv-aside__title">
                <el-icon class="hv-aside__loc-icon"><Location /></el-icon>
                {{ houseMeta.communityName }}
              </div>
              <el-button size="small" link type="primary" @click="emit('editHouse', detail!)">
                <el-icon><Edit /></el-icon>
              </el-button>
            </div>
            <!-- 属性 chips -->
            <div class="hv-chips">
              <span class="hv-chip hv-chip--blue">{{ houseMeta.rentalType }}</span>
              <span class="hv-chip">{{ houseMeta.area }} m²</span>
              <span class="hv-chip">{{ houseMeta.floor }}/{{ houseMeta.floorTotal }}层</span>
              <span class="hv-chip">{{ houseMeta.decoration }}</span>
              <span class="hv-chip" :class="houseMeta.hasElevator === '有' ? 'hv-chip--green' : ''">{{ houseMeta.hasElevator }}电梯</span>
              <span class="hv-chip" :class="houseMeta.hasGas === '有' ? 'hv-chip--green' : ''">{{ houseMeta.hasGas }}燃气</span>
            </div>

            <!-- 费用列：物业/水/电 -->
            <div class="hv-aside__costs">
              <div class="hv-cost-row">
                <span class="hv-cost-row__label">楼层</span>
                <span class="hv-cost-row__val">
                  {{ houseMeta.floor }}
                  <em>层</em>
                  <em>共</em>
                  {{ houseMeta.floorTotal }}
                  <em>层</em>
                </span>
              </div>
              <div class="hv-cost-row">
                <span class="hv-cost-row__label">电梯</span>
                <span class="hv-cost-row__val">
                  <span class="hv-chip" :class="houseMeta.hasElevator === '有' ? 'hv-chip--green' : ''">{{ houseMeta.hasElevator }}电梯</span>
                </span>
              </div>
              <div class="hv-cost-row">
                <span class="hv-cost-row__label">面积</span>
                <span class="hv-cost-row__val">
                  {{ houseMeta.area }}
                  <em>m²</em>
                </span>
              </div>
              <div class="hv-cost-row">
                <span class="hv-cost-row__label">装修</span>
                <span class="hv-cost-row__val">
                  {{ houseMeta.decoration }}
                </span>
              </div>
              <div class="hv-cost-row">
                <span class="hv-cost-row__label">物业费</span>
                <span class="hv-cost-row__val">
                  {{ houseMeta.propertyFee }}
                  <em>元/月</em>
                </span>
              </div>
              <div class="hv-cost-row">
                <span class="hv-cost-row__label">燃气</span>
                <span class="hv-cost-row__val">
                  <span class="hv-chip" :class="houseMeta.hasGas === '有' ? 'hv-chip--green' : ''">{{ houseMeta.hasGas }}燃气</span>
                </span>
              </div>

              <div class="hv-cost-row">
                <span class="hv-cost-row__label">水费</span>
                <span class="hv-cost-row__val">{{ getWaterTypeLabel(houseMeta.water) }}</span>
              </div>
              <div class="hv-cost-row">
                <span class="hv-cost-row__label">电费</span>
                <span class="hv-cost-row__val">{{ getElectricityTypeLabel(houseMeta.electricity) }}</span>
              </div>
            </div>

            <!-- 房源备注（有才展示） -->
            <div v-if="houseMeta.houseRemark" class="hv-aside__remark">
              <p>{{ houseMeta.houseRemark }}</p>
            </div>
          </div>

          <!-- 负责人：固定在左侧底部 -->
          <div class="hv-owner hv-owner--fixed">
            <div class="hv-owner__info">
              <div class="hv-owner__name">{{ detail?.salesman?.nickname || houseMeta.salesmanName }}</div>
              <div v-if="detail?.salesman?.phone" class="hv-owner__phone">{{ detail.salesman.phone }}</div>
            </div>
            <div class="hv-owner__dept-badge">{{ detail?.deptName || houseMeta.deptId }}</div>
          </div>
        </aside>

        <!-- ██████ 中间：当前房间详情 ██████ -->
        <main class="hv-main">
          <!-- 当前房间头部：名称 + 状态 + 价格 + 操作（唯一操作区） -->
          <div class="hv-room-header">
            <div class="hv-room-header__left">
              <h2 class="hv-room-header__name">
                {{ currentRoom?.roomNumber ? `${currentRoom.roomNumber} 号房间` : "房间详情" }}
              </h2>
              <span class="hv-badge" :class="`hv-badge--${currentStatus.cls}`">
                <span class="hv-badge__dot" />
                {{ currentStatus.text }}
              </span>
            </div>

            <!-- 价格（仅在这里显示一次） -->
            <div class="hv-room-header__price">
              <span class="hv-room-header__amount">{{ rentPrice }}</span>
              <span class="hv-room-header__unit">元/月</span>
              <button class="hv-room-header__price-edit" @click="handleOpenPriceConfig">
                <el-icon :size="11"><Edit /></el-icon>
                调价
              </button>
            </div>

            <!-- 操作按钮：2个主操作 -->
            <div class="hv-room-header__actions">
              <el-button size="small" @click="emit('editHouse', detail!)">修改房间</el-button>
              <el-button size="small" @click="activeDetailTab = 'track'">添加跟进</el-button>
            </div>
          </div>

          <!-- Tab 切换 -->
          <div class="hv-tabs">
            <button class="hv-tab" :class="{ 'is-active': activeDetailTab === 'room' }" @click="activeDetailTab = 'room'">房间信息</button>
            <button class="hv-tab" :class="{ 'is-active': activeDetailTab === 'rent' }" @click="activeDetailTab = 'rent'">租金配置</button>
            <button class="hv-tab" :class="{ 'is-active': activeDetailTab === 'track' }" @click="activeDetailTab = 'track'">跟进记录</button>
          </div>

          <!-- Tab 内容 -->
          <div class="hv-tab-body">
            <!-- ── 房间信息 ── -->
            <template v-if="activeDetailTab === 'room'">
              <div class="hv-section">
                <div class="hv-section__hd">
                  <span class="hv-section__title">基本信息</span>
                  <el-button size="small" link type="primary" @click="emit('editHouse', detail!)">
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-button>
                </div>
                <div class="hv-kv-grid">
                  <div class="hv-kv">
                    <span class="hv-kv__k">房间号</span>
                    <span class="hv-kv__v hv-kv__v--bold">{{ roomDetail.roomNumber }}</span>
                  </div>
                  <div class="hv-kv">
                    <span class="hv-kv__k">朝向</span>
                    <span class="hv-kv__v">{{ roomDetail.direction }}</span>
                  </div>
                  <div class="hv-kv">
                    <span class="hv-kv__k">套内面积</span>
                    <span class="hv-kv__v hv-kv__v--accent">{{ roomDetail.innerArea }}</span>
                  </div>
                  <div class="hv-kv">
                    <span class="hv-kv__k">楼层</span>
                    <span class="hv-kv__v">{{ roomDetail.floorInfo }}</span>
                  </div>
                  <div class="hv-kv">
                    <span class="hv-kv__k">首次可租</span>
                    <span class="hv-kv__v">{{ roomDetail.firstAvailDate }}</span>
                  </div>
                  <div class="hv-kv">
                    <span class="hv-kv__k">空置开始</span>
                    <span class="hv-kv__v">{{ roomDetail.vacancyStart }}</span>
                  </div>
                  <div class="hv-kv">
                    <span class="hv-kv__k">锁房期限</span>
                    <span class="hv-kv__v hv-kv__v--muted">—</span>
                  </div>
                  <div class="hv-kv">
                    <span class="hv-kv__k">锁房备注</span>
                    <span class="hv-kv__v hv-kv__v--muted">—</span>
                  </div>
                </div>
              </div>

              <div class="hv-section">
                <div class="hv-section__hd">
                  <span class="hv-section__title">房间配置</span>
                  <el-button size="small" link type="primary">
                    <el-icon><View /></el-icon>
                    物资明细
                  </el-button>
                </div>
                <div class="hv-empty-tip">
                  <span class="hv-empty-tip__ico">📦</span>
                  暂无配置信息
                </div>
              </div>

              <!-- 房间备注已移至右侧面板 -->
            </template>

            <!-- ── 租金配置 ── -->
            <template v-if="activeDetailTab === 'rent'">
              <div class="hv-section">
                <div class="hv-section__hd">
                  <span class="hv-section__title">租金明细</span>
                  <el-button size="small" link type="primary" @click="handleOpenPriceConfig">
                    <el-icon><Edit /></el-icon>
                    编辑配置
                  </el-button>
                </div>
                <div class="hv-price-trio">
                  <div class="hv-price-card hv-price-card--main">
                    <div class="hv-price-card__lbl">挂牌租金</div>
                    <div class="hv-price-card__val">
                      <strong>{{ rentPrice }}</strong>
                      <em>元/月</em>
                    </div>
                  </div>
                  <div class="hv-price-card">
                    <div class="hv-price-card__lbl">底价</div>
                    <div class="hv-price-card__val">
                      <template v-if="priceConfig?.floorPrice">
                        <strong class="hv-price-card__val--warn">{{ priceConfig.floorPrice }}</strong>
                        <em>元/月</em>
                      </template>
                      <span v-else class="hv-price-card__nil">未设置</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="hv-section">
                <div class="hv-section__hd">
                  <span class="hv-section__title">其他费用</span>
                </div>
                <template v-if="priceConfig?.otherFees?.length">
                  <div class="hv-fee-list">
                    <div v-for="(fee, i) in priceConfig.otherFees" :key="i" class="hv-fee-row">
                      <span class="hv-fee-row__name">{{ fee.name || "-" }}</span>
                      <span class="hv-fee-row__amt">{{ fee.priceInput ?? "-" }}{{ fee.priceMethod === 2 ? "%" : "元" }}</span>
                      <el-tag size="small" effect="plain">{{ payMethodLabel(fee.paymentMethod) }}</el-tag>
                    </div>
                  </div>
                </template>
                <div v-else class="hv-empty-tip">
                  <span class="hv-empty-tip__ico">💳</span>
                  暂未配置其他费用
                </div>
              </div>

              <div class="hv-section">
                <div class="hv-section__hd">
                  <span class="hv-section__title">租金方案</span>
                  <el-button link size="small" type="primary" @click="handleOpenPriceConfig">查看 / 编辑</el-button>
                </div>
                <template v-if="priceConfig?.pricePlans?.length">
                  <div class="hv-plan-table">
                    <div class="hv-plan-table__head">
                      <span>租金方案</span>
                      <span>价格</span>
                      <span>比例</span>
                    </div>
                    <div v-for="(plan, i) in priceConfig.pricePlans" :key="i" class="hv-plan-table__row">
                      <span>{{ plan.planName || "-" }} {{ plan.defaultPlan ? "(默认)" : "" }}</span>
                      <span class="c-primary fw-600">{{ plan.price ?? "-" }} 元</span>
                      <span>{{ plan.priceRatio ? plan.priceRatio + "%" : "-" }}</span>
                    </div>
                  </div>
                </template>
                <div v-else class="hv-empty-tip">
                  <span class="hv-empty-tip__ico">📋</span>
                  暂无租金方案
                </div>
              </div>
            </template>

            <!-- ── 跟进记录 ── -->
            <template v-if="activeDetailTab === 'track'">
              <!-- 输入区 -->
              <div class="hv-track-compose">
                <div class="hv-track-compose__avatar">{{ houseMeta.salesmanName.slice(0, 1) }}</div>
                <div class="hv-track-compose__right">
                  <el-input v-model="trackInput" type="textarea" :rows="3" placeholder="记录跟进情况，支持描述客户意向、看房情况、沟通进展…" resize="none" />
                  <div class="hv-track-compose__footer">
                    <span class="hv-track-compose__hint">{{ trackInput.length }} 字</span>
                    <el-button type="primary" size="small" :loading="trackLoading" :disabled="!trackInput.trim()" @click="handleAddTrack">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 3px"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                      提交记录
                    </el-button>
                  </div>
                </div>
              </div>

              <!-- 时间轴列表 -->
              <div class="hv-timeline">
                <div v-if="!trackRecords.length" class="hv-timeline__empty">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" fill="currentColor" opacity=".2" />
                  </svg>
                  <p>暂无跟进记录</p>
                  <span>记录每一次跟进，把握租客意向</span>
                </div>
                <div v-for="(rec, idx) in trackRecords" :key="rec.id" class="hv-timeline__item">
                  <div v-if="idx < trackRecords.length - 1" class="hv-timeline__line" />
                  <div class="hv-timeline__dot" />
                  <div class="hv-timeline__card">
                    <div class="hv-timeline__meta">
                      <div class="hv-timeline__author-wrap">
                        <div class="hv-timeline__author-avatar">{{ (rec.updateByName || rec.updateBy || "?").slice(0, 1) }}</div>
                        <span class="hv-timeline__author">{{ rec.updateByName || rec.updateBy || "未知" }}</span>
                      </div>
                      <span class="hv-timeline__time">{{ rec.createTime }}</span>
                    </div>
                    <p class="hv-timeline__body">{{ rec.trackContent }}</p>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </main>

        <!-- ██████ 右侧：动态信息（租客/预定/跟进） ██████ -->
        <aside class="hv-panel">
          <!-- 租客信息（仅展示信息，操作按钮已在顶部唯一操作区） -->
          <div class="hv-pcard">
            <div class="hv-pcard__hd">
              <div class="hv-pcard__ico hv-pcard__ico--tenant">
                <el-icon :size="13"><User /></el-icon>
              </div>
              <span class="hv-pcard__title">租客信息</span>
              <div v-if="isLeased" style="margin-left: auto; display: flex; gap: 4px; align-items: center">
                <el-button size="small" type="warning" plain @click="handleRenew">续约</el-button>
                <el-button size="small" type="danger" plain @click="handleCheckout">退租</el-button>
              </div>
            </div>
            <div class="hv-pcard__body">
              <template v-if="tenantInfo">
                <div class="hv-tenant" @click="emit('openTenantDetail', tenantInfo.name, tenantInfo.leaseId)">
                  <div class="hv-tenant__avatar">{{ tenantInfo.name.slice(0, 1) }}</div>
                  <div class="hv-tenant__info">
                    <div class="hv-tenant__name-row">
                      <span class="hv-tenant__name">{{ tenantInfo.name }}</span>
                      <span v-if="tenantInfo.duration" class="hv-tenant__dur">{{ tenantInfo.duration }}</span>
                    </div>
                    <div class="hv-tenant__phone">{{ tenantInfo.phone }}</div>
                    <div class="hv-tenant__rent">
                      月租
                      <strong>{{ tenantInfo.rentPrice }}</strong>
                      元
                    </div>
                    <div class="hv-tenant__dates">
                      <el-icon :size="10"><Calendar /></el-icon>
                      {{ tenantInfo.leaseStart }} — {{ tenantInfo.leaseEnd }}
                    </div>
                  </div>
                  <el-icon class="hv-tenant__arrow"><ArrowRight /></el-icon>
                </div>
              </template>
              <div v-else class="hv-panel-empty">
                <span class="hv-panel-empty__ico">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.5" />
                    <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                  </svg>
                </span>
                <span>暂无租客</span>
                <el-button v-if="isAvailable" size="small" type="primary" plain @click="emit('tenant', currentRoom!)">立即录入</el-button>
              </div>
            </div>
          </div>

          <!-- 预定信息 -->
          <div class="hv-pcard">
            <div class="hv-pcard__hd">
              <div class="hv-pcard__ico hv-pcard__ico--booking">
                <el-icon :size="13"><Calendar /></el-icon>
              </div>
              <span class="hv-pcard__title">预定信息</span>
              <div v-if="isBooked" style="margin-left: auto">
                <el-button size="small" type="primary" @click="emit('tenant', currentRoom!)">
                  <el-icon><ArrowRight /></el-icon>
                  转为租客
                </el-button>
              </div>
            </div>
            <div class="hv-pcard__body">
              <template v-if="bookingInfo">
                <div class="hv-booking" @click="emit('openBookingDetail', bookingInfo.id || '')">
                  <div class="hv-booking__name">{{ bookingInfo.tenantName || "-" }}</div>
                  <div class="hv-booking__rows">
                    <div class="hv-booking__row">
                      <span class="hv-booking__lbl">预定时间</span>
                      <span>{{ formatDate(bookingInfo.bookingTime) }}</span>
                    </div>
                    <div class="hv-booking__row">
                      <span class="hv-booking__lbl">到期时间</span>
                      <span class="c-warning">{{ formatDate(bookingInfo.expiryTime) }}</span>
                    </div>
                  </div>
                  <div class="hv-booking__link">
                    <el-icon :size="11"><ArrowRight /></el-icon>
                    查看详情
                  </div>
                </div>
              </template>
              <div v-else class="hv-panel-empty">
                <span class="hv-panel-empty__ico">📅</span>
                <span>暂无预定</span>
                <el-button v-if="isAvailable" size="small" plain @click="emit('booking', currentRoom!)">添加预定</el-button>
              </div>
            </div>
          </div>

          <!-- 跟进记录 -->
          <div class="hv-pcard hv-pcard--remark">
            <div class="hv-pcard__hd">
              <div class="hv-pcard__ico hv-pcard__ico--track">
                <el-icon :size="13"><Edit /></el-icon>
              </div>
              <span class="hv-pcard__title">房间备注</span>
              <div style="margin-left: auto">
                <template v-if="remarkEditing">
                  <el-button
                    size="small"
                    link
                    @click="
                      remarkEditing = false;
                      remarkText = currentRoom?.remark || '';
                    "
                  >
                    取消
                  </el-button>
                  <el-button size="small" link type="primary" :loading="remarkLoading" @click="handleSaveRemark">保存</el-button>
                </template>
                <el-button v-else size="small" link type="primary" @click="remarkEditing = true">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
              </div>
            </div>
            <div class="hv-pcard__body hv-pcard__body--remark">
              <el-input v-if="remarkEditing" v-model="remarkText" type="textarea" :rows="4" placeholder="输入房间备注…" resize="none" size="small" />
              <p v-else-if="remarkText" class="hv-remark-text" style="margin: 0; padding: 0 14px 14px; font-size: 13px; color: var(--t2); line-height: 1.7">{{ remarkText }}</p>
              <div v-else class="hv-panel-empty" style="padding: 14px">
                <span style="font-size: 18px">✏️</span>
                <span>暂无备注</span>
                <el-button size="small" link type="primary" @click="remarkEditing = true">点击添加</el-button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </template>

    <!-- ══════════════ 空/错误状态 ══════════════ -->
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
  //  Design Tokens
  // ════════════════════════════════════════
  .hv {
    // ── 边框（直接用 EL 变量，深色自动切换）──────────
    --b: var(--el-border-color);
    --bl: var(--el-border-color-lighter);
    // ── 文字 ──────────────────────────────────────────
    --t1: var(--el-text-color-primary);
    --t2: var(--el-text-color-regular);
    --t3: var(--el-text-color-placeholder);
    // ── 背景 ──────────────────────────────────────────
    --bg: var(--el-bg-color-page);
    --card: var(--el-bg-color);
    --sub: var(--el-fill-color-light);
    // ── 状态色 ────────────────────────────────────────
    --success: var(--el-color-success);
    --success-bg: var(--el-color-success-light-9);
    --success-border: var(--el-color-success-light-5);
    --warning: var(--el-color-warning);
    --warning-bg: var(--el-color-warning-light-9);
    --danger: var(--el-color-danger);
    --danger-bg: var(--el-color-danger-light-9);
    --info: var(--el-color-info);
    --info-bg: var(--el-color-info-light-9);
    // ── 主色 ──────────────────────────────────────────
    --primary: var(--el-color-primary);
    --primary-light: var(--el-color-primary-light-9);
    // ── 圆角 / 阴影 ───────────────────────────────────
    --r: 10px;
    --r-sm: 6px;
    --shadow: var(--el-box-shadow-light);
    --shadow-up: var(--el-box-shadow);
    // ── 扩展 token（散落硬编码色统一替换）────────────
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
  //  Skeleton
  // ════════════════════════════════════════
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
  %sk {
    background: linear-gradient(90deg, var(--sk-base) 25%, var(--sk-shine) 50%, var(--sk-base) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 5px;
  }

  .hv-loading {
    display: grid;
    grid-template-columns: 256px 1fr 280px;
    height: 100%;
    padding: 0;
    overflow: hidden;
  }

  .hv-sk {
    display: flex;
    flex-direction: column;
    overflow: hidden;

    &--left {
      background: var(--card);
      border-right: 1px solid var(--b);
    }
    &--main {
      background: var(--bg);
    }
    &--right {
      background: var(--card);
      border-left: 1px solid var(--b);
      padding: 16px;
      gap: 10px;
    }

    &__img {
      @extend %sk;
      height: 152px;
      border-radius: 0;
      flex-shrink: 0;
    }
    &__bar {
      @extend %sk;
      height: 64px;
      border-radius: 0;
      flex-shrink: 0;
      margin-bottom: 4px;
    }
    &__lines {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 16px;
    }
    &__line {
      @extend %sk;
      height: 12px;
      width: 100%;
      &--w50 {
        width: 50%;
      }
      &--w80 {
        width: 80%;
      }
      &--w60 {
        width: 60%;
      }
      &--h16 {
        height: 16px;
      }
    }
    &__grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      padding: 0 16px;
    }
    &__cell {
      @extend %sk;
      height: 36px;
    }
    &__card {
      @extend %sk;
      height: 80px;
      flex-shrink: 0;
      &--lg {
        height: 120px;
        flex: 1;
      }
    }
  }

  // ════════════════════════════════════════
  //  Layout
  // ════════════════════════════════════════
  .hv-layout {
    display: grid;
    grid-template-columns: 256px 1fr 280px;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  // ════════════════════════════════════════
  //  左侧：房源档案
  // ════════════════════════════════════════
  .hv-aside {
    display: flex;
    flex-direction: column;
    background: var(--card);
    border-right: 1px solid var(--b);
    overflow: hidden;

    &__body {
      flex: 1;
      padding: 14px 12px 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      overflow-y: auto;
      &::-webkit-scrollbar {
        width: 3px;
      }
      &::-webkit-scrollbar-thumb {
        background: var(--bl);
        border-radius: 2px;
      }
    }

    &__title-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 6px;
    }

    &__title {
      display: flex;
      align-items: flex-start;
      gap: 5px;
      font-size: 14px;
      font-weight: 700;
      line-height: 1.4;
      flex: 1;
    }

    &__loc-icon {
      color: var(--primary);
      margin-top: 2px;
      flex-shrink: 0;
    }

    &__costs {
      display: flex;
      flex-direction: column;
      gap: 0;
      border: 1px solid var(--bl);
      border-radius: var(--r-sm);
      overflow: hidden;
    }

    &__remark {
      background: var(--remark-bg);
      border: 1px solid var(--remark-border);
      border-radius: var(--r-sm);
      padding: 9px 12px;

      p {
        margin: 0;
        font-size: 12px;
        color: var(--remark-text);
        line-height: 1.6;
      }
    }
  }

  // 封面图
  .hv-cover {
    position: relative;
    flex-shrink: 0;
    background: var(--sub);
    overflow: hidden;
    display: flex;
    flex-direction: column;

    &__img {
      width: 100%;
      height: 140px;
      display: block;
      cursor: pointer;
      transition: transform 0.35s ease;
      &:hover {
        transform: scale(1.04);
      }
      :deep(img) {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    &__empty {
      height: 140px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: var(--t3);
      font-size: 12px;
    }

    &__footer {
      position: absolute;
      bottom: 8px;
      right: 8px;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(4px);
      border-radius: 20px;
      font-size: 11px;
      color: #fff;
      pointer-events: none;
    }
  }

  // 属性 chip
  .hv-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .hv-chip {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 500;
    background: var(--sub);
    color: var(--t2);
    border: 1px solid var(--bl);
    white-space: nowrap;
    &--blue {
      background: var(--primary-light);
      color: var(--primary);
      border-color: var(--el-color-primary-light-7);
    }
    &--green {
      background: var(--success-bg);
      color: var(--success);
      border-color: var(--success-border);
    }
  }

  // 费用行
  .hv-cost-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 7px 11px;
    font-size: 12px;
    border-bottom: 1px solid var(--bl);
    &:last-child {
      border-bottom: none;
    }

    &__label {
      color: var(--t3);
      font-weight: 500;
    }
    &__val {
      font-weight: 600;
      em {
        font-style: normal;
        font-size: 10px;
        color: var(--t3);
        font-weight: 400;
        margin-left: 2px;
      }
    }
  }

  // 负责人
  .hv-owner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 11px;
    background: var(--sub);
    border: 1px solid var(--bl);
    border-radius: var(--r-sm);

    // 固定在左侧底部
    &--fixed {
      border-radius: 0;
      border-top: 1px solid var(--b);
      background: var(--card);
      flex-shrink: 0;
      padding: 10px 14px;
      margin: 0;
      gap: 10px;
    }

    &__avatar {
      width: 34px;
      height: 34px;
      min-width: 34px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--el-color-primary-light-5), var(--primary));
      color: #fff;
      font-size: 14px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    &__info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    &__label {
      font-size: 10px;
      color: var(--t3);
      font-weight: 500;
      letter-spacing: 0.3px;
    }

    &__name {
      font-size: 13px;
      font-weight: 700;
      color: var(--t1);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__phone {
      font-size: 11px;
      color: var(--t3);
      margin-top: 1px;
    }

    &__dept {
      font-size: 11px;
      color: var(--t3);
      margin-top: 1px;
    }

    &__dept-badge {
      font-size: 10px;
      font-weight: 600;
      color: var(--primary);
      background: var(--primary-light);
      border: 1px solid var(--el-color-primary-light-7);
      border-radius: 6px;
      padding: 2px 7px;
      white-space: nowrap;
      flex-shrink: 0;
    }
  }

  // 分隔
  .hv-sep {
    height: 1px;
    background: var(--bl);
    margin: 0 -16px;
  }

  // 出租率
  .hv-occ {
    display: flex;
    flex-direction: column;
    gap: 8px;

    &__head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
    }
    &__label {
      font-size: 12px;
      font-weight: 700;
      color: var(--t2);
    }
    &__pct {
      font-size: 22px;
      font-weight: 800;
      color: var(--success);
      font-variant-numeric: tabular-nums;
    }

    &__track {
      height: 6px;
      border-radius: 6px;
      background: var(--danger-bg);
      overflow: hidden;
      display: flex;
    }
    &__fill {
      height: 100%;
      transition: width 0.4s ease;
      &--leased {
        background: var(--success);
      }
      &--booked {
        background: var(--warning);
      }
    }

    &__legend {
      display: flex;
      gap: 12px;
      span {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        color: var(--t3);
      }
    }
  }

  // 状态点
  .hv-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    font-style: normal;
    &--leased {
      background: var(--success);
    }
    &--booked {
      background: var(--warning);
    }
    &--available {
      background: var(--danger);
      opacity: 0.5;
    }
  }

  // 房间导航
  .hv-nav {
    display: flex;
    flex-direction: column;
    gap: 7px;
    flex: 1;
    min-height: 0;

    &__title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 700;
      color: var(--t2);
    }
    &__total {
      font-size: 11px;
      font-weight: 600;
      color: var(--t3);
      background: var(--sub);
      border: 1px solid var(--bl);
      border-radius: 10px;
      padding: 0 7px;
    }
    &__list {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
  }

  .hv-nav-item {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 8px 10px;
    border-radius: var(--r-sm);
    border: 1.5px solid transparent;
    background: var(--sub);
    cursor: pointer;
    transition: all 0.13s;
    text-align: left;

    &:hover {
      background: var(--hover-bg);
      border-color: var(--b);
    }
    &.is-active {
      background: var(--primary-light);
      border-color: var(--el-color-primary-light-5);
    }

    &--add {
      border-style: dashed;
      border-color: var(--b);
      color: var(--t3);
      font-size: 12px;
      gap: 5px;
      &:hover {
        color: var(--primary);
        border-color: var(--primary);
        background: var(--primary-light);
      }
    }

    &__dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    &__num {
      font-size: 13px;
      font-weight: 700;
      min-width: 28px;
    }
    &__area {
      font-size: 11px;
      color: var(--t3);
    }
    &__tenant {
      flex: 1;
      font-size: 11px;
      color: var(--t2);
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__tag {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 10px;
      white-space: nowrap;
      &--leased {
        background: var(--success-bg);
        color: var(--success);
      }
      &--available {
        background: var(--danger-bg);
        color: var(--danger);
      }
      &--booked {
        background: var(--warning-bg);
        color: var(--warning);
      }
      &--locked {
        background: var(--info-bg);
        color: var(--info);
      }
    }
  }

  // ════════════════════════════════════════
  //  中间：房间详情
  // ════════════════════════════════════════
  .hv-main {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--card);
  }

  // 房间头部（一体化：名称+状态+价格+操作）
  .hv-room-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--b);
    flex-shrink: 0;
    background: var(--card);

    &__left {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 0 0 auto;
    }

    &__name {
      font-size: 16px;
      font-weight: 800;
      margin: 0;
      color: var(--t1);
    }

    &__price {
      display: flex;
      align-items: baseline;
      gap: 4px;
      padding: 0 16px;
      border-left: 1px solid var(--bl);
      border-right: 1px solid var(--bl);
      flex: 0 0 auto;
    }

    &__amount {
      font-size: 24px;
      font-weight: 800;
      color: var(--success);
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }

    &__unit {
      font-size: 12px;
      color: var(--t3);
    }

    &__price-edit {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      margin-left: 6px;
      padding: 2px 7px;
      border-radius: 4px;
      border: 1px solid var(--b);
      background: transparent;
      color: var(--t3);
      font-size: 11px;
      cursor: pointer;
      transition: all 0.15s;
      &:hover {
        color: var(--primary);
        border-color: var(--primary);
        background: var(--primary-light);
      }
    }

    &__actions {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-left: auto;
      flex-shrink: 0;
    }

    &__divider {
      width: 1px;
      height: 20px;
      background: var(--bl);
      flex-shrink: 0;
      margin: 0 2px;
    }
  }

  // 状态徽章
  .hv-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 9px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    &__dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: currentColor;
    }
    &--leased {
      background: var(--success-bg);
      color: var(--success);
    }
    &--available {
      background: var(--danger-bg);
      color: var(--danger);
    }
    &--booked {
      background: var(--warning-bg);
      color: var(--warning);
    }
    &--locked {
      background: var(--info-bg);
      color: var(--info);
    }
  }

  // Tab
  .hv-tabs {
    display: flex;
    border-bottom: 1px solid var(--b);
    padding: 0 20px;
    flex-shrink: 0;
    background: var(--card);
  }

  .hv-tab {
    padding: 12px 16px 11px;
    font-size: 13px;
    font-weight: 500;
    color: var(--t2);
    background: none;
    border: none;
    cursor: pointer;
    position: relative;
    transition: color 0.15s;

    &.is-active {
      color: var(--primary);
      font-weight: 700;
      &::after {
        content: "";
        position: absolute;
        bottom: -1px;
        left: 16px;
        right: 16px;
        height: 2.5px;
        background: var(--primary);
        border-radius: 2px;
      }
    }
    &:hover:not(.is-active) {
      color: var(--t1);
    }
  }

  .hv-tab-body {
    flex: 1;
    overflow-y: auto;
    padding: 0 20px 24px;
    &::-webkit-scrollbar {
      width: 3px;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--b);
      border-radius: 2px;
    }
  }

  // Section
  .hv-section {
    padding: 18px 0;
    border-bottom: 1px solid var(--bl);
    &:last-child {
      border-bottom: none;
    }

    &__hd {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }

    &__title {
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 7px;
      &::before {
        content: "";
        display: inline-block;
        width: 3px;
        height: 14px;
        background: var(--primary);
        border-radius: 2px;
      }
    }

    &__hd-actions {
      display: flex;
      gap: 4px;
    }

    &--remark {
    }
  }

  // KV 网格（房间基本信息）
  .hv-kv-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border: 1px solid var(--b);
    border-radius: var(--r-sm);
    overflow: hidden;
  }

  .hv-kv {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 11px 13px;
    border-right: 1px solid var(--bl);
    border-bottom: 1px solid var(--bl);
    transition: background 0.1s;
    &:hover {
      background: var(--sub);
    }
    &:nth-child(4n) {
      border-right: none;
    }
    &:nth-last-child(-n + 4) {
      border-bottom: none;
    }

    &__k {
      font-size: 10px;
      color: var(--t3);
      font-weight: 500;
      letter-spacing: 0.2px;
    }
    &__v {
      font-size: 13px;
      font-weight: 500;
      &--bold {
        font-weight: 700;
      }
      &--accent {
        color: var(--primary);
        font-weight: 700;
      }
      &--muted {
        color: var(--t3);
        font-weight: 400;
      }
    }
  }

  // 租金三卡
  .hv-price-trio {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .hv-price-card {
    padding: 14px 15px;
    border: 1px solid var(--b);
    border-radius: var(--r-sm);
    background: var(--sub);
    transition: box-shadow 0.15s;
    &:hover {
      box-shadow: var(--shadow);
    }

    &--main {
      background: linear-gradient(140deg, var(--price-main-from), var(--price-main-to));
      border-color: var(--success-border);
    }

    &__lbl {
      font-size: 10px;
      color: var(--t3);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 8px;
    }

    &__val {
      display: flex;
      align-items: baseline;
      gap: 3px;
      strong {
        font-size: 20px;
        font-weight: 800;
        color: var(--success);
        font-variant-numeric: tabular-nums;
      }
      em {
        font-size: 11px;
        color: var(--t3);
        font-style: normal;
      }
      &--warn {
        color: var(--warning) !important;
        font-size: 18px !important;
      }
    }
    &__nil {
      font-size: 14px;
      color: var(--t3);
    }
  }

  // 费用列表
  .hv-fee-list {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .hv-fee-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 13px;
    border-radius: var(--r-sm);
    background: var(--sub);
    border: 1px solid var(--bl);
    transition: background 0.12s;
    &:hover {
      background: var(--hover-bg);
    }
    &__name {
      font-weight: 600;
      flex: 1;
    }
    &__amt {
      color: var(--primary);
      font-weight: 700;
    }
  }

  // 方案表格
  .hv-plan-table {
    border: 1px solid var(--b);
    border-radius: var(--r-sm);
    overflow: hidden;
    font-size: 12px;
    &__head,
    &__row {
      display: grid;
      grid-template-columns: 1.4fr 1fr 0.8fr;
    }
    &__head {
      background: var(--sub);
      font-size: 10px;
      font-weight: 700;
      color: var(--t2);
      text-transform: uppercase;
      letter-spacing: 0.3px;
      span {
        padding: 9px 13px;
      }
    }
    &__row {
      border-top: 1px solid var(--bl);
      transition: background 0.1s;
      span {
        padding: 9px 13px;
      }
      &:hover {
        background: var(--sub);
      }
    }
  }

  // 备注文字
  .hv-remark-text {
    font-size: 13px;
    color: var(--t2);
    line-height: 1.7;
    margin: 0;
  }

  // 空状态提示
  .hv-empty-tip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 2px;
    color: var(--t3);
    font-size: 13px;
    &__ico {
      font-size: 18px;
    }
  }
  .hv-link {
    color: var(--primary);
    cursor: pointer;
    &:hover {
      text-decoration: underline;
    }
  }

  // 工具类
  .c-primary {
    color: var(--primary);
  }
  .c-warning {
    color: var(--warning);
  }
  .fw-600 {
    font-weight: 600;
  }

  // ════════════════════════════════════════
  //  右侧面板
  // ════════════════════════════════════════
  .hv-panel {
    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--b);
    background: var(--bg);
    overflow-y: auto;
    &::-webkit-scrollbar {
      width: 3px;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--b);
      border-radius: 2px;
    }
  }

  // ════════════════════════════════════════
  //  全局顶部栏（截图风格）
  // ════════════════════════════════════════
  .hv-topbar {
    display: flex;
    align-items: center;
    gap: 0;
    padding: 0 8px 14px 0;
    background: var(--card);
    border-bottom: 1px solid var(--b);
    flex-shrink: 0;
    overflow-x: auto;
    &::-webkit-scrollbar {
      height: 0;
    }
  }

  // 左侧：房源概要卡
  .hv-topbar__summary {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 4px;
    padding: 6px 12px 6px 0;
    margin-right: 10px;
    border-right: 1px solid var(--b);
    flex-shrink: 0;
    background: var(--sub);
    border: 1px solid var(--b);
    border-radius: 8px;
    padding: 6px 14px;
    margin-right: 10px;

    &-type {
      font-size: 13px;
      font-weight: 700;
      color: var(--t1);
      white-space: nowrap;
    }
    &-stat {
      font-size: 11px;
      color: var(--t3);
      white-space: nowrap;
    }
  }

  // 房间卡片列表容器
  .hv-topbar__rooms {
    display: flex;
    align-items: stretch;
    gap: 6px;
    flex: 1;
    min-width: 0;
    flex-wrap: wrap;
    padding: 0 10px 0 0;
  }

  // 单个房间卡片（截图风格：左侧房号+状态，右侧信息，固定宽度）
  .hv-troom {
    display: flex;
    align-items: stretch;
    border-radius: 8px;
    border: 1.5px solid var(--b);
    background: var(--sub);
    cursor: pointer;
    transition: all 0.15s;
    text-align: left;
    width: 160px;
    min-width: 160px;
    overflow: hidden;
    flex-shrink: 0;

    &:hover {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
    }

    &.is-active {
      border-color: var(--primary);
      background: var(--card);
      box-shadow: 0 0 0 2px var(--el-color-primary-light-7);

      .hv-troom__left {
        background: var(--primary);
        color: #fff;
      }
      .hv-troom__status--leased {
        color: #a5f3c0;
      }
      .hv-troom__status--available {
        color: #fca5a5;
      }
      .hv-troom__status--booked {
        color: #fcd34d;
      }
      .hv-troom__status--locked {
        color: #cbd5e1;
      }
    }

    &--add {
      border-style: dashed;
      border-color: var(--b);
      color: var(--t3);
      font-size: 12px;
      align-items: center;
      justify-content: center;
      gap: 4px;
      width: 80px;
      min-width: 80px;
      &:hover {
        color: var(--primary);
        border-color: var(--primary);
        background: var(--primary-light);
      }
    }

    // 左侧：房间号 + 状态（固定宽，垂直居中）
    &__left {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      padding: 8px 10px;
      min-width: 48px;
      flex-shrink: 0;
      transition: background 0.15s;
    }
    &__num {
      font-size: 16px;
      font-weight: 800;
      line-height: 1;
      color: var(--t1);
    }
    &__status {
      font-size: 10px;
      font-weight: 700;
      white-space: nowrap;
      &--leased {
        color: var(--success);
      }
      &--available {
        color: var(--danger);
      }
      &--booked {
        color: var(--warning);
      }
      &--locked {
        color: var(--info);
      }
    }

    // 竖线分隔
    &__divider {
      width: 1px;
      background: var(--bl);
      flex-shrink: 0;
      align-self: stretch;
    }

    // 右侧：信息区（固定剩余宽度，垂直居中）
    &__right {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      text-align: center;
      gap: 3px;
      padding: 7px 10px;
      min-width: 0;
    }

    &__info-line {
      font-size: 11px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: block;
      &--tenant {
        color: var(--t2);
        font-weight: 500;
      }
      &--booking {
        color: var(--warning);
        font-weight: 500;
      }
      &--empty {
        color: var(--t3);
      }
      &--date {
        color: var(--t3);
        font-size: 10px;
      }
    }
  }

  // 右侧：出租率容器（原始 hv-occ 样式不变，只加容器）
  .hv-topbar__occ {
    flex-shrink: 0;
    padding-left: 14px;
    border-left: 1px solid var(--b);
    min-width: 120px;

    .hv-occ {
      gap: 6px;
    }
  }

  // 旧 modifier 清理
  .hv-nav--topbar,
  .hv-nav-item--compact,
  .hv-occ--topbar,
  .hv-topbar__occ-rate,
  .hv-topbar__occ-label {
    display: none;
  }

  .hv-pcard {
    background: var(--card);
    border-bottom: 1px solid var(--b);
    flex-shrink: 0;

    &--remark {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    &--track {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    &__hd {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 11px 14px 9px;
    }

    &__ico {
      width: 24px;
      height: 24px;
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      &--tenant {
        background: var(--success-bg);
        color: var(--success);
      }
      &--booking {
        background: var(--warning-bg);
        color: var(--warning);
      }
      &--track {
        background: var(--track-icon-bg);
        color: var(--track-icon-color);
      }
    }

    &__title {
      font-size: 13px;
      font-weight: 700;
      flex: 1;
    }

    &__body {
      padding: 0 14px 12px;
      &--track {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-height: 0;
        padding-bottom: 14px;
      }
      &--remark {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        padding: 0 14px 14px;
      }
    }
  }

  // 租客卡片
  .hv-tenant {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border-radius: var(--r-sm);
    background: var(--sub);
    border: 1px solid var(--bl);
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      background: var(--hover-bg);
      box-shadow: var(--shadow);
      transform: translateY(-1px);
    }

    &__avatar {
      width: 38px;
      height: 38px;
      min-width: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--el-color-primary-light-5), var(--primary));
      color: #fff;
      font-size: 16px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &__info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }

    &__name-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    &__name {
      font-size: 14px;
      font-weight: 700;
    }
    &__dur {
      font-size: 10px;
      font-weight: 600;
      color: var(--primary);
      background: var(--primary-light);
      padding: 1px 6px;
      border-radius: 10px;
      white-space: nowrap;
    }
    &__phone {
      font-size: 11px;
      color: var(--t3);
    }
    &__rent {
      font-size: 12px;
      color: var(--t2);
      strong {
        color: var(--success);
        font-size: 15px;
        font-weight: 800;
        font-variant-numeric: tabular-nums;
      }
    }
    &__dates {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: var(--t3);
    }
    &__arrow {
      color: var(--t3);
      flex-shrink: 0;
    }
  }

  // 预定卡片
  .hv-booking {
    padding: 10px;
    border-radius: var(--r-sm);
    background: var(--sub);
    border: 1px solid var(--bl);
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    flex-direction: column;
    gap: 7px;

    &:hover {
      background: var(--hover-bg);
      box-shadow: var(--shadow);
    }

    &__name {
      font-size: 14px;
      font-weight: 700;
    }

    &__rows {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    &__row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
    }
    &__lbl {
      color: var(--t3);
      font-size: 11px;
    }

    &__link {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 11px;
      color: var(--primary);
      font-weight: 500;
      margin-top: 2px;
    }
  }

  // 面板空状态
  .hv-panel-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px 0;
    gap: 8px;
    color: var(--t3);
    font-size: 12px;
    &__ico {
      font-size: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--t3);
    }
    &--sm {
      flex-direction: row;
      justify-content: flex-start;
      padding: 4px 0;
    }
  }

  // ════════════════════════════════════════
  //  跟进记录 - 输入区
  // ════════════════════════════════════════
  .hv-track-compose {
    display: flex;
    gap: 12px;
    padding: 18px 20px 14px;
    border-bottom: 1px solid var(--bl);

    &__avatar {
      width: 32px;
      height: 32px;
      min-width: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--el-color-primary-light-5), var(--primary));
      color: #fff;
      font-size: 13px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 2px;
      flex-shrink: 0;
    }

    &__right {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    &__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    &__hint {
      font-size: 11px;
      color: var(--t3);
    }
  }

  // ════════════════════════════════════════
  //  跟进记录 - 时间轴
  // ════════════════════════════════════════
  .hv-timeline {
    padding: 20px 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 0;

    &__empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 0;
      gap: 8px;
      color: var(--t3);

      p {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--t2);
      }

      span {
        font-size: 12px;
        color: var(--t3);
      }

      svg {
        color: var(--t3);
      }
    }

    &__item {
      display: flex;
      gap: 14px;
      position: relative;
      padding-bottom: 20px;

      &:last-child {
        padding-bottom: 0;
      }
    }

    &__dot {
      width: 10px;
      height: 10px;
      min-width: 10px;
      border-radius: 50%;
      background: var(--primary);
      border: 2px solid var(--dot-border);
      box-shadow: 0 0 0 2px var(--el-color-primary-light-5);
      margin-top: 13px;
      flex-shrink: 0;
      z-index: 1;
    }

    &__line {
      position: absolute;
      left: 4px;
      top: 22px;
      bottom: 0;
      width: 2px;
      background: var(--bl);
    }

    &__card {
      flex: 1;
      background: var(--card);
      border: 1px solid var(--b);
      border-radius: var(--r);
      padding: 12px 14px;
      box-shadow: var(--shadow);
      transition: box-shadow 0.15s;

      &:hover {
        box-shadow:
          0 2px 8px rgba(0, 0, 0, 0.08),
          0 8px 24px rgba(0, 0, 0, 0.06);
      }
    }

    &__meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    &__author-wrap {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    &__author-avatar {
      width: 22px;
      height: 22px;
      border-radius: 6px;
      background: linear-gradient(135deg, var(--el-color-primary-light-5), var(--primary));
      color: #fff;
      font-size: 11px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &__author {
      font-size: 12px;
      font-weight: 700;
      color: var(--t1);
    }

    &__time {
      font-size: 11px;
      color: var(--t3);
      font-variant-numeric: tabular-nums;
    }

    &__body {
      margin: 0;
      font-size: 13px;
      color: var(--t2);
      line-height: 1.7;
    }
  }

  // 旧 track 样式保留兼容
  .hv-track-input {
    display: flex;
    flex-direction: column;
    gap: 6px;
    .el-button {
      align-self: flex-end;
    }
  }
  .hv-track-list {
    display: none;
  }
  .hv-track-item {
    display: none;
  }

  // ════════════════════════════════════════
  //  全局空状态
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
      grid-template-columns: 240px 1fr 260px;
    }
  }
  @media (width <= 1100px) {
    .hv-layout {
      grid-template-columns: 1fr 260px;
    }
    .hv-aside {
      display: none;
    }
  }
  @media (width <= 900px) {
    .hv-layout {
      grid-template-columns: 1fr;
    }
    .hv-panel {
      display: none;
    }
  }
</style>
