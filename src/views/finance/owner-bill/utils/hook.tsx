import { h } from "vue";
import { addDialog } from "@/components/ReDialog";
import OwnerBillDetailDialog from "@/views/finance/owner-bill/view/OwnerBillDetailDialog.vue";

function useOwnerBillDialog() {
  async function openOwnerBillDetailDialog(billId?: string | number) {
    if (!billId) return;
    addDialog({
      title: "业主账单详情",
      props: {
        billId
      },
      width: "1100px",
      top: "2vh",
      lockScroll: true,
      alignCenter: true,
      draggable: true,
      fullscreenIcon: true,
      closeOnClickModal: false,
      hideFooter: true,
      contentRenderer: () => h(OwnerBillDetailDialog, { billId })
    });
  }

  return {
    openOwnerBillDetailDialog
  };
}

export default useOwnerBillDialog;
