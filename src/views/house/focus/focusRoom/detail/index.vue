<template>
  <div class="focus-room-detail-page pf-page">
    <el-page-header class="focus-room-detail-page__head" @back="goBack">
      <template #content>
        <div class="focus-room-detail-page__meta">
          <div class="focus-room-detail-page__title-row">
            <div class="focus-room-detail-page__title">{{ detail?.houseName || "房间详情" }}</div>
            <el-tag v-if="currentRoom?.roomNumber" effect="plain">{{ currentRoom.roomNumber }}</el-tag>
          </div>
          <div class="focus-room-detail-page__desc">查看房源、房间、租客、预定和跟进记录。</div>
        </div>
      </template>
      <template #extra>
        <el-button plain @click="fetchDetail">刷新</el-button>
      </template>
    </el-page-header>

    <section class="focus-room-detail-page__body">
      <HouseViewDialog
        :loading="loading"
        :detail="detail"
        :initial-room-id="initialRoomId"
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
  import { getHouseDetail } from "@/api/house/house";
  import { getFocusById } from "@/api/house/focus";
  import { message } from "@/utils/message";
  import HouseViewDialog from "@/views/house/components/HouseView/HouseViewDialog.vue";
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
  const houseId = computed(() => route.params.houseId as string);
  const initialRoomId = computed(() => (typeof route.query.roomId === "string" ? route.query.roomId : ""));
  const currentRoom = computed(() => detail.value?.roomList?.find(room => String(room.id ?? "") === initialRoomId.value) ?? detail.value?.roomList?.[0] ?? null);

  async function fetchDetail() {
    if (!houseId.value) {
      message("房源ID缺失，无法加载详情", { type: "warning" });
      return;
    }

    loading.value = true;
    try {
      const resp = await getHouseDetail({ id: houseId.value });
      if (resp.code === 0) {
        detail.value = resp.data ?? null;
      } else {
        detail.value = null;
        message(resp.message || "获取房源详情失败", { type: "error" });
      }
    } catch {
      detail.value = null;
      message("获取房源详情失败", { type: "error" });
    } finally {
      loading.value = false;
    }
  }

  function goBack() {
    const returnPath = typeof route.query.returnPath === "string" ? route.query.returnPath : "";
    if (returnPath) {
      router.push(returnPath);
      return;
    }

    const { roomId: _roomId, returnPath: _returnPath, ...listQuery } = route.query;
    router.push({
      path: "/house/focus/room",
      query: listQuery
    });
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
  .focus-room-detail-page {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: calc(100vh - 108px);
    padding: 0;

    &__head {
      padding: 10px 14px;
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color-light);
      border-radius: 10px;
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
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }

    &__body {
      flex: 1 1 auto;
      min-height: 0;
      overflow: hidden;
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color-light);
      border-radius: 10px;
    }

    :deep(.hv) {
      height: calc(100vh - 178px);
      min-height: 680px;
    }
  }
</style>
