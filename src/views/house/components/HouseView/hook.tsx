import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { h, reactive, ref } from "vue";
import { message } from "@/utils/message";
import { getFocusById } from "@/api/house/focus";
import { getShareHouseDetailById } from "@/api/house/scatter";
import HouseViewDialog from "@/views/house/components/HouseView/HouseViewDialog.vue";
import CheckoutDialog from "@/views/contract/checkout/components/CheckoutDialog.vue";
import type { HouseViewDetailProps, RoomListProps } from "@/types";
import useTenant from "@/views/contract/tenant/utils/hook";

export const useHouseView = () => {
  const { openTenantDialog, openTenantViewDialog } = useTenant();
  const checkoutDialogRef = ref();

  /**
   * 以弹窗形式打开房源详情
   */
  function openHouseViewDialog(room: RoomListProps) {
    const detail = reactive<HouseViewDetailProps>({
      loading: true,
      room,
      leaseMode: room.leaseMode,
      rentalType: room.rentalType,
      focusDetail: null,
      scatterDetail: null
    });

    addDialog({
      title: room.houseName || "房源详情",
      width: "75%",
      alignCenter: true,
      lockScroll: true,
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      hideFooter: true,
      contentRenderer: () =>
        h("div", { style: { height: "calc(90vh - 60px)" } }, [
          h(HouseViewDialog, {
            detail,
            onBooking: (r: RoomListProps) => {
              console.log("预约看房", r);
            },
            onTenant: (r: RoomListProps) => {
              openTenantDialog("添加", {
                lease: {
                  roomIds: [r.roomId],
                  contractNature: 1
                } as any,
                tenantPersonal: {} as any,
                tenantCompany: {} as any,
                tenantMateList: [],
                otherFees: []
              });
            },
            onCheckout: (r: RoomListProps) => {
              handleOpenCheckout(r);
            },
            onViewContract: (r: RoomListProps) => {
              console.log("查看合同", r);
            },
            onOpenTenantDetail: (tenantId: string, leaseId: string) => {
              if (tenantId || leaseId) {
                openTenantViewDialog("查看", { tenantName: tenantId, leaseId });
              }
            },
            onOpenBookingDetail: (bookingId: string) => {
              console.log("打开预定详情", bookingId);
            },
            onRenewLease: (r: RoomListProps) => {
              handleRenewLease(r);
            },
            onAddRoom: () => {
              console.log("添加房间");
            }
          }),
          // 退租弹窗挂在同一层
          h(CheckoutDialog, {
            ref: (el: any) => {
              checkoutDialogRef.value = el;
            },
            onSuccess: () => {
              loadDetail(detail).catch(() => undefined);
              message("退租操作完成", { type: "success" });
            }
          })
        ])
    });

    loadDetail(detail).catch(() => undefined);
  }

  /**
   * 退租 → CheckoutDialog.open(roomId, leaseId)
   */
  function handleOpenCheckout(room: RoomListProps) {
    if (!room.leaseInfo) {
      message("当前房间没有在租租客", { type: "warning" });
      return;
    }
    if (checkoutDialogRef.value?.open) {
      checkoutDialogRef.value.open(room.roomId, "");
    } else {
      message("退租组件未就绪，请稍后重试", { type: "warning" });
    }
  }

  /**
   * 续签 → openTenantDialog(contractNature=2)
   */
  function handleRenewLease(room: RoomListProps) {
    if (!room.leaseInfo) {
      message("当前房间没有在租租客", { type: "warning" });
      return;
    }
    openTenantDialog("续签", {
      lease: {
        roomIds: [room.roomId],
        contractNature: 2,
        rentPrice: room.price ? Number(room.price) : undefined
      } as any,
      tenantPersonal: {
        name: room.leaseInfo.tenantName || "",
        phone: room.leaseInfo.tenantPhone || ""
      } as any,
      tenantCompany: {} as any,
      tenantMateList: [],
      otherFees: [],
      isEdit: false
    });
  }

  /**
   * 加载详情
   * leaseMode=1 → 集中式 FocusFormItemProps
   * leaseMode=2 → 分散式 ScatterHouseDetailProps
   */
  async function loadDetail(detail: HouseViewDetailProps) {
    detail.loading = true;
    try {
      if (detail.leaseMode === 1 && detail.room.leaseModeId) {
        // GET /saas/focus/get?id=xxx → FocusCreateDTO → FocusFormItemProps
        const res = await getFocusById({ id: detail.room.leaseModeId });
        detail.focusDetail = res.code === 0 ? res.data || null : null;
      } else if (detail.room.houseId) {
        // POST /saas/scatter/house/get → ScatterHouseVO → ScatterHouseDetailProps
        const res = await getShareHouseDetailById({ id: detail.room.houseId });
        detail.scatterDetail = res.code === 0 ? res.data || null : null;
      }
    } catch {
      message("获取房源详情失败", { type: "error" });
    } finally {
      detail.loading = false;
    }
  }

  /**
   * 创建 reactive detail（供 Tab 页复用）
   */
  function createDetail(room: RoomListProps): HouseViewDetailProps {
    return reactive<HouseViewDetailProps>({
      loading: true,
      room,
      leaseMode: room.leaseMode,
      rentalType: room.rentalType,
      focusDetail: null,
      scatterDetail: null
    });
  }

  return {
    openHouseViewDialog,
    loadDetail,
    createDetail
  };
};
