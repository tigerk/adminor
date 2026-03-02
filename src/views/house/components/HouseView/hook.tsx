import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { h, reactive, ref } from "vue";
import { message } from "@/utils/message";
import HouseViewDialog from "@/views/house/components/HouseView/HouseViewDialog.vue";
import { type BookingListVo, type HouseDetailVo, type LeaseLiteVo, LeaseModeEnum, RentalTypeEnum, type RoomDetailVo, type RoomListVo } from "@/types";
import useTenant from "@/views/contract/tenant/utils/hook";
import { getHouseDetail } from "@/api/house/house";
import { useFocusHouse } from "@/views/house/focus/focusHouse/utils/hook";
import { useEntireEdit } from "@/views/house/components/EntireCreate/hook";
import { useShareEdit } from "@/views/house/components/ShareCreate/hook";
import { useCheckoutDialog } from "@/views/contract/checkout/components/useCheckoutDialog";
import useBooking from "@/views/contract/booking/utils/hook";
import { OCCUPANCY_STATUS_ENUM } from "@/constants";

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
  const { openLeaseCheckoutDialog } = useCheckoutDialog();
  const { openBookingDialog, handleViewBooking } = useBooking();

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
              openBookingDialog("添加", { roomIds: [room.roomId] }, () => {
                loadDetail(state, room?.houseId).catch(() => message("退租操作完成", { type: "success" }));
              });
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
            onEditHouse: (d: HouseDetailVo) => {
              handleEditHouse(d);
            },
            onCheckout: (r: RoomDetailVo) => {
              handleOpenCheckout(state, r);
            },
            onViewContract: (r: RoomDetailVo) => {
              console.log("查看合同", r);
            },
            onOpenTenantDetail: (leaseId: string) => {
              if (leaseId) {
                openTenantViewDialog("查看", { leaseId });
              }
            },
            onOpenBookingDetail: (booking: BookingListVo) => {
              handleViewBooking(booking);
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
          })
        ])
    });

    loadDetail(state, room.houseId).catch(() => undefined);
  }

  /**
   * 退租 → CheckoutDialog.open(roomId, leaseId)
   */
  function handleOpenCheckout(state: HouseViewState, room: RoomDetailVo) {
    if (!room.lease) {
      message("当前房间没有在租租客", { type: "warning" });
      return;
    }

    openLeaseCheckoutDialog(room.lease, () => {
      loadDetail(state, room?.houseId).catch(() => message("退租操作完成", { type: "success" }));
    });
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
   * 编辑房源：根据 leaseMode + rentalType 跳转对应编辑页
   *   leaseMode=1               → 集中式项目编辑
   *   leaseMode=2, rentalType=1 → 分散式-整租编辑
   *   leaseMode=2, rentalType=2 → 分散式-合租编辑
   */
  function handleEditHouse(detail: HouseDetailVo) {
    const { leaseMode, rentalType, id } = detail;
    if (!id) {
      return message("房源数据缺失", { type: "warning" });
    }

    if (leaseMode === LeaseModeEnum.FOCUS) {
      handleEditFocus(detail.leaseModeId);
    } else if (leaseMode === LeaseModeEnum.SCATTER) {
      if (rentalType === RentalTypeEnum.SHARED) {
        openShareEditDialog("修改" + detail.houseName, id).then(() => {
          // 编辑完成后的刷新逻辑由调用方通过 onReload 处理
        });
      } else if (rentalType === RentalTypeEnum.ENTIRE) {
        openEntireEditDialog("修改" + detail.houseName, id).then(() => {
          // 同上
        });
      } else {
        message("未知分散式房源类型，无法编辑", { type: "warning" });
      }
    } else {
      message("未知房源类型，无法编辑", { type: "warning" });
    }
  }

  return {
    openHouseViewDialog
  };
};
