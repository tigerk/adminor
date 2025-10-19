import HouseImageDialog from "./HouseImageDialog.vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { h, ref } from "vue";
import { message } from "@/utils/message";

export function useHouseImageEdit() {
  const imageFormRef = ref();

  function openHouseImageEditDialog(
    title = "新增",
    row?: any[],
    onConfirm?: (Image: any[]) => void // 添加回调函数参数
  ) {
    addDialog({
      title: `${title}房源照片`,
      props: {
        formInline: row ?? null
      },
      top: "5%",
      width: "865px",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(HouseImageDialog, { ref: imageFormRef, formInline: null }),
      beforeSure: (done, { options }) => {
        const selectedImage = imageFormRef.value.getImageList();

        console.log("selectedOptions is", selectedImage);

        // 调用回调函数，将结果传回父组件
        if (onConfirm) {
          onConfirm(selectedImage);
        }

        done(); // 关闭弹框

        message("保存成功", { type: "success" });
      }
    });
  }

  return {
    imageFormRef,
    openHouseImageEditDialog
  };
}
