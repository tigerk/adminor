import { h } from "vue";
import { deviceDetection } from "@pureadmin/utils";
import { addDialog } from "@/components/ReDialog";
import TrialApplicationDialog from "./TrialApplicationDialog.vue";

export function useTrialApplicationDialog() {
  function openTrialApplicationDialog() {
    addDialog({
      title: "请完善信息，我们尽快与您联系",
      width: "460px",
      alignCenter: true,
      appendToBody: true,
      lockScroll: true,
      closeOnClickModal: false,
      draggable: true,
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
