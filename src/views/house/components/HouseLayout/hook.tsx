import HouseLayoutDialog from "./HouseLayoutDialog.vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { h, ref } from "vue";
import { message } from "@/utils/message";
import type { HouseLayoutDto } from "@/types";

export function useHouseLayoutEdit() {
  const layoutFormRef = ref();

  function openHouseLayoutEditDialog(
    title = "选择",
    row?: HouseLayoutDto,
    onConfirm?: (layout: HouseLayoutDto) => void // 添加回调函数参数
  ) {
    addDialog({
      title: `${title}户型`,
      props: {
        formInline: row ?? null
      },
      top: "10%",
      width: "600px",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(HouseLayoutDialog, { ref: layoutFormRef, formInline: row ?? null }),
      beforeSure: (done, { options }) => {
        const selectedLayout = layoutFormRef.value.getRef();

        if (selectedLayout === null) {
          message("请选择户型", { type: "warning" });
          return;
        }

        console.log("selectedLayout is", selectedLayout);

        // 调用回调函数，将结果传回父组件
        if (onConfirm) {
          onConfirm(selectedLayout);
        }

        done(); // 关闭弹框

        message("保存成功", { type: "success" });
      }
    });
  }

  return {
    layoutFormRef,
    openHouseLayoutEditDialog
  };
}
