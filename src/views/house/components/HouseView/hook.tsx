import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { h, reactive } from "vue";
import { message } from "@/utils/message";
import { getFocusById } from "@/api/house/focus";
import { getShareHouseById } from "@/api/house/scatter";
import HouseViewDialog from "@/views/house/components/HouseView/HouseViewDialog.vue";
import type { HouseViewDetailProps, RoomListProps } from "@/types";

export const useHouseView = () => {
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
      title: "房源详情",
      width: "90%",
      top: "2%",
      alignCenter: true,
      lockScroll: true,
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(HouseViewDialog, { detail })
    });

    loadDetail(detail).catch(() => undefined);
  }

  async function loadDetail(detail: HouseViewDetailProps) {
    detail.loading = true;
    try {
      if (detail.leaseMode === 1 && detail.room.leaseModeId) {
        const res = await getFocusById({ id: detail.room.leaseModeId });
        if (res.code === 0) {
          detail.focusDetail = res.data || null;
        } else {
          detail.focusDetail = null;
        }
      } else if (detail.room.houseId) {
        const res = await getShareHouseById({ id: detail.room.houseId });
        if (res.code === 0) {
          detail.scatterDetail = res.data || null;
        } else {
          detail.scatterDetail = null;
        }
      }
    } catch (error) {
      message("获取房源详情失败", { type: "error" });
    } finally {
      detail.loading = false;
    }
  }

  return {
    openHouseViewDialog
  };
};
