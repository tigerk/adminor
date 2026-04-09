import { h, ref } from "vue";
import { addDialog } from "@/components/ReDialog";
import { createOwnerWithdraw, getOwnerWithdrawDetail } from "@/api/owner/owner";
import OwnerWithdrawCreateDialog from "@/views/finance/owner-withdraw/form/OwnerWithdrawCreateDialog.vue";
import OwnerWithdrawDetailDialog from "@/views/finance/owner-withdraw/view/OwnerWithdrawDetailDialog.vue";
import type { OwnerWithdrawApplyDetailVo, OwnerWithdrawApplyIdDto, OwnerWithdrawCreateDto, OwnerWithdrawOperateEnum } from "@/types/generated";
import { message } from "@/utils/message";

function useOwnerWithdrawDialog() {
  const createFormRef = ref();

  function openOwnerWithdrawCreateDialog(formInline?: OwnerWithdrawCreateDto | null, onSuccess?: () => void) {
    addDialog({
      title: "发起业主提现",
      props: {
        formInline: formInline || null
      },
      width: "560px",
      lockScroll: true,
      alignCenter: true,
      draggable: true,
      closeOnClickModal: false,
      destroyOnClose: true,
      contentRenderer: () => h(OwnerWithdrawCreateDialog, { ref: createFormRef, formInline: formInline || null }),
      beforeSure: async done => {
        const payload = await createFormRef.value?.validateAndBuildPayload?.();
        if (!payload) return;
        const resp = await createOwnerWithdraw(payload);
        if (resp.code === 0) {
          message("提现申请已提交", { type: "success" });
          onSuccess?.();
          done();
        } else {
          message(resp.message || "提现申请提交失败", { type: "error" });
        }
      }
    });
  }

  async function openOwnerWithdrawDetailDialog(
    applyId?: string | number,
    onOperate?: (row: Partial<OwnerWithdrawApplyDetailVo>, type: OwnerWithdrawOperateEnum | "CANCEL" | "APPROVE" | "REJECT" | "PAYING" | "SUCCESS" | "FAIL") => void
  ) {
    if (!applyId) return;
    const resp = await getOwnerWithdrawDetail({ applyId } as OwnerWithdrawApplyIdDto);
    if (resp.code !== 0 || !resp.data) {
      message(resp.message || "获取业主提现详情失败", { type: "error" });
      return;
    }
    addDialog({
      title: "业主提现详情",
      props: { formInline: resp.data },
      width: "1100px",
      top: "2vh",
      lockScroll: true,
      alignCenter: true,
      draggable: true,
      fullscreenIcon: true,
      closeOnClickModal: false,
      hideFooter: true,
      contentRenderer: () => h(OwnerWithdrawDetailDialog, { formInline: resp.data, onOperate })
    });
  }

  return {
    openOwnerWithdrawCreateDialog,
    openOwnerWithdrawDetailDialog
  };
}

export default useOwnerWithdrawDialog;
