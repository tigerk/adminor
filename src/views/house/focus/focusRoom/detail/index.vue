<template>
  <div class="room-detail-page pf-page">
    <section class="room-detail-page__body">
      <RoomDetailContent
        :loading="loading"
        :detail="detail"
        :initial-room-id="initialRoomId"
        mode="page"
        @back="goBack"
        @booking="handleBooking"
        @tenant="handleTenant"
        @checkout="handleCheckout"
        @edit-house="handleEditHouse"
        @open-tenant-detail="handleOpenTenantDetail"
        @open-booking-detail="handleOpenBookingDetail"
        @renew-lease="handleRenewLease"
        @reload="fetchDetail"
        @room-change="handleRoomChange"
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
  import RoomDetailContent from "@/views/house/components/RoomDetail/RoomDetailContent.vue";
  import { buildHouseDetailFromRoom } from "@/views/house/components/RoomDetail/roomDetailAdapter";
  import { useFocusEdit } from "@/views/house/components/FocusCreate/utils/hook";
  import { useEntireEdit } from "@/views/house/components/EntireCreate/hook";
  import { useShareEdit } from "@/views/house/components/ShareCreate/hook";
  import { useCheckoutDialog } from "@/views/contract/checkout/form/checkoutCreateForm/useCheckoutDialog";
  import useBooking from "@/views/contract/booking/utils/hook";
  import useTenant from "@/views/contract/tenant/utils/hook";
  import type { BookingListVo, HouseDetailVo, LeaseLiteVo, RoomDetailVo } from "@/types";
  import { LeaseModeEnumMeta, RentalTypeEnumMeta, TenantTypeEnumMeta } from "@/types";

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
  const selectedRoom = ref<RoomDetailVo | null>(null);
  const routeRoomId = computed(() => route.params.roomId as string);
  const initialRoomId = computed(() => routeRoomId.value);

  async function fetchDetail() {
    if (!routeRoomId.value) {
      message("房间ID缺失，无法加载详情", { type: "warning" });
      return;
    }
    const preferredRoomId = String(selectedRoom.value?.id ?? routeRoomId.value);

    loading.value = true;
    try {
      const roomResp = await getRoomDetail({ roomId: routeRoomId.value });
      if (roomResp.code !== 0 || !roomResp.data) {
        detail.value = null;
        message(roomResp.message || "获取房间详情失败", { type: "error" });
        return;
      }

      detail.value = buildHouseDetailFromRoom(roomResp.data);
      selectedRoom.value = detail.value?.roomList?.find(room => String(room.id ?? "") === preferredRoomId) ?? detail.value?.roomList?.[0] ?? null;
    } catch {
      detail.value = null;
      selectedRoom.value = null;
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

  function handleRoomChange(_roomId: string, room: RoomDetailVo | null) {
    selectedRoom.value = room;
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
    gap: 0;
    min-height: calc(100vh - 108px);
    padding: 0;

    &__body {
      flex: 1 1 auto;
      min-height: 0;
      overflow: visible;
      background: transparent;
    }

    :deep(.hv) {
      min-height: calc(100vh - 138px);
    }
  }
</style>
