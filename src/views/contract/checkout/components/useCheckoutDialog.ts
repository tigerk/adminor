import { h, ref } from "vue";
import { addDialog, closeAllDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { message } from "@/utils/message";
import { LEASE_STATUS_MAP } from "@/constants";
import type { LeaseListVo } from "@/types";
import CheckoutDialog from "@/views/contract/checkout/components/CheckoutDialog.vue";

/** 可退租的状态：待签字(1)、在租中(2) */
const NOT_CAN_CHECKOUT_STATUS: number[] = [LEASE_STATUS_MAP.TERMINATED.code, LEASE_STATUS_MAP.VOIDED.code];

/**
 * 退租弹框 hook
 * 独立于 useCheckout，不含任何 onMounted 副作用，可在任意组件中安全调用。
 */
export function useCheckoutDialog() {
  // CheckoutDialog 组件实例 ref，由 contentRenderer 注入
  const checkoutDialogRef = ref<InstanceType<typeof CheckoutDialog>>();

  /**
   * 打开退租弹框
   * @param row       租客列表行数据
   * @param onSuccess 退租成功后的回调（刷新列表等）
   */
  function openLeaseCheckoutDialog(row: LeaseListVo, onSuccess?: () => void) {
    if (NOT_CAN_CHECKOUT_STATUS.includes(row.status)) {
      message("租客已退租或已作废，不允许操作退租！", { type: "warning" });
      return;
    }

    addDialog({
      title: "租客退租",
      width: "1020px",
      alignCenter: true,
      lockScroll: true,
      closeOnClickModal: false,
      draggable: false,
      destroyOnClose: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      // 底部由 CheckoutDialog 内部的 .dialog-footer 自行处理
      hideFooter: true,
      contentRenderer: () =>
        h(CheckoutDialog, {
          ref: checkoutDialogRef,
          onSuccess: () => {
            closeAllDialog();
            if (onSuccess) {
              onSuccess();
              return;
            }
            window.location.reload();
          }
        }),
      // addDialog 渲染完成后触发，ref 已就绪，安全调用 open()
      open: async () => {
        await checkoutDialogRef.value?.open(row.leaseId);
      }
    });
  }

  return { openLeaseCheckoutDialog };
}
