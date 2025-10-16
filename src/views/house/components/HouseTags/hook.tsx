import HouseTagsDialog from "./HouseTagsDialog.vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { defineEmits, h, ref } from "vue";
import { message } from "@/utils/message";
import type { TagsFormProps } from "@/views/house/components/HouseTags/types";

export function useHouseTagsEdit() {
  const tagsFormRef = ref();

  function openHouseTagsEditDialog(
    title = "新增",
    row?: any[],
    onConfirm?: (tags: any[]) => void // 添加回调函数参数
  ) {
    addDialog({
      title: `${title}房源特色`,
      props: {
        formInline: row ?? null
      },
      top: "10%",
      width: "800px",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(HouseTagsDialog, { ref: tagsFormRef, formInline: null }),
      beforeSure: (done, { options }) => {
        const selectedTags = tagsFormRef.value.getRef();

        console.log("selectedOptions is", selectedTags);

        // 调用回调函数，将结果传回父组件
        if (onConfirm) {
          onConfirm(selectedTags);
        }

        done(); // 关闭弹框

        message("保存成功", { type: "success" });
      }
    });
  }

  return {
    tagsFormRef,
    openHouseTagsEditDialog
  };
}
