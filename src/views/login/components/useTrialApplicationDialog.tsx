import { h } from "vue";
import { deviceDetection } from "@pureadmin/utils";
import { addDialog } from "@/components/ReDialog";
import TrialApplicationDialog from "./TrialApplicationDialog.vue";

export function useTrialApplicationDialog() {
  function openTrialApplicationDialog() {
    addDialog({
      title: "申请试用",
      width: "720px",
      alignCenter: true,
      lockScroll: true,
      closeOnClickModal: false,
      draggable: false,
      destroyOnClose: true,
      hideFooter: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      contentRenderer: () => h(TrialApplicationDialog)
    });
  }

  return {
    openTrialApplicationDialog
  };
}
