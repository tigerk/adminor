// useFocusEdit.ts
import ShareCreateForm from "./ShareCreateForm.vue";
import { addDialog, closeAllDialog, closeDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { h, reactive, ref } from "vue";
import { createShareHouse } from "@/api/house/scatter";
import { message } from "@/utils/message";
import type { ShareFormItemProps } from "@/types";

export function useShareEdit() {
  const shareForm = reactive({
    name: "",
    community: null,
    code: "",
    status: ""
  });

  const shareFormRef = ref();

  function openShareEditDialog(title = "新增", row?: ShareFormItemProps) {
    addDialog({
      title: `${title}合租房源`,
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
              if (shareFormRef.value) {
                const isValid = await shareFormRef.value.validateForm();
                if (isValid) {
                  // 验证通过，执行保存逻辑
                  const formData = shareFormRef.value.shareForm;
                  const houseList = shareFormRef.value.houseList;

                  console.log("表单数据:", formData);
                  console.log("房源列表:", houseList);

                  // 调用API保存数据
                  await createShareHouse({ ...formData, houseList }).then(resp => {
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
        h(ShareCreateForm, {
          ref: shareFormRef,
          formInline: null,
          onCreateSuccess: () => {
            closeAllDialog();
          }
        })
    });
  }

  return {
    shareForm,
    shareFormRef,
    openShareEditDialog
  };
}
