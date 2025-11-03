// useFocusEdit.ts
import EntireCreateForm from "./EntireCreateForm.vue";
import { addDialog, closeAllDialog, closeDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { h, reactive, ref } from "vue";
import type { EntireFormItemProps } from "@/views/house/components/EntireCreate/types";
import { createEntireHouse } from "@/api/house/scatter";
import { message } from "@/utils/message";

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
          community: null,
          water: "residential",
          electricity: "residential",
          heating: "central",
          hasGas: true,
          hasElevator: false
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
          <el-button
            type="primary"
            onClick={async () => {
              // 调用表单验证
              if (entireFormRef.value) {
                const isValid = await entireFormRef.value.validateForm();
                if (isValid) {
                  // 验证通过，执行保存逻辑
                  const formData = entireFormRef.value.entireForm;
                  const houseList = entireFormRef.value.houseList;

                  console.log("整租房源的表单数据:", formData);
                  console.log("整租房源的房源列表:", houseList);

                  // 调用API保存数据
                  await createEntireHouse({ ...formData, houseList }).then(resp => {
                    if (resp.code === 0) {
                      message("保存成功", { type: "success" });
                      closeDialog(options, index);
                    } else {
                      message(resp.message, { type: "error" });
                    }
                  });
                }
              }
            }}
          >
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
