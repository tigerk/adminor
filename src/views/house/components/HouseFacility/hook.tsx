// useFocusEdit.ts
import HouseFacilityDialog from "./HouseFacilityDialog.vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { h, ref } from "vue";
import { message } from "@/utils/message";
import type { FacilityItemDto } from "@/types";

export function useFacilityEdit() {
  const facilityFormRef = ref();

  function openFacilityEditDialog(
    title = "新增",
    row?: FacilityItemDto[],
    onConfirm?: (facilities: FacilityItemDto[]) => void // 添加回调函数参数
  ) {
    const formInline = row ?? [];
    addDialog({
      title: title ? `${title} 房源配置` : "房源配置",
      props: {
        formInline
      },
      top: "5%",
      width: "800px",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(HouseFacilityDialog, { ref: facilityFormRef, formInline }),
      beforeSure: (done, { options }) => {
        const selectedFacilities = facilityFormRef.value?.getRef?.() ?? {};

        const result: FacilityItemDto[] = Object.entries(selectedFacilities).map(([name, count]) => ({
          name,
          count: String(count)
        }));

        console.log("selectedOptions is", result);

        // 调用回调函数，将结果传回父组件
        if (onConfirm) {
          onConfirm(result);
        }

        done(); // 关闭弹框

        message("保存成功", { type: "success" });
      }
    });
  }

  return {
    facilityFormRef,
    openFacilityEditDialog
  };
}
