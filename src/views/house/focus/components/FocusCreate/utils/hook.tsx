import FocusCreateForm from "../FocusCreateForm.vue";
import { addDialog, closeAllDialog } from "@/components/ReDialog/index";
import { deviceDetection } from "@pureadmin/utils";
import { h, reactive, ref } from "vue";
import type { FocusFormItemProps } from "@/views/house/focus/components/FocusCreate/utils/types";

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
          // 楼栋列表
          buildings: row?.buildings ?? [],
          // 所有房间
          houseList: row?.houseList ?? [],
          deptId: row?.deptId ?? 0,
          salesmanId: row?.salesmanId ?? null,
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
              id: "1",
              layoutName: "精装一房",
              bedroom: 1,
              livingRoom: 1,
              kitchen: 1,
              bathroom: 1,
              newly: true
            },
            {
              id: "1",
              layoutName: "精装二房",
              bedroom: 2,
              livingRoom: 1,
              kitchen: 1,
              bathroom: 1,
              newly: true
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
            // 传入 dialog 实例以正确关闭
            closeAllDialog();
          }
        })
    });
  }

  const formatHouseNumber = (housePrefix: string, houseNumberLength: number, selectedFloor: number, num: string) => {
    const tmp = Math.min(2, num.toString().length);
    const prefix = houseNumberLength - tmp;
    return (housePrefix ? housePrefix : "") + String(selectedFloor).padEnd(prefix, "0") + num.padStart(tmp, "0");
  };

  return {
    form,
    formRef,
    openFocusEditDialog,
    formatHouseNumber
  };
}
