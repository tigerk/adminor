<script setup lang="ts">
  import { computed, ref, watch } from "vue";
  import type { BookingListProps, HouseViewDetailProps, RoomDetailProps, RoomListProps } from "@/types";
  import { ROOM_STATUS_ENUM } from "@/constants";
  import { Calendar, Edit, Plus, QuestionFilled, User, View } from "@element-plus/icons-vue";
  import { usePriceConfigEdit } from "@/views/house/components/PriceConfig/hook";
  import { saveRoomPriceConfig } from "@/api/house/room";
  import { message } from "@/utils/message";
  import { getDecorationLabel, getDirectionLabel, getRentalTypeLabel } from "@/utils/house";
  import { formatDate } from "@/utils/date";

  const props = defineProps<{
    detail: HouseViewDetailProps;
  }>();

  const emit = defineEmits<{
    booking: [room: RoomListProps];
    tenant: [room: RoomListProps];
    checkout: [room: RoomListProps];
    viewContract: [room: RoomListProps];
    openTenantDetail: [tenantId: string, leaseId: string];
    openBookingDetail: [bookingId: string];
    renewLease: [room: RoomListProps];
    addRoom: [];
  }>();

  // ======================== 辅助函数 ========================
  const calcLeaseDuration = (start?: string, end?: string) => {
    if (!start || !end) return "";
    const s = new Date(start);
    const e = new Date(end);
    const m = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
    if (m >= 12) {
      const y = Math.floor(m / 12);
      const r = m % 12;
      return r > 0 ? `(${y}年${r}月)` : `(${y}年)`;
    }
    return m > 0 ? `(${m}月)` : "";
  };

  // ======================== 数据源 ========================
  const baseRoom = computed(() => props.detail.room);
  /** leaseMode: 1=集中式 focus, 2=分散式 scatter */
  const isFocus = computed(() => props.detail.leaseMode === 1);
  const isScatter = computed(() => props.detail.leaseMode === 2);
  const focusDetail = computed(() => props.detail.focusDetail); // FocusFormItemProps | null
  const scatterDetail = computed(() => props.detail.scatterDetail); // ScatterHouseDetailProps | null
  const isShareRental = computed(() => props.detail.rentalType === 2);

  // ======================== 房间 Tab 切换 ========================
  /**
   * 分散式合租: scatterDetail.roomList → RoomDetailProps[] (带 priceConfig)
   * 集中式 / 分散式整租: 只有 baseRoom 一个
   */
  const roomTabs = computed<RoomListProps[]>(() => {
    if (isScatter.value && isShareRental.value && scatterDetail.value?.roomList?.length) {
      // RoomDetailProps → RoomListProps 做映射（字段基本兼容）
      return scatterDetail.value.roomList as unknown as RoomListProps[];
    }
    return [baseRoom.value];
  });

  const activeRoomIndex = ref(0);
  watch(
    () => roomTabs.value,
    () => {
      activeRoomIndex.value = 0;
    },
    { immediate: true }
  );
  const currentRoom = computed(() => roomTabs.value[activeRoomIndex.value] || baseRoom.value);

  // ======================== 图片 ========================
  const allImages = computed(() => {
    const set = new Set<string>();
    // focus 图片
    focusDetail.value?.imageList?.forEach(i => i && set.add(typeof i === "string" ? i : ""));
    // scatter 公区图片
    scatterDetail.value?.houseLayout?.imageList?.forEach(i => i && set.add(i));
    // 当前房间图片
    currentRoom.value?.imageList?.forEach(i => i && set.add(i));
    set.delete("");
    return [...set];
  });

  // ======================== ① 顶部 hv-header 房源基础信息 ========================
  const headerMeta = computed(() => {
    const sv = scatterDetail.value; // ScatterHouseDetailProps
    const fv = focusDetail.value; // FocusFormItemProps
    const rm = currentRoom.value; // RoomListProps

    // 通用字段：优先取 scatter/focus 详情，fallback 到 RoomListProps
    return {
      // ---- 房型/朝向/装修 ----
      rentalType: getRentalTypeLabel(props.detail.rentalType),
      direction: getDirectionLabel(rm.direction || sv?.direction),
      decoration: isScatter.value ? getDecorationLabel(sv?.decorationType) : "-",
      // ---- 面积/楼层 ----
      area: rm.area || sv?.area || "-",
      floor: rm.floor || sv?.floor || "-",
      floorTotal: sv?.floorTotal || "-",
      // ---- 设施 ----
      hasElevator: (sv?.hasElevator ?? fv?.hasElevator) ? "有" : "无",
      hasGas: (sv?.hasGas ?? fv?.hasGas) ? "有" : "无",
      water: sv?.water ?? fv?.water ?? "-",
      electricity: sv?.electricity ?? fv?.electricity ?? "-",
      heating: sv?.heating ?? fv?.heating ?? "-",
      // ---- 费用 ----
      propertyFee: sv?.propertyFee ?? rm.propertyFee ?? "-",
      heatingFee: sv?.heatingFee ?? "-",
      mgmtFee: sv?.mgmtFee ?? "-",
      // ---- 小区/门店 ----
      communityName: sv?.community?.name ?? fv?.community?.name ?? rm.communityName ?? "-",
      communityAddress: sv?.community?.address ?? fv?.community?.address ?? fv?.address ?? "-",
      // ---- 集中式特有 ----
      focusName: fv?.focusName ?? "-",
      focusCode: fv?.focusCode ?? "-",
      storePhone: fv?.storePhone ?? "-",
      // ---- 分散式特有 ----
      houseCode: sv?.houseCode ?? rm.houseCode ?? "-",
      houseName: sv?.houseName ?? rm.houseName ?? "-",
      building: sv?.building ?? rm.building ?? "-",
      doorNumber: sv?.doorNumber ?? rm.doorNumber ?? "-",
      // ---- 负责人/部门 ----
      salesmanName: rm.salesmanName ?? "-",
      salesmanPhone: rm.salesmanPhone ?? "-",
      deptName: rm.deptName ?? "-",
      // ---- 时间 ----
      remark: sv?.remark ?? fv?.remark ?? "-",
      houseDesc: sv?.houseDesc ?? fv?.houseDesc ?? "-"
    };
  });

  // ======================== 房间状态 ========================
  const roomStatusInfo = computed(() => {
    const r = currentRoom.value;
    return {
      status: r.roomStatus,
      statusName: r.roomStatusName || "-",
      statusColor: r.roomStatusColor || "",
      isLeased: r.roomStatus === ROOM_STATUS_ENUM.LEASED.code,
      isAvailable: r.roomStatus === ROOM_STATUS_ENUM.AVAILABLE.code,
      isBooked: r.roomStatus === ROOM_STATUS_ENUM.BOOKED.code
    };
  });

  const getRoomTabStatus = (room: RoomListProps) => {
    const map: Record<number, { text: string; cls: string }> = {
      [ROOM_STATUS_ENUM.LEASED.code]: { text: "已租", cls: "st-leased" },
      [ROOM_STATUS_ENUM.AVAILABLE.code]: { text: "空置", cls: "st-available" },
      [ROOM_STATUS_ENUM.BOOKED.code]: { text: "已预定", cls: "st-booked" },
      [ROOM_STATUS_ENUM.LOCKED.code]: { text: "锁房", cls: "st-locked" }
    };
    return map[room.roomStatus!] || { text: room.roomStatusName || "-", cls: "" };
  };

  // ======================== 租客 ========================
  const tenantInfo = computed(() => {
    const li = currentRoom.value.leaseInfo;
    if (!li?.tenantName) return null;
    return {
      name: li.tenantName,
      phone: li.tenantPhone || "-",
      rentPrice: currentRoom.value.price || "-",
      leaseStart: formatDate(li.leaseStartDate),
      leaseEnd: formatDate(li.leaseEndDate),
      duration: calcLeaseDuration(li.leaseStartDate, li.leaseEndDate)
    };
  });

  // ======================== 预定 ========================
  const bookingInfo = computed<BookingListProps | null>(() => {
    if (!roomStatusInfo.value.isBooked || !currentRoom.value.leaseInfo) return null;
    const li = currentRoom.value.leaseInfo;
    return {
      id: "",
      roomIds: [],
      roomList: [],
      tenantName: li.tenantName,
      tenantPhone: li.tenantPhone,
      bookingTime: li.leaseStartDate as any,
      expiryTime: li.leaseEndDate as any
    } as BookingListProps;
  });

  // ======================== Tab 控制 ========================
  const activeLeftTab = ref("detail");
  const activeDetailTab = ref("rent");
  const activeRightTab = ref("quick");

  // ======================== 租金配置 ========================
  const { openPriceConfigDialog } = usePriceConfigEdit();

  /**
   * 打开 PriceConfigDialog
   * 数据来源: 分散式 → RoomDetailProps.priceConfig；集中式 → 从 baseRoom 构造
   */
  const handleOpenPriceConfig = () => {
    const room = currentRoom.value;
    // 分散式合租房间自带 priceConfig
    const existConfig = (room as unknown as RoomDetailProps).priceConfig || {
      roomId: room.roomId || (room as any).id,
      price: room.price ? Number(room.price) : 0,
      floorPrice: 0,
      floorPriceMethod: 1,
      floorPriceInput: 0,
      otherFees: [],
      pricePlans: []
    };

    openPriceConfigDialog("配置", existConfig, async result => {
      try {
        const res = await saveRoomPriceConfig({ roomId: room.roomId || (room as any).id, ...result });
        if (res.code === 0) message("租金配置保存成功", { type: "success" });
        else message(res.message || "保存失败", { type: "error" });
      } catch {
        message("保存租金配置失败", { type: "error" });
      }
    });
  };

  // ======================== 退租 / 续签 ========================
  const handleCheckout = () => {
    if (!currentRoom.value.leaseInfo) return message("当前房间没有在租租客", { type: "warning" });
    emit("checkout", currentRoom.value);
  };
  const handleRenew = () => {
    if (!currentRoom.value.leaseInfo) return message("当前房间没有在租租客", { type: "warning" });
    emit("renewLease", currentRoom.value);
  };

  // ======================== 房间详情 ========================
  const roomDetail = computed(() => {
    const r = currentRoom.value;
    return {
      roomNumber: r.roomNumber || (r as any).roomNumber || "-",
      direction: getDirectionLabel(r.direction),
      buildingArea: "-",
      innerArea: r.area ? `${r.area}m²` : "-",
      floorInfo: `第${headerMeta.value.floor}层/共${headerMeta.value.floorTotal}层`,
      viewTime: "随时看房",
      genderReq: "-",
      maxOccupants: "-",
      firstAvailDate: r.availableDate || "-",
      vacancyStart: r.vacancyStartTime || "-"
    };
  });

  const rentInfo = computed(() => ({
    totalRent: currentRoom.value.price || (currentRoom.value as any)?.priceConfig?.price || "0",
    deposit: "-",
    rentDiff: "-",
    postRentDiff: "-"
  }));
</script>

<template>
  <div class="hv">
    <el-skeleton v-if="detail.loading" animated :rows="10" />
    <template v-else>
      <!-- ========== ① 顶部：房源基本信息 ========== -->
      <div class="hv-header">
        <div class="hv-header__meta">
          <div class="hv-mi">
            <span class="hv-mi__v">{{ headerMeta.rentalType }}</span>
            <span class="hv-mi__l">房型</span>
          </div>
          <div class="hv-mi">
            <span class="hv-mi__v">{{ headerMeta.direction }}/{{ headerMeta.decoration }}</span>
            <span class="hv-mi__l">朝向/装修</span>
          </div>
          <div class="hv-mi">
            <span class="hv-mi__v">{{ headerMeta.area }}m²</span>
            <span class="hv-mi__l">面积</span>
          </div>
          <div class="hv-mi">
            <span class="hv-mi__v">{{ headerMeta.hasElevator }}</span>
            <span class="hv-mi__l">电梯</span>
          </div>
          <div class="hv-mi">
            <span class="hv-mi__v">{{ headerMeta.floor }}/{{ headerMeta.floorTotal }}层</span>
            <span class="hv-mi__l">楼层</span>
          </div>
          <div class="hv-mi">
            <span class="hv-mi__v">{{ headerMeta.water }}/{{ headerMeta.electricity }}</span>
            <span class="hv-mi__l">水/电</span>
          </div>
          <div class="hv-mi">
            <span class="hv-mi__v">{{ headerMeta.hasGas }}</span>
            <span class="hv-mi__l">燃气</span>
          </div>
          <div class="hv-mi">
            <span class="hv-mi__v">{{ headerMeta.propertyFee }}元/月</span>
            <span class="hv-mi__l">物业费</span>
          </div>
          <div v-if="isFocus" class="hv-mi">
            <span class="hv-mi__v">{{ headerMeta.focusName }}</span>
            <span class="hv-mi__l">门店</span>
          </div>
          <div v-if="isFocus" class="hv-mi">
            <span class="hv-mi__v">{{ headerMeta.storePhone }}</span>
            <span class="hv-mi__l">门店电话</span>
          </div>
          <div class="hv-mi">
            <span class="hv-mi__v">{{ headerMeta.communityName }}</span>
            <span class="hv-mi__l">小区</span>
          </div>
          <div class="hv-mi">
            <span class="hv-mi__v">{{ headerMeta.deptName }}</span>
            <span class="hv-mi__l">部门</span>
          </div>
          <div class="hv-mi">
            <span class="hv-mi__v">{{ headerMeta.salesmanName }}</span>
            <span class="hv-mi__l">负责人</span>
          </div>
          <div class="hv-mi">
            <span class="hv-mi__v">{{ headerMeta.salesmanPhone }}</span>
            <span class="hv-mi__l">联系电话</span>
          </div>
        </div>
      </div>

      <!-- ========== ② 房间 Tab 切换栏 ========== -->
      <div class="hv-rooms">
        <div class="hv-rooms__badge">
          <span class="hv-rooms__type">{{ isShareRental ? "整套(公区)" : "整套" }}</span>
          <span class="hv-rooms__count">已租{{ roomTabs.filter(r => r.roomStatus === ROOM_STATUS_ENUM.LEASED.code).length }}/共{{ roomTabs.length }}间</span>
        </div>

        <div class="hv-rooms__tabs">
          <div
            v-for="(room, idx) in roomTabs"
            :key="(room as any).roomId || (room as any).id || idx"
            class="hv-rooms__tab"
            :class="{ 'is-active': activeRoomIndex === idx }"
            @click="activeRoomIndex = idx"
          >
            <span class="hv-rooms__letter">{{ room.roomNumber || String.fromCharCode(65 + idx) }}</span>
            <span class="hv-rooms__status" :class="getRoomTabStatus(room).cls">{{ getRoomTabStatus(room).text }}</span>
          </div>
          <div v-if="isShareRental" class="hv-rooms__tab hv-rooms__tab--add" @click="emit('addRoom')">
            <el-icon><Plus /></el-icon>
            <span>添加</span>
          </div>
        </div>
        <div class="hv-rooms__actions">
          修改房源
        </div>
      </div>

      <!-- ========== ③ 主体 ========== -->
      <div class="hv-body">
        <div class="hv-left">
          <!-- 图片 + 状态 -->
          <div class="hv-overview">
            <div class="hv-overview__img">
              <el-image v-if="allImages.length" :src="allImages[0]" fit="cover" :preview-src-list="allImages" class="hv-overview__pic" />
              <div v-else class="hv-overview__empty">暂无图片</div>
            </div>
            <div class="hv-overview__info">
              <div class="hv-overview__row1">
                <el-tag v-if="roomStatusInfo.isLeased" type="success" effect="dark" size="small" round>已租</el-tag>
                <el-tag v-else-if="roomStatusInfo.isAvailable" type="danger" effect="dark" size="small" round>空置</el-tag>
                <el-tag v-else-if="roomStatusInfo.isBooked" type="warning" effect="dark" size="small" round>已预定</el-tag>
                <el-tag v-else effect="dark" size="small" round :color="roomStatusInfo.statusColor">{{ roomStatusInfo.statusName }}</el-tag>
                <span class="hv-overview__price">{{ rentInfo.totalRent }} 元/月</span>
                <div class="hv-overview__plan" @click="handleOpenPriceConfig">
                  <el-icon :size="12"><Edit /></el-icon>
                  <span>修改租金</span>
                </div>
              </div>
              <div class="hv-overview__meta">
                <span>底价：-</span>
                <span>佣金：-</span>
              </div>
            </div>
          </div>

          <!-- 内容区 -->
          <div class="hv-content">
            <template v-if="activeLeftTab === 'detail'">
              <div class="hv-subtabs">
                <span class="hv-subtab" :class="{ active: activeDetailTab === 'rent' }" @click="activeDetailTab = 'rent'">租金信息</span>
                <span class="hv-subtab" :class="{ active: activeDetailTab === 'room' }" @click="activeDetailTab = 'room'">房间信息</span>
              </div>

              <template v-if="activeDetailTab === 'rent'">
                <div class="hv-bar hv-bar--warn">
                  <span class="hv-bar__badge">房源租金差</span>
                  <span>总租金：{{ rentInfo.totalRent }}元</span>
                  <span>总押金：{{ rentInfo.deposit }}元</span>
                  <span>租差：{{ rentInfo.rentDiff }}元</span>
                  <span class="hv-bar__sep">|</span>
                  <span>租后预估差价：{{ rentInfo.postRentDiff }}元</span>
                  <el-icon class="hv-bar__help"><QuestionFilled /></el-icon>
                </div>
                <div class="hv-block">
                  <div class="hv-block__head">
                    <span class="hv-block__title">租金信息</span>
                    <el-button size="small" link type="primary" @click="handleOpenPriceConfig">
                      <el-icon><Edit /></el-icon>
                      编辑
                    </el-button>
                  </div>
                  <div class="hv-grid hv-grid--3">
                    <div class="hv-cell">
                      <span class="hv-cell__l">租金价格</span>
                      <span class="hv-cell__v hv-cell__v--primary">{{ rentInfo.totalRent }} 元/月</span>
                    </div>
                    <div class="hv-cell">
                      <span class="hv-cell__l">租金底价</span>
                      <span class="hv-cell__v">
                        **** 元/月
                        <el-button link size="small" type="primary">显示</el-button>
                      </span>
                    </div>
                    <div class="hv-cell">
                      <span class="hv-cell__l">佣金</span>
                      <span class="hv-cell__v">-</span>
                    </div>
                  </div>
                  <div class="hv-field">
                    <span class="hv-field__l">其他费用</span>
                    <span class="hv-field__v">-</span>
                  </div>
                  <div class="hv-field hv-field--link" @click="handleOpenPriceConfig">
                    <span class="hv-field__l">更多租金方案</span>
                    <el-button link size="small" type="primary">查看/编辑方案</el-button>
                  </div>
                </div>
              </template>

              <template v-if="activeDetailTab === 'room'">
                <div class="hv-block">
                  <div class="hv-block__head">
                    <span class="hv-block__title">房间信息</span>
                    <el-button size="small" link type="primary">
                      <el-icon><Edit /></el-icon>
                      编辑
                    </el-button>
                  </div>
                  <div class="hv-grid hv-grid--4">
                    <div class="hv-cell">
                      <span class="hv-cell__l">房间号</span>
                      <span class="hv-cell__v">{{ roomDetail.roomNumber }}</span>
                    </div>
                    <div class="hv-cell">
                      <span class="hv-cell__l">朝向</span>
                      <span class="hv-cell__v">{{ roomDetail.direction }}</span>
                    </div>
                    <div class="hv-cell">
                      <span class="hv-cell__l">建筑面积</span>
                      <span class="hv-cell__v">{{ roomDetail.buildingArea }}</span>
                    </div>
                    <div class="hv-cell">
                      <span class="hv-cell__l">套内面积</span>
                      <span class="hv-cell__v">{{ roomDetail.innerArea }}</span>
                    </div>
                  </div>
                  <div class="hv-grid hv-grid--4">
                    <div class="hv-cell">
                      <span class="hv-cell__l">楼层</span>
                      <span class="hv-cell__v">{{ roomDetail.floorInfo }}</span>
                    </div>
                    <div class="hv-cell">
                      <span class="hv-cell__l">看房时间</span>
                      <span class="hv-cell__v">{{ roomDetail.viewTime }}</span>
                    </div>
                    <div class="hv-cell">
                      <span class="hv-cell__l">性别要求</span>
                      <span class="hv-cell__v">{{ roomDetail.genderReq }}</span>
                    </div>
                    <div class="hv-cell">
                      <span class="hv-cell__l">最多入住</span>
                      <span class="hv-cell__v">{{ roomDetail.maxOccupants }}</span>
                    </div>
                  </div>
                  <div class="hv-grid hv-grid--4">
                    <div class="hv-cell">
                      <span class="hv-cell__l">首次可租日期</span>
                      <span class="hv-cell__v">{{ roomDetail.firstAvailDate }}</span>
                    </div>
                    <div class="hv-cell">
                      <span class="hv-cell__l">空置开始时间</span>
                      <span class="hv-cell__v">{{ roomDetail.vacancyStart }}</span>
                    </div>
                    <div class="hv-cell">
                      <span class="hv-cell__l">锁房期限</span>
                      <span class="hv-cell__v">-</span>
                    </div>
                    <div class="hv-cell">
                      <span class="hv-cell__l">锁房备注</span>
                      <span class="hv-cell__v">-</span>
                    </div>
                  </div>
                  <div class="hv-field">
                    <span class="hv-field__l">房间配置</span>
                    <el-button size="small" link type="primary">
                      <el-icon><View /></el-icon>
                      查看物资明细
                    </el-button>
                  </div>
                  <div class="hv-field">
                    <span class="hv-field__l">接待要求</span>
                    <span class="hv-field__v">-</span>
                  </div>
                </div>
              </template>
            </template>
            <template v-if="activeLeftTab === 'contract'"><el-empty description="暂无合约信息" /></template>
            <template v-if="activeLeftTab === 'finance'"><el-empty description="暂无财务账单" /></template>
            <template v-if="activeLeftTab === 'workorder'"><el-empty description="暂无工单信息" /></template>
          </div>
        </div>

        <!-- ========== 右侧 ========== -->
        <div class="hv-right">
          <div class="hv-right__tabs">
            <span class="hv-right__tab" :class="{ active: activeRightTab === 'quick' }" @click="activeRightTab = 'quick'">快捷入口</span>
          </div>

          <div v-if="activeRightTab === 'quick'" class="hv-right__body">
            <!-- 住户 -->
            <div class="hv-sec">
              <div class="hv-sec__head">
                <span class="hv-sec__icon hv-sec__icon--tenant">
                  <el-icon :size="13"><User /></el-icon>
                </span>
                <span class="hv-sec__title">租客信息</span>
                <div class="hv-sec__acts">
                  <el-button v-if="roomStatusInfo.isLeased" size="small" link type="danger" @click="handleCheckout">退租</el-button>
                  <el-button v-if="roomStatusInfo.isLeased" size="small" link type="primary" @click="handleRenew">续签</el-button>
                  <el-button v-if="!roomStatusInfo.isLeased" size="small" link type="primary" @click="emit('tenant', currentRoom)">添加租客</el-button>
                </div>
              </div>
              <div class="hv-sec__body">
                <template v-if="tenantInfo">
                  <div class="hv-person hv-person--click" @click="emit('openTenantDetail', currentRoom.leaseInfo?.tenantName || '', '')">
                    <div class="hv-person__detail">
                      <span class="hv-person__name">{{ tenantInfo.name }} / {{ tenantInfo.phone }}</span>
                      <span class="hv-person__meta">
                        月租金：
                        <em class="hv-price--tenant">{{ tenantInfo.rentPrice }}元/月</em>
                      </span>
                      <span class="hv-person__meta">
                        合同：{{ tenantInfo.leaseStart }} - {{ tenantInfo.leaseEnd }}
                        <em class="hv-dur">{{ tenantInfo.duration }}</em>
                      </span>
                    </div>
                  </div>
                </template>
                <span v-else class="hv-empty">暂无住户</span>
              </div>
            </div>
            <!-- 预定 -->
            <div class="hv-sec">
              <div class="hv-sec__head">
                <span class="hv-sec__icon hv-sec__icon--booking">
                  <el-icon :size="13"><Calendar /></el-icon>
                </span>
                <span class="hv-sec__title">预定</span>
                <div class="hv-sec__acts"><el-button size="small" link type="primary" @click="emit('booking', currentRoom)">添加预定</el-button></div>
              </div>
              <div class="hv-sec__body">
                <template v-if="bookingInfo">
                  <div class="hv-booking hv-person--click" @click="emit('openBookingDetail', bookingInfo.id || '')">
                    <span>预定人：{{ bookingInfo.tenantName || "-" }}</span>
                    <span>预定时间：{{ formatDate(bookingInfo.bookingTime) }}</span>
                    <span>到期时间：{{ formatDate(bookingInfo.expiryTime) }}</span>
                  </div>
                </template>
                <span v-else class="hv-empty">暂无预定</span>
              </div>
            </div>
            <!-- 备注 -->
            <div class="hv-sec">
              <div class="hv-sec__head">
                <span class="hv-sec__icon hv-sec__icon--note">
                  <el-icon :size="13"><Edit /></el-icon>
                </span>
                <span class="hv-sec__title">房间备注</span>
                <div class="hv-sec__acts"><el-button size="small" link type="primary">编辑</el-button></div>
              </div>
              <div class="hv-sec__body">
                <span class="hv-empty">{{ headerMeta.remark !== "-" ? headerMeta.remark : "暂无备注" }}</span>
              </div>
            </div>
          </div>

          <div v-else class="hv-right__body"><span class="hv-empty" style="padding: 20px">暂无房源记录</span></div>

          <div class="hv-right__footer">
            <span class="hv-right__flink active">跟进</span>
            <span class="hv-right__flink">提醒</span>
            <span class="hv-right__flink">备注</span>
            <span class="hv-right__fsep">|</span>
            <span class="hv-right__fhint">请输入跟进记录</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
  /* 全部使用 var(--el-xxx) → 浅色/深色自动适配 */
  .hv {
    display: flex;
    flex-direction: column;
    height: 100%;
    font-size: 13px;
    background: var(--el-bg-color-page);
    color: var(--el-text-color-primary);
  }

  /* ① 顶部 */
  .hv-header {
    padding: 12px 16px;
    background: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-lighter);
    &__meta {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
  }
  .hv-mi {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 5px 10px;
    min-width: 64px;
    background: var(--el-fill-color-lighter);
    border-radius: 6px;
    &__v {
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
    }
    &__l {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
    }
  }

  /* ② 房间栏 */
  .hv-rooms {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    background: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-lighter);
    flex-wrap: wrap;
    &__badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 6px 12px;
      font-size: 12px;
      background: var(--el-fill-color);
      border-radius: 6px;
      min-width: 72px;
    }
    &__count {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
      margin-top: 2px;
    }
    &__tabs {
      display: flex;
      gap: 8px;
      flex: 1;
      overflow-x: auto;
    }
    &__tab {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 6px 14px;
      border-radius: 6px;
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.2s;
      min-width: 52px;
      &:hover {
        background: var(--el-color-primary-light-9);
      }
      &.is-active {
        border-color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }
      &--add {
        border: 2px dashed var(--el-border-color);
        color: var(--el-text-color-placeholder);
        font-size: 12px;
        &:hover {
          border-color: var(--el-color-primary);
          color: var(--el-color-primary);
        }
      }
    }
    &__letter {
      font-size: 15px;
      font-weight: 600;
    }
    &__status {
      font-size: 11px;
      margin-top: 2px;
      &.st-leased {
        color: var(--el-color-success);
      }
      &.st-available {
        color: var(--el-color-danger);
      }
      &.st-booked {
        color: var(--el-color-warning);
      }
      &.st-locked {
        color: var(--el-text-color-placeholder);
      }
    }
    &__lease-brief {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      padding: 4px 10px;
      background: var(--el-fill-color-light);
      border-radius: 4px;
    }
    &__expire {
      color: var(--el-color-primary);
    }
    &__actions {
      display: flex;
      gap: 12px;
      margin-left: auto;
      :deep(.el-checkbox__label) {
        font-size: 12px;
      }
    }
  }

  /* ③ 主体 */
  .hv-body {
    display: grid;
    grid-template-columns: 1fr 310px;
    gap: 0;
    flex: 1;
    overflow: hidden;
  }
  .hv-left {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  .hv-overview {
    display: flex;
    gap: 16px;
    padding: 16px 16px;
    background: var(--el-bg-color);
    &__img {
      position: relative;
      width: 150px;
      min-width: 150px;
      height: 112px;
      border-radius: 8px;
      overflow: hidden;
      background: var(--el-fill-color);
    }
    &__pic {
      width: 100%;
      height: 100%;
      :deep(img) {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
    &__empty {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      color: var(--el-text-color-placeholder);
      font-size: 12px;
    }
    &__info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    &__row1 {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    &__price {
      font-size: 18px;
      font-weight: 700;
      color: var(--el-color-danger);
      margin-left: 8px;
    }
    &__plan {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--el-color-primary);
      font-size: 12px;
      cursor: pointer;
      &:hover {
        opacity: 0.8;
      }
    }
    &__meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: var(--el-text-color-placeholder);
    }
  }

  .hv-tags {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 8px 16px;
    background: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-extra-light);
    &__add {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
      cursor: pointer;
      &:hover {
        color: var(--el-color-primary);
      }
    }
  }

  .hv-ftabs {
    display: flex;
    align-items: center;
    padding: 0 16px;
    background: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-extra-light);
    :deep(.el-tabs) {
      flex: 1;
    }
    :deep(.el-tabs__header) {
      margin: 0;
    }
    :deep(.el-tabs__nav-wrap::after) {
      display: none;
    }
    :deep(.el-tabs__item) {
      font-size: 13px;
      height: 42px;
      line-height: 42px;
    }
    &__actions {
      display: flex;
      gap: 4px;
      align-items: center;
      .el-button {
        font-size: 12px;
      }
    }
  }

  .hv-content {
    flex: 1;
    padding: 0 16px 16px;
    background: var(--el-bg-color);
  }

  .hv-subtabs {
    display: flex;
    gap: 24px;
    padding: 12px 0;
    border-bottom: 1px solid var(--el-border-color-extra-light);
  }
  .hv-subtab {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    padding-bottom: 8px;
    position: relative;
    &.active {
      color: var(--el-text-color-primary);
      font-weight: 500;
      &::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--el-color-primary);
        border-radius: 1px;
      }
    }
    &:hover {
      color: var(--el-color-primary);
    }
  }

  .hv-bar {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 10px 14px;
    margin: 12px 0;
    border-radius: 6px;
    font-size: 12px;
    color: var(--el-text-color-regular);
    &--warn {
      background: var(--el-color-warning-light-9);
    }
    &__badge {
      padding: 2px 8px;
      color: #fff;
      background: var(--el-color-warning);
      border-radius: 4px;
      font-weight: 500;
    }
    &__sep {
      color: var(--el-border-color);
    }
    &__help {
      color: var(--el-text-color-placeholder);
      cursor: pointer;
    }
  }

  .hv-block {
    padding: 16px 0;
    &__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    &__title {
      font-size: 15px;
      font-weight: 600;
    }
  }

  .hv-grid {
    display: grid;
    gap: 0;
    &--3 {
      grid-template-columns: repeat(3, 1fr);
    }
    &--4 {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  .hv-cell {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 0;
    border-bottom: 1px solid var(--el-border-color-extra-light);
    &__l {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
    }
    &__v {
      font-size: 13px;
      &--primary {
        color: var(--el-color-primary);
        font-weight: 600;
      }
    }
  }
  .hv-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 0;
    border-bottom: 1px solid var(--el-border-color-extra-light);
    &__l {
      font-size: 14px;
      font-weight: 500;
    }
    &__v {
      font-size: 13px;
      color: var(--el-text-color-placeholder);
    }
    &--link {
      cursor: pointer;
      &:hover {
        color: var(--el-color-primary);
      }
    }
  }

  /* 右侧 */
  .hv-right {
    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
    overflow: hidden;
    &__tabs {
      display: flex;
      gap: 24px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--el-border-color-extra-light);
    }
    &__tab {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      cursor: pointer;
      padding-bottom: 4px;
      position: relative;
      &.active {
        color: var(--el-text-color-primary);
        font-weight: 600;
        &::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--el-color-primary);
          border-radius: 1px;
        }
      }
    }
    &__body {
      flex: 1;
      overflow-y: auto;
    }
    &__footer {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      border-top: 1px solid var(--el-border-color-extra-light);
      font-size: 13px;
    }
    &__flink {
      cursor: pointer;
      color: var(--el-text-color-secondary);
      &.active {
        color: var(--el-color-primary);
        font-weight: 500;
      }
      &:hover {
        color: var(--el-color-primary);
      }
    }
    &__fsep {
      color: var(--el-border-color);
    }
    &__fhint {
      flex: 1;
      color: var(--el-text-color-placeholder);
      font-size: 12px;
    }
  }

  .hv-sec {
    border-bottom: 1px solid var(--el-border-color-extra-light);
    &__head {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px 8px;
    }
    &__icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      &--tenant {
        background: var(--el-color-success-light-9);
        color: var(--el-color-success);
      }
      &--booking {
        background: var(--el-color-warning-light-9);
        color: var(--el-color-warning);
      }
      &--note {
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
      }
    }
    &__title {
      font-size: 14px;
      font-weight: 600;
    }
    &__acts {
      margin-left: auto;
      display: flex;
      gap: 4px;
      .el-button {
        font-size: 12px;
      }
    }
    &__body {
      padding: 4px 16px 12px;
      margin: 0 6px;
    }
  }

  .hv-person {
    display: flex;
    gap: 10px;
    padding: 8px 0;
    &--click {
      cursor: pointer;
      border-radius: 6px;
      padding: 8px;
      margin: -4px -8px;
      &:hover {
        background: var(--el-fill-color-light);
      }
    }
    &__avatar {
      width: 36px;
      height: 36px;
      min-width: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--el-fill-color);
      &--tenant {
        background: var(--el-color-success-light-9);
        color: var(--el-color-success);
      }
    }
    &__detail {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 12px;
    }
    &__name {
      font-size: 13px;
      font-weight: 500;
    }
    &__meta {
      color: var(--el-text-color-placeholder);
      display: flex;
      gap: 6px;
      align-items: center;
      flex-wrap: wrap;
    }
  }

  .hv-price--tenant {
    font-style: normal;
    font-weight: 600;
    color: var(--el-color-success);
  }
  .hv-dur {
    font-style: normal;
    font-size: 11px;
    color: var(--el-color-primary);
  }
  .hv-booking {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
  .hv-empty {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    padding: 4px 0;
    display: block;
  }

  @media (width <= 1200px) {
    .hv-body {
      grid-template-columns: 1fr;
    }
    .hv-right {
      display: none;
    }
  }
</style>
