// useFocusEdit.ts
import HouseFacilityDialog from "./HouseFacilityDialog.vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { defineEmits, h, ref } from "vue";
import { message } from "@/utils/message";
import type { FacilityItemDto } from "@/types";

export function useFacilityEdit() {
  const facilityFormRef = ref();

  const emit = defineEmits(["selected-facilities"]);

  function openFacilityEditDialog(
    title = "新增",
    row?: FacilityItemDto[],
    onConfirm?: (facilities: FacilityItemDto[]) => void // 添加回调函数参数
  ) {
    addDialog({
      title: `${title} 房源配置`,
      props: {
        formInline: row ?? null
      },
      top: "5%",
      width: "800px",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(HouseFacilityDialog, { ref: facilityFormRef, formInline: null }),
      beforeSure: (done, { options }) => {
        const selectedFacilities = facilityFormRef.value.getRef();

        const result: FacilityItemDto[] = Object.entries(selectedFacilities).map(([name, count]) => ({
          name,
          count: Number(count) // 将 count 转换为 number 类型
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
