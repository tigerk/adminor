import { h, ref } from "vue";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { createOwnerContract, getOwnerContractDetail, updateOwnerContract } from "@/api/contract/owner";
import OwnerContractFormDialog from "@/views/contract/owner/form/OwnerContractFormDialog.vue";
import OwnerContractDetailDialog from "@/views/contract/owner/view/OwnerContractDetailDialog.vue";
import type { OwnerContractIdDto, OwnerDetailVo, OwnerUpdateDto } from "@/types/generated";

function useOwnerContract() {
  const formRef = ref();

  function openOwnerDialog(
    title = "添加业主合同",
    row?: { contractId?: string | number; isEdit?: boolean } | OwnerDetailVo | null,
    onSuccess?: () => void
  ) {
    const isEdit = Boolean((row as { isEdit?: boolean } | undefined)?.isEdit);

    if ((row as { contractId?: string | number } | undefined)?.contractId && !("ownerContract" in (row || {}))) {
      getOwnerContractDetail({ contractId: (row as { contractId?: string | number }).contractId } as OwnerContractIdDto).then(resp => {
        if (resp.code === 0) {
          innerOpenOwnerDialog(title, (resp.data || null) as OwnerDetailVo | null, isEdit, onSuccess);
        } else {
          message(resp.message || "获取业主合同详情失败", { type: "error" });
        }
      });
      return;
    }

    innerOpenOwnerDialog(title, (row as OwnerDetailVo | null) || null, isEdit, onSuccess);
  }

  function innerOpenOwnerDialog(title = "添加业主合同", row?: OwnerDetailVo | null, isEdit = false, onSuccess?: () => void) {
    addDialog({
      title,
      props: {
        formInline: row,
        isEdit
      },
      top: "1vh",
      width: "1180px",
      lockScroll: true,
      alignCenter: true,
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      destroyOnClose: true,
      contentRenderer: () => h(OwnerContractFormDialog, { ref: formRef, formInline: null, isEdit: false }),
      beforeSure: async done => {
        const formInstance = formRef.value;
        try {
          const payload = await formInstance?.validateAndBuildPayload?.();
          if (!payload) {
            return;
          }

          const resp = isEdit ? await updateOwnerContract(payload as OwnerUpdateDto) : await createOwnerContract(payload);
          if (resp.code === 0) {
            message(isEdit ? "业主合同更新成功" : "业主合同创建成功", { type: "success" });
            onSuccess?.();
            done();
          } else {
            message(resp.message || (isEdit ? "业主合同更新失败" : "业主合同创建失败"), { type: "error" });
          }
        } catch (error: any) {
          if (error?.message) {
            message(error.message, { type: "warning" });
          }
        }
      }
    });
  }

  function openOwnerViewDialog(title = "业主合同详情", row?: { contractId?: string | number } | OwnerDetailVo | null) {
    if ((row as { contractId?: string | number } | undefined)?.contractId && !("ownerContract" in (row || {}))) {
      getOwnerContractDetail({ contractId: (row as { contractId?: string | number }).contractId } as OwnerContractIdDto).then(resp => {
        if (resp.code === 0) {
          innerOpenOwnerViewDialog(title, (resp.data || null) as OwnerDetailVo | null);
        } else {
          message(resp.message || "获取业主合同详情失败", { type: "error" });
        }
      });
      return;
    }
    innerOpenOwnerViewDialog(title, (row as OwnerDetailVo | null) || null);
  }

  function innerOpenOwnerViewDialog(title = "业主合同详情", row?: OwnerDetailVo | null) {
    addDialog({
      title,
      props: {
        formInline: row
      },
      top: "1vh",
      width: "1160px",
      lockScroll: true,
      alignCenter: true,
      draggable: true,
      fullscreen: false,
      fullscreenIcon: true,
      closeOnClickModal: false,
      destroyOnClose: true,
      hideFooter: true,
      contentRenderer: () => h(OwnerContractDetailDialog, { formInline: row })
    });
  }

  return {
    openOwnerDialog,
    openOwnerViewDialog
  };
}

export default useOwnerContract;
