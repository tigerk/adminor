import { h } from "vue";
import { addDialog } from "@/components/ReDialog";
import { getOwnerBillDetail } from "@/api/finance/owner";
import OwnerBillDetailDialog from "@/views/finance/owner-bill/view/OwnerBillDetailDialog.vue";
import type { OwnerBillIdDto } from "@/types/generated";
import { message } from "@/utils/message";

function useOwnerBillDialog() {
  async function openOwnerBillDetailDialog(billId?: string | number) {
    if (!billId) return;
    const resp = await getOwnerBillDetail({ billId } as OwnerBillIdDto);
    if (resp.code !== 0 || !resp.data) {
      message(resp.message || "获取业主账单详情失败", { type: "error" });
      return;
    }
    addDialog({
      title: "业主账单详情",
      props: {
        formInline: resp.data
      },
      width: "1100px",
      top: "2vh",
      lockScroll: true,
      alignCenter: true,
      draggable: true,
      fullscreenIcon: true,
      closeOnClickModal: false,
      hideFooter: true,
      contentRenderer: () => h(OwnerBillDetailDialog, { formInline: resp.data })
    });
  }

  return {
    openOwnerBillDetailDialog
  };
}

export default useOwnerBillDialog;
