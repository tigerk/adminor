import { h } from "vue";
import { deviceDetection } from "@pureadmin/utils";
import { addDialog } from "@/components/ReDialog";
import TrialApplicationDialog from "./TrialApplicationDialog.vue";

export function useTrialApplicationDialog() {
  function openTrialApplicationDialog() {
    addDialog({
      title: "", // 由组件内部自行渲染标题，不需要弹框标题栏
      width: "860px", // 宽度调大，左侧品牌栏 252px + 右侧表单区
      alignCenter: true,
      lockScroll: true,
      closeOnClickModal: false,
      draggable: false,
      destroyOnClose: true,
      hideFooter: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: false,
      contentRenderer: () => h(TrialApplicationDialog)
    });
  }

  return {
    openTrialApplicationDialog
  };
}
