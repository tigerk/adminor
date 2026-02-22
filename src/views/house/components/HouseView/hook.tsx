import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { h, reactive } from "vue";
import { message } from "@/utils/message";
import HouseViewDialog from "@/views/house/components/HouseView/HouseViewDialog.vue";
import CheckoutDialog from "@/views/contract/checkout/components/CheckoutDialog.vue";
import type { HouseViewDetailProps, RoomDetailProps, RoomListProps } from "@/types";
import useTenant from "@/views/contract/tenant/utils/hook";
import { getHouseDetail } from "@/api/house/house";

/** 弹窗内部使用的状态包装（loading + 数据） */
export interface HouseViewState {
  loading: boolean;
  detail: HouseViewDetailProps | null;
}

export const useHouseView = () => {
  const { openTenantDialog, openTenantViewDialog } = useTenant();

  // CheckoutDialog ref 由每次 openHouseViewDialog 内部持有，避免多弹窗冲突
  let checkoutDialogRef: any = null;

  /**
   * 以弹窗形式打开房源详情
   * @param room - 列表行数据，取 houseId 作为查询参数
   */
  function openHouseViewDialog(room: RoomListProps) {
    const state = reactive<HouseViewState>({
      loading: true,
      detail: null
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
            loading: state.loading,
            detail: state.detail,
            onBooking: (r: RoomDetailProps) => {
              console.log("添加预定", r);
            },
            onTenant: (r: RoomDetailProps) => {
              openTenantDialog("添加", {
                lease: {
                  roomIds: [r.id],
                  contractNature: 1
                } as any,
                tenantPersonal: {} as any,
                tenantCompany: {} as any,
                tenantMateList: [],
                otherFees: []
              });
            },
            onCheckout: (r: RoomDetailProps) => {
              handleOpenCheckout(r);
            },
            onViewContract: (r: RoomDetailProps) => {
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
            onRenewLease: (r: RoomDetailProps) => {
              handleRenewLease(r);
            },
            onAddRoom: () => {
              console.log("添加房间");
            },
            onReload: () => {
              loadDetail(state, room.houseId).catch(() => undefined);
            }
          }),
          // 退租弹窗挂在同一层
          h(CheckoutDialog, {
            ref: (el: any) => {
              checkoutDialogRef = el;
            },
            onSuccess: () => {
              loadDetail(state, room.houseId).catch(() => undefined);
              message("退租操作完成", { type: "success" });
            }
          })
        ])
    });

    loadDetail(state, room.houseId).catch(() => undefined);
  }

  /**
   * 退租 → CheckoutDialog.open(roomId, leaseId)
   */
  function handleOpenCheckout(room: RoomDetailProps) {
    if (!room.leaseInfo) {
      message("当前房间没有在租租客", { type: "warning" });
      return;
    }
    if (checkoutDialogRef?.open) {
      checkoutDialogRef.open(room.id, room.leaseInfo.leaseId || "");
    } else {
      message("退租组件未就绪，请稍后重试", { type: "warning" });
    }
  }

  /**
   * 续签 → openTenantDialog(contractNature=2)
   */
  function handleRenewLease(room: RoomDetailProps) {
    if (!room.leaseInfo) {
      message("当前房间没有在租租客", { type: "warning" });
      return;
    }
    openTenantDialog("续签", {
      lease: {
        roomIds: [room.id],
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
   * 统一通过 getHouseDetail 加载房源+房间数据
   * @param state   - reactive 状态包装，更新 loading 和 detail
   * @param houseId - 房源 ID
   */
  async function loadDetail(state: HouseViewState, houseId: string) {
    if (!houseId) {
      message("房源ID缺失，无法加载详情", { type: "warning" });
      state.loading = false;
      return;
    }
    state.loading = true;
    try {
      const res = await getHouseDetail({ id: houseId });
      state.detail = res.code === 0 ? (res.data ?? null) : null;
      if (res.code !== 0) {
        message(res.message || "获取房源详情失败", { type: "error" });
      }
    } catch {
      message("获取房源详情失败", { type: "error" });
      state.detail = null;
    } finally {
      state.loading = false;
    }
  }

  /**
   * 创建 reactive 状态（供 Tab 页复用）并触发加载
   */
  function createDetail(room: RoomListProps): HouseViewState {
    const state = reactive<HouseViewState>({ loading: true, detail: null });
    loadDetail(state, room.houseId).catch(() => undefined);
    return state;
  }

  return {
    openHouseViewDialog,
    loadDetail,
    createDetail
  };
};
