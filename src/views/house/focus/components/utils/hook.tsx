import FocusCreateForm from "../FocusCreateForm.vue";
import { addDialog, closeAllDialog } from "@/components/ReDialog/index";
import { deviceDetection } from "@pureadmin/utils";
import { h, reactive, ref } from "vue";
import type { FocusFormItemProps, RoomStatusProps } from "@/views/house/focus/components/utils/types";

export function useFocusEdit() {
  const form = reactive({
    name: "",
    code: "",
    status: ""
  });

  const formRef = ref();

  function openFocusEditDialog(title = "新增", row?: FocusFormItemProps) {
    addDialog({
      title: `${title}项目`,
      props: {
        formInline: {
          id: row?.id ?? null,
          businessMode: row?.businessMode ?? 1,
          houseCode: row?.houseCode ?? "",
          houseName: row?.houseName ?? "",
          region: row?.region ?? [],
          address: row?.address ?? "",
          building: row?.building ?? "",
          unit: row?.unit ?? "",
          doorNumber: row?.doorNumber ?? "",
          // 总楼层
          floorTotal: row?.floorTotal ?? 2,
          // 每个楼层的房间数量
          roomCountPerFloor: row?.roomCountPerFloor ?? 10,
          // 关闭楼层楼层
          closedFloors: row?.closedFloors ?? null,
          // 关闭的房间
          closedRooms: row?.closedRooms ?? null,
          // 所有楼层的房间状态
          roomsStatusOfFloors: row?.roomsStatusOfFloors ?? new Map<number, Map<string, RoomStatusProps>>(),
          // 所有房间
          roomList: row?.roomList ?? null,
          // 选择的楼层
          selectedFloor: row?.selectedFloor ?? 1,
          // 选择的房间数量
          selectedRooms: null,
          // 房间前缀
          roomPrefix: row?.roomPrefix ?? "A",
          // 去掉4
          excludeFour: row?.excludeFour ?? false,
          // 房间编号长度
          roomNumberLength: row?.roomNumberLength ?? 3,
          deptId: row?.deptId ?? 0,
          salesmanId: row?.salesmanId ?? 0,
          // 第三步填写
          storePhone: row?.storePhone ?? "",
          water: row?.water ?? "commercial",
          electricity: row?.electricity ?? "commercial",
          heating: row?.heating ?? "central",
          hasGas: row?.hasGas ?? true,
          hasElevator: row?.hasElevator ?? true,
          facilities: row?.facilities ?? [],
          houseDesc: row?.houseDesc ?? "",
          businessDesc: row?.businessDesc ?? "",
          tags: row?.tags ?? [],
          remark: row?.remark ?? "",
          imageList: row?.imageList ?? [],
          houseLayoutList: row?.houseLayoutList ?? [
            {
              id: "tmp1",
              layoutName: "精装一房",
              bedroom: 1,
              livingRoom: 1,
              kitchen: 1,
              bathroom: 1
            },
            {
              id: "tmp2",
              layoutName: "精装二房",
              bedroom: 2,
              livingRoom: 1,
              kitchen: 1,
              bathroom: 1
            }
          ]
        }
      },
      top: "1%",
      width: "85%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      footerRenderer: () => null,
      contentRenderer: () =>
        h(FocusCreateForm, {
          ref: formRef,
          formInline: null,
          // 传递关闭弹窗的回调函数
          onCreateSuccess: () => {
            debugger;
            // 传入 dialog 实例以正确关闭
            closeAllDialog();
          }
        })
    });
  }

  // 格式化房间编号
  const formatRoomNumber = (roomPrefix: string, roomNumberLength: number, selectedFloor: number, num: string) => {
    const tmp = Math.min(2, num.toString().length);

    const prefix = roomNumberLength - tmp;
    return (roomPrefix ? roomPrefix : "") + String(selectedFloor).padEnd(prefix, "0") + num.padStart(tmp, "0");
  };

  return {
    form,
    formRef,
    openFocusEditDialog,
    formatRoomNumber
  };
}
