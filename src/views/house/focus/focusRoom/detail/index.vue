<template>
  <div class="room-detail-page pf-page">
    <el-page-header class="room-detail-page__head" @back="goBack">
      <template #content>
        <div class="room-detail-page__meta">
          <div class="room-detail-page__title-row">
            <div class="room-detail-page__title">{{ pageTitle }}</div>
            <el-tag v-if="currentRoom" effect="plain" :type="roomStatus.cls === 'leased' ? 'success' : roomStatus.cls === 'booked' ? 'warning' : 'danger'">{{ roomStatus.text }}</el-tag>
            <el-tag v-if="currentRoom?.roomNumber" effect="plain">{{ currentRoom.roomNumber }}</el-tag>
          </div>
          <div class="room-detail-page__desc">
            <span>{{ detail?.community?.name || detail?.houseName || "-" }}</span>
            <span>{{ currentRoom?.price ?? "-" }} 元/月</span>
            <span>{{ currentRoom?.area ?? detail?.area ?? "-" }} m²</span>
            <span>{{ detail?.community?.address || detail?.houseName || "-" }}</span>
          </div>
        </div>
      </template>
      <template #extra>
        <el-button plain @click="fetchDetail">刷新</el-button>
      </template>
    </el-page-header>

    <section class="room-detail-page__body">
      <HouseDetailContent
        :loading="loading"
        :detail="detail"
        :initial-room-id="initialRoomId"
        mode="page"
        @booking="handleBooking"
        @tenant="handleTenant"
        @checkout="handleCheckout"
        @edit-house="handleEditHouse"
        @open-tenant-detail="handleOpenTenantDetail"
        @open-booking-detail="handleOpenBookingDetail"
        @renew-lease="handleRenewLease"
        @reload="fetchDetail"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import { getRoomDetail } from "@/api/house/room";
  import { getFocusById } from "@/api/house/focus";
  import { message } from "@/utils/message";
  import HouseDetailContent from "@/views/house/components/HouseView/HouseDetailContent.vue";
  import { buildHouseDetailFromRoom } from "@/views/house/components/HouseView/houseDetailAdapter";
  import { useFocusEdit } from "@/views/house/components/FocusCreate/utils/hook";
  import { useEntireEdit } from "@/views/house/components/EntireCreate/hook";
  import { useShareEdit } from "@/views/house/components/ShareCreate/hook";
  import { useCheckoutDialog } from "@/views/contract/checkout/form/checkoutCreateForm/useCheckoutDialog";
  import useBooking from "@/views/contract/booking/utils/hook";
  import useTenant from "@/views/contract/tenant/utils/hook";
  import type { BookingListVo, HouseDetailVo, LeaseLiteVo, RoomDetailVo } from "@/types";
  import { LeaseModeEnumMeta, RentalTypeEnumMeta, TenantTypeEnumMeta } from "@/types";
  import { getRoomStatus } from "@/utils/house";

  defineOptions({ name: "FocusRoomDetail" });

  const route = useRoute();
  const router = useRouter();
  const { openFocusEditDialog } = useFocusEdit();
  const { openEntireEditDialog } = useEntireEdit();
  const { openShareEditDialog } = useShareEdit();
  const { openLeaseCheckoutDialog } = useCheckoutDialog();
  const { openBookingDialog, handleViewBooking } = useBooking();
  const { openTenantDialog, openTenantViewDialog, openTenantRenewDialog } = useTenant();

  const loading = ref(false);
  const detail = ref<HouseDetailVo | null>(null);
  const routeRoomId = computed(() => route.params.roomId as string);
  const initialRoomId = computed(() => routeRoomId.value);
  const currentRoom = computed(() => detail.value?.roomList?.find(room => String(room.id ?? "") === initialRoomId.value) ?? detail.value?.roomList?.[0] ?? null);
  const roomStatus = computed(() => (currentRoom.value ? getRoomStatus(currentRoom.value) : { text: "-", cls: "available", color: "" }));
  const pageTitle = computed(() => currentRoom.value?.roomNumber || detail.value?.houseName || "房间详情");

  async function fetchDetail() {
    if (!routeRoomId.value) {
      message("房间ID缺失，无法加载详情", { type: "warning" });
      return;
    }

    loading.value = true;
    try {
      const roomResp = await getRoomDetail({ roomId: routeRoomId.value });
      if (roomResp.code !== 0 || !roomResp.data) {
        detail.value = null;
        message(roomResp.message || "获取房间详情失败", { type: "error" });
        return;
      }

      detail.value = buildHouseDetailFromRoom(roomResp.data);
    } catch {
      detail.value = null;
      message("获取房间详情失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  }

  function goBack() {
    if (window.history.state?.back) {
      router.back();
      return;
    }

    router.push("/house/focus/room");
  }

  function handleBooking(room: RoomDetailVo) {
    if (!room.id) return;
    openBookingDialog("添加", { roomIds: [room.id] }, () => {
      fetchDetail();
    });
  }

  function handleTenant(room: RoomDetailVo) {
    if (!room.id) return;
    openTenantDialog(
      "添加租客",
      {
        lease: {
          roomIds: [room.id],
          contractNature: 1,
          tenantType: TenantTypeEnumMeta.PERSONAL.code
        } as any,
        tenantPersonal: {} as any,
        tenantCompany: {} as any,
        tenantMateList: [],
        otherFees: []
      },
      () => {
        fetchDetail();
      }
    );
  }

  function handleCheckout(room: RoomDetailVo) {
    if (!room.lease) {
      message("当前房间没有在租租客", { type: "warning" });
      return;
    }
    openLeaseCheckoutDialog(room.lease, () => {
      fetchDetail();
    });
  }

  function handleRenewLease(lease: LeaseLiteVo) {
    if (!lease?.leaseId) {
      message("当前房间没有在租租客", { type: "warning" });
      return;
    }
    openTenantRenewDialog({ leaseId: lease.leaseId });
  }

  function handleOpenTenantDetail(leaseId: string) {
    if (!leaseId) return;
    openTenantViewDialog("查看", { leaseId });
  }

  function handleOpenBookingDetail(booking: BookingListVo) {
    handleViewBooking(booking);
  }

  function handleEditHouse(house: HouseDetailVo) {
    if (!house.id) {
      message("房源数据缺失", { type: "warning" });
      return;
    }

    if (house.leaseMode === LeaseModeEnumMeta.FOCUS.code) {
      if (!house.leaseModeId) {
        message("项目ID缺失，无法编辑", { type: "warning" });
        return;
      }
      getFocusById({ id: house.leaseModeId }).then(res => {
        openFocusEditDialog("更新", res.data, () => fetchDetail());
      });
      return;
    }

    if (house.leaseMode !== LeaseModeEnumMeta.SCATTER.code) {
      message("未知房源类型，无法编辑", { type: "warning" });
      return;
    }

    if (house.rentalType === RentalTypeEnumMeta.SHARED.code) {
      openShareEditDialog(`修改${house.houseName || ""}`, house.id).then(fetchDetail);
      return;
    }

    if (house.rentalType === RentalTypeEnumMeta.ENTIRE.code) {
      openEntireEditDialog(`修改${house.houseName || ""}`, house.id).then(fetchDetail);
      return;
    }

    message("未知分散式房源类型，无法编辑", { type: "warning" });
  }

  onMounted(fetchDetail);
</script>

<style scoped lang="scss">
  .room-detail-page {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: calc(100vh - 108px);
    padding: 0;

    &__head {
      padding: 12px 14px;
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color-light);
      border-radius: 12px;
      box-shadow: var(--el-box-shadow-lighter);
    }

    :deep(.el-page-header__left) {
      display: flex;
      align-items: center;
      min-width: 0;
    }

    :deep(.el-page-header__content) {
      min-width: 0;
    }

    :deep(.el-page-header__extra) {
      margin-left: auto;
    }

    &__meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    &__title-row {
      display: flex;
      gap: 8px;
      align-items: center;
      min-width: 0;
    }

    &__title {
      overflow: hidden;
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__desc {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 14px;
      font-size: 13px;
      color: var(--el-text-color-secondary);

      span + span {
        position: relative;

        &::before {
          position: absolute;
          left: -8px;
          color: var(--el-border-color);
          content: "/";
        }
      }
    }

    &__body {
      flex: 1 1 auto;
      min-height: 0;
      overflow: visible;
      background: transparent;
    }

    :deep(.hv) {
      min-height: calc(100vh - 188px);
    }
  }
</style>
