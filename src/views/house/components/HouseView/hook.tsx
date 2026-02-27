import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { h, reactive } from "vue";
import { message } from "@/utils/message";
import HouseViewDialog from "@/views/house/components/HouseView/HouseViewDialog.vue";
import CheckoutDialog from "@/views/contract/checkout/components/CheckoutDialog.vue";
import { type HouseDetailVo, type LeaseLiteVo, LeaseModeEnum, RentalTypeEnum, type RoomDetailVo, type RoomListVo } from "@/types";
import useTenant from "@/views/contract/tenant/utils/hook";
import { getHouseDetail } from "@/api/house/house";
import { useFocusHouse } from "@/views/house/focus/focusHouse/utils/hook";
import { useEntireEdit } from "@/views/house/components/EntireCreate/hook";
import { useShareEdit } from "@/views/house/components/ShareCreate/hook";

/** 弹窗内部使用的状态包装（loading + 数据） */
export interface HouseViewState {
  loading: boolean;
  detail: HouseDetailVo | null;
}

export const useHouseView = () => {
  const { openTenantDialog, openTenantViewDialog, openTenantRenewDialog } = useTenant();
  const { handleEditFocus } = useFocusHouse();
  const { openEntireEditDialog } = useEntireEdit();
  const { openShareEditDialog } = useShareEdit();

  // CheckoutDialog ref 由每次 openHouseViewDialog 内部持有，避免多弹窗冲突
  let checkoutDialogRef: any = null;

  /**
   * 以弹窗形式打开房源详情
   * @param room - 列表行数据，取 houseId 作为查询参数
   */
  function openHouseViewDialog(room: RoomListVo) {
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
            onBooking: (r: RoomDetailVo) => {
              console.log("添加预定", r);
            },
            onTenant: (r: RoomDetailVo) => {
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
            // 编辑房源
            onEditHouse: (d: HouseDetailVo) => {
              handleEditHouse(d);
            },
            onCheckout: (r: RoomDetailVo) => {
              handleOpenCheckout(r);
            },
            onViewContract: (r: RoomDetailVo) => {
              console.log("查看合同", r);
            },
            onOpenTenantDetail: (tenantName: string, leaseId: string) => {
              if (tenantName || leaseId) {
                openTenantViewDialog("查看", { tenantName: tenantName, leaseId });
              }
            },
            onOpenBookingDetail: (bookingId: string) => {
              console.log("打开预定详情", bookingId);
            },
            onRenewLease: (lease: LeaseLiteVo) => {
              handleRenewLease(lease);
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
  function handleOpenCheckout(room: RoomDetailVo) {
    if (!room.lease) {
      message("当前房间没有在租租客", { type: "warning" });
      return;
    }
    if (checkoutDialogRef?.open) {
      checkoutDialogRef.open(room.id, room.lease.leaseId || "");
    } else {
      message("退租组件未就绪，请稍后重试", { type: "warning" });
    }
  }

  /**
   * 续签 → openTenantDialog(contractNature=2)
   */
  function handleRenewLease(lease: LeaseLiteVo) {
    if (!lease) {
      message("当前房间没有在租租客", { type: "warning" });
      return;
    }

    openTenantRenewDialog({ leaseId: lease.leaseId || "" });
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
  function createDetail(room: RoomListVo): HouseViewState {
    const state = reactive<HouseViewState>({ loading: true, detail: null });
    loadDetail(state, room.houseId).catch(() => undefined);
    return state;
  }

  /**
   * 编辑房源：根据 leaseMode + rentalType 跳转到对应编辑页
   *   leaseMode=1  → 集中式项目编辑
   *   leaseMode=2, rentalType=1 → 分散式-整租 编辑
   *   leaseMode=2, rentalType=2 → 分散式-合租 编辑
   */
  /**
   * 编辑房源：根据 leaseMode + rentalType 跳转对应编辑页
   *   leaseMode=1               → 集中式项目编辑
   *   leaseMode=2, rentalType=1 → 分散式-整租编辑
   *   leaseMode=2, rentalType=2 → 分散式-合租编辑
   */
  function handleEditHouse(detail: HouseDetailVo) {
    const { leaseMode, rentalType, id, leaseModeId } = detail;
    if (!id) {
      return message("房源数据缺失", { type: "warning" });
    }

    if (leaseMode === LeaseModeEnum.FOCUS) {
      handleEditFocus(detail.leaseModeId);
    } else if (leaseMode === LeaseModeEnum.SCATTER) {
      if (rentalType === RentalTypeEnum.SHARED) {
        openShareEditDialog("修改" + detail.houseName, id).then(r => {
          const state = reactive<HouseViewState>({ loading: true, detail: null });
          loadDetail(state, id).catch(() => undefined);
        });
      } else if (rentalType === RentalTypeEnum.ENTIRE) {
        openEntireEditDialog("修改" + detail.houseName, id).then(r => {
          const state = reactive<HouseViewState>({ loading: true, detail: null });
          loadDetail(state, id).catch(() => undefined);
        });
      } else {
        message("未知分散式房源类型，无法编辑", { type: "warning" });
      }
    } else {
      message("未知房源类型，无法编辑", { type: "warning" });
    }
  }

  return {
    openHouseViewDialog,
    loadDetail,
    createDetail
  };
};
