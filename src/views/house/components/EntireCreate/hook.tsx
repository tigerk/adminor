// useFocusEdit.ts
import EntireCreateForm from "./EntireCreateForm.vue";
import { addDialog, closeAllDialog } from "@/components/ReDialog/index";
import { deviceDetection } from "@pureadmin/utils";
import { h, reactive, ref } from "vue";
import type { EntireFormItemProps } from "@/views/house/components/EntireCreate/types";

export function useEntireEdit() {
  const entireForm = reactive({
    name: "",
    community: null,
    code: "",
    status: ""
  });

  const entireFormRef = ref();

  function openEntireEditDialog(title = "新增", row?: EntireFormItemProps) {
    addDialog({
      title: `${title} 整租房源`,
      props: {
        formInline: {
          id: row?.id ?? null,
          businessMode: row?.businessMode ?? 1,
          focusCode: "",
          focusName: "",
          address: "string",
          community: null,
          water: "residential",
          electricity: "residential",
          heating: "central",
          hasGas: true,
          hasElevator: false,
          facilities: []
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
        h(EntireCreateForm, {
          ref: entireFormRef,
          formInline: null,
          onCreateSuccess: () => {
            closeAllDialog();
          }
        })
    });
  }

  return {
    entireForm,
    entireFormRef,
    openEntireEditDialog
  };
}
