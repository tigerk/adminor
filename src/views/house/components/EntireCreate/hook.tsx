// useFocusEdit.ts
import EntireCreateForm from "./EntireCreateForm.vue";
import { addDialog, closeAllDialog, closeDialog } from "@/components/ReDialog/index";
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
      footerRenderer: ({ options, index }) => (
        <div class="pt-4">
          <el-button plain onClick={() => closeDialog(options, index)}>
            取消
          </el-button>
          <el-button type="primary" onClick={() => closeDialog(options, index)}>
            保存并关闭
          </el-button>
        </div>
      ),
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
