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
      duration: calcLeaseDuration(li.leaseStartDate, li.leaseEndDate)
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
          <div style="display: flex; gap: 20px; padding: 20px">
            <el-skeleton-item variant="image" style="width: 240px; height: 100%; border-radius: 12px; flex-shrink: 0" />
            <div style="flex: 1; display: flex; flex-direction: column; gap: 12px">
              <el-skeleton-item variant="h3" style="width: 60%" />
              <el-skeleton-item variant="text" style="width: 40%" />
              <el-skeleton-item variant="text" />
              <el-skeleton-item variant="text" />
            </div>
          </div>
        </template>
      </el-skeleton>
    </div>

    <template v-else-if="detail">
      <!-- ===== 三栏布局 ===== -->
      <div class="hv-layout">
        <!-- ① 左侧：房源信息面板 -->
        <aside class="hv-aside">
          <!-- 图片区 -->
          <div class="hv-aside__gallery">
            <el-image v-if="allImages.length" :src="allImages[0]" fit="cover" :preview-src-list="allImages" class="hv-aside__img" />
            <div v-else class="hv-aside__img-empty">
              <el-icon :size="36" color="var(--el-text-color-placeholder)"><House /></el-icon>
              <span>暂无图片</span>
            </div>
            <div class="hv-aside__img-count" v-if="allImages.length > 1">
              <el-icon :size="11"><View /></el-icon>
              {{ allImages.length }}张
            </div>
          </div>

          <!-- 房源属性 -->
          <div class="hv-aside__body">
            <!-- 小区名 -->
            <div class="hv-aside__location">
              <el-icon :size="13" color="var(--el-color-primary)"><Location /></el-icon>
              <span>{{ houseMeta.communityName }}</span>
            </div>

            <!-- 关键指标 2列网格 -->
            <div class="hv-kv-grid">
              <div class="hv-kv">
                <span class="hv-kv__label">房型</span>
                <span class="hv-kv__value">{{ houseMeta.rentalType }}</span>
              </div>
              <div class="hv-kv">
                <span class="hv-kv__label">建筑面积</span>
                <span class="hv-kv__value">{{ houseMeta.area }} m²</span>
              </div>
              <div class="hv-kv">
                <span class="hv-kv__label">楼层</span>
                <span class="hv-kv__value">{{ houseMeta.floor }} / {{ houseMeta.floorTotal }} 层</span>
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
                <span class="hv-kv__value">{{ houseMeta.propertyFee }} 元/月</span>
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

            <!-- 分隔 -->
            <div class="hv-divider" />

            <!-- 负责人 -->
            <div class="hv-salesman">
              <div class="hv-salesman__avatar">{{ houseMeta.salesmanName.slice(0, 1) }}</div>
              <div class="hv-salesman__info">
                <span class="hv-salesman__name">{{ houseMeta.salesmanName }}</span>
                <span class="hv-salesman__role">负责人</span>
              </div>
            </div>

            <!-- 房源备注 -->
            <div v-if="houseMeta.houseRemark" class="hv-aside__remark">
              <span class="hv-aside__remark-label">备注</span>
              <span class="hv-aside__remark-text">{{ houseMeta.houseRemark }}</span>
            </div>

            <!-- 修改房源 -->
            <el-button class="hv-aside__edit-btn" size="small" plain>
              <el-icon><Edit /></el-icon>
              修改房源信息
            </el-button>
          </div>
        </aside>

        <!-- ② 中间：房间 + 详情 -->
        <main class="hv-main">
          <!-- ★ 合并式顶部条：价格 + 房间选择 -->
          <div class="hv-topbar">
            <!-- 左：价格区 -->
            <div class="hv-topbar__price">
              <span
                class="hv-topbar__badge"
                :class="{
                  'is-leased': roomStatusInfo.isLeased,
                  'is-available': roomStatusInfo.isAvailable,
                  'is-booked': roomStatusInfo.isBooked
                }"
              >
                <span class="hv-topbar__badge-dot"></span>
                {{ roomStatusInfo.isLeased ? "已租" : roomStatusInfo.isAvailable ? "空置" : roomStatusInfo.isBooked ? "已预定" : roomStatusInfo.statusName }}
              </span>
              <span class="hv-topbar__amount">{{ rentPrice }}</span>
              <span class="hv-topbar__unit">元/月</span>
              <template v-if="priceConfig?.floorPrice">
                <span class="hv-topbar__sep">|</span>
                <span class="hv-topbar__floor-label">底价</span>
                <span class="hv-topbar__floor-val">{{ priceConfig.floorPrice }} 元/月</span>
              </template>
              <button class="hv-topbar__edit" @click="handleOpenPriceConfig">
                <el-icon :size="11"><Edit /></el-icon>
                修改
              </button>
            </div>
            <!-- 右：房间卡片 + 汇总 -->
            <div class="hv-topbar__rooms">
              <div class="hv-topbar__stats">
                <span>
                  <span class="hv-dot" style="background: #67c23a"></span>
                  {{ roomStats.leased }}已租
                </span>
                <span>
                  <span class="hv-dot" style="background: #f56c6c"></span>
                  {{ roomStats.available }}空置
                </span>
                <span>
                  <span class="hv-dot" style="background: #e6a23c"></span>
                  {{ roomStats.booked }}预定
                </span>
              </div>
              <div class="hv-topbar__room-list">
                <div
                  v-for="(room, idx) in roomTabs"
                  :key="room.id || (room as any).id || idx"
                  class="hv-rcard"
                  :class="{ 'is-active': activeRoomIndex === idx }"
                  @click="activeRoomIndex = idx"
                >
                  <span class="hv-rcard__dot" :style="{ background: getRoomTabStatus(room).dot }"></span>
                  <span class="hv-rcard__num">{{ room.roomNumber || String.fromCharCode(65 + idx) }}</span>
                  <span class="hv-rcard__st" :class="getRoomTabStatus(room).cls">{{ getRoomTabStatus(room).text }}</span>
                </div>
                <div v-if="isShareRental" class="hv-rcard hv-rcard--add" @click="emit('addRoom')">
                  <el-icon :size="12"><Plus /></el-icon>
                  <span>添加</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 详情 Tab 区域 -->
          <div class="hv-detail">
            <div class="hv-tabs">
              <button class="hv-tab" :class="{ active: activeDetailTab === 'room' }" @click="activeDetailTab = 'room'">房间信息</button>
              <button class="hv-tab" :class="{ active: activeDetailTab === 'rent' }" @click="activeDetailTab = 'rent'">租金配置</button>
            </div>

            <div class="hv-tab-body">
              <!-- ===== 租金信息 ===== -->
              <template v-if="activeDetailTab === 'rent'">
                <!-- 三列：租金/底价/佣金 -->
                <div class="hv-section">
                  <div class="hv-section__head">
                    <span class="hv-section__title">租金明细</span>
                    <el-button size="small" link type="primary" @click="handleOpenPriceConfig">
                      <el-icon><Edit /></el-icon>
                      编辑配置
                    </el-button>
                  </div>
                  <div class="hv-stat-row">
                    <div class="hv-stat">
                      <span class="hv-stat__label">租金价格</span>
                      <span class="hv-stat__value hv-stat__value--primary">
                        {{ rentPrice }}
                        <em>元/月</em>
                      </span>
                    </div>
                    <div class="hv-stat">
                      <span class="hv-stat__label">租金底价</span>
                      <span class="hv-stat__value">
                        <template v-if="priceConfig?.floorPrice">
                          {{ priceConfig.floorPrice }}
                          <em>元/月</em>
                        </template>
                        <template v-else><span class="hv-stat__mask">—</span></template>
                      </span>
                    </div>
                    <div class="hv-stat">
                      <span class="hv-stat__label">佣金</span>
                      <span class="hv-stat__value">—</span>
                    </div>
                  </div>
                </div>

                <!-- 其他费用 -->
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

                <!-- 租金方案 -->
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

        <!-- ③ 右侧：租客 / 预定 / 跟进 -->
        <aside class="hv-panel">
          <!-- 租客信息 -->
          <div class="hv-panel-sec">
            <div class="hv-panel-sec__head">
              <div class="hv-panel-sec__icon hv-panel-sec__icon--tenant">
                <el-icon :size="14"><User /></el-icon>
              </div>
              <span class="hv-panel-sec__title">租客信息</span>
              <div class="hv-panel-sec__actions">
                <el-button v-if="roomStatusInfo.isLeased" size="small" link type="danger" @click="handleCheckout">退租</el-button>
                <el-button v-if="roomStatusInfo.isLeased" size="small" link type="primary" @click="handleRenew">续签</el-button>
                <el-button v-if="!roomStatusInfo.isLeased && !roomStatusInfo.isBooked" size="small" type="primary" plain @click="emit('tenant', currentRoom)">录入租客</el-button>
              </div>
            </div>
            <div class="hv-panel-sec__body">
              <template v-if="tenantInfo">
                <div class="hv-tenant-card" @click="emit('openTenantDetail', currentRoom?.leaseInfo?.tenantId || '', currentRoom?.leaseInfo?.leaseId || '')">
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
                    <div class="hv-tenant-card__lease">
                      <el-icon :size="11"><Calendar /></el-icon>
                      <span class="hv-tenant-card__lease-date">{{ tenantInfo.leaseStart }}</span>
                      <span>—</span>
                      <span class="hv-tenant-card__lease-date">{{ tenantInfo.leaseEnd }}</span>
                    </div>
                  </div>
                  <el-icon class="hv-tenant-card__arrow"><ArrowRight /></el-icon>
                </div>
              </template>
              <div v-else class="hv-panel-empty">
                <el-icon :size="28" color="var(--el-text-color-placeholder)"><User /></el-icon>
                <span>暂无租客</span>
              </div>
            </div>
          </div>

          <!-- 预定信息 -->
          <div class="hv-panel-sec">
            <div class="hv-panel-sec__head">
              <div class="hv-panel-sec__icon hv-panel-sec__icon--booking">
                <el-icon :size="14"><Calendar /></el-icon>
              </div>
              <span class="hv-panel-sec__title">预定信息</span>
              <div class="hv-panel-sec__actions">
                <el-button size="small" type="warning" plain @click="emit('booking', currentRoom)">添加预定</el-button>
              </div>
            </div>
            <div class="hv-panel-sec__body">
              <template v-if="bookingInfo">
                <div class="hv-booking-card" @click="emit('openBookingDetail', bookingInfo.id || '')">
                  <div class="hv-booking-card__row">
                    <span class="hv-booking-card__label">预定人</span>
                    <span class="hv-booking-card__val">{{ bookingInfo.tenantName || "-" }}</span>
                  </div>
                  <div class="hv-booking-card__row">
                    <span class="hv-booking-card__label">预定时间</span>
                    <span class="hv-booking-card__val">{{ formatDate(bookingInfo.bookingTime) }}</span>
                  </div>
                  <div class="hv-booking-card__row">
                    <span class="hv-booking-card__label">到期时间</span>
                    <span class="hv-booking-card__val">{{ formatDate(bookingInfo.expiryTime) }}</span>
                  </div>
                </div>
              </template>
              <div v-else class="hv-panel-empty">
                <el-icon :size="28" color="var(--el-text-color-placeholder)"><Calendar /></el-icon>
                <span>暂无预定</span>
              </div>
            </div>
          </div>

          <!-- 备注 -->
          <div class="hv-panel-sec hv-panel-sec--note">
            <div class="hv-panel-sec__head">
              <div class="hv-panel-sec__icon hv-panel-sec__icon--note">
                <el-icon :size="14"><Edit /></el-icon>
              </div>
              <span class="hv-panel-sec__title">房间备注</span>
              <div class="hv-panel-sec__actions">
                <template v-if="remarkEditing">
                  <el-button
                    size="small"
                    link
                    @click="
                      remarkEditing = false;
                      remarkText = headerMeta.remark !== '-' ? headerMeta.remark : '';
                    "
                  >
                    取消
                  </el-button>
                  <el-button size="small" type="primary" link :loading="remarkLoading" @click="handleSaveRemark">保存</el-button>
                </template>
                <template v-else>
                  <el-button size="small" link type="primary" @click="remarkEditing = true">
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-button>
                </template>
              </div>
            </div>
            <div class="hv-panel-sec__body">
              <template v-if="remarkEditing">
                <el-input v-model="remarkText" type="textarea" :rows="4" placeholder="请输入房间备注..." resize="none" class="hv-remark-input" />
              </template>
              <template v-else>
                <p v-if="remarkText" class="hv-panel-remark">{{ remarkText }}</p>
                <div v-else class="hv-panel-empty hv-panel-empty--sm">
                  <span>暂无备注，</span>
                  <span class="hv-panel-empty__link" @click="remarkEditing = true">点击添加</span>
                </div>
              </template>
            </div>
          </div>
        </aside>
      </div>
    </template>

    <div v-else class="hv-empty-state">
      <el-icon :size="48" color="var(--el-text-color-placeholder)"><House /></el-icon>
      <p>房源数据加载失败，请关闭后重试</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
  // ======================== 全局 ========================
  .hv {
    display: flex;
    flex-direction: column;
    height: 100%;
    font-size: 13px;
    color: var(--el-text-color-primary);
    background: var(--el-bg-color-page);
    overflow: hidden;
  }

  .hv-loading {
    flex: 1;
    overflow: hidden;
  }

  // ======================== 三栏布局 ========================
  .hv-layout {
    display: grid;
    grid-template-columns: 240px 1fr 280px;
    height: 100%;
    overflow: hidden;
  }

  // ======================== 左侧面板 ========================
  .hv-aside {
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
    overflow-y: auto;

    &__gallery {
      position: relative;
      height: 160px;
      flex-shrink: 0;
      background: var(--el-fill-color);
    }

    &__img {
      width: 100%;
      height: 100%;
      display: block;
      :deep(img) {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    &__img-empty {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: var(--el-text-color-placeholder);
      font-size: 12px;
    }

    &__img-count {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(0, 0, 0, 0.45);
      color: #fff;
      border-radius: 10px;
      padding: 2px 8px;
      font-size: 11px;
      display: flex;
      align-items: center;
      gap: 3px;
    }

    &__body {
      flex: 1;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    &__location {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 13px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    &__remark {
      background: var(--el-fill-color-lighter);
      border-radius: 6px;
      padding: 8px 10px;
    }

    &__remark-label {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
      display: block;
      margin-bottom: 4px;
    }

    &__remark-text {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      line-height: 1.6;
    }

    &__edit-btn {
      width: 100%;
      justify-content: center;
    }
  }

  // 属性网格
  .hv-kv-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    border: 1px solid var(--el-border-color-extra-light);
    border-radius: 8px;
    overflow: hidden;
  }

  .hv-kv {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 8px 10px;
    border-bottom: 1px solid var(--el-border-color-extra-light);
    border-right: 1px solid var(--el-border-color-extra-light);

    &:nth-child(2n) {
      border-right: none;
    }
    &:nth-last-child(-n + 2) {
      border-bottom: none;
    }

    &__label {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
      line-height: 1.3;
    }

    &__value {
      font-size: 12px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      line-height: 1.4;
    }
  }

  .hv-divider {
    height: 1px;
    background: var(--el-border-color-extra-light);
    margin: -4px 0;
  }

  // 负责人
  .hv-salesman {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;

    &__avatar {
      width: 36px;
      height: 36px;
      min-width: 36px;
      border-radius: 50%;
      background: var(--el-color-primary-light-7);
      color: var(--el-color-primary);
      font-size: 16px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &__info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    &__name {
      font-size: 13px;
      font-weight: 600;
    }

    &__role {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
    }

    &__call {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--el-color-success-light-9);
      color: var(--el-color-success);
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      transition: background 0.15s;

      &:hover {
        background: var(--el-color-success-light-7);
      }
    }
  }

  // ======================== 中间主区域 ========================
  .hv-main {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--el-bg-color-page);
  }

  // ★ 合并式顶部条
  .hv-topbar {
    display: flex;
    align-items: center;
    background: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-lighter);
    flex-shrink: 0;
    min-height: 52px;
  }

  .hv-topbar__price {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 16px;
    flex-shrink: 0;
    border-right: 1px solid var(--el-border-color-extra-light);
    height: 100%;
    min-height: 52px;
  }

  .hv-topbar__badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 500;
    flex-shrink: 0;

    &.is-leased {
      background: #f0faf0;
      color: #67c23a;
    }
    &.is-available {
      background: #fff5f5;
      color: #f56c6c;
    }
    &.is-booked {
      background: #fdf6ec;
      color: #e6a23c;
    }
  }

  .hv-topbar__badge-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }

  .hv-topbar__amount {
    font-size: 22px;
    font-weight: 700;
    color: var(--el-color-success);
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .hv-topbar__unit {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    flex-shrink: 0;
  }

  .hv-topbar__sep {
    color: var(--el-border-color);
    font-size: 12px;
  }

  .hv-topbar__floor-label {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
    flex-shrink: 0;
  }

  .hv-topbar__floor-val {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    font-weight: 500;
    flex-shrink: 0;
  }

  .hv-topbar__edit {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid var(--el-border-color-lighter);
    background: transparent;
    color: var(--el-text-color-placeholder);
    font-size: 11px;
    cursor: pointer;
    transition: all 0.15s;
    flex-shrink: 0;

    &:hover {
      color: var(--el-color-primary);
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }
  }

  .hv-topbar__rooms {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 6px 12px 6px 14px;
    gap: 5px;
    overflow: hidden;
    min-height: 52px;
  }

  .hv-topbar__stats {
    display: flex;
    gap: 10px;
    font-size: 11px;
    color: var(--el-text-color-placeholder);

    span {
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }
  }

  .hv-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;
  }

  .hv-topbar__room-list {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 1px;

    &::-webkit-scrollbar {
      height: 3px;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--el-border-color);
      border-radius: 2px;
    }
  }

  // 房间小卡片（精简版）
  .hv-rcard {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 4px 10px 3px;
    border-radius: 6px;
    cursor: pointer;
    border: 1.5px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
    transition: all 0.15s;
    min-width: 48px;
    flex-shrink: 0;
    position: relative;

    &:hover {
      border-color: var(--el-color-primary-light-5);
      background: var(--el-color-primary-light-9);
    }

    &.is-active {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }

    &--add {
      border-style: dashed;
      color: var(--el-text-color-placeholder);
      font-size: 11px;
      flex-direction: row;
      gap: 2px;
      padding: 4px 8px;

      &:hover {
        color: var(--el-color-primary);
        border-color: var(--el-color-primary);
      }
    }

    &__dot {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 5px;
      height: 5px;
      border-radius: 50%;
    }

    &__num {
      font-size: 13px;
      font-weight: 700;
      line-height: 1;
    }

    &__st {
      font-size: 10px;
      line-height: 1;

      &.st-leased {
        color: #67c23a;
      }
      &.st-available {
        color: #f56c6c;
      }
      &.st-booked {
        color: #e6a23c;
      }
      &.st-locked {
        color: #909399;
      }
    }
  }

  // 详情 Tab
  .hv-detail {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--el-bg-color);
  }

  .hv-tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    padding: 0 20px;
    flex-shrink: 0;
    background: var(--el-bg-color);
  }

  .hv-tab {
    padding: 12px 16px;
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
    background: none;
    border: none;
    cursor: pointer;
    position: relative;
    transition: color 0.15s;

    &.active {
      color: var(--el-color-primary);

      &::after {
        content: "";
        position: absolute;
        bottom: -1px;
        left: 16px;
        right: 16px;
        height: 2px;
        background: var(--el-color-primary);
        border-radius: 1px;
      }
    }

    &:hover:not(.active) {
      color: var(--el-text-color-primary);
    }
  }

  .hv-tab-body {
    flex: 1;
    overflow-y: auto;
    padding: 4px 20px 20px;
  }

  // 内容区 Section
  .hv-section {
    padding: 16px 0;
    border-bottom: 1px solid var(--el-border-color-extra-light);

    &:last-child {
      border-bottom: none;
    }

    &__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }

    &__title {
      font-size: 13px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  // 统计行
  .hv-stat-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .hv-stat {
    padding: 12px 14px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;

    &__label {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
    }

    &__value {
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: baseline;
      gap: 3px;

      em {
        font-size: 12px;
        font-weight: 400;
        font-style: normal;
        color: var(--el-text-color-secondary);
      }

      &--primary {
        color: var(--el-color-primary);
      }
    }

    &__mask {
      letter-spacing: 3px;
      color: var(--el-text-color-placeholder);
    }
  }

  // 提示条
  .hv-alert {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    margin: 12px 0;
    border-radius: 8px;
    background: var(--el-color-warning-light-9);
    border: 1px solid var(--el-color-warning-light-5);
    font-size: 13px;

    &__tag {
      flex-shrink: 0;
      padding: 2px 8px;
      background: var(--el-color-warning);
      color: #fff;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    &__items {
      display: flex;
      gap: 12px;
      flex: 1;
      flex-wrap: wrap;
      color: var(--el-text-color-regular);

      strong {
        color: var(--el-text-color-primary);
      }
    }

    &__sep {
      color: var(--el-border-color);
    }

    &__help {
      color: var(--el-text-color-placeholder);
      cursor: pointer;
      flex-shrink: 0;
    }
  }

  // 费用列表
  .hv-fee-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .hv-fee-item {
    display: grid;
    grid-template-columns: 1fr 100px 80px;
    align-items: center;
    padding: 10px 14px;
    background: var(--el-fill-color-lighter);
    border-radius: 6px;
    font-size: 13px;

    &__name {
      font-weight: 500;
    }
    &__amount {
      color: var(--el-color-primary);
      font-weight: 600;
    }
    &__method {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
      text-align: right;
    }
  }

  // 方案表格
  .hv-table {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    overflow: hidden;
    font-size: 13px;

    &__head,
    &__row {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr 1fr 0.6fr;
    }

    &__head {
      background: var(--el-fill-color-lighter);
      font-weight: 500;
      color: var(--el-text-color-secondary);
      font-size: 12px;

      span {
        padding: 10px 14px;
      }
    }

    &__row {
      border-top: 1px solid var(--el-border-color-extra-light);
      transition: background 0.1s;

      span {
        padding: 10px 14px;
      }

      &:hover {
        background: var(--el-fill-color-light);
      }
    }

    &__price {
      color: var(--el-color-primary);
      font-weight: 600;
    }
  }

  // 房间信息网格
  .hv-info-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0;
    border: 1px solid var(--el-border-color-extra-light);
    border-radius: 8px;
    overflow: hidden;
  }

  .hv-info-item {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 12px 14px;
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

  // 空状态
  .hv-empty {
    padding: 16px 0;
    text-align: center;
    font-size: 13px;
    color: var(--el-text-color-placeholder);
  }

  // ======================== 右侧面板 ========================
  .hv-panel {
    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
    overflow: hidden;
  }

  .hv-panel-sec {
    border-bottom: 1px solid var(--el-border-color-extra-light);

    &__head {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px 8px;
    }

    &__icon {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &--tenant {
        background: #f0faf0;
        color: #67c23a;
      }
      &--booking {
        background: #fdf6ec;
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
    }

    &__body {
      padding: 4px 16px 14px;
    }

    &--note {
      flex: 1;
    }
  }

  // 租客卡片
  .hv-tenant-card {
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
      width: 40px;
      height: 40px;
      min-width: 40px;
      border-radius: 50%;
      background: var(--el-color-primary-light-7);
      color: var(--el-color-primary);
      font-size: 18px;
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
      overflow: hidden;
    }

    &__name {
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
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
      gap: 6px;

      strong {
        color: var(--el-color-success);
        font-size: 15px;
        font-weight: 700;
      }
    }

    &__lease {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
      display: flex;
      align-items: center;
      gap: 3px;
      white-space: nowrap;
      overflow: hidden;
    }

    &__lease-date {
      white-space: nowrap;
    }

    &__duration {
      color: var(--el-color-primary);
      font-weight: 500;
      background: var(--el-color-primary-light-9);
      padding: 1px 6px;
      border-radius: 8px;
      font-size: 11px;
      white-space: nowrap;
    }

    &__arrow {
      color: var(--el-text-color-placeholder);
      flex-shrink: 0;
    }
  }

  // 预定卡片
  .hv-booking-card {
    padding: 10px;
    border-radius: 8px;
    background: var(--el-fill-color-lighter);
    cursor: pointer;
    transition: background 0.15s;
    display: flex;
    flex-direction: column;
    gap: 7px;

    &:hover {
      background: var(--el-fill-color);
    }

    &__row {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
    }

    &__label {
      color: var(--el-text-color-placeholder);
      font-size: 11px;
      min-width: 48px;
    }

    &__val {
      color: var(--el-text-color-primary);
      font-weight: 500;
    }
  }

  .hv-panel-remark {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    line-height: 1.7;
    margin: 0;
    padding: 4px 0;
  }

  .hv-remark-input {
    :deep(.el-textarea__inner) {
      font-size: 13px;
      line-height: 1.7;
    }
  }

  .hv-panel-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 18px 0;
    gap: 6px;
    color: var(--el-text-color-placeholder);
    font-size: 12px;

    &--sm {
      padding: 6px 0;
      flex-direction: row;
      justify-content: flex-start;
    }

    &__link {
      color: var(--el-color-primary);
      cursor: pointer;
      &:hover {
        text-decoration: underline;
      }
    }
  }
  @media (width <= 1280px) {
    .hv-layout {
      grid-template-columns: 220px 1fr 260px;
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

  // 加载失败兜底状态
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
</style>
