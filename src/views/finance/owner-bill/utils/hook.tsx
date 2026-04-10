import { h } from "vue";
import { addDialog } from "@/components/ReDialog";
import OwnerSettlementBillDetailDialog from "@/views/finance/owner-bill/view/OwnerSettlementBillDetailDialog.vue";

function useOwnerBillDialog() {
  async function openOwnerBillDetailDialog(billId?: string | number) {
    if (!billId) return;
    addDialog({
      title: "业主结算单详情",
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
      contentRenderer: () => h(OwnerSettlementBillDetailDialog, { billId })
    });
  }

  return {
    openOwnerBillDetailDialog
  };
}

export default useOwnerBillDialog;
